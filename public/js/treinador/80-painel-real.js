/* Telas do treinador com dados do banco (99coach-v2), usadas no produto no lugar das versões de exemplo.
   H08R · Insights: indicadores calculados pelo servidor (trainer_metrics) com base, período e "sem base" honesto,
          mais as vagas do plano (my_capacity).
   ACC10R · Credenciais: CREF declarado → pedir conferência (request_cref_review); retirar o perfil (retire_my_profile). */
(function () {
  var C = function () { return window.CONTA; };
  var one = function (r) { return r && r.ok && r.data ? (Array.isArray(r.data) ? r.data[0] : r.data) : null; };
  var pct = function (v) { return (Math.round(v * 1000) / 10).toFixed(1).replace('.', ',').replace(',0', '') + '%'; };
  var dur = function (s) { s = Math.round(s); if (s < 3600) return Math.max(1, Math.round(s / 60)) + ' min'; if (s < 172800) return (Math.round(s / 360) / 10).toString().replace('.', ',') + ' h'; return Math.round(s / 86400) + ' dias'; };
  var money = function (c) { return 'R$ ' + (c / 100).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.'); };
  var day = function (iso) { var d = new Date(iso); return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2); };
  var DEF = {
    TM03: ['Pedidos respondidos no prazo', 'Pedidos enviados no período cujo prazo de resposta já venceu: quantos você aceitou ou recusou dentro do prazo. Cancelados e sem resposta contam na base.'],
    TM04: ['Tempo até responder um pedido', 'Mediana do tempo entre o pedido chegar e você aceitar ou recusar. Pedido sem resposta não vira zero: aparece ao lado.'],
    TM05: ['Primeiro treino em até 7 dias', 'Acompanhamentos que começaram no período (e já passaram 7 dias): em quantos o primeiro treino saiu em até 7 dias.'],
    TM07: ['Preparações para revisar agora', 'Alunos que responderam a preparação e aguardam você revisar.'],
    TM08: ['Continuidade em 28 dias', 'Acompanhamentos que começaram no período e seguiam ativos 28 dias depois.'],
    TM11: ['Receita no período', 'Pagamentos confirmados no período menos reembolsos.']
  };
  var NOSRC = { TM01: 'Visitas ao perfil', TM02: 'Visitas que viraram pedido', TM06: 'Execução do plano', TM09: 'Plano concluído', TM10: 'Evolução de medidas', TM12: 'Uso de assistência' };

  REG.screen({
    page: 'treinador', key: 'insightsreal', id: 'H08R', title: 'Insights', nav: 'insights', wide: true, back: 'TMENU',
    vals: function (ctx) {
      var ui = ctx.ui, per = ui.per || 28, key = 'p' + per;
      if (!ui[key] && !ui['busy' + key]) {
        var s = {}; s['busy' + key] = true; ctx.setUi(s);
        var to = new Date(), from = new Date(to.getTime() - per * 86400000);
        Promise.all([C().rpc('trainer_metrics', { p_from: from.toISOString(), p_to: to.toISOString() }), ui.cap ? Promise.resolve(null) : C().rpc('my_capacity', {})]).then(function (rs) {
          var o = {}; o['busy' + key] = false; o[key] = rs[0].ok ? { list: rs[0].data || [], from: from, to: to } : { err: rs[0].offline ? 'Sem conexão: tente de novo.' : 'O servidor não entregou os indicadores (' + (rs[0].msg || rs[0].status) + ').' };
          if (rs[1]) o.cap = one(rs[1]) || { none: true };
          ctx.setUi(o);
        });
      }
      var d = ui[key] || {}, list = d.list || [];
      var by = {}; list.forEach(function (m) { by[m.metric_id] = m; });
      var cards = Object.keys(DEF).filter(function (k) { return by[k] && by[k].status !== 'unavailable'; }).map(function (k) {
        var m = by[k], b = m.breakdown || {}, ok = m.status === 'ready' || m.status === 'provisional', v = m.value;
        var n = !ok || v == null ? 'Sem base' : (m.unit === 'ratio' ? pct(v) : m.unit === 'duration_seconds' ? dur(v) : m.unit === 'money' ? money(v) : String(v));
        var base = m.unit === 'ratio' ? (m.denominator ? m.numerator + ' de ' + m.denominator : 'nenhum caso no período') : m.unit === 'duration_seconds' ? U.plural(m.numerator || 0, 'pedido respondido', 'pedidos respondidos') : (m.unit === 'money' ? U.plural(m.numerator || 0, 'pagamento', 'pagamentos') : 'agora');
        var extra = [];
        if (!ok && b.amostra_minima) extra.push('Precisa de pelo menos ' + b.amostra_minima + ' casos para mostrar: com menos seria ruído.');
        if (b.p90 != null) extra.push('9 em cada 10 respondidos em até ' + dur(b.p90) + '.');
        if (b.sem_resposta) extra.push(U.plural(b.sem_resposta, 'pedido sem resposta', 'pedidos sem resposta') + '.');
        if (b.preparacao_pendente) extra.push(U.plural(b.preparacao_pendente, 'aluno ainda em preparação', 'alunos ainda em preparação') + '.');
        return { l: DEF[k][0], n: n, base: base, extra: extra.join(' '), hasExtra: !!extra.length, def: function () { ctx.ask({ title: DEF[k][0], lines: [DEF[k][1], 'Período: ' + day(m.period.from) + ' a ' + day(m.period.to) + '. Calculado às ' + new Date(m.computed_at).toTimeString().slice(0, 5) + '.'], ok: 'Entendi', cancel: false }); } };
      });
      var nosrc = Object.keys(NOSRC).filter(function (k) { return !by[k] || by[k].status === 'unavailable'; }).map(function (k) { return NOSRC[k]; });
      if (by.TM11 && by.TM11.status === 'unavailable') nosrc.push('Receita (pagamentos pelo 99coach ainda em modo de teste)');
      // funil: aberturas do perfil → pedidos recebidos → aceitos → acompanhamentos iniciados, no mesmo período
      var fk = 'fn' + per;
      if (!ui[fk] && !ui['busy' + fk]) {
        var b0 = {}; b0['busy' + fk] = true; ctx.setUi(b0);
        var since = new Date(Date.now() - per * 86400000).toISOString(), me = (C().user() || {}).id;
        C().db('GET', 'trainers?select=id&user_id=eq.' + encodeURIComponent(me || '')).then(function (t) {
          var tid = t.ok && t.data && t.data[0] && t.data[0].id; if (!tid) { var e0 = {}; e0[fk] = { none: true }; e0['busy' + fk] = false; return ctx.setUi(e0); }
          Promise.all([C().rpc('my_profile_views', { p_days: per }), C().db('GET', 'requests?select=status&trainer_id=eq.' + tid + '&created_at=gte.' + encodeURIComponent(since) + '&limit=1000'), C().db('GET', 'links?select=id&trainer_id=eq.' + tid + '&created_at=gte.' + encodeURIComponent(since) + '&limit=1000')]).then(function (x) {
            var v = one(x[0]), o = {}; o['busy' + fk] = false;
            o[fk] = x[1].ok && x[2].ok ? { views: v && v.views != null ? v.views : null, first: v && v.first, reqs: (x[1].data || []).length, acc: (x[1].data || []).filter(function (r) { return r.status === 'aceito'; }).length, links: (x[2].data || []).length } : { none: true };
            ctx.setUi(o);
          });
        });
      }
      var fn = ui[fk] && !ui[fk].none ? ui[fk] : null, top = fn ? Math.max(fn.views || 0, fn.reqs, fn.links, 1) : 1;
      var bar = function (n) { return 'width:' + Math.max(2, Math.round((n || 0) / top * 100)) + '%'; };
      var funnel = fn ? [
        { n: fn.views == null ? 'Sem base' : String(fn.views), l: 'Aberturas do perfil', w: bar(fn.views), x: fn.views == null ? 'não medido' : 'aberturas da página pública' },
        { n: String(fn.reqs), l: 'Pedidos recebidos', w: bar(fn.reqs), x: 'pedidos de acompanhamento' },
        { n: String(fn.acc), l: 'Pedidos aceitos', w: bar(fn.acc), x: 'aceitos por você' },
        { n: String(fn.links), l: 'Acompanhamentos iniciados', w: bar(fn.links), x: 'inclui os que vieram por convite' }
      ] : [];
      var cap = ui.cap, capOk = cap && !cap.none;
      return {
        pers: [[28, '28 dias'], [90, '90 dias'], [365, '12 meses']].map(function (p) { var on = per === p[0]; return { label: p[1], on: String(on), cls: 'chip' + (on ? ' is-on' : ''), pick: function () { ctx.setUi({ per: p[0] }); } }; }),
        loading: !!ui['busy' + key] && !d.list, err: d.err || '', hasErr: !!d.err, cards: cards, hasCards: cards.length > 0,
        range: d.from ? day(d.from) + ' a ' + day(d.to) : '',
        funnel: funnel, hasFunnel: funnel.length > 0, funnelNote: 'Aberturas contam visitas à página, não pessoas, e começaram a ser medidas em 14/11/2026. Um pedido pode vir de fora do perfil; por isso não calculamos taxa entre as etapas.',
        nosrc: nosrc.join(' · '), hasNosrc: nosrc.length > 0,
        capOk: !!capOk, capTxt: capOk ? (cap.used + cap.held) + ' de ' + cap.limit + ' vagas em uso' : '', capSub: capOk ? 'Plano ' + (cap.plan === 'pro' ? 'Pro' : 'Essencial') + ': ' + U.plural(cap.used, 'aluno ativo ou pausado', 'alunos ativos ou pausados') + (cap.held ? ', ' + U.plural(cap.held, 'vaga reservada por pedido aceito', 'vagas reservadas por pedidos aceitos') : '') + '. ' + (cap.free ? U.plural(cap.free, 'vaga livre', 'vagas livres') + '.' : 'Sem vagas livres: novos pedidos não podem ser aceitos.') : '',
        capFull: !!capOk && !cap.free,
        reload: function () { var s = {}; s[key] = null; s.cap = null; ctx.setUi(s); }
      };
    }
  });

  // ASSIN · Minha assinatura: plano, vagas e comissão vindos do servidor; assinar, cancelar e retomar o Pro pelo Stripe.
  // Separado do que o treinador recebe dos alunos.
  REG.screen({
    page: 'treinador', key: 'assinatura', id: 'ASSIN', title: 'Minha assinatura', nav: 'assinatura', back: 'TMENU',
    vals: function (ctx) {
      var ui = ctx.ui, d2 = function (iso) { return iso ? new Date(iso).toLocaleDateString('pt-BR') : ''; };
      var load = function () {
        ctx.setUi({ busy: true, cap: null, sub: null });
        C().rpc('my_capacity', {}).then(function (r) { ctx.setUi({ busy: false, cap: one(r) || { none: true } }); });
        C().fn('pagamentos', { acao: 'pro_estado' }).then(function (r) { ctx.setUi({ sub: r.ok && r.data ? r.data : { ok: false, motivo: r.offline ? 'offline' : 'falhou' } }); });
      };
      if (!ui.cap && !ui.busy) load();
      var cap = ui.cap && !ui.cap.none ? ui.cap : null, sub = ui.sub || null, subOk = !!sub && sub.ok === true;
      var pro = subOk ? sub.plano === 'pro' : (!!cap && cap.plan === 'pro');
      var act = function (acao, extra, done) { return function () {
        if (ui.acting) return; ctx.setUi({ acting: acao, aerr: '' });
        C().fn('pagamentos', Object.assign({ acao: acao }, extra || {})).then(function (r) {
          var x = (r.ok && r.data) || {};
          if (x.ok && x.url) { location.href = x.url; return; }
          if (x.ok) { ctx.setUi({ acting: '', sub: x, cap: null, busy: false }); ctx.toast(done); return; }
          var M = { ja_assinante: 'Você já tem o Pro ativo.', sem_assinatura: 'Não há assinatura ativa para alterar.', pagamentos_nao_configurados: 'A cobrança do Pro ainda não está ligada no servidor.', chave_de_outro_ambiente: 'A configuração de pagamento do servidor não confere com a do banco.', stripe_recusou: 'O Stripe não aceitou o pedido agora' + (x.detalhe ? ' (' + x.detalhe + ')' : '') + '. Nada foi cobrado.' };
          ctx.setUi({ acting: '', aerr: M[x.motivo] || 'Não foi possível agora. Nada foi cobrado. Tente de novo em instantes.' });
        });
      }; };
      var ST = { trialing: 'Em teste gratuito', active: 'Ativo', past_due: 'Pagamento pendente', canceled: 'Cancelado', unpaid: 'Não pago', incomplete: 'Pagamento não concluído', incomplete_expired: 'Pagamento não concluído', paused: 'Pausado' };
      var lines = [];
      if (subOk && sub.status) {
        if (sub.status === 'trialing' && sub.testeAte) lines.push('Teste gratuito até ' + d2(sub.testeAte) + '. A primeira cobrança acontece nessa data, se você não cancelar antes.');
        if (sub.status === 'past_due') lines.push('A última cobrança não passou. O Stripe tenta de novo; atualize o cartão para não perder o Pro.');
        if (pro && sub.periodoAte) lines.push(sub.cancelaNoFim ? 'Renovação desligada: o Pro vale até ' + d2(sub.periodoAte) + ' e depois a conta volta ao Essencial. Seus alunos continuam.' : (sub.status === 'trialing' ? '' : 'Próxima cobrança em ' + d2(sub.periodoAte) + '.'));
      }
      return {
        loading: !ui.cap, fail: !!ui.cap && !cap, ok: !!cap,
        plan: pro ? 'Pro' : 'Essencial', price: pro ? (subOk && sub.ciclo === 'year' ? 'R$ 990 por ano' : 'R$ 99 por mês') : 'Sem mensalidade',
        badge: subOk && sub.status && pro ? (ST[sub.status] || sub.status) : '', hasBadge: !!(subOk && sub.status && pro),
        rows: cap ? [
          'Até ' + U.plural(cap.limit, 'aluno ativo', 'alunos ativos') + ' ao mesmo tempo',
          (cap.used + cap.held) + ' de ' + cap.limit + ' vagas em uso' + (cap.held ? ' (' + U.plural(cap.held, 'reservada por pedido aceito', 'reservadas por pedidos aceitos') + ')' : ''),
          'Comissão de 5% por venda feita pelo 99coach, igual em qualquer plano',
          'O plano não compra posição na busca, selo nem garantia de clientes'
        ].map(function (x) { return { x: x }; }) : [],
        lines: lines.filter(Boolean).map(function (x) { return { x: x }; }), hasLines: lines.filter(Boolean).length > 0,
        full: !!cap && !cap.free,
        subFail: !!sub && !subOk, subWait: !sub,
        canBuy: subOk && !pro, buyM: act('pro_assinar', { ciclo: 'month' }), buyY: act('pro_assinar', { ciclo: 'year' }),
        buyMLabel: ui.acting === 'pro_assinar' ? 'Abrindo o pagamento…' : 'Assinar mensal · R$ 99',
        trialNote: subOk && !sub.status ? '7 dias de teste gratuito na primeira assinatura. Cancele quando quiser.' : 'Cancele quando quiser.',
        canCancel: subOk && pro && !sub.cancelaNoFim, cancel: function () { ctx.ask({ title: 'Cancelar a renovação do Pro?', lines: ['O Pro continua valendo até ' + (d2(sub.periodoAte) || 'o fim do período') + '.', 'Depois disso a conta volta ao Essencial (até 3 alunos ativos). Nenhum aluno é removido: só não dá para aceitar novos acima do limite.'], ok: 'Cancelar renovação', danger: true, onOk: act('pro_cancelar', null, 'Renovação cancelada. O Pro vale até o fim do período.') }); },
        canResume: subOk && pro && !!sub.cancelaNoFim, resume: act('pro_retomar', null, 'Renovação religada.'),
        aerr: ui.aerr || '', hasAerr: !!ui.aerr,
        real: subOk ? (sub.real ? 'Cobrança de verdade, processada pelo Stripe.' : 'Modo de teste: nenhuma cobrança é de verdade.') : '',
        goMoney: function () { GO('H09R'); }, goHelp: function () { GO('PUB11'); }, reload: load
      };
    }
  });

  var CST = { nao_informado: 'Não informado', informado: 'Informado por você', em_conferencia: 'Em conferência pela equipe', verificado: 'Verificado', divergente: 'Não conferiu', vencido: 'Vencido' };
  REG.screen({
    page: 'treinador', key: 'credreal', id: 'ACC10R', title: 'Credenciais', nav: 'conta', back: 'TMENU',
    vals: function (ctx) {
      var ui = ctx.ui, uid = (C().user() || {}).id;
      if (!ui.t && !ui.loading) {
        ctx.setUi({ loading: true });
        C().db('GET', 'trainers?select=slug,name,cref,cref_status,cref_note,status&user_id=eq.' + encodeURIComponent(uid || '')).then(function (r) { ctx.setUi({ loading: false, t: one(r) || { none: true }, loadErr: !r.ok }); });
      }
      var t = ui.t || {}, has = !!ui.t && !t.none, cref = String(t.cref || '').trim();
      var st = t.cref_status || (cref ? 'informado' : 'nao_informado');
      var ask = function () {
        if (ui.busy) return; ctx.setUi({ busy: true, err: '' });
        var ik = 'cref:' + uid + ':' + cref; C().rpc('request_cref_review', { p_note: String(ui.note || '').trim() || null, p_idem: C().intent(ik) }).then(function (r) { if (r.ok) C().settle(ik)(r);
          var d = one(r);
          if (!r.ok || !d) return ctx.setUi({ busy: false, err: /cref_nao_informado/.test(r.msg || '') ? 'Informe o número do CREF no perfil antes de pedir a conferência.' : 'Não foi possível pedir agora: ' + (r.msg || r.status || 'sem conexão') + '.' });
          ctx.setUi({ busy: false, t: Object.assign({}, t, { cref_status: d.status }) }); ctx.toast(d.status === 'verificado' ? 'Seu CREF já está verificado.' : 'Pedido de conferência enviado às ' + U.now() + '.');
        });
      };
      var retire = function () {
        ctx.ask({ title: 'Retirar seu perfil?', lines: ['Seu perfil sai da busca e do endereço público. Novos pedidos deixam de chegar.', 'Seus alunos atuais e o histórico continuam. Para voltar a aparecer, publique de novo pelo perfil.'], ok: 'Retirar perfil', onOk: function () {
          ctx.setUi({ rbusy: true });
          var rk = 'retire:' + uid; C().rpc('retire_my_profile', { p_idem: C().intent(rk) }).then(C().settle(rk)).then(function (r) {
            var d = one(r);
            ctx.setUi({ rbusy: false, t: r.ok && d ? Object.assign({}, t, { status: d.status }) : t, rerr: r.ok ? '' : 'Não foi possível retirar agora: ' + (r.msg || r.status || 'sem conexão') + '.' });
            if (r.ok) ctx.toast('Perfil retirado da busca às ' + U.now() + '.');
          });
        } });
      };
      return {
        loading: !ui.t, none: !!t.none, has: has, name: t.name || '',
        cref: cref || 'Não informado', st: CST[st] || st, stCls: st === 'verificado' ? 'badge badge--ok' : (st === 'em_conferencia' ? 'badge badge--warn' : (st === 'divergente' || st === 'vencido' ? 'badge badge--risk' : 'badge badge--plain')),
        note: t.cref_note || '', hasNote: !!t.cref_note,
        canAsk: has && !!cref && ['informado', 'divergente', 'vencido', 'nao_informado'].indexOf(st) >= 0, noCref: has && !cref,
        waiting: st === 'em_conferencia', verified: st === 'verificado',
        ev: ui.note || '', setEv: function (e) { ctx.setUi({ note: U.val(e) }); },
        ask: ask, askLabel: ui.busy ? 'Enviando…' : 'Pedir conferência do CREF', err: ui.err || '', hasErr: !!ui.err,
        edit: function () { GO('ACC06'); },
        live: has && t.status === 'publicado', retired: has && t.status === 'retirado', retire: retire, retireLabel: ui.rbusy ? 'Retirando…' : 'Retirar meu perfil da busca', rerr: ui.rerr || '', hasRerr: !!ui.rerr
      };
    }
  });
})();
