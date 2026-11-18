import DocumentShell, { metadata as base } from '../../components/DocumentShell.js';
import { INTERNATIONAL_SITE } from '../../lib/domains.js';
export { viewport } from '../../components/DocumentShell.js';
export const metadata = { ...base, metadataBase: new URL(INTERNATIONAL_SITE) };
export default function Layout({ children }) { return <DocumentShell lang="en">{children}</DocumentShell>; }
