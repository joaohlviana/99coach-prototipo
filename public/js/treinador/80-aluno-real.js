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
      C.sessions(lid).then(function (r) { ctx.setUi({ sess: r.ok && Array.isArray(r.data) ? r.data.filter(function (x) { return !!x.submitted_at; }) : [], sessErr: !r.ok }); });
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
    // rotinas criadas em Conteúdo: o treinador escolhe uma e o aluno recebe uma cópia desta versão
    var rots = (DB.rotinas || []).filter(function (r) { return r && (r.sessions || []).some(function (x) { return (x.items || []).length; }); });
    if (ui.rid == null && window.__rotinaPick) { var pk = window.__rotinaPick; window.__rotinaPick = ''; if (rots.some(function (r) { return r.id === pk; })) { ui.rid = pk; setTimeout(function () { ctx.setUi({ rid: pk }); }, 0); } }
    var rot = ui.rid ? rots.filter(function (r) { return r.id === ui.rid; })[0] : null;
    var exName = function (id) { var e = (DB.exercicios || []).filter(function (x) { return x.id === id; })[0]; return e ? e.name : String(id || 'Exercício'); };
    var num = function (v) { var m = String(v == null ? '' : v).replace(',', '.').match(/[0-9]+(\.[0-9]+)?/); return m ? Number(m[0]) : null; };
    var rotSessions = function () {
      return rot.sessions.filter(function (x) { return (x.items || []).length; }).map(function (x, i) {
        var items = x.items.map(function (it) { var nm = it.name || exName(it.ex); return { exerciseId: it.ex || ('livre-' + U.norm(nm).replace(/[^a-z0-9]+/g, '-')), name: nm, sets: Math.min(10, Math.max(1, Number(it.sets) || 1)), reps: String(it.reps || '').trim() || '1', loadKg: num(it.load), restS: num(it.rest) || 0, notes: it.note || it.notes || null }; });
        return { id: 's' + (i + 1), title: x.name || ('Sessão ' + (i + 1)), goal: 'Prescrição do treinador', estMin: Math.max(10, Math.round(items.reduce(function (n, y) { return n + y.sets * (1 + y.restS / 60); }, 0))), items: items };
      });
    };
    var assign = function () {
      if (ui.busy) return;
      if (rot) {
        var rs = rotSessions();
        ctx.setUi({ busy: true, err: '' });
        return C.assignWorkout(lid, rot.name, rs, L.workout ? L.workout.version : 0).then(function (r) {
          if (!r.ok) return ctx.setUi({ busy: false, err: r.offline ? 'Sem conexão: o treino não foi atribuído.' : 'O servidor não atribuiu: ' + (r.msg || ('erro ' + r.status)) });
          rot.status = 'atribuída'; if (window.STORE) window.STORE.saveDb();
          refresh('Rotina “' + rot.name + '” atribuída a ' + String(L.studentName).split(' ')[0] + '. Ele vê no app a partir de agora.');
        });
      }
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
      var cm = (s.session_comments || []).slice().sort(function (a, b) { return String(a.created_at).localeCompare(String(b.created_at)); });
      var open = ui.cmOpen === s.id;
      var post = function () {
        var body = String(ui.cmDraft || '').trim();
        if (body.length < 2) return ctx.setUi({ cmErr: 'Escreva o comentário.' });
        if (ui.cmBusy) return; ctx.setUi({ cmBusy: true, cmErr: '' });
        C.rpc('comment_session', { p_session: s.id, p_body: body.slice(0, 2000), p_idem: 'cm:' + s.id + ':' + body.length + ':' + body.slice(0, 12) }).then(function (r) {
          if (!r.ok) return ctx.setUi({ cmBusy: false, cmErr: 'Não enviado: ' + (r.msg || r.status || 'sem conexão') + '. O texto continua no campo.' });
          ctx.setUi({ cmBusy: false, cmOpen: '', cmDraft: '' }); ctx.toast('Comentário enviado. ' + String(L.studentName).split(' ')[0] + ' vê no registro do treino.');
          C.sessions(lid).then(function (r2) { if (r2.ok) ctx.setUi({ sess: (r2.data || []).filter(function (x) { return !!x.submitted_at; }) }); });
        });
      };
      return { when: d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—', sets: U.plural(sets.length, 'série', 'séries'), vol: vol ? Math.round(vol).toLocaleString('pt-BR') + ' kg' : '—',
        cms: cm.map(function (c) { return { who: c.side === 'treinador' ? 'Você' : String(L.studentName).split(' ')[0], body: c.body }; }), hasCms: cm.length > 0,
        canAdj: !!L.workout && L.status === 'ativo', adjust: function () {
          // parte da prescrição atual; mostra ao lado o que o aluno fez neste registro
          var done = {}; sets.forEach(function (x) { var k = x.exercise_id || x.exercise_name; var b = done[k]; if (!b || (Number(x.load_kg) || 0) > (Number(b.load_kg) || 0)) done[k] = x; });
          var rows = []; (L.workout.sessions || []).forEach(function (ss, si) { (ss.items || []).forEach(function (it, ii) { var d0 = done[it.exerciseId] || done[it.name];
            rows.push({ si: si, ii: ii, sess: ss.title, name: it.name, sets: String(it.sets), reps: String(it.reps), load: it.loadKg == null ? '' : String(it.loadKg).replace('.', ','), did: d0 ? d0.reps + ' rep' + (d0.load_kg != null ? ' × ' + String(d0.load_kg).replace('.', ',') + ' kg' : '') : 'não registrado' }); }); });
          ctx.setUi({ adj: s.id, adjWhen: d, adjRows: rows, adjNote: '', adjErr: '' });
        },
        open: open, toggle: function () { ctx.setUi({ cmOpen: open ? '' : s.id, cmDraft: '', cmErr: '' }); }, toggleLabel: open ? 'Cancelar' : 'Comentar',
        idIn: 'cm-' + s.id, draft: open ? (ui.cmDraft || '') : '', setDraft: function (e) { ctx.setUi({ cmDraft: U.val(e), cmErr: '' }); }, post: post, postLabel: ui.cmBusy ? 'Enviando…' : 'Enviar comentário', err: open ? (ui.cmErr || '') : '', hasErr: open && !!ui.cmErr };
    });
    var canBuild = L.prep === 'ready_to_assign' || L.prep === 'assigned' || !!L.workout;
    return {
      chat: window.CHAT ? window.CHAT(ctx, lid, 'treinador', String(L.studentName).split(' ')[0]) : {},
      linkTxt: L.status === 'pausado' ? 'Pausado: o vínculo continua ocupando a vaga; sessões novas não começam e o que já foi feito fica.' : 'Ativo. Pausar mantém a vaga e o histórico; encerrar é definitivo e nada é apagado.',
      isActive: L.status === 'ativo', isPaused: L.status === 'pausado',
      chOpen: !!ui.ch, chClosed: !ui.ch,
      reasons: (ui.ch === 'encerrar' ? [['objetivo_concluido', 'Objetivo concluído'], ['agenda', 'Agenda'], ['financeiro', 'Financeiro'], ['mudanca', 'Mudança'], ['insatisfacao', 'Insatisfação'], ['outro', 'Outro']] : [['ferias', 'Férias'], ['lesao', 'Lesão'], ['agenda', 'Agenda'], ['financeiro', 'Financeiro'], ['outro', 'Outro']]).map(function (r) { var on = ui.reason === r[0]; return { label: r[1], cls: 'seg__it' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ reason: r[0] }); } }; }),
      openPause: function () { ctx.setUi({ ch: 'pausar', reason: 'ferias' }); }, openEnd: function () { ctx.setUi({ ch: 'encerrar', reason: 'objetivo_concluido' }); }, chCancel: function () { ctx.setUi({ ch: '' }); },
      chLabel: ui.busy ? 'Salvando…' : (ui.ch === 'encerrar' ? 'Encerrar vínculo' : 'Pausar vínculo'),
      chConfirm: function () { if (ui.busy) return; ctx.setUi({ busy: true }); C.changeLink(lid, ui.ch, ui.reason).then(function (r) { if (!r.ok) { ctx.setUi({ busy: false }); return ctx.toast('O servidor não registrou: ' + (r.msg || r.status)); } var end = ui.ch === 'encerrar'; ctx.setUi({ ch: '' }); refresh(end ? 'Vínculo encerrado. O histórico continua disponível para os dois.' : 'Vínculo pausado.').then(function () { if (end) { DB.alunos = DB.alunos.filter(function (a) { return a.id !== 'lk_' + lid; }); ctx.go('H04'); } }); }); },
      resume: function () { if (ui.busy) return; ctx.setUi({ busy: true }); C.changeLink(lid, 'retomar', 'outro').then(function (r) { if (!r.ok) { ctx.setUi({ busy: false }); return ctx.toast('O servidor não registrou: ' + (r.msg || r.status)); } refresh('Vínculo retomado.'); }); },
      missing: false, has: true, name: L.studentName, ini: U.ini(L.studentName), since: L.since ? 'Vínculo desde ' + new Date(L.since).toLocaleDateString('pt-BR') : '', origin: L.origin === 'convite' ? 'por convite' : 'por pedido',
      prepTxt: PREP[L.prep] || 'Preparação', hasAnswers: answers.length > 0, answers: answers, needReview: L.prep === 'awaiting_review', review: review,
      waitingClient: L.prep === 'awaiting_client' && !L.workout, canBuild: canBuild,
      hasWorkout: !!L.workout, wTitle: L.workout ? L.workout.title + ' · versão ' + L.workout.version : '', wWhen: L.workout && L.workout.assignedAt ? 'Atribuído em ' + new Date(L.workout.assignedAt).toLocaleDateString('pt-BR') : '',
      hasRots: rots.length > 0, noRots: !rots.length, usingRot: !!rot, manual: !rot,
      rotOpts: [{ label: 'Montar à mão', on: String(!rot), cls: 'chip' + (!rot ? ' is-on' : ''), pick: function () { ctx.setUi({ rid: '', err: '' }); } }].concat(rots.map(function (r) { var on = !!rot && rot.id === r.id; return { label: r.name, on: String(on), cls: 'chip' + (on ? ' is-on' : ''), pick: function () { ctx.setUi({ rid: r.id, err: '' }); } }; })),
      rotName: rot ? rot.name : '', rotSum: rot ? U.plural(rotSessions().length, 'sessão', 'sessões') + ' · ' + U.plural(rotSessions().reduce(function (n, x) { return n + x.items.length; }, 0), 'exercício', 'exercícios') + (rot.version ? ' · versão ' + rot.version + ' da rotina' : '') : '',
      rotSess: rot ? rotSessions().map(function (x, i) { return { n: String(i + 1), name: x.title, items: x.items.map(function (y) { return y.name + ' ' + y.sets + '×' + y.reps + (y.loadKg != null ? ' · ' + String(y.loadKg).replace('.', ',') + ' kg' : ''); }).join(' · ') }; }) : [],
      goRots: function () { ctx.go('H06'); }, editRot: function () { if (rot) ctx.go('TRE14', { id: rot.id }); },
      title: title, setTitle: function (e) { ctx.setUi({ title: U.val(e), err: '' }); },
      rows: rows.map(function (r, i) { return { n: String(i + 1), name: r.name, sets: r.sets, reps: r.reps, load: r.load, rest: r.rest, setName: upd(i, 'name'), setSets: upd(i, 'sets'), setReps: upd(i, 'reps'), setLoad: upd(i, 'load'), setRest: upd(i, 'rest'),
        rm: function () { var x = rows.slice(); x.splice(i, 1); ctx.setUi({ rows: x.length ? x : [{ id: '', name: '', sets: '3', reps: '10', load: '', rest: '60' }] }); }, idName: 'rx-n' + i, idSets: 'rx-s' + i, idReps: 'rx-r' + i, idLoad: 'rx-l' + i, idRest: 'rx-d' + i }; }),
      add: function () { ctx.setUi({ rows: rows.concat([{ id: '', name: '', sets: '3', reps: '10', load: '', rest: '60' }]) }); },
      catalog: cat.slice(0, 200), assign: assign, assignLabel: ui.busy ? 'Atribuindo…' : (rot ? 'Atribuir esta rotina' : (L.workout ? 'Atribuir nova versão' : 'Atribuir treino')),
      err: ui.err || '', hasErr: !!ui.err,
      adjOpen: !!ui.adj, adjTitle: ui.adj ? 'Ajustar o treino a partir do registro de ' + new Date(ui.adjWhen).toLocaleDateString('pt-BR') : '',
      adjRows: (ui.adjRows || []).map(function (r, i) {
        var upd = function (k) { return function (e) { var rs = ui.adjRows.slice(); rs[i] = Object.assign({}, rs[i]); rs[i][k] = U.val(e); ctx.setUi({ adjRows: rs, adjErr: '' }); }; };
        return { sess: r.sess, name: r.name, did: r.did, sets: r.sets, reps: r.reps, load: r.load, idS: 'adj-s' + i, idR: 'adj-r' + i, idL: 'adj-l' + i, setSets: upd('sets'), setReps: upd('reps'), setLoad: upd('load') };
      }),
      adjNote: ui.adjNote || '', setAdjNote: function (e) { ctx.setUi({ adjNote: U.val(e), adjErr: '' }); }, adjErr: ui.adjErr || '', hasAdjErr: !!ui.adjErr,
      adjCancel: function () { ctx.setUi({ adj: null }); }, adjLabel: ui.adjBusy ? 'Salvando…' : 'Salvar nova versão do treino',
      adjSave: function () {
        var note = String(ui.adjNote || '').trim();
        if (note.length < 3) return ctx.setUi({ adjErr: 'Escreva o motivo do ajuste: o aluno vê esse texto na nova versão.' });
        var bad = (ui.adjRows || []).filter(function (r) { var n = parseInt(r.sets, 10); return !(n >= 1 && n <= 20) || !String(r.reps).trim() || (String(r.load).trim() && isNaN(parseFloat(String(r.load).replace(',', '.')))); })[0];
        if (bad) return ctx.setUi({ adjErr: 'Confira ' + bad.name + ': séries de 1 a 20, repetições preenchidas e carga em número.' });
        var ss = JSON.parse(JSON.stringify(L.workout.sessions || []));
        (ui.adjRows || []).forEach(function (r) { var it = ss[r.si].items[r.ii]; it.sets = parseInt(r.sets, 10); it.reps = String(r.reps).trim(); it.loadKg = String(r.load).trim() ? Math.round(parseFloat(String(r.load).replace(',', '.')) * 100) / 100 : null; });
        if (ui.adjBusy) return; ctx.setUi({ adjBusy: true, adjErr: '' });
        C.rpc('adjust_workout_from_session', { p_session: ui.adj, p_sessions: ss, p_note: note, p_idem: 'adj:' + ui.adj + ':' + (L.workout.version || 0) }).then(function (r) {
          if (!r.ok) return ctx.setUi({ adjBusy: false, adjErr: /motivo_obrigatorio/.test(r.msg || '') ? 'Escreva o motivo do ajuste.' : 'Não salvo: ' + (r.msg || r.status || 'sem conexão') + '. Nada mudou no treino.' });
          var v = (r.data && (r.data.version || (r.data[0] && r.data[0].version))) || '';
          ctx.setUi({ adjBusy: false, adj: null }); refresh('Treino ajustado' + (v ? ': versão ' + v : '') + '. ' + String(L.studentName).split(' ')[0] + ' vê a nova versão e o motivo.');
        });
      },
      hasLogs: logs.length > 0, noLogs: !logs.length && !ui.sessErr, logs: logs, sessErr: !!ui.sessErr, logsCount: U.plural(logs.length, 'sessão registrada', 'sessões registradas'),
      back: function () { ctx.go('H04'); }
    };
  }
});
