/* Avaliações reais. Só avalia quem teve acompanhamento de verdade com o treinador (o servidor decide: pelo menos um
   treino registrado, ou 14 dias de acompanhamento). Uma avaliação por acompanhamento, editável por quem escreveu.
   O treinador pode responder. O nome público é o primeiro nome com a inicial do sobrenome. */
(function () {
  var U = window.U;
  var first = function (n) { return String(n || '').split(' ')[0]; };
  var day = function (s) { return s ? new Date(s).toLocaleDateString('pt-BR') : ''; };
  var hash = function (t) { var h = 5381, i = t.length; while (i) h = (h * 33) ^ t.charCodeAt(--i); return (h >>> 0).toString(36) + t.length.toString(36); };
  var asking = '';
  var stars = function (n) { return n + (n === 1 ? ' estrela' : ' estrelas'); };

  // ---------- aluno ----------
  function student(ctx, link, visible) {
    var C = window.CONTA, ui = ctx.ui, tf = first(link.trainerName || 'seu treinador');
    if (!visible) return { show: false };
    var load = function (keep) { asking = link.id; ctx.setUi(keep ? { rvAsked: link.id } : { rvAsked: link.id, rvState: null, rvOpen: false, rvRating: null, rvBody: null, rvErr: '' }); C.rpc('my_review_state', { p_link: link.id }).then(function (r) { if (asking !== link.id) return; ctx.setUi({ rvState: r.ok ? (r.data || {}) : null, rvFail: !r.ok }); }); };
    if (C && ui.rvAsked !== link.id) { load(); return { show: false }; }
    var s = ui.rvState;
    if (!s || !s.eligible) return { show: false };
    var rv = s.review, editing = !!ui.rvOpen, rating = ui.rvRating != null ? ui.rvRating : (rv ? rv.rating : 0), body = ui.rvBody != null ? ui.rvBody : ((rv && rv.body) || '');
    return {
      show: true, title: rv ? 'Sua avaliação de ' + tf : 'Avaliar ' + tf,
      has: !!rv && !editing, mine: rv ? stars(rv.rating) + (rv.body ? ' · “' + rv.body + '”' : '') : '', when: rv ? 'Enviada em ' + day(rv.at) + (rv.status === 'oculta' ? ' · ocultada pela equipe da 99Coach' : ' · aparece no perfil público de ' + tf) : '',
      hasReply: !!(rv && rv.reply) && !editing, reply: rv && rv.reply ? tf + ' respondeu: “' + rv.reply + '”' : '',
      invite: !rv && !editing, inviteTxt: 'Sua avaliação aparece no perfil público de ' + tf + ' com o seu primeiro nome e a inicial do sobrenome. Ajuda outras pessoas a escolher.',
      open: function () { ctx.setUi({ rvOpen: true, rvErr: '' }); }, openLabel: rv ? 'Editar avaliação' : 'Escrever avaliação',
      editing: editing,
      opts: [1, 2, 3, 4, 5].map(function (n) { var on = rating === n; return { label: String(n), aria: stars(n), on: String(on), cls: 'chip' + (on ? ' is-on' : ''), pick: function () { ctx.setUi({ rvRating: n, rvErr: '' }); } }; }),
      ratingTxt: rating ? stars(rating) + ' de 5' : 'Escolha de 1 a 5',
      body: body, setBody: function (e) { ctx.setUi({ rvBody: U.val(e), rvErr: '' }); },
      note: 'Escreva sobre o acompanhamento. Não coloque telefone, endereço nem informação de saúde de outra pessoa.',
      err: ui.rvErr || '', hasErr: !!ui.rvErr, sendLabel: ui.rvBusy ? 'Enviando…' : (rv ? 'Salvar avaliação' : 'Publicar avaliação'),
      cancel: function () { ctx.setUi({ rvOpen: false, rvRating: null, rvBody: null, rvErr: '' }); },
      send: function () {
        if (ui.rvBusy) return;
        if (!rating) return ctx.setUi({ rvErr: 'Escolha uma nota de 1 a 5.' });
        if (String(body).length > 1500) return ctx.setUi({ rvErr: 'O texto pode ter até 1.500 letras.' });
        ctx.setUi({ rvBusy: true, rvErr: '' });
        var k = 'avaliar:' + link.id + ':' + rating + ':' + hash(String(body));
        C.rpc('submit_review', { p_link: link.id, p_rating: rating, p_body: String(body).trim() || null, p_idem: C.intent(k) }).then(C.settle(k)).then(function (r) {
          var d = (r.ok && r.data) || {};
          if (!r.ok || !d.saved) return ctx.setUi({ rvBusy: false, rvErr: r.offline ? 'Sem conexão: a avaliação não foi enviada.' : d.reason === 'cedo' ? 'Ainda é cedo para avaliar: registre um treino primeiro.' : 'Não enviado: ' + (r.msg || r.status || 'tente de novo') + '.' });
          ctx.setUi({ rvBusy: false, rvOpen: false, rvRating: null, rvBody: null }); ctx.toast(rv ? 'Avaliação atualizada.' : 'Avaliação publicada no perfil de ' + tf + '.'); load(true);
        });
      }
    };
  }

  // ---------- treinador: na tela do aluno ----------
  function trainer(ctx, lid, L) {
    var C = window.CONTA, ui = ctx.ui, nm = first(L.studentName);
    var load = function (keep) { asking = lid; ctx.setUi(keep ? { rvAsked: lid } : { rvAsked: lid, rvRow: null, rvOpen: false, rvReply: null, rvErr: '' }); C.db('GET', 'reviews?select=id,rating,body,status,reply,replied_at,created_at&link_id=eq.' + encodeURIComponent(lid) + '&limit=1').then(function (r) { if (asking !== lid) return; ctx.setUi({ rvRow: r.ok ? ((r.data || [])[0] || false) : null }); }); };
    if (C && ui.rvAsked !== lid) { load(); return { show: false }; }
    var rv = ui.rvRow;
    if (!rv) return { show: false };
    var editing = !!ui.rvOpen, reply = ui.rvReply != null ? ui.rvReply : (rv.reply || '');
    return {
      show: true, text: stars(rv.rating) + (rv.body ? ' · “' + rv.body + '”' : ' · sem texto'), when: nm + ' avaliou em ' + day(rv.created_at) + (rv.status === 'oculta' ? ' · ocultada pela equipe da 99Coach' : ' · aparece no seu perfil público'),
      hasReply: !!rv.reply && !editing, replyTxt: rv.reply ? 'Sua resposta: “' + rv.reply + '”' : '',
      canOpen: !editing, openLabel: rv.reply ? 'Editar resposta' : 'Responder', open: function () { ctx.setUi({ rvOpen: true, rvErr: '' }); },
      editing: editing, reply: reply, setReply: function (e) { ctx.setUi({ rvReply: U.val(e), rvErr: '' }); },
      note: 'A resposta aparece no seu perfil público, abaixo da avaliação. Não exponha dados do aluno.',
      err: ui.rvErr || '', hasErr: !!ui.rvErr, sendLabel: ui.rvBusy ? 'Salvando…' : 'Publicar resposta',
      cancel: function () { ctx.setUi({ rvOpen: false, rvReply: null, rvErr: '' }); },
      send: function () {
        if (ui.rvBusy) return;
        if (String(reply).length > 1000) return ctx.setUi({ rvErr: 'A resposta pode ter até 1.000 letras.' });
        ctx.setUi({ rvBusy: true, rvErr: '' });
        C.rpc('reply_review', { p_review: rv.id, p_reply: String(reply).trim() }).then(function (r) {
          if (!r.ok) return ctx.setUi({ rvBusy: false, rvErr: r.offline ? 'Sem conexão: a resposta não foi salva.' : 'Não salvo: ' + (r.msg || r.status) + '.' });
          ctx.setUi({ rvBusy: false, rvOpen: false, rvReply: null }); ctx.toast(String(reply).trim() ? 'Resposta publicada.' : 'Resposta removida.'); load(true);
        });
      }
    };
  }
  window.REVIEWS = { student: student, trainer: trainer };
})();
