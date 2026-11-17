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
  const caminho = req.nextUrl.pathname.replace(/\/+$/, '') || '/';
  if (FIXOS[caminho]) return vai(req, FIXOS[caminho]);
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
    if (UFS.has(onde)) return vai(req, '/treinadores/' + e + '?uf=' + onde);
    // cidade sem profissional presencial dessa modalidade hoje: lista nacional da modalidade (nunca uma página inexistente)
    return vai(req, cidadesDo(e, 1).some((c) => c.slug === onde) ? '/treinadores/' + e + '/' + onde : '/treinadores/' + e);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api|app$|app/|auth|dados|shell|img|fonts|css|js|data|treinadores|treinador/|cidade/|cidades$|buscar|en$|en/|es$|es/|sitemap|robots|llms|manifest|icon|apple-icon|favicon|next-loader|og-)[^.]+)']
};
