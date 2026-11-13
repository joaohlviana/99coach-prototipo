// Fase 1: nada falso, nada perdido.
// Falha de leitura não vira "sem treinador"; encerrado fica como histórico; convites reais; menus sem telas de exemplo;
// favoritos reais; marcar série sem digitar não copia o previsto.
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const b = await chromium.launch();
const W = { template_id: 'manual', title: 'Força A', current_version: 1, workout_versions: [{ version: 1, sessions: [{ id: 's1', title: 'Treino A', estMin: 20, items: [{ exerciseId: 'agach', name: 'Agachamento', sets: 1, reps: '8', loadKg: 40, restS: 0, notes: null }] }], schedule: null, created_at: '2026-11-02T12:00:00Z' }] };
const srv = { fail: false, links: [], invites: [], calls: [], submit: null };
async function mk(uid, role) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.route('**/api/v1/**', (r) => r.abort());
  await ctx.route('**/rycaxboqkkiopjdecgld.supabase.co/**', async (route) => {
    const rq = route.request(), u = new URL(rq.url());
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'content-type': 'application/json' };
    if (rq.method() === 'OPTIONS') return route.fulfill({ status: 200, headers: cors });
    const j = (s, d) => route.fulfill({ status: s, headers: cors, body: JSON.stringify(d) });
    const path = u.pathname.replace('/rest/v1/', ''), body = rq.postData() ? JSON.parse(rq.postData()) : {};
    // mesmas regras do banco real (conferidas em 12/11): coluna inexistente, convite individual sem e-mail e chave de repetição curta são recusados
    if (path === 'sessions' && /submitted_at/.test(decodeURIComponent(u.search)) && !/submitted_at:received_at/.test(decodeURIComponent(u.search))) return route.fulfill({ status: 400, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' }, body: JSON.stringify({ message: 'column sessions.submitted_at does not exist' }) });
    if (path === 'invites' && rq.method() === 'POST') { const bb = JSON.parse(rq.postData() || '{}'); if (bb.kind === 'individual' && !bb.recipient_email) return route.fulfill({ status: 400, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' }, body: JSON.stringify({ message: 'new row for relation "invites" violates check constraint "invites_check"' }) }); }
    if (/^rpc\//.test(path) && rq.postData()) { const kk = JSON.parse(rq.postData()).p_idem; if (kk != null && (String(kk).length < 8 || String(kk).length > 200)) return route.fulfill({ status: 400, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' }, body: JSON.stringify({ message: 'chave de idempotência inválida' }) }); }
    if (/^rpc\//.test(path)) srv.calls.push(path.slice(4));
    if (path === 'links') return srv.fail ? j(500, { message: 'falha' }) : j(200, srv.links);
    if (path === 'requests') return srv.fail ? j(500, { message: 'falha' }) : j(200, []);
    if (path === 'invites') return j(200, srv.invites);
    if (path === 'rpc/revoke_invite') { srv.invites.forEach((i) => { if (i.code === body.p_code) i.status = 'revogado'; }); return j(200, { ok: true }); }
    if (path === 'sessions') return j(200, [{ id: 'S0', session_key: 'L1_v1_s0', started_at: '2026-11-01T10:00:00Z', submitted_at: '2026-11-01T10:30:00Z', set_logs: [], session_comments: [] }]);
    if (path === 'rpc/submit_session') { srv.submit = body; return j(200, { receipt: 'ok' }); }
    if (path === 'profiles') return j(200, /id=in/.test(u.search) ? [{ id: 'al', display_name: 'Caio Prado' }] : [{ id: uid, roles: [role] }]);
    return j(200, []);
  });
  const p = await ctx.newPage(); p.errs = []; p.on('pageerror', (e) => p.errs.push(e.message.slice(0, 160)));
  await p.goto('http://localhost:5173/', { waitUntil: 'load' }); await p.waitForTimeout(400);
  await p.evaluate(([u, w]) => {
    localStorage.setItem('c99.sessao', JSON.stringify({ access_token: 't' + u, refresh_token: 'r', user: { id: u, email: u + '@x.com' } }));
    const C = PAGES.onboarding.Comp;
    STORE.saveOnb(Object.assign(C.prototype.base.call(C.prototype, w, ''), { name: u === 'tr' ? 'Marina Duarte' : 'Caio Prado', dadosSaved: true, conta: true, step: u === 'tr' ? 'hoje' : 'pronto', scn: '' }));
  }, [uid, role]);
  await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1500);
  return p;
}
const txt = (p) => p.evaluate(() => document.getElementById('app').innerText.replace(/\s+/g, ' '));
const press = async (p, re, sel) => { for (const h of await p.$$(sel || '#app button')) { const t = (await h.textContent()).trim(); if (re.test(t) && (await h.isVisible())) { await h.click(); await p.waitForTimeout(500); return t; } } return null; };
const lk = (st) => ({ id: 'L1', status: st, origin: 'convite', prep: 'assigned', answers: {}, created_at: '2026-10-01T12:00:00Z', student_id: 'al', trainers: { slug: 'marina', name: 'Marina Duarte', user_id: 'tr' }, workouts: [W] });

// 1. aluno com vínculo; depois a leitura falha: continua vendo o acompanhamento, sem "Ainda sem treinador"
srv.links = [lk('ativo')];
const al = await mk('al', 'aluno');
await al.evaluate(() => NAV.go('aluno', {}, null)); await al.waitForTimeout(800);
srv.fail = true; await al.evaluate(() => window.__refreshLinks()); await al.waitForTimeout(800);
await al.evaluate(() => NAV.go('aluno', {}, null)); await al.waitForTimeout(800);
let t = await txt(al);
console.log('1 falha não apaga o vínculo:', !/Ainda sem treinador/.test(t), /Força A|Começar treino/.test(t));
srv.fail = false;
// 2. marcar a série sem digitar não envia o previsto
await press(al, /^Começar treino$/); await (await al.$('#app [role=checkbox]')).click(); await al.waitForTimeout(400);
await press(al, /Concluir|Enviar/); t = await txt(al);
console.log('2 pede o realizado:', /Faltam as repetições de Agachamento/.test(t), '| nada enviado:', !srv.submit);
await press(al, /^Igual ao previsto$/); await press(al, /Concluir|Enviar/); await al.waitForTimeout(600);
console.log('  "Igual ao previsto" é escolha explícita:', !!srv.submit && srv.submit.p_logs[0].reps === 8);
// 3. vínculo encerrado: vira histórico, não some
srv.links = [lk('encerrado')]; await al.evaluate(() => window.__refreshLinks()); await al.waitForTimeout(600); await al.evaluate(() => NAV.go('aluno', {}, null)); await al.waitForTimeout(1200);
t = await txt(al);
console.log('3 encerrado aparece como histórico:', /Acompanhamento encerrado/i.test(t), /Marina Duarte/.test(t), /treino registrado/.test(t));
// 4. menu do aluno sem telas de exemplo; favoritos reais
await al.evaluate(() => NAV.go('aluno', { s: 'menu' }, null)); await al.waitForTimeout(600); t = await txt(al);
console.log('4 menu do aluno real:', /Meus dados e segurança/.test(t), '| sem exemplos:', !/Compartilhamentos|Conta e preferências|Check-in semanal pendente|Meus programas|Minhas contratações/.test(t));
await al.evaluate(() => { FAV.set('aguinaldo-siqueira-bb5ba0c0', true); NAV.go('publico', { s: 'salvos' }, null); }); await al.waitForTimeout(800); t = await txt(al);
console.log('  favoritos reais:', /Aguinaldo siqueira/i.test(t), '| sem exemplo:', !/Carolina|Rafael Lima/.test(t));
await al.evaluate(() => NAV.go('publico', { s: 'programas' }, null)); await al.waitForTimeout(500);
console.log('  tela pública de exemplo fechada:', await al.evaluate(() => location.pathname === '/' || /home/.test(location.hash) || !/Programas/.test(document.getElementById('app').innerText.slice(0, 300))));
// 5. treinador: convites do servidor, revogar de verdade
srv.links = [];
srv.invites = [{ code: 'ABCD-EFGH', recipient_name: 'Bia Lima', recipient_email: null, service: null, status: 'pendente', created_at: '2026-11-10T10:00:00Z', expires_at: '2026-11-17T10:00:00Z', accepted_at: null, generation: 1 },
  { code: 'ZZZZ-YYYY', recipient_name: 'Davi Reis', status: 'aceito', created_at: '2026-11-01T10:00:00Z', expires_at: '2026-11-08T10:00:00Z', accepted_at: '2026-11-02T10:00:00Z', generation: 1 }];
const tr = await mk('tr', 'treinador');
await tr.evaluate(() => NAV.go('treinador', { s: 'convites' }, null)); await tr.waitForTimeout(1200); t = await txt(tr);
console.log('5 convites do servidor:', /Bia Lima/.test(t), /vale até 17\/11\/2026/i.test(t), /Aceitos \(1\)/.test(t));
await press(tr, /^Revogar$/); await press(tr, /^Revogar convite$/, '.mod-sheet button'); await tr.waitForTimeout(800); t = await txt(tr);
console.log('  revogou no servidor:', srv.calls.includes('revoke_invite'), /Vencidos e revogados \(1\)/.test(t));
await tr.evaluate(() => NAV.go('treinador', { s: 'menu' }, null)); await tr.waitForTimeout(600); t = await txt(tr);
console.log('6 menu do treinador real:', /Ver meu perfil publicado/.test(t), /Convites/.test(t), '| sem exemplos:', /Receber dos alunos pelo app/.test(t) && !/Vendas, saldo e repasses|Ofertas|Organização|Assistência de IA|Conta e preferências|Formulários/.test(t));
await tr.evaluate(() => NAV.go('treinador', { s: 'formularios' }, null)); await tr.waitForTimeout(500); t = await txt(tr);
console.log('  formulários de exemplo não abrem:', !/Anamnese inicial/.test(t));
console.log('errs', JSON.stringify(al.errs.concat(tr.errs)));
await b.close();
