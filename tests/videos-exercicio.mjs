// Vídeo do exercício: o treinador escolhe por sugestão automática do YouTube, por link colado ou enviando um vídeo seu;
// a escolha fica salva na conta (vale em outro aparelho) e vai junto no treino que o aluno recebe.
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const b = await chromium.launch();
const srv = { lib: {}, ups: [], assign: null, keyOn: false, rmd: [] };
const serve = async (ctx) => {
  await ctx.route('**/api/v1/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[]}' }));
  await ctx.route('**/i.ytimg.com/**', (r) => r.fulfill({ status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="4" height="3"/>' }));
  await ctx.route('**/www.youtube-nocookie.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<p>player</p>' }));
  await ctx.route('**/rycaxboqkkiopjdecgld.supabase.co/**', async (route) => {
    const rq = route.request(), u = new URL(rq.url());
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' };
    if (rq.method() === 'OPTIONS') return route.fulfill({ status: 200, headers: cors });
    const j = (s, d) => route.fulfill({ status: s, headers: cors, body: JSON.stringify(d) });
    if (u.pathname === '/functions/v1/videos-exercicio') {
      const a = JSON.parse(rq.postData());
      if (a.acao === 'info') return j(200, a.id === 'BLOQUEADO12' ? { ok: false, motivo: 'nao_incorporavel' } : { ok: true, id: a.id, title: 'Agachamento livre: execução', channel: 'Canal X' });
      if (a.acao === 'buscar') return j(200, srv.keyOn ? { ok: true, configured: true, items: [{ id: 'AAAAAAAAAA1', title: 'Agachamento livre passo a passo', channel: 'Prof A' }, { id: 'BBBBBBBBBB2', title: 'Erros no agachamento', channel: 'Prof B' }] } : { ok: true, configured: false, items: [] });
    }
    if (u.pathname.startsWith('/storage/v1/object/exercicio-videos/')) {
      if (rq.method() === 'DELETE') { srv.rmd.push(u.pathname); return j(200, {}); }
      srv.ups.push({ path: u.pathname, type: rq.headers()['content-type'] }); return j(200, { Key: u.pathname });
    }
    const path = u.pathname.replace('/rest/v1/', '');
    if (path === 'trainer_library') return j(200, Object.keys(srv.lib).map((k) => ({ kind: k, doc: srv.lib[k].doc, version: srv.lib[k].v })));
    if (path === 'rpc/save_library') {
      const a = JSON.parse(rq.postData()); const cur = srv.lib[a.p_kind];
      if (!cur) { srv.lib[a.p_kind] = { doc: a.p_doc, v: 1 }; return j(200, { saved: true, version: 1 }); }
      if (cur.v !== (a.p_version || 0)) return j(200, { saved: false, conflict: true, version: cur.v, doc: cur.doc });
      cur.doc = a.p_doc; cur.v += 1; return j(200, { saved: true, version: cur.v });
    }
    if (path === 'rpc/assign_workout') { srv.assign = JSON.parse(rq.postData()); return j(200, { workoutId: 'w1', version: 1 }); }
    if (path === 'trainers') return j(200, [{ id: 'T1', slug: 'marina-d', name: 'Marina Duarte', status: 'rascunho' }]);
    if (path === 'profiles') return j(200, [{ id: 'tr', roles: ['treinador'] }]);
    return j(200, []);
  });
};
const entrar = async (ctx) => {
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 160)));
  await p.goto('http://localhost:5173/', { waitUntil: 'load' }); await p.waitForTimeout(500);
  await p.evaluate(() => {
    localStorage.setItem('c99.sessao', JSON.stringify({ access_token: 't', refresh_token: 'r', user: { id: 'tr', email: 'tr@x.com' } }));
    const C = PAGES.onboarding.Comp;
    STORE.saveOnb(Object.assign(C.prototype.base.call(C.prototype, 'treinador', ''), { name: 'Marina Duarte', dadosSaved: true, conta: true, step: 'hoje', scn: '', published: false }));
  });
  await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1500);
  await p.evaluate(() => NAV.go('treinador', { s: 'exercicio', id: 'agach' }, null)); await p.waitForTimeout(2500);
  return { p, errs };
};
const txt = (p) => p.evaluate(() => document.getElementById('app').innerText.replace(/\s+/g, ' '));
const clickTxt = async (p, re) => { const ok = await p.evaluate((s) => { const r = new RegExp(s); const el = [...document.querySelectorAll('#app button, #app a, #app label')].find((x) => r.test(x.textContent) && x.offsetParent); if (el) el.click(); return !!el; }, re.source); await p.waitForTimeout(700); return ok; };

const A = await b.newContext({ viewport: { width: 1280, height: 900 } }); await serve(A);
const a = await entrar(A);
let t = await txt(a.p);
console.log('1 sem vídeo, sem aviso falso:', /ainda não tem vídeo/.test(t), !/ainda não foi enviado/.test(t), '| botão escolher:', /Escolher vídeo/.test(t));

await clickTxt(a.p, /^Escolher vídeo$/); await a.p.waitForTimeout(1200);
t = await txt(a.p);
console.log('2 sem chave: busca pronta no YouTube:', /Buscar “Agachamento livre” no YouTube/.test(t), await a.p.evaluate(() => /youtube\.com\/results\?search_query=Agachamento/.test([...document.querySelectorAll('#app a')].map((x) => x.href).join(' '))));

await clickTxt(a.p, /^Link do YouTube$/);
await a.p.fill('#t3-vlink', 'isso não é link'); await clickTxt(a.p, /^Usar este vídeo$/);
t = await txt(a.p);
console.log('3 link inválido avisado:', /Cole um link do YouTube/.test(t));
await a.p.fill('#t3-vlink', 'https://youtu.be/BLOQUEADO12'); await clickTxt(a.p, /^Usar este vídeo$/); await a.p.waitForTimeout(600);
console.log('4 vídeo que não pode ser incorporado avisado:', /não permite que ele seja mostrado fora do YouTube/.test(await txt(a.p)));
await a.p.fill('#t3-vlink', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s'); await clickTxt(a.p, /^Usar este vídeo$/); await a.p.waitForTimeout(3000);
t = await txt(a.p);
const vid = await a.p.evaluate(() => DB.exercicios.find((e) => e.id === 'agach').video);
console.log('5 link salvo no exercício:', vid && vid.kind === 'youtube' && vid.id === 'dQw4w9WgXcQ', '| título do vídeo:', /Agachamento livre: execução/.test(t), '| capa:', await a.p.evaluate(() => !!document.querySelector('#app .t3-vbox__img[src*="dQw4w9WgXcQ"]')));
const ref = ((srv.lib.exercicios || {}).doc || []).find((x) => x.id === 'agach');
console.log('6 foi para a conta:', !!(ref && ref.ref && ref.video && ref.video.id === 'dQw4w9WgXcQ'), '| catálogo não copiado:', !((srv.lib.exercicios || {}).doc || []).some((x) => x.ref && x.name));
await a.p.click('#app .t3-media__play'); await a.p.waitForTimeout(800);
console.log('7 toca dentro do app (sem cookies de rastreio):', await a.p.evaluate(() => !!document.querySelector('#app iframe[src^="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"]')));

// outro aparelho: o vídeo escolhido aparece
const B = await b.newContext({ viewport: { width: 390, height: 844 } }); await serve(B);
const bb = await entrar(B);
console.log('8 outro aparelho recebe o vídeo:', await bb.p.evaluate(() => (DB.exercicios.find((e) => e.id === 'agach').video || {}).id === 'dQw4w9WgXcQ'), await bb.p.evaluate(() => !!document.querySelector('#app .t3-vbox__img')));

// sugestões automáticas com a chave ligada
srv.keyOn = true;
await a.p.evaluate(() => { try { Object.keys(localStorage).filter((k) => k.startsWith('c99.vid:')).forEach((k) => localStorage.removeItem(k)); } catch (_) {} });
await clickTxt(a.p, /^Trocar vídeo$/); await a.p.waitForTimeout(400);
await clickTxt(a.p, /^Sugestões$/); await a.p.waitForTimeout(1500);
t = await txt(a.p);
console.log('9 sugestões automáticas:', /Agachamento livre passo a passo/.test(t), /Erros no agachamento/.test(t));
await clickTxt(a.p, /Erros no agachamento/); await a.p.waitForTimeout(2500);
console.log('10 sugestão escolhida:', await a.p.evaluate(() => DB.exercicios.find((e) => e.id === 'agach').video.id === 'BBBBBBBBBB2'));

// vídeo próprio
await clickTxt(a.p, /^Trocar vídeo$/); await a.p.waitForTimeout(400);
await clickTxt(a.p, /^Enviar vídeo$/); await a.p.waitForTimeout(400);
const inp = await a.p.$('#app input[type=file][accept^="video/"]');
await inp.setInputFiles({ name: 'texto.txt', mimeType: 'text/plain', buffer: Buffer.from('x') }); await a.p.waitForTimeout(500);
console.log('11 arquivo que não é vídeo recusado:', /Escolha um arquivo de vídeo/.test(await txt(a.p)), srv.ups.length === 0);
await (await a.p.$('#app input[type=file][accept^="video/"]')).setInputFiles({ name: 'meu-agachamento.mp4', mimeType: 'video/mp4', buffer: Buffer.alloc(2048) }); await a.p.waitForTimeout(3000);
const v2 = await a.p.evaluate(() => DB.exercicios.find((e) => e.id === 'agach').video);
console.log('12 vídeo próprio enviado na pasta da conta:', srv.ups.length === 1 && /\/exercicio-videos\/tr\/agach-/.test(srv.ups[0].path) && srv.ups[0].type === 'video/mp4', '| salvo:', v2.kind === 'arquivo' && /exercicio-videos\/tr\//.test(v2.url), '| player:', await a.p.evaluate(() => !!document.querySelector('#app video.t3-vbox__fr')));

// o treino atribuído leva o vídeo
await a.p.evaluate(() => CONTA.assignWorkout('L1', 'Treino A', [{ id: 's1', title: 'A', goal: 'x', estMin: 20, items: [{ exerciseId: 'agach', name: 'Agachamento livre', sets: 3, reps: '10', loadKg: null, restS: 60, notes: null }, { exerciseId: 'livre-x', name: 'Livre', sets: 1, reps: '1', loadKg: null, restS: 0, notes: null }] }], 0));
await a.p.waitForTimeout(800);
const it0 = srv.assign && srv.assign.p_sessions[0].items;
console.log('13 treino leva o vídeo:', !!(it0 && it0[0].video && it0[0].video.kind === 'arquivo'), '| exercício sem vídeo vai sem:', !!(it0 && !it0[1].video));

// retirar
await clickTxt(a.p, /^Retirar$/); await a.p.waitForTimeout(400);
await a.p.evaluate(() => { const bt = [...document.querySelectorAll('button')].find((x) => /^Retirar$/.test(x.textContent.trim()) && x.closest('[role=dialog], .sheet, .modal')); if (bt) bt.click(); }); await a.p.waitForTimeout(2500);
console.log('14 retirar apaga o arquivo enviado:', await a.p.evaluate(() => !DB.exercicios.find((e) => e.id === 'agach').video), srv.rmd.length === 1);
console.log('15 sem erros:', a.errs.length === 0 && bb.errs.length === 0, a.errs.concat(bb.errs).join(' | '));
await b.close();
