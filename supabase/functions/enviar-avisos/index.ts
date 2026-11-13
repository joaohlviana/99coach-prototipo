// Envia por e-mail (Resend) os avisos de quem ligou essa opção.
// A fila vem do banco (email_queue): respeita tipos silenciados, horário de silêncio e no máximo um e-mail a cada 30 min.
// O e-mail leva só o tipo do aviso e o primeiro nome de quem gerou: nunca texto de mensagem, resposta ou treino.
// A chave do Resend vem do segredo RESEND_API_KEY; sem ela a função não envia nada e diz isso.
// Chamada pelo agendador do banco a cada 5 minutos, sem segredo: a função não recebe parâmetro nenhum e só envia
// e-mails que já são devidos, então chamá-la de fora não muda o que é enviado nem para quem.
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
    // mesmo visual dos e-mails de login (supabase/templates): cabeçalho escuro, cartão branco, botão
    const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"></head><body style="margin:0;padding:0;background:#EFEDEA;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EFEDEA;"><tr><td align="center" style="padding:32px 16px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FFFFFF;border-radius:20px;overflow:hidden;"><tr><td style="background:#121214;padding:22px 28px;"><span style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:700;color:#FFFFFF;">99<span style="color:#DF0A3D;">coach</span></span></td></tr><tr><td style="padding:32px 28px 8px 28px;font-family:Arial,Helvetica,sans-serif;color:#121214;"><h1 style="margin:0 0 14px 0;font-size:22px;line-height:1.25;font-weight:700;">Novidades na sua conta</h1><ul style="margin:0 0 20px 0;padding:0 0 0 20px;font-size:16px;line-height:1.6;color:#33333A;">${lines.map((l) => `<li>${esc(l)}</li>`).join("")}${extra ? `<li>e mais ${extra}</li>` : ""}</ul><p style="margin:0 0 20px 0;"><a href="${url}" style="display:inline-block;background:#121214;color:#FFFFFF;text-decoration:none;font-size:16px;font-weight:700;padding:14px 26px;border-radius:999px;">Abrir no 99coach</a></p></td></tr><tr><td style="padding:20px 28px 28px 28px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:#63636B;border-top:1px solid #ECEAE6;">Por privacidade, o conteúdo das mensagens, respostas e treinos fica só dentro do app.<br>Você recebe este e-mail porque ligou os avisos por e-mail. Para desligar ou definir horário de silêncio, abra Avisos no app.</td></tr></table></td></tr></table></body></html>`;
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
