// Perfil de demonstração (origin = demonstracao): mostra o aviso "Perfil de teste" e fica fora da lista do app.
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const fs = await import('node:fs');
const cat = JSON.parse(fs.readFileSync(new URL('../public/data/treinadores.json', import.meta.url), 'utf8'));
const slug = cat.items[0][0]; const pedidos = [];
await ctx.route('**/api/v1/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[]}' }));
await ctx.route('**/rycaxboqkkiopjdecgld.supabase.co/**', (route) => {
  const rq = route.request(), u = decodeURIComponent(rq.url()); pedidos.push(u);
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' };
  if (rq.method() === 'OPTIONS') return route.fulfill({ status: 200, headers: cors });
  if (/trainers\?select=slug,role_line/.test(u)) return route.fulfill({ status: 200, headers: cors, body: JSON.stringify([{ slug, role_line: 'Treinador', pitch: 'Teste', bio: '', origin: 'demonstracao', availability: 'aceita', offers: [], reviews: [] }]) });
  return route.fulfill({ status: 200, headers: cors, body: '[]' });
});
const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 160)));
await p.goto('http://localhost:5173/treinador/' + slug, { waitUntil: 'load' }); await p.waitForTimeout(2500);
const t = await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
console.log('1 aviso de perfil de teste:', /Perfil de teste/.test(t), /Dados inventados/.test(t));
const lista = pedidos.filter((u) => /trainers\?select=slug,name,initials/.test(u));
console.log('2 lista do app só pede perfis de cadastro:', lista.every((u) => /origin=eq\.cadastro/.test(u)));
console.log('errs', errs);
await b.close();
