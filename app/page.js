import Shell from '../components/Shell.js';
import { esportes, cidadesDo, todos, plural, curta, SITE } from '../lib/catalogo.js';

export const revalidate = 86400;
export const metadata = {
  title: { absolute: 'Personal trainer e aulas perto de você ou online | 99coach' },
  description: 'Encontre personal trainer e professores por esporte e cidade, presencial ou online. Compare perfis, peça acompanhamento e treine pelo app.',
  alternates: { canonical: '/' }
};

export default function Home() {
  const esp = esportes();
  const cidades = cidadesDo('musculacao', 5).slice(0, 18);
  return (
    <Shell route={{ name: 'home', params: {} }}>
      <link rel="preload" as="image" href="/img/570416df9063df47.webp" fetchPriority="high" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([
        { '@context': 'https://schema.org', '@type': 'Organization', name: '99coach', url: SITE + '/', logo: SITE + '/icon.png', sameAs: ['https://www.instagram.com/99coach_'] },
        { '@context': 'https://schema.org', '@type': 'WebSite', name: '99coach', url: SITE + '/', inLanguage: 'pt-BR', potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: SITE + '/buscar?q={search_term_string}' }, 'query-input': 'required name=search_term_string' } }
      ]).replace(/</g, '\\u003c') }} />
      <section className="ssr-hero">
        <h1>Encontre seu treinador.</h1>
        <p>Compare por esporte, cidade e formato. Peça acompanhamento ao treinador que você escolher; ele responde e, se aceitar, o treino chega pelo app.</p>
        <p className="ssr-note">{plural(todos().length, 'profissional no catálogo', 'profissionais no catálogo')}. A ordem da busca é por relevância; plano pago não muda a posição.</p>
      </section>
      <section id="esportes" aria-labelledby="h-esp">
        <h2 id="h-esp">Esportes</h2>
        <ul className="ssr-chips">
          {esp.map((s) => <li key={s.slug}><a href={'/treinadores/' + s.slug}>{s.label} <small>{s.n.toLocaleString('pt-BR')}</small></a></li>)}
        </ul>
      </section>
      <section aria-labelledby="h-cid">
        <h2 id="h-cid">Procure na sua cidade</h2>
        <ul className="ssr-chips">
          {cidades.map((c) => <li key={c.slug}><a href={'/treinadores/musculacao/' + c.slug}>Personal trainer em {curta(c.label)}</a></li>)}
        </ul>
      </section>
      <section aria-labelledby="h-como">
        <h2 id="h-como">Como funciona</h2>
        <ol className="ssr-steps">
          <li><b>Encontre um treinador.</b> Compare modalidade, formato e cidade.</li>
          <li><b>Peça acompanhamento ou aceite um convite.</b> Pedido não é vínculo: o treinador responde. Convite é aceito uma vez, por você.</li>
          <li><b>Treine pelo app.</b> Treino, registro, evolução e conversa ficam em um lugar só.</li>
        </ol>
      </section>
    </Shell>
  );
}
