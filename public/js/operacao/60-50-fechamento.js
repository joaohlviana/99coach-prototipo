/* O6 · FA10 Exportação e fechamento (+ A período, B consumo e custo da IA, C economia por oferta, D exportação autorizada).
   Fechamento só depois das pendências que bloqueiam; fechar gera versão e trilha e pode ser reaberto com versão nova.
   A exportação gera um CSV de verdade (dados fictícios) que bate com a contagem e o total da tela. */
(function () {
  var O6 = window.O6;
  DB.seed('o6_fech', {
    periodo: 'out/2026', status: 'provisório', versao: '', corte: '25/10 23:59 BRT', cobertura: 96, hist: [['Período aberto', '01/10 · 00:00 BRT · automático'], ['Corte aplicado', '25/10 · 23:59 BRT · Bia F.']],
    pend: [
      { id: 'p1', t: 'Repasse de Renata S. sem envio ao banco', sub: 'R$ 1.240,00 · ac_12 · requisito do provedor', bloqueia: true, res: '', fonte: 'provedor · 26/10 14:00 BRT', go: ['FA06.B', { id: 'renata' }] },
      { id: 'p2', t: 'Reembolso RF-76 sem confirmação final', sub: 'R$ 64,90 · PD-10377 · aguardando processador', bloqueia: true, res: '', fonte: 'fila de ações · 26/10 14:40 BRT', go: ['FA09.C', { id: 'rf76' }] },
      { id: 'd3', t: 'Taxa de processamento divergente em 3 pedidos', sub: 'R$ 2,17 de diferença · tolerância R$ 5,00', bloqueia: false, res: '', fonte: 'conciliação · 26/10 06:00 BRT' },
      { id: 'd4', t: 'Câmbio de 2 tarefas de IA sem fonte', sub: 'US$ 0,41 · USD em linha própria', bloqueia: false, res: '', fonte: 'uso da assistência · 25/10' },
      { id: 'd5', t: 'Cupom VOLTA10 aplicado depois do corte', sub: 'R$ 20,00 · entra em novembro', bloqueia: false, res: '', fonte: 'pedidos · 26/10 08:12 BRT' }
    ]
  });
  DB.seed('o6_ia', [
    { id: 'j_5512', quem: 'Thiago P.', janela: '25/10 · 18:02–18:03 BRT', est: 450, teto: 600, res: 600, liq: 375, dev: 225, tokens: '41 k entrada · 6 k saída', tarifa: 't-2 · US$', cambio: 'R$ 5,42 · 15×', calc: 0.62, conc: null, st: 'concluída' },
    { id: 'j_5520', quem: 'Rafael L.', janela: '25/10 · 20:41 BRT', est: 300, teto: 600, res: 300, liq: 290, dev: 10, tokens: '28 k entrada · 4 k saída', tarifa: 't-2 · US$', cambio: 'R$ 5,42 · 15×', calc: 0.41, conc: 0.41, st: 'concluída' },
    { id: 'j_5531', quem: 'Renata S.', janela: '26/10 · 09:15 BRT', est: 200, teto: 600, res: 200, liq: 0, dev: 200, tokens: '12 k entrada · 0 saída', tarifa: 't-2 · US$', cambio: 'R$ 5,42 · 15×', calc: 0.2, conc: null, st: 'falhou' }
  ]);
  DB.seed('o6_exports', [
    { id: 'EX-14', tipo: 'recebíveis por treinador', periodo: '01–25/10 BRT', moeda: 'BRL', linhas: 412, total: 56700.35, validade: '24 h · até 27/10 14:02 BRT', solicitante: 'Bia F.', status: 'pronto', pct: 100, finalidade: 'conciliação mensal', criado: '26/10 · 14:02 BRT', baixado: '' }
  ]);

  // ---------- CSV fictício que fecha com a tela ----------
  var NOMES = [['Thiago P.', 'ac_08'], ['Renata S.', 'ac_12'], ['Paulo T.', 'ac_40'], ['Rafael L.', 'ac_02'], ['Carolina A.', 'ac_19'], ['Diego M.', 'ac_23'], ['Fernanda C.', 'ac_27'], ['Gustavo R.', 'ac_33'], ['Helena V.', 'ac_36'], ['Igor N.', 'ac_44']];
  function money(c) { return (c / 100).toFixed(2).replace('.', ','); }
  O6.csv = function (ex) {
    var seed = 7, rnd = function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    var n = ex.linhas, totalC = Math.round(ex.total * 100), w = [], sw = 0, i;
    for (i = 0; i < n; i++) { var x = 0.3 + rnd(); w.push(x); sw += x; }
    var cents = w.map(function (x) { return Math.floor(x / sw * totalC); });
    cents[n - 1] += totalC - cents.reduce(function (a, b) { return a + b; }, 0);
    var out = ['linha;treinador;conta;pedido;data;valor_bruto;comissao_5pct;recebivel;moeda;versao_politica'];
    for (i = 0; i < n; i++) {
      var t = NOMES[i % NOMES.length], rec = cents[i], bruto = Math.round(rec / 0.95), com = bruto - rec;
      var dia = 1 + (i % 25);
      out.push([i + 1, t[0], t[1], 'PD-' + (10000 + i * 3), (dia < 10 ? '0' : '') + dia + '/10/2026', money(bruto), money(com), money(rec), ex.moeda, 'comissao v1 · tarifas t-2'].join(';'));
    }
    out.push(';;;;;;;' + money(totalC) + ';' + ex.moeda + ';total de ' + n + ' linhas · dados fictícios · ' + ex.id);
    return out.join('\r\n');
  };
  O6.download = function (name, text) {
    if (window.SAVE_FILE && window.SAVE_FILE(name, '\ufeff' + text)) return true;
    try {
      if (typeof Blob === 'undefined' || !window.URL || !window.URL.createObjectURL || !document.body) return false;
      var blob = new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' });
      var url = window.URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = name; a.style.display = 'none';
      document.body.appendChild(a); a.click();
      setTimeout(function () { try { window.URL.revokeObjectURL(url); a.parentNode && a.parentNode.removeChild(a); } catch (_) {} }, 1500);
      return true;
    } catch (e) { return false; }
  };

  function blocking() { return DB.o6_fech.pend.filter(function (p) { return p.bloqueia && !p.res; }); }
  function open() { return DB.o6_fech.pend.filter(function (p) { return !p.res; }); }

  // ---------- FA10 · Exportação e fechamento ----------
  REG.screen({
    page: 'operacao', key: 'fa10', id: 'FA10', title: 'Fechamento · outubro', mtitle: 'Fechamento', nav: 'financeiro', back: 'H14', wide: true,
    testIds: ['p2', 'd3'],
    normal: 'Período provisório',
    scens: [['pendencias', 'Pendências'], ['fechado', 'Fechado'], ['link', 'Link expira']],
    vals: function (ctx) {
      var F = DB.o6_fech, scn = ctx.scn, md = O6.md(ctx, 'p1');
      var closed = F.status === 'fechado' || scn === 'fechado';
      var ver = F.versao || (scn === 'fechado' ? 'out/2026 · v1' : '');
      var p = F.pend.find(function (x) { return x.id === md.sel; }) || F.pend[0];
      var blk = blocking(), nota = String(O6.uiv(ctx, 'nota', '')), motivo = String(O6.uiv(ctx, 'motivo', ''));
      var resolve = function () {
        if (!nota.trim()) { ctx.setUi({ tried: true }); return; }
        ctx.ask({ title: 'Marcar como resolvida?', text: 'A pendência sai da lista e a resolução vai para a trilha do fechamento.', lines: ['Pendência: ' + p.t, 'Valor: ' + p.sub, 'Resolução: ' + nota], ok: 'Marcar como resolvida', onOk: function () {
          var r = O6.receipt({ acao: 'Pendência de fechamento resolvida', alvo: 'Fechamento out/2026 · ' + p.t, motivo: nota, efeito: p.bloqueia ? 'deixa de bloquear o fechamento' : 'divergência registrada' });
          p.res = r.id; F.hist.push(['Pendência resolvida: ' + p.t, O6.stamp() + ' · ' + O6.ME]);
          ctx.setUi({ nota: '', tried: false }); ctx.toast('Resolvida · recibo ' + r.id + '.');
        } });
      };
      var close = function () {
        if (blk.length) { ctx.toast('Resolva as ' + U.plural(blk.length, 'pendência', 'pendências') + ' que bloqueiam antes de fechar.'); return; }
        if (!motivo.trim()) { ctx.setUi({ tried2: true, closing: true }); return; }
        var n = F.hist.filter(function (h) { return h[0].indexOf('Fechado') === 0; }).length + 1;
        ctx.ask({ title: 'Fechar outubro/2026 como v' + n + '?', text: 'Gera a versão v' + n + ' com trilha. Pode ser reaberto depois, criando uma versão nova; nada é apagado.', lines: ['Período: 01/10 00:00 – 31/10 23:59 BRT · corte 25/10', 'Vendas treinadores R$ 41,2 mil · Receita Pro R$ 3,9 mil · Custo IA R$ 610', U.plural(open().length, 'divergência aberta dentro da tolerância', 'divergências abertas dentro da tolerância'), 'Motivo: ' + motivo], ok: 'Fechar período', onOk: function () {
          var r = O6.receipt({ acao: 'Fechamento out/2026 v' + n, alvo: 'Período 01–31/10 · BRL', motivo: motivo, efeito: 'versão v' + n + ' gerada · reabertura cria v' + (n + 1) });
          F.status = 'fechado'; F.versao = 'out/2026 · v' + n; F.hist.push(['Fechado v' + n + ' · recibo ' + r.id, O6.stamp() + ' · ' + O6.ME]);
          ctx.setUi({ closing: false, tried2: false }); ctx.toast('Outubro fechado como v' + n + ' · recibo ' + r.id + '.');
        } });
      };
      var reopen = function () {
        ctx.ask({ title: 'Reabrir outubro/2026?', text: 'A versão fechada continua na trilha. A reabertura cria uma versão nova, provisória.', lines: ['Versão atual: ' + ver], ok: 'Reabrir', onOk: function () {
          var r = O6.receipt({ acao: 'Fechamento out/2026 reaberto', alvo: 'Período 01–31/10 · BRL', motivo: 'ajuste após fechamento', efeito: ver + ' preservada · nova versão provisória' });
          F.status = 'provisório'; F.hist.push(['Reaberto · recibo ' + r.id, O6.stamp() + ' · ' + O6.ME]); ctx.toast('Reaberto · ' + r.id + '.');
        } });
      };
      var alerts = [];
      if (scn === 'pendencias' || (!closed && blk.length)) alerts.push({ tone: scn === 'pendencias' ? 'risk' : 'warn', title: U.plural(blk.length || 2, 'pendência', 'pendências'), text: scn === 'pendencias' ? 'Fechamento bloqueado. Resolva a lista abaixo; nenhuma pendência é ignorada.' : 'Resolva antes de fechar.', btns: [scn === 'pendencias' ? { label: 'Consultar de novo', kind: 'outline', ic: 'refresh', go: function () { ctx.toast('Consulta às ' + U.now() + ' BRT: as mesmas ' + U.plural(blk.length, 'pendência continua', 'pendências continuam') + '.'); } } : null] });
      if (closed) alerts.push({ tone: 'ok', title: 'Fechado · ' + ver, text: 'Versão e trilha registradas. Fechar não é irrevogável: reabrir cria uma versão nova.', btns: [scn === 'fechado' ? null : { label: 'Reabrir com nova versão', kind: 'outline', go: reopen }] });
      if (scn === 'link') alerts.push({ tone: 'warn', title: 'Link expira em 24 h', text: 'O arquivo EX-14 vale até 27/10 · 14:02 BRT. Depois disso, renove o link na exportação.', btns: [{ label: 'Continuar', kind: 'outline', go: function () { GO('FA10.D', { id: 'EX-14' }); } }] });
      var rows = F.pend.map(function (x) { return { title: x.t, sub: x.sub + ' · ' + x.fonte, ic: x.bloqueia ? 'alert' : 'info', badge: x.res ? ['resolvida', 'ok'] : (x.bloqueia ? ['bloqueia', 'risk'] : ['tolerância', 'plain']), on: x.id === p.id, go: md.pick(x.id) }; });
      return O6.page(ctx, {
        title: 'Fechamento · outubro', sub: 'out/2026 · BRL · corte 25/10 23:59 BRT',
        acts: [{ label: 'Exportar', kind: 'outline', ic: 'download', go: function () { GO('FA10.D'); } }, closed ? null : { label: 'Fechar período', kind: 'primary', dis: blk.length > 0, go: close }],
        ctx: O6.ctx('financeiro.fechamento', 'BRL · 01–31/10 BRT'),
        alerts: alerts, sel: md.mSel, mBack: md.mSel ? md.back : null,
        main: [
          { t: 'kpis', role: 'master', items: [
            { l: 'Vendas treinadores', n: 'R$ 41,2 mil', src: 'processador · corte 25/10 · provisório' },
            { l: 'Receita Pro', n: 'R$ 3,9 mil', src: 'platform_subscription · ativações out · separado' },
            { l: 'Custo IA', n: 'R$ 610', src: 'calculado · conciliação pendente · 26/10' }
          ] },
          { t: 'list', role: 'master', title: 'Pendências e divergências', sub: U.plural(blk.length, 'pendência bloqueia', 'pendências bloqueiam') + ' · cobertura ' + F.cobertura + '%', rows: rows },
          !closed && ctx.ui.closing ? { t: 'form', role: 'master', title: 'Fechar período', fields: [O6.motivo(ctx, 'motivo', { label: 'Motivo do fechamento', ph: 'Ex.: conciliação de outubro concluída', err: ctx.ui.tried2 && !motivo.trim() ? 'Escreva o motivo para continuar.' : '' })], btns: [{ label: 'Fechar período', kind: 'primary', size: 'lg', dis: blk.length > 0, go: close }] } : null,
          { t: 'note', role: 'master', tone: 'info', text: 'Receita do Pro e custo de IA ficam separados dos valores dos treinadores. Nada disso vai para o analytics.' }
        ],
        rail: [
          { t: 'kv', role: 'detail', title: 'Pendência', badge: p.res ? ['resolvida', 'ok'] : (p.bloqueia ? ['bloqueia', 'risk'] : ['tolerância', 'plain']), rows: [['O quê', p.t], ['Valor', p.sub], ['Fonte', p.fonte], ['Bloqueia o fechamento', p.bloqueia ? 'sim' : 'não'], ['Resolução', p.res ? 'recibo ' + p.res : 'pendente']],
            btns: [p.go ? { label: 'Abrir origem', kind: 'ghost', go: function () { GO(p.go[0], p.go[1]); } } : null] },
          p.res || closed ? null : { t: 'form', role: 'detail', title: 'Resolver', fields: [O6.motivo(ctx, 'nota', { label: 'Como foi resolvida', ph: 'Ex.: provedor confirmou envio em 26/10' })], btns: [{ label: 'Marcar como resolvida', kind: 'primary', go: resolve }] },
          { t: 'steps', role: 'master', title: 'Versões e trilha', items: F.hist.map(function (h) { return { t: h[0], sub: h[1], st: 'done' }; }).concat(closed ? [] : [{ t: 'Fechamento', sub: blk.length ? 'bloqueado por ' + U.plural(blk.length, 'pendência', 'pendências') : 'pronto para fechar', st: blk.length ? 'warn' : 'now' }]) },
          { t: 'list', role: 'master', title: 'Subtelas', rows: [O6.link('Período e fechamento', 'Recorte, corte, cobertura e versões', 'calendar', 'FA10.A'), O6.link('Consumo e custo da assistência', 'Créditos × caixa por tarefa', 'sparkle', 'FA10.B'), O6.link('Economia por oferta', 'Pro · outubro', 'chart', 'FA10.C'), O6.link('Exportação autorizada', 'CSV com validade de 24 h', 'download', 'FA10.D')] }
        ]
      });
    }
  });

  // ---------- FA10.A · Período e fechamento ----------
  REG.screen({
    page: 'operacao', key: 'fa10a', id: 'FA10.A', title: 'Período e fechamento', mtitle: 'Período', nav: 'financeiro', back: 'FA10', wide: true,
    scens: [['revisado', 'Revisado'], ['incompleto', 'Incompleto'], ['multimoeda', 'Multimoeda'], ['indisp', 'Fonte indisponível']],
    vals: function (ctx) {
      var F = DB.o6_fech, scn = ctx.scn;
      var per = O6.uiv(ctx, 'per', 'out'), out = per === 'out';
      var showDiv = !!ctx.ui.div || scn === 'incompleto';
      var nOpen = open().length;
      var sit = scn === 'revisado' ? ['revisado', 'info'] : (F.status === 'fechado' && out ? ['fechado', 'ok'] : (out ? ['provisório', 'warn'] : ['fechado', 'ok']));
      return O6.page(ctx, {
        title: 'Período e fechamento', sub: out ? 'Outubro/2026' : 'Setembro/2026',
        acts: [{ label: showDiv ? 'Ocultar divergências' : 'Abrir divergências', kind: 'primary', go: function () { ctx.setUi({ div: !showDiv }); } }],
        ctx: O6.ctx('financeiro.fechamento', out ? 'BRL · 01–31/10 BRT' : 'BRL · 01–30/09 BRT', scn === 'indisp' ? 'última leitura 26/10 · 06:00 BRT' : O6.NOW),
        alerts: [
          out && scn !== 'revisado' && F.status !== 'fechado' ? { tone: 'warn', title: 'Período provisório', text: 'Feche só depois de resolver as divergências que bloqueiam.' } : null,
          scn === 'revisado' ? { tone: 'info', title: 'Revisado', text: 'Bia F. revisou as definições às 14:20. Falta resolver as pendências que bloqueiam para fechar.' } : null,
          scn === 'incompleto' ? { tone: 'warn', title: 'Incompleto', text: 'Eventos de 24/10 do processador chegaram parcialmente; a cobertura cai para 91%. Totais afetados aparecem como provisórios.' } : null,
          scn === 'multimoeda' ? { tone: 'info', title: 'Multimoeda', text: 'Custos de IA em USD ficam em linha própria (US$ 112,40). Nunca são somados aos valores em BRL.' } : null,
          scn === 'indisp' ? { tone: 'risk', title: 'Fonte indisponível', text: 'A conciliação de 26/10 não carregou. Mostrando a leitura das 06:00; não feche com fonte indisponível.', btns: [{ label: 'Tentar de novo', kind: 'outline', ic: 'refresh', go: function () { ctx.toast('Fonte ainda indisponível às ' + U.now() + ' BRT.'); } }] } : null
        ],
        main: [
          { t: 'form', bare: true, fields: [O6.chips(ctx, 'per', 'Recorte', [['out', 'Outubro/2026'], ['set', 'Setembro/2026']], 'out', { help: 'Filtros e corte ficam junto dos totais.' })] },
          { t: 'kv', title: 'Definições', badge: sit, rows: out ? [
            ['Período', '01/10 00:00 – 31/10 23:59 BRT'], ['Moedas', scn === 'multimoeda' ? 'BRL · USD US$ 112,40 em linha própria' : 'BRL · USD em separado'], ['Famílias', 'as três: coaching_plan, program, platform_subscription'],
            ['Corte', F.corte], ['Cobertura', (scn === 'incompleto' ? 91 : F.cobertura) + '% · ' + U.plural(scn === 'incompleto' ? nOpen + 1 : nOpen, 'divergência aberta', 'divergências abertas'), 'conciliação · 26/10 06:00 BRT'],
            ['Versões', 'comissão v1 · tarifas t-2'], ['Saldo inicial', 'R$ 12.480,10', 'fechamento set/2026 v1'], ['Saldo final', 'provisório']
          ] : [
            ['Período', '01/09 00:00 – 30/09 23:59 BRT'], ['Moedas', 'BRL · USD em separado'], ['Corte', '30/09 23:59 BRT'], ['Cobertura', '100%', 'conciliação · 02/10'], ['Versões', 'set/2026 v1 · fechado 03/10 por Bia F.'], ['Saldo final', 'R$ 12.480,10']
          ], btns: [{ label: 'Gerar relatório', kind: 'outline', ic: 'download', dis: scn === 'indisp', go: function () { GO('FA10.D'); } }] },
          showDiv && out ? { t: 'list', title: 'Divergências', sub: 'Abra a origem para resolver', rows: DB.o6_fech.pend.map(function (p) { return { title: p.t, sub: p.sub, ic: p.bloqueia ? 'alert' : 'info', badge: p.res ? ['resolvida', 'ok'] : (p.bloqueia ? ['bloqueia', 'risk'] : ['tolerância', 'plain']), go: function () { GO('FA10', { id: p.id }); } }; }) } : null
        ],
        rail: [{ t: 'note', tone: 'info', text: 'Fechamento não é irrevogável: reabrir cria versão nova. Anual recebido não é receita mensal: é reconhecido mês a mês.' }]
      });
    }
  });

  // ---------- FA10.B · Consumo e custo da assistência ----------
  REG.screen({
    page: 'operacao', key: 'fa10b', id: 'FA10.B', title: 'Consumo da assistência', mtitle: 'Consumo IA', nav: 'financeiro', back: 'FA10', wide: true,
    testIds: ['j_5531'],
    scens: [['ausente', 'Uso ausente'], ['falha', 'Falha com custo real'], ['voo', 'Reserva em voo']],
    vals: function (ctx) {
      var scn = ctx.scn, md = O6.md(ctx, scn === 'falha' ? 'j_5531' : 'j_5512');
      var j0 = DB.o6_ia.find(function (x) { return x.id === md.sel; }) || DB.o6_ia[0], j = j0;
      if (scn === 'ausente') j = Object.assign({}, j0, { tokens: 'não informado pelo fornecedor', calc: null });
      if (scn === 'voo') j = Object.assign({}, j0, { liq: null, dev: null, st: 'em voo' });
      var aba = O6.uiv(ctx, 'aba', 'cred'), motivo = String(O6.uiv(ctx, 'motivo', ''));
      var fwd = function () {
        if (!motivo.trim()) { ctx.setUi({ tried: true }); return; }
        ctx.ask({ title: 'Encaminhar correção auditada?', text: 'A correção vai para revisão com recibo. Nada é debitado do cartão do treinador.', lines: ['Tarefa: ' + j.id + ' · ' + j.quem, 'Créditos: liquidado ' + (j.liq == null ? '—' : j.liq) + ' · devolvido ' + (j.dev == null ? '—' : j.dev), 'Motivo: ' + motivo], ok: 'Encaminhar correção', onOk: function () {
          var r = O6.receipt({ acao: 'Correção de consumo encaminhada', alvo: 'Tarefa ' + j.id + ' · ' + j.quem, motivo: motivo, efeito: 'revisão de créditos/custo · sem débito no cartão' });
          j0.corr = r.id; ctx.setUi({ tried: false }); ctx.toast('Correção encaminhada · recibo ' + r.id + '.');
        } });
      };
      var dash = function (n) { return n == null ? '—' : O6.int(n); };
      return O6.page(ctx, {
        title: 'Consumo da assistência', sub: 'Tarefa ' + j.id + ' · ' + j.quem,
        ctx: O6.ctx('financeiro.ler · IA', 'Treinador ' + j.quem),
        alerts: [
          scn === 'ausente' ? { tone: 'warn', title: 'Uso ausente', text: 'O fornecedor não informou os tokens desta tarefa. O custo fica pendente; nunca é estimado como zero.' } : null,
          scn === 'falha' ? { tone: 'warn', title: 'Falha com custo real', text: 'A tarefa falhou e todos os créditos voltaram ao treinador, mas o fornecedor cobrou R$ 0,20. Esse custo fica com a plataforma.' } : null,
          scn === 'voo' ? { tone: 'info', title: 'Reserva em voo', text: 'A tarefa ainda está rodando: 600 créditos reservados. Liquidado e devolvido aparecem ao terminar.' } : null
        ],
        sel: md.mSel, mBack: md.mSel ? md.back : null,
        main: [
          { t: 'list', role: 'master', title: 'Tarefas recentes', sub: 'fonte: uso da assistência · ' + O6.NOW, rows: DB.o6_ia.map(function (x) { return { title: x.id + ' · ' + x.quem, sub: (x.liq ? x.liq + ' usados · ' : '') + x.dev + ' devolvidos · custo ' + O6.brl(x.calc) + (x.conc == null ? ' · a conciliar' : ' · conciliado'), ic: 'sparkle', badge: x.st === 'falhou' ? ['falhou', 'warn'] : null, on: x.id === j.id, go: md.pick(x.id) }; }) },
          { t: 'note', role: 'master', tone: 'info', text: 'Sem prompt, resposta ou dado de saúde nesta tela. Cartão não é debitado por tarefa.' }
        ],
        rail: [
          { t: 'kv', role: 'detail', title: j.id + ' · ' + j.quem, sub: j.janela, badge: [j.st, j.st === 'concluída' ? 'ok' : 'warn'], seg: [{ label: 'Franquia (créditos)', on: aba === 'cred', pick: function () { ctx.setUi({ aba: 'cred' }); } }, { label: 'Custo técnico (caixa)', on: aba === 'cx', pick: function () { ctx.setUi({ aba: 'cx' }); } }], segLabel: 'Seção',
            rows: aba === 'cred' ? [['Estimativa', dash(j.est) + ' créditos'], ['Teto', dash(j.teto) + ' créditos'], ['Reservado', dash(j.res) + ' créditos'], ['Liquidado', j.liq == null ? 'em voo' : dash(j.liq) + ' créditos', 'franquia · ' + j.janela], ['Devolvido', j.dev == null ? 'em voo' : dash(j.dev) + ' créditos']]
              : [['Tokens', j.tokens, 'fornecedor modelo-a'], ['Tarifa', j.tarifa], ['Câmbio · fator', j.cambio], ['Calculado', j.calc == null ? 'pendente' : O6.brl(j.calc), 'cálculo · ' + O6.NOW], ['Reconciliado', j.conc == null ? 'pendente' : O6.brl(j.conc), '', j.conc == null ? 'warn' : 'ok']] },
          { t: 'form', role: 'detail', title: 'Correção auditada', fields: [O6.motivo(ctx, 'motivo', { ph: 'Ex.: devolver 225 créditos não usados' })], btns: [{ label: j0.corr ? 'Encaminhada · ' + j0.corr : 'Encaminhar correção auditada', kind: 'primary', dis: !!j0.corr, go: fwd }] }
        ]
      });
    }
  });

  // ---------- FA10.C · Economia por oferta e período ----------
  var ECON = {
    out: [['Receita SaaS', 'R$ 18.420,00', 'realizado', 'ok'], ['Descontos', '− R$ 1.210,00', 'realizado', 'ok'], ['Processamento', '− R$ 640,00', 'realizado', 'ok'], ['Tributos', 'faixa a validar', 'hipótese', 'warn'], ['Custo de IA calculado', '− R$ 1.890,00', 'provisório', 'info'], ['Custo de IA conciliado', '—', 'pendente', 'warn']],
    set: [['Receita SaaS', 'R$ 15.980,00', 'realizado', 'ok'], ['Descontos', '− R$ 940,00', 'realizado', 'ok'], ['Processamento', '− R$ 552,00', 'realizado', 'ok'], ['Tributos', 'faixa a validar', 'hipótese', 'warn'], ['Custo de IA calculado', '− R$ 1.512,00', 'realizado', 'ok'], ['Custo de IA conciliado', '− R$ 1.498,30', 'realizado', 'ok']]
  };
  REG.screen({
    page: 'operacao', key: 'fa10c', id: 'FA10.C', title: 'Economia por oferta', mtitle: 'Economia', nav: 'financeiro', back: 'FA10', wide: true,
    scens: [['amostra', 'Amostra insuficiente'], ['canal', 'Canal não apurado'], ['moedas', 'Moedas diferentes']],
    vals: function (ctx) {
      var scn = ctx.scn, per = O6.uiv(ctx, 'per', 'out');
      var rows = ECON[per].map(function (r) { return { title: r[0] + ' · ' + r[1], sub: r[2], ic: 'chart', badge: [r[2], r[3]], cells: [{ t: r[0], b: true }, r[1], { t: r[2], tone: r[3] }] }; });
      if (scn === 'moedas') rows.push({ title: 'Custo de IA em USD · US$ 112,40', sub: 'linha própria · não somada', ic: 'chart', badge: ['USD', 'info'], cells: [{ t: 'Custo de IA em USD', b: true }, 'US$ 112,40', { t: 'linha própria · não somada', tone: 'info' }] });
      return O6.page(ctx, {
        title: 'Economia por oferta', sub: 'Pro · ' + (per === 'out' ? 'outubro' : 'setembro'),
        acts: [{ label: 'Abrir hipóteses (FA07.D)', kind: 'outline', go: function () { GO('FA07.D'); } }],
        ctx: O6.ctx('financeiro.analitico', 'platform_subscription'),
        alerts: [
          scn === 'amostra' ? { tone: 'warn', title: 'Amostra insuficiente', text: 'Só 11 testes convertidos em outubro (mínimo 30). Custo do teste por convertido não é mostrado.' } : null,
          scn === 'canal' ? { tone: 'warn', title: 'Canal não apurado', text: 'Vendas do Pro pelo app ainda não são apuradas (regra de loja pendente). Os valores são só da web.' } : null,
          scn === 'moedas' ? { tone: 'info', title: 'Moedas diferentes', text: 'Custos em USD aparecem em linha própria e não entram na soma em BRL.' } : null
        ],
        main: [
          { t: 'table', title: 'Linhas', sub: 'BRL · fonte: fechamento ' + (per === 'out' ? 'out/2026 provisório' : 'set/2026 v1') + ' · ' + O6.NOW, seg: [{ label: 'Pro · outubro', on: per === 'out', pick: function () { ctx.setUi({ per: 'out' }); } }, { label: 'Pro · setembro', on: per === 'set', pick: function () { ctx.setUi({ per: 'set' }); } }], segLabel: 'Período', cols: ['Linha', 'Valor', 'Natureza'], rows: rows },
          { t: 'note', tone: 'warn', nTitle: 'Não é lucro líquido', text: 'Diferença entre receita e custo de API não é margem da empresa. Política não é editada aqui.' }
        ],
        rail: [{ t: 'kv', title: 'Cobertura', rows: [['Receita', per === 'out' ? 'até o corte 25/10' : 'mês inteiro'], ['Custo de IA', per === 'out' ? 'calculado · conciliação pendente' : 'conciliado'], ['Teste por convertido', scn === 'amostra' ? 'sem amostra' : (per === 'out' ? '23 de 61 testes · 38%' : '19 de 54 testes · 35%')], ['Custo alocado', 'por tarefa, sem rateio de suporte']] }]
      });
    }
  });

  // ---------- FA10.D · Exportação autorizada ----------
  var EX_SCN = { processando: ['processando', 45], parcial: ['parcial', 100], falhou: ['falhou', 60], expirado: ['expirado', 100] };
  REG.screen({
    page: 'operacao', key: 'fa10d', id: 'FA10.D', title: 'Exportação autorizada', mtitle: 'Exportação', nav: 'financeiro', back: 'FA10', wide: true,
    scens: [['processando', 'Processando'], ['parcial', 'Parcial'], ['falhou', 'Falhou'], ['expirado', 'Expirado'], ['revogada', 'Permissão revogada'], ['versao', 'Versão posterior disponível']],
    vals: function (ctx) {
      var scn = ctx.scn, X = DB.o6_exports;
      var e0 = X.find(function (x) { return x.id === (ctx.ui.sel || ctx.id); }) || X[X.length - 1];
      var e = e0;
      if (EX_SCN[scn] && !ctx.ui.fixed) e = Object.assign({}, e0, { status: EX_SCN[scn][0], pct: EX_SCN[scn][1] });
      var revog = scn === 'revogada';
      var tipo = O6.uiv(ctx, 'tipo', 'rec'), motivo = String(O6.uiv(ctx, 'motivo', ''));
      var baixar = function () {
        var ok = O6.download('99coach-' + e.id + '-recebiveis-out2026-ficticio.csv', O6.csv(e));
        e0.baixado = O6.stamp();
        var r = O6.receipt({ acao: 'Exportação ' + e.id + ' baixada', alvo: e.tipo + ' · ' + e.periodo, motivo: e.finalidade, efeito: e.linhas + ' linhas · ' + O6.brl(e.total) });
        ctx.toast((ok ? 'CSV baixado' : 'CSV gerado (download indisponível neste navegador)') + ' · ' + e.linhas + ' linhas · ' + O6.brl(e.total) + ' · recibo ' + r.id + '.');
      };
      var gerar = function () {
        if (!motivo.trim()) { ctx.setUi({ tried: true }); return; }
        var t = tipo === 'rec' ? 'recebíveis por treinador' : 'vendas por oferta';
        ctx.ask({ title: 'Gerar solicitação de exportação?', text: 'O arquivo fica disponível por 24 h para quem solicitou. Nada é enviado ao analytics.', lines: ['Tipo: ' + t, 'Período: 01–25/10 BRT · BRL', 'Colunas: definições anexas', 'Finalidade: ' + motivo], ok: 'Gerar solicitação', onOk: function () {
          var id = 'EX-' + (14 + X.length);
          var n = { id: id, tipo: t, periodo: '01–25/10 BRT', moeda: 'BRL', linhas: tipo === 'rec' ? 412 : 268, total: tipo === 'rec' ? 56700.35 : 41212.8, validade: '24 h · até 27/10 ' + U.now() + ' BRT', solicitante: O6.ME, status: 'processando', pct: 35, finalidade: motivo, criado: O6.stamp(), baixado: '' };
          X.push(n);
          var r = O6.receipt({ acao: 'Exportação ' + id + ' solicitada', alvo: t + ' · 01–25/10', motivo: motivo, efeito: 'validade 24 h · sem analytics' });
          ctx.setUi({ sel: id, form: false, tried: false }); ctx.toast(id + ' em processamento · recibo ' + r.id + '.');
        } });
      };
      var refresh = function () {
        if (EX_SCN[scn]) { ctx.setUi({ fixed: true }); ctx.toast(e.id + ' pronto às ' + U.now() + '.'); return; }
        e0.status = 'pronto'; e0.pct = 100; ctx.toast(e0.id + ' pronto às ' + U.now() + ' · 100%.');
      };
      var renew = function () {
        ctx.ask({ title: 'Renovar link de ' + e.id + '?', text: 'Gera um link novo válido por 24 h. O conteúdo é o mesmo.', lines: ['Finalidade: ' + e.finalidade, 'Solicitante: ' + e.solicitante], ok: 'Renovar link', onOk: function () {
          var r = O6.receipt({ acao: 'Link de ' + e.id + ' renovado', alvo: e.tipo, motivo: e.finalidade, efeito: 'validade 24 h a partir de ' + U.now() });
          e0.status = 'pronto'; e0.validade = '24 h · até 28/10 ' + U.now() + ' BRT'; ctx.setUi({ fixed: true }); ctx.toast('Link renovado · recibo ' + r.id + '.');
        } });
      };
      var bt = [];
      if (e.status === 'pronto' || e.status === 'parcial') bt.push({ label: 'Baixar CSV', kind: 'primary', ic: 'download', dis: revog, go: baixar });
      if (e.status === 'processando') bt.push({ label: 'Atualizar', kind: 'primary', ic: 'refresh', go: refresh });
      if (e.status === 'falhou') bt.push({ label: 'Tentar de novo', kind: 'primary', ic: 'refresh', dis: revog, go: refresh });
      if (e.status === 'expirado') bt.push({ label: 'Renovar link', kind: 'primary', dis: revog, go: renew });
      var stTone = { pronto: 'ok', processando: 'info', parcial: 'warn', falhou: 'risk', expirado: 'plain' };
      return O6.page(ctx, {
        title: 'Exportação autorizada', sub: 'Recebíveis · outubro',
        acts: [{ label: 'Gerar solicitação', kind: 'outline', ic: 'plus', dis: revog, go: function () { ctx.setUi({ form: true }); O6.top(); } }],
        ctx: O6.ctx('financeiro.exportar', 'BRL · 01–25/10'),
        alerts: [
          revog ? { tone: 'risk', title: 'Permissão revogada', text: 'Sua capacidade financeiro.exportar foi revogada às 14:20. Arquivos existentes não podem ser baixados; peça a Bia F.' } : null,
          scn === 'versao' ? { tone: 'info', title: 'Versão posterior disponível', text: 'O fechamento foi reprocessado às 14:30. Gere uma solicitação nova para baixar a versão atual; ' + e.id + ' continua igual.' } : null,
          e.status === 'parcial' ? { tone: 'warn', title: 'Parcial', text: '398 de 412 linhas: 14 pedidos de 24/10 ainda sem confirmação. O arquivo indica a cobertura no rodapé.' } : null,
          e.status === 'falhou' ? { tone: 'risk', title: 'Falhou', text: 'A geração parou em 60% (fonte de pedidos sem resposta). Nada foi baixado; tente de novo.' } : null,
          e.status === 'expirado' ? { tone: 'warn', title: 'Expirado', text: 'O link venceu (validade de 24 h). Renove para baixar de novo.' } : null
        ],
        main: [
          ctx.ui.form ? { t: 'form', title: 'Nova solicitação', fields: [
            O6.chips(ctx, 'tipo', 'Tipo', [['rec', 'Recebíveis por treinador'], ['vendas', 'Vendas por oferta']], 'rec'),
            O6.locked('Período e moeda', '01–25/10 BRT · BRL'),
            O6.motivo(ctx, 'motivo', { label: 'Finalidade', ph: 'Ex.: conciliação mensal com a contabilidade' })
          ], btns: [{ label: 'Gerar solicitação', kind: 'primary', size: 'lg', go: gerar }, { label: 'Cancelar', kind: 'ghost', size: 'lg', go: function () { ctx.setUi({ form: false, tried: false }); } }] } : null,
          { t: 'kv', title: e.id + ' · ' + e.tipo, badge: [e.status + (e.status === 'processando' ? ' · ' + e.pct + '%' : ''), stTone[e.status] || 'plain'], rows: [
            ['Tipo', e.tipo], ['Período', e.periodo], ['Moeda', e.moeda], ['Colunas', 'definições anexas: bruto, comissão 5%, recebível, versão da política'],
            ['Contagem · total', (e.status === 'parcial' ? '398 de ' + e.linhas : e.linhas) + ' linhas · ' + O6.brl(e.total), 'fechamento out/2026 · corte 25/10'],
            ['Validade do link', e.status === 'expirado' ? 'vencido' : e.validade], ['Solicitante', e.solicitante + ' · ' + e.criado], ['Finalidade', e.finalidade], ['Progresso', e.pct + '%'], ['Último download', e0.baixado || '—']
          ], btns: bt },
          { t: 'note', tone: 'info', text: 'Demonstração: o CSV tem dados fictícios e fecha com a contagem e o total desta tela. Não é enviado ao PostHog nem a outro analytics.' }
        ],
        rail: [{ t: 'list', title: 'Solicitações', rows: X.map(function (x) { return { title: x.id + ' · ' + x.tipo, sub: x.periodo + ' · ' + x.status + ' · ' + x.solicitante, ic: 'download', on: x.id === e.id, go: function () { ctx.setUi({ sel: x.id }); } }; }) }]
      });
    }
  });
})();
