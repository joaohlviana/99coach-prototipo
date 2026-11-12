import PaginaEsporte, { dados, metadados } from '../../../../../components/PaginaEsporte.js';
// páginas seguintes da lista do esporte (a primeira fica no endereço base)
export const revalidate = 86400;
export const dynamicParams = true;
export async function generateStaticParams() { return []; }
const num = (n) => { const v = parseInt(n, 10); return String(v) === String(n) && v >= 2 ? v : -1; };
export async function generateMetadata({ params }) { const { esporte, n } = await params; return metadados(dados(esporte, '', num(n))); }
export default async function Page({ params }) { const { esporte, n } = await params; return <PaginaEsporte esporteSlug={esporte} ondeSlug="" pagina={num(n)} />; }
