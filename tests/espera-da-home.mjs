// A cópia estática do topo da página inicial (components/home-espera.js) tem de ser igual ao que o app desenha.
// Se o topo mudou, rode: node scripts/snapshot-home.mjs  (com o site no ar) e publique junto.
import { topo } from '../scripts/snapshot-home.mjs';
import guardada from '../components/home-espera.js';
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const agora = (await topo('http://localhost:5173')).replace('<div class="w v4"', '<div class="w v4" inert aria-hidden="true" data-espera');
console.log('1 cópia do topo em dia:', agora === guardada);
if (agora !== guardada) { let i = 0; while (i < agora.length && agora[i] === guardada[i]) i++; console.log('  primeira diferença:', JSON.stringify(guardada.slice(i - 40, i + 60)), '→', JSON.stringify(agora.slice(i - 40, i + 60))); }
const b = await chromium.launch();
const errs = [];
// com o app impedido de carregar, o topo aparece mesmo assim; quando o app liga, nada salta
for (const [w, h, n, mob] of [[390, 844, 'celular', true], [1280, 800, 'computador', false]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: mob, hasTouch: mob });
  const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push(e.message.slice(0, 120)));
  await p.route('**/shell/app.js*', () => new Promise(() => {}));
  await p.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1500);
  const v = await p.evaluate(() => { const i = [...document.querySelectorAll('#app [data-espera] img')].find((x) => x.offsetParent && x.getBoundingClientRect().height > 200); const t = [...document.querySelectorAll('#app [data-espera] .vfm-h1b, #app [data-espera] .d1')].find((x) => x.offsetParent); const r = i && i.getBoundingClientRect(); return { img: !!i && i.complete && i.naturalWidth > 0, top: r ? Math.round(r.top) : -1, titulo: t ? t.innerText.replace(/\s+/g, ' ') : '', ssr: getComputedStyle(document.getElementById('ssr')).display }; });
  console.log('2 ' + n + ': topo visível sem o app:', v.img && v.top < 200 && /ENCONTRE SEU TREINADOR/i.test(v.titulo), '| versão do servidor não ocupa espaço:', v.ssr === 'none');
  await ctx.close();
  const ctx2 = await b.newContext({ viewport: { width: w, height: h }, isMobile: mob, hasTouch: mob });
  const q = await ctx2.newPage(); q.on('pageerror', (e) => errs.push(e.message.slice(0, 120)));
  await q.addInitScript(() => { window.__cls = 0; try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); } catch (_) {} });
  await q.goto('http://localhost:5173/', { waitUntil: 'load' }); await q.waitForTimeout(3000);
  const c = await q.evaluate(() => ({ cls: window.__cls, on: document.documentElement.classList.contains('app-on'), resto: !!document.querySelector('#app [data-espera]') }));
  console.log('3 ' + n + ': app assumiu sem salto:', c.on && !c.resto && c.cls < 0.05, '(deslocamento ' + c.cls.toFixed(3) + ')');
  await ctx2.close();
}
await b.close();
console.log('errs', JSON.stringify(errs));
