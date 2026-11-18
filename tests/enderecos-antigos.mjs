// Endereços que o site anterior tinha no Google continuam levando a uma página que existe, e os sitemaps antigos respondem.
const B = 'http://localhost:5173';
const ir = async (u) => { const r = await fetch(B + u, { redirect: 'manual' }); return [r.status, (r.headers.get('location') || '').split(', ')[0].replace(B, '')]; };
const fim = async (u) => { const r = await fetch(B + u); return [r.status, new URL(r.url).pathname + new URL(r.url).search]; };
const cat = JSON.parse((await import('node:fs')).readFileSync(new URL('../public/data/treinadores.json', import.meta.url), 'utf8')).items;
const id = cat[0][0];
let a = await ir('/' + id), b = await fim('/' + id);
console.log('1 perfil na raiz vai de vez para /treinador/:', a[0] === 301 && a[1] === '/treinador/' + id, '| e a página abre:', b[0] === 200);
a = await ir('/musculacao'); console.log('2 esporte na raiz:', a[0] === 301 && a[1] === '/treinadores/musculacao');
a = await ir('/musculacao/sp'); console.log('  esporte + estado:', a[0] === 301 && a[1] === '/treinadores/musculacao/sp');
a = await ir('/crossfit/londrina-pr'); b = await fim('/crossfit/londrina-pr'); console.log('  esporte + cidade:', a[0] === 301 && a[1] === '/treinadores/crossfit/londrina-pr', b[0] === 200);
b = await fim('/golfe/cidade-que-nao-tem-xx'); console.log('  cidade sem ninguém cai na lista nacional (não em página inexistente):', b[0] === 200 && b[1] === '/treinadores/golfe');
a = await ir('/musculacao/online'); console.log('  esporte online:', a[0] === 301 && a[1] === '/treinadores/musculacao/online');
a = await ir('/programa/lpo-booster'); b = await fim('/programa/lpo-booster'); console.log('3 programa antigo leva à modalidade com 301:', a[0] === 301 && a[1] === '/treinadores/lpo', b[0] === 200);
a = await ir('/ze-londrina-pr'); console.log('  perfil removido leva à cidade dele:', a[0] === 301 && a[1] === '/cidade/londrina-pr');
a = await ir('/esporte/pilates'); console.log('  endereço /esporte/ antigo com 301:', a[0] === 301 && a[1] === '/treinadores/pilates');
a = await ir('/endereco-que-nunca-existiu-123'); console.log('4 endereço desconhecido continua 404:', a[0] === 404);
a = await ir('/en'); b = await ir('/es'); console.log('  /en e /es continuam abrindo:', a[0] === 200 && b[0] === 200);
a = await ir('/treinadores/musculacao?uf=pr'); console.log('  filtro de estado antigo vira endereço próprio:', a[0] === 301 && a[1] === '/treinadores/musculacao/pr');
for (const [n, min] of [['sitemap-trainers.xml', 100], ['sitemap-sports.xml', 10], ['sitemap-filters.xml', 50], ['sitemap-static.xml', 2], ['sitemap-programs.xml', 0], ['sitemap-states.xml', 50], ['sitemap-en.xml', 100], ['sitemap-es.xml', 100]]) {
  const r = await fetch(B + '/' + n), t = await r.text(), k = (t.match(/<loc>/g) || []).length;
  const locs = [...t.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  console.log('5 ' + n + ':', r.status === 200 && /xml/.test(r.headers.get('content-type') || '') && /<urlset/.test(t) && k >= min, '| só endereços novos:', locs.every((u) => /^https:\/\/[^/]+(\/$|\/(en\/|es\/)?(treinadores|treinador|cidade|cidades|esportes|estado|buscar|en|es)(\/|$))|^https:\/\/[^/]+$/.test(u)), '(' + k + ')');
}
const rb = await (await fetch(B + '/robots.txt')).text();
console.log('6 robots não esconde os estilos do Google:', /shell\/css/.test(rb) || !/Disallow: \/shell/.test(rb) || /Disallow: \/$/m.test(rb));
const ix = await (await fetch(B + '/sitemap.xml')).text();
console.log('7 sitemap.xml é índice com todos os sitemaps:', /<sitemapindex/.test(ix), ['static', 'sports', 'filters', 'states', 'trainers', 'programs', 'en', 'es'].every((n) => ix.includes('/sitemap-' + n + '.xml')));
const est = await fetch(B + '/treinadores/musculacao/pr'), et = await est.text();
console.log('8 página de estado existe e é própria:', est.status === 200, /<link rel="canonical" href="[^"]*\/treinadores\/musculacao\/pr"/.test(et), /no Paraná/.test(et));
const hub = await fetch(B + '/estado/pr'), ht = await hub.text();
console.log('  página do estado:', hub.status === 200, /no Paraná/.test(ht), /\/treinadores\/[a-z-]+\/pr"/.test(ht));
console.log('  estado sem ninguém não existe:', (await fetch(B + '/treinadores/surf/to')).status === 404 || (await fetch(B + '/treinadores/surf/ac')).status === 404);
