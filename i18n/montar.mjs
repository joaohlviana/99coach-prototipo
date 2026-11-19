// Monta public/data/i18n-en.json e i18n-es.json a partir de i18n/textos.json (português -> {en, es}) e
// i18n/padroes.mjs. Rodar depois de mudar textos: node i18n/montar.mjs
import fs from 'node:fs';
import padroes from './padroes.mjs';
const textos = JSON.parse(fs.readFileSync(new URL('./textos.json', import.meta.url), 'utf8'));
for (const [l, col] of [['en', 1], ['es', 2]]) {
  const t = {};
  for (const [pt, v] of Object.entries(textos)) if (v && v[l] && v[l] !== pt) t[pt.replace(/\s+/g, ' ').trim()] = v[l];
  const p = padroes.map((x) => [x[0], x[col]]);
  fs.writeFileSync(new URL('../public/data/i18n-' + l + '.json', import.meta.url), JSON.stringify({ t, p }));
  console.log(l, Object.keys(t).length, 'textos,', p.length, 'padrões');
}
