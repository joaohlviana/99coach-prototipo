PAGES.perfil = { Comp: (function () {

class Component extends DCLogic {
  static img(id) { return window.__IMG[id] || ''; }

  constructor(props) { super(props); const p = props || {}; this.state = this.base(p.scn || 'comparando'); if (p.offer) this.state.offer = p.offer; if (p.rid) this.state.rid = p.rid; }

  base(scn) {
    const S = { novo: {}, comparando: { offer: 'online' }, oferta: { offer: 'sessao' }, aceite: { offer: 'online' }, pedido: { offer: 'online', req: 'enviado', user: 'voce' }, vinculo: { user: 'ana' }, horarios: { offer: 'sessao' }, importado: {}, semvaga: {}, desconhecida: {}, semoferta: {}, proprio: { user: 'rafael' }, retirado: {} };
    return Object.assign({ scn: scn, y: 160, ty: 160, slotDay: 'qua 28/10', faq: 0, offer: null, sheet: null, after: null, user: null, req: null, pay: 'Pix', fav: false, favNote: false, bio: false, sec: 'Sobre', slot: null, claim: 'inicio', revMore: false, map: false, preview: false, copied: false, topic: 'geral', vaga: false, bought: null, fixOpt: 0, repOpt: 0 }, S[scn] || {});
  }

  renderVals() {
    const favId = this.state.rid || '';
    if (window.FAV && favId && !document.documentElement.classList.contains('demo')) this.state.fav = window.FAV.has(favId);
    const st = this.state;
    const set = (o) => { if (o && 'fav' in o && favId && window.FAV && !document.documentElement.classList.contains('demo')) window.FAV.set(favId, !!o.fav); this.setState(o); };
    const B = (id) => Component.img(id);
    const yOf = (e) => { try { const el = e && (e.currentTarget || e.target); if (!el || !el.getBoundingClientRect) return st.y; const r = el.getBoundingClientRect(); return Math.max(12, Math.round(r.top + (window.scrollY || window.pageYOffset || 0) - 24)); } catch (_) { return st.y; } };
    const pageScroll = () => { try { return document.documentElement.scrollHeight > window.innerHeight + 40; } catch (_) { return false; } };
    const goSec = (id) => { try { if (pageScroll()) { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } } catch (_) {} };
    const open = (sheet, extra) => (e) => set(Object.assign({ sheet: sheet, y: yOf(e) }, extra || {}));
    const close = () => set({ sheet: null });

    // ---------- fixtures canônicas (E3) ----------
    const OF = {
      sessao: { id: 'sessao', pk: '60 min · Londrina · local combinado', title: 'Sessão presencial', kind: 'Sessão avulsa', inc: '60 min de treino individual em Londrina', meta: 'Uma sessão · local combinado com o Rafael', price: 'R$ 80', unit: '/ sessão', label: 'R$ 80 / sessão', flow: 'contratar', cta: 'Contratar sessão presencial', short: 'Contratar', total: 'R$ 80,00', next: 'Não renova', cycle: 'Por sessão', access: 'Use em até 30 dias', list: ['60 min de treino individual', 'Londrina · local combinado', 'Não renova'], fine: 'Você revisa o total antes de pagar. Pix ou cartão.' },
      online: { id: 'online', pk: 'Treino semanal no app · ajuste a cada 15 dias', title: 'Acompanhamento online', kind: 'Recorrente mensal', inc: 'Treino semanal no app, ajuste a cada 15 dias e mensagens', meta: 'Mensal · cancela quando quiser · sujeito a aceite do Rafael', price: 'R$ 200', unit: '/ mês', label: 'R$ 200 / mês', flow: 'pedido', cta: 'Solicitar acompanhamento', short: 'Solicitar', total: 'R$ 0,00 hoje', next: 'R$ 200,00 por mês, só depois do aceite', cycle: 'Mensal · cancela quando quiser', access: 'Enquanto a assinatura estiver ativa', list: ['Treino semanal no app', 'Ajuste a cada 15 dias', 'Mensagens com o Rafael', 'Mensal · cancela quando quiser'], fine: 'Pedido não é vínculo: nada é cobrado até o Rafael aceitar.' },
      dois: { id: 'dois', pk: '8 sessões por mês · horários fixos', title: 'Treino presencial 2x por semana', kind: 'Recorrente mensal', inc: '8 sessões por mês em Londrina', meta: 'Mensal · horários fixos combinados · sujeito a aceite', price: 'R$ 520', unit: '/ mês', label: 'R$ 520 / mês', flow: 'pedido', cta: 'Solicitar treino 2x por semana', short: 'Solicitar', total: 'R$ 0,00 hoje', next: 'R$ 520,00 por mês, só depois do aceite', cycle: 'Mensal · cancela quando quiser', access: '8 sessões por mês', list: ['8 sessões por mês (2x por semana)', 'Londrina · horários fixos', 'Mensal · cancela quando quiser'], fine: 'Pedido não é vínculo: nada é cobrado até o Rafael aceitar.' },
      avaliacao: { id: 'avaliacao', pk: 'Valor combinado antes de marcar', title: 'Avaliação física', kind: 'Sob consulta', inc: 'Composição corporal e avaliação de movimento', meta: 'Condição declarada pelo treinador: o valor depende do local e dos testes', price: '', unitNone: 'Sob consulta', label: 'Sob consulta', flow: 'consulta', cta: 'Consultar condições', short: 'Consultar', list: ['Composição corporal e movimento', 'Valor combinado antes de marcar'], fine: 'Mensagem não é contratação.' },
      base: { id: 'base', prog: true, pk: '12 semanas · acesso por 12 meses', meta: 'Pagamento único · 12 meses de acesso · sem acompanhamento individual', title: 'CrossFit Base', kind: 'Programa', inc: '12 semanas de programação · 36 treinos', facts: ['12 semanas de programação', '36 treinos', '12 meses de acesso', 'Sem acompanhamento individual'], img: '4f287f956509500f4c89225daef9c5c5', price: 'R$ 197', unit: 'pagamento único', label: 'R$ 197 · pagamento único', flow: 'contratar', cta: 'Comprar programa', short: 'Comprar', total: 'R$ 197,00', next: 'Não renova', cycle: 'Pagamento único', access: '12 meses de acesso (até 26/10/2027)', list: ['12 semanas de programação · 36 treinos', '12 meses de acesso', 'Sem acompanhamento individual'], fine: 'Compra de conteúdo; não inclui acompanhamento individual.' },
      g_sessao: { id: 'g_sessao', title: 'Treino presencial 2x por semana', kind: 'Recorrente mensal', inc: '8 sessões de 60 min por mês em Londrina', meta: 'Mensal · Gleba Palhano', price: 'R$ 480', unit: '/ mês', label: 'R$ 480 / mês' },
      c_aula: { id: 'c_aula', title: 'Aula presencial em grupo', kind: 'Aula avulsa', inc: '60 min em grupo de até 6 pessoas', meta: 'Uma aula · Zona Sul', price: 'R$ 60', unit: '/ aula', label: 'R$ 60 / aula' },
      c_online: { id: 'c_online', title: 'Planilha mensal com ajustes', kind: 'Recorrente mensal', inc: 'Planilha semanal no app e ajuste a cada 15 dias', meta: 'Mensal', price: 'R$ 150', unit: '/ mês', label: 'R$ 150 / mês' },
    };
    const TR = {
      rafael: { id: 'rafael', name: 'Rafael Lima', first: 'Rafael', photo: B('bdc7ef1c8dbf05558c3bf8d575fc3a04'), ini: 'RL', role: 'Treinador de CrossFit e Musculação', city: 'Londrina, PR', formats: 'Presencial e online', lang: 'Atende em português', avail: 'aceita', availDate: '20/10', own: '24/09/2026', ownNext: '09/2027', cref: 'ver', crefNum: '012345-G/PR', crefDate: '24/09/2026', crefUntil: '12/2027', avg: '4,9', n: 23,
        pitch: 'Atendo quem quer começar no CrossFit ou voltar à musculação com segurança. Na primeira semana avalio movimento e rotina; depois o treino chega toda semana no app, com ajuste a cada 15 dias. Presencial em Londrina ou online.',
        bio: 'Treino adultos iniciantes e intermediários desde 2017 (declarado). Não atendo reabilitação de lesões: nesses casos peço liberação de um profissional de saúde antes de começar. Metodologia: técnica antes de volume, progressão de carga registrada no app e conversa a cada ajuste.',
        offers: ['sessao', 'online', 'dois', 'avaliacao'], progs: ['base'], ext: '@rafaellima.treino',
        creds: [['CREF', '012345-G/PR', 'Verificado · válido até 12/2027', 1], ['Formação', 'Bacharel em Educação Física — UEL', 'Declarada pelo treinador', 0], ['Certificação', 'CrossFit Level 1 (CF-L1)', 'Declarada · não conferida', 0], ['Experiência', 'Treina adultos desde 2017', 'Declarada pelo treinador', 0]],
        where: [['Presencial', 'Londrina, PR — Centro e Zona Sul (regiões informadas)'], ['Online', 'Todo o Brasil, com treino no app da 99Coach'], ['Idioma', 'Português'], ['Horários', 'Sessão presencial: horário livre na agenda · acompanhamento: combinado depois do aceite']], map: 'Centro e Zona Sul de Londrina',
        reviews: [['Marina C.', 'Acompanhamento online · set/2026', 5, 'Comecei sem saber agachar direito. Os ajustes a cada 15 dias fizeram diferença e ele responde rápido.'], ['Paulo S.', 'Sessão presencial · ago/2026', 5, 'Sessão objetiva: corrigiu minha técnica no levantamento terra e deixou um plano para treinar sozinho.'], ['Lívia R.', 'Acompanhamento online · jul/2026', 4, 'Gostei do acompanhamento. Queria mais opções de treino curto para dias corridos.'], ['André M.', 'Treino presencial 2x por semana · jun/2026', 5, 'Pontual e atento à minha lesão antiga no ombro; pediu liberação médica antes de aumentar a carga.'], ['Juliana F.', 'Acompanhamento online · mai/2026', 5, 'Programação clara no app e ajustes bem explicados.']] },
      gabriel: { id: 'gabriel', name: 'Gabriel Santos', first: 'Gabriel', photo: B('4534df06b7d037ae994cb151849342b0'), ini: 'GS', role: 'Treinador de CrossFit e LPO', city: 'Londrina, PR', formats: 'Presencial', lang: 'Atende em português', avail: 'nao', availDate: '22/10', own: '10/08/2026', ownNext: '08/2027', cref: 'ver', crefNum: '098765-G/PR', crefDate: '10/08/2026', crefUntil: '06/2027', avg: '4,8', n: 29,
        pitch: 'CrossFit e levantamento olímpico (LPO), presencial na Gleba Palhano, em Londrina. Treinos de 60 minutos com registro de carga no app.', bio: '',
        offers: ['g_sessao'], progs: [], creds: [['CREF', '098765-G/PR', 'Verificado · válido até 06/2027', 1], ['Formação', 'Bacharel em Educação Física — Unopar', 'Declarada pelo treinador', 0]],
        where: [['Presencial', 'Londrina, PR — Gleba Palhano (região informada)'], ['Online', 'Não atende online'], ['Idioma', 'Português']], map: 'Gleba Palhano, Londrina',
        reviews: [['Renato P.', 'Sessão presencial · out/2026', 5, 'Treino bem montado e explicação clara de cada exercício.'], ['Camila T.', 'Sessão presencial · set/2026', 5, 'Atencioso com a técnica; saí sabendo ajustar a carga sozinha.']] },
      carolina: { id: 'carolina', name: 'Carolina Albuquerque Montenegro', first: 'Carolina', photo: '', ini: 'CM', role: 'Treinadora de CrossFit e Funcional', city: 'Londrina, PR', formats: 'Presencial e online', lang: 'Atende em português', avail: 'desconhecida', own: '05/10/2026', ownNext: '10/2027', cref: 'inf', crefNum: '054321-G/PR', avg: '', n: 0,
        pitch: 'Aulas de CrossFit em grupo pequeno na Zona Sul de Londrina e planilha mensal com ajustes para quem treina sozinho.', bio: '',
        offers: ['c_aula', 'c_online'], progs: [], creds: [['CREF', '054321-G/PR', 'Informado · ainda não verificado', 0], ['Formação', 'Licenciatura em Educação Física — UEL', 'Declarada pela treinadora', 0]],
        where: [['Presencial', 'Londrina, PR — Zona Sul (região informada)'], ['Online', 'Todo o Brasil'], ['Idioma', 'Português']], map: 'Zona Sul de Londrina', reviews: [] },
      bruna: { id: 'bruna', name: 'Bruna Tavares', first: 'Bruna', photo: '', ini: 'BT', role: 'Treinadora de Funcional', city: 'Londrina, PR', formats: 'Presencial e online', lang: 'Atende em português', avail: 'aceita', availDate: '22/10', own: '22/10/2026', ownNext: '10/2027', cref: 'nao', avg: '', n: 0,
        pitch: 'Treino funcional para iniciantes, individual ou em grupo pequeno. Perfil criado em 22/10/2026; serviços em preparação.', bio: '',
        offers: [], progs: [], creds: [], where: [['Presencial', 'Londrina, PR (região ainda não informada)'], ['Online', 'Informa que atende online'], ['Idioma', 'Português']], map: '', reviews: [] },
      studio: { id: 'studio', name: 'Studio Norte Treinamento', first: 'Studio Norte', photo: '', ini: 'SN', role: 'Estúdio de treinamento funcional · dados públicos importados', city: 'Londrina, PR', formats: 'Presencial (informação pública)', lang: 'Idioma não informado', avail: 'importado', imported: true, cref: 'na', avg: '', n: 0, ext: '@studionorte.treino',
        pitch: 'Informações públicas importadas sobre um estúdio de treinamento funcional em Londrina. O conteúdo não foi revisado pelo estúdio.', bio: '',
        offers: [], progs: [], creds: [], where: [['Endereço', 'Não exibido em perfis importados'], ['Contato público', 'Instagram @studionorte.treino (abre fora da 99Coach)']], map: '', reviews: [] }
    };
    const __dd = window.NAV && window.NAV.draft ? window.NAV.draft() : null; if (__dd) { TR.thiago = __dd.tr; Object.assign(OF, __dd.of); }
    const WHO = { novo: 'thiago', comparando: 'rafael', oferta: 'rafael', aceite: 'rafael', pedido: 'rafael', vinculo: 'rafael', horarios: 'rafael', proprio: 'rafael', retirado: 'rafael', importado: 'studio', semvaga: 'gabriel', desconhecida: 'carolina', semoferta: 'bruna' };
    const SCN_OF = { rafael: 'comparando', gabriel: 'semvaga', carolina: 'desconhecida', bruna: 'semoferta', studio: 'importado' };
    const USERS = { ana: { name: 'Ana Ribeiro', dest: 'Meu acompanhamento', photo: '', ini: 'AR' }, rafael: { name: 'Rafael Lima', dest: 'Meu painel', photo: B('bdc7ef1c8dbf05558c3bf8d575fc3a04'), ini: '' }, voce: { name: 'Sua conta', dest: 'Sua conta', photo: '', ini: 'VC' } };

    // perfil real ainda carregando: mostra só o nome que o servidor entregou, nunca um perfil de exemplo
    const waitName = () => { try { const h = document.querySelector('#ssr h1'); return h ? h.textContent.trim() : ''; } catch (_) { return ''; } };
    const pend = st.rid && !(window.REAL && window.REAL.perfil(st.rid)) ? (() => { const nm = waitName() || 'Carregando…'; return { id: st.rid, name: nm, first: nm.split(' ')[0], photo: '', ini: nm.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase(), role: '', city: '', formats: '', lang: '', avail: 'importado', imported: false, pending: true, crumb: { sport: '', slug: '', city: '' }, cref: 'na', avg: '', n: 0, ext: '', pitch: '', bio: '', offers: [], progs: [], creds: [], where: [], map: '', reviews: [] }; })() : null;
    const x = pend || (st.rid && window.REAL && window.REAL.perfil(st.rid)) || TR[WHO[st.scn]];
    const removed = st.scn === 'retirado';
    const own = st.user === 'rafael';
    const preview = own && st.preview;
    const U = st.user ? USERS[st.user] : null;
    const all = x.offers.concat(x.progs);
    const o = st.offer && all.indexOf(st.offer) >= 0 ? OF[st.offer] : null;
    // perfil real: a trilha e a busca do topo falam do esporte e da cidade DESTE profissional, não de uma busca padrão
    const cr = x.crumb || null;
    const sl = (v) => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const crGo = (withCity) => () => { if (!cr || !cr.slug) return window.NAV.toSearch(this); location.assign('/treinadores/' + cr.slug + (withCity && cr.city ? '/' + sl(cr.city) : '')); };
    const ctxLabel = x.pending ? '' : cr && cr.sport ? cr.sport + (cr.city ? ' · ' + cr.city.split(',')[0] : (x.formats === 'Online' ? ' · online' : '')) : window.NAV.ctxLabel() + (st.vaga ? ' · Aceita novos alunos' : '');
    const AV = (y) => y.avail === 'aceita' ? ['badge badge--ok', 'ic ic--xs i-check', 'Aceita novos alunos · informado em ' + y.availDate] : y.avail === 'nao' ? ['badge badge--warn', 'ic ic--xs i-pause', 'Não aceita novos alunos · informado em ' + y.availDate] : y.avail === 'importado' ? ['trust trust--decl', 'ic ic--xs i-link', 'Perfil importado · não reivindicado'] : ['badge badge--plain', 'ic ic--xs i-info', 'Disponibilidade não informada'];
    const toggleFav = (e) => set({ fav: !st.fav, favNote: !st.fav, ty: yOf(e) + 52 });

    // ---------- confiança ----------
    const trust = [];
    if (x.imported) trust.push({ ic: 'ic ic--sm i-link', icCls: 'lrow__ic', title: 'Perfil importado, não reivindicado', text: 'Criado em 02/10/2026 a partir de dados públicos. Ninguém confirmou a titularidade; não há contratação, mensagens nem agenda pela 99Coach.' });
    else trust.push({ ic: 'ic ic--sm i-user', icCls: 'lrow__ic', title: 'Titularidade confirmada', text: 'Conta administrada por ' + x.name + ', confirmada em ' + x.own + ' pelo método oficial de verificação do perfil. Nova confirmação em ' + x.ownNext + '.' });
    if (x.cref === 'ver') trust.push({ ic: 'ic ic--sm i-shield', icCls: 'lrow__ic', title: 'CREF verificado', text: x.crefNum + ', conferido na fonte oficial em ' + x.crefDate + '. Válido até ' + x.crefUntil + '.' });
    else if (x.cref === 'inf') trust.push({ ic: 'ic ic--sm i-file', icCls: 'lrow__ic', title: 'CREF informado, ainda não verificado', text: x.crefNum + ' foi digitado pela treinadora. A 99Coach ainda não conferiu na fonte oficial.' });
    else if (x.cref === 'nao') trust.push({ ic: 'ic ic--sm i-info', icCls: 'lrow__ic', title: 'Sem credencial informada', text: 'A treinadora ainda não informou CREF ou formação. Pergunte antes de contratar.' });
    else trust.push({ ic: 'ic ic--sm i-info', icCls: 'lrow__ic', title: 'Credencial não informada', text: 'Perfis importados não mostram credenciais até a reivindicação.' });
    const av = AV(x);
    const chips = [];
    if (x.pending) { /* carregando: nenhuma afirmação */ }
    else if (x.imported) chips.push({ cls: 'trust trust--decl', ic: 'ic ic--xs i-link', t: 'Perfil importado', seal: false, noSeal: true });
    else chips.push({ cls: 'trust trust--owner', ic: 'ic ic--xs i-user', t: 'Titularidade confirmada', seal: false, noSeal: true });
    if (x.cref === 'ver') chips.push({ cls: 'trust trust--ver', ic: '', t: 'CREF verificado', seal: true, noSeal: false });
    else if (x.cref === 'inf') chips.push({ cls: 'trust trust--decl', ic: 'ic ic--xs i-file', t: 'CREF informado', seal: false, noSeal: true });
    const t = Object.assign({}, x, {
      hasPhoto: !!x.photo, noPhoto: !x.photo, avCls: av[0], avIc: av[1], avText: av[2], hasRating: !!x.avg, noRating: !x.avg, nLabel: x.n === 1 ? '1 avaliação' : x.n + ' avaliações',
      noRatingText: x.imported ? 'Perfis importados não recebem avaliações.' : (x.realLive ? 'Ainda sem avaliações. Só quem teve acompanhamento com ' + x.first + ' pela 99Coach pode avaliar; nenhuma nota aparece até lá.' : 'Só alunos com contratação concluída pela 99Coach podem avaliar. Nenhuma nota aparece até lá.'),
      trust: trust, chips: chips, verified: x.cref === 'ver', showAv: x.avail !== 'importado', hasBio: !!x.bio, hasExt: !!x.ext, hasMap: !!x.map,
      hasCreds: x.creds.length > 0, noCreds: x.creds.length === 0, noCredsTitle: x.imported ? 'Credenciais não exibidas' : 'Sem credencial informada', noCredsText: x.imported ? 'Perfis importados não mostram formação nem registro profissional até a reivindicação.' : x.first + ' ainda não informou CREF ou formação. Pergunte antes de contratar.',
      creds: x.creds.map((c) => ({ k: c[0], v: c[1], st: c[2], cls: 'badge ' + (c[3] ? 'badge--ok' : 'badge--plain'), ic: 'ic ic--sm ' + (c[3] ? 'i-shield' : 'i-file') })),
      where: x.where.map((w) => ({ k: w[0], v: w[1] })),
      avStyle: x.photo ? 'background-image: url(' + x.photo + ')' : '', avIni: x.photo ? '' : x.ini
    });


    // ---------- VFINAL: dados da composição da referência ----------
    const LINE = { rafael: 'CrossFit e Musculação · Centro e Zona Sul · Londrina · presencial e online · português', gabriel: 'CrossFit e LPO · Gleba Palhano · Londrina · presencial · português', carolina: 'CrossFit e Funcional · Zona Sul · Londrina · presencial e online · português', bruna: 'Funcional · Londrina · presencial e online · português', studio: 'Treinamento funcional · Londrina · dados públicos importados' };
    if (__dd) LINE.thiago = __dd.line;
    const DIST = { rafael: [21, 2, 0, 0, 0], gabriel: [24, 4, 1, 0, 0] };
    const HOW = { rafael: [['Semana 1', 'Avaliação de movimento e da sua rotina'], ['Toda semana', 'Treino novo no app'], ['A cada 15 dias', 'Ajuste com base no que você registrou']], gabriel: [['Cada sessão', '60 minutos, com carga registrada no app'], ['Técnica', 'LPO com progressão de carga'], ['Local', 'Box na Gleba Palhano']] };
    // perfil real: a distribuição vem das próprias avaliações (mesmo conjunto da média)
    const realDist = x.realLive ? (x.revDist || [0, 0, 0, 0, 0]) : null;
    const dist = (realDist || DIST[x.id] || []).map((c, i) => ({ k: String(5 - i), c: String(c), w: 'width: ' + (x.n ? Math.round(100 * c / x.n) : 0) + '%' }));
    const how = (HOW[x.id] || []).map((h) => ({ k: h[0], v: h[1] }));
    const FAQ_R = [
      ['Preciso ter experiência com CrossFit?', 'Não. Começo pela técnica dos movimentos básicos e ajusto volume e carga à sua rotina. Se você tem lesão ou dor, peço liberação de um profissional de saúde antes de começar.', 'Resposta do Rafael'],
      ['Funciona se eu treinar em academia comum?', 'Sim, no acompanhamento online. Monto o treino com os equipamentos que você tem; no app você informa o que está disponível.', 'Resposta do Rafael'],
      ['Como é feito o pagamento e o cancelamento?', 'Pela 99Coach, com Pix ou cartão. O acompanhamento é mensal e cancela quando quiser; a sessão avulsa não renova; o programa é pagamento único, com 12 meses de acesso. Reembolsos seguem a política da 99Coach.', 'Regra da 99Coach'],
      ['Posso trocar de oferta depois?', 'Pode. Me mande uma mensagem: a mudança vale a partir do próximo ciclo e você confirma o novo valor antes de pagar.', 'Resposta do Rafael']
    ];
    const FAQ_G = [
      ['Mensagem é contratação?', 'Não. Mensagem serve para tirar dúvidas. A contratação só acontece quando você revisa o resumo e paga, ou quando o treinador aceita o seu pedido.', 'Regra da 99Coach'],
      ['Como funcionam pagamento e reembolso?', 'Pagamentos são feitos pela 99Coach, com Pix ou cartão, e seguem a política de Pagamentos e reembolsos.', 'Regra da 99Coach'],
      ['Como corrigir ou denunciar um perfil?', 'Use “Corrigir ou retirar dados públicos” ou “Denunciar perfil”, na seção Avaliações. Para pedir correção não precisa de cadastro.', 'Regra da 99Coach']
    ];
    const faqs = (x.id === 'rafael' ? FAQ_R : FAQ_G).map((f, i) => ({ q: f[0], a: f[1], who: f[2], open: st.faq === i, exp: String(st.faq === i), rot: st.faq === i ? 'transform: rotate(180deg)' : '', pick: () => set({ faq: st.faq === i ? -1 : i }) }));
    const ownLine = x.imported ? 'Perfil importado de dados públicos · ninguém confirmou a titularidade' : 'Titularidade confirmada em ' + x.own + ' pelo método oficial de verificação';
    const msgTopic = x.id === 'rafael' ? 'servico' : x.avail === 'desconhecida' ? 'disp' : x.avail === 'nao' ? 'vaga' : 'geral';
    // produto: o dono do perfil não vê "Pedir acompanhamento" para si mesmo
    const ownReal = !!x.realLive && !document.documentElement.classList.contains('demo') && !!window.CONTA && !!window.CONTA.session() && window.CONTA.mySlug() === x.id;
    const igGo = () => { try { window.open('https://www.instagram.com/' + encodeURIComponent(String(x.ext || '').replace(/^@/, '')) + '/', '_blank', 'noopener,noreferrer'); } catch (_) {} };
    // ---------- ação principal por situação ----------
    let A = null;
    if (removed || x.pending) A = null;
    else if (ownReal) A = { title: 'Seu perfil público', line: 'É assim que visitantes veem', sub: 'Para mudar algo, edite o cadastro: o que você salvar aparece aqui.', label: 'Editar perfil', go: () => window.NAV.go('onboarding', { flow: 'treinador' }, this), label2: 'Abrir meu painel', go2: () => window.NAV.go('treinador', {}, this) };
    else if (x.realLive && window.ACCT && window.ACCT.myTrainer && window.ACCT.myTrainer() && window.ACCT.myTrainer().trainerSlug === x.id) A = { title: 'Seu acompanhamento', line: 'Você e ' + x.first + ' estão conectados', sub: 'Treino, registro e conversa ficam na sua área.', label: 'Abrir acompanhamento', go: () => window.NAV.go('aluno', {}, this), label2: 'Voltar para a busca', go2: () => window.NAV.toSearch(this), noBar: true, fine: '' };
    else if (x.realLive && (window.__myRequests || []).some((r) => r.mine === 'aluno' && r.status === 'pendente' && r.trainerSlug === x.id)) A = { title: 'Pedido enviado', line: 'Aguardando a resposta de ' + x.first, sub: 'Pedido não é vínculo: nada começa nem é cobrado até ' + x.first + ' aceitar.', label: 'Acompanhar pedido', go: () => window.NAV.go('aluno', {}, this), label2: 'Voltar para a busca', go2: () => window.NAV.toSearch(this), noBar: true, fine: 'Um pedido por vez para o mesmo treinador.' };
    else if (x.realLive) A = { title: 'Acompanhamento', line: x.offerTxt, sub: 'Pedido não é vínculo: ' + x.first + ' responde e, se aceitar, o acompanhamento começa. Nada é cobrado no pedido.', label: x.receives === false ? 'Voltar para a busca' : 'Pedir acompanhamento', go: x.receives === false ? () => window.NAV.toSearch(this) : () => GO('@publico', { s: 'pedir', id: x.id }), label2: 'Voltar para a busca', go2: () => window.NAV.toSearch(this), noBar: true, fine: x.receives === false ? x.first + ' não está recebendo pedidos agora.' : 'Você acompanha a resposta em Minha área.' };
    else if (x.imported && x.ext) A = { title: 'Fale com ' + x.first, line: x.ext, sub: 'O contato é pelo Instagram de ' + x.first + '.', label: 'Abrir Instagram', short: 'Instagram', go: igGo, label2: 'É meu perfil', go2: (window.REAL && window.REAL.has(x.id) && !document.documentElement.classList.contains('demo')) ? () => GO('@publico', { s: 'perfilpedido', id: x.id }) : open('claim', { claim: 'inicio' }), fine: '' };
    else if (x.imported) A = { title: x.first, line: 'Sem contato público', sub: '', label: 'Voltar para a busca', go: () => window.NAV.toSearch(this), label2: 'É meu perfil', go2: (window.REAL && window.REAL.has(x.id) && !document.documentElement.classList.contains('demo')) ? () => GO('@publico', { s: 'perfilpedido', id: x.id }) : open('claim', { claim: 'inicio' }), noBar: true, fine: x.ext ? 'Contato público informado: Instagram ' + x.ext + ', uma saída externa.' : 'Sem contato público informado.' };
    else if (own && !preview) A = { title: 'Seu perfil público', line: 'É assim que visitantes veem', sub: 'Alterações ficam em rascunho até você publicar.', label: 'Editar perfil', go: open('editar'), label2: 'Ver como visitante', go2: () => set({ preview: true }) };
    else if (st.user === 'ana' && (!o || o.id === 'online')) A = { title: 'Acompanhamento online', line: 'Ativo desde 02/09/2026', sub: 'Próxima cobrança em 02/11/2026 · R$ 200,00. Outras compras ficam separadas do acompanhamento.', label: 'Abrir acompanhamento', go: open('vinc') };
    else if (x.avail === 'nao') A = { title: 'Não aceita novos alunos', line: 'Informado em ' + x.availDate, sub: 'O Gabriel não está recebendo pedidos agora. Os serviços aparecem só como referência.', label: 'Ver treinadores com vaga', short: 'Ver com vaga', go: () => window.NAV.go('esporte', { avail: true }, this, { vaga: true }), label2: st.fav ? 'Salvo' : 'Salvar perfil', go2: toggleFav };
    else if (!all.length) A = { title: 'Ainda sem serviços publicados', line: 'Perfil criado em 22/10', sub: x.first + ' ainda não publicou serviços nem preços. Mensagem não é contratação.', label: 'Enviar mensagem', go: open('msg', { topic: 'geral' }) };
    else if (x.avail === 'desconhecida') A = { title: o ? o.title : 'Disponibilidade não informada', line: o ? o.label : 'Pergunte antes de contratar', sub: 'A Carolina não informou se aceita novos alunos. Pergunte antes de contratar.', label: 'Consultar disponibilidade', short: 'Consultar', go: open('msg', { topic: 'disp' }), fine: 'Mensagem não é contratação.' };
    else if (o && st.bought === o.id) A = { title: o.title, line: 'Pagamento confirmado', sub: 'Estamos preparando seu acesso. O recibo foi enviado por e-mail.', label: 'Ver outros serviços', anchor: true };
    else if (st.req === 'enviado' && (!o || o.id === 'online')) A = { title: 'Pedido enviado', line: 'Aguardando resposta do Rafael até 28/10', sub: 'Acompanhamento online · R$ 200 / mês. Nada foi cobrado; a cobrança só começa depois do aceite.', label: 'Acompanhar pedido', short: 'Acompanhar', go: open('acomp') };
    else if (!o) A = { title: x.offers.length + (x.offers.length === 1 ? ' serviço' : ' serviços') + (x.progs.length ? ' e ' + x.progs.length + (x.progs.length === 1 ? ' programa' : ' programas') : ''), line: 'Presencial e online · escolha para ver o preço', sub: 'Escolha um serviço ou o programa para ver preço, ciclo e condições.', label: 'Ver serviços', anchor: true };
    else {
      A = { title: o.title, price: o.price, unit: o.unit, line: o.label, sub: o.inc, list: o.list, fine: st.user === 'ana' ? 'Compra separada do seu acompanhamento online.' : o.fine, short: o.short };
      if (st.scn === 'horarios' && o.id === 'sessao') { A.label = 'Ver horários'; A.short = 'Ver horários'; A.go = open('slots'); }
      else if (o.flow === 'contratar') { A.label = o.cta; A.go = open('resumo'); }
      else if (o.flow === 'pedido') { A.label = o.cta; A.go = open('pedido'); }
      else { A.label = o.cta; A.go = open('msg', { topic: 'cond' }); }
    }
    if (A) {
      const conv = !!(o && o.flow === 'contratar' && A.label === o.cta);
      A.btnCls = 'btn btn--lg btn--block btn--arrow v4-wrapbtn ' + (conv ? 'btn--brand' : 'btn--primary');
      A.barCls = 'btn btn--arrow v4-wrapbtn ' + (conv ? 'btn--brand' : 'btn--white');
      A.barLine = A.price ? A.price + ' ' + A.unit : A.line;
      if (preview) { A.go = open('previa'); if (A.go2) A.go2 = open('previa'); }
      A.short = A.short || A.label;
      A.isAnchor = !!A.anchor; A.hasAction = !!A.label && !A.anchor;
      A.hasPrice = !!A.price; A.noPrice = !A.price; A.hasSecondary = !!A.label2;
      A.hasList = !!(A.list && A.list.length); A.hasFine = !!A.fine;
    }
    const barOn = !!A && !A.noBar && !st.sheet;

    // ---------- serviços e programas ----------
    const offers = x.offers.concat(x.progs).map((id) => {
      const y = OF[id]; const on = st.offer === id;
      const r = { hasDetail: x.id === 'rafael' && !st.preview, detail: () => window.NAV.go('servico', { offer: id }, this), flowT: y.prog ? 'Compra única' : y.flow === 'pedido' ? 'Sujeito a aceite' : 'Contratação direta', flowCls: 'badge ' + (y.flow === 'pedido' ? 'badge--info badge--plain' : 'badge--ok badge--plain'), hasFlow: !!y.flow && y.flow !== 'consulta', title: y.title, kind: y.kind, inc: y.inc, meta: y.meta, hasPrice: !!y.price, price: y.price, unit: y.unit, noPrice: !y.price && !!y.unitNone, priceNone: y.unitNone || '', list: y.list || [], hasList: on && !!(y.list && y.list.length), btn: '', btnCls: '', pick: () => {}, othIc: 'ic i-' + (y.prog ? 'book' : y.flow === 'pedido' ? 'calendar' : y.unitNone ? 'clipboard' : 'dumbbell'), hasNote: !!y.note, note: y.note || '', cls: 'plan' + (on ? ' plan--pop' : ''), on: String(on), isOn: on, canPick: true, blocked: false, blockedText: '', blockedIc: 'ic ic--xs i-info', blockedCls: 'badge badge--plain' };
      if (x.avail === 'nao') { r.canPick = false; r.blocked = true; r.blockedText = 'Sem vagas no momento'; r.blockedIc = 'ic ic--xs i-pause'; r.blockedCls = 'badge badge--warn v4-bw'; }
      else if (st.user === 'ana' && id === 'online') { r.canPick = false; r.blocked = true; r.blockedText = 'Seu acompanhamento · ativo'; r.blockedIc = 'ic ic--xs i-check'; r.blockedCls = 'badge badge--ok v4-bw'; }
      else if (st.bought === id) { r.canPick = false; r.blocked = true; r.blockedText = 'Comprado · acesso em preparação'; r.blockedIc = 'ic ic--xs i-check'; r.blockedCls = 'badge badge--ok v4-bw'; }
      else { r.btn = on ? 'Escolhido' : 'Escolher'; r.btnCls = 'btn btn--sm ' + (on ? 'btn--primary' : 'btn--outline'); r.pick = () => set({ offer: on ? null : id }); }
      return r;
    });
    const progs = x.progs.map((id) => { const y = OF[id]; const on = st.offer === id; return { title: y.title, inc: y.inc, facts: y.facts, tags: [x.role.replace(/^Treinadora? de /, '').split(' e ')[0], y.inc.split(' de ')[0]], coach: x.name, coachPhoto: x.photo, hasCoachPhoto: !!x.photo, line2: '12 meses de acesso · sem acompanhamento individual', img: B(y.img), price: y.price, unit: y.unit, cls: 'pc v4-pc' + (on ? ' v4-pc--on' : ''), on: String(on), isOn: on, canPick: st.bought !== id, bought: st.bought === id, btn: on ? 'Escolhido' : 'Escolher programa', btnCls: 'btn btn--sm ' + (on ? 'btn--brand' : 'btn--white'), pick: () => set({ offer: on ? null : id }) }; });
    const showPicker = x.id === 'rafael' && (!own || preview);
    const picker = all.map((id) => { const y = OF[id]; const on = st.offer === id; const mine = st.user === 'ana' && id === 'online'; const got = st.bought === id; return { title: y.title, label: y.label, sub: mine ? 'Seu acompanhamento · ativo' : got ? 'Comprado · acesso em preparação' : (y.pk || ''), on: String(on), cls: 'radio' + (on ? ' is-on' : ''), rowCls: 'vf-pick' + (on ? ' is-on' : ''), pick: () => set({ offer: id }) }; });
    const svcSub = x.id === 'rafael' ? 'Escolha uma oferta para ver preço, ciclo e condições. Recorrente, avulsa, compra única e sob consulta aparecem identificadas.' : x.avail === 'nao' ? 'Só referência: o Gabriel não aceita novos alunos no momento.' : x.avail === 'desconhecida' ? 'Disponibilidade não informada: pergunte antes de contratar.' : '';
    const noOffersTitle = x.imported ? 'Sem contratação pela 99Coach' : 'Ainda sem serviços publicados';
    const noOffersText = x.imported ? 'Perfis importados não mostram serviços nem preços até o estúdio reivindicar o perfil e publicar ofertas.' : x.first + ' criou o perfil em 22/10/2026 e ainda não publicou serviços. Você pode salvar o perfil ou enviar uma mensagem.';

    // ---------- horários (agenda habilitada) ----------
    const SL = [['seg 26/10', []], ['ter 27/10', []], ['qua 28/10', ['07:00', '18:00']], ['qui 29/10', ['06:30']], ['sex 30/10', ['07:00', '19:00']]];
    const slotDays = SL.filter((s) => s[1].length).map(([d, its]) => ({ day: d, items: its.map((h) => { const v = d + ' · ' + h; const on = st.slot === v; return { t: h, on: String(on), cls: 'opt' + (on ? ' is-on' : ''), pick: (e) => set({ slot: v, offer: 'sessao', sheet: 'slots', y: yOf(e) }) }; }) }));
    const dayTabs = SL.map(([d, its]) => { const on = st.slotDay === d; const p = d.split(' '); return { wd: p[0], dt: p[1].split('/')[0], on: String(on), cls: 'vf-day' + (on ? ' is-on' : '') + (its.length ? '' : ' is-off'), pick: () => set({ slotDay: d }) }; });
    const dayCur = SL.find((s) => s[0] === st.slotDay) || SL[2];
    const dayTimes = dayCur[1].map((h) => { const v = dayCur[0] + ' · ' + h; const on = st.slot === v; return { t: h, on: String(on), cls: 'opt' + (on ? ' is-on' : ''), pick: (e) => set({ slot: v, offer: 'sessao', sheet: 'slots', y: yOf(e) }) }; });

    // ---------- avaliações ----------
    const reviews = x.reviews.slice(0, st.revMore ? 5 : 3).map((r) => ({ who: r[0], what: r[1], n: r[2], text: r[3], reply: r[4] || '', hasReply: !!r[4], hasText: !!r[3], stars: [1, 2, 3, 4, 5].map((k) => k <= r[2] ? '' : 'color: var(--concrete-2)'), ini: r[0].charAt(0) }));

    // ---------- outros profissionais ----------
    const others = ['rafael', 'gabriel', 'carolina', 'bruna'].filter((k) => k !== x.id).slice(0, 3).map((k) => {
      const y = TR[k]; const a = AV(y); const pr = y.offers.map((id) => OF[id]).filter((z) => z.price).sort((p, q) => parseInt(p.price.replace(/\D/g, ''), 10) - parseInt(q.price.replace(/\D/g, ''), 10)); const low = pr[0];
      return { href: '/treinador/' + encodeURIComponent(y.id || ''), name: y.name, role: y.role, hasPhoto: !!y.photo, noPhoto: !y.photo, photo: y.photo, ini: y.ini, avCls: y.avail === 'nao' ? 'vfp-avno' : 'vfp-avnone', avIc: '', avText: y.avail === 'nao' ? 'Sem vagas no momento · informado em ' + y.availDate : '', sport: y.role.indexOf('CrossFit') >= 0 ? 'CrossFit' : y.role.indexOf('Musculação') >= 0 ? 'Musculação' : 'Funcional', verified: y.cref === 'ver', hasRating: !!y.avg, noRating: !y.avg, avg: y.avg, n: y.n, hasPrice: !!low, pre: low && pr.length > 1 ? 'a partir de ' : '', price: low ? low.price : '', unit: low ? low.unit : '', offName: low ? low.title : '', open: () => window.NAV.go('perfil', { id: k }, this) };
    });


    others.forEach((r) => { r.noPrice = !r.hasPrice; });
    if (others.length < 4) others.push({ href: '#', name: 'Diego Moraes', role: 'Treinador de CrossFit e Lutas', hasPhoto: true, noPhoto: false, photo: B('348bafe032c42fc5274e3de9d8004df2'), ini: 'DM', avCls: 'vfp-avnone', avIc: '', avText: '', sport: 'CrossFit', verified: true, hasRating: true, noRating: false, avg: '4,8', n: 56, hasPrice: true, noPrice: false, pre: '', price: 'R$ 90', unit: '/ sessão', offName: 'Sessão presencial', open: open('outro') });
    // perfil real: só profissionais reais do catálogo, cada um abre o próprio perfil
    if (window.REAL && window.REAL.has(x.id)) {
      others.length = 0;
      window.REAL.similar(x.id, 4).forEach((t) => others.push({ href: '/treinador/' + encodeURIComponent(t.id), name: t.name, role: t.spec + (t.city ? ' · ' + t.city : ''), hasPhoto: !!t.photo, noPhoto: !t.photo, photo: t.photo, ini: t.ini, avCls: 'vfp-avnone', avIc: '', avText: '', sport: t.sport, verified: false, hasRating: false, noRating: true, avg: '', n: 0, hasPrice: false, noPrice: true, pre: '', price: '', unit: '', offName: '', open: () => window.NAV.go('perfil', { id: t.id }, this) }));
    }
    // ---------- folhas ----------
    const btn = (label, go, k) => ({ label: label, go: go, cls: 'btn btn--block btn--lg v4-wrapbtn ' + (k === 2 ? 'btn--outline' : k === 3 ? 'btn--ghost' : k === 4 ? 'btn--brand' : 'btn--primary') });
    const logged = !!st.user;
    const login = (after) => () => set({ sheet: 'entrar', after: after });
    const so = o && o.flow === 'contratar' ? o : OF.sessao;   // pagamento: oferta apta (sessão ou programa)
    const sp = o && o.flow === 'pedido' ? o : OF.online;     // pedido sujeito a aceite
    const choice = st.after === 'pedido' ? sp.title + ' · ' + sp.label : st.after === 'resumo' ? so.title + ' · ' + so.label : (o ? o.title + ' · ' + o.label : '');
    const SH = {};
    SH.resumo = () => {
      const rows = [['Serviço', so.title + ' · ' + x.name], ['Entrega', so.inc], ['Preço', so.label], ['Ciclo', so.cycle], ['Acesso', so.access]];
      if (st.slot) rows.push(['Horário', st.slot + ' · reservado só depois do pagamento']);
      rows.push(['Total hoje', so.total], ['Próxima cobrança', so.next]);
      const r = { title: 'Confira antes de pagar', rows: rows, fine: so.prog ? 'Demonstração: nenhuma cobrança real. Compra de conteúdo, sem acompanhamento individual.' : 'Demonstração: nenhuma cobrança real. Reembolso conforme Pagamentos e reembolsos.' };
      if (!logged) { r.tone = ['info', 'i-lock', 'Sua escolha fica salva', 'Entre ou crie uma conta mínima para pagar. Você volta para este resumo.']; r.btns = [btn('Entrar para continuar', login('resumo')), btn('Voltar', close, 3)]; }
      else { r.pay = true; r.btns = [btn('Pagar ' + so.total + (st.pay === 'Pix' ? ' com Pix' : ' com cartão'), () => set({ sheet: st.pay === 'Pix' ? 'pix' : 'pago' }), 4), btn('Voltar', close, 3)]; }
      return r;
    };
    SH.entrar = () => ({ title: 'Entre para continuar', tone: st.after ? ['info', 'i-check', 'Sua escolha está salva', choice] : null, field: ['Seu e-mail', 'email', 'voce@email.com', 'email'], btns: [btn('Continuar com e-mail', () => set({ user: 'voce', sheet: st.after || null, after: null })), btn('Criar conta mínima', () => set({ user: 'voce', sheet: st.after || null, after: null }), 2)], fine: 'Conta mínima: nome e e-mail. Não precisa instalar o app. Demonstração: nenhum login real.' });
    SH.pix = () => ({ title: 'Pagamento com Pix', tone: ['wait', 'i-clock', 'Pix gerado · aguardando pagamento', 'Válido por 30 minutos (até 15:32). O acesso começa quando o pagamento for confirmado.'], rows: [['Valor', so.total], ['Serviço', so.title]], code: '00020126580014BR.GOV.BCB.PIX0136 99COACH-DEMO-7F3A 5204000053039865406' + so.total.replace('R$ ', '').replace(',', '.'), btns: [btn(st.copied ? 'Código copiado' : 'Copiar código Pix', () => set({ copied: true }), 2), btn('Já paguei', open('incerto'))], fine: 'Demonstração: nenhum Pix real é gerado.' });
    SH.incerto = () => ({ title: 'Pagamento com Pix', tone: ['warn', 'i-alert', 'Ainda não recebemos a confirmação', 'Não pague de novo. Pix pode levar alguns minutos para chegar; avisamos por e-mail quando o banco confirmar.'], rows: [['Valor', so.total], ['Situação', 'Em verificação']], btns: [btn('Verificar agora', open('pago')), btn('Acompanhar depois', close, 3)] });
    SH.pago = () => ({ title: so.prog ? 'Programa comprado' : 'Contratação concluída', tone: ['ok', 'i-check', 'Pagamento confirmado. Estamos preparando seu acesso.', so.prog ? 'O CrossFit Base aparece em Meus programas em alguns minutos. Acesso até 26/10/2027.' : (st.slot ? st.slot + ' confirmado com o Rafael.' : 'Combine o horário com o Rafael em Mensagens.')], rows: [['Pago', so.total], ['Forma', st.pay === 'Pix' ? 'Pix' : 'Cartão'], ['Recibo', 'Enviado por e-mail']], btns: [btn('Fechar', () => set({ sheet: null, bought: so.id }))] });
    SH.pedido = () => {
      const r = { title: sp.id === 'dois' ? 'Solicitar treino 2x por semana' : 'Solicitar acompanhamento', rows: [['Serviço', sp.title + ' · ' + x.name], ['Inclui', sp.inc], ['Preço', sp.label], ['Hoje', 'Nada é cobrado'], ['Depois do aceite', 'Você revisa o resumo e paga a primeira mensalidade'], ['Resposta até', '28/10/2026']], text: ['Mensagem para o Rafael (opcional)', 'Oi, Rafael! Quero começar no CrossFit. Treino três vezes por semana, à noite.'], fine: 'Pedido não é vínculo: o acompanhamento só começa se o Rafael aceitar.' };
      r.btns = logged ? [btn('Enviar pedido', () => set({ sheet: 'pedidoOk', req: 'enviado' })), btn('Voltar', close, 3)] : [btn('Entrar para enviar o pedido', login('pedido')), btn('Voltar', close, 3)];
      if (!logged) r.tone = ['info', 'i-lock', 'Sua escolha fica salva', 'Para enviar o pedido, entre ou crie uma conta mínima. Você volta para cá.'];
      return r;
    };
    SH.pedidoOk = () => ({ title: 'Pedido enviado', tone: ['wait', 'i-clock', 'Pedido enviado · aguardando resposta do Rafael até 28/10', 'Nada foi cobrado. Você recebe um aviso quando ele responder.'], rows: [['Serviço', sp.title + ' · ' + sp.label], ['Enviado', '26/10/2026 às 14:02']], lines: ['Se o Rafael aceitar, você revisa o resumo e paga a primeira mensalidade. Se ele não responder até 28/10, o pedido expira sem cobrança.'], btns: [btn('Fechar', close), btn('Cancelar pedido', open('cancelado', { req: null }), 3)] });
    SH.acomp = () => ({ title: 'Seu pedido', tone: ['wait', 'i-clock', 'Aguardando resposta do Rafael até 28/10', 'Enviado em 26/10/2026 às 14:02.'], rows: [['Serviço', 'Acompanhamento online · R$ 200 / mês'], ['Cobrança', 'Só depois do aceite'], ['Se não houver resposta', 'O pedido expira em 28/10, sem cobrança']], btns: [btn('Enviar mensagem ao Rafael', open('msg', { topic: 'pedido' }), 2), btn('Cancelar pedido', open('cancelado', { req: null }), 3)] });
    SH.cancelado = () => ({ title: 'Pedido cancelado', tone: ['info', 'i-check', 'Pedido cancelado', 'Nada foi cobrado.'], btns: [btn('Desfazer', () => set({ req: 'enviado', sheet: 'acomp' }), 2), btn('Fechar', close)] });
    SH.vinc = () => ({ title: 'Meu acompanhamento', tone: ['ok', 'i-check', 'Acompanhamento online com Rafael Lima · ativo', 'Desde 02/09/2026 · semana 8.'], rows: [['Próximo treino', 'ter 28/10 · Treino A, força'], ['Mensagens', '1 nova do Rafael'], ['Próxima cobrança', '02/11/2026 · R$ 200,00']], lines: ['Você registra os treinos no app ou em Meu acompanhamento.'], btns: [btn('Fechar', close)] });
    SH.slots = () => ({ title: 'Horários do Rafael', lines: ['Sessão presencial · R$ 80 / sessão · 60 min. Horário de Brasília (UTC−3). O horário só fica reservado depois do pagamento.'], slots: true, btns: st.slot ? [btn('Continuar com ' + st.slot, open('resumo')), btn('Voltar', close, 3)] : [btn('Voltar', close, 3)], fine: st.slot ? '' : 'Escolha um horário para continuar.' });
    SH.msg = () => {
      const V = { disp: ['Mensagem para Carolina', 'Oi, Carolina! Você está aceitando novos alunos para as aulas em grupo?'], cond: ['Mensagem para Rafael', 'Oi, Rafael! Quais são as condições e o valor da avaliação física?'], pedido: ['Mensagem para Rafael', 'Oi, Rafael! Enviei o pedido de acompanhamento online. Fico no aguardo.'], servico: ['Mensagem para Rafael', 'Oi, Rafael! Tenho dúvidas sobre as opções antes de contratar.'], geral: ['Mensagem para ' + x.first, 'Oi, ' + x.first + '! Quando você vai publicar os serviços?'], vaga: ['Mensagem para ' + x.first, 'Oi, ' + x.first + '! Quando você volta a aceitar novos alunos?'] }[st.topic] || ['Mensagem', ''];
      return { title: V[0], lines: ['Mensagem não é contratação. A resposta chega em Mensagens.'], text: ['Sua mensagem', V[1]], btns: logged ? [btn('Enviar mensagem', open('msgOk')), btn('Voltar', close, 3)] : [btn('Entrar para enviar', login('msg')), btn('Voltar', close, 3)], tone: logged ? null : ['info', 'i-lock', 'Sua mensagem fica salva', 'Para enviar, entre ou crie uma conta mínima.'] };
    };
    SH.msgOk = () => ({ title: 'Mensagem enviada', tone: ['ok', 'i-check', 'Mensagem enviada', 'Você recebe um aviso quando ' + x.first + ' responder. Nada foi contratado.'], btns: [btn('Fechar', close)] });
    SH.claim = () => {
      const target = x.name;
      if (st.claim === 'conflito' || (st.claim === 'inicio' && !x.imported)) return { title: 'É meu perfil · ' + target, tone: ['warn', 'i-alert', 'Este perfil já tem titular confirmado', 'Titularidade confirmada em ' + x.own + '.'], lines: ['Se você é ' + x.first + ' e perdeu o acesso, recupere a conta pelo e-mail cadastrado.', 'Se o perfil usa seus dados ou suas fotos sem autorização, abra uma revisão. Nada muda no perfil até a análise.'], btns: [btn('Recuperar acesso', open('recuperar'), 2), btn('Abrir revisão', () => set({ claim: 'revisao' }), 2)] };
      if (st.claim === 'codigo') return { title: 'Reivindicar ' + target, tone: ['wait', 'i-clock', 'Código enviado para co•••••@studionorte.com.br', 'Expira em 15 minutos (até 15:17). Depois disso, peça outro.'], field: ['Código de 6 dígitos', 'text', '482913', 'one-time-code'], btns: [btn('Confirmar código', () => set({ claim: 'revisao' })), btn('Simular código expirado', () => set({ claim: 'expirado' }), 3)] };
      if (st.claim === 'expirado') return { title: 'Reivindicar ' + target, tone: ['warn', 'i-alert', 'O código expirou', 'Peça um novo código; o anterior não vale mais.'], btns: [btn('Enviar novo código', () => set({ claim: 'codigo' }))] };
      if (st.claim === 'indisp') return { title: 'Reivindicar ' + target, tone: ['warn', 'i-alert', 'Verificação por código indisponível agora', 'Tente de novo em alguns minutos ou peça revisão com documentos.'], btns: [btn('Tentar de novo', () => set({ claim: 'codigo' }), 2), btn('Pedir revisão com documentos', () => set({ claim: 'docs' }), 2)] };
      if (st.claim === 'docs') return { title: 'Reivindicar ' + target, lines: ['Envie um documento do estúdio (CNPJ ou contrato social) e um documento pessoal. A equipe revisa em até 3 dias úteis.'], btns: [btn('Enviar documentos para revisão', () => set({ claim: 'revisao' }))], fine: 'Demonstração: nenhum arquivo é enviado.' };
      if (st.claim === 'revisao') return { title: 'Reivindicação de ' + target, tone: ['wait', 'i-clock', 'Pedido em revisão', 'Resposta em até 3 dias úteis, por e-mail. Até lá o perfil continua como está.'], rows: [['Perfil', target], ['Protocolo', 'R-1093']], btns: [btn('Voltar ao perfil', close)] };
      return { title: 'Reivindicar ' + target, lines: ['Para editar e vender pela 99Coach, confirme que o perfil é seu:'], rows: [['1. Conta mínima', 'Nome e e-mail'], ['2. Verificação oficial', 'Código enviado ao e-mail público do perfil'], ['3. Revisão', 'A equipe confere antes de liberar a edição']], field: ['Seu e-mail', 'email', 'voce@email.com', 'email'], btns: [btn('Enviar código para co•••••@studionorte.com.br', () => set({ claim: 'codigo' })), btn('Não tenho acesso a esse e-mail', () => set({ claim: 'docs' }), 3)], fine: 'Nunca pedimos senha nem código do Instagram. Instagram vinculado não prova titularidade nem licença das fotos.' };
    };
    SH.recuperar = () => ({ title: 'Recuperar acesso', tone: ['wait', 'i-clock', 'Link enviado para ra•••@gmail.com', 'O link expira em 30 minutos.'], btns: [btn('Fechar', close)] });
    const FIX = ['Um dado está errado', 'Minha foto ou meus dados usados sem autorização', 'Pedir a retirada do perfil público'];
    SH.fix = () => ({ title: 'Corrigir ou retirar dados', lines: ['Não precisa de cadastro. Informe o perfil e o que precisa mudar.'], opts: FIX.map((l, k) => ({ label: l, on: String(st.fixOpt === k), cls: 'ocard v4-ocard' + (st.fixOpt === k ? ' is-on' : ''), pick: () => set({ fixOpt: k }) })), optsLabel: 'Tipo de pedido', text: ['O que precisa mudar? (opcional)', ''], field: ['E-mail para retorno (opcional)', 'email', '', 'email'], btns: [btn('Enviar pedido', open('fixOk'))] });
    SH.fixOk = () => ({ title: 'Pedido recebido', tone: ['ok', 'i-check', 'Pedido recebido · protocolo C-2611', 'Resposta em até 5 dias úteis. O perfil segue visível durante a análise, salvo risco grave.'], btns: [btn('Fechar', close)] });
    const REP = ['Informação falsa ou enganosa', 'Conduta inadequada', 'Cobrança por fora da 99Coach', 'Outro motivo'];
    SH.report = () => ({ title: 'Denunciar perfil', opts: REP.map((l, k) => ({ label: l, on: String(st.repOpt === k), cls: 'ocard v4-ocard' + (st.repOpt === k ? ' is-on' : ''), pick: () => set({ repOpt: k }) })), optsLabel: 'Motivo', text: ['Conte o que aconteceu (opcional)', ''], btns: [btn('Enviar denúncia', open('reportOk'))], fine: 'Denúncia é diferente de “não tenho interesse”.' });
    SH.reportOk = () => ({ title: 'Denúncia recebida', tone: ['ok', 'i-check', 'Denúncia recebida · protocolo D-0482', 'A equipe analisa em até 2 dias úteis. O perfil segue visível durante a análise.'], btns: [btn('Fechar', close)] });
    SH.busca = () => {
      const pool = ['rafael', 'gabriel', 'carolina', 'bruna'].filter((k) => !st.vaga || TR[k].avail === 'aceita');
      return { title: 'Resultados da busca', chips: ['CrossFit', 'Londrina', 'Presencial'].concat(st.vaga ? ['Aceita novos alunos'] : []), lines: ['Filtros preservados. Ordenação: relevância (padrão), sem mudança escondida.'], results: pool.map((k) => ({ name: TR[k].name, line: TR[k].role + ' · ' + AV(TR[k])[2], btn: k === x.id ? 'Voltar ao perfil' : 'Ver perfil', open: () => set(Object.assign(this.base(SCN_OF[k]), { vaga: st.vaga })) })), btns: [btn(st.vaga ? 'Remover filtro de vaga' : 'Fechar', st.vaga ? () => set({ vaga: false }) : close, 2)], fine: 'Demonstração: a busca completa fica na página Esporte; aqui aparece o contexto preservado.' };
    };
    SH.menu = () => ({ title: 'Menu', btns: [btn('Treinadores', open('busca'), 2), btn('Esportes', open('busca'), 2), btn('Programas', open('busca'), 2), btn('Salvos', open('saved'), 2), btn('Sou treinador', open('pro'), 3)], fine: 'Português (Brasil) · R$' });
    SH.saved = () => st.fav ? ({ title: 'Salvos', results: [{ name: x.name, line: x.role, btn: 'Remover', open: () => set({ fav: false, favNote: false }) }], btns: [btn('Fechar', close)] }) : ({ title: 'Salvos', lines: ['Nenhum perfil salvo ainda. Use “Salvar” no perfil para guardar aqui.'], btns: [btn('Fechar', close)] });
    SH.share = () => ({ title: 'Compartilhar perfil', code: '99coach.com.br/treinador/' + x.id, btns: [btn(st.copied ? 'Link copiado' : 'Copiar link', () => set({ copied: true }))] });
    SH.pro = () => ({ title: 'Sou treinador', rows: [['Essencial', 'Grátis · até 3 alunos ativos'], ['Pro', 'R$ 99/mês ou R$ 990/ano · até 50 alunos · 6.000 créditos/mês'], ['Teste', '7 dias e 750 créditos, só se você ativar'], ['Comissão', '5% por venda']], lines: ['O Pro não compra posição, selo nem garantia de clientes.'], btns: [btn('Criar meu perfil', () => window.NAV.go('onboarding', { flow: 'treinador' }, this))] });
    SH.proOk = () => ({ title: 'Criar meu perfil', tone: ['info', 'i-info', 'Este percurso fica no cadastro profissional', 'O cadastro profissional e o painel ficam fora desta versão do protótipo. Nada foi criado.'], btns: [btn('Fechar', close)] });
    SH.ext = () => ({ title: 'Abrir Instagram', lines: ['Você vai sair da 99Coach para ver ' + x.ext + ' no Instagram. ' + (x.imported ? 'Esse contato foi informado publicamente e não é um canal da 99Coach.' : 'O endereço foi informado por ' + x.first + '. Conversas e contratações feitas lá não ficam registradas na 99Coach.')], btns: (window.REAL && window.REAL.has(x.id) ? [btn('Abrir Instagram', () => { try { window.open('https://instagram.com/' + String(x.ext).replace(/^@/, ''), '_blank', 'noopener'); } catch (_) {} close(); })] : []).concat([btn('Fechar', close, 2)]), fine: window.REAL && window.REAL.has(x.id) ? '' : 'Demonstração: nada é aberto e nenhuma mensagem é enviada.' });
    SH.editar = () => ({ title: 'Editar perfil', rows: [['Foto', 'Publicada'], ['Serviços', '4 publicados'], ['Programas', '1 publicado'], ['Disponibilidade', 'Aceita novos alunos · 20/10'], ['Horários livres', 'Não exibidos']], lines: ['Alterações ficam em rascunho até você publicar.'], btns: [btn('Abrir editor no Meu painel', open('editorOk'))] });
    SH.editorOk = () => ({ title: 'Editar perfil', tone: ['info', 'i-info', 'O editor fica no Meu painel', 'O painel do treinador fica fora desta versão do protótipo. Nada foi alterado.'], btns: [btn('Fechar', close)] });
    SH.previa = () => ({ title: 'Prévia como visitante', tone: ['info', 'i-eye', 'Na prévia as ações não são executadas', 'Nada foi alterado ou publicado.'], btns: [btn('Sair da prévia', () => set({ preview: false, sheet: null }), 2), btn('Continuar na prévia', close)] });
    SH.acct = () => ({ title: U ? U.name : 'Conta', rows: [['Destino', U ? U.dest : '']], btns: [btn('Sair da conta', () => set({ user: null, sheet: null, preview: false }), 2)] });
    SH.ajuda = () => ({ title: 'Ajuda', lines: ['Um perfil fica indisponível quando o profissional o retira ou quando é removido por descumprir as regras. O conteúdo anterior não fica acessível.', 'Dúvidas sobre pagamentos, reembolsos e privacidade ficam na Central de ajuda.'], btns: [btn('Fechar', close)], btns2: null, fine: '' });
    SH.menu = () => ({ title: 'Menu', menu: [['Treinadores', 'users', () => window.NAV.toSearch(this)], ['Esportes', 'activity', () => window.NAV.toSearch(this)], ['Programas', 'book', () => window.NAV.toSearch(this)], ['Salvos', 'heart', open('saved')], ['Mensagens', 'message', open('inbox')], ['Sou treinador', 'user', open('pro')]].map(([l, i, g]) => ({ label: l, ic: 'ic ic--sm i-' + i, go: g })), fine: 'Português (Brasil) · R$' });
    SH.inbox = () => st.user ? ({ title: 'Mensagens', lines: [st.user === 'ana' ? 'Rafael Lima · ontem: “Treino A ajustado para terça. Qualquer dor, me avise.”' : 'Nenhuma conversa ainda. As conversas com treinadores aparecem aqui.'], btns: [btn('Fechar', close)] }) : ({ title: 'Mensagens', tone: ['info', 'i-lock', 'Entre para ver suas mensagens', 'As conversas com treinadores ficam na sua conta.'], btns: [btn('Entrar', () => set({ sheet: 'entrar', after: null }))] });
    SH.home = () => ({ title: 'Página inicial', lines: ['Abriria a Home canônica. A busca CrossFit · Londrina · presencial vai junto.'], btns: [btn('Fechar', close)], fine: 'Passagem anotada: o canvas não navega entre pranchas.' });
    SH.outro = () => ({ title: 'Perfil de Diego Moraes', lines: ['Abriria o perfil completo do Diego, no mesmo modelo desta página: ofertas, programas, avaliações e atendimento.', 'Voltar traz você para este perfil, com a sua escolha salva.'], btns: [btn('Fechar', close)], fine: 'Fora desta versão do protótipo: o perfil completo do Diego não foi montado.' });
    SH.lang = () => ({ title: 'Idioma e região', rows: [['Idioma', 'Português (Brasil)'], ['Moeda', 'Real (R$)']], lines: ['Por enquanto a 99Coach está disponível só em português.'], btns: [btn('Fechar', close)] });
    const raw = st.sheet && SH[st.sheet] ? SH[st.sheet]() : null;
    const TONES = { ok: 'alert alert--ok', wait: 'alert alert--info', warn: 'alert alert--warn', info: 'alert' };
    const sh = raw ? {
      title: raw.title, hasTone: !!raw.tone, toneCls: raw.tone ? TONES[raw.tone[0]] : '', toneIc: raw.tone ? 'ic ic--sm ' + raw.tone[1] : '', toneTitle: raw.tone ? raw.tone[2] : '', toneSub: raw.tone ? raw.tone[3] : '',
      hasChips: !!raw.chips, chips: raw.chips || [], lines: raw.lines || [], hasRows: !!raw.rows, rows: (raw.rows || []).map((r) => ({ k: r[0], v: r[1] })),
      hasSlots: !!raw.slots, hasResults: !!raw.results, results: raw.results || [], hasOpts: !!raw.opts, opts: raw.opts || [], optsLabel: raw.optsLabel || '',
      hasField: !!raw.field, fieldLabel: raw.field ? raw.field[0] : '', fieldType: raw.field ? raw.field[1] : 'text', fieldValue: raw.field ? raw.field[2] : '', fieldAuto: raw.field ? raw.field[3] : 'off',
      hasText: !!raw.text, textLabel: raw.text ? raw.text[0] : '', textValue: raw.text ? raw.text[1] : '', hasPay: !!raw.pay, hasCode: !!raw.code, code: raw.code || '',
      btns: raw.btns || [], hasMenu: !!raw.menu, menu: raw.menu || [], hasFine: !!raw.fine, fine: raw.fine || ''
    } : { btns: [], lines: [], rows: [], chips: [], results: [], opts: [], menu: [] };
    const payOpts = ['Pix', 'Cartão'].map((l) => ({ label: l, on: String(st.pay === l), cls: 'seg__it v4-segbtn' + (st.pay === l ? ' is-on' : ''), pick: () => set({ pay: l }) }));

    // ---------- avisos de contexto ----------
    let note = { on: false };
    if (ownReal) note = { on: true, cls: 'alert alert--info', ic: 'ic ic--sm i-user', title: 'Este é o seu perfil público', sub: 'Abaixo, o que visitantes veem. Pedidos de acompanhamento chegam no seu painel.', hasBtn: true, btn: 'Editar perfil', go: () => window.NAV.go('onboarding', { flow: 'treinador' }, this) };
    else if (own && !preview) note = { on: true, cls: 'alert alert--info', ic: 'ic ic--sm i-user', title: 'Este é o seu perfil público', sub: 'Você está conectado como Rafael Lima. Abaixo, o que visitantes veem.', hasBtn: true, btn: 'Ver como visitante', go: () => set({ preview: true }) };
    else if (preview) note = { on: true, cls: 'alert alert--info', ic: 'ic ic--sm i-eye', title: 'Prévia como visitante', sub: 'Nada foi alterado ou publicado. As ações ficam desativadas na prévia.', hasBtn: true, btn: 'Sair da prévia', go: () => set({ preview: false }) };
    else if (st.user === 'ana') note = { on: true, cls: 'alert alert--ok', ic: 'ic ic--sm i-check', title: 'Você acompanha com o Rafael desde 02/09/2026', sub: 'Acompanhamento online · próxima cobrança em 02/11/2026.', hasBtn: false };

    // ---------- índice de cenários ----------
    const SCN = [['novo', 'Recém-cadastrado (Thiago)'], ['comparando', 'Visitante · padrão'], ['oferta', 'Oferta apta'], ['aceite', 'Sujeito a aceite'], ['pedido', 'Pedido já enviado'], ['vinculo', 'Acompanhamento ativo'], ['horarios', 'Horários habilitados'], ['importado', 'Importado'], ['semvaga', 'Não aceita alunos'], ['desconhecida', 'Disponibilidade desconhecida · sem foto · nome longo · sem avaliação'], ['semoferta', 'Sem oferta · sem credencial'], ['proprio', 'Próprio perfil'], ['retirado', 'Retirado']];
    const scnChips = SCN.map(([id, l]) => ({ label: l, on: String(st.scn === id), cls: 'chip' + (st.scn === id ? ' is-on' : ''), pick: () => set(this.base(id)) }));
    const go = (scn, extra) => (e) => set(Object.assign(this.base(scn), extra, { y: yOf(e) }));
    const FLOW = [['Resumo da sessão', go('oferta', { sheet: 'resumo' })], ['Entrar preservando a escolha', go('oferta', { sheet: 'entrar', after: 'resumo' })], ['Pix pendente', go('oferta', { user: 'voce', sheet: 'pix' })], ['Resultado desconhecido', go('oferta', { user: 'voce', sheet: 'incerto' })], ['Pagamento confirmado', go('oferta', { user: 'voce', sheet: 'pago' })], ['Comprar programa', go('comparando', { offer: 'base', sheet: 'resumo' })], ['Solicitar acompanhamento', go('aceite', { sheet: 'pedido' })], ['Pedido enviado', go('aceite', { user: 'voce', req: 'enviado', sheet: 'pedidoOk' })], ['Escolher horário', go('horarios', { sheet: 'slots' })], ['É meu perfil · importado', go('importado', { sheet: 'claim', claim: 'inicio' })], ['Código e expiração', go('importado', { sheet: 'claim', claim: 'codigo' })], ['Verificação indisponível', go('importado', { sheet: 'claim', claim: 'indisp' })], ['Conflito de titularidade', go('comparando', { sheet: 'claim', claim: 'conflito' })], ['Corrigir dados', go('comparando', { sheet: 'fix' })], ['Denunciar', go('comparando', { sheet: 'report' })], ['Voltar para a busca', go('comparando', { sheet: 'busca' })], ['Menu do celular', go('comparando', { sheet: 'menu' })]];
    const flowChips = FLOW.map(([l, f]) => ({ label: l, pick: f }));

    // seção vazia não aparece para visitante: só o dono vê o que falta preencher
    const mine = own || ownReal;
    const anchors = [['Sobre', 'visao'], ['Serviços', 'ofertas'], ['Programas', 'programas'], ['Avaliações', 'avaliacoes'], ['Atendimento', 'atendimento'], ['Perguntas', 'perguntas']].filter(([l]) => mine || !((l === 'Sobre' && !(x.pitch || x.bio || x.creds.length || x.avg)) || (l === 'Serviços' && !offers.length) || (l === 'Programas' && !progs.length) || (l === 'Avaliações' && !x.avg) || (l === 'Perguntas' && x.id !== 'rafael'))).map(([l, h]) => ({ label: l, cls: 'seg__it' + (st.sec === l ? ' is-on' : ''), cur: st.sec === l ? 'true' : 'false', pick: () => { set({ sec: l }); goSec(h); } }));

    return {
      rootCls: 'w v4 vfp' + (barOn ? ' v4-has-bar' : '') + (raw ? ' has-sheet' : ''), scnChips, flowChips, reset: () => set(this.base(st.scn)),
      ctxLabel, crumbSport: cr ? cr.sport : 'CrossFit', crumbCity: cr ? cr.city : 'Londrina, PR', crumbSportHref: cr && cr.slug ? '/treinadores/' + cr.slug : '/', crumbCityHref: cr && cr.slug && cr.city ? '/treinadores/' + cr.slug + '/' + sl(cr.city) : '/', hasCrumbSport: !cr || !!cr.sport, hasCrumbCity: !cr || !!cr.city, goCrumbSport: cr ? crGo(false) : () => window.NAV.toSearch(this), goCrumbCity: cr ? crGo(true) : () => window.NAV.toSearch(this), hasPitch: !!(x.pitch || x.bio), fmtIc: 'ic ic--sm ' + (/Presencial/.test(x.formats || '') ? 'i-pin' : 'i-monitor'), anon: !st.user, signed: !!st.user, userName: U ? U.name : '', userDest: U ? U.dest : '', userIni: U ? U.ini : '', userAv: '', userPhoto: U && U.photo ? U.photo : '', userHasPhoto: !!(U && U.photo), userNoPhoto: !!U && !U.photo, openInbox: open('inbox'), openConta: U ? open('acct') : () => set({ sheet: 'entrar', after: null }), tabOn: !st.sheet,
      menuOpen: String(st.sheet === 'menu'), openSearch: () => window.NAV.toSearch(this), openSaved: open('saved'), openLogin: () => window.NAV.go('onboarding', { flow: 'entrar' }, this), openPro: open('pro'), openAcct: open('acct'), openMenu: open('menu'), openHelp: open('ajuda'),
      removed, showProfile: !removed, note, t, showSocial: !own || preview,
      favOn: String(!!st.fav), favIc: st.fav ? 'color: var(--brand)' : '', favLabel: st.fav ? 'Salvo' : 'Salvar', toggleFav, favNote: !!st.favNote, undoFav: () => set({ fav: false, favNote: false }), openShare: open('share', { copied: false }),
      claimable: !own, openClaim: (window.REAL && window.REAL.has(x.id) && !document.documentElement.classList.contains('demo')) ? () => GO('@publico', { s: 'perfilpedido', id: x.id }) : open('claim', { claim: x.imported ? 'inicio' : 'conflito' }), openExt: x.imported ? igGo : open('ext'),
      anchors, bioOpen: !!st.bio, bioExp: String(!!st.bio), bioLabel: st.bio ? 'Ler menos' : 'Ler mais', toggleBio: () => set({ bio: !st.bio }),
      sSlots: mine || x.id === 'rafael', sFaq: x.id === 'rafael', sMsgNo: false,
      sCred: mine || x.creds.length > 0, sAvr: mine || !!x.avg, sOf: mine || offers.length > 0, sPg: mine || progs.length > 0, sAvHead: mine || !!x.avg, sTwo: mine || x.creds.length > 0 || !!x.avg,
      svcSub, hasOffers: offers.length > 0, noOffers: offers.length === 0, offers, noOffersTitle, noOffersText,
      hasProgs: progs.length > 0, noProgs: progs.length === 0, progs, noProgsText: x.imported ? 'Perfis importados não mostram programas.' : 'Quando houver, programas de compra única aparecem aqui com duração, preço e prazo de acesso.',
      showSlots: x.id === 'rafael', noSlots: x.id !== 'rafael', noSlotsText: x.avail === 'nao' ? 'O Gabriel não está recebendo novos alunos; a agenda não é exibida.' : x.imported ? 'Perfis importados não mostram agenda.' : x.first + ' não publicou agenda. Os horários são combinados depois da contratação ou do aceite.', slotDays, mapOff: !st.map, mapOn: !!st.map, loadMap: () => set({ map: true }),
      reviews, revBtn: x.reviews.length > 3, revBtnLabel: st.revMore ? 'Mostrar menos' : 'Mostrar mais avaliações', moreRev: () => set({ revMore: !st.revMore }), goRev: () => { set({ sec: 'Avaliações' }); goSec('avaliacoes'); },
      openFix: (window.REAL && window.REAL.has(x.id) && !document.documentElement.classList.contains('demo')) ? () => GO('@publico', { s: 'perfilpedido', id: x.id }) : open('fix'), openReport: (window.REAL && window.REAL.has(x.id) && !document.documentElement.classList.contains('demo')) ? () => GO('@publico', { s: 'perfilpedido', id: x.id }) : open('report'),
      hasA: !!A, A: A || {}, goSvc: () => { set({ sec: 'Serviços' }); goSec('ofertas'); }, showPicker, picker, barOn, others,
      sheetOn: !!raw, sh, close, payOpts, dlgCls: 'card v4-sheet' + (st.sheet === 'menu' ? ' v4-sheet--menu' : ''), sheetTop: st.y + 'px', toastTop: st.ty + 'px',
      vline: LINE[x.id] || (x.role + ' · ' + x.city), vrole: x.role + ' · ' + x.city + ({ rafael: ' · Centro e Zona Sul', gabriel: ' · Gleba Palhano', carolina: ' · Zona Sul' }[x.id] || ''), dist, how, hasHow: how.length > 0, faqs,
      faqSub: x.id === 'rafael' ? 'Respostas escritas pelo Rafael. Regras de pagamento e reembolso são da 99Coach.' : 'Regras da 99Coach, válidas para qualquer perfil.',
      ownLine, rev1: reviews[0] || { who: '', what: '', text: '' }, rev2: reviews[1] || { who: '', what: '', text: '' }, hasRev2: reviews.length > 1, bioRot: st.bio ? 'transform: rotate(180deg)' : '',
      noPicker: !showPicker, showBox: !showPicker || !o || !(A && A.price), sideLabel: showPicker ? 'Serviços' : 'Próxima etapa',
      showMsg: x.id === 'rafael' && !(own && !preview), canMsg: !x.imported && !(own && !preview), noMsg: !!x.imported, openMsg: preview ? open('previa') : open('msg', { topic: msgTopic }),
      showCmp: x.id === 'rafael', pickBase: () => set({ offer: 'base' }), pickOnline: () => set({ offer: 'online' }),
      cmpProgCls: 'btn btn--sm ' + (st.offer === 'base' ? 'btn--primary' : 'btn--outline'), cmpProgLbl: st.bought === 'base' ? 'Comprado' : st.offer === 'base' ? 'Escolhido' : 'Escolher programa',
      cmpOnCls: 'btn btn--sm ' + (st.offer === 'online' ? 'btn--primary' : 'btn--outline'), cmpOnLbl: st.user === 'ana' ? 'Seu acompanhamento' : st.offer === 'online' ? 'Escolhido' : 'Escolher acompanhamento',
      dayTabs, dayTimes, dayHas: dayTimes.length > 0, dayNone: dayTimes.length === 0, dayName: dayCur[0],
      mrole: x.role, mcity: x.city + ({ rafael: ' · Centro e Zona Sul', gabriel: ' · Gleba Palhano', carolina: ' · Zona Sul' }[x.id] || ''),
      mcref: { on: x.cref === 'ver' || x.cref === 'inf', ver: x.cref === 'ver', inf: x.cref === 'inf', t: x.cref === 'ver' ? 'CREF ' + x.crefNum : 'CREF informado · não verificado' },
      mchips: x.role.replace(/^Treinadora? de /, '').split(/ e |, /).filter(Boolean).concat([x.formats.replace(' (informação pública)', '')]),
      showMstats: !!x.avg || x.progs.length > 0,
      mstats: [
        { v: x.avg ? '★ ' + x.avg : 'Sem nota', k: 'nota' },
        { v: x.n ? String(x.n) : 'Nenhuma', k: 'avaliações' },
        { v: x.progs.length ? String(x.progs.length) : 'Nenhum', k: x.progs.length === 1 ? 'programa' : 'programas' }
      ],
      openHome: () => window.NAV.go('home', {}, this), goHelp: () => window.GO('PUB11'), goHelpPay: () => window.GO('PUB11', { art: 'pagamentos' }), goHelpPriv: () => window.GO('PUB11', { art: 'privacidade' }), goHelpTerms: () => window.GO('PUB11', { art: 'termos' }), goHelpCookies: () => window.GO('PUB11', { art: 'cookies' }), openLang: open('lang'), favDot: !!st.fav,
      skip: () => { try { const el = document.getElementById('conteudo'); if (el) { el.setAttribute('tabindex', '-1'); el.focus(); } } catch (_) {} }
    };
  }
}

return Component; })(), frag: document.getElementById('tpl-perfil').content, css: document.getElementById('css-perfil') };
