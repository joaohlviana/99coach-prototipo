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
  var CONTA = {
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
    me: function () { return sess ? call('GET', '/rest/v1/profiles?id=eq.' + encodeURIComponent(sess.user.id) + '&select=*', null, true) : Promise.resolve({ ok: false }); },
    signOut: function () { var p = sess ? call('POST', '/auth/v1/logout', null, true) : Promise.resolve(); keep(null); return p; }
  };
  window.CONTA = CONTA;
})();
