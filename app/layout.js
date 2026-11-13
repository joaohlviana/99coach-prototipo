import { SITE, INDEXAR } from '../lib/catalogo.js';

export const metadata = {
  metadataBase: new URL(SITE),
  title: { default: '99coach — encontre seu treinador', template: '%s | 99coach' },
  description: '99coach: encontre treinadores por esporte e cidade, peça acompanhamento e treine com quem você escolher.',
  robots: INDEXAR ? { index: true, follow: true } : { index: false, follow: false },
  openGraph: { siteName: '99coach', locale: 'pt_BR', type: 'website', images: [{ url: '/img/og-99coach.png', width: 1200, height: 630, alt: '99coach' }] },
  twitter: { card: 'summary_large_image', images: ['/img/og-99coach.png'] },
  manifest: '/manifest.webmanifest'
};
export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

// As folhas de estilo são as do design system; as de cada área ficam desligadas (media="not all")
// e o app liga a da tela aberta. `ssr.css` veste o conteúdo que o servidor entrega antes de o app assumir.
const AREAS = ['home', 'esporte', 'perfil', 'servico', 'onboarding', 'telas', 'treinador', 'aluno', 'publico', 'operacao'];

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <base href="/" />
        <link rel="stylesheet" href="/css/base.css" />
        <link rel="stylesheet" href="/css/fonts.css" />
        <link rel="stylesheet" href="/css/shell.css" />
        <link rel="stylesheet" href="/css/ssr.css" />
        {AREAS.map((a) => <link key={a} rel="stylesheet" id={'css-' + a} media="not all" href={'/css/' + a + '.css'} />)}
        <link rel="stylesheet" id="css-adapt" href="/css/adapt.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
