/* Verificação em duas etapas para qualquer conta (aplicativo autenticador, código de 6 números).
   Vale no servidor: quem ligou só lê ou grava dados depois de confirmar o código naquela sessão.
   - MFA2.manage(ctx): bloco de "Meus dados e segurança" para ligar e desligar.
   - tela "duasetapas": pede o código quando o servidor recusa a sessão que ainda não confirmou. */
(function () {
  var U = window.U;
  var C = function () { return window.CONTA; };
  var why = function (r) { return r && r.offline ? 'Sem conexão. Tente de novo.' : 'Não foi possível agora' + (r && (r.msg || r.status) ? ': ' + (r.msg || r.status) : '') + '.'; };
  var badCode = function (r) { return /invalid|inválid|expired|mismatch/i.test((r && r.msg) || '') ? 'Código errado ou vencido. Use o código que aparece agora no aplicativo.' : why(r); };

  function manage(ctx) {
    var ui = ctx.ui, c = C();
    if (!c || !c.session()) return { show: false };
    var load = function () { ctx.setUi({ mfAsked: true }); c.mfaFactors().then(function (f) { ctx.setUi({ mfFactors: f || [], mfFail: f == null }); }); };
    if (!ui.mfAsked) load();
    var factors = ui.mfFactors, verified = (factors || []).filter(function (f) { return f.status === 'verified'; })[0], p = ui.mfPending;
    var enroll = function () {
      if (ui.mfBusy) return; ctx.setUi({ mfBusy: true, mfErr: '' });
      var old = (factors || []).filter(function (f) { return f.status !== 'verified'; });   // tentativa anterior não concluída
      Promise.all(old.map(function (f) { return c.mfaUnenroll(f.id); })).then(function () { return c.mfaEnroll(); }).then(function (r) {
        if (!r.ok || !r.data || !r.data.totp) return ctx.setUi({ mfBusy: false, mfErr: why(r) });
        ctx.setUi({ mfBusy: false, mfPending: { id: r.data.id, qr: r.data.totp.qr_code, secret: r.data.totp.secret }, mfCode: '' });
      });
    };
    var verify = function () {
      var code = String(ui.mfCode || '').replace(/\D/g, '');
      if (code.length !== 6) return ctx.setUi({ mfErr: 'O código tem 6 números.' });
      if (!p || ui.mfBusy) return; ctx.setUi({ mfBusy: true, mfErr: '' });
      c.mfaVerify(p.id, code).then(function (r) {
        if (!r.ok) return ctx.setUi({ mfBusy: false, mfErr: badCode(r) });
        ctx.setUi({ mfBusy: false, mfPending: null, mfCode: '' }); ctx.toast('Verificação em duas etapas ligada. Nos próximos acessos vamos pedir o código.'); load();
      });
    };
    var off = function () {
      ctx.ask({ title: 'Desligar a verificação em duas etapas?', lines: ['Sua conta volta a entrar só com e-mail e senha (ou com o Google).', 'Você pode ligar de novo quando quiser.'], ok: 'Desligar', cancel: 'Manter ligada', danger: true, onOk: function () {
        ctx.setUi({ mfBusy: true, mfErr: '' });
        c.mfaUnenroll(verified.id).then(function (r) { ctx.setUi({ mfBusy: false, mfErr: r.ok ? '' : why(r) }); if (r.ok) { ctx.toast('Verificação em duas etapas desligada.'); load(); } });
      } });
    };
    return {
      show: true, loading: factors == null && !ui.mfFail, fail: !!ui.mfFail, reload: load,
      isOn: !!verified, isOff: factors != null && !verified && !p, pending: !!p,
      onTxt: 'Ligada. Para entrar, além da senha, pedimos o código do seu aplicativo autenticador. Sem o código, ninguém lê nem altera os seus dados.',
      offTxt: 'Desligada. Ligada, cada novo acesso pede também um código de 6 números de um aplicativo autenticador.',
      warn: 'Guarde o acesso ao aplicativo: sem ele você não consegue entrar. Se trocar de celular, desligue aqui antes ou transfira o autenticador.',
      enroll: enroll, enrollLabel: ui.mfBusy ? 'Preparando…' : 'Ligar verificação em duas etapas',
      qr: p ? p.qr : '', secret: p ? p.secret : '', code: ui.mfCode || '', setCode: function (e) { ctx.setUi({ mfCode: U.val(e), mfErr: '' }); },
      verify: verify, verifyLabel: ui.mfBusy ? 'Conferindo…' : 'Confirmar código e ligar',
      cancel: function () { if (p) c.mfaUnenroll(p.id); ctx.setUi({ mfPending: null, mfCode: '', mfErr: '' }); load(); },
      off: off, offLabel: ui.mfBusy ? 'Desligando…' : 'Desligar', err: ui.mfErr || '', hasErr: !!ui.mfErr
    };
  }
  window.MFA2 = { manage: manage };

  // o servidor recusou porque falta o código nesta sessão: leva para a tela do código (uma vez por recusa)
  var asking = false, timer = null;
  var onCode = function () { return /duasetapas/.test(location.hash || ''); };
  window.__needSecondStep = function () {
    // várias chamadas são recusadas ao mesmo tempo, e a primeira pode chegar antes de o app terminar de abrir: tenta até abrir a tela
    if (timer) return;
    var tries = 0;
    timer = setInterval(function () {
      if (onCode() || ++tries > 40) { clearInterval(timer); timer = null; return; }
      if (window.NAV && document.querySelector('#app *')) window.NAV.go('publico', { s: 'duasetapas' }, null);
    }, 250);
  };

  // recusa que chegou antes de este módulo carregar (o app busca dados logo ao abrir)
  if (window.__secondStepPending) window.__needSecondStep();

  REG.screen({
    page: 'publico', key: 'duasetapas', id: 'ACC2FA', title: 'Confirmar acesso', nav: 'conta',
    vals: function (ctx) {
      var ui = ctx.ui, c = C(), logged = !!(c && c.session());
      if (logged && !ui.asked) { ctx.setUi({ asked: true }); c.mfaFactors().then(function (f) { ctx.setUi({ factors: f || [], fail: f == null }); }); }
      var verified = (ui.factors || []).filter(function (f) { return f.status === 'verified'; })[0];
      var done = function () { asking = false; window.__secondStepPending = false; var a = window.ACCT && window.ACCT.area(); if (window.__refreshLinks) window.__refreshLinks(); window.NAV.go(a || 'home', {}, null); };
      // já confirmou nesta sessão, ou a conta não tem segunda etapa: nada a pedir
      if (logged && ui.factors && (!verified || c.aal() === 'aal2') && !ui.left) { ctx.setUi({ left: true }); setTimeout(done, 0); }
      return {
        anon: !logged, login: function () { asking = false; window.NAV.go('onboarding', { flow: 'entrar' }, null); },
        loading: logged && ui.factors == null && !ui.fail, fail: !!ui.fail, reload: function () { ctx.setUi({ asked: false, fail: false }); },
        ask: logged && !!verified && c.aal() !== 'aal2',
        code: ui.code || '', setCode: function (e) { ctx.setUi({ code: U.val(e), err: '' }); },
        err: ui.err || '', hasErr: !!ui.err, label: ui.busy ? 'Conferindo…' : 'Confirmar e entrar',
        verify: function () {
          var code = String(ui.code || '').replace(/\D/g, '');
          if (code.length !== 6) return ctx.setUi({ err: 'O código tem 6 números.' });
          if (ui.busy || !verified) return; ctx.setUi({ busy: true, err: '' });
          c.mfaVerify(verified.id, code).then(function (r) { if (!r.ok) return ctx.setUi({ busy: false, err: badCode(r) }); ctx.setUi({ busy: false, code: '' }); done(); });
        },
        out: function () { asking = false; if (window.SIGN_OUT) window.SIGN_OUT(); }
      };
    }
  });
})();
