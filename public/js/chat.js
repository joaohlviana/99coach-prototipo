/* Conversa do vínculo (real): mensagens duráveis no servidor, estado de envio verdadeiro (nada aparece como enviado
   antes do servidor confirmar), leitura marcada ao abrir. Usada pelo aluno e pelo treinador. */
(function () {
  window.CHAT = function (ctx, linkId, side, otherName) {
    var ui = ctx.ui, C = window.CONTA;
    var load = function () { C.messages(linkId).then(function (r) { ctx.setUi({ msgs: r.ok && Array.isArray(r.data) ? r.data : (ui.msgs || []), msgErr: !r.ok }); if (r.ok) C.markRead(linkId); }); };
    var loadBlocks = function () { C.db('GET', 'conversation_blocks?select=blocker&link_id=eq.' + encodeURIComponent(linkId) + '&lifted_at=is.null').then(function (r) { if (r.ok) ctx.setUi({ blk: (r.data || []).map(function (b) { return b.blocker; }) }); }); };
    var loadReps = function () { C.db('GET', 'conversation_reports?select=id,reason,status,created_at&link_id=eq.' + encodeURIComponent(linkId) + '&order=created_at.desc&limit=10').then(function (r) { if (r.ok) ctx.setUi({ reps: r.data || [] }); }); };
    if (C && linkId && !ui.msgAsked) { ctx.setUi({ msgAsked: true }); load(); loadBlocks(); loadReps(); }
    // a conversa se atualiza sozinha enquanto está aberta (a cada 10 s), sem perder o que está sendo digitado
    clearTimeout(window['__chatT' + linkId]); window['__chatT' + linkId] = setTimeout(function () { if (document.getElementById('tr-chat-in') || document.getElementById('tm-chat-in') || document.getElementById('al-chat-in')) load(); }, 10000);
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
        var rd = Array.isArray(r.data) ? r.data[0] : r.data; ctx.setUi({ repBusy: false, repOpen: false, repDone: 'Denúncia enviada às ' + U.now() + (rd && rd.report ? ' · protocolo ' + String(rd.report).slice(0, 8).toUpperCase() : '') + '. A equipe analisa; a outra pessoa não é avisada de quem denunciou.' }); loadReps();
      });
    };
    var send = function () {
      var body = String(ui.msgDraft != null ? ui.msgDraft : ((window.__chatDrafts || {})[linkId] || '')).trim();
      if (!body || ui.msgSending) return;
      if (body.length > 2000) return ctx.setUi({ msgSendErr: 'A mensagem passou de 2.000 caracteres.' });
      ctx.setUi({ msgSending: true, msgSendErr: '' });
      C.sendMessage(linkId, body).then(function (r) {
        if (!r.ok) return ctx.setUi({ msgSending: false, msgSendErr: r.offline ? 'Sem conexão: a mensagem não foi enviada. Ela continua no campo.' : (/bloquead/i.test(r.msg || '') ? 'Conversa bloqueada: a mensagem não foi enviada.' : 'Não enviada: ' + (r.msg || ('erro ' + r.status))) });
        if (window.__chatDrafts) delete window.__chatDrafts[linkId]; ctx.setUi({ msgSending: false, msgDraft: '' }); load();
      });
    };
    var msgs = ui.msgs || [];
    // corrigir ou retirar a própria mensagem (até 15 minutos depois de enviar) e procurar dentro da conversa
    var fresh = function (m) { return Date.now() - new Date(m.created_at).getTime() < 15 * 60000; };
    var WHY = { prazo_encerrado: 'O prazo de 15 minutos para alterar esta mensagem acabou.', mensagem_retirada: 'Esta mensagem já foi retirada.', texto_invalido: 'Escreva de 1 a 2.000 caracteres.' };
    var why = function (r) { var k = Object.keys(WHY).filter(function (x) { return String(r.msg || '').indexOf(x) >= 0; })[0]; return k ? WHY[k] : (r.offline ? 'Sem conexão: nada foi alterado.' : 'Não foi possível agora. Nada foi alterado.'); };
    var saveEdit = function (m) { return function () {
      var b = String(ui.edBody || '').trim(); if (!b || ui.edBusy) return; ctx.setUi({ edBusy: true, edErr: '' });
      C.rpc('edit_message', { p_id: m.id, p_body: b }).then(function (r) { if (!r.ok) return ctx.setUi({ edBusy: false, edErr: why(r) }); ctx.setUi({ edBusy: false, edId: '', edBody: '' }); load(); });
    }; };
    var retract = function (m) { return function () {
      ctx.ask({ title: 'Retirar esta mensagem?', lines: ['O texto é apagado para os dois lados. Fica o aviso "Mensagem retirada".', 'Se a outra pessoa já leu, retirar não desfaz a leitura.'], ok: 'Retirar mensagem', danger: true, onOk: function () {
        C.rpc('retract_message', { p_id: m.id }).then(function (r) { if (!r.ok) return ctx.toast(why(r)); var d = Array.isArray(r.data) ? r.data[0] : r.data; if (d && d.file) C.fileDel('chat-anexos', d.file); load(); });
      } });
    }; };
    // anexo: imagem ou PDF de até 5 MB. Primeiro o arquivo sobe; só então a mensagem é criada e ligada a ele.
    var TYPES = { 'image/jpeg': 1, 'image/png': 1, 'image/webp': 1, 'application/pdf': 1 };
    var pickFile = function (e) {
      var inp = e && e.target, f = inp && inp.files && inp.files[0]; if (inp) inp.value = '';
      if (!f || ui.upBusy) return;
      if (!TYPES[f.type]) return ctx.setUi({ upErr: 'Envie imagem (JPG, PNG ou WebP) ou PDF.' });
      if (f.size > 5 * 1024 * 1024) return ctx.setUi({ upErr: 'O arquivo passa de 5 MB.' });
      ctx.setUi({ upBusy: true, upErr: '' });
      var safe = String(f.name || 'anexo').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9._-]+/g, '-').slice(-60) || 'anexo';
      var path = linkId + '/' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8) + '-' + safe;
      C.fileUp('chat-anexos', path, f).then(function (u) {
        if (!u.ok) return ctx.setUi({ upBusy: false, upErr: u.offline ? 'Sem conexão: o arquivo não foi enviado.' : 'O arquivo não foi aceito. Nada foi enviado.' });
        C.sendMessage(linkId, 'Anexo: ' + String(f.name || 'arquivo').slice(0, 100)).then(function (r) {
          var d = r.ok ? (Array.isArray(r.data) ? r.data[0] : r.data) : null;
          if (!d || !d.id) { C.fileDel('chat-anexos', path); return ctx.setUi({ upBusy: false, upErr: /bloquead/i.test((d && d.outcome) || r.msg || '') ? 'Conversa bloqueada: o anexo não foi enviado.' : 'A mensagem do anexo não foi enviada. Tente de novo.' }); }
          C.rpc('attach_to_message', { p_message: d.id, p_path: path, p_name: f.name || 'anexo', p_type: f.type }).then(function (a2) {
            ctx.setUi({ upBusy: false, upErr: a2.ok ? '' : 'A mensagem foi enviada, mas o arquivo não ficou ligado a ela. Envie de novo.' }); load();
          });
        });
      });
    };
    var openFile = function (m) { return function () { C.fileUrl('chat-anexos', m.attachment_path).then(function (u) { if (!u) return ctx.toast('Não foi possível abrir o anexo agora.'); window.open(u, '_blank', 'noopener'); }); }; };
    var qn = U.norm(ui.msgQ || '');
    var shown = qn ? msgs.filter(function (m) { return !m.retracted_at && U.norm(m.body || '').indexOf(qn) >= 0; }) : msgs;
    var fmt = function (d) { return d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''; };
    return {
      list: shown.map(function (m) { var me = m.side === side, gone = !!m.retracted_at, can = me && !gone && fresh(m) && !!m.id, ed = can && ui.edId === m.id;
        return { body: gone ? 'Mensagem retirada' : m.body, cls: 'rx-msg' + (me ? ' is-me' : '') + (gone ? ' is-gone' : ''), who: me ? 'Você' : (otherName || 'Contato'), when: fmt(m.created_at) + (m.edited_at && !gone ? ' · editada' : ''), state: me ? (m.read_at ? 'Lida' : 'Enviada') : '',
          can: can && !ed, editing: ed, notEditing: !ed, edBody: ed ? (ui.edBody || '') : '', setEd: function (e) { ctx.setUi({ edBody: U.val(e), edErr: '' }); },
          startEd: function () { ctx.setUi({ edId: m.id, edBody: m.body, edErr: '' }); }, cancelEd: function () { ctx.setUi({ edId: '', edBody: '', edErr: '' }); }, saveEd: saveEdit(m), saveLabel: ui.edBusy ? 'Salvando…' : 'Salvar', retract: retract(m),
          hasFile: !gone && !!m.attachment_path, fileName: m.attachment_name || 'Anexo', fileKind: m.attachment_type === 'application/pdf' ? 'PDF' : 'Imagem', openFile: openFile(m),
          edErr: ed ? (ui.edErr || '') : '', hasEdErr: ed && !!ui.edErr }; }),
      pickFile: pickFile, upLabel: ui.upBusy ? 'Enviando arquivo…' : 'Anexar arquivo', upErr: ui.upErr || '', hasUpErr: !!ui.upErr,
      q: ui.msgQ || '', setQ: function (e) { ctx.setUi({ msgQ: U.val(e) }); }, canSearch: msgs.length > 5, searching: !!qn, qCount: qn ? U.plural(shown.length, 'mensagem encontrada', 'mensagens encontradas') : '', clearQ: function () { ctx.setUi({ msgQ: '' }); },
      hasMsgs: msgs.length > 0, noMsgs: !msgs.length && !ui.msgErr, msgErr: !!ui.msgErr,
      draft: ui.msgDraft != null ? ui.msgDraft : ((window.__chatDrafts || {})[linkId] || ''), setDraft: function (e) { var v = U.val(e); (window.__chatDrafts = window.__chatDrafts || {})[linkId] = v; ctx.setUi({ msgDraft: v, msgSendErr: '' }); },
      send: send, sendLabel: ui.msgSending ? 'Enviando…' : 'Enviar', sendErr: ui.msgSendErr || '', hasSendErr: !!ui.msgSendErr,
      reload: function () { ctx.setUi({ msgAsked: false }); },
      blocked: blocked, notBlocked: !blocked, blockTxt: byMe ? 'Você bloqueou esta conversa. Ninguém consegue mandar mensagens.' : 'Esta conversa foi bloqueada. Não dá para mandar mensagens.',
      blockLabel: byMe ? 'Desbloquear' : 'Bloquear', toggleBlock: toggleBlock, canToggle: !blocked || byMe,
      openReport: function () { ctx.setUi({ repOpen: !ui.repOpen, repErr: '' }); }, repOpen: !!ui.repOpen,
      reasons: REASONS.map(function (x) { var on = ui.repWhy === x[0]; return { label: x[1], on: String(on), cls: 'chip' + (on ? ' is-on' : ''), pick: function () { ctx.setUi({ repWhy: x[0], repErr: '' }); } }; }),
      repNote: ui.repNote || '', setRepNote: function (e) { ctx.setUi({ repNote: U.val(e) }); }, sendReport: sendReport, repLabel: ui.repBusy ? 'Enviando…' : 'Enviar denúncia',
      reps: (ui.reps || []).map(function (x) { var RS = { recebida: 'Recebida', em_revisao: 'Em análise pela equipe', encerrada: 'Encerrada' }, lb = (REASONS.filter(function (q) { return q[0] === x.reason; })[0] || ['', 'Outro'])[1]; return { t: 'Protocolo ' + String(x.id).slice(0, 8).toUpperCase() + ' · ' + lb, x: (RS[x.status] || x.status) + ' · enviada em ' + new Date(x.created_at).toLocaleDateString('pt-BR') }; }), hasReps: !!(ui.reps && ui.reps.length),
      repErr: ui.repErr || '', hasRepErr: !!ui.repErr, repDone: ui.repDone || '', hasRepDone: !!ui.repDone
    };
  };
})();
