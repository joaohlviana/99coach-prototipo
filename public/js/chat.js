/* Conversa do vínculo (real): mensagens duráveis no servidor, estado de envio verdadeiro (nada aparece como enviado
   antes do servidor confirmar), leitura marcada ao abrir. Usada pelo aluno e pelo treinador. */
(function () {
  window.CHAT = function (ctx, linkId, side, otherName) {
    var ui = ctx.ui, C = window.CONTA;
    var load = function () { C.messages(linkId).then(function (r) { ctx.setUi({ msgs: r.ok && Array.isArray(r.data) ? r.data : (ui.msgs || []), msgErr: !r.ok }); if (r.ok) C.markRead(linkId); }); };
    var loadBlocks = function () { C.db('GET', 'conversation_blocks?select=blocker&link_id=eq.' + encodeURIComponent(linkId) + '&lifted_at=is.null').then(function (r) { if (r.ok) ctx.setUi({ blk: (r.data || []).map(function (b) { return b.blocker; }) }); }); };
    if (C && linkId && !ui.msgAsked) { ctx.setUi({ msgAsked: true }); load(); loadBlocks(); }
    // bloquear e denunciar (plano: segurança da conversa). Bloqueio impede novas mensagens dos dois lados; denúncia vai para a equipe.
    var me = (C && C.user() || {}).id, blk = ui.blk || [], byMe = blk.indexOf(me) >= 0, blocked = blk.length > 0;
    var toggleBlock = function () {
      var on = !byMe;
      ctx.ask({ title: on ? 'Bloquear a conversa?' : 'Desbloquear a conversa?', lines: on ? ['Ninguém consegue mandar mensagem nesta conversa enquanto o bloqueio durar.', 'O acompanhamento e o treino continuam; para encerrar, use Encerrar acompanhamento.'] : ['As mensagens voltam a funcionar para os dois lados.'], ok: on ? 'Bloquear' : 'Desbloquear', onOk: function () {
        C.rpc('block_conversation', { p_link: linkId, p_block: on }).then(function (r) { if (!r.ok) return ctx.toast('Não foi possível agora: ' + (r.msg || r.status || 'sem conexão') + '.'); ctx.toast(on ? 'Conversa bloqueada.' : 'Conversa desbloqueada.'); loadBlocks(); });
      } });
    };
    var REASONS = [['assedio', 'Assédio ou ameaça'], ['conteudo_improprio', 'Conteúdo impróprio'], ['golpe_ou_cobranca_por_fora', 'Golpe ou cobrança por fora'], ['spam', 'Spam'], ['outro', 'Outro']];
    var sendReport = function () {
      if (!ui.repWhy) return ctx.setUi({ repErr: 'Escolha um motivo.' });
      if (ui.repBusy) return; ctx.setUi({ repBusy: true, repErr: '' });
      C.rpc('report_conversation', { p_link: linkId, p_message: null, p_reason: ui.repWhy, p_note: String(ui.repNote || '').trim() || null }).then(function (r) {
        if (!r.ok) return ctx.setUi({ repBusy: false, repErr: 'Não foi possível enviar: ' + (r.msg || r.status || 'sem conexão') + '.' });
        ctx.setUi({ repBusy: false, repOpen: false, repDone: 'Denúncia enviada às ' + U.now() + '. A equipe analisa; a outra pessoa não é avisada de quem denunciou.' });
      });
    };
    var send = function () {
      var body = String(ui.msgDraft || '').trim();
      if (!body || ui.msgSending) return;
      if (body.length > 2000) return ctx.setUi({ msgSendErr: 'A mensagem passou de 2.000 caracteres.' });
      ctx.setUi({ msgSending: true, msgSendErr: '' });
      C.sendMessage(linkId, body).then(function (r) {
        if (!r.ok) return ctx.setUi({ msgSending: false, msgSendErr: r.offline ? 'Sem conexão: a mensagem não foi enviada. Ela continua no campo.' : (/bloquead/i.test(r.msg || '') ? 'Conversa bloqueada: a mensagem não foi enviada.' : 'Não enviada: ' + (r.msg || ('erro ' + r.status))) });
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
      reload: function () { ctx.setUi({ msgAsked: false }); },
      blocked: blocked, notBlocked: !blocked, blockTxt: byMe ? 'Você bloqueou esta conversa. Ninguém consegue mandar mensagens.' : 'Esta conversa foi bloqueada. Não dá para mandar mensagens.',
      blockLabel: byMe ? 'Desbloquear' : 'Bloquear', toggleBlock: toggleBlock, canToggle: !blocked || byMe,
      openReport: function () { ctx.setUi({ repOpen: !ui.repOpen, repErr: '' }); }, repOpen: !!ui.repOpen,
      reasons: REASONS.map(function (x) { var on = ui.repWhy === x[0]; return { label: x[1], on: String(on), cls: 'chip' + (on ? ' is-on' : ''), pick: function () { ctx.setUi({ repWhy: x[0], repErr: '' }); } }; }),
      repNote: ui.repNote || '', setRepNote: function (e) { ctx.setUi({ repNote: U.val(e) }); }, sendReport: sendReport, repLabel: ui.repBusy ? 'Enviando…' : 'Enviar denúncia',
      repErr: ui.repErr || '', hasRepErr: !!ui.repErr, repDone: ui.repDone || '', hasRepDone: !!ui.repDone
    };
  };
})();
