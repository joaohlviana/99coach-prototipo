// "Treinadores no <estado>": todas as modalidades e cidades com atendimento presencial naquele estado.
// Sem profissional presencial no estado, a página não existe (404). Liga as páginas de cidade e de modalidade × estado.
import { notFound } from 'next/navigation';
import Shell, { Cartao } from '../../../../components/Shell.js';
import { ehUF, nomeDoUF, noUF, listaUF, cidadesDoUF, esportesNoUF, estadosDo, plural, SITE, resumo } from '../../../../lib/catalogo.js';

export const revalidate = 3600;
export const dynamicParams = true;
export async function generateStaticParams() { return []; }
const POR_PAGINA = 36;

function dados(k) {
  if (!ehUF(k)) return null;
  const itens = listaUF(k); if (!itens.length) return null;
  return { itens, cidades: cidadesDoUF(k), esportes: esportesNoUF(k), nome: nomeDoUF(k), no: noUF(k), base: '/estado/' + k };
}

export async function generateMetadata({ params }) {
  const { uf: k } = await params; const d = dados(k);
  if (!d) return { title: 'Página não encontrada', robots: { index: false } };
  const titulo = `Personal trainer e aulas ${d.no}`;
  const descricao = resumo(`Personal trainer e aulas ${d.no}: ${plural(d.itens.length, 'profissional atende', 'profissionais atendem')} presencialmente em ${plural(d.cidades.length, 'cidade', 'cidades')}. ${d.esportes.slice(0, 5).map((x) => x.label).join(', ')} e mais.`);
  return { title: titulo, description: descricao, alternates: { canonical: d.base }, openGraph: { siteName: '99coach', locale: 'pt_BR', type: 'website', title: titulo, description: descricao, url: d.base, images: [{ url: '/img/og-99coach.png', width: 1200, height: 630, alt: '99coach' }] } };
}

export default async function Estado({ params }) {
  const { uf: k } = await params; const d = dados(k);
  if (!d) notFound();
  const { itens, cidades, esportes, nome, no, base } = d;
  const outros = estadosDo('').filter((e) => e.uf !== k);
  const trilha = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Início', item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: 'Cidades', item: SITE + '/cidades' }, { '@type': 'ListItem', position: 3, name: nome, item: SITE + base }] };
  return (
    <Shell soServidor onde={{ label: nome, chave: 'uf-' + k }}>
      <nav className="ssr-crumb" aria-label="Você está em"><a href="/">Início</a> › <a href="/cidades">Cidades</a> › <span>{nome}</span></nav>
      <section className="ssr-hero">
        <h1>Personal trainer e aulas {no}</h1>
        <p>{plural(itens.length, 'profissional atende', 'profissionais atendem')} presencialmente em {plural(cidades.length, 'cidade', 'cidades')} {no}.</p>
      </section>
      <section aria-labelledby="h-mod"><h2 id="h-mod">Modalidades {no}</h2>
        <ul className="ssr-chips">{esportes.map((s) => <li key={s.slug}><a href={'/treinadores/' + s.slug + '/' + k}>{s.label} <small>{s.n}</small></a></li>)}</ul></section>
      <section aria-labelledby="h-cid"><h2 id="h-cid">Cidades {no}</h2>
        <ul className="ssr-chips">{cidades.slice(0, 40).map((c) => <li key={c.slug}><a href={'/cidade/' + c.slug}>{c.label} <small>{c.n}</small></a></li>)}</ul>
        {cidades.length > 40 ? <details className="ssr-mais"><summary>Ver mais {cidades.length - 40} cidades</summary><ul className="ssr-chips">{cidades.slice(40).map((c) => <li key={c.slug}><a href={'/cidade/' + c.slug}>{c.label} <small>{c.n}</small></a></li>)}</ul></details> : null}</section>
      <section aria-labelledby="h-lista"><h2 id="h-lista">Profissionais {no}</h2>
        <ul className="ssr-list">{itens.slice(0, POR_PAGINA).map((t) => <Cartao key={t.id} t={t} />)}</ul>
        {itens.length > POR_PAGINA ? <p className="ssr-note">Mostrando {POR_PAGINA} de {itens.length}. Escolha uma cidade ou modalidade acima para ver todos.</p> : null}
      </section>
      <section aria-labelledby="h-uf"><h2 id="h-uf">Outros estados</h2>
        <ul className="ssr-chips">{outros.map((e) => <li key={e.uf}><a href={'/estado/' + e.uf}>{e.nome} <small>{e.n}</small></a></li>)}</ul></section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(trilha).replace(/</g, '\\u003c') }} />
    </Shell>
  );
}
