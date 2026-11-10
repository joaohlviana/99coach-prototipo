/* P1 · página pública (visitante): dados de exemplo e utilidades compartilhadas pelas telas 10-*.
   Treinadores públicos coerentes com o perfil interativo (@perfil: rafael, gabriel, carolina, thiago).
   Programas públicos derivados de DB.programas (p1 publicado, p3 publicado com versão nova em revisão). */
(function () {
  var DB = window.DB;
  var src = function (id) { return (DB.programas || []).find(function (x) { return x.id === id; }) || {}; };
  var p1 = src('p1'), p3 = src('p3');

  DB.seed('p1_treinadores', [
    { id: 'rafael', name: 'Rafael Lima', ini: 'RL', photo: 'bdc7ef1c8dbf05558c3bf8d575fc3a04', spec: 'CrossFit e Musculação', area: 'Centro', city: 'Londrina, PR', modes: 'presencial e online', pres: true, online: true, lang: 'Português',
      from: 'R$ 80 / sessão', main: 'R$ 200 / mês', avg: '4,9', n: 23, dist: [21, 2, 0, 0, 0], status: 'ativo', perfil: true,
      why: 'Atende sua região · aceita alunos novos (20/10)', reason: 'Você buscou CrossFit presencial em Londrina. Ele atende essa combinação e está a 1,2 km do Centro, o local que você escolheu.' },
    { id: 'gabriel', name: 'Gabriel Santos', ini: 'GS', photo: '4534df06b7d037ae994cb151849342b0', spec: 'CrossFit e LPO', area: 'Gleba Palhano', city: 'Londrina, PR', modes: 'presencial', pres: true, online: false, lang: 'Português',
      from: 'R$ 480 / mês', main: 'R$ 480 / mês', avg: '4,8', n: 29, dist: [24, 4, 1, 0, 0], status: 'ativo', perfil: true,
      why: 'Sem vagas novas desde 22/10', reason: 'Você buscou CrossFit presencial em Londrina. Ele atende essa combinação na Gleba Palhano, mas informou em 22/10 que não está aceitando alunos novos.' },
    { id: 'carolina', name: 'Carolina Albuquerque Montenegro', ini: 'CM', photo: '', spec: 'CrossFit e Funcional', area: 'Zona Sul', city: 'Londrina, PR', modes: 'presencial e online', pres: true, online: true, lang: 'Português',
      from: 'R$ 60 / aula', main: 'R$ 150 / mês', avg: '', n: 0, dist: [0, 0, 0, 0, 0], status: 'ativo', perfil: true,
      why: 'Também atende online · mesmo idioma', reason: 'Você buscou CrossFit em Londrina. Ela atende CrossFit na Zona Sul e também online, em português. Ainda não tem avaliações.' },
    { id: 'thiago', name: 'Thiago Pereira', ini: 'TP', photo: '', spec: 'CrossFit', area: 'Londrina', city: 'Londrina, PR', modes: 'presencial', pres: true, online: false, lang: 'Português',
      from: 'preço sob consulta', main: 'preço sob consulta', avg: '', n: 0, dist: [0, 0, 0, 0, 0], status: 'ativo', perfil: true,
      why: 'Novo na sua região', reason: 'Perfil novo: atende CrossFit presencial em Londrina. Ainda não há avaliações nem horários publicados.' },
    { id: 'retirado', name: 'Perfil indisponível', ini: '?', photo: '', spec: '', area: '', city: '', modes: '', pres: false, online: false, lang: '',
      from: '', main: '', avg: '', n: 0, dist: [0, 0, 0, 0, 0], status: 'retirado', perfil: false, why: '', reason: '', note: 'Retirado pelo treinador em 20/10' }
  ]);

  DB.seed('p1_programas', [
    { id: 'p1', name: p1.name || 'CrossFit do zero', author: 'rafael', weeks: p1.weeks || 8, sessions: p1.sessions || 24, version: p1.version || 3, price: p1.price || 97, offer: 'o4', updated: p1.updated || '12/10',
      level: 'Iniciante', audience: 'Adultos que nunca fizeram CrossFit ou estão voltando depois de uma pausa.', prereq: 'Nenhum: começa pela técnica dos movimentos básicos', equip: 'Barra, anilhas, kettlebell e caixa (box ou academia)',
      modules: [['Módulo 1 · Semana 1 · base', 3, true], ['Módulo 2 · Semana 2 · técnica', 3, true], ['Módulo 3 · Semanas 3 a 8', 18, false]],
      preview: { title: 'Sessão 1 · Base de agachamento', items: [['Agachamento livre', '3 × 10 · sem carga'], ['Kettlebell swing', '3 × 12 · 8 kg'], ['Prancha frontal', '3 × 30 s']], src: 'Vídeos gravados pelo Rafael e autorizados para prévia em 12/10' } },
    { id: 'p3', name: p3.name || 'Mobilidade 15 minutos', author: 'rafael', weeks: p3.weeks || 4, sessions: p3.sessions || 12, version: 1, price: p3.price || 47, offer: '', updated: '20/09',
      level: 'Todos os níveis', audience: 'Quem passa muito tempo sentado e quer se mexer melhor em 15 minutos por dia.', prereq: 'Nenhum', equip: 'Bastão ou cabo de vassoura',
      modules: [['Módulo 1 · Ombros', 4, true], ['Módulo 2 · Quadril', 4, false], ['Módulo 3 · Coluna', 4, false]],
      preview: { title: 'Sessão 1 · Ombros', items: [['Mobilidade de ombro com bastão', '2 × 10 · lento'], ['Prancha frontal', '2 × 20 s']], src: 'Vídeo gravado pelo Rafael e autorizado para prévia em 20/09' } }
  ]);

  // favoritos: lista privada (o treinador não recebe lista nominal)
  DB.seed('p1_salvos', [
    { id: 'f1', kind: 'treinador', ref: 'rafael', at: '24/10' },
    { id: 'f2', kind: 'programa', ref: 'p3', at: '22/10' },
    { id: 'f3', kind: 'treinador', ref: 'gabriel', at: '20/10' },
    { id: 'f4', kind: 'treinador', ref: 'retirado', at: '12/10' }
  ]);
  // vistos recentemente: separado dos favoritos
  DB.seed('p1_vistos', [
    { id: 'v1', kind: 'treinador', ref: 'carolina', at: 'hoje, 09:40' },
    { id: 'v2', kind: 'programa', ref: 'p1', at: 'ontem' },
    { id: 'v3', kind: 'treinador', ref: 'gabriel', at: '24/10' }
  ]);
  // contexto de busca salvo neste aparelho
  DB.seed('p1_busca', { active: true, sport: 'CrossFit', city: 'Londrina, PR', mode: 'Presencial', lang: 'Português', at: '24/10', where: 'neste aparelho' });
  // sugestões: estado de controle por item (ok · oculto por agora · sem interesse)
  DB.seed('p1_sugestoes', [
    { ref: 'rafael', state: 'ok' }, { ref: 'gabriel', state: 'ok' }, { ref: 'carolina', state: 'ok' }, { ref: 'thiago', state: 'ok' }
  ]);
  // avaliações públicas (as mais recentes; média e distribuição vêm de p1_treinadores.dist)
  DB.seed('p1_avaliacoes', [
    { id: 'av1', trainer: 'rafael', author: 'Ana C.', svc: 'Acompanhamento online', when: 'out/2026', stars: 5, text: 'Ajustes rápidos e treino bem explicado.', reply: 'Obrigado, Ana!', status: 'publicada', mine: false, contest: false },
    { id: 'av2', trainer: 'rafael', author: 'Marina C.', svc: 'Acompanhamento online', when: 'set/2026', stars: 5, text: 'Comecei sem saber agachar direito. Os ajustes a cada 15 dias fizeram diferença e ele responde rápido.', reply: '', status: 'publicada', mine: false, contest: false },
    { id: 'av3', trainer: 'rafael', author: 'Paulo S.', svc: 'Sessão presencial', when: 'ago/2026', stars: 5, text: 'Sessão objetiva: corrigiu minha técnica no levantamento terra e deixou um plano para treinar sozinho.', reply: '', status: 'publicada', mine: false, contest: false },
    { id: 'av4', trainer: 'rafael', author: 'Lívia R.', svc: 'Acompanhamento online', when: 'jul/2026', stars: 4, text: 'Gostei do acompanhamento. Queria mais opções de treino curto para dias corridos.', reply: 'Valeu, Lívia! Incluí treinos de 30 minutos no plano.', status: 'publicada', mine: false, contest: false },
    { id: 'av5', trainer: 'rafael', author: 'André M.', svc: 'Treino presencial 2x por semana', when: 'jun/2026', stars: 5, text: 'Pontual e atento à técnica; explica o porquê de cada ajuste.', reply: '', status: 'publicada', mine: false, contest: false },
    { id: 'av6', trainer: 'rafael', author: 'Juliana F.', svc: 'Acompanhamento online', when: 'mai/2026', stars: 5, text: 'Programação clara no app e ajustes bem explicados.', reply: '', status: 'publicada', mine: false, contest: false },
    { id: 'av7', trainer: 'gabriel', author: 'Renato P.', svc: 'Sessão presencial', when: 'out/2026', stars: 5, text: 'Treino bem montado e explicação clara de cada exercício.', reply: '', status: 'publicada', mine: false, contest: false },
    { id: 'av8', trainer: 'gabriel', author: 'Camila T.', svc: 'Sessão presencial', when: 'set/2026', stars: 5, text: 'Atencioso com a técnica; saí sabendo ajustar a carga sozinha.', reply: '', status: 'publicada', mine: false, contest: false }
  ]);
  // rascunho de avaliação: preservado se a sessão expirar
  DB.seed('p1_rascunho', { trainer: '', stars: 0, text: '', anon: false });

  var U = window.U, GO = window.GO;
  window.P1 = {
    tr: function (id) { return DB.find('p1_treinadores', id) || DB.find('p1_treinadores', 'rafael'); },
    prog: function (id) { return DB.find('p1_programas', id) || DB.find('p1_programas', 'p1'); },
    savedOf: function (kind, ref) { return DB.p1_salvos.find(function (s) { return s.kind === kind && s.ref === ref; }) || null; },
    isSaved: function (kind, ref) { return !!window.P1.savedOf(kind, ref); },
    // alterna o favorito; devolve true se ficou salvo
    toggleSave: function (kind, ref) {
      var s = window.P1.savedOf(kind, ref);
      if (s) { DB.p1_salvos = DB.p1_salvos.filter(function (x) { return x !== s; }); return false; }
      DB.p1_salvos.unshift({ id: DB.uid('f'), kind: kind, ref: ref, at: U.todayShort }); return true;
    },
    av: function (t) { var ph = t && t.photo ? U.img(t.photo) : ''; return { photo: ph, hasPhoto: !!ph, noPhoto: !ph, ini: (t && t.ini) || U.ini(t && t.name) }; },
    buscaLine: function (b) { return [b.sport, String(b.city || '').split(',')[0], b.mode].filter(Boolean).join(' · '); },
    // Rafael abre o hub de decisão (H02); os demais abrem o perfil público
    openTrainer: function (id) { if (id === 'rafael') GO('H02', { id: 'rafael' }); else GO('@perfil', { id: id }); },
    heart: function (on) { return { cls: 'p1-heart' + (on ? ' is-on' : ''), label: on ? 'Remover dos favoritos' : 'Salvar nos favoritos', pressed: on ? 'true' : 'false' }; },
    stars: function (n) { var s = ''; for (var i = 0; i < 5; i++) s += i < n ? '★' : '☆'; return s; }
  };
})();
