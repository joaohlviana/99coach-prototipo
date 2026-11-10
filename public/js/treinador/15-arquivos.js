/* TRE08 · Arquivos privados do aluno: envio real lido no aparelho (FileReader, nada sai do navegador),
   progresso simulado, limite de tamanho, tipo conferido pelo conteúdo, acesso e visualizador autorizado. */
(function () {
  'use strict';
  var MAX = 10 * 1024 * 1024;
  var EXT = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];
  var UP = null; // envio em andamento (sobrevive a re-renderizações)
  function size(b) { return b >= 1048576 ? (b / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'; }
  function sniff(u8, ext) {
    var h = function (i) { return u8[i]; };
    if (ext === 'pdf') return h(0) === 0x25 && h(1) === 0x50 && h(2) === 0x44 && h(3) === 0x46;
    if (ext === 'png') return h(0) === 0x89 && h(1) === 0x50 && h(2) === 0x4E && h(3) === 0x47;
    if (ext === 'jpg' || ext === 'jpeg') return h(0) === 0xFF && h(1) === 0xD8 && h(2) === 0xFF;
    if (ext === 'webp') return h(0) === 0x52 && h(1) === 0x49 && h(2) === 0x46 && h(3) === 0x46 && h(8) === 0x57 && h(9) === 0x45 && h(10) === 0x42 && h(11) === 0x50;
    return false;
  }
  function filesOf(sid) {
    var meta = DB.t2_arqMeta || {};
    return DB.arquivos.filter(function (x) { return x.student === sid; }).map(function (x) { return Object.assign({ cat: 'Outros', from: 'Rafael', status: 'disponível' }, x, meta[x.id] || {}); })
      .concat(DB.t2_arquivos.filter(function (x) { return x.student === sid; }));
  }
  function rec(id) { return DB.find('arquivos', id) || DB.find('t2_arquivos', id); }
  function setMeta(id, o) {
    var r = rec(id); if (!r) return;
    if (DB.find('t2_arquivos', id) || r.status !== undefined) { Object.assign(r, o); return; }
    DB.t2_arqMeta[id] = Object.assign({}, DB.t2_arqMeta[id] || {}, o);
  }

  REG.screen({
    page: 'treinador', key: 'arquivos', id: 'TRE08', title: 'Arquivos', nav: 'alunos', back: 'H05', wide: true,
    backParams: function (ctx) { return window.T2.back(ctx); },
    testIds: ['ana', 'marcos', 'lucas'],
    normal: 'Lista de arquivos',
    scens: [['enviando64', 'Enviando 64%'], ['grande', 'Arquivo grande demais'], ['linkexp', 'Link expirou'], ['enviando', 'Enviando'], ['processando', 'Processando'], ['tipo', 'Tipo inválido'], ['falha', 'Falha recuperável'], ['expirado', 'Expirado'], ['semperm', 'Sem permissão']],
    vals: function (ctx) {
      var T2 = window.T2, ui = ctx.ui, scn = ctx.scn, a = T2.stu(ctx);
      var all = filesOf(a.id);
      var cats = []; all.forEach(function (x) { if (cats.indexOf(x.cat) < 0) cats.push(x.cat); });
      var cat = ui.cat && cats.indexOf(ui.cat) >= 0 ? ui.cat : '';
      var hidden = scn === 'semperm';
      var shown = all.filter(function (x) { return !cat || x.cat === cat; });
      var ST = { 'disponível': ['Disponível', 'badge badge--ok'], processando: ['Processando', 'badge badge--warn'], encerrado: ['Acesso encerrado', 'badge badge--plain'], expirado: ['Acesso expirado', 'badge badge--plain'] };
      var expId = scn === 'expirado' ? ((all.find(function (x) { return x.status === 'disponível'; }) || {}).id || '') : '';
      var stOf = function (x) { return x.id === expId ? 'expirado' : x.status; };
      var rows = shown.map(function (x) {
        var s = ST[stOf(x)] || ST['disponível'], on = ui.sel === x.id;
        return {
          name: hidden ? 'Arquivo restrito' : x.name, sub: hidden ? 'Sem permissão para ver título ou miniatura' : (x.status === 'processando' ? 'Processando… ainda não pode ser aberto' : 'Enviado por ' + x.from + ' · ' + x.at + ' · ' + x.size),
          cat: hidden ? '—' : x.cat, from: x.from, st: s[0], stCls: s[1], ic: 'ic ic--sm i-' + (hidden ? 'lock' : (x.kind === 'pdf' ? 'file' : 'camera')),
          cls: 'lrow t2-lr' + (on ? ' is-on' : ''), tcls: 't2-tbl__r' + (on ? ' is-on' : ''), cur: String(on),
          pick: function () { if (hidden) { ctx.toast('Sem permissão para este arquivo'); return; } ctx.setUi({ sel: on ? '' : x.id, acc: false, view: '' }); }
        };
      });
      var catChips = cats.length > 1 ? [['', 'Todos']].concat(cats.map(function (c) { return [c, c]; })) : [];
      var chips = T2.opts(catChips, cat, function (k) { ctx.setUi({ cat: k }); });

      // detalhe e ações
      var sel = all.find(function (x) { return x.id === ui.sel; }) || null;
      var det = { on: !!sel && !hidden, name: '', kv: [], canOpen: false, isProc: false, isEnc: false, mine: false, open: function () {}, download: function () {}, access: function () {}, end: function () {}, close: function () { ctx.setUi({ sel: '' }); } };
      if (sel && !hidden) {
        var stS = stOf(sel);
        det.name = sel.name;
        det.kv = T2.kv([['Categoria', sel.cat], ['Enviado por', sel.from], ['Data', sel.at], ['Tamanho', sel.size], ['Quem pode ver', stS === 'encerrado' ? 'acesso encerrado' : sel.access], ['Estado', (ST[stS] || ST['disponível'])[0]], ['Link', 'temporário, 10 min após abrir']]);
        det.canOpen = stS === 'disponível'; det.isProc = stS === 'processando'; det.isEnc = stS === 'encerrado' || stS === 'expirado';
        det.mine = sel.from === 'Rafael';
        det.open = function () { if (stS !== 'disponível') { ctx.toast('Ainda não disponível para abrir'); return; } ctx.setUi({ view: sel.id, linkAt: U.now() }); };
        det.download = function () { ctx.toast(sel.url ? 'Use “Baixar cópia” no visualizador · o arquivo está só neste aparelho' : 'Download autorizado e registrado · link de uso único por 10 min (demonstração)'); };
        det.access = function () { ctx.setUi({ acc: !ui.acc, accSel: '' }); };
        det.end = function () {
          ctx.ask({ title: 'Encerrar acesso a este arquivo?', text: sel.name + ' deixa de aparecer para você. ' + (det.mine ? a.first + ' também perde o acesso.' : 'O arquivo continua com ' + a.first + '.'), lines: ['Links temporários já gerados param de funcionar.', 'Nada é apagado do aparelho de quem enviou.'], ok: 'Encerrar acesso', danger: true,
            onOk: function () { setMeta(sel.id, { status: 'encerrado', access: 'acesso encerrado' }); ctx.setUi({ view: '', acc: false }); ctx.toast('Acesso encerrado · ' + sel.name); } });
        };
      }
      // alterar acesso
      var ACC = det.mine ? [['ambos', 'Você e ' + a.first], ['so', 'Só você']] : [['ambos', 'Você e ' + a.first]];
      var curAcc = ui.accSel || (sel && sel.access === 'só você' ? 'so' : 'ambos');
      var acc = {
        on: !!ui.acc && det.on, opts: T2.opts(ACC, curAcc, function (k) { ctx.setUi({ accSel: k }); }),
        note: det.mine ? 'Você enviou este arquivo e decide quem vê.' : 'Quem enviou foi ' + a.first + ': só ' + a.first + ' amplia o acesso. Você pode encerrar o seu.',
        save: function () {
          if (!sel) return;
          var txt = curAcc === 'so' ? 'só você' : 'você e ' + a.first;
          ctx.ask({ title: 'Confirmar acesso', text: sel.name + ' ficará visível para: ' + txt + '.', lines: ['Vínculo não libera todos os documentos: cada arquivo tem o seu acesso.', 'Nenhum endereço público é criado.'], ok: 'Salvar acesso',
            onOk: function () { setMeta(sel.id, { access: txt }); ctx.setUi({ acc: false }); ctx.toast('Acesso atualizado · ' + txt); } });
        }
      };

      // visualizador autorizado
      var vf = all.find(function (x) { return x.id === ui.view; }) || null;
      if (scn === 'linkexp' && !vf) vf = all.find(function (x) { return x.status === 'disponível'; }) || null;
      var view = { on: !!vf && !hidden, name: '', meta: '', expired: scn === 'linkexp', live: scn !== 'linkexp', isImg: false, isPdf: false, isDemo: false, src: '', hasSrc: false, close: function () { ctx.setUi({ view: '' }); }, renew: function () { ctx.scenario(''); ctx.setUi({ view: vf ? vf.id : '', linkAt: U.now() }); } };
      if (vf) {
        view.name = vf.name; view.src = vf.url || ''; view.hasSrc = !!vf.url;
        view.isImg = !!vf.url && vf.kind === 'foto'; view.isPdf = !!vf.url && vf.kind === 'pdf'; view.isDemo = !vf.url;
        view.meta = 'Aberto às ' + (ui.linkAt || U.now()) + ' · link temporário, vale 10 min · só ' + vf.access;
      }

      // envio
      var ucat = ui.ucat || (cats.indexOf('Exames') >= 0 ? 'Exames' : 'Outros');
      var UCATS = [['Exames', 'Exames'], ['Fotos de avaliação', 'Fotos de avaliação'], ['Outros', 'Outros']];
      var cur = UP && UP.sid === a.id ? UP : null;
      if (scn === 'enviando64') cur = { name: 'Exame_sangue_out.pdf', size: '2,1 MB', pct: 64, phase: 'enviando', virtual: true };
      if (scn === 'enviando') cur = { name: 'Exame_sangue_out.pdf', size: '2,1 MB', pct: 6, phase: 'lendo', virtual: true };
      var upErr = ui.upErr || null;
      if (scn === 'grande') upErr = { kind: 'big', name: 'Video_postura.mov', size: '48,3 MB' };
      if (scn === 'tipo') upErr = { kind: 'tipo', name: 'Planilha_cargas.xlsx', size: '84 KB' };
      var ERR = {
        big: ['Arquivo grande demais', function (e) { return e.name + ' tem ' + e.size + '. O limite é 10 MB por arquivo, em PDF, JPG, PNG ou WEBP. Reduza ou divida o arquivo e tente de novo.'; }],
        tipo: ['Tipo inválido', function (e) { return e.name + ' não é um tipo aceito. Envie PDF, JPG, PNG ou WEBP de até 10 MB.'; }],
        conteudo: ['Tipo inválido', function (e) { return 'O conteúdo de ' + e.name + ' não corresponde à extensão. Exporte de novo como PDF ou imagem e tente outra vez.'; }],
        dup: ['Este arquivo já foi enviado', function (e) { return e.name + ' (' + e.size + ') já está confirmado. Nada foi duplicado.'; }],
        falha: ['Não foi possível ler o arquivo', function (e) { return 'O aparelho não liberou ' + e.name + '. Escolha o arquivo de novo.'; }]
      };
      var ue = upErr && ERR[upErr.kind] ? { on: true, t: ERR[upErr.kind][0], s: ERR[upErr.kind][1](upErr) } : { on: false, t: '', s: '' };
      var retry = function () { if (scn === 'grande' || scn === 'tipo') ctx.scenario(''); else ctx.setUi({ upErr: null }); };

      var pick = function (e) {
        var input = e && e.target, file = input && input.files && input.files[0];
        if (!file) return;
        try { input.value = ''; } catch (_) {}
        if (UP && UP.sid === a.id) { ctx.toast('Aguarde o envio atual terminar ou cancele'); return; }
        var ext = String(file.name.split('.').pop() || '').toLowerCase();
        var info = { name: file.name, size: size(file.size) };
        if (file.size > MAX) { ctx.setUi({ upErr: Object.assign({ kind: 'big' }, info) }); return; }
        if (EXT.indexOf(ext) < 0) { ctx.setUi({ upErr: Object.assign({ kind: 'tipo' }, info) }); return; }
        var dup = filesOf(a.id).find(function (x) { return x.name === file.name && x.bytes === file.size && x.status !== 'encerrado'; });
        if (dup) { ctx.setUi({ upErr: Object.assign({ kind: 'dup' }, info), sel: dup.id }); return; }
        var tok = Math.random();
        UP = { tok: tok, sid: a.id, name: file.name, size: info.size, bytes: file.size, pct: 0, phase: 'lendo', cat: ucat, kind: ext === 'pdf' ? 'pdf' : 'foto' };
        ctx.setUi({ upErr: null });
        var rd = new FileReader();
        rd.onprogress = function (ev) { if (UP && UP.tok === tok && ev.lengthComputable) { UP.pct = Math.round(ev.loaded / ev.total * 10); ctx.refresh(); } };
        rd.onerror = function () { if (UP && UP.tok === tok) { UP = null; ctx.setUi({ upErr: Object.assign({ kind: 'falha' }, info) }); } };
        rd.onload = function () {
          if (!UP || UP.tok !== tok) return;
          var u8 = new Uint8Array(rd.result.slice(0, 12));
          if (!sniff(u8, ext)) { UP = null; ctx.setUi({ upErr: Object.assign({ kind: 'conteudo' }, info) }); return; }
          var url = ''; try { url = URL.createObjectURL(file); } catch (_) {}
          UP.phase = 'enviando'; UP.pct = 10; ctx.refresh();
          var tick = function () {
            if (!UP || UP.tok !== tok) return;
            UP.pct = Math.min(100, UP.pct + 6 + Math.round(Math.random() * 8));
            if (UP.pct < 100) { ctx.refresh(); setTimeout(tick, 160); return; }
            UP.phase = 'processando'; ctx.refresh();
            setTimeout(function () {
              if (!UP || UP.tok !== tok) return;
              var id = DB.uid('d');
              DB.arquivos.unshift({ id: id, student: UP.sid, name: UP.name, kind: UP.kind, size: UP.size, bytes: UP.bytes, at: U.todayShort, access: 'você e ' + a.first, cat: UP.cat, from: 'Rafael', status: 'disponível', url: url });
              UP = null;
              ctx.setUi({ sel: id, upErr: null });
              ctx.toast('Arquivo enviado e disponível · ' + file.name);
            }, 900);
          };
          setTimeout(tick, 160);
        };
        rd.readAsArrayBuffer(file);
      };
      var cancel = function () {
        if (cur && cur.virtual) { ctx.scenario(''); ctx.toast('Envio cancelado · nada foi salvo'); return; }
        UP = null; ctx.toast('Envio cancelado · nada foi salvo');
      };
      var up = {
        cats: T2.opts(UCATS, ucat, function (k) { ctx.setUi({ ucat: k }); }),
        busy: !!cur, idle: !cur, name: cur ? cur.name : '', size: cur ? cur.size : '', pct: cur ? String(cur.pct) : '0',
        bar: 'width:' + (cur ? cur.pct : 0) + '%',
        phase: cur ? (cur.phase === 'lendo' ? 'Lendo no aparelho…' : cur.phase === 'processando' ? 'Processando arquivo' : 'Enviando ' + cur.pct + '%') : '',
        canCancel: !!cur && cur.phase !== 'processando', pick: pick, cancel: cancel, err: ue, retry: retry
      };

      var al = T2.al(null);
      var proc = all.find(function (x) { return x.status === 'processando'; });
      if (scn === 'processando') al = T2.al({ ic: 'clock', t: 'Processando arquivo', s: (proc ? proc.name : 'O arquivo') + ' ainda está sendo preparado. Enquanto isso, ele não pode ser aberto nem baixado.', btn: 'Consultar de novo', fn: function () { if (proc) setMeta(proc.id, { status: 'disponível' }); ctx.scenario(''); ctx.toast(proc ? proc.name + ' está disponível' : 'Nenhum arquivo processando'); } });
      if (scn === 'falha') al = T2.al({ ic: 'refresh', t: 'Falha recuperável', s: 'O envio de Exame_sangue_out.pdf parou em 64% por falta de conexão. Retomar continua do ponto, sem criar um arquivo duplicado.', btn: 'Corrigir', fn: function () {
        if (!DB.arquivos.some(function (x) { return x.student === a.id && x.name === 'Exame_sangue_out.pdf'; })) DB.arquivos.unshift({ id: DB.uid('d'), student: a.id, name: 'Exame_sangue_out.pdf', kind: 'pdf', size: '2,1 MB', bytes: 2202009, at: U.todayShort, access: 'você e ' + a.first, cat: 'Exames', from: 'Rafael', status: 'disponível' });
        ctx.scenario(''); ctx.toast('Envio retomado e confirmado · um único arquivo'); } });
      if (scn === 'expirado') al = T2.al({ ic: 'clock', t: 'Acesso expirado', s: 'O compartilhamento de ' + ((all.find(function (x) { return x.id === expId; }) || {}).name || 'um arquivo') + ' venceu em 25/10. Peça a ' + a.first + ' para compartilhar de novo.', btn: 'Corrigir', fn: function () { ctx.go('TRE25', { id: a.id }); } });
      if (scn === 'semperm') al = T2.al({ kind: 'info', ic: 'lock', t: 'Sem permissão', s: 'Há arquivos de ' + a.first + ' que você não pode ver. Títulos e miniaturas ficam ocultos.', btn: 'Saiba por quê', fn: function () { ctx.ask({ title: 'Por que alguns arquivos estão ocultos', text: 'O vínculo de acompanhamento não libera todos os documentos. ' + a.first + ' escolhe, arquivo por arquivo, o que compartilhar com você.', lines: ['Exames e laudos só aparecem se forem compartilhados.', 'Nada fica em endereço público.'], ok: 'Entendi', cancel: false }); } });
      if (scn === 'linkexp') al = T2.al({ ic: 'link', t: 'Link expirou', s: 'O link temporário venceu. Um novo link só é gerado para quem tem acesso a este arquivo.', btn: 'Continuar', fn: view.renew });

      return {
        first: a.first, al: al, rows: rows, has: rows.length > 0, none: all.length === 0, noneCat: all.length > 0 && rows.length === 0,
        chips: chips, hasChips: chips.length > 0,
        sub: 'Privados · só ' + a.first + ' e Rafael · ' + U.plural(all.length, 'arquivo', 'arquivos'),
        det: det, acc: acc, view: view, up: up,
        openFirst: function () {
          var f = sel && sel.status === 'disponível' ? sel : all.find(function (x) { return x.status === 'disponível'; });
          if (!f || hidden) { ctx.toast('Nenhum arquivo disponível para abrir'); return; }
          ctx.setUi({ sel: f.id, view: f.id, linkAt: U.now() });
        },
        toStudent: function () { ctx.go('H05', { id: a.id }); }
      };
    }
  });
})();
