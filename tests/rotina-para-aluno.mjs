// Rotina do Conteúdo -> atribuição real -> aluno vê as sessões (servidor simulado).
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const b = await chromium.launch();
const L1 = { id: 'L1', status: 'ativo', origin: 'convite', prep: 'ready_to_assign', answers: {}, created_at: '2026-11-01T12:00:00Z', student_id: 'al', trainers: { slug: 'marina', name: 'Marina Duarte', user_id: 'tr' }, workouts: [] };
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
    if (path === 'links') return j(200, [L1]);
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
const tr = await mk('TR', 'tr');
// conta nova: biblioteca vazia; o treinador cria uma rotina (gravada como o editor grava)
await tr.evaluate(() => NAV.go('treinador', { s: 'hoje' }, null)); await tr.waitForTimeout(700);
console.log('0 biblioteca começa vazia:', await tr.evaluate(() => (DB.rotinas || []).length));
await tr.evaluate(() => { DB.rotinas.push({ id: 'rx1', name: 'Força base', folder: '', student: '', status: 'rascunho', version: 2, savedAt: 'hoje', sessions: [
  { id: 's1', name: 'Treino A · inferiores', items: [{ ex: 'agach', sets: 4, reps: '6', load: '72,5 kg', rest: '120 s' }, { ex: 'terra', sets: 3, reps: '5', load: '80 kg', rest: '150 s' }] },
  { id: 's2', name: 'Treino B · superiores', items: [{ ex: 'supino', sets: 4, reps: '8', load: '40 kg', rest: '90 s' }, { ex: 'prancha', sets: 3, reps: '40 s', load: '', rest: '60 s' }] },
  { id: 's3', name: 'Vazia', items: [] }] }); STORE.saveDb(); });
// 1. pelo aluno: escolher a rotina
await tr.evaluate(() => GO('H05', { id: 'lk_L1' })); await tr.waitForTimeout(900);
let t = await txt(tr);
console.log('1 tela do aluno mostra origem do treino:', /De onde vem o treino/.test(t), /Força base/.test(t));
await click(tr, /^Força base$/); await tr.waitForTimeout(400);
t = await txt(tr);
console.log('  resumo:', /2 sessões · 4 exercícios/.test(t), /Treino A · inferiores/.test(t), /72,5 kg/.test(t), '| formulário manual escondido:', !(await tr.$('#rx-title')));
await click(tr, /^Atribuir esta rotina$/); await tr.waitForTimeout(1300);
const a = srv.assign[0];
console.log('2 servidor recebeu:', a && a.p_title, '| sessões', a && a.p_sessions.length, '| 1º item', a && JSON.stringify(a.p_sessions[0].items[0]));
console.log('  prancha (reps em tempo, sem carga):', a && JSON.stringify(a.p_sessions[1].items[1]));
t = await txt(tr); console.log('  tela confirma:', /Força base · versão 1/.test(t));
// 3. pelo editor: "Atribuir" leva ao aluno real com a rotina escolhida
await tr.evaluate(() => GO('TRE15', { rotina: 'rx1' })); await tr.waitForTimeout(1000);
t = await txt(tr);
console.log('3 pelo editor:', await tr.evaluate(() => location.hash), '| rotina já escolhida:', /Atribuir esta rotina/.test(t));
await click(tr, /^Atribuir esta rotina$/); await tr.waitForTimeout(1200);
console.log('  nova versão no servidor:', srv.assign.length, L1.workouts.length);
// 4. aluno vê
const al = await mk('AL', 'al');
await al.evaluate(() => NAV.go('aluno', {}, null)); await al.waitForTimeout(900);
t = await txt(al);
console.log('4 aluno vê o treino:', /FORÇA BASE|Força base/.test(t), '| escolhe sessão:', /Treino A · inferiores/.test(t) && /Treino B · superiores/.test(t));
await click(al, /^Treino B · superiores/); await al.waitForTimeout(400);
t = await txt(al); console.log('  sessão B aberta:', /Supino/.test(t), /Prancha/.test(t));
await click(al, /^Começar treino$/); await al.waitForTimeout(500);
const boxes = await al.$$('#app input[type=checkbox], #app .onb-checkrow'); if (boxes[0]) await boxes[0].click({ force: true }); if (boxes[1]) await boxes[1].click({ force: true });
await al.waitForTimeout(300);
console.log('  botões na execução:', (await al.$$eval('#app button', (e) => e.map((x) => x.textContent.trim()).filter((x) => x.length < 30))).slice(-8).join(' | '));
await click(al, /Concluir|Enviar registro|Finalizar/); await al.waitForTimeout(1300);
console.log('5 registro enviado:', srv.sub && srv.sub.p_key, '| séries', srv.sub && srv.sub.p_logs.length, srv.sub && srv.sub.p_logs[0] && srv.sub.p_logs[0].name);
t = await txt(al); console.log('  volta com B feita e A pendente:', /Treino B · superiores · feita/.test(t), '| abre na A:', /Agachamento/.test(t));
console.log('errs', tr.errs, al.errs);
await b.close();
