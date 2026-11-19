// Baixa o catálogo publicado direto do banco (Supabase 99coach-v2) para public/data/treinadores.json.
// Roda no build da Vercel. Se o banco não responder, o arquivo atual fica como está (o build não quebra).
// Usa a chave pública do navegador: só lê o que qualquer visitante já pode ver (perfis publicados).
// Formato de cada linha (o mesmo que o app já lê):
//   [slug, nome, iniciais, foto, especialidade, [esportes], "Cidade, UF", "p"/"o"/"po", publicado_em, origem, @instagram, país (fora do BR), local (fora do BR)]
import { readFileSync, writeFileSync } from 'node:fs';

const URL0 = process.env.SUPABASE_URL || 'https://rycaxboqkkiopjdecgld.supabase.co';
const KEY = process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_dPQ0596gx0ok94wUE4POtw_T-QjY8Cq';
const OUT = new URL('../public/data/treinadores.json', import.meta.url);
const PAGE = 1000;
const sel = 'slug,name,initials,photo_url,specialty,formats,published_at,origin,external_handle,country,locality,cities(name,uf),trainer_sports(sport_slug),trainer_rank(score)';

async function page(from) {
  const u = `${URL0}/rest/v1/trainers?select=${encodeURIComponent(sel)}&status=eq.publicado&origin=neq.demonstracao&order=slug.asc`;
  for (let t = 0; t < 4; t++) {
    const r = await fetch(u, { headers: { apikey: KEY, Range: `${from}-${from + PAGE - 1}`, 'Range-Unit': 'items', Prefer: 'count=exact' } }).catch(() => null);
    if (r && (r.ok || r.status === 206)) return { rows: await r.json(), total: Number((r.headers.get('content-range') || '').split('/')[1]) || null };
    await new Promise((ok) => setTimeout(ok, 1500 * (t + 1)));
  }
  throw new Error('o banco não respondeu');
}

try {
  const rows = []; let total = null;
  for (let from = 0; ; from += PAGE) {
    const p = await page(from);
    total = total || p.total;
    p.rows.forEach((t) => {
      const city = t.cities ? `${t.cities.name}, ${t.cities.uf}` : '';
      const f = (t.formats || []).includes('presencial') && (city || (t.country && t.country !== 'BR' && t.locality)) ? 'p' : '';
      // foto: só a que está no nosso armazenamento (caminho curto); endereço de fora não é usado em perfil importado
      const FOTOS = 'https://rycaxboqkkiopjdecgld.supabase.co/storage/v1/object/public/trainer-photos/';
      const u = t.photo_url || '';
      const photo = u.startsWith(FOTOS) ? u.slice(FOTOS.length) : (t.origin === 'importado' ? '' : u);
      const nota = Number((Array.isArray(t.trainer_rank) ? t.trainer_rank[0] : t.trainer_rank || {}).score) || 0;
      rows.push([nota, t.slug, t.name, t.initials || '', photo, t.specialty || '', (t.trainer_sports || []).map((s) => s.sport_slug), city,
        f + ((t.formats || []).includes('online') ? 'o' : ''), (t.published_at || '').slice(0, 10), t.origin || '', /^@?[A-Za-z0-9._]{1,30}$/.test(t.external_handle || '') ? t.external_handle : '',
        // fora do Brasil: país (ISO) e local por extenso; no Brasil ficam vazios
        t.country && t.country !== 'BR' ? t.country : '', t.country && t.country !== 'BR' ? (t.locality || '') : '']);
    });
    process.stdout.write(`\r${rows.length}${total ? ' de ' + total : ''} perfis`);
    if (p.rows.length < PAGE) break;
  }
  // a lista do site sai nesta ordem: relevância calculada no banco (maior primeiro); empate pelo endereço
  rows.sort((a, b) => b[0] - a[0] || (a[1] < b[1] ? -1 : 1));
  for (const r of rows) r.shift();
  if (rows.length < 100) throw new Error(`poucos perfis (${rows.length}); mantendo o arquivo anterior`);
  writeFileSync(OUT, JSON.stringify({ fonte: 'supabase', baixadoEm: new Date().toISOString(), total: rows.length, items: rows }));
  console.log(`\ncatálogo atualizado do banco: ${rows.length} perfis publicados`);
} catch (e) {
  let n = 0; try { n = JSON.parse(readFileSync(OUT, 'utf8')).items.length; } catch (_) {}
  console.log(`\naviso: não foi possível baixar o catálogo do banco (${e.message}); usando o arquivo atual com ${n} perfis`);
}
