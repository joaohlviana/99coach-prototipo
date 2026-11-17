// Programas do treinador (criar, publicar, retirar) e conversa (procurar, editar, retirar), com servidor simulado.
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const now = Date.now(), iso = (min) => new Date(now - min * 60000).toISOString();
const srv = { progs: [], pc: {}, contentLeak: false, calls: [],
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
  const path = u.pathname.replace('/rest/v1/', ''), body = (() => { try { return rq.postData() ? JSON.parse(rq.postData()) : {}; } catch (_) { return {}; } })(), q = decodeURIComponent(u.search);
  if (path === 'programs') {
    // como o banco: o conteúdo vendido não é coluna de programs (fica em program_contents, só o dono lê)
    if ((rq.method() === 'POST' || rq.method() === 'PATCH') && 'content' in body) srv.contentLeak = true;
    if (rq.method() === 'POST') { const row = Object.assign({ id: 'P' + srv.progs.length, version: 0, sale_enabled: false, draft_rev: 0, format: 'sessoes', price_cents: null }, body); srv.progs.push(row); return j([row]); }
    const id = (q.match(/id=eq\.([^&]+)/) || [])[1];
    if (rq.method() === 'PATCH') { const row = srv.progs.find((x) => x.id === id); Object.assign(row, body); return j([row]); }
    if (rq.method() === 'DELETE') { srv.progs = srv.progs.filter((x) => x.id !== id); return j([]); }
    return j(srv.progs.map((x) => Object.assign({}, x, { program_contents: srv.pc[x.id] || null })));
  }
  if (path === 'rpc/save_program_draft') {
    const pg = srv.progs.find((x) => x.id === body.p_program);
    if (srv.otherSave) { srv.otherSave = false; pg.draft_rev += 1; srv.pc[pg.id] = { content: '', sessions: [{ title: 'Do outro aparelho', items: [{ name: 'Remada' }] }] }; }
    if (pg.draft_rev !== body.p_rev) return j({ saved: false, conflict: true, rev: pg.draft_rev, current: { title: pg.title, goal: pg.goal, sessions: (srv.pc[pg.id] || {}).sessions || [], notes: '' } });
    Object.assign(pg, { title: body.p_fields.title, goal: body.p_fields.goal, description: body.p_fields.description, format: body.p_fields.format, draft_rev: pg.draft_rev + 1 });
    srv.pc[pg.id] = { content: body.p_notes, sessions: body.p_sessions }; srv.calls.push('save:' + body.p_sessions.length);
    return j({ saved: true, rev: pg.draft_rev });
  }
  if (path === 'rpc/publish_program') { const pg = srv.progs.find((x) => x.id === body.p_program); if (pg.draft_rev !== body.p_rev) return j({ outcome: 'mudou' }); pg.version += 1; pg.status = 'publicado'; srv.calls.push('publish:v' + pg.version); return j({ outcome: 'publicado', version: pg.version, sale: pg.sale_enabled }); }
  if (path === 'rpc/set_program_sale') { const pg = srv.progs.find((x) => x.id === body.p_program); if (body.p_on && !pg.version) return j({ outcome: 'sem_versao_publicada' }); pg.sale_enabled = !!body.p_on; if (body.p_price_cents) pg.price_cents = body.p_price_cents; srv.calls.push('sale:' + body.p_on + ':' + body.p_price_cents); return j({ outcome: body.p_on ? 'venda_ligada' : 'venda_desligada' }); }
  if (path === 'rpc/program_participants') return j(srv.parts || []);
  if (path === 'rpc/grant_program_access') { srv.calls.push('grant:' + body.p_email); srv.parts = [{ access: 'A1', name: 'Caio Prado', source: 'cortesia', version: 1, since: '2026-11-17T12:00:00Z', until: '2027-11-17T12:00:00Z', revoked: false }]; return j({ outcome: 'concedido', access: 'A1', until: '2027-11-17T12:00:00Z', version: 1 }); }
  if (path === 'rpc/revoke_program_grant') { srv.calls.push('revoke:' + body.p_access); srv.parts = [Object.assign({}, srv.parts[0], { revoked: true })]; return j({ outcome: 'revogado' }); }
  if (/\/storage\/v1\/object\/chat-anexos\//.test(u.pathname)) { srv.calls.push('upload:' + rq.method() + ':' + (rq.headers()['content-type'] || '')); return j({ Key: 'ok' }); }
  if (path === 'rpc/send_message') { const m = { id: 'm9', side: 'treinador', body: body.p_body, client_id: body.p_client_id, created_at: iso(0), read_at: null, edited_at: null, retracted_at: null }; srv.msgs.push(m); return j({ outcome: 'entregue', id: 'm9', at: m.created_at }); }
  if (path === 'rpc/attach_to_message') { const m = srv.msgs.find((x) => x.id === body.p_message); m.attachment_path = body.p_path; m.attachment_name = body.p_name; m.attachment_type = body.p_type; srv.calls.push('attach:' + /^L1\//.test(body.p_path)); return j({ id: m.id }); }
  if (path === 'rpc/my_programs') return j(srv.mine || []);
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
// 1. programas: criar com título e objetivo; sessões; conflito; publicar ≠ vender; cortesia; prévia
await p.evaluate(() => GO('PROGR')); await p.waitForTimeout(1200);
let t = await T();
console.log('1 programas vazio e honesto:', /Nenhum programa ainda/.test(t), /Crie, publique uma versão e, quando quiser, ligue a venda/.test(t));
await press(/Novo programa/); await press(/^Criar rascunho$/);
console.log('  pede título e objetivo antes de gravar:', /Dê um título/.test(await T()), srv.progs.length === 0);
await p.fill('#pgn-t', 'Força em 8 semanas'); await p.fill('#pgn-g', 'Ganhar força com segurança'); await press(/^Criar rascunho$/); await p.waitForTimeout(800); t = await T();
console.log('  criado como rascunho sem preço:', srv.progs.length === 1 && srv.progs[0].status === 'rascunho' && srv.progs[0].price_cents == null && srv.progs[0].goal === 'Ganhar força com segurança', /Conteúdo/.test(t) && /Apresentação/.test(t) && /Acesso/.test(t) && /Revisão/.test(t));
await press(/^Revisão/); t = await T();
console.log('  revisão mostra o que falta e não deixa publicar:', /Inclua pelo menos uma sessão/.test(t));
await press(/^Conteúdo$/); await press(/^Sessão$/); await press(/^Exercício$/);
await p.fill('#pgx-n0-0', 'Agachamento livre'); await p.fill('#pg-notes', 'Aqueça 10 minutos antes de cada sessão.');
await press(/^Salvar rascunho$/); await p.waitForTimeout(800);
console.log('  rascunho salvo na conta com sessões:', srv.calls.includes('save:1'), (srv.pc.P0 || {}).sessions?.[0]?.items?.[0]?.name === 'Agachamento livre', !srv.contentLeak);
srv.otherSave = true; await p.fill('#pgx-n0-0', 'Agachamento frontal'); await press(/^Salvar rascunho$/); await p.waitForTimeout(800); t = await T();
console.log('  conflito com outro aparelho, nada descartado:', /Conflito de edição/.test(t), /Manter o que está aqui/.test(t));
await press(/^Manter o que está aqui$/); await p.waitForTimeout(800);
console.log('  manter a minha grava sobre a versão nova:', (srv.pc.P0 || {}).sessions?.[0]?.items?.[0]?.name === 'Agachamento frontal');
await press(/^Revisão/); await press(/^Ver como o aluno vê$/); t = await T();
console.log('  prévia do aluno sem efeitos:', /Prévia do aluno/.test(t), /Agachamento frontal/.test(t), !srv.calls.some((c) => /^grant|^sale|^publish/.test(c)));
await press(/^Ligar venda$/); await p.waitForTimeout(300);
console.log('  sem versão publicada não vende:', /Publique uma versão antes de ligar a venda/.test(await T()), !srv.calls.some((c) => /^sale/.test(c)));
await press(/^Publicar versão 1$/); await press(/^Publicar versão 1$/, '.mod-sheet button'); await p.waitForTimeout(800); t = await T();
console.log('  publicar cria a v1 e não liga a venda:', srv.calls.includes('publish:v1'), srv.progs[0].sale_enabled === false, /v1 publicada · venda desligada/i.test(t));
await p.fill('#pg-p', '197,00'); await press(/^Ligar venda$/); await press(/^Ligar venda$/, '.mod-sheet button'); await p.waitForTimeout(800); t = await T();
console.log('  venda ligada à parte, preço em centavos:', srv.calls.includes('sale:true:19700'), /venda ligada/i.test(t));
await press(/^Acesso$/); await p.waitForTimeout(600);
await p.fill('#pg-ge', 'caio@x.com'); await press(/^Conceder acesso$/); await p.waitForTimeout(800); t = await T();
console.log('  cortesia concedida sem pedido:', srv.calls.includes('grant:caio@x.com'), /Cortesia/i.test(t), /12 meses a partir da liberação/.test(t));
await press(/^Revogar cortesia$/); await press(/^Revogar cortesia$/, '.mod-sheet button'); await p.waitForTimeout(800);
console.log('  revogar cortesia:', srv.calls.includes('revoke:A1'));
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
// 3. anexo: recusa tipo errado, envia PDF e mostra o arquivo na conversa
const inp = await p.$('input[type=file].onb-file__in');
await inp.setInputFiles({ name: 'planilha.exe', mimeType: 'application/x-msdownload', buffer: Buffer.from('x') }); await p.waitForTimeout(400);
console.log('3 anexo de tipo errado é recusado:', /Envie imagem \(JPG, PNG ou WebP\) ou PDF/.test(await T()), !srv.calls.some((c) => /^upload/.test(c)));
await (await p.$('input[type=file].onb-file__in')).setInputFiles({ name: 'Avaliação física.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 teste') }); await p.waitForTimeout(1500); t = await T();
console.log('  PDF enviado e ligado à mensagem:', srv.calls.includes('upload:POST:application/pdf'), srv.calls.includes('attach:true'), /Anexo: Avaliação física\.pdf/.test(t), /PDF · abrir/i.test(t));
// 4. aluno: Meus programas mostra o comprado e abre o conteúdo
await p.evaluate(() => { localStorage.setItem('c99.sessao', JSON.stringify({ access_token: 't', refresh_token: 'r', user: { id: 'a1', email: 'a1@x.com' } })); const C = PAGES.onboarding.Comp; STORE.saveOnb(Object.assign(C.prototype.base.call(C.prototype, 'aluno', ''), { name: 'Caio Prado', dadosSaved: true, conta: true, step: 'pronto', scn: '' })); });
srv.mine = [{ access: 'X1', order: 'O1', program: 'P0', source: 'compra', version: 1, latest: 2, title: 'Força em 8 semanas', trainer: 'Marina Duarte', weeks: 8, workouts: 1, format: 'sessoes', goal: 'Ganhar força', description: 'Base de força', content: 'Aqueça antes.', sessions: [{ title: 'Treino A', text: '', items: [{ name: 'Agachamento livre', sets: '3', reps: '8', rest: '90 s' }], video: { kind: 'youtube', id: 'dQw4w9WgXcQ' } }], since: '2026-05-14T00:00:00Z', until: '2027-05-14T00:00:00Z' }, { access: 'X2', order: null, program: 'P1', source: 'cortesia', version: 1, latest: 1, title: 'Mobilidade', trainer: 'Marina Duarte', sessions: [], since: '2026-11-01T00:00:00Z', until: '2027-11-01T00:00:00Z' }];
await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1500); await p.evaluate(() => GO('MPROG')); await p.waitForTimeout(1200); t = await T();
console.log('4 meus programas com origem e versão:', /Força em 8 semanas/.test(t), /Compra/i.test(t) && /Cortesia do treinador/i.test(t), /Versão 1 · acesso de 14\/05\/2026 a 14\/05\/2027/.test(t), /continua com a versão 1/.test(t));
await press(/^Abrir programa$/); t = await T(); console.log('  sessões abrem com exercícios:', /Agachamento livre/.test(t), /3 séries · 8 repetições/.test(t), /Aqueça antes/.test(t));
await press(/^Ver vídeo$/); console.log('  vídeo da sessão toca no app:', await p.evaluate(() => !!document.querySelector('#app iframe[src*="youtube-nocookie.com/embed/dQw4w9WgXcQ"]')));
console.log('errs', errs);
await b.close();
