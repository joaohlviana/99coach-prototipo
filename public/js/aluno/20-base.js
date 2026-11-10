/* A2 · base comum das telas de contratação da aluna Ana (H11/FC01–FC10/REL05).
   Coleções próprias: a2_ct (detalhes de cada contratação), a2_pedidos (pedidos de compra),
   a2_reembolsos (solicitações de reembolso), a2_checkout (rascunho da compra em andamento).
   Pagamento é sempre demonstração: cartão de teste 4242 e Pix com código fictício. */
(function () {
  'use strict';
  var DB = window.DB, U = window.U;

  // detalhes das contratações já existentes em DB.contratacoes (ct1, ct2, ct3)
  DB.seed('a2_ct', {
    ct1: { offer: 'o1', order: '4512', for: 'Ana Carolina Souza', access: 'ativo', policy: 'v2',
      receipts: [{ id: 'rc1', at: '05/10/2026', value: 200 }, { id: 'rc2', at: '05/09/2026', value: 200 }, { id: 'rc3', at: '05/08/2026', value: 200 }],
      events: [['Contratado', '05/03 · Cartão final 4242'], ['Cobrança paga', '05/10 · R$ 200,00']] },
    ct2: { offer: 'o4', order: '', for: 'Ana Carolina Souza', access: 'ativo', policy: '',
      receipts: [], events: [['Acesso gratuito liberado por Rafael', '15/09 · sem cobrança']] },
    ct3: { offer: '', order: '4377', for: 'Ana Carolina Souza', access: 'ativo', policy: 'v1',
      receipts: [{ id: 'rc4', at: '02/08/2026', value: 47 }], events: [['Pagamento confirmado', '02/08 · Pix · R$ 47,00'], ['Acesso liberado', '02/08']] }
  });
  DB.seed('a2_pedidos', []);
  DB.seed('a2_reembolsos', []);
  DB.seed('a2_checkout', { email: 'ana@email.com', recipient: null, coupon: null, method: 'card' });

  var KIND = { recorrente: 'assinatura', programa: 'programa', avulsa: 'avulsa', pacote: 'pacote' };
  var ENDED = { 'cancelada': 1, 'reembolsada': 1, 'encerrada': 1 };
  // contratação de exemplo para a situação "pago · acesso em preparação" (não fica no DB)
  var PREP = { id: 'ctprep', what: 'Sessão presencial', with: 'Rafael Lima', kind: 'avulsa', price: 80, unit: 'sessão', status: 'pago', next: '', method: 'Cartão final 4242', since: '26/10' };
  var PREPX = { offer: 'o2', order: '4821', paidAt: '26/10 08:12', for: 'Ana Carolina Souza', access: 'preparando', policy: 'v2',
    receipts: [{ id: 'rcp', at: '26/10/2026', value: 80 }], events: [['Pagamento confirmado', '26/10 08:12 · R$ 80,00']] };

  var A2 = {
    PREP: PREP,
    brl: function (n) { var v = Number(n) || 0; return 'R$ ' + v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.'); },
    first: function (name) { return String(name || '').split(' ')[0]; },
    badge: function (text, kind) { return { text: text, cls: 'badge badge--' + kind }; },
    okEmail: function (e) { return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(String(e || '').trim()); },
    offer: function (id) { return DB.find('ofertas', id) || DB.find('ofertas', 'o1'); },
    base: function (id) { return id === 'ctprep' ? PREP : DB.find('contratacoes', id); },
    x: function (id) { return id === 'ctprep' ? PREPX : ((DB.a2_ct || {})[id] || { offer: '', order: '', for: 'Ana Carolina Souza', access: 'ativo', policy: '', receipts: [], events: [] }); },
    refundOf: function (id) { return (DB.a2_reembolsos || []).filter(function (r) { return r.ct === id; }).slice(-1)[0] || null; },
    hasAccess: function (oid) {
      return DB.contratacoes.filter(function (c) { return A2.x(c.id).offer === oid && !ENDED[c.status] && A2.x(c.id).access !== 'encerrado'; })[0] || null;
    },
    recipient: function () { var r = DB.a2_checkout.recipient; return r && r.email ? r : null; },
    // descrições da oferta para o resumo
    fmt: function (o) {
      if (o.kind === 'programa') { var p = DB.find('programas', o.program); return 'Programa em vídeo · ' + (p ? p.weeks + ' semanas, ' + p.sessions + ' sessões' : 'online'); }
      if (o.kind === 'recorrente') return 'Acompanhamento ' + o.fmt + ' · plano mensal';
      if (o.kind === 'pacote') return 'Aulas ' + o.fmt + 's · 8 aulas em Londrina';
      return 'Sessão ' + o.fmt + ' · 1 encontro em Londrina';
    },
    unitTxt: function (o) { return o.kind === 'recorrente' ? ' / mês' : (o.unit === 'sessão' ? ' / sessão' : ''); },
    // valores da compra (com cupom aplicado só na primeira cobrança)
    quote: function (oid) {
      var o = A2.offer(oid), cp = DB.a2_checkout.coupon, off = 0, code = '';
      if (cp && cp.offer === o.id) {
        code = cp.code;
        off = /%$/.test(cp.off) ? Math.round(o.price * parseFloat(cp.off) / 100) : (parseFloat(String(cp.off).replace(/[^\d,.]/g, '').replace(',', '.')) || 0);
      }
      var rec = o.kind === 'recorrente';
      return { o: o, base: o.price, off: off, today: Math.max(0, o.price - off), code: code, recurring: rec, next: rec ? o.price : 0, nextDate: rec ? '26/11' : '',
        priceTxt: U.money(o.price) + A2.unitTxt(o), todayTxt: A2.brl(Math.max(0, o.price - off)), nextTxt: rec ? A2.brl(o.price) + ' em 26/11' : '' };
    },
    orderNo: function () { return String(4822 + DB.a2_pedidos.length); },
    // cria o pedido; pago gera a contratação em DB.contratacoes
    createOrder: function (oid, method, status) {
      var q = A2.quote(oid), gift = A2.recipient();
      var ord = { id: A2.orderNo(), offer: q.o.id, total: q.today, method: method, at: '26/10 ' + U.now(), status: status, ct: '', coupon: q.code,
        gift: gift ? { name: gift.name, email: gift.email } : null };
      DB.a2_pedidos.push(ord);
      if (status === 'pago') A2.fulfil(ord);
      DB.a2_checkout.coupon = null;
      return ord;
    },
    fulfil: function (ord) {
      if (ord.ct) return ord;
      var o = A2.offer(ord.offer), id = 'ct' + ord.id, rec = o.kind === 'recorrente';
      var method = ord.method === 'pix' ? 'Pix' : 'Cartão final 4242';
      DB.contratacoes.push({ id: id, what: o.name, with: 'Rafael Lima', kind: KIND[o.kind] || 'programa', price: o.price, unit: o.unit,
        status: rec ? 'ativa' : 'pago', next: rec ? '26/11' : '', method: method, since: '26/10' });
      DB.a2_ct[id] = { offer: o.id, order: ord.id, paidAt: ord.at, policy: 'v' + o.version,
        for: ord.gift ? ord.gift.name + ' (' + ord.gift.email + ')' : 'Ana Carolina Souza', gift: !!ord.gift,
        access: ord.gift ? 'convite' : (o.accept === 'aceite do treinador' ? 'aguardando aceite' : 'preparando'),
        receipts: [{ id: 'rc' + ord.id, at: '26/10/2026', value: ord.total }],
        events: [['Pagamento confirmado', ord.at + ' · ' + (ord.method === 'pix' ? 'Pix' : 'cartão de teste') + ' · ' + A2.brl(ord.total)]] };
      ord.ct = id; ord.status = 'pago';
      if (ord.gift) DB.a2_checkout.recipient = null;
      return ord;
    },
    famLabel: function (c) { return c.kind === 'assinatura' ? 'Acompanhamento' : c.kind === 'programa' ? 'Programa' : c.kind === 'avulsa' ? 'Sessão avulsa' : c.kind === 'pacote' ? 'Pacote' : 'Contratação'; },
    // leitura pronta de uma contratação: selos separados para pagamento e acesso, linha de apoio e ação principal
    view: function (c, scn) {
      var x = A2.x(c.id), rec = c.kind === 'assinatura', rf = A2.refundOf(c.id);
      var price = c.price ? U.money(c.price) + (rec ? ' / mês' : (c.unit === 'sessão' ? ' / sessão' : '')) : 'sem cobrança';
      var pay;
      if (rf && rf.status === 'em análise') pay = A2.badge('reembolso em análise', 'info');
      else if (c.status === 'reembolsada') pay = A2.badge('reembolsado', 'plain');
      else if (!c.price) pay = A2.badge('sem cobrança', 'plain');
      else if (c.status === 'ativa') pay = A2.badge('pagamento em dia', 'ok');
      else if (c.status === 'pausada') pay = A2.badge('cobrança pausada', 'plain');
      else if (c.status === 'renovação cancelada') pay = A2.badge('renovação cancelada', 'plain');
      else if (c.status === 'pago') pay = A2.badge('pago', 'ok');
      else pay = A2.badge(c.status, 'plain');
      var acc;
      if (c.status === 'reembolsada' || x.access === 'encerrado') acc = A2.badge('acesso encerrado', 'plain');
      else if (c.status === 'renovação cancelada') acc = A2.badge('acesso até ' + (x.until || c.next || '—'), 'ok');
      else if (c.status === 'pausada') acc = A2.badge('pausado até ' + (x.pauseUntil || '—'), 'warn');
      else if (x.access === 'preparando') acc = A2.badge('acesso em preparação', 'warn');
      else if (x.access === 'aguardando aceite') acc = A2.badge('aguardando aceite de ' + A2.first(c.with), 'info');
      else if (x.access === 'convite') acc = A2.badge('convite aguardando aceite', 'info');
      else acc = A2.badge('acesso ativo', 'ok');
      var badges = [pay, acc];
      if (scn === 'revisao' && c.id === 'ct1') badges.push(A2.badge('cobrança em revisão', 'warn'));
      var meta;
      if (c.status === 'renovação cancelada') meta = 'Não renova · acesso até ' + (x.until || '—') + ' · nada é cobrado depois';
      else if (c.status === 'pausada') meta = 'Cobranças pausadas até ' + (x.pauseUntil || '—') + ' · histórico guardado';
      else if (c.status === 'reembolsada') meta = 'Reembolsado · ' + (rf ? rf.at : c.since);
      else if (x.access === 'preparando') meta = 'Pago ' + (x.paidAt || c.since) + ' · o acesso costuma liberar em minutos';
      else if (x.access === 'aguardando aceite') meta = 'Pago ' + (x.paidAt || c.since) + ' · começa quando ' + A2.first(c.with) + ' aceitar';
      else if (x.access === 'convite') meta = 'Presente para ' + x.for + ' · convite enviado';
      else if (rec) meta = 'Renova em ' + (c.next || '—') + ' · ' + (c.method || 'método no provedor');
      else if (!c.price) meta = 'Liberado por ' + A2.first(c.with) + ' em ' + c.since + ' · sem cobrança';
      else meta = 'Pago ' + c.since + ' · ' + (c.method || '');
      if (rf && rf.status === 'em análise') meta = 'Reembolso #' + rf.id + ' em análise · ' + A2.brl(rf.value);
      var act;
      if (x.access === 'preparando' || x.access === 'aguardando aceite' || x.access === 'convite') act = ['Ver andamento', 'btn btn--outline btn--sm', function () { window.GO('FC06', { id: c.id }); }];
      else if (c.status === 'reembolsada' || x.access === 'encerrado') act = ['Detalhes', 'btn btn--outline btn--sm', function () { window.GO('H11', { id: c.id }); }];
      else if (rec) act = ['Abrir treinos', 'btn btn--primary btn--sm', function () { window.GO('ALU06'); }];
      else if (c.kind === 'programa') act = ['Abrir programa', 'btn btn--outline btn--sm', function () { window.GO('ALU06'); }];
      else act = ['Detalhes', 'btn btn--outline btn--sm', function () { window.GO('H11', { id: c.id }); }];
      return { id: c.id, title: c.what, with: c.with, ini: U.ini(c.with), fam: A2.famLabel(c), price: price, recurring: rec,
        line: c.what + ' · ' + price, badges: badges, meta: meta,
        actLabel: act[0], actCls: act[1], act: act[2], x: x, c: c, refund: rf,
        ended: !!(ENDED[c.status] || x.access === 'encerrado'), isProgram: c.kind === 'programa' };
    }
  };
  window.A2 = A2;
})();
