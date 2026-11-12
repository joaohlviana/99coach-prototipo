/* PUB17 · Pedir acompanhamento a um treinador real. Diretrizes: pedido não é vínculo; o treinador aceita ou recusa;
   nada é cobrado no pedido; contas 18+; um pedido pendente por treinador. */
REG.screen({
  page: 'publico', key: 'pedir', id: 'PUB17', title: 'Pedir acompanhamento', nav: 'explorar',
  vals: function (ctx) {
    var C = window.CONTA, ui = ctx.ui, slug = String(ctx.id || ''), t = window.REAL ? window.REAL.get(slug) : null, logged = !!(C && C.session());
    var name = t ? t.name : 'o treinador', first = String(name).split(' ')[0];
    var send = function () {
      if (!ui.adult) return ctx.setUi({ adultErr: true });
      if (ui.busy) return;
      var msg = String(ui.msg || '').trim();
      if (msg.length > 600) return ctx.setUi({ err: 'A mensagem passou de 600 caracteres.' });
      ctx.setUi({ busy: true, err: '' });
      C.confirmAdult().then(function () { return C.addRole('aluno'); }).then(function () { return C.createRequest(slug, msg, { esporte: (t && t.sports && t.sports[0]) || null, cidade: null }); }).then(function (r) {
        if (!r.ok) return ctx.setUi({ busy: false, err: r.offline ? 'Sem conexão: o pedido não foi enviado.' : 'O servidor não recebeu o pedido: ' + (r.msg || ('erro ' + r.status)) });
        if (window.__refreshLinks) window.__refreshLinks();
        C.syncRoles();
        ctx.setUi({ busy: false, done: true, already: !!r.already });
      });
    };
    return {
      name: name, first: first, ini: t ? t.ini : '', meta: t ? [t.spec, t.city || 'Atende online'].filter(Boolean).join(' · ') : '',
      hasPhoto: !!(t && t.photo), noPhoto: !(t && t.photo), photo: t && t.photo ? t.photo : '',
      logged: logged, anon: !logged, form: logged && !ui.done, done: !!ui.done,
      doneT: ui.already ? 'Você já tem um pedido aberto com ' + first : 'Pedido enviado a ' + first,
      msg: ui.msg || '', setMsg: function (e) { ctx.setUi({ msg: U.val(e), err: '' }); },
      adultOn: String(!!ui.adult), adultCls: 'check' + (ui.adult ? ' is-on' : ''), adultErr: !!ui.adultErr, toggleAdult: function () { ctx.setUi({ adult: !ui.adult, adultErr: false }); },
      send: send, sendLabel: ui.busy ? 'Enviando…' : 'Enviar pedido', err: ui.err || '', hasErr: !!ui.err,
      // a intenção (este treinador) sobrevive a entrar ou criar conta: volta para este pedido depois
      signup: function () { try { localStorage.setItem('c99.depoisEntrar', '#publico-pedir-' + slug); localStorage.setItem('c99.depoisEntrarAte', String(Date.now() + 864e5)); } catch (_) {} GO('@onboarding', { flow: 'aluno' }); },
      login: function () { try { localStorage.setItem('c99.depoisEntrar', '#publico-pedir-' + slug); localStorage.setItem('c99.depoisEntrarAte', String(Date.now() + 864e5)); } catch (_) {} GO('@onboarding', { flow: 'entrar' }); },
      back: function () { GO('@perfil', { id: slug }); }, openApp: function () { GO('@aluno'); }
    };
  }
});
