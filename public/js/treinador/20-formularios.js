/* TRE04 · Biblioteca de formulários: modelos 99Coach, meus formulários (estado e versão), criar, duplicar como rascunho,
   arquivar sem apagar respostas, enviar versão publicada (TRE06) e respostas pendentes */
REG.screen({
  page: 'treinador', key: 'formularios', id: 'TRE04', title: 'Formulários', nav: 'formularios',
  normal: 'Biblioteca',
  scens: [['vazio', 'Nenhum formulário'], ['arquivado', 'Arquivado'], ['duplicado', 'Duplicado'], ['semres', 'Nenhum resultado'],
    ['pubfalha', 'Publicação indisponível'], ['leitura', 'Falha de leitura']],
  vals: function (ctx) {
    var T = window.T3, ui = ctx.ui, scn = ctx.scn;
    var set = function (o) { ctx.setUi(o); };
    var tab = ui.tab || 'modelos';
    var q = ui.q !== undefined ? ui.q : (scn === 'semres' ? 'avaliação postural' : '');
    var st = ui.st || 'todos';
    var failedRead = scn === 'leitura' && !ui.fixed;
    var empty = scn === 'vazio' && !ui.created;
    var forms = empty ? [] : DB.formularios;
    var nq = U.norm(q);
    var list = forms.filter(function (f) { return (st === 'todos' || f.status === st) && (!nq || U.norm(f.name + ' ' + T.formPurpose(f.id)).indexOf(nq) >= 0); });

    var newForm = function (name, qs, purpose) {
      var id = DB.uid('f');
      DB.formularios.push({ id: id, name: name, status: 'rascunho', version: 1, questions: qs.length, sent: 0, answered: 0, updated: U.todayShort });
      DB.t3_perguntas[id] = T.clone(qs).map(function (x) { x.used = false; return x; });
      DB.t3_formMeta[id] = { purpose: purpose || 'Geral' };
      return id;
    };
    var useModel = function (m) { var id = newForm(m.name, m.qs, m.purpose); GO('TRE05', { id: id, novo: '1' }); };
    var createBlank = function () { var id = newForm('Novo formulário', [{ id: 'q1', label: '', type: 'curto', req: true, unit: '', options: [], used: false }], 'Geral'); GO('TRE05', { id: id, novo: '1' }); };
    var duplicate = function (f) {
      var id = newForm(f.name + ' (cópia)', T.formQs(f.id), T.formPurpose(f.id));
      set({ menu: '', nt: 'duplicado', dupId: id, st: 'todos' });
    };
    var archive = function (f) {
      ctx.ask({ title: 'Arquivar “' + f.name + '”?', text: 'Sai da lista de envio. Nada é apagado.',
        lines: [U.plural(f.answered, 'resposta continua acessível', 'respostas continuam acessíveis') + ' no perfil de cada aluno.', 'Envios pendentes da v' + f.version + ' continuam valendo até o prazo.', 'Você pode reativar quando quiser.'],
        ok: 'Arquivar modelo', danger: true, onOk: function () { f.status = 'arquivado'; set({ menu: '', nt: 'arquivado', arcName: f.name }); } });
    };
    var actives = DB.alunos.filter(function (a) { return a.status === 'ativo'; });

    var STATUS = { publicado: ['badge badge--ok', 'Publicado'], rascunho: ['badge badge--warn', 'Rascunho'], arquivado: ['badge badge--plain', 'Arquivado'] };
    var rows = list.map(function (f) {
      var s = STATUS[f.status] || STATUS.rascunho;
      var d = DB.t3_formRasc[f.id];
      var pub = f.status === 'publicado';
      var ver = f.status === 'rascunho' ? 'v' + f.version + ' · rascunho' : 'v' + f.version + (d ? ' · v' + d.version + ' em rascunho' : '');
      var fails = scn === 'pubfalha' && pub && !ui.pubOk;
      return {
        id: f.id, name: f.name, purpose: T.formPurpose(f.id), badge: s[0], status: s[1], ver: ver,
        fields: U.plural(T.formQs(f.id).length, 'campo', 'campos'), answers: f.sent ? f.answered + ' de ' + f.sent + ' responderam' : 'ainda não enviado',
        edit: function () { GO('TRE05', { id: f.id }); },
        menuOpen: ui.menu === f.id, menuOn: String(ui.menu === f.id), toggle: function () { set({ menu: ui.menu === f.id ? '' : f.id, send: '' }); },
        dup: function () { duplicate(f); },
        canSend: pub, cantSend: !pub, sendHint: f.status === 'rascunho' ? 'Publique uma versão para enviar.' : 'Reative para enviar.',
        startSend: function () { if (fails) { set({ menu: '', nt: 'pubfalha' }); return; } set({ send: f.id, menu: '' }); },
        sendOpen: ui.send === f.id,
        sendTo: actives.map(function (a) { return { name: a.first, go: function () { GO('TRE06', { id: a.id, form: f.id }); } }; }),
        closeSend: function () { set({ send: '' }); },
        canArchive: f.status !== 'arquivado', isArchived: f.status === 'arquivado',
        archive: function () { archive(f); },
        unarchive: function () { f.status = f.version > 1 || f.sent ? 'publicado' : 'rascunho'; set({ menu: '', nt: 'reativado', arcName: f.name }); },
        responses: function () { set({ tab: 'respostas', menu: '' }); }
      };
    });

    var resps = DB.respostas.filter(function (r) { return tab !== 'pendentes' || r.status === 'pendente'; }).map(function (r) {
      var a = T.aluno(r.student), f = DB.find('formularios', r.form);
      return { who: a ? a.name : 'Aluno', what: (f ? f.name : 'Formulário') + ' · v' + r.version, at: r.at, pend: r.status === 'pendente', badge: r.status === 'pendente' ? 'badge badge--warn' : 'badge badge--ok', st: r.status === 'pendente' ? 'Revisar' : 'Revisado',
        go: function () { GO('TRE06', { id: r.student, form: r.form }); } };
    });
    var pend = T.pendentes();
    var tabs = [['modelos', 'Modelos', ''], ['respostas', 'Respostas', String(DB.respostas.length)], ['pendentes', 'Pendentes', String(pend)]].map(function (t) {
      var on = tab === t[0]; return { label: t[1], n: t[2], hasN: !!t[2], cls: 'utab' + (on ? ' is-on' : ''), sel: String(on), go: function () { set({ tab: t[0], menu: '' }); } };
    });
    var filters = [['todos', 'Todos'], ['publicado', 'Publicados'], ['rascunho', 'Rascunhos'], ['arquivado', 'Arquivados']].map(function (x) {
      var on = st === x[0]; return { label: x[1], cls: 'chip' + (on ? ' is-on' : ''), on: String(on), pick: function () { set({ st: x[0] }); } };
    });
    var models = DB.t3_modelos.map(function (m) { return { name: m.name, purpose: m.purpose, desc: m.desc, n: U.plural(m.qs.length, 'campo', 'campos'), use: function () { useModel(m); } }; });

    var nt = ui.nt !== undefined ? ui.nt : ({ arquivado: 'arquivado', duplicado: 'duplicado', pubfalha: 'pubfalha', leitura: 'leitura' }[scn] || '');
    var notice = T.none();
    var dupId = ui.dupId || ((DB.formularios.filter(function (f) { return f.status === 'rascunho'; }).slice(-1)[0]) || {}).id;
    if (nt === 'arquivado') notice = T.notice('ok', 'check', 'Arquivado', (ui.arcName ? '“' + ui.arcName + '” saiu da lista de envio. ' : '') + 'Respostas continuam acessíveis no perfil de cada aluno.', [['Ver arquivados', function () { set({ st: 'arquivado', nt: '' }); }]]);
    if (nt === 'reativado') notice = T.notice('ok', 'check', 'Reativado', '“' + (ui.arcName || '') + '” voltou para a lista.');
    if (nt === 'duplicado') notice = T.notice('ok', 'check', 'Duplicado', 'Nasce como rascunho v1, sem respostas nem envios.', dupId ? [['Editar cópia', function () { GO('TRE05', { id: dupId }); }]] : []);
    if (nt === 'pubfalha') notice = T.notice('warn', 'alert', 'Publicação indisponível', 'Não conseguimos confirmar a versão publicada agora. Nada foi enviado; tente de novo em instantes.', [['Tentar de novo', function () { set({ pubOk: true, nt: '' }); ctx.toast('Versão publicada confirmada. Pode enviar.'); }]]);
    if (nt === 'leitura' && failedRead) notice = T.notice('risk', 'alert', 'Falha de leitura', 'A lista não carregou. Seus formulários e respostas estão salvos.', [['Corrigir', function () { set({ fixed: true, nt: '' }); }]]);

    return {
      nt: notice, failedRead: failedRead, loaded: !failedRead,
      isEmpty: empty, notEmpty: !empty, create: createBlank, pickModel: function () { set({ models: !ui.models, tab: 'modelos' }); }, modelsOpen: !!ui.models || empty,
      models: models,
      tabs: tabs, isModels: tab === 'modelos', isResp: tab !== 'modelos',
      q: q, setQ: function (e) { set({ q: U.val(e) }); }, hasQ: !!q, clearQ: function () { set({ q: '', st: 'todos' }); },
      filters: filters, rows: rows, hasRows: rows.length > 0, noRows: !empty && !rows.length,
      resps: resps, hasResps: resps.length > 0, noResps: !resps.length,
      respTitle: tab === 'pendentes' ? U.plural(pend, 'resposta pendente', 'respostas pendentes') : U.plural(DB.respostas.length, 'resposta recebida', 'respostas recebidas')
    };
  }
});
