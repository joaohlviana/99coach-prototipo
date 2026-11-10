/* TRE05 · Editor e prévia de formulário: perguntas (adicionar, tipo, obrigatória, reordenar sem arrastar), prévia "como o aluno verá"
   com validação real (nada é enviado), salvar rascunho com versão, publicar versão; campo usado em respostas bloqueia mudança destrutiva */
REG.screen({
  page: 'treinador', key: 'formEditor', id: 'TRE05', title: 'Editor de formulário', mtitle: 'Editor', nav: 'formularios', back: 'TRE04',
  testIds: ['f1', 'f3'],
  normal: 'Editando',
  scens: [['salvo', 'Salvo como rascunho'], ['usado', 'Campo usado em respostas'], ['falhou', 'Falhou ao salvar'], ['salvando', 'Salvando'],
    ['conflito', 'Conflito de versão'], ['invalida', 'Pergunta inválida']],
  vals: function (ctx) {
    var T = window.T3, ui = ctx.ui, scn = ctx.scn;
    var fid = ctx.id || 'f1', f = DB.find('formularios', fid);
    var set = function (o) { ctx.setUi(o); };
    if (!f) return { found: false, notFound: true, back: function () { GO('TRE04'); } };
    var draft = DB.t3_formRasc[fid] || null;
    var isDraftForm = f.status === 'rascunho';
    var nextV = draft ? draft.version : (isDraftForm ? f.version : f.version + 1);
    var pubQs = DB.t3_perguntas[fid] || [];
    var qs = T.formQs(fid);
    var ensure = function () {
      if (!DB.t3_formRasc[fid]) DB.t3_formRasc[fid] = { questions: T.clone(pubQs), version: nextV, dirty: false, saved: false, savedAt: '' };
      return DB.t3_formRasc[fid];
    };
    var edit = function (fn, o) { var d = ensure(); fn(d.questions, d); d.dirty = true; set(Object.assign({ nt: '' }, o || {})); };

    // situação desenhada: a 2ª pergunta sem enunciado até o treinador corrigir
    var ovrIdx = scn === 'invalida' && !ui.scnDone && qs.length > 1 ? 1 : -1;
    var labelOf = function (q, i) { return i === ovrIdx ? '' : q.label; };
    var errOf = function (q, i) {
      if (!String(labelOf(q, i)).trim()) return 'Escreva o enunciado da pergunta.';
      if ((q.type === 'unica' || q.type === 'multipla') && (q.options || []).filter(function (x) { return String(x).trim(); }).length < 2) return 'Inclua pelo menos 2 opções, uma por linha.';
      return '';
    };
    var errs = qs.map(errOf).filter(Boolean).length;
    var firstErr = qs.findIndex ? qs.findIndex(function (q, i) { return !!errOf(q, i); }) : -1;
    var tried = !!ui.tried || scn === 'invalida';
    var usedBlock = function (q) { set({ nt: 'usado', usedQ: q.label }); };

    var items = qs.map(function (q, i) {
      var open = ui.open === q.id || (tried && i === firstErr && ui.open === undefined);
      var err = tried ? errOf(q, i) : '';
      var types = T.QTYPES.map(function (t) {
        var on = q.type === t[0], off = q.used && !on;
        return { label: t[1], cls: 'chip' + (on ? ' is-on' : '') + (off ? ' is-off' : ''), on: String(on), off: String(off),
          pick: function () { if (on) return; if (q.used) { usedBlock(q); return; } edit(function (a) { a[i].type = t[0]; if ((t[0] === 'unica' || t[0] === 'multipla') && !(a[i].options || []).length) a[i].options = ['Opção 1', 'Opção 2']; }); } };
      });
      return {
        key: q.id, n: String(i + 1), label: labelOf(q, i), shownLabel: labelOf(q, i) || 'Pergunta sem enunciado', type: T.qtype(q.type),
        meta: T.qtype(q.type) + (q.unit ? ' · ' + q.unit : '') + (q.req ? ' · obrigatória' : ''), used: !!q.used, err: err, hasErr: !!err,
        rowCls: 'card t3-q' + (err ? ' is-err' : '') + (open ? ' is-open' : ''), open: open, openOn: String(open),
        toggle: function () { set({ open: open ? '' : q.id }); },
        setLabel: function (e) { var v = U.val(e); edit(function (a) { a[i].label = v; }, i === ovrIdx ? { scnDone: true, open: q.id } : { open: q.id }); },
        types: types,
        reqOn: String(!!q.req), reqCls: 'check' + (q.req ? ' is-on' : ''),
        toggleReq: function () { edit(function (a) { a[i].req = !a[i].req; }, { open: q.id }); },
        isNum: q.type === 'numero', unit: q.unit || '', setUnit: function (e) { var v = U.val(e); edit(function (a) { a[i].unit = v; }, { open: q.id }); },
        isChoice: q.type === 'unica' || q.type === 'multipla', optsText: (q.options || []).join('\n'),
        setOpts: function (e) { var v = String(U.val(e)); edit(function (a) { a[i].options = v.split('\n'); }, { open: q.id }); },
        upCls: 'btn btn--outline btn--sm t3-sq' + (i === 0 ? ' is-off' : ''), downCls: 'btn btn--outline btn--sm t3-sq' + (i === qs.length - 1 ? ' is-off' : ''),
        upOff: String(i === 0), downOff: String(i === qs.length - 1),
        up: function () { if (i === 0) return; edit(function (a) { var t = a[i - 1]; a[i - 1] = a[i]; a[i] = t; }); ctx.toast('Pergunta ' + (i + 1) + ' agora é a ' + i + '.'); },
        down: function () { if (i >= qs.length - 1) return; edit(function (a) { var t = a[i + 1]; a[i + 1] = a[i]; a[i] = t; }); ctx.toast('Pergunta ' + (i + 1) + ' agora é a ' + (i + 2) + '.'); },
        remove: function () {
          if (q.used) {
            ctx.ask({ title: 'Remover da próxima versão?', text: '“' + q.label + '” sai da v' + nextV + '. As respostas já recebidas continuam guardadas na v' + f.version + '.', ok: 'Remover da v' + nextV, danger: true,
              onOk: function () { edit(function (a) { a.splice(i, 1); }); } });
          } else edit(function (a) { a.splice(i, 1); });
        },
        duplicateNew: function () { edit(function (a) { a.splice(i + 1, 0, Object.assign(T.clone(q), { id: 'q' + DB.uid(''), label: q.label + ' (nova)', used: false })); }); }
      };
    });
    var addQ = function () { var id = 'q' + DB.uid(''); edit(function (a) { a.push({ id: id, label: '', type: 'curto', req: false, unit: '', options: [], used: false }); }, { open: id }); };

    // ---------- prévia ----------
    var pa = ui.pa || {}, pErr = ui.pErr || {};
    var setPa = function (id, v) { var o = Object.assign({}, pa); o[id] = v; var e = Object.assign({}, pErr); delete e[id]; set({ pa: o, pErr: e }); };
    var prev = qs.map(function (q, i) {
      var val = pa[q.id];
      var opts = q.type === 'escala' ? ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] : (q.type === 'simnao' ? ['Sim', 'Não'] : (q.options || []).filter(function (x) { return String(x).trim(); }));
      return { key: q.id, label: labelOf(q, i) || 'Pergunta sem enunciado', req: !!q.req, unit: q.unit || '', hasUnit: !!q.unit,
        isText: q.type === 'curto', isLong: q.type === 'longo', isNum: q.type === 'numero', isOpts: ['unica', 'multipla', 'escala', 'simnao'].indexOf(q.type) >= 0,
        val: typeof val === 'string' ? val : '', set: function (e) { setPa(q.id, String(U.val(e))); },
        opts: opts.map(function (o) {
          var on = q.type === 'multipla' ? (Array.isArray(val) && val.indexOf(o) >= 0) : val === o;
          return { label: o, cls: 'chip' + (on ? ' is-on' : ''), on: String(on), pick: function () {
            if (q.type === 'multipla') { var arr = Array.isArray(val) ? val.slice() : []; var k = arr.indexOf(o); if (k >= 0) arr.splice(k, 1); else arr.push(o); setPa(q.id, arr); } else setPa(q.id, o);
          } };
        }),
        err: pErr[q.id] || '', hasErr: !!pErr[q.id], cls: 'input' + (pErr[q.id] ? ' is-err' : '') };
    });
    var testSend = function () {
      var e = {};
      qs.forEach(function (q) {
        var v = pa[q.id], empty = v === undefined || v === '' || (Array.isArray(v) && !v.length);
        if (q.req && empty) e[q.id] = 'Resposta obrigatória.';
        else if (q.type === 'numero' && !empty && !/^\d+([.,]\d+)?$/.test(String(v).trim())) e[q.id] = 'Use só números' + (q.unit ? ' (em ' + q.unit + ')' : '') + '.';
      });
      if (Object.keys(e).length) { set({ pErr: e }); ctx.toast(U.plural(Object.keys(e).length, 'campo precisa', 'campos precisam') + ' de ajuste. Teste: nada foi enviado.'); }
      else { set({ pErr: {} }); ctx.toast('Teste ok: nada foi enviado nem gravado.'); }
    };

    // ---------- comparar publicada × rascunho ----------
    var cmp = [];
    if (draft || scn === 'usado' || scn === 'conflito') {
      qs.forEach(function (q) {
        var p = pubQs.find(function (x) { return x.id === q.id; });
        if (!p) cmp.push({ kind: 'Incluída', text: q.label || 'Pergunta sem enunciado' });
        else {
          if (p.label !== q.label) cmp.push({ kind: 'Alterada', text: p.label + ' → ' + (q.label || '—') });
          if (p.type !== q.type) cmp.push({ kind: 'Tipo', text: q.label + ': ' + T.qtype(p.type) + ' → ' + T.qtype(q.type) });
          if (!!p.req !== !!q.req) cmp.push({ kind: 'Regra', text: q.label + (q.req ? ' passa a ser obrigatória' : ' deixa de ser obrigatória') });
        }
      });
      pubQs.forEach(function (p) { if (!qs.find(function (q) { return q.id === p.id; })) cmp.push({ kind: 'Removida', text: p.label + ' (respostas antigas guardadas)' }); });
    }

    // ---------- salvar e publicar ----------
    var save = function () {
      if (scn === 'salvando') { ctx.toast('Ainda salvando. Aguarde a confirmação.'); return; }
      if (errs) { set({ tried: true, nt: 'invalida', open: undefined }); return; }
      if (scn === 'falhou' && !ui.retry) { set({ nt: 'falhou' }); return; }
      if (scn === 'conflito' && !ui.retry) { set({ nt: 'conflito' }); return; }
      var d = ensure(); d.dirty = false; d.saved = true; d.savedAt = T.stamp(); f.updated = U.todayShort;
      set({ nt: 'salvo' });
    };
    var publish = function () {
      if (errs) { set({ tried: true, nt: 'invalida', open: undefined }); return; }
      var old = f.version, isFirst = isDraftForm;
      ctx.ask({ title: 'Publicar a v' + nextV + '?', text: 'Envios futuros usam a v' + nextV + '.',
        lines: isFirst ? ['Ainda não há respostas: nada antigo muda.', 'Você escolhe para quem enviar depois.'] : [U.plural(f.answered, 'resposta já recebida continua', 'respostas já recebidas continuam') + ' ligada' + (f.answered === 1 ? '' : 's') + ' à v' + old + '.', 'Envios pendentes da v' + old + ' continuam valendo até o prazo.'],
        ok: 'Publicar v' + nextV,
        onOk: function () {
          var d = ensure();
          DB.t3_perguntas[fid] = T.clone(d.questions);
          f.version = nextV; f.status = 'publicado'; f.questions = d.questions.length; f.updated = U.todayShort;
          delete DB.t3_formRasc[fid];
          set({ nt: 'publicado' });
        } });
    };
    var actives = DB.alunos.filter(function (a) { return a.status === 'ativo'; });
    var canSend = f.status === 'publicado';

    // ---------- aviso ----------
    var nt = ui.nt !== undefined ? ui.nt : ({ salvo: 'salvo', usado: 'usado', falhou: 'falhou', salvando: 'salvando', conflito: 'conflito', invalida: 'invalida' }[scn] || (ctx.p.novo ? 'novo' : ''));
    var usedQ = ui.usedQ || ((qs.find(function (q) { return q.used; }) || qs[0] || {}).label || 'esta pergunta');
    var notice = T.none();
    var pubTxt = isDraftForm ? '' : '; v' + f.version + ' continua publicada';
    if (nt === 'salvo') notice = T.notice('ok', 'check', 'Salvo como rascunho', 'v' + nextV + ' em edição' + pubTxt + '. ' + (draft && draft.savedAt ? 'Salvo em ' + draft.savedAt + '.' : ''));
    if (nt === 'usado') notice = T.notice('warn', 'lock', 'Campo usado em respostas', '“' + usedQ + '” já tem respostas: o tipo não muda. Ajustes de texto e regras valem só para a próxima versão.', [['Comparar', function () { set({ cmp: true, nt: '' }); }]]);
    if (nt === 'falhou') notice = T.notice('risk', 'alert', 'Falhou ao salvar', 'Mantém as mudanças neste aparelho. Nada foi publicado.', [['Tentar de novo', function () { ctx.setUi({ retry: true, nt: '' }); ctx.toast('Conexão de volta. Toque em Salvar rascunho.'); }]]);
    if (nt === 'salvando') notice = T.notice('info', 'refresh', 'Salvando', 'Gravando a v' + nextV + ' como rascunho.', [], true);
    if (nt === 'conflito') notice = T.notice('risk', 'swap', 'Conflito de versão', 'Este formulário mudou em outro aparelho enquanto você editava. Compare antes de salvar; nada foi sobrescrito.', [['Revisar', function () { set({ cmp: true, retry: true, nt: '' }); }]]);
    if (nt === 'invalida') notice = T.notice('risk', 'alert', 'Pergunta inválida', U.plural(errs || 1, 'pergunta precisa', 'perguntas precisam') + ' de ajuste. O texto digitado continua aqui.', [['Corrigir', function () { var q = qs[firstErr >= 0 ? firstErr : 0]; set({ open: q ? q.id : '', tried: true }); }]]);
    if (nt === 'publicado') notice = T.notice('ok', 'check', 'v' + f.version + ' publicada', 'Envios futuros usam esta versão. Respostas antigas continuam com a versão em que foram respondidas.', [['Enviar', function () { set({ sendOpen: true }); }]]);
    if (nt === 'novo') notice = T.notice('info', 'info', 'Rascunho criado', 'Independente do modelo: edite à vontade e publique quando estiver pronto.');

    var saving = scn === 'salvando';
    var preview = !!ui.preview;
    return {
      found: true, notFound: false, back: function () { GO('TRE04'); },
      name: f.name, setName: function (e) { f.name = String(U.val(e)); ctx.refresh(); },
      sub: isDraftForm ? 'v' + nextV + ' · rascunho · ainda não publicado' : (draft ? 'v' + nextV + ' · rascunho · v' + f.version + ' publicada' : 'v' + f.version + ' publicada · editar cria a v' + nextV),
      purpose: T.formPurpose(fid), stBadge: f.status === 'publicado' ? 'badge badge--ok' : f.status === 'arquivado' ? 'badge badge--plain' : 'badge badge--warn', status: f.status,
      dirty: !!(draft && draft.dirty), dirtyTxt: 'Alterações não salvas · voltar preserva o rascunho',
      nt: notice, saving: saving, notSaving: !saving,
      editMode: !preview, preview: preview, editCls: 'seg__it' + (preview ? '' : ' is-on'), prevCls: 'seg__it' + (preview ? ' is-on' : ''), editOn: String(!preview), prevOn: String(preview),
      toEdit: function () { set({ preview: false }); }, toPreview: function () { set({ preview: true }); },
      items: items, hasItems: items.length > 0, noItems: !items.length, addQ: addQ, count: U.plural(qs.length, 'pergunta', 'perguntas'),
      prev: prev, testSend: testSend, clearTest: function () { set({ pa: {}, pErr: {} }); },
      cmpOpen: !!ui.cmp, toggleCmp: function () { set({ cmp: !ui.cmp }); }, cmp: cmp, hasCmp: cmp.length > 0, noCmp: !cmp.length,
      save: save, saveLabel: saving ? 'Salvando…' : 'Salvar rascunho', saveCls: 'btn btn--primary btn--lg btn--block' + (saving ? ' is-off' : ''),
      publish: publish, pubLabel: 'Publicar v' + nextV,
      canSend: canSend, cantSend: !canSend, send: function () { set({ sendOpen: !ui.sendOpen }); }, sendOpen: !!ui.sendOpen && canSend,
      sendTo: actives.map(function (a) { return { name: a.first, go: function () { GO('TRE06', { id: a.id, form: fid }); } }; }),
      sendHint: 'Envia a v' + f.version + ' publicada.' + (draft ? ' O rascunho v' + nextV + ' não vai junto.' : '')
    };
  }
});
