// Busca em inglês e espanhol (/en/search, /es/buscar; no .com: /search e /es/buscar): nome, modalidade ou cidade,
// no Brasil e no mundo. Os nomes de modalidade e de cidade valem no idioma da página e em português.
import { notFound } from 'next/navigation';
import ShellIdioma, { CartaoIdioma } from '../../../components/ShellIdioma.js';
import { SITE, todos, esportes, cidades, cidadesMundo, nomeCidadeMundo, nomePais, lugarMundo, slug } from '../../../lib/catalogo.js';
import { ok, t as tr, esporteNome } from '../../../lib/i18n.js';
import { href as hr, abs, versoes } from '../../../lib/rotas.js';

export const dynamic = 'force-dynamic';
const T = {
  en: { titulo: 'Search coaches', h1q: (q) => `Results for “${q}”`, rotulo: 'Name, sport or city', botao: 'Search', esportes: 'Sports', cidades: 'Cities', n: (n, cap) => n + (n === 1 ? ' professional' : ' professionals') + (cap ? ' (first results)' : ''), nada: 'No professional found', dica: 'Try just the first name, the sport or the city.', mundo: 'See all cities worldwide' },
  es: { titulo: 'Buscar entrenadores', h1q: (q) => `Resultados para “${q}”`, rotulo: 'Nombre, deporte o ciudad', botao: 'Buscar', esportes: 'Deportes', cidades: 'Ciudades', n: (n, cap) => n + (n === 1 ? ' profesional' : ' profesionales') + (cap ? ' (primeros resultados)' : ''), nada: 'No se encontró ningún profesional', dica: 'Prueba solo el nombre, el deporte o la ciudad.', mundo: 'Ver todas las ciudades del mundo' }
};
export async function generateMetadata({ params, searchParams }) {
  const { lang: l } = await params; if (!ok(l)) return { title: 'Not found', robots: { index: false } };
  const q = String((await searchParams).q || '').trim().slice(0, 80);
  // as variações com ?q= apontam para a busca sem texto como canônica
  return { title: q ? T[l].h1q(q) : T[l].titulo, alternates: { canonical: abs(l, '/buscar', SITE), languages: versoes('/buscar', SITE) } };
}

export default async function Buscar({ params, searchParams }) {
  const { lang: l } = await params; if (!ok(l)) notFound();
  const x = T[l], q = String((await searchParams).q || '').trim().slice(0, 80), k = slug(q);
  const termos = k ? k.split('-').filter((w) => w.length > 1) : [];
  const nomeEsp = (s) => esporteNome(l, s.slug, s.label);
  const esp = k ? esportes().filter((s) => termos.some((w) => slug(nomeEsp(s)).includes(w) || slug(s.label).includes(w))).slice(0, 8) : [];
  const mundo = k ? cidadesMundo(1).filter((c) => { const h = slug(nomeCidadeMundo(c.cid, l) + ' ' + c.cid + ' ' + nomePais(c.pais, l)); return termos.every((w) => h.includes(w)); }).slice(0, 8) : [];
  const cid = k ? cidades(1).filter((c) => termos.every((w) => slug(c.label).includes(w))).slice(0, 8) : [];
  const porEsp = new Map(esportes().map((s) => [s.slug, slug(nomeEsp(s))]));
  const pessoas = k ? todos().filter((t) => { const h = slug(t.name + ' ' + t.spec + ' ' + t.city + ' ' + lugarMundo(t, l) + ' ' + t.local) + ' ' + t.sports.map((s) => porEsp.get(s) || '').join(' '); return termos.every((w) => h.includes(w)); }).slice(0, 48) : [];
  return (
    <ShellIdioma l={l}>
      <section className="ssr-hero">
        <h1>{q ? x.h1q(q) : x.titulo}</h1>
        <form action={hr(l, '/buscar')} method="get" role="search" className="ssr-busca">
          <label htmlFor="q" className="ssr-sr">{x.rotulo}</label>
          <input id="q" name="q" type="search" defaultValue={q} placeholder={x.rotulo} autoComplete="off" />
          <button type="submit">{x.botao}</button>
        </form>
      </section>
      {esp.length ? <section aria-labelledby="h-e"><h2 id="h-e">{x.esportes}</h2><ul className="ssr-chips">{esp.map((s) => <li key={s.slug}><a href={hr(l, '/treinadores/' + s.slug)}>{nomeEsp(s)} <small>{s.n}</small></a></li>)}</ul></section> : null}
      {mundo.length || cid.length ? <section aria-labelledby="h-c"><h2 id="h-c">{x.cidades}</h2><ul className="ssr-chips">
        {mundo.map((c) => <li key={c.slug}><a href={hr(l, '/cidade/' + c.slug)}>{nomeCidadeMundo(c.cid, l)}, {nomePais(c.pais, l)} <small>{c.n}</small></a></li>)}
        {cid.map((c) => <li key={c.slug}><a href={hr(l, '/cidade/' + c.slug)}>{c.label} <small>{c.n}</small></a></li>)}</ul></section> : null}
      {k ? <section aria-labelledby="h-p"><h2 id="h-p">{pessoas.length ? x.n(pessoas.length, pessoas.length === 48) : x.nada}</h2>
        {pessoas.length ? <ul className="ssr-list">{pessoas.map((t) => <CartaoIdioma key={t.id} l={l} t={t} />)}</ul> : <p>{x.dica} <a href={hr(l, '/worldwide')}>{x.mundo}</a>.</p>}</section> : null}
    </ShellIdioma>
  );
}
