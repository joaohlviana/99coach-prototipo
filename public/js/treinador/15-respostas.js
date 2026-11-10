/* TRE06 · Enviar formulário e analisar respostas do aluno */
REG.screen({
  page: 'treinador', key: 'respostas', id: 'TRE06', title: 'Respostas', nav: 'alunos', back: 'H05', wide: true,
  backParams: function (ctx) { return window.T2.back(ctx); },
  testIds: ['ana', 'marcos', 'lucas'],
  normal: 'Respondido',
  scens: [['pendente', 'Pendente'], ['mudou', 'Pergunta mudou'], ['semresp', 'Sem resposta'], ['expirado', 'Link expirado'], ['permissao', 'Permissão alterada'], ['desconhecido', 'Confirmação desconhecida']],
  vals: function (ctx) {
    var T2 = window.T2, ui = ctx.ui, scn = ctx.scn, a = T2.stu(ctx);
    var form = function (id) { return DB.find('formularios', id) || { name: 'Formulário', questions: 0, version: 1, status: 'publicado' }; };
    var resp = function (id) { return DB.find('respostas', id) || DB.find('t2_respostas', id); };
    var list = DB.t2_envios.filter(function (e) { return e.student === a.id; });
    var def = list.find(function (e) { return e.status === 'respondido'; }) || list[0] || null;
    if (scn === 'pendente') def = list.find(function (e) { return e.status === 'pendente'; }) || def;
    var real = (ui.sel && DB.find('t2_envios', ui.sel)) || def;
    // a situação muda só a exibição do envio escolhido
    var sel = real ? Object.assign({}, real) : null;
    if (sel && scn === 'pendente') { sel.status = 'pendente'; sel.resp = ''; }
    if (sel && scn === 'semresp') { sel.status = 'sem resposta'; sel.resp = ''; sel.due = '24/10'; }
    if (sel && scn === 'expirado') { sel.status = 'pendente'; sel.resp = ''; sel.expired = true; }
    var ST = { pendente: ['Aguardando resposta', 'badge badge--warn'], respondido: ['Respondido', 'badge badge--ok'], revisado: ['Revisado', 'badge badge--ink'], 'sem resposta': ['Sem resposta', 'badge badge--plain'] };
    var st = function (e) { return ST[e.status] || ST.pendente; };

    var rows = list.map(function (e) {
      var shown = sel && e.id === sel.id ? sel : e, f = form(e.form), on = !!sel && e.id === sel.id;
      return { name: f.name, ver: 'v' + e.version, st: st(shown)[0], stCls: st(shown)[1], sent: e.sent, due: e.due, cls: 't2-tbl__r' + (on ? ' is-on' : ''), rcls: 'lrow t2-lr' + (on ? ' is-on' : ''), cur: String(on), pick: function () { ctx.setUi({ sel: e.id, cmp: false, note: '' }); } };
    });

    // detalhe
    var d = { has: !!sel, form: '', ver: '', kv: [], answers: [], hasAnswers: false, noAnswers: false, noAnsT: '', noAnsS: '', isResp: false, isPend: false, isRev: false, isNone: false, revT: '', revS: '', code: '' };
    var cmp = { has: false, open: false, prev: '', rows: [], none: false, noneT: '' };
    if (sel) {
      var f = form(sel.form), r = sel.resp ? resp(sel.resp) : null;
      d.form = f.name; d.ver = 'v' + sel.version + ' · ' + U.plural(f.questions, 'pergunta', 'perguntas'); d.code = sel.code;
      d.kv = [['Destinatário', a.name], ['Versão', 'v' + sel.version], ['Enviado', sel.sent], ['Prazo', sel.due], ['Estado', st(sel)[0].toLowerCase()]];
      if (sel.reminders) d.kv.push(['Lembretes', String(sel.reminders) + ' · mesmo envio']);
      if (r && scn !== 'permissao') {
        d.answers = r.answers.concat(sel.resp && DB.t2_respExtra[sel.resp] ? DB.t2_respExtra[sel.resp] : []).map(function (x) { return { q: x[0], a: x[1] }; });
        d.kv.splice(4, 0, ['Respondido', r.at]);
      }
      d.hasAnswers = d.answers.length > 0;
      d.noAnswers = !d.hasAnswers;
      d.noAnsT = scn === 'permissao' ? 'Respostas ocultas' : (sel.status === 'sem resposta' ? 'Sem resposta' : 'Aguardando resposta');
      d.noAnsS = scn === 'permissao' ? a.first + ' alterou o que compartilha com você. Nada é mostrado até revisar o vínculo.' : (sel.status === 'sem resposta' ? 'O prazo de ' + sel.due + ' passou sem resposta. Isso não vira zero nem entra em comparação.' : 'Enviado em ' + sel.sent + ' · prazo ' + sel.due + '. Responder não é o mesmo que revisar: a revisão vem depois.');
      d.isResp = sel.status === 'respondido' && scn !== 'permissao';
      d.isPend = sel.status === 'pendente';
      d.isNone = sel.status === 'sem resposta';
      d.isRev = sel.status === 'revisado';
      d.revT = 'Revisão registrada';
      d.revS = (sel.reviewedAt || '') + (sel.note ? ' · ' + sel.note : '');
      var c = sel.resp ? DB.t2_comparar[sel.resp] : null;
      cmp.has = !!sel.resp && scn !== 'permissao';
      cmp.open = !!ui.cmp || scn === 'mudou';
      if (c) {
        cmp.prev = 'Comparado com ' + c.prev;
        cmp.rows = c.rows.map(function (x) { return { q: x.q, t: x.ok ? x.a + ' → ' + x.b + ' (' + x.note + ')' : x.note, cls: x.ok ? 't2-cmp__r' : 't2-cmp__r is-off', off: !x.ok, ok: !!x.ok }; });
      } else { cmp.none = true; cmp.noneT = 'Primeira resposta deste formulário: ainda não há o que comparar.'; }
    }
    cmp.hasRows = cmp.rows.length > 0;

    // registrar revisão: atualiza a pendência do aluno e volta ao Aluno 360
    var review = function () {
      var e = sel && DB.find('t2_envios', sel.id);
      if (!e) return;
      e.status = 'revisado'; e.reviewedAt = U.todayShort + ' ' + U.now(); e.note = (ui.note || '').trim() || (scn === 'semresp' ? 'Revisado sem resposta' : 'Revisado');
      var r = DB.find('respostas', e.resp); if (r) { r.status = 'revisado'; r.review = e.note; }
      var still = DB.t2_envios.some(function (x) { return x.student === a.id && x.status === 'respondido'; });
      if (a.flag && (a.flag.kind === 'resposta' || a.flag.kind === 'dor') && !still) a.flag = null;
      ctx.go('H05', { id: a.id });
    };
    var remind = function () {
      var e = sel && DB.find('t2_envios', sel.id);
      if (!e) return;
      e.reminders = (e.reminders || 0) + 1;
      ctx.toast('Lembrete enviado para ' + a.first + ' · o mesmo formulário, sem duplicar');
    };

    // envio de formulário
    var pub = DB.formularios.filter(function (f) { return f.status === 'publicado'; });
    var drafts = DB.formularios.filter(function (f) { return f.status !== 'publicado'; });
    var DUE = [['3', '29/10', '3 dias'], ['7', '02/11', '7 dias'], ['14', '09/11', '14 dias']];
    var preF = ctx.p.form && pub.some(function (f) { return f.id === ctx.p.form; }) ? ctx.p.form : '';
    var sForm = ui.sForm || preF, sDue = ui.sDue || '7';
    var dueDate = (DUE.find(function (x) { return x[0] === sDue; }) || DUE[1])[1];
    var pickedF = sForm ? DB.find('formularios', sForm) : null;
    var send = {
      open: (!!ui.sendOpen || (!!preF && !('sendOpen' in ui))) && !ui.receipt,
      forms: pub.map(function (f) { var on = f.id === sForm; return { label: f.name + ' · v' + f.version, on: String(on), cls: 'opt' + (on ? ' is-on' : ''), pick: function () { ctx.setUi({ sForm: f.id, sErr: '' }); } }; }),
      hasDrafts: drafts.length > 0, drafts: drafts.map(function (f) { return f.name + ' (rascunho)'; }).join(', '),
      dues: DUE.map(function (x) { var on = x[0] === sDue; return { label: x[2] + ' · ' + x[1], on: String(on), cls: 'opt' + (on ? ' is-on' : ''), pick: function () { ctx.setUi({ sDue: x[0] }); } }; }),
      hasErr: !!ui.sErr, err: ui.sErr || '',
      hasPrev: !!pickedF, prev: pickedF ? [['Para', a.name + ' · ' + a.svc], ['Formulário', pickedF.name], ['Versão', 'v' + pickedF.version + ' · ' + U.plural(pickedF.questions, 'pergunta', 'perguntas')], ['Prazo', dueDate]] : [],
      close: function () { ctx.setUi({ sendOpen: false, sErr: '' }); },
      editModel: function () { ctx.go('TRE05', { id: sForm || 'f2' }); },
      submit: function () {
        if (!pickedF) { ctx.setUi({ sErr: 'Escolha um formulário publicado.' }); return; }
        var dup = DB.t2_envios.find(function (e) { return e.student === a.id && e.form === pickedF.id && e.status === 'pendente'; });
        if (dup) {
          ctx.ask({ title: 'Já existe um envio pendente', text: pickedF.name + ' foi enviado em ' + dup.sent + ' e ainda aguarda resposta. Enviar um lembrete do mesmo envio, sem duplicar?', ok: 'Enviar lembrete', onOk: function () { dup.reminders = (dup.reminders || 0) + 1; ctx.setUi({ sendOpen: false, sel: dup.id }); ctx.toast('Lembrete enviado · sem duplicar o formulário'); } });
          return;
        }
        var id = DB.uid('e'), code = 'ENV-' + (2051 + DB.t2_envios.length);
        DB.t2_envios.unshift({ id: id, student: a.id, form: pickedF.id, version: pickedF.version, sent: U.todayShort, due: dueDate, status: 'pendente', resp: '', code: code, reminders: 0, at: U.now() });
        pickedF.sent = (pickedF.sent || 0) + 1;
        ctx.setUi({ sendOpen: false, receipt: id, sel: id, sForm: '', sErr: '' });
      }
    };
    var rc = ui.receipt ? DB.find('t2_envios', ui.receipt) : null;
    var receipt = { on: !!rc, kv: rc ? [['Código', rc.code], ['Formulário', form(rc.form).name + ' · v' + rc.version], ['Para', a.name], ['Enviado', rc.sent + ' às ' + (rc.at || U.now())], ['Prazo', rc.due], ['Estado', 'aguardando resposta']] : [], close: function () { ctx.setUi({ receipt: '' }); } };

    // situações
    var al = T2.al(null);
    if (scn === 'mudou') al = T2.al({ ic: 'clock', t: 'Pergunta mudou', s: 'A pergunta de sono mudou na v2 (de horas para qualidade de 0 a 10). A comparação dela foi interrompida; as outras seguem válidas.', btn: 'Consultar de novo', fn: function () { ctx.scenario(''); } });
    if (scn === 'pendente') al = T2.al({ kind: 'info', ic: 'clock', t: 'Aguardando resposta', s: 'Ainda não há o que revisar. Se precisar, envie um lembrete do mesmo formulário, sem duplicar.', btn: 'Enviar lembrete', fn: remind });
    if (scn === 'semresp') al = T2.al({ kind: 'info', ic: 'info', t: 'Sem resposta', s: 'O prazo passou. Ausência de resposta não vira “zero” nem entra em comparação. Você pode registrar a revisão assim mesmo.' });
    if (scn === 'expirado') al = T2.al({ ic: 'link', t: 'Link expirado', s: 'O link deste envio venceu em ' + (sel ? sel.due : '24/10') + '. Gere um novo link para o mesmo envio; as respostas parciais continuam guardadas.', btn: 'Corrigir', fn: function () { ctx.scenario(''); ctx.toast('Novo link enviado para ' + a.first + ' · vale até 02/11 · mesmo envio'); } });
    if (scn === 'permissao') al = T2.al({ ic: 'lock', t: 'Permissão alterada', s: a.first + ' mudou o compartilhamento em 25/10. As respostas ficam ocultas até você revisar o vínculo com ' + a.first + '.', btn: 'Revisar', fn: function () { ctx.go('H05', { id: a.id }); } });
    if (scn === 'desconhecido') al = T2.al({ ic: 'clock', t: 'Confirmação desconhecida', s: 'O envio de ' + (sel ? form(sel.form).name : 'formulário') + ' às 21:10 não respondeu. Consultamos o mesmo envio antes de repetir, para não mandar duas vezes.', btn: 'Consultar de novo', fn: function () { ctx.scenario(''); ctx.toast('Envio confirmado · ' + (sel ? sel.code : 'ENV') + ' · nada foi duplicado'); } });

    var pendCount = list.filter(function (e) { return e.status === 'respondido'; }).length;
    return {
      first: a.first, name: a.name,
      sub: U.plural(list.length, 'envio', 'envios') + ' · ' + (pendCount ? U.plural(pendCount, 'resposta para revisar', 'respostas para revisar') : 'nada para revisar agora'),
      al: al, rows: rows, hasRows: rows.length > 0, noRows: rows.length === 0,
      d: Object.assign(d, { kv: T2.kv(d.kv) }), cmp: cmp, send: Object.assign(send, { prev: T2.kv(send.prev) }), receipt: Object.assign(receipt, { kv: T2.kv(receipt.kv) }),
      note: ui.note || '', setNote: function (e) { ctx.setUi({ note: U.val(e) }); },
      toggleCmp: function () { ctx.setUi({ cmp: !ui.cmp }); },
      review: review, remind: remind,
      openSend: function () {
        if (scn === 'desconhecido') { ctx.toast('Consulte o envio anterior antes de enviar de novo'); return; }
        ctx.setUi({ sendOpen: true, receipt: '' });
      },
      editModel: function () { ctx.go('TRE05', { id: sel ? sel.form : 'f2' }); },
      talk: function () { ctx.go('TRE25', { id: a.id }); },
      evals: function () { ctx.go('TRE07', { id: a.id }); }
    };
  }
});
