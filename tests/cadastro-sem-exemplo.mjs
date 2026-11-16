// Cadastro do treinador em conta real: sem textos de exemplo do protótipo, e a seção Básico com modalidades, cidade e formato ligados.
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await ctx.route('**/api/v1/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[]}' }));
await ctx.route('**/rycaxboqkkiopjdecgld.supabase.co/**', (r) => {
  const u = decodeURIComponent(r.request().url()), path = new URL(r.request().url()).pathname.replace('/rest/v1/', '');
  const j = (d) => r.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' }, body: JSON.stringify(d) });
  if (r.request().method() === 'OPTIONS') return j({});
  if (path === 'profiles') return j([{ id: 'tr', roles: ['treinador'] }]);
  if (path === 'trainers') return j([{ id: 'T1', status: 'rascunho', slug: 'm' }]);
  if (/functions\/v1/.test(u)) return j({ ok: true, real: true, conta: false, plano: 'essencial', status: null });
  return j([]);
});
const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 160)));
await p.goto('http://localhost:5173/', { waitUntil: 'load' }); await p.waitForTimeout(500);
await p.evaluate(() => { localStorage.setItem('c99.sessao', JSON.stringify({ access_token: 't', refresh_token: 'r', user: { id: 'tr', email: 'tr@x.com' } })); const C = PAGES.onboarding.Comp; STORE.saveOnb(Object.assign(C.prototype.base.call(C.prototype, 'treinador', ''), { name: 'Marina Duarte', city: 'Londrina, PR', dadosSaved: true, conta: true, step: 'hoje', scn: '' })); });
await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1500);
const T = () => p.evaluate(() => document.getElementById('app').innerText.replace(/\s+/g, ' '));
const press = async (re) => { await p.evaluate((src) => { const r = new RegExp(src); const x = [...document.querySelectorAll('#app button')].find((y) => y.offsetParent && r.test(y.innerText.trim())); if (x) x.click(); }, re.source); await p.waitForTimeout(800); };
await p.evaluate(() => GO('@onboarding', { flow: 'treinador' })); await p.waitForTimeout(1000);
await press(/Começar cadastro|Continuar cadastro/);
await p.evaluate(() => { const r = document.querySelector('#app .onb-secs__r'); if (r) r.click(); }); await p.waitForTimeout(800);
const mods = await p.evaluate(() => [...document.querySelectorAll('#app [aria-labelledby="cb-lmod"] button')].map((x) => x.innerText + (x.getAttribute('aria-pressed') === 'true' ? '*' : '')));
const fm = await p.evaluate(() => [...document.querySelectorAll('#app [aria-label="Formato"] button')].map((x) => x.innerText + (x.getAttribute('aria-pressed') === 'true' ? '*' : '')));
console.log('1 Básico com modalidades, cidade e formato:', mods.length >= 8 && mods.includes('CrossFit*'), await p.evaluate(() => document.querySelector('#cb-city').value) === 'Londrina, PR', fm.join(',') === 'Presencial*,Online');
console.log('  título sem texto de exemplo:', await p.evaluate(() => document.querySelector('#cb-tit').value) === '');
await p.evaluate(() => { const x = [...document.querySelectorAll('#app [aria-labelledby="cb-lmod"] button')].find((y) => y.innerText === 'Pilates'); if (x) x.click(); }); await p.waitForTimeout(400);
console.log('  marcar modalidade funciona:', await p.evaluate(() => [...document.querySelectorAll('#app [aria-labelledby="cb-lmod"] button')].find((y) => y.innerText === 'Pilates').getAttribute('aria-pressed')) === 'true');
let t = '';
for (let i = 0; i < 10; i++) { await press(/^Próxima/); t += ' ' + await T(); }
console.log('2 sem dados de exemplo nas seções:', !/thiago/i.test(t), !/Thiago Pereira/.test(t), !/Ana Carvalho/.test(t), !/créditos de IA/.test(t));
console.log('  Instagram sem perfil preenchido:', /Envie do seu perfil para @99coach\.oficial/.test(t));
console.log('errs', errs);
await b.close();
