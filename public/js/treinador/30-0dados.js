/* T4 · Programas e ofertas do treinador: dados próprios (coleções t4_) e utilidades comuns às telas 30-*.
   Coleções: t4_estrutura (módulos/semanas e itens de cada programa), t4_materiais (arquivos e direito de uso),
   t4_progmeta (formato, público, rascunho salvo, venda), t4_propostas (propostas individuais e entregas externas),
   t4_flash (aviso que uma tela deixa para a próxima, ex.: publicação concluída). */
(function () {
  var DB = window.DB, U = window.U;

  DB.seed('t4_progmeta', {
    p1: { format: 'sessoes', desc: 'Oito semanas para aprender os movimentos básicos do CrossFit com escalas para cada nível.', audience: 'Iniciantes sem lesão ativa', prereq: 'Liberação médica para atividade física', publishedAt: '12/10', savedAt: '12/10 09:40', draft: 0, lastSec: 'conteudo', lastItem: 'm3' },
    p2: { format: 'misto', desc: 'Arranco e arremesso do zero, com técnica antes de carga.', audience: 'Quem já treina musculação há 6 meses', prereq: '', publishedAt: '', savedAt: '25/10 22:40', draft: 1, lastSec: 'conteudo', lastItem: 'm3' },
    p3: { format: 'misto', desc: 'Quinze minutos por dia para ombros, quadril e coluna.', audience: 'Qualquer nível', prereq: 'Nenhum', publishedAt: '20/09', savedAt: '20/10 18:05', draft: 2, lastSec: 'direitos', lastItem: 'mt6' }
  });
  // kind: sessao | aula | material ; state: pronta | rascunho | processando | falta video
  DB.seed('t4_estrutura', [
    { id: 'm1', program: 'p1', title: 'Semana 1 · base', items: [
      { id: 'i1', kind: 'sessao', name: 'Sessão 1 · agachamento e burpee', sub: 'treino · 35 min', state: 'pronta', rotina: 'r3' },
      { id: 'i2', kind: 'sessao', name: 'Sessão 2 · levantamento terra', sub: 'treino · 40 min', state: 'pronta', rotina: 'r3' },
      { id: 'i3', kind: 'sessao', name: 'Sessão 3 · condicionamento 30 min', sub: 'treino · 30 min', state: 'pronta', rotina: 'r3' }] },
    { id: 'm2', program: 'p1', title: 'Semana 2 · técnica', items: [
      { id: 'i4', kind: 'sessao', name: 'Sessões 4 a 6 · técnica de barra', sub: '3 treinos', state: 'pronta', rotina: 'r3' }] },
    { id: 'm3', program: 'p1', title: 'Semanas 3 a 8', items: [
      { id: 'i5', kind: 'sessao', name: 'Sessões 7 a 24', sub: '18 treinos', state: 'pronta', rotina: 'r3' }] },
    { id: 'm4', program: 'p2', title: 'Semana 1 · arranco', items: [
      { id: 'i6', kind: 'aula', name: 'Aula · arranco', sub: 'vídeo 8 min', state: 'pronta', rotina: '' },
      { id: 'i7', kind: 'sessao', name: 'Sessão 1 · técnica de arranco', sub: 'treino', state: 'pronta', rotina: 'r4' }] },
    { id: 'm5', program: 'p2', title: 'Semana 2 · arremesso', items: [
      { id: 'i8', kind: 'aula', name: 'Aula · arremesso', sub: 'vídeo 6 min', state: 'pronta', rotina: '' },
      { id: 'i9', kind: 'sessao', name: 'Sessão 3 · técnica de arremesso', sub: 'treino', state: 'pronta', rotina: 'r4' }] },
    { id: 'm6', program: 'p2', title: 'Semanas 3 a 6', items: [] },
    { id: 'm7', program: 'p3', title: 'Ombros', items: [
      { id: 'i10', kind: 'aula', name: 'Vídeo · ombros', sub: 'vídeo 12 min', state: 'pronta', rotina: '' },
      { id: 'i11', kind: 'sessao', name: 'Sessão · mobilidade de ombro', sub: 'treino · 15 min', state: 'pronta', rotina: 'r1' }] },
    { id: 'm8', program: 'p3', title: 'Quadril', items: [
      { id: 'i12', kind: 'aula', name: 'Vídeo · quadril (semana 2)', sub: 'vídeo 14 min', state: 'processando', rotina: '' }] },
    { id: 'm9', program: 'p3', title: 'Coluna', items: [
      { id: 'i13', kind: 'sessao', name: 'Sessão · coluna', sub: 'treino · 15 min', state: 'pronta', rotina: 'r3' }] }
  ]);
  DB.seed('t4_materiais', [
    { id: 'mt1', program: 'p1', name: 'Capa CrossFit do zero.jpg', kind: 'capa', rights: true, status: 'pronto', who: 'foto própria' },
    { id: 'mt2', program: 'p1', name: 'Guia de escalas.pdf', kind: 'PDF', rights: true, status: 'pronto', who: 'autoria de Rafael Lima' },
    { id: 'mt3', program: 'p2', name: 'Capa LPO.jpg', kind: 'capa', rights: false, status: 'pronto', who: 'origem não informada' },
    { id: 'mt4', program: 'p2', name: 'Aula arranco.mp4', kind: 'vídeo', rights: true, status: 'pronto', who: 'gravação própria' },
    { id: 'mt5', program: 'p3', name: 'Capa Mobilidade.jpg', kind: 'capa', rights: true, status: 'pronto', who: 'foto própria' },
    { id: 'mt6', program: 'p3', name: 'Vídeo quadril.mp4', kind: 'vídeo', rights: true, status: 'processando', who: 'gravação própria' }
  ]);
  DB.seed('t4_propostas', [
    { id: 'pr1', student: 'ana', title: 'Acompanhamento online + 4 sessões presenciais', base: 'o1', extra: 'o2', price: 520, unit: 'único', valid: '31/10', version: 1, channel: 'Mensagem no 99Coach', status: 'enviada', sentAt: '24/10 18:30',
      history: [{ v: 1, at: '24/10 18:30', price: 520, valid: '31/10', channel: 'Mensagem no 99Coach' }],
      deliveries: [{ id: 'e1', date: '22/10', units: 1, what: 'Sessão presencial no Centro', evidence: 'Foto do caderno de treino enviada por Ana', status: 'declarada' }], unitsTotal: 4 }
  ]);
  DB.seed('t4_flash', { msg: '' });

  var STATUS = {
    'publicado': { label: 'Publicado', cls: 'badge badge--ok' },
    'rascunho': { label: 'Rascunho', cls: 'badge badge--plain' },
    'em revisão': { label: 'Em revisão', cls: 'badge badge--info' }
  };
  var ITEMST = {
    pronta: { label: 'pronta', cls: 'badge badge--ok' },
    rascunho: { label: 'rascunho', cls: 'badge badge--plain' },
    processando: { label: 'processando', cls: 'badge badge--info' },
    'falta video': { label: 'falta vídeo', cls: 'badge badge--warn' }
  };
  var FORMATS = { sessoes: 'Só sessões', misto: 'Aulas e sessões' };

  var T4 = {
    FORMATS: FORMATS,
    prog: function (id) { return DB.find('programas', id) || null; },
    meta: function (id) {
      var m = DB.t4_progmeta[id];
      if (!m) { m = { format: 'sessoes', desc: '', audience: '', prereq: '', publishedAt: '', savedAt: '', draft: 1, lastSec: 'basico', lastItem: '' }; DB.t4_progmeta[id] = m; }
      return m;
    },
    mods: function (id) { return DB.t4_estrutura.filter(function (m) { return m.program === id; }); },
    mats: function (id) { return DB.t4_materiais.filter(function (m) { return m.program === id; }); },
    offerOf: function (id) { return DB.ofertas.find(function (o) { return o.program === id; }) || null; },
    status: function (s) { return STATUS[s] || { label: s, cls: 'badge badge--plain' }; },
    itemSt: function (s) { return ITEMST[s] || { label: s, cls: 'badge badge--plain' }; },
    // checklist de prontidão: depende do formato (vídeo só é exigido quando o formato tem aulas)
    readiness: function (id) {
      var p = T4.prog(id), m = T4.meta(id), mods = T4.mods(id), mats = T4.mats(id);
      if (!p) return [];
      var emptyMods = mods.filter(function (x) { return !x.items.length; });
      var nSess = mods.reduce(function (n, x) { return n + x.items.filter(function (i) { return i.kind === 'sessao'; }).length; }, 0);
      var noRights = mats.filter(function (x) { return !x.rights; });
      var proc = mats.filter(function (x) { return x.status === 'processando'; }).concat([].concat.apply([], mods.map(function (x) { return x.items.filter(function (i) { return i.state === 'processando'; }); })));
      var aulas = [].concat.apply([], mods.map(function (x) { return x.items.filter(function (i) { return i.kind === 'aula'; }); }));
      var cover = mats.find(function (x) { return x.kind === 'capa'; });
      var list = [
        { key: 'nome', label: 'Nome e descrição', ok: !!(p.name && m.desc), req: true, why: 'Falta a descrição do programa.', sec: 'basico' },
        { key: 'sessoes', label: emptyMods.length ? emptyMods[0].title + ' sem sessões' : (p.sessions + ' sessões planejadas · ' + U.plural(mods.length, 'seção', 'seções') + ' com conteúdo'), ok: !emptyMods.length && mods.length > 0, req: true, why: 'Cada seção precisa de pelo menos uma sessão ou aula.', sec: 'conteudo', item: emptyMods.length ? emptyMods[0].id : '' },
        { key: 'publico', label: 'Público e pré-requisito', ok: !!(m.audience), req: true, why: 'Diga para quem é o programa.', sec: 'basico' },
        { key: 'direitos', label: noRights.length ? (noRights[0].kind === 'capa' ? 'Capa sem direito de uso confirmado' : noRights[0].name + ' sem direito de uso') : 'Direito de uso das mídias confirmado', ok: !noRights.length, req: true, why: 'Confirme autoria ou licença antes de publicar.', sec: 'direitos', item: noRights.length ? noRights[0].id : '' },
        { key: 'midia', label: proc.length ? (proc[0].name + ' processando') : 'Mídias processadas', ok: !proc.length, req: true, why: 'Aguarde o processamento; a aula fica como rascunho.', sec: 'direitos', item: proc.length ? proc[0].id : '' },
        { key: 'capa', label: cover ? 'Capa enviada' : 'Capa', ok: !!cover, req: false, why: 'Opcional: sem capa, a vitrine usa a cor do perfil.', sec: 'direitos' }
      ];
      if (m.format === 'misto') list.push({ key: 'video', label: 'Videoaulas com legenda', ok: aulas.every(function (a) { return a.state === 'pronta'; }), req: true, why: 'Aulas em vídeo precisam estar processadas e com legenda.', sec: 'conteudo' });
      else list.push({ key: 'video', label: 'Videoaula', ok: true, req: false, na: true, why: 'Não exigida neste formato.', sec: 'conteudo' });
      // nSess usado no texto de sessões quando há seções vazias
      list.nSess = nSess;
      return list;
    },
    blockers: function (id) { return T4.readiness(id).filter(function (c) { return c.req && !c.ok; }); },
    // mantém DB.programas[].pending coerente com o checklist (outras telas leem essa lista)
    sync: function (id) {
      var p = T4.prog(id); if (!p) return;
      p.pending = T4.blockers(id).map(function (c) { return c.label; });
    },
    stamp: function () { return U.todayShort + ' ' + U.now(); },
    noop: function () {},
    // aviso de situação: kind ok | info | warn | risk
    alert: function (kind, title, text, btn, act, btn2, act2) {
      var ic = { ok: 'check', info: 'info', warn: 'clock', risk: 'alert' }[kind] || 'info';
      return { cls: 'alert alert--' + kind, ic: 'ic ic--sm i-' + ic, role: kind === 'risk' ? 'alert' : 'status', title: title, text: text || '',
        hasBtn: !!btn, btn: btn || '', act: act || T4.noop, hasBtn2: !!btn2, btn2: btn2 || '', act2: act2 || T4.noop };
    },
    // opções de escolha única (chips ou segmentos)
    opts: function (list, cur, pick, base) {
      return list.map(function (o) {
        var on = o[0] === cur;
        return { key: o[0], label: o[1], on: String(on), cls: (base || 'chip t4-chip') + (on ? ' is-on' : ''), pick: function () { pick(o[0]); } };
      });
    },
    // versão no ar e próxima versão de um programa
    liveV: function (p) { return p.status === 'publicado' ? p.version : (p.status === 'em revisão' ? p.version - 1 : (T4.meta(p.id).publishedAt ? p.version - 1 : 0)); },
    nextV: function (p) { return p.status === 'publicado' ? p.version + 1 : p.version; },
    // programa da rota, com recurso ao padrão quando o id não existe
    pick: function (id, dflt) { return T4.prog(id) || T4.prog(dflt) || DB.programas[0] || null; }
  };
  window.T4 = T4;
})();
