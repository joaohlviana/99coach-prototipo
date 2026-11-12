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
console.log('errs', JSON.stringify(errs));
await b.close();
