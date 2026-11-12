import { SITE, INDEXAR } from '../lib/catalogo.js';

// Homologação não é indexada. Em produção (INDEXAR=1) tudo é liberado, menos as áreas com conta.
export default function robots() {
  return INDEXAR
    ? { rules: [{ userAgent: '*', allow: '/', disallow: ['/app', '/api/', '/shell/'] }], sitemap: SITE + '/sitemap.xml' }
    : { rules: [{ userAgent: '*', disallow: '/' }] };
}
