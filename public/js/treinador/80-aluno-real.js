/* REL10 · Aluno real (vínculo no servidor). Diretrizes F2/F3: preparação depois do vínculo; o treinador revisa,
   monta a rotina manualmente, atribui uma versão; o aluno registra; nada de treino, adesão ou evolução inventados. */
REG.screen({
  page: 'treinador', key: 'alunoreal', id: 'REL10', title: 'Aluno', nav: 'alunos', back: 'H04', wide: true,
  vals: function (ctx) {
    var C = window.CONTA, ui = ctx.ui, lid = String(ctx.id || '').replace(/^lk_/, '');
    var L = (C ? C.cachedLinks() : []).filter(function (l) { return l.id === lid && l.mine === 'treinador'; })[0];
    if (!L) return { missing: true, has: false, back: function () { ctx.go('H04'); } };
    if (C && !ui.asked) {
      ctx.setUi({ asked: true });
      C.sessions(lid).then(function (r) { ctx.setUi({ sess: r.ok && Array.isArray(r.data) ? r.data : [], sessErr: !r.ok }); });
    }
    var refresh = function (msg) { return C.links().then(function () { if (window.__refreshLinks) window.__refreshLinks(); ctx.setUi({ busy: false }); if (msg) ctx.toast(msg); }); };
    var PREP = { awaiting_client: 'Aguardando o aluno responder a preparação', awaiting_review: 'Preparação respondida · revise antes de montar o treino', ready_to_assign: 'Preparação revisada · pronto para montar o treino', assigned: 'Treino atribuído' };
    var Q = { objetivo: 'Objetivo', dias: 'Dias por semana', local: 'Onde treina', limitacoes: 'Dores ou limitações' };
    var answers = Object.keys(L.answers || {}).map(function (k) { return { k: Q[k] || k, v: String(L.answers[k]) }; });

    // ---------- montar treino (rotina manual, uma sessão por vez) ----------
    var cat = (DB.exercicios || []).map(function (e) { return { id: e.id, name: e.name }; });
    var rows = ui.rows || (L.workout && L.workout.sessions[0] ? L.workout.sessions[0].items.map(function (it) { return { id: it.exerciseId, name: it.name, sets: String(it.sets), reps: it.reps, load: it.loadKg == null ? '' : String(it.loadKg), rest: String(it.restS) }; }) : [{ id: '', name: '', sets: '3', reps: '10', load: '', rest: '60' }]);
    var title = ui.title != null ? ui.title : (L.workout ? L.workout.title : 'Treino A');
    var upd = function (i, k) { return function (e) { var r = rows.map(function (x) { return Object.assign({}, x); }); r[i][k] = U.val(e); if (k === 'name') { var m = cat.filter(function (c) { return U.norm(c.name) === U.norm(r[i].name); })[0]; r[i].id = m ? m.id : ''; } ctx.setUi({ rows: r, err: '' }); }; };
    var valid = rows.filter(function (r) { return r.name.trim(); });
    var assign = function () {
      if (ui.busy) return;
      if (!title.trim()) return ctx.setUi({ err: 'Dê um nome ao treino.' });
      if (!valid.length) return ctx.setUi({ err: 'Inclua pelo menos um exercício.' });
      var bad = valid.filter(function (r) { var s = Number(r.sets); return !(s >= 1 && s <= 10) || !String(r.reps).trim(); })[0];
      if (bad) return ctx.setUi({ err: 'Séries de 1 a 10 e repetições preenchidas em todos os exercícios.' });
      var items = valid.map(function (r) { return { exerciseId: r.id || ('livre-' + U.norm(r.name).replace(/[^a-z0-9]+/g, '-')), name: r.name.trim(), sets: Number(r.sets), reps: String(r.reps).trim(), loadKg: r.load === '' ? null : Number(String(r.load).replace(',', '.')), restS: Number(r.rest) || 0, notes: null }; });
      var sessions = [{ id: 's1', title: title.trim(), goal: 'Prescrição do treinador', estMin: Math.max(10, Math.round(items.reduce(function (n, x) { return n + x.sets * (1 + x.restS / 60); }, 0))), items: items }];
      ctx.setUi({ busy: true, err: '' });
      C.assignWorkout(lid, title.trim(), sessions, L.workout ? L.workout.version : 0).then(function (r) {
        if (!r.ok) return ctx.setUi({ busy: false, err: r.offline ? 'Sem conexão: o treino não foi atribuído.' : 'O servidor não atribuiu: ' + (r.msg || ('erro ' + r.status)) });
        refresh('Treino atribuído a ' + String(L.studentName).split(' ')[0] + '. Ele vê no app a partir de agora.');
      });
    };
    var review = function () { if (ui.busy) return; ctx.setUi({ busy: true }); C.reviewPrep(lid).then(function (r) { if (!r.ok) return ctx.setUi({ busy: false, err: 'Não foi possível marcar: ' + (r.msg || r.status) }); refresh('Preparação revisada.'); }); };

    // ---------- registros do aluno (só confirmados no servidor) ----------
    var sess = (ui.sess || []).slice().sort(function (a, b) { return String(b.submitted_at || b.started_at).localeCompare(String(a.submitted_at || a.started_at)); });
    var logs = sess.map(function (s) {
      var sets = s.set_logs || [], vol = sets.reduce(function (n, x) { return n + (Number(x.reps) || 0) * (Number(x.load_kg) || 0); }, 0);
      var d = s.submitted_at || s.started_at;
      return { when: d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—', sets: U.plural(sets.length, 'série', 'séries'), vol: vol ? Math.round(vol).toLocaleString('pt-BR') + ' kg' : '—' };
    });
    var canBuild = L.prep === 'ready_to_assign' || L.prep === 'assigned' || !!L.workout;
    return {
      chat: window.CHAT ? window.CHAT(ctx, lid, 'treinador', String(L.studentName).split(' ')[0]) : {},
      missing: false, has: true, name: L.studentName, ini: U.ini(L.studentName), since: L.since ? 'Vínculo desde ' + new Date(L.since).toLocaleDateString('pt-BR') : '', origin: L.origin === 'convite' ? 'por convite' : 'por pedido',
      prepTxt: PREP[L.prep] || 'Preparação', hasAnswers: answers.length > 0, answers: answers, needReview: L.prep === 'awaiting_review', review: review,
      waitingClient: L.prep === 'awaiting_client' && !L.workout, canBuild: canBuild,
      hasWorkout: !!L.workout, wTitle: L.workout ? L.workout.title + ' · versão ' + L.workout.version : '', wWhen: L.workout && L.workout.assignedAt ? 'Atribuído em ' + new Date(L.workout.assignedAt).toLocaleDateString('pt-BR') : '',
      title: title, setTitle: function (e) { ctx.setUi({ title: U.val(e), err: '' }); },
      rows: rows.map(function (r, i) { return { n: String(i + 1), name: r.name, sets: r.sets, reps: r.reps, load: r.load, rest: r.rest, setName: upd(i, 'name'), setSets: upd(i, 'sets'), setReps: upd(i, 'reps'), setLoad: upd(i, 'load'), setRest: upd(i, 'rest'),
        rm: function () { var x = rows.slice(); x.splice(i, 1); ctx.setUi({ rows: x.length ? x : [{ id: '', name: '', sets: '3', reps: '10', load: '', rest: '60' }] }); }, idName: 'rx-n' + i, idSets: 'rx-s' + i, idReps: 'rx-r' + i, idLoad: 'rx-l' + i, idRest: 'rx-d' + i }; }),
      add: function () { ctx.setUi({ rows: rows.concat([{ id: '', name: '', sets: '3', reps: '10', load: '', rest: '60' }]) }); },
      catalog: cat.slice(0, 200), assign: assign, assignLabel: ui.busy ? 'Atribuindo…' : (L.workout ? 'Atribuir nova versão' : 'Atribuir treino'),
      err: ui.err || '', hasErr: !!ui.err,
      hasLogs: logs.length > 0, noLogs: !logs.length && !ui.sessErr, logs: logs, sessErr: !!ui.sessErr, logsCount: U.plural(logs.length, 'sessão registrada', 'sessões registradas'),
      back: function () { ctx.go('H04'); }
    };
  }
});
