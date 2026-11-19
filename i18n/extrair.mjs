// Junta os textos do app que ainda não estão no dicionário (i18n/textos.json): textos fixos das telas (templates) e
// frases escritas no código das áreas com conta. Saída: lista em JSON para traduzir. Uso: node i18n/extrair.mjs > novos.json
import fs from 'node:fs';
import path from 'node:path';
const ja = JSON.parse(fs.readFileSync(new URL('./textos.json', import.meta.url), 'utf8'));
const out = new Map(); // texto -> 'n' (nó inteiro) | 'f' (fragmento de frase montada no código)
const norm = (s) => s.replace(/\s+/g, ' ');
const PT = /[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]|(^|[\s(“"])(de|do|da|dos|das|para|com|sem|não|em|por|seu|sua|seus|suas|você|um|uma|ou|no|na|nos|nas|que|ao|aos|às|os|as|é|já|mais|ainda|foi|são|está|este|esta|esse|essa|nenhum|nenhuma|todos|todas|novo|nova|treino|treinos|aluno|alunos|ver|abrir|salvar|enviar|voltar|cancelar|excluir|editar|criar|hoje|ontem|agora)([\s.,:;!?)”"]|$)/i;
const CODIGO = /--|__|[<>{}=;]|^\s*[#.]\w|\bfunction\b|=>|^https?:|^\/|\.(js|css|png|svg|webp|html)\b|^[a-z0-9_-]+( [a-z0-9_-]+)*$/;
const serve = (t) => { const k = norm(t); const x = k.trim(); if (x.length < 2 || x.length > 400) return null; if (!/[A-Za-zÀ-ú]{2}/.test(x)) return null; return k; };
// 1) textos fixos das telas
for (const f of ['treinador', 'aluno', 'publico', 'onboarding', 'servico', 'perfil', 'home', 'esporte']) {
  const h = fs.readFileSync(new URL('../src/templates/' + f + '.html', import.meta.url), 'utf8');
  for (const m of h.matchAll(/>([^<>]+)</g)) { if (/\{\{/.test(m[1])) continue; const k = serve(m[1]); if (k && !ja[k.trim()]) out.set(k.trim(), 'n'); }
  for (const m of h.matchAll(/\b(?:placeholder|aria-label|title|alt)="([^"]+)"/g)) { if (/\{\{/.test(m[1])) continue; const k = serve(m[1]); if (k && !ja[k.trim()]) out.set(k.trim(), 'n'); }
}
// 2) frases no código (áreas com conta e telas públicas)
const dirs = ['treinador', 'aluno', 'publico', 'pages'], soltos = ['chat.js', 'conta.js', 'biblioteca.js', 'semana.js', 'formularios-real.js', 'avaliacoes-real.js', 'videos.js', 'duas-etapas.js', 'real.js', 'runtime.js', 'core.js', 'store-boot.js'];
const arqs = soltos.map((f) => 'public/js/' + f).concat(dirs.flatMap((d) => fs.readdirSync('public/js/' + d).filter((f) => f.endsWith('.js')).map((f) => path.join('public/js', d, f))));
for (const f of arqs) {
  if (!fs.existsSync(f)) continue; const s = fs.readFileSync(f, 'utf8');
  for (const m of s.matchAll(/'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"/g)) {
    let t = (m[1] !== undefined ? m[1] : m[2]).replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\n/g, ' ');
    if (CODIGO.test(t.trim()) || !PT.test(t)) continue;
    const k = serve(t); if (!k) continue;
    // frase inteira (sem espaço nas pontas) vale como nó; com espaço nas pontas é pedaço de frase montada
    const inteiro = k === k.trim();
    if (inteiro) { if (!ja[k]) out.set(k, out.get(k) === 'n' ? 'n' : 'n'); } else if (!ja[k.trim()] || true) { if (k.trim().length >= 3) out.set(k, 'f'); }
  }
}
console.log(JSON.stringify([...out.entries()]));
