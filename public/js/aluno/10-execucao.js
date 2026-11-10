/* ALU03 · Executar treino e descansar: exercício atual, séries com reps/carga editáveis, descanso com cronômetro real
   (pausa, +15 s, pular), próximo exercício, sem internet (salvo neste aparelho) e validade de 24 h. */
(function () {
  var TIMER = null, LIVE = null;
  function stop() { if (TIMER && typeof window.clearInterval === 'function') window.clearInterval(TIMER); TIMER = null; }
  function left(r) { if (!r) return 0; return r.paused ? r.left : Math.max(0, Math.ceil((r.endsAt - Date.now()) / 1000)); }
  function tick() {
    var e = DB.a1_exec, r = e && e.rest;
    var onScreen = typeof document !== 'undefined' && document.querySelector && document.querySelector('.a1-rest');
    if (!r || r.paused || r.done || !onScreen) { stop(); return; }
    if (left(r) <= 0) {
      r.done = true; r.left = 0; stop();
      try { if (window.navigator && window.navigator.vibrate) window.navigator.vibrate([200, 100, 200]); } catch (_) {}
    }
    if (LIVE) LIVE.refresh();
  }
  function ensure() { if (TIMER || typeof window.setInterval !== 'function') return; TIMER = window.setInterval(tick, 250); }

  REG.screen({
    page: 'aluno', key: 'execucao', id: 'ALU03', title: 'Treino em andamento', mtitle: 'Treino', nav: 'treinos', back: 'ALU02',
    backParams: function () { return { id: (DB.a1_exec && DB.a1_exec.treino) || 't1' }; },
    normal: 'Treino em andamento',
    scens: [['offline', 'Sem internet'], ['offlocal', 'Offline com registros locais'], ['sync', 'Sincronizando'], ['expira', 'Autorização offline expira durante execução/descanso'],
      ['expirou', 'Validade de 24 h venceu'], ['disco', 'Disco cheio'], ['chave', 'Armazenamento cheio ou chave indisponível'],
      ['conflito', 'Conflito'], ['outro', 'Sessão alterada em outro dispositivo'], ['midia', 'Mídia falhou']],
    vals: function (ctx) {
      var A1 = window.A1, scn = ctx.scn, ui = ctx.ui;
      LIVE = ctx;
      var e = DB.a1_exec;
      if (!e || e.status !== 'andamento') {
        return { running: false, idle: true, goToday: function () { GO('ALU02', { id: 't1' }); }, goHome: function () { GO('H10'); } };
      }
      var t = A1.treino(e.treino), ss = A1.sess(t), items = ss.s.items;
      var cur = Math.min(Math.max(e.ex || 0, 0), items.length - 1), it = items[cur], ex = A1.ex(it.ex), lg = e.log[cur] || [];
      var offline = scn === 'offline' || scn === 'offlocal' || scn === 'expira';
      var expired = scn === 'expirou', storeFail = scn === 'disco' || scn === 'chave', conflict = scn === 'conflito' || scn === 'outro';
      var firstOpen = -1; for (var j = 0; j < it.sets; j++) if (!(lg[j] && lg[j].d)) { firstOpen = j; break; }
      var active = e.edit >= 0 ? e.edit : firstOpen;
      var isTime = A1.isTime(it.reps), hasLoad = !!it.load;
      var prevR = String(it.reps).replace(/\s*s$/, ''), prevL = A1.num(it.load);
      var exDone = firstOpen < 0, lastEx = cur === items.length - 1;
      var allDone = items.every(function (x, i) { var l = e.log[i] || []; for (var k = 0; k < x.sets; k++) if (!(l[k] && l[k].d)) return false; return true; });
      var unsynced = A1.unsynced(e) + (scn === 'offlocal' ? 1 : 0);

      var setUi = function (o) { ctx.setUi(o); };
      var goEx = function (i) { return function () { if (i < 0 || i >= items.length) return; e.ex = i; e.edit = -1; A1.saveLocal(); setUi({ r: '', l: '', err: '', ins: false }); }; };
      var startRest = function (secs, label) {
        if (!secs) { e.rest = null; return; }
        e.rest = { total: secs, left: secs, endsAt: Date.now() + secs * 1000, paused: false, done: false, label: label };
        ensure();
      };
      var register = function () {
        if (expired) return;
        var r = String(ui.r || '').trim(), l = String(ui.l || '').trim();
        if (!r) { setUi({ err: isTime ? 'Informe o tempo feito (em segundos) ou use “Igual ao previsto”.' : 'Informe as repetições feitas ou use “Igual ao previsto”.' }); return; }
        if (!/^\d+([.,]\d+)?$/.test(r) || (l && !/^\d+([.,]\d+)?$/.test(l))) { setUi({ err: 'Use só números. Ex.: 6 e 72,5.' }); return; }
        if (storeFail) { setUi({ err: '', saveErr: true }); ctx.toast('Não foi possível salvar neste aparelho. A série não foi registrada.'); return; }
        var editing = e.edit >= 0, j = active;
        lg[j] = { r: r, l: l.replace('.', ','), d: true, sync: !offline, at: U.now() };
        if (!offline) e.syncedAt = U.now();
        e.edit = -1;
        A1.saveLocal();
        if (!editing) {
          var moreHere = false; for (var k = j + 1; k < it.sets; k++) if (!(lg[k] && lg[k].d)) moreHere = true;
          var nx = items[cur + 1];
          if (moreHere) startRest(A1.secs(it.rest), 'Próxima: série ' + (j + 2) + ' de ' + it.sets);
          else if (nx) startRest(A1.secs(it.rest), 'Próximo: ' + A1.ex(nx.ex).name);
          else e.rest = null;
        }
        setUi({ r: '', l: '', err: '', saveErr: false });
        ctx.toast(editing ? 'Série corrigida.' : (offline ? 'Série salva neste aparelho · aguardando sincronização.' : 'Série ' + (j + 1) + ' registrada.'));
      };
      var rows = [];
      for (var i = 0; i < it.sets; i++) (function (i) {
        var s = lg[i] || { d: false }, isCur = i === active && !expired;
        var local = s.d && (!s.sync || (scn === 'offlocal' && i === firstOpen - 1));
        rows.push({
          lbl: 'Série ' + (i + 1),
          txt: s.d && !(isCur && e.edit === i) ? A1.real(s, it) : 'previsto ' + it.reps + (it.load ? ' × ' + it.load : ''),
          cls: 'a1-set' + (s.d ? ' is-done' : '') + (isCur ? ' is-cur' : ''),
          isDone: !!s.d, badge: local ? 'no aparelho' : 'feito', badgeCls: 'badge ' + (local ? 'badge--warn' : 'badge--ok'),
          isCur: isCur, isPend: !s.d && !isCur, canFix: !!s.d && !expired && e.edit !== i,
          fix: function () { e.edit = i; setUi({ r: s.r, l: s.l, err: '' }); }
        });
      })(i);

      var r = e.rest, lf = left(r), restOn = !!r && !expired;
      if (restOn && !r.paused && !r.done && lf > 0) ensure();
      var restDone = restOn && (r.done || lf <= 0);
      var nx = items[cur + 1];
      var al = A1.alert(ctx, {
        offline: { k: 'warn', t: 'Sem internet', x: 'Salvo neste aparelho · aguardando sincronização. Seus registros ficam guardados até voltar.', b: 'Tentar de novo', f: function () { syncAll('Conectado de novo. Registros sincronizados.'); } },
        offlocal: { k: 'warn', t: 'Offline com registros locais', x: U.plural(unsynced, 'série salva', 'séries salvas') + ' neste aparelho, ainda não enviadas ao Rafael.', b: 'Tentar de novo', f: function () { syncAll('Conectado de novo. Registros sincronizados.'); } },
        sync: { k: 'info', t: 'Sincronizando', x: 'Enviando seus registros. Pode continuar o treino normalmente.' },
        expira: { k: 'warn', t: 'Autorização sem internet vence em 4 min', x: 'Depois disso, conecte-se para continuar o treino. O que você já registrou fica guardado.', b: 'Tentar de novo', f: function () { syncAll('Conectado. Autorização renovada por 24 h.'); } },
        expirou: { k: 'risk', t: 'Validade de 24 h venceu', x: 'Conecte-se para continuar o treino. Seus registros anteriores estão preservados e você pode encerrar o que já fez.', b: 'Consultar de novo', b2: 'Encerrar com o que foi feito', f2: function () { GO('ALU04'); } },
        disco: { k: 'risk', t: 'Disco cheio', x: 'Não foi possível salvar neste aparelho. Libere espaço e tente de novo; as séries já registradas continuam guardadas.', b: 'Tentar de novo' },
        chave: { k: 'risk', t: 'Armazenamento cheio ou chave indisponível', x: 'Não foi possível salvar neste aparelho. Feche outros apps e tente de novo; nada do que já foi registrado se perdeu.', b: 'Tentar de novo' },
        conflito: { k: 'warn', t: 'Conflito de registro', x: 'A ' + (active >= 0 ? 'série ' + (active + 1) : 'última série') + ' de ' + ex.name + ' foi registrada em outro aparelho com valor diferente. Escolha qual vale.' },
        outro: { k: 'warn', t: 'Sessão alterada em outro dispositivo', x: 'Você registrou esta sessão no computador às 08:20. Revise antes de continuar para não duplicar.' },
        midia: { k: 'warn', t: 'Mídia falhou', x: 'Vídeo indisponível: veja as instruções em texto abaixo.', b: 'Tentar de novo' }
      });
      function syncAll(msg) { e.log.forEach(function (l) { l.forEach(function (s) { if (s.d) s.sync = true; }); }); e.syncedAt = U.now(); A1.saveLocal(); ctx.set({ scn: '', toast: msg }); }
      var conflictSet = active >= 0 ? active : Math.max(0, it.sets - 1);
      var insOpen = (!!ui.ins || scn === 'midia') && !expired;
      return {
        running: true, idle: false, al: al,
        name: t.name, pos: 'Exercício ' + (cur + 1) + ' de ' + items.length,
        steps: items.map(function (x, i) { var l = e.log[i] || []; var dn = 0; for (var k = 0; k < x.sets; k++) if (l[k] && l[k].d) dn++; return { cls: 'a1-step' + (dn === x.sets ? ' is-done' : '') + (i === cur ? ' is-cur' : ''), lbl: A1.ex(x.ex).name + ': ' + dn + ' de ' + x.sets + ' séries', go: goEx(i) }; }),
        exName: ex.name, presc: 'Previsto ' + it.sets + ' × ' + it.reps + (it.load ? ' · ' + it.load : ' · peso do corpo') + ' · descanso ' + A1.fmtRest(A1.secs(it.rest)),
        syncTxt: offline ? 'Salvo neste aparelho · aguardando sincronização' + (unsynced ? ' (' + unsynced + ')' : '') : (scn === 'sync' ? 'Sincronizando…' : 'Sincronizado às ' + e.syncedAt),
        syncCls: 'badge ' + (offline ? 'badge--warn' : (scn === 'sync' ? 'badge--info' : 'badge--ok')),
        validTxt: expired ? 'Validade sem internet venceu' : (scn === 'expira' ? 'Sem internet: autorização vence em 4 min' : 'Funciona sem internet até amanhã às ' + e.startedAt + ' (24 h)'),
        insOpen: insOpen, insBlocked: expired, insTxt: insOpen ? 'Ocultar instrução' : 'Ver instrução', insExp: String(insOpen),
        toggleIns: function () { setUi({ ins: !ui.ins }); },
        mediaOk: ex.media === 'video' && scn !== 'midia', mediaOff: ex.media !== 'video' || scn === 'midia',
        mediaTxt: scn === 'midia' ? 'Vídeo indisponível: veja as instruções' : (ex.media === 'imagem' ? 'Imagem demonstrativa · descrição abaixo' : 'Sem vídeo: siga as instruções'),
        cues: (ex.cues || []).map(function (c) { return { t: c }; }),
        rows: rows,
        showForm: active >= 0 && !expired && !conflict, isEdit: e.edit >= 0,
        formLbl: (e.edit >= 0 ? 'Corrigir série ' : 'Série ') + (active + 1) + ' · previsto ' + it.reps + (it.load ? ' × ' + it.load : ''),
        rLbl: isTime ? 'Tempo feito (s)' : 'Repetições feitas', rPh: prevR, r: ui.r || '', setR: function (ev) { setUi({ r: U.val(ev), err: '' }); },
        hasLoad: hasLoad, lPh: prevL, l: ui.l || '', setL: function (ev) { setUi({ l: U.val(ev), err: '' }); },
        same: function () { setUi({ r: prevR, l: prevL, err: '' }); }, sameLbl: 'Igual ao previsto (' + it.reps + (it.load ? ' × ' + it.load : '') + ')',
        hasErr: !!ui.err, err: ui.err || '', inCls: 'input' + (ui.err ? ' is-err' : ''),
        saveErr: !!ui.saveErr,
        register: register, regLbl: e.edit >= 0 ? 'Salvar correção' : 'Registrar série ' + (active + 1),
        cancelEdit: function () { e.edit = -1; setUi({ r: '', l: '', err: '' }); },
        onKey: function (ev) { if (ev && ev.key === 'Enter') { if (ev.preventDefault) ev.preventDefault(); register(); } },
        isConflict: conflict && !expired,
        cfHere: (lg[conflictSet] && lg[conflictSet].d) ? A1.real(lg[conflictSet], it) : 'não registrada',
        cfOther: (it.reps.replace(/\s*s$/, '')) + (it.load ? ' × ' + A1.kg(Math.max(0, (parseFloat(prevL.replace(',', '.')) || 0) - 2.5)) + ' kg' : (isTime ? ' s' : '')),
        cfLbl: 'Série ' + (conflictSet + 1) + ' · ' + ex.name,
        keepHere: function () { ctx.set({ scn: '', toast: 'Mantido o registro deste aparelho. O outro ficou no histórico como substituído.' }); },
        useOther: function () {
          lg[conflictSet] = { r: it.reps.replace(/\s*s$/, ''), l: it.load ? A1.kg(Math.max(0, (parseFloat(prevL.replace(',', '.')) || 0) - 2.5)) : '', d: true, sync: true, at: '08:20' };
          A1.saveLocal(); ctx.set({ scn: '', toast: 'Usado o registro do outro aparelho. Nada foi duplicado.' });
        },
        restOn: restOn, restRun: restOn && !restDone, restDone: restDone, restLbl: r ? r.label : '',
        restTime: A1.mmss(lf), restPct: restOn ? Math.round(100 - (lf / (r.total || 1)) * 100) + '%' : '0%',
        restPaused: !!(r && r.paused), restLive: !!(r && !r.paused),
        pauseRest: function () { if (!e.rest) return; e.rest.left = left(e.rest); e.rest.paused = true; stop(); ctx.refresh(); },
        resumeRest: function () { if (!e.rest) return; e.rest.endsAt = Date.now() + e.rest.left * 1000; e.rest.paused = false; ensure(); ctx.refresh(); },
        addRest: function () { if (!e.rest) return; if (e.rest.paused) e.rest.left += 15; else e.rest.endsAt += 15000; e.rest.total += 15; e.rest.done = false; ensure(); ctx.refresh(); },
        skipLbl: restDone ? 'Fechar' : 'Pular descanso',
        skipRest: function () { e.rest = null; stop(); ctx.refresh(); },
        hasNext: !!nx, nextTxt: nx ? 'Próximo: ' + A1.ex(nx.ex).name + ' · ' + nx.sets + ' × ' + nx.reps + (nx.load ? ' · ' + nx.load : '') : 'Último exercício da sessão',
        exDone: exDone && !allDone && !lastEx, goNext: goEx(cur + 1), goPrev: goEx(cur - 1), hasPrev: cur > 0, hasNextBtn: cur < items.length - 1,
        allDone: allDone,
        finish: function () { e.rest = null; stop(); GO('ALU04'); },
        pauseOut: function () { e.rest = null; stop(); A1.saveLocal(); A1.flash('Treino pausado', 'Continue quando quiser: seus registros estão salvos neste aparelho' + (offline ? ' e sincronizam ao conectar.' : ' e sincronizados.'), 'info'); GO('H10'); },
        goHist: function () { GO('H10E'); }
      };
    }
  });
})();
