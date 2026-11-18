import { INTERNATIONAL_SITE as SITE } from '../../../../lib/domains.js';
// "Coaches in <city>" em inglês ou espanhol: mesmos dados e regras da versão em português (sem profissional presencial, 404).
import { notFound, permanentRedirect } from 'next/navigation';
import ShellIdioma, { CartaoIdioma, PaginacaoIdioma } from '../../../../components/ShellIdioma.js';
import { dados } from '../../../(br)/cidade/[cidade]/page.js';
import { curta, resumo, cidadesProximas } from '../../../../lib/catalogo.js';
import { ok, t as tr, esporteNome, idiomas } from '../../../../lib/i18n.js';

export const revalidate = 3600;
export const dynamicParams = true;
export async function generateStaticParams() { return []; }
const POR_PAGINA = 36;
const L = {
  en: { h1: (c) => 'Personal trainers and coaches in ' + c, p: (n, c) => n + (n === 1 ? ' professional coaches' : ' professionals coach') + ' in person in ' + c + '.', mods: (c) => 'Sports in ' + c, pros: (c) => 'Professionals in ' + c, near: (c) => 'Cities near ' + c, n: (n) => n + (n === 1 ? ' professional' : ' professionals'), loc: 'en-US' },
  es: { h1: (c) => 'Entrenadores personales y profesores en ' + c, p: (n, c) => n + (n === 1 ? ' profesional atiende' : ' profesionales atienden') + ' presencialmente en ' + c + '.', mods: (c) => 'Deportes en ' + c, pros: (c) => 'Profesionales en ' + c, near: (c) => 'Ciudades cerca de ' + c, n: (n) => n + (n === 1 ? ' profesional' : ' profesionales'), loc: 'es-ES' }
};

export async function generateMetadata({ params }) {
  const { lang: l, cidade: k, n } = await params; const d = ok(l) ? dados(k, n === undefined ? 1 : Number(n)) : null;
  if (!d) return { title: 'Not found', robots: { index: false } };
  const x = tr(l), y = L[l], titulo = y.h1(curta(d.cid.label)) + (Number(n) > 1 ? x.page(Number(n)) : '');
  const descricao = resumo(y.p(d.itens.length, d.cid.label) + ' ' + d.esportes.slice(0, 5).map((s) => esporteNome(l, s.slug, s.label)).join(', ') + '.');
  return { title: titulo, description: descricao, alternates: { canonical: '/' + l + d.base + (n ? '/pagina/' + Number(n) : ''), languages: idiomas(d.base + (n ? '/pagina/' + Number(n) : '')) },
    openGraph: { siteName: '99coach', locale: x.locale, type: 'website', title: titulo, description: descricao, url: '/' + l + d.base + (n ? '/pagina/' + Number(n) : ''), images: [{ url: '/img/og-99coach.png', width: 1200, height: 630, alt: '99coach' }] } };
}

export default async function Page({ params }) {
  const { lang: l, cidade: k, n } = await params; if (!ok(l)) notFound();
  if (n !== undefined && !/^[1-9][0-9]*$/.test(n)) notFound();
  if (n === '1') permanentRedirect('/' + l + '/cidade/' + k);
  const d = dados(k, n === undefined ? 1 : Number(n)); if (!d) notFound();
  const x = tr(l), y = L[l], { cid, itens, paginas, esportes, base } = d, c = curta(cid.label);
  const pagina = n === undefined ? 1 : Number(n), ini = (pagina - 1) * POR_PAGINA;
  const naPagina = itens.slice(ini, ini + POR_PAGINA), pre = '/' + l + '/treinadores/', perto = cidadesProximas(k);
  const trilha = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: x.home, item: SITE + '/' + l }, { '@type': 'ListItem', position: 2, name: cid.label, item: SITE + '/' + l + base }] };
  return (
    <ShellIdioma l={l} caminho={base + (pagina > 1 ? '/pagina/' + pagina : '')}>
      <nav className="ssr-crumb" aria-label={x.youAreHere}><a href={'/' + l}>{x.home}</a> › <span>{cid.label}</span></nav>
      <section className="ssr-hero"><h1>{y.h1(c)}</h1><p>{y.p(itens.length, cid.label)}</p></section>
      <section aria-labelledby="h-mod"><h2 id="h-mod">{y.mods(c)}</h2>
        <ul className="ssr-chips">{esportes.map((s) => <li key={s.slug}><a href={pre + s.slug + '/' + k}>{esporteNome(l, s.slug, s.label)} <small>{s.n}</small></a></li>)}</ul></section>
      <section aria-labelledby="h-lista"><h2 id="h-lista">{y.pros(c)}</h2>
        <ul className="ssr-list">{naPagina.map((t) => <CartaoIdioma key={t.id} l={l} t={t} />)}</ul>
        <PaginacaoIdioma l={l} base={'/' + l + base} pagina={pagina} paginas={paginas} total={itens.length} ini={ini} n={naPagina.length} />
      </section>
      {perto.length ? <section aria-labelledby="h-perto"><h2 id="h-perto">{y.near(c)}</h2>
        <ul className="ssr-chips">{perto.map((p) => <li key={p.slug}><a href={'/' + l + '/cidade/' + p.slug}>{p.label} <small>~{p.km} km · {y.n(p.n)}</small></a></li>)}</ul></section> : null}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(trilha).replace(/</g, '\\u003c') }} />
    </ShellIdioma>
  );
}
