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
  var V = window.__V ? '?v=' + window.__V : '';
  // inglês e espanhol: o mesmo app, com o dicionário do idioma (public/data/i18n-<idioma>.json). As telas são
  // traduzidas no momento em que entram na página (antes de aparecer), e os endereços vão para a versão traduzida.
  var LANG = window.__LANG || '';
  var dic = LANG ? fetch('/data/i18n-' + LANG + '.json' + V).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }) : Promise.resolve(null);
  function traduzir(d) {
    var T = d.t || {}, P = (d.p || []).map(function (x) { return [new RegExp('^' + x[0] + '$'), x[1]]; });
    var tr = function (s) {
      var k = s.replace(/\s+/g, ' ').trim(); if (!k || k.length > 400) return s;
      var v = T[k];
      // padrões com números e nomes: $1 copia o trecho, $t1 traduz o trecho, $l1 traduz cada item de uma lista "a, b, c"
      if (v === undefined) for (var i = 0; i < P.length; i++) { var m = P[i][0].exec(k); if (m) { v = P[i][1].replace(/\$([tl]?)(\d)/g, function (_, t, n) { var g = m[+n] || ''; return t === 't' ? tr(g).trim() : t === 'l' ? g.split(', ').map(function (x) { return tr(x).trim(); }).join(', ') : g; }); break; } }
      if (v === undefined) return s;
      var a = /^\s*/.exec(s)[0], b = /\s*$/.exec(s)[0];
      return a + v + b;
    };
    var ATTR = ['placeholder', 'aria-label', 'title', 'alt'];
    var fora = function (el) { return !el || (el.closest && el.closest('#ssr,[data-no-tr],script,style')); };
    var um = function (n) {
      if (n.nodeType === 3) { if (fora(n.parentNode)) return; var v = n.nodeValue, t = tr(v); if (t !== v) n.nodeValue = t; return; }
      if (n.nodeType !== 1 || fora(n)) return;
      for (var i = 0; i < ATTR.length; i++) { var a = n.getAttribute(ATTR[i]); if (a) { var t = tr(a); if (t !== a) n.setAttribute(ATTR[i], t); } }
      if (n.tagName === 'A' && window.__urlIdioma) { var h = n.getAttribute('href'); if (h) { var u = window.__urlIdioma(h); if (u !== h) n.setAttribute('href', u); } }
      if (n.tagName === 'INPUT' && (n.type === 'button' || n.type === 'submit') && n.value) { var w = tr(n.value); if (w !== n.value) n.value = w; }
    };
    var tudo = function (root) {
      um(root); if (root.nodeType !== 1) return;
      var w = document.createTreeWalker(root, 5), c; while ((c = w.nextNode())) um(c);
    };
    tudo(document.body);
    new MutationObserver(function (ms) {
      for (var i = 0; i < ms.length; i++) {
        var m = ms[i];
        if (m.type === 'childList') for (var j = 0; j < m.addedNodes.length; j++) tudo(m.addedNodes[j]);
        else um(m.target);
      }
    }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTR.concat(['href']) });
    // título da aba (o app troca ao navegar)
    var ti = document.querySelector('title');
    if (ti) new MutationObserver(function () { var v = document.title, t = tr(v); if (t !== v) document.title = t; }).observe(ti, { childList: true, characterData: true, subtree: true });
    window.__tr = tr;
  }
  fetch('/shell/templates.html' + V).then(function (r) { if (!r.ok) throw new Error('telas'); return r.text(); }).then(function (html) {
    var box = document.createElement('div'); box.innerHTML = html;
    var bar = box.querySelector('#shell-bar'), app = document.getElementById('app');
    if (bar && bar.firstElementChild) app.parentNode.insertBefore(bar.firstElementChild, app);
    while (box.firstChild) document.body.appendChild(box.firstChild);
    return demo ? add('/js/ds-data.js') : null;
  }).then(function () { return dic.then(function (d) { if (d) traduzir(d); }); }).then(function () { return add('/shell/app.js' + V); }).then(function () {
    document.documentElement.classList.add('app-on');
    // no primeiro toque ou rolagem, as folhas das outras telas públicas começam a baixar: a troca de tela fica imediata
    var fired = false, warm = function () { if (fired) return; fired = true; ['home', 'esporte', 'perfil', 'onboarding', 'publico', 'servico'].forEach(function (n) { var l = document.getElementById('css-' + n); if (l && !l.getAttribute('href') && l.getAttribute('data-href')) l.href = l.getAttribute('data-href'); }); };
    ['pointerdown', 'keydown', 'touchstart', 'wheel'].forEach(function (ev) { window.addEventListener(ev, warm, { once: true, passive: true, capture: true }); });
  }).catch(function () { document.documentElement.classList.add('app-off'); });
})();
