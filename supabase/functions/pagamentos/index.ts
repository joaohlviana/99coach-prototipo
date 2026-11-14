// Pagamentos (Stripe Connect, cobrança direta na conta do treinador, comissão de 5% como application fee).
// Modo real (produção) por decisão do dono em 13/11/2026. O ambiente da chave tem de ser o mesmo que o banco está usando:
// chave de teste com banco em modo real (ou o contrário) é recusada, para nunca misturar os dois.
// Ações (sempre com o usuário logado):
//   estado   -> situação da conta de recebimento do treinador
//   ativar   -> cria a conta do treinador no Stripe (se não existir) e devolve o link de cadastro do Stripe
//   checkout -> cria a página de pagamento do pedido aceito (o valor e a comissão vêm do banco, nunca do navegador)
//   pro_estado, pro_assinar, pro_cancelar, pro_retomar -> assinatura Pro do treinador
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
    // sem registrar a sessão no pedido, o aviso de pagamento não seria reconhecido: melhor não cobrar
    const att = await db.rpc("srv_attach_session", { p_intent: intent, p_session: s.data.id });
    if (att.error) return json({ ok: false, motivo: "nao_registrou_cobranca" }, 500);
    return json({ ok: true, url: s.data.url });
  }
  // ---------- Assinatura Pro (cobrança da 99coach ao treinador; separada do que ele recebe dos alunos) ----------
  // pro_estado  -> situação da assinatura, conferida no Stripe e gravada no banco
  // pro_assinar -> página de pagamento da assinatura (mensal R$ 99 ou anual R$ 990), com 7 dias de teste na primeira vez
  // pro_cancelar / pro_retomar -> desliga ou religa a renovação; o Pro vale até o fim do período já pago
  if (acao.startsWith("pro_")) {
    const { data: t } = await db.rpc("srv_subscription_of", { p_user: user.id });
    if (!t?.trainer) return json({ ok: false, motivo: "sem_perfil_de_treinador" });
    if (t.env !== env) return json({ ok: false, motivo: "chave_de_outro_ambiente" });
    const mine = t.subEnv === env;
    let customer: string | null = mine ? t.customer : null;
    const sync = async (sub: Record<string, any> | null) => {
      if (!sub) return null;
      const it = sub.items?.data?.[0] ?? {};
      const end = sub.current_period_end ?? it.current_period_end ?? null;
      const { error } = await db.rpc("srv_set_subscription", { p_trainer: t.trainer, p_env: env, p_customer: customer, p_subscription: sub.id, p_status: sub.status,
        p_interval: it.price?.recurring?.interval ?? it.plan?.interval ?? null, p_trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
        p_period_end: end ? new Date(end * 1000).toISOString() : null, p_cancel_at_end: !!sub.cancel_at_period_end });
      if (error) return null;
      return { ok: true, real: env === "live", plano: ["trialing", "active", "past_due"].includes(sub.status) ? "pro" : "essencial", status: sub.status,
        ciclo: it.price?.recurring?.interval ?? null, testeAte: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
        periodoAte: end ? new Date(end * 1000).toISOString() : null, cancelaNoFim: !!sub.cancel_at_period_end };
    };
    // a assinatura mais recente deste cliente no Stripe é a verdade
    const atual = async () => {
      if (!customer) return null;
      const l = await stripe(key, "GET", `/v1/subscriptions?customer=${customer}&status=all&limit=3`);
      if (!l.ok) return undefined;
      const subs = (l.data.data ?? []) as Record<string, any>[];
      return subs.find((x) => ["trialing", "active", "past_due"].includes(x.status)) ?? subs[0] ?? null;
    };

    if (acao === "pro_estado") {
      const sub = await atual();
      if (sub === undefined) return json({ ok: false, motivo: "tente_de_novo" });
      if (!sub) return json({ ok: true, real: env === "live", plano: "essencial", status: null, jaTeveTeste: false });
      const r = await sync(sub);
      return r ? json(r) : json({ ok: false, motivo: "banco_recusou" }, 500);
    }

    if (acao === "pro_assinar") {
      const ciclo = body.ciclo === "year" ? "year" : "month";
      const sub = await atual();
      if (sub === undefined) return json({ ok: false, motivo: "tente_de_novo" });
      if (sub && ["trialing", "active", "past_due"].includes(sub.status)) { await sync(sub); return json({ ok: false, motivo: "ja_assinante" }); }
      if (!customer) {
        const c = await stripe(key, "POST", "/v1/customers", { email: user.email, name: t.name, metadata: { trainer: t.trainer } }, { idem: `cliente-pro:${env}:${t.trainer}` });
        if (!c.ok) return json({ ok: false, motivo: "stripe_recusou", detalhe: c.data?.error?.code ?? c.status });
        customer = c.data.id;
        const { error } = await db.rpc("srv_set_subscription", { p_trainer: t.trainer, p_env: env, p_customer: customer, p_subscription: null, p_status: null, p_interval: null, p_trial_end: null, p_period_end: null, p_cancel_at_end: false });
        if (error) return json({ ok: false, motivo: "banco_recusou" }, 500);
      }
      const s = await stripe(key, "POST", "/v1/checkout/sessions", {
        mode: "subscription", customer, locale: "pt-BR", client_reference_id: t.trainer,
        line_items: [{ quantity: 1, price_data: { currency: "brl", unit_amount: ciclo === "year" ? 99000 : 9900, recurring: { interval: ciclo }, product_data: { name: "99coach Pro" } } }],
        // teste de 7 dias só para quem nunca assinou
        subscription_data: { metadata: { trainer: t.trainer }, ...(sub ? {} : { trial_period_days: 7 }) },
        metadata: { trainer: t.trainer, produto: "pro" },
        success_url: `${SITE}/app#treinador-assinatura`, cancel_url: `${SITE}/app#treinador-assinatura`,
      });
      if (!s.ok || !s.data.url) return json({ ok: false, motivo: "stripe_recusou", detalhe: s.data?.error?.code ?? s.status });
      return json({ ok: true, url: s.data.url });
    }

    if (acao === "pro_cancelar" || acao === "pro_retomar") {
      const sub = await atual();
      if (sub === undefined) return json({ ok: false, motivo: "tente_de_novo" });
      if (!sub || !["trialing", "active", "past_due"].includes(sub.status)) return json({ ok: false, motivo: "sem_assinatura" });
      const u2 = await stripe(key, "POST", `/v1/subscriptions/${sub.id}`, { cancel_at_period_end: acao === "pro_cancelar" });
      if (!u2.ok) return json({ ok: false, motivo: "stripe_recusou", detalhe: u2.data?.error?.code ?? u2.status });
      const r = await sync(u2.data);
      return r ? json(r) : json({ ok: false, motivo: "banco_recusou" }, 500);
    }
  }

  return json({ ok: false, motivo: "acao_desconhecida" }, 400);
});
