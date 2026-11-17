/* TRE11 · Detalhe do exercício: como executar, unidades, mídia (com estados), alternativas, favoritar e adicionar à sessão */
REG.screen({
  page: 'treinador', key: 'exercicio', id: 'TRE11', title: 'Exercício', nav: 'exercicios', back: 'history',
  testIds: ['agach', 'mob-ombro'],
  normal: 'Com vídeo',
  scens: [['midiafalhou', 'Mídia falhou'], ['retirado', 'Exercício retirado'], ['semvideo', 'Sem vídeo'], ['naoaut', 'Mídia não autorizada'],
    ['destino', 'Destino alterado'], ['leitura', 'Erro de leitura']],
  vals: function (ctx) {
    var T = window.T3, ui = ctx.ui, scn = ctx.scn;
    var e = DB.find('exercicios', ctx.id || 'agach');
    if (!e) return { found: false, notFound: true, back: function () { GO('TRE10'); } };
    var set = function (o) { ctx.setUi(o); };
    var pr = ctx.p.rotina && T.rot(ctx.p.rotina) ? { rid: ctx.p.rotina, sid: ctx.p.sessao || (T.sessions(ctx.p.rotina)[0] || {}).id } : null;
    var dest = ui.dest || pr;
    var reading = scn === 'leitura' && !ui.fixed;
    var retired = scn === 'retirado';

    // mídia: vídeo escolhido pelo treinador (YouTube ou enviado) · imagem · sem; situações: falhou, sem vídeo, não autorizada
    var V = window.VID, demoMode = document.documentElement.classList.contains('demo');
    var vid = V && V.valid(e.video) ? e.video : null;
    var media = scn === 'semvideo' ? 'sem' : (vid ? 'video' : (demoMode ? e.media : 'sem'));
    var mstate = scn === 'midiafalhou' && !ui.mediaOk ? 'falhou' : (scn === 'naoaut' ? 'naoaut' : media);
    var isVideo = mstate === 'video', isImg = mstate === 'imagem', noMedia = mstate === 'sem', mFail = mstate === 'falhou', mDenied = mstate === 'naoaut';

    var alts = DB.exercicios.filter(function (x) { return x.id !== e.id && x.group === e.group; }).slice(0, 3).map(function (x) {
      var diff = x.equip !== e.equip ? 'com ' + x.equip.toLowerCase() : (x.level !== e.level ? 'nível ' + x.level.toLowerCase() : 'mesmo grupo');
      return { name: x.name, diff: diff, go: function () { GO('TRE11', Object.assign({ id: x.id }, dest ? { rotina: dest.rid, sessao: dest.sid } : {})); } };
    });
    var isTime = /prancha|mobilidade/i.test(e.name) || e.group === 'Core';
    var units = [['Carga', e.equip === 'Peso do corpo' || e.equip === 'Bastão' ? 'sem carga externa' : 'kg ou lb'], [isTime ? 'Tempo' : 'Repetições', isTime ? 'segundos' : 'repetições'], ['Descanso', 'segundos ou minutos']];

    var dests = T.dests().map(function (d) {
      var on = !!(dest && dest.rid === d.rid && dest.sid === d.sid);
      return { label: d.label, cls: 'chip' + (on ? ' is-on' : ''), on: String(on), pick: function () { set({ dest: { rid: d.rid, sid: d.sid }, destOpen: false }); } };
    });
    var add = function () {
      if (retired) { ctx.toast('Exercício retirado não entra em novas sessões.'); return; }
      if (!dest) { set({ destOpen: true }); return; }
      if (scn === 'destino' && !ui.destOk) { set({ nt: 'destino' }); return; }
      var s = T.addToSession(dest.rid, dest.sid, [e.id]);
      GO('TRE14', { id: dest.rid, sessao: s ? s.id : dest.sid, added: '1' });
    };

    var nt = ui.nt !== undefined ? ui.nt : ({ midiafalhou: 'midia', retirado: 'retirado', semvideo: 'semvideo', naoaut: 'naoaut', destino: 'destino', leitura: 'leitura' }[scn] || (ctx.p.salvo ? 'salvo' : ''));
    var notice = T.none();
    if (nt === 'midia' && mFail) notice = T.notice('warn', 'alert', 'Mídia falhou', 'O vídeo não carregou. A instrução em texto continua completa abaixo.', [['Tentar de novo', function () { set({ mediaOk: true, nt: '' }); }]]);
    if (nt === 'retirado') notice = T.notice('info', 'info', 'Exercício retirado', 'Fica no histórico das sessões em que já foi usado e sai da busca. Não é trocado automaticamente.', [['Saiba por quê', function () {
      ctx.ask({ title: 'Por que foi retirado?', text: 'A biblioteca 99Coach retirou este exercício da busca para revisão da demonstração. Sessões antigas continuam mostrando a prescrição original.', lines: ['Para novas sessões, escolha uma alternativa abaixo.', 'A troca é sempre sua; nada muda sozinho.'], ok: 'Entendi', cancel: false });
    }]]);
    if (nt === 'semvideo') notice = T.notice('info', 'info', 'Sem vídeo', 'Este exercício mostra só a instrução em texto.');
    if (nt === 'naoaut') notice = T.notice('warn', 'lock', 'Mídia não autorizada', 'A demonstração não tem autorização de uso confirmada e não é exibida. A instrução continua disponível.', [['Saiba por quê', function () {
      ctx.ask({ title: 'Mídia sem autorização', text: 'Só exibimos vídeos e fotos com direito de uso confirmado pela fonte. A autoria do exercício é separada da autorização da mídia.', ok: 'Entendi', cancel: false });
    }]]);
    if (nt === 'destino') notice = T.notice('warn', 'target', 'Destino alterado', 'A sessão de destino mudou em outro aparelho desde que você abriu o catálogo. Revise antes de adicionar.', [['Revisar', function () { set({ destOk: true, destOpen: true, nt: '' }); }]]);
    if (nt === 'leitura' && reading) notice = T.notice('risk', 'alert', 'Erro de leitura', 'Não carregamos os detalhes deste exercício. Seus dados estão salvos; tente de novo.', [['Corrigir', function () { set({ fixed: true, nt: '' }); }]]);
    if (nt === 'salvo') notice = T.notice('ok', 'check', 'Salvo como privado', ctx.p.pub ? 'Só nos seus treinos. O pedido de publicação no catálogo foi para revisão; até a decisão, nada muda para outros treinadores.' : 'Só nos seus treinos. Pedir publicação no catálogo é outra etapa, com revisão.');

    // ---------- escolher o vídeo: sugestões automáticas, link do YouTube ou vídeo próprio ----------
    var saveVideo = function (v, msg) {
      var prev = e.video;
      if (v) e.video = V.clean(v); else delete e.video;
      if (prev && prev.kind === 'arquivo' && (!v || v.url !== prev.url)) V.remove(prev);
      if (window.STORE) window.STORE.saveDb();
      set({ pick: false, playing: false, link: '', lerr: '', uerr: '', ubusy: false });
      ctx.toast(msg || (v ? 'Vídeo salvo neste exercício. Seus alunos veem nos treinos novos.' : 'Vídeo retirado deste exercício.'));
    };
    var tab = ui.ptab || 'auto';
    if (ui.pick && tab === 'auto' && !ui.sq && V) {
      ui.sq = 1; setTimeout(function () {
        set({ sq: 1, sbusy: true });
        V.search(e.name).then(function (d) { set({ sbusy: false, sres: d }); });
      }, 0);
    }
    var sres = ui.sres || null;
    var sugs = (sres && sres.items || []).map(function (x) {
      var on = !!(vid && vid.kind === 'youtube' && vid.id === x.id);
      return { title: x.title || 'Vídeo do YouTube', channel: x.channel || '', thumb: V.thumb(x.id), on: on, cls: 'v4-reset t3-vsug' + (on ? ' is-on' : ''),
        preview: 'https://www.youtube.com/watch?v=' + x.id,
        choose: function () { saveVideo({ kind: 'youtube', id: x.id, title: x.title }); } };
    });
    var useLink = function () {
      var id = V.parse(ui.link);
      if (!id) return set({ lerr: 'Cole um link do YouTube, como youtube.com/watch?v=… ou youtu.be/…' });
      set({ lbusy: true, lerr: '' });
      V.info(id).then(function (d) {
        if (d && d.motivo === 'nao_incorporavel') return set({ lbusy: false, lerr: 'O dono deste vídeo não permite que ele seja mostrado fora do YouTube. Escolha outro.' });
        if (d && d.motivo === 'nao_encontrado') return set({ lbusy: false, lerr: 'Não encontramos esse vídeo. Ele pode ser privado ou ter sido apagado.' });
        set({ lbusy: false }); saveVideo({ kind: 'youtube', id: id, title: (d && d.title) || '' });
      });
    };
    var onFile = function (ev) {
      var f = ev && ev.target && ev.target.files && ev.target.files[0]; if (!f) return;
      if (!/^video\//.test(f.type || '')) return set({ uerr: 'Escolha um arquivo de vídeo (MP4, MOV ou WebM).' });
      if (f.size > 100 * 1024 * 1024) return set({ uerr: 'O vídeo tem mais de 100 MB. Encurte ou comprima e tente de novo.' });
      set({ ubusy: true, uerr: '' });
      V.upload(f, e.id).then(function (r) {
        if (!r.ok) return set({ ubusy: false, uerr: r.motivo === 'offline' ? 'Sem conexão: o vídeo não foi enviado.' : (r.motivo === 'sem_sessao' ? 'Entre na sua conta para enviar vídeos.' : (r.motivo === 'grande' ? 'O vídeo passou de 100 MB.' : 'O envio não deu certo. Tente de novo.')) });
        saveVideo(r.video, 'Vídeo enviado e salvo neste exercício. Seus alunos veem nos treinos novos.');
      });
    };
    var tabs = [['auto', 'Sugestões'], ['link', 'Link do YouTube'], ['arquivo', 'Enviar vídeo']].map(function (t) {
      var on = tab === t[0]; return { label: t[1], on: String(on), cls: 'chip' + (on ? ' is-on' : ''), pick: function () { set({ ptab: t[0] }); } };
    });

    return {
      found: true, notFound: false, back: function () { GO('TRE10'); },
      nt: notice, reading: reading, loaded: !reading,
      name: e.name, sub: [e.equip, e.group, e.level].filter(Boolean).join(' · '),
      own: !!e.own, origin: e.own ? 'Meu exercício · privado' : 'Biblioteca 99Coach', originCls: e.own ? 'badge badge--ink' : 'badge badge--plain',
      source: (e.own ? 'Exercício criado por você, visível só para você e seus alunos.' : 'Exercício da biblioteca 99Coach.') + (vid ? (vid.kind === 'youtube' ? ' Vídeo do YouTube escolhido por você; ele continua pertencendo ao canal que publicou e é mostrado pelo próprio YouTube.' : ' Vídeo enviado por você; seus alunos veem nos treinos.') : (demoMode ? '' : ' Sem vídeo escolhido.')),
      isVideo: isVideo, isImg: isImg, noMedia: noMedia, mFail: mFail, mDenied: mDenied,
      retryMedia: function () { set({ mediaOk: true, nt: '' }); },
      hasVid: !!vid, vidYt: !!(vid && vid.kind === 'youtube'), vidFile: !!(vid && vid.kind === 'arquivo'),
      vidThumb: vid && vid.kind === 'youtube' ? V.thumb(vid.id) : '', vidEmbed: vid && vid.kind === 'youtube' ? V.embed(vid.id, true) : '', vidUrl: vid && vid.kind === 'arquivo' ? vid.url : '',
      vidTitle: vid ? (vid.title || vid.name || (vid.kind === 'youtube' ? 'Vídeo do YouTube' : 'Vídeo enviado por você')) : '',
      vidSrc: vid ? (vid.kind === 'youtube' ? 'YouTube' : 'Enviado por você') : '',
      playing: !!(ui.playing && vid && vid.kind === 'youtube'), notPlaying: !(ui.playing && vid && vid.kind === 'youtube'),
      canPick: !retired && !!V, openPick: function () { set({ pick: !ui.pick, ptab: 'auto', sq: 0, sres: null, link: '', lerr: '', uerr: '' }); }, pickLabel: vid ? 'Trocar vídeo' : 'Escolher vídeo',
      removeVid: function () { ctx.ask({ title: 'Retirar o vídeo deste exercício?', text: 'Treinos já enviados aos alunos continuam com o vídeo de antes. Os novos vão sem vídeo.', ok: 'Retirar', onOk: function () { saveVideo(null); } }); },
      pick: !!ui.pick, closePick: function () { set({ pick: false }); }, tabs: tabs,
      tabAuto: tab === 'auto', tabLink: tab === 'link', tabFile: tab === 'arquivo',
      sbusy: !!ui.sbusy, sugs: sugs, hasSugs: sugs.length > 0,
      sNoKey: !!(sres && sres.ok && sres.configured === false), sNone: !!(sres && sres.ok && sres.configured && !sugs.length), sErr: !!(sres && !sres.ok),
      sErrMsg: sres && sres.motivo === 'sem_sessao' ? 'Entre na sua conta para ver sugestões.' : (sres && sres.motivo === 'cota' ? 'O limite diário de buscas automáticas acabou. Use a busca do YouTube ou cole um link.' : 'As sugestões não carregaram agora.'),
      ytSearch: V ? V.searchUrl(e.name) : '#', retrySearch: function () { set({ sq: 0, sres: null }); },
      link: ui.link || '', setLink: function (ev) { set({ link: U.val(ev), lerr: '' }); }, useLink: useLink, lerr: ui.lerr || '', hasLerr: !!ui.lerr, lbusy: !!ui.lbusy, linkLabel: ui.lbusy ? 'Conferindo…' : 'Usar este vídeo',
      onFile: onFile, ubusy: !!ui.ubusy, uerr: ui.uerr || '', hasUerr: !!ui.uerr, uLabel: ui.ubusy ? 'Enviando… não feche esta tela' : 'Escolher arquivo de vídeo',
      play: function () { if (vid) set({ playing: true }); else set({ pick: true, ptab: 'auto', sq: 0, sres: null }); },
      cues: e.cues.map(function (c, i) { return { n: String(i + 1), text: c }; }), hasCues: e.cues.length > 0,
      equip: e.equip, group: e.group, level: e.level,
      units: units.map(function (u) { return { k: u[0], v: u[1] }; }),
      alts: alts, hasAlts: alts.length > 0,
      fav: !!e.fav, favLabel: e.fav ? 'Favorito' : 'Favoritar', favCls: 'btn btn--outline' + (e.fav ? ' is-on t3-on' : ''), favOn: String(!!e.fav),
      toggleFav: function () { e.fav = !e.fav; ctx.toast(e.fav ? 'Nos seus favoritos.' : 'Removido dos favoritos.'); },
      editMine: function () { GO('TRE12', { id: e.id }); },
      retired: retired, canAdd: !retired,
      hasDest: !!dest, destLabel: dest ? T.destLabel(dest.rid, dest.sid) : '',
      addLabel: dest ? 'Adicionar à ' + ((T.sessions(dest.rid).find(function (s) { return s.id === dest.sid; }) || {}).name || 'sessão') : 'Adicionar à sessão',
      addCls: 'btn btn--primary btn--lg' + (retired ? ' is-off' : ''), addOff: String(retired), add: add,
      destOpen: !!ui.destOpen, dests: dests, toggleDest: function () { set({ destOpen: !ui.destOpen }); },
      toSelection: function () { GO('TRE10', dest ? { rotina: dest.rid, sessao: dest.sid } : {}); }
    };
  }
});
