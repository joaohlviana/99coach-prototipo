/* O4 · OPS17 Limites e execução de prospecção (+ OPS17.A plano, OPS17.B execução e consumo, OPS17.C retomada).
   Cotas, lista de execuções, pausa e opt-out (supressão contra reimportação).
   Nada aqui habilita gasto ou contato em massa; descobrir contato não cria conta nem consentimento. */
(function () {
  'use strict';
  DB.seed('o4_cotas', { diario: 1000, usado: 640, fonte: 'Federação X · 26/10 14:02', porFonte: [['Federação X', 640, 1000], ['Diretório de academias Y', 0, 500]] });
  DB.seed('o4_execs', [
    { id: 'ex3', ref: 'EX-3', nome: 'Campinas · corrida', fonte: 'Federação X', estado: 'pausada', causa: '429 do fornecedor', pausadaEm: '13:30', por: 'Sistema', retomarApos: '14:30', cand: 640, dup: 48, sup: 22, consumo: 58, checkpoint: 640, atualizado: '13:31', manual: false },
    { id: 'ex2', ref: 'EX-2', nome: 'Londrina · CrossFit', fonte: 'Federação X', estado: 'concluída', causa: '', pausadaEm: '', por: '', retomarApos: '', cand: 212, dup: 19, sup: 7, consumo: 100, checkpoint: 212, atualizado: '25/10 18:02', manual: false },
    { id: 'ex4', ref: 'EX-4', nome: 'Curitiba · musculação', fonte: 'Federação X', estado: 'rascunho', causa: 'orçamento ausente', pausadaEm: '', por: '', retomarApos: '', cand: 0, dup: 0, sup: 0, consumo: 0, checkpoint: 0, atualizado: '26/10 11:20', manual: false }
  ]);
  DB.seed('o4_supressao', { total: 41, fonte: 'lista de supressão · 26/10 14:02', itens: [
    { ref: 'c•••@gmail.com', como: 'pediu retirada por e-mail', at: '22/10' },
    { ref: 'perfil @r••••', como: 'formulário de privacidade', at: '20/10' },
    { ref: '(19) •••• -12', como: 'respondeu “não quero” ao primeiro contato', at: '18/10' }
  ] });
  DB.seed('o4_plano', { fonte: 'Federação X', fonteOk: 'aprovada', mercado: 'BR', campos: ['nome', 'cidade', 'modalidade'], vol: '', prazo: '14', custo: 'orçamento ausente', estado: 'rascunho' });

  function tone(st) { return { 'pausada': 'warn', 'ativa': 'ok', 'concluída': 'plain', 'rascunho': 'info', 'encerrada': 'plain', 'aguardando autorização': 'info' }[st] || 'plain'; }
  function num(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  var links = function () {
    return O4.card({ title: 'Detalhes da prospecção', parts: [O4.P.links([
      ['Plano por fonte e mercado', 'Fonte, campos, volume e orçamento antes de executar', 'target', function () { GO('OPS17.A'); }],
      ['Execução e consumo', 'Candidatos, duplicatas, suprimidos e limite', 'activity', function () { GO('OPS17.B', { id: 'ex3' }); }],
      ['Recuperação e retomada', 'Retomar do checkpoint ou encerrar com recibo', 'refresh', function () { GO('OPS17.C', { id: 'ex3' }); }]
    ])] });
  };

  /* ===================== OPS17 · composição ===================== */
  REG.screen({
    page: 'operacao', key: 'ops17', id: 'OPS17', title: 'Prospecção', mtitle: 'Prospecção', nav: 'governanca', back: 'OPS14', wide: true,
    testIds: ['ex2', 'ex4'],
    normal: 'Execução pausada',
    scens: [['429', '429'], ['supressao', 'Supressão'], ['pausado', 'Pausado']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn, P = O4.P;
      var execs = DB.o4_execs.map(function (x) { return Object.assign({}, x); });
      if (scn === 'pausado') { execs[0].manual = true; execs[0].por = 'Lia Moura'; execs[0].pausadaEm = '13:35'; execs[0].causa = 'revisar consumo antes de seguir'; }
      var pk = O4.pick(ctx, execs), ex = pk.it, real = DB.find('o4_execs', ex.id);
      var cot = DB.o4_cotas, sup = DB.o4_supressao;
      var refN = String(ui.ref || '').trim();
      var dec = O4.dec(ctx, 'prospeccao', {
        pausar: { title: 'Manter ' + ex.ref + ' pausada', acao: 'Pausa manual da execução', alvo: ex.ref + ' · ' + ex.nome, ok: 'Manter pausada', danger: true, estado: 'registrado',
          what: 'Impede a retomada automática quando o fornecedor liberar.',
          impact: [ex.ref + ' não retoma sozinha' + (ex.retomarApos ? ' às ' + ex.retomarApos : '') + '.', 'Nada é apagado: o checkpoint (item ' + ex.checkpoint + ') fica salvo.', 'Retomar depois exige revisão em Recuperação e retomada.'],
          apply: function () { real.manual = true; real.por = O4.ME; real.pausadaEm = U.now(); real.causa = 'pausa manual'; } },
        optout: { title: 'Registrar pedido de retirada', acao: 'Contato suprimido', alvo: 'Pedido ' + (refN || '—'), ok: 'Suprimir contato', estado: 'registrado',
          impact: ['O contato do pedido ' + (refN || '—') + ' entra na lista de supressão e nunca é reimportado, de nenhuma fonte.', 'Execuções em andamento pulam esse contato a partir do próximo lote.', 'A supressão não pode ser desfeita por aqui.'],
          apply: function () { sup.total += 1; sup.itens.unshift({ ref: 'pedido ' + refN, como: 'registrado pela operação', at: '26/10' }); return { ref: '' }; } }
      });
      var alerts = [];
      if (scn === '429') alerts.push(P.alert('clock', '429', 'Pausa e retomada após 14:30: o fornecedor limitou as consultas. Retomar antes disso volta a pausar.', [{ label: 'Consultar de novo', fn: O4.consult(ctx, 'Fornecedor ainda limita. Retomada liberada após 14:30.') }]));
      if (scn === 'supressao') alerts.push(P.alert('info', 'Supressão', 'Contatos que pediram retirada (' + sup.total + ') nunca voltam, nem se a fonte reenviar.', [{ label: ui.why ? 'Fechar' : 'Saiba por quê', cls: 'btn--ghost btn--sm', fn: function () { ctx.setUi({ why: !ui.why }); } }]));
      if (scn === 'supressao' && ui.why) alerts.push(P.alert('info', 'Por que a supressão vence a fonte', 'Quem pediu para sair não pode voltar por reimportação: a lista é conferida antes de cada lote, por e-mail, telefone e perfil normalizados.'));
      if (scn === 'pausado') alerts.push(P.alert('ink', 'Pausado', 'Por quem: Lia Moura, 26/10 13:35 · motivo: revisar consumo antes de seguir. Retomar exige revisão.'));
      var rows = execs.map(function (x) { return { cells: [x.ref, x.nome, x.fonte, [x.estado + (x.estado === 'pausada' ? (x.manual ? ' · manual' : ' · 429') : ''), tone(x.estado)], x.cand ? num(x.cand) : '—'], title: x.ref + ' · ' + x.nome, meta: x.fonte + (x.cand ? ' · ' + num(x.cand) + ' candidatos' : ''), badge: x.estado, tone: tone(x.estado), go: pk.sel(x.id), on: x.id === ex.id }; });
      var refErr = refN && !/^C-\d{3,6}$/i.test(refN) ? 'Use a referência do caso, por exemplo C-1043. Não escreva e-mail ou telefone aqui.' : '';
      var exParts = [
        P.kv([['Fonte', ex.fonte], ['Estado', ex.estado + (ex.estado === 'pausada' ? (ex.manual ? ' · manual' : ' por 429') : ''), tone(ex.estado)],
          ex.estado === 'pausada' ? ['Por quem', ex.por + ' · ' + ex.pausadaEm] : null, ex.causa ? ['Causa', ex.causa] : null,
          ex.retomarApos && !ex.manual ? ['Retomar após', ex.retomarApos] : null, ['Candidatos', ex.cand ? num(ex.cand) + ' (descobertos, não cadastrados)' : '—'], ['Suprimidos', String(ex.sup)]]),
        ex.consumo ? P.bars([['Consumo do limite da execução', ex.consumo, 'Fonte: ' + ex.fonte + ' · atualizado ' + ex.atualizado]]) : null
      ];
      if (ex.estado === 'pausada') exParts.push(P.btns([{ label: 'Revisar e retomar', cls: 'btn--primary btn--sm', fn: function () { GO('OPS17.C', { id: ex.id }); } }, { label: 'Manter pausada', cls: 'btn--outline btn--sm mod-danger', dis: ex.manual, fn: dec.open('pausar') }]));
      if (ex.estado === 'rascunho') exParts.push(P.alert('warn', 'Orçamento ausente', 'Sem orçamento aprovado, nada executa.', [{ label: 'Abrir plano', fn: function () { GO('OPS17.A'); } }]));
      exParts.push(P.btns([{ label: 'Ver execução', cls: 'btn--ghost btn--sm', fn: function () { GO('OPS17.B', { id: ex.id }); } }]));
      return O4.view(ctx, {
        title: 'Prospecção', sub: 'Campinas · corrida', comp: 'OPS17', alerts: alerts, dec: dec,
        acts: [{ label: 'Retomar', cls: 'btn--primary btn--sm', fn: function () { GO('OPS17.C', { id: 'ex3' }); } }],
        md: { picked: pk.picked, label: 'Todas as execuções' },
        main: [
          O4.card({ title: 'Cotas', sub: 'Limite diário de consultas por fornecedor', parts: [
            P.bars([['Consumo do limite diário · ' + num(cot.usado) + ' de ' + num(cot.diario), cot.usado / cot.diario * 100, 'Fonte: ' + cot.fonte]]),
            P.kv(cot.porFonte.map(function (f) { return [f[0], num(f[1]) + ' de ' + num(f[2]) + ' hoje']; })),
            P.note('Aumentar cota é decisão do plano (OPS17.A) com orçamento aprovado.', true)
          ] }),
          O4.card({ title: 'Execuções', sub: 'Toque para ver estado, pausa e retomada', parts: [P.table(['Ref.', 'Recorte', 'Fonte', 'Estado', 'Candidatos'], rows)] }),
          O4.card({ title: 'Opt-out e supressão', tag: sup.total + ' contatos', tone: 'plain', parts: [
            P.table(['Contato', 'Como pediu', 'Quando'], sup.itens.slice(0, 4).map(function (s) { return { cells: [s.ref, s.como, s.at], title: s.ref, meta: s.como + ' · ' + s.at }; })),
            P.note('Fonte: ' + sup.fonte + '. Mostramos só os mais recentes, mascarados.', true),
            P.field({ id: 'o4-ref', label: 'Registrar pedido de retirada', value: ui.ref || '', ph: 'C-1043', err: refErr, help: 'Referência do caso com o pedido. O contato sai de todas as fontes.', set: function (e) { ctx.setUi({ ref: U.val(e) }); } }),
            P.btns([{ label: 'Suprimir contato', cls: 'btn--outline btn--sm', dis: !refN || !!refErr, fn: dec.open('optout') }])
          ] }),
          links(), O4.rcCard('prospeccao')
        ],
        side: [O4.card({ title: ex.ref + ' · ' + ex.nome, tag: ex.estado, tone: tone(ex.estado), parts: exParts })]
      });
    }
  });

  /* ===================== OPS17.A · plano por fonte e mercado ===================== */
  var CAMPOS = ['nome', 'cidade', 'modalidade', 'clube ou academia'];
  REG.screen({
    page: 'operacao', key: 'ops17a', id: 'OPS17.A', title: 'Plano de prospecção', mtitle: 'Plano', nav: 'governanca', back: 'OPS17', wide: true, form: false,
    normal: 'Rascunho sem orçamento',
    scens: [['semdireito', 'Fonte sem direito'], ['mercado', 'Mercado não habilitado'], ['zero', 'Orçamento zero'], ['politica', 'Política vencida'], ['fornecedor', 'Fornecedor indisponível']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn, P = O4.P, pl = DB.o4_plano;
      var campos = ui.campos || pl.campos;
      var vol = ui.vol != null ? ui.vol : pl.vol, prazo = ui.prazo || pl.prazo;
      var volN = parseInt(String(vol).replace(/\D/g, ''), 10) || 0;
      var volErr = vol && !(volN > 0) ? 'Use só números.' : (volN > 2000 ? 'Acima de 2.000 registros precisa de caso com Jurídico.' : '');
      var mercado = scn === 'mercado' ? 'AR' : pl.mercado;
      var block = { semdireito: 1, mercado: 1, politica: 1 }[scn] || false;
      var sent = pl.estado === 'aguardando autorização';
      var dec = O4.dec(ctx, 'prospeccao', {
        enc: { title: 'Encaminhar autorização', acao: 'Plano encaminhado para autorização', alvo: pl.fonte + ' · ' + mercado, ok: 'Encaminhar', estado: 'aguardando autorização',
          impact: ['Pede prospeccao.executar para ' + pl.fonte + ' · ' + mercado + ': até ' + num(volN) + ' registros em ' + prazo + ' dias, campos ' + campos.join(', ') + '.', 'Nada executa antes da aprovação e de orçamento aprovado.', 'Responsável pela aprovação: Diretoria de Crescimento.'],
          apply: function () { pl.estado = 'aguardando autorização'; pl.vol = String(volN); pl.prazo = prazo; pl.campos = campos.slice(); } }
      });
      var alerts = [];
      if (scn === 'semdireito') alerts.push(P.alert('risk', 'Fonte sem direito', 'O contrato com a Federação X não cobre uso para prospecção. Escolha outra fonte aprovada.', [{ label: 'Ver fontes (OPS08)', fn: function () { GO('OPS08'); } }]));
      if (scn === 'mercado') alerts.push(P.alert('risk', 'Mercado não habilitado', 'Prospecção não está habilitada no mercado AR. Só BR tem política vigente.'));
      if (scn === 'zero') alerts.push(P.alert('risk', 'Orçamento zero', 'O orçamento de prospecção de outubro foi todo usado (R$ 0 restante, fonte: Financeiro · 26/10). Você pode encaminhar, mas nada executa até novo orçamento.'));
      if (scn === 'politica') alerts.push(P.alert('warn', 'Política vencida', 'A política de prospecção v2 venceu em 20/10. Renove antes de encaminhar.'));
      if (scn === 'fornecedor') alerts.push(P.alert('warn', 'Fornecedor indisponível', 'A Federação X não responde desde 12:40. O rascunho pode ser preparado; a estimativa de volume fica pendente.'));
      if (sent) alerts.push(P.alert('info', 'Aguardando autorização', 'Plano encaminhado. Nada executa até a aprovação e o orçamento.'));
      var toggle = function (c) { return function () { var l = campos.slice(); var i = l.indexOf(c); if (i >= 0) l.splice(i, 1); else l.push(c); ctx.setUi({ campos: l }); }; };
      return O4.view(ctx, {
        title: 'Plano de prospecção', sub: 'Condicional · ' + (sent ? 'aguardando autorização' : 'rascunho'), cap: 'prospeccao.preparar', alvo: pl.fonte + ' · ' + mercado,
        acts: [{ label: 'Encaminhar autorização', cls: 'btn--primary btn--sm', dis: !!block || sent || !(volN > 0) || !!volErr || !campos.length, fn: dec.open('enc') }],
        alerts: alerts, dec: dec,
        main: [O4.card({ title: 'Plano', parts: [
          P.kv([['Fonte', pl.fonte + ' · ' + (scn === 'semdireito' ? 'sem direito de uso' : pl.fonteOk), scn === 'semdireito' ? 'risk' : ''], ['Mercado', mercado, scn === 'mercado' ? 'risk' : ''], ['Campos', campos.join(', ') || '—'], ['Volume', volN ? num(volN) + ' registros' : '[a aprovar]'], ['Custo', scn === 'zero' ? 'R$ 0 restante' : '[' + pl.custo + ']', 'warn']]),
          P.alert('warn', 'Orçamento ausente', 'Sem orçamento aprovado, nada executa. Descobrir contato não cria conta nem consentimento.')
        ] }), O4.card({ title: 'Ajustar rascunho', sub: 'Só campos do propósito aprovado', parts: [
          P.chips('Campos', CAMPOS.map(function (c) { return [c, campos.indexOf(c) >= 0, toggle(c), sent]; })),
          P.field({ id: 'o4-vol', label: 'Volume máximo', value: vol, mode: 'numeric', ph: 'ex.: 800', err: volErr, help: scn === 'fornecedor' ? 'Estimativa da fonte indisponível agora.' : 'Estimativa da fonte para Campinas: cerca de 1.100 registros (Federação X · 26/10).', set: function (e) { ctx.setUi({ vol: U.val(e) }); } }),
          P.seg('Prazo', [['7 dias', prazo === '7', function () { ctx.setUi({ prazo: '7' }); }], ['14 dias', prazo === '14', function () { ctx.setUi({ prazo: '14' }); }], ['30 dias', prazo === '30', function () { ctx.setUi({ prazo: '30' }); }]]),
          P.note('Não há opção de capturar tudo: o volume tem teto e passa por autorização.', true)
        ] })],
        side: [O4.card({ title: 'Responsáveis', parts: [P.kv([['Prepara', 'Lia Moura · Operação'], ['Autoriza', 'Diretoria de Crescimento'], ['Orçamento', 'Financeiro']])] }), O4.rcCard('prospeccao')]
      });
    }
  });

  /* ===================== OPS17.B · execução e consumo ===================== */
  REG.screen({
    page: 'operacao', key: 'ops17b', id: 'OPS17.B', title: 'Execução', mtitle: 'Execução', nav: 'governanca', back: 'OPS17', wide: true,
    testIds: ['ex2'],
    normal: 'Pausada por 429',
    scens: [['ativo', 'Ativo'], ['limite', 'Limite atingido'], ['parcial', 'Erro parcial'], ['antigo', 'Dado antigo']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn, P = O4.P;
      var real = DB.find('o4_execs', ctx.id) || DB.find('o4_execs', 'ex3');
      var ex = Object.assign({}, real);
      if (scn === 'ativo') { ex.estado = 'ativa'; ex.cand = 410; ex.consumo = 37; ex.atualizado = '14:01'; }
      if (scn === 'limite') { ex.consumo = 100; ex.estado = 'pausada'; ex.causa = 'limite atingido'; }
      if (scn === 'antigo' && !(ui.q > 0)) ex.atualizado = '13:31 (31 min)';
      var dec = O4.dec(ctx, 'prospeccao', {
        pausar: { title: 'Pausar novas tarefas · ' + ex.ref, acao: 'Novas tarefas pausadas', alvo: ex.ref + ' · ' + ex.nome, ok: 'Pausar novas tarefas', danger: true, estado: 'solicitado',
          impact: ['Nenhuma tarefa nova começa; as que já estão no fornecedor terminam.', 'O checkpoint fica salvo para retomar sem duplicar.', 'Não retoma sozinha: retomar exige revisão.'],
          apply: function () { real.manual = true; real.estado = 'pausada'; real.por = O4.ME; real.pausadaEm = U.now(); real.causa = 'pausa manual'; } }
      });
      var alerts = [];
      if (scn === '' && ex.estado === 'pausada' && !ex.manual) alerts.push(P.alert('clock', '429 · fornecedor limitou', 'Pausada ' + ex.pausadaEm + '. Última atualização ' + ex.atualizado + '.'));
      if (scn === 'ativo') alerts.push(P.alert('ok', 'Ativo', 'Consumindo cerca de 12 consultas por minuto. A pausa está disponível a qualquer momento.'));
      if (scn === 'limite') alerts.push(P.alert('risk', 'Limite atingido', '100% do limite da execução. Novas tarefas param sozinhas; aumento é decisão do plano (OPS17.A).', [{ label: 'Abrir plano', fn: function () { GO('OPS17.A'); } }]));
      if (scn === 'parcial') alerts.push(P.alert('warn', 'Erro parcial', '37 itens falharam na leitura (cidade ausente) e foram para a quarentena. O restante segue válido.', [{ label: 'Abrir quarentena (OPS10)', fn: function () { GO('OPS10'); } }]));
      if (scn === 'antigo') alerts.push(P.alert('warn', 'Dado antigo', ui.q > 0 ? 'Consultado às ' + ui.qAt + '. Números atualizados.' : 'Última atualização há 31 min. Consulte antes de decidir.', [{ label: 'Consultar de novo', fn: O4.consult(ctx, 'Números atualizados.') }]));
      if (ex.manual) alerts.push(P.alert('ink', 'Pausada por ' + ex.por, 'Desde ' + ex.pausadaEm + '. Retomar exige revisão em Recuperação e retomada.', [{ label: 'Revisar retomada', fn: function () { GO('OPS17.C', { id: ex.id }); } }]));
      var canPause = (ex.estado === 'ativa' || ex.estado === 'pausada') && !ex.manual;
      return O4.view(ctx, {
        title: 'Execução', sub: ex.ref + ' · ' + ex.estado, cap: 'prospeccao.ler', alvo: 'Execução ' + ex.ref,
        acts: [{ label: 'Abrir quarentena (OPS10)', cls: 'btn--outline btn--sm', fn: function () { GO('OPS10'); } }, { label: 'Duplicatas (OPS09)', cls: 'btn--ghost btn--sm', fn: function () { GO('OPS09'); } }],
        alerts: alerts, dec: dec,
        main: [O4.card({ title: 'Resultados', sub: 'Descoberto não é cadastrado, consentido nem publicado', parts: [
          P.kpis([['Candidatos', num(ex.cand), 'Descobertos na fonte; não viram conta'], ['Duplicatas', String(ex.dup), 'Já existiam na base'], ['Suprimidos', String(ex.sup), 'Pediram retirada; descartados'], ['Tentativas', scn === 'parcial' ? '37 com erro' : '0 com erro', 'Leituras que falharam']]),
          P.bars([['Consumo do limite', ex.consumo, 'Fonte: ' + ex.fonte + ' · atualizado ' + ex.atualizado]])
        ] })],
        side: [O4.card({ title: 'Pausa', parts: [
          P.kv([['Estado', ex.estado + (ex.causa ? ' · ' + ex.causa : ''), tone(ex.estado)], ['Checkpoint', 'item ' + ex.checkpoint]]),
          P.btns([{ label: 'Pausar novas tarefas', cls: 'btn--outline btn--sm mod-danger', ic: 'pause', dis: !canPause, fn: dec.open('pausar') }]),
          !canPause ? P.note(ex.manual ? 'Já pausada manualmente.' : 'Execução sem tarefas para pausar.', true) : null
        ] }), O4.rcCard('prospeccao')]
      });
    }
  });

  /* ===================== OPS17.C · recuperação e retomada ===================== */
  REG.screen({
    page: 'operacao', key: 'ops17c', id: 'OPS17.C', title: 'Retomar execução', mtitle: 'Retomar', nav: 'governanca', back: 'OPS17', wide: true,
    normal: 'Pronta para revisão',
    scens: [['revogada', 'Autorização revogada'], ['insuf', 'Limite insuficiente'], ['limitado', 'Fornecedor ainda limitado'], ['desconhecido', 'Resultado desconhecido']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn, P = O4.P;
      var ex = DB.find('o4_execs', ctx.id) || DB.find('o4_execs', 'ex3');
      var rest = 100 - ex.consumo;
      var pending = (scn === 'desconhecido' && !(ui.q > 0)) || (ex.retomada === 'solicitada' && !(ui.q > 0));
      var reviewed = !!(ui.r1 && ui.r2);
      var closed = ex.estado === 'encerrada';
      var block = scn === 'revogada' || (scn === 'limitado' && !(ui.q > 0)) || closed || ex.estado !== 'pausada';
      var dec = O4.dec(ctx, 'prospeccao', {
        retomar: { title: 'Retomar escopo permitido · ' + ex.ref, acao: 'Retomada do checkpoint solicitada', alvo: ex.ref + ' · item ' + ex.checkpoint, ok: 'Retomar', estado: 'solicitado',
          impact: ['Continua do item ' + ex.checkpoint + ', mesma referência ' + ex.ref + ': nenhuma fila nova.', 'Usa até ' + rest + '% restantes do limite' + (scn === 'insuf' ? ' e para ao atingir 100%' : '') + '.', ex.sup + ' suprimidos ficam fora e não voltam.'],
          apply: function () { ex.retomada = 'solicitada'; return { q: 0 }; } },
        encerrar: { title: 'Encerrar ' + ex.ref + ' com recibo', acao: 'Execução encerrada', alvo: ex.ref + ' · ' + ex.nome, ok: 'Encerrar execução', danger: true, estado: 'encerrada',
          impact: ['A execução não pode mais ser retomada.', num(ex.cand) + ' candidatos ficam como descobertos, sem conta nem contato.', 'Suprimidos continuam na lista de supressão.'],
          apply: function () { ex.estado = 'encerrada'; } }
      });
      var alerts = [];
      if (scn === 'revogada') alerts.push(P.alert('risk', 'Autorização revogada', 'A Federação X retirou a autorização em 26/10 às 12:00. Só dá para encerrar com recibo.'));
      if (scn === 'insuf') alerts.push(P.alert('warn', 'Limite insuficiente', 'Restam ' + rest + '% do limite e a estimativa para terminar é de 460 itens (checkpoint). Retome só o que cabe ou peça aumento no plano.', [{ label: 'Abrir plano', fn: function () { GO('OPS17.A'); } }]));
      if (scn === 'limitado') alerts.push(P.alert('clock', 'Fornecedor ainda limitado', ui.q > 0 ? 'Consultado às ' + ui.qAt + ': o fornecedor liberou. Pode retomar.' : 'O 429 continua; retomar agora volta a pausar. Consulte depois das 14:30.', [{ label: 'Consultar de novo', fn: O4.consult(ctx, 'Fornecedor liberou as consultas.') }]));
      if (pending) alerts.push(P.alert('warn', 'Resultado desconhecido', scn === 'desconhecido' ? 'O pedido de retomada das 13:52 não teve resposta. Consulte antes de pedir de novo: repetir pode duplicar itens.' : 'A retomada foi pedida e ainda não confirmou. Consulte antes de pedir de novo.', [{ label: 'Consultar', fn: function () { var ok = ex.retomada === 'solicitada'; if (ok) { ex.retomada = ''; ex.estado = 'ativa'; ex.manual = false; ex.causa = ''; } O4.consult(ctx, ok ? 'Retomada confirmada do item ' + ex.checkpoint + '.' : 'A retomada das 13:52 não foi aplicada. Pode pedir de novo.')(); } }]));
      if (ex.estado === 'ativa') alerts.push(P.alert('ok', 'Retomada confirmada', ex.ref + ' voltou a rodar do item ' + ex.checkpoint + ', na mesma referência. Acompanhe em Execução e consumo.', [{ label: 'Ver execução', fn: function () { GO('OPS17.B', { id: ex.id }); } }]));
      if (closed) alerts.push(P.alert('ink', 'Encerrada', 'Execução encerrada com recibo. Nada mais é consultado nesta fonte para ' + ex.ref + '.'));
      return O4.view(ctx, {
        title: 'Retomar execução', sub: ex.ref + ' · do checkpoint', cap: 'prospeccao.executar', alvo: 'Execução ' + ex.ref,
        acts: [{ label: 'Encerrar com recibo', cls: 'btn--outline btn--sm', dis: closed, fn: dec.open('encerrar') }, { label: 'Retomar escopo permitido', cls: 'btn--primary btn--sm', dis: block || pending || !reviewed, fn: dec.open('retomar') }],
        alerts: alerts, dec: dec,
        main: [O4.card({ title: 'Antes de retomar', parts: [
          P.kv([['Causa', ex.causa || '429 do fornecedor'], ['Checkpoint', 'item ' + ex.checkpoint + ' · mesma referência ' + ex.ref], ['Fontes', ex.fonte + (scn === 'revogada' ? ' · autorização revogada' : ' ainda autorizada'), scn === 'revogada' ? 'risk' : ''], ['Limite restante', rest + '%'], ['Suprimidos', ex.sup + ' · não voltam']]),
          P.ticks([['Revisei o consumo: restam ' + rest + '% do limite.', !!ui.r1, function () { ctx.setUi({ r1: !ui.r1 }); }], ['Revisei os ' + ex.sup + ' suprimidos: eles não voltam.', !!ui.r2, function () { ctx.setUi({ r2: !ui.r2 }); }]]),
          !reviewed && !block ? P.note('Marque as duas revisões para liberar a retomada.', true) : null,
          P.note('Retomar usa o mesmo checkpoint. Criar fila nova para contornar bloqueio não é permitido.', true)
        ] })],
        side: [O4.rcCard('prospeccao')]
      });
    }
  });
})();
