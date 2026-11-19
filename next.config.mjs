/** @type {import('next').NextConfig} */
const config = {
  // o catálogo e o cadastro de esportes são lidos no servidor para montar as páginas públicas
  outputFileTracingIncludes: { '/**': ['./public/data/treinadores.json', './public/data/municipios.json', './public/js/sports.js'] },
  // a busca ao vivo e os detalhes de perfil ainda vêm da API do site anterior
  async rewrites() { return [{ source: '/api/:path*', destination: 'https://99coach-prototipo.vercel.app/api/:path*' }]; },
  // endereços do site anterior levam à tela equivalente daqui (links antigos e favoritos continuam funcionando)
  async redirects() {
    const r = (source, destination) => ({ source, destination, permanent: false });
    return [
      // enquanto o domínio internacional (INTL_URL) não está ligado, 99coach.com leva ao mesmo endereço no .com.br;
      // com ele ligado, o .com serve inglês e espanhol (ver proxy.js) e esta regra sai
      ...(process.env.INTL_URL ? [] : [{ source: '/:path*', has: [{ type: 'host', value: '^(www\\.)?99coach\\.com$' }], destination: 'https://www.99coach.com.br/:path*', permanent: true }]),
      r('/entrar', '/app#onboarding-entrar'), r('/recuperar', '/app#onboarding-entrar'),
      r('/cadastro/treinador', '/app#onboarding-treinador'), r('/cadastro/treinador/previa', '/app#onboarding-treinador'),
      r('/painel', '/app'), r('/painel/:resto*', '/app'), r('/dashboard', '/app'), r('/conta', '/app'), r('/conta/:resto*', '/app'),
      r('/mensagens', '/app'), r('/agenda', '/app'), r('/indicadores', '/app'), r('/vinculos', '/app'),
      // páginas públicas da ajuda são do servidor (indexáveis); o formulário de suporte continua no app
      { source: '/termos', destination: '/ajuda/termos', statusCode: 301 }, { source: '/privacidade', destination: '/ajuda/privacidade', statusCode: 301 },
      { source: '/cookies', destination: '/ajuda/cookies', statusCode: 301 }, { source: '/pagamentos-e-reembolsos', destination: '/ajuda/pagamentos', statusCode: 301 },
      r('/contato', '/app#publico-ajuda'),
      r('/remocao', '/app#publico-ajuda'), r('/reivindicar/:slug', '/treinador/:slug'),
      { source: '/esporte/:slug', destination: '/treinadores/:slug', statusCode: 301 }, { source: '/busca', destination: '/buscar', statusCode: 301 },
      r('/c/:codigo', '/app#publico-convite-:codigo')
    ];
  },
  async headers() {
    // cabeçalhos de segurança em todas as páginas: o site não abre dentro de outro site, só fala com o próprio servidor e com o banco,
    // e não vaza o endereço de origem para terceiros
    const csp = ["default-src 'self'", "script-src 'self' 'unsafe-inline'", "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob: https:", "font-src 'self' data:",
      "connect-src 'self' https://rycaxboqkkiopjdecgld.supabase.co", "frame-src https://www.youtube-nocookie.com", "media-src 'self' blob: https://rycaxboqkkiopjdecgld.supabase.co", "frame-ancestors 'none'", "base-uri 'self'", "form-action 'self'", "object-src 'none'"].join('; ');
    const seguranca = [
      { key: 'Content-Security-Policy', value: csp },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), payment=()' }
    ];
    return [
      { source: '/(.*)', headers: seguranca },
      // o pacote do app e os estilos levam a versão no endereço (?v=...): podem ficar um ano no navegador
      { source: '/shell/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      // imagens e fontes têm nome fixo pelo conteúdo: podem ficar um ano no navegador; estilos e catálogo, uma hora com revalidação em segundo plano
      { source: '/next-loader.js', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      { source: '/img/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      { source: '/fonts/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
      { source: '/css/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' }] },
      { source: '/data/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=300, stale-while-revalidate=86400' }] },
      { source: '/app', headers: [{ key: 'X-Robots-Tag', value: 'noindex' }] }
    ];
  }
};
export default config;
