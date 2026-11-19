// Endereços do site anterior (já indexados no Google) levam de vez ao endereço de hoje, com 301.
// Só roda para caminhos de um ou dois trechos que não são rotas do site atual (ver `config.matcher`).
import { NextResponse } from 'next/server';
import { esporte, cidadesDo, treinador, publicadoAgora, esportes, SITE } from './lib/catalogo.js';
import { volta, traduz, href as hrefIdioma, intl, intlHost, SEG } from './lib/rotas.js';

const UFS = new Set('ac al ap am ba ce df es go ma mt ms mg pa pb pr pe pi rj rn rs ro rr sc sp se to'.split(' '));
// casos sem perfil equivalente com o mesmo identificador: o destino mais próximo
const FIXOS = {
  '/ze-londrina-pr': '/cidade/londrina-pr',
  '/programa/lpo-booster': '/treinadores/lpo',
  '/programa/conquistando-seu-primeiro-ring-muscle-up-rmu': '/treinadores/crossfit',
  '/programa/protocolo-beraldo-12-semanas-de-functional-fitness-powered-by-mtp': '/treinadores/crossfit'
};
const vai = (req, destino) => NextResponse.redirect(new URL(destino, req.url), 301);
const dentro = (req, destino) => { const u = req.nextUrl.clone(); u.pathname = destino; return NextResponse.rewrite(u); };
// trechos que não são páginas (app, arquivos, sitemaps): passam direto em qualquer domínio
const SISTEMA = /^\/(_next|api|app|auth|dados|shell|img|fonts|css|js|data|sitemap|robots|llms|manifest|icon|apple-icon|favicon|next-loader|og-|geo|\.well-known)/;
// primeiro trecho das páginas em português (no domínio internacional, vão para o .com.br)
const PT = /^\/(treinador|treinadores|cidade|cidades|estado|esportes|buscar|worldwide|ajuda|sou-treinador|termos|privacidade|cookies)(\/|$)/;
const slugsPt = () => esportes().map((e) => e.slug);
// /en/... ou /es/... (caminho já sem o prefixo): devolve o caminho interno /en/<português> ou um 301
function idioma(req, l, resto) {
  const r = resto || '/';
  const x = req.nextUrl.search;
  // endereço antigo com trechos em português (/en/treinador/x): 301 para o traduzido
  if (r !== '/' && PT.test(r) && !volta(l, r, slugsPt())) { const d = hrefIdioma(l, r) + x; return intl() && req.headers.get('host')?.split(':')[0] !== intlHost() ? NextResponse.redirect(intl() + d, 301) : vai(req, d); }
  const pt = volta(l, r, slugsPt());
  if (pt === null) return null;
  // com o domínio internacional no ar, o .com.br não serve inglês nem espanhol: 301 para lá
  if (intl() && req.headers.get('host')?.split(':')[0] !== intlHost()) return NextResponse.redirect(intl() + hrefIdioma(l, pt) + x, 301);
  return dentro(req, '/' + l + (pt === '/' ? '' : pt));
}

export async function proxy(req) {
  const caminho = req.nextUrl.pathname.replace(/\/+$/, '') || '/';
  if (SISTEMA.test(caminho)) return NextResponse.next();
  const host = (req.headers.get('host') || '').split(':')[0];
  // domínio internacional (www.99coach.com): inglês na raiz, espanhol em /es; páginas em português vão para o .com.br
  if (intlHost() && (host === intlHost() || host === intlHost().replace(/^www\./, ''))) {
    if (host !== intlHost()) return NextResponse.redirect(intl() + caminho + req.nextUrl.search, 308);
    if (/^\/en(\/|$)/.test(caminho)) return vai(req, (caminho.slice(3) || '/') + req.nextUrl.search);
    if (/^\/es(\/|$)/.test(caminho)) return idioma(req, 'es', caminho.slice(3)) || NextResponse.next();
    if (caminho !== '/' && PT.test(caminho) && volta('en', caminho, slugsPt()) === null) return NextResponse.redirect(SITE + caminho + req.nextUrl.search, 301);
    return idioma(req, 'en', caminho) || NextResponse.next();
  }
  const mi = /^\/(en|es)(\/.*)?$/.exec(caminho);
  if (mi) return idioma(req, mi[1], mi[2] || '/') || NextResponse.next();
  // daqui para baixo, só caminhos que não são rotas do site atual (endereços do site anterior)
  if (/^\/(treinadores|treinador\/|cidade\/|cidades$|esportes$|estado\/|buscar|worldwide|ajuda|sou-treinador)/.test(caminho) && !req.nextUrl.searchParams.get('uf')) return NextResponse.next();
  // filtro de estado antigo (?uf=pr) virou endereço próprio
  const ufq = (req.nextUrl.searchParams.get('uf') || '').toLowerCase();
  if (/^\/treinadores\/[a-z0-9-]+$/.test(caminho) && UFS.has(ufq)) return vai(req, caminho + '/' + ufq);
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
    if (UFS.has(onde)) return vai(req, '/treinadores/' + e + '/' + onde);
    // cidade sem profissional presencial dessa modalidade hoje: lista nacional da modalidade (nunca uma página inexistente)
    return vai(req, cidadesDo(e, 1).some((c) => c.slug === onde) ? '/treinadores/' + e + '/' + onde : '/treinadores/' + e);
  }
  return NextResponse.next();
}

export const config = {
  // todas as páginas (o domínio internacional precisa passar por aqui); arquivos com extensão e /_next ficam de fora
  matcher: ['/', '/((?!_next|.*\\.[a-z0-9]+$).*)']
};
