// Biblioteca do treinador na conta: o que é criado aqui vai para o servidor, o que está na conta chega a um aparelho novo,
// gravação concorrente junta em vez de apagar, e sem conexão a tela diz que ficou só neste aparelho.
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const b = await chromium.launch();
// servidor simulado com a mesma regra do banco real: versão errada devolve conflito com o conteúdo atual
const srv = { lib: {}, saves: [], down: false };
const serve = async (ctx) => {
  await ctx.route('**/api/v1/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[]}' }));
  await ctx.route('**/rycaxboqkkiopjdecgld.supabase.co/**', async (route) => {
    const rq = route.request(), u = new URL(rq.url());
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' };
    if (rq.method() === 'OPTIONS') return route.fulfill({ status: 200, headers: cors });
    const j = (s, d) => route.fulfill({ status: s, headers: cors, body: JSON.stringify(d) });
    const path = u.pathname.replace('/rest/v1/', '');
    if (srv.down && /trainer_library|save_library/.test(path)) return route.abort();
    if (path === 'trainer_library') return j(200, Object.keys(srv.lib).map((k) => ({ kind: k, doc: srv.lib[k].doc, version: srv.lib[k].v })));
    if (path === 'rpc/save_library') {
      const a = JSON.parse(rq.postData());
      if (['rotinas', 'exercicios', 'formularios', 'pastas'].indexOf(a.p_kind) < 0 || !Array.isArray(a.p_doc)) return j(400, { message: 'conteudo_invalido' });
      const cur = srv.lib[a.p_kind];
      if (!cur) { srv.lib[a.p_kind] = { doc: a.p_doc, v: 1 }; srv.saves.push(a.p_kind); return j(200, { saved: true, version: 1 }); }
      if (cur.v !== (a.p_version || 0)) return j(200, { saved: false, conflict: true, version: cur.v, doc: cur.doc });
      cur.doc = a.p_doc; cur.v += 1; srv.saves.push(a.p_kind); return j(200, { saved: true, version: cur.v });
    }
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
  await p.evaluate(() => NAV.go('treinador', { s: 'conteudo' }, null)); await p.waitForTimeout(2500);
  return { p, errs };
};
const txt = (p) => p.evaluate(() => document.getElementById('app').innerText.replace(/\s+/g, ' '));
const nomes = (k) => (srv.lib[k] ? srv.lib[k].doc.map((x) => x.name || x.id) : []);

// 1. aparelho A: conta nova, cria uma rotina e um exercício próprio
const A = await b.newContext({ viewport: { width: 1280, height: 900 } }); await serve(A);
const a = await entrar(A);
let t = await txt(a.p);
console.log('1 conta nova sem exemplos:', await a.p.evaluate(() => DB.rotinas.length === 0 && !DB.exercicios.some((e) => e.own)), '| aviso antigo sumiu:', !/Salvo só neste aparelho/.test(t));
await a.p.evaluate(() => {
  DB.rotinas.push({ id: 'r-forca', name: 'Força A', status: 'rascunho', folder: '', version: 1, sessions: [{ id: 's1', title: 'Treino A', items: [{ ex: 'agach', sets: 3, reps: '8', load: '', rest: 90 }] }] });
  DB.exercicios.push({ id: 'ex-meu', name: 'Agachamento búlgaro', group: 'Pernas', equip: 'Halteres', level: 'Personalizado', media: 'sem', own: true, fav: false, cues: [] });
  window.__rerender();
});
await a.p.waitForTimeout(3500); t = await txt(a.p);
console.log('2 foi para a conta:', nomes('rotinas').includes('Força A'), nomes('exercicios').includes('Agachamento búlgaro'), '| catálogo 99Coach não é copiado:', !nomes('exercicios').includes('Supino reto'), '| tela diz:', /Salvo na sua conta/.test(t));
const savesAntes = srv.saves.length;
await a.p.evaluate(() => window.__rerender()); await a.p.waitForTimeout(2500);
console.log('  sem mudança não regrava:', srv.saves.length === savesAntes);

// 2. aparelho B (novo): recebe o que está na conta
const B = await b.newContext({ viewport: { width: 1280, height: 900 } }); await serve(B);
const bb = await entrar(B);
t = await txt(bb.p);
console.log('3 aparelho novo recebe:', await bb.p.evaluate(() => DB.rotinas.some((r) => r.name === 'Força A') && DB.exercicios.some((e) => e.name === 'Agachamento búlgaro' && e.own) && DB.exercicios.some((e) => e.id === 'supino')), '| aparece na tela:', /Força A/.test(t));

// 3. os dois mudam ao mesmo tempo: nada some
await bb.p.evaluate(() => { DB.rotinas.push({ id: 'r-b', name: 'Do aparelho B', status: 'rascunho', folder: '', version: 1, sessions: [] }); window.__rerender(); });
await bb.p.waitForTimeout(3500);
await a.p.evaluate(() => { DB.rotinas.push({ id: 'r-a', name: 'Do aparelho A', status: 'rascunho', folder: '', version: 1, sessions: [] }); window.__rerender(); });
await a.p.waitForTimeout(4000); t = await txt(a.p);
const r = nomes('rotinas');
console.log('4 gravação ao mesmo tempo junta:', r.includes('Força A') && r.includes('Do aparelho B') && r.includes('Do aparelho A'), '| A passou a ter a de B:', await a.p.evaluate(() => DB.rotinas.some((x) => x.id === 'r-b')), '| avisa:', /atualizada com outro aparelho/.test(t));

// 4. sem conexão: fica aqui e a tela diz; ao voltar, vai para a conta
srv.down = true;
await a.p.evaluate(() => { window.LIB.seenMerge(); DB.rotinas.push({ id: 'r-off', name: 'Feita sem conexão', status: 'rascunho', folder: '', version: 1, sessions: [] }); window.__rerender(); });
await a.p.waitForTimeout(3500); t = await txt(a.p);
console.log('5 sem conexão:', !nomes('rotinas').includes('Feita sem conexão'), '| tela diz:', /só neste aparelho|Ainda não salvo na sua conta/.test(t));
srv.down = false;
await a.p.evaluate(() => window.dispatchEvent(new Event('online'))); await a.p.waitForTimeout(3500); t = await txt(a.p);
console.log('  voltou:', nomes('rotinas').includes('Feita sem conexão'), /Salvo na sua conta/.test(t));

// edição de item que já existe, feita sem conexão e com o app reaberto: ao voltar, vale o que está aqui (não é desfeita)
srv.down = true;
await a.p.evaluate(() => { DB.rotinas.find((x) => x.id === 'r-forca').name = 'Força A (editada sem conexão)'; window.__rerender(); });
await a.p.waitForTimeout(2500);
await a.p.reload({ waitUntil: 'load' }); await a.p.waitForTimeout(2500);
srv.down = false;
await a.p.evaluate(() => NAV.go('treinador', { s: 'conteudo' }, null)); await a.p.waitForTimeout(1000);
await a.p.evaluate(() => window.dispatchEvent(new Event('online'))); await a.p.waitForTimeout(4000);
console.log('  edição sem conexão sobrevive:', nomes('rotinas').includes('Força A (editada sem conexão)'), await a.p.evaluate(() => DB.rotinas.some((x) => x.name === 'Força A (editada sem conexão)')), '| sem cópia duplicada:', nomes('rotinas').filter((n) => /Força A/.test(n)).length === 1);
// os dois aparelhos editam o MESMO item: ficam as duas versões, nada some
await bb.p.reload({ waitUntil: 'load' }); await bb.p.waitForTimeout(2500); await bb.p.evaluate(() => NAV.go('treinador', { s: 'conteudo' }, null)); await bb.p.waitForTimeout(2500);
await bb.p.evaluate(() => { DB.rotinas.find((x) => x.id === 'r-b').name = 'B pelo aparelho B'; window.__rerender(); }); await bb.p.waitForTimeout(3500);
await a.p.evaluate(() => { DB.rotinas.find((x) => x.id === 'r-b').name = 'B pelo aparelho A'; window.__rerender(); }); await a.p.waitForTimeout(4500);
const rr = nomes('rotinas');
console.log('  mesmo item editado nos dois: as duas versões ficam:', rr.includes('B pelo aparelho B'), rr.includes('B pelo aparelho A (deste aparelho)'), /duas cópias/.test(await txt(a.p)));
await a.p.evaluate(() => { window.LIB.seenMerge(); DB.rotinas = DB.rotinas.filter((x) => !/deste aparelho/.test(x.name)); window.__rerender(); }); await a.p.waitForTimeout(3500);

// 5. apagar aqui apaga na conta (não volta sozinho)
await a.p.evaluate(() => { DB.rotinas = DB.rotinas.filter((x) => x.id !== 'r-off'); window.__rerender(); });
await a.p.waitForTimeout(3500);
console.log('6 apagar vale na conta:', !nomes('rotinas').includes('Feita sem conexão'));
await a.p.reload({ waitUntil: 'load' }); await a.p.waitForTimeout(2500);
console.log('  depois de recarregar continua apagada:', await a.p.evaluate(() => !DB.rotinas.some((x) => x.id === 'r-off') && DB.rotinas.length === 3), await a.p.evaluate(() => DB.rotinas.length));
console.log('errs', JSON.stringify(a.errs.concat(bb.errs)));
await b.close();
