// PostHog: sem a chave do projeto nada carrega; com a chave, carrega do endereço dos EUA, não grava nada no aparelho,
// recebe os eventos de uso e reconhece a conta aberta só pelo id.
import { createRequire } from 'node:module';
const { chromium } = createRequire('/')(process.env.PW);
const B = process.env.BASE || 'http://localhost:5173';
let falhas = 0; const ok = (n, v, x) => { if (!v) falhas++; console.log((v ? 'ok ' : 'false ') + n + (v ? '' : ' :: ' + JSON.stringify(x))); };
const b = await chromium.launch();
const novo = async (chave, sessao) => {
  const c = await b.newContext({ viewport: { width: 1280, height: 900 } }); const pedidos = [];
  await c.route('**/rycaxboqkkiopjdecgld.supabase.co/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await c.route('**/*posthog.com/**', (r) => { pedidos.push(r.request().url()); r.fulfill({ status: 200, contentType: 'application/javascript', body: '/* cópia de teste */' }); });
  if (chave) await c.addInitScript((k) => { window.__PH = k; }, chave);
  if (sessao) await c.addInitScript((s) => { try { localStorage.setItem('c99.sessao', JSON.stringify(s)); } catch (_) {} }, sessao);
  const p = await c.newPage(); const erros = []; p.on('pageerror', (e) => erros.push(e.message)); p.on('console', (m) => { if (m.type() === 'error' && /Content Security Policy/i.test(m.text())) erros.push(m.text()); });
  return { c, p, pedidos, erros };
};
// sem chave
let t = await novo('');
await t.p.goto(B + '/', { waitUntil: 'load' }); await t.p.waitForTimeout(2500);
ok('sem chave: nada do PostHog é pedido', t.pedidos.length === 0, t.pedidos);
ok('sem chave: não existe window.posthog', await t.p.evaluate(() => typeof window.posthog === 'undefined'));
await t.c.close();
// com chave
t = await novo('phc_teste');
const r = await t.p.goto(B + '/', { waitUntil: 'load' }); await t.p.waitForFunction(() => window.TRACK, null, { timeout: 20000 }); await t.p.waitForTimeout(1500);
const csp = r.headers()['content-security-policy'] || '';
ok('política de segurança libera o PostHog dos EUA', /script-src[^;]*https:\/\/us-assets\.i\.posthog\.com/.test(csp) && /connect-src[^;]*https:\/\/us\.i\.posthog\.com/.test(csp), csp.slice(0, 200));
ok('com chave: carrega a biblioteca do endereço dos EUA', t.pedidos.some((u) => u === 'https://us-assets.i.posthog.com/static/array.js'), t.pedidos);
ok('sem bloqueio da política de segurança nem erro na página', t.erros.length === 0, t.erros);
const cfg = await t.p.evaluate(() => window.posthog._i[0]);
ok('configuração: chave, sem gravar no aparelho, sem gravação de tela', cfg[0] === 'phc_teste' && cfg[1].persistence === 'memory' && cfg[1].disable_session_recording === true && cfg[1].person_profiles === 'identified_only' && cfg[1].api_host === 'https://us.i.posthog.com', cfg);
await t.p.evaluate(() => window.TRACK('teste.evento', { a: 1 }));
ok('evento de uso vai também para o PostHog', await t.p.evaluate(() => window.posthog.some((x) => x[0] === 'capture' && x[1] === 'teste.evento' && x[2].a === 1)));
ok('nada do PostHog gravado no aparelho', await t.p.evaluate(() => !/ph_/.test(document.cookie) && !Object.keys(localStorage).some((k) => /^ph_|posthog/i.test(k)) && !Object.keys(sessionStorage).some((k) => /^ph_|posthog/i.test(k))));
await t.c.close();
// demonstração não mede
t = await novo('phc_teste');
await t.p.goto(B + '/?demo=1', { waitUntil: 'load' }); await t.p.waitForTimeout(2000);
ok('demonstração: nada do PostHog é pedido', t.pedidos.length === 0, t.pedidos);
await t.c.close(); await b.close();
console.log(falhas ? '!! ' + falhas + ' falha(s)' : 'posthog: tudo certo'); process.exit(falhas ? 1 : 0);
