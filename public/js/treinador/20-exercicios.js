/* TRE10 · Catálogo e seleção de exercícios: busca sem acento, filtros (grupo, equipamento, favoritos, meus), seleção múltipla.
   Com destino ({rotina, sessao}) mostra "Adicionar N exercícios selecionados", grava no rascunho da sessão e abre o editor (TRE14). */
REG.screen({
  page: 'treinador', key: 'exercicios', id: 'TRE10', title: 'Exercícios', nav: 'exercicios',
  back: function (ctx) { return ctx.p.rotina ? 'TRE14' : ''; },
  backParams: function (ctx) { return { id: ctx.p.rotina || '', sessao: ctx.p.sessao || '' }; },
  normal: 'Catálogo',
  scens: [['favvazio', 'Favoritos vazios'], ['filtro', 'Filtro sem resultado'], ['sel3', '3 selecionados'], ['colvazia', 'Coleção vazia'],
    ['nenhum', 'Nenhum resultado do filtro'], ['falha', 'Falha parcial de catálogo']],
  vals: function (ctx) {
    var T = window.T3, ui = ctx.ui, scn = ctx.scn;
    // destino: vem da rota (editor) ou é escolhido aqui
    var pr = ctx.p.rotina && T.rot(ctx.p.rotina) ? { rid: ctx.p.rotina, sid: ctx.p.sessao || '' } : null;
    var dest = pr || ui.dest || (scn === 'sel3' ? { rid: 'r1', sid: 's1' } : null);
    if (dest && !dest.sid) dest = { rid: dest.rid, sid: (T.sessions(dest.rid)[0] || {}).id || '' };
    var memKey = dest ? dest.rid + ':' + dest.sid : '_';
    var mem = !scn && DB.t3_exState[memKey] ? DB.t3_exState[memKey] : {};
    var pick = function (k, scnVal, def) { return ui[k] !== undefined ? ui[k] : (scn && scnVal !== undefined ? scnVal : (mem[k] !== undefined ? mem[k] : def)); };
    var aba = pick('aba', { favvazio: 'fav', colvazia: 'meus' }[scn], ctx.p.aba || 'cat');
    var q = pick('q', { nenhum: 'kettlebell swing unilateral' }[scn], ctx.p.q || '');
    var grp = pick('grp', { filtro: 'LPO' }[scn], '');
    var eq = pick('eq', { filtro: 'Halteres' }[scn], '');
    var sel = pick('sel', { sel3: ['agach', 'terra', 'afundo'] }[scn], []);
    var set = function (o) {
      var st = { aba: aba, q: q, grp: grp, eq: eq, sel: sel };
      Object.keys(o).forEach(function (k) { if (k in st) st[k] = o[k]; });
      DB.t3_exState[memKey] = st;
      ctx.setUi(o);
    };
    var failed = scn === 'falha' && !ui.fixed;

    // situações desenhadas: coleção sem favoritos / sem exercícios próprios
    var isFav = function (e) { return scn === 'favvazio' && !ui.favTouched ? false : !!e.fav; };
    var all = DB.exercicios.filter(function (e) { return scn === 'colvazia' ? !e.own : true; }).filter(function (e) { return failed ? (e.own || isFav(e)) : true; });
    var base = all.filter(function (e) { return aba === 'fav' ? isFav(e) : aba === 'meus' ? e.own : true; });
    var nq = U.norm(q);
    var list = base.filter(function (e) {
      return (!grp || e.group === grp) && (!eq || e.equip === eq) && (!nq || U.norm(e.name + ' ' + e.group + ' ' + e.equip).indexOf(nq) >= 0);
    });
    var uniq = function (k) { var o = []; DB.exercicios.forEach(function (e) { if (o.indexOf(e[k]) < 0) o.push(e[k]); }); return o.sort(); };
    var chipsOf = function (vals, cur, k) {
      return [{ label: 'Todos', cls: 'chip' + (!cur ? ' is-on' : ''), on: String(!cur), pick: function () { var o = {}; o[k] = ''; set(o); } }].concat(vals.map(function (g) {
        var on = cur === g; return { label: g, cls: 'chip' + (on ? ' is-on' : ''), on: String(on), pick: function () { var o = {}; o[k] = on ? '' : g; set(o); } };
      }));
    };
    var dupNames = {};
    DB.exercicios.forEach(function (e) { var k = U.norm(e.name).split(' (')[0]; dupNames[k] = (dupNames[k] || 0) + 1; });
    var rows = list.map(function (e) {
      var on = sel.indexOf(e.id) >= 0, fav = isFav(e);
      return {
        id: e.id, name: e.name, meta: [e.equip, e.group, e.level].filter(Boolean).join(' · ') + (failed && !e.own ? ' · vídeo —' : ''),
        origin: e.own ? 'Meu' : '99Coach', originCls: e.own ? 'badge badge--ink' : 'badge badge--plain',
        homo: dupNames[U.norm(e.name).split(' (')[0]] > 1,
        on: String(on), checkCls: 'check' + (on ? ' is-on' : ''), rowCls: 'lrow t3-exrow' + (on ? ' is-on' : ''),
        toggle: function () { var s = sel.slice(); var i = s.indexOf(e.id); if (i >= 0) s.splice(i, 1); else s.push(e.id); set({ sel: s }); },
        view: function () { GO('TRE11', dest ? { id: e.id, rotina: dest.rid, sessao: dest.sid } : { id: e.id }); },
        favCls: 'icon-btn t3-fav' + (fav ? ' is-on' : ''), favOn: String(fav), favLabel: (fav ? 'Remover ' : 'Favoritar ') + e.name,
        fav: function () { e.fav = !fav; if (scn === 'favvazio') { e.fav = true; set({ favTouched: true }); } else ctx.refresh(); }
      };
    });
    var tabs = [['cat', 'Catálogo'], ['meus', 'Meus'], ['fav', 'Favoritos']].map(function (t) {
      var on = aba === t[0]; return { label: t[1], cls: 'seg__it' + (on ? ' is-on' : ''), on: String(on), pick: function () { set({ aba: t[0] }); } };
    });
    var filtered = !!(q || grp || eq);
    var emptyFav = aba === 'fav' && !base.length;
    var emptyMine = aba === 'meus' && !base.length;
    var noResult = !!base.length && !list.length;

    var n = sel.length;
    var destLabel = dest ? T.destLabel(dest.rid, dest.sid) : '';
    var dests = T.dests().map(function (d) {
      var on = !!(dest && dest.rid === d.rid && dest.sid === d.sid);
      return { label: d.label, cls: 'chip' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ dest: { rid: d.rid, sid: d.sid }, destOpen: false }); } };
    });
    var add = function () {
      if (!n) { ctx.toast('Selecione ao menos um exercício.'); return; }
      if (!dest) { ctx.setUi({ destOpen: true }); return; }
      var s = T.addToSession(dest.rid, dest.sid, sel);
      DB.t3_exState[memKey] = { aba: aba, q: q, grp: grp, eq: eq, sel: [] };
      GO('TRE14', { id: dest.rid, sessao: s ? s.id : dest.sid, added: String(n) });
    };

    var notice = failed ? T.notice('warn', 'alert', 'Falha parcial de catálogo', 'Seus exercícios e favoritos carregaram; o catálogo 99Coach não respondeu. Sua seleção continua salva.', [['Tentar de novo', function () { ctx.setUi({ fixed: true }); ctx.toast('Catálogo carregado.'); }]]) : T.none();
    var own = DB.exercicios.filter(function (e) { return e.own; }).length;

    return {
      sub: (failed ? 'Catálogo 99Coach indisponível agora' : (DB.exercicios.length - own) + ' no catálogo 99Coach') + ' · ' + U.plural(own, 'seu', 'seus'),
      create: function () { GO('TRE12', dest ? { rotina: dest.rid, sessao: dest.sid } : {}); },
      nt: notice,
      hasDest: !!dest, destLabel: destLabel, destFixed: !!pr, destOpen: !!ui.destOpen, dests: dests,
      toggleDest: function () { ctx.setUi({ destOpen: !ui.destOpen }); },
      q: q, setQ: function (e) { set({ q: U.val(e) }); }, hasQ: !!q, clearQ: function () { set({ q: '' }); },
      tabs: tabs, grpChips: chipsOf(uniq('group'), grp, 'grp'), eqChips: chipsOf(uniq('equip'), eq, 'eq'),
      filtersOpen: ui.filters !== undefined ? !!ui.filters : !!(grp || eq), toggleFilters: function () { ctx.setUi({ filters: !(ui.filters !== undefined ? ui.filters : !!(grp || eq)) }); },
      filterLabel: (grp || eq) ? 'Filtros · ' + [grp, eq].filter(Boolean).join(', ') : 'Filtros',
      rows: rows, hasRows: rows.length > 0, count: U.plural(list.length, 'exercício', 'exercícios'),
      emptyFav: emptyFav, emptyMine: emptyMine, noResult: noResult, filtered: filtered,
      toCatalog: function () { set({ aba: 'cat' }); },
      clear: function () { set({ q: '', grp: '', eq: '' }); },
      hasSel: n > 0, selText: U.plural(n, 'selecionado', 'selecionados'),
      addLabel: dest ? (n ? 'Adicionar ' + U.plural(n, 'exercício selecionado', 'exercícios selecionados') : 'Adicionar exercícios selecionados') : 'Escolher destino',
      addCls: 'btn btn--primary btn--lg' + (n ? '' : ' is-off'), addOff: String(!n), add: add,
      clearSel: function () { set({ sel: [] }); },
      backEditor: function () { GO('TRE14', { id: dest ? dest.rid : '', sessao: dest ? dest.sid : '' }); }
    };
  }
});
