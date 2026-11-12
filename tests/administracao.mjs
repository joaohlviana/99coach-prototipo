// Administração real: só equipe; exige verificação em duas etapas; decide retirada, reivindicação e CREF com explicação.
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const b = await chromium.launch();
const jwt = (aal) => 'x.' + Buffer.from(JSON.stringify({ sub: 'adm', aal })).toString('base64url') + '.y';
const srv = { admin: true, factors: [], calls: [], rem: [{ request_id: 'R1', protocol: 'RT-1', trainer_slug: 'joao-x', trainer_name: 'João X', kind: 'retirar', reason: 'Não autorizo meus dados aqui.', contact_email: null, status: 'recebido', created_at: '2026-11-11T10:00:00Z' }],
  claim: [{ request_id: 'C1', protocol: 'CL-1', trainer_slug: 'ana-y', trainer_name: 'Ana Y', requester_email: 'ana@x.com', proof_note: 'Posso mandar DM do Instagram oficial.', requested_at: '2026-11-11T11:00:00Z', competing: 0 }],
  cref: [{ review_id: 'V1', trainer_slug: 'bia-z', trainer_name: 'Bia Z', cref: '000001-G/SP', evidence_note: null, requested_at: '2026-11-11T12:00:00Z' }] };
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
await ctx.route('**/api/v1/**', (r) => r.abort());
await ctx.route('**/rycaxboqkkiopjdecgld.supabase.co/**', async (route) => {
  const rq = route.request(), u = new URL(rq.url());
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'content-type': 'application/json' };
  if (rq.method() === 'OPTIONS') return route.fulfill({ status: 200, headers: cors });
  const j = (s, d) => route.fulfill({ status: s, headers: cors, body: JSON.stringify(d) });
  const path = u.pathname, body = rq.postData() ? JSON.parse(rq.postData()) : {};
  const aal2 = /aal2/.test(Buffer.from(String(rq.headers().authorization || '').split('.')[1] || '', 'base64url').toString());
  srv.calls.push(path.replace('/rest/v1/', '').replace('/auth/v1/', 'auth:'));
  if (path === '/auth/v1/user') return j(200, { id: 'adm', factors: srv.factors });
  if (path === '/auth/v1/factors' && rq.method() === 'POST') { srv.factors.push({ id: 'F1', factor_type: 'totp', status: 'unverified' }); return j(200, { id: 'F1', totp: { qr_code: 'data:image/svg+xml;utf-8,<svg xmlns="http://www.w3.org/2000/svg"/>', secret: 'ABCDEF' } }); }
  if (/\/challenge$/.test(path)) return j(200, { id: 'CH1' });
  if (/\/verify$/.test(path)) { if (body.code !== '123456') return j(422, { msg: 'Invalid TOTP code entered' }); srv.factors[0].status = 'verified'; return j(200, { access_token: jwt('aal2'), refresh_token: 'r2', user: { id: 'adm', email: 'adm@x.com' } }); }
  const p = path.replace('/rest/v1/', '');
  if (p === 'rpc/is_admin') return j(200, srv.admin);
  if (/^rpc\/admin_/.test(p) && !aal2) return j(403, { message: 'exige papel admin com verificação em duas etapas (aal2)' });
  if (p === 'rpc/admin_removal_queue') return j(200, srv.rem);
  if (p === 'rpc/admin_claim_queue') return j(200, srv.claim);
  if (p === 'rpc/admin_cref_queue') return j(200, srv.cref);
  if (p === 'rpc/admin_decide_removal') { if (!body.p_note && body.p_status !== 'em_analise') return j(400, { message: 'explicacao_obrigatoria' }); srv.rem = []; srv.decRem = body; return j(200, { status: body.p_status }); }
  if (p === 'rpc/admin_decide_claim') { srv.claim = []; srv.decClaim = body; return j(200, { status: body.p_decision }); }
  if (p === 'rpc/admin_decide_cref') { srv.cref = []; srv.decCref = body; return j(200, { status: body.p_decision }); }
  if (p === 'profiles') return j(200, [{ id: 'adm', roles: [] }]);
  return j(200, []);
});
const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 160)));
const txt = () => p.evaluate(() => document.getElementById('app').innerText.replace(/\s+/g, ' '));
const press = async (re, sel) => { for (const h of await p.$$(sel || '#app button')) { const t = (await h.textContent()).trim(); if (re.test(t) && (await h.isVisible())) { await h.click(); await p.waitForTimeout(600); return t; } } return null; };
const open = async () => { await p.goto('about:blank'); await p.goto('http://localhost:5173/app#publico-admin', { waitUntil: 'load' }); await p.waitForTimeout(1500); return txt(); };
await p.goto('http://localhost:5173/', { waitUntil: 'load' });
// 1. sem conta: pede entrar; conta comum: sem acesso
let t = await open(); console.log('1 visitante vai para a página inicial ou entrar:', !/Correção e retirada/.test(t));
await p.evaluate((tk) => localStorage.setItem('c99.sessao', JSON.stringify({ access_token: tk, refresh_token: 'r', user: { id: 'adm', email: 'adm@x.com' } })), jwt('aal1'));
srv.admin = false; t = await open(); console.log('  conta comum: sem acesso:', /Sem acesso/.test(t), '| não chamou filas:', !srv.calls.some((c) => /admin_/.test(c)));
// 2. admin sem 2 etapas: cadastra app autenticador
srv.admin = true; t = await open();
console.log('2 pede duas etapas:', /Verificação em duas etapas/.test(t), '| filas escondidas:', !/Correção e retirada/.test(t));
await press(/Cadastrar app autenticador/); t = await txt();
console.log('  mostra QR e chave:', !!(await p.$('#app img[alt^="Código QR"]')), /ABCDEF/.test(t));
await p.fill('#ad-code', '000000'); await press(/Confirmar código/); t = await txt();
console.log('  código errado:', /Código errado ou vencido/.test(t));
await p.fill('#ad-code', '123456'); await press(/Confirmar código/); await p.waitForTimeout(800); t = await txt();
console.log('  confirmado e filas aparecem:', /Correção e retirada \(1\)/.test(t), /Reivindicações de perfil \(1\)/.test(t), /Conferência de CREF \(1\)/.test(t));
// 3. decisões
await press(/^Recusar$/); t = await txt();
console.log('3 recusar sem explicação é barrado:', /Escreva a explicação/.test(t), !srv.decRem);
await p.fill('#n-R1', 'Perfil retirado a pedido do titular.');
await press(/^Retirar perfil$/); await press(/^Retirar perfil$/, '.mod-sheet button'); await p.waitForTimeout(800);
console.log('  retirada concluída:', srv.decRem && srv.decRem.p_status === 'concluido' && srv.decRem.p_effect === 'perfil_retirado');
await press(/^Aprovar$/); await press(/^Aprovar$/, '.mod-sheet button'); await p.waitForTimeout(800);
console.log('  reivindicação aprovada:', srv.decClaim && srv.decClaim.p_decision === 'aprovado');
await press(/Conferido no conselho/); await p.waitForTimeout(800); t = await txt();
console.log('  CREF conferido:', srv.decCref && srv.decCref.p_decision === 'conferido', '| filas vazias:', /Nenhum pedido esperando decisão/.test(t));
console.log('errs', JSON.stringify(errs));
await b.close();
