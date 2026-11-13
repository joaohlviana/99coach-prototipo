/* AVISOS · Avisos dentro do app (conta real). Calculados no servidor a partir do que já existe: mensagens, pedidos,
   treinos, formulários e horários. O aviso diz o tipo e de quem veio, nunca o texto da mensagem, da resposta ou do treino.
   A pessoa escolhe os tipos que não quer ver. Não há aviso por e-mail nem no celular ainda, e a tela diz isso. */
REG.screen({
  page: 'publico', key: 'avisos', id: 'AVISOS', title: 'Avisos', nav: 'conta',
  vals: function (ctx) {
    var C = window.CONTA, ui = ctx.ui, logged = !!(C && C.session());
    var KINDS = [['mensagem', 'Mensagens'], ['pedido', 'Pedidos de acompanhamento'], ['treino', 'Treino novo ou alterado'], ['registro', 'Registros de treino'], ['comentario', 'Comentários no registro'], ['formulario', 'Formulários'], ['horario', 'Horários']];
    var load = function () { ctx.setUi({ asked: true, loading: true }); C.rpc('my_notices', {}).then(function (r) { ctx.setUi({ loading: false, fail: !r.ok, data: r.ok ? (r.data || { items: [], muted: [] }) : ui.data }); }); };
    if (logged && !ui.asked) load();
    var d = ui.data || { items: [], muted: [] }, muted = d.muted || [];
    var first = function (n) { return String(n || '').split(' ')[0]; };
    var when = function (s) { var t = new Date(s), now = new Date(); return t.toDateString() === now.toDateString() ? 'hoje às ' + t.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : t.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' às ' + t.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); };
    var text = function (n) {
      var w = first(n.who);
      if (n.kind === 'mensagem') return [U.plural(n.n, 'mensagem não lida', 'mensagens não lidas') + ' de ' + w, 'Abrir conversa'];
      if (n.kind === 'pedido') return n.mine === 'treinador' ? [w + ' pediu acompanhamento', 'Ver pedidos'] : [w + (n.extra === 'aceito' ? ' aceitou seu pedido' : ' respondeu seu pedido: não pode atender agora'), 'Abrir'];
      if (n.kind === 'treino') return [n.extra === 'versao' ? w + ' alterou seu treino (versão ' + n.n + ')' : w + ' atribuiu um treino a você', 'Ver treino'];
      if (n.kind === 'registro') return [w + ' registrou um treino', 'Ver registro'];
      if (n.kind === 'comentario') return [w + ' comentou um registro de treino', 'Abrir'];
      if (n.kind === 'formulario') return n.mine === 'aluno' ? [w + ' enviou um formulário para você responder', 'Responder'] : [w + ' respondeu um formulário', 'Revisar resposta'];
      if (n.kind === 'horario') return n.extra === 'cancelado' ? [w + ' cancelou um horário', 'Ver agenda'] : ['Horário marcado com ' + w, 'Ver agenda'];
      return ['Novidade de ' + w, 'Abrir'];
    };
    var open = function (n) {
      return function () {
        if (n.mine === 'treinador') { if (n.kind === 'pedido') return GO('REL06'); if (n.kind === 'horario') return GO('TRE20'); if (n.kind === 'mensagem') return GO('TRE25'); return window.NAV.go('treinador', { s: 'alunoreal', id: 'lk_' + n.link }, null); }
        if (n.link && window.ACCT && window.ACCT.pickTrainer) window.ACCT.pickTrainer(n.link);
        GO(n.kind === 'mensagem' ? 'ALU05' : 'H10');
      };
    };
    var items = (d.items || []).map(function (n) { var t = text(n); return { text: t[0], when: n.kind === 'horario' && n.extra !== 'cancelado' ? when(n.at) : when(n.at), isNew: !!n['new'], cls: 'onb-secs__r' + (n['new'] ? ' is-new' : ''), act: t[1], go: open(n) }; });
    var newN = items.filter(function (x) { return x.isNew; }).length;
    var setPrefs = function (m, seen, msg) {
      if (ui.busy) return; ctx.setUi({ busy: true, err: '' });
      C.rpc('set_notice_prefs', { p_muted: m, p_seen: !!seen }).then(function (r) {
        if (!r.ok) return ctx.setUi({ busy: false, err: 'Não foi possível salvar agora: ' + (r.msg || r.status || 'sem conexão') + '.' });
        ctx.setUi({ busy: false }); if (msg) ctx.toast(msg); load();
      });
    };
    return {
      logged: logged, anon: !logged, login: function () { window.NAV.go('onboarding', { flow: 'entrar' }, null); },
      loading: !!ui.loading && !ui.data, fail: !!ui.fail, reload: load,
      loaded: !!ui.data, notLoaded: logged && !ui.data && !ui.loading,
      has: items.length > 0, empty: logged && !ui.loading && !ui.fail && !items.length, items: items,
      sub: !items.length ? '' : (newN ? U.plural(newN, 'aviso novo', 'avisos novos') : 'Nada novo desde a última vez que você viu'),
      canSeen: newN > 0, seen: function () { setPrefs(null, true, 'Avisos marcados como vistos.'); },
      prefs: KINDS.map(function (k) { var off = muted.indexOf(k[0]) >= 0; return { label: k[1], on: String(!off), state: off ? 'Silenciado' : 'Ligado', cls: 'chip' + (off ? '' : ' is-on'),
        toggle: function () { var m = off ? muted.filter(function (x) { return x !== k[0]; }) : muted.concat([k[0]]); setPrefs(m, false, off ? k[1] + ': avisos ligados.' : k[1] + ': avisos silenciados. O conteúdo continua no app.'); } }; }),
      // e-mail: desligado por padrão; a pessoa liga e pode definir horário de silêncio (horário de Brasília)
      emailOn: !!d.email_on, emailLabel: d.email_on ? 'Desligar avisos por e-mail' : 'Ligar avisos por e-mail',
      emailTxt: d.email_on ? 'Ligado. Você recebe no e-mail da conta, no máximo um a cada 30 minutos, só com o tipo do aviso e o nome de quem gerou.' : 'Desligado. Se ligar, o e-mail leva só o tipo do aviso e o nome de quem gerou; o conteúdo fica no app.',
      toggleEmail: function () { if (ui.busy) return; ctx.setUi({ busy: true, err: '' }); C.rpc('set_notice_email', { p_on: !d.email_on, p_quiet_from: d.quiet_from == null ? null : d.quiet_from, p_quiet_to: d.quiet_to == null ? null : d.quiet_to }).then(function (r) { ctx.setUi({ busy: false, err: r.ok ? '' : 'Não foi possível salvar agora: ' + (r.msg || r.status || 'sem conexão') + '.' }); if (r.ok) { ctx.toast(d.email_on ? 'Avisos por e-mail desligados.' : 'Avisos por e-mail ligados.'); load(); } }); },
      quietOpts: [['', 'Sem silêncio'], ['22-7', '22h às 7h'], ['21-8', '21h às 8h'], ['20-9', '20h às 9h']].map(function (o) { var cur = d.quiet_from == null ? '' : d.quiet_from + '-' + d.quiet_to, on = cur === o[0]; return { label: o[1], on: String(on), cls: 'chip' + (on ? ' is-on' : ''),
        pick: function () { if (ui.busy || on) return; var p = o[0] ? o[0].split('-').map(Number) : [null, null]; ctx.setUi({ busy: true, err: '' }); C.rpc('set_notice_email', { p_on: !!d.email_on, p_quiet_from: p[0], p_quiet_to: p[1] }).then(function (r) { ctx.setUi({ busy: false, err: r.ok ? '' : 'Não foi possível salvar agora: ' + (r.msg || r.status || 'sem conexão') + '.' }); if (r.ok) { ctx.toast(o[0] ? 'Sem e-mail das ' + o[1] + ' (horário de Brasília).' : 'Horário de silêncio removido.'); load(); } }); } }; }),
      err: ui.err || '', hasErr: !!ui.err,
      back: function () { var a = window.ACCT && window.ACCT.area(); if (a) window.NAV.go(a, {}, null); else window.NAV.go('home', {}, null); }
    };
  }
});
