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
  // Medição de uso no PostHog: só com a chave do projeto e fora da demonstração. Nada fica gravado no aparelho
  // (sem cookie nem armazenamento); quem está com a conta aberta é reconhecido pelo id da conta, sem nome nem e-mail.
  // Campos de formulário não são lidos e não há gravação de tela.
  try {
    var PHK = window.__PH;
    if (PHK && !demo && !window.posthog) {
      // trecho oficial do PostHog (posthog.com/docs/libraries/js), sem alterações
      !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],Object.defineProperty(u,"toString",{configurable:!0,enumerable:!0,writable:!0,value:function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e}}),Object.defineProperty(u.people,"toString",{configurable:!0,enumerable:!0,writable:!0,value:function(){return u.toString(1)+".people (stub)"}}),o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagResult isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
      // defaults: o conjunto de padrões recomendado pelo PostHog nessa data (inclui a visita de página a cada troca de tela)
      window.posthog.init(PHK, { api_host: 'https://us.i.posthog.com', defaults: '2026-08-30', persistence: 'memory', person_profiles: 'identified_only', disable_session_recording: true, disable_surveys: true,
        loaded: function (p) { try { var s = JSON.parse(window.localStorage.getItem('c99.sessao') || 'null'); if (s && s.user && s.user.id) p.identify(s.user.id); } catch (_) { } } });
    }
  } catch (_) { }
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
  // área com conta (/app) no domínio internacional: abre no idioma em que a pessoa estava (inglês por padrão)
  try {
    var R0 = window.__ROTAS, ih = R0 && R0.intl ? R0.intl.replace(/^https?:\/\//, '') : '';
    if (window.__LANG) { if (ih && location.host === ih) localStorage.setItem('c99.lang', window.__LANG); }
    else if (ih && location.host === ih) { window.__LANG = localStorage.getItem('c99.lang') || 'en'; var ap = document.getElementById('app'); if (ap) ap.lang = window.__LANG; }
  } catch (_) { }
  var LANG = window.__LANG || '';
  var dic = LANG ? fetch('/data/i18n-' + LANG + '.json' + V).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }) : Promise.resolve(null);
  function traduzir(d) {
    var T = d.t || {}, P = (d.p || []).map(function (x) { return [new RegExp('^' + x[0] + '$'), x[1]]; });
    var SOBRA_PT = /(^|[^A-Za-zÀ-ú])(você|não|para|com|sem|seu|sua|seus|suas|ainda|são|está|estão|por|que|uma|um|os|as|em|no|na|nos|nas|ao|aos|às|foi|já|mais|este|esta|esse|essa|isso|até|ou|como|quando|treino|treinos|aluno|alunos|treinador|hoje|ontem|amanhã|semana|semanas|sessão|sessões|mês|meses|dias|dia|versão|preço|acesso|feita|feito|pelo|pela)([^A-Za-zÀ-ú]|$)/i;
    // país no fim de um lugar ("Miami, Estados Unidos", "presencial em Estados Unidos"): troca só o nome do país
    var CP = d.c || {}, CPRE = null; try { var nomes = Object.keys(CP).sort(function (x, y) { return y.length - x.length; }).map(function (x) { return x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }); if (nomes.length) CPRE = new RegExp('(, | in | en )(' + nomes.join('|') + ')(?![A-Za-zÀ-ú])', 'g'); } catch (_) { }
    var tr = function (s) { var r = tr0(s); return CPRE && /, | in | en /.test(r) ? r.replace(CPRE, function (_, a, n) { return a + CP[n]; }) : r; };
    var tr0 = function (s) {
      var k = s.replace(/\s+/g, ' ').trim(); if (!k || k.length > 400) return s;
      var v = T[k];
      // padrões com números e nomes: $1 copia o trecho, $t1 traduz o trecho, $l1 traduz cada item de uma lista "a, b, c"
      if (v === undefined) for (var i = 0; i < P.length; i++) { var m = P[i][0].exec(k); if (m) {
        // um trecho que deveria ser traduzido e continuou em português derruba o padrão (nada de frase meio a meio)
        var falhou = false, w = P[i][1].replace(/\$([tl]?)(\d)/g, function (_, t, n) { var g = m[+n] || ''; if (!t) return g; var r = t === 't' ? tr(g).trim() : g.split(', ').map(function (x) { return tr(x).trim(); }).join(', '); if (r === g.trim() && SOBRA_PT.test(g)) falhou = true; return r; });
        if (!falhou) { v = w; break; }
      } }
      // frases montadas no código com nomes e números ("Aguardando a resposta de " + nome): traduz os pedaços conhecidos
      if (v === undefined) v = pedacos(k);
      if (v === undefined) return s;
      var a = /^\s*/.exec(s)[0], b = /\s*$/.exec(s)[0];
      return a + v + b;
    };
    // Pedaços de frase (dicionário das áreas com conta). Os longos valem em qualquer ponto do texto; os curtos, só no
    // começo ou no fim. Só vale quando os pedaços cobrem boa parte do texto: nome, mensagem ou nota de alguém não muda.
    var F = {}, IDX = null, FMAX = 0;
    var letras = function (x) { return (x.match(/[A-Za-zÀ-ú]/g) || []).length; };
    var pedacos = function (k) {
      if (!IDX) return undefined;
      var coberto = 0, y = '', resto = '', i = 0, n, c, j, achou;
      // pedaços longos em qualquer ponto (índice pelos 4 primeiros caracteres; o mais longo ganha)
      while (i < k.length) {
        c = IDX[k.substr(i, 4)]; achou = '';
        if (c) for (j = 0; j < c.length; j++) if (k.startsWith(c[j], i)) { achou = c[j]; break; }
        if (achou) { y += F[achou]; coberto += letras(achou); i += achou.length; resto += ' | '; } else { y += k.charAt(i); resto += k.charAt(i); i++; }
      }
      // pedaços curtos só nas pontas
      var ini = '', fim = '';
      for (n = Math.min(9, y.length - 1); n >= 3 && !ini; n--) { var p = y.slice(0, n); if (F[p] !== undefined && k.slice(0, n) === p && letras(p) >= 2) ini = p; }
      if (ini) { coberto += letras(ini); y = F[ini] + y.slice(ini.length); resto = resto.slice(ini.length); }
      for (n = Math.min(9, y.length - 1); n >= 2 && !fim; n--) { var q = y.slice(-n); if (F[q] !== undefined && k.slice(-n) === q && letras(q) >= 2) fim = q; }
      if (fim) { coberto += letras(fim); y = y.slice(0, y.length - fim.length) + F[fim]; resto = resto.slice(0, Math.max(0, resto.length - fim.length)); }
      if (!coberto || coberto * 2 < letras(k)) return undefined;
      // se o que sobrou ainda tem português (e não só um nome, número ou data), a frase fica inteira como estava:
      // melhor em português do que meio a meio
      if (SOBRA_PT.test(resto) || /(^|[^A-Za-zÀ-ú@.\d_-])[a-zà-ú]{4,}([^A-Za-zÀ-ú@\d_-]|$)/.test(resto)) return undefined;
      return y;
    };
    // segundo dicionário (painel do treinador, área do aluno, cadastro): entra depois, só quando a pessoa vai para lá
    window.__trMais = function (d2) {
      var k, h; IDX = IDX || {};
      // textos inteiros também valem como pedaço (o código junta frases prontas com nomes e números)
      for (k in (d2.t || {})) { if (T[k] === undefined) T[k] = d2.t[k]; if (k.length >= 10 && F[k] === undefined) { F[k] = d2.t[k]; h = k.substr(0, 4); (IDX[h] = IDX[h] || []).push(k); } }
      for (k in (d2.f || {})) { F[k] = d2.f[k]; if (k.length >= 10) { h = k.substr(0, 4); (IDX[h] = IDX[h] || []).push(k); } }
      for (k in IDX) IDX[k].sort(function (x, y) { return y.length - x.length; });
      tudo(document.body);
    };
    var ATTR = ['placeholder', 'aria-label', 'title', 'alt', 'data-tip'];
    // fora da tradução: o HTML do servidor (já vem no idioma) e o que as pessoas escrevem (mensagens, notas, campos)
    var fora = function (el) { return !el || (el.closest && el.closest('#ssr,[data-no-tr],script,style,textarea,[contenteditable],.a1-msg__b,.a1-msg__m,.t2-pre,.t1-wrap')); };
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
    // dicionário das áreas com conta: baixa quando a pessoa entra em /app ou abre uma área (painel, área do aluno)
    var pediu = false, conta = function () {
      if (pediu) return; pediu = true;
      fetch('/data/i18n-' + LANG + '-conta.json' + V).then(function (r) { return r.ok ? r.json() : null; }).then(function (d2) { if (d2) window.__trMais(d2); }).catch(function () { pediu = false; });
    };
    var ver = function () { if (location.pathname === '/app') conta(); };
    ['pushState', 'replaceState'].forEach(function (m) { var o = history[m]; history[m] = function () { var r = o.apply(this, arguments); ver(); return r; }; });
    addEventListener('popstate', ver); addEventListener('hashchange', ver); ver();
    window.__dicConta = conta;
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
