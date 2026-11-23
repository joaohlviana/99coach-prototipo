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
  var NOSRC = { TM06: 'Execução do plano', TM09: 'Plano concluído', TM10: 'Evolução de medidas', TM12: 'Uso de assistência' };

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
      if (by.TM11 && by.TM11.status === 'unavailable') nosrc.push('Receita (ainda sem vendas pagas pelo 99coach)');
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
      // audiência do perfil e procura na região (my_audience): visitas sem robôs, de onde vieram e o que se busca na cidade
      var ak = 'au' + per;
      if (!ui[ak] && !ui['busy' + ak]) {
        var b1 = {}; b1['busy' + ak] = true; ctx.setUi(b1);
        if (!ui.marcos) C().rpc('my_milestones', {}).then(function (r) { ctx.setUi({ marcos: r.ok && one(r) ? one(r) : { falhou: true } }); });
        C().rpc('my_audience', { p_days: per }).then(function (r) { var o = {}; o['busy' + ak] = false; o[ak] = r.ok && one(r) ? one(r) : { falhou: true }; ctx.setUi(o); });
      }
      var au = ui[ak] && !ui[ak].falhou && !ui[ak].sem_perfil ? ui[ak] : null, rg = (au && au.regiao) || {};
      var nf = function (v) { return Number(v || 0).toLocaleString('pt-BR'); };
      var delta = function (cur, prev) { if (!prev) return ''; var dlt = cur - prev; return (dlt >= 0 ? '+' : '−') + nf(Math.abs(dlt)) + ' sobre o período anterior'; };
      var ranked = function (list, meu) { var mx = Math.max.apply(null, (list || []).map(function (x) { return x.n; }).concat([1])); return (list || []).map(function (x) { return { k: x.k, n: nf(x.n) + (meu && x.t != null ? (x.n === 1 ? ' busca · ' : ' buscas · ') + U.plural(x.t, 'treinador', 'treinadores') : ''), w: 'width:' + Math.max(3, Math.round(x.n / mx * 100)) + '%', cls: 'ir-rank__k' + (meu && x.meu ? ' is-meu' : '') }; }); };
      var dias = (au && au.por_dia) || [], dmx = Math.max.apply(null, dias.map(function (x) { return x.v; }).concat([1]));
      var dbr = function (iso) { var p = String(iso).slice(0, 10).split('-'); return p[2] + '/' + p[1]; };
      var quando = function (iso) { var dt = new Date(iso), hoje = new Date(), on = new Date(hoje.getTime() - 86400000), hm = ('0' + dt.getHours()).slice(-2) + ':' + ('0' + dt.getMinutes()).slice(-2); return (dt.toDateString() === hoje.toDateString() ? 'Hoje' : dt.toDateString() === on.toDateString() ? 'Ontem' : day(iso)) + ' ' + hm; };
      var auKpis = au ? [
        { n: nf(au.visitas), l: 'Visitas ao perfil', s: delta(au.visitas, au.visitas_antes) },
        { n: nf(au.visitantes), l: au.visitantes === 1 ? 'Visitante' : 'Visitantes', s: '' },
        { n: nf(au.aparicoes), l: 'Vezes que apareceu nas listas', s: au.aparicoes ? U.plural(au.cliques, 'clique no cartão', 'cliques no cartão') + (au.aparicoes >= 30 ? ' (' + pct(au.cliques / au.aparicoes) + ')' : '') : delta(au.aparicoes, au.aparicoes_antes) },
        au.posicao_media != null ? { n: String(au.posicao_media).replace('.', ',') + 'º', l: 'Posição média nas listas', s: '' } : null,
        { n: nf(au.contatos), l: 'Cliques em contato', s: (au.contatos_canal || []).length ? au.contatos_canal.map(function (c) { return nf(c.n) + ' ' + (c.k === 'instagram' ? 'no Instagram' : (c.n === 1 ? 'pedido' : 'pedidos')); }).join(' · ') : delta(au.contatos, au.contatos_antes) }
      ].filter(Boolean).map(function (k) { k.hasS = !!k.s; return k; }) : [];
      // quando as visitas acontecem: por dia da semana e por hora (horário de Brasília)
      var DOW = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'], DOWL = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
      var barras = function (list, rot, tip) { var mx = Math.max.apply(null, (list || []).map(function (x) { return x.n; }).concat([1])); return (list || []).map(function (x) { return { st: 'height:' + Math.max(2, Math.round(x.n / mx * 100)) + '%', cls: x.n ? '' : 'is-zero', tip: tip(x) + ' · ' + U.plural(x.n, 'visita', 'visitas'), r: rot(x) }; }); };
      var sem = barras(au && au.por_semana, function (x) { return DOW[x.k]; }, function (x) { return DOWL[x.k]; }), hor = barras(au && au.por_hora, function (x) { return x.k % 6 === 0 ? x.k + 'h' : ''; }, function (x) { return x.k + 'h'; });
      var pico = (function () { if (!au || au.visitas < 10) return ''; var a1 = (au.por_semana || []).slice().sort(function (x, y) { return y.n - x.n; })[0], h1 = (au.por_hora || []).slice().sort(function (x, y) { return y.n - x.n; })[0]; return a1 && h1 && a1.n ? 'Mais visitas: ' + DOWL[a1.k] + ', por volta das ' + h1.k + 'h.' : ''; })();
      // o que falta no perfil para aparecer mais (os mesmos itens que contam na ordem das listas)
      var pf = (au && au.perfil) || {}, editar = function () { GO('@onboarding', { flow: 'treinador' }); };
      var falta = au ? [
        !pf.foto ? { t: 'Foto', x: 'Perfil com foto aparece antes nas listas e nas sugestões da busca.', a: 'Adicionar foto', go: editar } : null,
        !pf.texto ? { t: 'Apresentação', x: 'Conte em algumas linhas como é o seu trabalho e para quem.', a: 'Escrever', go: editar } : null,
        !pf.local ? { t: 'Cidade', x: 'Sem cidade o perfil não entra nas buscas presenciais.', a: 'Informar cidade', go: editar } : null,
        !pf.cref ? { t: 'CREF', x: 'Registro conferido pela equipe conta na ordem das listas.', a: 'Informar CREF', go: editar } : (pf.cref === 'informado' ? { t: 'CREF sem conferência', x: 'Peça a conferência: registro conferido conta na ordem das listas.', a: 'Pedir conferência', go: function () { GO('ACC10'); } } : null),
        !pf.avaliacoes ? { t: 'Avaliações', x: 'Alunos com acompanhamento pelo 99coach podem avaliar você.', a: '', go: null } : null
      ].filter(Boolean).map(function (f) { f.hasA = !!f.a; return f; }) : [];
      // muita procura para pouca oferta: modalidades buscadas na cidade que ele não atende, com poucos treinadores
      var oport = ((rg.top_cidade || []).filter(function (x) { return !x.meu && x.n >= 5 && x.t != null && x.n / Math.max(1, x.t) >= 2; }).sort(function (x, y) { return y.n / Math.max(1, y.t) - x.n / Math.max(1, x.t); }).slice(0, 3)).map(function (x) { return { t: x.k, x: U.plural(x.n, 'busca', 'buscas') + ' para ' + U.plural(x.t, 'treinador', 'treinadores') + ' na cidade' }; });
      // força do perfil: os mesmos itens que contam na ordem das listas, somando 100
      var PESOS = [['foto', 25, !!pf.foto], ['apresentação', 20, !!pf.texto], ['cidade', 15, !!pf.local], ['modalidades', 10, Number(pf.modalidades || 0) > 0], ['CREF informado', 10, !!pf.cref], ['CREF conferido', 10, pf.cref === 'verificado'], ['avaliações', 10, Number(pf.avaliacoes || 0) > 0]];
      var forca = PESOS.reduce(function (t, x) { return t + (x[2] ? x[1] : 0); }, 0), prox = PESOS.filter(function (x) { return !x[2]; })[0];
      // conquistas: marcos de visitas, contatos e aparições desde o começo da contagem; a próxima de cada tipo mostra o progresso
      var mc = ui.marcos && !ui.marcos.falhou ? ui.marcos : null;
      var MARCOS = [['visitas', [1, 10, 50, 100, 500, 1000, 5000], function (v) { return v === 1 ? 'Primeira visita' : nf(v) + ' visitas'; }, 'i-eye', function (v) { return v === 1 ? 'visita ao perfil' : 'visitas ao perfil'; }],
        ['contatos', [1, 5, 25, 100, 500], function (v) { return v === 1 ? 'Primeiro contato' : nf(v) + ' contatos'; }, 'i-message', function (v) { return v === 1 ? 'clique em contato' : 'cliques em contato'; }],
        ['aparicoes', [100, 1000, 10000, 100000], function (v) { return nf(v) + ' aparições nas listas'; }, 'i-list', function () { return 'aparições nas listas'; }]];
      var feitas = [], metas = [];
      if (mc) MARCOS.forEach(function (m) { var tem = Number(mc[m[0]] || 0), ok = m[1].filter(function (v) { return tem >= v; }), nx = m[1].filter(function (v) { return tem < v; })[0];
        if (ok.length) { var v0 = ok[ok.length - 1]; feitas.push({ t: m[2](v0), n: nf(v0), l: m[4](v0), ic: 'ic ' + m[3], cls: 'ir-medalha', alt: m[2](v0) }); }
        if (nx) metas.push({ t: m[2](nx), x: nf(tem) + ' de ' + nf(nx), w: 'width:' + Math.max(2, Math.round(tem / nx * 100)) + '%' }); });
      if (au && rg.na_cidade >= 10 && rg.posicao <= 10) feitas.push({ t: rg.posicao === 1 ? '1º da cidade nas suas modalidades' : 'Entre os 10 primeiros da cidade', n: rg.posicao + 'º', l: 'na cidade, nas suas modalidades', ic: 'ic i-crown', cls: 'ir-medalha', alt: (rg.posicao === 1 ? '1º da cidade nas suas modalidades' : 'Entre os 10 primeiros da cidade') });
      var baixar = function () { try { var linhas = [['data', 'hora', 'origem', 'buscava', 'aparelho', 'clicou em contato']].concat(((au && au.recentes) || []).map(function (v) { var dt = new Date(v.em); return [dt.toLocaleDateString('pt-BR'), ('0' + dt.getHours()).slice(-2) + ':' + ('0' + dt.getMinutes()).slice(-2), v.origem, v.de || '', v.dev || '', v.contato ? 'sim' : 'não']; }));
        var csv = '\ufeff' + linhas.map(function (l) { return l.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(';'); }).join('\r\n'), a0 = document.createElement('a'); a0.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a0.download = 'visitas-ao-perfil.csv'; document.body.appendChild(a0); a0.click(); a0.remove(); } catch (_) {} };
      var recentes = ((au && au.recentes) || []).slice(0, ui.auMais ? 60 : 12).map(function (v) { return { t: v.origem + (v.de ? ' · ' + v.de : '') + (v.dev ? ' · ' + v.dev : ''), q: quando(v.em), contato: !!v.contato }; });
      var topReg = (rg.top_cidade || []).length >= 3 ? [rg.top_cidade, rg.cidade] : ((rg.top_estado || []).length >= 3 ? [rg.top_estado, 'no estado (' + rg.uf + ')'] : [rg.top_brasil || [], 'no Brasil']);
      var rgKpis = au ? [
        rg.cidade ? { n: nf(rg.buscas_cidade), l: 'Buscas em ' + rg.cidade.split(', ')[0], s: rg.buscas_estado ? nf(rg.buscas_estado) + ' no estado' : '' } : null,
        rg.cidade ? { n: nf(rg.minhas_cidade), l: 'Buscas pelas suas modalidades na cidade', s: rg.minhas_estado ? nf(rg.minhas_estado) + ' no estado' : '' } : null,
        rg.cidade && rg.na_cidade ? { n: nf(rg.na_cidade), l: 'Treinadores das suas modalidades na cidade', s: 'você aparece em ' + rg.posicao + 'º entre eles' } : null
      ].filter(Boolean).map(function (k) { k.hasS = !!k.s; return k; }) : [];
      var fn = ui[fk] && !ui[fk].none ? ui[fk] : null, top = fn ? Math.max(fn.views || 0, fn.reqs, fn.links, 1) : 1;
      var bar = function (n) { return 'width:' + Math.max(2, Math.round((n || 0) / top * 100)) + '%'; };
      var funnel = fn ? [
        { n: au ? String(au.visitas) : (fn.views == null ? 'Sem base' : String(fn.views)), l: 'Visitas ao perfil', w: bar(au ? au.visitas : fn.views), x: 'aberturas da página pública' },
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
        auOk: !!au, auKpis: auKpis, auVazio: !!au && !au.visitas && !au.aparicoes,
        auDias: dias.map(function (x) { return { st: 'height:' + Math.max(2, Math.round(x.v / dmx * 100)) + '%', cls: x.v ? '' : 'is-zero', tip: dbr(x.d) + ' · ' + U.plural(x.v, 'visita', 'visitas') }; }),
        hasAuDias: !!au && au.visitas > 0 && dias.length > 1, auDiaIni: dias.length ? dbr(dias[0].d) : '', auDiaFim: dias.length ? dbr(dias[dias.length - 1].d) : '',
        auDiasAlt: au ? U.plural(au.visitas, 'visita', 'visitas') + ' entre ' + (dias.length ? dbr(dias[0].d) + ' e ' + dbr(dias[dias.length - 1].d) : '') : '',
        auOrigem: ranked(au && au.origem), hasAuOrigem: !!au && (au.origem || []).length > 0,
        auDe: ranked(au && au.veio_de), hasAuDe: !!au && (au.veio_de || []).length > 0,
        auAparelho: ranked(au && au.aparelho), hasAuAparelho: !!au && (au.aparelho || []).length > 1,
        auRecentes: recentes, hasAuRecentes: recentes.length > 0, auTemMais: !ui.auMais && ((au && au.recentes) || []).length > 12, auMais: function () { ctx.setUi({ auMais: true }); },
        forcaOk: !!au, forca: forca + '%', forcaW: 'width:' + forca + '%', forcaCheia: forca === 100, forcaProx: prox ? 'Próximo passo: ' + prox[0] + ' (+' + prox[1] + ')' : 'Perfil completo', forcaAlt: 'Força do perfil: ' + forca + ' de 100',
        feitas: feitas, hasFeitas: feitas.length > 0, metas: metas, hasMetas: metas.length > 0, conquistasOk: !!au && !!mc,
        auSem: sem, auHor: hor, hasAuQuando: !!au && au.visitas > 0, auPico: pico, hasAuPico: !!pico,
        falta: falta, hasFalta: falta.length > 0, oport: oport, hasOport: oport.length > 0,
        rgFmt: ranked(rg.formatos), hasRgFmt: (rg.formatos || []).length > 1, auBaixar: baixar, hasAuBaixar: ((au && au.recentes) || []).length > 0,
        auDesde: au && au.medindo_desde && new Date(au.medindo_desde) > new Date(au.desde) ? 'Contagem sem robôs desde ' + day(au.medindo_desde) + '.' : '', hasAuDesde: !!(au && au.medindo_desde && new Date(au.medindo_desde) > new Date(au.desde)),
        rgOk: !!au && (rgKpis.length > 0 || topReg[0].length > 0), rgTitulo: rg.cidade ? 'Procura em ' + rg.cidade : 'Procura no site', rgKpis: rgKpis, hasRgKpis: rgKpis.length > 0,
        rgTop: ranked(topReg[0], true), hasRgTop: topReg[0].length > 0, rgTopTitulo: 'Modalidades mais buscadas ' + (topReg[1] === rg.cidade ? 'na cidade' : topReg[1]),
        reload: function () { var s = {}; s[key] = null; s[ak] = null; s.cap = null; ctx.setUi(s); }
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
        C().db('GET', 'trainers?select=slug,name,cref,cref_status,cref_note,cref_verified_at,status&user_id=eq.' + encodeURIComponent(uid || '')).then(function (r) { ctx.setUi({ loading: false, t: one(r) || { none: true }, loadErr: !r.ok }); });
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
        validity: st === 'verificado' && t.cref_verified_at ? 'Conferido em ' + new Date(t.cref_verified_at).toLocaleDateString('pt-BR') + ' · vale até ' + new Date(new Date(t.cref_verified_at).getTime() + 365 * 86400000).toLocaleDateString('pt-BR') + '. Depois disso, peça uma nova conferência.' : '', hasValidity: st === 'verificado' && !!t.cref_verified_at,
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
