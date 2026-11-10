/* O6 · Operação financeira (FA06–FA10): dados fictícios e peças comuns.
   Todas as telas O6 devolvem O6.page(ctx, modelo); o template 60-o6.html é o mesmo esqueleto para cada tela
   (faixa de ambiente, cabeçalho, contexto, avisos e colunas de blocos: kv, tabela, lista, kpis, formulário, linha do tempo, nota, vazio).
   Nada movimenta dinheiro: é demonstração com dados sintéticos. */
(function () {
  var DB = window.DB, U = window.U;
  var O6 = window.O6 = {};
  O6.NOW = '26/10 · 14:02 BRT';
  O6.ME = 'Lia M.';
  O6.APPROVER = 'Bia F.';

  // ---------- dados ----------
  DB.seed('o6_amb', {
    atual: 'producao',
    ambientes: [
      { id: 'producao', name: 'Produção', pais: 'BR', metodos: 'cartão, Pix', webhook: 'ok · 10:42', conc: 'ok', saude: 'saudável', conta: 'acct_plat_BR', resp: 'Bia F.', prontidao: 'pronta', prova: '14:00' },
      { id: 'teste', name: 'Teste', pais: 'BR', metodos: 'cartão', webhook: 'ok · 13:45', conc: '—', saude: 'saudável', conta: 'acct_test_BR', resp: 'Bia F.', prontidao: 'teste incompleto · Pix não homologado', prova: '13:45' }
    ]
  });
  DB.seed('o6_contas', [
    { id: 'thiago', name: 'Thiago P.', full: 'Thiago Pires', acct: 'ac_08', pais: 'BR', vender: true, receber: true, enviar: true, reqs: [], consulta: '14:00', iniciou: true, restr: null, alunos: 12, caso: '' },
    { id: 'renata', name: 'Renata S.', full: 'Renata Siqueira', acct: 'ac_12', pais: 'BR', vender: true, receber: true, enviar: false, reqs: [{ id: 'q1', what: 'comprovante de conta bancária', prazo: '05/11', resp: 'Renata · no fluxo do provedor', desde: '20/10' }], consulta: '14:00', iniciou: true, restr: null, alunos: 7, caso: '' },
    { id: 'paulo', name: 'Paulo T.', full: 'Paulo Teixeira', acct: 'ac_40', pais: 'BR', vender: true, receber: true, enviar: true, reqs: [], consulta: '14:00', iniciou: true, restr: null, alunos: 4, caso: '#C-330 · 3 disputas em 30 dias (política: até 2)' },
    { id: 'rafael', name: 'Rafael L.', full: 'Rafael Lima', acct: 'ac_02', pais: 'BR', vender: true, receber: true, enviar: true, reqs: [], consulta: '14:00', iniciou: true, restr: null, alunos: 9, caso: '' },
    { id: 'marina', name: 'Marina D.', full: 'Marina Duarte', acct: 'ac_51', pais: 'BR', vender: false, receber: false, enviar: false, reqs: [], consulta: '—', iniciou: false, restr: null, alunos: 0, caso: '' }
  ]);
  // política de risco aprovada: quando exige segunda aprovação
  DB.seed('o6_risco', { versao: 'risco v2', desde: '01/10', por: 'Bia F.', limite: 100, texto: 'Reembolso acima de R$ 100 ou restrição de conta exige segunda aprovação' });
  // ações sensíveis (status: revisao · aprovacao · fila · executando · desconhecido · parcial · falhou · concluida)
  DB.seed('o6_acoes', [
    { id: 'a4733', ref: '#4733', kind: 'reembolso', tipo: 'Reembolso integral', valor: 89, alvo: 'Pedido PD-10211', conta: 'thiago', acct: 'ac_08', itens: 'Plano mensal · Thiago P.', dest: 'Aluno · cartão de origem', efeito: 'recebível de Thiago P. − R$ 84,55', motivo: 'lesão comprovada', cap: 'financeiro.reembolsar', status: 'revisao', exige2: false, criado: '26/10 · 13:55', versao: 'calculado 13:55', solicitante: 'Lia M.', aprovador: '', recibo: '', hist: [['Solicitado por Lia M.', '26/10 · 13:55 BRT']] },
    { id: 'rf77', ref: 'RF-77', kind: 'reembolso', tipo: 'Reembolso parcial', valor: 120, alvo: 'Pedido PD-10390', conta: '', acct: 'ac_31', itens: 'Programa 12 semanas', dest: 'Ana C. · cartão de origem', efeito: 'recebível − R$ 105,00; acesso por outra compra continua', motivo: '', cap: 'financeiro.reembolsar', status: 'revisao', exige2: true, criado: '26/10 · 14:38', versao: 'calculado 14:38', solicitante: 'Lia M.', aprovador: '', recibo: '', hist: [['Rascunho criado por Lia M.', '26/10 · 14:38 BRT']] },
    { id: 'rf76', ref: 'RF-76', kind: 'reembolso', tipo: 'Reembolso integral', valor: 64.9, alvo: 'Pedido PD-10377', conta: 'rafael', acct: 'ac_02', itens: 'Sessão presencial · Rafael L.', dest: 'Aluno · Pix de origem', efeito: 'recebível de Rafael L. − R$ 61,65', motivo: 'sessão cancelada pelo treinador', cap: 'financeiro.reembolsar', status: 'executando', exige2: false, criado: '26/10 · 14:31', versao: 'calculado 14:31', solicitante: 'Bia F.', aprovador: '', recibo: 'AU-1040', hist: [['Solicitado por Bia F.', '26/10 · 14:31 BRT'], ['Aceito pelo processador', '26/10 · 14:40 BRT']] }
  ]);
  DB.seed('o6_recibos', [
    { id: 'AU-1040', acao: 'Reembolso RF-76 enviado à fila', alvo: 'PD-10377 · ac_02', motivo: 'sessão cancelada pelo treinador', por: 'Bia F.', quando: '26/10 · 14:40 BRT', amb: 'Produção', efeito: 'R$ 64,90 · aguardando processador' },
    { id: 'AU-1039', acao: 'Reembolso #4720 executado', alvo: 'PD-10102 · ac_12', motivo: 'cobrança duplicada', por: 'Bia F.', quando: '25/10 · 17:20 BRT', amb: 'Produção', efeito: 'R$ 59,90 devolvido ao cartão de origem' }
  ]);

  // ---------- formatos ----------
  function fix2(n) { return (Math.abs(Number(n) || 0)).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  O6.brl = function (n) { return (Number(n) < 0 ? '− ' : '') + 'R$ ' + fix2(n); };
  O6.usd = function (n) { return (Number(n) < 0 ? '− ' : '') + 'US$ ' + fix2(n); };
  O6.int = function (n) { return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); };
  O6.num = function (s) { var n = parseFloat(String(s || '').replace(/\./g, '').replace(',', '.').replace(/[^\d.\-]/g, '')); return isNaN(n) ? 0 : n; };
  O6.stamp = function () { return '26/10 · ' + U.now() + ' BRT'; };
  O6.top = function () { try { if (window.scrollTo) window.scrollTo(0, 0); } catch (_) {} };

  // ---------- ambiente ----------
  O6.envOf = function (id) { var a = DB.o6_amb, k = id || a.atual; return a.ambientes.find(function (x) { return x.id === k; }) || a.ambientes[0]; };
  O6.env = function (id) {
    var e = O6.envOf(id), prod = e.id === 'producao';
    return { id: e.id, name: e.name, label: prod ? 'Produção · dados sintéticos' : 'Teste · nada aqui afeta Produção', sub: prod ? 'Demonstração: nenhum dinheiro real é movimentado.' : 'Operações de Teste não são copiadas para Produção.', ic: prod ? 'ic ic--sm i-shield' : 'ic ic--sm i-wand' };
  };
  O6.ctx = function (cap, alvo, upd, envId) { return [['Ambiente', O6.env(envId).name + ' · dados sintéticos'], ['Capacidade', cap], ['Alvo', alvo], ['Atualizado', upd || O6.NOW]]; };

  // ---------- recibos auditáveis ----------
  O6.nextId = function () { var m = 1040; DB.o6_recibos.forEach(function (r) { var n = +String(r.id).slice(3); if (n > m) m = n; }); return 'AU-' + (m + 1); };
  O6.receipt = function (o) {
    var r = { id: O6.nextId(), acao: o.acao, alvo: o.alvo || '', motivo: o.motivo || '', por: O6.ME, quando: O6.stamp(), amb: O6.env().name, efeito: o.efeito || '' };
    DB.o6_recibos.unshift(r);
    return r;
  };
  O6.receiptRows = function (r) { return [['Recibo', r.id], ['Ação', r.acao], ['Alvo', r.alvo], ['Motivo', r.motivo], ['Efeito', r.efeito], ['Por', r.por + ' · ' + r.amb], ['Quando', r.quando]]; };
  O6.receiptList = function (list, go) {
    return list.map(function (r) { return { title: r.id + ' · ' + r.acao, sub: r.quando + ' · ' + r.por + ' · motivo: ' + (r.motivo || '—'), ic: 'file', go: go ? function () { go(r); } : null }; });
  };

  // ---------- ações sensíveis ----------
  O6.act = function (id) { return DB.find('o6_acoes', id); };
  O6.needs2 = function (a) { return !!a.exige2 || (a.kind === 'reembolso' && a.valor > DB.o6_risco.limite) || a.kind === 'restricao'; };
  O6.STATUS = { revisao: ['aguardando confirmação', 'plain'], aprovacao: ['aguardando 2ª aprovação', 'warn'], fila: ['na fila', 'info'], executando: ['em andamento', 'info'], desconhecido: ['resultado desconhecido', 'warn'], parcial: ['parcial', 'warn'], falhou: ['falhou · confirmado', 'risk'], concluida: ['concluída', 'ok'] };
  O6.valor = function (a) { return a.valor == null ? 'não se aplica' : O6.brl(a.valor) + ' BRL'; };
  // aplica o efeito de domínio quando a execução termina (restrição ou retomada de conta)
  O6.applyEffect = function (a) {
    var c = DB.find('o6_contas', a.conta);
    if (!c) return;
    if (a.kind === 'restricao') c.restr = { escopo: a.escopo.slice(), dur: a.dur, motivo: a.motivo, ref: a.ref, desde: O6.stamp() };
    if (a.kind === 'retomada') c.restr = null;
  };
  // envia para a fila (depois da confirmação e, se a política pedir, da segunda aprovação)
  O6.submit = function (a, motivo) {
    a.motivo = motivo;
    var rec;
    if (O6.needs2(a) && !a.aprovador) {
      a.status = 'aprovacao';
      a.hist.push(['Confirmado por ' + O6.ME + ' · aguarda 2ª aprovação (' + DB.o6_risco.versao + ')', O6.stamp()]);
      rec = O6.receipt({ acao: a.tipo + ' ' + a.ref + ' confirmado · aguarda 2ª aprovação', alvo: a.alvo + ' · ' + a.acct, motivo: motivo, efeito: 'nada executado ainda' });
    } else {
      a.status = 'fila';
      a.hist.push(['Confirmado e enviado à fila por ' + O6.ME, O6.stamp()]);
      rec = O6.receipt({ acao: a.tipo + ' ' + a.ref + ' enviado à fila', alvo: a.alvo + ' · ' + a.acct, motivo: motivo, efeito: (a.valor == null ? a.efeito : O6.brl(a.valor) + ' · recibo provisório') });
    }
    a.recibo = rec.id;
    return rec;
  };
  O6.approve = function (a) {
    a.aprovador = O6.APPROVER; a.status = 'fila';
    a.hist.push(['2ª aprovação registrada por ' + O6.APPROVER, O6.stamp()]);
    var rec = { id: O6.nextId(), acao: a.tipo + ' ' + a.ref + ' aprovado (2ª aprovação)', alvo: a.alvo + ' · ' + a.acct, motivo: a.motivo, por: O6.APPROVER, quando: O6.stamp(), amb: O6.env().name, efeito: 'enviado à fila' };
    DB.o6_recibos.unshift(rec); a.recibo = rec.id;
    return rec;
  };
  O6.advance = function (a) {
    if (a.status === 'fila') { a.status = 'executando'; a.hist.push(['Aceito pelo processador', O6.stamp()]); return; }
    if (a.status === 'executando' || a.status === 'parcial') {
      a.status = 'concluida'; a.hist.push(['Concluído · confirmado pelo processador', O6.stamp()]);
      O6.applyEffect(a);
      var rec = O6.receipt({ acao: a.tipo + ' ' + a.ref + ' concluído', alvo: a.alvo + ' · ' + a.acct, motivo: a.motivo, efeito: a.valor == null ? a.efeito : O6.brl(a.valor) + ' devolvido · ' + a.efeito });
      a.recibo = rec.id;
    }
  };

  // ---------- campos de formulário (estado de interface em ctx.ui) ----------
  O6.uiv = function (ctx, k, d) { return ctx.ui[k] !== undefined && ctx.ui[k] !== null ? ctx.ui[k] : d; };
  O6.setter = function (ctx, k) { return function (e) { var s = {}; s[k] = U.val(e); ctx.setUi(s); }; };
  O6.text = function (ctx, k, label, o) {
    o = o || {};
    return { kind: o.area ? 'area' : 'text', id: 'o6-' + k, label: label, value: String(O6.uiv(ctx, k, o.def == null ? '' : o.def)), ph: o.ph || '', mode: o.mode || 'text', help: o.help || '', err: o.err || '', fix: o.fix || '', input: O6.setter(ctx, k) };
  };
  O6.motivo = function (ctx, k, o) {
    o = o || {};
    var val = String(O6.uiv(ctx, k, o.def || ''));
    return O6.text(ctx, k, o.label || 'Motivo (vai para o recibo de auditoria)', { area: true, def: o.def || '', ph: o.ph || 'Ex.: caso, decisão ou evidência que justifica a ação', help: o.help || 'Obrigatório. Quem, quando e por quê ficam registrados.', err: ctx.ui.tried && !val.trim() ? 'Escreva o motivo para continuar.' : '' });
  };
  O6.chips = function (ctx, k, label, opts, def, o) {
    o = o || {};
    var cur = O6.uiv(ctx, k, def);
    return { kind: 'chips', label: label, help: o.help || '', err: o.err || '', opts: opts.map(function (op) {
      var id = Array.isArray(op) ? op[0] : op, lb = Array.isArray(op) ? op[1] : op;
      var on = o.multi ? cur.indexOf(id) >= 0 : cur === id;
      return { label: lb, on: on, dis: !!(o.lock && o.lock.indexOf(id) >= 0), pick: function () {
        var s = {};
        if (o.multi) s[k] = on ? cur.filter(function (x) { return x !== id; }) : cur.concat([id]); else s[k] = id;
        ctx.setUi(s);
      } };
    }) };
  };
  O6.check = function (ctx, k, label, def, o) {
    o = o || {};
    var on = !!O6.uiv(ctx, k, def);
    return { kind: 'check', label: label, on: on, help: o.help || '', err: o.err || '', toggle: function () { var s = {}; s[k] = !on; ctx.setUi(s); } };
  };
  O6.locked = function (label, value, help) { return { kind: 'locked', label: label, value: value, help: help || '' }; };

  // lista → detalhe no celular: sel é o item aberto; mSel diz se o celular mostra o detalhe
  O6.md = function (ctx, def) {
    var sel = ctx.ui.sel || ctx.id || def;
    return { sel: sel, mSel: !!ctx.ui.sel || (!!ctx.id && !ctx.ui.mList), pick: function (id) { return function () { ctx.setUi({ sel: id, mList: false }); O6.top(); }; }, back: function () { ctx.setUi({ sel: null, mList: true }); } };
  };

  // ---------- normalização do modelo para o template ----------
  var KIND = { primary: 'btn btn--primary', outline: 'btn btn--outline', ghost: 'btn btn--ghost', brand: 'btn btn--brand', danger: 'btn btn--outline mod-danger' };
  var NOOP = function () {};
  O6.btn = function (b) {
    return { label: b.label, cls: (KIND[b.kind || 'outline'] || KIND.outline) + ' ' + (b.size === 'lg' ? 'btn--lg' : 'btn--sm') + (b.cls ? ' ' + b.cls : ''), go: b.go || NOOP, dis: !!b.dis, hasIc: !!b.ic, ic: b.ic ? 'ic ic--sm i-' + b.ic : '' };
  };
  var TONE_IC = { info: 'info', warn: 'alert', risk: 'alert', ok: 'check' };
  O6.alert = function (a) {
    return { cls: 'alert alert--' + (a.tone || 'info') + ' o6-alert', role: a.tone === 'risk' ? 'alert' : 'status', ic: 'ic ic--sm i-' + (a.ic || TONE_IC[a.tone || 'info']), hasTitle: !!a.title, title: a.title || '', text: a.text || '', btns: (a.btns || []).filter(Boolean).map(O6.btn), hasBtns: !!(a.btns && a.btns.filter(Boolean).length) };
  };
  function row(r) {
    var b = r.badge || null, go = r.go || null;
    return {
      title: r.title || '', sub: r.sub || '', ic: 'ic ic--xs i-' + (r.ic || 'file'), hasBadge: !!b, badge: b ? b[0] : '', badgeCls: 'badge badge--' + (b ? b[1] || 'plain' : 'plain'),
      hasGo: !!go, noGo: !go, go: go || NOOP, cur: r.on ? 'true' : 'false', cls: 'lrow o6-row' + (r.on ? ' is-on' : '') + (go ? '' : ' is-static'),
      cells: (r.cells || []).map(function (c) { var o = typeof c === 'object' && c ? c : { t: c }; return { t: String(o.t == null ? '—' : o.t), cls: o.tone ? 'badge badge--' + o.tone : (o.b ? 'o6-strong' : '') }; }),
      trCls: r.on ? 'is-on' : '', goLabel: r.goLabel || 'Abrir', goAria: (r.goLabel || 'Abrir') + ' ' + (r.title || '')
    };
  }
  function field(f) {
    var k = f.kind;
    return {
      isText: k === 'text', isArea: k === 'area', isChips: k === 'chips', isCheck: k === 'check', isLocked: k === 'locked',
      id: f.id || 'o6-f', label: f.label || '', value: f.value == null ? '' : String(f.value), ph: f.ph || '', mode: f.mode || 'text',
      inCls: 'input' + (f.err ? ' is-err' : ''), inv: f.err ? 'true' : 'false', hasFix: !!f.fix, fix: f.fix || '',
      hasHelp: !!f.help, help: f.help || '', hasErr: !!f.err, err: f.err || '', input: f.input || NOOP,
      opts: (f.opts || []).map(function (o) { return { label: o.label, cls: 'chip' + (o.on ? ' is-on' : ''), on: o.on ? 'true' : 'false', pick: o.pick || NOOP, dis: !!o.dis }; }),
      onStr: f.on ? 'true' : 'false', checkCls: 'check' + (f.on ? ' is-on' : ''), toggle: f.toggle || NOOP
    };
  }
  var ST_IC = { done: 'check', now: 'clock', todo: 'more', fail: 'x', warn: 'alert' };
  O6.block = function (b) {
    var t = b.t || 'note', note = t === 'note', bare = b.bare != null ? b.bare : note;
    var isTable = t === 'table', isList = t === 'list';
    return {
      cls: U.cls(bare ? 'o6-blk' : 'card o6-card', b.role === 'master' && 'o6-master', b.role === 'detail' && 'o6-detail', b.cls),
      aria: b.title || b.aria || 'Seção',
      hasHead: !!b.title, title: b.title || '', hasSub: !!b.sub, sub: b.sub || '',
      hasBadge: !!b.badge, badge: b.badge ? b.badge[0] : '', badgeCls: 'badge badge--' + (b.badge ? b.badge[1] || 'plain' : 'plain'),
      hasSeg: !!b.seg, segLabel: b.segLabel || 'Alternar visão', opts: (b.seg || []).map(function (o) { return { label: o.label, cls: 'seg__it' + (o.on ? ' is-on' : ''), on: o.on ? 'true' : 'false', pick: o.pick || NOOP }; }),
      isNote: note, noteCls: 'alert alert--' + (b.tone || 'info') + ' o6-alert', noteIc: 'ic ic--sm i-' + (b.ic || TONE_IC[b.tone || 'info']), hasNTitle: !!b.nTitle, nTitle: b.nTitle || '', nText: b.text || '',
      isEmp: t === 'emp', empIc: 'ic i-' + (b.ic || 'info'), eTitle: b.eTitle || '', eText: b.text || '',
      isKpis: t === 'kpis', items: t === 'kpis' ? (b.items || []).map(function (k) { return { l: k.l, n: k.n, src: k.src || '' }; }) : (b.items || []).map(function (s) { return { t: s.t, sub: s.sub || '', cls: 'o6-tl__i is-' + (s.st || 'todo'), ic: 'ic ic--xs i-' + (ST_IC[s.st || 'todo'] || 'more') }; }),
      isKv: t === 'kv',
      kv: t === 'kv' ? (b.rows || []).filter(Boolean).map(function (r) { var o = Array.isArray(r) ? { k: r[0], v: r[1], src: r[2], tone: r[3] } : r; return { k: o.k, v: String(o.v == null || o.v === '' ? '—' : o.v), hasSrc: !!o.src, src: o.src || '', cls: o.tone ? 'badge badge--' + o.tone : '' }; }) : [],
      isTable: isTable, cols: b.cols || [], hasGo: isTable && (b.rows || []).some(function (r) { return !!r.go; }),
      hasRows: isTable || isList, listCls: isTable ? 'mod-list o6-ml' : 'mod-list o6-list',
      rows: isTable || isList ? (b.rows || []).filter(Boolean).map(row) : [],
      isEmptyRows: (isTable || isList) && !(b.rows || []).filter(Boolean).length, emptyText: b.emptyText || 'Nada encontrado com estes filtros.',
      isForm: t === 'form', fields: (b.fields || []).filter(Boolean).map(field),
      isSteps: t === 'steps',
      hasFoot: !!b.foot, foot: b.foot || '',
      hasBtns: !!(b.btns && b.btns.filter(Boolean).length), btns: (b.btns || []).filter(Boolean).map(O6.btn)
    };
  };
  O6.page = function (ctx, m) {
    var env = O6.env(m.env);
    var main = (m.main || []).filter(Boolean).map(O6.block), rail = (m.rail || []).filter(Boolean).map(O6.block);
    var cols = [{ cls: 'mod-col o6-c1', blocks: main }];
    if (rail.length) cols.push({ cls: 'mod-col o6-c2', blocks: rail });
    var ctxRows = (m.ctx || []).map(function (c) { return { k: c[0], v: c[1] }; });
    var acts = (m.acts || []).filter(Boolean).map(O6.btn);
    var alerts = (m.alerts || []).filter(Boolean).map(O6.alert);
    return {
      envCls: 'o6-env o6-env--' + env.id + (m.envFixed ? ' is-fixed' : ''), envIc: env.ic, envLabel: env.label, envSub: env.sub,
      eyebrow: m.eyebrow || 'Dinheiro · Financeiro', title: m.title, hasSub: !!m.sub, sub: m.sub || '',
      acts: acts, hasActs: acts.length > 0,
      ctx: ctxRows, hasCtx: ctxRows.length > 0,
      alerts: alerts,
      cols: cols, gridCls: 'o6-grid' + (rail.length ? ' o6-grid--rail' : '') + (m.sel ? ' is-sel' : ''),
      hasMBack: !!m.mBack, mBackLabel: m.mBackLabel || 'Voltar à lista', mBack: m.mBack || NOOP
    };
  };
  // linha de atalho para subtelas
  O6.link = function (title, sub, ic, id, params) { return { title: title, sub: sub, ic: ic, go: function () { GO(id, params || {}); } }; };
})();
