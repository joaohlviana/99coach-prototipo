/* H10E / ALU09 · Evolução da aluna: minha semana (concluídas ÷ programadas), carga por sessão em gráfico SVG + tabela
   com origem, medidas opcionais (barras), objetivos, comparação só entre registros compatíveis e correção com trilha. */
REG.screen({
  page: 'aluno', key: 'evolucao', id: 'H10E', also: ['ALU09'], title: 'Evolução', mtitle: 'Evolução', nav: 'evolucao', wide: true,
  normal: 'Com histórico',
  scens: [['primeiro', 'Primeiro uso · sem histórico'], ['incompat', 'Comparação incompatível (variante diferente)'], ['correcao', 'Correção com trilha'], ['pendente', 'Atualização pendente'],
    ['semprog', 'Período sem programação exigível'], ['parcial', 'Dados parcialmente disponíveis'], ['falha', 'Falha de consulta'], ['revogado', 'Acesso revogado']],
  vals: function (ctx) {
    var A1 = window.A1, scn = ctx.scn, ui = ctx.ui;
    var ev = DB.evolucao || { agach: [], frequencia: { semana: 0, meta: 4, mes: 0 } };
    var ana = A1.me();
    var tab = ui.tab || 'ex', per = ui.per || '90';
    var dn = function (d) { var p = d.split('/'); return Number(p[1]) * 31 + Number(p[0]); };
    var since = { '30': dn('26/09'), '90': dn('28/07'), tudo: 0 }[per];
    var all = (ev.agach || []).map(function (r, i) { return { i: i, d: r[0], v: Number(r[1]) }; });
    var rows = all.filter(function (r) { return dn(r.d) >= since; });
    var trail = DB.a1_trilha || [];
    var fixOf = function (i) { return trail.filter(function (t) { return t.i === i; }).slice(-1)[0] || null; };
    // gráfico de linha (SVG): 320 × 140
    var W = 320, H = 140, px = 24, py = 18;
    var vs = rows.map(function (r) { return r.v; }), mn = Math.min.apply(null, vs.concat([Infinity])), mx = Math.max.apply(null, vs.concat([-Infinity]));
    if (!rows.length) { mn = 0; mx = 1; } if (mx - mn < 5) { mn -= 2.5; mx += 2.5; }
    var pts = rows.map(function (r, k) {
      var x = rows.length === 1 ? W / 2 : px + k * (W - 2 * px) / (rows.length - 1);
      var y = H - py - (r.v - mn) / (mx - mn) * (H - 2 * py);
      return { x: Math.round(x), y: Math.round(y), ly: Math.round(y) - 10, lbl: A1.kg(r.v), d: r.d, dy: H - 2 };
    });
    var best = all.reduce(function (b, r) { return r.v > b.v ? r : b; }, { v: 0, d: '' });
    var startFix = function (i) { return function () { ctx.setUi({ fix: String(i), fixVal: '', err: '' }); }; };
    var fixIdx = ui.fix !== undefined && ui.fix !== '' ? Number(ui.fix) : (scn === 'correcao' && all.length ? all[all.length - 1].i : -1);
    var saveFix = function () {
      var raw = String(ui.fixVal || '').trim().replace(',', '.'), nv = parseFloat(raw);
      if (!raw || isNaN(nv) || nv <= 0 || nv > 400) { ctx.setUi({ fix: String(fixIdx), err: 'Informe a carga em kg, entre 1 e 400. Ex.: 70 ou 72,5.' }); return; }
      var r = ev.agach[fixIdx]; if (!r) return;
      trail.push({ i: fixIdx, d: r[0], before: r[1], after: nv, at: '26/10 ' + U.now() });
      DB.a1_trilha = trail; r[1] = nv;
      ctx.set({ scn: '', ui: { tab: 'ex', per: per }, toast: 'Correção salva. Gráfico e recorde recalculados; a correção fica na trilha.' });
    };
    var table = rows.map(function (r) {
      var fx = fixOf(r.i), open = ui.orig === String(r.i);
      return {
        d: r.d, v: A1.kg(r.v) + ' kg × 6' + (fx ? ' · corrigido' : ''), origin: fx ? 'correção ' + fx.at : 'registrado por você',
        detail: 'Treino A · ' + r.d + ' · registrado por você no app · série com maior carga da sessão · agachamento livre com barra' + (fx ? ' · antes: ' + A1.kg(fx.before) + ' kg' : ''),
        open: open, exp: String(open), toggle: function () { ctx.setUi({ orig: open ? '' : String(r.i) }); }, fix: startFix(r.i)
      };
    });
    // semana atual (26/10 a 01/11): descanso e futuros não contam no denominador como falha
    var weekIds = A1.DAYS.map(function (d) { return d[1]; });
    var prog = DB.meusTreinos.filter(function (x) { return weekIds.indexOf(x.day) >= 0; });
    var concl = prog.filter(function (x) { return x.status === 'concluído'; }).length;
    var dots = A1.DAYS.map(function (d) {
      var t = DB.meusTreinos.filter(function (x) { return x.day === d[1]; })[0];
      var k = t ? (t.status === 'concluído' ? 'ok' : (d[1] === 'seg 26/10' ? 'cur' : 'next')) : 'rest';
      return { l: d[2], s: k === 'ok' ? '✓' : (k === 'rest' ? '—' : t.name.split(' · ')[0].replace('Treino ', '')), cls: 'a1-dot a1-dot--' + k, title: d[1] + ': ' + (t ? t.name + ' · ' + t.status : 'sem treino programado') };
    });
    var avs = (DB.avaliacoes || []).filter(function (a) { return a.student === 'ana'; });
    var mk = ui.mk || 'weight';
    var MK = { weight: ['Peso', 'kg'], fat: ['% gordura', '%'], waist: ['Cintura', 'cm'] };
    var mvals = avs.map(function (a) { return a[mk]; }), mmax = Math.max.apply(null, mvals.concat([1])), mmin = Math.min.apply(null, mvals.concat([0]));
    var bars = avs.map(function (a) { var h = 40 + Math.round((a[mk] - mmin) / ((mmax - mmin) || 1) * 60); return { d: a.date, v: A1.kg(a[mk]) + ' ' + MK[mk][1], h: h + '%' }; });
    var al = A1.alert(ctx, {
      incompat: { k: 'warn', t: 'Registros não comparáveis', x: 'Barra livre e Smith são variantes diferentes. Mostramos separados, sem misturar no gráfico.', b: 'Consultar de novo' },
      correcao: { k: 'info', t: 'Corrigir registro', x: 'A carga de 22/10 foi digitada errada? Corrija abaixo. O gráfico e o recorde são recalculados; a correção fica na trilha.' },
      pendente: { k: 'info', t: 'Atualização pendente', x: 'O treino de hoje entra aqui quando sincronizar. Nada do que você registrou se perdeu.' },
      semprog: { k: 'info', t: 'Sem programação nesta semana', x: 'Rafael não programou sessões para este período, então não há o que contar. Atividade extra não vira sessão perdida.' },
      parcial: { k: 'warn', t: 'Dados parcialmente disponíveis', x: 'As medidas não carregaram. Cargas e semana estão atualizadas.', b: 'Consultar de novo' },
      falha: { k: 'risk', t: 'Falha de consulta', x: 'Não conseguimos carregar sua evolução. Seus registros continuam salvos.', b: 'Corrigir' },
      revogado: { k: 'risk', t: 'Acesso revogado', x: 'O compartilhamento destas medidas com Rafael foi encerrado em 20/10. Seus próprios registros continuam com você.', b: 'Saiba por quê', f: function () { GO('ALU11'); } }
    });
    var first = scn === 'primeiro', fail = scn === 'falha', rev = scn === 'revogado';
    var showMain = !first && !fail && !rev, incompat = scn === 'incompat';
    var fixRow = fixIdx >= 0 && all.filter(function (r) { return r.i === fixIdx; })[0];
    return {
      al: al, eyebrow: 'Últimos ' + (per === 'tudo' ? 'registros' : per + ' dias') + ' · com Rafael Lima',
      isFirst: first, showMain: showMain, isIncompat: incompat && showMain, notIncompat: !incompat && showMain,
      goToday: function () { GO('ALU02', { id: 't1' }); }, goTrain: function () { GO('ALU03'); }, goCoach: function () { GO('ALU11'); },
      semN: scn === 'semprog' ? '—' : concl + ' de ' + prog.length,
      semTxt: scn === 'semprog' ? 'Nenhuma sessão programada nesta semana.' : 'sessões programadas concluídas nesta semana (26/10 a 01/11). Descanso e treinos futuros não contam como falta.',
      dots: dots,
      semPrev: 'Semana passada (19 a 25/10): ' + ev.frequencia.semana + ' de ' + ev.frequencia.meta + ' concluídas · Outubro: ' + ev.frequencia.mes + ' sessões concluídas · fonte: seus registros',
      tabs: [['ex', 'Exercício'], ['medidas', 'Medidas']].map(function (t) { var on = tab === t[0]; return { l: t[1], cls: 'seg__it' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ tab: t[0] }); } }; }),
      isEx: tab === 'ex', isMed: tab === 'medidas',
      pers: [['30', '30 dias'], ['90', '90 dias'], ['tudo', 'Tudo']].map(function (p) { var on = per === p[0]; return { l: p[1], cls: 'seg__it' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ per: p[0] }); } }; }),
      hasRows: rows.length > 0, noRows: rows.length === 0,
      vb: '0 0 ' + W + ' ' + H, poly: pts.map(function (p) { return p.x + ',' + p.y; }).join(' '), pts: pts,
      grid: [py, Math.round(H / 2), H - py].map(function (y) { return { y: y }; }), gx2: W,
      chartLbl: 'Agachamento livre: carga por sessão, de ' + (rows[0] ? A1.kg(rows[0].v) : '0') + ' a ' + (rows.length ? A1.kg(rows[rows.length - 1].v) : '0') + ' kg',
      summary: rows.length ? A1.kg(rows[0].v) + ' → ' + A1.kg(rows[rows.length - 1].v) + ' kg × 6 · mesma variante (barra livre)' : '',
      record: best.v ? 'Recorde: ' + A1.kg(best.v) + ' kg × 6 em ' + best.d : '',
      table: table,
      isFix: !!fixRow && showMain, fixD: fixRow ? fixRow.d : '', fixBefore: fixRow ? A1.kg(fixRow.v) + ' kg' : '',
      fixVal: ui.fixVal || '', setFix: function (ev2) { ctx.setUi({ fix: String(fixIdx), fixVal: U.val(ev2), err: '' }); }, saveFix: saveFix, cancelFix: function () { ctx.set({ scn: '', ui: { tab: tab, per: per } }); },
      hasErr: !!ui.err, err: ui.err || '',
      trail: trail.map(function (t) { return { t: 'Carga ' + t.d + ': ' + A1.kg(t.before) + ' → ' + A1.kg(t.after) + ' kg · ' + t.at }; }), hasTrail: trail.length > 0,
      medFail: scn === 'parcial', medOk: scn !== 'parcial',
      mks: Object.keys(MK).map(function (k) { var on = mk === k; return { l: MK[k][0], cls: 'chip' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ mk: k, tab: 'medidas' }); } }; }),
      bars: bars, medSrc: 'Avaliações com Rafael · protocolo ' + (avs[0] ? avs[0].protocol : '') + ' · mesmo protocolo em todas',
      goals: [[ana.goal || 'Objetivo do acompanhamento', 'definido com Rafael em 03/2026'], ['Agachar 80 kg × 5', 'até 15/12 · definido por Rafael em 02/09 · v2'], ['4 treinos por semana', 'acompanhado em Minha semana']].map(function (g) { return { t: g[0], s: g[1] }; })
    };
  }
});
