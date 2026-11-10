/* O5 · FA04 Reembolso administrativo + subtelas FA04.A–C. ctx.id = pedido.
   Regras: motivo obrigatório, impacto no saldo do treinador antes de confirmar, recibo auditável,
   dupla aprovação acima de R$ 150,00 (política de risco v1, sem autoaprovação) e resultado desconhecido
   sempre consulta a mesma referência antes de qualquer nova tentativa. Demonstração: sem dinheiro real. */
(function () {
  'use strict';
  var DB = window.DB, U = window.U, O5 = window.O5;
  var LIMIT2 = 150;
  var backFA04 = function (ctx) { return { id: ctx.id || '' }; };
  var fmt = function (n) { return Number(n).toFixed(2).replace('.', ','); };

  function form(ctx, o) {
    var key = 'rf_' + o.id, d = O5.draft(key);
    var E = O5.eligible(o);
    var raw = d.valor != null ? d.valor : fmt(E);
    var val = O5.num(raw);
    var valErr = val == null || val <= 0 ? 'Informe um valor maior que zero, em reais (ex.: 120,00).' : (val > E + 0.001 ? 'Acima do reembolsável: no máximo ' + O5.m(E) + ' BRL.' : '');
    var mot = d.motivo || '';
    var motErr = mot.trim().length < 10 ? 'Escreva a justificativa (mínimo 10 letras). Ela vai para o recibo auditável.' : '';
    var v = valErr ? 0 : val;
    return {
      key: key, d: d, E: E, raw: raw, val: v, valErr: valErr, mot: mot, motErr: motErr, tried: !!d.tried,
      needs2: v > LIMIT2,
      set: {
        valor: raw, setValor: function (e) { O5.draft(key).valor = U.val(e); ctx.refresh(); },
        motivo: mot, setMotivo: function (e) { O5.draft(key).motivo = U.val(e); ctx.refresh(); },
        showValErr: !!d.tried && !!valErr, valErrMsg: valErr, showMotErr: !!d.tried && !!motErr, motErrMsg: motErr,
        reasons: ['Cobrança duplicada', 'Serviço não prestado', 'Desistência dentro da política', 'Acordo com o treinador'].map(function (r) { return { l: r, pick: function () { O5.draft(key).motivo = r + ': '; ctx.refresh(); } }; })
      }
    };
  }
  function money(ctx, o, F, scn) {
    var s = O5.seller(o);
    var hit = O5.refundHit(o, F.val);
    var base = scn === 'repasse' ? 120 : s.disponivel;
    var after = Math.round((base - hit) * 100) / 100;
    var comm = Math.round(F.val * 5) / 100;
    return {
      s: s, hit: hit, base: base, after: after, comm: comm, neg: after < 0,
      saldoLine: 'Disponível de ' + s.short + ': ' + O5.m(base) + ' → ' + O5.m(after) + ' BRL',
      hitLine: O5.m(-hit) + ' BRL no recebível de ' + s.short + ' (valor menos 5% de comissão devolvida)',
      src: 'Fonte: razão 99Coach · ' + O5.AT + ' · política cancelamento v2'
    };
  }
  function nextRef() {
    var n = DB.o5_reembolsos.reduce(function (m, r) { return Math.max(m, parseInt(r.ref.replace('RF-', ''), 10) || 0); }, 0) + 1;
    return 'RF-' + n;
  }
  // confirmação final (FA09) e registro do reembolso
  function askRefund(ctx, o, scn) {
    var open = O5.openRefund(o);
    if (open) { ctx.toast(open.ref + ' ainda sem resultado final. Consulte a mesma referência antes de qualquer nova tentativa.'); return; }
    var F = form(ctx, o);
    if (F.valErr || F.motErr) { F.d.tried = true; ctx.refresh(); return; }
    var M = money(ctx, o, F, scn);
    var ref = nextRef();
    ctx.ask({
      title: 'Revisão final · reembolso ' + (F.val < F.E ? 'parcial' : 'total'),
      text: 'Esta ação devolve dinheiro e não pode ser desfeita aqui. Confirme uma vez; se a resposta demorar, consulte ' + ref + '.',
      lines: ['Pedido: ' + o.ref + ' · ' + o.items[0].n, 'Valor: ' + O5.m(F.val) + ' ' + o.cur, 'Destinatário: ' + o.payer + ' · ' + o.method + ' (origem)', 'Efeito: ' + M.hitLine, M.saldoLine + (M.neg ? ' · saldo negativo' : ''), 'Acesso: ' + o.accessEffect, 'Motivo: ' + F.mot.trim(), F.needs2 ? 'Dupla aprovação: exigida acima de R$ 150,00 (política de risco v1). Bia F. aprova; você não aprova o próprio pedido.' : 'Dupla aprovação: não exigida (até R$ 150,00).', 'Versão: calculado às ' + U.now() + ' · confirmação recente MFA 13:58', 'Demonstração: nenhum dinheiro real é movimentado.'],
      ok: 'Reembolsar ' + O5.m(F.val),
      onOk: function () {
        DB.o5_reembolsos.unshift({ id: ref.toLowerCase().replace('-', ''), ref: ref, order: o.id, amount: F.val, by: 'Lia M.', at: O5.now(), status: F.needs2 ? 'aguardando aprovação' : 'solicitado', motivo: F.mot.trim(), needs2: F.needs2, approver: '', approvedAt: '', checks: 0, result: F.needs2 ? 'aguarda a segunda aprovação' : 'na fila do processador', hit: M.hit, saldoLine: M.saldoLine });
        o.items[0].pending = Math.round((o.items[0].pending + F.val) * 100) / 100;
        O5.receipt({ ref: ref, kind: 'Reembolso solicitado', order: o.ref, who: 'Lia M.', at: O5.now(), amount: O5.m(F.val) + ' ' + o.cur, motivo: F.mot.trim(), effect: M.hitLine + ' · ' + M.saldoLine });
        DB.o5_rascunhos[F.key] = {};
        GO('FA04.C', { id: o.id });
      }
    });
  }
  O5.askRefund = askRefund;

  function blockInfo(o) {
    var open = O5.openRefund(o);
    return { hasOpen: !!open, openMsg: open ? open.ref + ' (' + O5.m(open.amount) + ' BRL, ' + open.status + ') ainda não tem resultado final. Consulte a mesma referência antes de qualquer nova tentativa.' : '', openLabel: open ? 'Consultar ' + open.ref : '', goOpen: function () { GO('FA04.C', { id: o.id }); } };
  }

  // ---------- FA04 · Reembolso administrativo ----------
  REG.screen({
    page: 'operacao', key: 'fa04', id: 'FA04', title: 'Reembolso administrativo', mtitle: 'Reembolso', nav: 'financeiro', back: 'H14', form: false, wide: true,
    testIds: ['pd10372', 'pd10388', 'sb2201', 'pd10442'],
    normal: 'Uso recorrente',
    scens: [['semperm', 'Sem permissão'], ['enviado', 'Enviado'], ['repasse', 'Repasse já feito']],
    vals: function (ctx) {
      var scn = ctx.scn;
      var o = O5.order(ctx.id, 'pd10390');
      var F = form(ctx, o), M = money(ctx, o, F, scn), B = blockInfo(o);
      var nothing = F.E <= 0 && !B.hasOpen;
      var id = o.id;
      return Object.assign({}, F.set, B, {
        title: 'Reembolso administrativo', sub: 'Pedido ' + o.ref + ' · ' + o.payer + ' → ' + M.s.short,
        cb: O5.cb(scn === 'semperm' ? 'financeiro.ler' : 'financeiro.reembolsar', 'Pedido ' + o.ref, 'razão 99Coach + processador'),
        elig: O5.m(F.E), cur: o.cur,
        kv: [['Destino', o.method + ' · ' + o.payer + ' (origem)'], ['Taxas', 'calculadas pela política v2 · comissão de 5% devolvida proporcionalmente (' + O5.m(M.comm) + ')'], ['Acesso', o.accessEffect], ['Efeito no recebível', M.hitLine]].map(function (r) { return { k: r[0], v: r[1] }; }),
        saldoLine: M.saldoLine, saldoSrc: M.src, saldoNeg: M.neg, saldoCls: 'o5-saldo' + (M.neg ? ' o5-saldo--neg' : ''),
        needs2: F.needs2, two: 'Acima de R$ 150,00 a política de risco v1 pede segunda aprovação (Bia F.). Você não aprova o próprio pedido.',
        isPerm: scn === 'semperm', isSent: scn === 'enviado', isRep: scn === 'repasse',
        showForm: scn !== 'semperm' && scn !== 'enviado' && !B.hasOpen && !nothing, nothing: nothing && scn !== 'semperm',
        askPerm: function () { ctx.toast('Pedido enviado a Bia F. (financeiro.reembolsar) às ' + U.now() + ' com o pedido e o valor preenchidos.'); },
        cont: function () { GO('FA02', { id: id }); },
        follow: function () { GO('FA04.C', { id: id }); },
        recheck: function () { ctx.toast('Consultado às ' + U.now() + ': o repasse P-77 de 20/10 já incluiu este pedido. O saldo negativo continua sendo mostrado antes de confirmar.'); },
        submit: function () { askRefund(ctx, o, scn); },
        subs: O5.sub([
          ['Elegibilidade e cálculo', 'Pago, já reembolsado, em processamento e restante', 'FA04.A', 'scale'],
          ['Efeitos por contrato e origem', 'Destino, taxas, recebível e acesso', 'FA04.B', 'swap'],
          ['Solicitação e resultado', 'Referência, aprovação e retorno do processador', 'FA04.C', 'checksq']
        ], id)
      });
    }
  });

  // ---------- FA04.A · Elegibilidade e cálculo ----------
  REG.screen({
    page: 'operacao', key: 'fa04a', id: 'FA04.A', title: 'Reembolso · cálculo', mtitle: 'Cálculo', nav: 'financeiro', back: 'FA04', backParams: backFA04, wide: true,
    testIds: ['pd10372', 'pd10388'],
    normal: 'Uso recorrente',
    scens: [['parcial', 'Parcial anterior'], ['pendente', 'Operação pendente'], ['limite', 'Limite mudou'], ['canal', 'Conta ou canal incompatível'], ['desconhecida', 'Elegibilidade desconhecida']],
    vals: function (ctx) {
      var scn = ctx.scn;
      var o = O5.order(ctx.id, 'pd10390');
      var F = form(ctx, o), B = blockInfo(o);
      var items = o.items.map(function (it) { var el = Math.max(0, it.paid - it.refunded - it.pending); return { n: it.n, paid: O5.m(it.paid), ref: O5.m(it.refunded), pend: it.pending ? O5.m(it.pending) : '—', el: O5.m(el) }; });
      if (scn === 'parcial') items.push({ n: 'Taxa de adesão (adicional)', paid: O5.m(60), ref: O5.m(60), pend: '—', el: O5.m(0) });
      var unknown = scn === 'desconhecida';
      var id = o.id;
      return Object.assign({}, F.set, B, {
        title: 'Reembolso · cálculo', sub: o.ref + ' · ' + o.product,
        cb: O5.cb('financeiro.reembolsar', 'Pedido ' + o.ref, 'razão 99Coach · ' + o.cur),
        items: items,
        elig: unknown ? '—' : O5.m(F.E) + ' ' + o.cur, req: unknown ? '—' : (F.valErr ? '—' : O5.m(F.val) + ' · ' + (F.val < F.E ? 'parcial' : 'total')),
        policy: 'Política: cancelamento v2 · ' + o.cur + ' · sem arredondamento oculto (centavos exatos)',
        isPart: scn === 'parcial', isPend: scn === 'pendente', isLim: scn === 'limite', isCan: scn === 'canal', isUnk: unknown,
        canEdit: !unknown && scn !== 'canal' && scn !== 'pendente' && !B.hasOpen,
        review: function () { if (F.valErr || F.motErr) { F.d.tried = true; ctx.refresh(); return; } GO('FA04.B', { id: id }); }
      });
    }
  });

  // ---------- FA04.B · Efeitos por contrato e origem ----------
  REG.screen({
    page: 'operacao', key: 'fa04b', id: 'FA04.B', title: 'Efeitos do reembolso', mtitle: 'Efeitos', nav: 'financeiro', back: 'FA04', backParams: backFA04, wide: true,
    testIds: ['pd10372', 'pd10388'],
    normal: 'Outra compra válida',
    scens: [['adicional', 'Adicional independente'], ['taxavar', 'Taxa de tratamento variável'], ['repasse', 'Repasse anterior']],
    vals: function (ctx) {
      var scn = ctx.scn;
      var o = O5.order(ctx.id, 'pd10390');
      var F = form(ctx, o), M = money(ctx, o, F, scn), B = blockInfo(o);
      var other = o.id === 'pd10390' ? 'acompanhamento de outubro também pago em PD-10388 (05/10) · o acesso continua por essa compra' : 'nenhuma outra compra válida deste item';
      var id = o.id;
      return Object.assign({}, B, {
        title: 'Efeitos do reembolso', sub: o.ref + ' · ' + O5.m(F.val) + ' ' + o.cur,
        cb: O5.cb('financeiro.reembolsar', 'Pedido ' + o.ref, 'política cancelamento v2'),
        kv: [['Destino', o.method + ' · ' + o.payer], ['Comissão 5%', 'devolvida proporcionalmente · ' + O5.m(M.comm)], ['Processamento', scn === 'taxavar' ? 'variável: o processador informa na confirmação (entre R$ 0,00 e ' + O5.m(o.proc) + ')' : 'conforme o processador · cobrado na origem ' + O5.m(o.proc)], ['Recebível do treinador', O5.m(-M.hit)], ['Acesso', o.accessEffect], ['Outras origens', other]].map(function (r) { return { k: r[0], v: r[1] }; }),
        saldoLine: M.saldoLine, saldoSrc: M.src, saldoCls: 'o5-saldo' + (M.neg ? ' o5-saldo--neg' : ''), saldoNeg: M.neg,
        isAdd: scn === 'adicional', isVar: scn === 'taxavar', isRep: scn === 'repasse', invalid: !!(F.valErr || F.motErr),
        fixMsg: F.valErr || F.motErr,
        goA: function () { GO('FA04.A', { id: id }); },
        advance: function () { askRefund(ctx, o, scn); }
      });
    }
  });

  // ---------- FA04.C · Solicitação e resultado ----------
  var FINAL = { 'concluído': 1, 'falhou': 1 };
  REG.screen({
    page: 'operacao', key: 'fa04c', id: 'FA04.C', title: 'Reembolso', nav: 'financeiro', back: 'FA04', backParams: backFA04, wide: true,
    testIds: ['pd10419', 'pd10402', 'pd10390', 'pd10442'],
    normal: 'Resultado desconhecido',
    scens: [['solicitado', 'Solicitado'], ['processando', 'Processando'], ['parcial', 'Parcial'], ['falhou', 'Falhou'], ['concluido', 'Concluído']],
    vals: function (ctx) {
      var scn = ctx.scn;
      var o = O5.order(ctx.id, 'pd10372');
      var r = O5.refundsOf(o)[0] || null;
      var id = o.id;
      var base = { cb: O5.cb('financeiro.ler', 'Pedido ' + o.ref, 'processador'), hasRf: !!r, noRf: !r, goFA04: function () { GO('FA04', { id: id }); } };
      if (!r) return Object.assign(base, { title: 'Reembolso', sub: o.ref + ' · nenhum reembolso solicitado', steps: [], isUnk: false, isWait: false, isFail: false, isDone: false, isPart: false, isProc: false, consultLabel: '', consult: function () {}, approve: function () {}, receipt: function () {}, waitMsg: '' });
      var st = scn ? { solicitado: 'solicitado', processando: 'processando', parcial: 'parcial', falhou: 'falhou', concluido: 'concluído' }[scn] : r.status;
      var C = function (t) { return O5.badge(t); };
      var steps = [{ t: 'Solicitado', d: r.by + ' · ' + r.at + ' · ' + O5.m(r.amount) + ' ' + o.cur, st: 'Confirmado', cls: C('Confirmado') }];
      if (r.needs2) steps.push({ t: 'Segunda aprovação', d: r.approver ? r.approver + ' · ' + r.approvedAt : 'Bia F. · política de risco v1', st: r.approver ? 'Confirmado' : 'Pendente', cls: C(r.approver ? 'Confirmado' : 'Pendente') });
      var procSt = { 'aguardando aprovação': ['aguarda a segunda aprovação', 'Na fila'], solicitado: ['na fila do processador', 'Na fila'], processando: ['aceito pelo processador · devolvendo', 'Em andamento'], desconhecido: ['timeout · consultar a mesma referência', 'Desconhecido'], parcial: ['devolvido R$ 40,00 de ' + O5.m(r.amount) + ' · restante em análise', 'Em andamento'], falhou: ['recusado: cartão de origem encerrado', 'Falhou'], 'concluído': ['devolvido ao ' + o.method + ' · 26/10', 'Confirmado'] }[st] || ['—', 'Na fila'];
      steps.push({ t: 'Processador', d: procSt[0], st: procSt[1], cls: C(procSt[1]) });
      var eff = st === 'concluído' ? ['− ' + O5.m(O5.refundHit(o, r.amount)).replace('− ', '') + ' lançado no recebível de ' + O5.seller(o).short, 'Confirmado'] : (st === 'falhou' ? ['nenhum: nada foi devolvido', 'Não se aplica'] : ['—', 'Na fila']);
      steps.push({ t: 'Efeito no recebível', d: eff[0], st: eff[1], cls: C(eff[1]) });
      return Object.assign(base, {
        title: 'Reembolso ' + r.ref, sub: o.ref + ' · ' + O5.m(r.amount) + ' ' + o.cur + ' · motivo: ' + r.motivo,
        steps: steps,
        isUnk: st === 'desconhecido', isWait: st === 'aguardando aprovação', isFail: st === 'falhou', isDone: st === 'concluído', isPart: st === 'parcial', isProc: st === 'processando' || st === 'solicitado',
        waitMsg: 'Aguardando segunda aprovação de Bia F. (política de risco v1, acima de R$ 150,00). Você não pode aprovar o próprio pedido.',
        consultLabel: 'Consultar ' + r.ref,
        consult: function () {
          if (scn) { ctx.toast(r.ref + ' consultado às ' + U.now() + ': sem mudança. Nenhuma nova tentativa foi feita.'); return; }
          r.checks = (r.checks || 0) + 1;
          if (r.status === 'aguardando aprovação') { ctx.toast(r.ref + ' ainda aguarda a aprovação de Bia F. Nada foi enviado ao processador.'); return; }
          if (FINAL[r.status]) { ctx.toast(r.ref + ' já está em estado final (' + r.status + ').'); return; }
          if (r.status === 'desconhecido' || r.status === 'solicitado') { r.status = 'processando'; ctx.toast('O processador encontrou ' + r.ref + ' às ' + U.now() + ': em processamento. Nenhuma nova tentativa foi feita.'); return; }
          r.status = 'concluído';
          var it = o.items[0]; it.pending = Math.max(0, Math.round((it.pending - r.amount) * 100) / 100); it.refunded = Math.round((it.refunded + r.amount) * 100) / 100;
          var s = O5.seller(o); s.disponivel = Math.round((s.disponivel - O5.refundHit(o, r.amount)) * 100) / 100;
          O5.receipt({ ref: r.ref, kind: 'Reembolso concluído', order: o.ref, who: 'processador', at: O5.now(), amount: O5.m(r.amount) + ' ' + o.cur, motivo: r.motivo, effect: 'recebível de ' + s.short + ' ' + O5.m(-O5.refundHit(o, r.amount)) });
          ctx.toast(r.ref + ' concluído às ' + U.now() + '. Recibo final disponível.');
        },
        approve: function () {
          if (scn) return;
          r.approver = 'Bia F.'; r.approvedAt = O5.now(); r.status = 'solicitado'; r.result = 'na fila do processador';
          ctx.toast('Demonstração: Bia F. aprovou ' + r.ref + ' às ' + U.now() + '. Enviado ao processador.');
        },
        receipt: function () { ctx.ask({ title: 'Recibo ' + r.ref, lines: O5.receiptLines(r.ref), ok: 'Fechar', cancel: false }); }
      });
    }
  });
})();
