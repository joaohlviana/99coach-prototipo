/* TRE16 · Histórico, diferenças e conflito: versões com autor/data/motivo, comparar duas versões, restaurar com confirmação
   (cria nova versão) e resolver conflito entre dois aparelhos sem perder nenhuma edição */
REG.screen({
  page: 'treinador', key: 'historico', id: 'TRE16', title: 'Histórico de versões', mtitle: 'Versões', nav: 'rotinas', back: 'TRE14',
  backParams: function (ctx) { return { id: ctx.id || 'r1' }; },
  testIds: ['r1', 'r3'],
  normal: 'Versões e diferenças',
  scens: [['conflito', 'Conflito'], ['restaurado', 'Restaurado'], ['falhou', 'Falhou'], ['carregando', 'Histórico carregando'], ['nenhuma', 'Nenhuma alteração'],
    ['atual', 'Conflito atual'], ['permissao', 'Permissão alterada'], ['salvfalhou', 'Salvamento falhou'], ['desconhecida', 'Confirmação desconhecida']],
  vals: function (ctx) {
    var T = window.T3, ui = ctx.ui, scn = ctx.scn;
    var rid = ctx.id || 'r1', r = T.rot(rid);
    var set = function (o) { ctx.setUi(o); };
    if (!r) return { found: false, notFound: true, back: function () { GO('H06'); } };
    var vers = T.versions(rid);
    var cur = r.version, meta = DB.t3_rotMeta[rid] || null, stu = T.aluno(r.student);
    var loading = scn === 'carregando' && !ui.loaded;
    var byV = function (n) { return vers.find(function (x) { return x.v === n; }) || null; };
    var last = vers[vers.length - 1];
    var bV = ui.b !== undefined ? ui.b : (scn === 'nenhuma' ? last.v : last.v);
    var aV = ui.a !== undefined ? ui.a : (scn === 'nenhuma' ? last.v : (vers.length > 1 ? vers[vers.length - 2].v : last.v));
    var A = byV(aV) || last, B = byV(bV) || last;
    var lines = A === B ? [] : T.diff(A.snap, B.snap);
    var diffs = lines.map(function (l) { return { text: l.text, cls: 't3-diff t3-diff--' + l.kind, tag: l.kind === 'add' ? 'Incluído' : l.kind === 'del' ? 'Removido' : 'Alterado' }; });

    // ---------- restaurar ----------
    var restore = function (ver) {
      ctx.ask({ title: 'Restaurar a v' + ver.v + '?', text: 'Cria a v' + (r.version + 1) + ' com o conteúdo da v' + ver.v + '. A v' + r.version + ' continua no histórico.',
        lines: [stu && meta ? stu.first + ' continua com a v' + meta.assigned + ' até você revisar a atribuição.' : 'Nenhum aluno recebe nada automaticamente.', T.draft(rid) && T.draft(rid).dirty ? 'Alterações não salvas do editor serão substituídas pela versão restaurada.' : 'Sessões já concluídas pelos alunos não mudam.'],
        ok: 'Restaurar como v' + (r.version + 1),
        onOk: function () { var nv = T.commit(rid, ver.snap, 'Restaurada da v' + ver.v); set({ nt: 'restaurado', rv: ver.v, a: cur, b: nv }); } });
    };
    var rows = vers.slice().reverse().map(function (x) {
      var isCur = x.v === cur;
      return { v: 'v' + x.v, author: x.author, date: x.date, reason: x.reason || '—', isCur: isCur, notCur: !isCur,
        isAssigned: !!(meta && meta.assigned === x.v && stu), assignedTxt: stu ? 'com ' + stu.first : '',
        restore: function () { restore(x); }, label: 'Restaurar v' + x.v,
        cmp: function () { set({ a: x.v, b: cur }); } };
    });
    var pickRow = function (k, sel) { return vers.map(function (x) { var on = sel === x.v; return { label: 'v' + x.v, cls: 'chip' + (on ? ' is-on' : ''), on: String(on), pick: function () { var o = {}; o[k] = x.v; set(o); } }; }); };

    // ---------- conflito ----------
    var conflictScn = ['conflito', 'atual', 'permissao', 'salvfalhou', 'desconhecida', 'falhou'].indexOf(scn) >= 0 && !ui.resolved;
    var conflict = DB.t3_conflitos[rid] || (conflictScn ? T.makeConflict(rid) : null);
    var hidden = scn === 'permissao';
    var choice = ui.choice || {};
    var shortP = function (p) { return p.sets + ' × ' + p.reps + (p.load ? ' · ' + p.load : ''); };
    var changes = conflict ? conflict.changes.map(function (c, i) {
      var pick = function (k) { return function () { var o = Object.assign({}, choice); o[i] = k; set({ choice: o, nt: '' }); }; };
      var m = choice[i] === 'mine', o = choice[i] === 'other';
      return { title: T.ex(c.ex).name + ' · ' + c.sess, mine: shortP(c.mine), other: hidden ? 'Conteúdo indisponível' : shortP(c.other), hideOther: hidden, showOther: !hidden,
        mineCls: 't3-side' + (m ? ' is-on' : ''), otherCls: 't3-side' + (o ? ' is-on' : ''), mineOn: String(m), otherOn: String(o),
        useMine: pick('mine'), useOther: pick('other') };
    }) : [];
    var allChosen = conflict ? conflict.changes.every(function (c, i) { return choice[i] === 'mine' || (choice[i] === 'other' && !hidden); }) : false;
    var doSave = function () {
      var base = T.sessions(rid);
      var nv = T.commit(rid, T.applyChoices(base, conflict, choice), 'Versão revisada após conflito com ' + conflict.device.toLowerCase());
      delete DB.t3_conflitos[rid];
      GO('TRE14', { id: rid, revisada: String(nv) });
    };
    var saveRevised = function () {
      if (!conflict) return;
      if (!allChosen) { set({ nt: 'escolha' }); return; }
      if ((scn === 'salvfalhou' || scn === 'falhou') && !ui.retry) { set({ nt: scn }); return; }
      if (scn === 'desconhecida' && !ui.retry) { set({ nt: 'desconhecida' }); return; }
      doSave();
    };
    var focusConflict = function () { try { var el = document.getElementById('t3-conflict'); if (el) { el.setAttribute('tabindex', '-1'); el.focus(); } } catch (_) {} };

    // ---------- aviso ----------
    var nt = ui.nt !== undefined ? ui.nt : ({ conflito: 'conflito', restaurado: 'restaurado', falhou: 'falhou', atual: 'atual', permissao: 'permissao', salvfalhou: 'salvfalhou', desconhecida: 'desconhecida' }[scn] || '');
    var notice = T.none();
    var what = conflict ? conflict.device + ' · ' + conflict.at + ' · ' + conflict.what : '';
    if (nt === 'conflito') notice = T.notice('info', 'swap', 'Conflito', 'Mostra as duas versões lado a lado. Escolha uma para cada alteração; nada é sobrescrito sem você.', [['Comparar', focusConflict]]);
    if (nt === 'atual') notice = T.notice('risk', 'swap', 'Conflito atual', what + '. ' + U.plural(changes.length, 'alteração precisa', 'alterações precisam') + ' da sua escolha.', [['Revisar', focusConflict]]);
    if (nt === 'permissao') notice = T.notice('warn', 'lock', 'Permissão alterada', 'A conta que editou no notebook perdeu acesso a esta rotina. A mudança dela não é exibida; mantenha a sua para continuar.', [['Revisar', focusConflict]]);
    if (nt === 'falhou') notice = T.notice('risk', 'alert', 'Falhou', 'A versão revisada não foi salva. As duas versões ficam guardadas e suas escolhas continuam aqui.', [['Tentar de novo', function () { ctx.setUi({ retry: true, nt: '' }); }]]);
    if (nt === 'salvfalhou') notice = T.notice('risk', 'alert', 'Salvamento falhou', 'Sem conexão no momento do envio. Nada foi perdido: confira a conexão e salve de novo.', [['Corrigir', function () { ctx.setUi({ retry: true, nt: '' }); }]]);
    if (nt === 'desconhecida') notice = T.notice('warn', 'alert', 'Confirmação desconhecida', 'Não sabemos se a versão revisada foi salva. Consulte antes de salvar de novo para não duplicar.', [['Consultar de novo', function () { ctx.setUi({ retry: true, nt: 'naosalva' }); }]]);
    if (nt === 'naosalva') notice = T.notice('info', 'info', 'Consulta feita', 'A versão revisada não foi salva. Suas escolhas continuam aqui; salve quando quiser.');
    if (nt === 'escolha') notice = T.notice('warn', 'alert', 'Escolha uma versão para cada alteração', hidden ? 'A mudança do notebook está indisponível: use “Manter esta mudança”.' : 'Use “Manter esta mudança” ou “Usar notebook” em cada item.');
    if (nt === 'restaurado') notice = T.notice('ok', 'check', 'Restaurado', ui.rv ? 'A v' + r.version + ' foi criada com o conteúdo da v' + ui.rv + '. Restaurar cria nova versão e não apaga a atual.' : 'Cria nova versão, não apaga a atual.', [['Voltar ao editor', function () { GO('TRE14', { id: rid }); }], stu ? ['Ver impacto da atribuição', function () { GO('TRE15', { id: r.student, rotina: rid }); }] : null]);

    return {
      found: true, notFound: false, back: function () { GO('H06'); },
      title: 'Versões · ' + r.name, sub: 'v' + cur + ' atual' + (meta && stu ? ' · v' + meta.assigned + ' atribuída a ' + stu.first : '') + ' · ' + U.plural(vers.length, 'versão', 'versões'),
      nt: notice, loading: loading, loaded: !loading,
      hasConflict: !!conflict && !loading, conflictWhat: what, changes: changes, nChanges: 'Revisar ' + U.plural(changes.length, 'alteração', 'alterações'),
      saveRevised: saveRevised, saveCls: 'btn btn--primary btn--lg' + (allChosen ? '' : ' is-off'), saveOff: String(!allChosen),
      later: function () { GO('TRE14', { id: rid }); },
      rows: rows, fromChips: pickRow('a', A.v), toChips: pickRow('b', B.v), cmpTitle: 'Diferença v' + A.v + ' → v' + B.v,
      diffs: diffs, hasDiffs: diffs.length > 0, noDiffs: !diffs.length, sameTxt: A === B ? 'Você escolheu a mesma versão dos dois lados.' : 'As duas versões têm o mesmo conteúdo.',
      editor: function () { GO('TRE14', { id: rid }); },
      impact: function () { GO('TRE15', { id: r.student || '', rotina: rid }); }, hasStu: !!stu,
      calendar: function () { GO('TRE17', { id: r.student || '' }); },
      reload: function () { set({ loaded: true }); }
    };
  }
});
