import http from 'node:http';
import assert from 'node:assert/strict';
import { domainRoute } from '../lib/domain-routing.js';
import { languageAlternates } from '../lib/domains.js';
const base=process.env.TEST_BASE || 'http://localhost:5173';
let checks=0;
function check(v,msg){assert.ok(v,msg);checks++;}
function get(path,host='99coach.com'){return new Promise((resolve,reject)=>{http.get(base+path,{headers:{host}},r=>{let html='';r.on('data',s=>html+=s);r.on('end',()=>resolve({status:r.statusCode,location:r.headers.location,html}));}).on('error',reject);});}
for(const p of ['/en','/es','/en/treinadores/judo','/es/cidade/londrina-pr']) {const r=await get(p,'www.99coach.com.br');check(r.status===308&&r.location==='https://99coach.com'+p,'BR localized migration '+p);}
for(const p of ['/','/en','/es/treinadores/judo']){const r=await get(p,'www.99coach.com');check(r.status===308&&r.location==='https://99coach.com'+p,'www normalization '+p);}
for(const [p,l,canonical] of [['/','en','https://99coach.com/'],['/en','en','https://99coach.com/en'],['/es','es','https://99coach.com/es'],['/en/treinadores/judo','en','https://99coach.com/en/treinadores/judo'],['/es/cidade/londrina-pr','es','https://99coach.com/es/cidade/londrina-pr']]) {
const r=await get(p);check(r.status===200,p+' status');check(r.html.includes('<html lang="'+l+'"'),p+' server language');check(r.html.includes('rel="canonical" href="'+canonical.replace(/\/$/,'')+'"'),p+' canonical');check(!/content="noindex/.test(r.html),p+' indexable');
const path=p==='/'||p==='/en'||p==='/es'?'/':p.slice(3);for(const [lang,url] of Object.entries(languageAlternates(path)))check(r.html.includes('hrefLang="'+lang+'" href="'+url.replace(/\/$/,'')+'"'),p+' alternate '+lang);
}
for(const path of ['/','/treinadores/judo','/cidade/londrina-pr']){const r=await get(path,'www.99coach.com.br');check(r.status===200&&r.html.includes('<html lang="pt-BR"'), 'BR preserved '+path);check(r.html.includes('rel="canonical" href="https://www.99coach.com.br'+(path==='/'?'':path)+'"')||r.html.includes('rel="canonical" href="https://www.99coach.com.br/"'),'BR canonical '+path);}
for(const path of ['/en/treinadores/nao-existe','/es/cidade/nao-existe','/en/treinadores/judo/pagina/999999']){const r=await get(path);check(r.status===404,path+' real 404');check(/noindex/.test(r.html),path+' noindex');}
for(const host of ['99coach.com','www.99coach.com.br']){const r=await get('/sitemap.xml',host);check(r.status===200,'sitemap status');const origin=host==='99coach.com'?'https://99coach.com/':'https://www.99coach.com.br/';const locs=[...r.html.matchAll(/<loc>(.*?)<\/loc>/g)].map(x=>x[1]);check(locs.length>0&&locs.every(x=>x.startsWith(origin)),'sitemap isolated '+host);for(const loc of locs){const xml=await get(new URL(loc).pathname,host);check(xml.status===200,'child sitemap '+loc);const urls=[...xml.html.matchAll(/<loc>(.*?)<\/loc>/g)].map(x=>x[1]);check(urls.every(u=>u.startsWith(origin)),'child URLs origin '+loc);check(new Set(urls).size===urls.length,'unique urls '+loc);}const robots=await get('/robots.txt',host);check(robots.status===200&&robots.html.includes(origin+'sitemap.xml'),'robots '+host);}
const search=await get('/es/buscar?q=Judo');check(search.status===200&&/noindex/.test(search.html)&&search.html.includes('<html lang="es"'),'localized search');
for(const host of ['99coach.com','www.99coach.com.br'])check(domainRoute(host,'/en','?utm_source=test')?.redirect === (host.includes('.br')?'https://99coach.com/en?utm_source=test':undefined),'query preservation');
console.log(JSON.stringify({passed:checks,base,timestamp:new Date().toISOString()}));
