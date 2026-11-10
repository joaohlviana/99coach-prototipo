/* ALU02 · Detalhe da sessão prescrita: objetivo, exercícios com instrução, nota do treinador; iniciar sem duplicar */
REG.screen({
  page: 'aluno', key: 'sessao', id: 'ALU02', title: 'Sessão', mtitle: 'Sessão', nav: 'treinos', back: 'H10', testIds: ['t1', 't2', 't0'],
  normal: 'Sessão liberada',
  scens: [['semacesso', 'Sem acesso'], ['semacessoatual', 'Sem acesso atual'], ['direito', 'Direito pendente'], ['revisao', 'Programação em revisão'],
    ['retirado', 'Exercício retirado'], ['midia', 'Mídia falhou'], ['midiaind', 'Mídia indisponível']],
  vals: function (ctx) {
    var A1 = window.A1, scn = ctx.scn, ui = ctx.ui;
    var t = A1.treino(ctx.id || 't1'), ss = A1.sess(t), exec = A1.exec();
    var ana = A1.me(), open = ui.open || {};
    var mediaBad = scn === 'midia' || scn === 'midiaind';
    var blocked = scn === 'semacesso' || scn === 'semacessoatual' || scn === 'direito' || scn === 'revisao';
    var items = ss.s.items.map(function (it, i) {
      var ex = A1.ex(it.ex), isOpen = !!open[i] || mediaBad;
      var removed = scn === 'retirado' && it.ex === 'terra';
      var rest = A1.secs(it.rest);
      return {
        n: String(i + 1), name: ex.name, equip: ex.equip ? ex.equip : '',
        presc: it.sets + ' × ' + it.reps + (it.load ? ' · ' + it.load : ' · peso do corpo') + ' · desc. ' + A1.fmtRest(rest),
        cues: (ex.cues || []).map(function (c) { return { t: c }; }), isOpen: isOpen, closed: !isOpen,
        hasVideo: ex.media === 'video' && !mediaBad, noVideo: ex.media !== 'video' || mediaBad,
        mediaTxt: mediaBad ? 'Vídeo indisponível: veja as instruções' : (ex.media === 'imagem' ? 'Imagem demonstrativa · descrição abaixo' : 'Sem vídeo: siga as instruções'),
        toggle: function () { var o = Object.assign({}, open); o[i] = !o[i]; ctx.setUi({ open: o }); },
        toggleTxt: isOpen ? 'Ocultar instrução' : 'Ver instrução', exp: String(isOpen),
        removed: removed, cls: 'a1-ex' + (removed ? ' is-off' : '')
      };
    });
    var sameRunning = !!(exec && exec.treino === t.id);
    var otherRunning = !!(exec && exec.treino !== t.id);
    var done = t.status === 'concluído';
    var start = function () {
      if (sameRunning) { GO('ALU03'); return; }
      var log = ss.s.items.map(function (it) { var a = []; for (var k = 0; k < it.sets; k++) a.push({ r: '', l: '', d: false, sync: false, at: '' }); return a; });
      DB.a1_exec = { treino: t.id, status: 'andamento', startedAt: U.now(), startedTs: Date.now(), ex: 0, syncedAt: U.now(), edit: -1, rest: null, log: log };
      A1.saveLocal();
      GO('ALU03');
    };
    var runT = otherRunning ? A1.treino(exec.treino) : null;
    var al = A1.alert(ctx, {
      semacesso: { k: 'risk', t: 'Sem acesso a esta sessão', x: 'Seu acompanhamento está pausado desde 20/10 a seu pedido. Os treinos voltam quando a pausa terminar; o histórico continua seu.', b: 'Saiba por quê', f: function () { GO('ALU11'); } },
      semacessoatual: { k: 'risk', t: 'Sem acesso atual', x: 'A cobrança de 05/10 não foi confirmada. Enquanto isso, o treino fica bloqueado; nada do seu histórico foi apagado.', b: 'Saiba por quê', f: function () { GO('H11'); } },
      direito: { k: 'warn', t: 'Direito pendente', x: 'Estamos confirmando o pagamento da renovação. Assim que confirmar, a sessão libera.', b: 'Consultar de novo' },
      revisao: { k: 'info', t: 'Programação em revisão', x: 'Rafael está ajustando esta sessão desde o seu check-in de 22/10. Aguarde a nova versão antes de iniciar.', b: 'Consultar de novo' },
      retirado: { k: 'warn', t: 'Exercício retirado', x: 'Rafael retirou o Levantamento terra desta sessão em 25/10. Não trocamos por outro sozinhos: fale com ele se quiser um substituto.', b: 'Falar com Rafael', f: function () { GO('ALU05'); }, b2: 'Consultar de novo', f2: A1.retry(ctx) },
      midia: { k: 'warn', t: 'Mídia falhou', x: 'Os vídeos não carregaram. As instruções em texto estão abertas em cada exercício.', b: 'Tentar de novo' },
      midiaind: { k: 'warn', t: 'Mídia indisponível', x: 'Vídeo indisponível: veja as instruções. O treino pode ser feito normalmente.', b: 'Tentar de novo' }
    });
    var hideItems = scn === 'semacessoatual';
    return {
      al: al, title: ss.s.name, sub: ss.r.name + ' · v' + ss.r.version + ' · ' + t.day + ' · ~' + t.duration,
      goal: 'Objetivo do acompanhamento: ' + (ana.goal || 'definido com Rafael'),
      items: items, showItems: !hideItems,
      note: (DB.a1_notas || {})[t.session] || '', hasNote: !!(DB.a1_notas || {})[t.session] && !hideItems,
      isDone: done, doneTxt: 'Concluído em ' + t.day + (t.rpe ? ' · esforço ' + t.rpe + ' de 10' : '') + (t.duration ? ' · ' + t.duration : ''),
      isOther: otherRunning && !done, otherTxt: runT ? runT.name + ' está em andamento. Continue ou encerre antes de iniciar outra sessão.' : '',
      goOther: function () { GO('ALU03'); },
      canStart: !done && !otherRunning && !blocked, startLbl: sameRunning ? 'Continuar treino' : 'Iniciar treino', start: start,
      cantStart: !done && !otherRunning && blocked, blockTxt: scn === 'revisao' || scn === 'direito' ? 'Início liberado quando a consulta confirmar.' : 'Início bloqueado: veja o motivo acima.',
      later: t.status === 'próximo' && !blocked && !otherRunning, laterTxt: 'Programado para ' + t.day + '. Você pode antecipar se fizer sentido para a sua semana.',
      goMsg: function () { GO('ALU05'); }, goEvo: function () { GO('H10E'); }
    };
  }
});
