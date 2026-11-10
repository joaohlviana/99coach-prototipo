/* H02 · Perfil que ajuda a decidir (versão do hub, Rafael Lima): como trabalha, ofertas, programas, avaliações e credenciais */
REG.screen({
  page: 'publico', key: 'perfilHub', id: 'H02', title: 'Perfil do treinador', mtitle: 'Perfil', nav: 'explorar', back: 'H01', wide: true,
  normal: 'Perfil completo',
  scens: [['importado', 'Primeiro uso · importado'], ['ausencia', 'Ausência confirmada'], ['parcial', 'Indisponibilidade parcial']],
  vals: function (ctx) {
    var P = window.P1, ui = ctx.ui, scn = ctx.scn, t = P.tr('rafael'), a = P.av(t);
    var imported = scn === 'importado', ausencia = scn === 'ausencia', parcial = scn === 'parcial';
    var TABS = [['como', 'Como trabalho'], ['ofertas', 'Ofertas'], ['programas', 'Programas'], ['avaliacoes', 'Avaliações'], ['credenciais', 'Credenciais']];
    var tab = ui.tab || '';
    var show = function (k) { return !tab || tab === k; };
    var tabs = TABS.map(function (x) { var on = tab === x[0]; return { label: x[1], cls: 'utab' + (on ? ' is-on' : ''), sel: String(on), pick: function () { ctx.setUi({ tab: on ? '' : x[0] }); } }; });
    var offers = [
      { key: 'online', title: 'Acompanhamento online', price: 'R$ 200 / mês', meta: 'Treino semanal no app · ajuste a cada 15 dias · sujeito a aceite' },
      { key: 'dois', title: 'Treino presencial 2x por semana', price: 'R$ 520 / mês', meta: '8 sessões por mês em Londrina · horários fixos' },
      { key: 'sessao', title: 'Sessão presencial', price: 'R$ 80 / sessão', meta: '60 min · Londrina · local combinado · não renova' },
      { key: 'avaliacao', title: 'Avaliação física', price: 'Sob consulta', meta: 'Valor combinado antes de marcar' }
    ].map(function (o) { return Object.assign(o, { go: function () { ctx.go('@servico', { offer: o.key }); } }); });
    var progs = DB.p1_programas.filter(function (p) { return !ausencia || p.id !== 'p3'; }).map(function (p) {
      return { name: p.name, price: U.money(p.price) + ' · ' + p.weeks + ' semanas', meta: 'Acesso por 12 meses · acompanhamento individual não incluído', go: function () { ctx.go('PUB06', { id: p.id }); } };
    });
    var rev = DB.p1_avaliacoes.filter(function (r) { return r.trainer === 'rafael' && r.status === 'publicada'; })[0];
    var saved = P.isSaved('treinador', 'rafael'), h = P.heart(saved);
    var solicitar = function () { ctx.go('REL05', { id: 'rafael', offer: 'online' }); };
    return {
      imported: imported, full: !imported, ausencia: ausencia, parcial: parcial, revOk: !parcial,
      name: t.name, photo: a.photo, line: 'CrossFit e Musculação · Centro e Zona Sul, Londrina · presencial e online · PT',
      mline: 'CrossFit e Musculação · Centro · PT',
      tabs: tabs, filtered: !!tab, verTudo: function () { ctx.setUi({ tab: '' }); },
      showComo: show('como'), showOfertas: show('ofertas'), showProgs: show('programas'), showAval: show('avaliacoes'), showCred: show('credenciais'),
      pitch: 'Treinos de força e condicionamento para quem quer começar no CrossFit ou voltar à musculação com segurança. Primeira semana para avaliar movimento e rotina; depois o treino chega toda semana no app, com ajuste a cada 15 dias.',
      how: [['Semana 1', 'Avaliação de movimento e da sua rotina'], ['Toda semana', 'Treino novo no app'], ['A cada 15 dias', 'Ajuste com base no que você registrou']].map(function (x) { return { k: x[0], v: x[1] }; }),
      creds: [
        { k: 'CREF 012345-G/PR', v: 'Verificado na fonte em 24/09/2026 · válido até 12/2027', ok: true, no: false },
        { k: 'Bacharel em Educação Física (UEL)', v: 'Declarada pelo treinador · não conferida', ok: false, no: true },
        { k: 'CrossFit Level 1 (CF-L1)', v: 'Declarada pelo treinador · não conferida', ok: false, no: true },
        { k: '@rafaellima.treino', v: 'Titularidade confirmada pelo direct em 24/09/2026', ok: true, no: false }
      ],
      avg: t.avg, nLine: t.n + ' avaliações de quem contratou · atualizado 26/10',
      quote: rev ? '“' + rev.text + '”' : '', quoteBy: rev ? '— ' + rev.author + ', ' + rev.when : '', hasQuote: !!rev,
      lerAval: function () { ctx.go('PUB10', { id: 'rafael' }); },
      retryAval: function () { ctx.scenario(''); ctx.toast('Avaliações carregadas'); },
      offers: offers, progs: progs, hasProgs: progs.length > 0,
      ausTitle: 'Programa retirado pelo treinador', ausText: 'Mobilidade 15 minutos saiu do catálogo em 20/10. Quem comprou mantém o acesso. Veja as ofertas ativas.',
      verOfertas: function () { ctx.setUi({ tab: 'ofertas' }); },
      solicitar: solicitar,
      mensagem: function () { ctx.ask({ title: 'Entre para enviar mensagem', text: 'Mensagem não é contratação: nada é cobrado. Para conversar com o Rafael, entre ou crie sua conta.', ok: 'Entrar', onOk: function () { ctx.go('ACC02'); } }); },
      heartCls: h.cls, heartLabel: h.label, heartPressed: h.pressed, heartText: saved ? 'Salvo' : 'Salvar',
      toggleSave: function () { var on = P.toggleSave('treinador', 'rafael'); ctx.toast(on ? 'Salvo nos favoritos' : 'Removido dos favoritos'); },
      instagram: function () { ctx.ask({ title: 'Abrir fora do 99Coach?', text: 'O Instagram @rafaellima.treino abre em outro site. Combinados fora do 99Coach não têm a proteção de pagamento da plataforma.', ok: 'Abrir Instagram', onOk: function () { ctx.toast('Demonstração: o link externo não abre no protótipo'); } }); },
      meuPerfil: function () { ctx.go('ACC08'); },
      corrigir: function () { ctx.go('PUB12', { id: 'rafael' }); },
      perfilCompleto: function () { ctx.go('@perfil', { id: 'rafael' }); },
      // importado (perfil não reivindicado, dados públicos)
      imp: { ini: 'SN', name: 'Studio Norte Treinamento', line: 'Treinamento funcional · Londrina', src: 'Dados públicos de fonte autorizada (Instagram @studionorte.treino, consultado em 18/10). Sem foto autorizada. Sem ofertas publicadas.' },
      pedirContato: function () { ctx.ask({ title: 'Pedir contato', text: 'Avisamos o Studio Norte que você quer conversar. Enquanto o perfil não for reivindicado, não há ofertas nem pagamento pelo 99Coach.', ok: 'Pedir contato', onOk: function () { ctx.toast('Pedido de contato registrado. Avisaremos por e-mail se o perfil for reivindicado.'); } }); }
    };
  }
});
