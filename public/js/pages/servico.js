PAGES.servico = { Comp: (function () {

class Component extends DCLogic {
  static img(id) { return window.__IMG[id] || ''; }

  constructor(props) { super(props); const p = props || {}; this.state = this.base(p.scn || 'comparando'); if (p.offer) this.state.offer = p.offer; }

  base(scn) {
    const S = { comparando: {}, sessao: { offer: 'sessao' }, programa: { offer: 'base' }, pedido: { req: 'enviado', user: 'voce' }, aluna: { user: 'ana' } };
    return Object.assign({ scn: scn, y: 160, ty: 160, offer: 'online', sheet: null, after: null, user: null, req: null, pay: 'Pix', copied: false, topic: 'servico', faq: 0, js: 0, mt: 'Visão geral', fav: false, favNote: false, bought: null, slot: null }, S[scn] || {});
  }

  renderVals() {
    const st = this.state;
    const set = (o) => this.setState(o);
    const B = (id) => Component.img(id);
    const yOf = (e) => { try { const el = e && (e.currentTarget || e.target); if (!el || !el.getBoundingClientRect) return st.y; const r = el.getBoundingClientRect(); return Math.max(12, Math.round(r.top + (window.scrollY || window.pageYOffset || 0) - 24)); } catch (_) { return st.y; } };
    const pageScroll = () => { try { return document.documentElement.scrollHeight > window.innerHeight + 40; } catch (_) { return false; } };
    const goSec = (id) => { try { if (pageScroll()) { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } } catch (_) {} };
    const open = (sheet, extra) => (e) => set(Object.assign({ sheet: sheet, y: yOf(e) }, extra || {}));
    const close = () => set({ sheet: null });
    const OF = {
      sessao: { id: 'sessao', title: 'Sessão presencial', kind: 'Sessão avulsa', inc: '60 min de treino individual em Londrina', meta: 'Uma sessão · local combinado com o Rafael', price: 'R$ 80', unit: '/ sessão', label: 'R$ 80 / sessão', flow: 'contratar', cta: 'Contratar sessão presencial', short: 'Contratar', total: 'R$ 80,00', next: 'Não renova', cycle: 'Por sessão', access: 'Use em até 30 dias', list: ['60 min de treino individual', 'Londrina · local combinado', 'Não renova'], fine: 'Você revisa o total antes de pagar. Pix ou cartão.' },
      online: { id: 'online', title: 'Acompanhamento online', kind: 'Recorrente mensal', inc: 'Treino semanal no app, ajuste a cada 15 dias e mensagens', meta: 'Mensal · cancela quando quiser · sujeito a aceite do Rafael', price: 'R$ 200', unit: '/ mês', label: 'R$ 200 / mês', flow: 'pedido', cta: 'Solicitar acompanhamento', short: 'Solicitar', total: 'R$ 0,00 hoje', next: 'R$ 200,00 por mês, só depois do aceite', cycle: 'Mensal · cancela quando quiser', access: 'Enquanto a assinatura estiver ativa', list: ['Treino semanal no app', 'Ajuste a cada 15 dias', 'Mensagens com o Rafael', 'Mensal · cancela quando quiser'], fine: 'Pedido não é vínculo: nada é cobrado até o Rafael aceitar.' },
      dois: { id: 'dois', title: 'Treino presencial 2x por semana', kind: 'Recorrente mensal', inc: '8 sessões por mês em Londrina', meta: 'Mensal · horários fixos combinados · sujeito a aceite', price: 'R$ 520', unit: '/ mês', label: 'R$ 520 / mês', flow: 'pedido', cta: 'Solicitar treino 2x por semana', short: 'Solicitar', total: 'R$ 0,00 hoje', next: 'R$ 520,00 por mês, só depois do aceite', cycle: 'Mensal · cancela quando quiser', access: '8 sessões por mês', list: ['8 sessões por mês (2x por semana)', 'Londrina · horários fixos', 'Mensal · cancela quando quiser'], fine: 'Pedido não é vínculo: nada é cobrado até o Rafael aceitar.' },
      avaliacao: { id: 'avaliacao', title: 'Avaliação física', kind: 'Sob consulta', inc: 'Composição corporal e avaliação de movimento', meta: 'Condição declarada pelo treinador: o valor depende do local e dos testes', price: '', unitNone: 'Sob consulta', label: 'Sob consulta', flow: 'consulta', cta: 'Consultar condições', short: 'Consultar', list: ['Composição corporal e movimento', 'Valor combinado antes de marcar'], fine: 'Mensagem não é contratação.' },
      base: { id: 'base', prog: true, title: 'CrossFit Base', kind: 'Programa', inc: '12 semanas de programação · 36 treinos', facts: ['12 semanas de programação', '36 treinos', '12 meses de acesso', 'Sem acompanhamento individual'], img: '4f287f956509500f4c89225daef9c5c5', price: 'R$ 197', unit: 'pagamento único', label: 'R$ 197 · pagamento único', flow: 'contratar', cta: 'Comprar programa', short: 'Comprar', total: 'R$ 197,00', next: 'Não renova', cycle: 'Pagamento único', access: '12 meses de acesso (até 26/10/2027)', list: ['12 semanas de programação · 36 treinos', '12 meses de acesso', 'Sem acompanhamento individual'], fine: 'Compra de conteúdo; não inclui acompanhamento individual.' },
      g_sessao: { id: 'g_sessao', title: 'Treino presencial 2x por semana', kind: 'Recorrente mensal', inc: '8 sessões de 60 min por mês em Londrina', meta: 'Mensal · Gleba Palhano', price: 'R$ 480', unit: '/ mês', label: 'R$ 480 / mês' },
      c_aula: { id: 'c_aula', title: 'Aula presencial em grupo', kind: 'Aula avulsa', inc: '60 min em grupo de até 6 pessoas', meta: 'Uma aula · Zona Sul', price: 'R$ 60', unit: '/ aula', label: 'R$ 60 / aula' },
      c_online: { id: 'c_online', title: 'Planilha mensal com ajustes', kind: 'Recorrente mensal', inc: 'Planilha semanal no app e ajuste a cada 15 dias', meta: 'Mensal', price: 'R$ 150', unit: '/ mês', label: 'R$ 150 / mês' },
    };
    const USERS = { ana: { name: 'Ana Ribeiro', dest: 'Meu acompanhamento', photo: '', ini: 'AR' }, rafael: { name: 'Rafael Lima', dest: 'Meu painel', photo: B('bdc7ef1c8dbf05558c3bf8d575fc3a04'), ini: '' }, voce: { name: 'Sua conta', dest: 'Sua conta', photo: '', ini: 'VC' } };
    const x = { id: 'rafael', name: 'Rafael Lima', first: 'Rafael', role: 'Treinador de CrossFit e Musculação' };
    const t = { hasPhoto: true, noPhoto: false, photo: B('bdc7ef1c8dbf05558c3bf8d575fc3a04'), ini: 'RL' };
    const U = st.user ? USERS[st.user] : null;
    const o = OF[st.offer] || OF.online;
    const btn = (label, go, k) => ({ label: label, go: go, cls: 'btn btn--block btn--lg v4-wrapbtn ' + (k === 2 ? 'btn--outline' : k === 3 ? 'btn--ghost' : k === 4 ? 'btn--brand' : 'btn--primary') });
    const logged = !!st.user;
    const login = (after) => () => set({ sheet: 'entrar', after: after });
    const so = o && o.flow === 'contratar' ? o : OF.sessao;   // pagamento: oferta apta (sessão ou programa)
    const sp = o && o.flow === 'pedido' ? o : OF.online;     // pedido sujeito a aceite
    const choice = st.after === 'pedido' ? sp.title + ' · ' + sp.label : st.after === 'resumo' ? so.title + ' · ' + so.label : (o ? o.title + ' · ' + o.label : '');
    const SH = {};

    SH.resumo = () => {
      const rows = [['Serviço', so.title + ' · Rafael Lima'], ['Entrega', so.inc], ['Preço', so.label], ['Ciclo', so.cycle], ['Acesso', so.access]];
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
      const r = { title: sp.id === 'dois' ? 'Solicitar treino 2x por semana' : 'Solicitar acompanhamento', rows: [['Serviço', sp.title + ' · Rafael Lima'], ['Inclui', sp.inc], ['Preço', sp.label], ['Hoje', 'Nada é cobrado'], ['Depois do aceite', 'Você revisa o resumo e paga a primeira mensalidade'], ['Resposta até', '28/10/2026']], text: ['Mensagem para o Rafael (opcional)', 'Oi, Rafael! Quero começar no CrossFit. Treino três vezes por semana, à noite.'], fine: 'Pedido não é vínculo: o acompanhamento só começa se o Rafael aceitar.' };
      r.btns = logged ? [btn('Enviar pedido', () => set({ sheet: 'pedidoOk', req: 'enviado' })), btn('Voltar', close, 3)] : [btn('Entrar para enviar o pedido', login('pedido')), btn('Voltar', close, 3)];
      if (!logged) r.tone = ['info', 'i-lock', 'Sua escolha fica salva', 'Para enviar o pedido, entre ou crie uma conta mínima. Você volta para cá.'];
      return r;
    };
    SH.pedidoOk = () => ({ title: 'Pedido enviado', tone: ['wait', 'i-clock', 'Pedido enviado · aguardando resposta do Rafael até 28/10', 'Nada foi cobrado. Você recebe um aviso quando ele responder.'], rows: [['Serviço', sp.title + ' · ' + sp.label], ['Enviado', '26/10/2026 às 14:02']], lines: ['Se o Rafael aceitar, você revisa o resumo e paga a primeira mensalidade. Se ele não responder até 28/10, o pedido expira sem cobrança.'], btns: [btn('Fechar', close), btn('Cancelar pedido', open('cancelado', { req: null }), 3)] });
    SH.acomp = () => ({ title: 'Seu pedido', tone: ['wait', 'i-clock', 'Aguardando resposta do Rafael até 28/10', 'Enviado em 26/10/2026 às 14:02.'], rows: [['Serviço', 'Acompanhamento online · R$ 200 / mês'], ['Cobrança', 'Só depois do aceite'], ['Se não houver resposta', 'O pedido expira em 28/10, sem cobrança']], btns: [btn('Enviar mensagem ao Rafael', open('msg', { topic: 'pedido' }), 2), btn('Cancelar pedido', open('cancelado', { req: null }), 3)] });
    SH.cancelado = () => ({ title: 'Pedido cancelado', tone: ['info', 'i-check', 'Pedido cancelado', 'Nada foi cobrado.'], btns: [btn('Desfazer', () => set({ req: 'enviado', sheet: 'acomp' }), 2), btn('Fechar', close)] });
    SH.msg = () => {
      const V = { disp: ['Mensagem para Carolina', 'Oi, Carolina! Você está aceitando novos alunos para as aulas em grupo?'], cond: ['Mensagem para Rafael', 'Oi, Rafael! Quais são as condições e o valor da avaliação física?'], pedido: ['Mensagem para Rafael', 'Oi, Rafael! Enviei o pedido de acompanhamento online. Fico no aguardo.'], servico: ['Mensagem para Rafael', 'Oi, Rafael! Tenho dúvidas sobre as opções antes de contratar.'], geral: ['Mensagem para ' + x.first, 'Oi, ' + x.first + '! Quando você vai publicar os serviços?'] }[st.topic] || ['Mensagem', ''];
      return { title: V[0], lines: ['Mensagem não é contratação. A resposta chega em Mensagens.'], text: ['Sua mensagem', V[1]], btns: logged ? [btn('Enviar mensagem', open('msgOk')), btn('Voltar', close, 3)] : [btn('Entrar para enviar', login('msg')), btn('Voltar', close, 3)], tone: logged ? null : ['info', 'i-lock', 'Sua mensagem fica salva', 'Para enviar, entre ou crie uma conta mínima.'] };
    };
    SH.msgOk = () => ({ title: 'Mensagem enviada', tone: ['ok', 'i-check', 'Mensagem enviada', 'Você recebe um aviso quando ' + x.first + ' responder. Nada foi contratado.'], btns: [btn('Fechar', close)] });
    SH.saved = () => st.fav ? ({ title: 'Salvos', results: [{ name: x.name, line: x.role, btn: 'Remover', open: () => set({ fav: false, favNote: false }) }], btns: [btn('Fechar', close)] }) : ({ title: 'Salvos', lines: ['Nenhum perfil salvo ainda. Use “Salvar” no perfil para guardar aqui.'], btns: [btn('Fechar', close)] });
    SH.pro = () => ({ title: 'Sou treinador', rows: [['Essencial', 'Grátis · até 3 alunos ativos'], ['Pro', 'R$ 99/mês ou R$ 990/ano · até 50 alunos · 6.000 créditos/mês'], ['Teste', '7 dias e 750 créditos, só se você ativar'], ['Comissão', '5% por venda']], lines: ['O Pro não compra posição, selo nem garantia de clientes.'], btns: [btn('Criar meu perfil', () => window.NAV.go('onboarding', { flow: 'treinador' }, this))] });
    SH.proOk = () => ({ title: 'Criar meu perfil', tone: ['info', 'i-info', 'Este percurso fica no cadastro profissional', 'Neste protótipo, o cadastro e o painel estão em outros boards. Nada foi criado.'], btns: [btn('Fechar', close)] });
    SH.acct = () => ({ title: U ? U.name : 'Conta', rows: [['Destino', U ? U.dest : '']], btns: [btn('Sair da conta', () => set({ user: null, sheet: null, preview: false }), 2)] });
    SH.ajuda = () => ({ title: 'Ajuda', lines: ['Um perfil fica indisponível quando o profissional o retira ou quando é removido por descumprir as regras. O conteúdo anterior não fica acessível.', 'Dúvidas sobre pagamentos, reembolsos e privacidade ficam na Central de ajuda.'], btns: [btn('Fechar', close)], fine: 'Demonstração: a Central de ajuda é outro destino, fora deste board.' });
    SH.inbox = () => st.user ? ({ title: 'Mensagens', lines: [st.user === 'ana' ? 'Rafael Lima · ontem: “Treino A ajustado para terça. Qualquer dor, me avise.”' : 'Nenhuma conversa ainda. As conversas com treinadores aparecem aqui.'], btns: [btn('Fechar', close)] }) : ({ title: 'Mensagens', tone: ['info', 'i-lock', 'Entre para ver suas mensagens', 'As conversas com treinadores ficam na sua conta.'], btns: [btn('Entrar', () => set({ sheet: 'entrar', after: null }))] });
    SH.menu = () => ({ title: 'Menu', menu: [['Treinadores', 'users', () => window.NAV.toSearch(this)], ['Esportes', 'activity', () => window.NAV.toSearch(this)], ['Programas', 'book', () => window.NAV.toSearch(this)], ['Salvos', 'heart', open('saved')], ['Mensagens', 'message', open('inbox')], ['Sou treinador', 'user', open('pro')]].map(([l, i, g]) => ({ label: l, ic: 'ic ic--sm i-' + i, go: g })), fine: 'Português (Brasil) · R$' });
    SH.nav = () => ({ title: 'Voltar para a busca', chips: ['CrossFit', 'Londrina', 'Presencial'], lines: ['Filtros preservados. Ordenação: relevância (padrão).'], btns: [btn('Fechar', close)], fine: 'Passagem anotada: a busca é a página Esporte, outro board deste protótipo.' });
    SH.perfil = () => ({ title: 'Perfil de Rafael Lima', rows: [['Titularidade', 'Confirmada em 24/09/2026'], ['CREF', '012345-G/PR · verificado · válido até 12/2027'], ['Avaliações', '4,9 · 23 de alunos com contratação concluída'], ['Disponibilidade', 'Aceita novos alunos · informado em 20/10'], ['Programa', 'CrossFit Base · R$ 197 · pagamento único']], btns: [btn('Fechar', close)], fine: 'Passagem anotada: o perfil completo é o board Perfil VFINAL; a escolha feita aqui fica salva.' });
    SH.home = () => ({ title: 'Página inicial', lines: ['Abriria a Home canônica. A busca CrossFit · Londrina · presencial vai junto.'], btns: [btn('Fechar', close)], fine: 'Passagem anotada: o canvas não navega entre pranchas.' });
    SH.vinc = () => ({ title: 'Meu acompanhamento', tone: ['ok', 'i-check', 'Acompanhamento online com Rafael Lima · ativo', 'Desde 02/09/2026 · semana 8.'], rows: [['Próximo treino', 'ter 28/10 · Treino A, força'], ['Próxima cobrança', '02/11/2026 · R$ 200,00']], btns: [btn('Fechar', close)] });
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


    // ---------- as 4 ofertas desta página: mesmas entregas, preço e ciclo do perfil ----------
    const EX = {
      sessao: { big: 'Sessão presencial de CrossFit e Musculação', kindLine: 'Sessão avulsa · contratação direta · Londrina', cover: '4668933ec61ec0207dd2b4c1f6a7ef8d', coverAlt: 'Agachamento com barra em academia',
        about: 'Uma sessão individual de 60 minutos em Londrina para avaliar e corrigir técnica, com um plano para você seguir treinando sozinho.',
        facts: [['Nível', 'Iniciante a intermediário'], ['Foco', 'Técnica de agachamento, levantamento terra e LPO'], ['Formato', 'Presencial · Londrina, local combinado'], ['Duração', '60 min · não renova']],
        yes: ['60 min de treino individual', 'Correção de técnica e plano para treinar sozinho', 'Londrina · local combinado'], no: ['Treino semanal no app', 'Mensagens entre as sessões', 'Plano alimentar ou nutrição'],
        steps: [['hoje', 'Você revisa o resumo e paga R$ 80,00', 'Pix ou cartão. Demonstração: nenhuma cobrança real.'], ['depois do pagamento', 'Você combina o horário com o Rafael', 'Em Mensagens. Horário exibido não é reserva até a confirmação.'], ['no dia', 'Sessão de 60 min em Londrina', 'No local combinado com o Rafael.']] },
      online: { big: 'Acompanhamento online de CrossFit e Musculação', kindLine: 'Recorrente mensal · sujeito a aceite · online', cover: '4f287f956509500f4c89225daef9c5c5', coverAlt: 'Box de CrossFit com argolas e kettlebells',
        about: 'O treino da semana chega no app, você registra cargas e tempos e o Rafael ajusta a cada 15 dias. Dúvidas por mensagem, dentro da 99Coach.',
        facts: [['Nível', 'Iniciante a intermediário'], ['Foco', 'Força, condicionamento e técnica de CrossFit'], ['Formato', 'Online · treino no app da 99Coach'], ['Ciclo', 'Mensal · cancela quando quiser']],
        yes: OF.online.list, no: ['Aulas presenciais (contrate a sessão avulsa)', 'Plano alimentar ou nutrição', 'Diagnóstico ou tratamento de lesões'],
        steps: [['hoje', 'Você envia o pedido', 'Nada é cobrado. Conte seu objetivo e sua rotina.'], ['até 28/10', 'O Rafael aceita ou recusa', 'Sem resposta até o prazo, o pedido expira sem cobrança.'], ['depois do aceite', 'Você revisa o resumo e paga a primeira mensalidade', 'R$ 200,00 por mês, Pix ou cartão. Cancele a renovação quando quiser.'], ['toda semana', 'Treino no app, ajuste a cada 15 dias', 'Você registra os treinos; o Rafael ajusta e responde por mensagem.']] },
      dois: { big: 'Treino presencial 2x por semana em Londrina', kindLine: 'Recorrente mensal · sujeito a aceite · Londrina', cover: 'c8d005a48d00045a2dda46182cbf5291', coverAlt: 'Levantamento terra com kettlebell',
        about: 'Duas sessões presenciais por semana em Londrina, em horários fixos combinados no aceite. 8 sessões por mês.',
        facts: [['Nível', 'Iniciante a intermediário'], ['Foco', 'Força e técnica com acompanhamento presencial'], ['Formato', 'Presencial · Centro e Zona Sul de Londrina'], ['Ciclo', 'Mensal · cancela quando quiser']],
        yes: OF.dois.list, no: ['Treino online no app entre as sessões', 'Plano alimentar ou nutrição'],
        steps: [['hoje', 'Você envia o pedido com seus horários', 'Nada é cobrado.'], ['até 28/10', 'O Rafael confirma os horários ou recusa', 'Sem resposta até o prazo, o pedido expira sem cobrança.'], ['depois do aceite', 'Você revisa o resumo e paga a primeira mensalidade', 'R$ 520,00 por mês, Pix ou cartão.'], ['toda semana', '2 sessões presenciais', '8 sessões por mês nos horários combinados.']] },
      base: { big: 'Programa CrossFit Base', kindLine: 'Programa · compra única · online', cover: '4f287f956509500f4c89225daef9c5c5', coverAlt: 'Box de CrossFit com argolas e kettlebells',
        about: '12 semanas de programação pronta para quem está começando no CrossFit: 3 treinos por semana no app, no seu ritmo. Sem ajuste individual.',
        facts: [['Nível', 'Iniciante'], ['Foco', 'Base de movimentos do CrossFit'], ['Formato', 'Online · treinos prontos no app'], ['Acesso', '12 meses · não renova']],
        yes: OF.base.list, no: ['Ajuste individual do treino', 'Mensagens com o Rafael'],
        steps: [['hoje', 'Você revisa o resumo e paga R$ 197,00', 'Pagamento único, Pix ou cartão. Demonstração: nenhuma cobrança real.'], ['em alguns minutos', 'O programa aparece em Meus programas', 'Acesso por 12 meses, até 26/10/2027.'], ['por 12 semanas', '3 treinos por semana no app', 'No seu ritmo; sem ajuste individual.']] }
    };
    const ids = ['online', 'dois', 'sessao', 'base'];
    const PK = { sessao: '60 min · Londrina · local combinado', online: 'Treino semanal no app · ajuste a cada 15 dias', dois: '8 sessões por mês · horários fixos', base: 'Programa · 12 semanas · acesso por 12 meses' };
    const e = EX[o.id] || EX.online;
    const sel = Object.assign({}, e, { cover: B(e.cover), facts: e.facts.map((f) => ({ k: f[0], v: f[1] })), steps: e.steps.map((s, k) => ({ n: String(k + 1), when: s[0], t: s[1], d: s[2] })) });
    const picker = ids.map((id) => { const y = OF[id]; const on = o.id === id; const mine = st.user === 'ana' && id === 'online'; const got = st.bought === id; return { title: y.title, label: y.label, sub: mine ? 'Seu acompanhamento · ativo' : got ? 'Comprado · acesso em preparação' : PK[id], on: String(on), rowCls: 'vf-pick' + (on ? ' is-on' : ''), pick: () => set({ offer: id }) }; });
    const RV = { 'Formato': ['Online', 'Presencial', 'Presencial', 'Online · no seu ritmo'], 'Entrega': ['Treino semanal no app', '8 sessões por mês', '60 min individual', '36 treinos em 12 semanas'], 'Ajustes': ['A cada 15 dias', 'Nas sessões', 'Na sessão', 'Não tem'], 'Mensagens': ['Sim, com o Rafael', 'Para combinar horários', 'Para combinar horário', 'Não inclui'], 'Como começa': ['Pedido sujeito a aceite', 'Pedido sujeito a aceite', 'Contratação direta', 'Compra direta'], 'Cobrança': ['R$ 200 por mês', 'R$ 520 por mês', 'R$ 80 por sessão', 'R$ 197 pagamento único'], 'Renovação': ['Mensal · cancela quando quiser', 'Mensal · cancela quando quiser', 'Não renova', 'Não renova · 12 meses de acesso'] };
    const hl = (i) => ids[i] === o.id ? 'is-hl' : '';
    const cols = ids.map((id, i) => ({ label: OF[id].label, title: OF[id].title, cls: hl(i) }));
    const rows = Object.keys(RV).map((k) => ({ k: k, cells: RV[k].map((v, i) => ({ v: v, cls: hl(i) })) }));
    const optCards = ids.map((id, i) => { const on = id === o.id; return { title: OF[id].title, label: OF[id].label, cls: 'plan' + (on ? ' plan--pop' : ''), rows: Object.keys(RV).map((k) => ({ k: k, v: RV[k][i] })), on: String(on), btn: on ? 'Escolhida' : 'Escolher esta oferta', btnCls: 'btn btn--sm ' + (on ? 'btn--primary' : 'btn--outline'), pick: () => set({ offer: id }) }; });

    let A;
    if (st.bought === o.id) A = { title: o.title, line: 'Pagamento confirmado', sub: 'Estamos preparando seu acesso. O recibo foi enviado por e-mail.', label: 'Enviar mensagem ao Rafael', short: 'Mensagem', go: open('msg', { topic: 'servico' }) };
    else if (st.user === 'ana' && o.id === 'online') A = { title: 'Acompanhamento online', line: 'Ativo desde 02/09/2026', sub: 'Próxima cobrança em 02/11/2026 · R$ 200,00. Outras compras ficam separadas do acompanhamento.', label: 'Abrir acompanhamento', short: 'Abrir', go: open('vinc') };
    else if (st.req === 'enviado' && o.flow === 'pedido') A = { title: 'Pedido enviado', line: 'Aguardando resposta do Rafael até 28/10', sub: o.title + ' · ' + o.label + '. Nada foi cobrado; a cobrança só começa depois do aceite.', label: 'Acompanhar pedido', short: 'Acompanhar', go: open('acomp') };
    else A = { title: o.title, price: o.price, unit: o.unit, line: o.label, sub: o.inc, label: o.cta, short: o.short, fine: st.user === 'ana' ? 'Compra separada do seu acompanhamento online.' : o.fine, go: open(o.flow === 'pedido' ? 'pedido' : 'resumo') };
    const conv = A.label === o.cta && o.flow === 'contratar';
    A.btnCls = 'btn btn--lg btn--block btn--arrow v4-wrapbtn ' + (conv ? 'btn--brand' : 'btn--primary');
    A.barCls = 'btn btn--arrow v4-wrapbtn ' + (conv ? 'btn--brand' : 'btn--white');
    A.barLine = A.price ? A.price + ' ' + A.unit : A.line;
    A.hasPrice = !!A.price; A.noPrice = !A.price; A.hasAction = true; A.isAnchor = false; A.hasFine = !!A.fine;
    const sum = (o.flow === 'pedido' ? [['Total hoje', 'R$ 0,00 · nada é cobrado'], ['Depois do aceite', o.next.replace(', só depois do aceite', '')], ['Forma', 'Pix ou cartão']] : [['Total hoje', o.total], ['Próxima cobrança', o.next], ['Forma', 'Pix ou cartão']]).map((r) => ({ k: r[0], v: r[1] }));
    const barOn = !st.sheet;

    // avaliações: só de quem contratou esta oferta (fixtures do Rafael)
    const RVW = [['Marina C.', 'online', 'Acompanhamento online · set/2026', 5, 'Comecei sem saber agachar direito. Os ajustes a cada 15 dias fizeram diferença e ele responde rápido.'], ['Paulo S.', 'sessao', 'Sessão presencial · ago/2026', 5, 'Sessão objetiva: corrigiu minha técnica no levantamento terra e deixou um plano para treinar sozinho.'], ['Lívia R.', 'online', 'Acompanhamento online · jul/2026', 4, 'Gostei do acompanhamento. Queria mais opções de treino curto para dias corridos.'], ['André M.', 'dois', 'Treino presencial 2x por semana · jun/2026', 5, 'Pontual e atento à minha lesão antiga no ombro; pediu liberação médica antes de aumentar a carga.'], ['Juliana F.', 'online', 'Acompanhamento online · mai/2026', 5, 'Programação clara no app e ajustes bem explicados.']];
    const reviews = RVW.filter((r) => r[1] === o.id).map((r) => ({ who: r[0], what: r[2], n: r[3], text: r[4], ini: r[0].charAt(0), stars: [1, 2, 3, 4, 5].map((k) => k <= r[3] ? '' : 'color: var(--concrete-2)') }));
    const FQ = [['O pedido já garante o acompanhamento?', 'Não. O acompanhamento começa só se o Rafael aceitar. Até lá nada é cobrado.'], ['Quando sou cobrado?', 'Na sessão avulsa e no programa, ao confirmar o resumo. Nos mensais, depois do aceite, quando você confirma o resumo com o total e a data da próxima cobrança.'], ['Como cancelo a renovação?', 'Em Conta › Contratações, quando quiser. O acesso segue até o fim do período pago.'], ['Quais formas de pagamento?', 'Pix ou cartão, pela 99Coach.'], ['E se o Pix demorar a confirmar?', 'Não pague de novo. Mostramos “Ainda não recebemos a confirmação” e avisamos por e-mail quando o banco confirmar.']];
    const faqs = FQ.map(([q, a], k) => { const on = st.faq === k; return { q: q, a: a, open: on, exp: String(on), rot: on ? 'transform: rotate(180deg)' : '', toggle: () => set({ faq: on ? -1 : k }) }; });

    const SCN = [['comparando', 'Visitante · padrão'], ['sessao', 'Sessão escolhida'], ['programa', 'Programa escolhido'], ['pedido', 'Pedido já enviado'], ['aluna', 'Aluna com acompanhamento']];
    const scnChips = SCN.map(([id, l]) => ({ label: l, on: String(st.scn === id), cls: 'chip' + (st.scn === id ? ' is-on' : ''), pick: () => set(this.base(id)) }));
    const go = (scn, extra) => (ev) => set(Object.assign(this.base(scn), extra, { y: yOf(ev) }));
    const FLOW = [['Resumo da sessão', go('sessao', { sheet: 'resumo' })], ['Entrar preservando a escolha', go('sessao', { sheet: 'entrar', after: 'resumo' })], ['Pix pendente', go('sessao', { user: 'voce', sheet: 'pix' })], ['Resultado desconhecido', go('sessao', { user: 'voce', sheet: 'incerto' })], ['Pagamento confirmado', go('sessao', { user: 'voce', sheet: 'pago' })], ['Comprar programa', go('programa', { sheet: 'resumo' })], ['Solicitar acompanhamento', go('comparando', { sheet: 'pedido' })], ['Pedido enviado', go('comparando', { user: 'voce', req: 'enviado', sheet: 'pedidoOk' })], ['Menu do celular', go('comparando', { sheet: 'menu' })]];
    const flowChips = FLOW.map(([l, f]) => ({ label: l, pick: f }));
    const pcOn = o.id === 'base';

    // ---------- celular: detalhes 2×2, chips, oferta em linhas, jornada sanfonada, CTA de app ----------
    const DET = {
      online: [['calendar', 'Mensal', 'Ciclo'], ['dumbbell', 'Semanal', 'Treino novo no app'], ['monitor', 'Online', 'Formato'], ['refresh', 'Quando quiser', 'Cancelamento']],
      dois: [['calendar', 'Mensal', 'Ciclo'], ['dumbbell', '2x por semana', '8 sessões por mês'], ['pin', 'Presencial', 'Centro e Zona Sul'], ['refresh', 'Quando quiser', 'Cancelamento']],
      sessao: [['clock', '60 min', 'Duração'], ['dumbbell', '1 sessão', 'Avulsa'], ['pin', 'Presencial', 'Londrina'], ['refresh', 'Não renova', 'Renovação']],
      base: [['calendar', '12 semanas', 'Programação'], ['dumbbell', '36 treinos', '3 por semana'], ['monitor', 'Online', 'No seu ritmo'], ['lock', '12 meses', 'Acesso']]
    };
    const det = (DET[o.id] || DET.online).map(([ic, v, l]) => ({ ic: 'ic ic--sm i-' + ic, v: v, l: l }));
    const CH = { online: ['Recorrente mensal', 'Online', 'Sujeito a aceite'], dois: ['Recorrente mensal', 'Presencial', 'Sujeito a aceite'], sessao: ['Sessão avulsa', 'Presencial', 'Contratação direta'], base: ['Programa', 'Online', 'Compra única'] };
    const chipsM = (CH[o.id] || CH.online).map((c, k) => ({ t: c, cls: 'badge v4-bw ' + (k === 2 ? (o.flow === 'pedido' ? 'badge--info' : 'badge--ok') : 'badge--plain') }));
    const pickerM = picker.map((m) => Object.assign({}, m, { mCls: 'vfs-row' + (m.on === 'true' ? ' is-on' : ''), rCls: 'radio' + (m.on === 'true' ? ' is-on' : '') }));
    const jsteps = sel.steps.map((s, k) => ({ n: s.n, when: s.when, t: s.t, d: s.d, open: st.js === k, exp: String(st.js === k), rot: st.js === k ? 'transform: rotate(180deg)' : '', toggle: () => set({ js: st.js === k ? -1 : k }) }));
    const mtabs = [['Visão geral', 'visao'], ['Serviços', 'comparar'], ['Treinador', 'treinador'], ['Avaliações', 'avaliacoes'], ['Dúvidas', 'perguntas']].map(([l, id]) => ({ label: l, cls: 'utab' + (st.mt === l ? ' is-on' : ''), cur: st.mt === l ? 'true' : 'false', pick: () => { set({ mt: l }); goSec(id); } }));
    const mbarLabel = A.label + (A.price ? ' · ' + A.price + ' ' + A.unit : '');
    const mbarCls = 'btn btn--lg btn--block btn--arrow vfs-mcta ' + (conv ? 'btn--brand' : 'btn--primary');
    return {
      rootCls: 'w v4 vfp vfs' + (barOn ? ' v4-has-bar' : '') + (raw ? ' has-sheet' : ''), scnChips, flowChips, reset: () => set(this.base(st.scn)),
      skip: () => { try { const el = document.getElementById('conteudo'); if (el) { el.setAttribute('tabindex', '-1'); el.focus(); } } catch (_) {} },
      ctxLabel: window.NAV.ctxLabel(), anon: !st.user, signed: !!st.user, userName: U ? U.name : '', userDest: U ? U.dest : '', userIni: U ? U.ini : '', userPhoto: U && U.photo ? U.photo : '', userHasPhoto: !!(U && U.photo), userNoPhoto: !!U && !U.photo,
      menuOpen: String(st.sheet === 'menu'), openSearch: () => window.NAV.toSearch(this), openHome: () => window.NAV.go('home', {}, this), goHelp: () => window.GO('PUB11'), goHelpPay: () => window.GO('PUB11', { art: 'pagamentos' }), goHelpPriv: () => window.GO('PUB11', { art: 'privacidade' }), goHelpTerms: () => window.GO('PUB11', { art: 'termos' }), goHelpCookies: () => window.GO('PUB11', { art: 'cookies' }), openLang: open('lang'), openSaved: open('saved'), openLogin: () => window.NAV.go('onboarding', { flow: 'entrar' }, this), openPro: open('pro'), openAcct: open('acct'), openMenu: open('menu'), openHelp: open('ajuda'), openInbox: open('inbox'),
      openConta: U ? open('acct') : (ev) => set({ sheet: 'entrar', after: null, y: yOf(ev) }), tabOn: !st.sheet, favDot: false,
      favNote: false, undoFav: () => set({ favNote: false }), toastTop: st.ty + 'px', openPerfil: () => window.NAV.go('perfil', { id: 'rafael', offer: st.offer }, this), openMsg: open('msg', { topic: 'servico' }),
      goRev: () => goSec('avaliacoes'), goCmp: () => goSec('comparar'), goSvc: () => {},
      t, o, sel, picker, optCards, hl0: hl(0), hl1: hl(1), hl2: hl(2), hl3: hl(3), A, sum, barOn, reviews, hasRev: reviews.length > 0, noRev: reviews.length === 0, noRevText: o.prog ? 'Só avalia quem comprou o programa. Ninguém concluiu o CrossFit Base ainda.' : 'Só avalia quem concluiu um período contratado desta oferta.', faqs,
      pcCls: 'pc' + (pcOn ? ' v4-pc--on' : ''), pcImg: B('4f287f956509500f4c89225daef9c5c5'), pcOn, pcOnS: String(pcOn), pcBtn: pcOn ? 'Escolhido' : 'Escolher programa', pcBtnCls: 'btn btn--sm ' + (pcOn ? 'btn--brand' : 'btn--white'),
      pickBase: () => { set({ offer: 'base' }); try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (_) {} }, pickOnline: () => { set({ offer: 'online' }); try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (_) {} },
      cmpProgCls: 'btn btn--sm ' + (pcOn ? 'btn--primary' : 'btn--outline'), cmpProgLbl: st.bought === 'base' ? 'Comprado' : pcOn ? 'Escolhido' : 'Escolher programa',
      cmpOnCls: 'btn btn--sm ' + (o.id === 'online' ? 'btn--primary' : 'btn--outline'), cmpOnLbl: st.user === 'ana' ? 'Seu acompanhamento' : o.id === 'online' ? 'Escolhido' : 'Escolher acompanhamento',
      mtabs, det, chipsM, pickerM, jsteps, mbarLabel, mbarCls,
      sheetOn: !!raw, sh, close, payOpts, dlgCls: 'card v4-sheet' + (st.sheet === 'menu' ? ' v4-sheet--menu' : ''), sheetTop: st.y + 'px', slotDays: []
    };
  }
}

return Component; })(), frag: document.getElementById('tpl-servico').content, css: document.getElementById('css-servico') };
