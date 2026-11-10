/* Restaura os dados salvos neste aparelho, depois que todas as áreas registraram seus dados iniciais. */
(function () {
  if (!window.STORE) return;
  window.STORE.loadDb();
  // sem cadastro salvo, o perfil do treinador em edição só existe depois do cadastro
  var c = window.STORE.loadOnb('treinador'); if (c) window.__onbState = c;
  if (window.__applyMe) window.__applyMe();
})();
