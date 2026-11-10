/* T5 · TRE28 Diagnóstico de presença social (condicional, desligado por padrão): ligar a leitura do Instagram autorizado,
   estados da fonte (lendo, indisponível, não habilitado, não autorizada, revogada), consumo da franquia de IA,
   sugestões para revisão → IA03. Nada é importado para o perfil nem publicado; não promete crescimento. */
(function () {
  DB.seed('t5_social', { status: 'off', handle: '@rafaellima.treino', authorizedAt: '12/10', readAt: '', posts: 30, coverage: 'últimos 60 dias', source: 'API oficial do Instagram', cost: 4 });
  var SUGG = [
    { id: 'sg1', t: 'Mostre o que inclui o acompanhamento online', why: 'Nas 30 publicações, nenhuma explica o que o aluno recebe no plano de R$ 200/mês.' },
    { id: 'sg2', t: 'Diga onde você atende em Londrina', why: '3 de 30 publicações citam a região; o perfil 99Coach mostra Centro e Box Centro.' },
    { id: 'sg3', t: 'Use a mesma foto do perfil 99Coach', why: 'A foto do Instagram é diferente; quem chega pelo Instagram pode não reconhecer o perfil.' }
  ];
  var SCN = { pronto: 'pronto', desligado: 'semfonte', lendo: 'lendo', fonte: 'fonteoff', naohab: 'naohab', naoaut: 'naoaut', revogada: 'revogada' };
  var reading = null; // leitura em andamento (cancelar ou desligar invalida)
  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }

  REG.screen({
    page: 'treinador', key: 'social', id: 'TRE28', title: 'Diagnóstico de presença', mtitle: 'Diagnóstico', nav: 'insights', back: 'H08',
    normal: 'Desligado (padrão)',
    scens: [['pronto', 'Diagnóstico pronto'], ['desligado', 'Desligado'], ['lendo', 'Lendo'], ['fonte', 'Fonte indisponível'], ['naohab', 'Não habilitado'], ['naoaut', 'Fonte não autorizada'], ['revogada', 'Fonte revogada']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn, S = DB.t5_social, cred = DB.trainer.iaCredits;
      var st = has(ui, 'st') ? ui.st : (SCN[scn] || S.status);
      var readAt = ui.readAt || (scn ? '12/10 09:20' : S.readAt);
      var set = function (x, extra) {
        if (!scn) { S.status = x; if (extra && extra.readAt) S.readAt = extra.readAt; ctx.setUi({ st: x, readAt: extra && extra.readAt || readAt }); }
        else ctx.setUi(Object.assign({ st: x }, extra || {}));
      };
      var finish = function (tok) {
        if (reading !== tok) return;
        reading = null;
        var at = '26/10 ' + U.now();
        if (!scn) cred.used = Math.min(cred.limit, cred.used + S.cost);
        set('pronto', { readAt: at });
        ctx.toast('Leitura concluída. ' + S.cost + ' créditos de IA usados.');
      };
      var turnOn = function () {
        ctx.ask({
          title: 'Ligar leitura do Instagram?',
          lines: ['Fonte: ' + S.handle + ' via ' + S.source + ', autorizada por você em ' + S.authorizedAt + '.',
            'Lemos legendas e datas das publicações dos ' + S.coverage + '. Fotos não são copiadas.',
            'Consumo estimado: ' + S.cost + ' créditos de IA (você usou ' + cred.used + ' de ' + cred.limit + '; renova ' + cred.resets + ').',
            'Nada é importado para o perfil nem publicado. Sugestões não garantem crescimento.'],
          ok: 'Ligar leitura', cancel: 'Agora não',
          onOk: function () { var tok = DB.uid('r'); reading = tok; set('lendo'); setTimeout(function () { try { finish(tok); } catch (_) {} }, 1600); }
        });
      };
      var turnOff = function () {
        ctx.ask({ title: 'Desligar a leitura?', lines: ['Paramos de ler ' + S.handle + '. O diagnóstico de ' + (readAt || 'hoje') + ' sai desta tela.', 'A autorização do Instagram continua em Conta; retire lá se quiser.'], ok: 'Desligar', cancel: 'Manter ligada',
          onOk: function () { reading = null; set('off'); ctx.toast('Leitura desligada. Nada mais é lido do Instagram.'); } });
      };
      var why = function (title, lines) { return function () { ctx.ask({ title: title, lines: lines, ok: 'Entendi', cancel: false }); }; };

      var ready = st === 'pronto' || st === 'fonteoff';
      var kv = [
        { k: 'Conta', v: S.handle },
        { k: 'Fonte', v: S.source + (st === 'fonteoff' ? ' · indisponível agora' : '') },
        { k: 'Fonte atualizada em', v: st === 'fonteoff' ? '12/10 09:20 (última leitura)' : readAt },
        { k: 'Publicações analisadas', v: String(S.posts) },
        { k: 'Cobertura', v: S.coverage },
        { k: 'Consumo', v: S.cost + ' créditos de IA por leitura · franquia ' + cred.used + ' de ' + cred.limit }
      ];
      var sugg = SUGG.map(function (g) { return { t: g.t, why: g.why, go: function () { ctx.go('IA03', { id: g.id, from: 'TRE28' }); } }; });

      return {
        handle: S.handle,
        isOff: st === 'off', isReading: st === 'lendo', isReady: ready, isSrcOff: st === 'fonteoff',
        isNoSource: st === 'semfonte', isNotEnabled: st === 'naohab', isNotAuth: st === 'naoaut', isRevoked: st === 'revogada',
        canTurnOn: st === 'off', canTurnOff: st === 'pronto' || st === 'lendo' || st === 'fonteoff',
        estimate: 'Consumo estimado: ' + S.cost + ' créditos de IA · você usou ' + cred.used + ' de ' + cred.limit + ' (renova ' + cred.resets + ').',
        authLine: 'Instagram ' + S.handle + ' autorizado em ' + S.authorizedAt + ' pela API oficial.',
        kv: kv, sugg: sugg,
        turnOn: turnOn, turnOff: turnOff,
        cancelRead: function () { reading = null; set('off'); ctx.toast('Leitura cancelada. Nenhum crédito foi usado.'); },
        retry: function () { set('pronto', { readAt: '26/10 ' + U.now() }); ctx.toast('Fonte de volta. Leitura atualizada às ' + U.now() + '.'); },
        whyNoSource: why('Por que está desligado', ['Sem uma fonte aprovada e orçamento de IA, o diagnóstico não aparece como ação.', 'Conecte o Instagram em Conta e confirme o uso da franquia para habilitar.', 'Você pode editar o perfil manualmente a qualquer hora.']),
        whyNotEnabled: why('Análise indisponível nesta conta', ['O diagnóstico de presença ainda não está habilitado para o plano ' + DB.trainer.plan + '.', 'Nada muda no seu perfil nem na agenda.', 'Insights do perfil 99Coach continuam disponíveis.']),
        whyNotAuth: why('Fonte não autorizada', ['Não há autorização do Instagram para ler publicações.', 'Conexão é só pela API oficial; nunca pedimos senha do Instagram.', 'Autorize em Conta, se quiser.']),
        whyRevoked: why('Fonte revogada', ['A autorização do Instagram foi retirada em 20/10.', 'Paramos de ler e o diagnóstico anterior saiu desta tela.', 'Para voltar, autorize de novo em Conta.']),
        whyReading: why('Por que consome a franquia', ['A leitura usa IA para resumir as publicações.', 'O consumo é estimado antes e confirmado no fim; a franquia não é ilimitada.', 'Cancelar durante a leitura não consome créditos.']),
        goAccount: function () { ctx.go('@onboarding', { flow: 'treinador', scn: 'conta' }); },
        goEdit: function () { ctx.go('ACC05'); },
        goUsage: function () { ctx.go('IA06'); },
        goBack: function () { ctx.go('H08'); }
      };
    }
  });
})();
