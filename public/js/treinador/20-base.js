/* T3 · Conteúdo do treinador (rotinas, exercícios, formulários): utilidades e coleções próprias (t3_*).
   Carregado antes das telas 20-* (ordem alfabética). */
(function () {
  'use strict';
  var T3 = window.T3 = {};
  var clone = T3.clone = function (o) { return JSON.parse(JSON.stringify(o)); };

  // ---------- avisos (alert do DS) ----------
  // T3.notice('ok', 'check', 'Título', 'Texto', [['Rótulo', fn, 'btn--outline']])
  T3.notice = function (kind, ic, title, text, acts, spin) {
    var a = (acts || []).filter(Boolean).map(function (x) { return { label: x[0], fn: x[1], cls: 'btn btn--sm ' + (x[2] || 'btn--outline') }; });
    return { has: true, cls: 'alert alert--' + kind, ic: 'ic ic--sm i-' + ic, title: title, text: text || '', acts: a, hasActs: a.length > 0, spin: !!spin, noSpin: !spin, role: kind === 'risk' || kind === 'warn' ? 'alert' : 'status' };
  };
  T3.none = function () { return { has: false, cls: '', ic: '', title: '', text: '', acts: [], hasActs: false, spin: false, noSpin: true, role: 'status' }; };

  // ---------- consultas ----------
  T3.ex = function (id) { return DB.find('exercicios', id) || { id: id, name: 'Exercício indisponível', group: '', equip: '', level: '', media: 'sem', own: false, fav: false, cues: [] }; };
  T3.aluno = function (id) { return id ? DB.find('alunos', id) : null; };
  T3.first = function (id) { var a = T3.aluno(id); return a ? a.first : ''; };
  T3.dateKey = function (s) { var m = /(\d\d)\/(\d\d)(?:\s+(\d\d):(\d\d))?/.exec(s || ''); return m ? (m[2] + m[1] + (m[3] || '00') + (m[4] || '00')) : '0'; };
  T3.stamp = function () { return U.todayShort + ' ' + U.now(); };
  T3.presc = function (it) { return it.sets + ' × ' + (it.reps || '—') + (it.load ? ' · ' + it.load : '') + (it.rest ? ' · desc. ' + it.rest : ''); };
  T3.letter = function (i) { return String.fromCharCode(65 + (i % 26)); };

  // destinos possíveis (rotina · sessão) para adicionar exercícios
  T3.dests = function () {
    var out = [];
    DB.rotinas.forEach(function (r) { T3.sessions(r.id).forEach(function (s) { out.push({ rid: r.id, sid: s.id, label: r.name + ' · ' + s.name, short: s.name }); }); });
    return out;
  };
  T3.destLabel = function (rid, sid) {
    var r = DB.find('rotinas', rid); if (!r) return '';
    var s = T3.sessions(rid).find(function (x) { return x.id === sid; }) || T3.sessions(rid)[0];
    return r.name + ' · ' + (s ? s.name : 'sessão');
  };

  // ---------- rascunhos, versões e conflitos de rotina ----------
  DB.seed('t3_drafts', {});
  DB.seed('t3_conflitos', {});
  DB.seed('t3_rotMeta', { r1: { assigned: 4 }, r2: { assigned: 2 } });
  (function () {
    var r1src = DB.find('rotinas', 'r1'); if (!r1src) return; // fora da demonstração as rotinas de exemplo já foram removidas
    var r1 = clone(r1src.sessions);
    var s1 = r1[0], s2 = r1[1];
    var it = function (ex, sets, reps, load, rest) { return { ex: ex, sets: sets, reps: reps, load: load, rest: rest }; };
    var v1 = [{ id: 's1', name: s1.name, items: [it('agach', 3, '8', '60 kg', '120 s'), it('terra', 3, '5', '70 kg', '150 s')] }];
    var v2 = [{ id: 's1', name: s1.name, items: [it('agach', 4, '6', '67,5 kg', '120 s'), it('terra', 3, '5', '75 kg', '150 s'), it('prancha', 3, '40 s', '', '60 s')] },
      { id: 's2', name: s2.name, items: [it('supino', 4, '8', '40 kg', '90 s'), it('remada', 4, '8', '42,5 kg', '90 s')] }];
    var v3 = [{ id: 's1', name: s1.name, items: [it('agach', 4, '6', '70 kg', '120 s'), it('terra', 3, '5', '80 kg', '150 s'), it('prancha', 3, '40 s', '', '60 s')] },
      { id: 's2', name: s2.name, items: [it('supino', 4, '8', '42,5 kg', '90 s'), it('remada', 4, '8', '45 kg', '90 s')] }];
    DB.seed('t3_versoes', {
      r1: [
        { v: 1, author: 'Você', date: '15/09 19:05', reason: 'Criação', snap: v1 },
        { v: 2, author: 'Assistência de IA · aprovada por você', date: '01/10 08:30', reason: 'Progressão sugerida e revisada', snap: v2 },
        { v: 3, author: 'Você', date: '14/10 20:12', reason: 'Progressão', snap: v3 },
        { v: 4, author: 'Você', date: '24/10 18:20', reason: 'Ombro: menos carga no supino e mobilidade', snap: r1 }
      ]
    });
  })();

  T3.rot = function (id) { return DB.find('rotinas', id); };
  T3.draft = function (rid) { return DB.t3_drafts[rid] || null; };
  T3.ensureDraft = function (rid) {
    var r = T3.rot(rid); if (!r) return null;
    if (!DB.t3_drafts[rid]) DB.t3_drafts[rid] = { sessions: clone(r.sessions), dirty: false, base: r.version };
    return DB.t3_drafts[rid];
  };
  T3.sessions = function (rid) { var d = T3.draft(rid), r = T3.rot(rid); return d ? d.sessions : (r ? r.sessions : []); };
  T3.versions = function (rid) {
    var r = T3.rot(rid); if (!r) return [];
    if (!DB.t3_versoes[rid]) DB.t3_versoes[rid] = [{ v: r.version, author: 'Você', date: r.savedAt, reason: r.status === 'rascunho' ? 'Rascunho inicial' : 'Versão atual', snap: clone(r.sessions) }];
    return DB.t3_versoes[rid];
  };
  // grava nova versão (salvar rascunho, restaurar, resolver conflito); não altera atribuição nem sessões concluídas
  T3.commit = function (rid, sessions, reason, author) {
    var r = T3.rot(rid); if (!r) return 0;
    T3.versions(rid);
    r.sessions = clone(sessions); r.version += 1; r.savedAt = T3.stamp();
    DB.t3_versoes[rid].push({ v: r.version, author: author || 'Você', date: r.savedAt, reason: reason || 'Ajustes', snap: clone(sessions) });
    delete DB.t3_drafts[rid];
    return r.version;
  };
  T3.addToSession = function (rid, sid, ids) {
    var d = T3.ensureDraft(rid); if (!d) return null;
    var s = d.sessions.find(function (x) { return x.id === sid; }) || d.sessions[0];
    if (!s) { s = { id: 's1', name: 'Sessão A', items: [] }; d.sessions.push(s); }
    ids.forEach(function (id) { s.items.push({ ex: id, sets: 3, reps: '10', load: '', rest: '60 s', note: '' }); });
    d.dirty = true;
    return s;
  };

  // diferença entre duas listas de sessões (antes → depois), em frases legíveis
  var FIELDS = [['sets', 'séries'], ['reps', 'repetições'], ['load', 'carga'], ['rest', 'descanso'], ['note', 'nota']];
  T3.diff = function (a, b) {
    var out = [];
    (b || []).forEach(function (sb) {
      var sa = (a || []).find(function (x) { return x.id === sb.id; });
      if (!sa) { out.push({ kind: 'add', text: 'Sessão incluída: ' + sb.name + ' (' + U.plural(sb.items.length, 'exercício', 'exercícios') + ')' }); return; }
      if (sa.name !== sb.name) out.push({ kind: 'mod', text: 'Sessão renomeada: ' + sa.name + ' → ' + sb.name });
      var used = {};
      sb.items.forEach(function (ib) {
        var ix = -1;
        sa.items.forEach(function (x, i) { if (ix < 0 && !used[i] && x.ex === ib.ex) ix = i; });
        var exn = T3.ex(ib.ex).name;
        if (ix < 0) { out.push({ kind: 'add', text: sb.name + ': incluído ' + exn + ' · ' + T3.presc(ib) }); return; }
        used[ix] = 1;
        var ia = sa.items[ix];
        FIELDS.forEach(function (f) {
          var va = String(ia[f[0]] == null ? '' : ia[f[0]]), vb = String(ib[f[0]] == null ? '' : ib[f[0]]);
          if (va !== vb) out.push({ kind: 'mod', text: sb.name + ': ' + exn + ', ' + f[1] + ' ' + (va || '—') + ' → ' + (vb || '—') });
        });
      });
      sa.items.forEach(function (ia, i) { if (!used[i]) out.push({ kind: 'del', text: sb.name + ': removido ' + T3.ex(ia.ex).name }); });
    });
    (a || []).forEach(function (sa) { if (!(b || []).find(function (x) { return x.id === sa.id; })) out.push({ kind: 'del', text: 'Sessão removida: ' + sa.name }); });
    return out;
  };

  // conflito simulado: o notebook alterou as séries do primeiro exercício da última sessão editada
  T3.makeConflict = function (rid) {
    var r = T3.rot(rid); if (!r) return null;
    var ss = T3.sessions(rid);
    var s = ss.find(function (x) { return x.id === r.lastSection; }) || ss[0];
    var changes = [];
    if (s && s.items.length) {
      var it = s.items[0];
      var n = T3.num(it.load);
      var other = { sets: it.sets, reps: /^\d+$/.test(it.reps) ? String(Number(it.reps) + 2) : it.reps, load: n ? T3.fmtNum(Math.max(0, n - 2.5)) + ' ' + T3.unit(it.load) : it.load };
      changes.push({ sid: s.id, idx: 0, ex: it.ex, sess: s.name, mine: { sets: it.sets, reps: it.reps, load: it.load }, other: other });
    }
    return { device: 'Notebook', at: '10:40', what: changes.length ? 'séries do ' + T3.ex(changes[0].ex).name.toLowerCase() : 'nome da sessão', changes: changes };
  };
  T3.applyChoices = function (sessions, conflict, choice) {
    var out = clone(sessions);
    (conflict.changes || []).forEach(function (c, i) {
      if (choice[i] !== 'other') return;
      var s = out.find(function (x) { return x.id === c.sid; }); if (!s || !s.items[c.idx]) return;
      Object.assign(s.items[c.idx], c.other);
    });
    return out;
  };

  // ---------- unidades ----------
  T3.num = function (v) { var m = /^(\d+(?:[.,]\d+)?)\s?(kg|lb)$/i.exec(String(v || '').trim()); return m ? parseFloat(m[1].replace(',', '.')) : 0; };
  T3.unit = function (v) { var m = /(kg|lb)\s*$/i.exec(String(v || '')); return m ? m[1].toLowerCase() : 'kg'; };
  T3.fmtNum = function (n) { return String(Math.round(n * 10) / 10).replace('.', ','); };
  T3.checkSets = function (v) { var s = String(v == null ? '' : v).trim(); if (!/^\d+$/.test(s)) return 'Use um número inteiro de séries.'; var n = Number(s); return n < 1 || n > 20 ? 'Entre 1 e 20 séries.' : ''; };
  T3.checkReps = function (v) {
    var s = String(v || '').trim(); if (!s) return 'Informe repetições ou tempo.';
    if (/^\d+(\s?[-–]\s?\d+)?$/.test(s) || /^\d+\s?(s|min|m|km)$/i.test(s) || /^m[aá]x/i.test(s)) return '';
    return 'Use repetições (8 ou 8-10) ou tempo com unidade (40 s).';
  };
  // carga: vazio, "40 kg", "90 lb", "70%", "elástico", "peso do corpo"; número sem unidade = unidade incerta
  T3.checkLoad = function (v) {
    var s = String(v || '').trim(), n = U.norm(s);
    if (!s || /^\d+([.,]\d+)?\s?(kg|lb)$/i.test(s) || /^\d+([.,]\d+)?\s?%/.test(s) || /^(elastico|peso do corpo|livre)$/.test(n)) return { ok: true, uncertain: false, msg: '' };
    if (/^\d+([.,]\d+)?$/.test(s)) return { ok: false, uncertain: true, msg: 'Unidade incerta: confirme kg ou lb.' };
    return { ok: false, uncertain: false, msg: 'Use número e unidade, ex.: 40 kg ou 90 lb.' };
  };
  T3.checkRest = function (v) {
    var s = String(v || '').trim(); if (!s || /^\d+\s?(s|min)$/i.test(s)) return '';
    if (/^\d+$/.test(s)) return 'Informe a unidade: s ou min.';
    return 'Use segundos ou minutos, ex.: 90 s.';
  };

  // ---------- formulários ----------
  var Q = function (id, label, type, req, extra) { return Object.assign({ id: id, label: label, type: type, req: !!req, unit: '', options: [], used: false }, extra || {}); };
  var OBJ = ['Ganhar força', 'Perder peso', 'Condicionamento', 'Saúde e bem-estar'];
  var QF1 = [
    Q('q1', 'Nome completo', 'curto', true, { used: true }), Q('q2', 'Data de nascimento', 'curto', true, { used: true }),
    Q('q3', 'Peso (kg)', 'numero', true, { unit: 'kg', used: true }), Q('q4', 'Altura (cm)', 'numero', false, { unit: 'cm', used: true }),
    Q('q5', 'Objetivo', 'unica', true, { options: OBJ, used: true }), Q('q6', 'Experiência com treino', 'unica', false, { options: ['Nunca treinei', 'Menos de 1 ano', '1 a 3 anos', 'Mais de 3 anos'], used: true }),
    Q('q7', 'Dias disponíveis', 'multipla', true, { options: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'], used: true }), Q('q8', 'Lesões ou dores atuais', 'longo', false, { used: true }),
    Q('q9', 'Usa medicação contínua?', 'simnao', false, { used: true }), Q('q10', 'Tem liberação médica para atividade física?', 'simnao', false, { used: true }),
    Q('q11', 'Nível de estresse na semana', 'escala', false, { used: true }), Q('q12', 'Observações', 'longo', false, { used: true })
  ];
  var QF2 = [
    Q('q1', 'Como foi a semana?', 'longo', true, { used: true }), Q('q2', 'Quantos treinos fez?', 'numero', true, { unit: 'treinos', used: true }),
    Q('q3', 'Sentiu dor?', 'simnao', true, { used: true }), Q('q4', 'Onde e quando sentiu', 'longo', false, { used: true }), Q('q5', 'Nota de 0 a 10', 'escala', false, { used: true })
  ];
  var QF3 = [Q('q1', 'Onde dói?', 'curto', true), Q('q2', 'Intensidade da dor', 'escala', true), Q('q3', 'Desde quando?', 'curto', false), Q('q4', 'Piora com algum movimento?', 'longo', false)];
  DB.seed('t3_perguntas', { f1: QF1, f2: QF2, f3: QF3 });
  DB.seed('t3_formRasc', {});
  DB.seed('t3_formMeta', { f1: { purpose: 'Preparação' }, f2: { purpose: 'Acompanhamento' }, f3: { purpose: 'Saúde' } });
  DB.seed('t3_modelos', [
    { id: 'm1', name: 'Avaliação inicial', purpose: 'Preparação', desc: 'Objetivo, rotina, histórico de treino e saúde', qs: QF1 },
    { id: 'm2', name: 'Check-in semanal', purpose: 'Acompanhamento', desc: 'Como foi a semana, dor e nota', qs: QF2 },
    { id: 'm3', name: 'Avaliação física', purpose: 'Medidas', desc: 'Peso, cintura, quadril e dobras', qs: [Q('q1', 'Peso (kg)', 'numero', true, { unit: 'kg' }), Q('q2', 'Cintura (cm)', 'numero', true, { unit: 'cm' }), Q('q3', 'Quadril (cm)', 'numero', false, { unit: 'cm' }), Q('q4', 'Braço relaxado (cm)', 'numero', false, { unit: 'cm' }), Q('q5', 'Observações da avaliação', 'longo', false)] }
  ]);
  T3.QTYPES = [['curto', 'Texto curto'], ['longo', 'Texto longo'], ['numero', 'Número'], ['unica', 'Escolha única'], ['multipla', 'Múltipla escolha'], ['escala', 'Escala 0 a 10'], ['simnao', 'Sim ou não']];
  T3.qtype = function (t) { var f = T3.QTYPES.find(function (x) { return x[0] === t; }); return f ? f[1] : 'Texto curto'; };
  T3.formQs = function (fid) { var d = DB.t3_formRasc[fid]; return d ? d.questions : (DB.t3_perguntas[fid] || []); };
  T3.formPurpose = function (fid) { var m = DB.t3_formMeta[fid]; return m ? m.purpose : 'Geral'; };
  T3.pendentes = function () { return DB.respostas.filter(function (q) { return q.status === 'pendente'; }).length; };

  // ---------- rascunho de exercício próprio ----------
  DB.seed('t3_exRasc', {});
  // critérios e seleção do catálogo, para o retorno preservar posição e filtros
  DB.seed('t3_exState', {});
})();
