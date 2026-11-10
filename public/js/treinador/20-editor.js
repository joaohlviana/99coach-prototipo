/* TRE14 · Editor técnico de treino: sessões em abas, prescrição editável com validação de unidade, reordenar sem arrastar,
   salvar rascunho com versão, conflito com outro aparelho, histórico (TRE16), atribuição (TRE15) e assistência opcional (IA01) */
REG.screen({
  page: 'treinador', key: 'editor', id: 'TRE14', title: 'Editor de rotina', mtitle: 'Editor', nav: 'rotinas', back: 'H06', wide: true,
  testIds: ['r1', 'r4'],
  normal: 'Editando',
  scens: [['incerta', 'Unidade incerta'], ['salvo', 'Salvo'], ['outro', 'Editado em outro aparelho'], ['salvando', 'Salvando'],
    ['invalida', 'Unidade inválida'], ['conflito', 'Conflito em dois aparelhos'], ['ia', 'Proposta IA não aplicada']],
  vals: function (ctx) {
    var T = window.T3, ui = ctx.ui, scn = ctx.scn;
    var rid = ctx.id || 'r1', r = T.rot(rid);
    var set = function (o) { ctx.setUi(o); };
    if (!r) return { found: false, notFound: true, back: function () { GO('H06'); } };

    var draft = T.draft(rid), dirty = !!(draft && draft.dirty);
    var sessions = T.sessions(rid);
    var sid = ui.sess || ctx.p.sessao || r.lastSection || (sessions[0] || {}).id;
    var sess = sessions.find(function (s) { return s.id === sid; }) || sessions[0] || null;
    sid = sess ? sess.id : '';
    var sIdx = sessions.indexOf(sess);
    var meta = DB.t3_rotMeta[rid] || null;
    var stu = T.aluno(r.student);

    // situação desenhada: carga do 1º exercício com unidade incerta ou inválida, até o treinador corrigir
    var ovr = (scn === 'incerta' || scn === 'invalida') && !ui.scnDone && sess && sess.items.length ? (scn === 'incerta' ? '40' : '40 quilos') : null;

    // edita sempre o rascunho (preservado ao ir ao catálogo e voltar)
    var edit = function (fn, keepNt) {
      var d = T.ensureDraft(rid); if (!d) return;
      var s = d.sessions.find(function (x) { return x.id === sid; }) || d.sessions[0];
      fn(d, s); d.dirty = true; r.lastSection = s ? s.id : r.lastSection;
      set(keepNt ? {} : { nt: '' });
    };
    var loadOf = function (it, i) { return ovr !== null && i === 0 ? ovr : (it.load || ''); };

    // ---------- itens da sessão ----------
    var errCount = 0;
    sessions.forEach(function (s) {
      s.items.forEach(function (it, i) {
        var lo = s === sess ? loadOf(it, i) : (it.load || '');
        if (T.checkSets(it.sets) || T.checkReps(it.reps) || !T.checkLoad(lo).ok || T.checkRest(it.rest)) errCount++;
      });
    });
    var items = sess ? sess.items.map(function (it, i) {
      var ex = T.ex(it.ex), lo = loadOf(it, i);
      var eS = T.checkSets(it.sets), eR = T.checkReps(it.reps), cL = T.checkLoad(lo), eD = T.checkRest(it.rest);
      var setF = function (k) { return function (e) { var val = U.val(e); edit(function (d, s) { if (s.items[i]) s.items[i][k] = k === 'sets' ? (/^\d+$/.test(String(val).trim()) ? Number(String(val).trim()) : String(val)) : val; }); if (k === 'load' && ovr !== null && i === 0) set({ scnDone: true, nt: '' }); }; };
      var useUnit = function (u) { return function () { var n = String(lo).replace(/[^\d.,]/g, ''); edit(function (d, s) { if (s.items[i]) s.items[i].load = (n || '0') + ' ' + u; }); set({ scnDone: true, nt: '' }); }; };
      var key = sid + '-' + i;
      return {
        key: key, block: 'Bloco ' + T.letter(i), name: ex.name, meta: [ex.equip, ex.group].filter(Boolean).join(' · '),
        sets: String(it.sets), reps: it.reps || '', load: lo, rest: it.rest || '', note: it.note || '',
        setSets: setF('sets'), setReps: setF('reps'), setLoad: setF('load'), setRest: setF('rest'), setNote: setF('note'),
        eSets: eS, hasESets: !!eS, eReps: eR, hasEReps: !!eR, eLoad: cL.msg, hasELoad: !cL.ok, uncertain: cL.uncertain, eRest: eD, hasERest: !!eD,
        cSets: 'input' + (eS ? ' is-err' : ''), cReps: 'input' + (eR ? ' is-err' : ''), cLoad: 'input' + (cL.ok ? '' : ' is-err'), cRest: 'input' + (eD ? ' is-err' : ''),
        useKg: useUnit('kg'), useLb: useUnit('lb'),
        isFirst: i === 0, isLast: i === sess.items.length - 1, upOff: String(i === 0), downOff: String(i === sess.items.length - 1),
        upCls: 'btn btn--outline btn--sm t3-sq' + (i === 0 ? ' is-off' : ''), downCls: 'btn btn--outline btn--sm t3-sq' + (i === sess.items.length - 1 ? ' is-off' : ''),
        up: function () { if (i === 0) return; edit(function (d, s) { var a = s.items; var t = a[i - 1]; a[i - 1] = a[i]; a[i] = t; }); ctx.toast(ex.name + ' subiu para o bloco ' + T.letter(i - 1) + '.'); },
        down: function () { if (i >= sess.items.length - 1) return; edit(function (d, s) { var a = s.items; var t = a[i + 1]; a[i + 1] = a[i]; a[i] = t; }); ctx.toast(ex.name + ' desceu para o bloco ' + T.letter(i + 1) + '.'); },
        remove: function () { var removed = T.clone(it); edit(function (d, s) { s.items.splice(i, 1); }, true); set({ nt: 'removido', undo: { sid: sid, idx: i, item: removed, name: ex.name } }); },
        view: function () { GO('TRE11', { id: it.ex, rotina: rid, sessao: sid }); },
        presc: T.presc({ sets: it.sets, reps: it.reps, load: lo, rest: it.rest }), hasNote: !!it.note
      };
    }) : [];

    // ---------- abas de sessão ----------
    var tabs = sessions.map(function (s, i) {
      var on = s === sess;
      return { label: s.name, n: String(s.items.length), cls: 'utab' + (on ? ' is-on' : ''), on: String(on), sel: on ? 'true' : 'false',
        go: function () { r.lastSection = s.id; set({ sess: s.id, adj: false, nt: ui.nt === 'salvo' ? 'salvo' : '' }); } };
    });
    var addSession = function () {
      var id = 's' + (Date.now ? String(Date.now()).slice(-5) : DB.uid(''));
      edit(function (d) { d.sessions.push({ id: id, name: 'Sessão ' + T.letter(d.sessions.length), items: [] }); });
      r.lastSection = id; set({ sess: id, nt: '' });
    };
    var dupSession = function () {
      if (!sess) return;
      var id = 's' + DB.uid('').slice(-5);
      var nm = sess.name + ' (cópia)';
      edit(function (d, s) { d.sessions.push({ id: id, name: nm, items: T.clone(s.items) }); });
      r.lastSection = id; set({ sess: id, nt: 'dupsess', ntText: '“' + nm + '” criada no rascunho com os mesmos exercícios.' });
    };
    var delSession = function () {
      if (!sess || sessions.length < 2) return;
      var nm = sess.name;
      ctx.ask({ title: 'Remover “' + nm + '” do rascunho?', text: 'A sessão sai só deste rascunho. Versões salvas e treinos já feitos pelos alunos não mudam.', ok: 'Remover sessão', danger: true,
        onOk: function () { edit(function (d) { d.sessions = d.sessions.filter(function (x) { return x.id !== sid; }); }); set({ sess: '', nt: '' }); } });
    };

    // ---------- ajuste de carga com prévia ----------
    var pct = ui.pct !== undefined ? ui.pct : 2.5;
    var adjust = function (load) {
      var n = T.num(load); if (!n) return '';
      var v = Math.round(n * (1 + pct / 100) * 2) / 2;
      return T.fmtNum(v) + ' ' + T.unit(load);
    };
    var adjLines = sess ? sess.items.map(function (it, i) { var a = adjust(loadOf(it, i)); return a ? { text: T.ex(it.ex).name + ': ' + loadOf(it, i) + ' → ' + a } : null; }).filter(Boolean) : [];
    var pcts = [[2.5, '+2,5%'], [5, '+5%'], [-5, '−5%']].map(function (p) { var on = pct === p[0]; return { label: p[1], cls: 'chip' + (on ? ' is-on' : ''), on: String(on), pick: function () { set({ pct: p[0], adj: true }); } }; });

    // ---------- salvar ----------
    var conflictPending = !!DB.t3_conflitos[rid];
    var save = function () {
      if (scn === 'salvando') { ctx.toast('Ainda salvando. Aguarde a confirmação.'); return; }
      if (conflictPending) { set({ nt: 'pendente' }); return; }
      if (errCount) { set({ nt: 'erros' }); return; }
      if (!dirty) { set({ nt: 'nada' }); return; }
      var v = T.commit(rid, T.sessions(rid), String(ui.reason || '').trim() || 'Ajustes no editor');
      set({ nt: 'salvo', reason: '', savedV: v });
    };
    var toConflict = function () { DB.t3_conflitos[rid] = T.makeConflict(rid); GO('TRE16', { id: rid }); };
    var discard = function () {
      ctx.ask({ title: 'Descartar alterações não salvas?', text: 'O rascunho volta para a v' + r.version + ' salva em ' + r.savedAt + '. As versões salvas continuam no histórico.', ok: 'Descartar alterações', danger: true,
        onOk: function () { delete DB.t3_drafts[rid]; set({ nt: '', scnDone: true }); } });
    };

    // ---------- aviso ----------
    var nt = ui.nt !== undefined ? ui.nt : ({ incerta: 'incerta', salvo: 'salvo', outro: 'outro', salvando: 'salvando', invalida: 'invalida', conflito: 'conflito', ia: 'ia' }[scn] || (ctx.p.added ? 'added' : (ctx.p.nova ? 'nova' : (ctx.p.revisada ? 'revisada' : (conflictPending ? 'pendente' : '')))));
    var firstEx = sess && sess.items[0] ? T.ex(sess.items[0].ex).name : 'o primeiro exercício';
    var notice = T.none();
    var assignTxt = meta && stu ? ' A v' + meta.assigned + ' continua com ' + stu.first + ' até você revisar a atribuição.' : '';
    if (nt === 'salvo') notice = T.notice('ok', 'check', 'Salvo', 'Rascunho v' + r.version + ' salvo em ' + r.savedAt + '.' + assignTxt + ' Sessões concluídas não mudam.', [stu ? ['Revisar atribuição', function () { GO('TRE15', { id: r.student, rotina: rid }); }] : null, ['Ver histórico', function () { GO('TRE16', { id: rid }); }]]);
    if (nt === 'incerta') notice = T.notice('warn', 'alert', 'Unidade incerta', 'A carga de ' + firstEx + ' está como “40”. Confirme kg ou lb antes de salvar.', [['Usar kg', items[0] ? items[0].useKg : null], ['Usar lb', items[0] ? items[0].useLb : null]].filter(function (a) { return a[1]; }));
    if (nt === 'invalida') notice = T.notice('risk', 'alert', 'Unidade inválida', 'A carga de ' + firstEx + ' não tem unidade reconhecida. Corrija para salvar; o resto do rascunho continua aqui.', [['Corrigir', function () { try { var el = document.getElementById('t3-e-' + sid + '-0-load'); if (el) el.focus(); } catch (_) {} }]]);
    if (nt === 'outro') notice = T.notice('risk', 'swap', 'Editado em outro aparelho', 'Notebook · 10:40 alterou as séries de ' + firstEx.toLowerCase() + '. Nada foi sobrescrito: compare e escolha no histórico.', [['Comparar', toConflict]]);
    if (nt === 'conflito') notice = T.notice('risk', 'swap', 'Conflito em dois aparelhos', 'Este aparelho e o notebook salvaram mudanças diferentes na mesma sessão. Revise antes de salvar; nenhuma edição some.', [['Revisar', toConflict]]);
    if (nt === 'pendente') notice = T.notice('risk', 'swap', 'Conflito pendente', 'Há uma mudança do notebook esperando sua escolha. Resolva no histórico antes de salvar.', [['Revisar', function () { GO('TRE16', { id: rid }); }]]);
    if (nt === 'salvando') notice = T.notice('info', 'refresh', 'Salvando', 'Gravando o rascunho v' + (r.version + 1) + '. Suas mudanças ficam neste aparelho até a confirmação.', [], true);
    if (nt === 'ia') notice = T.notice('info', 'sparkle', 'Proposta IA não aplicada', 'A assistência sugeriu progressão de carga para esta sessão. Nada mudou na rotina: você revisa e aplica cada sugestão.', [['Saiba por quê', function () {
      ctx.ask({ title: 'Por que a proposta não foi aplicada?', text: 'Sugestões da assistência de IA nunca mudam a rotina sozinhas. Você decide o que aplicar, uma mudança por vez, e a versão salva registra quem aprovou.', lines: ['Usar a assistência é opcional.', 'Sem ela, o editor continua completo.'], ok: 'Entendi', cancel: false });
    }], ['Abrir assistência', function () { GO('IA01', { rotina: rid, sessao: sid }); }]]);
    if (nt === 'erros') notice = T.notice('risk', 'alert', 'Corrija ' + U.plural(errCount, 'exercício', 'exercícios') + ' para salvar', 'Os campos marcados precisam de número e unidade. O que você digitou continua aqui.');
    if (nt === 'nada') notice = T.notice('info', 'info', 'Nada mudou desde a v' + r.version, 'Edite séries, cargas ou exercícios; o botão salva uma nova versão.');
    if (nt === 'added') notice = T.notice('ok', 'check', U.plural(Number(ctx.p.added) || 1, 'exercício adicionado', 'exercícios adicionados'), 'No fim de “' + (sess ? sess.name : 'sessão') + '”. Ajuste séries e cargas e salve o rascunho.');
    if (nt === 'nova') notice = T.notice('info', 'info', 'Rotina criada como rascunho', 'Dê um nome, adicione exercícios e salve. Nada é atribuído sem sua revisão.');
    if (nt === 'revisada') notice = T.notice('ok', 'check', 'Versão revisada salva', 'v' + r.version + ' gravada com as escolhas do conflito. A outra versão continua no histórico.');
    if (nt === 'dupsess') notice = T.notice('ok', 'check', 'Sessão duplicada', ui.ntText || '');
    if (nt === 'removido' && ui.undo) notice = T.notice('ok', 'check', ui.undo.name + ' removido do rascunho', 'Só muda depois que você salvar.', [['Desfazer', function () {
      var u = ui.undo; edit(function (d) { var s = d.sessions.find(function (x) { return x.id === u.sid; }); if (s) s.items.splice(Math.min(u.idx, s.items.length), 0, u.item); }); set({ nt: '', undo: null });
    }]]);

    var stTxt = r.status === 'atribuída' ? 'Atribuída' : r.status === 'modelo' ? 'Modelo' : 'Rascunho';
    var sub = (dirty ? 'Alterações não salvas · base v' + r.version : 'v' + r.version + ' · salva ' + r.savedAt) + (meta && stu ? ' · v' + meta.assigned + ' atribuída a ' + stu.first : (r.status === 'modelo' ? ' · modelo sem alunos' : ''));
    var saving = scn === 'salvando';
    var pastas = DB.pastas.map(function (p) { var on = r.folder === p.id; return { name: p.name, cls: 'chip' + (on ? ' is-on' : ''), on: String(on), pick: function () { r.folder = p.id; ctx.toast('Rotina em ' + p.name + '.'); } }; });
    var preview = !!ui.preview;

    // rascunho criado pela assistência como nova versão de outra rotina (campos basedOn / aiRef)
    var baseR = r.basedOn ? T.rot(r.basedOn) : null;
    var baseDiff = baseR ? T.diff(baseR.sessions, sessions).length : 0;
    var originTxt = baseR ? 'Rascunho de nova versão de “' + baseR.name + '” (v' + baseR.version + ' · ' + U.plural(baseDiff, 'diferença', 'diferenças') + ').' : '';
    if (r.aiRef) originTxt += (originTxt ? ' ' : '') + 'Criado a partir de sugestões da assistência que você aprovou · ' + r.aiRef + '. Revise antes de salvar ou atribuir.';
    return {
      hasOrigin: !!originTxt, originTxt: originTxt, hasBase: !!baseR, openBase: function () { if (baseR) GO('TRE14', { id: baseR.id }); },
      found: true, notFound: false, back: function () { GO('H06'); },
      sub: sub, status: stTxt, stCls: r.status === 'atribuída' ? 'badge badge--ok' : r.status === 'modelo' ? 'badge badge--plain' : 'badge badge--warn',
      nameVal: r.name, title: String(r.name).trim() || 'Rotina sem nome', nameErr: String(r.name).trim() ? '' : 'Dê um nome à rotina.', hasNameErr: !String(r.name).trim(),
      setName: function (e) { r.name = String(U.val(e)); ctx.refresh(); },
      nt: notice, saving: saving, notSaving: !saving,
      tabs: tabs, addSession: addSession, dupSession: dupSession, canDelSession: sessions.length > 1, delSession: delSession,
      hasSess: !!sess, noSess: !sess, sessName: sess ? sess.name : '', sessKey: sid,
      setSessName: function (e) { var v = U.val(e); edit(function (d, s) { if (s) s.name = v; }, true); },
      items: items, hasItems: items.length > 0, noItems: !!sess && !items.length,
      addEx: function () { GO('TRE10', { rotina: rid, sessao: sid }); },
      editMode: !preview, preview: preview, editCls: 'seg__it' + (preview ? '' : ' is-on'), prevCls: 'seg__it' + (preview ? ' is-on' : ''), editOn: String(!preview), prevOn: String(preview),
      toEdit: function () { set({ preview: false }); }, toPreview: function () { set({ preview: true }); },
      prevItems: items.map(function (it) { return { name: it.name, presc: it.presc, note: it.note, hasNote: it.hasNote }; }), prevTitle: sess ? sess.name : '',
      adjOpen: !!ui.adj, toggleAdj: function () { set({ adj: !ui.adj }); }, pcts: pcts, adjLines: adjLines, hasAdj: adjLines.length > 0, noAdj: !adjLines.length,
      adjScope: 'Só “' + (sess ? sess.name : 'esta sessão') + '” deste rascunho. Sessões concluídas pelos alunos não mudam.',
      applyAdj: function () {
        if (!adjLines.length) return;
        edit(function (d, s) { s.items.forEach(function (it) { var a = adjust(it.load); if (a) it.load = a; }); }, true);
        set({ adj: false, nt: '' }); ctx.toast('Ajuste aplicado ao rascunho de ' + (sess ? sess.name : 'sessão') + '. Salve para criar a versão.');
      },
      reason: ui.reason || '', setReason: function (e) { set({ reason: U.val(e) }); },
      save: save, dirty: dirty, canDiscard: dirty, discard: discard,
      saveLabel: saving ? 'Salvando…' : 'Salvar rascunho', saveCls: 'btn btn--primary btn--lg btn--block' + (saving ? ' is-off' : ''),
      hist: function () { GO('TRE16', { id: rid }); },
      assign: function () { GO('TRE15', { id: r.student || '', rotina: rid }); }, assignTitle: stu ? 'Revisar antes de atribuir' : 'Atribuir a um aluno',
      assignText: stu ? stu.first + ' está com a v' + (meta ? meta.assigned : r.version) + '. Uma nova versão só chega depois que você revisar semana e início.' : 'Escolha aluno, semana e início. Você revisa antes de confirmar.',
      ia: function () { GO('IA01', { rotina: rid, sessao: sid }); },
      pastas: pastas, verCount: U.plural(T.versions(rid).length, 'versão', 'versões'),
      errCount: errCount
    };
  }
});
