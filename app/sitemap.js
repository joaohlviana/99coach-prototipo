import { SITE, esportes, cidadesDo, cidades, lista, todos, atualizadoEm } from '../lib/catalogo.js';

// Só páginas que existem de verdade: esporte com treinadores, esporte × cidade com pelo menos 3 presenciais,
// esporte online com treinadores, e os perfis do catálogo. Nenhum endereço de área com conta.
export const revalidate = 86400;
export default function sitemap() {
  const quando = atualizadoEm() ? new Date(atualizadoEm()) : new Date();
  const out = [{ url: SITE + '/', lastModified: quando, changeFrequency: 'daily', priority: 1 }];
  esportes().forEach((s) => {
    out.push({ url: `${SITE}/treinadores/${s.slug}`, lastModified: quando, changeFrequency: 'weekly', priority: 0.8 });
    if (lista(s.slug, 'online').length) out.push({ url: `${SITE}/treinadores/${s.slug}/online`, lastModified: quando, changeFrequency: 'weekly', priority: 0.6 });
    cidadesDo(s.slug, 3).forEach((c) => out.push({ url: `${SITE}/treinadores/${s.slug}/${c.slug}`, lastModified: quando, changeFrequency: 'weekly', priority: 0.7 }));
  });
  // página da cidade: só com pelo menos 3 profissionais presenciais
  cidades(3).forEach((c) => out.push({ url: `${SITE}/cidade/${c.slug}`, lastModified: quando, changeFrequency: 'weekly', priority: 0.6 }));
  todos().filter((t) => t.pres || t.onl).forEach((t) => out.push({ url: `${SITE}/treinador/${t.id}`, lastModified: t.pub ? new Date(t.pub) : quando, changeFrequency: 'monthly', priority: 0.4 }));
  return out;
}
