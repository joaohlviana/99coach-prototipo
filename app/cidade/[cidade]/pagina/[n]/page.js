import { Cidade, meta } from '../../page.js';
export const revalidate = 86400;
export const dynamicParams = true;
export async function generateStaticParams() { return []; }
const num = (n) => { const v = parseInt(n, 10); return String(v) === String(n) && v >= 2 ? v : -1; };
export async function generateMetadata({ params }) { const { cidade, n } = await params; return meta(cidade, num(n)); }
export default async function Page({ params }) { const { cidade, n } = await params; return <Cidade k={cidade} pagina={num(n)} />; }
