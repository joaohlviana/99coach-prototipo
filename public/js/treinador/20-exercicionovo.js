/* TRE12 · Criar exercício próprio: identidade, medida, instrução, mídia opcional; nasce privado, publicação no catálogo
   só por pedido com revisão. Salvar → TRE11. Falha não duplica; nome parecido não une exercícios. */
REG.screen({
  page: 'treinador', key: 'exercicioNovo', id: 'TRE12', title: 'Novo exercício', mtitle: 'Criar', nav: 'exercicios', back: 'TRE10', form: true,
  testIds: ['mob-ombro'],
  normal: 'Preenchendo',
  scens: [['salvo', 'Salvo como privado'], ['revisao', 'Em revisão'], ['parecido', 'Já existe parecido'], ['upload', 'Upload inválido'],
    ['processando', 'Processando mídia'], ['falha', 'Falha ao salvar'], ['submissao', 'Submissão em revisão']],
  vals: function (ctx) {
    var T = window.T3, ui = ctx.ui, scn = ctx.scn;
    var editing = ctx.id ? DB.find('exercicios', ctx.id) : null;
    if (editing && !editing.own) editing = null;
    var DSF = { name: 'Wall ball com pausa', equip: 'Bola medicinal', group: 'Condicionamento', measure: 'reps', instr: 'Agache, pause 2 s, lance a bola no alvo.', media: 'none', mediaAlt: '', publish: false };
    var blank = { name: ctx.p.nome || '', equip: '', group: '', measure: 'reps', instr: '', media: 'none', mediaAlt: '', publish: false };
    var start = function () {
      if (editing) return { name: editing.name, equip: editing.equip, group: editing.group, measure: editing.measure || 'reps', instr: (editing.cues || []).join('. ') + '.', media: editing.media === 'sem' ? 'none' : 'ok', mediaAlt: editing.mediaAlt || 'Demonstração de ' + editing.name.toLowerCase(), publish: false };
      if (scn === 'parecido') return Object.assign({}, DSF, { name: 'Agachamento livre com pausa', equip: 'Barra', group: 'Pernas', instr: 'Desça até a coxa paralela, pause 2 s e suba com a coluna neutra.' });
      if (scn === 'upload') return Object.assign({}, DSF, { media: 'invalid' });
      if (scn === 'processando') return Object.assign({}, DSF, { media: 'processing', mediaAlt: 'Wall ball com pausa de 2 s no agachamento' });
      if (scn === 'submissao' || scn === 'revisao') return Object.assign({}, DSF, { publish: true });
      if (scn) return Object.assign({}, DSF);
      if (DB.t3_exRasc.draft) return Object.assign({}, DB.t3_exRasc.draft);
      return blank;
    };
    var f = ui.f || start();
    var set = function (o) { ctx.setUi(o); };
    var setF = function (k, v) { var n = Object.assign({}, f); n[k] = v; set({ f: n }); };

    // ---------- validação ----------
    var errs = {};
    if (String(f.name).trim().length < 3) errs.name = 'Escreva o nome (mínimo 3 letras).';
    if (!String(f.equip).trim()) errs.equip = 'Informe o equipamento ou “Peso do corpo”.';
    if (!f.group) errs.group = 'Escolha o grupo.';
    if (String(f.instr).trim().length < 15) errs.instr = 'Descreva a execução em pelo menos uma frase.';
    if (f.media === 'invalid') errs.media = 'Troque o arquivo ou remova a mídia.';
    if ((f.media === 'ok' || f.media === 'processing') && !String(f.mediaAlt).trim()) errs.mediaAlt = 'Descreva o que a mídia mostra, para quem não pode ver.';
    var tried = !!ui.tried;
    var shown = function (k) { return tried && errs[k] ? errs[k] : ''; };
    var nErr = Object.keys(errs).length;

    var nn = U.norm(f.name);
    var similar = nn.length >= 3 ? DB.exercicios.find(function (x) {
      if (editing && x.id === editing.id) return false; if (ui.savedId && x.id === ui.savedId) return false;
      var xn = U.norm(x.name); return xn === nn || nn.indexOf(xn) >= 0 || xn.indexOf(nn) >= 0;
    }) : null;

    // ---------- salvar ----------
    var cuesOf = function (t) { return String(t).split(/[.;\n]+/).map(function (s) { return s.trim(); }).filter(Boolean); };
    var persist = function () {
      var data = { name: String(f.name).trim(), group: f.group, equip: String(f.equip).trim(), level: 'Personalizado', media: f.media === 'ok' ? 'video' : (f.media === 'processing' ? 'video' : 'sem'), own: true, cues: cuesOf(f.instr), measure: f.measure, mediaAlt: f.mediaAlt, review: !!f.publish };
      var id = editing ? editing.id : ui.savedId;
      var ex = id ? DB.find('exercicios', id) : null;
      if (ex) Object.assign(ex, data);
      else { id = DB.uid('ex'); DB.exercicios.push(Object.assign({ id: id, fav: false }, data)); }
      delete DB.t3_exRasc.draft;
      return id;
    };
    var save = function (force) {
      if (nErr) { set({ tried: true, nt: 'erros' }); return; }
      if (similar && !ui.simOk && force !== true) { set({ tried: true, nt: 'parecido' }); return; }
      if (scn === 'falha' && !ui.retry) { set({ tried: true, nt: 'falha' }); return; }
      var id = persist();
      ctx.setUi({ savedId: id });
      GO('TRE11', { id: id, salvo: '1', pub: f.publish ? '1' : '' });
    };
    var saveDraft = function () { DB.t3_exRasc.draft = Object.assign({}, f); set({ nt: 'rasc', at: U.now() }); };

    // ---------- aviso ----------
    var nt = ui.nt !== undefined ? ui.nt : ({ salvo: 'salvo', revisao: 'revisao', parecido: 'parecido', upload: 'upload', processando: 'processando', falha: 'falha', submissao: 'submissao' }[scn] || (DB.t3_exRasc.draft && !ui.f && !editing ? 'retomado' : ''));
    var notice = T.none();
    if (nt === 'salvo') notice = T.notice('ok', 'check', 'Salvo como privado', 'Só nos seus treinos. Publicar no catálogo é uma decisão separada, com revisão.', [['Ver meus exercícios', function () { GO('TRE10', { aba: 'meus' }); }]]);
    if (nt === 'revisao') notice = T.notice('info', 'clock', 'Em revisão', 'Para entrar no catálogo 99Coach. Enquanto isso, o exercício funciona nos seus treinos.');
    if (nt === 'parecido') notice = T.notice('warn', 'alert', 'Já existe parecido', similar ? similar.name + ' (' + (similar.own ? 'seu' : '99Coach') + ', ' + similar.equip + '). Nome parecido não une exercícios: use o existente ou salve como variante.' : 'Revise o nome antes de salvar.', [similar ? ['Usar o existente', function () { GO('TRE11', { id: similar.id }); }] : null, ['Salvar como variante', function () { ctx.setUi({ simOk: true, nt: '' }); save(true); }]]);
    if (nt === 'upload' && f.media === 'invalid') notice = T.notice('risk', 'alert', 'Upload inválido', 'O arquivo “treino.heic” não é aceito. Use vídeo MP4 ou MOV, ou foto JPG ou PNG. O resto do formulário continua aqui.', [['Corrigir', function () { setF('media', 'none'); }]]);
    if (nt === 'processando' && f.media === 'processing') notice = T.notice('info', 'refresh', 'Processando mídia', 'Você pode salvar agora; a mídia aparece quando terminar.', [['Consultar de novo', function () { var n = Object.assign({}, f, { media: 'ok' }); set({ f: n, nt: '' }); ctx.toast('Mídia pronta.'); }]], true);
    if (nt === 'falha') notice = T.notice('risk', 'alert', 'Falha ao salvar', 'Não salvamos e nada foi duplicado. Seus campos continuam aqui.', [['Corrigir', function () { set({ retry: true, nt: '' }); ctx.toast('Conexão de volta. Toque em Salvar meu exercício.'); }]]);
    if (nt === 'submissao') notice = T.notice('info', 'clock', 'Submissão em revisão', 'O pedido de publicação está em revisão. Avisamos quando houver decisão; nada muda nos seus treinos.', [['Consultar de novo', function () { ctx.toast('Ainda em revisão. Nenhuma ação necessária.'); }]]);
    if (nt === 'erros') notice = T.notice('risk', 'alert', 'Corrija ' + U.plural(nErr, 'campo', 'campos') + ' para salvar', 'O que você escreveu continua aqui.');
    if (nt === 'rasc') notice = T.notice('ok', 'check', 'Rascunho salvo às ' + (ui.at || U.now()), 'Continua aqui quando você voltar. Ainda não aparece no catálogo.');
    if (nt === 'retomado') notice = T.notice('info', 'info', 'Rascunho retomado', 'Você continua de onde parou.', [['Descartar rascunho', function () { delete DB.t3_exRasc.draft; set({ f: blank, nt: '' }); }]]);

    var groups = []; DB.exercicios.forEach(function (e) { if (groups.indexOf(e.group) < 0 && e.group) groups.push(e.group); });
    var EQ = ['Barra', 'Halteres', 'Kettlebell', 'Peso do corpo', 'Bola medicinal', 'Elástico'];
    var media = f.media;
    var MEAS = [['reps', 'Reps'], ['tempo', 'Tempo'], ['dist', 'Distância']];
    var unit = { reps: 'repetições', tempo: 'segundos', dist: 'metros' }[f.measure] || 'repetições';

    return {
      title: editing ? 'Editar exercício' : 'Novo exercício',
      nt: notice,
      name: f.name, setName: function (e) { setF('name', U.val(e)); }, eName: shown('name'), hasEName: !!shown('name'), cName: 'input' + (shown('name') ? ' is-err' : ''),
      equip: f.equip, setEquip: function (e) { setF('equip', U.val(e)); }, eEquip: shown('equip'), hasEEquip: !!shown('equip'), cEquip: 'input' + (shown('equip') ? ' is-err' : ''),
      equips: EQ.map(function (q) { var on = f.equip === q; return { label: q, cls: 'chip' + (on ? ' is-on' : ''), on: String(on), pick: function () { setF('equip', q); } }; }),
      groups: groups.map(function (g) { var on = f.group === g; return { label: g, cls: 'chip' + (on ? ' is-on' : ''), on: String(on), pick: function () { setF('group', g); } }; }),
      eGroup: shown('group'), hasEGroup: !!shown('group'),
      measures: MEAS.map(function (m) { var on = f.measure === m[0]; return { label: m[1], cls: 'seg__it' + (on ? ' is-on' : ''), on: String(on), pick: function () { setF('measure', m[0]); } }; }),
      unitHelp: 'Unidade: ' + unit + '. A carga é prescrita no treino, em kg ou lb.',
      instr: f.instr, setInstr: function (e) { setF('instr', U.val(e)); }, eInstr: shown('instr'), hasEInstr: !!shown('instr'), cInstr: 'input input--area' + (shown('instr') ? ' is-err' : ''),
      mNone: media === 'none', mProc: media === 'processing', mOk: media === 'ok', mBad: media === 'invalid', hasMedia: media !== 'none' && media !== 'invalid',
      addMedia: function () { setF('media', 'processing'); },
      checkMedia: function () { setF('media', 'ok'); },
      removeMedia: function () { var n = Object.assign({}, f, { media: 'none', mediaAlt: '' }); set({ f: n, nt: ui.nt === 'upload' ? '' : ui.nt }); },
      mediaAlt: f.mediaAlt, setAlt: function (e) { setF('mediaAlt', U.val(e)); }, eAlt: shown('mediaAlt'), hasEAlt: !!shown('mediaAlt'), cAlt: 'input' + (shown('mediaAlt') ? ' is-err' : ''),
      eMedia: shown('media'), hasEMedia: !!shown('media'),
      publish: !!f.publish, pubOn: String(!!f.publish), pubCls: 'switch' + (f.publish ? ' is-on' : ''), togglePub: function () { setF('publish', !f.publish); },
      scope: f.publish ? 'Privado até a revisão aprovar a publicação' : 'Privado até você pedir publicação',
      save: save, saveDraft: saveDraft, back: function () { GO('TRE10'); },
      hasSimilar: !!similar && !ui.simOk, similarText: similar ? 'Parecido com ' + similar.name + ' (' + (similar.own ? 'seu' : '99Coach') + ' · ' + similar.equip + ')' : ''
    };
  }
});
