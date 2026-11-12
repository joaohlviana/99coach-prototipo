// Home e perfil conforme a situação real do aluno, continuar busca, meus dados, descanso, sair apaga o aparelho.
import { linha, ehCatalogo } from './_banco.mjs';
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const b = await chromium.launch();
const LIVE = { slug: 'marina-duarte-teste', name: 'Marina Duarte', initials: 'MD', photo: null, specialty: 'CrossFit', sports: ['crossfit'], city: { label: 'Londrina, PR' }, formats: ['presencial', 'online'], imported: false, receivesRequests: true, headlineOffers: [], publishedAt: '2026-11-10' };
const srv = { reqs: [], links: [], sessions: [], patches: [] };
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
await ctx.route('**/api/v1/search**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [LIVE], nextCursor: null }) }));
await ctx.route('**/api/v1/trainers/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(Object.assign({}, LIVE, { role: 'Treinadora de CrossFit', pitch: 'Treino adultos.', offers: [{ title: 'Acompanhamento online', priceCents: 20000, unit: 'mes' }], credentials: [], serviceArea: [] })) }));
await ctx.route('**/rycaxboqkkiopjdecgld.supabase.co/**', async (route) => {
  const rq = route.request(), u = new URL(rq.url());
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'content-type': 'application/json' };
  if (rq.method() === 'OPTIONS') return route.fulfill({ status: 200, headers: cors });
  const j = (s, d) => route.fulfill({ status: s, headers: cors, body: JSON.stringify(d) });
  const path = u.pathname.replace('/rest/v1/', '');
    // mesmas regras do banco real (conferidas em 12/11): coluna inexistente, convite individual sem e-mail e chave de repetição curta são recusados
    if (path === 'sessions' && /submitted_at/.test(decodeURIComponent(u.search)) && !/submitted_at:received_at/.test(decodeURIComponent(u.search))) return route.fulfill({ status: 400, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' }, body: JSON.stringify({ message: 'column sessions.submitted_at does not exist' }) });
    if (path === 'invites' && rq.method() === 'POST') { const bb = JSON.parse(rq.postData() || '{}'); if (bb.kind === 'individual' && !bb.recipient_email) return route.fulfill({ status: 400, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' }, body: JSON.stringify({ message: 'new row for relation "invites" violates check constraint "invites_check"' }) }); }
    if (/^rpc\//.test(path) && rq.postData()) { const kk = JSON.parse(rq.postData()).p_idem; if (kk != null && (String(kk).length < 8 || String(kk).length > 200)) return route.fulfill({ status: 400, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' }, body: JSON.stringify({ message: 'chave de idempotência inválida' }) }); }
  if (path === 'trainers' && ehCatalogo(u)) return route.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' }, body: JSON.stringify([linha(LIVE, { role: 'Treinadora de CrossFit', pitch: 'Treino adultos.', offers: [{ title: 'Acompanhamento online', priceCents: 20000, unit: 'mes' }] })]) });
  if (rq.method() === 'PATCH') srv.patches.push(path + ' ' + rq.postData());
  if (path === 'requests') return j(200, srv.reqs);
  if (path === 'links') return j(200, srv.links);
  if (path === 'sessions') return j(200, srv.sessions);
  if (path === 'messages') return j(200, [{ id: 'm1', side: 'aluno', body: 'Oi', client_id: 'c1', created_at: '2026-11-10T10:00:00Z', read_at: null }]);
  if (path === 'profiles') return j(200, /id=in/.test(u.search) ? [{ id: 'al', display_name: 'Caio Prado' }] : [{ id: 'al', roles: ['aluno'], display_name: 'Caio Prado' }]);
  return j(200, []);
});
const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 160)));
await p.goto('http://localhost:5173/', { waitUntil: 'load' }); await p.waitForTimeout(500);
await p.evaluate(() => {
  localStorage.setItem('c99.sessao', JSON.stringify({ access_token: 't', refresh_token: 'r', user: { id: 'al', email: 'caio@x.com' } }));
  const C = PAGES.onboarding.Comp;
  STORE.saveOnb(Object.assign(C.prototype.base.call(C.prototype, 'aluno', ''), { name: 'Caio Prado', dadosSaved: true, conta: true, step: 'pronto', scn: '' }));
});
const txt = () => p.evaluate(() => document.getElementById('app').innerText.replace(/\s+/g, ' '));
const reload = async (hash) => { await p.goto('about:blank'); await p.goto('http://localhost:5173/' + (hash || ''), { waitUntil: 'load' }); await p.waitForTimeout(1700); return txt(); };
const press = async (re) => { for (const h of await p.$$('#app button')) { const t = (await h.textContent()).trim(); if (re.test(t) && (await h.isVisible())) { await h.click(); return t; } } return null; };
// 1. sem pedido nem vínculo: Home normal
let t = await reload('#home');
console.log('1 home sem acompanhamento:', !/Seu acompanhamento/i.test(t) && !/Aguardando resposta/.test(t), '| hero:', /Encontre|treinador/i.test(t));
// 2. pedido pendente
srv.reqs = [{ id: 'R1', status: 'pendente', message: 'Quero', created_at: '2026-11-10T21:00:00Z', expires_at: '2026-11-12T21:00:00Z', student_id: 'al', trainers: { slug: LIVE.slug, name: 'Marina Duarte', user_id: 'tr' }, offers: { key: 'principal', title: 'Acompanhamento online', price_cents: 20000, unit: 'mes' } }];
t = await reload('#home');
console.log('2 home com pedido:', /Aguardando resposta/i.test(t), /Pedido de acompanhamento para Marina Duarte/.test(t), /vale até 12\/11/.test(t), /R\$ 200 \/ mês/.test(t), /Pedido não é vínculo/.test(t));
await p.evaluate(() => NAV.go('perfil', { id: 'marina-duarte-teste' }, null)); await p.waitForTimeout(900);
t = await txt(); console.log('  perfil:', /Acompanhar pedido/.test(t), '| não oferece pedir de novo:', !/Pedir acompanhamento/.test(t));
await p.evaluate(() => NAV.go('aluno', {}, null)); await p.waitForTimeout(700);
t = await txt(); console.log('  área do aluno mostra o prazo:', /o treinador responde até 12\/11\/2026/.test(t));
// 3. vínculo com treino
srv.reqs = [];
srv.links = [{ id: 'L1', status: 'ativo', origin: 'pedido', prep: 'assigned', answers: {}, created_at: '2026-11-01T12:00:00Z', student_id: 'al', trainers: { slug: LIVE.slug, name: 'Marina Duarte', user_id: 'tr' },
  workouts: [{ template_id: 'manual', title: 'Força A', current_version: 1, workout_versions: [{ version: 1, sessions: [{ id: 's1', title: 'Treino A', estMin: 20, items: [{ exerciseId: 'agach', name: 'Agachamento', sets: 2, reps: '8', loadKg: 40, restS: 90, notes: null }] }], schedule: null, created_at: '2026-11-02T12:00:00Z' }] }] }];
srv.sessions = [{ id: 'S0', session_key: 'L1_v0_s1', started_at: '2026-11-05T13:00:00Z', submitted_at: '2026-11-05T13:40:00Z', set_logs: [{ item: 0, set_no: 1, reps: 8, load_kg: 37.5, exercise_id: 'agach', exercise_name: 'Agachamento' }] }];
t = await reload('#home');
console.log('3 home com vínculo:', /Seu acompanhamento/i.test(t), /Marina Duarte/.test(t), /Treino disponível: Força A/.test(t));
console.log('  botão:', await press(/^Abrir acompanhamento$/), '->', await p.evaluate(() => location.hash));
await p.evaluate(() => NAV.go('perfil', { id: 'marina-duarte-teste' }, null)); await p.waitForTimeout(900);
t = await txt(); console.log('  perfil:', /Abrir acompanhamento/.test(t), /estão conectados/.test(t));
// 4. descanso depois de marcar a série, e última vez
await p.evaluate(() => NAV.go('aluno', {}, null)); await p.waitForTimeout(900);
await press(/^Começar treino$/); await p.waitForTimeout(400);
await (await p.$('#app [role=checkbox]')).click(); await p.waitForTimeout(900);
t = await txt(); console.log('4 descanso:', /Descanso: 1:(2\d|30)/.test(t), /depois de Agachamento/.test(t), '| última vez:', /Última vez: 8 rep × 37,5 kg em 05\/11\/2026/.test(t));
console.log('  pular:', await press(/^Pular$/), !/Descanso:/.test(await txt()));
await press(/^Pausar e sair$/);
// 5. continuar busca
await p.evaluate(() => NAV.go('home', {}, null)); await p.waitForTimeout(700);
await p.evaluate(() => { const e = [...document.querySelectorAll('#app .rail__item')].find((x) => x.textContent.trim() === 'Pilates'); e.click(); }); await p.waitForTimeout(800);
await p.evaluate(() => NAV.go('home', {}, null)); await p.waitForTimeout(800);
t = await txt(); console.log('5 continue de onde parou:', /CONTINUE DE ONDE PAROU/i.test(t), /Pilates/.test(t), /guardada só neste aparelho/.test(t), '| sem vistos recentes:', !/Vistos recentemente/i.test(t));
await press(/^Limpar$/); await p.waitForTimeout(500);
t = await txt(); console.log('  limpar volta à busca:', !/CONTINUE DE ONDE PAROU/i.test(t), await p.evaluate(() => localStorage.getItem('c99.tela.busca')));
// 6. meus dados
await p.evaluate(() => GO('AMENU')); await p.waitForTimeout(600);
console.log('6 conta:', await press(/^Meus dados/), '->', await p.evaluate(() => location.hash));
const dls = []; p.on('download', (d) => dls.push(d));
await press(/^Baixar meus dados$/); await p.waitForTimeout(2500);
const fs = await import('node:fs');
const files = []; for (const d of dls) { const f = await d.path(); files.push([d.suggestedFilename(), fs.readFileSync(f, 'utf8')]); }
const js = files.find((f) => /\.json$/.test(f[0])), cs = files.find((f) => /\.csv$/.test(f[0]));
const o = js ? JSON.parse(js[1]) : {};
console.log('  arquivos:', files.map((f) => f[0].replace(/\d{4}-\d{2}-\d{2}/, 'DATA')).join(', '));
console.log('  json:', o.conta && o.conta.display_name, '| vínculos', (o.vinculos || []).length, '| sessões', (o.sessoes || []).length, '| mensagens', (o.mensagens || []).length, '| sem token:', !/access_token|refresh_token/.test(js ? js[1] : 'access_token'));
console.log('  csv:', cs && cs[1].split('\r\n')[1]);
t = await txt(); console.log('  recibo:', /Arquivo gerado às/.test(t), '| exclusão honesta:', /nada é apagado até você confirmar/.test(t));
// 7. sair apaga tudo o que é da conta
await p.evaluate(() => localStorage.setItem('c99.sessaoTreino.al.x', '{}'));
await press(/^Sair e apagar deste aparelho$/); await p.waitForTimeout(2500);
console.log('7 depois de sair:', await p.evaluate(() => JSON.stringify(Object.keys(localStorage).filter((k) => /^c99\./.test(k) && !/^c99\.(db|tela\.home)$/.test(k)))), '| sessão', await p.evaluate(() => !!CONTA.session()));
console.log('errs', errs);
await b.close();
