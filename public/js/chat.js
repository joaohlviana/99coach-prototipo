/* Conversa do vínculo (real): mensagens duráveis no servidor, estado de envio verdadeiro (nada aparece como enviado
   antes do servidor confirmar), leitura marcada ao abrir. Usada pelo aluno e pelo treinador. */
(function () {
  window.CHAT = function (ctx, linkId, side, otherName) {
    var ui = ctx.ui, C = window.CONTA;
    var load = function () { C.messages(linkId).then(function (r) { ctx.setUi({ msgs: r.ok && Array.isArray(r.data) ? r.data : (ui.msgs || []), msgErr: !r.ok }); if (r.ok) C.markRead(linkId); }); };
    if (C && linkId && !ui.msgAsked) { ctx.setUi({ msgAsked: true }); load(); }
    var send = function () {
      var body = String(ui.msgDraft || '').trim();
      if (!body || ui.msgSending) return;
      if (body.length > 2000) return ctx.setUi({ msgSendErr: 'A mensagem passou de 2.000 caracteres.' });
      ctx.setUi({ msgSending: true, msgSendErr: '' });
      C.sendMessage(linkId, body).then(function (r) {
        if (!r.ok) return ctx.setUi({ msgSending: false, msgSendErr: r.offline ? 'Sem conexão: a mensagem não foi enviada. Ela continua no campo.' : 'Não enviada: ' + (r.msg || ('erro ' + r.status)) });
        ctx.setUi({ msgSending: false, msgDraft: '' }); load();
      });
    };
    var msgs = ui.msgs || [];
    var fmt = function (d) { return d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''; };
    return {
      list: msgs.map(function (m) { var me = m.side === side; return { body: m.body, cls: 'rx-msg' + (me ? ' is-me' : ''), who: me ? 'Você' : (otherName || 'Contato'), when: fmt(m.created_at), state: me ? (m.read_at ? 'Lida' : 'Entregue') : '' }; }),
      hasMsgs: msgs.length > 0, noMsgs: !msgs.length && !ui.msgErr, msgErr: !!ui.msgErr,
      draft: ui.msgDraft || '', setDraft: function (e) { ctx.setUi({ msgDraft: U.val(e), msgSendErr: '' }); },
      send: send, sendLabel: ui.msgSending ? 'Enviando…' : 'Enviar', sendErr: ui.msgSendErr || '', hasSendErr: !!ui.msgSendErr,
      reload: function () { ctx.setUi({ msgAsked: false }); }
    };
  };
})();
