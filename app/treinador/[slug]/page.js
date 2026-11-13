// Perfil público montado no servidor: só o que o catálogo afirma (nome, especialidade, esportes, cidade e formato).
// Regras do plano: perfil importado aparece como importado e não confirmado, sem foto de terceiros, sem avaliação,
// preço ou disponibilidade inventados, e com caminho para corrigir ou retirar sem precisar de conta.
import { notFound } from 'next/navigation';
import Shell, { Cartao } from '../../../components/Shell.js';
import { treinador, esportesDe, lista, slug as slugify, curta, SITE, publicadoAgora, treinadorAgora, servicoDe, cidadeUF, caber, resumo } from '../../../lib/catalogo.js';

export const revalidate = 300;
export const dynamicParams = true;
export async function generateStaticParams() { return []; }

// Título e descrição pensados para a busca que a pessoa faz ("personal trainer em Recife", "aulas de judô em Recife"):
// o serviço e a cidade vêm primeiro; o nome fecha. Sem prometer nada que o perfil não diga.
function textos(t, esp) {
  const principal = esp[0];
  const serv = servicoDe(principal && principal.slug, principal ? principal.label : (t.spec || ''));
  const curto = t.name.split(' ').length > 2 ? t.name.split(' ')[0] + ' ' + t.name.split(' ').slice(-1)[0] : t.name;
  const onde = t.pres ? ' em ' + cidadeUF(t.city) : (t.onl ? ' online' : ''), ondeC = t.pres ? ' em ' + curta(t.city) : (t.onl ? ' online' : '');
  const titulo = caber(`${t.name}: ${serv}${onde}`, `${t.name}: ${serv}${ondeC}`, `${curto}: ${serv}${onde}`, `${curto}: ${serv}${ondeC}`, `${curto}: ${principal ? principal.label : 'Treinador'}${ondeC}`);
  const outros = esp.slice(1, 4).map((s) => s.label);
  const fmt = t.pres && t.onl ? 'Atende presencialmente e online' : (t.pres ? 'Atendimento presencial' : (t.onl ? 'Atendimento online' : ''));
  const descricao = resumo(`${serv}${onde} com ${t.name}.${fmt ? ' ' + fmt + '.' : ''}${outros.length ? ' Também: ' + outros.join(', ') + '.' : ''} Veja o perfil e compare com outros profissionais${t.pres ? ' de ' + curta(t.city) : ''}.`);
  return { titulo, descricao };
}

async function carregar(id) { const k = decodeURIComponent(id); const t = treinador(k) || (await treinadorAgora(k)); return t ? { t, esp: esportesDe(t) } : null; }

export async function generateMetadata({ params }) {
  const { slug } = await params; const d = await carregar(slug);
  if (!d || (await publicadoAgora(d.t.id)) === false) return { title: 'Perfil não encontrado', robots: { index: false } };
  const { t, esp } = d;
  const { titulo, descricao } = textos(t, esp);
  return { title: titulo, description: descricao, alternates: { canonical: '/treinador/' + t.id }, openGraph: { title: titulo, description: descricao, url: '/treinador/' + t.id, type: 'profile', images: [t.photo ? { url: t.photo, alt: 'Foto de ' + t.name } : { url: '/img/og-99coach.png', width: 1200, height: 630, alt: '99coach' }] }, twitter: { card: t.photo ? 'summary' : 'summary', title: titulo, description: descricao, ...(t.photo ? { images: [t.photo] } : {}) } };
}

export default async function Page({ params }) {
  const { slug } = await params; const d = await carregar(slug);
  if (!d) notFound();
  // retirado depois do build: some na hora
  if ((await publicadoAgora(d.t.id)) === false) notFound();
  const { t, esp } = d;
  const principal = esp[0];
  const cid = t.pres ? slugify(t.city) : '';
  const parecidos = principal ? lista(principal.slug, cid || (t.onl ? 'online' : '')).filter((x) => x.id !== t.id).slice(0, 6) : [];
  const url = SITE + '/treinador/' + t.id;
  const pessoa = {
    '@type': 'Person', name: t.name, url,
    ...(t.spec ? { jobTitle: t.spec } : {}), ...(t.photo ? { image: t.photo } : {}), ...(t.ig ? { sameAs: ['https://www.instagram.com/' + t.ig + '/'] } : {}), ...(esp.length ? { knowsAbout: esp.map((s) => s.label) } : {}),
    ...(t.pres ? { address: { '@type': 'PostalAddress', addressLocality: curta(t.city), addressRegion: (t.city.split(', ')[1] || ''), addressCountry: 'BR' } } : {})
  };
  const trilha = [{ name: 'Início', item: SITE + '/' }].concat(principal ? [{ name: principal.label, item: SITE + '/treinadores/' + principal.slug }] : [], principal && cid ? [{ name: t.city, item: SITE + '/treinadores/' + principal.slug + '/' + cid }] : [], [{ name: t.name, item: url }]);
  const ld = [
    { '@context': 'https://schema.org', '@type': 'ProfilePage', url, mainEntity: pessoa },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: trilha.map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x.name, item: x.item })) }
  ];
  return (
    <Shell route={{ name: 'perfil', params: { id: t.id } }}>
      <nav className="ssr-crumb" aria-label="Você está em">
        <a href="/">Início</a>{principal ? <> › <a href={'/treinadores/' + principal.slug}>{principal.label}</a></> : null}
        {principal && cid ? <> › <a href={'/treinadores/' + principal.slug + '/' + cid}>{t.city}</a></> : null} › <span>{t.name}</span>
      </nav>
      <section className="ssr-hero ssr-perfil">
        {t.photo ? <img className="ssr-foto" src={t.photo} alt={'Foto de ' + t.name} width="88" height="88" fetchPriority="high" /> : <span className="ssr-av ssr-av--lg" aria-hidden="true">{t.ini || t.name.slice(0, 1)}</span>}
        <div>
          <h1>{t.name}</h1>
          {t.spec ? <p>{t.spec}</p> : null}
          <p>{[t.pres ? 'Atende presencialmente em ' + t.city : '', t.onl ? 'Atende online' : ''].filter(Boolean).join(' · ') || 'Local de atendimento não informado'}</p>
        </div>
      </section>
      {t.importado ? (
      <section aria-labelledby="h-orig" className="ssr-aviso">
          <h2 id="h-orig">Contato</h2>
          {t.ig ? <p><a href={'https://www.instagram.com/' + t.ig + '/'} rel="nofollow noopener" target="_blank">Falar com {t.name.split(' ')[0]} no Instagram (@{t.ig})</a></p> : null}
          <p>Perfil importado de dados públicos, ainda não confirmado por {t.name.split(' ')[0]}. É você, ou há algo errado? <a href={'/app#publico-perfilpedido-' + t.id}>Corrigir, retirar ou reivindicar</a>.</p>
        </section>
      ) : (
        <section aria-labelledby="h-ped" className="ssr-aviso">
          <h2 id="h-ped">Acompanhamento</h2>
          <p>Perfil publicado por {t.name.split(' ')[0]} no 99coach. Pedido não é vínculo: {t.name.split(' ')[0]} responde e, se aceitar, o acompanhamento começa. Nada é cobrado no pedido.</p>
          <p><a href={'/app#publico-pedir-' + t.id}>Pedir acompanhamento</a></p>
        </section>
      )}
      {esp.length ? <section aria-labelledby="h-esp"><h2 id="h-esp">Modalidades</h2>
        <ul className="ssr-chips">{esp.map((s) => <li key={s.slug}><a href={'/treinadores/' + s.slug + (cid ? '/' + cid : '')}>{s.label}{cid ? ' em ' + curta(t.city) : ''}</a></li>)}</ul></section> : null}
      {parecidos.length ? <section aria-labelledby="h-par"><h2 id="h-par">Outros profissionais{principal ? ' de ' + principal.label : ''}{cid ? ' em ' + curta(t.city) : ''}</h2>
        <ul className="ssr-list">{parecidos.map((x) => <Cartao key={x.id} t={x} />)}</ul></section> : null}
      {<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />}
    </Shell>
  );
}
