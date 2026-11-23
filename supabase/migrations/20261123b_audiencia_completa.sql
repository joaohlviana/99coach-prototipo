-- Audiência do treinador, versão completa: além de visitas, origem e procura na região, devolve dias e horários das
-- visitas, posição média nas listas, contatos por canal, oferta de treinadores por modalidade na cidade (para comparar
-- com a procura), formato procurado e o que falta no perfil para aparecer mais.
create or replace function public.my_audience(p_days integer default 28) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  d int := greatest(1, least(coalesce(p_days, 28), 365));
  v_ini timestamptz := now() - make_interval(days => d);
  v_ant timestamptz := now() - make_interval(days => 2 * d);
  v_id public.trainers.id%type; v_slug text; v_city_id public.trainers.city_id%type; v_cidade text; v_uf text; v_mods text[]; v_slugs text[];
  r jsonb; m jsonb; pf jsonb;
begin
  select t.id, t.slug, t.city_id,
         jsonb_build_object('status', t.status, 'foto', coalesce(t.photo_url, '') <> '', 'texto', length(coalesce(t.bio, '') || coalesce(t.pitch, '')) >= 80,
           'local', t.city_id is not null or coalesce(t.locality, '') <> '', 'cref', case when t.cref_verified_at is not null then 'verificado' when coalesce(t.cref, '') <> '' then 'informado' else '' end,
           'avaliacoes', coalesce(t.rating_count, 0), 'modalidades', (select count(*) from public.trainer_sports ts where ts.trainer_id = t.id),
           'pontos', (select k.score from public.trainer_rank k where k.trainer_id = t.id))
    into v_id, v_slug, v_city_id, pf from public.trainers t where t.id = (select public.my_trainer_id());
  if v_id is null then return jsonb_build_object('sem_perfil', true); end if;
  select c.name || ', ' || c.uf, c.uf into v_cidade, v_uf from public.cities c where c.id = v_city_id;
  select coalesce(array_agg(s.name order by s.sort), '{}'), coalesce(array_agg(ts.sport_slug), '{}') into v_mods, v_slugs
    from public.trainer_sports ts join public.sports s on s.slug = ts.sport_slug where ts.trainer_id = v_id;

  with ev as (
    select e.event_name n, e.occurred_at em, e.properties p from public.funnel_events e
     where e.properties->>'trainer_slug' = v_slug and e.occurred_at >= v_ant and e.properties ? 'h'),
  cur as (select * from ev where em >= v_ini), ant as (select * from ev where em < v_ini),
  vis as (select *, (em at time zone 'America/Sao_Paulo') loc from cur where n = 'trainer.profile_viewed.v1'),
  imp as (select * from cur where n = 'showcase.card_impressed.v1'),
  con as (select * from cur where n = 'contact.intent_started.v1')
  select jsonb_build_object(
    'dias', d, 'desde', v_ini,
    'medindo_desde', (select min(e.occurred_at) from public.funnel_events e where e.properties ? 'h'),
    'visitas', (select count(*) from vis),
    'visitas_antes', (select count(*) from ant where n = 'trainer.profile_viewed.v1'),
    'visitantes', (select count(distinct coalesce(p->>'sid', em::text)) from vis),
    'aparicoes', (select count(*) from imp),
    'aparicoes_antes', (select count(*) from ant where n = 'showcase.card_impressed.v1'),
    'posicao_media', (select round(avg((p->>'position')::numeric), 1) from imp where p->>'position' ~ '^\d{1,4}$'),
    'cliques', (select count(*) from cur where n = 'showcase.card_clicked.v1'),
    'contatos', (select count(*) from con),
    'contatos_antes', (select count(*) from ant where n = 'contact.intent_started.v1'),
    'contatos_canal', (select coalesce(jsonb_agg(jsonb_build_object('k', k, 'n', c) order by c desc, k), '[]'::jsonb) from (select coalesce(nullif(p->>'canal', ''), 'pedido') k, count(*) c from con group by 1) o),
    'por_dia', (select coalesce(jsonb_agg(jsonb_build_object('d', g.dia, 'v', (select count(*) from vis where vis.loc::date = g.dia)) order by g.dia), '[]'::jsonb)
                  from (select x::date dia from generate_series((v_ini at time zone 'America/Sao_Paulo')::date, (now() at time zone 'America/Sao_Paulo')::date, interval '1 day') x) g),
    'por_semana', (select coalesce(jsonb_agg(jsonb_build_object('k', g, 'n', (select count(*) from vis where extract(dow from vis.loc)::int = g)) order by g), '[]'::jsonb) from generate_series(0, 6) g),
    'por_hora', (select coalesce(jsonb_agg(jsonb_build_object('k', g, 'n', (select count(*) from vis where extract(hour from vis.loc)::int = g)) order by g), '[]'::jsonb) from generate_series(0, 23) g),
    'origem', (select coalesce(jsonb_agg(jsonb_build_object('k', k, 'n', c) order by c desc, k), '[]'::jsonb) from (select public._origem_da_visita(p) k, count(*) c from vis group by 1) o),
    'aparelho', (select coalesce(jsonb_agg(jsonb_build_object('k', k, 'n', c) order by c desc, k), '[]'::jsonb) from (select coalesce(nullif(p->>'dev', ''), 'não informado') k, count(*) c from vis group by 1) o),
    'veio_de', (select coalesce(jsonb_agg(jsonb_build_object('k', k, 'n', c) order by c desc, k), '[]'::jsonb) from (select p->>'de' k, count(*) c from vis where coalesce(p->>'de', '') <> '' group by 1 order by 2 desc limit 8) o),
    'recentes', (select coalesce(jsonb_agg(jsonb_build_object('em', v.em, 'origem', public._origem_da_visita(v.p), 'dev', coalesce(v.p->>'dev', ''), 'de', coalesce(v.p->>'de', ''),
                    'contato', exists (select 1 from con where con.p->>'sid' = v.p->>'sid' and v.p ? 'sid')) order by v.em desc), '[]'::jsonb)
                  from (select * from vis order by em desc limit 200) v)
  ) into r;

  with bus as (
    select e.properties->>'sport' esporte, e.properties->>'city' cid, e.properties->>'format' fmt from public.funnel_events e
     where e.event_name = 'catalog.search_performed.v1' and e.occurred_at >= v_ini and e.properties ? 'h'),
  nom as (select * from bus where coalesce(esporte, '') not in ('', 'Todos os esportes')),
  cid as (select * from nom where v_cidade is not null and cid = v_cidade),
  est as (select * from nom where v_uf is not null and (cid = 'UF:' || v_uf or cid like '%, ' || v_uf)),
  ofe as (select s.name esporte, count(distinct t.id) c from public.trainers t join public.trainer_sports ts on ts.trainer_id = t.id join public.sports s on s.slug = ts.sport_slug
           where v_city_id is not null and t.city_id = v_city_id and t.status = 'publicado' group by 1)
  select jsonb_build_object(
    'cidade', v_cidade, 'uf', v_uf, 'modalidades', to_jsonb(v_mods),
    'buscas_cidade', (select count(*) from cid), 'buscas_estado', (select count(*) from est), 'buscas_brasil', (select count(*) from nom),
    'minhas_cidade', (select count(*) from cid where esporte = any(v_mods)),
    'minhas_estado', (select count(*) from est where esporte = any(v_mods)),
    'top_cidade', (select coalesce(jsonb_agg(jsonb_build_object('k', x.esporte, 'n', x.c, 'meu', x.esporte = any(v_mods), 't', coalesce((select ofe.c from ofe where ofe.esporte = x.esporte), 0)) order by x.c desc, x.esporte), '[]'::jsonb) from (select esporte, count(*) c from cid group by 1 order by 2 desc limit 10) x),
    'top_estado', (select coalesce(jsonb_agg(jsonb_build_object('k', esporte, 'n', c, 'meu', esporte = any(v_mods)) order by c desc, esporte), '[]'::jsonb) from (select esporte, count(*) c from est group by 1 order by 2 desc limit 10) x),
    'top_brasil', (select coalesce(jsonb_agg(jsonb_build_object('k', esporte, 'n', c, 'meu', esporte = any(v_mods)) order by c desc, esporte), '[]'::jsonb) from (select esporte, count(*) c from nom group by 1 order by 2 desc limit 10) x),
    'formatos', (select coalesce(jsonb_agg(jsonb_build_object('k', k, 'n', c) order by c desc, k), '[]'::jsonb) from (select case fmt when 'Presencial' then 'presencial' when 'Online' then 'online' else 'qualquer formato' end k, count(*) c
                   from bus where (v_cidade is not null and cid = v_cidade) or (v_uf is not null and (cid = 'UF:' || v_uf or cid like '%, ' || v_uf)) group by 1) o),
    'na_cidade', (select count(distinct t.id) from public.trainers t join public.trainer_sports ts on ts.trainer_id = t.id
                   where v_city_id is not null and t.city_id = v_city_id and t.status = 'publicado' and ts.sport_slug = any(v_slugs)),
    'posicao', (select 1 + count(distinct t.id) from public.trainers t join public.trainer_sports ts on ts.trainer_id = t.id join public.trainer_rank k on k.trainer_id = t.id
                 where v_city_id is not null and t.city_id = v_city_id and t.status = 'publicado' and t.id <> v_id and ts.sport_slug = any(v_slugs)
                   and k.score > coalesce((select score from public.trainer_rank where trainer_id = v_id), 0))
  ) into m;
  return r || jsonb_build_object('regiao', m, 'perfil', pf);
end $$;
revoke all on function public.my_audience(integer) from public, anon;
grant execute on function public.my_audience(integer) to authenticated;
