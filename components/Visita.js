'use client';
// Registra uma abertura da página pública do treinador (sem identificar quem visitou). Uma vez por aba e por perfil.
// As mesmas regras do app (public/js/conta.js): robô e pré-visualização não contam; a visita leva um número sorteado
// por aba, o tipo de aparelho e de onde veio (Google, Instagram, link direto…).
import { useEffect } from 'react';

const URL0 = 'https://rycaxboqkkiopjdecgld.supabase.co';
const KEY = 'sb_publishable_dPQ0596gx0ok94wUE4POtw_T-QjY8Cq';
const ROBO = /bot|crawl|spider|slurp|lighthouse|pagespeed|preview|facebookexternalhit|whatsapp|telegram|gptbot|claude|perplexity|bytespider|ahrefs|semrush|python|curl|wget|axios|node-fetch|phantom|prerender/i;
const NOMES = [[/(^|\.)google\./, 'Google'], [/(^|\.)bing\./, 'Bing'], [/duckduckgo/, 'DuckDuckGo'], [/yahoo/, 'Yahoo'], [/instagram/, 'Instagram'], [/facebook|fb\.com/, 'Facebook'], [/whatsapp|wa\.me/, 'WhatsApp'], [/(^|\.)t\.co$|twitter|(^|\.)x\.com$/, 'X'], [/youtube|youtu\.be/, 'YouTube'], [/linkedin|lnkd\.in/, 'LinkedIn'], [/tiktok/, 'TikTok'], [/chatgpt|openai/, 'ChatGPT'], [/t\.me|telegram/, 'Telegram']];

export default function Visita({ slug }) {
  useEffect(() => {
    try {
      if (ROBO.test(navigator.userAgent || '') || ((navigator.webdriver || /headless/i.test(navigator.userAgent || '')) && !/^(localhost|127\.0\.0\.1)$/.test(location.hostname))) return;
      const k = 'c99.visto.' + slug;
      if (sessionStorage.getItem(k)) return;
      sessionStorage.setItem(k, '1');
      let sid = sessionStorage.getItem('c99.sid');
      if (!sid) { sid = Math.random().toString(36).slice(2, 12) + Date.now().toString(36).slice(-4); sessionStorage.setItem('c99.sid', sid); }
      const props = { trainer_slug: slug, h: 1, sid, dev: window.matchMedia('(max-width: 820px)').matches ? 'celular' : 'computador', entry: 'direto' };
      const r = document.referrer;
      if (r) {
        const h = new URL(r).hostname.replace(/^www\./, '');
        if (h === location.hostname.replace(/^www\./, '')) { props.entry = 'site'; const de = sessionStorage.getItem('c99.de'); if (de) props.de = de; }
        else { props.entry = /(^|\.)(google|bing|duckduckgo|yahoo|yandex|ecosia|brave)\./.test(h) ? 'busca' : 'outro'; const n = NOMES.find((x) => x[0].test(h)); props.ref = n ? n[1] : h.slice(0, 60); }
      }
      const lang = document.documentElement.lang || '';
      fetch(URL0 + '/rest/v1/funnel_events', {
        method: 'POST', keepalive: true,
        headers: { apikey: KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ event_name: 'trainer.profile_viewed.v1', channel: 'web', locale: /^en/.test(lang) ? 'en' : /^es/.test(lang) ? 'es' : 'pt-BR', properties: props })
      }).catch(() => {});
    } catch (_) {}
  }, [slug]);
  return null;
}
