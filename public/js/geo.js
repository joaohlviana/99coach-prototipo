/* Localização de verdade: pede permissão ao navegador, acha o município mais próximo (base com os 5.570 municípios)
   e, quando pedido, a cidade mais próxima que tem treinador no catálogo. A posição não sai do aparelho. */
(function () {
  var base = null;
  function load() {
    if (base) return base;
    base = fetch('/data/municipios.json').then(function (r) { if (!r.ok) throw new Error('base'); return r.json(); }).then(function (d) { return d.items; });
    base.catch(function () { base = null; });
    return base;
  }
  function dist(a, b, c, d) { var r = Math.PI / 180, x = (d - b) * r * Math.cos((a + c) / 2 * r), y = (c - a) * r; return Math.sqrt(x * x + y * y) * 6371; }
  function pos() {
    return new Promise(function (ok, no) {
      if (!navigator.geolocation) return no(new Error('sem_suporte'));
      navigator.geolocation.getCurrentPosition(function (p) { ok(p.coords); }, function (e) { no(new Error(e && e.code === 1 ? 'negada' : 'indisponivel')); }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 600000 });
    });
  }
  // opts.only: lista de "Cidade, UF" aceitas (ex.: cidades com treinador); devolve a mais próxima delas
  function locate(opts) {
    opts = opts || {};
    return Promise.all([pos(), load()]).then(function (x) {
      var c = x[0], L = x[1], ok = opts.only ? {} : null;
      if (ok) opts.only.forEach(function (s) { ok[s] = 1; });
      var best = null, bd = 1e9, near = null, nd = 1e9;
      L.forEach(function (m) {
        var d = dist(c.latitude, c.longitude, m[2], m[3]), k = m[0] + ', ' + m[1];
        if (d < nd) { nd = d; near = k; }
        if ((!ok || ok[k]) && d < bd) { bd = d; best = k; }
      });
      return { city: near, km: Math.round(nd), match: best, matchKm: Math.round(bd) };
    });
  }
  window.GEO = { locate: locate, why: function (e) { var m = e && e.message; return m === 'negada' ? 'Você não permitiu a localização. Tudo bem: digite a cidade.' : (m === 'sem_suporte' ? 'Este navegador não informa a localização. Digite a cidade.' : 'Não deu para achar sua localização agora. Digite a cidade.'); } };
})();
