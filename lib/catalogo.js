// Catálogo lido no servidor para montar as páginas públicas (o que o Google lê).
// Fonte: public/data/treinadores.json (a mesma cópia que o app usa) e public/js/sports.js (cadastro único de esportes).
// Regras do plano: nada inventado; perfil importado é identificado como importado; sem treinador, a página não existe (404).
import { readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
export const SITE = process.env.SITE_URL || 'https://99coach-prototipo-39pr.vercel.app';
// homologação não é indexada; em produção, definir INDEXAR=1
export const INDEXAR = process.env.INDEXAR === '1';

const UF = { AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia', CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais', PA: 'Pará', PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina', SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins' };
// mesmas equivalências do app: quem ensina boxe também aparece em Lutas, etc.
const ALIAS = { 'jiu-jitsu': ['lutas'], boxe: ['lutas'], 'muay-thai': ['lutas'], judo: ['lutas'], karate: ['lutas'], taekwondo: ['lutas'], mma: ['lutas'], 'krav-maga': ['lutas'], capoeira: ['lutas'], ballet: ['danca'], triatlo: ['corrida', 'natacao', 'ciclismo'], hidroginastica: ['natacao'], esgrima: ['lutas'], futsal: ['futebol'], 'volei-de-praia': ['volei'] };

export const slug = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

let cache = null;
function load() {
  if (cache) return cache;
  // cadastro de esportes: o arquivo do navegador é avaliado com um "window" de mentira
  const w = { __IMG: {} };
  new Function('window', readFileSync(path.join(ROOT, 'public/js/sports.js'), 'utf8'))(w);
  const sports = w.SPORTS.list.map((s) => ({ slug: s.slug, label: s.label, group: s.group }));
  const bySlug = Object.fromEntries(sports.map((s) => [s.slug, s]));
  const raw = JSON.parse(readFileSync(path.join(ROOT, 'public/data/treinadores.json'), 'utf8'));
  const trainers = (raw.items || []).map((r) => {
    const own = (r[5] || []).filter((s) => bySlug[s]);
    const all = new Set(own); (r[5] || []).forEach((s) => (ALIAS[s] || []).forEach((a) => all.add(a)));
    return { id: r[0], name: r[1], ini: r[2] || '', spec: r[4] || '', sports: [...all], city: r[6] || '', pres: (r[7] || '').includes('p') && !!r[6], onl: (r[7] || '').includes('o') || !r[6], pub: r[8] || '', importado: (r[9] || 'importado') === 'importado' };
  }).filter((t) => t.id && t.name);
  const byId = new Map(trainers.map((t) => [t.id, t]));
  const cities = new Map(); // slug -> { label, n }
  trainers.forEach((t) => { if (!t.city) return; const k = slug(t.city); const c = cities.get(k) || { slug: k, label: t.city, n: 0 }; c.n++; cities.set(k, c); });
  const bySport = new Map(sports.map((s) => [s.slug, []]));
  trainers.forEach((t) => t.sports.forEach((s) => bySport.get(s) && bySport.get(s).push(t)));
  cache = { sports, bySlug, trainers, byId, cities, bySport, baixadoEm: raw.baixadoEm || '' };
  return cache;
}

export function esportes() { const c = load(); return c.sports.map((s) => ({ ...s, n: c.bySport.get(s.slug).length })).filter((s) => s.n > 0); }
export function esporte(s) { return load().bySlug[s] || null; }
export function cidade(k) { return load().cities.get(k) || null; }
export function treinador(id) { return load().byId.get(id) || null; }
export function todos() { return load().trainers; }
export function atualizadoEm() { return load().baixadoEm; }
export const nomeUF = (label) => { const uf = (label.split(', ')[1] || ''); return UF[uf] || uf; };
export const curta = (label) => String(label || '').split(',')[0];

// treinadores de um esporte; com cidade: só quem atende presencialmente lá; 'online': só quem atende online
export function lista(sportSlug, onde) {
  const base = load().bySport.get(sportSlug) || [];
  if (onde === 'online') return base.filter((t) => t.onl);
  if (onde) return base.filter((t) => t.pres && slug(t.city) === onde);
  return base;
}
// cidades com treinadores presenciais daquele esporte, da mais numerosa para a menos
export function cidadesDo(sportSlug, min = 1) {
  const n = new Map();
  (load().bySport.get(sportSlug) || []).forEach((t) => { if (t.pres) { const k = slug(t.city); n.set(k, (n.get(k) || 0) + 1); } });
  return [...n.entries()].filter(([, v]) => v >= min).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([k, v]) => ({ ...load().cities.get(k), n: v }));
}
export function esportesDe(t) { const c = load(); return t.sports.map((s) => c.bySlug[s]).filter(Boolean); }
export const plural = (n, a, b) => `${n.toLocaleString('pt-BR')} ${n === 1 ? a : b}`;
