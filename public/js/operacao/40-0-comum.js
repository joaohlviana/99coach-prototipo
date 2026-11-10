/* O4 · Operação (Lia Moura) · comum às telas OPS15–OPS18 e subtelas.
   Monta o "modelo de tela" usado por todos os templates 40-*.html:
   cabeçalho, abas do grupo, barra de contexto, avisos, decisão sensível (motivo + impacto + recibo),
   lista → detalhe (no celular) e cartões compostos por "partes" (kv, tabela, barras, interruptores...).
   Só é usado dentro de vals(), então a ordem de carga dos arquivos não importa. */
(function () {
  'use strict';
  var O4 = window.O4 = {};
  O4.TS = '26/10 · 14:02 BRT';
  O4.ME = 'Lia Moura';
  O4.AMB = 'Produção · dados sintéticos';

  // recibos auditáveis de decisões (compartilhados pelas quatro composições)
  DB.seed('o4_recibos', [
    { id: 'RC-2031', grp: 'canais', acao: 'Limite diário de push mantido', alvo: 'Push · lembretes', motivo: 'Revisão mensal de limites, sem mudança de volume', por: 'Lia Moura', at: '19/10 · 10:12', estado: 'registrado' },
    { id: 'RC-2038', grp: 'coleta', acao: 'Revogações de consentimento propagadas', alvo: 'analytics-a · BR', motivo: 'Rotina automática de revogação', por: 'Sistema', at: '26/10 · 13:41', estado: 'confirmado' },
    { id: 'RC-2040', grp: 'prospeccao', acao: 'Execução EX-3 pausada', alvo: 'EX-3 · Campinas · corrida', motivo: 'Fornecedor respondeu 429 (limite de requisições)', por: 'Sistema', at: '26/10 · 13:30', estado: 'confirmado' },
    { id: 'RC-2042', grp: 'instagram', acao: 'Incidente INC-11 aberto', alvo: 'Mensagens · @99coach.oficial', motivo: 'Fornecedor responde 429 desde 10:02', por: 'Lia Moura', at: '26/10 · 10:20', estado: 'registrado' }
  ]);

  // ---------- recibos ----------
  O4.addRc = function (o) {
    var max = 2042;
    DB.o4_recibos.forEach(function (r) { var n = parseInt(String(r.id).replace('RC-', ''), 10); if (n > max) max = n; });
    var rc = { id: 'RC-' + (max + 1), grp: o.grp, acao: o.acao, alvo: o.alvo || '', motivo: o.motivo || '', por: O4.ME, at: '26/10 · ' + U.now(), estado: o.estado || 'registrado' };
    DB.o4_recibos.unshift(rc);
    return rc;
  };
  O4.rcView = function (ctx) {
    var r = ctx.ui.rc ? DB.find('o4_recibos', ctx.ui.rc) : null;
    return { has: !!r, id: r ? r.id : '', acao: r ? r.acao : '', alvo: r ? r.alvo : '', motivo: r ? r.motivo : '', por: r ? r.por : '', at: r ? r.at : '', estado: r ? r.estado : '',
      close: function () { ctx.setUi({ rc: '' }); } };
  };
  // cartão "Recibos" do grupo
  O4.rcCard = function (grp, title) {
    var list = DB.o4_recibos.filter(function (r) { return r.grp === grp; }).slice(0, 4);
    if (!list.length) return O4.card({ title: title || 'Recibos auditáveis', parts: [O4.P.note('Nenhuma decisão registrada ainda.')] });
    return O4.card({ title: title || 'Recibos auditáveis', sub: 'Decisões com motivo, autor e horário', parts: [O4.P.rcs(list)] });
  };

  // ---------- partes de cartão ----------
  var TYPES = ['kv', 'table', 'alert', 'kpis', 'steps', 'bars', 'switches', 'checks', 'seg', 'field', 'chips', 'preview', 'events', 'btns', 'note', 'links', 'rcs', 'ticks'];
  function part(t, o) { var p = {}; TYPES.forEach(function (k) { p[k] = k === t; }); return Object.assign(p, o); }
  function badge(c) { return 'badge ' + (c ? 'badge--' + c : 'badge--plain'); }
  function btn(b) {
    return { label: b.label, cls: 'btn ' + (b.cls || 'btn--outline btn--sm'), fn: b.fn || function () {}, dis: !!b.dis, hasIc: !!b.ic, ic: b.ic ? 'ic ic--sm i-' + b.ic : '' };
  }
  O4.btn = btn;
  var P = O4.P = {
    // rows: [rótulo, valor, tom do selo opcional ('ok'|'warn'|'risk'|'info'|'plain'|'ink')]
    kv: function (rows) { return part('kv', { rows: rows.filter(Boolean).map(function (r) { return { k: r[0], v: String(r[1]), hasBadge: !!r[2], plain: !r[2], bcls: badge(r[2]) }; }) }); },
    // rows: { cells: [texto | [texto, tom]], title, meta, badge, tone, go, on }
    table: function (cols, rows, o) {
      o = o || {};
      var hasGo = rows.some(function (r) { return !!r.go; });
      return part('table', { cols: hasGo ? cols.concat(['']) : cols, caption: o.caption || '', tblCls: 'o4-tbl' + (o.always ? ' o4-tbl--always' : ''), listCls: 'o4-plist' + (o.always ? ' o4-plist--never' : ''),
        rows: rows.map(function (r) {
          return {
            cls: r.on ? 'is-on' : '', hasGo: !!r.go, noGo: hasGo && !r.go, go: r.go || function () {}, goLabel: r.goLabel || 'Abrir', aria: r.title || '',
            cells: r.cells.map(function (c) { var arr = Array.isArray(c); return { t: String(arr ? c[0] : c), isBadge: arr, plain: !arr, bcls: badge(arr ? c[1] : '') }; })
          };
        }),
        items: rows.map(function (r) {
          return { title: r.title || String(Array.isArray(r.cells[0]) ? r.cells[0][0] : r.cells[0]), meta: r.meta || '', hasMeta: !!r.meta, badge: r.badge || '', hasBadge: !!r.badge, bcls: badge(r.tone),
            cls: 'v4-reset o4-prow' + (r.on ? ' is-on' : ''), cur: r.on ? 'true' : 'false', go: r.go || function () {}, isBtn: !!r.go, isRow: !r.go };
        })
      });
    },
    // alerta com ações opcionais
    alert: function (tone, title, text, acts) {
      var ic = { ok: 'check', warn: 'alert', risk: 'alert', info: 'info', clock: 'clock', ink: 'shield' }[tone] || 'info';
      var cls = tone === 'clock' ? 'warn' : (tone === 'ink' ? 'info' : tone);
      var a = (acts || []).filter(Boolean).map(btn);
      return part('alert', { cls: 'alert alert--' + cls + ' o4-alert', ic: 'ic ic--sm i-' + ic, title: title, text: text, acts: a, hasActs: a.length > 0, role: tone === 'risk' ? 'alert' : 'status' });
    },
    // items: [rótulo, número, fonte/definição]
    kpis: function (items) { return part('kpis', { items: items.map(function (k) { return { l: k[0], n: String(k[1]), src: k[2] || '', hasSrc: !!k[2] }; }) }); },
    // items: [ícone, etapa, horário, selo, tom]
    steps: function (items) { return part('steps', { items: items.map(function (s) { return { ic: 'ic ic--xs i-' + s[0], label: s[1], time: s[2], badge: s[3], bcls: badge(s[4]) }; }) }); },
    // items: [rótulo, % (0–100), nota/fonte]
    bars: function (items) {
      return part('bars', { items: items.map(function (b) { var pc = Math.max(0, Math.min(100, Math.round(b[1]))); return { label: b[0], val: pc + '%', w: 'width: ' + pc + '%', note: b[2] || '', hasNote: !!b[2], cls: 'o4-meter__f' + (pc >= 90 ? ' is-risk' : (pc >= 60 ? ' is-warn' : '')) }; }) });
    },
    // items: { title, sub, on, toggle, dis, badge, tone }
    switches: function (items) {
      return part('switches', { items: items.map(function (s) {
        return { title: s.title, sub: s.sub || '', cls: 'v4-reset switch o4-sw' + (s.on ? ' is-on' : ''), on: String(!!s.on), toggle: s.toggle || function () {}, dis: !!s.dis, hasBadge: !!s.badge, badge: s.badge || '', bcls: badge(s.tone) };
      }) });
    },
    // items: { label, sub, st: 'ok'|'wait'|'risk', badge, go, goLabel }
    checks: function (items) {
      return part('checks', { items: items.map(function (c) {
        var tone = c.st === 'ok' ? 'ok' : (c.st === 'risk' ? 'risk' : 'warn');
        return { label: c.label, sub: c.sub || '', hasSub: !!c.sub, cls: 'onb-check__i o4-ck' + (c.st === 'ok' ? '' : ' is-wait'), mark: 'check' + (c.st === 'ok' ? ' is-on' : ''), badge: c.badge || (c.st === 'ok' ? 'ok' : (c.st === 'risk' ? 'bloqueado' : 'pendente')), bcls: badge(tone), hasGo: !!c.go, go: c.go || function () {}, goLabel: c.goLabel || 'Abrir' };
      }) });
    },
    // items: [rótulo, ligado, ação]
    seg: function (label, items) { return part('seg', { label: label, hasLabel: !!label, items: items.map(function (s) { return { label: s[0], cls: 'v4-reset seg__it' + (s[1] ? ' is-on' : ''), on: String(!!s[1]), pick: s[2] }; }) }); },
    // { id, label, help, value, set, area, err, req, mode }
    field: function (f) {
      return part('field', { id: f.id, label: f.label, req: !!f.req, help: f.help || '', hasHelp: !!f.help, value: f.value == null ? '' : String(f.value), set: f.set, isArea: !!f.area, isInput: !f.area, err: f.err || '', hasErr: !!f.err, inCls: 'input' + (f.area ? ' input--area' : '') + (f.err ? ' is-err' : ''), mode: f.mode || 'text', ph: f.ph || '' });
    },
    // items: [rótulo, ligado, ação, desabilitado]
    chips: function (label, items) { return part('chips', { label: label, hasLabel: !!label, items: items.map(function (c) { return { label: c[0], cls: 'chip' + (c[1] ? ' is-on' : ''), on: String(!!c[1]), toggle: c[2] || function () {}, dis: !!c[3] }; }) }); },
    // prévia de mensagem
    preview: function (label, text, note) { return part('preview', { label: label, text: text, pnote: note || '', hasNote: !!note }); },
    // items: { name, at, fields: [[campo, valor, removido]] }
    events: function (items) {
      return part('events', { items: items.map(function (e) { return { name: e.name, at: e.at || '', fields: e.fields.map(function (f) { return { k: f[0], v: f[1], cls: 'o4-ev__f' + (f[2] ? ' is-cut' : '') }; }) }; }) });
    },
    btns: function (items) { return part('btns', { items: items.filter(Boolean).map(btn) }); },
    note: function (text, small) { return part('note', { text: text, cls: 'o4-note' + (small ? ' mod-small mod-muted' : '') }); },
    // links para subtelas: [título, descrição, ícone, ação]
    links: function (items) { return part('links', { items: items.map(function (l) { return { title: l[0], sub: l[1], ic: 'ic ic--sm i-' + (l[2] || 'chev-r'), go: l[3] }; }) }); },
    rcs: function (list) { return part('rcs', { items: list.map(function (r) { return { id: r.id, acao: r.acao, meta: r.at + ' · ' + r.por + ' · ' + r.estado, motivo: 'Motivo: ' + r.motivo, alvo: r.alvo }; }) }); },
    // confirmações de revisão: [texto, marcado, alternar]
    ticks: function (items) { return part('ticks', { items: items.map(function (t) { return { label: t[0], on: String(!!t[1]), cls: 'check' + (t[1] ? ' is-on' : ''), toggle: t[2] }; }) }); }
  };

  // ---------- cartões ----------
  O4.card = function (o) {
    return { title: o.title || '', hasHead: !!o.title, sub: o.sub || '', hasSub: !!o.sub, tag: o.tag || '', hasTag: !!o.tag, tagCls: badge(o.tone), cls: 'card o4-card' + (o.cls ? ' ' + o.cls : ''), aria: o.title || 'Seção', parts: (o.parts || []).filter(Boolean) };
  };

  // ---------- barra de contexto ----------
  O4.bar = function (cap, alvo, ts) { return [{ k: 'Ambiente', v: O4.AMB }, { k: 'Capacidade', v: cap }, { k: 'Alvo', v: alvo }, { k: 'Atualizado', v: ts || O4.TS }]; };

  // ---------- abas do grupo (composições) ----------
  O4.GROUP = [['Canais', 'OPS15'], ['Analytics e tags', 'OPS16'], ['Prospecção', 'OPS17'], ['Instagram', 'OPS18']];
  O4.tabs = function (cur) { return O4.GROUP.map(function (g) { var on = g[1] === cur; return { label: g[0], cls: 'v4-reset utab o4-tab' + (on ? ' is-on' : ''), cur: on ? 'page' : 'false', go: function () { GO(g[1]); } }; }); };

  // ---------- consulta antes de repetir ----------
  // ctx.ui.q = número de consultas feitas nesta tela; O4.ask(ctx, msg) registra e avisa
  O4.consult = function (ctx, msg, extra) { return function () { ctx.setUi(Object.assign({ q: (ctx.ui.q || 0) + 1, qAt: U.now() }, extra || {})); ctx.toast('Consultado às ' + U.now() + '. ' + msg); }; };

  O4.scroll = function () { try { setTimeout(function () { var el = document.getElementById('o4-dec'); if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 30); } catch (_) {} };

  // ---------- decisão sensível: motivo + impacto + recibo ----------
  // defs: { chave: { title, what, impact: [], ok, danger, acao, alvo, estado, minLen, apply(rc) → ui extra } }
  O4.dec = function (ctx, grp, defs) {
    var ui = ctx.ui, key = ui.dec || '', d = key ? defs[key] : null;
    var motivo = ui.motivo || '';
    var open = function (k) { return function () { ctx.setUi({ dec: k, motivo: '', decErr: false, rc: '' }); O4.scroll(); }; };
    var cancel = function () { ctx.setUi({ dec: '', motivo: '', decErr: false }); };
    var out = { open: open, on: !!d, title: '', what: '', hasWhat: false, impact: [], motivo: motivo, ok: '', okCls: 'btn btn--primary btn--lg', hasErr: !!ui.decErr, inCls: 'input input--area' + (ui.decErr ? ' is-err' : ''), cancel: cancel,
      setMotivo: function (e) { ctx.setUi({ motivo: U.val(e), decErr: false }); }, confirm: function () {} };
    if (!d) return out;
    var impact = typeof d.impact === 'function' ? d.impact() : d.impact;
    out.title = d.title; out.what = d.what || ''; out.hasWhat = !!d.what; out.impact = impact; out.ok = d.ok || 'Confirmar';
    out.okCls = 'btn ' + (d.danger ? 'btn--outline mod-danger' : 'btn--primary') + ' btn--lg';
    out.confirm = function () {
      var m = String(ctx.ui.motivo || '').trim();
      if (m.length < (d.minLen || 10)) { ctx.setUi({ decErr: true }); return; }
      ctx.ask({
        title: d.title, text: 'Confira o impacto. Ao confirmar, fica um recibo auditável com seu nome, horário e motivo.', lines: impact.concat(['Motivo: ' + m]), ok: d.ok || 'Confirmar', danger: !!d.danger,
        onOk: function () {
          var rc = O4.addRc({ grp: grp, acao: d.acao || d.title, alvo: d.alvo || '', motivo: m, estado: d.estado || 'registrado' });
          var extra = d.apply ? (d.apply(rc) || {}) : {};
          ctx.setUi(Object.assign({ dec: '', motivo: '', decErr: false, rc: rc.id }, extra));
        }
      });
    };
    return out;
  };

  // ---------- lista → detalhe ----------
  // escolhe o item selecionado (ui.sel, depois o id da rota, depois o primeiro); "picked" mostra o detalhe no celular
  O4.pick = function (ctx, list) {
    var u = ctx.ui.sel || '', listMode = u === '__list';
    var sel = (!listMode && u) || ctx.id || '';
    var it = list.find(function (x) { return x.id === sel; }) || list[0] || null;
    return { it: it, picked: !listMode && !!(u || (ctx.id && it && it.id === ctx.id)), sel: function (id) { return function () { ctx.setUi({ sel: id, dec: '', motivo: '', decErr: false }); }; } };
  };

  // ---------- modelo final da tela ----------
  // o: { title, sub, acts, comp (ID da composição p/ abas), cap, alvo, ts, alerts, main, side, md: {picked, label}, dec, rc }
  O4.view = function (ctx, o) {
    var acts = (o.acts || []).filter(Boolean).map(btn);
    var alerts = (o.alerts || []).filter(Boolean);
    var side = (o.side || []).filter(Boolean), main = (o.main || []).filter(Boolean);
    var md = o.md || null;
    var dec = o.dec || O4.dec(ctx, '', {});
    return {
      title: o.title, sub: o.sub || '', hasSub: !!o.sub,
      acts: acts, hasActs: acts.length > 0,
      tabs: o.comp ? O4.tabs(o.comp) : [], hasTabs: !!o.comp,
      hasBar: !!o.cap, bar: o.cap ? O4.bar(o.cap, o.alvo || '', o.ts) : [], metaCap: o.cap || '', metaTs: '26/10',
      alerts: alerts, hasAlerts: alerts.length > 0,
      dec: dec, rc: O4.rcView(ctx),
      layCls: 'o4-lay' + (side.length ? '' : ' o4-lay--one') + (md ? ' o4-lay--md' + (md.picked ? ' is-pick' : '') : ''),
      main: main, side: side, hasSide: side.length > 0,
      cols: [{ cls: 'o4-lay__a', cards: main, hasBack: false }].concat(side.length ? [{ cls: 'o4-lay__b', cards: side, hasBack: !!md }] : []),
      isMd: !!md, mdLabel: md ? md.label : '', mdBack: function () { ctx.setUi({ sel: '__list', dec: '', motivo: '' }); try { window.scrollTo(0, 0); } catch (_) {} }
    };
  };
})();
