// Busca livre por texto: nome do profissional, modalidade ou cidade. Mesma entrada que o site anterior tinha (/buscar?q=).
import Shell, { Cartao } from '../../components/Shell.js';
import { todos, esportes, cidades, slug, plural } from '../../lib/catalogo.js';

export const dynamic = 'force-dynamic';
export async function generateMetadata({ searchParams }) {
  const q = String((await searchParams).q || '').trim().slice(0, 80);
  return { title: q ? `Busca: ${q}` : 'Buscar treinadores', robots: { index: false, follow: true }, alternates: { canonical: '/buscar' } };
}

export default async function Buscar({ searchParams }) {
  const q = String((await searchParams).q || '').trim().slice(0, 80);
  const k = slug(q);
  const termos = k ? k.split('-').filter((w) => w.length > 1) : [];
  const esp = k ? esportes().filter((s) => termos.some((w) => slug(s.label).includes(w))).slice(0, 8) : [];
  const cid = k ? cidades(1).filter((c) => termos.every((w) => slug(c.label).includes(w)) || slug(c.label).startsWith(k)).slice(0, 8) : [];
  const pessoas = k ? todos().filter((t) => { const h = slug(t.name + ' ' + t.spec + ' ' + t.city); return termos.every((w) => h.includes(w)); }).slice(0, 48) : [];
  return (
    <Shell soServidor>
      <section className="ssr-hero">
        <h1>{q ? `Resultados para “${q}”` : 'Buscar treinadores'}</h1>
        <form action="/buscar" method="get" role="search" className="ssr-busca">
          <label htmlFor="q" className="ssr-sr">Nome, modalidade ou cidade</label>
          <input id="q" name="q" type="search" defaultValue={q} placeholder="Nome, modalidade ou cidade" autoComplete="off" />
          <button type="submit">Buscar</button>
        </form>
      </section>
      {esp.length ? <section aria-labelledby="h-e"><h2 id="h-e">Modalidades</h2><ul className="ssr-chips">{esp.map((s) => <li key={s.slug}><a href={'/treinadores/' + s.slug}>{s.label} <small>{s.n}</small></a></li>)}</ul></section> : null}
      {cid.length ? <section aria-labelledby="h-c"><h2 id="h-c">Cidades</h2><ul className="ssr-chips">{cid.map((c) => <li key={c.slug}><a href={'/cidade/' + c.slug}>{c.label} <small>{c.n}</small></a></li>)}</ul></section> : null}
      {k ? <section aria-labelledby="h-p"><h2 id="h-p">{pessoas.length ? plural(pessoas.length, 'profissional', 'profissionais') + (pessoas.length === 48 ? ' (os primeiros)' : '') : 'Nenhum profissional com esse nome'}</h2>
        {pessoas.length ? <ul className="ssr-list">{pessoas.map((t) => <Cartao key={t.id} t={t} />)}</ul> : <p>Tente só o primeiro nome, a modalidade ou a cidade. <a href="/cidades">Ver todas as cidades</a>.</p>}</section> : null}
    </Shell>
  );
}
