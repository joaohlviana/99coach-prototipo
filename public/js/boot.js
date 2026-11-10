/* Inicia o app quando folhas de estilo e fontes estiverem prontas */
(function () {
  function boot() { window.__dcBoot(); }
  if (document.readyState === 'complete') boot(); else window.addEventListener('load', boot);
})();
