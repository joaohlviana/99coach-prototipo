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
      var cap = ui.cap, capOk = cap && !cap.none;
      return {
        pers: [[28, '28 dias'], [90, '90 dias'], [365, '12 meses']].map(function (p) { var on = per === p[0]; return { label: p[1], on: String(on), cls: 'chip' + (on ? ' is-on' : ''), pick: function () { ctx.setUi({ per: p[0] }); } }; }),
        loading: !!ui['busy' + key] && !d.list, err: d.err || '', hasErr: !!d.err, cards: cards, hasCards: cards.length > 0,
        range: d.from ? day(d.from) + ' a ' + day(d.to) : '',
        nosrc: nosrc.join(' · '), hasNosrc: nosrc.length > 0,
        capOk: !!capOk, capTxt: capOk ? (cap.used + cap.held) + ' de ' + cap.limit + ' vagas em uso' : '', capSub: capOk ? 'Plano ' + (cap.plan === 'pro' ? 'Pro' : 'Essencial') + ': ' + U.plural(cap.used, 'aluno ativo ou pausado', 'alunos ativos ou pausados') + (cap.held ? ', ' + U.plural(cap.held, 'vaga reservada por pedido aceito', 'vagas reservadas por pedidos aceitos') : '') + '. ' + (cap.free ? U.plural(cap.free, 'vaga livre', 'vagas livres') + '.' : 'Sem vagas livres: novos pedidos não podem ser aceitos.') : '',
        capFull: !!capOk && !cap.free,
        reload: function () { var s = {}; s[key] = null; s.cap = null; ctx.setUi(s); }
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
