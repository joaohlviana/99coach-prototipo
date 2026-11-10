/* T8 · Denunciar, bloquear e acompanhar (ACC16), do lado do treinador. */
(function () {
  'use strict';
  // contato padrão: pessoa que escreveu pelo perfil público (não é aluno de Rafael)
  DB.seed('t8_contatos', [
    { id: 'felipe', name: 'Felipe Duarte', ctx: 'Conversa iniciada pelo seu perfil público · 25/10', last: 'Pediu para pagar por fora da 99Coach e mandou link de cobrança', student: false }
  ]);
  DB.seed('t8_denuncias', [
    { id: 'dn1', proto: '99C-5520', who: 'Conta “treinos.gratis.ldn”', ctx: 'Comentário no seu programa CrossFit do zero', reason: 'Conteúdo impróprio', sentAt: '24/10 10:12', status: 'analise', step: 'equipe de segurança', result: '' },
    { id: 'dn0', proto: '99C-5104', who: 'Conta removida', ctx: 'Mensagem pelo perfil', reason: 'Golpe', sentAt: '12/10 08:40', status: 'concluida', step: 'concluída em 14/10', result: 'Aplicamos as regras da comunidade. Por privacidade, não detalhamos medidas sobre outra conta.' }
  ]);
  DB.seed('t8_bloqueios', []);

  var REASONS = ['Assédio', 'Golpe', 'Cobrança por fora da 99Coach', 'Conteúdo impróprio', 'Outro'];
  var STATUS = { recebida: ['Recebida', 'badge badge--info'], analise: ['Em análise', 'badge badge--warn'], concluida: ['Concluída', 'badge badge--ok'], recurso: ['Recurso em análise', 'badge badge--warn'] };

  REG.screen({
    page: 'treinador', key: 'denunciar', id: 'ACC16', title: 'Denunciar e bloquear', mtitle: 'Denunciar', nav: 'conta', back: 'TMENU', wide: true,
    normal: 'Nova denúncia',
    testIds: ['ana'],
    scens: [['enviada', 'Denúncia enviada'], ['bloqueado', 'Bloqueado'], ['analise', 'Em análise'], ['enviando', 'Enviando'], ['jaBloqueado', 'Já bloqueado'], ['indisponivel', 'Consulta indisponível']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn;
      var al = ctx.id ? DB.find('alunos', ctx.id) : null;
      var who = al ? { id: al.id, name: al.name, ctx: 'Aluno · ' + al.svc, last: 'Vínculo ativo com você desde ' + (al.since || '—'), student: true } : (DB.t8_contatos[0]);
      var blockedNow = DB.t8_bloqueios.indexOf(who.id) >= 0 || scn === 'bloqueado' || scn === 'jaBloqueado';
      var reason = ui.reason || '';
      var text = ui.text || '';
      var block = ui.block !== undefined ? !!ui.block : false;
      var tried = !!ui.tried;
      var mine = DB.t8_denuncias.filter(function (d) { return d.target === who.id; });
      var last = mine.length ? mine[mine.length - 1] : null;
      if (scn === 'enviada' && !last) last = { proto: '99C-5521', sentAt: '26/10 10:40', status: 'recebida', step: 'na fila da equipe de segurança', reason: 'Cobrança por fora da 99Coach' };
      var showForm = (!last || !!ui.again) && scn !== 'analise';

      function doBlock(after) {
        if (DB.t8_bloqueios.indexOf(who.id) < 0) DB.t8_bloqueios.push(who.id);
        if (after) after();
      }
      function send() {
        if (!reason) { ctx.setUi({ tried: true }); return; }
        var lines = ['Motivo: ' + reason, 'A outra pessoa não fica sabendo quem denunciou', 'Suas mensagens com ela continuam salvas como evidência'];
        if (block) lines.push('Bloquear: ' + who.name + ' não poderá mais te enviar mensagens');
        if (who.student) lines.push('Isso não cancela as contratações nem encerra o acompanhamento');
        ctx.ask({
          title: 'Enviar denúncia?', text: 'A equipe de segurança analisa em até 3 dias úteis. Você acompanha pelo protocolo.', lines: lines, ok: 'Enviar denúncia',
          onOk: function () {
            var proto = '99C-55' + String(21 + DB.t8_denuncias.length);
            DB.t8_denuncias.push({ id: DB.uid('dn'), proto: proto, who: who.name, target: who.id, ctx: who.ctx, reason: reason, sentAt: '26/10 ' + U.now(), status: 'recebida', step: 'na fila da equipe de segurança', result: '' });
            if (block) doBlock();
            ctx.setUi({ reason: '', text: '', block: false, tried: false, again: false });
            ctx.toast('Denúncia recebida. Protocolo ' + proto + '. Ainda não foi analisada.' + (block ? ' Contato bloqueado.' : ''));
          }
        });
      }
      function askBlock() {
        ctx.ask({
          title: 'Bloquear ' + who.name + '?', text: 'Bloquear contato não denuncia e não encerra nada sozinho.',
          lines: ['Muda: ela não poderá te enviar mensagens nem pedidos novos', 'Não muda: contratações, pagamentos e treinos continuam', who.student ? 'Para encerrar o acompanhamento, use Revisar vínculo' : 'Você pode desbloquear quando quiser'],
          ok: 'Confirmar bloqueio', danger: true,
          onOk: function () { doBlock(); ctx.toast('Contato bloqueado às ' + U.now() + '. Contratações continuam.'); }
        });
      }
      function unblock() {
        ctx.ask({ title: 'Desbloquear ' + who.name + '?', text: 'Ela volta a poder te enviar mensagens. Denúncias enviadas continuam em análise.', ok: 'Desbloquear', onOk: function () { DB.t8_bloqueios = DB.t8_bloqueios.filter(function (x) { return x !== who.id; }); if (scn) ctx.scenario(''); ctx.toast('Contato desbloqueado.'); } });
      }

      var A = null;
      if (scn === 'enviando') A = { cls: 'alert alert--info', ic: 'clock', t: 'Enviando', x: 'Estamos registrando sua denúncia. Não feche nem envie de novo; se a conexão cair, consultamos antes de repetir.', btn: '', act: null };
      if (scn === 'indisponivel') A = { cls: 'alert alert--warn', ic: 'refresh', t: 'Consulta indisponível', x: 'Não conseguimos carregar o andamento agora. Suas denúncias não foram perdidas.', btn: 'Tentar de novo', act: function () { ctx.scenario(''); ctx.toast('Consultado às ' + U.now() + '.'); } };
      if (scn === 'bloqueado') A = { cls: 'alert alert--ok', ic: 'lock', t: 'Bloqueado', x: 'Mensagens de ' + who.name + ' bloqueadas às 10:40. Muda: sem mensagens nem pedidos novos. Não muda: contratações, pagamentos e treinos continuam.', btn: 'Desbloquear', act: unblock };
      if (scn === 'analise') A = { cls: 'alert alert--info', ic: 'clock', t: 'Em análise', x: 'Etapa atual: equipe de segurança revisando as mensagens. Prazo: até 3 dias úteis a partir do envio.', btn: 'Consultar de novo', act: function () { ctx.toast('Consultado às ' + U.now() + ': ainda em análise.'); } };
      if (scn === 'jaBloqueado') A = { cls: 'alert alert--info', ic: 'lock', t: 'Já bloqueado', x: who.name + ' já está bloqueado desde 25/10. Você ainda pode denunciar.', btn: 'Saiba por quê', act: function () { ctx.ask({ title: 'Por que já está bloqueado?', text: 'Você bloqueou este contato em 25/10 pela conversa. O bloqueio impede mensagens e pedidos novos; não cancela contratações.', ok: 'Entendi', cancel: false }); } };

      var cases = DB.t8_denuncias.slice().reverse().map(function (d) {
        var st = scn === 'analise' && d.status === 'recebida' ? 'analise' : d.status, s = STATUS[st] || STATUS.recebida;
        return {
          proto: d.proto, who: d.who, ctx: d.ctx, reason: d.reason, sentAt: d.sentAt, st: s[0], badge: s[1], step: d.step, result: d.result, hasResult: !!d.result,
          canAppeal: d.status === 'concluida',
          check: function () { ctx.toast(d.proto + ': ' + s[0].toLowerCase() + ' · ' + d.step + '. Consultado às ' + U.now() + '.'); },
          appeal: function () { ctx.ask({ title: 'Pedir recurso?', text: 'Uma pessoa diferente revisa a decisão do protocolo ' + d.proto + '. O recurso não revela dados da outra conta.', ok: 'Pedir recurso', onOk: function () { var x = DB.t8_denuncias.find(function (y) { return y.proto === d.proto; }); if (x) { x.status = 'recurso'; x.step = 'recurso pedido em 26/10'; } ctx.toast('Recurso pedido. Mesmo protocolo ' + d.proto + '.'); } }); }
        };
      });

      var lastV = last ? { proto: last.proto, sentAt: last.sentAt, st: (STATUS[scn === 'analise' ? 'analise' : last.status] || STATUS.recebida)[0], step: last.step, reason: last.reason } : { proto: '', sentAt: '', st: '', step: '', reason: '' };

      return {
        alert: A || { cls: '', t: '', x: '', btn: '', act: function () {} }, hasAlert: !!A, alertIc: 'ic ic--sm i-' + (A ? A.ic : 'info'), alertHasBtn: !!(A && A.btn),
        who: who.name, whoCtx: who.ctx, whoLast: who.last, ini: U.ini(who.name), student: !!who.student, notStudent: !who.student,
        showForm: showForm || scn === 'enviando', hasLast: !!last && scn !== 'enviando' && !ui.again, last: lastV,
        reasons: REASONS.map(function (r) { var on = reason === r; return { label: r, on: String(on), cls: 'chip t8-chip' + (on ? ' is-on' : ''), pick: function () { ctx.setUi({ reason: r }); } }; }),
        hasReasonErr: tried && !reason, reasonErr: 'Escolha um motivo.',
        text: text, textN: String(text.length) + ' de 500', setText: function (e) { ctx.setUi({ text: String(U.val(e)).slice(0, 500) }); },
        blockOn: String(block), blockCls: 'switch' + (block ? ' is-on' : ''), toggleBlock: function () { ctx.setUi({ block: !block }); },
        blockedNow: blockedNow, notBlocked: !blockedNow, canToggleBlock: !blockedNow,
        sending: scn === 'enviando', notSending: scn !== 'enviando',
        send: send, sendLabel: scn === 'enviando' ? 'Enviando…' : 'Enviar denúncia',
        askBlock: askBlock, unblock: unblock,
        cases: cases, hasCases: cases.length > 0,
        backCtx: function () { ctx.go('TRE25', { id: who.id }); },
        reviewLink: function () { ctx.go('REL09', { id: who.id }); },
        newReport: function () { ctx.setUi({ again: true }); }
      };
    }
  });
})();
