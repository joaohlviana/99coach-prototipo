// Página "esporte [na cidade | online]" montada no servidor. Usada pelas rotas /treinadores/[esporte] e /treinadores/[esporte]/[cidade].
// Regras do plano (SEO local): sem treinador a página não existe (404); filtros são restrições (não completa com outra cidade);
// número só quando confirmado pelo catálogo; nenhum texto local inventado.
import { notFound } from 'next/navigation';
import Shell, { Cartao, Paginacao } from './Shell.js';
import { idiomas } from '../lib/i18n.js';
import { esporte, cidade, lista, cidadesDo, esportes, plural, curta, nomeUF, SITE, servicoDe, semTreino, cidadeUF, caber, resumo, ehUF, nomeDoUF, noUF, cidadesDoUF, estadosDo } from '../lib/catalogo.js';

const POR_PAGINA = 36;

export function dados(esporteSlug, ondeSlug, pagina = 1) {
  const esp = esporte(esporteSlug);
  if (!esp) return null;
  const online = ondeSlug === 'online';
  // estado (/treinadores/musculacao/pr): profissionais presenciais em qualquer cidade do estado
  const uf = ondeSlug && ehUF(ondeSlug) ? ondeSlug : '';
  const cid = ondeSlug && !online && !uf ? cidade(ondeSlug) : null;
  if (ondeSlug && !online && !uf && !cid) return null;
  const itens = lista(esporteSlug, ondeSlug || '');
  if (!itens.length) return null;
  // página além do fim não existe (404), em vez de lista vazia
  const paginas = Math.max(1, Math.ceil(itens.length / POR_PAGINA));
  if (!(pagina >= 1 && pagina <= paginas)) return null;
  const h1 = online ? `${servicoDe(esp.slug, esp.label)} online` : uf ? `${servicoDe(esp.slug, esp.label)} ${noUF(uf)}` : (cid ? `${servicoDe(esp.slug, esp.label)} em ${curta(cid.label)}` : servicoDe(esp.slug, esp.label));
  const serv = servicoDe(esp.slug, esp.label);
  const suf = pagina > 1 ? ` (página ${pagina})` : '';
  const caberP = (...o) => { const r = o.find((x) => (x + suf).length <= 50) || o[o.length - 1]; return r + suf; };
  const titulo = uf ? caberP(`${serv} ${noUF(uf)} (${uf.toUpperCase()})`, `${serv} ${noUF(uf)}`, `${esp.label} ${noUF(uf)}`) : online ? caberP(`${serv} online: ${plural(itens.length, 'profissional', 'profissionais')}`, `${serv} online`)
    : (cid ? caberP(`${serv} em ${cidadeUF(cid.label)}`, `${serv} em ${curta(cid.label)}`, `${esp.label} em ${curta(cid.label)}`)
      : caberP(`${serv}: por cidade e online`, `${serv}`, esp.label));
  const descricao = resumo(uf ? `${serv} ${noUF(uf)}: ${plural(itens.length, 'profissional atende', 'profissionais atendem')} presencialmente em ${plural(cidadesDoUF(uf, esp.slug).length, 'cidade', 'cidades')} do estado. Compare perfis e peça acompanhamento.` : online
    ? `${serv} online: ${plural(itens.length, 'profissional atende', 'profissionais atendem')} a distância${semTreino(esp.slug) ? '' : ', com o treino pelo app'}. Compare perfis e peça acompanhamento.`
    : (cid ? `${serv} em ${cid.label}: ${plural(itens.length, 'profissional atende', 'profissionais atendem')} presencialmente. Compare perfis e peça acompanhamento.`
      : `${serv} em todo o Brasil: ${plural(itens.length, 'profissional', 'profissionais')}, por cidade e online. Compare perfis e peça acompanhamento.`));
  const base = '/treinadores/' + esp.slug + (ondeSlug ? '/' + ondeSlug : '');
  const caminho = base + (pagina > 1 ? '/pagina/' + pagina : '');
  return { esp, online, cid, uf, itens, h1, titulo, descricao, caminho, base, pagina, paginas };
}

export function metadados(d) {
  if (!d) return { title: 'Página não encontrada', robots: { index: false } };
  return { title: d.titulo, description: d.descricao, alternates: { canonical: d.caminho, languages: idiomas(d.caminho) }, openGraph: { siteName: '99coach', locale: 'pt_BR', type: 'website', title: d.titulo, description: d.descricao, url: d.caminho, images: [{ url: '/img/og-99coach.png', width: 1200, height: 630, alt: '99coach' }] } };
}

export default function PaginaEsporte({ esporteSlug, ondeSlug, pagina = 1 }) {
  const d = dados(esporteSlug, ondeSlug, pagina);
  if (!d) notFound();
  const { esp, online, cid, uf, itens, h1, caminho, base, paginas } = d;
  const ini = (pagina - 1) * POR_PAGINA, naPagina = itens.slice(ini, ini + POR_PAGINA);
  const cidades = uf ? cidadesDoUF(uf, esp.slug) : cidadesDo(esp.slug, 1).filter((c) => !cid || c.slug !== cid.slug);
  const estados = estadosDo(esp.slug).filter((e) => e.uf !== uf);
  const ufCid = cid ? cid.label.slice(-2).toLowerCase() : '';
  const nOnline = lista(esp.slug, 'online').length;
  const outros = esportes().filter((s) => s.slug !== esp.slug).slice(0, 16);
  const route = { name: 'esporte', params: { slug: esp.slug, mod: esp.label, city: uf ? 'UF:' + uf.toUpperCase() : (cid ? cid.label : ''), fmt: online ? 'Online' : (cid || uf ? 'Presencial' : 'Qualquer') } };
  const ld = {
    '@context': 'https://schema.org', '@type': 'ItemList', name: h1, numberOfItems: itens.length,
    itemListElement: naPagina.map((t, i) => ({ '@type': 'ListItem', position: ini + i + 1, url: SITE + '/treinador/' + t.id, name: t.name }))
  };
  const trilha = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Início', item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: esp.label, item: SITE + '/treinadores/' + esp.slug }]
      .concat(ufCid ? [{ '@type': 'ListItem', position: 3, name: nomeDoUF(ufCid), item: SITE + '/treinadores/' + esp.slug + '/' + ufCid }] : [])
      .concat(cid || online || uf ? [{ '@type': 'ListItem', position: ufCid ? 4 : 3, name: online ? 'Online' : (uf ? nomeDoUF(uf) : cid.label), item: SITE + caminho }] : [])
  };
  return (
    <Shell route={route} soServidor={pagina > 1}>
      <nav className="ssr-crumb" aria-label="Você está em">
        <a href="/">Início</a> › {cid || online || uf ? <a href={'/treinadores/' + esp.slug}>{esp.label}</a> : <span>{esp.label}</span>}
        {ufCid ? <> › <a href={'/treinadores/' + esp.slug + '/' + ufCid}>{nomeDoUF(ufCid)}</a></> : null}
        {uf ? <> › <span>{nomeDoUF(uf)}</span></> : null}{cid ? <> › <a href={'/cidade/' + cid.slug}>{cid.label}</a></> : null}{online ? <> › <span>Online</span></> : null}
      </nav>
      <section className="ssr-hero">
        <p className="ssr-eyebrow">Modalidade{uf ? ' · ' + nomeDoUF(uf) + ' · presencial' : cid ? ' · ' + cid.label + ' · presencial' : (online ? ' · online' : ' · todas as cidades')}</p>
        <h1>{h1}</h1>
        <p>{uf ? `Quem atende ${esp.label} presencialmente ${noUF(uf)}, em ${plural(cidades.length, 'cidade', 'cidades')}. Escolha a cidade para ver quem está mais perto.` : online ? `Quem atende ${esp.label} online, de qualquer cidade.` : (cid ? `Quem atende ${esp.label} presencialmente em ${curta(cid.label)}, ${nomeUF(cid.label)}.` : `Todas as cidades e o atendimento online. Escolha uma cidade para ver quem atende perto de você.`)}</p>
        <p className="ssr-note"><b>{plural(itens.length, 'treinador', 'treinadores')}</b> nesta busca. Ordem por relevância; plano pago não muda a posição.</p>
      </section>
      <section aria-labelledby="h-lista">
        <h2 id="h-lista">{uf ? `${esp.label} ${noUF(uf)}` : cid ? `${esp.label} em ${curta(cid.label)}` : (online ? `${esp.label} online` : `Profissionais de ${esp.label}`)}</h2>
        <ul className="ssr-list">{naPagina.map((t) => <Cartao key={t.id} t={t} />)}</ul>
        <Paginacao base={base} pagina={pagina} paginas={paginas} total={itens.length} ini={ini} n={naPagina.length} />
      </section>
      {!online && nOnline > 0 ? <section aria-labelledby="h-on"><h2 id="h-on">Também online</h2><p><a href={'/treinadores/' + esp.slug + '/online'}>{plural(nOnline, 'treinador atende', 'treinadores atendem')} {esp.label} online</a></p></section> : null}
      {cidades.length ? <section aria-labelledby="h-cid"><h2 id="h-cid">{uf ? `Cidades com ${esp.label} ${noUF(uf)}` : `${esp.label} em outras cidades`}</h2>
        <ul className="ssr-chips">{cidades.slice(0, 24).map((c) => <li key={c.slug}><a href={'/treinadores/' + esp.slug + '/' + c.slug}>{c.label} <small>{c.n}</small></a></li>)}</ul>
        {cidades.length > 24 ? <details className="ssr-mais"><summary>Ver mais {cidades.length - 24} cidades</summary><ul className="ssr-chips">{cidades.slice(24).map((c) => <li key={c.slug}><a href={'/treinadores/' + esp.slug + '/' + c.slug}>{c.label} <small>{c.n}</small></a></li>)}</ul></details> : null}</section> : null}
      {estados.length && !online ? <section aria-labelledby="h-uf"><h2 id="h-uf">{esp.label} por estado</h2>
        <ul className="ssr-chips">{estados.map((e) => <li key={e.uf}><a href={'/treinadores/' + esp.slug + '/' + e.uf}>{e.nome} <small>{e.n}</small></a></li>)}</ul></section> : null}
      <section aria-labelledby="h-out"><h2 id="h-out">Outros esportes{uf ? ' ' + noUF(uf) : cid ? ' em ' + curta(cid.label) : ''}</h2>
        <ul className="ssr-chips">{outros.filter((s) => !(cid || uf) || lista(s.slug, uf || cid.slug).length > 0).map((s) => <li key={s.slug}><a href={'/treinadores/' + s.slug + (uf ? '/' + uf : cid ? '/' + cid.slug : '')}>{s.label}</a></li>)}</ul></section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(trilha).replace(/</g, '\\u003c') }} />
    </Shell>
  );
}
