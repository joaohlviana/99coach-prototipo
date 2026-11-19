// Endereço que não corresponde a nenhuma rota: a mesma página de "não encontrado", na moldura em português.
import Raiz, { metadataRaiz, viewportRaiz } from '../components/Raiz.js';
import NotFound from './(pt)/not-found.js';

export const metadata = { ...metadataRaiz, title: 'Página não encontrada', robots: { index: false, follow: true } };
export const viewport = viewportRaiz;
export default function GlobalNotFound() { return <Raiz lang="pt-BR"><NotFound /></Raiz>; }
