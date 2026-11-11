// Pedido de acompanhamento: busca ao vivo → perfil real → pedir → treinador aceita → vínculo.
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const b = await chromium.launch();
const srv = { reqs: [], links: [], log: [] };
const LIVE = { slug: 'marina-duarte-teste', name: 'Marina Duarte', initials: 'MD', photo: null, specialty: 'CrossFit', sports: ['crossfit'], city: { label: 'Londrina, PR' }, formats: ['presencial', 'online'], imported: false, receivesRequests: true, headlineOffers: [], publishedAt: '2026-11-10' };
async function mk(who, tok, uid, wantRole) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.route('**/api/v1/search**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [LIVE], nextCursor: null }) }));
  await ctx.route('**/api/v1/trainers/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(Object.assign({}, LIVE, { role: 'Treinadora de CrossFit', pitch: 'Treino adultos iniciantes.', offers: [{ title: 'Acompanhamento online', priceCents: 20000, unit: 'mes' }], credentials: [], serviceArea: [] })) }));
  await ctx.route('**/rycaxboqkkiopjdecgld.supabase.co/**', async (route) => {
    const rq = route.request(), u = new URL(rq.url());
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' };
    if (rq.method() === 'OPTIONS') return route.fulfill({ status: 200, headers: cors });
    if (u.pathname.startsWith('/storage/')) return route.abort();
    const j = (s, d) => route.fulfill({ status: s, headers: cors, body: d == null ? '' : JSON.stringify(d) });
    const body = rq.postData() ? JSON.parse(rq.postData()) : {};
    const path = u.pathname.replace('/rest/v1/', '');
    srv.log.push(who + ' ' + rq.method() + ' ' + path + u.search.slice(0, 60) + ' ' + (rq.postData() || '').slice(0, 100));
    if (path === 'trainers') return j(200, [{ id: 'T1', offers: [{ id: 'OF1', key: 'principal' }] }]);
    if (path === 'requests' && rq.method() === 'POST') {
      if (srv.reqs.some((r) => r.status === 'pendente')) return j(409, { message: 'duplicate key value violates unique constraint "requests_one_pending"' });
      srv.reqs.push({ id: 'R1', status: 'pendente', message: body.message, created_at: '2026-11-10T21:00:00Z', expires_at: '2026-11-12T21:00:00Z', student_id: 'al', trainers: { slug: LIVE.slug, name: 'Marina Duarte', user_id: 'tr' }, offers: { key: 'principal', title: 'Acompanhamento online', price_cents: 20000, unit: 'mes' } });
      return j(201, null);
    }
    if (path === 'requests') return j(200, srv.reqs);
    if (path === 'rpc/decide_request') {
      const r = srv.reqs.find((x) => x.id === body.p_id); r.status = body.p_decision;
      if (body.p_decision === 'aceito') srv.links.push({ id: 'L9', status: 'ativo', origin: 'pedido', prep: 'awaiting_client', answers: {}, created_at: '2026-11-10T21:05:00Z', student_id: 'al', trainers: { slug: LIVE.slug, name: 'Marina Duarte', user_id: 'tr' }, workouts: [] });
      return j(200, { ok: true });
    }
    if (path === 'links') return j(200, srv.links);
    if (path === 'profiles') return j(200, /id=in/.test(u.search) ? [{ id: 'al', display_name: 'Caio Prado' }] : [{ id: uid, roles: [wantRole] }]);
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
  }, [tok, uid, wantRole]);
  await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1600);
  return p;
}
const txt = (p) => p.evaluate(() => document.getElementById('app').innerText.replace(/\s+/g, ' '));
const click = async (p, re) => { for (const h of await p.$$('#app button')) { const t = (await h.textContent()).trim(); if (re.test(t) && (await h.isVisible()) && !(await h.evaluate((e) => /chip/.test(e.className)))) { await h.click(); return t; } } return null; };
const al = await mk('AL', 'tok-al', 'al', 'aluno');
console.log('1 treinador ao vivo no catálogo:', await al.evaluate(() => REAL.isLive('marina-duarte-teste') && REAL.home()[0].name));
await al.evaluate(() => NAV.go('perfil', { id: 'marina-duarte-teste' }, null)); await al.waitForTimeout(900);
let t = await txt(al);
console.log('2 perfil:', /Pedir acompanhamento/.test(t), /Acompanhamento online · R\$ 200 \/ mês/.test(t), /Pedido não é vínculo/.test(t));
await click(al, /^Pedir acompanhamento$/); await al.waitForTimeout(500);
await al.fill('#pd-msg', 'Quero treinar 3x por semana.');
await click(al, /Enviar pedido/); await al.waitForTimeout(200);
console.log('3 sem 18+:', /maiores de 18/.test(await txt(al)));
await al.click('#app .onb-checkrow'); await click(al, /Enviar pedido/); await al.waitForTimeout(1200);
t = await txt(al); console.log('  enviado:', /Pedido enviado a Marina/.test(t), '| no servidor:', srv.reqs.length, srv.reqs[0] && srv.reqs[0].message);
await al.evaluate(() => NAV.go('aluno', {}, null)); await al.waitForTimeout(800);
t = await txt(al); console.log('4 aluno vê pedido:', /Seus pedidos/.test(t), /Aguardando resposta/.test(t));
const tr = await mk('TR', 'tok-tr', 'tr', 'treinador');
await tr.evaluate(() => NAV.go('treinador', { s: 'pedidos' }, null)); await tr.waitForTimeout(700);
t = await txt(tr); console.log('5 treinador vê pedido:', /Caio Prado/.test(t), /Quero treinar 3x/.test(t), /R\$ 200/.test(t));
await click(tr, /^Aceitar/); await tr.waitForTimeout(300);
{
  const bs = await tr.$$('#app button');
  for (const h of bs.reverse()) { if ((await h.textContent()).trim() === 'Aceitar pedido' && (await h.isVisible())) { await h.click({ force: true }); break; } }
}
await tr.waitForTimeout(1200);
console.log('  decidido:', srv.reqs[0].status, '| vínculo criado:', srv.links.length);
await tr.evaluate(() => NAV.go('treinador', { s: 'alunos' }, null)); await tr.waitForTimeout(600);
console.log('  Caio na lista:', /Caio Prado/.test(await txt(tr)));
await al.evaluate(() => { window.__refreshLinks(); }); await al.waitForTimeout(900);
await al.evaluate(() => NAV.go('aluno', {}, null)); await al.waitForTimeout(500);
t = await txt(al); console.log('6 aluno conectado:', /VOCÊ E MARINA ESTÃO CONECTADOS/.test(t));
console.log(srv.log.filter((l) => /requests|decide/.test(l)).map((l) => l.slice(0, 140)));
console.log('errs', al.errs, tr.errs);
await b.close();
