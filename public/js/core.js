/* Núcleo das áreas interativas (treinador, aluno, público, operação).
   Cada tela se registra com REG.screen({...}); a página monta o menu do papel, a barra de situações,
   a folha de confirmação e o aviso. Os dados vivem em DB (compartilhado entre páginas e preservado
   na navegação). GO('TRE03', { id: 'ana' }) abre a tela pelo ID do DS. */
(function () {
  'use strict';
  var screens = {}, byId = {}, order = {}, homes = {};
  var REG = {
    screen: function (def) {
      if (!def.page || !def.key) throw new Error('REG.screen precisa de page e key');
      def.scens = def.scens || [];
      screens[def.page + ':' + def.key] = def;
      (order[def.page] = order[def.page] || []).push(def.key);
      if (def.home) homes[def.page] = def.key;
      [def.id].concat(def.also || []).forEach(function (id) { if (id && !byId[id]) byId[id] = { page: def.page, key: def.key }; });
      return def;
    },
    get: function (page, key) { return screens[page + ':' + key] || null; },
    // tela inicial da página: a marcada com home: true (o hub), senão a primeira registrada
    first: function (page) { return screens[page + ':' + (homes[page] || (order[page] || [])[0])] || null; },
    list: function (page) { return (order[page] || []).map(function (k) { return screens[page + ':' + k]; }); },
    byId: byId,
    has: function (id) { return !!byId[id]; }
  };
  window.REG = REG;

  // ---------- dados ----------
  var seeds = {}, DB = {};
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  var DBAPI = {
    // DB.seed('cupons', [...]) registra a semente; DB.cupons passa a existir
    seed: function (name, value) { seeds[name] = clone(value); if (!(name in DB)) DB[name] = clone(value); return DB[name]; },
    reset: function (name) { if (name) DB[name] = clone(seeds[name]); else Object.keys(seeds).forEach(function (k) { DB[k] = clone(seeds[k]); }); },
    find: function (name, id) { return (DB[name] || []).find(function (x) { return x.id === id; }) || null; },
    uid: function (p) { return (p || 'n') + Math.random().toString(36).slice(2, 7); }
  };
  Object.keys(DBAPI).forEach(function (k) { Object.defineProperty(DB, k, { value: DBAPI[k], enumerable: false }); });
  window.DB = DB;

  // ---------- utilidades ----------
  var U = {
    now: function () { var d = new Date(); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); },
    today: 'segunda, 26 de outubro', todayShort: '26/10', // data fixa só na demonstração; no produto vale a data de hoje (ver abaixo)
    val: function (e) { return e && e.target ? (e.target.type === 'checkbox' ? !!e.target.checked : e.target.value) : ''; },
    ini: function (name) { return String(name || '').split(' ').filter(Boolean).map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase(); },
    money: function (n) { var v = Number(n) || 0; return 'R$ ' + v.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.').replace(',00', ''); },
    plural: function (n, one, many) { return n + ' ' + (n === 1 ? one : many); },
    img: function (k) { return (window.__IMG && window.__IMG[k]) || ''; },
    norm: function (t) { return String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim(); },
    cls: function () { return Array.prototype.filter.call(arguments, Boolean).join(' '); },
    // data curta daqui a n dias (dd/mm)
    dateShort: function (n) { var d = new Date(Date.now() + (n || 0) * 864e5); return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2); }
  };
  window.U = U;

  // ---------- navegação ----------
  var DIRECT = { home: 1, esporte: 1, perfil: 1, servico: 1, onboarding: 1, telas: 1 };
  function GO(target, params) {
    params = params || {};
    if (!window.NAV) return;
    if (target === '@sair') return SIGN_OUT();
    if (target === 'H05' && /^lk_/.test(String(params.id || ''))) return window.NAV.go('treinador', { s: 'alunoreal', id: params.id }, null);
    if (target === 'TRE15' && !document.documentElement.classList.contains('demo') && window.ACCT && window.ACCT.area() === 'treinador' && window.CONTA && window.CONTA.session()) {
      window.__rotinaPick = (params && params.rotina) || '';
      if (/^lk_/.test(String((params && params.id) || ''))) return window.NAV.go('treinador', { s: 'alunoreal', id: params.id }, null);
      var real = (DB.alunos || []).filter(function (a) { return a && a.server; });
      if (real.length === 1) return window.NAV.go('treinador', { s: 'alunoreal', id: real[0].id }, null);
      NOTICE(real.length ? 'Escolha o aluno: a rotina já vem selecionada na tela dele.' : 'Você ainda não tem alunos conectados. Convide um aluno para atribuir esta rotina.');
      return window.NAV.go('treinador', { s: 'alunos' }, null);
    }
    if (target === 'TRE20' && !document.documentElement.classList.contains('demo') && window.ACCT && window.ACCT.area() === 'treinador' && window.CONTA && window.CONTA.session()) return window.NAV.go('treinador', { s: 'agendareal' }, null);
    // diretriz: IA só para o treinador e desligada até ser configurada e avaliada
    if (!document.documentElement.classList.contains('demo') && /^(IA\d|H15$)/.test(target || '')) return NOTICE('A assistência de IA está desligada até ser configurada e avaliada. Todo o trabalho manual continua disponível.');
    if (target && target.charAt(0) === '@') { var pg = target.slice(1); return window.NAV.go(pg, params, null); }
    if (DIRECT[target]) return window.NAV.go(target, params, null);
    var r = byId[target];
    if (r) return window.NAV.go(r.page, Object.assign({ s: r.key }, params), null);
    var demo = document.documentElement.classList.contains('demo');
    // tela ainda sem versão interativa: no produto avisa; na demonstração abre a composição do DS
    if (!demo) return NOTICE('Esta parte ainda não está disponível nesta versão.');
    window.NAV.go('telas', { id: target }, null);
  }
  window.GO = GO;

  // aviso discreto, independente da tela
  var noticeT = 0;
  function NOTICE(msg) {
    var el = document.getElementById('c99-aviso');
    if (!el) { el = document.createElement('div'); el.id = 'c99-aviso'; el.setAttribute('role', 'status'); el.className = 'alert alert--info'; document.body.appendChild(el); }
    el.textContent = msg; el.hidden = false;
    clearTimeout(noticeT); noticeT = setTimeout(function () { el.hidden = true; }, 5000);
  }
  window.NOTICE = NOTICE;

  // sair: encerra a sessão no servidor e apaga deste aparelho os dados da conta (outra pessoa não herda nada)
  function SIGN_OUT() {
    window.__signingOut = true;
    var done = function () {
      try { Object.keys(window.localStorage).forEach(function (k) { if (/^c99\./.test(k) && !/^c99\.(demo|semdemo)$/.test(k)) window.localStorage.removeItem(k); }); } catch (_) {}
      location.hash = ''; location.reload();
    };
    if (window.CONTA) window.CONTA.signOut().then(done, done); else done();
  }
  window.SIGN_OUT = SIGN_OUT;

  // ---------- arquivos gerados (CSV de relatórios, cópia de arquivo enviado) ----------
  // No visualizador de artefatos, salvar arquivo passa pela capacidade "downloads" (o visualizador confirma).
  // Fora dele (teste local), o download comum do navegador continua valendo.
  var DL = null;
  function askDownloads() {
    try { if (window.claude && window.claude.use) window.claude.use('downloads').then(function (d) { if (d) DL = d; }, function () {}); } catch (_) {}
  }
  askDownloads(); setTimeout(askDownloads, 1500); setTimeout(askDownloads, 5000);
  function saveVia(name, data) {
    return DL.save({ filename: name, data: data }).catch(function (e) { if (e && e.code !== 'declined') console.warn('downloads', e); });
  }
  // SAVE_FILE(nome, texto|Blob): true quando o visualizador cuidou do arquivo
  window.SAVE_FILE = function (name, data) { if (!DL) return false; saveVia(name, data); return true; };
  if (document.addEventListener) document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('#app a[download]') : null;
    if (!a || !DL) return;
    var href = a.getAttribute('href') || '';
    if (!/^(blob:|data:)/.test(href)) return;
    e.preventDefault();
    fetch(href).then(function (r) { return r.blob(); }).then(function (b) { saveVia(a.getAttribute('download') || 'arquivo.csv', b); });
  }, true);

  // ---------- papéis: menu lateral (desktop) e abas (celular) ----------
  // cada item: [rótulo, ícone, destino (ID do DS ou @página), chave de "nav" que acende o item]
  var ROLES = {
    treinador: {
      label: 'Navegação do treinador', me: { name: 'Rafael Lima', role: 'Treinador · Londrina', photo: 'bdc7ef1c8dbf05558c3bf8d575fc3a04' },
      side: [
        { sec: 'Trabalho', items: [['Hoje', 'home', 'H03', 'hoje'], ['Alunos', 'users', 'H04', 'alunos', 'alunos'], ['Agenda', 'calendar', 'TRE20', 'agenda'], ['Mensagens', 'message', 'TRE25', 'mensagens', 'mensagens']] },
        { sec: 'Conteúdo', items: [['Rotinas', 'clipboard', 'H06', 'rotinas'], ['Exercícios', 'dumbbell', 'TRE10', 'exercicios'], ['Formulários', 'file', 'TRE04', 'formularios']] },
        { sec: 'Negócio', items: [['Programas', 'book', 'H07', 'programas'], ['Ofertas', 'tag', 'TRE29', 'ofertas'], ['Recebimentos', 'card', 'H09', 'recebimentos', 'recebimentos'], ['Insights', 'chart', 'H08', 'insights']] },
        { sec: 'Conta', items: [['Assistência de IA', 'sparkle', 'H15', 'ia'], ['Conta e perfil', 'user', 'tmenu', 'conta']] }
      ],
      tabs: [['Hoje', 'home', 'H03', 'hoje'], ['Alunos', 'users', 'H04', 'alunos'], ['Conteúdo', 'book', 'H06', 'rotinas'], ['Mensagens', 'message', 'TRE25', 'mensagens'], ['Conta', 'user', 'tmenu', 'conta']],
      // no celular, "Conteúdo" e "Conta" agrupam os destinos que estão no menu lateral
      tabOf: { exercicios: 'rotinas', formularios: 'rotinas', agenda: 'conta', programas: 'conta', ofertas: 'conta', recebimentos: 'conta', insights: 'conta', ia: 'conta' },
      // produto: só destinos com dados reais
      sideReal: [
        { sec: 'Trabalho', items: [['Hoje', 'home', 'H03', 'hoje'], ['Alunos', 'users', 'H04', 'alunos', 'alunos'], ['Agenda', 'calendar', 'TRE20', 'agenda']] },
        { sec: 'Conteúdo', items: [['Rotinas', 'clipboard', 'H06', 'rotinas'], ['Exercícios', 'dumbbell', 'TRE10', 'exercicios']] },
        { sec: 'Negócio', items: [['Insights', 'chart', 'H08', 'insights']] },
        { sec: 'Conta', items: [['Conta e perfil', 'user', 'tmenu', 'conta']] }
      ]
    },
    aluno: {
      label: 'Navegação do aluno', me: { name: 'Ana Carolina Souza', role: 'Aluna · Acompanhamento online', photo: '' },
      side: [{ sec: 'Meu acompanhamento', items: [['Hoje', 'home', 'H10', 'hoje'], ['Treinos', 'dumbbell', 'ALU06', 'treinos'], ['Evolução', 'trend', 'H10E', 'evolucao'], ['Mensagens', 'message', 'ALU05', 'mensagens', 'amsg']] },
        { sec: 'Conta', items: [['Minhas contratações', 'card', 'H11', 'contratacoes'], ['Encontrar treinador', 'search', '@home', 'buscar'], ['Conta e preferências', 'user', 'amenu', 'conta']] }],
      tabs: [['Hoje', 'home', 'H10', 'hoje'], ['Treinos', 'dumbbell', 'ALU06', 'treinos'], ['Evolução', 'trend', 'H10E', 'evolucao'], ['Mensagens', 'message', 'ALU05', 'mensagens'], ['Conta', 'user', 'amenu', 'conta']],
      tabOf: { contratacoes: 'conta', buscar: 'conta' },
      sideReal: [{ sec: 'Meu acompanhamento', items: [['Hoje', 'home', 'H10', 'hoje'], ['Treinos', 'dumbbell', 'ALU06', 'treinos'], ['Evolução', 'trend', 'H10E', 'evolucao'], ['Mensagens', 'message', 'ALU05', 'mensagens', 'amsg']] },
        { sec: 'Conta', items: [['Encontrar treinador', 'search', '@home', 'buscar'], ['Favoritos', 'heart', 'PUB07', 'salvos'], ['Conta', 'user', 'amenu', 'conta']] }]
    },
    publico: {
      label: 'Navegação pública', me: null,
      side: null,
      tabs: [['Explorar', 'search', 'H01', 'explorar'], ['Salvos', 'heart', 'PUB07', 'salvos'], ['Conta', 'user', '@onboarding', 'conta']],
      tabOf: { programas: 'explorar', ajuda: 'explorar' },
      top: [['Explorar', 'H01', 'explorar'], ['Programas', 'PUB15', 'programas'], ['Salvos', 'PUB07', 'salvos'], ['Ajuda', 'PUB11', 'ajuda']]
    },
    operacao: {
      label: 'Navegação da operação', me: { name: 'Lia Moura', role: 'Operação · Moderação', photo: '' },
      side: [
        { sec: 'Mesa', items: [['Casos', 'alert', 'H12', 'casos', 'casos'], ['Usuários e perfis', 'users', 'H13', 'usuarios']] },
        { sec: 'Catálogo', items: [['Catálogo e fontes', 'folder', 'H16', 'catalogo']] },
        { sec: 'Dinheiro', items: [['Financeiro', 'bank', 'H14', 'financeiro']] },
        { sec: 'Regras', items: [['Governança', 'shield', 'OPS14', 'governanca'], ['Organizações', 'grid', 'ORG01', 'org']] }
      ],
      tabs: null
    }
  };
  window.ROLES = ROLES;
  var COUNTS = {}; // contadores do menu: COUNTS.alunos = function(){ return 3 }
  window.NAVCOUNT = function (k, fn) { COUNTS[k] = fn; };

  // ---------- fábrica de página ----------
  // conta real ainda sem histórico: telas que têm a situação "Primeiro uso" abrem nela, sem números inventados
  function firstUse(scr) {
    if (!scr || document.documentElement.classList.contains('demo') || !window.ACCT || !window.ACCT.area()) return '';
    // só enquanto a conta não tem o dado daquela tela; depois a tela mostra o que a pessoa criou
    var noPeople = function () { return !(DB.alunos || []).length && !(DB.t1_convites || []).length && !(DB.t1_pedidos || []).length; };
    var empty = { alunos: noPeople, hoje: noPeople,
      recebimentos: function () { return !(DB.t6_envios || []).length && !((DB.t6_extrato || {}).extra || []).length; }, insights: function () { return true; } };
    // aluno: enquanto a conta não tem vínculo confirmado no servidor, as telas do dia a dia abrem vazias
    if (scr.page === 'aluno') return scr.key === 'contratacoes' && !(DB.contratacoes || []).length ? 'vazio' : '';
    if (scr.page === 'treinador' && !(empty[scr.key] || function () { return false; })()) return '';
    if (scr.page !== 'treinador') return '';
    var keys = (scr.scens || []).map(function (x) { return x[0]; });
    return keys.indexOf('novo') >= 0 ? 'novo' : (keys.indexOf('primeiro') >= 0 ? 'primeiro' : '');
  }
  // produto: a data é a de hoje (a demonstração mantém a data fixa dos exemplos)
  (function () {
    var real = function (short) { var d = new Date(); if (short) return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2); try { return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).replace('-feira', ''); } catch (_) { return real(true); } };
    var demo = function () { return document.documentElement.classList.contains('demo'); };
    Object.defineProperty(U, 'today', { get: function () { return demo() ? 'segunda, 26 de outubro' : real(false); }, configurable: true });
    Object.defineProperty(U, 'todayShort', { get: function () { return demo() ? '26/10' : real(true); }, configurable: true });
  })();
  window.TODAY = function () { var t = U.today; return t.charAt(0).toUpperCase() + t.slice(1); };
  // telas que ainda só existem com dados de exemplo: no produto não abrem (nem digitando o endereço)
  var DEMO_ONLY = {
    treinador: { ft03: 'recebimentos', ft04: 'recebimentos', ft05: 'recebimentos', ft06: 'recebimentos', ft07: 'recebimentos', ft08: 'recebimentos', ft10: 'recebimentos', ft12: 'recebimentos', organizacao: 'hoje', social: 'hoje', mensagens: 'alunos', ia: 'hoje', ia02: 'hoje', ia03: 'hoje', ia04: 'hoje', ia05: 'hoje', ia06: 'hoje', ia07: 'hoje', agenda: 'agendareal', insights: 'insightsreal', credenciais: 'credreal', convites: 'convitesreal',
      // ainda sem dados reais no servidor: no produto não abrem com conteúdo de exemplo
      formularios: 'hoje', formEditor: 'hoje', respostas: 'hoje', avaliacoes: 'hoje', arquivos: 'hoje', notas: 'hoje', calendario: 'hoje', macro: 'hoje', programas: 'hoje', programaEditor: 'hoje', publicacao: 'hoje', participantes: 'hoje', notificacoes: 'hoje', ofertas: 'hoje', cupons: 'hoje', proposta: 'hoje', reivindicar: 'credreal', denunciar: 'hoje' },
    aluno: { fc01: 'semvinculo', fc02: 'semvinculo', fc03: 'semvinculo', fc04: 'semvinculo', fc05: 'semvinculo', fc06: 'semvinculo', fc08: 'semvinculo', fc09: 'semvinculo', fc10: 'semvinculo', pedir: 'semvinculo', contratacoes: 'semvinculo' }
  };
  window.MODPAGE = function (page, role) {
    return {
      init: function (c) { c.state = { scn: c.props.scn || '', sheet: null, toast: '', v: 0, ui: {} }; },
      render: function (c) {
        var props = c.props, st = c.state;
        var scr = REG.get(page, props.s) || REG.first(page);
        if (scr && DEMO_ONLY[page] && DEMO_ONLY[page][scr.key] && !document.documentElement.classList.contains('demo')) {
          var alt = REG.get(page, DEMO_ONLY[page][scr.key]);
          if (alt) { if (['agenda', 'insights', 'credenciais', 'convites'].indexOf(scr.key) < 0 && !c.__blk) { c.__blk = 1; var why = scr.key === 'mensagens' ? 'As conversas ficam na tela de cada aluno: abra o aluno para conversar.' : 'Esta parte ainda não está disponível.'; setTimeout(function () { NOTICE(why); }, 0); } scr = alt; }
        }
        // aluno com conta real e sem vínculo: o dia a dia só existe depois do vínculo
        if (page === 'aluno' && !document.documentElement.classList.contains('demo') && window.ACCT && (window.ACCT.area() || (window.ACCT.hasLink && window.ACCT.hasLink()))
          && scr && ['hoje', 'sessao', 'execucao', 'encerrar', 'evolucao', 'mensagens', 'programas', 'treinador', 'agenda', 'conteudo', 'formulario'].indexOf(scr.key) >= 0) {
          var navFrom = typeof scr.nav === 'function' ? 'hoje' : (scr.nav || 'hoje');
          scr = REG.get('aluno', 'semvinculo'); props = Object.assign({}, props, { navFrom: navFrom });
        }
        var R = ROLES[role];
        var set = function (o) { c.setState(o); };
        var ui = st.ui || {};
        var ctx = {
          page: page, props: props, p: props, id: props.id || '', scn: st.scn || firstUse(scr), st: st, ui: ui, db: DB, U: U,
          set: set,
          // estado de interface da tela (rascunhos, abas, filtros): ctx.setUi({ aba: 'x' })
          setUi: function (o) { c.setState({ ui: Object.assign({}, c.state.ui, o) }); },
          refresh: function () { c.setState({ v: (c.state.v || 0) + 1 }); },
          go: GO,
          back: function () { if (window.NAV) window.NAV.back(); },
          toast: function (m) { c.setState({ toast: m }); },
          // folha de confirmação: ctx.ask({ title, text, lines:[], ok:'Confirmar', danger:false, brand:false (vermelho só para conversão), onOk(){}, cancel:'Cancelar' })
          ask: function (o) { c.setState({ sheet: o }); },
          closeAsk: function () { c.setState({ sheet: null }); },
          scenario: function (id) { c.setState({ scn: id }); }
        };
        var v = {}, err = '';
        if (scr) { try { v = scr.vals(ctx) || {}; } catch (e) {
          // tela de detalhe sem o dado que ela precisa (conta nova, item removido): volta para o início da área
          var hub = REG.first(page);
          if (scr !== hub && !document.documentElement.classList.contains('demo')) {
            scr = hub; props = Object.assign({}, props, { s: hub.key, id: '' });
            try { v = scr.vals(Object.assign(ctx, { props: props, p: props, id: '' })) || {}; if (!st.toast) st.toast = 'Ainda não há dados para abrir essa tela.'; } catch (e2) { console.error(e2); err = String(e2 && e2.message || e2); }
          } else { console.error(e); err = String(e && e.message || e); }
        } }
        var is = {}; REG.list(page).forEach(function (s) { is[s.key] = !!scr && s.key === scr.key; });
        var navKey = scr && (typeof scr.nav === 'function' ? scr.nav(ctx) : scr.nav) || '';
        var mk = function (it) {
          var on = it[3] === navKey, cnt = it[4] && COUNTS[it[4]] ? COUNTS[it[4]]() : 0;
          return { label: it[0], ic: 'ic ic--sm i-' + it[1], cls: 'v4-reset snav__it' + (on ? ' is-on' : ''), cur: on ? 'page' : 'false', hasCount: !!cnt, count: String(cnt || ''), go: function () { GO(it[2] === 'tmenu' || it[2] === 'amenu' ? (page === 'treinador' ? 'TMENU' : 'AMENU') : it[2]); } };
        };
        var tabKey = R && R.tabOf && R.tabOf[navKey] || navKey;
        var tabs = (R && R.tabs || []).map(function (it) {
          var on = it[3] === tabKey;
          return { label: it[0], ic: 'ic ic--sm i-' + it[1], cls: 'v4-reset tabbar__it' + (on ? ' is-on' : ''), cur: on ? 'page' : 'false', go: function () { GO(it[2] === 'tmenu' ? 'TMENU' : (it[2] === 'amenu' ? 'AMENU' : it[2])); } };
        });
        var demoOn = document.documentElement.classList.contains('demo');
        var allowed = function (it) { return demoOn || it[2] !== 'H15'; };
        var side = ((R && !document.documentElement.classList.contains('demo') && R.sideReal) || (R && R.side) || []).map(function (g) { return { sec: g.sec, items: g.items.filter(allowed).map(mk) }; });
        var top = (R && R.top || []).map(function (it) { var on = it[2] === navKey; return { label: it[0], cls: 'v4-reset mod-top__it' + (on ? ' is-on' : ''), cur: on ? 'page' : 'false', go: function () { GO(it[1]); } }; });
        var scens = scr ? [['', scr.normal || 'Uso normal']].concat(scr.scens).map(function (sc) {
          var on = (st.scn || '') === sc[0];
          return { label: sc[1], cls: 'chip' + (on ? ' is-on' : ''), on: String(on), pick: function () { c.setState({ scn: sc[0], sheet: null, toast: '', ui: {} }); } };
        }) : [];
        var sh = st.sheet;
        var me = R && R.me ? { name: R.me.name, role: R.me.role, ini: U.ini(R.me.name), photo: R.me.photo ? U.img(R.me.photo) : '', hasPhoto: !!(R.me.photo && U.img(R.me.photo)), noPhoto: !(R.me.photo && U.img(R.me.photo)) } : { name: '', role: '', ini: '', photo: '', hasPhoto: false, noPhoto: true };
        var back = scr && scr.back ? (typeof scr.back === 'function' ? scr.back(ctx) : scr.back) : '';
        return {
          isPub: role === 'publico', isOps: role === 'operacao', hasSide: side.length > 0,
          rootCls: 'w v4 onb onb--app mod mod--' + role + (scr && scr.wide ? ' mod--wide' : '') + (scr && scr.form ? ' onb--form' : '') + (sh ? ' has-sheet' : ''),
          is: is, v: v, err: err, hasErr: !!err,
          title: scr ? scr.title : '', dsId: scr ? scr.id : '',
          scens: scens, hasScens: scens.length > 1,
          openDs: function () { if (scr && scr.id) window.NAV.go('telas', { id: scr.id }, null); },
          reset: function () { DB.reset(); c.setState({ scn: '', sheet: null, toast: '', ui: {}, v: (c.state.v || 0) + 1 }); },
          side: side, tabs: tabs, hasTabs: tabs.length > 0, top: top, hasTop: top.length > 0, navLabel: R ? R.label : '', me: me,
          goHome: function () { GO('@home'); },
          skipTo: function () { try { var el = document.getElementById('conteudo'); if (el) { el.setAttribute('tabindex', '-1'); el.focus(); } } catch (_) {} },
          mtop: { title: scr ? (typeof scr.mtitle === 'function' ? scr.mtitle(ctx) : (scr.mtitle || scr.title)) : '', hasBack: !!back, noBack: !back, back: function () { if (back === 'history') ctx.back(); else GO(back, scr.backParams ? scr.backParams(ctx) : {}); } },
          // menu rotulado da operação no celular
          opsMenu: (R && R.side && role === 'operacao') ? [].concat.apply([], R.side.map(function (g) { return g.items.map(function (it) { return { label: g.sec + ' · ' + it[0], on: String(it[3] === navKey), cls: 'mod-om__it' + (it[3] === navKey ? ' is-on' : ''), go: function () { c.setState({ ui: Object.assign({}, c.state.ui, { __om: false }) }); GO(it[2]); } }; }); })) : [],
          omOpen: !!ui.__om, toggleOm: function () { c.setState({ ui: Object.assign({}, c.state.ui, { __om: !ui.__om }) }); },
          omLabel: (scr && scr.title) || 'Menu',
          sheetOn: !!sh, shTitle: sh ? sh.title : '', shText: sh ? (sh.text || '') : '', shHasText: !!(sh && sh.text), shLines: sh ? (sh.lines || []) : [], shHasLines: !!(sh && sh.lines && sh.lines.length),
          shOk: sh ? (sh.ok || 'Confirmar') : '', shOkCls: 'btn ' + (sh && sh.danger ? 'btn--outline mod-danger' : (sh && sh.brand ? 'btn--brand' : 'btn--primary')), shCancel: sh ? (sh.cancel || 'Cancelar') : '', shHasCancel: !!(sh && sh.cancel !== false),
          shDoOk: function () { var f = sh && sh.onOk; c.setState({ sheet: null }); if (f) f(); },
          closeSheet: function () { c.setState({ sheet: null }); },
          toastOn: !!st.toast, toastMsg: st.toast, closeToast: function () { c.setState({ toast: '' }); }
        };
      }
    };
  };
})();
