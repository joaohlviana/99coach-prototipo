// Busca: motivo em cada cartão (só os permitidos), "não tenho interesse" com desfazer, sem inferir "online",
// e voltar do perfil mantendo filtros.
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
await ctx.route('**/api/v1/**', (r) => r.abort());
await ctx.route('**/rycaxboqkkiopjdecgld.supabase.co/**', (r) => r.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' }, body: '[]' }));
const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 160)));
await p.goto('http://localhost:5173/treinadores/musculacao/online', { waitUntil: 'load' }); await p.waitForTimeout(2500);
const txt = () => p.evaluate(() => document.getElementById('app').innerText.replace(/\s+/g, ' '));
let t = await txt();
const reasons = await p.evaluate(() => [...document.querySelectorAll('#app .vf-why')].map((e) => e.textContent.trim()));
const OK = /^(Você salvou|Atende online|Atende em .+|Atende .+|Publicado recentemente)$/;
console.log('1 motivo em cada cartão:', reasons.length > 0, '| só motivos permitidos:', reasons.every((r) => OK.test(r)), '| nesta busca:', reasons[0]);
const first = await p.evaluate(() => document.querySelector('#app .tc__name span').textContent.trim());
await p.locator('#app .vf-hide').first().click(); await p.waitForTimeout(500); t = await txt();
console.log('2 ocultou:', t.includes(first + ' não aparece mais'), '| saiu da lista:', await p.evaluate((n) => ![...document.querySelectorAll('#app .tc__name span')].some((e) => e.textContent.trim() === n), first));
await p.locator('#app button', { hasText: /^Desfazer$/ }).first().click(); await p.waitForTimeout(500);
console.log('  desfez:', await p.evaluate((n) => [...document.querySelectorAll('#app .tc__name span')].some((e) => e.textContent.trim() === n), first));
const semFmt = await p.evaluate(() => window.REAL && window.REAL.count());
await p.goto('http://localhost:5173/treinadores/musculacao', { waitUntil: 'load' }); await p.waitForTimeout(2500);
console.log('3 catálogo carregado:', semFmt > 1000);
// voltar do perfil mantém a busca
const url0 = await p.evaluate(() => location.pathname);
await p.locator('#app .tc__name').first().click(); await p.waitForTimeout(1200);
const onProfile = await p.evaluate(() => /^\/treinador\//.test(location.pathname));
await p.goBack(); await p.waitForTimeout(1200);
console.log('4 abriu perfil:', onProfile, '| voltou para a mesma busca:', (await p.evaluate(() => location.pathname)) === url0, /Musculação/i.test(await txt()));
// vazio × falha × fim: sem a base e sem o banco a tela diz que é falha (não "nenhum treinador"); "Tentar de novo" recupera
const c2 = await b.newContext({ viewport: { width: 1280, height: 900 } }); let fora = true;
await c2.route('**/api/v1/**', (r) => r.abort());
await c2.route('**/rycaxboqkkiopjdecgld.supabase.co/**', (r) => (fora ? r.abort() : r.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' }, body: '[]' })));
await c2.route('**/data/treinadores.json', (r) => (fora ? r.abort() : r.continue()));
const q = await c2.newPage(); q.on('pageerror', (e) => errs.push(e.message.slice(0, 160)));
await q.goto('http://localhost:5173/treinadores/musculacao', { waitUntil: 'load' }); await q.waitForTimeout(2500);
const tq = () => q.evaluate(() => document.getElementById('app').innerText.replace(/\s+/g, ' '));
let u = await tq();
console.log('5 falha não é vazio:', /Não conseguimos carregar a lista de treinadores|A lista pode estar incompleta/.test(u), '| não diz "não encontramos":', !/Não encontramos profissionais com estes filtros/.test(u));
fora = false;
await q.locator('#app button', { hasText: /^Tentar de novo$/ }).first().click(); await q.waitForTimeout(2500); u = await tq();
console.log('  tentar de novo recupera:', (await q.evaluate(() => window.REAL.count())) > 1000, !/Não conseguimos carregar a lista|A lista pode estar incompleta/.test(u));
// fim da lista: numa busca pequena a tela diz que acabou
const peq = await q.evaluate(() => { const c = {}; (window.REAL.esporte() || []).forEach((t) => { if (t.city && t.fmts.indexOf('Presencial') >= 0 && t.mods.indexOf('Musculação') >= 0) c[t.city] = (c[t.city] || 0) + 1; }); return Object.keys(c).filter((k) => c[k] >= 1 && c[k] <= 5)[0] || ''; });
await q.evaluate((city) => NAV.go('esporte', { mod: 'Musculação', city, fmt: 'Presencial' }, null), peq); await q.waitForTimeout(1200); u = await tq();
console.log('6 fim da lista em', peq + ':', /Fim da lista: (este é o único treinador|você viu os \d+ treinadores) desta busca/.test(u));
await q.evaluate(() => NAV.go('esporte', { mod: 'Musculação', city: '', fmt: 'Qualquer' }, null)); await q.waitForTimeout(1200);
console.log('  lista longa não diz fim:', !/Fim da lista:/.test(await tq()));
console.log('errs', JSON.stringify(errs));
await b.close();
