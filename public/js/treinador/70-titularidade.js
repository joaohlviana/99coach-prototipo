/* T8 · Titularidade do perfil: reivindicar pelo Instagram (ACC08) e conflito/revisão (ACC09). */
(function () {
  'use strict';
  DB.seed('t8_claim', {
    handle: '@rafaellima.treino', target: 'Rafael Lima · Treinador de CrossFit e Musculação · Londrina, PR', source: 'Perfil público importado do Instagram em 20/09/2026',
    account: 'Rafael Lima · conta de treinador', code: '99C-4K7Q', expires: '26/10 11:30', tries: 3, triesMax: 3, resends: 2,
    state: 'aguardando', at: ''
  });
  DB.seed('t8_conflito', {
    profile: '@rafaellima.treino', claimedAt: '03/10', state: 'aberto', proto: '', sentAt: '', reason: '', kind: '', file: '', deadline: ''
  });

  function copyText(t) { try { if (typeof navigator !== 'undefined' && navigator.clipboard) navigator.clipboard.writeText(t).catch(function () {}); } catch (_) {} }

  // ---------- ACC08 · Reivindicar perfil pelo Instagram ----------
  REG.screen({
    page: 'treinador', key: 'reivindicar', id: 'ACC08', title: 'Reivindicar perfil', mtitle: 'Reivindicar', nav: 'conta', back: 'TMENU', form: true,
    normal: 'Aguardando verificação',
    scens: [['naoEncontrado', 'Código não encontrado'], ['esgotadas', 'Tentativas esgotadas'], ['foraDoAr', 'Integração fora do ar'], ['aguardando', 'Aguardando prova'], ['expirado', 'Código expirado'], ['invalida', 'Prova inválida'], ['limite', 'Limite de consultas'], ['indisponivel', 'Integração indisponível'], ['jaReivindicado', 'Já reivindicado'], ['confirmado', 'Confirmado']],
    vals: function (ctx) {
      var C = DB.t8_claim, scn = ctx.scn;
      var st = scn || C.state;
      var instr = 'Cole o código ' + C.code + ' na bio do Instagram ' + C.handle + ' por alguns minutos. Depois volte à 99Coach e toque em Verificar titularidade. Nunca pediremos sua senha do Instagram.';
      var tries = st === 'esgotadas' ? 0 : C.tries;
      var resume = function () { if (scn) ctx.scenario(''); };

      function verify() {
        if (C.tries <= 0) { ctx.toast('Sem tentativas para este código. Gere um novo em 30 min.'); return; }
        C.tries -= 1;
        C.state = 'confirmado'; C.at = '26/10 ' + U.now();
        resume();
        ctx.toast('Titularidade confirmada às ' + U.now() + '. Isso não verifica CREF nem licença de fotos.');
      }
      function resend() {
        if (C.resends <= 0) { ctx.toast('Limite de reenvios do dia atingido. Tente amanhã ou peça revisão.'); return; }
        ctx.ask({ title: 'Gerar novo código?', text: 'O código atual deixa de valer. O novo vale por 1 hora e tem 3 tentativas.', lines: ['Reenvios restantes hoje: ' + C.resends], ok: 'Gerar novo código', onOk: function () {
          var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', c = '99C-';
          for (var i = 0; i < 4; i++) c += chars.charAt(Math.floor(Math.random() * chars.length));
          C.code = c; C.tries = C.triesMax; C.resends -= 1; C.state = 'aguardando'; C.expires = '26/10 ' + U.now() + ' + 1 h';
          resume(); ctx.toast('Novo código: ' + c + '. O anterior não vale mais.');
        } });
      }
      function cancel() {
        ctx.ask({ title: 'Cancelar a reivindicação?', text: 'O perfil importado continua como está, sem dono confirmado. Você pode voltar e reivindicar depois. Seu cadastro manual não muda.', ok: 'Cancelar reivindicação', cancel: 'Continuar aqui', danger: true, onOk: function () { C.state = 'cancelado'; ctx.go('@perfil', { id: 'rafael' }); } });
      }
      var S = {
        aguardando: null,
        naoEncontrado: { cls: 'alert alert--warn', ic: 'search', t: 'Código não encontrado', x: 'Não achamos ' + C.code + ' na bio de ' + C.handle + '. O código precisa estar na bio (não em post ou story) e o perfil precisa ser público. Restam ' + U.plural(Math.max(C.tries - 1, 0), 'tentativa', 'tentativas') + '.', btn: 'Tentar de novo', act: verify },
        esgotadas: { cls: 'alert alert--risk', ic: 'lock', t: 'Tentativas esgotadas', x: 'Este código não aceita mais verificações. Um novo código fica disponível em 30 min (às 11:30). Enquanto isso, você pode seguir com o cadastro manual.', btn: 'Continuar', act: function () { ctx.go('ACC06'); } },
        foraDoAr: { cls: 'alert alert--warn', ic: 'alert', t: 'Integração fora do ar', x: 'Não conseguimos consultar o Instagram agora. Seu cadastro manual continua normalmente; a reivindicação pode ser feita depois.', btn: 'Saiba por quê', act: function () { ctx.ask({ title: 'Por que a integração caiu?', text: 'A consulta ao Instagram depende de um serviço externo que está instável desde 10:20. Nada no seu perfil foi alterado e nenhum dado foi enviado.', lines: ['Você pode editar e publicar o perfil manualmente', 'Volte mais tarde para reivindicar'], ok: 'Editar perfil', cancel: 'Fechar', onOk: function () { ctx.go('ACC06'); } }); } },
        aguardando2: { cls: 'alert alert--info', ic: 'clock', t: 'Aguardando prova', x: 'Ainda não consultamos a bio. Cole o código e toque em Verificar titularidade, ou consulte de novo se já colou.', btn: 'Consultar de novo', act: verify },
        expirado: { cls: 'alert alert--warn', ic: 'clock', t: 'Código expirado', x: 'O código ' + C.code + ' venceu às ' + C.expires + '. Gere um novo e troque na bio.', btn: 'Gerar novo código', act: resend },
        invalida: { cls: 'alert alert--warn', ic: 'x', t: 'Prova inválida', x: 'Achamos o código em um post, não na bio, ou em outra conta. Ele precisa estar na bio de ' + C.handle + '.', btn: 'Corrigir', act: function () { ctx.scenario(''); ctx.toast('Coloque o código na bio e verifique de novo.'); } },
        limite: { cls: 'alert alert--warn', ic: 'clock', t: 'Muitas consultas', x: 'O Instagram limitou as consultas por alguns minutos. Sua tentativa não foi gasta. Tente de novo em 1 min.', btn: 'Tentar de novo', act: verify },
        indisponivel: { cls: 'alert alert--risk', ic: 'alert', t: 'Integração indisponível', x: 'A verificação não respondeu. Nenhuma tentativa foi gasta e nada mudou no perfil.', btn: 'Tentar de novo', act: verify },
        jaReivindicado: { cls: 'alert alert--risk', ic: 'users', t: 'Já reivindicado', x: 'Este perfil já foi reivindicado por outra conta em 03/10. Se ele é seu, peça revisão: a equipe analisa sem expor dados da outra conta.', btn: 'Revisar', act: function () { ctx.go('ACC09'); } },
        confirmado: { cls: 'alert alert--ok', ic: 'check', t: 'Instagram confirmado', x: 'Você confirmou ' + C.handle + (C.at ? ' em ' + C.at : '') + '. Pode tirar o código da bio. Isso prova só a titularidade: não verifica CREF nem a licença das fotos.', btn: 'Revisar perfil', act: function () { ctx.go('ACC06'); } }
      };
      var key = st === 'aguardando' && scn === 'aguardando' ? 'aguardando2' : st;
      var A = S[key] || null;
      var done = st === 'confirmado', blocked = st === 'esgotadas' || st === 'jaReivindicado' || st === 'foraDoAr';

      return {
        alert: A || { cls: '', t: '', x: '', btn: '', act: function () {} }, hasAlert: !!A, alertIc: 'ic ic--sm i-' + (A ? A.ic : 'info'), alertHasBtn: !!(A && A.btn),
        handle: C.handle, target: C.target, source: C.source, account: C.account, code: C.code, expires: 'Vale até ' + C.expires,
        triesTxt: 'Tentativas restantes: ' + tries + ' de ' + C.triesMax + ' · reenvios hoje: ' + C.resends,
        showSteps: !done && !blocked, done: done, blocked: blocked,
        copyCode: function () { copyText(C.code); ctx.toast('Código ' + C.code + ' copiado.'); },
        copyInstr: function () { copyText(instr); ctx.toast('Instrução copiada. Cole onde preferir; ela não contém senha.'); },
        verify: verify, resend: resend, cancel: cancel,
        review: function () { ctx.go('ACC09'); }, editProfile: function () { ctx.go('ACC06'); },
        verifyLabel: st === 'aguardando' && scn === 'aguardando' ? 'Consultar de novo' : 'Verificar titularidade'
      };
    }
  });

  // ---------- ACC09 · Conflito de titularidade e revisão ----------
  var KINDS = [['meu', 'Este Instagram é meu'], ['contaErrada', 'Reivindiquei com a conta errada'], ['info', 'Há informação pública errada']];
  REG.screen({
    page: 'treinador', key: 'conflito', id: 'ACC09', title: 'Contestar titularidade', mtitle: 'Contestar', nav: 'conta', back: 'TMENU', wide: true,
    normal: 'Contestação aberta',
    scens: [['jaReivindicado', 'Já reivindicado'], ['analise', 'Em análise'], ['resolvido', 'Resolvido'], ['contaErrada', 'Conta errada'], ['provaExpirada', 'Prova expirada'], ['indisponivel', 'Consulta indisponível']],
    vals: function (ctx) {
      var K = DB.t8_conflito, ui = ctx.ui, scn = ctx.scn;
      var reason = ui.reason !== undefined ? ui.reason : K.reason;
      var kind = ui.kind !== undefined ? ui.kind : (scn === 'contaErrada' ? 'contaErrada' : K.kind);
      var file = ui.file !== undefined ? ui.file : K.file;
      var st = K.state;
      if (scn === 'analise') st = 'analise';
      if (scn === 'resolvido') st = 'resolvido';
      var sentCase = st === 'analise' || st === 'enviado' || st === 'resolvido';
      var proto = K.proto || '99C-4471', sentAt = K.sentAt || '24/10 16:20';
      var tried = !!ui.tried;
      var errReason = reason.trim().length < 30 ? 'Explique em pelo menos 30 caracteres por que o perfil é seu (agora ' + reason.trim().length + ').' : '';
      var errKind = kind ? '' : 'Escolha a situação.';

      function send() {
        if (errReason || errKind) { ctx.setUi({ tried: true }); return; }
        ctx.ask({
          title: 'Enviar para revisão?', text: 'A equipe da 99Coach analisa a titularidade manualmente. O perfil não muda de dono até a decisão.',
          lines: ['Situação: ' + (KINDS.find(function (k) { return k[0] === kind; }) || ['', ''])[1], file ? 'Comprovante: ' + file + ' (documento restrito à equipe de revisão)' : 'Sem comprovante anexado', 'Você recebe um protocolo e pode acompanhar por aqui'],
          ok: 'Enviar para revisão',
          onOk: function () {
            K.state = 'enviado'; K.proto = '99C-4' + String(472 + Math.floor(Math.random() * 400)); K.sentAt = '26/10 ' + U.now(); K.reason = reason; K.kind = kind; K.file = file; K.deadline = 'resposta até 02/11';
            ctx.setUi({ tried: false });
            ctx.toast('Pedido enviado. Protocolo ' + K.proto + '. Ainda não houve decisão.');
          }
        });
      }

      var A = null;
      if (scn === 'jaReivindicado') A = { cls: 'alert alert--warn', ic: 'users', t: 'Já reivindicado', x: 'Ao enviar, abrimos uma contestação com protocolo. A outra conta não vê seus dados e você não vê os dela.', btn: 'Comparar', act: function () { ctx.setUi({ cmp: !ui.cmp }); } };
      if (scn === 'contaErrada') A = { cls: 'alert alert--warn', ic: 'user', t: 'Conta errada', x: 'Parece que você reivindicou com outra conta sua. Entre nela para conferir, ou explique aqui para a equipe transferir com análise.', btn: 'Usar outra conta', act: function () { ctx.go('ACC02'); } };
      if (scn === 'provaExpirada') A = { cls: 'alert alert--warn', ic: 'clock', t: 'Prova expirada', x: 'A prova pelo Instagram venceu antes do envio. Refaça a prova; o texto que você escreveu continua aqui.', btn: 'Refazer prova válida', act: function () { ctx.go('ACC08'); } };
      if (scn === 'indisponivel') A = { cls: 'alert alert--risk', ic: 'alert', t: 'Consulta indisponível', x: 'Não conseguimos carregar o andamento agora. Seu caso não foi perdido: o protocolo continua valendo.', btn: 'Tentar de novo', act: function () { ctx.scenario(''); ctx.toast('Consultado às ' + U.now() + '.'); } };

      var steps = [
        { t: 'Enviado', x: sentCase ? sentAt : '—', cls: 't8-step' + (sentCase ? ' is-done' : '') },
        { t: 'Em análise', x: sentCase ? 'equipe de titularidade · ' + (st === 'resolvido' ? 'concluída' : 'prazo: ' + (K.deadline || 'resposta até 31/10')) : '—', cls: 't8-step' + (st === 'analise' || st === 'enviado' || st === 'resolvido' ? ' is-done' : '') },
        { t: 'Decisão', x: st === 'resolvido' ? '25/10' : 'ainda não definida', cls: 't8-step' + (st === 'resolvido' ? ' is-done' : '') }
      ];

      return {
        alert: A || { cls: '', t: '', x: '', btn: '', act: function () {} }, hasAlert: !!A, alertIc: 'ic ic--sm i-' + (A ? A.ic : 'info'), alertHasBtn: !!(A && A.btn),
        profile: K.profile, claimedAt: 'Reivindicado em ' + K.claimedAt + ' por outra conta.',
        cmp: !!ui.cmp,
        showForm: !sentCase, sentCase: sentCase, noCase: !sentCase,
        kinds: KINDS.map(function (k) { var on = kind === k[0]; return { label: k[1], on: String(on), cls: 'chip t8-chip' + (on ? ' is-on' : ''), pick: function () { ctx.setUi({ kind: k[0] }); } }; }),
        hasKindErr: tried && !!errKind, kindErr: errKind,
        reason: reason, reasonN: String(reason.length) + ' de 800', setReason: function (e) { ctx.setUi({ reason: String(U.val(e)).slice(0, 800) }); },
        hasReasonErr: tried && !!errReason, reasonErr: errReason, reasonCls: 'input input--area t8-area' + (tried && errReason ? ' is-err' : ''),
        file: file, hasFile: !!file,
        pickFile: function (e) { var f = e && e.target && e.target.files && e.target.files[0]; if (!f) return; if (f.size > 10e6) { ctx.toast('O arquivo passa de 10 MB. Envie um menor.'); return; } ctx.setUi({ file: f.name }); ctx.toast('Arquivo anexado só neste navegador. Nada foi enviado ainda.'); },
        removeFile: function () { ctx.setUi({ file: '' }); },
        send: send,
        proto: proto, sentAt: sentAt, steps: steps,
        statusLabel: st === 'resolvido' ? 'Resolvido' : 'Em análise', statusCls: 'badge ' + (st === 'resolvido' ? 'badge--ok' : 'badge--warn'),
        resolved: st === 'resolvido', notResolved: st !== 'resolvido',
        refresh: function () { ctx.toast('Consultado às ' + U.now() + ': ainda em análise. Nenhuma decisão.'); },
        addInfo: function () { ctx.ask({ title: 'Enviar informação solicitada', text: 'A equipe pediu: um print da bio com o código 99C-4K7Q ou documento que ligue você ao perfil. O pedido segue com o mesmo protocolo ' + proto + '.', ok: 'Entendi', cancel: false }); },
        redoProof: function () { ctx.go('ACC08'); }, otherAccount: function () { ctx.go('ACC02'); }, fixPublic: function () { ctx.go('PUB12'); }
      };
    }
  });
})();
