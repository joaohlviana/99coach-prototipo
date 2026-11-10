/* PUB15 · Catálogo público de programas online: busca, modalidade e duração, card com autor, duração do programa x duração do acesso e preço com contexto.
   Programas do Rafael vêm de DB.p1_programas (abrem o detalhe PUB06); os do DS (MTP Athletes, Renata Lopes) abrem a composição do DS. */
(function () {
  'use strict';
  DB.seed('p2_programas', [
    { id: 'ringmu', name: 'Primeiro Ring Muscle-Up', author: 'MTP Athletes', authorRef: '', mod: 'CrossFit', weeks: 12, access: 'acesso 12 meses', price: 80, cover: '0d6e126f792d89360f91548c75ddf267' },
    { id: 'corrida5k', name: 'Base de Corrida 5K', author: 'Renata Lopes', authorRef: '', mod: 'Corrida', weeks: 8, access: '', price: 147, cover: '' },
    { id: 'lpo', name: 'LPO Booster', author: 'MTP Athletes', authorRef: '', mod: 'CrossFit', weeks: 0, access: 'acesso 12 meses', price: 80, cover: '', noCover: true }
  ]);
  var MODS = ['Todas', 'CrossFit', 'Corrida', 'Força', 'Mobilidade'];
  var DURS = [['', 'Qualquer duração'], ['curto', 'Até 8 semanas'], ['longo', 'Mais de 8 semanas']];
  var P1MOD = { p1: 'CrossFit', p3: 'Mobilidade' };

  REG.screen({
    page: 'publico', key: 'programas', id: 'PUB15', title: 'Programas', nav: 'programas', back: 'history', wide: true,
    normal: 'Catálogo',
    scens: [['semmod', 'Sem programas nesta modalidade'], ['retirado', 'Programa retirado'], ['semoferta', 'Sem oferta'], ['carregando', 'Carregando'], ['semres', 'Sem resultado'], ['parcial', 'Consulta parcial'], ['erro', 'Erro']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn, g = function (k, d) { return P2.g(ui, k, d); };
      var P = window.P1;
      var q = g('q', scn === 'semres' ? 'kettlebell avançado' : '');
      var mod = g('mod', scn === 'semmod' ? 'Força' : 'Todas');
      var dur = g('dur', scn === 'erro' ? 'curto' : '');
      var loading = scn === 'carregando';

      // catálogo: programas do Rafael (P1) + programas do DS
      var fromP1 = (DB.p1_programas || []).map(function (p) {
        var t = P ? P.tr(p.author) : { name: 'Rafael Lima' };
        return { id: p.id, name: p.name, author: t.name, authorRef: p.author, mod: P1MOD[p.id] || 'CrossFit', weeks: p.weeks, access: 'acesso 12 meses', price: p.price, cover: '', p1: true };
      });
      var all = fromP1.concat(DB.p2_programas);
      if (scn === 'retirado') all = all.filter(function (p) { return p.id !== 'lpo'; });
      if (scn === 'parcial') all = all.filter(function (p) { return p.mod !== 'Corrida'; });
      var nq = U.norm(q);
      var durOk = scn !== 'erro';
      var list = all.filter(function (p) {
        if (mod !== 'Todas' && p.mod !== mod) return false;
        if (durOk && dur === 'curto' && !(p.weeks && p.weeks <= 8)) return false;
        if (durOk && dur === 'longo' && !(p.weeks > 8)) return false;
        if (nq) { var hay = U.norm(p.name + ' ' + p.author + ' ' + p.mod); if (!nq.split(/\s+/).every(function (w) { return hay.indexOf(w) >= 0; })) return false; }
        return true;
      }).map(function (p) {
        var noOffer = scn === 'semoferta' && p.id === 'corrida5k';
        var cover = p.cover ? U.img(p.cover) : '';
        var meta = [p.author, p.weeks ? p.weeks + ' sem' : 'duração não informada', p.access || 'acesso: ver condições'].join(' · ');
        return {
          name: p.name, meta: p.noCover ? 'Sem capa · ' + meta : meta, mod: p.mod,
          price: noOffer ? 'Sem oferta' : U.money(p.price), priceSub: noOffer ? 'sem compra agora' : 'pagamento único', hasOffer: !noOffer, noOffer: noOffer,
          cover: cover, hasCover: !!cover, noCover: !cover,
          open: function () { if (p.p1) ctx.go('PUB06', { id: p.id }); else ctx.go('telas', { id: 'PUB06' }); },
          author: p.author, authorLabel: 'Ver autor: ' + p.author,
          openAuthor: function () { if (p.authorRef && P) P.openTrainer(p.authorRef); else ctx.go('PUB04'); }
        };
      });

      var alerts = [];
      if (scn === 'retirado') alerts.push(P2.alert('info', 'info', 'Programa retirado', 'LPO Booster saiu do catálogo em 25/10. Quem comprou mantém o acesso conforme a oferta contratada.', 'Tentar de novo', function () { ctx.scenario(''); ctx.toast('Catálogo atualizado às ' + U.now() + '.'); }));
      if (scn === 'semoferta') alerts.push(P2.alert('', 'tag', 'Sem oferta', 'Base de Corrida 5K aparece sem preço e sem compra: o autor ainda não publicou uma oferta.', 'Saiba por quê', function () { ctx.setUi({ why: !g('why', false) }); }));
      if (scn === 'parcial') alerts.push(P2.alert('warn', 'alert', 'Consulta parcial', 'Os programas de Corrida não carregaram. Mostramos os que vieram; nada foi descartado.', 'Consultar de novo', function () { ctx.scenario(''); }));
      if (scn === 'erro') alerts.push(P2.alert('risk', 'alert', 'Não foi possível aplicar o filtro de duração', 'Os resultados abaixo ignoram a duração escolhida. Corrija o filtro para tentar de novo.', 'Corrigir', function () { ctx.scenario(''); ctx.setUi({ dur: '' }); }));

      var others = MODS.filter(function (m) { return m !== 'Todas' && m !== mod && all.some(function (p) { return p.mod === m; }); });
      var filtered = !!q || mod !== 'Todas' || !!dur;
      var noMod = !loading && list.length === 0 && mod !== 'Todas' && !q && !all.some(function (p) { return p.mod === mod; });
      return {
        alerts: alerts, why: scn === 'semoferta' && !!g('why', false),
        q: q, setQ: function (e) { ctx.setUi({ q: U.val(e) }); },
        mods: MODS.map(function (m) { var on = m === mod; return { label: m, cls: 'opt p2-optbtn' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ mod: m }); } }; }),
        durs: DURS.map(function (d) { var on = d[0] === dur; return { label: d[1], cls: 'chip p2-chip' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ dur: d[0] }); } }; }),
        loading: loading, skel: [1, 2, 3].map(function (n) { return { n: String(n) }; }),
        list: list, hasList: !loading && list.length > 0,
        noMod: noMod, modName: mod,
        noRes: !loading && list.length === 0 && !noMod,
        others: others.map(function (m) { return { label: 'Ver ' + m, go: function () { ctx.setUi({ mod: m }); } }; }),
        count: U.plural(list.length, 'programa', 'programas') + (filtered ? ' com os filtros' : ' no catálogo'),
        filtered: filtered,
        clear: function () { if (ctx.scn === 'semres' || ctx.scn === 'semmod') ctx.scenario(''); ctx.setUi({ q: '', mod: 'Todas', dur: '' }); },
        mine: function () { ctx.go('ALU06'); }, findTrainer: function () { ctx.go('@esporte', {}); }
      };
    }
  });
})();
