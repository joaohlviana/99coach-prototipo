// Grava em public/data/versao-catalogo.txt a marca do catálogo publicado no banco: dia, quantidade de perfis e última alteração.
// O fluxo .github/workflows/catalogo.yml roda isto de 3 em 3 horas; quando a marca muda, o site é publicado de novo
// e o catálogo (scripts/sync-supabase.mjs, no build da Vercel) sai atualizado. Se o banco não responder, a marca fica como está.
import { readFileSync, writeFileSync } from 'node:fs';
const URL0 = process.env.SUPABASE_URL || 'https://rycaxboqkkiopjdecgld.supabase.co';
const KEY = process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_dPQ0596gx0ok94wUE4POtw_T-QjY8Cq';
const OUT = new URL('../public/data/versao-catalogo.txt', import.meta.url);
try {
  const r = await fetch(`${URL0}/rest/v1/trainers?select=updated_at&status=eq.publicado&origin=neq.demonstracao&order=updated_at.desc&limit=1`,
    { headers: { apikey: KEY, Prefer: 'count=exact' }, signal: AbortSignal.timeout(20000) });
  if (!r.ok && r.status !== 206) throw new Error('resposta ' + r.status);
  const total = Number((r.headers.get('content-range') || '').split('/')[1]);
  const ultimo = ((await r.json())[0] || {}).updated_at || '';
  if (!total || total < 100) throw new Error('contagem estranha: ' + total);
  const marca = `${new Date().toISOString().slice(0, 10)} · ${total} perfis · última alteração ${ultimo.slice(0, 19)}`;
  let antes = ''; try { antes = readFileSync(OUT, 'utf8').trim(); } catch (_) {}
  if (antes !== marca) writeFileSync(OUT, marca + '\n');
  console.log(antes === marca ? 'sem mudança: ' : 'mudou: ', marca);
} catch (e) { console.log('aviso: não foi possível consultar o banco (' + e.message + '); marca mantida'); }
