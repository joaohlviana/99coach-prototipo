// Baixa a base real de treinadores da API da 99Coach para public/data/treinadores.json.
// Uso: npm run sync            (base inteira)
//      npm run sync -- 2000    (para nos primeiros 2000)
import { mkdirSync, writeFileSync } from 'node:fs';
const API = process.env.API_99COACH || 'https://99coach-prototipo.vercel.app';
const FOTOS = 'https://rycaxboqkkiopjdecgld.supabase.co/storage/v1/object/public/trainer-photos/legado/';
const max = Number(process.argv[2]) || Infinity;
const rows = [], seen = new Set();
let cursor = null, page = 1, total = 0, byPage = false;
const t0 = Date.now(), LIMITE = (Number(process.env.SYNC_MINUTOS) || 12) * 60000;
let parou = false;
for (;;) {
  const u = new URL('/api/v1/search', API);
  u.searchParams.set('pageSize', '40'); u.searchParams.set('perPage', '40');
  if (byPage) u.searchParams.set('page', String(page)); else if (cursor) u.searchParams.set('cursor', cursor);
  // a API limita a frequência: espera e tenta de novo; se não der, guarda o que já baixou
  let r = null;
  for (let tent = 0; tent < 8; tent++) {
    r = await fetch(u).catch(() => null);
    if (r && r.ok) break;
    if (Date.now() - t0 > LIMITE) break;
    await new Promise((ok) => setTimeout(ok, r && r.status === 429 ? Math.min(60000, (Number(r.headers.get('retry-after')) || 15) * 1000) : 3000));
  }
  if (!r || !r.ok) { console.log(`\nParou em ${rows.length}: a API respondeu ${r ? r.status : 'sem conexão'}.`); break; }
  const d = await r.json();
  await new Promise((ok) => setTimeout(ok, 150));
  if (Date.now() - t0 > LIMITE) { parou = true; }
  total = d.total || total;
  let novos = 0;
  for (const t of d.items || []) {
    if (seen.has(t.slug)) continue;
    seen.add(t.slug); novos++;
    const f = (t.formats || []).includes('presencial') ? 'p' : '';
    rows.push([t.slug, t.name, t.initials || '', (t.photo || '').replace(FOTOS, ''), t.specialty || '', t.sports || [], t.city?.label || '', f + ((t.formats || []).includes('online') ? 'o' : ''), t.publishedAt || '']);
  }
  process.stdout.write(`\r${rows.length} de ${total} treinadores`);
  if (rows.length >= max || parou) break;
  if (!novos && !byPage && cursor) { byPage = true; page = 2; continue; } // API sem cursor: tenta por página
  if (!novos) break;
  if (byPage) { page++; if (d.pages && page > d.pages) break; } else { cursor = d.nextCursor; if (!cursor) break; }
}
if (!rows.length) { console.log('Nada baixado: o app segue com a amostra embutida.'); process.exit(0); }
mkdirSync(new URL('../public/data/', import.meta.url), { recursive: true });
writeFileSync(new URL('../public/data/treinadores.json', import.meta.url), JSON.stringify({ fotos: FOTOS, baixadoEm: new Date().toISOString(), total, items: rows }));
console.log(`\nSalvo em public/data/treinadores.json (${rows.length} treinadores).`);
