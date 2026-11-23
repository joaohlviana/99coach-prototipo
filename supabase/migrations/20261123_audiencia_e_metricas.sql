-- Audiência do treinador e métricas do site.
-- Só contam eventos marcados com "h" (navegador de gente; robôs e pré-visualizações ficam de fora, ver conta.js).
-- Nada aqui identifica o visitante: "sid" é um número sorteado por aba, sem ligação com conta, e-mail ou aparelho.
create index if not exists funnel_events_nome_data_idx on public.funnel_events (event_name, occurred_at);
create index if not exists funnel_events_slug_data_idx on public.funnel_events ((properties->>'trainer_slug'), occurred_at) where properties ? 'trainer_slug';
create index if not exists funnel_events_gente_idx on public.funnel_events (occurred_at) where properties ? 'h';

create or replace function public._origem_da_visita(p jsonb) returns text
language sql immutable set search_path = '' as $$
  select case coalesce(p->>'entry', 'direto')
    when 'busca' then coalesce(nullif(p->>'ref', ''), 'busca')
    when 'outro' then coalesce(nullif(p->>'ref', ''), 'outro site')
    when 'site' then '99coach'
    else 'link direto' end
$$;

create or replace function public.my_audience(p_days integer default 28) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  d int := greatest(1, least(coalesce(p_days, 28), 365));
  v_ini timestamptz := now() - make_interval(days => d);
  v_ant timestamptz := now() - make_interval(days => 2 * d);
  v_id public.trainers.id%type; v_slug text; v_city_id public.trainers.city_id%type; v_cidade text; v_uf text; v_mods text[]; v_slugs text[];
  r jsonb; m jsonb;
begin
  select t.id, t.slug, t.city_id into v_id, v_slug, v_city_id from public.trainers t where t.id = (select public.my_trainer_id());
  if v_id is null then return jsonb_build_object('sem_perfil', true); end if;
  select c.name || ', ' || c.uf, c.uf into v_cidade, v_uf from public.cities c where c.id = v_city_id;
  select coalesce(array_agg(s.name order by s.sort), '{}'), coalesce(array_agg(ts.sport_slug), '{}') into v_mods, v_slugs
    from public.trainer_sports ts join public.sports s on s.slug = ts.sport_slug where ts.trainer_id = v_id;

  with ev as (
    select e.event_name n, e.occurred_at em, e.properties p from public.funnel_events e
     where e.properties->>'trainer_slug' = v_slug and e.occurred_at >= v_ant and e.properties ? 'h'),
  cur as (select * from ev where em >= v_ini), ant as (select * from ev where em < v_ini),
  vis as (select * from cur where n = 'trainer.profile_viewed.v1'),
  con as (select * from cur where n = 'contact.intent_started.v1')
  select jsonb_build_object(
    'dias', d, 'desde', v_ini,
    'medindo_desde', (select min(e.occurred_at) from public.funnel_events e where e.properties ? 'h'),
    'visitas', (select count(*) from vis),
    'visitas_antes', (select count(*) from ant where n = 'trainer.profile_viewed.v1'),
    'visitantes', (select count(distinct coalesce(p->>'sid', em::text)) from vis),
    'aparicoes', (select count(*) from cur where n = 'showcase.card_impressed.v1'),
    'aparicoes_antes', (select count(*) from ant where n = 'showcase.card_impressed.v1'),
    'cliques', (select count(*) from cur where n = 'showcase.card_clicked.v1'),
    'contatos', (select count(*) from con),
    'contatos_antes', (select count(*) from ant where n = 'contact.intent_started.v1'),
    'por_dia', (select coalesce(jsonb_agg(jsonb_build_object('d', g.dia, 'v', (select count(*) from vis where (vis.em at time zone 'America/Sao_Paulo')::date = g.dia)) order by g.dia), '[]'::jsonb)
                  from (select x::date dia from generate_series((v_ini at time zone 'America/Sao_Paulo')::date, (now() at time zone 'America/Sao_Paulo')::date, interval '1 day') x) g),
    'origem', (select coalesce(jsonb_agg(jsonb_build_object('k', k, 'n', c) order by c desc, k), '[]'::jsonb) from (select public._origem_da_visita(p) k, count(*) c from vis group by 1) o),
    'aparelho', (select coalesce(jsonb_agg(jsonb_build_object('k', k, 'n', c) order by c desc, k), '[]'::jsonb) from (select coalesce(nullif(p->>'dev', ''), 'não informado') k, count(*) c from vis group by 1) o),
    'veio_de', (select coalesce(jsonb_agg(jsonb_build_object('k', k, 'n', c) order by c desc, k), '[]'::jsonb) from (select p->>'de' k, count(*) c from vis where coalesce(p->>'de', '') <> '' group by 1 order by 2 desc limit 8) o),
    'recentes', (select coalesce(jsonb_agg(jsonb_build_object('em', v.em, 'origem', public._origem_da_visita(v.p), 'dev', coalesce(v.p->>'dev', ''), 'de', coalesce(v.p->>'de', ''),
                    'contato', exists (select 1 from con where con.p->>'sid' = v.p->>'sid' and v.p ? 'sid')) order by v.em desc), '[]'::jsonb)
                  from (select * from vis order by em desc limit 60) v)
  ) into r;

  -- procura na região: o que as pessoas buscaram na cidade e no estado do treinador
  with bus as (
    select e.properties->>'sport' esporte, e.properties->>'city' cid from public.funnel_events e
     where e.event_name = 'catalog.search_performed.v1' and e.occurred_at >= v_ini and e.properties ? 'h'
       and coalesce(e.properties->>'sport', '') not in ('', 'Todos os esportes')),
  cid as (select * from bus where v_cidade is not null and cid = v_cidade),
  est as (select * from bus where v_uf is not null and (cid = 'UF:' || v_uf or cid like '%, ' || v_uf))
  select jsonb_build_object(
    'cidade', v_cidade, 'uf', v_uf, 'modalidades', to_jsonb(v_mods),
    'buscas_cidade', (select count(*) from cid), 'buscas_estado', (select count(*) from est), 'buscas_brasil', (select count(*) from bus),
    'minhas_cidade', (select count(*) from cid where esporte = any(v_mods)),
    'minhas_estado', (select count(*) from est where esporte = any(v_mods)),
    'top_cidade', (select coalesce(jsonb_agg(jsonb_build_object('k', esporte, 'n', c, 'meu', esporte = any(v_mods)) order by c desc, esporte), '[]'::jsonb) from (select esporte, count(*) c from cid group by 1 order by 2 desc limit 8) x),
    'top_estado', (select coalesce(jsonb_agg(jsonb_build_object('k', esporte, 'n', c, 'meu', esporte = any(v_mods)) order by c desc, esporte), '[]'::jsonb) from (select esporte, count(*) c from est group by 1 order by 2 desc limit 8) x),
    'top_brasil', (select coalesce(jsonb_agg(jsonb_build_object('k', esporte, 'n', c, 'meu', esporte = any(v_mods)) order by c desc, esporte), '[]'::jsonb) from (select esporte, count(*) c from bus group by 1 order by 2 desc limit 8) x),
    -- quem mais atende as mesmas modalidades na cidade, e em que lugar o perfil aparece entre eles
    'na_cidade', (select count(distinct t.id) from public.trainers t join public.trainer_sports ts on ts.trainer_id = t.id
                   where v_city_id is not null and t.city_id = v_city_id and t.status = 'publicado' and ts.sport_slug = any(v_slugs)),
    'posicao', (select 1 + count(distinct t.id) from public.trainers t join public.trainer_sports ts on ts.trainer_id = t.id join public.trainer_rank k on k.trainer_id = t.id
                 where v_city_id is not null and t.city_id = v_city_id and t.status = 'publicado' and t.id <> v_id and ts.sport_slug = any(v_slugs)
                   and k.score > coalesce((select score from public.trainer_rank where trainer_id = v_id), 0))
  ) into m;
  return r || jsonb_build_object('regiao', m);
end $$;
revoke all on function public.my_audience(integer) from public, anon;
grant execute on function public.my_audience(integer) to authenticated;

create or replace function public.admin_metrics(p_days integer default 28) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  d int := greatest(1, least(coalesce(p_days, 28), 365));
  v_ini timestamptz := now() - make_interval(days => d);
  v_ant timestamptz := now() - make_interval(days => 2 * d);
  r jsonb;
begin
  if not public.is_admin(true) then raise exception 'exige papel admin com verificação em duas etapas (aal2)' using errcode = '42501'; end if;
  with ev as (select e.event_name n, e.occurred_at em, e.properties p, e.locale loc, (e.properties ? 'h') gente from public.funnel_events e where e.occurred_at >= v_ant),
  cur as (select * from ev where em >= v_ini and gente), ant as (select * from ev where em < v_ini and gente),
  vis as (select * from cur where n = 'trainer.profile_viewed.v1'),
  bus as (select * from cur where n = 'catalog.search_performed.v1'),
  dias as (select x::date dia from generate_series((v_ini at time zone 'America/Sao_Paulo')::date, (now() at time zone 'America/Sao_Paulo')::date, interval '1 day') x),
  pd as (select (em at time zone 'America/Sao_Paulo')::date dia, n, count(*) c from cur group by 1, 2),
  rb as (select (em at time zone 'America/Sao_Paulo')::date dia, count(*) c from ev where em >= v_ini and not gente and n in ('trainer.profile_viewed.v1', 'showcase.card_impressed.v1', 'catalog.search_performed.v1') group by 1)
  select jsonb_build_object(
    'dias', d, 'desde', v_ini, 'em', now(),
    'medindo_desde', (select min(e.occurred_at) from public.funnel_events e where e.properties ? 'h'),
    'visitas', (select count(*) from vis), 'visitas_antes', (select count(*) from ant where n = 'trainer.profile_viewed.v1'),
    'visitantes', (select count(distinct p->>'sid') from cur where p ? 'sid'), 'visitantes_antes', (select count(distinct p->>'sid') from ant where p ? 'sid'),
    'buscas', (select count(*) from bus), 'buscas_antes', (select count(*) from ant where n = 'catalog.search_performed.v1'),
    'aparicoes', (select count(*) from cur where n = 'showcase.card_impressed.v1'),
    'cliques', (select count(*) from cur where n = 'showcase.card_clicked.v1'),
    'contatos', (select count(*) from cur where n = 'contact.intent_started.v1'), 'contatos_antes', (select count(*) from ant where n = 'contact.intent_started.v1'),
    'perfis_visitados', (select count(distinct p->>'trainer_slug') from vis),
    'descartados', (select coalesce(sum(c), 0) from rb),
    'por_dia', (select coalesce(jsonb_agg(jsonb_build_object('d', dias.dia,
        'visitas', coalesce((select c from pd where pd.dia = dias.dia and pd.n = 'trainer.profile_viewed.v1'), 0),
        'buscas', coalesce((select c from pd where pd.dia = dias.dia and pd.n = 'catalog.search_performed.v1'), 0),
        'contatos', coalesce((select c from pd where pd.dia = dias.dia and pd.n = 'contact.intent_started.v1'), 0),
        'visitantes', (select count(distinct cur.p->>'sid') from cur where (cur.em at time zone 'America/Sao_Paulo')::date = dias.dia and cur.p ? 'sid'),
        'descartados', coalesce((select c from rb where rb.dia = dias.dia), 0),
        'contas', (select count(*) from auth.users u where (u.created_at at time zone 'America/Sao_Paulo')::date = dias.dia)) order by dias.dia), '[]'::jsonb) from dias),
    'origem', (select coalesce(jsonb_agg(jsonb_build_object('k', k, 'n', c) order by c desc, k), '[]'::jsonb) from (select public._origem_da_visita(p) k, count(*) c from vis group by 1 order by 2 desc limit 12) o),
    'aparelho', (select coalesce(jsonb_agg(jsonb_build_object('k', k, 'n', c) order by c desc, k), '[]'::jsonb) from (select coalesce(nullif(p->>'dev', ''), 'não informado') k, count(*) c from vis group by 1) o),
    'idioma', (select coalesce(jsonb_agg(jsonb_build_object('k', k, 'n', c) order by c desc, k), '[]'::jsonb) from (select coalesce(loc, 'pt-BR') k, count(*) c from vis group by 1) o),
    'top_esportes', (select coalesce(jsonb_agg(jsonb_build_object('k', k, 'n', c) order by c desc, k), '[]'::jsonb) from (select p->>'sport' k, count(*) c from bus where coalesce(p->>'sport', '') not in ('', 'Todos os esportes') group by 1 order by 2 desc limit 15) o),
    'top_cidades', (select coalesce(jsonb_agg(jsonb_build_object('k', k, 'n', c) order by c desc, k), '[]'::jsonb) from (select p->>'city' k, count(*) c from bus where coalesce(p->>'city', '') not in ('', 'MUNDO') group by 1 order by 2 desc limit 15) o),
    'top_perfis', (select coalesce(jsonb_agg(jsonb_build_object('slug', o.slug, 'nome', t.name, 'origem', t.origin, 'visitas', o.c, 'contatos', o.k) order by o.c desc, o.slug), '[]'::jsonb)
                    from (select v.slug, v.c, (select count(*) from cur where cur.n = 'contact.intent_started.v1' and cur.p->>'trainer_slug' = v.slug) k
                            from (select vis.p->>'trainer_slug' slug, count(*) c from vis group by 1 order by 2 desc limit 20) v) o
                    left join public.trainers t on t.slug = o.slug),
    'funil', jsonb_build_object(
      'visitas', (select count(*) from vis), 'contatos', (select count(*) from cur where n = 'contact.intent_started.v1'),
      'pedidos', (select count(*) from public.requests q where q.created_at >= v_ini),
      'aceitos', (select count(*) from public.requests q where q.created_at >= v_ini and q.status = 'aceito'),
      'acompanhamentos', (select count(*) from public.links l where l.created_at >= v_ini)),
    'contas', jsonb_build_object('novas', (select count(*) from auth.users u where u.created_at >= v_ini), 'novas_antes', (select count(*) from auth.users u where u.created_at >= v_ant and u.created_at < v_ini), 'total', (select count(*) from auth.users)),
    'treinadores', jsonb_build_object(
      'cadastro_novos', (select count(*) from public.trainers t where t.origin = 'cadastro' and t.created_at >= v_ini),
      'cadastro_publicados', (select count(*) from public.trainers t where t.origin = 'cadastro' and t.status = 'publicado'),
      'cadastro_rascunho', (select count(*) from public.trainers t where t.origin = 'cadastro' and t.status = 'rascunho'),
      'importados', (select count(*) from public.trainers t where t.origin = 'importado' and t.status = 'publicado'),
      'reivindicados', (select count(*) from public.trainers t where t.claimed_at is not null),
      'reivindicados_periodo', (select count(*) from public.trainers t where t.claimed_at >= v_ini),
      'com_foto', (select count(*) from public.trainers t where t.status = 'publicado' and coalesce(t.photo_url, '') <> ''),
      'paises', (select count(distinct t.country) from public.trainers t where t.status = 'publicado'))
  ) into r;
  return r;
end $$;
revoke all on function public.admin_metrics(integer) from public, anon;
grant execute on function public.admin_metrics(integer) to authenticated;
