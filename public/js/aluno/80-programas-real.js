/* MPROG · Meus programas (conta real): cada acesso vigente (compra ou cortesia) com a versão que a pessoa recebeu.
   Sessões com exercícios e vídeo; acesso de 12 meses a partir da liberação; reembolso ou revogação tiram só aquela origem.
   Comprar um programa não cria acompanhamento nem conversa com o treinador. Nada de programa de exemplo. */
REG.screen({
  page: 'aluno', key: 'meusprogramas', id: 'MPROG', title: 'Meus programas', nav: 'programas', wide: true, back: 'AMENU',
  vals: function (ctx) {
    var C = window.CONTA, ui = ctx.ui, V = window.VID;
    var load = function () { ctx.setUi({ asked: true }); C.rpc('my_programs', {}).then(function (r) { var d = r.ok ? (Array.isArray(r.data) && r.data.length === 1 && Array.isArray(r.data[0]) ? r.data[0] : r.data) : null; ctx.setUi({ list: Array.isArray(d) ? d : (r.ok ? [] : null) }); }); };
    if (C && C.session() && !ui.asked) load();
    var day = function (x) { return x ? new Date(x).toLocaleDateString('pt-BR') : ''; };
    var rows = (ui.list || []).map(function (p) {
      var key = p.access || p.order, open = ui.open === key;
      var sessions = V ? V.sessionsView(p.sessions, open ? (ui.vid == null ? -1 : ui.vid) : -1, function (i) { ctx.setUi({ vid: i }); }) : [];
      var n = (p.sessions || []).length;
      return { title: p.title, origin: p.source === 'cortesia' ? 'Cortesia do treinador' : 'Compra', originCls: 'badge ' + (p.source === 'cortesia' ? 'badge--info' : 'badge--plain'),
        sub: (p.trainer ? 'de ' + p.trainer + ' · ' : '') + (p.format === 'curso' ? 'curso em vídeo · ' : '') + (n ? U.plural(n, 'sessão', 'sessões') : (p.workouts ? U.plural(p.workouts, 'treino', 'treinos') : '')) + (p.weeks ? ' · ' + U.plural(p.weeks, 'semana', 'semanas') : ''),
        validity: 'Versão ' + (p.version || 1) + ' · acesso de ' + day(p.since) + ' a ' + day(p.until) + ' (12 meses a partir da liberação)',
        newer: p.latest && p.version && p.latest > p.version ? 'O treinador publicou a versão ' + p.latest + '. Você continua com a versão ' + p.version + ', a que recebeu.' : '', hasNewer: !!(p.latest && p.version && p.latest > p.version),
        goal: p.goal || '', hasGoal: !!p.goal, desc: p.description || '', hasDesc: !!p.description,
        notes: p.content || '', hasNotes: open && !!p.content,
        sessions: sessions, hasSessions: open && sessions.length > 0, noContent: open && !sessions.length && !p.content,
        open: open, toggle: function () { ctx.setUi({ open: open ? '' : key, vid: -1 }); }, toggleLabel: open ? 'Fechar' : 'Abrir programa' };
    });
    return {
      loading: ui.list === undefined, fail: ui.list === null, rows: rows, hasRows: rows.length > 0, empty: Array.isArray(ui.list) && !rows.length,
      reload: load, find: function () { GO('@home'); }, help: function () { GO('@publico', { s: 'ajuda' }); }
    };
  }
});
