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
    // mesmas regras do banco real (conferidas em 12/11): coluna inexistente, convite individual sem e-mail e chave de repetição curta são recusados
    if (path === 'sessions' && /submitted_at/.test(decodeURIComponent(u.search)) && !/submitted_at:received_at/.test(decodeURIComponent(u.search))) return route.fulfill({ status: 400, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' }, body: JSON.stringify({ message: 'column sessions.submitted_at does not exist' }) });
    if (path === 'invites' && rq.method() === 'POST') { const bb = JSON.parse(rq.postData() || '{}'); if (bb.kind === 'individual' && !bb.recipient_email) return route.fulfill({ status: 400, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' }, body: JSON.stringify({ message: 'new row for relation "invites" violates check constraint "invites_check"' }) }); }
    if (/^rpc\//.test(path) && rq.postData()) { const kk = JSON.parse(rq.postData()).p_idem; if (kk != null && (String(kk).length < 8 || String(kk).length > 200)) return route.fulfill({ status: 400, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' }, body: JSON.stringify({ message: 'chave de idempotência inválida' }) }); }
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
console.log('1 tela do aluno mostra origem do treino:', /De onde vem o treino/i.test(t), /Força base/.test(t));
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
// a tela se redesenha ao marcar (aparece o descanso): busca o botão de novo a cada clique
for (const n of [0, 1]) { await al.locator('#app .onb-checkrow').nth(n).click({ force: true }); await al.waitForTimeout(200); }
await al.waitForTimeout(300);
console.log('  botões na execução:', (await al.$$eval('#app button', (e) => e.map((x) => x.textContent.trim()).filter((x) => x.length < 30))).slice(-8).join(' | '));
t = await txt(al); console.log('  previsto como referência e progresso:', /previsto 4 × 8 · 40 kg/.test(t), /Sem registro anterior deste exercício/.test(t), /2 de 7 séries marcadas · guardado neste aparelho/.test(t));
// pausar e sair guarda as marcações; recarregar a página não perde; "Continuar treino" retoma
await click(al, /^Pausar e sair$/); await al.waitForTimeout(400);
await al.reload({ waitUntil: 'load' }); await al.waitForTimeout(1500);
await al.evaluate(() => NAV.go('aluno', {}, null)); await al.waitForTimeout(900);
t = await txt(al); console.log('  rascunho sobrevive a recarregar:', /Continuar Treino B · superiores/.test(t), /2 de 7 séries marcadas · guardado só neste aparelho/.test(t));
await click(al, /^Continuar treino$/); await al.waitForTimeout(500);
console.log('  retomou com as marcações:', await al.$$eval('#app [role=checkbox][aria-checked=true]', (e) => e.length));
// sessão incompleta: pede uma confirmação antes de enviar
await click(al, /^Concluir sessão$/); await al.waitForTimeout(400);
t = await txt(al); console.log('  confirma encerramento parcial:', /Encerrar com a sessão incompleta\?/.test(t), '| ainda não enviou:', !srv.sub);
await click(al, /^Encerrar e enviar o que fiz$/); await al.waitForTimeout(1300);
console.log('5 registro enviado:', srv.sub && srv.sub.p_key, '| séries', srv.sub && srv.sub.p_logs.length, srv.sub && srv.sub.p_logs[0] && srv.sub.p_logs[0].name, '| reps/carga do previsto:', srv.sub && srv.sub.p_logs[0].reps, srv.sub && srv.sub.p_logs[0].loadKg);
t = await txt(al); console.log('  recibo na tela:', /Registro recebido pelo servidor às/.test(t), /2 de 7 séries registradas \(sessão parcial\)/.test(t), '| rascunho apagado:', await al.evaluate(() => Object.keys(localStorage).filter((k) => /sessaoTreino/.test(k)).length === 0));
console.log('  volta com B feita e A pendente:', /Treino B · superiores · feita/.test(t), '| abre na A:', /Agachamento/.test(t));
await click(al, /^Ver evolução$/); await al.waitForTimeout(900);
t = await txt(al); console.log('6 evolução:', await al.evaluate(() => location.hash), /MINHA SEMANA|Minha semana/.test(t), /1 sessão registrada nos últimos 7 dias/.test(t), /1 parcial/.test(t), /Supino reto/.test(t), /Ainda sem dados suficientes/.test(t));
console.log('errs', tr.errs, al.errs);
await b.close();
