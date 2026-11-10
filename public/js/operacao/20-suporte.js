/* O2 · OPS06 Acesso assistido de suporte (+ .A preparar, .B preview restrito, .C encerramento e recibo)
   Somente leitura por padrão; operador e usuário distintos; caso, finalidade, aviso, prazo, sair. Nunca "entrar como". */
(function () {
  'use strict';
  var S = O2.S;
  var ALL_SURF = [['Hoje', true], ['Treinos', true], ['Programas', true], ['Conversas', false], ['Saúde', false], ['Pagamentos', false]];

  function endSession(ctx, how) {
    var su = DB.o2_suporte;
    ctx.ask({
      title: 'Encerrar a visualização?', lines: ['Sai da conta de ' + su.who + ' agora; nada foi alterado.', 'O recibo registra início, fim, escopo e telas consultadas.', su.who + ' recebe aviso de que o acesso terminou.'], ok: 'Encerrar e ver recibo',
      onOk: function () {
        var rec = O2.log({ cap: 'suporte.visualizar', caso: su.caso, subj: su.target, diff: 'visualização ' + su.start + '–' + U.now() + ' · ' + su.surfaces.join(', '), short: 'Visualização encerrada · ' + su.caso, kind: 'acesso', motivo: su.purpose });
        su.status = 'encerrada'; su.end = how === 'auto' ? su.expires : U.now(); su.rec = rec.id;
        GO('OPS06.C');
      }
    });
  }
  function banner(ctx, su, warn) {
    return { t: 'Acesso assistido · somente leitura', s: su.op + ' vendo a conta de ' + su.who + ' · caso ' + su.caso + ' · expira ' + su.expires, exit: function () { endSession(ctx); }, exitL: 'Sair', warn: !!warn };
  }

  // ---------- OPS06 · composição ----------
  O2.screen({
    key: 'ops06', id: 'OPS06', title: 'Acesso assistido de suporte', mtitle: 'Suporte', back: 'H13', cap: 'suporte.visualizar',
    scens: [['visualizando', 'Em visualização'], ['expira', 'Expira'], ['bloqueada', 'Ação bloqueada']],
    make: function (ctx) {
      var su = DB.o2_suporte, scn = ctx.scn;
      var active = su.status === 'ativa' || scn === 'visualizando' || scn === 'expira' || scn === 'bloqueada';
      var notes = [];
      if (scn === 'expira') notes.push(S.note('warn', 'Expira em 30 min', 'A visualização termina sozinha às ' + su.expires + '. Para continuar depois, prepare outro acesso com motivo.', [['Saiba por quê', function () { ctx.ask({ title: 'Por que o acesso expira', lines: ['Acesso assistido é para um caso, com prazo curto.', 'Quando vence, a sessão fecha sozinha e o recibo é gerado.', 'Estender exige nova preparação e novo aviso a ' + su.who + '.'], ok: 'Entendi', cancel: false }); }]]));
      if (scn === 'bloqueada') notes.push(S.note('risk', 'Ação bloqueada', 'Pagar, enviar e apagar não existem no acesso assistido. Para resolver, oriente quem tem o direito de agir.', [['Continuar', function () { ctx.scenario('visualizando'); }]]));
      var rows = [{ cells: [su.caso, su.who + ' · ' + su.target, su.surfaces.join(', '), { b: su.status === 'ativa' ? 'ativa' : 'encerrada' }, su.rec || '—'], go: function () { GO(su.status === 'ativa' ? 'OPS06.B' : 'OPS06.C'); }, mt: su.caso + ' · ' + su.who, ms: su.surfaces.join(', '), mb: su.status === 'ativa' ? 'ativa' : 'encerrada' }]
        .concat(su.past.map(function (p) { return { cells: [p.caso, p.who, p.surfaces, { b: 'encerrada' }, p.rec], mt: p.caso + ' · ' + p.who, ms: p.when + ' · ' + p.surfaces, mb: 'encerrada' }; }));
      return {
        head: { title: active ? 'Visualização assistida' : 'Acesso assistido de suporte', sub: active ? 'Caso ' + su.caso + ' · ' + su.who : 'Somente leitura, com caso, finalidade e prazo' },
        alvo: active ? 'Conta ' + su.target + ' · ' + su.who : 'Sessões de suporte',
        banner: active ? banner(ctx, su, scn === 'expira') : null,
        acts: active ? [S.act('Sair', function () { endSession(ctx); }), S.act('Abrir visualização', function () { GO('OPS06.B'); }, 'primary')] : [S.act('Preparar acesso', function () { GO('OPS06.A'); }, 'primary')],
        notes: notes,
        blocks: [
          active ? S.alert('plain', 'Somente leitura', su.op + ' vendo a conta de ' + su.who + ' para o caso ' + su.caso + '. Expira ' + su.expires + '. ' + su.who + ' foi avisada.') : S.empty('eye', 'Nenhuma visualização ativa', 'Prepare um acesso a partir de um caso: finalidade, telas e prazo.', 'Preparar acesso', function () { GO('OPS06.A'); }),
          S.table('Sessões de suporte', ['Caso', 'Usuário', 'Escopo', 'Estado', 'Recibo'], rows),
          S.kv('Regras', [['Quem vê', 'operador e usuário distintos · sem “entrar como”'], ['O que dá para fazer', 'só ler as telas da finalidade'], ['O que nunca dá', 'pagar, cobrar, enviar mensagem, prescrever ou apagar'], ['Aviso', 'o usuário recebe motivo e prazo']])
        ]
      };
    }
  });

  // ---------- OPS06.A · Preparar acesso assistido ----------
  O2.screen({
    key: 'ops06a', id: 'OPS06.A', title: 'Preparar acesso assistido', mtitle: 'Preparar acesso', back: 'OPS06', cap: 'suporte.visualizar', form: false,
    scens: [['semautorizacao', 'Falta de autorização'], ['escopo', 'Escopo insuficiente'], ['removida', 'Conta removida'], ['analise', 'Solicitação em análise']],
    make: function (ctx) {
      var su = DB.o2_suporte, ui = ctx.ui, scn = ctx.scn;
      var surf = ui.surf || ['Hoje', 'Treinos', 'Programas'];
      var mins = ui.mins || 30;
      var exp = mins === 15 ? '10:57' : '11:12';
      var notes = [];
      if (scn === 'semautorizacao') notes.push(S.note('risk', 'Falta de autorização', 'Sua capacidade suporte.visualizar venceu em 25/10. Peça renovação; enquanto isso, encaminhe o pedido a quem tem.', [['Encaminhar pedido', function () { var rec = O2.log({ cap: 'suporte.pedir', caso: su.caso, subj: su.target, diff: 'pedido de visualização encaminhado', short: 'Pedido de suporte encaminhado' }); ctx.toast('Encaminhado a Caio R. · recibo ' + rec.id); }]]));
      if (scn === 'escopo') notes.push(S.note('warn', 'Escopo insuficiente', 'A finalidade do caso cobre Hoje e Treinos. Programas precisa de outro motivo.'));
      if (scn === 'removida') notes.push(S.note('risk', 'Conta removida', 'A conta ' + su.target + ' foi excluída a pedido da titular. Não há o que visualizar; registre no caso.'));
      if (scn === 'analise') notes.push(S.note('info', 'Solicitação em análise', 'Seu pedido de visualização está com a alçada 2 desde 10:30. Você recebe aviso quando liberar.'));
      if (su.status === 'ativa') notes.push(S.note('info', 'Já existe uma visualização ativa', 'Caso ' + su.caso + ' até ' + su.expires + '. Abra a mesma em vez de criar outra.', [['Abrir', function () { GO('OPS06.B'); }]]));
      var blocked = scn === 'semautorizacao' || scn === 'removida' || scn === 'analise';
      var start = function () {
        if (blocked) return ctx.toast('Não dá para iniciar agora: veja o aviso acima.');
        if (su.status === 'ativa') return GO('OPS06.B');
        if (scn === 'escopo' && surf.indexOf('Programas') >= 0) return ctx.toast('Tire Programas ou registre outro motivo no caso.');
        if (!surf.length) return ctx.toast('Escolha ao menos uma tela.');
        O2.decide(ctx, { fkey: 'purpose', def: su.purpose, title: 'Iniciar visualização somente leitura?', lines: ['Telas: ' + surf.join(', ') + '.', 'Expira em ' + mins + ' min · ' + exp + '.', 'Nenhuma ação muda dados.', su.who + ' recebe aviso com o motivo e o prazo.'], ok: 'Iniciar visualização', cap: 'suporte.visualizar', caso: su.caso, subj: su.target, diff: 'visualização iniciada · ' + surf.join(', '), short: 'Visualização iniciada · ' + su.caso, doneMsg: 'Visualização iniciada',
          done: function () { su.status = 'ativa'; su.surfaces = surf.slice(); su.minutes = mins; su.expires = exp; su.start = U.now(); su.end = ''; su.views = 0; su.purpose = O2.uv(ctx, 'purpose', su.purpose); GO('OPS06.B'); } });
      };
      return {
        head: { sub: su.caso + ' · Ana C. não vê o treino de hoje' }, alvo: 'Conta ' + su.target + ' · ' + su.who,
        acts: [S.act('Cancelar', function () { ctx.back(); }, 'ghost'), S.act('Iniciar visualização', start, 'primary', blocked)],
        notes: notes,
        blocks: [
          S.kv('', [['Caso', su.caso], ['Operador', su.op], ['Usuário alvo', su.who + ' · aluna · ' + su.target]]),
          S.field('purpose', 'Finalidade', O2.uv(ctx, 'purpose', su.purpose), O2.setter(ctx, 'purpose'), { err: ui.purposeErr ? 'Escreva a finalidade: ela vai para o aviso e o recibo.' : '' }),
          S.opts('Telas permitidas', ALL_SURF.map(function (s) {
            var on = surf.indexOf(s[0]) >= 0;
            return { label: s[0], on: on, lock: !s[1], go: function () { if (!s[1]) return ctx.toast(s[0] + ' fica fora: a finalidade do caso não pede. Nunca entra por padrão.'); ctx.setUi({ surf: on ? surf.filter(function (x) { return x !== s[0]; }) : surf.concat([s[0]]) }); } };
          }), 'Conversas, saúde e pagamentos ficam ocultos pela finalidade.'),
          S.opts('Expira em', [[15, '15 min · 10:57'], [30, '30 min · 11:12']].map(function (m) { return { label: m[1], on: mins === m[0], chip: true, go: function () { ctx.setUi({ mins: m[0] }); } }; })),
          S.alert('plain', 'Limite de leitura', 'Nenhuma ação muda dados. ' + su.who + ' recebe aviso com o motivo e o prazo.')
        ]
      };
    }
  });

  // ---------- OPS06.B · Preview restrito ----------
  O2.screen({
    key: 'ops06b', id: 'OPS06.B', title: 'Hoje · como Ana vê', mtitle: 'Hoje · como Ana vê', back: 'OPS06', cap: 'suporte.visualizar · leitura',
    scens: [['expirada', 'Sessão expirada'], ['revogada', 'Permissão revogada'], ['mascarado', 'Dado mascarado'], ['erro', 'Erro de consulta'], ['contexto', 'Contexto alterado']],
    make: function (ctx) {
      var su = DB.o2_suporte, scn = ctx.scn;
      var alvo = su.who + ' · ' + su.target;
      if (scn === 'expirada' || scn === 'revogada' || su.status !== 'ativa') {
        var t = scn === 'revogada' ? 'Permissão revogada' : scn === 'expirada' ? 'Sessão expirada' : 'Visualização encerrada';
        var s = scn === 'revogada' ? 'Caio R. revogou sua capacidade de suporte às 10:55. Nada foi alterado na conta de ' + su.who + '.' : scn === 'expirada' ? 'O prazo terminou às ' + su.expires + '. O recibo foi gerado sozinho.' : 'Para ver de novo, prepare outro acesso com motivo.';
        return { head: { sub: 'Visualização assistida · ' + su.caso }, alvo: alvo, blocks: [S.empty('lock', t, s, su.status === 'encerrada' && !scn ? 'Ver recibo' : 'Preparar outro acesso', function () { GO(su.status === 'encerrada' && !scn ? 'OPS06.C' : 'OPS06.A'); })] };
      }
      var blockedAct = function (what) { return function () { ctx.toast(what + ' bloqueado no acesso assistido: nada muda em nome de ' + su.who + '.'); }; };
      var notes = [];
      if (scn === 'mascarado') notes.push(S.note('lock', 'Dado mascarado', 'Peso e medidas aparecem como •••. Saúde fica fora da finalidade deste caso.'));
      if (scn === 'erro') notes.push(S.note('risk', 'Erro de consulta', 'Treinos não carregou. Não conclua que não existe treino: tente de novo.', [['Tentar de novo', function () { ctx.toast('Treinos carregou · nenhum treino publicado para 26/10.'); }]]));
      if (scn === 'contexto') notes.push(S.note('warn', 'Contexto alterado', 'Rafael publicou a semana às 10:50. O que você vê agora é diferente do que Ana viu de manhã.'));
      var shows = function (x) { return su.surfaces.indexOf(x) >= 0; };
      return {
        head: { sub: 'Visualização assistida · ' + su.caso }, alvo: alvo,
        banner: banner(ctx, su, false),
        acts: [S.act('Voltar ao caso', function () { GO('OPS02', { id: su.caso.replace('#', '') }); }, 'ghost'), S.act('Sair', function () { endSession(ctx); }, 'primary')],
        notes: notes,
        blocks: [
          shows('Hoje') ? S.alert('plain', 'Treino de hoje', scn === 'contexto' ? 'Treino A · inferiores · publicado às 10:50.' : 'Nenhum treino publicado para 26/10. Última versão do programa: rascunho do treinador (não visível à aluna).') : null,
          shows('Treinos') ? S.table('Treinos', ['Treino', 'Dia', 'Situação'], DB.meusTreinos.filter(function (t) { return t.status !== 'hoje' || scn === 'contexto'; }).map(function (t) { return { cells: [t.name, t.day, { b: t.status }], mt: t.name, ms: t.day, mb: t.status }; })) : null,
          shows('Programas') ? S.kv('Programas', [['CrossFit do zero', 'acesso gratuito · ' + (scn === 'mascarado' ? '•••' : '62%')], ['Mobilidade 15 minutos', 'pago']]) : null,
          S.kv('Fora da finalidade', [['Conversas', 'Oculto pela finalidade'], ['Saúde', 'Oculto pela finalidade'], ['Pagamentos', 'Oculto pela finalidade']]),
          S.btns([S.act('Iniciar treino', blockedAct('Iniciar treino'), 'outline', true), S.act('Enviar mensagem', blockedAct('Enviar mensagem'), 'outline', true), S.act('Pagar', blockedAct('Pagar'), 'outline', true)], { title: 'Ações da aluna', cls: 'card o2-blk', help: 'Comprar, cobrar, enviar mensagem ou prescrever nunca ficam disponíveis aqui.' })
        ]
      };
    }
  });

  // ---------- OPS06.C · Encerramento e recibo ----------
  O2.screen({
    key: 'ops06c', id: 'OPS06.C', title: 'Recibo da visualização', mtitle: 'Recibo', back: 'OPS06', cap: 'suporte.visualizar',
    scens: [['automatica', 'Expiração automática'], ['revogacao', 'Revogação durante uso'], ['atrasado', 'Recibo atrasado']],
    make: function (ctx) {
      var su = DB.o2_suporte, ui = ctx.ui, scn = ctx.scn;
      var end = su.status === 'encerrada' ? su.end : '10:58';
      var notes = [];
      if (su.status === 'ativa') notes.push(S.note('warn', 'A visualização ainda está ativa', 'Este é o recibo da última encerrada. Saia da ativa para gerar o recibo dela.', [['Encerrar a ativa', function () { endSession(ctx); }]]));
      if (scn === 'automatica') notes.push(S.note('info', 'Expiração automática', 'O prazo acabou às ' + su.expires + ' e a sessão fechou sozinha. Nada ficou aberto.'));
      if (scn === 'revogacao') notes.push(S.note('warn', 'Revogação durante uso', 'Caio R. revogou a capacidade às 10:55; a sessão fechou nesse momento. Consultas até ali estão no recibo.'));
      if (scn === 'atrasado') notes.push(S.note('warn', 'Recibo atrasado', 'O registro das consultas ainda está chegando. O que está aqui pode mudar; consulte de novo antes de concluir o caso.', [['Consultar de novo', function () { ctx.toast('Recibo completo · 6 telas · nenhuma alteração.'); }]]));
      if (su.conclusionRec) notes.push(S.rec(su.conclusionRec, 'Conclusão registrada no caso', su.target));
      return {
        head: { sub: su.caso + ' · encerrada ' + (scn === 'revogacao' ? '10:55' : scn === 'automatica' ? su.expires : end) }, alvo: su.who + ' · ' + su.target,
        acts: [S.act('Voltar ao caso', function () { GO('OPS02', { id: su.caso.replace('#', '') }); }, 'primary')],
        notes: notes,
        blocks: [
          S.kv('', [['Início · fim', su.start + ' · ' + (scn === 'revogacao' ? '10:55' : end) + ' BRT'], ['Escopo efetivo', su.surfaces.join(', ')], ['Consultas', scn === 'atrasado' ? 'registro chegando' : (su.views || 6) + ' telas · nenhuma alteração'], ['Motivo', 'treino em rascunho, não publicado'], ['Recibo', su.rec || 'R-305-2']]),
          S.field('concl', 'Conclusão', O2.uv(ctx, 'concl', su.conclusion || 'Orientar o treinador a publicar a versão da semana.'), O2.setter(ctx, 'concl'), { area: true, card: true, title: 'Registrar conclusão', err: ui.conclErr ? 'Escreva a conclusão.' : '' }),
          S.btns([S.act('Registrar conclusão', function () {
            if (scn === 'atrasado') return ctx.toast('Consulte o recibo de novo antes de concluir.');
            O2.decide(ctx, { fkey: 'concl', def: su.conclusion || 'Orientar o treinador a publicar a versão da semana.', title: 'Registrar conclusão no caso?', lines: ['Vai para o caso ' + su.caso + ' e para o histórico.', 'Não copie dados privados da aluna para a nota.'], ok: 'Registrar', cap: 'casos.registrar', caso: su.caso, subj: su.target, diff: 'conclusão da visualização registrada', short: 'Conclusão · ' + su.caso, doneMsg: 'Conclusão registrada',
              done: function (rec) { su.conclusion = O2.uv(ctx, 'concl', su.conclusion || 'Orientar o treinador a publicar a versão da semana.'); su.conclusionRec = rec.id; } });
          }, 'primary')], { help: 'Histórico restrito: não copie dados privados para a nota.' })
        ]
      };
    }
  });
})();
