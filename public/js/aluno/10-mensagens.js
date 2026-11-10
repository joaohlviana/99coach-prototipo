/* ALU05 (área da aluna) · Conversa com o treinador. DB.conversas 'ana' do ponto de vista dela: from 'ana' = eu, from 'me' = Rafael.
   Enviar mensagem soma 1 em "não lidas" do lado do treinador. Sem nenhuma sugestão automática. */
REG.screen({
  page: 'aluno', key: 'mensagens', id: 'ALU05', title: 'Mensagens', mtitle: 'Rafael Lima', nav: 'mensagens',
  normal: 'Conversa ativa',
  scens: [['vazio', 'Primeira conversa'], ['offline', 'Offline'], ['naoenviada', 'Não enviada'], ['enviando', 'Enviando'], ['falhou', 'Falhou'], ['lida', 'Lida'], ['anexo', 'Anexo revogado'], ['naocarregou', 'Não carregou']],
  vals: function (ctx) {
    var A1 = window.A1, scn = ctx.scn, ui = ctx.ui;
    var conv = DB.find('conversas', 'ana');
    if (!conv) { conv = { id: 'ana', with: 'ana', unread: 0, msgs: [] }; DB.conversas.push(conv); }
    var draft = ui.draft === undefined ? '' : ui.draft;
    var offline = scn === 'offline' || scn === 'naoenviada';
    var msgs = scn === 'vazio' ? [] : conv.msgs.slice();
    if (scn === 'anexo') msgs.push({ from: 'me', text: 'Te mandei o vídeo da sua execução de sábado.', at: '11:02', file: 'Vídeo da execução.mp4' });
    var lastMine = -1; msgs.forEach(function (m, i) { if (m.from === 'ana') lastMine = i; });
    var send = function (text) {
      var tx = String(text || '').trim();
      if (!tx) { ctx.setUi({ err: 'Escreva uma mensagem antes de enviar.' }); return; }
      var st = offline ? 'fila' : (scn === 'falhou' ? 'falhou' : 'enviada');
      conv.msgs.push({ id: DB.uid('m'), from: 'ana', text: tx, at: U.now(), st: st });
      if (st === 'enviada') conv.unread = (conv.unread || 0) + 1;
      ctx.setUi({ draft: '', err: '' });
      if (st === 'fila') ctx.toast('Sem internet: a mensagem fica na fila e vai quando você conectar.');
    };
    var list = msgs.map(function (m, i) {
      var mine = m.from === 'ana', st = m.st || '';
      if (mine && i === lastMine) {
        if (scn === 'enviando') st = 'enviando';
        else if (scn === 'falhou' && !st) st = 'falhou';
        else if (scn === 'naoenviada' && !st) st = 'fila';
        else if (scn === 'lida') st = 'lida';
      }
      var stTxt = mine ? ({ fila: 'Não enviada · vai ao conectar', enviando: 'Enviando…', falhou: 'Falhou', lida: 'Lida', enviada: 'Enviada' }[st] || (i < lastMine || conv.unread === 0 ? 'Lida' : 'Enviada')) : '';
      var retry = function () {
        var real = conv.msgs.filter(function (x) { return x === m; })[0];
        if (real) { real.st = 'enviada'; conv.unread = (conv.unread || 0) + 1; }
        ctx.set({ scn: '', toast: 'Mensagem enviada. Nada foi duplicado.' });
      };
      return {
        text: m.text, at: m.at, mine: mine, theirs: !mine, cls: 'a1-msg' + (mine ? ' is-mine' : '') + (st === 'falhou' || st === 'fila' ? ' is-warn' : ''),
        meta: (mine ? 'Você' : 'Rafael') + ' · ' + m.at + (stTxt ? ' · ' + stTxt : ''),
        hasFile: !!m.file, file: m.file || '', fileOff: scn === 'anexo' && !!m.file,
        canRetry: mine && (st === 'falhou' || st === 'fila'), retryLbl: st === 'fila' ? 'Enviar agora' : 'Tentar de novo', retry: retry
      };
    });
    var al = A1.alert(ctx, {
      offline: { k: 'warn', t: 'Sem internet', x: 'Você pode escrever. A mensagem fica na fila e é enviada quando conectar.', b: 'Tentar de novo', f: function () { conv.msgs.forEach(function (m) { if (m.st === 'fila') { m.st = 'enviada'; conv.unread = (conv.unread || 0) + 1; } }); ctx.set({ scn: '', toast: 'Conectado. Mensagens da fila enviadas.' }); } },
      naoenviada: { k: 'warn', t: 'Mensagem não enviada', x: 'Sua última mensagem ainda está neste aparelho. Toque em “Enviar agora” quando tiver conexão.' },
      falhou: { k: 'risk', t: 'Falhou', x: 'A última mensagem não chegou ao Rafael. Tentar de novo não duplica.' },
      anexo: { k: 'info', t: 'Anexo revogado', x: 'Rafael retirou o acesso ao vídeo. A mensagem continua; peça de novo se precisar.' },
      naocarregou: { k: 'risk', t: 'A conversa não carregou', x: 'Suas mensagens estão guardadas. Tente de novo em instantes.', b: 'Tentar de novo' }
    });
    var hide = scn === 'naocarregou';
    return {
      al: al, coach: 'Rafael Lima', coachSub: 'Acompanhamento online · ativo desde 03/2026',
      coachImg: A1.coachImg(), hasImg: !!A1.coachImg(), noImg: !A1.coachImg(),
      list: list, hasList: list.length > 0 && !hide, isEmpty: list.length === 0 && !hide, showComposer: !hide,
      draft: draft, setDraft: function (ev) { ctx.setUi({ draft: String(U.val(ev)).slice(0, 1000), err: '' }); },
      onKey: function (ev) { if (ev && ev.key === 'Enter' && !ev.shiftKey) { if (ev.preventDefault) ev.preventDefault(); send(ev.target && ev.target.value !== undefined ? ev.target.value : draft); } },
      send: function () { send(draft); }, sending: scn === 'enviando', notSending: scn !== 'enviando',
      hasErr: !!ui.err, err: ui.err || '', cnt: String(draft).length + '/1000',
      goCoach: function () { GO('ALU11'); },
      note: 'Mensagens são vistas só por você e Rafael. Em caso de dor forte ou emergência, procure atendimento médico.'
    };
  }
});
