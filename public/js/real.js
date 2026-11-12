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
  var LABEL = {}; (window.SPORTS ? window.SPORTS.list : []).forEach(function (x) { LABEL[x.id] = x.label; });
  var ALIAS = { 'jiu-jitsu': ['lutas'], boxe: ['lutas'], 'muay-thai': ['lutas'], judo: ['lutas'], karate: ['lutas'], taekwondo: ['lutas'], mma: ['lutas'], 'krav-maga': ['lutas'], capoeira: ['lutas'], ballet: ['danca'], triatlo: ['corrida', 'natacao', 'ciclismo'], hidroginastica: ['natacao'], esgrima: ['lutas'], futsal: ['futebol'], 'volei-de-praia': ['volei'] };
  var UF = { AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia', CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais', PA: 'Pará', PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina', SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins' };
  var items = [], byId = {}, cache = {};
  function fold(t) { return String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(); }
  function ui(sports) { var o = {}; (sports || []).forEach(function (s) { var id = window.SPORTS ? window.SPORTS.idOfSlug(s) : s; if (LABEL[id]) o[id] = 1; (ALIAS[s] || []).forEach(function (a) { o[a] = 1; }); }); return Object.keys(o); }
  function norm(r) {
    // linha compacta (amostra / sync) ou item da API
    if (Array.isArray(r)) return { id: r[0], name: r[1], ini: r[2], photo: '', /* perfil importado: sem foto até o titular enviar ou autorizar (avatar neutro com as iniciais) */ spec: r[4] || '', raw: r[5] || [], city: r[6] || '', pres: (r[7] || '').indexOf('p') >= 0, onl: (r[7] || '').indexOf('o') >= 0, pub: r[8] || '' };
    return { id: r.slug, name: r.name, ini: r.initials || '', photo: r.imported === false ? (r.photo || '') : '', spec: r.specialty || '', raw: r.sports || [], city: r.city && r.city.label || '', pres: (r.formats || []).indexOf('presencial') >= 0, onl: (r.formats || []).indexOf('online') >= 0, pub: r.publishedAt || '' };
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
    // outros profissionais reais do mesmo esporte (mesma cidade primeiro)
    similar: function (id, max) {
      var me = byId[id]; if (!me) return [];
      var sp = me.sports[0], a = [], b2 = [];
      for (var i = 0; i < items.length && a.length < (max || 4); i++) { var t = items[i]; if (t.id === id || (sp && t.sports.indexOf(sp) < 0)) continue; if (me.city && t.city === me.city) a.push(t); else if (b2.length < (max || 4)) b2.push(t); }
      return a.concat(b2).slice(0, max || 4).map(function (t) { return { id: t.id, name: t.name, spec: t.spec, city: t.city, photo: t.photo, ini: t.ini, sport: LABEL[t.sports[0]] || '' }; });
    },
    // quantos treinadores por esporte (id do app)
    sportCounts: function () {
      if (!items.length) return null;
      if (!cache.cnt) { var n = {}; items.forEach(function (t) { t.sports.forEach(function (k) { n[k] = (n[k] || 0) + 1; }); }); cache.cnt = n; }
      return cache.cnt;
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
      if (live[id] || d.imported === false) {
        var of = (d.offers || [])[0] || (live[id] && (live[id].headlineOffers || [])[0]) || null;
        var price = of && of.price != null ? of.price : (of && of.priceCents != null ? 'R$ ' + (of.priceCents / 100).toLocaleString('pt-BR') : null);
        return { id: id, name: t.name, first: first, photo: t.photo, ini: t.ini, role: (d.role || 'Treinador'), city: t.city || 'Atende online', formats: fm, lang: 'Atende em português',
          avail: 'desconhecida', imported: false, realLive: true, receives: !!(d.receivesRequests || (live[id] && live[id].receivesRequests)), cref: d.credentials && d.credentials.length ? 'inf' : 'nao', avg: '', n: 0, ext: d.externalHandle || '',
          offerTxt: of ? (of.title || 'Acompanhamento') + ' · ' + (price ? price + (of.unit ? ' / ' + ({ mes: 'mês', sessao: 'sessão', aula: 'aula' }[of.unit] || of.unit) : '') : 'Sob consulta') : 'Condições combinadas no pedido',
          pitch: d.pitch || (t.spec ? first + ' atende ' + t.spec + (t.city ? ' em ' + t.city : ' online') + '.' : ''), bio: d.bio || '', offers: [], progs: [], creds: [], where: where, map: '', reviews: [] };
      }
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
    go: function () { var a = ACCT.area(); if (a && window.NAV) window.NAV.go(a, {}, null); },
    // vínculo confirmado no servidor (ainda não ligado nesta versão: convites e vínculos são o próximo passo)
    hasLink: function () { return !!ACCT.myTrainer(); },
    myTrainer: function () { var L = window.CONTA ? window.CONTA.cachedLinks() : []; for (var i = 0; i < L.length; i++) if (L[i].mine === 'aluno') return L[i]; return null; }
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
    if (!ACCT.area() || !window.DB) return;
    var doneA = false; try { doneA = LS.getItem('c99.contaAlunoIniciada') === '1'; } catch (_) {}
    if (!doneA) {
      ['contratacoes', 'meusTreinos', 'a2_pedidos', 'a2_pedidosAcomp', 'a2_reembolsos'].forEach(function (k) { if (Array.isArray(window.DB[k])) window.DB[k] = []; });
      try { LS.setItem('c99.contaAlunoIniciada', '1'); } catch (_) {}
      STORE.saveDb();
    }
    if (ACCT.area() !== 'treinador') return;
    var done = false; try { done = LS.getItem('c99.contaIniciada') === '1'; } catch (_) {}
    if (done) return;
    // mantém o que veio do servidor (vínculos e pedidos reais); tira só o conteúdo de exemplo
    OWN.forEach(function (k) { if (Array.isArray(window.DB[k])) window.DB[k] = window.DB[k].filter(function (x) { return x && x.server; }); });
    var c = STORE.loadOnb('treinador');
    if (c && window.DB.trainer) { window.DB.trainer.name = c.name || window.DB.trainer.name; window.DB.trainer.first = (c.name || '').split(' ')[0] || window.DB.trainer.first; if (c.city) window.DB.trainer.city = c.city; }
    if (window.DB.insights) Object.assign(window.DB.insights, { visits: 0, visitsPrev: 0, contacts: 0, contactsPrev: 0, sales: 0, salesPrev: 0, revenue: 0, offers: [] });
    if (window.DB.t6_extrato && window.DB.t6_extrato.opening) Object.assign(window.DB.t6_extrato.opening, { rec: 0, lib: 0, ret: 0 });
    try { LS.setItem('c99.contaIniciada', '1'); } catch (_) {}
    STORE.saveDb();
  }
  window.__startAccount = startAccount;

  // vínculos reais: o treinador vê os alunos conectados na lista (sem dados inventados)
  function mergeLinks(L) {
    if (!window.DB || !Array.isArray(window.DB.alunos)) return;
    (L || []).filter(function (l) { return l.mine === 'treinador'; }).forEach(function (l) {
      var id = 'lk_' + l.id; if (window.DB.alunos.some(function (a) { return a.id === id; })) return;
      var since = l.since ? new Date(l.since) : null;
      window.DB.alunos.push({ id: id, server: true, name: l.studentName, first: String(l.studentName).split(' ')[0], status: l.status === 'pausado' ? 'pausado' : 'ativo',
        svc: 'Acompanhamento · ' + (l.origin === 'convite' ? 'por convite' : 'por pedido'), since: since ? ('0' + (since.getMonth() + 1)).slice(-2) + '/' + since.getFullYear() : '',
        goal: '', city: '', age: null, program: '', week: null, adherence: null, lastCheckin: '', next: 'Preparação pendente', flag: null, tags: [], prepDone: false, payment: '', photo: '' });
    });
  }
  // pedidos reais: entram na fila de pedidos do treinador
  function mergeRequests(R) {
    if (!window.DB || !Array.isArray(window.DB.t1_pedidos)) return;
    (R || []).filter(function (x) { return x.mine === 'treinador'; }).forEach(function (x) {
      var id = 'rq_' + x.id, cur = window.DB.t1_pedidos.filter(function (p) { return p.id === id; })[0];
      var st = x.status === 'pendente' ? 'pendente' : (x.status === 'aceito' ? 'aceito' : 'recusado');
      if (cur) { cur.status = st; return; }
      var d = new Date(x.at), due = x.due ? new Date(x.due) : null;
      window.DB.t1_pedidos.unshift({ id: id, server: x.id, aluno: '', name: x.studentName, origin: 'Perfil', offer: '', offerTxt: x.offer, msg: x.message || '(sem mensagem)',
        at: d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }), due: due ? 'responder até ' + due.toLocaleDateString('pt-BR') : '', goal: '', city: '', status: st, result: st === 'aceito' ? 'Aceito' : (st === 'recusado' ? 'Recusado' : '') });
    });
  }
  function refreshLinks() {
    if (!window.CONTA || !window.CONTA.session()) return;
    Promise.all([window.CONTA.links(), window.CONTA.requests()]).then(function (x) { mergeLinks(x[0]); mergeRequests(x[1]); window.__myRequests = x[1]; rerender(); });
  }
  window.__refreshLinks = refreshLinks;
  // só depois que todos os módulos carregaram (a fila de pedidos e a lista de alunos já existem)
  var bootSync = function () { mergeLinks(window.CONTA ? window.CONTA.cachedLinks() : []); refreshLinks(); };
  if (document.readyState === 'complete') setTimeout(bootSync, 0); else window.addEventListener('load', bootSync);
  window.__applyMe = function () { applyMe(); };
  // quem aparece no rodapé do menu: a conta cadastrada, sem a foto de exemplo
  function applyMe() {
    var a = STORE.loadOnb('aluno'), area = ACCT.area();
    if (area && window.ROLES && window.ROLES.aluno && !document.documentElement.classList.contains('demo')) {
      var nm = (a && a.name) || ((STORE.loadOnb('treinador') || {}).name) || 'Sua conta';
      window.ROLES.aluno.me = { name: nm, role: ACCT.hasLink() ? 'Com acompanhamento' : 'Sem acompanhamento ainda', photo: '' };
    }
    var c = STORE.loadOnb('treinador');
    if (ACCT.area() === 'treinador' && c && c.name && window.ROLES && window.ROLES.treinador.me) {
      window.ROLES.treinador.me = { name: c.name, role: 'Treinador · ' + ((c.city || '').split(',')[0] || 'sem cidade'), photo: c.photoOk && c.photoUrl ? c.photoUrl : '' };
      if (c.photoOk && c.photoUrl) (window.__IMG = window.__IMG || {})[c.photoUrl] = c.photoUrl;
    }
  }

  // Onde isto é salvo: telas que ainda guardam só no navegador dizem isso sempre, no produto (plano V08/V11).
  var LOCAL = {
    treinador: { conteudo: 1, editor: 1, exercicios: 1, exercicio: 1, exercicioNovo: 1, formularios: 1, formEditor: 1, historico: 1, ofertas: 1, cupons: 1, proposta: 1, programas: 1, programaEditor: 1, publicacao: 1, participantes: 1, notificacoes: 1, perfilEditar: 1, perfilPrevia: 1, credenciais: 1, disponibilidade: 1, calendario: 1, macro: 1 },
    aluno: { contratacoes: 1 }, publico: { salvos: 1, vistos: 1 }
  };
  var LOCALTXT = {
    mensagens: ['As conversas ficam na tela de cada aluno', 'Abra o aluno em Alunos para conversar: é lá que as mensagens são enviadas e recebidas de verdade.'],
    recebimentos: ['Recebimentos ainda não estão ligados', 'Nenhuma venda é processada pela 99coach por enquanto, então não há valores a mostrar. Nada aqui é cobrado.'],
    insights: ['Sem base ainda', 'Os números aparecem quando houver visitas, pedidos e alunos reais. Enquanto isso não mostramos zero nem percentual.'],
    ft01: ['Recebimentos ainda não estão ligados', 'Este cadastro é só uma prévia: nenhum dado bancário é pedido nem guardado.'],
    ft09: ['Recebimentos ainda não estão ligados', 'Esta tela é só uma prévia: nenhum dado bancário é pedido nem guardado.'],
    ft11: ['Assinatura ainda não está à venda', 'Pro por R$ 99/mês ou R$ 990/ano é o preço decidido, mas nada é cobrado por enquanto. Sua conta segue no Essencial, grátis.']
  };
  function whereSaved(page, root) {
    if (document.documentElement.classList.contains('demo') || !ACCT.area()) return;
    var key = (location.hash || '').slice(1).split('-')[1] || '';
    var txt = page === 'treinador' && LOCALTXT[key] ? LOCALTXT[key] : (LOCAL[page] && LOCAL[page][key] ? ['Salvo só neste aparelho', 'O que você cria ou muda aqui ainda não vai para o servidor: não aparece em outro aparelho e some se você limpar o navegador.'] : null);
    var m = root.querySelector('#conteudo'); if (!txt || !m || m.querySelector('.c99-onde')) return;
    var d = document.createElement('div'); d.className = 'alert alert--info c99-onde'; d.setAttribute('role', 'note');
    var i = document.createElement('i'); i.className = 'ic ic--sm i-info'; i.setAttribute('aria-hidden', 'true');
    var w = document.createElement('div'), b = document.createElement('b'); b.textContent = txt[0]; w.appendChild(b); w.appendChild(document.createTextNode(txt[1]));
    d.appendChild(i); d.appendChild(w); m.insertBefore(d, m.firstChild);
  }

  function tickRest() {
    var els = document.querySelectorAll('.c99-rest[data-until]');
    for (var i = 0; i < els.length; i++) {
      var left = Math.ceil((Number(els[i].getAttribute('data-until')) - Date.now()) / 1000);
      els[i].textContent = left > 0 ? 'Descanso: ' + Math.floor(left / 60) + ':' + ('0' + (left % 60)).slice(-2) + ' ' : 'Descanso concluído ';
    }
  }
  setInterval(tickRest, 500);

  window.__afterRender = function (page, root) {
    if (!window.STORE) return;
    applyMe();
    whereSaved(page, root); tickRest();
    // título da aba acompanha a página (plano SEO: título descreve o que a pessoa está vendo)
    try { var h1 = root.querySelector('h1'); var tt = h1 ? h1.textContent.replace(/\s+/g, ' ').trim() : ''; document.title = page === 'home' || !tt ? '99coach — encontre seu treinador' : tt + ' | 99coach'; } catch (_) {}
    if (page === 'aluno') startAccount();
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
      details[id] = { role: d.role, pitch: d.pitch, bio: d.bio, serviceArea: d.serviceArea, externalHandle: d.externalHandle, imported: d.imported, receivesRequests: d.receivesRequests, offers: d.offers, credentials: d.credentials };
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

  // catálogo ao vivo: perfis cadastrados no app (não importados) entram no topo, com dados publicados reais
  var live = {};
  function fetchLive() {
    if (!window.fetch) return;
    var got = [], cursor = null, page = 0;
    var next = function () {
      var u = 'api/v1/search?pageSize=40' + (cursor ? '&cursor=' + encodeURIComponent(cursor) : '');
      return fetch(u).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
        if (!d) return;
        (d.items || []).forEach(function (t) { if (t.imported === false) got.push(t); });
        cursor = d.nextCursor; page++;
        if (cursor && page < 4) return next();
      });
    };
    next().then(function () {
      if (!got.length) return;
      got.forEach(function (t) { live[t.slug] = t; });
      var rows = got.concat(items.filter(function (x) { return !live[x.id]; }).map(function (x) { return [x.id, x.name, x.ini, x.photo, x.spec, x.raw, x.city, (x.pres ? 'p' : '') + (x.onl ? 'o' : ''), x.pub]; }));
      setItems(rows); rerender();
    }).catch(function () {});
  }
  REAL.isLive = function (id) { return !!live[id]; };
  setTimeout(fetchLive, 0);

  // base completa gerada por `npm run sync`
  if (window.fetch) fetch('data/treinadores.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
    if (d && d.items && d.items.length) { window.__REAL_FOTOS = FOTOS = d.fotos || FOTOS; var lv = Object.keys(live).map(function (k) { return live[k]; }); setItems(lv.concat(d.items)); rerender(); }
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
