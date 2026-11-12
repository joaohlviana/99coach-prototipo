// Moldura comum: o servidor entrega o conteúdo pronto dentro de #app e o app interativo assume em seguida.
// `route` diz ao app qual tela abrir (a mesma que o servidor acabou de montar).

export function Topo() {
  return (
    <header className="ssr-top">
      <a className="ssr-logo" href="/" aria-label="99coach, página inicial">99coach</a>
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
      <a href="/app#publico-ajuda">Central de ajuda</a>
      <a href="/app#publico-ajuda-termos">Termos</a>
      <a href="/app#publico-ajuda-privacidade">Privacidade</a>
      <span>© 2026 99coach</span>
    </footer>
  );
}

export default function Shell({ route, children }) {
  const boot = 'window.__ROUTE=' + JSON.stringify(route || null).replace(/</g, '\\u003c') + ';';
  return (
    <>
      {/* conteúdo do servidor: fica visível até o app ligar e continua no HTML para leitores e buscadores */}
      <div id="ssr" className="ssr">
        <a className="ssr-skip" href="#conteudo-ssr">Pular para o conteúdo</a>
        <Topo />
        <main id="conteudo-ssr">{children}</main>
        <Rodape />
      </div>
      {/* o app interativo monta aqui; o React não mexe no que estiver dentro */}
      <div id="app" lang="pt-BR" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: '' }} />
      <script dangerouslySetInnerHTML={{ __html: boot }} />
      <script src="/next-loader.js" defer />
    </>
  );
}

// cartão de treinador nas listas do servidor: só o que o catálogo afirma (nome, especialidade, cidade, formato)
export function Cartao({ t }) {
  const onde = [t.pres ? 'Presencial em ' + t.city : '', t.onl ? 'Online' : ''].filter(Boolean).join(' · ');
  return (
    <li className="ssr-card">
      <span className="ssr-av" aria-hidden="true">{t.ini || t.name.slice(0, 1)}</span>
      <div>
        <a href={'/treinador/' + t.id}><b>{t.name}</b></a>
        {t.spec ? <span>{t.spec}</span> : null}
        <span>{onde}</span>
        <small>Perfil importado · não confirmado pelo profissional</small>
      </div>
    </li>
  );
}
