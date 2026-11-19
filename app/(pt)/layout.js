// Layout raiz das páginas em português.
import RootHtml from '../../components/RootHtml.js';
export { metadata, viewport } from '../../components/RootHtml.js';

export default function Layout({ children }) {
  return <RootHtml lang="pt-BR">{children}</RootHtml>;
}
