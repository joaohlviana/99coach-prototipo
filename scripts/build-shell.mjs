// Prepara o app interativo para rodar dentro do Next:
//   public/shell/templates.html  — as telas (<template id="tpl-...">) e a barra de demonstração
//   public/shell/app.js          — todos os scripts do app, na ordem, em um arquivo só
// A lista e a ordem dos scripts vêm de src/index.template.html (a mesma fonte de antes).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const root = new URL('..', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const tpl = read('src/index.template.html');
const order = JSON.parse(read('src/templates/order.json'));
const templates = order.map((n) => `<template id="tpl-${n}">${read(`src/templates/${n}.html`).trim()}</template>`).join('\n');
const bar = (tpl.match(/<nav class="pv-bar"[\s\S]*?<\/nav>/) || [''])[0];
const scripts = [...tpl.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
// os dados das telas do DS (3,7 MB) só servem ao modo demonstração: ficam fora do pacote e são carregados sob demanda
const LAZY = ['js/ds-data.js'];
const js = scripts.filter((s) => !LAZY.includes(s)).map((s) => `/* ${s} */\n${read('public/' + s)}`).join('\n;\n');
mkdirSync(new URL('public/shell/', root), { recursive: true });
writeFileSync(new URL('public/shell/templates.html', root), `<div id="shell-bar">${bar}</div>\n${templates}`);
// pacote menor: tira espaços e comentários (sem trocar nomes, para não mudar comportamento)
let out = js;
try { const { transformSync } = await import('esbuild'); out = transformSync(js, { minifyWhitespace: true, minifySyntax: true, legalComments: 'none', target: 'es2019' }).code; } catch (e) { console.warn('sem minificação:', e.message); }
writeFileSync(new URL('public/shell/app.js', root), out);
console.log(`shell pronto: ${order.length} áreas, ${scripts.length - LAZY.length} scripts, ${(js.length / 1024 / 1024).toFixed(1)} MB → ${(out.length / 1024 / 1024).toFixed(1)} MB`);
