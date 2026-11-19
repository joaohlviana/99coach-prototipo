// Perfil público em inglês ou espanhol: mesmas regras da versão em português (só o que o catálogo afirma;
// perfil importado aparece como importado). Especialidade e nome ficam como o profissional escreveu.
import { notFound } from 'next/navigation';
import ShellIdioma, { CartaoIdioma } from '../../../../components/ShellIdioma.js';
import { treinador, esportesDe, lista, slug as slugify, curta, SITE, publicadoAgora, treinadorAgora, nomeLimpo, resumo } from '../../../../lib/catalogo.js';
import { ok, t as tr, esporteNome, servico } from '../../../../lib/i18n.js';
import { href as hr, abs, versoes } from '../../../../lib/rotas.js';

export const revalidate = 300;
export const dynamicParams = true;
export async function generateStaticParams() { return []; }

async function carregar(id) { let k = id; try { k = decodeURIComponent(id); } catch { return null; } const t = treinador(k) || (await treinadorAgora(k)); return t ? { t, esp: esportesDe(t) } : null; }

export async function generateMetadata({ params }) {
  const { lang: l, slug } = await params; const d = ok(l) ? await carregar(slug) : null;
  if (!d || (await publicadoAgora(d.t.id)) === false) return { title: 'Not found', robots: { index: false } };
  const x = tr(l), { t, esp } = d, p = esp[0];
  const serv = p ? servico(l, p.slug, p.label) : '';
  const titulo = nomeLimpo(t.name) + (serv ? ': ' + serv : '') + (t.pres ? (l === 'en' ? ' in ' : ' en ') + curta(t.city) : (t.onl ? ' online' : ''));
  const descricao = resumo(x.profileDesc(t.name, serv, t.pres ? t.city : ''));
  return { title: titulo, description: descricao, alternates: { canonical: abs(l, '/treinador/' + (t.canon || t.id), SITE), languages: versoes('/treinador/' + (t.canon || t.id), SITE) },
    openGraph: { siteName: '99coach', locale: x.locale, title: titulo, description: descricao, url: abs(l, '/treinador/' + t.id, SITE), type: 'profile', images: [t.photo || '/img/og-99coach.png'] } };
}

export default async function Page({ params }) {
  const { lang: l, slug } = await params; if (!ok(l)) notFound();
  const d = await carregar(slug); if (!d || (await publicadoAgora(d.t.id)) === false) notFound();
  const x = tr(l), { t, esp } = d, p = esp[0], primeiro = t.name.split(' ')[0];
  const cid = t.pres ? slugify(t.city) : '';
  const parecidos = p ? lista(p.slug, cid || (t.onl ? 'online' : '')).filter((y) => y.id !== t.id).slice(0, 6) : [];
  const pre = '/treinadores/';
  const ld = { '@context': 'https://schema.org', '@type': 'ProfilePage', url: abs(l, '/treinador/' + t.id, SITE), inLanguage: x.htmlLang,
    mainEntity: { '@type': 'Person', name: nomeLimpo(t.name), ...(t.photo ? { image: t.photo } : {}), ...(esp.length ? { knowsAbout: esp.map((s) => esporteNome(l, s.slug, s.label)) } : {}) } };
  const data = t.pub ? t.pub.split('-').reverse().join('/') : '';
  return (
    <ShellIdioma l={l}>
      <nav className="ssr-crumb" aria-label={x.youAreHere}><a href={hr(l, '/')}>{x.home}</a>{p ? <> › <a href={hr(l, pre + p.slug)}>{esporteNome(l, p.slug, p.label)}</a></> : null}{p && cid ? <> › <a href={hr(l, pre + p.slug + '/' + cid)}>{t.city}</a></> : null} › <span>{t.name}</span></nav>
      <section className="ssr-hero ssr-perfil">
        {t.photo ? <img className="ssr-foto" src={t.photo} alt={t.name} width="88" height="88" fetchPriority="high" /> : <span className="ssr-av ssr-av--lg" aria-hidden="true">{t.ini || t.name.slice(0, 1)}</span>}
        <div><h1>{t.name}</h1>{t.spec ? <p lang="pt-BR">{t.spec}</p> : null}
          <p>{[t.pres ? x.inPersonAt(t.city) : '', t.onl ? x.coachesOnline : ''].filter(Boolean).join(' · ') || x.noLoc}</p></div>
      </section>
      {t.importado ? (
        <section aria-labelledby="h-orig" className="ssr-aviso"><h2 id="h-orig">{x.contact}</h2>
          {t.ig ? <p><a href={'https://www.instagram.com/' + t.ig + '/'} rel="noopener" target="_blank">{x.igTalk(primeiro, t.ig)}</a></p> : null}
          <p>{x.imported(primeiro, data)} <a href={'/app#publico-perfilpedido-' + t.id}>{x.correct}</a></p></section>
      ) : (
        <section aria-labelledby="h-ped" className="ssr-aviso"><h2 id="h-ped">{x.coaching}</h2><p>{x.coachingP(primeiro)}</p><p><a href={'/app#publico-pedir-' + t.id}>{x.askCoaching}</a></p></section>
      )}
      {esp.length ? <section aria-labelledby="h-esp"><h2 id="h-esp">{x.sportsOf}</h2>
        <ul className="ssr-chips">{esp.map((s) => <li key={s.slug}><a href={hr(l, pre + s.slug + (cid ? '/' + cid : ''))}>{esporteNome(l, s.slug, s.label)}</a></li>)}</ul></section> : null}
      {parecidos.length ? <section aria-labelledby="h-par"><h2 id="h-par">{x.others}</h2><ul className="ssr-list">{parecidos.map((y) => <CartaoIdioma key={y.id} l={l} t={y} />)}</ul></section> : null}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />
    </ShellIdioma>
  );
}
