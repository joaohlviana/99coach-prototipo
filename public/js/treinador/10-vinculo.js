/* REL09 · Pausar, retomar ou encerrar o acompanhamento. Mostra o efeito real em relação, programação, conversa,
   contratação e dados; nenhuma cobrança muda por aqui. Recibo da ação; resposta perdida consulta a mesma alteração. */
REG.screen({
  page: 'treinador', key: 'vinculo', id: 'REL09', title: 'Pausar, retomar ou encerrar', mtitle: 'Acompanhamento', nav: 'alunos', back: 'H05',
  backParams: function (ctx) { return { id: ctx.id || 'ana' }; },
  testIds: ['ana', 'julia'],
  normal: 'Escolhendo',
  scens: [['pausado', 'Pausado'], ['incerto', 'Resultado incerto'], ['encerrado', 'Encerrado'], ['conflito', 'Conflito de estado'], ['semperm', 'Sem permissão'], ['desconhecido', 'Resultado desconhecido']],
  vals: function (ctx) {
    var T = window.T1, ui = ctx.ui, scn = ctx.scn;
    var a = T.aluno(ctx.id || 'ana') || T.aluno('ana');
    var fst = a.first || a.name.split(' ')[0];
    var canChange = a.status === 'ativo' || a.status === 'pausado';
    var opts = a.status === 'pausado' ? [['retomar', 'Retomar'], ['encerrar', 'Encerrar']] : [['pausar', 'Pausar'], ['encerrar', 'Encerrar']];
    var okA = function (k) { return !!k && opts.some(function (o) { return o[0] === k; }); };
    var acao = okA(ui.acao) ? ui.acao : (okA(ctx.p.acao) ? ctx.p.acao : opts[0][0]);
    var DUR = [['2s', '2 semanas', 'até 09/11'], ['1m', '1 mês', 'até 26/11'], ['sd', 'Sem data', 'até você retomar']];
    var dur = ui.dur || '2s', durO = DUR.filter(function (d) { return d[0] === dur; })[0];
    var ro = T.rotina(a);
    var ct = a.id === 'ana' ? DB.contratacoes.find(function (c) { return c.kind === 'assinatura' && c.status === 'ativa'; }) : null;
    var progs = (DB.participantes || []).filter(function (p) { return p.student === a.id && p.status === 'ativo'; }).map(function (p) { var pr = DB.find('programas', p.program); return pr ? pr.name : ''; }).filter(Boolean);
    var money = ct ? 'Assinatura ' + ct.what + ' (' + U.money(ct.price) + '/' + ct.unit + ') não muda por aqui. Cobrança e cancelamento ficam na gestão da contratação.' : 'Nenhuma cobrança muda por esta ação.';
    var EFF = {
      pausar: [['Acompanhamento', 'Pausa a partir de hoje · ' + durO[2]], ['Programação', ro ? ro.name + ' fica salva; nada novo é publicado' : 'Nada a publicar'], ['Conversa', 'Continua aberta para os dois'], ['Contratação', money], ['Dados', 'Histórico, avaliações e arquivos ficam como estão']],
      retomar: [['Acompanhamento', 'Volta hoje'], ['Programação', 'Você escolhe quando publicar a próxima semana'], ['Conversa', 'Continua aberta'], ['Contratação', money]],
      encerrar: [['Acompanhamento', 'Encerra hoje'], ['Programação', 'Para de receber treinos novos; o histórico fica salvo'], ['Programa comprado', progs.length ? progs.join(', ') + ' continua: é um acesso separado' : 'Nenhum programa comprado'], ['Conversa', 'Fica disponível só para leitura'], ['Contratação', money], ['Dados', 'Guardados conforme a política de retenção']]
    };
    var TIT = { pausar: 'Pausar acompanhamento', retomar: 'Retomar acompanhamento', encerrar: 'Encerrar acompanhamento' };
    var DONE = { pausar: 'Acompanhamento pausado', retomar: 'Acompanhamento retomado', encerrar: 'Acompanhamento encerrado' };
    var effects = EFF[acao].map(function (e) { return { k: e[0], v: e[1] }; });
    var msg = ui.msg || '';

    var apply = function () {
      if (acao === 'pausar') { a.status = 'pausado'; a.next = 'Pausado ' + durO[2]; }
      if (acao === 'retomar') { a.status = 'ativo'; a.next = 'Próxima semana a publicar'; }
      if (acao === 'encerrar') { a.status = 'encerrado'; a.flag = null; a.next = 'Encerrado em 26/10'; }
      var rc = { id: 'VC-' + Math.random().toString(36).slice(2, 7).toUpperCase(), aluno: a.id, acao: acao, title: DONE[acao], at: U.todayShort + ' ' + U.now(), effects: EFF[acao].map(function (e) { return e[0] + ': ' + e[1]; }), msg: msg };
      DB.t1_recibos.unshift(rc);
      if (msg.trim()) {
        var c = DB.conversas.find(function (x) { return x.with === a.id; });
        if (!c) { c = { id: a.id, with: a.id, unread: 0, msgs: [] }; DB.conversas.push(c); }
        c.msgs.push({ from: 'me', text: msg.trim(), at: U.now() });
      }
      ctx.setUi({ receipt: rc.id, uncertain: false, msg: '' });
    };
    var blocked = scn === 'semperm' || !canChange;
    var confirm = function () {
      if (blocked) return;
      ctx.ask({
        title: TIT[acao] + ' de ' + fst + '?', danger: acao === 'encerrar', ok: 'Confirmar alteração',
        lines: EFF[acao].map(function (e) { return e[0] + ': ' + e[1]; }),
        onOk: function () {
          if ((scn === 'incerto' || scn === 'desconhecido') && !ui.tried) { ctx.setUi({ uncertain: true, tried: true }); return; }
          apply();
        }
      });
    };

    // recibo: real (depois de confirmar) ou de exemplo nas situações "Pausado" e "Encerrado"
    var rc = ui.receipt ? DB.find('t1_recibos', ui.receipt) : null;
    if (!rc && (scn === 'pausado' || scn === 'encerrado')) {
      var k = scn === 'pausado' ? 'pausar' : 'encerrar';
      rc = { id: 'VC-8Q2LM', aluno: a.id, acao: k, title: DONE[k], at: U.todayShort + ' ' + U.now(), effects: EFF[k].map(function (e) { return e[0] + ': ' + e[1]; }), msg: '' };
    }

    var alerts = [];
    if (scn === 'conflito' && !rc) alerts.push(T.alert('warn', 'A situação mudou', fst + ' pausou o acompanhamento pelo app às 09:10, depois que você abriu esta tela. Revise antes de confirmar.', 'Revisar', function () { ctx.scenario(''); ctx.toast('Situação consultada às ' + U.now() + '.'); }));
    if (scn === 'semperm') alerts.push(T.alert('risk', 'Sem permissão', 'Só o treinador responsável pelo vínculo pode pausar ou encerrar. Nada foi alterado.', 'Saiba por quê', function () { ctx.toast('Em equipes, o vínculo pertence ao treinador responsável. Peça a ele ou à organização.'); }));
    if (!canChange && !rc) alerts.push(T.alert('info', 'Não há acompanhamento para alterar', a.name + ' está como “' + T.status(a).label.toLowerCase() + '”.', 'Voltar ao aluno', function () { ctx.go('H05', { id: a.id }); }));
    if (ui.uncertain) alerts.push(T.alert('warn', scn === 'incerto' ? 'Resultado incerto' : 'Resultado desconhecido', 'A confirmação não chegou. Consulte a situação antes de repetir, para não aplicar duas vezes.', 'Consultar de novo', function () { apply(); ctx.toast('Consultado: a alteração foi aplicada uma vez só.'); }));

    return {
      name: a.name, fst: fst, title: TIT[acao] + '?',
      isReceipt: !!rc, notReceipt: !rc,
      alerts: alerts, hasAlerts: alerts.length > 0,
      canChange: canChange && !rc,
      opts: opts.map(function (o) { var on = acao === o[0]; return { label: o[1], cls: 'seg__it' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ acao: o[0] }); } }; }),
      isPause: acao === 'pausar', durs: DUR.map(function (d) { var on = dur === d[0]; return { label: d[1] + ' · ' + d[2], cls: 'chip' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ dur: d[0] }); } }; }),
      effects: effects,
      msg: msg, setMsg: function (e) { ctx.setUi({ msg: U.val(e) }); },
      confirm: confirm, blocked: blocked, notBlocked: !blocked,
      isEnd: acao === 'encerrar', pauseInstead: function () { ctx.setUi({ acao: opts[0][0] === 'retomar' ? 'retomar' : 'pausar' }); }, altLabel: a.status === 'pausado' ? 'Retomar em vez disso' : 'Pausar em vez disso',
      keep: function () { ctx.go('H05', { id: a.id }); },
      manage: function () { ctx.go('FC08', { id: ct ? ct.id : a.id }); }, hasCt: !!ct,
      rcTitle: rc ? rc.title : '', rcId: rc ? rc.id : '', rcAt: rc ? rc.at : '', rcEffects: rc ? rc.effects : [], rcWho: 'Rafael Lima (você)',
      rcIsPause: !!rc && rc.acao === 'pausar',
      resumeNow: function () { ctx.setUi({ receipt: '', acao: 'retomar' }); },
      goAlunos: function () { ctx.go('H04'); }
    };
  }
});
