/* O2 · OPS07 Pedidos de privacidade e retirada (+ .A fila, .B identidade e alcance, .C prévia de execução, .D resultado)
   Identidade mínima, escopo, prazo legal, retenção justificada e recibo. Retirada de perfil não exige conta nova. */
(function () {
  'use strict';
  var S = O2.S;
  var P = function (id) { return O2.find('o2_privacidade', id); };
  var TYPE = { 'exportação': 'Exportação', 'retirada de perfil': 'Retirada de perfil não cadastrado', 'correção': 'Correção', 'exclusão': 'Exclusão' };
  // escopos por tipo de pedido (OPS07.B) e categorias de execução (OPS07.C)
  var SCOPE = {
    'retirada de perfil': [['perfil', 'Perfil público'], ['fotos', 'Fotos'], ['indice', 'Índice interno'], ['bloqueio', 'Bloquear reimportação']],
    'exportação': [['conta', 'Conta e perfil'], ['treinos', 'Treinos e respostas'], ['conversas', 'Conversas (só mensagens dela)'], ['pagamentos', 'Recibos de pagamento']],
    'exclusão': [['conta', 'Conta de aluno'], ['treinos', 'Dados de treino'], ['conversas', 'Mensagens dele']],
    'correção': [['email', 'E-mail']]
  };
  var EXEC = {
    'exportação': [['Conta e perfil', 'exportar', 'banco', 'ok'], ['Treinos e respostas', 'exportar', 'banco', 'ok'], ['Conversas', 'exportar só mensagens dela', 'chat', 'ok'], ['Pagamentos', 'exportar recibos', 'processador', 'fora']],
    'retirada de perfil': [['Perfil público', 'retirar do ar', 'publicação (OPS11)', 'ok'], ['Fotos (2)', 'apagar', 'mídia', 'ok'], ['Índice interno', 'remover', 'busca', 'ok'], ['Reimportação', 'bloquear', 'importação', 'ok']],
    'exclusão': [['Conta de aluno', 'excluir após retenção', 'banco', 'ok'], ['Dados de treino', 'excluir', 'banco', 'ok'], ['Recibos', 'reter 5 anos', 'financeiro', 'ok']],
    'correção': [['E-mail', 'corrigir', 'banco', 'ok']]
  };
  var dueTxt = function (p) { return p.due ? p.due + (p.days ? ' · ' + p.days + ' dias' : '') : 'prazo não definido'; };
  var open = function (p) { return p.status !== 'concluído' && p.status !== 'cancelado'; };

  // ---------- OPS07 · composição ----------
  O2.screen({
    key: 'ops07', id: 'OPS07', title: 'Pedidos de privacidade e retirada', mtitle: 'Privacidade', back: 'H13', wide: true, cap: 'privacidade.ler', testIds: ['P-44'],
    scens: [['prazo', 'Prazo legal'], ['retencao', 'Retenção'], ['concluido', 'Concluído']],
    make: function (ctx) {
      var scn = ctx.scn;
      var sel = P(ctx.ui.sel || ctx.id || 'P-41') || P('P-41');
      var list = DB.o2_privacidade.filter(open);
      var rows = list.map(function (p) {
        return { cells: ['#' + p.id, TYPE[p.type] || p.type, p.whoLong, dueTxt(p), { b: p.status }], sel: p.id === sel.id, go: function () { ctx.setUi({ sel: p.id }); }, goL: p.id === sel.id ? 'Aberto' : 'Abrir',
          mt: '#' + p.id + ' · ' + (TYPE[p.type] || p.type), ms: p.who + (p.due ? ' · prazo ' + p.due : ' · prazo não definido'), mb: p.id === sel.id ? 'aberto' : '', mbcls: 'badge--ink' };
      });
      var notes = [];
      if (scn === 'prazo') notes.push(S.note('warn', 'Prazo legal', 'Contagem: #P-41 vence em 9 dias (04/11), #P-44 em 13 dias (08/11). Pedido sem prazo definido não conta como em dia.', [['Consultar de novo', function () { ctx.toast('Prazos conferidos às ' + U.now() + ' · nenhum vencido.'); }]]));
      if (scn === 'retencao') notes.push(S.note('info', 'Retenção', 'O que fica e por quê: registro do pedido (5 anos, defesa de direitos) e recibos de compra (obrigação fiscal). Nada mais.', [['Saiba por quê', function () { ctx.ask({ title: 'O que fica depois do pedido', lines: ['Registro do pedido: 5 anos, para provar que foi atendido.', 'Recibos de compra: obrigação fiscal; não são usados para outra coisa.', 'Dados de outros titulares (ex.: mensagens do treinador) ficam com eles.'], ok: 'Entendi', cancel: false }); }]]));
      if (scn === 'concluido') notes.push(S.note('ok', 'Concluído', 'Recibo ao titular enviado: #P-44 recebeu a lista do que foi exportado, sem dados de terceiros.', [['Ver resultado', function () { GO('OPS07.D', { id: 'P-44' }); }]]));
      return {
        head: { title: 'Pedido #' + sel.id, sub: (TYPE[sel.type] || sel.type) + (sel.type === 'retirada de perfil' ? ' importado' : '') }, alvo: 'Pedido #' + sel.id,
        acts: [S.act('Fila completa', function () { GO('OPS07.A'); }, 'ghost'), S.act('Identidade e alcance', function () { GO('OPS07.B', { id: sel.id }); }), S.act('Prévia de execução', function () { GO('OPS07.C', { id: sel.id }); }, 'primary')],
        notes: notes,
        blocks: [
          S.table('Pedidos abertos', ['Protocolo', 'Tipo', 'Titular', 'Prazo', 'Estado'], rows),
          S.kv('Pedido #' + sel.id, [['Titular', sel.whoLong], ['Escopo', sel.type === 'retirada de perfil' ? 'perfil público e fotos' : sel.scope], ['Retém', sel.keep], ['Prazo', sel.due ? 'Legal: ' + sel.due : 'não definido', sel.due ? (sel.days <= 10 ? 'vence em ' + sel.days + ' dias' : '') : 'pendente'], ['Responsável', sel.resp || '—'], ['Estado', sel.status, sel.status]], { help: 'O protocolo público não mostra documentos nem dados sensíveis.' }),
          S.btns([S.act('Resultado e comprovantes', function () { GO('OPS07.D', { id: sel.id }); })])
        ]
      };
    }
  });

  // ---------- OPS07.A · Fila de solicitações ----------
  O2.screen({
    key: 'ops07a', id: 'OPS07.A', title: 'Pedidos de privacidade', mtitle: 'Fila de pedidos', back: 'OPS07', wide: true, cap: 'privacidade.ler', alvo: 'Fila de pedidos',
    scens: [['semconta', 'Solicitante sem conta'], ['duplicata', 'Duplicata'], ['identidade', 'Identidade em revisão'], ['semprazo', 'Prazo não definido']],
    make: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn;
      var q = U.norm(ui.q || '');
      var list = DB.o2_privacidade.filter(function (p) { return open(p) && (!q || U.norm(p.id + ' ' + p.type + ' ' + p.who).indexOf(q.replace('#', '')) >= 0); });
      var rows = list.map(function (p) {
        return { cells: ['#' + p.id, p.type, p.whoLong, p.origin, p.scope, p.due || 'prazo não definido', p.resp || '—'], go: function () { GO('OPS07.B', { id: p.id }); },
          mt: '#' + p.id + ' · ' + (TYPE[p.type] || p.type), ms: p.who + ' · ' + (p.due || 'sem prazo') + ' · ' + (p.resp || 'sem responsável'), mb: p.resp ? '' : 'sem resp.', mbcls: 'badge--warn' };
      });
      var unassigned = DB.o2_privacidade.filter(function (p) { return open(p) && !p.resp; });
      var pick = ui.pick || (unassigned[0] ? unassigned[0].id : '');
      var who = ui.who || 'Caio';
      var notes = [];
      if (scn === 'semconta') notes.push(S.note('info', 'Solicitante sem conta', '#P-41 veio do formulário público. Confirme pelo código enviado ao e-mail do perfil; não peça para criar conta.'));
      if (scn === 'duplicata') notes.push(S.note('warn', 'Duplicata', '#P-48 repete #P-41 (mesmo perfil, mesmo e-mail). Junte ao original; o prazo conta do primeiro.', [['Juntar a #P-41', function () { var rec = O2.log({ cap: 'privacidade.decidir', caso: '#P-48', subj: 'imp_31', diff: '#P-48 juntado a #P-41', short: 'Pedido juntado · #P-48' }); ctx.toast('Juntado · recibo ' + rec.id); }]]));
      if (scn === 'identidade') notes.push(S.note('warn', 'Identidade em revisão', '#P-47 pediu correção de e-mail sem prova mínima. Peça complemento proporcional: só o código de confirmação.'));
      if (scn === 'semprazo') notes.push(S.note('risk', 'Prazo não definido', '#P-47 não tem prazo porque a identidade ainda não foi conferida. Defina ao confirmar; até lá, não conta como em dia.'));
      if (ui.rec) notes.push(S.rec(ui.rec, ui.recT, ''));
      return {
        head: { sub: U.plural(DB.o2_privacidade.filter(open).length, 'aberto', 'abertos') + ' nesta amostra' },
        acts: [S.act('Atribuir', function () {
          var p = P(pick);
          if (!p) return ctx.toast('Nenhum pedido sem responsável.');
          ctx.ask({ title: 'Atribuir #' + p.id + ' a ' + who + '?', lines: ['O prazo continua: ' + dueTxt(p) + '.', who + ' recebe o pedido na fila dele.'], ok: 'Atribuir',
            onOk: function () { var rec = O2.log({ cap: 'privacidade.atribuir', caso: '#' + p.id, subj: p.acct, diff: 'responsável: — → ' + who, short: 'Atribuído · #' + p.id }); p.resp = who; ctx.setUi({ rec: rec.id, recT: '#' + p.id + ' atribuído a ' + who, pick: '' }); ctx.toast('Atribuído · recibo ' + rec.id); } });
        }, 'primary')],
        notes: notes,
        blocks: [
          S.search('Buscar protocolo, tipo ou titular', ui.q || '', function (e) { ctx.setUi({ q: U.val(e) }); }, 'Protocolo, tipo ou titular'),
          S.table('', ['Protocolo', 'Tipo', 'Titular', 'Origem', 'Escopo', 'Prazo', 'Resp.'], rows, { emptyT: 'Nenhum pedido encontrado', emptyS: 'Confira o protocolo: começa com P-.' }),
          unassigned.length ? S.opts('Atribuir pedido sem responsável', unassigned.map(function (p) { return { label: '#' + p.id + ' · ' + p.type, on: pick === p.id, chip: true, go: function () { ctx.setUi({ pick: p.id }); } }; }).concat(['Caio', 'Lia'].map(function (w) { return { label: 'Para ' + w, on: who === w, go: function () { ctx.setUi({ who: w }); } }; })), 'Escolha o pedido e quem cuida dele.') : S.alert('ok', 'Todos com responsável', 'Nenhum pedido aberto sem responsável.')
        ]
      };
    }
  });

  // ---------- OPS07.B · Identidade e alcance ----------
  O2.screen({
    key: 'ops07b', id: 'OPS07.B', title: 'Identidade e alcance', mtitle: 'Identidade e alcance', back: 'OPS07', cap: 'privacidade.decidir', testIds: ['P-44', 'P-50'],
    scens: [['prova', 'Prova insuficiente'], ['naoreivindicado', 'Perfil não reivindicado'], ['terceiro', 'Pedido de terceiro'], ['naolocalizado', 'Dados não localizados']],
    make: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn;
      var p = P(ctx.id || 'P-41') || P('P-41');
      var opts = SCOPE[p.type] || [];
      var sel = ui.sc || opts.map(function (o) { return o[0]; });
      var isRet = p.type === 'retirada de perfil';
      var defF = isRet ? 'Titular pede retirada; fonte Federação X não exige manter.' : p.type === 'exportação' ? 'Titular pede cópia dos próprios dados.' : 'Titular pede exclusão da conta.';
      var notes = [];
      if (scn === 'prova') notes.push(S.note('warn', 'Prova insuficiente', 'O código não foi confirmado. Peça complemento proporcional: só o código, nada de documento.'));
      if (scn === 'naoreivindicado') notes.push(S.note('info', 'Perfil não reivindicado', 'Ninguém reivindicou o perfil. A retirada vale sem conta nova: o código no e-mail do perfil basta.'));
      if (scn === 'terceiro') notes.push(S.note('risk', 'Pedido de terceiro', 'Quem pede não é o titular (diz ser o irmão). Sem procuração, só registramos e avisamos o titular.'));
      if (scn === 'naolocalizado') notes.push(S.note('warn', 'Dados não localizados', 'Não achamos perfil nem conta com esse e-mail. Responda ao titular com o protocolo; não conclua sem consultar os importados.', [['Consultar importados', function () { ctx.toast('Importados consultados às ' + U.now() + ' · nada encontrado.'); }]]));
      if (p.scopeOk && p.scopeRec) notes.push(S.rec(p.scopeRec, 'Escopo confirmado · ' + p.scopeTxt, p.acct));
      if (p.complement) notes.push(S.note('info', 'Complemento pedido', 'Aguardando o titular: ' + p.complement + '. O prazo fica suspenso até a resposta.'));
      var blocked = scn === 'prova' || scn === 'terceiro';
      return {
        head: { sub: '#' + p.id + ' · ' + p.type + (isRet ? ' importado' : '') }, alvo: isRet ? 'Perfil importado · Marcos Lima' : 'Conta ' + p.acct,
        acts: [S.act('Pedir complemento', function () {
          ctx.ask({ title: 'Pedir complemento ao titular?', lines: ['Pedimos só: o código de confirmação enviado ao e-mail.', 'Sem documento e sem criar conta.', 'O prazo fica suspenso até a resposta.'], ok: 'Pedir complemento',
            onOk: function () { var rec = O2.log({ cap: 'privacidade.decidir', caso: '#' + p.id, subj: p.acct, diff: 'complemento pedido: código de confirmação', short: 'Complemento · #' + p.id }); p.complement = 'código de confirmação'; ctx.toast('Complemento pedido · recibo ' + rec.id); } });
        }), S.act('Confirmar escopo', function () {
          if (blocked) return ctx.toast('Resolva a identidade antes de confirmar o escopo.');
          if (!sel.length) return ctx.toast('Escolha ao menos um item do alcance.');
          var txt = opts.filter(function (o) { return sel.indexOf(o[0]) >= 0; }).map(function (o) { return o[1]; }).join(', ');
          O2.decide(ctx, { fkey: 'fund', def: defF, title: 'Confirmar o escopo de #' + p.id + '?', lines: ['Alcance: ' + txt + '.', 'Terceiros: ' + p.third + '.', 'Retém: ' + p.keep + '.', 'Nada é executado agora: a execução tem prévia própria.'], ok: 'Confirmar escopo', cap: 'privacidade.decidir', caso: '#' + p.id, subj: p.acct, diff: 'escopo: ' + txt, short: 'Escopo · #' + p.id, doneMsg: 'Escopo confirmado',
            done: function (rec) { p.scopeOk = true; p.scopeRec = rec.id; p.scopeTxt = txt; p.scopeSel = sel.slice(); } });
        }, 'primary', blocked)],
        notes: notes,
        blocks: [
          S.kv('', [['Prova mínima', scn === 'prova' ? 'código não confirmado' : p.proof, scn === 'prova' ? 'pendente' : 'confere'], ['Envolvidos', p.involved], ['Terceiros', scn === 'terceiro' ? 'quem pede não é o titular' : p.third]]),
          S.opts('Alcance', opts.map(function (o) { var on = sel.indexOf(o[0]) >= 0; return { label: o[1], on: on, go: function () { ctx.setUi({ sc: on ? sel.filter(function (x) { return x !== o[0]; }) : sel.concat([o[0]]) }); } }; }), isRet ? 'Retirada sem conta nova: o titular não precisa se cadastrar.' : 'Só o que é do titular. Dados de outros titulares ficam com eles.'),
          S.field('fund', 'Fundamento', O2.uv(ctx, 'fund', defF), O2.setter(ctx, 'fund'), { area: true, err: ui.fundErr ? 'Escreva o fundamento: ele vai para o recibo.' : '' }),
          p.scopeOk ? S.btns([S.act('Ver prévia de execução', function () { GO('OPS07.C', { id: p.id }); }, 'primary')]) : null
        ]
      };
    }
  });

  // ---------- OPS07.C · Prévia de execução ----------
  O2.screen({
    key: 'ops07c', id: 'OPS07.C', title: 'Prévia de execução', back: 'OPS07', cap: 'privacidade.executar', testIds: ['P-41'],
    scens: [['parcial', 'Exportação parcial'], ['obrigacao', 'Obrigação pendente'], ['fornecedor', 'Fornecedor indisponível'], ['permissao', 'Permissão alterada']],
    make: function (ctx) {
      var scn = ctx.scn;
      var p = P(ctx.id || 'P-44') || P('P-44');
      var ex = EXEC[p.type] || [];
      var down = function (r) { return r[3] === 'fora' || (scn === 'fornecedor' && r[2] === 'chat'); };
      var rows = ex.map(function (r) { return { cells: [r[0], r[1], { b: r[2] + ' · ' + (down(r) ? 'fora' : 'ok'), cls: down(r) ? 'badge--risk' : 'badge--ok' }], mt: r[0], ms: r[1] + ' · ' + r[2], mb: p.sent ? (down(r) ? 'Falhou' : 'Confirmado') : (down(r) ? 'fornecedor fora' : 'Na fila') }; });
      var notes = [];
      if (scn === 'parcial') notes.push(S.note('warn', 'Exportação parcial', 'Três categorias prontas; recibos de pagamento ficam pendentes. O titular recebe o que está pronto e o aviso do que falta.'));
      if (scn === 'obrigacao') notes.push(S.note('info', 'Obrigação pendente', 'Há uma cobrança em aberto de 05/11. Recibos ficam retidos até ela fechar; o resto segue.'));
      if (scn === 'fornecedor') notes.push(S.note('risk', 'Fornecedor indisponível', 'Chat e processador estão fora. Encaminhar agora gera falha nessas categorias; dá para seguir com as outras.'));
      if (scn === 'permissao') notes.push(S.note('lock', 'Permissão alterada', 'Sua capacidade privacidade.executar foi revogada às 13:58. Encaminhe para Caio R.'));
      if (!p.scopeOk) notes.push(S.note('warn', 'Escopo ainda não confirmado', 'Confirme identidade e alcance antes de executar.', [['Identidade e alcance', function () { GO('OPS07.B', { id: p.id }); }]]));
      if (p.sent && p.execRec) notes.push(S.rec(p.execRec, 'Execução encaminhada', p.acct));
      var isRet = p.type === 'retirada de perfil';
      return {
        head: { sub: '#' + p.id + ' · ' + p.type + ' de ' + p.who }, alvo: p.acct ? (p.acct.indexOf('imp_') === 0 ? 'Perfil importado · ' + p.who : 'Conta ' + p.acct) : 'Pedido #' + p.id,
        acts: [S.act('Voltar', function () { ctx.back(); }, 'ghost'), S.act(p.sent ? 'Ver resultado' : 'Encaminhar execução', function () {
          if (p.sent) return GO('OPS07.D', { id: p.id });
          if (scn === 'permissao') return ctx.toast('Sem privacidade.executar: encaminhe para Caio R.');
          if (!p.scopeOk) return ctx.toast('Confirme o escopo antes.');
          O2.decide(ctx, { needMotivo: false, text: 'Cada categoria vai para o adaptador indicado. Categorias com adaptador fora entram como falha e ganham nova tentativa.', title: 'Encaminhar execução de #' + p.id + '?', lines: ex.map(function (r) { return r[0] + ': ' + r[1] + (down(r) ? ' · adaptador fora, vai falhar' : ''); }).concat([isRet ? 'Retém: registro do pedido, 5 anos.' : 'Preserva: nada é apagado nesta solicitação.', 'Backups e cópias de terceiros não somem na hora.']), ok: 'Encaminhar execução', cap: 'privacidade.executar', caso: '#' + p.id, subj: p.acct, diff: 'execução encaminhada · ' + ex.length + ' categorias', short: 'Execução · #' + p.id, doneMsg: 'Execução encaminhada',
            done: function (rec) { p.sent = true; p.execRec = rec.id; p.status = ex.some(down) ? 'concluído em parte' : 'concluído'; } });
        }, 'primary')],
        notes: notes,
        blocks: [
          S.table('Categorias', ['Categoria', 'Ação', 'Adaptador'], rows),
          S.kv('', [['Preserva', isRet ? 'registro do pedido' : 'nada é apagado nesta solicitação'], ['Retém', isRet ? 'registro do pedido, 5 anos' : p.keep]], { help: 'Não prometemos apagar dados de outros titulares nem backups na hora.' })
        ]
      };
    }
  });

  // ---------- OPS07.D · Resultado e comprovantes ----------
  O2.screen({
    key: 'ops07d', id: 'OPS07.D', title: 'Resultado', back: 'OPS07', cap: 'privacidade.ler',
    normal: 'Concluído em parte',
    scens: [['expirado', 'Download expirado'], ['revogado', 'Acesso revogado'], ['completo', 'Concluído'], ['falha', 'Falha'], ['desconhecido', 'Resultado desconhecido']],
    make: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn;
      var p = P(ctx.id || 'P-44') || P('P-44');
      var venc = ui.renewed ? '09/11' : '02/11';
      var unk = scn === 'desconhecido' ? O2.unknown(ctx, 'nova tentativa dos recibos', 'a nova tentativa ainda não rodou; agendada para 14:30. Nada a repetir agora.') : null;
      var rec = scn === 'completo' || ui.retried ? 'Confirmado' : scn === 'falha' ? 'Falhou' : unk && unk.block ? 'Pendente' : 'Falhou';
      var allFail = scn === 'falha';
      var steps = [
        ['Conta e perfil', scn === 'expirado' ? 'arquivo 1 · venceu 25/10' : 'arquivo 1 · vence ' + venc, allFail ? 'Falhou' : 'Confirmado'],
        ['Treinos e respostas', scn === 'expirado' ? 'arquivo 2 · venceu 25/10' : 'arquivo 2 · vence ' + venc, allFail ? 'Falhou' : 'Confirmado'],
        ['Conversas', 'arquivo 3', allFail ? 'Falhou' : 'Confirmado'],
        ['Recibos', rec === 'Confirmado' ? 'arquivo 4 · vence ' + venc : 'processador fora · nova tentativa agendada', rec]
      ];
      var notes = [];
      if (unk) notes.push(unk.note);
      if (scn === 'expirado') notes.push(S.note('warn', 'Download expirado', 'Os links venceram em 25/10. Renovar revalida sua autorização e gera links novos por 7 dias.'));
      if (scn === 'revogado') notes.push(S.note('lock', 'Acesso revogado', 'Você não tem mais privacidade.ler para este pedido. O andamento continua; peça a Caio R.'));
      if (scn === 'falha') notes.push(S.note('risk', 'Falha', 'O banco não respondeu e nenhuma categoria foi exportada. Abra pendência; o titular não recebe aviso de concluído.'));
      if (scn === 'completo') notes.push(S.note('ok', 'Concluído', 'Todas as categorias exportadas. Recibo ao titular enviado com a mesma lista.'));
      if (ui.pend) notes.push(S.rec(ui.pend, 'Pendência aberta · caso C-331', p.acct));
      var revoked = scn === 'revogado';
      return {
        head: { title: 'Resultado #' + p.id, sub: (scn === 'completo' ? 'Concluído' : scn === 'falha' ? 'Falhou' : 'Concluído em parte') + ' · 26/10' }, alvo: p.acct ? 'Conta ' + p.acct : 'Pedido #' + p.id,
        acts: [S.act('Renovar link', function () {
          if (revoked) return ctx.toast('Sem privacidade.ler: não dá para renovar.');
          ctx.ask({ title: 'Renovar os links?', lines: ['Revalida sua autorização para baixar agora.', 'Links novos valem 7 dias (até 09/11).', 'Os links antigos deixam de valer.'], ok: 'Renovar link',
            onOk: function () { var r = O2.log({ cap: 'privacidade.ler', caso: '#' + p.id, subj: p.acct, diff: 'links renovados até 09/11', short: 'Links renovados · #' + p.id, kind: 'acesso' }); ctx.setUi({ renewed: true }); ctx.toast('Links renovados até 09/11 · recibo ' + r.id); } });
        }), S.act('Abrir pendência', function () {
          if (unk && unk.block) return O2.blocked(ctx);
          if (rec === 'Confirmado' && !allFail) return ctx.toast('Nada pendente: todas as categorias confirmadas.');
          O2.decide(ctx, { needMotivo: false, text: 'A pendência vira um caso com prazo, ligado a #' + p.id + '.', title: 'Abrir pendência dos recibos?', lines: ['Categoria: Recibos · processador fora.', 'Nova tentativa automática segue agendada; a pendência acompanha.', 'Prazo legal do pedido: ' + p.due + '.'], ok: 'Abrir pendência', cap: 'privacidade.ler', caso: '#' + p.id, subj: p.acct, diff: 'pendência aberta: recibos', short: 'Pendência · #' + p.id, doneMsg: 'Pendência aberta',
            done: function (r) { ctx.setUi({ pend: r.id }); } });
        }, 'primary', unk && unk.block)],
        notes: notes,
        blocks: [
          S.steps('Etapas', steps.map(function (s) { return [s[0], s[1], s[2], s[2] === 'Confirmado' && !revoked && scn !== 'expirado' ? function () { ctx.toast('Download revalidado · ' + s[0] + ' · só neste navegador (protótipo).'); } : null, 'Baixar']; })),
          S.kv('Referência', [['Protocolo', '#' + p.id + ' · ref 7c2e-41'], ['Enviado ao titular', 'a mesma lista, sem dados de terceiros']]),
          S.btns([S.act('Copiar referência', function () { try { if (window.navigator && navigator.clipboard) navigator.clipboard.writeText('#' + p.id + ' · ref 7c2e-41'); } catch (e) { /* sem área de transferência */ } ctx.toast('Referência copiada: #' + p.id + ' · ref 7c2e-41'); })])
        ]
      };
    }
  });
})();
