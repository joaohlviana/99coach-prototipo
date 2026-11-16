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
  if (/trainers\?select=slug,role_line/.test(u)) return route.fulfill({ status: 200, headers: cors, body: JSON.stringify([{ slug, role_line: 'Treinador', pitch: 'Teste', bio: '', origin: 'demonstracao', availability: 'aceita', cref: 'CREF 000000-G/PR', cref_status: 'verificado', offers: [{ title: 'Acompanhamento online', price_cents: 24900, unit: 'mes', status: 'publicada', headline: true, sort: 1 }], reviews: [{ author_name: 'Caio P.', rating: 5, body: 'Treinos bem explicados.', period: 'Outubro de 2026', created_at: '2026-11-01T10:00:00Z', reply: null }] }]) });
  if (/trainers\?select=slug,name,initials/.test(u) && u.includes('slug.eq.' + slug)) return route.fulfill({ status: 200, headers: cors, body: JSON.stringify([{ slug, name: 'Diego Moraes (teste)', initials: 'DM', photo_url: 'http://localhost:5173/img/og-99coach.png', specialty: 'Musculação', formats: ['presencial', 'online'], published_at: '2026-10-16', cities: { name: 'Londrina', uf: 'PR' }, trainer_sports: [{ sport_slug: 'musculacao' }], offers: [{ title: 'Acompanhamento online', price_cents: 24900, unit: 'mes', status: 'publicada', headline: true }] }]) });
  return route.fulfill({ status: 200, headers: cors, body: '[]' });
});
const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 160)));
await p.goto('http://localhost:5173/treinador/' + slug, { waitUntil: 'load' }); await p.waitForTimeout(2500);
const t = await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
console.log('1 aviso de perfil de teste:', /Perfil de teste/.test(t), /Dados inventados/.test(t));
const lista = pedidos.filter((u) => /trainers\?select=slug,name,initials/.test(u));
console.log('2 no próprio perfil o app busca o perfil de teste:', lista.length > 0 && lista.every((u) => u.includes('and(origin.eq.demonstracao,slug.eq.' + slug + ')')));
console.log('3 perfil de teste completo no app:', /Diego Moraes \(teste\)/i.test(t), /Treinos bem explicados/.test(t), /CREF verificado/i.test(t), /R\$ 249/.test(t), await p.evaluate(() => !!document.querySelector('#app img.pf-avatar')));
pedidos.length = 0;
await p.goto('http://localhost:5173/treinadores/musculacao', { waitUntil: 'load' }); await p.waitForTimeout(2000);
const l2 = pedidos.filter((u) => /trainers\?select=slug,name,initials/.test(u));
console.log('4 nas listas só perfis de cadastro:', l2.length > 0 && l2.every((u) => /[?&]origin=eq\.cadastro/.test(u) && !/demonstracao/.test(u)));
// 5. sem troca de tela: a versão do servidor nunca fica visível enquanto o app carrega
const p2 = await ctx.newPage(); const visto = [];
await p2.addInitScript(() => { window.__vis = []; const tick = () => { const e = document.getElementById('ssr'); if (e) { const c = getComputedStyle(e); window.__vis.push(c.display !== 'none' && c.visibility !== 'hidden'); } requestAnimationFrame(tick); }; requestAnimationFrame(tick); });
await p2.goto('http://localhost:5173/treinador/' + slug, { waitUntil: 'load' }); await p2.waitForTimeout(2000);
const vis = await p2.evaluate(() => window.__vis);
console.log('5 sem troca de tela ao carregar:', vis.length > 5, vis.every((v) => v === false), await p2.evaluate(() => document.documentElement.classList.contains('app-on')));
console.log('errs', errs);
await b.close();
