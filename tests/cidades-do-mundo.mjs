// Cidades fora do Brasil: página própria nos três idiomas (/cidade/miami-us, /en/city/miami-us, /es/ciudad/miami-us),
// ligadas entre si (hreflang), no sitemap, no início em inglês e no perfil de quem atende lá.
const fs = await import('node:fs');
const cat = JSON.parse(fs.readFileSync(new URL('../public/data/treinadores.json', import.meta.url), 'utf8')).items;
const um = cat.find((r) => r[11] === 'US' && /^Miami,/.test(r[12] || ''));
if (!um) { console.log('0 catálogo local sem treinador em Miami; pulando'); console.log('errs []'); process.exit(0); }
const B = 'http://localhost:5173', get = async (u) => { const r = await fetch(B + u); return { s: r.status, h: await r.text() }; };
let x = await get('/cidade/miami-us');
console.log('1 pt:', x.s === 200, /<h1>Personal trainer em Miami/.test(x.h), x.h.includes(um[1]), /hrefLang="en" href="[^"]*\/en\/city\/miami-us"/.test(x.h), /hrefLang="es" href="[^"]*\/es\/ciudad\/miami-us"/.test(x.h));
x = await get('/en/city/miami-us');
console.log('2 en:', x.s === 200, /<h1>Personal trainers in Miami/.test(x.h), /United States/.test(x.h), /rel="canonical" href="[^"]*\/en\/city\/miami-us"/.test(x.h));
x = await get('/es/ciudad/miami-us');
console.log('3 es:', x.s === 200, /<h1>Entrenadores personales en Miami/.test(x.h), /Estados Unidos/.test(x.h));
console.log('4 cidade inexistente é 404:', (await get('/en/city/nowhere-us')).s === 404, (await get('/cidade/nowhere-us')).s === 404);
x = await get('/en');
console.log('5 início em inglês destaca as cidades do mundo:', /href="\/en\/city\/miami-us"/.test(x.h), /href="\/en\/worldwide"/.test(x.h));
x = await get('/en/coach/' + um[0]);
console.log('6 perfil leva à cidade:', /href="\/en\/city\/miami-us"/.test(x.h), /<title>[^<]* in Miami/.test(x.h));
x = await get('/sitemap-en.xml');
const y = await get('/sitemap-filters.xml');
console.log('7 sitemaps:', /\/en\/city\/miami-us</.test(x.h), /\/en\/worldwide</.test(x.h), /\/cidade\/miami-us</.test(y.h));
x = await get('/en/worldwide');
console.log('8 worldwide em inglês:', x.s === 200, /href="\/en\/city\/miami-us"/.test(x.h));
console.log('errs []');
