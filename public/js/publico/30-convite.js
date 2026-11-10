/* REL03 · Convite pelo link (real). Diretrizes: convite individual, vale 7 dias, uso único pelo destinatário autenticado;
   o aceite é um toque explícito (nunca automático pelo link ou pelo login); vínculo antes de preparação; contas 18+. */
REG.screen({
  page: 'publico', key: 'convite', id: 'REL03', title: 'Convite', nav: 'explorar',
  vals: function (ctx) {
    var raw = String(ctx.id || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
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
      conta_incompativel: 'Este convite foi feito para outra pessoa. Entre com a conta do e-mail convidado.',
      vencido: MSG.vencido[1], usado: MSG.usado[1], revogado: MSG.revogado[1], treinador_indisponivel: MSG.treinador_indisponivel[1],
      idade_nao_confirmada: 'Confirme que você tem 18 anos ou mais para aceitar.', capacidade_esgotada: 'O treinador está sem vagas agora. Fale com ele antes de tentar de novo.'
    };
    var remember = function () { try { localStorage.setItem('c99.conviteCode', raw); } catch (_) {} };
    var accept = function () {
      if (!ui.adult) return ctx.setUi({ adultErr: true });
      if (ui.busy) return;
      ctx.setUi({ busy: true, outMsg: '' });
      C.confirmAdult().then(function () { return C.acceptInvite(code); }).then(function (r) {
        var d = r.ok && r.data ? (Array.isArray(r.data) ? r.data[0] : r.data) : null, out = d && d.outcome;
        if (!r.ok) return ctx.setUi({ busy: false, outMsg: r.offline ? 'Sem conexão: o convite não foi aceito. Tente de novo.' : 'O servidor não aceitou: ' + (r.msg || ('erro ' + r.status)) });
        if (out === 'vinculo_ativo' || out === 'ja_ativo') {
          try { localStorage.removeItem('c99.conviteCode'); } catch (_) {}
          return C.addRole('aluno').then(function () { return C.syncRoles(); }).then(function () { return C.links(); }).then(function () { ctx.setUi({ busy: false, done: true, outMsg: OUT[out] }); });
        }
        ctx.setUi({ busy: false, outMsg: OUT[out] || ('Resultado: ' + (out || 'desconhecido')) });
      });
    };
    var expires = p && p.expiresAt ? new Date(p.expiresAt).toLocaleDateString('pt-BR') : '';
    return {
      noCode: !code, loading: !!ui.loading, offline: !!ui.offline, err: ui.err || '', hasErr: !!ui.err,
      valid: st === 'valido' && !ui.done, closed: !!(st && st !== 'valido' && MSG[st]), closedT: st && MSG[st] ? MSG[st][0] : '', closedX: st && MSG[st] ? MSG[st][1] : '',
      tName: trainer ? trainer.name : '', tMeta: [trainer && trainer.city, trainer && trainer.credential].filter(Boolean).join(' · '), svc: p && p.service ? p.service : 'Acompanhamento',
      tIni: trainer ? U.ini(trainer.name) : '', tPhoto: trainer && trainer.photo ? trainer.photo : '', hasPhoto: !!(trainer && trainer.photo), noPhoto: !(trainer && trainer.photo),
      expires: expires ? 'Vale até ' + expires : '', logged: logged, anon: !logged,
      adultOn: String(!!ui.adult), adultCls: 'check' + (ui.adult ? ' is-on' : ''), adultErr: !!ui.adultErr, toggleAdult: function () { ctx.setUi({ adult: !ui.adult, adultErr: false }); },
      busy: !!ui.busy, acceptLabel: ui.busy ? 'Aceitando…' : 'Aceitar convite', accept: accept,
      outMsg: ui.outMsg || '', hasOut: !!ui.outMsg && !ui.done, done: !!ui.done, doneMsg: ui.outMsg || '',
      signup: function () { remember(); GO('@onboarding', { flow: 'aluno' }); },
      login: function () { remember(); GO('@onboarding', { flow: 'entrar' }); },
      openApp: function () { GO('@aluno'); }, home: function () { GO('@home'); }
    };
  }
});
