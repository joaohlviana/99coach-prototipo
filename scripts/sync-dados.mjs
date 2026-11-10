// Baixa a base real de treinadores da API da 99Coach para public/data/treinadores.json.
// Uso: npm run sync            (base inteira)
//      npm run sync -- 2000    (para nos primeiros 2000)
import { mkdirSync, writeFileSync } from 'node:fs';
const API = process.env.API_99COACH || 'https://99coach-prototipo.vercel.app';
const FOTOS = 'https://rycaxboqkkiopjdecgld.supabase.co/storage/v1/object/public/trainer-photos/legado/';
const max = Number(process.argv[2]) || Infinity;
const rows = [], seen = new Set();
let cursor = null, page = 1, total = 0, byPage = false;
for (;;) {
  const u = new URL('/api/v1/search', API);
  u.searchParams.set('pageSize', '40'); u.searchParams.set('perPage', '40');
  if (byPage) u.searchParams.set('page', String(page)); else if (cursor) u.searchParams.set('cursor', cursor);
  const r = await fetch(u);
  if (!r.ok) throw new Error(`API respondeu ${r.status} em ${u}`);
  const d = await r.json();
  total = d.total || total;
  let novos = 0;
  for (const t of d.items || []) {
    if (seen.has(t.slug)) continue;
    seen.add(t.slug); novos++;
    const f = (t.formats || []).includes('presencial') ? 'p' : '';
    rows.push([t.slug, t.name, t.initials || '', (t.photo || '').replace(FOTOS, ''), t.specialty || '', t.sports || [], t.city?.label || '', f + ((t.formats || []).includes('online') ? 'o' : ''), t.publishedAt || '']);
  }
  process.stdout.write(`\r${rows.length} de ${total} treinadores`);
  if (rows.length >= max) break;
  if (!novos && !byPage && cursor) { byPage = true; page = 2; continue; } // API sem cursor: tenta por página
  if (!novos) break;
  if (byPage) { page++; if (d.pages && page > d.pages) break; } else { cursor = d.nextCursor; if (!cursor) break; }
}
mkdirSync(new URL('../public/data/', import.meta.url), { recursive: true });
writeFileSync(new URL('../public/data/treinadores.json', import.meta.url), JSON.stringify({ fotos: FOTOS, baixadoEm: new Date().toISOString(), total, items: rows }));
console.log(`\nSalvo em public/data/treinadores.json (${rows.length} treinadores).`);
