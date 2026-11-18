import { domainRoute } from './lib/domain-routing.js';
// Endereços do site anterior (já indexados no Google) levam de vez ao endereço de hoje, com 301.
// Só roda para caminhos de um ou dois trechos que não são rotas do site atual (ver `config.matcher`).
import { NextResponse } from 'next/server';
import { esporte, cidadesDo, treinador, publicadoAgora } from './lib/catalogo.js';

const UFS = new Set('ac al ap am ba ce df es go ma mt ms mg pa pb pr pe pi rj rn rs ro rr sc sp se to'.split(' '));
// casos sem perfil equivalente com o mesmo identificador: o destino mais próximo
const FIXOS = {
  '/ze-londrina-pr': '/cidade/londrina-pr',
  '/programa/lpo-booster': '/treinadores/lpo',
  '/programa/conquistando-seu-primeiro-ring-muscle-up-rmu': '/treinadores/crossfit',
  '/programa/protocolo-beraldo-12-semanas-de-functional-fitness-powered-by-mtp': '/treinadores/crossfit'
};
const vai = (req, destino) => NextResponse.redirect(new URL(destino, req.url), 301);

export async function proxy(req) {
  const domain = domainRoute(req.headers.get('host') || req.nextUrl.host, req.nextUrl.pathname, req.nextUrl.search);
  if (domain?.redirect) return NextResponse.redirect(domain.redirect, 308);
  if (domain?.rewrite) return NextResponse.rewrite(new URL(domain.rewrite + req.nextUrl.search, req.url));
  if (/^\/(en|es)(\/|$)/.test(req.nextUrl.pathname) || req.nextUrl.pathname === '/' || /\.[a-z0-9]+$/i.test(req.nextUrl.pathname)) return NextResponse.next();
  const caminho = req.nextUrl.pathname.replace(/\/+$/, '') || '/';
  // filtro de estado antigo (?uf=pr) virou endereço próprio
  const ufq = (req.nextUrl.searchParams.get('uf') || '').toLowerCase();
  if (/^\/treinadores\/[a-z0-9-]+$/.test(caminho) && UFS.has(ufq)) return vai(req, caminho + '/' + ufq);
  if (FIXOS[caminho]) return vai(req, FIXOS[caminho]);
  if (/^\/(app|auth|treinadores|treinador|cidade|cidades|esportes|estado|buscar)(\/|$)/.test(caminho)) return NextResponse.next();
  const p = caminho.split('/').filter(Boolean);
  if (!p.every((x) => /^[a-z0-9-]{1,120}$/.test(x))) return NextResponse.next();
  if (p.length === 1) {
    if (esporte(p[0])) return vai(req, '/treinadores/' + p[0]);
    // perfil duplicado (mesmo nome e cidade) vai direto ao perfil principal: um salto só, sem passar por página canônica de outra
    const t = p[0].length > 2 ? treinador(p[0]) : null;
    if (t) return vai(req, '/treinador/' + (t.canon || t.id));
    if (p[0].length > 2 && (await publicadoAgora(p[0]))) return vai(req, '/treinador/' + p[0]);
    return NextResponse.next();
  }
  if (p.length === 2 && esporte(p[0])) {
    const [e, onde] = p;
    if (onde === 'online') return vai(req, '/treinadores/' + e + '/online');
    if (UFS.has(onde)) return vai(req, '/treinadores/' + e + '/' + onde);
    // cidade sem profissional presencial dessa modalidade hoje: lista nacional da modalidade (nunca uma página inexistente)
    return vai(req, cidadesDo(e, 1).some((c) => c.slug === onde) ? '/treinadores/' + e + '/' + onde : '/treinadores/' + e);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next|api/|shell/|img/|fonts/|css/|js/|data/|dados/).*)'] };
