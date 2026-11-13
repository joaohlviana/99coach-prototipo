// Verificação em duas etapas para qualquer conta: ligar em "Meus dados", ser barrado pelo servidor sem o código,
// entrar com o código, e desligar. Servidor simulado com a regra conferida no banco real em 13/11:
// conta com autenticador verificado e sessão sem código (aal1) recebe 403 "segunda_etapa_necessaria" em toda chamada à API.
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const b = await chromium.launch();
const tok = (aal) => 'h.' + Buffer.from(JSON.stringify({ aal, sub: 'al' })).toString('base64url') + '.s';
const srv = { factors: [], calls: [], blocked: 0 };
const L1 = { id: 'L1', status: 'ativo', origin: 'convite', prep: 'awaiting_client', answers: {}, created_at: '2026-11-01T12:00:00Z', student_id: 'al', trainers: { slug: 'marina', name: 'Marina Duarte', user_id: 'tr' }, workouts: [] };
async function mk(token) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.route('**/api/v1/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[]}' }));
  await ctx.route('**/rycaxboqkkiopjdecgld.supabase.co/**', async (route) => {
    const rq = route.request(), u = new URL(rq.url());
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'content-type': 'application/json' };
    if (rq.method() === 'OPTIONS') return route.fulfill({ status: 200, headers: cors });
    const j = (s, d) => route.fulfill({ status: s, headers: cors, body: JSON.stringify(d) });
    const body = rq.postData() ? JSON.parse(rq.postData()) : {};
    const bearer = (rq.headers().authorization || '').replace(/^Bearer /, '');
    let aal = 'aal1'; try { aal = JSON.parse(Buffer.from(bearer.split('.')[1], 'base64url').toString()).aal || 'aal1'; } catch (_) {}
    const verified = srv.factors.find((f) => f.status === 'verified');
    if (u.pathname.startsWith('/auth/v1/')) {
      const p = u.pathname.replace('/auth/v1/', '');
      srv.calls.push(rq.method() + ' ' + p.replace(/[0-9a-f-]{8,}/, ':id'));
      if (p === 'user') return j(200, { id: 'al', email: 'al@x.com', factors: srv.factors.map((f) => ({ id: f.id, factor_type: 'totp', status: f.status })) });
      if (p === 'factors' && rq.method() === 'POST') { const f = { id: 'fac' + (srv.factors.length + 1) + '-0000-0000', status: 'unverified' }; srv.factors.push(f); return j(200, { id: f.id, type: 'totp', totp: { qr_code: 'data:image/svg+xml;utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>', secret: 'JBSWY3DPEHPK3PXP' } }); }
      let m = /^factors\/([^/]+)\/challenge$/.exec(p); if (m) return j(200, { id: 'ch1' });
      m = /^factors\/([^/]+)\/verify$/.exec(p); if (m) { if (body.code !== '123456') return j(422, { msg: 'Invalid TOTP code entered' }); srv.factors.find((f) => f.id === m[1]).status = 'verified'; return j(200, { access_token: tok('aal2'), refresh_token: 'r2', user: { id: 'al', email: 'al@x.com' } }); }
      m = /^factors\/([^/]+)$/.exec(p); if (m && rq.method() === 'DELETE') { if (srv.factors.find((f) => f.id === m[1] && f.status === 'verified') && aal !== 'aal2') return j(403, { msg: 'AAL2 required' }); srv.factors = srv.factors.filter((f) => f.id !== m[1]); return j(200, {}); }
      return j(200, {});
    }
    // API de dados: a regra do banco
    if (verified && aal !== 'aal2') { srv.blocked++; return j(403, { code: '42501', message: 'segunda_etapa_necessaria', hint: 'confirme o código do aplicativo autenticador' }); }
    const path = u.pathname.replace('/rest/v1/', '');
    if (path === 'links') return j(200, [L1]);
    if (path === 'profiles') return j(200, /id=in/.test(u.search) ? [] : [{ id: 'al', roles: ['aluno'] }]);
    return j(200, []);
  });
  const p = await ctx.newPage(); p.errs = []; p.on('pageerror', (e) => p.errs.push(e.message.slice(0, 160)));
  await p.goto('http://localhost:5173/', { waitUntil: 'load' }); await p.waitForTimeout(500);
  await p.evaluate((t) => {
    localStorage.setItem('c99.sessao', JSON.stringify({ access_token: t, refresh_token: 'r', user: { id: 'al', email: 'al@x.com' } }));
    const C = PAGES.onboarding.Comp;
    STORE.saveOnb(Object.assign(C.prototype.base.call(C.prototype, 'aluno', ''), { name: 'Caio Prado', dadosSaved: true, conta: true, step: 'pronto', scn: '' }));
  }, token);
  await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1600);
  return p;
}
const txt = (p) => p.evaluate(() => document.getElementById('app').innerText.replace(/\s+/g, ' '));
const click = (p, re) => p.evaluate((src) => { const r = new RegExp(src); const e = [...document.querySelectorAll('#app button, .sheet button, [role=dialog] button')].find((x) => r.test(x.textContent.trim()) && x.offsetParent); if (e) e.click(); return !!e; }, re.source);

// 1. ligar em Meus dados
const p = await mk(tok('aal1'));
await p.evaluate(() => NAV.go('publico', { s: 'meusdados' }, null)); await p.waitForTimeout(1500);
let t = await txt(p);
console.log('1 começa desligada:', /Verificação em duas etapas Desligada\./.test(t), /Ligar verificação em duas etapas/.test(t));
await click(p, /^Ligar verificação em duas etapas$/); await p.waitForTimeout(1000); t = await txt(p);
console.log('2 mostra QR e chave:', await p.evaluate(() => !!document.querySelector('#app img[alt^="Código QR"]')), /Chave: JBSWY3DPEHPK3PXP/.test(t), /sem ele você não consegue entrar/.test(t));
await p.fill('#md-2fa-c', '111111'); await p.waitForTimeout(200); await click(p, /^Confirmar código e ligar$/); await p.waitForTimeout(1000); t = await txt(p);
console.log('  código errado não liga:', /Código errado ou vencido/.test(t), !srv.factors.some((f) => f.status === 'verified'));
await p.fill('#md-2fa-c', '123456'); await p.waitForTimeout(200); await click(p, /^Confirmar código e ligar$/); await p.waitForTimeout(1500); t = await txt(p);
console.log('3 ligada:', srv.factors.some((f) => f.status === 'verified'), /Verificação em duas etapas Ligada\./.test(t), /Desligar/.test(t), '| sessão já confirmada:', await p.evaluate(() => CONTA.aal()) === 'aal2');

// 2. outro aparelho, só com a senha (sessão sem código): o servidor barra e o app pede o código
const q = await mk(tok('aal1'));
await q.evaluate(() => NAV.go('aluno', {}, null)); await q.waitForTimeout(2500); t = await txt(q);
console.log('4 sem o código: barrado pelo servidor e levado à tela do código:', srv.blocked > 0, /Confirme que é você/.test(t), /Código do aplicativo/i.test(t), '| não mostra dados:', !/Marina/.test(t));
await q.fill('#fa-code', '000000'); await q.waitForTimeout(200); await click(q, /^Confirmar e entrar$/); await q.waitForTimeout(1000); t = await txt(q);
console.log('  código errado não entra:', /Código errado ou vencido/.test(t), await q.evaluate(() => CONTA.aal()) === 'aal1');
await q.fill('#fa-code', '123456'); await q.waitForTimeout(200); await click(q, /^Confirmar e entrar$/); await q.waitForTimeout(2500); t = await txt(q);
console.log('5 com o código entra e vê os dados:', await q.evaluate(() => CONTA.aal()) === 'aal2', /Marina/.test(t), !/Confirme que é você/.test(t));

// 3. desligar
await p.evaluate(() => NAV.go('publico', { s: 'meusdados' }, null)); await p.waitForTimeout(1500);
await click(p, /^Desligar$/); await p.waitForTimeout(600);
console.log('  pede confirmação antes:', /Desligar a verificação em duas etapas\?/.test(await p.evaluate(() => document.body.innerText)), srv.factors.length === 1);
await p.evaluate(() => { const all = [...document.querySelectorAll('button')].filter((x) => x.textContent.trim() === 'Desligar' && x.offsetParent); all[all.length - 1].click(); }); await p.waitForTimeout(1500); t = await txt(p);
console.log('6 desligada:', srv.factors.length === 0, /Verificação em duas etapas Desligada\./.test(t));
console.log('errs', p.errs, q.errs);
await b.close();
