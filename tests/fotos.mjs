// Tira fotos das telas reais (servidor simulado) para conferência visual. Uso: node fotos.mjs <pasta de saída>
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const out = process.argv[2];
const b = await chromium.launch();
const day = (n, h) => { const d = new Date(Date.now() - n * 864e5); d.setHours(h || 18, 0, 0, 0); return d.toISOString(); };
const W = { template_id: 'manual', title: 'Força base', current_version: 2, workout_versions: [{ version: 2, sessions: [
  { id: 's1', title: 'Treino A · inferiores', estMin: 35, items: [{ exerciseId: 'agach', name: 'Agachamento livre', sets: 3, reps: '8', loadKg: 60, restS: 90, notes: null }, { exerciseId: 'terra', name: 'Levantamento terra', sets: 3, reps: '5', loadKg: 80, restS: 120, notes: null }] },
  { id: 's2', title: 'Treino B · superiores', estMin: 30, items: [{ exerciseId: 'supino', name: 'Supino reto', sets: 3, reps: '8', loadKg: 40, restS: 90, notes: null }] }], schedule: null, created_at: day(20) }] };
const set = (ex, name, n, reps, kg) => ({ item: 0, set_no: n, reps, load_kg: kg, exercise_id: ex, exercise_name: name });
const sess = [[14, 55], [10, 57.5], [6, 57.5], [2, 60]].map(([d, kg], i) => ({ id: 'S' + i, session_key: 'L1_v2_s1', started_at: day(d), submitted_at: day(d), set_logs: [set('agach', 'Agachamento livre', 1, 8, kg), set('agach', 'Agachamento livre', 2, 8, kg), set('agach', 'Agachamento livre', 3, 7, kg), set('terra', 'Levantamento terra', 1, 5, 75 + i * 2.5), set('terra', 'Levantamento terra', 2, 5, 75 + i * 2.5), set('terra', 'Levantamento terra', 3, 5, 75 + i * 2.5)] }));
const lk = (id, sid, prep, st, w) => ({ id, status: st || 'ativo', origin: 'convite', prep, answers: {}, created_at: day(25), student_id: sid, trainers: { slug: 'marina', name: 'Marina Duarte', user_id: 'tr' }, workouts: w ? [W] : [] });
const today = new Date(); today.setHours(17, 30, 0, 0);
async function mk(who, uid, w) {
  const ctx = await b.newContext({ viewport: w, deviceScaleFactor: 2 });
  await ctx.route('**/api/v1/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[]}' }));
  await ctx.route('**/rycaxboqkkiopjdecgld.supabase.co/**', async (route) => {
    const rq = route.request(), u = new URL(rq.url());
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' };
    if (rq.method() === 'OPTIONS') return route.fulfill({ status: 200, headers: cors });
    const j = (d) => route.fulfill({ status: 200, headers: cors, body: JSON.stringify(d) });
    const path = u.pathname.replace('/rest/v1/', '');
    if (path === 'links') return j(uid === 'tr' ? [lk('L1', 'a1', 'assigned', 'ativo', true), lk('L2', 'a2', 'awaiting_review'), lk('L3', 'a3', 'ready_to_assign'), lk('L4', 'a4', 'awaiting_client')] : [lk('L1', 'a1', 'assigned', 'ativo', true)]);
    if (path === 'requests') return j(uid === 'tr' ? [{ id: 'R1', status: 'pendente', message: 'Quero treinar 3x por semana', created_at: day(1), expires_at: day(-1), student_id: 'a5', trainers: { slug: 'marina', name: 'Marina Duarte', user_id: 'tr' }, offers: { key: 'principal', title: 'Acompanhamento online', price_cents: 20000, unit: 'mes' } }] : []);
    if (path === 'sessions') return j(sess);
    if (path === 'messages') return j([{ id: 'm1', side: 'treinador', body: 'Boa evolução no agachamento. Na próxima, tente manter as 8 repetições na terceira série antes de subir a carga.', client_id: 'c1', created_at: day(1), read_at: null }]);
    if (path === 'appointments') return j([{ id: 'A1', link_id: 'L1', starts_at: today.toISOString(), ends_at: today.toISOString(), tz: 'America/Sao_Paulo', status: 'marcado', booked_by: 'aluno' }]);
    if (path === 'profiles') return j(/id=in/.test(u.search) ? [{ id: 'a1', display_name: 'Caio Prado' }, { id: 'a2', display_name: 'Bia Lima' }, { id: 'a3', display_name: 'Davi Reis' }, { id: 'a4', display_name: 'Eva Nunes' }, { id: 'a5', display_name: 'Felipe Rocha' }] : [{ id: uid, roles: [who] }]);
    if (path === 'trainers') return j([{ id: 'T1' }]);
    return j([]);
  });
  const p = await ctx.newPage();
  await p.goto('http://localhost:5173/', { waitUntil: 'load' }); await p.waitForTimeout(500);
  await p.evaluate(([u, w2]) => {
    localStorage.setItem('c99.sessao', JSON.stringify({ access_token: 't', refresh_token: 'r', user: { id: u, email: u + '@x.com' } }));
    const C = PAGES.onboarding.Comp;
    STORE.saveOnb(Object.assign(C.prototype.base.call(C.prototype, w2, ''), { name: u === 'tr' ? 'Marina Duarte' : 'Caio Prado', dadosSaved: true, conta: true, step: u === 'tr' ? 'hoje' : 'pronto', scn: '', published: true, city: 'Londrina, PR' }));
  }, [uid, who]);
  await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1700);
  return p;
}
const shot = async (p, name) => { await p.waitForTimeout(900); await p.screenshot({ path: `${out}/${name}.png`, fullPage: true }); console.log(name); };
const press = async (p, re) => { for (const h of await p.$$('#app button')) { const t = (await h.textContent()).trim(); if (re.test(t) && (await h.isVisible())) { await h.click(); return; } } };
const al = await mk('aluno', 'a1', { width: 390, height: 844 });
await al.evaluate(() => NAV.go('aluno', {}, null)); await shot(al, '1-aluno-hoje');
await press(al, /^Começar treino$/); await al.waitForTimeout(400);
await al.locator('#app .onb-checkrow').nth(0).click(); await al.waitForTimeout(300); await al.locator('#app .onb-checkrow').nth(1).click();
await shot(al, '2-aluno-treino');
await press(al, /^Pausar e sair$/); await al.evaluate(() => GO('H10E')); await shot(al, '3-aluno-evolucao');
const tr = await mk('treinador', 'tr', { width: 1280, height: 800 });
await tr.evaluate(() => NAV.go('treinador', { s: 'hoje' }, null)); await shot(tr, '4-treinador-hoje');
await b.close();
