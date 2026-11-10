/* H01 · Descoberta que continua (hub público): continuar busca, buscar por modalidade e cidade, vistos recentemente e programas online */
REG.screen({
  page: 'publico', key: 'explorar', id: 'H01', also: ['PUB01'], title: 'Explorar', nav: 'explorar', home: true, wide: true,
  normal: 'Visitante que volta',
  scens: [['primeiro', 'Primeiro uso'], ['ausencia', 'Ausência confirmada'], ['parcial', 'Indisponibilidade parcial'], ['aluno', 'Com acompanhamento ativo']],
  vals: function (ctx) {
    var P = window.P1, ui = ctx.ui, scn = ctx.scn, b = DB.p1_busca;
    var first = scn === 'primeiro' || !b.active;
    var modeQ = ui.mode || b.mode || 'Presencial';
    var sportQ = ui.sport !== undefined ? ui.sport : (first ? '' : b.sport);
    var cityQ = ui.city !== undefined ? ui.city : (first ? '' : b.city);
    var search = function () {
      var sp = String(sportQ || '').trim(), ci = String(cityQ || '').trim();
      if (!sp || !ci) { ctx.setUi({ err: !sp ? 'sport' : 'city' }); return; }
      Object.assign(DB.p1_busca, { active: true, sport: sp, city: ci, mode: modeQ, at: U.todayShort });
      ctx.go('@esporte', {});
    };
    var heartOf = function (kind, ref) {
      var h = P.heart(P.isSaved(kind, ref));
      h.toggle = function () { var on = P.toggleSave(kind, ref); ctx.toast(on ? 'Salvo nos favoritos' : 'Removido dos favoritos'); };
      return h;
    };
    var card = function (id, whyOverride) {
      var t = P.tr(id), a = P.av(t), h = heartOf('treinador', id);
      return { id: id, name: t.name, line: t.spec + ' · ' + t.area + ' · ' + t.modes, why: whyOverride || t.why, hasWhy: !parcial, price: t.from === 'preço sob consulta' ? t.from : 'a partir de ' + t.from,
        photo: a.photo, hasPhoto: a.hasPhoto, noPhoto: a.noPhoto, ini: a.ini, hasRating: !!t.avg, rating: t.avg, nRev: '(' + t.n + ')',
        open: function () { P.openTrainer(id); }, heartCls: h.cls, heartLabel: h.label + ': ' + t.name, heartPressed: h.pressed, toggle: h.toggle };
    };
    var parcial = scn === 'parcial', ausencia = scn === 'ausencia';
    var cards = ausencia ? [card('rafael', 'Atende online · mesmo idioma'), card('carolina', 'Atende online · mesmo idioma')]
      : first ? [card('rafael', 'Exemplo perto de Londrina'), card('gabriel', 'Exemplo perto de Londrina')]
      : ['rafael', 'gabriel', 'carolina', 'thiago'].map(function (id) { return card(id); });
    var vistos = (first ? [] : DB.p1_vistos).map(function (v) {
      var isT = v.kind === 'treinador', t = isT ? P.tr(v.ref) : null, pr = isT ? null : P.prog(v.ref), a = isT ? P.av(t) : { photo: '', hasPhoto: false, noPhoto: true, ini: '' };
      return { title: isT ? t.name : pr.name, sub: (isT ? t.spec + ' · ' + t.area : 'Programa · ' + pr.weeks + ' semanas · ' + U.money(pr.price)) + ' · visto ' + v.at,
        isT: isT, isP: !isT, photo: a.photo, hasPhoto: a.hasPhoto, noPhoto: isT && a.noPhoto, ini: a.ini,
        open: function () { if (isT) P.openTrainer(v.ref); else ctx.go('PUB06', { id: v.ref }); } };
    });
    var progs = DB.p1_programas.map(function (p) {
      var t = P.tr(p.author), h = heartOf('programa', p.id);
      return { name: p.name, meta: t.name + ' · ' + p.weeks + ' semanas · ' + p.sessions + ' sessões', price: U.money(p.price) + ' · pagamento único', note: 'Acompanhamento individual não incluído',
        open: function () { ctx.go('PUB06', { id: p.id }); }, heartCls: h.cls, heartLabel: h.label + ': ' + p.name, heartPressed: h.pressed, toggle: h.toggle };
    });
    var other = ['Corrida', 'Yoga e Pilates', 'Funcional', 'Lutas', 'Online'].map(function (s) {
      return { label: s, go: function () { if (s === 'Online') Object.assign(DB.p1_busca, { active: true, mode: 'Online', at: U.todayShort }); else Object.assign(DB.p1_busca, { active: true, sport: s, at: U.todayShort }); ctx.go('@esporte', {}); } };
    });
    var modes = ['Presencial', 'Online'].map(function (m) { var on = modeQ === m; return { label: m, cls: 'seg__it' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ mode: m }); } }; });
    var errSport = ui.err === 'sport', errCity = ui.err === 'city';
    var savedN = DB.p1_salvos.length;
    return {
      first: first, notFirst: !first, ausencia: ausencia, parcial: parcial, aluno: scn === 'aluno', showVistos: !first && !ausencia && vistos.length > 0,
      heroEyebrow: 'Continue de onde parou', heroTitle: ausencia ? 'Yoga · Cambé · Presencial' : P.buscaLine(b),
      heroSub: 'Sua última escolha, feita por você em ' + b.at + ' · mudar o idioma não muda o local',
      ausTitle: 'Ninguém atende presencial em Cambé ainda', ausText: 'Confirmado em 26/10 às ' + U.now() + ' · 2 treinadores atendem online no mesmo idioma.',
      parTitle: 'Sugestões indisponíveis agora', parText: 'A busca funciona normalmente; só a explicação personalizada saiu do ar.',
      retry: function () { ctx.scenario(''); ctx.toast('Sugestões carregadas de novo'); },
      verOnline: function () { Object.assign(DB.p1_busca, { active: true, sport: 'Yoga e Pilates', city: 'Cambé, PR', mode: 'Online', at: U.todayShort }); ctx.go('@esporte', {}); },
      alterar: function () { ctx.go('PUB08', { edit: '1' }); },
      limpar: function () {
        ctx.ask({ title: 'Limpar esta busca?', lines: ['Apaga modalidade, local, atendimento e idioma salvos neste aparelho.', 'Seus favoritos serão mantidos (' + U.plural(savedN, 'item', 'itens') + ').'], ok: 'Limpar busca', danger: true,
          onOk: function () { DB.p1_busca.active = false; ctx.toast('Busca limpa. Favoritos mantidos.'); } });
      },
      continuar: function () { ctx.go('@esporte', {}); },
      sport: sportQ || '', city: cityQ || '', setSport: function (e) { ctx.setUi({ sport: U.val(e), err: '' }); }, setCity: function (e) { ctx.setUi({ city: U.val(e), err: '' }); },
      onKey: function (e) { if (e && e.key === 'Enter') { if (e.preventDefault) e.preventDefault(); search(); } },
      sportCls: 'input' + (errSport ? ' is-err' : ''), cityCls: 'input' + (errCity ? ' is-err' : ''), errSport: errSport, errCity: errCity,
      sportInvalid: String(errSport), cityInvalid: String(errCity),
      perto: function () { ctx.go('PUB16'); },
      modes: modes, search: search,
      searchTitle: first ? 'Encontre seu treinador' : 'Buscar outra coisa', searchSub: 'Modalidade, local e como prefere treinar.',
      acomp: { name: 'Rafael Lima', photo: U.img('bdc7ef1c8dbf05558c3bf8d575fc3a04'), line: 'treino de hoje publicado · próximo treino qua 28/10' },
      abrirAcomp: function () { ctx.go('ALU01'); },
      listTitle: ausencia ? 'Atendem online no mesmo idioma' : (first ? 'Exemplos perto de Londrina' : 'Treinadores para a sua busca'),
      listSub: first ? 'Perfis públicos de Londrina · escolha modalidade e local para ver os seus' : 'ordenados por proximidade e disponibilidade',
      hasWhyLink: !first && !parcial, porque: function () { ctx.go('PUB09'); },
      savedLabel: 'Salvos (' + savedN + ')', goSalvos: function () { ctx.go('PUB07'); },
      cards: cards, vistos: vistos,
      limparVistos: function () { DB.p1_vistos = []; ctx.toast('Vistos recentemente apagados. Favoritos mantidos.'); },
      progs: progs, verProgramas: function () { ctx.go('PUB15'); },
      other: other, souTreinador: function () { ctx.go('ACC05'); }
    };
  }
});
