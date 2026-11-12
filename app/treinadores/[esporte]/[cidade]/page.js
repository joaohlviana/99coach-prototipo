import PaginaEsporte, { dados, metadados } from '../../../../components/PaginaEsporte.js';

// [cidade] é o endereço da cidade (londrina-pr) ou "online"
export const revalidate = 86400;
export const dynamicParams = true;
export async function generateStaticParams() { return []; }
export async function generateMetadata({ params }) { const { esporte, cidade } = await params; return metadados(dados(esporte, cidade)); }
export default async function Page({ params }) { const { esporte, cidade } = await params; return <PaginaEsporte esporteSlug={esporte} ondeSlug={cidade} />; }
