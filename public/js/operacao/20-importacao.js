/* O2 · OPS09 Importação de parceiro e prévia (+ .A origem e arquivo, .B erros por linha, .C identidade e duplicatas, .D confirmação e recibo)
   O arquivo (CSV, JSON ou JSONL) é lido só neste navegador (FileReader); nada é enviado. Sem coluna de galeria;
   arquivo repetido é detectado pela impressão digital e não duplica pessoas; o lote vai para a quarentena, nunca direto ao público. */
(function () {
  'use strict';
  var S = O2.S;
  var MODEL = ['id_externo', 'nome', 'cidade', 'uf', 'modalidade', 'email', 'cref', 'foto'];
  var REQUIRED = ['nome', 'cidade'];
  var AMBIG = ['centro', 'zona sul', 'zona norte', 'regiao metropolitana'];
  // perfis que já existem no catálogo (para achar possíveis duplicatas)
  var CATALOG = [
    { nome: 'Marcos A. Lima', cidade: 'Campinas', ref: '/marcos-lima', conta: 'u_8812' },
    { nome: 'Fernanda Alves', cidade: 'Campinas', ref: '/fernanda-alves', conta: 'sem conta' },
    { nome: 'Rodrigo Teles', cidade: 'Campinas', ref: '/rodrigo-teles', conta: 'sem conta' },
    { nome: 'Rafael Lima', cidade: 'Londrina', ref: '/rafael-lima', conta: 'u_1001' }
  ];
  var SAMPLE = 'id_externo,nome,cidade,uf,modalidade,email,cref,foto\n' +
    'fx-1001,Bianca Rocha,Campinas,SP,CrossFit,bianca.rocha@exemplo.com,,\n' +
    'fx-1002,Marcos Lima,Campinas,SP,Musculação,,,\n' +
    'fx-1003,Paula R.,Campinas,SP,Funcional,paula.r@,,\n' +
    'fx-1004,Júlio Santos,,SP,CrossFit,julio@exemplo.com,,\n' +
    'fx-1005,Rita Moraes,Centro,SP,Funcional,,,\n' +
    'fx-1006,Leo Tavares,Campinas,SP,Corrida,,,leo.jpg\n' +
    'fx-1007,Fernanda Alves,Campinas,SP,Pilates,,,\n' +
    'fx-1008,Caio Mendes,Valinhos,SP,Musculação,caio.m@exemplo.com,012999-G/SP,\n' +
    'fx-1009,Sofia Prado,Sumaré,SP,Yoga,,,\n' +
    'fx-1010,Bianca Rocha,Campinas,SP,CrossFit,,,\n';

  function hash(t) { var h = 5381; for (var i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) | 0; return 'h-' + (h >>> 0).toString(16); }
  function splitCsv(line, sep) {
    var out = [], cur = '', q = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (q) { if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
      else if (ch === '"') q = true; else if (ch === sep) { out.push(cur); cur = ''; } else cur += ch;
    }
    out.push(cur);
    return out.map(function (s) { return s.trim(); });
  }
  function parse(name, text) {
    var ext = (name.split('.').pop() || '').toLowerCase();
    var recs = [], cols = [];
    if (ext === 'json' || ext === 'jsonl') {
      var arr = ext === 'json' ? JSON.parse(text) : text.split(/\r?\n/).filter(function (l) { return l.trim(); }).map(function (l) { return JSON.parse(l); });
      if (!Array.isArray(arr)) throw new Error('O JSON precisa ser uma lista de registros.');
      arr.forEach(function (o) { Object.keys(o || {}).forEach(function (k) { if (cols.indexOf(k) < 0) cols.push(k); }); });
      recs = arr.map(function (o) { var r = {}; cols.forEach(function (k) { r[U.norm(k)] = o[k] == null ? '' : String(o[k]); }); return r; });
      cols = cols.map(U.norm);
    } else {
      var lines = text.replace(/^﻿/, '').split(/\r?\n/).filter(function (l) { return l.trim(); });
      if (!lines.length) throw new Error('Arquivo vazio.');
      var sep = lines[0].split(';').length > lines[0].split(',').length ? ';' : ',';
      cols = splitCsv(lines[0], sep).map(U.norm);
      recs = lines.slice(1).map(function (l) { var v = splitCsv(l, sep), r = {}; cols.forEach(function (k, i) { r[k] = v[i] || ''; }); return r; });
    }
    return { cols: cols, recs: recs };
  }
  var tokens = function (n) { return U.norm(n).split(/\s+/).filter(function (w) { return w.replace('.', '').length > 1; }); };
  var sameName = function (a, b) { var x = tokens(a), y = tokens(b); return x.length > 1 && y.length > 1 && x[0] === y[0] && x[x.length - 1] === y[y.length - 1]; };
  var mask = function (e) { return e ? e.replace(/^(.).*(@.*)?$/, function (m, a, b) { return a + '••••' + (b || ''); }) : ''; };

  // valida o arquivo e devolve a prévia do lote (nada é gravado fora do navegador)
  function buildLot(d) {
    var p = parse(d.name, d.text);
    if (p.cols.some(function (c) { return /galeria|gallery/.test(c); })) throw new Error('Coluna de galeria não é aceita: tire a coluna e envie de novo.');
    var miss = REQUIRED.filter(function (c) { return p.cols.indexOf(c) < 0; });
    if (miss.length) throw new Error('Versão incompatível: faltam as colunas ' + miss.join(', ') + ' do modelo v2.');
    var fonte = O2.find('o2_fontes', d.source) || O2.find('o2_fontes', 'fx');
    var errors = [], dups = [], seenRow = {}, errLines = {};
    p.recs.forEach(function (r, i) {
      var line = i + 2, nome = r.nome || '', cidade = r.cidade || '', email = r.email || '';
      var orig = [nome || '(vazio)', mask(email), cidade || '(vazio)', r.modalidade || ''].filter(Boolean).join(' · ');
      var add = function (field, problem, norm, kind) { errors.push({ line: line, field: field, problem: problem, norm: norm, kind: kind, orig: orig, fixed: false }); if (kind === 'erro') errLines[line] = true; };
      if (!nome) add('nome', 'nome ausente', '—', 'erro');
      if (!cidade) add('cidade', 'cidade ausente', '—', 'erro');
      else if (AMBIG.indexOf(U.norm(cidade)) >= 0) add('local', 'local ambíguo: “' + cidade + '”', (r.uf ? 'Campinas, ' + r.uf : 'Campinas') + '? confirmar', 'erro');
      if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) add('e-mail', 'e-mail inválido', '—', 'erro');
      if (r.foto && fonte.rights.foto.ok !== 'sim') add('foto', 'foto sem licença da fonte', 'monograma', 'aviso');
      if (nome && !errLines[line]) {
        var k = U.norm(nome + '|' + cidade);
        if (seenRow[k]) dups.push({ line: line, a: { nome: nome, cidade: cidade, cref: r.cref || '—' }, b: { nome: nome, cidade: cidade, ref: 'linha ' + seenRow[k] + ' deste arquivo', conta: 'mesmo arquivo' }, dec: '' });
        else {
          seenRow[k] = line;
          var hit = CATALOG.filter(function (c) { return sameName(c.nome, nome); })[0];
          if (hit) dups.push({ line: line, a: { nome: nome, cidade: cidade, cref: r.cref || '—' }, b: hit, dec: '' });
        }
      }
    });
    var nErr = Object.keys(errLines).length;
    var h = hash(U.norm(d.text));
    var prev = DB.o2_imp.seen.filter(function (s) { return s.hash === h; })[0];
    var n = 82 + DB.o2_imp.seen.length;
    return {
      lote: 'L-' + n, key: h.slice(2, 6) + '…', file: d.name, size: d.sizeTxt, source: fonte.id, model: 'v2', rows: p.recs.length, valid: p.recs.length - nErr, warnings: errors.filter(function (e) { return e.kind === 'aviso'; }).length,
      errors: errors, errCount: nErr, dups: dups, dupCount: dups.length, suppressed: 0, eligible: Math.max(0, p.recs.length - nErr - dups.length),
      status: 'prévia', received: '', processed: 0, fails: [], rec: '', sample: false, repeated: !!prev, prevLote: prev ? prev.lote : '', hash: h, seen: DB.o2_imp.seen, unknownCols: p.cols.filter(function (c) { return MODEL.indexOf(c) < 0; })
    };
  }
  var I = function () { return DB.o2_imp; };
  var fsrc = function () { return O2.find('o2_fontes', I().source) || O2.find('o2_fontes', 'fx'); };
  var srcLabel = function (f) { return f.name + ' · ' + (f.state === 'ativa' ? 'ativa até ' + f.valid : f.state); };

  // ---------- OPS09 · composição ----------
  O2.screen({
    key: 'ops09', id: 'OPS09', title: 'Prévia de importação', mtitle: 'Importação', nav: 'catalogo', back: 'H16', cap: 'importacao.preparar',
    scens: [['erros', '3 linhas com erro'], ['duplicatas', 'Duplicatas'], ['repetido', 'Arquivo repetido']],
    make: function (ctx) {
      var im = I(), scn = ctx.scn;
      var errs = im.errors.filter(function (e) { return e.kind === 'erro' && !e.fixed; });
      var notes = [];
      if (scn === 'erros' || (!scn && im.errCount > 0 && !im.sample)) notes.push(S.note('warn', U.plural(im.errCount, 'linha com erro', 'linhas com erro'), 'Essas linhas ficam fora do lote. Corrija na origem e envie de novo, ou siga sem elas.', [['Baixar relatório', function () { ctx.ask({ title: 'Relatório de erros · ' + im.file, text: 'Diagnóstico seguro: só linha, campo e problema, sem dados pessoais.', lines: errs.map(function (e) { return 'Linha ' + e.line + ' · ' + e.field + ' · ' + e.problem; }), ok: 'Fechar', cancel: false }); }], ['Tentar de novo', function () { GO('OPS09.A'); }]]));
      if (scn === 'duplicatas') notes.push(S.note('info', 'Duplicatas', im.dupCount + ' já existem no catálogo ou no próprio arquivo. Nada é mesclado sem decisão por item.', [['Comparar', function () { GO('OPS09.C'); }, 'primary']]));
      if (scn === 'repetido' || im.repeated) notes.push(S.note('ok', 'Arquivo repetido', 'Detectado, nada duplicado: este arquivo já foi processado' + (im.prevLote ? ' no lote ' + im.prevLote : ' no lote L-81') + '. Reimportar não cria pessoas de novo nem reativa suprimidos.'));
      return {
        head: { sub: im.file + ' · modelo ' + im.model }, alvo: 'Lote ' + im.lote + ' · ' + fsrc().name,
        acts: [S.act('Nova importação', function () { GO('OPS09.A'); }), S.act('Continuar', function () { GO('OPS09.B'); }, 'primary')],
        notes: notes,
        blocks: [
          S.kpis([['Linhas', im.rows], ['Válidas', im.valid], ['Erros', im.errCount, im.errCount ? 'risk' : ''], ['Duplicatas', im.dupCount, im.dupCount ? 'warn' : '']]),
          S.table('Linhas com erro', ['Linha', 'Erro'], errs.map(function (e) { return { cells: [String(e.line), e.problem], go: function () { GO('OPS09.B', { id: String(e.line) }); }, mt: 'Linha ' + e.line, ms: e.problem }; }), { emptyT: 'Nenhuma linha com erro', emptyS: 'Todas as linhas passaram na validação.' }),
          S.alert('plain', 'Sem galeria e sem publicação direta', 'CSV, JSON e JSONL autorizados, modelo v2. Nenhuma coluna ou ação de galeria; o lote vai para a quarentena, não para o público.'),
          S.rows('Passos', [
            { ic: 'upload', t: '1 · Origem, modelo e arquivo', s: srcLabel(fsrc()), go: function () { GO('OPS09.A'); } },
            { ic: 'list', t: '2 · Prévia e erros por linha', s: im.valid + ' válidas · ' + im.errCount + ' com erro', go: function () { GO('OPS09.B'); } },
            { ic: 'users', t: '3 · Identidade e duplicatas', s: U.plural(im.dupCount, 'possível duplicata', 'possíveis duplicatas'), go: function () { GO('OPS09.C'); } },
            { ic: 'check', t: '4 · Confirmação e recibo', s: im.status === 'prévia' ? 'aguardando confirmação' : im.status, badge: im.status, go: function () { GO('OPS09.D'); } }
          ])
        ]
      };
    }
  });

  // ---------- OPS09.A · Origem, modelo e arquivo ----------
  O2.screen({
    key: 'ops09a', id: 'OPS09.A', title: 'Importar · origem e arquivo', mtitle: 'Origem e arquivo', nav: 'catalogo', back: 'OPS09', cap: 'importacao.preparar',
    scens: [['revogada', 'Fonte revogada'], ['invalido', 'Arquivo inválido'], ['versao', 'Versão incompatível'], ['tamanho', 'Tamanho excedido'], ['interrompido', 'Upload interrompido']],
    make: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn, im = I();
      var src = ui.src || im.source || 'fx';
      var f = O2.find('o2_fontes', src) || O2.find('o2_fontes', 'fx');
      var d = im.draft || null;
      var scnErr = { invalido: 'Arquivo inválido: a linha 12 tem aspas abertas. Corrija e escolha de novo.', versao: 'Versão incompatível: o arquivo segue o modelo v1 (sem a coluna cidade). Baixe o modelo v2.', tamanho: 'Tamanho excedido: 14,8 MB. O limite é 10 MB; divida o arquivo.' }[scn] || '';
      var err = scnErr || ui.err || '';
      var notes = [];
      if (scn === 'revogada') notes.push(S.note('risk', 'Fonte revogada', 'Academia Y teve publicar e indexar revogados. Importar dela só para a quarentena, e só o que coletar ainda permite.', [['Ver revogação', function () { GO('OPS08.D', { id: 'ay' }); }]]));
      if (scn === 'interrompido') notes.push(S.note('warn', 'Upload interrompido', 'A leitura parou em 62%. O arquivo não foi usado; escolha de novo para retomar do começo.'));
      if (im.repeated && !d) notes.push(S.note('ok', 'Arquivo repetido detectado', 'O último arquivo já tinha sido processado. Nada foi duplicado.'));
      var readFile = function (e) {
        var fl = e && e.target && e.target.files && e.target.files[0];
        if (!fl) return;
        var ext = (fl.name.split('.').pop() || '').toLowerCase();
        if (['csv', 'json', 'jsonl'].indexOf(ext) < 0) return ctx.setUi({ err: 'Formato não aceito: use CSV, JSON ou JSONL do modelo v2.' });
        if (fl.size > 10 * 1024 * 1024) return ctx.setUi({ err: 'Tamanho excedido: ' + (fl.size / 1048576).toFixed(1).replace('.', ',') + ' MB. O limite é 10 MB.' });
        if (typeof FileReader === 'undefined') return ctx.setUi({ err: 'Este navegador não lê arquivos locais.' });
        var rd = new FileReader();
        rd.onload = function () {
          var text = String(rd.result || '');
          I().draft = { name: fl.name, sizeTxt: fl.size > 1048576 ? (fl.size / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(fl.size / 1024)) + ' KB', text: text, lines: text.split(/\r?\n/).filter(function (l) { return l.trim(); }).length - (ext === 'csv' ? 1 : 0), source: src };
          ctx.setUi({ err: '' }); ctx.toast('Arquivo lido só neste navegador · nada foi enviado.');
        };
        rd.onerror = function () { ctx.setUi({ err: 'Não deu para ler o arquivo. Escolha de novo.' }); };
        rd.readAsText(fl);
      };
      var useSample = function () { I().draft = { name: 'exemplo_parceiro.csv', sizeTxt: '1 KB', text: SAMPLE, lines: 10, source: src }; ctx.setUi({ err: '' }); };
      var validate = function () {
        if (scn === 'revogada' && src === 'ay') return ctx.toast('Fonte revogada: escolha outra fonte.');
        if (scnErr) return ctx.toast('Corrija o arquivo antes de validar.');
        var dd = I().draft;
        if (!dd) return ctx.setUi({ err: 'Escolha um arquivo ou use o arquivo de exemplo.' });
        if (f.state === 'rascunho' || f.state === 'vencida') return ctx.toast(f.name + ' está ' + f.state + ': não dá para importar.');
        var lot;
        try { dd.source = src; lot = buildLot(dd); } catch (x) { return ctx.setUi({ err: String(x && x.message || x) }); }
        DB.o2_imp = lot;
        GO('OPS09.B');
      };
      return {
        head: { sub: 'Passo 1 de 4', step: 1 }, alvo: 'Fonte · ' + f.name,
        acts: [S.act('Baixar modelo v2', function () { ctx.ask({ title: 'Modelo v2', text: 'Colunas na ordem (CSV com vírgula ou ponto e vírgula; JSON ou JSONL com as mesmas chaves):', lines: [MODEL.join(', '), 'Obrigatórias: nome e cidade.', 'Foto só com licença da fonte; sem coluna de galeria.', 'Limite: 10 MB por arquivo.'], ok: 'Fechar', cancel: false }); }), S.act('Validar', validate, 'primary')],
        notes: notes,
        blocks: [
          S.opts('Fonte', DB.o2_fontes.filter(function (x) { return x.state !== 'rascunho'; }).map(function (x) {
            var off = x.state === 'vencida' || (scn === 'revogada' && x.id === 'ay');
            return { label: srcLabel(x), on: src === x.id, chip: true, lock: off, go: function () { if (off) return ctx.toast(x.name + ': ' + (x.state === 'vencida' ? 'autorização vencida' : 'fonte revogada') + '. Não dá para importar.'); ctx.setUi({ src: x.id }); } };
          }), 'Só fontes com coletar autorizado. Aprovar fonte não autoriza fotos.'),
          S.kv('Modelo', [['Versão', 'v2 · CSV, JSON ou JSONL'], ['Limite', '10 MB · sem coluna de galeria'], ['Foto', f.rights.foto.ok === 'sim' ? 'com licença da fonte' : 'sem licença: perfis saem com monograma']]),
          S.file({ name: d ? d.name : 'Nenhum arquivo escolhido', sub: d ? d.sizeTxt + ' · ' + U.plural(d.lines, 'linha', 'linhas') + ' · lido só neste navegador' : 'CSV, JSON ou JSONL do modelo v2', cta: d ? 'Trocar arquivo' : 'Escolher arquivo', accept: '.csv,.json,.jsonl,text/csv,application/json', pick: readFile, err: err }),
          S.btns([S.act('Usar arquivo de exemplo', useSample), d ? S.act('Tirar arquivo', function () { I().draft = null; ctx.setUi({ err: '' }); }, 'ghost') : null], { help: 'Demonstração: use um arquivo fictício. O conteúdo não sai do navegador.' })
        ]
      };
    }
  });

  // ---------- OPS09.B · Prévia e erros por linha ----------
  O2.screen({
    key: 'ops09b', id: 'OPS09.B', title: 'Prévia · erros por linha', mtitle: 'Erros por linha', nav: 'catalogo', back: 'OPS09', wide: true, cap: 'importacao.preparar', testIds: ['102'],
    scens: [['obrigatorio', 'Campo obrigatório ausente'], ['ambiguo', 'Local ambíguo'], ['licenca', 'Licença de foto faltante'], ['parcial', 'Validação parcial']],
    make: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn, im = I();
      var only = ui.only != null ? ui.only : scn === 'obrigatorio';
      var list = im.errors.filter(function (e) { return !only || e.kind === 'erro'; }).filter(function (e) { return scn !== 'ambiguo' || e.field === 'local'; }).filter(function (e) { return scn !== 'licenca' || e.field === 'foto'; });
      var openL = ui.row != null ? ui.row : (ctx.id ? Number(ctx.id) : null);
      var rows = list.map(function (e) {
        return { cells: [String(e.line), e.field, e.problem, e.fixed ? { b: e.norm } : e.norm], sel: openL === e.line, go: function () { ctx.setUi({ row: openL === e.line ? -1 : e.line }); }, goL: openL === e.line ? 'Fechar' : 'Abrir',
          mt: 'Linha ' + e.line, ms: e.problem, mb: e.fixed ? 'corrigida' : e.kind, mbcls: e.fixed ? 'badge--ok' : e.kind === 'erro' ? 'badge--risk' : 'badge--warn' };
      });
      var cur = im.errors.filter(function (e) { return e.line === openL; })[0];
      var notes = [];
      if (scn === 'obrigatorio') notes.push(S.note('warn', 'Campo obrigatório ausente', 'Linhas sem nome ou cidade ficam fora. Corrija na origem: aqui não inventamos dado.'));
      if (scn === 'ambiguo') notes.push(S.note('info', 'Local ambíguo', '“Centro” existe em várias cidades. Confirme o mapeamento; nada é publicado ao corrigir.'));
      if (scn === 'licenca') notes.push(S.note('lock', 'Licença de foto faltante', 'A fonte não autoriza reutilizar foto. Esses perfis entram com monograma; a foto é descartada.'));
      if (scn === 'parcial') notes.push(S.note('warn', 'Validação parcial', 'A validação parou na linha 180 de 240. Os números podem mudar; valide de novo antes de continuar.', [['Validar de novo', function () { ctx.toast('Validação completa · 240 linhas · ' + im.errCount + ' com erro.'); }]]));
      var blocks = [
        S.kpis([['Válidas', im.valid], ['Com erro', im.errCount, im.errCount ? 'risk' : ''], ['Avisos', im.warnings, im.warnings ? 'warn' : '']]),
        S.opts('', [{ label: 'Só erros', on: only, chip: true, go: function () { ctx.setUi({ only: !only }); } }, only ? { label: 'Limpar filtros', on: false, chip: true, go: function () { ctx.setUi({ only: false }); } } : null], '', { cls: 'o2-blk o2-blk--bare' }),
        S.table('', ['Linha', 'Campo', 'Problema', 'Normalizado'], rows, { emptyT: 'Nenhuma linha com problema', emptyS: 'Todas as linhas passaram.' })
      ];
      if (cur) {
        blocks.push(S.cols('Linha ' + cur.line, [{ t: 'Original', rows: [['Valores', cur.orig], ['Campo', cur.field]] }, { t: 'Resultado', rows: [['Problema', cur.problem], ['Normalizado', cur.norm, cur.fixed ? 'corrigida' : '']] }], { side: ui.side || 'a', items: [['a', 'Original', function () { ctx.setUi({ side: 'a' }); }], ['b', 'Resultado', function () { ctx.setUi({ side: 'b' }); }]] }));
        if (cur.field === 'local' && !cur.fixed) {
          var cand = cur.norm.replace('? confirmar', '');
          blocks.push(S.btns([S.act('Confirmar “' + cand + '”', function () {
            cur.fixed = true; cur.norm = cand; im.errCount = Math.max(0, im.errCount - 1); im.valid += 1; im.eligible += 1;
            var r = O2.log({ cap: 'importacao.preparar', subj: im.lote, diff: 'linha ' + cur.line + ': local → ' + cand, short: 'Mapeamento · linha ' + cur.line });
            ctx.toast('Mapeamento confirmado · nada foi publicado · recibo ' + r.id);
          }, 'primary'), S.act('Manter como erro', function () { ctx.setUi({ row: -1 }); }, 'ghost')], { help: 'Corrigir o mapeamento não publica a linha: ela segue para a quarentena com o lote.' }));
        } else if (cur.kind === 'erro' && !cur.fixed) blocks.push(S.alert('plain', 'Corrija na origem', 'Este erro não tem correção segura aqui. A linha fica fora do lote e sai no diagnóstico.'));
      }
      return {
        head: { sub: 'Passo 2 de 4 · ' + U.plural(im.rows, 'linha', 'linhas'), step: 2 }, alvo: 'Arquivo ' + im.file,
        acts: [S.act('Exportar diagnóstico', function () { ctx.ask({ title: 'Diagnóstico seguro', text: 'Só linha, campo e problema. Sem nomes, e-mails ou documentos.', lines: im.errors.map(function (e) { return 'Linha ' + e.line + ' · ' + e.field + ' · ' + e.problem + (e.fixed ? ' (corrigida)' : ''); }), ok: 'Fechar', cancel: false }); }), S.act('Continuar', function () { if (scn === 'parcial') return ctx.toast('Valide de novo antes de continuar.'); GO('OPS09.C'); }, 'primary')],
        notes: notes, blocks: blocks
      };
    }
  });

  // ---------- OPS09.C · Identidade e duplicatas ----------
  O2.screen({
    key: 'ops09c', id: 'OPS09.C', title: 'Identidade e duplicatas', mtitle: 'Duplicatas', nav: 'catalogo', back: 'OPS09', cap: 'importacao.preparar',
    scens: [['homonimo', 'Homônimo'], ['foto', 'Foto diferente'], ['suprimido', 'Já suprimido'], ['conflitante', 'Fonte conflitante'], ['indisponivel', 'Comparação indisponível']],
    make: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn, im = I();
      var head = { sub: 'Passo 3 de 4 · ' + U.plural(im.dupCount, 'possível duplicata', 'possíveis duplicatas'), step: 3 };
      var repeat = S.act('Repetir prévia', function () { ctx.toast('Prévia repetida · ' + U.plural(im.dupCount, 'possível duplicata', 'possíveis duplicatas') + ' · nada mudou.'); });
      var next = S.act('Continuar', function () { GO('OPS09.D'); }, 'primary');
      if (scn === 'indisponivel') return { head: head, alvo: 'Lote ' + im.lote, acts: [repeat], blocks: [S.empty('alert', 'Comparação indisponível', 'O catálogo não respondeu. Sem comparar, nada é mesclado nem descartado: repita a prévia.', 'Repetir prévia', function () { ctx.toast('Catálogo ainda indisponível.'); })] };
      if (!im.dups.length) return { head: head, alvo: 'Lote ' + im.lote, acts: [repeat, next], blocks: [S.empty('users', 'Nenhuma possível duplicata', 'Nenhum nome do arquivo bate com o catálogo nem se repete no arquivo.')] };
      var idx = Math.min(ui.i || 0, im.dups.length - 1);
      var d = im.dups[idx];
      var notes = [];
      if (scn === 'homonimo') notes.push(S.note('info', 'Homônimo', 'Mesmo nome, cidade diferente e sem CREF. Provavelmente outra pessoa: mantenha separado.'));
      if (scn === 'foto') notes.push(S.note('warn', 'Foto diferente', 'A foto do arquivo não bate com a do perfil. Foto não prova identidade; e esta fonte nem tem licença de imagem.'));
      if (scn === 'suprimido') notes.push(S.note('lock', 'Já suprimido', 'Este perfil foi retirado a pedido do titular (#P-39). Reimportar não reativa: a linha é descartada.'));
      if (scn === 'conflitante') notes.push(S.note('warn', 'Fonte conflitante', 'Federação X diz Campinas; Clube W diz Valinhos. Envie à quarentena para revisão com evidência.'));
      notes.push(S.note('plain', 'Sem fusão por nome e cidade', 'Nome e cidade não provam que é a mesma pessoa. Decida item por item.'));
      var decide = function (dec, label) {
        return function () {
          if (scn === 'suprimido' && dec !== 'descartar') return ctx.toast('Perfil suprimido: a linha só pode ser descartada.');
          d.dec = dec;
          var r = O2.log({ cap: 'importacao.preparar', subj: im.lote, diff: 'linha ' + d.line + ': ' + label, short: 'Duplicata · linha ' + d.line });
          ctx.toast(label + ' · linha ' + d.line + ' · recibo ' + r.id);
          if (idx < im.dups.length - 1) ctx.setUi({ i: idx + 1 }); else ctx.refresh();
        };
      };
      var decided = im.dups.filter(function (x) { return x.dec; }).length;
      return {
        head: head, alvo: 'Lote ' + im.lote,
        acts: [repeat, next],
        notes: notes,
        blocks: [
          S.cols('Item ' + (idx + 1) + ' de ' + im.dups.length + (d.dec ? ' · ' + (d.dec === 'separado' ? 'mantido separado' : d.dec === 'quarentena' ? 'enviado à quarentena' : 'descartado') : ''), [
            { t: 'No arquivo · linha ' + d.line, rows: [['Nome', d.a.nome], ['Cidade', scn === 'conflitante' ? 'Valinhos' : d.a.cidade], ['CREF', d.a.cref]] },
            { t: 'Já existe · ' + d.b.ref, rows: [['Nome', d.b.nome], ['Cidade', d.b.cidade], ['Conta', d.b.conta]] }
          ], { side: ui.side || 'a', items: [['a', 'No arquivo', function () { ctx.setUi({ side: 'a' }); }], ['b', 'Já existe', function () { ctx.setUi({ side: 'b' }); }]] }),
          S.btns([S.act('Manter separado', decide('separado', 'Mantido separado')), S.act('Enviar à quarentena (OPS10)', decide('quarentena', 'Enviado à quarentena'), 'primary'), scn === 'suprimido' ? S.act('Descartar linha', decide('descartar', 'Linha descartada'), 'danger') : null], { help: decided + ' de ' + im.dups.length + ' decididas' + (im.dupCount > im.dups.length ? ' · ' + (im.dupCount - im.dups.length) + ' outras na quarentena por padrão' : '') + '.' }),
          S.btns([idx > 0 ? S.act('Anterior', function () { ctx.setUi({ i: idx - 1 }); }, 'ghost') : null, idx < im.dups.length - 1 ? S.act('Próxima', function () { ctx.setUi({ i: idx + 1 }); }, 'ghost') : null, S.act('Abrir quarentena', function () { GO('OPS10'); }, 'ghost')])
        ]
      };
    }
  });

  // ---------- OPS09.D · Confirmação e recibo do lote ----------
  O2.screen({
    key: 'ops09d', id: 'OPS09.D', title: 'Confirmar lote', mtitle: 'Confirmar lote', nav: 'catalogo', back: 'OPS09', cap: 'importacao.executar',
    scens: [['processado', 'Arquivo já processado'], ['parcial', 'Parcial'], ['limite', 'Muitas requisições (429)'], ['semautorizacao', 'Fonte perdeu autorização'], ['desconhecido', 'Resultado desconhecido']],
    make: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn, im = I();
      var repeated = im.repeated || scn === 'processado';
      var unk = scn === 'desconhecido' ? O2.unknown(ctx, 'confirmar envio à quarentena', 'o lote ' + im.lote + ' foi recebido às ' + (im.received || '14:10') + '. Nada a repetir.') : null;
      var started = im.status !== 'prévia';
      var notes = [];
      if (unk) notes.push(unk.note);
      if (repeated) notes.push(S.note('ok', 'Arquivo já processado', 'Mesma impressão digital do lote ' + (im.prevLote || 'L-81') + '. Nada é importado de novo; nenhuma pessoa duplicada, nenhum suprimido reativado.'));
      if (scn === 'parcial') notes.push(S.note('warn', 'Parcial', '140 de 213 linhas gravadas; o resto segue na fila. O recibo mostra o que já entrou.'));
      if (scn === 'limite') notes.push(S.note('warn', 'Muitas requisições (429)', 'A quarentena pediu pausa. A gravação retoma sozinha em 2 minutos; não confirme de novo.'));
      if (scn === 'semautorizacao') notes.push(S.note('risk', 'Fonte perdeu autorização', 'Federação X suspendeu a coleta às 14:20. As linhas não gravadas param; as gravadas ficam na quarentena.', [['Ver fonte', function () { GO('OPS08.B', { id: 'fx' }); }]]));
      if (im.rec && started) notes.push(S.rec(im.rec, 'Lote ' + im.lote + ' recebido', ''));
      var confirm = function () {
        if (unk && unk.block) return O2.blocked(ctx);
        if (repeated) return ctx.toast('Arquivo já processado: nada a importar.');
        if (started) return ctx.toast('Lote já confirmado às ' + im.received + ' · recibo ' + im.rec + '. Consulte o andamento.');
        if (scn === 'semautorizacao') return ctx.toast('Fonte sem autorização: não dá para confirmar.');
        O2.decide(ctx, { needMotivo: false, text: 'Confirmar envia o lote para a quarentena. Nada vai ao público sem revisão.', title: 'Confirmar envio à quarentena?', lines: [U.plural(im.eligible, 'linha elegível', 'linhas elegíveis') + ' · lote ' + im.lote + ' · chave ' + im.key, 'Descartes: ' + im.errCount + ' erros · ' + im.dupCount + ' duplicatas · ' + im.suppressed + ' suprimidos.', 'Reimportar o mesmo arquivo não duplica pessoas nem reativa suprimidos.'], ok: 'Confirmar envio', cap: 'importacao.executar', subj: im.lote, diff: 'lote ' + im.lote + ' → quarentena · ' + im.eligible + ' linhas', short: 'Lote ' + im.lote + ' → quarentena', doneMsg: 'Lote recebido',
          done: function (r) { im.status = 'processando'; im.received = U.now(); im.processed = 0; im.rec = r.id; if (im.hash) im.seen.push({ hash: im.hash, name: im.file, lote: im.lote, at: '26/10 ' + im.received }); } });
      };
      var poll = function () {
        if (!started) return ctx.toast('Confirme o lote primeiro.');
        if (scn === 'limite') return ctx.toast('Em pausa (429) · retoma sozinho.');
        if (im.processed < im.eligible - im.fails.length) { im.processed = Math.min(im.eligible - im.fails.length, im.processed + Math.max(10, Math.round(im.eligible / 3))); }
        if (im.processed >= im.eligible - im.fails.length) im.status = im.fails.length ? 'concluído com falhas' : 'concluído';
        ctx.refresh(); ctx.toast('Andamento: ' + im.processed + ' de ' + im.eligible + ' gravadas.');
      };
      var steps = started ? [
        ['Recebido', im.received, 'Confirmado'],
        ['Linhas processadas', im.processed + ' de ' + im.eligible, im.processed >= im.eligible - im.fails.length ? 'Confirmado' : 'Em andamento'],
        im.fails.length ? ['Falhas', im.fails.length + ' · abrir', 'Falhou', function () { ctx.setUi({ fails: !ui.fails }); }, ui.fails ? 'Fechar' : 'Abrir'] : null
      ].filter(Boolean) : [['Aguardando confirmação', 'nada gravado ainda', 'Na fila']];
      var blocks = [
        S.kv('', [['Escopo aprovado', 'quarentena · não público'], ['Elegíveis', repeated ? '0 · arquivo já processado' : String(im.eligible)], ['Descartes', im.errCount + ' erros · ' + im.dupCount + ' duplicatas · ' + im.suppressed + ' suprimidos'], ['Arquivo', im.file + ' · ' + im.size]]),
        S.steps('Resultado', steps)
      ];
      if (ui.fails && im.fails.length) {
        blocks.push(S.table('Falhas', ['Linha', 'Motivo'], im.fails.map(function (x) { return { cells: [String(x.line), x.why], mt: 'Linha ' + x.line, ms: x.why }; })));
        blocks.push(S.btns([S.act('Retomar só pendentes', function () {
          var r = O2.log({ cap: 'importacao.executar', subj: im.lote, diff: 'retomada de ' + im.fails.length + ' linhas pendentes', short: 'Retomada · ' + im.lote });
          im.processed += im.fails.length; im.fails = []; im.status = im.processed >= im.eligible ? 'concluído' : im.status; ctx.setUi({ fails: false }); ctx.toast('Só as pendentes foram retomadas · recibo ' + r.id);
        }, 'primary')], { help: 'Retomar não reprocessa o que já entrou.' }));
      }
      return {
        head: { sub: 'Passo 4 de 4 · ' + im.lote, step: 4 }, alvo: 'Lote ' + im.lote + ' · chave ' + im.key,
        acts: [started ? S.act('Consultar andamento', poll) : null, S.act(started ? 'Lote confirmado' : 'Confirmar envio à quarentena', confirm, 'primary', started || repeated || (unk && unk.block))],
        notes: notes, blocks: blocks
      };
    }
  });
})();
