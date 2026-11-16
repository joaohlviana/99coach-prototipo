// Moldura das páginas públicas em inglês e espanhol: só o HTML do servidor (leve). As ações levam ao app, em português.
import { t as tr, esporteNome } from '../lib/i18n.js';

const F = {
  en: { tag: 'Compare coaches, sports and formats to choose with confidence.', train: 'Train', coaches: 'For coaches', helpH: 'Help' },
  es: { tag: 'Compara profesionales, deportes y formatos para elegir con claridad.', train: 'Entrenar', coaches: 'Para entrenadores', helpH: 'Ayuda' }
};

export default function ShellIdioma({ l, children }) {
  const x = tr(l);
  return (
    <div id="ssr" className="ssr ssr--solo" lang={x.htmlLang}>
      <script dangerouslySetInnerHTML={{ __html: 'document.documentElement.lang=' + JSON.stringify(x.htmlLang) }} />
      <a className="ssr-skip" href="#conteudo-ssr">{x.skip}</a>
      <header className="ssr-top">
        <a className="ssr-logo" href={'/' + l} aria-label={'99coach, ' + x.home}><img src="/img/c994186ea30c1564.svg" alt="99coach" width="126" height="32" /></a>
        <form className="ssr-search" action="/buscar" method="get" role="search"><span aria-hidden="true">⌕</span><input name="q" type="search" placeholder={x.search} aria-label={x.searchLabel} /></form>
        <nav aria-label="Main">
          <a href={'/' + l}>{x.navCoaches}</a>
          <a href={'/' + l + '#sports'}>{x.navSports}</a>
          <a href="/app#onboarding-treinador">{x.navIamCoach}</a>
          <a className="ssr-btn" href="/app#onboarding-entrar">{x.navLogin}</a>
        </nav>
      </header>
      <main id="conteudo-ssr">
        <p className="ssr-note ssr-lang">{x.appNote} <a href="/" hrefLang="pt-BR" lang="pt-BR">Português</a> · <a href="/en" hrefLang="en" lang="en">English</a> · <a href="/es" hrefLang="es" lang="es">Español</a></p>
        {children}
      </main>
      <footer className="ssr-foot">
        <div className="ssr-foot__grid">
          <div className="ssr-foot__brand"><img src="/img/c994186ea30c1564.svg" alt="99coach" width="110" height="28" />
            <p>{F[l].tag}</p>
            <p className="ssr-foot__langs">{[['pt-BR', '/', 'Português'], ['en', '/en', 'English'], ['es', '/es', 'Español']].map(([k, h, n]) => k === l ? <b key={k} lang={k}>{n}</b> : <a key={k} href={h} hrefLang={k} lang={k}>{n}</a>)}</p></div>
          <div><b>{F[l].train}</b><a href={'/' + l}>{x.navCoaches}</a><a href={'/' + l + '#sports'}>{x.navSports}</a><a href="/cidades" hrefLang="pt-BR">{x.cities}</a></div>
          <div><b>{F[l].coaches}</b><a href="/app#onboarding-treinador">{x.navIamCoach}</a><a href="/app#onboarding-entrar">{x.navLogin}</a></div>
          <div><b>{x.navSports}</b>{['musculacao', 'funcional', 'pilates', 'corrida'].map((k) => <a key={k} href={'/' + l + '/treinadores/' + k}>{esporteNome(l, k, k)}</a>)}</div>
          <div><b>{F[l].helpH}</b><a href="/app#publico-ajuda">{x.help}</a><a href="/app#publico-ajuda-termos">{x.terms}</a><a href="/app#publico-ajuda-privacidade">{x.privacy}</a></div>
        </div>
        <div className="ssr-foot__word" aria-hidden="true">99Coach</div>
        <span className="ssr-foot__m">© 2026 99coach</span>
      </footer>
    </div>
  );
}

export function CartaoIdioma({ l, t }) {
  const x = tr(l);
  const onde = [t.pres ? x.inPersonIn(t.city) : '', t.onl ? x.onlineCard : ''].filter(Boolean).join(' · ') || (t.city ? t.city : x.noPlace);
  return (
    <li className="ssr-card">
      <a className="ssr-ph" href={'/' + l + '/treinador/' + t.id} tabIndex={-1} aria-hidden="true"><span>{t.ini || t.name.slice(0, 1)}</span>{t.photo ? <img src={t.photo} alt="" width="320" height="320" loading="lazy" decoding="async" /> : null}</a>
      <div><a href={'/' + l + '/treinador/' + t.id}><b>{t.name}</b></a>{t.spec ? <span lang="pt-BR">{t.spec}</span> : null}<span>{onde}</span></div>
    </li>
  );
}

export function PaginacaoIdioma({ l, base, pagina, paginas, total, ini, n }) {
  if (paginas <= 1) return null;
  const x = tr(l);
  const ks = new Set([1, 2, 3, paginas - 2, paginas - 1, paginas]);
  for (let i = pagina - 3; i <= pagina + 3; i++) ks.add(i);
  for (let i = 10; i < paginas; i += 10) ks.add(i);
  const nums = [...ks].filter((i) => i >= 1 && i <= paginas).sort((a, b) => a - b);
  const href = (i) => base + (i > 1 ? '/pagina/' + i : '');
  const out = []; let prev = 0;
  nums.forEach((i) => { if (i - prev > 1) out.push(<li key={'g' + i} aria-hidden="true">…</li>); out.push(<li key={i}>{i === pagina ? <b aria-current="page">{i}</b> : <a href={href(i)}>{i}</a>}</li>); prev = i; });
  return (
    <nav className="ssr-pag" aria-label={x.pagesLabel}>
      <p className="ssr-note">{x.shown(ini + 1, ini + n, total, pagina, paginas)}</p>
      <ol className="ssr-pages">
        {pagina > 1 ? <li><a rel="prev" href={href(pagina - 1)}>{x.prev}</a></li> : null}
        {out}
        {pagina < paginas ? <li><a rel="next" href={href(pagina + 1)}>{x.next}</a></li> : null}
      </ol>
    </nav>
  );
}
