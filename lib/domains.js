export const BRAZIL_SITE = 'https://www.99coach.com.br';
export const INTERNATIONAL_SITE = 'https://99coach.com';
export const INDEXABLE = process.env.VERCEL_ENV !== 'preview' && process.env.VERCEL_ENV !== 'development' && process.env.INDEXAR !== '0' && (process.env.VERCEL_ENV === 'production' || process.env.INDEXAR === '1');
export const localeUrl = (lang, path = '/') => (lang === 'pt-BR' ? BRAZIL_SITE : INTERNATIONAL_SITE + '/' + lang) + (path === '/' && lang !== 'pt-BR' ? '' : path);
export const languageAlternates = (path = '/') => ({ 'pt-BR': localeUrl('pt-BR', path), en: localeUrl('en', path), es: localeUrl('es', path), 'x-default': path === '/' ? INTERNATIONAL_SITE + '/' : localeUrl('en', path) });
