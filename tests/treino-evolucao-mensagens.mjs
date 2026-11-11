// Ciclo F3 com servidor simulado: preparação → revisão → atribuição → execução → registro → evolução (dos dois lados).
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const b = await chromium.launch();
const L1 = { id: 'L1', status: 'ativo', origin: 'convite', prep: 'awaiting_client', answers: {}, created_at: '2026-11-01T12:00:00Z', student_id: 'al', trainers: { slug: 'marina', name: 'Marina Duarte', user_id: 'tr' }, workouts: [] };
const srv = { sessions: [], log: [], submits: {}, msgs: [] };
async function mk(who, tok, uid) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.route('**/api/v1/**', (r) => r.abort());
  await ctx.route('**/rycaxboqkkiopjdecgld.supabase.co/**', async (route) => {
    const rq = route.request(), u = new URL(rq.url());
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' };
    if (rq.method() === 'OPTIONS') return route.fulfill({ status: 200, headers: cors });
    if (u.pathname.startsWith('/storage/')) return route.abort();
    const j = (s, d) => route.fulfill({ status: s, headers: cors, body: d == null ? '' : JSON.stringify(d) });
    const body = rq.postData() ? JSON.parse(rq.postData()) : {};
    const path = u.pathname.replace('/rest/v1/', '');
    srv.log.push(who + ' ' + rq.method() + ' ' + path + ' ' + (rq.postData() || '').slice(0, 110));
    if (path === 'links') return j(200, [L1]);
    if (path === 'profiles') return j(200, /id=in/.test(u.search) ? [{ id: 'al', display_name: 'Caio Prado' }] : [{ id: uid, roles: [uid === 'tr' ? 'treinador' : 'aluno'] }]);
    if (path === 'rpc/answer_prep') { L1.answers[body.p_key] = body.p_value; if (body.p_done) L1.prep = 'awaiting_review'; return j(200, { ok: true }); }
    if (path === 'rpc/review_prep') { L1.prep = 'ready_to_assign'; return j(200, { ok: true }); }
    if (path === 'rpc/assign_workout') {
      const w = L1.workouts[0] || { template_id: body.p_template, title: body.p_title, current_version: 0, workout_versions: [] };
      w.current_version += 1; w.title = body.p_title; w.workout_versions.push({ version: w.current_version, sessions: body.p_sessions, schedule: body.p_schedule, created_at: '2026-11-10T20:00:00Z', change_note: null });
      L1.workouts = [w]; L1.prep = 'assigned'; return j(200, { version: w.current_version });
    }
    if (path === 'rpc/submit_session') {
      if (srv.submits[body.p_idem]) return j(200, { receipt: 'repetido' });
      srv.submits[body.p_idem] = 1;
      srv.sessions.push({ id: 'S' + srv.sessions.length, session_key: body.p_key, started_at: '2026-11-10T20:10:00Z', submitted_at: '2026-11-10T20:50:00Z', set_logs: body.p_logs.map((x) => ({ item: x.item, set_no: x.set, reps: x.reps, load_kg: x.loadKg, exercise_id: x.exerciseId, exercise_name: x.name })) });
      return j(200, { receipt: 'ok', sets: body.p_logs.length });
    }
    if (path === 'sessions') return j(200, srv.sessions);
    if (path === 'rpc/send_message') { if (srv.failNext) { srv.failNext = false; return j(500, { message: 'falha simulada' }); } srv.msgs.push({ id: 'M' + srv.msgs.length, side: uid === 'tr' ? 'treinador' : 'aluno', body: body.p_body, client_id: body.p_client_id, created_at: new Date().toISOString(), read_at: null }); return j(200, { id: 'M' }); }
    if (path === 'rpc/mark_read') { const me = uid === 'tr' ? 'treinador' : 'aluno'; srv.msgs.forEach((m) => { if (m.side !== me && !m.read_at) m.read_at = new Date().toISOString(); }); return j(200, null); }
    if (path === 'messages') return j(200, srv.msgs);
    return j(200, []);
  });
  const p = await ctx.newPage(); p.errs = [];
  p.on('pageerror', (e) => p.errs.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load|ERR_/.test(m.text())) p.errs.push(m.text().slice(0, 160)); });
  await p.goto('http://localhost:5173/', { waitUntil: 'load' }); await p.waitForTimeout(500);
  await p.evaluate(([t, u, w]) => {
    localStorage.setItem('c99.sessao', JSON.stringify({ access_token: t, refresh_token: 'r', user: { id: u, email: u + '@x.com' } }));
    const C = PAGES.onboarding.Comp;
    STORE.saveOnb(Object.assign(C.prototype.base.call(C.prototype, w, ''), { name: u === 'tr' ? 'Marina Duarte' : 'Caio Prado', dadosSaved: true, conta: true, step: u === 'tr' ? 'hoje' : 'pronto', scn: '' }));
  }, [tok, uid, uid === 'tr' ? 'treinador' : 'aluno']);
  await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1600);
  return p;
}
const txt = (p) => p.evaluate(() => document.getElementById('app').innerText.replace(/\s+/g, ' '));
const click = async (p, re) => { for (const h of await p.$$('#app button')) { const t = (await h.textContent()).trim(); if (re.test(t) && (await h.isVisible()) && !(await h.evaluate((e) => /chip/.test(e.className)))) { await h.click(); return t; } } return null; };
const head = (t) => { const i = t.indexOf('OLÁ, CAIO'); return t.slice(i, i + 170); };

const al = await mk('AL', 'tok-al', 'al');
const tr = await mk('TR', 'tok-tr', 'tr');
// 1. aluno responde a preparação
await al.evaluate(() => NAV.go('aluno', {}, null)); await al.waitForTimeout(500);
console.log('1 aluno:', head(await txt(al)));
await click(al, /Enviar respostas/); await al.waitForTimeout(200);
console.log('  sem responder:', /Responda:/.test(await txt(al)));
for (const [id, v] of [['#pq-objetivo', 'Ganhar força'], ['#pq-dias', '3 dias'], ['#pq-local', 'Academia'], ['#pq-limitacoes', 'nenhuma']]) await al.fill(id, v);
await click(al, /Enviar respostas/); await al.waitForTimeout(1200);
console.log('  depois de enviar:', head(await txt(al)), '| prep no servidor:', L1.prep);
// 2. treinador revisa e monta
await tr.evaluate(() => { window.__refreshLinks(); }); await tr.waitForTimeout(700);
await tr.evaluate(() => NAV.go('treinador', { s: 'alunos' }, null)); await tr.waitForTimeout(400);
await tr.evaluate(() => GO('H05', { id: 'lk_L1' })); await tr.waitForTimeout(700);
let t = await txt(tr);
console.log('2 treinador vê respostas:', /Ganhar força/.test(t), /Marcar como revisada/.test(t));
await click(tr, /Marcar como revisada/); await tr.waitForTimeout(1000);
t = await txt(tr); console.log('  revisada → pode montar:', /Nome do treino/i.test(t));
await tr.fill('#rx-title', 'Força A'); await tr.fill('#rx-n0', 'Agachamento livre'); await tr.fill('#rx-s0', '3'); await tr.fill('#rx-r0', '10'); await tr.fill('#rx-l0', '40');
await click(tr, /Adicionar exercício/); await tr.waitForTimeout(150);
await tr.fill('#rx-n1', 'Supino reto'); await tr.fill('#rx-s1', '2'); await tr.fill('#rx-r1', '8');
await click(tr, /^Atribuir treino$/); await tr.waitForTimeout(1200);
console.log('  atribuído:', L1.workouts[0] && L1.workouts[0].title, 'v' + (L1.workouts[0] && L1.workouts[0].current_version), JSON.stringify(L1.workouts[0].workout_versions[0].sessions[0].items.map((i) => [i.exerciseId, i.sets, i.reps, i.loadKg])));
// 3. aluno executa
await al.evaluate(() => CONTA.links().then(() => NAV.go('aluno', {}, null))); await al.waitForTimeout(900);
t = await txt(al); console.log('3 aluno vê treino:', /FORÇA A/i.test(t), /Agachamento livre/.test(t), /Começar treino/.test(t));
await click(al, /Começar treino/); await al.waitForTimeout(300);
await click(al, /Concluir sessão/); await al.waitForTimeout(200);
console.log('  sem marcar série:', /Marque pelo menos uma série/.test(await txt(al)));
const rows = await al.$$('#app .onb-checkrow'); await rows[0].click(); await rows[1].click(); await al.fill('#ex-r0-1', '8'); await rows[3].click();
await click(al, /Concluir sessão/); await al.waitForTimeout(300);
console.log('  sessão incompleta pede confirmação:', /Encerrar com a sessão incompleta/.test(await txt(al)));
await click(al, /Encerrar e enviar o que fiz/); await al.waitForTimeout(1200);
console.log('  registrado no servidor:', srv.sessions.length, JSON.stringify(srv.sessions[0] && srv.sessions[0].set_logs.map((x) => [x.item, x.set_no, x.reps, x.load_kg])), '| key', srv.sessions[0] && srv.sessions[0].session_key);
// 4. evolução do aluno e registros no treinador
await al.evaluate(() => NAV.go('aluno', { s: 'evolucao' }, null)); await al.waitForTimeout(800);
t = await txt(al); console.log('4 evolução:', t.slice(t.indexOf('Registros confirmados'), t.indexOf('Registros confirmados') + 260));
await tr.evaluate(() => NAV.go('treinador', { s: 'alunos' }, null)); await tr.waitForTimeout(300);
await tr.evaluate(() => GO('H05', { id: 'lk_L1' })); await tr.waitForTimeout(800);
t = await txt(tr); console.log('  treinador vê registro:', t.slice(t.indexOf('Registros do aluno'), t.indexOf('Registros do aluno') + 160));
// 5. mensagens
await al.evaluate(() => NAV.go('aluno', { s: 'mensagens' }, null)); await al.waitForTimeout(700);
await al.fill('#al-chat-in', 'Posso trocar o treino de quinta para sexta?'); await click(al, /^Enviar$/); await al.waitForTimeout(800);
t = await txt(al); console.log('5 aluno enviou:', srv.msgs.length, /Posso trocar/.test(t), /Entregue/i.test(t));
await tr.evaluate(() => { NAV.go('treinador', { s: 'alunos' }, null); }); await tr.waitForTimeout(200);
await tr.evaluate(() => GO('H05', { id: 'lk_L1' })); await tr.waitForTimeout(800);
t = await txt(tr); console.log('  treinador vê:', /Posso trocar/.test(t));
srv.failNext = true; await tr.fill('#tr-chat-in', 'Pode sim!'); await click(tr, /^Enviar$/); await tr.waitForTimeout(700);
t = await txt(tr); console.log('  falha mantém texto:', /não foi enviada|Não enviada/.test(t), await tr.inputValue('#tr-chat-in'));
await click(tr, /^Enviar$/); await tr.waitForTimeout(800);
t = await txt(tr); console.log('  reenviou:', srv.msgs.length, /Pode sim!/.test(t), 'campo vazio:', (await tr.inputValue('#tr-chat-in')) === '');
await click(al, /^Atualizar$/); await al.waitForTimeout(800);
t = await txt(al); console.log('  aluno vê resposta:', /Pode sim!/.test(t), '| sua mensagem lida:', /Lida/i.test(t));
await al.screenshot({ path: 'out/f3-chat.png' });
await al.screenshot({ path: 'out/f3-evolucao.png' });
console.log(srv.log.filter((l) => /rpc|sessions/.test(l)).map((l) => l.slice(0, 150)));
console.log('errs', tr.errs, al.errs);
await b.close();
