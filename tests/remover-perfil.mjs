// Remover perfil importado pela página do perfil: a opção já vem marcada, o pedido vai como "retirar" e,
// se o servidor pausou o perfil, a tela diz que ele saiu do site e ele some desta aba na hora.
import { readFileSync } from 'node:fs';
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const cat = JSON.parse(readFileSync(new URL('../public/data/treinadores.json', import.meta.url), 'utf8')).items;
const alvo = cat.find((x) => x[9] === 'importado' && x[10] && x[6])[0];
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const calls = [];
await ctx.route('**/rycaxboqkkiopjdecgld.supabase.co/**', (r) => { const u = r.request().url(), cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' };
  if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 200, headers: cors, body: '{}' });
  if (/rpc\/submit_removal_request/.test(u)) { calls.push(JSON.parse(r.request().postData())); return r.fulfill({ status: 200, headers: cors, body: JSON.stringify({ protocol: 'RM-T1', status: 'recebido', kind: 'retirar', repeated: false, paused: true }) }); }
  return r.fulfill({ status: 200, headers: cors, body: '[]' }); });
const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 160)));
await p.goto('http://localhost:5173/treinador/' + alvo, { waitUntil: 'load' }); await p.waitForTimeout(3500);
let t = await p.evaluate(() => document.getElementById('app').innerText.replace(/\s+/g, ' '));
console.log('1 caixa de contato:', /Fale com \S+/.test(t) && /Instagram/.test(t), '| sem linhas repetidas:', !/Instagram abre fora da 99Coach/.test(t), '| reivindicar:', (await p.locator('.vfp-crow[data-tip="Reivindique e acesse seu perfil"]').count()) === 1, '| remover:', /Remover este perfil/.test(t));
await p.evaluate(() => [...document.querySelectorAll('#app .vfp-crow button')].find((x) => x.innerText.trim() === 'Remover').click()); await p.waitForTimeout(1500);
console.log('2 abre a tela do pedido:', /#publico-perfilpedido-/.test(p.url()));
await p.fill('#app textarea', 'Não autorizo meus dados neste site.');
await p.evaluate(() => [...document.querySelectorAll('#app button')].find((x) => /^Enviar pedido/.test(x.innerText.trim())).click()); await p.waitForTimeout(1200);
t = await p.evaluate(() => document.getElementById('app').innerText.replace(/\s+/g, ' '));
console.log('3 pedido de remoção:', calls.length === 1 && calls[0].p_kind === 'retirar' && calls[0].p_slug === alvo, '| tela diz que saiu do site:', /Perfil removido do site/.test(t), '| some desta aba:', await p.evaluate((a) => !window.REAL.has(a), alvo));
console.log('errs', JSON.stringify(errs));
await b.close();
