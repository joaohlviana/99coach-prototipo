/* PUB14 · Resultado em mapa (variante habilitada): mapa desenhado (SVG/CSS) com marcadores por região de Londrina, sem endereço;
   lista sincronizada, agrupamento por região, seleção de marcador. Treinadores vêm de DB.p1_treinadores (mesmos do perfil). */
(function () {
  'use strict';
  // regiões aproximadas (posição em % do mapa desenhado; nunca endereço)
  DB.seed('p2_regioes', [
    { id: 'centro', name: 'Região central', x: 48, y: 40 },
    { id: 'gleba', name: 'Gleba Palhano', x: 28, y: 64 },
    { id: 'sul', name: 'Zona Sul', x: 60, y: 80 },
    { id: 'norte', name: 'Zona Norte', x: 56, y: 14 },
    { id: 'leste', name: 'Zona Leste', x: 82, y: 42 },
    { id: 'oeste', name: 'Zona Oeste', x: 14, y: 34 }
  ]);
  // resultados de CrossFit presencial em Londrina; region '' = sem localização disponível (fica só na lista)
  DB.seed('p2_mapa', [
    { id: 'rafael', ref: 'rafael', region: 'centro' },
    { id: 'mtp', ref: '', name: 'MTP Athletes', spec: 'Preparação física · perfil importado', from: 'R$ 80 / sessão', photo: '0d6e126f792d89360f91548c75ddf267', region: 'centro', imported: true },
    { id: 'gabriel', ref: 'gabriel', region: 'gleba' },
    { id: 'carolina', ref: 'carolina', region: 'sul' },
    { id: 'thiago', ref: 'thiago', region: '' },
    { id: 'anapaula', ref: '', name: 'Ana Paula Ribeiro', spec: 'CrossFit · só online', from: 'R$ 145 / mês', photo: '', region: '', online: true }
  ]);

  function priceOf(from) {
    var m = /^(R\$\s?[\d.,]+)\s*(\/.*)?$/.exec(String(from || ''));
    if (m) return { pre: 'a partir de', price: m[1], unit: m[2] || '', short: m[1] };
    return { pre: '', price: from ? from.charAt(0).toUpperCase() + from.slice(1) : 'Preço não informado', unit: '', short: '?' };
  }

  REG.screen({
    page: 'publico', key: 'mapa', id: 'PUB14', title: 'Resultado em mapa', mtitle: 'Mapa', nav: 'explorar', back: 'history', wide: true,
    normal: 'Mapa habilitado',
    scens: [['desligado', 'Mapa desligado'], ['locnegada', 'Localização negada'], ['online', 'Treinador só online'], ['carregando', 'Mapa carregando'], ['permissao', 'Permissão negada'], ['fornecedor', 'Fornecedor indisponível'], ['nenhum', 'Nenhum resultado na área']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn, g = function (k, d) { return P2.g(ui, k, d); };
      var P = window.P1;
      var off = scn === 'desligado', loading = scn === 'carregando', broken = scn === 'fornecedor', none = scn === 'nenhum';
      var zoom = g('zoom', '');
      var REG_ = {}; DB.p2_regioes.forEach(function (r) { REG_[r.id] = r; });

      // normaliza resultados (P1 para treinadores com perfil; dados próprios para importado e só online)
      var rows = DB.p2_mapa.map(function (m) {
        var t = m.ref && P ? P.tr(m.ref) : null;
        var name = t ? t.name : m.name, from = t ? t.from : m.from;
        var photo = t ? (t.photo ? U.img(t.photo) : '') : (m.photo ? U.img(m.photo) : '');
        var r = REG_[m.region];
        return {
          id: m.id, name: name, spec: t ? t.spec : m.spec, region: m.region, regionName: r ? r.name : '', online: !!m.online,
          note: t && t.id === 'gabriel' ? t.why : (m.imported ? 'Perfil importado · não reivindicado' : ''),
          pr: priceOf(from), photo: photo, ini: t ? t.ini : U.ini(name), ref: m.ref
        };
      });
      if (none) rows = rows.filter(function (r) { return r.online; });
      var placed = rows.filter(function (r) { return r.region && !r.online; });
      var visible = zoom ? placed.filter(function (r) { return r.region === zoom; }) : placed;
      var selId = g('sel', none ? '' : 'rafael');
      var sel = placed.filter(function (r) { return r.id === selId; })[0] || null;

      var open = function (r) {
        return function () {
          if (r.ref && P) P.openTrainer(r.ref);
          else if (r.ref) ctx.go('@perfil', { id: r.ref });
          else ctx.go('PUB04', { id: r.id });
        };
      };
      var pick = function (r) { return function () { ctx.setUi({ sel: r.id }); }; };

      // marcadores: agrupa por região; com zoom na região, separa os itens
      var groups = {};
      placed.forEach(function (r) { (groups[r.region] = groups[r.region] || []).push(r); });
      var pins = [];
      Object.keys(groups).forEach(function (rid) {
        var gp = groups[rid], rg = REG_[rid];
        if (gp.length > 1 && zoom !== rid) {
          var on = !!sel && sel.region === rid;
          pins.push({ label: String(gp.length), aria: gp.length + ' treinadores em ' + rg.name + ', aproximar', cls: 'p2-pin p2-pin--group' + (on ? ' is-on' : ''), style: 'left:' + rg.x + '%;top:' + rg.y + '%', on: String(on),
            go: function () { ctx.setUi({ zoom: rid, sel: gp[0].id }); } });
        } else {
          gp.forEach(function (r, i) {
            var on = !!sel && sel.id === r.id, dx = gp.length > 1 ? (i - (gp.length - 1) / 2) * 16 : 0;
            pins.push({ label: r.pr.short, aria: r.name + ', ' + rg.name + ', ' + r.pr.price, cls: 'p2-pin' + (on ? ' is-on' : ''), style: 'left:' + (rg.x + dx) + '%;top:' + rg.y + '%', on: String(on), go: pick(r) });
          });
        }
      });
      var areas = Object.keys(groups).map(function (rid) { var rg = REG_[rid]; return { style: 'left:' + rg.x + '%;top:' + rg.y + '%', cls: 'p2-map__area' + (zoom === rid ? ' is-zoom' : '') }; });
      var labels = DB.p2_regioes.map(function (rg) { return { name: rg.name, style: 'left:' + rg.x + '%;top:' + (rg.y + 8) + '%' }; });

      var item = function (r) {
        var on = !!sel && sel.id === r.id;
        return { name: r.name, spec: r.spec, where: r.online ? 'Atende só online · fora do mapa' : (r.region ? r.regionName + ' · aproximado' : 'Sem localização disponível'),
          pre: r.pr.pre, price: r.pr.price, unit: r.pr.unit, note: r.note, hasNote: !!r.note,
          photo: r.photo, hasPhoto: !!r.photo, noPhoto: !r.photo, ini: r.ini,
          cls: 'p2-mrow' + (on ? ' is-on' : ''), on: String(on), canPick: !!r.region && !r.online && !off, cantPick: !r.region || r.online || off, pick: pick(r), open: open(r) };
      };
      var list = visible.map(item);
      var noLoc = rows.filter(function (r) { return !r.region && !r.online; }).map(item);
      var onl = rows.filter(function (r) { return r.online; }).map(item);
      if (zoom) noLoc = [];

      var alerts = [];
      if (off) alerts.push(P2.alert('', 'lock', 'Mapa desligado', 'O controle Lista/Mapa não aparece enquanto o mapa não estiver habilitado. A lista funciona normalmente.', 'Saiba por quê', function () { ctx.setUi({ why: !g('why', false) }); }));
      if (scn === 'locnegada') alerts.push(P2.alert('warn', 'pin', 'Localização negada', 'Tudo bem: escolha a cidade manualmente. O mapa usa a região aproximada da cidade escolhida.', 'Continuar', function () { ctx.go('PUB16', { from: 'PUB14' }); }));
      if (scn === 'online') alerts.push(P2.alert('info', 'monitor', 'Treinador só online', 'Quem atende só online fica fora do mapa, na lista “Online”. Online não é apresentado como perto.'));
      if (scn === 'permissao') alerts.push(P2.alert('warn', 'lock', 'Permissão negada', 'Sem acesso à sua localização. Mostramos Londrina pela cidade que você escolheu, por região aproximada.', 'Saiba por quê', function () { ctx.setUi({ why: !g('why', false) }); }));

      var mapOk = !off && !loading && !broken;
      return {
        alerts: alerts, title: 'CrossFit em Londrina', sub: 'Localização aproximada por região',
        showSeg: !off, showMap: mapOk, loading: loading, broken: broken, why: !!g('why', false) && (off || scn === 'permissao'),
        whyText: off ? 'O mapa depende de um fornecedor habilitado. Esconder o mapa desligado é melhor que mostrar um botão que não funciona.' : 'A permissão de localização é pedida só quando você toca em “Perto de mim”. Sem ela, usamos a cidade escolhida.',
        pins: pins, areas: areas, labels: labels,
        zoomed: !!zoom && mapOk, zoomName: zoom && REG_[zoom] ? REG_[zoom].name : '',
        unzoom: function () { ctx.setUi({ zoom: '' }); },
        searchArea: function () { ctx.toast('Resultados atualizados para a área visível às ' + U.now() + '.'); },
        hasSel: !!sel && mapOk, sel: sel ? item(sel) : { name: '', spec: '', where: '', pre: '', price: '', unit: '', note: '', hasNote: false, photo: '', hasPhoto: false, noPhoto: true, ini: '', open: P2.noop },
        list: list, hasList: list.length > 0, noList: list.length === 0,
        count: zoom ? U.plural(list.length, 'resultado', 'resultados') + ' em ' + (REG_[zoom] ? REG_[zoom].name : '') : U.plural(placed.length + noLoc.length + onl.length, 'resultado', 'resultados') + ' · presencial e online',
        noLoc: noLoc, hasNoLoc: noLoc.length > 0, onl: onl, hasOnl: onl.length > 0,
        toList: function () { ctx.go('@esporte', {}); },
        changeLoc: function () { ctx.go('PUB16', { from: 'PUB14' }); },
        retry: function () { ctx.scenario(''); },
        widen: function () { ctx.scenario(''); ctx.setUi({ zoom: '' }); ctx.toast('Mostrando toda Londrina.'); }
      };
    }
  });
})();
