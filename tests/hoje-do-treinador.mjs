// Hoje do treinador com conta real: fila de trabalho só com fatos do servidor (simulado).
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const b = await chromium.launch();
const today = new Date(); today.setHours(15, 0, 0, 0);
const srv = { links: [], reqs: [], appts: [], apFail: false };
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.route('**/api/v1/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[]}' }));
await ctx.route('**/rycaxboqkkiopjdecgld.supabase.co/**', async (route) => {
  const rq = route.request(), u = new URL(rq.url());
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' };
  if (rq.method() === 'OPTIONS') return route.fulfill({ status: 200, headers: cors });
  const j = (s, d) => route.fulfill({ status: s, headers: cors, body: JSON.stringify(d) });
  const path = u.pathname.replace('/rest/v1/', '');
  if (path === 'links') return j(200, srv.links);
  if (path === 'requests') return j(200, srv.reqs);
  if (path === 'appointments') return srv.apFail ? j(500, { message: 'falha' }) : j(200, srv.appts);
  if (path === 'profiles') return j(200, /id=in/.test(u.search) ? [{ id: 'a1', display_name: 'Caio Prado' }, { id: 'a2', display_name: 'Bia Lima' }, { id: 'a3', display_name: 'Davi Reis' }, { id: 'a4', display_name: 'Eva Nunes' }] : [{ id: 'tr', roles: ['treinador'] }]);
  if (path === 'trainers') return j(200, [{ id: 'T1' }]);
  return j(200, []);
});
const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 160)));
await p.goto('http://localhost:5173/', { waitUntil: 'load' }); await p.waitForTimeout(500);
await p.evaluate(() => {
  localStorage.setItem('c99.sessao', JSON.stringify({ access_token: 't', refresh_token: 'r', user: { id: 'tr', email: 'tr@x.com' } }));
  const C = PAGES.onboarding.Comp;
  STORE.saveOnb(Object.assign(C.prototype.base.call(C.prototype, 'treinador', ''), { name: 'Marina Duarte', dadosSaved: true, conta: true, step: 'hoje', scn: '', published: false }));
});
const txt = () => p.evaluate(() => document.getElementById('app').innerText.replace(/\s+/g, ' '));
const openHoje = async () => { await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1500); await p.evaluate(() => NAV.go('treinador', { s: 'hoje' }, null)); await p.waitForTimeout(900); return txt(); };
const press = async (re) => { for (const h of await p.$$('#app button')) { const t = (await h.textContent()).trim(); if (re.test(t) && (await h.isVisible())) { await h.click(); return t; } } return null; };
// 1. conta nova, perfil não publicado: uma próxima ação, sem números
let t = await openHoje();
console.log('1 conta nova:', /Publicar seu perfil/.test(t), '| sem fila nem zeros:', !/Precisa de você/.test(t) && !/0 alunos/.test(t), '| data de hoje:', new RegExp(String(new Date().getDate())).test(t));
// 2. com fatos: pedido pendente, preparação a revisar, aluno sem treino, aluno com a preparação, pausado, horário hoje
const lk = (id, sid, prep, st, w) => ({ id, status: st || 'ativo', origin: 'convite', prep, answers: {}, created_at: '2026-11-01T12:00:00Z', student_id: sid, trainers: { slug: 'm', name: 'Marina Duarte', user_id: 'tr' }, workouts: w ? [{ template_id: 'manual', title: 'Treino A', current_version: 1, workout_versions: [{ version: 1, sessions: [{ id: 's1', title: 'A', estMin: 10, items: [] }], schedule: null, created_at: '2026-11-02T12:00:00Z' }] }] : [] });
srv.links = [lk('L1', 'a1', 'awaiting_review'), lk('L2', 'a2', 'ready_to_assign'), lk('L3', 'a3', 'awaiting_client'), lk('L4', 'a4', 'assigned', 'pausado', true)];
srv.reqs = [{ id: 'R1', status: 'pendente', message: 'Quero treinar', created_at: '2026-11-10T21:00:00Z', expires_at: '2026-11-12T21:00:00Z', student_id: 'a4', trainers: { slug: 'm', name: 'Marina Duarte', user_id: 'tr' }, offers: null }];
srv.appts = [{ id: 'A1', link_id: 'L2', starts_at: today.toISOString(), ends_at: today.toISOString(), tz: 'America/Sao_Paulo', status: 'marcado', booked_by: 'aluno' }];
t = await openHoje();
console.log('2 fila:', /3 pendências suas agora/.test(t), '| pedido:', /Eva Nunes Pediu acompanhamento/.test(t) && /vale até 12\/11/.test(t), '| revisar:', /Caio Prado Respondeu a preparação/.test(t), '| sem treino:', /Bia Lima Ainda sem treino atribuído/.test(t));
console.log('  aguardando o aluno separado:', /Aguardando o aluno .*Davi Reis A preparação está com Davi/.test(t), '| agenda de hoje:', /Agenda de hoje .*Bia Lima/.test(t), '| contagens:', /3 alunos ativos · 1 pausado · 1 pedido aguardando/.test(t));
console.log('  botões:', await press(/^Revisar respostas$/), '->', await p.evaluate(() => location.hash));
// 3. agenda falhou: não vira "dia livre"
srv.apFail = true; t = await openHoje();
console.log('3 agenda indisponível:', /Não deu para carregar a agenda agora/.test(t), '| não diz que está livre:', !/Nenhum horário marcado para hoje/.test(t));
// 4. tudo resolvido
srv.apFail = false; srv.reqs = []; srv.links = [lk('L4', 'a4', 'assigned', 'ativo', true)]; srv.appts = [];
t = await openHoje();
console.log('4 tudo em dia:', /Tudo em dia/.test(t), /Nenhum horário marcado para hoje/.test(t), /1 aluno ativo · 0 pedidos aguardando/.test(t));
console.log('errs', errs);
await b.close();
