/* Runtime mínimo do protótipo: executa as telas VFINAL (.dc.html) fora do editor
   e liga Home, Esporte e Perfil com histórico, contexto de busca e posição preservados. */
(function () {
  'use strict';
  var SVGNS = 'http://www.w3.org/2000/svg';
  var IMG = window.__IMG || {};
  var HOLE = /\{\{\s*([^}]*?)\s*\}\}/g;
  var WHOLE = /^\s*\{\{\s*([^}]*?)\s*\}\}\s*$/;
  var app = document.getElementById('app');

  // ---------- templates ----------
  function lookup(path, scope) {
    if (path === 'true') return true;
    if (path === 'false') return false;
    if (path === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
    if (/^'.*'$|^".*"$/.test(path)) return path.slice(1, -1);
    var parts = path.split('.');
    var v = scope[parts[0]];
    for (var i = 1; i < parts.length && v != null; i++) v = v[parts[i]];
    return v;
  }
  function str(v) { return v == null || typeof v === 'boolean' ? '' : String(v); }
  function interp(s, scope) { return s.replace(HOLE, function (_, p) { return str(lookup(p, scope)); }); }
  function img(v) { return typeof v === 'string' && v.indexOf('@@IMG:') === 0 ? (IMG[v.slice(6, -2)] || '') : v; }

  function buildKids(node, scope, out) {
    for (var c = node.firstChild; c; c = c.nextSibling) build(c, scope, out);
  }
  function build(node, scope, out) {
    var t = node.nodeType;
    if (t === 3) { var tx = node.nodeValue; out.push(document.createTextNode(tx.indexOf('{{') < 0 ? tx : interp(tx, scope))); return; }
    if (t !== 1) return;
    var tag = node.localName;
    if (tag === 'sc-if') {
      var m0 = WHOLE.exec(node.getAttribute('value') || '');
      if (m0 && lookup(m0[1], scope)) buildKids(node, scope, out);
      return;
    }
    if (tag === 'sc-for') {
      var m1 = WHOLE.exec(node.getAttribute('list') || '');
      var list = (m1 && lookup(m1[1], scope)) || [];
      var as = node.getAttribute('as') || 'item';
      for (var i = 0; i < list.length; i++) {
        var s = Object.create(scope); s[as] = list[i]; s.$index = i;
        buildKids(node, s, out);
      }
      return;
    }
    var svg = node.namespaceURI === SVGNS;
    var el = svg ? document.createElementNS(SVGNS, tag) : document.createElement(tag);
    var h = null;
    var attrs = node.attributes;
    for (var a = 0; a < attrs.length; a++) {
      var n = attrs[a].name, val = attrs[a].value;
      if (n.indexOf('hint-') === 0) continue;
      var m = WHOLE.exec(val);
      if (n.length > 2 && n.indexOf('on') === 0 && m) {
        var f = lookup(m[1], scope);
        if (typeof f === 'function') { h = h || {}; h[n.slice(2)] = f; }
        continue;
      }
      var v = m ? lookup(m[1], scope) : (val.indexOf('{{') >= 0 ? interp(val, scope) : val);
      v = img(v);
      if (n === 'value' && (tag === 'input' || tag === 'textarea')) { el.__val = str(v); continue; }
      var aria = n.indexOf('aria-') === 0 || n.indexOf('data-') === 0;
      if (v == null || typeof v === 'function' || typeof v === 'object') continue;
      if (v === false && !aria) continue;
      if (v === true && !aria) v = '';
      el.setAttribute(n, String(v));
    }
    el.__h = h;
    var kids = [];
    buildKids(node, scope, kids);
    for (var k = 0; k < kids.length; k++) el.appendChild(kids[k]);
    if (el.__val !== undefined) el.value = el.__val;
    out.push(el);
  }

  // ---------- morph: atualiza o DOM vivo sem recriar o que não mudou (preserva foco e digitação) ----------
  function same(l, f) {
    if (l.nodeType !== f.nodeType) return false;
    if (l.nodeType !== 1) return true;
    return l.localName === f.localName && l.namespaceURI === f.namespaceURI;
  }
  function patch(l, f) {
    if (l.nodeType !== 1) { if (l.nodeValue !== f.nodeValue) l.nodeValue = f.nodeValue; return; }
    var la = l.attributes, fa = f.attributes, i;
    for (i = la.length - 1; i >= 0; i--) if (!f.hasAttribute(la[i].name)) l.removeAttribute(la[i].name);
    for (i = 0; i < fa.length; i++) if (l.getAttribute(fa[i].name) !== fa[i].value) l.setAttribute(fa[i].name, fa[i].value);
    l.__h = f.__h;
    if (f.__val !== undefined && f.__val !== l.__val) { l.value = f.__val; }
    l.__val = f.__val;
    morph(l, Array.prototype.slice.call(f.childNodes));
  }
  function morph(live, fresh) {
    for (var i = 0; i < fresh.length; i++) {
      var f = fresh[i], l = live.childNodes[i];
      if (!l) live.appendChild(f);
      else if (same(l, f)) patch(l, f);
      else live.replaceChild(f, l);
    }
    while (live.childNodes.length > fresh.length) live.removeChild(live.lastChild);
  }

  // ---------- componente ----------
  var cur = null, rendering = false, again = false;
  function DCLogic(props) { this.props = props || {}; this.state = {}; }
  DCLogic.prototype.setState = function (p) {
    var patchObj = typeof p === 'function' ? p(this.state, this.props) : p;
    this.state = Object.assign({}, this.state, patchObj || {});
    request(this);
    if (window.__persist) window.__persist();
  };
  DCLogic.prototype.forceUpdate = function () { request(this); };
  window.DCLogic = DCLogic;

  function request(c) {
    if (!cur || c !== cur.comp) return; // componente de outra tela (ex.: timer antigo)
    if (rendering) { again = true; return; }
    rendering = true;
    try { render(false); } finally { rendering = false; }
    if (again) { again = false; request(c); }
  }
  function render(fresh) {
    var c = cur.comp, P = PAGES[cur.name], vals;
    try { vals = c.renderVals(); } catch (err) { console.error(err); return; }
    vals.__nav = navVals(cur.name);
    var out = [];
    buildKids(P.frag, vals, out);
    if (fresh) { app.textContent = ''; for (var i = 0; i < out.length; i++) app.appendChild(out[i]); }
    else morph(app, out);
    if (window.__afterRender) window.__afterRender(cur.name, app);
  }

  // ---------- eventos (delegados, com bolha como no React) ----------
  function dispatch(e) {
    var stopped = false;
    var syn = {
      type: e.type, target: e.target, currentTarget: null, nativeEvent: e,
      clientX: e.clientX, clientY: e.clientY, key: e.key,
      preventDefault: function () { e.preventDefault(); },
      stopPropagation: function () { stopped = true; e.stopPropagation(); },
      get defaultPrevented() { return e.defaultPrevented; }
    };
    for (var el = e.target; el && el !== document; el = el.parentNode) {
      if (el.__h && el.__h[e.type]) {
        syn.currentTarget = el;
        try { el.__h[e.type](syn); } catch (err) { console.error(err); }
        if (stopped) break;
      }
    }
    if (e.type === 'submit') e.preventDefault();
    if (e.type === 'click' && !e.defaultPrevented && e.target.closest) {
      var a = e.target.closest('a[href^="#"]');
      if (a) {
        e.preventDefault();
        var t = document.getElementById(a.getAttribute('href').slice(1));
        if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }
  document.addEventListener('click', dispatch);
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-pv]');
    if (!b) return;
    var n = b.getAttribute('data-pv');
    NAV.go(n, n === 'perfil' ? { id: 'rafael' } : (n === 'onboarding' ? { flow: 'treinador' } : (n === 'servico' ? { offer: 'online' } : {})), cur && cur.comp);
  });
  document.addEventListener('submit', dispatch);
  document.addEventListener('input', dispatch);
  document.addEventListener('change', dispatch);
  document.addEventListener('keydown', dispatch);
  document.addEventListener('focusin', dispatch);

  // ---------- navegação entre telas ----------
  var PAGES = null;
  var SPORTS = window.SPORTS.list.map(function (x) { return [x.id, x.label]; });
  var FMT = { presencial: 'Presencial', online: 'Online', qualquer: 'Qualquer' };
  // perfis completos montados no VFINAL e a situação que cada um demonstra
  var PROFILE = { thiago: 'novo', rafael: 'comparando', gabriel: 'semvaga', carolina: 'desconhecida', studio: 'importado', bruna: 'semoferta' };
  var CLEAN = { home: { sheet: null, sd: null, toast: null, sx: null }, esporte: { sheet: '', open: '', toast: null, dd: '', pend: null }, perfil: { sheet: null }, servico: { sheet: null }, onboarding: { toast: '' }, telas: {}, treinador: { sheet: null, toast: '' }, aluno: { sheet: null, toast: '' }, publico: { sheet: null, toast: '' }, operacao: { sheet: null, toast: '' } };
  var MODP = { treinador: 1, aluno: 1, publico: 1, operacao: 1 };
  var ctx = { mod: 'CrossFit', city: 'Londrina, PR', fmt: 'Presencial', avail: false, homeScen: 'primeira', set: false };

  function modOf(id) { for (var i = 0; i < SPORTS.length; i++) if (SPORTS[i][0] === id) return SPORTS[i][1]; return 'CrossFit'; }
  function idOf(mod) { for (var i = 0; i < SPORTS.length; i++) if (SPORTS[i][1] === mod) return SPORTS[i][0]; return 'crossfit'; }

  function updateCtx(name, s) {
    if (name === 'home') { ctx = { mod: modOf(s.sport), city: s.city || '', fmt: FMT[s.mode] || 'Presencial', avail: false, homeScen: s.scen, set: true }; }
    else if (name === 'esporte') { ctx = Object.assign({}, ctx, { mod: s.mod, city: s.city || '', fmt: s.fmt, avail: !!s.avail, set: true }); }
    else if (name === 'perfil' && s.vaga) { ctx = Object.assign({}, ctx, { avail: true }); }
  }
  function propsFor(name, p) {
    if (name === 'home') {
      var init = ctx.set ? { sport: idOf(ctx.mod), city: ctx.city || null, mode: (ctx.fmt || 'Presencial').toLowerCase() } : ((window.STORE && window.STORE.loadPage('home')) || {});
      return { scen: ctx.homeScen || 'primeira', init: init };
    }
    if (name === 'esporte') {
      var e = {
        mod: p.mod || ctx.mod, city: p.city !== undefined ? p.city : ctx.city,
        fmt: p.fmt || ctx.fmt, avail: p.avail !== undefined ? !!p.avail : !!ctx.avail
      };
      if (e.fmt === 'Online') e.city = '';
      e.scen = e.mod === 'CrossFit' && e.city === 'Londrina, PR' && e.fmt === 'Presencial' && !e.avail ? 'londrina'
        : (e.mod === 'CrossFit' && e.fmt === 'Online' && !e.avail ? 'online' : '');
      return { init: e };
    }
    if (name === 'onboarding') return { flow: p.flow || 'treinador', scn: p.scn || '' };
    if (name === 'telas') return { id: p.id || '', st: p.st || 0 };
    if (MODP[name]) return Object.assign({ s: '', id: '', scn: '' }, p);
    if (name === 'servico') return { offer: p.offer || 'online', scn: p.scn || (ctx.homeScen === 'vinculo' || ctx.homeScen === 'dois' ? 'aluna' : (ctx.homeScen === 'pendente' ? 'pedido' : 'comparando')) };
    if (!PROFILE[p.id] && window.REAL && window.REAL.has(p.id)) return { id: p.id, scn: 'importado', rid: p.id, offer: null };
    var id = PROFILE[p.id] ? p.id : 'rafael';
    var scn = p.scn || PROFILE[id];
    if (id === 'rafael' && !p.scn) {
      if (ctx.homeScen === 'vinculo' || ctx.homeScen === 'dois') scn = 'vinculo';
      else if (ctx.homeScen === 'pendente') scn = 'pedido';
    }
    return { id: id, scn: scn, offer: p.offer || null };
  }
  function token(name, props) { return name === 'perfil' ? 'perfil-' + props.id : (name === 'onboarding' ? 'onboarding-' + props.flow : (name === 'servico' ? 'servico-' + props.offer : (name === 'telas' ? 'telas' + (props.id ? '-' + props.id : '') : (MODP[name] ? name + (props.s ? '-' + props.s + (props.id ? '-' + props.id : '') : '') : name)))); }

  var entries = {}, order = [], pos = -1, seq = 0, pushOk = true;
  function saveCurrent(extra) {
    if (!cur) return;
    var st = Object.assign({}, cur.comp.state, CLEAN[cur.name], extra || {});
    entries[cur.key].state = st;
    entries[cur.key].scroll = window.scrollY || window.pageYOffset || 0;
    updateCtx(cur.name, st);
  }
  // No produto (fora da demonstração) ninguém entra em área que não é sua:
  // painéis pedem conta; administração, vitrine de telas e páginas de exemplo só existem na demonstração.
  function guard(name, params) {
    if (document.documentElement.classList.contains('demo')) return [name, params];
    var area = window.ACCT ? window.ACCT.area() : null;
    if (name === 'operacao' || name === 'telas' || name === 'servico') return ['home', {}];
    if (name === 'treinador' && area !== 'treinador') return area === 'aluno' ? ['aluno', {}] : ['onboarding', { flow: 'entrar' }];
    if (name === 'aluno' && !area) return ['onboarding', { flow: 'entrar' }];
    if (name === 'publico' && !area && ['ajuda', 'convite', 'pedir'].indexOf(params.s || '') < 0) return ['home', {}];
    if (name === 'perfil' && area !== 'treinador' && !(window.REAL && window.REAL.has(params.id))) return ['home', {}];
    return [name, params];
  }
  function mount(name, props, state, key) {
    var P = PAGES[name];
    for (var k in PAGES) PAGES[k].css.media = k === name ? 'all' : 'not all';
    var c = new P.Comp(props);
    if (state) c.state = state;
    cur = { name: name, comp: c, key: key };
    var bs = document.querySelectorAll('[data-pv]');
    for (var b = 0; b < bs.length; b++) { if (bs[b].getAttribute('data-pv') === name) bs[b].setAttribute('aria-current', 'page'); else bs[b].removeAttribute('aria-current'); }
    rendering = true;
    try { render(true); } finally { rendering = false; }
  }
  function scrollLater(y) {
    window.scrollTo(0, y);
    requestAnimationFrame(function () { requestAnimationFrame(function () { window.scrollTo(0, y); }); });
  }

  var NAV = {
    has: function (id) { return !!PROFILE[id] || !!(window.REAL && window.REAL.has(id)); },
    // perfil do treinador montado no cadastro (onboarding); sem cadastro aberto, usa o exemplo preenchido
    draft: function () {
      var C = PAGES && PAGES.onboarding && PAGES.onboarding.Comp;
      if (!C || !C.draft) return null;
      var st = window.__onbState;
      if (!st || st.flow !== 'treinador') st = Object.assign(C.prototype.base.call(C.prototype, 'treinador', 'completo'), {});
      return C.draft(st);
    },
    modOf: modOf,
    go: function (name, params, from, extra) {
      saveCurrent(extra);
      var g = guard(name, params || {}); name = g[0]; params = g[1];
      var props = propsFor(name, params || {});
      var key = ++seq;
      order = order.slice(0, pos + 1); order.push(key); pos = order.length - 1;
      entries[key] = { name: name, props: props, state: null, scroll: 0 };
      try { history.pushState({ k: key }, '', '#' + token(name, props)); } catch (_) { pushOk = false; }
      mount(name, props, null, key);
      scrollLater(0);
    },
    // "Voltar para a busca": volta de fato quando a tela anterior é a busca; senão abre a busca com o contexto atual
    toSearch: function (from) {
      var prev = pos > 0 ? entries[order[pos - 1]] : null;
      if (prev && prev.name === 'esporte') { NAV.back(); return; }
      NAV.go('esporte', {}, from);
    },
    // sem histórico do navegador (moldura restrita), volta pela pilha interna
    back: function () {
      if (pos <= 0) { NAV.go('home', {}, cur && cur.comp); return; }
      if (pushOk) { history.back(); return; }
      if (pos <= 0) return;
      saveCurrent();
      pos -= 1;
      var k = order[pos], ent = entries[k];
      mount(ent.name, ent.props, ent.state, k);
      scrollLater(ent.scroll || 0);
    },
    ctxLabel: function () {
      var c = ctx.city ? ctx.city.split(',')[0] : '';
      if (ctx.fmt === 'Online') return ctx.mod + ' · online';
      return ctx.mod + (c ? ' · ' + c : '') + ' · ' + (ctx.fmt === 'Qualquer' ? 'qualquer formato' : ctx.fmt.toLowerCase());
    },
    // serviço da vitrine da Home → perfil com a oferta já escolhida
    svc: function (v) {
      if (!v) return null;
      if (v.first === 'Rafael') return { page: 'servico', offer: v.price === 'R$ 80' ? 'sessao' : 'online' };
      if (v.first === 'Carolina') return { page: 'perfil', id: 'carolina', offer: v.price === 'R$ 60' ? 'c_aula' : 'c_online' };
      return null;
    },
    coachId: function (name) {
      return { 'Rafael Lima': 'rafael', 'Gabriel Santos': 'gabriel', 'Carolina Albuquerque Montenegro': 'carolina' }[name] || null;
    }
  };
  window.NAV = NAV;
  // redesenha a tela atual (dados reais chegaram, base sincronizada)
  // grava no aparelho o que mudou: dados das áreas logadas e preferências da Home
  window.__persist = function () {
    if (!window.STORE || !cur || window.__signingOut) return;
    window.STORE.saveDb();
    if (cur.name === 'home') { var s = cur.comp.state; window.STORE.savePage('home', { sport: s.sport, city: s.city, mode: s.mode, favs: s.favs }); }
  };
  window.__rerender = function () { if (cur && cur.comp) cur.comp.setState({}); };

  function navVals(page) {
    var mk = function (n, params) { return function () { NAV.go(n, params || {}, cur && cur.comp); }; };
    return {
      home: mk('home'), esporte: mk('esporte'), perfil: mk('perfil', { id: 'rafael' }),
      homeCls: 'chip' + (page === 'home' ? ' is-on' : ''), esporteCls: 'chip' + (page === 'esporte' ? ' is-on' : ''), perfilCls: 'chip' + (page === 'perfil' ? ' is-on' : ''),
      homeOn: String(page === 'home'), esporteOn: String(page === 'esporte'), perfilOn: String(page === 'perfil')
    };
  }

  window.addEventListener('popstate', function (e) {
    var k = e.state && e.state.k;
    var ent = k && entries[k];
    saveCurrent();
    if (!ent) { start(); return; }
    pos = order.indexOf(k);
    mount(ent.name, ent.props, ent.state, k);
    scrollLater(ent.scroll || 0);
  });

  function start() {
    var hsh = (location.hash || '').slice(1);
    var name = 'home', params = {};
    if (hsh === 'esporte') name = 'esporte';
    else if (hsh.indexOf('servico') === 0) { name = 'servico'; params = { offer: hsh.split('-')[1] || 'online' }; }
    else if (hsh.indexOf('onboarding') === 0) { name = 'onboarding'; params = { flow: hsh.split('-')[1] || 'treinador', scn: hsh.split('-')[2] || '' }; }
    else if (MODP[hsh.split('-')[0]]) { var hp = hsh.split('-'); name = hp[0]; params = { s: hp[1] || '', id: hp[2] || '', scn: hp[3] || '' }; }
    else if (hsh.indexOf('telas') === 0) { name = 'telas'; params = { id: hsh.split('-')[1] || '' }; }
    else if (hsh.indexOf('perfil') === 0) { name = 'perfil'; params = { id: hsh.slice(7) || 'rafael' }; }
    var g0 = guard(name, params), moved = g0[0] !== name; name = g0[0]; params = g0[1];
    var props = propsFor(name, params);
    var key = ++seq;
    order = [key]; pos = 0;
    entries[key] = { name: name, props: props, state: null, scroll: 0 };
    try { if (moved) history.replaceState({ k: key }, '', '#' + token(name, props)); else history.replaceState({ k: key }, ''); } catch (_) {}
    mount(name, props, null, key);
  }
  window.__dcBoot = function () {
    PAGES = window.PAGES;
    try { history.scrollRestoration = 'manual'; } catch (_) {}
    start();
  };
})();
