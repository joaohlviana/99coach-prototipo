/* ALU07 · Aula ou conteúdo do programa: estrutura (semanas/aulas), mídia com alternativa em texto, concluir e desfazer,
   anterior/próxima e retomada no último item autorizado. Aula concluída não é treino realizado. */
REG.screen({
  page: 'aluno', key: 'conteudo', id: 'ALU07', title: 'Aula', mtitle: 'Aula', nav: 'treinos', back: 'ALU06', wide: true, testIds: ['ct2', 'ct3'],
  normal: 'Aula liberada',
  scens: [['carregando', 'Carregando mídia'], ['video', 'Vídeo não carregou'], ['concluida', 'Concluída'], ['retirada', 'Aula retirada'], ['conflito', 'Retomada em conflito']],
  vals: function (ctx) {
    var A1 = window.A1, scn = ctx.scn, ui = ctx.ui;
    var ctid = A1.PROG[ctx.id] ? ctx.id : 'ct2';
    var P = A1.PROG[ctid], pr = DB.a1_progresso[ctid], fl = A1.flat(P);
    var isDone = function (id) { return pr.done.indexOf(id) >= 0; };
    var nextOpen = function (from) { for (var i = from; i < fl.length; i++) if (fl[i].ok && !isDone(fl[i].it.id)) return i; return -1; };
    var idxOf = function (id) { for (var i = 0; i < fl.length; i++) if (fl[i].it.id === id) return i; return 0; };
    var curId = ui.cur || (scn === 'concluida' ? pr.done[pr.done.length - 1] : pr.last);
    var ci = idxOf(curId), cur = fl[ci];
    if (!cur.ok) { ci = Math.max(0, nextOpen(0)); cur = fl[ci]; }
    var it = cur.it, done = isDone(it.id), withdrawn = scn === 'retirada' && ci === idxOf(pr.last);
    var ex = it.ex ? A1.ex(it.ex) : null;
    var prevI = -1; for (var a = ci - 1; a >= 0; a--) if (fl[a].ok) { prevI = a; break; }
    var nextI = -1; for (var b = ci + 1; b < fl.length; b++) if (fl[b].ok) { nextI = b; break; }
    var lockedNext = ci + 1 < fl.length && !fl[ci + 1].ok ? fl[ci + 1] : null;
    var syncPart = function () {
      var pct = Math.floor(pr.done.length / fl.length * 100);
      (DB.participantes || []).forEach(function (pp) { if (P.program && pp.program === P.program && pp.student === 'ana') pp.progress = pct + '%'; });
      pr.at = '26/10 ' + U.now(); pr.device = 'este aparelho';
    };
    var go = function (i) { return function () { if (i < 0) return; ctx.setUi({ cur: fl[i].it.id, tree: false }); }; };
    var complete = function () {
      if (!isDone(it.id)) pr.done.push(it.id);
      var n = nextOpen(ci + 1); if (n < 0) n = nextOpen(0);
      pr.last = n >= 0 ? fl[n].it.id : it.id; syncPart();
      ctx.setUi({ cur: n >= 0 ? fl[n].it.id : it.id });
      ctx.toast(n >= 0 ? 'Aula concluída. Próxima: ' + fl[n].it.t + '.' : 'Aula concluída. Você viu todas as aulas liberadas.');
    };
    var undo = function () {
      pr.done = pr.done.filter(function (x) { return x !== it.id; });
      var n = nextOpen(0); pr.last = n >= 0 ? fl[n].it.id : it.id; syncPart();
      ctx.setUi({ cur: it.id }); ctx.toast('Conclusão desfeita. Seu progresso voltou para ' + Math.floor(pr.done.length / fl.length * 100) + '%.');
    };
    var KIND = { aula: 'Vídeo', treino: 'Sessão guiada', texto: 'Leitura' };
    var tree = P.mods.map(function (m, mi) {
      return {
        t: m.t, sub: A1.relOk(m.rel) ? 'liberada ' + m.rel : 'libera ' + m.rel,
        items: fl.filter(function (f) { return f.mi === mi; }).map(function (f) {
          var i = idxOf(f.it.id), on = i === ci, dn = isDone(f.it.id);
          return { t: f.it.t, meta: KIND[f.it.kind] + ' · ' + f.it.dur, ok: f.ok, locked: !f.ok, lockTxt: 'Libera ' + m.rel,
            cls: 'a1-tree__it' + (on ? ' is-on' : '') + (dn ? ' is-done' : ''), cur: on ? 'true' : 'false',
            ic: 'ic ic--sm ' + (dn ? 'i-check' : (on ? 'i-play' : 'i-' + (f.it.kind === 'texto' ? 'file' : (f.it.kind === 'treino' ? 'dumbbell' : 'play')))), go: go(i) };
        })
      };
    });
    var al = A1.alert(ctx, {
      video: { k: 'warn', t: 'Vídeo não carregou', x: 'O texto e a transcrição abaixo têm o mesmo conteúdo da aula.', b: 'Tentar de novo' },
      concluida: { k: 'ok', t: 'Aula concluída', x: 'Se marcou sem querer, use “Desfazer conclusão”.' },
      retirada: { k: 'warn', t: 'Aula retirada', x: 'O autor retirou esta aula na versão ' + P.version + '. Seu progresso não muda; siga para a próxima.', b: 'Ir para a próxima', f: function () { if (nextI >= 0) { var nid = fl[nextI].it.id; if (!isDone(it.id)) pr.done.push(it.id); pr.last = nid; syncPart(); ctx.set({ scn: '', ui: { cur: nid }, toast: 'Pulamos a aula retirada.' }); } }, b2: 'Saiba por quê', f2: function () { GO('ALU11'); } },
      conflito: { k: 'warn', t: 'Retomada em conflito', x: 'No computador você parou em ' + fl[Math.max(0, ci - 2)].mod.t + ' · ' + fl[Math.max(0, ci - 2)].it.t + ' (25/10 22:40). Neste celular, em ' + it.t + '.', b: 'Continuar daqui', f: A1.retry(ctx, 'Seguimos deste aparelho. O progresso não foi duplicado.'), b2: 'Ir para onde parei no computador', f2: function () { ctx.set({ scn: '', ui: { cur: fl[Math.max(0, ci - 2)].it.id }, toast: 'Abrimos onde você parou no computador.' }); } }
    });
    var loading = scn === 'carregando', vidFail = scn === 'video';
    var drills = it.kind === 'treino' ? [it.ex || 'burpee', 'prancha'].filter(function (x, i, arr) { return arr.indexOf(x) === i; }).map(function (id) { var e = A1.ex(id); return { name: e.name, presc: id === 'prancha' ? '3 × 40 s' : '5 × 10', cues: (e.cues || []).join(' · ') }; }) : [];
    return {
      al: al, prog: P.name, eyebrow: P.name + ' · ' + cur.mod.t + ' · aula ' + (cur.k + 1) + ' de ' + cur.n,
      title: it.t, kind: KIND[it.kind] + ' · ' + it.dur, version: 'v' + pr.version + ' · ' + A1.pct(ctid) + '% · ' + pr.done.length + ' de ' + fl.length,
      isVideo: it.kind === 'aula' && !loading && !vidFail && !withdrawn, isLoading: loading, isVidFail: vidFail && it.kind === 'aula',
      isTreino: it.kind === 'treino' && !withdrawn, drills: drills, isWithdrawn: withdrawn,
      hasText: !loading && !withdrawn,
      textT: it.kind === 'aula' ? 'Transcrição e pontos principais' : (it.kind === 'treino' ? 'Como fazer' : 'Leitura'),
      points: (ex ? ex.cues : ['Faça no seu ritmo, sem dor.', 'Anote dúvidas para conversar com o treinador.', 'Repita o conteúdo quando quiser: o progresso não muda.']).map(function (c) { return { t: c }; }),
      done: done, notDone: !done, canComplete: !done && !loading && !withdrawn, completeOff: !done && (loading || withdrawn),
      complete: complete, undo: undo,
      hasPrev: prevI >= 0, goPrev: go(prevI), hasNext: nextI >= 0, goNext: go(nextI), nextLbl: nextI >= 0 ? 'Próxima: ' + fl[nextI].it.t : '',
      hasLocked: nextI < 0 && !!lockedNext, lockedTxt: lockedNext ? 'Próxima aula libera em ' + lockedNext.mod.rel + '.' : '',
      tree: tree, treeOpen: !!ui.tree, treeCls: 'a1-tree' + (ui.tree ? ' is-open' : ''), treeExp: String(!!ui.tree), toggleTree: function () { ctx.setUi({ tree: !ui.tree }); },
      treeLbl: (ui.tree ? 'Ocultar estrutura' : 'Ver estrutura') + ' (' + fl.length + ' aulas)', drip: P.drip,
      goSessao: function () { GO('ALU02', { id: 't1' }); }, goBack: function () { GO('ALU06'); }
    };
  }
});
