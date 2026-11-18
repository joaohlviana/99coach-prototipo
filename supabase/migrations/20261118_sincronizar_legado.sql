-- Entrada do catálogo antigo no 99coach-v2.
-- A captação do Instagram ainda publica no banco antigo (kv_store_34f6ab76, chave user:v1:<id>).
-- O site www.99coach.com.br lê só este banco desde a migração legado-20261028-v1, então perfis publicados
-- depois de 28/10 não apareciam. Esta função recebe o mesmo JSON de user:v1 e aplica a mesma regra da migração:
-- perfil público e visível vira trainers(origin=importado, status=publicado); perfil que deixou de ser público
-- vira status=retirado. Só mexe em perfis deste lote (legado-sync-v1) ou ainda inexistentes: os 11.917 da
-- migração de 28/10 e qualquer perfil reivindicado ficam como estão.
-- Desfazer: delete from trainers where id in (select trainer_id from trainer_imports where batch_version='legado-sync-v1');

insert into public.import_batches (version, source, started_at, notes, counts)
values ('legado-sync-v1', 'legado:rdujusymvebxndykyvhu:kv_store_34f6ab76', now(),
        'cópia contínua dos perfis publicados no catálogo antigo depois de 28/10/2026', '{}'::jsonb)
on conflict (version) do nothing;

create or replace function public.sincronizar_legado(registros jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  r jsonb; tp jsonb; v_id uuid; v_slug text; v_name text; v_visivel boolean;
  v_sports text[]; v_labels text[]; v_raw text[]; v_unmapped text[];
  v_city text; v_uf text; v_country text; v_city_id bigint; v_city_label text;
  v_title text; v_spec text; v_pitch text; v_handle text; v_photo text;
  v_followers int; v_followers_at timestamptz; v_pub timestamptz; v_upd timestamptz;
  v_existe record; v_imp record; v_ini text;
  n_pub int := 0; n_ret int := 0; n_pulado int := 0; motivos jsonb := '{}'::jsonb; fotos jsonb := '[]'::jsonb; erros jsonb := '[]'::jsonb;
begin
  for r in select * from jsonb_array_elements(coalesce(registros, '[]'::jsonb)) loop
    begin
      tp := coalesce(r->'trainerProfile', '{}'::jsonb);
      v_id := (r->>'id')::uuid;
      v_slug := lower(trim(r->>'slug'));
      v_name := trim(coalesce(r->'base'->>'name', r->>'name', ''));
      v_upd := coalesce((r->>'updatedAt')::timestamptz, now());

      if v_slug is null or v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
        n_pulado := n_pulado + 1; motivos := motivos || jsonb_build_object('slug_invalido', coalesce((motivos->>'slug_invalido')::int, 0) + 1);
        erros := erros || jsonb_build_array(jsonb_build_object('id', r->>'id', 'erro', 'slug_invalido')); continue;
      end if;

      select t.id, t.origin, t.user_id, t.claimed_at into v_existe from public.trainers t where t.id = v_id;
      select ti.batch_version into v_imp from public.trainer_imports ti where ti.trainer_id = v_id;
      -- perfil já existente fora deste lote (migração de 28/10, cadastro próprio ou reivindicado): não mexe
      if v_existe.id is not null and (v_imp.batch_version is distinct from 'legado-sync-v1' or v_existe.user_id is not null or v_existe.claimed_at is not null) then
        n_pulado := n_pulado + 1; motivos := motivos || jsonb_build_object('fora_do_lote', coalesce((motivos->>'fora_do_lote')::int, 0) + 1); continue;
      end if;
      if exists (select 1 from public.trainers t where t.slug = v_slug and t.id <> v_id) then
        n_pulado := n_pulado + 1; motivos := motivos || jsonb_build_object('slug_em_uso', coalesce((motivos->>'slug_em_uso')::int, 0) + 1);
        erros := erros || jsonb_build_array(jsonb_build_object('id', r->>'id', 'erro', 'slug_em_uso')); continue;
      end if;

      v_visivel := coalesce((r->>'published')::boolean, false)
        and coalesce((r->>'marketplaceVisible')::boolean, (r->'metadata'->>'marketplaceVisible')::boolean, true)
        and coalesce(r->>'status', 'active') = 'active'
        and coalesce(r->'roles', '[]'::jsonb) ? 'trainer';

      -- modalidades pelo nome do cadastro de esportes (sem acento, sem caixa)
      select coalesce(array_agg(x), '{}') into v_raw
        from jsonb_array_elements_text(coalesce(nullif(tp->'sports', 'null'::jsonb), tp->'modalities', '[]'::jsonb)) x;
      select coalesce(array_agg(s.slug order by o.n), '{}'), coalesce(array_agg(s.name order by o.n), '{}')
        into v_sports, v_labels
        from unnest(v_raw) with ordinality o(lbl, n)
        join public.sports s on lower(extensions.unaccent(s.name)) = lower(extensions.unaccent(trim(o.lbl)));
      select coalesce(array_agg(x), '{}') into v_unmapped from unnest(v_raw) x
        where not exists (select 1 from public.sports s where lower(extensions.unaccent(s.name)) = lower(extensions.unaccent(trim(x))));

      if v_visivel and (char_length(v_name) < 3 or char_length(v_name) > 120) then
        v_visivel := false; motivos := motivos || jsonb_build_object('nome_fora_do_limite', coalesce((motivos->>'nome_fora_do_limite')::int, 0) + 1);
      end if;
      if v_visivel and cardinality(v_sports) = 0 then
        v_visivel := false; motivos := motivos || jsonb_build_object('sem_modalidade', coalesce((motivos->>'sem_modalidade')::int, 0) + 1);
      end if;

      if not v_visivel then
        if v_existe.id is not null then
          update public.trainers set status = 'retirado' where id = v_id and status = 'publicado';
          n_ret := n_ret + 1;
        else
          n_pulado := n_pulado + 1;
        end if;
        continue;
      end if;

      -- cidade só para o Brasil e só se existir no cadastro de cidades (igual à migração de 28/10)
      v_city := trim(coalesce(r->'base'->>'city', r->>'city', ''));
      v_uf := upper(trim(coalesce(r->'base'->>'state', r->>'state', '')));
      v_country := upper(coalesce(r->'base'->>'country', r->>'country', 'BR'));
      v_city_id := null; v_city_label := null;
      if v_country = 'BR' and v_city <> '' and v_uf ~ '^[A-Z]{2}$' then
        select c.id, c.name || ', ' || c.uf into v_city_id, v_city_label from public.cities c
         where c.uf = v_uf and c.name_norm = lower(extensions.unaccent(v_city)) limit 1;
      end if;

      v_spec := v_labels[1];
      v_title := nullif(trim(coalesce(tp->>'title', '')), '');
      v_title := coalesce(v_title, 'Treinador de ' || v_spec);
      v_pitch := v_title || coalesce(' em ' || v_city_label, '') || ' · ' || array_to_string(v_labels, ', ');
      v_handle := nullif(trim(coalesce(r->'base'->>'instagram', r->'metadata'->>'instagram', tp->'extra'->>'instagram', '')), '');
      v_handle := case when v_handle is null then null else '@' || ltrim(v_handle, '@') end;
      v_photo := nullif(coalesce(tp->>'profilePhoto', tp->>'photo', r->'base'->>'profilePhoto', ''), '');
      v_followers := nullif(coalesce(r->'instagramRaw'->>'followers', tp->'extra'->>'followers', ''), '')::int;
      v_followers_at := case when v_followers is null then null
                             else coalesce((r->'instagramRaw'->>'imported_at')::timestamptz, (r->>'createdAt')::timestamptz, now()) end;
      v_pub := coalesce((r->>'createdAt')::timestamptz, now());
      select string_agg(left(w, 1), '') into v_ini from (
        select w from regexp_split_to_table(v_name, '\s+') with ordinality t(w, n)
         where w <> '' order by n) q;
      v_ini := upper(left(v_ini, 1) || case when char_length(v_ini) > 1 then right(v_ini, 1) else '' end);

      insert into public.trainers as t (id, slug, name, specialty, role_line, pitch, bio, initials, city_id, formats,
                                        status, origin, external_handle, legacy_ref, published_at, ig_followers, ig_followers_captured_at)
      values (v_id, v_slug, v_name, v_spec, v_title, v_pitch, nullif(tp->>'bio', ''), v_ini, v_city_id, array['presencial'],
              'publicado', 'importado', v_handle, v_id::text, v_pub, v_followers, v_followers_at)
      on conflict (id) do update set
        slug = excluded.slug, name = excluded.name, specialty = excluded.specialty, role_line = excluded.role_line,
        pitch = excluded.pitch, bio = excluded.bio, initials = excluded.initials, city_id = excluded.city_id,
        status = 'publicado', external_handle = excluded.external_handle,
        ig_followers = coalesce(excluded.ig_followers, t.ig_followers),
        ig_followers_captured_at = case when excluded.ig_followers is null then t.ig_followers_captured_at else excluded.ig_followers_captured_at end;

      delete from public.trainer_sports where trainer_id = v_id and sport_slug <> all (v_sports);
      insert into public.trainer_sports (trainer_id, sport_slug) select v_id, x from unnest(v_sports) x on conflict do nothing;

      insert into public.trainer_imports as ti (trainer_id, batch_version, legacy_id, legacy_slug, legacy_updated_at, legacy_had_account,
                                                imported_at, location_raw, sports_raw, sports_unmapped, specialties, formats_source,
                                                bio_redacted, photo_source_url, photo_status, duplicate_handle_of)
      values (v_id, 'legado-sync-v1', v_id, v_slug, v_upd, false, now(),
              jsonb_build_object('city', nullif(v_city, ''), 'state', nullif(v_uf, ''), 'country', v_country,
                                 'display', coalesce(r->>'displayLocation', r->'base'->>'displayLocation')),
              v_raw, v_unmapped, coalesce(array(select jsonb_array_elements_text(coalesce(tp->'specialties', '[]'::jsonb))), '{}'),
              'padrao_presencial', false, v_photo, case when v_photo is null then 'sem_foto' else 'pendente' end, '{}')
      on conflict (trainer_id) do update set
        legacy_slug = excluded.legacy_slug, legacy_updated_at = excluded.legacy_updated_at, imported_at = now(),
        location_raw = excluded.location_raw, sports_raw = excluded.sports_raw, sports_unmapped = excluded.sports_unmapped,
        specialties = excluded.specialties,
        -- foto nova no legado: volta para pendente e a Edge copia de novo
        photo_status = case when excluded.photo_source_url is distinct from ti.photo_source_url
                            then excluded.photo_status else ti.photo_status end,
        photo_path = case when excluded.photo_source_url is distinct from ti.photo_source_url then null else ti.photo_path end,
        photo_error = case when excluded.photo_source_url is distinct from ti.photo_source_url then null else ti.photo_error end,
        photo_copied_at = case when excluded.photo_source_url is distinct from ti.photo_source_url then null else ti.photo_copied_at end,
        photo_source_url = excluded.photo_source_url;

      n_pub := n_pub + 1;
    exception when others then
      n_pulado := n_pulado + 1;
      motivos := motivos || jsonb_build_object('erro', coalesce((motivos->>'erro')::int, 0) + 1,
                                               'ultimo_erro', left(sqlerrm, 200));
      erros := erros || jsonb_build_array(jsonb_build_object('id', r->>'id', 'erro', left(sqlerrm, 200)));
    end;
  end loop;

  select coalesce(jsonb_agg(jsonb_build_object('id', ti.trainer_id, 'url', ti.photo_source_url)), '[]'::jsonb) into fotos
    from public.trainer_imports ti where ti.batch_version = 'legado-sync-v1' and ti.photo_status = 'pendente' and ti.photo_error is null;

  update public.import_batches set finished_at = now(),
    counts = jsonb_build_object('publicados_no_lote', (select count(*) from public.trainer_imports ti join public.trainers t on t.id = ti.trainer_id
                                                        where ti.batch_version = 'legado-sync-v1' and t.status = 'publicado'),
                                'ultima_chamada', jsonb_build_object('publicados', n_pub, 'retirados', n_ret, 'pulados', n_pulado, 'motivos', motivos, 'em', now()))
   where version = 'legado-sync-v1';

  return jsonb_build_object('publicados', n_pub, 'retirados', n_ret, 'pulados', n_pulado, 'motivos', motivos, 'erros', erros, 'fotos_pendentes', fotos);
end $$;

-- foto copiada pela Edge receber-legado
create or replace function public.legado_foto_copiada(p_id uuid, p_path text, p_ok boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_ok then
    update public.trainer_imports set photo_status = 'copiada', photo_path = p_path, photo_copied_at = now(), photo_error = null
     where trainer_id = p_id and batch_version = 'legado-sync-v1';
    update public.trainers set photo_url = 'https://rycaxboqkkiopjdecgld.supabase.co/storage/v1/object/public/trainer-photos/' || p_path
     where id = p_id;
  else
    update public.trainer_imports set photo_error = left(p_path, 200) where trainer_id = p_id and batch_version = 'legado-sync-v1';
  end if;
end $$;

revoke all on function public.sincronizar_legado(jsonb) from public, anon, authenticated;
revoke all on function public.legado_foto_copiada(uuid, text, boolean) from public, anon, authenticated;
grant execute on function public.sincronizar_legado(jsonb) to service_role;
grant execute on function public.legado_foto_copiada(uuid, text, boolean) to service_role;

-- Segredo compartilhado com o banco antigo: aqui fica só o hash (sha256 em hex); o valor fica no Vault do banco antigo.
-- Trocar: update private.legado_sync set token_sha256 = '<novo hash>'; e atualizar o Vault de lá.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table if not exists private.legado_sync (id int primary key default 1 check (id = 1), token_sha256 text not null);
revoke all on private.legado_sync from public, anon, authenticated;

create or replace function public.legado_token_ok(p_token text)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (select 1 from private.legado_sync s
                  where char_length(coalesce(p_token, '')) >= 32
                    and s.token_sha256 = encode(extensions.digest(p_token, 'sha256'), 'hex'));
$$;
revoke all on function public.legado_token_ok(text) from public, anon, authenticated;
grant execute on function public.legado_token_ok(text) to service_role;
