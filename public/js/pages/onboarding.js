PAGES.onboarding = { Comp: (function () {
class Component extends DCLogic {
  constructor(props) { super(props); const p = props || {}; this.state = (!p.scn && window.STORE && window.STORE.loadOnb(p.flow || 'treinador')) || this.base(p.flow || 'treinador', p.scn || ''); if (!p.scn && !this.state.dadosSaved && !this.state.real && this.state.step !== 'codigo' && window.CONTA) Object.assign(this.state, { name: '', email: '', code: '' }); }


  // Cadastro preenchido de exemplo (cenários “Cadastro preenchido”, “Perfil publicado”)
  static get FULL() {
    return {
      pitch: 'Treino adultos iniciantes em grupos pequenos e online. Começo pela técnica e ajusto o treino a cada 15 dias, com base no que você registra no app.',
      bio: 'Trabalho com CrossFit e treino funcional desde 2018. Não atendo reabilitação: com dor ou lesão, peço liberação de um profissional de saúde antes de começar.', since: '2018',
      regions: { centro: true, zonasul: true }, places: { box: true, parque: true }, onlineScope: 'brasil',
      services: [{ kind: 'recorrente', title: 'Acompanhamento online', inc: 'Treino semanal no app, ajuste a cada 15 dias e mensagens', fmt: 'online', acc: 'aceite', price: '200' }, { kind: 'avulsa', title: 'Sessão presencial', inc: '60 minutos de treino individual em Londrina', fmt: 'presencial', acc: 'direta', price: '80' }],
      programs: [{ title: 'CrossFit do zero', weeks: '8', workouts: '24', price: '97' }],
      avail: 'sim', agenda: true, cref: '017383-G/PR', formacao: 'Bacharel em Educação Física — UEL', certs: ['CrossFit Level 1 (CF-L1)'],
      igStep: 'ok', payout: 'ok', payDoc: '000.000.000-00', payPix: 'thiago@email.com', savedAt: '09:16', version: 4
    };
  }

  // Perfil público montado a partir do cadastro (lido pela página de Perfil)
  static draft(st) {
    const SP = { crossfit: 'CrossFit', funcional: 'Funcional', lpo: 'LPO', corrida: 'Corrida', musculacao: 'Musculação', pilates: 'Pilates', yoga: 'Yoga', lutas: 'Lutas', natacao: 'Natação', ciclismo: 'Ciclismo', mobilidade: 'Mobilidade', calistenia: 'Calistenia', hiit: 'HIIT', danca: 'Dança', tenis: 'Tênis', beach: 'Beach tennis', escalada: 'Escalada', futebol: 'Futebol', volei: 'Vôlei', basquete: 'Basquete' };
    const REG = { centro: 'Centro', zonasul: 'Zona Sul', zonanorte: 'Zona Norte', zonaleste: 'Zona Leste', zonaoeste: 'Zona Oeste', gleba: 'Gleba Palhano' };
    const PLC = { box: 'box ou academia parceira', parque: 'parque ou ao ar livre', domicilio: 'na casa do aluno', estudio: 'estúdio próprio' };
    const on = (o) => Object.keys(o || {}).filter((x) => o[x]);
    const first = (st.name || '').split(' ')[0] || 'Treinador';
    const ini = (st.name || '').split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
    const regions = on(st.regions).map((x) => REG[x]).join(' e ').replace(/ e (?=.* e )/g, ', ');
    const langs = on(st.langs).map((x) => ({ pt: 'português', en: 'inglês', es: 'espanhol' })[x]).join(' e ');
    const of = {}, offers = [], progs = [];
    (st.services || []).forEach((s, i) => {
      const id = 'd' + i, cons = s.kind === 'consulta', unit = s.kind === 'recorrente' ? '/ mês' : (s.kind === 'avulsa' ? '/ sessão' : ''), price = cons ? '' : 'R$ ' + s.price;
      const flow = cons ? 'consulta' : (s.acc === 'aceite' ? 'pedido' : 'contratar');
      const cycle = s.kind === 'recorrente' ? 'Mensal · cancela quando quiser' : (cons ? 'Combinado' : 'Por sessão');
      offers.push(id);
      of[id] = { id: id, pk: s.inc, title: s.title, kind: { recorrente: 'Recorrente mensal', avulsa: 'Sessão avulsa', consulta: 'Sob consulta' }[s.kind], inc: s.inc,
        meta: (s.fmt === 'online' ? 'Online' : 'Presencial') + ' · ' + cycle + (flow === 'pedido' ? ' · sujeito a aceite de ' + first : ''), price: price, unit: cons ? '' : unit, unitNone: cons ? 'Sob consulta' : undefined,
        label: cons ? 'Sob consulta' : price + ' ' + unit, flow: flow,
        cta: flow === 'pedido' ? 'Solicitar ' + s.title.toLowerCase() : (flow === 'contratar' ? 'Contratar ' + s.title.toLowerCase() : 'Consultar condições'), short: flow === 'pedido' ? 'Solicitar' : (flow === 'contratar' ? 'Contratar' : 'Consultar'),
        total: flow === 'pedido' ? 'R$ 0,00 hoje' : (cons ? '' : price + ',00'), next: s.kind === 'recorrente' ? price + ',00 por mês' + (flow === 'pedido' ? ', só depois do aceite' : '') : 'Não renova',
        cycle: cycle, access: s.kind === 'recorrente' ? 'Enquanto a assinatura estiver ativa' : 'Use em até 30 dias',
        list: [s.inc, s.fmt === 'online' ? 'Online, com treino no app' : 'Presencial em ' + (st.city || '').split(',')[0], cycle],
        fine: flow === 'pedido' ? 'Pedido não é vínculo: nada é cobrado até ' + first + ' aceitar.' : (cons ? 'Mensagem não é contratação.' : 'Você revisa o total antes de pagar. Pix ou cartão.') };
    });
    (st.programs || []).forEach((p, i) => {
      const id = 'dp' + i; progs.push(id);
      of[id] = { id: id, prog: true, pk: p.weeks + ' semanas · acesso por 12 meses', meta: 'Pagamento único · 12 meses de acesso · sem acompanhamento individual', title: p.title, kind: 'Programa', inc: p.weeks + ' semanas de programação · ' + p.workouts + ' treinos',
        facts: [p.weeks + ' semanas de programação', p.workouts + ' treinos', '12 meses de acesso', 'Sem acompanhamento individual'], img: '1860c6c9a5b801160bf7b69b6966d525', price: 'R$ ' + p.price, unit: 'pagamento único', label: 'R$ ' + p.price + ' · pagamento único',
        flow: 'contratar', cta: 'Comprar programa', short: 'Comprar', total: 'R$ ' + p.price + ',00', next: 'Não renova', cycle: 'Pagamento único', access: '12 meses de acesso', list: [p.weeks + ' semanas · ' + p.workouts + ' treinos', '12 meses de acesso', 'Sem acompanhamento individual'], fine: 'Compra de conteúdo; não inclui acompanhamento individual.' };
    });
    const creds = [];
    if (st.cref) creds.push(['CREF', st.cref, st.crefDoc ? 'Informado · comprovante em conferência' : 'Informado · ainda não verificado', 0]);
    if (st.formacao) creds.push(['Formação', st.formacao, 'Declarada pelo treinador', 0]);
    (st.certs || []).forEach((c) => creds.push(['Certificação', c, 'Declarada · não conferida', 0]));
    if (st.since) creds.push(['Experiência', 'Treina alunos desde ' + st.since, 'Declarada pelo treinador', 0]);
    const where = [];
    if (st.pres) where.push(['Presencial', (st.city || '') + (regions ? ' — ' + regions + ' (regiões informadas)' : '') + (on(st.places).length ? ' · ' + on(st.places).map((x) => PLC[x]).join(', ') : '')]);
    if (st.onl) where.push(['Online', st.onlineScope === 'estado' ? 'Só no Paraná, com treino no app da 99Coach' : 'Todo o Brasil, com treino no app da 99Coach']);
    where.push(['Idioma', langs ? langs.charAt(0).toUpperCase() + langs.slice(1) : 'Não informado']);
    const tr = { id: 'thiago', name: st.name, first: first, photo: st.photoOk ? st.photoUrl : '', ini: ini, role: st.title || 'Treinador', city: st.city, formats: st.pres && st.onl ? 'Presencial e online' : (st.pres ? 'Presencial' : 'Online'), lang: 'Atende em ' + (langs || 'português'),
      avail: st.avail === 'sim' ? 'aceita' : (st.avail === 'nao' ? 'nao' : 'desconhecida'), availDate: '26/10', own: '26/10/2026', ownNext: '10/2027', cref: st.cref ? 'inf' : 'nao', crefNum: st.cref, avg: '', n: 0,
      pitch: st.pitch || (first + ' ainda não escreveu a apresentação.'), bio: st.bio, offers: offers, progs: progs, ext: st.igStep === 'ok' ? st.ig : '', creds: creds, where: where, map: st.pres && regions ? regions + ' de ' + (st.city || '').split(',')[0] : '', reviews: [] };
    return { tr: tr, of: of, line: on(st.sports).map((x) => SP[x]).join(' e ') + (regions ? ' · ' + regions : '') + ' · ' + (st.city || '').split(',')[0] };
  }

  // flow: treinador · aluno · entrar · convite   |   scn: situação de demonstração dentro do percurso
  base(flow, scn) {
    const s = {
      flow: flow, scn: scn || '', step: 'conta', intent: flow === 'aluno' ? 'aluno' : (flow === 'treinador' ? 'treinador' : ''), intentErr: false,
      name: flow === 'aluno' ? 'Marina Costa' : 'Thiago Pereira', email: flow === 'aluno' ? 'marina@email.com' : (flow === 'convite' ? 'ana@email.com' : 'thiago@email.com'),
      terms: false, termsErr: false, emailExists: false, code: '482913', codeErr: false, codeExp: false, session: false,
      sports: { crossfit: true, funcional: true }, city: 'Londrina, PR', pres: true, onl: true, langs: { pt: true }, dadosSaved: false,
      title: 'Treinador de CrossFit e Funcional', pitch: '', bio: '', since: '', photoUrl: '', photoOk: false, photoErr: false,
      regions: {}, places: {}, onlineScope: 'brasil',
      services: [], svcEdit: null, svcDraft: null, svcErr: false,
      programs: [], pgAdding: false, pgDraft: { title: 'CrossFit do zero', weeks: '8', workouts: '24', price: '97' },
      avail: '', agenda: false, days: { seg: true, qua: true, sex: true }, periods: { manha: true, noite: true },
      cref: '', crefDoc: '', formacao: '', certs: [], certDraft: '',
      ig: '@thiago.treina', igStep: '', igCode: '', igWrong: false, igTried: false,
      payout: '', payType: 'pf', payName: 'Thiago Pereira', payDoc: '', payPix: '', payErr: false,
      pro: '', proCycle: 'mensal', proOk: false, proErr: false, sec: 'basico',
      savedAt: '09:12', version: 1, published: false, pubUnknown: false,
      invName: 'Ana Carvalho', invSvc: 'online', invCreated: false, invShared: '',
      inviter: 'rafael', cvVar: '', prepQ: 0, prepA: {}, prepText: '', prepDone: false,
      q: '', dd: null, act: 0, loc: 'idle', dErr: false, dSheet: null, modQ: '', cvLive: '',
      cta: 'idioma', lang: 'pt', langSaved: 'pt', langFail: false, tz: 'brasilia', unit: 'kg',
      mfa: true, sessEnded: {}, sessConfirm: null, sessCode: '',
      purposes: { acomp: true, sug: true, uso: false }, exportStep: '', pvCode: '', reqExport: false, reqDelete: false, delOpen: false, delOk: false,
      shares: [{ dado: 'Medidas corporais', com: 'Diego Moraes', fim: 'Planejar treino de lutas', ate: '31/12/2026' }, { dado: 'Respostas da anamnese', com: 'Rafael Lima', fim: 'Montar seu treino', ate: 'fim do vínculo', link: true }],
      shareAdding: false, shareDado: 'fotos', sharePrazo: '30d', shareFim: 'Acompanhar a evolução no treino de lutas', shareReceipt: '', shareLast: '',
      notif: flow === 'convite' ? { msg: { p: true, m: true }, treino: { p: true, m: false }, contrat: { p: false, m: true }, novidades: { p: false, m: false } } : { pedidos: { p: true, m: true }, msg: { p: true, m: false }, contrat: { p: true, m: true }, assin: { p: false, m: true }, novidades: { p: false, m: false } }, notifBlocked: false,
      toast: ''
    };
    if (flow === 'treinador') s.step = 'conta';
    if (flow === 'aluno') s.step = 'escolha';
    if (flow === 'entrar') s.step = 'conta';
    if (flow === 'convite') { s.step = 'convite'; s.name = 'Ana Ribeiro'; }
    const S = {
      existe: { emailExists: true },
      expirado: { step: 'codigo', codeExp: true },
      hoje: { step: 'hoje', dadosSaved: true },
      cadastro: { step: 'cad', dadosSaved: true },
      completo: Object.assign({ step: 'cad', dadosSaved: true }, Component.FULL),
      sessao: { step: 'conta', session: true, dadosSaved: true },
      incerto: Object.assign({ step: 'pub', dadosSaved: true, pubUnknown: true }, Component.FULL),
      publicado: Object.assign({ step: 'publicado', dadosSaved: true, published: true }, Component.FULL),
      logado: { cvVar: 'logado' }, cvexp: { cvVar: 'expirado' }, aceito: { cvVar: 'aceito' }, outra: { cvVar: 'outra' },
      prep: { step: 'prep' }, alunohoje: { step: 'alunoHoje' },
      conta: Object.assign({ step: 'acct', dadosSaved: true, published: true }, Component.FULL), seguranca: Object.assign({ step: 'cta', cta: 'seguranca', dadosSaved: true, published: true }, Component.FULL),
      dados: { step: 'dados' }, dadosdig: { step: 'dados', q: 'Lond', dd: 'open' }, dadosesc: { step: 'dados', sports: { crossfit: true, lpo: true }, city: 'Londrina, PR', regions: { centro: true, zonasul: true } },
      dadosonl: { step: 'dados', pres: false, onl: true }, dadoshom: { step: 'dados', q: 'Toledo', dd: 'open' }, dadossem: { step: 'dados', q: 'Tamarna', dd: 'open' }, dadosneg: { step: 'dados', loc: 'denied', dd: 'open' }, dadoserr: { step: 'dados', dErr: true },
      contaaluno: { step: 'acct', prepDone: true }, compart: { step: 'cta', cta: 'compartilhamento', prepDone: true }, avisos: { step: 'cta', cta: 'avisos', prepDone: true }
    };
    // cadastro novo começa como no DS: só CrossFit, presencial e sem cidade
    if (flow === 'treinador' && (!scn || ['existe', 'expirado'].indexOf(scn) >= 0 || scn.indexOf('dados') === 0)) Object.assign(s, { sports: { crossfit: true }, city: '', onl: false });
    return Object.assign(s, S[scn] || {});
  }

  renderVals() {
    const st = this.state;
    const set = (o) => this.setState(o);
    const IMG = window.__IMG || {};
    const toast = (m) => set({ toast: m });
    const top = () => { try { window.scrollTo(0, 0); } catch (_) {} };
    const go = (step, extra) => () => { set(Object.assign({ step: step, toast: '' }, extra || {})); top(); };
    const val = (e) => (e && e.target ? e.target.value : '');
    const NAV = window.NAV;
    const isT = st.flow === 'treinador' || st.intent === 'treinador';

    // ---------- barra de demonstração ----------
    const FL = [['treinador', 'Sou treinador'], ['aluno', 'Quero treinar'], ['entrar', 'Entrar'], ['convite', 'Aluno convidado']];
    const flows = FL.map(([k, l]) => ({ label: l, on: String(st.flow === k), cls: 'chip' + (st.flow === k ? ' is-on' : ''), pick: () => { set(this.base(k, '')); top(); } }));
    const SC = {
      treinador: [['', 'Conta nova'], ['existe', 'E-mail já cadastrado'], ['expirado', 'Código expirado'], ['hoje', 'Hoje · primeiro acesso'], ['cadastro', 'Cadastro por seções'], ['completo', 'Cadastro preenchido'], ['sessao', 'Sessão expirada'], ['dados', 'Primeiros dados'], ['dadosdig', 'Cidade · digitando'], ['dadosesc', 'Cidade escolhida'], ['dadosonl', 'Só online'], ['dadoshom', 'Cidades homônimas'], ['dadossem', 'Cidade sem resultado'], ['dadosneg', 'Localização negada'], ['dadoserr', 'Erro sem cidade'], ['incerto', 'Publicação sem confirmação'], ['publicado', 'Perfil publicado'], ['conta', 'Conta'], ['seguranca', 'Segurança e sessões']],
      aluno: [['', 'Conta nova'], ['existe', 'E-mail já cadastrado'], ['expirado', 'Código expirado']],
      entrar: [['', 'Entrar'], ['expirado', 'Código expirado']],
      convite: [['', 'Sem sessão'], ['logado', 'Já entrou na conta'], ['cvexp', 'Convite expirado'], ['aceito', 'Já aceito'], ['outra', 'Outra conta'], ['prep', 'Preparação'], ['alunohoje', 'Hoje do aluno'], ['contaaluno', 'Conta da aluna'], ['compart', 'Compartilhamentos'], ['avisos', 'Notificações']]
    }[st.flow] || [];
    const scens = SC.map(([k, l]) => ({ label: l, on: String(st.scn === k), cls: 'chip' + (st.scn === k ? ' is-on' : ''), pick: () => { set(this.base(st.flow, k)); top(); } }));

    // ---------- pessoas ----------
    const sportsOn = Object.keys(st.sports).filter((k) => st.sports[k]);
    const SPORT = { crossfit: 'CrossFit', funcional: 'Funcional', lpo: 'LPO', corrida: 'Corrida', musculacao: 'Musculação', pilates: 'Pilates', yoga: 'Yoga', lutas: 'Lutas', natacao: 'Natação', ciclismo: 'Ciclismo', mobilidade: 'Mobilidade', calistenia: 'Calistenia', hiit: 'HIIT', danca: 'Dança', tenis: 'Tênis', beach: 'Beach tennis', escalada: 'Escalada', futebol: 'Futebol', volei: 'Vôlei', basquete: 'Basquete' };
    const sportTxt = sportsOn.map((k) => SPORT[k]).join(' e ').replace(/ e (?=.* e )/g, ', ');
    const fmtTxt = st.pres && st.onl ? 'presencial e online' : (st.pres ? 'presencial' : (st.onl ? 'online' : ''));
    const cityShort = (st.city || '').split(',')[0];
    const first = (st.name || '').split(' ')[0] || 'você';
    const ini = (st.name || '').split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
    // ========== cadastro completo do treinador (ACC05–ACC10 por seções) ==========
    const now = () => { const d = new Date(); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); };
    const sync = (next, pub) => { if (!window.CONTA || !window.CONTA.session() || st.scn) return; window.CONTA.saveTrainer(next).then((r) => (r.ok && pub ? window.CONTA.publish() : r)).then((r) => { if (!r.ok && !r.offline && !r.nosession) set({ toast: 'O servidor não aceitou salvar o perfil: ' + (r.msg || 'erro ' + r.status) + '. Seus dados continuam neste aparelho.' }); else if (r.ok && pub) set({ toast: 'Perfil publicado na 99Coach.' }); }); };
    const saved = (extra, msg) => { const t = now(); sync(Object.assign({}, st, extra || {}), false); set(Object.assign({ savedAt: t, version: st.version + 1, toast: msg || ('Salvo às ' + t + ' · versão ' + (st.version + 1) + (st.published ? '. Publique de novo para atualizar o perfil.' : '. Ainda não publicado.')) }, extra || {})); };
    const KIND = { recorrente: ['Recorrente mensal', 'Acompanhamento com ciclo mensal', '/ mês', 'calendar'], avulsa: ['Sessão avulsa', 'Uma sessão, sem renovação', '/ sessão', 'dumbbell'], consulta: ['Sob consulta', 'Valor combinado antes de marcar', '', 'message'] };
    const svcPrice = (s) => s.kind === 'consulta' ? 'Sob consulta' : 'R$ ' + (s.price || '—') + ' ' + KIND[s.kind][2];
    const REG = [['centro', 'Centro'], ['zonasul', 'Zona Sul'], ['zonanorte', 'Zona Norte'], ['zonaleste', 'Zona Leste'], ['zonaoeste', 'Zona Oeste'], ['gleba', 'Gleba Palhano']];
    const PLC = [['box', 'Box ou academia parceira'], ['parque', 'Parque ou ao ar livre'], ['domicilio', 'Na casa do aluno'], ['estudio', 'Estúdio próprio']];
    const regTxt = REG.filter(([kk]) => st.regions[kk]).map(([, l]) => l).join(', ');
    const minOk = sportsOn.length > 0 && !!(st.city || '').trim() && (st.pres || st.onl);

    const SEC = [
      ['basico', 'Básico', 'Nome, modalidades, local e idioma', 'user'],
      ['foto', 'Foto de perfil', 'Opcional', 'camera'],
      ['apresentacao', 'Apresentação', 'Como você trabalha e sua experiência', 'edit'],
      ['atendimento', 'Onde e como atende', 'Regiões, locais e online', 'pin'],
      ['servicos', 'Serviços e preços', 'O que você vende, sempre com unidade', 'tag'],
      ['programas', 'Programas', 'Opcional · compra única', 'book'],
      ['disponibilidade', 'Vagas e horários', 'Se aceita alunos e quando', 'calendar'],
      ['credenciais', 'Credenciais', 'CREF, formação e certificações', 'shield'],
      ['instagram', 'Instagram', 'Opcional · confirma que o perfil é seu', 'instagram'],
      ['recebimentos', 'Receber pagamentos', 'Necessário para vender pela 99Coach', 'bank'],
      ['plano', 'Assinatura 99Coach', 'Essencial grátis · Pro opcional', 'crown']
    ];
    // estado de cada seção: [rótulo, tom] · tom: ok | todo | opt | wait
    const STAT = {
      basico: minOk ? ['Feito', 'ok'] : ['Obrigatório', 'todo'],
      foto: st.photoUrl ? ['Feito', 'ok'] : ['Opcional', 'opt'],
      apresentacao: (st.pitch || '').trim().length >= 40 ? ['Feito', 'ok'] : ['Opcional', 'todo'],
      atendimento: (!st.pres || regTxt) ? ['Feito', 'ok'] : ['Opcional', 'todo'],
      servicos: st.services.length ? [st.services.length + (st.services.length === 1 ? ' serviço' : ' serviços'), 'ok'] : ['Opcional', 'todo'],
      programas: st.programs.length ? [st.programs.length + (st.programs.length === 1 ? ' programa' : ' programas'), 'ok'] : ['Opcional', 'opt'],
      disponibilidade: st.avail ? ['Feito', 'ok'] : ['Opcional', 'todo'],
      credenciais: st.crefDoc ? ['Em conferência', 'wait'] : (st.cref ? ['CREF informado', 'ok'] : ['Opcional', 'opt']),
      instagram: st.igStep === 'ok' ? ['Confirmado', 'ok'] : (st.igStep === 'review' ? ['Em revisão', 'wait'] : (st.igStep ? ['Em andamento', 'wait'] : ['Opcional', 'opt'])),
      recebimentos: st.payout === 'ok' ? ['Vendas habilitadas', 'ok'] : (st.payout === 'wait' ? ['Em verificação', 'wait'] : ['Para vender', 'todo']),
      plano: st.pro === 'active' ? ['Teste do Pro ativo', 'ok'] : ['Essencial · grátis', 'opt']
    };
    const TONE = { ok: 'onb-st onb-st--ok', todo: 'onb-st onb-st--todo', opt: 'onb-st', wait: 'onb-st onb-st--wait' };
    const done = SEC.filter(([kk]) => STAT[kk][1] === 'ok').length;
    const recDone = ['apresentacao', 'atendimento', 'servicos', 'disponibilidade'].filter((kk) => STAT[kk][1] === 'ok').length;
    const goSec = (kk) => () => { set({ step: 'sec', sec: kk, svcEdit: null, pgAdding: false, toast: '' }); top(); };
    const cad = {
      total: String(SEC.length), done: String(done), barW: 'width: ' + Math.round(100 * done / SEC.length) + '%',
      progress: done + ' de ' + SEC.length + ' seções', published: st.published, version: String(st.version),
      summary: (minOk ? 'Pronto para publicar' : 'Falta o básico para publicar') + ' · recomendadas ' + recDone + ' de 4 · ' + (st.payout === 'ok' ? 'vendas habilitadas' : 'vendas ainda não habilitadas'),
      badge: st.published ? 'Publicado' : 'Rascunho', badgeCls: 'badge ' + (st.published ? 'badge--ok' : 'badge--plain'),
      saved: 'Rascunho salvo às ' + st.savedAt + ' · versão ' + st.version,
      cta: done ? 'Continuar cadastro' : 'Começar cadastro', pubCta: st.published ? 'Publicar alterações' : 'Revisar e publicar',
      secs: SEC.map(([kk, t, s, ic]) => ({ title: t, sub: kk === 'servicos' && st.services.length ? st.services.map(svcPrice).join(' · ') : s, ic: 'ic ic--sm i-' + ic, icCls: 'onb-secs__ic' + (STAT[kk][1] === 'ok' ? ' is-ok' : ''), st: STAT[kk][0], stCls: TONE[STAT[kk][1]], go: goSec(kk) }))
    };
    const si = Math.max(0, SEC.findIndex(([kk]) => kk === st.sec));
    const nx = SEC[si + 1];
    const noSaveSec = ['instagram', 'recebimentos', 'plano'];
    const isSec = {}; SEC.forEach(([kk]) => { isSec[kk] = st.sec === kk; });
    const sx = {
      is: isSec, pos: 'Seção ' + (si + 1) + ' de ' + SEC.length + ' · ' + STAT[SEC[si][0]][0], title: SEC[si][1],
      sub: {
        basico: 'O mínimo para aparecer na busca. Treinador só online não precisa informar endereço.',
        foto: 'Uma foto sua, de rosto, ajuda o aluno a reconhecer você.',
        apresentacao: 'O que o aluno lê antes de escolher. Sem promessas de resultado.',
        atendimento: 'Onde você atende presencialmente e até onde vai o online.',
        servicos: 'Cada serviço diz o que entrega, o formato, o ciclo e o preço com unidade.',
        programas: 'Conteúdo pronto, de compra única, separado dos seus serviços.',
        disponibilidade: 'Diga se aceita novos alunos. Isso aparece com a data em que você informou.',
        credenciais: 'Informar não é verificar: o selo diz exatamente o que foi conferido.',
        instagram: 'Prova por mensagem. Nunca pedimos senha.',
        recebimentos: 'Para receber pelos serviços vendidos na 99Coach.',
        plano: 'O Essencial é grátis e suficiente para publicar, convidar e vender.'
      }[SEC[si][0]],
      hasSave: noSaveSec.indexOf(st.sec) < 0, noSave: noSaveSec.indexOf(st.sec) >= 0 || st.svcEdit !== null,
      saveLabel: 'Salvar', hasNext: !!nx, nextTitle: nx ? nx[1] : '',
      save: () => { if (st.sec === 'foto' && st.photoUrl && !st.photoOk) return set({ photoErr: true }); saved({ dadosSaved: true }); },
      next: () => { if (st.sec === 'foto' && st.photoUrl && !st.photoOk) return set({ photoErr: true }); if (nx) { saved({ sec: nx[0], svcEdit: null, pgAdding: false }); top(); } }
    };
    if (st.svcEdit !== null) { sx.hasSave = false; }

    const b = { title: st.title, setTitle: (ev) => set({ title: val(ev) }) };

    const ph = {
      has: !!st.photoUrl, none: !st.photoUrl, url: st.photoUrl, title: st.photoUrl ? (st.photoOk ? 'Foto enviada por você' : 'Confirme a autorização abaixo') : 'Sem foto por enquanto', cta: st.photoUrl ? 'Trocar foto' : 'Enviar foto',
      pick: (ev) => { const fl = ev && ev.target && ev.target.files && ev.target.files[0]; if (!fl) return; if (!/^image\//.test(fl.type)) return toast('Use uma imagem (JPG, PNG ou WebP).'); if (fl.size > 8e6) return toast('A imagem passa de 8 MB. Escolha uma menor.'); const rd = new FileReader(); rd.onload = () => this.setState({ photoUrl: String(rd.result), photoErr: false, toast: 'Foto carregada só neste navegador. Nada foi enviado.' }); rd.readAsDataURL(fl); },
      remove: () => set({ photoUrl: '', photoOk: false, photoErr: false }),
      okOn: String(!!st.photoOk), okCls: 'check' + (st.photoOk ? ' is-on' : ''), toggleOk: () => set({ photoOk: !st.photoOk, photoErr: false }), err: !!st.photoErr
    };

    const ap = {
      pitch: st.pitch, pitchN: String((st.pitch || '').length), setPitch: (ev) => set({ pitch: val(ev).slice(0, 400) }),
      bio: st.bio, bioN: String((st.bio || '').length), setBio: (ev) => set({ bio: val(ev).slice(0, 800) }),
      since: st.since, setSince: (ev) => set({ since: val(ev).replace(/\D/g, '').slice(0, 4) })
    };

    const at = {
      pres: !!st.pres, onl: !!st.onl, none: !st.pres && !st.onl, city: cityShort || 'sua cidade',
      regions: REG.map(([kk, l]) => ({ label: l, on: String(!!st.regions[kk]), cls: 'opt' + (st.regions[kk] ? ' is-on' : ''), pick: () => set({ regions: Object.assign({}, st.regions, { [kk]: !st.regions[kk] }) }) })),
      places: PLC.map(([kk, l]) => ({ label: l, on: String(!!st.places[kk]), cls: 'opt' + (st.places[kk] ? ' is-on' : ''), pick: () => set({ places: Object.assign({}, st.places, { [kk]: !st.places[kk] }) }) })),
      scopes: [['brasil', 'Todo o Brasil'], ['estado', 'Só no Paraná']].map(([kk, l]) => ({ label: l, on: String(st.onlineScope === kk), cls: 'opt' + (st.onlineScope === kk ? ' is-on' : ''), pick: () => set({ onlineScope: kk }) }))
    };

    // serviços: lista e editor
    const dft = st.svcDraft || {};
    const sv = {
      listing: st.svcEdit === null, editing: st.svcEdit !== null, empty: !st.services.length,
      items: st.services.map((s, i) => ({ title: s.title, ic: 'ic ic--sm i-' + KIND[s.kind][3], meta: KIND[s.kind][0] + ' · ' + (s.fmt === 'online' ? 'Online' : 'Presencial'), price: svcPrice(s), acc: s.kind === 'consulta' ? 'Combinado por mensagem' : (s.acc === 'aceite' ? 'Sujeito ao seu aceite' : 'Contratação direta'), accCls: 'badge badge--plain ' + (s.acc === 'aceite' ? 'badge--info' : ''), edit: () => set({ svcEdit: i, svcDraft: Object.assign({}, s), svcErr: false }), remove: () => set({ services: st.services.filter((_, j) => j !== i), toast: s.title + ' removido. Salve para confirmar.' }) })),
      add: () => set({ svcEdit: 'new', svcErr: false, svcDraft: { kind: 'avulsa', title: 'Sessão presencial', inc: '60 minutos de treino individual em ' + (cityShort || 'sua cidade'), fmt: st.pres ? 'presencial' : 'online', acc: 'direta', price: '80' } }),
      formTitle: st.svcEdit === 'new' ? 'Novo serviço' : 'Editar serviço', d: dft,
      kinds: Object.keys(KIND).map((kk) => ({ title: KIND[kk][0], sub: KIND[kk][1], ic: 'ic ic--sm i-' + KIND[kk][3], on: String(dft.kind === kk), cls: 'ocard onb-choice' + (dft.kind === kk ? ' is-on' : ''), pick: () => set({ svcDraft: Object.assign({}, dft, { kind: kk }) }) })),
      setTitle: (ev) => set({ svcDraft: Object.assign({}, dft, { title: val(ev) }) }), setInc: (ev) => set({ svcDraft: Object.assign({}, dft, { inc: val(ev) }) }),
      setPrice: (ev) => set({ svcDraft: Object.assign({}, dft, { price: val(ev).replace(/[^\d,]/g, '').slice(0, 6) }) }),
      fmts: [['presencial', 'Presencial'], ['online', 'Online']].map(([kk, l]) => ({ label: l, on: String(dft.fmt === kk), cls: 'opt' + (dft.fmt === kk ? ' is-on' : ''), pick: () => set({ svcDraft: Object.assign({}, dft, { fmt: kk }) }) })),
      hasPrice: dft.kind !== 'consulta', unit: dft.kind ? KIND[dft.kind][2] : '',
      accs: [['direta', 'Contratação direta', 'O aluno revisa o resumo e paga', 'card'], ['aceite', 'Sujeito ao seu aceite', 'O aluno pede; a cobrança só começa se você aceitar', 'clock']].map(([kk, t, s2, ic]) => ({ title: t, sub: s2, ic: 'ic ic--sm i-' + ic, on: String(dft.acc === kk), cls: 'ocard onb-choice' + (dft.acc === kk ? ' is-on' : ''), pick: () => set({ svcDraft: Object.assign({}, dft, { acc: kk }) }) })),
      preview: (dft.title || 'Serviço') + ' · ' + (dft.kind ? svcPrice(dft) : ''), previewSub: (dft.kind ? KIND[dft.kind][0] : '') + ' · ' + (dft.fmt === 'online' ? 'Online' : 'Presencial') + (dft.kind === 'consulta' ? ' · sem preço público' : (dft.acc === 'aceite' ? ' · sujeito a aceite' : ' · contratação direta')),
      err: !!st.svcErr,
      save: () => { if (!(dft.title || '').trim() || (dft.kind !== 'consulta' && !(dft.price || '').trim())) return set({ svcErr: true }); const list = st.services.slice(); if (st.svcEdit === 'new') list.push(Object.assign({}, dft)); else list[st.svcEdit] = Object.assign({}, dft); saved({ services: list, svcEdit: null, svcDraft: null, svcErr: false }, 'Serviço salvo às ' + now() + '. Ainda não publicado.'); },
      cancel: () => set({ svcEdit: null, svcDraft: null, svcErr: false })
    };

    const pgd = st.pgDraft;
    const pg = {
      empty: !st.programs.length, adding: !!st.pgAdding, canAdd: !st.pgAdding, d: pgd,
      items: st.programs.map((p2, i) => ({ title: p2.title, meta: p2.weeks + ' semanas · ' + p2.workouts + ' treinos · 12 meses de acesso', price: 'R$ ' + p2.price + ' · pagamento único', remove: () => set({ programs: st.programs.filter((_, j) => j !== i) }) })),
      add: () => set({ pgAdding: true }), cancel: () => set({ pgAdding: false }),
      setTitle: (ev) => set({ pgDraft: Object.assign({}, pgd, { title: val(ev) }) }), setWeeks: (ev) => set({ pgDraft: Object.assign({}, pgd, { weeks: val(ev).replace(/\D/g, '').slice(0, 2) }) }),
      setWorkouts: (ev) => set({ pgDraft: Object.assign({}, pgd, { workouts: val(ev).replace(/\D/g, '').slice(0, 3) }) }), setPrice: (ev) => set({ pgDraft: Object.assign({}, pgd, { price: val(ev).replace(/[^\d,]/g, '').slice(0, 6) }) }),
      save: () => { if (!(pgd.title || '').trim() || !pgd.price) return toast('Informe o nome e o preço do programa.'); saved({ programs: st.programs.concat([Object.assign({}, pgd)]), pgAdding: false }, 'Programa salvo em rascunho às ' + now() + '.'); }
    };

    const DAYS = [['seg', 'Seg'], ['ter', 'Ter'], ['qua', 'Qua'], ['qui', 'Qui'], ['sex', 'Sex'], ['sab', 'Sáb']];
    const PER = [['manha', 'Manhã'], ['tarde', 'Tarde'], ['noite', 'Noite']];
    const av = {
      opts: [['sim', 'Sim, aceito', 'Aparece “Aceita novos alunos”', 'check'], ['nao', 'Não no momento', 'Pedidos ficam pausados', 'pause'], ['nd', 'Prefiro não informar', 'O aluno pergunta antes', 'info']].map(([kk, t, s2, ic]) => ({ title: t, sub: s2, ic: 'ic ic--sm i-' + ic, on: String(st.avail === kk), cls: 'ocard onb-choice' + (st.avail === kk ? ' is-on' : ''), pick: () => set({ avail: kk }) })),
      note: st.avail ? 'Informado em 26/10. Atualize quando mudar: a data aparece junto.' : 'Sem resposta, o perfil mostra “Disponibilidade não informada”.',
      agenda: !!st.agenda, swOn: String(!!st.agenda), swCls: 'switch onb-switch' + (st.agenda ? ' is-on' : ''), toggle: () => set({ agenda: !st.agenda }),
      days: DAYS.map(([kk, l]) => ({ label: l, on: String(!!st.days[kk]), cls: 'opt' + (st.days[kk] ? ' is-on' : ''), pick: () => set({ days: Object.assign({}, st.days, { [kk]: !st.days[kk] }) }) })),
      periods: PER.map(([kk, l]) => ({ label: l, on: String(!!st.periods[kk]), cls: 'opt' + (st.periods[kk] ? ' is-on' : ''), pick: () => set({ periods: Object.assign({}, st.periods, { [kk]: !st.periods[kk] }) }) }))
    };

    const k = {
      cref: st.cref, setCref: (ev) => set({ cref: val(ev) }), formacao: st.formacao, setFormacao: (ev) => set({ formacao: val(ev) }),
      chip: st.cref ? 'CREF informado' : 'Sem credencial informada', chipCls: st.cref ? 'trust trust--decl' : 'badge badge--plain', chipIc: st.cref ? 'ic ic--xs i-file' : 'ic ic--xs i-info',
      how: st.cref ? 'O selo azul “CREF verificado” só aparece depois da conferência na fonte oficial, com data. Formação e certificações aparecem como “declaradas”.' : 'Sem número, o perfil não mostra selo de credencial. Você pode publicar mesmo assim.',
      docTitle: st.crefDoc ? st.crefDoc + ' enviado' : 'Comprovante do CREF (opcional)', docSub: st.crefDoc ? 'Conferimos na fonte oficial. Até lá, o perfil continua com “CREF informado”.' : 'Foto ou PDF da carteira. Conferimos na fonte oficial.',
      canSend: !st.crefDoc, sent: !!st.crefDoc, send: (ev) => { const fl = ev && ev.target && ev.target.files && ev.target.files[0]; set({ crefDoc: fl ? fl.name : 'carteira-cref.pdf', toast: 'Demonstração: o arquivo fica só neste navegador. Nada foi enviado.' }); },
      certs: st.certs.map((c2, i) => ({ label: c2, remove: () => set({ certs: st.certs.filter((_, j) => j !== i) }) })),
      certDraft: st.certDraft, setCert: (ev) => set({ certDraft: val(ev) }), addCert: () => { const v = (st.certDraft || '').trim(); if (!v) return; set({ certs: st.certs.concat([v]), certDraft: '' }); }
    };

    const g = {
      s: { intro: !st.igStep, instr: st.igStep === 'instr', wait: st.igStep === 'wait', code: st.igStep === 'code', ok: st.igStep === 'ok', review: st.igStep === 'review' },
      handle: st.ig, setHandle: (ev) => set({ ig: val(ev) }),
      copyMsg: () => set({ igStep: 'instr', toast: 'Mensagem copiada. (Demonstração: a área de transferência pode estar bloqueada.)' }),
      openIg: () => set({ igStep: 'wait', toast: 'Demonstração: o Instagram não é aberto e nenhuma mensagem é enviada.' }),
      haveCode: () => set({ igStep: 'code', igCode: '481270', igWrong: false }), cancel: () => set({ igStep: '', toast: 'Confirmação cancelada. Nada mudou no perfil.' }),
      code: st.igCode, setCode: (ev) => set({ igCode: val(ev).replace(/\D/g, '').slice(0, 6), igWrong: false }), wrong: !!st.igWrong, codeCls: 'input onb-codebox' + (st.igWrong ? ' is-err' : ''),
      verify: () => { if (!st.igTried) return set({ igWrong: true, igTried: true, igCode: '481207' }); saved({ igStep: 'ok', igWrong: false }, 'Instagram confirmado às ' + now() + '.'); },
      review: () => set({ igStep: 'review' })
    };

    // conta real fora da demonstração: convite, perfil e saída usam as telas e ações de verdade
    const REALP = !!(window.CONTA && window.CONTA.session() && !st.scn && !document.documentElement.classList.contains('demo') && window.GO);
    const goInvite = REALP ? () => window.GO('REL01') : () => { set({ step: 'convidar', toast: '' }); try { window.scrollTo(0, 0); } catch (_) {} };
    // conta confirmada no servidor (e-mail e senha ou Google): grava o papel, retoma o cadastro salvo e segue
    const finishReal = (role, email, login) => {
      window.CONTA.setName(st.name);
      // conta nova: a pessoa declarou 18+ junto com os Termos; grava a declaração na conta
      if (role && !login && st.terms && window.CONTA.confirmAdult) window.CONTA.confirmAdult();
      const p = role ? window.CONTA.addRole(role) : Promise.resolve();
      p.then(() => window.CONTA.syncRoles()).then((roles) => (login && (roles || []).indexOf('treinador') >= 0 ? window.CONTA.loadTrainer() : null)).then((srv) => {
        if (srv && window.STORE) {
          // cadastro de treinador guardado no servidor: retoma aqui, mesmo em outro aparelho
          const base = this.base('treinador', '');
          window.STORE.saveOnb(Object.assign(base, srv, { email: email, conta: true, real: true, step: 'hoje', scn: '' }));
        }
        set({ conta: true, real: true, pw: '', toast: '' });
        let pend = ''; try { pend = localStorage.getItem('c99.conviteCode') || ''; } catch (_) {}
        if (pend && window.NAV) return window.NAV.go('publico', { s: 'convite', id: pend }, this);
        // voltar para onde a pessoa estava quando precisou entrar (ex.: "é meu perfil")
        let back = '', until = 0; try { back = localStorage.getItem('c99.depoisEntrar') || ''; until = +(localStorage.getItem('c99.depoisEntrarAte') || 0); localStorage.removeItem('c99.depoisEntrar'); localStorage.removeItem('c99.depoisEntrarAte'); } catch (_) {}
        if (until && until < Date.now()) back = '';
        const m = /^#publico-(perfilpedido|pedir)-(.+)$/.exec(back);
        if (m && window.NAV) return window.NAV.go('publico', { s: m[1], id: m[2] }, this);
        afterAuth();
      });
    };
    if (!this.__oe) { this.__oe = true; let oe = ''; try { oe = localStorage.getItem('c99.oauthErro') || ''; localStorage.removeItem('c99.oauthErro'); } catch (_) {} if (oe) setTimeout(() => this.setState({ toast: 'O Google não concluiu o login: ' + oe }), 0); }
    if (window.CONTA && window.CONTA.oauthBack && !this.__oa) {
      const ob = window.CONTA.oauthBack();
      if (ob) { this.__oa = true; setTimeout(() => { if (ob.name && !this.state.name) this.setState({ name: ob.name }); finishReal(ob.role, ob.email, !ob.role); }, 0); }
    }
    const pay = {
      s: { intro: !st.payout, wait: st.payout === 'wait', ok: st.payout === 'ok' },
      types: [['pf', 'Pessoa física', 'Recebe no seu CPF', 'user'], ['pj', 'Pessoa jurídica', 'Recebe no CNPJ da empresa', 'bank']].map(([kk, t, s2, ic]) => ({ title: t, sub: s2, ic: 'ic ic--sm i-' + ic, on: String(st.payType === kk), cls: 'ocard onb-choice' + (st.payType === kk ? ' is-on' : ''), pick: () => set({ payType: kk }) })),
      nameLabel: st.payType === 'pj' ? 'Razão social' : 'Nome completo', docLabel: st.payType === 'pj' ? 'CNPJ' : 'CPF', docPh: st.payType === 'pj' ? '00.000.000/0000-00' : '000.000.000-00',
      name: st.payName, setName: (ev) => set({ payName: val(ev) }), doc: st.payDoc, setDoc: (ev) => set({ payDoc: val(ev) }), pix: st.payPix, setPix: (ev) => set({ payPix: val(ev) }),
      err: !!st.payErr,
      submit: () => { if (!(st.payName || '').trim() || !(st.payDoc || '').trim() || !(st.payPix || '').trim()) return set({ payErr: true }); set({ payout: 'wait', payErr: false, toast: 'Enviado para verificação às ' + now() + '. Demonstração: nada saiu deste navegador.' }); },
      approve: () => set({ payout: 'ok', toast: 'Vendas habilitadas.' })
    };

    const cyc = st.proCycle === 'anual';
    const pro = {
      s: { offer: !st.pro || st.pro === 'canceled', review: st.pro === 'review', active: st.pro === 'active' },
      current: st.pro === 'active' ? 'Pro · teste de 7 dias' : 'Essencial', currentSub: st.pro === 'active' ? 'Até 50 alunos ativos · 750 créditos no teste' : 'Grátis · até 3 alunos ativos · perfil, convites, treinos e vendas',
      badge: st.pro === 'active' ? 'Teste ativo' : (st.pro === 'canceled' ? 'Renovação cancelada' : 'Plano atual'), badgeCls: 'badge ' + (st.pro === 'active' ? 'badge--ok' : 'badge--plain'),
      start: () => set({ pro: 'review', proOk: false, proErr: false }), back: () => set({ pro: '' }),
      cycles: [['mensal', 'Mensal · R$ 99'], ['anual', 'Anual · R$ 990']].map(([kk, l]) => ({ label: l, on: String(st.proCycle === kk), cls: 'seg__it' + (st.proCycle === kk ? ' is-on' : ''), pick: () => set({ proCycle: kk }) })),
      rows: [{ k: 'Teste', v: '7 dias · 750 créditos de IA' }, { k: 'Começa', v: '26/10/2026 às 09:20 (Brasília)' }, { k: 'Termina', v: '02/11/2026 às 09:20' }, { k: 'Primeira cobrança', v: cyc ? 'R$ 990,00 em 02/11/2026 · anual' : 'R$ 99,00 em 02/11/2026 · mensal' }, { k: 'Depois', v: cyc ? 'Renova todo ano · 6.000 créditos por mês' : 'Renova todo mês · 6.000 créditos por mês' }, { k: 'Cancelar', v: 'No painel, a qualquer momento; no teste, nada é cobrado' }],
      okOn: String(!!st.proOk), okCls: 'check' + (st.proOk ? ' is-on' : ''), toggleOk: () => set({ proOk: !st.proOk, proErr: false }), err: !!st.proErr,
      consent: 'Entendi que, se eu não cancelar até 02/11/2026, a assinatura ' + (cyc ? 'anual de R$ 990,00' : 'mensal de R$ 99,00') + ' começa e renova automaticamente.',
      activate: () => { if (!st.proOk) return set({ proErr: true }); set({ pro: 'active', toast: 'Teste do Pro ativo até 02/11. Demonstração: nenhuma cobrança.' }); },
      activeRows: [{ k: 'Termina', v: '02/11/2026 às 09:20' }, { k: 'Créditos', v: '750 do teste · 0 usados' }, { k: 'Depois', v: cyc ? 'R$ 990,00 por ano' : 'R$ 99,00 por mês' }, { k: 'Seus alunos', v: 'Nada muda para eles se você cancelar' }],
      cancel: () => set({ pro: 'canceled', toast: 'Renovação cancelada. O teste continua até 02/11 e nada será cobrado.' })
    };

    // ---------- publicação (ACC07) ----------
    const crefState = st.crefDoc ? 'doc' : (st.cref ? 'inf' : 'none');
    const meTrust = [{ cls: 'trust trust--owner', ic: 'ic ic--xs i-user', label: 'Criado pelo próprio profissional' }].concat(crefState !== 'none' ? [{ cls: 'trust trust--decl', ic: 'ic ic--xs i-file', label: 'CREF informado' }] : []);
    const ck = (kk, opt, label, sub) => { const ok = STAT[kk][1] === 'ok'; return { label: label, sub: sub, cls: 'onb-check__i' + (ok ? ' is-ok' : (opt ? ' is-opt' : ' is-todo')), mark: 'check' + (ok ? ' is-on' : ''), hasGo: !ok, go: goSec(kk), goLabel: 'Completar' }; };
    const firstPrice = st.services.length ? svcPrice(st.services[0]) : 'Enviar mensagem';
    const pb = {
      checks: [
        ck('basico', false, 'Modalidades, local e idioma', minOk ? sportTxt + ' · ' + cityShort + ' · ' + fmtTxt : 'Obrigatório para publicar'),
        ck('foto', true, 'Foto de perfil', st.photoUrl ? 'Enviada por você' : 'Opcional · sem foto, aparecem suas iniciais'),
        ck('apresentacao', true, 'Apresentação', (st.pitch || '').trim() ? 'Pronta' : 'Recomendada'),
        ck('servicos', true, 'Serviços com preço e unidade', st.services.length ? st.services.map(svcPrice).join(' · ') : 'Sem serviço: o perfil mostra “Enviar mensagem”'),
        ck('disponibilidade', true, 'Vagas', st.avail === 'sim' ? 'Aceita novos alunos' : (st.avail === 'nao' ? 'Não aceita no momento' : (st.avail ? 'Não informada' : 'Opcional'))),
        ck('credenciais', true, 'CREF', st.cref ? 'Informado · verificação é outra etapa' : 'Opcional'),
        ck('instagram', true, 'Instagram', st.igStep === 'ok' ? st.ig + ' confirmado' : 'Opcional'),
        ck('recebimentos', true, 'Recebimentos', st.payout === 'ok' ? 'Vendas habilitadas' : 'Sem isto, os serviços aparecem mas a contratação fica indisponível')
      ],
      line: sportTxt + ' · ' + cityShort + ' · ' + fmtTxt, trust: meTrust, price: firstPrice,
      trustLine: meTrust.map((t) => t.label).join(' · '), svcLine: st.services.length ? st.services.map((s) => s.title + ' · ' + svcPrice(s)).join(' · ') : 'Nenhum', payLine: st.payout === 'ok' ? 'Habilitados' : (st.payout === 'wait' ? 'Em verificação · publicar não depende disso' : 'Ainda não habilitados · publicar não habilita vendas'),
      pubWhen: st.pubAt || '26/10 às 09:18', pubLink: st.pubSlug ? location.origin + '/treinador/' + st.pubSlug : '99coach.com.br/thiago-pereira',
      missing: !minOk, unknown: st.pubUnknown, cta: st.pubUnknown ? 'Consultar publicação' : (st.published ? 'Publicar alterações' : 'Publicar perfil'),
      go: () => {
        if (!minOk) return set({ toast: 'Falta o mínimo para publicar: modalidade, cidade e formato.' });
        if (st.pubUnknown && !(window.CONTA && window.CONTA.session() && !st.scn)) { set({ step: 'publicado', published: true, pubUnknown: false, version: st.version + 1, toast: 'Consultamos: o perfil foi publicado uma vez, às 09:18.' }); return top(); }
        // conta real: o recibo só aparece depois que o servidor confirma, com a hora e o endereço reais
        if (window.CONTA && window.CONTA.session() && !st.scn) {
          if (st.pubBusy) return;
          set({ pubBusy: true, toast: 'Publicando…' });
          const C = window.CONTA;
          return C.saveTrainer(st).then((r) => (r.ok ? C.publish() : r)).then((r) => {
            if (!r.ok && /email_nao_confirmado/.test(r.msg || '')) { const em = (C.user() || {}).email || st.email; return C.sendCode(em, st.name).then(() => { set({ pubBusy: false, email: em, step: 'codigo', code: '', real: true, afterVerify: 'pub', toast: 'Para publicar, confirme seu e-mail: enviamos um código para ' + em + '.' }); top(); }); }
            if (!r.ok) { set({ pubBusy: false, pubUnknown: !!r.offline, toast: r.offline ? 'Sem resposta do servidor: vamos consultar antes de tentar de novo, para não publicar duas vezes.' : 'O servidor não publicou: ' + (r.msg || 'erro ' + r.status) + '. Nada mudou na busca.' }); return; }
            return C.db('GET', 'trainers?select=slug,status&user_id=eq.' + encodeURIComponent(C.user().id)).then((q) => {
              const x = q.ok && q.data && q.data[0];
              if (!x || x.status !== 'publicado') { set({ pubBusy: false, pubUnknown: true, toast: 'O servidor ainda não confirmou a publicação. Consulte de novo.' }); return; }
              const d = new Date();
              set({ pubBusy: false, step: 'publicado', published: true, version: st.version + 1, pubAt: d.toLocaleDateString('pt-BR') + ' às ' + d.toTimeString().slice(0, 5), pubSlug: x.slug, toast: '' }); top();
            });
          });
        }
        set({ step: 'publicado', published: true, version: st.version + 1, toast: '' }); top();
      }
    };

    // ---------- Hoje do treinador (TRE01) ----------
    const h = {
      date: window.TODAY ? window.TODAY() : 'Segunda, 26 de outubro',
      title: 'Oi, ' + first, sub: st.published ? 'Seu perfil está no ar. Próximo passo natural: trazer os alunos que você já tem.' : 'Sua conta está pronta. Nada abaixo é obrigatório agora.',
      paths: [
        { title: st.published ? 'Editar meu cadastro' : 'Completar meu cadastro', sub: cad.progress + (st.published ? ' · publicado' : ' · publique quando quiser'), ic: 'ic ic--sm i-user', go: go('cad'), meta: st.published ? 'No ar' : 'Rascunho' },
        { title: 'Convidar um aluno', sub: 'Ele aceita uma vez e pronto. Sem cartão, sem Pro.', ic: 'ic ic--sm i-user-plus', go: goInvite, meta: st.invCreated ? (st.invShared ? 'Enviado' : 'Criado') : '1 min' },
        { title: 'Criar uma rotina', sub: 'Para usar com qualquer aluno', ic: 'ic ic--sm i-dumbbell', go: () => (window.GO ? window.GO('H06') : toast('Rotinas ainda não estão disponíveis.')), meta: '' }
      ]
    };
    const priceLine = st.services.length ? svcPrice(st.services[0]) : 'sem preço publicado';
    window.__onbState = st; if (window.STORE && !st.scn) window.STORE.saveOnb(st);

    const INV = {
      rafael: { name: 'Rafael Lima', first: 'Rafael', photo: IMG['bdc7ef1c8dbf05558c3bf8d575fc3a04'] || '', ini: 'RL', role: 'Treinador de CrossFit e Musculação · Londrina, PR', svc: 'Acompanhamento online',
        trust: [{ cls: 'trust trust--owner', ic: 'ic ic--xs i-user', label: 'Titularidade confirmada' }, { cls: 'trust trust--ver', ic: 'ic ic--xs i-shield', label: 'CREF verificado' }] },
      thiago: { name: st.name, first: first, photo: '', ini: ini, role: st.title + ' · ' + st.city, svc: st.invSvc === 'online' ? 'Acompanhamento online' : 'Acompanhamento', trust: meTrust }
    };
    const iv0 = INV[st.inviter] || INV.rafael;
    const inv = Object.assign({}, iv0, {
      hasPhoto: !!iv0.photo, noPhoto: !iv0.photo,
      inc: st.inviter === 'thiago' && st.invSvc !== 'online' ? ['Treinos no app 99Coach', 'Mensagens com ' + iv0.first] : [iv0.svc, 'Treinos no app 99Coach', 'Mensagens com ' + iv0.first]
    });
    const stuName = st.inviter === 'thiago' ? (st.invName || 'Ana Carvalho') : 'Ana Ribeiro';
    const stu = { first: stuName.split(' ')[0], ini: stuName.split(' ').map((w) => w[0]).slice(0, 2).join('') };

    // ---------- conta (ACC02) ----------
    const login = st.flow === 'entrar';
    const invite = st.flow === 'convite';
    const conta = invite ? { eyebrow: 'Convite', title: 'Só falta entrar', sub: 'Use e-mail ou celular. Depois de entrar, o convite é aceito com a decisão que você já tomou.', cta: 'Receber código', askName: false, askTerms: false, hasInvite: true, fine: 'Já tem conta? Entre com ela; o convite continua aqui. Não precisa instalar o app.', hasSwitch: false }
      : st.session ? { eyebrow: 'Entrar', title: 'Sua sessão expirou', sub: 'Por segurança, entre de novo.', cta: 'Entrar e continuar', askName: false, askTerms: false, hasSession: true, fine: 'Você volta para a mesma seção do perfil.', hasSwitch: false }
      : login ? { eyebrow: 'Entrar', title: 'Entrar', sub: window.CONTA ? '' : 'Use o e-mail ou celular da sua conta. Enviamos um código; senha não é necessária.', cta: window.CONTA ? 'Entrar' : 'Receber código', askName: false, askTerms: false, fine: 'A mesma conta serve para treinar e para atender.', hasSwitch: true, switchQ: 'Ainda não tem conta?', switchLabel: 'Criar conta', switchGo: () => { set(this.base('aluno', '')); top(); } }
      : st.intent === 'treinador' ? { eyebrow: 'Sou treinador · passo 1 de 3', title: 'Crie sua conta de treinador', sub: 'Grátis e sem cartão. Você completa o perfil depois, no seu ritmo.', cta: 'Criar conta', askName: true, askTerms: true, fine: 'Grátis até 3 alunos ativos.', hasSwitch: true, switchQ: 'Já tem conta?', switchLabel: 'Entrar', switchGo: () => { set(this.base('entrar', '')); top(); } }
      : { eyebrow: 'Quero treinar · passo 1 de 2', title: 'Crie sua conta', sub: 'Só o necessário para salvar treinadores, pedir acompanhamento e contratar.', cta: 'Criar conta', askName: true, askTerms: true, fine: 'Buscar e ver perfis não pede conta.', hasSwitch: true, switchQ: 'Já tem conta?', switchLabel: 'Entrar', switchGo: () => { set(this.base('entrar', '')); top(); } };
    const afterAuth = () => {
      if (invite) return go('confirmando')();
      if (st.session) { set({ step: 'sec', sec: 'apresentacao', session: false, toast: 'Você voltou para o mesmo rascunho, salvo às ' + st.savedAt + '.' }); return top(); }
      if (login) return go('pronto')();
      if (st.intent === 'treinador') return go('dados')();
      return go('pronto')();
    };
    // chegou pelo link de "esqueci a senha": a tela de entrar vira "crie uma senha nova"
    const np = !!(login && window.CONTA && window.CONTA.newPasswordPending && window.CONTA.newPasswordPending() && !st.scn);
    const npEmail = np ? ((window.CONTA.user() || {}).email || '') : '';
    if (np) Object.assign(conta, { eyebrow: 'Senha nova', title: 'Crie uma senha nova', sub: 'Você chegou pelo link que enviamos para ' + npEmail + '. Escolha a senha que vai usar daqui em diante.', cta: 'Salvar senha nova', askName: false, askTerms: false, fine: 'A senha antiga deixa de valer assim que você salvar.' });
    const f = {
      showSocial: !np, hideEmail: np,
      name: st.name, email: np ? npEmail : st.email, setName: (e) => set({ name: val(e) }), setEmail: (e) => set({ email: val(e), emailExists: false }),
        askPw: !!window.CONTA && !st.scn, pw: st.pw || '', setPw: (e) => set({ pw: val(e), pwErr: false }), pwCls: 'input' + (st.pwErr ? ' is-err' : ''),
        pwAuto: login && !np ? 'current-password' : 'new-password', pwHelp: login && !np ? '' : 'Pelo menos 8 caracteres.', canForgot: login && !np,
        forgot: () => { const em = (st.email || '').trim(); if (em.indexOf('@') < 1) return toast('Informe o e-mail da conta primeiro.'); window.CONTA.recover(em).then((r) => toast(r.ok ? 'Se houver uma conta com ' + em + ', enviamos um link para criar uma senha nova.' : (r.offline ? 'Sem conexão com o servidor.' : 'Não foi possível enviar: ' + (r.msg || r.status)))); },
      emailCls: 'input' + (st.emailExists ? ' is-err' : ''), emailExists: st.emailExists, noExists: !st.emailExists,
      loginExisting: () => { set(window.CONTA ? { flow: 'entrar', scn: '', emailExists: false, step: 'conta', pw: '', toast: 'Digite a senha da sua conta.' } : { flow: 'entrar', scn: '', emailExists: false, step: 'codigo', toast: '' }); top(); },
      termsOn: String(!!st.terms), termsCls: 'check' + (st.terms ? ' is-on' : ''), termsErr: st.termsErr, toggleTerms: () => set({ terms: !st.terms, termsErr: false }),
      submit: () => {
        if (np) {
          const pw1 = st.pw || '';
          if (pw1.length < 8) return set({ pwErr: true, toast: 'A senha precisa ter pelo menos 8 caracteres.' });
          set({ busy: true, toast: 'Salvando a senha nova…' });
          return window.CONTA.setPassword(pw1).then((r) => {
            set({ busy: false });
            if (!r.ok) return set({ toast: r.offline ? 'Sem conexão com o servidor. Tente de novo.' : 'O servidor não aceitou a senha: ' + (r.msg || ('erro ' + r.status)) });
            window.CONTA.newPasswordDone(); set({ pw: '', toast: 'Senha nova salva.' });
            finishReal('', npEmail, true);
          });
        }
        if (conta.askTerms && !st.terms) return set({ termsErr: true });
        if (!(st.email || '').trim()) return toast('Informe um e-mail ou celular.');
        // conta real: e-mail e senha no servidor da 99Coach (a conta é confirmada na hora)
        if (window.CONTA && !st.scn) {
          const email = (st.email || '').trim(), pw = st.pw || '';
          if (email.indexOf('@') < 1) return toast('Informe um e-mail válido.');
          if (pw.length < 8) return set({ pwErr: true, toast: 'A senha precisa ter pelo menos 8 caracteres.' });
          const role = login ? '' : (st.intent === 'treinador' || st.flow === 'treinador' ? 'treinador' : 'aluno');
          const done = () => finishReal(role, email, login);
          set({ busy: true, toast: login ? 'Entrando…' : 'Criando sua conta…' });
          const go = login ? window.CONTA.signIn(email, pw) : window.CONTA.signUp(email, pw, st.name);
          return go.then((r) => {
            set({ busy: false });
            if (r.session) return done();
            if (r.offline) return set({ toast: 'Sem conexão com o servidor da 99Coach. Verifique a internet e tente de novo.' });
            // e-mail que já tem conta: a tela não revela isso; pede o código enviado ao e-mail (quem é dono entra na conta que já existe)
            if (!login && r.exists) return window.CONTA.sendCode(email, st.name).then(() => { set({ step: 'codigo', code: '', real: true, toast: 'Enviamos um código para ' + email + ' para confirmar que o e-mail é seu.' }); top(); });
            if (login && r.wrong) return set({ pwErr: true, toast: 'E-mail ou senha não conferem.' });
            if (login && r.unconfirmed) return window.CONTA.sendCode(email, st.name).then(() => { set({ step: 'codigo', code: '', real: true, toast: 'Enviamos um código para ' + email + ' para confirmar a conta.' }); top(); });
            if (!login && r.ok) return window.CONTA.sendCode(email, st.name).then(() => { set({ step: 'codigo', code: '', real: true, toast: 'Enviamos um código para ' + email + '.' }); top(); });
            set({ toast: 'O servidor não aceitou: ' + (r.msg || ('erro ' + r.status)) });
          });
        }
        set({ step: 'codigo', toast: '' }); top();
      },
      social: (e) => {
        if (conta.askTerms && !st.terms) return set({ termsErr: true });
        // produto: login real com Google (o servidor devolve a pessoa já autenticada para esta página)
        if (window.CONTA && !st.scn && !document.documentElement.classList.contains('demo')) {
          if (/Apple/.test((e && e.target && e.target.textContent) || '')) return toast('Entrar com Apple ainda não está disponível. Use o Google ou e-mail e senha.');
          return window.CONTA.oauth('google', { flow: st.flow, role: login ? '' : (st.intent === 'treinador' || st.flow === 'treinador' ? 'treinador' : 'aluno') });
        }
        toast('Demonstração: nenhum login real com Google ou Apple. Seguimos como se a conta tivesse sido confirmada.');
        setTimeout(() => afterAuth(), 10);
      }
    };

    // ---------- código (ACC03) ----------
    const c = {
      value: st.code, set: (e) => set({ code: val(e).replace(/\D/g, '').slice(0, 6), codeErr: false }), expired: st.codeExp, err: st.codeErr,
      change: go('conta'),
      verify: () => {
        if ((st.code || '').length !== 6) return set({ codeErr: true });
        // conta real: o servidor confere o código e abre a sessão
        if (window.CONTA && st.real && !st.scn) {
          return window.CONTA.verify(st.email, st.code).then((r) => {
            if (!r.ok) return set(r.offline ? { toast: 'Sem conexão com o servidor. Tente de novo.' } : { codeErr: true, codeExp: /expir/i.test(r.msg || '') });
            if (st.afterVerify === 'pub') { set({ afterVerify: '', codeExp: false, conta: true, step: 'pub', toast: 'E-mail confirmado. Agora é só publicar.' }); return top(); }
            const role = st.flow === 'entrar' ? '' : (st.intent === 'treinador' ? 'treinador' : 'aluno');
            if (role) window.CONTA.addRole(role);
            set({ codeExp: false, conta: true });
            if (!role) return window.CONTA.syncRoles().then(() => afterAuth());
            afterAuth();
          });
        }
        set({ codeExp: false }); afterAuth();
      },
      hasIntent: invite || st.intent === 'treinador',
      intent: invite ? 'Depois da verificação, registramos o aceite do convite de ' + inv.first + '. Só uma vez.' : 'Depois da verificação, você escolhe modalidade e local. Nada é publicado ainda.'
    };
    if (st.step === 'confirmando' && !this.__conf) { this.__conf = setTimeout(() => { this.__conf = null; if (this.state.step === 'confirmando') this.setState({ step: 'conectado' }); }, 1100); }

    // ---------- escolha (ACC01) ----------
    const INT = [['aluno', 'Quero treinar', 'Encontrar treinador ou programa', 'ic ic--sm i-search'], ['treinador', 'Sou treinador', 'Atender alunos e vender meus serviços', 'ic ic--sm i-users']];
    const intents = INT.map(([k, t, s, ic]) => ({ title: t, sub: s, ic: ic, on: String(st.intent === k), cls: 'ocard onb-choice' + (st.intent === k ? ' is-on' : ''), pick: () => set({ intent: k, intentErr: false }) }));
    const continueIntent = () => { if (!st.intent) return set({ intentErr: true }); set({ step: 'conta', flow: st.intent === 'treinador' ? 'treinador' : 'aluno' }); top(); };

    // ---------- primeiros dados (ACC05 · Cadastro VFINAL + Componentes-16 · cidade) ----------
    const MODS = ['crossfit', 'musculacao', 'funcional', 'lpo', 'corrida', 'pilates', 'yoga', 'lutas'];
    const MORE = ['natacao', 'ciclismo', 'mobilidade', 'calistenia', 'hiit', 'danca', 'tenis', 'beach', 'escalada', 'futebol', 'volei', 'basquete'];
    const nrm = (x) => String(x || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
    const modsOn = Object.keys(st.sports).filter((kk) => st.sports[kk]);
    const pickMod = (kk) => () => { const isOn = !!st.sports[kk]; if (!isOn && modsOn.length >= 5) return toast('Até 5 modalidades no perfil. Tire uma para escolher outra.'); set({ sports: Object.assign({}, st.sports, { [kk]: !isOn }), dErr: false }); };
    const modItem = (kk) => { const isOn = !!st.sports[kk]; return { label: SPORT[kk], on: String(isOn), isOn: isOn, cls: 'chip cv-chip' + (isOn ? ' is-on' : ''), pick: pickMod(kk) }; };
    const modCount = modsOn.length === 0 ? 'nenhuma escolhida' : (modsOn.length === 1 ? '1 escolhida' : modsOn.length + ' escolhidas');
    const moreList = MORE.filter((kk) => !st.modQ || nrm(SPORT[kk]).indexOf(nrm(st.modQ)) >= 0);

    // cidades (amostra normalizada; em produção vem da base do IBGE)
    const CITIES = [['Londrina', 'PR', 'Paraná'], ['Cambé', 'PR', 'Paraná'], ['Ibiporã', 'PR', 'Paraná'], ['Rolândia', 'PR', 'Paraná'], ['Arapongas', 'PR', 'Paraná'], ['Apucarana', 'PR', 'Paraná'], ['Maringá', 'PR', 'Paraná'], ['Curitiba', 'PR', 'Paraná'], ['Toledo', 'PR', 'Paraná'], ['Toledo', 'MG', 'Minas Gerais'], ['Cascavel', 'PR', 'Paraná'], ['Cascavel', 'CE', 'Ceará'], ['São Paulo', 'SP', 'São Paulo'], ['Campinas', 'SP', 'São Paulo'], ['Santos', 'SP', 'São Paulo'], ['Rio de Janeiro', 'RJ', 'Rio de Janeiro'], ['Belo Horizonte', 'MG', 'Minas Gerais'], ['Florianópolis', 'SC', 'Santa Catarina'], ['Porto Alegre', 'RS', 'Rio Grande do Sul'], ['Goiânia', 'GO', 'Goiás'], ['Salvador', 'BA', 'Bahia'], ['Recife', 'PE', 'Pernambuco'], ['Fortaleza', 'CE', 'Ceará'], ['Brasília', 'DF', 'Distrito Federal']];
    const NEAR = { 'Londrina|PR': ['Cambé', 'Ibiporã'], 'Maringá|PR': ['Arapongas', 'Apucarana'] };
    const REAL = { 'Londrina|PR': { crossfit: 8, funcional: 5 } };   // contagem só real: sem dado, a linha mostra só o estado
    const cityOf = (n, uf) => CITIES.find((c) => c[0] === n && c[1] === uf);
    const cq = st.q || '', qn = nrm(cq);
    const hasCity = !!(st.city || '').trim();
    const cityReqd = st.pres;
    const cityErr = !!st.dErr && cityReqd && !hasCity;
    let found = [];
    if (qn.length >= 2) {
      const starts = CITIES.filter((c) => nrm(c[0]).indexOf(qn) === 0), inner = CITIES.filter((c) => nrm(c[0]).indexOf(qn) > 0);
      found = starts.concat(inner).slice(0, 6);
    }
    const dd = st.dd ? (qn.length < 2 ? 'empty' : (found.length ? 'typing' : 'none')) : null;
    const top1 = found[0];
    const nearKeys = dd === 'typing' && top1 ? (NEAR[top1[0] + '|' + top1[1]] || []).filter((n) => !found.some((c) => c[0] === n)) : [];
    const realLine = (c, short) => { const r = REAL[c[0] + '|' + c[1]]; if (!r) return ''; const kk = modsOn.find((m) => r[m]); return kk ? ' · ' + r[kk] + (short ? ' de ' + SPORT[kk] + ' atendem aqui' : ' treinadores de ' + SPORT[kk] + ' já atendem aqui') : ''; };
    const choose = (c) => () => { set({ city: c[0] + ', ' + c[1], regions: {}, q: '', dd: null, act: 0, dErr: false, cvLive: c[0] + ', ' + c[1] + ' escolhida' }); };
    // opções navegáveis por teclado, na ordem da lista
    const opts = dd === 'empty' ? [['cv-o-loc', () => set({ dSheet: 'loc', dd: null })], ['cv-o-last', choose(cityOf('Londrina', 'PR'))]]
      : (dd === 'typing' ? found.map((c, i) => ['cv-o-' + i, choose(c)]).concat(nearKeys.map((n, i) => ['cv-o-n' + i, choose(cityOf(n, top1[1]))])) : []);
    const act = Math.min(st.act || 0, Math.max(opts.length - 1, 0));
    const optCls = (id) => 'cv-opt' + (opts[act] && opts[act][0] === id ? ' is-active' : '');
    const optSel = (id) => String(!!(opts[act] && opts[act][0] === id));
    const matches = found.map((c, i) => { const id = 'cv-o-' + i, n0 = nrm(c[0]), at = n0.indexOf(qn); return { id: id, pre: c[0].slice(0, at), hit: c[0].slice(at, at + qn.length), rest: c[0].slice(at + qn.length), uf: c[1], sub: c[2] + realLine(c), subS: c[2] + realLine(c, true), cls: optCls(id), act: optSel(id), pick: choose(c) }; });
    const nearby = nearKeys.map((n, i) => { const id = 'cv-o-n' + i, c = cityOf(n, top1[1]); return { id: id, name: n, uf: c[1], sub: c[2] + ' · região de ' + top1[0], cls: optCls(id), act: optSel(id), pick: choose(c) }; });
    const homonym = found.some((c) => found.filter((x) => x[0] === c[0]).length > 1);
    const nTot = found.length + nearKeys.length;
    // o campo só existe depois do próximo render: tenta algumas vezes
    const focusQ = (n) => setTimeout(() => { const el = document.getElementById('cv-city'); if (el) el.focus(); else if ((n || 0) < 15) focusQ((n || 0) + 1); }, 40);
    const REGS = [['centro', 'Centro'], ['zonasul', 'Zona Sul'], ['zonanorte', 'Zona Norte'], ['zonaleste', 'Zona Leste'], ['zonaoeste', 'Zona Oeste'], ['gleba', 'Gleba Palhano']];
    const regOn = REGS.filter(([kk]) => st.regions[kk]).length;
    const LANGS = [['pt', 'Português'], ['en', 'Inglês'], ['es', 'Espanhol']];
    const langsOn = LANGS.filter(([kk]) => st.langs[kk]).length;

    const missing = [];
    if (!modsOn.length) missing.push('uma modalidade');
    if (!st.pres && !st.onl) missing.push('o formato de atendimento');
    if (cityReqd && !hasCity) missing.push('a cidade (ou marque só Online)');
    const valid = missing.length === 0;
    const btnS = (label, fn, kind) => ({ label: label, go: fn, cls: 'btn btn--sm ' + (kind === 2 ? 'btn--outline' : (kind === 3 ? 'btn--ghost' : 'btn--primary')) });
    const closeSh = () => set({ dSheet: null, modQ: '' });
    const SH = {
      more: ['Mais modalidades', [], [btnS('Pronto', closeSh)]],
      loc: ['Usar sua localização?', ['O navegador vai perguntar. Usamos a localização só para sugerir a cidade; o endereço não aparece no perfil.'], [btnS('Permitir', () => set({ dSheet: null, city: 'Londrina, PR', regions: {}, dd: null, loc: 'ok', dErr: false, cvLive: 'Londrina, PR escolhida pela localização' })), btnS('Agora não', () => { set({ dSheet: null, loc: 'denied', dd: 'open', q: '' }); focusQ(); }, 2)]],
      review: ['Enviar cidade para revisão', ['A equipe confere e adiciona a cidade em até 2 dias úteis. Enquanto isso o perfil fica salvo como rascunho e você pode marcar Online.'], [btnS('Enviar “' + cq + '”', () => set({ dSheet: 'sent' })), btnS('Voltar', closeSh, 3)]],
      sent: ['Cidade enviada', ['Recebemos “' + cq + '”. Você recebe um aviso quando ela entrar na lista.'], [btnS('Fechar', () => set({ dSheet: null, dd: null, q: '' }))]],
      skip: ['Pular por agora?', ['Seu perfil fica como rascunho e não aparece na busca até você completar estes dados no painel.'], [btnS('Pular', () => { set({ dSheet: null, step: 'hoje', toast: 'Rascunho salvo. Você completa estes dados depois, em Perfil e cadastro.' }); top(); }), btnS('Continuar preenchendo', closeSh, 2)]],
      back: ['Sair do cadastro?', ['Sua conta já está criada. O que você marcou aqui fica salvo neste aparelho e você continua depois.'], [btnS('Sair', () => { set({ dSheet: null }); if (NAV) NAV.back(); }), btnS('Continuar aqui', closeSh, 2)]],
      help: ['Ajuda', ['Modalidade, formato, cidade e idioma servem para alunos te acharem. Tudo pode mudar depois no painel.'], [btnS('Fechar', closeSh)]]
    };
    const shd = st.dSheet ? SH[st.dSheet] : null;
    const openSh = (s) => () => set({ dSheet: s, dd: null });
    const d = {
      rootCls: 'cv' + (dd ? ' has-dd' : ''),
      mods: MODS.map(modItem).concat(modsOn.filter((kk) => MODS.indexOf(kk) < 0).map(modItem)), modCount, modCountCap: modCount.charAt(0).toUpperCase() + modCount.slice(1), modErr: !!st.dErr && !modsOn.length,
      moreMods: moreList.map(modItem), moreNone: !moreList.length, modQ: st.modQ || '', setModQ: (e) => set({ modQ: val(e) }),
      openMore: openSh('more'), openHelp: openSh('help'), openBack: openSh('back'), openSkip: openSh('skip'), openReview: openSh('review'),
      presCls: 'cv-reset cv-tog' + (st.pres ? ' is-on' : ''), presOn: String(!!st.pres), togPres: () => { if (st.pres && !st.onl) return toast('Marque Online antes de tirar Presencial: é preciso pelo menos um formato.'); set({ pres: !st.pres, dErr: false }); },
      onlCls: 'cv-reset cv-tog' + (st.onl ? ' is-on' : ''), onlOn: String(!!st.onl), togOnl: () => { if (st.onl && !st.pres) return toast('Marque Presencial antes de tirar Online: é preciso pelo menos um formato.'); set({ onl: !st.onl }); },
      cityReq: cityReqd ? 'obrigatório para presencial' : 'opcional para online',
      locDenied: st.loc === 'denied', noCity: !hasCity, hasCity, cityLabel: st.city,
      cityCls: 'cv-city' + (dd ? ' is-open' : ''), inCls: 'cv-in' + (dd ? ' is-focus' : '') + (cityErr ? ' is-err' : ''),
      ph: cityReqd ? 'Digite sua cidade' : 'Digite sua cidade (opcional)', q: cq, hasQ: !!cq, ddOpen: String(!!dd), ddOn: !!dd, cityErr: String(cityErr),
      activeId: opts[act] ? opts[act][0] : '',
      setQ: (e) => set({ q: val(e), dd: 'open', act: 0, cvLive: '' }),
      open: () => { if (!st.dd) set({ dd: 'open', act: 0 }); },
      key: (e) => {
        const kk = e.key;
        if (kk === 'ArrowDown' || kk === 'ArrowUp') { e.preventDefault(); if (!st.dd) return set({ dd: 'open', act: 0 }); if (!opts.length) return; set({ act: (act + (kk === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length }); }
        else if (kk === 'Enter') { e.preventDefault(); if (dd && opts[act]) opts[act][1](); }
        else if (kk === 'Escape') { if (st.dd) { e.preventDefault(); set({ dd: null }); } }
      },
      clearQ: () => { set({ q: '', dd: 'open', act: 0 }); focusQ(); },
      closeDd: () => set({ dd: null }),
      ddEmpty: dd === 'empty', ddTyping: dd === 'typing', ddNone: dd === 'none',
      locCls: optCls('cv-o-loc'), locSel: optSel('cv-o-loc'), lastCls: optCls('cv-o-last'), lastSel: optSel('cv-o-last'),
      askLoc: openSh('loc'), pickLast: choose(cityOf('Londrina', 'PR')),
      matches, nearby, hasNear: nearby.length > 0, nearTitle: top1 ? 'Perto de ' + top1[0] : '', homonym, total: nTot === 1 ? '1 cidade' : nTot + ' cidades',
      removeCity: () => { set({ city: '', regions: {}, cvLive: 'Cidade removida' }); focusQ(); },
      chipKey: (e) => { if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); set({ city: '', regions: {}, cvLive: 'Cidade removida' }); focusQ(); } },
      change: () => { set({ city: '', regions: {}, q: '', dd: 'open', act: 0 }); focusQ(); },
      showHelp: !cityErr && !dd, cityHelp: !st.pres ? 'Atender online não exige endereço público.' : 'Só a cidade e, se quiser, a região aparecem no perfil.', cityErr2: cityErr,
      live: st.cvLive || (dd === 'typing' ? (nTot === 1 ? '1 cidade' : nTot + ' cidades') : (dd === 'none' ? 'Nenhuma cidade' : '')),
      regions: REGS.map(([kk, l]) => { const isOn = !!st.regions[kk]; return { label: l, on: String(isOn), isOn: isOn, cls: 'chip cv-chip' + (isOn ? ' is-on' : ''), pick: () => set({ regions: Object.assign({}, st.regions, { [kk]: !isOn }) }) }; }),
      regCount: regOn ? regOn + (regOn === 1 ? ' escolhida' : ' escolhidas') : 'nenhuma',
      langs: LANGS.map(([kk, l]) => { const isOn = !!st.langs[kk]; return { label: l, on: String(isOn), isOn: isOn, cls: 'chip cv-chip' + (isOn ? ' is-on' : ''), pick: () => { if (isOn && langsOn <= 1) return; set({ langs: Object.assign({}, st.langs, { [kk]: !isOn }) }); } }; }),
      ctaCls: 'btn btn--primary btn--lg btn--block btn--arrow' + (valid ? '' : ' is-dim'), ctaDis: String(!valid),
      save: () => {
        if (!valid) { set({ dErr: true, dd: null }); setTimeout(() => { const el = document.querySelector('.cv .field__err'); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 40); return; }
        set({ step: 'sec', sec: 'foto', dadosSaved: true, dErr: false, savedAt: now(), toast: 'Primeiros dados salvos às ' + now() + '. Passo 2 de 3: foto e apresentação. Nada foi publicado.' }); top();
      },
      showWhy: !valid, why: 'Para continuar falta ' + missing.join(' e ') + '.',
      sheetOn: !!shd, closeSheet: closeSh, shTitle: shd ? shd[0] : '', shLines: shd ? shd[1] : [], shBtns: shd ? shd[2] : [], shMore: st.dSheet === 'more'
    };

    // ---------- convite: treinador (REL01) ----------
    const iv = {
      name: st.invName, setName: (ev) => set({ invName: val(ev) }), nameOr: st.invName || 'aluno sem nome',
      svcs: [['online', 'Acompanhamento online', priceLine + ' · cobrança só depois do aceite e do resumo', 'monitor'], ['none', 'Sem serviço por enquanto', 'Vocês combinam depois', 'user-plus']].map(([kk, t, s, icn]) => ({ title: t, sub: s, ic: 'ic ic--sm i-' + icn, on: String(st.invSvc === kk), cls: 'ocard onb-choice' + (st.invSvc === kk ? ' is-on' : ''), pick: () => set({ invSvc: kk }) })),
      notCreated: !st.invCreated, created: st.invCreated, create: () => set({ invCreated: true, toast: 'Convite criado. Ainda não foi enviado: escolha como compartilhar.' }),
      badge: st.invShared ? 'Enviado · não aceito' : 'Criado · não enviado', badgeCls: 'badge ' + (st.invShared ? 'badge--info' : 'badge--plain'),
      svcLine: st.invSvc === 'online' ? 'Ao aceitar, o aluno entra no Acompanhamento online.' : 'Sem serviço: o aluno fica conectado e vocês combinam depois.',
      shareWa: () => set({ invShared: 'WhatsApp', toast: 'Demonstração: nada é enviado. Na versão real, abre o WhatsApp com a mensagem pronta.' }),
      shareMail: () => set({ invShared: 'e-mail', toast: 'Demonstração: nenhum e-mail é enviado.' }),
      shared: !!st.invShared, sharedLine: 'Compartilhado por ' + st.invShared + ' às 09:21. Enviado não significa aceito.',
      preview: () => { set(Object.assign({}, this.state, { flow: 'convite', scn: '', step: 'convite', inviter: 'thiago', cvVar: '', toast: '' })); top(); }
    };

    // ---------- convite: aluno (REL03) ----------
    const CVS = {
      expirado: ['state__ic onb-warn', 'ic i-clock', 'Este convite expirou', 'Convites valem 7 dias. Peça um novo a ' + inv.first + '; o anterior não é reaproveitado.', 'Pedir novo convite', () => toast('Pedido enviado a ' + inv.first + '. Você recebe o novo link por e-mail.')],
      aceito: ['state__ic onb-ok', 'ic i-check', 'Convite já aceito', 'Este convite já foi aceito pela conta a•••@email.com. Entre com ela para abrir o acompanhamento.', 'Entrar com essa conta', go('conta')],
      outra: ['state__ic onb-swap', 'ic i-swap', 'Você está em outra conta', 'Você entrou como lucas@email.com. Para aceitar, entre com a conta que recebeu o convite.', 'Trocar de conta', go('conta', { cvVar: '' })]
    };
    const cs = CVS[st.cvVar];
    const cv = {
      normal: !cs, hasState: !!cs, logged: st.cvVar === 'logado',
      cta: st.cvVar === 'logado' ? 'Aceitar convite' : 'Entrar e aceitar convite',
      accept: st.cvVar === 'logado' ? go('confirmando') : go('conta'),
      otherAccount: go('conta', { cvVar: '' }), ignore: () => toast('Convite ignorado neste aparelho. ' + inv.first + ' não é avisado.'),
      terms: () => toast('Termos do convite: conexão com o treinador, mensagens e treinos. Sem cobrança e sem compartilhar dados de saúde.'),
      stIcCls: cs ? cs[0] : '', stIc: cs ? cs[1] : '', stTitle: cs ? cs[2] : '', stSub: cs ? cs[3] : '', stCta: cs ? cs[4] : '', stGo: cs ? cs[5] : null
    };

    // ---------- preparação (REL07) ----------
    const Q = [
      ['Qual é o seu objetivo principal?', '', ['Ganhar força', 'Condicionamento', 'Perder gordura', 'Voltar a treinar', 'Mobilidade e postura'], false],
      ['Como está sua experiência com treino?', '', ['Nunca treinei', 'Treino há menos de 1 ano', 'Treino há mais de 1 ano'], false],
      ['Quantos dias por semana você pode treinar?', 'Conta o que cabe na sua rotina hoje.', ['2 dias', '3 dias', '4 dias', '5 ou mais'], false],
      ['Tem alguma lesão ou dor hoje?', 'Sem resposta não significa “sem dor”.', ['Não', 'Sim'], false],
      ['Onde você vai treinar?', 'Pode marcar mais de um.', ['Academia', 'Box de CrossFit', 'Em casa', 'Ao ar livre'], true]
    ];
    const qi = Math.min(st.prepQ, 4), q = Q[qi], ans = st.prepA[qi];
    const isOn = (o) => q[3] ? !!(ans && ans[o]) : ans === o;
    const p = {
      pos: String(qi + 1), n: String(qi + 1), barW: 'width: ' + Math.round((qi + 1) * 20) + '%', q: q[0], hasHelp: !!q[1], help: q[1],
      opts: q[2].map((o) => ({ label: o, on: String(isOn(o)), cls: 'opt' + (isOn(o) ? ' is-on' : ''), pick: () => set({ prepA: Object.assign({}, st.prepA, { [qi]: q[3] ? Object.assign({}, ans || {}, { [o]: !(ans && ans[o]) }) : o }) }) })),
      hasText: qi === 3 && ans === 'Sim', text: st.prepText, setText: (ev) => set({ prepText: val(ev) }),
      cta: qi === 4 ? 'Enviar respostas' : 'Continuar', canBack: qi > 0, prev: () => set({ prepQ: qi - 1 }),
      next: () => { if (qi < 4) { set({ prepQ: qi + 1 }); top(); } else { set({ step: 'alunoHoje', prepDone: true, toast: 'Respostas enviadas a ' + inv.first + ' às 09:24.' }); top(); } }
    };

    // ---------- Hoje do aluno (ALU01) ----------
    const a = {
      checks: [
        { label: 'Conectado a ' + inv.first, sub: inv.svc + ' · ativo desde hoje', cls: 'onb-check__i is-ok', mark: 'check is-on', hasGo: false, hasTag: false },
        st.prepDone ? { label: 'Sobre você', sub: 'Enviado às 09:24 · ' + inv.first + ' ainda vai revisar', cls: 'onb-check__i is-ok', mark: 'check is-on', hasGo: false, hasTag: false }
          : { label: 'Sobre você (5 perguntas)', sub: 'Cerca de 2 minutos · ajuda no primeiro treino', cls: 'onb-check__i is-todo', mark: 'check', hasGo: true, goLabel: 'Responder', goCls: 'btn btn--primary btn--sm', go: go('prep'), hasTag: false },
        { label: 'Primeiro treino', sub: inv.first + ' está preparando', cls: 'onb-check__i is-wait', mark: 'check', hasGo: false, hasTag: true, tag: 'Com o treinador' },
        { label: 'Avisos no celular', sub: 'Opcional · para saber quando o treino chegar', cls: 'onb-check__i is-opt', mark: 'check', hasGo: true, goLabel: 'Ativar', goCls: 'btn btn--outline btn--sm', go: () => toast('O aparelho só pede permissão quando você toca aqui. Demonstração: nada foi ativado.'), hasTag: false }
      ]
    };

    // ========== Conta (ACC11–ACC15) ==========
    const studentRole = st.flow === 'convite';
    const goCta = (kk) => () => { set({ step: 'cta', cta: kk, toast: '', sessConfirm: null, exportStep: '', delOpen: false, shareAdding: false, shareReceipt: '', langFail: false }); top(); };
    const LT = {
      pt: { title: 'Idioma e região', lang: 'Idioma da interface', langHelp: 'Isso não altera a moeda da sua compra nem os idiomas em que os treinadores atendem.', tz: 'Fuso horário', units: 'Unidades', country: 'País das compras', countryV: 'Brasil · vendas em reais nesta versão', currency: 'Moeda', currencyV: 'Cada oferta mostra a moeda do treinador', save: 'Salvar preferências', saved: 'Preferências salvas. A interface muda na hora.', failT: 'Não salvou', failS: 'Mantivemos o idioma anterior. Tente de novo.' },
      en: { title: 'Language and region', lang: 'Interface language', langHelp: 'This does not change the currency of your purchase or the languages coaches speak.', tz: 'Time zone', units: 'Units', country: 'Purchase country', countryV: 'Brazil · sales in reais in this version', currency: 'Currency', currencyV: 'Each offer shows the coach’s currency', save: 'Save preferences', saved: 'Preferences saved. The interface changes right away.', failT: 'Not saved', failS: 'We kept the previous language. Try again.' },
      es: { title: 'Idioma y región', lang: 'Idioma de la interfaz', langHelp: 'Esto no cambia la moneda de tu compra ni los idiomas en que atienden los entrenadores.', tz: 'Zona horaria', units: 'Unidades', country: 'País de las compras', countryV: 'Brasil · ventas en reales en esta versión', currency: 'Moneda', currencyV: 'Cada oferta muestra la moneda del entrenador', save: 'Guardar preferencias', saved: 'Preferencias guardadas. La interfaz cambia al instante.', failT: 'No se guardó', failS: 'Mantuvimos el idioma anterior. Inténtalo de nuevo.' }
    };
    const lt = LT[st.lang] || LT.pt;
    const lg = {
      t: lt, fail: !!st.langFail,
      langs: [['pt', 'Português'], ['en', 'English'], ['es', 'Español']].map(([kk, l]) => ({ label: l, code: kk === 'pt' ? 'pt-BR' : kk, on: String(st.lang === kk), cls: 'seg__it' + (st.lang === kk ? ' is-on' : ''), pick: () => set({ lang: kk, langFail: false }) })),
      tzs: [['brasilia', 'Brasília (UTC−3)'], ['manaus', 'Manaus (UTC−4)'], ['acre', 'Rio Branco (UTC−5)']].map(([kk, l]) => ({ label: l, on: String(st.tz === kk), cls: 'opt' + (st.tz === kk ? ' is-on' : ''), pick: () => set({ tz: kk }) })),
      units: [['kg', 'kg · cm'], ['lb', 'lb · in']].map(([kk, l]) => ({ label: l, on: String(st.unit === kk), cls: 'seg__it' + (st.unit === kk ? ' is-on' : ''), pick: () => set({ unit: kk }) })),
      save: () => set({ langSaved: st.lang, langFail: false, toast: lt.saved }),
      simFail: () => set({ lang: st.langSaved || 'pt', langFail: true })
    };

    const SESS = [['Chrome · macOS', 'Londrina, PR · agora', 'monitor', true], ['iPhone · app 99Coach', 'São Paulo, SP · há 3 dias', 'monitor', false], ['Android · navegador', 'Curitiba, PR · há 12 dias', 'monitor', false]];
    const live = SESS.map((s2, i) => [s2, i]).filter(([, i]) => !st.sessEnded[i]);
    const sg = {
      mfaOn: String(!!st.mfa), mfaCls: 'switch onb-switch' + (st.mfa ? ' is-on' : ''), mfaSub: st.mfa ? 'Ativa · código por e-mail ao entrar em aparelho novo' : 'Desligada · recomendamos manter ligada',
      toggleMfa: () => set(st.mfa ? { sessConfirm: 'mfa', sessCode: '' } : { mfa: true, toast: 'Verificação em 2 etapas ativada.' }),
      sessions: live.map(([s2, i]) => ({ name: s2[0], meta: s2[1], ic: 'ic ic--sm i-' + s2[2], current: s2[3], canEnd: !s2[3], end: () => set({ sessConfirm: i, sessCode: '' }) })),
      hasOthers: live.filter(([s2]) => !s2[3]).length > 0, endAll: () => set({ sessConfirm: 'all', sessCode: '' }),
      confirming: st.sessConfirm !== null && st.sessConfirm !== undefined,
      confirmWhat: st.sessConfirm === 'mfa' ? 'Para desligar a verificação em 2 etapas.' : (st.sessConfirm === 'all' ? 'Para encerrar todas as outras sessões.' : 'Para encerrar a sessão em ' + (SESS[st.sessConfirm] ? SESS[st.sessConfirm][0] : '') + '.'),
      code: st.sessCode, setCode: (ev) => set({ sessCode: val(ev).replace(/\D/g, '').slice(0, 6) }),
      cancel: () => set({ sessConfirm: null }),
      confirm: () => {
        if ((st.sessCode || '').length !== 6) return toast('Digite os 6 números do código.');
        if (st.sessConfirm === 'mfa') return set({ mfa: false, sessConfirm: null, toast: 'Verificação em 2 etapas desligada.' });
        const ended = Object.assign({}, st.sessEnded);
        if (st.sessConfirm === 'all') SESS.forEach((s2, i) => { if (!s2[3]) ended[i] = true; }); else ended[st.sessConfirm] = true;
        set({ sessEnded: ended, sessConfirm: null, toast: st.sessConfirm === 'all' ? 'Outras sessões encerradas. A lista foi atualizada.' : 'Sessão encerrada. A lista foi atualizada.' });
      }
    };

    const PURP = [['acomp', 'Acompanhamento e treinos', 'Necessária para o serviço funcionar', true], ['sug', 'Melhorar sugestões', 'Usa sua busca atual e seus salvos para ordenar sugestões', false], ['uso', 'Medição de uso anônima', 'Contagens agregadas de telas e cliques, sem dados de treino', false]];
    const EFFECTS = studentRole
      ? ['Você perde o acesso à conta e ao histórico de treinos.', 'Acompanhamentos ativos são encerrados; cobranças futuras são canceladas.', 'Programas comprados deixam de estar disponíveis para você.', 'Recibos de compra ficam guardados por 5 anos, por obrigação fiscal.', 'O pedido pode ser cancelado em até 7 dias.']
      : ['Seu perfil sai da busca e o link deixa de funcionar.', 'Seus alunos são avisados; o que eles já compraram continua garantido até o fim do período.', 'Pagamentos pendentes são concluídos antes do encerramento.', 'Recibos e repasses ficam guardados por 5 anos, por obrigação fiscal.', 'O pedido pode ser cancelado em até 7 dias.'];
    const pv = {
      isTrainer: !studentRole,
      purposes: PURP.map(([kk, t, s2, locked]) => ({ title: t, sub: s2, locked: locked, free: !locked, on: String(!!st.purposes[kk]), swCls: 'switch onb-switch' + (st.purposes[kk] ? ' is-on' : ''), toggle: () => set({ purposes: Object.assign({}, st.purposes, { [kk]: !st.purposes[kk] }) }) })),
      save: () => toast('Preferências de privacidade salvas às ' + now() + '.'),
      exportStart: () => set({ exportStep: 'confirm', pvCode: '' }), exportCancel: () => set({ exportStep: '' }), exportConfirm: st.exportStep === 'confirm',
      code: st.pvCode, setCode: (ev) => set({ pvCode: val(ev).replace(/\D/g, '').slice(0, 6) }),
      exportSend: () => { if ((st.pvCode || '').length !== 6) return toast('Digite os 6 números do código.'); set({ exportStep: '', reqExport: true, toast: 'Pedido de exportação recebido · protocolo #P-44.' }); },
      fixSub: studentRole ? 'Nome, e-mail e dados do seu perfil de aluno' : 'Leva ao seu cadastro de treinador', fix: studentRole ? () => toast('Fora desta versão: a edição do perfil do aluno abre aqui.') : go('cad'),
      unpublish: () => (window.CONTA && window.CONTA.session() && st.published && !st.scn) ? window.CONTA.unpublish().then((r) => set(r.ok ? { published: false, toast: 'Perfil retirado da busca. Sua conta, seus alunos e seus recebimentos continuam.' } : { toast: 'Não foi possível retirar agora: ' + (r.msg || r.status) })) : toast(st.published ? 'Demonstração: o perfil sairia da busca. Sua conta, seus alunos e seus recebimentos continuam.' : 'Seu perfil ainda não está publicado.'),
      delStart: () => set({ delOpen: true, delOk: false }), delOpen: !!st.delOpen, effects: EFFECTS, delOkOn: String(!!st.delOk), delOkCls: 'check' + (st.delOk ? ' is-on' : ''), delToggle: () => set({ delOk: !st.delOk }),
      delCancel: () => set({ delOpen: false }), delSend: () => { if (!st.delOk) return toast('Marque a confirmação para pedir a exclusão.'); set({ delOpen: false, reqDelete: true, toast: 'Pedido de exclusão recebido · protocolo #E-12. Efetiva em 7 dias.' }); },
      hasReqs: !!(st.reqExport || st.reqDelete),
      reqs: [].concat(st.reqExport ? [{ title: 'Exportação de dados', sub: 'Pedido em 26/10 · protocolo #P-44 · pode levar até 48 h', st: 'Em preparo', cls: 'badge badge--warn', canCancel: false }] : [])
        .concat(st.reqDelete ? [{ title: 'Exclusão da conta', sub: 'Pedido em 26/10 · protocolo #E-12 · efetiva em 02/11', st: 'Agendada', cls: 'badge badge--risk', canCancel: true, cancel: () => set({ reqDelete: false, toast: 'Pedido de exclusão cancelado. Nada mudou na sua conta.' }) }] : [])
    };

    const DADOS = [['medidas', 'Medidas corporais'], ['anamnese', 'Respostas da anamnese'], ['fotos', 'Fotos de evolução']];
    const PRAZOS = [['30d', '30 dias', '25/11/2026'], ['dez', 'Até 31/12', '31/12/2026'], ['vinc', 'Enquanto durar o vínculo', 'fim do vínculo']];
    const shs = {
      items: st.shares.map((s2, i) => ({ dado: s2.dado, meta: s2.com + ' · ' + s2.fim + ' · até ' + s2.ate, canRevoke: !s2.link, byLink: !!s2.link, revoke: () => set({ shares: st.shares.filter((_, j) => j !== i), shareReceipt: 'revogado', shareLast: s2.dado + ' · ' + s2.com }) })),
      canAdd: !st.shareAdding, adding: !!st.shareAdding, add: () => set({ shareAdding: true, shareReceipt: '' }), cancel: () => set({ shareAdding: false }),
      dados: DADOS.map(([kk, l]) => ({ label: l, on: String(st.shareDado === kk), cls: 'opt' + (st.shareDado === kk ? ' is-on' : ''), pick: () => set({ shareDado: kk }) })),
      prazos: PRAZOS.map(([kk, l]) => ({ label: l, on: String(st.sharePrazo === kk), cls: 'opt' + (st.sharePrazo === kk ? ' is-on' : ''), pick: () => set({ sharePrazo: kk }) })),
      fim: st.shareFim, setFim: (ev) => set({ shareFim: val(ev) }),
      confirm: () => { const d2 = DADOS.find(([kk]) => kk === st.shareDado), p2 = PRAZOS.find(([kk]) => kk === st.sharePrazo); set({ shares: st.shares.concat([{ dado: d2[1], com: 'Diego Moraes', fim: st.shareFim || 'Sem finalidade informada', ate: p2[2] }]), shareAdding: false, shareReceipt: 'concedido', shareLast: d2[1] + ' com Diego Moraes até ' + p2[2] }); },
      hasReceipt: !!st.shareReceipt, receiptT: st.shareReceipt === 'revogado' ? 'Compartilhamento revogado' : 'Compartilhamento concedido · recibo #S-' + (20 + st.shares.length),
      receiptS: st.shareReceipt === 'revogado' ? (st.shareLast || '') + ': o acesso termina na hora.' : (st.shareLast || '') + '. Você pode revogar quando quiser.'
    };

    const NROWS = studentRole
      ? [['msg', 'Mensagens', 'Do seu treinador'], ['treino', 'Treino do dia', 'Quando o treino for publicado'], ['contrat', 'Contratações e cobranças', 'Pagamento, renovação e recibos'], ['novidades', 'Novidades da 99Coach', 'Opcional · nunca é sobre seus dados']]
      : [['pedidos', 'Novos pedidos de acompanhamento', 'Quando alguém pede para treinar com você'], ['msg', 'Mensagens', 'De alunos e de quem visitou seu perfil'], ['contrat', 'Contratações e recebimentos', 'Vendas, repasses e falhas de pagamento'], ['assin', 'Sua assinatura 99Coach', 'Lembretes do teste e da renovação · e-mail obrigatório'], ['novidades', 'Novidades da 99Coach', 'Opcional']];
    const nt = {
      blocked: !!st.notifBlocked, simLabel: st.notifBlocked ? 'Simular push liberado' : 'Simular push bloqueado no aparelho', simBlock: () => set({ notifBlocked: !st.notifBlocked }),
      rows: NROWS.map(([kk, t, s2]) => { const n = st.notif[kk] || {}; const lockMail = kk === 'assin'; return {
        title: t, sub: s2, pushOn: String(!!n.p && !st.notifBlocked), pushCls: 'check onb-ck' + (n.p && !st.notifBlocked ? ' is-on' : '') + (st.notifBlocked ? ' is-off' : ''), mailOn: String(!!n.m || lockMail), mailCls: 'check onb-ck' + (n.m || lockMail ? ' is-on' : '') + (lockMail ? ' is-off' : ''),
        togglePush: () => { if (st.notifBlocked) return toast('Push bloqueado no aparelho. Libere nos Ajustes para ativar.'); set({ notif: Object.assign({}, st.notif, { [kk]: Object.assign({}, n, { p: !n.p }) }) }); },
        toggleMail: () => { if (lockMail) return toast('Lembretes da assinatura são obrigatórios: avisam antes de qualquer cobrança.'); set({ notif: Object.assign({}, st.notif, { [kk]: Object.assign({}, n, { m: !n.m }) }) }); } }; }),
      preview: 'Você tem uma atualização no 99Coach',
      save: () => toast('Preferências de notificação salvas às ' + now() + '.')
    };

    const CSEC = { idioma: ['ACC11', lt.title, 'Escolha o idioma das telas. País, moeda e idioma de atendimento são outra coisa.', 'type'], seguranca: ['ACC12', 'Segurança e sessões', 'Como você entra e onde sua conta está aberta.', 'lock'], privacidade: ['ACC13', 'Privacidade e dados', 'Finalidades, exportação, correção e exclusão, com recibo.', 'shield'], compartilhamento: ['ACC14', 'Compartilhamentos', 'Quais dados cada treinador pode ver, para quê e até quando.', 'share'], avisos: ['ACC15', 'Notificações', 'O que avisamos, por qual canal e o que aparece fora do app.', 'bell'] };
    const cs0 = CSEC[st.cta] || CSEC.idioma;
    const isCta = {}; Object.keys(CSEC).forEach((kk) => { isCta[kk] = st.cta === kk; });
    const cx = { is: isCta, code: cs0[0], title: cs0[1], sub: cs0[2] };
    const row = (kk, sub, stt) => ({ title: CSEC[kk][1], sub: sub, st: stt || '', ic: 'ic ic--sm i-' + CSEC[kk][3], go: goCta(kk) });
    const accRows = [row('idioma', { pt: 'Português', en: 'English', es: 'Español' }[st.lang] + ' · ' + ({ brasilia: 'Brasília', manaus: 'Manaus', acre: 'Rio Branco' }[st.tz]) + ' · ' + st.unit),
      row('seguranca', '2 etapas ' + (st.mfa ? 'ativa' : 'desligada') + ' · ' + live.length + (live.length === 1 ? ' aparelho' : ' aparelhos')),
      row('privacidade', 'Exportar, corrigir ou excluir', st.reqDelete ? 'Exclusão agendada' : (st.reqExport ? 'Exportação em preparo' : '')),
      row('avisos', st.notifBlocked ? 'Push bloqueado no aparelho' : 'Por categoria e canal')].concat(studentRole ? [row('compartilhamento', st.shares.length + (st.shares.length === 1 ? ' compartilhamento' : ' compartilhamentos'))] : []);
    const workRows = studentRole ? [] : [
      { title: 'Perfil e cadastro', sub: cad.progress + (st.published ? ' · publicado' : ' · rascunho'), st: '', ic: 'ic ic--sm i-user', go: go('cad') },
      { title: 'Receber pagamentos', sub: STAT.recebimentos[0], st: '', ic: 'ic ic--sm i-bank', go: goSec('recebimentos') },
      { title: 'Assinatura 99Coach e uso de IA', sub: STAT.plano[0], st: '', ic: 'ic ic--sm i-crown', go: goSec('plano') }
    ];
    const ct = {
      email: st.email, role: studentRole ? 'Aluna' : 'Treinador', hasPhoto: !studentRole && !!st.photoUrl, noPhoto: studentRole || !st.photoUrl, photo: st.photoUrl,
      groups: (workRows.length ? [{ title: 'Trabalho', items: workRows }] : []).concat([{ title: 'Conta e preferências', items: accRows }]),
      roleSwitchLabel: studentRole ? 'Também quero ser treinador' : 'Usar como aluno', roleSwitch: () => toast(studentRole ? 'Mesma conta, novo papel: abriria “Sou treinador” sem mudar seu acompanhamento.' : 'A troca de papel é sempre explícita e não mistura dados de alunos com os seus treinos.'),
      logout: () => (REALP && window.SIGN_OUT ? window.SIGN_OUT() : toast('Demonstração: sair encerra esta sessão e apaga o que é privado neste aparelho.'))
    };

    // ---------- casca e navegação ----------
    const authSteps = ['escolha', 'conta', 'codigo', 'confirmando', 'pronto', 'convite', 'conectado', 'prep'];
    const authShell = authSteps.indexOf(st.step) >= 0;
    const cvShell = st.step === 'dados';
    const student = st.step === 'alunoHoje' || ((st.step === 'acct' || st.step === 'cta') && st.flow === 'convite');
    const is = {};
    ['escolha', 'conta', 'codigo', 'confirmando', 'pronto', 'dados', 'convite', 'conectado', 'prep', 'hoje', 'cad', 'sec', 'pub', 'publicado', 'convidar', 'alunoHoje', 'acct', 'cta'].forEach((s) => { is[s] = st.step === s; });

    const STEPLBL = { escolha: '', conta: invite ? 'Convite' : '', codigo: 'Verificação', dados: 'Passo 3 de 3', prep: 'Preparação', convite: 'Convite', conectado: 'Convite aceito' };
    const leave = () => { if (NAV) NAV.back(); };
    const PREV = { conta: st.flow === 'aluno' ? 'escolha' : (invite ? 'convite' : ''), codigo: 'conta', dados: '', prep: 'conectado' };
    const back = () => { const pv = PREV[st.step]; if (pv) return go(pv)(); leave(); };

    const tSide = [
      { sec: 'Trabalho', items: [['Hoje', 'home', 'hoje'], ['Alunos', 'users', 'convidar'], ['Agenda', 'calendar', ''], ['Mensagens', 'message', '']] },
      { sec: 'Conteúdo', items: [['Rotinas', 'dumbbell', ''], ['Exercícios', 'list', ''], ['Formulários', 'clipboard', '']] },
      { sec: 'Negócio', items: [['Perfil e cadastro', 'user', 'cad'], ['Ofertas', 'tag', ''], ['Recebimentos', 'dollar', 'pay'], ['Assinatura e uso de IA', 'settings', 'plano']] },
      { sec: 'Você', items: [['Conta e preferências', 'user', 'acct']] }
    ];
    const sSide = [{ sec: 'Meu acompanhamento', items: [['Hoje', 'home', 'alunoHoje'], ['Treinos', 'dumbbell', ''], ['Evolução', 'trend', ''], ['Mensagens', 'message', ''], ['Conta', 'user', 'acct']] }];
    const ACTIVE = { hoje: 'hoje', convidar: 'convidar', cad: 'cad', sec: st.sec === 'recebimentos' ? 'pay' : (st.sec === 'plano' ? 'plano' : 'cad'), pub: 'cad', publicado: 'cad', alunoHoje: 'alunoHoje', acct: 'acct', cta: 'acct' };
    const SIDEGO = { pay: goSec('recebimentos'), plano: goSec('plano') };
    if (REALP) SIDEGO.convidar = () => window.GO('H04'); // conta real: 'Alunos' abre a lista de alunos de verdade
    // destinos que vivem nas áreas interativas (treinador e aluno): abrem as telas pelo ID do DS
    const AREA = student ? { 'Treinos': 'ALU06', 'Evolução': 'H10E', 'Mensagens': 'ALU05' }
      : { 'Agenda': 'TRE20', 'Mensagens': 'TRE25', 'Rotinas': 'H06', 'Exercícios': 'TRE10', 'Formulários': 'TRE04', 'Ofertas': 'TRE29', 'Conteúdo': 'H06' };
    const off = (l) => AREA[l] && window.GO ? () => window.GO(AREA[l]) : () => toast(l + ' ainda não está disponível.');
    const side = (student ? sSide : tSide).map((gp) => ({ sec: gp.sec, items: gp.items.map(([l, ic, to]) => { const on = !!to && ACTIVE[st.step] === to; return { label: l, ic: 'ic ic--sm i-' + ic, cls: 'v4-reset snav__it' + (on ? ' is-on' : ''), cur: on ? 'page' : 'false', go: to ? (SIDEGO[to] || go(to)) : off(l) }; }) }));
    const TT = student ? [['Hoje', 'home', 'alunoHoje'], ['Treinos', 'dumbbell', ''], ['Evolução', 'trend', ''], ['Mensagens', 'message', ''], ['Conta', 'user', 'acct']]
      : [['Hoje', 'home', 'hoje'], ['Alunos', 'users', 'convidar'], ['Conteúdo', 'dumbbell', ''], ['Mensagens', 'message', ''], ['Conta', 'user', 'acct']];
    const tabs = TT.map(([l, ic, to]) => { const on = !!to && ACTIVE[st.step] === to; return { label: l, ic: 'ic ic--sm i-' + ic, cls: 'v4-reset tabbar__it' + (on ? ' is-on' : ''), cur: on ? 'page' : 'false', go: to ? (SIDEGO[to] && to === 'convidar' ? SIDEGO[to] : go(to)) : off(l) }; });
    const MT = { hoje: 'Hoje', cad: 'Seu cadastro', sec: sx.title, pub: 'Publicar', publicado: 'Publicado', convidar: 'Convidar aluno', alunoHoje: 'Hoje', acct: 'Conta', cta: cx.title };
    const MB = { cad: 'hoje', sec: 'cad', pub: 'cad', publicado: 'hoje', convidar: 'hoje', cta: 'acct' };

    const hasArea = !!(window.ACCT && window.ACCT.area());
    const PR = login ? { title: 'Você entrou', sub: hasArea ? 'Pronto. Sua área está aberta.' : 'Pronto. Voltamos para onde você estava.', cta: hasArea ? 'Abrir minha área' : 'Continuar', go: hasArea ? () => window.ACCT.go() : leave, cta2: 'Ir para a página inicial', go2: () => NAV && NAV.go('home', {}, this) }
      : { title: 'Conta criada', sub: 'Pronto, ' + first + '. Agora você pode salvar treinadores, pedir acompanhamento e contratar. Preferências e anamnese só quando fizerem sentido.', cta: 'Buscar treinadores', go: () => NAV && NAV.go('esporte', {}, this), cta2: 'Voltar para onde eu estava', go2: leave };

    return {
      rootCls: 'w v4 onb' + (authShell ? ' onb--auth' : (cvShell ? ' onb--cv' : ' onb--app')) + (['sec', 'cta', 'pub', 'convidar'].indexOf(st.step) >= 0 ? ' onb--form' : ''), skip: () => { try { const el = document.getElementById('conteudo'); if (el) { el.setAttribute('tabindex', '-1'); el.focus(); } } catch (_) {} },
      reset: () => { set(this.base(st.flow, st.scn)); top(); }, flows, scens,
      authShell, cvShell, appShell: !authShell && !cvShell, is, stepLabel: STEPLBL[st.step] || '', back, backLabel: 'Voltar',
      goHome: () => NAV && NAV.go('home', {}, this), goLogin: () => { set(this.base('entrar', '')); top(); },
      intents, intentErr: st.intentErr, continueIntent, conta, f, c, d, k, g, pb, h, iv, cv, p, a, inv, stu, cad, sx, b, ph, ap, at, sv, pg, av, pay, pro,
      pronto: PR,
      goHoje: go('hoje'), goCad: go('cad'), viewProfile: () => { if (st.pubSlug) { location.href = '/treinador/' + encodeURIComponent(st.pubSlug); return; } NAV && NAV.go('perfil', { id: 'thiago' }, this); }, goPub: go('pub'), goPublicado: go('publicado'), goConvidar: goInvite, goConta: go('acct'), ct, cx, lg, sg, pv, sh: shs, nt, goPrep: go('prep', { prepQ: 0 }),
      prepLater: () => { set({ step: 'alunoHoje', toast: 'Tudo bem. A preparação fica salva em Hoje.' }); top(); },
      copy: () => { if (st.pubSlug) { try { navigator.clipboard.writeText(location.origin + '/treinador/' + st.pubSlug).catch(() => {}); } catch (_) {} return toast('Link do perfil copiado.'); } toast('Copiado. (Demonstração: a área de transferência pode estar bloqueada nesta janela.)'); },
      msg: () => (window.GO ? window.GO(student ? 'ALU05' : 'TRE25') : toast('Mensagens ainda não estão disponíveis.')),
      me: student ? { ini: stu.ini, name: stuName, role: 'Aluna · ' + inv.svc } : { ini: ini, name: st.name, role: 'Treinador · ' + (cityShort || 'sem cidade'), photo: st.photoUrl },
      navLabel: student ? 'Navegação do aluno' : 'Navegação do treinador', side, tabs,
      mtop: { title: MT[st.step] || '', hasBack: !!MB[st.step], noBack: !MB[st.step], back: MB[st.step] ? go(MB[st.step]) : null },
      toastOn: !!st.toast, toastMsg: st.toast, closeToast: () => set({ toast: '' })
    };
  }
}

return Component; })(), frag: document.getElementById('tpl-onboarding').content, css: document.getElementById('css-onboarding') };
