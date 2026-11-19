// Índice de sitemaps (como no site anterior, já cadastrado no Google com este nome).
// Cada domínio lista o que é seu: no .com.br, o português; no domínio internacional (.com), inglês e espanhol.
import { headers } from 'next/headers';
import { indice } from '../../lib/sitemaps.js';
import { intlHost } from '../../lib/rotas.js';

export const dynamic = 'force-dynamic';
export async function GET() {
  const host = ((await headers()).get('host') || '').split(':')[0];
  return indice(!!intlHost() && host === intlHost());
}
