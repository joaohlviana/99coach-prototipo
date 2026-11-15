// Fatia do catálogo com um perfil e os profissionais parecidos da mesma cidade.
import { fatiaPerfil } from '../../../../lib/catalogo.js';

export const revalidate = 3600;
export async function GET(_req, { params }) {
  const { slug } = await params;
  const d = fatiaPerfil(String(slug || ''));
  if (!d) return Response.json({ items: [] }, { status: 404 });
  return Response.json(d, { headers: { 'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400' } });
}
