/* T2 · utilidades e dados das telas do contexto do aluno (TRE06, TRE07, TRE08, TRE09, TRE15, TRE17, TRE18).
   Coleções próprias: t2_envios, t2_respostas, t2_respExtra, t2_comparar, t2_concluidas, t2_cal, t2_macro, t2_notasHist, t2_arquivos. */
(function () {
  'use strict';
  var DB = window.DB;
  function p2(n) { return ('0' + n).slice(-2); }
  function iso(d) { return d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); }
  function parse(s) { var a = String(s).split('-'); return new Date(+a[0], +a[1] - 1, +a[2]); }
  function add(s, n) { var d = parse(s); d.setDate(d.getDate() + n); return iso(d); }
  var WD = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  var MES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  function dm(s) { var d = parse(s); return p2(d.getDate()) + '/' + p2(d.getMonth() + 1); }
  function wd(s) { return WD[parse(s).getDay()]; }
  function lbl(s) { return wd(s) + ' ' + dm(s); }
  function monday(s) { var d = parse(s); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return iso(d); }
  function fromDm(t) {
    var m = /^\s*(\d{1,2})\/(\d{1,2})\s*$/.exec(String(t || ''));
    if (!m) return '';
    var d = +m[1], mo = +m[2], dt = new Date(2026, mo - 1, d);
    if (mo < 1 || mo > 12 || dt.getMonth() !== mo - 1) return '';
    return iso(dt);
  }
  var TODAY = '2026-10-26';

  // ---------- calendário de treinos (sementes geradas) ----------
  function gen(from, to, fn) { var days = {}; for (var s = from; s <= to; s = add(s, 1)) { var r = fn(s); if (r) days[s] = r; } return days; }
  var anaDays = gen('2026-10-05', '2026-11-22', function (s) {
    var g = parse(s).getDay(), wk = Math.floor(Math.round((parse(s) - parse('2026-10-05')) / 864e5) / 7), past = s < TODAY;
    if (s === '2026-10-16') return { k: 's', r: 'r1', s: 's1', done: false, missed: true };
    if (g === 1) return { k: 's', r: 'r1', s: 's1', done: past };
    if (g === 3) return { k: 's', r: 'r1', s: 's2', done: past };
    if (g === 5) return { k: 's', r: 'r1', s: wk % 2 ? 's1' : 's2', done: past };
    if (g === 2 || g === 0) return { k: 'd' };
    return null;
  });
  var marcosDays = gen('2026-10-05', '2026-11-22', function (s) {
    var g = parse(s).getDay(), past = s < TODAY;
    if (g === 2 || g === 4 || g === 6) return { k: 's', r: 'r3', s: 's1', done: past };
    if (g === 0) return { k: 'd' };
    return null;
  });
  DB.seed('t2_cal', {
    ana: { version: 3, savedAt: '25/10 18:40', days: anaDays },
    marcos: { version: 5, savedAt: '24/10 09:15', days: marcosDays }
  });
  DB.seed('t2_concluidas', { ana: { n: 12, since: '03/2026' }, marcos: { n: 31, since: '08/2026' }, bruno: { n: 18, since: '11/2025' }, diego: { n: 40, since: '05/2026' } });

  // ---------- formulários enviados ao aluno ----------
  DB.seed('t2_envios', [
    { id: 'e1', student: 'ana', form: 'f2', version: 2, sent: '20/10', due: '24/10', status: 'respondido', resp: 'q1', code: 'ENV-2041', reminders: 0 },
    { id: 'e0', student: 'ana', form: 'f2', version: 1, sent: '13/10', due: '17/10', status: 'revisado', resp: 't2r0', code: 'ENV-1987', reminders: 0, reviewedAt: '15/10 08:10', note: 'Sem dor relatada. Manter cargas.' },
    { id: 'e6', student: 'ana', form: 'f1', version: 3, sent: '04/03', due: '08/03', status: 'revisado', resp: 't2r1', code: 'ENV-0412', reminders: 0, reviewedAt: '06/03 19:30', note: 'Anamnese ok.' },
    { id: 'e2', student: 'lucas', form: 'f1', version: 3, sent: '20/10', due: '24/10', status: 'respondido', resp: 'q2', code: 'ENV-2039', reminders: 0 },
    { id: 'e4', student: 'lucas', form: 'f2', version: 2, sent: '24/10', due: '27/10', status: 'pendente', resp: '', code: 'ENV-2050', reminders: 0 },
    { id: 'e3', student: 'marcos', form: 'f2', version: 2, sent: '24/10', due: '25/10', status: 'respondido', resp: 'q3', code: 'ENV-2048', reminders: 0 },
    { id: 'e5', student: 'marcos', form: 'f2', version: 2, sent: '17/10', due: '18/10', status: 'revisado', resp: 't2r2', code: 'ENV-2010', reminders: 0, reviewedAt: '19/10 07:40', note: 'Sem queixas.' }
  ]);
  DB.seed('t2_respostas', [
    { id: 't2r0', student: 'ana', form: 'f2', version: 1, at: '14/10 20:15', status: 'revisado', answers: [['Como foi a semana?', 'Treinei 4 de 4 dias'], ['Peso de jejum', '62,4 kg'], ['Horas de sono por noite', '7 h'], ['Sentiu dor?', 'Não']], review: 'Sem dor relatada.' },
    { id: 't2r1', student: 'ana', form: 'f1', version: 3, at: '05/03 10:02', status: 'revisado', answers: [['Objetivo', 'Ganhar força sem dor no ombro'], ['Lesões', 'Tendinite no ombro direito em 2024'], ['Dias disponíveis', 'Seg, qua e sex à noite']], review: 'Anamnese ok.' },
    { id: 't2r2', student: 'marcos', form: 'f2', version: 2, at: '18/10 06:55', status: 'revisado', answers: [['Como foi a semana?', '3 corridas leves'], ['Peso de jejum', '84,0 kg'], ['Sentiu dor?', 'Não'], ['Nota de 0 a 10', '0']], review: 'Sem queixas.' }
  ]);
  // respostas a perguntas da v2 que não estão no resumo compartilhado
  DB.seed('t2_respExtra', { q1: [['Peso de jejum', '61,8 kg'], ['Qualidade do sono (0 a 10)', '6']], q3: [['Peso de jejum', '83,6 kg'], ['Como foi a semana?', 'Sem resposta nesta pergunta']] });
  // comparação com o envio anterior do MESMO formulário: só perguntas e unidades compatíveis
  DB.seed('t2_comparar', {
    q1: { prev: 'Check-in semanal v1 · respondido 14/10', rows: [
      { q: 'Peso de jejum', a: '62,4 kg', b: '61,8 kg', ok: true, note: 'mesma unidade' },
      { q: 'Sono', a: '', b: '', ok: false, note: 'pergunta mudou na v2 · sem comparação' },
      { q: 'Sentiu dor?', a: 'Não', b: 'Sim, no ombro direito', ok: true, note: 'mesma pergunta' }] },
    q3: { prev: 'Check-in semanal v2 · respondido 18/10', rows: [
      { q: 'Peso de jejum', a: '84,0 kg', b: '83,6 kg', ok: true, note: 'mesma unidade' },
      { q: 'Como foi a semana?', a: '3 corridas leves', b: '', ok: false, note: 'dado faltante nesta resposta · não vira zero' },
      { q: 'Sentiu dor?', a: 'Não', b: 'Joelho esquerdo depois da corrida', ok: true, note: 'mesma pergunta' }] }
  });

  // ---------- notas: versões anteriores ----------
  DB.seed('t2_notasHist', [
    { id: 'h1', note: 'n1', version: 1, text: 'Prefere treinar à noite.', vis: 'privada', at: '03/10 19:05', by: 'Rafael Lima' },
    { id: 'h2', note: 'n2', version: 1, text: 'Histórico de tendinite patelar em 2023.', vis: 'privada', at: '02/09 10:00', by: 'Rafael Lima' }
  ]);
  DB.seed('t2_notaMeta', { n1: { ctx: 'Carga', origin: 'Check-in de 14/10' }, n2: { ctx: 'Saúde informada', origin: 'Anamnese de 08/2026' } });

  // ---------- arquivos: complementos aos de DB.arquivos ----------
  DB.seed('t2_arquivos', [
    { id: 'd3', student: 'ana', name: 'Ressonância_ombro.pdf', kind: 'pdf', size: '4,6 MB', at: '25/10', access: 'você e Ana', cat: 'Exames', from: 'Ana', status: 'processando' },
    { id: 'd4', student: 'marcos', name: 'Laudo_joelho.pdf', kind: 'pdf', size: '820 KB', at: '18/10', access: 'você e Marcos', cat: 'Exames', from: 'Marcos', status: 'disponível' }
  ]);
  DB.seed('t2_arqMeta', { d1: { cat: 'Exames', from: 'Ana', status: 'disponível' }, d2: { cat: 'Fotos de avaliação', from: 'Rafael', status: 'disponível' } });

  // ---------- macroplanejamento ----------
  DB.seed('t2_macro', {
    ana: { start: '2026-10-27', version: 2, savedAt: '22/10 20:30', phases: [
      { id: 'ph1', name: 'Base', from: 1, to: 4, intent: 'Técnica e volume moderado; ombro sem dor', rotina: 'r1', freq: 3 },
      { id: 'ph2', name: 'Hipertrofia', from: 5, to: 8, intent: 'Mais volume com cargas médias', rotina: 'r2', freq: 3 },
      { id: 'ph3', name: 'Força', from: 9, to: 12, intent: 'Cargas altas, menos repetições', rotina: 'r1', freq: 3 }] },
    marcos: { start: '2026-10-27', version: 1, savedAt: '20/10 07:50', phases: [
      { id: 'pm1', name: 'Retorno à corrida', from: 1, to: 4, intent: 'Rodagem leve sem dor no joelho', rotina: 'r3', freq: 3 },
      { id: 'pm2', name: 'Volume', from: 5, to: 8, intent: 'Aumentar a distância semanal', rotina: 'r3', freq: 4 }] }
  });

  // ---------- utilidades ----------
  var OFF = { 1: [0], 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 3, 4], 6: [0, 1, 2, 3, 4, 5] };
  var T2 = {
    TODAY: TODAY, iso: iso, parse: parse, add: add, dm: dm, wd: wd, lbl: lbl, monday: monday, fromDm: fromDm, MES: MES, WD: WD, OFF: OFF,
    sid: function (ctx) { var id = ctx.id || (ctx.p && ctx.p.id) || 'ana'; return DB.find('alunos', id) ? id : 'ana'; },
    stu: function (ctx) { return DB.find('alunos', T2.sid(ctx)); },
    back: function (ctx) { return { id: T2.sid(ctx) }; },
    // alerta de situação: { t, s, cls, ic, btn, fn }
    al: function (o) {
      if (!o) return { on: false, cls: '', ic: '', t: '', s: '', hasBtn: false, btn: '', fn: function () {}, hasBtn2: false, btn2: '', fn2: function () {} };
      return { on: true, cls: 'alert alert--' + (o.kind || 'warn') + ' t2-al', ic: 'ic ic--sm i-' + (o.ic || 'alert'), t: o.t || '', s: o.s || '', hasBtn: !!o.btn, btn: o.btn || '', fn: o.fn || function () {}, hasBtn2: !!o.btn2, btn2: o.btn2 || '', fn2: o.fn2 || function () {} };
    },
    opts: function (list, cur, pick) {
      return list.map(function (x) { var on = x[0] === cur; return { k: x[0], label: x[1], on: String(on), cls: 'opt' + (on ? ' is-on' : ''), pick: function () { pick(x[0]); } }; });
    },
    rot: function (id) { return DB.find('rotinas', id); },
    sessName: function (rid, sid) { var r = DB.find('rotinas', rid); var s = r && r.sessions.find(function (x) { return x.id === sid; }); return s ? s.name : 'Sessão'; },
    cal: function (sid) { return (DB.t2_cal && DB.t2_cal[sid]) || { version: 1, savedAt: '', days: {}, virtual: true }; },
    calW: function (sid) { if (!DB.t2_cal[sid]) DB.t2_cal[sid] = { version: 1, savedAt: '', days: {} }; return DB.t2_cal[sid]; },
    entry: function (e) {
      if (!e) return { t: 'Não definido', short: '—', cls: 't2-day--nd', kind: 'nd' };
      if (e.k === 'd') return { t: 'Descanso', short: 'Descanso', cls: 't2-day--rest', kind: 'd' };
      var n = T2.sessName(e.r, e.s);
      if (e.missed) return { t: n + ' · não realizada', short: n, cls: 't2-day--miss', kind: 's' };
      return { t: n + (e.done ? ' · concluída' : ''), short: n, cls: e.done ? 't2-day--done' : 't2-day--s', kind: 's' };
    },
    // gera a programação de uma rotina a partir de uma data, preservando sessões concluídas
    plan: function (sid, start, weeks, rid, freq) {
      var cal = T2.cal(sid), r = DB.find('rotinas', rid), ss = r ? r.sessions : [], ch = [], kept = [], idx = 0, set = {};
      for (var w = 0; w < weeks; w++) (OFF[freq] || OFF[3]).forEach(function (o) {
        var day = add(start, w * 7 + o), cur = cal.days[day] || null; set[day] = 1;
        if (cur && cur.done) { kept.push(day); return; }
        var s = ss.length ? ss[idx++ % ss.length] : null;
        ch.push({ iso: day, before: cur, after: { k: 's', r: rid, s: s ? s.id : '' } });
      });
      var end = add(start, weeks * 7), cleared = [];
      Object.keys(cal.days).forEach(function (d) { var e = cal.days[d]; if (d >= start && d < end && !set[d] && e.k === 's' && !e.done) cleared.push(d); });
      return { changes: ch, kept: kept, cleared: cleared, total: ch.length + kept.length, end: add(end, -1) };
    },
    applyPlan: function (sid, res) {
      var cal = T2.calW(sid);
      res.changes.forEach(function (c) { cal.days[c.iso] = c.after; });
      res.cleared.forEach(function (d) { delete cal.days[d]; });
      cal.version++; cal.savedAt = window.U.todayShort + ' ' + window.U.now();
    },
    kv: function (arr) { return (arr || []).map(function (x) { return { k: x[0], v: String(x[1] == null ? '—' : x[1]) }; }); },
    num: function (t) { var v = parseFloat(String(t == null ? '' : t).replace(',', '.')); return isNaN(v) ? null : v; },
    fmt: function (n, d) { if (n == null || isNaN(n)) return '—'; return Number(n).toFixed(d == null ? 1 : d).replace('.', ','); }
  };
  window.T2 = T2;
})();
