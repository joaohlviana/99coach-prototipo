/* T5 · TRE25 Conversas: lista + conversa (lado a lado no desktop; lista → conversa no celular).
   Enviar adiciona à conversa com status de transporte (enviando, entregue, lida, não enviada, sem conexão, falhou),
   abrir marca como lida (zera unread; não conclui tarefas), contexto do aluno → TRE03, rascunho de IA opcional → IA03. */
(function () {
  var DRAFTS = {
    ana: 'Obrigado por avisar. Vou revisar o treino de quinta e te aviso.',
    bruno: 'Recebi a foto, Bruno. Vou conferir as cargas e te respondo ainda hoje.',
    larissa: 'Oi, Larissa! Se tiver dúvida na preparação, me chama por aqui.'
  };
  var ST = { enviando: 'Enviando…', entregue: 'Entregue', lida: 'Lida', naoenviada: 'Não enviada', offline: 'Sem conexão · na fila', falhou: 'Falhou' };
  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function student(cv) { return DB.find('alunos', cv.with) || { id: cv.with, name: cv.with, first: cv.with, svc: '', since: '', status: '' }; }
  function markRead(cv) {
    if (!cv) return;
    cv.unread = 0;
    (DB.notificacoes || []).forEach(function (n) { if (n.kind === 'mensagem' && n.id2 === cv.id) n.read = true; });
  }
  function defaultPending(scn, convId) {
    var DS_TEXT = DRAFTS[convId] || 'Recebi sua mensagem e te respondo em breve.';
    if (scn === 'enviando') return { conv: convId, text: DS_TEXT, st: 'enviando', at: '10:44' };
    if (scn === 'naoenviada') return { conv: convId, text: DS_TEXT, st: 'naoenviada', at: '10:44' };
    if (scn === 'offline') return { conv: convId, text: DS_TEXT, st: 'offline', at: '10:44' };
    if (scn === 'falhou') return { conv: convId, text: DS_TEXT, st: 'falhou', at: '10:44', file: 'video-agachamento.mov · 48 MB' };
    return null;
  }

  REG.screen({
    page: 'treinador', key: 'mensagens', id: 'TRE25', title: 'Conversas', nav: 'mensagens', testIds: ['ana', 'bruno'],
    mtitle: 'Mensagens',
    back: function (ctx) { return ctx.id || ctx.ui.sel || ctx.scn ? 'TRE25' : ''; },
    normal: 'Conversa em dia',
    scens: [['naoenviada', 'Não enviada'], ['lida', 'Lida'], ['ia', 'Rascunho da IA'], ['enviando', 'Enviando'], ['falhou', 'Falhou'], ['offline', 'Offline'], ['anexo', 'Anexo revogado']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn;
      var convs = DB.conversas;
      var explicit = ui.sel || ctx.id || '';
      var cv = (explicit && DB.find('conversas', explicit)) || convs[0] || null;
      // abrir pela rota (ex.: vindo de um aviso) marca como lida; abrir não conclui tarefa nenhuma
      if (ctx.id && cv && cv.id === ctx.id && cv.unread) markRead(cv);

      // ---------- lista ----------
      var q = U.norm(ui.q || '');
      var list = convs.filter(function (c) { return !q || U.norm(student(c).name).indexOf(q) >= 0; }).map(function (c) {
        var a = student(c), last = c.msgs[c.msgs.length - 1] || { text: '', at: '', from: '' }, on = cv && c.id === cv.id;
        return { name: a.name, ini: U.ini(a.name), prev: (last.from === 'me' ? 'Você: ' : '') + last.text, at: last.at, unread: c.unread ? String(c.unread) : '', hasUnread: !!c.unread,
          cls: 'lrow t5-cv' + (on ? ' is-on' : '') + (c.unread ? ' is-unread' : ''), cur: String(!!on),
          lbl: a.name + (c.unread ? ', ' + U.plural(c.unread, 'mensagem não lida', 'mensagens não lidas') : ''),
          open: function () { markRead(c); ctx.setUi({ sel: c.id, text: '', ai: false, pending: null, err: '' }); } };
      });

      // ---------- conversa ----------
      var a = cv ? student(cv) : null;
      var pending = has(ui, 'pending') ? ui.pending : (cv ? defaultPending(scn, cv.id) : null);
      if (pending && cv && pending.conv !== cv.id) pending = null;
      var msgs = cv ? cv.msgs.slice() : [];
      if (cv && scn === 'lida' && !ui.sentOnce) msgs.push({ from: 'me', text: 'Obrigado por avisar. Vou revisar o treino de quinta.', at: '10:45', st: 'lida', readAt: '10:47' });
      if (cv && scn === 'anexo') msgs.push({ from: cv.with, text: '', at: '09:50', revoked: 'Foto postural · frente.jpg' });
      var lastTheirs = -1; msgs.forEach(function (m, i) { if (m.from !== 'me') lastTheirs = i; });
      var view = msgs.map(function (m, i) {
        var mine = m.from === 'me';
        var st = m.st || (mine ? (i < lastTheirs ? 'lida' : 'entregue') : '');
        var meta = m.at + (mine ? ' · ' + (st === 'lida' && m.readAt ? 'Lida ' + m.readAt : ST[st]) : '');
        return { text: m.text, hasText: !!m.text, meta: meta, cls: 'bub ' + (mine ? 'bub--out' : 'bub--in') + ' t5-bub', isRead: mine && st === 'lida', notRead: !(mine && st === 'lida'),
          revoked: !!m.revoked, revName: m.revoked || '' };
      });
      var pend = pending ? {
        text: pending.text, meta: pending.at + ' · ' + ST[pending.st], st: pending.st,
        isSending: pending.st === 'enviando', isRetry: pending.st === 'naoenviada' || pending.st === 'offline', isFail: pending.st === 'falhou',
        file: pending.file || '', hasFile: !!pending.file,
        cls: 'bub bub--out t5-bub' + (pending.st === 'enviando' ? ' is-sending' : ' is-fail')
      } : null;

      var push = function (text, st) {
        cv.msgs.push({ from: 'me', text: text, at: U.now(), st: st });
        var m = cv.msgs[cv.msgs.length - 1];
        if (st === 'enviando') setTimeout(function () { m.st = 'entregue'; ctx.refresh(); }, 900);
      };
      var send = function () {
        if (!cv) return;
        var t = String(ui.text || '').trim();
        if (!t) { ctx.setUi({ err: 'Escreva a mensagem antes de enviar.' }); return; }
        if (scn === 'naoenviada' || scn === 'offline' || scn === 'falhou') {
          if (!ui.sentOnce) { ctx.setUi({ pending: { conv: cv.id, text: t, st: scn, at: U.now(), file: scn === 'falhou' ? 'video-agachamento.mov · 48 MB' : '' }, text: '', err: '', ai: false, sentOnce: true }); return; }
        }
        push(t, 'enviando');
        ctx.setUi({ text: '', err: '', ai: false, sentOnce: true, pending: has(ui, 'pending') ? ui.pending : null });
      };
      var retry = function () {
        if (!cv || !pending) return;
        push(pending.text, 'enviando');
        ctx.setUi({ pending: null, sentOnce: true });
        ctx.toast(scn === 'offline' ? 'Conexão de volta. Mensagem enviada para ' + a.first + '.' : 'Mensagem reenviada para ' + a.first + '.');
      };
      var fix = function () { if (!pending) return; ctx.setUi({ pending: null, text: pending.text, err: '', fixNote: 'O vídeo de 48 MB foi retirado (limite 25 MB). Envie o texto ou um link do vídeo.' }); };
      var discard = function () { ctx.setUi({ pending: null }); ctx.toast('Mensagem não enviada descartada. Nada saiu do seu aparelho.'); };

      var aiOn = has(ui, 'ai') ? !!ui.ai : scn === 'ia';
      var draft = cv ? (DRAFTS[cv.id] || 'Recebi sua mensagem e te respondo em breve.') : '';
      var credits = DB.trainer.iaCredits;

      return {
        listCls: 'mod-grid2 t5-msg ' + (explicit || scn ? 't5-msg--conv' : 't5-msg--list'),
        q: ui.q || '', setQ: function (e) { ctx.setUi({ q: U.val(e) }); },
        list: list, hasList: list.length > 0, noList: list.length === 0,
        hasConv: !!cv, name: a ? a.name : '', first: a ? a.first : '', ini: a ? U.ini(a.name) : '',
        link: a ? (a.svc || 'Aluno') + (a.since ? ' · desde ' + a.since : '') : '',
        msgs: view, pend: pend || { text: '', meta: '', st: '', isSending: false, isRetry: false, isFail: false, file: '', hasFile: false, cls: '' }, hasPend: !!pend,
        offlineOn: !!pend && pend.st === 'offline', failOn: !!pend && pend.st === 'falhou', notSentOn: !!pend && pend.st === 'naoenviada', sendingOn: !!pend && pend.st === 'enviando',
        readOn: scn === 'lida' && !ui.sentOnce,
        anexoOn: scn === 'anexo',
        revokedWhy: function () { ctx.ask({ title: 'Anexo revogado', lines: [(a ? a.first : 'O aluno') + ' retirou o acesso a “Foto postural · frente.jpg” em 26/10 às 09:50.', 'Você não vê mais o arquivo; a conversa continua.', 'Se precisar, peça de novo. Retirar um anexo respeita a permissão de quem enviou.'], ok: 'Entendi', cancel: false }); },
        retry: retry, fix: fix, discard: discard,
        fixNote: ui.fixNote || '', hasFixNote: !!ui.fixNote,
        text: ('text' in ui) ? ui.text : ((cv && cv.draft) || ''), setText: function (e) { if (cv && cv.draft) cv.draft = ''; ctx.setUi({ text: U.val(e), err: '' }); },
        onKey: function (e) { if (e && e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { if (e.preventDefault) e.preventDefault(); send(); } },
        err: ui.err || '', hasErr: !!ui.err,
        send: send,
        toName: a ? 'Para: ' + a.name + ' · ' + (a.svc || '') : '',
        aiOn: aiOn, draft: draft,
        aiNote: 'Só você vê e edita. Nada é enviado sem você tocar em Enviar. Usa a franquia de IA (' + credits.used + ' de ' + credits.limit + ').',
        toggleAi: function () { ctx.setUi({ ai: !aiOn }); },
        useDraft: function () { ctx.setUi({ text: draft, ai: false, err: '' }); },
        reviewDraft: function () { if (cv) ctx.go('IA03', { id: cv.id }); },
        aiWhy: function () { ctx.ask({ title: 'Rascunho para revisar', lines: ['O rascunho usa só esta conversa; notas privadas e dados de saúde ficam fora.', 'Você edita antes de enviar. A IA nunca envia sozinha.', 'Alunos não têm assistente de IA no chat.'], ok: 'Entendi', cancel: false }); },
        goContext: function () { if (a) ctx.go('TRE03', { id: a.id }); },
        goNotif: function () { ctx.go('TRE26'); },
        backList: function () { ctx.go('TRE25'); }
      };
    }
  });
})();
