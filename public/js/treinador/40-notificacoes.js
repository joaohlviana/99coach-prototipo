/* T5 · TRE26 Centro de notificações e tarefas: filtrar, marcar como lida (uma ou todas), abrir pendência no destino
   (to + id2). Lida e resolvida são estados distintos: abrir o aviso nunca conclui a tarefa. Prévia externa sem saúde. */
(function () {
  var KIND = {
    tarefa: ['Tarefa', 'checksq'], mensagem: ['Mensagem', 'message'], pedido: ['Pedido', 'user-plus'], venda: ['Venda', 'dollar'], sistema: ['Sistema', 'info']
  };
  var FILTERS = [['todos', 'Todos'], ['nao', 'Não lidos'], ['tarefa', 'Tarefas'], ['mensagem', 'Mensagens'], ['pedido', 'Pedidos'], ['venda', 'Vendas'], ['sistema', 'Sistema']];
  // prévia genérica usada fora do app (push, e-mail): nunca leva dado de saúde nem conteúdo privado
  var EXT = { nt1: 'Novo check-in de Ana', nt2: 'Nova mensagem de Ana', nt3: 'Novo pedido de acompanhamento', nt4: 'Nova venda', nt5: 'Atualização de programa' };
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function build(scn) {
    if (!scn) return DB.notificacoes; // uso normal: as mudanças valem para o resto do protótipo
    var l = clone(DB.notificacoes);
    if (scn === 'lido') l.forEach(function (n) { n.read = true; });
    if (scn === 'concluida') l.forEach(function (n) { if (n.id === 'nt1') { n.read = true; n.done = true; } });
    if (scn === 'vazio') l = [];
    return l;
  }

  REG.screen({
    page: 'treinador', key: 'notificacoes', id: 'TRE26', title: 'Avisos', nav: 'hoje', back: 'H03',
    normal: 'Avisos novos',
    scens: [['lido', 'Tudo lido'], ['naocarregou', 'Não carregou'], ['concluida', 'Tarefa concluída'], ['vazio', 'Vazio confirmado'], ['falhou', 'Consulta falhou']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn;
      var list = ui.list || build(scn);
      var save = function () { if (scn) ctx.setUi({ list: list }); else ctx.refresh(); };
      var failed = scn === 'falhou' && !ui.fixed;
      var f = has(ui, 'f') ? ui.f : (scn === 'lido' ? 'nao' : (scn === 'falhou' ? 'venda' : 'todos'));
      var eff = failed ? 'todos' : f; // consulta falhou: mostra tudo em vez de uma caixa vazia
      var unread = list.filter(function (n) { return !n.read; }).length;

      var filters = FILTERS.map(function (x) {
        var n = x[0] === 'todos' ? list.length : (x[0] === 'nao' ? unread : list.filter(function (i) { return i.kind === x[0]; }).length);
        var on = x[0] === f;
        return { label: x[1] + (n ? ' · ' + n : ''), cls: 'chip t5-chip' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ f: x[0], fixed: ui.fixed || false }); } };
      });
      var shown = list.filter(function (n) { return eff === 'todos' || (eff === 'nao' ? !n.read : n.kind === eff); });
      var items = shown.map(function (n) {
        var k = KIND[n.kind] || ['Aviso', 'bell'], isTask = n.kind === 'tarefa';
        return {
          text: n.text, meta: k[0] + ' · ' + n.at, ic: 'ic ic--sm i-' + k[1],
          cls: 'lrow t5-nt' + (n.read ? '' : ' is-unread'), unread: !n.read, read: !!n.read,
          isTask: isTask, done: !!n.done, open_: isTask && !n.done,
          ext: EXT[n.id] || '', hasExt: isTask && !!EXT[n.id],
          readLbl: n.read ? 'Marcar como não lida' : 'Marcar como lida',
          aLbl: (n.read ? '' : 'Não lido. ') + n.text + ', ' + n.at + (isTask ? (n.done ? ', tarefa resolvida' : ', tarefa aberta') : ''),
          go: function () {
            n.read = true; save();
            if (isTask && n.done) { ctx.toast('Esta tarefa já foi resolvida.'); return; }
            ctx.go(n.to, n.id2 ? { id: n.id2 } : {});
          },
          toggle: function () { n.read = !n.read; save(); }
        };
      });
      var emptyText = !list.length ? '' : (f === 'nao' ? 'Nada novo. Os avisos lidos continuam em Todos.' : 'Nenhum aviso deste tipo.');

      return {
        sub: unread ? U.plural(unread, 'aviso não lido', 'avisos não lidos') + ' · atualizado às 10:00' : 'Tudo lido · atualizado às 10:00',
        filters: filters, items: items, hasItems: items.length > 0,
        noItems: items.length === 0 && list.length > 0, emptyText: emptyText,
        isVazio: list.length === 0, hasList: list.length > 0,
        canAll: unread > 0,
        markAll: function () {
          var n = 0; list.forEach(function (i) { if (!i.read) { i.read = true; n++; } });
          if (scn) ctx.setUi({ list: list }); else ctx.refresh();
          ctx.toast(U.plural(n, 'aviso marcado como lido', 'avisos marcados como lidos') + '. Tarefas continuam abertas até você resolver.');
        },
        sLido: scn === 'lido', sConcluida: scn === 'concluida',
        sStale: scn === 'naocarregou' && !ui.fixed,
        retry: function () { ctx.setUi({ fixed: true }); ctx.toast('Avisos atualizados às ' + U.now() + '.'); },
        sFail: failed, failLabel: 'Vendas',
        fixFilter: function () { ctx.setUi({ fixed: true, f: 'todos' }); },
        prefs: function () { ctx.go('@onboarding', { flow: 'treinador', scn: 'conta' }); }
      };
    }
  });
})();
