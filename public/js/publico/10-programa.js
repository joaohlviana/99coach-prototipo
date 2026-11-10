/* PUB06 · Detalhe público de programa: conteúdo e versão, duração, vigência do acesso, prévia autorizada e revisão de compra */
REG.screen({
  page: 'publico', key: 'programa', id: 'PUB06', title: 'Programa', nav: 'programas', back: 'H01', wide: true,
  testIds: ['p1', 'p3'],
  normal: 'À venda',
  scens: [['adquirido', 'Já adquirido'], ['retirado', 'Programa retirado'], ['prevenda', 'Pré-venda'], ['previa', 'Prévia indisponível'], ['alterada', 'Oferta alterada']],
  vals: function (ctx) {
    var P = window.P1, ui = ctx.ui, scn = ctx.scn, p = P.prog(ctx.id || 'p1'), t = P.tr(p.author), a = P.av(t);
    var adq = scn === 'adquirido', ret = scn === 'retirado', pre = scn === 'prevenda', prevFail = scn === 'previa', alt = scn === 'alterada' && !ui.reviewed;
    var opened = 0;
    var modules = p.modules.map(function (m, i) {
      var open = m[2] || adq; if (open) opened++;
      return { title: m[0], n: U.plural(m[1], 'sessão', 'sessões'), open: open, locked: !open, lock: 'liberado após a compra' };
    });
    var saved = P.isSaved('programa', p.id), h = P.heart(saved);
    var revisar = function () {
      if (alt) { ctx.setUi({ reviewed: true }); ctx.toast('Preço atualizado revisado: ' + U.money(p.price)); return; }
      if (p.offer) ctx.go('FC01', { offer: p.offer }); else ctx.go('FC01', { program: p.id });
    };
    var previewOn = !!ui.preview && !prevFail;
    return {
      name: p.name, meta: t.name + ' · ' + p.weeks + ' semanas · ' + p.level.toLowerCase() + ' · versão ' + p.version, updated: 'Versão ' + p.version + ' publicada em ' + p.updated,
      adq: adq, ret: ret, pre: pre, prevFail: prevFail, alt: alt, buyable: !adq && !ret, notAdq: !adq,
      badge: adq ? 'Já adquirido' : (ret ? 'Retirado do catálogo' : (pre ? 'Pré-venda' : 'À venda')),
      badgeCls: 'badge ' + (adq ? 'badge--ok' : (ret ? 'badge--warn' : (pre ? 'badge--info' : 'badge--plain'))),
      audience: p.audience, prereq: p.prereq, equip: p.equip, level: p.level,
      modules: modules, contentSub: U.plural(p.sessions, 'sessão', 'sessões') + ' em ' + p.modules.length + ' módulos · ' + (adq ? 'tudo liberado para você' : opened + ' de ' + p.modules.length + ' módulos com amostra aberta'),
      previewTitle: p.preview.title, previewItems: p.preview.items.map(function (x) { return { k: x[0], v: x[1] }; }), previewSrc: p.preview.src,
      previewOn: previewOn, previewOff: !previewOn && !prevFail, togglePreview: function () { ctx.setUi({ preview: !ui.preview }); },
      previewBtn: previewOn ? 'Fechar prévia' : 'Ver prévia', retryPreview: function () { ctx.scenario(''); ctx.toast('Prévia carregada'); },
      price: U.money(p.price), priceUnit: 'pagamento único',
      rows: [
        { k: 'Duração do programa', v: p.weeks + ' semanas · ' + p.sessions + ' sessões' },
        { k: 'Seu acesso', v: adq ? 'até 02/10/2027 (comprado em 02/10)' : '12 meses após a compra' },
        { k: 'Recorrência', v: 'Não renova · sem assinatura' },
        { k: 'Acompanhamento individual', v: 'Não incluído' }
      ],
      altText: 'O preço mudou de ' + U.money(p.price - 10) + ' para ' + U.money(p.price) + ' em 25/10. Revise antes de comprar; nada foi cobrado.',
      preText: 'Liberação em 16/11/2026, regra aprovada pela 99Coach. Se não for liberado até lá, o valor volta integralmente.',
      retText: 'Saiu do catálogo em 20/10. Quem comprou mantém o acesso conforme a licença; não é possível comprar agora.',
      ctaLabel: alt ? 'Revisar novo preço' : 'Revisar compra',
      revisar: revisar, continuar: function () { ctx.go('ALU06'); },
      saibaPorque: function () { ctx.go('PUB11'); }, condicoes: function () { ctx.go('PUB11'); },
      explorar: function () { ctx.go('PUB15'); },
      autor: { name: t.name, photo: a.photo, hasPhoto: a.hasPhoto, noPhoto: a.noPhoto, ini: a.ini, line: t.spec + ' · ' + t.city },
      conhecerAutor: function () { ctx.go('@perfil', { id: p.author }); },
      heartCls: h.cls, heartLabel: h.label, heartPressed: h.pressed,
      toggleSave: function () { var on = P.toggleSave('programa', p.id); ctx.toast(on ? 'Salvo nos favoritos' : 'Removido dos favoritos'); }
    };
  }
});
