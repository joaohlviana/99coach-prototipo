/* Inicia o app quando folhas de estilo e fontes estiverem prontas */
(function () {
  function boot() { window.__dcBoot(); }
  if (document.readyState === 'complete') boot(); else window.addEventListener('load', boot);
})();

/* Barras de demonstração: preferência guardada no aparelho */
(function () {
  var b = document.getElementById('pv-demo'); if (!b) return;
  var off = false; try { off = window.localStorage.getItem('c99.semdemo') === '1'; } catch (_) {}
  function paint() { document.documentElement.classList.toggle('sem-demo', off); b.setAttribute('aria-pressed', String(!off)); b.textContent = 'Barras de demonstração: ' + (off ? 'ocultas' : 'visíveis'); }
  b.addEventListener('click', function () { off = !off; try { window.localStorage.setItem('c99.semdemo', off ? '1' : '0'); } catch (_) {} paint(); });
  paint();
})();

/* Modo demonstração: ?demo=1 ou #demo liga (fica gravado); ?demo=0 ou #produto desliga. Sem isso, o app abre como produto. */
(function () {
  var on = false;
  try {
    var q = /[?&]demo=([01])/.exec(location.search);
    if (q) window.localStorage.setItem('c99.demo', q[1]);
    if (location.hash === '#demo') window.localStorage.setItem('c99.demo', '1');
    if (location.hash === '#produto') window.localStorage.setItem('c99.demo', '0');
    on = window.localStorage.getItem('c99.demo') === '1';
  } catch (_) {}
  document.documentElement.classList.toggle('demo', on);
})();
