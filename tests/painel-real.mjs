// Insights e Credenciais do treinador com dados do servidor (simulado): sem números inventados, "Sem base" honesto.
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const b = await chromium.launch();
const srv = { calls: [], t: { slug: 'marina-d', name: 'Marina Duarte', cref: '012345-G/PR', cref_status: 'informado', cref_note: null, status: 'publicado' } };
const M = (id, unit, status, value, num, den, br) => ({ metric_id: id, unit, status, value: status === 'ready' ? value : null, numerator: num, denominator: den, period: { from: '2026-10-15T00:00:00Z', to: '2026-11-12T00:00:00Z' }, computed_at: '2026-11-12T12:00:00Z', breakdown: br || {} });
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
await ctx.route('**/api/v1/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[]}' }));
await ctx.route('**/rycaxboqkkiopjdecgld.supabase.co/**', async (route) => {
  const rq = route.request(), u = new URL(rq.url());
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' };
  if (rq.method() === 'OPTIONS') return route.fulfill({ status: 200, headers: cors });
  const j = (s, d) => route.fulfill({ status: s, headers: cors, body: JSON.stringify(d) });
  const path = u.pathname.replace('/rest/v1/', '');
    // mesmas regras do banco real (conferidas em 12/11): coluna inexistente, convite individual sem e-mail e chave de repetição curta são recusados
    if (path === 'sessions' && /submitted_at/.test(decodeURIComponent(u.search)) && !/submitted_at:received_at/.test(decodeURIComponent(u.search))) return route.fulfill({ status: 400, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' }, body: JSON.stringify({ message: 'column sessions.submitted_at does not exist' }) });
    if (path === 'invites' && rq.method() === 'POST') { const bb = JSON.parse(rq.postData() || '{}'); if (bb.kind === 'individual' && !bb.recipient_email) return route.fulfill({ status: 400, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' }, body: JSON.stringify({ message: 'new row for relation "invites" violates check constraint "invites_check"' }) }); }
    if (/^rpc\//.test(path) && rq.postData()) { const kk = JSON.parse(rq.postData()).p_idem; if (kk != null && (String(kk).length < 8 || String(kk).length > 200)) return route.fulfill({ status: 400, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' }, body: JSON.stringify({ message: 'chave de idempotência inválida' }) }); }
  if (/^rpc\//.test(path)) srv.calls.push(path.slice(4));
  if (path === 'rpc/trainer_metrics') return j(200, [M('TM01', 'count', 'unavailable'), M('TM03', 'ratio', 'insufficient_data', null, 2, 3, { amostra_minima: 5 }), M('TM04', 'duration_seconds', 'ready', 5400, 6, null, { p90: 30000, sem_resposta: 1 }), M('TM07', 'count', 'ready', 2, 2), M('TM11', 'money', 'unavailable')]);
  if (path === 'rpc/my_capacity') return j(200, { plan: 'essencial', limit: 3, used: 2, held: 1, free: 0 });
  if (path === 'rpc/request_cref_review') { srv.t.cref_status = 'em_conferencia'; return j(200, { status: 'em_conferencia', review: 'X' }); }
  if (path === 'rpc/retire_my_profile') { srv.t.status = 'retirado'; return j(200, { status: 'retirado' }); }
  if (path === 'trainers') return j(200, /select=slug,name,cref/.test(u.search) ? [srv.t] : [{ id: 'T1' }]);
  if (path === 'profiles') return j(200, [{ id: 'tr', roles: ['treinador'] }]);
  return j(200, []);
});
const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 160)));
await p.goto('http://localhost:5173/', { waitUntil: 'load' }); await p.waitForTimeout(500);
await p.evaluate(() => {
  localStorage.setItem('c99.sessao', JSON.stringify({ access_token: 't', refresh_token: 'r', user: { id: 'tr', email: 'tr@x.com' } }));
  const C = PAGES.onboarding.Comp;
  STORE.saveOnb(Object.assign(C.prototype.base.call(C.prototype, 'treinador', ''), { name: 'Marina Duarte', dadosSaved: true, conta: true, step: 'hoje', scn: '', published: true }));
});
await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1500);
const txt = () => p.evaluate(() => document.getElementById('app').innerText.replace(/\s+/g, ' '));
const press = async (re) => { for (const h of await p.$$('#app button')) { const t = (await h.textContent()).trim(); if (re.test(t) && (await h.isVisible())) { await h.click(); await p.waitForTimeout(500); return t; } } return null; };
await p.evaluate(() => NAV.go('treinador', { s: 'insights' }, null)); await p.waitForTimeout(1200);
let t = await txt();
console.log('1 insights do servidor:', srv.calls.includes('trainer_metrics'), '| sem números de exemplo:', !/412/.test(t));
console.log('  sem base honesto:', /Pedidos respondidos no prazo Sem base/i.test(t), /pelo menos 5 casos/.test(t));
console.log('  tempo de resposta:', /1,5 h/.test(t), /9 em cada 10 respondidos em até 8,3 h/.test(t), /1 pedido sem resposta/.test(t));
console.log('  vagas:', /3 de 3 vagas em uso/.test(t), /Vagas esgotadas/.test(t), '| sem fonte listado:', /Visitas ao perfil/.test(t) && /modo de teste/.test(t));
await p.evaluate(() => NAV.go('treinador', { s: 'credenciais' }, null)); await p.waitForTimeout(1200);
t = await txt();
console.log('2 credenciais reais:', /CREF 012345-G\/PR/.test(t), /Informado por você/i.test(t), '| sem exemplos:', !/CrossFit Level 1/.test(t));
await press(/Pedir conferência/); t = await txt();
console.log('  pediu conferência:', srv.calls.includes('request_cref_review'), /Em conferência/i.test(t));
await press(/Retirar meu perfil/); await p.waitForTimeout(300);
for (const h of await p.$$('button')) { if (/^Retirar perfil$/.test((await h.textContent()).trim()) && await h.isVisible()) { await h.click(); break; } }
await p.waitForTimeout(800); t = await txt();
console.log('  retirou:', srv.calls.includes('retire_my_profile'), /está retirado da busca/.test(t));
console.log('errs', JSON.stringify(errs));
await b.close();
