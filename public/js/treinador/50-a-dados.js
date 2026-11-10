/* T6 · Recebimentos do treinador (H09, FT01–FT12): dados fictícios e utilidades compartilhadas.
   Modelo: o aluno paga → valor fica "a receber" (em liberação) → libera conforme a política (R6)
   → fica "liberado" na conta conectada → o provedor envia ao banco (envio automático semanal, às quintas).
   Taxas: 99Coach 5% (R1) e processador (Pix 0,99%, cartão 3,99%). Mínimo para repasse R$ 50 (R2).
   O extrato (t6_extrato + movimentos derivados das vendas e envios) é a fonte dos saldos. */
(function () {
  'use strict';
  var DB = window.DB, U = window.U;
  function r2(n) { return Math.round(n * 100) / 100; }
  var FEE = { Pix: 0.0099, 'Cartão': 0.0399 };
  function sale(o) {
    o.discount = o.discount || 0; o.coupon = o.coupon || ''; o.qty = o.qty || 1; o.student = o.student || '';
    o.base = r2(o.gross - o.discount); o.plat = r2(o.base * 0.05); o.proc = r2(o.base * FEE[o.method]);
    o.net = r2(o.base - o.plat - o.proc); o.cur = 'BRL'; o.est = !!o.est;
    o.releaseAt = o.releaseAt || ''; o.forecast = o.forecast || ''; o.payout = o.payout || ''; o.transfer = o.transfer || '';
    o.dispute = o.dispute || ''; o.refund = o.refund || null; o.card = o.card || '';
    return o;
  }
  var VENDAS = [
    sale({ id: 'v4801', order: '#4801', date: '01/10', time: '09:20', buyer: 'Bruno Lima', student: 'bruno', offer: 'o2', product: 'Sessão presencial', qty: 8, kind: 'sessao', gross: 640, method: 'Pix', status: 'enviado', releaseAt: '03/10', why: 'primeira sessão em 02/10 + 1 dia (Pix)', payout: 'E-30', transfer: 'P-72',
      refund: { amount: 80, date: '23/10', time: '10:05', kind: 'parcial', reason: '1 sessão desmarcada pelo aluno com 24 h de aviso', caseId: 'R-08' } }),
    sale({ id: 'v4802', order: '#4802', date: '02/10', time: '19:05', buyer: 'Fernanda Alves', offer: 'o4', product: 'CrossFit do zero', kind: 'programa', gross: 97, method: 'Pix', status: 'enviado', releaseAt: '09/10', why: '7 dias após a compra (prazo de arrependimento)', payout: 'E-31', transfer: 'P-74' }),
    sale({ id: 'v4803', order: '#4803', date: '05/10', time: '08:00', buyer: 'Ana Carolina Souza', student: 'ana', offer: 'o1', product: 'Acompanhamento online · outubro', kind: 'acompanhamento', gross: 200, method: 'Cartão', card: 'final 4242', status: 'liberado', releaseAt: '19/10', why: 'ciclo iniciado em 05/10 + prazo do cartão (14 dias)', payout: 'E-32', transfer: 'P-77' }),
    sale({ id: 'v4804', order: '#4804', date: '06/10', time: '07:40', buyer: 'Lucas Martins', student: 'lucas', offer: 'o2', product: 'Sessão presencial', qty: 4, kind: 'sessao', gross: 320, method: 'Pix', status: 'enviado', releaseAt: '08/10', why: 'primeira sessão em 07/10 + 1 dia (Pix)', payout: 'E-30', transfer: 'P-73' }),
    sale({ id: 'v4805', order: '#4805', date: '11/10', time: '21:10', buyer: 'Beatriz Lopes', offer: '', product: 'Mobilidade 15 minutos', kind: 'programa', gross: 47, method: 'Pix', status: 'liberado', releaseAt: '18/10', why: '7 dias após a compra (prazo de arrependimento)', payout: 'E-32', transfer: 'P-76' }),
    sale({ id: 'v4806', order: '#4806', date: '12/10', time: '10:00', buyer: 'Diego Rocha', student: 'diego', offer: 'o2', product: 'Sessão presencial', qty: 2, kind: 'sessao', gross: 160, method: 'Pix', status: 'enviado', releaseAt: '14/10', why: 'primeira sessão em 13/10 + 1 dia (Pix)', payout: 'E-31', transfer: 'P-75' }),
    sale({ id: 'v4807', order: '#4807', date: '14/10', time: '16:22', buyer: 'Henrique Sales', offer: 'o4', product: 'CrossFit do zero', kind: 'programa', gross: 97, method: 'Cartão', card: 'final 0187', status: 'retido', dispute: 'D-12', why: 'retido por disputa aberta pelo banco do comprador em 20/10' }),
    sale({ id: 'v4808', order: '#4808', date: '16/10', time: '11:30', buyer: 'Diego Rocha', student: 'diego', offer: 'o2', product: 'Sessão presencial', kind: 'sessao', gross: 80, method: 'Pix', status: 'reembolsado', why: 'reembolsada antes do início do serviço',
      refund: { amount: 80, date: '20/10', time: '15:40', kind: 'total', reason: 'sessão de 17/10 cancelada por você (quadra fechada)', caseId: 'R-09' } }),
    sale({ id: 'v4809', order: '#4809', date: '21/10', time: '08:00', buyer: 'Marcos Andrade', student: 'marcos', offer: 'o1', product: 'Acompanhamento online · 21/10 a 20/11', kind: 'acompanhamento', gross: 200, discount: 20, coupon: 'VOLTA10', method: 'Cartão', card: 'final 5510', status: 'a receber', forecast: '04/11', why: 'ciclo iniciado em 21/10 + prazo do cartão (14 dias)' }),
    sale({ id: 'v4810', order: '#4810', date: '22/10', time: '13:45', buyer: 'Camila Duarte', offer: 'o4', product: 'CrossFit do zero', kind: 'programa', gross: 97, method: 'Pix', status: 'a receber', forecast: '29/10', why: '7 dias após a compra (prazo de arrependimento)' }),
    sale({ id: 'v4811', order: '#4811', date: '25/10', time: '09:14', buyer: 'Gustavo Reis', offer: 'o4', product: 'CrossFit do zero', kind: 'programa', gross: 97, method: 'Pix', status: 'a receber', forecast: '01/11', why: '7 dias após a compra (prazo de arrependimento)', est: true }),
    sale({ id: 'v4812', order: '#4812', date: '25/10', time: '18:30', buyer: 'Lucas Martins', student: 'lucas', offer: 'o2', product: 'Sessão presencial · novembro', qty: 4, kind: 'sessao', gross: 320, method: 'Pix', status: 'a receber', forecast: '', why: 'serviço ainda não começou: as sessões de novembro estão sem data', est: true }),
    sale({ id: 'v4813', order: '#4813', date: '26/10', time: '07:52', buyer: 'Diego Rocha', student: 'diego', offer: 'o2', product: 'Sessão presencial · hoje 14:00', kind: 'sessao', gross: 80, method: 'Pix', status: 'a receber', forecast: '27/10', why: 'após a sessão de hoje 14:00 + 1 dia (Pix)', est: true })
  ];
  function sumNet(pid) { return r2(VENDAS.filter(function (s) { return s.payout === pid; }).reduce(function (n, s) { return n + s.net; }, 0)); }

  DB.seed('t6_conta', {
    enabled: true, country: 'Brasil', methods: 'cartão e Pix', cur: 'BRL', provider: 'Provedor de pagamentos', acct: 'conta conectada ••7Q2', bank: 'Banco •• 4821',
    caps: { sell: 'sim', transfer: 'sim', payout: 'pendente' },
    reqs: [
      { id: 'pessoais', label: 'Dados pessoais', st: 'ok', note: 'Confirmados pelo provedor em 03/2026' },
      { id: 'banco', label: 'Conta bancária', st: 'pendente', note: 'Confirmar a titularidade da conta •• 4821' },
      { id: 'doc', label: 'Documento', st: 'depois', note: 'Pedido depois da conta bancária' }
    ],
    deadline: '10/11', pausedSince: '22/10', verif: '', updated: '26/10 08:02', payoutDay: 'quinta', min: 50, rule: 'v2', nextPayout: ''
  });
  DB.seed('t6_vendas', VENDAS);
  DB.seed('t6_extrato', { cur: 'BRL', month: 'Outubro 2026', opening: { date: '01/10', rec: 0, lib: 412.4, ret: 0 }, cut: '26/10 08:02', reconciledUntil: '24/10', extra: [] });
  DB.seed('t6_envios', [
    { id: 'E-27', date: '17/09', time: '06:00', amount: 230, dest: 'Banco •• 4821', status: 'falhou', forecast: '18/09', note: 'Destino inválido: conta encerrada no banco. O valor voltou ao liberado em 18/09.', period: 'set', sales: [] },
    { id: 'E-28', date: '24/09', time: '06:00', amount: 230, dest: 'Banco •• 4821', status: 'pago', forecast: '25/09', note: 'Reenvio de E-27 depois da correção do destino no provedor.', period: 'set', sales: [] },
    { id: 'E-29', date: '01/10', time: '06:00', amount: 412.4, dest: 'Banco •• 4821', status: 'pago', forecast: '02/10', note: 'Saldo liberado em setembro.', period: 'out', sales: [] },
    { id: 'E-30', date: '08/10', time: '06:00', amount: sumNet('E-30'), dest: 'Banco •• 4821', status: 'pago', forecast: '09/10', note: '', period: 'out', sales: ['v4801', 'v4804'] },
    { id: 'E-31', date: '15/10', time: '06:00', amount: sumNet('E-31'), dest: 'Banco •• 4821', status: 'pago', forecast: '16/10', note: '', period: 'out', sales: ['v4802', 'v4806'] },
    { id: 'E-32', date: '22/10', time: '06:00', amount: null, dest: 'Banco •• 4821', status: 'pausado', forecast: '', note: 'Pausado: falta 1 dado bancário no provedor. O valor segue no liberado.', period: 'out', sales: ['v4803', 'v4805'] }
  ]);
  DB.seed('t6_repasses', [
    { id: 'P-70', date: '28/09', amount: 120, sales: [], status: 'falhou', reason: 'Conta conectada com cadastro incompleto naquele dia', manual: false },
    { id: 'P-71', date: '29/09', amount: 120, sales: [], status: 'concluída', reason: 'Reenvio de P-70 depois do cadastro concluído', manual: false },
    { id: 'P-72', date: '03/10', amount: VENDAS[0].net, sales: ['v4801'], status: 'parcialmente revertida', reason: 'R$ 76,00 revertidos em 23/10 pelo reembolso parcial R-08', manual: false, reversed: 76 },
    { id: 'P-73', date: '08/10', amount: VENDAS[3].net, sales: ['v4804'], status: 'concluída', reason: '', manual: false },
    { id: 'P-74', date: '09/10', amount: VENDAS[1].net, sales: ['v4802'], status: 'concluída', reason: '', manual: false },
    { id: 'P-75', date: '14/10', amount: VENDAS[5].net, sales: ['v4806'], status: 'concluída', reason: '', manual: false },
    { id: 'P-76', date: '18/10', amount: VENDAS[4].net, sales: ['v4805'], status: 'concluída', reason: '', manual: false },
    { id: 'P-77', date: '19/10', amount: VENDAS[2].net, sales: ['v4803'], status: 'concluída', reason: '', manual: false }
  ]);
  DB.seed('t6_casos', [
    { id: 'D-12', kind: 'disputa', sale: 'v4807', opened: '20/10', by: 'Banco do comprador', reason: 'Compra não reconhecida pelo titular do cartão', deadline: '30/10', state: 'aguardando evidência', result: '',
      allowed: [['acesso', 'Registro de acesso ao programa', 'Datas em que o comprador abriu as sessões, sem dados de saúde'], ['entrega', 'Comprovante de entrega digital', 'E-mail de acesso enviado em 14/10 16:23'], ['termos', 'Termos aceitos na compra', 'Versão 3 da oferta CrossFit do zero']],
      sent: null, hist: [['20/10 09:00', 'Disputa aberta pelo banco do comprador'], ['20/10 09:00', 'R$ 88,28 retidos do valor a receber']] },
    { id: 'R-08', kind: 'reembolso', sale: 'v4801', opened: '23/10', by: 'Você, a pedido do aluno', reason: '1 sessão desmarcada com 24 h de aviso', deadline: '', state: 'concluído', result: 'reembolsado', allowed: [], sent: null,
      hist: [['23/10 09:50', 'Bruno pediu o reembolso de 1 sessão'], ['23/10 10:05', 'Reembolso parcial de R$ 80,00 feito por você'], ['23/10 10:05', 'R$ 76,00 debitados do liberado (taxa 99Coach devolvida)']] },
    { id: 'R-09', kind: 'reembolso', sale: 'v4808', opened: '20/10', by: 'Você', reason: 'Sessão de 17/10 cancelada (quadra fechada)', deadline: '', state: 'concluído', result: 'reembolsado', allowed: [], sent: null,
      hist: [['20/10 15:40', 'Reembolso total de R$ 80,00 feito por você'], ['20/10 15:40', 'Taxa do processador (R$ 0,79) não é devolvida pelo provedor']] }
  ]);
  DB.seed('t6_relatorios', [{ id: 'RL-09', per: 'out', period: 'Outubro 2026 · corte 19/10', at: '19/10 18:30', rows: 30, status: 'expirado' }]);
  DB.seed('t6_assinatura', { plan: 'Essencial', trial: '', billing: 'mensal', priceM: 99, priceY: 990, trialEnds: '02/11 às 23:59', reminder: '31/10', proCredits: 6000, trialCredits: { used: 0, limit: 20 }, reserved: 4, receipts: [], cancelAt: '' });

  // ---------------- utilidades ----------------
  var T6 = window.T6 = {};
  T6.r2 = r2;
  T6.brl = function (n, cur) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    var v = Math.abs(n).toFixed(2).split('.');
    return (n < 0 ? '− ' : '') + (cur === 'USD' ? 'US$ ' : 'R$ ') + v[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + v[1];
  };
  T6.sbrl = function (n) { return n > 0 ? '+ ' + T6.brl(n) : T6.brl(n); };
  T6.key = function (d, t) { var p = String(d).split('/'); return Number(p[1]) * 100 + Number(p[0]) + (t ? Number(String(t).replace(':', '')) / 10000 : 0); };
  T6.short = function (name) { var p = String(name).split(' '); return p[0] + (p.length > 1 ? ' ' + p[p.length - 1][0] + '.' : ''); };
  T6.buyer = function (s) { return s.student ? s.buyer : T6.short(s.buyer); };
  T6.kindLabel = { acompanhamento: 'Acompanhamento', programa: 'Programa', sessao: 'Sessão' };
  T6.prod = function (s) { return s.product + (s.qty > 1 ? ' × ' + s.qty : ''); };
  T6.ST = {
    'a receber': ['a receber', 'badge badge--plain'], liberado: ['liberado', 'badge badge--ok'], enviado: ['enviado ao banco', 'badge badge--ink'],
    retido: ['retido · disputa', 'badge badge--warn'], reembolsado: ['reembolsado', 'badge badge--risk']
  };
  T6.stOf = function (s) { var x = T6.ST[s.status] || [s.status, 'badge']; return { label: x[0], cls: x[1] }; };
  T6.refundDebit = function (s) { return s.refund ? r2(s.refund.amount - r2(s.refund.amount * 0.05)) : 0; };
  T6.sale = function (id) { return DB.find('t6_vendas', id); };
  T6.sales = function () { return DB.t6_vendas.slice().sort(function (a, b) { return T6.key(b.date, b.time) - T6.key(a.date, a.time); }); };
  T6.feeLabel = function (s) { return 'Taxa do processador (' + (s.method === 'Pix' ? 'Pix 0,99%' : 'cartão 3,99%') + ')'; };
  T6.methodTxt = function (s) { return s.method + (s.card ? ' ' + s.card : ''); };

  // movimentos do extrato, em ordem cronológica. mv = efeito por etapa (rec = a receber, lib = liberado, ret = retido)
  T6.ledger = function () {
    var L = [];
    function add(id, d, t, kind, label, ref, sale, amount, mv, extra) {
      var e = { id: id, date: d, time: t, key: T6.key(d, t), kind: kind, label: label, ref: ref, sale: sale || '', amount: r2(amount), mv: mv, est: false, moved: 0, note: '' };
      if (extra) Object.keys(extra).forEach(function (k) { e[k] = extra[k]; });
      L.push(e);
    }
    DB.t6_vendas.forEach(function (s) {
      var nm = T6.prod(s) + ' · ' + T6.buyer(s);
      add(s.id + '-venda', s.date, s.time, 'venda', 'Venda · ' + nm, s.order, s.id, s.gross, { rec: s.gross }, { note: 'Pago por ' + T6.methodTxt(s) });
      if (s.discount) add(s.id + '-desc', s.date, s.time, 'ajuste', 'Desconto · cupom ' + s.coupon, s.order, s.id, -s.discount, { rec: -s.discount }, { note: 'Cupom aplicado na compra' });
      add(s.id + '-plat', s.date, s.time, 'taxa', 'Taxa 99Coach (5%)', s.order, s.id, -s.plat, { rec: -s.plat }, { note: 'Regra R1' });
      add(s.id + '-proc', s.date, s.time, 'taxa', T6.feeLabel(s) + (s.est ? ' · estimada' : ''), s.order, s.id, -s.proc, { rec: -s.proc }, { est: s.est, note: s.est ? 'Estimada até a conciliação do provedor' : 'Valor informado pelo provedor' });
      if (s.releaseAt) add(s.id + '-lib', s.releaseAt, '06:00', 'liberacao', 'Liberação · ' + s.order, s.order, s.id, 0, { rec: -s.net, lib: s.net }, { moved: s.net, note: s.why });
      if (s.dispute) {
        var c = DB.find('t6_casos', s.dispute);
        if (c) {
          add(s.id + '-ret', c.opened, '09:00', 'retencao', 'Retenção · disputa ' + c.id, s.order, s.id, 0, { rec: -s.net, ret: s.net }, { moved: s.net, note: c.reason });
          if (c.result === 'ganhou') add(s.id + '-ganhou', '26/10', '09:30', 'liberacao', 'Liberação · disputa ' + c.id + ' ganha', s.order, s.id, 0, { ret: -s.net, lib: s.net }, { moved: s.net, note: 'Decisão do banco a seu favor' });
        }
      }
      if (s.refund) {
        var b = s.releaseAt ? 'lib' : 'rec', f = r2(s.refund.amount * 0.05), m1 = {}, m2 = {};
        m1[b] = -s.refund.amount; m2[b] = f;
        add(s.id + '-reemb', s.refund.date, s.refund.time, 'reembolso', 'Reembolso ' + (s.refund.kind === 'parcial' ? 'parcial ' : '') + 'ao aluno · ' + s.refund.caseId, s.order, s.id, -s.refund.amount, m1, { note: s.refund.reason });
        add(s.id + '-dev', s.refund.date, s.refund.time, 'taxa', 'Taxa 99Coach devolvida (5%)', s.order, s.id, f, m2, { note: 'A 99Coach devolve a taxa dela no reembolso' });
        if (!s.releaseAt && s.refund.kind === 'total') {
          var resid = r2(s.net - (s.refund.amount - f));
          if (resid) add(s.id + '-enc', s.refund.date, s.refund.time, 'liberacao', 'Encerramento ' + s.order + ' · taxa do processador não devolvida', s.order, s.id, 0, { rec: -resid, lib: resid }, { moved: resid, note: 'O provedor não devolve a taxa dele; ela sai do liberado' });
        }
      }
    });
    DB.t6_envios.forEach(function (e) {
      if (e.period === 'out' && e.status === 'pago') add(e.id, e.date, e.time, 'envio', 'Envio ao banco · ' + e.dest, e.id, '', -e.amount, { lib: -e.amount }, { note: 'Pago pelo provedor; previsão de chegada ' + e.forecast });
    });
    (DB.t6_extrato.extra || []).forEach(function (x) { L.push(Object.assign({}, x, { key: T6.key(x.date, x.time) })); });
    L.sort(function (a, b) { return a.key - b.key; });
    return L;
  };
  function apply(b, e) { Object.keys(e.mv || {}).forEach(function (k) { b[k] = r2((b[k] || 0) + e.mv[k]); }); }
  T6.tot = function (b) { return r2(b.rec + b.lib + b.ret); };
  // saldos e movimentos de um período (chaves mmdd inclusivas)
  T6.bal = function (from, to) {
    var o = DB.t6_extrato.opening, b0 = { rec: o.rec, lib: o.lib, ret: o.ret }, L = T6.ledger(), rows = [];
    L.forEach(function (e) { if (e.key < from) apply(b0, e); });
    var b1 = { rec: b0.rec, lib: b0.lib, ret: b0.ret }, mov = 0;
    L.forEach(function (e) { if (e.key >= from && e.key < to + 1) { apply(b1, e); rows.push(e); mov = r2(mov + e.amount); } });
    return { open: b0, close: b1, rows: rows, mov: mov, openT: T6.tot(b0), closeT: T6.tot(b1), closes: r2(T6.tot(b0) + mov) === T6.tot(b1) };
  };
  T6.PER = { out: { from: 1001, to: 1031, label: 'Outubro 2026', short: 'outubro', range: '01/10 – 31/10' }, d7: { from: 1020, to: 1026, label: 'Últimos 7 dias', short: '20/10 a 26/10', range: '20/10 – 26/10' } };
  T6.now = function () { return T6.bal(1001, 1031).close; };
  T6.sentBank = function () { return r2(DB.t6_envios.filter(function (e) { return e.period === 'out' && e.status === 'pago'; }).reduce(function (n, e) { return n + e.amount; }, 0)); };
  T6.lastSent = function () { var p = DB.t6_envios.filter(function (e) { return e.status === 'pago'; }); return p.length ? p[p.length - 1] : null; };
  T6.payoutOk = function () { return DB.t6_conta.caps.payout === 'sim'; };
  T6.envioAmount = function (e) { return e.amount === null ? T6.now().lib : e.amount; };

  // resumo do período por vendas (bruto, taxas, reembolsos, líquido)
  T6.summary = function (from, to) {
    var S = { gross: 0, disc: 0, base: 0, plat: 0, proc: 0, refunds: 0, platBack: 0, n: 0, est: false };
    DB.t6_vendas.forEach(function (s) {
      var k = T6.key(s.date);
      if (k >= from && k < to + 1) { S.n++; S.gross += s.gross; S.disc += s.discount; S.base += s.base; S.plat += s.plat; S.proc += s.proc; if (s.est) S.est = true; }
      if (s.refund) { var rk = T6.key(s.refund.date); if (rk >= from && rk < to + 1) { S.refunds += s.refund.amount; S.platBack += r2(s.refund.amount * 0.05); } }
    });
    Object.keys(S).forEach(function (k) { if (typeof S[k] === 'number' && k !== 'n') S[k] = r2(S[k]); });
    S.fees = r2(S.plat + S.proc);
    S.net = r2(S.base - S.fees - S.refunds + S.platBack);
    return S;
  };

  // histórico de uma venda (linha do tempo "siga um valor")
  T6.hist = function (s) {
    var h = [{ t: T6.buyer(s) + ' pagou ' + T6.brl(s.base), s: s.date + ' ' + s.time + ' · ' + T6.methodTxt(s), ic: 'check', cls: 'tl__dot is-ink' }];
    if (s.dispute) {
      var c = DB.find('t6_casos', s.dispute);
      h.push({ t: 'Retido por disputa ' + s.dispute, s: (c ? c.opened + ' · ' + c.state : '') + ' · ' + T6.brl(s.net), ic: 'alert', cls: 'tl__dot is-brand' });
      h.push({ t: 'Liberação', s: c && c.result === 'ganhou' ? 'liberado em 26/10 após a decisão' : 'depende da decisão do banco; sem data', ic: 'clock', cls: 'tl__dot' });
    } else if (s.releaseAt) {
      h.push({ t: 'Liberado · ' + T6.brl(s.net), s: s.releaseAt + ' · ' + s.why, ic: 'check', cls: 'tl__dot is-ink' });
      if (s.transfer) h.push({ t: 'Repasse ' + s.transfer + ' para a conta conectada', s: s.releaseAt + ' · automático', ic: 'swap', cls: 'tl__dot is-ink' });
    } else if (s.status === 'a receber') {
      h.push({ t: 'Em liberação', s: s.forecast ? 'previsão ' + s.forecast + ' · ' + s.why : 'sem previsão · ' + s.why, ic: 'clock', cls: 'tl__dot is-brand' });
    }
    if (s.refund) h.push({ t: 'Reembolso ' + (s.refund.kind === 'parcial' ? 'parcial ' : '') + T6.brl(-s.refund.amount), s: s.refund.date + ' · ' + s.refund.reason, ic: 'refresh', cls: 'tl__dot is-brand' });
    if (s.status !== 'reembolsado' && !s.dispute) {
      var e = s.payout ? DB.find('t6_envios', s.payout) : null;
      if (e && e.status === 'pago') h.push({ t: 'Enviado ao banco · ' + e.id, s: e.date + ' · previsão de chegada ' + e.forecast + ' (não confirma crédito)', ic: 'bank', cls: 'tl__dot is-ink' });
      else if (T6.payoutOk()) h.push({ t: 'Envio ao banco', s: DB.t6_conta.nextPayout ? 'próximo envio ' + DB.t6_conta.nextPayout + ' (previsão do provedor)' : 'no próximo envio semanal', ic: 'bank', cls: 'tl__dot' });
      else h.push({ t: 'Envio ao banco', s: 'pausado até concluir o dado bancário', ic: 'bank', cls: 'tl__dot' });
    }
    return h;
  };

  // pendências que pedem ação (alimentam o contador do menu)
  T6.pend = function () {
    var c = DB.t6_conta, out = [];
    if (c.caps.payout !== 'sim' && c.verif !== 'analise') out.push({ t: 'Falta 1 dado bancário', s: 'Envio ao banco pausado desde ' + c.pausedSince + ' · conclua até ' + c.deadline, to: 'FT09', p: {} });
    DB.t6_casos.forEach(function (k) { if (k.kind === 'disputa' && k.state === 'aguardando evidência') out.push({ t: 'Disputa ' + k.id + ' · enviar evidência', s: 'Prazo ' + k.deadline + ' · pedido ' + (T6.sale(k.sale) || {}).order, to: 'FT10', p: { id: k.id } }); });
    return out;
  };
  window.NAVCOUNT('recebimentos', function () {
    // conta real sem recebimentos: nenhuma pendência de exemplo no menu
    if (window.ACCT && window.ACCT.area() && !document.documentElement.classList.contains('demo') && !(DB.t6_envios || []).length) return 0;
    return T6.pend().length;
  });

  // retorno simulado do provedor
  T6.backFromProvider = function () {
    var c = DB.t6_conta;
    c.verif = 'analise';
    c.reqs.forEach(function (r) { if (r.id === 'banco') { r.st = 'analise'; r.note = 'Enviado ao provedor em 26/10 ' + U.now() + ' · em análise'; } });
  };
  T6.providerConfirms = function () {
    var c = DB.t6_conta;
    c.verif = ''; c.caps.payout = 'sim'; c.nextPayout = '29/10'; c.updated = '26/10 ' + U.now();
    c.reqs.forEach(function (r) { if (r.id === 'banco') { r.st = 'ok'; r.note = 'Titularidade confirmada pelo provedor em 26/10'; } if (r.id === 'doc') { r.st = 'ok'; r.note = 'Já validado com os dados pessoais'; } });
    var e = DB.find('t6_envios', 'E-32');
    if (e) { e.status = 'agendado'; e.forecast = '29/10'; e.note = 'Reagendado para o próximo envio semanal depois da confirmação do dado bancário.'; }
  };
  T6.capRows = function (unknown) {
    var c = DB.t6_conta.caps;
    function row(l, v) { var k = unknown ? 'desconhecido' : v; return { l: l, v: k === 'sim' ? 'sim' : k, cls: k === 'sim' ? 'badge badge--ok' : (k === 'desconhecido' ? 'badge badge--plain' : 'badge badge--warn') }; }
    return [row('Vender', c.sell), row('Receber repasse na conta conectada', c.transfer), row('Enviar ao banco', c.payout)];
  };
  T6.reqRows = function () {
    var M = { ok: ['ok', 'onb-st onb-st--ok', 'check', 'onb-secs__ic is-ok'], pendente: ['pendente', 'onb-st onb-st--todo', 'bank', 'onb-secs__ic'], analise: ['em análise', 'onb-st onb-st--wait', 'clock', 'onb-secs__ic'], depois: ['depois da conta', 'onb-st', 'file', 'onb-secs__ic'] };
    return DB.t6_conta.reqs.map(function (r) { var m = M[r.st] || [r.st, 'onb-st', 'info', 'onb-secs__ic']; return { label: r.label, note: r.note, st: m[0], stCls: m[1], ic: 'ic ic--sm i-' + m[2], icCls: m[3] }; });
  };
  // linhas chave-valor prontas para o template
  T6.kv = function (pairs) { return pairs.filter(Boolean).map(function (p) { return { k: p[0], v: p[1], cls: p[2] || '' }; }); };
})();
