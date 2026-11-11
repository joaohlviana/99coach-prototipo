// Auditoria de cliques no modo produto: para cada botão/link visível, clica e classifica o efeito.
// NADA = nada mudou na tela; FORA = abriu aviso de "fora desta versão/protótipo"; ok = navegou ou mudou a tela.
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const fs = await import('node:fs');
const [out, w, start, tag] = [process.argv[2], +process.argv[3], process.argv[4], process.argv[5]];
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
await ctx.route('**/rycaxboqkkiopjdecgld.supabase.co/**', (r) => r.abort());
await ctx.route('**/api/v1/**', (r) => r.abort());
const p = await ctx.newPage(); const errs = [];
p.on('pageerror', (e) => errs.push(e.message.slice(0, 140)));
p.on('dialog', (d) => d.dismiss().catch(() => {}));
const open = async () => { await p.goto('http://localhost:5173/?demo=0' + start, { waitUntil: 'load' }); await p.waitForTimeout(900); };
const list = () => [...document.querySelectorAll('#app button, #app a, #app [role="button"], #app [onclick]')].filter((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 1 && r.height > 1 && cs.visibility !== 'hidden' && cs.display !== 'none' && !e.disabled; }).map((e, i) => { e.setAttribute('data-au', String(i)); return (e.getAttribute('aria-label') || e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60) + ' <' + String(e.className).split(' ')[0] + '>'; });
const snap = () => location.hash + '§' + document.getElementById('app').innerText.replace(/\s+/g, ' ') + '§' + document.querySelectorAll('#app .is-on,#app [aria-pressed="true"],#app [aria-expanded="true"],#app [open]').length + '§' + ((document.getElementById('c99-aviso') || {}).textContent || '') + '§' + Math.round(window.scrollY / 40) + '§' + (document.activeElement && document.activeElement.tagName === 'INPUT' ? 'foco' : '');
await open();
const names = await p.evaluate(list);
const rows = []; const seen = {};
for (let i = 0; i < names.length; i++) {
  if (seen[names[i]] >= 2) continue; seen[names[i]] = (seen[names[i]] || 0) + 1;
  if (/Sair da conta/.test(names[i])) continue;
  await open(); await p.evaluate(list);
  const before = await p.evaluate(snap);
  const pages0 = ctx.pages().length;
  try { await p.evaluate((k) => { const e = document.querySelector('[data-au="' + k + '"]'); e.scrollIntoView({ block: 'center' }); }, i); await p.waitForTimeout(60); const b2 = await p.evaluate(snap); await p.click('[data-au="' + i + '"]', { timeout: 1500, force: true }); await p.waitForTimeout(450);
    const after = await p.evaluate(snap); const txt = after.split('§')[1] + after.split('§')[3];
    let kind = 'ok';
    if (ctx.pages().length > pages0) { kind = 'ok'; for (const x of ctx.pages().slice(1)) await x.close(); }
    else if (/fora dest[ae] (versão|protótipo)|protótipo|Abriria/i.test(txt) && !/fora dest[ae] (versão|protótipo)|protótipo|Abriria/i.test(b2.split('§')[1])) kind = 'FORA';
    else if (after === b2) kind = 'NADA';
    rows.push(kind + ' | ' + names[i] + (kind === 'ok' && after.split('§')[0] !== b2.split('§')[0] ? ' -> ' + after.split('§')[0] : ''));
  } catch (e) { rows.push('ERRO | ' + names[i] + ' | ' + e.message.slice(0, 60)); }
}
fs.writeFileSync(`${out}/${tag}-${w}.txt`, rows.join('\n') + '\nerros js: ' + JSON.stringify(errs) + '\n');
console.log(tag, w, 'itens', rows.length, 'NADA', rows.filter((r) => r.startsWith('NADA')).length, 'FORA', rows.filter((r) => r.startsWith('FORA')).length, 'ERRO', rows.filter((r) => r.startsWith('ERRO')).length, 'js', errs.length);
await b.close();
