// Fatia do catálogo com os profissionais de uma modalidade (o navegador não precisa baixar o catálogo inteiro).
import { fatiaEsporte } from '../../../../lib/catalogo.js';

export const revalidate = 3600;
export async function GET(_req, { params }) {
  const { esporte } = await params;
  const d = fatiaEsporte(String(esporte || ''));
  if (!d) return Response.json({ items: [] }, { status: 404 });
  return Response.json(d, { headers: { 'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400' } });
}
