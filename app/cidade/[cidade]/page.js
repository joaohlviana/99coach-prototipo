// "Treinadores em <cidade>": todos os esportes com atendimento presencial naquela cidade (plano SEO local, família "cidade").
// Sem profissional presencial ali, a página não existe (404). Online não entra como se fosse da cidade.
import { notFound } from 'next/navigation';
import Shell, { Cartao, Paginacao } from '../../../components/Shell.js';
import { cidade, listaCidade, esportesNaCidade, plural, curta, nomeUF, SITE, cidadeUF, caber, resumo } from '../../../lib/catalogo.js';

export const revalidate = 86400;
export const dynamicParams = true;
export async function generateStaticParams() { return []; }
const POR_PAGINA = 36;

export function dados(k, pagina) {
  const cid = cidade(k); if (!cid) return null;
  const itens = listaCidade(k); if (!itens.length) return null;
  const paginas = Math.max(1, Math.ceil(itens.length / POR_PAGINA));
  if (!(pagina >= 1 && pagina <= paginas)) return null;
  return { cid, itens, paginas, esportes: esportesNaCidade(k), base: '/cidade/' + k };
}

export function meta(k, p) {
  const d = dados(k, p);
  if (!d) return { title: 'Página não encontrada', robots: { index: false } };
  const titulo = caber(`Personal trainer e aulas em ${cidadeUF(d.cid.label)}`, `Personal trainer e aulas em ${curta(d.cid.label)}`, `Treinadores em ${curta(d.cid.label)}`) + (p > 1 ? ` (página ${p})` : '');
  const descricao = resumo(`Personal trainer e aulas em ${d.cid.label}: ${plural(d.itens.length, 'profissional atende', 'profissionais atendem')} presencialmente. ${d.esportes.slice(0, 5).map((x) => x.label).join(', ')} e mais.`);
  const url = d.base + (p > 1 ? '/pagina/' + p : '');
  return { title: titulo, description: descricao, alternates: { canonical: url }, openGraph: { siteName: '99coach', locale: 'pt_BR', type: 'website', title: titulo, description: descricao, url, images: [{ url: '/img/og-99coach.png', width: 1200, height: 630, alt: '99coach' }] } };
}
export async function generateMetadata({ params }) { const { cidade: k } = await params; return meta(k, 1); }

export function Cidade({ k, pagina }) {
  const d = dados(k, pagina);
  if (!d) notFound();
  const { cid, itens, paginas, esportes, base } = d;
  const ini = (pagina - 1) * POR_PAGINA, naPagina = itens.slice(ini, ini + POR_PAGINA);
  const trilha = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Início', item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: cid.label, item: SITE + base }] };
  return (
    <Shell soServidor>
      <nav className="ssr-crumb" aria-label="Você está em"><a href="/">Início</a> › <span>{cid.label}</span></nav>
      <section className="ssr-hero">
        <h1>Personal trainer e aulas em {curta(cid.label)}</h1>
        <p>{plural(itens.length, 'profissional atende', 'profissionais atendem')} presencialmente em {cid.label}.</p>
        
      </section>
      <section aria-labelledby="h-mod"><h2 id="h-mod">Modalidades em {curta(cid.label)}</h2>
        <ul className="ssr-tiles">{esportes.filter((s) => s.foto).slice(0, 8).map((s) => <li key={s.slug}><a href={'/treinadores/' + s.slug + '/' + k}><img src={s.foto} alt="" loading="lazy" decoding="async" width="320" height="200" /><b>{s.label}</b><small>{plural(s.n, 'profissional', 'profissionais')}</small></a></li>)}</ul>
        <ul className="ssr-chips" style={{ marginTop: 12 }}>{esportes.filter((s, i) => !s.foto || esportes.filter((x) => x.foto).indexOf(s) >= 8).map((s) => <li key={s.slug}><a href={'/treinadores/' + s.slug + '/' + k}>{s.label} <small>{s.n}</small></a></li>)}</ul></section>
      <section aria-labelledby="h-lista"><h2 id="h-lista">Profissionais em {curta(cid.label)}</h2>
        <ul className="ssr-list">{naPagina.map((t) => <Cartao key={t.id} t={t} />)}</ul>
        <Paginacao base={base} pagina={pagina} paginas={paginas} total={itens.length} ini={ini} n={naPagina.length} />
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(trilha).replace(/</g, '\\u003c') }} />
    </Shell>
  );
}

export default async function Page({ params }) { const { cidade: k } = await params; return <Cidade k={k} pagina={1} />; }
