/* A2 · Minhas contratações (H11/FC07), acesso (FC06), recorrência (FC08) e reembolso (FC09) da aluna Ana */
(function () {
  'use strict';
  var DB = window.DB, U = window.U, A2 = window.A2, GO = window.GO;
  var RAFAEL_PHOTO = 'bdc7ef1c8dbf05558c3bf8d575fc3a04';
  function photo(name) { var src = /Rafael/.test(name) ? U.img(RAFAEL_PHOTO) : ''; return { src: src, has: !!src, no: !src }; }
  function tl(t, s, kind) { return { t: t, s: s || '', dot: 'tl__dot' + (kind === 'ink' ? ' is-ink' : kind === 'brand' ? ' is-brand' : ''), ic: 'ic ic--xs i-' + (kind === 'ink' ? 'check' : kind === 'brand' ? 'refresh' : 'clock') }; }

  // ================= H11 · Minhas contratações (e detalhe FC07) =================
  REG.screen({
    page: 'aluno', key: 'contratacoes', id: 'H11', also: ['FC07'], title: 'Minhas contratações', mtitle: 'Contratações', nav: 'contratacoes', wide: true,
    back: function (ctx) { return ctx.id ? 'H11' : ''; },
    testIds: ['ct1', 'ct3'],
    normal: 'Uso recorrente',
    scens: [['vazio', 'Primeiro uso'], ['preparo', 'Pago · acesso em preparação'], ['parcial', 'Indisponibilidade parcial'],
      ['reembolso', 'Reembolso parcial'], ['filtro', 'Nenhum resultado filtrado'], ['revisao', 'Acesso pronto com cobrança em revisão']],
    vals: function (ctx) {
      var scn = ctx.scn, ui = ctx.ui;
      var all = DB.contratacoes.slice();
      if (scn === 'vazio') all = [];
      if (scn === 'preparo') all = [A2.PREP].concat(all);
      var views = all.map(function (c) { return A2.view(c, scn); });
      var F = [['todas', 'Todas'], ['acomp', 'Acompanhamentos'], ['prog', 'Programas'], ['enc', 'Encerradas']];
      var f = ui.f || (scn === 'filtro' ? 'enc' : 'todas');
      var match = function (v) { return f === 'todas' ? !v.ended : f === 'acomp' ? (!v.isProgram && !v.ended) : f === 'prog' ? (v.isProgram && !v.ended) : v.ended; };
      var shown = views.filter(match);
      var selId = ctx.id || (scn === 'preparo' ? 'ctprep' : (shown[0] && shown[0].id) || '');
      var sel = views.filter(function (v) { return v.id === selId; })[0] || null;
      var rows = shown.map(function (v) {
        var on = !!sel && v.id === sel.id, ph = photo(v.with);
        return { title: v.line, with: v.with, ini: v.ini, photo: ph.src, hasPhoto: ph.has, noPhoto: ph.no, badges: v.badges, meta: v.meta,
          cls: 'a2-row' + (on ? ' is-on' : ''), cur: on ? 'true' : 'false', actLabel: v.actLabel, actCls: v.actCls, act: v.act,
          open: function () { ctx.go('H11', { id: v.id }); } };
      });
      var counts = {}; F.forEach(function (it) { var k = it[0]; counts[k] = views.filter(function (v) { return k === 'todas' ? !v.ended : k === 'acomp' ? (!v.isProgram && !v.ended) : k === 'prog' ? (v.isProgram && !v.ended) : v.ended; }).length; });
      var filters = F.map(function (it) { var on = it[0] === f; return { label: it[1] + ' · ' + counts[it[0]], cls: 'chip' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ f: it[0] }); } }; });

      // ---------- detalhe ----------
      var d = { has: !!sel };
      if (sel) {
        var c = sel.c, x = sel.x, rec = sel.recurring, rf = sel.refund, ph = photo(c.with);
        var kv = [['Contratado', sel.fam + ' · ' + c.what], ['Fornecedor', c.with], ['Para', x.for || 'Ana Carolina Souza'],
          ['Valor', c.price ? A2.brl(c.price) + (rec ? ' / mês' : (c.unit === 'sessão' ? ' / sessão' : ' · compra única')) : 'sem cobrança'],
          ['Ciclo', rec ? 'mensal · desde ' + c.since : (c.price ? 'compra única · ' + c.since : 'acesso gratuito · ' + c.since)]];
        if (rec && c.status === 'ativa') kv.push(['Próxima cobrança', (c.next || '—') + ' · ' + A2.brl(c.price)]);
        if (rec && c.status === 'renovação cancelada') kv.push(['Próxima cobrança', 'nenhuma · acesso até ' + (x.until || '—')]);
        if (rec && c.status === 'pausada') kv.push(['Próxima cobrança', 'pausada até ' + (x.pauseUntil || '—')]);
        if (c.method) kv.push(['Método', c.method + ' (no provedor)']);
        if (x.order) kv.push(['Pedido', '#' + x.order]);
        var ev = (x.events || []).map(function (e) { return tl(e[0], e[1], 'ink'); });
        if (scn === 'reembolso' && c.id === 'ct3') ev.push(tl('Reembolso parcial', '26/10 · R$ 20,00 estornado ao Pix', 'ink'));
        if (x.access === 'preparando') ev.push(tl('Acesso em preparação', 'em andamento · costuma levar minutos', 'brand'));
        if (x.access === 'aguardando aceite') ev.push(tl('Aguardando aceite de ' + A2.first(c.with), 'o treinador foi avisado', 'brand'));
        if (x.access === 'convite') ev.push(tl('Convite enviado a quem recebe', 'aguardando aceite', 'brand'));
        if (x.pausedAt) ev.push(tl('Acompanhamento pausado', x.pausedAt + ' · volta em ' + x.pauseUntil, 'ink'));
        if (x.cancelAt) ev.push(tl('Renovação cancelada', x.cancelAt + ' · acesso até ' + x.until, 'ink'));
        if (rf) ev.push(tl('Reembolso #' + rf.id, rf.status + ' · ' + A2.brl(rf.value), rf.status === 'em análise' ? 'brand' : 'ink'));
        if (rec && c.status === 'ativa') ev.push(tl('Próxima cobrança', (c.next || '—') + ' · ' + A2.brl(c.price), ''));
        var recUnavail = scn === 'parcial';
        var receipts = (x.receipts || []).map(function (r) {
          return { label: r.at + ' · ' + A2.brl(r.value), dl: function () { ctx.toast('Recibo de ' + r.at + ' baixado (demonstração). Recibo de pagamento, não é nota fiscal.'); } };
        });
        var canRefund = c.price > 0 && !sel.ended && !rf && c.id !== 'ctprep';
        d = {
          has: true, title: c.what + ' · ' + A2.first(c.with), sub: sel.fam + ' · ' + sel.price, ini: sel.ini, photo: ph.src, hasPhoto: ph.has, noPhoto: ph.no,
          badges: sel.badges, kv: kv.map(function (r) { return { k: r[0], v: r[1] }; }), tl: ev,
          receipts: recUnavail ? [] : receipts, hasReceipts: !recUnavail && receipts.length > 0, noReceipts: !recUnavail && receipts.length === 0,
          recUnavail: recUnavail, recNote: c.price ? 'Recibo de pagamento da 99Coach. Não substitui nota fiscal.' : 'Acesso gratuito: não há cobrança nem recibo.',
          retryRec: function () { ctx.toast('Recibos ainda indisponíveis. Contratos e acesso continuam atualizados.'); },
          openContent: function () { GO('ALU06'); },
          openLabel: rec ? 'Acessar treinos' : (c.kind === 'programa' ? 'Acessar conteúdo' : 'Ver agenda'),
          isPrep: x.access === 'preparando' || x.access === 'aguardando aceite' || x.access === 'convite',
          seeProgress: function () { GO('FC06', { id: c.id }); },
          support: function () { ctx.ask({ title: 'Falar com suporte', text: 'Abrimos um caso com o pedido #' + (x.order || '—') + '. Você não precisa pagar de novo.', ok: 'Abrir caso', onOk: function () { ctx.toast('Caso S-' + (x.order || '0000') + ' aberto. Respondemos por e-mail e aqui.'); } }); },
          isRec: rec && !sel.ended, manage: function () { GO('FC08', { id: c.id }); },
          manageLabel: c.status === 'ativa' ? 'Gerenciar recorrência' : 'Ver recorrência',
          showCancelHint: rec && c.status === 'ativa',
          cancelHint: 'Você mantém acesso até ' + (c.next || '—') + '. Nada é cobrado depois.',
          canRefund: canRefund, refund: function () { GO('FC09', { id: c.id }); },
          hasRefund: !!rf, refundTxt: rf ? 'Protocolo #' + rf.id + ' · ' + rf.status + ' · ' + A2.brl(rf.value) : '', trackRefund: function () { GO('FC09', { id: c.id }); },
          isReview: scn === 'revisao' && c.id === 'ct1',
          consult: function () { ctx.toast('Cobrança ainda em revisão pelo provedor. Seu acesso continua ativo.'); }
        };
      }
      var emptyD = { has: false, title: '', sub: '', ini: '', photo: '', hasPhoto: false, noPhoto: true, badges: [], kv: [], tl: [], receipts: [], hasReceipts: false, noReceipts: false, recUnavail: false, recNote: '',
        retryRec: function () {}, openContent: function () {}, openLabel: '', isPrep: false, seeProgress: function () {}, support: function () {}, isRec: false, manage: function () {}, manageLabel: '',
        showCancelHint: false, cancelHint: '', canRefund: false, refund: function () {}, hasRefund: false, refundTxt: '', trackRefund: function () {}, isReview: false, consult: function () {} };
      return {
        rootCls: 'a2-ct' + (ctx.id ? ' has-sel' : ''),
        isEmpty: scn === 'vazio', notEmpty: scn !== 'vazio',
        noResults: scn !== 'vazio' && shown.length === 0, hasRows: shown.length > 0,
        rows: rows, filters: filters,
        clearFilter: function () { ctx.setUi({ f: 'todas' }); },
        isPartial: scn === 'parcial',
        explore: function () { GO('PUB15'); }, find: function () { GO('@home'); }, ask: function () { GO('REL05'); },
        d: d.has ? d : emptyD, showDetail: d.has, backToList: function () { ctx.go('H11', {}); }
      };
    }
  });

  // ================= FC06 · Preparação e liberação do acesso =================
  REG.screen({
    page: 'aluno', key: 'fc06', id: 'FC06', title: 'Acesso', nav: 'contratacoes', back: 'history', form: true,
    testIds: ['ct1', 'ctprep'],
    normal: 'Pagamento confirmado',
    scens: [['pendente', 'Pago, acesso pendente'], ['outra', 'Outra conta'], ['prevenda', 'Pré-venda'], ['divergente', 'Destinatário divergente'],
      ['convite', 'Convite expirado'], ['retirado', 'Conteúdo retirado ou acesso suspenso']],
    vals: function (ctx) {
      var scn = ctx.scn, id = ctx.id;
      if (!id && ctx.p.order) { var od = DB.find('a2_pedidos', ctx.p.order); id = od && od.ct ? od.ct : ''; }
      var c = A2.base(id) || A2.PREP, x = A2.x(c.id), o = x.offer ? A2.offer(x.offer) : null;
      var access = x.access;
      if (scn === 'pendente') access = 'preparando';
      var isAcomp = c.kind === 'assinatura';
      var ref = '#' + (x.order || '—');
      var free = !c.price;
      var payDone = !free;
      var steps = [];
      steps.push({ t: 'Pagamento', s: free ? 'sem cobrança · acesso gratuito' : 'confirmado · ' + (x.paidAt || c.since), cls: 'onb-check__i', chk: 'check is-on', b: free ? 'Não se aplica' : 'Confirmado' });
      if (isAcomp || (o && o.accept === 'aceite do treinador')) steps.push({ t: 'Vínculo com ' + A2.first(c.with), s: access === 'aguardando aceite' ? 'o treinador foi avisado' : 'confirmado', cls: 'onb-check__i' + (access === 'aguardando aceite' ? ' is-wait' : ''), chk: access === 'aguardando aceite' ? 'check' : 'check is-on', b: access === 'aguardando aceite' ? 'Aguardando aceite' : 'Confirmado' });
      var prepWait = access === 'preparando' || scn === 'prevenda';
      steps.push({ t: 'Acesso', s: scn === 'prevenda' ? 'libera em 02/11/2026' : (prepWait ? 'em andamento · costuma levar minutos' : (access === 'convite' ? 'quem recebe precisa aceitar o convite' : 'disponível na sua conta')), cls: 'onb-check__i' + (prepWait || access === 'convite' ? ' is-wait' : ''), chk: prepWait || access === 'convite' ? 'check' : 'check is-on', b: prepWait ? 'Em preparação' : (access === 'convite' ? 'Convite enviado' : 'Disponível') });
      steps.push({ t: 'E-mail com o acesso', s: 'para ana@email.com', cls: 'onb-check__i' + (prepWait ? ' is-wait' : ''), chk: prepWait ? 'check' : 'check is-on', b: prepWait ? 'Envio pendente' : 'Enviado' });
      var title = free ? 'Seu acesso está liberado' : (prepWait ? 'Seu acesso está sendo preparado' : (access === 'aguardando aceite' ? 'Aguardando o aceite de ' + A2.first(c.with) : 'Seu pagamento está confirmado'));
      var primary;
      if (scn === 'retirado' || scn === 'outra') primary = null;
      else if (prepWait) primary = { label: 'Consultar de novo', fn: function () {
        if (scn) { ctx.toast('Ainda em preparação. Referência ' + ref + ' guardada; não pague de novo.'); return; }
        if (DB.a2_ct[c.id]) { DB.a2_ct[c.id].access = 'ativo'; DB.a2_ct[c.id].events.push(['Acesso liberado', '26/10 ' + U.now()]); ctx.toast('Acesso liberado. Já pode abrir.'); }
        else ctx.toast('Ainda em preparação. Referência ' + ref + ' guardada; não pague de novo.');
      } };
      else if (access === 'aguardando aceite') primary = { label: 'Ver pedido de acompanhamento', fn: function () { GO('REL03'); } };
      else if (access === 'convite') primary = { label: 'Consultar entrega do convite', fn: function () { ctx.toast('Convite entregue. Aguardando aceite de quem recebe.'); } };
      else if (isAcomp) primary = { label: 'Abrir acompanhamento', fn: function () { GO('ALU01'); } };
      else primary = { label: c.kind === 'programa' ? 'Abrir meu programa' : 'Ver agenda com ' + A2.first(c.with), fn: function () { GO('ALU06'); } };
      var alert = null;
      if (scn === 'outra') alert = { cls: 'alert alert--warn', ic: 'ic ic--sm i-user', b: 'Você entrou com outra conta', t: 'O acesso foi para ana@email.com e você está em ana.souza@trabalho.com. Entre com o destinatário certo para abrir.', btn: 'Continuar', fn: function () { GO('ACC02'); } };
      else if (scn === 'prevenda') alert = { cls: 'alert alert--info', ic: 'ic ic--sm i-calendar', b: 'Pré-venda', t: 'O conteúdo libera em 02/11/2026. Avisamos por e-mail e aqui; seu pagamento já está confirmado.', btn: 'Consultar de novo', fn: function () { ctx.toast('Liberação mantida para 02/11/2026.'); } };
      else if (scn === 'divergente') alert = { cls: 'alert alert--warn', ic: 'ic ic--sm i-alert', b: 'Destinatário divergente', t: 'O pedido saiu para marina@email.com, mas a conta que pagou é a sua. Revise quem recebe antes de liberar.', btn: 'Revisar', fn: function () { GO('FC10', { offer: x.offer || 'o2' }); } };
      else if (scn === 'convite') alert = { cls: 'alert alert--warn', ic: 'ic ic--sm i-clock', b: 'Convite expirado', t: 'O link de acesso expirou sem uso. Reenviamos um novo link; o pagamento continua valendo.', btn: 'Corrigir', fn: function () { ctx.toast('Novo convite enviado. Referência ' + ref + '.'); } };
      else if (scn === 'retirado') alert = { cls: 'alert alert--risk', ic: 'ic ic--sm i-lock', b: 'Conteúdo retirado ou acesso suspenso', t: 'Este conteúdo saiu do ar. O suporte recebe o pedido ' + ref + ' e trata reembolso ou troca, sem pedir nova compra.', btn: 'Saiba por quê', fn: function () { ctx.ask({ title: 'Por que o acesso foi suspenso', text: 'O treinador retirou o conteúdo ou ele está em revisão. Seu pedido ' + ref + ' fica guardado; o suporte responde com as opções.', ok: 'Falar com suporte', onOk: function () { ctx.toast('Caso aberto com o pedido ' + ref + '.'); } }); } };
      else if (prepWait) alert = { cls: 'alert alert--info', ic: 'ic ic--sm i-info', b: 'Não pague de novo', t: 'Se demorar, abrimos um caso com este pedido. Referência ' + ref + '.', btn: '', fn: function () {} };
      return {
        title: title, item: c.what + ' · ' + c.with, ref: ref, payDone: payDone,
        hero: free ? 'Liberado por ' + A2.first(c.with) + ' em ' + c.since : 'Pedido ' + ref + ' · ' + A2.brl(x.receipts && x.receipts[0] ? x.receipts[0].value : c.price) + ' · ' + (x.paidAt || c.since),
        steps: steps, kv: [{ k: 'Referência', v: ref }, { k: 'Destinatário', v: (x.for || 'Ana Carolina Souza') + (x.gift ? '' : ' · ana@email.com') }, { k: 'Item', v: A2.famLabel(c) + ' · ' + c.what }],
        hasAlert: !!alert, alert: alert || { cls: '', ic: '', b: '', t: '', btn: '', fn: function () {} }, alertHasBtn: !!(alert && alert.btn),
        hasPrimary: !!primary, primaryLabel: primary ? primary.label : '', primary: primary ? primary.fn : function () {},
        support: function () { ctx.ask({ title: 'Falar com suporte', text: 'Enviamos ao suporte a referência ' + ref + '. Ninguém vai pedir que você pague de novo.', ok: 'Abrir caso', onOk: function () { ctx.toast('Caso aberto com a referência ' + ref + '.'); } }); },
        seeOrder: function () { GO('H11', { id: c.id === 'ctprep' ? '' : c.id }); }
      };
    }
  });

  // ================= FC08 · Gestão da contratação recorrente =================
  REG.screen({
    page: 'aluno', key: 'fc08', id: 'FC08', title: 'Gerenciar este acompanhamento', mtitle: 'Assinatura', nav: 'contratacoes', back: 'history', form: true,
    testIds: ['ct1', 'ct3'],
    normal: 'Assinatura ativa',
    scens: [['atrasado', 'Pagamento atrasado'], ['cancelada', 'Cancelada'], ['plano', 'Alterar plano'], ['cotacao', 'Cotação expirada'],
      ['portal', 'Portal de outra conta bloqueado'], ['pendente', 'Cancelamento pendente ou confirmado'], ['desconhecida', 'Próxima cobrança desconhecida']],
    vals: function (ctx) {
      var scn = ctx.scn, ui = ctx.ui;
      var c = A2.base(ctx.id) || DB.contratacoes.filter(function (k) { return k.kind === 'assinatura'; })[0] || null;
      var none = !c || c.kind !== 'assinatura';
      var real = c && DB.a2_ct[c.id] ? DB.a2_ct[c.id] : null;
      var x = c ? A2.x(c.id) : { receipts: [] };
      var status = c ? c.status : '';
      if (scn === 'cancelada') status = 'renovação cancelada';
      var next = c ? (c.next || '05/11') : '';
      var until = x.until || next;
      var kv = c && !none ? [
        { k: 'Fornecedor', v: c.with + ' · somente este contrato' },
        { k: 'Período', v: 'mensal · desde ' + c.since },
        { k: 'Próxima cobrança', v: scn === 'desconhecida' ? 'não confirmada agora' : (status === 'ativa' ? next + ' · ' + A2.brl(c.price) : (status === 'pausada' ? 'pausada até ' + (x.pauseUntil || '—') : 'nenhuma · acesso até ' + until)) },
        { k: 'Método', v: (c.method || 'cartão') + ' (no provedor)' }
      ] : [];
      var alert = null;
      if (scn === 'atrasado') alert = { cls: 'alert alert--risk', b: 'Pagamento atrasado', t: 'A cobrança de 05/10 não passou. Atualize o método no provedor; seu acesso segue até a nova tentativa.', btn: 'Consultar de novo', fn: function () { ctx.toast('Ainda em atraso. Atualize o método no provedor.'); } };
      else if (scn === 'cancelada') alert = { cls: 'alert alert--info', b: 'Renovação cancelada', t: 'Efeito em ' + next + '. Seu acesso continua até lá e nada é cobrado depois.', btn: '', fn: function () {} };
      else if (scn === 'plano') alert = { cls: 'alert alert--info', b: 'Alterar plano', t: 'Rafael Lima não tem outro plano mensal à venda agora. Quando houver, mostramos a diferença de valor antes de você confirmar.', btn: 'Saiba por quê', fn: function () { ctx.ask({ title: 'Mudança de plano', text: 'Planos são definidos pelo treinador. Se ele publicar outro plano mensal, você verá valor atual, novo valor e data de efeito antes de aceitar.', ok: 'Entendi', cancel: false }); } };
      else if (scn === 'cotacao') alert = { cls: 'alert alert--warn', b: 'Cotação expirada', t: 'O valor da mudança precisa ser recalculado. Nada foi alterado na sua assinatura.', btn: 'Corrigir', fn: function () { ctx.scenario(''); } };
      else if (scn === 'portal') alert = { cls: 'alert alert--risk', b: 'Portal de outra conta bloqueado', t: 'Este portal só mostra contratos de Rafael Lima com a sua conta. Contratos de outros treinadores ficam em cada contratação.', btn: 'Saiba por quê', fn: function () { ctx.ask({ title: 'Um portal por treinador', text: 'Por segurança, cada assinatura é gerenciada no escopo do treinador que vende. Não há um portal único com todas as contas.', ok: 'Entendi', cancel: false }); } };
      else if (scn === 'pendente') alert = { cls: 'alert alert--warn', b: 'Cancelamento pendente', t: 'Pedimos o cancelamento ao provedor às 09:40. Até a confirmação, não há nova cobrança marcada.', btn: 'Consultar de novo', fn: function () { ctx.toast('Cancelamento confirmado pelo provedor. Acesso até ' + next + '.'); } };
      else if (scn === 'desconhecida') alert = { cls: 'alert alert--warn', b: 'Próxima cobrança desconhecida', t: 'Não conseguimos confirmar a data com o provedor. Não mostramos uma data inventada.', btn: 'Consultar de novo', fn: function () { ctx.scenario(''); } };
      else if (status === 'renovação cancelada') alert = { cls: 'alert alert--info', b: 'Renovação cancelada', t: 'Seu acesso continua até ' + until + '. Nada é cobrado depois.', btn: 'Desfazer cancelamento', fn: function () {
        if (real) { c.status = 'ativa'; c.next = real.until || next; delete real.until; delete real.cancelAt; ctx.toast('Renovação reativada. Próxima cobrança em ' + c.next + '.'); }
      } };
      else if (status === 'pausada') alert = { cls: 'alert alert--info', b: 'Acompanhamento pausado', t: 'Sem cobranças até ' + (x.pauseUntil || '—') + '. Treinos e histórico ficam guardados.', btn: 'Retomar agora', fn: function () {
        if (real) { c.status = 'ativa'; c.next = '05/11'; delete real.pauseUntil; delete real.pausedAt; ctx.toast('Acompanhamento retomado. Próxima cobrança em 05/11.'); }
      } };
      var active = !none && status === 'ativa' && scn !== 'portal';
      var mode = ui.mode || '';
      var reasons = ['Vou viajar', 'Questão financeira', 'Não estou conseguindo treinar', 'Outro motivo'];
      var PAUSES = [['30', '30 dias', '25/11'], ['60', '60 dias', '25/12']];
      var pz = ui.pz || '30';
      var pzSel = PAUSES.filter(function (p) { return p[0] === pz; })[0] || PAUSES[0];
      return {
        none: none, hasC: !none,
        noneTitle: c ? c.what + ' não tem recorrência' : 'Nenhuma assinatura', noneText: 'Esta contratação foi uma compra única. Não há cobrança recorrente para gerenciar.',
        seeCt: function () { GO('H11', { id: c ? c.id : '' }); },
        what: c ? c.what : '', sub: c ? c.with + ' · mensal' : '', badge: status === 'ativa' ? A2.badge(scn === 'atrasado' ? 'pagamento atrasado' : 'ativa', scn === 'atrasado' ? 'risk' : 'ok') : A2.badge(status || '—', 'plain'),
        kv: kv, hasAlert: !!alert, alert: alert || { cls: '', b: '', t: '', btn: '', fn: function () {} }, alertHasBtn: !!(alert && alert.btn),
        active: active,
        updateMethod: function () { ctx.ask({ title: 'Atualizar método', text: 'Você vai para o ambiente do provedor (demonstração). A 99Coach não pede nem guarda dados de cartão.', ok: 'Ir ao provedor', onOk: function () { ctx.toast('Método atualizado no provedor (demonstração).'); } }); },
        changePlan: function () { ctx.scenario('plano'); },
        isIdle: active && !mode, isPause: active && mode === 'pausa', isCancel: active && mode === 'cancelar',
        startPause: function () { ctx.setUi({ mode: 'pausa' }); }, startCancel: function () { ctx.setUi({ mode: 'cancelar' }); }, closeMode: function () { ctx.setUi({ mode: '' }); },
        pauses: PAUSES.map(function (p) { var on = p[0] === pz; return { label: p[1], cls: 'chip' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ pz: p[0] }); } }; }),
        pauseLines: ['Sem cobrança até ' + pzSel[2] + '; a próxima volta a ' + A2.brl(c && c.price) + '.', 'Rafael é avisado e não envia treinos novos no período.', 'Treinos, histórico e mensagens ficam guardados.'],
        confirmPause: function () {
          ctx.ask({ title: 'Pausar por ' + pzSel[1] + '?', lines: ['Sem cobrança até ' + pzSel[2] + '.', 'Volta automaticamente em ' + pzSel[2] + '.'], ok: 'Pausar acompanhamento', onOk: function () {
            if (real) { c.status = 'pausada'; c.next = ''; real.pauseUntil = pzSel[2]; real.pausedAt = '26/10'; }
            ctx.setUi({ mode: '' }); ctx.toast('Acompanhamento pausado até ' + pzSel[2] + '.');
          } });
        },
        reasons: reasons.map(function (r) { var on = ui.reason === r; return { label: r, cls: 'chip' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ reason: on ? '' : r }); } }; }),
        cancelLines: ['Seu acesso continua até ' + next + '.', 'Nada é cobrado depois de ' + next + '.', 'Cancelar não é reembolso: para pedir dinheiro de volta, use Solicitar reembolso.', 'Rafael é avisado; treinos e histórico continuam com você.'],
        reviewCancel: function () {
          ctx.ask({ title: 'Cancelar a renovação?', text: 'Efeito em ' + next + '. Você mantém acesso até lá.', lines: ['Nada é cobrado depois.', 'Reembolso é um pedido separado.'], ok: 'Cancelar renovação', danger: true, cancel: 'Manter assinatura', onOk: function () {
            if (real) { c.status = 'renovação cancelada'; real.until = next; real.cancelAt = '26/10'; c.next = ''; }
            ctx.setUi({ mode: '' }); ctx.toast('Renovação cancelada. Acesso até ' + next + '.');
          } });
        },
        refund: function () { GO('FC09', { id: c ? c.id : '' }); },
        seeCtt: function () { GO('H11', { id: c ? c.id : '' }); }
      };
    }
  });

  // ================= FC09 · Solicitar e acompanhar reembolso =================
  REG.screen({
    page: 'aluno', key: 'fc09', id: 'FC09', title: 'Reembolso', nav: 'contratacoes', back: 'history', form: true,
    testIds: ['ct1', 'ct3'],
    normal: 'Pedir reembolso',
    scens: [['protocolo', 'Protocolo'], ['elegind', 'Elegibilidade indisponível'], ['efeito', 'Efeito no acesso'], ['elegdesc', 'Elegibilidade desconhecida'],
      ['parcial', 'Parcial anterior'], ['negado', 'Reembolso negado com motivo permitido'], ['desconhecido', 'Resultado desconhecido']],
    vals: function (ctx) {
      var scn = ctx.scn, ui = ctx.ui;
      var c = A2.base(ctx.id) || DB.find('contratacoes', 'ct3');
      var x = A2.x(c.id), rec = c.kind === 'assinatura';
      var paid = (x.receipts && x.receipts[0]) ? x.receipts[0].value : c.price;
      var prev = scn === 'parcial' ? 20 : 0;
      var elig = Math.max(0, paid - prev);
      var pol = x.policy || 'v2';
      var rf = A2.refundOf(c.id);
      if (!rf && (scn === 'protocolo' || scn === 'negado' || scn === 'desconhecido')) rf = { id: 'R-118', ct: c.id, value: elig, reason: 'Não consegui seguir por lesão.', at: '26/10 09:12', status: scn === 'negado' ? 'negado' : 'em análise', demo: true };
      var tracking = !!rf;
      var others = DB.contratacoes.filter(function (k) { return k.id !== c.id && !/reembols|cancelada/.test(k.status); }).map(function (k) { return k.what; });
      var effect = rec ? 'Se aprovado, este acompanhamento encerra e a renovação é cancelada.' : 'Se aprovado, o acesso a ' + c.what + ' encerra.';
      var keep = others.length ? 'Continuam valendo: ' + others.join(', ') + '.' : '';
      var REASONS = ['Não consegui seguir por lesão.', 'Não era o que eu esperava.', 'Cobrança que não reconheço.', 'Outro motivo.'];
      var reason = ui.reason || '';
      var noEligibility = scn === 'elegind' || scn === 'elegdesc';
      var steps = rf ? [
        { t: 'Pedido enviado', s: rf.at, dot: 'tl__dot is-ink', ic: 'ic ic--xs i-check' },
        { t: rf.status === 'negado' ? 'Analisado' : 'Em análise', s: rf.status === 'negado' ? '26/10 · negado com motivo' : 'Rafael Lima e a 99Coach avaliam pela política ' + pol, dot: 'tl__dot ' + (rf.status === 'negado' ? 'is-ink' : 'is-brand'), ic: 'ic ic--xs i-' + (rf.status === 'negado' ? 'check' : 'refresh') },
        { t: 'Estornado ao método', s: rf.status === 'negado' ? 'não se aplica' : 'para ' + (c.method || 'o método usado') + ' quando aprovado', dot: 'tl__dot', ic: 'ic ic--xs i-clock' }
      ] : [];
      return {
        what: c.what + ' · ' + A2.brl(paid), seller: c.with, pol: pol,
        eligTxt: noEligibility ? 'indisponível agora' : A2.brl(elig) + ' (política ' + pol + ')',
        hasPrev: prev > 0, prevTxt: 'Reembolso parcial anterior: ' + A2.brl(prev) + ' em 12/10. Disponível para análise: ' + A2.brl(elig) + '.',
        noElig: noEligibility, eligAlertT: scn === 'elegind' ? 'Elegibilidade indisponível' : 'Elegibilidade desconhecida',
        eligAlertS: scn === 'elegind' ? 'Não inventamos um valor. Podemos abrir um caso com o pedido para o suporte calcular.' : 'Não conseguimos consultar a regra agora. Tente de novo em instantes.',
        eligBtn: scn === 'elegind' ? 'Abrir caso' : 'Consultar de novo',
        eligAct: function () { if (scn === 'elegind') ctx.toast('Caso aberto com o pedido #' + (x.order || '—') + '.'); else ctx.scenario(''); },
        effect: effect, keep: keep, hasKeep: !!keep, effectCls: scn === 'efeito' ? 'alert--warn a2-strong' : '',
        effectWhy: function () { ctx.ask({ title: 'Efeito no acesso', text: effect + ' ' + keep, lines: ['Mostramos isso antes de você enviar.', 'Outros direitos válidos não são encerrados.'], ok: 'Entendi', cancel: false }); },
        isForm: !tracking, isTrack: tracking,
        reasons: REASONS.map(function (r) { var on = reason === r; return { label: r.replace('.', ''), cls: 'chip' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ reason: r, err: '' }); } }; }),
        note: ui.note || '', setNote: function (e) { ctx.setUi({ note: U.val(e) }); },
        err: ui.err || '', hasErr: !!ui.err,
        policy: function () { ctx.ask({ title: 'Política de reembolso ' + pol, text: 'Regra de ' + c.with + ' para esta compra. Não exigimos consumo mínimo nem máximo do conteúdo.', lines: ['Pedido analisado pelo treinador e pela 99Coach.', 'Estorno vai para o mesmo método do pagamento.'], ok: 'Fechar', cancel: false }); },
        review: function () {
          if (noEligibility) { ctx.setUi({ err: 'Sem valor elegível confirmado, não dá para enviar. Abra um caso.' }); return; }
          if (!reason) { ctx.setUi({ err: 'Escolha um motivo para enviar.' }); return; }
          ctx.ask({ title: 'Revisar solicitação', lines: ['Item: ' + c.what + ' · ' + c.with, 'Valor para análise: ' + A2.brl(elig), 'Motivo: ' + reason, effect], ok: 'Enviar solicitação', onOk: function () {
            var n = 'R-' + (118 + DB.a2_reembolsos.length);
            DB.a2_reembolsos.push({ id: n, ct: c.id, value: elig, reason: reason + (ui.note ? ' ' + ui.note : ''), at: '26/10 ' + U.now(), status: 'em análise' });
            ctx.setUi({ err: '' }); ctx.toast('Solicitação recebida. Protocolo #' + n + '.');
          } });
        },
        protocol: rf ? '#' + rf.id : '', rfStatus: rf ? rf.status : '', rfValue: rf ? A2.brl(rf.value) : '', rfReason: rf ? rf.reason : '',
        steps: steps, isDenied: !!rf && rf.status === 'negado', isUnknown: scn === 'desconhecido',
        deniedWhy: function () { ctx.ask({ title: 'Motivo da negativa', text: 'O período de análise da política ' + pol + ' terminou antes do pedido. Seu acesso continua normalmente.', ok: 'Falar com suporte', onOk: function () { ctx.toast('Caso aberto com o protocolo #R-118.'); } }); },
        consult: function () { ctx.toast(scn === 'desconhecido' ? 'Encontramos o pedido #R-118 em análise. Nada foi enviado de novo.' : 'Ainda em análise. Atualizado 26/10 ' + U.now() + '.'); },
        back: function () { GO('H11', { id: c.id === 'ctprep' ? '' : c.id }); }
      };
    }
  });
})();
