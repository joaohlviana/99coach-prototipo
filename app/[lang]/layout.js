// Inglês e espanhol: a página já sai do servidor com o idioma certo (<html lang="en"> / "es").
import Raiz, { metadataRaiz, viewportRaiz } from '../../components/Raiz.js';

const LANG = { en: 'en', es: 'es' };
export const metadata = { ...metadataRaiz, openGraph: { ...metadataRaiz.openGraph, locale: undefined } };
export const viewport = viewportRaiz;
export default async function Layout({ children, params }) { const { lang } = await params; return <Raiz lang={LANG[lang] || 'pt-BR'}>{children}</Raiz>; }
