// Central de ajuda pública (indexável): lista dos artigos. O formulário de suporte e a consulta de protocolo ficam no app.
import Shell from '../../components/Shell.js';
import { SITE } from '../../lib/catalogo.js';
import { artigos, CATS } from '../../lib/ajuda.js';

export const revalidate = 86400;
export const metadata = {
  title: 'Central de ajuda',
  description: 'Pagamentos e reembolsos, privacidade, termos de uso, cookies e como funciona a 99coach para alunos e treinadores.',
  alternates: { canonical: '/ajuda' }
};

export default function Ajuda() {
  const A = artigos();
  const grupos = Object.entries(CATS).map(([k, label]) => ({ k, label, itens: A.filter((a) => a.cat === k) })).filter((g) => g.itens.length);
  const trilha = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Início', item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: 'Central de ajuda', item: SITE + '/ajuda' }] };
  return (
    <Shell soServidor>
      <nav className="ssr-crumb" aria-label="Você está em"><a href="/">Início</a> › <span>Central de ajuda</span></nav>
      <section className="ssr-hero">
        <h1>Central de ajuda</h1>
        <p>Regras de pagamento, privacidade e uso da 99coach. Não achou a resposta? <a href="/app#publico-ajuda">Fale com o suporte</a>: você recebe um protocolo para acompanhar.</p>
      </section>
      {grupos.map((g) => (
        <section key={g.k} aria-labelledby={'h-' + g.k}><h2 id={'h-' + g.k}>{g.label}</h2>
          <ul className="ssr-list">{g.itens.map((a) => <li key={a.id}><a href={a.url}><b>{a.title}</b></a><br /><small>{a.lead}</small></li>)}</ul>
        </section>
      ))}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(trilha).replace(/</g, '\\u003c') }} />
    </Shell>
  );
}
