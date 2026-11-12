/* Liga o app interativo por cima da página que o servidor entregou pronta.
   1) busca as telas; 2) carrega os scripts do app; 3) o app assume o #app (o conteúdo do servidor some).
   Se algo falhar, a página do servidor continua legível e com links funcionando. */
(function () {
  'use strict';
  window.__NEXT = true;
  var demo = false;
  try {
    var q = /[?&]demo=([01])/.exec(location.search);
    demo = q ? q[1] === '1' : (location.hash === '#demo' || window.localStorage.getItem('c99.demo') === '1');
  } catch (_) {}
  function add(src) { return new Promise(function (ok, no) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.body.appendChild(s); }); }
  // âncoras internas (#lista, #custa…): com <base href="/"> elas sairiam da página; aqui só rolam até o destino
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a || !a.closest('#app')) return;
    var id = a.getAttribute('href').slice(1), el = id ? document.getElementById(id) : null;
    e.preventDefault(); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  fetch('/shell/templates.html').then(function (r) { if (!r.ok) throw new Error('telas'); return r.text(); }).then(function (html) {
    var box = document.createElement('div'); box.innerHTML = html;
    var bar = box.querySelector('#shell-bar'), app = document.getElementById('app');
    if (bar && bar.firstElementChild) app.parentNode.insertBefore(bar.firstElementChild, app);
    while (box.firstChild) document.body.appendChild(box.firstChild);
    return demo ? add('/js/ds-data.js') : null;
  }).then(function () { return add('/shell/app.js'); }).then(function () {
    document.documentElement.classList.add('app-on');
  }).catch(function () { document.documentElement.classList.add('app-off'); });
})();
