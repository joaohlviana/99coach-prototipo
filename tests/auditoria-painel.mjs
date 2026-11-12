// Auditoria dentro da área logada (servidor simulado, conta nova): clica em tudo, tela por tela,
// e lista os cliques que só mostram aviso de "não disponível / fora desta versão".
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const fs = await import('node:fs');
const [out, who] = [process.argv[2], process.argv[3]];
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.route('**/api/v1/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[]}' }));
await ctx.route('**/rycaxboqkkiopjdecgld.supabase.co/**', async (route) => {
  const rq = route.request(), u = new URL(rq.url());
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' };
  if (rq.method() === 'OPTIONS') return route.fulfill({ status: 200, headers: cors });
  if (u.pathname.startsWith('/storage/')) return route.abort();
  const path = u.pathname.replace('/rest/v1/', '');
    // mesmas regras do banco real (conferidas em 12/11): coluna inexistente, convite individual sem e-mail e chave de repetição curta são recusados
    if (path === 'sessions' && /submitted_at/.test(decodeURIComponent(u.search)) && !/submitted_at:received_at/.test(decodeURIComponent(u.search))) return route.fulfill({ status: 400, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' }, body: JSON.stringify({ message: 'column sessions.submitted_at does not exist' }) });
    if (path === 'invites' && rq.method() === 'POST') { const bb = JSON.parse(rq.postData() || '{}'); if (bb.kind === 'individual' && !bb.recipient_email) return route.fulfill({ status: 400, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' }, body: JSON.stringify({ message: 'new row for relation "invites" violates check constraint "invites_check"' }) }); }
    if (/^rpc\//.test(path) && rq.postData()) { const kk = JSON.parse(rq.postData()).p_idem; if (kk != null && (String(kk).length < 8 || String(kk).length > 200)) return route.fulfill({ status: 400, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' }, body: JSON.stringify({ message: 'chave de idempotência inválida' }) }); }
  if (path === 'profiles') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify([{ id: 'u1', roles: [who] }]) });
  if (path === 'trainers') return route.fulfill({ status: 200, headers: cors, body: JSON.stringify([{ id: 'T1' }]) });
  return route.fulfill({ status: 200, headers: cors, body: '[]' });
});
const p = await ctx.newPage(); const errs = [];
p.on('pageerror', (e) => errs.push(e.message.slice(0, 140)));
p.on('dialog', (d) => d.dismiss().catch(() => {}));
await p.goto('http://localhost:5173/?demo=0', { waitUntil: 'load' }); await p.waitForTimeout(500);
await p.evaluate((w) => {
  localStorage.setItem('c99.sessao', JSON.stringify({ access_token: 't', refresh_token: 'r', user: { id: 'u1', email: 'u1@x.com' } }));
  const C = PAGES.onboarding.Comp;
  STORE.saveOnb(Object.assign(C.prototype.base.call(C.prototype, w, ''), { name: 'Conta Teste', dadosSaved: true, conta: true, step: w === 'treinador' ? 'hoje' : 'pronto', scn: '' }));
}, who);
await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1500);
const home = '#' + who;
const goHome = async () => { await p.evaluate((h) => { const a = document.getElementById('c99-aviso'); if (a) a.textContent = ''; location.hash = h; }, home); await p.waitForTimeout(350); };
const list = () => [...document.querySelectorAll('#app button, #app a, #app [role="button"]')].filter((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 1 && r.height > 1 && cs.visibility !== 'hidden' && !e.disabled; }).map((e, i) => { e.setAttribute('data-au', String(i)); return (e.getAttribute('aria-label') || e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 50); });
const bad = () => { const a = ((document.getElementById('c99-aviso') || {}).textContent || '').trim(); const t = document.getElementById('app').innerText; const m = t.match(/[^.\n]*(fora dest[ae] (versão|protótipo)|protótipo|ainda não está disponível)[^.\n]*/i); return a || (m ? m[0].trim() : ''); };
// telas alcançáveis a partir do hub: visita em largura (até 60 telas)
const queue = [home], seen = new Set([home]), rows = [];
while (queue.length && seen.size <= 60) {
  const scr = queue.shift();
  await p.evaluate((h) => { location.hash = h; }, scr); await p.waitForTimeout(450);
  const names = await p.evaluate(list); const base = await p.evaluate(bad);
  for (let i = 0; i < names.length; i++) {
    if (/Sair da conta|Excluir|Encerrar/.test(names[i])) continue;
    await p.evaluate((h) => { const a = document.getElementById('c99-aviso'); if (a) a.textContent = ''; if (location.hash !== h) location.hash = h; }, scr); await p.waitForTimeout(60);
    if ((await p.evaluate(() => location.hash)) !== scr) await p.waitForTimeout(350);
    await p.evaluate(list);
    try { await p.click('[data-au="' + i + '"]', { timeout: 800, force: true }); } catch (_) { continue; }
    await p.waitForTimeout(260);
    const h2 = await p.evaluate(() => location.hash); const msg = await p.evaluate(bad);
    if (msg && msg !== base) rows.push(scr + ' | ' + names[i] + ' => ' + msg.slice(0, 110));
    if (h2 !== scr && h2.indexOf('#' + who) === 0 && !seen.has(h2)) { seen.add(h2); queue.push(h2); }
    if (h2 !== scr || (await p.evaluate(() => !!document.querySelector('#app [role="dialog"], #app .v4-sheet')))) { await p.evaluate((h) => { location.hash = '#home'; }, scr); await p.waitForTimeout(150); await p.evaluate((h) => { location.hash = h; }, scr); await p.waitForTimeout(400); }
  }
}
const uniq = [...new Set(rows)];
fs.writeFileSync(`${out}/log-${who}.txt`, 'telas: ' + [...seen].join(' ') + '\n' + uniq.join('\n') + '\nerros js: ' + JSON.stringify([...new Set(errs)]) + '\n');
console.log(who, 'telas', seen.size, 'avisos', uniq.length, 'erros js', new Set(errs).size);
await b.close();
