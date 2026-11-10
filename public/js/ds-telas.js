// Telas do DS: as 142 composições (PUB…ORG) navegáveis, a partir do HTML do próprio canvas.
// Os botões seguem o destino que cada prancha indica ("Ação principal e destino" e "Ações secundárias");
// menu lateral e barra de abas seguem a navegação proposta nos hubs.
(function () {
  var S = window.__DS || [], BY = {};
  S.forEach(function (x, i) { x.i = i; BY[x.id] = x; });
  var AREAS = [['HUB', 'Hubs · a experiência principal de cada área'], ['PUB', 'Descoberta e site público'], ['ACC', 'Acesso, conta e cadastro'], ['REL', 'Convite, vínculo e preparação'], ['TRE', 'Trabalho do treinador'], ['ALU', 'App do aluno'], ['IA', 'IA do treinador'], ['FC', 'Comprador e aluno'], ['FT', 'Treinador vendedor e assinatura'], ['OPS', 'Operação e administração'], ['FA', 'Operação financeira'], ['ORG', 'Organizações'], ['ADM', 'Subtelas de administração (OPS e FA)']];
  // telas que também existem na versão interativa do protótipo
  var REAL = {
    PUB01: ['home', {}], PUB02: ['esporte', {}], PUB03: ['esporte', {}], PUB04: ['perfil', { id: 'rafael' }], PUB05: ['servico', { offer: 'online' }],
    ACC01: ['onboarding', { flow: 'aluno' }], ACC02: ['onboarding', { flow: 'treinador' }], ACC03: ['onboarding', { flow: 'treinador', scn: 'expirado' }], ACC04: ['onboarding', { flow: 'entrar' }],
    ACC05: ['onboarding', { flow: 'treinador', scn: 'dados' }], ACC06: ['onboarding', { flow: 'treinador', scn: 'cadastro' }], ACC07: ['onboarding', { flow: 'treinador', scn: 'incerto' }],
    ACC11: ['onboarding', { flow: 'treinador', scn: 'conta' }], ACC12: ['onboarding', { flow: 'treinador', scn: 'seguranca' }], ACC13: ['onboarding', { flow: 'treinador', scn: 'conta' }],
    ACC14: ['onboarding', { flow: 'convite', scn: 'compart' }], ACC15: ['onboarding', { flow: 'convite', scn: 'avisos' }],
    REL01: ['onboarding', { flow: 'treinador', scn: 'hoje' }], REL03: ['onboarding', { flow: 'convite' }], REL04: ['onboarding', { flow: 'convite', scn: 'aceito' }], REL07: ['onboarding', { flow: 'convite', scn: 'prep' }],
    ALU01: ['onboarding', { flow: 'convite', scn: 'alunohoje' }], TRE01: ['onboarding', { flow: 'treinador', scn: 'hoje' }],
    H01: ['home', {}], H02: ['perfil', { id: 'rafael' }], H03: ['onboarding', { flow: 'treinador', scn: 'hoje' }], H10: ['onboarding', { flow: 'convite', scn: 'alunohoje' }]
  };
  // navegação proposta (Hubs-indice): menu lateral e abas por papel
  var NAVMAP = {
    // destinos principais abrem o hub da área (H03…H16); o hub leva às composições
    trainer: { 'hoje': 'H03', 'alunos': 'H04', 'agenda': 'TRE19', 'mensagens': 'TRE25', 'rotinas': 'H06', 'exercicios': 'TRE10', 'formularios': 'TRE04', 'programas': 'H07', 'ofertas': 'TRE29', 'recebimentos': 'H09', 'insights': 'H08', 'perfil publico': '@perfil', 'conta e uso de ia': 'IA06', 'conteudo': 'H06', 'conta': '@conta' },
    student: { 'hoje': 'H10', 'treinos': 'ALU06', 'evolucao': 'H10E', 'mensagens': 'TRE25', 'conta': 'H11' },
    public: { 'explorar': 'H01', 'salvos': 'PUB07', 'conta': 'ACC02' },
    ops: { 'casos': 'H12', 'usuarios e perfis': 'H13', 'catalogo e fontes': 'H16', 'financeiro': 'H14', 'governanca': 'OPS14' }
  };
  var SPECIAL = { '@home': ['home', {}], '@perfil': ['perfil', { id: 'thiago' }], '@conta': ['onboarding', { flow: 'treinador', scn: 'conta' }] };
  var view = { id: '', st: 0, ficha: false, q: '', area: '' };
  var root = null, toastT = null;

  function norm(t) { return String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[“”"'’()…→↗·]/g, ' ').replace(/\s+/g, ' ').trim(); }
  function esc(t) { return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function imgs(h) { return String(h || '').replace(/\/_blob\/([0-9a-f]{32})/g, function (m, k) { return (window.__IMG && window.__IMG[k]) || ''; }); }
  function go(id, st) { if (window.NAV) window.NAV.go('telas', { id: id || '', st: st || 0 }, null); }
  function goTarget(t) {
    if (!t) return;
    if (SPECIAL[t]) return window.NAV.go(SPECIAL[t][0], SPECIAL[t][1], null);
    if (BY[t]) return go(t);
  }
  function toast(msg) {
    var el = root && root.querySelector('.dsv-toast'); if (!el) return;
    el.textContent = msg; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(function () { el.hidden = true; }, 2600);
  }
  function roleOf(x, html) {
    if (x.area === 'OPS' || x.area === 'FA' || x.area === 'ADM' || /^(OPS|FA)/.test(x.base || '')) return 'ops';
    if (/tabbar__it[^>]*>[\s\S]{0,80}Treinos/.test(html)) return 'student';
    if (/tabbar__it[^>]*>[\s\S]{0,80}Explorar/.test(html)) return 'public';
    if (x.area === 'ALU' || x.area === 'FC') return 'student';
    if (x.area === 'PUB') return 'public';
    return 'trainer';
  }

  // ---------- índice ----------
  function renderIndex() {
    var q = norm(view.q), area = view.area;
    var real = S.filter(function (x) { return REAL[x.id] || (window.REG && window.REG.has(x.id)); }).length;
    var groups = AREAS.filter(function (a) { return !area || a[0] === area; }).map(function (a) {
      var items = S.filter(function (x) { return x.area === a[0] && (!q || norm(x.id + ' ' + x.title + ' ' + x.mode).indexOf(q) >= 0); });
      if (!items.length) return '';
      return '<section class="dsv-grp"><div class="dsv-grp__h"><h2>' + esc(a[1]) + '</h2><span class="label">' + a[0] + ' · ' + items.length + (items.length === 1 ? ' tela' : ' telas') + '</span></div><div class="dsv-cards">' +
        items.map(function (x) {
          return '<button type="button" class="dsv-card" data-open="' + x.id + '"><span class="dsv-card__id">' + x.id + '</span><b>' + esc(x.title) + '</b><span class="dsv-card__m">' +
            (x.badges || []).slice(0, 3).map(function (b) { return '<span class="badge badge--plain">' + esc(b) + '</span>'; }).join('') + '</span>' +
            '<span class="dsv-card__f">' + (x.parent ? 'de ' + x.parent + ' · ' : '') + (x.area === 'HUB' ? 'desktop 1440 · ' : '') + (x.states.length + (x.area === 'HUB' ? 1 : 0)) + ' estados' + ((REAL[x.id] || (window.REG && window.REG.has(x.id))) ? ' · <span class="dsv-real">também interativa</span>' : '') + '</span></button>';
        }).join('') + '</div></section>';
    }).join('');
    root.innerHTML = '<div class="dsv-index"><div class="wrap">' +
      '<div class="dsv-ih"><span class="eyebrow">DS v4 · todas as composições</span><h1 class="dsv-h1">Telas do DS</h1><p class="dsv-lede">As ' + S.length + ' telas das pranchas PUB a ORG, cada uma com celular, desktop e os estados desenhados. Os botões seguem o destino que a própria prancha indica. ' + real + ' de ' + S.length + ' têm versão interativa: use “Abrir versão interativa” em cada tela.</p></div>' +
      '<div class="dsv-filters"><div class="input input--search dsv-search"><i class="ic ic--sm i-search" aria-hidden="true"></i><input type="search" placeholder="Buscar por ID ou nome" aria-label="Buscar tela" value="' + esc(view.q) + '"></div>' +
      '<div class="dsv-chips no-sb"><button type="button" class="chip' + (!area ? ' is-on' : '') + '" data-area="">Todas · ' + S.length + '</button>' +
      AREAS.map(function (a) { var n = S.filter(function (x) { return x.area === a[0]; }).length; return '<button type="button" class="chip' + (area === a[0] ? ' is-on' : '') + '" data-area="' + a[0] + '">' + a[0] + ' · ' + n + '</button>'; }).join('') + '</div></div>' +
      (groups || '<p class="dsv-empty">Nenhuma tela com “' + esc(view.q) + '”.</p>') + '</div></div><div class="dsv-toast toast" role="status" hidden></div>';
    var inp = root.querySelector('.dsv-search input');
    inp.addEventListener('input', function () { view.q = inp.value; var pos = inp.selectionStart; renderIndex(); var n = root.querySelector('.dsv-search input'); n.focus(); try { n.setSelectionRange(pos, pos); } catch (_) {} });
  }

  // ---------- tela ----------
  function ficha(x) {
    var li = function (arr) { return arr && arr.length ? '<ul>' + arr.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' : '<p class="dsv-muted">Sem itens na prancha.</p>'; };
    var subs = S.filter(function (y) { return y.parent === x.id; });
    var lk = (x.links || []).map(function (l) { return '<button type="button" class="dsv-lk" data-to="' + l[1] + '">' + esc(l[0]) + ' <span>→ ' + l[1] + (BY[l[1]] ? ' · ' + esc(BY[l[1]].title) : '') + '</span></button>'; }).join('');
    return '<aside class="dsv-ficha" aria-label="Ficha da tela"><div class="dsv-ficha__hd"><b>Ficha de ' + x.id + '</b><button type="button" class="icon-btn" data-act="ficha" aria-label="Fechar ficha"><i class="ic ic--sm i-x" aria-hidden="true"></i></button></div>' +
      '<div class="dsv-ficha__bd">' +
      '<div><span class="label">Ação principal e destino</span><p><b>' + esc(x.primary || '—') + '</b></p></div>' +
      (lk ? '<div><span class="label">Ir para</span><div class="dsv-lks">' + lk + '</div></div>' : '') +
      (subs.length ? '<div><span class="label">Subtelas · ' + subs.length + '</span><div class="dsv-lks">' + subs.map(function (y) { return '<button type="button" class="dsv-lk" data-to="' + y.id + '">' + esc(y.title) + ' <span>' + y.id + '</span></button>'; }).join('') + '</div></div>' : '') +
      (x.base && BY[x.base] ? '<div><span class="label">Composição base</span><div class="dsv-lks"><button type="button" class="dsv-lk" data-to="' + x.base + '">' + esc(BY[x.base].title) + ' <span>' + x.base + '</span></button></div></div>' : '') +
      (x.needs ? '<div><span class="label">Precisa constar</span><p>' + esc(x.needs) + '</p></div>' : '') +
      (x.textos && x.textos.length ? '<div><span class="label">Textos propostos</span><p>' + x.textos.map(function (t) { return '<span class="dsv-tx">' + esc(t) + '</span>'; }).join(' ') + '</p></div>' : '') +
      '<div><span class="label">Aceite</span>' + li(x.aceite) + '</div>' +
      (x.ponytail ? '<div><span class="label">Não fazer</span><p>' + esc(x.ponytail) + '</p></div>' : '') +
      '<div><span class="label">Situação</span><p>' + (x.badges || []).map(function (b) { return '<span class="badge badge--plain">' + esc(b) + '</span>'; }).join(' ') + (x.mode ? ' · ' + esc(x.mode) : '') + '</p></div>' +
      '</div></aside>';
  }
  function renderScreen() {
    var x = BY[view.id];
    if (!x) { view.id = ''; return renderIndex(); }
    var st = Math.max(0, Math.min(view.st || 0, x.states.length));
    var isState = st > 0, stx = isState ? x.states[st - 1] : null;
    var phone = imgs(isState ? stx.phone : x.phone), desk = imgs(x.desk);
    var prev = S[x.i - 1], next = S[x.i + 1];
    var chips = '<button type="button" class="chip' + (!isState ? ' is-on' : '') + '" data-st="0">' + esc(x.stateMain || 'Tela') + '</button>' + x.states.map(function (s2, i) { return '<button type="button" class="chip' + (st === i + 1 ? ' is-on' : '') + '" data-st="' + (i + 1) + '">' + esc(s2.label) + '</button>'; }).join('');
    var real = REAL[x.id] || (window.REG && window.REG.has(x.id) ? ['@reg', x.id] : null);
    root.innerHTML =
      '<div class="dsv-bar" role="region" aria-label="Navegação das telas do DS (fora do produto)"><div class="dsv-bar__in">' +
      '<div class="dsv-bar__top"><button type="button" class="btn btn--ghost btn--sm" data-act="index"><i class="ic ic--sm i-chev-l" aria-hidden="true"></i>Todas as telas</button>' +
      '<span class="dsv-id">' + x.id + '</span><b class="dsv-title">' + esc(x.title) + '</b>' +
      '<span class="dsv-bar__r">' + (real ? '<button type="button" class="btn btn--brand btn--sm" data-act="real">Abrir versão interativa</button>' : '') +
      '<button type="button" class="btn btn--outline btn--sm" data-act="ficha" aria-pressed="' + (view.ficha ? 'true' : 'false') + '">Ficha</button>' +
      '<button type="button" class="icon-btn dsv-nb" data-open="' + (prev ? prev.id : '') + '" aria-label="Tela anterior"' + (prev ? '' : ' disabled') + '><i class="ic ic--sm i-chev-l" aria-hidden="true"></i></button>' +
      '<button type="button" class="icon-btn dsv-nb" data-open="' + (next ? next.id : '') + '" aria-label="Próxima tela"' + (next ? '' : ' disabled') + '><i class="ic ic--sm i-chev-r" aria-hidden="true"></i></button></span></div>' +
      '<div class="dsv-states no-sb" role="group" aria-label="Estados desta tela"><span class="label">Estados</span>' + chips + '</div></div></div>' +
      '<div class="dsv-stage' + (isState ? ' is-state' : '') + (view.ficha ? ' has-ficha' : '') + '">' +
      '<div class="dsv-screen">' +
      (isState ? '' : '<div class="dsv-desk-wrap"><div class="w dsv-desk' + (x.area === 'HUB' ? ' dsv-desk--wide' : '') + '">' + desk + '</div></div>') +
      '<div class="dsv-ph-wrap"><div class="w phone phone--c dsv-ph">' + phone + '</div>' + (isState ? '<p class="dsv-cap"><span class="label">Estado</span> ' + esc(stx.label) + '</p>' : '') + '</div>' +
      '</div>' + (view.ficha ? ficha(x) : '') + '</div><div class="dsv-toast toast" role="status" hidden></div>';
    wire(x, root.querySelector('.dsv-screen'));
    fit();
  }
  function wire(x, scope) {
    var role = roleOf(x, x.phone + x.desk), nav = NAVMAP[role] || {};
    var lks = (x.links || []).map(function (l) { return [norm(l[0]), l[1]]; });
    var els = scope.querySelectorAll('a, .btn, .snav__it, .tabbar__it, .ocard, .lrow, .chip, .opt, .link-arrow, .cv-opt, [role="tab"], .utab, .tab, nav div, nav span');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.closest('.dsv-go') && el.closest('.dsv-go') !== el) continue;
      var t = norm(el.textContent).replace(/\s*\d+$/, '');
      var to = null;
      var inNav = !!el.closest('nav') && !el.classList.contains('btn') && el.tagName !== 'A';
      if (inNav) { if (el.children.length > 3 || !nav[t]) continue; to = nav[t]; }
      else if (el.classList.contains('snav__it') || el.classList.contains('tabbar__it')) to = nav[t] || null;
      var idm = !to && /\b([A-Z]{2,3}\d{2}(?:\.[A-Z])?)\b/.exec(el.textContent || ''); if (idm && BY[idm[1]] && idm[1] !== x.id) to = idm[1];
      if (!to && t) { for (var j = 0; j < lks.length; j++) { var L = lks[j][0]; if (L && (t === L || t.indexOf(L) === 0 || (L.length > 5 && t.indexOf(L) >= 0))) { to = lks[j][1]; break; } } }
      if (el.getAttribute('href') === '#') el.removeAttribute('href');
      if (to) { el.classList.add('dsv-go'); el.setAttribute('data-to', to); el.setAttribute('role', el.tagName === 'A' || el.tagName === 'SPAN' || el.tagName === 'DIV' ? 'link' : el.getAttribute('role') || 'link'); el.setAttribute('tabindex', '0'); }
      else if (el.tagName === 'A' || el.classList.contains('btn')) { el.classList.add('dsv-dead'); el.setAttribute('tabindex', '0'); el.setAttribute('role', 'button'); }
    }
  }
  function fit() {
    if (!root) return;
    var vw = document.documentElement.clientWidth;
    var phoneMode = vw < 900;
    root.classList.toggle('dsv--phone', phoneMode);
    var dw = root.querySelector('.dsv-desk-wrap'), dk = root.querySelector('.dsv-desk');
    if (dw && dk && !phoneMode) { var avail = dw.clientWidth; dk.style.zoom = Math.min(1, avail / (dk.classList.contains('dsv-desk--wide') ? 1440 : 1280)); }
    var ph = root.querySelector('.dsv-ph');
    if (ph) ph.style.zoom = phoneMode ? Math.min(1.7, vw / 284) : 1;
  }
  function onClick(e) {
    var b = e.target.closest('[data-act],[data-open],[data-st],[data-area],[data-to],.dsv-dead');
    if (!b || !root.contains(b)) return;
    e.preventDefault();
    if (b.hasAttribute('data-open')) { var id = b.getAttribute('data-open'); if (id) go(id); return; }
    if (b.hasAttribute('data-st')) { view.st = +b.getAttribute('data-st'); renderScreen(); return; }
    if (b.hasAttribute('data-area')) { view.area = b.getAttribute('data-area'); renderIndex(); return; }
    if (b.hasAttribute('data-to')) { goTarget(b.getAttribute('data-to')); return; }
    if (b.classList.contains('dsv-dead')) { toast('A prancha não indica destino para “' + (b.textContent || '').trim().slice(0, 40) + '”.'); return; }
    var a = b.getAttribute('data-act');
    if (a === 'index') go('');
    else if (a === 'ficha') { view.ficha = !view.ficha; renderScreen(); }
    else if (a === 'real') { if (window.REG && window.REG.has(view.id)) return window.GO(view.id); var r = REAL[view.id]; if (r) window.NAV.go(r[0], r[1], null); }
  }
  function onKey(e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('.dsv-go, .dsv-dead')) { e.preventDefault(); e.target.click(); }
  }
  var bound = false;
  window.DSV = {
    count: S.length,
    show: function (props) {
      root = document.getElementById('dsv'); if (!root) return;
      view.id = props && props.id || ''; view.st = props && props.st || 0;
      root.addEventListener('click', onClick); root.addEventListener('keydown', onKey);
      if (!bound) { bound = true; window.addEventListener('resize', fit); }
      if (view.id) renderScreen(); else renderIndex();
    }
  };
})();
