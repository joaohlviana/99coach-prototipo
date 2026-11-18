// Treinadores de outros países: "Todo o Brasil" mostra só quem está no Brasil; "Worldwide" mostra todos os países.
// Página pública /worldwide agrupa por país; 99coach.com leva ao mesmo endereço no .com.br.
// O catálogo de teste precisa ter linhas de fora do Brasil (colunas 11 = país, 12 = "Cidade, País").
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const fs = await import('node:fs');
const cat = JSON.parse(fs.readFileSync(new URL('../public/data/treinadores.json', import.meta.url), 'utf8'));
const fora = (cat.items || []).filter((r) => r[11]);
const B = 'http://localhost:5173';
if (!fora.length) { console.log('0 catálogo local sem treinadores de fora (rode npm run sync com acesso ao banco); pulando'); console.log('errs []'); process.exit(0); }
const um = fora[0], nome = um[1], local = um[12];
// o fetch do Node não deixa trocar o Host: usa o curl
const { execFileSync } = await import('node:child_process');
const r1 = execFileSync('curl', ['-s', '-o', '/dev/null', '-w', '%{http_code} %{redirect_url}', '-H', 'Host: www.99coach.com', B + '/treinadores/musculacao']).toString();
console.log('1 .com leva ao .com.br com o mesmo caminho:', r1 === '308 https://www.99coach.com.br/treinadores/musculacao');
const w = await (await fetch(B + '/worldwide')).text();
console.log('2 página Worldwide:', w.includes(nome), w.includes('Presencial em ' + local));
const sp = await (await fetch(B + '/treinadores/' + um[5][0])).text();
console.log('3 fora do Brasil não aparece na página do Brasil:', !sp.includes('/treinador/' + um[0] + '"'));

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
await ctx.route('**/rycaxboqkkiopjdecgld.supabase.co/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
await ctx.route('**/api/v1/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[]}' }));
const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 160)));
await p.goto(B + '/app', { waitUntil: 'load' }); await p.waitForTimeout(3500);
const res = await p.evaluate(([id]) => {
  const T = window.REAL && window.REAL.home(); const t = T && T.find((x) => x.id === id);
  const E = window.REAL && window.REAL.esporte(); const e = E && E.find((x) => x.id === id);
  const C = window.REAL && window.REAL.cities('', 'melbourne');
  return { city: t && t.city, langs: e && e.langs, fmts: e && e.fmts, cid: C && C[0] };
}, [um[0]]);
console.log('4 app lê cidade e país:', res.city === local, Array.isArray(res.langs) && res.langs.length === 0, (res.fmts || []).indexOf('Presencial') >= 0);
// home: sem cidade = Todo o Brasil (sem o de fora); Worldwide = com o de fora
const conta = async (city) => p.evaluate(([c, id]) => { const T = window.REAL.home(); const t = T.find((x) => x.id === id); const inCity = (tt) => !c ? /, [A-Z]{2}$/.test(tt.city || '') : c === 'MUNDO' ? !!tt.city : tt.city === c; return inCity(t); }, [city, um[0]]);
console.log('5 Todo o Brasil exclui, Worldwide inclui:', (await conta('')) === false, (await conta('MUNDO')) === true);
// abre o "Onde" da página inicial e escolhe Worldwide
await p.goto(B + '/', { waitUntil: 'load' }); await p.waitForTimeout(3500);
await p.evaluate(() => { const e = [...document.querySelectorAll('#app button.v4-qf')].find((x) => /Onde/.test(x.textContent)); if (e) e.click(); });
await p.waitForTimeout(800);
const temOpc = await p.evaluate(() => /Worldwide/.test(document.getElementById('app').innerText));
await p.evaluate(() => { const e = [...document.querySelectorAll('#app button, #app [role=option], #app li')].find((x) => /^Worldwide/.test(x.textContent.trim()) && x.offsetParent); if (e) e.click(); });
await p.waitForTimeout(1200);
const ck = await p.evaluate(() => document.cookie);
console.log('6 busca tem Worldwide e guarda a escolha:', temOpc, /c99_cidade=MUNDO/.test(ck));
console.log('errs', errs);
await b.close();
