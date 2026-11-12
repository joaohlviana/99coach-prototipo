// Converte um treinador no formato da API antiga para a linha que o banco (Supabase) devolve,
// para os roteiros simularem o catálogo ao vivo e o perfil vindo do banco.
export function linha(t, det) {
  const [cidade, uf] = String((t.city && t.city.label) || '').split(', ');
  det = det || {};
  return {
    id: 'T1', slug: t.slug, name: t.name, initials: t.initials || '', photo_url: t.photo || null, specialty: t.specialty || '', formats: t.formats || [],
    published_at: (t.publishedAt || '2026-11-10') + 'T12:00:00Z', origin: t.imported ? 'importado' : 'cadastro', status: 'publicado',
    cities: cidade ? { name: cidade, uf: uf || '' } : null, trainer_sports: (t.sports || []).map((s) => ({ sport_slug: s })),
    role_line: det.role || '', pitch: det.pitch || '', bio: det.bio || '', external_handle: det.externalHandle || '', cref: null, cref_status: 'nao_informado',
    availability: t.receivesRequests === false ? 'nao_aceita' : 'aceita',
    offers: (det.offers || t.headlineOffers || []).map((o, i) => ({ id: 'OF' + (i + 1), key: i ? 'o' + i : 'principal', title: o.title, price_cents: o.priceCents, unit: o.unit, status: 'publicada', headline: i === 0, sort: i }))
  };
}
// true quando a consulta é a do catálogo/perfil público (pede slug)
export const ehCatalogo = (u) => /select=slug/.test(u.search);
