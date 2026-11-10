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
    if (q.signup) {
      const out = {};
      const su = await call('POST', '/auth/v1/signup', { email: q.signup, password: q.pw, data: { name: q.name || '' } });
      out.signup = { status: su.status, temSessao: !!(su.data && su.data.access_token), msg: su.data && (su.data.msg || su.data.error_description || su.data.message), uid: su.data && (su.data.user ? su.data.user.id : su.data.id), confirmado: su.data && su.data.user && su.data.user.email_confirmed_at };
      let tok = su.data && su.data.access_token, uid = out.signup.uid;
      if (!tok) {
        const li = await call('POST', '/auth/v1/token?grant_type=password', { email: q.signup, password: q.pw });
        out.login = { status: li.status, msg: li.data && (li.data.msg || li.data.error_description) };
        tok = li.data && li.data.access_token; uid = li.data && li.data.user && li.data.user.id;
      }
      if (!tok) return res.json(out);
      out.profile = await call('GET', '/rest/v1/profiles?id=eq.' + uid + '&select=*', null, tok);
      const roles = (out.profile.data && out.profile.data[0] && out.profile.data[0].roles) || [];
      out.role = await call('PATCH', '/rest/v1/profiles?id=eq.' + uid, { roles: roles.includes('treinador') ? roles : roles.concat(['treinador']) }, tok);
      out.roleDepois = await call('GET', '/rest/v1/profiles?id=eq.' + uid + '&select=roles,display_name', null, tok);
      const slug = 'teste-claude-' + Math.random().toString(36).slice(2, 7);
      const ins = await fetch(URL0 + '/rest/v1/trainers?select=id,slug,status', { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok, Prefer: 'return=representation' },
        body: JSON.stringify({ name: q.name || 'Teste', city_id: 4, regions: ['Centro'], area: 'Centro', formats: ['presencial', 'online'], languages: ['pt'], specialty: 'CrossFit', cref: null, initials: 'TC', slug, user_id: uid, origin: 'cadastro', status: 'rascunho' }) });
      out.trainer = { status: ins.status, data: await ins.json().catch(() => null) };
      const tr = Array.isArray(out.trainer.data) && out.trainer.data[0];
      if (tr) {
        out.sports = await call('POST', '/rest/v1/trainer_sports', [{ trainer_id: tr.id, sport_slug: 'crossfit' }], tok);
        const of = await fetch(URL0 + '/rest/v1/offers?on_conflict=trainer_id,key', { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json', Authorization: 'Bearer ' + tok, Prefer: 'resolution=merge-duplicates' },
          body: JSON.stringify({ trainer_id: tr.id, key: 'principal', title: 'Acompanhamento online', kind: 'Recorrente mensal', includes: 'Treino no app', format: 'online', headline: true, status: 'publicada', flow: 'pedido', pricing_mode: 'recurring', price_cents: 20000, unit: 'mes' }) });
        out.offer = { status: of.status, body: (await of.text()).slice(0, 300) };
        out.relido = await call('GET', '/rest/v1/trainers?select=id,slug,status,specialty,city_id&user_id=eq.' + uid, null, tok);
      }
      return res.json(out);
    }
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
