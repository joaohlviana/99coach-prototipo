const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
const errs = [], calls = [];
p.on('pageerror', (e) => errs.push('PE ' + e.message));
await ctx.route('**/api/v1/**', (r) => r.abort());
await ctx.route('**/rycaxboqkkiopjdecgld.supabase.co/**', async (route) => {
  const rq = route.request(), u = new URL(rq.url());
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' };
  if (rq.method() === 'OPTIONS') return route.fulfill({ status: 200, headers: cors });
  if (u.pathname.startsWith('/storage/')) return route.abort();
  calls.push(rq.method() + ' ' + u.pathname + u.search.slice(0, 70) + ' ' + (rq.postData() || '').slice(0, 80));
  const j = (s, d) => route.fulfill({ status: s, headers: cors, body: d == null ? '' : JSON.stringify(d) });
  if (u.pathname === '/auth/v1/token') return j(200, { access_token: 'tok', refresh_token: 'ref', user: { id: 'u9', email: 'm@x.com' } });
  if (u.pathname === '/auth/v1/logout') return j(204, null);
  if (u.pathname === '/rest/v1/profiles') return j(200, [{ id: 'u9', roles: ['treinador'] }]);
  if (u.pathname === '/rest/v1/trainers' && rq.method() === 'GET') return j(200, [{ id: 't9', slug: 'marina', name: 'Marina Servidor', city_id: 4, regions: ['Centro'], formats: ['presencial', 'online'], languages: ['pt'], specialty: 'CrossFit', cref: '012345-G/PR', status: 'publicado' }]);
  if (u.pathname === '/rest/v1/trainers' && rq.method() === 'PATCH') return j(204, null);
  if (u.pathname === '/rest/v1/cities') return j(200, [{ name: 'Londrina', uf: 'PR' }]);
  if (u.pathname === '/rest/v1/trainer_sports') return j(200, [{ sport_slug: 'crossfit' }]);
  if (u.pathname === '/rest/v1/offers') return j(200, [{ title: 'Acompanhamento online', includes: 'Treino no app', format: 'online', price_cents: 20000, unit: 'mes', pricing_mode: 'recurring', flow: 'pedido' }]);
  return j(200, []);
});
await p.goto('http://localhost:5173/', { waitUntil: 'load' });
await p.waitForTimeout(800);
const vis = (sel) => p.evaluate((s) => [...document.querySelectorAll(s)].filter((e) => getComputedStyle(e).display !== 'none' && e.offsetParent !== null).length, sel);
const txt = () => p.evaluate(() => document.getElementById('app').innerText);
let t = await txt();
console.log('home produto: serviços inventados', /Serviços em/.test(t), '| programas prontos', /Programas prontos/.test(t), '| botões IA visíveis', await vis('#app .sx-ia, #app .sx-dia, #app .sx-iaq'), '| Rafael Lima', /Rafael Lima/.test(t));
// entrar com conta de treinador que já tem cadastro no servidor
await p.evaluate(() => NAV.go('onboarding', { flow: 'entrar' }, null));
await p.waitForTimeout(400);
await p.fill('#onb-email', 'm@x.com'); await p.fill('#onb-senha', 'senhacerta1');
for (const h of await p.$$('#app button')) { if ((await h.textContent()).trim() === 'Entrar' && (await h.isVisible()) && !(await h.evaluate((e) => /chip/.test(e.className)))) { await h.click(); break; } }
await p.waitForTimeout(1200);
console.log('cadastro retomado do servidor:', await p.evaluate(() => { const c = STORE.loadOnb('treinador'); return c && [c.name, c.city, Object.keys(c.sports || {}).join(','), c.published, c.services && c.services[0] && c.services[0].price].join(' | '); }), '| área:', await p.evaluate(() => ACCT.area()));
await p.evaluate(() => ACCT.go()); await p.waitForTimeout(500);
t = await txt();
console.log('painel: nome', /Marina Servidor/.test(t), '| item IA no menu', /Assistência de IA/.test(t));
// botão que leva a IA e tela inexistente
await p.evaluate(() => GO('IA01')); await p.waitForTimeout(200);
console.log('IA bloqueada:', await p.evaluate(() => document.getElementById('c99-aviso')?.textContent), '| hash', await p.evaluate(() => location.hash));
await p.evaluate(() => GO('XYZ99')); await p.waitForTimeout(200);
console.log('tela inexistente:', await p.evaluate(() => document.getElementById('c99-aviso')?.textContent), '| hash', await p.evaluate(() => location.hash));
// sair
await p.evaluate(() => NAV.go('treinador', { s: 'menu' }, null)); await p.waitForTimeout(300);
console.log('linha Sair no menu:', /Sair da conta/.test(await txt()));
await p.evaluate(() => GO('@sair'));
await p.waitForTimeout(1500);
console.log('depois de sair: área', await p.evaluate(() => window.ACCT && ACCT.area()), '| sessão', await p.evaluate(() => !!(window.CONTA && CONTA.session())), '| chaves c99 restantes', await p.evaluate(() => Object.keys(localStorage).filter((k) => /^c99\./.test(k))));
console.log(calls.map((c) => c.slice(0, 120)));
console.log('errs', errs);
await b.close();
