/* TRE15 · Atribuir ou substituir programação: rotina, início, frequência e revisão completa antes de confirmar.
   Sessões concluídas são preservadas; preparação pendente bloqueia; resultado desconhecido consulta antes de repetir. */
(function () {
  'use strict';
  // versão da rotina que cada aluno recebeu por último
  DB.seed('t2_atrib', {
    ana: { rotina: 'r1', version: 3, since: '12/10' },
    bruno: { rotina: 'r2', version: 2, since: '20/10' },
    marcos: { rotina: 'r3', version: 5, since: '05/10' },
    diego: { rotina: 'r3', version: 6, since: '15/10' }
  });

  REG.screen({
    page: 'treinador', key: 'atribuir', id: 'TRE15', title: 'Atribuir programação', mtitle: 'Atribuir', nav: 'alunos', back: 'H05', wide: true,
    backParams: function (ctx) { return window.T2.back(ctx); },
    testIds: ['ana', 'marcos', 'lucas'],
    normal: 'Revisão antes de confirmar',
    scens: [['atribuido', 'Atribuído'], ['falhou', 'Falhou'], ['desconhecido', 'Resultado desconhecido'], ['prep', 'Preparação pendente'], ['mudou', 'Programação mudou'], ['permissao', 'Permissão vencida']],
    vals: function (ctx) {
      var T2 = window.T2, ui = ctx.ui, scn = ctx.scn, a = T2.stu(ctx);
      var prev = DB.t2_atrib[a.id] || null;
      var rots = DB.rotinas.filter(function (r) { return r.status !== 'rascunho'; });
      var drafts = DB.rotinas.filter(function (r) { return r.status === 'rascunho'; });
      var rid = ui.rot || (ctx.p.rotina && DB.find('rotinas', ctx.p.rotina) ? ctx.p.rotina : null) || (prev && DB.find('rotinas', prev.rotina) ? prev.rotina : (a.program || 'r1'));
      var rot = DB.find('rotinas', rid) || rots[0];
      var START = [['2026-10-27', 'Amanhã · ter 27/10'], ['2026-11-02', 'Próxima segunda · seg 02/11'], ['outra', 'Outra data']];
      var sk = ui.start || '2026-10-27';
      var other = ui.other !== undefined ? ui.other : '';
      var otherIso = T2.fromDm(other);
      var startErr = '';
      if (sk === 'outra') { if (!otherIso) startErr = 'Use dia/mês, por exemplo 09/11.'; else if (otherIso <= T2.TODAY) startErr = 'Escolha uma data a partir de amanhã (27/10).'; }
      var start = sk === 'outra' ? (startErr ? '' : otherIso) : sk;
      var freq = ui.freq || 3, weeks = ui.weeks || 4;
      var res = start ? T2.plan(a.id, start, weeks, rot.id, freq) : { changes: [], kept: [], cleared: [], total: 0, end: '' };
      var replaced = res.changes.filter(function (c) { return c.before && c.before.k === 's'; }).length + res.cleared.length;
      var done = DB.t2_concluidas[a.id] || { n: 0, since: '' };
      var blockedPrep = !a.prepDone || scn === 'prep';
      var blockedPerm = scn === 'permissao';
      var unknown = scn === 'desconhecido';
      var changed = scn === 'mudou';
      var reviewed = !!ui.ok && !changed;
      var substitui = prev ? 'v' + prev.version + ' de ' + (DB.find('rotinas', prev.rotina) || { name: 'rotina' }).name + (start ? ' (a partir de ' + T2.dm(start) + ')' : '') : 'Nada: é a primeira programação de ' + a.first;
      var summary = T2.kv([
        ['Aluno e vínculo', a.name + ' · ' + a.svc],
        ['Rotina', rot.name],
        ['Versão', 'v' + rot.version + ' · salva ' + rot.savedAt],
        ['Início', start ? T2.lbl(start) : 'defina a data'],
        ['Frequência', freq + 'x por semana · ' + weeks + ' semanas'],
        ['Sessões geradas', start ? res.changes.length + ' até ' + T2.dm(res.end) : '—'],
        ['Substitui', substitui],
        ['Calendário', replaced ? replaced + ' sessões planejadas a partir de ' + T2.dm(start) + ' são trocadas' : 'nenhuma sessão planejada é trocada']
      ]);
      var preserved = done.n ? U.plural(done.n, 'sessão concluída continua', 'sessões concluídas continuam') + ' no histórico (contagem de 26/10, desde ' + done.since + ').' : 'Nenhuma sessão concluída até 26/10.';
      var preview = res.changes.slice(0, 6).map(function (c) { return { d: T2.lbl(c.iso), t: T2.sessName(c.after.r, c.after.s), was: c.before ? 'antes: ' + T2.entry(c.before).t : 'antes: não definido' }; });
      var more = res.changes.length > 6 ? '+ ' + U.plural(res.changes.length - 6, 'sessão', 'sessões') + ' até ' + T2.dm(res.end) : '';

      var doAssign = function () {
        var r2 = T2.plan(a.id, start, weeks, rot.id, freq);
        T2.applyPlan(a.id, r2);
        a.program = rot.id; a.week = 1;
        if (a.flag && a.flag.kind === 'programacao') a.flag = null;
        var f1 = r2.changes[0];
        if (f1) a.next = T2.sessName(f1.after.r, f1.after.s).split(' · ')[0] + ' · ' + T2.wd(f1.iso);
        DB.t2_atrib[a.id] = { rotina: rot.id, version: rot.version, since: T2.dm(start) };
        ctx.setUi({ done: { rot: rot.name, v: rot.version, start: T2.lbl(start), n: r2.changes.length, end: T2.dm(r2.end), kept: r2.kept.length } });
      };
      var confirm = function () {
        if (blockedPrep) { ctx.toast('Preparação pendente: revise antes de atribuir'); return; }
        if (blockedPerm) { ctx.toast('Permissão vencida: corrija o vínculo antes'); return; }
        if (unknown) { ctx.toast('Consulte o resultado anterior antes de repetir'); return; }
        if (changed) { ctx.toast('A programação mudou: revise o resumo de novo'); return; }
        if (!start) { ctx.setUi({ err: 'Defina a data de início.' }); return; }
        if (!reviewed) { ctx.setUi({ err: 'Confira o resumo e marque que revisou destinatário, versão e início.' }); return; }
        if (scn === 'falhou') { ctx.setUi({ failed: true, err: '' }); return; }
        doAssign();
      };

      var al = T2.al(null);
      var goPrep = function () { ctx.go('REL08', { id: a.id }); };
      if (blockedPrep) al = T2.al({ ic: 'clipboard', t: 'Preparação pendente', s: a.first + ' ainda não concluiu a preparação (anamnese e liberação). Atribuir fica bloqueado até você revisar.', btn: scn === 'prep' ? 'Consultar de novo' : 'Revisar preparação', fn: scn === 'prep' ? function () { if (a.prepDone) { ctx.scenario(''); ctx.toast('Preparação concluída · atribuir liberado'); } else ctx.toast('A preparação continua pendente'); } : goPrep, btn2: scn === 'prep' ? 'Revisar preparação' : '', fn2: goPrep });
      if (scn === 'falhou' || ui.failed) al = T2.al({ kind: 'risk', ic: 'alert', t: 'Falhou', s: 'A atribuição não foi gravada. Nada mudou para ' + a.first + ': a programação vigente continua.', btn: 'Tentar de novo', fn: function () { ctx.scenario(''); ctx.setUi({ failed: false }); if (start && reviewed) doAssign(); } });
      if (unknown) al = T2.al({ ic: 'clock', t: 'Resultado desconhecido', s: 'A confirmação enviada às 21:12 não respondeu. Consultamos o mesmo pedido antes de repetir, para não atribuir duas vezes.', btn: 'Consultar de novo', fn: function () { ctx.scenario(''); if (start) doAssign(); ctx.toast('Consulta feita: a atribuição foi confirmada uma única vez'); } });
      if (changed) al = T2.al({ ic: 'refresh', t: 'A programação mudou durante a revisão', s: rot.name + ' ganhou uma nova versão às 21:10. Revise o resumo de novo antes de confirmar.', btn: 'Revisar', fn: function () { rot.version++; rot.savedAt = U.todayShort + ' 21:10'; ctx.scenario(''); ctx.setUi({ ok: false, err: '' }); ctx.toast('Resumo atualizado para v' + rot.version + ' · revise de novo'); } });
      if (blockedPerm) al = T2.al({ kind: 'risk', ic: 'lock', t: 'Permissão vencida', s: 'O vínculo com ' + a.first + ' está com pagamento pendente desde 25/10. Atribuir fica bloqueado até regularizar.', btn: 'Corrigir', fn: function () { ctx.go('H05', { id: a.id }); } });

      var result = ui.done || (scn === 'atribuido' ? { rot: rot.name, v: rot.version, start: 'ter 27/10', n: res.changes.length, end: res.end ? T2.dm(res.end) : '', kept: res.kept.length } : null);
      var canConfirm = !blockedPrep && !blockedPerm && !unknown && !changed && reviewed && !!start;
      return {
        first: a.first, name: a.name, al: al, isSub: !!prev,
        heading: prev ? 'Substituir programação' : 'Atribuir programação',
        sub: a.name + ' · ' + a.svc,
        result: { on: !!result, title: 'Atribuído', text: result ? a.first + ' vê a programação a partir de ' + result.start + '.' : '', kv: result ? T2.kv([['Rotina', result.rot + ' · v' + result.v], ['Início', result.start], ['Sessões', result.n + ' até ' + result.end], ['Concluídas preservadas', done.n ? String(done.n) : '0']]) : [] },
        form: !result,
        rots: rots.map(function (r) { var on = r.id === rot.id; return { name: r.name, meta: 'v' + r.version + ' · ' + U.plural(r.sessions.length, 'sessão', 'sessões') + ' · ' + r.folder + (r.student && r.student !== a.id ? ' · atribuída a ' + (DB.find('alunos', r.student) || { first: '' }).first : ''), cls: 'opt t2-ropt' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ rot: r.id, ok: false }); } }; }),
        hasDrafts: drafts.length > 0, drafts: drafts.map(function (r) { return r.name; }).join(', '),
        starts: T2.opts(START, sk, function (k) { ctx.setUi({ start: k, ok: false, err: '' }); }),
        isOther: sk === 'outra', other: other, setOther: function (e) { ctx.setUi({ other: U.val(e), ok: false }); },
        hasStartErr: !!startErr && other !== '', startErr: startErr, otherCls: startErr && other !== '' ? 'input is-err' : 'input',
        freqs: T2.opts([[2, '2x'], [3, '3x'], [4, '4x'], [5, '5x']], freq, function (k) { ctx.setUi({ freq: k, ok: false }); }),
        weeksO: T2.opts([[4, '4 semanas'], [8, '8 semanas']], weeks, function (k) { ctx.setUi({ weeks: k, ok: false }); }),
        summary: summary, preserved: preserved, preview: preview, hasPreview: preview.length > 0, more: more, hasMore: !!more,
        okCls: 'check' + (reviewed ? ' is-on' : ''), ok: String(reviewed),
        toggleOk: function () { ctx.setUi({ ok: !ui.ok, err: '' }); },
        hasErr: !!ui.err, err: ui.err || '',
        confirm: confirm, confirmAria: String(!canConfirm),
        edit: function () { ctx.go('TRE14', { id: rot.id }); },
        calendar: function () { ctx.go('TRE17', { id: a.id }); },
        prep: function () { ctx.go('REL08', { id: a.id }); },
        toStudent: function () { ctx.go('H05', { id: a.id }); }
      };
    }
  });
})();
