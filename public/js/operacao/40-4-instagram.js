/* O4 · OPS18 Prontidão da integração Instagram (+ OPS18.A capacidade oficial, OPS18.B fluxo de claim, OPS18.C incidente).
   Checklist, permissões, ambiente e teste de conexão simulado. Nunca pede senha, token ou segredo;
   nenhum interruptor simula autorização. Titularidade (claim) segue para OPS03. */
(function () {
  'use strict';
  DB.seed('o4_ig', {
    conta: '@99coach.oficial',
    caps: [
      { id: 'perfil', name: 'Leitura de perfil', longo: 'Ler perfil público', escopo: 'instagram_basic', amb: 'produção', estado: 'aprovado', prox: '—', comprovada: '20/10', validade: '20/01' },
      { id: 'msg', name: 'Mensagens', longo: 'Receber mensagens', escopo: 'instagram_manage_messages', amb: 'produção', estado: 'em revisão', prox: 'aguardar provedor', comprovada: '—', validade: '—' }
    ],
    homolog: [
      { id: 'perfil', estado: 'aprovado' }, { id: 'msg', estado: 'aprovado · só contas de teste' }
    ],
    incidente: { ref: 'INC-11', ultimaProva: '09:10', falha: '429 desde 10:02', fila: 18, pausada: false, manual: false }
  });

  function tone(st) { return /^aprovado|^ok|pronto/.test(st) ? 'ok' : (/revis|pend|aguard/.test(st) ? 'warn' : (/revog|expir|restrit|bloq|não hab/.test(st) ? 'risk' : 'plain')); }
  var links = function () {
    return O4.card({ title: 'Detalhes da integração', parts: [O4.P.links([
      ['Capacidade oficial e ambiente', 'Permissões comprovadas, validade e pendências', 'shield', function () { GO('OPS18.A'); }],
      ['Preparação do fluxo de claim', 'Instrução copiável e o que a pessoa vê', 'instagram', function () { GO('OPS18.B'); }],
      ['Incidente e continuidade', 'INC-11 · caminho manual e pausa', 'alert', function () { GO('OPS18.C'); }]
    ])] });
  };
  var noSecret = function () { return O4.P.note('Nenhuma senha, token ou segredo nesta tela. O treinador nunca informa a senha do Instagram.', true); };

  /* ===================== OPS18 · composição ===================== */
  REG.screen({
    page: 'operacao', key: 'ops18', id: 'OPS18', title: 'Integração Instagram', mtitle: 'Instagram', nav: 'governanca', back: 'OPS14', wide: true,
    testIds: ['msg'],
    normal: 'Mensagens em revisão',
    scens: [['aguardando', 'Aguardando provedor'], ['pronto', 'Pronto'], ['revogada', 'Permissão revogada']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn, P = O4.P, ig = DB.o4_ig;
      var env = ui.env || 'prod';
      var caps = ig.caps.map(function (c) { var x = Object.assign({}, c); if (env === 'hml') { x.amb = 'homologação'; x.estado = ig.homolog.find(function (h) { return h.id === c.id; }).estado; x.prox = '—'; } return x; });
      if (env === 'prod' && scn === 'pronto') { caps[1].estado = 'aprovado'; caps[1].prox = '—'; }
      if (env === 'prod' && scn === 'revogada') { caps[1].estado = 'revogada'; caps[1].prox = 'caminho manual (OPS03.B)'; }
      var pk = O4.pick(ctx, caps), cap = pk.it;
      // teste de conexão simulado: resultado desconhecido exige consulta antes de repetir
      var t = ui.t || null;
      var unknown = !!(t && t.unk && !(ui.q > 0));
      var runTest = function () {
        var msgOk = env === 'hml' || scn === 'pronto';
        var res = { at: U.now(), unk: !msgOk && scn !== 'revogada', steps: [['check', 'Credencial do app', U.now(), 'válida · não exibida', 'ok'], ['check', 'Ler perfil ' + ig.conta, U.now(), 'ok', 'ok'],
          msgOk ? ['check', 'Webhook de mensagens', U.now(), 'ok', 'ok'] : (scn === 'revogada' ? ['x', 'Webhook de mensagens', U.now(), 'permissão revogada', 'risk'] : ['clock', 'Webhook de mensagens', 'sem resposta', 'desconhecido', 'warn'])] };
        ctx.setUi({ t: res, q: 0 });
        ctx.toast('Teste simulado às ' + U.now() + '. Nada foi enviado para pessoas.');
      };
      var alerts = [];
      if (scn === 'aguardando') alerts.push(P.alert('clock', 'Aguardando provedor', 'Revisão de app: Mensagens está em revisão desde 21/10. Nada a fazer até a resposta.', [{ label: 'Consultar de novo', fn: O4.consult(ctx, 'Provedor ainda não respondeu à revisão.') }]));
      if (scn === 'pronto') alerts.push(P.alert('ok', 'Pronto', 'Escopos: instagram_basic e instagram_manage_messages aprovados em produção em 26/10.'));
      if (scn === 'revogada') alerts.push(P.alert('risk', 'Permissão revogada', 'Próximo passo: o provedor revogou Mensagens às 10:02. Claims seguem para revisão manual (OPS03.B).', [{ label: 'Tentar de novo', fn: runTest }, { label: 'Abrir incidente', cls: 'btn--ghost btn--sm', fn: function () { GO('OPS18.C'); } }]));
      var rows = caps.map(function (c) { return { cells: [c.name, c.amb, [c.estado, tone(c.estado)], c.prox], title: c.name, meta: c.amb + (c.prox !== '—' ? ' · ' + c.prox : ''), badge: c.estado, tone: tone(c.estado), go: pk.sel(c.id), on: c.id === cap.id }; });
      var msg = caps[1];
      var checks = [
        { label: 'Conta oficial ' + ig.conta, sub: 'Profissional, verificada em 20/10', st: 'ok' },
        { label: 'App em modo ' + (env === 'hml' ? 'homologação' : 'produção'), sub: env === 'hml' ? 'Só contas de teste cadastradas' : 'Publicado pelo provedor', st: 'ok' },
        { label: 'Permissão: leitura de perfil', sub: 'instagram_basic · válida até 20/01', st: 'ok' },
        { label: 'Permissão: mensagens', sub: 'instagram_manage_messages · ' + msg.estado, st: /^aprovado/.test(msg.estado) ? 'ok' : (msg.estado === 'revogada' ? 'risk' : 'wait'), badge: /^aprovado/.test(msg.estado) ? 'ok' : msg.estado },
        { label: 'Retorno (webhook) configurado', sub: 'Endereço de retorno registrado; segredo fora desta tela', st: 'ok' },
        { label: 'Caminho manual de claim', sub: 'Revisão manual em OPS03.B, com aviso à pessoa', st: 'ok', go: function () { GO('OPS03.B'); }, goLabel: 'Ver' }
      ];
      var done = checks.filter(function (c) { return c.st === 'ok'; }).length;
      var testParts = [P.note('Simula a conexão com dados sintéticos. Não envia mensagens e não pede senha.', true)];
      if (t) {
        testParts.push(P.steps(t.steps.map(function (s) { return [s[0], s[1], s[2], s[3], s[4]]; })));
        if (t.unk) testParts.push(P.alert('clock', 'Resultado desconhecido', ui.q > 0 ? 'Consultado às ' + ui.qAt + ': o webhook segue sem resposta. Pode testar de novo.' : 'O webhook não respondeu. Consulte antes de testar de novo.', [{ label: 'Consultar', fn: O4.consult(ctx, 'Webhook de mensagens continua sem resposta: provável revisão do provedor.') }]));
      }
      testParts.push(P.btns([{ label: t ? 'Testar de novo' : 'Testar conexão (simulada)', cls: 'btn--primary btn--sm', ic: 'refresh', dis: unknown, fn: runTest }]));
      return O4.view(ctx, {
        title: 'Integração Instagram', sub: ig.conta + ' · checklist, permissões e ambiente', comp: 'OPS18', alerts: alerts,
        md: { picked: pk.picked, label: 'Todas as capacidades' },
        main: [
          O4.card({ title: 'Capacidades', sub: 'Toque para ver escopo e validade', parts: [
            P.seg('Ambiente', [['Produção', env === 'prod', function () { ctx.setUi({ env: 'prod', sel: '', t: null }); }], ['Homologação', env === 'hml', function () { ctx.setUi({ env: 'hml', sel: '', t: null }); }]]),
            P.table(['Capacidade', 'Ambiente', 'Estado', 'Próximo passo'], rows)
          ] }),
          O4.card({ title: 'Checklist de prontidão', tag: done + ' de ' + checks.length, tone: done === checks.length ? 'ok' : 'warn', parts: [P.checks(checks), noSecret()] }),
          O4.card({ title: 'Testar conexão', parts: testParts }),
          links(), O4.rcCard('instagram')
        ],
        side: [O4.card({ title: cap.name, tag: cap.estado, tone: tone(cap.estado), parts: [
          P.kv([['Escopo', cap.escopo], ['Ambiente', cap.amb], ['Comprovada em', cap.comprovada], ['Validade', cap.validade], ['Próximo passo', cap.prox]]),
          P.note('Estado lido do provedor; não há interruptor para “conectar”.', true)
        ] })]
      });
    }
  });

  /* ===================== OPS18.A · capacidade oficial e ambiente ===================== */
  REG.screen({
    page: 'operacao', key: 'ops18a', id: 'OPS18.A', title: 'Integração Instagram', mtitle: 'Capacidade oficial', nav: 'governanca', back: 'OPS18', wide: true,
    normal: 'Leitura ok · mensagens em revisão',
    scens: [['naohab', 'Não habilitada'], ['pendente', 'Autorização pendente'], ['expirada', 'Expirada'], ['restrita', 'Restrita'], ['indisp', 'Consulta indisponível']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn, P = O4.P, ig = DB.o4_ig;
      var caps = ig.caps.map(function (c) { return Object.assign({}, c); });
      if (scn === 'naohab') { caps[1].estado = 'não habilitada'; caps[1].prox = 'Produto · pedir capacidade'; }
      if (scn === 'pendente') { caps[1].estado = 'autorização pendente'; caps[1].prox = 'Jurídico · termos do provedor'; }
      if (scn === 'expirada') { caps[0].estado = 'expirada'; caps[0].validade = '20/10'; caps[0].prox = 'renovar comprovação'; }
      if (scn === 'restrita') { caps[0].estado = 'restrita'; caps[0].prox = 'provedor limitou leitura a 200/h'; }
      var pk = O4.pick(ctx, caps), cap = pk.it;
      var dec = O4.dec(ctx, 'instagram', {
        pend: { title: 'Encaminhar pendência · ' + cap.name, acao: 'Pendência da integração encaminhada', alvo: cap.longo + ' · ' + ig.conta, ok: 'Encaminhar', estado: 'pendência aberta',
          impact: ['Responsável: ' + (cap.prox === '—' || cap.prox === 'aguardar provedor' ? 'Plataforma · Integrações' : cap.prox) + '.', 'O estado da capacidade não muda até o provedor confirmar.', 'Nenhuma senha, token ou segredo é pedido ou anexado.'] }
      });
      var alerts = [];
      if (scn === 'naohab') alerts.push(P.alert('warn', 'Não habilitada', 'Receber mensagens não foi pedido ao provedor. Claim por direct fica indisponível; vale o caminho manual.'));
      if (scn === 'pendente') alerts.push(P.alert('warn', 'Autorização pendente', 'Falta aceitar os termos de mensagens do provedor (Jurídico). Nada muda até lá.'));
      if (scn === 'expirada') alerts.push(P.alert('risk', 'Expirada', 'A comprovação de leitura de perfil venceu em 20/10. Leitura pausada até renovar.', [{ label: 'Encaminhar pendência', fn: function () { ctx.setUi({ sel: 'perfil' }); dec.open('pend')(); } }]));
      if (scn === 'restrita') alerts.push(P.alert('warn', 'Restrita', 'O provedor limitou a leitura de perfil a 200 consultas por hora. Claims seguem, com espera maior.'));
      if (scn === 'indisp') alerts.push(P.alert('risk', 'Consulta indisponível', 'Não foi possível consultar o provedor às 14:02. Valores da última leitura, às 13:30.', [{ label: 'Consultar de novo', fn: O4.consult(ctx, 'Provedor respondeu; nada mudou desde 13:30.') }]));
      var rows = caps.map(function (c) { return { cells: [c.longo, c.amb, c.comprovada, c.validade, [c.estado, tone(c.estado)]], title: c.longo, meta: c.estado + (c.validade !== '—' ? ' · até ' + c.validade : ''), badge: c.estado, tone: tone(c.estado), go: pk.sel(c.id), on: c.id === cap.id }; });
      return O4.view(ctx, {
        title: 'Integração Instagram', sub: 'Capacidade oficial', cap: 'integracoes.ler', alvo: ig.conta, ts: scn === 'indisp' ? '26/10 · 13:30 BRT' : O4.TS,
        acts: [{ label: ui.ins ? 'Fechar instrução' : 'Instrução operacional', cls: 'btn--outline btn--sm', ic: 'book', fn: function () { ctx.setUi({ ins: !ui.ins }); } }, { label: 'Encaminhar pendência', cls: 'btn--primary btn--sm', fn: dec.open('pend') }],
        alerts: alerts, dec: dec, md: { picked: pk.picked, label: 'Todas as capacidades' },
        main: [O4.card({ title: 'Capacidades comprovadas', parts: [P.table(['Capacidade', 'Ambiente', 'Comprovada em', 'Validade', 'Estado'], rows), noSecret()] }),
          ui.ins ? O4.card({ title: 'Instrução operacional', sub: 'Versão 3 · aprovada em 15/10', parts: [P.checks([
            { label: 'Confira o estado no provedor', sub: 'Use esta tela; não entre na conta do treinador', st: 'ok', badge: '1' },
            { label: 'Se algo venceu, encaminhe pendência', sub: 'Responsável: Plataforma · Integrações', st: 'ok', badge: '2' },
            { label: 'Claims parados vão para revisão manual', sub: 'OPS03.B, com aviso à pessoa', st: 'ok', badge: '3' }
          ])] }) : null],
        side: [O4.card({ title: cap.longo, tag: cap.estado, tone: tone(cap.estado), parts: [P.kv([['Conta oficial', ig.conta], ['Escopo', cap.escopo], ['Ambiente', cap.amb], ['Comprovada em', cap.comprovada], ['Validade', cap.validade], ['Próximo passo', cap.prox]])] }), O4.rcCard('instagram')]
      });
    }
  });

  /* ===================== OPS18.B · fluxo de claim ===================== */
  var PV = {
    ok: ['Tudo certo', 'Abra o direct, envie o código e volte aqui. A confirmação aparece sozinha.'],
    nodm: ['Link não abre DM pronta', 'Copie o código e abra o app do Instagram manualmente. Envie para @99coach.oficial.'],
    conta: ['Conta errada', 'A mensagem veio de @x. Envie de @thiago.coach.'],
    codigo: ['Código expirado', 'Este código passou de 30 min. Gere um código novo; o anterior não vale mais.'],
    tentativas: ['Tentativas esgotadas', 'Revisão manual em até [prazo a aprovar]. Você recebe aviso no app.'],
    manual: ['Revisão manual', 'Uma pessoa da 99Coach vai conferir. O perfil continua como está até a decisão.']
  };
  REG.screen({
    page: 'operacao', key: 'ops18b', id: 'OPS18.B', title: 'Fluxo de claim · prévia', mtitle: 'Fluxo de claim', nav: 'governanca', back: 'OPS18', wide: true,
    normal: 'Instrução v2',
    scens: [['nodm', 'Link não abre DM'], ['conta', 'Conta errada'], ['codigo', 'Código expirado'], ['tentativas', 'Tentativas esgotadas'], ['manual', 'Revisão manual']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn, P = O4.P;
      var st = ui.pv || scn || 'ok';
      var pv = PV[st] || PV.ok;
      var step = ui.step || 0;
      var STEPS = ['Copiar código', 'Abrir Instagram', 'Voltar e conferir'];
      var flow = [
        ['check', 'Copiar código', step >= 1 ? 'feito' : '—', step >= 1 ? 'ok' : 'pendente', step >= 1 ? 'ok' : 'plain'],
        [step >= 2 ? 'check' : 'clock', 'Abrir Instagram', step >= 2 ? 'feito' : '—', step >= 2 ? 'ok' : 'pendente', step >= 2 ? 'ok' : 'plain'],
        [step >= 3 ? 'check' : 'clock', 'Voltar e conferir', step >= 3 ? 'feito' : '—', step >= 3 ? (st === 'ok' ? 'confirmado' : pv[0].toLowerCase()) : 'pendente', step >= 3 ? (st === 'ok' ? 'ok' : 'warn') : 'plain']
      ];
      var alerts = [];
      if (scn) alerts.push(P.alert(scn === 'manual' ? 'info' : 'warn', pv[0], 'O que a pessoa vê: “' + pv[1] + '”'));
      var go = function (n, msg) { return function () { ctx.setUi({ step: n }); ctx.toast(msg); }; };
      return O4.view(ctx, {
        title: 'Fluxo de claim · prévia', sub: 'Instrução v2', cap: 'integracoes.ler', alvo: 'Claim por direct',
        acts: [{ label: 'Seguir para OPS03', cls: 'btn--primary btn--sm', fn: function () { GO('OPS03'); } }],
        alerts: alerts,
        main: [O4.card({ title: 'Instrução copiável', parts: [
          P.preview('Código · 99C-7F3K · vale 30 min', 'Envie 99C-7F3K pelo direct de @thiago.coach para @99coach.oficial. O código vale 30 min.', 'Exemplo sintético. O código real não aparece em suporte, URL ou analytics.'),
          P.steps(flow),
          P.btns([
            { label: 'Copiar código', cls: step === 0 ? 'btn--primary btn--sm' : 'btn--outline btn--sm', ic: 'clipboard', fn: go(1, 'Código copiado (simulação).') },
            { label: 'Abrir Instagram', cls: step === 1 ? 'btn--primary btn--sm' : 'btn--outline btn--sm', ic: 'instagram', dis: step < 1, fn: go(2, 'Instagram aberto (simulação). Volte depois de enviar.') },
            { label: 'Voltei', cls: step === 2 ? 'btn--primary btn--sm' : 'btn--outline btn--sm', dis: step < 2, fn: go(3, st === 'ok' ? 'Mensagem recebida: claim confirmado (simulação).' : pv[0] + ' (simulação).') },
            { label: 'Cancelar', cls: 'btn--ghost btn--sm', dis: step === 0, fn: go(0, 'Fluxo cancelado. Nada foi alterado no perfil.') }
          ])
        ] }), O4.card({ title: 'O que a pessoa vê', parts: [
          P.seg('Estado', [['Normal', st === 'ok', function () { ctx.setUi({ pv: 'ok' }); }], ['Sem DM', st === 'nodm', function () { ctx.setUi({ pv: 'nodm' }); }], ['Conta errada', st === 'conta', function () { ctx.setUi({ pv: 'conta' }); }], ['Expirado', st === 'codigo', function () { ctx.setUi({ pv: 'codigo' }); }], ['Esgotadas', st === 'tentativas', function () { ctx.setUi({ pv: 'tentativas' }); }], ['Manual', st === 'manual', function () { ctx.setUi({ pv: 'manual' }); }]]),
          P.preview(pv[0], pv[1]),
          P.table(['Estado', 'O que a pessoa vê'], ['nodm', 'conta', 'tentativas'].map(function (k) { return { cells: [PV[k][0], PV[k][1]], title: PV[k][0], meta: PV[k][1] }; }), { always: false })
        ] })],
        side: [O4.card({ title: 'Versão', parts: [P.kv([['Instrução', 'v2 · aprovada 15/10'], ['Retorno', 'confirmação automática ao receber o direct'], ['Validação', 'código + conta de origem'], ['Alternativa', 'revisão manual (OPS03.B)']]), P.btns([{ label: 'Análise de prova (OPS03)', cls: 'btn--outline btn--sm', fn: function () { GO('OPS03'); } }])] })]
      });
    }
  });

  /* ===================== OPS18.C · incidente e continuidade ===================== */
  REG.screen({
    page: 'operacao', key: 'ops18c', id: 'OPS18.C', title: 'Incidente Instagram', mtitle: 'Incidente', nav: 'governanca', back: 'OPS18', wide: true,
    normal: '429 em mensagens',
    scens: [['fora', 'Fornecedor fora'], ['retorno', 'Retorno perdido'], ['prova', 'Prova pendente'], ['revogada', 'Integração revogada']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn, P = O4.P, inc = DB.o4_ig.incidente;
      var falha = { fora: 'provedor fora desde 10:40', retorno: 'retornos perdidos desde 11:15', revogada: 'integração revogada às 12:05' }[scn] || inc.falha;
      var dec = O4.dec(ctx, 'instagram', {
        pausar: { title: 'Pausar capacidade · Mensagens', acao: 'Capacidade de mensagens pausada', alvo: inc.ref + ' · Mensagens', ok: 'Pausar capacidade', danger: true, estado: 'registrado',
          impact: ['Claims por direct param de ser processados; novos pedidos veem o caminho manual.', 'Leitura de perfil continua funcionando.', 'Nada é dado como validado durante o incidente: claim, CREF, foto e publicação ficam como estão.'],
          apply: function () { inc.pausada = true; } },
        retomar: { title: 'Retomar capacidade · Mensagens', acao: 'Capacidade de mensagens retomada', alvo: inc.ref + ' · Mensagens', ok: 'Retomar', estado: 'registrado',
          impact: ['Claims por direct voltam a ser processados.', 'Os já encaminhados ao manual continuam no manual.'],
          apply: function () { inc.pausada = false; } },
        manual: { title: 'Encaminhar ao caminho manual', acao: 'Claims encaminhados à revisão manual', alvo: inc.fila + ' claims · OPS03.B', ok: 'Encaminhar ' + inc.fila + ' claims', estado: 'encaminhado',
          impact: [inc.fila + ' claims aguardando vão para revisão manual (OPS03.B).', 'Cada pessoa recebe aviso de que a análise será manual.', 'Nenhum claim é aprovado automaticamente.'],
          apply: function () { inc.manual = true; inc.fila = 0; } }
      });
      var alerts = [];
      if (scn === 'fora') alerts.push(P.alert('risk', 'Fornecedor fora', 'O provedor não responde desde 10:40. Cadastros continuam; nada é validado até voltar.', [{ label: 'Consultar de novo', fn: O4.consult(ctx, 'Provedor ainda fora.') }]));
      if (scn === 'retorno') alerts.push(P.alert('warn', 'Retorno perdido', 'Mensagens chegaram ao provedor, mas o retorno não chegou até nós. Não peça para a pessoa reenviar: confira pelo caminho manual.'));
      if (scn === 'prova') alerts.push(P.alert('warn', 'Prova pendente', 'A última prova de funcionamento (09:10) tem mais de 4 h. Faça o teste simulado em Prontidão antes de encerrar o incidente.', [{ label: 'Ir para prontidão', fn: function () { GO('OPS18'); } }]));
      if (scn === 'revogada') alerts.push(P.alert('risk', 'Integração revogada', 'O provedor revogou a integração às 12:05. Pause a capacidade e encaminhe os claims ao manual.'));
      if (inc.pausada) alerts.push(P.alert('ink', 'Capacidade pausada', 'Mensagens pausada por você. Retome só depois de uma prova de funcionamento.'));
      return O4.view(ctx, {
        title: 'Incidente Instagram', sub: inc.ref, cap: 'integracoes.incidente', alvo: 'Mensagens',
        acts: [inc.pausada ? { label: 'Retomar capacidade', cls: 'btn--primary btn--sm', fn: dec.open('retomar') } : { label: 'Pausar capacidade', cls: 'btn--outline btn--sm mod-danger', ic: 'pause', fn: dec.open('pausar') }],
        alerts: alerts, dec: dec,
        main: [O4.card({ title: 'Situação', parts: [
          P.kv([['Última prova', inc.ultimaProva, scn === 'prova' ? 'warn' : ''], ['Falha', falha, 'risk'], ['Fila', inc.fila ? inc.fila + ' claims aguardando' : 'vazia · encaminhados ao manual'], ['Responsável', 'Lia Moura · Operação']]),
          P.alert('info', 'Caminho manual', 'Claims pendentes seguem para revisão manual (OPS03.B) com aviso à pessoa.', [{ label: 'Encaminhar ao manual', dis: !inc.fila, fn: dec.open('manual') }, { label: 'Abrir OPS03.B', cls: 'btn--ghost btn--sm', fn: function () { GO('OPS03.B'); } }]),
          P.btns([{ label: 'Consultar recuperação', cls: 'btn--outline btn--sm', ic: 'refresh', fn: O4.consult(ctx, scn ? 'Sem mudança.' : 'Provedor ainda responde 429.') }]),
          P.note('Durante o incidente, nada é dado como validado: claim, CREF, foto e publicação ficam como estão.', true)
        ] })],
        side: [O4.rcCard('instagram')]
      });
    }
  });
})();
