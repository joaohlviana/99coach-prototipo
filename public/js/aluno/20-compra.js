/* A2 · Fluxo de compra da aluna Ana: resumo (FC01) → identificação (FC02) → confirmação (FC03) →
   provedor de demonstração (FC04) → resultado (FC05); compra para outra pessoa (FC10).
   Oferta por parâmetro: ctx.p.offer (padrão 'o1', DB.ofertas do Rafael). Pagamento sempre de demonstração. */
(function () {
  'use strict';
  var DB = window.DB, U = window.U, A2 = window.A2, GO = window.GO;
  var EMAIL = 'ana@email.com';
  function oid(ctx) { return (ctx.p && ctx.p.offer) || 'o1'; }
  function forTxt() { var r = A2.recipient(); return r ? r.name + ' (' + r.email + ')' : 'você (' + (DB.a2_checkout.email || EMAIL) + ')'; }
  function stepsOf(n) { return [1, 2, 3].map(function (i) { return { cls: i <= n ? 'is-on' : '' }; }); }
  function offerBack(ctx) { return { offer: oid(ctx) }; }

  // ================= FC01 · Resumo da oferta =================
  REG.screen({
    page: 'aluno', key: 'fc01', id: 'FC01', title: 'Resumo da oferta', mtitle: 'Resumo', nav: 'contratacoes', back: 'history', form: true,
    testIds: ['o2'],
    normal: 'Oferta disponível',
    scens: [['mudou', 'Oferta mudou'], ['expirada', 'Expirada'], ['semprazo', 'Sem prazo conhecido'], ['expalt', 'Oferta expirada com alternativa de voltar ao vendedor'],
      ['preco', 'Preço alterado exige nova revisão'], ['dispdesc', 'Disponibilidade desconhecida bloqueia confirmação sem inventar valor']],
    vals: function (ctx) {
      var scn = ctx.scn, ui = ctx.ui;
      var o = A2.offer(ctx.id && /^o\d/.test(ctx.id) ? ctx.id : oid(ctx));
      var q = A2.quote(o.id), rec = q.recurring;
      var off = !o.sale || scn === 'expirada' || scn === 'expalt';
      var unknown = scn === 'dispdesc';
      var prazo = scn === 'semprazo' ? 'Prazo combinado com o treinador' : (o.kind === 'programa' ? '12 meses' : rec ? 'enquanto a assinatura estiver ativa' : o.kind === 'pacote' ? 'Prazo combinado com o treinador' : 'data combinada com Rafael');
      var kv = [
        { k: 'Vendedor', v: 'Rafael Lima · ' + DB.trainer.cref },
        { k: 'Formato', v: A2.fmt(o) },
        { k: 'Para', v: forTxt() },
        { k: 'Cobrança', v: rec ? 'mensal, renova até você cancelar' : 'única' },
        { k: o.kind === 'programa' ? 'Acesso' : 'Prazo', v: prazo },
        { k: 'Início', v: o.accept === 'aceite do treinador' ? 'depois do aceite de Rafael' : 'logo após o pagamento' }
      ];
      var alert = null;
      if (!o.sale && !scn) alert = { cls: 'alert alert--warn', b: 'Oferta fora de venda', t: 'Rafael pausou a venda de ' + o.name + '. Nada é cobrado; veja as ofertas atuais.', btn: 'Voltar ao perfil', fn: function () { GO('PUB04'); } };
      else if (scn === 'mudou') alert = { cls: 'alert alert--warn', b: 'A oferta mudou. Revise o resumo.', t: 'Antes: ' + U.money(Math.round(o.price * 0.9)) + A2.unitTxt(o) + ', termos v' + Math.max(1, o.version - 1) + '. Agora: ' + q.priceTxt + ', termos v' + o.version + '.', btn: 'Consultar de novo', fn: function () { ctx.scenario(''); ctx.toast('Resumo atualizado com a versão atual.'); } };
      else if (scn === 'expirada') alert = { cls: 'alert alert--risk', b: 'Oferta expirada', t: 'Esta versão da oferta não está mais à venda. Nada foi cobrado.', btn: 'Saiba por quê', fn: function () { ctx.ask({ title: 'Por que expirou', text: 'O treinador encerrou ou trocou esta versão da oferta. Volte ao perfil para ver o que está à venda hoje.', ok: 'Voltar ao perfil', onOk: function () { GO('PUB04'); } }); } };
      else if (scn === 'semprazo') alert = { cls: 'alert alert--info', b: 'Sem prazo conhecido', t: 'O prazo é combinado com o treinador depois da compra. Não mostramos uma data que ele não definiu.', btn: '', fn: function () {} };
      else if (scn === 'expalt') alert = { cls: 'alert alert--warn', b: 'Oferta expirada', t: 'Esta versão saiu de venda. Rafael tem outras ofertas abertas logo abaixo.', btn: 'Voltar ao vendedor', fn: function () { GO('PUB04'); } };
      else if (scn === 'preco') alert = { cls: 'alert alert--warn', b: 'Preço alterado exige nova revisão', t: 'O valor passou de ' + U.money(Math.round(o.price * 0.9)) + ' para ' + U.money(o.price) + A2.unitTxt(o) + '. Confirme o novo valor para seguir.', btn: '', fn: function () {} };
      else if (unknown) alert = { cls: 'alert alert--warn', b: 'Disponibilidade desconhecida', t: 'Não conseguimos confirmar vagas e valor agora. Não mostramos um valor inventado.', btn: 'Consultar de novo', fn: function () { ctx.scenario(''); ctx.toast('Disponibilidade confirmada.'); } };
      var needRev = scn === 'preco' && !ui.rev;
      var canGo = !off && !unknown && scn !== 'mudou' && !needRev;
      var cp = DB.a2_checkout.coupon && DB.a2_checkout.coupon.offer === o.id ? DB.a2_checkout.coupon : null;
      var others = DB.ofertas.filter(function (k) { return k.sale && k.id !== o.id; }).map(function (k) {
        return { name: k.name, sub: U.money(k.price) + A2.unitTxt(k) + ' · ' + (k.kind === 'recorrente' ? 'mensal' : 'compra única'), go: function () { GO('FC01', { offer: k.id }); } };
      });
      return {
        name: o.name, by: 'Oferta de Rafael Lima', kv: kv,
        hasAlert: !!alert, alert: alert || { cls: '', b: '', t: '', btn: '', fn: function () {} }, alertHasBtn: !!(alert && alert.btn),
        showPrice: !unknown, noPrice: unknown,
        priceK: rec ? 'Por mês' : 'Total', priceV: U.money(q.today), priceUnit: A2.unitTxt(o).replace(' / ', '/ '), hasUnit: !!A2.unitTxt(o),
        hasOld: q.off > 0, oldTxt: U.money(o.price), discTxt: q.off > 0 ? 'Cupom ' + q.code + ': −' + U.money(q.off) + (rec ? ' na primeira cobrança' : '') : '',
        terms: 'Preço definido pelo treinador. Moeda: real (BRL). Termos v' + o.version + '.',
        isPreco: scn === 'preco', revOn: String(!!ui.rev), revCls: 'check' + (ui.rev ? ' is-on' : ''),
        toggleRev: function () { ctx.setUi({ rev: !ui.rev }); },
        newPrice: 'Revisei o novo valor de ' + U.money(o.price) + A2.unitTxt(o) + '.',
        showCoupon: !off && !unknown, hasCoupon: !!cp, noCoupon: !cp, couponTxt: cp ? cp.code + ' aplicado · ' + cp.off + ' de desconto' : '',
        cup: ui.cup || '', setCup: function (e) { ctx.setUi({ cup: U.val(e), cupErr: '' }); },
        cupKey: function (e) { if (e && e.key === 'Enter') { if (e.preventDefault) e.preventDefault(); apply(); } },
        applyCup: function () { apply(); },
        removeCup: function () { DB.a2_checkout.coupon = null; ctx.toast('Cupom removido.'); },
        cupErr: ui.cupErr || '', hasCupErr: !!ui.cupErr,
        canGo: canGo, cantGo: !canGo,
        goNext: function () { GO('FC02', { offer: o.id }); },
        seeTrainer: function () { GO('PUB04'); },
        others: others, hasOthers: others.length > 0
      };
      function apply() {
        var code = String(ui.cup || '').trim().toUpperCase();
        if (!code) { ctx.setUi({ cupErr: 'Digite o código do cupom.' }); return; }
        var k = DB.cupons.filter(function (c) { return c.code === code; })[0];
        if (!k) { ctx.setUi({ cupErr: 'Cupom não encontrado. Confira o código.' }); return; }
        if (k.status !== 'ativo') { ctx.setUi({ cupErr: 'Este cupom expirou em ' + k.until + '.' }); return; }
        if (k.offer !== o.id) { ctx.setUi({ cupErr: 'Este cupom não vale para esta oferta.' }); return; }
        DB.a2_checkout.coupon = { code: k.code, off: k.off, offer: k.offer };
        ctx.setUi({ cup: '', cupErr: '' }); ctx.toast('Cupom ' + k.code + ' aplicado.');
      }
    }
  });

  // ================= FC02 · Identificação mínima =================
  REG.screen({
    page: 'aluno', key: 'fc02', id: 'FC02', title: 'Identificação', nav: 'contratacoes', back: 'FC01', backParams: offerBack, form: true,
    testIds: ['o2'],
    normal: 'Para mim',
    scens: [['temacesso', 'Já tem acesso'], ['outra', 'Outra conta'], ['emailerr', 'E-mail errado'], ['emaildig', 'E-mail digitado incorretamente'],
      ['existente', 'Acesso já existente'], ['login', 'Retorno de login interrompido']],
    vals: function (ctx) {
      var scn = ctx.scn, ui = ctx.ui;
      var o = A2.offer(ctx.id && /^o\d/.test(ctx.id) ? ctx.id : oid(ctx)), q = A2.quote(o.id);
      var rcp = A2.recipient();
      var def = scn === 'emailerr' ? 'anaemail.com' : scn === 'emaildig' ? 'ana@emial.com' : (DB.a2_checkout.email || EMAIL);
      var email = ui.email !== undefined ? ui.email : def;
      var dup = !rcp ? A2.hasAccess(o.id) : null;
      var has = !!dup || scn === 'temacesso' || scn === 'existente';
      var isRec = o.kind === 'recorrente';
      var err = ui.err || (scn === 'emailerr' && ui.email === undefined ? 'Falta o @ no e-mail. Corrija antes do pagamento.' : '');
      var alert = null;
      if (has) alert = { cls: 'alert alert--info', b: scn === 'existente' ? 'Acesso já existente' : 'Você já tem ' + (isRec ? 'este acompanhamento' : 'este programa'),
        t: (dup ? 'Ativo desde ' + dup.since + '. ' : '') + 'Use o que já tem em vez de comprar de novo.',
        btn: isRec ? 'Gerenciar assinatura' : 'Abrir conteúdo', fn: function () { if (isRec) GO('FC08', { id: dup ? dup.id : 'ct1' }); else GO('ALU06'); },
        btn2: 'Abrir contratação', fn2: function () { GO('H11', { id: dup ? dup.id : '' }); } };
      else if (scn === 'outra') alert = { cls: 'alert alert--warn', b: 'Outra conta', t: 'Você está como Ana Carolina Souza (' + EMAIL + '). Se a compra é para outra conta sua, troque antes de pagar.', btn: 'Comparar', fn: function () { ctx.ask({ title: 'Conta atual', lines: ['Nome: Ana Carolina Souza', 'E-mail: ' + EMAIL, 'Contratações: ' + U.plural(DB.contratacoes.length, 'item', 'itens')], ok: 'Trocar conta', cancel: 'Continuar com esta', onOk: function () { GO('ACC02'); } }); }, btn2: '', fn2: function () {} };
      else if (scn === 'emaildig' && ui.email === undefined) alert = { cls: 'alert alert--warn', b: 'E-mail digitado incorretamente', t: 'Você quis dizer ' + EMAIL + '?', btn: 'Corrigir', fn: function () { ctx.setUi({ email: EMAIL, err: '' }); }, btn2: '', fn2: function () {} };
      else if (scn === 'login') alert = { cls: 'alert alert--warn', b: 'Retorno de login interrompido', t: 'Seu resumo ficou guardado. Entre de novo para continuar de onde parou.', btn: 'Corrigir', fn: function () { ctx.scenario(''); ctx.toast('Sessão retomada. Resumo mantido.'); }, btn2: '', fn2: function () {} };
      return {
        steps: stepsOf(1), name: 'Ana Carolina Souza', ini: 'AC', acct: EMAIL,
        swap: function () { ctx.ask({ title: 'Trocar conta', text: 'Você sai desta conta e entra com outra. O resumo da compra fica guardado.', ok: 'Trocar conta', onOk: function () { GO('ACC02'); } }); },
        hasAlert: !!alert, alert: alert || { cls: '', b: '', t: '', btn: '', fn: function () {}, btn2: '', fn2: function () {} }, alertHasBtn2: !!(alert && alert.btn2),
        forMe: !rcp, forOther: !!rcp,
        segMe: 'seg__it' + (!rcp ? ' is-on' : ''), segOther: 'seg__it' + (rcp ? ' is-on' : ''), meOn: String(!rcp), otherOn: String(!!rcp),
        pickMe: function () { DB.a2_checkout.recipient = null; ctx.refresh(); },
        pickOther: function () { GO('FC10', { offer: o.id }); },
        rcpTxt: rcp ? rcp.name + ' · ' + rcp.email : '',
        email: email, setEmail: function (e) { ctx.setUi({ email: U.val(e), err: '' }); },
        emailCls: 'input' + (err ? ' is-err' : ''), err: err, hasErr: !!err,
        item: o.name, total: U.money(q.today) + A2.unitTxt(o),
        canGo: !has, cantGo: has,
        goNext: function () {
          if (!rcp && !A2.okEmail(email)) { ctx.setUi({ err: 'Confira o e-mail: precisa ter @ e domínio, como ' + EMAIL + '.' }); return; }
          if (!rcp) DB.a2_checkout.email = String(email).trim();
          GO('FC03', { offer: o.id });
        },
        forOtherInstead: function () { GO('FC10', { offer: o.id }); },
        review: function () { GO('FC01', { offer: o.id }); }
      };
    }
  });

  // ================= FC03 · Confirmação antes de pagar =================
  REG.screen({
    page: 'aluno', key: 'fc03', id: 'FC03', title: 'Confirmar pagamento', mtitle: 'Confirmar', nav: 'contratacoes', back: 'FC02', backParams: offerBack, form: true,
    testIds: ['o2'],
    normal: 'Pronto para pagar',
    scens: [['metodo', 'Método indisponível'], ['total', 'Total não calculado'], ['recorrente', 'Recorrente'], ['cotacao', 'Cotação expirada'], ['canal', 'Método indisponível no canal']],
    vals: function (ctx) {
      var scn = ctx.scn, ui = ctx.ui;
      var id = ctx.id && /^o\d/.test(ctx.id) ? ctx.id : oid(ctx);
      if (scn === 'recorrente') id = 'o1';
      var o = A2.offer(id), q = A2.quote(o.id), rec = q.recurring;
      var pixOk = !rec && scn !== 'metodo' && scn !== 'canal';
      var method = pixOk ? (ui.method || DB.a2_checkout.method || 'card') : 'card';
      var noTotal = scn === 'total' || scn === 'cotacao';
      var kv = [{ k: 'Item', v: o.name }, { k: 'Vendedor', v: 'Rafael Lima' }, { k: 'Para', v: A2.recipient() ? A2.recipient().name : 'Ana Carolina Souza' }];
      if (q.off > 0) kv.push({ k: 'Desconto', v: 'Cupom ' + q.code + ' · −' + A2.brl(q.off) });
      var alert = null;
      if (scn === 'metodo') alert = { cls: 'alert alert--info', b: 'Método indisponível', t: 'Pix não está disponível para esta compra agora, por isso saiu da lista. Use o cartão de teste.', btn: 'Consultar de novo', fn: function () { ctx.scenario(''); } };
      else if (scn === 'canal') alert = { cls: 'alert alert--info', b: 'Método indisponível neste canal', t: 'Neste canal só o cartão de teste está habilitado.', btn: 'Tentar de novo', fn: function () { ctx.scenario(''); } };
      else if (scn === 'total') alert = { cls: 'alert alert--risk', b: 'Não foi possível calcular o total', t: 'Sem total confirmado, não seguimos para o pagamento. Nada foi cobrado.', btn: 'Consultar de novo', fn: function () { ctx.scenario(''); ctx.toast('Total calculado.'); } };
      else if (scn === 'cotacao') alert = { cls: 'alert alert--warn', b: 'Cotação expirada', t: 'O valor precisa ser recalculado. A confirmação anterior não vale mais.', btn: 'Corrigir', fn: function () { ctx.scenario(''); ctx.toast('Valor recalculado: ' + A2.brl(q.today) + '.'); } };
      else if (rec && !scn) alert = null;
      var methods = [{ k: 'card', label: 'Cartão de teste' }];
      if (pixOk) methods.push({ k: 'pix', label: 'Pix (demonstração)' });
      return {
        steps: stepsOf(2), kv: kv,
        hasAlert: !!alert, alert: alert || { cls: '', b: '', t: '', btn: '', fn: function () {} },
        showTotal: !noTotal, todayTxt: A2.brl(q.today),
        isRec: rec && !noTotal, nextTxt: q.nextTxt, recNote: 'Cancelar a qualquer momento em Minhas contratações.',
        oneOff: !rec && !noTotal,
        methods: methods.map(function (m) { var on = m.k === method; return { label: m.label, cls: 'seg__it' + (on ? ' is-on' : ''), on: String(on), pick: function () { DB.a2_checkout.method = m.k; ctx.setUi({ method: m.k }); } }; }),
        noPix: !pixOk, noPixTxt: rec ? 'Pix não aparece: cobranças mensais usam só cartão neste canal.' : 'Pix indisponível agora.',
        okOn: String(!!ui.ok), okCls: 'check' + (ui.ok ? ' is-on' : ''), policyTxt: 'Li a política de cancelamento v2 de Rafael Lima.',
        toggleOk: function () { ctx.setUi({ ok: !ui.ok, err: '' }); },
        readPolicy: function () { ctx.ask({ title: 'Política de cancelamento v2', lines: ['Você cancela a renovação quando quiser; o acesso segue até o fim do período pago.', 'Reembolso é um pedido separado, analisado pela política do treinador.', 'Valores em reais (BRL).'], ok: 'Fechar', cancel: false }); },
        err: ui.err || '', hasErr: !!ui.err,
        canPay: !noTotal, payLabel: 'Continuar no provedor',
        pay: function () {
          if (!ui.ok) { ctx.setUi({ err: 'Marque que leu a política de cancelamento para continuar.' }); return; }
          DB.a2_checkout.method = method;
          GO('FC04', { offer: o.id, method: method });
        },
        editId: function () { GO('FC02', { offer: o.id }); },
        reviewOffer: function () { GO('FC01', { offer: o.id }); }
      };
    }
  });

  // ================= FC04 · Checkout do provedor (demonstração) =================
  REG.screen({
    page: 'aluno', key: 'fc04', id: 'FC04', title: 'Pagamento', nav: 'contratacoes', back: 'FC03', backParams: offerBack, form: true,
    testIds: ['o2'],
    normal: 'Ambiente do provedor',
    scens: [['redir', 'Redirecionando'], ['recusa', 'Banco recusou'], ['cancelou', 'Cancelou no provedor'], ['perdido', 'Retorno perdido'],
      ['indisp', 'Provedor indisponível'], ['pix', 'Método assíncrono aguardando quando habilitado']],
    vals: function (ctx) {
      var scn = ctx.scn, ui = ctx.ui;
      var o = A2.offer(ctx.id && /^o\d/.test(ctx.id) ? ctx.id : oid(ctx)), q = A2.quote(o.id);
      var method = scn === 'pix' ? 'pix' : (o.kind === 'recorrente' ? 'card' : (ctx.p.method || DB.a2_checkout.method || 'card'));
      var no = A2.orderNo();
      var res = ui.res || (scn === 'recusa' ? 'recusado' : '');
      var blocked = scn === 'redir' || scn === 'cancelou' || scn === 'indisp' || scn === 'perdido';
      var alert = null;
      if (res === 'recusado') alert = { cls: 'alert alert--risk', b: 'Banco recusou', t: 'Nada foi cobrado. Tente outro método ou tente de novo com o cartão de teste.', btn: 'Tentar outro método', fn: function () { GO('FC03', { offer: o.id }); }, btn2: 'Tentar de novo', fn2: function () { ctx.setUi({ res: '' }); if (scn) ctx.scenario(''); } };
      else if (scn === 'cancelou') alert = { cls: 'alert alert--info', b: 'Você cancelou no provedor', t: 'Voltamos ao resumo sem cobrar nada.', btn: 'Voltar ao resumo', fn: function () { GO('FC03', { offer: o.id }); }, btn2: 'Saiba por quê', fn2: function () { ctx.ask({ title: 'Pagamento cancelado', text: 'Você fechou o pagamento no provedor. O pedido #' + no + ' não foi cobrado e pode ser retomado.', ok: 'Entendi', cancel: false }); } };
      else if (scn === 'perdido') alert = { cls: 'alert alert--warn', b: 'Retorno perdido', t: 'Não recebemos a volta do provedor. Consulte o pedido antes de tentar de novo para não pagar duas vezes.', btn: 'Ver andamento', fn: function () { var ord = A2.createOrder(o.id, method, 'desconhecido'); GO('FC05', { order: ord.id }); }, btn2: '', fn2: function () {} };
      else if (scn === 'indisp') alert = { cls: 'alert alert--risk', b: 'Provedor indisponível', t: 'O provedor de pagamento não respondeu. Nada foi cobrado.', btn: 'Tentar de novo', fn: function () { ctx.scenario(''); }, btn2: '', fn2: function () {} };
      else if (scn === 'pix') alert = { cls: 'alert alert--info', b: 'Aguardando o Pix', t: 'Pedido #' + no + ' guardado. Pode fechar; confirmamos quando o Pix cair.', btn: 'Consultar de novo', fn: function () { ctx.toast('Ainda aguardando o Pix de demonstração.'); }, btn2: '', fn2: function () {} };
      var finish = function (status) { var ord = A2.createOrder(o.id, method, status); GO('FC05', { order: ord.id }); };
      return {
        steps: stepsOf(3), orderNo: '#' + no, total: A2.brl(q.today) + (q.recurring ? ' hoje · depois ' + A2.brl(q.next) + ' / mês' : ''),
        item: o.name + ' · Rafael Lima',
        isRedir: scn === 'redir', showProv: !blocked,
        hasAlert: !!alert, alert: alert || { cls: '', b: '', t: '', btn: '', fn: function () {}, btn2: '', fn2: function () {} }, alertHasBtn2: !!(alert && alert.btn2),
        isCard: method === 'card', isPix: method === 'pix',
        payTxt: 'Pagar ' + A2.brl(q.today),
        pay: function () { finish('pago'); },
        decline: function () { ctx.setUi({ res: 'recusado' }); },
        unknown: function () { finish('desconhecido'); },
        pixCode: '00020126.99COACH.DEMO.PEDIDO' + no + '.NAO-PAGAVEL',
        copyPix: function () { ctx.toast('Código Pix fictício copiado. Ele não paga nada.'); },
        pixPaid: function () { finish('pago'); },
        pixWait: function () { finish('aguardando'); },
        cancel: function () { ctx.toast('Pagamento cancelado no provedor. Nada foi cobrado.'); GO('FC03', { offer: o.id }); },
        seeProgress: function () { var last = DB.a2_pedidos.slice(-1)[0]; GO('FC05', last ? { order: last.id } : { offer: o.id }); },
        backSummary: function () { GO('FC03', { offer: o.id }); }
      };
    }
  });

  // ================= FC05 · Resultado durável da compra =================
  REG.screen({
    page: 'aluno', key: 'fc05', id: 'FC05', title: 'Pedido', nav: 'contratacoes', back: 'H11', form: true,
    normal: 'Pagamento confirmado',
    scens: [['confirmando', 'Confirmando'], ['desconhecido', 'Resultado desconhecido'], ['pago', 'Pago'], ['pendente', 'Marketplace pago/acesso pendente'],
      ['saas', 'SaaS trial ativado ou direito de IA pendente'], ['falha', 'Falha confirmada'], ['expirado', 'Expirado']],
    vals: function (ctx) {
      var scn = ctx.scn;
      var ord = (ctx.p.order && DB.find('a2_pedidos', ctx.p.order)) || null;
      var preview = !ord;
      if (!ord) { var po = A2.offer(oid(ctx)), pq = A2.quote(po.id); ord = { id: '4821', offer: po.id, total: pq.today, method: 'card', at: '26/10 10:42', status: 'pago', ct: '' }; }
      var o = A2.offer(ord.offer);
      var st = ord.status;
      var MAP = { confirmando: 'aguardando', desconhecido: 'desconhecido', pago: 'pago', pendente: 'pago', saas: 'saas', falha: 'recusado', expirado: 'expirado' };
      if (scn) st = MAP[scn];
      var time = String(ord.at).split(' ')[1] || '';
      var acc = ord.ct ? A2.x(ord.ct).access : '';
      var accessPending = scn === 'pendente' || (!scn && (acc === 'preparando' || acc === 'aguardando aceite' || acc === 'convite'));
      var pendLabel = acc === 'aguardando aceite' && !scn ? 'Aguardando aceite de Rafael' : (acc === 'convite' && !scn ? 'Convite enviado a quem recebe' : 'Liberando acesso');
      var T = {
        pago: ['i-check', 'Pagamento confirmado — compra', 'Pedido #' + ord.id + ' · ' + A2.brl(ord.total) + ' · ' + ord.at],
        aguardando: ['i-clock', 'Ainda estamos confirmando', 'Você pode sair e acompanhar depois. Pedido #' + ord.id + ' guardado.'],
        desconhecido: ['i-info', 'Resultado desconhecido', 'Ainda não sabemos se o pagamento passou. Consulte de novo; não pague de novo.'],
        recusado: ['i-x', 'Pagamento não aprovado', 'Falha confirmada pelo provedor. Nada foi cobrado no pedido #' + ord.id + '.'],
        expirado: ['i-clock', 'Pedido expirado', 'O pedido #' + ord.id + ' expirou sem cobrança.'],
        saas: ['i-sparkle', 'Teste ativado — assinatura 99Coach', 'Isto é a assinatura de treinador, não uma compra de aluno. Não cria preparação de aluno nem cobra agora.']
      }[st] || ['i-info', '', ''];
      var tl = [];
      if (st === 'pago') {
        tl.push({ t: 'Pago', s: time, dot: 'tl__dot is-ink', ic: 'ic ic--xs i-check' });
        tl.push({ t: accessPending ? pendLabel : 'Acesso liberado', s: accessPending ? 'em instantes' : 'pronto na sua conta', dot: 'tl__dot ' + (accessPending ? 'is-brand' : 'is-ink'), ic: 'ic ic--xs i-' + (accessPending ? 'refresh' : 'check') });
        tl.push({ t: 'Acesso pronto', s: accessPending ? 'avisamos por e-mail' : '', dot: 'tl__dot' + (accessPending ? '' : ' is-ink'), ic: 'ic ic--xs i-' + (accessPending ? 'clock' : 'check') });
      } else if (st === 'aguardando' || st === 'desconhecido') {
        tl.push({ t: 'Pedido criado', s: ord.at, dot: 'tl__dot is-ink', ic: 'ic ic--xs i-check' });
        tl.push({ t: st === 'aguardando' ? 'Confirmando pagamento' : 'Consultando o provedor', s: 'sem nova cobrança', dot: 'tl__dot is-brand', ic: 'ic ic--xs i-refresh' });
        tl.push({ t: 'Acesso', s: 'depois da confirmação', dot: 'tl__dot', ic: 'ic ic--xs i-clock' });
      }
      var consult = function () {
        if (!preview && !scn && (ord.status === 'aguardando' || ord.status === 'desconhecido')) { A2.fulfil(ord); ctx.toast('Pagamento confirmado no pedido #' + ord.id + '.'); return; }
        ctx.toast('Pedido #' + ord.id + ' consultado. Nenhuma cobrança nova.');
      };
      var primary;
      if (st === 'pago') primary = ['Ver acesso', function () { GO('FC06', ord.ct ? { id: ord.ct } : {}); }];
      else if (st === 'aguardando' || st === 'desconhecido') primary = ['Consultar de novo', consult];
      else if (st === 'recusado') primary = ['Tentar outro método', function () { GO('FC03', { offer: o.id }); }];
      else if (st === 'expirado') primary = ['Revisar oferta', function () { GO('FC01', { offer: o.id }); }];
      else primary = ['Ver minha assinatura', function () { GO('FT11'); }];
      return {
        ic: 'ic ' + T[0], title: T[1], sub: T[2], tl: tl, hasTl: tl.length > 0,
        isPending: st === 'pago' && accessPending, pendingTxt: 'Pagamento confirmado e acesso ainda liberando. Não pague de novo; consulte o andamento.',
        isUnknown: st === 'desconhecido', isSaas: st === 'saas',
        primaryLabel: primary[0], primary: primary[1],
        seeIa: function () { GO('IA06'); },
        myCt: function () { GO('H11', ord.ct ? { id: ord.ct } : {}); },
        support: function () { ctx.ask({ title: 'Falar com suporte', text: 'Abrimos um caso com o pedido #' + ord.id + '. Você não precisa pagar de novo.', ok: 'Abrir caso', onOk: function () { ctx.toast('Caso aberto com o pedido #' + ord.id + '.'); } }); },
        receipt: function () { ctx.toast('Comprovante do pedido #' + ord.id + ' baixado (demonstração).'); },
        hasReceipt: st === 'pago', item: o.name + ' · Rafael Lima', method: ord.method === 'pix' ? 'Pix (demonstração)' : 'Cartão de teste final 4242'
      };
    }
  });

  // ================= FC10 · Presente ou compra para outra pessoa =================
  REG.screen({
    page: 'aluno', key: 'fc10', id: 'FC10', title: 'Compra para outra pessoa', mtitle: 'Presente', nav: 'contratacoes', back: 'FC02', backParams: offerBack, form: true,
    testIds: ['o4'],
    normal: 'Quem recebe',
    scens: [['enviado', 'Convite enviado'], ['naoaceito', 'Não aceito'], ['privacidade', 'Privacidade'], ['contato', 'Contato incorreto'],
      ['expirado', 'Convite expirado'], ['aceite', 'Aceite pendente'], ['capacidade', 'Capacidade não habilitada']],
    vals: function (ctx) {
      var scn = ctx.scn, ui = ctx.ui;
      var o = A2.offer(ctx.id && /^o\d/.test(ctx.id) ? ctx.id : oid(ctx));
      var r = A2.recipient() || { name: '', email: '' };
      var demo = scn && scn !== 'capacidade';
      var name = ui.name !== undefined ? ui.name : (demo ? 'Marina' : r.name);
      var email = ui.email !== undefined ? ui.email : (scn === 'contato' ? 'marina@emailcom' : (demo ? 'marina@email.com' : r.email));
      var first = String(name || '').trim().split(' ')[0] || 'Quem recebe';
      var status = null;
      if (scn === 'enviado') status = { cls: 'alert alert--ok', b: 'Convite enviado', t: 'Aguardando aceite de ' + first + '. Avisamos você quando ela aceitar.', btn: 'Consultar entrega', fn: function () { GO('FC06'); } };
      else if (scn === 'naoaceito') status = { cls: 'alert alert--warn', b: 'Ainda não aceito', t: 'O convite expira em 7 dias, em 02/11. Você pode reenviar.', btn: 'Consultar de novo', fn: function () { ctx.toast('Convite entregue; ainda sem aceite.'); } };
      else if (scn === 'privacidade') status = { cls: 'alert alert--info', b: 'Privacidade', t: 'Quem paga não vê treino, anamnese nem dados de saúde de quem recebe.', btn: 'Continuar', fn: function () { ctx.scenario(''); } };
      else if (scn === 'contato') status = { cls: 'alert alert--risk', b: 'Contato incorreto', t: 'O e-mail parece incompleto. Corrija antes de enviar o convite.', btn: 'Corrigir', fn: function () { ctx.setUi({ email: 'marina@email.com', err: '' }); } };
      else if (scn === 'expirado') status = { cls: 'alert alert--warn', b: 'Convite expirado', t: first + ' não aceitou a tempo. Nada muda no pagamento; reenvie ou corrija o contato.', btn: 'Corrigir', fn: function () { ctx.toast('Novo convite enviado para ' + email + '.'); } };
      else if (scn === 'aceite') status = { cls: 'alert alert--info', b: 'Aceite pendente', t: 'O convite foi entregue. O acesso começa quando ' + first + ' aceitar.', btn: 'Consultar de novo', fn: function () { ctx.toast('Ainda aguardando o aceite.'); } };
      else if (scn === 'capacidade') status = { cls: 'alert alert--warn', b: 'Capacidade não habilitada', t: 'Rafael não habilitou compra para outra pessoa nesta oferta.', btn: 'Saiba por quê', fn: function () { ctx.ask({ title: 'Compra para outra pessoa', text: 'Cada treinador decide se aceita compra de presente. Você pode comprar para você ou indicar o perfil para a pessoa.', ok: 'Comprar para mim', onOk: function () { DB.a2_checkout.recipient = null; GO('FC02', { offer: o.id }); } }); } };
      var err = ui.err || '';
      var blocked = scn === 'capacidade';
      return {
        item: o.name + ' · Rafael Lima', total: U.money(A2.quote(o.id).today) + A2.unitTxt(o),
        hasStatus: !!status, status: status || { cls: '', b: '', t: '', btn: '', fn: function () {} },
        showForm: !blocked,
        name: name, setName: function (e) { ctx.setUi({ name: U.val(e), err: '' }); },
        email: email, setEmail: function (e) { ctx.setUi({ email: U.val(e), err: '' }); },
        emailCls: 'input' + ((err && /e-mail/.test(err)) || scn === 'contato' ? ' is-err' : ''), nameCls: 'input' + (err && /nome/.test(err) ? ' is-err' : ''),
        err: err, hasErr: !!err,
        privacy: first + ' recebe um convite. Você não verá os treinos nem dados de saúde dela.',
        confirm: function () {
          if (!String(name || '').trim()) { ctx.setUi({ err: 'Escreva o nome de quem recebe.' }); return; }
          if (!A2.okEmail(email)) { ctx.setUi({ err: 'Confira o e-mail de quem recebe: precisa ter @ e domínio.' }); return; }
          DB.a2_checkout.recipient = { name: String(name).trim(), email: String(email).trim() };
          GO('FC02', { offer: o.id });
        },
        forMe: function () { DB.a2_checkout.recipient = null; GO('FC02', { offer: o.id }); },
        seeOffer: function () { GO('FC01', { offer: o.id }); }
      };
    }
  });
})();
