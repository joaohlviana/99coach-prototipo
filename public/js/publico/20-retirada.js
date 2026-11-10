/* PUB12 · Correção ou retirada de perfil público (perfil importado de fonte pública): sem cadastro, verificação, protocolo e acompanhamento */
(function () {
  'use strict';
  DB.seed('p2_importados', [
    { id: 'mtp', name: 'MTP Athletes', kind: 'Box de CrossFit', src: 'Instagram', handle: '@mtp_athletes', at: '12/10/2026', region: 'Região central · Londrina, PR', shown: 'Nome, modalidade e região aproximada', photo: '0d6e126f792d89360f91548c75ddf267' }
  ]);
  // pedidos de correção/retirada (sem conta): protocolo, e-mail só para acompanhar, etapa
  DB.seed('p2_pedidos', [
    { id: '99C-2210-4471', profile: 'mtp', kind: 'retirada', email: 'contato@exemplo.com', at: '22/10 16:05', stage: 1 }
  ]);
  var KINDS = [
    ['corrigir', 'Corrigir uma informação', 'Nome, modalidade, região ou foto errados', 'edit'],
    ['retirar', 'Retirar este perfil', 'Não autorizei a publicação', 'trash'],
    ['reivindicar', 'É meu perfil — reivindicar', 'Assumir o perfil e editar você mesmo', 'user-plus']
  ];
  var FIELDS = ['Nome', 'Modalidade', 'Região', 'Foto', 'Outra'];
  var RELS = [['eu', 'Sou a pessoa ou a organização do perfil'], ['repr', 'Represento a organização'], ['outro', 'Outra pessoa citada no perfil']];
  var STAGES = ['Recebido', 'Verificação', 'Decisão'];

  REG.screen({
    page: 'publico', key: 'retirada', id: 'PUB12', title: 'Corrigir ou retirar perfil', mtitle: 'Corrigir ou retirar', nav: 'explorar', back: 'history', wide: true,
    testIds: ['rafael', 'studio-forca'],
    normal: 'Escolher pedido',
    scens: [['registrado', 'Pedido registrado'], ['analise', 'Em análise · etapa atual'], ['identidade', 'Não foi possível confirmar identidade'], ['analise2', 'Em análise · consultar de novo'], ['consulta', 'Consulta indisponível'], ['desconhecido', 'Resultado do envio desconhecido']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn, g = function (k, d) { return P2.g(ui, k, d); };
      // perfil importado (fonte pública) ou perfil gerenciado pelo próprio treinador (vindo do perfil público, ex.: id rafael)
      var imp = DB.find('p2_importados', ctx.id);
      var tr = !imp && ctx.id && DB.p1_treinadores ? DB.find('p1_treinadores', ctx.id) : null;
      var org = !imp && !tr && ctx.id && DB.p2_orgs ? DB.find('p2_orgs', ctx.id) : null;
      var managed = !!(tr && tr.perfil) || !!org;
      var pf = org
        ? { id: org.id, name: org.name, kind: org.kind, src: 'Informado pela organização', handle: '', at: org.informed, region: org.city, shown: 'O que a organização informou', photo: org.photo }
        : managed
        ? { id: tr.id, name: tr.name, kind: 'Treinador · ' + tr.spec, src: 'Cadastro do treinador', handle: '', at: '', region: tr.area + ' · ' + tr.city, shown: 'O que o treinador publicou', photo: tr.photo }
        : (imp || DB.p2_importados[0]);
      var kinds = managed ? KINDS.slice(0, 2).map(function (k) { return k[0] === 'retirar' ? ['retirar', 'Pedir retirada deste perfil', 'Usa meu nome ou imagem sem autorização', 'trash'] : k; }) : KINDS;
      var trackScn = { registrado: 1, analise: 1, analise2: 1, consulta: 1 };
      var view = g('view', trackScn[scn] ? 'track' : 'form');
      var kind = g('kind', scn === 'identidade' || scn === 'desconhecido' ? 'retirar' : '');
      var email = g('email', scn === 'identidade' || scn === 'desconhecido' ? 'contato@exemplo.com' : '');
      var reason = g('reason', scn === 'identidade' || scn === 'desconhecido' ? 'Não autorizei a publicação.' : '');
      var rel = g('rel', scn === 'identidade' || scn === 'desconhecido' ? 'eu' : '');
      var field = g('field', '');
      var fix = g('fix', '');
      var err = g('err', {});
      var reqId = g('reqId', '99C-2210-4471');
      var req = DB.find('p2_pedidos', reqId);
      if (req && scn === 'analise') req = Object.assign({}, req, { stage: 1 });

      var send = function () {
        var e = {};
        if (!kind) e.kind = 'Escolha o que você quer fazer.';
        if (kind === 'corrigir' && !field) e.field = 'Diga qual informação está errada.';
        if (kind === 'corrigir' && String(fix).trim().length < 3) e.fix = 'Escreva como a informação deveria aparecer.';
        if (!rel) e.rel = 'Diga sua relação com o perfil para sabermos como confirmar.';
        if (!P2.email(email)) e.email = 'Informe um e-mail válido para acompanhar o pedido.';
        if (Object.keys(e).length) { ctx.setUi({ err: e }); return; }
        var id = P2.protocol();
        DB.p2_pedidos.unshift({ id: id, profile: pf.id, kind: kind === 'corrigir' ? 'correção' : 'retirada', email: email, at: '26/10 ' + U.now(), stage: 0 });
        if (ctx.scn) ctx.scenario('');
        ctx.setUi({ view: 'track', reqId: id, err: {}, justSent: true });
      };

      var alerts = [];
      if (scn === 'identidade') alerts.push(P2.alert('risk', 'alert', 'Não foi possível confirmar identidade', 'Para retirar um perfil confirmamos que você fala pela pessoa ou organização. ' + (managed ? 'Responda ao e-mail com o código 4471.' : 'Envie, pelo Instagram ' + pf.handle + ', uma mensagem com o código 4471, ou responda ao e-mail com um documento da organização.') + ' Nada disso será publicado.', 'Tentar de novo', function () { ctx.scenario(''); ctx.toast('Confirmação reenviada para ' + email + '.'); }));
      if (scn === 'analise') alerts.push(P2.alert('info', 'clock', 'Em análise', 'Etapa atual: verificação. Você não precisa fazer nada agora; avisamos no e-mail informado.'));
      if (scn === 'analise2') alerts.push(P2.alert('', 'clock', 'Em análise', 'Seu pedido está na verificação. O prazo aparece aqui quando a análise começar.', 'Consultar de novo', function () { ctx.toast('Sem mudança desde 22/10 16:05. Seu pedido continua em verificação.'); }));
      if (scn === 'consulta') alerts.push(P2.alert('risk', 'alert', 'Consulta indisponível', 'Seu pedido continua registrado. Tente de novo em instantes; não é preciso enviar outro.', 'Tentar de novo', function () { ctx.scenario(''); ctx.setUi({ view: 'track' }); }));
      if (scn === 'desconhecido') alerts.push(P2.alert('warn', 'clock', 'Resultado do envio desconhecido', 'A conexão caiu durante o envio. Consulte a mesma solicitação antes de reenviar.', 'Consultar de novo', function () {
        ctx.scenario(''); ctx.setUi({ view: 'track', reqId: '99C-2210-4471', justSent: false }); ctx.toast('Encontramos o pedido 99C-2210-4471. Não precisa reenviar.');
      }));
      if (scn === 'registrado' && view === 'track') alerts.push(P2.alert('ok', 'check', 'Pedido registrado', 'Protocolo 99C-2210-4471. Guarde seu protocolo: o prazo aparece aqui quando for definido.'));

      var at = req ? req.stage : 0;
      var stages = STAGES.map(function (s, i) { return { label: s, n: String(i + 1), cls: 'p2-step' + (i <= at ? ' is-done' : '') + (i === at ? ' is-cur' : '') }; });

      return {
        alerts: alerts, isForm: view === 'form', isTrack: view === 'track',
        pf: { name: pf.name, kind: pf.kind, region: pf.region },
        imported: !managed, managed: managed,
        srcTitle: org ? 'Página gerenciada pela organização' : (managed ? 'Perfil gerenciado pelo treinador' : 'Perfil criado de fonte pública'),
        srcText: managed ? 'Correções são enviadas ' + (org ? 'à organização' : 'ao treinador') + ' e à nossa equipe. Você não precisa criar conta.' : pf.src + ' ' + pf.handle + ' · ' + pf.at,
        srcIc: managed ? 'ic ic--sm i-user' : 'ic ic--sm i-link',
        origin: (org ? [['Origem', 'Informado pela organização em ' + pf.at], ['Quem edita', pf.name], ['O que mostramos', pf.shown]] : managed ? [['Origem', 'Cadastro feito pelo próprio treinador'], ['Quem edita', pf.name], ['O que mostramos', pf.shown]] : [['Fonte', pf.src], ['Perfil', pf.handle], ['Coletado em', pf.at], ['O que mostramos', pf.shown]]).map(function (r) { return { k: r[0], v: r[1] }; }),
        pic: P2.pic(pf.photo, pf.name),
        kinds: kinds.map(function (k) { var on = k[0] === kind; return { label: k[1], sub: k[2], ic: 'ic ic--sm i-' + k[3], cls: 'p2-opt' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ kind: k[0], err: {} }); } }; }),
        hasErrKind: !!err.kind, errKind: err.kind || '',
        isFix: kind === 'corrigir', isOut: kind === 'retirar', isClaim: kind === 'reivindicar', canSend: kind === 'corrigir' || kind === 'retirar',
        noKind: !kind,
        formTitle: kind === 'corrigir' ? 'Pedido de correção' : 'Pedido de retirada',
        fields: FIELDS.map(function (f) { var on = f === field; return { label: f, cls: 'chip p2-chip' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ field: f }); } }; }),
        hasErrField: !!err.field, errField: err.field || '',
        fix: fix, setFix: function (e) { ctx.setUi({ fix: U.val(e) }); }, hasErrFix: !!err.fix, errFix: err.fix || '', fixCls: 'input input--area' + (err.fix ? ' is-err' : ''),
        rels: RELS.map(function (r) { var on = r[0] === rel; return { label: r[1], cls: 'p2-radio' + (on ? ' is-on' : ''), dot: 'p2-radio__dot' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ rel: r[0] }); } }; }),
        hasErrRel: !!err.rel, errRel: err.rel || '',
        email: email, setEmail: function (e) { ctx.setUi({ email: U.val(e) }); }, hasErrEmail: !!err.email, errEmail: err.email || '', emailCls: 'input' + (err.email ? ' is-err' : ''),
        reason: reason, setReason: function (e) { ctx.setUi({ reason: U.val(e) }); },
        send: send,
        claim: function () { ctx.go('ACC08'); },
        // acompanhamento
        hasReq: !!req && scn !== 'consulta', noReq: !req && scn !== 'consulta',
        req: req ? { id: req.id, kind: req.kind === 'retirada' ? 'Retirada de perfil' : 'Correção de informação', at: req.at, stage: STAGES[req.stage] || STAGES[0] } : { id: '', kind: '', at: '', stage: '' },
        stages: stages, justSent: !!g('justSent', false),
        lookQ: g('lookQ', ''), setLook: function (e) { ctx.setUi({ lookQ: U.val(e), lookErr: '' }); },
        look: function () {
          var id = String(g('lookQ', '')).trim().toUpperCase();
          if (!DB.find('p2_pedidos', id)) { ctx.setUi({ lookErr: 'Protocolo não encontrado. Confira o formato 99C-0000-0000.' }); return; }
          ctx.setUi({ reqId: id, lookErr: '', justSent: false });
        },
        lookErr: g('lookErr', ''), hasLookErr: !!g('lookErr', ''),
        openTrack: function () { ctx.setUi({ view: 'track' }); }, toForm: function () { ctx.setUi({ view: 'form' }); },
        backLabel: org ? 'Voltar à página' : 'Voltar ao perfil',
        back: function () { if (org) ctx.go('ORG01', { id: org.id }); else if (managed && window.P1) window.P1.openTrainer(pf.id); else ctx.go('PUB04', { id: pf.id }); },
        toData: function () { ctx.go('PUB11', { art: 'perfil' }); }
      };
    }
  });
})();
