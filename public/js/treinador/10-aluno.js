/* H05 · Aluno 360 (base TRE03): pendência com responsável, programação atual, adesão, próximos treinos,
   avaliações, arquivos, notas e conversa. Uma ação principal; atalhos para as telas de detalhe. */
REG.screen({
  page: 'treinador', key: 'aluno', id: 'H05', also: ['TRE03'], title: 'Aluno 360', mtitle: 'Aluno', nav: 'alunos', back: 'H04', wide: true,
  testIds: ['ana', 'bruno', 'larissa', 'lucas', 'julia'],
  normal: 'Uso recorrente',
  scens: [['prep', 'Primeiro uso · preparação pendente'], ['revpend', 'Revisão do treinador pendente'], ['semarq', 'Ausência confirmada · sem arquivos'], ['pausaaluno', 'Acesso pausado pelo aluno'], ['semperm', 'Sem permissão · saúde'], ['revogada', 'Permissão revogada'], ['parte', 'Parte não carregou'], ['parcial', 'Consulta parcial'], ['atualizado', 'Atualizado']],
  vals: function (ctx) {
    var T = window.T1, ui = ctx.ui, scn = ctx.scn;
    var id = ctx.id || (scn === 'prep' ? 'larissa' : (scn === 'revpend' ? 'lucas' : 'ana'));
    var a = T.aluno(id) || T.aluno('ana');
    var P = T.person(a), first = P.first, st = T.status(a), ro = T.rotina(a);
    var go = function (to, p) { return function () { ctx.go(to, Object.assign({ id: a.id }, p || {})); }; };
    var healthHidden = scn === 'semperm' || scn === 'revogada';
    var prepQ = T.prepResposta(a.id);
    var prepReviewed = !!(prepQ && prepQ.status === 'revisada');

    // ---------- ação principal e responsáveis ----------
    var main, mine = null, wait = null;
    if (a.status === 'pedido') main = { label: 'Responder pedido', go: go('REL06') };
    else if (a.status === 'convite') main = { label: 'Ver convite', go: go('REL02') };
    else if (a.status === 'encerrado') main = { label: 'Convidar de novo', go: go('REL01', { nome: a.name }) };
    else if (a.status === 'pausado') main = { label: 'Retomar acompanhamento', go: go('REL09', { acao: 'retomar' }) };
    else if (a.flag) {
      var ac = T.act(a);
      if (ac.who === 'Você') {
        var lbl = a.flag.kind === 'resposta' ? 'Revisar preparação' : (a.flag.kind === 'dor' ? 'Revisar resposta' : (a.flag.kind === 'programacao' ? 'Programar semana ' + (a.week + 1) : ac.label));
        main = { label: lbl, go: function () { ctx.go(ac.to, ac.params); } };
        mine = { tag: 'Sua próxima ação' + (a.flag.kind === 'programacao' ? ' · até qui' : ''), title: a.flag.text, sub: 'Motivo registrado ' + a.flag.when + '.', btn: lbl, go: main.go };
      } else {
        main = { label: 'Lembrar com mensagem', go: go('TRE25') };
      }
    } else if (!ro && a.status === 'ativo') main = { label: 'Preparar treino', go: go('TRE14') };
    else main = { label: 'Ver programação', go: go('TRE17') };
    if (!mine && a.status === 'ativo' && !ro && a.prepDone && (!prepQ || prepReviewed)) mine = { tag: 'Sua próxima ação', title: 'Preparar o primeiro treino', sub: prepReviewed ? 'Preparação revisada em ' + prepQ.reviewedAt + '.' : 'Preparação concluída.', btn: 'Preparar treino', go: go('TRE14') };
    if (!a.prepDone) wait = { tag: 'Aguarda ' + first, title: 'Responder a preparação', sub: 'Convite aceito ' + (a.flag ? a.flag.when : '') + '. Você pode montar um rascunho; publicar pede a revisão da preparação.', btn: 'Lembrar com mensagem', go: go('TRE25') };
    else if (a.status === 'ativo' && ro) wait = { tag: 'Aguarda ' + first + ' · ' + a.next, title: 'Registrar o próximo treino', sub: 'Nada a fazer da sua parte agora. O registro chega aqui quando ' + first + ' concluir.', btn: 'Ver calendário', go: go('TRE17') };
    var hasMine = !!mine;
    var noneMine = { tag: 'Sua próxima ação', title: 'Nenhuma até ' + first + ' concluir', sub: 'Quando houver algo para você, aparece aqui com motivo e data.' };

    // ---------- treino ativo e adesão ----------
    var kv = [
      { k: 'Programação', v: ro ? ro.name + ' · semana ' + a.week + ' · v' + ro.version + ' · salva ' + ro.savedAt : 'Sem programação ativa' },
      { k: 'Última sessão', v: a.lastCheckin || 'Nenhuma registrada' },
      { k: 'Próxima', v: a.next || '—' },
      { k: 'Vínculo', v: st.label + (a.since ? ' · desde ' + a.since : '') }
    ];
    var adh = a.adherence || 0;
    var adhTxt = adh ? adh + '% dos treinos previstos registrados · últimas 4 semanas · fonte 99Coach, 26/10' : 'Sem dados de adesão ainda: nenhum treino registrado';
    var nextT = a.id === 'ana' ? DB.meusTreinos.filter(function (t) { return t.status !== 'concluído'; }).map(function (t) { return { name: t.name, sub: t.day + ' · ' + t.duration, st: t.status }; })
      : (ro ? ro.sessions.map(function (s, i) { return { name: s.name, sub: i === 0 ? a.next : 'depois de ' + ro.sessions[i - 1].name, st: i === 0 ? 'próximo' : 'na sequência' }; }) : []);
    var sessions = ro ? ro.sessions.map(function (s) {
      return { name: s.name, items: s.items.map(function (it) { var ex = DB.find('exercicios', it.ex); return (ex ? ex.name : it.ex) + ' · ' + it.sets + '×' + it.reps + (it.load ? ' · ' + it.load : ''); }) };
    }) : [];

    // ---------- avaliações, arquivos, notas, conversa ----------
    var avs = (DB.avaliacoes || []).filter(function (x) { return x.student === a.id; }).slice().reverse().map(function (x) {
      return { date: x.date, prot: x.protocol, vals: 'Peso ' + String(x.weight).replace('.', ',') + ' kg · gordura ' + String(x.fat).replace('.', ',') + '% · cintura ' + x.waist + ' cm', notes: x.notes || '' };
    });
    var files = scn === 'semarq' ? [] : (DB.arquivos || []).filter(function (x) { return x.student === a.id; }).map(function (x) { return { name: x.name, sub: x.size + ' · ' + x.at + ' · acesso: ' + x.access, ic: 'ic ic--xs i-' + (x.kind === 'foto' ? 'camera' : 'file') }; });
    var notes = (DB.notas || []).filter(function (x) { return x.student === a.id; }).map(function (x) { return { text: x.text, sub: 'Privada · só você vê · ' + x.at }; });
    var conv = DB.conversas.find(function (c) { return c.with === a.id; }) || null;
    var msgs = conv ? conv.msgs.slice(-3).map(function (m) { return { who: m.from === 'me' ? 'Você' : first, text: m.text, at: m.at, cls: 't1-msg' + (m.from === 'me' ? ' is-me' : '') }; }) : [];

    // ---------- linha do tempo ----------
    var tl = [];
    var resp = T.resposta(a.id, false);
    if (resp) tl.push({ t: (resp.form === 'f1' ? 'Preparação respondida' : 'Check-in respondido') + (resp.status === 'revisada' ? ' · revisada' : ''), s: resp.at + ' · ' + first });
    if (a.lastCheckin) tl.push({ t: 'Última sessão registrada', s: a.lastCheckin + ' · ' + first });
    if (ro) tl.push({ t: 'Programação salva · v' + ro.version, s: ro.savedAt + ' · você' });
    (DB.t1_recibos || []).filter(function (r) { return r.aluno === a.id; }).forEach(function (r) { tl.unshift({ t: r.title, s: r.at + ' · você' }); });
    if (a.since) tl.push({ t: 'Vínculo iniciado', s: a.since });

    var TABS = [['resumo', 'Resumo'], ['treinos', 'Treinos'], ['avaliacoes', 'Avaliações'], ['arquivos', 'Arquivos'], ['notas', 'Notas'], ['conversa', 'Conversa']];
    var tab = ui.tab || (scn === 'semarq' ? 'arquivos' : 'resumo');
    var tabs = TABS.map(function (t) { var on = tab === t[0]; return { label: t[1], cls: 'utab' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ tab: t[0] }); } }; });

    var alerts = [];
    if (scn === 'pausaaluno') alerts.push(T.alert('info', 'Acesso pausado pelo aluno', 'Treinos e histórico continuam visíveis para você; novas publicações aguardam ' + first + ' retomar.', '', null));
    if (scn === 'revogada') alerts.push(T.alert('risk', 'Permissão revogada', first + ' revogou o acesso aos dados de saúde em 25/10. Avaliações e arquivos ficam ocultos; treinos e conversa continuam.', 'Saiba por quê', function () { ctx.toast('Cada aluno decide o que compartilha. O vínculo continua; só os dados de saúde deixam de aparecer para você.'); }));
    if (scn === 'parcial') alerts.push(T.alert('warn', 'Consulta parcial', 'Mostrando dados confirmados às 08:02. A conversa pode ter mensagens novas.', 'Consultar de novo', function () { ctx.scenario(''); ctx.toast('Atualizado às ' + U.now() + '.'); }));
    if (scn === 'revpend' && prepQ && !prepReviewed) alerts.push(T.alert('warn', 'Revisão do treinador pendente', 'Preparação respondida em ' + prepQ.at + '. Revise antes de publicar o primeiro treino.', 'Revisar preparação', go('REL08')));

    var attention = a.flag ? (healthHidden && a.flag.kind === 'dor' ? 'Relato de saúde não compartilhado com você' : a.flag.text + ' · ' + a.flag.when) : '';

    var draft = ui.note || '', reply = ui.reply || '';
    return {
      p: P, name: a.name, sub: a.svc + (a.since ? ' · desde ' + a.since : '') + (a.city ? ' · ' + a.city : ''), badge: st.label, badgeCls: st.cls,
      updated: scn === 'atualizado', updatedTxt: 'Atualizado às ' + U.now(),
      goMsg: go('TRE25'), mainLabel: main.label, mainGo: main.go,
      alerts: alerts, hasAlerts: alerts.length > 0,
      tabs: tabs,
      isResumo: tab === 'resumo', isTreinos: tab === 'treinos', isAv: tab === 'avaliacoes', isArq: tab === 'arquivos', isNotas: tab === 'notas', isConv: tab === 'conversa',
      hasAttention: !!attention, attention: attention,
      hasMine: hasMine, mine: mine || noneMine, noMine: !hasMine,
      hasWait: !!wait, wait: wait || { tag: '', title: '', sub: '', btn: '', go: function () {} },
      kv: kv, adh: adh ? adh + '%' : '—', adhStyle: 'width:' + adh + '%', adhTxt: adhTxt,
      nextT: nextT, hasNextT: nextT.length > 0, noNextT: !nextT.length,
      sessions: sessions, hasSessions: sessions.length > 0, noSessions: !sessions.length,
      goProg: go('TRE17'), goPrep: go('TRE14'), goPrepRev: go('REL08'), goAv: go('TRE07'), goArq: go('TRE08'), goNotas: go('TRE09'), goVinc: go('REL09'),
      healthHidden: healthHidden, healthOk: !healthHidden && scn !== 'parte', avFail: scn === 'parte' && !healthHidden,
      retryAv: function () { ctx.scenario(''); ctx.toast('Avaliações carregadas às ' + U.now() + '.'); },
      keepGoing: function () { ctx.setUi({ tab: 'resumo' }); },
      avs: avs, hasAvs: avs.length > 0, noAvs: !avs.length, avLast: avs.length ? 'Última: ' + avs[0].date + ' · ' + avs[0].prot : 'Nenhuma avaliação registrada',
      files: files, hasFiles: files.length > 0, noFiles: !files.length,
      notes: notes, hasNotes: notes.length > 0, noNotes: !notes.length,
      note: draft, setNote: function (e) { ctx.setUi({ note: U.val(e) }); }, canNote: !!draft.trim(),
      saveNote: function () {
        if (!draft.trim()) { ctx.toast('Escreva a nota antes de salvar.'); return; }
        DB.notas.unshift({ id: DB.uid('n'), student: a.id, text: draft.trim(), vis: 'privada', at: U.todayShort + ' ' + U.now(), version: 1 });
        ctx.setUi({ note: '' }); ctx.toast('Nota privada salva. Só você vê.');
      },
      msgs: msgs, hasMsgs: msgs.length > 0, noMsgs: !msgs.length,
      reply: reply, setReply: function (e) { ctx.setUi({ reply: U.val(e) }); },
      send: function () {
        if (!reply.trim()) { ctx.toast('Escreva a mensagem antes de enviar.'); return; }
        var c = conv;
        if (!c) { c = { id: a.id, with: a.id, unread: 0, msgs: [] }; DB.conversas.push(c); }
        c.msgs.push({ from: 'me', text: reply.trim(), at: U.now() }); c.unread = 0;
        ctx.setUi({ reply: '' }); ctx.toast('Mensagem enviada para ' + first + ' às ' + U.now() + '.');
      },
      tl: tl, hasTl: tl.length > 0,
      vincTxt: a.status === 'pausado' ? 'Pausado · ' + a.next : (a.status === 'ativo' ? 'Ativo · pausar ou encerrar tem efeitos próprios, sem cobrança implícita' : st.label),
      vincBtn: a.status === 'pausado' ? 'Retomar ou encerrar' : 'Pausar ou encerrar',
      showPrepRev: !!prepQ, prepRevTxt: prepQ ? (prepReviewed ? 'Revisada em ' + prepQ.reviewedAt : 'Respondida em ' + prepQ.at + ' · aguarda sua revisão') : ''
    };
  }
});
