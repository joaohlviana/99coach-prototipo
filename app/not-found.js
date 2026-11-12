import Shell from '../components/Shell.js';
import { esportes } from '../lib/catalogo.js';

export const metadata = { title: 'Página não encontrada', robots: { index: false, follow: true } };
export default function NotFound() {
  return (
    <Shell route={{ name: 'home', params: {} }}>
      <section className="ssr-hero"><h1>Não encontramos esta página</h1><p>O endereço pode ter mudado, ou ainda não há treinadores para esta combinação de esporte e cidade.</p></section>
      <section aria-labelledby="h-esp"><h2 id="h-esp">Procure por esporte</h2>
        <ul className="ssr-chips">{esportes().slice(0, 20).map((s) => <li key={s.slug}><a href={'/treinadores/' + s.slug}>{s.label}</a></li>)}</ul></section>
    </Shell>
  );
}
