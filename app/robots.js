import { SITE, INDEXAR } from '../lib/catalogo.js';

// Homologação não é indexada. Em produção (INDEXAR=1) tudo é liberado, menos as áreas com conta.
// O código e os estilos do app (/shell/) ficam liberados: o Google precisa deles para ver a página como o visitante.
export default function robots() {
  return INDEXAR
    ? { rules: [{ userAgent: '*', allow: '/', disallow: ['/app', '/api/'] }], sitemap: SITE + '/sitemap.xml' }
    : { rules: [{ userAgent: '*', disallow: '/' }] };
}
