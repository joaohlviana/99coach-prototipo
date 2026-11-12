/** @type {import('next').NextConfig} */
const config = {
  // o catálogo e o cadastro de esportes são lidos no servidor para montar as páginas públicas
  outputFileTracingIncludes: { '/**': ['./public/data/treinadores.json', './public/js/sports.js'] },
  // a busca ao vivo e os detalhes de perfil ainda vêm da API do site anterior
  async rewrites() { return [{ source: '/api/:path*', destination: 'https://99coach-prototipo.vercel.app/api/:path*' }]; },
  async headers() {
    return [
      { source: '/shell/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }] },
      { source: '/app', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }
    ];
  }
};
export default config;
