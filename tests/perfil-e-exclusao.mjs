// Corrigir/retirar um perfil sem conta (protocolo), reivindicar com conta, e excluir a conta em duas etapas.
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const b = await chromium.launch();
const SLUG = 'aguinaldo-siqueira-bb5ba0c0';
const srv = { calls: [], del: null, auth: [] };
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
await ctx.route('**/rycaxboqkkiopjdecgld.supabase.co/**', async (route) => {
  const rq = route.request(), u = new URL(rq.url());
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'content-type': 'application/json' };
  if (rq.method() === 'OPTIONS') return route.fulfill({ status: 200, headers: cors });
  const j = (s, d) => route.fulfill({ status: s, headers: cors, body: JSON.stringify(d) });
  const path = u.pathname.replace('/rest/v1/', '');
  const body = rq.postData() ? JSON.parse(rq.postData()) : null;
  if (/^rpc\//.test(path)) { srv.calls.push(path.slice(4)); srv.auth.push(path.slice(4) + ':' + (rq.headers().authorization ? 'com' : 'sem')); }
  if (path === 'rpc/submit_removal_request') return body.p_reason.length < 10 ? j(400, { message: 'relato_curto' }) : j(200, [{ protocol: 'RT-7K2P9', status: 'recebido', kind: body.p_kind }]);
  if (path === 'rpc/removal_status') return j(200, [{ status: 'em_analise', note: 'A equipe está conferindo.' }]);
  if (path === 'rpc/request_claim') return j(200, [{ status: 'recebido', protocol: 'CL-1' }]);
  if (path === 'rpc/request_account_deletion') { srv.del = { status: 'pedido' }; return j(200, [srv.del]); }
  if (path === 'rpc/cancel_account_deletion') { srv.del = { status: 'cancelado' }; return j(200, [srv.del]); }
  if (path === 'rpc/advance_account_deletion') { srv.del = { status: srv.del.status === 'pedido' ? 'em_processamento' : 'concluido' }; return j(200, [srv.del]); }
  if (path === 'account_deletions') return j(200, srv.del ? [srv.del] : []);
  if (path === 'profiles') return j(200, [{ id: 'al', roles: ['aluno'], display_name: 'Caio Prado' }]);
  return j(200, []);
});
const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 160)));
const txt = () => p.evaluate(() => document.getElementById('app').innerText.replace(/\s+/g, ' '));
const open = async (hash) => { await p.goto('about:blank'); await p.goto('http://localhost:5173/app' + hash, { waitUntil: 'load' }); await p.waitForTimeout(1500); return txt(); };
const press = async (re) => { for (const h of await p.$$('#app button')) { const t = (await h.textContent()).trim(); if (re.test(t) && (await h.isVisible())) { await h.click(); await p.waitForTimeout(500); return t; } } return null; };
// 1. visitante abre pelo endereço da página do perfil
let t = await open('#publico-perfilpedido-' + SLUG);
console.log('1 tela abre com o nome:', /Aguinaldo siqueira/i.test(t), '| corrigir e é meu perfil:', /Corrigir ou retirar/.test(t), /É meu perfil/.test(t), '| pede entrar para reivindicar:', /Entrar para pedir/.test(t));
await press(/^Enviar pedido$/); t = await txt();
console.log('  texto curto barrado sem chamar o banco:', /pelo menos 10 caracteres/.test(t), srv.calls.length === 0);
await press(/Retirar o perfil/);
await p.fill('#pp-reason', 'Não quero mais aparecer neste site, obrigado.');
await press(/^Enviar pedido$/); t = await txt();
console.log('  protocolo:', /protocolo RT-7K2P9/.test(t), '| sem conta, sem token:', srv.auth.join(','));
t = await open('#publico-perfilpedido-' + SLUG);
console.log('  ao voltar mostra a situação:', /Em análise/.test(t), /conferindo/.test(t));
// 2. entra e reivindica
await p.evaluate(() => localStorage.setItem('c99.sessao', JSON.stringify({ access_token: 't', refresh_token: 'r', user: { id: 'al', email: 'caio@x.com' } })));
t = await open('#publico-perfilpedido-' + SLUG);
await press(/Pedir para assumir/); t = await txt();
console.log('2 exige 18+:', /18 anos/.test(t));
await press(/Tenho 18 anos/); await p.fill('#pp-proof', 'O Instagram do perfil é meu, posso mandar mensagem.');
await press(/Pedir para assumir/); t = await txt();
console.log('  pedido enviado:', /protocolo CL-1/.test(t), /revisa as provas/.test(t));
// 3. excluir conta: pedir, desistir, pedir, confirmar, concluir
await p.evaluate(() => { const C = PAGES.onboarding.Comp; STORE.saveOnb(Object.assign(C.prototype.base.call(C.prototype, 'aluno', ''), { name: 'Caio Prado', conta: true, step: 'pronto', scn: '' })); });
t = await open('#publico-meusdados');
console.log('3 meus dados oferece exclusão:', /Pedir a exclusão da conta/.test(t), '| não diz mais que não é automático:', !/não é automática/.test(t));
await press(/Pedir a exclusão/); t = await txt();
console.log('  pedido aberto, nada apagado:', /nada foi apagado ainda/.test(t));
await press(/^Desistir$/); t = await txt();
console.log('  desistiu:', /Pedir a exclusão da conta/.test(t));
await press(/Pedir a exclusão/); await press(/Confirmar e começar/); t = await txt();
console.log('  em andamento:', /Exclusão em andamento/.test(t), /Concluir a exclusão/.test(t));
await press(/Concluir a exclusão/); await p.waitForTimeout(1800);
const left = await p.evaluate(() => Object.keys(localStorage).filter((k) => /^c99\.sessao/.test(k)).length);
console.log('  concluída e saiu:', srv.calls.filter((c) => c === 'advance_account_deletion').length === 2, left === 0);
console.log('errs', JSON.stringify(errs));
await b.close();
