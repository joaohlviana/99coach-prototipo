/* O4 · OPS16 Analytics e tags opcionais (+ OPS16.A finalidades, OPS16.B estado efetivo, OPS16.C qualidade).
   Consentimento, tags ligadas/desligadas (pedido ≠ efeito), prévia de eventos sem dados pessoais.
   Sem campo de script livre, sem segredos, sem replay e nada de telas de saúde. */
(function () {
  'use strict';
  DB.seed('o4_tags', [
    { id: 'produto', fin: 'Produto', finLong: 'Medição do produto', ferr: 'interno', adapt: 'analytics-a', v: 3, aprov: 'ok', efetivo: 'ativo', solicitado: 'ativo v3', obs: 'ativo v3 · 13:58', escopo: 'eventos sem saúde/chat', base: 'consentimento', pend: false },
    { id: 'marketing', fin: 'Marketing', finLong: 'Anúncios', ferr: 'pixel', adapt: '—', v: 0, aprov: 'pendente', efetivo: 'inativo', solicitado: 'inativo', obs: 'inativo', escopo: '—', base: 'não aprovado', pend: false }
  ]);
  DB.seed('o4_consent', { modo: 'opt-in · desligado por padrão', banner: 'v2 · publicado em 01/10', aceite: '61%', aceiteFonte: 'analytics-a · 7 dias até 26/10 14:02', revog: 'propagam em 2 min · último 13:41' });
  DB.seed('o4_eventos', [
    { name: 'pagina_vista', at: '14:01:52', fields: [['rota', '/explorar'], ['origem', 'busca'], ['sessao', 's_••••91']] },
    { name: 'busca_feita', at: '14:01:58', fields: [['esporte', 'CrossFit'], ['cidade', 'Londrina'], ['resultados', '12']] },
    { name: 'oferta_vista', at: '14:02:03', fields: [['oferta', 'o1'], ['treinador', 'rafael']] },
    { name: 'checkout_iniciado', at: '14:02:10', fields: [['oferta', 'o1'], ['faixa_valor', '100–200']], cut: [['email', 'removido'], ['nome', 'removido']] }
  ]);

  function tone(st) { return /^ativo/.test(st) ? 'ok' : (/pend|aguarda|pausa/.test(st) ? 'warn' : (/revog|fora|não aprov/.test(st) ? 'risk' : 'plain')); }
  var links = function () {
    return O4.card({ title: 'Detalhes da coleta', parts: [O4.P.links([
      ['Finalidades e adaptadores', 'O que é coletado, por quem e com qual base', 'target', function () { GO('OPS16.A'); }],
      ['Estado efetivo e revogação', 'Pedido × efeito observado; pausa e retomada', 'activity', function () { GO('OPS16.B'); }],
      ['Qualidade e auditoria', 'Aceitos, rejeitados e duplicados, sem pessoas', 'chart', function () { GO('OPS16.C'); }]
    ])] });
  };
  var outAlert = function () { return O4.P.alert('ink', 'Fora do analytics', 'Saúde, chat, prompts, respostas da IA, cartão e segredos nunca vão para analytics ou replay.'); };

  /* ===================== OPS16 · composição ===================== */
  REG.screen({
    page: 'operacao', key: 'ops16', id: 'OPS16', title: 'Analytics e tags', mtitle: 'Analytics', nav: 'governanca', back: 'OPS14', wide: true,
    testIds: ['marketing'],
    normal: 'Coleta em uso',
    scens: [['salvo', 'Salvo ≠ ativo'], ['revogado', 'Revogado'], ['saude', 'Telas de saúde']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn, P = O4.P;
      var tags = DB.o4_tags.map(function (t) { return Object.assign({}, t); });
      if (scn === 'revogado') { tags[1].efetivo = 'revogado v2'; tags[1].obs = 'revogado v2 · 20/10'; tags[1].aprov = 'revogada'; }
      if (scn === 'salvo') { tags[0].solicitado = 'ativo v4'; }
      var pk = O4.pick(ctx, tags), t = pk.it, real = DB.find('o4_tags', t.id);
      var cs = DB.o4_consent;
      var dec = O4.dec(ctx, 'coleta', {
        desligar: { title: 'Desligar ' + t.finLong.toLowerCase(), acao: 'Pedido para desligar a coleta', alvo: t.adapt + ' · ' + t.finLong, ok: 'Pedir desligamento', danger: true, estado: 'solicitado',
          what: 'O pedido vale na hora; o efeito aparece quando o adaptador confirmar.',
          impact: ['A coleta de ' + t.finLong.toLowerCase() + ' para de receber eventos novos em até 2 min (propagação).', 'Treino, login e compra continuam funcionando: analytics fora não desliga o produto.', 'Eventos já recebidos seguem a política de retenção vigente.'],
          apply: function () { real.solicitado = 'pausado'; real.pend = true; return { q: 0 }; } },
        ligar: { title: 'Religar ' + t.finLong.toLowerCase(), acao: 'Pedido para religar a coleta', alvo: t.adapt + ' · ' + t.finLong, ok: 'Pedir religamento', estado: 'solicitado',
          impact: ['Volta a coletar só de quem consentiu (opt-in), na versão aprovada v' + t.v + '.', 'Telas de saúde continuam fora.'],
          apply: function () { real.solicitado = 'ativo v' + real.v; real.pend = true; return { q: 0 }; } }
      });
      var consult = function () {
        DB.o4_tags.forEach(function (x) { if (x.pend) { x.pend = false; x.efetivo = /pausado/.test(x.solicitado) ? 'pausado' : 'ativo'; x.obs = x.solicitado + ' · ' + U.now(); } });
        O4.consult(ctx, 'Estado observado atualizado.')();
      };
      var alerts = [];
      if (scn === 'salvo') alerts.push(P.alert('clock', 'Salvo ≠ ativo', 'Estado efetivo verificado: a configuração v4 foi salva às 13:50, mas o observado continua ativo v3. Não salve de novo.', [{ label: 'Consultar de novo', fn: O4.consult(ctx, 'Observado continua ativo v3. Aguarde a propagação.') }]));
      if (scn === 'revogado') alerts.push(P.alert('info', 'Revogado', 'Versão: o pixel de marketing foi revogado na v2, em 20/10. Nada é coletado para anúncios.'));
      if (scn === 'saude' && !ui.okSaude) {
        return O4.view(ctx, { title: 'Analytics e tags', comp: 'OPS16',
          alerts: [P.alert('ink', 'Telas de saúde', 'Sempre fora: anamnese, check-in, avaliações, chat e respostas da IA nunca carregam tags nem gravação de sessão, mesmo com consentimento.', [{ label: 'Continuar', cls: 'btn--primary btn--sm', fn: function () { ctx.setUi({ okSaude: true }); } }])] });
      }
      if (real.pend) alerts.push(P.alert('clock', 'Pedido ≠ efeito', 'Pedido registrado: ' + real.solicitado + '. O observado ainda é “' + real.obs + '”. Consulte antes de pedir de novo.', [{ label: 'Consultar de novo', fn: consult }]));
      var rows = tags.map(function (x) { return { cells: [x.fin, x.ferr, [x.aprov, x.aprov === 'ok' ? 'ok' : (x.aprov === 'pendente' ? 'warn' : 'risk')], [x.efetivo, tone(x.efetivo)]], title: x.fin, meta: x.aprov === 'ok' ? x.efetivo + ' · v' + x.v : (x.aprov === 'pendente' ? 'aguarda aprovação' : x.efetivo), badge: x.efetivo, tone: tone(x.efetivo), go: pk.sel(x.id), on: x.id === t.id }; });
      var on = /ativo/.test(t.solicitado);
      var canSwitch = t.aprov === 'ok' && !real.pend;
      var evs = DB.o4_eventos.map(function (e) { return { name: e.name, at: e.at, fields: e.fields.concat(ui.cut ? (e.cut || []).map(function (c) { return [c[0], c[1], true]; }) : []) }; });
      return O4.view(ctx, {
        title: 'Analytics e tags', sub: 'Consentimento, tags opcionais e prévia de eventos', comp: 'OPS16', alerts: alerts, dec: dec,
        md: { picked: pk.picked, label: 'Todas as tags' },
        main: [
          O4.card({ title: 'Analytics e tags', sub: 'Toque em uma finalidade para ver o estado efetivo', parts: [P.table(['Finalidade', 'Ferramenta', 'Aprovação', 'Efetivo'], rows)] }),
          O4.card({ title: 'Consentimento', parts: [
            P.kv([['Modo', cs.modo], ['Aviso de cookies', cs.banner], ['Aceitaram medição', cs.aceite], ['Revogações', cs.revog]]),
            P.note('Fonte do aceite: ' + cs.aceiteFonte + '. Quem não aceita usa o produto do mesmo jeito.', true)
          ] }),
          O4.card({ title: 'Prévia de eventos', sub: 'Exemplos sintéticos, sem dados pessoais', parts: [
            P.events(evs),
            P.chips('', [[ui.cut ? 'Ocultar campos removidos' : 'Mostrar campos removidos', !!ui.cut, function () { ctx.setUi({ cut: !ui.cut }); }]]),
            outAlert()
          ] }),
          links(), O4.rcCard('coleta')
        ],
        side: [O4.card({ title: t.finLong, tag: t.efetivo, tone: tone(t.efetivo), parts: [
          P.kv([['Ferramenta', t.ferr], ['Adaptador', t.adapt], ['Versão', t.v ? 'v' + t.v : '—'], ['Escopo', t.escopo], ['Base', t.base], ['Solicitado', real.solicitado], ['Observado', real.obs]]),
          P.switches([{ title: 'Coleta', sub: canSwitch ? 'Ligar ou desligar pede motivo e gera recibo.' : (t.aprov === 'ok' ? 'Aguarde a confirmação do pedido anterior.' : 'Sem aprovação: não liga por aqui.'), on: on, dis: !canSwitch, toggle: dec.open(on ? 'desligar' : 'ligar'), badge: on ? 'ligada' : 'desligada', tone: on ? 'ok' : 'plain' }]),
          t.aprov !== 'ok' ? P.alert('warn', 'Aguarda aprovação', 'O pixel de marketing precisa de aprovação de Jurídico e Produto. O interruptor não habilita nada.', [{ label: 'Ver finalidades', fn: function () { GO('OPS16.A'); } }]) : null
        ] })]
      });
    }
  });

  /* ===================== OPS16.A · finalidades e adaptadores ===================== */
  var CAMPOS_OK = ['rota', 'origem', 'esporte', 'cidade', 'oferta', 'treinador (id público)', 'faixa_valor', 'versao_app'];
  var CAMPOS_NAO = ['nome', 'e-mail', 'telefone', 'mensagem', 'anamnese', 'peso', 'foto', 'cartão', 'prompt e resposta da IA'];
  REG.screen({
    page: 'operacao', key: 'ops16a', id: 'OPS16.A', title: 'Coleta · finalidades', mtitle: 'Finalidades', nav: 'governanca', back: 'OPS16', wide: true,
    normal: 'Adaptadores aprovados',
    scens: [['naoaprov', 'Não aprovado'], ['semconsent', 'Consentimento ausente'], ['politica', 'Política pendente'], ['indisp', 'Capacidade indisponível']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn, P = O4.P;
      var pk = O4.pick(ctx, DB.o4_tags), t = pk.it;
      var blocked = t.aprov !== 'ok' || scn === 'indisp' || scn === 'semconsent' || scn === 'politica';
      var dec = O4.dec(ctx, 'coleta', {
        preparar: { title: 'Preparar configuração · ' + t.finLong, acao: 'Rascunho de configuração preparado', alvo: t.adapt + ' · v' + (t.v + 1) + ' (rascunho)', ok: 'Preparar rascunho', estado: 'rascunho',
          impact: ['Cria o rascunho v' + (t.v + 1) + ' com os campos do catálogo autorizado.', 'Nada é ativado: a ativação passa por aprovação e aparece em Estado efetivo.', 'Campos fora do catálogo não podem ser adicionados.'] }
      });
      var alerts = [];
      if (scn === 'naoaprov') { alerts.push(P.alert('warn', 'Não aprovado', 'Anúncios não tem adaptador aprovado. Preparar configuração fica bloqueado para essa finalidade.')); }
      if (scn === 'semconsent') alerts.push(P.alert('risk', 'Consentimento ausente', 'A base de Medição do produto é consentimento e o aviso de cookies v2 não está publicado no mercado BR. Nada é coletado até publicar.'));
      if (scn === 'politica') alerts.push(P.alert('warn', 'Política pendente', 'A política de privacidade v5 aguarda publicação. Configurações novas esperam a política.'));
      if (scn === 'indisp') alerts.push(P.alert('risk', 'Capacidade indisponível', 'Você não tem coleta.preparar hoje. Peça a Produto · Dados para preparar a configuração.'));
      var rows = DB.o4_tags.map(function (x) { return { cells: [x.finLong, x.adapt, x.v ? 'v' + x.v : '—', x.escopo, [x.base, x.aprov === 'ok' ? 'ok' : 'warn']], title: x.finLong, meta: x.aprov === 'ok' ? x.adapt + ' v' + x.v : 'não aprovado', badge: x.aprov === 'ok' ? 'aprovado' : 'não aprovado', tone: x.aprov === 'ok' ? 'ok' : 'warn', go: pk.sel(x.id), on: x.id === t.id }; });
      return O4.view(ctx, {
        title: 'Coleta · finalidades', sub: 'Adaptadores aprovados', cap: scn === 'indisp' ? 'coleta.ler' : 'coleta.ler · coleta.preparar', alvo: 'Mercado BR',
        acts: [{ label: ui.cat ? 'Fechar catálogo' : 'Catálogo de campos', cls: 'btn--outline btn--sm', ic: 'list', fn: function () { ctx.setUi({ cat: !ui.cat }); } }, { label: 'Preparar configuração', cls: 'btn--primary btn--sm', dis: blocked, fn: dec.open('preparar') }],
        alerts: alerts, dec: dec, md: { picked: pk.picked, label: 'Todas as finalidades' },
        main: [O4.card({ title: 'Finalidades', parts: [P.table(['Finalidade', 'Adaptador', 'Versão', 'Escopo', 'Base'], rows), outAlert()] }),
          ui.cat ? O4.card({ title: 'Catálogo de campos autorizados', sub: 'Mercado BR · v3', parts: [
            P.chips('Podem ser coletados', CAMPOS_OK.map(function (c) { return [c, true, null, true]; })),
            P.chips('Nunca coletados', CAMPOS_NAO.map(function (c) { return [c, false, null, true]; })),
            P.note('Não existe campo livre nem script colado. Novos campos passam por Jurídico e Produto.', true)
          ] }) : null],
        side: [O4.card({ title: t.finLong, tag: t.aprov === 'ok' ? 'aprovado' : 'não aprovado', tone: t.aprov === 'ok' ? 'ok' : 'warn', parts: [
          P.kv([['Finalidade', t.finLong], ['Adaptador', t.adapt], ['Versão', t.v ? 'v' + t.v : '—'], ['Escopo', t.escopo], ['Base', t.base], ['Mercado', 'BR']]),
          t.aprov !== 'ok' ? P.note('Sem adaptador aprovado: esta finalidade não coleta nada.', true) : null
        ] }), O4.rcCard('coleta')]
      });
    }
  });

  /* ===================== OPS16.B · estado efetivo e revogação ===================== */
  REG.screen({
    page: 'operacao', key: 'ops16b', id: 'OPS16.B', title: 'Estado efetivo', mtitle: 'Estado efetivo', nav: 'governanca', back: 'OPS16', wide: true,
    normal: 'Ativo e confirmado',
    scens: [['salvo', 'Salvou mas não ativou'], ['parcial', 'Revogação parcial'], ['fora', 'Adaptador fora'], ['atraso', 'Evento atrasado']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn, P = O4.P;
      var t = DB.find('o4_tags', 'produto');
      var sol = scn === 'salvo' && !t.pend ? 'ativo v4' : t.solicitado;
      var obs = scn === 'fora' ? 'sem resposta desde 13:20' : t.obs;
      var paused = /pausado/.test(t.solicitado);
      var dec = O4.dec(ctx, 'coleta', {
        pausa: { title: 'Solicitar pausa · analytics-a', acao: 'Pausa da coleta solicitada', alvo: 'analytics-a · BR', ok: 'Solicitar pausa', danger: true, estado: 'solicitado',
          impact: ['A medição do produto para de receber eventos novos em até 2 min.', 'Treino, login e compra não dependem do analytics e continuam funcionando.', 'O efeito só vale quando o observado mostrar “pausado”.'],
          apply: function () { t.solicitado = 'pausado'; t.pend = true; return { q: 0 }; } },
        retomar: { title: 'Revisar retomada · analytics-a', acao: 'Retomada da coleta solicitada', alvo: 'analytics-a · BR', ok: 'Solicitar retomada', estado: 'solicitado',
          impact: ['Volta a coletar na v' + t.v + ', só de quem consentiu.', 'Revogações recebidas durante a pausa continuam valendo.'],
          apply: function () { t.solicitado = 'ativo v' + t.v; t.pend = true; return { q: 0 }; } }
      });
      var consult = function () { if (t.pend) { t.pend = false; t.efetivo = paused ? 'pausado' : 'ativo'; t.obs = t.solicitado + ' · ' + U.now(); } O4.consult(ctx, t.pend ? 'Sem mudança.' : 'Observado: ' + t.obs + '.')(); };
      var alerts = [];
      if (scn === 'salvo') alerts.push(P.alert('clock', 'Salvou mas não ativou', 'A v4 foi salva às 13:50, mas o adaptador ainda observa v3. Consulte antes de salvar de novo.', [{ label: 'Consultar de novo', fn: O4.consult(ctx, 'Observado continua ativo v3.') }]));
      if (scn === 'parcial') alerts.push(P.alert('risk', 'Revogação parcial', '3 de 4 destinos confirmaram a revogação das 13:41; analytics-a ainda não. Até confirmar, trate como não revogado no destino.', [{ label: 'Consultar de novo', fn: O4.consult(ctx, 'analytics-a ainda não confirmou.') }]));
      if (scn === 'fora') alerts.push(P.alert('risk', 'Adaptador fora', 'analytics-a não responde desde 13:20. Eventos ficam na fila local por até 24 h; nada de saúde entra na fila. O produto segue normal.'));
      if (scn === 'atraso') alerts.push(P.alert('warn', 'Evento atrasado', 'Último evento observado às 13:58. Atraso de até 15 min é esperado; acima disso, abra caso.'));
      if (t.pend) alerts.push(P.alert('clock', 'Pedido ≠ efeito', 'Solicitado: ' + t.solicitado + '. Observado: ' + t.obs + '. Consulte antes de pedir de novo.', [{ label: 'Consultar de novo', fn: consult }]));
      return O4.view(ctx, {
        title: 'Estado efetivo', sub: 'analytics-a · BR', cap: 'coleta.alterar', alvo: 'Adaptador analytics-a',
        acts: [paused ? { label: 'Revisar retomada', cls: 'btn--primary btn--sm', dis: t.pend, fn: dec.open('retomar') } : { label: 'Solicitar pausa', cls: 'btn--outline btn--sm mod-danger', dis: t.pend, fn: dec.open('pausa') }],
        alerts: alerts, dec: dec,
        main: [O4.card({ title: 'Intenção × efeito', parts: [
          P.kv([['Solicitado', sol, t.pend || sol !== t.solicitado ? 'warn' : ''], ['Observado', obs, scn === 'fora' ? 'risk' : ''], ['Revogação', 'consentimentos revogados propagam em 2 min · último 13:41' + (scn === 'parcial' ? ' · parcial' : '')], ['Destino', 'analytics-a (BR)'], ['Versão', 'v' + t.v]]),
          P.btns([{ label: 'Consultar de novo', cls: 'btn--outline btn--sm', ic: 'refresh', fn: consult }]),
          P.note('Pausar analytics não desliga treino, login ou compra.', true)
        ] })],
        side: [O4.rcCard('coleta')]
      });
    }
  });

  /* ===================== OPS16.C · qualidade e auditoria ===================== */
  REG.screen({
    page: 'operacao', key: 'ops16c', id: 'OPS16.C', title: 'Qualidade da coleta', mtitle: 'Qualidade', nav: 'governanca', back: 'OPS16', wide: true,
    normal: 'Últimas 24 h',
    scens: [['lacuna', 'Lacuna de cobertura'], ['identidade', 'Identidade invalidada'], ['replay', 'Replay rejeitado'], ['atraso', 'Atraso'], ['sembase', 'Ausência de base']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn, P = O4.P;
      var w = ui.win || '24h';
      var D = w === '24h'
        ? { ac: '182 k', rj: '1,2 k', du: '310', mot: [['campo proibido removido', '980', 'v3'], ['replay rejeitado', '220', 'v3']], pct: [82, 18], lbl: 'Últimas 24 h', src: 'analytics-a · 24 h até 26/10 14:02' }
        : { ac: '1,26 mi', rj: '8,4 k', du: '2,1 k', mot: [['campo proibido removido', '6.900', 'v3'], ['replay rejeitado', '1.500', 'v3']], pct: [82, 18], lbl: 'Últimos 7 dias', src: 'analytics-a · 7 dias até 26/10 14:02' };
      var dec = O4.dec(ctx, 'coleta', {
        diag: { title: 'Abrir diagnóstico restrito', acao: 'Diagnóstico restrito aberto', alvo: 'analytics-a · ' + D.lbl, ok: 'Abrir por 30 min', estado: 'acesso por 30 min',
          impact: ['Mostra amostra técnica dos rejeitados, sem conteúdo clínico, prompt, chat ou nomes.', 'O acesso expira em 30 min e fica no recibo.'],
          apply: function () { return { diag: true }; } },
        caso: { title: 'Encaminhar caso', acao: 'Caso de qualidade encaminhado', alvo: 'analytics-a · ' + D.lbl, ok: 'Encaminhar caso', estado: 'caso aberto',
          impact: ['Produto · Dados recebe os agregados e a definição de cada motivo.', 'Nenhum dado de pessoa vai junto.'] }
      });
      var alerts = [];
      if (scn === 'lacuna') alerts.push(P.alert('warn', 'Lacuna de cobertura', 'Sem eventos do app iOS entre 03:00 e 04:10. Os totais ficam abaixo do real nesse intervalo.'));
      if (scn === 'identidade') alerts.push(P.alert('info', 'Identidade invalidada', 'Sessões com o identificador trocado após revogação de consentimento contam como novas, sem ligação com a pessoa.'));
      if (scn === 'replay') alerts.push(P.alert('risk', 'Replay rejeitado', 'Gravação de sessão está desligada por política. As tentativas foram recusadas na origem e aparecem como “replay rejeitado”.'));
      if (scn === 'atraso') alerts.push(P.alert('warn', 'Atraso', 'Dados até 13:30; a última meia hora ainda está chegando.', [{ label: 'Consultar de novo', fn: O4.consult(ctx, 'Dados agora até 13:45.') }]));
      if (scn === 'sembase') alerts.push(P.alert('warn', 'Ausência de base', 'Atrasados não têm base de comparação nesta versão; o número aparece com 7 dias de v3.'));
      return O4.view(ctx, {
        title: 'Qualidade da coleta', sub: D.lbl, cap: 'coleta.ler', alvo: 'analytics-a', ts: scn === 'atraso' ? '26/10 · 13:30 BRT' : O4.TS,
        acts: [{ label: 'Abrir diagnóstico restrito', cls: 'btn--outline btn--sm', ic: 'lock', fn: dec.open('diag') }, { label: 'Encaminhar caso', cls: 'btn--primary btn--sm', fn: dec.open('caso') }],
        alerts: alerts, dec: dec,
        main: [O4.card({ title: 'Agregados', parts: [
          P.seg('Período', [['24 h', w === '24h', function () { ctx.setUi({ win: '24h' }); }], ['7 dias', w === '7d', function () { ctx.setUi({ win: '7d' }); }]]),
          P.kpis([['Aceitos', D.ac, 'Eventos válidos recebidos'], ['Rejeitados', D.rj, 'Recusados na validação'], ['Duplicados', D.du, 'Mesmo evento enviado 2 vezes'], ['Atrasados', '—', 'Sem base nesta versão']]),
          P.note('Fonte: ' + D.src + '.', true)
        ] }), O4.card({ title: 'Motivo de rejeição', sub: 'Tabela acessível de apoio ao gráfico', parts: [
          P.bars(D.mot.map(function (m, i) { return [m[0] + ' · ' + m[1], D.pct[i], '']; })),
          P.table(['Motivo de rejeição', 'Qtde', 'Versão'], D.mot.map(function (m) { return { cells: m, title: m[0], meta: m[1] + ' · ' + m[2] }; }), { always: true })
        ] }),
        ui.diag ? O4.card({ title: 'Diagnóstico restrito', tag: 'expira em 30 min', tone: 'warn', parts: [
          P.events([{ name: 'rejeitado · campo proibido', at: '13:12:40', fields: [['evento', 'checkout_iniciado'], ['campo', 'email'], ['ação', 'removido na origem']] }, { name: 'rejeitado · replay', at: '13:20:02', fields: [['origem', 'web'], ['ação', 'recusado']] }]),
          P.note('Amostra técnica sem conteúdo, nomes ou identificadores de pessoas.', true)
        ] }) : null],
        side: [O4.rcCard('coleta')]
      });
    }
  });
})();
