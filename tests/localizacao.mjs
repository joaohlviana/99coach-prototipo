// "Usar minha localização" de verdade: o navegador informa a posição e o app escolhe a cidade (sem cidade fixa de exemplo).
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, geolocation: { latitude: -8.05, longitude: -34.9 }, permissions: ['geolocation'] });
await ctx.route('**/api/v1/**', (r) => r.abort());
await ctx.route('**/rycaxboqkkiopjdecgld.supabase.co/**', (r) => r.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' }, body: '[]' }));
const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 160)));
await p.goto('http://localhost:5173/treinadores/judo/sao-paulo-sp', { waitUntil: 'load' }); await p.waitForTimeout(3500);
await p.click('.vf-hsb--city'); await p.waitForTimeout(500);
await p.evaluate(() => { const e = [...document.querySelectorAll('[role=dialog] button')].find((x) => /Usar minha localização/.test(x.textContent)); if (e) e.click(); });
await p.waitForTimeout(2500);
console.log('1 vitrine: cidade escolhida pela posição (Recife):', /recife-pe/.test(p.url()), p.url().split('/').slice(-2).join('/'));
// cadastro do treinador: campo "Onde você atende"
const q = await ctx.newPage(); q.on('pageerror', (e) => errs.push(e.message.slice(0, 160)));
await q.goto('http://localhost:5173/', { waitUntil: 'load' }); await q.waitForTimeout(500);
await q.evaluate(() => { const C = PAGES.onboarding.Comp; STORE.saveOnb(Object.assign(C.prototype.base.call(C.prototype, 'treinador', ''), { step: 'dados', pres: true, dd: 'open', q: '' })); });
await q.reload({ waitUntil: 'load' }); await q.waitForTimeout(800);
await q.evaluate(() => NAV.go('onboarding', { flow: 'treinador' }, null)); await q.waitForTimeout(1500);
await q.evaluate(() => { const e = document.getElementById('cv-city'); if (e) e.focus(); }); await q.waitForTimeout(300);
await q.evaluate(() => { const e = document.getElementById('cv-o-loc'); if (e) e.click(); }); await q.waitForTimeout(500);
await q.evaluate(() => { const e = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'Permitir' && x.offsetParent); if (e) e.click(); }); await q.waitForTimeout(2500);
const t = await q.evaluate(() => document.getElementById('app').innerText);
console.log('2 cadastro: cidade da posição:', /Recife/.test(t), '| não usa Londrina fixa:', !/Londrina, PR escolhida/.test(t));
console.log('errs', errs);
await b.close();
