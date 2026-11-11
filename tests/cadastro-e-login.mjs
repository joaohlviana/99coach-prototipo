const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.route('**/rycaxboqkkiopjdecgld.supabase.co/**', (r) => r.abort());
await ctx.route('**/api/v1/**', (r) => r.abort());
const p = await ctx.newPage(); const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load|ERR_/.test(m.text())) errs.push(m.text().slice(0, 160)); });
await p.goto('http://localhost:5173/', { waitUntil: 'load' }); await p.waitForTimeout(700);
await p.evaluate(() => { const C = PAGES.onboarding.Comp; STORE.saveOnb(Object.assign(C.prototype.base.call(C.prototype, 'aluno', ''), { name: 'Bruna Alves', conta: true, step: 'pronto', scn: '' })); NAV.go('aluno', {}, null); });
await p.waitForTimeout(500);
const txt = () => p.evaluate(() => document.getElementById('app').innerText.replace(/\s+/g, ' '));
for (const s of ['hoje', 'treinos', 'evolucao', 'mensagens', 'programas', 'contratacoes', 'menu']) {
  await p.evaluate((k) => NAV.go('aluno', { s: k }, null), s); await p.waitForTimeout(300);
  const t = await txt();
  const leaks = (t.match(/Rafael Lima|Ana Carolina|Treino A · inferiores|Treino B · superiores|82%|R\$ ?200/g) || []);
  const main = t.split('CONTA ').pop();
  console.log(s.padEnd(12), '| exemplo visível:', [...new Set(leaks)], '|', t.replace(/^.*?Conta e preferências /, '').slice(0, 190));
  await p.screenshot({ path: `out/aluno-${s}.png` });
}
console.log('errs', errs);
await b.close();
