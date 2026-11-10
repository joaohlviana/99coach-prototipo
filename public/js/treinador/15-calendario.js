/* TRE17 · Calendário de treinos do aluno (dia, semana e mês): mover, trocar, descanso com escopo, prévia de alcance,
   desfazer e conflito de versão. "Não definido" nunca vira descanso. */
REG.screen({
  page: 'treinador', key: 'calendario', id: 'TRE17', title: 'Calendário', nav: 'alunos', back: 'H05', wide: true,
  backParams: function (ctx) { return window.T2.back(ctx); },
  testIds: ['ana', 'marcos', 'lucas'],
  normal: 'Semana com sessões',
  scens: [['indef', 'Dia não definido'], ['naocarregou', 'Não carregou'], ['movido', 'Movido'], ['indisp', 'Consulta indisponível'], ['conflito', 'Conflito de versão'], ['desconhecido', 'Resultado desconhecido']],
  vals: function (ctx) {
    var T2 = window.T2, ui = ctx.ui, scn = ctx.scn, a = T2.stu(ctx);
    var cal = T2.cal(a.id), days = cal.days;
    var mode = ui.mode || 'semana';
    var noQuery = scn === 'indisp', stale = scn === 'naocarregou';
    var firstUndef = function () { for (var i = 0; i < 7; i++) { var d = T2.add(T2.TODAY, i); if (!days[d]) return d; } return T2.TODAY; };
    var sel = ui.day || (scn === 'indef' ? firstUndef() : T2.TODAY);
    var wk = ui.wk || T2.monday(sel);
    var e = days[sel] || null, en = T2.entry(e);
    var progRot = DB.find('rotinas', (e && e.r) || a.program || (DB.t2_atrib[a.id] || {}).rotina || '');

    var pickDay = function (d) { return function () { ctx.setUi({ day: d, wk: T2.monday(d), op: '', review: false, target: '', swap: '' }); }; };
    var cell = function (d, inMonth) {
      var x = days[d] || null, t = T2.entry(x), on = d === sel;
      var short = noQuery ? '?' : t.short, cls = 't2-day ' + (noQuery ? 't2-day--q' : t.cls) + (on ? ' is-on' : '') + (d === T2.TODAY ? ' is-today' : '') + (inMonth === false ? ' is-out' : '');
      return { d: d, wd: T2.wd(d).toUpperCase(), dm: T2.dm(d), n: String(T2.parse(d).getDate()), short: short, cls: cls, cur: String(on), label: T2.lbl(d) + ': ' + (noQuery ? 'consulta indisponível' : t.t), done: !!(x && x.done), pick: pickDay(d) };
    };
    var week = []; for (var i = 0; i < 7; i++) week.push(cell(T2.add(wk, i)));
    // mês
    var mref = ui.month || sel.slice(0, 7);
    var m1 = mref + '-01', mstart = T2.monday(m1), month = [];
    var md = T2.parse(m1); var nextM = T2.iso(new Date(md.getFullYear(), md.getMonth() + 1, 1));
    for (var s = mstart; s < nextM || T2.parse(s).getDay() !== 1; s = T2.add(s, 1)) month.push(cell(s, s.slice(0, 7) === mref));
    var monthLabel = T2.MES[md.getMonth()] + ' de ' + md.getFullYear();
    var shiftMonth = function (n) { return function () { var d = new Date(md.getFullYear(), md.getMonth() + n, 1); ctx.setUi({ month: T2.iso(d).slice(0, 7) }); }; };

    // operação no dia
    var op = ui.op || '', scope = ui.scope || 'dia', target = ui.target || '', swap = ui.swap || '';
    var canEdit = !noQuery && !stale;
    var ops = [];
    if (canEdit && !(e && e.done)) {
      if (e && e.k === 's') ops = [['mover', 'Mover'], ['trocar', 'Trocar'], ['descanso', 'Descanso']];
      else if (e && e.k === 'd') ops = [['trocar', 'Definir sessão'], ['limpar', 'Deixar não definido']];
      else ops = [['trocar', 'Definir sessão'], ['descanso', 'Descanso']];
    }
    var opList = ops.map(function (o) { var on = o[0] === op; return { label: o[1], cls: 'btn btn--sm ' + (on ? 'btn--primary' : (o[0] === 'descanso' || o[0] === 'limpar' ? 'btn--ghost' : 'btn--outline')), on: String(on), pick: function () { ctx.setUi({ op: on ? '' : o[0], review: false, target: '', swap: '' }); } }; });
    var targets = [];
    if (op === 'mover') for (var j = 0; j < 7; j++) { var td = T2.add(wk, j); if (td === sel) continue; var tx = days[td] || null; if (tx && tx.done) continue; (function (td, tx) { var on = td === target; targets.push({ label: T2.lbl(td) + ' · ' + T2.entry(tx).short, cls: 'opt' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ target: td, review: false }); } }); })(td, tx); }
    var swaps = (op === 'trocar' && progRot) ? progRot.sessions.filter(function (x) { return !(e && e.k === 's' && x.id === e.s); }).map(function (x) { var on = x.id === swap; return { label: x.name, cls: 'opt' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ swap: x.id, review: false }); } }; }) : [];
    var SCOPES = [['dia', 'Só este dia'], ['semana', 'Esta semana'], ['diante', 'Daqui em diante'], ['base', 'Base']];
    var scopes = T2.opts(SCOPES, scope, function (k) { ctx.setUi({ scope: k, review: false }); });
    var scopeTxt = (SCOPES.find(function (x) { return x[0] === scope; }) || SCOPES[0])[1];

    // calcula o alcance: lista de { iso, before, after }
    var reach = function () {
      var out = [], skipped = 0, last = Object.keys(days).sort().pop() || T2.add(sel, 27);
      if (last < T2.add(sel, 27)) last = T2.add(sel, 27);
      var dates = [sel];
      if (scope === 'diante' || scope === 'base') { dates = []; for (var d = sel; d <= last; d = T2.add(d, 7)) dates.push(d); }
      if (scope === 'semana' && op !== 'mover' && e && e.k === 's') { dates = []; for (var k = 0; k < 7; k++) { var dd = T2.add(wk, k); var xx = days[dd]; if (dd >= sel && xx && xx.k === 's' && xx.s === e.s) dates.push(dd); } }
      dates.forEach(function (d) {
        var cur = days[d] || null;
        if (cur && cur.done) { skipped++; return; }
        if (op === 'mover') {
          if (!target || !cur || cur.k !== 's') return;
          var t = T2.add(d, Math.round((T2.parse(target) - T2.parse(sel)) / 864e5));
          var tc = days[t] || null; if (tc && tc.done) { skipped++; return; }
          out.push({ iso: d, before: cur, after: tc });
          out.push({ iso: t, before: tc, after: cur });
        } else if (op === 'trocar') {
          if (!swap || !progRot) return;
          out.push({ iso: d, before: cur, after: { k: 's', r: progRot.id, s: swap } });
        } else if (op === 'descanso') out.push({ iso: d, before: cur, after: { k: 'd' } });
        else if (op === 'limpar') out.push({ iso: d, before: cur, after: null });
      });
      return { list: out, skipped: skipped };
    };
    var ready = op === 'descanso' || op === 'limpar' || (op === 'mover' && !!target) || (op === 'trocar' && !!swap);
    var R = ready ? reach() : { list: [], skipped: 0 };
    var prevRows = R.list.slice(0, 8).map(function (c) { return { d: T2.lbl(c.iso), from: T2.entry(c.before).t, to: T2.entry(c.after).t }; });
    var apply = function () {
      if (!R.list.length) { ctx.toast('Nada a alterar neste escopo'); return; }
      if (scn === 'conflito' && !ui.reloaded) { ctx.setUi({ conflict: true }); return; }
      if (scn === 'desconhecido' && !ui.consulted) { ctx.setUi({ unknown: true }); return; }
      var w = T2.calW(a.id), snap = {};
      R.list.forEach(function (c) { if (!(c.iso in snap)) snap[c.iso] = w.days[c.iso] ? JSON.parse(JSON.stringify(w.days[c.iso])) : null; });
      R.list.forEach(function (c) { if (c.after) w.days[c.iso] = c.after; else delete w.days[c.iso]; });
      w.version++; w.savedAt = U.todayShort + ' ' + U.now();
      if (scope === 'base' && progRot) { progRot.version++; progRot.savedAt = U.todayShort + ' ' + U.now(); }
      var txt = (op === 'mover' ? 'Movido' : op === 'trocar' ? 'Trocado' : op === 'descanso' ? 'Descanso aplicado' : 'Dia deixado sem definição') + ' · ' + scopeTxt.toLowerCase() + ' · ' + U.plural(R.list.length, 'dia', 'dias') + (scope === 'base' && progRot ? ' · base ' + progRot.name + ' v' + progRot.version : '');
      ctx.setUi({ op: '', review: false, target: '', swap: '', conflict: false, unknown: false, last: { snap: snap, txt: txt, base: scope === 'base' && progRot ? progRot.id : '' } });
    };
    var undo = function () {
      var l = ui.last; if (!l) { ctx.scenario(''); ctx.toast('Alteração desfeita'); return; }
      var w = T2.calW(a.id);
      Object.keys(l.snap).forEach(function (d) { if (l.snap[d]) w.days[d] = l.snap[d]; else delete w.days[d]; });
      w.version++; w.savedAt = U.todayShort + ' ' + U.now();
      if (l.base) { var r = DB.find('rotinas', l.base); if (r) r.version++; }
      ctx.setUi({ last: null }); ctx.toast('Alteração desfeita · calendário como antes');
    };

    var al = T2.al(null);
    if (scn === 'indef') al = T2.al({ kind: 'info', ic: 'info', t: 'Dia não definido', s: T2.lbl(sel) + ' não tem sessão nem descanso. Ele não vira descanso sozinho: defina se quiser.', btn: 'Consultar de novo', fn: function () { ctx.scenario(''); } });
    if (stale) al = T2.al({ ic: 'refresh', t: 'Não carregou', s: 'Mostrando a última versão salva (v' + cal.version + (cal.savedAt ? ' · ' + cal.savedAt : '') + '). Para alterar, carregue de novo.', btn: 'Tentar de novo', fn: function () { ctx.scenario(''); } });
    if (scn === 'movido' && !ui.last) al = T2.al({ kind: 'ok', ic: 'check', t: 'Movido', s: 'Treino B saiu de qua 28/10 para qui 29/10 · só este dia. O resto da semana não mudou.', btn: 'Desfazer', fn: undo });
    if (noQuery) al = T2.al({ ic: 'alert', t: 'Consulta indisponível', s: 'Não foi possível consultar o calendário de ' + a.first + ' agora. “?” é falha de consulta: não é descanso nem dia sem definição.', btn: 'Tentar de novo', fn: function () { ctx.scenario(''); } });
    if (scn === 'conflito' && !ui.reloaded) al = T2.al({ ic: 'refresh', t: 'Conflito de versão', s: 'O calendário de ' + a.first + ' foi alterado em outro aparelho (v' + (cal.version + 1) + ' às 21:05). Revise antes de aplicar qualquer mudança.', btn: 'Revisar', fn: function () { var w = T2.calW(a.id); w.version++; w.savedAt = U.todayShort + ' 21:05'; ctx.setUi({ reloaded: true, conflict: false }); ctx.toast('Calendário recarregado na v' + w.version + ' · revise a prévia'); } });
    if (scn === 'desconhecido' || ui.unknown) al = T2.al({ ic: 'clock', t: 'Resultado desconhecido', s: 'A alteração enviada às 21:12 não respondeu. Consultamos antes de repetir, para não mover duas vezes.', btn: 'Consultar de novo', fn: function () { ctx.scenario(''); ctx.setUi({ unknown: false, consulted: true }); ctx.toast('Consulta feita: nada foi aplicado em dobro'); } });
    var done = ui.last ? T2.al({ kind: 'ok', ic: 'check', t: ui.last.txt.split(' · ')[0], s: ui.last.txt.split(' · ').slice(1).join(' · ') + '. Sessões concluídas não mudaram.', btn: 'Desfazer', fn: undo }) : T2.al(null);

    var hasPlan = Object.keys(days).length > 0;
    return {
      first: a.first, al: al, done: done,
      sub: 'Versão ' + cal.version + (cal.savedAt ? ' · salva ' + cal.savedAt : '') + ' · fuso de Brasília',
      modes: T2.opts([['dia', 'Dia'], ['semana', 'Semana'], ['mes', 'Mês']], mode, function (k) { ctx.setUi({ mode: k }); }).map(function (o) { o.cls = 'seg__it' + (o.on === 'true' ? ' is-on' : ''); return o; }),
      isWeek: mode === 'semana', isMonth: mode === 'mes', isDay: mode === 'dia',
      week: week, weekLabel: 'Semana ' + T2.dm(wk) + ' – ' + T2.dm(T2.add(wk, 6)),
      prevWeek: function () { ctx.setUi({ wk: T2.add(wk, -7) }); }, nextWeek: function () { ctx.setUi({ wk: T2.add(wk, 7) }); },
      month: month, monthLabel: monthLabel, prevMonth: shiftMonth(-1), nextMonth: shiftMonth(1),
      noPlan: !hasPlan && !noQuery, assign: function () { ctx.go('TRE15', { id: a.id }); },
      day: {
        title: T2.lbl(sel).replace(/^./, function (c) { return c.toUpperCase(); }), text: noQuery ? 'Consulta indisponível' : a.first + ' · ' + en.t,
        isDone: !!(e && e.done), isUndef: !e && !noQuery, canEdit: canEdit, readOnly: !canEdit,
        ops: opList, hasOps: opList.length > 0,
        isMove: op === 'mover', targets: targets, isSwap: op === 'trocar', swaps: swaps, noRot: op === 'trocar' && !progRot,
        hasOp: !!op, scopes: scopes, ready: ready,
        review: function () { if (!ready) { ctx.toast(op === 'mover' ? 'Escolha o dia de destino' : 'Escolha a sessão'); return; } ctx.setUi({ review: true }); },
        prev: pickDay(T2.add(sel, -1)), next: pickDay(T2.add(sel, 1)),
        editSession: function () { ctx.go('TRE14', { id: progRot ? progRot.id : 'r1' }); }
      },
      rev: {
        on: !!ui.review && ready, rows: prevRows, count: U.plural(R.list.length, 'dia muda', 'dias mudam') + ' · ' + scopeTxt.toLowerCase(),
        more: R.list.length > 8 ? '+ ' + (R.list.length - 8) + ' dias' : '', hasMore: R.list.length > 8,
        skipped: R.skipped ? U.plural(R.skipped, 'sessão concluída fica', 'sessões concluídas ficam') + ' como está.' : 'Nenhuma sessão concluída é alterada.',
        isBase: scope === 'base', baseTxt: progRot ? 'Base: a rotina ' + progRot.name + ' ganha uma nova versão com este padrão.' : '',
        conflict: !!ui.conflict, apply: apply, cancel: function () { ctx.setUi({ review: false }); }
      },
      macro: function () { ctx.go('TRE18', { id: a.id }); },
      agenda: function () { ctx.go('TRE20', {}); }
    };
  }
});
