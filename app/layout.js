import { SITE, INDEXAR } from '../lib/catalogo.js';
import pacote from '../public/shell/version.json';
const V = '?v=' + pacote.v;

export const metadata = {
  metadataBase: new URL(SITE),
  title: { default: '99coach — encontre seu treinador', template: '%s | 99coach' },
  description: '99coach: encontre treinadores por esporte e cidade, peça acompanhamento e treine com quem você escolher.',
  robots: INDEXAR ? { index: true, follow: true } : { index: false, follow: true },
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
        <link rel="preload" href="/fonts/Anton-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <script dangerouslySetInnerHTML={{ __html: 'window.__V=' + JSON.stringify(pacote.v) + ';' }} />
        <link rel="stylesheet" href={'/shell/css/core.css' + V} />
        <link rel="stylesheet" id="css-adapt" href={'/shell/css/adapt.css' + V} />
        {/* a folha de cada tela só é baixada quando a tela abre; a da página atual começa já.
            As etiquetas são criadas por este trecho (fora do React), antes da folha de ajustes, para manter a ordem. */}
        <script dangerouslySetInnerHTML={{ __html: "(function(){var A=" + JSON.stringify(AREAS) + ",V=" + JSON.stringify(V) + ",ad=document.getElementById('css-adapt'),p=location.pathname,h=location.hash,n=p==='/'||/^\\/(en|es)\\/?$/.test(p)?'home':/\\/(treinadores|cidade|buscar)(\\/|$)/.test(p)?'esporte':/\\/treinador\\//.test(p)?'perfil':p==='/app'?(/^#(onboarding|publico|esporte|perfil|servico|treinador|aluno|operacao|telas)/.exec(h)||[0,'home'])[1]:'';A.forEach(function(a){var l=document.createElement('link');l.rel='stylesheet';l.id='css-'+a;l.media='not all';l.setAttribute('data-href','/shell/css/'+a+'.css'+V);if(a===n){l.href=l.getAttribute('data-href');if(p==='/'){l.media='all';l.setAttribute('blocking','render');l.onload=function(){document.documentElement.classList.add('espera-ok')}}}ad.parentNode.insertBefore(l,ad)})})();" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
