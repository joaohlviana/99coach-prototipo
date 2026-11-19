// Cadastro do treinador: Enter envia; os erros aparecem todos de uma vez, cada um no seu campo; nenhuma modalidade vem
// marcada; a cidade vem da base real (municípios do Brasil; fora do Brasil, país + cidade da base GeoNames) e é o que
// vai para o servidor (nome + UF, ou país + "Cidade, País").
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const reqs = [];
await ctx.route('**/rycaxboqkkiopjdecgld.supabase.co/**', async (r) => {
  const q = r.request(), u = q.url().replace(/^https:\/\/[^/]+/, ''), body = q.postData() || ''; reqs.push([q.method(), u, body]);
  const j = (d) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(d) });
  if (/\/auth\/v1\/signup/.test(u)) return j({ access_token: 'tok', refresh_token: 'ref', user: { id: '11111111-1111-4111-8111-111111111111', email: JSON.parse(body).email, user_metadata: {} } });
  if (/\/auth\/v1\/user/.test(u)) return j({ id: '11111111-1111-4111-8111-111111111111', email: 'a@b.co', user_metadata: {}, factors: [] });
  if (/rpc\/ensure_city/.test(u)) return j(4242);
  if (/\/rest\/v1\/rpc\//.test(u)) return j(null);
  if (/\/rest\/v1\/trainers/.test(u) && q.method() === 'POST') return r.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify([{ id: 't1', slug: 'teste' }]) });
  return j([]);
});
await ctx.route('**/api/v1/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[]}' }));
const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 200)));
const txt = () => p.evaluate(() => document.getElementById('app').innerText.replace(/\s+/g, ' '));
const clicar = (re) => p.evaluate((s) => { const r = new RegExp(s, 'i'); const el = [...document.querySelectorAll('#app button, #app [role=option]')].find((x) => r.test(x.textContent.trim()) && x.offsetParent); if (el) el.click(); return !!el; }, re.source);
await p.goto('http://localhost:5173/app#onboarding-treinador', { waitUntil: 'load' }); await p.waitForTimeout(4000);
let t = await txt();
console.log('1 conta sem "passo 1 de 3" repetido:', /criar conta/i.test(t), !/passo 1 de 3/i.test(t));
await p.focus('#onb-email'); await p.keyboard.press('Enter'); await p.waitForTimeout(400); t = await txt();
const inv = await p.evaluate(() => ['onb-nome', 'onb-email', 'onb-senha'].map((i) => document.getElementById(i).getAttribute('aria-invalid')).join(','));
console.log('2 Enter envia e mostra todos os erros:', /Informe seu nome/.test(t), /e-mail válido/.test(t), /confirme que tem 18 anos/.test(t), inv === 'true,true,true', await p.evaluate(() => document.activeElement.id) === 'onb-nome');
await p.fill('#onb-nome', 'Teste da Silva'); await p.fill('#onb-email', 'novo@teste.com'); await p.fill('#onb-senha', 'senha-forte-123');
await clicar(/^Mostrar$/); console.log('3 mostrar senha:', await p.evaluate(() => document.getElementById('onb-senha').type) === 'text');
await p.evaluate(() => document.querySelector('#app [role=checkbox]').click()); await p.focus('#onb-senha'); await p.keyboard.press('Enter'); await p.waitForTimeout(2500);
t = await txt();
console.log('4 conta criada com Enter, idioma gravado:', /O QUE VOCÊ TREINA/i.test(t), reqs.some((x) => /signup/.test(x[1]) && /"lang":"pt"/.test(x[2])));
console.log('5 nenhuma modalidade pré-escolhida:', await p.evaluate(() => [...document.querySelectorAll('#app .cv [aria-pressed="true"], #app .cv .is-on')].filter((x) => /CrossFit|Musculação/.test(x.textContent)).length) === 0);
// cidade real fora das capitais, com homônimo em outro estado
await p.click('#cv-city'); await p.type('#cv-city', 'Cascavel', { delay: 15 }); await p.waitForTimeout(600);
const ops = await p.evaluate(() => [...document.querySelectorAll('#cv-list [role=option]')].map((x) => x.textContent.replace(/\s+/g, ' ').trim()));
console.log('6 base de municípios (Cascavel PR e CE):', ops.some((x) => /Cascavel.*PR/.test(x)) && ops.some((x) => /Cascavel.*CE/.test(x)), !/treinadores de .* já atendem aqui/.test(ops.join(' ')));
await p.evaluate(() => [...document.querySelectorAll('#cv-list [role=option]')].find((x) => /CE$/.test(x.textContent.trim())).click()); await p.waitForTimeout(400);
t = await txt(); console.log('  escolhida com a UF, sem bairro de Londrina:', /Cascavel, CE/.test(t), !/Gleba Palhano/.test(t));
await clicar(/^Musculação$/); await clicar(/Salvar e continuar/); await p.waitForTimeout(2500);
// publica o rascunho no servidor? o cadastro grava ao salvar seções; força a gravação
await p.evaluate(() => { const st = window.STORE.loadOnb('treinador'); return window.CONTA.saveTrainer(st); }); await p.waitForTimeout(800);
const ec = reqs.find((x) => /rpc\/ensure_city/.test(x[1])), tr = reqs.filter((x) => /\/rest\/v1\/trainers/.test(x[1]) && /POST|PATCH/.test(x[0])).pop();
console.log('7 servidor recebe nome + UF e o id da cidade:', !!ec && /"p_name":"Cascavel"/.test(ec[2]) && /"p_uf":"CE"/.test(ec[2]), !!tr && /"city_id":4242/.test(tr[2]) && /"country":null/.test(tr[2]));
// fora do Brasil
await p.evaluate(() => { const C = window.PAGES.onboarding.Comp; const st = Object.assign(window.STORE.loadOnb('treinador'), { step: 'dados', city: '', pais: '', regions: {} }); window.STORE.saveOnb(st); window.NAV.go('onboarding', { flow: 'treinador' }, null); }); await p.waitForTimeout(1200);
await p.click('#cv-city'); await p.waitForTimeout(300); await clicar(/Atendo fora do Brasil/); await p.waitForTimeout(400);
await p.selectOption('#cv-pais', 'US'); await p.waitForTimeout(1500);
await p.fill('#cv-cid-fora', 'Cidade Que Nao Existe'); await clicar(/Usar esta cidade/); await p.waitForTimeout(300); t = await txt();
const recusa = /Escolha uma cidade da lista/.test(t);
await p.fill('#cv-cid-fora', 'miami'); await p.waitForTimeout(300);
const lista = await p.evaluate(() => [...document.querySelectorAll('#cv-fora-lista option')].map((o) => o.value));
await clicar(/Usar esta cidade/); await p.waitForTimeout(400); t = await txt();
console.log('8 fora do Brasil só com cidade da base:', recusa, lista.some((x) => /^Miami/.test(x)), /Miami, Estados Unidos/.test(t));
await p.evaluate(() => window.CONTA.saveTrainer(window.STORE.loadOnb('treinador'))); await p.waitForTimeout(800);
const tr2 = reqs.filter((x) => /\/rest\/v1\/trainers/.test(x[1]) && /POST|PATCH/.test(x[0])).pop();
console.log('9 servidor recebe país e local:', !!tr2 && /"country":"US"/.test(tr2[2]) && /"locality":"Miami, Estados Unidos"/.test(tr2[2]) && /"city_id":null/.test(tr2[2]));
console.log('errs', errs);
await b.close();
