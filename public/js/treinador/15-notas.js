/* TRE09 · Notas privadas do aluno: visibilidade, versão, histórico e conflito entre aparelhos. Sem botão Enviar. */
REG.screen({
  page: 'treinador', key: 'notas', id: 'TRE09', title: 'Notas', nav: 'alunos', back: 'H05', wide: true,
  backParams: function (ctx) { return window.T2.back(ctx); },
  testIds: ['ana', 'marcos', 'lucas'],
  normal: 'Notas do aluno',
  scens: [['salva', 'Salva'], ['naosalvou', 'Não salvou'], ['outro', 'Editada em outro aparelho'], ['salvando', 'Salvando'], ['falha', 'Falha'], ['conflito', 'Conflito'], ['vispend', 'Mudança de visibilidade pendente']],
  vals: function (ctx) {
    var T2 = window.T2, ui = ctx.ui, scn = ctx.scn, a = T2.stu(ctx);
    var CTX = ['Carga', 'Rotina', 'Preferências', 'Saúde informada', 'Outro'];
    var meta = function (id) { return DB.t2_notaMeta[id] || { ctx: 'Outro', origin: 'Nota manual' }; };
    var notes = DB.notas.filter(function (n) { return n.student === a.id; });
    var hhmm = function (t) { return String(t).replace(':', 'h'); };
    var visTxt = function (v) { return v === 'compartilhada' ? 'Compartilhada com ' + a.first : 'Só você vê'; };
    var DS_TEXT = 'Preferiu treinar de manhã. Evitar overhead até reavaliar ombro.';
    var first = notes[0] || null;
    var demoScn = ['salva', 'naosalvou', 'outro', 'salvando', 'conflito'].indexOf(scn) >= 0;

    // rascunho do editor
    var editId = ui.edit !== undefined ? ui.edit : (demoScn && first ? first.id : '');
    var editing = editId ? DB.find('notas', editId) : null;
    var draft = ui.draft !== undefined ? ui.draft : (editing ? (scn === 'naosalvou' || scn === 'salvando' ? editing.text + ' Reavaliar em 09/11.' : editing.text) : (demoScn ? DS_TEXT : ''));
    var vis = ui.vis || (editing ? editing.vis : 'privada');
    var nctx = ui.nctx || (editing ? meta(editing.id).ctx : 'Carga');
    var base = ui.base !== undefined ? ui.base : (editing ? editing.version : 0);
    var dirty = editing ? (draft !== editing.text || vis !== editing.vis || nctx !== meta(editing.id).ctx) : draft.trim().length > 0;
    var conflictOther = editing ? { text: DS_TEXT, at: '26/10 21:02', version: editing.version + 1, device: 'celular' } : null;

    var persist = function () {
      var txt = draft.trim(), n;
      if (editing) {
        DB.t2_notasHist.unshift({ id: DB.uid('h'), note: editing.id, version: editing.version, text: editing.text, vis: editing.vis, at: editing.at, by: 'Rafael Lima' });
        editing.text = txt; editing.vis = vis; editing.version = (ui.forceV || editing.version) + 1; editing.at = U.todayShort + ' ' + U.now(); n = editing;
      } else {
        n = { id: DB.uid('n'), student: a.id, text: txt, vis: vis, at: U.todayShort + ' ' + U.now(), version: 1 };
        DB.notas.unshift(n);
      }
      DB.t2_notaMeta[n.id] = { ctx: nctx, origin: (DB.t2_notaMeta[n.id] || {}).origin || 'Nota manual' };
      ctx.setUi({ edit: n.id, draft: n.text, vis: n.vis, nctx: nctx, base: n.version, savedAt: U.now(), err: '', saveErr: false, cmp: false, forceV: 0 });
    };
    var save = function () {
      if (scn === 'salvando') { ctx.toast('Aguarde: a nota está sendo salva'); return; }
      if (!draft.trim()) { ctx.setUi({ err: 'Escreva a nota antes de salvar.' }); return; }
      if (draft.length > 1000) { ctx.setUi({ err: 'Use até 1.000 caracteres.' }); return; }
      if (scn === 'naosalvou' || scn === 'falha') { ctx.setUi({ saveErr: true }); return; }
      if (editing && (scn === 'conflito' || scn === 'outro') && !ui.resolved) { ctx.setUi({ cmp: true }); return; }
      if (editing && editing.version !== base && !ui.resolved) { ctx.setUi({ cmp: true }); return; }
      var before = editing ? editing.vis : 'privada';
      if (before !== vis) {
        var share = vis === 'compartilhada';
        ctx.ask({ title: share ? 'Revise antes de compartilhar' : 'Tornar a nota privada', text: share ? a.name + ' passará a ver esta nota no app, com seu nome e a data. Ela não vira mensagem na conversa.' : a.first + ' deixa de ver esta nota a partir de agora.',
          lines: ['Quem vai ver: ' + (share ? a.first + ' e você' : 'só você'), 'Texto: “' + (draft.trim().length > 140 ? draft.trim().slice(0, 140) + '…' : draft.trim()) + '”'], ok: share ? 'Compartilhar nota' : 'Tornar privada', onOk: persist });
        return;
      }
      persist();
    };
    var resolve = function (which) {
      return function () {
        if (!editing) return;
        if (which === 'mine') ctx.setUi({ resolved: true, cmp: false, forceV: conflictOther.version, base: editing.version });
        if (which === 'other') { ctx.setUi({ draft: conflictOther.text, resolved: true, cmp: false, forceV: conflictOther.version }); }
        if (which === 'both') ctx.setUi({ draft: draft.trim() + '\n' + conflictOther.text, resolved: true, cmp: false, forceV: conflictOther.version });
        ctx.toast(which === 'other' ? 'Versão do outro aparelho no editor · salve para confirmar' : 'Revise o texto e salve para confirmar');
      };
    };

    var status;
    if (scn === 'salvando') status = { t: 'Salvando…', cls: 't2-save is-busy' };
    else if (ui.saveErr) status = { t: 'Não salvou · texto mantido no editor', cls: 't2-save is-err' };
    else if (ui.savedAt && !dirty) status = { t: 'Salva às ' + hhmm(ui.savedAt) + ' · v' + (editing ? editing.version : 1) + ' · ' + visTxt(vis), cls: 't2-save is-ok' };
    else if (scn === 'salva' && editing && !dirty) status = { t: 'Salva às 14h20 · v' + editing.version + ' · ' + visTxt(vis), cls: 't2-save is-ok' };
    else if (dirty) status = { t: 'Alterações não salvas', cls: 't2-save' };
    else status = { t: editing ? 'Sem alterações · v' + editing.version : 'Nova nota', cls: 't2-save' };

    var list = notes.map(function (n) {
      var m = meta(n.id), on = editing && editing.id === n.id, pend = scn === 'vispend' && first && n.id === first.id;
      return {
        when: n.at.split(' ')[0] + ' · sobre ' + m.ctx.toLowerCase(), text: n.text, by: 'Rafael Lima · ' + n.at + ' · v' + n.version + ' · ' + m.origin,
        vis: pend ? 'Visibilidade pendente' : visTxt(n.vis), visCls: pend ? 'badge badge--warn' : (n.vis === 'compartilhada' ? 'badge badge--info' : 'badge badge--ink'),
        cls: 'mod-card t2-note' + (on ? ' is-on' : ''), histOn: String(ui.hist === n.id),
        edit: function () { ctx.setUi({ edit: n.id, draft: n.text, vis: n.vis, nctx: m.ctx, base: n.version, err: '', saveErr: false, savedAt: '', cmp: false, resolved: false }); },
        hist: function () { ctx.setUi({ hist: ui.hist === n.id ? '' : n.id }); },
        swap: function () { ctx.setUi({ edit: n.id, draft: n.text, vis: n.vis === 'compartilhada' ? 'privada' : 'compartilhada', nctx: m.ctx, base: n.version, err: '', saveErr: false, savedAt: '', cmp: false }); ctx.toast('Revise o texto e quem vai ver antes de salvar'); },
        showHist: ui.hist === n.id,
        versions: [{ v: 'v' + n.version + ' · atual', at: n.at, text: n.text, vis: visTxt(n.vis) }].concat(DB.t2_notasHist.filter(function (h) { return h.note === n.id; }).map(function (h) { return { v: 'v' + h.version, at: h.at, text: h.text, vis: visTxt(h.vis) }; }))
      };
    });

    var al = T2.al(null);
    if (scn === 'salva') al = T2.al({ kind: 'ok', ic: 'check', t: 'Salva', s: 'Só você vê. Autor, data e versão ficam registrados em cada nota.' });
    if (scn === 'naosalvou') al = T2.al({ ic: 'alert', t: 'Não salvou', s: 'A conexão caiu às 21:14. O texto continua no editor; nada foi perdido.', btn: 'Tentar de novo', fn: function () { ctx.scenario(''); if (draft.trim()) persist(); } });
    if (scn === 'outro') al = T2.al({ ic: 'refresh', t: 'Editada em outro aparelho', s: 'Esta nota foi alterada no ' + (conflictOther ? conflictOther.device + ' às 21:02' : 'outro aparelho') + '. Veja as duas versões antes de salvar.', btn: 'Comparar', fn: function () { ctx.setUi({ cmp: true }); } });
    if (scn === 'salvando') al = T2.al({ kind: 'info', ic: 'clock', t: 'Salvando', s: 'Aguarde a confirmação. O texto fica no editor até a nota ser salva.' });
    if (scn === 'falha') al = T2.al({ ic: 'alert', t: 'Falha ao carregar as notas', s: 'Não foi possível buscar as notas de ' + a.first + ' às 21:10. O que você escrever fica no editor.', btn: 'Corrigir', fn: function () { ctx.scenario(''); } });
    if (scn === 'conflito') al = T2.al({ ic: 'alert', t: 'Conflito', s: 'Você e outro aparelho alteraram a mesma nota. Nada foi sobrescrito: revise antes de salvar.', btn: 'Revisar', fn: function () { ctx.setUi({ cmp: true }); } });
    if (scn === 'vispend') al = T2.al({ ic: 'clock', t: 'Mudança de visibilidade pendente', s: 'A nota de ' + (first ? first.at.split(' ')[0] : 'hoje') + ' está passando de privada para compartilhada com ' + a.first + ', mas ainda não confirmamos.', btn: 'Consultar de novo', fn: function () { if (first) first.vis = 'compartilhada'; ctx.scenario(''); ctx.toast('Confirmado: a nota está compartilhada com ' + a.first); } });

    return {
      first: a.first, al: al, list: list, hasList: list.length > 0 && scn !== 'falha', noList: list.length === 0 && scn !== 'falha',
      ed: {
        title: editing ? 'Editar nota de ' + editing.at.split(' ')[0] : 'Nova nota', draft: draft, count: draft.length + '/1000',
        set: function (e) { ctx.setUi({ draft: U.val(e), err: '', saveErr: false, edit: editId, base: base }); },
        vis: T2.opts([['privada', 'Só você vê'], ['compartilhada', 'Compartilhada com ' + a.first]], vis, function (k) { ctx.setUi({ vis: k, edit: editId, draft: draft, base: base }); }),
        visHelp: vis === 'compartilhada' ? a.first + ' verá esta nota no app depois que você revisar e salvar. Não vira mensagem.' : 'Nota privada: não aparece para ' + a.first + ', na conversa nem em relatórios.',
        ctxs: T2.opts(CTX.map(function (c) { return [c, c]; }), nctx, function (k) { ctx.setUi({ nctx: k, edit: editId, draft: draft, base: base }); }),
        hasErr: !!ui.err, err: ui.err || '', status: status, save: save, isBusy: scn === 'salvando', busyAria: String(scn === 'salvando'),
        isEdit: !!editing,
        reset: function () { ctx.setUi({ edit: '', draft: '', vis: 'privada', nctx: 'Carga', base: 0, err: '', saveErr: false, savedAt: '', cmp: false, resolved: false }); }
      },
      cmp: { on: !!ui.cmp && !!editing, mine: draft, other: conflictOther ? conflictOther.text : '', otherMeta: conflictOther ? 'Outro aparelho (' + conflictOther.device + ') · ' + conflictOther.at + ' · v' + conflictOther.version : '', mineMeta: 'Este aparelho · rascunho sobre a v' + base, keepMine: resolve('mine'), useOther: resolve('other'), both: resolve('both'), close: function () { ctx.setUi({ cmp: false }); } },
      talk: function () { ctx.go('TRE25', { id: a.id }); },
      toStudent: function () { ctx.go('H05', { id: a.id }); }
    };
  }
});
