/* ALU10 · Agenda da aluna: compromissos com Rafael (fuso, pessoa, local), remarcar e cancelar mostrando o efeito antes,
   chamada incluída na mensalidade (origem e ciclo). Treinos programados aparecem separados: agenda não é execução. */
REG.screen({
  page: 'aluno', key: 'agenda', id: 'ALU10', title: 'Agenda', mtitle: 'Agenda', nav: 'hoje', back: 'H10',
  normal: 'Compromisso confirmado',
  scens: [['ocupado', 'Horário ocupado'], ['indisp', 'Horário ficou indisponível'], ['tarde', 'Cancelar tarde'], ['pedido', 'Pedido pendente'], ['remarcado', 'Remarcado'],
    ['reservado', 'Crédito reservado'], ['reversao', 'Reversão pendente'], ['desconhecida', 'Confirmação desconhecida'], ['falhou', 'Consulta falhou']],
  vals: function (ctx) {
    var A1 = window.A1, scn = ctx.scn, ui = ctx.ui;
    var cap = function (s) { return s.replace(/^./, function (c) { return c.toUpperCase(); }); };
    var up = DB.a1_agenda.filter(function (g) { return ['confirmado', 'remarcado', 'pedido'].indexOf(g.status) >= 0; });
    var past = DB.a1_agenda.filter(function (g) { return ['realizado', 'cancelado'].indexOf(g.status) >= 0; });
    var g = up.filter(function (x) { return x.id === ui.sel; })[0] || up[0] || null;
    var late = scn === 'tarde';
    var SLOTS = [['sex 30/10', '17:00'], ['sex 30/10', '19:00'], ['seg 02/11', '18:00'], ['qua 04/11', '17:00'], ['qua 04/11', '19:00']];
    var slots = SLOTS.map(function (s) {
      var holiday = s[0] === 'seg 02/11', busy = (scn === 'ocupado' || scn === 'indisp') && s[0] === 'sex 30/10' && s[1] === '17:00';
      var key = s[0] + ' ' + s[1], on = ui.slot === key && !holiday && !busy;
      return { l: cap(s[0]) + ' · ' + s[1], sub: holiday ? 'feriado · sem atendimento' : (busy ? 'ocupado agora' : 'livre'), off: holiday || busy, ok: !(holiday || busy),
        cls: 'a1-slot' + (on ? ' is-on' : '') + (holiday || busy ? ' is-off' : ''), on: String(on), pick: function () { ctx.setUi({ slot: on ? '' : key, err: '' }); } };
    });
    var STATUS = { confirmado: ['Confirmado', 'badge badge--ok'], remarcado: ['Remarcado', 'badge badge--ok'], pedido: ['Aguardando Rafael', 'badge badge--warn'], realizado: ['Realizado', 'badge badge--plain'], cancelado: ['Cancelado', 'badge badge--plain'] };
    var effect = late ? 'Faltam menos de 24 h: cancelar agora consome a chamada mensal deste ciclo (05/10 a 04/11). Não há reembolso: ela está incluída na mensalidade.' : 'Ainda dentro do prazo (mais de 24 h antes): a chamada mensal não é consumida e continua disponível neste ciclo.';
    var confirmMove = function () {
      if (!g) return;
      if (!ui.slot) { ctx.setUi({ err: 'Escolha um horário livre.' }); return; }
      var parts = ui.slot.split(' '), day = parts[0] + ' ' + parts[1], time = parts[2];
      ctx.ask({ title: 'Remarcar chamada?', text: effect, lines: ['De: ' + cap(g.day) + ' · ' + g.time, 'Para: ' + cap(day) + ' · ' + time + ' (Brasília, UTC−3)', 'Com Rafael Lima · ' + g.kind], ok: 'Confirmar remarcação',
        onOk: function () { g.day = day; g.time = time; g.status = 'remarcado'; ctx.set({ ui: { sel: g.id }, toast: 'Alteração confirmada. Rafael foi avisado; o crédito foi mantido.' }); } });
    };
    var cancel = function () {
      if (!g) return;
      ctx.ask({ title: 'Cancelar a chamada?', text: effect, lines: [cap(g.day) + ' · ' + g.time + ' · ' + g.what, 'Cancelar não é reembolso: a chamada faz parte da mensalidade.'], ok: 'Cancelar chamada', danger: true, cancel: 'Manter',
        onOk: function () { g.status = 'cancelado'; ctx.set({ ui: {}, toast: 'Chamada cancelada. ' + (late ? 'A chamada deste ciclo foi consumida.' : 'Você pode marcar outra até 04/11.') }); } });
    };
    var al = A1.alert(ctx, {
      ocupado: { k: 'warn', t: 'Horário ocupado', x: 'Sex 30/10 · 17:00 acabou de ser ocupado. Compare com os próximos livres abaixo.', b: 'Comparar', f: function () { ctx.setUi({ mode: 'remarcar' }); } },
      indisp: { k: 'risk', t: 'Horário ficou indisponível', x: 'O horário que você escolheu saiu da agenda do Rafael. Sua chamada original continua marcada.', b: 'Tentar de novo' },
      tarde: { k: 'warn', t: 'Cancelamento tardio', x: 'A chamada é em menos de 24 h. Veja o efeito no crédito antes de cancelar.', b: 'Consultar de novo' },
      pedido: { k: 'info', t: 'Pedido pendente', x: 'Você pediu para remarcar para qua 04/11 · 19:00. Rafael ainda não respondeu; o horário original continua valendo.', b: 'Consultar de novo' },
      remarcado: { k: 'ok', t: 'Remarcado', x: 'Crédito mantido: a chamada mensal continua disponível neste ciclo.' },
      reservado: { k: 'info', t: 'Crédito reservado', x: 'A chamada mensal fica reservada para este compromisso até ele acontecer ou ser cancelado no prazo.', b: 'Saiba por quê', f: function () { GO('FC07'); } },
      reversao: { k: 'warn', t: 'Reversão pendente', x: 'Estamos devolvendo a chamada do cancelamento de 23/10 ao seu ciclo. Isso leva até 1 dia útil.', b: 'Consultar de novo' },
      desconhecida: { k: 'warn', t: 'Confirmação desconhecida', x: 'Não sabemos se a remarcação chegou ao Rafael. O horário de referência continua sex 30/10 · 18:00 até confirmar.', b: 'Consultar de novo' },
      falhou: { k: 'risk', t: 'A agenda não carregou', x: 'Seus compromissos continuam marcados. Tente de novo em instantes.', b: 'Corrigir' }
    });
    var hide = scn === 'falhou';
    var st = g ? (STATUS[scn === 'pedido' ? 'pedido' : (scn === 'remarcado' ? 'remarcado' : g.status)] || STATUS.confirmado) : STATUS.confirmado;
    var moving = (ui.mode === 'remarcar' || scn === 'ocupado' || scn === 'indisp') && !!g && !hide;
    var trs = DB.meusTreinos.filter(function (t) { return t.status !== 'concluído'; }).map(function (t) { return { t: cap(t.day) + ' · ' + t.name, s: 'no seu tempo · ' + t.duration, go: function () { GO('ALU02', { id: t.id }); } }; });
    return {
      al: al, tz: 'Fuso: Brasília (UTC−3)', hide: hide, show: !hide,
      hasG: !!g && !hide, noG: !g && !hide,
      g: g ? { when: cap(g.day) + ' · ' + g.time, what: g.what + ' · ' + g.kind, who: 'Com ' + g.with + ' · ' + g.place, st: st[0], stCls: st[1], origin: 'Origem: ' + g.origin + ' · ' + g.credit } : { when: '', what: '', who: '', st: '', stCls: '', origin: '' },
      others: up.filter(function (x) { return !g || x.id !== g.id; }).map(function (x) { return { t: cap(x.day) + ' · ' + x.time + ' · ' + x.what, go: function () { ctx.setUi({ sel: x.id }); } }; }),
      past: past.map(function (x) { var s = STATUS[x.status]; return { t: cap(x.day) + ' · ' + x.time + ' · ' + x.what, st: s[0], cls: s[1] }; }), hasPast: past.length > 0,
      moving: moving, notMoving: !moving && !!g && !hide, startMove: function () { ctx.setUi({ mode: 'remarcar', slot: '', err: '' }); }, stopMove: function () { ctx.setUi({ mode: '', slot: '', err: '' }); },
      slots: slots, effect: effect, effCls: 'alert ' + (late ? 'alert--warn' : 'alert--info') + ' a1-alert', confirmMove: confirmMove, cancel: cancel,
      hasErr: !!ui.err, err: ui.err || '',
      credit: [['Origem', 'Acompanhamento online · R$ 200/mês'], ['Incluído', '1 chamada de revisão por mês'], ['Este ciclo', '05/10 a 04/11 · 1 agendada'], ['Renova', '05/11']].map(function (r) { return { k: r[0], v: r[1] }; }),
      trs: trs, goMsg: function () { GO('ALU05'); }, goBuy: function () { GO('FC07', { id: 'ct1' }); }
    };
  }
});
