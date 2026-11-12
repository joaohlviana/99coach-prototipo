// Fase 3: app do aluno — notas do treinador, descanso com pausa, retorno após o treino, aba Treinos com
// histórico previsto × realizado, mais de um treinador, versão nova durante a sessão, agenda com confirmação.
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const b = await chromium.launch();
const W = (v) => ({ template_id: 'manual', title: 'Força A', current_version: v, workout_versions: [{ version: v, sessions: [{ id: 's1', title: 'Treino A', estMin: 20, items: [{ exerciseId: 'agach', name: 'Agachamento', sets: 1, reps: '8', loadKg: 40, restS: 90, notes: 'Desça até 90 graus' }] }, { id: 's2', title: 'Treino B', estMin: 15, items: [{ exerciseId: 'sup', name: 'Supino', sets: 1, reps: '10', loadKg: 30, restS: 60, notes: null }] }], schedule: null, created_at: '2026-11-02T12:00:00Z' }] });
const lk = (id, name, v) => ({ id, status: 'ativo', origin: 'convite', prep: 'assigned', answers: {}, created_at: '2026-11-01T12:00:00Z', student_id: 'al', trainers: { slug: id, name, user_id: 'tr' + id }, workouts: [W(v || 1)] });
const srv = { links: [lk('L1', 'Marina Duarte')], sessions: [], fb: null, appts: [{ id: 'A1', link_id: 'L1', starts_at: '2026-11-20T13:00:00Z', ends_at: '2026-11-20T14:00:00Z', tz: 'America/Sao_Paulo', status: 'marcado', booked_by: 'aluno' }], canceled: [] };
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
await ctx.route('**/api/v1/**', (r) => r.abort());
await ctx.route('**/rycaxboqkkiopjdecgld.supabase.co/**', async (route) => {
  const rq = route.request(), u = new URL(rq.url());
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'content-type': 'application/json' };
  if (rq.method() === 'OPTIONS') return route.fulfill({ status: 200, headers: cors });
  const j = (s, d) => route.fulfill({ status: s, headers: cors, body: JSON.stringify(d) });
  const path = u.pathname.replace('/rest/v1/', ''), body = rq.postData() ? JSON.parse(rq.postData()) : {};
  if (path === 'links') return j(200, srv.links);
  if (path === 'sessions') return j(200, srv.sessions.filter((x) => !/link_id=eq\./.test(u.search) || u.search.includes(x.link_id)));
  if (path === 'rpc/submit_session') { srv.sessions.push({ id: 'S' + srv.sessions.length, link_id: body.p_link, session_key: body.p_key, started_at: '2026-11-12T10:00:00Z', submitted_at: '2026-11-12T10:40:00Z', set_logs: body.p_logs.map((x) => ({ item: x.item, set_no: x.set, reps: x.reps, load_kg: x.loadKg, exercise_id: x.exerciseId, exercise_name: x.name })), session_comments: [] }); return j(200, { receipt: 'ok' }); }
  if (path === 'rpc/student_session_feedback') { srv.fb = body; srv.sessions.find((x) => x.id === body.p_session).session_comments.push({ id: 'C1', side: 'aluno', body: 'Esforço ' + body.p_effort + '/10 · ' + body.p_body, created_at: '2026-11-12T10:45:00Z' }); return j(200, { comment: 'C1' }); }
  if (path === 'appointments') return j(200, srv.appts.filter((a) => a.status === 'marcado'));
  if (path === 'rpc/cancel_appointment') { srv.appts.forEach((a) => { if (a.id === body.p_id) a.status = 'cancelado'; }); srv.canceled.push(body.p_id); return j(200, { status: 'cancelado' }); }
  if (path === 'profiles') return j(200, [{ id: 'al', roles: ['aluno'] }]);
  return j(200, []);
});
const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 160)));
await p.goto('http://localhost:5173/', { waitUntil: 'load' }); await p.waitForTimeout(800);
await p.evaluate(() => { localStorage.setItem('c99.sessao', JSON.stringify({ access_token: 'tal', refresh_token: 'r', user: { id: 'al', email: 'al@x.com' } })); const C = PAGES.onboarding.Comp; STORE.saveOnb(Object.assign(C.prototype.base.call(C.prototype, 'aluno', ''), { name: 'Caio Prado', dadosSaved: true, conta: true, step: 'pronto', scn: '' })); });
await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1400);
const txt = () => p.evaluate(() => document.getElementById('app').innerText.replace(/\s+/g, ' '));
const press = async (re, sel) => { for (const h of await p.$$(sel || '#app button')) { const t = (await h.textContent()).trim(); if (re.test(t) && (await h.isVisible())) { await h.click(); await p.waitForTimeout(500); return t; } } return null; };
const aluno = async (nav) => { await p.evaluate((n) => NAV.go('aluno', { s: 'semvinculo', navFrom: n }, null), nav); await p.waitForTimeout(1000); return txt(); };
// 1. nota do treinador e descanso com pausa
await aluno('hoje'); await press(/^Começar treino$/);
let t = await txt();
console.log('1 nota do treinador na sessão:', /Nota de Marina: Desça até 90 graus/.test(t));
await p.fill('#ex-r0-0', '8'); await p.fill('#ex-l0-0', '40'); await (await p.$('#app [role=checkbox]')).click(); await p.waitForTimeout(600);
await press(/^Pausar$/); t = await txt();
console.log('  descanso pausado:', /Descanso pausado: 1:(2\d|30)/.test(t), '| retomar:', !!(await press(/^Retomar$/)), '| +30 s:', !!(await press(/^\+30 s$/)));
console.log('  estado de gravação visível:', /Salvando…|Salvo também na sua conta|salvo só neste aparelho|Guardado neste aparelho/.test(await txt()));
// 2. concluir e mandar retorno
await press(/^Concluir sessão$/); await p.waitForTimeout(800); t = await txt();
console.log('2 recibo pede retorno:', /Como foi o esforço/i.test(t));
await press(/^8\/10$/); await p.fill('#al-fb', 'Senti o joelho na última'); await press(/Enviar retorno para Marina/); await p.waitForTimeout(800);
console.log('  retorno enviado:', !!srv.fb && srv.fb.p_effort === 8 && /joelho/.test(srv.fb.p_body), /Retorno enviado/.test(await txt()));
// 3. Treinos: sessões e registros com previsto × realizado
t = await aluno('treinos');
console.log('3 aba Treinos é própria:', /Sessões do seu treino/.test(t), /Treino B/.test(t), /feita em/.test(t), /ainda não feita/.test(t));
await press(/^Ver registro$/); t = await txt();
console.log('  registro abre previsto × realizado:', /Agachamento — previsto 1 × 8 · 40 kg · feito 8×40kg/.test(t), /Você: Esforço 8\/10/.test(t));
// 4. versão nova durante uma sessão em andamento
await aluno('hoje'); await press(/^Começar treino$/); await (await p.$('#app [role=checkbox]')).click(); await p.waitForTimeout(300); await press(/^Pausar e sair$/);
srv.links = [lk('L1', 'Marina Duarte', 2)]; await p.evaluate(() => window.__refreshLinks()); await p.waitForTimeout(700);
t = await aluno('hoje');
console.log('4 aviso de versão nova:', /Treino atualizado/.test(t), /versão nova/.test(t));
await press(/Entendi, descartar/);
// 5. dois treinadores: escolha explícita
srv.links = [lk('L1', 'Marina Duarte', 2), lk('L2', 'Paulo Reis')]; await p.evaluate(() => window.__refreshLinks()); await p.waitForTimeout(700);
t = await aluno('hoje');
console.log('5 escolha de treinador:', /Você treina com:/.test(t), /Paulo Reis/.test(t));
await press(/^Paulo Reis$/); t = await aluno('mensagens');
console.log('  troca o contexto:', /Conversa com Paulo/i.test(t));
await press(/^Marina Duarte$/);
// 6. agenda: cancelar pede confirmação e dá recibo; fuso escrito
t = await aluno('hoje');
console.log('6 fuso escrito:', /fuso de Brasília/.test(t));
await press(/^Cancelar$/); t = await txt();
console.log('  pede confirmação:', /Cancelar o horário de/.test(t), '| nada cancelado ainda:', srv.canceled.length === 0);
await press(/^Cancelar horário$/, '.mod-sheet button'); await p.waitForTimeout(800); t = await txt();
console.log('  cancelado com recibo:', srv.canceled.length === 1, /cancelado às/.test(t));
console.log('errs', JSON.stringify(errs));
await b.close();
