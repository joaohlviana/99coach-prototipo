import { indice } from '../../lib/sitemaps.js';
export const revalidate = 86400;
export function GET() { return indice(true); }
