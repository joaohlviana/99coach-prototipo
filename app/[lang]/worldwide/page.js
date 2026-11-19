// Worldwide em inglês e espanhol (/en/worldwide, /es/worldwide; no .com: /worldwide e /es/worldwide).
import { notFound } from 'next/navigation';
import { Mundo, metaMundo } from '../../../components/PaginaCidadeMundo.js';
import { ok } from '../../../lib/i18n.js';

export const revalidate = 3600;
export const dynamicParams = true;
export async function generateStaticParams() { return []; }
export async function generateMetadata({ params }) { const { lang: l } = await params; return ok(l) ? metaMundo(l) : { title: 'Not found', robots: { index: false } }; }
export default async function Page({ params }) { const { lang: l } = await params; if (!ok(l)) notFound(); return <Mundo l={l} />; }
