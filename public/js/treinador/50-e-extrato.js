/* T6 · FT04 Extrato de movimentos (saldo inicial + movimentos = saldo final) · FT12 Relatório e exportação (CSV de verdade, dados fictícios) */
(function () {
  var KIND = { venda: 'Venda', taxa: 'Taxa', ajuste: 'Ajuste', liberacao: 'Liberação', retencao: 'Retenção', reembolso: 'Reembolso', envio: 'Envio ao banco', repasse: 'Repasse', reversao: 'Reversão' };
  var STAGE = { rec: 'A receber', lib: 'Liberado', ret: 'Retido' };
  function amtTxt(e) { return e.amount ? window.T6.sbrl(e.amount) : window.T6.brl(e.moved) + ' muda de etapa'; }
  function amtCls(e) { return 't6-r ' + (e.amount > 0 ? 't6-pos' : (e.amount < 0 ? 't6-neg' : 't6-zero')); }
  var cache = {};

  // CSV no formato brasileiro (; e vírgula decimal), mesmo corte da prévia
  function csvFor(per) {
    var T6 = window.T6, P = T6.PER[per] || T6.PER.out, B = T6.bal(P.from, P.to), S = T6.summary(P.from, P.to), X = DB.t6_extrato;
    var n = function (v) { return (v < 0 ? '-' : '') + Math.abs(v).toFixed(2).replace('.', ','); };
    var q = function (t) { return '"' + String(t).replace(/"/g, '""') + '"'; };
    var sent = T6.r2(DB.t6_envios.filter(function (e) { return e.status === 'pago' && e.period === 'out' && T6.key(e.date) >= P.from && T6.key(e.date) <= P.to; }).reduce(function (a, e) { return a + e.amount; }, 0));
    var L = [
      q('99Coach · Relatório de recebimentos de Rafael Lima (demonstração, dados fictícios)'),
      'Período;' + q(P.range.replace(/(\d\d\/\d\d)/g, '$1/2026')), 'Fuso;' + q('Brasília (UTC−3)'), 'Moeda;BRL', 'Corte;' + q(X.cut), 'Cobertura;' + q('conciliado até ' + X.reconciledUntil + '; taxas posteriores estimadas'),
      '', 'Data;Hora;Tipo;Descrição;Referência;Valor (BRL);Valor que muda de etapa (BRL);Taxa estimada'
    ];
    B.rows.forEach(function (e) { L.push([e.date + '/2026', e.time, q(KIND[e.kind] || e.kind), q(e.label), q(e.ref), n(e.amount), n(e.moved || 0), e.est ? 'sim' : 'não'].join(';')); });
    L.push('', 'Saldo inicial;' + n(B.openT), 'Movimentos no período;' + n(B.mov), 'Saldo final até o corte;' + n(B.closeT),
      'Bruto (antes das taxas);' + n(S.base), 'Taxas;' + n(-S.fees), 'Reembolsos (com taxa 99Coach devolvida);' + n(-(S.refunds - S.platBack)), 'Líquido (depois das taxas e reembolsos);' + n(S.net),
      'Realizado (enviado ao banco pelo provedor);' + n(sent), 'Linhas de movimento;' + B.rows.length);
    return { text: '﻿' + L.join('\r\n'), rows: B.rows.length, name: '99coach-recebimentos-' + (per === 'out' ? 'outubro-2026' : '20-a-26-out-2026') + '.csv', sent: sent };
  }
  function fileUrl(per) {
    if (cache[per]) return cache[per];
    var f = csvFor(per), url = '';
    try {
      if (typeof Blob !== 'undefined' && window.URL && window.URL.createObjectURL) url = window.URL.createObjectURL(new Blob([f.text], { type: 'text/csv;charset=utf-8' }));
    } catch (_) { url = ''; }
    if (!url) url = 'data:text/csv;charset=utf-8,' + encodeURIComponent(f.text);
    cache[per] = { url: url, rows: f.rows, name: f.name };
    return cache[per];
  }
  window.T6.csvFor = csvFor;

  REG.screen({
    page: 'treinador', key: 'ft04', id: 'FT04', title: 'Extrato', nav: 'recebimentos', wide: true,
    back: function (ctx) { return ctx.id ? 'FT04' : 'H09'; },
    testIds: ['v4801-venda', 'v4807-ret', 'E-30'],
    normal: 'Movimentos do mês',
    scens: [['fecha', 'Fecha'], ['pendente', 'Pendente de conciliação'], ['semmov', 'Período sem movimento'], ['reversao', 'Reversão parcial'], ['fonte', 'Fonte indisponível']],
    vals: function (ctx) {
      var T6 = window.T6, scn = ctx.scn, ui = ctx.ui, X = DB.t6_extrato;
      var per = ui.per || 'out', P = T6.PER[per], typ = ui.t || 'todos';
      var saleF = ctx.p.sale || (scn === 'reversao' ? 'v4801' : '');
      var B = T6.bal(P.from, P.to), noSrc = scn === 'fonte', none = scn === 'semmov', pend = scn === 'pendente';
      var out = { goHub: function () { GO('H09'); }, goList: function () { GO('FT04'); }, exportar: function () { GO('FT12', { per: per }); } };
      // detalhe de um movimento
      var e = ctx.id ? T6.ledger().filter(function (x) { return x.id === ctx.id; })[0] : null;
      out.isDetail = !!e; out.isList = !e;
      if (e) {
        var s = e.sale ? T6.sale(e.sale) : null;
        var mv = Object.keys(e.mv || {}).map(function (k) { return { k: STAGE[k] || k, v: T6.sbrl(e.mv[k]) }; });
        out.d = {
          title: (KIND[e.kind] || e.kind) + ' · ' + e.ref, sub: e.date + ' ' + e.time,
          kv: T6.kv([['Descrição', e.label], ['Valor no saldo', e.amount ? T6.sbrl(e.amount) : 'não altera o saldo total', e.amount < 0 ? 't6-neg' : ''], ['Referência', e.ref], ['Origem', e.kind === 'envio' || /processador/.test(e.label) ? 'Provedor de pagamentos' : '99Coach'], ['Nota', e.note || '—'], e.est ? ['Situação', 'estimada até a conciliação', 't6-est'] : null]),
          mv: mv, hasSale: !!s, goSale: function () { if (s) GO('FT03', { id: s.id }); },
          restr: !!s && (s.status === 'a receber' || s.status === 'retido'), goWhy: function () { if (s) GO('FT05', { id: s.id }); },
          goSaleMov: function () { if (s) GO('FT04', { sale: s.id }); }, isEnvio: e.kind === 'envio', goEnvio: function () { GO('FT08', { id: e.ref }); }
        };
        return out;
      }
      var rows = none || noSrc ? [] : B.rows.slice().reverse();
      var TY = { vendas: ['venda', 'ajuste'], taxas: ['taxa'], lib: ['liberacao', 'retencao'], reemb: ['reembolso'], envios: ['envio', 'repasse', 'reversao'] };
      if (typ !== 'todos') rows = rows.filter(function (x) { return TY[typ].indexOf(x.kind) >= 0; });
      if (saleF) rows = rows.filter(function (x) { return x.sale === saleF; });
      var sumF = T6.r2(rows.reduce(function (n, x) { return n + x.amount; }, 0));
      var filtered = typ !== 'todos' || !!saleF;
      var sv = saleF ? T6.sale(saleF) : null;
      var A = {
        fecha: ['ok', 'check', 'Fecha', 'Saldo inicial + movimentos = saldo final até o corte de ' + X.cut + '.', '', null],
        pendente: ['warn', 'clock', 'Pendente de conciliação', 'Taxas marcadas como estimadas ainda não foram conciliadas pelo provedor (conciliado até ' + X.reconciledUntil + '). O saldo final é provisório.', 'Consultar de novo', function () { ctx.toast('Consultamos às ' + U.now() + ': conciliação segue até ' + X.reconciledUntil + '.'); }],
        semmov: ['info', 'info', 'Período sem movimento', 'Nenhum movimento em USD em outubro. Saldos iguais: inicial US$ 0,00 e final US$ 0,00. Moedas não são somadas.', '', null],
        reversao: ['info', 'swap', 'Reversão parcial', 'O repasse P-72 foi revertido em R$ 76,00 em 23/10 pelo reembolso parcial R-08 (pedido #4801). A linha fica vinculada ao pedido.', 'Consultar de novo', function () { ctx.toast('Consultamos às ' + U.now() + ': reversão parcial confirmada.'); }],
        fonte: ['risk', 'alert', 'Fonte indisponível', 'Não conseguimos ler o extrato do provedor agora. Não mostramos saldo nem afirmamos que o período fecha.', 'Tentar de novo', function () { ctx.scenario(''); ctx.toast('Extrato carregado às ' + U.now() + '.'); }]
      };
      var a = A[scn] || null;
      var pers = [['out', 'Outubro'], ['d7', 'Últimos 7 dias']].map(function (p) { return { label: p[1], cls: 'seg__it' + (per === p[0] ? ' is-on' : ''), on: String(per === p[0]), pick: function () { ctx.setUi({ per: p[0] }); } }; });
      var types = [['todos', 'Todos'], ['vendas', 'Vendas'], ['taxas', 'Taxas'], ['lib', 'Liberações e retenções'], ['reemb', 'Reembolsos'], ['envios', 'Envios']].map(function (t) { return { label: t[1], cls: 'chip' + (typ === t[0] ? ' is-on' : ''), on: String(typ === t[0]), pick: function () { ctx.setUi({ t: t[0] }); } }; });
      out.l = {
        eyebrow: (none ? 'Outubro 2026' : P.label) + ' · ' + (none ? 'USD' : 'BRL') + ' · corte ' + X.cut,
        hasAlert: !!a, aCls: a ? 'alert alert--' + a[0] + ' t6-alert' : '', aIc: a ? 'ic ic--sm i-' + a[1] : '', aT: a ? a[2] : '', aS: a ? a[3] : '', aHasBtn: !!(a && a[4]), aBtn: a ? a[4] : '', aGo: a && a[5] ? a[5] : function () {},
        pers: pers, types: types,
        rows: rows.map(function (x) { return { date: x.date, time: x.time, type: KIND[x.kind] || x.kind, label: x.label, ref: x.ref, amt: amtTxt(x), cls: amtCls(x), est: !!x.est && (pend || scn === ''), estTxt: pend ? 'a conciliar' : 'estimada', go: function () { GO('FT04', { id: x.id }); } }; }),
        hasRows: rows.length > 0, noRows: rows.length === 0 && !noSrc && !none,
        open: noSrc ? '—' : (none ? 'US$ 0,00' : T6.brl(B.openT)), mov: noSrc ? '—' : (none ? 'US$ 0,00' : T6.sbrl(B.mov)), close: noSrc ? '—' : (none ? 'US$ 0,00' : T6.brl(B.closeT)),
        closeLabel: pend ? 'Saldo final até o corte · provisório' : 'Saldo final até o corte',
        closes: !noSrc && (B.closes || none), closesTxt: none ? 'saldos iguais' : (pend ? 'fecha · provisório' : 'fecha'), cantClose: noSrc,
        parts: noSrc || none ? [] : T6.kv([['A receber', T6.brl(B.close.rec)], ['Retido', T6.brl(B.close.ret)], ['Liberado', T6.brl(B.close.lib)]]),
        filtered: filtered && !noSrc, filterTxt: (sv ? 'Movimentos da venda ' + sv.order + '. ' : '') + 'Soma do filtro: ' + T6.sbrl(sumF) + '. Os saldos consideram todos os movimentos do período.',
        clear: function () { ctx.setUi({ t: 'todos' }); if (ctx.p.sale) GO('FT04'); }
      };
      return out;
    }
  });

  REG.screen({
    page: 'treinador', key: 'ft12', id: 'FT12', title: 'Relatório financeiro', mtitle: 'Relatório', nav: 'recebimentos', back: 'H09', form: false,
    normal: 'Prévia do relatório',
    scens: [['gerando', 'Gerando arquivo'], ['pronto', 'Pronto'], ['parcial', 'Parcial'], ['falha', 'Falha confirmada'], ['expirado', 'Link expirado'], ['permissao', 'Permissão revogada']],
    vals: function (ctx) {
      var T6 = window.T6, scn = ctx.scn, ui = ctx.ui, X = DB.t6_extrato;
      var per = ui.per || ctx.p.per || 'out', P = T6.PER[per] || T6.PER.out;
      var parcial = scn === 'parcial', to = parcial ? Math.min(P.to, 1024) : P.to;
      var B = T6.bal(P.from, to), S = T6.summary(P.from, to);
      var sent = T6.r2(DB.t6_envios.filter(function (e) { return e.status === 'pago' && e.period === 'out' && T6.key(e.date) >= P.from && T6.key(e.date) <= to; }).reduce(function (a, e) { return a + e.amount; }, 0));
      var st = ui.st || ({ gerando: 'gerando', pronto: 'pronto', falha: 'falha', expirado: 'expirado' })[scn] || '';
      var noPerm = scn === 'permissao';
      var file = st === 'pronto' ? fileUrl(per) : { url: '', rows: 0, name: '' };
      var generate = function (pp) {
        if (noPerm) return;
        var gp = typeof pp === 'string' ? pp : per, GP = T6.PER[gp] || T6.PER.out;
        ctx.setUi({ st: 'gerando', per: gp });
        setTimeout(function () {
          if (cache[gp]) { try { if (window.URL && window.URL.revokeObjectURL && cache[gp].url.indexOf('blob:') === 0) window.URL.revokeObjectURL(cache[gp].url); } catch (_) {} delete cache[gp]; }
          var f = fileUrl(gp);
          DB.t6_relatorios.forEach(function (r) { if (r.per === gp && r.status === 'pronto') r.status = 'substituído'; });
          DB.t6_relatorios.unshift({ id: 'RL-' + (10 + DB.t6_relatorios.length), per: gp, period: GP.label + ' · corte ' + X.cut, at: '26/10 ' + U.now(), rows: f.rows, status: 'pronto' });
          ctx.setUi({ st: 'pronto', per: gp });
          ctx.toast('Seu arquivo está pronto: ' + f.rows + ' linhas, total confere com a prévia.');
        }, 900);
      };
      var pers = [['out', 'Outubro 2026'], ['d7', 'Últimos 7 dias']].map(function (p) { return { label: p[1], cls: 'chip' + (per === p[0] ? ' is-on' : ''), on: String(per === p[0]), pick: function () { ctx.setUi({ per: p[0], st: '' }); } }; });
      var A = {
        parcial: ['warn', 'Parcial', 'Cobertura até 24/10: os dias 25 e 26/10 ainda não chegaram do provedor. O arquivo sai com o mesmo corte e diz isso no cabeçalho; não é fechamento final.', 'Consultar de novo', function () { ctx.scenario(''); ctx.toast('Cobertura atualizada até 26/10 08:02.'); }],
        falha: ['risk', 'Falha confirmada', 'Não conseguimos gerar o arquivo às 10:12. Nada foi enviado e nenhum número mudou.', 'Corrigir', function () { generate(); }],
        expirado: ['warn', 'Link expirado', 'Links de arquivo valem 24 horas. Gere de novo com o mesmo recorte.', 'Corrigir', function () { generate(); }],
        permissao: ['risk', 'Permissão revogada', 'Seu acesso a relatórios financeiros foi revogado nesta conta. Fale com o titular para recuperar.', 'Saiba por quê', function () { ctx.ask({ title: 'Por que não posso exportar', text: 'Relatórios financeiros só podem ser gerados por quem tem a permissão Financeiro na conta.', lines: ['O que você já baixou continua no seu aparelho.', 'Os valores na tela não mudam.'], ok: 'Entendi', cancel: false }); }]
      };
      var a = A[scn] || null;
      if (st === 'falha' || st === 'expirado') a = A[st];
      return {
        pers: pers, tz: 'Brasília (UTC−3)', cur: 'BRL', range: P.range,
        cover: parcial ? 'até 24/10 (parcial)' : 'conciliado até ' + X.reconciledUntil + '; 25 e 26/10 com taxa estimada', fresh: 'corte ' + X.cut,
        lines: String(B.rows.length),
        totals: T6.kv([['Saldo inicial', T6.brl(B.openT)], ['Movimentos no período', T6.sbrl(B.mov)], ['Saldo final até o corte', T6.brl(B.closeT), 't6-strong'], ['Bruto', T6.brl(S.base)], ['Taxas', T6.brl(-S.fees)], ['Reembolsos', T6.brl(-(S.refunds - S.platBack))], ['Líquido', T6.brl(S.net), 't6-strong'], ['Realizado (enviado ao banco)', T6.brl(sent)]]),
        hasAlert: !!a, aCls: a ? 'alert alert--' + a[0] + ' t6-alert' : '', aT: a ? a[1] : '', aS: a ? a[2] : '', aBtn: a ? a[3] : '', aGo: a ? a[4] : function () {},
        isGen: st === 'gerando', isReady: st === 'pronto', canGen: !noPerm && st !== 'gerando', genLabel: st === 'pronto' ? 'Gerar de novo' : 'Gerar relatório',
        generate: function () { generate(); }, url: file.url, fname: file.name, readyTxt: file.rows + ' linhas · total confere com a prévia',
        hist: DB.t6_relatorios.map(function (r) {
          return { t: r.period, s: 'gerado ' + r.at + ' · ' + r.rows + ' linhas', st: r.status === 'pronto' ? 'pronto' : (r.status === 'expirado' ? 'link expirado' : r.status), stCls: r.status === 'pronto' ? 'badge badge--ok' : 'badge badge--plain', hasUrl: !!(r.status === 'pronto' && cache[r.per]), noUrl: !(r.status === 'pronto' && cache[r.per]), url: r.status === 'pronto' && cache[r.per] ? cache[r.per].url : '', name: r.status === 'pronto' && cache[r.per] ? cache[r.per].name : '', again: function () { generate(r.per || 'out'); } };
        }),
        goExtrato: function () { GO('FT04'); }, goHub: function () { GO('H09'); }
      };
    }
  });
})();
