/* REL01 · Criar convite individual e REL02 · Gerenciar convites.
   Criar não é enviar: compartilhar é sempre ação explícita. Convite cria registro "convite" em DB.alunos (não é aluno ativo). */
REG.screen({
  page: 'treinador', key: 'convidar', id: 'REL01', title: 'Convidar aluno', mtitle: 'Convite', nav: 'alunos', back: 'H04', form: true,
  normal: 'Preenchendo',
  scens: [['criado', 'Convite criado'], ['naocriou', 'Não foi possível criar'], ['validade', 'Validade'], ['invalido', 'Destinatário inválido'], ['falha', 'Falha ao compartilhar'], ['desconhecido', 'Resultado desconhecido']],
  vals: function (ctx) {
    var T = window.T1, ui = ctx.ui, scn = ctx.scn;
    var PRE = { invalido: { nome: 'Marina Alves', contato: 'marina@email', showErr: true } };
    var f = Object.assign({ nome: ctx.p.nome || '', contato: '', svc: 'o1', msg: '' }, PRE[scn] || {}, ui);
    var set = function (k) { return function (e) { var o = {}; o[k] = U.val(e); o.showErr = false; o.fail = false; ctx.setUi(o); }; };
    var first = (f.nome.trim().split(' ')[0]) || 'aluno';
    var nameErr = f.showErr && !f.nome.trim() ? 'Informe o nome do aluno.' : '';
    var contactErr = f.showErr && !T.contactOk(f.contato) ? 'Destinatário inválido: use um e-mail (nome@dominio.com) ou celular com DDD.' : '';
    var dup = f.nome.trim() ? DB.alunos.filter(function (a) { return U.norm(a.name) === U.norm(f.nome) && a.status !== 'encerrado'; })[0] : null;

    var doCreate = function () {
      var o = T.offer(f.svc), alId = DB.uid('al'), cv = { id: DB.uid('cv'), aluno: alId, name: f.nome.trim(), contact: T.mask(f.contato), offer: f.svc, code: T.code(), created: U.todayShort + ' ' + U.now(), status: 'criado', shared: '', expires: '02/11', updated: 'hoje ' + U.now(), msg: f.msg };
      // um registro só, mesmo com toque duplo: se já existe convite criado com o mesmo nome agora, reaproveita
      var same = DB.t1_convites.find(function (c) { return c.status === 'criado' && U.norm(c.name) === U.norm(cv.name) && c.created === cv.created; });
      if (same) { ctx.setUi({ createdId: same.id, fail: false, unknown: false }); return; }
      DB.alunos.push({ id: alId, name: cv.name, first: cv.name.split(' ')[0], status: 'convite', svc: 'Convite criado · ' + (o ? o.name : 'sem serviço definido'), since: '', goal: '', city: '', age: 0, program: '', week: 0, adherence: 0, lastCheckin: '', next: 'Convite vale até 02/11', flag: null, tags: ['convite'], prepDone: false, payment: '', photo: '' });
      DB.t1_convites.unshift(cv);
      ctx.setUi({ createdId: cv.id, fail: false, unknown: false });
    };
    var create = function () {
      if (!f.nome.trim() || !T.contactOk(f.contato)) { ctx.setUi({ showErr: true }); return; }
      if (scn === 'naocriou' && !ui.tried) { ctx.setUi({ fail: true, tried: true }); return; }
      if (scn === 'desconhecido' && !ui.tried) { ctx.setUi({ unknown: true, tried: true }); return; }
      doCreate();
    };

    var demo = scn === 'criado' && !ui.createdId;
    var cv = ui.createdId ? DB.find('t1_convites', ui.createdId) : (demo ? { id: 'demo', name: 'Marina Alves', contact: 'marin•••@email.com', offer: 'o1', code: 'RL-8F3K', created: U.todayShort + ' ' + U.now(), status: 'criado', shared: '', expires: '02/11' } : null);
    var o = cv ? T.offer(cv.offer) : null;
    var cvFirst = cv ? cv.name.split(' ')[0] : '';
    var markShared = function (how) { if (cv && cv.id !== 'demo') { cv.status = 'pendente'; cv.shared = how + ' ' + U.todayShort + ' ' + U.now(); cv.updated = 'hoje ' + U.now(); } };

    var svcs = [{ id: '', name: 'Sem serviço' }].concat(DB.ofertas.filter(function (x) { return x.sale && x.kind !== 'programa'; })).map(function (x) {
      var on = f.svc === x.id; return { label: x.id ? x.name + ' · ' + U.money(x.price) + '/' + x.unit : x.name, cls: 'chip' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ svc: x.id }); } };
    });

    return {
      isForm: !cv, isDone: !!cv,
      nome: f.nome, contato: f.contato, msg: f.msg, setNome: set('nome'), setContato: set('contato'), setMsg: set('msg'),
      msgPh: 'Oi ' + first + '! Bora começar?',
      nameErr: nameErr, hasNameErr: !!nameErr, contactErr: contactErr, hasContactErr: !!contactErr,
      contactCls: 'input' + (contactErr ? ' is-err' : ''), nameCls: 'input' + (nameErr ? ' is-err' : ''),
      svcs: svcs,
      hasDup: !!dup && !cv, dupTxt: dup ? 'Já existe ' + (dup.status === 'convite' ? 'um convite' : 'um vínculo') + ' com ' + dup.name + ' (' + T.status(dup).label.toLowerCase() + '). Se for outra pessoa, siga em frente.' : '', openDup: function () { if (dup) ctx.go('H05', { id: dup.id }); },
      showValidity: scn === 'validade', validityWhy: function () { ctx.toast('O link vale 7 dias para não ficar circulando. Depois disso, reemita em Convites: um link novo, sem reaproveitar o vencido.'); },
      fail: !!ui.fail, retry: doCreate,
      unknown: !!ui.unknown, consult: function () { doCreate(); ctx.toast('Consultamos: o convite foi criado uma vez só.'); },
      create: create,
      // depois de criar
      cvName: cv ? cv.name : '', cvFirst: cvFirst, cvLink: cv ? '99coach.com.br/c/' + cv.code : '', cvSvc: o ? o.name + ' · ' + U.money(o.price) + '/' + o.unit : 'Sem serviço definido',
      cvContact: cv ? cv.contact : '', cvExp: cv ? '7 dias · até ' + cv.expires : '', cvState: cv && cv.status === 'pendente' ? 'Compartilhado (' + cv.shared + ') · aguardando aceite' : 'Criado · ainda não enviado',
      cvShared: !!cv && cv.status === 'pendente', cvNotShared: !cv || cv.status !== 'pendente',
      shareFail: !!ui.shareFail,
      copy: function () { markShared('link copiado'); ctx.toast('Convite copiado. Copiar não é enviar: cole na conversa com ' + cvFirst + '.'); },
      whats: function () {
        if (scn === 'falha') { ctx.setUi({ shareFail: true }); return; }
        markShared('WhatsApp aberto'); ctx.toast('Abrimos o WhatsApp com a mensagem pronta (demonstração). Confirme o envio por lá.');
      },
      goConvites: function () { ctx.go('REL02'); }, goAlunos: function () { ctx.go('H04'); },
      another: function () { ctx.setUi({ createdId: '', nome: '', contato: '', msg: '', svc: 'o1', showErr: false, tried: false }); }
    };
  }
});

REG.screen({
  page: 'treinador', key: 'convites', id: 'REL02', title: 'Convites', nav: 'alunos', back: 'H04',
  normal: 'Uso recorrente',
  scens: [['revogado', 'Revogado'], ['reemitido', 'Reemitido'], ['vazio', 'Nenhum convite'], ['expirado', 'Expirado'], ['falha', 'Falha da consulta'], ['desconhecido', 'Resultado da ação desconhecido']],
  vals: function (ctx) {
    var T = window.T1, ui = ctx.ui, scn = ctx.scn;
    var OV = { revogado: { cv2: { status: 'revogado', updated: 'hoje ' + U.now() } }, reemitido: { cv3: { status: 'criado', code: 'RL-6N2V', created: U.todayShort + ' ' + U.now(), expires: '02/11', shared: '', updated: 'hoje ' + U.now() } } }[scn] || {};
    var src = scn === 'vazio' ? [] : DB.t1_convites;
    var list = src.map(function (c) { return Object.assign({}, c, OV[c.id] || {}); });
    var flt = ui.flt || (scn === 'expirado' ? 'expirados' : 'todos');
    var IN = { todos: null, pendentes: ['criado', 'pendente'], aceitos: ['aceito'], expirados: ['expirado'], revogados: ['revogado'] };
    var ST = { criado: ['Criado · não enviado', 'badge badge--plain'], pendente: ['Aguardando aceite', 'badge badge--info'], aceito: ['Aceito', 'badge badge--ok'], expirado: ['Convite expirado', 'badge badge--warn'], revogado: ['Revogado', 'badge badge--plain'] };
    var focus = ctx.p.id || '';

    var row = function (c) {
      var real = DB.find('t1_convites', c.id), o = T.offer(c.offer), fst = c.name.split(' ')[0];
      var revoke = function () {
        ctx.ask({
          title: 'Revogar este convite?', danger: true, ok: 'Revogar convite',
          lines: ['O link 99coach.com.br/c/' + c.code + ' deixa de funcionar agora.', 'Ninguém é avisado automaticamente.', 'Vínculos já confirmados não são afetados.'],
          onOk: function () {
            if (scn === 'desconhecido') { ctx.setUi({ unknown: c.id }); return; }
            real.status = 'revogado'; real.updated = 'hoje ' + U.now();
            if (real.aluno) { var a = DB.find('alunos', real.aluno); if (a && a.status === 'convite') DB.alunos.splice(DB.alunos.indexOf(a), 1); }
            ctx.toast('Convite de ' + fst + ' revogado às ' + U.now() + '. O link deixou de funcionar.');
          }
        });
      };
      var reissue = function () {
        real.code = T.code(); real.status = 'criado'; real.created = U.todayShort + ' ' + U.now(); real.expires = '02/11'; real.shared = ''; real.updated = 'hoje ' + U.now();
        if (!real.aluno || !DB.find('alunos', real.aluno)) {
          var id = real.aluno || DB.uid('al'); real.aluno = id;
          DB.alunos.push({ id: id, name: real.name, first: fst, status: 'convite', svc: 'Convite criado · ' + (o ? o.name : 'sem serviço definido'), since: '', goal: '', city: '', age: 0, program: '', week: 0, adherence: 0, lastCheckin: '', next: 'Convite vale até 02/11', flag: null, tags: ['convite'], prepDone: false, payment: '', photo: '' });
        }
        ctx.toast('Novo link criado para ' + fst + ' (válido até 02/11). O antigo continua sem funcionar. Compartilhe para enviar.');
      };
      var s = ST[c.status] || ST.criado;
      return {
        name: c.name, contact: c.contact, svc: o ? o.name : 'Sem serviço definido', badge: s[0], badgeCls: s[1],
        when: c.status === 'aceito' ? 'aceito ' + c.updated : (c.status === 'expirado' ? 'venceu em ' + c.expires : (c.status === 'revogado' ? 'revogado ' + c.updated : 'criado ' + c.created + ' · vale até ' + c.expires)),
        evidence: c.shared ? 'Compartilhado: ' + c.shared : 'Ainda não compartilhado',
        cls: 'mod-card t1-inv' + (focus === c.id ? ' is-focus' : ''),
        isOpen: c.status === 'criado' || c.status === 'pendente', isAcc: c.status === 'aceito', isDead: c.status === 'expirado' || c.status === 'revogado',
        copy: function () { if (real.status === 'criado') { real.status = 'pendente'; real.shared = 'link copiado ' + U.todayShort + ' ' + U.now(); real.updated = 'hoje ' + U.now(); } ctx.toast('Link copiado: 99coach.com.br/c/' + c.code + '. Cole na conversa com ' + fst + '.'); },
        revoke: revoke, reissue: reissue,
        open: function () { ctx.go('H05', { id: c.aluno }); }
      };
    };
    var shown = list.filter(function (c) { return !IN[flt] || IN[flt].indexOf(c.status) >= 0; });
    if (focus) shown.sort(function (x, y) { return (y.id === focus) - (x.id === focus); });
    var cnt = function (k) { return list.filter(function (c) { return !IN[k] || IN[k].indexOf(c.status) >= 0; }).length; };
    var flts = [['todos', 'Todos'], ['pendentes', 'Pendentes'], ['aceitos', 'Aceitos'], ['expirados', 'Expirados'], ['revogados', 'Revogados']].map(function (x) {
      var on = flt === x[0]; return { label: x[1] + ' · ' + cnt(x[0]), cls: 'chip' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ flt: x[0] }); } };
    });

    var failed = scn === 'falha';
    var alerts = [];
    if (scn === 'revogado') alerts.push(T.alert('ok', 'Convite de Felipe revogado às ' + U.now(), 'O link deixa de funcionar. Nenhum vínculo confirmado foi afetado.', '', null));
    if (scn === 'reemitido') alerts.push(T.alert('ok', 'Convite de João Pedro reemitido', 'Novo link criado, válido até 02/11; o antigo continua vencido. Ainda não foi enviado.', '', null));
    if (scn === 'expirado') alerts.push(T.alert('warn', 'Convite expirado', 'Reemitir cria um link novo. O link vencido não volta a funcionar.', '', null));
    if (failed) alerts.push(T.alert('risk', 'Os convites não carregaram', 'Nada foi alterado. Isto não significa que você não tem convites.', 'Tentar de novo', function () { ctx.scenario(''); ctx.toast('Convites consultados às ' + U.now() + '.'); }));
    if (ui.unknown) alerts.push(T.alert('warn', 'Resultado da ação desconhecido', 'A conexão caiu antes da confirmação da revogação. Consulte antes de repetir.', 'Consultar de novo', function () { ctx.setUi({ unknown: '' }); ctx.toast('Consultado às ' + U.now() + ': o convite continua aguardando. Nada foi revogado nem duplicado.'); }));

    return {
      sub: U.plural(list.length, 'convite', 'convites') + ' · ' + cnt('pendentes') + ' aguardando aceite',
      invite: function () { ctx.go('REL01'); },
      flts: flts, alerts: alerts, hasAlerts: alerts.length > 0,
      rows: failed ? [] : shown.map(row), hasRows: !failed && shown.length > 0,
      isEmpty: !failed && !list.length, noMatch: !failed && !!list.length && !shown.length, showFlts: !failed && list.length > 0
    };
  }
});
