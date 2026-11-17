// Perfil público: programa publicado aparece com o botão de compra; sem conta leva a entrar; com conta abre o pagamento (servidor simulado).
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const calls = [];
let slug = '';
await ctx.route('**/api/v1/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[]}' }));
await ctx.route('**/rycaxboqkkiopjdecgld.supabase.co/**', async (route) => {
  const rq = route.request(), u = new URL(rq.url());
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'content-type': 'application/json' };
  if (rq.method() === 'OPTIONS') return route.fulfill({ status: 200, headers: cors });
  const j = (d, s) => route.fulfill({ status: s || 200, headers: cors, body: JSON.stringify(d) });
  const path = u.pathname.replace('/rest/v1/', ''), q = decodeURIComponent(u.search);
  if (path === 'programs' && q.includes('trainers.slug=eq.' + slug) && q.includes('sale_enabled=is.true')) return j([{ id: 'P1', title: 'Força em 8 semanas', weeks: 8, workouts: 24, access_months: 6, price_cents: 19700, description: 'Base de força', trainers: { slug } }]);
  if (path === 'rpc/buy_program') { calls.push('buy'); return j({ outcome: 'aguardando_pagamento', order: 'O1', intent: '11111111-1111-1111-1111-111111111111', amountCents: 19700 }); }
  if (/functions\/v1\/pagamentos/.test(u.pathname)) { calls.push('checkout:' + JSON.parse(rq.postData() || '{}').intent); return j({ ok: true, url: 'http://localhost:5173/?pago=1' }); }
  return j([]);
});
const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 160)));
// pega um perfil publicado (não importado) do catálogo local
const fs = await import('node:fs');
const cat = JSON.parse(fs.readFileSync(new URL('../public/data/treinadores.json', import.meta.url), 'utf8'));
const rows = cat.items || cat.trainers || cat;
const pub = (Array.isArray(rows) ? rows : [])[0];
slug = Array.isArray(pub) ? pub[0] : (pub && (pub.slug || pub.id));
await p.goto('http://localhost:5173/treinador/' + slug, { waitUntil: 'load' }); await p.waitForTimeout(2000);
const txt = () => p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
let t = await txt();
const ok = /Força em 8 semanas/.test(t);
console.log('1 programa no perfil:', ok, /24 sessões · 8 semanas · acesso de 12 meses a partir da liberação/.test(t), /Comprar por R\$ 197,00/.test(t), '| perfil:', slug);
if (ok) {
  await p.click('.vfp-progs button'); await p.waitForTimeout(800);
  console.log('2 sem conta leva a entrar:', /onboarding-entrar/.test(p.url()), calls.length === 0);
  await p.evaluate(() => localStorage.setItem('c99.sessao', JSON.stringify({ access_token: 't', refresh_token: 'r', user: { id: 'al', email: 'al@x.com' } })));
  await p.goto('http://localhost:5173/treinador/' + slug, { waitUntil: 'load' }); await p.waitForTimeout(2000);
  await p.click('.vfp-progs button'); await p.waitForTimeout(1500);
  console.log('3 com conta abre o pagamento:', calls.join(','), /pago=1/.test(p.url()));
}
console.log('errs', errs);
await b.close();
