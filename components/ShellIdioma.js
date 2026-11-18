import { languageAlternates } from '../lib/domains.js';
// Moldura das páginas públicas em inglês e espanhol: só o HTML do servidor (leve). As ações levam ao app, em português.
import { t as tr, esporteNome } from '../lib/i18n.js';

const F = {
  en: { tag: 'Compare coaches, sports and formats to choose with confidence.', train: 'Train', coaches: 'For coaches', helpH: 'Help', tabE: 'Explore', tabU: 'Account' },
  es: { tag: 'Compara profesionales, deportes y formatos para elegir con claridad.', train: 'Entrenar', coaches: 'Para entrenadores', helpH: 'Ayuda', tabE: 'Explorar', tabU: 'Cuenta' }
};

export default function ShellIdioma({ l, caminho = "/", children }) {
  const x = tr(l), links = languageAlternates(caminho);
  return (
    <div id="ssr" className="ssr ssr--solo" lang={x.htmlLang}>
      <script dangerouslySetInnerHTML={{ __html: "document.addEventListener('error',function(e){var t=e.target;if(t&&t.tagName==='IMG'&&t.closest&&t.closest('.ssr-ph,.ssr-av,.ssr-perfil'))t.style.visibility='hidden'},true);" }} />
      <a className="ssr-skip" href={'/' + l + (caminho === '/' ? '' : caminho) + '#conteudo-ssr'}>{x.skip}</a>
      <header className="ssr-top">
        <a className="ssr-logo" href={'/' + l} aria-label={'99coach, ' + x.home}><img src="/img/c994186ea30c1564.svg" alt="99coach" width="126" height="32" /></a>
        <form className="ssr-search" action={'/' + l + '/buscar'} method="get" role="search"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg><input name="q" type="search" placeholder={x.search} aria-label={x.searchLabel} /></form>
        <nav aria-label="Main">
          <a href={'/' + l}>{x.navCoaches}</a>
          <a href={'/' + l + '#sports'}>{x.navSports}</a>
          <a href="https://www.99coach.com.br/app#onboarding-treinador">{x.navIamCoach}</a>
        </nav>
        <a className="ssr-btn" href="https://www.99coach.com.br/app#onboarding-entrar">{x.navLogin}</a>
      </header>
      <main id="conteudo-ssr">
        <p className="ssr-note ssr-lang">{x.appNote} <a href={links['pt-BR']} hrefLang="pt-BR" lang="pt-BR">Português</a> · <a href={links.en} hrefLang="en" lang="en">English</a> · <a href={links.es} hrefLang="es" lang="es">Español</a></p>
        {children}
      </main>
      <footer className="ssr-foot">
        <div className="ssr-foot__grid">
          <div className="ssr-foot__brand"><img src="/img/c994186ea30c1564.svg" alt="99coach" width="110" height="28" />
            <p>{F[l].tag}</p>
            <p className="ssr-foot__langs">{[['pt-BR', links['pt-BR'], 'Português'], ['en', links.en, 'English'], ['es', links.es, 'Español']].map(([k, h, n]) => k === l ? <b key={k} lang={k}>{n}</b> : <a key={k} href={h} hrefLang={k} lang={k}>{n}</a>)}</p></div>
          <div><b>{F[l].train}</b><a href={'/' + l}>{x.navCoaches}</a><a href={'/' + l + '#sports'}>{x.navSports}</a><a href="https://www.99coach.com.br/cidades" hrefLang="pt-BR">{x.cities}</a></div>
          <div><b>{F[l].coaches}</b><a href="https://www.99coach.com.br/app#onboarding-treinador">{x.navIamCoach}</a><a href="https://www.99coach.com.br/app#onboarding-entrar">{x.navLogin}</a></div>
          <div><b>{x.navSports}</b>{['musculacao', 'funcional', 'pilates', 'corrida'].map((k) => <a key={k} href={'/' + l + '/treinadores/' + k}>{esporteNome(l, k, k)}</a>)}</div>
          <div><b>{F[l].helpH}</b><a href="https://www.99coach.com.br/app#publico-ajuda">{x.help}</a><a href="https://www.99coach.com.br/app#publico-ajuda-termos">{x.terms}</a><a href="https://www.99coach.com.br/app#publico-ajuda-privacidade">{x.privacy}</a></div>
        </div>
        <div className="ssr-foot__word" aria-hidden="true">99Coach</div>
        <span className="ssr-foot__m">© 2026 99coach</span>
      </footer>
      <nav className="ssr-tab" aria-label="Site">
        <a href={'/' + l}><svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg><span>{F[l].tabE}</span></a>
        <a href="https://www.99coach.com.br/cidades" hrefLang="pt-BR"><svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></svg><span>{x.cities}</span></a>
        <a href="https://www.99coach.com.br/app#onboarding-entrar"><svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></svg><span>{F[l].tabU}</span></a>
      </nav>
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
