/* T5 · TRE20 Compromissos e reservas: lista por dia + detalhe; remarcar (horário ocupado preserva a escolha anterior),
   cancelar com política do contrato, crédito de pacote com origem e unidade, entrega externa (TRE31) e abrir aluno (TRE03). */
(function () {
  // pacote de créditos (origem, unidade, consumo e reversões). Reserva não prova pagamento.
  DB.seed('t5_creditos', [
    { id: 'pk1', student: 'diego', offer: 'o3', name: 'Pacote 8 aulas', unit: 'sessão presencial', total: 8, used: 3, reserved: 0, reversals: 0, pendingRev: 0, origin: 'compra 02/10', appts: ['c3'] }
  ]);
  var WEEK = [['seg 26/10', 'Seg', '26', 'segunda, 26/10'], ['ter 27/10', 'Ter', '27', 'terça, 27/10'], ['qua 28/10', 'Qua', '28', 'quarta, 28/10'], ['qui 29/10', 'Qui', '29', 'quinta, 29/10'], ['sex 30/10', 'Sex', '30', 'sexta, 30/10'], ['sab 31/10', 'Sáb', '31', 'sábado, 31/10']];
  var LONG = {}; WEEK.forEach(function (w) { LONG[w[0]] = w[3]; });
  var KIND = { presencial: 'Presencial', online: 'Online' };
  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function min(t) { var p = String(t).split(':'); return Number(p[0]) * 60 + Number(p[1]); }
  function hhmm(m) { return ('0' + Math.floor(m / 60)).slice(-2) + ':' + ('0' + (m % 60)).slice(-2); }
  function active(c) { return c.status !== 'cancelado'; }
  function whoOf(c) { var a = c.student ? DB.find('alunos', c.student) : null; return a ? a.name : (c.group || 'Compromisso'); }
  function firstOf(c) { var a = c.student ? DB.find('alunos', c.student) : null; return a ? a.first : (c.group || ''); }
  function packOf(c) { return DB.t5_creditos.filter(function (p) { return p.appts.indexOf(c.id) >= 0; })[0] || null; }
  function whenOf(day, time) { return day === 'seg 26/10' ? 'Hoje ' + time : day.split(' ')[0].charAt(0).toUpperCase() + day.split(' ')[0].slice(1) + ' ' + time; }
  function busy(day, time, except) { return DB.agenda.filter(function (c) { return active(c) && c.id !== except && c.day === day && c.time === time; })[0] || null; }
  // horários livres a partir da disponibilidade (de hora em hora), de amanhã a quinta
  function slots(except) {
    var out = [];
    ['ter 27/10', 'qua 28/10', 'qui 29/10'].forEach(function (day) {
      var wd = day.split(' ')[0], date = day.split(' ')[1];
      if ((DB.disponibilidade.exceptions || []).some(function (x) { return x.date === date; })) return;
      (DB.disponibilidade.days[wd] || []).forEach(function (r) {
        var p = String(r).split(/[–-]/), a = min(p[0]), b = min(p[1]);
        for (var m = a; m + 60 <= b && out.length < 40; m += 60) out.push({ day: day, time: hhmm(m), key: day + ' ' + hhmm(m) });
      });
    });
    return out.map(function (s) { var b = busy(s.day, s.time, except); s.busy = b; return s; });
  }

  REG.screen({
    page: 'treinador', key: 'agenda', id: 'TRE20', title: 'Agenda', nav: 'agenda', testIds: ['c1', 'c4'],
    back: function (ctx) { return ctx.id || ctx.ui.sel || ctx.scn ? 'TRE20' : 'TMENU'; },
    normal: 'Dia com compromissos',
    scens: [['ocupado', 'Horário ocupado'], ['remarcado', 'Remarcado'], ['incerto', 'Resultado incerto'], ['reservado', 'Crédito reservado'], ['reversao', 'Reversão pendente'], ['desconhecida', 'Confirmação desconhecida']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn;
      var tz = DB.disponibilidade.tz;
      var bySel = ui.sel || ctx.id || '';
      var selC = (bySel && DB.find('agenda', bySel)) || DB.find('agenda', 'c3') || DB.agenda[0];
      var day = ui.day || (selC ? selC.day : 'seg 26/10');

      // ---------- semana e lista do dia ----------
      var week = WEEK.map(function (w) {
        var n = DB.agenda.filter(function (c) { return active(c) && c.day === w[0]; }).length, on = w[0] === day;
        return { d: w[1], n: w[2], cnt: n ? String(n) : '', hasCnt: n > 0, cls: 'v4-reset t5-wk' + (on ? ' is-on' : ''), on: String(on), lbl: w[3] + ', ' + U.plural(n, 'compromisso', 'compromissos'),
          pick: function () {
            var f = DB.agenda.filter(function (c) { return c.day === w[0]; }).sort(function (a, b) { return min(a.time) - min(b.time); })[0];
            ctx.setUi(f ? { day: w[0], sel: f.id, rs: false, done: '' } : { day: w[0] });
          } };
      });
      var items = DB.agenda.filter(function (c) { return c.day === day; }).sort(function (a, b) { return min(a.time) - min(b.time); }).map(function (c) {
        var pk = packOf(c), on = selC && c.id === selC.id;
        var sub = (KIND[c.kind] || c.kind) + ' · ' + c.place + (pk ? ' · pacote ' + pk.used + '/' + pk.total : '');
        var st = c.status === 'cancelado' ? 'Cancelado' : (c.status === 'confirmado' ? 'Confirmado' : c.status);
        return { title: c.time + ' · ' + whoOf(c), sub: sub, st: st, stCls: 'badge ' + (c.status === 'cancelado' ? 'badge--plain' : 'badge--ok'), cls: 'lrow t5-ag__it' + (on ? ' is-on' : ''), cur: String(!!on),
          open: function () { ctx.setUi({ sel: c.id, day: c.day, rs: false, slot: '', slotErr: '' }); } };
      });
      var wd = day.split(' ')[0], date = day.split(' ')[1];
      var blocked = (DB.disponibilidade.exceptions || []).filter(function (x) { return x.date === date; })[0];
      var avail = blocked ? 'Exceção: ' + blocked.text : ((DB.disponibilidade.days[wd] || []).join(' · ') || 'sem horários de atendimento');

      // ---------- detalhe ----------
      var c = selC, pk = c ? packOf(c) : null, isGroup = c && !c.student;
      var offer = c && c.offer ? DB.find('ofertas', c.offer) : null;
      var cancelled = c && c.status === 'cancelado';
      var today = c && c.day === 'seg 26/10';
      var reserved = pk ? pk.reserved + (scn === 'reservado' ? 1 : 0) : 0;
      var revPending = pk ? (scn === 'reversao' && !ui.checked ? 1 : pk.pendingRev) : 0;
      var revs = pk ? pk.reversals + (scn === 'reversao' && ui.checked ? 1 : 0) : 0;
      var kv = c ? [
        { k: 'Data', v: LONG[c.day] || c.day },
        { k: 'Horário', v: c.time + ' · ' + tz },
        { k: 'Participante', v: isGroup ? c.group + ' · ' + c.status : whoOf(c) },
        { k: 'Formato', v: (KIND[c.kind] || c.kind) + ' · ' + c.place },
        { k: 'Oferta', v: pk ? pk.name + ' (crédito do pacote)' : (offer ? offer.name + ' · ' + U.money(offer.price) + '/' + offer.unit : 'Turma sem cobrança por sessão') }
      ] : [];
      var credit = pk ? [
        { k: 'Pacote', v: pk.name + ' · ' + pk.total + ' sessões' },
        { k: 'Usadas', v: pk.used + ' de ' + pk.total },
        { k: 'Reservadas', v: String(reserved) },
        { k: 'Reversões', v: revPending ? revs + ' · 1 pendente' : String(revs) },
        { k: 'Origem', v: pk.origin },
        { k: 'Unidade', v: '1 crédito = 1 ' + pk.unit }
      ] : [];

      // ---------- remarcar ----------
      var rsOpen = has(ui, 'rs') ? !!ui.rs : scn === 'ocupado';
      var slot = has(ui, 'slot') ? ui.slot : (scn === 'ocupado' ? 'ter 27/10 07:00' : '');
      var slotErr = has(ui, 'slotErr') ? ui.slotErr : (scn === 'ocupado' ? 'qua 28/10 07:00' : '');
      var all = c ? slots(c.id) : [];
      var errSlot = all.filter(function (s) { return s.key === slotErr; })[0] || null;
      var free = all.filter(function (s) { return !s.busy; });
      var nextFree = free.filter(function (s) { return s.key !== slot; }).slice(0, 3);
      var slotList = all.slice(0, 9).map(function (s) {
        var on = s.key === slot;
        return { label: s.day.split(' ')[0] + ' ' + s.day.split(' ')[1] + ' · ' + s.time, sub: s.busy ? 'ocupado' : '', hasSub: !!s.busy,
          cls: 'chip t5-chip t5-slot' + (on ? ' is-on' : '') + (s.busy ? ' is-busy' : ''), on: String(on),
          pick: function () { if (s.busy) ctx.setUi({ slotErr: s.key }); else ctx.setUi({ slot: s.key, slotErr: '' }); } };
      });
      var sugg = nextFree.map(function (s) { return { label: s.day + ' · ' + s.time, pick: function () { ctx.setUi({ slot: s.key, slotErr: '' }); } }; });
      var slotObj = all.filter(function (s) { return s.key === slot; })[0] || null;
      var partLine = isGroup ? (c ? c.group + ' (' + c.status + ') recebe o aviso' : '') : (c ? whoOf(c) + ' recebe o aviso no app' : '');
      var confirmRs = function () {
        if (!slotObj) { ctx.setUi({ needSlot: true }); return; }
        var b = busy(slotObj.day, slotObj.time, c.id);
        if (b) { ctx.setUi({ slotErr: slotObj.key }); return; }
        var from = c.day + ' ' + c.time;
        ctx.ask({
          title: 'Remarcar compromisso',
          text: 'Confira data, fuso e participante antes de confirmar.',
          lines: ['Participante: ' + (isGroup ? c.group : whoOf(c)), 'De: ' + from, 'Para: ' + slotObj.key + ' (' + tz + ')', partLine + '.', pk ? 'Pacote: o crédito acompanha o novo horário; nada é descontado agora.' : 'Sem crédito de pacote envolvido.'],
          ok: 'Remarcar compromisso', cancel: 'Voltar',
          onOk: function () {
            var it = DB.find('agenda', c.id); it.day = slotObj.day; it.time = slotObj.time; it.when = whenOf(slotObj.day, slotObj.time);
            ctx.setUi({ rs: false, slot: '', slotErr: '', day: slotObj.day, sel: c.id, done: 'Remarcado de ' + from + ' para ' + slotObj.key + '. ' + partLine + '.' });
          }
        });
      };
      var compareSlot = function () {
        ctx.ask({ title: 'Horário não está mais disponível', text: 'Sua escolha anterior continua selecionada.',
          lines: ['Pedido: ' + (errSlot ? errSlot.key : slotErr) + (errSlot && errSlot.busy ? ' · ocupado por ' + whoOf(errSlot.busy) : ''), 'Escolha mantida: ' + (slot || 'nenhuma'), 'Próximos livres: ' + (nextFree.map(function (s) { return s.key; }).join(', ') || 'nenhum nesta semana')],
          ok: 'Entendi', cancel: false });
      };

      // ---------- cancelar com política ----------
      var cancel = function () {
        var lines = ['Compromisso: ' + whenOf(c.day, c.time) + ' · ' + (isGroup ? c.group : whoOf(c)) + ' (' + tz + ')',
          'Política do contrato: cancelamento com 24 h ou mais devolve o crédito; com menos de 24 h, a sessão é consumida.'];
        if (pk) lines.push(today ? 'Efeito no pacote: faltam menos de 24 h, a sessão conta como usada (' + pk.used + ' → ' + (pk.used + 1) + ' de ' + pk.total + ').' : 'Efeito no pacote: o crédito volta ao pacote.');
        else if (offer) lines.push('Sessão avulsa: valor segue a política da oferta ' + offer.name + '.');
        lines.push('Cancelar não gera reembolso automático. Reembolsos ficam em Recebimentos.');
        lines.push(isGroup ? 'Os participantes da turma recebem o aviso.' : whoOf(c) + ' recebe o aviso no app.');
        ctx.ask({ title: 'Cancelar compromisso?', lines: lines, ok: 'Cancelar compromisso', danger: true, cancel: 'Manter',
          onOk: function () {
            var it = DB.find('agenda', c.id); it.status = 'cancelado';
            if (pk && today) pk.used = Math.min(pk.total, pk.used + 1);
            ctx.setUi({ rs: false, done: 'Compromisso cancelado. ' + (isGroup ? 'Participantes avisados.' : whoOf(c) + ' foi avisado.') + (pk ? (today ? ' Sessão consumida pela política de 24 h.' : ' Crédito devolvido ao pacote.') : '') });
          } });
      };
      var why = function () {
        ctx.ask({ title: 'Por que o crédito fica reservado', lines: ['Ao marcar uma sessão do pacote, 1 crédito fica reservado para ela.', 'O crédito só é consumido quando a sessão acontece, ou no cancelamento com menos de 24 h.', 'Remarcar leva a reserva junto; cancelar com 24 h ou mais devolve.', 'Reserva não comprova pagamento. Pagamentos ficam em Recebimentos.'], ok: 'Entendi', cancel: false });
      };

      // ---------- situações com consulta ----------
      var unknownOp = (scn === 'incerto' || scn === 'desconhecida' || scn === 'reversao') && !ui.checked;
      var recheck = function () {
        var msg = scn === 'incerto' ? 'Consulta feita às ' + U.now() + ': a remarcação não foi gravada. O compromisso continua em ' + (c ? c.day + ' ' + c.time : '') + '; você pode remarcar de novo.'
          : scn === 'reversao' ? 'Consulta feita às ' + U.now() + ': 1 crédito voltou ao pacote de Diego. Reversão não é reembolso.'
          : 'Consulta feita às ' + U.now() + ': ' + (c ? firstOf(c) : '') + ' confirmou presença.';
        ctx.setUi({ checked: true, done: msg });
      };

      return {
        tz: tz,
        sub: U.today.charAt(0).toUpperCase() + U.today.slice(1) + ' · ' + tz,
        week: week, dayLong: LONG[day] || day, items: items, hasItems: items.length > 0, noItems: items.length === 0, avail: avail,
        rootCls: 'mod-grid2 t5-ag' + (ctx.id || ui.sel || scn ? ' t5-ag--det' : ''),
        hasSel: !!c, title: c ? c.time + ' · ' + whoOf(c) : '', kv: kv,
        stLabel: cancelled ? 'Cancelado' : (c && c.status === 'confirmado' ? 'Confirmado' : (c ? c.status : '')), stCls: 'badge ' + (cancelled ? 'badge--plain' : 'badge--ok'),
        hasPack: !!pk, credit: credit, packTitle: pk ? 'Pacote de ' + firstOf(c) : '',
        canAct: !!c && !cancelled, cancelled: !!cancelled,
        canRs: !!c && !cancelled && !(scn === 'incerto' && !ui.checked),
        hasStudent: !!(c && c.student), isGroup: !!isGroup,
        rsOpen: rsOpen && !!c && !cancelled,
        toggleRs: function () { ctx.setUi({ rs: !rsOpen, slotErr: '', needSlot: false }); },
        slots: slotList, hasSlots: slotList.length > 0, noSlots: slotList.length === 0,
        hasSlotErr: !!slotErr, slotErrText: (errSlot ? errSlot.key : slotErr) + (errSlot && errSlot.busy ? ' já está com ' + whoOf(errSlot.busy) + '.' : ' foi ocupado.') + (slot ? ' Sua escolha anterior (' + slot + ') continua selecionada.' : ''),
        sugg: sugg, hasSugg: sugg.length > 0, compareSlot: compareSlot,
        needSlot: !!ui.needSlot && !slotObj,
        rsLine: slotObj && c ? 'De ' + c.day + ' ' + c.time + ' para ' + slotObj.key + ' · ' + tz : 'Escolha um horário livre.',
        confirmRs: confirmRs, cancel: cancel, why: why,
        done: ui.done || '', hasDone: !!ui.done,
        sRemarcado: scn === 'remarcado' && !ui.done,
        remText: c ? (isGroup ? c.group : whoOf(c)) + ' agora em ' + (LONG[c.day] || c.day) + ' às ' + c.time + ' (antes: sábado, 24/10). Aviso enviado ao aluno às 09:40; a reserva do pacote acompanhou o novo horário.' : '', sReservado: scn === 'reservado' && !!pk,
        sIncerto: scn === 'incerto' && unknownOp, sReversao: scn === 'reversao' && unknownOp, sDesconhecida: scn === 'desconhecida' && unknownOp,
        sReservadoNoPack: scn === 'reservado' && !pk,
        recheck: recheck,
        goStudent: function () { if (c && c.student) ctx.go('TRE03', { id: c.student }); },
        goExternal: function () { if (c) ctx.go('TRE31', { id: c.id }); },
        goDispo: function () { ctx.go('TRE19'); },
        backList: function () { ctx.go('TRE20'); }
      };
    }
  });
})();
