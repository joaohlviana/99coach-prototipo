// Todas as modalidades com treinadores publicados (endereço /esportes, usado no rodapé e por links antigos).
import Shell from '../../components/Shell.js';
import { esportes, lista, plural, SITE } from '../../lib/catalogo.js';

export const revalidate = 3600;
export const metadata = {
  title: 'Esportes e modalidades',
  description: 'Todas as modalidades com personal trainer e professores no 99coach: musculação, pilates, corrida, CrossFit, lutas e mais, presencial ou online.',
  alternates: { canonical: '/esportes' }
};

export default function Esportes() {
  const E = esportes();
  const trilha = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Início', item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: 'Esportes', item: SITE + '/esportes' }] };
  return (
    <Shell soServidor>
      <nav className="ssr-crumb" aria-label="Você está em"><a href="/">Início</a> › <span>Esportes</span></nav>
      <section className="ssr-hero">
        <h1>Esportes e modalidades</h1>
        <p>{plural(E.length, 'modalidade', 'modalidades')} com treinadores publicados. Escolha uma para ver quem atende na sua cidade ou online.</p>
      </section>
      <section aria-labelledby="h-mods"><h2 id="h-mods">Todas as modalidades</h2>
        <ul className="ssr-tiles">{E.filter((s) => s.foto).map((s) => <li key={s.slug}><a href={'/treinadores/' + s.slug}><img src={s.foto} alt="" loading="lazy" decoding="async" width="320" height="200" /><b>{s.label}</b><small>{plural(s.n, 'treinador', 'treinadores')}</small></a></li>)}</ul>
        <ul className="ssr-chips" style={{ marginTop: 12 }}>{E.filter((s) => !s.foto).map((s) => <li key={s.slug}><a href={'/treinadores/' + s.slug}>{s.label} <small>{s.n}</small></a></li>)}</ul>
      </section>
      <section aria-labelledby="h-on"><h2 id="h-on">Atendimento online</h2>
        <ul className="ssr-chips">{E.filter((s) => lista(s.slug, 'online').length).map((s) => <li key={s.slug}><a href={'/treinadores/' + s.slug + '/online'}>{s.label} online <small>{lista(s.slug, 'online').length}</small></a></li>)}</ul>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(trilha).replace(/</g, '\\u003c') }} />
    </Shell>
  );
}
