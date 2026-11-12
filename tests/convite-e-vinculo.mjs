// Percurso do convite com servidor simulado: treinador cria → aluno abre o link → entra → aceita → vínculo dos dois lados.
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const b = await chromium.launch();
const srv = { invites: [], links: [], adult: {}, roles: { tr: ['treinador'], al: [] } };
async function mk(who) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.route('**/api/v1/**', (r) => r.abort());
  await ctx.route('**/rycaxboqkkiopjdecgld.supabase.co/**', async (route) => {
    const rq = route.request(), u = new URL(rq.url());
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' };
    if (rq.method() === 'OPTIONS') return route.fulfill({ status: 200, headers: cors });
    if (u.pathname.startsWith('/storage/')) return route.abort();
    const j = (s, d) => route.fulfill({ status: s, headers: cors, body: d == null ? '' : JSON.stringify(d) });
    const body = rq.postData() ? JSON.parse(rq.postData()) : {};
    const auth = rq.headers()['authorization'] || '';
    const uid = /tok-tr/.test(auth) ? 'tr' : (/tok-al/.test(auth) ? 'al' : null);
    srv.log.push(who + ' ' + rq.method() + ' ' + u.pathname.replace('/rest/v1/', '') + ' ' + (rq.postData() || '').slice(0, 90));
    if (u.pathname === '/auth/v1/token') return j(200, { access_token: 'tok-al', refresh_token: 'r', user: { id: 'al', email: body.email } });
    if (u.pathname === '/rest/v1/trainers' && rq.method() === 'GET') return j(200, uid === 'tr' ? [{ id: 'T1', slug: 'marina' }] : []);
    if (u.pathname === '/rest/v1/invites' && rq.method() === 'POST') { srv.invites.push(Object.assign({ status: 'ativo' }, body)); return j(201, null); }
    if (u.pathname === '/rest/v1/rpc/invite_preview') { const i = srv.invites.find((x) => x.code === body.p_code); return j(200, i ? { code: i.code, kind: 'individual', trainer: { slug: 'marina', name: 'Marina Duarte', photo: null, credential: 'CREF informado', city: 'Londrina, PR' }, service: i.service, state: i.status === 'ativo' ? 'valido' : 'usado', expiresAt: '2026-11-17T12:00:00Z' } : { state: 'revogado' }); }
    if (u.pathname === '/rest/v1/profiles' && rq.method() === 'PATCH') { if (body.adult_confirmed_at) srv.adult[uid] = true; if (body.roles) srv.roles[uid] = body.roles; return j(204, null); }
    if (u.pathname === '/rest/v1/profiles' && rq.method() === 'GET') { if (/id=in/.test(u.search)) return j(200, [{ id: 'al', display_name: 'Caio Prado' }]); return j(200, [{ id: uid, roles: srv.roles[uid] || [] }]); }
    if (u.pathname === '/rest/v1/rpc/accept_invite') {
      if (!srv.adult[uid]) return j(200, { outcome: 'idade_nao_confirmada', relationshipId: null, next: null });
      const i = srv.invites.find((x) => x.code === body.p_code); if (!i) return j(200, { outcome: 'revogado' });
      if (i.status !== 'ativo') return j(200, { outcome: 'ja_ativo', relationshipId: 'L1', next: null });
      i.status = 'aceito'; srv.links.push({ id: 'L1', status: 'ativo', origin: 'convite', prep: 'awaiting_client', created_at: '2026-11-10T12:00:00Z', student_id: 'al', trainers: { slug: 'marina', name: 'Marina Duarte', user_id: 'tr' } });
      return j(200, { outcome: 'vinculo_ativo', relationshipId: 'L1', next: '/app' });
    }
    if (u.pathname === '/rest/v1/links') return j(200, srv.links);
    return j(200, []);
  });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load|ERR_/.test(m.text())) errs.push(m.text().slice(0, 160)); });
  p.errs = errs;
  return p;
}
srv.log = [];
const txt = (p) => p.evaluate(() => document.getElementById('app').innerText.replace(/\s+/g, ' '));
const click = async (p, re) => { for (const h of await p.$$('#app button')) { const t = (await h.textContent()).trim(); if (re.test(t) && (await h.isVisible()) && !(await h.evaluate((e) => /chip/.test(e.className)))) { await h.click(); return t; } } return null; };

// ---- treinador cria o convite ----
const tr = await mk('TR');
await tr.goto('http://localhost:5173/', { waitUntil: 'load' }); await tr.waitForTimeout(600);
await tr.evaluate(() => { localStorage.setItem('c99.sessao', JSON.stringify({ access_token: 'tok-tr', refresh_token: 'r', user: { id: 'tr', email: 't@x.com' } })); });
await tr.reload({ waitUntil: 'load' }); await tr.waitForTimeout(600);
await tr.evaluate(() => { const C = PAGES.onboarding.Comp; STORE.saveOnb(Object.assign(C.prototype.base.call(C.prototype, 'treinador', ''), { name: 'Marina Duarte', dadosSaved: true, conta: true, step: 'hoje', scn: '' })); NAV.go('treinador', { s: 'convidar' }, null); });
await tr.waitForTimeout(500);
const inputs = await tr.$$('#app input');
await inputs[0].fill('Caio Prado'); await inputs[1].fill('caio@exemplo.com');
console.log('criar:', await click(tr, /Criar convite|Gerar convite|Criar link/));
await tr.waitForTimeout(800);
const link = await tr.evaluate(() => { const m = document.getElementById('app').innerText.match(/https?:\/\/\S+#publico-convite-[A-Z0-9]+/); return m && m[0]; });
console.log('link do convite:', link, '| convites no servidor:', srv.invites.map((i) => i.code + ' ' + i.recipient_name + ' ' + i.kind));

// ---- aluno abre o link sem conta ----
const al = await mk('AL');
await al.goto(link, { waitUntil: 'load' }); await al.waitForTimeout(900);
let t = await txt(al);
console.log('aluno vê:', /Marina Duarte/.test(t), /Criar conta para aceitar/.test(t), /Entrar e aceitar convite/.test(t));
await click(al, /^Entrar e aceitar convite$/); await al.waitForTimeout(500);
await al.fill('#onb-email', 'caio@exemplo.com'); await al.fill('#onb-senha', 'senhaboa123');
await click(al, /^Entrar$/); await al.waitForTimeout(1200);
t = await txt(al);
console.log('depois de entrar, volta ao convite:', await al.evaluate(() => location.hash), /Aceitar convite/.test(t));
await click(al, /Aceitar convite/); await al.waitForTimeout(300);
console.log('sem 18+ marcado:', /maiores de 18/.test(await txt(al)));
await al.click('#app .onb-checkrow'); await click(al, /Aceitar convite/); await al.waitForTimeout(1200);
t = await txt(al);
console.log('aceito:', /está confirmado/i.test(t), '| links salvos:', await al.evaluate(() => CONTA.cachedLinks().map((l) => l.mine + ':' + l.trainerName)));
await click(al, /Abrir meu acompanhamento/); await al.waitForTimeout(600);
t = await txt(al);
console.log('app do aluno:', t.slice(t.indexOf('VOCÊ E'), t.indexOf('VOCÊ E') + 160));
// ---- treinador vê o aluno ----
await tr.evaluate(() => { window.__refreshLinks(); }); await tr.waitForTimeout(800);
await tr.evaluate(() => NAV.go('treinador', { s: 'alunos' }, null)); await tr.waitForTimeout(400);
console.log('treinador vê Caio na lista:', /Caio Prado/.test(await txt(tr)));
console.log('aceite repetido (idempotente):', await al.evaluate(() => CONTA.acceptInvite(CONTA.cachedLinks().length ? 'X' : 'X').then((r) => r.data && r.data.outcome)));
console.log(srv.log.filter((l) => !/storage/.test(l)).map((l) => l.slice(0, 140)));
console.log('errs', tr.errs, al.errs);
await b.close();
