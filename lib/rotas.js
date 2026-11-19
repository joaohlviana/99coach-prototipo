// Endereços por idioma. O português é a base (www.99coach.com.br, sem prefixo). Inglês e espanhol usam os
// mesmos caminhos com os trechos fixos e o nome da modalidade traduzidos; nome de pessoa e de cidade não mudam.
//   pt: /treinador/valentin-quiroga-041f8982     /treinadores/musculacao/rio-de-janeiro-rj
//   en: /coach/valentin-quiroga-041f8982         /coaches/strength-training/rio-de-janeiro-rj
//   es: /es/entrenador/valentin-quiroga-041f8982 /es/entrenadores/musculacion/rio-de-janeiro-rj
// Com INTL_URL (ex.: https://www.99coach.com), o inglês fica na raiz desse domínio e o espanhol em /es.
// Sem ela (homologação, ou antes de o .com estar no ar), os dois ficam no mesmo domínio em /en e /es.
import { esporteNome } from './i18n.js';

export const SEG = {
  en: { treinador: 'coach', treinadores: 'coaches', cidade: 'city', estado: 'state', cidades: 'cities', esportes: 'sports', buscar: 'search', worldwide: 'worldwide', ajuda: 'help', 'sou-treinador': 'for-coaches', pagina: 'page' },
  es: { treinador: 'entrenador', treinadores: 'entrenadores', cidade: 'ciudad', estado: 'estado', cidades: 'ciudades', esportes: 'deportes', buscar: 'buscar', worldwide: 'worldwide', ajuda: 'ayuda', 'sou-treinador': 'soy-entrenador', pagina: 'pagina' }
};
const slugify = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const VOLTA = { en: {}, es: {} };
for (const l of ['en', 'es']) for (const [pt, x] of Object.entries(SEG[l])) VOLTA[l][x] = pt;
// modalidade: slug traduzido a partir do nome traduzido (strength-training, musculacion); sem tradução, fica o do português
const espSlug = (l, pt) => { const n = esporteNome(l, pt, ''); return n ? slugify(n) : pt; };
const espVolta = {};
const espPt = (l, x, todos) => {
  const k = l + ':' + x;
  if (!(k in espVolta)) espVolta[k] = (todos || []).find((pt) => espSlug(l, pt) === x) || null;
  return espVolta[k] || x;
};

const INTL = (process.env.INTL_URL || '').replace(/\/+$/, '');
export const intl = () => INTL;
export const intlHost = () => { try { return INTL ? new URL(INTL).host : ''; } catch { return ''; } };

// caminho em português -> caminho no idioma, sem prefixo de idioma
export function traduz(l, pt) {
  if (l === 'pt' || !SEG[l]) return pt;
  const p = pt.split('/').filter(Boolean);
  if (!p.length) return '/';
  const out = p.map((x, i) => (i === 0 || (i >= 2 && x === 'pagina')) && SEG[l][x] ? SEG[l][x] : x);
  if (p[0] === 'treinadores' && p[1]) out[1] = espSlug(l, p[1]);
  return '/' + out.join('/');
}
// caminho no idioma (sem prefixo) -> caminho em português; null se o primeiro trecho não for conhecido
export function volta(l, caminho, esportesPt) {
  const p = caminho.split('/').filter(Boolean);
  if (!p.length) return '/';
  const pt0 = VOLTA[l][p[0]];
  if (!pt0) return null;
  const out = p.map((x, i) => (i >= 2 && VOLTA[l][x] === 'pagina') ? 'pagina' : x); out[0] = pt0;
  if (pt0 === 'treinadores' && p[1]) out[1] = espPt(l, p[1], esportesPt);
  return '/' + out.join('/');
}
// link dentro do site no idioma (relativo ao domínio daquele idioma)
export function href(l, pt) {
  if (l === 'pt') return pt;
  const t = traduz(l, pt), pre = INTL ? (l === 'es' ? '/es' : '') : '/' + l;
  return (pre + (t === '/' ? '' : t)) || '/';
}
// endereço completo (canônica, hreflang, sitemap, dados estruturados)
export function abs(l, pt, site) {
  if (l === 'pt') return site + (pt === '/' ? '/' : pt);
  return (INTL || site) + href(l, pt);
}
// as três versões da mesma página + a padrão (português, que é o idioma do produto)
export function versoes(pt, site) {
  return { 'pt-BR': abs('pt', pt, site), en: abs('en', pt, site), es: abs('es', pt, site), 'x-default': abs('pt', pt, site) };
}
// o mesmo mapa para o navegador (links de idioma e o app em inglês/espanhol): trechos, modalidades e domínio
export function mapaCliente(slugsPt) {
  const esp = { en: {}, es: {} };
  for (const l of ['en', 'es']) for (const pt of slugsPt) { const x = espSlug(l, pt); if (x !== pt) esp[l][pt] = x; }
  return { seg: SEG, esp, intl: INTL };
}
