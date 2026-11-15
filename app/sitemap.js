import { idiomas } from '../lib/i18n.js';
import { SITE, esportes, cidadesDo, cidades, lista, todos, atualizadoEm } from '../lib/catalogo.js';

// Só páginas que existem de verdade: esporte com treinadores, esporte × cidade com pelo menos 1 presencial,
// esporte online com treinadores, e os perfis do catálogo. Nenhum endereço de área com conta.
export const revalidate = 86400;
export default function sitemap() {
  const quando = atualizadoEm() ? new Date(atualizadoEm()) : new Date();
  const out = [{ url: SITE + '/', lastModified: quando, changeFrequency: 'daily', priority: 1 }];
  esportes().forEach((s) => {
    out.push({ url: `${SITE}/treinadores/${s.slug}`, lastModified: quando, changeFrequency: 'weekly', priority: 0.8 });
    if (lista(s.slug, 'online').length) out.push({ url: `${SITE}/treinadores/${s.slug}/online`, lastModified: quando, changeFrequency: 'weekly', priority: 0.6 });
    cidadesDo(s.slug, 1).forEach((c) => out.push({ url: `${SITE}/treinadores/${s.slug}/${c.slug}`, lastModified: quando, changeFrequency: 'weekly', priority: 0.7 }));
  });
  // página da cidade: toda cidade com profissional presencial
  out.push({ url: `${SITE}/cidades`, lastModified: quando, changeFrequency: 'weekly', priority: 0.6 });
  cidades(1).forEach((c) => out.push({ url: `${SITE}/cidade/${c.slug}`, lastModified: quando, changeFrequency: 'weekly', priority: 0.6 }));
  todos().filter((t) => !t.canon).forEach((t) => out.push({ url: `${SITE}/treinador/${t.id}`, lastModified: t.pub ? new Date(t.pub) : quando, changeFrequency: 'monthly', priority: 0.4 }));
  // versões em inglês e espanhol: só as páginas que têm tradução (início, modalidades e perfis), ligadas por hreflang
  const abs = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, SITE + v]));
  return out.map((e) => {
    const cam = e.url.slice(SITE.length) || '/';
    if (cam === '/') return { ...e, alternates: { languages: { 'pt-BR': SITE + '/', en: SITE + '/en', es: SITE + '/es' } } };
    if (/^\/(treinadores|treinador|cidade)\//.test(cam)) return { ...e, alternates: { languages: abs(idiomas(cam)) } };
    return e;
  });
}
