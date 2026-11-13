// Semana do treino: o treinador define os dias sem criar versão nova; o aluno vê previsto, feito e descanso.
// Servidor simulado com as regras do banco real conferidas em 13/11 (set_workout_schedule: dias 1..7, sessão existente ou "descanso").
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const b = await chromium.launch();
const SESS = [{ id: 's1', title: 'Treino A', estMin: 40, items: [{ exerciseId: 'agach', name: 'Agachamento', sets: 3, reps: '8', loadKg: 40, restS: 90, notes: null }] }, { id: 's2', title: 'Treino B', estMin: 40, items: [{ exerciseId: 'supino', name: 'Supino reto', sets: 3, reps: '8', loadKg: 30, restS: 90, notes: null }] }];
const L1 = { id: 'L1', status: 'ativo', origin: 'convite', prep: 'assigned', answers: {}, created_at: '2026-11-01T12:00:00Z', student_id: 'al', trainers: { slug: 'marina', name: 'Marina Duarte', user_id: 'tr' }, workouts: [{ template_id: 'manual', title: 'Força', current_version: 1, workout_versions: [{ version: 1, sessions: SESS, schedule: null, created_at: '2026-11-11T12:00:00Z' }] }] };
const srv = { assign: [], log: [] };
async function mk(who, uid) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.route('**/api/v1/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[]}' }));
  await ctx.route('**/rycaxboqkkiopjdecgld.supabase.co/**', async (route) => {
    const rq = route.request(), u = new URL(rq.url());
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' };
    if (rq.method() === 'OPTIONS') return route.fulfill({ status: 200, headers: cors });
    const j = (s, d) => route.fulfill({ status: s, headers: cors, body: d == null ? '' : JSON.stringify(d) });
    const body = rq.postData() ? JSON.parse(rq.postData()) : {};
    const path = u.pathname.replace('/rest/v1/', '');
    // mesmas regras do banco real (conferidas em 12/11): coluna inexistente, convite individual sem e-mail e chave de repetição curta são recusados
    if (path === 'sessions' && /submitted_at/.test(decodeURIComponent(u.search)) && !/submitted_at:received_at/.test(decodeURIComponent(u.search))) return route.fulfill({ status: 400, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' }, body: JSON.stringify({ message: 'column sessions.submitted_at does not exist' }) });
    if (path === 'invites' && rq.method() === 'POST') { const bb = JSON.parse(rq.postData() || '{}'); if (bb.kind === 'individual' && !bb.recipient_email) return route.fulfill({ status: 400, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' }, body: JSON.stringify({ message: 'new row for relation "invites" violates check constraint "invites_check"' }) }); }
    if (/^rpc\//.test(path) && rq.postData()) { const kk = JSON.parse(rq.postData()).p_idem; if (kk != null && (String(kk).length < 8 || String(kk).length > 200)) return route.fulfill({ status: 400, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' }, body: JSON.stringify({ message: 'chave de idempotência inválida' }) }); }
    if (path === 'links') return j(200, [L1]);
    if (path === 'rpc/set_workout_schedule') {
      if (uid !== 'tr') return j(403, { message: 'acompanhamento não encontrado' });
      const sc = body.p_schedule, V = L1.workouts[0].workout_versions[0];
      if (sc) { for (const [k, v] of Object.entries(sc.days || {})) { if (!/^[1-7]$/.test(k)) return j(400, { message: 'dia_invalido' }); if (!(v === 'descanso' || (Number.isInteger(v) && v >= 0 && v < V.sessions.length))) return j(400, { message: 'sessao_invalida' }); } if (!/^\d{4}-\d{2}-\d{2}$/.test(sc.startsOn || '') || !sc.tz) return j(400, { message: 'calendario_invalido' }); }
      V.schedule = sc ? { tz: sc.tz, startsOn: sc.startsOn, days: sc.days } : null; srv.sched = (srv.sched || 0) + 1; return j(200, { schedule: V.schedule, version: 1 });
    }
    if (path === 'profiles') return j(200, /id=in/.test(u.search) ? [{ id: 'al', display_name: 'Caio Prado' }] : [{ id: uid, roles: [uid === 'tr' ? 'treinador' : 'aluno'] }]);
    if (path === 'trainers') return j(200, [{ id: 'T1' }]);
    if (path === 'rpc/assign_workout') {
      srv.assign.push(body); const W = L1.workouts[0] || (L1.workouts[0] = { template_id: 'manual', title: '', current_version: 0, workout_versions: [] }); const v = W.current_version + 1;
      W.title = body.p_title; W.current_version = v; W.workout_versions.push({ version: v, sessions: body.p_sessions, schedule: null, created_at: '2026-11-11T12:00:00Z' });
      L1.prep = 'assigned'; return j(200, { ok: true, version: v });
    }
    if (path === 'rpc/submit_session') { srv.sub = body; srv.sessions = [{ id: 'S1', session_key: body.p_key, started_at: '2026-11-11T13:00:00Z', submitted_at: '2026-11-11T13:40:00Z', set_logs: body.p_logs.map((l) => ({ item: l.item, set_no: l.set, reps: l.reps, load_kg: l.loadKg, exercise_id: l.exerciseId, exercise_name: l.name })) }]; return j(200, { ok: true }); }
    if (path === 'sessions') return j(200, srv.sessions || []);
    return j(200, []);
  });
  const p = await ctx.newPage(); p.errs = [];
  p.on('pageerror', (e) => p.errs.push(e.message.slice(0, 160)));
  await p.goto('http://localhost:5173/', { waitUntil: 'load' }); await p.waitForTimeout(500);
  await p.evaluate(([u, w]) => {
    localStorage.setItem('c99.sessao', JSON.stringify({ access_token: 't', refresh_token: 'r', user: { id: u, email: u + '@x.com' } }));
    const C = PAGES.onboarding.Comp;
    STORE.saveOnb(Object.assign(C.prototype.base.call(C.prototype, w, ''), { name: u === 'tr' ? 'Marina Duarte' : 'Caio Prado', dadosSaved: true, conta: true, step: u === 'tr' ? 'hoje' : 'pronto', scn: '' }));
  }, [uid, uid === 'tr' ? 'treinador' : 'aluno']);
  await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1600);
  return p;
}
const txt = (p) => p.evaluate(() => document.getElementById('app').innerText.replace(/\s+/g, ' '));
const click = async (p, re) => { for (const h of await p.$$('#app button')) { const t = (await h.textContent()).trim(); if (re.test(t) && (await h.isVisible())) { await h.click({ force: true }); return t; } } return null; };
const today = ((new Date().getDay() + 6) % 7) + 1, other = (today % 7) + 1, rest = (other % 7) + 1;
const DN = ['', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const pick = (p, day, label) => p.evaluate(([d, l]) => { const g = [...document.querySelectorAll('#app [role=group]')].find((e) => e.getAttribute('aria-label') === d); const b = [...g.querySelectorAll('button')].find((e) => e.textContent.trim() === l); b.click(); }, [day, label]);
const tr = await mk('TR', 'tr');
await tr.evaluate(() => NAV.go('treinador', { s: 'alunoreal', id: 'lk_L1' }, null)); await tr.waitForTimeout(1500);
let t = await txt(tr);
console.log('1 treinador vê a semana vazia:', /Semana do treino Sem dias definidos/.test(t), /Dia em branco não é descanso/.test(t), !/Salvar semana/.test(t));
await pick(tr, DN[today], 'Treino B'); await tr.waitForTimeout(200); await pick(tr, DN[other], 'Treino A'); await tr.waitForTimeout(200); await pick(tr, DN[rest], 'Descanso'); await tr.waitForTimeout(300);
await click(tr, /^Salvar semana$/); await tr.waitForTimeout(1500); t = await txt(tr);
const sc = L1.workouts[0].workout_versions[0].schedule;
console.log('2 salvo sem versão nova:', srv.sched === 1 && srv.assign.length === 0, sc.days[today] === 1 && sc.days[other] === 0 && sc.days[rest] === 'descanso', /^\d{4}-\d{2}-\d{2}$/.test(sc.startsOn) && !!sc.tz, '| botão some depois de salvar:', !/Salvar semana/.test(t));
// aluno
const al = await mk('AL', 'al');
await al.evaluate(() => NAV.go('aluno', {}, null)); await al.waitForTimeout(1500); t = await txt(al);
console.log('3 aluno vê a semana:', /Sua semana Hoje: Treino B\./.test(t), /0 de 2 treinos previstos nesta semana registrados/.test(t), /Treino A/.test(t), /Descanso/.test(t), /Nada marcado/.test(t));
console.log('  sessão de hoje já vem escolhida:', /Supino reto/.test(t), '| semana definida por Marina:', /Semana definida por Marina/.test(t));
// registra o treino de hoje e a semana marca feito
srv.sessions = [{ id: 'S1', session_key: 'L1_v1_s2', started_at: new Date().toISOString(), submitted_at: new Date().toISOString(), set_logs: [] }];
await al.reload({ waitUntil: 'load' }); await al.waitForTimeout(1500); await al.evaluate(() => NAV.go('aluno', {}, null)); await al.waitForTimeout(1500); t = await txt(al);
console.log('4 depois de registrar:', /1 de 2 treinos previstos nesta semana registrado/.test(t), /Treino B Feito/i.test(t), /já registrado nesta semana/.test(t));
// treinador marca hoje como descanso: o aluno lê descanso, sem inventar treino
await tr.reload({ waitUntil: 'load' }); await tr.waitForTimeout(1500); await tr.evaluate(() => NAV.go('treinador', { s: 'alunoreal', id: 'lk_L1' }, null)); await tr.waitForTimeout(1500);
await pick(tr, DN[today], 'Descanso'); await tr.waitForTimeout(300); await click(tr, /^Salvar semana$/); await tr.waitForTimeout(1500);
await al.reload({ waitUntil: 'load' }); await al.waitForTimeout(1500); await al.evaluate(() => NAV.go('aluno', {}, null)); await al.waitForTimeout(1500); t = await txt(al);
console.log('5 hoje descanso:', /Hoje é dia de descanso no plano de Marina/.test(t), /Se quiser treinar mesmo assim/.test(t));
console.log('errs', tr.errs, al.errs);
await b.close();
