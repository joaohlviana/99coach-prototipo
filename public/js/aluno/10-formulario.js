/* ALU08 · Responder check-in (DB.formularios f2, v2): salva sozinho a cada resposta, valida obrigatórias,
   "Salvar e continuar depois" e "Enviar respostas" → cria DB.respostas e sinaliza o treinador. */
REG.screen({
  page: 'aluno', key: 'formulario', id: 'ALU08', title: 'Check-in semanal', mtitle: 'Check-in', nav: 'hoje', back: 'H10', form: true,
  normal: 'Rascunho salvo',
  scens: [['invalido', 'Campo inválido'], ['enviando', 'Enviando'], ['enviado', 'Enviado'], ['revisao', 'Revisão pendente'], ['desconhecido', 'Resultado desconhecido'],
    ['expirado', 'Expirado'], ['linkexp', 'Link expirado'], ['outra', 'Link de outra pessoa'], ['contaerrada', 'Conta errada']],
  vals: function (ctx) {
    var A1 = window.A1, scn = ctx.scn, ui = ctx.ui;
    var f = DB.find('formularios', 'f2') || { name: 'Check-in semanal', version: 2 };
    var ck = DB.a1_checkin, ans = ck.answers;
    var Q = [
      { id: 'q1', t: 'Quantos treinos você fez nesta semana?', kind: 'opts', opts: ['0', '1', '2', '3', '4 ou mais'], req: true },
      { id: 'q2', t: 'Como foi seu sono?', kind: 'scale', help: '1 = muito ruim · 5 = ótimo', req: true },
      { id: 'q3', t: 'Alguma dor?', kind: 'opts', opts: ['Não', 'Sim'], req: true },
      { id: 'q4', t: 'Nível de energia', kind: 'scale', help: '1 = sem energia · 5 = muita energia', req: true },
      { id: 'q5', t: 'Algo mais para o Rafael?', kind: 'text', req: false }
    ];
    var has = function (k) { return ans[k] !== undefined && String(ans[k]).trim() !== ''; };
    var answered = Q.filter(function (q) { return has(q.id); }).length;
    var tried = !!ui.tried || scn === 'invalido';
    var set = function (k, v) { var o = Object.assign({}, ans); o[k] = v; ck.answers = o; ck.savedAt = U.now(); ctx.refresh(); };
    var missing = function () {
      var m = Q.filter(function (q) { return q.req && !has(q.id); }).map(function (q) { return q.id; });
      if (ans.q3 === 'Sim' && !has('q3b')) m.push('q3b');
      if (has('q3b') && !/\d/.test(ans.q3b) && ans.q3 === 'Sim') m.push('q3b');
      return m;
    };
    var miss = missing();
    var sentView = !!ck.sentAt || scn === 'enviado' || scn === 'revisao';
    var hidden = scn === 'outra' || scn === 'contaerrada' || scn === 'linkexp' || scn === 'expirado';
    var submit = function () {
      if (scn === 'desconhecido' || scn === 'enviando') return;
      if (miss.length) { ctx.setUi({ tried: true }); ctx.toast('Faltam ' + U.plural(miss.length, 'resposta obrigatória', 'respostas obrigatórias') + '.'); return; }
      var at = '26/10 ' + U.now();
      var pairs = [['Treinos na semana', ans.q1], ['Sono (1 a 5)', ans.q2], ['Sentiu dor?', ans.q3 === 'Sim' ? 'Sim, ' + ans.q3b : 'Não'], ['Energia (1 a 5)', ans.q4]];
      if (has('q5')) pairs.push(['Algo mais', ans.q5]);
      DB.respostas.unshift({ id: DB.uid('q'), student: 'ana', form: 'f2', version: f.version, at: at, status: 'pendente', answers: pairs, review: '' });
      var ana = DB.find('alunos', 'ana');
      if (ana) { ana.lastCheckin = '26/10'; ana.flag = { kind: ans.q3 === 'Sim' ? 'dor' : 'resposta', text: 'Check-in semanal respondido' + (ans.q3 === 'Sim' ? ' · dor relatada' : ''), when: 'hoje ' + U.now(), to: 'TRE06' }; }
      if (f.answered !== undefined) f.answered += 1;
      DB.notificacoes.unshift({ id: DB.uid('nt'), kind: 'tarefa', text: 'Ana respondeu o check-in semanal' + (ans.q3 === 'Sim' ? ' (relatou dor)' : ''), at: U.now(), read: false, to: 'TRE06', id2: 'ana' });
      ck.sentAt = U.now();
      A1.flash('Resposta enviada', 'Seu treinador vai revisar. Você não precisa enviar de novo.', 'ok');
      GO('H10');
    };
    var qs = Q.map(function (q, i) {
      var v = ans[q.id] || '', err = tried && miss.indexOf(q.id) >= 0;
      var opts = q.kind === 'opts' ? q.opts : (q.kind === 'scale' ? ['1', '2', '3', '4', '5'] : []);
      return {
        n: (i + 1) + '.', t: q.t, req: q.req, opt: !q.req, help: q.help || '', hasHelp: !!q.help, gid: 'a1-q' + (i + 1),
        isOpts: q.kind !== 'text', isText: q.kind === 'text',
        opts: opts.map(function (o) { var on = v === o; return { l: o, cls: (q.kind === 'scale' ? 'opt opt--sq' : 'chip') + (on ? ' is-on' : ''), on: String(on), pick: function () { set(q.id, on ? '' : o); } }; }),
        val: v, setText: function (ev) { set(q.id, String(U.val(ev)).slice(0, 500)); },
        err: err, errTxt: 'Escolha uma resposta.',
        isDor: q.id === 'q3' && v === 'Sim', dorVal: ans.q3b || '', setDor: function (ev) { set('q3b', String(U.val(ev)).slice(0, 120)); },
        dorErr: q.id === 'q3' && tried && miss.indexOf('q3b') >= 0, dorCls: 'input' + (q.id === 'q3' && tried && miss.indexOf('q3b') >= 0 ? ' is-err' : '')
      };
    });
    var al = A1.alert(ctx, {
      invalido: { k: 'risk', t: 'Campo inválido', x: 'Algumas respostas obrigatórias faltam ou estão incompletas. Corrija os campos marcados.', b: 'Corrigir', f: function () { ctx.set({ scn: '', ui: { tried: true } }); } },
      enviando: { k: 'info', t: 'Enviando', x: 'Aguarde: não feche o app. Se cair a conexão, a resposta fica salva aqui.' },
      enviado: { k: 'ok', t: 'Resposta enviada', x: 'Aguardando revisão de Rafael. Você não precisa enviar de novo.' },
      revisao: { k: 'info', t: 'Revisão pendente', x: 'Rafael ainda não revisou. Ele vê suas respostas e pode ajustar o treino da semana.', b: 'Consultar de novo' },
      desconhecido: { k: 'warn', t: 'Resultado desconhecido', x: 'Não sabemos se a resposta chegou. Consulte antes de enviar de novo para não duplicar.', b: 'Consultar de novo', f: A1.retry(ctx, 'Consultamos: a resposta ainda não chegou. Pode enviar.') },
      expirado: { k: 'warn', t: 'Check-in expirado', x: 'O prazo deste check-in era 25/10. Avise o Rafael para ele liberar de novo; seu rascunho fica guardado.', b: 'Avisar Rafael', f: function () { ctx.toast('Rafael foi avisado de que o check-in expirou.'); }, b2: 'Consultar de novo', f2: A1.retry(ctx) },
      linkexp: { k: 'warn', t: 'Link expirado', x: 'Este link venceu. Abra o check-in pelo app (Hoje) ou peça um novo ao Rafael.', b: 'Corrigir', f: A1.retry(ctx, 'Abrimos o check-in pelo app.') },
      outra: { k: 'risk', t: 'Este link é de outra pessoa', x: 'Por privacidade, não mostramos nada deste formulário. Entre com a conta que recebeu o convite.', b: 'Continuar', f: function () { GO('H10'); } },
      contaerrada: { k: 'risk', t: 'Conta errada', x: 'Você entrou como Ana Carolina Souza, mas o link foi enviado para outra conta. Nada do conteúdo é mostrado.', b: 'Revisar', f: function () { GO('@onboarding', { flow: 'convite', scn: 'contaaluno' }); } }
    });
    var pairs = [['Treinos na semana', ans.q1 || '—'], ['Sono', ans.q2 ? ans.q2 + ' de 5' : '—'], ['Dor', ans.q3 === 'Sim' ? 'Sim · ' + (ans.q3b || '') : (ans.q3 || '—')], ['Energia', ans.q4 ? ans.q4 + ' de 5' : '—'], ['Algo mais', ans.q5 || '—']];
    return {
      al: al, hidden: hidden, shown: !hidden,
      sub: 'Rafael Lima · v' + f.version + ' · ' + answered + ' de ' + Q.length + ' · salvo às ' + ck.savedAt,
      steps: Q.map(function (q) { return { cls: has(q.id) ? 'is-on' : '' }; }),
      isForm: !sentView && !hidden, isSent: sentView && !hidden,
      qs: qs, hasMiss: tried && miss.length > 0, missTxt: 'Faltam ' + U.plural(miss.length, 'resposta', 'respostas') + ' para enviar.',
      sending: scn === 'enviando', canSend: scn !== 'enviando' && scn !== 'desconhecido', sendOff: scn === 'desconhecido',
      submit: submit,
      saveLater: function () { ck.savedAt = U.now(); A1.flash('Rascunho salvo', 'Continue depois: suas ' + U.plural(answered, 'resposta fica salva', 'respostas ficam salvas') + ' neste check-in.', 'info'); GO('H10'); },
      sentTxt: ck.sentAt ? 'Enviado hoje às ' + ck.sentAt + ' · aguardando revisão de Rafael.' : 'Enviado · aguardando revisão de Rafael.',
      pairs: pairs.map(function (p) { return { k: p[0], v: p[1] }; }),
      goHome: function () { GO('H10'); }, goMsg: function () { GO('ALU05'); },
      privacy: 'Suas respostas são vistas só por você e Rafael. Saúde e dor não aparecem no seu perfil público.'
    };
  }
});
