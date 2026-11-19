// Lista de treinadores ao carregar: esqueletos e depois a lista final. Nunca "uns treinadores e depois outros".
// Cobre a página inicial, a página de modalidade, a ida da inicial para uma modalidade antes de o catálogo inteiro chegar,
// e a falha de conexão (avisa e deixa tentar de novo, em vez de dizer que não há ninguém).
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const B = 'http://localhost:5173';
const b = await chromium.launch();
const espia = (sel) => { window.__vistos = []; setInterval(() => { const sk = document.querySelector(sel + ' [aria-busy="true"], ' + sel + '[aria-busy="true"]'); const a = [...document.querySelectorAll(sel + ' .tc__name, ' + sel + ' .vfm-name')].filter((x) => x.offsetParent).slice(0, 4).map((x) => x.textContent.trim()).join('|'); const k = sk ? 'ESQUELETO' : a; if (k && window.__vistos[window.__vistos.length - 1] !== k) window.__vistos.push(k); }, 30); };
const novo = async (lento) => {
  const c = await b.newContext({ viewport: { width: 1280, height: 900 }, timezoneId: 'America/Sao_Paulo' });
  await c.route('**/rycaxboqkkiopjdecgld.supabase.co/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await c.route('**/api/v1/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[]}' }));
  if (lento) await c.route(lento, async (r) => { await new Promise((ok) => setTimeout(ok, 1200)); r.continue(); });
  return c;
};
const so = (v) => v.length === 2 && v[0] === 'ESQUELETO' && v[1] !== 'ESQUELETO' && v[1].split('|').length >= 3;

let c = await novo('**/dados/inicio'), p = await c.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 160)));
await p.addInitScript(espia, '#treinadores'); await p.goto(B + '/', { waitUntil: 'commit' }); await p.waitForTimeout(7000);
let v = await p.evaluate(() => window.__vistos);
console.log('1 início: esqueleto e depois a lista final:', so(v), JSON.stringify(v).slice(0, 120));
await c.close();

c = await novo('**/dados/esporte/**'); p = await c.newPage(); p.on('pageerror', (e) => errs.push(e.message.slice(0, 160)));
await p.addInitScript(espia, '#lista'); await p.goto(B + '/treinadores/crossfit', { waitUntil: 'commit' }); await p.waitForTimeout(6000);
v = await p.evaluate(() => window.__vistos);
console.log('2 modalidade: esqueleto e depois a lista final:', so(v), JSON.stringify(v).slice(0, 120));
await c.close();

// da inicial para uma modalidade enquanto só o começo do catálogo chegou: o catálogo inteiro demora
c = await novo('**/data/treinadores.json'); p = await c.newPage(); p.on('pageerror', (e) => errs.push(e.message.slice(0, 160)));
await p.goto(B + '/', { waitUntil: 'load' }); await p.waitForTimeout(1500);
await p.evaluate((f) => { (0, eval)('(' + f + ')')('#lista'); }, espia.toString());
await p.evaluate(() => window.NAV.go('esporte', { mod: 'CrossFit', city: '', fmt: 'Qualquer' }, null)); await p.waitForTimeout(5000);
v = await p.evaluate(() => window.__vistos);
const n = await p.evaluate(() => (document.getElementById('app').innerText.match(/(\d+) treinadores de CrossFit/) || [])[1]);
console.log('3 da inicial para a modalidade: sem lista parcial:', v.filter((x) => x !== 'ESQUELETO').length === 1, '| contagem completa:', +n > 50, n);
await c.close();

c = await novo(); await c.route('**/dados/inicio', (r) => r.abort()); await c.route('**/data/treinadores.json', (r) => r.abort());
p = await c.newPage(); p.on('pageerror', (e) => errs.push(e.message.slice(0, 160)));
await p.goto(B + '/', { waitUntil: 'load' }); await p.waitForTimeout(5500);
let t = await p.evaluate(() => document.getElementById('treinadores').innerText);
console.log('4 sem conexão: avisa e deixa tentar de novo:', /Não conseguimos carregar os treinadores/.test(t), /Tentar de novo/.test(t), !/Não encontramos profissionais/.test(t));
await c.unroute('**/dados/inicio'); await c.unroute('**/data/treinadores.json');
await p.evaluate(() => { const e = [...document.querySelectorAll('#treinadores button')].find((x) => /Tentar de novo/.test(x.textContent)); e && e.click(); }); await p.waitForTimeout(3000);
console.log('  tentar de novo traz a lista:', await p.locator('#treinadores .tc__name').count() >= 3);
console.log('errs', errs); await b.close();
