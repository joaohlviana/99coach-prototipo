// Pagamentos (Stripe Connect, cobrança direta na conta do treinador, comissão de 5% como application fee).
// Modo real (produção) por decisão do dono em 13/11/2026. O ambiente da chave tem de ser o mesmo que o banco está usando:
// chave de teste com banco em modo real (ou o contrário) é recusada, para nunca misturar os dois.
// Ações (sempre com o usuário logado):
//   estado   -> situação da conta de recebimento do treinador
//   ativar   -> cria a conta do treinador no Stripe (se não existir) e devolve o link de cadastro do Stripe
//   checkout -> cria a página de pagamento do pedido aceito (o valor e a comissão vêm do banco, nunca do navegador)
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SITE = Deno.env.get("SITE_URL") ?? "https://99coach-prototipo-39pr.vercel.app";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

function form(o: Record<string, unknown>, prefix = "", out: string[] = []): string[] {
  for (const [k, v] of Object.entries(o)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) v.forEach((x, i) => (typeof x === "object" ? form(x as Record<string, unknown>, `${key}[${i}]`, out) : out.push(`${encodeURIComponent(`${key}[${i}]`)}=${encodeURIComponent(String(x))}`)));
    else if (typeof v === "object") form(v as Record<string, unknown>, key, out);
    else out.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
  }
  return out;
}
async function stripe(key: string, method: string, path: string, body?: Record<string, unknown>, opts: { account?: string; idem?: string } = {}) {
  const headers: Record<string, string> = { Authorization: `Bearer ${key}` };
  if (opts.account) headers["Stripe-Account"] = opts.account;
  if (opts.idem) headers["Idempotency-Key"] = opts.idem;
  if (body) headers["Content-Type"] = "application/x-www-form-urlencoded";
  const r = await fetch(`https://api.stripe.com${path}`, { method, headers, body: body ? form(body).join("&") : undefined });
  const d = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, data: d as Record<string, any> };
}
const caps = (a: Record<string, any>) => a?.capabilities ?? {};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ ok: false, motivo: "metodo" }, 405);
  const key = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: u } = await db.auth.getUser(token);
  const user = u?.user;
  if (!user) return json({ ok: false, motivo: "sem_sessao" }, 401);
  const body = await req.json().catch(() => ({}));
  const acao = String(body.acao ?? "");
  if (!key) return json({ ok: false, motivo: "pagamentos_nao_configurados" });
  const env = /^(sk|rk)_live_/.test(key) ? "live" : /^(sk|rk)_test_/.test(key) ? "sandbox" : "";
  if (!env) return json({ ok: false, motivo: "pagamentos_nao_configurados" });

  if (acao === "estado" || acao === "ativar") {
    const { data: t } = await db.rpc("srv_trainer_of", { p_user: user.id });
    if (!t?.trainer) return json({ ok: false, motivo: "sem_perfil_de_treinador" });
    if (t.env !== env) return json({ ok: false, motivo: "chave_de_outro_ambiente" });
    // conta criada em outro ambiente não serve: cria outra neste
    let account: string | null = t.account && t.accountEnv === env ? t.account : null;
    if (!account && acao === "estado") return json({ ok: true, real: env === "live", conta: false });
    if (!account) {
      const c = await stripe(key, "POST", "/v1/accounts", {
        country: "BR", email: user.email, business_profile: { name: t.name, product_description: "Treinamento físico e acompanhamento esportivo" },
        controller: { fees: { payer: "account" }, losses: { payments: "stripe" }, stripe_dashboard: { type: "full" } },
        capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
        metadata: { trainer: t.trainer },
      }, { idem: `conta:${env}:${t.trainer}` });
      if (!c.ok) return json({ ok: false, motivo: "stripe_recusou_conta", detalhe: c.data?.error?.code ?? c.status });
      account = c.data.id;
      // grava a conta assim que ela existe: se a consulta seguinte falhar, a próxima tentativa reaproveita esta conta
      await db.rpc("srv_set_payment_account", { p_trainer: t.trainer, p_account: account, p_charges: false, p_payouts: false, p_submitted: false, p_fees_payer: null, p_capabilities: {}, p_env: env });
    }
    const a = await stripe(key, "GET", `/v1/accounts/${account}`);
    if (!a.ok) return json({ ok: false, motivo: "conta_indisponivel" });
    await db.rpc("srv_set_payment_account", { p_trainer: t.trainer, p_account: account, p_charges: !!a.data.charges_enabled, p_payouts: !!a.data.payouts_enabled,
      p_submitted: !!a.data.details_submitted, p_fees_payer: a.data.controller?.fees?.payer ?? null, p_capabilities: caps(a.data), p_env: env });
    const estado = { ok: true, real: env === "live", conta: true, cobrancas: !!a.data.charges_enabled, repasses: !!a.data.payouts_enabled, cadastroEnviado: !!a.data.details_submitted,
      pendencias: (a.data.requirements?.currently_due ?? []).length };
    if (acao === "estado") return json(estado);
    const l = await stripe(key, "POST", "/v1/account_links", { account, type: "account_onboarding",
      refresh_url: `${SITE}/app#treinador-recebimentosreal`, return_url: `${SITE}/app#treinador-recebimentosreal` });
    if (!l.ok) return json({ ok: false, motivo: "link_indisponivel", detalhe: l.data?.error?.code ?? l.status });
    return json({ ...estado, url: l.data.url });
  }

  if (acao === "checkout") {
    const intent = String(body.intent ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(intent)) return json({ ok: false, motivo: "intencao_invalida" }, 400);
    const { data: c } = await db.rpc("srv_checkout_context", { p_intent: intent, p_buyer: user.id });
    if (!c) return json({ ok: false, motivo: "cobranca_nao_encontrada" }, 404);
    if (c.environment !== env) return json({ ok: false, motivo: "chave_de_outro_ambiente" });
    if (c.status !== "aguardando_pagamento" || c.orderStatus !== "aguardando_pagamento") return json({ ok: false, motivo: "cobranca_fechada", estado: c.orderStatus });
    if (!c.sellerAccount || !c.chargesEnabled) return json({ ok: false, motivo: "vendedor_sem_recebimento" });
    // uma cobrança tem uma única página de pagamento: nunca se cria a segunda (evita pagar duas vezes).
    // Página vencida fecha a cobrança pelo aviso do Stripe; o próximo "pagar" abre uma cobrança nova.
    if (c.session) {
      const s = await stripe(key, "GET", `/v1/checkout/sessions/${c.session}`, undefined, { account: c.sellerAccount });
      if (!s.ok) return json({ ok: false, motivo: "tente_de_novo" });
      if (s.data.status === "open" && s.data.url) return json({ ok: true, url: s.data.url });
      if (s.data.status === "complete") return json({ ok: false, motivo: "pagamento_em_confirmacao" });
      return json({ ok: false, motivo: "pagina_vencida" });
    }
    const methods = ((c.methods ?? []) as string[]).filter((m) => m === "card" || m === "boleto");
    const s = await stripe(key, "POST", "/v1/checkout/sessions", {
      mode: "payment", client_reference_id: c.order, locale: "pt-BR",
      line_items: [{ quantity: 1, price_data: { currency: String(c.currency).toLowerCase(), unit_amount: c.amountCents, product_data: { name: c.description } } }],
      payment_method_types: methods.length ? methods : ["card"],
      payment_intent_data: { application_fee_amount: c.applicationFeeCents, metadata: { intent, order: c.order } },
      metadata: { intent, order: c.order },
      success_url: `${SITE}/app#aluno-hoje`, cancel_url: `${SITE}/app#aluno-hoje`,
    }, { account: c.sellerAccount, idem: `checkout:${intent}` });
    if (!s.ok || !s.data.url) return json({ ok: false, motivo: "stripe_recusou_cobranca", detalhe: s.data?.error?.code ?? s.status });
    await db.rpc("srv_attach_session", { p_intent: intent, p_session: s.data.id });
    return json({ ok: true, url: s.data.url });
  }
  return json({ ok: false, motivo: "acao_desconhecida" }, 400);
});
