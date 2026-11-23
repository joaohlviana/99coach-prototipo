// Audiência do treinador (Insights) e métricas do site (administração), com o servidor simulado no formato das funções
// my_audience e admin_metrics. Confere também a medição: marca de visita de gente, número da visita, aparelho e origem.
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const B = process.env.BASE || 'http://localhost:5173';
let falhas = 0; const ok = (n, v, x) => { if (!v) falhas++; console.log((v ? 'ok ' : 'false ') + n + (v ? '' : ' :: ' + JSON.stringify(x))); };
const b = await chromium.launch();
const hoje = new Date(), iso = (d) => new Date(hoje.getTime() - d * 86400000).toISOString();
const AUD = (dias) => ({ dias, desde: iso(dias), medindo_desde: iso(3), visitas: 42, visitas_antes: 50, posicao_media: 6.4, contatos_canal: [{ k: 'instagram', n: 3 }, { k: 'pedido', n: 2 }], visitantes: 31, aparicoes: 480, aparicoes_antes: 500, cliques: 22, contatos: 5, contatos_antes: 0,
  por_dia: Array.from({ length: dias + 1 }, (_, i) => ({ d: iso(dias - i).slice(0, 10), v: i % 5 === 0 ? 0 : (i % 7) + 1 })),
  por_semana: [0, 1, 2, 3, 4, 5, 6].map((k) => ({ k, n: k === 4 ? 14 : k })), por_hora: Array.from({ length: 24 }, (_, k) => ({ k, n: k === 19 ? 9 : (k > 7 && k < 23 ? 2 : 0) })),
  perfil: { status: 'publicado', foto: false, texto: true, local: true, cref: 'informado', avaliacoes: 0, modalidades: 2, pontos: 41 },
  origem: [{ k: 'Google', n: 20 }, { k: '99coach', n: 12 }, { k: 'Instagram', n: 7 }, { k: 'link direto', n: 3 }], aparelho: [{ k: 'celular', n: 30 }, { k: 'computador', n: 12 }],
  veio_de: [{ k: 'Musculação · Londrina, PR', n: 9 }, { k: 'Página inicial', n: 3 }],
  recentes: Array.from({ length: 20 }, (_, i) => ({ em: new Date(hoje.getTime() - i * 3600000).toISOString(), origem: i % 2 ? 'Google' : '99coach', dev: i % 3 ? 'celular' : 'computador', de: i % 2 ? '' : 'Musculação · Londrina, PR', contato: i === 1 })),
  regiao: { cidade: 'Londrina, PR', uf: 'PR', modalidades: ['Musculação', 'Funcional'], buscas_cidade: 130, buscas_estado: 410, buscas_brasil: 5000, minhas_cidade: 64, minhas_estado: 200,
    top_cidade: [{ k: 'Musculação', n: 50, meu: true, t: 180 }, { k: 'Pilates', n: 30, meu: false, t: 4 }, { k: 'Corrida', n: 20, meu: false, t: 40 }, { k: 'Funcional', n: 14, meu: true, t: 60 }], top_estado: [], top_brasil: [], formatos: [{ k: 'presencial', n: 100 }, { k: 'online', n: 30 }], na_cidade: 251, posicao: 4 } });
const MET = (dias) => ({ dias, desde: iso(dias), em: hoje.toISOString(), medindo_desde: iso(3), visitas: 1234, visitas_antes: 1000, visitantes: 800, visitantes_antes: 0, buscas: 560, buscas_antes: 500, aparicoes: 9000, cliques: 300, contatos: 45, contatos_antes: 40, perfis_visitados: 410, descartados: 38000,
  por_dia: Array.from({ length: dias + 1 }, (_, i) => ({ d: iso(dias - i).slice(0, 10), visitas: i * 3, buscas: i, contatos: i % 2, visitantes: i * 2, descartados: 100, contas: i % 4 })),
  origem: [{ k: 'Google', n: 700 }, { k: 'link direto', n: 300 }], aparelho: [{ k: 'celular', n: 900 }, { k: 'computador', n: 334 }], idioma: [{ k: 'pt-BR', n: 1100 }, { k: 'en', n: 134 }],
  top_esportes: [{ k: 'Musculação', n: 200 }, { k: 'Pilates', n: 90 }], top_cidades: [{ k: 'São Paulo, SP', n: 80 }, { k: 'UF:PR', n: 40 }, { k: 'PAIS:US', n: 12 }],
  top_perfis: [{ slug: 'marina-d', nome: 'Marina Duarte', origem: 'cadastro', visitas: 42, contatos: 5 }, { slug: 'joao-x', nome: 'João Xavier', origem: 'importado', visitas: 30, contatos: 0 }],
  funil: { visitas: 1234, contatos: 45, pedidos: 6, aceitos: 4, acompanhamentos: 3 }, contas: { novas: 17, novas_antes: 9, total: 320 },
  treinadores: { cadastro_novos: 5, cadastro_publicados: 12, cadastro_rascunho: 4, importados: 23969, reivindicados: 3, reivindicados_periodo: 1, com_foto: 22000, paises: 67 } });
const srv = { calls: [], dias: [], mdias: [], ev: [] };
const novo = async (papel, token) => {
  const c = await b.newContext({ viewport: { width: 1280, height: 900 } });
  await c.route('**/api/v1/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[]}' }));
  await c.route('**/rycaxboqkkiopjdecgld.supabase.co/**', async (route) => {
    const rq = route.request(), u = new URL(rq.url());
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'content-type': 'application/json' };
    if (rq.method() === 'OPTIONS') return route.fulfill({ status: 200, headers: cors });
    const j = (s, d) => route.fulfill({ status: s, headers: cors, body: JSON.stringify(d) });
    const body = rq.postData() ? JSON.parse(rq.postData()) : {};
    if (u.pathname === '/auth/v1/user') return j(200, { id: papel, factors: [{ id: 'F1', factor_type: 'totp', status: 'verified' }] });
    const path = u.pathname.replace('/rest/v1/', ''); if (/^rpc\//.test(path)) srv.calls.push(path.slice(4));
    if (path === 'funnel_events' && rq.method() === 'POST') { srv.ev.push(body); return j(201, []); }
    if (path === 'rpc/my_audience') { srv.dias.push(body.p_days); return j(200, AUD(body.p_days)); }
    if (path === 'rpc/admin_metrics') { srv.mdias.push(body.p_days); return j(200, MET(body.p_days)); }
    if (path === 'rpc/is_admin') return j(200, true);
    if (path === 'rpc/admin_overview') return j(200, { contas: 12, em: hoje.toISOString() });
    if (path === 'rpc/trainer_metrics') return j(200, []);
    if (path === 'rpc/my_capacity') return j(200, { plan: 'essencial', limit: 3, used: 1, held: 0, free: 2 });
    if (path === 'rpc/my_profile_views') return j(200, { views: 99999, first: iso(9) });
    if (path === 'trainers') return j(200, [{ id: 'T1', slug: 'marina-d', status: 'publicado' }]);
    if (path === 'profiles') return j(200, [{ id: papel, roles: papel === 'adm' ? [] : ['treinador'] }]);
    return j(200, []);
  });
  const p = await c.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 160)));
  await p.goto(B + '/', { waitUntil: 'load' }); await p.waitForTimeout(500);
  await p.evaluate(([id, tk]) => localStorage.setItem('c99.sessao', JSON.stringify({ access_token: tk, refresh_token: 'r', user: { id, email: id + '@x.com' } })), [papel, token]);
  return { c, p, errs, txt: () => p.evaluate(() => document.getElementById('app').innerText.replace(/\s+/g, ' ')), press: (re) => p.evaluate((src) => { const r = new RegExp(src); const e = [...document.querySelectorAll('#app button')].find((x) => r.test(x.textContent.trim()) && x.offsetParent); if (e) e.click(); return !!e; }, re.source) };
};

// ---------- 1. treinador: Insights ----------
let t = await novo('tr', 't');
await t.p.evaluate(() => { const C = PAGES.onboarding.Comp; STORE.saveOnb(Object.assign(C.prototype.base.call(C.prototype, 'treinador', ''), { name: 'Marina Duarte', dadosSaved: true, conta: true, step: 'hoje', scn: '', published: true })); });
await t.p.reload({ waitUntil: 'load' }); await t.p.waitForTimeout(1500);
await t.p.evaluate(() => NAV.go('treinador', { s: 'insights' }, null)); await t.p.waitForFunction(() => /Visitas ao perfil/.test(document.getElementById('app').innerText), null, { timeout: 15000 }).catch(() => {}); await t.p.waitForTimeout(600);
let x = await t.txt();
ok('treinador: pede a audiência ao servidor (28 dias)', srv.dias[0] === 28, srv.dias);
ok('indicadores: visitas, visitantes, aparições e contatos', /42 Visitas ao perfil/.test(x) && /31 Visitantes/.test(x) && /480 Vezes que apareceu nas listas 22 cliques no cartão \(4,6%\)/.test(x) && /6,4º Posição média nas listas/.test(x) && /5 Cliques em contato 3 no Instagram · 2 pedidos/.test(x), x.slice(0, 600));
ok('queda aparece como queda', /42 Visitas ao perfil −8 sobre o período anterior/.test(x), (x.match(/42 Visitas.{0,60}/) || [])[0]);
ok('dias e horários: 7 dias da semana, 24 horas e o pico', await t.p.evaluate(() => { const g = [...document.querySelectorAll('.ir-dias--rot')]; return g.length === 2 && g[0].children.length === 7 && g[1].children.length === 24 && /^quinta · 14 visitas$/.test(g[0].children[4].title); }) && /Mais visitas: quinta, por volta das 19h\./.test(x), (x.match(/Dias e horários.{0,160}/) || [])[0]);
ok('visitas por dia: uma barra por dia, com o dia e a quantidade', await t.p.evaluate(() => { const s = [...document.querySelectorAll('.ir-dias:not(.ir-dias--rot) span')]; return s.length === 29 && /^\d\d\/\d\d · \d+ visitas?$/.test(s[1].title) && s[0].classList.contains('is-zero'); }));
ok('de onde vieram, o que buscavam e aparelho', /De onde vieram Google 20 99coach 12 Instagram 7 link direto 3/.test(x) && /O que estavam buscando no 99coach Musculação · Londrina, PR 9 Página inicial 3/.test(x) && /Aparelho celular 30 computador 12/.test(x), (x.match(/De onde vieram.{0,200}/) || [])[0]);
ok('últimas visitas: 12 de cada vez, com origem, aparelho e hora', await t.p.evaluate(() => { const l = [...document.querySelectorAll('[aria-labelledby="ir-au"] .ir-vis li')]; return l.length === 12 && /^99coach · Musculação · Londrina, PR · computador/.test(l[0].textContent.trim()) && /Hoje \d\d:\d\d$/.test(l[0].textContent.trim()) && /clicou em contato/.test(l[1].textContent); }));
await t.press(/^Ver mais$/); await t.p.waitForTimeout(400);
ok('"Ver mais" mostra todas as visitas recebidas', (await t.p.locator('[aria-labelledby="ir-au"] .ir-vis li').count()) === 20);
ok('ninguém é identificado: sem nome, e-mail nem endereço de rede', !/@|\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/.test(await t.p.evaluate(() => document.querySelector('[aria-labelledby="ir-au"] .ir-vis').innerText)));
ok('procura na cidade: buscas, buscas pelas modalidades dele e posição', /Procura em Londrina, PR/.test(x) && /130 Buscas em Londrina 410 no estado/.test(x) && /64 Buscas pelas suas modalidades na cidade 200 no estado/.test(x) && /251 Treinadores das suas modalidades na cidade você aparece em 4º entre eles/.test(x), (x.match(/Procura em.{0,300}/) || [])[0]);
ok('modalidades mais buscadas na cidade, com as dele em destaque', /Modalidades mais buscadas na cidade Musculação 50 buscas · 180 treinadores Pilates 30 buscas · 4 treinadores Corrida 20 buscas · 40 treinadores Funcional 14 buscas · 60 treinadores/.test(x) && await t.p.evaluate(() => [...document.querySelectorAll('.ir-rank__k.is-meu')].map((e) => e.textContent).join() === 'Musculação,Funcional'), (x.match(/Modalidades mais buscadas.{0,120}/) || [])[0]);
ok('muita procura, pouca oferta: só o que ele não atende e tem poucos treinadores', /Muita procura, pouca oferta Pilates 30 buscas para 4 treinadores na cidade/.test(x) && !/Muita procura, pouca oferta[^F]*Musculação 50 buscas para/.test(x), (x.match(/Muita procura.{0,140}/) || [])[0]);
ok('formato procurado', /Formato procurado presencial 100 online 30/.test(x), (x.match(/Formato procurado.{0,60}/) || [])[0]);
ok('para aparecer mais: só o que falta (foto, conferência do CREF, avaliações)', /Para aparecer mais Foto .*Adicionar foto CREF sem conferência .*Pedir conferência Avaliações/.test(x) && !/Para aparecer mais.*Apresentação Conte/.test(x) && !/Informar cidade/.test(x), (x.match(/Para aparecer mais.{0,300}/) || [])[0]);
{ const [dl] = await Promise.all([t.p.waitForEvent('download', { timeout: 8000 }).catch(() => null), t.press(/^Baixar planilha$/)]); let csv = ''; if (dl) { const fs = await import('node:fs'); csv = fs.readFileSync(await dl.path(), 'utf8'); }
  ok('planilha das visitas: cabeçalho e uma linha por visita', !!dl && dl.suggestedFilename() === 'visitas-ao-perfil.csv' && /"data";"hora";"origem";"buscava";"aparelho";"clicou em contato"/.test(csv) && csv.trim().split(/\r\n/).length === 21, csv.slice(0, 160)); }
ok('funil usa as visitas sem robôs (não as 99999 da contagem antiga)', !/99\.?999/.test(x) && /42 Visitas ao perfil/.test(x));
ok('sem aviso de "primeiro uso" nem texto de explicação no topo', !/Sem base ainda/.test(x) && !/Calculado pelo servidor/.test(x));
ok('aviso do começo da contagem', /Contagem sem robôs desde \d\d\/\d\d\./.test(x));
if (process.env.FOTO) await t.p.screenshot({ path: process.env.FOTO + '/treinador-d.png', fullPage: true });
await t.press(/^90 dias$/); await t.p.waitForTimeout(1200);
ok('trocar o período consulta de novo', srv.dias.includes(90), srv.dias);
await t.p.setViewportSize({ width: 390, height: 844 }); await t.p.waitForTimeout(500);
if (process.env.FOTO) await t.p.screenshot({ path: process.env.FOTO + '/treinador-m.png', fullPage: true });
ok('celular: sem rolagem lateral', await t.p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), await t.p.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]));
ok('sem erro na página (treinador)', t.errs.length === 0, t.errs);
await t.c.close();

// ---------- 2. administração: Métricas ----------
const jwt = 'x.' + Buffer.from(JSON.stringify({ sub: 'adm', aal: 'aal2' })).toString('base64url') + '.y';
t = await novo('adm', jwt);
await t.p.goto('about:blank'); await t.p.goto(B + '/app#publico-admin', { waitUntil: 'load' }); await t.p.waitForTimeout(2500);
ok('administração: existe a aba Métricas', await t.press(/^Métricas$/)); await t.p.waitForFunction(() => /Audiência/.test(document.getElementById('app').innerText), null, { timeout: 15000 }).catch(() => {}); await t.p.waitForTimeout(500);
x = await t.txt();
ok('pede as métricas ao servidor (28 dias)', srv.mdias[0] === 28, srv.mdias);
ok('audiência: visitas, visitantes, buscas, contatos, contas e robôs descartados', /Visitas a perfis 1\.234 \+234 sobre o período anterior/.test(x) && /Visitantes 800/.test(x) && /Buscas 560 \+60/.test(x) && /Cliques em contato 45 \+5/.test(x) && /Contas novas 17 \+8/.test(x) && /Acessos de robô descartados 38\.000/.test(x), x.slice(0, 700));
ok('três séries por dia (visitas, buscas, contas)', (await t.p.locator('.ir-dias').count()) === 3 && (await t.p.locator('.ir-dias').first().locator('span').count()) === 29);
ok('procura: modalidades e lugares, com estado e país legíveis', /Modalidades mais buscadas Musculação 200 Pilates 90/.test(x) && /Lugares mais buscados São Paulo, SP 80 Estado: PR 40 Estados Unidos 12/.test(x), (x.match(/Lugares mais buscados.{0,80}/) || [])[0]);
ok('origem, aparelho e idioma', /De onde vêm as visitas Google 700 link direto 300/.test(x) && /Aparelho celular 900 computador 334/.test(x) && /Idioma pt-BR 1\.100 en 134/.test(x));
ok('perfis mais visitados em tabela', /Perfis mais visitados Treinador Origem Visitas Cliques em contato Marina Duarte cadastro 42 5 João Xavier importado 30 0/.test(x), (x.match(/Perfis mais visitados.{0,160}/) || [])[0]);
ok('da visita ao acompanhamento', /Visitas a perfis 1\.234 Cliques em contato 45 Pedidos de acompanhamento 6 Pedidos aceitos 4 Acompanhamentos iniciados 3/.test(x));
ok('treinadores: cadastro, importados, reivindicados e países', /Perfis publicados por cadastro 12 4 em rascunho/.test(x) && /Perfis importados no ar 23\.969/.test(x) && /Perfis reivindicados 3 1 no período/.test(x) && /Países com treinador 67/.test(x));
if (process.env.FOTO) await t.p.screenshot({ path: process.env.FOTO + '/admin-d.png', fullPage: true });
await t.press(/^7 dias$/); await t.p.waitForTimeout(1200);
ok('trocar o período consulta de novo (7 dias)', srv.mdias.includes(7) && (await t.p.locator('.ir-dias').first().locator('span').count()) === 8, srv.mdias);
await t.p.setViewportSize({ width: 390, height: 844 }); await t.p.waitForTimeout(500);
if (process.env.FOTO) await t.p.screenshot({ path: process.env.FOTO + '/admin-m.png', fullPage: true });
ok('celular: sem rolagem lateral (administração)', await t.p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), await t.p.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]));
ok('sem erro na página (administração)', t.errs.length === 0, t.errs);
await t.c.close();

// ---------- 3. medição: o que vai junto de cada visita ----------
srv.ev.length = 0;
const c3 = await b.newContext({ viewport: { width: 390, height: 844 }, extraHTTPHeaders: { referer: 'https://www.google.com/' } });
await c3.route('**/rycaxboqkkiopjdecgld.supabase.co/**', (route) => { const rq = route.request(); if (/funnel_events/.test(rq.url()) && rq.method() === 'POST') srv.ev.push(JSON.parse(rq.postData() || '{}')); return route.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' }, body: '[]' }); });
const p3 = await c3.newPage();
const slug = await (await fetch(B + '/dados/inicio')).json().then((d) => d.items[0][0]);
await p3.goto(B + '/treinador/' + slug, { waitUntil: 'load', referer: 'https://www.google.com/' }); await p3.waitForTimeout(3500);
const v = srv.ev.filter((e) => e.event_name === 'trainer.profile_viewed.v1');
ok('visita ao perfil registrada uma vez', v.length === 1, v.length);
const pr = (v[0] || {}).properties || {};
ok('visita marcada como de gente, com número da visita e aparelho', pr.h === 1 && /^[a-z0-9]{8,}$/.test(pr.sid || '') && pr.dev === 'celular', pr);
ok('origem: veio do Google', pr.entry === 'busca' && pr.ref === 'Google', pr);
ok('nada que identifique a pessoa', !Object.keys(pr).some((k) => /mail|nome|name|ip|user|phone|fone/i.test(k)), Object.keys(pr));
await c3.close();
// robô não conta
const c4 = await b.newContext({ userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' }); let robo = 0;
await c4.route('**/rycaxboqkkiopjdecgld.supabase.co/**', (route) => { if (/funnel_events/.test(route.request().url()) && route.request().method() === 'POST') robo++; return route.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' }, body: '[]' }); });
const p4 = await c4.newPage(); await p4.goto(B + '/treinador/' + slug, { waitUntil: 'load' }); await p4.waitForTimeout(3500);
await p4.goto(B + '/treinadores/musculacao', { waitUntil: 'load' }); await p4.waitForTimeout(3500);
ok('robô de busca não gera visita, busca nem aparição', robo === 0, robo);
await c4.close(); await b.close();
console.log(falhas ? '!! ' + falhas + ' falha(s)' : 'audiência e métricas: tudo certo'); process.exit(falhas ? 1 : 0);
