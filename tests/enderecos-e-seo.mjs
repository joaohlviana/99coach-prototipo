// Páginas públicas em Next: o servidor entrega o conteúdo pronto, o app assume, e os endereços acompanham a navegação.
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const B = 'http://localhost:5173';
const b = await chromium.launch();
// 1. sem JavaScript (o que um buscador simples lê): conteúdo, título, canônico, links de verdade
const noJs = await b.newContext({ javaScriptEnabled: false });
const q = await noJs.newPage();
for (const u of ['/', '/treinadores/crossfit/londrina-pr', '/treinadores/pilates/online', '/treinador/debora-maria-9063d266']) {
  const r = await q.goto(B + u, { waitUntil: 'load' });
  const d = await q.evaluate(() => ({ t: document.title, h1: (document.querySelector('h1') || {}).textContent, can: (document.querySelector('link[rel=canonical]') || {}).href, links: [...document.querySelectorAll('#ssr a[href^="/treinador"]')].length, ld: document.querySelectorAll('#ssr script[type="application/ld+json"]').length, texto: document.getElementById('ssr').innerText.length }));
  console.log('sem JS', u, r.status(), '|', d.t, '| h1:', d.h1, '| canônico:', (d.can || '').replace(/^https?:\/\/[^/]+/, ''), '| links:', d.links, '| dados estruturados:', d.ld, '| texto:', d.texto > 300);
}
console.log('sem JS 404:', (await q.goto(B + '/treinadores/esgrima/londrina-pr')).status(), (await q.goto(B + '/treinador/nao-existe')).status());
await noJs.close();
// 2. com JavaScript: o app assume e os endereços acompanham
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.route('**/rycaxboqkkiopjdecgld.supabase.co/**', (r) => r.abort());
await ctx.route('**/api/v1/**', (r) => r.abort());
const p = await ctx.newPage(); const errs = [];
p.on('pageerror', (e) => errs.push(e.message.slice(0, 160)));
p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load|ERR_|net::/.test(m.text())) errs.push('console: ' + m.text().slice(0, 160)); });
const estado = () => p.evaluate(() => ({ url: location.pathname + location.hash, h1: (document.querySelector('#app h1') || {}).textContent, ssr: getComputedStyle(document.getElementById('ssr')).display, title: document.title }));
const abrir = async (u) => { await p.goto('about:blank'); await p.goto(B + u, { waitUntil: 'load' }); await p.waitForFunction(() => document.documentElement.classList.contains('app-on') && document.querySelector('#app h1'), null, { timeout: 15000 }); await p.waitForTimeout(600); return estado(); };
let s = await abrir('/treinadores/crossfit/londrina-pr');
console.log('1 direto no esporte × cidade:', s.url, '|', s.h1, '| conteúdo do servidor escondido:', s.ssr === 'none', '| título:', s.title);
await p.evaluate(() => { const e = [...document.querySelectorAll('#app .rail__item')].find((x) => x.textContent.trim() === 'Pilates'); e.click(); }); await p.waitForTimeout(700);
s = await estado(); console.log('2 trocar de esporte na página:', s.url, '|', s.h1);
await p.evaluate(() => NAV.go('esporte', { mod: 'Yoga', city: '', fmt: 'Online' }, null)); await p.waitForTimeout(700);
s = await estado(); console.log('3 online:', s.url, '|', s.h1);
s = await abrir('/treinador/debora-maria-9063d266');
console.log('4 direto no perfil:', s.url, '|', s.h1);
s = await abrir('/');
console.log('5 home:', s.url, '| app ligado:', !!s.h1);
await p.evaluate(() => { const e = [...document.querySelectorAll('#app .rail__item')].find((x) => x.textContent.trim() === 'Corrida'); e.click(); }); await p.waitForTimeout(800);
s = await estado(); console.log('  clicar em um esporte:', s.url, '|', s.h1);
await p.evaluate(() => { const n = document.querySelector('#app .tc__name, #app .vfe-card button, #app [class*="card"] button'); if (n) n.click(); }); await p.waitForTimeout(900);
s = await estado(); console.log('  abrir um treinador da lista:', /^\/treinador\//.test(s.url), s.url.slice(0, 40));
await p.goBack(); await p.waitForTimeout(700); s = await estado(); console.log('  voltar:', s.url, '|', s.h1);
await p.goBack(); await p.waitForTimeout(700); s = await estado(); console.log('  voltar de novo:', s.url);
// 6. áreas com conta ficam em /app#... e sobrevivem a recarregar
await p.evaluate(() => NAV.go('onboarding', { flow: 'entrar' }, null)); await p.waitForTimeout(700);
s = await estado(); console.log('6 entrar:', s.url, '|', s.h1);
await p.reload({ waitUntil: 'load' }); await p.waitForFunction(() => document.querySelector('#app h1'), null, { timeout: 15000 }); await p.waitForTimeout(500);
s = await estado(); console.log('  recarregar:', s.url, '|', s.h1);
// 7. endereço antigo com # continua abrindo e é trocado pelo novo
s = await abrir('/#esporte'); console.log('7 endereço antigo /#esporte ->', s.url);
// 8. arquivos relativos funcionam em endereço fundo
const quebradas = await p.evaluate(() => [...document.querySelectorAll('#app img')].filter((i) => i.complete && i.naturalWidth === 0 && i.getAttribute('src')).map((i) => i.getAttribute('src')).slice(0, 3));
console.log('8 imagens quebradas:', quebradas.length, quebradas.join(' '));
console.log('errs', errs);
await b.close();
