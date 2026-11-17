/* Vídeos dos exercícios: YouTube (link colado ou sugestão automática) e vídeo enviado pelo treinador.
   O vídeo escolhido fica no próprio exercício (e.video) e vai junto no treino que o aluno recebe.
   Formato: { kind: 'youtube', id, title, channel } ou { kind: 'arquivo', url, path, name } */
(function () {
  var ID = /^[A-Za-z0-9_-]{11}$/;
  var BUCKET = 'exercicio-videos';
  var VID = {
    // aceita youtube.com/watch?v=, youtu.be/, /shorts/, /embed/, /live/ e m.youtube.com
    parse: function (txt) {
      var s = String(txt || '').trim(); if (!s) return null;
      if (ID.test(s)) return s;
      var u; try { u = new URL(/^https?:\/\//i.test(s) ? s : 'https://' + s); } catch (_) { return null; }
      var h = u.hostname.replace(/^(www|m|music)\./, '');
      var id = '';
      if (h === 'youtu.be') id = u.pathname.split('/')[1] || '';
      else if (h === 'youtube.com' || h === 'youtube-nocookie.com') {
        id = u.searchParams.get('v') || '';
        var m = /^\/(shorts|embed|live|v)\/([^/?#]+)/.exec(u.pathname); if (!id && m) id = m[2];
      }
      return ID.test(id) ? id : null;
    },
    thumb: function (id) { return 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg'; },
    embed: function (id, auto) { return 'https://www.youtube-nocookie.com/embed/' + id + '?rel=0&modestbranding=1&playsinline=1' + (auto ? '&autoplay=1' : ''); },
    watch: function (id) { return 'https://www.youtube.com/watch?v=' + id; },
    searchUrl: function (q) { return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q + ' execução'); },
    of: function (exId) { var e = ((window.DB && window.DB.exercicios) || []).filter(function (x) { return x && x.id === exId; })[0]; return (e && VID.valid(e.video)) ? VID.clean(e.video) : null; },
    valid: function (v) { return !!(v && ((v.kind === 'youtube' && ID.test(v.id || '')) || (v.kind === 'arquivo' && /^https:\/\//.test(v.url || '')))); },
    clean: function (v) { return v.kind === 'youtube' ? { kind: 'youtube', id: v.id, title: String(v.title || '').slice(0, 140) } : { kind: 'arquivo', url: v.url, path: v.path || '', name: String(v.name || '').slice(0, 80) }; },
    // sugestões automáticas (guardadas neste aparelho por 7 dias para não repetir a mesma busca)
    search: function (q) {
      var k = 'c99.vid:' + String(q).toLowerCase(), LS = null; try { LS = window.localStorage; } catch (_) {}
      try { var c = JSON.parse((LS && LS.getItem(k)) || 'null'); if (c && Date.now() - c.t < 7 * 864e5) return Promise.resolve(c.d); } catch (_) {}
      if (!window.CONTA || !window.CONTA.session()) return Promise.resolve({ ok: false, motivo: 'sem_sessao' });
      return window.CONTA.fn('videos-exercicio', { acao: 'buscar', q: q }).then(function (r) {
        var d = (r.ok && r.data) || { ok: false, motivo: r.offline ? 'offline' : 'falhou' };
        if (d.ok && d.configured && d.items && d.items.length) { try { LS.setItem(k, JSON.stringify({ t: Date.now(), d: d })); } catch (_) {} }
        return d;
      });
    },
    info: function (id) {
      if (!window.CONTA || !window.CONTA.session()) return Promise.resolve({ ok: false });
      return window.CONTA.fn('videos-exercicio', { acao: 'info', id: id }).then(function (r) { return (r.ok && r.data) || { ok: false }; });
    },
    // envio do vídeo do treinador: pasta da própria conta; devolve o endereço público para tocar no app
    upload: function (file, exId) {
      var C = window.CONTA, s = C && C.session();
      if (!s) return Promise.resolve({ ok: false, motivo: 'sem_sessao' });
      if (!file || !/^video\//.test(file.type || '')) return Promise.resolve({ ok: false, motivo: 'tipo' });
      if (file.size > 100 * 1024 * 1024) return Promise.resolve({ ok: false, motivo: 'grande' });
      var ext = (/\.([a-z0-9]{2,4})$/i.exec(file.name || '') || [, 'mp4'])[1].toLowerCase();
      var path = s.user.id + '/' + String(exId || 'exercicio').replace(/[^a-z0-9-]/gi, '').slice(0, 40) + '-' + Date.now().toString(36) + '.' + ext;
      return C.fileUp(BUCKET, path, file).then(function (r) {
        if (!r.ok) return { ok: false, motivo: r.offline ? 'offline' : (r.status === 413 ? 'grande' : 'falhou') };
        return { ok: true, video: { kind: 'arquivo', url: C.publicUrl(BUCKET, path), path: path, name: file.name || 'Vídeo enviado' } };
      });
    },
    remove: function (v) { if (v && v.kind === 'arquivo' && v.path && window.CONTA) window.CONTA.fileDel(BUCKET, v.path); }
  };
  // sessões de um programa no formato de leitura do aluno (também usado na prévia do treinador): exercícios com prescrição e vídeo
  VID.sessionsView = function (sessions, openIdx, toggle) {
    return (Array.isArray(sessions) ? sessions : []).map(function (s, i) {
      var v = VID.valid(s && s.video) ? s.video : null, open = openIdx === i;
      return { n: String(i + 1), title: (s && s.title) || ('Sessão ' + (i + 1)), text: (s && s.text) || '', hasText: !!(s && s.text),
        items: ((s && s.items) || []).map(function (it) { var rx = [it.sets ? it.sets + ' séries' : '', it.reps ? it.reps + ' repetições' : '', it.rest ? 'descanso ' + it.rest : ''].filter(Boolean).join(' · ');
          return { name: it.name || 'Exercício', rx: rx, hasRx: !!rx, note: it.note || '', hasNote: !!it.note }; }),
        hasItems: !!((s && s.items) || []).length, hasVid: !!v, vidOpen: open && !!v, vidYt: open && !!v && v.kind === 'youtube', vidFile: open && !!v && v.kind === 'arquivo',
        vidEmbed: open && v && v.kind === 'youtube' ? VID.embed(v.id, true) : '', vidUrl: open && v && v.kind === 'arquivo' ? v.url : '',
        vidLabel: open ? 'Fechar vídeo' : 'Ver vídeo', vidTitle: 'Vídeo: ' + ((s && s.title) || 'sessão'), toggleVid: function () { toggle(open ? -1 : i); } };
    });
  };
  window.VID = VID;
})();
