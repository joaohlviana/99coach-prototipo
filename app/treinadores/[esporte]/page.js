import PaginaEsporte, { dados, metadados } from '../../../components/PaginaEsporte.js';

export const revalidate = 86400;
export const dynamicParams = true;
import { esportes } from '../../../lib/catalogo.js';
// as páginas de esporte saem prontas no build; as demais são montadas no primeiro acesso e ficam guardadas por um dia
export async function generateStaticParams() { return esportes().map((s) => ({ esporte: s.slug })); }
export async function generateMetadata({ params }) { const { esporte } = await params; return metadados(dados(esporte, '')); }
export default async function Page({ params }) { const { esporte } = await params; return <PaginaEsporte esporteSlug={esporte} ondeSlug="" />; }
