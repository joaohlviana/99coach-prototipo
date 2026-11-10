/* PUB09 · Explicação e controle de recomendações: por que aparece, corrigir contexto, mostrar outros, ocultar por agora, não tenho interesse e desfazer */
REG.screen({
  page: 'publico', key: 'explicacao', id: 'PUB09', title: 'Sugestões para você', mtitle: 'Sugestões', nav: 'explorar', back: 'H01', wide: true,
  normal: 'Sugestões com motivo',
  scens: [['ocultado', 'Ocultado'], ['semmais', 'Sem mais sugestões'], ['naosalvou', 'Não salvou a escolha'], ['motivo', 'Motivo indisponível'], ['salvando', 'Feedback salvando'], ['falha', 'Falha']],
  vals: function (ctx) {
    var P = window.P1, ui = ctx.ui, scn = ctx.scn, b = DB.p1_busca;
    var sug = DB.p1_sugestoes;
    // estado inicial de cada situação (sem gravar no DB até o usuário agir)
    var stateOf = function (s, i) { if (scn === 'ocultado' && i === 0 && !ui.undone) return 'oculto'; return s.state; };
    var setState = function (ref, st) { var it = sug.find(function (x) { return x.ref === ref; }); if (it) it.state = st; };
    var noMore = scn === 'semmais', failed = scn === 'falha';
    var visible = [];
    var items = (noMore || failed ? [] : sug).map(function (s, i) {
      var t = P.tr(s.ref), a = P.av(t), st = stateOf(s, i);
      if (st === 'ok') visible.push(s.ref);
      var saving = scn === 'salvando' && i === 1;
      return {
        ref: s.ref, name: t.name, price: t.from === 'preço sob consulta' ? t.from : 'a partir de ' + t.from, hasRating: !!t.avg, rating: t.avg,
        photo: a.photo, hasPhoto: a.hasPhoto, noPhoto: a.noPhoto, ini: a.ini, line: t.spec + ' · ' + t.area,
        shown: st === 'ok' && !saving, hidden: st === 'oculto', gone: st === 'semint', saving: saving,
        selCls: 'card p1-sug' + ((ui.sel || '') === s.ref ? ' is-sel' : ''),
        why: function () { ctx.setUi({ sel: s.ref }); },
        hide: function () { setState(s.ref, 'oculto'); ctx.setUi({ sel: '' }); },
        noInterest: function () { setState(s.ref, 'semint'); ctx.setUi({ sel: '' }); },
        undo: function () { setState(s.ref, 'ok'); ctx.setUi({ undone: ui.undone || i === 0 }); ctx.toast(t.name + ' voltou para as sugestões'); },
        open: function () { P.openTrainer(s.ref); },
        hiddenText: 'Ocultado por agora: ' + t.name + ' volta na sua próxima busca.',
        goneText: 'Não vamos mais sugerir ' + t.name + ' para esta busca. Você ainda encontra o perfil pela busca.'
      };
    });
    var selRef = ui.sel && visible.indexOf(ui.sel) >= 0 ? ui.sel : (visible[0] || '');
    var selT = selRef ? P.tr(selRef) : null;
    items.forEach(function (it) { it.selCls = 'card p1-sug' + (it.ref === selRef ? ' is-sel' : ''); it.selPressed = String(it.ref === selRef); });
    var motivoFail = scn === 'motivo';
    return {
      ctxLine: 'Baseadas na sua busca atual: ' + P.buscaLine(b) + ' · idioma ' + b.lang.toLowerCase(),
      items: items, failed: failed, noMore: noMore, notSaved: scn === 'naosalvou', saving: scn === 'salvando',
      hasSel: !!selT && !failed && !noMore, selName: selT ? selT.name : '', motivoFail: motivoFail, motivoOk: !motivoFail,
      reason: selT ? selT.reason : '',
      retry: function () { ctx.scenario(''); ctx.toast('Atualizado agora, às ' + U.now()); },
      retryChoice: function () { setState('gabriel', 'oculto'); ctx.scenario(''); ctx.toast('Escolha salva: Gabriel Santos ocultado por agora'); },
      corrigir: function () { ctx.go('PUB08', { edit: '1' }); },
      outros: function () { ctx.go('@esporte', {}); },
      limparPref: function () {
        ctx.ask({ title: 'Limpar preferências de sugestão?', lines: ['Apaga: itens ocultados por agora e marcados como “Não tenho interesse”.', 'Mantém: seus favoritos, sua busca salva e seus acompanhamentos.'], ok: 'Limpar preferências', danger: true,
          onOk: function () { DB.p1_sugestoes.forEach(function (x) { x.state = 'ok'; }); ctx.toast('Preferências limpas. Favoritos mantidos.'); } });
      }
    };
  }
});
