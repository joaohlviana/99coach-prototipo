/* Biblioteca do treinador na conta: rotinas, exercícios próprios, formulários e pastas.
   O que o treinador cria fica no servidor (tabela trainer_library) e vale em qualquer aparelho.
   - Ao abrir: busca o que está na conta. Se este aparelho não mudou nada desde a última gravação, vale a conta.
     Se só este aparelho mudou, vale o que está aqui. Se os dois mudaram, junta: o que difere fica em duas cópias.
   - A cada mudança: grava na conta pouco depois. Se outro aparelho gravou antes, junta e tenta de novo.
   - Sem conexão ou com erro: continua neste aparelho e a tela avisa; tenta de novo na próxima mudança ou ao reconectar. */
(function () {
  var LS = null; try { LS = window.localStorage; } catch (_) {}
  var KINDS = ['rotinas', 'exercicios', 'formularios', 'pastas'];
  var MAX = 1400000;
  var st = { uid: '', phase: 'parado', state: '', at: '', merged: false, timer: null, busy: false, again: false };
  function demo() { return document.documentElement.classList.contains('demo'); }
  function meta() { try { return JSON.parse((LS && LS.getItem('c99.lib')) || '{}'); } catch (_) { return {}; } }
  function setMeta(m) { try { if (LS) LS.setItem('c99.lib', JSON.stringify(m)); } catch (_) {} }
  // texto canônico (chaves em ordem): o banco devolve o JSON com as chaves em outra ordem, e isso não pode parecer mudança
  function canon(v) {
    if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
    if (v && typeof v === 'object') return '{' + Object.keys(v).sort().map(function (k) { return JSON.stringify(k) + ':' + canon(v[k]); }).join(',') + '}';
    return JSON.stringify(v === undefined ? null : v);
  }
  function hash(s) { var h = 5381, i = s.length; while (i) h = (h * 33) ^ s.charCodeAt(--i); return (h >>> 0).toString(36) + ':' + s.length; }
  function hhmm() { var d = new Date(); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  function ready() {
    if (demo() || !window.DB || !window.CONTA || !window.CONTA.session() || !window.ACCT || window.ACCT.area() !== 'treinador') return false;
    try { return LS.getItem('c99.contaIniciada') === '1'; } catch (_) { return false; }
  }

  // o que vai para a conta em cada tipo (exercícios: só os próprios e os favoritos do catálogo; o catálogo 99Coach não é copiado)
  function localDoc(kind) {
    var a = Array.isArray(window.DB[kind]) ? window.DB[kind] : [];
    if (kind !== 'exercicios') return a;
    return a.filter(function (e) { return e && (e.own || e.fav); }).map(function (e) { return e.own ? e : { id: e.id, ref: true, fav: true }; });
  }
  function applyDoc(kind, doc) {
    if (!Array.isArray(doc)) return;
    if (kind !== 'exercicios') { window.DB[kind] = doc; return; }
    var favs = {}, own = [];
    doc.forEach(function (e) { if (!e) return; if (e.ref) favs[e.id] = true; else own.push(e); });
    var cat = (window.DB.exercicios || []).filter(function (e) { return e && !e.own; });
    cat.forEach(function (e) { e.fav = !!favs[e.id]; });
    window.DB.exercicios = cat.concat(own);
  }
  // conflito de verdade (outro aparelho gravou e este também mudou): nada é descartado. Item que só existe aqui é mantido;
  // item que existe nos dois e está diferente fica em duas cópias, a daqui marcada "(deste aparelho)", para a pessoa escolher.
  function merge(server, local) {
    var by = {}, out = [];
    (server || []).forEach(function (x) { if (x && x.id != null) { by[x.id] = x; out.push(x); } });
    (local || []).forEach(function (x) {
      if (!x || x.id == null) return;
      var sv = by[x.id];
      if (!sv) { out.push(x); return; }
      if (x.ref || sv.ref || canon(sv) === canon(x)) return;
      var c = JSON.parse(JSON.stringify(x)); c.id = String(x.id) + '-ap' + Date.now().toString(36) + out.length; if (c.name) c.name = c.name + ' (deste aparelho)'; st.dup = (st.dup || 0) + 1; out.push(c);
    });
    return out;
  }
  function setState(s) { if (st.state === s) return; st.state = s; if (window.__rerender) window.__rerender(); }

  function pushKind(kind, tries) {
    var m = meta(), doc = localDoc(kind), snap = canon(doc), h = hash(snap);
    var cur = m[kind] || { v: 0, h: '' };
    if (cur.h === h) return Promise.resolve({ ok: true, same: true });
    if (snap.length > MAX) return Promise.resolve({ ok: false, big: true });
    return window.CONTA.rpc('save_library', { p_kind: kind, p_doc: doc, p_version: cur.v || 0 }).then(function (r) {
      if (!r.ok) return r;
      var d = r.data || {};
      if (d.saved) { var m2 = meta(); m2[kind] = { v: d.version, h: h }; setMeta(m2); return { ok: true }; }
      if (d.conflict && (tries || 0) < 2) {
        // outro aparelho gravou antes: junta e grava de novo sobre a versão nova
        var joined = merge(d.doc, doc); applyDoc(kind, joined); st.merged = true;
        var m3 = meta(); m3[kind] = { v: d.version, h: hash(canon(d.doc)) }; setMeta(m3);
        if (window.STORE) window.STORE.saveDb(true);
        return pushKind(kind, (tries || 0) + 1);
      }
      return { ok: false };
    });
  }
  function pushAll() {
    if (!ready() || st.phase !== 'pronto') return;
    if (st.busy) { st.again = true; return; }
    st.busy = true; st.again = false;
    var dirty = KINDS.some(function (k) { return ((meta()[k] || {}).h || '') !== hash(canon(localDoc(k))); });
    if (!dirty) { st.busy = false; return; }
    setState('salvando');
    KINDS.reduce(function (p, k) { return p.then(function (acc) { return pushKind(k).then(function (r) { acc.push(r); return acc; }); }); }, Promise.resolve([])).then(function (rs) {
      st.busy = false;
      var bad = rs.filter(function (r) { return !r.ok; })[0];
      if (!bad) { st.at = hhmm(); setState('salvo'); }
      else if (bad.big) setState('grande');
      else if (bad.offline) setState('offline');
      else if (/sem_perfil_de_treinador/.test(bad.raw || bad.msg || '')) { st.phase = 'semperfil'; setState(''); }
      else setState('erro');
      if (st.again) schedule();
    });
  }
  function schedule() { clearTimeout(st.timer); st.timer = setTimeout(pushAll, 1500); }

  function start() {
    var s = window.CONTA.session(); st.uid = s.user.id; st.phase = 'carregando';
    // outra conta entrou neste aparelho (sessão vencida e novo login, por exemplo): a biblioteca guardada aqui não é dela
    var mu = meta();
    if (mu.uid && mu.uid !== st.uid) {
      ['rotinas', 'formularios', 'pastas'].forEach(function (k) { window.DB[k] = []; });
      window.DB.exercicios = (window.DB.exercicios || []).filter(function (e) { return e && !e.own; }); window.DB.exercicios.forEach(function (e) { e.fav = false; });
      mu = { limpo: 1 }; if (window.STORE) window.STORE.saveDb(true);
    }
    mu.uid = st.uid; setMeta(mu);
    // exemplo de demonstração que não pertence a uma conta real
    if (!meta().limpo) { window.DB.exercicios = (window.DB.exercicios || []).filter(function (e) { return !(e && e.own && e.id === 'mob-ombro'); }); var m0 = meta(); m0.limpo = 1; setMeta(m0); }
    window.CONTA.db('GET', 'trainer_library?select=kind,doc,version').then(function (r) {
      if (!r.ok) { st.phase = 'parado'; st.uid = ''; setState(r.offline ? 'offline' : 'erro'); return; }
      var m = meta(), changed = false;
      (r.data || []).forEach(function (row) {
        if (KINDS.indexOf(row.kind) < 0 || !Array.isArray(row.doc)) return;
        var local = localDoc(row.kind), lh = hash(canon(local)), cur = m[row.kind] || { v: 0, h: '' };
        var sh = hash(canon(row.doc));
        if (lh === sh) { m[row.kind] = { v: row.version, h: sh }; return; }
        var untouched = cur.h === lh || (!cur.v && !local.length);
        m[row.kind] = { v: row.version, h: sh };
        if (untouched) { applyDoc(row.kind, row.doc); changed = true; }
        // só este aparelho mudou desde a última gravação (edição sem conexão, por exemplo): o que está aqui vale e é enviado
        else if (cur.v === row.version) { return; }
        else { applyDoc(row.kind, merge(row.doc, local)); st.merged = true; changed = true; }
      });
      setMeta(m); st.phase = 'pronto';
      if (changed && window.STORE) window.STORE.saveDb(true);
      st.at = hhmm(); st.state = ''; setState('salvo');
      pushAll();
    });
  }

  var LIB = {
    // chamado a cada gravação local: começa na primeira vez e agenda o envio do que mudou
    touch: function () {
      if (!ready()) { if (st.phase !== 'parado') { st.phase = 'parado'; st.uid = ''; st.state = ''; } return; }
      var s = window.CONTA.session();
      if (st.phase === 'parado' || st.uid !== s.user.id) { start(); return; }
      if (st.phase === 'pronto') schedule();
    },
    active: function () { return ready() && st.phase !== 'semperfil'; },
    // texto para a tela: onde a biblioteca está guardada agora
    notice: function () {
      if (!LIB.active()) return null;
      if (st.state === 'offline') return ['Sem conexão: salvo só neste aparelho', 'Suas mudanças vão para a sua conta quando a conexão voltar.', 'warn'];
      if (st.state === 'erro') return ['Ainda não salvo na sua conta', 'Suas mudanças continuam neste aparelho. Tentamos de novo na próxima alteração.', 'warn'];
      if (st.state === 'grande') return ['Biblioteca grande demais para salvar na conta', 'Apague rotinas ou formulários antigos. Por enquanto, as mudanças novas ficam só neste aparelho.', 'warn'];
      if (st.merged) return ['Biblioteca atualizada com outro aparelho', 'Juntamos o que estava na sua conta com o que estava aqui. ' + (st.dup ? 'O que estava diferente nos dois ficou em duas cópias; a daqui tem "(deste aparelho)" no nome. Apague a que não quiser.' : 'Nada foi descartado.'), 'info'];
      if (st.state === 'salvando' || st.phase === 'carregando') return ['Salvando na sua conta…', '', 'info'];
      if (st.state === 'salvo') return ['Salvo na sua conta', 'Sua biblioteca vale em qualquer aparelho em que você entrar. Última gravação às ' + st.at + '.', 'info'];
      return null;
    },
    seenMerge: function () { st.merged = false; st.dup = 0; },
    _st: st
  };
  window.LIB = LIB;

  // liga na gravação local que já acontece a cada mudança de tela
  if (window.STORE && !window.STORE.__lib) {
    var orig = window.STORE.saveDb;
    window.STORE.saveDb = function (silent) { orig.apply(window.STORE, arguments); if (silent !== true) LIB.touch(); };
    window.STORE.__lib = 1;
  }
  window.addEventListener('online', function () { if (st.phase === 'pronto') schedule(); else LIB.touch(); });
})();
