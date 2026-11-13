// Moldura comum: o servidor entrega o conteúdo pronto dentro de #app e o app interativo assume em seguida.
// `route` diz ao app qual tela abrir (a mesma que o servidor acabou de montar).

export function Topo() {
  return (
    <header className="ssr-top">
      <a className="ssr-logo" href="/" aria-label="99coach, página inicial"><img src="/img/c994186ea30c1564.svg" alt="99coach" width="126" height="32" /></a>
      <form className="ssr-search" action="/buscar" method="get" role="search"><span aria-hidden="true">⌕</span><input name="q" type="search" placeholder="Nome, modalidade ou cidade" aria-label="Buscar treinador por nome, modalidade ou cidade" /></form>
      <nav aria-label="Principal">
        <a href="/">Treinadores</a>
        <a href="/#esportes">Esportes</a>
        <a href="/app#onboarding-treinador">Sou treinador</a>
        <a className="ssr-btn" href="/app#onboarding-entrar">Entrar</a>
      </nav>
    </header>
  );
}

export function Rodape() {
  return (
    <footer className="ssr-foot">
      <a href="/cidades">Cidades</a>
      <a href="/app#publico-ajuda">Central de ajuda</a>
      <a href="/app#publico-ajuda-termos">Termos</a>
      <a href="/app#publico-ajuda-privacidade">Privacidade</a>
      <span className="ssr-foot__m"><img src="/img/c994186ea30c1564.svg" alt="99coach" width="71" height="18" /> © 2026</span>
    </footer>
  );
}

// soServidor: página que fica só com o HTML do servidor (leve, sem carregar o app); os links levam às páginas interativas
export default function Shell({ route, children, soServidor }) {
  const boot = 'window.__ROUTE=' + JSON.stringify(route || null).replace(/</g, '\\u003c') + ';';
  return (
    <>
      {/* conteúdo do servidor: fica visível até o app ligar e continua no HTML para leitores e buscadores */}
      <div id="ssr" className={soServidor ? "ssr ssr--solo" : "ssr"}>
        <a className="ssr-skip" href="#conteudo-ssr">Pular para o conteúdo</a>
        <Topo />
        <main id="conteudo-ssr">{children}</main>
        <Rodape />
      </div>
      {/* o app interativo monta aqui; o React não mexe no que estiver dentro */}
      {soServidor ? null : <>
        <div id="app" lang="pt-BR" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: '' }} />
        <script dangerouslySetInnerHTML={{ __html: boot }} />
        <script src="/next-loader.js" defer />
      </>}
    </>
  );
}

// cartão de treinador nas listas do servidor: só o que o catálogo afirma (nome, especialidade, cidade, formato)
export function Cartao({ t }) {
  const onde = [t.pres ? 'Presencial em ' + t.city : '', t.onl ? 'Online' : ''].filter(Boolean).join(' · ') || (t.city ? t.city : 'Local não informado');
  return (
    <li className="ssr-card">
      <span className="ssr-av" aria-hidden="true">{t.ini || t.name.slice(0, 1)}{t.photo ? <img src={t.photo} alt="" width="48" height="48" loading="lazy" decoding="async" /> : null}</span>
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
