// Nenhuma página pública pode ter noindex: ajuda, termos, privacidade, pagamentos, "sou treinador", busca e páginas do catálogo.
// Endereços antigos (/termos, /privacidade...) levam por 301 às páginas do servidor (não mais à área /app, fechada ao Google).
const B = 'http://localhost:5173';
const pegar = async (u) => { const r = await fetch(B + u, { redirect: 'manual' }); return { st: r.status, loc: r.headers.get('location') || '', h: r.status === 200 ? await r.text() : '', xr: r.headers.get('x-robots-tag') || '' }; };
// fora da produção o site inteiro fica com noindex (homologação); aqui vale: nenhuma página pública diferente da página inicial
const rob = (h) => (/<meta name="robots" content="([^"]*)"/i.exec(h) || [, ''])[1];
const base = rob((await pegar('/')).h);
const sem = (x) => !/noindex/i.test(x.xr) && rob(x.h) === base;
let ok = true;
for (const u of ['/ajuda', '/ajuda/termos', '/ajuda/privacidade', '/ajuda/pagamentos', '/ajuda/cookies', '/sou-treinador', '/buscar', '/esportes', '/cidades', '/treinadores/musculacao']) {
  const x = await pegar(u);
  const bom = x.st === 200 && sem(x) && /<h1/.test(x.h);
  if (!bom) ok = false;
  console.log('1 ' + u + ':', bom, x.st);
}
const termos = await pegar('/ajuda/termos');
console.log('2 termos com o texto do app:', /Quem pode usar/.test(termos.h), /Versão vigente de/.test(termos.h));
for (const [de, para] of [['/termos', '/ajuda/termos'], ['/privacidade', '/ajuda/privacidade'], ['/cookies', '/ajuda/cookies'], ['/pagamentos-e-reembolsos', '/ajuda/pagamentos']]) {
  const x = await pegar(de);
  console.log('3 ' + de + ' → ' + para + ':', (x.st === 301 || x.st === 308) && x.loc.endsWith(para));
}
const est = await (await fetch(B + '/sitemap-static.xml')).text();
console.log('4 no sitemap:', ['/ajuda<', '/ajuda/termos<', '/sou-treinador<', '/buscar<'].every((s) => est.includes(s)));
const foot = (await pegar('/esportes')).h;
console.log('5 rodapé aponta para as páginas indexáveis:', /href="\/ajuda\/termos"/.test(foot) && /href="\/sou-treinador"/.test(foot));
console.log('errs', ok ? [] : ['página pública com noindex ou fora do ar']);
