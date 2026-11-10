/* T6 · FT03 Vendas e detalhe da venda · FT05 Política de liberação (por que um valor está restrito) */
REG.screen({
  page: 'treinador', key: 'ft03', id: 'FT03', title: 'Vendas', nav: 'recebimentos', wide: true,
  back: function (ctx) { return ctx.id ? 'FT03' : 'H09'; },
  testIds: ['v4801', 'v4807', 'v4808', 'v4811'],
  normal: 'Vendas do mês',
  scens: [['estimada', 'Taxa estimada'], ['reembolso', 'Reembolso'], ['vazio', 'Sem vendas'], ['filtro', 'Nenhum resultado de filtro'], ['parcialreemb', 'Venda reembolsada parcialmente'], ['parcial', 'Consulta parcial']],
  vals: function (ctx) {
    var T6 = window.T6, scn = ctx.scn, ui = ctx.ui;
    var id = ctx.id || ({ estimada: 'v4811', reembolso: 'v4808', parcialreemb: 'v4801' })[scn] || '';
    var s = id ? T6.sale(id) : null;
    var out = { isDetail: !!s, isList: !s, goHub: function () { GO('H09'); }, goList: function () { GO('FT03'); }, exportar: function () { GO('FT12'); } };
    if (s) {
      var st = T6.stOf(s), est = s.est && scn !== 'reembolso';
      var money = [['Bruto', T6.brl(s.gross)]];
      if (s.discount) money.push(['Desconto · cupom ' + s.coupon, T6.brl(-s.discount)]);
      money.push(['Taxa 99Coach (5%) · R1', T6.brl(-s.plat)]);
      money.push([T6.feeLabel(s) + (est ? ' · estimada' : ''), T6.brl(-s.proc), est ? 't6-est' : '']);
      money.push([est ? 'Líquido estimado' : 'Líquido', T6.brl(s.net), 't6-strong']);
      if (s.refund) {
        money.push(['Reembolso ' + (s.refund.kind === 'parcial' ? 'parcial' : 'total') + ' · ' + s.refund.date, T6.brl(-s.refund.amount), 't6-neg']);
        money.push(['Taxa 99Coach devolvida', T6.sbrl(T6.r2(s.refund.amount * 0.05))]);
        money.push(['Líquido depois do reembolso', T6.brl(T6.r2(s.net - T6.refundDebit(s))), 't6-strong']);
      }
      var c = s.dispute ? DB.find('t6_casos', s.dispute) : (s.refund ? DB.find('t6_casos', s.refund.caseId) : null);
      var A = {
        estimada: ['info', 'Taxa estimada', 'O rótulo “estimada” fica até a conciliação do provedor (hoje conciliado até 24/10). O valor final pode mudar alguns centavos.', 'Consultar de novo'],
        reembolso: ['info', 'Reembolso', 'A linha negativa fica vinculada a este pedido no extrato. O provedor não devolve a taxa dele.', ''],
        parcialreemb: ['info', 'Venda reembolsada parcialmente', 'Parte do valor voltou ao aluno; o restante continua na venda. O efeito aparece no extrato com a mesma referência.', 'Consultar de novo']
      };
      var a = A[scn] || null;
      var canRefund = !s.refund && !s.dispute && s.status !== 'reembolsado';
      var bucket = s.releaseAt ? 'do liberado' : 'do valor a receber';
      var who = s.student ? s.buyer : T6.buyer(s);
      Object.assign(out, {
        d: {
          title: 'Venda ' + s.order, sub: T6.prod(s) + ' · ' + s.date + ' ' + s.time, st: st.label, stCls: st.cls,
          hasPartial: !!(s.refund && s.refund.kind === 'parcial'),
          info: T6.kv([['Produto', T6.prod(s)], ['Tipo', T6.kindLabel[s.kind]], ['Comprador', who], ['Pagamento', T6.methodTxt(s)], ['Pedido', s.order + ' · ' + s.date + ' ' + s.time], ['Moeda', s.cur]]),
          money: T6.kv(money),
          why: s.status === 'a receber' ? (s.forecast ? 'Previsão de liberação ' + s.forecast + ': ' + s.why + '.' : 'Sem previsão de liberação: ' + s.why + '.') : (s.status === 'retido' ? 'Retido: ' + s.why + '.' : (s.releaseAt ? 'Liberado em ' + s.releaseAt + ': ' + s.why + '.' : 'Reembolsada: ' + s.why + '.')),
          hist: T6.hist(s), hasStudent: !!s.student, hasCase: !!c, caseLabel: c ? (c.kind === 'disputa' ? 'Tratar disputa ' + c.id : 'Ver reembolso ' + c.id) : '',
          isRestricted: s.status === 'a receber' || s.status === 'retido', canRefund: canRefund,
          hasAlert: !!a, aCls: a ? 'alert alert--' + a[0] + ' t6-alert' : '', aT: a ? a[1] : '', aS: a ? a[2] : '', aHasBtn: !!(a && a[3]), aBtn: a ? a[3] : '',
          aGo: function () { ctx.toast('Consultamos às ' + U.now() + ': ' + (scn === 'estimada' ? 'a taxa segue estimada até a conciliação.' : 'nada mudou nesta venda.')); },
          goMov: function () { GO('FT04', { sale: s.id }); }, goCase: function () { if (c) GO('FT10', { id: c.id }); }, goStudent: function () { GO('TRE03', { id: s.student }); },
          goWhy: function () { GO('FT05', { id: s.id }); },
          refund: function () {
            var amount = s.base, f = T6.r2(amount * 0.05);
            ctx.ask({
              title: 'Reembolsar ' + T6.brl(amount) + '?', danger: true, ok: 'Reembolsar ' + T6.brl(amount),
              text: 'O valor volta para ' + who + ' pelo mesmo meio de pagamento (' + s.method + ').',
              lines: ['Sai ' + bucket + ': ' + T6.brl(-(amount - f)) + '.', 'A taxa 99Coach (' + T6.brl(f) + ') volta para você; a do processador (' + T6.brl(s.proc) + ') não volta.', 'Se o saldo ficar negativo, ele é recuperado das próximas vendas.', 'Não dá para desfazer.'],
              onOk: function () {
                var cid = 'R-' + (1 + DB.t6_casos.reduce(function (m, k) { var n = Number(String(k.id).split('-')[1]) || 0; return k.kind === 'reembolso' && n > m ? n : m; }, 0));
                s.refund = { amount: amount, date: '26/10', time: U.now(), kind: 'total', reason: 'reembolso feito por você', caseId: cid };
                if (s.status === 'a receber') { s.status = 'reembolsado'; s.forecast = ''; s.why = 'reembolsada antes da liberação'; }
                DB.t6_casos.push({ id: cid, kind: 'reembolso', sale: s.id, opened: '26/10', by: 'Você', reason: 'Reembolso total feito por você', deadline: '', state: 'concluído', result: 'reembolsado', allowed: [], sent: null, hist: [['26/10 ' + U.now(), 'Reembolso total de ' + T6.brl(amount) + ' feito por você']] });
                ctx.toast('Reembolso ' + cid + ' feito. O efeito já aparece no extrato.');
              }
            });
          }
        }
      });
      return out;
    }
    // lista
    var kind = ui.k || 'todas', q = ui.q !== undefined ? ui.q : (scn === 'filtro' ? 'Yoga' : '');
    var all = scn === 'vazio' ? [] : T6.sales();
    if (scn === 'parcial') all = all.filter(function (x) { return T6.key(x.date) <= 1024; });
    var nq = U.norm(q);
    var list = all.filter(function (x) { return (kind === 'todas' || x.kind === kind) && (!nq || U.norm(x.product + ' ' + x.buyer + ' ' + x.order).indexOf(nq) >= 0); });
    var size = 5, pages = Math.max(1, Math.ceil(list.length / size)), pg = Math.min(ui.pg || 0, pages - 1);
    var rows = list.slice(pg * size, pg * size + size).map(function (x) {
      var st = T6.stOf(x);
      return { order: x.order, product: T6.prod(x), buyer: T6.buyer(x), date: x.date, gross: T6.brl(x.base), fee: T6.brl(-(x.plat + x.proc)) + (x.est ? ' est.' : ''), net: T6.brl(x.net), st: st.label, stCls: st.cls, partial: !!(x.refund && x.refund.kind === 'parcial'), go: function () { GO('FT03', { id: x.id }); } };
    });
    var kinds = [['todas', 'Todas'], ['acompanhamento', 'Acompanhamento'], ['programa', 'Programas'], ['sessao', 'Sessões']].map(function (k) {
      return { label: k[1], cls: 'chip' + (kind === k[0] ? ' is-on' : ''), on: String(kind === k[0]), pick: function () { ctx.setUi({ k: k[0], pg: 0 }); } };
    });
    var S = T6.summary(1001, 1031);
    Object.assign(out, {
      l: {
        kinds: kinds, q: q, setQ: function (e) { ctx.setUi({ q: U.val(e), pg: 0 }); }, clear: function () { ctx.setUi({ q: '', k: 'todas', pg: 0 }); },
        rows: rows, hasRows: rows.length > 0, empty: scn === 'vazio', noMatch: scn !== 'vazio' && list.length === 0,
        isParcial: scn === 'parcial', retry: function () { ctx.scenario(''); ctx.toast('Consulta completa às ' + U.now() + '.'); },
        pageTxt: list.length ? (pg * size + 1) + '–' + Math.min(list.length, pg * size + size) + ' de ' + list.length : '0 de 0',
        hasPrev: pg > 0, noPrev: pg === 0, hasNext: pg < pages - 1, noNext: pg >= pages - 1,
        prev: function () { ctx.setUi({ pg: Math.max(0, pg - 1) }); }, next: function () { ctx.setUi({ pg: Math.min(pages - 1, pg + 1) }); },
        totals: scn === 'vazio' ? 'Nenhuma venda em outubro' : U.plural(S.n, 'venda', 'vendas') + ' em outubro · bruto ' + T6.brl(S.base) + ' · líquido ' + T6.brl(S.net),
        goOffers: function () { GO('TRE29'); }
      }
    });
    return out;
  }
});

REG.screen({
  page: 'treinador', key: 'ft05', id: 'FT05', title: 'Política de liberação', mtitle: 'Retenção', nav: 'recebimentos',
  back: function (ctx) { return ctx.id ? 'FT05' : 'H09'; },
  testIds: ['v4807', 'v4812', 'v4803'],
  normal: 'Valores restritos',
  scens: [['naocalc', 'Data não calculável'], ['disputa', 'Retido por disputa'], ['liberado', 'Liberado'], ['verif', 'Verificação pendente'], ['prazo', 'Prazo ainda desconhecido'], ['aguardando', 'Requisito concluído aguardando confirmação']],
  vals: function (ctx) {
    var T6 = window.T6, scn = ctx.scn, c = DB.t6_conta;
    var id = ctx.id || ({ naocalc: 'v4812', disputa: 'v4807', liberado: 'v4803', prazo: 'v4809' })[scn] || '';
    var held = T6.sales().filter(function (s) { return s.status === 'a receber' || s.status === 'retido'; });
    var fc = function (s) {
      if (s.status === 'retido') return 'sem data · depende da decisão do banco';
      if (scn === 'prazo' && s.method === 'Cartão') return 'prazo ainda não informado';
      return s.forecast || 'não calculável';
    };
    var rows = held.map(function (s) {
      return { order: s.order, product: T6.prod(s), amount: T6.brl(s.net), why: s.why, fc: fc(s), cls: 't6-tr' + (s.id === id ? ' is-on' : ''), go: function () { GO('FT05', { id: s.id }); } };
    });
    var total = T6.r2(held.reduce(function (n, s) { return n + s.net; }, 0));
    var withF = held.filter(function (s) { return s.status === 'a receber' && s.forecast && !(scn === 'prazo' && s.method === 'Cartão'); });
    var noF = T6.r2(held.filter(function (s) { return withF.indexOf(s) < 0; }).reduce(function (n, s) { return n + s.net; }, 0));
    var next = withF.slice().sort(function (a, b) { return T6.key(a.forecast) - T6.key(b.forecast); })[0];
    var s = id ? T6.sale(id) : null;
    var d = null;
    if (s) {
      var k = s.dispute ? DB.find('t6_casos', s.dispute) : null;
      var released = !!s.releaseAt;
      d = {
        title: released ? 'Liberado' : 'Por que este valor está restrito?',
        kv: T6.kv([
          ['Pedido', s.order + ' · ' + T6.prod(s)], ['Valor envolvido', T6.brl(s.net)], ['Regra', 'Liberação ' + c.rule + ' · R6'],
          ['Motivo', s.why],
          released ? ['Liberado em', s.releaseAt + ' · ' + T6.brl(s.net), 't6-strong'] : ['Previsão', scn === 'naocalc' || (!s.forecast && !k) ? 'data não calculável' : fc(s)],
          ['Requisito da conta', T6.payoutOk() ? 'nenhum' : 'dado bancário pendente · afeta só o envio ao banco']
        ]),
        why: released ? 'Este valor já saiu da retenção e está no liberado.' : (k ? 'O banco do comprador abriu a disputa ' + k.id + ' em ' + k.opened + '. O valor fica retido até a decisão; enviar evidência não garante o resultado.' : (s.forecast && !(scn === 'prazo' && s.method === 'Cartão') ? 'Libera em ' + s.forecast + ' se nada mudar (reembolso ou disputa podem alterar).' : (scn === 'prazo' ? 'Prazo ainda não informado pelo provedor para este pagamento.' : 'A data não é calculável porque o serviço ainda não começou. Ela aparece quando a primeira sessão for marcada.'))),
        hasCase: !!k, goCase: function () { if (k) GO('FT10', { id: k.id }); }, goMov: function () { GO('FT04', { id: s.id + '-venda' }); }, goSale: function () { GO('FT03', { id: s.id }); }
      };
    }
    var A = {
      naocalc: ['info', 'Data não calculável', 'Quando o serviço ainda não começou, não mostramos data. Dizemos o porquê e o que falta.', 'Consultar de novo', function () { ctx.toast('Consultamos às ' + U.now() + ': as sessões de novembro de Lucas seguem sem data.'); }],
      disputa: ['warn', 'Retido por disputa', 'R$ 88,28 do pedido #4807 ficam retidos até a decisão do banco.', 'Saiba por quê', function () { GO('FT10', { id: 'D-12' }); }],
      liberado: ['ok', 'Liberado', 'Pedido #4803: R$ 182,02 liberados em 19/10.', '', null],
      verif: ['warn', 'Verificação pendente', 'Verificar a conta e liberar o dinheiro são coisas diferentes: a liberação segue a regra; o envio ao banco espera a verificação.', 'Consultar de novo', function () { ctx.toast('Consultamos às ' + U.now() + ': verificação ainda pendente.'); }],
      prazo: ['info', 'Prazo ainda desconhecido', 'O provedor ainda não informou o prazo dos pagamentos com cartão deste mês.', 'Consultar de novo', function () { ctx.scenario(''); ctx.toast('O provedor informou os prazos: veja a coluna Previsão.'); }],
      aguardando: ['info', 'Requisito concluído aguardando confirmação', 'Você concluiu o dado bancário no provedor. Ele ainda precisa confirmar; até lá, nada muda.', 'Consultar de novo', function () { T6.providerConfirms(); ctx.scenario(''); ctx.toast('O provedor confirmou o requisito.'); }]
    };
    var a = A[scn] || null;
    return {
      isDetail: !!d, d: d || { title: '', kv: [], why: '', hasCase: false, goCase: function () {}, goMov: function () {}, goSale: function () {} },
      hasAlert: !!a, aCls: a ? 'alert alert--' + a[0] + ' t6-alert' : '', aT: a ? a[1] : '', aS: a ? a[2] : '', aHasBtn: !!(a && a[3]), aBtn: a ? a[3] : '', aGo: a && a[4] ? a[4] : function () {},
      rule: 'Regra ' + c.rule, total: T6.brl(total), rows: rows, hasRows: rows.length > 0,
      nextTxt: next ? next.forecast + ' para ' + T6.brl(next.net) : 'nenhuma data calculável agora',
      noFTxt: T6.brl(noF) + ' sem previsão (serviço não começou ou disputa)',
      reqPending: !T6.payoutOk(), goReq: function () { GO('FT09'); }, goHub: function () { GO('H09'); }, goList: function () { GO('FT05'); },
      released: T6.sales().filter(function (x) { return x.releaseAt; }).slice(0, 4).map(function (x) { return { t: x.order + ' · ' + T6.brl(x.net), s: 'liberado em ' + x.releaseAt + ' · ' + x.why }; })
    };
  }
});
