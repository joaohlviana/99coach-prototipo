// Recebe do banco antigo (rdujusymvebxndykyvhu) os perfis de treinador publicados depois da migração de 28/10
// e os aplica no 99coach-v2 pela função sincronizar_legado (mesma regra da migração legado-20261028-v1).
// Depois copia as fotos pendentes do storage antigo para o bucket trainer-photos deste banco.
// Quem chama é o agendador do banco antigo (pg_cron + pg_net) a cada 5 minutos, com o segredo compartilhado
// no cabeçalho x-legado-token (aqui o banco guarda só o hash, em private.legado_sync). Corpo: { "registros": [<JSON de user:v1>, ...] }. Corpo vazio só copia fotos pendentes.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ORIGEM_FOTOS = "https://rdujusymvebxndykyvhu.supabase.co/storage/v1/object/public/";
const MAX_FOTOS = 40;

async function sha(buf: ArrayBuffer): Promise<string> {
  const h = new Uint8Array(await crypto.subtle.digest("SHA-256", buf));
  return Array.from(h, (b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json" } });
  if (req.method !== "POST") return json({ erro: "use POST" }, 405);
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const ok = await sb.rpc("legado_token_ok", { p_token: req.headers.get("x-legado-token") ?? "" });
  if (ok.error || ok.data !== true) return json({ erro: "não autorizado" }, 401);

  let corpo: { registros?: unknown[] } = {};
  try { corpo = await req.json(); } catch { corpo = {}; }
  const registros = Array.isArray(corpo.registros) ? corpo.registros.slice(0, 200) : [];

  const { data, error } = await sb.rpc("sincronizar_legado", { registros });
  if (error) return json({ erro: error.message }, 500);

  const pendentes = ((data?.fotos_pendentes ?? []) as { id: string; url: string }[]).slice(0, MAX_FOTOS);
  let copiadas = 0, falhas = 0;
  for (const f of pendentes) {
    try {
      if (!f.url || !f.url.startsWith(ORIGEM_FOTOS)) throw new Error("origem da foto fora do storage antigo");
      const r = await fetch(f.url, { signal: AbortSignal.timeout(10_000) });
      if (!r.ok) throw new Error("foto HTTP " + r.status);
      const tipo = (r.headers.get("content-type") ?? "image/jpeg").split(";")[0];
      if (!tipo.startsWith("image/")) throw new Error("não é imagem: " + tipo);
      const buf = await r.arrayBuffer();
      if (buf.byteLength < 500 || buf.byteLength > 8_000_000) throw new Error("tamanho inválido");
      const ext = tipo === "image/png" ? "png" : tipo === "image/webp" ? "webp" : "jpg";
      const path = `legado/${f.id}/${(await sha(buf)).slice(0, 16)}.${ext}`;
      const up = await sb.storage.from("trainer-photos").upload(path, buf, { contentType: tipo, upsert: true, cacheControl: "31536000" });
      if (up.error) throw new Error(up.error.message);
      await sb.rpc("legado_foto_copiada", { p_id: f.id, p_path: path, p_ok: true });
      copiadas++;
    } catch (e) {
      falhas++;
      await sb.rpc("legado_foto_copiada", { p_id: f.id, p_path: String((e as Error)?.message ?? e), p_ok: false });
    }
  }

  const { fotos_pendentes: _f, ...resumo } = data ?? {};
  return json({ ...resumo, fotos: { copiadas, falhas, restantes: Math.max(0, (data?.fotos_pendentes?.length ?? 0) - copiadas) } });
});
