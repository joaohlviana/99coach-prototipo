/* O6 · FA07 Políticas comerciais versionadas (+ A catálogo, B Pro, C tarifas, D simulação, E revisão e vigência, F histórico).
   Regra: nada é editado no lugar. Mudança é versão nova, com vigência futura, revisão por alçada e trilha. Consumo passado não é reprecificado. */
(function () {
  var O6 = window.O6;
  DB.seed('o6_politicas', {
    versions: [
      { v: 'v2', status: 'vigente', desde: '01/10/2026 00:00 BRT', por: 'Bia F.', decisao: '2026-09-28.1' },
      { v: 'v3', status: 'proposta', desde: 'a definir na aprovação', por: 'Lia M.', em: '24/10', decisao: '—' }
    ],
    rules: [
      { id: 'R1', name: 'Taxa da plataforma', short: 'Taxa', a: '5%', b: '5%', ok: true, escopo: 'vendas processadas de coaching e programas', resp: 'plataforma' },
      { id: 'R2', name: 'Saque mínimo', short: 'Mínimo', a: 'R$ 50,00', b: 'R$ 50,00', ok: false, escopo: 'envio ao banco do treinador', resp: 'plataforma' },
      { id: 'R3', name: 'Pro mensal', short: 'Pro', a: 'R$ 99,00/mês', b: 'R$ 99,00/mês', ok: true, escopo: 'platform_subscription · BR · BRL', resp: 'comercial' },
      { id: 'R4', name: 'Prazo de repasse', short: 'Repasse', a: 'D+30', b: 'D+30', ok: false, escopo: 'recebíveis de coaching e programas', resp: 'plataforma' },
      { id: 'R5', name: 'Ajustes e estornos', short: 'Ajustes', a: 'treinador, proporcional', b: 'treinador, proporcional', ok: false, escopo: 'reembolsos e disputas', resp: 'treinador' },
      { id: 'R6', name: 'Fator de custo IA', short: 'Fator IA', a: '10×', b: '15× (proposto)', ok: false, escopo: 'consumo de créditos da assistência', resp: 'comercial', diff: true },
      { id: 'R7', name: 'Teto por tarefa de IA', short: 'Teto IA', a: '600 créditos', b: '600 créditos', ok: false, escopo: 'assistência · por tarefa', resp: 'produto' },
      { id: 'R8', name: 'Franquia mensal', short: 'Franquia', a: '6.000 créditos', b: '6.000 créditos', ok: true, escopo: 'Pro mensal e anual', resp: 'comercial' }
    ]
  });
  DB.seed('o6_catalogo', [
    { id: 'c1', fam: 'platform_subscription', oferta: 'Pro mensal', publico: 'treinador', canal: 'web · BR · BRL', ver: 'v1', vig: '—', resp: 'Lia M.', status: 'proposta' },
    { id: 'c2', fam: 'platform_subscription', oferta: 'Pro anual', publico: 'treinador', canal: 'web · BR · BRL', ver: 'v1', vig: '—', resp: 'Lia M.', status: 'proposta' },
    { id: 'c3', fam: 'coaching_plan', oferta: 'Comissão', publico: 'vendas do treinador', canal: 'web · BR · BRL', ver: 'v1', vig: '—', resp: 'Lia M.', status: 'proposta' },
    { id: 'c4', fam: 'IA', oferta: 'Tarifa técnica', publico: 'interno', canal: 'fornecedor modelo-a · USD', ver: 't-2', vig: 'desde 01/10', resp: 'Bia F.', status: 'ativa' }
  ]);
  DB.seed('o6_pro', { ver: 'v2', status: 'rascunho', mensal: 99, anual: 990, trial: 7, quotaMes: 6000, quotaTrial: 750, savedAt: '26/10 · 14:02 BRT', vig: '01/12', motivo: '', recibo: '', aprovador: '' });
  DB.seed('o6_tarifas', { ativa: 't-2', proposta: null, cambio: 5.42, cambioData: '26/10', cambioVence: '27/10', fator: 15, credito: 0.01, teto: 600,
    rows: [{ u: 'Entrada · 1 M tokens', t: 3, fonte: 'tabela 01/10 · validade 01/01' }, { u: 'Saída · 1 M tokens', t: 15, fonte: 'idem' }, { u: 'Cache · 1 M tokens', t: 0.3, fonte: 'idem' }] });
  DB.seed('o6_comissao', [
    { id: 'v1', v: 'v1', status: 'proposta', em: '24/10', decisao: '2026-10-26.2', valor: '5%', vig: 'a definir', autor: 'Lia M.', motivo: 'comissão inicial do marketplace', contratos: 0 },
    { id: 'v0', v: 'v0', status: 'retirada', em: '15/09', decisao: '2026-09-15.4', valor: '7%', vig: 'nunca vigorou', autor: 'Bia F.', motivo: 'substituída antes da vigência', contratos: 0 }
  ]);
  var CAT_TONE = { proposta: 'warn', aprovada: 'info', ativa: 'ok', retirada: 'plain', rascunho: 'plain', vigente: 'ok', 'em aprovação': 'info' };

  // ---------- FA07 · Políticas comerciais versionadas ----------
  REG.screen({
    page: 'operacao', key: 'fa07', id: 'FA07', title: 'Políticas comerciais', mtitle: 'Políticas', nav: 'financeiro', back: 'H14', wide: true,
    testIds: ['R6'],
    normal: 'Comparação v2 × v3',
    scens: [['proposta', 'Proposta'], ['vigente', 'Vigente'], ['comparacao', 'Comparação 10× vs 15×']],
    vals: function (ctx) {
      var P = DB.o6_politicas, scn = ctx.scn, md = O6.md(ctx, scn === 'comparacao' ? 'R6' : 'R1');
      var view = O6.uiv(ctx, 'view', scn === 'vigente' ? 'a' : (scn === 'proposta' ? 'b' : 'ab'));
      var r = P.rules.find(function (x) { return x.id === md.sel; }) || P.rules[0];
      var cols = view === 'ab' ? ['Regra', 'Vigente v2', 'Proposta v3', ''] : ['Regra', view === 'a' ? 'Vigente v2' : 'Proposta v3', ''];
      var rows = P.rules.map(function (x) {
        var val = view === 'b' ? x.b : x.a;
        var cells = view === 'ab' ? [{ t: x.name, b: true }, x.a, x.diff ? { t: x.b, tone: 'warn' } : x.b, x.id + (x.ok ? ' ✓' : '')] : [{ t: x.name, b: true }, val, x.id + (x.ok ? ' ✓' : '')];
        return { title: x.short + ' ' + val, sub: x.id + (x.ok ? ' ✓ decidido' : ' · a validar') + (view === 'ab' && x.diff ? ' · muda para ' + x.b : ''), ic: 'list', badge: x.diff && view !== 'a' ? ['muda', 'warn'] : null, on: x.id === r.id, go: md.pick(x.id), goLabel: 'Detalhe', cells: cells };
      });
      var recalc = !!ctx.ui.recalc;
      var alerts = [];
      if (scn === 'proposta') alerts.push({ tone: 'info', title: 'Proposta v3 · vale só após aprovação', text: ctx.ui.why ? 'Uma proposta não muda nenhuma cobrança. Ela só passa a valer depois da revisão pela alçada comercial e com data de vigência futura; contratos existentes guardam a versão aceita.' : 'Nada muda para treinadores ou alunos enquanto a v3 for proposta.', btns: [ctx.ui.why ? null : { label: 'Saiba por quê', kind: 'ghost', go: function () { ctx.setUi({ why: true }); } }, { label: 'Revisão e vigência', kind: 'outline', go: function () { GO('FA07.E'); } }] });
      if (scn === 'vigente') alerts.push({ tone: 'ok', title: 'v2 vigente', text: 'Desde ' + P.versions[0].desde + ', por ' + P.versions[0].por + ' · decisão ' + P.versions[0].decisao + '.' });
      if (scn === 'comparacao') alerts.push({ tone: recalc ? 'ok' : 'warn', title: 'Comparação 10× vs 15×', text: recalc ? 'Recalculado às ' + U.now() + ' BRT com câmbio R$ 5,42 (26/10). Em 6.000 créditos: custo-base R$ 6,00 com 10× e R$ 4,00 com 15×.' : 'Calculada às 13:50 com câmbio de 25/10 (R$ 5,40). Consulte de novo para usar o câmbio de 26/10.', btns: [recalc ? null : { label: 'Consultar de novo', kind: 'outline', ic: 'refresh', go: function () { ctx.setUi({ recalc: true }); } }, { label: 'Abrir simulação', kind: 'ghost', go: function () { GO('FA07.D'); } }] });
      return O6.page(ctx, {
        title: 'Políticas comerciais', sub: 'v3 proposta · v2 vigente',
        acts: [{ label: 'Catálogo e versões', kind: 'outline', go: function () { GO('FA07.A'); } }, { label: 'Nova versão', kind: 'primary', ic: 'plus', go: function () { GO('FA07.F'); } }],
        ctx: O6.ctx('politicas.ler', 'BR · BRL'),
        alerts: alerts, sel: md.mSel, mBack: md.mSel ? md.back : null,
        main: [
          { t: 'table', role: 'master', title: 'Regras', sub: 'fonte: catálogo comercial · ' + O6.NOW, seg: [{ label: 'Comparar', on: view === 'ab', pick: function () { ctx.setUi({ view: 'ab' }); } }, { label: 'Vigente v2', on: view === 'a', pick: function () { ctx.setUi({ view: 'a' }); } }, { label: 'Proposta v3', on: view === 'b', pick: function () { ctx.setUi({ view: 'b' }); } }], cols: cols, rows: rows },
          { t: 'note', role: 'master', tone: 'info', nTitle: 'Consumo passado', text: 'Não é reprecificado. Cada contrato e cada tarefa guardam a versão que estava valendo.' }
        ],
        rail: [
          { t: 'kv', role: 'detail', title: r.id + ' · ' + r.name, badge: r.ok ? ['decidido', 'ok'] : ['a validar', 'warn'], rows: [
            ['Vigente v2', r.a, 'desde ' + P.versions[0].desde],
            ['Proposta v3', r.b, 'proposta por ' + P.versions[1].por + ' em ' + P.versions[1].em],
            ['Escopo', r.escopo], ['Responsável', r.resp],
            ['Vigência da v3', P.versions[1].desde], ['Passado', 'não é reprecificado']
          ], btns: [{ label: 'Histórico de versões', kind: 'ghost', go: function () { GO('FA07.F'); } }] },
          { t: 'list', role: 'master', title: 'Subtelas', rows: [
            O6.link('Catálogo e versões', 'Ofertas, público, versão e situação', 'list', 'FA07.A'),
            O6.link('Pro, ciclos e benefícios', 'Rascunho v2 · mensal e anual', 'crown', 'FA07.B'),
            O6.link('Tarifas técnicas e créditos', 'Tabela t-2 ativa · t-3 proposta', 'sparkle', 'FA07.C'),
            O6.link('Simulação de impacto', '10× × 15× · cenário sintético', 'chart', 'FA07.D'),
            O6.link('Revisão, aprovação e vigência', 'Pro v2 → alçada comercial', 'checksq', 'FA07.E'),
            O6.link('Histórico e correção', 'Comissão · versões e trilha', 'clock', 'FA07.F')
          ] }
        ]
      });
    }
  });

  // ---------- FA07.A · Catálogo e versões ----------
  REG.screen({
    page: 'operacao', key: 'fa07a', id: 'FA07.A', title: 'Catálogo comercial', nav: 'financeiro', back: 'FA07', wide: true,
    testIds: ['c4'],
    scens: [['semaprov', 'Sem aprovação'], ['conflito', 'Conflito'], ['indisp', 'Catálogo indisponível']],
    vals: function (ctx) {
      var scn = ctx.scn, md = O6.md(ctx, 'c1');
      var f = O6.uiv(ctx, 'f', 'todas'), q = U.norm(O6.uiv(ctx, 'q', ''));
      var all = scn === 'indisp' ? [] : DB.o6_catalogo.slice();
      if (scn === 'conflito') all.push({ id: 'c3b', fam: 'coaching_plan', oferta: 'Comissão', publico: 'vendas do treinador', canal: 'web · BR · BRL', ver: 'v1b', vig: '01/12 (proposta)', resp: 'Bia F.', status: 'proposta' });
      var list = all.filter(function (c) { return (f === 'todas' || c.status === f) && (!q || U.norm(c.fam + ' ' + c.oferta + ' ' + c.publico).indexOf(q) >= 0); });
      var c = all.find(function (x) { return x.id === md.sel; }) || all[0] || null;
      var dup = function (src) { return function () {
        var same = DB.o6_catalogo.filter(function (x) { return x.oferta === src.oferta; }).length;
        var n = { id: DB.uid('c'), fam: src.fam, oferta: src.oferta, publico: src.publico, canal: src.canal, ver: (src.ver.charAt(0) === 't' ? 't-' : 'v') + (src.ver.charAt(0) === 't' ? (+src.ver.slice(2) + same) : (+src.ver.slice(1) + same)), vig: '—', resp: O6.ME, status: 'rascunho' };
        DB.o6_catalogo.push(n); ctx.setUi({ sel: n.id, mList: false }); ctx.toast('Rascunho ' + n.oferta + ' ' + n.ver + ' criado a partir de ' + src.ver + '. A versão original não muda.');
      }; };
      var rows = list.map(function (x) {
        return { title: x.oferta + ' · ' + x.ver, sub: x.fam + ' · ' + x.publico + ' · ' + x.status, ic: 'tag', on: c && x.id === c.id, go: md.pick(x.id), badge: [x.status, CAT_TONE[x.status] || 'plain'],
          cells: [x.fam, { t: x.oferta, b: true }, x.publico, x.ver, x.vig, { t: x.status, tone: CAT_TONE[x.status] || 'plain' }] };
      });
      var alerts = [];
      if (scn === 'semaprov') alerts.push({ tone: 'warn', title: 'Sem aprovação', text: 'Nenhuma versão do Pro foi aprovada pela alçada comercial. A venda do Pro segue fechada; o catálogo mostra só propostas.', btns: [{ label: 'Revisão e vigência', kind: 'outline', go: function () { GO('FA07.E'); } }] });
      if (scn === 'conflito') alerts.push({ tone: 'risk', title: 'Conflito', text: 'Duas propostas para Comissão com a mesma vigência (v1 de Lia M. e v1b de Bia F.). Só uma pode seguir para aprovação.', btns: [{ label: 'Comparar no histórico', kind: 'outline', go: function () { GO('FA07.F'); } }] });
      if (scn === 'indisp') alerts.push({ tone: 'risk', title: 'Catálogo indisponível', text: 'Não foi possível carregar o catálogo às 14:02. Nenhuma oferta foi presumida.', btns: [{ label: 'Tentar de novo', kind: 'outline', ic: 'refresh', go: function () { ctx.toast('Catálogo ainda indisponível às ' + U.now() + ' BRT.'); } }] });
      return O6.page(ctx, {
        title: 'Catálogo comercial', sub: 'Versões de oferta',
        acts: [c ? { label: 'Duplicar como rascunho', kind: 'primary', go: dup(c) } : null],
        ctx: O6.ctx('politicas.ler', 'BR · BRL'),
        alerts: alerts, sel: md.mSel && !!c, mBack: md.mSel && c ? md.back : null,
        main: [
          { t: 'form', role: 'master', bare: true, fields: [
            O6.text(ctx, 'q', 'Buscar família ou oferta', { ph: 'Ex.: Pro, comissão' }),
            O6.chips(ctx, 'f', 'Situação', [['todas', 'Todas'], ['rascunho', 'Rascunho'], ['proposta', 'Proposta'], ['aprovada', 'Aprovada'], ['ativa', 'Ativa'], ['retirada', 'Retirada']], 'todas')
          ] },
          { t: 'table', role: 'master', title: 'Ofertas e versões', sub: U.plural(rows.length, 'versão', 'versões') + ' · fonte: catálogo · ' + O6.NOW, cols: ['Família', 'Oferta', 'Público', 'Versão', 'Vigência', 'Situação'], rows: rows, emptyText: scn === 'indisp' ? 'Catálogo indisponível. Tente de novo em alguns minutos.' : 'Nenhuma versão com este filtro.' },
          { t: 'note', role: 'master', tone: 'info', text: 'Três famílias comerciais: platform_subscription, coaching_plan e program, mais a tarifa técnica interna de IA. Não crie um quarto tipo comercial.' }
        ],
        rail: [c ? { t: 'kv', role: 'detail', title: c.oferta + ' · ' + c.ver, badge: [c.status, CAT_TONE[c.status] || 'plain'], rows: [['Situação', c.status], ['Família', c.fam], ['Público', c.publico], ['Canal · mercado · moeda', c.canal], ['Vigência', c.vig], ['Responsável', c.resp]],
          btns: [{ label: 'Duplicar como rascunho', kind: 'outline', go: dup(c) }, { label: 'Comparar', kind: 'ghost', go: function () { GO(c.fam === 'IA' ? 'FA07.C' : (c.fam === 'coaching_plan' ? 'FA07.F' : 'FA07.E')); } }] } : { t: 'emp', role: 'detail', bare: false, ic: 'list', eTitle: 'Nada selecionado', text: 'O catálogo não carregou.' }]
      });
    }
  });

  // ---------- FA07.B · Pro, ciclos e benefícios ----------
  function proVals(ctx) {
    var p = DB.o6_pro;
    return { mensal: O6.num(O6.uiv(ctx, 'mensal', String(p.mensal).replace('.', ','))), anual: O6.num(O6.uiv(ctx, 'anual', String(p.anual).replace('.', ','))), quotaMes: O6.num(O6.uiv(ctx, 'qm', String(p.quotaMes))), quotaTrial: O6.num(O6.uiv(ctx, 'qt', String(p.quotaTrial))) };
  }
  REG.screen({
    page: 'operacao', key: 'fa07b', id: 'FA07.B', title: 'Pro · ciclos e benefícios', mtitle: 'Pro', nav: 'financeiro', back: 'FA07', wide: true,
    scens: [['pendente', 'Preço/quota pendente'], ['invalida', 'Combinação inválida'], ['loja', 'Regra de loja pendente']],
    vals: function (ctx) {
      var scn = ctx.scn, p = DB.o6_pro;
      if (scn === 'pendente' && ctx.ui.mensal === undefined) ctx.ui.mensal = '';
      if (scn === 'invalida' && ctx.ui.anual === undefined) ctx.ui.anual = '1.200,00';
      var v = proVals(ctx), ciclo = O6.uiv(ctx, 'ciclo', 'mensal');
      var errM = !v.mensal ? 'Informe o preço mensal (pendente de decisão comercial).' : '';
      var errA = !v.anual ? 'Informe o preço anual total.' : (v.mensal && v.anual >= v.mensal * 12 ? 'Combinação inválida: anual de ' + O6.brl(v.anual) + ' não pode ser maior ou igual a 12× o mensal (' + O6.brl(v.mensal * 12) + ').' : '');
      var errQ = !v.quotaMes ? 'Informe a franquia mensal.' : '';
      var ok = !errM && !errA && !errQ;
      var prev = !!ctx.ui.prev;
      var save = function () {
        if (!ok) { ctx.setUi({ tried: true }); ctx.toast('Corrija os campos marcados antes de salvar.'); return; }
        p.mensal = v.mensal; p.anual = v.anual; p.quotaMes = v.quotaMes; p.quotaTrial = v.quotaTrial; p.savedAt = O6.stamp(); p.status = 'rascunho';
        ctx.toast('Rascunho v2 salvo às ' + U.now() + '. Nada muda para treinadores até aprovação e vigência.');
      };
      var alerts = [];
      if (scn === 'pendente') alerts.push({ tone: 'warn', title: 'Preço pendente', text: 'O preço mensal ainda não foi decidido pela alçada comercial. O rascunho pode ser salvo só quando todos os valores estiverem preenchidos.' });
      if (scn === 'invalida') alerts.push({ tone: 'risk', title: 'Combinação inválida', text: 'O anual precisa sair mais barato que 12 mensalidades e ter as mesmas funções.' });
      if (scn === 'loja') alerts.push({ tone: 'warn', title: 'Regra de loja pendente', text: 'Vender o Pro dentro do app depende da regra da loja (iOS e Android). Por enquanto, só na web; o app não mostra preço nem botão de compra.' });
      var annualMonth = v.anual ? O6.brl(v.anual / 12) + '/mês' : '—';
      return O6.page(ctx, {
        title: 'Pro · ciclos e benefícios', sub: 'Rascunho v2 · salvo ' + p.savedAt,
        acts: [{ label: prev ? 'Fechar pré-visualização' : 'Pré-visualizar oferta e aceite', kind: 'outline', ic: 'eye', go: function () { ctx.setUi({ prev: !prev }); } }, { label: 'Salvar rascunho', kind: 'primary', ic: 'save', go: save }],
        ctx: O6.ctx('politicas.editar', 'platform_subscription · Pro'),
        alerts: alerts,
        main: [
          { t: 'form', title: 'Parâmetros permitidos', sub: 'Mensal e anual têm as mesmas funções; muda só o ciclo de cobrança.', seg: [{ label: 'Mensal', on: ciclo === 'mensal', pick: function () { ctx.setUi({ ciclo: 'mensal' }); } }, { label: 'Anual', on: ciclo === 'anual', pick: function () { ctx.setUi({ ciclo: 'anual' }); } }], segLabel: 'Ciclo',
            fields: ciclo === 'mensal' ? [
              O6.text(ctx, 'mensal', 'Preço mensal', { def: String(p.mensal).replace('.', ','), fix: 'BRL/mês', mode: 'decimal', err: errM }),
              O6.text(ctx, 'qm', 'Franquia mensal', { def: String(p.quotaMes), fix: 'créditos', mode: 'numeric', err: errQ, help: 'O anual recebe a franquia por mês contratual.' }),
              O6.text(ctx, 'qt', 'Franquia do teste', { def: String(p.quotaTrial), fix: 'créditos', mode: 'numeric' }),
              O6.locked('Teste', p.trial + ' dias · decidido', 'Não muda por conveniência do DS.')
            ] : [
              O6.text(ctx, 'anual', 'Preço anual total', { def: String(p.anual).replace('.', ','), fix: 'BRL/ano', mode: 'decimal', err: errA, help: 'Equivale a ' + annualMonth + '. Mostre sempre o total do ano.' }),
              O6.locked('Franquia', O6.int(v.quotaMes) + ' créditos por mês contratual'),
              O6.locked('Teste', p.trial + ' dias · decidido')
            ] },
          prev ? { t: 'kv', title: 'Pré-visualização · oferta e aceite', sub: 'Como o treinador vê antes de aceitar', badge: ['prévia', 'info'], rows: [
            ['Hoje', 'R$ 0,00 · teste de ' + p.trial + ' dias com ' + O6.int(v.quotaTrial) + ' créditos'],
            ['Primeira cobrança', ciclo === 'mensal' ? '02/11 · ' + O6.brl(v.mensal) : '02/11 · ' + O6.brl(v.anual) + ' (ano inteiro)'],
            ['Depois', ciclo === 'mensal' ? O6.brl(v.mensal) + ' todo dia 02' : 'renova em 02/11/2027 por ' + O6.brl(v.anual)],
            ['Cancelamento', 'no painel, a qualquer momento · garantia de 7 dias após a 1ª cobrança'],
            ['Anual', 'devolução proporcional ao cancelar']
          ] } : null
        ],
        rail: [
          { t: 'kv', title: 'Resumo do rascunho', rows: [
            ['Planos', 'Essencial grátis (até 3 alunos) · Pro (até 50)'],
            ['Funções', 'iguais no mensal e no anual'],
            ['Preço total', (v.mensal ? O6.brl(v.mensal) + '/mês' : 'pendente') + ' · anual ' + (v.anual ? O6.brl(v.anual) + ' (' + annualMonth + ')' : 'pendente')],
            ['Teste', p.trial + ' dias · decidido'],
            ['Franquia', O6.int(v.quotaMes) + ' créditos/mês · teste ' + O6.int(v.quotaTrial)],
            ['Cancelamento', 'no painel · garantia de 7 dias após a 1ª cobrança · anual com devolução proporcional'],
            ['Acesso manual', 'preservado para quem já tem']
          ], foot: 'Rascunho não é contrato: vale só depois de aprovação e vigência (FA07.E).', btns: [{ label: 'Revisão e vigência', kind: 'ghost', go: function () { GO('FA07.E'); } }] }
        ]
      });
    }
  });

  // ---------- FA07.C · Tarifas técnicas, créditos e limites ----------
  function simCalc(T, kin, kout, kcache, fator) {
    var usd = kin * 1000 / 1e6 * T.rows[0].t + kout * 1000 / 1e6 * T.rows[1].t + kcache * 1000 / 1e6 * T.rows[2].t;
    var brl = usd * T.cambio, tar = brl * fator;
    return { usd: usd, brl: brl, tar: tar, cred: Math.ceil(tar / T.credito) };
  }
  REG.screen({
    page: 'operacao', key: 'fa07c', id: 'FA07.C', title: 'Tarifas técnicas e créditos', mtitle: 'Tarifas', nav: 'financeiro', back: 'FA07', wide: true,
    scens: [['vencida', 'Tarifa vencida'], ['usage', 'Usage ausente'], ['moeda', 'Moeda incompatível'], ['voo', 'Reserva em voo']],
    vals: function (ctx) {
      var T = DB.o6_tarifas, scn = ctx.scn;
      var vencida = scn === 'vencida' && !ctx.ui.cambioOk;
      var kin = O6.num(O6.uiv(ctx, 'kin', '8')), kout = O6.num(O6.uiv(ctx, 'kout', '1,5')), kc = O6.num(O6.uiv(ctx, 'kc', '0'));
      var s15 = simCalc(T, kin, kout, kc, 15), s10 = simCalc(T, kin, kout, kc, 10);
      var showSim = !!ctx.ui.sim;
      var vig = O6.uiv(ctx, 'vig', '01/12'), motivo = String(O6.uiv(ctx, 'motivo', ''));
      var saveV = function () {
        if (!motivo.trim()) { ctx.setUi({ tried: true, form: true }); return; }
        ctx.ask({ title: 'Salvar tabela t-3 como proposta?', text: 'A t-2 continua ativa. A t-3 só vale depois de aprovação, a partir de ' + vig + ' 00:00 BRT; tarefas já liquidadas não mudam.', lines: ['Tarifas: entrada US$ 3,00 · saída US$ 15,00 · cache US$ 0,30 por 1 M tokens', 'Câmbio de referência: R$ 5,42 (26/10, vence 27/10)', 'Fator: 15× · 1 crédito = R$ 0,01', 'Motivo: ' + motivo], ok: 'Salvar versão', onOk: function () {
          T.proposta = { v: 't-3', vig: vig, por: O6.ME, em: O6.stamp(), motivo: motivo };
          var r = O6.receipt({ acao: 'Tabela de tarifas t-3 salva como proposta', alvo: 'Fornecedor modelo-a', motivo: motivo, efeito: 'vigência proposta ' + vig + ' · t-2 segue ativa' });
          ctx.setUi({ form: false, tried: false }); ctx.toast('Versão t-3 salva como proposta · recibo ' + r.id + '.');
        } });
      };
      var alerts = [];
      if (vencida) alerts.push({ tone: 'risk', title: 'Tarifa vencida', text: 'O câmbio de referência venceu em 25/10. Simular ou salvar com câmbio vencido daria custo errado.', btns: [{ label: 'Consultar câmbio', kind: 'outline', ic: 'refresh', go: function () { ctx.setUi({ cambioOk: true }); ctx.toast('Câmbio atualizado: R$ 5,42 · fonte PTAX venda · 26/10.'); } }] });
      if (scn === 'usage') alerts.push({ tone: 'warn', title: 'Usage ausente', text: 'O fornecedor não informou tokens de 3 tarefas de 25/10. O custo delas fica “pendente”, nunca estimado como zero.' });
      if (scn === 'moeda') alerts.push({ tone: 'risk', title: 'Moeda incompatível', text: 'A tabela nova do fornecedor veio em EUR. Converta pela fonte oficial e registre a fonte antes de salvar; não some moedas.' });
      if (scn === 'voo') alerts.push({ tone: 'info', title: 'Reserva em voo', text: '14 tarefas têm créditos reservados agora. Elas liquidam pela tabela t-2, mesmo que a t-3 seja aprovada.' });
      var proposta = T.proposta;
      return O6.page(ctx, {
        title: 'Tarifas técnicas e créditos', sub: 'Tabela t-3 · proposta',
        acts: [{ label: 'Simular tarefa', kind: 'outline', ic: 'play', dis: vencida, go: function () { ctx.setUi({ sim: true }); } }, { label: 'Salvar versão', kind: 'primary', ic: 'save', dis: vencida || scn === 'moeda' || !!proposta, go: function () { ctx.setUi({ form: true }); } }],
        ctx: O6.ctx('politicas.editar · IA', 'Fornecedor modelo-a'),
        alerts: alerts,
        main: [
          { t: 'table', title: 'Tabela do fornecedor', sub: 'Custo técnico por unidade · não é preço ao treinador', cols: ['Unidade', 'Tarifa', 'Moeda', 'Fonte e validade'], rows: T.rows.map(function (r) { return { title: r.u, sub: O6.usd(r.t) + ' · ' + r.fonte, ic: 'hash', cells: [{ t: r.u, b: true }, O6.usd(r.t), scn === 'moeda' ? { t: 'EUR?', tone: 'risk' } : 'USD', r.fonte] }; }) },
          showSim ? { t: 'form', title: 'Simular tarefa', sub: 'Milhares de tokens da tarefa', fields: [
            O6.text(ctx, 'kin', 'Entrada', { def: '8', fix: 'mil tokens', mode: 'decimal' }),
            O6.text(ctx, 'kout', 'Saída', { def: '1,5', fix: 'mil tokens', mode: 'decimal' }),
            O6.text(ctx, 'kc', 'Cache', { def: '0', fix: 'mil tokens', mode: 'decimal' })
          ] } : null,
          showSim ? { t: 'kv', title: 'Resultado da simulação', sub: 'Tarifa, consumo em créditos e dinheiro, separados', rows: [
            ['Custo técnico', O6.usd(s15.usd), 'tabela t-2 · USD'],
            ['Em reais', O6.brl(s15.brl), 'câmbio R$ 5,42 · 26/10'],
            ['Consumo tarifado · 15×', O6.brl(s15.tar) + ' = ' + O6.int(s15.cred) + ' créditos', 'decidido'],
            ['Comparação · 10×', O6.brl(s10.tar) + ' = ' + O6.int(s10.cred) + ' créditos', 'só comparação'],
            ['Teto por tarefa', s15.cred > T.teto ? 'acima do teto (' + T.teto + ' créditos): a tarefa seria recusada antes de começar' : 'dentro do teto de ' + T.teto + ' créditos', '', s15.cred > T.teto ? 'risk' : 'ok']
          ] } : null,
          ctx.ui.form ? { t: 'form', title: 'Salvar tabela t-3 como versão nova', sub: 'A t-2 não é editada.', fields: [
            O6.chips(ctx, 'vig', 'Vigência proposta', [['01/12', '01/12 00:00 BRT'], ['01/01', '01/01 00:00 BRT']], '01/12'),
            O6.motivo(ctx, 'motivo', { ph: 'Ex.: fornecedor publicou tabela nova em 20/10' })
          ], btns: [{ label: 'Salvar versão', kind: 'primary', size: 'lg', go: saveV }, { label: 'Cancelar', kind: 'ghost', size: 'lg', go: function () { ctx.setUi({ form: false, tried: false }); } }] } : null
        ],
        rail: [
          { t: 'kv', title: 'Conversão em créditos', rows: [
            ['Câmbio', vencida ? 'vencido em 25/10' : 'R$ 5,42 · 26/10 · vence 27/10', 'PTAX venda', vencida ? 'risk' : ''],
            ['Fator', '15× decidido · 10× só comparação', 'decisão 2026-10-26.2'],
            ['1 crédito', 'R$ 0,01 de consumo tarifado'],
            ['Arredondamento', 'para cima, por tarefa'],
            ['Teto por tarefa', T.teto + ' créditos · definido no benchmark'],
            ['Orçamento técnico', 'US$ 400/mês · alerta em 80%']
          ] },
          { t: 'steps', title: 'Versões da tabela', items: [
            { t: 't-2 · ativa', sub: 'desde 01/10 · Bia F.', st: 'done' },
            proposta ? { t: 't-3 · proposta', sub: 'vigência ' + proposta.vig + ' · ' + proposta.por + ' · ' + proposta.em, st: 'now' } : { t: 't-3 · rascunho', sub: 'ainda não salva', st: 'todo' }
          ] },
          { t: 'note', tone: 'info', text: 'Custos técnicos são restritos à operação autorizada. Não existe editor de “saldo livre” de créditos.' }
        ]
      });
    }
  });

  // ---------- FA07.D · Simulação de impacto ----------
  REG.screen({
    page: 'operacao', key: 'fa07d', id: 'FA07.D', title: 'Simulação de impacto', mtitle: 'Simulação', nav: 'financeiro', back: 'FA07', wide: true,
    scens: [['amostra', 'Amostra ausente'], ['incompleta', 'Hipótese incompleta']],
    vals: function (ctx) {
      var scn = ctx.scn;
      if (scn === 'incompleta' && ctx.ui.cred === undefined) ctx.ui.cred = '';
      var cred = O6.num(O6.uiv(ctx, 'cred', '6.000'));
      var c10 = cred * 0.01 / 10, c15 = cred * 0.01 / 15;
      var incompleta = !cred;
      var motivo = String(O6.uiv(ctx, 'motivo', ''));
      var sent = DB.o6_politicas.encaminhado;
      var enviar = function () {
        if (incompleta) { ctx.toast('Complete a hipótese antes de encaminhar.'); return; }
        if (!motivo.trim()) { ctx.setUi({ tried: true }); return; }
        ctx.ask({ title: 'Encaminhar decisão comercial?', text: 'A alçada comercial recebe o cenário sintético com as premissas. Nenhuma política muda por aqui.', lines: ['Base: ' + O6.int(cred) + ' créditos consumidos', 'Custo-base: ' + O6.brl(c10) + ' (10×) · ' + O6.brl(c15) + ' (15×)', 'Motivo: ' + motivo], ok: 'Encaminhar', onOk: function () {
          var r = O6.receipt({ acao: 'Simulação encaminhada à alçada comercial', alvo: 'Pro · fator 10× × 15×', motivo: motivo, efeito: 'decisão pendente · nenhuma política alterada' });
          DB.o6_politicas.encaminhado = r.id; ctx.toast('Encaminhado · recibo ' + r.id + '.');
        } });
      };
      var noSample = scn === 'amostra';
      return O6.page(ctx, {
        title: 'Simulação de impacto', sub: 'Cenário sintético',
        acts: [{ label: sent ? 'Encaminhado · ' + sent : 'Encaminhar decisão comercial', kind: 'primary', dis: !!sent || incompleta, go: enviar }],
        ctx: O6.ctx('politicas.simular', 'Pro · 10× × 15×'),
        alerts: [
          noSample ? { tone: 'warn', title: 'Amostra ausente', text: 'Ainda não há ativações do teste suficientes (mínimo 30) para estimar conversão. O campo fica “sem amostra”, não zero.' } : null,
          incompleta ? { tone: 'warn', title: 'Hipótese incompleta', text: 'Informe os créditos consumidos para calcular o custo-base. Sem isso, nada é encaminhado.' } : null
        ],
        main: [
          { t: 'form', bare: true, fields: [O6.text(ctx, 'cred', 'Créditos consumidos no cenário', { def: '6.000', fix: 'créditos', mode: 'numeric', err: incompleta ? 'Informe um número de créditos.' : '' })] },
          { t: 'table', title: 'Hipóteses', sub: 'Premissas junto do resultado · BRL · ' + O6.NOW, cols: ['Hipótese', '10×', '15×', 'Situação'], rows: [
            { title: 'Base · ' + O6.int(cred) + ' créditos', sub: 'custo-base ' + (incompleta ? '—' : O6.brl(c10) + ' (10×) · ' + O6.brl(c15) + ' (15×)'), ic: 'chart', badge: ['15× decidido', 'ok'], cells: [{ t: 'Base · ' + O6.int(cred) + ' créditos consumidos', b: true }, incompleta ? '—' : O6.brl(c10) + ' de custo-base', incompleta ? '—' : O6.brl(c15) + ' de custo-base', { t: 'decidido 15×', tone: 'ok' }] },
            { title: 'Conversão do teste', sub: 'sem amostra', ic: 'users', badge: ['sem amostra', 'warn'], cells: [{ t: 'Conversão do teste', b: true }, '—', '—', { t: 'sem amostra', tone: 'warn' }] },
            { title: 'Anual', sub: 'R$ 990,00 (R$ 82,50/mês) · decidido', ic: 'calendar', cells: [{ t: 'Anual', b: true }, 'R$ 990,00 (R$ 82,50/mês)', 'R$ 990,00', { t: 'decidido', tone: 'ok' }] },
            { title: 'Tributos e taxas', sub: 'faixa · a validar', ic: 'scale', badge: ['a validar', 'warn'], cells: [{ t: 'Tributos e taxas', b: true }, 'faixa', 'faixa', { t: 'a validar', tone: 'warn' }] }
          ] },
          { t: 'note', tone: 'warn', nTitle: 'Não é lucro líquido', text: 'Fator é proposta de consumo, não margem nem preço final. Moedas não são somadas; falhas, câmbio e suporte entram como premissas separadas.' }
        ],
        rail: [
          { t: 'form', title: 'Encaminhar', fields: [O6.motivo(ctx, 'motivo', { label: 'Motivo do encaminhamento', ph: 'Ex.: confirmar 15× antes da vigência de 01/12' })], btns: [{ label: sent ? 'Encaminhado' : 'Encaminhar decisão comercial', kind: 'primary', dis: !!sent || incompleta, go: enviar }] },
          { t: 'kv', title: 'Premissas', rows: [['Consumo', 'integral, sem devolução'], ['Câmbio', 'R$ 5,42 · 26/10'], ['Falhas com custo', '2% das tarefas · hipótese'], ['Suporte', 'fora do cenário'], ['Observado × hipótese', 'nada aqui é observado']] }
        ]
      });
    }
  });

  // ---------- FA07.E · Revisão, aprovação e vigência ----------
  REG.screen({
    page: 'operacao', key: 'fa07e', id: 'FA07.E', title: 'Revisão e vigência', nav: 'financeiro', back: 'FA07', wide: true,
    scens: [['semaprov', 'Aprovação ausente'], ['expirada', 'Cotação expirada'], ['concorrente', 'Proposta concorrente']],
    vals: function (ctx) {
      var p = DB.o6_pro, scn = ctx.scn;
      var vig = O6.uiv(ctx, 'vig', p.vig), motivo = String(O6.uiv(ctx, 'motivo', p.motivo || ''));
      var blocked = scn === 'expirada' || scn === 'concorrente';
      var st = p.status;
      var submit = function () {
        if (!motivo.trim()) { ctx.setUi({ tried: true }); return; }
        ctx.ask({ title: 'Submeter Pro v2 à alçada comercial?', text: 'Depois de aprovada, a versão vale a partir de ' + vig + ' 00:00 BRT só para novas ativações.', lines: ['Preço mensal: ' + O6.brl(p.mensal) + ' · anual ' + O6.brl(p.anual), 'Franquia: ' + O6.int(p.quotaMes) + ' créditos/mês', 'Assinaturas atuais mantêm a versão aceita', 'Uso já liquidado não é reprecificado', 'Motivo: ' + motivo], ok: 'Submeter à alçada', onOk: function () {
          p.status = 'em aprovação'; p.vig = vig; p.motivo = motivo;
          var r = O6.receipt({ acao: 'Pro v2 submetido à alçada comercial', alvo: 'platform_subscription · Pro v2', motivo: motivo, efeito: 'vigência proposta ' + vig + ' 00:00 BRT · novas ativações' });
          p.recibo = r.id; ctx.toast('Submetido · recibo ' + r.id + '. Aguarda aprovação de outra pessoa.');
        } });
      };
      var approve = function () {
        p.status = 'aprovada'; p.aprovador = O6.APPROVER;
        var rec = { id: O6.nextId(), acao: 'Pro v2 aprovado · vigente a partir de ' + p.vig, alvo: 'platform_subscription · Pro v2', motivo: p.motivo, por: O6.APPROVER, quando: O6.stamp(), amb: O6.env().name, efeito: 'novas ativações a partir de ' + p.vig + ' 00:00 BRT' };
        DB.o6_recibos.unshift(rec); p.recibo = rec.id;
        var cat = DB.find('o6_catalogo', 'c1'); if (cat) { cat.status = 'aprovada'; cat.vig = 'a partir de ' + p.vig; }
        ctx.toast('Aprovação de Bia F. registrada · recibo ' + rec.id + '.');
      };
      var alerts = [];
      if (scn === 'semaprov') alerts.push({ tone: 'warn', title: 'Aprovação ausente', text: 'Ninguém com alçada comercial está disponível até 28/10. Você pode submeter; a versão só vale depois da aprovação.' });
      if (scn === 'expirada') alerts.push({ tone: 'risk', title: 'Cotação expirada', text: 'O câmbio usado na simulação venceu em 25/10. Refaça a simulação antes de submeter.', btns: [{ label: 'Abrir tarifas', kind: 'outline', go: function () { GO('FA07.C'); } }] });
      if (scn === 'concorrente') alerts.push({ tone: 'risk', title: 'Proposta concorrente', text: 'Bia F. submeteu Pro v2b com a mesma vigência (01/12). Só uma segue; compare antes.', btns: [{ label: 'Abrir catálogo', kind: 'outline', go: function () { GO('FA07.A'); } }] });
      if (st === 'em aprovação') alerts.push({ tone: 'info', title: 'Em aprovação', text: 'Submetido por ' + O6.ME + ' · recibo ' + p.recibo + '. Quem propõe não aprova: a aprovação precisa ser de outra pessoa com alçada comercial.', btns: [{ label: 'Registrar aprovação de Bia F. (demonstração)', kind: 'outline', go: approve }] });
      if (st === 'aprovada') alerts.push({ tone: 'ok', title: 'Aprovada · vigente a partir de ' + p.vig + ' 00:00 BRT', text: 'Aprovada por ' + p.aprovador + ' · recibo ' + p.recibo + '. Afeta só novas ativações; ativação acompanhada no catálogo.' });
      var editable = st === 'rascunho';
      return O6.page(ctx, {
        title: 'Revisão e vigência', sub: 'Pro v2 → aprovação',
        acts: [{ label: 'Salvar proposta', kind: 'outline', dis: !editable, go: function () { p.vig = vig; p.motivo = motivo; ctx.toast('Proposta salva às ' + U.now() + ' · ainda não submetida.'); } }, { label: 'Submeter à alçada', kind: 'primary', dis: !editable || blocked, go: submit }],
        ctx: O6.ctx('politicas.aprovar · alçada comercial', 'Pro v2'),
        alerts: alerts,
        main: [
          { t: 'table', title: 'Antes e depois', sub: 'Pro v1 nunca vigorou · fonte: rascunho salvo ' + p.savedAt, cols: ['Campo', 'Antes', 'Depois'], rows: [
            { title: 'Preço mensal', sub: '— → ' + O6.brl(p.mensal), ic: 'dollar', cells: [{ t: 'Preço mensal', b: true }, '—', O6.brl(p.mensal)] },
            { title: 'Preço anual', sub: '— → ' + O6.brl(p.anual) + ' (' + O6.brl(p.anual / 12) + '/mês)', ic: 'calendar', cells: [{ t: 'Preço anual', b: true }, '—', O6.brl(p.anual) + ' (' + O6.brl(p.anual / 12) + '/mês)'] },
            { title: 'Franquia', sub: '— → ' + O6.int(p.quotaMes) + ' créditos/mês', ic: 'sparkle', cells: [{ t: 'Franquia', b: true }, '—', O6.int(p.quotaMes) + ' créditos/mês'] },
            { title: 'Teste', sub: '— → ' + p.trial + ' dias · ' + O6.int(p.quotaTrial) + ' créditos', ic: 'clock', cells: [{ t: 'Teste', b: true }, '—', p.trial + ' dias · ' + O6.int(p.quotaTrial) + ' créditos'] },
            { title: 'Vigência', sub: '— → ' + vig + ' 00:00 BRT', ic: 'calendar', cells: [{ t: 'Vigência', b: true }, '—', vig + ' 00:00 BRT'] }
          ] },
          editable ? { t: 'form', title: 'Vigência e motivo', fields: [
            O6.chips(ctx, 'vig', 'Começa a valer em', [['01/12', '01/12 00:00 BRT'], ['01/01', '01/01 00:00 BRT']], p.vig, { help: 'Sempre futura. Nada é aplicado para trás.' }),
            O6.motivo(ctx, 'motivo', { def: p.motivo || '', ph: 'Ex.: lançamento do Pro aprovado no comitê de 24/10' })
          ], btns: [{ label: 'Submeter à alçada', kind: 'primary', size: 'lg', dis: blocked, go: submit }] } : null
        ],
        rail: [
          { t: 'kv', title: 'Efeitos', rows: [
            ['Quem é afetado', 'novas ativações a partir de ' + vig],
            ['Assinaturas atuais', 'mantêm a versão aceita'],
            ['Comunicação', 'não exigida para quem não aceitou'],
            ['Quotas e cobranças', 'franquia nova só no próximo ciclo de quem ativar'],
            ['Uso liquidado', 'não é reprecificado'],
            ['Autoridade', 'alçada comercial · aprovador ≠ proponente']
          ] },
          { t: 'steps', title: 'Trilha', items: [
            { t: 'Rascunho salvo', sub: p.savedAt + ' · Lia M.', st: 'done' },
            { t: 'Submetido à alçada', sub: st === 'rascunho' ? 'pendente' : 'recibo ' + p.recibo, st: st === 'rascunho' ? 'now' : 'done' },
            { t: 'Aprovado por outra pessoa', sub: st === 'aprovada' ? p.aprovador : 'pendente', st: st === 'aprovada' ? 'done' : (st === 'em aprovação' ? 'now' : 'todo') },
            { t: 'Vigente', sub: 'a partir de ' + vig + ' 00:00 BRT', st: 'todo' }
          ] }
        ]
      });
    }
  });

  // ---------- FA07.F · Histórico e correção ----------
  REG.screen({
    page: 'operacao', key: 'fa07f', id: 'FA07.F', title: 'Histórico de versões', mtitle: 'Histórico', nav: 'financeiro', back: 'FA07', wide: true,
    testIds: ['v0'],
    scens: [['retirada', 'Versão retirada'], ['indisp', 'Política indisponível']],
    vals: function (ctx) {
      var H = DB.o6_comissao, scn = ctx.scn, indisp = scn === 'indisp';
      var md = O6.md(ctx, scn === 'retirada' ? 'v0' : H[0].id);
      var cur = H.find(function (x) { return x.id === md.sel; }) || H[0];
      var idx = H.indexOf(cur), prev = H[idx + 1] || null;
      var form = !!ctx.ui.form, motivo = String(O6.uiv(ctx, 'motivo', '')), vig = O6.uiv(ctx, 'vig', '01/12');
      var val = String(O6.uiv(ctx, 'valor', '5'));
      var create = function () {
        var n = O6.num(val);
        if (!motivo.trim() || !n || n >= 100) { ctx.setUi({ tried: true }); return; }
        var nv = 'v' + (Math.max.apply(null, H.map(function (x) { return +x.v.slice(1) || 0; })) + 1);
        ctx.ask({ title: 'Criar ' + nv + ' como correção futura?', text: 'É uma versão nova. ' + H[0].v + ' fica como está no histórico; nada é reprecificado para trás.', lines: ['Comissão: ' + String(n).replace('.', ',') + '%', 'Vigência proposta: ' + vig + ' 00:00 BRT', 'Contratos atuais: guardam a versão aceita', 'Motivo: ' + motivo], ok: 'Criar versão', onOk: function () {
          var r = O6.receipt({ acao: 'Comissão ' + nv + ' criada como correção futura', alvo: 'coaching_plan · Comissão', motivo: motivo, efeito: 'vigência proposta ' + vig + ' · ' + String(n).replace('.', ',') + '%' });
          H.unshift({ id: nv, v: nv, status: 'proposta', em: '26/10', decisao: 'pendente', valor: String(n).replace('.', ',') + '%', vig: 'a partir de ' + vig + ' (proposta)', autor: O6.ME, motivo: motivo, contratos: 0, recibo: r.id });
          ctx.setUi({ form: false, tried: false, sel: nv, mList: false }); ctx.toast(nv + ' criada · recibo ' + r.id + '.');
        } });
      };
      var tone = { proposta: 'warn', vigente: 'ok', retirada: 'plain' };
      return O6.page(ctx, {
        title: 'Histórico de versões', sub: 'Comissão',
        acts: [{ label: 'Nova correção futura', kind: 'primary', ic: 'plus', dis: indisp || form, go: function () { ctx.setUi({ form: true }); O6.top(); } }],
        ctx: O6.ctx('politicas.ler', 'Comissão coaching_plan'),
        alerts: [indisp ? { tone: 'risk', title: 'Política indisponível', text: 'Não foi possível carregar o histórico às 14:02. Nada foi apagado; tente de novo.', btns: [{ label: 'Tentar de novo', kind: 'outline', ic: 'refresh', go: function () { ctx.toast('Histórico ainda indisponível às ' + U.now() + ' BRT.'); } }] } : null],
        sel: md.mSel && !indisp, mBack: md.mSel && !indisp ? md.back : null,
        main: [
          form ? { t: 'form', title: 'Nova correção futura', sub: 'Cria versão nova; a anterior não é editada.', fields: [
            O6.text(ctx, 'valor', 'Comissão proposta', { def: '5', fix: '%', mode: 'decimal', err: ctx.ui.tried && (!O6.num(val) || O6.num(val) >= 100) ? 'Informe um percentual entre 0 e 100.' : '' }),
            O6.chips(ctx, 'vig', 'Vigência', [['01/12', '01/12 00:00 BRT'], ['01/01', '01/01 00:00 BRT']], '01/12'),
            O6.motivo(ctx, 'motivo', { ph: 'Ex.: ajuste aprovado no comitê comercial' })
          ], btns: [{ label: 'Criar versão', kind: 'primary', size: 'lg', go: create }, { label: 'Cancelar', kind: 'ghost', size: 'lg', go: function () { ctx.setUi({ form: false, tried: false }); } }] } : null,
          indisp ? { t: 'emp', bare: false, ic: 'clock', eTitle: 'Histórico indisponível', text: 'As versões continuam guardadas; só a consulta falhou.' } : { t: 'list', role: 'master', title: 'Linha do tempo', sub: 'Proposta e vigente sempre identificadas', rows: H.map(function (h) {
            return { title: h.v + ' · ' + h.status + ' · ' + h.valor, sub: h.em + ' · decisão ' + h.decisao + ' · ' + h.vig, ic: h.status === 'retirada' ? 'x' : 'clock', badge: [h.status, tone[h.status] || 'plain'], on: h.id === cur.id, go: md.pick(h.id) };
          }) },
          indisp ? null : { t: 'note', role: 'master', tone: 'info', text: 'Contratos guardam a versão aceita; nada é reprecificado para trás. O histórico não é apagado e uma quota nunca é reaberta duas vezes.' }
        ],
        rail: indisp ? [] : [
          { t: 'kv', role: 'detail', title: 'Comissão ' + cur.v, badge: [cur.status, tone[cur.status] || 'plain'], rows: [
            ['Valor', cur.valor], ['Situação', cur.status], ['Vigência', cur.vig], ['Autor', cur.autor], ['Motivo', cur.motivo], ['Decisão', cur.decisao], ['Recibo', cur.recibo || '—'], ['Contratos que referenciam', String(cur.contratos)]
          ], foot: cur.status === 'retirada' ? 'Versão retirada: nunca vigorou e fica no histórico só para rastreabilidade.' : '' },
          prev ? { t: 'kv', role: 'detail', title: 'Comparar com ' + prev.v, rows: [['Valor', prev.valor + ' → ' + cur.valor], ['Situação', prev.status + ' → ' + cur.status], ['Vigência', prev.vig + ' → ' + cur.vig]] } : { t: 'note', role: 'detail', tone: 'info', text: cur.v + ' é a primeira versão registrada.' }
        ]
      });
    }
  });
})();
