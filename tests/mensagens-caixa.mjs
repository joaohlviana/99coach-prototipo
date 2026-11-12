// Caixa de conversas do treinador: lista por aluno com não lidas, abre a conversa, envia, atualiza sozinha.
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const b = await chromium.launch();
const lk = (id, sid) => ({ id, status: 'ativo', origin: 'convite', prep: 'assigned', answers: {}, created_at: '2026-11-01T12:00:00Z', student_id: sid, trainers: { slug: 'marina', name: 'Marina Duarte', user_id: 'tr' }, workouts: [] });
const srv = { msgs: [{ id: 'M1', link_id: 'L2', side: 'aluno', body: 'Posso trocar o treino de amanhã?', client_id: 'c1', created_at: '2026-11-12T09:00:00Z', read_at: null },
  { id: 'M0', link_id: 'L1', side: 'treinador', body: 'Bom treino!', client_id: 'c0', created_at: '2026-11-11T09:00:00Z', read_at: '2026-11-11T10:00:00Z' }], sent: [] };
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
await ctx.route('**/api/v1/**', (r) => r.abort());
await ctx.route('**/rycaxboqkkiopjdecgld.supabase.co/**', async (route) => {
  const rq = route.request(), u = new URL(rq.url());
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'content-type': 'application/json' };
  if (rq.method() === 'OPTIONS') return route.fulfill({ status: 200, headers: cors });
  const j = (s, d) => route.fulfill({ status: s, headers: cors, body: JSON.stringify(d) });
  const path = u.pathname.replace('/rest/v1/', ''), body = rq.postData() ? JSON.parse(rq.postData()) : {};
  if (path === 'links') return j(200, [lk('L1', 'a1'), lk('L2', 'a2')]);
  if (path === 'profiles') return j(200, /id=in/.test(u.search) ? [{ id: 'a1', display_name: 'Caio Prado' }, { id: 'a2', display_name: 'Bia Lima' }] : [{ id: 'tr', roles: ['treinador'] }]);
  if (path === 'messages') { const m = /link_id=eq\.([^&]+)/.exec(u.search); const L = m ? srv.msgs.filter((x) => x.link_id === m[1]).sort((a, b) => a.created_at.localeCompare(b.created_at)) : srv.msgs.slice().sort((a, b) => b.created_at.localeCompare(a.created_at)); return j(200, L); }
  if (path === 'rpc/mark_read') { srv.msgs.forEach((m) => { if (m.link_id === body.p_link && m.side === 'aluno') m.read_at = new Date().toISOString(); }); return j(200, null); }
  if (path === 'rpc/send_message') { srv.sent.push(body); srv.msgs.push({ id: 'N' + srv.sent.length, link_id: body.p_link, side: 'treinador', body: body.p_body, client_id: body.p_client_id, created_at: new Date().toISOString(), read_at: null }); return j(200, { id: 'N' }); }
  return j(200, []);
});
const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 160)));
await p.goto('http://localhost:5173/', { waitUntil: 'load' }); await p.waitForTimeout(800);
await p.evaluate(() => { localStorage.setItem('c99.sessao', JSON.stringify({ access_token: 'ttr', refresh_token: 'r', user: { id: 'tr', email: 'tr@x.com' } })); const C = PAGES.onboarding.Comp; STORE.saveOnb(Object.assign(C.prototype.base.call(C.prototype, 'treinador', ''), { name: 'Marina Duarte', dadosSaved: true, conta: true, step: 'hoje', scn: '' })); });
await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1500);
const txt = () => p.evaluate(() => document.getElementById('app').innerText.replace(/\s+/g, ' '));
const press = async (re) => { for (const h of await p.$$('#app button')) { const t = (await h.textContent()).trim(); if (re.test(t) && (await h.isVisible())) { await h.click(); await p.waitForTimeout(600); return t; } } return null; };
await p.evaluate(() => NAV.go('treinador', { s: 'mensagens' }, null)); await p.waitForTimeout(1500);
let t = await txt();
console.log('1 caixa real (não manda para Alunos):', /Uma conversa por aluno/.test(t), '| não lida primeiro:', t.indexOf('Bia Lima') < t.indexOf('Caio Prado'), /Posso trocar o treino/.test(t));
console.log('  abre a conversa da não lida:', /Conversa com Bia Lima/i.test(t), '| marcou lida:', srv.msgs.find((m) => m.id === 'M1').read_at !== null);
await p.fill('#tm-chat-in', 'Pode sim, troque pelo Treino B.'); await press(/^Enviar$/); await p.waitForTimeout(800); t = await txt();
console.log('2 enviou:', srv.sent.length === 1 && srv.sent[0].p_link === 'L2', /Pode sim, troque pelo Treino B/.test(t), '| rótulo honesto:', /Enviada/i.test(t));
await press(/^Caio Prado/); t = await txt();
console.log('3 troca de conversa:', /Conversa com Caio Prado/i.test(t), /Bom treino!/.test(t));
srv.msgs.push({ id: 'M9', link_id: 'L1', side: 'aluno', body: 'Valeu!', client_id: 'c9', created_at: new Date().toISOString(), read_at: null });
await p.waitForTimeout(11500); t = await txt();
console.log('4 atualiza sozinha:', /Valeu!/.test(t));
console.log('  menu lateral tem Mensagens:', await p.evaluate(() => [...document.querySelectorAll('#app nav button, #app aside button')].some((b) => /Mensagens/.test(b.textContent))));
console.log('errs', JSON.stringify(errs));
await b.close();
