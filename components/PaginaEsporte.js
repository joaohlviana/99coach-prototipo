// Página "esporte [na cidade | online]" montada no servidor. Usada pelas rotas /treinadores/[esporte] e /treinadores/[esporte]/[cidade].
// Regras do plano (SEO local): sem treinador a página não existe (404); filtros são restrições (não completa com outra cidade);
// número só quando confirmado pelo catálogo; nenhum texto local inventado.
import { notFound } from 'next/navigation';
import Shell, { Cartao } from './Shell.js';
import { esporte, cidade, lista, cidadesDo, esportes, plural, curta, nomeUF, SITE, servicoDe, semTreino, cidadeUF, caber, resumo } from '../lib/catalogo.js';

const POR_PAGINA = 36;

export function dados(esporteSlug, ondeSlug, pagina = 1) {
  const esp = esporte(esporteSlug);
  if (!esp) return null;
  const online = ondeSlug === 'online';
  const cid = ondeSlug && !online ? cidade(ondeSlug) : null;
  if (ondeSlug && !online && !cid) return null;
  const itens = lista(esporteSlug, ondeSlug || '');
  if (!itens.length) return null;
  // página além do fim não existe (404), em vez de lista vazia
  const paginas = Math.max(1, Math.ceil(itens.length / POR_PAGINA));
  if (!(pagina >= 1 && pagina <= paginas)) return null;
  const h1 = online ? `${servicoDe(esp.slug, esp.label)} online` : (cid ? `${servicoDe(esp.slug, esp.label)} em ${curta(cid.label)}` : servicoDe(esp.slug, esp.label));
  const serv = servicoDe(esp.slug, esp.label);
  const suf = pagina > 1 ? ` (página ${pagina})` : '';
  const caberP = (...o) => { const r = o.find((x) => (x + suf).length <= 50) || o[o.length - 1]; return r + suf; };
  const titulo = online ? caberP(`${serv} online: ${plural(itens.length, 'profissional', 'profissionais')}`, `${serv} online`)
    : (cid ? caberP(`${serv} em ${cidadeUF(cid.label)}`, `${serv} em ${curta(cid.label)}`, `${esp.label} em ${curta(cid.label)}`)
      : caberP(`${serv}: por cidade e online`, `${serv}`, esp.label));
  const descricao = resumo(online
    ? `${serv} online: ${plural(itens.length, 'profissional atende', 'profissionais atendem')} a distância${semTreino(esp.slug) ? '' : ', com o treino pelo app'}. Compare perfis e peça acompanhamento.`
    : (cid ? `${serv} em ${cid.label}: ${plural(itens.length, 'profissional atende', 'profissionais atendem')} presencialmente. Compare perfis e peça acompanhamento.`
      : `${serv} em todo o Brasil: ${plural(itens.length, 'profissional', 'profissionais')}, por cidade e online. Compare perfis e peça acompanhamento.`));
  const base = '/treinadores/' + esp.slug + (ondeSlug ? '/' + ondeSlug : '');
  const caminho = base + (pagina > 1 ? '/pagina/' + pagina : '');
  return { esp, online, cid, itens, h1, titulo, descricao, caminho, base, pagina, paginas };
}

export function metadados(d) {
  if (!d) return { title: 'Página não encontrada', robots: { index: false } };
  // combinação com menos de 3 profissionais: a página existe para quem chega, mas não pede indexação (conteúdo fino)
  const fino = d.cid && d.itens.length < 3;
  return { title: d.titulo, description: d.descricao, ...(fino ? { robots: { index: false, follow: true } } : {}), alternates: { canonical: d.caminho }, openGraph: { siteName: '99coach', locale: 'pt_BR', type: 'website', title: d.titulo, description: d.descricao, url: d.caminho, images: [{ url: '/img/og-99coach.png', width: 1200, height: 630, alt: '99coach' }] } };
}

export default function PaginaEsporte({ esporteSlug, ondeSlug, pagina = 1 }) {
  const d = dados(esporteSlug, ondeSlug, pagina);
  if (!d) notFound();
  const { esp, online, cid, itens, h1, caminho, base, paginas } = d;
  const ini = (pagina - 1) * POR_PAGINA, naPagina = itens.slice(ini, ini + POR_PAGINA);
  const cidades = cidadesDo(esp.slug, 3).filter((c) => !cid || c.slug !== cid.slug).slice(0, 60);
  const nOnline = lista(esp.slug, 'online').length;
  const outros = esportes().filter((s) => s.slug !== esp.slug).slice(0, 16);
  const route = { name: 'esporte', params: { mod: esp.label, city: cid ? cid.label : '', fmt: online ? 'Online' : (cid ? 'Presencial' : 'Qualquer') } };
  const ld = {
    '@context': 'https://schema.org', '@type': 'ItemList', name: h1, numberOfItems: itens.length,
    itemListElement: naPagina.map((t, i) => ({ '@type': 'ListItem', position: ini + i + 1, url: SITE + '/treinador/' + t.id, name: t.name }))
  };
  const trilha = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Início', item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: esp.label, item: SITE + '/treinadores/' + esp.slug }]
      .concat(cid || online ? [{ '@type': 'ListItem', position: 3, name: online ? 'Online' : cid.label, item: SITE + caminho }] : [])
  };
  return (
    <Shell route={route} soServidor={pagina > 1}>
      <nav className="ssr-crumb" aria-label="Você está em">
        <a href="/">Início</a> › {cid || online ? <a href={'/treinadores/' + esp.slug}>{esp.label}</a> : <span>{esp.label}</span>}
        {cid ? <> › <a href={'/cidade/' + cid.slug}>{cid.label}</a></> : null}{online ? <> › <span>Online</span></> : null}
      </nav>
      <section className="ssr-hero">
        <p className="ssr-eyebrow">Modalidade{cid ? ' · ' + cid.label + ' · presencial' : (online ? ' · online' : ' · todas as cidades')}</p>
        <h1>{h1}</h1>
        <p>{online ? `Quem atende ${esp.label} online, de qualquer cidade.` : (cid ? `Quem atende ${esp.label} presencialmente em ${curta(cid.label)}, ${nomeUF(cid.label)}.` : `Todas as cidades e o atendimento online. Escolha uma cidade para ver quem atende perto de você.`)}</p>
        <p className="ssr-note"><b>{plural(itens.length, 'treinador', 'treinadores')}</b> nesta busca. Ordem por relevância; plano pago não muda a posição.</p>
      </section>
      <section aria-labelledby="h-lista">
        <h2 id="h-lista">{cid ? `${esp.label} em ${curta(cid.label)}` : (online ? `${esp.label} online` : `Profissionais de ${esp.label}`)}</h2>
        <ul className="ssr-list">{naPagina.map((t) => <Cartao key={t.id} t={t} />)}</ul>
        {paginas > 1 ? <nav className="ssr-pag" aria-label="Páginas da lista">
          <p className="ssr-note">Mostrando {ini + 1} a {ini + naPagina.length} de {itens.length.toLocaleString('pt-BR')} · página {pagina} de {paginas}</p>
          <p>{pagina > 1 ? <a rel="prev" href={base + (pagina > 2 ? '/pagina/' + (pagina - 1) : '')}>‹ Página anterior</a> : null}{pagina > 1 && pagina < paginas ? ' · ' : null}{pagina < paginas ? <a rel="next" href={base + '/pagina/' + (pagina + 1)}>Próxima página ›</a> : null}</p>
        </nav> : null}
      </section>
      {!online && nOnline > 0 ? <section aria-labelledby="h-on"><h2 id="h-on">Também online</h2><p><a href={'/treinadores/' + esp.slug + '/online'}>{plural(nOnline, 'treinador atende', 'treinadores atendem')} {esp.label} online</a></p></section> : null}
      {cidades.length ? <section aria-labelledby="h-cid"><h2 id="h-cid">{esp.label} em outras cidades</h2>
        <ul className="ssr-chips">{cidades.map((c) => <li key={c.slug}><a href={'/treinadores/' + esp.slug + '/' + c.slug}>{c.label} <small>{c.n}</small></a></li>)}</ul></section> : null}
      <section aria-labelledby="h-out"><h2 id="h-out">Outros esportes{cid ? ' em ' + curta(cid.label) : ''}</h2>
        <ul className="ssr-chips">{outros.filter((s) => !cid || lista(s.slug, cid.slug).length > 0).map((s) => <li key={s.slug}><a href={'/treinadores/' + s.slug + (cid ? '/' + cid.slug : '')}>{s.label}</a></li>)}</ul></section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(trilha).replace(/</g, '\\u003c') }} />
    </Shell>
  );
}
