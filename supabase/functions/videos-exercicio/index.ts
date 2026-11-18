// Vídeos de exercícios (sempre com o treinador logado).
// Ações:
//   buscar -> sugestões de vídeos do YouTube para o nome do exercício (precisa do segredo YOUTUBE_API_KEY;
//             sem ele, responde configured:false e o app oferece a busca no próprio YouTube + colar o link)
//   info   -> título e canal de um vídeo do YouTube a partir do link colado (oEmbed público, sem chave)
// Só vídeos que podem ser incorporados em outros sites, com busca segura.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { ...cors, "Content-Type": "application/json" } });
const ID = /^[A-Za-z0-9_-]{11}$/;
const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ ok: false, motivo: "metodo" }, 405);
  // diagnóstico sem conta: só diz se a chave do YouTube está configurada (nunca o valor)
  if (new URL(req.url).searchParams.get("estado") === "1") return json({ ok: true, configured: !!Deno.env.get("YOUTUBE_API_KEY") });
  const auth = req.headers.get("Authorization") ?? "";
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: u } = await sb.auth.getUser();
  if (!u?.user) return json({ ok: false, motivo: "sem_sessao" }, 401);
  const body = await req.json().catch(() => ({}));

  if (body.acao === "info") {
    const id = String(body.id ?? "");
    if (!ID.test(id)) return json({ ok: false, motivo: "id_invalido" }, 400);
    const r = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent("https://www.youtube.com/watch?v=" + id)}`);
    if (!r.ok) return json({ ok: false, motivo: r.status === 401 || r.status === 403 ? "nao_incorporavel" : "nao_encontrado" });
    const d = await r.json().catch(() => ({}));
    return json({ ok: true, id, title: String(d.title ?? "").slice(0, 140), channel: String(d.author_name ?? "").slice(0, 80) });
  }

  if (body.acao === "buscar") {
    const key = Deno.env.get("YOUTUBE_API_KEY");
    const q = String(body.q ?? "").trim().slice(0, 80);
    if (q.length < 2) return json({ ok: false, motivo: "consulta_curta" }, 400);
    if (!key) return json({ ok: true, configured: false, items: [] });
    const p = new URLSearchParams({ part: "snippet", type: "video", maxResults: "8", q: q + " execução exercício", relevanceLanguage: "pt", regionCode: "BR", videoEmbeddable: "true", safeSearch: "strict", key });
    const r = await fetch(`https://www.googleapis.com/youtube/v3/search?${p}`);
    if (!r.ok) return json({ ok: false, configured: true, motivo: r.status === 403 ? "cota" : "falhou" });
    const d = await r.json().catch(() => ({}));
    const items = (d.items ?? []).filter((x: any) => ID.test(x?.id?.videoId ?? "")).map((x: any) => ({
      id: x.id.videoId, title: decode(String(x.snippet?.title ?? "")).slice(0, 140), channel: decode(String(x.snippet?.channelTitle ?? "")).slice(0, 80),
    }));
    return json({ ok: true, configured: true, items });
  }
  return json({ ok: false, motivo: "acao" }, 400);
});
