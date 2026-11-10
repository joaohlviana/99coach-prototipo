/* T6 · FT01 Habilitar recebimentos e FT09 Conta e requisitos (cadastro no provedor simulado; nenhum dado bancário real) */
REG.screen({
  page: 'treinador', key: 'ft01', id: 'FT01', title: 'Habilitar recebimentos', mtitle: 'Recebimentos', nav: 'recebimentos', back: 'H09',
  normal: 'Há informações pendentes',
  scens: [['verif', 'Em verificação'], ['prazo', 'Prazo desconhecido'], ['interrompido', 'Cadastro interrompido'], ['analise', 'Verificação em análise'],
    ['sessao', 'Sessão do provedor vencida'], ['retorno', 'Retorno interrompido'], ['pais', 'País/canal não habilitado']],
  vals: function (ctx) {
    var T6 = window.T6, c = DB.t6_conta, scn = ctx.scn;
    var openProv = function () { GO('FT09', { prov: '1' }); };
    var allOk = c.caps.payout === 'sim' && c.caps.transfer === 'sim' && c.caps.sell === 'sim';
    var A = {
      verif: ['info', 'clock', 'Em verificação', 'Prazo informado pelo provedor: até 2 dias úteis a partir de 26/10 08:40. Você pode continuar vendendo.', 'Continuar no provedor', openProv],
      prazo: ['warn', 'clock', 'Prazo desconhecido', '“O provedor não informou prazo.” Você pode vender; o envio ao banco espera a verificação.', 'Consultar de novo', function () { ctx.toast('Consultamos às ' + U.now() + ': o provedor ainda não informou prazo.'); }],
      interrompido: ['warn', 'alert', 'Cadastro interrompido', 'Você saiu antes de concluir. Retome de onde parou: Conta bancária. O que já foi enviado continua salvo no provedor.', 'Tentar de novo', openProv],
      analise: ['info', 'clock', 'A verificação ainda está em análise', 'Concluir o passo no provedor não habilita automaticamente. Avisamos quando o provedor confirmar.', 'Consultar de novo', function () { T6.providerConfirms(); ctx.scenario(''); ctx.toast('O provedor confirmou: envio ao banco habilitado.'); }],
      sessao: ['risk', 'lock', 'Sessão do provedor vencida', 'Por segurança, o link do cadastro vale 15 minutos. Abra de novo; o que você já enviou continua salvo lá.', 'Corrigir', openProv],
      retorno: ['warn', 'alert', 'Retorno interrompido', 'Não recebemos a resposta do provedor quando você voltou. Não marcamos nada como concluído.', 'Corrigir', function () { T6.backFromProvider(); ctx.scenario(''); ctx.toast('Consultamos o provedor: seu envio está em análise.'); }],
      pais: ['risk', 'pin', 'País/canal não habilitado', 'Recebimentos pela 99Coach funcionam hoje só para contas no Brasil, com cartão e Pix.', 'Saiba por quê', function () {
        ctx.ask({ title: 'Por que não está habilitado', text: 'O provedor de pagamentos que a 99Coach usa só abre contas de recebimento no Brasil.', lines: ['Você continua usando a 99Coach sem vender.', 'Alunos podem pagar você fora da plataforma; esses valores não entram no saldo do provedor.', 'Avisamos se o seu país for habilitado.'], ok: 'Entendi', cancel: false });
      }]
    };
    var a = A[scn] || null;
    if (!a && c.verif === 'analise') a = A.analise;
    var caps = T6.capRows(false);
    if (scn === 'pais') caps = caps.map(function (r) { return { l: r.l, v: 'não disponível', cls: 'badge badge--risk' }; });
    if (scn === 'verif' || scn === 'prazo' || scn === 'analise') caps = caps.map(function (r) { return r.v === 'sim' ? r : { l: r.l, v: 'em verificação', cls: 'badge badge--plain' }; });
    return {
      hasAlert: !!a, aCls: a ? 'alert alert--' + a[0] + ' t6-alert' : '', aIc: a ? 'ic ic--sm i-' + a[1] : '', aT: a ? a[2] : '', aS: a ? a[3] : '', aBtn: a ? a[4] : '', aGo: a ? a[5] : function () {},
      allOk: allOk && !a && scn === '', notOk: !(allOk && !a && scn === ''), canGo: scn !== 'pais',
      reqs: T6.reqRows(), caps: caps, country: c.country + ' · ' + c.methods,
      openProv: openProv, back: function () { GO('H09'); }
    };
  }
});

REG.screen({
  page: 'treinador', key: 'ft09', id: 'FT09', title: 'Conta e requisitos', mtitle: 'Conta', nav: 'recebimentos', back: 'H09',
  normal: 'Recebimento pendente',
  scens: [['sessao', 'Sessão expirou'], ['pendente', 'Atualização pendente'], ['emdia', 'Tudo em dia'], ['analise', 'Atualização em análise'], ['retorno', 'Retorno perdido'], ['desconhecida', 'Capacidade desconhecida']],
  vals: function (ctx) {
    var T6 = window.T6, c = DB.t6_conta, scn = ctx.scn, ui = ctx.ui;
    var provOpen = ui.prov !== undefined ? !!ui.prov : (ctx.p.prov === '1' && scn === '');
    var openProv = function () { ctx.setUi({ prov: true, provOk: false, interrupted: false }); };
    var confirm = function () { T6.providerConfirms(); if (scn) ctx.scenario(''); ctx.toast('O provedor confirmou: envio ao banco habilitado. Próximo envio previsto para 29/10.'); };
    var A = {
      sessao: ['risk', 'lock', 'Sessão expirou', 'Entre de novo no provedor para continuar. Nada foi perdido do que você já enviou.', 'Continuar', openProv],
      pendente: ['warn', 'alert', 'Atualização pendente', 'Atualize até ' + c.deadline + '. Senão, além do envio ao banco (pausado desde ' + c.pausedSince + '), os repasses para sua conta também pausam. Suas vendas continuam.', 'Consultar de novo', function () { ctx.toast('Consultamos às ' + U.now() + ': a atualização continua pendente.'); }],
      analise: ['info', 'clock', 'Atualização em análise', 'O provedor está conferindo a titularidade da conta. Concluir o formulário não habilita sozinho.', 'Consultar de novo', confirm],
      retorno: ['warn', 'alert', 'Retorno perdido', 'Você pode ter concluído no provedor, mas a resposta não chegou. Consulte antes de repetir o cadastro.', 'Corrigir', function () { T6.backFromProvider(); ctx.scenario(''); ctx.toast('Consultamos o provedor: seu envio chegou e está em análise.'); }],
      desconhecida: ['warn', 'info', 'Capacidade desconhecida', 'Não conseguimos confirmar com o provedor o que sua conta pode fazer agora. Não mostramos “sim” sem confirmação.', 'Consultar de novo', function () { ctx.scenario(''); ctx.toast('Consulta refeita às ' + U.now() + '.'); }]
    };
    var a = A[scn] || null;
    if (!a && ui.interrupted) a = ['warn', 'alert', 'Cadastro interrompido', 'Você saiu do provedor sem concluir. Retome de onde parou: Conta bancária.', 'Tentar de novo', openProv];
    if (!a && c.verif === 'analise' && scn === '') a = A.analise;
    var emdia = scn === 'emdia' || (scn === '' && T6.payoutOk());
    var caps = T6.capRows(scn === 'desconhecida');
    if (scn === 'emdia') caps = caps.map(function (r) { return { l: r.l, v: 'sim', cls: 'badge badge--ok' }; });
    var reqs = T6.reqRows();
    if (scn === 'emdia') reqs = reqs.map(function (r) { return Object.assign({}, r, { st: 'ok', stCls: 'onb-st onb-st--ok', ic: 'ic ic--sm i-check', icCls: 'onb-secs__ic is-ok' }); });
    var pending = !emdia && c.caps.payout !== 'sim';
    return {
      provOpen: provOpen, provClosed: !provOpen, provOk: !!ui.provOk, provOkCls: 'check' + (ui.provOk ? ' is-on' : ''), provOkPressed: String(!!ui.provOk), provNotOk: !ui.provOk,
      toggleProvOk: function () { ctx.setUi({ provOk: !ui.provOk }); },
      provDone: function () {
        if (!ui.provOk) { ctx.toast('Marque a confirmação de titularidade para concluir.'); return; }
        T6.backFromProvider(); ctx.setUi({ prov: false, provOk: false, interrupted: false });
        ctx.toast('Você voltou do provedor. A verificação está em análise; nada muda até o provedor confirmar.');
      },
      provExit: function () { ctx.setUi({ prov: false, provOk: false, interrupted: true }); },
      hasAlert: !!a, aCls: a ? 'alert alert--' + a[0] + ' t6-alert' : '', aIc: a ? 'ic ic--sm i-' + a[1] : '', aT: a ? a[2] : '', aS: a ? a[3] : '', aBtn: a ? a[4] : '', aGo: a ? a[5] : function () {},
      emdia: emdia && !a, pending: pending, deadlineT: 'Atualize até ' + c.deadline, deadlineS: 'Envio ao banco pausado desde ' + c.pausedSince + '. Se não atualizar até ' + c.deadline + ', os repasses para sua conta também pausam.',
      caps: caps, reqs: reqs, acct: c.acct, bank: c.bank, provider: c.provider, updated: 'Situação consultada em ' + c.updated,
      openProv: openProv,
      help: function () { ctx.ask({ title: 'Pedir ajuda com o cadastro', text: 'A equipe da 99Coach orienta por mensagem, sem pedir seus dados bancários. O cadastro continua sendo feito no provedor.', lines: ['Resposta em até 1 dia útil.', 'Você também pode concluir pelo celular, no mesmo link.'], ok: 'Enviar pedido de ajuda', onOk: function () { ctx.toast('Pedido de ajuda enviado. Responderemos em Mensagens.'); } }); },
      goRestr: function () { GO('FT05'); }, goHub: function () { GO('H09'); }
    };
  }
});
