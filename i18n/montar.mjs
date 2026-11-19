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
// áreas com conta (painel, área do aluno, cadastro): i18n/textos-conta.json -> i18n-<idioma>-conta.json
// t: textos inteiros; f: pedaços de frases montadas no código (chave com os espaços das pontas)
const arq = new URL('./textos-conta.json', import.meta.url);
if (fs.existsSync(arq)) {
  const conta = JSON.parse(fs.readFileSync(arq, 'utf8'));
  for (const l of ['en', 'es']) {
    const t = {}, f = {};
    for (const [pt, v] of Object.entries(conta)) {
      if (!v || !v[l] || v[l] === pt) continue;
      const k = pt.replace(/\s+/g, ' ');
      if (k !== k.trim()) f[k] = v[l]; else { t[k] = v[l]; if (k.length >= 10) f[k] = v[l]; }
    }
    fs.writeFileSync(new URL('../public/data/i18n-' + l + '-conta.json', import.meta.url), JSON.stringify({ t, f }));
    console.log(l + '-conta', Object.keys(t).length, 'textos,', Object.keys(f).length, 'pedaços');
  }
}
