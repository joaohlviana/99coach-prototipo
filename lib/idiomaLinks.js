// Código que roda no navegador (vai como texto num <script>), com o mapa de lib/rotas.js em window.__ROTAS:
// - window.__urlIdioma(caminhoPt): o mesmo endereço no idioma da página (/treinador/x -> /en/coach/x ou /coach/x no .com)
// - "Português · English · Español" levam à mesma página no outro idioma (quando ela tem tradução; senão, ao início)
// Roda no HTML do servidor e de novo a cada troca de endereço do app (pushState/replaceState/voltar).
function cliente() {
  var R = window.__ROTAS; if (!R) return;
  var BR = 'https://www.99coach.com.br';
  var ih = R.intl ? R.intl.replace(/^https?:\/\//, '') : '';
  var noIntl = function () { return !!ih && location.host === ih; };
  // idioma e caminho em português da página atual
  var atual = function () {
    var p = location.pathname, l = 'pt', m;
    if (noIntl()) { l = /^\/es(\/|$)/.test(p) ? 'es' : 'en'; if (l === 'es') p = p.slice(3) || '/'; }
    else if ((m = /^\/(en|es)(\/.*)?$/.exec(p))) { l = m[1]; p = m[2] || '/'; }
    if (l === 'pt') return { l: l, pt: p };
    var s = p.split('/').filter(Boolean), inv = {}, ie = {}, k;
    for (k in R.seg[l]) inv[R.seg[l][k]] = k;
    for (k in R.esp[l]) ie[R.esp[l][k]] = k;
    if (!s.length) return { l: l, pt: '/' };
    if (!inv[s[0]]) return { l: l, pt: null };
    s[0] = inv[s[0]];
    if (s[0] === 'treinadores' && s[1] && ie[s[1]]) s[1] = ie[s[1]];
    for (var i = 2; i < s.length; i++) if (inv[s[i]] === 'pagina') s[i] = 'pagina';
    return { l: l, pt: '/' + s.join('/') };
  };
  // caminho em português -> caminho no idioma l (com ?consulta e #âncora preservados)
  var traduz = function (l, q) {
    var resto = '', i = q.search(/[?#]/); if (i >= 0) { resto = q.slice(i); q = q.slice(0, i); }
    var s = q.split('/').filter(Boolean), pt1 = s[1];
    s = s.map(function (x, j) { return (j === 0 || (j >= 2 && x === 'pagina')) && R.seg[l][x] ? R.seg[l][x] : x; });
    if (q.split('/')[1] === 'treinadores' && pt1 && R.esp[l][pt1]) s[1] = R.esp[l][pt1];
    return (s.length ? '/' + s.join('/') : '') + resto;
  };
  var url = function (l, q) {
    q = q || '/';
    if (l === 'pt') return (noIntl() ? BR : '') + q;
    var pre = R.intl ? (l === 'es' ? '/es' : '') : '/' + l;
    var u = (pre + traduz(l, q)) || '/';
    if (u.charAt(0) === '?' || u.charAt(0) === '#') u = '/' + u;
    return (R.intl && !noIntl()) ? R.intl + u : u;
  };
  window.__urlIdioma = function (q) {
    var l = window.__LANG || 'pt';
    if (l === 'pt' || typeof q !== 'string' || q.charAt(0) !== '/' || /^\/(app|auth|api|img|js|css|data|shell|fonts)(\/|#|\?|$)/.test(q)) return q;
    if (!/^\/(treinadores|treinador|cidade|cidades|estado|esportes|buscar|worldwide|ajuda|sou-treinador)?([/?#]|$)/.test(q)) return q;
    return url(l, q);
  };
  window.__idl = function () {
    try {
      var a0 = atual(), ok = a0.pt && (a0.pt === '/' || a0.pt === '/worldwide' || a0.pt === '/buscar' || /^\/(treinadores|treinador|cidade)\//.test(a0.pt));
      var as = document.querySelectorAll('.ftr-langs a[hreflang],.ssr-foot__langs a[hreflang],.ssr-lang a[hreflang]');
      for (var i = 0; i < as.length; i++) {
        var k = (as[i].getAttribute('hreflang') || '').toLowerCase(), l = k === 'pt-br' ? 'pt' : k;
        if (l === 'pt' || l === 'en' || l === 'es') as[i].setAttribute('href', url(l, ok ? a0.pt : '/'));
      }
    } catch (e) {}
  };
  ['pushState', 'replaceState'].forEach(function (m) {
    var o = history[m];
    history[m] = function () { var r = o.apply(this, arguments); setTimeout(window.__idl, 0); setTimeout(window.__idl, 700); return r; };
  });
  addEventListener('popstate', function () { setTimeout(window.__idl, 700); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', window.__idl); else window.__idl();
}
export const IDIOMA_LINKS = '(' + cliente.toString() + ')();';
