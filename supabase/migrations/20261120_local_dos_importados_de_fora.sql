-- Perfis importados de fora do Brasil ficavam sem local: a cópia do catálogo antigo (sincronizar_legado) guardava
-- cidade e país só em trainer_imports.location_raw e deixava trainers.country = 'BR' e trainers.locality vazio.
-- O site só lista presencial com local, então esses perfis não apareciam em nenhuma busca.
-- Agora, sempre que o local bruto de um importado chega ou muda, o perfil recebe país e "Cidade, País"
-- (o mesmo formato dos perfis de fora que já apareciam). Perfil do Brasil e perfil com cidade cadastrada não mudam.
create or replace function public.local_do_importado() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_pais text := upper(coalesce(new.location_raw->>'country', 'BR'));
  v_cid text := nullif(trim(coalesce(new.location_raw->>'city', '')), '');
  v_local text := left(coalesce(nullif(trim(coalesce(new.location_raw->>'display', '')), ''), v_cid), 120);
begin
  if v_pais ~ '^[A-Z]{2}$' and v_pais <> 'BR' and v_cid is not null then
    update public.trainers t set country = v_pais, locality = v_local
     where t.id = new.trainer_id and t.origin = 'importado' and t.city_id is null
       and (t.country is distinct from v_pais or t.locality is distinct from v_local);
  end if;
  return new;
end $$;
revoke all on function public.local_do_importado() from public, anon, authenticated;

drop trigger if exists trainer_imports_local on public.trainer_imports;
create trigger trainer_imports_local after insert or update of location_raw on public.trainer_imports
for each row execute function public.local_do_importado();

-- os que já estavam no banco
update public.trainers t
   set country = upper(i.location_raw->>'country'),
       locality = left(coalesce(nullif(trim(coalesce(i.location_raw->>'display', '')), ''), trim(i.location_raw->>'city')), 120)
  from public.trainer_imports i
 where i.trainer_id = t.id and t.origin = 'importado' and t.city_id is null and coalesce(t.locality, '') = ''
   and upper(coalesce(i.location_raw->>'country', 'BR')) ~ '^[A-Z]{2}$' and upper(coalesce(i.location_raw->>'country', 'BR')) <> 'BR'
   and nullif(trim(coalesce(i.location_raw->>'city', '')), '') is not null;

select public.recompute_trainer_rank();
