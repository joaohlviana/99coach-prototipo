// Medição de uso: eventos do catálogo do plano, com nome versionado e sem dado pessoal; repetição na mesma aba não conta de novo.
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const b = await chromium.launch(); const ctx = await b.newContext();
const ev = [];
const PROIBIDO = ['principal_id', 'client_id', 'trainer_owner_id', 'role', 'consent', 'trusted', 'email', 'phone', 'name', 'message', 'health', 'raw_url', 'raw_query', 'latitude', 'longitude'];
await ctx.route('**/rycaxboqkkiopjdecgld.supabase.co/**', (r) => {
  const rq = r.request(), u = decodeURIComponent(rq.url());
  if (/funnel_events/.test(u) && rq.method() === 'POST') ev.push(JSON.parse(rq.postData() || '{}'));
  const m = /trainers\?select=slug,role_line.*slug=eq\.([a-z0-9-]+)/.exec(u);
  r.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' }, body: JSON.stringify(m ? [{ slug: m[1], origin: 'importado', status: 'publicado' }] : []) });
});
const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 160)));
await p.goto('http://localhost:5173/treinadores/judo', { waitUntil: 'load' }); await p.waitForTimeout(2000);
const imp0 = ev.filter((e) => e.event_name === 'showcase.card_impressed.v1').length;
await p.mouse.wheel(0, 900); await p.waitForTimeout(1200);
await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1500);
const imp = ev.filter((e) => e.event_name === 'showcase.card_impressed.v1');
console.log('1b cartões vistos só quando aparecem na tela (uma vez cada, com posição):', imp0 === 0, imp.length > 0, new Set(imp.map((e) => e.properties.trainer_slug)).size === imp.length, imp.every((e) => e.properties.position >= 1));
const busca = ev.filter((e) => e.event_name === 'catalog.search_performed.v1');
console.log('1 busca registrada uma vez por combinação:', busca.length === 1, busca[0] && busca[0].properties.sport);
await p.goto('http://localhost:5173/treinador/abner-braganca-vila-velha-es', { waitUntil: 'load' }); await p.waitForTimeout(2000);
const vis = ev.filter((e) => e.event_name === 'trainer.profile_viewed.v1');
console.log('2 perfil aberto registrado uma vez:', vis.length === 1, vis[0] && vis[0].properties.trainer_slug);
const bad = ev.filter((e) => !/^[a-z_]+\.[a-z_]+\.v\d+$/.test(e.event_name) || Object.keys(e.properties || {}).some((k) => PROIBIDO.includes(k)));
console.log('3 nomes versionados e sem dado pessoal:', ev.length > 0 && bad.length === 0, ev.map((e) => e.event_name).join(','));
// 4. treinador retoma o cadastro pelo painel
await p.goto('http://localhost:5173/', { waitUntil: 'load' }); await p.waitForTimeout(500);
await p.evaluate(() => { const C = PAGES.onboarding.Comp; STORE.saveOnb(Object.assign(C.prototype.base.call(C.prototype, 'treinador', ''), { name: 'Marina Duarte', city: 'Londrina, PR', dadosSaved: true, step: 'hoje', scn: '' })); GO('@onboarding', { flow: 'treinador' }); });
await p.waitForTimeout(1200);
for (const h of await p.$$('button')) { if (/^Continuar cadastro$/.test((await h.textContent()).trim()) && (await h.isVisible())) { await h.click(); break; } }
await p.waitForTimeout(600);
const res = ev.filter((e) => e.event_name === 'onboarding.resume_clicked.v1');
console.log('4 retomar cadastro registrado:', res.length === 1, res[0] && res[0].properties.sections_done > 0);
console.log('errs', errs);
await b.close();
