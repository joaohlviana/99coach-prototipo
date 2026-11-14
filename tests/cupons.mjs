// Cupons: o treinador cria e desativa; o aluno informa o código no pedido aceito antes de pagar (servidor simulado).
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const b = await chromium.launch();
const srv = { cps: [], calls: [] };
const route = async (ctx, who) => ctx.route('**/rycaxboqkkiopjdecgld.supabase.co/**', async (r) => {
  const rq = r.request(), u = new URL(rq.url());
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'content-type': 'application/json' };
  if (rq.method() === 'OPTIONS') return r.fulfill({ status: 200, headers: cors });
  const j = (d, s) => r.fulfill({ status: s || 200, headers: cors, body: JSON.stringify(d) });
  const path = u.pathname.replace('/rest/v1/', ''), q = decodeURIComponent(u.search);
  const body = (() => { try { return JSON.parse(rq.postData() || '{}'); } catch (_) { return {}; } })();
  if (/functions\/v1\/pagamentos/.test(u.pathname)) return j({ ok: true, real: true, conta: false });
  if (path === 'coupons') {
    if (rq.method() === 'POST') { if (srv.cps.some((c) => c.code === body.code)) return j({ message: 'duplicate' }, 409); srv.cps.push(Object.assign({ id: 'C' + srv.cps.length, used: 0, active: true }, body)); return j([]); }
    if (rq.method() === 'PATCH') { const id = (q.match(/id=eq\.([^&]+)/) || [])[1]; Object.assign(srv.cps.find((c) => c.id === id), body); return j([]); }
    return j(srv.cps);
  }
  if (path === 'rpc/apply_coupon') {
    srv.calls.push(body.p_code);
    const c = srv.cps.find((x) => x.code === body.p_code && x.active);
    return j(c ? { outcome: 'aplicado', code: c.code, percentOff: c.percent_off, amountCents: Math.round(20000 * (100 - c.percent_off) / 100), fullCents: 20000 } : { outcome: 'cupom_invalido' });
  }
  if (path === 'requests') return j(who === 'al' ? [{ id: 'R1', status: 'aceito', message: 'Quero', created_at: '2026-11-10T21:00:00Z', expires_at: '2026-11-20T21:00:00Z', decided_at: '2026-11-11T10:00:00Z', student_id: 'al', trainers: { slug: 'm', name: 'Marina Duarte', user_id: 'tr' }, offers: { key: 'on', title: 'Acompanhamento online', price_cents: 20000, unit: 'mês' } }] : []);
  if (path === 'rpc/activate_accepted_request') return j({ outcome: 'pagamento_necessario' });
  if (path === 'profiles') return j([{ id: who, roles: [who === 'al' ? 'aluno' : 'treinador'] }]);
  if (path === 'trainers') return j(who === 'tr' ? [{ id: 'T1' }] : []);
  return j([]);
});
const login = async (who, area, name) => {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); await route(ctx, who);
  await ctx.route('**/api/v1/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[]}' }));
  const p = await ctx.newPage(); p.errs = []; p.on('pageerror', (e) => p.errs.push(e.message.slice(0, 160)));
  await p.goto('http://localhost:5173/', { waitUntil: 'load' }); await p.waitForTimeout(500);
  await p.evaluate(([w, a, n]) => {
    localStorage.setItem('c99.sessao', JSON.stringify({ access_token: 't' + w, refresh_token: 'r', user: { id: w, email: w + '@x.com' } }));
    const C = PAGES.onboarding.Comp;
    STORE.saveOnb(Object.assign(C.prototype.base.call(C.prototype, a, ''), { name: n, dadosSaved: true, conta: true, step: a === 'treinador' ? 'hoje' : 'pronto', scn: '' }));
  }, [who, area, name]);
  await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1500); return p;
};
const T = (p) => p.evaluate(() => document.getElementById('app').innerText.replace(/\s+/g, ' '));
const press = async (p, re, sel) => { for (const h of await p.$$(sel || '#app button')) { const t = (await h.textContent()).trim(); if (re.test(t) && (await h.isVisible())) { await h.click(); await p.waitForTimeout(600); return t; } } return null; };
// 1. treinador cria cupom
const tr = await login('tr', 'treinador', 'Marina Duarte');
await tr.evaluate(() => GO('H09R')); await tr.waitForTimeout(1200);
console.log('1 cupons vazio:', /Nenhum cupom criado/.test(await T(tr)));
await press(tr, /^Novo cupom$/); await tr.fill('#cp-c', 'ab'); await tr.fill('#cp-p', '10'); await press(tr, /^Criar cupom$/);
console.log('  valida o código:', /de 4 a 20 letras ou números/.test(await T(tr)), srv.cps.length === 0);
await tr.fill('#cp-c', 'bemvindo10'); await press(tr, /^Criar cupom$/); await tr.waitForTimeout(500);
console.log('  criado:', srv.cps.length === 1 && srv.cps[0].code === 'BEMVINDO10' && srv.cps[0].percent_off === 10 && srv.cps[0].trainer_id === 'T1', /BEMVINDO10/.test(await T(tr)), /10% de desconto/.test(await T(tr)));
// 2. aluno usa o cupom
const al = await login('al', 'aluno', 'Caio Prado');
await al.evaluate(() => NAV.go('aluno', { s: 'semvinculo', navFrom: 'hoje' }, null)); await al.waitForTimeout(1500);
console.log('2 aluno vê o cupom no pedido aceito:', !!(await press(al, /^Tenho um cupom$/)));
await al.fill('input[aria-label="Código do cupom"]', 'errado'); await press(al, /^Usar cupom$/);
console.log('  cupom inválido avisa:', /Cupom não encontrado, vencido ou esgotado/.test(await T(al)));
await al.fill('input[aria-label="Código do cupom"]', 'bemvindo10'); await press(al, /^Usar cupom$/);
console.log('  cupom aplicado com valor do servidor:', /Cupom BEMVINDO10 aplicado: 10% de desconto · você paga R\$ 180,00/.test(await T(al)), srv.calls.join(','));
// 3. treinador desativa
await press(tr, /^Desativar$/); await tr.waitForTimeout(500);
console.log('3 desativado:', srv.cps[0].active === false, /Desativado/i.test(await T(tr)));
console.log('errs', tr.errs, al.errs);
await b.close();
