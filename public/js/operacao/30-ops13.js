/* O3 · OPS13 Vitrines e experimentos (+ OPS13.A regra e elegibilidade, OPS13.B comparação de experimento, OPS13.C pausa, retomada e histórico).
   Experimentos têm amostra e período; receita, plano Pro e saúde não viram ranking opaco; patrocínio é futuro, separado e identificado. */
(function () {
  'use strict';
  var O3 = window.O3;
  var linkRows = function (rows) { return rows.map(function (r) { return { label: r[0], sub: r[1], ic: 'ic ic--sm i-' + r[2], go: function () { GO(r[3], r[4] || {}); } }; }); };
  O3.rev('o3vit', function (d) { var x = DB.find('o3_vitrines', d.id); if (x) x.estado = d.estado; });
  O3.rev('o3exp', function (d) { var x = DB.find('o3_vitrines', d.id); if (x) x.prop = d.prop; });
  O3.rev('o3regra', function (d) { DB.o3_vitrineRegra.paused = d.paused; });
  var SYN = [['Perfil sintético A', '0,8 km', '4,9 · 31 avaliações', 'ativo há 1 dia'], ['Perfil sintético B', '1,4 km', '4,7 · 12 avaliações', 'ativo há 3 dias'], ['Perfil sintético C', '2,1 km', 'sem avaliações elegíveis', 'ativo hoje'], ['Perfil sintético D', '2,6 km', '4,8 · 54 avaliações', 'ativo há 6 dias'], ['Perfil sintético E', '3,9 km', '4,6 · 8 avaliações', 'ativo há 2 dias'], ['Perfil sintético F', '5,2 km', '5,0 · 3 avaliações', 'ativo há 9 dias']];

  // ---------- OPS13 · composição ----------
  REG.screen({
    page: 'operacao', key: 'ops13', id: 'OPS13', title: 'Vitrines e experimentos', mtitle: 'Vitrines', nav: 'catalogo', back: 'H16', wide: true, testIds: ['e12', 'resp'],
    normal: 'Regras ativas', scens: [['patrocinado', 'Patrocinado'], ['amostra', 'Amostra pequena'], ['pausado', 'Pausado']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn;
      var list = DB.o3_vitrines.map(function (x) { return scn === 'pausado' && x.id === 'mais' && x.estado === 'ativa' ? Object.assign({}, x, { estado: 'pausado' }) : x; });
      var ld = O3.ld(ctx, list, 'sel', scn === 'amostra' ? 'resp' : (scn === 'pausado' ? 'mais' : (ctx.id || '')));
      var x = ld.cur;
      var paused = x.estado === 'pausado';
      var rows = list.map(function (v) { return { id: v.id, name: v.name, sub: 'regra ' + v.regra + ' · ' + v.cob, st: v.estado, stCls: O3.tone(v.estado), cls: ld.rowCls(v.id) + ' lrow', go: ld.pick(v.id) }; });
      var toggle = function () {
        var real = DB.find('o3_vitrines', x.id);
        if (scn === 'pausado' && x.id === 'mais' && real.estado === 'ativa') { ctx.toast('Situação de demonstração: a regra já aparece pausada.'); return; }
        O3.decide(ctx, {
          title: (paused ? 'Retomar ' : 'Pausar ') + x.name + '?', ok: paused ? 'Retomar' : 'Pausar', scope: 'ops13', action: (paused ? 'Retomada · ' : 'Pausa · ') + x.name, target: 'regra ' + x.regra + ' · cobertura ' + x.cob,
          impact: paused ? (x.exp ? ['Volta a expor ' + x.cob + ' das sessões elegíveis.', 'Período novo: 26/10–09/11 · amostra mínima de 6 000 sessões por variante.', 'Nenhum vencedor é declarado ao retomar.'] : ['Volta a ordenar pela regra ' + x.regra + '.', 'Sinais: ' + x.sinais + '.']) : ['A vitrine volta à regra anterior (' + x.prev + ').', 'Cobertura afetada: ' + x.cob + ' das sessões.', x.exp ? 'A amostra coletada até agora fica guardada, sem conclusão.' : 'Nenhum perfil é editado individualmente.'],
          apply: function () { real.estado = paused ? (x.exp ? 'em andamento' : 'ativa') : 'pausado'; }, rev: 'o3vit', data: { id: x.id, estado: real.estado }
        });
      };
      var alerts = [];
      if (scn === 'patrocinado') alerts.push(O3.alert('info', 'Patrocinado', 'Rótulo visível: posição paga, se um dia existir, aparece identificada e separada da ordem orgânica.', ui.why ? 'Fechar explicação' : 'Saiba por quê', function () { ctx.setUi({ why: !ui.why }); }));
      if (scn === 'amostra') alerts.push(O3.alert('warn', 'Amostra pequena', 'Sem conclusão: ' + (ui.cq ? 'consultado às ' + ui.cq + ', ainda 1 210 sessões no total.' : '1 210 sessões no total, abaixo do mínimo de 6 000 por variante.'), 'Consultar de novo', function () { ctx.setUi({ cq: U.now() }); ctx.toast('Consultado às ' + U.now() + ' · amostra sem mudança'); }));
      if (scn === 'pausado') alerts.push(O3.alert('info', 'Pausado', '“Mais contratados” voltou à regra anterior (v1) às 13:40. Nenhum perfil foi editado.'));
      var kv = [O3.kv('Finalidade', x.fin), O3.kv('Regra', x.regra + ' · desde ' + x.since), O3.kv('Cobertura', x.cob), O3.kv('Sinais permitidos', x.sinais), O3.kv('Não usa', x.nao)];
      if (x.exp) { kv.push(O3.kv('Período', x.janela)); kv.push(O3.kv('Amostra', x.amostra)); }
      kv.push(O3.kv('Estado', x.estado, x.estado));
      var det = [O3.btn(ctx, paused ? 'Retomar' : 'Pausar', toggle, { kind: 'btn--primary' }), O3.btn(ctx, 'Histórico', function () { GO('OPS13.C'); })];
      if (x.exp) det.push(O3.btn(ctx, 'Comparar variantes', function () { GO('OPS13.B'); }, { kind: 'btn--ghost' }));
      else det.push(O3.btn(ctx, 'Regra e elegibilidade', function () { GO('OPS13.A'); }, { kind: 'btn--ghost' }));
      var rc = O3.rcPack(ctx, 'ops13');
      return {
        hasEyebrow: true, eyebrow: 'Catálogo · vitrines', h1: 'Vitrines', sub: 'Regras versionadas e experimentos com amostra e período · ' + O3.WHEN,
        acts: [O3.btn(ctx, 'Regra e elegibilidade', function () { GO('OPS13.A'); }), O3.btn(ctx, 'Experimento E-12', function () { GO('OPS13.B'); })],
        alerts: alerts, showWhy: scn === 'patrocinado' && !!ui.why,
        why: 'Hoje nenhuma vitrine tem patrocínio. Se for habilitado no futuro, o card pago terá rótulo “Patrocinado”, ficará fora da ordem orgânica e não usará receita, plano Pro nem dados de saúde para ranquear.',
        showSponsor: scn === 'patrocinado',
        ldCls: ld.ldCls, rows: rows, toList: ld.toList, cur: { name: x.name, st: x.estado, stCls: O3.tone(x.estado) }, kv: kv, detActs: det,
        dec: O3.reason(ctx, paused ? 'Motivo da retomada' : 'Motivo da pausa'),
        links: linkRows([['Regra e elegibilidade', '“Perto de você” · v5', 'filter', 'OPS13.A'], ['Comparação de experimento', 'E-12 · janela 12/10–26/10', 'chart', 'OPS13.B'], ['Pausa, retomada e histórico', 'Versões e estado efetivo', 'clock', 'OPS13.C']]),
        rcs: rc.rcs, hasRcs: rc.hasRcs
      };
    }
  });

  // ---------- OPS13.A · regra e elegibilidade ----------
  REG.screen({
    page: 'operacao', key: 'ops13a', id: 'OPS13.A', title: 'Regra da vitrine', mtitle: 'Regra', nav: 'catalogo', back: 'OPS13',
    normal: 'Regra ativa', scens: [['semaprov', 'Regra sem aprovação'], ['insuficiente', 'Catálogo insuficiente'], ['inelegivel', 'Perfil inelegível'], ['atrasada', 'Projeção atrasada']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn, R = DB.o3_vitrineRegra;
      var few = scn === 'insuficiente';
      var sim = (few ? SYN.slice(0, 4) : SYN).map(function (s, i) { return { pos: String(i + 1), name: s[0], meta: s[1] + ' · ' + s[2] + ' · ' + s[3] }; });
      var cmp = [
        { k: 'Sinais permitidos', a: 'distância, avaliações elegíveis, recência', b: 'distância, avaliações elegíveis, recência, tempo de resposta', diff: true },
        { k: 'Exclusões', a: 'suspensos, importados sem revisão', b: 'suspensos, importados sem revisão', diff: false },
        { k: 'Sem analytics', a: 'distância + recência', b: 'distância + recência', diff: false }
      ].map(function (c) { return { k: c.k, a: c.a, b: c.b, cls: 'o3-cmpr' + (c.diff ? ' is-diff' : ''), tag: c.diff ? 'muda' : 'igual', tagCls: c.diff ? 'badge badge--warn' : 'badge badge--plain' }; });
      var q = U.norm(ui.q || '');
      var check = q.length >= 2 ? (/studio|import/.test(q) ? 'Studio Fit Campinas: importado sem revisão → excluído da vitrine até aprovação.' : (/suspens|caio/.test(q) ? 'Perfil suspenso → excluído enquanto durar a suspensão.' : 'Nenhum perfil encontrado com esse nome nos dados sintéticos.')) : '';
      var alerts = [];
      if (scn === 'semaprov') alerts.push(O3.alert('warn', 'Regra sem aprovação', 'A v6 foi proposta em ' + R.proposedAt + ' e aguarda alçada. Você pode simular e comparar; ela não entra no ar.', 'Ver histórico', function () { GO('OPS13.C', { scn: 'pendente' }); }));
      if (few) alerts.push(O3.alert('warn', 'Catálogo insuficiente', 'Só 4 perfis elegíveis perto de Cambé (mínimo 6). A vitrine usa o fallback distância + recência e mostra o aviso.'));
      if (scn === 'inelegivel') alerts.push(O3.alert('info', 'Perfil inelegível', 'Confira por que um perfil não aparece. Ex.: busque “Studio”.'));
      if (scn === 'atrasada' && !ui.cq) alerts.push(O3.alert('warn', 'Projeção atrasada', 'A última projeção da vitrine é das 13:10 (previsto a cada 30 min). A ordem mostrada pode estar desatualizada.', 'Consultar de novo', function () { ctx.setUi({ cq: U.now() }); ctx.toast('Projeção atualizada às ' + U.now()); }));
      alerts.push(O3.alert('info', 'Pro não compra posição', 'Anúncio, se habilitado, fica identificado e separado da ordem orgânica.'));
      return {
        hasEyebrow: false, eyebrow: '', h1: 'Regra da vitrine', sub: '“Perto de você” · ' + R.active + ' ativa',
        acts: [O3.btn(ctx, ui.sim ? 'Ocultar simulação' : 'Simular com dados sintéticos', function () { ctx.setUi({ sim: !ui.sim }); }), O3.btn(ctx, ui.cmp ? 'Ocultar comparação' : 'Comparar proposta', function () { ctx.setUi({ cmp: !ui.cmp }); }, { kind: 'btn--primary' })],
        ctx: O3.ctx('vitrines.ler', 'Vitrine home · BR · PT', scn === 'atrasada' && !ui.cq ? '26/10 · 13:10 BRT' : (ui.cq ? '26/10 · ' + ui.cq + ' BRT' : '')), alerts: alerts,
        kv: [O3.kv('Versão', R.active + (scn === 'semaprov' ? ' · ' + R.proposed + ' sem aprovação' : '')), O3.kv('Finalidade', 'variedade elegível perto do local escolhido'), O3.kv('Filtros', 'publicado, aceita alunos, modalidade compatível'), O3.kv('Sinais permitidos', 'distância, avaliações elegíveis, recência'), O3.kv('Exclusões', 'suspensos, importados sem revisão, Pro não compra posição'), O3.kv('Mercado e idioma', 'BR · PT'), O3.kv('Sem analytics', few ? 'em uso agora: distância + recência' : 'ordem por distância + recência')],
        showSim: !!ui.sim, sim: sim, simNote: 'Dados sintéticos · Cambé, PR · ' + sim.length + ' perfis' + (few ? ' (fallback ativo)' : ''),
        showCmp: !!ui.cmp, cmp: cmp,
        showCheck: scn === 'inelegivel', q: ui.q || '', setQ: function (e) { ctx.setUi({ q: U.val(e) }); }, hasCheck: !!check, check: check,
        hist: function () { GO('OPS13.C'); }
      };
    }
  });

  // ---------- OPS13.B · comparação de experimento ----------
  var CUTS = {
    todos: [['A · v5', '50%', '3,1%', '4 120 sessões', 'ok'], ['B · recência', '50%', '3,4%', '4 086 sessões', 'ok']],
    celular: [['A · v5', '50%', '2,9%', '2 870 sessões', 'ok'], ['B · recência', '50%', '3,3%', '2 841 sessões', 'ok']],
    desktop: [['A · v5', '50%', '3,6%', '1 250 sessões', 'ok'], ['B · recência', '50%', '3,6%', '1 245 sessões', 'ok']]
  };
  REG.screen({
    page: 'operacao', key: 'ops13b', id: 'OPS13.B', title: 'Experimento E-12', mtitle: 'E-12', nav: 'catalogo', back: 'OPS13',
    normal: 'Amostra insuficiente', scens: [['atribuicao', 'Atribuição incompleta'], ['multi', 'Múltiplas variantes'], ['revisados', 'Dados revisados']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn;
      var e = DB.find('o3_vitrines', 'e12');
      var cut = ui.cut || 'todos';
      var data = CUTS[cut].slice();
      if (scn === 'multi') data = [['A · v5', '34%', '3,1%', '2 790 sessões', 'ok'], ['B · recência', '33%', '3,4%', '2 712 sessões', 'ok'], ['C · só distância', '33%', '2,8%', '2 704 sessões', 'atenção']];
      var rows = data.map(function (d) { return { v: d[0], exp: d[1], rate: d[2], den: d[3], g: d[4], gCls: d[4] === 'ok' ? 'badge badge--ok' : 'badge badge--warn' }; });
      var propose = function (kind) {
        return function () {
          if (e.prop) { ctx.toast('Já existe proposta: ' + e.prop + '. Use o recibo para desfazer.'); return; }
          O3.decide(ctx, {
            title: kind === 'pausa' ? 'Propor pausa do E-12?' : 'Propor continuidade do E-12?', ok: kind === 'pausa' ? 'Propor pausa' : 'Propor continuidade', scope: 'ops13b',
            action: kind === 'pausa' ? 'Pausa proposta · E-12' : 'Continuidade proposta · E-12', target: 'E-12 · BR · PT',
            impact: kind === 'pausa' ? ['Se aprovada pela alçada, as sessões voltam à regra v5.', 'A amostra coletada (8 206 sessões) fica guardada, sem conclusão.', 'Nenhum vencedor é declarado.'] : ['Estende a janela até 09/11 para chegar a ~6 000 sessões por variante.', 'Exposição continua 50% · 50%.', 'Nenhum vencedor é declarado agora.'],
            apply: function () { e.prop = kind === 'pausa' ? 'pausa proposta' : 'continuidade proposta'; }, rev: 'o3exp', data: { id: 'e12', prop: e.prop || '' }
          });
        };
      };
      var alerts = [];
      alerts.push(O3.alert('warn', 'Amostra insuficiente para decidir', 'Intervalo cruza zero. Dados revisados em 25/10. Não declaramos vencedor nem ganho.'));
      if (scn === 'atribuicao') alerts.push(O3.alert('warn', 'Atribuição incompleta', '8% dos pedidos (31 de 389) não têm variante registrada. Eles ficam fora dos dois numeradores.'));
      if (scn === 'multi') alerts.push(O3.alert('info', 'Múltiplas variantes', 'Três variantes dividem a exposição; cada uma precisa do próprio denominador mínimo.'));
      if (scn === 'revisados') alerts.push(O3.alert('info', 'Dados revisados', 'Em 25/10, 214 sessões de robôs saíram dos denominadores. B passou de 3,5% para 3,4%.'));
      if (e.prop) alerts.push(O3.alert('ok', 'Proposta registrada', 'Situação: ' + e.prop + ' · aguardando alçada de experimentos.'));
      var rc = O3.rcPack(ctx, 'ops13b');
      var blocked = !!e.prop;
      return {
        hasEyebrow: false, eyebrow: '', h1: 'Experimento E-12', sub: 'Ordem por recência × distância',
        acts: [O3.btn(ctx, 'Propor pausa', propose('pausa'), { dis: blocked, why: 'Já existe proposta. Use o recibo para desfazer.' }), O3.btn(ctx, 'Propor continuidade', propose('cont'), { kind: 'btn--primary', dis: blocked, why: 'Já existe proposta. Use o recibo para desfazer.' })],
        ctx: O3.ctx('experimentos.ler', 'E-12 · BR · PT'), alerts: alerts,
        kv: [O3.kv('Hipótese', 'recência aumenta pedidos enviados'), O3.kv('População', 'visitantes BR com local definido'), O3.kv('Janela', e.janela), O3.kv('Baseline', 'regra v5 (“Perto de você”)'), O3.kv('Guardrails', 'reclamações e cancelamentos em 7 dias')],
        cuts: [['todos', 'Todos'], ['celular', 'Celular'], ['desktop', 'Desktop']].map(function (c) { var on = c[0] === cut; return { label: c[1], cls: 'chip' + (on ? ' is-on' : ''), on: String(on), go: function () { ctx.setUi({ cut: c[0] }); } }; }),
        rows: rows, defOpen: !!ui.def, toggleDef: function () { ctx.setUi({ def: !ui.def }); }, defLabel: ui.def ? 'Ocultar definição' : 'Ler definição',
        defs: ['Pedidos enviados = pedidos enviados ÷ sessões em que a vitrine apareceu.', 'Denominador = sessões elegíveis com local definido, sem robôs.', 'Guardrail “ok” = sem piora de reclamações e cancelamentos em 7 dias.', 'Fonte: eventos da vitrine · janela 12/10–26/10 · revisado 25/10.'],
        decTitle: 'Propor próxima etapa', hasImpact: true, impact: ['Continuidade: janela até 09/11, mesma exposição.', 'Pausa: volta à regra v5; amostra guardada sem conclusão.', 'A decisão final é da alçada de experimentos.'],
        dec: O3.reason(ctx), decActs: [O3.btn(ctx, 'Propor pausa', propose('pausa'), { size: 'btn--lg', dis: blocked, why: 'Já existe proposta.' }), O3.btn(ctx, 'Propor continuidade', propose('cont'), { kind: 'btn--primary', size: 'btn--lg', dis: blocked, why: 'Já existe proposta.' })],
        rcs: rc.rcs, hasRcs: rc.hasRcs
      };
    }
  });

  // ---------- OPS13.C · pausa, retomada e histórico ----------
  REG.screen({
    page: 'operacao', key: 'ops13c', id: 'OPS13.C', title: 'Pausa e histórico', mtitle: 'Histórico', nav: 'catalogo', back: 'OPS13',
    normal: 'v5 ativa', scens: [['pendente', 'Mudança pendente'], ['parcial', 'Aplicada em parte'], ['concorrente', 'Mudança concorrente'], ['rejeitada', 'Proposta rejeitada'], ['fallback', 'Fallback ativo']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn, R = DB.o3_vitrineRegra;
      var fb = scn === 'fallback' || R.paused;
      var eff = R.paused ? 'pausada · fallback distância + recência desde ' + (R.pausedAt || U.now()) : (scn === 'fallback' ? 'fallback distância + recência desde 13:40 (4 perfis elegíveis)' : R.effective);
      var v6st = scn === 'rejeitada' ? 'Falhou' : 'Pendente', v6sub = scn === 'rejeitada' ? '25/10 · rejeitada por Caio: falta avaliação do sinal “tempo de resposta”' : R.proposedAt + ' · ' + R.proposedState;
      var steps = [
        O3.step(R.active + ' ativa', '01/10 · Lia', R.paused ? 'Pausado' : 'Confirmado'),
        O3.step(R.proposed + ' proposta', v6sub, v6st, { act: function () { GO('OPS13.A', { scn: 'semaprov' }); }, actLabel: 'Comparar' }),
        O3.step(R.retired + ' retirada', R.retiredAt + ' · substituída pela v5', 'Confirmado')
      ];
      var blocked = scn === 'pendente' || (scn === 'concorrente' && !ui.reloaded);
      var why = scn === 'pendente' ? 'Há mudança pendente de alçada. Aguarde ou retire a proposta.' : 'Caio também mudou esta regra. Recarregue antes.';
      var pause = function () {
        O3.decide(ctx, {
          title: R.paused ? 'Retomar “Perto de você” v5?' : 'Pausar “Perto de você” v5?', ok: R.paused ? 'Retomar v5' : 'Pausar', scope: 'ops13c', action: R.paused ? 'Retomada · v5' : 'Pausa · v5', target: 'Vitrine home',
          impact: R.paused ? ['Volta a ordenar por distância, avaliações elegíveis e recência.', 'Nenhum perfil é editado individualmente.'] : ['A vitrine passa ao fallback distância + recência.', 'Condição registrada: ' + R.pauseCond + '.', 'Nenhum perfil é editado individualmente; patrocínio segue desabilitado.'],
          apply: function () { R.pausedAt = U.now(); R.paused = !R.paused; }, rev: 'o3regra', data: { paused: R.paused }
        });
      };
      var alerts = [];
      if (scn === 'pendente') alerts.push(O3.alert('warn', 'Mudança pendente', 'A v6 aguarda alçada desde 24/10. Pausar ou retomar fica bloqueado até a decisão.'));
      if (scn === 'parcial') alerts.push(O3.alert('warn', 'Aplicada em parte', 'A pausa das 13:40 valeu no site, mas o app ainda mostra a v5. Consulte antes de repetir.', 'Consultar estado', function () { ctx.setUi({ cq: U.now() }); ctx.toast('Consultado às ' + U.now() + ': app confirmou a pausa'); }));
      if (scn === 'concorrente' && !ui.reloaded) alerts.push(O3.alert('warn', 'Mudança concorrente', 'Caio propôs pausar esta vitrine às 14:05. Recarregue para ver a versão atual.', 'Recarregar', function () { ctx.setUi({ reloaded: true }); ctx.toast('Versão atual carregada'); }));
      if (scn === 'rejeitada') alerts.push(O3.alert('info', 'Proposta rejeitada', 'A v6 foi rejeitada em 25/10. A v5 segue ativa; nada mudou no ar.'));
      if (fb) alerts.push(O3.alert('info', 'Fallback ativo', 'A vitrine está em distância + recência. O rótulo “ordem simplificada” aparece para quem visita.'));
      alerts.push(O3.alert('info', 'Patrocínio · futuro', 'Fica separado e identificado; não está habilitado neste desenho.'));
      var rc = O3.rcPack(ctx, 'ops13c');
      return {
        hasEyebrow: false, eyebrow: '', h1: 'Pausa e histórico', sub: 'Vitrine “Perto de você”',
        acts: [O3.btn(ctx, R.paused ? 'Revisar retomada' : 'Revisar pausa', pause, { kind: 'btn--primary', dis: blocked, why: why })],
        ctx: O3.ctx('vitrines.alterar', 'Vitrine home'), alerts: alerts, steps: steps,
        kv: [O3.kv('Estado efetivo', eff), O3.kv('Condição de pausa', R.pauseCond), O3.kv('Responsável', 'Lia M.')],
        decTitle: R.paused ? 'Retomar a regra' : 'Pausar a regra', hasImpact: true, impact: R.paused ? ['Volta à v5 em site e app.', 'Pode ser desfeito pelo recibo.'] : ['Vai para o fallback distância + recência.', 'Não edita resultado individual.', 'Pode ser desfeito pelo recibo.'],
        dec: O3.reason(ctx), decActs: [O3.btn(ctx, R.paused ? 'Retomar v5' : 'Pausar', pause, { kind: 'btn--primary', size: 'btn--lg', dis: blocked, why: why })],
        rcs: rc.rcs, hasRcs: rc.hasRcs
      };
    }
  });
})();
