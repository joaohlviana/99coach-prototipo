// Acompanhamento mensal: sem vaga livre o aluno não é cobrado (o banco confere a vaga antes de abrir o pagamento);
// com acompanhamento ativo e renovação no cartão, o aluno vê a próxima cobrança e desliga ou religa a renovação.
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const b = await chromium.launch();
const srv = { act: 'pagamento_necessario', checkout: { outcome: 'sem_vaga', limit: 3, plan: 'essencial' }, calls: [], links: [],
  subs: [{ id: '22222222-2222-4222-8222-222222222222', trainer: 'Marina Duarte', description: 'Acompanhamento online', amountCents: 20000, currency: 'BRL', status: 'ativa', periodEnd: '2026-12-17T12:00:00Z', cancelAtEnd: false }],
  reqs: [{ id: 'R1', status: 'aceito', message: 'oi', created_at: '2026-11-10T21:00:00Z', expires_at: '2026-11-12T21:00:00Z', student_id: 'al', trainers: { slug: 'marina', name: 'Marina Duarte', user_id: 'tr' }, offers: { key: 'principal', title: 'Acompanhamento online', price_cents: 20000, unit: 'mes' } }] };
async function mk(uid) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.route('**/api/v1/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[]}' }));
  await ctx.route('**/rycaxboqkkiopjdecgld.supabase.co/**', async (route) => {
    const rq = route.request(), u = new URL(rq.url());
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' };
    if (rq.method() === 'OPTIONS') return route.fulfill({ status: 200, headers: cors });
    const j = (s, d) => route.fulfill({ status: s, headers: cors, body: JSON.stringify(d) });
    const body = rq.postData() ? JSON.parse(rq.postData()) : {};
    if (u.pathname === '/functions/v1/pagamentos') {
      srv.calls.push('fn:' + body.acao);
      if (body.acao === 'renovacao') { srv.subs[0].cancelAtEnd = body.cancelar !== false; return j(200, { ok: true, cancelada: srv.subs[0].cancelAtEnd, ate: srv.subs[0].periodEnd }); }
      return j(200, { ok: true, url: 'http://localhost:5173/?stripe=pagamento' });
    }
    const path = u.pathname.replace('/rest/v1/', '');
    if (/^rpc\//.test(path)) srv.calls.push(path.slice(4));
    if (path === 'rpc/activate_accepted_request') return j(200, { outcome: srv.act });
    if (path === 'rpc/create_checkout') return j(200, srv.checkout);
    if (path === 'rpc/my_coaching_subscriptions') return j(200, srv.subs);
    if (path === 'requests') return j(200, srv.reqs);
    if (path === 'links') return j(200, srv.links);
    if (path === 'trainers') return j(200, [{ id: 'T1', slug: 'marina' }]);
    if (path === 'profiles') return j(200, [{ id: uid, roles: ['aluno'] }]);
    return j(200, []);
  });
  const p = await ctx.newPage(); p.errs = []; p.on('pageerror', (e) => p.errs.push(e.message.slice(0, 160)));
  await p.goto('http://localhost:5173/', { waitUntil: 'load' }); await p.waitForTimeout(500);
  await p.evaluate((u) => {
    localStorage.setItem('c99.sessao', JSON.stringify({ access_token: 't', refresh_token: 'r', user: { id: u, email: u + '@x.com' } }));
    const C = PAGES.onboarding.Comp;
    STORE.saveOnb(Object.assign(C.prototype.base.call(C.prototype, 'aluno', ''), { name: 'Caio Prado', dadosSaved: true, conta: true, step: 'pronto', scn: '' }));
  }, uid);
  await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1600);
  return p;
}
const txt = (p) => p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
const click = async (p, re, last) => p.evaluate(([src, l]) => { const re2 = new RegExp(src); const all = [...document.querySelectorAll('button')].filter((x) => re2.test(x.textContent.trim()) && x.offsetParent); const e = l ? all[all.length - 1] : all[0]; if (e) e.click(); return !!e; }, [re.source, !!last]);

// 1. sem vaga: o banco recusa antes de criar a cobrança; o Stripe nem é chamado
const al = await mk('al');
await al.evaluate(() => NAV.go('aluno', {}, null)); await al.waitForTimeout(1500);
await click(al, /^Pagar e começar$/); await al.waitForTimeout(1200);
let t = await txt(al);
console.log('1 sem vaga não cobra:', srv.calls.includes('create_checkout'), !srv.calls.includes('fn:checkout'), /sem vaga livre agora\. Nada foi cobrado/.test(t), (await al.evaluate(() => location.pathname)) === '/app');

// 2. acompanhamento ativo com renovação mensal
srv.reqs = []; srv.links = [{ id: 'L9', status: 'ativo', origin: 'pedido', prep: 'awaiting_client', answers: {}, created_at: '2026-11-12T12:00:00Z', student_id: 'al', trainers: { slug: 'marina', name: 'Marina Duarte', user_id: 'tr' }, workouts: [] }];
srv.calls = [];
const al2 = await mk('al');
await al2.evaluate(() => NAV.go('aluno', {}, null)); await al2.waitForTimeout(2500); t = await txt(al2);
console.log('2 renovação visível:', srv.calls.includes('my_coaching_subscriptions'), /Renovação mensal/i.test(t), /R\$ 200,00\/mês/.test(t), /próxima cobrança em 17\/12\/2026/.test(t));
await click(al2, /^Desligar renovação$/); await al2.waitForTimeout(600); t = await txt(al2);
const confirma = /Nada mais será cobrado depois deste mês/.test(t);
await click(al2, /^Desligar renovação$/, true); await al2.waitForTimeout(1500); t = await txt(al2);
console.log('3 desligar pede confirmação e não cobra mais:', confirma, srv.calls.includes('fn:renovacao'), srv.subs[0].cancelAtEnd === true, /acompanhamento até 17\/12\/2026/.test(t), /Religar renovação/.test(t));
await click(al2, /^Religar renovação$/); await al2.waitForTimeout(1500); t = await txt(al2);
console.log('4 religar volta a renovar:', srv.subs[0].cancelAtEnd === false, /Renova automaticamente/.test(t));
console.log('errs', al.errs, al2.errs);
await b.close();
