// Gera um único arquivo HTML com tudo embutido (CSS, JS, imagens e fontes): dist-single/99coach.html
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const root = new URL('..', import.meta.url);
const read = (p, enc = 'utf8') => readFileSync(new URL(p, root), enc);
const MIME = { webp: 'image/webp', svg: 'image/svg+xml', jpg: 'image/jpeg', png: 'image/png', woff2: 'font/woff2' };
const uri = (p) => `data:${MIME[p.split('.').pop()]};base64,${read('public/' + p, null).toString('base64')}`;
let html = read('index.html');
html = html.replace(/<link rel="stylesheet"([^>]*?) href="(css\/[^"]+)">/g, (_, attrs, href) => {
  let css = read('public/' + href);
  if (href.endsWith('fonts.css')) css = css.replace(/url\("\.\.\/(fonts\/[^"]+)"\)/g, (m, f) => `url("${uri(f)}")`);
  return `<style${attrs}>\n${css}</style>`;
});
html = html.replace(/<script src="(js\/[^"]+)"><\/script>/g, (_, src) => {
  let js = read('public/' + src);
  if (src === 'js/img.js') js = js.replace(/"(img\/[^"]+)"/g, (m, f) => JSON.stringify(uri(f)));
  return `<script>\n${js.replace(/<\/script/gi, '<\\/script')}</script>`;
});
mkdirSync(new URL('dist-single/', root), { recursive: true });
writeFileSync(new URL('dist-single/99coach.html', root), html);
console.log(`dist-single/99coach.html: ${(html.length / 1048576).toFixed(1)} MB`);
