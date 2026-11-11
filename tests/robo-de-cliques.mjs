// Clica em cada botão de cada tela (uma vez, a partir da tela recém-aberta) e registra erros de JS.
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const width = Number(process.argv[2]) || 1440;
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width, height: 900 } });
await ctx.route('**/rycaxboqkkiopjdecgld.supabase.co/**', (route) => route.abort());
await ctx.route('**/api/v1/**', (route) => route.abort());
const p = await ctx.newPage();
let where = '';
const found = new Map();
const note = (m) => { const k = m.slice(0, 160); if (!found.has(k)) found.set(k, where); };
p.on('pageerror', (e) => note('PE ' + e.message));
p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|ERR_/.test(m.text())) note('CE ' + m.text()); });
p.on('dialog', (d) => d.dismiss().catch(() => {}));
ctx.on('page', (np) => { if (np !== p) np.close().catch(() => {}); });
await p.goto('http://localhost:5173/?demo=1', { waitUntil: 'load' });
await p.waitForTimeout(700);
await p.evaluate(() => { window.print = () => {}; window.open = () => null; });
const targets = await p.evaluate(() => {
  const L = [['home', {}], ['esporte', {}], ['perfil', { id: 'rafael' }], ['perfil', { id: 'thiago-pereira-londrina-pr' }], ['servico', { offer: 'online' }], ['onboarding', { flow: 'treinador' }], ['onboarding', { flow: 'aluno' }], ['onboarding', { flow: 'entrar' }], ['onboarding', { flow: 'convite' }]];
  for (const pg of ['treinador', 'aluno', 'publico', 'operacao']) for (const s of REG.list(pg)) L.push([pg, { s: s.key }]);
  return L;
});
const SEL = '#app button, #app a, #app [role="button"], #app [role="tab"], #app summary';
let clicks = 0;
for (const [pg, pr] of targets) {
  where = pg + ' ' + JSON.stringify(pr);
  const open = async () => { for (let k = 0; k < 2; k++) { try { await p.evaluate(([a, c]) => { try { localStorage.clear(); localStorage.setItem('c99.demo','1'); document.documentElement.classList.add('demo'); } catch (_) {} DB.reset(); NAV.go(a, c, null); }, [pg, pr]); break; } catch (e) { note('RECARREGOU ' + e.message.slice(0, 60)); await p.goto('http://localhost:5173/?demo=1', { waitUntil: 'load' }); await p.waitForTimeout(500); } } await p.waitForTimeout(15); };
  await open();
  const n = await p.$$eval(SEL, (e) => e.length);
  for (let i = 0; i < Math.min(n, 140); i++) {
    await open();
    const label = await p.evaluate(([sel, k]) => {
      const el = document.querySelectorAll(sel)[k];
      if (!el || el.disabled) return null;
      const t = (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 40);
      if (el.tagName === 'A' && /^https?:|^mailto:|^tel:/.test(el.getAttribute('href') || '')) return null;
      if (/Sair da conta/.test(t)) return null;
      el.click();
      return t;
    }, [SEL, i]).catch((e) => 'EVAL ' + e.message.slice(0, 80));
    if (label === null) continue;
    where = pg + ' ' + JSON.stringify(pr) + ' » ' + label;
    clicks++;
    await p.waitForTimeout(12);
    if (!/localhost:5173/.test(p.url())) { note('NAVEGOU PARA FORA ' + p.url()); await p.goto('http://localhost:5173/?demo=1', { waitUntil: 'load' }); await p.waitForTimeout(500); }
  }
}
console.log('largura', width, 'telas', targets.length, 'cliques', clicks, 'erros distintos', found.size);
for (const [k, v] of found) console.log('-', k, '\n    em:', v);
await b.close();
