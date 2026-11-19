import { CidadeIdioma, metaIdioma } from '../../page.js';
export const revalidate = 3600;
export const dynamicParams = true;
export async function generateStaticParams() { return []; }
const num = (n) => { const v = parseInt(n, 10); return String(v) === String(n) && v >= 2 ? v : -1; };
export async function generateMetadata({ params }) { const { lang, cidade, n } = await params; return metaIdioma(lang, cidade, num(n)); }
export default async function Page({ params }) { const { lang, cidade, n } = await params; return <CidadeIdioma l={lang} k={cidade} pagina={num(n)} />; }
