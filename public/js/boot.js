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
