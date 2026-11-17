// Prepara o app interativo para rodar dentro do Next:
//   public/shell/templates.html  — as telas (<template id="tpl-...">) e a barra de demonstração
//   public/shell/app.js          — todos os scripts do app, na ordem, em um arquivo só
// A lista e a ordem dos scripts vêm de src/index.template.html (a mesma fonte de antes).
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
const root = new URL('..', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const tpl = read('src/index.template.html');
const order = JSON.parse(read('src/templates/order.json'));
// áreas com conta (treinador, aluno, operação) viram pacotes à parte: quem só busca treinador não baixa esse código nem essas telas
const AREAS = ['treinador', 'aluno', 'operacao'];
const tplOf = (n) => `<template id="tpl-${n}">${read(`src/templates/${n}.html`).trim()}</template>`;
const templates = order.filter((n) => !AREAS.includes(n)).map(tplOf).join('\n');
const bar = (tpl.match(/<nav class="pv-bar"[\s\S]*?<\/nav>/) || [''])[0];
const scripts = [...tpl.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
// os dados das telas do DS (3,7 MB) só servem ao modo demonstração: ficam fora do pacote e são carregados sob demanda
const LAZY = ['js/ds-data.js'];
const areaOf = (src) => AREAS.find((a) => src.startsWith('js/' + a + '/')) || '';
const pack = (list) => list.map((s) => `/* ${s} */\n${read('public/' + s)}`).join('\n;\n');
const js = pack(scripts.filter((s) => !LAZY.includes(s) && !areaOf(s)));
const areaJs = Object.fromEntries(AREAS.map((a) => [a, pack(scripts.filter((s) => areaOf(s) === a))]));
mkdirSync(new URL('public/shell/', root), { recursive: true });
writeFileSync(new URL('public/shell/templates.html', root), `<div id="shell-bar">${bar}</div>\n${templates}`);
for (const a of AREAS) writeFileSync(new URL(`public/shell/tpl-${a}.html`, root), tplOf(a));
// pacote menor: tira espaços e comentários (sem trocar nomes, para não mudar comportamento)
let out = js;
try { const { transformSync } = await import('esbuild'); out = transformSync(js, { minifyWhitespace: true, minifySyntax: true, legalComments: 'none', target: 'es2019' }).code; } catch (e) { console.warn('sem minificação:', e.message); }
writeFileSync(new URL('public/shell/app.js', root), out);
for (const a of AREAS) {
  let code = areaJs[a];
  try { const { transformSync } = await import('esbuild'); code = transformSync(code, { minifyWhitespace: true, minifySyntax: true, legalComments: 'none', target: 'es2019' }).code; } catch (_) {}
  writeFileSync(new URL(`public/shell/area-${a}.js`, root), code);
}
console.log(`shell pronto: ${order.length} áreas, ${scripts.length - LAZY.length} scripts, ${(js.length / 1024 / 1024).toFixed(1)} MB → ${(out.length / 1024 / 1024).toFixed(1)} MB`);

// estilos: cópia compacta em public/shell/css (os originais em public/css continuam sendo a fonte); os de base viram um arquivo só
mkdirSync(new URL('public/shell/css/', root), { recursive: true });
let cssMin = (c) => c;
try { const { transformSync } = await import('esbuild'); cssMin = (c) => transformSync(c, { loader: 'css', minify: true, legalComments: 'none' }).code; } catch (e) { console.warn('estilos sem minificação:', e.message); }
const css = (n) => read('public/css/' + n + '.css').replace(/\.\.\/fonts\//g, '/fonts/');
writeFileSync(new URL('public/shell/css/core.css', root), cssMin(['base', 'fonts', 'shell', 'ssr'].map(css).join('\n')));
for (const n of [...order, 'adapt']) writeFileSync(new URL(`public/shell/css/${n}.css`, root), cssMin(css(n)));
// versão do pacote: muda quando qualquer arquivo muda; entra nos endereços para o navegador guardar por um ano sem risco
const h = createHash('sha1');
const walk = (d) => { for (const f of readdirSync(new URL(d, root), { withFileTypes: true })) { if (f.isDirectory()) walk(d + f.name + '/'); else if (f.name !== 'version.json') h.update(f.name).update(readFileSync(new URL(d + f.name, root))); } };
walk('public/shell/');
h.update(read('public/next-loader.js'));
const v = h.digest('hex').slice(0, 10);
writeFileSync(new URL('public/shell/version.json', root), JSON.stringify({ v }));
console.log('versão do pacote:', v);
