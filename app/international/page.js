import { languageAlternates } from '../../lib/domains.js';
export const metadata = {
  title: { absolute: '99coach — Choose your language / Elige tu idioma' },
  description: 'Find coaches by sport and city, in person or online. Choose English, Español or Português.',
  alternates: { canonical: 'https://99coach.com/', languages: languageAlternates('/') },
  openGraph: { title: '99coach', description: 'Choose your language / Elige tu idioma', url: 'https://99coach.com/', type: 'website', images: ['/img/og-99coach.png'] }
};
const suggest = `(function(){try{var l=localStorage.getItem('99coach-language');if(!/^(en|es|pt-BR)$/.test(l||'')){var a=navigator.languages||[navigator.language||'en'];l='en';for(var i=0;i<a.length;i++){var k=a[i].split('-')[0];if(['en','es','pt'].includes(k)){l=k==='pt'?'pt-BR':k;break}}}var el=document.getElementById('language-'+l), hint=document.getElementById('language-hint');if(el&&hint){hint.textContent=l==='es'?'Idioma sugerido: Español':l==='pt-BR'?'Idioma sugerido: Português':'Suggested language: English';}}catch(e){}})();`;
export default function ChooseLanguage() {
  return <div id="ssr" className="ssr ssr--solo"><header className="ssr-top"><a className="ssr-logo" href="/" aria-label="99coach"><img src="/img/c994186ea30c1564.svg" alt="99coach" width="126" height="32" /></a></header><main id="conteudo-ssr"><section className="ssr-hero"><h1>Find your coach.</h1><p lang="es">Encuentra tu entrenador.</p><p lang="pt-BR">Encontre seu treinador.</p><p id="language-hint" className="ssr-note">Choose your language · Elige tu idioma · Escolha seu idioma</p><nav aria-label="Language"><ul className="ssr-chips">{[['en','English','https://99coach.com/en'],['es','Español','https://99coach.com/es'],['pt-BR','Português — Brasil','https://www.99coach.com.br/']].map(([l,n,url])=><li key={l}><a id={'language-'+l} data-language={l} href={url} lang={l} hrefLang={l}>{n}</a></li>)}</ul></nav></section></main><script dangerouslySetInnerHTML={{__html:suggest+"document.addEventListener('click',function(e){var a=e.target.closest('a[data-language]');if(a)try{localStorage.setItem('99coach-language',a.dataset.language)}catch(e){}});"}} /></div>;
}
