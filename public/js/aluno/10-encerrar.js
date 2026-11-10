/* ALU04 · Encerrar sessão e dar feedback: feito x incompleto (sem esconder), esforço (RPE), dor com local e comentário.
   Confirmar marca o treino como concluído em DB.meusTreinos, avisa o treinador e volta a Hoje com aviso. */
REG.screen({
  page: 'aluno', key: 'encerrar', id: 'ALU04', title: 'Encerrar treino', mtitle: 'Feedback', nav: 'treinos', back: 'ALU03', form: true,
  normal: 'Revisar e encerrar',
  scens: [['vazio', 'Feedback opcional vazio'], ['pendente', 'Pendente de envio'], ['pendsync', 'Pendente de sincronização'], ['enviado', 'Enviado'],
    ['falhou', 'Falhou'], ['falha', 'Falha'], ['desconhecido', 'Resultado desconhecido'], ['expirada', 'Autorização da prescrição expirada com relato anterior preservado']],
  vals: function (ctx) {
    var A1 = window.A1, scn = ctx.scn, ui = ctx.ui;
    var e = DB.a1_exec;
    if (!e || e.status !== 'andamento') return { has: false, none: true, goHome: function () { GO('H10'); } };
    var t = A1.treino(e.treino), ss = A1.sess(t), items = ss.s.items;
    var setsTot = 0, setsDone = 0, exDone = 0, incompleto = [];
    items.forEach(function (it, i) {
      var l = e.log[i] || [], d = 0;
      for (var k = 0; k < it.sets; k++) if (l[k] && l[k].d) d++;
      setsTot += it.sets; setsDone += d;
      if (d === it.sets) exDone++; else incompleto.push(A1.ex(it.ex).name + ' (' + d + ' de ' + it.sets + ' séries)');
    });
    var mins = Math.max(1, Math.round((Date.now() - (e.startedTs || Date.now())) / 60000));
    var offline = scn === 'pendente' || scn === 'pendsync';
    var unsynced = A1.unsynced(e) + (offline ? 1 : 0);
    var rpe = ui.rpe || '';
    var dor = ui.dor || '', local = ui.local || '', obs = ui.obs === undefined ? '' : ui.obs;
    var sent = scn === 'enviado';
    var LOCAIS = ['Ombro direito', 'Ombro esquerdo', 'Joelho', 'Lombar', 'Outro local'];
    var close = function () {
      var tr = DB.find('meusTreinos', t.id);
      if (tr) { tr.status = 'concluído'; tr.rpe = rpe ? Number(rpe) : null; tr.duration = mins + ' min'; tr.doneAt = U.now(); tr.pain = dor === 'sim' ? (local === 'Outro local' ? (ui.outro || 'outro local') : local) : ''; tr.comment = obs; tr.done = exDone + ' de ' + items.length; }
      e.status = 'encerrado'; e.rest = null; e.closedAt = U.now(); A1.saveLocal();
      // evolução: melhor série de agachamento entra no histórico com a data do treino
      items.forEach(function (it, i) {
        if (it.ex !== 'agach' || !DB.evolucao || !DB.evolucao.agach) return;
        var best = 0; (e.log[i] || []).forEach(function (s) { if (s.d) best = Math.max(best, parseFloat(String(s.l).replace(',', '.')) || 0); });
        if (best) DB.evolucao.agach.push(['26/10', best]);
      });
      var ana = DB.find('alunos', 'ana');
      if (ana && dor === 'sim') ana.flag = { kind: 'dor', text: 'Dor relatada no ' + t.name.split(' · ')[0] + ': ' + (tr ? tr.pain : local).toLowerCase(), when: 'hoje ' + U.now(), to: 'TRE03' };
      DB.notificacoes.unshift({ id: DB.uid('nt'), kind: 'tarefa', text: 'Ana encerrou o ' + t.name + ' · ' + exDone + ' de ' + items.length + ' exercícios' + (rpe ? ' · esforço ' + rpe : ''), at: U.now(), read: false, to: 'TRE03', id2: 'ana' });
      A1.flash('Treino encerrado', (incompleto.length ? 'Itens incompletos ficaram registrados como incompletos. ' : '') + (offline ? 'Ainda não sincronizado: o envio acontece quando você conectar.' : 'Rafael recebeu seu feedback.'), offline ? 'warn' : 'ok');
      GO('H10');
    };
    var submit = function () {
      if (dor === 'sim' && !local) { ctx.setUi({ err: 'Diga onde doeu para o Rafael ajustar o treino.' }); return; }
      if (dor === 'sim' && local === 'Outro local' && !String(ui.outro || '').trim()) { ctx.setUi({ err: 'Escreva qual local doeu.' }); return; }
      if (scn === 'falhou' || scn === 'falha') { ctx.setUi({ err: '' }); ctx.toast('Não conseguimos enviar. Seus dados continuam aqui: tente de novo.'); return; }
      var lines = ['Feito: ' + exDone + ' de ' + items.length + ' exercícios · ' + setsDone + ' de ' + setsTot + ' séries'];
      if (incompleto.length) lines.push('Incompleto: ' + incompleto.join(', '));
      lines.push('Esforço: ' + (rpe ? rpe + ' de 10' : 'não informado') + ' · Dor: ' + (dor === 'sim' ? local : (dor === 'nao' ? 'não' : 'não informado')));
      if (offline) lines.push('Ainda não sincronizado: fica neste aparelho até conectar.');
      ctx.ask({ title: 'Encerrar sessão?', text: incompleto.length ? 'Você pode encerrar com itens incompletos. Encerrar não marca o que faltou como feito.' : 'Seu registro e o feedback vão para o Rafael.', lines: lines, ok: 'Encerrar sessão', onOk: close });
    };
    var al = A1.alert(ctx, {
      vazio: { k: 'info', t: 'Feedback é opcional', x: 'Você pode encerrar sem responder. Esforço e dor ajudam o Rafael a ajustar a próxima sessão.' },
      pendente: { k: 'warn', t: 'Pendente de envio', x: 'Sem internet: o encerramento fica no aparelho até sincronizar. Nada é perdido.' },
      pendsync: { k: 'warn', t: 'Pendente de sincronização', x: U.plural(unsynced, 'registro ainda não chegou', 'registros ainda não chegaram') + ' ao Rafael. Você pode encerrar; enviamos ao conectar.', b: 'Consultar de novo' },
      enviado: { k: 'ok', t: 'Enviado', x: 'Rafael foi avisado. Reabrir este resultado mostra a mesma sessão, sem duplicar.' },
      falhou: { k: 'risk', t: 'Falhou', x: 'Não conseguimos enviar. Tentar de novo não duplica o registro.', b: 'Tentar de novo' },
      falha: { k: 'risk', t: 'Falha ao encerrar', x: 'Seus dados continuam aqui. Corrija a conexão e tente de novo.', b: 'Corrigir', f: A1.retry(ctx, 'Conexão de volta. Pode encerrar.') },
      desconhecido: { k: 'warn', t: 'Resultado desconhecido', x: 'Não sabemos se o encerramento chegou. Consulte antes de enviar de novo para não duplicar.', b: 'Consultar de novo', f: A1.retry(ctx, 'Consultamos: ainda não foi encerrado. Pode encerrar.') },
      expirada: { k: 'warn', t: 'Autorização da prescrição expirada', x: 'Seu relato anterior está preservado e pode ser encerrado. Novas instruções ficam bloqueadas até o Rafael renovar.', b: 'Corrigir', f: function () { GO('ALU11'); } }
    });
    return {
      has: true, none: false, al: al, sent: sent, notSent: !sent,
      sub: t.name + ' · hoje · ' + mins + ' min',
      kv: [['Feito', exDone + ' de ' + items.length + ' exercícios'], ['Séries', setsDone + ' de ' + setsTot], ['Incompleto', incompleto.length ? incompleto.join(', ') : 'nada'], ['Duração', mins + ' min (desde ' + e.startedAt + ')'], ['Sincronização', unsynced ? U.plural(unsynced, 'registro', 'registros') + ' neste aparelho' : 'tudo sincronizado']].map(function (r) { return { k: r[0], v: r[1] }; }),
      hasInc: incompleto.length > 0,
      rpes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (n) { var on = String(rpe) === String(n); return { n: String(n), cls: 'opt opt--sq' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ rpe: on ? '' : String(n) }); } }; }),
      rpeTxt: rpe ? rpe + ' de 10 · ' + (rpe <= 3 ? 'leve' : (rpe <= 6 ? 'moderado' : (rpe <= 8 ? 'difícil' : 'máximo'))) : '1 = muito leve · 10 = máximo',
      dores: [['nao', 'Não'], ['sim', 'Sim']].map(function (d) { var on = dor === d[0]; return { l: d[1], cls: 'seg__it' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ dor: d[0], err: '' }); } }; }),
      isDor: dor === 'sim',
      locais: LOCAIS.map(function (l) { var on = local === l; return { l: l, cls: 'chip' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ local: l, err: '' }); } }; }),
      isOutro: dor === 'sim' && local === 'Outro local', outro: ui.outro || '', setOutro: function (ev) { ctx.setUi({ outro: U.val(ev), err: '' }); },
      obs: obs, setObs: function (ev) { ctx.setUi({ obs: String(U.val(ev)).slice(0, 280) }); }, obsCnt: String(obs).length + '/280',
      hasErr: !!ui.err, err: ui.err || '',
      submit: submit, back: function () { GO('ALU03'); }, goHome: function () { GO('H10'); },
      privacy: 'Dor e comentário ficam visíveis só para você e Rafael. Não é diagnóstico.'
    };
  }
});
