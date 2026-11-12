/* PUB12R · Corrigir, retirar ou reivindicar um perfil publicado (dados reais do banco).
   Plano DP07/PUB12/ACC08: qualquer pessoa pede correção ou retirada sem conta e recebe um protocolo para acompanhar;
   reivindicar ("é meu perfil") exige conta 18+ e passa por revisão humana — nada é transferido na hora. */
REG.screen({
  page: 'publico', key: 'perfilpedido', id: 'PUB12R', title: 'Corrigir, retirar ou reivindicar', nav: 'explorar',
  vals: function (ctx) {
    var C = window.CONTA, ui = ctx.ui, slug = String(ctx.id || ''), t = window.REAL ? window.REAL.get(slug) : null;
    var name = t ? t.name : 'este perfil', first = String(name).split(' ')[0];
    var logged = !!(C && C.session());
    var LS = function (k, v) { try { if (v === undefined) return window.localStorage.getItem(k); window.localStorage.setItem(k, v); } catch (_) { return null; } };
    var mine = (function () { try { return JSON.parse(LS('c99.retiradas') || '{}'); } catch (_) { return {}; } })();
    var prev = mine[slug] || null;
    var ERR = { relato_curto: 'Conte o que precisa ser feito em pelo menos 10 caracteres.', email_invalido: 'Esse e-mail não parece válido. Ele é opcional.', perfil_inexistente: 'Este perfil não está mais publicado.',
      limite_de_pedidos: 'Este perfil já tem muitos pedidos abertos. Tente de novo mais tarde.', prova_curta: 'Explique em pelo menos 10 caracteres como podemos confirmar que o perfil é seu.',
      conta_ja_tem_perfil: 'Sua conta já tem um perfil de treinador. Para unir os dois, fale com a equipe pela Ajuda.', idade_nao_confirmada: 'Confirme que você tem 18 anos ou mais.', 'conta bloqueada': 'Esta conta está bloqueada.' };
    var why = function (r) { var m = String(r.msg || ''); for (var k in ERR) if (m.indexOf(k) >= 0) return ERR[k]; return r.offline ? 'Sem conexão: nada foi enviado. Tente de novo.' : 'Não foi possível enviar agora (' + (m || r.status) + '). Nada foi registrado.'; };
    var key = function () { var a = new Uint8Array(24); (window.crypto || {}).getRandomValues ? window.crypto.getRandomValues(a) : a.forEach(function (_, i) { a[i] = Math.random() * 256; }); return Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); };
    var send = function () {
      if (ui.busy) return;
      var kind = ui.kind || 'corrigir', reason = String(ui.reason || '').trim(), contact = String(ui.contact || '').trim();
      if (reason.length < 10) return ctx.setUi({ err: ERR.relato_curto });
      // a mesma chave enquanto a pessoa tenta o MESMO pedido (resposta perdida não cria pedido em dobro)
      var k = ui.pendKey && ui.pendFor === kind + reason ? ui.pendKey : key();
      ctx.setUi({ busy: true, err: '', pendKey: k, pendFor: kind + reason });
      C.rpc('submit_removal_request', { p_slug: slug, p_kind: kind, p_reason: reason, p_contact: contact || null, p_key: k }).then(function (r) {
        var d = r.ok && r.data ? (Array.isArray(r.data) ? r.data[0] : r.data) : null;
        if (!r.ok || !d || !d.protocol) return ctx.setUi({ busy: false, err: why(r) });
        mine[slug] = { protocol: d.protocol, key: k, kind: d.kind, at: new Date().toISOString() }; LS('c99.retiradas', JSON.stringify(mine));
        ctx.setUi({ busy: false, sent: d.protocol, status: d.status });
      });
    };
    var check = function () {
      if (!prev || ui.checking) return; ctx.setUi({ checking: true });
      C.rpc('removal_status', { p_protocol: prev.protocol, p_key: prev.key }).then(function (r) {
        var d = r.ok && r.data ? (Array.isArray(r.data) ? r.data[0] : r.data) : null;
        ctx.setUi({ checking: false, status: d ? d.status : '', statusNote: d && d.note ? d.note : '', statusErr: !r.ok });
      });
    };
    if (prev && ui.status == null && !ui.checking && !ui.sent) setTimeout(check, 0);
    var claim = function () {
      if (ui.cbusy) return;
      if (!ui.adult) return ctx.setUi({ cerr: ERR.idade_nao_confirmada });
      var note = String(ui.proof || '').trim();
      if (note.length < 10) return ctx.setUi({ cerr: ERR.prova_curta });
      ctx.setUi({ cbusy: true, cerr: '' });
      C.confirmAdult().then(function () { var ck = 'claim:' + slug; return C.rpc('request_claim', { p_slug: slug, p_note: note, p_idem: C.intent(ck) }).then(C.settle(ck)); }).then(function (r) {
        var d = r.ok && r.data ? (Array.isArray(r.data) ? r.data[0] : r.data) : null;
        if (!r.ok || !d) return ctx.setUi({ cbusy: false, cerr: why(r) });
        ctx.setUi({ cbusy: false, claimed: d.status === 'ja_tem_titular' ? 'Este perfil já tem titular. Se ele é seu, peça revisão pela Ajuda.' : 'Pedido enviado' + (d.protocol ? ' · protocolo ' + d.protocol : '') + '. A equipe revisa as provas antes de transferir o perfil; você recebe a resposta na sua conta.' });
      });
    };
    var ST = { recebido: 'Recebido', em_analise: 'Em análise', precisa_complemento: 'Precisa de complemento', concluido: 'Concluído', recusado: 'Recusado', nao_encontrado: 'Não encontrado' };
    return {
      name: name, first: first, hasT: !!t, noT: !t,
      kinds: [['corrigir', 'Corrigir dados', 'Algo está errado: nome, cidade, modalidade, contato.'], ['retirar', 'Retirar o perfil', 'Tirar o perfil do 99coach.']].map(function (k) { var on = (ui.kind || 'corrigir') === k[0]; return { label: k[1], sub: k[2], on: String(on), cls: 'onb-choice' + (on ? ' is-on' : ''), pick: function () { ctx.setUi({ kind: k[0], err: '' }); } }; }),
      reason: ui.reason || '', setReason: function (e) { ctx.setUi({ reason: U.val(e), err: '' }); }, contact: ui.contact || '', setContact: function (e) { ctx.setUi({ contact: U.val(e), err: '' }); },
      send: send, sendLabel: ui.busy ? 'Enviando…' : 'Enviar pedido', err: ui.err || '', hasErr: !!ui.err,
      sent: !!ui.sent, protocol: ui.sent || (prev && prev.protocol) || '', hasPrev: !!prev && !ui.sent,
      statusTxt: ui.checking ? 'Consultando…' : (ui.statusErr ? 'Não foi possível consultar agora.' : (ST[ui.status] || ui.status || '')), statusNote: ui.statusNote || '', check: check,
      logged: logged, anon: !logged, login: function () { try { window.localStorage.setItem('c99.depoisEntrar', '#publico-perfilpedido-' + slug); } catch (_) {} GO('@onboarding', { flow: 'entrar' }); },
      proof: ui.proof || '', setProof: function (e) { ctx.setUi({ proof: U.val(e), cerr: '' }); },
      adultOn: String(!!ui.adult), adultCls: 'check' + (ui.adult ? ' is-on' : ''), toggleAdult: function () { ctx.setUi({ adult: !ui.adult, cerr: '' }); },
      claim: claim, claimLabel: ui.cbusy ? 'Enviando…' : 'Pedir para assumir este perfil', cerr: ui.cerr || '', hasCerr: !!ui.cerr, claimed: ui.claimed || '', hasClaimed: !!ui.claimed,
      back: function () { if (window.NAV) window.NAV.go('perfil', { id: slug }, null); }
    };
  }
});
