// Suporte com protocolo de verdade: o formulário da Central de ajuda grava o chamado no banco (submit_support_case),
// mostra o protocolo, consulta a situação com a chave guardada no aparelho e mostra a resposta da equipe;
// a equipe vê o chamado na fila "Suporte" do painel e responde. Servidor simulado com o formato das funções reais (17/11).
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const b = await chromium.launch();
const jwt = 'x.' + Buffer.from(JSON.stringify({ sub: 'adm', aal: 'aal2' })).toString('base64url') + '.y';
const srv = { calls: [], cases: [] };
const route = async (ctx) => {
  await ctx.route('**/api/v1/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[]}' }));
  await ctx.route('**/rycaxboqkkiopjdecgld.supabase.co/**', async (rt) => {
    const rq = rt.request(), u = new URL(rq.url());
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'content-type': 'application/json' };
    if (rq.method() === 'OPTIONS') return rt.fulfill({ status: 200, headers: cors });
    const j = (s, d) => rt.fulfill({ status: s, headers: cors, body: JSON.stringify(d) });
    const body = rq.postData() ? JSON.parse(rq.postData()) : {};
    if (u.pathname === '/auth/v1/user') return j(200, { id: 'adm', factors: [{ id: 'F1', factor_type: 'totp', status: 'verified' }] });
    const p = u.pathname.replace('/rest/v1/', ''); srv.calls.push(p);
    if (p === 'rpc/submit_support_case') {
      if (!/^[A-Za-z0-9_-]{20,80}$/.test(body.p_key || '')) return j(400, { message: 'codigo_invalido' });
      let c = srv.cases.find((x) => x.key === body.p_key);
      if (c) return j(200, { protocol: c.protocol, status: c.status, repeated: true });
      c = { id: 'c' + (srv.cases.length + 1), protocol: 'S-AB12CD3' + srv.cases.length, key: body.p_key, subject: body.p_subject, email: body.p_email, body: body.p_body, status: 'recebido', reply: null, at: '2026-11-17T21:00:00Z' };
      srv.cases.push(c); return j(200, { protocol: c.protocol, status: c.status, repeated: false });
    }
    if (p === 'rpc/support_case_status') { const c = srv.cases.find((x) => x.protocol === body.p_protocol && x.key === body.p_key); return j(200, c ? { protocol: c.protocol, subject: c.subject, status: c.status, reply: c.reply, created_at: c.at, updated_at: c.at } : { status: 'nao_encontrado' }); }
    if (p === 'rpc/is_admin') return j(200, true);
    if (p === 'rpc/admin_support_queue') return j(200, srv.cases.filter((c) => /recebido|em_andamento/.test(c.status)).map((c) => ({ case_id: c.id, protocol: c.protocol, subject: c.subject, contact_email: c.email, body: c.body, status: c.status, created_at: c.at })));
    if (p === 'rpc/admin_answer_support') { const c = srv.cases.find((x) => x.id === body.p_case); c.status = body.p_status; if (body.p_reply) c.reply = body.p_reply; return j(200, { case: c.id, status: c.status }); }
    if (/^rpc\/admin_/.test(p)) return j(200, []);
    if (p === 'profiles') return j(200, [{ id: 'adm', roles: [] }]);
    return j(200, []);
  });
};
const T = (p) => p.evaluate(() => document.getElementById('app').innerText.replace(/\s+/g, ' '));
const press = (p, re) => p.evaluate((src) => { const r = new RegExp(src); const e = [...document.querySelectorAll('#app button')].find((x) => r.test(x.textContent.trim()) && x.offsetParent); if (e) e.click(); return !!e; }, re.source);

// 1. visitante sem conta, site real: formulário de verdade
const c1 = await b.newContext({ viewport: { width: 1280, height: 900 } }); await route(c1);
const p = await c1.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 160)));
await p.goto('http://localhost:5173/app#publico-ajuda', { waitUntil: 'load' }); await p.waitForTimeout(2000);
await press(p, /^Falar com o suporte$/); await p.waitForTimeout(800);
let t = await T(p);
console.log('1 formulário no site real:', /Seu e-mail para resposta/i.test(t), !/Demonstração: não use dados reais/.test(t), /@99coach\.oficial/.test(t));
await press(p, /^Enviar solicitação$/); await p.waitForTimeout(500); t = await T(p);
console.log('2 campos obrigatórios:', /Escolha o assunto/.test(t), /e-mail válido/.test(t), !srv.calls.includes('rpc/submit_support_case'));
await press(p, /^Pagamento$/); await p.fill('#p2-aj-email', 'aluno@exemplo.com'); await p.fill('#p2-aj-texto', 'A cobrança apareceu duas vezes no meu cartão.'); await p.waitForTimeout(200);
await press(p, /^Enviar solicitação$/); await p.waitForTimeout(1500); t = await T(p);
const prot = srv.cases[0] && srv.cases[0].protocol;
console.log('3 chamado gravado com protocolo:', srv.cases.length === 1, new RegExp(prot).test(t), /Solicitação recebida/.test(t), /aluno@exemplo\.com/.test(t), /Recebida/.test(t));
// 4. a equipe responde no painel
const c2 = await b.newContext({ viewport: { width: 1280, height: 900 } }); await route(c2);
const a = await c2.newPage(); a.on('pageerror', (e) => errs.push(e.message.slice(0, 160)));
await a.goto('http://localhost:5173/', { waitUntil: 'load' });
await a.evaluate((tk) => localStorage.setItem('c99.sessao', JSON.stringify({ access_token: tk, refresh_token: 'r', user: { id: 'adm', email: 'adm@x.com' } })), jwt);
await a.goto('about:blank'); await a.goto('http://localhost:5173/app#publico-admin', { waitUntil: 'load' }); await a.waitForTimeout(2500);
await press(a, /^Filas de pedidos$/); await a.waitForTimeout(1500); t = await T(a);
console.log('4 fila de suporte no painel:', /Suporte \(1\)/.test(t), new RegExp('Pagamento · protocolo ' + prot).test(t), /resposta para aluno@exemplo\.com/.test(t));
await press(a, /^Responder$/); await a.waitForTimeout(400); t = await T(a);
const pedeTexto = /Escreva a resposta/.test(t);
const id = await a.evaluate(() => (document.querySelector('[id^="n-c"]') || {}).id);
await a.fill('#' + id, 'Estornamos a cobrança duplicada; o valor volta em até 7 dias.'); await a.waitForTimeout(200);
await press(a, /^Responder$/); await a.waitForTimeout(500);
const ok = await a.evaluate(() => { const bs = [...document.querySelectorAll('button')].filter((x) => /^Responder$/.test(x.textContent.trim()) && x.offsetParent); const e = bs[bs.length - 1]; if (e) e.click(); return !!e; });
await a.waitForTimeout(1500);
console.log('5 responder exige texto e grava:', pedeTexto, ok, srv.cases[0].status === 'respondido', /Estornamos/.test(srv.cases[0].reply || ''));
// 6. a pessoa consulta e vê a resposta
await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1500);
await p.evaluate(() => GO('@publico', { s: 'ajuda' })); await p.waitForTimeout(800);
await p.evaluate(() => { const e = [...document.querySelectorAll('#app button')].find((x) => /Acompanhar/.test(x.textContent) && x.offsetParent); if (e) e.click(); });
await p.waitForTimeout(1500); t = await T(p);
console.log('6 consulta mostra a resposta:', srv.calls.includes('rpc/support_case_status'), /Resposta da equipe/i.test(t), /Estornamos a cobrança duplicada/.test(t), /Respondida/.test(t));
// 7. protocolo de outro aparelho não abre
await p.fill('#p2-aj-prot', 'S-ZZZZZZZZ'); await p.waitForTimeout(200); await press(p, /^Consultar$/); await p.waitForTimeout(500); t = await T(p);
console.log('7 protocolo de outro aparelho:', /não foi aberto neste aparelho/.test(t));
console.log('errs', errs);
await b.close();
