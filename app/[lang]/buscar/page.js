import { notFound } from 'next/navigation';
import ShellIdioma, { CartaoIdioma } from '../../../components/ShellIdioma.js';
import { todos, esportes, cidades, slug } from '../../../lib/catalogo.js';
import { ok, t as tr, esporteNome } from '../../../lib/i18n.js';
export const dynamic = 'force-dynamic';
export async function generateMetadata({params}) { const {lang:l} = await params; return {title:l==='es'?'Buscar entrenadores':'Find coaches',robots:{index:false,follow:true},alternates:{canonical:'/'+l+'/buscar'}}; }
export default async function Buscar({params,searchParams}) {
 const {lang:l}=await params;if(!ok(l))notFound();const x=tr(l), q=String((await searchParams).q||'').trim().slice(0,80), terms=slug(q).split('-').filter(w=>w.length>1);
 const matches = v => terms.length && terms.every(w=>slug(v).includes(w));
 const esp=esportes().filter(s=>matches(esporteNome(l,s.slug,s.label)+' '+s.label)).slice(0,8), cid=cidades(1).filter(c=>matches(c.label)).slice(0,8);
 const sports = new Set(esp.map(s=>s.slug));
 const people=todos().filter(t=>matches(t.name+' '+t.spec+' '+t.city) || (terms.length && t.sports?.some(s=>sports.has(s)))).slice(0,48);
 return <ShellIdioma l={l}><section className="ssr-hero"><h1>{l==='es'?'Buscar entrenadores':'Find coaches'}</h1><p>{q}</p><form action={'/'+l+'/buscar'} method="get" className="ssr-busca"><input name="q" type="search" defaultValue={q} aria-label={x.searchLabel} placeholder={x.search}/><button type="submit">{l==='es'?'Buscar':'Search'}</button></form></section>{esp.length?<section><h2>{x.sports}</h2><ul className="ssr-chips">{esp.map(s=><li key={s.slug}><a href={'/'+l+'/treinadores/'+s.slug}>{esporteNome(l,s.slug,s.label)}</a></li>)}</ul></section>:null}{cid.length?<section><h2>{x.cities}</h2><ul className="ssr-chips">{cid.map(c=><li key={c.slug}><a href={'/'+l+'/cidade/'+c.slug}>{c.label}</a></li>)}</ul></section>:null}{terms.length?<section><h2>{x.navCoaches}</h2>{people.length?<ul className="ssr-list">{people.map(t=><CartaoIdioma key={t.id} l={l} t={t}/>)}</ul>:<p>{l==='es'?'No hay resultados. Prueba otro nombre, deporte o ciudad.':'No results. Try another name, sport or city.'}</p>}</section>:null}</ShellIdioma>;
}
