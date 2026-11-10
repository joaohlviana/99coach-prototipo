/* Dados reais + gravação local.
   - Treinadores: base real (amostra embutida ou public/data/treinadores.json gerado por `npm run sync`).
   - Perfil: detalhes buscados em /api/v1/trainers/:slug quando há rede (proxy do Vite) e guardados no aparelho.
   - Tudo o que é feito no app (cadastros, alunos, treinos, mensagens, ofertas...) fica salvo neste aparelho. */
(function () {
  'use strict';
  var LS = (function () { try { var k = '__c99'; window.localStorage.setItem(k, '1'); window.localStorage.removeItem(k); return window.localStorage; } catch (_) { return null; } })();
  function load(k, d) { try { var v = LS && LS.getItem(k); return v ? JSON.parse(v) : d; } catch (_) { return d; } }
  function save(k, v) { try { if (LS) LS.setItem(k, JSON.stringify(v)); return true; } catch (_) { return false; } }

  // ---------- treinadores ----------
  var FOTOS = window.__REAL_FOTOS || '';
  var LABEL = { crossfit: 'CrossFit', musculacao: 'Musculação', funcional: 'Funcional', corrida: 'Corrida', pilates: 'Pilates', yoga: 'Yoga', natacao: 'Natação', lutas: 'Lutas', ciclismo: 'Ciclismo', danca: 'Dança', jiujitsu: 'Jiu-Jitsu', escalada: 'Escalada' };
  var ALIAS = { 'jiu-jitsu': ['jiujitsu', 'lutas'], boxe: ['lutas'], 'muay-thai': ['lutas'], judo: ['lutas'], karate: ['lutas'], taekwondo: ['lutas'], mma: ['lutas'], 'krav-maga': ['lutas'], capoeira: ['lutas'], ballet: ['danca'], triatlo: ['corrida', 'natacao', 'ciclismo'], hidroginastica: ['natacao'] };
  var UF = { AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia', CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais', PA: 'Pará', PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina', SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins' };
  var items = [], byId = {}, cache = {};
  function fold(t) { return String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(); }
  function ui(sports) { var o = {}; (sports || []).forEach(function (s) { if (LABEL[s]) o[s] = 1; (ALIAS[s] || []).forEach(function (a) { o[a] = 1; }); }); return Object.keys(o); }
  function norm(r) {
    // linha compacta (amostra / sync) ou item da API
    if (Array.isArray(r)) return { id: r[0], name: r[1], ini: r[2], photo: r[3] ? (/^https?:/.test(r[3]) ? r[3] : FOTOS + r[3]) : '', spec: r[4] || '', raw: r[5] || [], city: r[6] || '', pres: (r[7] || '').indexOf('p') >= 0, onl: (r[7] || '').indexOf('o') >= 0, pub: r[8] || '' };
    return { id: r.slug, name: r.name, ini: r.initials || '', photo: r.photo || '', spec: r.specialty || '', raw: r.sports || [], city: r.city && r.city.label || '', pres: (r.formats || []).indexOf('presencial') >= 0, onl: (r.formats || []).indexOf('online') >= 0, pub: r.publishedAt || '' };
  }
  function setItems(rows) {
    items = []; byId = {}; cache = {};
    (rows || []).forEach(function (r) { var t = norm(r); if (!t.id || byId[t.id]) return; t.sports = ui(t.raw); byId[t.id] = t; items.push(t); if (t.photo) (window.__IMG = window.__IMG || {})[t.photo] = t.photo; });
  }
  setItems(window.__REAL || []);

  var REAL = {
    count: function () { return items.length; },
    has: function (id) { return !!byId[id]; },
    get: function (id) { return byId[id] || null; },
    // Home: mesmo formato da lista da vitrine
    home: function () {
      if (!items.length) return null;
      var mine = myTrainer();
      var key = mine ? mine.name + '|' + mine.city : '';
      if (cache.home && cache.homeKey === key) return cache.home;
      cache.homeKey = key;
      return (cache.home = (mine ? [mine] : []).concat(items.map(function (t) {
        return { id: t.id, name: t.name, spec: t.spec, city: t.city, pres: t.pres && !!t.city, onl: t.onl || !t.city, sports: t.sports, photo: t.photo || null, ini: t.ini, rating: null, n: 0, ver: false, imp: true,
          cref: 'Perfil importado: credencial não confirmada', av: 'unknown', avLong: 'Não informada', more: 0 };
      })));
    },
    // Esporte: mesmo formato da lista de resultados
    esporte: function () {
      if (!items.length) return null;
      return cache.esp || (cache.esp = items.map(function (t, i) {
        var f = []; if (t.pres && t.city) f.push('Presencial'); if (t.onl || !t.city) f.push('Online');
        return { id: t.id, name: t.name, ph: t.photo, ini: t.ini, spec: t.spec, mods: t.sports.map(function (s) { return LABEL[s]; }), city: t.city, area: '', fmts: f, langs: ['português'], avail: '', ad: '', imported: true, rating: '', reviews: 0,
          pub: t.pub, rank: i + 1, pos: [12 + (i * 37) % 76, 14 + (i * 53) % 70], trust: [['Perfil importado · não confirmado pelo profissional', 'imp']] };
      }));
    },
    // busca por nome, especialidade, modalidade ou cidade (sem acento, qualquer ordem de palavras)
    search: function (q, max) {
      var words = fold(q).split(' ').filter(Boolean); if (!words.length) return [];
      var out = [];
      for (var i = 0; i < items.length && out.length < (max || 6); i++) {
        var t = items[i], hay = t._h || (t._h = fold(t.name + ' ' + t.spec + ' ' + t.city + ' ' + t.sports.join(' ')));
        if (words.every(function (w) { return hay.indexOf(w) >= 0; })) out.push(t);
      }
      return out;
    },
    total: function (q) {
      var words = fold(q).split(' ').filter(Boolean); if (!words.length) return 0;
      return items.filter(function (t) { var hay = t._h || (t._h = fold(t.name + ' ' + t.spec + ' ' + t.city + ' ' + t.sports.join(' '))); return words.every(function (w) { return hay.indexOf(w) >= 0; }); }).length;
    },
    // cidades com treinadores, da mais numerosa para a menos
    cities: function (keep) {
      if (!items.length) return null;
      if (!cache.cit) {
        var n = {}; items.forEach(function (t) { if (t.city) n[t.city] = (n[t.city] || 0) + 1; });
        cache.cit = Object.keys(n).sort(function (a, b) { return n[b] - n[a] || a.localeCompare(b); }).slice(0, 12);
      }
      var L = cache.cit.slice(); if (keep && L.indexOf(keep) < 0) L.push(keep);
      return L.map(function (c) { var uf = c.split(', ')[1] || ''; return [c, (UF[uf] || uf) + ' · Brasil']; });
    },
    // Perfil público, no formato da página de Perfil
    perfil: function (id) {
      var t = byId[id]; if (!t) return null;
      var d = details[id] || {}, first = t.name.split(' ')[0];
      var fm = t.pres && t.onl ? 'Presencial e online' : (t.pres ? 'Presencial' : 'Online');
      var where = (d.serviceArea || []).map(function (w) { return [w.label, w.value]; });
      if (!where.length) { if (t.pres && t.city) where.push(['Presencial', t.city]); if (t.onl || !t.city) where.push(['Online', 'Todo o Brasil']); where.push(['Idioma', 'Português']); }
      if (d.externalHandle) where.push(['Contato público', 'Instagram ' + d.externalHandle + ' (abre fora da 99Coach)']);
      if (!details[id]) fetchDetail(id);
      return { id: id, name: t.name, first: first, photo: t.photo, ini: t.ini, role: (d.role || 'Profissional de atividade física') + ' · dados públicos importados', city: t.city || 'Atende online', formats: fm + ' (informação pública)', lang: 'Atende em português',
        avail: 'importado', imported: true, cref: 'na', avg: '', n: 0, ext: d.externalHandle || '',
        pitch: d.pitch || (t.spec ? first + ' atende ' + t.spec + (t.city ? ' em ' + t.city : ' online') + '.' : ''), bio: d.bio || '',
        offers: [], progs: [], creds: [], where: where, map: '', reviews: [] };
    }
  };
  window.REAL = REAL;

  // perfil publicado no cadastro deste aparelho, no formato da vitrine da Home (abre o perfil 'thiago' do cadastro)
  function myTrainer() {
    var st = window.__onbState;
    if (!st || st.flow !== 'treinador' || st.scn || !st.published || !st.name) return null;
    var sports = Object.keys(st.sports || {}).filter(function (k) { return st.sports[k]; });
    var s0 = (st.services || [])[0];
    return { id: 'thiago', name: st.name, spec: st.title || 'Treinador', city: st.city || '', pres: !!st.pres, onl: !!st.onl, sports: sports, photo: st.photoOk ? st.photoUrl : null,
      ini: st.name.split(' ').filter(Boolean).map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase(), rating: null, n: 0, ver: false,
      cref: st.cref ? 'CREF informado, ainda não verificado' : 'CREF não informado', av: st.avail === 'sim' ? 'yes' : (st.avail === 'nao' ? 'no' : 'unknown'), avLong: st.avail === 'sim' ? 'Aceita novos alunos' : 'Não informada',
      offP: s0 && s0.fmt !== 'online' ? [s0.title, 'R$ ' + s0.price, s0.kind === 'recorrente' ? '/ mês' : '/ sessão'] : undefined,
      offO: s0 && s0.fmt === 'online' ? [s0.title, 'R$ ' + s0.price, s0.kind === 'recorrente' ? '/ mês' : '/ sessão'] : undefined, more: Math.max(0, (st.services || []).length - 1) };
  }

  // ---------- identidade: quem se cadastrou aparece nas áreas logadas ----------
  function swap(root, pairs) {
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n;
    while ((n = w.nextNode())) {
      var v = n.nodeValue, o = v;
      for (var i = 0; i < pairs.length; i++) if (v.indexOf(pairs[i][0]) >= 0) v = v.split(pairs[i][0]).join(pairs[i][1]);
      if (v !== o) n.nodeValue = v;
    }
  }
  // qual área abrir para quem já tem conta neste aparelho (ou entrou com conta real)
  var ACCT = {
    area: function () {
      var t = STORE.loadOnb('treinador'), a = STORE.loadOnb('aluno'), roles = window.CONTA ? window.CONTA.roles() : [];
      if ((t && t.name && (t.conta || t.dadosSaved)) || roles.indexOf('treinador') >= 0) return 'treinador';
      if ((a && a.name && (a.conta || a.step === 'pronto' || a.step === 'alunoHoje')) || roles.indexOf('aluno') >= 0) return 'aluno';
      return null;
    },
    go: function () { var a = ACCT.area(); if (a && window.NAV) window.NAV.go(a, {}, null); }
  };
  window.ACCT = ACCT;
  var PUBLIC = { home: 1, esporte: 1, perfil: 1, servico: 1 };
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('#app button[data-minha-area]') : null;
    if (!b) return;
    e.stopPropagation(); e.preventDefault(); ACCT.go();
  }, true);

  // conta nova começa vazia: sem os alunos, mensagens, vendas e conteúdos de exemplo
  var OWN = 'alunos respostas avaliacoes arquivos notas participantes agenda conversas notificacoes t4_propostas t6_envios t6_repasses t6_casos t6_relatorios t7_jobs t7_insights t2_envios t2_respostas t2_notasHist t2_arquivos t1_convites t1_pedidos t1_encerrados t1_resolvidas t1_recibos t8_contatos t8_denuncias t8_bloqueios programas ofertas cupons rotinas'.split(' ');
  function startAccount() {
    if (ACCT.area() !== 'treinador' || !window.DB) return;
    var done = false; try { done = LS.getItem('c99.contaIniciada') === '1'; } catch (_) {}
    if (done) return;
    OWN.forEach(function (k) { if (Array.isArray(window.DB[k])) window.DB[k] = []; });
    var c = STORE.loadOnb('treinador');
    if (c && window.DB.trainer) { window.DB.trainer.name = c.name || window.DB.trainer.name; window.DB.trainer.first = (c.name || '').split(' ')[0] || window.DB.trainer.first; if (c.city) window.DB.trainer.city = c.city; }
    if (window.DB.insights) Object.assign(window.DB.insights, { visits: 0, visitsPrev: 0, contacts: 0, contactsPrev: 0, sales: 0, salesPrev: 0, revenue: 0, offers: [] });
    if (window.DB.t6_extrato && window.DB.t6_extrato.opening) Object.assign(window.DB.t6_extrato.opening, { rec: 0, lib: 0, ret: 0 });
    try { LS.setItem('c99.contaIniciada', '1'); } catch (_) {}
    STORE.saveDb();
  }
  window.__startAccount = startAccount;
  window.__applyMe = function () { applyMe(); };
  // quem aparece no rodapé do menu: a conta cadastrada, sem a foto de exemplo
  function applyMe() {
    var c = STORE.loadOnb('treinador');
    if (ACCT.area() === 'treinador' && c && c.name && window.ROLES && window.ROLES.treinador.me) {
      window.ROLES.treinador.me = { name: c.name, role: 'Treinador · ' + ((c.city || '').split(',')[0] || 'sem cidade'), photo: c.photoOk && c.photoUrl ? c.photoUrl : '' };
      if (c.photoOk && c.photoUrl) (window.__IMG = window.__IMG || {})[c.photoUrl] = c.photoUrl;
    }
  }

  window.__afterRender = function (page, root) {
    if (!window.STORE) return;
    applyMe();
    if (page === 'treinador' || page === 'onboarding') { var was = window.DB && window.DB.alunos && window.DB.alunos.length; startAccount(); if (page === 'treinador' && was && !window.DB.alunos.length) { setTimeout(rerender, 0); return; } }
    if (PUBLIC[page] && ACCT.area()) {
      var bs = root.querySelectorAll('button.btn--primary.btn--sm');
      for (var i = 0; i < bs.length; i++) if (/^(Entrar|Minha área)$/.test(bs[i].textContent.trim())) { bs[i].textContent = 'Minha área'; bs[i].setAttribute('data-minha-area', '1'); }
    }
    if (window.__demoIdent) return;
    var c;
    if (page === 'treinador' && (c = STORE.loadOnb('treinador')) && c.name && (c.conta || c.dadosSaved)) swap(root, [['Rafael Lima', c.name], ['Rafael', c.name.split(' ')[0]]]);
    if (page === 'aluno' && (c = STORE.loadOnb('aluno')) && c.name && (c.conta || c.step === 'pronto' || c.step === 'alunoHoje')) swap(root, [['Ana Carolina Souza', c.name], ['Ana Carolina', c.name], ['Ana', c.name.split(' ')[0]]]);
  };

  // detalhes do perfil (API real), guardados no aparelho
  var details = load('c99.perfis', {}), asked = {};
  function fetchDetail(id) {
    if (asked[id] || !window.fetch) return; asked[id] = 1;
    fetch('api/v1/trainers/' + encodeURIComponent(id)).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (!d || !d.slug) return;
      details[id] = { role: d.role, pitch: d.pitch, bio: d.bio, serviceArea: d.serviceArea, externalHandle: d.externalHandle };
      save('c99.perfis', details); rerender();
    }).catch(function () {});
  }
  function rerender() { if (window.__rerender) window.__rerender(); }

  // foto que não carrega (sem rede): volta para as iniciais
  document.addEventListener('error', function (e) {
    var el = e.target; if (!el || el.tagName !== 'IMG') return;
    var src = el.getAttribute('src') || '', hit = false;
    items.forEach(function (t) { if (t.photo && t.photo === src) { t.photo = ''; hit = true; } });
    if (hit) { cache = {}; rerender(); }
  }, true);

  // base completa gerada por `npm run sync`
  if (window.fetch) fetch('data/treinadores.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
    if (d && d.items && d.items.length) { window.__REAL_FOTOS = FOTOS = d.fotos || FOTOS; setItems(d.items); rerender(); }
  }).catch(function () {});

  // ---------- gravação local ----------
  var STORE = {
    // dados das áreas logadas (DB): grava a cada mudança, restaura na abertura
    saveDb: function () { if (!window.DB) return; var snap = JSON.stringify(window.DB); if (snap === STORE._last) return; STORE._last = snap; try { if (LS) LS.setItem('c99.db', snap); } catch (_) {} },
    loadDb: function () { var d = load('c99.db', null); if (!d || !window.DB) return; Object.keys(d).forEach(function (k) { window.DB[k] = d[k]; }); },
    clearDb: function () { try { if (LS) LS.removeItem('c99.db'); } catch (_) {} STORE._last = ''; },
    // cadastro (onboarding): conta, perfil do treinador e andamento
    // a senha nunca fica gravada no aparelho
    saveOnb: function (st) { if (st) { var c = Object.assign({}, st); delete c.pw; save('c99.cadastro.' + (st.flow || 'x'), c); } },
    loadOnb: function (flow) { return load('c99.cadastro.' + flow, null); },
    // preferências das telas públicas (salvos, cidade, modalidade)
    savePage: function (name, st) { save('c99.tela.' + name, st); },
    loadPage: function (name) { return load('c99.tela.' + name, null); },
    reset: function () { try { if (LS) Object.keys(LS).forEach(function (k) { if (k.indexOf('c99.') === 0 && k !== 'c99.perfis') LS.removeItem(k); }); } catch (_) {} }
  };
  window.STORE = STORE;
})();
