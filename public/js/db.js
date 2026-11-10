/* Dados de exemplo compartilhados (fictícios). Hoje é segunda, 26/10/2026.
   Treinador da área logada: Rafael Lima (o mesmo do perfil público). Aluna da área do aluno: Ana Carolina Souza.
   Cada frente pode semear coleções próprias com DB.seed('nome', [...]) no seu arquivo. */
(function () {
  var DB = window.DB;
  DB.seed('trainer', {
    id: 'rafael', name: 'Rafael Lima', first: 'Rafael', city: 'Londrina, PR', sports: ['CrossFit', 'Musculação'], cref: 'CREF 012345-G/PR',
    plan: 'Essencial', proTrial: { active: false, daysLeft: 0 }, iaCredits: { used: 38, limit: 100, resets: '01/11' },
    publicProfile: 'perfil-rafael', since: '2019'
  });
  // status: ativo · pausado · convite (convidado, ainda sem vínculo) · pedido (pediu acompanhamento) · encerrado
  DB.seed('alunos', [
    { id: 'ana', name: 'Ana Carolina Souza', first: 'Ana', status: 'ativo', svc: 'Acompanhamento online', since: '03/2026', goal: 'Ganhar força sem dor no ombro', city: 'Londrina, PR', age: 31,
      program: 'r1', week: 3, adherence: 82, lastCheckin: '22/10', next: 'Treino B · quarta', flag: { kind: 'dor', text: 'Check-in com dor relatada no ombro', when: '22/10 · 2 h', to: 'TRE03' },
      tags: ['online', 'força'], prepDone: true, payment: 'em dia', photo: '' },
    { id: 'bruno', name: 'Bruno Lima', first: 'Bruno', status: 'ativo', svc: 'Presencial · 2x por semana', since: '11/2025', goal: 'Hipertrofia', city: 'Londrina, PR', age: 27,
      program: 'r2', week: 2, adherence: 91, lastCheckin: '24/10', next: 'Hoje 07:00 · Centro', flag: { kind: 'programacao', text: 'Aguarda programação da semana 3 · treinos acabam quinta', when: 'ontem', to: 'TRE15' },
      tags: ['presencial'], prepDone: true, payment: 'em dia', photo: '' },
    { id: 'marcos', name: 'Marcos Andrade', first: 'Marcos', status: 'ativo', svc: 'Acompanhamento online', since: '08/2026', goal: 'Voltar a correr 10 km', city: 'Cambé, PR', age: 44,
      program: 'r3', week: 5, adherence: 64, lastCheckin: '25/10', next: 'Corrida leve · terça', flag: { kind: 'dor', text: 'Relatou dor no joelho no treino de sábado', when: 'ontem', to: 'TRE03' },
      tags: ['online', 'corrida'], prepDone: true, payment: 'em dia', photo: '' },
    { id: 'larissa', name: 'Larissa Mendes', first: 'Larissa', status: 'ativo', svc: 'Acompanhamento online', since: '25/10/2026', goal: 'Começar a treinar com segurança', city: 'Londrina, PR', age: 29,
      program: '', week: 0, adherence: 0, lastCheckin: '', next: 'Online 12:30 · hoje', flag: { kind: 'preparacao', text: 'Aceitou o convite · preparação pendente', when: 'ontem', to: 'TRE03' },
      tags: ['online', 'nova'], prepDone: false, payment: 'teste', photo: '' },
    { id: 'lucas', name: 'Lucas Martins', first: 'Lucas', status: 'ativo', svc: 'Presencial · 3x por semana', since: '10/2026', goal: 'Perder 6 kg', city: 'Londrina, PR', age: 35,
      program: '', week: 0, adherence: 0, lastCheckin: '23/10', next: 'A definir', flag: { kind: 'resposta', text: 'Preparação respondida · revise antes do primeiro treino', when: '23/10', to: 'TRE06' },
      tags: ['presencial'], prepDone: true, payment: 'em dia', photo: '' },
    { id: 'diego', name: 'Diego Rocha', first: 'Diego', status: 'ativo', svc: 'Presencial · sessão avulsa', since: '05/2026', goal: 'Condicionamento para jiu-jitsu', city: 'Londrina, PR', age: 33,
      program: 'r3', week: 7, adherence: 88, lastCheckin: '25/10', next: 'Hoje 14:00 · Centro', flag: null, tags: ['presencial'], prepDone: true, payment: 'em dia', photo: '' },
    { id: 'julia', name: 'Júlia Prado', first: 'Júlia', status: 'pausado', svc: 'Acompanhamento online', since: '01/2026', goal: 'Manter rotina na gestação', city: 'Londrina, PR', age: 30,
      program: '', week: 0, adherence: 0, lastCheckin: '02/10', next: 'Pausado até 10/11', flag: null, tags: ['online', 'pausa'], prepDone: true, payment: 'pausado', photo: '' },
    { id: 'paula', name: 'Paula Costa', first: 'Paula', status: 'pedido', svc: 'Pediu: Acompanhamento online', since: '', goal: 'Treinar em casa 3x por semana', city: 'Ibiporã, PR', age: 26,
      program: '', week: 0, adherence: 0, lastCheckin: '', next: 'Responder pedido', flag: { kind: 'pedido', text: 'Pedido de acompanhamento pelo perfil', when: 'ontem', to: 'REL06' }, tags: ['pedido'], prepDone: false, payment: '', photo: '' },
    { id: 'carla', name: 'Carla Nunes', first: 'Carla', status: 'convite', svc: 'Convite enviado · Acompanhamento online', since: '', goal: '', city: '', age: 0,
      program: '', week: 0, adherence: 0, lastCheckin: '', next: 'Convite expira 01/11', flag: null, tags: ['convite'], prepDone: false, payment: '', photo: '' }
  ]);
  DB.seed('exercicios', [
    { id: 'agach', name: 'Agachamento livre', group: 'Pernas', equip: 'Barra', level: 'Intermediário', media: 'video', own: false, fav: true, cues: ['Pés na largura do quadril', 'Joelhos acompanham a ponta dos pés', 'Desça até a coxa paralela'] },
    { id: 'terra', name: 'Levantamento terra', group: 'Posterior', equip: 'Barra', level: 'Intermediário', media: 'video', own: false, fav: true, cues: ['Barra perto da canela', 'Coluna neutra', 'Empurre o chão'] },
    { id: 'supino', name: 'Supino reto', group: 'Peito', equip: 'Barra', level: 'Iniciante', media: 'video', own: false, fav: false, cues: ['Escápulas encaixadas', 'Barra na linha do peito'] },
    { id: 'remada', name: 'Remada curvada', group: 'Costas', equip: 'Barra', level: 'Intermediário', media: 'video', own: false, fav: false, cues: ['Tronco a 45°', 'Puxe com os cotovelos'] },
    { id: 'snatch', name: 'Arranco (snatch)', group: 'LPO', equip: 'Barra', level: 'Avançado', media: 'video', own: false, fav: false, cues: ['Barra próxima ao corpo', 'Extensão completa'] },
    { id: 'clean', name: 'Arremesso (clean)', group: 'LPO', equip: 'Barra', level: 'Avançado', media: 'video', own: false, fav: true, cues: ['Puxada explosiva', 'Recepção na frente'] },
    { id: 'burpee', name: 'Burpee', group: 'Condicionamento', equip: 'Peso do corpo', level: 'Iniciante', media: 'video', own: false, fav: false, cues: ['Peito no chão', 'Salto com braços estendidos'] },
    { id: 'prancha', name: 'Prancha frontal', group: 'Core', equip: 'Peso do corpo', level: 'Iniciante', media: 'imagem', own: false, fav: false, cues: ['Quadril alinhado', 'Abdome firme'] },
    { id: 'swing', name: 'Kettlebell swing', group: 'Posterior', equip: 'Kettlebell', level: 'Iniciante', media: 'video', own: false, fav: false, cues: ['Movimento do quadril', 'Braços soltos'] },
    { id: 'barra', name: 'Barra fixa', group: 'Costas', equip: 'Barra fixa', level: 'Intermediário', media: 'video', own: false, fav: false, cues: ['Pegada pronada', 'Queixo acima da barra'] },
    { id: 'afundo', name: 'Afundo com halteres', group: 'Pernas', equip: 'Halteres', level: 'Iniciante', media: 'sem', own: false, fav: false, cues: ['Passo longo', 'Joelho de trás perto do chão'] },
    { id: 'mob-ombro', name: 'Mobilidade de ombro com bastão', group: 'Mobilidade', equip: 'Bastão', level: 'Iniciante', media: 'imagem', own: true, fav: true, cues: ['Movimento lento', 'Sem dor'] }
  ]);
  // rotina: sessões com itens (exercício, séries, repetições, carga, descanso)
  DB.seed('rotinas', [
    { id: 'r1', name: 'Força base · semana 3', folder: 'Online', student: 'ana', status: 'atribuída', version: 4, savedAt: '24/10 18:20', lastSection: 's2',
      sessions: [
        { id: 's1', name: 'Treino A · inferiores', items: [{ ex: 'agach', sets: 4, reps: '6', load: '72,5 kg', rest: '120 s' }, { ex: 'terra', sets: 3, reps: '5', load: '80 kg', rest: '150 s' }, { ex: 'prancha', sets: 3, reps: '40 s', load: '', rest: '60 s' }] },
        { id: 's2', name: 'Treino B · superiores', items: [{ ex: 'supino', sets: 4, reps: '8', load: '40 kg', rest: '90 s' }, { ex: 'remada', sets: 4, reps: '8', load: '45 kg', rest: '90 s' }, { ex: 'mob-ombro', sets: 2, reps: '10', load: '', rest: '30 s' }] }
      ] },
    { id: 'r2', name: 'Hipertrofia · bloco 2', folder: 'Presencial', student: 'bruno', status: 'atribuída', version: 2, savedAt: '20/10 09:10', lastSection: 's1',
      sessions: [{ id: 's1', name: 'Treino A', items: [{ ex: 'agach', sets: 5, reps: '10', load: '60 kg', rest: '90 s' }, { ex: 'afundo', sets: 3, reps: '12', load: '14 kg', rest: '60 s' }] }] },
    { id: 'r3', name: 'Condicionamento 30 min', folder: 'Modelos', student: '', status: 'modelo', version: 6, savedAt: '15/10 21:00', lastSection: 's1',
      sessions: [{ id: 's1', name: 'Circuito', items: [{ ex: 'burpee', sets: 5, reps: '10', load: '', rest: '30 s' }, { ex: 'swing', sets: 5, reps: '15', load: '16 kg', rest: '30 s' }] }] },
    { id: 'r4', name: 'LPO técnica · iniciante', folder: 'Modelos', student: '', status: 'rascunho', version: 1, savedAt: '25/10 22:40', lastSection: 's1',
      sessions: [{ id: 's1', name: 'Técnica de arremesso', items: [{ ex: 'clean', sets: 6, reps: '2', load: '30 kg', rest: '120 s' }] }] }
  ]);
  DB.seed('pastas', [{ id: 'Online', name: 'Online' }, { id: 'Presencial', name: 'Presencial' }, { id: 'Modelos', name: 'Modelos' }]);
  DB.seed('formularios', [
    { id: 'f1', name: 'Anamnese inicial', status: 'publicado', version: 3, questions: 12, sent: 14, answered: 12, updated: '10/10' },
    { id: 'f2', name: 'Check-in semanal', status: 'publicado', version: 2, questions: 5, sent: 31, answered: 27, updated: '02/10' },
    { id: 'f3', name: 'Avaliação de dor', status: 'rascunho', version: 1, questions: 4, sent: 0, answered: 0, updated: '25/10' }
  ]);
  DB.seed('respostas', [
    { id: 'q1', student: 'ana', form: 'f2', version: 2, at: '22/10 21:40', status: 'pendente', answers: [['Como foi a semana?', 'Treinei 3 de 4 dias'], ['Sentiu dor?', 'Sim, no ombro direito no supino'], ['Nota de 0 a 10', '4 de dor ao levantar o braço']], review: '' },
    { id: 'q2', student: 'lucas', form: 'f1', version: 3, at: '23/10 08:12', status: 'pendente', answers: [['Objetivo', 'Perder 6 kg até março'], ['Lesões', 'Nenhuma'], ['Dias disponíveis', 'Seg, qua e sex de manhã']], review: '' },
    { id: 'q3', student: 'marcos', form: 'f2', version: 2, at: '25/10 19:02', status: 'pendente', answers: [['Sentiu dor?', 'Joelho esquerdo depois da corrida'], ['Nota de 0 a 10', '5']], review: '' }
  ]);
  DB.seed('avaliacoes', [
    { id: 'a1', student: 'ana', date: '03/03', protocol: 'Pollock 3 dobras', weight: 64.0, fat: 27.1, waist: 74, notes: 'Primeira avaliação' },
    { id: 'a2', student: 'ana', date: '01/07', protocol: 'Pollock 3 dobras', weight: 62.8, fat: 25.4, waist: 72, notes: '' },
    { id: 'a3', student: 'ana', date: '01/10', protocol: 'Pollock 3 dobras', weight: 62.1, fat: 24.2, waist: 71, notes: 'Boa evolução' }
  ]);
  DB.seed('arquivos', [
    { id: 'd1', student: 'ana', name: 'Exame de ombro (ultrassom).pdf', kind: 'pdf', size: '1,2 MB', at: '20/10', access: 'você e Ana' },
    { id: 'd2', student: 'ana', name: 'Foto postural · frente.jpg', kind: 'foto', size: '2,8 MB', at: '01/10', access: 'você e Ana' }
  ]);
  DB.seed('notas', [
    { id: 'n1', student: 'ana', text: 'Prefere treinar à noite. Ombro direito sensível em supino com carga alta.', vis: 'privada', at: '15/10 20:10', version: 2 },
    { id: 'n2', student: 'marcos', text: 'Histórico de tendinite patelar em 2023.', vis: 'privada', at: '02/09 10:00', version: 1 }
  ]);
  DB.seed('programas', [
    { id: 'p1', name: 'CrossFit do zero', weeks: 8, sessions: 24, status: 'publicado', version: 3, price: 97, participants: 23, rating: '4,8', updated: '12/10', sections: ['Semana 1 · base', 'Semana 2 · técnica', 'Semanas 3 a 8'], pending: [] },
    { id: 'p2', name: 'LPO para iniciantes', weeks: 6, sessions: 18, status: 'rascunho', version: 1, price: 127, participants: 0, rating: '', updated: '25/10', sections: ['Semana 1 · arranco', 'Semana 2 · arremesso'], pending: ['Capa sem direito de uso confirmado', 'Semana 3 a 6 sem sessões'] },
    { id: 'p3', name: 'Mobilidade 15 minutos', weeks: 4, sessions: 12, status: 'em revisão', version: 2, price: 47, participants: 41, rating: '4,6', updated: '20/10', sections: ['Ombros', 'Quadril', 'Coluna'], pending: ['Vídeo da semana 2 processando'] }
  ]);
  DB.seed('participantes', [
    { id: 'pp1', program: 'p1', name: 'Fernanda Alves', origin: 'compra', since: '02/10', progress: 'privado', status: 'ativo' },
    { id: 'pp2', program: 'p1', name: 'Ana Carolina Souza', origin: 'acesso gratuito', since: '15/09', progress: '62%', status: 'ativo', student: 'ana' },
    { id: 'pp3', program: 'p1', name: 'Rodrigo Teles', origin: 'compra', since: '20/08', progress: 'privado', status: 'expirado' },
    { id: 'pp4', program: 'p3', name: 'Beatriz Lopes', origin: 'compra', since: '11/10', progress: 'privado', status: 'ativo' }
  ]);
  DB.seed('ofertas', [
    { id: 'o1', name: 'Acompanhamento online', kind: 'recorrente', price: 200, unit: 'mês', fmt: 'online', sale: true, accept: 'aceite do treinador', active: 9, version: 3 },
    { id: 'o2', name: 'Sessão presencial', kind: 'avulsa', price: 80, unit: 'sessão', fmt: 'presencial', sale: true, accept: 'direta', active: 4, version: 2 },
    { id: 'o3', name: 'Pacote 8 aulas', kind: 'pacote', price: 560, unit: 'pacote', fmt: 'presencial', sale: false, accept: 'aceite do treinador', active: 0, version: 1 },
    { id: 'o4', name: 'CrossFit do zero', kind: 'programa', price: 97, unit: 'acesso', fmt: 'online', sale: true, accept: 'direta', active: 23, version: 3, program: 'p1' }
  ]);
  DB.seed('cupons', [
    { id: 'k1', code: 'VOLTA10', off: '10%', offer: 'o1', uses: 4, limit: 20, until: '30/11', status: 'ativo' },
    { id: 'k2', code: 'ZERO20', off: 'R$ 20', offer: 'o4', uses: 31, limit: 30, until: '30/09', status: 'expirado' }
  ]);
  DB.seed('agenda', [
    { id: 'c1', when: 'Hoje 07:00', day: 'seg 26/10', time: '07:00', student: 'bruno', kind: 'presencial', place: 'Centro', status: 'confirmado', offer: 'o2' },
    { id: 'c2', when: 'Hoje 12:30', day: 'seg 26/10', time: '12:30', student: 'larissa', kind: 'online', place: 'Link no evento', status: 'confirmado', offer: 'o1' },
    { id: 'c3', when: 'Hoje 14:00', day: 'seg 26/10', time: '14:00', student: 'diego', kind: 'presencial', place: 'Centro', status: 'confirmado', offer: 'o2' },
    { id: 'c4', when: 'Hoje 18:00', day: 'seg 26/10', time: '18:00', student: '', group: 'Turma LPO', kind: 'presencial', place: 'Box Centro', status: '6 confirmados', offer: '' },
    { id: 'c5', when: 'Qua 07:00', day: 'qua 28/10', time: '07:00', student: 'bruno', kind: 'presencial', place: 'Centro', status: 'confirmado', offer: 'o2' }
  ]);
  DB.seed('disponibilidade', { tz: 'Brasília (UTC−3)', days: { seg: ['06:00–10:00', '17:00–20:00'], ter: ['06:00–10:00'], qua: ['06:00–10:00', '17:00–20:00'], qui: ['06:00–10:00'], sex: ['06:00–10:00', '17:00–20:00'], sab: ['08:00–11:00'], dom: [] }, exceptions: [{ id: 'x1', date: '02/11', text: 'Feriado · sem atendimento' }], savedAt: '20/10' });
  DB.seed('conversas', [
    { id: 'ana', with: 'ana', unread: 1, msgs: [{ from: 'ana', text: 'Oi Rafael! Posso trocar o treino de quarta? Vou viajar.', at: '09:12' }, { from: 'me', text: 'Pode sim. Faz o B na terça e descansa na quarta.', at: '09:30' }, { from: 'ana', text: 'Combinado. O ombro ainda incomoda no supino.', at: '10:42' }] },
    { id: 'bruno', with: 'bruno', unread: 1, msgs: [{ from: 'bruno', text: 'Mandei a foto do caderno de treino.', at: 'ontem' }] },
    { id: 'larissa', with: 'larissa', unread: 0, msgs: [{ from: 'me', text: 'Bem-vinda, Larissa! Quando puder, responda a preparação.', at: 'ontem' }] }
  ]);
  DB.seed('notificacoes', [
    { id: 'nt1', kind: 'tarefa', text: 'Ana relatou dor no ombro no check-in', at: '2 h', read: false, to: 'TRE03', id2: 'ana' },
    { id: 'nt2', kind: 'mensagem', text: 'Nova mensagem de Ana', at: '10:42', read: false, to: 'TRE25', id2: 'ana' },
    { id: 'nt3', kind: 'pedido', text: 'Paula Costa pediu acompanhamento', at: 'ontem', read: false, to: 'REL06', id2: 'paula' },
    { id: 'nt4', kind: 'venda', text: 'Nova venda: CrossFit do zero', at: 'ontem', read: true, to: 'FT03', id2: '' },
    { id: 'nt5', kind: 'sistema', text: 'Vídeo da semana 2 de Mobilidade terminou de processar', at: 'sáb', read: true, to: 'TRE22', id2: 'p3' }
  ]);
  DB.seed('insights', {
    period: '7 dias', updated: '26/10 08:00', source: '99Coach',
    visits: 41, visitsPrev: 33, contacts: 6, contactsPrev: 4, sales: 3, salesPrev: 2, revenue: 491,
    offers: [{ offer: 'o1', views: 28, conv: '7%' }, { offer: 'o4', views: 54, conv: '5%' }, { offer: 'o2', views: 12, conv: '8%' }]
  });
  // lado da aluna Ana (área do aluno)
  DB.seed('meusTreinos', [
    { id: 't1', name: 'Treino A · inferiores', rotina: 'r1', session: 's1', day: 'seg 26/10', status: 'hoje', duration: '50 min' },
    { id: 't2', name: 'Treino B · superiores', rotina: 'r1', session: 's2', day: 'qua 28/10', status: 'próximo', duration: '45 min' },
    { id: 't0', name: 'Treino B · superiores', rotina: 'r1', session: 's2', day: 'sex 23/10', status: 'concluído', duration: '47 min', rpe: 7 }
  ]);
  DB.seed('contratacoes', [
    { id: 'ct1', what: 'Acompanhamento online', with: 'Rafael Lima', kind: 'assinatura', price: 200, unit: 'mês', status: 'ativa', next: '05/11', method: 'Cartão final 4242', since: '05/03' },
    { id: 'ct2', what: 'CrossFit do zero', with: 'Rafael Lima', kind: 'programa', price: 0, unit: 'acesso', status: 'acesso gratuito', next: '', method: '', since: '15/09' },
    { id: 'ct3', what: 'Mobilidade 15 minutos', with: 'Carolina Albuquerque', kind: 'programa', price: 47, unit: 'acesso', status: 'pago', next: '', method: 'Pix', since: '02/08' }
  ]);
  DB.seed('evolucao', {
    agach: [['01/09', 55], ['15/09', 60], ['01/10', 65], ['15/10', 70], ['22/10', 72.5]],
    peso: [['03/03', 64.0], ['01/07', 62.8], ['01/10', 62.1]],
    frequencia: { semana: 3, meta: 4, mes: 11 }
  });
  // contadores do menu lateral
  window.NAVCOUNT('alunos', function () { return DB.alunos.filter(function (a) { return a.flag; }).length; });
  window.NAVCOUNT('mensagens', function () { return DB.conversas.reduce(function (n, c) { return n + (c.unread || 0); }, 0); });
  window.NAVCOUNT('amsg', function () { return 0; });
})();
