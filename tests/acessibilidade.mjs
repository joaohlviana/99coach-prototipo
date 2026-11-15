// Acessibilidade (WCAG 2.2 AA pelo axe-core) e rolagem lateral nas áreas logadas, no computador e no celular (servidor simulado).
const { chromium } = (await import('node:module')).createRequire('/')(process.env.PW);
const fs = await import('node:fs');
const AXE = fs.readFileSync(new URL('../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8');
let W = { width: 1280, height: 900 }; let total = 0;
const b = await chromium.launch();
const lk = { id: 'L1', status: 'ativo', origin: 'convite', prep: 'assigned', answers: {}, created_at: '2026-11-01T12:00:00Z', student_id: 'al', trainers: { slug: 'm', name: 'Marina Duarte', user_id: 'tr' },
  workouts: [{ template_id: 'manual', title: 'Força A', current_version: 1, workout_versions: [{ version: 1, sessions: [{ id: 's1', title: 'Treino A', estMin: 20, items: [{ exerciseId: 'agach', name: 'Agachamento', sets: 2, reps: '8', loadKg: 40, restS: 90 }] }], schedule: null, created_at: '2026-11-02T12:00:00Z' }] }] };
const mk = async (who, area, name) => {
  const ctx = await b.newContext({ viewport: W });
  await ctx.route('**/api/v1/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[]}' }));
  await ctx.route('**/rycaxboqkkiopjdecgld.supabase.co/**', (r) => { const u = decodeURIComponent(r.request().url()), path = new URL(r.request().url()).pathname.replace('/rest/v1/', '');
    const j = (d) => r.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' }, body: JSON.stringify(d) });
    if (r.request().method() === 'OPTIONS') return j({});
    if (path === 'links') return j([lk]); if (path === 'profiles') return j(/id=in/.test(u) ? [{ id: 'al', display_name: 'Caio Prado' }] : [{ id: who, roles: [area] }]);
    if (path === 'trainers') return j(who === 'tr' ? [{ id: 'T1', status: 'publicado', slug: 'm' }] : []);
    if (path === 'rpc/my_capacity') return j([{ plan: 'essencial', limit: 3, used: 1, held: 0, free: 2 }]);
    if (/functions\/v1/.test(u)) return j({ ok: true, real: true, conta: false, plano: 'essencial', status: null });
    return j([]); });
  const p = await ctx.newPage();
  await p.goto('http://localhost:5173/', { waitUntil: 'load' }); await p.waitForTimeout(400);
  await p.evaluate(([w, a, n]) => { localStorage.setItem('c99.sessao', JSON.stringify({ access_token: 't', refresh_token: 'r', user: { id: w, email: w + '@x.com' } })); const C = PAGES.onboarding.Comp; STORE.saveOnb(Object.assign(C.prototype.base.call(C.prototype, a, ''), { name: n, dadosSaved: true, conta: true, step: a === 'treinador' ? 'hoje' : 'pronto', scn: '' })); }, [who, area, name]);
  await p.reload({ waitUntil: 'load' }); await p.waitForTimeout(1500); return p;
};
const run = async (p, label, go) => {
  await p.evaluate(go); await p.waitForTimeout(1400);
  await p.addScriptTag({ content: AXE });
  const res = await p.evaluate(async () => { const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } }); return r.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, ex: v.nodes.slice(0, 2).map((x) => x.target.join(' ') + ' :: ' + (x.failureSummary || '').split('\n')[1]) })); });
  const over = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  total += res.length + (over ? 1 : 0);
  if (res.length || over) console.log('  ' + W.width + 'px ' + label + (over ? ' [rolagem lateral]' : '') + ' ' + res.map((v) => v.id + ' x' + v.n).join(', '));
};
for (const w of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
  W = w;
const tr = await mk('tr', 'treinador', 'Marina Duarte');
for (const [l, g] of [['hoje', () => NAV.go('treinador', { s: 'hoje' }, null)], ['alunos', () => GO('H04')], ['agenda', () => GO('TRE20')], ['recebimentos', () => GO('H09R')], ['assinatura', () => GO('ASSIN')], ['programas', () => GO('PROGR')], ['insights', () => GO('H08')], ['conta', () => GO('TMENU')], ['aluno-ficha', () => GO('H05', { id: 'lk_L1' })]]) await run(tr, 'treinador ' + l, g);
const al = await mk('al', 'aluno', 'Caio Prado');
for (const [l, g] of [['hoje', () => NAV.go('aluno', { s: 'semvinculo', navFrom: 'hoje' }, null)], ['treinos', () => NAV.go('aluno', { s: 'semvinculo', navFrom: 'treinos' }, null)], ['programas', () => GO('MPROG')], ['conta', () => GO('AMENU')], ['meus dados', () => GO('ACC13R')]]) await run(al, 'aluno ' + l, g);
}
console.log('acessibilidade nas áreas logadas: problemas encontrados =', total, '| sem problemas:', total === 0);
await b.close();
