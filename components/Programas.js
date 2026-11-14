'use client';
// Programas publicados do treinador, com compra pelo Stripe (o valor e a comissão vêm do servidor, nunca daqui).
import { useEffect, useState } from 'react';

const URL0 = 'https://rycaxboqkkiopjdecgld.supabase.co';
const KEY = 'sb_publishable_dPQ0596gx0ok94wUE4POtw_T-QjY8Cq';
const brl = (c) => 'R$ ' + (c / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
const plural = (n, a, b) => n + ' ' + (n === 1 ? a : b);
const MSG = {
  ja_tem_acesso: 'Você já tem acesso a este programa. Abra em "Meus programas" na sua área.',
  programa_proprio: 'Este programa é seu.',
  vendedor_sem_recebimento: 'O treinador ainda não ativou o recebimento pelo 99coach. Nada foi cobrado.',
  programa_indisponivel: 'Este programa não está mais à venda.',
  aguardando_confirmacao: 'Já existe um pagamento deste programa aguardando confirmação (boleto ou Pix). Assim que confirmar, o acesso é liberado.',
  politica_pendente: 'A venda está pausada no momento. Nada foi cobrado.',
};

export default function Programas({ slug }) {
  const [lista, setLista] = useState(null);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  useEffect(() => {
    fetch(URL0 + '/rest/v1/programs?select=id,title,weeks,workouts,access_months,price_cents,description,trainers!inner(slug)&status=eq.publicado&trainers.slug=eq.' + encodeURIComponent(slug) + '&order=title.asc', { headers: { apikey: KEY } })
      .then((r) => (r.ok ? r.json() : [])).then((d) => setLista(Array.isArray(d) ? d : []), () => setLista([]));
  }, [slug]);
  if (!lista || !lista.length) return null;
  const comprar = async (p) => {
    if (busy) return;
    let s = null; try { s = JSON.parse(localStorage.getItem('c99.sessao') || 'null'); } catch (_) {}
    if (!s || !s.access_token) { location.href = '/app#onboarding-entrar'; return; }
    setBusy(p.id); setMsg('');
    const h = { apikey: KEY, Authorization: 'Bearer ' + s.access_token, 'Content-Type': 'application/json' };
    try {
      const r = await fetch(URL0 + '/rest/v1/rpc/buy_program', { method: 'POST', headers: h, body: JSON.stringify({ p_program: p.id, p_idem: 'prog:' + p.id + ':' + s.user.id + ':' + Date.now().toString(36) }) });
      if (r.status === 401) { location.href = '/app#onboarding-entrar'; return; }
      const d = await r.json();
      const o = Array.isArray(d) ? d[0] : d;
      if (!r.ok || !o || o.outcome !== 'aguardando_pagamento') { setBusy(''); setMsg(MSG[o && o.outcome] || 'Não foi possível abrir a compra agora. Nada foi cobrado.'); return; }
      const c = await fetch(URL0 + '/functions/v1/pagamentos', { method: 'POST', headers: h, body: JSON.stringify({ acao: 'checkout', intent: o.intent }) });
      const x = c.ok ? await c.json() : {};
      if (x.ok && x.url) { location.href = x.url; return; }
      setBusy(''); setMsg(x.motivo === 'vendedor_sem_recebimento' ? MSG.vendedor_sem_recebimento : 'Não foi possível abrir o pagamento agora. Nada foi cobrado.');
    } catch (_) { setBusy(''); setMsg('Sem conexão: nada foi cobrado.'); }
  };
  return (
    <section aria-labelledby="h-prog">
      <h2 id="h-prog">Programas</h2>
      <p>Planos prontos para seguir no seu ritmo. Acesso pelo período indicado, sem acompanhamento individual. Garantia de 7 dias.</p>
      <ul className="ssr-progs">{lista.map((p) => (
        <li key={p.id}>
          <b>{p.title}</b>
          <small>{plural(p.weeks, 'semana', 'semanas')} · {plural(p.workouts, 'treino', 'treinos')} · acesso por {plural(p.access_months, 'mês', 'meses')}</small>
          {p.description ? <span>{p.description}</span> : null}
          <button type="button" onClick={() => comprar(p)} disabled={!!busy}>{busy === p.id ? 'Abrindo pagamento…' : 'Comprar por ' + brl(p.price_cents)}</button>
        </li>))}
      </ul>
      {msg ? <p role="status">{msg}</p> : null}
    </section>
  );
}
