// Minha assinatura (treinador): plano e vagas do servidor; assinar, recusa do Stripe, Pro ativo e cancelar renovação (simulado).
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const calls = []; let state = { ok: true, real: true, plano: 'essencial', status: null };
await ctx.route('**/api/v1/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[]}' }));
await ctx.route('**/rycaxboqkkiopjdecgld.supabase.co/**', async (route) => {
  const rq = route.request(), u = new URL(rq.url());
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' };
  if (rq.method() === 'OPTIONS') return route.fulfill({ status: 200, headers: cors });
  const j = (d) => route.fulfill({ status: 200, headers: cors, body: JSON.stringify(d) });
  const path = u.pathname.replace('/rest/v1/', '');
  if (/functions\/v1\/pagamentos/.test(u.pathname)) {
    const bd = JSON.parse(rq.postData() || '{}'); calls.push(bd.acao + (bd.ciclo ? ':' + bd.ciclo : ''));
    if (bd.acao === 'pro_estado') return j(state);
    if (bd.acao === 'pro_cancelar') { state = Object.assign({}, state, { cancelaNoFim: true }); return j(state); }
    return j({ ok: false, motivo: 'stripe_recusou', detalhe: 'teste' });
  }
  if (path === 'rpc/my_capacity') return j([state.plano === 'pro' ? { plan: 'pro', limit: 50, used: 1, held: 0, free: 49 } : { plan: 'essencial', limit: 3, used: 1, held: 1, free: 1 }]);
  if (path === 'profiles') return j([{ id: 'tr', roles: ['treinador'] }]);
  if (path === 'trainers') return j([{ id: 'T1' }]);
  return j([]);
});
const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 160)));
await p.goto('http://localhost:5173/', { waitUntil: 'load' }); await p.waitForTimeout(500);
await p.evaluate(() => {
  localStorage.setItem('c99.sessao', JSON.stringify({ access_token: 't', refresh_token: 'r', user: { id: 'tr', email: 'tr@x.com' } }));
  const C = PAGES.onboarding.Comp;
  STORE.saveOnb(Object.assign(C.prototype.base.call(C.prototype, 'treinador', ''), { name: 'Marina Duarte', dadosSaved: true, conta: true, step: 'hoje', scn: '', published: false }));
});
const T = () => p.evaluate(() => document.getElementById('conteudo').innerText.replace(/\s+/g, ' '));
const press = async (re) => { for (const h of await p.$$('#app button')) { const t = (await h.textContent()).trim(); if (re.test(t) && (await h.isVisible())) { await h.click(); await p.waitForTimeout(700); return t; } } return null; };
const abrir = async () => { await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1500); await p.evaluate(() => NAV.go('treinador', { s: 'hoje' }, null)); await p.waitForTimeout(900); await press(/^Minha assinatura$/); await p.waitForTimeout(700); return T(); };
let t = await abrir();
console.log('1 essencial:', /Essencial/.test(t), /2 de 3 vagas em uso/.test(t), '| oferece Pro:', /Assinar mensal · R\$ 99/.test(t), /7 dias de teste gratuito/.test(t));
await press(/^Assinar anual/); t = await T();
console.log('2 recusa do Stripe aparece:', /Nada foi cobrado/.test(t), '| pediu anual:', calls.includes('pro_assinar:year'));
state = { ok: true, real: true, plano: 'pro', status: 'active', ciclo: 'month', periodoAte: '2026-12-14T12:00:00Z', cancelaNoFim: false };
t = await abrir();
console.log('3 pro ativo:', /Pro/.test(t), /Ativo/i.test(t), /R\$ 99 por mês/.test(t), /Próxima cobrança em 14\/12\/2026/.test(t), '| não oferece comprar:', !/Assinar mensal/.test(t));
await press(/^Cancelar renovação$/);
for (const h of await p.$$('.mod-sheet button')) { if ((await h.textContent()).trim() === 'Cancelar renovação') { await h.click(); break; } }
await p.waitForTimeout(900); t = await T();
console.log('4 cancelado no fim do período:', /Renovação desligada: o Pro vale até 14\/12\/2026/.test(t), /Religar renovação/.test(t), calls.includes('pro_cancelar'));
console.log('errs', errs);
await b.close();
