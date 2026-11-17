// Gera components/home-espera.js: uma cópia estática do topo da página inicial (barra, hero e busca),
// exatamente como o app desenha. O servidor entrega essa cópia e o visitante vê o topo de imediato;
// quando o app liga, ele redesenha por cima sem mudança visível.
// Uso: com o site rodando em localhost:5173 →  PW=<caminho do playwright> node scripts/snapshot-home.mjs
// Rode de novo sempre que o topo da página inicial mudar (o teste "espera-da-home" avisa quando ficou diferente).
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const { chromium } = createRequire('/')(process.env.PW || 'playwright');
export async function topo(base) {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await p.goto((base || 'http://localhost:5173') + '/?demo=0', { waitUntil: 'load' });
  await p.waitForFunction(() => document.documentElement.classList.contains('app-on') && document.querySelector('#app .vfm-hero2') && document.querySelector('#app .v4-hero__img'), null, { timeout: 20000 });
  await p.waitForTimeout(800);
  const html = await p.evaluate(() => {
    const root = document.querySelector('#app > .w.v4, #app .w.v4');
    const c = root.cloneNode(true);
    // fica só o topo: no celular, barra + hero + busca + modalidades; no computador, cabeçalho + modalidades + hero
    const keep = (el) => el.matches('.vfm, header.hdr, .v4-hero, [class*="v4-hero"], .rail, .vf-rail, nav, .v4-skip') || !!el.querySelector(':scope .v4-hero__img');
    [...c.children].forEach((el) => { if (!keep(el)) el.remove(); });
    const hero = c.querySelector('.v4-hero');
    for (let n = hero; n && n !== c; n = n.parentElement) while (n.nextElementSibling) n.nextElementSibling.remove();
    const m = c.querySelector('.vfm');
    if (m) { let cut = false; [...m.children].forEach((el) => { if (cut) el.remove(); else if (el.matches('.vfm-rail')) cut = true; }); }
    // some o que é de sobreposição ou estado
    c.querySelectorAll('[role="dialog"], .sx-layer, .sx-scrim, .toast, script, [id]').forEach((el) => { if (el.matches('[role="dialog"], .sx-layer, .sx-scrim, .toast, script')) el.remove(); else el.removeAttribute('id'); });
    c.querySelectorAll('h1').forEach((h) => { const d = document.createElement('div'); for (const a of h.attributes) d.setAttribute(a.name, a.value); d.innerHTML = h.innerHTML; h.replaceWith(d); });
    c.querySelectorAll('img').forEach((i) => { i.setAttribute('src', new URL(i.src).pathname); });
    c.querySelectorAll('button, a, input').forEach((e) => e.setAttribute('tabindex', '-1'));
    return c.outerHTML;
  });
  await b.close();
  return html;
}
if (process.argv[1] && process.argv[1].endsWith('snapshot-home.mjs')) {
  const html = await topo(process.argv[2]);
  // a cópia não responde a toque nem é lida por leitores de tela: o conteúdo de verdade está na versão do servidor e, logo depois, no app
  const pronto = html.replace('<div class="w v4"', '<div class="w v4" inert aria-hidden="true" data-espera');
  writeFileSync(new URL('../components/home-espera.js', import.meta.url), '// Gerado por scripts/snapshot-home.mjs: não edite à mão.\nexport default ' + JSON.stringify(pronto) + ';\n');
  console.log('home-espera.js:', (html.length / 1024).toFixed(1), 'KB');
}
