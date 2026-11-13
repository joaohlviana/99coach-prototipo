// Treinador comenta um treino registrado (aluno vê), conversa pode ser bloqueada e denunciada,
// e o treino em andamento fica salvo no servidor para continuar em outro aparelho.
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const b = await chromium.launch();
const W = { template_id: 'manual', title: 'Força A', current_version: 1, workout_versions: [{ version: 1, sessions: [{ id: 's1', title: 'Treino A', estMin: 20, items: [{ exerciseId: 'agach', name: 'Agachamento', sets: 2, reps: '8', loadKg: 40, restS: 60, notes: null }] }], schedule: null, created_at: '2026-11-02T12:00:00Z' }] };
const L1 = { id: 'L1', status: 'ativo', origin: 'convite', prep: 'assigned', answers: {}, created_at: '2026-11-01T12:00:00Z', student_id: 'al', trainers: { slug: 'marina', name: 'Marina Duarte', user_id: 'tr' }, workouts: [W] };
const srv = { sessions: [{ id: 'S0', session_key: 'L1_v1_s0', started_at: '2026-11-05T13:00:00Z', submitted_at: '2026-11-05T13:40:00Z', set_logs: [{ item: 0, set_no: 1, reps: 8, load_kg: 40, exercise_id: 'agach', exercise_name: 'Agachamento' }], session_comments: [] }], blocks: [], calls: [], saved: [] };
async function mk(uid) {
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
    // mesmas regras do banco real (conferidas em 12/11): coluna inexistente, convite individual sem e-mail e chave de repetição curta são recusados
    if (path === 'sessions' && /submitted_at/.test(decodeURIComponent(u.search)) && !/submitted_at:received_at/.test(decodeURIComponent(u.search))) return route.fulfill({ status: 400, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' }, body: JSON.stringify({ message: 'column sessions.submitted_at does not exist' }) });
    if (path === 'invites' && rq.method() === 'POST') { const bb = JSON.parse(rq.postData() || '{}'); if (bb.kind === 'individual' && !bb.recipient_email) return route.fulfill({ status: 400, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' }, body: JSON.stringify({ message: 'new row for relation "invites" violates check constraint "invites_check"' }) }); }
    if (/^rpc\//.test(path) && rq.postData()) { const kk = JSON.parse(rq.postData()).p_idem; if (kk != null && (String(kk).length < 8 || String(kk).length > 200)) return route.fulfill({ status: 400, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' }, body: JSON.stringify({ message: 'chave de idempotência inválida' }) }); }
    if (/^rpc\//.test(path)) srv.calls.push(uid + ':' + path.slice(4));
    if (path === 'links') return j(200, [L1]);
    if (path === 'profiles') return j(200, /id=in/.test(u.search) ? [{ id: 'al', display_name: 'Caio Prado' }] : [{ id: uid, roles: [uid === 'tr' ? 'treinador' : 'aluno'] }]);
    if (path === 'sessions') return j(200, srv.sessions);
    if (path === 'rpc/comment_session') { srv.sessions.find((s) => s.id === body.p_session).session_comments.push({ id: 'C1', side: 'treinador', body: body.p_body, created_at: '2026-11-06T10:00:00Z' }); return j(200, { id: 'C1' }); }
    if (path === 'rpc/adjust_workout_from_session') { srv.adj = body; return j(200, { version: 2, basedOn: body.p_session }); }
    if (path === 'conversation_blocks') return j(200, srv.blocks.map((x) => ({ blocker: x })));
    if (path === 'rpc/block_conversation') { srv.blocks = body.p_block ? [uid] : []; return j(200, { blocked: !!body.p_block }); }
    if (path === 'rpc/report_conversation') { srv.report = body; return j(200, { report: 'R1', status: 'aberta' }); }
    if (path === 'rpc/save_session') { srv.saved.push(body); const i = srv.sessions.findIndex((s) => s.session_key === body.p_key); const row = { id: 'D1', session_key: body.p_key, started_at: '2026-11-12T10:00:00Z', submitted_at: null, app_state: body.p_state, set_logs: [], session_comments: [] }; if (i >= 0) srv.sessions[i] = row; else srv.sessions.push(row); return j(200, null); }
    if (path === 'rpc/send_message') return srv.blocks.length ? j(400, { message: 'conversa_bloqueada' }) : j(200, { id: 'M' });
    return j(200, []);
  });
  const p = await ctx.newPage(); p.errs = [];
  p.on('pageerror', (e) => p.errs.push(e.message));
  await p.goto('http://localhost:5173/', { waitUntil: 'load' }); await p.waitForTimeout(500);
  await p.evaluate(([u, w]) => {
    localStorage.setItem('c99.sessao', JSON.stringify({ access_token: 't' + u, refresh_token: 'r', user: { id: u, email: u + '@x.com' } }));
    const C = PAGES.onboarding.Comp;
    STORE.saveOnb(Object.assign(C.prototype.base.call(C.prototype, w, ''), { name: u === 'tr' ? 'Marina Duarte' : 'Caio Prado', dadosSaved: true, conta: true, step: u === 'tr' ? 'hoje' : 'pronto', scn: '' }));
  }, [uid, uid === 'tr' ? 'treinador' : 'aluno']);
  await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1600);
  return p;
}
const txt = (p) => p.evaluate(() => document.getElementById('app').innerText.replace(/\s+/g, ' '));
const click = async (p, re) => { for (const h of await p.$$('#app button')) { const t = (await h.textContent()).trim(); if (re.test(t) && (await h.isVisible())) { await h.click(); await p.waitForTimeout(500); return t; } } return null; };
const clickD = async (p, re) => { for (const h of await p.$$('.mod-sheet button')) { const t = (await h.textContent()).trim(); if (re.test(t) && (await h.isVisible())) { await h.click(); await p.waitForTimeout(500); return t; } } return null; };
const tr = await mk('tr');
await tr.evaluate(() => GO('H05', { id: 'lk_L1' })); await tr.waitForTimeout(1200);
// 1. comentar o registro
console.log('1 botão comentar:', await click(tr, /^Comentar$/));
await tr.fill('#cm-S0', 'Boa! Na próxima, sobe 2,5 kg no agachamento.');
await click(tr, /Enviar comentário/); await tr.waitForTimeout(800);
let t = await txt(tr);
console.log('  enviado e aparece:', srv.calls.includes('tr:comment_session'), /Você: Boa! Na próxima/.test(t));
// 1b. ajustar o treino a partir do registro
await click(tr, /^Ajustar treino$/); await tr.waitForTimeout(300);
t = await txt(tr);
console.log('1b ajuste mostra prescrição e o que fez:', /Agachamento · Treino A · fez: 8 rep × 40 kg/.test(t));
await click(tr, /Salvar nova versão/); t = await txt(tr);
console.log('  exige motivo:', /Escreva o motivo do ajuste/.test(t), !srv.adj);
await tr.fill('#adj-l0', '42,5'); await tr.fill('#adj-note', 'Subiu bem: +2,5 kg.');
await click(tr, /Salvar nova versão/); await tr.waitForTimeout(800);
console.log('  nova versão enviada:', !!srv.adj && srv.adj.p_session === 'S0' && srv.adj.p_sessions[0].items[0].loadKg === 42.5 && srv.adj.p_note === 'Subiu bem: +2,5 kg.');
// 2. bloquear e denunciar
await click(tr, /^Bloquear$/); await clickD(tr, /^Bloquear$/); await tr.waitForTimeout(800);
t = await txt(tr);
console.log('2 bloqueou:', srv.calls.includes('tr:block_conversation'), /Você bloqueou esta conversa/.test(t), '| botão vira desbloquear:', /Desbloquear/.test(t));
await click(tr, /^Denunciar$/); await click(tr, /^Spam$/); await click(tr, /Enviar denúncia/); await tr.waitForTimeout(600);
t = await txt(tr);
console.log('  denúncia:', srv.report && srv.report.p_reason === 'spam', /Denúncia enviada/.test(t));
// 3. aluno vê o comentário e o bloqueio; começa treino, rascunho vai ao servidor
const al = await mk('al');
await al.evaluate(() => NAV.go('aluno', { s: 'semvinculo', navFrom: 'evolucao' }, null)); await al.waitForTimeout(1200);
t = await txt(al);
console.log('3 aluno vê comentário:', /Comentários do treinador/i.test(t), /sobe 2,5 kg/.test(t));
await al.evaluate(() => NAV.go('aluno', { s: 'semvinculo', navFrom: 'mensagens' }, null)); await al.waitForTimeout(1200);
t = await txt(al);
console.log('  aluno vê bloqueio:', /Esta conversa foi bloqueada/.test(t), '| não pode desbloquear:', !/Desbloquear/.test(t));
await al.evaluate(() => NAV.go('aluno', { s: 'semvinculo', navFrom: 'hoje' }, null)); await al.waitForTimeout(900);
await click(al, /^Começar treino$/); await al.waitForTimeout(300);
await (await al.$('#app [role=checkbox]')).click(); await al.waitForTimeout(2000);
console.log('  rascunho salvo no servidor:', srv.saved.length > 0 && /^L1_v1_s1@\d{4}-\d{2}-\d{2}$/.test(srv.saved[srv.saved.length - 1].p_key), '| com a série marcada:', JSON.stringify(srv.saved[srv.saved.length - 1] || {}).includes('"done":true'));
// 4. outro aparelho (sem nada guardado): retoma do servidor
const al2 = await mk('al');
await al2.evaluate(() => NAV.go('aluno', { s: 'semvinculo', navFrom: 'hoje' }, null)); await al2.waitForTimeout(1500);
t = await txt(al2);
console.log('4 outro aparelho oferece continuar:', /Continuar/i.test(t), '| rascunho não vira registro:', !/2 sessões registradas/.test(t));
console.log('errs', JSON.stringify(tr.errs.concat(al.errs, al2.errs)));
await b.close();
