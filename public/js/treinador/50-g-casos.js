/* T6 · FT10 Reembolsos, disputas e saldo negativo (sem botão de encerrar disputa) · FT11 Assinatura 99Coach e uso de IA (demonstração: nada é cobrado) */
REG.screen({
  page: 'treinador', key: 'ft10', id: 'FT10', title: 'Reembolsos e disputas', mtitle: 'Casos', nav: 'recebimentos',
  back: function (ctx) { return ctx.id ? 'FT10' : 'H09'; },
  testIds: ['D-12', 'R-08'],
  normal: 'Casos que precisam de atenção',
  scens: [['prazo', 'Prazo da disputa'], ['negativo', 'Saldo negativo'], ['ganhou', 'Ganhou'], ['desconhecido', 'Resultado desconhecido'], ['indisp', 'Consulta indisponível']],
  vals: function (ctx) {
    var T6 = window.T6, scn = ctx.scn, ui = ctx.ui;
    var id = ctx.id || ({ prazo: 'D-12', ganhou: 'D-12', desconhecido: 'D-12' })[scn] || '';
    var indisp = scn === 'indisp';
    var A = {
      prazo: ['warn', 'Prazo da disputa', '4 dias para enviar evidência: o prazo do banco termina em 30/10. Depois disso, o banco decide só com o que tiver.', 'Consultar de novo', function () { ctx.toast('Consultamos às ' + U.now() + ': prazo mantido em 30/10.'); }],
      negativo: ['risk', 'Saldo negativo', 'Se uma disputa for perdida depois do envio ao banco, o liberado pode ficar negativo (ex.: − R$ 12,40). A recuperação vem das próximas vendas e aparece no extrato como “Recuperação de saldo”, nunca escondida em taxa.', 'Tentar de novo', function () { ctx.scenario(''); ctx.toast('Consultamos às ' + U.now() + ': seu saldo hoje não está negativo.'); }],
      ganhou: ['ok', 'Ganhou', 'O banco decidiu a seu favor em 26/10: R$ 88,28 voltam do retido para o liberado e aparecem no extrato.', '', null],
      desconhecido: ['warn', 'Resultado desconhecido', 'O banco ainda não informou a decisão. Enviar resposta não significa vencer a disputa.', 'Consultar de novo', function () { ctx.toast('Consultamos às ' + U.now() + ': decisão ainda não informada.'); }],
      indisp: ['risk', 'Consulta indisponível', 'Não conseguimos ler os casos no provedor agora. Nada foi alterado.', 'Tentar de novo', function () { ctx.scenario(''); ctx.toast('Casos carregados às ' + U.now() + '.'); }]
    };
    var a = A[scn] || null;
    function caseRow(k) {
      var s = T6.sale(k.sale), open = k.state !== 'concluído';
      var amt = k.kind === 'disputa' ? s.base : (s.refund ? s.refund.amount : 0);
      return { id: k.id, t: (k.kind === 'disputa' ? 'Disputa #' : 'Reembolso #') + k.id + ' · ' + s.order, s: T6.brl(amt) + ' · ' + k.state + (k.deadline && open ? ' · prazo ' + k.deadline : ''), stCls: open ? 'badge badge--warn' : 'badge badge--plain', st: open ? 'em aberto' : 'concluído', ic: 'ic ic--sm i-' + (k.kind === 'disputa' ? 'shield' : 'refresh'), go: function () { GO('FT10', { id: k.id }); } };
    }
    var openC = DB.t6_casos.filter(function (k) { return k.state !== 'concluído'; }).map(caseRow);
    var doneC = DB.t6_casos.filter(function (k) { return k.state === 'concluído'; }).map(caseRow);
    var k = id && !indisp ? DB.find('t6_casos', id) : null, d = null;
    if (k) {
      var s = T6.sale(k.sale), isD = k.kind === 'disputa', won = scn === 'ganhou';
      var state = won ? 'decidida a seu favor' : (scn === 'desconhecido' ? 'aguardando decisão do banco' : k.state);
      var picks = ui.ev || {};
      d = {
        title: (isD ? 'Disputa #' : 'Reembolso #') + k.id, sub: 'Pedido ' + s.order + ' · ' + T6.prod(s), isD: isD, st: state, stCls: won ? 'badge badge--ok' : (k.state === 'concluído' ? 'badge badge--plain' : 'badge badge--warn'),
        kv: T6.kv([
          ['Valor', T6.brl(isD ? s.base : s.refund.amount)], ['Aberta por', k.by + ' · ' + k.opened], ['Motivo', k.reason],
          isD ? ['Evidência até', k.deadline] : null, isD ? ['Decisão do banco', won ? 'a seu favor · 26/10' : 'ainda não informada'] : null,
          ['Efeito no extrato', isD ? (won ? T6.brl(s.net) + ' voltam ao liberado' : 'Retido ' + T6.brl(s.net)) : T6.brl(-T6.refundDebit(s)) + ' (taxa 99Coach devolvida)', isD ? '' : 't6-neg']
        ]),
        hist: k.hist.map(function (h) { return { t: h[1], s: h[0] }; }),
        canSend: isD && k.state === 'aguardando evidência' && !won && scn !== 'desconhecido', sent: isD && (k.state === 'evidência enviada' || scn === 'desconhecido') && !won,
        allowed: (k.allowed || []).map(function (x) { var on = !!picks[x[0]]; return { t: x[1], s: x[2], cls: 'check' + (on ? ' is-on' : ''), on: String(on), toggle: function () { var p = Object.assign({}, picks); p[x[0]] = !on; ctx.setUi({ ev: p }); } }; }),
        note: ui.note || '', setNote: function (e) { ctx.setUi({ note: U.val(e) }); },
        send: function () {
          var chosen = (k.allowed || []).filter(function (x) { return picks[x[0]]; });
          if (!chosen.length) { ctx.toast('Escolha pelo menos uma evidência permitida.'); return; }
          ctx.ask({ title: 'Enviar evidência ao banco?', ok: 'Enviar evidência', text: 'Enviar resposta não significa vencer a disputa. O banco decide e avisamos aqui.',
            lines: chosen.map(function (x) { return x[1]; }).concat(['Não inclua dados de saúde do aluno.']),
            onOk: function () { k.state = 'evidência enviada'; k.hist.push(['26/10 ' + U.now(), 'Evidência enviada: ' + chosen.map(function (x) { return x[1]; }).join(', ')]); ctx.setUi({ ev: {}, note: '' }); ctx.toast('Evidência enviada. Acompanhe o resultado por aqui.'); } });
        },
        follow: function () { ctx.toast('Consultamos às ' + U.now() + ': o banco ainda não decidiu. Prazo de decisão informado: até 30 dias.'); },
        goSale: function () { GO('FT03', { id: s.id }); }, goMov: function () { GO('FT04', { sale: s.id }); }
      };
    }
    var emptyD = { title: '', sub: '', isD: false, st: '', stCls: '', kv: [], hist: [], canSend: false, sent: false, allowed: [], note: '', setNote: function () {}, send: function () {}, follow: function () {}, goSale: function () {}, goMov: function () {} };
    return {
      hasAlert: !!a, aCls: a ? 'alert alert--' + a[0] + ' t6-alert' : '', aT: a ? a[1] : '', aS: a ? a[2] : '', aHasBtn: !!(a && a[3]), aBtn: a ? a[3] : '', aGo: a && a[4] ? a[4] : function () {},
      isDetail: !!d, d: d || emptyD, showList: !indisp, openC: openC, doneC: doneC, hasOpen: openC.length > 0, noOpen: openC.length === 0,
      goHub: function () { GO('H09'); }, goList: function () { GO('FT10'); }
    };
  }
});

REG.screen({
  page: 'treinador', key: 'ft11', id: 'FT11', title: 'Assinatura 99Coach', mtitle: 'Assinatura', nav: 'conta', back: 'TMENU',
  normal: 'Plano Essencial',
  scens: [['teste', 'Em teste'], ['cancelar', 'Cancelar'], ['usoindisp', 'Uso indisponível'], ['cobranca', 'Próxima cobrança desconhecida']],
  vals: function (ctx) {
    var T6 = window.T6, scn = ctx.scn, ui = ctx.ui, A = DB.t6_assinatura, t = DB.trainer, ia = t.iaCredits;
    var trial = A.trial === 'ativo' || scn === 'teste' || scn === 'cancelar' || scn === 'cobranca';
    var canceled = A.trial === 'cancelado' && scn === '';
    var bill = ui.bill || A.billing, accepted = !!ui.ok;
    var price = bill === 'anual' ? 'R$ 990/ano (R5)' : 'R$ 99/mês (R3)';
    var noUse = scn === 'usoindisp';
    var cancel = function () {
      ctx.ask({ title: 'Cancelar o teste do Pro?', danger: true, ok: 'Cancelar renovação', cancel: 'Manter teste',
        text: 'Você continua com o Pro até ' + A.trialEnds + ' e depois volta ao Essencial. Nenhuma cobrança acontece.',
        lines: ['Tarefas de IA na fila são revalidadas; as já aceitas podem ter custo a conciliar.', 'Seus alunos mantêm tudo o que compraram.', 'Demonstração: nada é cobrado.'],
        onOk: function () { A.trial = 'cancelado'; t.proTrial = { active: false, daysLeft: 0 }; if (scn) ctx.scenario(''); ctx.toast('Renovação cancelada. Pro até ' + A.trialEnds + '; nenhuma cobrança.'); } });
    };
    return {
      isEss: !trial && !canceled, isTrial: trial, isCanceled: canceled, showCancelBox: scn === 'cancelar',
      noUse: noUse, hasUse: !noUse, cobrancaUnknown: scn === 'cobranca',
      plan: trial ? 'Pro · teste de 7 dias' : (canceled ? 'Pro até ' + A.trialEnds + ' · depois Essencial' : 'Essencial'),
      trialEnds: A.trialEnds, reminder: A.reminder, next: scn === 'cobranca' ? 'não informada pelo provedor agora' : (A.billing === 'anual' ? 'R$ 990 em ' + A.trialEnds : 'R$ 99 em ' + A.trialEnds),
      bills: [['mensal', 'Mensal', 'R$ 99/mês · R3'], ['anual', 'Anual', 'R$ 990/ano · R5 · total anual R$ 990']].map(function (b) { var on = bill === b[0]; return { label: b[1], sub: b[2], cls: 'opt t6-opt' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ bill: b[0] }); } }; }),
      price: price, okCls: 'check' + (accepted ? ' is-on' : ''), okOn: String(accepted), toggleOk: function () { ctx.setUi({ ok: !accepted }); },
      notAccepted: !accepted,
      activate: function () {
        if (!accepted) { ctx.toast('Marque o aceite para ativar o teste.'); return; }
        A.trial = 'ativo'; A.billing = bill; A.trialCredits = { used: 0, limit: 20 }; t.proTrial = { active: true, daysLeft: 7 };
        ctx.setUi({ ok: false }); ctx.toast('Teste do Pro ativado até ' + A.trialEnds + '. Demonstração: nada é cobrado.');
      },
      cancel: cancel,
      retry: function () { ctx.scenario(''); ctx.toast('Consultamos às ' + U.now() + '.'); },
      use: trial ? 'Teste · ' + A.trialCredits.used + ' de ' + A.trialCredits.limit + ' créditos' : ia.used + ' de ' + ia.limit + ' créditos · renova ' + ia.resets,
      usePct: trial ? String(Math.round(A.trialCredits.used / A.trialCredits.limit * 100)) : String(Math.round(ia.used / ia.limit * 100)),
      barStyle: 'width:' + (trial ? Math.round(A.trialCredits.used / A.trialCredits.limit * 100) : Math.round(ia.used / ia.limit * 100)) + '%',
      reserved: A.reserved + ' créditos reservados para tarefas na fila', proCredits: '6.000 créditos por mês no Pro (R8)',
      goUso: function () { GO('IA06'); }, goCheckout: function () { GO('FC03', { variant: 'platform_subscription' }); }, goHub: function () { GO('H09'); }
    };
  }
});
