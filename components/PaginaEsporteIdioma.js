import { INTERNATIONAL_SITE as SITE } from '../lib/domains.js';
// Página "esporte [na cidade | online]" em inglês ou espanhol. Mesmos dados e regras da versão em português
// (sem treinador, a página não existe); só a interface muda de idioma.
import { notFound } from 'next/navigation';
import ShellIdioma, { CartaoIdioma, PaginacaoIdioma } from './ShellIdioma.js';
import { dados } from './PaginaEsporte.js';
import { lista, cidadesDo, esportes, curta, nomeDoUF, cidadesDoUF } from '../lib/catalogo.js';
import { t as tr, esporteNome, servico, idiomas, ok } from '../lib/i18n.js';

const POR_PAGINA = 36;

export function metadadosIdioma(l, esporteSlug, ondeSlug, pagina = 1) {
  const d = ok(l) ? dados(esporteSlug, ondeSlug, pagina) : null;
  if (!d) return { title: 'Not found', robots: { index: false } };
  const x = tr(l), nome = esporteNome(l, d.esp.slug, d.esp.label), serv = servico(l, d.esp.slug, d.esp.label);
  const lugar = d.cid ? curta(d.cid.label) : (d.uf ? nomeDoUF(d.uf) : '');
  const titulo = (d.online ? x.onlineOf(serv) : (lugar ? x.inCity(serv, lugar) : serv)) + (pagina > 1 ? x.page(pagina) : '');
  const descricao = d.online ? x.whoOnline(nome) : x.sportDesc(serv, d.itens.length, d.cid ? d.cid.label : (d.uf ? nomeDoUF(d.uf) : ''));
  return { title: titulo, description: descricao, alternates: { canonical: '/' + l + d.caminho, languages: idiomas(d.caminho) },
    openGraph: { siteName: '99coach', locale: x.locale, type: 'website', title: titulo, description: descricao, url: '/' + l + d.caminho, images: [{ url: '/img/og-99coach.png', width: 1200, height: 630, alt: '99coach' }] } };
}

export default function PaginaEsporteIdioma({ l, esporteSlug, ondeSlug, pagina = 1 }) {
  if (!ok(l)) notFound();
  const d = dados(esporteSlug, ondeSlug, pagina);
  if (!d) notFound();
  const x = tr(l), { esp, online, itens, paginas } = d;
  // estado entra como um "lugar" (nome e endereço próprios), com as mesmas regras da cidade
  const cid = d.cid || (d.uf ? { label: nomeDoUF(d.uf), slug: d.uf } : null);
  const nome = esporteNome(l, esp.slug, esp.label), serv = servico(l, esp.slug, esp.label);
  const h1 = online ? x.onlineOf(serv) : (cid ? x.inCity(serv, curta(cid.label)) : serv);
  const ini = (pagina - 1) * POR_PAGINA, naPagina = itens.slice(ini, ini + POR_PAGINA);
  const cidades = d.uf ? cidadesDoUF(d.uf, esp.slug) : cidadesDo(esp.slug, 1).filter((c) => !cid || c.slug !== cid.slug);
  const nOnline = lista(esp.slug, 'online').length;
  const outros = esportes().filter((s) => s.slug !== esp.slug).slice(0, 16);
  const pre = '/' + l + '/treinadores/';
  const ld = { '@context': 'https://schema.org', '@type': 'ItemList', name: h1, numberOfItems: itens.length, itemListElement: naPagina.map((t, i) => ({ '@type': 'ListItem', position: ini + i + 1, url: SITE + '/' + l + '/treinador/' + t.id, name: t.name })) };
  return (
    <ShellIdioma l={l} caminho={d.caminho}>
      <nav className="ssr-crumb" aria-label={x.youAreHere}>
        <a href={'/' + l}>{x.home}</a> › {cid || online ? <a href={pre + esp.slug}>{nome}</a> : <span>{nome}</span>}
        {cid ? <> › <span>{cid.label}</span></> : null}{online ? <> › <span>Online</span></> : null}
      </nav>
      <section className="ssr-hero">
        <p className="ssr-eyebrow">{x.sport}{cid ? ' · ' + cid.label + ' · ' + x.inPerson : (online ? ' · ' + x.online : ' · ' + x.allCities)}</p>
        <h1>{h1}</h1>
        <p>{online ? x.whoOnline(nome) : (cid ? x.whoCity(nome, curta(cid.label)) : x.whoAll)}</p>
        <p className="ssr-note">{x.found(itens.length)}</p>
      </section>
      <section aria-labelledby="h-lista"><h2 id="h-lista">{cid ? x.inCity(nome, curta(cid.label)) : (online ? x.onlineOf(nome) : x.proOf(nome))}</h2>
        <ul className="ssr-list">{naPagina.map((t) => <CartaoIdioma key={t.id} l={l} t={t} />)}</ul>
        <PaginacaoIdioma l={l} base={'/' + l + d.base} pagina={pagina} paginas={paginas} total={itens.length} ini={ini} n={naPagina.length} />
      </section>
      {!online && nOnline > 0 ? <section aria-labelledby="h-on"><h2 id="h-on">{x.alsoOnline}</h2><p><a href={pre + esp.slug + '/online'}>{x.nOnline(nOnline, nome)}</a></p></section> : null}
      {cidades.length ? <section aria-labelledby="h-cid"><h2 id="h-cid">{x.otherCities(nome)}</h2>
        <ul className="ssr-chips">{cidades.slice(0, 24).map((c) => <li key={c.slug}><a href={pre + esp.slug + '/' + c.slug}>{c.label} <small>{c.n}</small></a></li>)}</ul>
        {cidades.length > 24 ? <details className="ssr-mais"><summary>+ {cidades.length - 24}</summary><ul className="ssr-chips">{cidades.slice(24).map((c) => <li key={c.slug}><a href={pre + esp.slug + '/' + c.slug}>{c.label} <small>{c.n}</small></a></li>)}</ul></details> : null}</section> : null}
      <section aria-labelledby="h-out"><h2 id="h-out">{x.otherSports}</h2>
        <ul className="ssr-chips">{outros.filter((s) => !cid || lista(s.slug, cid.slug).length > 0).map((s) => <li key={s.slug}><a href={pre + s.slug + (cid ? '/' + cid.slug : '')}>{esporteNome(l, s.slug, s.label)}</a></li>)}</ul></section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
    </ShellIdioma>
  );
}
