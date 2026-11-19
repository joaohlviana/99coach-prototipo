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

// fatia que não existe ou falha: um pedido só, e o catálogo inteiro assume (antes eram dezenas de pedidos por segundo)
for (const [nome, url, falha] of [['jiu-jitsu', '/treinadores/jiu-jitsu', false], ['fatia com erro', '/treinadores/crossfit', true]]) {
  c = await novo(); if (falha) await c.route('**/dados/esporte/**', (r) => r.fulfill({ status: 500, body: 'x' }));
  p = await c.newPage(); p.on('pageerror', (e) => errs.push(e.message.slice(0, 160)));
  let pedidos = 0; p.on('request', (r) => { if (/\/dados\/esporte\//.test(r.url())) pedidos++; });
  await p.goto(B + url, { waitUntil: 'load' }); await p.waitForTimeout(4500);
  console.log('5 ' + nome + ': poucos pedidos e a lista aparece:', pedidos <= 2, pedidos, '|', await p.locator('#lista .tc__name').count() >= 3);
  await c.close();
}
// trocar de modalidade dentro da lista: a ordem é a mesma de quem abre a modalidade direto
c = await novo(); p = await c.newPage(); p.on('pageerror', (e) => errs.push(e.message.slice(0, 160)));
const tres = () => p.evaluate(() => [...document.querySelectorAll('#lista .tc__name')].slice(0, 6).map((x) => x.textContent.trim()).join('|'));
await p.goto(B + '/treinadores/musculacao', { waitUntil: 'load' }); await p.waitForTimeout(4000); const direto = await tres();
await p.goto(B + '/treinadores/crossfit', { waitUntil: 'load' }); await p.waitForTimeout(3500);
await p.evaluate(() => window.NAV.go('esporte', { mod: 'Musculação', city: '', fmt: 'Qualquer' }, null)); await p.waitForTimeout(4000);
console.log('6 trocar de modalidade mantém a ordem de relevância:', direto.length > 10 && direto === await tres());
// "Mais recentes": empate na data fica na ordem de relevância (o primeiro não é o último da relevância)
await p.goto(B + '/treinadores/crossfit?ordem=rec', { waitUntil: 'load' }); await p.waitForTimeout(4000);
const vistos = (await tres()).split('|');
const ord = await p.evaluate((nomes) => { const T = window.REAL.esporte() || []; return nomes.map((n) => T.find((t) => t.name === n)).filter(Boolean).map((t) => [t.pub, t.rank]); }, vistos);
console.log('7 mais recentes, com empate por relevância:', ord.length >= 4 && ord.every((x, i) => i === 0 || x[0] < ord[i - 1][0] || (x[0] === ord[i - 1][0] && x[1] > ord[i - 1][1])), JSON.stringify(ord.slice(0, 3)));
await c.close();
// perfil, recarregar e voltar: a lista abre (não fica em branco)
c = await novo(); p = await c.newPage(); p.on('pageerror', (e) => errs.push(e.message.slice(0, 160)));
await p.goto(B + '/treinadores/crossfit?pagina=2', { waitUntil: 'load' }); await p.waitForTimeout(3500);
await p.locator('#lista .tc__name').first().click(); await p.waitForTimeout(2500);
await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(2500); await p.goBack(); await p.waitForTimeout(4500);
console.log('8 recarregar no perfil e voltar:', /\/treinadores\/crossfit/.test(p.url()), await p.locator('#lista .tc__name').count() >= 3);
await c.close();
// a contagem "online" da página inicial é a mesma da lista
c = await novo(); p = await c.newPage(); p.on('pageerror', (e) => errs.push(e.message.slice(0, 160)));
await p.goto(B + '/', { waitUntil: 'load' }); await p.waitForTimeout(1500); await p.evaluate(() => window.REAL.ensure()); await p.waitForTimeout(2500);
const cont = await p.evaluate(() => ({ home: window.REAL.home().filter((t) => t.onl).length, lista: window.REAL.esporte().filter((t) => t.fmts.indexOf('Online') >= 0).length }));
console.log('9 online: página inicial e lista contam igual:', cont.home === cont.lista && cont.home > 0, cont.home, cont.lista);
// começo do catálogo chegou, o resto falhou, filtro com poucos resultados: avisa (não fica em esqueleto para sempre)
c = await novo(); await c.route('**/data/treinadores.json', (r) => r.abort()); p = await c.newPage(); p.on('pageerror', (e) => errs.push(e.message.slice(0, 160)));
await p.goto(B + '/', { waitUntil: 'load' }); await p.waitForTimeout(1500);
await p.evaluate(() => { const e = [...document.querySelectorAll('#app button')].find((x) => /^Online$/.test(x.textContent.trim()) && x.offsetParent); e && e.click(); }); await p.waitForTimeout(5000);
t = await p.evaluate(() => document.getElementById('treinadores').innerText);
console.log('10 catálogo inteiro falhou: sem esqueleto eterno:', await p.locator('#treinadores [aria-busy="true"]').count() === 0, /Tentar de novo/.test(t) || await p.locator('#treinadores .tc__name').count() >= 4);
await c.close();
console.log('errs', errs); await b.close();
