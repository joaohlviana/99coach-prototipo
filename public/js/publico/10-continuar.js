/* PUB08 · Continuar busca e editar contexto: resumo (modalidade, local, atendimento, idioma) com Continuar, Alterar e Limpar */
REG.screen({
  page: 'publico', key: 'continuar', id: 'PUB08', title: 'Continuar busca', nav: 'explorar', back: 'H01', form: true,
  normal: 'Contexto ativo',
  scens: [['expirado', 'Contexto expirado'], ['aparelhos', 'Conflito entre aparelhos'], ['contextos', 'Conflito entre contextos'], ['limpo', 'Limpo'], ['indisp', 'Offline ou consulta indisponível']],
  vals: function (ctx) {
    var P = window.P1, ui = ctx.ui, scn = ctx.scn, b = DB.p1_busca;
    var cleared = scn === 'limpo' || !b.active;
    var editing = ui.edit !== undefined ? !!ui.edit : (ctx.p.edit === '1' && !cleared);
    var d = ui.draft || { sport: b.sport, city: b.city, mode: b.mode, lang: b.lang };
    var setD = function (o) { ctx.setUi({ draft: Object.assign({}, d, o), edit: true, err: '' }); };
    var opts = function (list, cur, key) { return list.map(function (x) { var on = cur === x; return { label: x, cls: 'chip p1-chip' + (on ? ' is-on' : ''), on: String(on), pick: function () { var o = {}; o[key] = x; setD(o); } }; }); };
    var cityErr = ui.err === 'city';
    var favN = DB.p1_salvos.length;
    var offline = scn === 'indisp';
    return {
      cleared: cleared, active: !cleared, editing: editing && !cleared, viewing: !editing && !cleared,
      expirado: scn === 'expirado', aparelhos: scn === 'aparelhos', contextos: scn === 'contextos', offline: offline, canGo: !offline,
      savedAt: 'Salvo em ' + b.at + ' ' + b.where,
      rows: [['Modalidade', b.sport], ['Local', b.city], ['Atendimento', b.mode], ['Idioma do atendimento', b.lang]].map(function (r) { return { k: r[0], v: r[1] }; }),
      continuar: function () { ctx.go('@esporte', {}); },
      alterar: function () { ctx.setUi({ edit: true, draft: { sport: b.sport, city: b.city, mode: b.mode, lang: b.lang } }); },
      limpar: function () {
        ctx.ask({ title: 'Limpar esta busca?', lines: ['Apaga: modalidade, local, atendimento e idioma salvos neste aparelho.', 'Mantém: seus favoritos (' + U.plural(favN, 'item', 'itens') + ') e seus acompanhamentos.'], ok: 'Limpar busca', danger: true,
          onOk: function () { DB.p1_busca.active = false; ctx.setUi({ edit: false }); } });
      },
      sports: opts(['CrossFit', 'Musculação', 'Corrida', 'Funcional', 'Yoga e Pilates', 'Lutas'], d.sport, 'sport'),
      modes: ['Presencial', 'Online', 'Tanto faz'].map(function (m) { var on = d.mode === m; return { label: m, cls: 'seg__it' + (on ? ' is-on' : ''), on: String(on), pick: function () { setD({ mode: m }); } }; }),
      langs: opts(['Português', 'Espanhol', 'Inglês'], d.lang, 'lang'),
      dCity: d.city || '', setCity: function (e) { setD({ city: U.val(e) }); },
      cityCls: 'input' + (cityErr ? ' is-err' : ''), cityErr: cityErr, cityInvalid: String(cityErr),
      escolherLocal: function () { ctx.go('PUB16'); },
      salvar: function () {
        if (!String(d.city || '').trim()) { ctx.setUi({ err: 'city' }); return; }
        Object.assign(DB.p1_busca, { active: true, sport: d.sport, city: String(d.city).trim(), mode: d.mode, lang: d.lang, at: U.todayShort });
        ctx.setUi({ edit: false, draft: null }); ctx.toast('Busca atualizada. Os resultados são consultados de novo ao continuar.');
      },
      cancelar: function () { ctx.setUi({ edit: false, draft: null, err: '' }); },
      // estados
      consultar: function () { ctx.scenario(''); ctx.toast('Condições consultadas agora, às ' + U.now()); },
      dev: [
        { where: 'Neste aparelho', at: b.at, line: P.buscaLine(b), pick: function () { ctx.scenario(''); ctx.toast('Mantida a busca deste aparelho'); } },
        { where: 'No celular', at: '25/10', line: 'CrossFit · Londrina · Online', pick: function () { Object.assign(DB.p1_busca, { mode: 'Online', at: '25/10' }); ctx.scenario(''); ctx.toast('Usando a busca do celular'); } }
      ],
      keepPt: function () { ctx.scenario(''); ctx.toast('Atendimento em português mantido'); },
      useEs: function () { DB.p1_busca.lang = 'Espanhol'; ctx.scenario(''); ctx.toast('Atendimento em espanhol'); },
      favLine: 'Seus favoritos foram mantidos (' + U.plural(favN, 'item', 'itens') + ').',
      novaBusca: function () { ctx.go('H01'); }, verFavoritos: function () { ctx.go('PUB07'); },
      voltar: function () { ctx.go('H01'); }
    };
  }
});
