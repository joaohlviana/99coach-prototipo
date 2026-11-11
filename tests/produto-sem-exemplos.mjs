// Cadastro pela tela, com o servidor simulado nas mesmas respostas que o real deu no teste.
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
const errs = [], calls = [];
p.on('pageerror', (e) => errs.push('PE ' + e.message));
let roles = [];
await ctx.route('**/rycaxboqkkiopjdecgld.supabase.co/**', async (route) => {
  const rq = route.request(), u = new URL(rq.url());
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'content-type': 'application/json' };
  if (rq.method() === 'OPTIONS') return route.fulfill({ status: 200, headers: cors });
  if (u.pathname.startsWith('/storage/')) return route.abort();
  calls.push(rq.method() + ' ' + u.pathname + u.search.slice(0, 60) + ' ' + (rq.postData() || '').slice(0, 120));
  const j = (s, d) => route.fulfill({ status: s, headers: cors, body: d == null ? '' : JSON.stringify(d) });
  const body = rq.postData() ? JSON.parse(rq.postData()) : {};
  if (u.pathname === '/auth/v1/signup') {
    if (body.email === 'ja@existe.com') return j(422, { code: 422, msg: 'User already registered' });
    return j(200, { access_token: 'tok', refresh_token: 'ref', user: { id: 'u1', email: body.email, email_confirmed_at: 'agora' } });
  }
  if (u.pathname === '/auth/v1/token') return body.password === 'senhacerta1' ? j(200, { access_token: 'tok', refresh_token: 'ref', user: { id: 'u1', email: body.email } }) : j(400, { error: 'invalid_grant', error_description: 'Invalid login credentials' });
  if (u.pathname === '/rest/v1/profiles' && rq.method() === 'GET') return j(200, [{ id: 'u1', roles, display_name: 'X' }]);
  if (u.pathname === '/rest/v1/profiles' && rq.method() === 'PATCH') { if (body.roles) roles = body.roles; return j(204, null); }
  return j(200, []);
});
await ctx.route('**/api/v1/**', (route) => route.abort());
await p.goto('http://localhost:5173/#onboarding-treinador', { waitUntil: 'load' });
await p.waitForTimeout(800);
const st = () => p.evaluate(() => { const s = window.__onbState || {}; return [s.flow, s.step, s.conta, s.toast, s.emailExists, s.pwErr].join(' | '); });
const fill = async (name, email, pw) => {
  if (name !== null && (await p.$('#onb-nome'))) await p.fill('#onb-nome', name);
  await p.fill('#onb-email', email);
  await p.fill('#onb-senha', pw);
};
const btn = async (re) => { for (const h of await p.$$('#app button')) { const t = (await h.textContent()).trim(); const chip = await h.evaluate((e) => /chip/.test(e.className)); if (!chip && re.test(t) && (await h.isVisible())) return h; } return null; };
console.log('campo senha', !!(await p.$('#onb-senha')));
// senha curta
await fill('Marina Duarte', 'marina@teste.com', '123');
await (await p.$('#app .onb-checkrow')).click();
await (await btn(/^Criar conta$/)).click();
await p.waitForTimeout(300);
console.log('senha curta ->', await st());
// e-mail já existe
await fill('Marina Duarte', 'ja@existe.com', 'senhaboa123');
await (await btn(/^Criar conta$/)).click();
await p.waitForTimeout(500);
console.log('já existe ->', await st(), '| aviso:', await p.evaluate(() => /já tem conta/.test(document.getElementById('app').textContent)));
// cadastro certo
await fill('Marina Duarte', 'marina@teste.com', 'senhaboa123');
await (await btn(/^Criar conta$/)).click();
await p.waitForTimeout(900);
console.log('cadastro ->', await st(), '| papéis no servidor:', roles, '| sessão:', await p.evaluate(() => !!CONTA.session()));
// sair e entrar com senha errada / certa
await p.evaluate(() => { CONTA.signOut(); NAV.go('onboarding', { flow: 'entrar' }, null); });
await p.waitForTimeout(400);
console.log('tela entrar: botão', !!(await btn(/^Entrar$/)), '| esqueci', !!(await btn(/Esqueci a senha/)));
await fill(null, 'marina@teste.com', 'errada123');
await (await btn(/^Entrar$/)).click();
await p.waitForTimeout(500);
console.log('senha errada ->', await st());
await fill(null, 'marina@teste.com', 'senhacerta1');
await (await btn(/^Entrar$/)).click();
await p.waitForTimeout(900);
console.log('senha certa ->', await st(), '| sessão:', await p.evaluate(() => !!CONTA.session()), '| área:', await p.evaluate(() => ACCT.area()));
console.log(calls.filter((c) => !/storage/.test(c)).map((c) => c.slice(0, 160)));
console.log('errs', errs);
await b.close();
