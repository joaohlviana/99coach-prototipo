/* PUB10 · Avaliações e ciclo de contribuição: ler (visitante), avaliar/editar (só quem treinou), responder e contestar (treinador), denunciar */
REG.screen({
  page: 'publico', key: 'avaliacoes', id: 'PUB10', title: 'Avaliações', nav: 'explorar', wide: true,
  back: '@perfil', backParams: function (ctx) { return { id: ctx.id || 'rafael' }; },
  testIds: ['rafael', 'gabriel', 'carolina', 'thiago'],
  normal: 'Lista de avaliações',
  scens: [['sem', 'Sem avaliações'], ['analise', 'Envio em análise'], ['naoeleg', 'Não elegível'], ['pendente', 'Envio pendente'], ['erro', 'Erro'], ['edicao', 'Edição indisponível'], ['contestacao', 'Contestação em análise']],
  vals: function (ctx) {
    var P = window.P1, ui = ctx.ui, scn = ctx.scn, tid = ctx.id || 'rafael', t = P.tr(tid), first = t.name.split(' ')[0];
    var isRafael = tid === 'rafael';
    // quem está vendo: visitante · aluna (Ana, contratou acompanhamento com o Rafael) · treinador (Rafael, dono do perfil)
    var as = ui.as || ((scn === 'analise' || scn === 'naoeleg' || scn === 'edicao') ? 'aluna' : 'visitante');
    if (as === 'treinador' && !isRafael) as = 'visitante';
    var eligible = as === 'aluna' && isRafael && scn !== 'naoeleg';
    var errored = scn === 'erro', none = scn === 'sem' || t.n === 0;
    var draft = DB.p1_rascunho;
    var all = DB.p1_avaliacoes.filter(function (r) { return r.trainer === tid; });
    var mineRev = isRafael ? DB.find('p1_avaliacoes', 'av1') : null; // Ana C. é a aluna Ana
    var mineStatus = mineRev ? (scn === 'analise' ? 'em análise' : mineRev.status) : '';
    var list = (errored || none) ? [] : all.filter(function (r) { return r.status === 'publicada' || (as === 'aluna' && r === mineRev); });
    var editLocked = scn === 'edicao';
    var reviews = list.map(function (r) {
      var isMine = as === 'aluna' && r === mineRev, st = isMine ? mineStatus : r.status;
      var contest = r.contest || (scn === 'contestacao' && r.id === (isRafael ? 'av4' : 'av7'));
      return {
        author: r.author, meta: r.svc + ' · ' + r.when, stars: P.stars(r.stars), starsLabel: r.stars + ' de 5 estrelas', text: r.text,
        hasReply: !!r.reply, reply: r.reply, isMine: isMine, inReview: st === 'em análise', contest: contest,
        canReport: as === 'visitante' || (as === 'aluna' && !isMine), isTrainer: as === 'treinador',
        canEdit: isMine && !editLocked, replyLabel: r.reply ? 'Editar resposta' : 'Responder',
        replying: ui.replyFor === r.id, replyText: ui.replyFor === r.id ? (ui.replyText || '') : '',
        report: function () { ctx.go('ACC16', { id: r.id, kind: 'avaliacao' }); },
        edit: function () { Object.assign(draft, { trainer: tid, stars: r.stars, text: r.text, anon: false }); ctx.setUi({ form: true, editing: r.id, err: '' }); },
        openReply: function () { ctx.setUi({ replyFor: r.id, replyText: r.reply || '' }); },
        setReply: function (e) { ctx.setUi({ replyText: U.val(e) }); },
        sendReply: function () { var txt = String(ui.replyText || '').trim(); if (!txt) { ctx.toast('Escreva a resposta antes de publicar'); return; } r.reply = txt; ctx.setUi({ replyFor: '', replyText: '' }); ctx.toast('Resposta do treinador publicada'); },
        cancelReply: function () { ctx.setUi({ replyFor: '', replyText: '' }); },
        contestIt: function () {
          ctx.ask({ title: 'Contestar avaliação', text: 'A moderação analisa em até 5 dias úteis. A nota continua visível e você não pode alterá-la; se a avaliação violar as regras, ela é retirada.', ok: 'Enviar contestação',
            onOk: function () { r.contest = true; ctx.toast('Contestação enviada para análise'); } });
        }
      };
    });
    var dist = (none || errored) ? [] : t.dist.map(function (c, i) { return { k: String(5 - i), c: String(c), w: 'width: ' + (t.n ? Math.round(100 * c / t.n) : 0) + '%' }; });
    var views = [['visitante', 'Visitante'], ['aluna', 'Aluna (Ana)']].concat(isRafael ? [['treinador', 'Treinador (Rafael)']] : []).map(function (x) {
      var on = as === x[0]; return { label: x[1], cls: 'seg__it' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ as: x[0], form: false, replyFor: '' }); } };
    });
    var formOn = !!ui.form && eligible && !editLocked;
    var starBtns = [1, 2, 3, 4, 5].map(function (n) {
      var on = n <= (draft.stars || 0);
      return { n: String(n), label: n + (n === 1 ? ' estrela' : ' estrelas'), cls: 'p1-star' + (on ? ' is-on' : ''), on: String(n === draft.stars), pick: function () { draft.stars = n; draft.trainer = tid; ctx.setUi({ err: '' }); } };
    });
    var errStars = ui.err === 'stars', errText = ui.err === 'text';
    return {
      tName: t.name, first: first, sub: 'Só de alunos que contrataram pelo 99Coach',
      views: views, asVisitor: as === 'visitante', asAluna: as === 'aluna', asTrainer: as === 'treinador',
      errored: errored, none: none && !errored, hasSummary: !none && !errored,
      avg: t.avg, nLine: t.n + ' avaliações de alunos verificados · atualizado em 26/10', dist: dist,
      reviews: reviews, shownLine: 'As ' + reviews.length + ' mais recentes de ' + t.n + '. Média e distribuição usam só avaliações publicadas.',
      hasReviews: reviews.length > 0,
      // ações do ciclo
      avaliar: function () {
        if (as === 'visitante') {
          ctx.ask({ title: 'Só quem treinou avalia', text: 'Para avaliar, entre com a conta usada na contratação. Só alunos com acompanhamento ou sessão concluída pelo 99Coach avaliam; você pode publicar sem mostrar o nome.', ok: 'Entrar como Ana (demonstração)',
            onOk: function () { ctx.setUi({ as: 'aluna', form: isRafael }); } });
          return;
        }
        if (mineRev && isRafael) { Object.assign(draft, { trainer: tid, stars: draft.trainer === tid && draft.stars ? draft.stars : mineRev.stars, text: draft.trainer === tid && draft.text ? draft.text : mineRev.text }); }
        ctx.setUi({ form: true, editing: mineRev ? mineRev.id : '', err: '' });
      },
      showAvaliar: !(as === 'treinador') && !formOn,
      avaliarLabel: as === 'aluna' && eligible ? 'Editar minha avaliação' : 'Avaliar',
      notEligible: as === 'aluna' && !eligible,
      neText: isRafael ? 'Sua conta não tem acompanhamento ou sessão concluída com ' + first + ' pelo 99Coach. Quem contrata e treina pode avaliar depois da primeira sessão.'
        : 'Só quem contratou acompanhamento ou sessão com ' + first + ' pelo 99Coach avalia o treinador. Compras de programa são avaliadas na página do programa.',
      neOk: function () { ctx.setUi({ as: 'visitante' }); if (scn === 'naoeleg') ctx.scenario(''); },
      inReview: as === 'aluna' && isRafael && mineStatus === 'em análise' && scn !== 'naoeleg',
      pendente: scn === 'pendente', edicao: editLocked && as === 'aluna',
      consultar: function () { if (mineRev) mineRev.status = 'em análise'; ctx.setUi({ as: 'aluna' }); ctx.scenario(''); ctx.toast('Consultado: sua avaliação chegou e está em análise'); },
      retry: function () { ctx.scenario(''); ctx.toast('Avaliações carregadas'); },
      retryEdit: function () { ctx.scenario(''); if (mineRev) Object.assign(draft, { trainer: tid, stars: mineRev.stars, text: mineRev.text }); ctx.setUi({ as: 'aluna', form: true, editing: 'av1' }); },
      // formulário (só quem é elegível)
      formOn: formOn, formTitle: ui.editing ? 'Editar minha avaliação' : 'Conte como foi sua experiência',
      svcLine: 'Acompanhamento online · desde 03/2026 · contratado pelo 99Coach',
      starBtns: starBtns, errStars: errStars, errText: errText,
      text: draft.trainer === tid ? draft.text : '', textCount: String((draft.trainer === tid ? draft.text : '').length) + '/600',
      textCls: 'input input--area' + (errText ? ' is-err' : ''), textInvalid: String(errText),
      setText: function (e) { draft.text = String(U.val(e)).slice(0, 600); draft.trainer = tid; ctx.setUi({ err: '' }); },
      anonOpts: [['nome', 'Mostrar como “Ana C.”'], ['anon', 'Publicar sem nome']].map(function (x) {
        var on = (x[0] === 'anon') === !!draft.anon; return { label: x[1], cls: 'opt' + (on ? ' is-on' : ''), on: String(on), pick: function () { draft.anon = x[0] === 'anon'; ctx.refresh(); } };
      }),
      anonHelp: 'Sem nome, a avaliação continua marcada como de aluno verificado. O treinador não edita a nota.',
      draftNote: 'Rascunho guardado neste aparelho: se a sessão expirar, nada se perde.',
      enviar: function () {
        if (!draft.stars) { ctx.setUi({ err: 'stars' }); return; }
        if (String(draft.text || '').trim().length < 10) { ctx.setUi({ err: 'text' }); return; }
        var r = mineRev || null;
        if (r) { r.stars = draft.stars; r.text = String(draft.text).trim(); r.status = 'em análise'; r.author = draft.anon ? 'Aluno verificado' : 'Ana C.'; }
        Object.assign(draft, { trainer: '', stars: 0, text: '', anon: false });
        ctx.setUi({ form: false, editing: '' }); ctx.toast('Avaliação enviada para análise');
      },
      cancelar: function () { ctx.setUi({ form: false, editing: '', err: '' }); },
      voltarPerfil: function () { ctx.go('@perfil', { id: tid }); }
    };
  }
});
