// Página pública para treinadores (indexável). O cadastro em si acontece no app.
// Texto: o mesmo da página inicial e do artigo "Como funciona" (nada novo prometido aqui).
import Shell from '../../../components/Shell.js';
import { SITE } from '../../../lib/catalogo.js';
import { artigo } from '../../../lib/ajuda.js';

export const revalidate = 86400;
export const metadata = {
  title: 'Para treinadores: perfil, treinos e alunos num lugar só',
  description: 'Chega de mandar PDF no WhatsApp: perfil, treinos no app, conversa e cobrança num lugar só. Grátis até 3 alunos.',
  alternates: { canonical: '/sou-treinador' }
};

export default function SouTreinador() {
  const como = artigo('comofunciona'), rec = artigo('repasses');
  const trilha = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Início', item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: 'Para treinadores', item: SITE + '/sou-treinador' }] };
  return (
    <Shell soServidor>
      <nav className="ssr-crumb" aria-label="Você está em"><a href="/">Início</a> › <span>Para treinadores</span></nav>
      <section className="ssr-hero">
        <h1>Chega de mandar PDF no WhatsApp</h1>
        <p>Perfil, treinos no app, conversa e cobrança num lugar só. Grátis até 3 alunos.</p>
        <p><a className="ssr-btn" href="/app#onboarding-treinador">Criar meu perfil grátis</a></p>
      </section>
      {como ? <section aria-labelledby="h-como"><h2 id="h-como">Como funciona</h2>{como.sections.map((s) => <p key={s.id}><b>{s.h}.</b> {s.body}</p>)}</section> : null}
      {rec ? <section aria-labelledby="h-rec"><h2 id="h-rec">{rec.title}</h2>{rec.sections.map((s) => <p key={s.id}><b>{s.h}.</b> {s.body}</p>)}<p><a href={rec.url}>Ler o artigo completo</a></p></section> : null}
      <section aria-labelledby="h-ja"><h2 id="h-ja">Já tem conta?</h2><p><a href="/app#onboarding-entrar">Entrar no painel</a> · <a href="/ajuda">Central de ajuda</a></p></section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(trilha).replace(/</g, '\\u003c') }} />
    </Shell>
  );
}
