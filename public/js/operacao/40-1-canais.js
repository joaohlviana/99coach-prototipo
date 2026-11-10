/* O4 · OPS15 Canais de comunicação (+ OPS15.A capacidade efetiva, OPS15.B template, OPS15.C entrega e falha).
   E-mail, push e WhatsApp: modelos, envio de teste, limites e descadastro. Link manual nunca conta como envio. */
(function () {
  'use strict';
  DB.seed('o4_canais', [
    { id: 'email', name: 'E-mail', fin: 'transacional', optin: 'n/a', estado: 'ativo', forn: 'fornecedor-e', amb: 'produção', aut: 'ok', pront: 'pronto', prox: '—',
      lim: 5000, usado: 1240, porPessoa: 'até 3 por pessoa por dia', limProp: 0,
      saida: 'Link “Não quero mais receber” em todo e-mail não essencial', segue: 'Convite, recibo de pagamento e segurança da conta', descad: 18, descadFonte: 'fornecedor-e · 7 dias até 26/10 14:02' },
    { id: 'push', name: 'Push', fin: 'lembretes', optin: 'sim', estado: 'ativo', forn: 'fornecedor-p', amb: 'produção', aut: 'ok', pront: 'pronto', prox: '—',
      lim: 20000, usado: 6420, porPessoa: 'até 2 lembretes por dia, nada entre 22h e 7h', limProp: 0,
      saida: 'Desligar em Conta e preferências › Avisos, ou no próprio aparelho', segue: 'Nada: sem opt-in, nenhum push sai', descad: 41, descadFonte: 'fornecedor-p · 7 dias até 26/10 14:02' },
    { id: 'whatsapp', name: 'WhatsApp oficial', fin: '—', optin: '—', estado: 'não habilitado', forn: '—', amb: '—', aut: 'não', pront: 'não habilitado', prox: 'Produto · aprovação da capacidade',
      lim: 0, usado: 0, porPessoa: '—', limProp: 0, saida: '—', segue: '—', descad: 0, descadFonte: '' }
  ]);
  DB.seed('o4_modelos', [
    { id: 'invite', key: 'notif.invite_expiring', name: 'Convite expirando', canal: 'email', v: 3, fin: 'transacional · convite', base: 'convite enviado pelo treinador', vars: ['{treinador}', '{data}', '{link}'], status: 'aprovado', prop: 0, aud: 'convite',
      txt: { pt: 'Seu convite de {treinador} vence em {data}. Aceite para começar.', en: 'Your invite from {treinador} expires on {data}. Accept it to get started.', es: 'Tu invitación de {treinador} vence el {data}. Acéptala para empezar.' } },
    { id: 'lembrete', key: 'notif.workout_reminder', name: 'Lembrete de treino', canal: 'push', v: 2, fin: 'lembrete · treino agendado', base: 'opt-in de lembretes', vars: ['{treinador}', '{hora}'], status: 'aprovado', prop: 0, aud: 'ativo',
      txt: { pt: 'Seu treino com {treinador} começa às {hora}.', en: 'Your session with {treinador} starts at {hora}.', es: 'Tu entrenamiento con {treinador} empieza a las {hora}.' } },
    { id: 'recibo', key: 'notif.payment_receipt', name: 'Recibo de pagamento', canal: 'email', v: 5, fin: 'transacional · pagamento', base: 'contratação', vars: ['{oferta}', '{valor}', '{link}'], status: 'aprovado', prop: 0, aud: 'ativo',
      txt: { pt: 'Recebemos {valor} por {oferta}. O recibo está em {link}.', en: 'We received {valor} for {oferta}. Your receipt is at {link}.', es: 'Recibimos {valor} por {oferta}. El recibo está en {link}.' } }
  ]);
  DB.seed('o4_envios', [
    { id: 'm_77812', modelo: 'invite', canal: 'email', dest: 'a••••@gmail.com', ctx: 'convite expirando', estado: 'desconhecido', teste: false,
      steps: [['Solicitado', '09:00', 'ok'], ['Aceito pelo fornecedor', '09:00', 'ok'], ['Entregue', 'sem retorno', 'unk']] },
    { id: 'm_77790', modelo: 'lembrete', canal: 'push', dest: 'aparelho •••4F2A', ctx: 'lembrete de treino', estado: 'entregue', teste: false, evid: 'fornecedor-p · recibo pv-55120 · 08:41',
      steps: [['Solicitado', '08:40', 'ok'], ['Aceito pelo fornecedor', '08:40', 'ok'], ['Entregue', '08:41', 'ok']] },
    { id: 'm_77801', modelo: 'recibo', canal: 'email', dest: 'm••••@outlook.com', ctx: 'recibo de pagamento', estado: 'falhou', teste: false, motivoFalha: 'caixa do destinatário cheia (recusado pelo destino)',
      steps: [['Solicitado', '11:12', 'ok'], ['Aceito pelo fornecedor', '11:12', 'ok'], ['Entregue', '11:13', 'fail']] }
  ]);

  var ST = { ok: ['check', 'Confirmado', 'ok'], unk: ['clock', 'Desconhecido', 'warn'], fail: ['x', 'Falhou', 'risk'], wait: ['clock', 'Adiado · 429', 'warn'] };
  function stepRows(steps) { return steps.map(function (s) { var t = ST[s[2]] || ST.unk; return [t[0], s[0], s[1], t[1], t[2]]; }); }
  function tone(st) { return { 'ativo': 'ok', 'pronto': 'ok', 'pausado': 'warn', 'não habilitado': 'plain', 'bloqueado': 'risk', 'indisponível': 'risk' }[st] || 'plain'; }
  function num(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  var SAMPLE = { '{treinador}': 'Rafael Lima', '{data}': '01/11', '{link}': '99coach.com/c/••••', '{hora}': '07:00', '{oferta}': 'Acompanhamento online', '{valor}': 'R$ 200' };
  function render(t) { return String(t).replace(/\{[^}]+\}/g, function (m) { return SAMPLE[m] || m; }); }
  var subLinks = function () {
    return O4.card({ title: 'Detalhes de canais', parts: [O4.P.links([
      ['Canais e capacidade efetiva', 'Fornecedor, ambiente, autorização e prontidão', 'shield', function () { GO('OPS15.A'); }],
      ['Template, finalidade e destinatário', 'Textos PT/EN/ES, variáveis permitidas e prévia', 'file', function () { GO('OPS15.B', { id: 'invite' }); }],
      ['Entrega e falha', 'Solicitado, aceito, entregue: com evidência', 'send', function () { GO('OPS15.C', { id: 'm_77812' }); }]
    ])] });
  };

  /* ===================== OPS15 · composição ===================== */
  REG.screen({
    page: 'operacao', key: 'ops15', id: 'OPS15', title: 'Canais', mtitle: 'Canais', nav: 'governanca', back: 'OPS14', wide: true,
    testIds: ['push', 'whatsapp'],
    normal: 'Canais em uso',
    scens: [['manual', 'Link manual'], ['entregue', 'Entregue'], ['falhou', 'Falhou']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn, P = O4.P;
      var pk = O4.pick(ctx, DB.o4_canais), ch = pk.it;
      var modelos = DB.o4_modelos.filter(function (m) { return m.canal === ch.id; });
      var mSel = DB.find('o4_modelos', ui.tm) || modelos[0] || null;
      var test = ui.test ? DB.find('o4_envios', ui.test) : null;
      // envio de teste: o resultado só é conhecido depois de consultar
      var dec = O4.dec(ctx, 'canais', {
        pausar: { title: 'Pausar ' + ch.name, acao: 'Pausar canal ' + ch.name, alvo: ch.name + ' · ' + ch.fin, ok: 'Pausar canal', danger: true, estado: 'solicitado',
          what: 'Novas mensagens deste canal deixam de sair. Use quando houver reclamação, falha do fornecedor ou suspeita de envio fora de contexto.',
          impact: ['Novos envios de ' + ch.name + ' param em até 2 min.', 'Mensagens já aceitas pelo fornecedor podem chegar: não dá para recolher.', 'Avisos de segurança da conta seguem por e-mail.'],
          apply: function () { ch.estado = 'pausado'; } },
        retomar: { title: 'Retomar ' + ch.name, acao: 'Retomar canal ' + ch.name, alvo: ch.name + ' · ' + ch.fin, ok: 'Retomar canal', estado: 'solicitado',
          impact: ['Envios voltam a respeitar o limite de ' + num(ch.lim) + ' por dia.', 'Nada que ficou parado é reenviado automaticamente.'],
          apply: function () { ch.estado = 'ativo'; } },
        limite: { title: 'Propor novo limite de ' + ch.name, acao: 'Proposta de limite diário', alvo: ch.name, ok: 'Encaminhar proposta', estado: 'aguardando aprovação',
          impact: function () { var n = parseInt(String(ui.lim || '').replace(/\D/g, ''), 10) || 0; return ['Limite diário passa de ' + num(ch.lim) + ' para ' + num(n) + ' depois da aprovação de Produto.', 'Acima do limite, mensagens esperam o dia seguinte; nenhuma é descartada.', 'Hoje: ' + num(ch.usado) + ' enviadas (' + ch.descadFonte.split(' · ')[0] + ', 26/10 14:02).']; },
          apply: function () { ch.limProp = parseInt(String(ui.lim || '').replace(/\D/g, ''), 10) || 0; return { lim: '' }; } }
      });
      var alerts = [];
      var lastUnknown = test && test.estado === 'desconhecido' && !(ui.q > 0);
      if (scn === 'manual') alerts.push(P.alert('clock', 'Link manual', 'Estado “desconhecido”. Abrir um link de WhatsApp à mão não prova que a mensagem foi enviada nem lida. Não conte como enviado.', [{ label: 'Consultar de novo', fn: O4.consult(ctx, 'Continua desconhecido: link manual não tem evidência do provedor.') }]));
      if (scn === 'entregue') alerts.push(P.alert('ok', 'Entregue', 'Evidência do provedor: fornecedor-e confirmou a entrega de m_77813 às 14:03 (recibo pe-90311).'));
      if (scn === 'falhou') alerts.push(P.alert('risk', 'Falhou', 'Alternativa de canal: o fornecedor-p recusou o push (aparelho sem registro válido). A falha está confirmada; use e-mail se a finalidade permitir.', [
        { label: 'Tentar de novo', fn: function () { ctx.ask({ title: 'Tentar de novo', text: 'Falha confirmada pelo fornecedor para m_77813. Um novo envio usa a mesma referência e não duplica a mensagem.', lines: ['Canal: Push', 'Destino: caixa de teste da operação'], ok: 'Tentar de novo', onOk: function () { ctx.toast('Novo envio solicitado às ' + U.now() + '. Consulte o resultado antes de repetir.'); } }); } },
        { label: 'Usar e-mail', cls: 'btn--ghost btn--sm', fn: function () { ctx.setUi({ sel: 'email' }); } }]));

      var rows = DB.o4_canais.map(function (c) {
        return { cells: [c.name, c.fin, c.optin, [c.estado, tone(c.estado)]], title: c.name, meta: c.fin === '—' ? 'sem finalidade aprovada' : c.fin + ' · opt-in ' + c.optin, badge: c.estado, tone: tone(c.estado), go: pk.sel(c.id), on: c.id === ch.id };
      });
      var main = [
        O4.card({ title: 'Canais', sub: 'Toque em um canal para ver limites, modelos, teste e descadastro', parts: [P.table(['Canal', 'Finalidade', 'Opt-in', 'Estado'], rows)] }),
        subLinks(),
        O4.rcCard('canais')
      ];
      var side = [];
      var active = ch.estado === 'ativo' || ch.estado === 'pausado';
      side.push(O4.card({ title: ch.name, tag: ch.estado, tone: tone(ch.estado), parts: [
        P.kv([['Fornecedor', ch.forn], ['Ambiente', ch.amb], ['Finalidade', ch.fin], ['Opt-in', ch.optin], ['Autorização', ch.aut, ch.aut === 'ok' ? 'ok' : 'plain']]),
        ch.id === 'whatsapp' ? P.alert('info', 'Não habilitado', 'WhatsApp só entra com capacidade aprovada. Link manual não prova envio e não conta como enviado.', [{ label: 'Ver capacidade efetiva', fn: function () { GO('OPS15.A'); } }]) : null,
        active ? P.btns([ch.estado === 'ativo' ? { label: 'Pausar canal', cls: 'btn--outline btn--sm mod-danger', fn: dec.open('pausar') } : { label: 'Retomar canal', cls: 'btn--primary btn--sm', fn: dec.open('retomar') }]) : null
      ] }));
      if (active) {
        var pct = ch.lim ? ch.usado / ch.lim * 100 : 0;
        var limN = parseInt(String(ui.lim || '').replace(/\D/g, ''), 10) || 0;
        var limErr = ui.lim && !(limN > 0) ? 'Use só números, por exemplo 6000.' : (limN > ch.lim * 3 ? 'Mais que o triplo do atual precisa de caso com Produto, não de proposta direta.' : '');
        side.push(O4.card({ title: 'Limites', sub: ch.porPessoa, parts: [
          P.bars([['Consumo hoje · ' + num(ch.usado) + ' de ' + num(ch.lim), pct, 'Fonte: ' + ch.forn + ' · 26/10 14:02']]),
          ch.limProp ? P.alert('info', 'Proposta em aprovação', 'Novo limite de ' + num(ch.limProp) + ' por dia aguarda Produto. Até lá vale ' + num(ch.lim) + '.') : null,
          P.field({ id: 'o4-lim', label: 'Novo limite diário', value: ui.lim || '', mode: 'numeric', ph: num(ch.lim), err: limErr, help: 'A mudança vira proposta com recibo; não vale na hora.', set: function (e) { ctx.setUi({ lim: U.val(e) }); } }),
          P.btns([{ label: 'Propor novo limite', cls: 'btn--outline btn--sm', dis: !(limN > 0) || !!limErr, fn: dec.open('limite') }])
        ] }));
        side.push(O4.card({ title: 'Modelos', sub: U.plural(modelos.length, 'modelo aprovado', 'modelos aprovados') + ' neste canal', parts: [P.links(modelos.map(function (m) { return [m.name, m.key + ' · v' + m.v + (m.prop ? ' · proposta v' + m.prop : ''), 'file', function () { GO('OPS15.B', { id: m.id }); }]; }))] }));
        var testParts = [
          P.seg('Modelo', modelos.map(function (m) { return [m.name, mSel && m.id === mSel.id, function () { ctx.setUi({ tm: m.id }); }]; })),
          P.kv([['Destino', 'Caixa de teste da operação'], ['Conta no limite', 'não (teste)']]),
          mSel ? P.preview('Prévia · PT', render(mSel.txt.pt), 'Dados de exemplo. Nenhuma variável de treino, anamnese ou chat.') : null
        ];
        if (test) {
          testParts.push(P.steps(stepRows(test.steps)));
          if (test.estado === 'desconhecido') testParts.push(P.alert('clock', 'Resultado desconhecido', ui.q > 0 ? 'Consultado às ' + ui.qAt + ': o fornecedor ainda não confirmou a entrega. Você pode enviar de novo; a referência anterior fica registrada.' : 'O fornecedor aceitou, mas ainda não confirmou a entrega. Consulte antes de enviar outro teste.', [{ label: 'Consultar estado', fn: function () { if (scn === 'manual') { O4.consult(ctx, 'Continua desconhecido.')(); return; } test.estado = scn === 'falhou' ? 'falhou' : 'entregue'; test.steps[2] = ['Entregue', U.now(), scn === 'falhou' ? 'fail' : 'ok']; O4.consult(ctx, scn === 'falhou' ? 'O fornecedor confirmou a falha.' : 'Entrega confirmada pelo fornecedor.')(); } }]));
          if (test.estado === 'entregue') testParts.push(P.alert('ok', 'Entregue', 'Evidência do provedor: ' + ch.forn + ' confirmou às ' + test.steps[2][1] + '.'));
          if (test.estado === 'falhou') testParts.push(P.alert('risk', 'Falhou', 'Falha confirmada pelo fornecedor. Tente de novo ou use outro canal permitido.'));
        }
        testParts.push(P.btns([{ label: 'Enviar teste', cls: 'btn--primary btn--sm', ic: 'send', dis: !mSel || !!lastUnknown || ch.estado !== 'ativo', fn: function () {
          ctx.ask({ title: 'Enviar teste', text: 'Vai só para a caixa de teste da operação. Não é disparo para pessoas.', lines: ['Canal: ' + ch.name, 'Modelo: ' + mSel.name + ' · v' + mSel.v, 'Destino: caixa de teste da operação'], ok: 'Enviar teste', onOk: function () {
            var id = 'm_' + (77813 + DB.o4_envios.filter(function (x) { return x.teste; }).length);
            DB.o4_envios.unshift({ id: id, modelo: mSel.id, canal: ch.id, dest: 'caixa de teste', ctx: 'teste · ' + mSel.name, estado: 'desconhecido', teste: true, steps: [['Solicitado', U.now(), 'ok'], ['Aceito pelo fornecedor', U.now(), 'ok'], ['Entregue', 'sem retorno', 'unk']] });
            ctx.setUi({ test: id, q: 0 }); ctx.toast('Teste ' + id + ' solicitado. Consulte o resultado antes de repetir.');
          } });
        } }]));
        if (lastUnknown) testParts.push(P.note('Consulte o resultado do teste anterior antes de enviar outro.', true));
        side.push(O4.card({ title: 'Envio de teste', parts: testParts }));
        side.push(O4.card({ title: 'Descadastro', parts: [
          P.kv([['Como a pessoa sai', ch.saida], ['Continua chegando', ch.segue], ['Descadastros · 7 dias', String(ch.descad)]]),
          P.note('Fonte: ' + ch.descadFonte + '. Descadastro vale na hora e não depende da operação.', true)
        ] }));
      }
      return O4.view(ctx, { title: 'Canais', sub: 'E-mail, push e WhatsApp: modelos, envio de teste, limites e descadastro', comp: 'OPS15', alerts: alerts, main: main, side: side, md: { picked: pk.picked, label: 'Todos os canais' }, dec: dec });
    }
  });

  /* ===================== OPS15.A · capacidade efetiva ===================== */
  REG.screen({
    page: 'operacao', key: 'ops15a', id: 'OPS15.A', title: 'Canais', mtitle: 'Capacidade efetiva', nav: 'governanca', back: 'OPS15', wide: true,
    normal: 'WhatsApp não habilitado',
    scens: [['expirada', 'Permissão expirada'], ['restrito', 'Restrito'], ['indisp', 'Indisponível'], ['naoadot', 'Automação não adotada']],
    vals: function (ctx) {
      var scn = ctx.scn, P = O4.P;
      var list = DB.o4_canais.map(function (c) { return Object.assign({}, c); });
      if (scn === 'expirada') { list[1].aut = 'expirada'; list[1].pront = 'bloqueado'; list[1].prox = 'Plataforma · renovar credencial'; }
      var pk = O4.pick(ctx, list), ch = pk.it;
      var readOnly = scn === 'restrito';
      var dec = O4.dec(ctx, 'canais', {
        pendencia: { title: 'Abrir pendência · ' + ch.name, acao: 'Pendência aberta', alvo: ch.name + ' · ' + ch.pront, ok: 'Abrir pendência', estado: 'pendência aberta',
          impact: ['Responsável: ' + (ch.prox === '—' ? 'Plataforma' : ch.prox) + '.', 'Nada muda no canal até a pendência ser resolvida.', 'Nenhuma conta paga é conectada e nenhuma automação é reativada por aqui.'] },
        revisao: { title: 'Solicitar revisão de configuração', acao: 'Revisão de configuração solicitada', alvo: ch.name, ok: 'Solicitar revisão', estado: 'aguardando revisão',
          impact: ['Quem tem canais.configurar revisa fornecedor, finalidade e limites de ' + ch.name + '.', 'A configuração atual segue valendo até a revisão.'] }
      });
      var alerts = [];
      if (scn === 'expirada') alerts.push(P.alert('risk', 'Permissão expirada', 'A credencial do fornecedor-p venceu em 25/10. Push não sai até a renovação. Abra pendência para Plataforma.', [{ label: 'Abrir pendência', fn: function () { ctx.setUi({ sel: 'push' }); dec.open('pendencia')(); } }]));
      if (scn === 'restrito') alerts.push(P.alert('warn', 'Restrito', 'Sua capacidade é canais.ler: você vê o estado, mas não pede mudanças. Peça a quem tem canais.configurar.'));
      if (scn === 'indisp') alerts.push(P.alert('risk', 'Indisponível', 'Não foi possível ler os fornecedores às 14:02. Os valores abaixo são da última leitura, às 13:40.', [{ label: 'Consultar de novo', fn: O4.consult(ctx, 'Fornecedores ainda não responderam; valores das 13:40 mantidos.') }]));
      if (scn === 'naoadot') alerts.push(P.alert('info', 'Automação não adotada', 'Reenvio automático e cadência de lembretes não estão ligados. Mensagens só saem por regra aprovada; não reative por aqui.'));
      var rows = list.map(function (c) { return { cells: [c.name, c.forn, c.amb, c.fin, c.aut, [c.pront, tone(c.pront)]], title: c.name, meta: 'Próximo: ' + c.prox, badge: c.pront, tone: tone(c.pront), go: pk.sel(c.id), on: c.id === ch.id }; });
      return O4.view(ctx, {
        title: 'Canais', sub: 'Capacidade efetiva', cap: 'canais.ler', alvo: 'E-mail · push · WhatsApp', ts: scn === 'indisp' ? '26/10 · 13:40 BRT' : O4.TS,
        acts: [{ label: 'Abrir pendência', cls: 'btn--outline btn--sm', dis: readOnly, fn: dec.open('pendencia') }, { label: 'Solicitar revisão', cls: 'btn--primary btn--sm', dis: readOnly, fn: dec.open('revisao') }],
        alerts: alerts, dec: dec, md: { picked: pk.picked, label: 'Todos os canais' },
        main: [O4.card({ title: 'Integrações permitidas', parts: [P.table(['Canal', 'Fornecedor', 'Ambiente', 'Finalidade', 'Autorização', 'Prontidão'], rows), P.alert('info', 'Condicional', 'WhatsApp só entra com capacidade aprovada. O toggle desenhado não habilita nada.')] })],
        side: [O4.card({ title: ch.name, tag: ch.pront, tone: tone(ch.pront), parts: [
          P.kv([['Prontidão', ch.pront, tone(ch.pront)], ['Próximo responsável', ch.prox], ['Fornecedor', ch.forn], ['Ambiente', ch.amb], ['Finalidade', ch.fin], ['Autorização', ch.aut], ['Limite', ch.lim ? num(ch.lim) + ' por dia' : '—']]),
          P.note('Sem senhas, chaves ou segredos nesta tela.', true)
        ] }), O4.rcCard('canais')]
      });
    }
  });

  /* ===================== OPS15.B · template ===================== */
  var FORBIDDEN = ['{peso}', '{anamnese}', '{mensagem}', '{dor}', '{diagnostico}', '{resposta_ia}', '{cartao}'];
  REG.screen({
    page: 'operacao', key: 'ops15b', id: 'OPS15.B', title: 'Template', mtitle: 'Template', nav: 'governanca', back: 'OPS15', wide: true,
    testIds: ['lembrete', 'recibo'],
    normal: 'Revisão de texto',
    scens: [['proibida', 'Variável proibida'], ['semconsent', 'Consentimento ausente'], ['desatual', 'Texto desatualizado'], ['rejeitado', 'Template rejeitado']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn, P = O4.P;
      var m = DB.find('o4_modelos', ctx.id) || DB.o4_modelos[0];
      var lang = ui.lang || 'pt';
      var txt = Object.assign({}, m.txt, ui.txt || {});
      if (scn === 'proibida' && !(ui.txt && ui.txt.pt != null)) txt.pt = m.txt.pt + ' Seu peso atual: {peso}.';
      var cur = txt[lang];
      var used = (cur.match(/\{[^}]+\}/g) || []);
      var bad = used.filter(function (x) { return m.vars.indexOf(x) < 0; });
      var health = used.filter(function (x) { return FORBIDDEN.indexOf(x) >= 0; });
      var changed = ['pt', 'en', 'es'].filter(function (l) { return txt[l] !== m.txt[l]; });
      var blocked = scn === 'semconsent' || bad.length > 0 || !cur.trim();
      var setTxt = function (e) { var o = Object.assign({}, ui.txt || {}); o[lang] = U.val(e); ctx.setUi({ txt: o }); };
      var aud = DB.alunos.filter(function (a) { return a.status === (m.aud === 'convite' ? 'convite' : 'ativo'); }).length;
      var dec = O4.dec(ctx, 'canais', {
        salvar: { title: 'Salvar proposta v' + (m.v + 1), acao: 'Proposta de template salva', alvo: m.key + ' · v' + (m.v + 1), ok: 'Salvar proposta', estado: 'aguardando aprovação',
          impact: ['Cria a proposta v' + (m.v + 1) + ' (' + (changed.length ? changed.join(', ').toUpperCase() : 'sem mudança de texto') + '); a v' + m.v + ' continua em uso até a aprovação.', 'Nada é enviado agora: não existe disparo em massa nesta tela.', 'Aprovação pertinente: Jurídico (texto) e Produto (finalidade).'],
          apply: function () { m.prop = m.v + 1; m.status = 'proposta v' + (m.v + 1) + ' em aprovação'; } }
      });
      var alerts = [];
      if (bad.length) alerts.push(P.alert('risk', 'Variável proibida', bad.join(', ') + (health.length ? ' é dado de saúde ou conversa e nunca entra em mensagem externa.' : ' não está na lista permitida.') + ' Remova antes de salvar.'));
      if (scn === 'semconsent') alerts.push(P.alert('risk', 'Consentimento ausente', 'Este público não tem a base “' + m.base + '” registrada. Salvar fica bloqueado até Produto confirmar a base.'));
      if (scn === 'desatual') alerts.push(P.alert('warn', 'Texto desatualizado', 'EN e ES ainda são da v' + (m.v - 1) + '; o PT mudou na v' + m.v + '. Revise as traduções antes de encaminhar.'));
      if (scn === 'rejeitado') alerts.push(P.alert('risk', 'Template rejeitado', 'O fornecedor recusou a v' + m.v + ' em 25/10: “link encurtado não permitido”. Ajuste o texto e salve uma nova proposta.'));
      if (m.prop) alerts.push(P.alert('info', 'Proposta em aprovação', 'A v' + m.prop + ' aguarda Jurídico e Produto. A v' + m.v + ' segue em uso.'));
      var langs = [['PT', 'pt'], ['EN', 'en'], ['ES', 'es']];
      return O4.view(ctx, {
        title: 'Template · ' + m.name.toLowerCase(), sub: m.key + ' · v' + m.v, cap: 'canais.propor', alvo: 'Template ' + (m.canal === 'push' ? 'push' : 'e-mail'),
        acts: [{ label: ui.pv ? 'Fechar prévia' : 'Pré-visualizar', cls: 'btn--outline btn--sm', ic: 'eye', fn: function () { ctx.setUi({ pv: !ui.pv }); } }, { label: 'Salvar proposta', cls: 'btn--primary btn--sm', dis: blocked, fn: dec.open('salvar') }],
        alerts: alerts, dec: dec,
        main: [O4.card({ title: 'Texto', parts: [
          P.seg('Idioma', langs.map(function (l) { return [l[0] + (scn === 'desatual' && l[1] !== 'pt' ? ' · v' + (m.v - 1) : ''), lang === l[1], function () { ctx.setUi({ lang: l[1] }); }]; })),
          P.field({ id: 'o4-tpl', label: 'Texto · ' + lang.toUpperCase(), area: true, value: cur, set: setTxt, err: !cur.trim() ? 'O texto não pode ficar vazio.' : '', help: 'Variáveis permitidas: ' + m.vars.join(' ') }),
          P.kv([['Finalidade', m.fin], ['Base', m.base], ['Variáveis permitidas', m.vars.join(' ')], ['Estado', m.status]])
        ] }),
        ui.pv ? O4.card({ title: 'Pré-visualização', sub: 'Texto completo com dados de exemplo', parts: [P.preview(m.canal === 'push' ? 'Push · ' + lang.toUpperCase() : 'E-mail · ' + lang.toUpperCase(), render(cur), 'Exemplo: Rafael Lima, 01/11. Nenhum dado real.')] }) : null],
        side: [O4.card({ title: 'Prévia externa sem saúde', parts: [
          P.preview(lang.toUpperCase(), render(cur)),
          P.alert('ok', 'Prévia externa sem saúde', 'Nenhuma variável de treino, anamnese ou chat.')
        ] }), O4.card({ title: 'Quem poderia receber', parts: [
          P.kv([['Público', m.aud === 'convite' ? 'Convidados com convite a vencer em 7 dias' : 'Alunos com acompanhamento ativo'], ['Hoje', U.plural(aud, 'pessoa', 'pessoas')]]),
          P.note('Fonte: base de ' + (m.aud === 'convite' ? 'convites' : 'contratações') + ' · 26/10 14:02. Esta tela não dispara nada.', true)
        ] }), O4.rcCard('canais')]
      });
    }
  });

  /* ===================== OPS15.C · entrega e falha ===================== */
  REG.screen({
    page: 'operacao', key: 'ops15c', id: 'OPS15.C', title: 'Entrega da mensagem', mtitle: 'Entrega', nav: 'governanca', back: 'OPS15', wide: true,
    testIds: ['m_77790', 'm_77801'],
    normal: 'Entrega desconhecida',
    scens: [['429', '429'], ['recusado', 'Recusado'], ['expirado', 'Expirado'], ['revogado', 'Revogação'], ['transito', 'Já em trânsito']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn, P = O4.P;
      var e = DB.find('o4_envios', ctx.id) || DB.find('o4_envios', 'm_77812');
      var steps = e.steps.map(function (s) { return s.slice(); });
      var estado = e.estado;
      if (scn === '429') { steps[1] = ['Aceito pelo fornecedor', 'adiado', 'wait']; estado = 'adiado'; }
      if (scn === 'recusado') { steps[2] = ['Entregue', '09:01', 'fail']; estado = 'falhou'; }
      if (scn === 'expirado') { steps[2] = ['Entregue', 'expirou 09:30', 'fail']; estado = 'expirado'; }
      if (scn === 'revogado' || scn === 'transito') estado = scn;
      var checked = ui.q > 0;
      var canRetry = checked && estado === 'falhou' && !ui.retried;
      var dec = O4.dec(ctx, 'canais', {
        caso: { title: 'Abrir caso · ' + e.id, acao: 'Caso aberto sobre a entrega', alvo: e.id + ' · ' + e.ctx, ok: 'Abrir caso', estado: 'caso aberto',
          impact: ['O caso vai para a mesa de Casos com a referência ' + e.id + ', sem o conteúdo da mensagem.', 'Nenhum reenvio acontece por abrir o caso.'] },
        reenviar: { title: 'Tentar novamente · ' + e.id, acao: 'Reenvio da mesma solicitação', alvo: e.id, ok: 'Tentar novamente', estado: 'solicitado',
          impact: ['Falha confirmada pelo fornecedor na consulta das ' + (ui.qAt || '—') + '.', 'O reenvio usa a mesma referência ' + e.id + '; a política permite 1 nova tentativa.', 'Se voltar a falhar, abra caso; não tente de novo.'],
          apply: function () { return { retried: true }; } }
      });
      var alerts = [];
      if (scn === '429') alerts.push(P.alert('clock', '429 · fornecedor limitou', 'O fornecedor pediu para esperar. A mensagem está na fila dele, com nova tentativa automática às 14:10. Não reenvie.'));
      if (scn === 'recusado') alerts.push(P.alert('risk', 'Recusado', 'O destino recusou (caixa cheia). Consulte para confirmar a falha; depois disso a política permite uma nova tentativa.'));
      if (scn === 'expirado') alerts.push(P.alert('warn', 'Expirado', 'O convite venceu antes da entrega. Reenviar não resolve: peça ao treinador um convite novo.'));
      if (scn === 'revogado') alerts.push(P.alert('risk', 'Revogação', 'A pessoa se descadastrou às 10:12. Não reenvie: o descadastro vale para todos os envios não essenciais.'));
      if (scn === 'transito') alerts.push(P.alert('info', 'Mensagem já em trânsito', 'Já foi aceita pelo fornecedor. Não é possível recolher a mensagem nem garantir o cancelamento.'));
      var stAlert;
      if (estado === 'desconhecido') stAlert = P.alert('warn', 'Não reenvie às cegas', checked ? 'Consultado às ' + ui.qAt + ': continua sem retorno do fornecedor. Aguarde ou abra caso; reenviar pode duplicar.' : 'Confira esta mesma referência. Reenvio só se a política permitir e a anterior estiver confirmada como falha.');
      else if (estado === 'entregue') stAlert = P.alert('ok', 'Entregue', 'Evidência do provedor: ' + (e.evid || 'recibo do fornecedor') + '.');
      else if (estado === 'falhou') stAlert = P.alert('risk', 'Falhou', (e.motivoFalha ? 'Motivo: ' + e.motivoFalha + '. ' : '') + (checked ? 'Falha confirmada às ' + ui.qAt + '.' : 'Consulte para confirmar a falha antes de tentar de novo.'));
      return O4.view(ctx, {
        title: 'Entrega da mensagem', sub: e.id + ' · ' + e.ctx, cap: 'canais.ler', alvo: 'Destinatário ' + e.dest,
        acts: [{ label: 'Abrir caso', cls: 'btn--outline btn--sm', fn: dec.open('caso') }],
        alerts: alerts, dec: dec,
        main: [O4.card({ title: 'Linha do tempo', sub: 'Solicitado não é entregue', parts: [
          P.steps(stepRows(steps)),
          stAlert,
          P.btns([
            { label: 'Consultar estado', cls: 'btn--primary btn--sm', ic: 'refresh', fn: O4.consult(ctx, estado === 'falhou' ? 'Falha confirmada pelo fornecedor.' : (estado === 'entregue' ? 'Entrega confirmada.' : 'Sem retorno novo do fornecedor.')) },
            { label: 'Tentar novamente', cls: 'btn--outline btn--sm', dis: !canRetry, fn: dec.open('reenviar') }
          ]),
          !canRetry && estado !== 'entregue' ? P.note(ui.retried ? 'Nova tentativa já solicitada para esta referência.' : (estado === 'falhou' ? 'Tentar novamente libera depois de consultar e confirmar a falha.' : 'Tentar novamente só existe para falha confirmada.'), true) : null
        ] })],
        side: [O4.card({ title: 'Referência', parts: [
          P.kv([['Referência', e.id], ['Contexto', e.ctx], ['Canal', (DB.find('o4_canais', e.canal) || {}).name || e.canal], ['Destinatário', e.dest], ['Conteúdo', 'não exibido']]),
          P.note('Link de WhatsApp manual não prova envio. Mensagem entregue não pode ser recolhida.', true)
        ] }), O4.rcCard('canais')]
      });
    }
  });
})();
