/* ALU11 · Relação com o treinador e suporte: contato, estado e escopo da relação, o que ele vê, pausar e encerrar
   com efeito por dimensão antes de confirmar, e caso de suporte com protocolo. Sem nenhum benefício de IA ao aluno. */
REG.screen({
  page: 'aluno', key: 'treinador', id: 'ALU11', title: 'Meu treinador', mtitle: 'Meu treinador', nav: 'hoje', back: 'H10',
  normal: 'Relação ativa',
  scens: [['pausado', 'Pausado'], ['caso', 'Caso aberto'], ['saiupro', 'Treinador saiu do Pro'], ['prep', 'Preparação pendente'], ['parcial', 'Consulta parcial'], ['contaerrada', 'Conta errada']],
  vals: function (ctx) {
    var A1 = window.A1, scn = ctx.scn, ui = ctx.ui;
    var rel = DB.a1_relacao, ct = DB.find('contratacoes', 'ct1') || { price: 200, unit: 'mês', next: '05/11', method: '', since: '05/03', status: 'ativa' };
    var tr = DB.trainer || { name: 'Rafael Lima', cref: '', sports: [], city: '' };
    var ana = DB.find('alunos', 'ana');
    var paused = rel.status === 'pausado' || scn === 'pausado', ending = rel.status === 'encerrando';
    var caso = rel.caso || (scn === 'caso' ? 'CASO-2410-0087' : '');
    var stTxt = paused ? 'Pausado até ' + (rel.pauseUntil || '23/11') : (ending ? 'Encerra em ' + rel.endAt : 'Ativo');
    var weeks = ui.weeks || '2';
    var untilOf = { '2': '09/11', '4': '23/11' };
    var pause = function () {
      var until = untilOf[weeks];
      ctx.ask({ title: 'Pausar acompanhamento?', text: 'O que muda durante a pausa, até ' + until + ':', lines: ['Cobrança: a renovação de 05/11 fica suspensa até voltar.', 'Treinos: Rafael não publica novas semanas; os atuais continuam visíveis.', 'Mensagens: continuam abertas.', 'Histórico e evolução: continuam seus.'], ok: 'Pausar até ' + until,
        onOk: function () { rel.status = 'pausado'; rel.pauseUntil = until; if (ana) { ana.status = 'pausado'; ana.next = 'Pausado até ' + until; } ctx.set({ ui: {}, toast: 'Acompanhamento pausado até ' + until + '. Rafael foi avisado.' }); } });
    };
    var resume = function () { rel.status = 'ativo'; rel.pauseUntil = ''; if (ana) { ana.status = 'ativo'; ana.next = 'Treino B · quarta'; } ctx.set({ scn: '', ui: {}, toast: 'Acompanhamento retomado.' }); };
    var end = function () {
      ctx.ask({ title: 'Encerrar acompanhamento?', text: 'O que muda ao encerrar:', danger: true, ok: 'Encerrar em 04/11', cancel: 'Manter',
        lines: ['Cobrança: não renova em 05/11. Sua contratação continua vigente até 04/11.', 'Treinos: acesso aos treinos publicados até 04/11.', 'Histórico e evolução: continuam seus, inclusive depois.', 'Rafael deixa de ver novas respostas e medidas depois de 04/11.', 'Programas comprados ou liberados continuam conforme a licença de cada um.'],
        onOk: function () { rel.status = 'encerrando'; rel.endAt = '04/11'; ct.endAt = '04/11'; if (ana) ana.next = 'Encerra em 04/11'; ctx.set({ ui: {}, toast: 'Encerramento agendado para 04/11. Você pode desfazer até lá.' }); } });
    };
    var undoEnd = function () { rel.status = 'ativo'; rel.endAt = ''; ct.endAt = ''; if (ana) ana.next = 'Treino B · quarta'; ctx.set({ ui: {}, toast: 'Encerramento desfeito. Tudo continua como antes.' }); };
    var MOT = ['Cobrança', 'Acesso aos treinos', 'Relação com o treinador', 'Outro assunto'];
    var openCase = function () {
      if (!ui.mot) { ctx.setUi({ err: 'Escolha o assunto.' }); return; }
      if (String(ui.desc || '').trim().length < 10) { ctx.setUi({ err: 'Conte em poucas palavras o que aconteceu (mínimo 10 letras).' }); return; }
      rel.caso = 'CASO-2610-0142';
      ctx.set({ ui: {}, toast: 'Caso aberto · protocolo ' + rel.caso + '.' });
    };
    var hide = scn === 'contaerrada', partial = scn === 'parcial';
    var al = A1.alert(ctx, {
      pausado: { k: 'info', t: 'Pausado', x: 'Seu acompanhamento está pausado até 23/11. Cobrança suspensa; mensagens abertas.', b: 'Retomar agora', f: resume },
      caso: { k: 'info', t: 'Caso aberto', x: 'Protocolo ' + caso + ' · aberto em 24/10. A equipe 99Coach responde por aqui e por e-mail.' },
      saiupro: { k: 'info', t: 'Rafael mudou de plano', x: 'Seu acesso continua: a mudança no plano dele não altera sua contratação nem seu histórico.', b: 'Saiba por quê', f: function () { GO('FC07', { id: 'ct1' }); } },
      prep: { k: 'warn', t: 'Preparação pendente', x: 'Rafael pediu 5 respostas para ajustar a semana 4. Responsável: você.', b: 'Completar preparação', f: function () { GO('REL07'); }, b2: 'Consultar de novo', f2: A1.retry(ctx) },
      parcial: { k: 'warn', t: 'Consulta parcial', x: 'Não carregamos o que Rafael vê. O restante está atualizado.', b: 'Consultar de novo' },
      contaerrada: { k: 'risk', t: 'Conta errada', x: 'Este vínculo pertence a outra conta. Por privacidade, nada dele aparece aqui.', b: 'Revisar', f: function () { GO('@onboarding', { flow: 'convite', scn: 'contaaluno' }); } }
    });
    var shares = [['Anamnese', 'sim', 'respondida em 03/2026'], ['Check-ins', 'sim', 'último em ' + (ana ? ana.lastCheckin : '22/10')], ['Medidas e avaliações', 'sim', (DB.avaliacoes || []).filter(function (a) { return a.student === 'ana'; }).length + ' avaliações'], ['Fotos', 'sim', '1 foto postural'], ['Exames', 'sim', '1 PDF (ombro)']];
    return {
      al: al, hide: hide, show: !hide,
      name: tr.name, sub: (tr.sports || []).join(' e ') + ' · ' + (tr.city || '') + ' · ' + (tr.cref || ''),
      img: A1.coachImg(), hasImg: !!A1.coachImg(), noImg: !A1.coachImg(),
      svc: 'Acompanhamento online · desde ' + (ana ? ana.since : '03/2026'),
      stTxt: stTxt, stCls: 'badge ' + (paused ? 'badge--warn' : (ending ? 'badge--risk' : 'badge--ok')),
      kv: [['Estado', stTxt], ['Desde', ct.since], ['Valor', U.money(ct.price) + '/' + ct.unit], [ending ? 'Vigente até' : 'Renova', ending ? rel.endAt : ct.next], ['Pagamento', ct.method || '—']].map(function (r) { return { k: r[0], v: r[1] }; }),
      shares: shares.map(function (s) { return { k: s[0], v: s[1] === 'sim' ? 'Vê · ' + s[2] : 'Não vê' }; }), showShares: !partial, sharesFail: partial,
      goShares: function () { GO('@onboarding', { flow: 'convite', scn: 'compart' }); },
      goMsg: function () { GO('ALU05'); }, goBuy: function () { GO('FC07', { id: 'ct1' }); },
      isActive: !paused && !ending, isPaused: paused, isEnding: ending,
      mode: ui.mode || '', isPausing: ui.mode === 'pausar', isHelp: ui.mode === 'ajuda',
      startPause: function () { ctx.setUi({ mode: 'pausar', weeks: '2' }); }, startHelp: function () { ctx.setUi({ mode: 'ajuda', err: '' }); }, closeMode: function () { ctx.setUi({ mode: '', err: '' }); },
      weeksOpts: [['2', '2 semanas · até 09/11'], ['4', '4 semanas · até 23/11']].map(function (w) { var on = weeks === w[0]; return { l: w[1], cls: 'chip' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ weeks: w[0] }); } }; }),
      pause: pause, resume: resume, end: end, undoEnd: undoEnd,
      mots: MOT.map(function (m) { var on = ui.mot === m; return { l: m, cls: 'chip' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ mot: m, err: '' }); } }; }),
      desc: ui.desc || '', setDesc: function (ev) { ctx.setUi({ desc: String(U.val(ev)).slice(0, 600), err: '' }); }, openCase: openCase,
      hasCase: !!caso, caso: caso, noCase: !caso,
      hasErr: !!ui.err, err: ui.err || ''
    };
  }
});
