// Envia por e-mail (Resend) os avisos de quem ligou essa opção.
// A fila vem do banco (email_queue): respeita tipos silenciados, horário de silêncio e no máximo um e-mail a cada 30 min.
// O e-mail leva só o tipo do aviso e o primeiro nome de quem gerou: nunca texto de mensagem, resposta ou treino.
// A chave do Resend vem do segredo RESEND_API_KEY; sem ela a função não envia nada e diz isso.
// Chamada pelo agendador do banco a cada 5 minutos, sem segredo: a função não recebe parâmetro nenhum e só envia
// e-mails que já são devidos, então chamá-la de fora não muda o que é enviado nem para quem.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Cada pessoa recebe no idioma da conta ('pt', 'en' ou 'es': dado do usuário gravado pelo app) e o botão leva ao
// site daquele idioma: português no .com.br; inglês e espanhol no domínio internacional.
const SITE = Deno.env.get("SITE_URL") ?? "https://www.99coach.com.br";
const INTL = Deno.env.get("INTL_URL") ?? "https://www.99coach.com";
const FROM = Deno.env.get("AVISOS_FROM") ?? "99coach <onboarding@resend.dev>";
const esc = (s: string) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

type Lang = "pt" | "en" | "es";
type Item = { kind: string; mine: string; who: string; n: number; extra: string | null };
const T = {
  pt: {
    html: "pt-BR", alguem: "Alguém", titulo: "Novidades na sua conta", abrir: "Abrir", mais: (n: number) => `e mais ${n}`, assunto: (n: number) => `${n} novidades na sua conta`,
    rodape: "Você recebe este e-mail porque ligou os avisos por e-mail. Para desligar ou definir horário de silêncio:", ajustar: "abra os avisos da sua conta",
    msg: (n: number, w: string) => `${n === 1 ? "1 mensagem não lida" : n + " mensagens não lidas"} de ${w}`,
    pediu: (w: string) => `${w} pediu acompanhamento`, respondeu: (w: string) => `${w} respondeu ao seu pedido de acompanhamento`,
    alterou: (w: string) => `${w} alterou o seu treino`, atribuiu: (w: string) => `${w} atribuiu um treino a você`,
    registrou: (w: string) => `${w} registrou um treino`, comentou: (w: string) => `${w} comentou um registro de treino`,
    formPara: (w: string) => `${w} enviou um formulário para você responder`, formResp: (w: string) => `${w} respondeu um formulário`,
    cancelou: (w: string) => `${w} cancelou um horário`, marcado: (w: string) => `Você tem horário marcado com ${w}`, outro: (w: string) => `Novidade de ${w}`,
  },
  en: {
    html: "en", alguem: "Someone", titulo: "News on your account", abrir: "Open", mais: (n: number) => `and ${n} more`, assunto: (n: number) => `${n} updates on your account`,
    rodape: "You get this email because you turned on email notices. To turn them off or set quiet hours:", ajustar: "open your account notices",
    msg: (n: number, w: string) => `${n === 1 ? "1 unread message" : n + " unread messages"} from ${w}`,
    pediu: (w: string) => `${w} asked for coaching`, respondeu: (w: string) => `${w} replied to your coaching request`,
    alterou: (w: string) => `${w} changed your workout`, atribuiu: (w: string) => `${w} assigned you a workout`,
    registrou: (w: string) => `${w} logged a workout`, comentou: (w: string) => `${w} commented on a workout log`,
    formPara: (w: string) => `${w} sent you a form to answer`, formResp: (w: string) => `${w} answered a form`,
    cancelou: (w: string) => `${w} cancelled a session`, marcado: (w: string) => `You have a session booked with ${w}`, outro: (w: string) => `News from ${w}`,
  },
  es: {
    html: "es", alguem: "Alguien", titulo: "Novedades en tu cuenta", abrir: "Abrir", mais: (n: number) => `y ${n} más`, assunto: (n: number) => `${n} novedades en tu cuenta`,
    rodape: "Recibes este correo porque activaste los avisos por correo. Para desactivarlos o definir un horario de silencio:", ajustar: "abre los avisos de tu cuenta",
    msg: (n: number, w: string) => `${n === 1 ? "1 mensaje sin leer" : n + " mensajes sin leer"} de ${w}`,
    pediu: (w: string) => `${w} pidió acompañamiento`, respondeu: (w: string) => `${w} respondió a tu solicitud de acompañamiento`,
    alterou: (w: string) => `${w} cambió tu entrenamiento`, atribuiu: (w: string) => `${w} te asignó un entrenamiento`,
    registrou: (w: string) => `${w} registró un entrenamiento`, comentou: (w: string) => `${w} comentó un registro de entrenamiento`,
    formPara: (w: string) => `${w} te envió un formulario para responder`, formResp: (w: string) => `${w} respondió un formulario`,
    cancelou: (w: string) => `${w} canceló un horario`, marcado: (w: string) => `Tienes un horario reservado con ${w}`, outro: (w: string) => `Novedad de ${w}`,
  },
};
const idioma = (l: unknown): Lang => (l === "en" || l === "es" ? l : "pt");
function line(i: Item, l: Lang): string {
  const x = T[l], w = String(i.who ?? "").trim().split(/\s+/)[0] || x.alguem;
  if (i.kind === "mensagem") return x.msg(i.n, w);
  if (i.kind === "pedido") return i.mine === "treinador" ? x.pediu(w) : x.respondeu(w);
  if (i.kind === "treino") return i.extra === "versao" ? x.alterou(w) : x.atribuiu(w);
  if (i.kind === "registro") return x.registrou(w);
  if (i.kind === "comentario") return x.comentou(w);
  if (i.kind === "formulario") return i.mine === "aluno" ? x.formPara(w) : x.formResp(w);
  if (i.kind === "horario") return i.extra === "cancelado" ? x.cancelou(w) : x.marcado(w);
  return x.outro(w);
}

Deno.serve(async (_req: Request) => {
  const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json" } });
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) return json({ ok: false, motivo: "sem_chave_resend", enviados: 0 });
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const { data, error } = await db.rpc("email_queue", { p_limit: 25 });
  if (error) return json({ ok: false, motivo: "fila_indisponivel" }, 500);
  let enviados = 0, falhas = 0;
  for (const row of (data ?? []) as { user: string; email: string; lang?: string; items: Item[] }[]) {
    const l = idioma(row.lang), x = T[l];
    const lines = row.items.slice(0, 8).map((i) => line(i, l));
    const extra = row.items.length > 8 ? row.items.length - 8 : 0;
    const subject = lines.length === 1 ? lines[0] : x.assunto(row.items.length);
    const url = `${l === "pt" ? SITE : INTL}/app#publico-avisos`;
    const text = `${lines.map((t) => "- " + t).join("\n")}${extra ? `\n- ${x.mais(extra)}` : ""}\n\n${x.abrir}: ${url}\n\n${x.rodape} ${url}`;
    // mesmo visual dos e-mails de login (supabase/templates): cabeçalho escuro com a logo, cartão branco, botão
    const html = `<!doctype html><html lang="${x.html}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"></head><body style="margin:0;padding:0;background:#EFEDEA;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EFEDEA;"><tr><td align="center" style="padding:32px 16px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FFFFFF;border-radius:20px;overflow:hidden;"><tr><td style="background:#121214;padding:22px 28px;"><img src="${SITE}/img/email/logo-99coach.png" width="120" height="30" alt="99coach" style="display:block;border:0;width:120px;height:auto;"></td></tr><tr><td style="padding:32px 28px 8px 28px;font-family:Arial,Helvetica,sans-serif;color:#121214;"><h1 style="margin:0 0 14px 0;font-size:22px;line-height:1.25;font-weight:700;">${x.titulo}</h1><ul style="margin:0 0 20px 0;padding:0 0 0 20px;font-size:16px;line-height:1.6;color:#33333A;">${lines.map((t) => `<li>${esc(t)}</li>`).join("")}${extra ? `<li>${x.mais(extra)}</li>` : ""}</ul><p style="margin:0 0 20px 0;"><a href="${url}" style="display:inline-block;background:#121214;color:#FFFFFF;text-decoration:none;font-size:16px;font-weight:700;padding:14px 26px;border-radius:999px;">${x.abrir}</a></p></td></tr><tr><td style="padding:20px 28px 28px 28px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:#63636B;border-top:1px solid #ECEAE6;">${x.rodape} <a href="${url}" style="color:#63636B;">${x.ajustar}</a>.</td></tr></table></td></tr></table></body></html>`;
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
