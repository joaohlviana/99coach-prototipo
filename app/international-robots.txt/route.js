import { INDEXABLE, INTERNATIONAL_SITE } from '../../lib/domains.js';
export const dynamic = 'force-static';
export function GET() { return new Response(INDEXABLE ? 'User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ' + INTERNATIONAL_SITE + '/sitemap.xml\n' : 'User-agent: *\nDisallow: /\n', {headers: {'Content-Type': 'text/plain; charset=utf-8'}}); }
