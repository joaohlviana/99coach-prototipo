/* MPROG · Meus programas (conta real): programas comprados com acesso válido. O conteúdo é o que o treinador escreveu
   no programa; some quando o prazo termina ou se o pagamento for reembolsado. Nada de programa de exemplo. */
REG.screen({
  page: 'aluno', key: 'meusprogramas', id: 'MPROG', title: 'Meus programas', nav: 'programas', wide: true, back: 'AMENU',
  vals: function (ctx) {
    var C = window.CONTA, ui = ctx.ui;
    var load = function () { ctx.setUi({ asked: true }); C.rpc('my_programs', {}).then(function (r) { var d = r.ok ? (Array.isArray(r.data) && r.data.length === 1 && Array.isArray(r.data[0]) ? r.data[0] : r.data) : null; ctx.setUi({ list: Array.isArray(d) ? d : (r.ok ? [] : null) }); }); };
    if (C && C.session() && !ui.asked) load();
    var rows = (ui.list || []).map(function (p) {
      var open = ui.open === p.order;
      return { title: p.title, sub: (p.trainer ? 'de ' + p.trainer + ' · ' : '') + U.plural(p.weeks, 'semana', 'semanas') + ' · ' + U.plural(p.workouts, 'treino', 'treinos') + ' · acesso até ' + new Date(p.until).toLocaleDateString('pt-BR'),
        desc: p.description || '', hasDesc: !!p.description, content: p.content || '', hasContent: open && !!p.content, noContent: open && !p.content,
        open: open, toggle: function () { ctx.setUi({ open: open ? '' : p.order }); }, toggleLabel: open ? 'Fechar' : 'Abrir programa' };
    });
    return {
      loading: ui.list === undefined, fail: ui.list === null, rows: rows, hasRows: rows.length > 0, empty: Array.isArray(ui.list) && !rows.length,
      reload: load, find: function () { GO('@home'); }
    };
  }
});
