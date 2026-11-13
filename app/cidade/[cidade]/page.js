// "Treinadores em <cidade>": todos os esportes com atendimento presencial naquela cidade (plano SEO local, família "cidade").
// Sem profissional presencial ali, a página não existe (404). Online não entra como se fosse da cidade.
import { notFound } from 'next/navigation';
import Shell, { Cartao } from '../../../components/Shell.js';
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
        <p className="ssr-eyebrow">Cidade · presencial</p>
        <h1>Treinadores em {curta(cid.label)}</h1>
        <p>Quem atende presencialmente em {cid.label}. Escolha a modalidade para ver só quem trabalha com ela.</p>
        <p className="ssr-note"><b>{plural(itens.length, 'profissional', 'profissionais')}</b> com atendimento presencial informado nesta cidade.</p>
      </section>
      <section aria-labelledby="h-mod"><h2 id="h-mod">Modalidades em {curta(cid.label)}</h2>
        <ul className="ssr-chips">{esportes.map((s) => <li key={s.slug}><a href={'/treinadores/' + s.slug + '/' + k}>{s.label} <small>{s.n}</small></a></li>)}</ul></section>
      <section aria-labelledby="h-lista"><h2 id="h-lista">Profissionais em {curta(cid.label)}</h2>
        <ul className="ssr-list">{naPagina.map((t) => <Cartao key={t.id} t={t} />)}</ul>
        {paginas > 1 ? <nav className="ssr-pag" aria-label="Páginas da lista">
          <p className="ssr-note">Mostrando {ini + 1} a {ini + naPagina.length} de {itens.length.toLocaleString('pt-BR')} · página {pagina} de {paginas}</p>
          <p>{pagina > 1 ? <a rel="prev" href={base + (pagina > 2 ? '/pagina/' + (pagina - 1) : '')}>‹ Página anterior</a> : null}{pagina > 1 && pagina < paginas ? ' · ' : null}{pagina < paginas ? <a rel="next" href={base + '/pagina/' + (pagina + 1)}>Próxima página ›</a> : null}</p>
        </nav> : null}
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(trilha).replace(/</g, '\\u003c') }} />
    </Shell>
  );
}

export default async function Page({ params }) { const { cidade: k } = await params; return <Cidade k={k} pagina={1} />; }
