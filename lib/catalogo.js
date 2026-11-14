// Catálogo lido no servidor para montar as páginas públicas (o que o Google lê).
// Fonte: public/data/treinadores.json (a mesma cópia que o app usa) e public/js/sports.js (cadastro único de esportes).
// Regras do plano: nada inventado; perfil importado é identificado como importado; sem treinador, a página não existe (404).
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
export const SITE = process.env.SITE_URL || 'https://99coach-prototipo-39pr.vercel.app';
// homologação não é indexada; em produção, definir INDEXAR=1
export const INDEXAR = process.env.INDEXAR === '1';

const UF = { AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia', CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais', PA: 'Pará', PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina', SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins' };
// mesmas equivalências do app: quem ensina boxe também aparece em Lutas, etc.
const ALIAS = { 'jiu-jitsu': ['lutas'], boxe: ['lutas'], 'muay-thai': ['lutas'], judo: ['lutas'], karate: ['lutas'], taekwondo: ['lutas'], mma: ['lutas'], 'krav-maga': ['lutas'], capoeira: ['lutas'], ballet: ['danca'], triatlo: ['corrida', 'natacao', 'ciclismo'], hidroginastica: ['natacao'], esgrima: ['lutas'], futsal: ['futebol'], 'volei-de-praia': ['volei'] };

export const slug = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export const FOTOS = 'https://rycaxboqkkiopjdecgld.supabase.co/storage/v1/object/public/trainer-photos/';
export const fotoDe = (v) => !v ? '' : (/^https?:/.test(v) ? v : FOTOS + (v.startsWith('legado/') ? v : 'legado/' + v));
// Textos de busca: o serviço que a pessoa digita ("personal trainer", "aulas de judô") e a cidade vêm primeiro.
// Cada esporte com o nome do serviço como a pessoa busca (e como se diz em português): "aulas de nutrição" não existe.
const SERVICO = {
  musculacao: 'Personal trainer de musculação', funcional: 'Personal trainer de treino funcional', calistenia: 'Personal trainer de calistenia',
  crossfit: 'Coach de CrossFit', condicionamento: 'Preparador físico', nutricao: 'Nutricionista esportivo', fisioterapia: 'Fisioterapeuta',
  'bem-estar': 'Profissional de bem-estar', corrida: 'Assessoria de corrida', ciclismo: 'Treinador de ciclismo', triatlo: 'Treinador de triatlo',
  lpo: 'Treinador de LPO', hyrox: 'Treinador de Hyrox', futebol: 'Treinador de futebol', futsal: 'Treinador de futsal', basquete: 'Treinador de basquete',
  volei: 'Treinador de vôlei', 'volei-de-praia': 'Treinador de vôlei de praia', lutas: 'Aulas de lutas', alongamento: 'Aulas de alongamento', danca: 'Aulas de dança',
  natacao: 'Aulas de natação', ginastica: 'Aulas de ginástica', hidroginastica: 'Aulas de hidroginástica', patinacao: 'Aulas de patinação', escalada: 'Aulas de escalada',
  tenis: 'Aulas de tênis', 'tenis-de-mesa': 'Aulas de tênis de mesa', esgrima: 'Aulas de esgrima', golfe: 'Aulas de golfe', capoeira: 'Aulas de capoeira', boxe: 'Aulas de boxe'
};
export const servicoDe = (slugEsporte, rotulo) => SERVICO[slugEsporte] || (rotulo ? 'Aulas de ' + rotulo : 'Treinador');
// sem treino pelo app nestes (não são treino)
export const semTreino = (slugEsporte) => slugEsporte === 'nutricao' || slugEsporte === 'fisioterapia' || slugEsporte === 'bem-estar';
// nome vindo de rede social: tira letras enfeitadas, emoji e o que vem depois de barra ou traço vertical
export const nomeLimpo = (n) => { const s = String(n || '').normalize('NFKC').replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, '').split(/\s*[|/•·]\s*/)[0].replace(/\s+/g, ' ').trim(); return s || String(n || '').trim(); };
export const cidadeUF = (label) => { const [c, uf] = String(label || '').split(', '); return uf ? `${c} (${uf})` : c; };
// o Google corta perto de 60 caracteres: escolhe a primeira versão que cabe junto com " | 99coach"
export const caber = (...opcoes) => opcoes.find((o) => o.length <= 50) || opcoes[opcoes.length - 1] || '';
// descrição: até 155 caracteres, cortando em fim de frase ou de palavra
export const resumo = (txt, max = 155) => { const t = String(txt).replace(/\s+/g, ' ').trim(); if (t.length <= max) return t; const c = t.slice(0, max); const p = c.lastIndexOf('. '); return p > 80 ? c.slice(0, p + 1) : c.slice(0, c.lastIndexOf(' ')).replace(/[,;:]$/, '') + '…'; };
let cache = null;
function linha(r, bySlug) {
  const own = (r[5] || []).filter((s) => bySlug[s]);
  const all = new Set(own); (r[5] || []).forEach((s) => (ALIAS[s] || []).forEach((a) => all.add(a)));
  return { id: r[0], name: r[1], ini: r[2] || '', photo: fotoDe(r[3]), spec: r[4] || '', sports: [...all], city: r[6] || '', pres: (r[7] || '').includes('p') && !!r[6], onl: (r[7] || '').includes('o'), pub: r[8] || '', importado: (r[9] || 'importado') === 'importado', ig: /^@?[A-Za-z0-9._]{1,30}$/.test(r[10] || '') ? String(r[10]).replace(/^@/, '') : '' };
}
function load() {
  if (cache) return cache;
  // cadastro de esportes: o arquivo do navegador é avaliado com um "window" de mentira
  const w = { __IMG: {} };
  new Function('window', readFileSync(path.join(ROOT, 'public/js/sports.js'), 'utf8'))(w);
  const sports = w.SPORTS.list.map((s) => ({ slug: s.slug, label: s.label, group: s.group, photo: s.photo || '', foto: ['webp', 'jpg', 'png'].map((e) => s.photo ? 'img/' + s.photo + '.' + e : '').find((f) => f && existsSync(path.join(ROOT, 'public', f))) ? '/' + ['webp', 'jpg', 'png'].map((e) => 'img/' + s.photo + '.' + e).find((f) => existsSync(path.join(ROOT, 'public', f))) : '' }));
  const bySlug = Object.fromEntries(sports.map((s) => [s.slug, s]));
  const raw = JSON.parse(readFileSync(path.join(ROOT, 'public/data/treinadores.json'), 'utf8'));
  const trainers = (raw.items || []).map((r) => linha(r, bySlug)).filter((t) => t.id && t.name);
  const byId = new Map(trainers.map((t) => [t.id, t]));
  const cities = new Map(); // slug -> { label, n }
  trainers.forEach((t) => { if (!t.city) return; const k = slug(t.city); const c = cities.get(k) || { slug: k, label: t.city, n: 0 }; c.n++; cities.set(k, c); });
  const bySport = new Map(sports.map((s) => [s.slug, []]));
  trainers.forEach((t) => t.sports.forEach((s) => bySport.get(s) && bySport.get(s).push(t)));
  // mesmo profissional importado duas vezes (mesmo nome e mesma cidade): vale o publicado primeiro
  const grupo = new Map();
  trainers.forEach((t) => { const k = slug(t.name) + '|' + slug(t.city); const g = grupo.get(k); if (!g || (t.pub || '9') < (g.pub || '9') || ((t.pub || '9') === (g.pub || '9') && t.id < g.id)) grupo.set(k, t); });
  trainers.forEach((t) => { const g = grupo.get(slug(t.name) + '|' + slug(t.city)); t.canon = g && g.id !== t.id ? g.id : ''; });
  cache = { sports, bySlug, trainers, byId, cities, bySport, baixadoEm: raw.baixadoEm || '' };
  return cache;
}

export function esportes() { const c = load(); return c.sports.map((s) => ({ ...s, n: c.bySport.get(s.slug).length })).filter((s) => s.n > 0); }
export function esporte(s) { return load().bySlug[s] || null; }
export function cidade(k) { return load().cities.get(k) || null; }
export function treinador(id) { return load().byId.get(id) || null; }
export function todos() { return load().trainers; }
// Cidades próximas com profissional presencial: distância em linha reta entre os centros dos municípios (base pública de coordenadas).
let coords = null;
function coordenadas() {
  if (coords) return coords;
  coords = new Map();
  try { JSON.parse(readFileSync(path.join(ROOT, 'public/data/municipios.json'), 'utf8')).items.forEach((m) => coords.set(slug(m[0] + ', ' + m[1]), [m[2], m[3]])); } catch (_) {}
  return coords;
}
const km = (a, b) => { const r = Math.PI / 180, dLa = (b[0] - a[0]) * r, dLo = (b[1] - a[1]) * r, h = Math.sin(dLa / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLo / 2) ** 2; return 12742 * Math.asin(Math.sqrt(h)); };
export function cidadesProximas(k, n = 6, maxKm = 150) {
  const c = coordenadas(), eu = c.get(k); if (!eu) return [];
  return cidades(1).filter((x) => x.slug !== k && c.has(x.slug)).map((x) => ({ ...x, km: Math.round(km(eu, c.get(x.slug))) })).filter((x) => x.km <= maxKm).sort((a, b) => a.km - b.km).slice(0, n);
}
export function todasCidades() { return [...load().cities.values()].sort((a, b) => a.label.localeCompare(b.label, 'pt-BR')); }
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
export function esportesDe(t) {
  const c = load(); const low = (t.spec || '').toLowerCase();
  const pos = (s) => { const i = low.indexOf(s.label.toLowerCase()); return i < 0 ? 1e6 : i; };
  return t.sports.map((s) => c.bySlug[s]).filter(Boolean).map((s, i) => [s, i]).sort((a, b) => pos(a[0]) - pos(b[0]) || a[1] - b[1]).map((x) => x[0]);
}
export const plural = (n, a, b) => `${n.toLocaleString('pt-BR')} ${n === 1 ? a : b}`;

// Situação atual no banco (a retirada vale na hora, sem esperar o próximo build).
// Responde true/false; null quando o banco não respondeu (aí vale o catálogo do build).
const SB = 'https://rycaxboqkkiopjdecgld.supabase.co', SBKEY = 'sb_publishable_dPQ0596gx0ok94wUE4POtw_T-QjY8Cq';
export async function publicadoAgora(id) {
  try {
    const r = await fetch(`${SB}/rest/v1/trainers?select=status&slug=eq.${encodeURIComponent(id)}`, { headers: { apikey: SBKEY }, next: { revalidate: 300 } });
    if (!r.ok) return null;
    const d = await r.json();
    return !!(d[0] && d[0].status === 'publicado');
  } catch { return null; }
}

// Perfil publicado depois do último build: busca direto no banco para a página existir na hora.
export async function treinadorAgora(id) {
  try {
    const q = `${SB}/rest/v1/trainers?select=slug,name,initials,photo_url,specialty,formats,published_at,origin,status,external_handle,cities(name,uf),trainer_sports(sport_slug)&status=eq.publicado&slug=eq.${encodeURIComponent(id)}`;
    const r = await fetch(q, { headers: { apikey: SBKEY }, next: { revalidate: 300 } });
    if (!r.ok) return null;
    const t = (await r.json())[0]; if (!t) return null;
    const city = t.cities ? t.cities.name + ', ' + t.cities.uf : '';
    const f = (t.formats || []).includes('presencial') && city ? 'p' : '';
    return linha([t.slug, t.name, t.initials || '', (t.photo_url || '').startsWith(FOTOS) || t.origin !== 'importado' ? (t.photo_url || '') : '', t.specialty || '', (t.trainer_sports || []).map((x) => x.sport_slug), city, f + ((t.formats || []).includes('online') ? 'o' : ''), (t.published_at || '').slice(0, 10), t.origin || '', t.external_handle || ''], load().bySlug);
  } catch { return null; }
}

// todos os profissionais presenciais de uma cidade (qualquer esporte) e os esportes com gente ali
export function listaCidade(k) { return load().trainers.filter((t) => t.pres && slug(t.city) === k); }
export function esportesNaCidade(k) { const c = load(); return c.sports.map((s) => ({ ...s, n: (c.bySport.get(s.slug) || []).filter((t) => t.pres && slug(t.city) === k).length })).filter((s) => s.n > 0).sort((a, b) => b.n - a.n); }
export function cidades(min = 1) { return [...load().cities.values()].map((c) => ({ ...c, n: listaCidade(c.slug).length })).filter((c) => c.n >= min).sort((a, b) => b.n - a.n); }
