/* A2 · REL05 Pedir acompanhamento pelo perfil (Ana → Rafael).
   Enviar cria um pedido em DB.alunos (status 'pedido', from: 'ana') e um aviso em DB.notificacoes para o treinador ver.
   Não é contratação paga; abrir WhatsApp/Instagram não cria pedido. */
(function () {
  'use strict';
  var DB = window.DB, U = window.U, A2 = window.A2, GO = window.GO;
  DB.seed('a2_pedidosAcomp', []); // histórico dos pedidos da Ana: { id, aluno, protocol, svc, at, status }

  function mine() { return DB.alunos.filter(function (a) { return a.from === 'ana' && a.status === 'pedido'; })[0] || null; }

  REG.screen({
    page: 'aluno', key: 'pedir', id: 'REL05', title: 'Pedir acompanhamento', mtitle: 'Pedido', nav: 'contratacoes', back: 'history', form: true,
    normal: 'Novo pedido',
    scens: [['aguardando', 'Aguardando resposta'], ['recusado', 'Recusado'], ['expirado', 'Expirado'], ['enviando', 'Enviando'],
      ['desconhecido', 'Resultado desconhecido'], ['existente', 'Pedido já existente']],
    vals: function (ctx) {
      var scn = ctx.scn, ui = ctx.ui;
      var SVC = DB.ofertas.filter(function (o) { return o.sale && (o.kind === 'recorrente' || o.kind === 'avulsa'); });
      var svcId = ui.svc || (SVC.filter(function (o) { return o.id === 'o2'; })[0] ? 'o2' : (SVC[0] ? SVC[0].id : 'o1'));
      var svc = A2.offer(svcId);
      var already = svc.kind === 'recorrente' ? A2.hasAccess(svcId) : null;
      var LEVELS = ['Iniciante', 'Intermediário', 'Avançado'];
      var AV = ['Manhã', 'Almoço', 'Noite', 'Fim de semana'];
      var lvl = ui.lvl || 'Intermediário';
      var av = ui.av || ['Manhã'];
      var goal = ui.goal !== undefined ? ui.goal : 'Ganhar força sem dor no ombro.';
      var msg = ui.msg !== undefined ? ui.msg : '';
      var existing = mine();
      var demoReq = { id: 'demo', name: 'Ana Carolina Souza', svc: 'Pediu: Sessão presencial', request: { protocol: 'P-2041', at: '24/10 10:12', goal: goal, availability: av.join(', '), msg: '' } };
      var req = existing || ((scn === 'aguardando' || scn === 'recusado' || scn === 'expirado' || scn === 'desconhecido' || scn === 'existente') ? demoReq : null);
      var sending = scn === 'enviando';
      var showResult = !!req && scn !== 'existente';
      var status = null;
      if (scn === 'recusado') status = { cls: 'alert alert--risk', b: 'Pedido recusado', t: 'Rafael não tem vaga agora. Veja treinadores parecidos em Londrina.', btn: 'Encontrar treinador', fn: function () { GO('@home'); }, btn2: 'Tentar de novo', fn2: function () { ctx.scenario(''); } };
      else if (scn === 'expirado') status = { cls: 'alert alert--warn', b: 'Pedido expirado', t: 'Rafael não respondeu a tempo. Você pode pedir de novo.', btn: 'Pedir de novo', fn: function () { ctx.scenario(''); }, btn2: 'Consultar de novo', fn2: function () { ctx.toast('Pedido P-2041 segue expirado.'); } };
      else if (scn === 'desconhecido') status = { cls: 'alert alert--warn', b: 'Resultado desconhecido', t: 'A resposta do envio se perdeu. Consulte o pedido; não enviamos outro.', btn: 'Consultar de novo', fn: function () { ctx.scenario('aguardando'); ctx.toast('Encontramos o pedido P-2041. Nada foi duplicado.'); }, btn2: '', fn2: function () {} };
      else if (scn === 'existente') status = { cls: 'alert alert--info', b: 'Pedido já existente', t: 'Você já pediu acompanhamento a Rafael em 24/10. Revise o pedido em vez de enviar outro.', btn: 'Revisar', fn: function () { ctx.scenario('aguardando'); }, btn2: '', fn2: function () {} };
      else if (req) status = { cls: 'alert alert--info', b: 'Aguardando resposta do treinador', t: 'Rafael foi avisado. Prazo de resposta: quando ele definir, mostramos aqui.', btn: 'Consultar de novo', fn: function () { ctx.toast('Ainda aguardando a resposta de Rafael.'); }, btn2: '', fn2: function () {} };
      var r = req ? req.request : { protocol: '', at: '', goal: '', availability: '', msg: '' };
      var tp = DB.trainer, ph = U.img('bdc7ef1c8dbf05558c3bf8d575fc3a04');
      return {
        tName: tp.name, tSub: tp.sports.join(' e ') + ' · ' + tp.city, tIni: U.ini(tp.name), tPhoto: ph, hasPhoto: !!ph, noPhoto: !ph,
        svcName: svc.name, showForm: !showResult, showResult: showResult,
        hasStatus: !!status, status: status || { cls: '', b: '', t: '', btn: '', fn: function () {}, btn2: '', fn2: function () {} }, statusHasBtn2: !!(status && status.btn2),
        svcs: SVC.map(function (o) { var on = o.id === svcId; return { label: o.name, cls: 'chip' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ svc: o.id, err: '' }); } }; }),
        already: !!already, alreadyTxt: 'Você já tem ' + svc.name + ' com Rafael desde ' + (already ? already.since : '') + '. Para mudar algo, fale com ele ou veja a contratação.',
        seeCt: function () { GO('H11', { id: already ? already.id : '' }); },
        goal: goal, setGoal: function (e) { ctx.setUi({ goal: U.val(e), err: '' }); }, goalN: String(String(goal).length),
        levels: LEVELS.map(function (l) { var on = l === lvl; return { label: l, cls: 'chip' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ lvl: l }); } }; }),
        avs: AV.map(function (a) { var on = av.indexOf(a) >= 0; return { label: a, cls: 'chip' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ av: on ? av.filter(function (x) { return x !== a; }) : av.concat([a]), err: '' }); } }; }),
        msg: msg, setMsg: function (e) { ctx.setUi({ msg: U.val(e) }); },
        err: ui.err || '', hasErr: !!ui.err,
        sending: sending, notSending: !sending, busy: String(sending),
        sendLabel: sending ? 'Enviando…' : 'Enviar pedido',
        send: function () {
          if (sending) return;
          if (already) { ctx.setUi({ err: 'Você já tem este serviço com Rafael. Escolha outro ou veja a contratação.' }); return; }
          if (!String(goal).trim()) { ctx.setUi({ err: 'Conte seu objetivo em uma frase.' }); return; }
          if (!av.length) { ctx.setUi({ err: 'Escolha pelo menos um horário em que você pode treinar.' }); return; }
          if (mine()) { ctx.setUi({ err: 'Você já tem um pedido aguardando resposta de Rafael.' }); return; }
          var n = DB.a2_pedidosAcomp.length, prot = 'P-' + (2042 + n), id = 'ana-pedido' + (n ? n + 1 : '');
          var at = '26/10 ' + U.now();
          DB.alunos.push({ id: id, name: 'Ana Carolina Souza', first: 'Ana', status: 'pedido', svc: 'Pediu: ' + svc.name, since: '', goal: String(goal).trim(), city: 'Londrina, PR', age: 31,
            program: '', week: 0, adherence: 0, lastCheckin: '', next: 'Responder pedido', flag: { kind: 'pedido', text: 'Pedido de acompanhamento pelo perfil', when: 'agora', to: 'REL06' },
            tags: ['pedido'], prepDone: false, payment: '', photo: '', from: 'ana',
            request: { protocol: prot, at: at, offer: svc.id, level: lvl, availability: av.join(', '), goal: String(goal).trim(), msg: String(msg).trim() } });
          DB.notificacoes.unshift({ id: 'nt' + id, kind: 'pedido', text: 'Ana Carolina Souza pediu ' + svc.name, at: 'agora', read: false, to: 'REL06', id2: id });
          DB.a2_pedidosAcomp.push({ id: id, aluno: id, protocol: prot, svc: svc.name, at: at, status: 'aguardando' });
          ctx.setUi({ err: '' }); ctx.toast('Seu pedido foi enviado. Protocolo ' + prot + '.');
        },
        // resultado
        protocol: r.protocol, sentAt: r.at, rGoal: r.goal, rAv: r.availability, rSvc: req ? String(req.svc).replace('Pediu: ', '') : '', hasMsg: !!(r.msg), rMsg: r.msg || '',
        cancelReq: function () {
          ctx.ask({ title: 'Cancelar pedido?', text: 'Rafael deixa de ver o pedido ' + r.protocol + '. Você pode pedir de novo depois.', ok: 'Cancelar pedido', danger: true, cancel: 'Manter pedido', onOk: function () {
            if (existing) {
              var ia = DB.alunos.indexOf(existing); if (ia >= 0) DB.alunos.splice(ia, 1);
              for (var k = DB.notificacoes.length - 1; k >= 0; k--) if (DB.notificacoes[k].id2 === existing.id) DB.notificacoes.splice(k, 1);
              DB.a2_pedidosAcomp.forEach(function (p) { if (p.aluno === existing.id) p.status = 'cancelado'; });
              ctx.toast('Pedido ' + r.protocol + ' cancelado.');
            } else ctx.scenario('');
          } });
        },
        backProfile: function () { GO('PUB04'); },
        openFollow: function () { GO('REL04'); }
      };
    }
  });
})();
