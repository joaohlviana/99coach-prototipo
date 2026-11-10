/* Conta real: cadastro e login no servidor da 99Coach (Supabase Auth), por e-mail + código de 6 dígitos.
   A chave abaixo é a chave pública do navegador (a mesma do site), não é segredo.
   Sem conexão, o cadastro continua funcionando só neste aparelho. */
(function () {
  'use strict';
  var URL0 = 'https://rycaxboqkkiopjdecgld.supabase.co';
  var KEY = 'sb_publishable_dPQ0596gx0ok94wUE4POtw_T-QjY8Cq';
  var LS = (function () { try { return window.localStorage; } catch (_) { return null; } })();
  var sess = (function () { try { return JSON.parse(LS.getItem('c99.sessao') || 'null'); } catch (_) { return null; } })();
  function keep(s) { sess = s; try { if (s) LS.setItem('c99.sessao', JSON.stringify(s)); else LS.removeItem('c99.sessao'); } catch (_) {} }
  // resposta: { ok, data, offline, msg }
  function call(method, path, body, auth) {
    var h = { apikey: KEY, 'Content-Type': 'application/json' };
    if (auth && sess) h.Authorization = 'Bearer ' + sess.access_token;
    if (method === 'PATCH') h.Prefer = 'return=representation';
    return fetch(URL0 + path, { method: method, headers: h, body: body ? JSON.stringify(body) : undefined }).then(function (r) {
      return r.text().then(function (t) {
        var d = null; try { d = t ? JSON.parse(t) : null; } catch (_) {}
        return { ok: r.ok, status: r.status, data: d, msg: d && (d.msg || d.error_description || d.message || d.error) || '' };
      });
    }, function () { return { ok: false, offline: true, msg: 'Sem conexão com o servidor.' }; });
  }
  function refresh() {
    if (!sess || !sess.refresh_token) return Promise.resolve(false);
    return fetch(URL0 + '/auth/v1/token?grant_type=refresh_token', { method: 'POST', headers: { apikey: KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: sess.refresh_token }) })
      .then(function (r) { return r.ok ? r.json() : null; }, function () { return null; })
      .then(function (d) { if (!d || !d.access_token) return false; keep({ access_token: d.access_token, refresh_token: d.refresh_token, user: sess.user }); return true; });
  }
  // chamada autenticada ao banco (PostgREST), com uma renovação de sessão se o token venceu
  function db(method, path, body, prefer) {
    var go = function () {
      var h = { apikey: KEY, 'Content-Type': 'application/json', Authorization: 'Bearer ' + (sess ? sess.access_token : '') };
      if (prefer) h.Prefer = prefer;
      return fetch(URL0 + '/rest/v1/' + path, { method: method, headers: h, body: body ? JSON.stringify(body) : undefined }).then(function (r) {
        return r.text().then(function (t) { var d = null; try { d = t ? JSON.parse(t) : null; } catch (_) {} return { ok: r.ok, status: r.status, data: d, msg: d && (d.message || d.msg || d.error) || '' }; });
      }, function () { return { ok: false, offline: true, msg: 'Sem conexão com o servidor.' }; });
    };
    return go().then(function (r) { return r.status === 401 ? refresh().then(function (ok) { return ok ? go() : r; }) : r; });
  }
  function slugify(t) { return String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
  var SPORT = { jiujitsu: 'jiu-jitsu', beach: 'beach-tennis' };
  var REAL_SPORTS = 'musculacao funcional crossfit pilates yoga corrida lutas natacao ciclismo danca jiu-jitsu calistenia tenis futebol volei basquete escalada beach-tennis lpo'.split(' ');
  var REGIAO = { centro: 'Centro', zonasul: 'Zona Sul', zonanorte: 'Zona Norte', zonaleste: 'Zona Leste', zonaoeste: 'Zona Oeste', gleba: 'Gleba Palhano' };
  var MOD = { crossfit: 'CrossFit', funcional: 'Funcional', lpo: 'LPO', corrida: 'Corrida', musculacao: 'Musculação', pilates: 'Pilates', yoga: 'Yoga', lutas: 'Lutas', natacao: 'Natação', ciclismo: 'Ciclismo', mobilidade: 'Mobilidade', calistenia: 'Calistenia', hiit: 'HIIT', danca: 'Dança', tenis: 'Tênis', beach: 'Beach tennis', escalada: 'Escalada', futebol: 'Futebol', volei: 'Vôlei', basquete: 'Basquete' };
  var on = function (o) { return Object.keys(o || {}).filter(function (k) { return o[k]; }); };

  var CONTA = {
    // grava o perfil do treinador no servidor (mesmas tabelas e campos do site): trainers, trainer_sports e a oferta principal
    saveTrainer: function (st) {
      if (!sess) return Promise.resolve({ ok: false, nosession: true });
      var uid = sess.user.id, city = (st.city || '').split(',')[0], mods = on(st.sports);
      var row = { name: st.name, city_id: null, regions: on(st.regions).map(function (k) { return REGIAO[k] || k; }), formats: [st.pres && 'presencial', st.onl && 'online'].filter(Boolean),
        languages: on(st.langs).length ? on(st.langs) : ['pt'], specialty: mods.map(function (k) { return MOD[k] || k; }).join(' e '), cref: st.cref || null,
        initials: String(st.name || '').split(' ').filter(Boolean).map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase() };
      row.area = row.regions[0] || null;
      var tr = null;
      return (city ? db('GET', 'cities?select=id&slug=eq.' + encodeURIComponent(slugify(city))) : Promise.resolve({ ok: true, data: [] })).then(function (r) {
        if (r.offline) return r;
        row.city_id = r.ok && r.data && r.data[0] ? r.data[0].id : null;
        return db('GET', 'trainers?select=id,slug&user_id=eq.' + encodeURIComponent(uid));
      }).then(function (r) {
        if (!r.ok) return r;
        if (r.data && r.data[0]) { tr = r.data[0]; return db('PATCH', 'trainers?id=eq.' + encodeURIComponent(tr.id), row); }
        var base = slugify(st.name) || 'treinador', n = 0;
        var tryInsert = function (slug) {
          return db('POST', 'trainers?select=id,slug', Object.assign({}, row, { slug: slug, user_id: uid, origin: 'cadastro', status: 'rascunho' }), 'return=representation').then(function (x) {
            if (x.ok && x.data && x.data[0]) { tr = x.data[0]; return x; }
            if (!x.ok && /duplicate|unique/i.test(x.msg || '') && ++n < 3) return tryInsert(base + '-' + Math.random().toString(36).slice(2, 6));
            return x;
          });
        };
        return tryInsert(base);
      }).then(function (r) {
        if (!r.ok || !tr) return r;
        var slugs = mods.map(function (k) { return SPORT[k] || k; }).filter(function (k) { return REAL_SPORTS.indexOf(k) >= 0; });
        return db('DELETE', 'trainer_sports?trainer_id=eq.' + encodeURIComponent(tr.id) + '&sport_slug=not.in.(' + (slugs.join(',') || 'nenhum') + ')').then(function () {
          return slugs.length ? db('POST', 'trainer_sports?on_conflict=trainer_id,sport_slug', slugs.map(function (k) { return { trainer_id: tr.id, sport_slug: k }; }), 'resolution=ignore-duplicates') : { ok: true };
        }).then(function () {
          var s0 = (st.services || [])[0];
          if (!s0) return { ok: true };
          var mes = s0.kind === 'recorrente', price = Number(s0.price) > 0 && s0.kind !== 'consulta';
          return db('POST', 'offers?on_conflict=trainer_id,key', Object.assign({ trainer_id: tr.id, key: 'principal', title: s0.title, kind: mes ? 'Recorrente mensal' : 'Avulso', includes: s0.inc || s0.title,
            format: s0.fmt === 'online' ? 'online' : 'presencial', headline: true, status: 'publicada' },
            price ? { flow: 'pedido', pricing_mode: mes ? 'recurring' : 'one_time', price_cents: Math.round(100 * Number(s0.price)), unit: mes ? 'mes' : 'sessao' } : { flow: 'consulta', pricing_mode: null, price_cents: null, unit: null }), 'resolution=merge-duplicates');
        }).then(function (x) { return { ok: true, slug: tr.slug, offer: x }; });
      });
    },
    // publica o perfil (passa a aparecer na busca do site)
    publish: function () { return sess ? db('PATCH', 'trainers?user_id=eq.' + encodeURIComponent(sess.user.id), { status: 'publicado' }) : Promise.resolve({ ok: false, nosession: true }); },
    session: function () { return sess; },
    user: function () { return sess && sess.user || null; },
    // envia o código de 6 dígitos para o e-mail (cria a conta se ainda não existir)
    sendCode: function (email, name) {
      return call('POST', '/auth/v1/otp', { email: String(email || '').trim().toLowerCase(), create_user: true, data: { name: name || '' } });
    },
    // confere o código e abre a sessão
    verify: function (email, token) {
      return call('POST', '/auth/v1/verify', { type: 'email', email: String(email || '').trim().toLowerCase(), token: token }).then(function (r) {
        if (r.ok && r.data && r.data.access_token) keep({ access_token: r.data.access_token, refresh_token: r.data.refresh_token, user: { id: r.data.user && r.data.user.id, email: r.data.user && r.data.user.email } });
        return r;
      });
    },
    // papel da conta: 'aluno' ou 'treinador'
    addRole: function (role) {
      if (!sess || !role) return Promise.resolve({ ok: false });
      var q = '/rest/v1/profiles?id=eq.' + encodeURIComponent(sess.user.id);
      return call('GET', q + '&select=roles', null, true).then(function (r) {
        var roles = r.ok && r.data && r.data[0] && r.data[0].roles || [];
        if (!r.ok || roles.indexOf(role) >= 0) return r;
        return call('PATCH', q, { roles: roles.concat([role]) }, true);
      });
    },
    // papéis da conta no servidor, guardados no aparelho (para saber qual área abrir)
    roles: function () { try { return JSON.parse(LS.getItem('c99.papeis') || '[]'); } catch (_) { return []; } },
    syncRoles: function () {
      return CONTA.me().then(function (r) { var roles = r.ok && r.data && r.data[0] && r.data[0].roles || null; if (roles) { try { LS.setItem('c99.papeis', JSON.stringify(roles)); } catch (_) {} } return roles || CONTA.roles(); });
    },
    me: function () { return sess ? call('GET', '/rest/v1/profiles?id=eq.' + encodeURIComponent(sess.user.id) + '&select=*', null, true) : Promise.resolve({ ok: false }); },
    signOut: function () { var p = sess ? call('POST', '/auth/v1/logout', null, true) : Promise.resolve(); keep(null); try { LS.removeItem('c99.papeis'); } catch (_) {} return p; }
  };
  window.CONTA = CONTA;
})();
