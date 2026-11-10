/* O6 · FA08 Ambientes e prontidão (+ A ambiente e conta, B mercado/produto/canal, C integração e conciliação).
   Teste e Produção nunca se misturam: trocar de contexto é uma confirmação, não um interruptor, e não copia operações. */
(function () {
  var O6 = window.O6;
  DB.seed('o6_matriz', [
    { id: 'm1', pais: 'BR', moeda: 'BRL', fam: 'coaching_plan', canal: 'web', metodos: 'cartão, Pix', st: 'homologado', vend: 'treinador (marketplace)', entrega: 'serviço contínuo', resp: 'Bia F.' },
    { id: 'm2', pais: 'BR', moeda: 'BRL', fam: 'platform_subscription', canal: 'web', metodos: 'cartão', st: 'homologado', vend: '99Coach (plataforma)', entrega: 'software por assinatura', resp: 'Bia F.' },
    { id: 'm3', pais: 'BR', moeda: 'BRL', fam: 'platform_subscription', canal: 'app', metodos: 'regra de loja pendente', st: 'pendente', vend: '99Coach (plataforma)', entrega: 'software por assinatura', resp: 'Comercial · Lia M.' },
    { id: 'm4', pais: 'AR', moeda: '—', fam: '—', canal: '—', metodos: 'não habilitado', st: 'não habilitado', vend: '—', entrega: '—', resp: 'Comercial · decisão pendente' }
  ]);
  DB.seed('o6_eventos', [
    { id: 'e1', ev: 'payment.succeeded', ult: '14:01', atraso: '—', proc: 'ok', fluxo: 'homologado' },
    { id: 'e2', ev: 'refund.updated', ult: '13:20', atraso: '40 min', proc: 'ok', fluxo: 'homologado' },
    { id: 'e3', ev: 'payout.failed', ult: '—', atraso: '—', proc: '—', fluxo: 'cobertura desconhecida' }
  ]);
  var TONE = { homologado: 'ok', pendente: 'warn', 'não habilitado': 'plain', 'cobertura desconhecida': 'warn' };

  // ---------- FA08 · Ambientes e prontidão ----------
  REG.screen({
    page: 'operacao', key: 'fa08', id: 'FA08', title: 'Ambientes', nav: 'financeiro', back: 'H14', wide: true,
    testIds: ['teste'],
    normal: 'Saúde por ambiente',
    scens: [['producao', 'Produção'], ['webhook', 'Webhook falhando'], ['teste', 'Teste']],
    vals: function (ctx) {
      var A = DB.o6_amb, scn = ctx.scn, envId = scn === 'teste' ? 'teste' : (scn === 'producao' || scn === 'webhook' ? 'producao' : A.atual);
      var md = O6.md(ctx, envId);
      var fail = scn === 'webhook' && !ctx.ui.retried;
      var sel = A.ambientes.find(function (x) { return x.id === md.sel; }) || A.ambientes[0];
      var rows = A.ambientes.map(function (e) {
        var wh = e.id === 'producao' && fail ? { t: 'falhando · 13:20', tone: 'risk' } : e.webhook;
        var saude = e.id === 'producao' && fail ? 'webhook falhando' : e.saude;
        return { title: e.name + ' ' + saude, sub: e.pais + ' · ' + e.metodos + ' · conciliação ' + e.conc, ic: e.id === 'producao' ? 'shield' : 'wand', badge: e.id === A.atual ? ['em uso', 'ink'] : null, on: e.id === sel.id, go: md.pick(e.id),
          cells: [{ t: e.name + (e.id === A.atual ? ' · em uso' : ''), b: true }, e.pais, e.metodos, wh, e.conc] };
      });
      var alerts = [];
      if (scn === 'producao') alerts.push({ tone: 'risk', ic: 'shield', title: 'Você está em Produção', text: 'A faixa vermelha fica fixa no topo enquanto você estiver em Produção. Ações sensíveis mostram o ambiente de novo na revisão.' });
      if (scn === 'webhook') alerts.push(fail ? { tone: 'risk', title: 'Webhook falhando', text: 'Última entrega com sucesso: 13:20 (payment.succeeded). Confirmações novas podem atrasar; nada é reprocessado sozinho e nenhum pagamento é repetido.', btns: [{ label: 'Tentar de novo', kind: 'outline', ic: 'refresh', go: function () { ctx.setUi({ retried: true }); ctx.toast('Entrega reconsultada às ' + U.now() + ': provedor reenviou 3 eventos; conciliação em andamento.'); } }, { label: 'Integração e conciliação', kind: 'ghost', go: function () { GO('FA08.C'); } }] } : { tone: 'ok', title: 'Entregas retomadas', text: 'Provedor reenviou 3 eventos às ' + U.now() + '. Conciliação em andamento; acompanhe em Integração e conciliação.' });
      if (scn === 'teste') alerts.push({ tone: 'warn', ic: 'wand', title: 'Ambiente de Teste', text: ctx.ui.why ? 'A faixa listrada aparece em todas as telas de Teste para ninguém confundir com Produção. Operações e segredos de Teste ficam só em Teste; nada é copiado.' : 'Faixa listrada: o que você fizer aqui não afeta Produção.', btns: [ctx.ui.why ? null : { label: 'Saiba por quê', kind: 'ghost', go: function () { ctx.setUi({ why: true }); } }] });
      return O6.page(ctx, {
        env: scn === 'teste' ? 'teste' : (scn ? 'producao' : null), envFixed: scn === 'producao',
        title: 'Ambientes', sub: 'Teste e produção inequívocos',
        acts: [{ label: 'Ambiente e conta', kind: 'outline', go: function () { GO('FA08.A'); } }],
        ctx: O6.ctx('financeiro.ambientes', 'Processador · ' + O6.envOf(envId).name.toLowerCase(), '', scn === 'teste' ? 'teste' : null),
        alerts: alerts, sel: md.mSel, mBack: md.mSel ? md.back : null,
        main: [
          { t: 'table', role: 'master', title: 'Saúde por ambiente', sub: 'fonte: processador · ' + O6.NOW, cols: ['Ambiente', 'País', 'Métodos', 'Webhook', 'Conciliação'], rows: rows },
          { t: 'note', role: 'master', tone: 'info', text: 'Configuração fica em ambiente separado. Não existe interruptor que misture operações de Teste e Produção.' }
        ],
        rail: [
          { t: 'kv', role: 'detail', title: sel.name, badge: sel.id === 'producao' && fail ? ['webhook falhando', 'risk'] : [sel.saude, 'ok'], rows: [
            ['Conta', sel.conta], ['País e canal', sel.pais + ' · web'], ['Métodos efetivos', sel.metodos, 'processador · 26/10 ' + sel.prova + ' BRT'],
            ['Webhook', sel.id === 'producao' && fail ? 'falhando desde 13:20' : sel.webhook], ['Conciliação', sel.conc], ['Prontidão', sel.prontidao], ['Responsável', sel.resp]
          ], btns: [{ label: 'Ambiente e conta', kind: 'outline', go: function () { GO('FA08.A'); } }, { label: 'Integração', kind: 'ghost', go: function () { GO('FA08.C'); } }] },
          { t: 'list', role: 'master', title: 'Subtelas', rows: [O6.link('Ambiente e conta', 'Contexto inequívoco · troca confirmada', 'shield', 'FA08.A'), O6.link('Mercado, produto e canal', 'Matriz efetiva de métodos', 'grid', 'FA08.B'), O6.link('Integração e conciliação', 'Eventos e webhooks do processador', 'activity', 'FA08.C')] }
        ]
      });
    }
  });

  // ---------- FA08.A · Ambiente e conta ----------
  REG.screen({
    page: 'operacao', key: 'fa08a', id: 'FA08.A', title: 'Ambiente e conta', nav: 'financeiro', back: 'FA08', wide: true,
    scens: [['semacesso', 'Sem acesso'], ['outra', 'Conta diferente'], ['incompleto', 'Teste incompleto'], ['indisp', 'Consulta indisponível']],
    vals: function (ctx) {
      var A = DB.o6_amb, scn = ctx.scn, e = O6.envOf();
      var noAccess = scn === 'semacesso', indisp = scn === 'indisp';
      var switchTo = function (id) { return function () {
        if (id === A.atual) return;
        var to = O6.envOf(id);
        ctx.ask({ title: 'Mudar para ' + to.name + '?', text: 'Você passa a ver e operar só o ambiente ' + to.name + '.', lines: ['Operações não são copiadas entre ambientes', 'A faixa de ambiente muda de cor em todas as telas', 'Segredos e chaves ficam no ambiente de origem'], ok: 'Mudar para ' + to.name, onOk: function () {
          var from = e.name; A.atual = id;
          var r = O6.receipt({ acao: 'Contexto alterado de ' + from + ' para ' + to.name, alvo: 'Processador · conta ' + to.conta, motivo: 'troca de contexto pelo operador', efeito: 'nenhuma operação copiada' });
          ctx.toast('Agora em ' + to.name + ' · recibo ' + r.id + '.');
        } });
      }; };
      var alerts = [];
      if (noAccess) alerts.push({ tone: 'risk', title: 'Sem acesso', text: 'Sua capacidade financeiro.ambientes não inclui trocar de contexto. Peça a Bia F.; você continua vendo só leitura.' });
      if (scn === 'outra') alerts.push({ tone: 'risk', title: 'Conta diferente', text: 'O provedor respondeu com acct_plat_AR, não com acct_plat_BR. Não opere até a conta ser conferida.', btns: [{ label: 'Abrir pendência', kind: 'outline', go: function () { var r = O6.receipt({ acao: 'Pendência aberta: conta do provedor divergente', alvo: 'acct_plat_BR', motivo: 'provedor respondeu acct_plat_AR', efeito: 'operações suspensas até conferência' }); ctx.toast('Pendência aberta · recibo ' + r.id + '.'); } }] });
      if (scn === 'incompleto') alerts.push({ tone: 'warn', title: 'Teste incompleto', text: 'Pix ainda não foi homologado em Teste. Fluxos com Pix não podem ser provados antes de irem para Produção.' });
      if (indisp) alerts.push({ tone: 'warn', title: 'Consulta indisponível', text: 'O processador não respondeu às 14:02. Mostrando a última prova (' + e.prova + '); a prontidão não é presumida.', btns: [{ label: 'Consultar de novo', kind: 'outline', ic: 'refresh', go: function () { ctx.toast('Processador ainda indisponível às ' + U.now() + ' BRT.'); } }] });
      return O6.page(ctx, {
        title: 'Ambiente e conta', sub: 'Contexto inequívoco',
        acts: [{ label: 'Consultar agora', kind: 'outline', ic: 'refresh', dis: indisp, go: function () { e.prova = U.now(); ctx.toast('Prova de consulta feita às ' + e.prova + ' BRT · ' + e.name + ' responde.'); } }],
        ctx: O6.ctx('financeiro.ambientes', 'Processador · conta plataforma'),
        alerts: alerts,
        main: [
          { t: 'kv', title: 'Contexto atual', sub: 'Trocar pede confirmação e não copia operações', seg: noAccess ? null : A.ambientes.map(function (x) { return { label: x.name, on: x.id === A.atual, pick: switchTo(x.id) }; }), segLabel: 'Ambiente', badge: [e.name, e.id === 'producao' ? 'risk' : 'warn'], rows: [
            ['Conta', scn === 'outra' ? 'acct_plat_AR (esperado acct_plat_BR)' : e.conta, 'processador', scn === 'outra' ? 'risk' : ''],
            ['Responsável', e.resp],
            ['Prontidão', scn === 'incompleto' && e.id === 'producao' ? 'Teste incompleto · Pix não homologado' : e.prontidao, '', e.prontidao === 'pronta' && scn !== 'incompleto' ? 'ok' : 'warn'],
            ['Última prova de consulta', indisp ? e.prova + ' · consulta atual falhou' : e.prova, 'processador · 26/10']
          ] },
          { t: 'note', tone: 'info', nTitle: 'Troca de contexto', text: 'Mudar para ' + (e.id === 'producao' ? 'Teste' : 'Produção') + ' não copia operações; a faixa de ambiente muda de cor.' }
        ],
        rail: [
          { t: 'list', title: 'Ambientes', rows: A.ambientes.map(function (x) { return { title: x.name + ' · ' + x.conta, sub: x.prontidao + ' · prova ' + x.prova, ic: x.id === 'producao' ? 'shield' : 'wand', badge: x.id === A.atual ? ['em uso', 'ink'] : null }; }) },
          scn === 'incompleto' ? { t: 'kv', title: 'Pendência de Teste', rows: [['O que falta', 'homologar Pix em Teste'], ['Responsável', 'Bia F.']], btns: [{ label: 'Abrir pendência', kind: 'outline', go: function () { var r = O6.receipt({ acao: 'Pendência aberta: homologar Pix em Teste', alvo: 'acct_test_BR', motivo: 'teste incompleto', efeito: 'responsável Bia F.' }); ctx.toast('Pendência aberta · recibo ' + r.id + '.'); } }] } : null
        ]
      });
    }
  });

  // ---------- FA08.B · Mercado, produto e canal ----------
  REG.screen({
    page: 'operacao', key: 'fa08b', id: 'FA08.B', title: 'Mercado, produto e canal', mtitle: 'Mercado e canal', nav: 'financeiro', back: 'FA08', wide: true,
    testIds: ['m4'],
    scens: [['naohab', 'País não habilitado'], ['metodo', 'Método indisponível']],
    vals: function (ctx) {
      var M = DB.o6_matriz, scn = ctx.scn, md = O6.md(ctx, scn === 'naohab' ? 'm4' : 'm1');
      var pixOff = scn === 'metodo';
      var m = M.find(function (x) { return x.id === md.sel; }) || M[0];
      var motivo = String(O6.uiv(ctx, 'motivo', ''));
      var metodos = function (x) { return pixOff && x.metodos.indexOf('Pix') >= 0 ? 'cartão · Pix indisponível' : x.metodos; };
      var rows = M.map(function (x) {
        return { title: x.pais + ' · ' + x.canal + (x.fam !== '—' ? ' · ' + x.fam : ''), sub: metodos(x), ic: 'grid', badge: [x.st, TONE[x.st] || 'plain'], on: x.id === m.id, go: md.pick(x.id),
          cells: [{ t: x.pais, b: true }, x.moeda, x.fam, x.canal, x.st === 'homologado' ? (pixOff && x.metodos.indexOf('Pix') >= 0 ? { t: metodos(x), tone: 'warn' } : x.metodos) : { t: x.metodos, tone: TONE[x.st] || 'plain' }] };
      });
      var encaminhar = function () {
        if (!motivo.trim()) { ctx.setUi({ tried: true }); return; }
        ctx.ask({ title: 'Encaminhar pendência de habilitação?', text: 'O responsável recebe a pendência. Nada é habilitado por aqui.', lines: ['Combinação: ' + m.pais + ' · ' + m.fam + ' · ' + m.canal, 'Situação: ' + m.st, 'Responsável: ' + m.resp, 'Motivo: ' + motivo], ok: 'Encaminhar', onOk: function () {
          var r = O6.receipt({ acao: 'Pendência de habilitação encaminhada', alvo: m.pais + ' · ' + m.fam + ' · ' + m.canal, motivo: motivo, efeito: 'responsável: ' + m.resp });
          m.enc = r.id; ctx.toast('Encaminhado · recibo ' + r.id + '.');
        } });
      };
      var pending = m.st !== 'homologado';
      return O6.page(ctx, {
        title: 'Mercado, produto e canal', sub: 'Matriz efetiva',
        ctx: O6.ctx('financeiro.ambientes', 'BR · AR'),
        alerts: [
          scn === 'naohab' ? { tone: 'warn', title: 'País não habilitado', text: 'Argentina não tem provedor, moeda nem método homologados. Não há alternativa permitida; o responsável é o comercial.' } : null,
          pixOff ? { tone: 'warn', title: 'Método indisponível', text: 'Pix está indisponível no processador desde 13:40. Cartão continua; ninguém é cobrado duas vezes.' } : null
        ],
        sel: md.mSel, mBack: md.mSel ? md.back : null,
        main: [
          { t: 'table', role: 'master', title: 'Combinações', sub: 'só homologadas vendem · fonte: processador e comercial · ' + O6.NOW, cols: ['País', 'Moeda', 'Família', 'Canal', 'Métodos'], rows: rows },
          { t: 'note', role: 'master', tone: 'info', text: 'Idioma não habilita país, provedor ou método. Pix ou cartão web não valem automaticamente dentro do app.' }
        ],
        rail: [
          { t: 'kv', role: 'detail', title: m.pais + ' · ' + m.canal, badge: [m.st, TONE[m.st] || 'plain'], rows: [
            ['País e moeda', m.pais + ' · ' + m.moeda], ['Família', m.fam], ['Vendedor contratual', m.vend], ['Entrega', m.entrega], ['Canal', m.canal], ['Métodos efetivos', metodos(m), 'processador · 26/10 14:00 BRT'], ['Responsável', m.resp], ['Encaminhado', m.enc || '—']
          ], foot: pending ? 'Bloqueado até decisão do responsável. Não prometa alternativa não permitida.' : '' },
          pending && !m.enc ? { t: 'form', role: 'detail', title: 'Encaminhar pendência', fields: [O6.motivo(ctx, 'motivo', { ph: 'Ex.: treinadores pedem Pro no app' })], btns: [{ label: 'Encaminhar pendência', kind: 'primary', go: encaminhar }] } : null
        ]
      });
    }
  });

  // ---------- FA08.C · Integração e conciliação ----------
  REG.screen({
    page: 'operacao', key: 'fa08c', id: 'FA08.C', title: 'Integração e conciliação', mtitle: 'Integração', nav: 'financeiro', back: 'FA08', wide: true,
    testIds: ['e3'],
    scens: [['atrasado', 'Evento atrasado'], ['duplicado', 'Duplicado'], ['parcial', 'Falha parcial'], ['fora', 'Provedor fora']],
    vals: function (ctx) {
      var E = DB.o6_eventos, scn = ctx.scn, md = O6.md(ctx, scn === 'atrasado' ? 'e2' : 'e3');
      var fora = scn === 'fora';
      var view = E.map(function (x) {
        var o = Object.assign({}, x);
        if (scn === 'atrasado' && x.id === 'e2') { o.atraso = '2 h 10 min'; o.ult = '11:52'; }
        if (scn === 'duplicado' && x.id === 'e1') { o.proc = 'duplicado ignorado'; }
        if (scn === 'parcial' && x.id === 'e2') { o.proc = '2 de 3 processados'; }
        if (fora) { o.atraso = x.ult === '—' ? '—' : 'sem dados desde 13:10'; o.proc = '—'; }
        return o;
      });
      var e = view.find(function (x) { return x.id === md.sel; }) || view[0];
      var motivo = String(O6.uiv(ctx, 'motivo', ''));
      var rows = view.map(function (x) {
        var late = x.atraso !== '—';
        return { title: x.ev + ' · ' + (x.ult === '—' ? 'sem recepção' : x.ult), sub: (late ? 'atraso ' + x.atraso + ' · ' : '') + 'processamento ' + x.proc + ' · ' + x.fluxo, ic: 'activity', badge: x.fluxo === 'homologado' && !late ? null : [x.fluxo === 'homologado' ? 'atraso' : x.fluxo, 'warn'], on: x.id === e.id, go: md.pick(x.id),
          cells: [{ t: x.ev, b: true }, x.ult, late ? { t: x.atraso, tone: 'warn' } : '—', x.proc, { t: x.fluxo, tone: TONE[x.fluxo] || 'plain' }] };
      });
      var incidente = function () {
        if (!motivo.trim()) { ctx.setUi({ tried: true }); return; }
        ctx.ask({ title: 'Encaminhar incidente técnico?', text: 'A engenharia recebe o diagnóstico seguro (sem segredos de assinatura).', lines: ['Evento: ' + e.ev, 'Última recepção: ' + e.ult + ' · atraso ' + e.atraso, 'Fluxo: ' + e.fluxo, 'Motivo: ' + motivo], ok: 'Encaminhar incidente', onOk: function () {
          var r = O6.receipt({ acao: 'Incidente técnico encaminhado', alvo: 'Webhook ' + e.ev, motivo: motivo, efeito: 'engenharia notificada · nada reprocessado' });
          var src = DB.find('o6_eventos', e.id); if (src) src.inc = r.id;
          ctx.setUi({ tried: false }); ctx.toast('Incidente encaminhado · recibo ' + r.id + '.');
        } });
      };
      var srcE = DB.find('o6_eventos', e.id);
      var problem = e.fluxo !== 'homologado' || e.atraso !== '—' || e.proc !== 'ok';
      return O6.page(ctx, {
        title: 'Integração e conciliação', sub: 'Eventos',
        acts: [{ label: 'Consultar diagnóstico', kind: 'outline', ic: 'refresh', dis: fora, go: function () { ctx.toast('Diagnóstico às ' + U.now() + ' BRT: payment.succeeded ok; refund.updated com atraso; payout.failed sem cobertura.'); } }, { label: 'Abrir FA03', kind: 'ghost', go: function () { GO('FA03'); } }],
        ctx: O6.ctx('financeiro.ambientes', 'Webhooks do processador', fora ? 'último dado 26/10 · 13:10 BRT' : O6.NOW),
        alerts: [
          scn === 'atrasado' ? { tone: 'warn', title: 'Evento atrasado', text: 'refund.updated não chega há 2 h 10 min. Reembolsos podem aparecer como “em andamento”; consulte o processador antes de qualquer nova tentativa.' } : null,
          scn === 'duplicado' ? { tone: 'info', title: 'Duplicado', text: 'payment.succeeded chegou 2× para PD-10388. Processado uma vez; a duplicata foi ignorada pela referência idempotente.' } : null,
          scn === 'parcial' ? { tone: 'warn', title: 'Falha parcial', text: 'refund.updated: 2 de 3 eventos processados. O terceiro (RF-76) aguarda reconsulta; nada foi reprocessado em dobro.' } : null,
          fora ? { tone: 'risk', title: 'Provedor fora', text: 'Sem eventos desde 13:10. Contagens afetadas aparecem como “—”, não como zero. Não declare prontidão.' } : null
        ],
        sel: md.mSel, mBack: md.mSel ? md.back : null,
        main: [
          { t: 'table', role: 'master', title: 'Eventos necessários', sub: 'fonte: processador · ' + (fora ? 'até 13:10' : O6.NOW), cols: ['Evento', 'Última recepção', 'Atraso', 'Processamento', 'Fluxo'], rows: rows },
          { t: 'note', role: 'master', tone: 'info', text: 'Prontidão por evidência: configuração salva não é prova. Segredos de assinatura e botões de infraestrutura não aparecem aqui.' }
        ],
        rail: [
          { t: 'kv', role: 'detail', title: e.ev, badge: [e.fluxo, TONE[e.fluxo] || 'plain'], rows: [['Última recepção', e.ult, 'processador · 26/10'], ['Atraso', e.atraso], ['Processamento', e.proc], ['Conciliação', e.fluxo === 'homologado' ? 'diária · 06:00' : 'sem regra'], ['Fluxo', e.fluxo], ['Incidente', srcE && srcE.inc ? srcE.inc : '—']],
            foot: problem ? 'Próxima ação: encaminhar incidente técnico. Não reprocessar manualmente.' : 'Sem ação necessária.' },
          problem && !(srcE && srcE.inc) ? { t: 'form', role: 'detail', title: 'Encaminhar incidente técnico', fields: [O6.motivo(ctx, 'motivo', { ph: 'Ex.: payout.failed sem cobertura impede avisar treinador' })], btns: [{ label: 'Encaminhar incidente', kind: 'primary', go: incidente }] } : null
        ]
      });
    }
  });
})();
