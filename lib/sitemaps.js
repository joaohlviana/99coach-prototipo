// Sitemaps com os nomes que o site anterior usava (já cadastrados no Google). Cada um lista os endereços de hoje.
import { SITE, esportes, cidadesDo, cidades, lista, todos, atualizadoEm, estadosDo } from './catalogo.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const dia = (d) => { try { return new Date(d).toISOString().slice(0, 10); } catch { return ''; } };
export function xml(urls) {
  const corpo = urls.map((u) => `<url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${dia(u.lastmod)}</lastmod>` : ''}</url>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${corpo}</urlset>`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400' } });
}
const quando = () => atualizadoEm() || new Date().toISOString();
export const estaticas = () => [{ loc: SITE + '/', lastmod: quando() }, { loc: SITE + '/cidades', lastmod: quando() }, { loc: SITE + '/esportes', lastmod: quando() }, { loc: SITE + '/buscar', lastmod: quando() }, { loc: SITE + '/en', lastmod: quando() }, { loc: SITE + '/es', lastmod: quando() }];
export const porEsporte = () => esportes().flatMap((s) => [{ loc: `${SITE}/treinadores/${s.slug}`, lastmod: quando() }].concat(lista(s.slug, 'online').length ? [{ loc: `${SITE}/treinadores/${s.slug}/online`, lastmod: quando() }] : []));
export const porFiltro = () => esportes().flatMap((s) => cidadesDo(s.slug, 1).map((c) => ({ loc: `${SITE}/treinadores/${s.slug}/${c.slug}`, lastmod: quando() }))).concat(cidades(1).map((c) => ({ loc: `${SITE}/cidade/${c.slug}`, lastmod: quando() })));
export const porPerfil = () => todos().filter((t) => !t.canon).map((t) => ({ loc: `${SITE}/treinador/${t.id}`, lastmod: t.pub || quando() }));

// modalidade × estado e página do estado: só onde há profissional presencial
export const porEstado = () => esportes().flatMap((s) => estadosDo(s.slug).map((e) => ({ loc: `${SITE}/treinadores/${s.slug}/${e.uf}`, lastmod: quando() })))
  .concat(estadosDo('').map((e) => ({ loc: `${SITE}/estado/${e.uf}`, lastmod: quando() })));
// versões em inglês e espanhol das páginas que têm tradução (início, modalidade, modalidade × lugar, cidade e perfil)
const TRADUZ = /^\/(treinadores|treinador|cidade)\//;
export const porIdioma = (l) => [{ loc: `${SITE}/${l}`, lastmod: quando() }]
  .concat([...porEsporte(), ...porFiltro(), ...porEstado().filter((u) => !/\/estado\//.test(u.loc)), ...porPerfil()]
    .filter((u) => TRADUZ.test(u.loc.slice(SITE.length))).map((u) => ({ loc: SITE + '/' + l + u.loc.slice(SITE.length), lastmod: u.lastmod })));
// índice: lista os sitemaps (o Google lê cada um; cada arquivo fica bem abaixo do limite de 50 mil endereços)
export const NOMES = ['sitemap-static.xml', 'sitemap-sports.xml', 'sitemap-filters.xml', 'sitemap-states.xml', 'sitemap-trainers.xml', 'sitemap-programs.xml', 'sitemap-en.xml', 'sitemap-es.xml'];
export function indice() {
  const corpo = NOMES.map((n) => `<sitemap><loc>${SITE}/${n}</loc><lastmod>${String(quando()).slice(0, 10)}</lastmod></sitemap>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${corpo}</sitemapindex>`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400' } });
}
