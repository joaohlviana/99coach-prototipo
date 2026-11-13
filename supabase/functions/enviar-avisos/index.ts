// Envia por e-mail (Resend) os avisos de quem ligou essa opção.
// A fila vem do banco (email_queue): respeita tipos silenciados, horário de silêncio e no máximo um e-mail a cada 30 min.
// O e-mail leva só o tipo do aviso e o primeiro nome de quem gerou: nunca texto de mensagem, resposta ou treino.
// A chave do Resend vem do segredo RESEND_API_KEY; sem ela a função não envia nada e diz isso.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SITE = Deno.env.get("SITE_URL") ?? "https://99coach-prototipo-39pr.vercel.app";
const FROM = Deno.env.get("AVISOS_FROM") ?? "99coach <onboarding@resend.dev>";

const esc = (s: string) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
const first = (n: string) => String(n ?? "").trim().split(/\s+/)[0] || "Alguém";

type Item = { kind: string; mine: string; who: string; n: number; extra: string | null };
function line(i: Item): string {
  const w = first(i.who);
  if (i.kind === "mensagem") return `${i.n === 1 ? "1 mensagem não lida" : i.n + " mensagens não lidas"} de ${w}`;
  if (i.kind === "pedido") return i.mine === "treinador" ? `${w} pediu acompanhamento` : `${w} respondeu ao seu pedido de acompanhamento`;
  if (i.kind === "treino") return i.extra === "versao" ? `${w} alterou o seu treino` : `${w} atribuiu um treino a você`;
  if (i.kind === "registro") return `${w} registrou um treino`;
  if (i.kind === "comentario") return `${w} comentou um registro de treino`;
  if (i.kind === "formulario") return i.mine === "aluno" ? `${w} enviou um formulário para você responder` : `${w} respondeu um formulário`;
  if (i.kind === "horario") return i.extra === "cancelado" ? `${w} cancelou um horário` : `Você tem horário marcado com ${w}`;
  return `Novidade de ${w}`;
}

Deno.serve(async (_req: Request) => {
  const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json" } });
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) return json({ ok: false, motivo: "sem_chave_resend", enviados: 0 });
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const { data, error } = await db.rpc("email_queue", { p_limit: 25 });
  if (error) return json({ ok: false, motivo: "fila_indisponivel" }, 500);
  let enviados = 0, falhas = 0;
  for (const row of (data ?? []) as { user: string; email: string; items: Item[] }[]) {
    const lines = row.items.slice(0, 8).map(line);
    const extra = row.items.length > 8 ? row.items.length - 8 : 0;
    const subject = lines.length === 1 ? lines[0] : `${row.items.length} novidades no 99coach`;
    const url = `${SITE}/app#publico-avisos`;
    const text = `${lines.map((l) => "- " + l).join("\n")}${extra ? `\n- e mais ${extra}` : ""}\n\nAbrir no 99coach: ${url}\n\nVocê recebe este e-mail porque ligou os avisos por e-mail. Para desligar ou definir horário de silêncio: ${url}`;
    const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5;color:#1a1a1a;max-width:520px"><p><b>Novidades na sua conta 99coach</b></p><ul>${lines.map((l) => `<li>${esc(l)}</li>`).join("")}${extra ? `<li>e mais ${extra}</li>` : ""}</ul><p><a href="${url}">Abrir no 99coach</a></p><p style="font-size:13px;color:#666">Por privacidade, o conteúdo fica só dentro do app. Você recebe este e-mail porque ligou os avisos por e-mail; para desligar ou definir horário de silêncio, abra Avisos no app.</p></div>`;
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [row.email], subject, text, html }),
    });
    if (r.ok) {
      enviados++;
      // se não der para marcar como enviado, para aqui: melhor atrasar os próximos do que repetir e-mail para todo mundo
      const { error: e2 } = await db.rpc("email_mark", { p_user: row.user });
      if (e2) return json({ ok: false, motivo: "nao_marcou_enviado", enviados, falhas }, 500);
    } else { falhas++; await r.text(); }
  }
  return json({ ok: true, enviados, falhas, remetente_de_teste: !Deno.env.get("AVISOS_FROM") });
});
