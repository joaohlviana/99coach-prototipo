/* T5 · H08 Insights (também TRE27 Analytics do treinador): indicadores com fonte, período e base; comparação com o
   período anterior; base pequena sem conclusão; desempenho por oferta → "Revisar oferta selecionada" (TRE29);
   "Revisar perfil" (ACC06); interpretação assistida opcional (IA05). Analytics fora do ar não bloqueia o trabalho. */
(function () {
  // períodos além dos 7 dias de DB.insights (mesma fonte 99Coach; medição começou em 01/08)
  DB.seed('t5_periodos', {
    '30d': { label: 'Últimos 30 dias', range: '27/09–26/10', prevRange: '28/08–26/09', visits: 412, visitsPrev: 365, contacts: 9, contactsPrev: 7, sales: 5, salesPrev: 4, revenue: 691,
      offers: [{ offer: 'o1', views: 96, conv: '6%' }, { offer: 'o4', views: 188, conv: '4%' }, { offer: 'o2', views: 40, conv: '5%' }] },
    '90d': { label: 'Últimos 90 dias', range: '28/07–26/10', prevRange: '', visits: 1180, visitsPrev: null, contacts: 24, contactsPrev: null, sales: 14, salesPrev: null, revenue: 1959,
      offers: [{ offer: 'o1', views: 290, conv: '5%' }, { offer: 'o4', views: 540, conv: '4%' }, { offer: 'o2', views: 110, conv: '6%' }] }
  });
  var PERIODS = [['7d', '7 dias'], ['30d', '30 dias'], ['90d', '90 dias']];
  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function num(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function pct(n, d) { return (Math.round(n / d * 1000) / 10).toFixed(1).replace('.', ',').replace(',0', '') + '%'; }
  function data(p) {
    if (p === '7d') {
      var i = DB.insights;
      return { label: 'Últimos 7 dias', range: '20/10–26/10', prevRange: '13/10–19/10', visits: i.visits, visitsPrev: i.visitsPrev, contacts: i.contacts, contactsPrev: i.contactsPrev, sales: i.sales, salesPrev: i.salesPrev, revenue: i.revenue, offers: i.offers };
    }
    return DB.t5_periodos[p];
  }
  function cmp(cur, prev, range, off) {
    if (off) return { t: 'Comparação indisponível', cls: 'mod-small mod-muted' };
    if (prev === null || prev === undefined) return { t: 'Sem período anterior comparável (medição desde 01/08)', cls: 'mod-small mod-muted' };
    if (cur < 10 && prev < 10) return { t: 'Poucos dados para comparar (' + prev + ' em ' + range + ')', cls: 'mod-small mod-muted' };
    var d = cur - prev, p = prev ? Math.round(d / prev * 100) : 0;
    return { t: (d >= 0 ? '+' : '−') + num(Math.abs(d)) + ' (' + (d >= 0 ? '+' : '−') + Math.abs(p) + '%) vs ' + num(prev) + ' em ' + range, cls: 'mod-small t5-delta' };
  }
  var W = function (n, max) { var w = max ? Math.max(5, Math.round(n / max * 20) * 5) : 5; return 't5-fun__fill t5-w' + Math.min(100, w); };

  REG.screen({
    page: 'treinador', key: 'insights', id: 'H08', also: ['TRE27'], title: 'Insights', nav: 'insights', wide: true,
    back: 'TMENU',
    normal: 'Com dados',
    scens: [['primeiro', 'Primeiro uso'], ['ausencia', 'Ausência confirmada'], ['parcial', 'Indisponibilidade parcial'], ['base', 'Base pequena'], ['fonte', 'Fonte indisponível'], ['atualizado', 'Atualizado'], ['cobertura', 'Cobertura parcial'], ['comparacao', 'Comparação indisponível'], ['servico', 'Serviço analytics indisponível']],
    vals: function (ctx) {
      var ui = ctx.ui;
      var s = ui.fixed ? '' : ctx.scn;
      var per = ui.per || '7d';
      var d = data(per);
      if (s === 'base') d = { label: d.label, range: d.range, prevRange: d.prevRange, visits: 12, visitsPrev: 9, contacts: 1, contactsPrev: 2, sales: 0, salesPrev: 1, revenue: 0, offers: [{ offer: 'o1', views: 7, conv: '0%' }, { offer: 'o4', views: 9, conv: '0%' }, { offer: 'o2', views: 3, conv: '0%' }] };
      var upto = s === 'fonte' ? '25/10 23:00' : (s === 'atualizado' ? '26/10 10:00' : DB.insights.updated);
      var src = DB.insights.source;
      var visitsOff = s === 'parcial', cmpOff = s === 'comparacao';
      var retry = function () { ctx.setUi({ fixed: true }); ctx.toast('Atualizado às ' + U.now() + ' · fonte ' + src + '.'); };
      var def = function (title, lines) { return function () { ctx.ask({ title: title, lines: lines.concat(['Fonte: ' + src + '. Período: ' + d.range + '. Dados até ' + upto + '.']), ok: 'Entendi', cancel: false }); }; };

      // ---------- indicadores ----------
      var rateVC = d.visits >= 30 ? pct(d.contacts, d.visits) : '—';
      var rateCS = d.contacts >= 30 ? pct(d.sales, d.contacts) : '—';
      var kpis = [
        { l: 'Visitas ao perfil', n: visitsOff ? '—' : num(d.visits), base: visitsOff ? 'Parcial, não exibido · dados até 23/10' : 'Base: sessões únicas no perfil', c: visitsOff ? { t: 'Sem comparação com período parcial', cls: 'mod-small mod-muted' } : cmp(d.visits, d.visitsPrev, d.prevRange, cmpOff),
          def: def('Visitas ao perfil', ['Sessões únicas que abriram seu perfil público na 99Coach.', 'Robôs e suas próprias visitas ficam fora.']) },
        { l: 'Contatos', n: num(d.contacts), base: 'Pedidos válidos e mensagens iniciadas · completo', c: cmp(d.contacts, d.contactsPrev, d.prevRange, cmpOff),
          def: def('Contatos', ['Pedidos de acompanhamento válidos e primeiras mensagens de pessoas que ainda não são alunos.', 'Pedido não é venda.']) },
        { l: 'Vendas', n: num(d.sales), base: d.sales ? U.money(d.revenue) + ' · fonte Recebimentos' : 'Nenhuma venda no período · medido', c: cmp(d.sales, d.salesPrev, d.prevRange, cmpOff),
          def: def('Vendas', ['Contratações e compras pagas no período, por data de pagamento.', 'Reserva de agenda não conta como venda.']) },
        { l: 'Conversão contato → venda', n: rateCS, base: d.contacts >= 30 ? d.sales + ' de ' + d.contacts + ' contatos' : 'Base pequena (' + U.plural(d.contacts, 'contato', 'contatos') + ') — sem comparação', c: { t: d.contacts >= 30 ? '' : 'Precisa de 30 contatos para mostrar a taxa', cls: 'mod-small mod-muted' },
          def: def('Conversão contato → venda', ['Vendas dividido por contatos do mesmo período.', 'Com menos de 30 contatos, não mostramos taxa: seria ruído.']) }
      ].map(function (k) { k.hasC = !!k.c.t; return k; });

      // ---------- funil ----------
      var max = visitsOff ? Math.max(d.contacts, 1) : Math.max(d.visits, 1);
      var funnel = [
        { l: 'Visitas ao perfil', n: visitsOff ? '—' : num(d.visits), cls: visitsOff ? 't5-fun__fill t5-w5 is-off' : W(d.visits, max) },
        { l: 'Contatos', n: num(d.contacts), cls: W(d.contacts, max) },
        { l: 'Vendas', n: num(d.sales), cls: W(d.sales, max) }
      ];
      var funText = visitsOff ? d.contacts + ' contatos e ' + d.sales + ' vendas completos. Visitas parciais: sem taxa de visita para contato.'
        : d.contacts + ' contatos de ' + num(d.visits) + ' visitas (' + (rateVC === '—' ? 'base pequena, sem taxa' : rateVC) + '). ' + (d.visits < 100 ? 'Amostra pequena: trate como sinal, não como tendência.' : 'Base de ' + num(d.visits) + ' visitas.');
      var support = [
        { e: 'Visitas', q: visitsOff ? '—' : num(d.visits), b: visitsOff ? 'parcial' : 'sessões únicas' },
        { e: 'Contatos', q: num(d.contacts), b: visitsOff ? 'completo' : 'das visitas' },
        { e: 'Vendas', q: num(d.sales), b: 'dos contatos' }
      ];

      // ---------- desempenho por oferta ----------
      var sel = ui.offer || 'o1';
      var offers = (d.offers || []).map(function (r) {
        var o = DB.find('ofertas', r.offer) || { name: r.offer, price: 0, unit: '' }, on = r.offer === sel;
        var noMeasure = s === 'cobertura' && r.offer === 'o2';
        var line = noMeasure ? 'Sem medição de visitas desde 22/10 · não é zero' : (num(r.views) + ' visitas à oferta · ' + r.conv + ' pediram' + (r.views < 30 ? ' · base pequena' : ''));
        return { name: o.name, price: U.money(o.price) + (o.unit ? '/' + o.unit : ''), line: line, cls: 'lrow t5-off' + (on ? ' is-on' : ''), on: String(on), noMeasure: noMeasure,
          pick: function () { ctx.setUi({ offer: r.offer }); } };
      });
      var selOffer = DB.find('ofertas', sel);

      var periods = PERIODS.map(function (p) { var on = p[0] === per; return { label: p[1], cls: 'seg__it t5-seg' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ per: p[0] }); } }; });
      var cred = DB.trainer.iaCredits;

      return {
        eyebrow: d.label + ' · ' + d.range + ' · dados até ' + upto,
        periods: periods,
        isFirst: s === 'primeiro', isDown: s === 'servico', hasData: s !== 'primeiro' && s !== 'servico',
        kpis: kpis, funnel: funnel, funText: funText, support: support,
        offers: offers, hasOffers: offers.length > 0,
        selName: selOffer ? selOffer.name : '',
        reviewOffer: function () { ctx.go('TRE29', { id: sel }); },
        reviewOpp: function () { ctx.go('TRE29', { id: 'o1' }); },
        reviewProfile: function () { ctx.go('ACC06'); },
        assisted: function () { ctx.go('IA05', { per: per }); },
        assistNote: 'Opcional. Usa a franquia de IA (' + cred.used + ' de ' + cred.limit + ') e só lê estes indicadores.',
        backWork: function () { ctx.go('TRE01'); },
        goSocial: function () { ctx.go('TRE28'); },
        sAusencia: s === 'ausencia', sParcial: s === 'parcial', sBase: s === 'base', sFonte: s === 'fonte', sAtual: s === 'atualizado', sCobertura: s === 'cobertura', sComparacao: s === 'comparacao',
        upto: upto, src: src,
        retry: retry
      };
    }
  });
})();
