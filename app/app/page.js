import Shell from '../../components/Shell.js';

// Áreas com conta (painel do treinador, área do aluno, cadastro, ajuda). A tela vem depois do # e nada aqui é indexado.
export const metadata = { title: 'Minha área', robots: { index: false, follow: false } };
export default function Page() {
  return (
    <Shell route={null}>
      <section className="ssr-hero"><h1>Abrindo sua área…</h1><p>Se nada acontecer em alguns segundos, <a href="/">volte para a página inicial</a>.</p></section>
    </Shell>
  );
}
