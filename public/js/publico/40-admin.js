/* ADM-R · Administração real (M12): filas do banco para decidir pedidos de retirada/correção, reivindicações de perfil
   e conferências de CREF. O banco só aceita decisões de quem tem papel admin E entrou com verificação em duas etapas
   (aal2); por isso a tela conduz a pessoa a cadastrar/usar o app autenticador antes de mostrar as filas.
   Toda recusa ou conclusão exige explicação; a decisão vale para a pessoa do outro lado (protocolo, conta). */
(function () {
  var C = function () { return window.CONTA; };
  var one = function (r) { return r && r.ok && r.data ? (Array.isArray(r.data) ? r.data[0] : r.data) : null; };
  var when = function (d) { return d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''; };
  var ERR = { motivo_obrigatorio: 'Escreva o motivo: a pessoa recebe essa explicação.', explicacao_obrigatoria: 'Escreva a explicação: a pessoa recebe esse texto.', pedido_ja_decidido: 'Outra pessoa da equipe já decidiu este pedido.', conferencia_ja_decidida: 'Esta conferência já foi decidida.', numero_mudou: 'O treinador mudou o número do CREF depois do pedido: peça uma nova conferência.', pedido_encerrado: 'Este pedido já foi encerrado.', 'próprio': 'Você não pode decidir um pedido seu.', aal2: 'Sua sessão precisa da verificação em duas etapas. Entre o código de novo.' };
  var why = function (r) { var m = String(r.msg || ''); for (var k in ERR) if (m.indexOf(k) >= 0) return ERR[k]; return r.offline ? 'Sem conexão: nada foi decidido.' : 'O servidor não aceitou (' + (m || r.status) + '). Nada foi decidido.'; };

  REG.screen({
    page: 'publico', key: 'admin', id: 'ADMR', title: 'Administração', nav: 'conta',
    vals: function (ctx) {
      var ui = ctx.ui, logged = !!(C() && C().session());
      if (!logged) return { anon: true, login: function () { GO('@onboarding', { flow: 'entrar' }); } };
      // 1. é admin?
      if (ui.isAdmin == null && !ui.chk) { ctx.setUi({ chk: true }); C().rpc('is_admin', { p_require_mfa: false }).then(function (r) { ctx.setUi({ isAdmin: r.ok && r.data === true }); }); }
      var aal2 = C().aal() === 'aal2';
      // 2. verificação em duas etapas
      if (ui.isAdmin && !aal2 && ui.factors == null && !ui.fchk) { ctx.setUi({ fchk: true }); C().mfaFactors().then(function (f) { ctx.setUi({ factors: f || [], fErr: f == null }); }); }
      var verified = (ui.factors || []).filter(function (f) { return f.status === 'verified'; })[0];
      var enroll = function () {
        if (ui.busy) return; ctx.setUi({ busy: true, mErr: '' });
        // fator não verificado de tentativa anterior: remove antes de criar outro
        var old = (ui.factors || []).filter(function (f) { return f.status !== 'verified'; });
        Promise.all(old.map(function (f) { return C().mfaUnenroll(f.id); })).then(function () { return C().mfaEnroll(); }).then(function (r) {
          if (!r.ok || !r.data || !r.data.totp) return ctx.setUi({ busy: false, mErr: why(r) });
          ctx.setUi({ busy: false, pending: { id: r.data.id, qr: r.data.totp.qr_code, secret: r.data.totp.secret } });
        });
      };
      var verify = function () {
        var code = String(ui.code || '').replace(/\D/g, '');
        if (code.length !== 6) return ctx.setUi({ mErr: 'O código tem 6 números.' });
        var id = ui.pending ? ui.pending.id : verified && verified.id;
        if (!id || ui.busy) return; ctx.setUi({ busy: true, mErr: '' });
        C().mfaVerify(id, code).then(function (r) {
          if (!r.ok) return ctx.setUi({ busy: false, mErr: /invalid|inválid|expired/i.test(r.msg || '') ? 'Código errado ou vencido. Use o código que aparece agora no app.' : why(r) });
          ctx.setUi({ busy: false, pending: null, code: '', q: null }); ctx.toast('Verificação em duas etapas confirmada.');
        });
      };
      // 3. filas
      var load = function () {
        ctx.setUi({ qBusy: true });
        Promise.all([C().rpc('admin_removal_queue', {}), C().rpc('admin_claim_queue', {}), C().rpc('admin_cref_queue', {})]).then(function (rs) {
          var bad = rs.filter(function (r) { return !r.ok; })[0];
          ctx.setUi({ qBusy: false, q: { rem: rs[0].data || [], claim: rs[1].data || [], cref: rs[2].data || [] }, qErr: bad ? why(bad) : '', at: new Date().toTimeString().slice(0, 5) });
        });
      };
      if (ui.isAdmin && aal2 && !ui.q && !ui.qBusy) setTimeout(load, 0);
      var q = ui.q || { rem: [], claim: [], cref: [] };
      var note = function (id) { return String((ui.notes || {})[id] || '').trim(); };
      var setNote = function (id) { return function (e) { var n = Object.assign({}, ui.notes || {}); n[id] = U.val(e); ctx.setUi({ notes: n, dErr: '' }); }; };
      var act = function (fn, args, okMsg) {
        if (ui.dBusy) return; ctx.setUi({ dBusy: true, dErr: '' });
        C().rpc(fn, args).then(function (r) { if (!r.ok) return ctx.setUi({ dBusy: false, dErr: why(r) }); ctx.setUi({ dBusy: false, q: null }); ctx.toast(okMsg + ' às ' + U.now() + '.'); });
      };
      // chave estável por decisão (pedido + ação): repetir depois de queda não decide duas vezes
      var idem = function (k) { return k; };
      var KIND = { corrigir: 'Corrigir dados', retirar: 'Retirar perfil' }, ST = { recebido: 'Recebido', em_analise: 'Em análise', precisa_complemento: 'Precisa de complemento' };
      return {
        anon: false, checking: ui.isAdmin == null, denied: ui.isAdmin === false,
        needMfa: !!ui.isAdmin && !aal2, ready: !!ui.isAdmin && aal2,
        hasFactor: !!verified && !ui.pending, noFactor: !verified && !ui.pending && ui.factors != null, pending: !!ui.pending,
        qr: ui.pending ? ui.pending.qr : '', secret: ui.pending ? ui.pending.secret : '',
        enroll: enroll, enrollLabel: ui.busy ? 'Preparando…' : 'Cadastrar app autenticador',
        code: ui.code || '', setCode: function (e) { ctx.setUi({ code: U.val(e).replace(/\D/g, '').slice(0, 6), mErr: '' }); }, verify: verify, verifyLabel: ui.busy ? 'Conferindo…' : 'Confirmar código',
        mErr: ui.mErr || '', hasMErr: !!ui.mErr,
        loading: !!ui.qBusy && !ui.q, at: ui.at || '', reload: function () { ctx.setUi({ q: null }); }, qErr: ui.qErr || '', hasQErr: !!ui.qErr, dErr: ui.dErr || '', hasDErr: !!ui.dErr,
        nRem: q.rem.length, nClaim: q.claim.length, nCref: q.cref.length, emptyAll: !!ui.q && !q.rem.length && !q.claim.length && !q.cref.length,
        rem: q.rem.map(function (r) {
          var id = r.request_id;
          return { title: KIND[r.kind] + ' · ' + (r.trainer_name || r.trainer_slug), meta: 'Protocolo ' + r.protocol + ' · ' + (ST[r.status] || r.status) + ' · ' + when(r.created_at) + (r.contact_email ? ' · resposta para ' + r.contact_email : ' · sem e-mail para resposta'),
            reason: r.reason, open: function () { window.open('/treinador/' + encodeURIComponent(r.trainer_slug), '_blank', 'noopener'); }, idN: 'n-' + id, note: (ui.notes || {})[id] || '', setNote: setNote(id),
            analyze: function () { act('admin_decide_removal', { p_request: id, p_status: 'em_analise', p_idem: idem('rm:' + id + ':analise') }, 'Marcado em análise'); },
            more: function () { act('admin_decide_removal', { p_request: id, p_status: 'precisa_complemento', p_note: note(id), p_idem: idem('rm:' + id + ':compl:' + note(id).length) }, 'Complemento pedido'); },
            retire: function () { ctx.ask({ title: 'Retirar o perfil de ' + (r.trainer_name || r.trainer_slug) + '?', lines: ['O perfil sai da busca e do endereço público. A retirada fica registrada e vale mesmo depois de restaurar uma cópia do banco.'], ok: 'Retirar perfil', onOk: function () { act('admin_decide_removal', { p_request: id, p_status: 'concluido', p_effect: 'perfil_retirado', p_note: note(id), p_idem: idem('rm:' + id + ':retirar') }, 'Perfil retirado'); } }); },
            fixed: function () { act('admin_decide_removal', { p_request: id, p_status: 'concluido', p_effect: 'dados_corrigidos', p_note: note(id), p_idem: idem('rm:' + id + ':corrigido') }, 'Pedido concluído'); },
            refuse: function () { act('admin_decide_removal', { p_request: id, p_status: 'recusado', p_note: note(id), p_idem: idem('rm:' + id + ':recusar') }, 'Pedido recusado'); },
            isRetire: r.kind === 'retirar', isFix: r.kind !== 'retirar' };
        }),
        claims: q.claim.map(function (r) {
          var id = r.request_id;
          return { title: (r.trainer_name || r.trainer_slug) + ' · protocolo ' + r.protocol, meta: 'Pedido por ' + (r.requester_email || 'conta sem e-mail') + ' em ' + when(r.requested_at) + (r.competing ? ' · ' + U.plural(r.competing, 'outro pedido', 'outros pedidos') + ' para o mesmo perfil' : ''),
            proof: r.proof_note, open: function () { window.open('/treinador/' + encodeURIComponent(r.trainer_slug), '_blank', 'noopener'); }, idN: 'n-' + id, note: (ui.notes || {})[id] || '', setNote: setNote(id),
            approve: function () { ctx.ask({ title: 'Transferir o perfil?', lines: ['A conta que pediu passa a ser titular do perfil de ' + (r.trainer_name || r.trainer_slug) + '.', r.competing ? 'Os outros pedidos para este perfil serão recusados.' : 'Confira as provas antes.'], ok: 'Aprovar', onOk: function () { act('admin_decide_claim', { p_request: id, p_decision: 'aprovado', p_note: note(id) || null, p_idem: idem('cl:' + id + ':aprovar') }, 'Reivindicação aprovada'); } }); },
            refuse: function () { act('admin_decide_claim', { p_request: id, p_decision: 'recusado', p_note: note(id), p_idem: idem('cl:' + id + ':recusar') }, 'Reivindicação recusada'); } };
        }),
        crefs: q.cref.map(function (r) {
          var id = r.review_id;
          return { title: (r.trainer_name || r.trainer_slug) + ' · CREF ' + r.cref, meta: 'Pedido em ' + when(r.requested_at), ev: r.evidence_note || 'Sem observação do treinador.', idN: 'n-' + id, note: (ui.notes || {})[id] || '', setNote: setNote(id),
            ok: function () { act('admin_decide_cref', { p_review: id, p_decision: 'conferido', p_note: note(id) || null, p_idem: idem('cr:' + id + ':ok') }, 'CREF conferido'); },
            bad: function () { act('admin_decide_cref', { p_review: id, p_decision: 'insuficiente', p_note: note(id), p_idem: idem('cr:' + id + ':nao') }, 'Conferência recusada'); } };
        }),
        back: function () { GO('@home'); }
      };
    }
  });
})();
