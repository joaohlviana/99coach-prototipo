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
  // fotos ficam no nosso armazenamento; o arquivo do catálogo guarda só o caminho
  var FOTOS = 'https://rycaxboqkkiopjdecgld.supabase.co/storage/v1/object/public/trainer-photos/';
  // caminho antigo (sem a pasta) e novo (com a pasta) apontam para o mesmo lugar
  function foto(v) { return !v ? '' : (/^https?:/.test(v) ? v : FOTOS + (v.indexOf('legado/') === 0 ? v : 'legado/' + v)); }
  function norm(r) {
    // linha compacta (amostra / sync) ou item da API
    if (Array.isArray(r)) return { id: r[0], name: r[1], ini: r[2], photo: foto(r[3]), ext: r[10] || '', spec: r[4] || '', raw: r[5] || [], pais: r[11] || '', city: r[11] ? (r[12] || '') : (r[6] || ''), /* fora do Brasil: "Cidade, País" */ pres: (r[7] || '').indexOf('p') >= 0, onl: (r[7] || '').indexOf('o') >= 0, pub: r[8] || '', own: !!r[9] && r[9] !== 'importado' };
    return { id: r.slug, name: r.name, ini: r.initials || '', photo: (r.imported === false || String(r.photo || '').indexOf(FOTOS) === 0) ? (r.photo || '') : '', spec: r.specialty || '', raw: r.sports || [], city: r.city && r.city.label || '', pres: (r.formats || []).indexOf('presencial') >= 0, onl: (r.formats || []).indexOf('online') >= 0, pub: r.publishedAt || '', own: r.imported === false };
  }
  // perfis tirados do ar depois do último build (pedido de remoção ou decisão da equipe) somem na hora
  var HID = {}, lastRows = null;
  function setItems(rows) {
    lastRows = rows;
    items = []; byId = {}; cache = {};
    (rows || []).forEach(function (r) { var t = norm(r); if (!t.id || byId[t.id] || HID[t.id]) return; t.sports = ui(t.raw); byId[t.id] = t; items.push(t); if (t.photo) (window.__IMG = window.__IMG || {})[t.photo] = t.photo; });
  }
  // a amostra embutida só vale na demonstração; no produto a lista espera o catálogo de verdade (a tela mostra esqueletos)
  setItems(document.documentElement.classList.contains('demo') ? (window.__REAL || []) : []);
  setTimeout(function () {
    if (!window.CONTA || !window.CONTA.rpc) return;
    window.CONTA.rpc('hidden_trainer_slugs', {}).then(function (r) {
      var L = r && r.ok && Array.isArray(r.data) ? r.data : [];
      if (!L.length) return;
      L.forEach(function (x) { var k = typeof x === 'string' ? x : (x && x.hidden_trainer_slugs); if (k) HID[k] = 1; });
      setItems(lastRows); rerender();
    }, function () {});
  }, 0);

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
        return { id: t.id, name: t.name, spec: t.spec, city: t.city, pres: t.pres && !!t.city, onl: t.onl, pais: t.pais || '', sports: t.sports, photo: t.photo || null, ini: t.ini, rating: null, n: 0, ver: false, imp: true,
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
        var f = []; if (t.pres && t.city) f.push('Presencial'); if (t.onl) f.push('Online'); /* sem formato informado: não inferimos 'online' */
        return { id: t.id, name: t.name, ph: t.photo, ini: t.ini, spec: t.spec, mods: t.sports.map(function (s) { return LABEL[s]; }), city: t.city, area: '', fmts: f, langs: t.pais ? [] : ['português'], pais: t.pais || '', avail: '', ad: '', imported: true, rating: '', reviews: 0,
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
    // ---------- lugares fora do Brasil: país ("PAIS:US") e cidade ("Miami, Estados Unidos") ----------
    // nome do país em português
    paisNome: function (cc, l) { try { return new Intl.DisplayNames([l || 'pt-BR'], { type: 'region' }).of(cc) || cc; } catch (_) { return cc; } },
    // como mostrar um lugar escolhido
    lugar: function (c) { return /^PAIS:/.test(c || '') ? REAL.paisNome(c.slice(5)) : (c || ''); },
    // países com treinadores: [código, nome, quantos], do que tem mais para o que tem menos
    paises: function () {
      if (cache.paises) return cache.paises;
      var n = {}, cid = {}; items.forEach(function (t) { if (t.pais) { n[t.pais] = (n[t.pais] || 0) + 1; if (t.city) cid[t.city] = t.pais; } });
      cache.cidPais = cid;
      return (cache.paises = Object.keys(n).sort(function (a, b) { return n[b] - n[a]; }).map(function (cc) { return [cc, REAL.paisNome(cc), n[cc]]; }));
    },
    // país de uma cidade de fora do Brasil ('' para cidade do Brasil)
    paisDe: function (c) { REAL.paises(); return (cache.cidPais || {})[c] || ''; },
    // países que combinam com o que a pessoa digitou (nome, sigla ou apelido: "eua", "usa", "uk")
    paisesPara: function (q) {
      var k = fold(q); if (k.length < 2) return [];
      var AP = { US: 'eua usa us estados unidos america', GB: 'uk reino unido inglaterra gra bretanha england', AE: 'emirados dubai', NL: 'holanda paises baixos', DE: 'alemanha germany', ES: 'espanha spain', FR: 'franca france', IT: 'italia italy', JP: 'japao japan', CH: 'suica', IE: 'irlanda ireland', NZ: 'nova zelandia new zealand', ZA: 'africa do sul south africa', MX: 'mexico', CA: 'canada', AU: 'australia', PT: 'portugal' };
      return REAL.paises().filter(function (p) { var h = fold(p[1]) + ' ' + p[0].toLowerCase() + ' ' + (AP[p[0]] || '') + ' ' + fold(REAL.paisNome(p[0], 'en')) + ' ' + fold(REAL.paisNome(p[0], 'es')); return h.split(' ').some(function (w) { return w.indexOf(k) === 0; }) || fold(p[1]).indexOf(k) === 0 || (AP[p[0]] || '').indexOf(k) === 0 || fold(REAL.paisNome(p[0], 'en')).indexOf(k) === 0 || fold(REAL.paisNome(p[0], 'es')).indexOf(k) === 0; });
    },
    // endereço de um lugar de fora: país -> "pais-us"; cidade -> "miami-us" (a mesma chave das páginas do servidor)
    chaveLugar: function (c) {
      if (/^PAIS:/.test(c || '')) return 'pais-' + c.slice(5).toLowerCase();
      var cc = REAL.paisDe(c); if (!cc) return '';
      var EN = { 'Lisboa': 'Lisbon', 'Cidade do Cabo': 'Cape Town', 'Amsterdã': 'Amsterdam', 'New York City': 'New York' };
      var s = String(c).replace(/^currently in\s+/i, '').trim(), i = s.lastIndexOf(', '), nome = (i > 0 ? s.slice(0, i) : s).trim();
      return fold(EN[nome] || nome).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + cc.toLowerCase();
    },
    // o caminho de volta: "pais-us" -> "PAIS:US"; "miami-us" -> "Miami, Estados Unidos" ('' se ainda não dá para saber)
    lugarDaChave: function (k) {
      var m = /^pais-([a-z]{2})$/.exec(k || ''); if (m) return 'PAIS:' + m[1].toUpperCase();
      REAL.paises(); var cid = cache.cidPais || {};
      for (var c in cid) if (REAL.chaveLugar(c) === k) return c;
      return '';
    },
    // cidades com treinadores, da mais numerosa para a menos
    cities: function (keep, q, uf) {
      if (!items.length) return null;
      if (!cache.cit) {
        var n = {}; items.forEach(function (t) { if (t.city) n[t.city] = (n[t.city] || 0) + 1; });
        cache.citAll = Object.keys(n).sort(function (a, b) { return n[b] - n[a] || a.localeCompare(b); });
        cache.cit = cache.citAll.slice(0, 12);
      }
      var plain = function (x) { return String(x || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(); };
      var L;
      var pool = uf ? cache.citAll.filter(function (c) { return c.slice(-4) === ', ' + uf; }) : cache.citAll;
      var PA = [];
      if (plain(q)) { var k = plain(q); L = pool.filter(function (c) { return plain(c).indexOf(k) >= 0; }).slice(0, 12);
        // país que combina com o que foi digitado vem antes das cidades ("eua", "estados unidos", "canadá")
        if (!uf) PA = REAL.paisesPara(q).slice(0, 3).map(function (p) { return ['PAIS:' + p[0], 'País · ' + p[2].toLocaleString('pt-BR') + (p[2] === 1 ? ' treinador' : ' treinadores')]; }); }
      else if (uf) { L = pool.slice(0, 40); }
      else { L = cache.cit.slice(); if (keep && L.indexOf(keep) < 0) L.push(keep); }
      return PA.concat(L.map(function (c) { var uf = c.split(', ').slice(-1)[0] || ''; return [c, UF[uf] ? UF[uf] + ' · Brasil' : uf]; }));
    },
    // estados com profissional, do que tem mais para o que tem menos
    ufs: function () {
      if (!items.length) return [];
      if (!cache.ufs) { var n = {}; items.forEach(function (t) { var u = (t.city || '').split(', ')[1]; if (u && t.pres) n[u] = (n[u] || 0) + 1; }); cache.ufs = Object.keys(n).sort(function (a, b) { return n[b] - n[a] || a.localeCompare(b); }).map(function (u) { return [u, n[u]]; }); }
      return cache.ufs;
    },
    // Perfil público, no formato da página de Perfil
    perfil: function (id) {
      var t = byId[id]; if (!t) { if (window.__sliceReady && window.__sliceReady() && REAL.needAll) REAL.needAll(); return null; }
      var d = details[id] || {}, first = t.name.split(' ')[0];
      var fm = t.pres && t.onl ? 'Presencial e online' : (t.pres ? 'Presencial' : (t.onl ? 'Online' : ''));
      var where = (d.serviceArea || []).map(function (w) { return [w.label, w.value]; });
      if (!where.length) { if (t.pres && t.city) where.push(['Presencial', t.city]); if (t.onl) where.push(['Online', 'Informado no perfil']); if (!where.length) where.push(['Local', 'Não informado']); }
      if (d.externalHandle) where.push(['Contato público', 'Instagram ' + d.externalHandle]);
      if (!details[id]) fetchDetail(id);
      // perfil criado no cadastro (não importado) nunca aparece como importado, mesmo antes dos detalhes chegarem
      if (live[id] || d.imported === false || t.own) {
        var of = (d.offers || [])[0] || (live[id] && (live[id].headlineOffers || [])[0]) || null;
        var price = of && of.price != null ? of.price : (of && of.priceCents != null ? 'R$ ' + (of.priceCents / 100).toLocaleString('pt-BR') : null);
        return { id: id, name: t.name, first: first, photo: t.photo, ini: t.ini, role: (d.role || 'Treinador'), city: t.city || (t.onl ? 'Atende online' : 'Local não informado'), formats: fm, lang: '',
          crumb: { sport: LABEL[t.sports[0]] || '', slug: (t.raw || [])[0] || '', city: t.pres ? t.city : '' },
          avail: d.availability === 'aceita' ? 'aceita' : (d.availability === 'sem_vaga' ? 'nao' : 'desconhecida'), availDate: d.availOn ? d.availOn.split('-').reverse().slice(0, 2).join('/') : '', imported: false, demo: !!d.demo, realLive: true, receives: !!(d.receivesRequests || (live[id] && live[id].receivesRequests)), cref: d.crefStatus === 'verificado' ? 'ver' : (d.credentials && d.credentials.length ? 'inf' : 'nao'), avg: (d.revStats && d.revStats.n) ? (d.revStats.sum / d.revStats.n).toFixed(1).replace('.', ',') : '', n: d.revStats ? d.revStats.n : 0, revDist: d.revStats ? d.revStats.dist : null, ext: d.externalHandle || '',
          offerTxt: of ? (of.title || 'Acompanhamento') + ' · ' + (price ? price + (of.unit ? ' / ' + ({ mes: 'mês', sessao: 'sessão', aula: 'aula' }[of.unit] || of.unit) : '') : 'Sob consulta') : 'Condições combinadas no pedido',
          pitch: d.pitch || (t.spec ? first + ' atende ' + t.spec + (t.city ? ' em ' + t.city : ' online') + '.' : ''), bio: d.bio || '', offers: [], progs: [], creds: [], where: where, map: '', reviews: d.reviews || [] };
      }
      return { id: id, name: t.name, first: first, photo: t.photo, ini: t.ini, role: t.spec || 'Treinador', city: t.city || (t.onl ? 'Atende online' : 'Local não informado'), formats: fm, lang: '',
        avail: 'importado', imported: true, collected: t.pub || '', cref: 'na', avg: '', n: 0, ext: d.externalHandle || t.ext || '', crumb: { sport: LABEL[t.sports[0]] || '', slug: (t.raw || [])[0] || '', city: t.pres ? t.city : '' },
        // bio, frase e cargo importados não são exibidos: não há como garantir que estão atualizados
        pitch: '', bio: '',
        offers: [], progs: [], creds: [], where: where, map: '', reviews: [] };
    }
  };
  window.REAL = REAL;
  // pedido de remoção feito nesta aba: o perfil some daqui na hora
  REAL.hide = function (id) { HID[id] = 1; setItems(lastRows); rerender(); };

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
    myLinks: function () { return (window.CONTA ? window.CONTA.cachedLinks() : []).filter(function (l) { return l.mine === 'aluno'; }); },
    // com mais de um treinador, vale o escolhido pela pessoa (guardado neste aparelho); senão, o mais recente
    myTrainer: function () { var L = ACCT.myLinks(), pick = ''; try { pick = LS.getItem('c99.treinadorAtual') || ''; } catch (_) {} return L.filter(function (l) { return l.id === pick; })[0] || L[0] || null; },
    pickTrainer: function (id) { try { LS.setItem('c99.treinadorAtual', id); } catch (_) {} }
  };
  window.ACCT = ACCT;
  var PUBLIC = { home: 1, esporte: 1, perfil: 1, servico: 1 };
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('#app button[data-minha-area]') : null;
    if (!b) return;
    e.stopPropagation(); e.preventDefault(); ACCT.go();
  }, true);

  // conta nova começa vazia: sem os alunos, mensagens, vendas e conteúdos de exemplo
  var OWN = 'alunos respostas avaliacoes arquivos notas participantes agenda conversas notificacoes t4_propostas t6_envios t6_repasses t6_casos t6_relatorios t7_jobs t7_insights t2_envios t2_respostas t2_notasHist t2_arquivos t1_convites t1_pedidos t1_encerrados t1_resolvidas t1_recibos t8_contatos t8_denuncias t8_bloqueios programas ofertas cupons rotinas formularios t3_modelos'.split(' ');
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
    if (Array.isArray(window.DB.exercicios)) window.DB.exercicios = window.DB.exercicios.filter(function (e) { return e && !e.own; });
    var c = STORE.loadOnb('treinador');
    if (c && window.DB.trainer) { window.DB.trainer.name = c.name || window.DB.trainer.name; window.DB.trainer.first = (c.name || '').split(' ')[0] || window.DB.trainer.first; if (c.city) window.DB.trainer.city = c.city; }
    if (window.DB.insights) Object.assign(window.DB.insights, { visits: 0, visitsPrev: 0, contacts: 0, contactsPrev: 0, sales: 0, salesPrev: 0, revenue: 0, offers: [] });
    if (window.DB.t6_extrato && window.DB.t6_extrato.opening) Object.assign(window.DB.t6_extrato.opening, { rec: 0, lib: 0, ret: 0 });
    try { LS.setItem('c99.contaIniciada', '1'); } catch (_) {}
    STORE.saveDb();
  }
  // "Sair" sempre à vista na barra lateral das áreas com conta
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('#app [data-sair]') : null; if (!b) return;
    e.preventDefault(); e.stopPropagation(); if (window.GO) window.GO('@sair');
  }, true);
  window.__startAccount = startAccount;
  // pacote de área carregado depois do início da conta: o que chegou agora como exemplo sai, como no primeiro acesso
  window.__cleanNew = function (keys) {
    if (document.documentElement.classList.contains('demo') || !ACCT.area() || !window.DB) return;
    var STU = ['contratacoes', 'meusTreinos', 'a2_pedidos', 'a2_pedidosAcomp', 'a2_reembolsos'];
    (keys || []).forEach(function (k) {
      if (!Array.isArray(window.DB[k])) return;
      if (STU.indexOf(k) >= 0) window.DB[k] = [];
      else if (OWN.indexOf(k) >= 0) window.DB[k] = window.DB[k].filter(function (x) { return x && x.server; });
    });
    if (Array.isArray(window.DB.exercicios)) window.DB.exercicios = window.DB.exercicios.filter(function (e) { return e && !e.own; });
  };
  // troca de conta no mesmo aparelho: tira da memória o que era da conta anterior (o servidor repõe o que é da nova)
  window.__resetLocalData = function () {
    if (!window.DB) return;
    OWN.concat(['contratacoes', 'meusTreinos', 'a2_pedidos', 'a2_pedidosAcomp', 'a2_reembolsos', 'pastas']).forEach(function (k) { if (Array.isArray(window.DB[k])) window.DB[k] = []; });
    if (Array.isArray(window.DB.exercicios)) { window.DB.exercicios = window.DB.exercicios.filter(function (e) { return e && !e.own; }); window.DB.exercicios.forEach(function (e) { e.fav = false; delete e.video; }); }
    window.__myRequests = []; STORE._last = '';
  };

  // vínculos reais: o treinador vê os alunos conectados na lista (sem dados inventados)
  function mergeLinks(L) {
    if (!window.DB || !Array.isArray(window.DB.alunos)) return;
    // encerrados continuam na lista do treinador como "encerrado" (histórico), sem ocupar vaga
    (L || []).filter(function (l) { return l.mine === 'treinador'; }).forEach(function (l) {
      var id = 'lk_' + l.id, cur = window.DB.alunos.filter(function (a) { return a.id === id; })[0];
      var stt = l.ended ? 'encerrado' : (l.status === 'pausado' ? 'pausado' : 'ativo');
      if (cur) { cur.status = stt; if (l.ended) { cur.next = 'Encerrado · histórico disponível'; cur.flag = null; } return; }
      var since = l.since ? new Date(l.since) : null;
      window.DB.alunos.push({ id: id, server: true, name: l.studentName, first: String(l.studentName).split(' ')[0], status: stt,
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
      var RES = { cancelado: 'Cancelado pela pessoa', expirado: 'Venceu sem resposta', recusado: 'Recusado', aceito: 'Aceito' };
      if (cur) { cur.status = st; if (st !== 'pendente') cur.result = RES[x.status] || cur.result; return; }
      var d = new Date(x.at), due = x.due ? new Date(x.due) : null;
      window.DB.t1_pedidos.unshift({ id: id, server: x.id, aluno: '', name: x.studentName, origin: 'Perfil', offer: '', offerTxt: x.offer, msg: x.message || '(sem mensagem)',
        at: d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }), due: due ? 'responder até ' + due.toLocaleDateString('pt-BR') : '', goal: '', city: '', status: st, result: st === 'pendente' ? '' : (RES[x.status] || '') });
    });
  }
  function refreshLinks() {
    if (!window.CONTA || !window.CONTA.session()) return;
    Promise.all([window.CONTA.links(), window.CONTA.requests()]).then(function (x) { mergeLinks(x[0]); mergeRequests(x[1]); window.__myRequests = x[1]; rerender(); });
  }
  window.__refreshLinks = refreshLinks;
  // sinal de presença: só tem efeito para quem ligou "Mostrar quando estou online"; renovado enquanto a aba está visível
  var beat = function () { try { if (window.CONTA && window.CONTA.session() && !document.hidden && !document.documentElement.classList.contains('demo') && window.ACCT && window.ACCT.area()) window.CONTA.rpc('touch_presence', {}); } catch (_) {} };
  setTimeout(beat, 8000); setInterval(beat, 240000);
  // só depois que todos os módulos carregaram (a fila de pedidos e a lista de alunos já existem)
  var bootSync = function () { mergeLinks(window.CONTA ? window.CONTA.cachedLinks() : []); refreshLinks(); FAV.sync(); };
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
  var LIBKEYS = { conteudo: 1, editor: 1, exercicios: 1, exercicio: 1, exercicioNovo: 1, formularios: 1, formEditor: 1, historico: 1 };
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
    // a biblioteca (rotinas, exercícios, formulários, pastas) fica na conta: a tela diz o estado real da gravação
    var inLib = page === 'treinador' && LIBKEYS[key] && window.LIB && window.LIB.active();
    if (inLib) txt = window.LIB.notice();
    var m = root.querySelector('#conteudo'); if (!m) return;
    var old = m.querySelector('.c99-onde');
    if (old && inLib) { if (txt && old.getAttribute('data-t') === txt[0] + txt[1]) return; old.parentNode.removeChild(old); old = null; }
    if (!txt || old) return;
    var d = document.createElement('div'); d.className = 'alert alert--' + (txt[2] || 'info') + ' c99-onde'; d.setAttribute('role', 'note'); d.setAttribute('data-t', txt[0] + txt[1]);
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

  function perfilTitle(t) {
    var rot = LABEL[(t.sports || [])[0]] || t.spec || 'Treinador', pres = t.pres && t.city;
    return t.name + ': ' + rot + (pres ? ' em ' + t.city.split(',')[0] : (t.onl ? ' online' : ''));
  }
  // Folhas e diálogos: Esc fecha, Tab fica dentro, e o foco volta para o botão que abriu
  (function () {
    var opener = null, wasOpen = false;
    var sheet = function () { return document.querySelector('#app [role="dialog"][aria-modal="true"]'); };
    document.addEventListener('click', function (e) { if (!sheet()) opener = e.target && e.target.closest ? e.target.closest('button,a,[tabindex]') : null; }, true);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { var lay = document.querySelector('#app .sx-layer'); if (lay) { var cl = lay.querySelector('.sx-dclose, .sx-cancel'); if (cl && (cl.offsetParent || lay.querySelector('.sx-cancel'))) { e.preventDefault(); var inp = document.querySelector('#app .sx-field'); (cl.offsetParent ? cl : lay.querySelector('.sx-cancel')).click(); setTimeout(function () { var f = document.querySelector('#app .sx-field'); if (f && f.offsetParent) f.focus(); }, 30); return; } } }
      var sh = sheet(); if (!sh) return;
      if (e.key === 'Escape') { var x = sh.querySelector('[aria-label="Fechar"]') || document.querySelector('#app .v4-scrim'); if (x) { e.preventDefault(); x.click(); } return; }
      if (e.key !== 'Tab') return;
      var f = [].slice.call(sh.querySelectorAll('button,a[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')).filter(function (n) { return !n.disabled && n.offsetParent; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1], inside = sh.contains(document.activeElement);
      if (!inside) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }, true);
    window.__sheetFocus = function () {
      var sh = sheet();
      if (sh && !wasOpen) { wasOpen = true; if (!sh.contains(document.activeElement)) { var t = sh.querySelector('input,[aria-label="Fechar"],button'); if (t) setTimeout(function () { try { t.focus(); } catch (_) {} }, 60); } }
      else if (!sh && wasOpen) { wasOpen = false; if (opener && document.contains(opener)) { try { opener.focus(); } catch (_) {} } }
    };
  })();
  window.__afterRender = function (page, root) {
    // modalidade pede a própria fatia (REAL.need); perfil aberto a partir de uma fatia já tem o que precisa
    if (PUBLIC[page] && page !== 'esporte' && !(page === 'perfil' && window.__sliceLoaded && window.__sliceLoaded())) { if (page === 'home') ensureSoon(); else ensureBase(); }
    if (!window.STORE) return;
    applyMe();
    if (window.__sheetFocus) window.__sheetFocus();
    whereSaved(page, root); tickRest();
    // título da aba acompanha a página (plano SEO: título descreve o que a pessoa está vendo)
    // título: o servidor já entregou o certo para o endereço em que a pessoa chegou; o app só troca ao navegar para outra página
    var T0 = window.__T0 || (window.__T0 = { path: location.pathname, title: document.title });
    var pm = page === 'perfil' ? /\/treinador\/([^/?#]+)/.exec(location.pathname) : null, pt = pm ? byId[decodeURIComponent(pm[1])] : null;
    if (window.__NEXT && location.pathname === T0.path && (page === 'perfil' || page === 'home')) { try { document.title = T0.title; } catch (_) {} }
    else if (pt) { try { document.title = perfilTitle(pt) + ' | 99coach'; } catch (_) {} }
    else if (!(window.__NEXT && page === 'esporte')) try { var h1 = root.querySelector('h1'); var tt = h1 ? h1.textContent.replace(/\s+/g, ' ').trim() : ''; document.title = page === 'home' || !tt ? '99coach — encontre seu treinador' : tt + ' | 99coach'; } catch (_) {}
    if (window.NAV && window.NAV.syncUrl) window.NAV.syncUrl();
    if (page === 'aluno') startAccount();
    if (page === 'treinador' || page === 'onboarding') { var was = window.DB && window.DB.alunos && window.DB.alunos.length; startAccount(); if (page === 'treinador' && was && !window.DB.alunos.length) { setTimeout(rerender, 0); return; } }
    if (PUBLIC[page] && ACCT.area()) {
      var bs = root.querySelectorAll('button.btn--primary.btn--sm');
      // com conta: o botão do topo mostra quem está logado (iniciais e primeiro nome) e leva à área da pessoa
      var me = (window.ROLES && window.ROLES[ACCT.area()] && window.ROLES[ACCT.area()].me) || {}, nm = String(me.name || '').trim();
      var first = nm.split(/\s+/)[0] || '', ini = nm ? nm.split(/\s+/).map(function (w) { return w.charAt(0); }).slice(0, 2).join('').toUpperCase() : '';
      for (var i = 0; i < bs.length; i++) if (bs[i].hasAttribute('data-minha-area') || /^(Entrar|Minha área)$/.test(bs[i].textContent.trim())) {
        bs[i].textContent = first || 'Minha área'; bs[i].setAttribute('data-minha-area', '1'); bs[i].setAttribute('aria-label', first ? 'Minha área, ' + nm : 'Minha área');
        if (ini) bs[i].setAttribute('data-ini', ini); else bs[i].removeAttribute('data-ini');
      }
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
    var keep = function (d) { details[id] = d; save('c99.perfis', details); rerender(); };
    var legacy = function () {
      fetch('api/v1/trainers/' + encodeURIComponent(id)).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
        if (!d || !d.slug) return;
        keep({ role: d.role, pitch: d.pitch, bio: d.bio, serviceArea: d.serviceArea, externalHandle: d.externalHandle, imported: d.imported, receivesRequests: d.receivesRequests, offers: d.offers, credentials: d.credentials });
      }).catch(function () {});
    };
    // perfil vem do banco (99coach-v2); a API do site anterior só entra se o banco não responder
    if (!window.CONTA || !window.CONTA.pub) return legacy();
    window.CONTA.pub('trainers?select=slug,role_line,pitch,bio,external_handle,origin,cref,cref_status,availability,availability_informed_on,area,regions,offers(title,price_cents,unit,status,headline,sort),reviews(author_name,rating,body,period,created_at,reply)&reviews.status=eq.publicada&status=eq.publicado&slug=eq.' + encodeURIComponent(id)).then(function (r) {
      if (!r.ok || !Array.isArray(r.data)) return legacy();
      var d = r.data.filter(function (x) { return x && x.slug === id; })[0] || null;
      // o banco respondeu e o perfil não está publicado (retirado ou nunca publicado): some daqui e do cache, sem voltar pela API antiga
      if (!d) { delete details[id]; save('c99.perfis', details); if (byId[id]) { items = items.filter(function (x) { return x.id !== id; }); delete byId[id]; cache = {}; } (window.__RETIRADOS = window.__RETIRADOS || {})[id] = 1; rerender(); return; }
      var offers = (d.offers || []).filter(function (o) { return o.status === 'publicada'; }).sort(function (a, b) { return (b.headline ? 1 : 0) - (a.headline ? 1 : 0) || (a.sort || 0) - (b.sort || 0); })
        .map(function (o) { return { title: o.title, priceCents: o.price_cents, unit: o.unit }; });
      keep({ demo: d.origin === 'demonstracao', role: d.role_line || '', pitch: d.pitch || '', bio: d.bio || '', externalHandle: d.external_handle || '', imported: d.origin === 'importado',
        receivesRequests: d.origin !== 'importado' && d.availability !== 'sem_vaga', availability: d.availability || 'desconhecida', availOn: d.availability_informed_on || '', crefStatus: d.cref_status || '', offers: offers, credentials: d.cref && d.cref_status !== 'nao_informado' ? [{ kind: 'CREF', status: d.cref_status }] : [],
        // avaliações reais: só de quem teve acompanhamento; sem avaliação não há nota
        reviews: (d.reviews || []).filter(function (v) { return v && v.rating >= 1 && v.rating <= 5; }).sort(function (a, b) { return String(b.created_at).localeCompare(String(a.created_at)); }).slice(0, 30).map(function (v) { return [v.author_name || 'Aluno', 'Acompanhamento' + (v.period ? ' · desde ' + v.period : ''), v.rating, v.body || '', v.reply || '']; }),
        // média, total e distribuição saem de TODAS as avaliações publicadas, não só das 30 listadas
        revStats: (function (all) { var d = [0, 0, 0, 0, 0]; all.forEach(function (v) { d[5 - v.rating]++; }); return { n: all.length, sum: all.reduce(function (n, v) { return n + v.rating; }, 0), dist: d }; })((d.reviews || []).filter(function (v) { return v && v.rating >= 1 && v.rating <= 5; })) });
    });
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
    // perfis publicados por quem se cadastrou no app vêm do banco; a API antiga só entra se o banco não responder
    var fromDb = !window.CONTA || !window.CONTA.pub ? Promise.resolve(false) : window.CONTA.pub('trainers?select=slug,name,initials,photo_url,specialty,formats,published_at,cities(name,uf),trainer_sports(sport_slug),offers(title,price_cents,unit,status,headline)&status=eq.publicado&' + (function () { var m = /^\/treinador\/([a-z0-9-]+)$/.exec(location.pathname); return m ? 'or=(origin.eq.cadastro,and(origin.eq.demonstracao,slug.eq.' + m[1] + '))' : 'origin=eq.cadastro'; })() + '&order=published_at.desc&limit=200').then(function (r) {
      var L = r.ok && Array.isArray(r.data) ? r.data.filter(function (t) { return t && t.slug && t.name; }) : [];
      L.forEach(function (t) {
        var of = (t.offers || []).filter(function (o) { return o.status === 'publicada'; });
        got.push({ slug: t.slug, name: t.name, initials: t.initials || '', photo: t.photo_url || null, specialty: t.specialty || '', sports: (t.trainer_sports || []).map(function (s) { return s.sport_slug; }),
          city: t.cities ? { label: t.cities.name + ', ' + t.cities.uf } : null, formats: t.formats || [], imported: false, receivesRequests: true,
          headlineOffers: of.map(function (o) { return { title: o.title, priceCents: o.price_cents, unit: o.unit }; }), publishedAt: (t.published_at || '').slice(0, 10) });
      });
      return r.ok;
    });
    fromDb.then(function (ok) { LOADST.live = ok ? 'ok' : 'falha'; return ok ? null : next().then(function () { if (got.length) LOADST.live = 'ok'; }); }).then(function () {
      if (!got.length) { rerender(); return; }
      got.forEach(function (t) { live[t.slug] = t; });
      setItems(comLive(lastRows || [])); rerender();
    }).catch(function () { rerender(); });
  }
  // perfil vindo do banco entra no lugar que já tinha no catálogo (a lista não pula); só o que ainda não está no catálogo vai para o começo
  function comLive(rows) {
    var visto = {}, out = (rows || []).map(function (r) { var id = Array.isArray(r) ? r[0] : (r && r.slug); if (id && live[id]) { visto[id] = 1; return live[id]; } return r; });
    var novos = Object.keys(live).filter(function (k) { return !visto[k]; }).map(function (k) { return live[k]; });
    // só com o começo do catálogo não dá para saber se o perfil é novo ou está mais abaixo: pede o catálogo inteiro e a tela espera por ele
    if (LOADST.parcial && novos.length) { LOADST.incerto = true; setTimeout(ensureBase, 0); }
    return novos.concat(out);
  }
  REAL.isLive = function (id) { return !!live[id]; };
  // estado real do carregamento, para a busca separar "vazio" de "falha" (plano: vazio × falha × fim)
  var LOADST = { base: 'carregando', live: 'carregando' };
  REAL.status = function () { return LOADST; };
  REAL.retry = function () { LOADST = { base: 'carregando', live: 'carregando' }; Object.keys(slices).forEach(function (k) { if (slices[k] === 'falha') delete slices[k]; }); rerender(); fetchLive(); baseAsked = true; fetchBase(); };
  setTimeout(fetchLive, 0);

  // base completa gerada por `npm run sync`
  function fetchBase() {
    if (!window.fetch) { LOADST.base = 'falha'; return; }
    fetch('data/treinadores.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (d && d.items && d.items.length) { LOADST.parcial = false; LOADST.incerto = false; LOADST.inteiro = true; setItems(comLive(d.items)); LOADST.base = 'ok'; }
      else LOADST.base = 'falha';
      rerender();
    }).catch(function () { LOADST.base = 'falha'; rerender(); });
  }
  // o catálogo inteiro (~500 KB) só é baixado nas páginas que mostram treinadores; login, cadastro e áreas logadas não pagam esse custo
  var baseAsked = false;
  var PUBLIC = { home: 1, esporte: 1, perfil: 1, servico: 1 };
  function ensureBase() { if (baseAsked) return; baseAsked = true; fetchBase(); }
  // na página inicial o catálogo inteiro espera o topo aparecer: baixa no primeiro toque/rolagem ou depois de alguns segundos
  var soon = false;
  function ensureSoon() { if (baseAsked || soon) return; soon = true; setTimeout(ensureBase, 3500); ['pointerdown', 'keydown', 'touchstart', 'wheel'].forEach(function (ev) { window.addEventListener(ev, ensureBase, { once: true, passive: true, capture: true }); }); }
  REAL.ensure = ensureBase;
  // fatias: página de modalidade e perfil baixam só o necessário; o catálogo inteiro fica para a página inicial
  var slices = {}, sliceRows = [], POS = {};
  function fetchSlice(url, key) {
    if (baseAsked || slices[key]) return; slices[key] = 'carregando';
    if (LOADST.base !== 'ok') LOADST.base = 'carregando';
    fetch(url).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (baseAsked && LOADST.base === 'ok') return;
      // falhou: não pede de novo a cada redesenho (era um pedido atrás do outro, sem parar); o catálogo inteiro assume
      if (!d || !Array.isArray(d.items)) { slices[key] = 'falha'; ensureBase(); return; }
      // cada fatia vem com a posição de cada perfil no catálogo: juntar fatias não bagunça a ordem de relevância
      d.items.forEach(function (r, i) { if (POS[r[0]] === undefined) POS[r[0]] = d.pos && d.pos[i] >= 0 ? d.pos[i] : 1e9 + sliceRows.length + i; });
      slices[key] = 'ok'; sliceRows = sliceRows.concat(d.items).sort(function (a, b) { return POS[a[0]] - POS[b[0]]; });
      if (key === 'inicio') LOADST.parcial = true;
      setItems(comLive(sliceRows)); LOADST.base = 'ok'; rerender();
    }).catch(function () { slices[key] = 'falha'; ensureBase(); });
  }
  var SLUG = {}; Object.keys(LABEL).forEach(function (k) { SLUG[LABEL[k]] = k; });
  // o endereço da fatia usa o mesmo nome da página (jiu-jitsu), não o identificador interno (jiujitsu)
  function slugDe(modLabel) { var sp = window.SPORTS && window.SPORTS.get && window.SPORTS.get(modLabel); return (sp && sp.slug) || SLUG[modLabel] || ''; }
  // a vitrine pede a modalidade que está mostrando; sem fatia conhecida, cai no catálogo inteiro
  REAL.need = function (modLabel) { if (baseAsked) return; var k = slugDe(modLabel); if (k) fetchSlice('/dados/esporte/' + encodeURIComponent(k), 'e:' + k); else ensureBase(); };
  REAL.needAll = ensureBase;
  // a lista desta modalidade já está inteira? (catálogo completo, ou a fatia dela chegou)
  REAL.completo = function (modLabel) { return !!LOADST.inteiro || LOADST.base === 'falha' || slices['e:' + slugDe(modLabel)] === 'ok'; };
  // alguma fatia pedida (mesmo ainda chegando) / alguma fatia já chegou
  window.__sliceLoaded = function () { return Object.keys(slices).length > 0; };
  window.__sliceReady = function () { return Object.keys(slices).some(function (k) { return slices[k] === 'ok'; }) && !Object.keys(slices).some(function (k) { return slices[k] === 'carregando'; }); };
  var first = (window.__ROUTE && window.__ROUTE.name) || (/^#?([a-z]+)/.exec(location.hash || '') || [])[1] || 'home';
  var rp = (window.__ROUTE && window.__ROUTE.params) || {};
  if (first === 'esporte' && rp.slug) fetchSlice('/dados/esporte/' + encodeURIComponent(rp.slug), 'e:' + rp.slug);
  else if (first === 'perfil' && rp.id && /^\/treinador\//.test(location.pathname)) fetchSlice('/dados/treinador/' + encodeURIComponent(rp.id), 'p:' + rp.id);
  else if (first === 'publico' && /^#publico-(pedir|perfilpedido)-([a-z0-9-]+)$/.test(location.hash || '')) { var mh = /^#publico-(pedir|perfilpedido)-([a-z0-9-]+)$/.exec(location.hash); fetchSlice('/dados/treinador/' + encodeURIComponent(mh[2]), 'p:' + mh[2]); }
  // página inicial: o começo da lista (por relevância) chega já; o catálogo inteiro vem em seguida, na mesma ordem
  else if (first === 'home' && location.pathname === '/') { if (!document.documentElement.classList.contains('demo')) fetchSlice('/dados/inicio', 'inicio'); ensureSoon(); }
  else if (PUBLIC[first] || location.pathname === '/' || /^\/(treinadores|treinador|cidade)\//.test(location.pathname)) ensureBase();

  // ---------- favoritos ----------
  // Visitante: ficam neste aparelho. Com conta: ficam na conta (servidor) e valem em qualquer aparelho.
  // Favoritar antes de entrar sobrevive ao login: ao entrar, o que estava no aparelho vai para a conta uma vez.
  var FAV = (function () {
    var map = load('c99.favoritos', {}), ids = {}, synced = false;
    var C = function () { return window.CONTA && window.CONTA.session() ? window.CONTA : null; };
    var me = function () { var u = window.CONTA && window.CONTA.user(); return u && u.id; };
    var idOf = function (slug) {
      if (ids[slug]) return Promise.resolve(ids[slug]);
      return window.CONTA.pub('trainers?select=id&slug=eq.' + encodeURIComponent(slug)).then(function (r) { var d = r.ok && r.data && r.data[0]; if (d) ids[slug] = d.id; return d ? d.id : null; });
    };
    var push = function (slug, on) {
      var c = C(); if (!c) return Promise.resolve(true);
      return idOf(slug).then(function (tid) {
        if (!tid) return false;
        return on ? c.db('POST', 'favorites', { user_id: me(), trainer_id: tid }, 'resolution=ignore-duplicates,return=minimal').then(function (r) { return r.ok || r.status === 409; })
          : c.db('DELETE', 'favorites?trainer_id=eq.' + tid + '&user_id=eq.' + me()).then(function (r) { return r.ok; });
      });
    };
    var api = {
      map: function () { return Object.assign({}, map); },
      has: function (slug) { return !!map[slug]; },
      count: function () { return Object.keys(map).length; },
      where: function () { return C() ? 'na sua conta' : 'neste aparelho'; },
      set: function (slug, on) {
        if (!slug || !!map[slug] === !!on) return;
        if (on) map[slug] = true; else delete map[slug];
        save('c99.favoritos', map);
        push(slug, on).then(function (ok) { if (!ok && window.NOTICE) window.NOTICE('Não foi possível salvar o favorito na sua conta agora. Ele continua neste aparelho.'); });
      },
      // aplica um mapa inteiro (como as páginas guardam no estado)
      replace: function (next) { var all = {}; Object.keys(map).concat(Object.keys(next || {})).forEach(function (k) { all[k] = 1; }); Object.keys(all).forEach(function (k) { api.set(k, !!(next || {})[k]); }); },
      // ao entrar: traz os favoritos da conta e envia os do aparelho
      sync: function () {
        var c = C(); if (!c || synced) return; synced = true;
        c.db('GET', 'favorites?select=trainers(slug)&user_id=eq.' + me()).then(function (r) {
          if (!r.ok) { synced = false; return; }
          var server = {}; (r.data || []).forEach(function (f) { if (f.trainers && f.trainers.slug) server[f.trainers.slug] = true; });
          Object.keys(map).forEach(function (k) { if (!server[k]) push(k, true); });
          Object.keys(server).forEach(function (k) { map[k] = true; });
          save('c99.favoritos', map); rerender();
        });
      }
    };
    return api;
  })();
  window.FAV = FAV;

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
