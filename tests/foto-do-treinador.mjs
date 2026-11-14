// Foto do treinador: com autorização marcada, a imagem é reduzida e enviada à pasta da própria conta, e o perfil grava o endereço (servidor simulado).
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const b = await chromium.launch(); const ctx = await b.newContext();
const srv = { up: [], patch: null };
await ctx.route('**/api/v1/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[]}' }));
await ctx.route('**/rycaxboqkkiopjdecgld.supabase.co/**', async (route) => {
  const rq = route.request(), u = new URL(rq.url());
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'content-type': 'application/json' };
  if (rq.method() === 'OPTIONS') return route.fulfill({ status: 200, headers: cors });
  const j = (d) => route.fulfill({ status: 200, headers: cors, body: JSON.stringify(d) });
  if (/\/storage\/v1\/object\/trainer-photos\//.test(u.pathname)) { srv.up.push({ path: decodeURIComponent(u.pathname.split('/trainer-photos/')[1]), type: rq.headers()['content-type'] }); return j({ Key: 'ok' }); }
  const path = u.pathname.replace('/rest/v1/', '');
  if (path === 'trainers' && rq.method() === 'GET') return j([{ id: 'T1', slug: 'marina' }]);
  if (path === 'trainers' && rq.method() === 'PATCH') { srv.patch = JSON.parse(rq.postData() || '{}'); return j([]); }
  return j([]);
});
const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 160)));
await p.goto('http://localhost:5173/', { waitUntil: 'load' }); await p.waitForTimeout(500);
await p.evaluate(() => localStorage.setItem('c99.sessao', JSON.stringify({ access_token: 't', refresh_token: 'r', user: { id: 'u-123', email: 'tr@x.com' } })));
await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1200);
const res = await p.evaluate(async () => {
  const cv = document.createElement('canvas'); cv.width = 1600; cv.height = 1200; const g = cv.getContext('2d'); g.fillStyle = '#c33'; g.fillRect(0, 0, 1600, 1200);
  const data = cv.toDataURL('image/png');
  const base = { name: 'Marina Duarte', city: '', sports: {}, regions: {}, langs: {}, pres: false, onl: true };
  const sem = await window.CONTA.saveTrainer(Object.assign({}, base, { photoUrl: data, photoOk: false }));
  const semAut = window.__lastPatchHasPhoto;
  const com = await window.CONTA.saveTrainer(Object.assign({}, base, { photoUrl: data, photoOk: true }));
  return { sem: sem.ok, com: com.ok };
});
console.log('1 salvou:', res.sem, res.com);
console.log('  sem autorização não envia; com autorização envia uma vez:', srv.up.length === 1);
console.log('  na pasta da própria conta, em JPEG:', !!srv.up[0] && /^u-123\/[a-z0-9]+\.jpg$/.test(srv.up[0].path), srv.up[0] && srv.up[0].type);
console.log('  perfil grava o endereço público:', !!srv.patch && /\/storage\/v1\/object\/public\/trainer-photos\/u-123\//.test(srv.patch.photo_url || ''));
await p.evaluate(async () => { await window.CONTA.saveTrainer({ name: 'Marina Duarte', city: '', sports: {}, regions: {}, langs: {}, pres: false, onl: true, photoUrl: '', photoOk: false, photoRemoved: true }); });
console.log('2 remover a foto limpa no servidor:', srv.patch && srv.patch.photo_url === null);
console.log('errs', errs);
await b.close();
