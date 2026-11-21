-- O local dos importados de fora vem do texto do perfil público e às vezes traz enfeite ("Currently in Dallas") ou vem
-- todo em minúsculas ("newport beach"). A cópia agora tira o prefixo e põe a inicial maiúscula; quando não sobra uma
-- cidade de verdade ("currently", "Based in South"), o perfil fica sem local em vez de inventar um.
create or replace function public.local_do_importado() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_pais text := upper(coalesce(new.location_raw->>'country', 'BR'));
  v_cid text := nullif(trim(regexp_replace(coalesce(new.location_raw->>'city', ''), '^(currently in|currently|based in|living in|located in)\s*', '', 'i')), '');
  v_local text := left(nullif(trim(regexp_replace(coalesce(nullif(trim(coalesce(new.location_raw->>'display', '')), ''), new.location_raw->>'city', ''), '^(currently in|currently|based in|living in|located in)\s*', '', 'i')), ''), 120);
begin
  if v_local is not null and split_part(v_local, ', ', 1) = lower(split_part(v_local, ', ', 1)) then v_local := initcap(split_part(v_local, ', ', 1)) || substr(v_local, length(split_part(v_local, ', ', 1)) + 1); end if;
  if v_pais ~ '^[A-Z]{2}$' and v_pais <> 'BR' and v_cid is not null and length(v_cid) >= 3 and v_local is not null and v_local !~ '^,' then
    update public.trainers t set country = v_pais, locality = v_local
     where t.id = new.trainer_id and t.origin = 'importado' and t.city_id is null
       and (t.country is distinct from v_pais or t.locality is distinct from v_local);
  end if;
  return new;
end $$;
revoke all on function public.local_do_importado() from public, anon, authenticated;

-- os seis que já estavam sujos
update public.trainers set locality = 'Dallas, Estados Unidos' where locality = 'Currently in Dallas, Estados Unidos';
update public.trainers set locality = 'Newport Beach, Estados Unidos' where locality = 'newport beach, Estados Unidos';
update public.trainers set locality = 'Albuquerque, Estados Unidos' where locality = 'abq, Estados Unidos';
update public.trainers set locality = null where locality in ('currently, Estados Unidos', 'Based in South, Reino Unido', 'hk, Coreia do Sul');
