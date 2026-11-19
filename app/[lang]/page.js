// Página inicial em inglês ou espanhol (/en, /es).
import { notFound, permanentRedirect } from 'next/navigation';
import ShellIdioma from '../../components/ShellIdioma.js';
import { SITE, esportes, cidadesDo, todos, curta, esporte, treinador, publicadoAgora } from '../../lib/catalogo.js';
import { ok, t as tr, esporteNome } from '../../lib/i18n.js';
import { href as hr, abs, versoes } from '../../lib/rotas.js';

export const revalidate = 3600;
export const dynamicParams = true;
export async function generateStaticParams() { return [{ lang: 'en' }, { lang: 'es' }]; }
export async function generateMetadata({ params }) {
  const { lang: l } = await params; if (!ok(l)) return { title: 'Not found', robots: { index: false } };
  const x = tr(l);
  return { title: { absolute: x.homeTitle + ' | 99coach' }, description: x.homeDesc, alternates: { canonical: abs(l, '/', SITE), languages: versoes('/', SITE) }, openGraph: { siteName: '99coach', locale: x.locale, type: 'website', title: x.homeTitle, description: x.homeDesc, url: abs(l, '/', SITE), images: [{ url: '/img/og-99coach.png', width: 1200, height: 630, alt: '99coach' }] } };
}

export default async function Home({ params }) {
  const { lang: l } = await params;
  if (!ok(l)) {
    // endereços do site anterior: /{esporte} e /{perfil} ficavam na raiz; levam de vez ao endereço novo
    if (esporte(l)) permanentRedirect('/treinadores/' + l);
    if (/^[a-z0-9-]{2,120}$/.test(l) && (treinador(l) || (await publicadoAgora(l)))) permanentRedirect('/treinador/' + l);
    notFound();
  }
  const x = tr(l), esp = esportes(), cidades = cidadesDo('musculacao', 5).slice(0, 18);
  return (
    <ShellIdioma l={l} route={{ name: 'home', params: {} }}>
      <section className="ssr-hero"><h1>{x.heroH1}</h1><p>{x.heroP}</p><p className="ssr-note">{x.inCatalog(todos().length)}</p></section>
      <section id="sports" aria-labelledby="h-esp"><h2 id="h-esp">{x.sports}</h2>
        <ul className="ssr-chips">{esp.map((s) => <li key={s.slug}><a href={hr(l, '/treinadores/' + s.slug)}>{esporteNome(l, s.slug, s.label)} <small>{s.n.toLocaleString(l === 'en' ? 'en-US' : 'es-ES')}</small></a></li>)}</ul></section>
      <section aria-labelledby="h-cid"><h2 id="h-cid">{x.byCity}</h2>
        <ul className="ssr-chips">{cidades.map((c) => <li key={c.slug}><a href={hr(l, '/treinadores/musculacao/' + c.slug)}>{x.ptIn(curta(c.label))}</a></li>)}</ul></section>
      <section aria-labelledby="h-como"><h2 id="h-como">{x.how}</h2>
        <ol className="ssr-steps">{[x.how1, x.how2, x.how3].map((s, i) => <li key={i}><b>{s[0]}</b>{s[1]}</li>)}</ol></section>
    </ShellIdioma>
  );
}
