/* PUB13 · Vistos recentemente: lista deste aparelho (a mesma do Explorar, DB.p1_vistos), remover item, limpar, vazio e estados da política */
(function () {
  'use strict';
  // segurança: se a frente P1 não semeou, usa a mesma lista de exemplo
  if (!DB.p1_vistos) DB.seed('p1_vistos', [
    { id: 'v1', kind: 'treinador', ref: 'carolina', at: 'hoje, 09:40' },
    { id: 'v2', kind: 'programa', ref: 'p1', at: 'ontem' },
    { id: 'v3', kind: 'treinador', ref: 'gabriel', at: '24/10' }
  ]);

  function priceOf(from) {
    var m = /^(R\$\s?[\d.,]+)\s*(\/.*)?$/.exec(String(from || ''));
    if (m) return { pre: 'a partir de', price: m[1], unit: m[2] || '' };
    return { pre: '', price: from ? from.charAt(0).toUpperCase() + from.slice(1) : 'Preço não informado', unit: '' };
  }

  REG.screen({
    page: 'publico', key: 'vistos', id: 'PUB13', title: 'Vistos recentemente', mtitle: 'Recentes', nav: 'explorar', back: 'history',
    normal: 'Com itens',
    scens: [['desligado', 'Desligado'], ['limpo', 'Limpo'], ['vazio', 'Vazio'], ['vazioexp', 'Vazio · itens expiraram'], ['expirados', 'Itens expirados'], ['pendente', 'Limpeza pendente'], ['indisp', 'Consulta indisponível']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn, g = function (k, d) { return P2.g(ui, k, d); };
      var P = window.P1;
      var off = scn === 'desligado', indisp = scn === 'indisp';
      var source = (scn === 'limpo' || scn === 'vazio' || scn === 'vazioexp') && !g('touched', false) ? [] : DB.p1_vistos;
      var expired = scn === 'expirados' && !g('fixed', false) ? [{ id: 'vx', kind: 'treinador', ref: 'retirado', at: '19/10', expired: true }] : [];
      var all = off || indisp ? [] : source.concat(expired);

      var remove = function (v) {
        return function () {
          DB.p1_vistos = DB.p1_vistos.filter(function (x) { return x.id !== v.id; });
          if (v.expired) ctx.setUi({ fixed: true });
          ctx.toast('Removido dos vistos. Seus salvos não mudam.');
        };
      };
      var items = all.map(function (v) {
        var isProg = v.kind === 'programa';
        var t = !isProg && P ? P.tr(v.ref) : null;
        var p = isProg && P ? P.prog(v.ref) : null;
        var unavailable = !!(t && t.status === 'retirado');
        var name = isProg ? (p ? p.name : 'Programa') : (unavailable ? 'Perfil indisponível' : (t ? t.name : 'Treinador'));
        var pr = isProg ? { pre: '', price: p ? U.money(p.price) : '', unit: '· pagamento único' } : priceOf(t && t.from);
        var a = P && t ? P.av(t) : { photo: '', hasPhoto: false, noPhoto: true, ini: U.ini(name) };
        return {
          name: name, kindLabel: isProg ? 'Programa · ' + (P && p ? P.tr(p.author).name : '') : (unavailable ? (t.note || 'Retirado') : 'Treinador · ' + (t ? t.spec : '')),
          seen: v.expired ? 'Visto em ' + v.at + ' · expirado' : 'Visto ' + v.at,
          pre: pr.pre, price: pr.price, unit: pr.unit, hasPrice: !unavailable,
          photo: isProg ? '' : a.photo, hasPhoto: !isProg && a.hasPhoto, noPhoto: isProg || a.noPhoto, ini: isProg ? '' : a.ini, isProg: isProg,
          cls: 'p2-vcard' + (unavailable ? ' is-off' : ''), canOpen: !unavailable, cantOpen: unavailable,
          open: function () { if (isProg) ctx.go('PUB06', { id: v.ref }); else if (P) P.openTrainer(v.ref); else ctx.go('@perfil', { id: v.ref }); },
          remove: remove(v), removeLabel: 'Remover ' + name + ' dos vistos'
        };
      });

      var alerts = [];
      if (off) alerts.push(P2.alert('', 'lock', 'Este histórico está desativado', 'Sem política de retenção aprovada, a seção não aparece e nada é guardado.', 'Saiba por quê', function () { ctx.setUi({ why: !g('why', false) }); }));
      if (scn === 'limpo' && !g('touched', false)) alerts.push(P2.alert('ok', 'check', 'Lista limpa', 'Só os vistos recentemente deste aparelho foram apagados. Salvos, contratações e buscas continuam como estavam.'));
      if (scn === 'expirados' && !g('fixed', false)) alerts.push(P2.alert('warn', 'clock', 'Itens expirados', 'Itens vistos há mais de 7 dias saem da lista. Um perfil que você viu foi retirado pelo treinador.', 'Corrigir', function () { ctx.setUi({ fixed: true }); ctx.toast('Itens expirados removidos da lista.'); }));
      if (scn === 'pendente') alerts.push(P2.alert('warn', 'clock', 'Limpeza pendente', 'Pedimos para apagar esta lista, mas ainda não confirmamos neste aparelho.', 'Consultar de novo', function () { DB.p1_vistos = []; ctx.scenario(''); ctx.toast('Lista limpa. Salvos e contratações não mudaram.'); }));
      if (indisp) alerts.push(P2.alert('risk', 'alert', 'Consulta indisponível', 'Não conseguimos ler os vistos deste aparelho agora. Seus salvos continuam em Salvos.', 'Tentar de novo', function () { ctx.scenario(''); }));

      var hasItems = items.length > 0;
      var emptyTitle = scn === 'vazioexp' ? 'Os itens expiraram' : 'Nada visto neste aparelho';
      var emptyText = scn === 'vazioexp' ? 'Itens vistos há mais de 7 dias saem da lista automaticamente.' : 'Os perfis e programas que você abrir aparecem aqui por 7 dias. Visitar não adiciona aos favoritos.';
      return {
        alerts: alerts, items: items, hasItems: hasItems,
        showEmpty: !hasItems && !off && !indisp, emptyTitle: emptyTitle, emptyText: emptyText,
        showOff: off, why: off && g('why', false),
        canClear: hasItems && scn !== 'pendente',
        count: U.plural(items.length, 'item', 'itens'),
        clear: function () {
          ctx.ask({
            title: 'Limpar vistos recentemente?', ok: 'Limpar lista', danger: true,
            lines: ['Apaga só esta lista, neste aparelho.', 'Seus salvos, contratações e buscas continuam como estão.'],
            onOk: function () { DB.p1_vistos = []; ctx.setUi({ touched: true }); ctx.toast('Lista limpa. Salvos e contratações não mudaram.'); }
          });
        },
        explore: function () { ctx.go('H01'); }, privacy: function () { ctx.go('ACC13'); }, saved: function () { ctx.go('PUB07'); }
      };
    }
  });
})();
