/* O5 · FA05 Gestão de disputa + subtelas FA05.A–C. ctx.id = pedido.
   Evidência mínima: dados de saúde (anamnese) ficam fora por padrão; conversa inteira não entra. */
(function () {
  'use strict';
  var DB = window.DB, U = window.U, O5 = window.O5;
  var backFA05 = function (ctx) { return { id: ctx.id || '' }; };
  var DOCS = [
    { k: 'recibo', n: 'Recibo e aceite', o: 'sistema', size: '84 KB' },
    { k: 'termos', n: 'Termos do programa v3', o: 'sistema', size: '120 KB' },
    { k: 'acessos', n: 'Registros de acesso ao programa', o: 'sistema', size: '36 KB' },
    { k: 'conversa', n: 'Trecho da conversa sobre o início', o: 'mensagens', size: '12 KB' }
  ];
  function dispOf(ctx, def) { var o = O5.order(ctx.id, def); return { o: o, d: O5.dispute(o) }; }
  function dueTxt(d) { return d.due ? d.due + (d.days >= 0 ? ' · faltam ' + U.plural(d.days, 'dia', 'dias') : '') : 'prazo desconhecido'; }
  function included(d) { return DOCS.filter(function (x) { return d.ev[x.k]; }); }
  function noDisp(o) {
    return { noDisp: true, hasDisp: false, emptyMsg: 'O pedido ' + o.ref + ' não tem disputa aberta.', goList: function () { GO('FA05.A'); } };
  }

  // ---------- FA05 · Gestão de disputa ----------
  REG.screen({
    page: 'operacao', key: 'fa05', id: 'FA05', title: 'Gestão de disputa', mtitle: 'Disputa', nav: 'financeiro', back: 'FA05.A', wide: true,
    testIds: ['pd10155', 'pd10098', 'pd10442'],
    normal: 'Evidência em preparo',
    scens: [['prazo', 'Prazo'], ['saude', 'Dados de saúde'], ['enviada', 'Enviada']],
    vals: function (ctx) {
      var X = dispOf(ctx, 'pd10201'), o = X.o, d = X.d, scn = ctx.scn, ui = ctx.ui;
      var base = { cb: O5.cb('financeiro.disputas', 'Pedido ' + o.ref, 'processador · disputas'), title: 'Disputa', sub: o.ref, noDisp: false, hasDisp: true, emptyMsg: '', goList: function () { GO('FA05.A'); } };
      if (!d) return Object.assign(base, noDisp(o), { kv: [], ev: [], due: '', isDue: false, isHealth: false, isSent: false, dueMsg: '', retry: function () {}, cont: function () {}, prep: function () {}, submit: function () {}, subs: [], sentMsg: '' });
      var id = o.id, sent = scn === 'enviada' || !!d.sub;
      var ev = DOCS.map(function (x) { var on = !!d.ev[x.k]; return { n: x.n, o: x.o, st: on ? 'incluído' : 'fora', cls: on ? 'badge badge--ok' : 'badge badge--plain' }; });
      ev.push({ n: 'Anamnese', o: 'treinador', st: 'excluída por padrão', cls: 'badge badge--risk' });
      return Object.assign(base, {
        title: 'Disputa #' + d.ref, sub: o.ref + ' · ' + o.payer + ' · ' + d.reason,
        kv: [['Valor', O5.m(d.amount) + ' ' + o.cur + ' · pago ' + o.at], ['Motivo do portador', d.reason], ['Prazo do fornecedor', dueTxt(d)], ['Estado', sent ? 'enviada · decisão pendente' : d.status], ['Responsável', d.resp]].map(function (r) { return { k: r[0], v: r[1] }; }),
        due: d.due ? d.due.slice(0, 5) : '—', ev: ev,
        isDue: scn === 'prazo', isHealth: scn === 'saude', isSent: sent,
        dueMsg: ui.tries ? 'Consultado às ' + U.now() + ': prazo confirmado pelo processador, ' + dueTxt(d) + '.' : 'Faltam ' + U.plural(Math.max(d.days, 0), 'dia', 'dias') + ' para ' + (d.due || 'o prazo') + '. A contagem vem do processador; confira antes de submeter.',
        retry: function () { ctx.setUi({ tries: (ui.tries || 0) + 1 }); },
        cont: function () { GO('FA05.B', { id: id }); },
        sentMsg: d.sub ? 'Versão ' + d.sub.v + ' enviada em ' + d.sub.at + ' · recibo do provedor ' + d.sub.receipt + '.' : 'Versão 1 enviada em 27/10 · recibo do provedor DS-88.',
        prep: function () { GO('FA05.B', { id: id }); },
        submit: function () { GO('FA05.C', { id: id }); },
        subs: O5.sub([
          ['Lista e prazo', 'Todas as disputas, prazo e responsável', 'FA05.A', 'list'],
          ['Preparação da evidência', 'Só o necessário e permitido', 'FA05.B', 'folder'],
          ['Submissão, recibo e desfecho', 'Versão enviada e decisão do fornecedor', 'FA05.C', 'send']
        ], id)
      });
    }
  });

  // ---------- FA05.A · Lista e prazo ----------
  REG.screen({
    page: 'operacao', key: 'fa05a', id: 'FA05.A', title: 'Disputas', nav: 'financeiro', back: 'H14', wide: true,
    normal: 'Uso recorrente',
    scens: [['vencido', 'Prazo vencido ou desconhecido'], ['duplicado', 'Caso duplicado'], ['atrasada', 'Atualização atrasada'], ['indisp', 'Dado indisponível']],
    vals: function (ctx) {
      var scn = ctx.scn, ui = ctx.ui, f = ui.f || '';
      var all = DB.o5_disputas.slice().sort(function (a, b) { return (a.days < 0 ? 99 : a.days) - (b.days < 0 ? 99 : b.days); });
      var list = all.filter(function (d) { return !f || (f === 'prazo' ? d.due && d.status !== 'enviada' : d.resp === '—'); });
      var off = scn === 'indisp';
      var rows = off ? [] : list.map(function (d) {
        var o = DB.find('o5_pedidos', d.order) || {};
        var due = scn === 'vencido' && d.id === 'd12' ? 'vencido 25/10 23:59' : (d.due ? 'vence ' + d.due : 'prazo desconhecido');
        return {
          ref: o.ref, amount: O5.m(d.amount) + ' ' + (o.cur || 'BRL'), reason: d.reason, due: due, dueCls: d.days >= 0 && d.days <= 3 && d.status !== 'enviada' ? 'o5-due o5-due--hot' : 'o5-due', st: d.status, resp: d.resp,
          mine: d.resp !== 'Lia', who: o.payer + ' · ' + d.ref,
          take: function () { d.resp = 'Lia'; ctx.toast(d.ref + ' atribuída a você às ' + U.now() + '.'); },
          go: function () { GO('FA05', { id: d.order }); }
        };
      });
      var open = all.filter(function (d) { return d.status !== 'enviada' && d.status !== 'ganha' && d.status !== 'perdida'; }).length;
      return {
        cb: O5.cb('financeiro.disputas', 'Todas as contas', 'processador · disputas'),
        sub: off ? '— abertas · dado indisponível' : U.plural(open, 'aberta', 'abertas') + ' · ' + U.plural(all.length, 'disputa', 'disputas') + ' no total',
        filters: [['', 'Todas'], ['prazo', 'Com prazo'], ['semresp', 'Sem responsável']].map(function (x) { var on = f === x[0]; return { l: x[1], cls: 'chip o5-chip' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ f: x[0] }); } }; }),
        rows: rows, hasRows: rows.length > 0, noRows: rows.length === 0 && !off,
        isVenc: scn === 'vencido', isDup: scn === 'duplicado', isLate: scn === 'atrasada', isOff: off,
        retry: function () { ctx.scenario(''); },
        log: function () { ctx.toast('Acompanhamento registrado às ' + U.now() + ' na trilha das disputas.'); }
      };
    }
  });

  // ---------- FA05.B · Preparação da evidência ----------
  REG.screen({
    page: 'operacao', key: 'fa05b', id: 'FA05.B', title: 'Evidência', nav: 'financeiro', back: 'FA05', backParams: backFA05, wide: true,
    testIds: ['pd10155', 'pd10098', 'pd10442'],
    normal: 'Uso recorrente',
    scens: [['semacesso', 'Documento sem acesso'], ['sensivel', 'Informação sensível'], ['invalido', 'Arquivo inválido'], ['divergente', 'Contrato divergente']],
    vals: function (ctx) {
      var X = dispOf(ctx, 'pd10201'), o = X.o, d = X.d, scn = ctx.scn, ui = ctx.ui;
      var base = { cb: O5.cb('financeiro.disputas', 'Pedido ' + o.ref, 'documentos do sistema'), title: 'Evidência', sub: o.ref, noDisp: false, hasDisp: true, emptyMsg: '', goList: function () { GO('FA05.A'); } };
      if (!d) return Object.assign(base, noDisp(o), { docs: [], prev: false, togglePrev: function () {}, pkg: [], dest: '', save: function () {}, saved: false, savedMsg: '', locked: false, isNoAcc: false, isSens: false, isInv: false, isDiv: false });
      var locked = !!d.sub;
      var docs = DOCS.map(function (x) {
        var on = !!d.ev[x.k], noacc = scn === 'semacesso' && x.k === 'acessos', inv = scn === 'invalido' && x.k === 'termos';
        var dis = locked || noacc || inv;
        return { n: x.n, o: x.o + ' · ' + x.size, on: String(on && !dis), cls: 'check' + (on && !dis ? ' is-on' : ''), note: noacc ? 'sem acesso: peça ao dono do registro' : (inv ? 'arquivo inválido: gere de novo' : (x.k === 'conversa' ? 'só o trecho; nunca a conversa inteira' : '')), hasNote: noacc || inv || x.k === 'conversa', dis: String(dis),
          toggle: function () { if (dis) { ctx.toast(locked ? 'Evidência já submetida: não muda mais.' : 'Este documento não pode entrar agora.'); return; } d.ev[x.k] = !on; d.draftAt = ''; ctx.refresh(); } };
      });
      var pkg = included(d).filter(function (x) { return !(scn === 'semacesso' && x.k === 'acessos') && !(scn === 'invalido' && x.k === 'termos'); }).map(function (x) { return { n: x.n, s: x.size }; });
      return Object.assign(base, {
        title: 'Evidência ' + o.ref, sub: 'Disputa ' + d.ref + ' · ' + d.reason + ' · ' + dueTxt(d),
        docs: docs, locked: locked,
        prev: !!ui.prev, togglePrev: function () { ctx.setUi({ prev: !ui.prev }); },
        pkg: pkg, dest: 'Processador · disputa ' + d.ref + ' · prazo ' + (d.due || 'desconhecido'),
        saved: !!d.draftAt, savedMsg: 'Rascunho salvo às ' + d.draftAt + ' com ' + U.plural(pkg.length, 'documento', 'documentos') + '.',
        isNoAcc: scn === 'semacesso', isSens: scn === 'sensivel', isInv: scn === 'invalido', isDiv: scn === 'divergente',
        save: function () { if (locked) { ctx.toast('Evidência já submetida.'); return; } d.draftAt = O5.now(); if (d.status === 'nova') d.status = 'preparar'; ctx.refresh(); }
      });
    }
  });

  // ---------- FA05.C · Submissão, recibo e desfecho ----------
  REG.screen({
    page: 'operacao', key: 'fa05c', id: 'FA05.C', title: 'Submissão e desfecho', mtitle: 'Submissão', nav: 'financeiro', back: 'FA05', backParams: backFA05, wide: true,
    testIds: ['pd10201', 'pd10155', 'pd10442'],
    normal: 'Enviada · decisão pendente',
    scens: [['desconhecida', 'Submissão desconhecida'], ['encerrado', 'Prazo encerrado'], ['ganha', 'Decisão ganha'], ['perdida', 'Decisão perdida'], ['parcial', 'Reversão parcial']],
    vals: function (ctx) {
      var X = dispOf(ctx, 'pd10098'), o = X.o, d = X.d, scn = ctx.scn;
      var base = { cb: O5.cb('financeiro.disputas', 'Pedido ' + o.ref, 'processador · disputas'), title: 'Submissão e desfecho', sub: o.ref, noDisp: false, hasDisp: true, emptyMsg: '', goList: function () { GO('FA05.A'); } };
      var empty = { steps: [], isSub: false, ready: false, notReady: false, isUnk: false, isClosed: false, isWon: false, isLost: false, isPart: false, submit: function () {}, consult: function () {}, goB: function () {}, receipt: function () {}, pkgN: '', effect: function () {}, decisionNote: '' };
      if (!d) return Object.assign(base, noDisp(o), empty);
      var sub = d.sub || (scn ? { v: 1, at: '27/10 09:30', receipt: 'DS-88' } : null);
      var id = o.id;
      var C = function (t) { return O5.badge(t); };
      var dec = { ganha: ['ganha · 26/10', 'Confirmado'], perdida: ['perdida · 26/10', 'Falhou'], parcial: ['reversão parcial · R$ 23,50', 'Confirmado'] }[scn] || ['pendente', 'Na fila'];
      var eff = { ganha: ['nenhum débito · valor liberado', 'Confirmado'], perdida: ['− ' + O5.m(d.amount).replace('− ', '') + ' no recebível de ' + O5.seller(o).short, 'Confirmado'], parcial: ['− R$ 23,50 no recebível de ' + O5.seller(o).short, 'Confirmado'] }[scn] || ['—', 'Na fila'];
      var unk = scn === 'desconhecida';
      var steps = sub ? [
        { t: 'Submetido v' + sub.v, d: sub.at + ' · recibo ' + (unk ? 'não recebido' : sub.receipt), st: unk ? 'Desconhecido' : 'Confirmado', cls: C(unk ? 'Desconhecido' : 'Confirmado') },
        { t: 'Decisão do fornecedor', d: dec[0], st: dec[1], cls: C(dec[1]) },
        { t: 'Efeito no recebível', d: eff[0], st: eff[1], cls: C(eff[1]) },
        { t: 'Acesso ao conteúdo', d: 'separado do resultado da disputa · não muda por ela', st: 'Não se aplica', cls: C('Não se aplica') }
      ] : [];
      var pkg = included(d);
      return Object.assign(base, empty, {
        title: 'Submissão e desfecho', sub: o.ref + ' · disputa ' + d.ref + ' · ' + dueTxt(d),
        steps: steps, isSub: !!sub,
        ready: !sub && !!d.draftAt && scn !== 'encerrado', notReady: !sub && !d.draftAt && scn !== 'encerrado',
        isUnk: unk, isClosed: scn === 'encerrado', isWon: scn === 'ganha', isLost: scn === 'perdida', isPart: scn === 'parcial',
        pkgN: U.plural(pkg.length, 'documento', 'documentos') + ' no rascunho de ' + (d.draftAt || '—') + ' · anamnese fora',
        decisionNote: 'A 99Coach não promete vitória. Quem decide é o emissor do cartão, pelo processador.',
        goB: function () { GO('FA05.B', { id: id }); },
        submit: function () {
          if (d.sub) { ctx.toast('Já submetido (' + d.sub.receipt + '). Não existe nova submissão duplicada.'); return; }
          ctx.ask({ title: 'Submeter evidência v1?', text: 'Vai uma vez ao processador. Depois de enviada, a evidência não muda.', lines: ['Destinatário: processador · disputa ' + d.ref, 'Prazo: ' + dueTxt(d), 'Documentos: ' + pkg.map(function (x) { return x.n; }).join(', '), 'Fora do pacote: anamnese e conversa inteira', 'Capacidade: financeiro.disputas · confirmação recente 13:58'], ok: 'Submeter evidência', onOk: function () {
            var n = 88 + DB.o5_disputas.filter(function (x) { return x.sub; }).length - 1;
            d.sub = { v: 1, at: O5.now(), receipt: 'DS-' + n }; d.status = 'enviada';
            O5.receipt({ ref: 'DS-' + n, kind: 'Evidência de disputa submetida', order: o.ref, who: 'Lia M.', at: O5.now(), amount: O5.m(d.amount) + ' ' + o.cur + ' em disputa', motivo: d.reason, effect: 'decisão do fornecedor pendente' });
            ctx.refresh();
          } });
        },
        consult: function () { ctx.toast('Consultado às ' + U.now() + ': decisão do fornecedor ainda ' + (scn ? dec[0] : 'pendente') + '. Nada foi reenviado.'); },
        receipt: function () { var ref = sub ? sub.receipt : ''; ctx.ask({ title: 'Recibo do provedor ' + ref, lines: O5.receiptLines(ref).length > 2 ? O5.receiptLines(ref) : ['Recibo ' + ref + ' · disputa ' + d.ref, 'Versão: v' + (sub ? sub.v : 1) + ' · ' + (sub ? sub.at : ''), 'Pedido: ' + o.ref + ' · ' + O5.m(d.amount) + ' ' + o.cur, 'Demonstração · sem dinheiro real'], ok: 'Fechar', cancel: false }); },
        effect: function () { GO('FA02.C', { id: id }); }
      });
    }
  });
})();
