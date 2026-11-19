// Layout raiz das páginas em inglês e espanhol: o <html lang> sai do servidor já com o idioma da página.
// Outros valores em [lang] são endereços antigos (redirecionam) ou 404 e ficam em pt-BR.
import RootHtml from '../../components/RootHtml.js';
import { ok } from '../../lib/i18n.js';
export { metadata, viewport } from '../../components/RootHtml.js';

export default async function Layout({ children, params }) {
  const { lang } = await params;
  return <RootHtml lang={ok(lang) ? lang : 'pt-BR'}>{children}</RootHtml>;
}
