// Monta index.html a partir de src/index.template.html + src/templates/*.html
import { readFileSync, writeFileSync } from 'node:fs';
const root = new URL('..', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const order = JSON.parse(read('src/templates/order.json'));
const tpls = order.map((n) => `<template id="tpl-${n}">\n${read(`src/templates/${n}.html`)}</template>`).join('\n');
writeFileSync(new URL('index.html', root), read('src/index.template.html').replace('<!--TEMPLATES-->', () => tpls));
console.log(`index.html montado (${order.length} telas)`);
