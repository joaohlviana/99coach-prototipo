// Agenda e pausa/encerramento com servidor simulado.
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const b = await chromium.launch();
const L1 = { id: 'L1', status: 'ativo', origin: 'convite', prep: 'assigned', answers: {}, created_at: '2026-11-01T12:00:00Z', student_id: 'al', trainers: { slug: 'marina', name: 'Marina Duarte', user_id: 'tr' }, workouts: [] };
const srv = { rules: [], appts: [], log: [], linkCalls: [] };
async function mk(who, tok, uid) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.route('**/api/v1/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[]}' }));
  await ctx.route('**/rycaxboqkkiopjdecgld.supabase.co/**', async (route) => {
    const rq = route.request(), u = new URL(rq.url());
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' };
    if (rq.method() === 'OPTIONS') return route.fulfill({ status: 200, headers: cors });
    if (u.pathname.startsWith('/storage/')) return route.abort();
    const j = (s, d) => route.fulfill({ status: s, headers: cors, body: d == null ? '' : JSON.stringify(d) });
    const body = rq.postData() ? JSON.parse(rq.postData()) : {};
    const path = u.pathname.replace('/rest/v1/', '');
    srv.log.push(who + ' ' + rq.method() + ' ' + path + ' ' + (rq.postData() || '').slice(0, 120));
    if (path === 'links') return j(200, L1.status === 'encerrado' ? [] : [L1]);
    if (path === 'requests') return j(200, []);
    if (path === 'profiles') return j(200, /id=in/.test(u.search) ? [{ id: 'al', display_name: 'Caio Prado' }] : [{ id: uid, roles: [uid === 'tr' ? 'treinador' : 'aluno'] }]);
    if (path === 'trainers') return j(200, [{ id: 'T1' }]);
    if (path === 'availability_rules') return j(200, srv.rules.map((r) => ({ weekday: r.weekday, start_min: r.startMin, end_min: r.endMin, slot_min: r.slotMin, tz: 'America/Sao_Paulo' })));
    if (path === 'rpc/set_availability') { srv.rules = body.p_rules; return j(200, null); }
    if (path === 'rpc/free_slots') return j(200, srv.rules.length ? [{ starts_at: '2026-11-11T10:00:00Z', ends_at: '2026-11-11T11:00:00Z', tz: 'America/Sao_Paulo' }, { starts_at: '2026-11-11T11:00:00Z', ends_at: '2026-11-11T12:00:00Z', tz: 'America/Sao_Paulo' }] : []);
    if (path === 'rpc/book_slot') { if (L1.status !== 'ativo') return j(200, { outcome: 'vinculo_pausado' }); srv.appts.push({ id: 'A1', link_id: 'L1', starts_at: body.p_starts_at, ends_at: body.p_starts_at, tz: 'America/Sao_Paulo', status: 'marcado', booked_by: 'aluno' }); return j(200, { outcome: 'marcado', id: 'A1' }); }
    if (path === 'appointments') return j(200, srv.appts.filter((a) => a.status === 'marcado'));
    if (path === 'rpc/cancel_appointment') { srv.appts.forEach((a) => { if (a.id === body.p_id) a.status = 'cancelado'; }); return j(200, null); }
    if (path === 'rpc/change_link') { srv.linkCalls.push(body.p_action + ':' + body.p_reason); if (body.p_action === 'pausar') return j(400, { message: 'invalid action' }); L1.status = { pausado: 'pausado', retomar: 'ativo', retomado: 'ativo', encerrar: 'encerrado', encerrado: 'encerrado' }[body.p_action]; return j(200, null); }
    if (path === 'sessions' || path === 'messages') return j(200, []);
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
const click = async (p, re, last) => { const bs = await p.$$('#app button'); if (last) bs.reverse(); for (const h of bs) { const t = (await h.textContent()).trim(); if (re.test(t) && (await h.isVisible()) && !(await h.evaluate((e) => /chip/.test(e.className) && !/seg|slot/.test(e.parentElement.className)))) { await h.click({ force: true }); return t; } } return null; };
const tr = await mk('TR', 'tok-tr', 'tr');
// 1. agenda do treinador pelo menu
await tr.evaluate(() => GO('TRE20')); await tr.waitForTimeout(800);
console.log('1 agenda real:', await tr.evaluate(() => location.hash), /Disponibilidade semanal/.test(await txt(tr)));
const days = await tr.$$('#app .onb-checkrow'); await days[0].click(); await days[2].click();
await tr.fill('#av-f1', '7:00'); await tr.fill('#av-t1', '6:00');
await click(tr, /Salvar disponibilidade/); await tr.waitForTimeout(300);
console.log('  horário inválido:', /fim depois do início/.test(await txt(tr)));
await tr.fill('#av-t1', '12:00'); await click(tr, /Salvar disponibilidade/); await tr.waitForTimeout(800);
console.log('  salvo:', JSON.stringify(srv.rules));
// 2. aluno marca horário
const al = await mk('AL', 'tok-al', 'al');
await al.evaluate(() => NAV.go('aluno', {}, null)); await al.waitForTimeout(700);
await click(al, /Ver horários livres/); await al.waitForTimeout(700);
let t = await txt(al); console.log('2 horários livres:', (t.match(/qua\.?,? 11\/11/gi) || []).length);
const chips = await al.$$('#app .seg .chip'); await chips[0].click(); await al.waitForTimeout(900);
t = await txt(al); console.log('  marcado:', srv.appts.length, /marcado por você/.test(t));
await tr.evaluate(() => { NAV.go('treinador', { s: 'hoje' }, null); }); await tr.waitForTimeout(200);
await tr.evaluate(() => GO('TRE20')); await tr.waitForTimeout(800);
console.log('  treinador vê:', /Caio Prado/.test(await txt(tr)));
// 3. pausa (com nome alternativo da ação), retomada, encerramento
await tr.evaluate(() => GO('H05', { id: 'lk_L1' })); await tr.waitForTimeout(800);
await click(tr, /^Pausar$/); await tr.waitForTimeout(200);
await click(tr, /^Pausar vínculo$/, true); await tr.waitForTimeout(1200);
console.log('3 pausado:', L1.status, srv.linkCalls.join(' '), /Pausado:/.test(await txt(tr)));
await click(al, /Ver horários livres/); await al.waitForTimeout(600);
const chips2 = await al.$$('#app .seg .chip'); if (chips2[1]) await chips2[1].click(); await al.waitForTimeout(800);
console.log('  marcar pausado bloqueado:', srv.appts.length === 1);
await click(tr, /^Retomar$/); await tr.waitForTimeout(1000);
console.log('  retomado:', L1.status);
await click(tr, /^Encerrar vínculo$/); await tr.waitForTimeout(200);
await click(tr, /^Encerrar vínculo$/, true); await tr.waitForTimeout(1500);
console.log('  encerrado:', L1.status, '| volta à lista:', await tr.evaluate(() => location.hash), '| Caio fora da lista:', !/Caio Prado/.test(await txt(tr)));
await al.evaluate(() => window.__refreshLinks()); await al.waitForTimeout(900);
await al.evaluate(() => NAV.go('aluno', {}, null)); await al.waitForTimeout(500);
console.log('4 aluno sem vínculo:', /AINDA SEM TREINADOR/.test(await txt(al)));
console.log('errs', tr.errs, al.errs);
await b.close();
