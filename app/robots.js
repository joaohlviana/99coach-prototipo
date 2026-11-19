import { headers } from 'next/headers';
import { SITE, INDEXAR } from '../lib/catalogo.js';
import { intl, intlHost } from '../lib/rotas.js';

// Homologação não é indexada. Em produção (INDEXAR=1) tudo é liberado, menos as áreas com conta.
// O código e os estilos do app (/shell/) ficam liberados: o Google precisa deles para ver a página como o visitante.
// Cada domínio lista os seus sitemaps: o .com.br, o português; o internacional (.com), inglês e espanhol.
export default async function robots() {
  if (!INDEXAR) return { rules: [{ userAgent: '*', disallow: '/' }] };
  const host = ((await headers()).get('host') || '').split(':')[0];
  const noIntl = intl() && host === intlHost();
  return { rules: [{ userAgent: '*', allow: '/', disallow: ['/app', '/api/'] }], sitemap: noIntl ? [intl() + '/sitemap-en.xml', intl() + '/sitemap-es.xml'] : SITE + '/sitemap.xml' };
}
