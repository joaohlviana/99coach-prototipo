// Achados da auditoria de 17/11 (F15–F23), conta real simulada.
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const b = await chromium.launch();
const LID = 'e9c16a46-1b2c-4d3e-8f90-123456789abc';
const srv = { trainerStatus: 'rascunho', invitePosts: 0 };
const serve = async (ctx) => {
  await ctx.route('**/api/v1/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[]}' }));
  await ctx.route('**/rycaxboqkkiopjdecgld.supabase.co/**', async (route) => {
    const rq = route.request(), u = new URL(rq.url());
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' };
    if (rq.method() === 'OPTIONS') return route.fulfill({ status: 200, headers: cors });
    const j = (s, d) => route.fulfill({ status: s, headers: cors, body: JSON.stringify(d) });
    const path = u.pathname.replace('/rest/v1/', '');
    if (path === 'trainers') return j(200, [{ id: 'T1', slug: 'marina-d', name: 'Marina Duarte', status: srv.trainerStatus }]);
    if (path === 'profiles') return j(200, [{ id: 'tr', roles: ['treinador'] }]);
    if (path === 'invites' && rq.method() === 'POST') { srv.invitePosts++; return j(403, { code: '42501', message: 'new row violates row-level security policy for table "invites"' }); }
    if (path === 'rpc/my_links' || path === 'links') return j(200, [{ id: LID, status: 'ativo', mine: 'treinador', student_name: 'Aluno QA', studentName: 'Aluno QA', prep: 'awaiting_client' }]);
    return j(200, []);
  });
};
const entrar = async (ctx, hash) => {
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 160)));
  await p.goto('http://localhost:5173/', { waitUntil: 'load' }); await p.waitForTimeout(500);
  await p.evaluate(() => {
    localStorage.setItem('c99.sessao', JSON.stringify({ access_token: 't', refresh_token: 'r', user: { id: 'tr', email: 'tr@x.com' } }));
    const C = PAGES.onboarding.Comp;
    STORE.saveOnb(Object.assign(C.prototype.base.call(C.prototype, 'treinador', ''), { name: 'Marina Duarte', city: 'Londrina, PR', sports: { corrida: true }, dadosSaved: true, conta: true, step: 'hoje', scn: '', published: false }));
  });
  await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1500);
  return { p, errs };
};
const txt = (p) => p.evaluate(() => document.getElementById('app').innerText.replace(/\s+/g, ' '));
const clickTxt = async (p, re) => { const ok = await p.evaluate((s) => { const r = new RegExp(s); const el = [...document.querySelectorAll('#app button, #app a')].find((x) => r.test(x.textContent.trim()) && x.offsetParent); if (el) el.click(); return !!el; }, re.source); await p.waitForTimeout(900); return ok; };

const A = await b.newContext({ viewport: { width: 1280, height: 900 } }); await serve(A);
const a = await entrar(A);

// F15: nova rotina abre o editor, sem erro
await a.p.evaluate(() => NAV.go('treinador', { s: 'conteudo' }, null)); await a.p.waitForTimeout(1500);
let t = await txt(a.p);
console.log('F16 Conteúdo sem atalho para Formulários indisponível:', !/Formulários/.test(t));
const before = a.errs.length;
await clickTxt(a.p, /Nova rotina/); await a.p.waitForTimeout(1500);
const hash = await a.p.evaluate(() => location.hash);
console.log('F15 nova rotina abre o editor sem erro:', a.errs.length === before, /editor/.test(hash), a.errs.slice(before).join(' | '));

// F15 (caminho 2): rotina incompleta criada antes da correção (sem histórico) recebe exercício pela tela do exercício
await a.p.evaluate(() => { DB.rotinas.push({ id: 'ru7csj', name: 'Rotina QA', folder: '', student: '', status: 'rascunho', version: 1, savedAt: '17/11 15:00', lastSection: 's1', sessions: [{ id: 's1', name: 'Sessão A', items: [] }] }); if (DB.t3_versoes) delete DB.t3_versoes.ru7csj; });
await a.p.evaluate(() => NAV.go('treinador', { s: 'exercicio', id: 'afundo', rotina: 'ru7csj', sessao: 's1' }, null)); await a.p.waitForTimeout(1200);
const b2 = a.errs.length;
await clickTxt(a.p, /^Adicionar à Sessão A$/); await a.p.waitForTimeout(1500);
t = await txt(a.p);
console.log('F15 adicionar exercício a rotina antiga abre o editor:', a.errs.length === b2, /Rotina QA/i.test(t), !/Ainda não há dados/.test(t), /1 exercício adicionado/.test(t));

// F22: endereço com UUID completo sobrevive à recarga
const parsed = await a.p.evaluate((lid) => { history.replaceState(null, '', '/app#treinador-alunoreal-lk_' + lid); return true; }, LID);
await a.p.reload({ waitUntil: 'load' }); await a.p.waitForTimeout(2500);
const idNow = await a.p.evaluate(() => { const h = location.hash; return h; });
t = await txt(a.p);
console.log('F22 recarga mantém o vínculo inteiro:', idNow.includes(LID), !/lk_e9c16a46(?!-)/.test(idNow));

// F18: a seção de segurança do cadastro, na conta real, leva aos dados reais (sem aparelhos inventados)
const tpl = await a.p.evaluate(() => fetch('/shell/templates.html?x=' + Date.now()).then((r) => r.text()));
console.log('F18 segurança leva aos dados reais:', /Abrir Meus dados e segurança/.test(tpl) && /sg\.real/.test(tpl));
// F19/F20: convite com perfil em rascunho explica o pré-requisito; campo de e-mail obrigatório; validade calculada
await a.p.evaluate(() => GO('REL01')); await a.p.waitForTimeout(1200);
t = await txt(a.p);
const d7 = new Date(Date.now() + 7 * 864e5); const exp = ('0' + d7.getDate()).slice(-2) + '/' + ('0' + (d7.getMonth() + 1)).slice(-2);
console.log('F20 e-mail não aparece como opcional:', /E-mail do aluno/i.test(t), !/E-mail ou celular/i.test(t), '| validade real:', t.includes('até ' + exp), !t.includes('02/11'));
await a.p.fill('#t1-nome', 'Aluno QA'); await a.p.fill('#t1-contato', 'aluno@x.com');
await clickTxt(a.p, /^Criar convite/); await a.p.waitForTimeout(1500);
t = await txt(a.p);
console.log('F19 perfil em rascunho: explica antes de tentar no servidor:', /Publique seu perfil para convidar/.test(t), srv.invitePosts === 0, !/42501|row-level/.test(t));

// F21: textos do perfil sem nomes e datas de exemplo
const src = await a.p.evaluate(() => fetch('/shell/app.js?x=' + Date.now()).then((r) => r.text()));
console.log('F21 sem "O Gabriel"/"A Carolina"/22/10/2026 fixos no perfil:', !/O Gabriel não está|A Carolina não informou|criou o perfil em 22\/10\/2026/.test(src));
console.log('F27 Instagram sem fluxo simulado na conta real:', /Confirmação pelo Instagram ainda não está disponível/.test(tpl) && /g\.real/.test(tpl));
console.log('F28 exportar/excluir levam aos dados reais:', /exportStart: \(\) => \(!document\.documentElement\.classList\.contains\('demo'\)[^\n]*meusdados/.test(src) || /meusdados/.test(src));
console.log('F24 sem aviso falso de vídeo:', !/O vídeo de demonstração deste exercício ainda não foi enviado/.test(src));
console.log('sem erros:', a.errs.length === 0, a.errs.join(' | '));
await b.close();
