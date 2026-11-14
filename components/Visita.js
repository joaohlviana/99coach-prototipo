'use client';
// Registra uma abertura da página pública do treinador (sem identificar quem visitou). Uma vez por aba e por perfil.
import { useEffect } from 'react';

const URL0 = 'https://rycaxboqkkiopjdecgld.supabase.co';
const KEY = 'sb_publishable_dPQ0596gx0ok94wUE4POtw_T-QjY8Cq';

export default function Visita({ slug }) {
  useEffect(() => {
    try {
      const k = 'c99.visto.' + slug;
      if (sessionStorage.getItem(k)) return;
      sessionStorage.setItem(k, '1');
      fetch(URL0 + '/rest/v1/funnel_events', {
        method: 'POST', keepalive: true,
        headers: { apikey: KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ event_name: 'trainer.profile_viewed.v1', channel: 'web', locale: 'pt-BR', properties: { trainer_slug: slug } })
      }).catch(() => {});
    } catch (_) {}
  }, [slug]);
  return null;
}
