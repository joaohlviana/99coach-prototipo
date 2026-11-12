// Formulário de verdade: treinador envia ao aluno, aluno responde uma vez, treinador lê e marca revisado.
// Servidor simulado com as regras do banco real (conferidas em 12/11): mesma chave não duplica, responder de novo não muda, 5 pendentes no máximo.
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const b = await chromium.launch();
const L1 = { id: 'L1', status: 'ativo', origin: 'convite', prep: 'ready_to_assign', answers: {}, created_at: '2026-11-01T12:00:00Z', student_id: 'al', trainers: { slug: 'marina', name: 'Marina Duarte', user_id: 'tr' }, workouts: [] };
const srv = { assign: [], log: [], forms: [], idem: {}, prefs: {} };
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
    if (path === 'form_sends') { const m = /status=in\.\(([^)]*)\)/.exec(decodeURIComponent(u.search)); return j(200, srv.forms.filter((f) => !m || m[1].split(',').indexOf(f.status) >= 0)); }
    // avisos: mesma forma do banco real (tipo, de quem, quando; sem texto)
    if (path === 'rpc/my_notices') { const pf = srv.prefs[uid] || { muted: [], seen: false }; const mine = uid === 'tr' ? 'treinador' : 'aluno';
      const items = srv.forms.filter((f) => (mine === 'aluno' ? f.status === 'enviado' : f.status === 'respondido')).map((f) => ({ kind: 'formulario', link: 'L1', mine, who: mine === 'aluno' ? 'Marina Duarte' : 'Caio Prado', at: mine === 'aluno' ? f.sent_at : f.answered_at, n: 1, extra: f.status, new: !pf.seen }))
        .concat(mine === 'aluno' ? [{ kind: 'mensagem', link: 'L1', mine, who: 'Marina Duarte', at: '2026-11-12T11:00:00Z', n: 2, extra: null, new: !pf.seen }] : []).filter((n) => pf.muted.indexOf(n.kind) < 0);
      return j(200, { items, muted: pf.muted, seen_at: pf.seen ? '2026-11-12T15:00:00Z' : null }); }
    if (path === 'rpc/set_notice_prefs') { const pf = srv.prefs[uid] || (srv.prefs[uid] = { muted: [], seen: false }); if (body.p_muted) { if (body.p_muted.some((k) => ['mensagem', 'pedido', 'treino', 'registro', 'comentario', 'formulario', 'horario'].indexOf(k) < 0)) return j(400, { message: 'tipo_invalido' }); pf.muted = body.p_muted; } if (body.p_seen) pf.seen = true; return j(200, { muted: pf.muted }); }
    if (path === 'rpc/send_form') {
      if (uid !== 'tr') return j(403, { message: 'acompanhamento não encontrado' });
      if (srv.idem[body.p_idem]) return j(200, srv.idem[body.p_idem]);
      if (!Array.isArray(body.p_questions) || !body.p_questions.length) return j(400, { message: 'sem_perguntas' });
      if (srv.forms.filter((f) => f.status === 'enviado').length >= 5) return j(400, { message: 'muitos_formularios_pendentes' });
      const f = { id: 'f0000000-0000-4000-8000-00000000000' + srv.forms.length, link_id: 'L1', title: body.p_title, purpose: body.p_purpose, form_version: 1, questions: body.p_questions, status: 'enviado', answers: null, sent_at: '2026-11-12T12:00:00Z', answered_at: null, reviewed_at: null };
      srv.forms.unshift(f); return j(200, (srv.idem[body.p_idem] = { id: f.id, at: f.sent_at }));
    }
    if (path === 'rpc/answer_form') {
      const f = srv.forms.find((x) => x.id === body.p_send); if (!f || uid !== 'al') return j(403, { message: 'formulário não encontrado' });
      if (f.status !== 'enviado') return j(200, { changed: false, status: f.status });
      f.answers = body.p_answers; f.status = 'respondido'; f.answered_at = '2026-11-12T13:00:00Z'; return j(200, { changed: true, status: 'respondido' });
    }
    if (path === 'rpc/form_send_set') {
      const f = srv.forms.find((x) => x.id === body.p_send); if (!f || uid !== 'tr') return j(403, { message: 'formulário não encontrado' });
      if (body.p_status === 'cancelado' && f.status === 'enviado') f.status = 'cancelado';
      else if (body.p_status === 'revisado' && f.status === 'respondido') { f.status = 'revisado'; f.reviewed_at = '2026-11-12T14:00:00Z'; }
      else return j(200, { changed: false, status: f.status });
      return j(200, { changed: true, status: f.status });
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
const tr = await mk('TR', 'tr');
await tr.evaluate(() => NAV.go('treinador', { s: 'alunoreal', id: 'lk_L1' }, null)); await tr.waitForTimeout(1500);
let t = await txt(tr);
console.log('1 seção no aluno:', /Formulários Nenhum formulário enviado ainda/.test(t));
await click(tr, /^Enviar formulário$/); await tr.waitForTimeout(300);
await click(tr, /^Enviar para Caio$/); await tr.waitForTimeout(300); t = await txt(tr);
console.log('  sem nome não envia:', /Dê um nome ao formulário/.test(t), srv.forms.length === 0);
await click(tr, /^Check-in semanal$/); await tr.waitForTimeout(300);
console.log('  modelo preenche:', await tr.inputValue('#fm-title'), '|', (await tr.inputValue('#fm-qs')).split('\n').length, 'perguntas');
await click(tr, /^Enviar para Caio$/); await tr.waitForTimeout(1200); t = await txt(tr);
console.log('2 enviado:', srv.forms.length === 1 && srv.forms[0].questions.length === 3 && srv.forms[0].questions[0].id === 'q1', '| lista:', /Check-in semanal Aguardando Enviado em 12\/11 · aguardando resposta · 3 perguntas/i.test(t));
// aluno vê e responde
const al = await mk('AL', 'al');
await al.evaluate(() => NAV.go('aluno', {}, null)); await al.waitForTimeout(1500); t = await txt(al);
console.log('3 aluno vê:', /Formulários Check-in semanal Marina enviou em 12\/11 · Acompanhar como foi a sua semana/.test(t), /Como foi a sua semana de treino\?/.test(t));
await click(al, /^Enviar respostas para Marina$/); await al.waitForTimeout(300); t = await txt(al);
console.log('  vazio não envia:', /Responda pelo menos uma pergunta/.test(t), srv.forms[0].status === 'enviado');
// avisos do aluno: tipo e de quem, sem texto; silenciar e marcar como visto
await al.evaluate(() => NAV.go('publico', { s: 'avisos' }, null)); await al.waitForTimeout(1500); t = await txt(al);
console.log('  avisos do aluno:', /Marina enviou um formulário para você responder/.test(t), /2 mensagens não lidas de Marina/.test(t), /2 avisos novos/.test(t), '| sem texto de mensagem:', !/Treinei|secreta/.test(t));
await click(al, /^Marcar todos como vistos$/); await al.waitForTimeout(1200); t = await txt(al);
console.log('  marcar como vistos:', srv.prefs.al.seen === true, /Nada novo desde a última vez/.test(t));
await al.evaluate(() => { const b = [...document.querySelectorAll('#app button.chip')].find((e) => e.closest('li').textContent.includes('Mensagens')); b.click(); });
await al.waitForTimeout(1200); t = await txt(al);
console.log('  silenciar mensagens:', JSON.stringify(srv.prefs.al.muted), !/mensagens não lidas de Marina/.test(t), /Silenciado/.test(t), /Aviso por e-mail ou no celular ainda não existe/.test(t));
await click(al, /^Responder$/); await al.waitForTimeout(1200);
console.log('  aviso leva ao formulário:', /Como foi a sua semana de treino\?/.test(await txt(al)));
const ids = await al.$$eval('#app textarea[id^=fm-]', (e) => e.map((x) => x.id));
await al.fill('#' + ids[0], 'Treinei 3 vezes, foi boa.'); await al.waitForTimeout(300);
await al.reload({ waitUntil: 'load' }); await al.waitForTimeout(1500); await al.evaluate(() => NAV.go('aluno', {}, null)); await al.waitForTimeout(1500);
console.log('  rascunho sobrevive a recarregar:', (await al.inputValue('#' + ids[0])) === 'Treinei 3 vezes, foi boa.', /1 de 3 respondidas/.test(await txt(al)));
await click(al, /^Enviar respostas para Marina$/); await al.waitForTimeout(1200); t = await txt(al);
console.log('4 respondido:', srv.forms[0].status === 'respondido' && srv.forms[0].answers.q1 === 'Treinei 3 vezes, foi boa.' && !('q2' in srv.forms[0].answers), '| tela:', /Você respondeu em 12\/11 · Marina ainda não marcou como revisado/.test(t), '| rascunho apagado:', await al.evaluate(() => Object.keys(localStorage).filter((k) => /formRasc/.test(k)).length === 0));
// treinador lê e revisa
await tr.reload({ waitUntil: 'load' }); await tr.waitForTimeout(1500); await tr.evaluate(() => NAV.go('treinador', { s: 'alunoreal', id: 'lk_L1' }, null)); await tr.waitForTimeout(1500); t = await txt(tr);
await tr.evaluate(() => NAV.go('treinador', { s: 'hoje' }, null)); await tr.waitForTimeout(1500); t = await txt(tr);
console.log('  Hoje avisa:', /Respondeu "Check-in semanal" em 12\/11/i.test(t), /Revisar resposta/i.test(t));
await click(tr, /^Revisar resposta$/); await tr.waitForTimeout(1500); t = await txt(tr);
console.log('5 treinador vê resposta pendente de revisão:', /Para revisar Respondido em 12\/11 · ainda não revisado por você/i.test(t));
await click(tr, /^Ver respostas$/); await tr.waitForTimeout(300); t = await txt(tr);
console.log('  respostas:', /Como foi a sua semana de treino\? Treinei 3 vezes, foi boa\./.test(t), '| pergunta pulada não vira resposta:', /O que foi mais difícil\? Sem resposta/.test(t));
await click(tr, /^Marcar como revisado$/); await tr.waitForTimeout(1200); t = await txt(tr);
console.log('6 revisado:', srv.forms[0].status === 'revisado', /revisado em 12\/11/.test(t));
// cancelar um envio pendente
await click(tr, /^Enviar formulário$/); await tr.waitForTimeout(300); await tr.fill('#fm-title', 'Teste'); await tr.fill('#fm-qs', 'Pergunta única'); await tr.waitForTimeout(200);
await click(tr, /^Enviar para Caio$/); await tr.waitForTimeout(1200);
await click(tr, /^Cancelar envio$/); await tr.waitForTimeout(1200); t = await txt(tr);
console.log('7 cancelar:', srv.forms[0].status === 'cancelado', /Envio cancelado · Caio não vê mais/.test(t));
console.log('errs', tr.errs, al.errs);
await b.close();
