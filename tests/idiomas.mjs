// Páginas públicas em inglês e espanhol: respondem traduzidas, marcam o idioma e ligam as versões entre si (hreflang).
const B = 'http://localhost:5173';
const get = async (u) => { const r = await fetch(B + u); return { s: r.status, h: await r.text() }; };
const fs = await import('node:fs');
const cat = JSON.parse(fs.readFileSync(new URL('../public/data/treinadores.json', import.meta.url), 'utf8'));
const rows = cat.items || cat.trainers || cat, r0 = (Array.isArray(rows) ? rows : [])[0];
const slug = Array.isArray(r0) ? r0[0] : (r0 && (r0.slug || r0.id));
let x = await get('/en');
console.log('1 inicio en:', x.s === 200, /id="ssr"[^>]*lang="en"/.test(x.h), /Personal trainers/.test(x.h));
x = await get('/es');
console.log('  inicio es:', x.s === 200, /id="ssr"[^>]*lang="es"/.test(x.h), /Entrenadores/.test(x.h));
x = await get('/en/coaches/judo');
console.log('2 modalidade en:', x.s === 200, /Judo coaches/.test(x.h), /hrefLang="pt-BR"/i.test(x.h), /hrefLang="es"/i.test(x.h));
x = await get('/en/coach/' + slug);
console.log('3 perfil en:', x.s === 200, /hrefLang="x-default"/i.test(x.h), /\/en\/coach\//.test(x.h));
x = await get('/es/entrenador/' + slug);
console.log('  perfil es:', x.s === 200, /lang="es"/.test(x.h));
console.log('4 idioma invalido 404:', (await get('/fr')).s === 404, (await get('/en/coaches/naoexiste')).s === 404);
x = await get('/treinadores/judo');
console.log('5 pt aponta para en/es:', /hrefLang="en" href="[^"]*\/en\/coaches\/judo"/i.test(x.h));
x = await get('/en/city/londrina-pr');
console.log('6 cidade en:', x.s === 200, /Personal trainers and coaches in Londrina/.test(x.h), (await get('/es/ciudad/naoexiste')).s === 404);
x = await get('/');
console.log('  inicio pt aponta para en:', /hrefLang="en"/i.test(x.h));

// endereços antigos com trechos em português levam (301) ao endereço traduzido
const r7 = await fetch(B + '/en/treinador/' + slug, { redirect: 'manual' }), r8 = await fetch(B + '/es/treinadores/musculacao', { redirect: 'manual' });
console.log('7 antigos levam ao traduzido:', r7.status === 301 && r7.headers.get('location').endsWith('/en/coach/' + slug), r8.status === 301 && r8.headers.get('location').endsWith('/es/entrenadores/musculacion'));
// a página já sai do servidor no idioma certo, e nada na moldura em inglês/espanhol leva a página em português
const lang = async (u) => (/<html[^>]*lang="([^"]*)"/.exec((await get(u)).h) || [])[1];
console.log('8 idioma do HTML:', (await lang('/')) === 'pt-BR', (await lang('/en')) === 'en', (await lang('/es/entrenadores/musculacion')) === 'es', (await lang('/en/coach/' + slug)) === 'en');
x = await get('/en/coaches/judo');
const ssr = x.h.split('id="app"')[0];
console.log('9 moldura em inglês fica em inglês:', /<form[^>]*action="\/en\/search"/.test(ssr), !/href="\/cidades"/.test(ssr), !/href="\/buscar/.test(ssr), /hrefLang="x-default" href="[^"]*\/en\/coaches\/judo"/i.test(x.h));
x = await get('/en/search?q=judo');
console.log('10 busca em inglês:', x.s === 200, /Results for/.test(x.h), /href="\/en\/coaches\/judo"/.test(x.h), (await get('/es/buscar')).s === 200);
