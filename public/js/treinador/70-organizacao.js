/* T8 · Gestão e afiliação à organização (ORG02), do lado do treinador Rafael Lima. Recurso condicional: não bloqueia o núcleo treinador/aluno. */
(function () {
  'use strict';
  // mine.state: convite · confirmado · recusado · retirado · contestado
  DB.seed('t8_org', {
    id: 'sfc', name: 'Studio Força Centro', kind: 'Academia', city: 'Londrina, PR', claim: 'confirmada', manager: 'Mariana Teles (gestora)',
    units: ['Centro', 'Zona Sul'],
    mine: { unit: 'Centro', state: 'convite', invitedAt: '24/10', by: 'Mariana Teles', at: '', proto: '' },
    share: { name: true, photo: true, link: true },
    members: [
      { id: 'thiago', name: 'Thiago Pereira', unit: 'Centro', state: 'confirmado', access: 'nenhum' },
      { id: 'renata', name: 'Renata Souza', unit: 'Zona Sul', state: 'convite enviado', access: 'nenhum' }
    ]
  });

  var STL = { convite: ['Convite recebido', 'badge badge--warn'], confirmado: ['Confirmado', 'badge badge--ok'], recusado: ['Recusado', 'badge badge--plain'], retirado: ['Retirado', 'badge badge--plain'], contestado: ['Contestação aberta', 'badge badge--risk'], sincronizando: ['Confirmando', 'badge badge--info'] };

  REG.screen({
    page: 'treinador', key: 'organizacao', id: 'ORG02', title: 'Organização', nav: 'conta', back: 'TMENU', wide: true,
    normal: 'Convite de afiliação',
    scens: [['conviteEnviado', 'Convite enviado'], ['contestacao', 'Contestação'], ['escopo', 'Escopo'], ['claimPendente', 'Claim pendente'], ['convitePendente', 'Convite de afiliação pendente'], ['semPermissao', 'Sem permissão'], ['desconhecido', 'Resultado desconhecido']],
    vals: function (ctx) {
      var O = DB.t8_org, ui = ctx.ui, scn = ctx.scn;
      var mine = JSON.parse(JSON.stringify(O.mine));
      if (scn === 'contestacao') { mine.state = 'contestado'; mine.proto = mine.proto || '99C-6013'; }
      if (scn === 'convitePendente' || scn === 'desconhecido') mine.state = 'sincronizando';
      var claimPend = scn === 'claimPendente';
      var review = !!ui.review || scn === 'escopo';
      var read = !!ui.read;
      var share = O.share;

      function confirm() {
        if (claimPend) { ctx.toast('A organização ainda não confirmou quem a administra. Confirme depois.'); return; }
        if (!read) { ctx.setUi({ review: true, tried: true }); ctx.toast('Revise o que a afiliação permite antes de confirmar.'); return; }
        ctx.ask({
          title: 'Confirmar afiliação?', text: 'Você passa a aparecer como treinador da unidade ' + mine.unit + ' do ' + O.name + '.',
          lines: ['Isso não compartilha dados dos alunos', 'A organização não vê mensagens, saúde, preços nem recebimentos', 'Seus alunos e contratações continuam só com você', 'Você pode retirar a afiliação quando quiser'],
          ok: 'Confirmar afiliação',
          onOk: function () { O.mine.state = 'confirmado'; O.mine.at = '26/10 ' + U.now(); ctx.setUi({ review: false }); ctx.toast('Afiliação confirmada às ' + U.now() + '. A página da organização atualiza em alguns minutos.'); }
        });
      }
      function decline() {
        ctx.ask({ title: 'Recusar convite?', text: 'A organização é avisada de que você recusou. Nada muda no seu perfil.', ok: 'Recusar convite', danger: true, onOk: function () { O.mine.state = 'recusado'; ctx.toast('Convite recusado.'); } });
      }
      function leave() {
        ctx.ask({ title: 'Retirar afiliação?', text: 'Você deixa de aparecer na página do ' + O.name + '.', lines: ['Seu perfil, alunos e contratações não mudam', 'A organização é avisada', 'Para voltar, a organização precisa convidar de novo'], ok: 'Retirar afiliação', danger: true, onOk: function () { O.mine.state = 'retirado'; O.mine.at = '26/10 ' + U.now(); ctx.toast('Afiliação retirada às ' + U.now() + '.'); } });
      }
      function contest() {
        ctx.ask({ title: 'Contestar vínculo?', text: 'Use se o ' + O.name + ' mostra você sem sua confirmação ou numa unidade errada. Abrimos um caso com protocolo; o vínculo fica oculto enquanto analisamos.', ok: 'Abrir contestação', onOk: function () { O.mine.state = 'contestado'; O.mine.proto = '99C-6013'; ctx.toast('Contestação aberta. Protocolo 99C-6013.'); } });
      }
      var recheck = function () { ctx.scenario(''); ctx.toast('Consultado às ' + U.now() + ': ' + (O.mine.state === 'confirmado' ? 'afiliação confirmada.' : 'convite ainda aguardando sua resposta. Nada foi confirmado.')); };

      var A = null;
      if (scn === 'conviteEnviado') A = { cls: 'alert alert--info', ic: 'send', t: 'Convite enviado', x: 'Mariana Teles convidou você em 24/10 para a unidade Centro. Só vale depois que você aceitar.', btn: 'Revisar afiliação', act: function () { ctx.setUi({ review: true }); } };
      if (scn === 'contestacao') A = { cls: 'alert alert--warn', ic: 'alert', t: 'Contestação', x: 'Caso 99C-6013 aberto em 26/10. O vínculo fica oculto na página da organização até a análise.', btn: 'Comparar', act: function () { ctx.setUi({ cmp: !ui.cmp }); } };
      if (scn === 'escopo') A = { cls: 'alert alert--info', ic: 'shield', t: 'Escopo', x: 'A afiliação não dá acesso a dados dos alunos. Confira abaixo o que a organização pode e não pode ver.', btn: 'Continuar', act: function () { ctx.scenario(''); ctx.setUi({ review: true, read: true }); } };
      if (claimPend) A = { cls: 'alert alert--warn', ic: 'clock', t: 'Organização ainda não confirmada', x: 'O ' + O.name + ' ainda está confirmando quem administra a página. Você pode revisar o convite, mas só confirma depois disso.', btn: 'Consultar de novo', act: recheck };
      if (scn === 'convitePendente') A = { cls: 'alert alert--info', ic: 'refresh', t: 'Convite de afiliação pendente', x: 'Sua resposta foi enviada e ainda está sendo registrada. Não confirme de novo.', btn: 'Consultar de novo', act: recheck };
      if (scn === 'semPermissao') A = { cls: 'alert alert--warn', ic: 'lock', t: 'Sem permissão', x: 'Só gestores da organização convidam treinadores ou mudam unidades. Você é treinador afiliado.', btn: 'Saiba por quê', act: function () { ctx.ask({ title: 'Quem gerencia a organização', text: 'Gestão: ' + O.manager + '. Peça a ela para convidar outro treinador ou trocar sua unidade. Ser afiliado não dá acesso à gestão.', ok: 'Entendi', cancel: false }); } };
      if (scn === 'desconhecido') A = { cls: 'alert alert--warn', ic: 'refresh', t: 'Resultado desconhecido', x: 'A conexão caiu ao confirmar. Consultamos antes de repetir para não duplicar a afiliação.', btn: 'Consultar de novo', act: recheck };

      var st = STL[mine.state] || STL.convite;
      var members = [{ id: 'rafael', name: 'Rafael Lima (você)', unit: mine.unit, state: st[0].toLowerCase(), access: 'nenhum', me: true }].concat(O.members).filter(function (m) { return !(m.me && (mine.state === 'recusado' || mine.state === 'retirado')); }).map(function (m) {
        return { name: m.name, unit: m.unit, state: m.state, access: m.access, cls: m.me ? 't8-me' : '', badge: 'badge ' + (m.state === 'confirmado' ? 'badge--ok' : (m.state.indexOf('convite') === 0 ? 'badge--warn' : 'badge--plain')) };
      });
      var shareRow = function (k, label, sub) { var on = !!share[k]; return { label: label, sub: sub, on: String(on), cls: 'switch' + (on ? ' is-on' : ''), toggle: function () { share[k] = !share[k]; ctx.toast((share[k] ? 'Vai aparecer: ' : 'Não vai aparecer: ') + label.toLowerCase() + '.'); } }; };

      return {
        alert: A || { cls: '', t: '', x: '', btn: '', act: function () {} }, hasAlert: !!A, alertIc: 'ic ic--sm i-' + (A ? A.ic : 'info'), alertHasBtn: !!(A && A.btn),
        org: O.name, orgSub: O.kind + ' · ' + O.city + ' · unidades ' + O.units.join(' e '), ini: U.ini(O.name),
        claimLabel: claimPend ? 'Titularidade em confirmação' : 'Titularidade confirmada', claimCls: 'badge ' + (claimPend ? 'badge--warn' : 'badge--ok'),
        stLabel: st[0], stCls: st[1], unit: mine.unit,
        mineText: mine.state === 'convite' ? 'Convite de ' + mine.by + ' em ' + mine.invitedAt + ' para a unidade ' + mine.unit + '. Vincular à unidade não cria acompanhamento nem importa alunos.'
          : mine.state === 'confirmado' ? 'Afiliado à unidade ' + mine.unit + ' desde ' + mine.at + '.'
          : mine.state === 'recusado' ? 'Você recusou o convite. Nada mudou no seu perfil.'
          : mine.state === 'retirado' ? 'Você retirou a afiliação em ' + mine.at + '. Seu perfil e alunos não mudaram.'
          : mine.state === 'contestado' ? 'Contestação ' + mine.proto + ' em análise. O vínculo fica oculto até a decisão.'
          : 'Confirmação em andamento. Consulte antes de repetir.',
        isInvite: mine.state === 'convite', isConfirmed: mine.state === 'confirmado', isContest: mine.state === 'contestado',
        canContest: mine.state === 'convite' || mine.state === 'confirmado',
        review: review, toggleReview: function () { ctx.setUi({ review: !review }); },
        reviewLabel: review ? 'Fechar revisão' : 'Revisar afiliação',
        readOn: String(read), readCls: 'check' + (read ? ' is-on' : ''), toggleRead: function () { ctx.setUi({ read: !read }); }, readErr: !!ui.tried && !read,
        can: ['Mostrar seu nome e foto na página da organização', 'Listar você como treinador da unidade ' + mine.unit, 'Mostrar o link para o seu perfil público'],
        cannot: ['Ver seus alunos, treinos ou formulários', 'Ver dados de saúde ou mensagens', 'Ver preços, vendas ou recebimentos', 'Criar acompanhamento ou definir repasse'],
        cmp: !!ui.cmp,
        share: [shareRow('name', 'Nome', 'Na lista de treinadores da unidade'), shareRow('photo', 'Foto', 'A mesma do seu perfil público'), shareRow('link', 'Link para o perfil', 'Leva ao seu perfil na 99Coach')],
        members: members,
        confirm: confirm, decline: decline, leave: leave, contest: contest,
        confirmCls: 'btn btn--primary btn--lg' + (claimPend ? ' t8-off' : ''), confirmDis: String(claimPend),
        invite: function () { ctx.ask({ title: 'Convidar treinador para afiliação', text: 'Só gestores da organização convidam treinadores. Você é treinador afiliado; peça a ' + O.manager + '.', ok: 'Entendi', cancel: false }); },
        viewPage: function () { ctx.go('ORG01', { id: O.id }); }
      };
    }
  });
})();
