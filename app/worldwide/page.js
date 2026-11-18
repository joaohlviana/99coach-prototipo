// Worldwide: treinadores fora do Brasil, por país. Página pública indexável; no Brasil as páginas por cidade/estado continuam só do Brasil.
import Shell, { Cartao } from '../../components/Shell.js';
import { mundo, plural, SITE } from '../../lib/catalogo.js';

export const revalidate = 3600;
export const metadata = {
  title: 'Worldwide: personal trainers fora do Brasil',
  description: 'Personal trainers e professores em outros países: Estados Unidos, Reino Unido, Portugal, Canadá, Austrália e mais. Perfis montados com dados públicos.',
  alternates: { canonical: '/worldwide' }
};

export default function Worldwide() {
  const G = mundo();
  const total = G.reduce((n, g) => n + g.itens.length, 0);
  const trilha = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Início', item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: 'Worldwide', item: SITE + '/worldwide' }] };
  return (
    <Shell soServidor>
      <nav className="ssr-crumb" aria-label="Você está em"><a href="/">Início</a> › <span>Worldwide</span></nav>
      <section className="ssr-hero">
        <h1>Worldwide</h1>
        <p>{total ? plural(total, 'treinador', 'treinadores') + ' fora do Brasil, em ' + plural(G.length, 'país', 'países') + '.' : 'Ainda não há treinadores fora do Brasil.'} Cada perfil mostra a cidade e o país informados na fonte pública.</p>
        {G.length ? <ul className="ssr-chips">{G.map((g) => <li key={g.codigo}><a href={'#pais-' + g.codigo.toLowerCase()}>{g.pais} <small>{g.itens.length}</small></a></li>)}</ul> : null}
      </section>
      {G.map((g) => (
        <section key={g.codigo} id={'pais-' + g.codigo.toLowerCase()} aria-labelledby={'h-' + g.codigo}>
          <h2 id={'h-' + g.codigo}>{g.pais}</h2>
          <ul className="ssr-list">{g.itens.map((t) => <Cartao key={t.id} t={t} />)}</ul>
        </section>
      ))}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(trilha).replace(/</g, '\\u003c') }} />
    </Shell>
  );
}
