/* H09R · Recebimentos (conta real). Cobrança pelo Stripe: o treinador ativa a própria conta de recebimento,
   o aluno paga o pedido aceito e a 99coach fica com 5%. Sem a configuração do servidor, a tela diz que não está ligado
   e não pede dado nenhum. Valores mostrados vêm do banco (recebíveis), nunca de exemplo. */
REG.screen({
  page: 'treinador', key: 'recebimentosreal', id: 'H09R', title: 'Recebimentos', nav: 'recebimentos', wide: true, back: 'TMENU',
  vals: function (ctx) {
    var C = window.CONTA, ui = ctx.ui;
    var money = function (c) { return c == null ? 'a confirmar' : 'R$ ' + (c / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }); };
    var load = function () {
      ctx.setUi({ asked: true, loading: true });
      C.fn('pagamentos', { acao: 'estado' }).then(function (r) { ctx.setUi({ loading: false, st: r.ok ? (r.data || {}) : { ok: false, motivo: r.offline ? 'offline' : 'falhou' } }); });
      C.db('GET', 'receivables?select=order_id,gross_cents,provider_fee_cents,platform_fee_cents,net_cents,refunded_cents,status,available_on,updated_at,payout_status,payout_ref&order=updated_at.desc&limit=50').then(function (r) { ctx.setUi({ recv: r.ok ? (r.data || []) : null }); });
    };
    if (C && C.session() && !ui.asked) load();
    var st = ui.st || {}, off = st.ok === false;
    var OFF = { pagamentos_nao_configurados: ['Recebimentos pelo app ainda não estão ligados', 'A cobrança pelo app depende de uma configuração que ainda não foi feita. Nada é cobrado nem pedido a você por enquanto.'],
      chave_de_outro_ambiente: ['Recebimentos pelo app ainda não estão ligados', 'A configuração de pagamento do servidor não confere com a do banco. Nada é cobrado até isso ser corrigido.'],
      sem_perfil_de_treinador: ['Complete seu cadastro de treinador', 'O recebimento é ligado ao seu perfil de treinador.'],
      offline: ['Sem conexão', 'Não deu para consultar seus recebimentos agora.'] };
    var offT = OFF[st.motivo] || ['Não foi possível consultar agora', 'Tente de novo em instantes. Nada mudou na sua conta.'];
    var ready = st.ok && st.conta && st.cobrancas;
    var stage = !st.ok ? '' : !st.conta ? 'Você ainda não ativou o recebimento.' : ready ? 'Recebimento ativo: alunos podem pagar pelo app.' + (st.repasses ? '' : ' O repasse para o seu banco ainda depende de dados pendentes no Stripe.') : st.cadastroEnviado ? 'Cadastro enviado ao Stripe, em análise.' + (st.pendencias ? ' Faltam ' + st.pendencias + ' informações.' : '') : 'Cadastro no Stripe começado e não terminado.';
    var ST = { pago: 'Pago · tarifa a confirmar', em_liberacao: 'Em liberação', liberado: 'Liberado', enviado_ao_banco: 'Enviado ao banco', recebido: 'Recebido no banco', estornado: 'Reembolsado' };
    var PAY = { paid: 'Repasse recebido no seu banco', in_transit: 'Repasse a caminho do seu banco', pending: 'Repasse agendado', failed: 'Repasse falhou: confira os dados bancários no Stripe', canceled: 'Repasse cancelado' };
    var refund = function (x) { return function () {
      ctx.ask({ title: 'Reembolsar ' + money(x.gross_cents) + '?', lines: ['O valor inteiro volta para o aluno pelo mesmo meio de pagamento.', 'A comissão do 99coach também é devolvida. A tarifa do Stripe pode não voltar.', 'Não dá para desfazer um reembolso.'], ok: 'Reembolsar', danger: true, onOk: function () {
        ctx.setUi({ rfBusy: x.order_id });
        C.fn('pagamentos', { acao: 'reembolsar', pedido: x.order_id }).then(function (r) {
          var d = (r.ok && r.data) || {};
          ctx.setUi({ rfBusy: '' });
          ctx.toast(d.ok ? 'Reembolso pedido ao Stripe. O extrato atualiza quando o Stripe confirmar.' : ({ ja_reembolsado: 'Este pagamento já foi reembolsado.', sem_cobranca: 'Este pagamento não tem cobrança confirmada para reembolsar.' }[d.motivo] || 'Não foi possível reembolsar agora. Nada foi devolvido.'));
          if (d.ok) setTimeout(load, 4000);
        });
      } });
    }; };
    var rows = (ui.recv || []).map(function (x) { var full = (x.refunded_cents || 0) >= (x.gross_cents || 0);
      return { t: money(x.gross_cents) + ' pago pelo aluno', x: 'Comissão 99coach ' + money(x.platform_fee_cents) + ' · tarifa do Stripe ' + money(x.provider_fee_cents) + ' · líquido ' + money(x.net_cents) + (x.refunded_cents ? ' · reembolsado ' + money(x.refunded_cents) : ''), s: (ST[x.status] || x.status) + (x.status === 'em_liberacao' && x.available_on ? ' até ' + new Date(x.available_on).toLocaleDateString('pt-BR') : ''),
        pay: x.payout_status ? (PAY[x.payout_status] || 'Repasse: ' + x.payout_status) : (x.status === 'estornado' ? '' : 'Repasse ao banco ainda não informado pelo Stripe'),
        canRefund: !full && x.status !== 'estornado' && ui.rfBusy !== x.order_id, refund: refund(x) }; });
    // cupons de desconto (percentual) que o aluno informa antes de pagar
    var loadCp = function () {
      C.db('GET', 'trainers?select=id&user_id=eq.' + encodeURIComponent((C.user() || {}).id || '')).then(function (t) {
        var tid = t.ok && t.data && t.data[0] && t.data[0].id; if (!tid) return ctx.setUi({ cps: null });
        C.db('GET', 'coupons?select=id,code,percent_off,max_uses,used,expires_at,active&trainer_id=eq.' + tid + '&order=created_at.desc').then(function (r) { ctx.setUi({ cpTid: tid, cps: r.ok ? (r.data || []) : null }); });
      });
    };
    if (C && C.session() && !ui.cpAsked) { ctx.setUi({ cpAsked: true }); loadCp(); }
    var cf = ui.cf || {}, cset = function (k) { return function (e) { var n = Object.assign({}, cf); n[k] = U.val(e); ctx.setUi({ cf: n, cErr: '' }); }; };
    var addCp = function () {
      var code = String(cf.code || '').toUpperCase().replace(/[^A-Z0-9]/g, ''), pct = parseInt(cf.pct, 10), max = String(cf.max || '').trim() === '' ? null : parseInt(cf.max, 10), until = String(cf.until || '');
      if (code.length < 4 || code.length > 20) return ctx.setUi({ cErr: 'O código precisa ter de 4 a 20 letras ou números.' });
      if (!(pct >= 1 && pct <= 90)) return ctx.setUi({ cErr: 'O desconto vai de 1% a 90%.' });
      if (max !== null && !(max > 0)) return ctx.setUi({ cErr: 'O limite de usos precisa ser maior que zero (ou fique em branco para não limitar).' });
      if (until && until < new Date().toISOString().slice(0, 10)) return ctx.setUi({ cErr: 'A validade precisa ser de hoje em diante.' });
      if (!ui.cpTid || ui.cBusy) return; ctx.setUi({ cBusy: true, cErr: '' });
      C.db('POST', 'coupons', { trainer_id: ui.cpTid, code: code, percent_off: pct, max_uses: max, expires_at: until ? until + 'T23:59:59-03:00' : null }).then(function (r) {
        if (!r.ok) return ctx.setUi({ cBusy: false, cErr: r.status === 409 ? 'Você já tem um cupom com esse código.' : (r.offline ? 'Sem conexão: o cupom não foi criado.' : 'Não foi possível criar o cupom agora.') });
        ctx.setUi({ cBusy: false, cf: {}, cOpen: false }); ctx.toast('Cupom ' + code + ' criado.'); loadCp();
      });
    };
    var cps = (ui.cps || []).map(function (c) { var exp = c.expires_at && new Date(c.expires_at).getTime() < Date.now(), full = c.max_uses != null && c.used >= c.max_uses, on = c.active && !exp && !full;
      return { code: c.code, x: c.percent_off + '% de desconto · ' + (c.max_uses != null ? c.used + ' de ' + c.max_uses + ' usos' : U.plural(c.used, 'uso', 'usos')) + (c.expires_at ? ' · vale até ' + new Date(c.expires_at).toLocaleDateString('pt-BR') : ' · sem validade'),
        st: on ? 'Ativo' : (!c.active ? 'Desativado' : exp ? 'Vencido' : 'Esgotado'), stCls: on ? 'badge badge--ok' : 'badge badge--plain', canOff: c.active, canOn: !c.active,
        toggle: function () { C.db('PATCH', 'coupons?id=eq.' + c.id, { active: !c.active }).then(function (r) { ctx.toast(r.ok ? (c.active ? 'Cupom desativado.' : 'Cupom ativado de novo.') : 'Não foi possível agora.'); loadCp(); }); } }; });
    return {
      loading: !!ui.loading && !ui.st, isOff: off, offTitle: offT[0], offTxt: offT[1], isOn: !!st.ok,
      stage: stage, testNote: st.real ? 'Cobranças de verdade: o pagamento do aluno é processado pelo Stripe e cai na sua conta do Stripe.' : 'Modo de teste: nenhuma cobrança é de verdade e nenhum dinheiro é movimentado.',
      canActivate: !!st.ok && !ready, activateLabel: ui.busy ? 'Abrindo o Stripe…' : (st.conta ? 'Continuar cadastro no Stripe' : 'Ativar recebimento'),
      activate: function () { if (ui.busy) return; ctx.setUi({ busy: true, err: '' }); C.fn('pagamentos', { acao: 'ativar' }).then(function (r) { var d = (r.ok && r.data) || {}; if (d.ok && d.url) { location.href = d.url; return; } ctx.setUi({ busy: false, err: 'Não foi possível abrir o cadastro do Stripe agora. Toque de novo em instantes; se a sua conta de recebimento já tiver sido criada, ela é reaproveitada.' }); load(); }); },
      pixNote: ready ? (st.pix ? 'Pix ligado: seus alunos podem pagar com cartão, boleto ou Pix.' : 'Pix desligado: para aceitar Pix, ative-o na sua conta do Stripe, em Configurações → Formas de pagamento. Cartão e boleto já funcionam.') : '', hasPixNote: !!ready,
      cps: cps, hasCps: cps.length > 0, noCps: Array.isArray(ui.cps) && !cps.length, cpFail: ui.cps === null, cOpen: !!ui.cOpen, cClosed: !ui.cOpen, cStart: function () { ctx.setUi({ cOpen: true, cf: {}, cErr: '' }); }, cCancel: function () { ctx.setUi({ cOpen: false, cErr: '' }); },
      cCode: cf.code || '', cPct: cf.pct || '', cMax: cf.max || '', cUntil: cf.until || '', cSetCode: cset('code'), cSetPct: cset('pct'), cSetMax: cset('max'), cSetUntil: cset('until'), cAdd: addCp, cLabel: ui.cBusy ? 'Criando…' : 'Criar cupom', cErr: ui.cErr || '', hasCErr: !!ui.cErr,
      err: ui.err || '', hasErr: !!ui.err, reload: load,
      how: 'O aluno paga pelo app depois que você aceita o pedido. A 99coach fica com 5% do valor; a tarifa do Stripe sai da sua parte. O acompanhamento começa quando o pagamento é confirmado.',
      hasRows: rows.length > 0, noRows: !!ui.recv && !rows.length, rows: rows, recvFail: ui.recv === null,
      back: function () { GO('TMENU'); }
    };
  }
});
