// Perfil público montado no servidor: só o que o catálogo afirma (nome, especialidade, esportes, cidade e formato).
// Regras do plano: perfil importado aparece como importado e não confirmado, sem foto de terceiros, sem avaliação,
// preço ou disponibilidade inventados, e com caminho para corrigir ou retirar sem precisar de conta.
import { notFound } from 'next/navigation';
import Shell, { Cartao } from '../../../components/Shell.js';
import { treinador, esportesDe, lista, slug as slugify, curta, SITE } from '../../../lib/catalogo.js';

export const revalidate = 86400;
export const dynamicParams = true;
export async function generateStaticParams() { return []; }

function carregar(id) { const t = treinador(decodeURIComponent(id)); return t ? { t, esp: esportesDe(t) } : null; }

export async function generateMetadata({ params }) {
  const { slug } = await params; const d = carregar(slug);
  if (!d) return { title: 'Perfil não encontrado', robots: { index: false } };
  const { t, esp } = d;
  const oque = t.spec || (esp[0] ? esp[0].label : 'Treinador');
  const onde = t.pres ? ' em ' + t.city : (t.onl ? ' online' : '');
  const titulo = `${t.name} — ${oque}${onde}`;
  const descricao = `${t.name}: ${oque}${onde}. ${[t.pres ? 'Atende presencialmente em ' + t.city : '', t.onl ? 'Atende online' : ''].filter(Boolean).join('. ')}. Perfil no 99coach.`;
  return { title: titulo, description: descricao, alternates: { canonical: '/treinador/' + t.id }, openGraph: { title: titulo, description: descricao, url: '/treinador/' + t.id, type: 'profile' } };
}

export default async function Page({ params }) {
  const { slug } = await params; const d = carregar(slug);
  if (!d) notFound();
  const { t, esp } = d;
  const principal = esp[0];
  const cid = t.pres ? slugify(t.city) : '';
  const parecidos = principal ? lista(principal.slug, cid || (t.onl ? 'online' : '')).filter((x) => x.id !== t.id).slice(0, 6) : [];
  const ld = {
    '@context': 'https://schema.org', '@type': 'Person', name: t.name, url: SITE + '/treinador/' + t.id,
    ...(t.spec ? { jobTitle: t.spec } : {}), ...(esp.length ? { knowsAbout: esp.map((s) => s.label) } : {}),
    ...(t.pres ? { address: { '@type': 'PostalAddress', addressLocality: curta(t.city), addressRegion: (t.city.split(', ')[1] || ''), addressCountry: 'BR' } } : {})
  };
  return (
    <Shell route={{ name: 'perfil', params: { id: t.id } }}>
      <nav className="ssr-crumb" aria-label="Você está em">
        <a href="/">Início</a>{principal ? <> › <a href={'/treinadores/' + principal.slug}>{principal.label}</a></> : null}
        {principal && cid ? <> › <a href={'/treinadores/' + principal.slug + '/' + cid}>{t.city}</a></> : null} › <span>{t.name}</span>
      </nav>
      <section className="ssr-hero ssr-perfil">
        <span className="ssr-av ssr-av--lg" aria-hidden="true">{t.ini || t.name.slice(0, 1)}</span>
        <div>
          <h1>{t.name}</h1>
          {t.spec ? <p>{t.spec}</p> : null}
          <p>{[t.pres ? 'Atende presencialmente em ' + t.city : '', t.onl ? 'Atende online' : ''].filter(Boolean).join(' · ')}</p>
        </div>
      </section>
      <section aria-labelledby="h-orig" className="ssr-aviso">
        <h2 id="h-orig">Perfil importado, ainda não confirmado</h2>
        <p>Este perfil foi criado a partir de dados públicos e não foi confirmado por {t.name.split(' ')[0]}. Por isso não mostramos foto, avaliações, preço nem disponibilidade, e não há contratação pelo 99coach.</p>
        <p>É você, ou há algo errado? <a href="/app#publico-ajuda-perfil">Veja como corrigir, reivindicar ou pedir a retirada</a>, sem precisar de conta.</p>
      </section>
      {esp.length ? <section aria-labelledby="h-esp"><h2 id="h-esp">Modalidades</h2>
        <ul className="ssr-chips">{esp.map((s) => <li key={s.slug}><a href={'/treinadores/' + s.slug + (cid ? '/' + cid : '')}>{s.label}{cid ? ' em ' + curta(t.city) : ''}</a></li>)}</ul></section> : null}
      {parecidos.length ? <section aria-labelledby="h-par"><h2 id="h-par">Outros profissionais{principal ? ' de ' + principal.label : ''}{cid ? ' em ' + curta(t.city) : ''}</h2>
        <ul className="ssr-list">{parecidos.map((x) => <Cartao key={x.id} t={x} />)}</ul></section> : null}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
    </Shell>
  );
}
