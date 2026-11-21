// Busca por lugar fora do Brasil: país ("EUA") e cidade ("Miami") no computador e no celular,
// quem é do lugar aparece primeiro e o endereço gerado abre o mesmo resultado ao recarregar.
import { createRequire } from 'node:module';
const { chromium } = createRequire('/')(process.env.PW);
const B = process.env.BASE || 'http://localhost:5173';
let falhas = 0; const ok = (n, v, x) => { if (!v) falhas++; console.log((v ? 'ok ' : 'false ') + n + (v ? '' : ' :: ' + JSON.stringify(x))); };
const b = await chromium.launch();
const novo = async (w, h) => { const c = await b.newContext({ viewport: { width: w, height: h } }); await c.route('**/rycaxboqkkiopjdecgld.supabase.co/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' })); const p = await c.newPage(); p.on('pageerror', (e) => { falhas++; console.log('false erro na página :: ' + e.message.slice(0, 160)); }); return [c, p]; };
const metas = (p) => p.evaluate(() => [...document.querySelectorAll('#lista .vf-tc')].map((x) => (x.querySelector('.vf-meta') || {}).textContent || '').map((x) => x.trim()));
const abrirOnde = (p) => p.evaluate(() => { const e = [...document.querySelectorAll('#app button')].find((x) => /^\s*Onde/.test(x.textContent) && x.offsetParent) || document.querySelector('#app .vfm-qtx'); e && e.click(); });
const opcoes = (p, sel) => p.evaluate((s) => [...document.querySelectorAll(s)].filter((x) => x.offsetParent).map((x) => x.textContent.replace(/\s+/g, ' ').trim()), sel);

// ---------- computador ----------
let [c, p] = await novo(1400, 900);
await p.goto(B + '/', { waitUntil: 'load' }); await p.waitForFunction(() => window.REAL && (window.REAL.cities('miami') || []).length, null, { timeout: 20000 });
await abrirOnde(p); await p.waitForTimeout(500);
const campo = () => p.locator('#app input[placeholder="Digite o nome da cidade"]:visible').last();
for (const q of ['eua', 'usa', 'estados unidos']) { await campo().fill(''); await campo().type(q, { delay: 10 }); await p.waitForTimeout(400); const o = await opcoes(p, '#app .opt'); ok('computador: "' + q + '" oferece o país', o.some((t) => /^Estados Unidos( ?País · \d+ treinador(es)?)?$/.test(t)), o.slice(0, 8)); }
await campo().fill(''); await campo().type('miami', { delay: 10 }); await p.waitForTimeout(400);
ok('computador: "miami" oferece a cidade', (await opcoes(p, '#app .opt')).some((t) => /^Miami, Estados Unidos/.test(t)));
await campo().fill(''); await campo().type('eua', { delay: 10 }); await p.waitForTimeout(400);
await p.evaluate(() => { const e = [...document.querySelectorAll('#app .opt')].find((x) => /^\s*Estados Unidos/.test(x.textContent) && x.offsetParent); e && e.click(); }); await p.waitForTimeout(800);
await p.evaluate(() => { const e = [...document.querySelectorAll('#app button')].find((x) => /^Encontrar treinadores/.test(x.textContent.trim()) && x.offsetParent); e && e.click(); });
await p.waitForFunction(() => document.querySelector('#lista .vf-tc .vf-meta'), null, { timeout: 20000 }); await p.waitForTimeout(600);
ok('país escolhido: endereço /buscar?onde=pais-us', /\/buscar\?onde=pais-us$/.test(p.url()), p.url());
let m = await metas(p); const eua = m.filter((t) => /Estados Unidos/.test(t)).length;
ok('país escolhido: os do país vêm primeiro', eua >= 6 && m.slice(0, eua).every((t) => /Estados Unidos/.test(t)), m.slice(0, 10));
let r = await p.goto(p.url(), { waitUntil: 'load' });
ok('país: recarregar abre a mesma busca', r.status() === 200 && /Estados Unidos/.test(await p.evaluate(() => (document.querySelector('h1') || {}).textContent || '')));
await p.goto(B + '/treinadores/musculacao?onde=miami-us', { waitUntil: 'load' });
await p.waitForFunction(() => /em Miami/.test(document.getElementById('app').innerText), null, { timeout: 20000 }).catch(() => {}); await p.waitForTimeout(600);
m = await metas(p); const mia = m.filter((t) => /Miami, Estados Unidos/.test(t)).length;
ok('modalidade em Miami pelo endereço: os de Miami primeiro', mia >= 2 && m.slice(0, mia).every((t) => /Miami, Estados Unidos/.test(t)), m.slice(0, 6));
await p.evaluate(() => window.NAV.go('esporte', { mod: 'Todos os esportes', city: 'Miami, Estados Unidos', fmt: 'Qualquer' }, null)); await p.waitForTimeout(1200);
ok('cidade de fora: endereço /cidade/miami-us', /\/cidade\/miami-us$/.test(p.url()), p.url());
r = await p.goto(p.url(), { waitUntil: 'load' }); ok('cidade de fora: recarregar responde 200', r.status() === 200, r.status());
await p.goto(B + '/treinadores/crossfit?onde=pais-us', { waitUntil: 'load' });
await p.waitForFunction(() => /em Estados Unidos/.test(document.getElementById('app').innerText), null, { timeout: 20000 }).catch(() => {});
ok('modalidade no país pelo endereço', /em Estados Unidos/.test(await p.evaluate(() => document.getElementById('app').innerText)));
await c.close();

// ---------- celular ----------
[c, p] = await novo(390, 844);
await p.goto(B + '/', { waitUntil: 'load' }); await p.waitForFunction(() => window.REAL && (window.REAL.cities('miami') || []).length, null, { timeout: 20000 });
await abrirOnde(p); await p.waitForTimeout(600);
const cm = () => p.locator('#app input:visible').last();
await cm().fill(''); await cm().type('eua', { delay: 10 }); await p.waitForTimeout(600);
let o = await opcoes(p, '#app .sx-row'); ok('celular: "eua" oferece o país', o.some((t) => /^Estados Unidos ?País · \d+ treinador/.test(t)), o.slice(0, 5));
await cm().fill(''); await cm().type('miami', { delay: 10 }); await p.waitForTimeout(600);
o = await opcoes(p, '#app .sx-row'); ok('celular: "miami" oferece a cidade', o.some((t) => /^Miami, Estados Unidos ?Cidade( · \d+ treinador(es)?)?$/.test(t)), o.slice(0, 5));
await p.evaluate(() => { const e = [...document.querySelectorAll('#app .sx-row')].find((x) => /^\s*Miami, Estados Unidos\s*Cidade/.test(x.textContent) && x.offsetParent); e && e.click(); }); await p.waitForTimeout(1200);
await p.waitForFunction(() => document.querySelector('#lista .vf-tc'), null, { timeout: 20000 }).catch(() => {}); await p.waitForTimeout(600);
ok('celular: escolher Miami abre a lista de Miami', /\/cidade\/miami-us$/.test(p.url()), p.url());
m = await metas(p); ok('celular: os de Miami vêm primeiro', m.length >= 2 && m.slice(0, 5).every((t) => /Miami, Estados Unidos/.test(t)), m.slice(0, 6));
await c.close();
// busca do topo no computador: o lugar aparece antes dos perfis e o rodapé leva à lista do lugar
[c, p] = await novo(1400, 1000);
await p.goto(B + '/', { waitUntil: 'load' }); await p.waitForFunction(() => window.REAL && (window.REAL.cities('miami') || []).length, null, { timeout: 20000 }); await p.waitForTimeout(1500);
const topo = p.locator('#app input.sx-field:visible').first(); await topo.click(); await topo.type('miami', { delay: 15 }); await p.waitForTimeout(900);
o = await opcoes(p, '#app .sx-row'); ok('computador, busca do topo: "miami" traz a cidade antes dos perfis', /^Miami, Estados Unidos ?Cidade · \d+ treinador/.test(o[0] || ''), o.slice(0, 3));
const rod = await p.evaluate(() => [...document.querySelectorAll('#app .sx-foot')].filter((x) => x.offsetParent).map((x) => x.textContent.replace(/\s+/g, ' ').trim())[0] || '');
ok('computador, busca do topo: rodapé leva à cidade', /Ver treinadores em Miami, Estados Unidos/.test(rod), rod);
await p.evaluate(() => { const e = [...document.querySelectorAll('#app .sx-foot button, #app .sx-foot a')].find((x) => /Ver treinadores em/.test(x.textContent) && x.offsetParent); e && e.click(); });
await p.waitForFunction(() => /\/cidade\/miami-us$/.test(location.pathname), null, { timeout: 10000 }).catch(() => {});
ok('computador, busca do topo: rodapé abre /cidade/miami-us', /\/cidade\/miami-us$/.test(p.url()), p.url());
await c.close(); await b.close();
console.log(falhas ? '!! ' + falhas + ' falha(s)' : 'busca por país e cidade de fora: tudo certo'); process.exit(falhas ? 1 : 0);
