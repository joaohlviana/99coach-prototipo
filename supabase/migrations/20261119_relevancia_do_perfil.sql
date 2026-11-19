-- Relevância de cada perfil publicado, recalculada todo dia. A lista do site sai nessa ordem (maior primeiro).
-- Soma: perfil mantido pelo próprio treinador, completude (foto, texto, local, CREF conferido), avaliações,
-- visitas dos últimos 30 dias (quem chega por busca do Google ou link direto pesa mais que clique dentro do site),
-- alcance público informado (seguidores) e um rodízio semanal para que perfis empatados não fiquem em ordem alfabética.
-- Plano pago não entra na conta.
create table if not exists public.trainer_rank (
  trainer_id uuid primary key references public.trainers(id) on delete cascade,
  score numeric not null default 0,
  views_30d integer not null default 0,
  computed_at timestamptz not null default now()
);
alter table public.trainer_rank enable row level security;
drop policy if exists "ler relevância" on public.trainer_rank;
create policy "ler relevância" on public.trainer_rank for select using (true);
grant select on public.trainer_rank to anon, authenticated;

create or replace function public.recompute_trainer_rank() returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
declare n integer;
begin
  with v as (
    select properties->>'trainer_slug' as slug,
           count(*)::int as total,
           sum(case properties->>'entry' when 'busca' then 3 when 'direto' then 2 else 1 end)::numeric as peso
    from funnel_events
    where event_name = 'trainer.profile_viewed.v1' and occurred_at >= now() - interval '30 days'
    group by 1
  )
  insert into trainer_rank (trainer_id, score, views_30d, computed_at)
  select t.id,
         round((
           case when t.origin = 'cadastro' then 30 else 0 end
           + case when coalesce(t.photo_url, '') <> '' then 15 else 0 end
           + case when length(coalesce(t.pitch, '') || coalesce(t.bio, '')) >= 40 then 10 else 0 end
           + case when t.city_id is not null or coalesce(t.locality, '') <> '' then 5 else 0 end
           + case when t.cref_verified_at is not null then 10 else 0 end
           + case when coalesce(t.rating_count, 0) > 0 then least(10, coalesce(t.rating_avg, 0) * 2) else 0 end
           + least(25, 8 * ln(1 + coalesce(v.peso, 0)))
           + least(5, ln(1 + coalesce(t.ig_followers, 0)) / ln(10))
           + (abs(hashtext(t.slug || to_char(now(), 'IYYY-IW'))) % 1000) / 200.0
         )::numeric, 2),
         coalesce(v.total, 0), now()
  from trainers t left join v on v.slug = t.slug
  where t.status = 'publicado'
  on conflict (trainer_id) do update set score = excluded.score, views_30d = excluded.views_30d, computed_at = excluded.computed_at;
  get diagnostics n = row_count;
  delete from trainer_rank r using trainers t where t.id = r.trainer_id and t.status <> 'publicado';
  return n;
end $$;
revoke all on function public.recompute_trainer_rank() from public, anon, authenticated;

select cron.unschedule('recalcular-relevancia') where exists (select 1 from cron.job where jobname = 'recalcular-relevancia');
select cron.schedule('recalcular-relevancia', '23 5 * * *', 'select public.recompute_trainer_rank()');
select public.recompute_trainer_rank();
