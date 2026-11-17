// Ainda não há programas publicados: o arquivo existe (o Google já o conhece) e fica vazio até haver páginas de programa.
import { xml } from '../../lib/sitemaps.js';

export const revalidate = 86400;
export function GET() { return xml([]); }
