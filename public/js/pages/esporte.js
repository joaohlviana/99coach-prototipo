PAGES.esporte = { Comp: (function () {


class Component extends DCLogic {
  static img(id) { return window.__IMG[id] || ''; }

  constructor(props) { super(props); this.state = Object.assign({}, this.base(), (props && props.init) || {}); try { if (!Component.__cap && typeof document !== 'undefined' && document.addEventListener) { Component.__cap = 1; document.addEventListener('click', (e) => { try { const t = e.target; const el = (t && t.closest && t.closest('button,a,[role=switch]')) || t; const r = el.getBoundingClientRect(); Component.__y = Math.max(12, Math.round(r.top + (window.scrollY || window.pageYOffset || 0) - 24)); } catch (_) {} }, true); } } catch (_) {} }
  base() { return { scen: 'londrina', mod: 'CrossFit', city: 'Londrina, PR', fmt: 'Presencial', lang: 'Qualquer', avail: false, sort: 'rel', sortInfo: false, page: 1, more: 0, view: 'lista', mapCap: 'off', load: 'ok', removed: false, sheet: '', pend: null, favs: {}, toast: null, sel: '', open: '', back: '', faq: 0, seo: false, codeSent: false, auth: 'login', loc: '', info: '', prog: -1, dd: '', foco: '', area: '' }; }
  renderVals() {
    if (window.FAV && !document.documentElement.classList.contains('demo')) this.state.favs = window.FAV.map();
    const st = this.state;
    const set = (o) => { if (o && o.favs && window.FAV && !document.documentElement.classList.contains('demo')) window.FAV.replace(o.favs); this.setState(o); };
    const B = (id) => Component.img(id);
    const PER = 8;
    const TD = [
      { id: 'rafael', name: 'Rafael Lima', ph: 'bdc7ef1c8dbf05558c3bf8d575fc3a04', spec: 'CrossFit e Musculação', mods: ['CrossFit', 'Musculação'], city: 'Londrina, PR', area: 'Região central', fmts: ['Presencial', 'Online'], langs: ['português'], avail: 'sim', ad: '20/10', rating: '4,9', reviews: 23, pres: ['Sessão presencial', 'R$ 80', '/ sessão'], onl: ['Acompanhamento online', 'R$ 200', '/ mês'], extra: [['Treino presencial 2x por semana', 'R$ 520 / mês', '8 sessões por mês · recorrente'], ['Avaliação física', 'Sob consulta', 'Condição declarada pelo treinador']], pub: '2026-03-12', rank: 1, pos: [50, 42], trust: [['Titularidade confirmada', 'ok'], ['CREF 012345-G/PR verificado · válido até 12/2027', 'ok']] },
      { id: 'diego', name: 'Diego Moraes', ph: '348bafe032c42fc5274e3de9d8004df2', spec: 'CrossFit e Lutas', mods: ['CrossFit', 'Lutas', 'Funcional'], city: 'Londrina, PR', area: 'Zona Leste', fmts: ['Presencial'], langs: ['português'], avail: 'sim', ad: '18/10', rating: '4,8', reviews: 56, pres: ['Sessão presencial', 'R$ 90', '/ sessão'], pub: '2025-08-14', rank: 2, pos: [79, 42], trust: [['Titularidade confirmada', 'ok'], ['CREF verificado', 'ok']] },
      { id: 'gabriel', name: 'Gabriel Santos', ph: '4534df06b7d037ae994cb151849342b0', spec: 'CrossFit e LPO', mods: ['CrossFit', 'Musculação'], city: 'Londrina, PR', area: 'Gleba Palhano', fmts: ['Presencial'], langs: ['português'], avail: 'nao', ad: '22/10', rating: '4,8', reviews: 29, pres: ['Treino presencial 2x por semana', 'R$ 480', '/ mês'], pub: '2025-11-02', rank: 3, pos: [27, 62], trust: [['Titularidade confirmada', 'ok'], ['CREF verificado', 'ok']] },
      { id: 'carolina', name: 'Carolina Albuquerque Montenegro', ph: '', ini: 'CM', spec: 'CrossFit e Funcional', mods: ['CrossFit', 'Funcional'], city: 'Londrina, PR', area: 'Zona Sul', fmts: ['Presencial', 'Online'], langs: ['português'], avail: '', ad: '', rating: '', reviews: 0, pres: ['Aula presencial em grupo', 'R$ 60', '/ aula'], onl: ['Planilha mensal com ajustes', 'R$ 150', '/ mês'], pub: '2026-10-19', rank: 4, pos: [52, 76], trust: [['Titularidade confirmada', 'ok'], ['CREF informado pela treinadora, ainda não verificado', 'no']] },
      { id: 'studio', name: 'Studio Norte Treinamento', ph: '', ini: 'SN', spec: 'CrossFit e Funcional', mods: ['CrossFit', 'Funcional'], city: 'Londrina, PR', area: 'Zona Norte', fmts: ['Presencial'], langs: ['português'], avail: '', ad: '', imported: true, rating: '', reviews: 0, pub: '2025-02-01', rank: 5, pos: [53, 17], trust: [['Perfil importado · não confirmado pelo profissional', 'imp']] },
      { id: 'patricia', name: 'Patrícia Rocha', ph: 'd80d1c82749ab145627ab4015f6f6041', spec: 'CrossFit e Mobilidade', mods: ['CrossFit'], city: 'Londrina, PR', area: 'Zona Leste', fmts: ['Presencial'], langs: ['português', 'inglês'], avail: 'sim', ad: '21/10', rating: '4,7', reviews: 9, pres: ['Sessão presencial', 'R$ 85', '/ sessão'], pub: '2024-03-02', rank: 6, pos: [70, 52], trust: [['Titularidade confirmada', 'ok'], ['CREF verificado', 'ok']] },
      { id: 'felipe', name: 'Felipe Andrade', ph: '', ini: 'FA', spec: 'CrossFit', mods: ['CrossFit'], city: 'Londrina, PR', area: 'Zona Oeste', fmts: ['Presencial'], langs: ['português'], avail: '', ad: '', rating: '4,6', reviews: 11, pres: ['Treino presencial 2x por semana', 'R$ 440', '/ mês'], pub: '2023-11-10', rank: 7, pos: [16, 40], trust: [['Titularidade confirmada', 'ok'], ['CREF verificado', 'ok']] },
      { id: 'henrique', name: 'Henrique Saito', ph: '', ini: 'HS', spec: 'CrossFit e LPO', mods: ['CrossFit'], city: 'Londrina, PR', area: 'Gleba Palhano', fmts: ['Presencial'], langs: ['português'], avail: 'sim', ad: '16/10', rating: '', reviews: 0, pres: ['Sessão presencial', 'R$ 100', '/ sessão'], pub: '2023-05-18', rank: 8, pos: [36, 70], trust: [['Titularidade confirmada', 'ok'], ['Credencial não informada', 'no']] },
      { id: 'larissa', name: 'Larissa Nunes', ph: 'eeb5e0340d20ffe1859010e8d3911dc0', spec: 'Funcional e CrossFit', mods: ['CrossFit', 'Funcional'], city: 'Curitiba, PR', fmts: ['Online'], langs: ['português', 'espanhol'], avail: 'sim', ad: '23/10', rating: '5,0', reviews: 21, onl: ['Acompanhamento online', 'R$ 120', '/ mês'], pub: '2026-01-20', rank: 2.5, trust: [['Titularidade confirmada', 'ok'], ['CREF verificado', 'ok']] },
      { id: 'juliana', name: 'Juliana Prates', ph: '760aa097a2f14e3d3f35aad0ad7a0090', spec: 'Pilates e Yoga', mods: ['Pilates', 'Yoga', 'Funcional'], city: 'Londrina, PR', area: 'Região central', fmts: ['Presencial', 'Online'], langs: ['português'], avail: 'sim', ad: '21/10', rating: '5,0', reviews: 14, pres: ['Aula presencial', 'R$ 70', '/ aula'], onl: ['Aulas online ao vivo', 'R$ 180', '/ mês'], pub: '2025-04-11', rank: 3, pos: [44, 46], trust: [['Titularidade confirmada', 'ok'], ['CREF verificado', 'ok']] },
      { id: 'bruno', name: 'Bruno Teixeira', ph: '349006eab36388172034672605e15a49', spec: 'Musculação e Corrida', mods: ['Musculação', 'Corrida'], city: 'Londrina, PR', area: 'Zona Oeste', fmts: ['Presencial'], langs: ['português'], avail: 'sim', ad: '19/10', rating: '', reviews: 0, pres: ['Sessão presencial', 'R$ 75', '/ sessão'], pub: '2026-07-01', rank: 4, pos: [20, 46], trust: [['Titularidade confirmada', 'ok'], ['CREF verificado', 'ok']] },
      { id: 'camila', name: 'Camila Duarte', ph: '9ccdef999c175cefc40042d6c70502e4', spec: 'Funcional e Corrida', mods: ['Funcional', 'Corrida'], city: 'Uberaba, MG', fmts: ['Online'], langs: ['português', 'espanhol'], avail: '', ad: '', rating: '5,0', reviews: 17, onl: ['Consultoria online', 'R$ 145', '/ mês'], pub: '2026-02-10', rank: 3, trust: [['Titularidade confirmada', 'ok'], ['CREF informado, ainda não verificado', 'no']] },
      { id: 'marcos', name: 'Marcos Almeida', ph: '848c200425592389106d38549e36440a', spec: 'Musculação e Força', mods: ['Musculação'], city: 'Ribeirão Preto, SP', fmts: ['Online'], langs: ['português'], avail: 'sim', ad: '20/10', rating: '4,9', reviews: 112, onl: ['Consultoria de força', 'R$ 189', '/ mês'], pub: '2024-05-20', rank: 3, trust: [['Titularidade confirmada', 'ok'], ['CREF verificado', 'ok']] },
      { id: 'renata', name: 'Renata Lopes', ph: 'cdd8dbf615cdeed2e5c5bd489c64e674', spec: 'Corrida', mods: ['Corrida'], city: 'São Paulo, SP', fmts: ['Online'], langs: ['português'], avail: 'sim', ad: '24/10', rating: '4,9', reviews: 44, onl: ['Planilha de corrida com ajustes', 'R$ 99', '/ mês'], pub: '2023-09-01', rank: 3, trust: [['Titularidade confirmada', 'ok'], ['CREF informado, ainda não verificado', 'no']] }
    ];
    const T = (window.REAL && window.REAL.esporte()) || TD;
    const SPL = window.SPORTS.ordered(window.REAL && window.REAL.sportCounts());
    const MODS = SPL.map((x) => x.label);
    const NEAR = { 'Tamarana, PR': 'Londrina, PR' };
    const cityShort = (c) => (c || '').split(',')[0];
    const has = (a, x) => (a || []).indexOf(x) >= 0;
    const match = (t, s) => {
      if (!has(t.mods, s.mod)) return false;
      if (s.removed && t.id === 'diego') return false;
      const pres = has(t.fmts, 'Presencial') && (!s.city || t.city === s.city);
      const onl = has(t.fmts, 'Online');
      if (s.fmt === 'Presencial' && !pres) return false;
      if (s.fmt === 'Online' && !onl) return false;
      if (s.fmt === 'Qualquer' && !pres && !onl) return false;
      if (s.lang !== 'Qualquer' && !has(t.langs, s.lang.toLowerCase())) return false;
      if (s.avail && t.avail !== 'sim') return false;
      if (s.foco && t.spec.indexOf(s.foco) < 0) return false;
      if (s.area && !(has(t.fmts, 'Presencial') && t.area === s.area)) return false;
      return true;
    };
    const countFor = (o) => { const s2 = Object.assign({}, st, o); let k = 0; for (let i = 0; i < T.length; i++) if (match(T[i], s2)) k++; return k; };
    const pl = (k, a, b) => k + ' ' + (k === 1 ? a : b);
    // "Não tenho interesse": some das buscas neste aparelho (não é denúncia e não avisa o profissional); dá para desfazer
    const HID = (() => { try { return JSON.parse(localStorage.getItem('c99.ocultos') || '{}'); } catch (_) { return {}; } })();
    const saveHid = (h) => { try { localStorage.setItem('c99.ocultos', JSON.stringify(h)); } catch (_) {} };
    const hidN = Object.keys(HID).length;
    let res = T.filter((t) => match(t, st) && !HID[t.id]);
    res = res.slice().sort((a, b) => st.sort === 'rec' ? (a.pub < b.pub ? 1 : -1) : a.rank - b.rank);
    const n = res.length;
    const pagesN = Math.max(1, Math.ceil(n / PER));
    const page = Math.min(st.page, pagesN);
    const start = (page - 1) * PER;
    const end = Math.min(n, start + PER * (1 + st.more));
    const shown = res.slice(start, end);

    // título e contexto
    const online = st.fmt === 'Online';
    const h1 = online ? 'Treinadores de ' + st.mod + ' online' : (st.city ? 'Treinadores de ' + st.mod + ' em ' + cityShort(st.city) : 'Treinadores de ' + st.mod);
    const fmtWord = { Presencial: 'presencial', Online: 'online', Qualquer: 'qualquer formato' }[st.fmt];
    const cityLabel = online ? 'Qualquer lugar (online)' : (st.city ? st.city : 'Escolha uma cidade');
    const ctxShort = (online ? 'online' : (st.city ? cityShort(st.city) + ' · ' + fmtWord : 'todas as cidades · ' + fmtWord));
    const langTxt = st.lang !== 'Qualquer' ? ' · atende em ' + st.lang.toLowerCase() : '';
    const ctxLine = st.mod + ' · ' + (online ? 'online' : (st.city || 'sem cidade') + ' · ' + fmtWord) + langTxt + (st.avail ? ' · aceita novos alunos' : '');
    let lede;
    if (online) lede = 'Acompanhamento a distância, com o treino no app.';
    else if (st.city) lede = '';
    else lede = 'Escolha uma cidade para ver quem atende perto de você.';

    // cenários
    const P = { londrina: {}, online: { city: '', fmt: 'Online' }, geral: { city: '', fmt: 'Qualquer' }, vazio: { lang: 'Espanhol' }, tamarana: { city: 'Tamarana, PR' }, loading: { load: 'loading' }, parcial: { load: 'parcial' }, total: { load: 'total' }, mapa: { mapCap: 'on', view: 'mapa', sel: 'rafael' }, semmapa: { mapCap: 'fail', view: 'mapa' }, removido: { removed: true } };
    const SL = [['londrina', 'CrossFit em Londrina · presencial'], ['online', 'CrossFit online'], ['geral', 'Modalidade geral'], ['vazio', 'Sem resultados (idioma)'], ['tamarana', 'Sem resultados (cidade)'], ['loading', 'Carregando'], ['parcial', 'Falha parcial'], ['total', 'Total desconhecido'], ['mapa', 'Mapa habilitado'], ['semmapa', 'Mapa indisponível'], ['removido', 'Perfil removido ao voltar']];
    const goScen = (k) => () => set(Object.assign(this.base(), { favs: st.favs, scen: k }, P[k]));
    const scens = SL.map(([k, label]) => ({ label, on: String(st.scen === k), cls: 'e-sc' + (st.scen === k ? ' is-on' : ''), pick: goScen(k) }));
    const reset = () => set(this.base());

    const change = (o) => { if (o && (o.city !== undefined || o.mod || o.fmt) && window.__pageIn) window.__pageIn(); return set(Object.assign({ dd: '', area: (o && (o.city !== undefined || o.fmt === 'Online' || o.mod)) ? '' : st.area, foco: (o && o.mod) ? '' : st.foco, page: 1, more: 0, back: '', sel: '', scen: '', load: st.load === 'parcial' || st.load === 'total' ? st.load : 'ok' }, o)); };
    const later = () => { try { setTimeout(() => this.setState({ load: 'ok' }), 900); } catch (e) {} };

    // formato e ordenação
    const fmtSeg = [['Presencial', 'Presencial'], ['Online', 'Online'], ['Qualquer', 'Qualquer formato']].map(([k, label]) => ({ label, on: String(st.fmt === k), cls: st.fmt === k ? 'is-on' : '', pick: () => change({ fmt: k }), k: k }));
    const sortSeg = [['rel', 'Relevância'], ['rec', 'Mais recentes']].map(([k, label]) => ({ label, on: String(st.sort === k), cls: st.sort === k ? 'is-on' : '', pick: () => set({ sort: k, page: 1, more: 0 }) }));
    const mapToggle = st.mapCap !== 'off' && !online;
    const viewSeg = [['lista', 'Lista', 'ic ic--sm i-list'], ['mapa', 'Mapa', 'ic ic--sm i-pin']].map(([k, label, icon]) => ({ label, icon, on: String(st.view === k), cls: st.view === k ? 'is-on' : '', pick: () => set({ view: k }) }));

    // filtros aplicados (removíveis)
    const applied = [];
    if (st.lang !== 'Qualquer') applied.push({ label: 'Atende em ' + st.lang.toLowerCase(), remove: () => change({ lang: 'Qualquer' }) });
    if (st.avail) applied.push({ label: 'Aceita novos alunos', remove: () => change({ avail: false }) });
    if (st.foco) applied.push({ label: 'Foco: ' + st.foco, remove: () => change({ foco: '' }) });
    if (st.area) applied.push({ label: 'Região: ' + st.area, remove: () => change({ area: '' }) });
    const extraCount = String(applied.length);
    const clearExtra = () => change({ lang: 'Qualquer', avail: false, foco: '', area: '' });

    // filtros pendentes (sheet)
    const pend = st.pend || { fmt: st.fmt, lang: st.lang, avail: st.avail };
    const setP = (o) => set({ pend: Object.assign({}, pend, o) });
    const pFmt = [['Presencial', 'Presencial', 'Encontro no local combinado'], ['Online', 'Online', 'Treino e conversa pelo app'], ['Qualquer', 'Qualquer formato', 'Presencial e online juntos, identificados']].map(([k, label, sub]) => ({ label, sub, on: String(pend.fmt === k), cls: 'e-opt' + (pend.fmt === k ? ' is-on' : ''), pick: () => setP({ fmt: k }) }));
    const pLang = ['Qualquer', 'Português', 'Inglês', 'Espanhol'].map((k) => ({ label: k === 'Qualquer' ? 'Qualquer idioma' : k, on: String(pend.lang === k), cls: 'e-opt' + (pend.lang === k ? ' is-on' : ''), pick: () => setP({ lang: k }) }));
    const pDirty = pend.fmt !== st.fmt || pend.lang !== st.lang || pend.avail !== st.avail;
    const pApply = () => { set({ fmt: pend.fmt, lang: pend.lang, avail: pend.avail, pend: null, sheet: '', page: 1, more: 0, back: '', sel: '', scen: '', load: 'updating' }); later(); };

    // cartões
    const fmtTxtOf = (t) => {
      const p = has(t.fmts, 'Presencial'), o = has(t.fmts, 'Online');
      if (online) return 'Online';
      if (st.fmt === 'Presencial') return o ? 'Presencial · também online' : 'Presencial';
      return p && o ? 'Presencial e online' : (p ? 'Presencial' : (o ? 'Online' : 'Formato não informado'));
    };
    const placeOf = (t) => {
      const p = has(t.fmts, 'Presencial');
      if (online || !p) return t.city ? 'base em ' + t.city : '';
      const km = window.GEO && window.GEO.kmTo ? window.GEO.kmTo(t.city) : null;
      return t.city + (t.area ? ' · ' + t.area : '') + (km != null && km >= 1 ? ' · ~' + km + ' km de você' : '');
    };
    const offerOf = (t) => {
      if (online) return t.onl || null;
      if (st.fmt === 'Presencial') return t.pres || null;
      const presOk = has(t.fmts, 'Presencial') && (!st.city || t.city === st.city);
      return (presOk && t.pres) || t.onl || t.pres || null;
    };
    const favs = st.favs || {};
    const toggleFav = (t) => () => { const on = !!favs[t.id]; const nf = Object.assign({}, favs); if (on) delete nf[t.id]; else nf[t.id] = true; set({ favs: nf, toast: { kind: on ? 'rem' : 'add', id: t.id } }); };
    const openP = (t) => () => (window.NAV.has(t.id) ? window.NAV.go('perfil', { id: t.id }, this, { back: t.id }) : set({ open: t.id, sheet: '' }));
    const mapOn = st.view === 'mapa' && mapToggle;
    const mapIds = mapOn ? shown.filter((t) => t.pos && has(t.fmts, 'Presencial') && t.city === st.city) : [];
    const mkNum = {}; mapIds.forEach((t, i) => { mkNum[t.id] = String(i + 1); });
    // motivo do cartão: um dos seis permitidos pelo plano, e só quando o fato existe no dado usado na seleção
    const whyOf = (t, saved) => {
      const recent = t.pub && (Date.now() - new Date(t.pub).getTime()) < 30 * 864e5;
      return saved ? 'Você salvou' : (online && has(t.fmts, 'Online') ? 'Atende online' : (st.city && has(t.fmts, 'Presencial') && t.city === st.city ? 'Atende em ' + cityShort(st.city) : ((t.mods || []).indexOf(st.mod) >= 0 ? 'Atende ' + st.mod : (recent ? 'Publicado recentemente' : ''))));
    };
    const hideOf = (t) => () => { const h = Object.assign({}, HID); h[t.id] = 1; saveHid(h); set({ hidUndo: { id: t.id, name: t.name } }); };
    const cards = shown.map((t) => {
      const of = offerOf(t), on = !!favs[t.id], isBack = st.back === t.id, isSel = mapOn && st.sel === t.id;
      const reason = whyOf(t, on);
      return {
        reason: reason, hasReason: !!reason, hide: hideOf(t), hideLabel: 'Não tenho interesse em ' + t.name,
        name: t.name, spec: t.spec, ini: t.ini || '', photo: t.ph ? B(t.ph) : '', hasPhoto: !!t.ph, noPhoto: !t.ph,
        fmtTxt: fmtTxtOf(t), place: placeOf(t), hasLang: t.langs.length > 1, langTxt: 'Atende em ' + t.langs.join(' e '),
        availYes: t.avail === 'sim', availNo: t.avail === 'nao', availDate: t.ad, imported: !!t.imported,
        rated: !!t.rating, unrated: !t.rating, rating: t.rating, reviews: String(t.reviews),
        hasOffer: !!of, noOffer: !of, offerName: of ? of[0] : '', price: of ? of[1] : '', unit: of ? of[2] : '',
        noOfferTxt: t.imported ? 'Sem contratação pela 99Coach · contato público no perfil' : 'Sem oferta publicada neste formato',
        favCls: 'e-fav' + (on ? ' is-on' : ''), favOn: String(on), favLabel: on ? 'Remover ' + t.name + ' dos salvos' : 'Salvar ' + t.name, fav: toggleFav(t),
        href: '/treinador/' + encodeURIComponent(t.id), open: openP(t), isBack, cls: 'e-card' + (isBack ? ' is-back' : '') + (isSel ? ' is-sel' : ''),
        mapBtn: mapOn && !!mkNum[t.id], locate: () => set({ sel: t.id })
      };
    });
    // produto: o estado vem do carregamento de verdade. Lista vazia enquanto carrega não é "nenhum treinador"; falha não é vazio.
    const CAT = !document.documentElement.classList.contains('demo') && window.REAL && window.REAL.status ? window.REAL.status() : null;
    const loading = st.load === 'loading' || (!!CAT && n === 0 && CAT.base === 'carregando');
    const showFail = !loading && !!CAT && n === 0 && (CAT.base === 'falha' || CAT.live === 'falha');
    const showEmpty = !loading && !showFail && n === 0;
    const showList = !loading && n > 0;
    const stale = showList && !!CAT && (CAT.base === 'falha' || CAT.live === 'falha');
    const retryCat = () => window.REAL && window.REAL.retry && window.REAL.retry();
    const updating = st.load === 'updating';

    // alternativas do vazio — só mudam a busca depois da escolha
    const alts = [];
    if (showEmpty) {
      if (st.lang !== 'Qualquer') alts.push({ label: 'Remover o idioma ' + st.lang.toLowerCase(), sub: pl(countFor({ lang: 'Qualquer' }), 'treinador', 'treinadores') + ' nesta busca sem esse filtro', pick: () => change({ lang: 'Qualquer' }) });
      if (st.avail) alts.push({ label: 'Mostrar também quem não informou vaga', sub: pl(countFor({ avail: false }), 'treinador', 'treinadores'), pick: () => change({ avail: false }) });
      if (st.city && NEAR[st.city] && st.fmt !== 'Online') alts.push({ label: 'Ver em ' + NEAR[st.city], sub: pl(countFor({ city: NEAR[st.city] }), 'treinador presencial', 'treinadores presenciais') + ' · cidade próxima', pick: () => change({ city: NEAR[st.city] }) });
      if (st.fmt !== 'Online') alts.push({ label: 'Ver quem atende online', sub: pl(countFor({ fmt: 'Online', city: '' }), 'treinador', 'treinadores') + (st.lang !== 'Qualquer' ? ' · atende em ' + st.lang.toLowerCase() : ''), pick: () => change({ fmt: 'Online', city: '' }) });
      for (let i = alts.length - 1; i >= 0; i--) { if (/^0 /.test(alts[i].sub)) alts.splice(i, 1); }
      if (countFor({ city: '', fmt: 'Qualquer', lang: 'Qualquer', avail: false }) === 0) alts.push({ label: 'Escolher outra modalidade', sub: 'Ninguém publicou ' + st.mod + ' ainda, em nenhuma cidade', pick: () => set({ sheet: 'mod' }) });
      alts.push({ label: 'Escolher outra cidade', sub: 'Abre a lista de cidades', pick: () => set({ sheet: 'city', loc: '' }) });
    }

    // contagem
    let countMain, countSub;
    if (loading) { countMain = 'Buscando treinadores…'; countSub = ctxLine; }
    else if (st.load === 'total' && n > 0) { countMain = 'Pelo menos ' + shown.length + ' treinadores'; countSub = ctxLine + ' · total ainda em contagem, atualizado em instantes'; }
    else if (n === 0) { countMain = 'Nenhum treinador'; countSub = ctxLine; }
    else { countMain = n + (n === 1 ? ' treinador' : ' treinadores'); countSub = ctxLine; }

    // paginação
    const pageArr = []; for (let i = 1; i <= pagesN; i++) pageArr.push(i);
    const pages = st.load === 'total' ? [{ n: String(page), cls: 'e-pg is-on', cur: 'page', pick: () => {} }] : pageArr.map((i) => ({ n: String(i), cls: 'e-pg' + (i === page ? ' is-on' : ''), cur: i === page ? 'page' : 'false', pick: () => set({ page: i, more: 0, back: '' }) }));
    const pagStatus = st.load === 'total' ? 'Página ' + page : 'Página ' + page + ' de ' + pagesN + ' · mostrando ' + (n ? start + 1 : 0) + '–' + end + ' de ' + n;
    const canMore = end < n;
    const nextN = Math.min(PER, n - end);
    const moreLabel = 'Carregar mais ' + nextN;

    // mapa
    const markers = mapIds.map((t) => ({ n: mkNum[t.id], short: t.name.split(' ')[0] + ' · ' + t.area, on: String(st.sel === t.id), cls: 'e-mk' + (st.sel === t.id ? ' is-sel' : ''), lcls: 'e-btn e-btn--sm' + (st.sel === t.id ? ' e-btn--ink' : ''), pos: 'left: ' + t.pos[0] + '%; top: ' + t.pos[1] + '%', aria: 'Marcador ' + mkNum[t.id] + ', ' + t.name + ', ' + t.area, pick: () => set({ sel: t.id }) }));
    const onlyOnline = shown.filter((t) => !has(t.fmts, 'Presencial') || t.city !== st.city).length;
    const mapNote = 'Posição por região aproximada informada pelo profissional; nunca endereço residencial. Distância não vira tempo de trajeto.' + (onlyOnline ? ' ' + onlyOnline + ' da página não atendem presencialmente aqui e ficam fora do mapa.' : '');

    // programas
    const PG = [
      { title: 'CrossFit Base', by: 'Rafael Lima', dur: '12 semanas de programação', n: 36, price: 'R$ 197', access: '12 meses de acesso', cover: B('4f287f956509500f4c89225daef9c5c5'), mods: ['CrossFit'] },
      { title: 'Primeiro Ring Muscle-Up', by: 'Larissa Nunes', dur: '12 semanas de programação', n: 36, price: 'R$ 147', access: '12 meses de acesso', cover: B('ae171f9728b88fd3de99402e707725b5'), mods: ['CrossFit'] },
      { title: 'LPO Booster', by: 'Gabriel Santos', dur: '8 semanas de programação', n: 24, price: 'R$ 97', access: '12 meses de acesso', cover: B('1860c6c9a5b801160bf7b69b6966d525'), mods: ['CrossFit'] },
      { title: 'Força Base', by: 'Marcos Almeida', dur: '12 semanas de programação', n: 36, price: 'R$ 157', access: '12 meses de acesso', cover: B('4668933ec61ec0207dd2b4c1f6a7ef8d'), mods: ['Musculação'] },
      { title: 'Hipertrofia em 3 dias', by: 'Bruno Teixeira', dur: '10 semanas de programação', n: 30, price: 'R$ 127', access: '12 meses de acesso', cover: B('ddc2a85a675b6360b30e74c352a6a43a'), mods: ['Musculação'] },
      { title: 'Base de Corrida 5K', by: 'Renata Lopes', dur: '8 semanas de programação', n: 24, price: 'R$ 147', access: '12 meses de acesso', cover: B('d7f58212b752ef1353285564cfe093c1'), mods: ['Corrida'] },
      { title: 'Functional Fitness — Ciclo completo', by: 'Larissa Nunes', dur: '12 semanas de programação', n: 36, price: 'R$ 197', access: '12 meses de acesso', cover: B('53bc58b2a2121cf553d701e2bbe3f479'), mods: ['Funcional'] }
    ];
    const PROD = !document.documentElement.classList.contains('demo'); // no produto não há programas publicados: os de exemplo não aparecem
    const progs = (PROD ? [] : PG.filter((p) => has(p.mods, st.mod))).map((p, i) => Object.assign({}, p, { n: String(p.n), open: () => set({ prog: PG.indexOf(p), sheet: 'prog' }) }));
    const progFail = st.load === 'parcial';
    const pg = st.prog >= 0 ? Object.assign({}, PG[st.prog], { n: String(PG[st.prog].n) }) : PG[0];

    // conteúdo local
    const presHere = T.filter((t) => has(t.mods, st.mod) && has(t.fmts, 'Presencial') && st.city && t.city === st.city);
    const sess = presHere.filter((t) => t.pres && t.pres[2] === '/ sessão').map((t) => parseInt(t.pres[1].replace(/\D/g, ''), 10));
    const facts = [];
    let edA, edB, localTxt;
    if (st.city && !online) {
      edA = st.mod; edB = 'em ' + cityShort(st.city);
      localTxt = presHere.length ? 'Em ' + cityShort(st.city) + ', os profissionais desta lista atendem em boxes parceiros, academias ou locais combinados com o aluno. O local exato é combinado depois do contato; aqui mostramos só a região.' : 'Ainda não há profissionais publicados que atendam ' + st.mod + ' presencialmente em ' + cityShort(st.city) + '.';
      facts.push(presHere.length + ' profissionais publicados atendem presencialmente');
      facts.push(presHere.filter((t) => has(t.fmts, 'Online')).length + ' deles também atendem online');
      if (sess.length > 1) facts.push('Sessão avulsa publicada de R$ ' + Math.min.apply(null, sess) + ' a R$ ' + Math.max.apply(null, sess) + ' por sessão');
    } else if (online) {
      edA = st.mod; edB = 'online';
      localTxt = 'No atendimento online, o treino chega pelo app e a conversa acontece por mensagens. Não depende da cidade; confira idioma e fuso no perfil.';
      const ons = T.filter((t) => has(t.mods, st.mod) && has(t.fmts, 'Online'));
      facts.push(ons.length + ' profissionais publicados atendem online');
      facts.push('Preço mensal sempre com a unidade “/ mês”');
    } else {
      edA = st.mod; edB = 'no Brasil';
      localTxt = 'Escolha uma cidade para ver quem atende presencialmente perto de você, ou veja quem atende online. Não mostramos “perto de você” sem uma cidade escolhida.';
      facts.push(T.filter((t) => has(t.mods, st.mod)).length + ' profissionais publicados nesta modalidade');
    }
    const F = [
      ['Preciso ter experiência para começar?', 'Não. Vários profissionais desta lista indicam atendimento para iniciantes no perfil. Converse antes de contratar para alinhar nível, frequência e local.'],
      ['Qual a diferença entre sessão avulsa e acompanhamento mensal?', 'Sessão avulsa é cobrada por sessão (“/ sessão”). Acompanhamento mensal é cobrado por mês (“/ mês”) e inclui o que está descrito na oferta, como treino no app e ajustes. Os valores não são comparáveis entre si.'],
      ['Como é feita a ordem da lista?', 'Em Relevância, combinamos a modalidade, o local e o formato escolhidos com a completude do perfil. Em Mais recentes, usamos a data de publicação. Plano pago do treinador não muda a posição.'],
      ['O que significa “Aceita novos alunos”?', 'É uma informação do próprio profissional, com a data em que foi informada. Quando não há informação, não mostramos nada no cartão.'],
      ['Preciso criar conta para ver os perfis?', 'Não. Você pode buscar, ver perfis e ofertas sem conta. Pedimos entrada só quando a ação exige identidade, como contratar ou enviar mensagem, e voltamos para onde você estava.']
    ];
    const faqs = F.map(([q, a], i) => ({ q, a, open: st.faq === i, cls: 'e-q' + (st.faq === i ? ' is-open' : ''), toggle: () => set({ faq: st.faq === i ? -1 : i }) }));

    // buscas relacionadas: só destinos com resultado
    const R = [];
    if (!online) R.push([st.mod + ' online', { fmt: 'Online', city: '' }]);
    MODS.filter((m) => m !== st.mod).forEach((m) => R.push([m + (st.city && !online ? ' em ' + cityShort(st.city) : (online ? ' online' : '')), { mod: m }]));
    const rel = R.map(([label, o]) => ({ label, n: countFor(Object.assign({ lang: 'Qualquer', avail: false, removed: false }, o)), pick: () => change(Object.assign({ lang: 'Qualquer', avail: false }, o)) })).filter((r) => r.n > 0).map((r) => Object.assign(r, { n: r.n + (r.n === 1 ? ' treinador' : ' treinadores') }));
    const ftrLinks = [['CrossFit em Londrina', { mod: 'CrossFit', city: 'Londrina, PR', fmt: 'Presencial' }], ['Musculação em Londrina', { mod: 'Musculação', city: 'Londrina, PR', fmt: 'Presencial' }], ['CrossFit online', { mod: 'CrossFit', city: '', fmt: 'Online' }]].map(([label, o]) => ({ label, pick: () => change(Object.assign({ lang: 'Qualquer', avail: false }, o)) }));

    // SEO (anotação)
    let seoOk = st.lang === 'Qualquer' && !st.avail && n >= 3 && (online || (st.city && st.fmt === 'Presencial') || (!st.city && st.fmt === 'Qualquer'));
    let seoWhy = seoOk ? 'página elegível: combinação estável com ' + n + ' profissionais publicados' : (n === 0 ? 'busca sem resultados não vira página; não indexar' : (st.lang !== 'Qualquer' || st.avail ? 'combinação com filtro de busca; não indexar e apontar para a página da modalidade e cidade' : 'base pequena ou combinação arbitrária; não indexar'));
    const seoTitle = h1 + (st.city && !online ? ', ' + st.city.split(', ')[1] : '') + ' | 99Coach';
    const seoDesc = n ? 'Compare ' + n + ' treinadores de ' + st.mod + (online ? ' que atendem online' : (st.city ? ' que atendem ' + fmtWord + ' em ' + st.city : '')) + ': formato, preço com unidade e avaliações reais.' : '—';
    const seoCrumb = 'Início › ' + st.mod + (online ? ' › Online' : (st.city ? ' › ' + st.city : ''));

    // perfil (resumo)
    const pt = T.filter((t) => t.id === st.open)[0];
    const pf = pt ? {
      name: pt.name, spec: pt.spec, ini: pt.ini || '', photo: pt.ph ? B(pt.ph) : '', hasPhoto: !!pt.ph, noPhoto: !pt.ph, fmtTxt: fmtTxtOf(pt), place: placeOf(pt),
      trust: pt.trust.map(([label, k]) => ({ label, cls: 'e-st e-st--' + k })), rated: !!pt.rating, unrated: !pt.rating, rating: pt.rating, reviews: String(pt.reviews),
      offers: [pt.pres, pt.onl].filter(Boolean).map((o) => ({ name: o[0], price: o[1] + ' ' + o[2], sub: o === pt.pres ? 'Presencial · ' + pt.city : 'Online · treino no app' })).concat((pt.extra || []).map((x) => ({ name: x[0], price: x[1], sub: x[2] }))),
      hasOffers: !!(pt.pres || pt.onl), noOffers: !(pt.pres || pt.onl), noOffersTxt: pt.imported ? 'Perfil importado de fonte pública e ainda não confirmado pelo profissional. Sem contratação, mensagens ou agenda pela 99Coach.' : 'Sem oferta publicada.'
    } : { name: '', spec: '', ini: '', photo: '', hasPhoto: false, noPhoto: false, fmtTxt: '', place: '', trust: [], rated: false, unrated: false, rating: '', reviews: '', offers: [], hasOffers: false, noOffers: false, noOffersTxt: '' };
    const closeProfile = () => set({ open: '', back: st.open });

    // salvos e aviso
    const favList = T.filter((t) => favs[t.id]).map((t) => ({ name: t.name, spec: t.spec, open: openP(t), remove: () => { const nf = Object.assign({}, favs); delete nf[t.id]; set({ favs: nf }); } }));
    const tst = st.toast; const tt = tst ? T.filter((t) => t.id === tst.id)[0] : null;
    const toastTxt = tst && tt ? (tst.kind === 'add' ? tt.name + ' salvo neste aparelho. Entre para guardar na sua conta.' : tt.name + ' removido dos salvos.') : '';
    const toastUndo = () => { if (!tst) return; const nf = Object.assign({}, favs); if (tst.kind === 'add') delete nf[tst.id]; else nf[tst.id] = true; set({ favs: nf, toast: null }); };

    const INFO = { ordem: ['Por que esta ordem?', 'Em Relevância, combinamos a modalidade, a cidade e o formato que você escolheu com a completude do perfil. Em Mais recentes, vale a data de publicação. Plano pago, anúncio ou comissão não mudam a posição.'], ajuda: ['Central de ajuda', 'A central de ajuda fica fora deste protótipo. No site, este link abre as perguntas e o contato do suporte.'], termos: ['Termos de uso', 'Documento legal fora do escopo deste protótipo de design. No site, abre a versão vigente com data.'], priv: ['Privacidade', 'Documento legal fora do escopo deste protótipo. No site, abre a política vigente e as escolhas de coleta opcional.'], regiao: ['Idioma e região', 'Nesta versão comercial, Brasil e real (R$) são a base. Mudar o idioma da interface não habilita vendas em outro país. Por enquanto, a interface está só em português.'], home: ['Início', 'A home está no quadro Home canônica · VFINAL. A busca atual fica guardada: ' + ctxLine + '.'], progs: ['Programas', PROD ? 'Ainda não há programas publicados na 99coach. Quando um treinador publicar um programa de ' + st.mod + ', ele aparece nesta página.' : 'Os programas de ' + st.mod + ' estão logo abaixo dos resultados, em seção própria.'], pro: ['Você é treinador?', 'Crie seu perfil com uma conta mínima e complete aos poucos. Criar conta não ativa teste do plano Pro. '] };
    const info = INFO[st.info] || ['', ''];
    const sheet = st.sheet;

    // localização de verdade: o navegador pede permissão; escolhemos a cidade com treinador mais perto
    const locGo = () => { set({ loc: 'busy' }); const only = [...new Set(T.filter((t) => t.city && has(t.fmts, 'Presencial')).map((t) => t.city))]; if (!window.GEO) return set({ loc: 'denied' }); window.GEO.locate({ only }).then((r) => change({ city: r.match || r.city, fmt: st.fmt === 'Online' ? 'Presencial' : st.fmt, sheet: '', loc: '', locNote: r.match && r.match !== r.city ? 'Você está em ' + r.city.split(',')[0] + '; a cidade mais perto com treinador é ' + r.match.split(',')[0] + ' (' + r.matchKm + ' km).' : '' }), () => set({ loc: 'denied' })); };
    const V3 = {
      scens, reset, seoOpen: st.seo, toggleSeo: () => set({ seo: !st.seo }), seoToggleLabel: st.seo ? ' · ocultar campos' : ' · ver campos', seoIndex: seoOk ? 'indexar' : 'não indexar', seoPillCls: 'e-pill ' + (seoOk ? 'e-pill--ok' : 'e-pill--no'), seoWhy, seoTitle, seoDesc, seoCrumb,
      h1, lede, mod: st.mod, iosTitle: st.mod + (online ? ' online' : (st.city ? ' em ' + cityShort(st.city) : '')), ctxShort, ctxLine, cityLabel, cityLabelShort: online ? 'Online' : (st.city ? cityShort(st.city) : 'Escolha uma cidade'), fmtLabel: { Presencial: 'Presencial', Online: 'Online', Qualquer: 'Qualquer formato' }[st.fmt],
      cityPickCls: 'e-pick' + (!st.city && !online ? ' is-empty' : ''),
      crumbModLink: !!st.city || online, crumbMod: () => change({ city: '', fmt: 'Qualquer' }), crumbLast: online ? 'Online' : (st.city ? st.city : st.mod),
      fmtSeg, sortSeg, viewSeg, mapToggle, sortInfo: st.sortInfo, toggleSortInfo: () => set({ sortInfo: !st.sortInfo }),
      applied, hasApplied: applied.length > 0, hasExtra: applied.length > 0, extraCount, clearExtra,
      countMain, countSub, removedNote: st.removed, dismissRemoved: () => set({ removed: false, back: '' }), noCityNote: !st.city && !online && !loading,
      hasHidUndo: !!st.hidUndo, hidUndoTxt: st.hidUndo ? st.hidUndo.name + ' não aparece mais nas suas buscas neste aparelho.' : '',
      undoHide: () => { if (!st.hidUndo) return; const h = Object.assign({}, HID); delete h[st.hidUndo.id]; saveHid(h); set({ hidUndo: null }); }, closeHidUndo: () => set({ hidUndo: null }),
      hasHidden: hidN > 0 && !st.hidUndo, hiddenTxt: hidN === 1 ? '1 perfil oculto por você' : hidN + ' perfis ocultos por você', showHidden: () => { saveHid({}); set({ hidUndo: null }); },
      updating, loading, showEmpty, showList, showFail, stale, retryCat, skels: [1, 2, 3, 4, 5, 6], alts, cards,
      showEnd: showList && end >= n, endTxt: 'Fim da lista: ' + (n === 1 ? 'este é o único treinador' : 'você viu os ' + n.toLocaleString('pt-BR') + ' treinadores') + ' desta busca. Mudar cidade, formato ou modalidade mostra outros.',
      layCls: 'e-lay' + (mapOn ? ' is-map' : '') + (updating ? ' is-dim' : ''),
      pages, pagStatus, prevPage: () => page > 1 && set({ page: page - 1, more: 0, back: '' }), nextPage: () => page < pagesN && set({ page: page + 1, more: 0, back: '' }), prevDis: String(page <= 1), nextDis: String(page >= pagesN && st.load !== 'total'), prevCls: 'e-pg' + (page <= 1 ? ' is-dis' : ''), nextCls: 'e-pg' + (page >= pagesN && st.load !== 'total' ? ' is-dis' : ''),
      canMore, moreLabel, loadMore: () => set({ more: st.more + 1 }),
      mapShown: mapOn, mapOk: mapOn && st.mapCap === 'on', mapFail: mapOn && st.mapCap === 'fail', markers, mapNote, mapTitle: markers.length + ' no mapa', toList: () => set({ view: 'lista' }), retryMap: () => set({ mapCap: 'on', scen: '' }),
      progs, progFail, progsOk: !progFail && progs.length > 0, retryProgs: () => set({ load: 'ok', scen: '' }), pg,
      edTitleA: edA, edTitleB: edB, localTxt, facts, faqs, rel, hasRel: rel.length > 0, ftrLinks,
      goHome: () => window.NAV.go('home', {}, this), demoProgs: document.documentElement.classList.contains('demo'), goProgs: () => set({ sheet: 'info', info: 'progs', prog: -1 }),
      openMod: () => set({ sheet: 'mod' }), openCity: () => set({ sheet: 'city', loc: '' }), openFilters: () => set({ sheet: 'filters', pend: { fmt: st.fmt, lang: st.lang, avail: st.avail } }), openSaved: () => set({ sheet: 'saved', toast: null }), openLogin: () => window.NAV.go('onboarding', { flow: 'entrar' }, this), openPro: () => window.NAV.go('onboarding', { flow: 'treinador' }, this), openMenu: () => set({ sheet: 'menu' }),
      closeSheet: () => set({ sheet: '', pend: null }), menuOpen: String(sheet === 'menu'),
      sh_filters: sheet === 'filters', sh_city: sheet === 'city', sh_mod: sheet === 'mod', sh_saved: sheet === 'saved', sh_menu: sheet === 'menu', sh_auth: sheet === 'auth', sh_info: sheet === 'info', sh_prog: sheet === 'prog',
      pFmt, pLang, pAvailOn: String(!!pend.avail), pAvailCls: 'e-opt' + (pend.avail ? ' is-on' : ''), pAvailToggle: () => setP({ avail: !pend.avail }), pDirty, pApply, pClear: () => setP({ fmt: st.fmt === 'Online' ? 'Online' : 'Presencial', lang: 'Qualquer', avail: false }),
      locIdle: st.loc === '' || !st.loc, locAsk: st.loc === 'busy', locDenied: st.loc === 'denied', askLoc: () => locGo(), locAllow: () => locGo(), locNote: st.locNote || '', hasLocNote: !!st.locNote,
      locDeny: () => set({ loc: 'denied' }),
      cityOpts: [['Londrina, PR', 'Paraná · Brasil'], ['Tamarana, PR', 'Paraná · Brasil · 50 km de Londrina'], ['', 'Ver todas as cidades e o online']].map(([c, sub]) => { const on = !online && st.city === c; const k = countFor({ city: c, fmt: c ? 'Presencial' : 'Qualquer', lang: 'Qualquer', avail: false }); return { label: c || 'Qualquer cidade', sub, n: String(k), cls: 'e-opt' + (on ? ' is-on' : ''), pick: () => change({ city: c, fmt: c ? (st.fmt === 'Online' ? 'Presencial' : st.fmt) : 'Qualquer', sheet: '' }) }; }),
      modOpts: MODS.map((m) => ({ label: m, n: String(countFor({ mod: m })), cls: 'e-opt' + (st.mod === m ? ' is-on' : ''), pick: () => change({ mod: m, sheet: '' }) })),
      favList, noFavs: favList.length === 0, favCount: String(favList.length), hasFavs: favList.length > 0,
      toastOn: !!tst && !!tt && !sheet && !st.open, toastTxt, toastUndo, toastSaved: !!tst && tst.kind === 'add', toastClose: () => set({ toast: null }),
      authTitle: 'Entrar', authSub: 'Enviamos um código para o seu e-mail. Sem senha.', codeIdle: !st.codeSent, codeSent: st.codeSent, sendCode: () => set({ codeSent: true }),
      infoTitle: info[0], infoBody: info[1], info_ajuda: () => window.GO('PUB11'), info_termos: () => window.GO('PUB11', { art: 'termos' }), info_priv: () => window.GO('PUB11', { art: 'privacidade' }), info_regiao: () => set({ sheet: 'info', info: 'regiao' }),
      pfOpen: !!pt, pf, closeProfile
    };
    // ---------- v4 · Design System ----------
    const TINTS = { forca: 'var(--sp-forca)', funcional: 'var(--sp-funcional)', corrida: 'var(--sp-corrida)', lutas: 'var(--sp-lutas)', mente: 'var(--sp-mente)', agua: 'var(--sp-agua)' };
    const HERO = (m) => window.SPORTS.hero(m);
    const RAILS = SPL.map((x) => [x.label, window.SPORTS.icon(x.id)]);
    const COACH = { 'Rafael Lima': 'bdc7ef1c8dbf05558c3bf8d575fc3a04', 'Larissa Nunes': 'eeb5e0340d20ffe1859010e8d3911dc0', 'Gabriel Santos': '4534df06b7d037ae994cb151849342b0', 'Marcos Almeida': '848c200425592389106d38549e36440a', 'Bruno Teixeira': '349006eab36388172034672605e15a49', 'Renata Lopes': 'cdd8dbf615cdeed2e5c5bd489c64e674' };
    const tintOf = (m) => window.SPORTS.tint(m);
    const dd = st.dd || '';
    const tg = (k) => () => set({ dd: dd === k ? '' : k });
    const sports4 = RAILS.map(([l, id]) => ({ label: l, icon: id, cls: 'rail__item' + (l === st.mod ? ' is-on' : ''), cur: l === st.mod ? 'page' : 'false', pick: () => change({ mod: l }) }));
    const scens4 = scens.map((s) => Object.assign({}, s, { cls: 'chip' + (s.on === 'true' ? ' is-on' : '') }));

    // topo da modalidade: números só quando reais
    const offs = res.map(offerOf).filter(Boolean);
    const sessP = offs.filter((o) => o[2] === '/ sessão').map((o) => parseInt(o[1].replace(/\D/g, ''), 10));
    const mesP = offs.filter((o) => o[2] === '/ mês').map((o) => parseInt(o[1].replace(/\D/g, ''), 10));
    const kpis = [];
    if (!loading) {
      if (st.load === 'total' && n > 0) kpis.push({ n: 'Em contagem', l: 'Total de treinadores', ncls: 'v4-kpi__t' });
      else if (n > 0) kpis.push({ n: String(n), l: n === 1 ? 'Treinador' : 'Treinadores', ncls: 'kpi__n' });
      if (progs.length && !progFail) kpis.push({ n: String(progs.length), l: progs.length === 1 ? 'Programa' : 'Programas', ncls: 'kpi__n' });
      if (sessP.length) kpis.push({ n: 'R$ ' + Math.min.apply(null, sessP), l: 'A partir de · sessão', ncls: 'kpi__n' });
      else if (mesP.length) kpis.push({ n: 'R$ ' + Math.min.apply(null, mesP), l: 'A partir de · mês', ncls: 'kpi__n' });
    }
    const eyebrow4 = '+ Modalidade · ' + (online ? 'online' : (st.city ? st.city + ' · ' + fmtWord : 'todas as cidades'));

    // cards de treinador (G17 · .tc)
    const isVer = (t) => t.trust.some((x) => /verificado/.test(x[0]) && !/não verificado|ainda não/.test(x[0]));
    const cards4 = shown.map((t) => {
      const of = offerOf(t), on = !!favs[t.id], isBack = st.back === t.id, isSel = mapOn && st.sel === t.id;
      let badge = '', bcls = 'tc__badge tag tag--white', dot = false;
      if (isBack) { badge = 'Você abriu este perfil'; bcls = 'tc__badge tag tag--dark'; }
      else if (t.avail === 'nao') badge = 'Sem vagas no momento · informado em ' + t.ad;
      const m2 = [];
      
      if (t.imported) m2.push('Não confirmado pelo profissional');
      if (t.langs.length > 1) m2.push('Atende em ' + t.langs.join(' e '));
      const specS = (t.spec.toLowerCase().indexOf(st.mod.toLowerCase()) >= 0) ? t.spec : [st.mod].concat((t.mods || []).filter((m) => m !== st.mod)).slice(0, 3).join(', ');
      return { name: t.name, spec: specS, ini: t.ini || '', photo: t.ph ? B(t.ph) : '', hasPhoto: !!t.ph, noPhoto: !t.ph, verified: isVer(t),
        reason: whyOf(t, on), hasReason: !!whyOf(t, on) && !/^Atende /.test(whyOf(t, on)), hide: hideOf(t), hideLabel: 'Não tenho interesse em ' + t.name,
        fmtTxt: fmtTxtOf(t), place: placeOf(t), meta2: m2.join(' · '), hasMeta2: m2.length > 0,
        rated: !!t.rating, unrated: !t.rating, rating: t.rating, reviews: String(t.reviews),
        hasOffer: !!of, noOffer: !of, offerName: of ? of[0] : '', price: of ? of[1] : '', unit: of ? of[2] : '',
        noOfferTxt: t.imported ? 'Sem contratação pela 99Coach' : 'Sem oferta publicada neste formato',
        badge, hasBadge: !!badge, badgeCls: bcls, bodyBadgeCls: bcls.replace('tc__badge ', '') + ' v4-bbadge', badgeDot: dot,
        favCls: 'tc__fav' + (on ? ' is-on' : ''), favOn: String(on), favLabel: on ? 'Remover ' + t.name + ' dos salvos' : 'Salvar ' + t.name, fav: toggleFav(t),
        href: '/treinador/' + encodeURIComponent(t.id), open: openP(t), tcCls: 'vf-tc v4-tc' + (isSel ? ' is-sel' : '') + (isBack ? ' is-back' : ''),
        mapBtn: mapOn && !!mkNum[t.id], locate: () => set({ sel: t.id }), mapNum: mkNum[t.id] || '' };
    });
    let countB = '', countT = '';
    if (loading) countT = 'Buscando treinadores…';
    else if (st.load === 'total' && n > 0) { countB = 'Pelo menos ' + shown.length; countT = ' treinadores · total ainda em contagem'; }
    else if (n === 0) countT = 'Nenhum treinador com estes filtros';
    else { countB = String(n); countT = (n === 1 ? ' treinador de ' : ' treinadores de ') + st.mod + (online ? ' online' : (st.city ? ' em ' + cityShort(st.city) + ' · ' + fmtWord : ' · ' + fmtWord)); }

    // barra de filtros (G19)
    const fmtL = { Presencial: 'Presencial', Online: 'Online', Qualquer: 'Qualquer formato' };
    const cityMenu = ((window.REAL && window.REAL.cities(st.city, st.cq)) || [['Londrina, PR', 'Paraná · Brasil'], ['Tamarana, PR', 'Paraná · Brasil · 50 km de Londrina']]).concat([['', 'Todas as cidades e o online']]).map(([c, sub]) => { const on = !online && st.city === c; const k = countFor({ city: c, fmt: c ? 'Presencial' : 'Qualquer', lang: 'Qualquer', avail: false }); return { label: c || 'Qualquer cidade', sub, n: String(k), on: String(on), cls: 'menu__it' + (on ? ' is-on' : ''), cls2: 'lrow v4-lrow' + (on ? ' is-on' : ''), pick: () => change({ city: c, fmt: c ? (st.fmt === 'Online' ? 'Presencial' : st.fmt) : 'Qualquer', sheet: '' }) }; });
    const fmtMenu = [['Presencial', 'Encontro no local combinado'], ['Online', 'Treino e conversa pelo app'], ['Qualquer', 'Presencial e online juntos, identificados']].map(([k, sub]) => ({ label: fmtL[k], sub, on: String(st.fmt === k), cls: 'menu__it' + (st.fmt === k ? ' is-on' : ''), pick: () => change({ fmt: k }) }));
    const langMenu = ['Qualquer', 'Português', 'Inglês', 'Espanhol'].map((k) => ({ sub: k === 'Qualquer' ? 'Sem filtro de idioma' : 'Atendimento em ' + k.toLowerCase(), label: k === 'Qualquer' ? 'Qualquer idioma' : k, on: String(st.lang === k), cls: 'menu__it' + (st.lang === k ? ' is-on' : ''), pick: () => change({ lang: k }), k: k })).filter((o) => o.k === 'Qualquer' || o.on === 'true' || countFor({ lang: o.k }) > 0);
    const totalAny = countFor({ lang: 'Qualquer' });
    const showLang = st.lang !== 'Qualquer' || langMenu.filter((o) => o.k !== 'Qualquer' && countFor({ lang: o.k }) < totalAny).length > 0;
    const sortMenu = [['rel', 'Relevância', 'Combina modalidade, local e formato com a completude do perfil. Plano pago não muda a posição.'], ['rec', 'Mais recentes', 'Publicados mais recentemente primeiro, pela data de publicação. Suas preferências não mudam esta ordem.']].map(([k, label, sub]) => ({ label, sub, on: String(st.sort === k), cls: 'menu__it' + (st.sort === k ? ' is-on' : ''), pick: () => set({ sort: k, page: 1, more: 0, dd: '' }) }));
    const availN = countFor({ avail: true });
    const qchips4 = (st.avail || (availN > 0 && availN < countFor({ avail: false }))) ? [{ label: 'Aceita novos alunos', icon: 'ic i-check', on: String(!!st.avail), cls: 'qchip' + (st.avail ? ' is-on' : ''), pick: () => change({ avail: !st.avail }) }] : [];

    // painel de filtros
    const pFmt4 = pFmt.filter((o) => o.on === 'true' || countFor({ fmt: o.label === 'Qualquer formato' ? 'Qualquer' : o.label }) > 0).map((o) => ({ label: o.label, on: o.on, pick: o.pick, cls: 'opt' + (o.on === 'true' ? ' is-on' : '') }));
    const pLang4 = pLang.filter((o) => o.on === 'true' || o.label === 'Qualquer idioma' || countFor({ lang: o.label }) > 0).map((o) => ({ label: o.label, on: o.on, pick: o.pick, cls: 'opt' + (o.on === 'true' ? ' is-on' : '') }));
    const modOpts4 = RAILS.map(([m, id]) => ({ label: m, icon: id, n: String(countFor({ mod: m })), cls: 'lrow v4-lrow' + (st.mod === m ? ' is-on' : ''), on: String(st.mod === m), pick: () => change({ mod: m, sheet: '' }) }));

    // paginação, mapa, programas, conteúdo local
    const pages4 = pages.map((p) => ({ n: p.n, cur: p.cur, pick: p.pick, cls: p.cls.indexOf('is-on') >= 0 ? 'is-on' : '' }));
    const markers4 = markers.map((m) => Object.assign({}, m, { cls: 'v4-mk' + (m.on === 'true' ? ' is-sel' : ''), lcls: 'chip' + (m.on === 'true' ? ' is-on' : '') }));
    const progs4 = progs.map((p) => ({ title: p.title, by: p.by, n: p.n, price: p.price, access: p.access, cover: p.cover, open: p.open, mod: st.mod, weeks: ((p.dur.match(/\d+/) || [''])[0]) + ' semanas', coachImg: B(COACH[p.by] || COACH['Rafael Lima']) }));
    const facts4 = [];
    if (st.city && !online) {
      facts4.push({ k: 'Atendem presencialmente', v: String(presHere.length) + ' profissionais publicados' });
      facts4.push({ k: 'Também atendem online', v: String(presHere.filter((t) => has(t.fmts, 'Online')).length) });
      if (sess.length > 1) facts4.push({ k: 'Sessão avulsa publicada', v: 'R$ ' + Math.min.apply(null, sess) + ' a R$ ' + Math.max.apply(null, sess) + ' / sessão' });
    } else if (online) {
      facts4.push({ k: 'Atendem online', v: String(T.filter((t) => has(t.mods, st.mod) && has(t.fmts, 'Online')).length) + ' profissionais publicados' });
      facts4.push({ k: 'Unidade do preço', v: 'sempre com “/ mês” ou “/ sessão”' });
    } else facts4.push({ k: 'Publicados nesta modalidade', v: String(T.filter((t) => has(t.mods, st.mod)).length) + ' profissionais' });
    const faqs4 = faqs.map((q) => ({ q: q.q, a: q.a, open: q.open, toggle: q.toggle, rot: q.open ? 'transform: rotate(180deg)' : '' }));
    const rel4 = R.map(([label, o]) => { const m = o.mod || st.mod; const k = countFor(Object.assign({ lang: 'Qualquer', avail: false, removed: false }, o)); return { label, k, n: pl(k, 'treinador', 'treinadores'), img: HERO(m).img, cls: 'st vfe-st' + (HERO(m).art ? ' vfe-st--art' : ''), tint: '--tint: ' + tintOf(m), pick: () => change(Object.assign({ lang: 'Qualquer', avail: false }, o)) }; }).filter((r) => r.k > 0).slice(0, 8);
    const alts4 = alts.map((a) => Object.assign({}, a, { icon: /idioma|vaga/.test(a.label) ? 'ic ic--sm i-x' : (/online/.test(a.label) ? 'ic ic--sm i-monitor' : (/cidade|Ver em/.test(a.label) ? 'ic ic--sm i-pin' : 'ic ic--sm i-search')) }));
    const pfTrust4 = pt ? pt.trust.map(([label, k]) => ({ label, cls: 'trust ' + (k === 'imp' ? 'trust--decl' : (/verificado/.test(label) && !/não verificado|ainda não/.test(label) ? 'trust--ver' : (/Titularidade/.test(label) ? 'trust--owner' : 'trust--decl'))) })) : [];
    const V4 = {
      sports4, scens4, kpis, hasKpis: kpis.length > 0, bannerImg: HERO(st.mod).img, heroCls: 'vfe-hero' + (HERO(st.mod).art ? ' vfe-hero--art' : ''), tint4: '--tint: ' + tintOf(st.mod), eyebrow4,
      cards4, countB, countT, hasCountB: !!countB,
      ddCity: dd === 'city', ddFmt: dd === 'fmt', ddLang: dd === 'lang', ddSort: dd === 'sort', ddSortC: dd === 'sortc', tgCity: tg('city'), tgFmt: tg('fmt'), tgLang: tg('lang'), tgSort: tg('sort'), tgSortC: tg('sortc'),
      cq: st.cq || '', setCq: (e) => set({ cq: e && e.target ? e.target.value : '' }), noCity: !!(st.cq || '').trim() && cityMenu.length <= 1, cityMenu, fmtMenu, langMenu, showLang, hasQ: qchips4.length > 0, showAvail: qchips4.length > 0, showFmt: true, sortMenu, qchips4, sortLabel: st.sort === 'rec' ? 'Mais recentes' : 'Relevância',
      cityFddCls: 'fdd' + (st.city && !online ? ' is-set' : ''), cityFddTxt: online ? 'Cidade: não se aplica (online)' : (st.city ? 'Cidade: ' + st.city : 'Escolha uma cidade'),
      fmtFddTxt: 'Formato: ' + fmtL[st.fmt], langFddCls: 'fdd' + (st.lang !== 'Qualquer' ? ' is-set' : ''), langFddTxt: st.lang === 'Qualquer' ? 'Idioma do atendimento' : 'Idioma: ' + st.lang,
      pFmt4, pLang4, pSwCls: 'switch' + (pend.avail ? ' is-on' : ''), modOpts4,
      pages4, prevCls4: 'v4-pgb' + (page <= 1 ? ' is-dis' : ''), nextCls4: 'v4-pgb' + (page >= pagesN && st.load !== 'total' ? ' is-dis' : ''),
      pbarW: 'width: ' + (n ? Math.round(end / n * 100) : 0) + '%; background: var(--ink)', showPbar: st.load !== 'total' && n > 0, moreLabel4: 'Carregar mais ' + nextN + (nextN === 1 ? ' treinador' : ' treinadores'),
      markers4, progs4, facts4, faqs4, rel4, hasRel4: rel4.length > 0, alts4, pfTrust4, pgCoach: B(COACH[pg.by] || COACH['Rafael Lima']),
      seoBadge: 'tag tag--white', showTabbar: !st.sheet && !st.open,
      askLocWide: () => { set({ sheet: 'city', dd: '' }); locGo(); },
      openMod: () => set({ sheet: 'mod', dd: '' }), openCity: () => { set({ sheet: 'city', loc: '', dd: '', cq: '' }); setTimeout(() => { try { const el = document.getElementById('cq'); if (el) el.focus(); } catch (_) {} }, 80); }, openFilters: () => set({ sheet: 'filters', dd: '', pend: { fmt: st.fmt, lang: st.lang, avail: st.avail } }), openSaved: () => set({ sheet: 'saved', toast: null, dd: '' }), openLogin: () => window.NAV.go('onboarding', { flow: 'entrar' }, this), openPro: () => window.NAV.go('onboarding', { flow: 'treinador' }, this), openMenu: () => set({ sheet: 'menu', dd: '' })
    };
    // ---------- VFINAL: composição da referência ----------
    const ovKey = (sheet || '') + '|' + (st.open || '') + '|' + (mapOn ? 'mapa' : '');
    if (ovKey !== '||') { if (this.__k !== ovKey) { this.__k = ovKey; this.__sy = typeof Component.__y === 'number' ? Component.__y : 160; } } else this.__k = '';
    if (st.toast && this.__tt !== st.toast) { this.__tt = st.toast; this.__ty = (typeof Component.__y === 'number' ? Component.__y : 160) + 56; }
    const sy = typeof this.__sy === 'number' ? this.__sy : 160;
    // foco declarado (sub-modalidade): só o que os perfis declaram na especialidade
    // com o catálogo completo há milhares de combinações: ficam os 12 focos mais declarados
    const fq = {};
    // foco é sub-especialidade; nome de outro esporte não é foco ("Musculação" numa busca de Yoga)
    const isMod = (p) => MODS.some((m) => m.toLowerCase() === String(p).toLowerCase()) || /,/.test(p);
    for (let i = 0; i < T.length; i++) { const t = T[i]; if (!has(t.mods, st.mod)) continue; t.spec.split(' e ').forEach((p) => { p = p.trim(); if (p && p !== st.mod && !isMod(p)) fq[p] = (fq[p] || 0) + 1; }); }
    const FOCOS = Object.keys(fq).sort((a, b) => fq[b] - fq[a]).slice(0, 6);
    if (st.foco && FOCOS.indexOf(st.foco) < 0) FOCOS.push(st.foco);
    const focoChips = [{ label: 'Todos', n: '', hasN: false, on: String(!st.foco), cls: 'chip' + (!st.foco ? ' is-on' : ''), pick: () => change({ foco: '' }) }]
      .concat(FOCOS.map((f) => { const k = countFor({ foco: f }); return { label: f, n: String(k), hasN: true, on: String(st.foco === f), cls: 'chip' + (st.foco === f ? ' is-on' : ''), pick: () => change({ foco: st.foco === f ? '' : f }), k }; }).filter((c) => c.k > 0 || c.on === 'true'));
    // bairro ou região (só quando há cidade e atendimento presencial)
    const AREAS = [];
    T.filter((t) => has(t.mods, st.mod) && has(t.fmts, 'Presencial') && st.city && t.city === st.city && t.area).forEach((t) => { if (AREAS.indexOf(t.area) < 0) AREAS.push(t.area); });
    const showArea = AREAS.length > 0 && !online;
    const areaMenu = [{ label: 'Toda a cidade', sub: 'Todas as regiões informadas', on: String(!st.area), cls: 'menu__it' + (!st.area ? ' is-on' : ''), pick: () => change({ area: '' }) }]
      .concat(AREAS.map((a) => { const k = countFor({ area: a }); return { label: a, sub: pl(k, 'treinador', 'treinadores'), on: String(st.area === a), cls: 'menu__it' + (st.area === a ? ' is-on' : ''), pick: () => change({ area: a }) }; }));
    const nearChips = AREAS.map((a) => { const k = countFor({ area: a, foco: '', lang: 'Qualquer', avail: false }); return { label: st.mod + ' · ' + a, n: String(k), k, pick: () => change({ area: a, foco: '', lang: 'Qualquer', avail: false }) }; }).filter((c) => c.k > 0);
    const fmtSeg4 = fmtSeg.filter((f) => f.on === 'true' || countFor({ fmt: f.k }) > 0).map((f) => ({ label: f.label, on: f.on, pick: f.pick, cls: 'seg__it' + (f.on === 'true' ? ' is-on' : '') }));
    // quanto custa: faixas só com ofertas publicadas nesta busca, sempre com a unidade
    const UNIT = { '/ sessão': 'Sessão avulsa', '/ mês': 'Mensal', '/ aula': 'Aula em grupo' };
    const grp = {};
    res.forEach((t) => { const o = offerOf(t); if (!o) return; const v = parseInt(o[1].replace(/\D/g, ''), 10); (grp[o[2]] = grp[o[2]] || []).push(v); });
    const where = online ? ' online' : (st.fmt === 'Presencial' ? ' presencial' : '');
    const ranges = Object.keys(grp).sort((a, b) => grp[b].length - grp[a].length).slice(0, 3).map((u) => { const a = grp[u], lo = Math.min.apply(null, a), hi = Math.max.apply(null, a); return { k: (UNIT[u] || 'Oferta') + where, v: lo === hi ? 'R$ ' + lo : 'R$ ' + lo + '–' + hi, unit: u, n: pl(a.length, 'treinador com oferta publicada', 'treinadores com oferta publicada') }; });
    const pvals = progFail ? [] : progs.map((p) => parseInt(p.price.replace(/\D/g, ''), 10));
    if (pvals.length) { const lo = Math.min.apply(null, pvals), hi = Math.max.apply(null, pvals); ranges.push({ k: 'Programas prontos', v: lo === hi ? 'R$ ' + lo : 'R$ ' + lo + '–' + hi, unit: 'pagamento único', n: pl(pvals.length, 'programa publicado', 'programas publicados') }); }
    const noOfferN = res.filter((t) => !offerOf(t)).length;
    const priceNote = 'Calculado das ofertas publicadas nesta busca; não é tabela de preços nem garantia.' + (noOfferN ? ' ' + (noOfferN === 1 ? '1 perfil sem oferta publicada não entra' : noOfferN + ' perfis sem oferta publicada não entram') + ' na conta.' : '');
    const showPrices = ranges.length > 0 && !loading;
    const priceTitle = 'Quanto custa ' + (online ? st.mod + ' online' : (st.city ? 'em ' + cityShort(st.city) : st.mod));
    const isLondrina = st.city === 'Londrina, PR' && !online;
    const VF = {
      rootCls: 'w v4 vfe' + (sheet || st.open ? ' has-sheet' : ''), sheetTop: sy + 'px', syVar: '--sy: ' + sy + 'px', toastTop: (this.__ty || 160) + 'px',
      impNote: res.some((t) => t.imported), 
      focoChips, hasFoco: focoChips.length > 2 || !!st.foco, showArea, areaMenu, ddArea: dd === 'area', tgArea: tg('area'), areaFddCls: 'fdd' + (st.area ? ' is-set' : ''), areaFddTxt: st.area ? 'Região: ' + st.area : 'Bairro ou região',
      nearChips, hasNear: nearChips.length > 0, nearTitle: online ? 'Outras modalidades online' : (st.city ? 'Perto de ' + cityShort(st.city) + ' e outras modalidades' : 'Outras modalidades'),
      fmtSeg4, ranges, showPrices, priceTitle, priceNote, isLondrina,
      seeEmpty: () => set(Object.assign(this.base(), { favs: st.favs, scen: 'tamarana', city: 'Tamarana, PR' })), seeOnline: () => change({ fmt: 'Online', city: '' }),
      openOrdem: () => set({ sheet: 'info', info: 'ordem', dd: '' }), isHasFavs: Object.keys(favs).length > 0,
      skip: () => { try { const el = document.getElementById('conteudo'); if (el) { el.setAttribute('tabindex', '-1'); el.focus(); } } catch (_) {} }
    };
    (V4.fmtSeg4 || []).forEach(() => {});
    VF.fmtSeg4.forEach((f) => { f.mcls = f.on === 'true' ? ' is-on' : ''; });
    VF.focoChips.forEach((c) => { c.mcls = c.on === 'true' ? ' is-on' : ''; });
    (V4.qchips4 || V3.qchips4 || []).forEach((q) => { q.mcls = q.on === 'true' ? ' is-on' : ''; });
    (V4.cards4 || V3.cards4 || []).forEach((t) => { t.mplace = String(t.place || '').split(' · ').pop(); const ok = String(t.badgeCls || '').indexOf('ok') >= 0 || String(t.bodyBadgeCls || '').indexOf('ok') >= 0 || /^Aceita/.test(String(t.badge || '')); t.mstatCls = 'vfe-mstat' + (ok ? ' is-ok' : (/vagas/.test(String(t.badge || '')) ? ' is-warn' : '')); });
    return Object.assign(V3, V4, VF);
  }
}


return Component; })(), frag: document.getElementById('tpl-esporte').content, css: document.getElementById('css-esporte') };
