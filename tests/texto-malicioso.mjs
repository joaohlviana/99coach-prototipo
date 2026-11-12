import { linha, ehCatalogo } from './_banco.mjs';
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const b = await chromium.launch();
const EV = '<img src=x onerror="window.__x=(window.__x||0)+1">';
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const item = { slug: 'mal-1', name: 'Mal ' + EV, initials: 'MM', photo: null, specialty: 'CrossFit ' + EV, sports: ['crossfit'], city: { label: 'Londrina, PR' }, formats: ['presencial', 'online'], imported: false, receivesRequests: true, headlineOffers: [], publishedAt: '2026-11-10' };
await ctx.route('**/api/v1/search**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [item], nextCursor: null }) }));
await ctx.route('**/api/v1/trainers/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(Object.assign({}, item, { role: 'Treinador ' + EV, pitch: 'Bio ' + EV, offers: [{ title: 'Plano ' + EV, priceCents: 20000, unit: 'mes' }], credentials: [], serviceArea: [], externalHandle: EV })) }));
await ctx.route('**/rycaxboqkkiopjdecgld.supabase.co/**', async (route) => {
  const rq = route.request(), u = new URL(rq.url());
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' };
  if (rq.method() === 'OPTIONS') return route.fulfill({ status: 200, headers: cors });
  const path = u.pathname.replace('/rest/v1/', '');
    // mesmas regras do banco real (conferidas em 12/11): coluna inexistente, convite individual sem e-mail e chave de repetição curta são recusados
    if (path === 'sessions' && /submitted_at/.test(decodeURIComponent(u.search)) && !/submitted_at:received_at/.test(decodeURIComponent(u.search))) return route.fulfill({ status: 400, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' }, body: JSON.stringify({ message: 'column sessions.submitted_at does not exist' }) });
    if (path === 'invites' && rq.method() === 'POST') { const bb = JSON.parse(rq.postData() || '{}'); if (bb.kind === 'individual' && !bb.recipient_email) return route.fulfill({ status: 400, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' }, body: JSON.stringify({ message: 'new row for relation "invites" violates check constraint "invites_check"' }) }); }
    if (/^rpc\//.test(path) && rq.postData()) { const kk = JSON.parse(rq.postData()).p_idem; if (kk != null && (String(kk).length < 8 || String(kk).length > 200)) return route.fulfill({ status: 400, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' }, body: JSON.stringify({ message: 'chave de idempotência inválida' }) }); }
  if (path === 'trainers' && ehCatalogo(u)) return route.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' }, body: JSON.stringify([linha(item, { role: 'Treinador ' + EV, pitch: 'Bio ' + EV, offers: [{ title: 'Plano ' + EV, priceCents: 20000, unit: 'mes' }], externalHandle: EV })]) });
  if (path === 'profiles') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify(/id=in/.test(u.search) ? [{ id: 'al', display_name: 'Aluno ' + EV }] : [{ id: 'tr', roles: ['treinador'] }]) });
  if (path === 'trainers') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify([{ id: 'T1' }]) });
  if (path === 'links') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify([{ id: 'L1', status: 'ativo', origin: 'convite', prep: 'assigned', answers: { objetivo: EV }, created_at: '2026-11-01T12:00:00Z', student_id: 'al', trainers: { slug: 'x', name: 'Tr ' + EV, user_id: 'tr' }, workouts: [] }]) });
  if (path === 'messages') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify([{ id: 'm1', link_id: 'L1', sender_id: 'al', body: 'Oi ' + EV, created_at: '2026-11-10T10:00:00Z' }]) });
  if (path === 'requests') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify([{ id: 'R1', status: 'pendente', message: 'Quero ' + EV, created_at: '2026-11-10T21:00:00Z', expires_at: '2026-11-22T21:00:00Z', student_id: 'al', trainers: { slug: 'x', name: 'Tr', user_id: 'tr' }, offers: { key: 'principal', title: 'Plano ' + EV, price_cents: 20000, unit: 'mes' } }]) });
  return route.fulfill({ status: 200, headers: cors, body: '[]' });
});
const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 120)));
await p.goto('http://localhost:5173/?demo=0', { waitUntil: 'load' }); await p.waitForTimeout(600);
await p.evaluate(() => { localStorage.setItem('c99.sessao', JSON.stringify({ access_token: 't', refresh_token: 'r', user: { id: 'tr', email: 'tr@x.com' } })); const C = PAGES.onboarding.Comp; STORE.saveOnb(Object.assign(C.prototype.base.call(C.prototype, 'treinador', ''), { name: 'Tr', dadosSaved: true, conta: true, step: 'hoje', scn: '' })); });
await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1800);
const visit = async (label, fn) => { await p.evaluate(fn); await p.waitForTimeout(1100); console.log(label, '| executou script:', await p.evaluate(() => window.__x || 0), '| texto aparece escapado:', await p.evaluate(() => /<img src=x/.test(document.getElementById('app').innerText))); };
await visit('home', () => NAV.go('home', {}, null));
await visit('esporte', () => NAV.go('esporte', { mod: 'CrossFit', city: '', fmt: 'Qualquer' }, null));
await visit('perfil', () => NAV.go('perfil', { id: 'mal-1' }, null));
await visit('alunos', () => GO('H04'));
await visit('aluno real + chat', () => GO('H05', { id: 'lk_L1' }));
await visit('pedidos', () => GO('REL06'));
await visit('busca', () => { NAV.go('home', {}, null); });
console.log('errs', errs);
await b.close();
