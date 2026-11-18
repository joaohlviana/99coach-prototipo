import { xml } from '../../lib/sitemaps.js';
import { INTERNATIONAL_SITE } from '../../lib/domains.js';
export const revalidate = 86400;
export function GET() { return xml([{loc: INTERNATIONAL_SITE + '/'}]); }
