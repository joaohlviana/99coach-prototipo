// Começo do catálogo, na ordem de relevância: a página inicial mostra os primeiros treinadores sem baixar o catálogo inteiro.
import { fatiaInicio } from '../../../lib/catalogo.js';

export const revalidate = 3600;
export async function GET() {
  return Response.json(fatiaInicio(), { headers: { 'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400' } });
}
