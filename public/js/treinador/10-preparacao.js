/* REL08 · Revisão da preparação: o que foi respondido, o que falta, quem resolve, fontes e datas.
   Registrar a revisão libera "Preparar treino" (TRE14). IA é opcional e só para o treinador. */
REG.screen({
  page: 'treinador', key: 'preparacao', id: 'REL08', title: 'Revisão da preparação', mtitle: 'Revisão', nav: 'alunos', back: 'H05',
  backParams: function (ctx) { return { id: ctx.id || 'lucas' }; },
  testIds: ['larissa', 'lucas'],
  normal: 'Respondida, aguarda revisão',
  scens: [['incompleto', 'Incompleto'], ['revisado', 'Revisado'], ['ia', 'IA opcional'], ['alteradas', 'Respostas alteradas'], ['indisponivel', 'Consulta indisponível']],
  vals: function (ctx) {
    var T = window.T1, ui = ctx.ui, scn = ctx.scn;
    var a = T.aluno(ctx.id || 'lucas') || T.aluno('lucas');
    var fst = a.first || a.name.split(' ')[0];
    var form = DB.find('formularios', 'f1');
    var real = T.prepResposta(a.id);
    var q = real ? JSON.parse(JSON.stringify(real)) : null;
    if (q && scn === 'incompleto') q.answers = q.answers.filter(function (x) { return x[0] !== 'Lesões'; });
    if (q && scn === 'revisado') { q.status = 'revisada'; q.reviewedAt = '26/10 09:40'; q.reviewedBy = 'Rafael Lima'; }
    if (q && scn === 'alteradas') { q.status = 'revisada'; q.reviewedAt = '25/10 18:00'; q.reviewedBy = 'Rafael Lima'; q.changed = 'Dias disponíveis'; q.answers = q.answers.map(function (x) { return x[0] === 'Dias disponíveis' ? [x[0], 'Ter e qui à noite'] : x; }); }
    var unavailable = scn === 'indisponivel';
    var REQ = [['Objetivo', 'Objetivo'], ['Lesões', 'Lesão ou dor atual'], ['Dias disponíveis', 'Disponibilidade']];
    var ans = {}; (q ? q.answers : []).forEach(function (x) { ans[x[0]] = x[1]; });
    var rows = REQ.map(function (r) {
      var has = ans[r[0]] !== undefined, changed = q && q.changed === r[0];
      return { k: r[1], v: has ? ans[r[0]] : 'não respondido', cls: 'kv__r' + (has ? '' : ' t1-miss') + (changed ? ' t1-chg' : ''), changed: !!changed };
    }).concat((q ? q.answers : []).filter(function (x) { return !REQ.some(function (r) { return r[0] === x[0]; }); }).map(function (x) { return { k: x[0], v: x[1], cls: 'kv__r', changed: false }; }));
    var missing = REQ.filter(function (r) { return ans[r[0]] === undefined; }).map(function (r) { return r[1]; });
    var answered = !!q;
    var reviewed = !!q && q.status === 'revisada' && !q.changed;
    var needsRe = !!q && !!q.changed;

    var statusTxt = !answered ? 'Enviada ' + (a.flag ? a.flag.when : '') + ' · aguarda ' + fst + ' responder' : (reviewed ? 'Revisada em ' + q.reviewedAt + ' por ' + q.reviewedBy : 'Respondida em ' + q.at + ' · aguarda sua revisão');
    var badge = !answered ? ['Aguarda ' + fst, 'badge badge--plain'] : (reviewed ? ['Revisada', 'badge badge--ok'] : (needsRe ? ['Respostas alteradas', 'badge badge--warn'] : ['Respondida', 'badge badge--info']));

    var hist = [];
    hist.push({ t: 'Preparação enviada', s: (a.since || '—') + ' · você' });
    if (q) hist.push({ t: 'Respondida por ' + fst, s: q.at + ' · ' + (form ? form.name + ' v' + q.version : 'formulário') });
    if (q && q.reviewedAt) hist.push({ t: 'Revisão registrada', s: q.reviewedAt + ' · ' + q.reviewedBy });
    if (q && q.changed) hist.push({ t: fst + ' alterou “' + q.changed + '”', s: '26/10 09:10 · depois da revisão' });

    var r = { ack: !!ui.ack, clear: !!ui.clear, obs: ui.obs || '' };
    var register = function () {
      if (!r.ack) { ctx.setUi({ ackErr: true }); return; }
      if (!real) return;
      real.status = 'revisada'; real.review = r.obs; real.reviewedAt = U.todayShort + ' ' + U.now(); real.reviewedBy = DB.trainer.name; real.clearance = r.clear;
      if (a.flag && (a.flag.kind === 'resposta' || a.flag.kind === 'preparacao')) a.flag = null;
      a.prepDone = true;
      if (r.clear) a.flag = { kind: 'preparacao', text: 'Aguarda liberação de profissional de saúde', when: 'hoje', to: 'TRE03' };
      ctx.setUi({ rev: false, ack: false, obs: '', ackErr: false });
      ctx.toast('Revisão registrada às ' + U.now() + '. ' + (r.clear ? 'Preparar treino fica liberado depois da liberação.' : '“Preparar treino” está liberado.'));
    };

    var alerts = [];
    if (unavailable) alerts.push(T.alert('risk', 'Consulta indisponível', 'Não conseguimos carregar as respostas agora. Nada foi perdido.', 'Tentar de novo', function () { ctx.scenario(''); ctx.toast('Respostas carregadas às ' + U.now() + '.'); }));
    if (scn === 'ia') alerts.push(T.alert('info', 'Assistência de IA opcional', 'Só você vê. Ela pode resumir as respostas, mas não substitui a sua revisão nem bloqueia o fluxo.', 'Saiba por quê', function () { ctx.toast('A leitura de IA nunca aparece para o aluno e não vira diagnóstico. A revisão é sempre sua.'); }));
    if (needsRe && !unavailable) alerts.push(T.alert('warn', 'Respostas alteradas depois da revisão', fst + ' mudou “' + q.changed + '” em 26/10 09:10. Revise de novo antes de publicar.', 'Revisar', function () { ctx.setUi({ rev: true }); }));
    if (q && missing.length && !unavailable) alerts.push(T.alert('warn', 'Falta ' + U.plural(missing.length, 'resposta', 'respostas'), missing.join(', ') + '. Resposta ausente não é avaliação positiva: peça complemento.', 'Pedir complemento', function () { ctx.go('REL07', { id: a.id }); }));
    var canPrep = reviewed && !(real && real.clearance && a.flag);

    return {
      name: a.name, fst: fst, statusTxt: statusTxt, badge: badge[0], badgeCls: badge[1],
      src: form ? 'Fonte: ' + form.name + ' · v' + (q ? q.version : form.version) + ' · respondida por ' + fst : 'Fonte: formulário de preparação',
      alerts: alerts, hasAlerts: alerts.length > 0,
      showAns: answered && !unavailable, notAnswered: !answered && !unavailable,
      rows: rows, missingTxt: missing.length ? 'O que ainda falta: ' + missing.join(', ') + ' · responsável: ' + fst : 'Nada faltando nas perguntas obrigatórias',
      remind: function () { ctx.go('TRE25', { id: a.id }); },
      complement: function () { ctx.go('REL07', { id: a.id }); },
      canReview: answered && !reviewed && !unavailable, isReviewed: reviewed && !unavailable,
      reviewTxt: reviewed ? 'Revisada em ' + q.reviewedAt + ' por ' + q.reviewedBy + (q.review ? ' · observação privada registrada' : '') : '',
      showRev: !!ui.rev && answered && !unavailable, openRev: function () { ctx.setUi({ rev: true }); }, closeRev: function () { ctx.setUi({ rev: false }); },
      ackCls: 'check' + (r.ack ? ' is-on' : ''), ackOn: String(r.ack), toggleAck: function () { ctx.setUi({ ack: !r.ack, ackErr: false }); },
      ackLabel: missing.length ? 'Li as respostas e sei que falta: ' + missing.join(', ') : 'Li todas as respostas',
      ackErr: !!ui.ackErr,
      clearCls: 'switch' + (r.clear ? ' is-on' : ''), clearOn: String(r.clear), toggleClear: function () { ctx.setUi({ clear: !r.clear }); },
      obs: r.obs, setObs: function (e) { ctx.setUi({ obs: U.val(e) }); },
      register: register,
      canPrep: canPrep, noPrep: !canPrep, prep: function () { ctx.go('TRE14', { id: a.id }); },
      prepHint: canPrep ? 'Liberado pela revisão de ' + (q ? q.reviewedAt : '') : (answered ? 'Disponível depois da revisão' : 'Disponível depois que ' + fst + ' responder e você revisar'),
      ai: function () { ctx.go('IA01', { id: a.id, ctx: 'preparacao' }); },
      showHist: !!ui.hist, toggleHist: function () { ctx.setUi({ hist: !ui.hist }); }, hist: hist, histLabel: ui.hist ? 'Ocultar histórico' : 'Ver histórico',
      backAluno: function () { ctx.go('H05', { id: a.id }); }
    };
  }
});
