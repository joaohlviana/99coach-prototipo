// Fase 8: pedido aceito inicia o acompanhamento quando não há cobrança; com cobrança, o aluno paga primeiro.
// Recebimentos do treinador: sem configuração a tela diz que não está ligado; configurado, oferece ativar.
// Servidor simulado com as respostas do banco real conferidas em 12/11 (activate_accepted_request, create_checkout).
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const b = await chromium.launch();
const srv = { act: 'pagamento_necessario', pay: { ok: false, motivo: 'pagamentos_nao_configurados' }, estado: { ok: false, motivo: 'pagamentos_nao_configurados' }, calls: [], links: [],
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
    if (u.pathname === '/functions/v1/pagamentos') { srv.calls.push('fn:' + body.acao); if (!/^Bearer /.test(rq.headers().authorization || '')) return j(401, {}); return j(200, body.acao === 'checkout' ? srv.pay : body.acao === 'ativar' ? Object.assign({}, srv.estado, { url: 'http://localhost:5173/?stripe=cadastro' }) : srv.estado); }
    const path = u.pathname.replace('/rest/v1/', '');
    if (/^rpc\//.test(path)) { srv.calls.push(path.slice(4)); const kk = body.p_idem; if (kk != null && (String(kk).length < 8 || String(kk).length > 200)) return j(400, { message: 'chave de idempotência inválida' }); }
    if (path === 'rpc/activate_accepted_request') { if (srv.act === 'vinculo_ativo' && !srv.links.length) srv.links.push({ id: 'L9', status: 'ativo', origin: 'pedido', prep: 'awaiting_client', answers: {}, created_at: '2026-11-12T12:00:00Z', student_id: 'al', trainers: { slug: 'marina', name: 'Marina Duarte', user_id: 'tr' }, workouts: [] }); return j(200, { outcome: srv.act }); }
    if (path === 'rpc/create_checkout') return j(200, { outcome: 'aguardando_pagamento', intent: '11111111-1111-4111-8111-111111111111', amountCents: 20000, applicationFeeCents: 1000 });
    if (path === 'requests') return j(200, srv.reqs);
    if (path === 'links') return j(200, srv.links);
    if (path === 'receivables') return j(200, srv.recv || []);
    if (path === 'trainers') return j(200, [{ id: 'T1', slug: 'marina' }]);
    if (path === 'profiles') return j(200, /id=in/.test(u.search) ? [{ id: 'al', display_name: 'Caio Prado' }] : [{ id: uid, roles: [uid === 'tr' ? 'treinador' : 'aluno'] }]);
    return j(200, []);
  });
  const p = await ctx.newPage(); p.errs = []; p.on('pageerror', (e) => p.errs.push(e.message.slice(0, 160)));
  await p.goto('http://localhost:5173/', { waitUntil: 'load' }); await p.waitForTimeout(500);
  await p.evaluate(([u, w]) => {
    localStorage.setItem('c99.sessao', JSON.stringify({ access_token: 't', refresh_token: 'r', user: { id: u, email: u + '@x.com' } }));
    const C = PAGES.onboarding.Comp;
    STORE.saveOnb(Object.assign(C.prototype.base.call(C.prototype, w, ''), { name: u === 'tr' ? 'Marina Duarte' : 'Caio Prado', dadosSaved: true, conta: true, step: u === 'tr' ? 'hoje' : 'pronto', scn: '' }));
  }, [uid, uid === 'tr' ? 'treinador' : 'aluno']);
  await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1600);
  return p;
}
const txt = (p) => p.evaluate(() => document.getElementById('app').innerText.replace(/\s+/g, ' '));
const click = async (p, re) => p.evaluate((src) => { const re2 = new RegExp(src); const e = [...document.querySelectorAll('#app button')].find((x) => re2.test(x.textContent.trim()) && x.offsetParent); if (e) e.click(); return !!e; }, re.source);

// 1. aluno com pedido aceito e cobrança possível: vê "falta o pagamento" e o botão de pagar
const al = await mk('al');
await al.evaluate(() => NAV.go('aluno', {}, null)); await al.waitForTimeout(1500);
let t = await txt(al);
console.log('1 aceito com cobrança:', /Aceito · falta o pagamento para começar/.test(t), /Pagar e começar/.test(t), '| consultou o servidor:', srv.calls.includes('activate_accepted_request'));
await click(al, /^Pagar e começar$/); await al.waitForTimeout(1200); t = await txt(al);
console.log('  pagamento não configurado: nada cobrado e a tela diz:', srv.calls.includes('create_checkout') && srv.calls.includes('fn:checkout'), /pagamento pelo app ainda não está ligado/i.test(t), (await al.evaluate(() => location.pathname)) === '/app');
srv.pay = { ok: true, url: 'http://localhost:5173/?stripe=pagamento' };
await click(al, /^Pagar e começar$/); await al.waitForTimeout(1800);
console.log('  configurado: vai para a página de pagamento:', /stripe=pagamento/.test(al.url()));

// 2. sem cobrança possível: o pedido aceito inicia o acompanhamento sozinho
srv.act = 'vinculo_ativo'; srv.calls = [];
const al2 = await mk('al');
await al2.evaluate(() => NAV.go('aluno', {}, null)); await al2.waitForTimeout(2500); t = await txt(al2);
console.log('2 aceito sem cobrança inicia o acompanhamento:', srv.links.length === 1, /VOCÊ E MARINA ESTÃO CONECTADOS|Preparação/i.test(t), '| sem botão de pagar:', !/Pagar e começar/.test(t));

// 3. treinador: recebimentos
const tr = await mk('tr');
await tr.evaluate(() => NAV.go('treinador', { s: 'recebimentos' }, null)); await tr.waitForTimeout(1500); t = await txt(tr);
console.log('3 recebimentos sem configuração:', /Recebimentos pelo app ainda não estão ligados/.test(t), !/Ativar recebimento/.test(t), /Nenhum pagamento recebido ainda/.test(t));
srv.estado = { ok: true, conta: false };
await click(tr, /^Tentar de novo$/); await tr.waitForTimeout(1200); t = await txt(tr);
console.log('  configurado, sem conta:', /Você ainda não ativou o recebimento/.test(t), /Modo de teste: nenhuma cobrança é de verdade/.test(t), /fica com 5%/.test(t));
srv.estado = { ok: true, real: true, conta: true, cobrancas: true, repasses: true, cadastroEnviado: true, pendencias: 0 };
srv.recv = [{ order_id: 'O1', gross_cents: 20000, provider_fee_cents: 838, platform_fee_cents: 1000, net_cents: 18162, refunded_cents: 0, status: 'em_liberacao', available_on: '2026-12-12T00:00:00Z', updated_at: '2026-11-12T12:00:00Z' }];
await tr.reload({ waitUntil: 'load' }); await tr.waitForTimeout(1500); await tr.evaluate(() => NAV.go('treinador', { s: 'recebimentosreal' }, null)); await tr.waitForTimeout(1500); t = await txt(tr);
console.log('  ativo com um pagamento:', /Recebimento ativo: alunos podem pagar pelo app/.test(t), /Cobranças de verdade/.test(t), /R\$ 200,00 pago pelo aluno/.test(t), /Comissão 99coach R\$ 10,00 · tarifa do Stripe R\$ 8,38 · líquido R\$ 181,62/.test(t), /Em liberação/i.test(t), !/Ativar recebimento/.test(t));
console.log('errs', al.errs, al2.errs, tr.errs);
await b.close();
