import { BRAZIL_SITE, INTERNATIONAL_SITE } from './domains.js';
// One URL per language. No redirect based on IP, cookies or Accept-Language.
export function domainRoute(host, pathname, search = '') {
  host = host.toLowerCase().split(':')[0];
  const brazil = ['99coach.com.br', 'www.99coach.com.br'].includes(host);
  const intl = ['99coach.com', 'www.99coach.com'].includes(host);
  if (host === 'www.99coach.com') return { redirect: INTERNATIONAL_SITE + pathname + search };
  if (brazil && /^\/(en|es)(\/|$)/.test(pathname)) return { redirect: INTERNATIONAL_SITE + pathname + search };
  if (brazil && /^\/sitemap-(en|es)\.xml$/.test(pathname)) return { redirect: INTERNATIONAL_SITE + pathname + search };
  if (intl) {
    if (pathname === '/') return { rewrite: '/international' };
    if (pathname === '/robots.txt') return { rewrite: '/international-robots.txt' };
    if (pathname === '/sitemap.xml') return { rewrite: '/sitemap-international.xml' };
    if (pathname === '/sitemap-static.xml') return { rewrite: '/sitemap-international-static.xml' };
    if (/^\/sitemap-(sports|filters|states|trainers|programs)\.xml$/.test(pathname)) return { redirect: BRAZIL_SITE + pathname + search };
    if (!/^\/(en|es)(\/|$)/.test(pathname) && !/^\/(?:_next|api|shell|img|fonts|css|js|data|dados)(\/|$)/.test(pathname) && !/\.[a-z0-9]+$/i.test(pathname)) return { redirect: BRAZIL_SITE + pathname + search };
  }
  if (pathname === '/international') return { redirect: INTERNATIONAL_SITE + '/' + search };
  if (pathname === '/international-robots.txt') return { redirect: INTERNATIONAL_SITE + '/robots.txt' };
  if (pathname === '/sitemap-international.xml') return { redirect: INTERNATIONAL_SITE + '/sitemap.xml' };
  if (pathname === '/sitemap-international-static.xml') return { redirect: INTERNATIONAL_SITE + '/sitemap-static.xml' };
  return null;
}
