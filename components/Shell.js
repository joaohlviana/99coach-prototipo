// Moldura comum: o servidor entrega o conteúdo pronto dentro de #app e o app interativo assume em seguida.
// `route` diz ao app qual tela abrir (a mesma que o servidor acabou de montar).

import pacote from '../public/shell/version.json';

// onde: lugar da página (cidade ou estado) mostrado na busca do topo; a busca procura só nele
export function Topo({ onde } = {}) {
  return (
    <header className="ssr-top">
      <a className="ssr-logo" href="/" aria-label="99coach, página inicial"><img src="/img/c994186ea30c1564.svg" alt="99coach" width="126" height="32" /></a>
      {onde ? (
        // mesmo padrão da busca do app: "Modalidade | Onde", cada parte leva à troca, e o x limpa o lugar
        <div className="ssr-search ssr-hs" role="group" aria-label={'Busca atual: ' + (onde.mod || 'Todos os esportes') + ' · ' + onde.label}>
          <a className="ssr-hsb" href="/esportes" aria-label={'Modalidade ' + (onde.mod || 'Todos os esportes') + ', trocar'}><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg><span className="ssr-hsl"><small>Modalidade</small><b>{onde.mod || 'Todos os esportes'}</b></span></a>
          <span className="ssr-hsep" aria-hidden="true" />
          <a className="ssr-hsb ssr-hsb--city" href="/cidades" aria-label={'Onde ' + onde.label + ', trocar'}><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></svg><span className="ssr-hsl"><small>Onde</small><b>{onde.curto || onde.label}</b></span></a>
          <a className="ssr-hclr" href={onde.limpar || '/'} aria-label="Limpar o lugar e ver todo o Brasil" title="Limpar o lugar"><svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg></a>
        </div>
      ) : (
        <form className="ssr-search" action="/buscar" method="get" role="search"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg><input name="q" type="search" placeholder="Nome, modalidade ou cidade" aria-label="Buscar treinador por nome, modalidade ou cidade" /></form>
      )}
      <nav aria-label="Principal">
        <a href="/">Treinadores</a>
        <a href="/#esportes">Esportes</a>
        <a href="/sou-treinador">Sou treinador</a>
      </nav>
      <a className="ssr-btn" href="/app#onboarding-entrar">Entrar</a>
    </header>
  );
}

export function Rodape() {
  return (
    <footer className="ssr-foot">
      <div className="ssr-foot__grid">
        <div className="ssr-foot__brand"><img src="/img/c994186ea30c1564.svg" alt="99coach" width="110" height="28" />
          <p>Compare profissionais, modalidades e formatos de atendimento para escolher com mais clareza.</p>
          <p className="ssr-foot__langs"><b lang="pt-BR">Português</b><a href="/en" hrefLang="en" lang="en">English</a><a href="/es" hrefLang="es" lang="es">Español</a></p></div>
        <div><b>Para treinar</b><a href="/">Treinadores</a><a href="/#esportes">Esportes</a><a href="/cidades">Cidades</a><a href="/worldwide">Worldwide</a></div>
        <div><b>Para treinadores</b><a href="/sou-treinador">Sou treinador</a><a href="/app#onboarding-entrar">Entrar no painel</a></div>
        <div><b>Esportes</b><a href="/treinadores/musculacao">Musculação</a><a href="/treinadores/funcional">Funcional</a><a href="/treinadores/pilates">Pilates</a><a href="/treinadores/corrida">Corrida</a></div>
        <div><b>Ajuda</b><a href="/ajuda">Central de ajuda</a><a href="/ajuda/termos">Termos</a><a href="/ajuda/privacidade">Privacidade</a></div>
      </div>
      <div className="ssr-foot__word" aria-hidden="true">99Coach · mais que treino</div>
      <span className="ssr-foot__m">© 2026 99coach</span>
    </footer>
  );
}

// soServidor: página que fica só com o HTML do servidor (leve, sem carregar o app); os links levam às páginas interativas
export default function Shell({ route, children, soServidor, espera, onde }) {
  const boot = 'window.__ROUTE=' + JSON.stringify(route || null).replace(/</g, '\\u003c') + ';';
  return (
    <>
      {/* com o app a caminho, a versão do servidor fica escondida (sem troca de tela visível); continua no HTML para
          leitores e buscadores e volta a aparecer se o app falhar ou passar de 6 s */}
      {soServidor ? null : <script dangerouslySetInnerHTML={{ __html: "(function(){var d=document.documentElement;d.classList.add('app-wait');" + (espera ? "d.classList.add('tem-espera');" : "") + "setTimeout(function(){if(!d.classList.contains('app-on'))d.classList.add('app-off')},6000)})();" }} />}
      {/* conteúdo do servidor: fica visível até o app ligar e continua no HTML para leitores e buscadores */}
      <div id="ssr" className={soServidor ? "ssr ssr--solo" : "ssr"}>
        {/* foto que não carrega some e ficam as iniciais (sem ícone de imagem quebrada) */}
        <script dangerouslySetInnerHTML={{ __html: "document.addEventListener('error',function(e){var t=e.target;if(t&&t.tagName==='IMG'&&t.closest&&t.closest('.ssr-ph,.ssr-av,.ssr-perfil'))t.style.visibility='hidden'},true);" }} />
        <a className="ssr-skip" href="#conteudo-ssr">Pular para o conteúdo</a>
        <Topo onde={onde} />
        <main id="conteudo-ssr">{children}</main>
        <Rodape />
        {soServidor ? <nav className="ssr-tab" aria-label="Navegação do site">
          <a href="/"><svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg><span>Explorar</span></a>
          <a href="/cidades"><svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></svg><span>Cidades</span></a>
          <a href="/app#onboarding-entrar"><svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></svg><span>Conta</span></a>
        </nav> : null}
      </div>
      {/* o app interativo monta aqui; o React não mexe no que estiver dentro */}
      {soServidor ? null : <>
        <div id="app" lang="pt-BR" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: espera || '' }} />
        <script dangerouslySetInnerHTML={{ __html: boot }} />
        {/* o app começa a baixar junto com a página: telas e código em paralelo */}
        <link rel="preload" href={'/shell/templates.html?v=' + pacote.v} as="fetch" crossOrigin="anonymous" />
        <link rel="preload" href={'/shell/app.js?v=' + pacote.v} as="script" />
        <script src={'/next-loader.js?v=' + pacote.v} defer />
      </>}
    </>
  );
}

// cartão de treinador nas listas do servidor: só o que o catálogo afirma (nome, especialidade, cidade, formato)
export function Cartao({ t }) {
  const onde = [t.pres ? 'Presencial em ' + t.city : (t.local ? 'Presencial em ' + t.local : ''), t.onl ? 'Online' : ''].filter(Boolean).join(' · ') || (t.city ? t.city : 'Local não informado');
  return (
    <li className="ssr-card">
      <a className="ssr-ph" href={'/treinador/' + t.id} tabIndex={-1} aria-hidden="true"><span>{t.ini || t.name.slice(0, 1)}</span>{t.photo ? <img src={t.photo} alt="" width="320" height="320" loading="lazy" decoding="async" /> : null}</a>
      <div>
        <a href={'/treinador/' + t.id}><b>{t.name}</b></a>
        {t.spec ? <span>{t.spec}</span> : null}
        <span>{onde}</span>
      </div>
    </li>
  );
}

// Paginação numerada: primeiras, vizinhas da atual, saltos de 10 em 10 e últimas. Nenhuma página fica a mais de ~10 cliques.
export function Paginacao({ base, pagina, paginas, total, ini, n }) {
  if (paginas <= 1) return null;
  const ks = new Set([1, 2, 3, paginas - 2, paginas - 1, paginas]);
  for (let i = pagina - 3; i <= pagina + 3; i++) ks.add(i);
  for (let i = 10; i < paginas; i += 10) ks.add(i);
  const nums = [...ks].filter((i) => i >= 1 && i <= paginas).sort((a, b) => a - b);
  const href = (i) => base + (i > 1 ? '/pagina/' + i : '');
  const out = []; let prev = 0;
  nums.forEach((i) => { if (i - prev > 1) out.push(<li key={'g' + i} aria-hidden="true">…</li>); out.push(<li key={i}>{i === pagina ? <b aria-current="page">{i}</b> : <a href={href(i)}>{i}</a>}</li>); prev = i; });
  return (
    <nav className="ssr-pag" aria-label="Páginas da lista">
      <p className="ssr-note">Mostrando {ini + 1} a {ini + n} de {total.toLocaleString('pt-BR')} · página {pagina} de {paginas}</p>
      <ol className="ssr-pages">
        {pagina > 1 ? <li><a rel="prev" href={href(pagina - 1)}>‹ Anterior</a></li> : null}
        {out}
        {pagina < paginas ? <li><a rel="next" href={href(pagina + 1)}>Próxima ›</a></li> : null}
      </ol>
    </nav>
  );
}

