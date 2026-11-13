// Avaliações reais (só quem foi aluno, uma por acompanhamento, resposta do treinador) e movimento do DS (hover, pressionado, entrada de estado).
// Servidor simulado com as regras do banco real conferidas em 13/11 (my_review_state, submit_review, reply_review).
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const b = await chromium.launch();
const SESS = [{ id: 's1', title: 'Treino A', estMin: 40, items: [{ exerciseId: 'agach', name: 'Agachamento', sets: 3, reps: '8', loadKg: 40, restS: 90, notes: null }] }];
const L1 = { id: 'L1', status: 'ativo', origin: 'convite', prep: 'assigned', answers: {}, created_at: '2026-11-01T12:00:00Z', student_id: 'al', trainers: { slug: 'marina', name: 'Marina Duarte', user_id: 'tr' }, workouts: [{ template_id: 'manual', title: 'Força', current_version: 1, workout_versions: [{ version: 1, sessions: SESS, schedule: null, created_at: '2026-11-11T12:00:00Z' }] }] };
const srv = { assign: [], log: [], eligible: false, review: null };
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
    if (path === 'rpc/my_review_state') { if (uid !== 'al') return j(403, { message: 'acompanhamento não encontrado' }); return j(200, { eligible: srv.eligible, reason: srv.eligible ? 'ok' : 'cedo', review: srv.review && { id: srv.review.id, rating: srv.review.rating, body: srv.review.body, status: srv.review.status, reply: srv.review.reply, at: srv.review.created_at } }); }
    if (path === 'rpc/submit_review') { if (uid !== 'al') return j(403, { message: 'acompanhamento não encontrado' }); if (!srv.eligible) return j(200, { saved: false, reason: 'cedo' }); if (!(body.p_rating >= 1 && body.p_rating <= 5)) return j(400, { message: 'nota_invalida' });
      srv.review = Object.assign(srv.review || { id: 'RV1', status: 'publicada', reply: null, created_at: '2026-11-13T12:00:00Z', link_id: 'L1' }, { rating: body.p_rating, body: body.p_body }); srv.revSaves = (srv.revSaves || 0) + 1; return j(200, { saved: true, id: 'RV1', status: 'publicada' }); }
    if (path === 'rpc/reply_review') { if (uid !== 'tr' || !srv.review) return j(403, { message: 'avaliação não encontrada' }); srv.review.reply = body.p_reply || null; return j(200, { reply: srv.review.reply }); }
    if (path === 'reviews') return j(200, uid === 'tr' && srv.review ? [srv.review] : []);
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
const al = await mk('AL', 'al');
await al.evaluate(() => NAV.go('aluno', {}, null)); await al.waitForTimeout(1500);
let t = await txt(al);
console.log('1 cedo demais: não oferece avaliar:', !/Avaliar Marina/.test(t));
srv.eligible = true;
await al.reload({ waitUntil: 'load' }); await al.waitForTimeout(1500); await al.evaluate(() => NAV.go('aluno', {}, null)); await al.waitForTimeout(1500); t = await txt(al);
console.log('2 elegível: convida a avaliar:', /Avaliar Marina/.test(t), /aparece no perfil público de Marina com o seu primeiro nome/.test(t));
await click(al, /^Escrever avaliação$/); await al.waitForTimeout(400);
await click(al, /^Publicar avaliação$/); await al.waitForTimeout(400); t = await txt(al);
console.log('  sem nota não envia:', /Escolha uma nota de 1 a 5/.test(t), !srv.review);
await al.evaluate(() => { const b = [...document.querySelectorAll('#app button.chip')].find((e) => e.getAttribute('aria-label') === '4 estrelas'); b.click(); }); await al.waitForTimeout(300);
await al.fill('#al-rv-t', 'Atenciosa, treino bem explicado.'); await al.waitForTimeout(300);
await click(al, /^Publicar avaliação$/); await al.waitForTimeout(1500); t = await txt(al);
console.log('3 publicada:', srv.review && srv.review.rating === 4 && srv.review.body === 'Atenciosa, treino bem explicado.', /Sua avaliação de Marina/.test(t), /4 estrelas · “Atenciosa, treino bem explicado\.”/.test(t));
// treinador vê e responde
const tr = await mk('TR', 'tr');
await tr.evaluate(() => NAV.go('treinador', { s: 'alunoreal', id: 'lk_L1' }, null)); await tr.waitForTimeout(1500); t = await txt(tr);
console.log('4 treinador vê a avaliação do aluno:', /Avaliação deste aluno 4 estrelas · “Atenciosa, treino bem explicado\.”/.test(t), /aparece no seu perfil público/.test(t));
await click(tr, /^Responder$/); await tr.waitForTimeout(300); await tr.fill('#tr-rv-t', 'Obrigada, Caio!'); await tr.waitForTimeout(300);
await click(tr, /^Publicar resposta$/); await tr.waitForTimeout(1500); t = await txt(tr);
console.log('  resposta publicada:', srv.review.reply === 'Obrigada, Caio!', /Sua resposta: “Obrigada, Caio!”/.test(t));
await al.reload({ waitUntil: 'load' }); await al.waitForTimeout(1500); await al.evaluate(() => NAV.go('aluno', {}, null)); await al.waitForTimeout(1500); t = await txt(al);
console.log('5 aluno vê a resposta e pode editar:', /Marina respondeu: “Obrigada, Caio!”/.test(t), /Editar avaliação/.test(t));
await click(al, /^Editar avaliação$/); await al.waitForTimeout(300);
await al.evaluate(() => { const b = [...document.querySelectorAll('#app button.chip')].find((e) => e.getAttribute('aria-label') === '5 estrelas'); b.click(); }); await al.waitForTimeout(300);
await click(al, /^Salvar avaliação$/); await al.waitForTimeout(1500);
console.log('  editar não cria outra:', srv.review.rating === 5 && srv.revSaves === 2);

// ---------- movimento do DS ----------
const css = (p, sel, prop, pseudo) => p.evaluate(([s, pr]) => { const e = document.querySelector(s); return e ? getComputedStyle(e)[pr] : null; }, [sel, prop]);
const dur = (v) => String(v || '').split(',').map((x) => parseFloat(x)).some((x) => x > 0);
console.log('6 transição em botão, chip, linha e campo:', dur(await css(tr, '#app .btn', 'transitionDuration')), dur(await css(tr, '#app .chip', 'transitionDuration')), dur(await css(tr, '#app .onb-secs__r', 'transitionDuration')), dur(await css(tr, '#app .input', 'transitionDuration')));
await click(al, /^Editar avaliação$/); await al.waitForTimeout(100);
await al.evaluate(() => { const b = [...document.querySelectorAll('#app button')].find((e) => /^Salvar avaliação$/.test(e.textContent.trim())); window.__b = b; });
const before = await al.evaluate(() => getComputedStyle(window.__b).scale);
await al.evaluate(() => window.__b.scrollIntoView({ block: 'center' })); const box = await al.evaluate(() => { const r = window.__b.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
await al.mouse.move(box[0], box[1]); await al.mouse.down(); await al.waitForTimeout(250);
const pressed = await al.evaluate(() => getComputedStyle(window.__b).scale); await al.mouse.move(5, 5); await al.mouse.up();
console.log('  botão pressionado encolhe:', before, '->', pressed, pressed !== before && parseFloat(pressed) < 1);
await click(al, /^Cancelar$/); await al.waitForTimeout(200); await click(al, /^Editar avaliação$/); await al.waitForTimeout(50);
// mudança de estado: um aviso que aparece entra animado; chip ligado tem animação de estado
await al.evaluate(() => { const ta = document.getElementById('al-rv-t'); ta.value = 'x'.repeat(1501); ta.dispatchEvent(new Event('input', { bubbles: true })); }); await al.waitForTimeout(200);
await click(al, /^Salvar avaliação$/); await al.waitForTimeout(60);
console.log('7 aviso entra animado:', await css(al, '#app .alert--risk', 'animationName'), '| chip ligado:', await css(al, '#app .chip.is-on', 'animationName'), '| selo:', await css(tr, '#app .badge', 'animationName'));
// quem pede menos movimento não recebe animação
const rm = await b.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' }); const q = await rm.newPage();
await q.goto('http://localhost:5173/', { waitUntil: 'load' }); await q.waitForTimeout(2500);
const d2 = await q.evaluate(() => { const e = document.querySelector('#app .btn, #app .chip'); const cs = getComputedStyle(e); return [cs.transitionDuration, cs.animationDuration]; });
console.log('8 menos movimento respeitado:', JSON.stringify(d2), d2.every((v) => String(v).split(',').every((x) => parseFloat(x) <= 0.001)));
console.log('errs', tr.errs, al.errs);
await b.close();
