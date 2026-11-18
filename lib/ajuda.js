// Artigos da Central de ajuda (termos, privacidade, pagamentos...) lidos no servidor para virar páginas públicas indexáveis.
// Fonte única: a lista de artigos do app (public/js/publico/20-ajuda.js), para o texto do servidor e o do app nunca divergirem.
import { readFileSync } from 'node:fs';
import path from 'node:path';

let cache = null;
export function artigos() {
  if (cache) return cache;
  const src = readFileSync(path.join(process.cwd(), 'public/js/publico/20-ajuda.js'), 'utf8');
  const seeds = {};
  const DB = { seed: (k, v) => { seeds[k] = v; } };
  // o arquivo só registra a lista e a tela; aqui a tela é ignorada
  new Function('DB', 'REG', 'window', src)(DB, { screen() {} }, {});
  cache = (seeds.p2_artigos || []).map((a) => ({ ...a, url: '/ajuda/' + a.id }));
  return cache;
}
export const artigo = (id) => artigos().find((a) => a.id === id) || null;
export const CATS = { pagamentos: 'Pagamentos', conta: 'Conta e privacidade', politicas: 'Termos e políticas', treinadores: 'Para treinadores', institucional: 'Sobre a 99Coach' };
// links internos dos artigos: o que é página pública vira endereço do servidor; o resto abre a tela do app
export const destino = (to) => ({ '@servico': '/', PUB12: '/ajuda/perfil', ACC13: '/app#publico-meusdados', FC07: '/app' }[to] || '/app');
