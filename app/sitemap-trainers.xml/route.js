import { xml, porPerfil } from '../../lib/sitemaps.js';

export const revalidate = 86400;
export function GET() { return xml(porPerfil()); }
