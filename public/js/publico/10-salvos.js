/* PUB07 · Favoritos: lista privada de treinadores e programas, remover com desfazer, estados de salvar/falha/sessão */
REG.screen({
  page: 'publico', key: 'salvos', id: 'PUB07', title: 'Favoritos', nav: 'salvos',
  normal: 'Lista com itens',
  scens: [['salvando', 'Salvando'], ['naosalvou', 'Não salvou'], ['vazio', 'Nenhum favorito'], ['vazioconf', 'Vazio confirmado'], ['carregando', 'Carregando'], ['falha', 'Falha da lista'], ['removendo', 'Removendo'], ['expirada', 'Sessão expirada']],
  vals: function (ctx) {
    var P = window.P1, ui = ctx.ui, scn = ctx.scn;
    // produto: favoritos reais (na conta ou neste aparelho), sem itens de exemplo
    if (!document.documentElement.classList.contains('demo') && window.FAV) {
      var ids = Object.keys(window.FAV.map()), R = window.REAL;
      var its = ids.map(function (id) {
        var t = R && R.get(id), name = t ? t.name : 'Perfil indisponível';
        return { name: name, isT: true, isP: false, gone: !t, ok: !!t, sub: t ? [t.spec, t.city || (t.onl ? 'Online' : '')].filter(Boolean).join(' · ') : 'Este perfil saiu do catálogo.',
          price: '', hasPrice: false, hasRating: false, rating: '', at: 'Salvo ' + window.FAV.where(), photo: t && t.photo || '', hasPhoto: !!(t && t.photo), noPhoto: !(t && t.photo), ini: t ? t.ini : '?',
          busy: false, busyText: '', idle: true, openLabel: 'Ver perfil', open: function () { if (t) window.NAV.go('perfil', { id: id }, null); },
          remove: function () { window.FAV.set(id, false); ctx.setUi({ undo: { id: id, name: name } }); }, removeLabel: 'Remover dos favoritos: ' + name };
      });
      var u0 = ui.undo || null;
      return { loading: false, failed: false, expired: false, saving: false, notSaved: false, showList: its.length > 0, items: its, hasItems: its.length > 0, noItemsFilter: false,
        tabs: [], empty: !its.length, emptyConf: false, confAt: '', hasUndo: !!u0, undoText: u0 ? u0.name + ' saiu dos favoritos.' : '',
        undo: function () { if (!u0) return; window.FAV.set(u0.id, true); ctx.setUi({ undo: null }); ctx.toast('Voltou para os favoritos'); }, closeUndo: function () { ctx.setUi({ undo: null }); },
        retrySave: function () {}, retryList: function () {}, entrar: function () { GO('@onboarding', { flow: 'entrar' }); }, encontrar: function () { GO('@home'); }, continuar: function () { GO('@home'); }, skel: [] };
    }
    var hidden = scn === 'carregando' || scn === 'falha' || scn === 'expirada';
    var list = (scn === 'vazio' || scn === 'vazioconf') ? [] : DB.p1_salvos.slice();
    var filter = ui.f || 'todos';
    var counts = { todos: list.length, treinador: 0, programa: 0 };
    list.forEach(function (s) { counts[s.kind]++; });
    var remove = function (s, name) {
      var idx = DB.p1_salvos.indexOf(s);
      DB.p1_salvos = DB.p1_salvos.filter(function (x) { return x !== s; });
      ctx.setUi({ undo: { item: s, idx: idx, name: name } });
    };
    var items = list.filter(function (s) { return filter === 'todos' || s.kind === filter; }).map(function (s, i) {
      var isT = s.kind === 'treinador', t = isT ? P.tr(s.ref) : null, p = isT ? null : P.prog(s.ref);
      var gone = isT && t.status === 'retirado';
      var a = isT ? P.av(t) : { photo: '', hasPhoto: false, noPhoto: false, ini: '' };
      var name = isT ? t.name : p.name;
      var busy = (scn === 'removendo' && i === 0) ? 'Removendo…' : '';
      return {
        name: name, isT: isT, isP: !isT, gone: gone, ok: !gone,
        sub: gone ? t.note : (isT ? t.spec + ' · ' + t.area + ', ' + t.city.split(',')[0] : 'Programa · ' + P.tr(p.author).name + ' · ' + p.weeks + ' semanas'),
        price: gone ? '' : (isT ? (t.from === 'preço sob consulta' ? t.from : 'a partir de ' + t.from) : U.money(p.price) + ' · pagamento único'),
        hasPrice: !gone, hasRating: isT && !gone && !!t.avg, rating: isT ? t.avg : '', at: 'Salvo em ' + s.at,
        photo: a.photo, hasPhoto: a.hasPhoto, noPhoto: isT && !a.hasPhoto, ini: a.ini,
        busy: !!busy, busyText: busy, idle: !busy,
        openLabel: isT ? 'Ver perfil' : 'Ver programa',
        open: function () { if (isT) P.openTrainer(s.ref); else ctx.go('PUB06', { id: s.ref }); },
        remove: function () { remove(s, gone ? 'Perfil indisponível' : name); },
        removeLabel: 'Remover dos favoritos: ' + name
      };
    });
    var undo = ui.undo || null;
    var tabs = [['todos', 'Todos'], ['treinador', 'Treinadores'], ['programa', 'Programas']].map(function (x) {
      var on = filter === x[0]; return { label: x[1], n: String(counts[x[0]]), cls: 'seg__it' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ f: x[0] }); } };
    });
    var empty = !hidden && list.length === 0;
    return {
      loading: scn === 'carregando', failed: scn === 'falha', expired: scn === 'expirada',
      saving: scn === 'salvando', notSaved: scn === 'naosalvou',
      showList: !hidden && list.length > 0, items: items, hasItems: items.length > 0, noItemsFilter: !hidden && list.length > 0 && items.length === 0,
      tabs: tabs,
      empty: empty && scn === 'vazio', emptyConf: empty && scn !== 'vazio', confAt: 'Confirmado em 26/10 às ' + U.now(),
      hasUndo: !!undo, undoText: undo ? undo.name + ' saiu dos favoritos.' : '',
      undo: function () { if (!undo) return; var arr = DB.p1_salvos.slice(); arr.splice(Math.min(undo.idx < 0 ? 0 : undo.idx, arr.length), 0, undo.item); DB.p1_salvos = arr; ctx.setUi({ undo: null }); ctx.toast('Voltou para os favoritos'); },
      closeUndo: function () { ctx.setUi({ undo: null }); },
      retrySave: function () { if (!P.isSaved('treinador', 'carolina')) P.toggleSave('treinador', 'carolina'); ctx.scenario(''); ctx.toast('Salvo nos favoritos'); },
      retryList: function () { ctx.scenario(''); ctx.toast('Favoritos carregados'); },
      entrar: function () { ctx.go('ACC02'); },
      encontrar: function () { ctx.go('@esporte', {}); },
      continuar: function () { ctx.go('PUB08'); },
      skel: [1, 2, 3]
    };
  }
});
