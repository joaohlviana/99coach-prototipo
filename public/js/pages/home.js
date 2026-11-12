PAGES.home = { Comp: (function () {


class Component extends DCLogic {
  static img(id) { return window.__IMG[id] || ''; }

  constructor(props) { super(props); const p = props || {}; this.state = Object.assign(Component.init(p.scen || 'primeira'), p.init || {}); }
  static init(scen) {
    return { scen: scen, sport: 'crossfit', city: scen === 'semloc' ? null : (scen === 'semres' ? 'Tamarana, PR' : 'Londrina, PR'), mode: 'presencial',
      favs: (scen === 'retorno' || scen === 'vinculo' || scen === 'dois') ? { rafael: true, larissa: true } : {}, hidden: {},
      sheet: null, sd: null, y: 120, toast: null, ty: 0, link: 0, retry: false, loadingP: false, retCleared: false, recentCleared: false,
      code: 0, loc: 0, pedCanceled: false, sx: null, sxq: '', sxIa: false, sxTab: 'Treinadores', sxR1: true, sxR2: true, sxY: 150, sxX: 40, sxW: 640 };
  }
  renderVals() {
    const B = (id) => Component.img(id), set = (p) => { if (p && p.favs && window.FAV && !document.documentElement.classList.contains('demo')) window.FAV.replace(p.favs); this.setState(p); };
    if (window.FAV && !document.documentElement.classList.contains('demo')) this.state.favs = window.FAV.map();
    const S = this.state;
    const yOf = (e) => { try { const el = e && (e.currentTarget || e.target); if (!el || !el.getBoundingClientRect) return S.y; const r = el.getBoundingClientRect(); return Math.max(12, Math.round(r.top + (window.scrollY || window.pageYOffset || 0) - 24)); } catch (_) { return S.y; } };
    const pageScroll = () => { try { return document.documentElement.scrollHeight > window.innerHeight + 40; } catch (_) { return false; } };
    const toastAt = (e, msg, undo) => ({ toast: { msg: msg, undo: undo || null }, ty: yOf(e) + 52 });
    const open = (kind, data) => (e) => set({ sheet: kind, sd: data || null, y: yOf(e), code: 0, loc: 0, toast: null });
    const close = () => set({ sheet: null, sd: null });

    const SC = [['primeira', 'Visitante · primeira visita'], ['vinculo', 'Aluno com acompanhamento'], ['retorno', 'Retorno'], ['semhist', 'Sem histórico'], ['dois', 'Dois vínculos'], ['pendente', 'Pedido pendente'], ['semloc', 'Sem localização'], ['semres', 'Sem resultados'], ['falha', 'Falha parcial']];
    const DESC = {
      primeira: 'Visitante sem conta. Busca no topo, sem login, pop-up de localização, banner de app ou anúncio do Pro.',
      retorno: 'Visitante que já buscou neste aparelho e autorizou o histórico. Um bloco compacto substitui o hero; “Vistos recentemente” é variante condicional.',
      semhist: 'Histórico não autorizado ou coleta opcional recusada: a Home funciona só pela busca atual. Buscar e salvar continuam funcionando.',
      vinculo: 'Estado padrão desta Home: Ana Ribeiro, aluna de Rafael Lima, entrou na conta. A faixa “Seu acompanhamento” vem logo depois da busca, antes de qualquer vitrine.',
      dois: 'Ana tem dois acompanhamentos. Ela escolhe qual ver e as programações não se misturam.',
      pendente: 'Pedido enviado a Rafael Lima, ainda sem resposta. A Home mostra o estado e o próximo passo, sem repetir “Solicitar”.',
      semloc: 'Nenhuma cidade escolhida. Sem “perto de você”; a localização só é pedida depois que a pessoa toca no botão.',
      semres: 'CrossFit presencial em Tamarana, PR: ninguém atende. Alternativas explícitas, aplicadas só depois da escolha.',
      falha: 'Os programas não carregaram. Os treinadores e a busca continuam funcionando; “Tentar de novo” mostra o carregamento.'
    };
    const scens = SC.map(([id, label]) => ({ label, cls: 'chip' + (S.scen === id ? ' is-on' : ''), on: S.scen === id ? 'true' : 'false', pick: () => this.setState(Component.init(id)) }));
    const scenName = (SC.find((x) => x[0] === S.scen) || SC[0])[1];

    const SP = window.SPORTS.ordered(window.REAL && window.REAL.sportCounts()).map((x) => [x.id, x.label, window.SPORTS.icon(x.id)])
    { const HO = ['crossfit', 'musculacao', 'funcional', 'corrida', 'pilates', 'yoga', 'natacao', 'lutas', 'ciclismo', 'danca']; const head = HO.map((id) => SP.find((x) => x[0] === id)); SP.splice(0, 10, ...head); }
    const sp = SP.find((x) => x[0] === S.sport) || SP[0];
    const sportLabel = sp[1];
    const pickSport = (id) => () => set({ sport: id, hidden: {}, sheet: null, toast: null });
    // clicar em um esporte abre a página do esporte (com a cidade e o formato já escolhidos)
    const goSport = (id) => () => { try { window.localStorage.setItem('c99.tela.busca', '1'); } catch (_) {} set({ sport: id, hidden: {}, sheet: null, toast: null }); window.NAV.go('esporte', { mod: window.NAV.modOf(id) }, this); };
    const chips = SP.map(([id, label, ic]) => ({ label, icon: ic, cls: 'rail__item' + (S.sport === id ? ' is-on' : ''), on: S.sport === id ? 'true' : 'false', pick: goSport(id) }));
    const allSports = SP.map(([id, label, ic]) => ({ label, icon: ic, cls: 'opt' + (S.sport === id ? ' is-on' : ''), pick: goSport(id) }));
    const editSports = SP.slice(0, 6).map(([id, label, ic]) => ({ label, icon: ic, cls: 'opt' + (S.sport === id ? ' is-on' : ''), pick: () => set({ sport: id, hidden: {} }) }));
    const goals = [['Ganhar força', 'musculacao', 'Musculação'], ['Condicionamento', 'crossfit', 'CrossFit'], ['Começar a correr', 'corrida', 'Corrida'], ['Mobilidade e postura', 'pilates', 'Pilates']].map(([label, id, to]) => ({ label, to, pick: goSport(id) }));

    const CIT = (window.REAL && window.REAL.cities(S.city)) || [['Londrina, PR', 'Paraná · Brasil'], ['Cambé, PR', 'Paraná · Brasil'], ['Maringá, PR', 'Paraná · Brasil'], ['Tamarana, PR', 'Paraná · Brasil']];
    const cities = CIT.map(([c, n]) => ({ label: c, note: n, cls: 'opt' + (S.city === c ? ' is-on' : ''), pick: () => set({ city: c, hidden: {}, sheet: null, loc: 0 }), pick2: () => set({ city: c, hidden: {} }) }));
    const cityLabel = S.city || 'Escolher cidade';
    const modeLabel = { presencial: 'Presencial', online: 'Online', qualquer: 'Qualquer formato' }[S.mode];
    const setMode = (m) => () => set({ mode: m, hidden: {}, toast: null });

    const TD = [
      { id: 'rafael', name: 'Rafael Lima', spec: 'CrossFit e Musculação', city: 'Londrina, PR', pres: true, onl: true, sports: ['crossfit', 'musculacao'], photo: B('bdc7ef1c8dbf05558c3bf8d575fc3a04'), rating: '4,9', n: 23, ver: true, cref: 'CREF 012345-G/PR verificado · válido até 12/2027', av: 'yes', avLong: 'Aceita novos alunos (informado em 20/10)', offP: ['Sessão presencial', 'R$ 80', '/ sessão'], offO: ['Acompanhamento online', 'R$ 200', '/ mês'], more: 3 },
      { id: 'diego', name: 'Diego Moraes', spec: 'CrossFit e Lutas', city: 'Londrina, PR', pres: true, onl: false, sports: ['crossfit', 'lutas', 'funcional'], photo: B('348bafe032c42fc5274e3de9d8004df2'), rating: '4,8', n: 56, ver: true, cref: 'CREF verificado', av: 'yes', avLong: 'Aceita novos alunos (informado em 18/10)', offP: ['Sessão presencial', 'R$ 90', '/ sessão'], more: 2 },
      { id: 'gabriel', name: 'Gabriel Santos', spec: 'CrossFit e LPO', city: 'Londrina, PR', pres: true, onl: false, sports: ['crossfit', 'musculacao'], photo: B('4534df06b7d037ae994cb151849342b0'), rating: '4,8', n: 29, ver: true, cref: 'CREF verificado', av: 'no', avLong: 'Sem vagas no momento (informado em 22/10)', offP: ['Treino presencial 2x por semana', 'R$ 480', '/ mês'], more: 1 },
      { id: 'carolina', name: 'Carolina Albuquerque Montenegro', spec: 'CrossFit e Funcional', city: 'Londrina, PR', pres: true, onl: true, sports: ['crossfit', 'funcional'], photo: null, ini: 'CM', rating: null, n: 0, ver: false, cref: 'CREF informado pela treinadora, ainda não verificado', av: 'unknown', avLong: 'Não informada. Consulte no perfil.', offP: ['Aula presencial em grupo', 'R$ 60', '/ aula'], offO: ['Planilha mensal com ajustes', 'R$ 150', '/ mês'], more: 1 },
      { id: 'studio', name: 'Studio Norte Treinamento', spec: 'CrossFit e Funcional', city: 'Londrina, PR', pres: true, onl: false, sports: ['crossfit', 'funcional'], photo: null, ini: 'SN', rating: null, n: 0, ver: false, imp: true, cref: 'Perfil importado: credencial não confirmada', av: 'unknown', avLong: 'Não informada', more: 0 },
      { id: 'patricia', name: 'Patrícia Rocha', spec: 'CrossFit e Mobilidade', city: 'Londrina, PR', pres: true, onl: false, sports: ['crossfit'], photo: B('d80d1c82749ab145627ab4015f6f6041'), rating: '4,7', n: 9, ver: true, cref: 'CREF verificado', av: 'yes', avLong: 'Aceita novos alunos (informado em 21/10)', offP: ['Sessão presencial', 'R$ 85', '/ sessão'], more: 0 },
      { id: 'felipe', name: 'Felipe Andrade', spec: 'CrossFit', city: 'Londrina, PR', pres: true, onl: false, sports: ['crossfit'], photo: null, ini: 'FA', rating: '4,6', n: 11, ver: true, cref: 'CREF verificado', av: 'unknown', avLong: 'Não informada. Consulte no perfil.', offP: ['Treino presencial 2x por semana', 'R$ 440', '/ mês'], more: 0 },
      { id: 'henrique', name: 'Henrique Saito', spec: 'CrossFit e LPO', city: 'Londrina, PR', pres: true, onl: false, sports: ['crossfit'], photo: null, ini: 'HS', rating: null, n: 0, ver: false, cref: 'Credencial não informada', av: 'yes', avLong: 'Aceita novos alunos (informado em 16/10)', offP: ['Sessão presencial', 'R$ 100', '/ sessão'], more: 0 },
      { id: 'juliana', name: 'Juliana Prates', spec: 'Pilates e Yoga', city: 'Londrina, PR', pres: true, onl: true, sports: ['pilates', 'yoga', 'funcional'], photo: B('760aa097a2f14e3d3f35aad0ad7a0090'), rating: '5,0', n: 14, ver: true, cref: 'CREF verificado', av: 'yes', avLong: 'Aceita novos alunos (informado em 21/10)', offP: ['Aula presencial', 'R$ 70', '/ aula'], offO: ['Aulas online ao vivo', 'R$ 180', '/ mês'], more: 1 },
      { id: 'bruno', name: 'Bruno Teixeira', spec: 'Musculação e Corrida', city: 'Londrina, PR', pres: true, onl: false, sports: ['musculacao', 'corrida'], photo: B('349006eab36388172034672605e15a49'), rating: null, n: 0, ver: true, cref: 'CREF verificado', av: 'yes', avLong: 'Aceita novos alunos (informado em 19/10)', offP: ['Sessão presencial', 'R$ 75', '/ sessão'], more: 0 },
      { id: 'larissa', name: 'Larissa Nunes', spec: 'Funcional e CrossFit', city: 'Curitiba, PR', pres: false, onl: true, sports: ['crossfit', 'funcional'], photo: B('eeb5e0340d20ffe1859010e8d3911dc0'), rating: '5,0', n: 21, ver: true, cref: 'CREF verificado', av: 'yes', avLong: 'Aceita novos alunos (informado em 23/10)', offO: ['Acompanhamento online', 'R$ 120', '/ mês'], more: 1 },
      { id: 'camila', name: 'Camila Duarte', spec: 'Funcional e Corrida', city: 'Uberaba, MG', pres: false, onl: true, sports: ['funcional', 'corrida'], photo: B('9ccdef999c175cefc40042d6c70502e4'), rating: '5,0', n: 17, ver: false, cref: 'CREF informado pela treinadora, ainda não verificado', av: 'unknown', avLong: 'Não informada. Consulte no perfil.', offO: ['Consultoria online', 'R$ 145', '/ mês'], more: 0 },
      { id: 'marcos', name: 'Marcos Almeida', spec: 'Musculação e Força', city: 'Ribeirão Preto, SP', pres: false, onl: true, sports: ['musculacao'], photo: B('848c200425592389106d38549e36440a'), rating: '4,9', n: 112, ver: true, cref: 'CREF verificado', av: 'yes', avLong: 'Aceita novos alunos (informado em 20/10)', offO: ['Consultoria de força', 'R$ 189', '/ mês'], more: 2 },
      { id: 'renata', name: 'Renata Lopes', spec: 'Corrida', city: 'São Paulo, SP', pres: false, onl: true, sports: ['corrida'], photo: B('cdd8dbf615cdeed2e5c5bd489c64e674'), rating: '4,9', n: 44, ver: false, cref: 'CREF informado pela treinadora, ainda não verificado', av: 'yes', avLong: 'Aceita novos alunos (informado em 24/10)', offO: ['Planilha de corrida com ajustes', 'R$ 99', '/ mês'], more: 1 }
    ];
    // treinadores reais (base importada); os de exemplo ficam só para as situações de demonstração
    const T = (window.REAL && window.REAL.home()) || TD;
    const byId = (id) => T.find((t) => t.id === id) || TD.find((t) => t.id === id);
    const inCity = (t) => !!S.city && t.city === S.city;
    const sportOk = (t) => t.sports.indexOf(S.sport) >= 0;
    const visitor = ['vinculo', 'dois', 'pendente'].indexOf(S.scen) < 0, logged = !visitor;
    const offerFor = (t, ctx) => (ctx === 'online' ? t.offO : (ctx === 'presencial' ? t.offP : ((t.pres && inCity(t)) ? t.offP : t.offO))) || null;
    const ctxLine = sportLabel + ' · ' + (S.city || 'sem cidade') + ' · ' + modeLabel;

    const card = (t, ctx) => {
      const off = t.imp ? null : offerFor(t, ctx), on = !!S.favs[t.id];
      const where = t.pres && t.onl ? t.city + ' · Presencial e online' : (t.pres ? t.city + ' · Presencial' : (t.city ? 'Atende online · ' + t.city : 'Atende online'));
      const reason = t.imp ? 'Perfil importado: ainda não confirmado pelo profissional' : ctx === 'online' || (!t.pres || !inCity(t)) ? 'Oferece atendimento online de ' + sportLabel : 'Atende em ' + S.city + ' · presencial';
      return {
        name: t.name, spec: t.spec, where, ini: t.ini || '', photo: t.photo || '', hasPhoto: !!t.photo, noPhoto: !t.photo,
        hasRating: !!t.rating, noRating: !t.rating, rating: t.rating || '', n: String(t.n), nrev: t.n + ' avaliações', verified: t.ver,
        hasAvail: t.av !== 'unknown', avail: t.av === 'yes' ? 'Aceita novos alunos' : 'Sem vagas no momento', avYes: t.av === 'yes',
        pend: S.scen === 'pendente' && !S.pedCanceled && t.id === 'rafael',
        why2: t.imp ? 'Perfil importado · não confirmado' : [S.mode === 'qualquer' ? (t.pres && inCity(t) ? (t.onl ? 'Presencial e online' : 'Presencial') : 'Online') : '', t.av === 'no' ? t.avLong.replace(' (', ' · ').replace(')', '') : ''].filter(Boolean).join(' · '), whyCls: t.av === 'yes' && !t.imp ? 'is-ok' : '', hasPrice: !!off, offName: off ? off[0] : '', price: off ? off[1] : '', unit: off ? off[2] : '', reason,
        hid: !!S.hidden[t.id], vis: !S.hidden[t.id],
        favCls: 'tc__fav' + (on ? ' is-on' : ''), favOn: on ? 'true' : 'false', favLabel: (on ? 'Remover ' : 'Salvar ') + t.name + (on ? ' dos salvos' : ''),
        fav: (e) => { const nv = !S.favs[t.id]; set(Object.assign({ favs: Object.assign({}, S.favs, { [t.id]: nv }) }, toastAt(e, nv ? ((document.documentElement.classList.contains('demo') ? visitor : !(window.CONTA && window.CONTA.session())) ? t.name + ' salvo neste aparelho. Entre para guardar na sua conta.' : t.name + ' salvo em Salvos.') : t.name + ' removido dos salvos.', { k: 'fav', id: t.id, v: !nv }))); },
        open: window.NAV.has(t.id) ? () => window.NAV.go('perfil', { id: t.id }, this) : open('trainer', { id: t.id, ctx: ctx }), why: open('why', { id: t.id, ctx: ctx, reason: reason }),
        unhide: () => set({ hidden: Object.assign({}, S.hidden, { [t.id]: false }), toast: null })
      };
    };

    // Vitrine 1
    let main = [], tNoLoc = false;
    if (S.mode === 'presencial') { if (!S.city) tNoLoc = true; else main = T.filter((t) => t.pres && inCity(t) && sportOk(t)); }
    else if (S.mode === 'online') main = T.filter((t) => t.onl && sportOk(t));
    else main = T.filter((t) => sportOk(t) && ((t.pres && inCity(t)) || t.onl));
    const tEmpty = !tNoLoc && main.length === 0, tHas = main.length > 0;
    const tlist = main.slice(0, 4).map((t) => card(t, S.mode));
    const nTot = main.length;
    const tTitle = S.mode === 'online' ? sportLabel + ' online' : (S.city ? 'Treinadores de ' + sportLabel + ' em ' + S.city.replace(', PR', '') : 'Treinadores de ' + sportLabel);
    const tSub = tNoLoc ? 'Escolha uma cidade para ver quem atende presencialmente.' : (tHas ? nTot + (nTot === 1 ? ' treinador' : ' treinadores') + ' · ' + (S.mode === 'online' ? 'atendimento online, de qualquer cidade' : (S.mode === 'qualquer' ? 'presencial em ' + S.city + ' e online' : 'presencial')) + ' · ordem por relevância' : 'Nenhum perfil com esta combinação.');
    const nearCity = S.city === 'Tamarana, PR' ? 'Londrina, PR (cerca de 50 km)' : 'Londrina, PR';
    const alts = [
      { label: 'Ver quem atende online', go: setMode('online') },
      { label: 'Mudar para ' + nearCity, go: () => set({ city: 'Londrina, PR', hidden: {}, toast: null }) },
      { label: 'Escolher outra modalidade', go: open('sport') }
    ];
    const emptyText = S.mode === 'online' ? 'Ninguém oferece ' + sportLabel + ' online por enquanto.' : 'Ninguém atende ' + sportLabel + ' presencialmente em ' + S.city + '. Não mostramos profissionais de outra cidade como se atendessem aí.';

    // Vitrine 2: o formato complementar
    let altList = [], altTitle = '', altSub = '', altAll = '';
    if (S.mode === 'presencial') { altList = T.filter((t) => t.onl && sportOk(t) && main.indexOf(t) < 0).slice(0, 4).map((t) => card(t, 'online')); altTitle = 'Também atendem online'; altSub = 'Treino pelo app e mensagens, de qualquer cidade.'; altAll = 'Ver todos online'; }
    else if (S.mode === 'online' && S.city) { altList = T.filter((t) => t.pres && inCity(t) && sportOk(t) && main.indexOf(t) < 0).slice(0, 4).map((t) => card(t, 'presencial')); altTitle = 'Presencial em ' + S.city.replace(', PR', ''); altSub = 'Para quem prefere treinar junto com o treinador.'; altAll = 'Ver todos presenciais'; }
    const alsoNames = S.mode === 'presencial' ? main.filter((t) => t.onl).map((t) => t.name) : (S.mode === 'online' ? main.filter((t) => t.pres && inCity(t)).map((t) => t.name) : []);
    const altNote = alsoNames.length ? alsoNames.join(' e ') + (alsoNames.length > 1 ? ', na lista acima, também atendem ' : ', na lista acima, também atende ') + (S.mode === 'presencial' ? 'online.' : 'presencialmente.') : '';
    const altHas = altList.length > 0;

    // Vitrine 3: programas
    const PR = {
      crossfit: [{ id: 'base', title: 'CrossFit Base', coach: 'Rafael Lima', dur: '12 semanas de programação · 36 treinos', price: 'R$ 197', cover: B('4f287f956509500f4c89225daef9c5c5') },
        { id: 'rmu', title: 'Primeiro Ring Muscle-Up', coach: 'Larissa Nunes', dur: '12 semanas de programação · 36 treinos', price: 'R$ 147', cover: B('ae171f9728b88fd3de99402e707725b5') },
        { id: 'lpo', title: 'LPO Booster', coach: 'Gabriel Santos', dur: '8 semanas de programação · 24 treinos', price: 'R$ 97', cover: B('1860c6c9a5b801160bf7b69b6966d525') }],
      musculacao: [{ id: 'forca', title: 'Força Base', coach: 'Marcos Almeida', dur: '12 semanas de programação · 36 treinos', price: 'R$ 157', cover: B('4668933ec61ec0207dd2b4c1f6a7ef8d') },
        { id: 'hip', title: 'Hipertrofia em 3 dias', coach: 'Bruno Teixeira', dur: '10 semanas de programação · 30 treinos', price: 'R$ 127', cover: B('ddc2a85a675b6360b30e74c352a6a43a') }],
      corrida: [{ id: '5k', title: 'Base de Corrida 5K', coach: 'Renata Lopes', dur: '8 semanas de programação · 24 treinos', price: 'R$ 147', cover: B('d7f58212b752ef1353285564cfe093c1') }],
      funcional: [{ id: 'func', title: 'Functional Fitness — Ciclo completo', coach: 'Larissa Nunes', dur: '12 semanas de programação · 36 treinos', price: 'R$ 197', cover: B('53bc58b2a2121cf553d701e2bbe3f479') }]
    };
    const progs = PR[S.sport] || [];
    const pFail = S.scen === 'falha' && !S.retry && !S.loadingP, pLoading = !!S.loadingP;
    const pHas = !pFail && !pLoading && progs.length > 0, pEmpty = !pFail && !pLoading && progs.length === 0;
    const plist = progs.map((p) => ({ title: p.title, coach: p.coach, dur: p.dur, price: p.price, cover: p.cover, weeks: p.dur.split(' de ')[0], workouts: p.dur.split(' · ')[1] || '', open: open('program', p) }));
    const retryP = () => { set({ loadingP: true }); setTimeout(() => this.setState({ loadingP: false, retry: true }), 1100); };

    // Blocos de topo
    const LINKS = [
      { id: 'rafael', coach: 'Rafael Lima', photo: B('bdc7ef1c8dbf05558c3bf8d575fc3a04'), kind: 'Acompanhamento online', today: 'treino de hoje publicado', week: 'Treino B · 50 min · semana 3 de 12', cta: 'Abrir acompanhamento' },
      { id: 'gabriel', coach: 'Gabriel Santos', photo: B('4534df06b7d037ae994cb151849342b0'), kind: 'Treino presencial 2x por semana', today: 'sem sessão hoje', week: 'próxima sessão qui 29/10 às 07:00 · Londrina', cta: 'Abrir acompanhamento' }
    ];
    const twoLinks = S.scen === 'dois';
    const lkRaw = LINKS[twoLinks ? S.link : 0];
    const lk = Object.assign({}, lkRaw, {
      go: open('info', { title: lkRaw.cta, lines: ['Abre o app do aluno em Hoje, com a programação de ' + lkRaw.coach + '.', 'A navegação do aluno é Hoje · Treinos · Evolução · Mensagens · Conta, sem ferramentas de IA.'], cta: 'Entendi' }),
      msg: open('info', { title: 'Mensagens', lines: ['Abre a conversa com ' + lkRaw.coach + ' no app do aluno.', 'Mensagem não altera o contrato nem a programação.'], cta: 'Entendi' })
    });
    const linkTabs = LINKS.map((l, i) => ({ coach: l.coach, kind: l.kind, cls: 'seg__it' + (S.link === i ? ' is-on' : ''), on: S.link === i ? 'true' : 'false', pick: () => set({ link: i }) }));
    // produto: quem está logado vê primeiro o próprio acompanhamento ou pedido; a última busca fica só neste aparelho
    const PRODH = !document.documentElement.classList.contains('demo');
    const lsGet = (k) => { try { return window.localStorage.getItem(k); } catch (_) { return null; } };
    const lsSet = (k, v) => { try { if (v == null) window.localStorage.removeItem(k); else window.localStorage.setItem(k, v); } catch (_) {} };
    const avatar = (name) => { const ini = String(name || '?').split(' ').filter(Boolean).map((x) => x[0]).slice(0, 2).join('').toUpperCase(); return 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#E4E4E7"/><text x="32" y="40" font-family="Arial,sans-serif" font-size="24" font-weight="700" text-anchor="middle" fill="#3F3F46">' + ini + '</text></svg>'); };
    const myLink = PRODH && window.ACCT && window.ACCT.myTrainer ? window.ACCT.myTrainer() : null;
    const myReq = PRODH && !myLink ? (window.__myRequests || []).filter((r) => r.mine === 'aluno' && r.status === 'pendente')[0] : null;
    const dmy = (iso) => iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '';
    const showLink = PRODH ? !!myLink : (S.scen === 'vinculo' || S.scen === 'dois');
    const showPending = PRODH ? !!myReq : S.scen === 'pendente';
    const showCont = PRODH ? (lsGet('c99.tela.busca') === '1' && !S.retCleared) : (S.scen === 'retorno' && !S.retCleared);
    const showHero = !showCont;
    if (myLink) Object.assign(lk, { coach: myLink.trainerName || 'Seu treinador', photo: avatar(myLink.trainerName),
      today: myLink.status === 'pausado' ? 'Acompanhamento pausado' : (myLink.workout ? 'Treino disponível: ' + myLink.workout.title : (myLink.prep === 'awaiting_client' ? 'Preparação pendente: 4 perguntas' : 'Treino em preparação')),
      week: 'vínculo desde ' + dmy(myLink.since), go: () => window.NAV.go('aluno', {}, this) });
    const heroCls = 'v4-hero';
    const recent = [byId('rafael'), byId('gabriel')].map((t, i) => ({ name: t.name, photo: t.photo, when: i ? 'visto ontem' : 'visto em 25/10', open: () => window.NAV.go('perfil', { id: t.id }, this) }));

    // Folha atual
    const sh = S.sheet, sd = S.sd || {};
    const titles = { sport: 'Modalidade ou objetivo', city: 'Onde você quer treinar?', edit: 'Alterar busca', trainer: 'Resumo do treinador', why: 'Por que estou vendo isto?', order: 'Como ordenamos', program: sd.title || 'Programa', saved: 'Salvos', auth: sd.title || 'Entrar', menu: 'Menu', pedido: 'Seu pedido', info: sd.title || '' };
    const subs = { sport: '', city: '', saved: visitor ? '' : 'Guardados na sua conta.', auth: sd.why || '', program: sd.coach ? sd.coach + ' · ' + (sd.dur || '') : '' };
    const tvT = sh === 'trainer' ? byId(sd.id) : null;
    const tvOff = tvT ? offerFor(tvT, sd.ctx === 'online' ? 'online' : (tvT.pres && inCity(tvT) ? 'presencial' : 'online')) : null;
    const tv = tvT ? { name: tvT.name, spec: tvT.spec, where: tvT.pres && tvT.onl ? tvT.city + ' · presencial e online' : (tvT.pres ? tvT.city + ' · presencial' : 'online · ' + tvT.city),
      offer: tvOff ? tvOff[0] + ' · ' + tvOff[1] + ' ' + tvOff[2] + (tvT.more ? ' (e mais ' + tvT.more + (tvT.more === 1 ? ' oferta' : ' ofertas') + ' no perfil)' : '') : 'Sem oferta com preço publicada',
      rev: tvT.rating ? tvT.rating + ' · ' + tvT.n + ' avaliações de alunos com contratação concluída' : 'Ainda sem avaliações', cred: tvT.cref, availLong: tvT.avLong } : { name: '', spec: '', where: '', offer: '', rev: '', cred: '', availLong: '' };
    const whyT = sh === 'why' ? byId(sd.id) : null;
    const whyLines = whyT ? ['Você buscou ' + ctxLine + '.', whyT.name + ': ' + (sd.reason || '') + '.', 'A ordem não muda por plano Pro, anúncio ou comissão.'] : [];
    const pv = sh === 'program' ? sd : { title: '', coach: '', dur: '', price: '' };
    const favN = Object.keys(S.favs).filter((k) => S.favs[k]).length;
    const savedList = Object.keys(S.favs).filter((k) => S.favs[k] && byId(k)).map((k) => { const t = byId(k); return { name: t.name, spec: t.spec, ini: t.ini || t.name.split(' ').map((w) => w[0]).slice(0, 2).join(''), remove: (e) => set(Object.assign({ favs: Object.assign({}, S.favs, { [k]: false }) }, toastAt(e, t.name + ' removido dos salvos.', { k: 'fav', id: k, v: true }))) }; });

    const goto = (title, target) => open('info', { title: title, lines: ['Ainda não disponível: ' + target.replace(/ \(board [^)]*\)/, '') + '.', 'A busca vai junto: ' + ctxLine + '. Voltar devolve você a esta posição.'], cta: 'Voltar à Home' });
    const info = (title, lines) => open('info', { title: title, lines: lines, cta: 'Fechar' });
    const authOpen = (why, title, done, okText) => open('auth', { why: why, title: title || 'Entrar', done: done || 'Entrar', ok: okText || 'Pronto, você entrou.' });
    const menuItems = (visitor ? [['Treinadores', () => this.setState({ sheet: null })], ['Esportes', () => this.setState({ sheet: 'sport', sd: null })], ['Programas', () => this.setState({ sheet: null })], ['Salvos (' + favN + ')', () => this.setState({ sheet: 'saved', sd: null })], ['Entrar', () => window.NAV.go('onboarding', { flow: 'entrar' }, this), () => this.setState({ sheet: 'auth', sd: { why: 'Use o e-mail ou celular da sua conta.', title: 'Entrar', done: 'Entrar', ok: 'Pronto, você entrou.' }, code: 0 })], ['Sou treinador', () => window.NAV.go('onboarding', { flow: 'treinador' }, this), () => this.setState({ sheet: 'auth', sd: { why: 'Comece no Essencial: grátis, até 3 alunos ativos. O teste do Pro é opcional e só começa se você ativar, depois de ver preço, ciclo e data da primeira cobrança.', title: 'Criar meu perfil de treinador', done: 'Criar perfil', ok: 'Conta criada. Próximo passo: completar o mínimo do perfil.' }, code: 0 })]]
      : [['Meu acompanhamento', () => this.setState({ sheet: 'info', sd: { title: 'Meu acompanhamento', lines: ['Abre o app do aluno em Hoje.'], cta: 'Fechar' } })], ['Treinadores', () => this.setState({ sheet: null })], ['Esportes', () => this.setState({ sheet: 'sport', sd: null })], ['Salvos (' + favN + ')', () => this.setState({ sheet: 'saved', sd: null })], ['Conta e troca de papel', () => this.setState({ sheet: 'info', sd: { title: 'Conta', lines: ['Dados, privacidade, histórico e troca de papel ficam em Conta.', 'Trocar para o papel de treinador é sempre explícito; nada muda sem aviso.'], cta: 'Fechar' } })]]).map(([label, go]) => ({ label, go }));

    const doUndo = () => { const u = S.toast && S.toast.undo; if (!u) return set({ toast: null });
      if (u.k === 'fav') return set({ favs: Object.assign({}, S.favs, { [u.id]: u.v }), toast: null });
      if (u.k === 'hide') return set({ hidden: Object.assign({}, S.hidden, { [u.id]: false }), toast: null });
      if (u.k === 'prefs') return set({ hidden: u.prev, toast: null });
      if (u.k === 'clear') return set({ retCleared: false, toast: null });
      if (u.k === 'recent') return set({ recentCleared: false, toast: null });
      if (u.k === 'ped') return set({ pedCanceled: false, toast: null });
      set({ toast: null }); };

    const ftrLinks = [['CrossFit em Londrina', 'crossfit'], ['Musculação em Londrina', 'musculacao'], ['Corrida em Londrina', 'corrida'], ['Treinadores online', null]].map(([label, id]) => ({ label, go: () => window.NAV.go('esporte', id ? { mod: window.NAV.modOf(id), city: 'Londrina, PR', fmt: 'Presencial' } : { fmt: 'Online' }, this) }));


    // VFINAL: vitrines da referência
    const goSec = (id) => () => { try { if (pageScroll()) { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } } catch (_) {} };
    const CATS = [['Consultoria online', 'treino no app e ajuste semanal', '53bc58b2a2121cf553d701e2bbe3f479'], ['Personal presencial', 'no box, academia ou parque', '4668933ec61ec0207dd2b4c1f6a7ef8d'], ['Planilha de treino', 'compra única ou mensal, com ou sem ajuste', 'c8d005a48d00045a2dda46182cbf5291'], ['Programas em vídeo', 'no seu ritmo, acesso por 12 meses', 'ae171f9728b88fd3de99402e707725b5'], ['Aulas em grupo', 'turmas com horário fixo', '1860c6c9a5b801160bf7b69b6966d525']];
    const cats = CATS.map(([label, sub, img]) => ({ label, sub, img: B(img), go: () => window.NAV.go('esporte', { mod: sportLabel, fmt: /online|Planilha|vídeo/i.test(label) ? 'Online' : 'Presencial' }, this) }));
    const SVC = [
      { coach: 'Rafael Lima', first: 'Rafael', kind: 'Acompanhamento', title: 'Treino semanal no app, ajuste a cada 15 dias e mensagens', rate: '★ 4,9 (23)', price: 'R$ 200', unit: '/ mês', cover: '4f287f956509500f4c89225daef9c5c5', av: 'bdc7ef1c8dbf05558c3bf8d575fc3a04' },
      { coach: 'Diego Moraes', first: 'Diego', kind: 'Personal presencial', title: 'Sessão individual de 60 min de CrossFit e condicionamento', rate: '★ 4,8 (56)', price: 'R$ 90', unit: '/ sessão', cover: '1860c6c9a5b801160bf7b69b6966d525', av: '348bafe032c42fc5274e3de9d8004df2' },
      { coach: 'Carolina Albuquerque Montenegro', first: 'Carolina', kind: 'Aulas em grupo', title: 'Turma pequena de CrossFit na Zona Sul, até 6 pessoas', rate: 'Ainda sem avaliações', price: 'R$ 60', unit: '/ aula', cover: 'ae171f9728b88fd3de99402e707725b5', av: null, ini: 'CM' },
      { coach: 'Juliana Prates', first: 'Juliana', kind: 'Consultoria online', title: 'Pilates e mobilidade, 2 aulas ao vivo por semana pelo app', rate: '★ 5,0 (14)', price: 'R$ 180', unit: '/ mês', cover: 'a8e3bd5a89dffa722591b85c65c3dc53', av: '760aa097a2f14e3d3f35aad0ad7a0090' },
      { coach: 'Rafael Lima', first: 'Rafael', kind: 'Personal presencial', title: 'Força e técnica em Londrina, sessão de 60 min', rate: '★ 4,9 (23)', price: 'R$ 80', unit: '/ sessão', cover: '4668933ec61ec0207dd2b4c1f6a7ef8d', av: 'bdc7ef1c8dbf05558c3bf8d575fc3a04' },
      { coach: 'Carolina Albuquerque Montenegro', first: 'Carolina', kind: 'Planilha de treino', title: 'Planilha mensal no app, com ajuste a cada 15 dias', rate: 'Ainda sem avaliações', price: 'R$ 150', unit: '/ mês', cover: '53bc58b2a2121cf553d701e2bbe3f479', av: null, ini: 'CM' },
      { coach: 'Patrícia Rocha', first: 'Patrícia', kind: 'Personal presencial', title: 'CrossFit e mobilidade na Zona Leste, sessão de 60 min', rate: '★ 4,7 (9)', price: 'R$ 85', unit: '/ sessão', cover: 'ddc2a85a675b6360b30e74c352a6a43a', av: 'd80d1c82749ab145627ab4015f6f6041' },
      { coach: 'Bruno Teixeira', first: 'Bruno', kind: 'Personal presencial', title: 'Musculação e corrida, sessão de 60 min', rate: 'Ainda sem avaliações', price: 'R$ 75', unit: '/ sessão', cover: 'c8d005a48d00045a2dda46182cbf5291', av: '349006eab36388172034672605e15a49' }
    ];
    const svcs = SVC.map((v) => ({ coach: v.coach, kind: v.kind, title: v.title, rate: v.rate, price: v.price, unit: v.unit, cover: B(v.cover), hasAv: !!v.av, noAv: !v.av, av: v.av ? B(v.av) : '', ini: v.ini || '', open: open('svc', v) }));
    const PG4 = [
      { title: 'CrossFit Base', coach: 'Rafael Lima', weeks: '12 semanas', level: 'Iniciante', dur: '12 semanas de programação · 36 treinos', price: 'R$ 197', cover: '4f287f956509500f4c89225daef9c5c5' },
      { title: 'Primeiro Ring Muscle-Up', coach: 'Larissa Nunes', weeks: '12 semanas', level: 'Intermediário', dur: '12 semanas de programação · 36 treinos', price: 'R$ 147', cover: 'ae171f9728b88fd3de99402e707725b5' },
      { title: 'LPO Booster', coach: 'Gabriel Santos', weeks: '8 semanas', level: 'Intermediário', dur: '8 semanas de programação · 24 treinos', price: 'R$ 97', cover: '1860c6c9a5b801160bf7b69b6966d525' },
      { title: 'Base de Corrida 5K', coach: 'Renata Lopes', weeks: '8 semanas', level: 'Iniciante', dur: '8 semanas de programação · 24 treinos', price: 'R$ 147', cover: 'd7f58212b752ef1353285564cfe093c1' }
    ];
    const plist4 = PG4.map((p) => Object.assign({}, p, { cover: B(p.cover), open: open('program', Object.assign({}, p, { cover: B(p.cover) })) }));
    const TILES = [['Musculação', 'força e hipertrofia', 'ddc2a85a675b6360b30e74c352a6a43a', 'musculacao'], ['CrossFit', 'LPO, ginástica, WOD', '4f287f956509500f4c89225daef9c5c5', 'crossfit'], ['Yoga e Pilates', 'mobilidade e postura', 'a8e3bd5a89dffa722591b85c65c3dc53', 'pilates'], ['Corrida', 'do 5 km à maratona', 'd7f58212b752ef1353285564cfe093c1', 'corrida'], ['Natação', 'técnica e performance', 'd638b9405ce41661a674fe9a2b40e890', 'natacao'], ['Lutas', 'muay thai, boxe, jiu-jitsu', 'f1d53560db4fc016d4604ed68cf1b86d', 'lutas']];
    const TINT = { musculacao: 'forca', crossfit: 'forca', pilates: 'mente', corrida: 'corrida', natacao: 'agua', lutas: 'lutas' };
    const sportTiles = TILES.map(([label, sub, img, id]) => ({ label, sub, img: B(img), tint: '--tint: var(--sp-' + TINT[id] + ')', go: () => window.NAV.go('esporte', { mod: window.NAV.modOf(id) }, this) }));
    const GUIDES = [['Guia · Musculação', 'Como escolher um personal trainer: 7 perguntas antes de contratar', 'ddc2a85a675b6360b30e74c352a6a43a'], ['Guia · Corrida', 'Planilha ou consultoria? O que faz sentido para a sua primeira prova', 'd7f58212b752ef1353285564cfe093c1'], ['Guia · CrossFit', 'Do primeiro WOD ao Open: quanto tempo leva e com quem treinar', '4f287f956509500f4c89225daef9c5c5']];
    const guides = GUIDES.map(([kind, title, img]) => ({ kind, title, img: B(img), go: info(title, ['Guia editorial: conteúdo de apoio, sem venda dentro do texto.', 'Texto completo ainda não publicado.']) }));
    const CL = ['Personal trainer em Londrina', 'CrossFit em Londrina', 'Pilates em Londrina', 'Personal trainer em Maringá', 'CrossFit em Maringá', 'Pilates em Maringá', 'Personal trainer em Curitiba', 'CrossFit em Curitiba', 'Pilates em Curitiba', 'Personal trainer em Cambé', 'CrossFit em Cambé', 'Pilates em Cambé'];
    const cityLinks = CL.map((label) => ({ label, go: () => { const a = label.split(' em '); window.NAV.go('esporte', { mod: a[0] === 'Personal trainer' ? 'Musculação' : a[0], city: a[1] + ', PR', fmt: 'Presencial' }, this); } }));
    const exploreChips = [['Corrida', 'corrida'], ['Yoga e Pilates', 'pilates'], ['Funcional', 'funcional'], ['Lutas', 'lutas'], ['Online', null]].map(([label, id]) => ({ label, go: id ? (() => set({ sport: id, hidden: {}, toast: null })) : (() => set({ mode: 'online', hidden: {}, toast: null })) }));
    const svT = sh === 'svc' ? sd : null;
    const pedLine = S.pedCanceled ? ['Pedido cancelado', 'Cancelado em 26/10. Nada foi cobrado.', 'badge badge--plain'] : ['Aguardando resposta', 'Rafael responde até 28/10.', 'badge badge--warn'];


    // ---------- r6: busca com sugestões (DS · Componentes-15) ----------
    const sxRect = (el) => { try { if (!el || !el.getBoundingClientRect) return null; const r = el.getBoundingClientRect(); if (!r.width) return null; const sy = window.scrollY || window.pageYOffset || 0; const dw = document.documentElement.clientWidth || 1440; const w = Math.min(Math.max(Math.round(r.width), 560), dw - 32); const x = Math.max(16, Math.min(Math.round(r.left), dw - w - 16)); return { sxY: Math.round(r.bottom + sy + 8), sxX: x, sxW: w }; } catch (_) { return null; } };
    const sxHdr = () => { try { return document.getElementById('vf-hsx'); } catch (_) { return null; } };
    const sxAnchor = (e) => { let el = e && (e.currentTarget || e.target); try { el = el && el.closest ? (el.closest('[data-sx]') || el) : el; } catch (_) {} return sxRect(el) || sxRect(sxHdr()) || {}; };
    const openSx = (e) => set(Object.assign({ sx: 'on', sheet: null, toast: null }, sxAnchor(e)));
    const sxClose = () => set({ sx: null });
    const sxQ = (q) => () => set({ sx: 'on', sxq: q, sxIa: false, sxTab: 'Treinadores' });
    const sxDo = (f) => (e) => { set({ sx: null }); f(e); };
    const sxScroll = () => { try { if (pageScroll()) { const el = document.getElementById((window.innerWidth || 1440) < 600 ? 'treinadores-app' : 'treinadores'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } } catch (_) {} };
    const sq = S.sxq || '', sql = sq.toLowerCase();
    const sxWords = sql.split(' ').filter((w) => w).length;
    const sxIsIa = !!S.sxIa && sxWords > 2;
    const sxIsTam = sql.indexOf('tamarana') >= 0;
    const sxIsCross = sql.indexOf('cross') >= 0 && !sxIsTam;
    const sxReal = (window.REAL && sq && !sxIsIa) ? window.REAL.search(sq) : null;
    const sxSt = !S.sx ? '' : (sxIsIa ? 'ia' : (!sq ? 'empty' : ((sxReal ? sxReal.length : sxIsCross) ? 'typing' : 'none')));
    const sxTrD = [['Rafael Lima', 'bdc7ef1c8dbf05558c3bf8d575fc3a04', 'Treinador de ', 'Fit e Musculação', true, 'RL'], ['Diego Moraes', '348bafe032c42fc5274e3de9d8004df2', 'Treinador de ', 'Fit e Lutas', true, 'DM'], ['Gabriel Santos', '4534df06b7d037ae994cb151849342b0', 'Treinador de ', 'Fit e LPO', true, 'GS'], ['Carolina Albuquerque Montenegro', '', 'Treinadora de ', 'Fit e Funcional', false, 'CM']].map(([n, img, pre, post, ver, ini]) => ({ name: n, hasImg: !!img, noImg: !img, img: img ? B(img) : '', ini: ini, pre: pre, mk: 'Cross', tag: 'CrossFit', post: post, verified: ver, city: 'Londrina, PR', go: window.NAV.coachId(n) ? sxDo(() => window.NAV.go('perfil', { id: window.NAV.coachId(n) }, this)) : sxDo(goto('Perfil de ' + n, 'o perfil de ' + n)) }));
    const sxCut = (txt) => { const f = (x) => x.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); const w = f(sq).split(' ').filter(Boolean)[0] || ''; const at = w ? f(txt).indexOf(w) : -1; return at < 0 ? [txt, '', ''] : [txt.slice(0, at), txt.slice(at, at + w.length), txt.slice(at + w.length)]; };
    const sxTr = sxReal ? sxReal.map((t) => { const c = sxCut(t.spec || 'Treinador'); return { name: t.name, hasImg: !!t.photo, noImg: !t.photo, img: t.photo, ini: t.ini, pre: c[0], mk: c[1], post: c[2], tag: t.city || 'Online', verified: false, city: t.city, go: sxDo(() => window.NAV.go('perfil', { id: t.id }, this)) }; }) : sxTrD;
    const sxPr = ((sxReal && !sxIsCross) || !document.documentElement.classList.contains('demo') ? [] : plist4.slice(0, 3)).map((p) => { const cf = p.title.indexOf('Cross') === 0; return { cover: p.cover, pre: cf ? '' : p.title, mk: cf ? 'Cross' : '', post: cf ? p.title.slice(5) : '', sub: p.coach + (cf ? '' : ' · CrossFit') + ' · ' + p.weeks, price: p.price, go: sxDo(p.open) }; });
    const sxCf = chips.filter((c) => c.label === 'CrossFit')[0] || chips[0];
    const sxRecL = [];
    if (S.sxR1) sxRecL.push({ t: 'CrossFit', s: ' · Londrina · presencial', go: sxQ('crossfit'), rm: () => set({ sxR1: false }) });
    if (S.sxR2) sxRecL.push({ t: 'Musculação', s: ' · online', go: sxDo(() => window.NAV.go('esporte', { mod: 'Musculação', fmt: 'Online' }, this)), rm: () => set({ sxR2: false }) });
    const sxHot = [['Personal trainer Londrina', null], ['CrossFit para iniciantes', 'crossfit iniciante'], ['Pilates', null], ['Corrida 5 km', null], ['Musculação online', null]].map(([label, q]) => ({ label: label, go: q ? sxQ(q) : sxDo(() => window.NAV.go('esporte', ({ 'Personal trainer Londrina': { mod: 'Musculação', city: 'Londrina, PR', fmt: 'Presencial' }, 'Pilates': { mod: 'Pilates' }, 'Corrida 5 km': { mod: 'Corrida' }, 'Musculação online': { mod: 'Musculação', fmt: 'Online' } })[label] || {}, this)) }));
    const sxTabs = ['Treinadores', 'Programas', 'Esportes'].map((l) => ({ label: l, cls: 'sx-tab' + (S.sxTab === l ? ' is-on' : ''), on: String(S.sxTab === l), pick: () => set({ sxTab: l }) }));
    const sxCountT = S.sxTab === 'Programas' ? '3 programas de CrossFit para “' + sq + '”' : (S.sxTab === 'Esportes' ? '1 modalidade para “' + sq + '”' : (sxReal ? (() => { const n = window.REAL.total(sq); return n + (n === 1 ? ' treinador' : ' treinadores') + ' para “' + sq + '”'; })() : '11 treinadores e 3 programas para “' + sq + '” em Londrina'));
    const sxScens = [['Busca: antes de digitar', '', false], ['Busca: digitando “cross”', 'cross', false], ['Busca: IA', 'quero perder peso treinando de manhã perto de casa', true], ['Busca: sem resultado', 'crossfit tamarana', false]].map(([label, q, ia]) => { const on = !!S.sx && S.sxq === q && !!S.sxIa === ia; return { label: label, cls: 'chip' + (on ? ' is-on' : ''), on: String(on), pick: () => set(Object.assign({ sx: 'on', sxq: q, sxIa: ia, sheet: null, toast: null, sxTab: 'Treinadores' }, sxRect(sxHdr()) || {})) }; });
    const SXR = {
      sxOpen: !!S.sx, sxExp: String(!!S.sx), sxPos: 'top: ' + S.sxY + 'px; left: ' + S.sxX + 'px; width: ' + S.sxW + 'px',
      openSx, sxClose, sxScens, sxTabs, sxTabT: S.sxTab === 'Treinadores', sxTabP: S.sxTab === 'Programas', sxTabE: S.sxTab === 'Esportes',
      sxEmpty: sxSt === 'empty', sxTyping: sxSt === 'typing', sxCrossRows: document.documentElement.classList.contains('demo') && (!sxReal || sxIsCross), sxIaS: sxSt === 'ia', sxNone: sxSt === 'none',
      sxQText: sq || 'Pesquisar treinadores, programas, esportes', sxq: sq, sxType: (e) => set({ sx: 'on', sxq: (e.target && e.target.value) || '', sxIa: false, sxTab: 'Treinadores', sheet: null }), sxInCls: 'sx-in' + (sq ? '' : ' is-ph'), sxHasQ: !!sq,
      sxClear: () => set({ sxq: '', sxIa: false, sx: S.sx ? 'on' : null }),
      sxIaOn: String(!!S.sxIa), sxIaCls: 'sx-ia' + (S.sxIa ? ' is-on' : ''), sxIaQc: 'qchip sx-iaq' + (S.sxIa ? ' is-on' : ''),
      sxToggleIa: () => set({ sxIa: !S.sxIa }), sxIaOpen: (e) => set(Object.assign({ sx: 'on', sxIa: !S.sxIa, sheet: null }, sxAnchor(e))),
      sxHasRec: !PRODH && sxRecL.length > 0, sxRec: sxRecL,
      // produto: sem contagem de buscas, não chamamos de 'em alta' nem inventamos buscas recentes
      sxHotTitle: PRODH ? 'Sugestões para explorar' : 'Em alta em Londrina', sxHotNote: PRODH ? 'Sugestões fixas para começar. Nada aqui é patrocinado.' : 'Buscas mais feitas na cidade nos últimos 7 dias, somadas sem identificar ninguém. Nada aqui é patrocinado.', sxRecClear: () => set({ sxR1: false, sxR2: false }), sxHot,
      sxMods: chips.slice(0, 6).map((c) => ({ label: c.label, icon: c.icon, pick: sxDo(c.pick) })),
      sxModIcon: sxCf.icon, sxModGo: sxDo(() => window.NAV.go('esporte', { mod: 'CrossFit', city: 'Londrina, PR', fmt: 'Presencial' }, this)),
      sxTr, sxPr, sxPr1: sxPr.slice(0, 1), sxCount: sxCountT, sxAllLabel: S.sxTab === 'Programas' ? 'Ver os 3 programas' : 'Ver todos os resultados',
      sxMcta: S.sxTab === 'Programas' ? 'Ver os 3 programas' : 'Ver 11 treinadores e 3 programas',
      sxAll: () => { set({ sx: null }); window.NAV.go('esporte', { mod: 'CrossFit' }, this); },
      sxIaChips: sxIsCross || sql.indexOf('crossfit') >= 0 ? ['CrossFit', 'Londrina, PR', 'Presencial'] : ['Funcional', 'Londrina, PR', 'Presencial', 'Manhã', 'Iniciante'],
      sxIaNote: sql.indexOf('peso') >= 0 ? '“Perder peso” não vira filtro: nenhum treinador promete resultado.' : 'Tamarana não tem CrossFit presencial; a cidade vizinha entrou como sugestão.',
      sxIaApply: () => { set({ sx: null, sxIa: false }); window.NAV.go('esporte', { mod: sql.indexOf('peso') >= 0 ? 'Funcional' : 'CrossFit', city: 'Londrina, PR', fmt: 'Presencial' }, this); },
      sxIaOff: () => set({ sxIa: false }),
      sxNoneT: sxIsTam ? 'Nenhum treinador de CrossFit presencial em Tamarana' : 'Nada encontrado para “' + sq + '”',
      sxNear: () => { set({ sx: null, sxq: '' }); window.NAV.go('esporte', { mod: 'CrossFit', city: 'Londrina, PR', fmt: 'Presencial' }, this); },
      sxOnline: () => { set({ sx: null, sxq: '' }); window.NAV.go('esporte', { mod: 'CrossFit', fmt: 'Online' }, this); },
      sxAskIa: () => set({ sxIa: true, sxq: 'quero treinar crossfit perto de tamarana' }),
      sxFilters: sxDo(open('edit')), sxCity: sxDo(open('city')),
      sxLive: sxSt === 'typing' ? sxCountT : (sxSt === 'none' ? 'Nenhum resultado' : (sxSt === 'empty' ? 'Sugestões abertas' : ''))
    };
    return {
      rootCls: 'w v4' + (S.sheet ? ' has-sheet' : '') + (S.sx ? ' sx-on' : ''), ...SXR, goTop: () => { try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (_) {} }, openAccount: visitor ? () => window.NAV.go('onboarding', { flow: 'entrar' }, this) : open('menu'), scens, scenName, scenDesc: DESC[S.scen], reset: () => this.setState(Component.init(S.scen)),
      hasFav: favN > 0, skip: () => { try { const el = document.getElementById('conteudo'); if (el) { el.setAttribute('tabindex', '-1'); el.focus(); } } catch (_) {} }, visitor, logged, mineLabel: S.scen === 'pendente' ? 'Meu pedido' : 'Meu acompanhamento', favN: String(favN),
      menuOpen: sh === 'menu' ? 'true' : 'false', openMenu: open('menu'), openMine: S.scen === 'pendente' ? open('pedido') : lk.go,
      goTrainers: () => window.NAV.go('esporte', {}, this), goPrograms: info('Programas', ['Ainda não há programas publicados na 99coach.', 'Quando um treinador publicar um programa, ele aparece aqui e na página do esporte.']),
      openSports: open('sport'), openSport: open('sport'), openCity: open('city'), openSaved: open('saved'),
      openLogin: () => window.NAV.go('onboarding', { flow: 'entrar' }, this), __openLogin0: authOpen('Use o e-mail ou celular da sua conta.'), openLoginSaved: authOpen('Para guardar seus salvos na conta e ver em outro aparelho.', 'Entrar', 'Entrar', 'Pronto. Seus ' + favN + ' salvos foram para a sua conta.'),
      openPro: () => window.NAV.go('onboarding', { flow: 'treinador' }, this), __openPro0: authOpen('Comece no Essencial: grátis, até 3 alunos ativos. O teste do Pro é opcional e só começa se você ativar, depois de ver preço, ciclo e data da primeira cobrança.', 'Criar meu perfil de treinador', 'Criar perfil', 'Conta criada. Próximo passo: completar o mínimo do perfil.'),
      openPanel: () => window.NAV.go('onboarding', { flow: 'entrar' }, this), __openPanel0: authOpen('Entre para abrir o seu painel de treinador.', 'Entrar no painel', 'Entrar', 'Pronto. Abrindo seu painel.'),
      openHelp: () => window.GO('PUB11'),
      openPriv: () => window.GO('PUB11', { art: 'privacidade' }), openTerms: () => window.GO('PUB11', { art: 'termos' }),
      openCookies: () => window.GO('PUB11', { art: 'cookies' }),
      openLang: info('Idioma e região', ['Idioma da interface: Português (Brasil).', 'País e moeda: Brasil · R$. Idioma, país, moeda, cidade e idioma de atendimento são escolhas separadas.']),
      openHist: info('Histórico neste aparelho', ['Você autorizou guardar a última busca e os perfis vistos por 30 dias.', 'Limpar a busca não apaga seus salvos nem acompanhamentos. Você pode desligar o histórico a qualquer momento em Conta.']),
      // hero
      showHero, heroCls, h1a: 'Encontre seu', h1b: 'treinador.',
      sportLabel, cityLabel, cityCls: 'v4-fv' + (S.city ? '' : ' is-empty'), cityShort: (S.city || 'sem cidade').replace(', PR', ''), modeLabel,
      segP: 'seg__it' + (S.mode === 'presencial' ? ' is-on' : ''), segO: 'seg__it' + (S.mode === 'online' ? ' is-on' : ''), segQ: 'seg__it' + (S.mode === 'qualquer' ? ' is-on' : ''),
      prP: String(S.mode === 'presencial'), prO: String(S.mode === 'online'), prQ: String(S.mode === 'qualquer'),
      modeP: setMode('presencial'), modeO: setMode('online'), modeQ: setMode('qualquer'),
      doSearch: (e) => { if (e && e.preventDefault) e.preventDefault(); try { window.localStorage.setItem('c99.tela.busca', '1'); } catch (_) {} if (!S.city && S.mode === 'presencial') { return set({ sheet: 'city', sd: null, y: yOf(e), loc: 0 }); } window.NAV.go('esporte', {}, this); },
      useLoc: (e) => set({ sheet: 'city', sd: null, y: yOf(e), loc: 1, toast: null }),
      chips, allSports, editSports, goals, cities,
      // topo
      showLink, twoLinks, linkTabs, lk, linkTitle: twoLinks ? 'Seus acompanhamentos' : 'Seu acompanhamento',
      pedPhoto: myReq ? avatar(myReq.trainerName) : B('272071ea45b1ee18'), contNote: PRODH ? 'Sua última escolha, guardada só neste aparelho.' : 'Sua última escolha, guardada neste aparelho em 25/10 às 21:10 com o histórico que você autorizou.',
      showPending, pedStatus: myReq ? 'Aguardando resposta' : pedLine[0], pedCls: pedLine[2] + (S.pedCanceled ? '' : ''), pedTitle: myReq ? 'Pedido de acompanhamento para ' + (myReq.trainerName || 'o treinador') : (S.pedCanceled ? 'Pedido para Rafael Lima cancelado' : 'Pedido de acompanhamento para Rafael Lima'),
      pedText: myReq ? 'Enviado em ' + dmy(myReq.at) + (myReq.due ? ' · vale até ' + dmy(myReq.due) : '') + (myReq.offer ? ' · ' + myReq.offer : '') + '. Pedido não é vínculo: ainda não há acompanhamento ativo e nada foi cobrado.' : S.pedCanceled ? 'Nada foi cobrado. Você pode enviar um novo pedido pelo perfil quando quiser.' : 'Enviado em 26/10 às 09:40 · Acompanhamento online · R$ 200 / mês. Rafael responde até 28/10. Ainda não há acompanhamento ativo e nada foi cobrado.',
      pedCta: S.pedCanceled ? 'Ver perfil de Rafael' : 'Acompanhar pedido', openPedido: myReq ? () => window.NAV.go('aluno', {}, this) : (S.pedCanceled ? () => window.NAV.go('perfil', { id: 'rafael', scn: 'comparando' }, this) : open('pedido')),
      pedNow: pedLine[0], pedNowSub: pedLine[1], pedNowCls: S.pedCanceled ? '' : 'is-now', pedActive: !S.pedCanceled,
      pedMsg: open('info', { title: 'Mensagem para Rafael Lima', lines: ['Abre a conversa ligada a este pedido.', 'Mensagem não confirma o acompanhamento nem gera cobrança.'], cta: 'Entendi' }),
      pedCancel: (e) => set(Object.assign({ pedCanceled: true, sheet: null }, toastAt(e, 'Pedido cancelado. Nada foi cobrado.', { k: 'ped' }))),
      showCont, continueSearch: (e) => window.NAV.go('esporte', {}, this),
      openEdit: open('edit'), clearSearch: (e) => { if (PRODH) lsSet('c99.tela.busca', null); set(Object.assign({ retCleared: true }, toastAt(e, 'Busca limpa. Seus salvos continuam em Salvos.', { k: 'clear' }))); },
      showRecent: !PRODH && !S.recentCleared, recent, clearRecent: (e) => set(Object.assign({ recentCleared: true }, toastAt(e, 'Vistos recentemente limpos neste aparelho.', { k: 'recent' }))),
      // vitrines
      tTitle, tSub, nTotal: String(nTot), tNoLoc, tEmpty, tHas, tlist, alts, emptyText, openOrder: open('order'),
      seeAllT: () => window.NAV.go('esporte', {}, this),
      altHas, altNote, altList, altTitle, altSub, altAll, seeAllAlt: () => window.NAV.go('esporte', { fmt: S.mode === 'presencial' ? 'Online' : 'Presencial' }, this),
      pFail, pLoading, pHas, pEmpty, plist, retryP, seeAllP: goto('Programas', 'a lista de programas de ' + sportLabel),
      // folhas
      sheetOpen: !!sh, sheetTop: S.y + 'px', closeSheet: close, shTitle: titles[sh] || '', shSub: !!(subs[sh]), shSubText: subs[sh] || '',
      shSport: sh === 'sport', shCity: sh === 'city', shEdit: sh === 'edit', shTrainer: sh === 'trainer', shWhy: sh === 'why', shOrder: sh === 'order', shProgram: sh === 'program',
      shSaved: sh === 'saved', shAuth: sh === 'auth', shMenu: sh === 'menu', shPedido: sh === 'pedido', shInfo: sh === 'info',
      locAsk: S.loc === 1, locDenied: S.loc === 2, locBtn: S.loc === 0,
      locStart: () => set({ loc: 1 }), locAllow: (e) => set(Object.assign({ city: 'Londrina, PR', loc: 0, sheet: null, hidden: {} }, toastAt(e, 'Cidade definida pela localização aproximada: Londrina, PR. Seu endereço não é usado.', null))),
      locDeny: () => set({ loc: 2 }), onlyOnline: () => set({ mode: 'online', sheet: null, hidden: {} }),
      tv, ctxLine, tvPhotoTag: '', tvGo: tvT && window.NAV.has(tvT.id) ? () => window.NAV.go('perfil', { id: tvT.id }, this) : goto('Perfil de ' + (tvT ? tvT.name : ''), 'o perfil de ' + (tvT ? tvT.name : '') + ''),
      tvFavLabel: tvT && S.favs[tvT.id] ? 'Salvo' : 'Salvar', tvFav: () => tvT && set({ favs: Object.assign({}, S.favs, { [tvT.id]: !S.favs[tvT.id] }) }),
      whyLines, notInterested: (e) => set(Object.assign({ hidden: Object.assign({}, S.hidden, { [sd.id]: true }), sheet: null }, toastAt(e, (whyT ? whyT.name : 'Perfil') + ' ocultado só nesta busca.', { k: 'hide', id: sd.id }))),
      clearPrefs: (e) => set(Object.assign({ hidden: {}, sheet: null }, toastAt(e, 'Preferências desta busca limpas.', { k: 'prefs', prev: S.hidden }))),
      pv, pvBuy: authOpen('Para comprar ' + (pv.title || '') + ' (' + (pv.price || '') + ', pagamento único). Sua escolha fica guardada.', 'Entrar para comprar', 'Entrar e continuar', 'Pronto. Na versão completa, segue para o resumo da compra.'),
      pvCoach: window.NAV.coachId(pv.coach) ? () => window.NAV.go('perfil', { id: window.NAV.coachId(pv.coach), offer: pv.title === 'CrossFit Base' ? 'base' : null }, this) : goto('Serviços de ' + (pv.coach || ''), 'os serviços no perfil de ' + (pv.coach || '') + ''),
      savedList, savedEmpty: savedList.length === 0,
      codeAsk: S.code === 0, codeSent: S.code === 1, authOk: S.code === 2, authChoice: !sd.title || sd.title === 'Entrar',
      sendCode: () => set({ code: 1 }), resend: (e) => set(toastAt(e, 'Novo código enviado. O anterior deixou de valer.', null)), confirmCode: () => set({ code: 2 }),
      authDone: sd.done || 'Entrar', authOkText: sd.ok || 'Pronto.',
      signTrain: () => set({ sd: { why: 'Só o necessário para buscar, salvar e contratar.', title: 'Criar conta para treinar', done: 'Criar conta', ok: 'Conta criada. Você volta para a busca onde estava.' }, code: 0 }),
      signCoach: () => set({ sd: { why: 'Comece no Essencial: grátis, até 3 alunos ativos. O teste do Pro é opcional e só começa se você ativar.', title: 'Criar meu perfil de treinador', done: 'Criar perfil', ok: 'Conta criada. Próximo passo: completar o mínimo do perfil.' }, code: 0 }),
      menuItems, infoLines: sd.lines || [], infoCta: sd.cta || 'Fechar',
      toastOn: !!S.toast, toastMsg: S.toast ? S.toast.msg : '', toastUndo: !!(S.toast && S.toast.undo), toastTop: S.ty + 'px', doUndo, closeToast: () => set({ toast: null }),
      ftrLinks, mCities: info('Procure na sua cidade', CL), mPct: (() => { const m = /semana ([0-9]+) de ([0-9]+)/.exec(lk.week || ''); return m ? Math.round(100 * m[1] / m[2]) + '%' : ''; })(), mRing: /semana [0-9]+ de [0-9]+/.test(lk.week || ''), mRingStyle: (() => { const m = /semana ([0-9]+) de ([0-9]+)/.exec(lk.week || ''); const p = m ? Math.round(100 * m[1] / m[2]) : 0; return 'background: conic-gradient(var(--brand) ' + p + '%, var(--ink-3) 0)'; })(), mSvcN: String(svcs.length), mCityN: String(CL.length), cats, svcs, plist4, sportTiles, guides, cityLinks, exploreChips,
      shSvc: sh === 'svc', sv: svT ? Object.assign({}, svT) : { coach: '', first: '', kind: '', title: '', price: '', unit: '', rate: '' },
      svGo: window.NAV.svc(svT) ? () => window.NAV.go(window.NAV.svc(svT).page, window.NAV.svc(svT), this) : goto('Perfil de ' + (svT ? svT.coach : ''), 'o perfil de ' + (svT ? svT.coach : '') + ', com este serviço já escolhido'),
      seeAllSvc: goto('Serviços', 'a lista de serviços em ' + (S.city || 'todas as cidades') + ''), seeGuides: info('Guias', ['Lista de guias editoriais ainda não publicada.']),
      goProgramsSec: goSec('programas'), openPlans: info('Planos para treinadores', ['Essencial: grátis, até 3 alunos ativos, perfil, treinos e mensagens.', 'Pro: R$ 99/mês ou R$ 990/ano, até 50 alunos e 6.000 créditos de IA por mês. Teste de 7 dias só se você ativar.', 'Comissão de 5% só nas vendas pela 99Coach. O Pro não compra posição nem selo na busca.']),
      modeLow: modeLabel.toLowerCase(), cityShortTitle: (S.city || 'sua cidade').replace(', PR', '')
    };
  }
}


return Component; })(), frag: document.getElementById('tpl-home').content, css: document.getElementById('css-home') };
