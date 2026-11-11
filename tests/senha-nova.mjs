// Esqueci a senha: link do e-mail -> tela de senha nova -> servidor grava -> entra.
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const b = await chromium.launch(); const log = [];
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.route('**/api/v1/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[]}' }));
await ctx.route('**/rycaxboqkkiopjdecgld.supabase.co/**', async (route) => {
  const rq = route.request(), u = new URL(rq.url());
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'content-type': 'application/json' };
  if (rq.method() === 'OPTIONS') return route.fulfill({ status: 200, headers: cors });
  log.push(rq.method() + ' ' + u.pathname + u.search.slice(0, 60) + ' ' + (rq.postData() || '').slice(0, 60));
  if (u.pathname.endsWith('/profiles')) return route.fulfill({ status: 200, headers: cors, body: JSON.stringify([{ id: 'u9', roles: ['aluno'], display_name: 'Ana Souza' }]) });
  if (u.pathname === '/auth/v1/user') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ id: 'u9', email: 'ana@x.com' }) });
  if (u.pathname === '/auth/v1/recover') return route.fulfill({ status: 200, headers: cors, body: '{}' });
  return route.fulfill({ status: 200, headers: cors, body: '[]' });
});
const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 150)));
const txt = () => p.evaluate(() => document.getElementById('app').innerText.replace(/\s+/g, ' '));
const press = async (re) => { for (const h of await p.$$('#app button')) { const t = (await h.textContent()).trim(); if (re.test(t) && (await h.isVisible())) { await h.click(); return t; } } return null; };
// 1. pedir o link
await p.goto('http://localhost:5173/?demo=0#onboarding-entrar', { waitUntil: 'load' }); await p.waitForTimeout(900);
await p.fill('#onb-email', 'ana@x.com');
console.log('1 pediu link:', await press(/Esqueci|senha nova|Recuperar/i)); await p.waitForTimeout(600);
console.log('  aviso:', /enviamos um link/.test(await p.evaluate(() => document.body.innerText)), '|', log.filter((l) => /recover/.test(l))[0]);
// 2. chega pelo link
const jwt = 'x.' + Buffer.from(JSON.stringify({ sub: 'u9', email: 'ana@x.com' })).toString('base64url') + '.y';
await p.goto('about:blank');
await p.goto('http://localhost:5173/?demo=0#access_token=' + jwt + '&refresh_token=rr&type=recovery', { waitUntil: 'load' }); await p.waitForTimeout(1500);
let t = await txt();
console.log('2 tela:', await p.evaluate(() => location.hash), '|', /CRIE UMA SENHA NOVA/i.test(t), '| sem Google:', !/Continuar com Google/.test(t), '| não entrou sozinho:', !/Sem acompanhamento ainda/.test(t));
await p.fill('#onb-senha', '123'); await press(/^Salvar senha nova/); await p.waitForTimeout(400);
console.log('  senha curta barrada:', !log.some((l) => /PUT \/auth\/v1\/user/.test(l)));
await p.fill('#onb-senha', 'senha-nova-123'); await press(/^Salvar senha nova/); await p.waitForTimeout(1600);
console.log('3 servidor:', log.filter((l) => /PUT \/auth\/v1\/user/.test(l))[0]);
console.log('  depois:', await p.evaluate(() => location.hash + ' | pendente ' + CONTA.newPasswordPending() + ' | área ' + ACCT.area()), '|', (await txt()).slice(0, 120));
console.log('errs', errs);
await b.close();
