/* TRE18 · Macroplanejamento em fases aplicado ao calendário com prévia. Não reserva agenda nem altera concluídos. */
REG.screen({
  page: 'treinador', key: 'macro', id: 'TRE18', title: 'Macroplanejamento', mtitle: 'Macroplano', nav: 'alunos', back: 'H05', wide: true,
  backParams: function (ctx) { return window.T2.back(ctx); },
  testIds: ['ana', 'marcos', 'lucas'],
  normal: 'Fases do plano',
  scens: [['previa', 'Prévia'], ['concluidos', 'Conflito com concluídos'], ['agenda', 'Agenda'], ['vazio', 'Plano vazio'], ['ref', 'Referência indisponível'], ['parcial', 'Prévia parcial']],
  vals: function (ctx) {
    var T2 = window.T2, ui = ctx.ui, scn = ctx.scn, a = T2.stu(ctx);
    var stored = DB.t2_macro[a.id] || null;
    var plan = stored || { start: '2026-10-27', version: 0, savedAt: '', phases: [] };
    var phases = scn === 'vazio' ? [] : plan.phases.slice().sort(function (x, y) { return x.from - y.from; });
    var total = phases.reduce(function (m, p) { return Math.max(m, p.to); }, 0);
    var badRef = scn === 'ref' ? 'r2' : '';
    var rotOk = function (id) { return id !== badRef && !!DB.find('rotinas', id); };
    var write = function () { if (!DB.t2_macro[a.id]) DB.t2_macro[a.id] = { start: plan.start, version: 0, savedAt: '', phases: [] }; return DB.t2_macro[a.id]; };
    var bump = function (m) { m.version++; m.savedAt = U.todayShort + ' ' + U.now(); };

    var timeline = []; for (var w = 1; w <= total; w++) { (function (w) { var idx = phases.findIndex(function (p) { return w >= p.from && w <= p.to; }); timeline.push({ w: 'SEM ' + w, name: idx >= 0 ? phases[idx].name : '—', cls: 't2-tl__c ' + (idx >= 0 ? 't2-ph' + (idx % 4 + 1) : 't2-ph0') }); })(w); }

    var list = phases.map(function (p, i) {
      var r = DB.find('rotinas', p.rotina);
      return {
        title: 'Fase ' + (i + 1) + ' · ' + p.name, weeks: 'sem ' + p.from + '–' + p.to + ' · ' + U.plural(p.to - p.from + 1, 'semana', 'semanas'),
        intent: p.intent, presc: rotOk(p.rotina) ? r.name + ' · v' + r.version + ' · ' + p.freq + 'x por semana' : 'Rotina indisponível no momento',
        bad: !rotOk(p.rotina), dot: 't2-dot t2-ph' + (i % 4 + 1),
        edit: function () { ctx.setUi({ edit: p.id, f: { name: p.name, intent: p.intent, from: String(p.from), to: String(p.to), rotina: p.rotina, freq: p.freq }, err: {} }); },
        open: function () { ctx.go('TRE14', { id: p.rotina }); },
        remove: function () { ctx.ask({ title: 'Remover a fase ' + p.name + '?', text: 'A fase sai do plano. O calendário só muda quando você gerar a prévia e aplicar.', ok: 'Remover fase', danger: true, onOk: function () { var m = write(); m.phases = m.phases.filter(function (x) { return x.id !== p.id; }); bump(m); ctx.setUi({ prev: false }); ctx.toast('Fase removida · plano v' + m.version); } }); }
      };
    });

    // editor de fase
    var editing = ui.edit || '';
    var nextFrom = total + 1;
    var f = Object.assign({ name: '', intent: '', from: String(nextFrom), to: String(nextFrom + 3), rotina: a.program || 'r1', freq: 3 }, ui.f || {});
    var err = ui.err || {};
    var setF = function (k) { return function (e) { var o = Object.assign({}, f); o[k] = U.val(e); var er = Object.assign({}, err); delete er[k]; delete er.weeks; ctx.setUi({ f: o, err: er }); }; };
    var saveF = function () {
      var er = {}, from = parseInt(f.from, 10), to = parseInt(f.to, 10);
      if (!String(f.name).trim()) er.name = 'Dê um nome à fase.';
      if (!String(f.intent).trim()) er.intent = 'Escreva a intenção da fase (o objetivo, não a prescrição).';
      if (!(from >= 1 && to <= 24 && from <= to)) er.weeks = 'Use semanas de 1 a 24, com “de” menor ou igual a “até”.';
      else if (phases.some(function (p) { return p.id !== editing && from <= p.to && to >= p.from; })) er.weeks = 'Estas semanas já pertencem a outra fase.';
      if (!rotOk(f.rotina)) er.rotina = 'Escolha uma rotina disponível.';
      if (Object.keys(er).length) { ctx.setUi({ err: er }); return; }
      var m = write(), ph = { id: editing === 'new' ? DB.uid('ph') : editing, name: String(f.name).trim(), intent: String(f.intent).trim(), from: from, to: to, rotina: f.rotina, freq: Number(f.freq) || 3 };
      if (editing === 'new') m.phases.push(ph); else m.phases = m.phases.map(function (x) { return x.id === editing ? ph : x; });
      bump(m);
      ctx.setUi({ edit: '', f: null, err: {}, prev: false });
      ctx.toast('Fase salva · plano v' + m.version + ' · gere a prévia para ver o alcance');
    };
    var ed = {
      on: !!editing, title: editing === 'new' ? 'Nova fase' : 'Editar fase', f: f,
      setName: setF('name'), setIntent: setF('intent'), setFrom: setF('from'), setTo: setF('to'),
      rots: DB.rotinas.filter(function (r) { return r.status !== 'rascunho'; }).map(function (r) { var on = r.id === f.rotina; return { label: r.name + ' · v' + r.version, cls: 'opt' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ f: Object.assign({}, f, { rotina: r.id }), err: Object.assign({}, err, { rotina: '' }) }); } }; }),
      freqs: T2.opts([[2, '2x'], [3, '3x'], [4, '4x'], [5, '5x']], Number(f.freq), function (k) { ctx.setUi({ f: Object.assign({}, f, { freq: k }) }); }),
      eName: err.name || '', hasEName: !!err.name, eIntent: err.intent || '', hasEIntent: !!err.intent, eWeeks: err.weeks || '', hasEWeeks: !!err.weeks, eRot: err.rotina || '', hasERot: !!err.rotina,
      cName: err.name ? 'input is-err' : 'input', cWeeks: err.weeks ? 'input is-err' : 'input',
      save: saveF, cancel: function () { ctx.setUi({ edit: '', f: null, err: {} }); }
    };

    // prévia de alcance
    var partial = scn === 'parcial';
    var calc = phases.map(function (p, i) {
      var s = T2.add(plan.start, (p.from - 1) * 7), wk = p.to - p.from + 1;
      if (!rotOk(p.rotina) || (partial && i >= 2)) return { p: p, i: i, ok: false, s: s, res: null };
      return { p: p, i: i, ok: true, s: s, res: T2.plan(a.id, s, wk, p.rotina, p.freq) };
    });
    var okCalc = calc.filter(function (c) { return c.ok; });
    var nSess = okCalc.reduce(function (n, c) { return n + c.res.changes.length; }, 0);
    var nRepl = okCalc.reduce(function (n, c) { return n + c.res.changes.filter(function (x) { return x.before && x.before.k === 's'; }).length + c.res.cleared.length; }, 0);
    var nKept = okCalc.reduce(function (n, c) { return n + c.res.kept.length; }, 0);
    var prevOn = (!!ui.prev || scn === 'previa' || partial) && phases.length > 0;
    var allOk = okCalc.length === calc.length && calc.length > 0;
    var prev = {
      on: prevOn,
      head: 'Gera ' + U.plural(nSess, 'sessão', 'sessões') + ' a partir de ' + T2.dm(plan.start) + '. Sessões concluídas não mudam.',
      rows: calc.map(function (c) { return { t: 'Fase ' + (c.i + 1) + ' · ' + c.p.name, s: c.ok ? U.plural(c.res.changes.length, 'sessão', 'sessões') + ' · ' + T2.dm(c.s) + ' a ' + T2.dm(c.res.end) : (partial && rotOk(c.p.rotina) ? 'prévia ainda não calculada' : 'rotina indisponível · fora da prévia'), cls: 't2-prev__r' + (c.ok ? '' : ' is-off') }; }),
      repl: nRepl ? U.plural(nRepl, 'sessão planejada é trocada', 'sessões planejadas são trocadas') + ' no calendário.' : 'Nenhuma sessão planejada é trocada.',
      kept: nKept ? U.plural(nKept, 'sessão concluída fica', 'sessões concluídas ficam') + ' como está.' : '',
      hasKept: nKept > 0, canApply: allOk, blocked: !allOk,
      apply: function () {
        if (!allOk) { ctx.toast(partial ? 'Prévia parcial: consulte de novo antes de aplicar' : 'Há fase sem rotina disponível'); return; }
        ctx.ask({ title: 'Aplicar o macroplano ao calendário?', text: 'O calendário de ' + a.first + ' recebe ' + U.plural(nSess, 'sessão', 'sessões') + ' a partir de ' + T2.lbl(plan.start) + '.', lines: [prev.repl, 'Sessões concluídas não mudam.', 'Nenhum compromisso será reservado na agenda.'], ok: 'Aplicar ao calendário',
          onOk: function () { calc.forEach(function (c) { T2.applyPlan(a.id, T2.plan(a.id, c.s, c.p.to - c.p.from + 1, c.p.rotina, c.p.freq)); }); ctx.setUi({ prev: false, applied: nSess }); } });
      }
    };

    var al = T2.al(null);
    var doneList = Object.keys(T2.cal(a.id).days).filter(function (d) { var x = T2.cal(a.id).days[d]; return x.done; }).sort().slice(-3).map(T2.lbl);
    if (scn === 'previa') al = T2.al({ kind: 'info', ic: 'eye', t: 'Prévia', s: 'Mostra quantas sessões serão criadas antes de qualquer mudança no calendário.' });
    if (scn === 'concluidos') al = T2.al({ ic: 'alert', t: 'Conflito com concluídos', s: 'O plano começa em semanas com sessões já feitas. Não serão mudadas: ' + (doneList.length ? doneList.join(', ') : 'nenhuma sessão concluída') + '.', btn: 'Tentar de novo', fn: function () { ctx.scenario(''); ctx.setUi({ prev: true }); } });
    if (scn === 'agenda') al = T2.al({ kind: 'info', ic: 'calendar', t: 'Agenda', s: 'Planejar não reserva horário. Atendimentos presenciais e online continuam na Agenda.', btn: 'Saiba por quê', fn: function () { ctx.ask({ title: 'Plano não é agenda', text: 'O macroplano organiza o que ' + a.first + ' treina em cada semana. Horários com você são combinados e confirmados na Agenda.', lines: ['Nenhum compromisso é criado ao planejar.', 'Sessões do plano aparecem no calendário de treinos, não na Agenda.'], ok: 'Entendi', cancel: false }); } });
    if (scn === 'ref') al = T2.al({ ic: 'alert', t: 'Referência indisponível', s: 'A rotina Hipertrofia · bloco 2 não pôde ser carregada. A fase que depende dela fica fora da prévia.', btn: 'Tentar de novo', fn: function () { ctx.scenario(''); } });
    if (partial) al = T2.al({ ic: 'clock', t: 'Prévia parcial', s: 'Calculamos só as duas primeiras fases. Aplicar fica bloqueado até a prévia completa.', btn: 'Consultar de novo', fn: function () { ctx.scenario(''); ctx.setUi({ prev: true }); } });
    var applied = ui.applied ? T2.al({ kind: 'ok', ic: 'check', t: 'Plano aplicado ao calendário', s: U.plural(ui.applied, 'sessão criada', 'sessões criadas') + '. Nenhum horário foi reservado na agenda.', btn: 'Ver calendário', fn: function () { ctx.go('TRE17', { id: a.id }); }, btn2: 'Revisar programação resultante', fn2: function () { ctx.go('TRE15', { id: a.id }); } }) : T2.al(null);

    return {
      first: a.first, al: al, applied: applied,
      sub: phases.length ? total + ' semanas a partir de ' + T2.lbl(plan.start) + (plan.version ? ' · v' + plan.version + ' salva ' + plan.savedAt : '') : 'Comece por uma fase',
      timeline: timeline, hasPhases: phases.length > 0, empty: phases.length === 0,
      list: list, ed: ed, prev: prev,
      add: function () { ctx.setUi({ edit: 'new', f: null, err: {} }); },
      gen: function () { if (!phases.length) { ctx.toast('Adicione uma fase antes'); return; } ctx.setUi({ prev: true, applied: 0 }); },
      review: function () { ctx.go('TRE15', { id: a.id }); },
      calendar: function () { ctx.go('TRE17', { id: a.id }); }
    };
  }
});
