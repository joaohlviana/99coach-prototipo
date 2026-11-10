// Diagnóstico temporário do cadastro (será removido): fala com o servidor de login a partir da Vercel.
const URL0 = 'https://rycaxboqkkiopjdecgld.supabase.co';
const KEY = 'sb_publishable_dPQ0596gx0ok94wUE4POtw_T-QjY8Cq';
const TOKEN = 'f5b2703828f5babe247c5da3';
async function call(method, path, body, bearer) {
  const h = { apikey: KEY, 'Content-Type': 'application/json' };
  if (bearer) h.Authorization = 'Bearer ' + bearer;
  const r = await fetch(URL0 + path, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  let d = t; try { d = JSON.parse(t); } catch (_) {}
  return { status: r.status, cors: r.headers.get('access-control-allow-origin'), data: d };
}
export default async function handler(req, res) {
  const q = req.query || {};
  if (q.t !== TOKEN) return res.status(404).send('Not found');
  try {
    if (q.otp) return res.json(await call('POST', '/auth/v1/otp', { email: q.otp, create_user: true, data: { name: q.name || '' } }));
    if (q.verify) {
      const v = await call('POST', '/auth/v1/verify', { type: 'email', email: q.email, token: q.verify });
      const tok = v.data && v.data.access_token, uid = v.data && v.data.user && v.data.user.id;
      if (!tok) return res.json({ verify: v });
      const out = { verify: { status: v.status, uid, email: v.data.user.email, confirmed: v.data.user.email_confirmed_at } };
      out.profile = await call('GET', '/rest/v1/profiles?id=eq.' + uid + '&select=*', null, tok);
      if (q.role) {
        const roles = (out.profile.data && out.profile.data[0] && out.profile.data[0].roles) || [];
        out.role = roles.includes(q.role) ? 'já tinha' : await call('PATCH', '/rest/v1/profiles?id=eq.' + uid, { roles: roles.concat([q.role]) }, tok);
        out.profileDepois = await call('GET', '/rest/v1/profiles?id=eq.' + uid + '&select=roles,display_name', null, tok);
      }
      out.trainer = await call('GET', '/rest/v1/trainers?select=id,slug,status&user_id=eq.' + uid, null, tok);
      return res.json(out);
    }
    const settings = await call('GET', '/auth/v1/settings');
    const pre = await fetch(URL0 + '/auth/v1/otp', { method: 'OPTIONS', headers: { Origin: 'https://99coach-prototipo-39pr.vercel.app', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'apikey,content-type' } });
    const cities = await call('GET', '/rest/v1/cities?select=id,slug&slug=eq.londrina');
    return res.json({ settings, preflight: { status: pre.status, origin: pre.headers.get('access-control-allow-origin'), headers: pre.headers.get('access-control-allow-headers') }, cities });
  } catch (e) { return res.status(500).json({ erro: String(e && e.message || e) }); }
}
