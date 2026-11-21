// Bateria de buscas: o que a pessoa digita (cidade, estado, país, modalidade, nome) e o que a lista mostra,
// conferido contra o catálogo lido direto do arquivo, sem passar pelo código do app.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const { chromium } = createRequire('/')(process.env.PW);
const B = process.env.BASE || 'http://localhost:5173';
let falhas = 0, feitos = 0; const ok = (n, v, x) => { feitos++; if (!v) falhas++; console.log((v ? 'ok ' : 'false ') + n + (v ? '' : ' :: ' + JSON.stringify(x))); };
const CAT = JSON.parse(readFileSync(new URL('../public/data/treinadores.json', import.meta.url), 'utf8')).items;
const sem = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const b = await chromium.launch();
const novo = async (w, h) => { const c = await b.newContext({ viewport: { width: w, height: h } }); await c.route('**/rycaxboqkkiopjdecgld.supabase.co/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' })); const p = await c.newPage(); p.on('pageerror', (e) => { falhas++; console.log('false erro na página :: ' + e.message.slice(0, 160)); }); return [c, p]; };
const pronto = (p) => p.waitForFunction(() => window.REAL && window.REAL.status && window.REAL.status().inteiro, null, { timeout: 30000 });

// ---------- 1. o que a busca sugere enquanto a pessoa digita (celular) ----------
let [c, p] = await novo(390, 844);
await p.goto(B + '/', { waitUntil: 'load' }); await p.waitForFunction(() => window.REAL && window.REAL.ensure, null, { timeout: 20000 }); await p.evaluate(() => window.REAL.ensure()); await pronto(p);
await p.evaluate(() => document.querySelector('#app .vfm-qtx').click()); await p.waitForTimeout(600);
const campo = () => p.locator('#app input:visible').last();
const linhas = () => p.evaluate(() => [...document.querySelectorAll('#app .sx-row')].filter((x) => x.offsetParent).map((x) => x.textContent.replace(/\s+/g, ' ').trim()));
const digita = async (q) => { await campo().fill(''); await campo().type(q, { delay: 5 }); await p.waitForTimeout(450); return linhas(); };
const LUGARES = [
  ['sao paulo', /^São Paulo, SP ?Cidade( · [\d.]+ treinador(es)?)?$/], ['São Paulo', /^São Paulo, SP ?Cidade( · [\d.]+ treinador(es)?)?$/], ['SAO PAULO', /^São Paulo, SP ?Cidade( · [\d.]+ treinador(es)?)?$/], ['  sao paulo  ', /^São Paulo, SP ?Cidade( · [\d.]+ treinador(es)?)?$/],
  ['londrina', /^Londrina, PR ?Cidade( · [\d.]+ treinador(es)?)?$/], ['curitiba', /^Curitiba, PR ?Cidade( · [\d.]+ treinador(es)?)?$/], ['rio de janeiro', /^Rio de Janeiro, RJ ?Cidade( · [\d.]+ treinador(es)?)?$/], ['belo horizonte', /^Belo Horizonte, MG ?Cidade( · [\d.]+ treinador(es)?)?$/],
  ['brasilia', /^Brasília, DF ?Cidade( · [\d.]+ treinador(es)?)?$/], ['goiania', /^Goiânia, GO ?Cidade( · [\d.]+ treinador(es)?)?$/], ['recife', /^Recife, PE ?Cidade( · [\d.]+ treinador(es)?)?$/], ['campinas', /^Campinas, SP ?Cidade( · [\d.]+ treinador(es)?)?$/],
  ['miami', /^Miami, Estados Unidos ?Cidade( · \d+ treinador(es)?)?$/], ['dallas', /^Dallas, Estados Unidos ?Cidade( · \d+ treinador(es)?)?$/],
  ['eua', /^Estados Unidos ?País · \d+ treinador/], ['usa', /^Estados Unidos ?País/], ['estados unidos', /^Estados Unidos ?País/], ['united states', /^Estados Unidos ?País/],
  ['portugal', /^Portugal ?País/], ['reino unido', /^Reino Unido ?País/], ['uk', /^Reino Unido ?País/], ['inglaterra', /^Reino Unido ?País/], ['espanha', /^Espanha ?País/], ['africa do sul', /^África do Sul ?País/],
];
for (const [q, re] of LUGARES) { const l = await digita(q); ok('digitar "' + q + '" oferece o lugar', l.some((t) => re.test(t)), l.slice(0, 4)); }
const MODS = [['crossfit', /^CrossFit/], ['musculacao', /^Musculação/], ['musculação', /^Musculação/], ['yoga', /^Yoga/], ['pilates', /^Pilates/], ['corrida', /^Corrida/], ['funcional', /^Funcional/], ['jiu jitsu', /^Jiu-?jitsu/i], ['muay thai', /^Muay Thai/i], ['natacao', /^Natação/]];
for (const [q, re] of MODS) { const l = await digita(q); ok('digitar "' + q + '" oferece a modalidade', l.some((t) => re.test(t)), l.slice(0, 4)); }
// nomes de quem está no catálogo: o primeiro, um do meio e os de fora
const NOMES = [CAT[0], CAT[40], CAT[4000], CAT.find((x) => x[11] === 'US'), CAT.find((x) => x[11] === 'GB'), CAT.find((x) => x[11] === 'PT')].filter(Boolean);
for (const r of NOMES) { const l = await digita(r[1]); ok('digitar o nome "' + r[1] + '" acha o perfil', l.some((t) => sem(t).indexOf(sem(r[1])) >= 0), l.slice(0, 4)); }
{ const l = await digita('zzqxw'); ok('texto sem sentido não inventa resultado', l.length === 0, l.slice(0, 3)); }
{ const r = CAT.find((x) => x[11] === 'US' && /Miami/.test(x[12])); const l = await digita(r[1].split(' ')[0] + ' miami'); ok('nome + cidade ("' + r[1].split(' ')[0] + ' miami") acha o perfil', l.some((t) => sem(t).indexOf(sem(r[1])) >= 0), l.slice(0, 4)); }
await c.close();

// ---------- 2. a lista: quantidade e ordem para modalidade × lugar × formato (computador) ----------
[c, p] = await novo(1400, 900);
await p.goto(B + '/treinadores/musculacao', { waitUntil: 'load' }); await p.waitForFunction(() => window.REAL && window.REAL.ensure && window.NAV, null, { timeout: 20000 }); await p.evaluate(() => window.REAL.ensure()); await pronto(p);
const TODOS = 'Todos os esportes';
const slugs = await p.evaluate(() => Object.fromEntries(window.SPORTS.list.map((x) => [x.label, x.slug])));
// modalidades que contam também para outra (triatlo aparece em Corrida, Natação e Ciclismo)
const APELIDO = { triatlo: ['corrida', 'natacao', 'ciclismo'], hidroginastica: ['natacao'], ballet: ['danca'], futsal: ['futebol'], 'volei-de-praia': ['volei'] };
const pratica = (r, mod) => (r[5] || []).some((x) => x === slugs[mod] || (APELIDO[x] || []).indexOf(slugs[mod]) >= 0);
const lugarDe = (r) => r[6] || r[12] || '';
const noLugar = (r, L) => { const tc = lugarDe(r); return !L ? (!tc || /, [A-Z]{2}$/.test(tc)) : L === 'MUNDO' ? true : /^PAIS:/.test(L) ? r[11] === L.slice(5) : /^UF:/.test(L) ? tc.slice(-4) === ', ' + L.slice(3) : tc === L; };
const espera = (mod, L, fmt) => CAT.filter((r) => {
  if (mod !== TODOS && !pratica(r, mod)) return false;
  const pres = /p/.test(r[7] || '') && noLugar(r, L), onl = /o/.test(r[7] || '');
  if (fmt === 'Presencial') return pres; if (fmt === 'Online') return onl;
  return pres || onl || (!lugarDe(r) && (!L || L === 'MUNDO'));
}).length;
const daqui = (mod, L) => CAT.filter((r) => (mod === TODOS || pratica(r, mod)) && /p/.test(r[7] || '') && noLugar(r, L)).length;
const le = () => p.evaluate(() => { const t = document.getElementById('app').innerText.replace(/\s+/g, ' '); const m = /([\d.]+) treinador(?:es)? de /.exec(t); return { n: m ? Number(m[1].replace(/\./g, '')) : (/Nenhum|nenhum/.test(t) ? 0 : -1), metas: [...document.querySelectorAll('#lista .vf-tc')].map((x) => ((x.querySelector('.vf-meta') || {}).textContent || '').trim()) }; });
const vai = async (mod, L, fmt) => { await p.evaluate(([m, l, f]) => window.NAV.go('esporte', { mod: m, city: l, fmt: f }, null), [mod, L, fmt]); await p.waitForTimeout(700); await p.waitForFunction(() => !document.querySelector('#lista .vf-sk'), null, { timeout: 15000 }).catch(() => {}); return le(); };
const curto = (L) => L.replace(/^PAIS:US$/, 'Estados Unidos').replace(/^PAIS:GB$/, 'Reino Unido').replace(/^PAIS:PT$/, 'Portugal').replace(/^UF:/, ', ');
const COMBOS = [
  [TODOS, '', 'Qualquer'], [TODOS, 'MUNDO', 'Qualquer'], [TODOS, 'UF:PR', 'Qualquer'], [TODOS, 'UF:SP', 'Qualquer'], [TODOS, 'São Paulo, SP', 'Qualquer'], [TODOS, 'Londrina, PR', 'Qualquer'],
  [TODOS, 'PAIS:US', 'Qualquer'], [TODOS, 'Miami, Estados Unidos', 'Qualquer'], [TODOS, 'PAIS:GB', 'Qualquer'], [TODOS, 'PAIS:PT', 'Qualquer'],
  ['Musculação', '', 'Qualquer'], ['Musculação', 'MUNDO', 'Qualquer'], ['Musculação', 'São Paulo, SP', 'Qualquer'], ['Musculação', 'Curitiba, PR', 'Qualquer'], ['Musculação', 'UF:RJ', 'Qualquer'],
  ['Musculação', 'PAIS:US', 'Qualquer'], ['Musculação', 'Miami, Estados Unidos', 'Qualquer'], ['Musculação', 'Dallas, Estados Unidos', 'Qualquer'],
  ['Funcional', 'Londrina, PR', 'Qualquer'], ['Funcional', 'UF:PR', 'Qualquer'], ['Pilates', 'Rio de Janeiro, RJ', 'Qualquer'], ['Pilates', 'PAIS:US', 'Qualquer'], ['Corrida', 'São Paulo, SP', 'Qualquer'], ['Corrida', 'MUNDO', 'Qualquer'],
  ['Yoga', 'PAIS:US', 'Qualquer'], ['Yoga', 'Miami, Estados Unidos', 'Qualquer'], ['CrossFit', 'PAIS:US', 'Qualquer'], ['CrossFit', 'Londrina, PR', 'Qualquer'],
  ['Musculação', 'São Paulo, SP', 'Presencial'], ['Musculação', 'Miami, Estados Unidos', 'Presencial'], [TODOS, 'PAIS:US', 'Presencial'], ['Musculação', '', 'Online'], ['Pilates', 'Londrina, PR', 'Presencial'], [TODOS, 'UF:PR', 'Presencial'],
];
for (const [mod, L, fmt] of COMBOS) {
  const nome = mod + ' · ' + (L || 'Brasil') + ' · ' + fmt, e = espera(mod, L, fmt), r = await vai(mod, L, fmt);
  ok(nome + ': quantidade ' + e, r.n === e, { tela: r.n, catalogo: e, url: p.url().replace(B, '') });
  if (L && L !== 'MUNDO' && fmt === 'Qualquer' && e > 0) {
    const k = Math.min(daqui(mod, L), r.metas.length), re = /^PAIS:/.test(L) ? new RegExp(curto(L)) : /^UF:/.test(L) ? new RegExp(curto(L) + '$') : new RegExp(L.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    ok(nome + ': os ' + k + ' primeiros são do lugar', r.metas.slice(0, k).every((t) => /^Presencial/.test(t) && re.test(t)), r.metas.slice(0, Math.max(k, 3)));
  }
}
// o endereço de cada busca abre a mesma lista ao recarregar
for (const [mod, L, F] of [['Musculação', 'São Paulo, SP'], ['Musculação', 'Miami, Estados Unidos'], ['Pilates', 'PAIS:US'], ['Funcional', 'UF:PR'], ['Corrida', 'MUNDO'], ['Yoga', ''], ['Musculação', 'Londrina, PR', 'Presencial'], ['Musculação', 'Miami, Estados Unidos', 'Presencial'], ['Pilates', 'UF:SP', 'Presencial']]) {
  const a = await vai(mod, L, F || 'Qualquer'), u = p.url();
  await p.goto(u, { waitUntil: 'load' }); await p.waitForFunction(() => window.REAL && window.REAL.status && window.REAL.status().base !== 'carregando' && /treinador(es)? de /.test(document.getElementById('app').innerText) && !document.querySelector('#lista .vf-sk'), null, { timeout: 30000 }).catch(() => {}); await p.waitForTimeout(1500);
  const d = await le(); ok('recarregar ' + u.replace(B, '') + ' mantém a lista (' + a.n + ')', d.n === a.n && d.metas[0] === a.metas[0], { antes: a.n, depois: d.n, m0: [a.metas[0], d.metas[0]] });
}
await c.close(); await b.close();
console.log(falhas ? '!! ' + falhas + ' falha(s) em ' + feitos : 'bateria de buscas: ' + feitos + ' verificações, tudo certo'); process.exit(falhas ? 1 : 0);
