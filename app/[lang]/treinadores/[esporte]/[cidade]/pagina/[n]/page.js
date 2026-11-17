import PaginaEsporteIdioma, { metadadosIdioma } from '../../../../../../../components/PaginaEsporteIdioma.js';
export const revalidate = 3600;
export const dynamicParams = true;
export async function generateStaticParams() { return []; }
export async function generateMetadata({ params }) { const { lang, esporte, cidade, n } = await params; return metadadosIdioma(lang, esporte, cidade, Number(n)); }
export default async function Page({ params }) { const { lang, esporte, cidade, n } = await params; return <PaginaEsporteIdioma l={lang} esporteSlug={esporte} ondeSlug={cidade} pagina={Number(n)} />; }
