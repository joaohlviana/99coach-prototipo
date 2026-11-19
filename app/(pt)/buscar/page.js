// Busca livre por texto: nome do profissional, modalidade ou cidade. Mesma entrada que o site anterior tinha (/buscar?q=).
import Shell, { Cartao } from '../../../components/Shell.js';
import { todos, esportes, cidades, cidade, slug, plural, nomeDoUF, ehUF, cidadesMundo, nomeCidadeMundo, nomePais, lugarMundo } from '../../../lib/catalogo.js';

export const dynamic = 'force-dynamic';
export async function generateMetadata({ searchParams }) {
  const q = String((await searchParams).q || '').trim().slice(0, 80);
  // página pública: indexável; as variações com ?q= apontam para /buscar como canônica
  return { title: q ? `Busca: ${q}` : 'Buscar treinadores', alternates: { canonical: '/buscar' } };
}

export default async function Buscar({ searchParams }) {
  const sp = await searchParams;
  const q = String(sp.q || '').trim().slice(0, 80);
  const k = slug(q);
  // lugar vindo da busca do topo de uma página de cidade ("rio-de-janeiro-rj") ou de estado ("uf-rj")
  const ondeK = String(sp.onde || '').toLowerCase().slice(0, 80);
  const ufK = /^uf-([a-z]{2})$/.exec(ondeK), ufOk = ufK && ehUF(ufK[1]) ? ufK[1] : '';
  const cidOk = !ufOk && ondeK ? cidade(ondeK) : null;
  const onde = ondeK === 'mundo' ? { label: 'Mundo todo', chave: 'mundo', ok: () => true } : ufOk ? { label: nomeDoUF(ufOk), chave: 'uf-' + ufOk, ok: (t) => !!t.city && t.city.slice(-4) === ', ' + ufOk.toUpperCase() } : (cidOk ? { label: cidOk.label, chave: cidOk.slug, ok: (t) => slug(t.city) === cidOk.slug } : null);
  const termos = k ? k.split('-').filter((w) => w.length > 1) : [];
  const esp = k ? esportes().filter((s) => termos.some((w) => slug(s.label).includes(w))).slice(0, 8) : [];
  const cid = k ? cidades(1).filter((c) => termos.every((w) => slug(c.label).includes(w)) || slug(c.label).startsWith(k)).slice(0, 8) : [];
  // cidades fora do Brasil (Miami, Londres…): pelo nome em português, pelo nome original ou pelo país
  const mundo = k && !onde ? cidadesMundo(1).filter((c) => { const h = slug(nomeCidadeMundo(c.cid, 'pt') + ' ' + c.cid + ' ' + nomePais(c.pais, 'pt')); return termos.every((w) => h.includes(w)); }).slice(0, 8) : [];
  const pessoas = k || onde ? todos().filter((t) => { if (onde && !onde.ok(t)) return false; const h = slug(t.name + ' ' + t.spec + ' ' + t.city + ' ' + lugarMundo(t, 'pt') + ' ' + t.local); return termos.every((w) => h.includes(w)); }).slice(0, 48) : [];
  return (
    <Shell soServidor onde={onde ? { label: onde.label, curto: onde.label.replace(/, [A-Z]{2}$/, ''), chave: onde.chave, limpar: '/buscar' + (q ? '?q=' + encodeURIComponent(q) : '') } : undefined}>
      <section className="ssr-hero">
        <h1>{q ? `Resultados para “${q}”` + (onde && ondeK !== 'mundo' ? ` em ${onde.label}` : '') : (onde ? (ondeK === 'mundo' ? 'Treinadores no mundo todo' : `Buscar treinadores em ${onde.label}`) : 'Buscar treinadores')}</h1>
        <form action="/buscar" method="get" role="search" className="ssr-busca">
          <label htmlFor="q" className="ssr-sr">Nome, modalidade ou cidade</label>
          <input id="q" name="q" type="search" defaultValue={q} placeholder="Nome, modalidade ou cidade" autoComplete="off" />
          {onde ? <input type="hidden" name="onde" value={onde.chave} /> : null}
          <button type="submit">Buscar</button>
        </form>
        {onde && ondeK !== 'mundo' ? <p>Procurando só em {onde.label}. <a href={'/buscar' + (q ? '?q=' + encodeURIComponent(q) : '')}>Buscar em todo lugar</a></p> : null}
      </section>
      {esp.length ? <section aria-labelledby="h-e"><h2 id="h-e">Modalidades</h2><ul className="ssr-chips">{esp.map((s) => <li key={s.slug}><a href={'/treinadores/' + s.slug}>{s.label} <small>{s.n}</small></a></li>)}</ul></section> : null}
      {cid.length || mundo.length ? <section aria-labelledby="h-c"><h2 id="h-c">Cidades</h2><ul className="ssr-chips">{cid.map((c) => <li key={c.slug}><a href={'/cidade/' + c.slug}>{c.label} <small>{c.n}</small></a></li>)}{mundo.map((c) => <li key={c.slug}><a href={'/cidade/' + c.slug}>{nomeCidadeMundo(c.cid, 'pt')}, {nomePais(c.pais, 'pt')} <small>{c.n}</small></a></li>)}</ul></section> : null}
      {k || onde ? <section aria-labelledby="h-p"><h2 id="h-p">{pessoas.length ? plural(pessoas.length, 'profissional', 'profissionais') : 'Nenhum profissional com esse nome'}</h2>
        {pessoas.length ? <ul className="ssr-list">{pessoas.map((t) => <Cartao key={t.id} t={t} />)}</ul> : <p>Tente só o primeiro nome, a modalidade ou a cidade. <a href="/cidades">Ver todas as cidades</a>.</p>}</section> : null}
    </Shell>
  );
}
