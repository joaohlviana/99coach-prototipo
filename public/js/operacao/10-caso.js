/* O1 · OPS02 (caso e decisão auditável) e subtelas OPS02.A–OPS02.D */
(function () {
  var O = function () { return window.O1; };
  var DECIDED = { 'Decidido': 1, 'Mantida': 1, 'Restringida': 1, 'Retirada': 1, 'Encerrado': 1 };

  function decsOf(c) {
    if (c.decs && c.decs.length) return c.decs;
    return [{ k: 'encerrar', label: 'Encerrar sem alteração', campo: 'Estado do caso', antes: c.estado, depois: 'Encerrado', muda: 'Caso encerrado com motivo; nada muda no objeto', afeta: 'ninguém além do solicitante, que recebe o motivo', afetaN: '1 pessoa', rev: 'sim · reabrindo o caso', naoMuda: c.objetos, estado: 'Encerrado', why: '', rec: 'Caso encerrado', steps: [['Caso encerrado', 'ok'], ['Motivo enviado ao solicitante', 'and']] }];
  }
  function findDec(c, k) { var l = decsOf(c); return l.filter(function (d) { return d.k === k; })[0] || l[0]; }
  function blockedWhy(c) {
    var O1 = O();
    if (O1.canDecide(c)) return '';
    var m = DB.o1_equipe.filter(function (x) { return O1.DOM[c.dom] && x.caps.indexOf(O1.DOM[c.dom].cap) >= 0 && x.id !== DB.o1_me.id; })[0];
    return 'Sua capacidade em ' + (O1.DOM[c.dom] ? O1.DOM[c.dom].nome : c.dom) + ' é só leitura. Encaminhe a quem decide' + (m ? ' (' + m.name + ' · ' + O1.DOM[c.dom].cap + ')' : '') + '.';
  }
  function impact(c, d) {
    return [{ k: 'Alvo', v: c.alvo }, { k: 'Escopo', v: d.label }, { k: 'Muda', v: d.muda }, { k: 'Afeta', v: d.afeta + ' (' + d.afetaN + ')' }, { k: 'Reversível', v: d.rev }, { k: 'Não muda', v: d.naoMuda }];
  }
  function capOf(c) { var O1 = O(); return (O1.DOM[c.dom] ? O1.DOM[c.dom].cap : 'casos.decidir'); }
  window.O1X = { decsOf: decsOf, findDec: findDec, blockedWhy: blockedWhy, impact: impact, DECIDED: DECIDED };

  // ---------- OPS02 · Caso e decisão auditável ----------
  REG.screen({
    page: 'operacao', key: 'ops02', id: 'OPS02', title: 'Caso e decisão auditável', mtitle: 'Caso', nav: 'casos', back: 'H12', wide: true,
    testIds: ['p44', 'c298', 'c290'],
    scens: [['desconhecido', 'Resultado desconhecido'], ['parcial', 'Falha parcial'], ['recibo', 'Recibo']],
    vals: function (ctx) {
      var O1 = O(), scn = ctx.scn, ui = ctx.ui, c = O1.pickCase(ctx, 'c301');
      var decs = decsOf(c), k = ui.k || (c.proposta && c.proposta.k) || decs[0].k, d = findDec(c, k);
      var why = ui.why != null ? ui.why : (c.proposta ? c.proposta.why : '');
      var blocked = blockedWhy(c), decided = !!DECIDED[c.estado] && !!c.decisao;
      var alerts = [];
      var unkPending = scn === 'desconhecido' && !ui.consulted;
      var partPending = scn === 'parcial' && !ui.retried;
      if (unkPending) alerts.push(O1.alert('warn', 'Resultado desconhecido', 'A decisão “' + decs[0].label + '” enviada às 14:04 não confirmou. Consulte a mesma referência antes de repetir: repetir pode duplicar o efeito.', 'Consultar de novo', function () {
        var r = O1.apply(c, decs[0], why || decs[0].why || 'Decisão enviada às 14:04', ''); ctx.setUi({ consulted: true, done: r.id }); ctx.toast('Consulta: a decisão já tinha sido aplicada · ' + r.id);
      }));
      if (partPending) {
        var applied = decs[0].steps.slice(0, -1).map(function (s) { return s[0]; }).join(', '), failed = decs[0].steps[decs[0].steps.length - 1][0];
        alerts.push(O1.alert('risk', 'Falha parcial', 'Aplicou: ' + applied + '. Não aplicou: ' + failed + ' (falhou às 14:04). Tente de novo só o que falhou.', 'Tentar de novo', function () {
          var r = O1.apply(c, decs[0], why || decs[0].why || 'Decisão de 14:04', 'falha'); O1.retry(r); ctx.setUi({ retried: true, done: r.id }); ctx.toast('Só “' + failed + '” foi reexecutada · ' + r.id);
        }));
      }
      if (blocked) alerts.push(O1.alert('info', 'Sem capacidade para decidir', blocked, 'Encaminhar', function () { ctx.go('OPS01.C', { id: c.id }); }));
      var lastRec = DB.o1_recibos.filter(function (r) { return r.caso === c.id; }).slice(-1)[0] || null;
      var showRec = (scn === 'recibo' || !!ui.done) && !!lastRec;
      var recV = showRec ? { id: lastRec.id, at: lastRec.at, who: lastRec.who, why: lastRec.why, title: lastRec.title, st: O1.recState(lastRec).label, cls: O1.recState(lastRec).cls } : { id: '', at: '', who: '', why: '', title: '', st: '', cls: '' };
      var go = function (kk) {
        if (blocked) { ctx.setUi({ err: blocked }); return; }
        if (unkPending || partPending) { ctx.setUi({ err: 'Resolva o aviso acima antes de decidir de novo.' }); return; }
        if (!String(why).trim()) { ctx.setUi({ err: 'Escreva o motivo da decisão. Ele vai para o recibo e para o histórico.', k: kk }); return; }
        c.proposta = { k: kk, why: String(why).trim() };
        O1.hist(c, 'Proposta salva', findDec(c, kk).label, '');
        ctx.go('OPS02.C', { id: c.id });
      };
      var rejDec = decs.filter(function (x) { return x.k === 'rejeitar' || x.k === 'manter' || x.k === 'manter21'; })[0];
      return {
        proto: c.proto, h1: 'Caso ' + c.proto, sub: c.tipo + ' · ' + c.alvo.split(' · ').pop(), crumb: 'Casos / ' + c.proto,
        bar: O1.bar(capOf(c), c.alvo), alerts: alerts,
        kv: [{ k: 'Tipo', v: c.tipo }, { k: 'Objeto', v: c.obj }, { k: 'Responsável', v: O1.respName(c.resp) }, { k: c.prazoTipo, v: c.prazo }, { k: 'Estado', v: c.estado }],
        decided: decided, open: !decided, decTxt: c.decisao ? c.decisao.label + ' · ' + c.decisao.ref : '', openDec: function () { if (c.decisao) ctx.go('OPS02.D', { id: c.decisao.ref }); },
        opts: decs.map(function (x) { var on = x.k === d.k; return { label: x.label, cls: 'o1-opt' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ k: x.k, err: '' }); } }; }),
        campo: d.campo, antes: d.antes, depois: d.depois, impact: impact(c, d),
        why: why, setWhy: function (e) { ctx.setUi({ why: U.val(e), err: '' }); }, whyPh: decs[0].why || 'Por que esta decisão',
        err: ui.err || '', hasErr: !!ui.err,
        decide: function () { go(d.k); },
        hasRej: !!rejDec && rejDec.k !== d.k, rejLabel: rejDec ? (rejDec.k === 'rejeitar' ? 'Rejeitar' : rejDec.short || 'Manter') : '', reject: function () { if (rejDec) { ctx.setUi({ k: rejDec.k }); go(rejDec.k); } },
        decideCls: 'btn btn--primary btn--sm' + (blocked ? ' o1-off' : ''), decideDis: String(!!blocked),
        hist: O1.histView(c, ctx.go),
        showRec: showRec, rec: recV, openRec: function () { if (lastRec) ctx.go('OPS02.D', { id: lastRec.id }); },
        links: [
          { label: 'Contexto do caso', go: function () { ctx.go('OPS02.A', { id: c.id }); } },
          { label: 'Evidências e decisão proposta', go: function () { ctx.go('OPS02.B', { id: c.id }); } },
          { label: 'Revisão da ação', go: function () { ctx.go('OPS02.C', { id: c.id }); } },
          { label: 'Atribuir e encaminhar', go: function () { ctx.go('OPS01.C', { id: c.id }); } }
        ]
      };
    }
  });

  // ---------- OPS02.A · Contexto do caso ----------
  REG.screen({
    page: 'operacao', key: 'ops02a', id: 'OPS02.A', title: 'Contexto do caso', mtitle: 'Caso', nav: 'casos', back: 'OPS02', backParams: function (ctx) { return { id: ctx.id || 'c301' }; }, wide: true,
    testIds: ['p44', 'c309'],
    scens: [['removido', 'Objeto removido'], ['parcial', 'Evidência parcial'], ['negada', 'Consulta negada'], ['versoes', 'Versões divergentes']],
    vals: function (ctx) {
      var O1 = O(), scn = ctx.scn, ui = ctx.ui, c = O1.pickCase(ctx, 'c301');
      var alerts = [];
      if (scn === 'removido') alerts.push(O1.alert('warn', 'Objeto removido', 'O titular removeu ' + c.objetos.split(' · ')[0] + ' às 13:55. O caso segue com a última versão salva; decisões não alteram mais o objeto.'));
      if (scn === 'parcial') alerts.push(O1.alert('warn', 'Evidência parcial', 'Uma das evidências não carregou (arquivo do documento). Decida só com o que está confirmado ou peça complemento.', 'Tentar de novo', function () { ctx.toast('Ainda sem o arquivo às ' + O1.tick() + ' · peça complemento se precisar'); }));
      if (scn === 'negada') alerts.push(O1.alert('risk', 'Consulta negada', 'Sua capacidade não abre o conteúdo deste objeto. Os dados aparecem mascarados; encaminhe se precisar ler.', 'Encaminhar', function () { ctx.go('OPS01.C', { id: c.id }); }));
      if (scn === 'versoes') alerts.push(O1.alert('warn', 'Versões divergentes', 'O perfil mudou depois da prova (v12 → v13 às 14:00). Compare as versões antes de propor a decisão.', 'Comparar', function () { ctx.go('OPS02.B', { id: c.id }); }));
      var neg = scn === 'negada';
      var comp = ui.comp != null ? ui.comp : '';
      var note = ui.note != null ? ui.note : '';
      var notes = c.hist.filter(function (h) { return h.what === 'Nota interna'; }).slice().reverse();
      return {
        crumb: 'Casos / ' + c.proto, h1: 'Caso ' + c.proto, sub: c.titulo + ' · aberto ' + c.aberto,
        bar: O1.bar('casos.ler · ' + c.tipo.toLowerCase(), c.alvo), alerts: alerts,
        kv: [{ k: 'Tipo', v: c.tipo }, { k: 'Solicitante', v: neg ? '••••' : c.solicitante }, { k: 'Objetos', v: neg ? 'conteúdo restrito à sua capacidade' : (scn === 'removido' ? c.objetos + ' (removido 13:55)' : c.objetos) }, { k: 'Responsável', v: O1.respName(c.resp) }, { k: 'Pendente', v: scn === 'parcial' ? c.pend + ' · documento sem carregar' : c.pend }],
        nota: c.nota, hasNota: !!c.nota, notes: notes.map(function (h) { return { at: h.at, who: h.who, t: h.why }; }), hasNotes: notes.length > 0,
        note: note, setNote: function (e) { ctx.setUi({ note: U.val(e), nerr: '' }); },
        nerr: ui.nerr || '', hasNerr: !!ui.nerr,
        addNote: function () { if (!String(note).trim()) { ctx.setUi({ nerr: 'Escreva a nota antes de registrar.' }); return; } O1.hist(c, 'Nota interna', String(note).trim(), ''); ctx.setUi({ note: '', nerr: '' }); ctx.toast('Nota registrada no histórico às ' + c.upd); },
        compOpen: !!ui.compOpen, toggleComp: function () { ctx.setUi({ compOpen: !ui.compOpen, cerr: '' }); }, comp: comp, setComp: function (e) { ctx.setUi({ comp: U.val(e), cerr: '' }); },
        cerr: ui.cerr || '', hasCerr: !!ui.cerr,
        sendComp: function () {
          if (!String(comp).trim()) { ctx.setUi({ cerr: 'Diga o que falta, em uma frase. O solicitante recebe só este texto.' }); return; }
          ctx.ask({ title: 'Pedir complemento?', text: 'O pedido vai para ' + c.solicitante + ' pelo canal autorizado e entra no histórico.', lines: ['Texto: ' + String(comp).trim(), 'O prazo do caso fica suspenso até a resposta'], ok: 'Enviar pedido', onOk: function () {
            var r = O1.receipt(c, 'Complemento pedido', String(comp).trim(), [['Pedido registrado', 'ok'], ['Aviso ao solicitante', 'and']]); c.estado = 'Aguardando'; ctx.setUi({ comp: '', compOpen: false }); ctx.toast('Pedido enviado · ' + r.id);
          } });
        },
        hist: O1.histView(c, ctx.go),
        propose: function () { ctx.go('OPS02.B', { id: c.id }); }, assign: function () { ctx.go('OPS01.C', { id: c.id }); },
        hasObj: !neg && scn !== 'removido', objLabel: c.dom === 'perfis' ? 'Abrir credenciais do perfil' : (c.dom === 'conteudo' ? 'Abrir conteúdo denunciado' : 'Abrir caso completo'),
        openObj: function () { if (c.dom === 'perfis') ctx.go('OPS03', { id: c.verif || 'thiago' }); else if (c.dom === 'conteudo') ctx.go('OPS04', { id: c.id }); else ctx.go('OPS02', { id: c.id }); }
      };
    }
  });

  // ---------- OPS02.B · Evidências e decisão proposta ----------
  REG.screen({
    page: 'operacao', key: 'ops02b', id: 'OPS02.B', title: 'Evidências e decisão', mtitle: 'Evidências', nav: 'casos', back: 'OPS02', backParams: function (ctx) { return { id: ctx.id || 'c301' }; }, wide: true,
    testIds: ['p44', 'c298'],
    scens: [['expirada', 'Evidência expirada'], ['semacesso', 'Arquivo sem acesso'], ['conflito', 'Conflito de identidade'], ['regra', 'Regra desconhecida']],
    vals: function (ctx) {
      var O1 = O(), scn = ctx.scn, ui = ctx.ui, c = O1.pickCase(ctx, 'c301');
      var decs = decsOf(c), k = ui.k || (c.proposta && c.proposta.k) || decs[0].k, d = findDec(c, k);
      var why = ui.why != null ? ui.why : (c.proposta ? c.proposta.why : (d.why || ''));
      var blocked = blockedWhy(c);
      var evid = (c.evid || []).map(function (e, i) {
        var x = { name: e.name, orig: e.orig, val: e.val, conf: e.conf, cls: 'badge badge--' + e.cls };
        if (scn === 'expirada' && i === (c.evid.length - 1)) { x.val = 'vencida 25/10'; x.conf = 'expirada'; x.cls = 'badge badge--risk'; }
        if (scn === 'semacesso' && /Documento/.test(e.name)) { x.orig = 'arquivo sem acesso para você'; x.val = '—'; x.conf = 'sem acesso'; x.cls = 'badge badge--plain'; }
        return x;
      });
      var alerts = [], stop = '';
      if (scn === 'expirada') { alerts.push(O1.alert('warn', 'Evidência expirada', 'A última evidência venceu. Peça prova nova antes de confirmar qualquer titularidade.', 'Pedir nova prova', function () { ctx.setUi({ k: decs.filter(function (x) { return x.k === 'complemento'; }).length ? 'complemento' : decs[0].k }); })); }
      if (scn === 'semacesso') alerts.push(O1.alert('info', 'Arquivo sem acesso', 'O documento só abre para quem tem privacidade.decidir. Você vê origem e data, não o conteúdo.'));
      if (scn === 'conflito') { stop = 'Conflito de identidade: resolva em Conflito e contestação antes de propor.'; alerts.push(O1.alert('risk', 'Conflito de identidade', 'A conta ••••88 e @thiago_treinos usam o mesmo e-mail de recuperação. Não proponha titularidade até separar as contas.', 'Abrir conflito', function () { ctx.go('OPS03.C', { id: 'c305' }); })); }
      if (scn === 'regra') { stop = 'Sem regra vigente que cubra o caso: encaminhe à Governança.'; alerts.push(O1.alert('risk', 'Regra desconhecida', 'Nenhuma política vigente cobre este caso. Não decida por analogia: encaminhe à Governança.', 'Encaminhar', function () { ctx.go('OPS14'); })); }
      if (blocked) alerts.push(O1.alert('info', 'Sem capacidade para decidir', blocked, 'Encaminhar', function () { ctx.go('OPS01.C', { id: c.id }); }));
      var save = function () {
        if (blocked) { ctx.setUi({ err: blocked }); return; }
        if (stop) { ctx.setUi({ err: stop }); return; }
        if (!String(why).trim()) { ctx.setUi({ err: 'Escreva o fundamento: ele vai para a revisão e para o recibo.' }); return; }
        c.proposta = { k: d.k, why: String(why).trim() };
        O1.hist(c, 'Proposta salva', d.label + ' · ' + String(why).trim(), '');
        ctx.go('OPS02.C', { id: c.id });
      };
      return {
        crumb: 'Casos / ' + c.proto + ' / Evidências', sub: c.proto + ' · ' + c.tipo,
        bar: O1.bar(capOf(c) + ' · ' + c.tipo.toLowerCase(), c.alvo), alerts: alerts,
        evid: evid, hasEvid: evid.length > 0, noEvid: evid.length === 0,
        campo: d.campo, antes: d.antes, depois: d.depois,
        opts: decs.map(function (x) { var on = x.k === d.k; return { label: x.label, cls: 'o1-opt' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ k: x.k, why: x.why || (ui.why != null ? ui.why : ''), err: '' }); } }; }),
        why: why, setWhy: function (e) { ctx.setUi({ why: U.val(e), err: '' }); },
        regra: scn === 'regra' ? 'Regra vigente: nenhuma encontrada' : 'Regra vigente: ' + c.regra,
        err: ui.err || '', hasErr: !!ui.err, save: save, saveCls: 'btn btn--primary btn--sm' + (blocked || stop ? ' o1-off' : ''), saveDis: String(!!(blocked || stop)), back: function () { ctx.go('OPS02.A', { id: c.id }); }
      };
    }
  });

  // ---------- OPS02.C · Revisão da ação ----------
  REG.screen({
    page: 'operacao', key: 'ops02c', id: 'OPS02.C', title: 'Revisar a ação', mtitle: 'Revisar', nav: 'casos', back: 'OPS02.B', backParams: function (ctx) { return { id: ctx.id || 'c301' }; }, form: true,
    testIds: ['p44', 'c298', 'c305'],
    scens: [['permissao', 'Permissão mudou'], ['objeto', 'Objeto mudou'], ['expirada', 'Confirmação expirada'], ['aprovacao', 'Aprovação adicional']],
    vals: function (ctx) {
      var O1 = O(), scn = ctx.scn, ui = ctx.ui, c = O1.pickCase(ctx, 'c301'), me = O1.me();
      var p = c.proposta || { k: decsOf(c)[0].k, why: '' };
      var d = findDec(c, p.k);
      var blocked = blockedWhy(c);
      var fresh = me.lastConfirmMin <= 15 && !(scn === 'expirada' && !ui.reauth);
      var alerts = [], stop = '';
      if (scn === 'permissao') { stop = 'Sua capacidade mudou: encaminhe a quem decide.'; alerts.push(O1.alert('risk', 'Permissão mudou', 'Sua capacidade ' + capOf(c) + ' foi suspensa às 14:03 pela Governança. Nada foi aplicado.', 'Encaminhar', function () { ctx.go('OPS01.C', { id: c.id }); })); }
      if (scn === 'objeto' && !ui.reviewed) { stop = 'O objeto mudou: revise de novo.'; alerts.push(O1.alert('warn', 'Objeto mudou', 'O alvo mudou às 14:04 (v13). Confira se o resumo abaixo ainda vale.', 'Revisar de novo', function () { ctx.setUi({ reviewed: true }); ctx.toast('Resumo recalculado com a versão v13'); })); }
      if (scn === 'expirada' && !ui.reauth) alerts.push(O1.alert('warn', 'Confirmação expirada', 'A confirmação recente expirou enquanto você revisava. Confirme de novo; o resumo fica igual.'));
      if (scn === 'aprovacao') { stop = 'A política exige aprovação adicional: encaminhe.'; alerts.push(O1.alert('info', 'Aprovação adicional exigida', 'A Política de titularidade v2 pede segunda aprovação quando há contestação aberta. Encaminhe a Caio R.')); }
      if (blocked) { stop = blocked; alerts.push(O1.alert('info', 'Sem capacidade para executar', blocked, 'Encaminhar', function () { ctx.go('OPS01.C', { id: c.id }); })); }
      var reauth = function () {
        ctx.ask({ title: 'Confirmação recente', text: 'Confirme no seu app autenticador (ACC12). Você volta para esta revisão com o mesmo resumo.', lines: ['Nenhuma senha é pedida aqui'], ok: 'Já confirmei no app', onOk: function () { me.lastConfirmMin = 0; ctx.setUi({ reauth: true }); ctx.toast('Confirmação recente válida por 15 min'); } });
      };
      var done = c.decisao && DECIDED[c.estado] ? c.decisao : null;
      var confirm = function () {
        if (stop) { ctx.setUi({ err: stop }); return; }
        if (done) { ctx.setUi({ err: 'Este caso já foi decidido (' + done.ref + '). Abra o recibo.' }); return; }
        if (!String(p.why || '').trim()) { ctx.setUi({ err: 'Falta o fundamento. Volte às evidências e salve a proposta.' }); return; }
        if (!fresh) { ctx.setUi({ err: 'Confirme de novo (confirmação recente) antes de executar.' }); return; }
        ctx.ask({ title: d.label + '?', text: 'A ação é aplicada agora e gera recibo com quem, quando e por quê.', lines: impact(c, d).map(function (x) { return x.k + ': ' + x.v; }).concat(['Motivo: ' + p.why]), ok: 'Confirmar', onOk: function () { var r = O1.apply(c, d, p.why, ''); ctx.go('OPS02.D', { id: r.id }); } });
      };
      var askApproval = function () {
        ctx.ask({ title: 'Encaminhar para aprovação?', text: 'Caio R. recebe a proposta com o seu fundamento. Nada é aplicado até a aprovação.', lines: [d.label, 'Motivo: ' + (p.why || '—')], ok: 'Encaminhar', onOk: function () { var r = O1.receipt(c, 'Aprovação pedida a Caio R.', p.why || d.label, [['Proposta enviada', 'ok'], ['Aprovação de Caio R.', 'fila']]); c.estado = 'Aguardando'; ctx.go('OPS02.D', { id: r.id }); } });
      };
      return {
        h1: 'Revisar a ação', sub: d.label + ' · ' + c.alvo.split(' · ').pop(),
        bar: O1.bar(capOf(c) + ' + confirmação recente', c.alvo), alerts: alerts,
        impact: impact(c, d).concat([{ k: 'Motivo', v: p.why || 'falta fundamento' }]),
        fresh: fresh, stale: !fresh, ageTxt: 'Sua última confirmação foi há ' + (scn === 'expirada' ? 16 : me.lastConfirmMin) + ' min. Confirme de novo (ACC12) e volte para cá.', reauth: reauth,
        isDone: !!done, doneTxt: done ? done.label + ' · ' + done.ref : '', openDone: function () { if (done) ctx.go('OPS02.D', { id: done.ref }); },
        needApproval: scn === 'aprovacao', askApproval: askApproval,
        err: ui.err || '', hasErr: !!ui.err, confirm: confirm, confirmCls: 'btn btn--primary btn--lg' + (stop || !fresh || done ? ' o1-off' : ''), confirmDis: String(!!(stop || !fresh || done)),
        back: function () { ctx.go('OPS02.B', { id: c.id }); }
      };
    }
  });

  // ---------- OPS02.D · Recibo e recuperação ----------
  var SCN_STEPS = {
    fila: function (s, i) { return i === 0 ? s.st : 'fila'; },
    parcial: function (s, i, n) { return i === n - 1 ? 'falha' : 'ok'; },
    desconhecido: function (s, i, n) { return i === n - 1 ? 'desc' : 'ok'; },
    falhou: function () { return 'falha'; },
    concluido: function () { return 'ok'; },
    reconc: function () { return 'ok'; }
  };
  REG.screen({
    page: 'operacao', key: 'ops02d', id: 'OPS02.D', title: 'Recibo e recuperação', mtitle: 'Recibo', nav: 'casos',
    back: function (ctx) { var r = window.O1.recibo(ctx.id) || window.O1.recibo(DB.o1_clock.last || 'R-298'); return r && r.caso ? 'OPS02' : 'H12'; },
    backParams: function (ctx) { var r = window.O1.recibo(ctx.id) || window.O1.recibo(DB.o1_clock.last || 'R-298'); return { id: r ? r.caso : '' }; },
    testIds: ['R-298', 'R-280', 'R-301-0'],
    scens: [['fila', 'Em fila'], ['parcial', 'Parcial'], ['desconhecido', 'Desconhecido'], ['falhou', 'Falhou'], ['concluido', 'Concluído'], ['reconc', 'Reconciliação pendente']],
    vals: function (ctx) {
      var O1 = O(), scn = ctx.scn, ui = ctx.ui;
      var r = O1.recibo(ctx.id) || O1.recibo(DB.o1_clock.last || 'R-298') || DB.o1_recibos[0];
      var c = r.caso ? O1.caso(r.caso) : null;
      var sim = SCN_STEPS[scn] && !ui.resolved;
      var steps = r.steps.map(function (s, i) { var st = sim ? SCN_STEPS[scn](s, i, r.steps.length) : s.st; return O1.step({ name: s.name, st: st, at: st === 'ok' ? (s.at || r.at.slice(6)) : (st === 'falha' ? r.at.slice(6) : '') }); });
      var sts = steps.map(function (s) { return s.label; });
      var has = function (l) { return sts.indexOf(l) >= 0; };
      var anyUnknown = has('Desconhecido') || has('Em andamento') || has('Na fila');
      var anyFail = has('Falhou');
      var allOk = !anyUnknown && !anyFail;
      var stLabel = anyFail ? (sts.every(function (x) { return x === 'Falhou'; }) ? 'Falhou' : 'Falha parcial') : (has('Desconhecido') ? 'Resultado desconhecido' : (anyUnknown ? 'Em andamento' : 'Concluído'));
      var alerts = [];
      if (anyFail) alerts.push(O1.alert('risk', stLabel, 'Aplicado: ' + (steps.filter(function (s) { return s.label === 'Confirmado'; }).map(function (s) { return s.name; }).join(', ') || 'nada') + '. Não aplicado: ' + steps.filter(function (s) { return s.label === 'Falhou'; }).map(function (s) { return s.name; }).join(', ') + '. Tente de novo só o que falhou.'));
      if (has('Desconhecido')) alerts.push(O1.alert('warn', 'Resultado desconhecido', 'Uma etapa não confirmou. Consulte esta mesma referência antes de repetir: repetir o comando pode duplicar o efeito.'));
      if (scn === 'reconc' && !ui.resolved) alerts.push(O1.alert('info', 'Reconciliação pendente', 'Todas as etapas confirmaram aqui; o índice externo reconcilia em até 24 h. O caso pode ser encerrado depois da reconciliação.'));
      if (allOk && !(scn === 'reconc' && !ui.resolved)) alerts.push(O1.alert('ok', 'Resultado comprovado', 'Todas as etapas confirmaram. ' + (c && c.estado !== 'Encerrado' ? 'Você pode encerrar o caso.' : '')));
      var consult = function () {
        if (sim) { ctx.setUi({ resolved: true }); ctx.toast('Consulta de ' + r.id + ' às ' + O1.tick() + ' · etapas confirmadas sem repetir o comando'); return; }
        var n = O1.consult(r); ctx.toast(n ? 'Consulta de ' + r.id + ': ' + U.plural(n, 'etapa confirmada', 'etapas confirmadas') + ' · nada foi repetido' : 'Nada mudou desde a última consulta');
      };
      var retry = function () {
        if (sim) { ctx.setUi({ resolved: true }); ctx.toast('Só as etapas que falharam foram reexecutadas'); return; }
        var n = O1.retry(r); ctx.toast(U.plural(n, 'etapa reexecutada', 'etapas reexecutadas') + ' · registrado em ' + r.id);
      };
      var canClose = allOk && !!c && c.estado !== 'Encerrado' && !(scn === 'reconc' && !ui.resolved);
      var closeCase = function () {
        if (!canClose) { ctx.toast(c && c.estado === 'Encerrado' ? 'O caso já está encerrado' : 'Encerre só depois de todas as etapas confirmarem'); return; }
        ctx.ask({ title: 'Encerrar ' + c.proto + '?', text: 'O caso sai das filas. O histórico e os recibos continuam disponíveis para a operação.', lines: ['Motivo: resultado comprovado em ' + r.id, 'Reabrir exige um novo caso'], ok: 'Encerrar caso', onOk: function () { c.estado = 'Encerrado'; O1.hist(c, 'Caso encerrado', 'resultado comprovado em ' + r.id, r.id); ctx.toast(c.proto + ' encerrado · registrado no histórico'); } });
      };
      var task = function () {
        var pend = steps.filter(function (s) { return s.label !== 'Confirmado' && s.label !== 'Não se aplica'; }).map(function (s) { return s.name; });
        if (!pend.length) { ctx.toast('Não há tarefa restante'); return; }
        if (c) O1.hist(c, 'Tarefa restante aberta', pend.join(', '), r.id);
        ctx.toast('Tarefa aberta para: ' + pend.join(', '));
      };
      return {
        h1: 'Recibo #' + r.id, sub: r.title + ' · ' + r.at,
        bar: O1.bar('casos.ler', c ? c.proto : 'sem caso'), alerts: alerts,
        kv: [{ k: 'Referência', v: r.id }, { k: 'Executor', v: r.who }, { k: 'Quando', v: r.at }, { k: 'Motivo', v: r.why }],
        hasCase: !!c, caseTxt: c ? c.proto + ' · ' + c.titulo + ' · ' + c.estado : '', openCase: function () { if (c) ctx.go('OPS02', { id: c.id }); },
        steps: steps, stLabel: stLabel,
        canConsult: anyUnknown, canRetry: anyFail, canClose: canClose, closeCls: 'btn btn--primary btn--sm' + (canClose ? '' : ' o1-off'), closeDis: String(!canClose),
        consult: consult, retry: retry, closeCase: closeCase, task: task, hasTask: anyUnknown || anyFail,
        copy: function () { try { if (window.navigator && navigator.clipboard) navigator.clipboard.writeText(r.id).catch(function () {}); } catch (e) {} ctx.toast('Referência ' + r.id + ' copiada'); },
        hist: c ? O1.histView(c, ctx.go).slice(0, 6) : [], hasHist: !!c
      };
    }
  });
})();
