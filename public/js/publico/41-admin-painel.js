/* Painel da administração (equipe 99coach): visão geral, contas, avaliações, pagamentos e exclusões de conta.
   Tudo vem do servidor e exige papel de administração com a segunda etapa confirmada. Só números reais: sem dado, a tela
   diz que não há. Nada aqui mostra texto de mensagem, resposta de formulário ou registro de treino. */
(function () {
  var U = window.U;
  var C = function () { return window.CONTA; };
  var when = function (d) { return d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'; };
  var day = function (d) { return d ? new Date(d).toLocaleDateString('pt-BR') : '—'; };
  var money = function (c) { return c == null ? 'a confirmar' : 'R$ ' + (Number(c) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }); };
  var n = function (v) { return Number(v || 0).toLocaleString('pt-BR'); };
  var TABS = [['resumo', 'Visão geral'], ['metricas', 'Métricas'], ['contas', 'Contas'], ['avaliacoes', 'Avaliações'], ['pagamentos', 'Pagamentos'], ['exclusoes', 'Exclusões'], ['saude', 'Saúde do sistema'], ['filas', 'Filas de pedidos']];
  var FN = { resumo: ['admin_overview', {}], avaliacoes: ['admin_reviews', { p_limit: 100 }], pagamentos: ['admin_payments', { p_limit: 100 }], exclusoes: ['admin_deletions', { p_limit: 100 }], saude: ['admin_health', {}] };

  window.ADMP = function (ctx) {
    var ui = ctx.ui, tab = ui.pnTab || 'resumo', data = ui.pnData || {}, busy = ui.pnBusy || {}, errs = ui.pnErr || {};
    var put = function (k, o) { var x = {}; x[k] = Object.assign({}, ui[k] || {}, o); ctx.setUi(x); };
    var load = function (t, force, dias) {
      if (t === 'filas' || (busy[t] && !force)) return;
      var call = t === 'contas' ? ['admin_users', { p_q: String(ui.pnQ || '').trim() || null, p_limit: 100 }] : t === 'metricas' ? ['admin_metrics', { p_days: dias || ui.pnPer || 28 }] : FN[t];
      var b = Object.assign({}, ui.pnBusy || {}); b[t] = true; ctx.setUi({ pnBusy: b });
      C().rpc(call[0], call[1]).then(function (r) {
        // o estado dentro do retorno pode estar velho: guarda o resultado num lugar estável e copia para a tela
        window.__pn = window.__pn || { d: {}, e: {}, b: {} };
        window.__pn.b[t] = false; window.__pn.e[t] = r.ok ? '' : (r.offline ? 'Sem conexão.' : 'O servidor não respondeu a esta consulta (' + (r.msg || r.status) + ').');
        if (r.ok) window.__pn.d[t] = r.data;
        ctx.setUi({ pnData: Object.assign({}, window.__pn.d), pnErr: Object.assign({}, window.__pn.e), pnBusy: Object.assign({}, window.__pn.b), pnAt: new Date().toTimeString().slice(0, 5) });
      });
    };
    if (tab !== 'filas' && data[tab] === undefined && !busy[tab] && !errs[tab]) setTimeout(function () { load(tab); }, 0);
    var o = data.resumo || {}, pay = data.pagamentos || {};
    var kpi = function (label, value, sub) { return { label: label, value: value, sub: sub || '', hasSub: !!sub }; };
    var hide = function (id, hidden, who) {
      return function () {
        ctx.ask({ title: hidden ? 'Ocultar esta avaliação?' : 'Voltar a mostrar esta avaliação?', lines: [hidden ? 'Ela sai do perfil público de ' + who + ' e da média. Quem escreveu continua vendo a própria avaliação, marcada como ocultada.' : 'Ela volta a aparecer no perfil público de ' + who + ' e a contar na média.'], ok: hidden ? 'Ocultar' : 'Mostrar de novo', cancel: 'Cancelar', danger: hidden, onOk: function () {
          C().rpc('admin_set_review', { p_review: id, p_hidden: hidden }).then(function (r) { if (!r.ok) return ctx.toast('Não foi possível: ' + (r.msg || r.status) + '.'); ctx.toast(hidden ? 'Avaliação ocultada.' : 'Avaliação visível de novo.'); load('avaliacoes', true); load('resumo', true); });
        } });
      };
    };
    var block = function (u) {
      return function () {
        var reason = String((ui.pnWhy || {})[u.id] || '').trim();
        if (!u.bloqueada && reason.length < 5) return put('pnWhyErr', (function () { var x = {}; x[u.id] = 'Escreva o motivo: fica no registro da decisão.'; return x; })());
        ctx.ask({ title: (u.bloqueada ? 'Desbloquear ' : 'Bloquear ') + (u.nome || 'esta conta') + '?', lines: [u.bloqueada ? 'A conta volta a entrar e a usar o app.' : 'A conta deixa de entrar e de enviar mensagens ou pedidos. Os dados não são apagados.'], ok: u.bloqueada ? 'Desbloquear' : 'Bloquear', cancel: 'Cancelar', danger: !u.bloqueada, onOk: function () {
          C().rpc('admin_set_block', { p_user: u.id, p_blocked: !u.bloqueada, p_reason: reason || 'desbloqueio pela administração', p_idem: 'bloq:' + u.id + ':' + (!u.bloqueada ? 1 : 0) + ':' + reason.length + ':' + Math.floor(Date.now() / 60000) }).then(function (r) { if (!r.ok) return ctx.toast('Não foi possível: ' + (r.msg || r.status) + '.'); ctx.toast(u.bloqueada ? 'Conta desbloqueada.' : 'Conta bloqueada.'); load('contas', true); load('resumo', true); });
        } });
      };
    };
    var users = (data.contas || []).map(function (u) {
      return { title: (u.nome || 'Sem nome') + (u.excluida ? ' · excluída' : '') + (u.bloqueada ? ' · bloqueada' : ''), email: u.email || 'sem e-mail',
        meta: ((u.papeis || []).join(', ') || 'sem papel') + ' · criada em ' + day(u.criada) + ' · último acesso ' + day(u.ultimo_acesso) + ' · e-mail ' + (u.email_confirmado ? 'confirmado' : 'não confirmado') + (u.duas_etapas ? ' · duas etapas ligada' : '') + ' · ' + U.plural(Number(u.acompanhamentos || 0), 'acompanhamento', 'acompanhamentos'),
        hasProfile: !!u.perfil, profile: u.perfil ? 'Perfil ' + u.perfil + ' (' + u.perfil_status + ')' : '', open: function () { window.open('/treinador/' + encodeURIComponent(u.perfil), '_blank', 'noopener'); }, canOpen: u.perfil_status === 'publicado',
        idW: 'pn-w-' + u.id, why: (ui.pnWhy || {})[u.id] || '', setWhy: function (e) { var x = {}; x[u.id] = U.val(e); put('pnWhy', x); put('pnWhyErr', (function () { var y = {}; y[u.id] = ''; return y; })()); },
        whyErr: (ui.pnWhyErr || {})[u.id] || '', hasWhyErr: !!(ui.pnWhyErr || {})[u.id], notBlocked: !u.bloqueada, blockLabel: u.bloqueada ? 'Desbloquear' : 'Bloquear conta', block: block(u), blockCls: 'btn btn--sm ' + (u.bloqueada ? 'btn--outline' : 'btn--ghost mod-danger') };
    });
    // métricas do site: audiência sem robôs, procura, perfis mais vistos e crescimento, no período escolhido
    var mt = data.metricas || {}, mper = ui.pnPer || 28;
    var ranked = function (list) { var mx = Math.max.apply(null, (list || []).map(function (x) { return x.n; }).concat([1])); return (list || []).map(function (x) { return { k: (function (k) { var m = /^PAIS:([A-Z]{2})$/.exec(k); if (m) { try { return new Intl.DisplayNames(['pt-BR'], { type: 'region' }).of(m[1]); } catch (_) { return m[1]; } } return k.replace(/^UF:/, 'Estado: '); })(String(x.k || '')), n: n(x.n), w: 'width:' + Math.max(3, Math.round(x.n / mx * 100)) + '%', cls: 'ir-rank__k' }; }); };
    var dlt = function (cur, prev) { if (!prev) return ''; var x = Number(cur || 0) - Number(prev || 0); return (x >= 0 ? '+' : '−') + n(Math.abs(x)) + ' sobre o período anterior'; };
    var dbr = function (iso) { var p = String(iso).slice(0, 10).split('-'); return p[2] + '/' + p[1]; };
    var pd = mt.por_dia || [], serie = function (campo, nome) { var mx = Math.max.apply(null, pd.map(function (x) { return Number(x[campo] || 0); }).concat([1])); return pd.map(function (x) { var v = Number(x[campo] || 0); return { st: 'height:' + Math.max(2, Math.round(v / mx * 100)) + '%', cls: v ? '' : 'is-zero', tip: dbr(x.d) + ' · ' + n(v) + ' ' + nome }; }); };
    var fu = mt.funil || {}, ct = mt.contas || {}, tr = mt.treinadores || {};
    var metricas = {
      has: !!data.metricas,
      pers: [[7, '7 dias'], [28, '28 dias'], [90, '90 dias'], [365, '12 meses']].map(function (p) { var on = mper === p[0]; return { label: p[1], on: String(on), cls: 'chip' + (on ? ' is-on' : ''), pick: function () { ctx.setUi({ pnPer: p[0] }); load('metricas', true, p[0]); } }; }),
      kpis: [kpi('Visitas a perfis', n(mt.visitas), dlt(mt.visitas, mt.visitas_antes)), kpi('Visitantes', n(mt.visitantes), dlt(mt.visitantes, mt.visitantes_antes)), kpi('Buscas', n(mt.buscas), dlt(mt.buscas, mt.buscas_antes)), kpi('Perfis visitados', n(mt.perfis_visitados)),
        kpi('Aparições em listas', n(mt.aparicoes), n(mt.cliques) + ' cliques no cartão'), kpi('Cliques em contato', n(mt.contatos), dlt(mt.contatos, mt.contatos_antes)), kpi('Contas novas', n(ct.novas), dlt(ct.novas, ct.novas_antes) || n(ct.total) + ' no total'), kpi('Acessos de robô descartados', n(mt.descartados))],
      visitas: serie('visitas', 'visitas'), buscas: serie('buscas', 'buscas'), contas: serie('contas', 'contas novas'), hasDias: pd.length > 1, diaIni: pd.length ? dbr(pd[0].d) : '', diaFim: pd.length ? dbr(pd[pd.length - 1].d) : '',
      origem: ranked(mt.origem), hasOrigem: (mt.origem || []).length > 0, aparelho: ranked(mt.aparelho), hasAparelho: (mt.aparelho || []).length > 0, idioma: ranked(mt.idioma), hasIdioma: (mt.idioma || []).length > 1,
      esportes: ranked(mt.top_esportes), hasEsportes: (mt.top_esportes || []).length > 0, cidades: ranked(mt.top_cidades), hasCidades: (mt.top_cidades || []).length > 0,
      perfis: (mt.top_perfis || []).map(function (x) { return { nome: x.nome || x.slug, tipo: x.origem === 'importado' ? 'importado' : (x.origem || ''), visitas: n(x.visitas), contatos: n(x.contatos), open: function () { window.open('/treinador/' + encodeURIComponent(x.slug), '_blank', 'noopener'); } }; }), hasPerfis: (mt.top_perfis || []).length > 0,
      funil: [['Visitas a perfis', fu.visitas], ['Cliques em contato', fu.contatos], ['Pedidos de acompanhamento', fu.pedidos], ['Pedidos aceitos', fu.aceitos], ['Acompanhamentos iniciados', fu.acompanhamentos]].map(function (x) { var top = Math.max(Number(fu.visitas || 0), Number(fu.pedidos || 0), 1); return { l: x[0], n: n(x[1]), w: 'width:' + Math.max(2, Math.round(Number(x[1] || 0) / top * 100)) + '%' }; }),
      treinadores: [kpi('Perfis publicados por cadastro', n(tr.cadastro_publicados), n(tr.cadastro_rascunho) + ' em rascunho'), kpi('Cadastros novos no período', n(tr.cadastro_novos)), kpi('Perfis importados no ar', n(tr.importados), n(tr.com_foto) + ' publicados com foto'), kpi('Perfis reivindicados', n(tr.reivindicados), n(tr.reivindicados_periodo) + ' no período'), kpi('Países com treinador', n(tr.paises))],
      vazio: !!data.metricas && !Number(mt.visitas || 0) && !Number(mt.buscas || 0),
      desde: mt.medindo_desde ? 'Contagem sem robôs desde ' + day(mt.medindo_desde) + '.' : 'A contagem sem robôs começa com a próxima visita ao site.'
    };
    var OST = { aguardando_pagamento: 'Aguardando pagamento', aguardando_confirmacao: 'Aguardando confirmação do banco', pago: 'Pago', expirado: 'Expirado', falhou: 'Não concluído', estornado: 'Reembolsado' };
    return {
      show: true, at: ui.pnAt || '',
      tabs: TABS.map(function (t) { var on = tab === t[0]; return { label: t[1], on: String(on), cls: 'chip' + (on ? ' is-on' : ''), pick: function () { ctx.setUi({ pnTab: t[0] }); } }; }),
      isResumo: tab === 'resumo', isContas: tab === 'contas', isAval: tab === 'avaliacoes', isPag: tab === 'pagamentos', isExc: tab === 'exclusoes', isSaude: tab === 'saude', isMetricas: tab === 'metricas', mt: metricas,
      saude: (function () { var h = data.saude || {}, it = (Array.isArray(h) ? h[0] || {} : h).items || [];
        var L = it.map(function (x) { return { t: x.title, n: String(x.n), ok: !!x.ok, cls: x.ok ? 'badge badge--ok' : 'badge badge--risk', st: x.ok ? 'Ok' : 'Atenção', fix: x.ok ? '' : x.fix + (x.since ? ' Desde ' + new Date(x.since).toLocaleString('pt-BR') + '.' : ''), hasFix: !x.ok }; });
        var bad = L.filter(function (x) { return !x.ok; }).length, at = (Array.isArray(h) ? h[0] || {} : h).checkedAt;
        return { items: L, has: L.length > 0, summary: L.length ? (bad ? U.plural(bad, 'ponto pede atenção', 'pontos pedem atenção') : 'Tudo em ordem') + (at ? ' · conferido às ' + new Date(at).toTimeString().slice(0, 5) : '') : '', allOk: L.length > 0 && !bad }; })(), isFilas: tab === 'filas', notFilas: tab !== 'filas',
      loading: !!busy[tab] && data[tab] === undefined, err: errs[tab] || '', hasErr: !!errs[tab], reload: function () { var e = Object.assign({}, ui.pnErr || {}); e[tab] = ''; ctx.setUi({ pnErr: e }); load(tab, true); },
      kpisGente: [kpi('Contas', n(o.contas), n(o.contas_7d) + ' nos últimos 7 dias'), kpi('Treinadores publicados', n(o.treinadores_publicados), n(o.treinadores_rascunho) + ' em rascunho'), kpi('Perfis importados', n(o.perfis_importados), 'ainda não reivindicados'), kpi('Contas bloqueadas', n(o.contas_bloqueadas)), kpi('Com duas etapas', n(o.duas_etapas))],
      kpisUso: [kpi('Acompanhamentos ativos', n(o.acompanhamentos_ativos), n(o.acompanhamentos_pausados) + ' pausados'), kpi('Pedidos aguardando', n(o.pedidos_pendentes)), kpi('Treinos registrados', n(o.treinos_registrados_7d), 'últimos 7 dias'), kpi('Mensagens', n(o.mensagens_7d), 'últimos 7 dias'), kpi('Avaliações', n(o.avaliacoes), n(o.avaliacoes_ocultas) + ' ocultas'), kpi('E-mail de avisos ligado', n(o.email_avisos_ligado), 'contas')],
      kpisDin: [kpi('Pagamentos confirmados', n(o.pagamentos_pagos), money(o.pago_centavos) + ' pagos pelos alunos'), kpi('Comissão 99coach', money(o.comissao_centavos), 'já descontados os reembolsos'), kpi('Treinadores que podem cobrar', n(o.contas_de_recebimento)), kpi('Avisos do Stripe com problema', n(Number(o.avisos_divergentes || 0) + Number(o.avisos_sem_correlacao || 0)), n(o.avisos_divergentes) + ' divergentes · ' + n(o.avisos_sem_correlacao) + ' sem pedido')],
      envTxt: o.ambiente_pagamento === 'live' ? 'Pagamentos em modo real: cobranças de verdade.' : 'Pagamentos em modo de teste.', hasResumo: !!data.resumo,
      q: ui.pnQ || '', setQ: function (e) { ctx.setUi({ pnQ: U.val(e) }); }, search: function () { load('contas', true); },
      users: users, hasUsers: users.length > 0, noUsers: Array.isArray(data.contas) && !users.length, usersN: U.plural(users.length, 'conta', 'contas') + (users.length >= 100 ? ' (mostrando as 100 mais recentes; busque para achar outras)' : ''),
      revs: (data.avaliacoes || []).map(function (r) { var hid = r.status === 'oculta'; return { title: r.nota + (r.nota === 1 ? ' estrela' : ' estrelas') + ' · ' + (r.autor || 'Aluno') + ' sobre ' + r.treinador + (hid ? ' · OCULTA' : ''), text: r.texto || 'Sem texto.', reply: r.resposta ? 'Resposta do treinador: ' + r.resposta : '', hasReply: !!r.resposta, meta: when(r.em), act: hid ? 'Mostrar de novo' : 'Ocultar', go: hide(r.id, !hid, r.treinador), open: function () { window.open('/treinador/' + encodeURIComponent(r.perfil), '_blank', 'noopener'); } }; }),
      noRevs: Array.isArray(data.avaliacoes) && !data.avaliacoes.length,
      orders: (pay.pedidos || []).map(function (x) { return { title: money(x.valor) + ' · ' + (OST[x.status] || x.status) + ' · ' + (x.item || 'Acompanhamento'), meta: (x.comprador || 'Comprador') + ' → ' + x.treinador + ' · ' + when(x.em) + (x.pago_em ? ' · pago em ' + when(x.pago_em) : '') + (x.meio ? ' · ' + x.meio : '') + ' · ' + (x.ambiente === 'live' ? 'real' : 'teste'), money: x.comissao == null ? '' : 'Comissão ' + money(x.comissao) + ' · tarifa ' + money(x.tarifa) + ' · líquido do treinador ' + money(x.liquido) + (Number(x.reembolsado) ? ' · reembolsado ' + money(x.reembolsado) : '') + ' · ' + (x.recebivel || ''), hasMoney: x.comissao != null, access: x.acesso === 'liberado' ? 'Acesso liberado' : x.acesso === 'bloqueado_capacidade' ? 'Pago, mas sem vaga: acesso NÃO liberado' : '', hasAccess: x.acesso && x.acesso !== 'pendente' }; }),
      noOrders: !!data.pagamentos && !(pay.pedidos || []).length,
      bad: (pay.avisos_com_problema || []).map(function (e) { return { title: (e.status === 'divergente' ? 'Divergente' : 'Sem pedido correspondente') + ' · ' + e.tipo, meta: (e.nota || 'sem detalhe') + ' · ' + when(e.em) + ' · ' + e.aviso }; }), hasBad: (pay.avisos_com_problema || []).length > 0,
      accts: (pay.contas || []).map(function (a) { return { title: a.treinador + ' · ' + (a.ambiente === 'live' ? 'real' : 'teste'), meta: (a.cobra ? 'pode cobrar' : 'ainda não pode cobrar') + ' · ' + (a.repassa ? 'repasse ativo' : 'repasse pendente') + ' · ' + (a.cadastro_enviado ? 'cadastro enviado' : 'cadastro incompleto') + ' · atualizado em ' + when(a.atualizado) }; }), hasAccts: (pay.contas || []).length > 0, noAccts: !!data.pagamentos && !(pay.contas || []).length,
      dels: (data.exclusoes || []).map(function (d) { var ST = { solicitado: 'Pedida, em prazo de arrependimento', em_andamento: 'Em andamento', concluido: 'Concluída', cancelado: 'Cancelada pela pessoa' }; return { title: (ST[d.status] || d.status) + (d.nome ? ' · ' + d.nome : ' · conta já sem nome'), meta: 'Pedida em ' + when(d.pedida) + (d.concluida ? ' · concluída em ' + when(d.concluida) : ''), keep: (d.retencao || []).map(function (k) { return k.item + (k.prazo_dias ? ' (' + k.prazo_dias + ' dias)' : ' (sem prazo)') + ': ' + k.motivo; }).join(' · '), hasKeep: (d.retencao || []).length > 0 }; }),
      noDels: Array.isArray(data.exclusoes) && !data.exclusoes.length
    };
  };
})();
