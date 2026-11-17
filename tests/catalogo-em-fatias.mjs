// Página de modalidade e perfil baixam só a fatia do catálogo de que precisam, não o arquivo inteiro; a página inicial segue com o catálogo completo.
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const b = await chromium.launch();
const run = async (url, toque) => {
  const ctx = await b.newContext(); const got = [];
  // o banco responde que o perfil existe (importado), como no real; o resto vem vazio
  await ctx.route('**/rycaxboqkkiopjdecgld.supabase.co/**', (r) => { const u = decodeURIComponent(r.request().url()); const m = /trainers\?select=slug,role_line.*slug=eq\.([a-z0-9-]+)/.exec(u);
    r.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*', 'content-type': 'application/json' }, body: JSON.stringify(m ? [{ slug: m[1], origin: 'importado', status: 'publicado' }] : []) }); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 160)));
  p.on('request', (q) => { const u = q.url(); if (/treinadores\.json|\/dados\//.test(u)) got.push(u.replace('http://localhost:5173', '')); });
  await p.goto('http://localhost:5173' + url, { waitUntil: 'load' }); await p.waitForTimeout(2500);
  const cedo = got.slice(); if (toque) { await p.mouse.move(40, 300); await p.mouse.down(); await p.mouse.up(); await p.waitForTimeout(1500); }
  const t = await p.evaluate(() => document.getElementById('app') ? document.getElementById('app').innerText.replace(/\s+/g, ' ') : '');
  await ctx.close(); return { got, t, errs, cedo };
};
let r = await run('/treinadores/judo');
console.log('1 modalidade: só a fatia:', r.got.some((u) => /\/dados\/esporte\/judo/.test(u)), !r.got.some((u) => /treinadores\.json/.test(u)), '| mostra profissionais:', /Judô|Judo/i.test(r.t) && !/Nenhum profissional/.test(r.t), r.errs.length === 0);
r = await run('/treinador/abner-braganca-vila-velha-es');
console.log('2 perfil: só a fatia:', r.got.some((u) => /\/dados\/treinador\//.test(u)), !r.got.some((u) => /treinadores\.json/.test(u)), '| mostra o nome:', /Abner/.test(r.t), r.errs.length === 0);
r = await run('/', true);
// o catálogo inteiro espera o topo aparecer: não vem nos primeiros instantes, vem no primeiro toque
console.log('3 página inicial usa o catálogo completo:', r.got.some((u) => /treinadores\.json/.test(u)), '| só depois do topo:', !r.cedo.some((u) => /treinadores\.json/.test(u)));
await b.close();
