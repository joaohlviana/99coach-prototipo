import Raiz, { metadataRaiz, viewportRaiz } from '../../components/Raiz.js';

export const metadata = metadataRaiz;
export const viewport = viewportRaiz;
export default function Layout({ children }) { return <Raiz lang="pt-BR">{children}</Raiz>; }
