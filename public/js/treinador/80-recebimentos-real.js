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
    return {
      loading: !!ui.loading && !ui.st, isOff: off, offTitle: offT[0], offTxt: offT[1], isOn: !!st.ok,
      stage: stage, testNote: st.real ? 'Cobranças de verdade: o pagamento do aluno é processado pelo Stripe e cai na sua conta do Stripe.' : 'Modo de teste: nenhuma cobrança é de verdade e nenhum dinheiro é movimentado.',
      canActivate: !!st.ok && !ready, activateLabel: ui.busy ? 'Abrindo o Stripe…' : (st.conta ? 'Continuar cadastro no Stripe' : 'Ativar recebimento'),
      activate: function () { if (ui.busy) return; ctx.setUi({ busy: true, err: '' }); C.fn('pagamentos', { acao: 'ativar' }).then(function (r) { var d = (r.ok && r.data) || {}; if (d.ok && d.url) { location.href = d.url; return; } ctx.setUi({ busy: false, err: 'Não foi possível abrir o cadastro do Stripe agora. Toque de novo em instantes; se a sua conta de recebimento já tiver sido criada, ela é reaproveitada.' }); load(); }); },
      err: ui.err || '', hasErr: !!ui.err, reload: load,
      how: 'O aluno paga pelo app depois que você aceita o pedido. A 99coach fica com 5% do valor; a tarifa do Stripe sai da sua parte. O acompanhamento começa quando o pagamento é confirmado.',
      hasRows: rows.length > 0, noRows: !!ui.recv && !rows.length, rows: rows, recvFail: ui.recv === null,
      back: function () { GO('TMENU'); }
    };
  }
});
