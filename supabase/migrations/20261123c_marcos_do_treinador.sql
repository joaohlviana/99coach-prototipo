-- Totais desde o começo da contagem (sem robôs), para as conquistas do treinador: visitas, contatos e aparições nas listas.
create or replace function public.my_milestones() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'visitas', count(*) filter (where e.event_name = 'trainer.profile_viewed.v1'),
    'contatos', count(*) filter (where e.event_name = 'contact.intent_started.v1'),
    'aparicoes', count(*) filter (where e.event_name = 'showcase.card_impressed.v1'),
    'desde', min(e.occurred_at))
  from public.trainers t
  left join public.funnel_events e on e.properties->>'trainer_slug' = t.slug and e.properties ? 'h'
   and e.event_name in ('trainer.profile_viewed.v1', 'contact.intent_started.v1', 'showcase.card_impressed.v1')
  where t.id = (select public.my_trainer_id());
$$;
revoke all on function public.my_milestones() from public, anon;
grant execute on function public.my_milestones() to authenticated;
