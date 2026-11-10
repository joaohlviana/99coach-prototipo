/* T6 · H09 Recebimentos com significado (também FT02): saldo a liberar, liberado, enviado, próxima pendência, vendas recentes e envios */
REG.screen({
  page: 'treinador', key: 'recebimentos', id: 'H09', also: ['FT02'], title: 'Recebimentos', nav: 'recebimentos', back: 'TMENU', wide: true,
  normal: 'Uso recorrente',
  scens: [['primeiro', 'Primeiro uso'], ['ausencia', 'Ausência confirmada'], ['parcial', 'Indisponibilidade parcial'], ['indisp', 'Saldo indisponível'],
    ['moedas', 'Moedas'], ['provisorio', 'Valores provisórios'], ['umamoeda', 'Uma moeda indisponível'], ['restrito', 'Saldo restrito']],
  vals: function (ctx) {
    var T6 = window.T6, c = DB.t6_conta, scn = ctx.scn, ui = ctx.ui;
    var b = T6.now(), sent = T6.sentBank(), last = T6.lastSent(), S = T6.summary(1001, 1031);
    var noBal = scn === 'indisp', noLib = scn === 'parcial', prov = scn === 'provisorio';
    var payOk = T6.payoutOk(), inAnalysis = c.verif === 'analise';
    var libBadge = payOk ? ['próximo envio ' + (c.nextPayout || 'na quinta'), 'badge badge--ok'] : ['envio pausado', 'badge badge--warn'];
    var stages = [
      { l: 'A receber', n: noBal ? '—' : T6.brl(b.rec), s: noBal ? 'não foi possível consultar · tente de novo' : 'pago pelos alunos · libera conforme política' + (b.ret ? ' · ' + T6.brl(b.ret) + ' retido por disputa' : ''),
        badge: prov ? 'provisório' : 'em liberação', bcls: prov ? 'badge badge--info' : 'badge badge--plain', cls: 't6-stage', arrow: false, go: function () { GO('FT05'); }, cta: 'Por que ainda não liberou' },
      { l: 'Liberado', n: noBal || noLib ? '—' : T6.brl(b.lib), s: noBal ? 'não foi possível consultar' : (noLib ? 'aguardando o provedor confirmar' : 'pronto para envio ao banco'),
        badge: noLib ? 'aguardando' : (prov ? 'provisório' : libBadge[0]), bcls: noLib ? 'badge badge--plain' : (prov ? 'badge badge--info' : libBadge[1]), cls: 't6-stage', arrow: true, go: function () { GO('FT08'); }, cta: 'Ver envios' },
      { l: 'Enviado ao banco', n: T6.brl(sent), s: (last ? 'último em ' + last.date + ' · ' : '') + 'ainda não é confirmação de recebimento', badge: 'enviado', bcls: 'badge badge--ok', cls: 't6-stage t6-stage--ink', arrow: true, go: function () { GO('FT08'); }, cta: 'Ver envios' }
    ];
    // movimentos recentes: vendas e reembolsos
    var seg = ui.seg || 'todos';
    var rows = [];
    T6.sales().forEach(function (s) {
      if (seg !== 'todos' && s.kind !== seg) return;
      var st = T6.stOf(s);
      rows.push({ id: s.id, k: T6.key(s.date, s.time), date: s.date, origin: T6.buyer(s).split(' ')[0] + ' · ' + T6.prod(s), gross: T6.brl(s.base), fees: T6.brl(-(s.plat + s.proc)) + (s.est ? ' est.' : ''), net: T6.brl(s.net), st: st.label, stCls: st.cls });
      if (s.refund) rows.push({ id: s.id, k: T6.key(s.refund.date, s.refund.time), date: s.refund.date, origin: 'Reembolso · ' + T6.buyer(s).split(' ')[0], gross: T6.brl(-s.refund.amount), fees: T6.sbrl(T6.r2(s.refund.amount * 0.05)), net: T6.brl(-T6.refundDebit(s)), st: 'ajuste', stCls: 'badge badge--risk' });
    });
    rows.sort(function (a, b2) { return b2.k - a.k; });
    rows = rows.slice(0, 6);
    var follow = ui.follow || (rows[0] ? rows[0].id : 'v4813');
    rows = rows.map(function (r, i) {
      return Object.assign(r, { cls: 't6-tr' + (r.id === follow ? ' is-on' : ''), on: String(r.id === follow), pick: function () { ctx.setUi({ follow: r.id }); }, open: function () { GO('FT03', { id: r.id }); } });
    });
    var fs = T6.sale(follow) || T6.sale('v4813');
    var segs = [['todos', 'Todos'], ['acompanhamento', 'Acompanhamento'], ['programa', 'Programas'], ['sessao', 'Sessões']].map(function (x) {
      return { label: x[1], cls: 'seg__it' + (seg === x[0] ? ' is-on' : ''), on: String(seg === x[0]), pick: function () { ctx.setUi({ seg: x[0], follow: '' }); } };
    });
    var pend = T6.pend().map(function (p) { return { t: p.t, s: p.s, go: function () { GO(p.to, p.p); } }; });
    var envios = DB.t6_envios.slice(-3).reverse().map(function (e) {
      var M = { pago: ['pago pelo provedor', 'badge badge--ok'], pausado: ['pausado', 'badge badge--warn'], agendado: ['previsto ' + e.forecast, 'badge badge--info'], falhou: ['falhou', 'badge badge--risk'] };
      var m = M[e.status] || [e.status, 'badge'];
      return { t: e.id + ' · ' + T6.brl(T6.envioAmount(e)), s: e.date + ' · ' + e.dest, st: m[0], stCls: m[1], go: function () { GO('FT08', { id: e.id }); } };
    });
    var summ = T6.kv([
      ['Bruto (' + U.plural(S.n, 'venda', 'vendas') + ')', T6.brl(S.base)],
      ['Taxas' + (S.est ? ' · parte estimada' : ''), T6.brl(-S.fees)],
      ['Reembolsos (taxa 99Coach devolvida)', T6.brl(-(S.refunds - S.platBack))],
      ['Líquido do período', T6.brl(S.net), 't6-strong'],
      ['Retido', noBal ? '—' : T6.brl(b.ret)],
      ['Disponível (liberado)', noBal || noLib ? '— · aguardando' : T6.brl(b.lib)],
      ['Taxa 99Coach', '5% · R1'],
      ['Mínimo para repasse', 'R$ 50 · R2']
    ]);
    var usdUnavail = scn === 'umamoeda';
    return {
      first: scn === 'primeiro', none: scn === 'ausencia', main: scn !== 'primeiro' && scn !== 'ausencia',
      eyebrow: 'BRL · outubro · atualizado ' + (noBal ? '10:40 (parcial)' : c.updated.split(' ')[1]),
      showBankAlert: !payOk && !inAnalysis && !noBal, showAnalysis: inAnalysis && !noBal, showOkNext: payOk && !noBal,
      bankText: 'Suas vendas continuam; o envio fica pausado desde ' + c.pausedSince + ' até você concluir (prazo ' + c.deadline + ').',
      nextText: 'Envio ao banco habilitado. Próximo envio previsto pelo provedor: ' + (c.nextPayout || 'quinta') + '.',
      isIndisp: noBal, isParcial: noLib, isProv: prov, isRestrito: scn === 'restrito', hasUsd: scn === 'moedas' || usdUnavail, usdOk: scn === 'moedas', usdOff: usdUnavail,
      restritoText: T6.brl(b.ret) + ' retido pela disputa D-12 e ' + T6.brl(b.rec) + ' ainda em liberação. Nada disso está disponível para envio.',
      stages: stages, rows: rows, hasRows: rows.length > 0, noRows: rows.length === 0, segs: segs,
      follow: { title: fs.order + ' · ' + T6.prod(fs), steps: T6.hist(fs), open: function () { GO('FT03', { id: fs.id }); } },
      pend: pend, hasPend: pend.length > 0, noPend: pend.length === 0, envios: envios, summ: summ,
      retry: function () { ctx.scenario(''); ctx.toast('Consulta refeita às ' + U.now() + ': valores confirmados pelo provedor.'); },
      seeOct: function () { ctx.scenario(''); },
      checkAgain: function () { window.T6.providerConfirms(); ctx.toast('O provedor confirmou o dado bancário. Envio ao banco habilitado.'); },
      goProv: function () { GO('FT09', { prov: '1' }); }, goFt01: function () { GO('FT01'); }, goOffer: function () { GO('TRE29'); },
      goExtrato: function () { GO('FT04'); }, goVendas: function () { GO('FT03'); }, goEnvios: function () { GO('FT08'); }, goRepasses: function () { GO('FT07'); },
      goRel: function () { GO('FT12'); }, goPolitica: function () { GO('FT05'); }, goConta: function () { GO('FT09'); }, goCasos: function () { GO('FT10'); },
      goAssin: function () { GO('FT11'); }, goManual: function () { GO('FT06'); }, goRestr: function () { GO('FT05', { id: 'v4807' }); }
    };
  }
});
