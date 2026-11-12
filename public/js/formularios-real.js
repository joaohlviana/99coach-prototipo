/* Formulários enviados de verdade (tabela form_sends): o treinador envia perguntas a um aluno do acompanhamento,
   o aluno responde uma vez, o treinador lê e marca como revisado. Enviado ≠ respondido ≠ revisado.
   Só as duas pessoas do acompanhamento leem. Nada disto vai para analytics. */
(function () {
  var LS = null; try { LS = window.localStorage; } catch (_) {}
  var U = window.U;
  var day = function (s) { return s ? new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : ''; };
  var first = function (n) { return String(n || '').split(' ')[0]; };
  var MODELS = {
    checkin: { label: 'Check-in semanal', title: 'Check-in semanal', purpose: 'Acompanhar como foi a sua semana de treino.', qs: 'Como foi a sua semana de treino?\nO que foi mais difícil?\nQuer ajustar algo no treino?' },
    inicio: { label: 'Começo do acompanhamento', title: 'Começo do acompanhamento', purpose: 'Conhecer sua rotina para montar o treino.', qs: 'Há quanto tempo você treina?\nQuais horários funcionam melhor para você?\nO que você gosta e o que não gosta de fazer no treino?' },
    branco: { label: 'Em branco', title: '', purpose: '', qs: '' }
  };
  function load(C, ctx, lid, force) {
    if (!C || (ctx.ui.fmAsked === lid && !force)) return;
    ctx.setUi(force ? { fmAsked: lid } : { fmAsked: lid, fmList: [], fmSee: '' });
    C.db('GET', 'form_sends?select=id,title,purpose,form_version,questions,status,answers,sent_at,answered_at,reviewed_at&link_id=eq.' + encodeURIComponent(lid) + '&order=sent_at.desc&limit=50').then(function (r) {
      ctx.setUi({ fmList: r.ok && Array.isArray(r.data) ? r.data : (ctx.ui.fmList || []), fmFail: !r.ok });
    });
  }
  function pairs(f) { var a = f.answers || {}; return (f.questions || []).map(function (q) { var v = String(a[q.id] == null ? '' : a[q.id]).trim(); return { q: q.label, a: v || 'Sem resposta', empty: !v }; }); }

  // ---------- treinador: na tela do aluno ----------
  function trainer(ctx, lid, L) {
    var C = window.CONTA, ui = ctx.ui, nm = first(L.studentName), active = L.status === 'ativo';
    load(C, ctx, lid);
    var list = ui.fmList || [], pendN = list.filter(function (f) { return f.status === 'enviado'; }).length;
    var parse = function () { return String(ui.fmQs || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean); };
    var qs = parse();
    var send = function () {
      var title = String(ui.fmTitle || '').trim();
      if (!title) return ctx.setUi({ fmErr: 'Dê um nome ao formulário: é o que ' + nm + ' vê primeiro.' });
      if (!qs.length) return ctx.setUi({ fmErr: 'Escreva pelo menos uma pergunta, uma por linha.' });
      if (qs.length > 15) return ctx.setUi({ fmErr: 'No máximo 15 perguntas por envio. Formulário curto é respondido mais vezes.' });
      if (qs.some(function (q) { return q.length > 200; })) return ctx.setUi({ fmErr: 'Cada pergunta pode ter até 200 letras.' });
      if (ui.fmBusy) return; ctx.setUi({ fmBusy: true, fmErr: '' });
      var k = 'form:' + lid + ':' + title + ':' + qs.join('|').length;
      C.rpc('send_form', { p_link: lid, p_title: title, p_purpose: String(ui.fmPurpose || '').trim() || null, p_version: 1, p_questions: qs.map(function (q, i) { return { id: 'q' + (i + 1), label: q, type: 'texto' }; }), p_idem: C.intent(k) }).then(C.settle(k)).then(function (r) {
        if (!r.ok) {
          var m = r.raw || r.msg || '';
          return ctx.setUi({ fmBusy: false, fmErr: /muitos_formularios_pendentes/.test(m) ? nm + ' já tem 5 formulários sem responder. Cancele um envio antigo antes de mandar outro.' : /acompanhamento_nao_ativo/.test(m) ? 'O acompanhamento não está ativo: não dá para enviar formulário agora.' : r.offline ? 'Sem conexão: o formulário não foi enviado.' : 'Não enviado: ' + (r.msg || r.status) + '.' });
        }
        ctx.setUi({ fmBusy: false, fmOpen: false, fmTitle: '', fmPurpose: '', fmQs: '', fmModel: '' });
        ctx.toast('Formulário enviado. ' + nm + ' vê ao abrir o app.'); load(C, ctx, lid, true);
      });
    };
    var setSt = function (f, status, msg) {
      return function () {
        if (ui.fmBusy) return; ctx.setUi({ fmBusy: true, fmRowErr: '' });
        C.rpc('form_send_set', { p_send: f.id, p_status: status }).then(function (r) {
          ctx.setUi({ fmBusy: false, fmRowErr: r.ok ? '' : 'Não foi possível agora: ' + (r.msg || r.status || 'sem conexão') + '.' });
          if (r.ok) { var d = r.data || {}; ctx.toast(d.changed === false ? 'Nada mudou: este formulário já está como "' + d.status + '".' : msg); load(C, ctx, lid, true); }
        });
      };
    };
    return {
      show: true, canSend: active, notActive: !active,
      sub: !list.length ? 'Nenhum formulário enviado ainda.' : U.plural(list.length, 'envio', 'envios') + (pendN ? ' · ' + pendN + ' aguardando resposta' : ''),
      fail: !!ui.fmFail, reload: function () { load(C, ctx, lid, true); },
      open: !!ui.fmOpen, toggle: function () { ctx.setUi({ fmOpen: !ui.fmOpen, fmErr: '' }); }, toggleLabel: ui.fmOpen ? 'Fechar' : 'Enviar formulário',
      models: Object.keys(MODELS).map(function (k) { var on = ui.fmModel === k; return { label: MODELS[k].label, on: String(on), cls: 'chip' + (on ? ' is-on' : ''), pick: function () { ctx.setUi({ fmModel: k, fmTitle: MODELS[k].title, fmPurpose: MODELS[k].purpose, fmQs: MODELS[k].qs, fmErr: '' }); } }; }),
      title: ui.fmTitle || '', setTitle: function (e) { ctx.setUi({ fmTitle: U.val(e), fmErr: '' }); },
      purpose: ui.fmPurpose || '', setPurpose: function (e) { ctx.setUi({ fmPurpose: U.val(e) }); },
      qs: ui.fmQs || '', setQs: function (e) { ctx.setUi({ fmQs: U.val(e), fmErr: '' }); },
      preview: qs.length ? 'Como ' + nm + ' verá: ' + U.plural(qs.length, 'pergunta', 'perguntas') + ' com resposta em texto. Enviar não altera o treino. Depois de respondido, você marca como revisado.' : 'Uma pergunta por linha. Dor ou lesão é assunto para a conversa, não para formulário de rotina.',
      err: ui.fmErr || '', hasErr: !!ui.fmErr, send: send, sendLabel: ui.fmBusy ? 'Enviando…' : 'Enviar para ' + nm,
      rowErr: ui.fmRowErr || '', hasRowErr: !!ui.fmRowErr,
      has: list.length > 0,
      list: list.map(function (f) {
        var op = ui.fmSee === f.id;
        var stt = { enviado: 'Enviado em ' + day(f.sent_at) + ' · aguardando resposta', respondido: 'Respondido em ' + day(f.answered_at) + ' · ainda não revisado por você', revisado: 'Respondido em ' + day(f.answered_at) + ' · revisado em ' + day(f.reviewed_at), cancelado: 'Envio cancelado · ' + nm + ' não vê mais' }[f.status] || f.status;
        return { title: f.title, meta: stt + ' · ' + U.plural((f.questions || []).length, 'pergunta', 'perguntas'), badge: { enviado: 'Aguardando', respondido: 'Para revisar', revisado: 'Revisado', cancelado: 'Cancelado' }[f.status] || '', badgeCls: 'badge ' + (f.status === 'respondido' ? 'badge--warn' : 'badge--plain'),
          canSee: f.status === 'respondido' || f.status === 'revisado', seeLabel: op ? 'Fechar respostas' : 'Ver respostas', see: function () { ctx.setUi({ fmSee: op ? '' : f.id }); }, open: op, pairs: op ? pairs(f) : [],
          canReview: f.status === 'respondido', review: setSt(f, 'revisado', 'Marcado como revisado.'),
          canCancel: f.status === 'enviado', cancel: setSt(f, 'cancelado', 'Envio cancelado. ' + nm + ' não vê mais este formulário.') };
      })
    };
  }

  // ---------- aluno: no Hoje ----------
  function student(ctx, link, visible) {
    var C = window.CONTA, ui = ctx.ui, tf = first(link.trainerName || 'seu treinador');
    if (!visible) return { show: false };
    load(C, ctx, link.id);
    var list = ui.fmList || [];
    var draftKey = function (id) { return 'c99.formRasc.' + id; };
    var draft = function (id) { var a = (ui.fmAns || {})[id]; if (a) return a; try { return JSON.parse((LS && LS.getItem(draftKey(id))) || '{}'); } catch (_) { return {}; } };
    var pend = list.filter(function (f) { return f.status === 'enviado'; }).map(function (f) {
      var a = draft(f.id), filled = (f.questions || []).filter(function (q) { return String(a[q.id] || '').trim(); }).length;
      var busy = ui.fmBusy === f.id, err = ui.fmErrId === f.id ? ui.fmErr : '';
      return { title: f.title, from: tf + ' enviou em ' + day(f.sent_at) + (f.purpose ? ' · ' + f.purpose : ''),
        note: 'Suas respostas vão só para ' + tf + '. Depois de enviar não dá para editar; o rascunho fica guardado neste aparelho até você enviar.',
        qs: (f.questions || []).map(function (q, i) { return { id: 'fm-' + f.id.slice(0, 8) + '-' + i, label: q.label, val: a[q.id] || '', set: function (e) {
          var n = Object.assign({}, draft(f.id)); n[q.id] = U.val(e); var all = Object.assign({}, ui.fmAns || {}); all[f.id] = n;
          try { if (LS) LS.setItem(draftKey(f.id), JSON.stringify(n)); } catch (_) {}
          ctx.setUi({ fmAns: all, fmErr: '', fmErrId: '' }); } }; }),
        progress: filled + ' de ' + (f.questions || []).length + ' respondidas', err: err, hasErr: !!err,
        sendLabel: busy ? 'Enviando…' : 'Enviar respostas para ' + tf,
        send: function () {
          if (ui.fmBusy) return;
          if (!filled) return ctx.setUi({ fmErr: 'Responda pelo menos uma pergunta antes de enviar.', fmErrId: f.id });
          var out = {}; (f.questions || []).forEach(function (q) { var v = String(a[q.id] || '').trim().slice(0, 2000); if (v) out[q.id] = v; });
          ctx.setUi({ fmBusy: f.id, fmErr: '', fmErrId: '' });
          C.rpc('answer_form', { p_send: f.id, p_answers: out, p_idem: 'resposta:' + f.id }).then(function (r) {
            if (!r.ok) return ctx.setUi({ fmBusy: '', fmErrId: f.id, fmErr: r.offline ? 'Sem conexão: as respostas não foram enviadas. Elas continuam aqui; tente de novo.' : 'Não enviado: ' + (r.msg || r.status) + '. Suas respostas continuam aqui.' });
            try { if (LS) LS.removeItem(draftKey(f.id)); } catch (_) {}
            var d = r.data || {};
            ctx.setUi({ fmBusy: '' }); ctx.toast(d.changed === false ? 'Este formulário já estava ' + (d.status === 'cancelado' ? 'cancelado por ' + tf : 'respondido') + '.' : 'Respostas enviadas para ' + tf + '.'); load(C, ctx, link.id, true);
          });
        } };
    });
    var done = list.filter(function (f) { return f.status === 'respondido' || f.status === 'revisado'; }).slice(0, 3).map(function (f) {
      var op = ui.fmSee === f.id;
      return { title: f.title, meta: 'Você respondeu em ' + day(f.answered_at) + (f.status === 'revisado' ? ' · ' + tf + ' revisou em ' + day(f.reviewed_at) : ' · ' + tf + ' ainda não marcou como revisado'), seeLabel: op ? 'Fechar' : 'Ver o que respondi', see: function () { ctx.setUi({ fmSee: op ? '' : f.id }); }, open: op, pairs: op ? pairs(f) : [] };
    });
    return { show: pend.length + done.length > 0 || !!ui.fmFail, hasPend: pend.length > 0, pend: pend, hasDone: done.length > 0, done: done, fail: !!ui.fmFail && !list.length, reload: function () { load(C, ctx, link.id, true); } };
  }
  window.FORMS = { trainer: trainer, student: student, pendingCount: function (ctx) { return (ctx.ui.fmList || []).filter(function (f) { return f.status === 'enviado'; }).length; } };
})();
