/* TRE07 · Avaliações físicas e evolução do aluno (medidas, comparação só com o mesmo protocolo, fotos privadas) */
REG.screen({
  page: 'treinador', key: 'avaliacoes', id: 'TRE07', title: 'Evolução', nav: 'alunos', back: 'H05', wide: true,
  backParams: function (ctx) { return window.T2.back(ctx); },
  testIds: ['ana', 'marcos', 'lucas'],
  normal: 'Duas ou mais avaliações',
  scens: [['uma', 'Uma medida só'], ['fotos', 'Fotos privadas'], ['protocolo', 'Protocolo diferente'], ['vazio', 'Sem avaliação confirmada'], ['revogado', 'Acesso revogado']],
  vals: function (ctx) {
    var T2 = window.T2, ui = ctx.ui, scn = ctx.scn, a = T2.stu(ctx);
    var PROTOS = ['Pollock 3 dobras', 'Pollock 7 dobras', 'Bioimpedância'];
    var key = function (x) { return T2.fromDm(x.date) || '0'; };
    var list = DB.avaliacoes.filter(function (x) { return x.student === a.id; }).slice().sort(function (x, y) { return key(x) < key(y) ? -1 : 1; });
    if (scn === 'protocolo') list = list.concat([{ id: 't2virt', student: a.id, date: '24/10', protocol: 'Bioimpedância', weight: 61.8, fat: 22.9, waist: 71, notes: 'Balança de bioimpedância da academia', by: 'Rafael Lima', version: 1, origin: 'Avaliação presencial' }]);
    if (scn === 'uma') list = list.slice(-1);
    if (scn === 'vazio' || scn === 'revogado') list = [];
    var byId = function (id) { return list.find(function (x) { return x.id === id; }) || null; };
    var n = list.length;
    var A = byId(ui.ca) || (n > 1 ? list[n - 2] : null), B = byId(ui.cb) || (n ? list[n - 1] : null);
    if (scn === 'protocolo' && n > 1) { A = list[n - 2]; B = list[n - 1]; }
    var same = !!(A && B && A.id !== B.id && A.protocol === B.protocol);
    var M = [['waist', 'Cintura (cm)', 'fita', 1], ['weight', 'Peso (kg)', 'balança', 1], ['fat', '% gordura', 'protocolo', 1], ['hip', 'Quadril (cm)', 'fita', 1], ['arm', 'Braço (cm)', 'fita', 1]];
    var has = function (x, k) { return x && x[k] != null && x[k] !== ''; };
    var rows = M.filter(function (m) { return (m[0] !== 'hip' && m[0] !== 'arm') || has(A, m[0]) || has(B, m[0]); }).map(function (m) {
      var va = has(A, m[0]) ? A[m[0]] : null, vb = has(B, m[0]) ? B[m[0]] : null, diff = '—';
      if (same && va != null && vb != null) { var dd = vb - va; diff = (dd > 0 ? '+' : dd < 0 ? '−' : '') + T2.fmt(Math.abs(dd)) + (m[0] === 'fat' ? ' p.p.' : ''); }
      else if (same) diff = 'sem base';
      return { m: m[1], how: m[0] === 'fat' ? (B ? B.protocol : '') : m[2], a: T2.fmt(va), b: T2.fmt(vb), diff: diff };
    });
    var pick = function (k) { return function (id) { var o = {}; o[k] = id; ctx.setUi(o); }; };
    var optsOf = function (cur, k) { return list.map(function (x) { var on = cur && x.id === cur.id; return { label: x.date, on: String(on), cls: 'opt' + (on ? ' is-on' : ''), pick: function () { pick(k)(x.id); } }; }); };
    var cmp = {
      can: n > 1, one: n === 1, none: n === 0,
      aDate: A ? A.date : '—', bDate: B ? B.date : '—', rows: rows, same: same,
      blocked: n > 1 && !!A && !!B && A.id !== B.id && A.protocol !== B.protocol,
      sameDate: n > 1 && !!A && !!B && A.id === B.id,
      blockT: A && B ? A.protocol + ' (' + A.date + ') e ' + B.protocol + ' (' + B.date + ') medem de jeito diferente. Escolha duas avaliações do mesmo protocolo.' : '',
      proto: B ? 'Protocolo ' + B.protocol + ' · ' + (B.by || 'Rafael Lima') + ' · ' + (B.origin || 'Avaliação presencial') : '',
      optsA: optsOf(A, 'ca'), optsB: optsOf(B, 'cb'),
      oneT: n === 1 ? 'Só há a avaliação de ' + list[0].date + '. Precisa de 2 registros para comparar.' : ''
    };
    cmp.tcls = 't2-tbl ' + (n > 1 ? 't2-tbl--m5' : 't2-tbl--m3');
    cmp.showTable = n > 0 && !cmp.blocked && !cmp.sameDate;

    var hist = list.slice().reverse().map(function (x) {
      var on = ui.det === x.id;
      var parts = []; if (x.weight != null) parts.push(T2.fmt(x.weight) + ' kg'); if (x.fat != null) parts.push(T2.fmt(x.fat) + '% gordura'); if (x.waist != null) parts.push('cintura ' + T2.fmt(x.waist, 0) + ' cm');
      return { date: x.date, proto: x.protocol, sum: parts.join(' · ') || 'sem medidas', ver: 'v' + (x.version || 1), cls: 'lrow t2-lr' + (on ? ' is-on' : ''), cur: String(on), open: function () { ctx.setUi({ det: on ? '' : x.id, form: false }); } };
    });
    var det = byId(ui.det);
    var detail = { on: !!det, kv: [], notes: '', hasNotes: false };
    if (det) {
      detail.kv = T2.kv([['Data', det.date], ['Protocolo', det.protocol], ['Peso', det.weight != null ? T2.fmt(det.weight) + ' kg' : '—'], ['% gordura', det.fat != null ? T2.fmt(det.fat) + '%' : '—'], ['Cintura', det.waist != null ? T2.fmt(det.waist, 0) + ' cm' : '—'], ['Avaliador', det.by || 'Rafael Lima'], ['Origem', det.origin || 'Avaliação presencial'], ['Versão', 'v' + (det.version || 1) + (det.editedAt ? ' · corrigida ' + det.editedAt : '')]]);
      detail.notes = det.notes || ''; detail.hasNotes = !!det.notes;
      detail.fix = function () { ctx.setUi({ form: true, edit: det.id, f: { date: det.date, protocol: det.protocol, weight: det.weight != null ? T2.fmt(det.weight) : '', fat: det.fat != null ? T2.fmt(det.fat) : '', waist: det.waist != null ? T2.fmt(det.waist, 0) : '', hip: det.hip != null ? T2.fmt(det.hip, 0) : '', arm: det.arm != null ? T2.fmt(det.arm, 0) : '', notes: det.notes || '', more: det.hip != null || det.arm != null }, err: {} }); };
      detail.close = function () { ctx.setUi({ det: '' }); };
      detail.isVirtual = det.id === 't2virt';
    } else { detail.fix = function () {}; detail.close = function () {}; detail.isVirtual = false; }

    // formulário de nova avaliação / correção
    var f = Object.assign({ date: U.todayShort, protocol: 'Pollock 3 dobras', weight: '', fat: '', waist: '', hip: '', arm: '', notes: '', more: false }, ui.f || {});
    var err = ui.err || {};
    var setF = function (k) { return function (e) { var o = Object.assign({}, f); o[k] = U.val(e); var er = Object.assign({}, err); delete er[k]; delete er.all; ctx.setUi({ f: o, err: er }); }; };
    var save = function () {
      var er = {}, iso = T2.fromDm(f.date);
      if (!iso) er.date = 'Use dia/mês, por exemplo 26/10.'; else if (iso > T2.TODAY) er.date = 'A data não pode estar no futuro.';
      var LIM = { weight: [30, 250, 'Peso entre 30 e 250 kg.'], fat: [3, 60, '% de gordura entre 3 e 60.'], waist: [40, 200, 'Cintura entre 40 e 200 cm.'], hip: [50, 200, 'Quadril entre 50 e 200 cm.'], arm: [15, 70, 'Braço entre 15 e 70 cm.'] };
      var vals = {}, any = false;
      Object.keys(LIM).forEach(function (k) {
        var raw = String(f[k] || '').trim(); if (!raw) { vals[k] = null; return; }
        var v = T2.num(raw); if (v == null || v < LIM[k][0] || v > LIM[k][1]) { er[k] = LIM[k][2]; return; }
        vals[k] = v; any = true;
      });
      if (!any && !Object.keys(er).length) er.all = 'Registre pelo menos uma medida. Campo vazio fica vazio: nunca vira zero.';
      if (Object.keys(er).length) { ctx.setUi({ err: er }); return; }
      var x;
      if (ui.edit && DB.find('avaliacoes', ui.edit)) {
        x = DB.find('avaliacoes', ui.edit);
        x.version = (x.version || 1) + 1; x.editedAt = U.todayShort + ' ' + U.now(); x.by = x.by || 'Rafael Lima';
      } else {
        x = { id: DB.uid('a'), student: a.id, by: 'Rafael Lima', version: 1, origin: 'Avaliação presencial', created: U.todayShort + ' ' + U.now() };
        DB.avaliacoes.push(x);
      }
      x.date = f.date.trim(); x.protocol = f.protocol; x.notes = f.notes.trim();
      Object.keys(vals).forEach(function (k) { if (vals[k] == null) delete x[k]; else x[k] = vals[k]; });
      if (a.id === 'ana' && vals.weight != null && DB.evolucao && !ui.edit) DB.evolucao.peso.push([x.date, vals.weight]);
      ctx.setUi({ form: false, edit: '', f: null, err: {}, det: x.id, cb: x.id });
      ctx.toast('Avaliação salva · v' + x.version + ' · ' + x.date);
    };
    var form = {
      on: !!ui.form, isEdit: !!ui.edit, title: ui.edit ? 'Corrigir avaliação' : 'Nova avaliação', f: f,
      protos: PROTOS.map(function (p) { var on = p === f.protocol; return { label: p, on: String(on), cls: 'opt' + (on ? ' is-on' : ''), pick: function () { ctx.setUi({ f: Object.assign({}, f, { protocol: p }) }); } }; }),
      setDate: setF('date'), setWeight: setF('weight'), setFat: setF('fat'), setWaist: setF('waist'), setHip: setF('hip'), setArm: setF('arm'), setNotes: setF('notes'),
      eDate: err.date || '', hasEDate: !!err.date, eWeight: err.weight || '', hasEWeight: !!err.weight, eFat: err.fat || '', hasEFat: !!err.fat, eWaist: err.waist || '', hasEWaist: !!err.waist,
      eHip: err.hip || '', hasEHip: !!err.hip, eArm: err.arm || '', hasEArm: !!err.arm, eAll: err.all || '', hasEAll: !!err.all,
      cDate: err.date ? 'input is-err' : 'input', cWeight: err.weight ? 'input is-err' : 'input', cFat: err.fat ? 'input is-err' : 'input', cWaist: err.waist ? 'input is-err' : 'input', cHip: err.hip ? 'input is-err' : 'input', cArm: err.arm ? 'input is-err' : 'input',
      more: !!f.more, noMore: !f.more, addMore: function () { ctx.setUi({ f: Object.assign({}, f, { more: true }) }); },
      save: save, cancel: function () { ctx.setUi({ form: false, edit: '', f: null, err: {} }); }
    };

    // fotos privadas: só aluno e treinador do vínculo, abertas com finalidade
    var photos = DB.arquivos.filter(function (x) { return x.student === a.id && (x.kind === 'foto' || x.kind === 'imagem'); }).map(function (x) {
      return { name: x.name, at: x.at, src: x.url || '', hasSrc: !!x.url, noSrc: !x.url };
    });
    var openPhotos = function () {
      ctx.ask({ title: 'Abrir fotos privadas', text: 'Finalidade: acompanhar postura e evolução de ' + a.first + '. As fotos ficam visíveis só para ' + a.first + ' e você e nunca entram em vitrine, perfil ou anúncios.', lines: ['O acesso fica registrado com data e hora.', 'Nenhum link público é gerado.'], ok: 'Continuar', onOk: function () { ctx.setUi({ photos: true }); } });
    };
    var ph = { list: photos, has: photos.length > 0, none: photos.length === 0, open: !!ui.photos && scn !== 'revogado', closed: !ui.photos || scn === 'revogado', count: U.plural(photos.length, 'foto', 'fotos'), openFn: openPhotos, hide: function () { ctx.setUi({ photos: false }); }, files: function () { ctx.go('TRE08', { id: a.id }); } };

    var al = T2.al(null);
    if (scn === 'uma') al = T2.al({ kind: 'info', ic: 'info', t: 'Uma medida só', s: 'Precisa de 2 registros para comparar. Nada é mostrado como progresso até lá.', btn: 'Nova avaliação', fn: function () { ctx.setUi({ form: true, edit: '', f: null, err: {} }); } });
    if (scn === 'fotos') al = T2.al({ kind: 'info', ic: 'lock', t: 'Fotos privadas', s: 'Só ' + a.first + ' e você, treinador do vínculo, podem ver. Abrir exige confirmar a finalidade.', btn: 'Continuar', fn: openPhotos });
    if (scn === 'protocolo') al = T2.al({ ic: 'alert', t: 'Protocolo diferente', s: 'Comparação bloqueada: ' + cmp.blockT, btn: 'Consultar de novo', fn: function () { ctx.scenario(''); } });
    if (scn === 'revogado') al = T2.al({ kind: 'risk', ic: 'lock', t: 'Acesso revogado', s: a.first + ' encerrou o compartilhamento de avaliações e fotos em 25/10. O histórico continua com ' + a.first + '; você não vê mais os registros.', btn: 'Saiba por quê', fn: function () { ctx.ask({ title: 'Por que o acesso acabou', text: 'O aluno pode retirar a qualquer momento o compartilhamento de medidas e fotos. Você continua vendo só o que é necessário para o treino.', lines: ['Avaliações e fotos não são apagadas: ficam com o aluno.', 'Para voltar a ver, peça um novo compartilhamento pela conversa.'], ok: 'Entendi', cancel: false }); } });

    var revoked = scn === 'revogado';
    return {
      first: a.first, al: al, cmp: cmp, hist: hist, hasHist: hist.length > 0, detail: detail, form: form, ph: ph,
      revoked: revoked, notRevoked: !revoked, empty: n === 0 && !revoked,
      sub: n ? U.plural(n, 'avaliação confirmada', 'avaliações confirmadas') + ' · medidas e fotos privadas' : 'Medidas e fotos privadas',
      newEval: function () { if (revoked) { ctx.toast('Sem acesso: peça um novo compartilhamento a ' + a.first); return; } ctx.setUi({ form: true, edit: '', f: null, err: {}, det: '' }); },
      files: function () { ctx.go('TRE08', { id: a.id }); },
      toStudent: function () { ctx.go('H05', { id: a.id }); },
      talk: function () { ctx.go('TRE25', { id: a.id }); }
    };
  }
});
