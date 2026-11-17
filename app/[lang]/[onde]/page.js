// Endereços do site anterior: /{esporte}/{uf} e /{esporte}/{cidade-uf}. Levam de vez à lista equivalente daqui.
import { notFound, permanentRedirect } from 'next/navigation';
import { esporte, cidadesDo } from '../../../lib/catalogo.js';

const UFS = 'ac al ap am ba ce df es go ma mt ms mg pa pb pr pe pi rj rn rs ro rr sc sp se to'.split(' ');
export const dynamicParams = true;
export async function generateStaticParams() { return []; }
export async function generateMetadata() { return { title: 'Página não encontrada', robots: { index: false } }; }

export default async function Antigo({ params }) {
  const { lang: e, onde } = await params;
  if (!esporte(e) || !/^[a-z0-9-]{2,80}$/.test(onde)) notFound();
  if (onde === 'online') permanentRedirect('/treinadores/' + e + '/online');
  if (UFS.includes(onde)) permanentRedirect('/treinadores/' + e + '?uf=' + onde);
  // cidade sem profissional presencial dessa modalidade hoje: vai para a lista nacional da modalidade (em vez de página inexistente)
  permanentRedirect(cidadesDo(e, 1).some((c) => c.slug === onde) ? '/treinadores/' + e + '/' + onde : '/treinadores/' + e);
}
