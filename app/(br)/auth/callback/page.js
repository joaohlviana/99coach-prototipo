// Volta do login com Google quando o Supabase devolve para o endereço antigo (/auth/callback):
// leva a pessoa para o app com a sessão que veio no endereço, em vez de uma página de "não encontrado".
export const metadata = { title: 'Entrando…', robots: { index: false, follow: true } };
export default function Callback() {
  return (
    <main style={{ padding: 40, fontFamily: 'system-ui, sans-serif' }}>
      <p role="status">Entrando…</p>
      <script dangerouslySetInnerHTML={{ __html: "location.replace('/app' + (location.hash || '#onboarding-entrar'));" }} />
      <noscript><a href="/app">Continuar</a></noscript>
    </main>
  );
}
