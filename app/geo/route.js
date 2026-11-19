// País de onde a pessoa acessa (pela Vercel), para a busca começar em "Todo o Brasil" ou em "Worldwide".
// Não guarda nada no servidor; o navegador guarda o resultado por conta própria.
export const dynamic = 'force-dynamic';
export function GET(req) {
  const pais = (req.headers.get('x-vercel-ip-country') || '').toUpperCase();
  return Response.json({ pais: /^[A-Z]{2}$/.test(pais) ? pais : '' }, { headers: { 'Cache-Control': 'private, no-store' } });
}
