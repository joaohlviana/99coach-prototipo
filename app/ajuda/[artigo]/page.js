// Artigo da Central de ajuda (termos, privacidade, pagamentos...): página pública indexável, com o mesmo texto do app.
import { notFound } from 'next/navigation';
import Shell from '../../../components/Shell.js';
import { SITE } from '../../../lib/catalogo.js';
import { artigos, artigo, CATS, destino } from '../../../lib/ajuda.js';

export const revalidate = 86400;
export const dynamicParams = false;
export function generateStaticParams() { return artigos().map((a) => ({ artigo: a.id })); }

export async function generateMetadata({ params }) {
  const a = artigo((await params).artigo);
  if (!a) return { title: 'Página não encontrada' };
  return { title: a.title, description: a.lead, alternates: { canonical: a.url } };
}

export default async function Artigo({ params }) {
  const a = artigo((await params).artigo);
  if (!a) notFound();
  const outros = artigos().filter((x) => x.id !== a.id);
  const trilha = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Início', item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: 'Central de ajuda', item: SITE + '/ajuda' }, { '@type': 'ListItem', position: 3, name: a.title, item: SITE + a.url }] };
  return (
    <Shell soServidor>
      <nav className="ssr-crumb" aria-label="Você está em"><a href="/">Início</a> › <a href="/ajuda">Central de ajuda</a> › <span>{a.title}</span></nav>
      <article>
        <section className="ssr-hero">
          <h1>{a.title}</h1>
          <p>{a.lead}</p>
          <p><small>{CATS[a.cat] || ''} · Versão vigente de {a.version} · Brasil</small></p>
        </section>
        {a.sections.map((s) => <section key={s.id} id={s.id} aria-labelledby={'h-' + s.id}><h2 id={'h-' + s.id}>{s.h}</h2><p>{s.body}</p></section>)}
        {a.links && a.links.length ? <section aria-labelledby="h-links"><h2 id="h-links">Veja também</h2><ul className="ssr-chips">{a.links.map((l) => <li key={l[0]}><a href={destino(l[1])}>{l[0]}</a></li>)}</ul></section> : null}
      </article>
      <section aria-labelledby="h-outros"><h2 id="h-outros">Outros artigos</h2>
        <ul className="ssr-chips">{outros.map((x) => <li key={x.id}><a href={x.url}>{x.title}</a></li>)}</ul>
        <p style={{ marginTop: 16 }}>Precisa de ajuda com um caso seu? <a href="/app#publico-ajuda">Fale com o suporte</a>.</p>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(trilha).replace(/</g, '\\u003c') }} />
    </Shell>
  );
}
