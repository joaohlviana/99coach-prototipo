/* O5 · FA02 Detalhe financeiro completo do pedido + subtelas FA02.A–D. ctx.id = pedido (ex.: pd10442). */
(function () {
  'use strict';
  var DB = window.DB, U = window.U, O5 = window.O5;
  var IDS = ['pd10388', 'pd10390', 'pd10201', 'sb2201'];
  var backFA02 = function (ctx) { return { id: ctx.id || '' }; };

  function partsOf(o) {
    var s = O5.seller(o);
    var sellerLabel = o.fam === 'platform_subscription' ? '99Coach' : s.short;
    return { s: s, sellerLabel: sellerLabel, line: o.fam === 'platform_subscription' ? o.payer + ' → 99Coach' : o.payer + ' → ' + s.short };
  }
  function stepsOf(o, scn) {
    var steps = o.attempts.map(function (a) { return { t: a.t, d: a.d, st: a.st, cls: O5.badge(a.st) }; });
    if (scn === 'duplicado') steps.splice(1, 0, { t: 'Evento e_88 recebido 2×', d: '11:02 · agrupado, contado uma vez', st: 'Não se aplica', cls: O5.badge('Não se aplica') });
    if (scn === 'faltando') steps.push({ t: 'Evento de concessão', d: 'não chegou · esperado até 11:05', st: 'Marcado', cls: O5.badge('Marcado') });
    return steps;
  }

  // ---------- FA02 · Detalhe financeiro completo ----------
  REG.screen({
    page: 'operacao', key: 'fa02', id: 'FA02', title: 'Detalhe financeiro completo', mtitle: 'Pedido', nav: 'financeiro', back: 'FA01.B', wide: true,
    testIds: IDS.concat(['pd10442', 'sb2190']),
    normal: 'Uso recorrente',
    scens: [['duplicado', 'Evento duplicado'], ['bancario', 'Dado bancário'], ['faltando', 'Evento faltando']],
    vals: function (ctx) {
      var scn = ctx.scn, ui = ctx.ui;
      var o = O5.order(ctx.id), P = partsOf(o), c = O5.calc(o);
      var dv = O5.div(o), dp = O5.dispute(o), rf = O5.refundsOf(o)[0] || null;
      var bankLine = o.bank.st + ' · ' + o.bank.d;
      var vals = [
        ['Bruto', O5.m(c.gross, o.cur) + ' ' + o.cur],
        ['Desconto', O5.m(-c.disc, o.cur)],
        ['Comissão 99Coach · 5%', O5.m(-c.comm, o.cur)],
        ['Processamento', O5.m(-c.proc, o.cur)],
        ['Líquido ao treinador', O5.m(c.net, o.cur) + ' · previsão do processador']
      ];
      if (o.fam === 'platform_subscription') vals = [['Preço', O5.m(o.amount, o.cur) + ' ' + o.cur + '/mês'], ['Comissão', 'não se aplica (receita da 99Coach)'], ['Repasse', 'não se aplica']];
      var id = o.id;
      return {
        title: 'Pedido ' + o.ref, sub: P.line + ' · ' + o.fam + ' · ' + o.at,
        cb: O5.cb('financeiro.ler', 'Pedido ' + o.ref, 'processador + razão 99Coach'),
        steps: stepsOf(o, scn),
        repasse: { t: 'Repasse', d: o.access === 'pendente' ? 'aguarda liberação do acesso' : bankLine, st: o.bank.st === 'falhou' ? 'Falhou' : (o.bank.st === 'enviado' ? 'Confirmado' : 'Na fila') },
        repCls: O5.badge(o.bank.st === 'falhou' ? 'Falhou' : (o.bank.st === 'enviado' ? 'Confirmado' : 'Na fila')),
        vals: vals.map(function (r) { return { k: r[0], v: r[1] }; }),
        valsSrc: 'Fonte: processador e razão 99Coach · ' + O5.AT,
        isDup: scn === 'duplicado', isBank: scn === 'bancario', isMiss: scn === 'faltando',
        missMsg: ui.tries ? 'Consultado às ' + U.now() + ': o evento ainda não chegou. Nada foi reprocessado nem cobrado de novo.' : 'O evento de concessão não chegou. Ele aparece marcado na linha do tempo; nada foi inferido.',
        retry: function () { ctx.setUi({ tries: (ctx.ui.tries || 0) + 1 }); },
        bankDest: O5.seller(o).bank,
        toBank: function () { GO('FA02.C', { id: id }); },
        hasDiv: !!dv, divRef: dv ? dv.ref + ' · ' + dv.kind : '', goDiv: function () { GO('FA03', { id: id }); },
        hasDisp: !!dp, dispRef: dp ? dp.ref + ' · prazo ' + (dp.due || 'desconhecido') : '', goDisp: function () { GO('FA05', { id: id }); },
        hasRef: !!rf, refRef: rf ? rf.ref + ' · ' + rf.status : '', goRef: function () { GO('FA04.C', { id: id }); },
        canRefund: o.fam !== 'platform_subscription' && O5.eligible(o) > 0, goRefund: function () { GO('FA04', { id: id }); },
        subs: O5.sub([
          ['Pedido, partes e compromisso', 'Produto, versão, pagador, destinatário e políticas', 'FA02.A', 'file'],
          ['Tentativas, período e acesso', 'Eventos deduplicados e concessão por origem', 'FA02.B', 'activity'],
          ['Recebível e etapas efetivas', 'Bruto, comissão, líquido e envio ao banco', 'FA02.C', 'dollar'],
          ['Assinatura 99Coach do treinador', 'Plano do vendedor, separado das vendas', 'FA02.D', 'card']
        ], id)
      };
    }
  });

  // ---------- FA02.A · Pedido, partes e compromisso ----------
  REG.screen({
    page: 'operacao', key: 'fa02a', id: 'FA02.A', title: 'Pedido, partes e compromisso', mtitle: 'Pedido', nav: 'financeiro', back: 'FA02', backParams: backFA02, wide: true,
    testIds: IDS,
    normal: 'Uso recorrente',
    scens: [['retirada', 'Oferta retirada'], ['expirado', 'Pedido expirado'], ['destinatario', 'Destinatário incorreto'], ['docindisp', 'Documento indisponível']],
    vals: function (ctx) {
      var scn = ctx.scn, ui = ctx.ui;
      var o = O5.order(ctx.id), P = partsOf(o);
      var of = o.offer ? DB.find('ofertas', o.offer) : null;
      var recipient = scn === 'destinatario' ? 'Ana C. (al_90) · não é o pagador' : o.recipient;
      var items = o.items.map(function (it) { return { n: it.n, v: '1 × ' + O5.m(it.paid || o.amount, o.cur) }; });
      if (o.disc) items.push({ n: 'Desconto', v: O5.m(-o.disc, o.cur) });
      var id = o.id;
      return {
        title: 'Pedido ' + o.ref, sub: o.fam + ' · ' + (o.fam === 'platform_subscription' ? o.payer + ' → 99Coach' : P.s.short + ' → ' + o.payer),
        cb: O5.cb('financeiro.ler', 'Pedido ' + o.ref, 'razão 99Coach'),
        comp: [['Família', o.fam], ['Produto', o.product + ' · ' + o.ver], ['Vendedor', P.sellerLabel + (o.fam === 'platform_subscription' ? '' : ' · ' + P.s.acct)], ['Pagador', o.payer + ' · ' + o.payerAcct], ['Destinatário do acesso', recipient], ['Período', o.period]].map(function (r) { return { k: r[0], v: r[1] }; }),
        items: items,
        money: [['Moeda', o.cur], ['Total', O5.m(o.amount, o.cur) + ' ' + o.cur + ' · ' + o.at], ['Canal', o.channel], ['Políticas', o.policy]].map(function (r) { return { k: r[0], v: r[1] }; }),
        isRet: scn === 'retirada', isExp: scn === 'expirado', isDest: scn === 'destinatario', isDoc: scn === 'docindisp',
        offerOpen: !!ui.offer, toggleOffer: function () { ctx.setUi({ offer: !ui.offer }); },
        hasOffer: !!of, noOffer: !of,
        offerLines: of ? [{ k: 'Oferta', v: of.name + ' · v' + of.version + ' (versão do pedido: ' + o.ver + ')' }, { k: 'Preço na época', v: O5.m(of.price) + ' BRL por ' + of.unit }, { k: 'Aceite', v: of.accept }, { k: 'Situação hoje', v: scn === 'retirada' ? 'retirada da venda em 25/10 · o pedido segue válido' : (of.sale ? 'à venda' : 'fora de venda') }] : [],
        receipt: function () {
          if (scn === 'docindisp') { ctx.toast('Recibo indisponível agora: o gerador de documentos não respondeu. Tente de novo em instantes; o pedido não muda.'); return; }
          ctx.ask({ title: 'Recibo do pedido ' + o.ref, lines: ['Pagador: ' + o.payer + ' · ' + o.payerAcct, 'Vendedor: ' + P.sellerLabel, 'Item: ' + o.items[0].n, 'Total: ' + O5.m(o.amount, o.cur) + ' ' + o.cur + ' · ' + o.method, 'Data: ' + o.at + ' BRT', 'Políticas aceitas: ' + o.policy, 'Demonstração: nenhum dinheiro real.'], ok: 'Fechar', cancel: false });
        },
        hasCase: !!o.div, openCase: function () { GO('FA03', { id: id }); }
      };
    }
  });

  // ---------- FA02.B · Tentativas, período e acesso ----------
  REG.screen({
    page: 'operacao', key: 'fa02b', id: 'FA02.B', title: 'Tentativas e acesso', nav: 'financeiro', back: 'FA02', backParams: backFA02, wide: true,
    testIds: IDS.concat(['pd10442']),
    normal: 'Pago, acesso pendente',
    scens: [['renov0', 'Renovação R$ 0 legítima'], ['antiga', 'Assinatura antiga cancelada'], ['atrasado', 'Evento atrasado'], ['contaerrada', 'Conta errada']],
    vals: function (ctx) {
      var scn = ctx.scn;
      var o = O5.order(ctx.id);
      var steps = stepsOf(o, '');
      if (scn === 'renov0') steps = [{ t: 'Renovação · cupom 100%', d: 'R$ 0,00 · 26/10 08:00 · evento e_90', st: 'Confirmado', cls: O5.badge('Confirmado') }, { t: 'Direito de acesso', d: 'renovado 26/10 08:00 · sem cobrança, legítimo', st: 'Confirmado', cls: O5.badge('Confirmado') }];
      if (scn === 'antiga') steps.unshift({ t: 'Assinatura anterior', d: 'cancelada 30/09 · não gera cobrança nem acesso', st: 'Não se aplica', cls: O5.badge('Não se aplica') });
      if (scn === 'atrasado') steps.push({ t: 'Evento de concessão', d: 'atrasado 2 h 40 min no provedor', st: 'Pendente', cls: O5.badge('Pendente') });
      var stepGap = o.access === 'pendente';
      var fwdAt = o.fwdAt || '';
      var id = o.id;
      return {
        title: 'Tentativas e acesso', sub: o.ref + ' · ' + o.period,
        cb: O5.cb('financeiro.ler', 'Pedido ' + o.ref, 'processador · eventos deduplicados'),
        steps: steps,
        payLine: o.pay + ' · ' + o.at, accLine: o.access,
        isWrong: scn === 'contaerrada', isLate: scn === 'atrasado', isZero: scn === 'renov0',
        canFwd: stepGap && !fwdAt, isFwd: !!fwdAt, fwdMsg: 'Etapa “direito de acesso” encaminhada à conciliação às ' + fwdAt + ' · ' + (o.div ? o.div.toUpperCase().replace('DV', 'DV-') : 'caso novo') + '.',
        noGap: !stepGap,
        fwd: function () {
          ctx.ask({ title: 'Encaminhar só a etapa faltante?', text: 'Vai para a conciliação apenas a concessão de acesso de ' + o.ref + '. Nenhuma cobrança é refeita e o aluno não precisa comprar de novo.', lines: ['Pagamento: ' + o.pay + ' (confirmado, não muda)', 'Etapa: direito de acesso', 'Responsável: conciliação · fila DV'], ok: 'Encaminhar etapa', onOk: function () { o.fwdAt = O5.now(); ctx.refresh(); } });
        },
        goDiv: function () { GO('FA03', { id: id }); }, hasDiv: !!o.div
      };
    }
  });

  // ---------- FA02.C · Recebível e etapas efetivas ----------
  REG.screen({
    page: 'operacao', key: 'fa02c', id: 'FA02.C', title: 'Recebível', nav: 'financeiro', back: 'FA02', backParams: backFA02, wide: true,
    testIds: IDS.concat(['pd10442']),
    normal: 'Uso recorrente',
    scens: [['negativo', 'Saldo negativo ou restrito'], ['conciliacao', 'Valor em conciliação'], ['payoutfalho', 'Envio ao banco falhou'], ['externo', 'Pagamento externo informado']],
    vals: function (ctx) {
      var scn = ctx.scn, ui = ctx.ui;
      var o = O5.order(ctx.id), c = O5.calc(o), s = O5.seller(o);
      var bank = o.bank;
      if (scn === 'payoutfalho') bank = { st: 'falhou', d: 'P-78 · 26/10 08:00 · requisito do provedor: confirmar titularidade' };
      var rows = [
        ['Bruto', O5.m(c.gross, o.cur), o.pay],
        ['Desconto', O5.m(-c.disc, o.cur), c.disc ? 'aplicado' : '—'],
        ['Comissão 99Coach', O5.m(-c.comm, o.cur) + ' · 5%', o.fam === 'platform_subscription' ? 'não se aplica' : 'calculada'],
        ['Processamento', O5.m(-c.proc, o.cur), 'do processador'],
        ['Líquido', O5.m(c.net, o.cur), scn === 'conciliacao' ? 'em conciliação' : 'previsão do processador'],
        ['Envio ao banco', bank.st === 'enviado' || bank.st === 'falhou' ? O5.m(c.net, o.cur) : '—', bank.st + ' · ' + bank.d]
      ].map(function (r) { return { k: r[0], v: r[1], st: r[2] }; });
      var disp = scn === 'negativo' ? -70 : s.disponivel;
      var id = o.id;
      return {
        title: 'Recebível', sub: o.ref + ' · ' + (o.fam === 'platform_subscription' ? '99Coach' : s.short),
        cb: O5.cb('financeiro.ler', 'Conta ' + s.acct, 'processador + razão · ' + o.cur),
        rows: rows,
        buckets: [{ k: 'Disponível', v: O5.m(disp) + ' BRL', cls: disp < 0 ? 'o5-neg' : '' }, { k: 'A receber', v: O5.m(s.aReceber) + ' BRL', cls: '' }, { k: 'Destino', v: s.bank, cls: '' }],
        bucketsSrc: 'Saldo de ' + s.short + ' · razão 99Coach · ' + O5.AT,
        isNeg: scn === 'negativo', isConc: scn === 'conciliacao', isFail: bank.st === 'falhou', isExt: scn === 'externo',
        failMsg: bank.d,
        mvOpen: !!ui.mv, toggleMv: function () { ctx.setUi({ mv: !ui.mv }); },
        mvLines: [{ k: 'Movimento', v: 'MV-' + o.ref.slice(3) + ' · crédito em “a receber”' }, { k: 'Valor', v: O5.m(c.net, o.cur) + ' ' + o.cur }, { k: 'Quando', v: o.at + ' BRT' }, { k: 'Memória', v: O5.m(c.gross) + ' − ' + O5.m(c.comm) + ' − ' + O5.m(c.proc) + ' = ' + O5.m(c.net) }],
        canRefund: o.fam !== 'platform_subscription', goRefund: function () { GO('FA04', { id: id }); },
        hasDisp: !!o.dispute, goDisp: function () { GO('FA05', { id: id }); },
        hasDiv: !!o.div, goDiv: function () { GO('FA03', { id: id }); }
      };
    }
  });

  // ---------- FA02.D · Assinatura 99Coach do treinador ----------
  REG.screen({
    page: 'operacao', key: 'fa02d', id: 'FA02.D', title: 'Assinatura 99Coach', nav: 'financeiro', back: 'FA02', backParams: backFA02, wide: true,
    testIds: ['pd10442', 'sb2190'],
    normal: 'Teste do Pro em curso',
    scens: [['cartao', 'Cartão pendente'], ['trialoff', 'Teste não ativado'], ['primeira', 'Primeira cobrança exige ação'], ['corrida', 'Cancelamento em corrida'], ['inadimplencia', 'Inadimplência'], ['fora', 'Consulta fora']],
    vals: function (ctx) {
      var scn = ctx.scn, ui = ctx.ui;
      var o = O5.order(ctx.id, 'sb2201');
      var subId = o.fam === 'platform_subscription' ? o.id : O5.seller(o).sub;
      if (scn === 'trialoff') subId = 'sb2190';
      var sb = DB.find('o5_assinaturas', subId) || DB.o5_assinaturas[0];
      var adm = sb.adm || '';
      var off = scn === 'fora';
      return {
        title: 'Assinatura 99Coach', sub: sb.who + ' · platform_subscription · ' + sb.ref,
        cb: O5.cb('financeiro.ler · assinaturas', 'Assinatura ' + sb.ref, 'cobrança da 99Coach'),
        rows: off ? [] : sb.rows.map(function (r) { return { k: r[0], v: r[1] }; }), hasRows: !off, isOff: off,
        trial: sb.trial, after: sb.after, credits: sb.credits,
        isCard: scn === 'cartao', isFirst: scn === 'primeira', isRace: scn === 'corrida', isDue: scn === 'inadimplencia', isTrialOff: scn === 'trialoff',
        retry: function () { ctx.scenario(''); },
        accept: function () { ctx.ask({ title: 'Aceite e recibo · ' + sb.ref, lines: sb.rows.slice(0, 3).map(function (r) { return r[0] + ': ' + r[1]; }).concat(['Recibos de cobrança: nenhum ainda (primeira cobrança no fim do teste).', 'Demonstração: nenhum dinheiro real.']), ok: 'Fechar', cancel: false }); },
        usage: function () { GO('FA10.B'); },
        hasAdm: !!adm, admMsg: adm,
        admin: function () {
          ctx.ask({ title: 'Pedido administrativo exige outra capacidade', text: 'Seu papel lê assinaturas (financeiro.ler · assinaturas). Cancelar renovação ou reembolsar a assinatura pede financeiro.assinaturas.gerir.', lines: ['Cancelar renovação: o Pro segue até o fim do período e não cobra de novo.', 'Reembolsar: devolve a última cobrança da assinatura; não mexe nas compras dos alunos.', 'O pedido vai para Bia F. com o contexto preenchido.'], ok: 'Pedir a quem pode', onOk: function () { sb.adm = 'Pedido administrativo enviado a Bia F. às ' + U.now() + ' · aguardando.'; ctx.refresh(); } });
        }
      };
    }
  });
})();
