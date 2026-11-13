// Índice de todas as cidades com profissional presencial, por estado. Deixa qualquer cidade a 2 cliques da página inicial.
import Shell from '../../components/Shell.js';
import { cidades, nomeUF, plural } from '../../lib/catalogo.js';

export const revalidate = 86400;
export const metadata = {
  title: 'Personal trainer e aulas por cidade',
  description: 'Todas as cidades com personal trainer e professores de esporte que atendem presencialmente, organizadas por estado.',
  alternates: { canonical: '/cidades' }
};

export default function Cidades() {
  const porUF = new Map();
  cidades(1).forEach((c) => { const uf = nomeUF(c.label) || 'Outros'; if (!porUF.has(uf)) porUF.set(uf, []); porUF.get(uf).push(c); });
  const ufs = [...porUF.keys()].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  return (
    <Shell soServidor>
      <section className="ssr-hero">
        <h1>Personal trainer e aulas por cidade</h1>
        <p>{plural(cidades(1).length, 'cidade', 'cidades')} com profissionais que atendem presencialmente.</p>
      </section>
      {ufs.map((uf) => (
        <section key={uf} aria-labelledby={'uf-' + uf}>
          <h2 id={'uf-' + uf}>{uf}</h2>
          <ul className="ssr-chips">{porUF.get(uf).sort((a, b) => a.label.localeCompare(b.label, 'pt-BR')).map((c) => <li key={c.slug}><a href={'/cidade/' + c.slug}>{c.label.split(',')[0]} <small>{c.n}</small></a></li>)}</ul>
        </section>
      ))}
    </Shell>
  );
}
