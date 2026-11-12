// Fase 2: convite → pedido → vínculo completo.
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const b = await chromium.launch();
const srv = { links: [], reqs: [], calls: [], inv: { state: 'valido', trainer: { name: 'Marina Duarte', city: 'Londrina, PR' }, service: 'Acompanhamento online', expiresAt: '2026-11-19T10:00:00Z' } };
const lk = (o) => Object.assign({ id: 'L1', status: 'ativo', origin: 'convite', prep: 'awaiting_client', prep_request_note: null, answers: {}, created_at: '2026-11-01T12:00:00Z', student_id: 'al', trainers: { slug: 'marina', name: 'Marina Duarte', user_id: 'tr' }, workouts: [] }, o);
async function mk(uid, role, logged = true) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.route('**/api/v1/**', (r) => r.abort());
  await ctx.route('**/rycaxboqkkiopjdecgld.supabase.co/**', async (route) => {
    const rq = route.request(), u = new URL(rq.url());
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'content-type': 'application/json' };
    if (rq.method() === 'OPTIONS') return route.fulfill({ status: 200, headers: cors });
    const j = (s, d) => route.fulfill({ status: s, headers: cors, body: JSON.stringify(d) });
    const path = u.pathname.replace('/rest/v1/', ''), body = rq.postData() ? JSON.parse(rq.postData()) : {};
    // mesmas regras do banco real (conferidas em 12/11): coluna inexistente, convite individual sem e-mail e chave de repetição curta são recusados
    if (path === 'sessions' && /submitted_at/.test(decodeURIComponent(u.search)) && !/submitted_at:received_at/.test(decodeURIComponent(u.search))) return route.fulfill({ status: 400, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' }, body: JSON.stringify({ message: 'column sessions.submitted_at does not exist' }) });
    if (path === 'invites' && rq.method() === 'POST') { const bb = JSON.parse(rq.postData() || '{}'); if (bb.kind === 'individual' && !bb.recipient_email) return route.fulfill({ status: 400, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' }, body: JSON.stringify({ message: 'new row for relation "invites" violates check constraint "invites_check"' }) }); }
    if (/^rpc\//.test(path) && rq.postData()) { const kk = JSON.parse(rq.postData()).p_idem; if (kk != null && (String(kk).length < 8 || String(kk).length > 200)) return route.fulfill({ status: 400, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' }, body: JSON.stringify({ message: 'chave de idempotência inválida' }) }); }
    if (/^rpc\//.test(path)) srv.calls.push(uid + ':' + path.slice(4) + ':' + JSON.stringify(body).slice(0, 120));
    if (path === 'links') return j(200, srv.links);
    if (path === 'requests') return j(200, srv.reqs);
    if (path === 'rpc/decide_request') { const r = srv.reqs.find((x) => x.id === body.p_id); r.status = body.p_decision; return j(200, { status: body.p_decision, changed: true }); }
    if (path === 'rpc/decline_request') { const r = srv.reqs.find((x) => x.id === body.p_id); r.status = 'recusado'; r.decline_reason = body.p_reason; return j(200, { status: 'recusado', changed: true }); }
    if (path === 'rpc/request_prep_more') { srv.links[0].prep = 'awaiting_client'; srv.links[0].prep_request_note = body.p_note; return j(200, { prep: 'awaiting_client', changed: true }); }
    if (path === 'rpc/change_link') { const m = { pausar: 'pausado', retomar: 'ativo', encerrar: 'encerrado' }; srv.links[0].status = m[body.p_action]; return j(200, { status: srv.links[0].status, changed: true }); }
    if (path === 'rpc/invite_preview') return j(200, srv.inv);
    if (path === 'rpc/accept_invite') return j(200, { outcome: srv.acceptOut || 'vinculo_ativo' });
    if (path === 'profiles') return j(200, /id=in/.test(u.search) ? [{ id: 'al', display_name: 'Caio Prado' }] : [{ id: uid, roles: [role] }]);
    return j(200, []);
  });
  const p = await ctx.newPage(); p.errs = []; p.on('pageerror', (e) => p.errs.push(e.message.slice(0, 160)));
  await p.goto('http://localhost:5173/', { waitUntil: 'load' }); await p.waitForTimeout(400);
  if (logged) await p.evaluate(([u, w]) => {
    localStorage.setItem('c99.sessao', JSON.stringify({ access_token: 't' + u, refresh_token: 'r', user: { id: u, email: u + '@x.com' } }));
    const C = PAGES.onboarding.Comp;
    STORE.saveOnb(Object.assign(C.prototype.base.call(C.prototype, w, ''), { name: u === 'tr' ? 'Marina Duarte' : 'Caio Prado', dadosSaved: true, conta: true, step: u === 'tr' ? 'hoje' : 'pronto', scn: '' }));
  }, [uid, role]);
  await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1300);
  return p;
}
const txt = (p) => p.evaluate(() => document.getElementById('app').innerText.replace(/\s+/g, ' '));
const press = async (p, re, sel) => { for (const h of await p.$$(sel || '#app button')) { const t = (await h.textContent()).trim(); if (re.test(t) && (await h.isVisible())) { await h.click(); await p.waitForTimeout(500); return t; } } return null; };
const pressD = (p, re) => press(p, re, '.mod-sheet button');
const go = async (p, hash) => { await p.evaluate((h) => { location.hash = h; }, hash); await p.goto(await p.evaluate(() => location.href)); await p.waitForTimeout(1300); return txt(p); };

// 1. convite para visitante: textos do plano e código fora do endereço
const vis = await mk('vis', 'aluno', false);
await vis.goto('http://localhost:5173/app#publico-convite-ABCDEFGH', { waitUntil: 'load' }); await vis.waitForTimeout(1500);
let t = await txt(vis);
console.log('1 convite:', /Treine com Marina Duarte/i.test(t), /Marina convidou você/.test(t), /Entrar e aceitar convite/.test(t), '| código fora do endereço:', !/ABCD/.test(await vis.evaluate(() => location.href)));
// 2. logado: "Usar outra conta" e confirmação com próximo passo
const al = await mk('al', 'aluno');
await al.goto('http://localhost:5173/app#publico-convite-ABCDEFGH', { waitUntil: 'load' }); await al.waitForTimeout(1500);
t = await txt(al);
console.log('2 logado vê a conta e pode trocar:', /Você está como al@x.com/.test(t), /Usar outra conta/.test(t));
await press(al, /18 anos/); srv.links = [lk()];
await press(al, /^Aceitar convite$/); await al.waitForTimeout(800); t = await txt(al);
console.log('  confirmação (REL04):', /Seu acompanhamento com Marina está confirmado/i.test(t), /Próximo passo: responder 3 perguntas/.test(t), /Responder a preparação/.test(t));
srv.inv = Object.assign({}, srv.inv, { state: 'usado' });
await al.goto('http://localhost:5173/app#publico-convite-ABCDEFGH', { waitUntil: 'load' }); await al.waitForTimeout(1500); t = await txt(al);
console.log('  link de novo: já aceito por você:', /já foi aceito por você/.test(t), /Abrir acompanhamento/.test(t), '| não diz "já foi usado":', !/já foi usado/.test(t));
// 3. treinador pede complemento; aluno vê o pedido e as respostas anteriores
srv.links = [lk({ prep: 'awaiting_review', answers: { objetivo: 'Força', dias: '3', local: 'Academia', limitacoes: 'nenhuma' } })];
const tr = await mk('tr', 'treinador');
await tr.evaluate(() => GO('H05', { id: 'lk_L1' })); await tr.waitForTimeout(1200);
await press(tr, /^Pedir complemento$/); await tr.fill('#tr-more', 'Qual academia e que horário?'); await press(tr, /Enviar pedido de complemento/); await tr.waitForTimeout(600);
console.log('3 complemento enviado:', srv.calls.some((c) => /tr:request_prep_more/.test(c)));
await al.evaluate(() => window.__refreshLinks()); await al.waitForTimeout(600);
await al.evaluate(() => NAV.go('aluno', {}, null)); await al.waitForTimeout(900); t = await txt(al);
console.log('  aluno vê o pedido:', /Marina pediu um complemento/i.test(t), /Qual academia e que horário/.test(t), '| respostas mantidas:', await al.evaluate(() => [...document.querySelectorAll('#app textarea, #app input')].some((e) => e.value === 'Academia')));
// 4. aluno pausa, retoma e encerra sem depender do treinador
srv.links[0].prep = 'assigned';
await al.evaluate(() => window.__refreshLinks()); await al.waitForTimeout(600); await al.evaluate(() => NAV.go('aluno', {}, null)); await al.waitForTimeout(900);
await press(al, /^Pausar$/); t = await txt(al);
console.log('4 o que muda ao pausar:', /Veja o que muda ao pausar/.test(t), /vaga continua sua/.test(t));
await press(al, /^Pausar acompanhamento$/); await al.waitForTimeout(800);
console.log('  pausou:', srv.links[0].status === 'pausado');
await al.evaluate(() => NAV.go('aluno', {}, null)); await al.waitForTimeout(800);
await press(al, /^Retomar$/); await al.waitForTimeout(800);
console.log('  retomou:', srv.links[0].status === 'ativo');
await al.evaluate(() => NAV.go('aluno', {}, null)); await al.waitForTimeout(800);
await press(al, /^Encerrar$/); await press(al, /^Encerrar acompanhamento$/); await al.waitForTimeout(1200);
console.log('  encerrou:', srv.links[0].status === 'encerrado');
// 5. pedido: aluno cancela; treinador recusa com motivo e aluno vê
srv.links = [];
srv.reqs = [{ id: 'R1', status: 'pendente', message: 'Quero', created_at: '2026-11-10T21:00:00Z', expires_at: '2026-11-12T21:00:00Z', student_id: 'al', trainers: { slug: 'marina', name: 'Marina Duarte', user_id: 'tr' }, offers: null, decline_reason: null }];
await al.evaluate(() => window.__refreshLinks()); await al.waitForTimeout(700); await al.evaluate(() => NAV.go('aluno', {}, null)); await al.waitForTimeout(900);
await press(al, /^Cancelar pedido$/); await pressD(al, /^Cancelar pedido$/); await al.waitForTimeout(700);
console.log('5 aluno cancelou:', srv.reqs[0].status === 'cancelado');
srv.reqs[0].status = 'pendente';
await tr.evaluate(() => window.__refreshLinks()); await tr.waitForTimeout(800);
await tr.evaluate(() => NAV.go('treinador', { s: 'pedidos' }, null)); await tr.waitForTimeout(900);
await press(tr, /^Recusar$/); await press(tr, /Fora da minha região/); await press(tr, /^Recusar pedido$/); await tr.waitForTimeout(800);
console.log('  treinador recusou com motivo:', srv.reqs[0].status === 'recusado', /Londrina|região|interesse/.test(srv.reqs[0].decline_reason || ''));
await al.evaluate(() => window.__refreshLinks()); await al.waitForTimeout(700); await al.evaluate(() => NAV.go('aluno', {}, null)); await al.waitForTimeout(900); t = await txt(al);
console.log('  aluno vê o motivo:', /Recusado/.test(t), /motivo: “/.test(t));
// 6. pedido sobrevive a entrar
await vis.evaluate(() => { localStorage.setItem('c99.depoisEntrar', '#publico-pedir-aguinaldo-siqueira-bb5ba0c0'); localStorage.setItem('c99.depoisEntrarAte', String(Date.now() + 1e6)); });
console.log('6 intenção guardada para depois de entrar:', await vis.evaluate(() => localStorage.getItem('c99.depoisEntrar')) === '#publico-pedir-aguinaldo-siqueira-bb5ba0c0');
console.log('errs', JSON.stringify(al.errs.concat(tr.errs, vis.errs)));
await b.close();
