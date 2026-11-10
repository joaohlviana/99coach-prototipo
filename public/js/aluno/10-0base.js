/* A1 · área da aluna Ana Carolina Souza (treinador Rafael Lima): dados próprios (a1_*) e utilidades
   comuns às telas 10-*. A aluna não tem nenhuma entrada de IA. */
(function () {
  var DB = window.DB;
  var t0 = Date.now();
  function st(r, l, at) { return { r: r || '', l: l || '', d: !!r, sync: !!r, at: at || '' }; }
  // treino em andamento (Treino A de hoje): exercício 2, série 2. Séries feitas já sincronizadas.
  DB.seed('a1_exec', {
    treino: 't1', status: 'andamento', startedAt: '07:40', startedTs: t0 - 38 * 60000, ex: 1, syncedAt: '08:14', edit: -1, rest: null,
    log: [
      [st('6', '72,5', '07:46'), st('6', '72,5', '07:50'), st('6', '72,5', '07:54'), st('6', '72,5', '07:58')],
      [st('5', '80', '08:14'), st(), st()],
      [st(), st(), st()]
    ]
  });
  // aviso que a próxima tela mostra (ex.: "Treino encerrado" ao voltar a Hoje)
  DB.seed('a1_flash', { t: '', x: '', k: 'ok' });
  // nota do treinador por sessão da rotina r1
  DB.seed('a1_notas', { s1: 'Subir 2,5 kg no agachamento se a última série ficar fácil.', s2: 'No supino, pare se o ombro doer e me avise pela mensagem.' });
  // rascunho do check-in semanal (formulário f2, v2): 2 de 5 respondidas, salvo hoje 10:42
  DB.seed('a1_checkin', { form: 'f2', version: 2, answers: { q1: '3', q2: '4' }, savedAt: '10:42', sentAt: '', due: 'qua 28/10' });
  // compromissos da Ana (agenda é diferente de treino executado)
  DB.seed('a1_agenda', [
    { id: 'g1', day: 'sex 30/10', time: '18:00', what: 'Chamada de revisão', kind: 'online', place: 'Videochamada · link no evento', with: 'Rafael Lima', status: 'confirmado', origin: 'Acompanhamento online', credit: 'chamada mensal incluída na mensalidade' },
    { id: 'g0', day: 'qui 01/10', time: '08:00', what: 'Avaliação física', kind: 'presencial', place: 'Box Centro · Londrina', with: 'Rafael Lima', status: 'realizado', origin: 'Acompanhamento online', credit: 'avaliação trimestral incluída' }
  ]);
  // progresso nos programas (por contratação), sempre com a versão do conteúdo
  var p1done = []; for (var i = 1; i <= 15; i++) p1done.push('c' + i);
  DB.seed('a1_progresso', {
    ct2: { version: 3, done: p1done, last: 'c16', at: '25/10 21:12', device: 'este celular' },
    ct3: { version: 2, done: ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7'], last: 'm8', at: '18/10 07:05', device: 'este celular' }
  });
  // correções de registros (trilha) e relação com o treinador
  DB.seed('a1_trilha', []);
  DB.seed('a1_relacao', { status: 'ativo', pauseUntil: '', caso: '', endAt: '' });

  function noop() {}
  var DAYS = [['SEG', 'seg 26/10', 'S'], ['TER', 'ter 27/10', 'T'], ['QUA', 'qua 28/10', 'Q'], ['QUI', 'qui 29/10', 'Q'], ['SEX', 'sex 30/10', 'S'], ['SÁB', 'sáb 31/10', 'S'], ['DOM', 'dom 01/11', 'D']];
  var A1 = {
    noop: noop,
    DAYS: DAYS,
    COACH_PHOTO: 'bdc7ef1c8dbf05558c3bf8d575fc3a04',
    ex: function (id) { return DB.find('exercicios', id) || { id: id, name: id, cues: [], media: 'sem', equip: '' }; },
    treino: function (id) { return DB.find('meusTreinos', id) || DB.find('meusTreinos', 't1') || DB.meusTreinos[0]; },
    sess: function (t) {
      var r = DB.find('rotinas', t.rotina) || { name: '', version: 1, sessions: [] };
      var s = r.sessions.filter(function (x) { return x.id === t.session; })[0] || { name: t.name, items: [] };
      return { r: r, s: s };
    },
    exec: function () { var e = DB.a1_exec; return e && e.status === 'andamento' ? e : null; },
    secs: function (rest) { return parseInt(rest, 10) || 0; },
    fmtRest: function (s) { if (!s) return 'sem descanso'; if (s % 60 === 0) return (s / 60) + ' min'; if (s > 60) return Math.floor(s / 60) + ' min ' + (s % 60) + ' s'; return s + ' s'; },
    num: function (load) { return String(load || '').replace(/\s*kg$/, ''); },
    isTime: function (reps) { return /s$/.test(String(reps || '')); },
    presc: function (it) { return it.sets + ' × ' + it.reps + (it.load ? ' · ' + it.load : ''); },
    // realizado: "6 × 72,5 kg" ou "40 s"
    real: function (s, it) { if (!s || !s.r) return ''; var r = String(s.r).replace(/\s*s$/, ''); return (A1.isTime(it.reps) ? r + ' s' : r) + (s.l ? ' × ' + s.l + ' kg' : ''); },
    mmss: function (s) { s = Math.max(0, Math.round(s)); return ('0' + Math.floor(s / 60)).slice(-2) + ':' + ('0' + (s % 60)).slice(-2); },
    kg: function (n) { return String(n).replace('.', ','); },
    // posição da retomada: primeira série não feita
    resume: function (e, items) {
      for (var i = 0; i < items.length; i++) { var lg = e.log[i] || []; for (var j = 0; j < items[i].sets; j++) if (!(lg[j] && lg[j].d)) return { ex: i, set: j }; }
      return { ex: items.length - 1, set: -1 };
    },
    unsynced: function (e) { var n = 0; if (!e) return 0; e.log.forEach(function (lg) { lg.forEach(function (s) { if (s.d && !s.sync) n++; }); }); return n; },
    saveLocal: function () { try { window.localStorage.setItem('a1-exec', JSON.stringify(DB.a1_exec)); return true; } catch (_) { return false; } },
    flash: function (t, x, k) { DB.a1_flash = { t: t, x: x || '', k: k || 'ok' }; },
    retry: function (ctx, msg) { return function () { ctx.set({ scn: '', toast: msg || 'Consultamos de novo: tudo atualizado.' }); }; },
    // estado da situação (ctx.scn) → aviso com ação de recuperação. map: { chave: { k, t, x, b, f, b2, f2 } }
    alert: function (ctx, map) {
      var d = map[ctx.scn];
      var o = { has: false, cls: 'alert', ic: 'ic ic--sm i-info', t: '', x: '', role: 'status', hasB: false, b: '', f: noop, hasB2: false, b2: '', f2: noop };
      if (!d) return o;
      var k = d.k || 'warn';
      o.has = true; o.cls = 'alert alert--' + k + ' a1-alert'; o.ic = 'ic ic--sm i-' + (k === 'ok' ? 'check' : (k === 'info' ? 'info' : 'alert'));
      o.role = k === 'risk' ? 'alert' : 'status'; o.t = d.t; o.x = d.x || '';
      if (d.b) { o.hasB = true; o.b = d.b; o.f = d.f || A1.retry(ctx); }
      if (d.b2) { o.hasB2 = true; o.b2 = d.b2; o.f2 = d.f2 || noop; }
      return o;
    },
    // aviso deixado por outra tela (fecha ao tocar em Ok)
    flashVals: function (ctx) {
      var f = DB.a1_flash || { t: '' };
      return { has: !!f.t, cls: 'alert alert--' + (f.k || 'ok') + ' a1-alert', t: f.t || '', x: f.x || '', close: function () { DB.a1_flash = { t: '', x: '', k: 'ok' }; ctx.refresh(); } };
    },
    me: function () { return DB.find('alunos', 'ana') || { name: 'Ana Carolina Souza', first: 'Ana', goal: '', since: '' }; },
    coachImg: function () { return (window.U && window.U.img(A1.COACH_PHOTO)) || ''; }
  };
  window.A1 = A1;
})();
