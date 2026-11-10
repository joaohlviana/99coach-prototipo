/* O5 · FA03 Resolver divergência + subtelas FA03.A–C. ctx.id = pedido. Sem "forçar pago": só a reparação demonstrada,
   com motivo, impacto no saldo do treinador, confirmação e recibo auditável (referência durável RP-xx). */
(function () {
  'use strict';
  var DB = window.DB, U = window.U, O5 = window.O5;
  var IDS = ['pd10447', 'pd10431', 'pd10388', 'pd10201'];
  var backFA03 = function (ctx) { return { id: ctx.id || '' }; };

  function info(ctx) {
    var o = O5.order(ctx.id), dv = O5.div(o), s = O5.seller(o);
    return { o: o, dv: dv, s: s };
  }
  // impacto no saldo do treinador ao concluir a reparação
  function impact(dv, s) {
    var before = s.aReceber, after = Math.round((s.aReceber + (dv.delta || 0)) * 100) / 100;
    return { before: before, after: after, line: 'A receber de ' + s.short + ': ' + O5.m(before) + ' → ' + O5.m(after) + ' BRL' + (dv.delta ? ' (+ ' + O5.m(dv.delta) + ')' : ' (sem mudança)') + ' · razão 26/10 14:02' };
  }
  function motivoOf(dv) { return O5.draft(dv.id).motivo || ''; }
  // pede confirmação (FA09) e registra a reparação; nunca repete se já existe uma em curso
  function askRepair(ctx, o, dv, s) {
    var mot = motivoOf(dv).trim();
    if (mot.length < 10) { O5.draft(dv.id).tried = true; ctx.refresh(); return; }
    if (dv.repair) { ctx.toast(dv.repair.ref + ' já foi solicitada às ' + dv.repair.at + '. Consulte a mesma referência; não repita.'); return; }
    var im = impact(dv, s);
    ctx.ask({
      title: 'Confirmar reparação de ' + dv.ref,
      text: 'Confirme uma vez. A execução fica em fila com referência durável; se a resposta demorar, consulte a mesma referência.',
      lines: ['Ação: ' + dv.action, 'Alvo: pedido ' + o.ref + ' · ' + s.acct + ' · demonstração', 'Efeito: ' + dv.effect, im.line, 'Motivo: ' + mot, 'Confirmação recente: MFA verificado às 13:58 · capacidade financeiro.reparar', 'Dupla aprovação: não exigida pela política de risco v1 (não move dinheiro para fora)', 'Demonstração: nenhum dinheiro real.'],
      ok: 'Confirmar reparação',
      onOk: function () {
        var n = dv.ref.replace('DV-', '');
        dv.repair = { ref: 'RP-' + n, at: U.now(), by: 'Lia M.', motivo: mot };
        dv.status = 'processando';
        O5.receipt({ ref: 'RP-' + n, kind: 'Reparação de divergência', order: o.ref, who: 'Lia M.', at: O5.now(), amount: dv.delta ? O5.m(dv.delta) + ' BRL ao recebível' : 'sem valor movimentado', motivo: mot, effect: dv.effect });
        GO('FA03.C', { id: o.id });
      }
    });
  }
  // consulta a mesma referência: processando → conciliado (aplica efeitos uma vez)
  function consult(ctx, o, dv, s) {
    if (!dv.repair) { ctx.toast('Ainda não há reparação para consultar.'); return; }
    if (dv.status === 'processando') {
      dv.status = 'conciliado';
      if (o.access === 'pendente') { o.access = 'liberado'; o.bank = { st: 'previsto', d: 'envio previsto 03/11' }; }
      s.aReceber = Math.round((s.aReceber + (dv.delta || 0)) * 100) / 100;
      ctx.toast(dv.repair.ref + ' consultada às ' + U.now() + ': confirmada pelo processador e conciliada até o corte 14:30.');
      return;
    }
    ctx.toast(dv.repair.ref + ' consultada às ' + U.now() + ': ' + dv.status + '. Nada foi repetido.');
  }
  function motFields(ctx, dv) {
    var d = O5.draft(dv.id);
    return {
      motivo: d.motivo || '',
      setMotivo: function (e) { O5.draft(dv.id).motivo = U.val(e); ctx.refresh(); },
      useHint: function () { O5.draft(dv.id).motivo = dv.hint; ctx.refresh(); },
      hint: dv.hint,
      motErr: !!d.tried && (d.motivo || '').trim().length < 10
    };
  }
  function noDiv(o) {
    return { noDiv: true, hasDiv: false, emptyMsg: 'Nenhuma divergência aberta para ' + o.ref + '. Conciliação verificada às 14:00 BRT.', goOrder: function () { GO('FA02', { id: o.id }); } };
  }

  // ---------- FA03 · Resolver divergência ----------
  REG.screen({
    page: 'operacao', key: 'fa03', id: 'FA03', title: 'Resolver divergência', mtitle: 'Resolver', nav: 'financeiro', back: 'H14', wide: true,
    testIds: IDS,
    normal: 'Aberta',
    scens: [['processando', 'Processando'], ['conciliado', 'Conciliado'], ['ambiguo', 'Ambíguo']],
    vals: function (ctx) {
      var I = info(ctx), o = I.o, dv = I.dv, s = I.s, scn = ctx.scn, ui = ctx.ui;
      var base = { title: 'Divergência', sub: o.ref, cb: O5.cb('financeiro.conciliar', 'Pedido ' + o.ref, 'processador × razão 99Coach'), noDiv: false, hasDiv: true, emptyMsg: '', goOrder: function () { GO('FA02', { id: o.id }); } };
      if (!dv) return Object.assign(base, noDiv(o), { cmp: [], subs: [], isOpen: false, isProc: false, isDone: false, isAmb: false, impact: '', effect: '', motivo: '', setMotivo: function () {}, useHint: function () {}, hint: '', motErr: false, repair: function () {}, consult: function () {}, receipt: function () {}, ambMsg: '', procRef: '', ambRetry: function () {}, closed: false });
      var st = scn === 'processando' ? 'processando' : (scn === 'conciliado' ? 'conciliado' : (scn === 'ambiguo' ? 'ambiguo' : dv.status));
      var ref = dv.repair ? dv.repair.ref : 'RP-' + dv.ref.replace('DV-', '');
      return Object.assign(base, motFields(ctx, dv), {
        title: 'Divergência ' + dv.ref, sub: o.ref + ' · ' + dv.kind + ' · aberta há ' + dv.age + ' · resp. ' + dv.resp,
        cmp: [{ k: 'Provedor', l: 'Estado', v: dv.prov[0], d: dv.prov[1] + ' · ' + dv.prov[2] }, { k: '99Coach', l: 'Estado', v: o.access === 'pendente' ? 'acesso pendente' : dv.ours[0], d: dv.ours[1] + ' · ' + dv.ours[2] }],
        effect: dv.effect, action: dv.action, impact: impact(dv, s).line,
        isOpen: st === 'aberta', isProc: st === 'processando', isDone: st === 'conciliado' || st === 'encerrado', isAmb: st === 'ambiguo', closed: st === 'encerrado',
        procRef: ref,
        ambMsg: ui.tries ? 'Consultado às ' + U.now() + ': o provedor segue sem resposta conclusiva. Nada foi reprocessado.' : 'Provedor e 99Coach respondem coisas diferentes e não dá para afirmar o estado. Consulte o provedor antes de agir.',
        ambRetry: function () { ctx.setUi({ tries: (ui.tries || 0) + 1 }); },
        repair: function () { askRepair(ctx, o, dv, s); },
        consult: function () { if (scn) { ctx.toast(ref + ' consultada às ' + U.now() + ': sem mudança. Não repita a reparação.'); return; } consult(ctx, o, dv, s); },
        receipt: function () { ctx.ask({ title: 'Recibo ' + ref, lines: O5.receiptLines(ref).length > 2 ? O5.receiptLines(ref) : ['Referência: ' + ref + ' · reparação de ' + dv.ref, 'Pedido: ' + o.ref, 'Executor: Lia M. · 26/10 14:20 BRT', 'Efeito: ' + dv.effect, 'Conciliado até o corte 14:30 BRT', 'Registro imutável na trilha de auditoria · demonstração'], ok: 'Fechar', cancel: false }); },
        subs: O5.sub([
          ['Comparação de evidências', 'Domínio, fonte, horário e correlação', 'FA03.A', 'swap'],
          ['Reparação proposta', 'Ação permitida, efeito e motivo', 'FA03.B', 'wand'],
          ['Conciliação e recibo', 'Referência durável e pendências', 'FA03.C', 'checksq']
        ], o.id)
      });
    }
  });

  // ---------- FA03.A · Comparação de evidências ----------
  REG.screen({
    page: 'operacao', key: 'fa03a', id: 'FA03.A', title: 'Comparação de evidências', mtitle: 'Evidências', nav: 'financeiro', back: 'FA03', backParams: backFA03, wide: true,
    testIds: IDS,
    normal: 'Uso recorrente',
    scens: [['antigo', 'Dado antigo'], ['indisp', 'Provedor indisponível'], ['duplicado', 'Evento duplicado'], ['semref', 'Referência ausente'], ['inconclusivo', 'Inconclusivo']],
    vals: function (ctx) {
      var I = info(ctx), o = I.o, dv = I.dv, s = I.s, scn = ctx.scn;
      var base = { cb: O5.cb('financeiro.conciliar', 'Pedido ' + o.ref, 'processador × razão'), rows: [], isOld: false, isOff: false, isDup: false, isNoRef: false, isInc: false, refresh: function () {}, refreshed: '', hasRefreshed: false, title: 'Comparação', sub: o.ref };
      if (!dv) return Object.assign(base, noDiv(o));
      var prov = scn === 'indisp' ? ['indisponível', '—', 'consulta falhou 14:01'] : dv.prov;
      var rows = [
        { k: 'Processador', v: prov[0], at: prov[1], c: scn === 'semref' ? 'sem referência' : prov[2], cls: scn === 'indisp' ? 'badge badge--warn' : 'badge badge--plain' },
        { k: 'Nosso pedido', v: dv.ours[0], at: dv.ours[1], c: dv.ours[2], cls: 'badge badge--plain' },
        { k: 'Direito de acesso', v: o.access === 'pendente' ? dv.acc[0] : (o.access === 'liberado' && dv.kind === 'pago sem acesso' ? 'concedido' : dv.acc[0]), at: dv.acc[1], c: dv.acc[2], cls: dv.acc[2] === 'etapa divergente' && o.access === 'pendente' ? 'badge badge--risk' : 'badge badge--plain' },
        { k: 'Conta · ambiente', v: s.acct + ' · demonstração', at: '—', c: '—', cls: 'badge badge--plain' }
      ];
      if (scn === 'duplicado') rows.splice(1, 0, { k: 'Evento repetido', v: 'pago (2ª entrega)', at: dv.prov[1], c: dv.ours[2] + 'b · agrupado', cls: 'badge badge--plain' });
      return Object.assign(base, noDivFalse(), {
        title: 'Divergência ' + dv.ref, sub: o.ref + ' · ' + dv.kind,
        rows: rows,
        isOld: scn === 'antigo', isOff: scn === 'indisp', isDup: scn === 'duplicado', isNoRef: scn === 'semref', isInc: scn === 'inconclusivo',
        hasRefreshed: !!dv.refreshedAt, refreshed: 'Atualização controlada pedida às ' + (dv.refreshedAt || '') + ' · resposta do processador chega na fila; nada foi alterado.',
        refresh: function () {
          ctx.ask({ title: 'Solicitar atualização controlada?', text: 'Pedimos ao processador o estado atual de ' + o.ref + ' pela mesma correlação (' + dv.prov[2] + '). Isso só lê; não cobra, não concede e não reembolsa.', ok: 'Solicitar atualização', onOk: function () { dv.refreshedAt = U.now(); ctx.refresh(); } });
        }
      });
    }
  });
  function noDivFalse() { return { noDiv: false, hasDiv: true, emptyMsg: '', goOrder: function () {} }; }

  // ---------- FA03.B · Reparação proposta ----------
  REG.screen({
    page: 'operacao', key: 'fa03b', id: 'FA03.B', title: 'Reparação proposta', mtitle: 'Reparação', nav: 'financeiro', back: 'FA03', backParams: backFA03, wide: true,
    testIds: IDS,
    normal: 'Uso recorrente',
    scens: [['mudou', 'Estado mudou'], ['capacidade', 'Capacidade insuficiente'], ['jasolicitada', 'Ação já solicitada'], ['politica', 'Política ausente']],
    vals: function (ctx) {
      var I = info(ctx), o = I.o, dv = I.dv, s = I.s, scn = ctx.scn;
      var base = { cb: O5.cb('financeiro.reparar', 'Pedido ' + o.ref, 'política de reparação v1'), kv: [], title: 'Reparação proposta', sub: o.ref, motivo: '', setMotivo: function () {}, useHint: function () {}, hint: '', motErr: false, confirm: function () {}, escalate: function () {}, blocked: false, isChanged: false, isCap: false, isDone: false, isPol: false, doneRef: '', isPaid: false, goC: function () {} };
      if (!dv) return Object.assign(base, noDiv(o));
      var already = scn === 'jasolicitada' || !!dv.repair;
      var blocked = scn === 'mudou' || scn === 'capacidade' || scn === 'politica' || already;
      var im = impact(dv, s);
      return Object.assign(base, noDivFalse(), motFields(ctx, dv), {
        title: 'Reparação proposta', sub: dv.ref + ' · ' + o.ref,
        kv: [['Ação', dv.action], ['Pré-condição', dv.pre], ['Efeito', dv.effect], ['Cobrança', 'nenhuma nova cobrança'], ['Saldo do treinador', im.line]].map(function (r) { return { k: r[0], v: r[1] }; }),
        isPaid: dv.kind === 'pago sem acesso',
        blocked: blocked, isChanged: scn === 'mudou', isCap: scn === 'capacidade', isPol: scn === 'politica', isDone: already && scn !== 'mudou' && scn !== 'capacidade' && scn !== 'politica',
        doneRef: dv.repair ? dv.repair.ref + ' solicitada às ' + dv.repair.at + ' por ' + dv.repair.by : 'RP-' + dv.ref.replace('DV-', '') + ' solicitada às 14:20 por Bia F.',
        goC: function () { GO('FA03.C', { id: o.id }); },
        confirm: function () { if (blocked) return; askRepair(ctx, o, dv, s); },
        escalate: function () {
          ctx.ask({ title: 'Encaminhar à alçada', text: 'O caso ' + dv.ref + ' vai para quem tem financeiro.reparar com todo o contexto. Você continua vendo o andamento.', lines: ['Para: Bia F. · financeiro N2', 'Motivo atual: ' + (motivoOf(dv) || 'não informado')], ok: 'Encaminhar', onOk: function () { dv.resp = 'Bia'; ctx.toast(dv.ref + ' encaminhada a Bia F. às ' + U.now() + '.'); } });
        }
      });
    }
  });

  // ---------- FA03.C · Conciliação e recibo ----------
  REG.screen({
    page: 'operacao', key: 'fa03c', id: 'FA03.C', title: 'Conciliação', nav: 'financeiro', back: 'FA03', backParams: backFA03, wide: true,
    testIds: IDS,
    normal: 'Uso recorrente',
    scens: [['processando', 'Processando'], ['desconhecido', 'Desconhecido'], ['parcial', 'Parcial'], ['falhou', 'Falhou confirmado'], ['reconciliado', 'Reconciliado até o corte']],
    vals: function (ctx) {
      var I = info(ctx), o = I.o, dv = I.dv, s = I.s, scn = ctx.scn;
      var base = { cb: O5.cb('financeiro.ler', 'Pedido ' + o.ref, 'processador · conciliação'), title: 'Conciliação', sub: o.ref, steps: [], hasRepair: false, noRepair: false, canClose: false, closed: false, isUnk: false, isFail: false, isPart: false, consult: function () {}, close: function () {}, receipt: function () {}, goB: function () {}, openCase: function () {}, refLabel: '' };
      if (!dv) return Object.assign(base, noDiv(o));
      var demo = !!scn && !dv.repair;
      var rp = dv.repair || (scn ? { ref: 'RP-' + dv.ref.replace('DV-', ''), at: '14:20', by: 'Lia M.' } : null);
      if (!rp) return Object.assign(base, noDivFalse(), { title: 'Conciliação ' + dv.ref, sub: 'Nenhuma reparação solicitada ainda', noRepair: true, goB: function () { GO('FA03.B', { id: o.id }); } });
      var st = scn ? { processando: 'processando', desconhecido: 'desconhecido', parcial: 'parcial', falhou: 'falhou', reconciliado: 'conciliado' }[scn] : dv.status;
      var C = function (t) { return { st: t, cls: O5.badge(t) }; };
      var grant = st === 'conciliado' || st === 'encerrado' || st === 'parcial' ? C('Confirmado') : (st === 'falhou' ? C('Falhou') : (st === 'desconhecido' ? C('Desconhecido') : C('Em andamento')));
      var link = st === 'conciliado' || st === 'encerrado' ? C('Confirmado') : (st === 'parcial' ? C('Falhou') : C('Na fila'));
      var conc = st === 'conciliado' || st === 'encerrado' ? C('Confirmado') : (st === 'falhou' ? C('Não se aplica') : C('Na fila'));
      var steps = [
        Object.assign({ t: dv.kind === 'pago sem acesso' ? 'Concessão' : 'Execução', d: rp.at + ' · ' + rp.ref }, grant),
        Object.assign({ t: 'Vínculo e preparo', d: st === 'conciliado' || st === 'encerrado' ? '14:21' : '—' }, link),
        Object.assign({ t: 'Aviso ao aluno', d: 'fila de mensagens' }, C(st === 'falhou' ? 'Não se aplica' : 'Em andamento')),
        Object.assign({ t: 'Conciliação', d: st === 'conciliado' || st === 'encerrado' ? 'até o corte 14:30' : 'aguarda confirmação' }, conc)
      ];
      return Object.assign(base, noDivFalse(), {
        title: 'Conciliação ' + dv.ref, sub: 'Referência ' + rp.ref + ' · ' + rp.by, refLabel: 'Consultar ' + rp.ref,
        steps: steps, hasRepair: true,
        isUnk: st === 'desconhecido', isFail: st === 'falhou', isPart: st === 'parcial',
        canClose: st === 'conciliado', closed: st === 'encerrado',
        consult: function () { if (demo || scn) { ctx.toast(rp.ref + ' consultada às ' + U.now() + ': sem mudança. A mesma referência segue valendo.'); return; } consult(ctx, o, dv, s); },
        close: function () { if (scn) { ctx.toast('Caso encerrado (demonstração da situação).'); return; } dv.status = 'encerrado'; ctx.toast(dv.ref + ' encerrada às ' + U.now() + ' com recibo ' + rp.ref + '.'); },
        receipt: function () { ctx.ask({ title: 'Recibo ' + rp.ref, lines: O5.receiptLines(rp.ref).length > 2 ? O5.receiptLines(rp.ref) : ['Referência: ' + rp.ref, 'Pedido: ' + o.ref, 'Executor: ' + rp.by + ' · ' + rp.at + ' BRT', 'Efeito: ' + dv.effect, 'Demonstração · sem dinheiro real'], ok: 'Fechar', cancel: false }); },
        openCase: function () { GO('H12'); }
      });
    }
  });
})();
