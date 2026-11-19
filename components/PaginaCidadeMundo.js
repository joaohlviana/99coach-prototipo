// Cidades fora do Brasil e a página Worldwide, nos três idiomas (mesmo conteúdo, só a interface muda).
//   pt: /cidade/miami-us      /worldwide
//   en: /en/city/miami-us     /en/worldwide      (no .com: /city/miami-us, /worldwide)
//   es: /es/ciudad/miami-us   /es/worldwide
// Só o que o catálogo afirma: profissionais que atendem presencialmente na cidade informada na fonte pública.
import { notFound } from 'next/navigation';
import Shell, { Cartao } from './Shell.js';
import ShellIdioma, { CartaoIdioma } from './ShellIdioma.js';
import { SITE, cidadeMundo, cidadesMundo, listaCidadeMundo, nomeCidadeMundo, nomePais, esporte, mundo, resumo } from '../lib/catalogo.js';
import { esporteNome } from '../lib/i18n.js';
import { href as hr, abs, versoes } from '../lib/rotas.js';

const NUM = { pt: 'pt-BR', en: 'en-US', es: 'es-ES' };
const T = {
  pt: {
    home: 'Início', ondeEsta: 'Você está em', h1: (c) => `Personal trainer em ${c}`,
    titulo: (c, p) => `Personal trainer em ${c} (${p})`,
    desc: (c, p, n, e) => `Personal trainer em ${c}, ${p}: ${n} ${n === 1 ? 'profissional atende' : 'profissionais atendem'} presencialmente. ${e}. Compare perfis na 99coach.`,
    intro: (n, c, p) => `${n} ${n === 1 ? 'profissional atende' : 'profissionais atendem'} presencialmente em ${c}, ${p}. Perfis montados com dados públicos; o contato é pelo Instagram de cada um.`,
    esportes: 'Modalidades', lista: (c) => `Profissionais em ${c}`, mesmoPais: (p) => `Outras cidades em ${p}`, outras: 'Outras cidades no mundo', todas: 'Ver todos os países (Worldwide)',
    wTitulo: 'Worldwide: personal trainers fora do Brasil', wH1: 'Worldwide',
    wDesc: 'Personal trainers e professores fora do Brasil, por cidade: Londres, Miami, Boston, Lisboa, Dubai e mais. Compare perfis na 99coach.',
    wIntro: (n, c, p) => `${n} ${n === 1 ? 'profissional' : 'profissionais'} em ${c} ${c === 1 ? 'cidade' : 'cidades'} de ${p} ${p === 1 ? 'país' : 'países'}. Escolha a cidade.`,
    cidades: 'Cidades', prof: (n) => `${n} ${n === 1 ? 'profissional' : 'profissionais'}`
  },
  en: {
    home: 'Home', ondeEsta: 'You are here', h1: (c) => `Personal trainers in ${c}`,
    titulo: (c, p) => `Personal trainers in ${c}, ${p}`,
    desc: (c, p, n, e) => `Personal trainers in ${c}, ${p}: ${n} ${n === 1 ? 'coach trains' : 'coaches train'} clients in person. ${e}. Compare profiles on 99coach.`,
    intro: (n, c, p) => `${n} ${n === 1 ? 'coach trains' : 'coaches train'} clients in person in ${c}, ${p}. Profiles built from public data; contact each coach on Instagram.`,
    esportes: 'Sports', lista: (c) => `Coaches in ${c}`, mesmoPais: (p) => `Other cities in ${p}`, outras: 'Other cities worldwide', todas: 'See all countries (Worldwide)',
    wTitulo: 'Personal trainers worldwide, by city', wH1: 'Worldwide',
    wDesc: 'Personal trainers and coaches around the world, by city: London, Miami, Boston, San Diego, Dubai and more. Compare profiles on 99coach.',
    wIntro: (n, c, p) => `${n} ${n === 1 ? 'coach' : 'coaches'} in ${c} ${c === 1 ? 'city' : 'cities'} across ${p} ${p === 1 ? 'country' : 'countries'}. Pick a city.`,
    cidades: 'Cities', prof: (n) => `${n} ${n === 1 ? 'coach' : 'coaches'}`
  },
  es: {
    home: 'Inicio', ondeEsta: 'Estás aquí', h1: (c) => `Entrenadores personales en ${c}`,
    titulo: (c, p) => `Entrenadores personales en ${c}, ${p}`,
    desc: (c, p, n, e) => `Entrenadores personales en ${c}, ${p}: ${n} ${n === 1 ? 'profesional atiende' : 'profesionales atienden'} presencialmente. ${e}. Compara perfiles en 99coach.`,
    intro: (n, c, p) => `${n} ${n === 1 ? 'profesional atiende' : 'profesionales atienden'} presencialmente en ${c}, ${p}. Perfiles armados con datos públicos; el contacto es por el Instagram de cada uno.`,
    esportes: 'Deportes', lista: (c) => `Profesionales en ${c}`, mesmoPais: (p) => `Otras ciudades en ${p}`, outras: 'Otras ciudades del mundo', todas: 'Ver todos los países (Worldwide)',
    wTitulo: 'Entrenadores personales en el mundo, por ciudad', wH1: 'Worldwide',
    wDesc: 'Entrenadores personales y profesores en el mundo, por ciudad: Londres, Miami, Boston, Madrid, Dubái y más. Compara perfiles en 99coach.',
    wIntro: (n, c, p) => `${n} ${n === 1 ? 'profesional' : 'profesionales'} en ${c} ${c === 1 ? 'ciudad' : 'ciudades'} de ${p} ${p === 1 ? 'país' : 'países'}. Elige la ciudad.`,
    cidades: 'Ciudades', prof: (n) => `${n} ${n === 1 ? 'profesional' : 'profesionales'}`
  }
};
const og = (l) => ({ siteName: '99coach', locale: l === 'pt' ? 'pt_BR' : l === 'en' ? 'en_US' : 'es_ES', type: 'website', images: [{ url: '/img/og-99coach.png', width: 1200, height: 630, alt: '99coach' }] });
const esportesDe = (itens, l) => {
  const n = new Map(); itens.forEach((t) => t.sports.forEach((s) => n.set(s, (n.get(s) || 0) + 1)));
  return [...n.entries()].sort((a, b) => b[1] - a[1]).map(([s, k]) => { const e = esporte(s); return { slug: s, label: l === 'pt' ? (e ? e.label : s) : esporteNome(l, s, e ? e.label : s), n: k }; });
};

export function metaCidadeMundo(l, k) {
  const c = cidadeMundo(k); if (!c) return null;
  const x = T[l], nome = nomeCidadeMundo(c.cid, l), pais = nomePais(c.pais, l), itens = listaCidadeMundo(k);
  const esp = esportesDe(itens, l).slice(0, 4).map((e) => e.label).join(', ');
  const titulo = x.titulo(nome, pais), descricao = resumo(x.desc(nome, pais, itens.length, esp));
  const url = abs(l, '/cidade/' + k, SITE);
  return { title: titulo, description: descricao, alternates: { canonical: url, languages: versoes('/cidade/' + k, SITE) }, openGraph: { ...og(l), title: titulo, description: descricao, url } };
}

export function CidadeMundo({ l, k }) {
  const c = cidadeMundo(k); if (!c) notFound();
  const x = T[l], nome = nomeCidadeMundo(c.cid, l), pais = nomePais(c.pais, l), itens = listaCidadeMundo(k);
  const esp = esportesDe(itens, l), todas = cidadesMundo(1).filter((y) => y.slug !== k);
  const mesmo = todas.filter((y) => y.pais === c.pais), outras = todas.filter((y) => y.pais !== c.pais).slice(0, 24);
  const url = abs(l, '/cidade/' + k, SITE);
  const ld = [
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: x.home, item: abs(l, '/', SITE) },
      { '@type': 'ListItem', position: 2, name: 'Worldwide', item: abs(l, '/worldwide', SITE) },
      { '@type': 'ListItem', position: 3, name: nome, item: url }] },
    { '@context': 'https://schema.org', '@type': 'ItemList', name: x.h1(nome), numberOfItems: itens.length,
      itemListElement: itens.map((t, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(l, '/treinador/' + t.id, SITE), name: t.name })) }
  ];
  const chip = (y) => <li key={y.slug}><a href={hr(l, '/cidade/' + y.slug)}>{nomeCidadeMundo(y.cid, l)} <small>{y.n.toLocaleString(NUM[l])}</small></a></li>;
  const corpo = (
    <>
      <nav className="ssr-crumb" aria-label={x.ondeEsta}><a href={hr(l, '/')}>{x.home}</a> › <a href={hr(l, '/worldwide')}>Worldwide</a> › <span>{nome}</span></nav>
      <section className="ssr-hero">
        <h1>{x.h1(nome)}</h1>
        <p>{x.intro(itens.length, nome, pais)}</p>
      </section>
      {esp.length ? <section aria-labelledby="h-esp"><h2 id="h-esp">{x.esportes}</h2>
        <ul className="ssr-chips">{esp.map((e) => <li key={e.slug}><span>{e.label} <small>{e.n}</small></span></li>)}</ul></section> : null}
      <section aria-labelledby="h-lista"><h2 id="h-lista">{x.lista(nome)}</h2>
        <ul className="ssr-list">{itens.map((t) => (l === 'pt' ? <Cartao key={t.id} t={t} /> : <CartaoIdioma key={t.id} l={l} t={t} />))}</ul></section>
      {mesmo.length ? <section aria-labelledby="h-pais"><h2 id="h-pais">{x.mesmoPais(pais)}</h2><ul className="ssr-chips">{mesmo.map(chip)}</ul></section> : null}
      {outras.length ? <section aria-labelledby="h-mundo"><h2 id="h-mundo">{x.outras}</h2><ul className="ssr-chips">{outras.map(chip)}</ul>
        <p><a href={hr(l, '/worldwide')}>{x.todas}</a></p></section> : null}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
    </>
  );
  return l === 'pt' ? <Shell soServidor>{corpo}</Shell> : <ShellIdioma l={l}>{corpo}</ShellIdioma>;
}

export function metaMundo(l) {
  const x = T[l], url = abs(l, '/worldwide', SITE);
  return { title: x.wTitulo, description: x.wDesc, alternates: { canonical: url, languages: versoes('/worldwide', SITE) }, openGraph: { ...og(l), title: x.wTitulo, description: x.wDesc, url } };
}

export function Mundo({ l }) {
  const x = T[l], G = mundo(), C = cidadesMundo(1);
  const total = G.reduce((n, g) => n + g.itens.length, 0);
  const porPais = G.map((g) => ({ codigo: g.codigo, nome: nomePais(g.codigo, l), cidades: C.filter((c) => c.pais === g.codigo), n: g.itens.length }));
  const ld = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: x.home, item: abs(l, '/', SITE) }, { '@type': 'ListItem', position: 2, name: 'Worldwide', item: abs(l, '/worldwide', SITE) }] };
  const corpo = (
    <>
      <nav className="ssr-crumb" aria-label={x.ondeEsta}><a href={hr(l, '/')}>{x.home}</a> › <span>Worldwide</span></nav>
      <section className="ssr-hero">
        <h1>{x.wH1}</h1>
        <p>{x.wIntro(total, C.length, G.length)}</p>
        {C.length ? <ul className="ssr-chips">{C.slice(0, 12).map((c) => <li key={c.slug}><a href={hr(l, '/cidade/' + c.slug)}>{nomeCidadeMundo(c.cid, l)} <small>{c.n}</small></a></li>)}</ul> : null}
      </section>
      {porPais.map((p) => (
        <section key={p.codigo} id={'pais-' + p.codigo.toLowerCase()} aria-labelledby={'h-' + p.codigo}>
          <h2 id={'h-' + p.codigo}>{p.nome} <small>{x.prof(p.n)}</small></h2>
          <ul className="ssr-chips">{p.cidades.map((c) => <li key={c.slug}><a href={hr(l, '/cidade/' + c.slug)}>{nomeCidadeMundo(c.cid, l)} <small>{c.n}</small></a></li>)}</ul>
        </section>
      ))}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
    </>
  );
  return l === 'pt' ? <Shell soServidor>{corpo}</Shell> : <ShellIdioma l={l}>{corpo}</ShellIdioma>;
}
