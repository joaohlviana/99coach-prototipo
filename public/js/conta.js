/* Conta real: cadastro e login no servidor da 99Coach (Supabase Auth), por e-mail + código de 6 dígitos.
   A chave abaixo é a chave pública do navegador (a mesma do site), não é segredo.
   Sem conexão, o cadastro continua funcionando só neste aparelho. */
(function () {
  'use strict';
  var URL0 = 'https://rycaxboqkkiopjdecgld.supabase.co';
  var KEY = 'sb_publishable_dPQ0596gx0ok94wUE4POtw_T-QjY8Cq';
  var LS = (function () { try { return window.localStorage; } catch (_) { return null; } })();
  var linksFailed = false, reqsFailed = false, lastReqs = [];
  // chave de intenção: a mesma enquanto a pessoa tenta a MESMA ação (resposta perdida, novo toque); nova depois do sucesso.
  // Assim repetir depois de uma queda não duplica a ação no servidor.
  var pend = {};
  function intent(k) { if (!pend[k]) { var r = new Uint32Array(2); try { window.crypto.getRandomValues(r); } catch (_) { r[0] = Date.now(); r[1] = Math.random() * 1e9; } pend[k] = k + ':' + r[0].toString(36) + r[1].toString(36); } return pend[k]; }
  function settle(k) { return function (r) { if (r && r.ok) delete pend[k]; return r; }; }
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
      var h = { apikey: KEY, 'Content-Type': 'application/json' }; if (sess && sess.access_token) h.Authorization = 'Bearer ' + sess.access_token;
      if (prefer) h.Prefer = prefer;
      return fetch(URL0 + '/rest/v1/' + path, { method: method, headers: h, body: body ? JSON.stringify(body) : undefined }).then(function (r) {
        return r.text().then(function (t) { var d = null; try { d = t ? JSON.parse(t) : null; } catch (_) {} return { ok: r.ok, status: r.status, data: d, msg: d && (d.message || d.msg || d.error) || '' }; });
      }, function () { return { ok: false, offline: true, msg: 'Sem conexão com o servidor.' }; });
    };
    return go().then(function (r) { return r.status === 401 ? refresh().then(function (ok) { return ok ? go() : r; }) : r; });
  }
  // chamada ao serviço de contas com o token da sessão
  function auth(method, path, body) {
    var h = { apikey: KEY, 'Content-Type': 'application/json' }; if (sess && sess.access_token) h.Authorization = 'Bearer ' + sess.access_token;
    return fetch(URL0 + path, { method: method, headers: h, body: body ? JSON.stringify(body) : undefined }).then(function (r) {
      return r.text().then(function (t) { var d = null; try { d = t ? JSON.parse(t) : null; } catch (_) {} return { ok: r.ok, status: r.status, data: d, msg: d && (d.msg || d.message || d.error_description || d.error) || '' }; });
    }, function () { return { ok: false, offline: true, msg: 'Sem conexão com o servidor.' }; });
  }
  function hash(t) { var h = 0x811c9dc5; t = String(t); for (var i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 0x1000193); return (h >>> 0).toString(36); }
  function slugify(t) { return String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
  var SPORT = { jiujitsu: 'jiu-jitsu', beach: 'beach-tennis' };
  var REAL_SPORTS = 'musculacao funcional crossfit pilates yoga corrida lutas natacao ciclismo danca jiu-jitsu calistenia tenis futebol volei basquete escalada beach-tennis lpo'.split(' ');
  var REGIAO = { centro: 'Centro', zonasul: 'Zona Sul', zonanorte: 'Zona Norte', zonaleste: 'Zona Leste', zonaoeste: 'Zona Oeste', gleba: 'Gleba Palhano' };
  var MOD = { crossfit: 'CrossFit', funcional: 'Funcional', lpo: 'LPO', corrida: 'Corrida', musculacao: 'Musculação', pilates: 'Pilates', yoga: 'Yoga', lutas: 'Lutas', natacao: 'Natação', ciclismo: 'Ciclismo', mobilidade: 'Mobilidade', calistenia: 'Calistenia', hiit: 'HIIT', danca: 'Dança', tenis: 'Tênis', beach: 'Beach tennis', escalada: 'Escalada', futebol: 'Futebol', volei: 'Vôlei', basquete: 'Basquete' };
  var on = function (o) { return Object.keys(o || {}).filter(function (k) { return o[k]; }); };

  // volta do login com Google: o endereço traz a sessão; guarda e abre o cadastro para concluir
  (function () {
    var h = location.hash || '';
    if (h.indexOf('access_token=') < 0 && h.indexOf('error_description=') < 0) return;
    var q = {}; h.replace(/^#/, '').split('&').forEach(function (kv) { var i = kv.indexOf('='); if (i > 0) q[kv.slice(0, i)] = decodeURIComponent(kv.slice(i + 1).replace(/\+/g, ' ')); });
    var o = {}; try { o = JSON.parse(LS.getItem('c99.oauth') || '{}'); LS.removeItem('c99.oauth'); } catch (_) {}
    var flow = o.flow || 'entrar';
    if (q.access_token) {
      var pl = {}; try { pl = JSON.parse(decodeURIComponent(escape(atob(q.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))))); } catch (_) {}
      if (pl.sub) {
        keep({ access_token: q.access_token, refresh_token: q.refresh_token || '', user: { id: pl.sub, email: pl.email || '' } });
        var md = pl.user_metadata || {};
        // link de "esqueci a senha": entra só para criar a senha nova
        if (q.type === 'recovery') { flow = 'entrar'; try { LS.setItem('c99.novaSenha', '1'); } catch (_) {} }
        else { try { LS.setItem('c99.oauthVolta', JSON.stringify({ role: o.role || '', email: pl.email || '', name: md.full_name || md.name || '' })); } catch (_) {} }
      }
    } else { try { LS.setItem('c99.oauthErro', q.error_description || 'Não foi possível entrar com o Google.'); } catch (_) {} }
    try { history.replaceState(null, '', location.pathname + location.search + '#onboarding-' + flow); } catch (_) { location.hash = '#onboarding-' + flow; }
  })();

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
    // lê o perfil do treinador desta conta no servidor, no formato do cadastro (para retomar em outro aparelho)
    loadTrainer: function () {
      if (!sess) return Promise.resolve(null);
      var uid = sess.user.id, out = null;
      var BACK = {}; Object.keys(SPORT).forEach(function (k) { BACK[SPORT[k]] = k; });
      var REG_BACK = {}; Object.keys(REGIAO).forEach(function (k) { REG_BACK[REGIAO[k]] = k; });
      return db('GET', 'trainers?select=id,slug,name,city_id,regions,formats,languages,specialty,cref,status&user_id=eq.' + encodeURIComponent(uid)).then(function (r) {
        var t = r.ok && r.data && r.data[0]; if (!t) return null;
        out = { name: t.name || '', cref: t.cref || '', pres: (t.formats || []).indexOf('presencial') >= 0, onl: (t.formats || []).indexOf('online') >= 0,
          regions: {}, langs: {}, sports: {}, published: t.status === 'publicado', dadosSaved: true, serverSlug: t.slug };
        (t.regions || []).forEach(function (x) { out.regions[REG_BACK[x] || x] = true; });
        (t.languages && t.languages.length ? t.languages : ['pt']).forEach(function (x) { out.langs[x] = true; });
        return Promise.all([
          t.city_id ? db('GET', 'cities?select=name,uf&id=eq.' + t.city_id) : Promise.resolve({ ok: false }),
          db('GET', 'trainer_sports?select=sport_slug&trainer_id=eq.' + t.id),
          db('GET', 'offers?select=title,includes,format,price_cents,unit,pricing_mode,flow&key=eq.principal&trainer_id=eq.' + t.id)
        ]).then(function (x) {
          var c = x[0].ok && x[0].data && x[0].data[0]; if (c) out.city = c.name + ', ' + c.uf;
          ((x[1].ok && x[1].data) || []).forEach(function (s) { out.sports[BACK[s.sport_slug] || s.sport_slug] = true; });
          var o = x[2].ok && x[2].data && x[2].data[0];
          if (o) out.services = [{ kind: o.flow === 'consulta' ? 'consulta' : (o.pricing_mode === 'recurring' ? 'recorrente' : 'avulsa'), title: o.title, inc: o.includes || o.title,
            fmt: o.format === 'online' ? 'online' : 'presencial', acc: o.flow === 'pedido' ? 'aceite' : 'direta', price: o.price_cents ? String(Math.round(o.price_cents / 100)) : '' }];
          return out;
        });
      });
    },
    // ---------- convites e vínculos (mesmas tabelas e funções do site) ----------
    // código XXXX-XXXX; vale 7 dias; o aceite é único e feito pelo aluno autenticado
    newCode: function () { var A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = ''; var r = new Uint32Array(8); (window.crypto || {}).getRandomValues ? window.crypto.getRandomValues(r) : r.forEach(function (_, i) { r[i] = Math.random() * 1e9; }); for (var i = 0; i < 8; i++) s += A[r[i] % A.length]; return s.slice(0, 4) + '-' + s.slice(4); },
    createInvite: function (o) {
      if (!sess) return Promise.resolve({ ok: false, nosession: true });
      var code = CONTA.newCode();
      return db('GET', 'trainers?select=id&user_id=eq.' + encodeURIComponent(sess.user.id)).then(function (r) {
        var t = r.ok && r.data && r.data[0];
        if (!t) return { ok: false, msg: 'Publique ou salve seu perfil de treinador antes de convidar.' };
        return db('POST', 'invites', { code: code, trainer_id: t.id, kind: 'individual', recipient_name: o.name || null, recipient_email: o.email || null, service: o.service || null, message: o.message || null }, 'return=representation').then(function (x) { x.code = code; x.expiresAt = x.ok && x.data && x.data[0] ? x.data[0].expires_at : null; return x; });
      });
    },
    revokeInvite: function (code) { return db('POST', 'rpc/revoke_invite', { p_code: code }); },
    myInvites: function () { return db('GET', 'invites?select=code,recipient_name,recipient_email,service,status,created_at,expires_at,accepted_at,generation&order=created_at.desc&limit=200'); },
    inviteLink: function (code) { return location.origin + '/app#publico-convite-' + String(code).replace('-', ''); },
    invitePreview: function (code) { return db('POST', 'rpc/invite_preview', { p_code: code }); },
    acceptInvite: function (code) { return db('POST', 'rpc/accept_invite', { p_code: code, p_idem: 'accept:' + String(code).toUpperCase() }); },
    // vínculos em que esta conta é aluno ou treinador
    links: function () {
      if (!sess) return Promise.resolve([]);
      return db('GET', 'links?select=id,status,origin,prep,prep_request_note,answers,created_at,student_id,trainers(slug,name,user_id),workouts(template_id,title,current_version,workout_versions(version,sessions,schedule,created_at,change_note))&status=in.(ativo,pausado,encerrado)&order=created_at.desc').then(function (r) {
        // falha de leitura NÃO vira "sem vínculo": mantém o que já se sabia e marca como desatualizado
        if (!r.ok || !Array.isArray(r.data)) { linksFailed = true; var prev = []; try { prev = JSON.parse(LS.getItem('c99.vinculos') || '[]'); } catch (_) {} return prev; }
        linksFailed = false;
        var L = r.data;
        var ids = L.map(function (l) { return l.student_id; }).filter(function (v, i, a) { return v && a.indexOf(v) === i; });
        return (ids.length ? db('GET', 'profiles?select=id,display_name&id=in.(' + ids.join(',') + ')') : Promise.resolve({ ok: true, data: [] })).then(function (p) {
          var N = {}; ((p.ok && p.data) || []).forEach(function (x) { N[x.id] = x.display_name; });
          var out = L.map(function (l) {
            var w = (l.workouts || [])[0], v = w ? (w.workout_versions || []).filter(function (x) { return x.version === w.current_version; })[0] : null;
            return { id: l.id, status: l.status, origin: l.origin, prep: l.prep, answers: l.answers || {}, prepNote: l.prep_request_note || '', since: l.created_at, studentId: l.student_id, studentName: N[l.student_id] || 'Aluno',
            workout: w && v ? { title: w.title, version: w.current_version, sessions: v.sessions || [], schedule: v.schedule || null, assignedAt: v.created_at, changeNote: v.change_note || null } : null,
            trainerName: l.trainers && l.trainers.name, trainerSlug: l.trainers && l.trainers.slug, mine: l.student_id === sess.user.id ? 'aluno' : 'treinador', ended: l.status === 'encerrado' }; });
          try { LS.setItem('c99.vinculos', JSON.stringify(out)); } catch (_) {}
          return out;
        });
      });
    },
    // ---------- preparação, treino e registro (mesmas funções do site) ----------
    answerPrep: function (link, key, value, done) { return db('POST', 'rpc/answer_prep', { p_link: link, p_key: key, p_value: value, p_done: !!done, p_idem: 'prep:' + link + ':' + key + ':' + hash(value) + ':' + (done ? 1 : 0) }); },
    reviewPrep: function (link) { return db('POST', 'rpc/review_prep', { p_link: link, p_idem: 'review:' + link }); },
    assignWorkout: function (link, title, sessions, version) {
      var body = { p_link: link, p_title: title, p_template: 'manual', p_sessions: sessions, p_schedule: null, p_idem: 'assign:' + link + ':v' + (version || 0) + ':' + hash(JSON.stringify([title, sessions])) };
      return db('POST', 'rpc/assign_workout', body);
    },
    submitSession: function (link, key, logs) { return db('POST', 'rpc/submit_session', { p_link: link, p_key: key, p_logs: logs, p_idem: 'submit:' + key }); },
    sessions: function (link) { return db('GET', 'sessions?select=id,session_key,started_at,submitted_at,app_state,set_logs(item,set_no,reps,load_kg,exercise_id,exercise_name),session_comments(id,side,body,created_at)&link_id=eq.' + encodeURIComponent(link)); },
    // ---------- pedidos de acompanhamento (pedido não é vínculo; o treinador decide) ----------
    createRequest: function (slug, message, search) {
      if (!sess) return Promise.resolve({ ok: false, nosession: true });
      return db('GET', 'trainers?select=id,offers(id,key)&slug=eq.' + encodeURIComponent(slug)).then(function (r) {
        var t = r.ok && r.data && r.data[0]; if (!t) return { ok: false, msg: 'Perfil não encontrado.' };
        var of = (t.offers || []).filter(function (o) { return o.key === 'principal'; })[0];
        return db('POST', 'requests', { trainer_id: t.id, student_id: sess.user.id, offer_id: of ? of.id : null, message: message || null, search_sport: (search && search.esporte) || null, search_city: (search && search.cidade) || null }).then(function (x) {
          if (!x.ok && /requests_one_pending|duplicate/i.test(x.msg || '')) { x.ok = true; x.already = true; }
          return x;
        });
      });
    },
    requests: function () {
      if (!sess) return Promise.resolve([]);
      return db('GET', 'requests?select=id,status,message,decline_reason,created_at,expires_at,student_id,trainers(slug,name,user_id),offers(key,title,price_cents,unit)&order=created_at.desc&limit=100').then(function (r) {
        if (!r.ok || !Array.isArray(r.data)) { reqsFailed = true; return lastReqs; }
        reqsFailed = false;
        var L = r.data;
        var ids = L.map(function (x) { return x.student_id; }).filter(function (v, i, a) { return v && a.indexOf(v) === i && v !== sess.user.id; });
        return (ids.length ? db('GET', 'profiles?select=id,display_name&id=in.(' + ids.join(',') + ')') : Promise.resolve({ ok: true, data: [] })).then(function (p) {
          var N = {}; ((p.ok && p.data) || []).forEach(function (x) { N[x.id] = x.display_name; });
          return (lastReqs = L.map(function (x) { return { id: x.id, status: x.status, message: x.message || '', reason: x.decline_reason || '', at: x.created_at, due: x.expires_at, mine: x.student_id === sess.user.id ? 'aluno' : 'treinador',
            studentName: N[x.student_id] || 'Aluno', trainerName: x.trainers && x.trainers.name, trainerSlug: x.trainers && x.trainers.slug,
            offer: x.offers ? x.offers.title + ' · ' + (x.offers.price_cents != null && x.offers.unit ? 'R$ ' + (x.offers.price_cents / 100).toLocaleString('pt-BR') + ' / ' + ({ mes: 'mês', sessao: 'sessão', aula: 'aula' }[x.offers.unit] || x.offers.unit) : 'Sob consulta') : '' }; }));
        });
      });
    },
    cancelRequest: function (id) { return db('POST', 'rpc/decide_request', { p_id: id, p_decision: 'cancelado', p_idem: 'cancel:' + id }); },
    declineRequest: function (id, reason) { return db('POST', 'rpc/decline_request', { p_id: id, p_reason: reason, p_idem: 'decide:' + id + ':recusado' }); },
    prepMore: function (link, note) { return db('POST', 'rpc/request_prep_more', { p_link: link, p_note: note }); },
    decideRequest: function (id, decision) { return db('POST', 'rpc/decide_request', { p_id: id, p_decision: decision, p_idem: 'decide:' + id + ':' + decision }); },
    // ---------- vínculo: pausar, retomar, encerrar (com motivo; nada é apagado) ----------
    changeLink: function (link, action, reason, note) {
      var go = function (a) { var k = 'link:' + link + ':' + a; return db('POST', 'rpc/change_link', { p_link: link, p_action: a, p_reason: reason, p_note: note || null, p_idem: intent(k) }).then(settle(k)); };
      var ALT = { pausar: 'pausado', retomar: 'retomado', encerrar: 'encerrado' };
      return go(action).then(function (r) { return (!r.ok && !r.offline && ALT[action] && /action|ação|acao|invalid|inválid/i.test(r.msg || '')) ? go(ALT[action]) : r; });
    },
    // ---------- agenda (horário livre só existe para quem tem vínculo ativo) ----------
    myAvailability: function () {
      if (!sess) return Promise.resolve({ ok: false });
      return db('GET', 'trainers?select=id&user_id=eq.' + encodeURIComponent(sess.user.id)).then(function (r) {
        var t = r.ok && r.data && r.data[0]; if (!t) return { ok: true, data: [] };
        return db('GET', 'availability_rules?select=weekday,start_min,end_min,slot_min,tz&trainer_id=eq.' + t.id + '&order=weekday.asc,start_min.asc');
      });
    },
    setAvailability: function (rules, tz) { return db('POST', 'rpc/set_availability', { p_rules: rules, p_tz: tz }); },
    freeSlots: function (link, days) { return db('POST', 'rpc/free_slots', { p_link: link, p_days: days || 14 }); },
    bookSlot: function (link, startsAt) { var k = 'book:' + link + ':' + startsAt; return db('POST', 'rpc/book_slot', { p_link: link, p_starts_at: startsAt, p_idem: intent(k) }).then(settle(k)); },
    cancelAppointment: function (id, reason) { return db('POST', 'rpc/cancel_appointment', { p_id: id, p_reason: reason || null }); },
    appointments: function (linkIds) { return linkIds.length ? db('GET', 'appointments?select=id,link_id,starts_at,ends_at,tz,status,booked_by&link_id=in.(' + linkIds.join(',') + ')&status=eq.marcado&ends_at=gte.' + encodeURIComponent(new Date(Date.now() - 36e5).toISOString()) + '&order=starts_at.asc') : Promise.resolve({ ok: true, data: [] }); },
    // ---------- mensagens do vínculo ----------
    messages: function (link) { return db('GET', 'messages?select=id,side,body,client_id,created_at,read_at&link_id=eq.' + encodeURIComponent(link) + '&order=created_at.asc&limit=500'); },
    sendMessage: function (link, body) { var k = 'msg:' + link + ':' + hash(body); return db('POST', 'rpc/send_message', { p_link: link, p_body: body, p_client_id: intent(k), p_session: null }).then(settle(k)); },
    intent: intent, settle: settle,
    markRead: function (link) { return db('POST', 'rpc/mark_read', { p_link: link }); },
    // vínculos em andamento (ativo/pausado); encerrados ficam em endedLinks, só para histórico
    cachedLinks: function () { var L = []; try { L = JSON.parse(LS.getItem('c99.vinculos') || '[]'); } catch (_) {} return L.filter(function (l) { return !l.ended; }); },
    endedLinks: function () { var L = []; try { L = JSON.parse(LS.getItem('c99.vinculos') || '[]'); } catch (_) {} return L.filter(function (l) { return l.ended; }); },
    syncFailed: function () { return linksFailed || reqsFailed; },
    // conta 18+ (regra de mercado): registrada no perfil
    confirmAdult: function () { return sess ? db('PATCH', 'profiles?id=eq.' + encodeURIComponent(sess.user.id), { adult_confirmed_at: new Date().toISOString() }) : Promise.resolve({ ok: false }); },
    // retira o perfil da busca (volta a rascunho; nada é apagado)
    unpublish: function () { return sess ? db('PATCH', 'trainers?user_id=eq.' + encodeURIComponent(sess.user.id), { status: 'rascunho' }) : Promise.resolve({ ok: false, nosession: true }); },
    // publica o perfil (passa a aparecer na busca do site)
    publish: function () { return sess ? db('PATCH', 'trainers?user_id=eq.' + encodeURIComponent(sess.user.id), { status: 'publicado' }) : Promise.resolve({ ok: false, nosession: true }); },
    session: function () { return sess; },
    // leitura pública (o que qualquer visitante pode ver), sem depender de conta
    pub: function (path) { return call('GET', '/rest/v1/' + path); },
    db: function (method, path, body, prefer) { return db(method, path, body, prefer); },
    rpc: function (fn, args) { return db('POST', 'rpc/' + fn, args || {}); },
    // verificação em duas etapas (app autenticador, TOTP) — exigida pelo banco para a administração (aal2)
    aal: function () { try { return JSON.parse(atob(String(sess.access_token).split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).aal || 'aal1'; } catch (_) { return 'aal1'; } },
    mfaFactors: function () { return auth('GET', '/auth/v1/user').then(function (r) { return r.ok ? ((r.data && r.data.factors) || []).filter(function (f) { return f.factor_type === 'totp'; }) : null; }); },
    mfaEnroll: function () { return auth('POST', '/auth/v1/factors', { factor_type: 'totp', friendly_name: '99coach ' + new Date().toISOString().slice(0, 10) }); },
    mfaUnenroll: function (id) { return auth('DELETE', '/auth/v1/factors/' + id); },
    mfaVerify: function (id, code) {
      return auth('POST', '/auth/v1/factors/' + id + '/challenge', {}).then(function (c) {
        if (!c.ok || !c.data || !c.data.id) return c;
        return auth('POST', '/auth/v1/factors/' + id + '/verify', { challenge_id: c.data.id, code: code }).then(function (v) {
          if (v.ok && v.data && v.data.access_token) keep({ access_token: v.data.access_token, refresh_token: v.data.refresh_token, user: v.data.user || sess.user });
          return v;
        });
      });
    },
    // encerrar a sessão nos outros aparelhos (esta continua)
    signOutOthers: function () { return auth('POST', '/auth/v1/logout?scope=others'); },
    // login com Google: vai ao servidor de contas e volta para esta página já autenticado
    oauth: function (provider, o) {
      try { LS.setItem('c99.oauth', JSON.stringify(o || {})); } catch (_) {}
      location.href = URL0 + '/auth/v1/authorize?provider=' + encodeURIComponent(provider) + '&redirect_to=' + encodeURIComponent(location.origin + location.pathname);
    },
    // chamado pelo cadastro ao abrir: se acabou de voltar do Google, devolve { role, email, name } uma única vez
    oauthBack: function () {
      var v = null; try { v = JSON.parse(LS.getItem('c99.oauthVolta') || 'null'); LS.removeItem('c99.oauthVolta'); } catch (_) {}
      return sess ? v : null;
    },
    user: function () { return sess && sess.user || null; },
    // cria a conta com e-mail e senha; o servidor confirma na hora e já devolve a sessão
    signUp: function (email, password, name) {
      return call('POST', '/auth/v1/signup', { email: String(email || '').trim().toLowerCase(), password: password, data: { name: name || '' } }).then(function (r) {
        var d = r.data || {};
        if (r.ok && d.access_token) keep({ access_token: d.access_token, refresh_token: d.refresh_token, user: { id: d.user && d.user.id, email: d.user && d.user.email } });
        r.session = !!(r.ok && d.access_token);
        r.exists = /already registered|already exists/i.test(r.msg || '') || (r.ok && !d.access_token && d.identities && d.identities.length === 0);
        return r;
      });
    },
    // entra com e-mail e senha
    signIn: function (email, password) {
      return call('POST', '/auth/v1/token?grant_type=password', { email: String(email || '').trim().toLowerCase(), password: password }).then(function (r) {
        var d = r.data || {};
        if (r.ok && d.access_token) keep({ access_token: d.access_token, refresh_token: d.refresh_token, user: { id: d.user && d.user.id, email: d.user && d.user.email } });
        r.session = !!(r.ok && d.access_token);
        r.wrong = /invalid login credentials/i.test(r.msg || '');
        r.unconfirmed = /not confirmed/i.test(r.msg || '');
        return r;
      });
    },
    // envia o e-mail para criar uma senha nova
    recover: function (email) { return call('POST', '/auth/v1/recover?redirect_to=' + encodeURIComponent(location.origin + location.pathname), { email: String(email || '').trim().toLowerCase() }); },
    // grava a senha nova de quem chegou pelo link do e-mail (já autenticado por ele)
    setPassword: function (pw) { return sess ? call('PUT', '/auth/v1/user', { password: pw }, true) : Promise.resolve({ ok: false, nosession: true }); },
    newPasswordPending: function () { try { return !!sess && LS.getItem('c99.novaSenha') === '1'; } catch (_) { return false; } },
    newPasswordDone: function () { try { LS.removeItem('c99.novaSenha'); } catch (_) {} },
    // nome de exibição da conta
    setName: function (name) { return sess && name ? call('PATCH', '/rest/v1/profiles?id=eq.' + encodeURIComponent(sess.user.id), { display_name: name }, true) : Promise.resolve({ ok: false }); },
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
