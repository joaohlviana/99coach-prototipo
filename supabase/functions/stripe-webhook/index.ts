// Recebe os avisos do Stripe (endpoint de Connect) e traduz para os eventos que o banco entende.
// Autenticidade: se houver STRIPE_WEBHOOK_SECRET, a assinatura é conferida. Em todos os casos o aviso é buscado de novo
// direto no Stripe pelo id, com a nossa chave, e é essa cópia que vale: um aviso forjado não existe no Stripe.
// Aviso de ambiente diferente do da chave (teste x real) é ignorado.
// Cada aviso de pagamento só vale se vier da conta do Stripe do vendedor daquele pedido E da página de pagamento que este
// app criou para ele. Assim, ninguém consegue marcar um pedido como pago (ou falho) com um pagamento feito em outro lugar.
// O banco é quem decide o resto: confere valor, moeda e comissão contra o pedido e trata repetição pelo id do aviso.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
function same(a: string, b: string) { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0; }
async function valid(raw: string, header: string, secret: string): Promise<boolean> {
  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]).filter((p) => p.length === 2 && p[0] !== "v1"));
  const sigs = header.split(",").filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  const t = Number(parts.t);
  if (!t || Math.abs(Date.now() / 1000 - t) > 300 || !sigs.length) return false;
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = hex(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(`${t}.${raw}`)));
  return sigs.some((s) => same(s, mac));
}
async function stripeGet(key: string, path: string, account?: string) {
  const headers: Record<string, string> = { Authorization: `Bearer ${key}` };
  if (account) headers["Stripe-Account"] = account;
  const r = await fetch(`https://api.stripe.com${path}`, { headers });
  return r.ok ? await r.json() : null;
}

Deno.serve(async (req: Request) => {
  const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json" } });
  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "", key = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
  if (!key) return json({ ok: false, motivo: "pagamentos_nao_configurados" }, 503);
  const raw = await req.text();
  if (secret && !(await valid(raw, req.headers.get("stripe-signature") ?? "", secret))) return json({ ok: false, motivo: "assinatura_invalida" }, 400);
  let got: any; try { got = JSON.parse(raw); } catch (_) { return json({ ok: false, motivo: "corpo_invalido" }, 400); }
  if (!/^evt_[A-Za-z0-9_]+$/.test(String(got?.id ?? "")) || (got.account && !/^acct_[A-Za-z0-9]+$/.test(String(got.account)))) return json({ ok: false, motivo: "aviso_invalido" }, 400);
  const ev = await stripeGet(key, `/v1/events/${got.id}`, got.account || undefined);
  if (!ev || ev.id !== got.id) return json({ ok: false, motivo: "aviso_nao_existe_no_stripe" }, 400);
  if (!!ev.livemode !== /^(sk|rk)_live_/.test(key)) return json({ ok: true, ignorado: "outro_ambiente" });
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const o = ev.data?.object ?? {}, account: string | undefined = ev.account;
  const ingest = async (type: string, payload: Record<string, unknown>) => {
    const { data, error } = await db.rpc("ingest_payment_event", { p_provider: "stripe", p_event: ev.id, p_type: type, p_payload: payload });
    return error ? json({ ok: false, motivo: "banco_recusou" }, 500) : json({ ok: true, resultado: data });
  };

  // o pedido a que o aviso diz se referir: tem de ser desta conta do Stripe e, quando informado, desta página de pagamento
  let semSessao = false;
  const confere = async (intent: unknown, session?: string): Promise<boolean> => {
    if (typeof intent !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(intent) || !account) return false;
    const { data: it } = await db.from("checkout_intents").select("id, provider_ref, orders(seller_account, checkout_session)").eq("id", intent).maybeSingle();
    const ord: any = it && (Array.isArray((it as any).orders) ? (it as any).orders[0] : (it as any).orders);
    if (!it || !ord || ord.seller_account !== account) return false;
    const guardada = ord.checkout_session ?? (it as any).provider_ref;
    if (session !== undefined && !guardada) { semSessao = true; return false; }
    return session === undefined || guardada === session;
  };

  if (ev.type === "account.updated") {
    const { error } = await db.rpc("srv_set_payment_account", { p_trainer: null, p_account: o.id, p_charges: !!o.charges_enabled, p_payouts: !!o.payouts_enabled,
      p_submitted: !!o.details_submitted, p_fees_payer: o.controller?.fees?.payer ?? null, p_capabilities: o.capabilities ?? {} });
    return error ? json({ ok: false }, 500) : json({ ok: true });
  }

  if (ev.type === "checkout.session.completed" || ev.type === "checkout.session.async_payment_succeeded") {
    const intent = o.metadata?.intent;
    if (!intent) return json({ ok: true, ignorado: "sem_intencao" });
    if (!(await confere(intent, o.id))) return semSessao ? json({ ok: false, motivo: "sessao_nao_registrada" }, 500) : json({ ok: true, ignorado: "nao_confere_com_o_pedido" });
    if (o.payment_status !== "paid") return ingest("payment.processing", { intent, method: (o.payment_method_types ?? []).includes("boleto") ? "boleto" : "card", paymentIntent: o.payment_intent });
    // valores vêm do próprio Stripe (cobrança e lançamento de saldo), não do que o navegador mandou
    const pi = await stripeGet(key, `/v1/payment_intents/${o.payment_intent}?expand[]=latest_charge.balance_transaction`, account);
    if (!pi) return json({ ok: false, motivo: "cobranca_indisponivel" }, 500);
    const ch = pi.latest_charge ?? {}, bt = typeof ch.balance_transaction === "object" ? ch.balance_transaction : null;
    const fee = bt ? (bt.fee_details ?? []).filter((f: any) => f.type !== "application_fee").reduce((n: number, f: any) => n + f.amount, 0) : null;
    return ingest("payment.succeeded", { intent, amountCents: pi.amount_received, currency: pi.currency, applicationFeeCents: pi.application_fee_amount ?? 0,
      providerFeeCents: fee, method: ch.payment_method_details?.type ?? null, paymentIntent: pi.id, charge: ch.id ?? null,
      availableOn: bt ? new Date(bt.available_on * 1000).toISOString() : null, balanceTxn: bt?.id ?? null });
  }

  if (ev.type === "checkout.session.async_payment_failed" || ev.type === "checkout.session.expired") {
    const intent = o.metadata?.intent;
    if (!intent) return json({ ok: true, ignorado: "sem_intencao" });
    if (!(await confere(intent, o.id))) return semSessao ? json({ ok: false, motivo: "sessao_nao_registrada" }, 500) : json({ ok: true, ignorado: "nao_confere_com_o_pedido" });
    return ingest("payment.failed", { intent });
  }

  if (ev.type === "charge.refunded") {
    // a mesma conta do Stripe atende outro site: só entram reembolsos de cobranças criadas por este app
    if (!o.metadata?.intent) return json({ ok: true, ignorado: "cobranca_de_outro_sistema" });
    if (!(await confere(o.metadata.intent))) return json({ ok: true, ignorado: "nao_confere_com_o_pedido" });
    const before = ev.data?.previous_attributes?.amount_refunded ?? 0;
    return ingest("refund.succeeded", { charge: o.id, amountCents: (o.amount_refunded ?? 0) - before });
  }

  return json({ ok: true, ignorado: ev.type });
});
