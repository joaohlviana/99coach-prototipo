/* Conta da aluna no celular: contratações, encontrar treinador e preferências (sem entrada de IA) */
REG.screen({
  page: 'aluno', key: 'menu', id: 'AMENU', title: 'Conta', nav: 'conta',
  vals: function (ctx) {
    var row = function (title, sub, ic, to, params) { return { title: title, sub: sub, ic: 'ic ic--sm i-' + ic, go: function () { GO(to, params || {}); } }; };
    var act = DB.contratacoes.filter(function (c) { return c.status !== 'cancelada'; }).length;
    var real = window.ACCT && window.ACCT.area() && !document.documentElement.classList.contains('demo');
    var linked = !real || (window.ACCT.hasLink && window.ACCT.hasLink());
    return {
      name: real && window.ROLES.aluno.me ? window.ROLES.aluno.me.name : 'Ana Carolina Souza', ini: real && window.ROLES.aluno.me ? U.ini(window.ROLES.aluno.me.name) : 'AC', badge: real ? 'Conta de aluno' : 'Aluna', role: window.ACCT && window.ACCT.area() && !document.documentElement.classList.contains('demo') && !(window.ACCT.hasLink && window.ACCT.hasLink()) ? 'Sem acompanhamento ainda' : (real ? 'Acompanhamento com ' + ((window.ACCT.myTrainer() || {}).trainerName || 'seu treinador') : 'Aluna de Rafael Lima · Acompanhamento online'),
      groups: real ? [
        // produto: só o que existe de verdade
        { title: 'Meu acompanhamento', items: [row('Meu acompanhamento', linked ? 'Treino, registro, evolução e conversa' : 'Pedidos e como começar', 'calendar', 'semvinculo')] },
        { title: 'Descobrir', items: [row('Encontrar treinador', 'Buscar por modalidade e cidade', 'search', '@home'), row('Favoritos', window.FAV ? U.plural(window.FAV.count(), 'treinador salvo', 'treinadores salvos') + ' ' + window.FAV.where() : 'Treinadores salvos', 'heart', 'PUB07')] },
        { title: 'Conta', items: [row('Avisos', 'Novidades da sua conta e o que avisar', 'bell', 'AVISOS'), window.CONTA.presenceRow(ctx), row('Meus dados e segurança', 'Baixar cópia · sair dos outros aparelhos · excluir conta', 'file', 'ACC13R'), row('Sair da conta', 'Encerra a sessão neste aparelho', 'logout', '@sair')] }
      ] : [
        { title: 'Meu acompanhamento', items: [row('Minhas contratações', U.plural(act, 'contratação', 'contratações'), 'card', 'H11')].concat(linked ? [row('Meus programas', 'Retomar de onde parou', 'book', 'ALU06'), row('Responder formulário', 'Check-in semanal pendente', 'file', 'ALU08')] : []) },
        { title: 'Descobrir', items: [row('Encontrar treinador', 'Buscar por modalidade e cidade', 'search', '@home'), row('Favoritos', 'Treinadores e programas salvos', 'heart', 'PUB07')] },
        { title: 'Conta', items: [row('Meus dados', 'Baixar uma cópia · o que fica neste aparelho', 'file', 'ACC13R'), row('Conta e preferências', 'Idioma, segurança, privacidade e avisos', 'settings', '@onboarding', { flow: 'convite', scn: 'contaaluno' }), row('Compartilhamentos', 'O que cada treinador vê', 'share', '@onboarding', { flow: 'convite', scn: 'compart' }), row('Sair da conta', 'Encerra a sessão neste aparelho', 'logout', '@sair')] }
      ],
      becomeTrainer: function () { GO('@onboarding', { flow: 'treinador' }); }
    };
  }
});
