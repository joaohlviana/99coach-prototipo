/* Conta da aluna no celular: contratações, encontrar treinador e preferências (sem entrada de IA) */
REG.screen({
  page: 'aluno', key: 'menu', id: 'AMENU', title: 'Conta', nav: 'conta',
  vals: function (ctx) {
    var row = function (title, sub, ic, to, params) { return { title: title, sub: sub, ic: 'ic ic--sm i-' + ic, go: function () { GO(to, params || {}); } }; };
    var act = DB.contratacoes.filter(function (c) { return c.status !== 'cancelada'; }).length;
    return {
      name: 'Ana Carolina Souza', ini: 'AC', role: 'Aluna de Rafael Lima · Acompanhamento online',
      groups: [
        { title: 'Meu acompanhamento', items: [row('Minhas contratações', U.plural(act, 'contratação', 'contratações'), 'card', 'H11'), row('Meus programas', 'Retomar de onde parou', 'book', 'ALU06'), row('Responder formulário', 'Check-in semanal pendente', 'file', 'ALU08')] },
        { title: 'Descobrir', items: [row('Encontrar treinador', 'Buscar por modalidade e cidade', 'search', '@home'), row('Favoritos', 'Treinadores e programas salvos', 'heart', 'PUB07')] },
        { title: 'Conta', items: [row('Conta e preferências', 'Idioma, segurança, privacidade e avisos', 'settings', '@onboarding', { flow: 'convite', scn: 'contaaluno' }), row('Compartilhamentos', 'O que cada treinador vê', 'share', '@onboarding', { flow: 'convite', scn: 'compart' })] }
      ],
      becomeTrainer: function () { GO('@onboarding', { flow: 'treinador' }); }
    };
  }
});
