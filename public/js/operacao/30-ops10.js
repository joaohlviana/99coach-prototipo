/* O3 · OPS10 Quarentena e revisão de candidatos (+ OPS10.A fila, OPS10.B identidade, OPS10.C decisão por finalidade).
   Importado nunca aparece como treinador verificado nem usuário ativo: perfil "não reivindicado", sem selo, monograma sem foto autorizada. */
(function () {
  'use strict';
  var O3 = window.O3;
  var STATUS = {
    'quarentena': ['Revisar', 'badge badge--warn'], 'associação proposta': ['Associação proposta', 'badge badge--info'], 'separado': ['Mantido separado', 'badge badge--plain'],
    'aprovado': ['Aprovado · não reivindicado', 'badge badge--ok'], 'rejeitado': ['Rejeitado', 'badge badge--risk'], 'devolvido': ['Devolvido para complemento', 'badge badge--warn']
  };
  var stLabel = function (c) { return (STATUS[c.status] || [c.status])[0]; };
  var stCls = function (c) { return (STATUS[c.status] || [0, 'badge badge--plain'])[1]; };
  O3.rev('o3cand', function (d) { var c = DB.find('o3_candidatos', d.id); if (c) { c.status = d.status; if (d.resp) c.resp = d.resp; } if (d.pub) DB.o3_catalogo.publicados -= d.pub; });
  O3.rev('o3candMany', function (d) { (d.items || []).forEach(function (it) { var c = DB.find('o3_candidatos', it.id); if (c) c.status = it.status; }); });
  O3.rev('o3field', function (d) { var c = DB.find('o3_candidatos', d.id); if (c) c[d.field] = d.prev; });
  var cand = function (ctx, def) { return DB.find('o3_candidatos', ctx.id) || DB.find('o3_candidatos', def); };
  var linkRows = function (rows) { return rows.map(function (r) { return { label: r[0], sub: r[1], ic: 'ic ic--sm i-' + r[2], go: function () { GO(r[3], r[4] || {}); } }; }); };

  // ---------- OPS10 · composição ----------
  REG.screen({
    page: 'operacao', key: 'ops10', id: 'OPS10', title: 'Quarentena e revisão', mtitle: 'Quarentena', nav: 'catalogo', back: 'H16', wide: true,
    normal: 'Fila com candidatos', testIds: ['c_5530', 'c_5541'],
    scens: [['ambigua', 'Identidade ambígua'], ['aprovado', 'Aprovado'], ['semfoto', 'Sem foto autorizada']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn;
      // na situação "Aprovado", Marcos aparece aprovado (só na visualização; os dados não mudam)
      var all = DB.o3_candidatos.map(function (x) { return scn === 'aprovado' && x.id === 'c_5512' && x.status === 'quarentena' ? Object.assign({}, x, { status: 'aprovado' }) : x; });
      var preset = scn === 'semfoto' ? 'c_5530' : (ctx.id || '');
      var ld = O3.ld(ctx, all, 'sel', preset);
      var c = ld.cur;
      var alerts = [];
      if (scn === 'ambigua') alerts.push(O3.alert('warn', 'Identidade ambígua', 'Marcos Lima (Federação X) e Marcos A. Lima (perfil existente) têm o mesmo nome e cidade. Compare lado a lado antes de decidir.', 'Comparar', function () { GO('OPS10.B', { id: 'c_5512' }); }));
      if (scn === 'aprovado') alerts.push(O3.alert('ok', 'Aprovado', 'Marcos L. foi publicado como perfil “não reivindicado”: sem selo de verificado, sem conta, venda ou contato até o titular reivindicar.'));
      if (scn === 'semfoto') alerts.push(O3.alert('info', 'Sem foto autorizada', 'A licença da fonte não cobre foto. O perfil aparece com monograma.', ui.why ? 'Fechar explicação' : 'Saiba por quê', function () { ctx.setUi({ why: !ui.why }); }));
      var rows = all.map(function (x) {
        return { id: x.id, name: x.name, short: x.short, motivo: x.motivo, origem: x.origem, st: stLabel(x), stCls: stCls(x), cls: ld.rowCls(x.id) + ' lrow', go: ld.pick(x.id), ini: U.ini(x.name) };
      });
      var isDup = !!(c && c.match), isFoto = !!(c && c.motivo === 'foto sem direito'), isSusp = !!(c && c.motivo === 'fonte suspensa'), isSem = !!(c && c.motivo === 'sem dados suficientes');
      var open = c && c.status === 'quarentena';
      var decide = function (same) {
        return function () {
          if (!c) return;
          O3.decide(ctx, {
            title: same ? 'Propor associação a u_8812?' : 'Manter como pessoas diferentes?', ok: same ? 'Propor associação' : 'Manter separado', scope: 'ops10',
            action: same ? 'Mesma pessoa · associação proposta' : 'Pessoas diferentes · mantido separado', target: c.id + ' · ' + c.name,
            impact: same ? ['O candidato vira proposta de associação ao perfil u_8812 (titular).', 'Nada do que o titular publicou muda.', 'Não cria conta, venda nem contato.'] : ['O candidato segue como perfil próprio, ainda em quarentena.', 'O perfil u_8812 não é alterado.'],
            apply: function () { c.status = same ? 'associação proposta' : 'separado'; }, rev: 'o3cand', data: { id: c.id, status: c.status }
          });
        };
      };
      var acts = [O3.btn(ctx, 'Abrir fila completa', function () { GO('OPS10.A'); })];
      var cmp = isDup ? [
        { k: 'Nome', a: c.name, b: c.match.name }, { k: 'Cidade', a: c.city, b: c.match.city }
      ] : [];
      var detActs = [];
      if (isDup) detActs = [O3.btn(ctx, 'Mesma pessoa', decide(true), { kind: 'btn--primary', dis: !open, why: 'Este candidato já tem decisão. Use o recibo para desfazer.' }), O3.btn(ctx, 'Pessoas diferentes', decide(false), { dis: !open, why: 'Este candidato já tem decisão. Use o recibo para desfazer.' }), O3.btn(ctx, 'Revisar campo a campo', function () { GO('OPS10.B', { id: c.id }); }, { kind: 'btn--ghost' })];
      else if (isFoto || isSem) detActs = [O3.btn(ctx, 'Decidir por finalidade', function () { GO('OPS10.C', { id: c.id }); }, { kind: 'btn--primary' })];
      else if (isSusp) detActs = [O3.btn(ctx, 'Ver direitos da fonte', function () { GO('OPS08'); })];
      var rc = O3.rcPack(ctx, 'ops10');
      return {
        hasEyebrow: true, eyebrow: 'Catálogo · quarentena', h1: 'Quarentena', sub: DB.o3_catalogo.quarentena + ' candidatos · lote L-81 · ' + O3.WHEN, acts: acts,
        alerts: alerts, ldCls: ld.ldCls, rows: rows, hasCur: !!c, cur: c ? { name: c.name, ini: U.ini(c.name), st: stLabel(c), stCls: stCls(c), sub: c.origem + ' · ' + c.lote + ' linha ' + c.linha } : { name: '', ini: '', st: '', stCls: '', sub: '' },
        kv: c ? [O3.kv('Origem', c.origem), O3.kv('Motivo da quarentena', c.motivo, c.motivo), O3.kv('Pendente', c.pendente), O3.kv('Responsável', c.resp), O3.kv('Como aparece', 'perfil importado · não reivindicado')] : [],
        isDup: isDup, cmp: cmp, detActs: detActs, toList: ld.toList, dec: O3.reason(ctx, 'Motivo da decisão sobre a identidade'),
        showWhy: scn === 'semfoto' && !!ui.why,
        why: 'Cada fonte autoriza coletar, publicar, indexar e usar foto separadamente. A Federação X autorizou publicar e indexar, mas não foto (evidência de 02/10). Sem foto autorizada, mostramos monograma; não buscamos foto em outro lugar.',
        links: linkRows([['Fila de candidatos', 'Filtrar, atribuir e rejeitar', 'list', 'OPS10.A'], ['Revisão da identidade', 'Comparar campos e procedência', 'users', 'OPS10.B', { id: 'c_5512' }], ['Decisão por finalidade', 'Aprovar escopo, devolver ou rejeitar', 'checksq', 'OPS10.C', { id: 'c_5530' }]]),
        rcs: rc.rcs, hasRcs: rc.hasRcs
      };
    }
  });

  // ---------- OPS10.A · fila ----------
  var MOTIVOS = ['duplicata provável', 'foto sem direito', 'fonte suspensa', 'sem dados suficientes'];
  REG.screen({
    page: 'operacao', key: 'ops10a', id: 'OPS10.A', title: 'Fila de candidatos', mtitle: 'Quarentena', nav: 'catalogo', back: 'OPS10', wide: true,
    normal: 'Fila do lote', scens: [['semdados', 'Sem dados suficientes'], ['foto', 'Foto sem direito'], ['duplicata', 'Duplicata provável'], ['suspensa', 'Fonte suspensa'], ['vazio', 'Fila vazia']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn;
      var preset = { semdados: 'sem dados suficientes', foto: 'foto sem direito', duplicata: 'duplicata provável', suspensa: 'fonte suspensa' }[scn] || '';
      var f = ui.f !== undefined ? ui.f : preset;
      var q = U.norm(ui.q || '');
      var sel = ui.selIds || [];
      var src = scn === 'vazio' ? [] : DB.o3_candidatos.filter(function (c) { return c.status === 'quarentena'; });
      var list = src.filter(function (c) { return (!f || c.motivo === f) && (!q || U.norm(c.name + ' ' + c.origem + ' ' + c.id).indexOf(q) >= 0); });
      var openOf = function (c) {
        if (c.match) return function () { GO('OPS10.B', { id: c.id }); };
        if (c.motivo === 'fonte suspensa') return function () { GO('OPS08'); };
        return function () { GO('OPS10.C', { id: c.id }); };
      };
      var rows = list.map(function (c) {
        var on = sel.indexOf(c.id) >= 0, locked = c.motivo === 'fonte suspensa';
        return { id: c.id, name: c.name, origem: c.origem, motivo: c.motivo, motCls: O3.tone(c.motivo), pendente: c.pendente, resp: c.resp, next: c.next, on: String(on), chk: 'check' + (on ? ' is-on' : ''),
          locked: locked, notLocked: !locked, open: openOf(c),
          toggle: function () { if (locked) { ctx.toast('Fonte suspensa: candidatos da Academia Y ficam travados até a fonte voltar.'); return; } ctx.setUi({ selIds: on ? sel.filter(function (x) { return x !== c.id; }) : sel.concat([c.id]) }); } };
      });
      var chips = [['', 'Todos']].concat(MOTIVOS.map(function (m) { return [m, m]; })).map(function (m) {
        var on = f === m[0];
        return { label: m[1], cls: 'chip' + (on ? ' is-on' : ''), on: String(on), go: function () { ctx.setUi({ f: m[0], selIds: [] }); } };
      });
      var alerts = [];
      if (scn === 'semdados') alerts.push(O3.alert('warn', 'Sem dados suficientes', 'Renata P. chegou sem cidade e modalidade. Não aprove com campo vazio: devolva para complemento da fonte.', 'Abrir Renata P.', function () { GO('OPS10.C', { id: 'c_5547' }); }));
      if (scn === 'foto') alerts.push(O3.alert('info', 'Foto sem direito', 'A licença da fonte não cobre foto. A aprovação segue sem foto, com monograma.', 'Abrir Paula N.', function () { GO('OPS10.C', { id: 'c_5530' }); }));
      if (scn === 'duplicata') alerts.push(O3.alert('warn', 'Duplicata provável', 'Marcos Lima parece ser Marcos A. Lima (u_8812). Compare campo a campo antes de associar.', 'Revisar identidade', function () { GO('OPS10.B', { id: 'c_5512' }); }));
      if (scn === 'suspensa') alerts.push(O3.alert('risk', 'Fonte suspensa', 'Academia Y está em revisão de contrato desde 20/10. Os candidatos dela ficam travados e nada é publicado.', 'Ver direitos da fonte', function () { GO('OPS08'); }));
      var reject = function () {
        if (!sel.length) { ctx.toast('Selecione ao menos um candidato.'); return; }
        var items = sel.map(function (id) { return DB.find('o3_candidatos', id); }).filter(Boolean);
        O3.decide(ctx, {
          title: 'Rejeitar ' + U.plural(items.length, 'candidato', 'candidatos') + '?', ok: 'Rejeitar', danger: true, scope: 'ops10a', action: 'Rejeitar', target: items.map(function (c) { return c.name; }).join(', '),
          impact: ['Saem da fila de quarentena; nada é publicado.', 'Reimportação das mesmas linhas fica suprimida.', 'Usa sua capacidade quarentena.decidir.'],
          apply: function () { items.forEach(function (c) { c.status = 'rejeitado'; }); ctx.setUi({ selIds: [] }); },
          rev: 'o3candMany', data: { items: items.map(function (c) { return { id: c.id, status: c.status }; }) }
        });
      };
      var assign = function () {
        if (!sel.length) { ctx.toast('Selecione ao menos um candidato para atribuir.'); return; }
        sel.forEach(function (id) { var c = DB.find('o3_candidatos', id); if (c) c.resp = 'Lia'; });
        ctx.setUi({ selIds: [] });
        ctx.toast(U.plural(sel.length, 'candidato atribuído', 'candidatos atribuídos') + ' a você');
      };
      var rc = O3.rcPack(ctx, 'ops10a');
      return {
        hasEyebrow: false, eyebrow: '', h1: 'Quarentena', sub: DB.o3_catalogo.quarentena + ' candidatos · mostrando ' + list.length + ' do lote L-81',
        acts: [O3.btn(ctx, sel.length ? 'Atribuir a mim (' + sel.length + ')' : 'Atribuir', assign)],
        ctx: O3.ctx('quarentena.ler', 'Candidatos de L-81'), alerts: alerts, chips: chips, q: ui.q || '', setQ: function (e) { ctx.setUi({ q: U.val(e) }); },
        rows: rows, hasRows: rows.length > 0, noRows: rows.length === 0,
        emptyT: scn === 'vazio' ? 'Nenhum candidato em quarentena' : 'Nenhum candidato com esse filtro', emptyS: scn === 'vazio' ? 'O lote L-81 foi todo revisado. Novos candidatos chegam pela importação de parceiro.' : 'Limpe o filtro ou a busca para ver a fila inteira.',
        clear: function () { ctx.setUi({ f: '', q: '' }); },
        hasSel: sel.length > 0, selN: U.plural(sel.length, 'selecionado', 'selecionados'),
        decTitle: 'Rejeitar selecionados', hasImpact: true, impact: ['Saem da fila; nada é publicado.', 'Reimportação das mesmas linhas fica suprimida.', 'Candidatos de fonte suspensa não podem ser selecionados.'],
        dec: O3.reason(ctx), decActs: [O3.btn(ctx, 'Rejeitar', reject, { kind: 'btn--outline o3-danger', size: 'btn--lg' })],
        rcs: rc.rcs, hasRcs: rc.hasRcs
      };
    }
  });

  // ---------- OPS10.B · identidade ----------
  var PROV = ['Federação X', 'perfil próprio', 'documento do caso'];
  REG.screen({
    page: 'operacao', key: 'ops10b', id: 'OPS10.B', title: 'Revisar identidade', nav: 'catalogo', back: 'OPS10',
    normal: 'Perfil já reivindicado', scens: [['incompat', 'Identidades incompatíveis'], ['insuf', 'Prova insuficiente'], ['conflito', 'Conflito concorrente']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn;
      var c = cand(ctx, 'c_5512');
      var m = c.match || { name: '—', city: '—', mod: '—', owner: '—' };
      var exCity = scn === 'incompat' ? 'Sobral' : m.city;
      var fields = [['name', 'Nome', c.name, m.name, (c.prov && c.prov.name) || c.origem], ['city', 'Cidade', c.city, exCity, (c.prov && c.prov.city) || c.origem], ['mod', 'Modalidade', c.mod, m.mod, (c.prov && c.prov.mod) || c.origem]];
      var rows = fields.map(function (f) {
        var same = U.norm(f[2]) === U.norm(f[3]);
        var editing = ui.edit === f[0];
        return { k: f[1], a: f[2], b: f[3], prov: f[4], same: same, diff: !same, eq: same ? 'igual' : 'diverge', eqCls: same ? 'badge badge--ok' : 'badge badge--warn',
          editing: editing, notEditing: !editing, edit: function () { ctx.setUi({ edit: f[0], ev: c[f[0]], pv: '' }); } };
      });
      var blocked = scn === 'incompat' || scn === 'insuf' || (scn === 'conflito' && !ui.reloaded);
      var why = scn === 'incompat' ? 'Identidades incompatíveis: a cidade diverge. Mantenha separado.' : (scn === 'insuf' ? 'Prova insuficiente: peça evidência antes de associar.' : 'Outra pessoa está decidindo. Recarregue a versão atual antes.');
      var open = c.status === 'quarentena';
      var decide = function (same) {
        return function () {
          if (!open) { ctx.toast('Este candidato já tem decisão. Use o recibo para desfazer.'); return; }
          O3.decide(ctx, {
            title: same ? 'Propor associação a ' + m.owner + '?' : 'Manter separado?', ok: same ? 'Propor associação' : 'Manter separado', scope: 'ops10b',
            action: same ? 'Associação proposta' : 'Mantido separado', target: c.id + ' · ' + c.name,
            impact: same ? [m.owner + ' é titular: a associação não muda o que ele publicou.', 'A proposta fica no histórico do candidato e do perfil.', 'Não cria conta, venda nem contato.'] : ['O candidato segue em quarentena como pessoa diferente.', 'O perfil ' + m.owner + ' não é alterado.'],
            apply: function () { c.status = same ? 'associação proposta' : 'separado'; }, rev: 'o3cand', data: { id: c.id, status: c.status }
          });
        };
      };
      var alerts = [];
      if (scn === 'incompat') alerts.push(O3.alert('risk', 'Identidades incompatíveis', 'O perfil existente é de Sobral e o candidato é de Campinas. Associação bloqueada; mantenha separado ou peça evidência.'));
      if (scn === 'insuf') alerts.push(O3.alert('warn', 'Prova insuficiente', 'Só o nome coincide e a fonte não traz registro profissional. Peça evidência antes de propor associação.', 'Pedir evidência à fonte', function () { var r = O3.receipt({ scope: 'ops10b', action: 'Evidência pedida à fonte', target: c.id + ' · ' + c.origem, reason: 'Prova insuficiente para associar' }); ctx.toast('Pedido registrado · recibo ' + r.id); }));
      if (scn === 'conflito' && !ui.reloaded) alerts.push(O3.alert('warn', 'Conflito concorrente', 'Caio abriu uma decisão para este candidato às 14:05. Recarregue para ver a versão atual antes de decidir.', 'Recarregar versão atual', function () { ctx.setUi({ reloaded: true }); ctx.toast('Versão atual carregada · Caio ainda não decidiu'); }));
      if (scn === 'conflito' && ui.reloaded) alerts.push(O3.alert('ok', 'Versão atual carregada', 'Caio não registrou decisão. Sua decisão vale a partir de agora e fica no histórico.'));
      var save = function () {
        var v = String(ui.ev || '').trim();
        if (!v) { ctx.setUi({ ferr: 'Informe o valor corrigido.' }); return; }
        if (!ui.pv) { ctx.setUi({ ferr: 'Escolha a procedência do valor.' }); return; }
        var prev = c[ui.edit];
        c[ui.edit] = v;
        var r = O3.receipt({ scope: 'ops10b', action: 'Campo corrigido', target: c.id + ' · ' + ui.edit + ': ' + prev + ' → ' + v, reason: 'Procedência: ' + ui.pv, rev: 'o3field', data: { id: c.id, field: ui.edit, prev: prev }, undo: true });
        ctx.setUi({ edit: '', ev: '', pv: '', ferr: '' });
        ctx.toast('Campo corrigido · recibo ' + r.id);
      };
      var rc = O3.rcPack(ctx, 'ops10b');
      return {
        hasEyebrow: false, eyebrow: '', h1: 'Revisar identidade', sub: c.name + ' · linha ' + c.linha,
        acts: [O3.btn(ctx, 'Manter separado', decide(false)), O3.btn(ctx, 'Propor associação', decide(true), { kind: 'btn--primary', dis: blocked, why: why })],
        ctx: O3.ctx('quarentena.decidir', 'Candidato ' + c.id), alerts: alerts, rows: rows, st: stLabel(c), stCls: stCls(c),
        claimed: !!c.match, claimT: 'Perfil já reivindicado', claimS: m.owner + ' é titular. Associação não muda o que ele publicou.',
        foto: 'Foto não exibida: a licença da ' + c.origem + ' não cobre foto.',
        isEdit: !!ui.edit, ev: ui.ev || '', setEv: function (e) { ctx.setUi({ ev: U.val(e), ferr: '' }); },
        provs: PROV.map(function (p) { var on = ui.pv === p; return { label: p, cls: 'chip' + (on ? ' is-on' : ''), on: String(on), go: function () { ctx.setUi({ pv: p, ferr: '' }); } }; }),
        hasFerr: !!ui.ferr, ferr: ui.ferr || '', save: save, cancelEdit: function () { ctx.setUi({ edit: '', ev: '', pv: '', ferr: '' }); },
        editLabel: ({ name: 'Nome', city: 'Cidade', mod: 'Modalidade' })[ui.edit] || '',
        decTitle: 'Decisão sobre a identidade', hasImpact: true,
        impact: ['Propor associação: ' + m.owner + ' continua titular; nada do que publicou muda.', 'Manter separado: o candidato segue em quarentena como pessoa diferente.', 'Toda decisão fica no histórico com motivo.'],
        dec: O3.reason(ctx), decActs: [O3.btn(ctx, 'Manter separado', decide(false), { size: 'btn--lg' }), O3.btn(ctx, 'Propor associação', decide(true), { kind: 'btn--primary', size: 'btn--lg', dis: blocked, why: why })],
        rcs: rc.rcs, hasRcs: rc.hasRcs
      };
    }
  });

  // ---------- OPS10.C · decisão por finalidade ----------
  REG.screen({
    page: 'operacao', key: 'ops10c', id: 'OPS10.C', title: 'Decisão por finalidade', mtitle: 'Decisão', nav: 'catalogo', back: 'OPS10', testIds: ['c_5547', 'c_5541'],
    normal: 'Aprovação sem foto', scens: [['bloqueio', 'Bloqueio de publicação'], ['retirada', 'Retirada solicitada'], ['parcial', 'Execução parcial']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn;
      var c0 = cand(ctx, 'c_5530');
      // execução parcial: candidato já aprovado (só na visualização)
      var c = scn === 'parcial' && c0.status === 'quarentena' ? Object.assign({}, c0, { status: 'aprovado' }) : c0;
      var sem = c.motivo === 'sem dados suficientes', susp = c.motivo === 'fonte suspensa';
      var pubBlocked = scn === 'bloqueio' || susp;
      var pub = pubBlocked ? false : (ui.pub !== undefined ? ui.pub : true);
      var idx = pub && (ui.idx !== undefined ? ui.idx : true);
      var idOk = !sem && !susp;
      var open = c.status === 'quarentena';
      var seg = function (val, key, dis, why) {
        return [['sim', 'Aprovar', true], ['nao', 'Não', false]].map(function (o) {
          var on = val === o[2];
          return { label: o[1], cls: 'seg__it' + (on ? ' is-on' : ''), on: String(on), go: function () { if (dis) { ctx.toast(why); return; } var x = {}; x[key] = o[2]; ctx.setUi(x); } };
        });
      };
      var rowsF = [
        { k: 'Identidade', isSeg: false, noSeg: true, val: idOk ? 'conferida' : 'pendente', valCls: idOk ? 'badge badge--ok' : 'badge badge--warn', pend: sem ? 'faltam ' + c.pendente : (susp ? 'fonte suspensa' : '—'), opts: [] },
        { k: 'Publicar', isSeg: !pubBlocked, noSeg: pubBlocked, val: 'bloqueado', valCls: 'badge badge--risk', pend: pubBlocked ? (susp ? 'fonte suspensa' : 'fonte pausou publicar em 26/10') : '—', opts: seg(pub, 'pub', false, '') },
        { k: 'Indexar', isSeg: pub, noSeg: !pub, val: 'depende de publicar', valCls: 'badge badge--plain', pend: pub ? '—' : 'só com publicação', opts: seg(idx, 'idx', !pub, 'Indexar exige publicar.') },
        { k: 'Foto', isSeg: false, noSeg: true, val: 'não', valCls: 'badge badge--risk', pend: 'licença da fonte', opts: [] }
      ];
      var slug = '/' + U.norm(c.name).replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '') + '-' + U.norm(c.city).replace(/[^a-z0-9]+/g, '-');
      var effects = [];
      if (pub) effects.push('Publica ' + slug + ' (página e busca interna da 99Coach).');
      else effects.push('Nada é publicado agora; a decisão de identidade fica registrada.');
      if (idx) effects.push('Entra no sitemap. Isso não confirma indexação no Google.');
      effects.push('Foto: monograma (sem licença de foto).');
      effects.push('Não habilita conta, venda nem contato: o perfil fica “não reivindicado”, sem selo de verificado.');
      var approveBlocked = !open || !idOk || scn === 'retirada' || (!pub && !idx);
      var why = !open ? 'Este candidato já tem decisão. Use o recibo para desfazer.' : (!idOk ? (susp ? 'Fonte suspensa: nada pode ser aprovado agora.' : 'Faltam ' + c.pendente + '. Devolva para complemento.') : (scn === 'retirada' ? 'Há pedido de retirada #P-44 aberto para este perfil.' : 'Escolha ao menos uma finalidade para aprovar.'));
      var approve = function () {
        O3.decide(ctx, {
          title: 'Aprovar escopo de ' + c.name + '?', ok: 'Aprovar escopo', scope: 'ops10c', action: 'Escopo aprovado (' + [pub ? 'publicar' : '', idx ? 'indexar' : ''].filter(Boolean).join(' + ') + ')', target: c.id + ' · ' + c.name,
          impact: effects, apply: function () { c.status = 'aprovado'; if (pub) DB.o3_catalogo.publicados += 1; }, rev: 'o3cand', data: { id: c.id, status: c.status, pub: pub ? 1 : 0 }
        });
      };
      var giveBack = function () {
        if (!open) { ctx.toast('Este candidato já tem decisão. Use o recibo para desfazer.'); return; }
        O3.decide(ctx, { title: 'Devolver ' + c.name + ' para complemento?', ok: 'Devolver', scope: 'ops10c', action: 'Devolvido para complemento', target: c.id + ' · ' + c.origem,
          impact: ['A fonte recebe o pedido de complemento (' + c.pendente + ').', 'Nada é publicado até nova revisão.'], apply: function () { c.status = 'devolvido'; }, rev: 'o3cand', data: { id: c.id, status: c.status } });
      };
      var alerts = [];
      if (c.status !== 'quarentena' && scn !== 'parcial') alerts.push(O3.alert('ok', 'Decisão registrada · ' + stLabel(c), 'Acompanhe a publicação etapa por etapa.', 'Ver estado por etapa', function () { GO('OPS11.A', { id: c.id === 'c_5512' ? 'marcos' : 'paula' }); }));
      if (scn === '' && !sem && !susp && c.status === 'quarentena') alerts.push(O3.alert('info', 'Aprovação sem foto', 'A licença da ' + c.origem + ' não cobre foto. O perfil sai com monograma; nenhuma foto é buscada em outro lugar.'));
      if (scn === 'bloqueio') alerts.push(O3.alert('warn', 'Bloqueio de publicação', 'A ' + c.origem + ' pausou o direito de publicar hoje. Você pode conferir a identidade, mas publicar e indexar ficam bloqueados.', 'Ver direitos da fonte', function () { GO('OPS08'); }));
      if (scn === 'retirada') alerts.push(O3.alert('risk', 'Retirada solicitada', 'Pedido #P-44 do titular pede para não publicar. Aprovação bloqueada até a revisão da retirada.', 'Revisar retirada', function () { GO('OPS11.B'); }));
      if (scn === 'parcial') alerts.push(O3.alert('warn', 'Execução parcial', 'Aprovado e publicado às 14:31, mas o índice interno não confirmou. Consulte a etapa antes de tentar de novo.', 'Ver estado por etapa', function () { GO('OPS11.A', { id: 'paula', scn: 'foraindice' }); }));
      if (sem) alerts.push(O3.alert('warn', 'Sem dados suficientes', 'Faltam ' + c.pendente + '. Devolva para a fonte completar; não aprove com campo vazio.'));
      if (susp) alerts.push(O3.alert('risk', 'Fonte suspensa', 'Academia Y está em revisão desde 20/10. Nada deste candidato pode ser aprovado agora.', 'Ver direitos da fonte', function () { GO('OPS08'); }));
      var rc = O3.rcPack(ctx, 'ops10c');
      return {
        hasEyebrow: false, eyebrow: '', h1: 'Decisão por finalidade', sub: c.name + ' · ' + c.origem,
        acts: [O3.btn(ctx, 'Devolver', giveBack, { dis: susp, why: 'Fonte suspensa: aguarde a revisão da fonte.' }), O3.btn(ctx, 'Aprovar escopo', approve, { kind: 'btn--primary', dis: approveBlocked, why: why })],
        ctx: O3.ctx('quarentena.decidir', 'Candidato ' + c.id), alerts: alerts, rowsF: rowsF, st: stLabel(c), stCls: stCls(c),
        prev: { ini: U.ini(c.name), name: c.name, city: c.city + ' · ' + c.mod, hint: 'Perfil “não reivindicado”, sem selo de verificado, com monograma.' },
        decTitle: 'Efeitos antes de confirmar', hasImpact: true, impact: effects,
        dec: O3.reason(ctx), decActs: [O3.btn(ctx, 'Devolver', giveBack, { size: 'btn--lg', dis: susp, why: 'Fonte suspensa: aguarde a revisão da fonte.' }), O3.btn(ctx, 'Aprovar escopo', approve, { kind: 'btn--primary', size: 'btn--lg', dis: approveBlocked, why: why })],
        rcs: rc.rcs, hasRcs: rc.hasRcs
      };
    }
  });
})();
