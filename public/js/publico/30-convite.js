/* REL03 · Convite pelo link (real). Diretrizes: convite individual, vale 7 dias, uso único pelo destinatário autenticado;
   o aceite é um toque explícito (nunca automático pelo link ou pelo login); vínculo antes de preparação; contas 18+. */
REG.screen({
  page: 'publico', key: 'convite', id: 'REL03', title: 'Convite', nav: 'explorar',
  vals: function (ctx) {
    var stored = ''; try { stored = localStorage.getItem('c99.conviteCode') || ''; } catch (_) {}
    var raw = String(ctx.id || stored || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    // o código não fica no endereço depois de aberto (fica guardado só neste aparelho até o aceite)
    if (ctx.id && raw.length === 8) { try { localStorage.setItem('c99.conviteCode', raw); history.replaceState(history.state, '', location.pathname + '#publico-convite'); } catch (_) {} }
    var code = raw.length === 8 ? raw.slice(0, 4) + '-' + raw.slice(4) : '';
    var ui = ctx.ui, C = window.CONTA, logged = !!(C && C.session());
    if (code && C && !ui.asked) {
      ctx.setUi({ asked: true, loading: true });
      C.invitePreview(code).then(function (r) {
        var d = r.ok && r.data ? (Array.isArray(r.data) ? r.data[0] : r.data) : null;
        ctx.setUi({ loading: false, offline: !!r.offline, prev: d, err: !r.ok && !r.offline ? (r.msg || ('erro ' + r.status)) : '' });
      });
    }
    var p = ui.prev, st = p && p.state;
    var trainer = p && p.trainer ? p.trainer : null;
    var MSG = {
      vencido: ['Este convite venceu', 'Convites valem 7 dias. Peça um link novo ao treinador.'],
      usado: ['Este convite já foi usado', 'Cada convite é aceito uma vez. Se foi você, seu acompanhamento já está na sua conta.'],
      revogado: ['Este convite foi cancelado', 'O treinador cancelou este convite. Fale com ele para receber outro, se for o caso.'],
      treinador_indisponivel: ['Treinador indisponível agora', 'Este perfil não está recebendo alunos no momento.']
    };
    var OUT = {
      vinculo_ativo: 'Pronto: vocês estão conectados.', ja_ativo: 'Vocês já estavam conectados.',
      conta_incompativel: 'Este convite foi feito para outra conta. Use a conta do e-mail que recebeu o convite.',
      vencido: MSG.vencido[1], usado: MSG.usado[1], revogado: MSG.revogado[1], treinador_indisponivel: MSG.treinador_indisponivel[1],
      idade_nao_confirmada: 'Confirme que você tem 18 anos ou mais para aceitar.', email_nao_confirmado: 'Antes de aceitar, confirme seu e-mail com o código que enviamos.', capacidade_esgotada: 'O treinador está sem vagas agora. Fale com ele antes de tentar de novo.'
    };
    var remember = function () { try { localStorage.setItem('c99.conviteCode', raw); } catch (_) {} };
    // idade: só pergunta se a conta ainda não declarou (conta certa = uma ação, zero campos)
    if (logged && ui.adultKnown == null && !ui.meAsked) { ctx.setUi({ meAsked: true }); C.me().then(function (r) { var m = r.ok && r.data && r.data[0]; ctx.setUi({ adultKnown: !!(m && m.adult_confirmed_at) }); }); }
    var needAdult = logged && ui.adultKnown === false;
    var sendCode = function () { if (ui.cBusy) return; ctx.setUi({ cBusy: true, cErr: '' }); C.sendCode(C.user().email, '').then(function (r) { ctx.setUi({ cBusy: false, cSent: !!(r && r.ok !== false), cErr: r && r.ok === false ? 'Não foi possível enviar o código agora.' : '' }); }); };
    var checkCode = function () {
      var cd = String(ui.cCode || '').replace(/\D/g, ''); if (cd.length !== 6) return ctx.setUi({ cErr: 'O código tem 6 números.' });
      if (ui.cBusy) return; ctx.setUi({ cBusy: true, cErr: '' });
      C.verify(C.user().email, cd).then(function (r) { if (!r.ok) return ctx.setUi({ cBusy: false, cErr: 'Código errado ou vencido. Peça um novo.' }); ctx.setUi({ cBusy: false, needEmail: false, outMsg: '' }); accept(); });
    };
    var accept = function () {
      if (needAdult && !ui.adult) return ctx.setUi({ adultErr: true });
      if (ui.busy) return;
      ctx.setUi({ busy: true, outMsg: '' });
      (needAdult ? C.confirmAdult() : Promise.resolve({ ok: true })).then(function (a) {
        if (a && a.ok === false) return { ok: false, msg: 'idade', offline: a.offline };
        return C.acceptInvite(code);
      }).then(function (r) {
        var d = r.ok && r.data ? (Array.isArray(r.data) ? r.data[0] : r.data) : null, out = d && d.outcome;
        if (!r.ok) return ctx.setUi({ busy: false, outMsg: r.offline ? 'Conexão necessária para confirmar. Não sabemos se o aceite chegou: toque em Aceitar de novo para consultar (não duplica).' : (r.status === 429 ? 'Muitas tentativas em pouco tempo. Aguarde um minuto e tente de novo.' : 'Não foi possível aceitar agora. Tente de novo em instantes.') });
        if (out === 'vinculo_ativo' || out === 'ja_ativo') {
          try { localStorage.removeItem('c99.conviteCode'); } catch (_) {}
          return C.addRole('aluno').then(function () { return C.syncRoles(); }).then(function () { return C.links(); }).then(function () { ctx.setUi({ busy: false, done: true, outMsg: OUT[out] }); });
        }
        if (out === 'email_nao_confirmado') { ctx.setUi({ busy: false, needEmail: true, outMsg: '' }); return sendCode(); }
        ctx.setUi({ busy: false, outMsg: OUT[out] || 'Não foi possível confirmar o aceite agora. Tente de novo.', wrongAcct: out === 'conta_incompativel' });
      });
    };
    var myL = window.ACCT && window.ACCT.myTrainer ? window.ACCT.myTrainer() : null;
    // "já aceito por você": o convite foi usado, o servidor diz que era para esta conta e existe o vínculo com este treinador
    var mine = st === 'usado' && logged && p && p.forMe !== false && !!(window.ACCT.myLinks ? window.ACCT.myLinks() : [myL]).filter(function (l) { return l && trainer && (l.trainerSlug === trainer.slug || l.trainerName === trainer.name); })[0];
    var first = trainer ? String(trainer.name).split(' ')[0] : '';
    var useOther = function () { remember(); window.SIGN_OUT(['c99.conviteCode'], location.pathname + '#onboarding-entrar'); };
    var expires = p && p.expiresAt ? new Date(p.expiresAt).toLocaleDateString('pt-BR') : '';
    return {
      noCode: !code, loading: !!ui.loading, offline: !!ui.offline, err: ui.err || '', hasErr: !!ui.err,
      valid: st === 'valido' && !ui.done, closed: !!(st && st !== 'valido' && MSG[st]) && !mine, closedT: st && MSG[st] ? MSG[st][0] : '', closedX: st && MSG[st] ? MSG[st][1] : '',
      tName: trainer ? trainer.name : '', tMeta: [trainer && trainer.city, trainer && trainer.credential].filter(Boolean).join(' · '), svc: p && p.service ? p.service : 'Acompanhamento',
      tIni: trainer ? U.ini(trainer.name) : '', tPhoto: trainer && trainer.photo ? trainer.photo : '', hasPhoto: !!(trainer && trainer.photo), noPhoto: !(trainer && trainer.photo),
      expires: expires ? 'Vale até ' + expires : '', logged: logged, anon: !logged,
      adultOn: String(!!ui.adult), adultCls: 'check' + (ui.adult ? ' is-on' : ''), adultErr: !!ui.adultErr, toggleAdult: function () { ctx.setUi({ adult: !ui.adult, adultErr: false }); },
      busy: !!ui.busy, acceptLabel: ui.busy ? 'Aceitando…' : 'Aceitar convite', accept: accept,
      outMsg: ui.outMsg || '', hasOut: !!ui.outMsg && !ui.done, done: !!ui.done, doneMsg: ui.outMsg || '',
      signup: function () { remember(); GO('@onboarding', { flow: 'aluno' }); },
      login: function () { remember(); GO('@onboarding', { flow: 'entrar' }); },
      openApp: function () { GO('@aluno'); }, home: function () { GO('@home'); },
      title: trainer ? 'Treine com ' + trainer.name : 'Convite para treinar', sub: trainer ? first + ' convidou você para acompanhar seus treinos no 99Coach.' : 'Aceitar cria o vínculo com o treinador.', fine: 'Aceitar cria o vínculo; nada é cobrado aqui.',
      needAdult: needAdult, needEmail: !!ui.needEmail, cSent: !!ui.cSent, cCode: ui.cCode || '', setCCode: function (e) { ctx.setUi({ cCode: U.val(e).replace(/\D/g, '').slice(0, 6), cErr: '' }); }, checkCode: checkCode, resend: sendCode, cErr: ui.cErr || '', hasCErr: !!ui.cErr, cLabel: ui.cBusy ? 'Conferindo…' : 'Confirmar e aceitar convite',
      email: logged && C.user() ? C.user().email : '', useOther: useOther, wrongAcct: !!ui.wrongAcct,
      mine: !!mine, closedOther: !!(st && st !== 'valido' && MSG[st]) && !mine,
      doneTitle: 'Seu acompanhamento com ' + (first || 'o treinador') + ' está confirmado', doneNext: first ? 'Próximo passo: responder 3 perguntas para ' + first + ' montar seu treino.' : 'Próximo passo: responder a preparação.'
    };
  }
});
