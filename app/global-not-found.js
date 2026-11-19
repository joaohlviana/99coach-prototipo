// 404 de endereços que não caem em nenhum layout raiz (o site tem dois: (pt) e [lang]).
import RootHtml from '../components/RootHtml.js';
import NotFound from './(pt)/not-found.js';
export { viewport } from '../components/RootHtml.js';

export const metadata = { title: 'Página não encontrada', robots: { index: false, follow: true } };
export default function GlobalNotFound() {
  return <RootHtml lang="pt-BR"><NotFound /></RootHtml>;
}
