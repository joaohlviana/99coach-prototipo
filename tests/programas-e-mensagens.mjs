// Programas do treinador (criar, publicar, retirar) e conversa (procurar, editar, retirar), com servidor simulado.
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const now = Date.now(), iso = (min) => new Date(now - min * 60000).toISOString();
const srv = { progs: [], calls: [],
  msgs: [1, 2, 3, 4, 5].map((i) => ({ id: 'old' + i, side: 'aluno', body: 'Mensagem antiga ' + i, client_id: 'c-antiga-' + i, created_at: iso(600 + i), read_at: iso(500), edited_at: null, retracted_at: null }))
    .concat([{ id: 'm1', side: 'treinador', body: 'Treino de perna amanha', client_id: 'c-nova-0001', created_at: iso(2), read_at: null, edited_at: null, retracted_at: null }]) };
const lk = { id: 'L1', status: 'ativo', origin: 'convite', prep: 'assigned', answers: {}, created_at: '2026-11-01T12:00:00Z', student_id: 'a1', trainers: { slug: 'm', name: 'Marina Duarte', user_id: 'tr' },
  workouts: [{ template_id: 'manual', title: 'Treino A', current_version: 1, workout_versions: [{ version: 1, sessions: [{ id: 's1', title: 'A', estMin: 10, items: [] }], schedule: null, created_at: '2026-11-02T12:00:00Z' }] }] };
await ctx.route('**/api/v1/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[]}' }));
await ctx.route('**/rycaxboqkkiopjdecgld.supabase.co/**', async (route) => {
  const rq = route.request(), u = new URL(rq.url());
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'content-type': 'application/json' };
  if (rq.method() === 'OPTIONS') return route.fulfill({ status: 200, headers: cors });
  const j = (d, s) => route.fulfill({ status: s || 200, headers: cors, body: JSON.stringify(d) });
  const path = u.pathname.replace('/rest/v1/', ''), body = rq.postData() ? JSON.parse(rq.postData()) : {}, q = decodeURIComponent(u.search);
  if (path === 'programs') {
    if (rq.method() === 'POST') { srv.progs.push(Object.assign({ id: 'P' + srv.progs.length }, body)); return j([]); }
    const id = (q.match(/id=eq\.([^&]+)/) || [])[1];
    if (rq.method() === 'PATCH') { Object.assign(srv.progs.find((x) => x.id === id), body); return j([]); }
    if (rq.method() === 'DELETE') { srv.progs = srv.progs.filter((x) => x.id !== id); return j([]); }
    return j(srv.progs);
  }
  if (path === 'messages') return j(srv.msgs.slice().reverse());
  if (path === 'rpc/edit_message') { const m = srv.msgs.find((x) => x.id === body.p_id); m.body = body.p_body; m.edited_at = iso(0); srv.calls.push('edit'); return j({ id: m.id }); }
  if (path === 'rpc/retract_message') { const m = srv.msgs.find((x) => x.id === body.p_id); m.body = 'Mensagem retirada'; m.retracted_at = iso(0); srv.calls.push('retract'); return j({ id: m.id }); }
  if (path === 'links') return j([lk]);
  if (path === 'profiles') return j(/id=in/.test(u.search) ? [{ id: 'a1', display_name: 'Caio Prado' }] : [{ id: 'tr', roles: ['treinador'] }]);
  if (path === 'trainers') return j([{ id: 'T1', status: 'publicado', slug: 'm' }]);
  return j([]);
});
const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 160)));
await p.goto('http://localhost:5173/', { waitUntil: 'load' }); await p.waitForTimeout(500);
await p.evaluate(() => {
  localStorage.setItem('c99.sessao', JSON.stringify({ access_token: 't', refresh_token: 'r', user: { id: 'tr', email: 'tr@x.com' } }));
  const C = PAGES.onboarding.Comp;
  STORE.saveOnb(Object.assign(C.prototype.base.call(C.prototype, 'treinador', ''), { name: 'Marina Duarte', dadosSaved: true, conta: true, step: 'hoje', scn: '', published: true }));
});
await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1500);
const T = () => p.evaluate(() => document.getElementById('conteudo').innerText.replace(/\s+/g, ' '));
const press = async (re, sel) => { for (const h of await p.$$(sel || '#conteudo button')) { const t = (await h.textContent()).trim(); if (re.test(t) && (await h.isVisible())) { await h.click(); await p.waitForTimeout(700); return t; } } return null; };
// 1. programas
await p.evaluate(() => GO('PROGR')); await p.waitForTimeout(1200);
let t = await T();
console.log('1 programas vazio e honesto:', /Nenhum programa ainda/.test(t), /venda pelo site ainda não está ligada/.test(t));
await press(/Novo programa/); await press(/^Salvar$/);
console.log('  valida antes de gravar:', /Dê um nome ao programa/.test(await T()), srv.progs.length === 0);
await p.fill('#pg-t', 'Força em 8 semanas'); await p.fill('#pg-w', '8'); await p.fill('#pg-k', '24'); await p.fill('#pg-m', '6'); await p.fill('#pg-p', '197,00');
await press(/^Salvar$/); await p.waitForTimeout(600); t = await T();
console.log('  criado como rascunho:', srv.progs.length === 1 && srv.progs[0].status === 'rascunho' && srv.progs[0].price_cents === 19700 && srv.progs[0].trainer_id === 'T1' && /^forca-em-8-semanas-/.test(srv.progs[0].slug), /Força em 8 semanas Rascunho/i.test(t), /8 semanas · 24 treinos · acesso por 6 meses · R\$ 197,00/.test(t));
await press(/^Publicar$/); await press(/^Publicar$/, '.mod-sheet button'); await p.waitForTimeout(600);
console.log('  publicado:', srv.progs[0].status === 'publicado', /Publicado/i.test(await T()));
await press(/^Retirar$/); await p.waitForTimeout(600);
console.log('  retirado:', srv.progs[0].status === 'retirado', /Retirado/i.test(await T()));
// 2. conversa: procurar, editar e retirar
await p.evaluate(() => GO('H05', { id: 'lk_L1' })); await p.waitForTimeout(1500);
t = await T();
console.log('2 conversa carregou:', /Treino de perna amanha/.test(t), '| só a recente e minha pode ser alterada:', (await p.$$('.rx-msg__a')).length === 2);
await p.fill('input[aria-label="Procurar na conversa"]', 'perna'); await p.waitForTimeout(500); t = await T();
console.log('  procurar:', /1 mensagem encontrada/.test(t), !/Mensagem antiga 3/.test(t));
await press(/^Limpar$/);
await press(/^Editar$/, '.rx-msg__a'); await p.fill('textarea[aria-label="Corrigir mensagem"]', 'Treino de perna amanhã às 7h'); await press(/^Salvar$/); await p.waitForTimeout(700); t = await T();
console.log('  editar:', srv.calls.includes('edit'), /Treino de perna amanhã às 7h/.test(t), /editada/i.test(t));
await press(/^Retirar$/, '.rx-msg__a'); await press(/^Retirar mensagem$/, '.mod-sheet button'); await p.waitForTimeout(700); t = await T();
console.log('  retirar:', srv.calls.includes('retract'), /Mensagem retirada/.test(t), !/às 7h/.test(t));
console.log('errs', errs);
await b.close();
