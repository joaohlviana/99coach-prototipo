import DocumentShell, { metadata as base } from '../../components/DocumentShell.js';
import { INTERNATIONAL_SITE } from '../../lib/domains.js';
export { viewport } from '../../components/DocumentShell.js';
export const metadata = { ...base, metadataBase: new URL(INTERNATIONAL_SITE) };
export default async function Layout({ children, params }) { const { lang } = await params; return <DocumentShell lang={['en', 'es'].includes(lang) ? lang : 'pt-BR'}>{children}</DocumentShell>; }
