/* O2 · Operação (Lia Moura): base comum das telas de usuários, papéis, suporte, privacidade, fontes e importação.
   Define window.O2 (montagem das subtelas em blocos, recibos auditáveis, busca de identidades) e as coleções o2_*.
   Todas as subtelas usam o mesmo molde do DS: título + ações, faixa de contexto (Ambiente · Capacidade · Alvo · Atualizado),
   avisos e blocos (kv, tabela que vira lista no celular, etapas, opções, campo, números, comparação, arquivo, vazio). */
(function () {
  'use strict';
  var O2 = window.O2 = {};
  O2.ENV = 'Produção · dados sintéticos';
  O2.UPD = '26/10 · 14:02 BRT';
  O2.ME = 'Lia M.';

  // ---------- dados (fictícios, coerentes com DB.alunos e o perfil de Rafael) ----------
  // identidades: conta (u_*) e perfil importado (imp_*) são coisas diferentes
  DB.seed('o2_contas', [
    { id: 'u_8812', kind: 'conta', name: 'Marcos Lima', roles: 'treinador · aluno', rolesLong: 'treinador e aluno', contact: 'm••••@gmail.com', email: 'marcos.lima@gmail.com', phone: '+5519998120012', state: 'ativa', origin: 'cadastro', last: '25/10', since: '03/2026', mfa: 'não ativado', lang: 'PT-BR', profile: '/marcos-lima', students: 14, coach: 'Thiago P.' },
    { id: 'imp_31', kind: 'importado', name: 'Marcos Lima', city: 'Campinas', roles: 'perfil importado', rolesLong: 'perfil importado', contact: '—', email: '', phone: '', state: 'sem conta', origin: 'Federação X', last: '—', since: '09/2026', profile: '/marcos-lima-campinas', photos: 2 },
    { id: 'u_9020', kind: 'conta', name: 'Marcos A. Lima', roles: 'aluno', rolesLong: 'aluno', contact: 'm••••@uol.com', email: 'marcos.alima@uol.com.br', phone: '+5543991209020', state: 'ativa', origin: 'convite', last: '12/10', since: '05/2026', mfa: 'não ativado', lang: 'PT-BR', profile: '', students: 0, coach: 'Thiago P.' },
    { id: 'u_7731', kind: 'conta', name: 'Ana Carolina Souza', short: 'Ana C.', roles: 'aluno', rolesLong: 'aluna', contact: 'a••••@gmail.com', email: 'ana.souza@gmail.com', phone: '+5543998777731', state: 'ativa', origin: 'cadastro', last: '26/10', since: '03/2026', mfa: 'não ativado', lang: 'PT-BR', profile: '', students: 0, coach: 'Rafael Lima' },
    { id: 'u_1001', kind: 'conta', name: 'Rafael Lima', roles: 'treinador', rolesLong: 'treinador', contact: 'r••••@gmail.com', email: 'rafael.lima@gmail.com', phone: '+5543999001001', state: 'ativa', origin: 'cadastro', last: '26/10', since: '2019', mfa: 'ativo', lang: 'PT-BR', profile: '/rafael-lima', students: 7, coach: '' }
  ]);
  // equipe administrativa (OPS05): papel define o que cada um vê; saúde, chat e dinheiro não vêm por padrão
  DB.seed('o2_equipe', [
    { id: 'lia', name: 'Lia M.', full: 'Lia Moura', role: 'Moderação', saude: 'não', chat: 'não', fin: 'não', mfa: 'ok', status: 'ativo', me: true },
    { id: 'caio', name: 'Caio R.', full: 'Caio Ribeiro', role: 'Privacidade', saude: 'pedido', chat: 'não', fin: 'não', mfa: 'ok', status: 'ativo', me: false },
    { id: 'bia', name: 'Bia F.', full: 'Bia Fontes', role: 'Financeiro', saude: 'não', chat: 'não', fin: 'sim', mfa: 'ok', status: 'ativo', me: false }
  ]);
  // capacidades por operador (OPS05.C): hoje e proposta
  DB.seed('o2_caps', {
    caio: [
      { cap: 'privacidade.ler', dom: 'privacidade', today: true, prop: '', locked: false },
      { cap: 'privacidade.executar', dom: 'privacidade', today: false, prop: 'conceder', locked: false },
      { cap: 'saude.ler', dom: 'treinos', today: false, prop: '', locked: true },
      { cap: 'financeiro.ler', dom: 'financeiro', today: false, prop: '', locked: true }
    ],
    pending: null
  });
  DB.seed('o2_suspensoes', [
    { id: 'u_8812', scopes: ['pub', 'contatos'], until: '10/11', days: 15, state: 'ativa', reason: 'Denúncias confirmadas · #C-310', rec: 'R-310-2', at: '26/10 09:40' }
  ]);
  DB.seed('o2_sessoes', [
    { id: 's1', dev: 'Chrome · macOS', start: '26/10 08:02', act: 'agora', current: true, unknown: false, state: 'ativa' },
    { id: 's2', dev: 'Safari · iPhone', start: '24/10 19:40', act: '25/10 22:10', current: false, unknown: false, state: 'ativa' },
    { id: 's3', dev: 'Firefox · Windows', start: '26/10 03:11', act: '03:12', current: false, unknown: true, state: 'ativa' }
  ]);
  // histórico auditável (OPS05.G): cada decisão sensível gera um recibo aqui
  DB.seed('o2_auditoria', [
    { id: 'R-301-1', at: '26/10 14:06', actor: 'Lia M.', cap: 'perfis.decidir', caso: '#C-301', subj: 'u_8812', diff: 'titular: — → u_8812', short: 'Titular → u_8812', kind: 'mudanca', motivo: 'Reivindicação com documento conferido' },
    { id: 'R-288-4', at: '26/10 11:20', actor: 'Bia F.', cap: 'papeis.conceder', caso: '—', subj: 'caio', diff: 'privacidade.ler: confirmada', short: 'Capacidade · Caio', kind: 'mudanca', motivo: 'Entrada na equipe de privacidade' },
    { id: 'R-290-2', at: '26/10 09:02', actor: 'Lia M.', cap: 'própria conta', caso: '—', subj: 'lia', diff: 'sessão Edge · Windows revogada', short: 'Sessão revogada', kind: 'mudanca', motivo: 'Dispositivo antigo' },
    { id: '', at: '25/10 10:30', actor: 'Caio R.', cap: 'privacidade.ler', caso: '#P-44', subj: 'u_8812', diff: 'leitura', short: 'Leitura · #P-44', kind: 'acesso', motivo: '' },
    { id: '', at: '24/10 09:12', actor: 'sistema', cap: '—', caso: '—', subj: 'u_8812', diff: 'claim recebido', short: 'Claim recebido', kind: 'mudanca', motivo: '' }
  ]);
  // acesso assistido (OPS06)
  DB.seed('o2_suporte', {
    caso: '#C-305', target: 'u_7731', who: 'Ana C.', op: 'Lia M.', purpose: 'conferir o que a aluna vê em Hoje',
    surfaces: ['Hoje', 'Treinos', 'Programas'], minutes: 30, expires: '11:12', start: '10:42', end: '', status: 'ativa', views: 6, conclusion: '', rec: '',
    past: [{ caso: '#C-298', who: 'Bruno L.', when: '22/10 16:05–16:19', surfaces: 'Treinos', rec: 'R-298-3' }]
  });
  // pedidos de privacidade (OPS07)
  DB.seed('o2_privacidade', [
    { id: 'P-44', type: 'exportação', who: 'Ana C.', whoLong: 'Ana C. · conta', acct: 'u_7731', origin: 'painel', scope: 'todos os dados', due: '08/11', days: 13, resp: 'Caio', status: 'concluído em parte', scopeOk: true, sent: true, proof: 'sessão + e-mail confirmado', involved: 'conta u_7731 · treinos, respostas, conversas, recibos', third: 'conversas com Rafael Lima: só as mensagens dela', keep: '—' },
    { id: 'P-41', type: 'retirada de perfil', who: 'Marcos L.', whoLong: 'Marcos L. · sem conta', acct: 'imp_31', origin: 'formulário público', scope: 'perfil importado', due: '04/11', days: 9, resp: '', status: 'em análise', scopeOk: false, sent: false, proof: 'código enviado ao e-mail do perfil importado · confere', involved: 'perfil /marcos-lima-campinas · 2 fotos · 0 contas', third: 'nenhum', keep: 'registro do pedido, 5 anos' },
    { id: 'P-47', type: 'correção', who: 'em revisão', whoLong: 'em revisão', acct: '', origin: 'e-mail', scope: '—', due: '', days: 0, resp: '', status: 'identidade em revisão', scopeOk: false, sent: false, proof: 'aguardando complemento', involved: '—', third: '—', keep: '—' },
    { id: 'P-50', type: 'exclusão', who: 'Marcos A. Lima', whoLong: 'Marcos A. Lima · conta', acct: 'u_9020', origin: 'painel', scope: 'conta de aluno e dados de treino', due: '20/11', days: 25, resp: 'Caio', status: 'em análise', scopeOk: true, sent: false, proof: 'sessão + e-mail confirmado', involved: 'conta u_9020', third: 'conversas com Thiago P. ficam para ele', keep: 'recibos de compra · obrigação fiscal' }
  ]);
  // fontes autorizadas e direitos (OPS08): cada direito é independente
  var R = function (ok, lim, prova, vig) { return { ok: ok, lim: lim || '—', prova: prova || '—', vig: vig || '—' }; };
  DB.seed('o2_fontes', [
    { id: 'fx', name: 'Federação X', market: 'BR', purpose: 'diretório', resp: 'Caio', evid: 'contrato 03/26', valid: '12/2027', state: 'ativa', kind: 'Parceiro',
      rights: { coletar: R('sim', 'nome, cidade, modalidade', 'contrato §2', '12/2027'), armazenar: R('sim', '24 meses', 'contrato §3', '12/2027'), publicar: R('sim', 'perfil não reivindicado', 'contrato §4', '12/2027'), indexar: R('sim', 'BR', 'contrato §4', '12/2027'), foto: R('não') } },
    { id: 'ay', name: 'Academia Y', label: 'Planilha academia Y', market: 'BR', purpose: 'diretório', resp: 'Caio', evid: 'planilha + e-mail', valid: '06/2027', state: 'sem foto', kind: 'Planilha',
      rights: { coletar: R('sim', 'nome, cidade', 'e-mail 14/06', '06/2027'), armazenar: R('sim', '12 meses', 'e-mail 14/06', '06/2027'), publicar: R('não'), indexar: R('não'), foto: R('não') },
      proposal: { before: { campos: 'nome, cidade', destino: 'quarentena', foto: 'não' }, after: { campos: 'nome, cidade, modalidade', destino: 'quarentena → público', foto: 'não' }, dep: 'contrato assinado · anexado 24/10', status: 'em revisão' },
      revoke: { rights: ['publicar', 'indexar'], affected: '86 candidatos · 41 perfis públicos · 0 fotos', stopped: '14:00', removed: 12, total: 41, rec: 'R-312-1', forwarded: true } },
    { id: 'lz', name: 'Liga Z', market: 'AR', purpose: 'diretório', resp: '—', evid: '—', valid: '—', state: 'rascunho', kind: 'Parceiro',
      rights: { coletar: R('não'), armazenar: R('não'), publicar: R('não'), indexar: R('não'), foto: R('não') } },
    { id: 'cw', name: 'Clube W', market: 'BR', purpose: 'diretório', resp: 'Lia', evid: 'contrato 07/26', valid: '07/2028', state: 'ativa', kind: 'Parceiro',
      rights: { coletar: R('sim', 'nome, cidade', 'contrato §1', '07/2028'), armazenar: R('sim', '24 meses', 'contrato §2', '07/2028'), publicar: R('sim', 'perfil não reivindicado', 'contrato §3', '07/2028'), indexar: R('não'), foto: R('não') } },
    { id: 'av', name: 'Associação V', market: 'BR', purpose: 'diretório', resp: 'Caio', evid: 'termo 05/26', valid: '05/2027', state: 'ativa', kind: 'Parceiro',
      rights: { coletar: R('sim', 'nome, cidade, modalidade', 'termo §1', '05/2027'), armazenar: R('sim', '12 meses', 'termo §2', '05/2027'), publicar: R('sim', 'perfil não reivindicado', 'termo §3', '05/2027'), indexar: R('sim', 'BR', 'termo §3', '05/2027'), foto: R('sim', 'foto enviada pelo próprio treinador', 'termo §4', '05/2027') } },
    { id: 'rq', name: 'Rede Q', market: 'BR', purpose: 'diretório', resp: 'Caio', evid: 'contrato 01/25', valid: '01/2026', state: 'vencida', kind: 'Parceiro',
      rights: { coletar: R('não', '', 'contrato 01/25 vencido', '01/2026'), armazenar: R('não'), publicar: R('não'), indexar: R('não'), foto: R('não') } }
  ]);
  // importação (OPS09): lote atual + arquivos já processados (impressão digital) para detectar arquivo repetido
  DB.seed('o2_imp', {
    lote: 'L-81', key: '9a1f…', file: 'federacao_x_out.csv', size: '1,2 MB', source: 'fx', model: 'v2', rows: 240, valid: 225, warnings: 12, sample: true, repeated: false,
    errors: [
      { line: 41, field: 'e-mail', problem: 'e-mail inválido', norm: '—', kind: 'erro', orig: 'Paula R. · paula.r@ · Campinas', fixed: false },
      { line: 88, field: 'cidade', problem: 'cidade ausente', norm: '—', kind: 'erro', orig: 'Júlio S. · (vazio) · CrossFit', fixed: false },
      { line: 102, field: 'local', problem: 'local ambíguo: “Centro”', norm: 'Campinas? confirmar', kind: 'erro', orig: 'Rita M. · Centro · Funcional', fixed: false },
      { line: 17, field: 'foto', problem: 'foto sem licença da fonte', norm: 'monograma', kind: 'aviso', orig: 'Leo T. · Campinas · foto.jpg', fixed: false }
    ],
    errCount: 3,
    dups: [
      { line: 55, a: { nome: 'Marcos Lima', cidade: 'Campinas', cref: '—' }, b: { nome: 'Marcos A. Lima', cidade: 'Campinas', ref: '/marcos-lima', conta: 'u_8812' }, dec: '' },
      { line: 63, a: { nome: 'Fernanda Alves', cidade: 'Campinas', cref: '—' }, b: { nome: 'Fernanda Alves', cidade: 'Campinas', ref: '/fernanda-alves', conta: 'sem conta' }, dec: '' },
      { line: 120, a: { nome: 'Rodrigo Teles', cidade: 'Valinhos', cref: '—' }, b: { nome: 'Rodrigo Teles', cidade: 'Campinas', ref: '/rodrigo-teles', conta: 'sem conta' }, dec: '' }
    ],
    dupCount: 12, suppressed: 12, eligible: 213,
    status: 'processando', received: '14:10', processed: 140, fails: [{ line: 131, why: 'tempo esgotado ao gravar' }, { line: 197, why: 'tempo esgotado ao gravar' }], rec: 'R-381-1',
    seen: [{ hash: 'h-federacao-x-out-240', name: 'federacao_x_out.csv', lote: 'L-81', at: '26/10 14:10' }]
  });

  // ---------- utilidades ----------
  var N = function (t) { return U.norm(t); };
  O2.bc = function (label) {
    var t = N(label);
    if (/^(confirmad|ok|ativa|ativo|sim|conclu|aceit|valid|atual|confere|enviad|aprovad|registrad)/.test(t)) return 'badge--ok';
    if (/^(em andamento|em revis|em analise|aguard|processando|propost|conceder)/.test(t)) return 'badge--info';
    if (/^(falhou|revog|suspens|vencid|erro|bloque|negad|rejeit|fora|expirad|nao$)/.test(t)) return 'badge--risk';
    if (/^(pendente|sem foto|sem licen|vence|desconhec|aviso|parcial|pedido|duplicat)/.test(t)) return 'badge--warn';
    return 'badge--plain';
  };
  O2.find = function (coll, id) { return (DB[coll] || []).find(function (x) { return x.id === id; }) || null; };
  O2.person = function (id) { return O2.find('o2_contas', id); };
  O2.short = function (p) { return p ? (p.short || p.name) : ''; };

  // recibo auditável: toda decisão sensível passa por aqui
  O2.log = function (o) {
    var n = 400 + DB.o2_auditoria.length;
    var rec = { id: 'R-' + n + '-1', at: '26/10 ' + U.now(), actor: O2.ME, cap: o.cap || '—', caso: o.caso || '—', subj: o.subj || '', diff: o.diff || '', short: o.short || o.diff || '', kind: o.kind || 'mudanca', motivo: o.motivo || '' };
    DB.o2_auditoria.unshift(rec);
    return rec;
  };
  // motivo + impacto + confirmação + recibo
  O2.decide = function (ctx, o) {
    var fk = o.fkey || 'motivo';
    var m = ctx.ui[fk] != null ? String(ctx.ui[fk]) : String(o.def || '');
    if (o.needMotivo !== false && m.trim().length < 5) {
      var up = {}; up[fk + 'Err'] = true; ctx.setUi(up);
      ctx.toast('Escreva o motivo (pelo menos 5 letras): ele vai para o recibo.');
      return;
    }
    ctx.ask({
      title: o.title, text: o.needMotivo === false ? (o.text || '') : 'Motivo: ' + m.trim(), lines: o.lines || [], ok: o.ok || 'Confirmar', danger: !!o.danger,
      onOk: function () {
        var rec = O2.log({ cap: o.cap, caso: o.caso, subj: o.subj, diff: o.diff, short: o.short, kind: 'mudanca', motivo: m.trim() });
        if (o.done) o.done(rec);
        ctx.toast((o.doneMsg || 'Feito') + ' · recibo ' + rec.id);
      }
    });
  };

  // busca de identidades por identificador permitido (nome mostra homônimos)
  O2.search = function (q, opts) {
    opts = opts || {};
    var t = N(q);
    if (!t) return { mode: 'vazio', items: [] };
    var all = DB.o2_contas.filter(function (p) { return !(opts.noImported && p.kind === 'importado'); });
    var digits = t.replace(/\D/g, '');
    if (/^(u_|imp_)\w+$/.test(t)) return { mode: 'id', items: all.filter(function (p) { return N(p.id) === t; }) };
    if (t.indexOf('@') > 0) return { mode: 'email', items: all.filter(function (p) { return N(p.email) === t; }) };
    if (digits.length >= 10 && /^[\d\s()+-]+$/.test(t)) return { mode: 'tel', items: all.filter(function (p) { return p.phone && p.phone.replace(/\D/g, '').slice(-digits.length) === digits; }) };
    var parts = t.split(/\s+/);
    return { mode: 'nome', items: all.filter(function (p) { var n = N(p.name + ' ' + (p.city || '')); return parts.every(function (w) { return n.indexOf(w) >= 0; }); }) };
  };

  // ---------- montagem dos blocos ----------
  var FLAGS = ['isKv', 'isTable', 'isSteps', 'isOpts', 'isField', 'isKpis', 'isCols', 'isFile', 'isEmpty', 'isRows', 'isSearch', 'isText', 'isBtns'];
  function blk(type, o) {
    var b = { title: '', meta: '', sub: '', help: '', cls: 'card o2-blk' };
    FLAGS.forEach(function (f) { b[f] = false; });
    b['is' + type] = true;
    Object.keys(o || {}).forEach(function (k) { if (o[k] !== undefined) b[k] = o[k]; });
    b.hasTitle = !!b.title; b.hasMeta = !!b.meta; b.hasSub = !!b.sub; b.hasHelp = !!b.help;
    return b;
  }
  function kvRow(r) {
    if (!Array.isArray(r)) return r;
    var badge = r[2] || '';
    return { k: r[0], v: r[1] == null ? '—' : String(r[1]), hasBadge: !!badge, badge: badge, bcls: 'badge ' + (r[3] || O2.bc(badge)) };
  }
  function cell(c) {
    if (c && typeof c === 'object') {
      if (c.btn) return { t: c.btn, isTxt: false, isBadge: false, isBtn: true, bcls: c.cls || 'btn btn--outline btn--sm', go: c.go };
      if (c.b !== undefined) return { t: c.b, isTxt: false, isBadge: true, isBtn: false, bcls: c.cls || O2.bc(c.b), go: null };
    }
    return { t: c == null || c === '' ? '—' : String(c), isTxt: true, isBadge: false, isBtn: false, bcls: '', go: null };
  }
  var S = O2.S = {
    act: function (label, go, kind, dis) {
      var k = kind || 'outline';
      var cls = 'btn btn--sm ' + (k === 'primary' ? 'btn--primary' : k === 'ghost' ? 'btn--ghost' : k === 'danger' ? 'btn--outline mod-danger' : 'btn--outline') + (dis ? ' o2-dis' : '');
      return { label: label, go: go, cls: cls, dis: dis ? 'true' : 'false' };
    },
    note: function (kind, t, s, acts, ic) {
      var map = { info: ['alert alert--info', 'i-info'], warn: ['alert alert--warn', 'i-alert'], risk: ['alert alert--risk', 'i-alert'], ok: ['alert alert--ok', 'i-check'], lock: ['alert', 'i-lock'], plain: ['alert', 'i-info'] };
      var m = map[kind] || map.plain;
      var a = (acts || []).filter(Boolean).map(function (x) { return { label: x[0], go: x[1], cls: 'btn btn--sm ' + (x[2] === 'primary' ? 'btn--primary' : 'btn--outline') }; });
      return { cls: m[0] + ' o2-note', ic: 'ic ic--sm ' + (ic ? 'i-' + ic : m[1]), t: t || '', s: s || '', hasT: !!t, hasS: !!s, acts: a, hasActs: a.length > 0 };
    },
    rec: function (rec, text, subj) {
      return S.note('ok', text || 'Registrado', 'Recibo ' + rec + ' · motivo, impacto e autor ficam no histórico.', [['Ver histórico', function () { GO('OPS05.G', { id: subj || '' }); }]]);
    },
    kv: function (title, rows, o) { return blk('Kv', Object.assign({ title: title, rows: rows.filter(Boolean).map(kvRow) }, o || {})); },
    table: function (title, cols, rows, o) {
      o = o || {};
      var anyGo = rows.some(function (r) { return r && r.go; });
      var cs = cols.slice(); if (anyGo) cs.push('');
      var rs = rows.filter(Boolean).map(function (r) {
        var cells = r.cells.map(cell);
        if (anyGo) cells.push(r.go ? cell({ btn: r.goL || 'Abrir', go: r.go, cls: 'btn btn--ghost btn--sm' }) : cell(' '));
        var btns = r.cells.map(cell).filter(function (c) { return c.isBtn; });
        var mb = r.mb != null ? r.mb : '';
        return { cells: cells, cls: r.sel ? 'is-sel' : '', hasGo: !!r.go, noGo: !r.go, go: r.go || null, mt: r.mt || cells[0].t, ms: r.ms || '', hasMs: !!r.ms, hasMb: !!mb, mb: mb, mbcls: 'badge ' + (r.mbcls || O2.bc(mb)), btns: btns, hasBtns: btns.length > 0 };
      });
      return blk('Table', Object.assign({ title: title, cols: cs, rows: rs, hasRows: rs.length > 0, noRows: rs.length === 0, emptyT: o.emptyT || 'Nada por aqui', emptyS: o.emptyS || '' }, o));
    },
    steps: function (title, rows, o) {
      return blk('Steps', Object.assign({ title: title, rows: rows.filter(Boolean).map(function (r) {
        var ic = { Confirmado: 'i-check', 'Em andamento': 'i-refresh', 'Na fila': 'i-clock', Falhou: 'i-alert', Pendente: 'i-clock', Atual: 'i-target' }[r[2]] || 'i-clock';
        return { ic: 'ic ic--xs ' + ic, t: r[0], m: r[1] || '', badge: r[2], bcls: 'badge ' + O2.bc(r[2]), hasGo: !!r[3], go: r[3] || null, goL: r[4] || 'Abrir' };
      }) }, o || {}));
    },
    opts: function (title, items, help, o) {
      return blk('Opts', Object.assign({ title: title, help: help || '', items: items.filter(Boolean).map(function (it) {
        var base = it.chip ? 'chip o2-chip' : 'opt o2-opt';
        return { label: it.label, on: it.on ? 'true' : 'false', cls: base + (it.on ? ' is-on' : '') + (it.lock ? ' o2-lock' : ''), lock: !!it.lock, go: it.go };
      }) }, o || {}));
    },
    field: function (fid, label, val, input, o) {
      o = o || {};
      return blk('Field', { cls: o.card ? 'card o2-blk' : 'o2-blk o2-blk--bare', title: o.title || '', fid: 'o2-' + fid, label: label, val: val == null ? '' : String(val), input: input, isArea: !!o.area, isLine: !o.area, ph: o.ph || '', help: o.help || '', hasHelp: !!o.help, err: o.err || '', hasErr: !!o.err, icls: o.err ? 'is-err' : '' });
    },
    kpis: function (items, o) { return blk('Kpis', Object.assign({ cls: 'o2-blk o2-blk--bare', items: items.map(function (k) { return { l: k[0], n: String(k[1]), cls: 'kcard o2-kpi' + (k[2] ? ' o2-kpi--' + k[2] : '') }; }) }, o || {})); },
    cols: function (title, cols, seg, o) {
      var side = seg ? seg.side : 'a';
      return blk('Cols', Object.assign({ title: title, ccls: 'o2-cols o2-cols--' + side, hasSeg: !!seg, seg: seg ? seg.items.map(function (s) { var on = s[0] === side; return { label: s[1], cls: 'seg__it' + (on ? ' is-on' : ''), on: on ? 'true' : 'false', go: s[2] }; }) : [],
        cols: cols.map(function (c) { return { t: c.t, cls: 'o2-col', rows: c.rows.map(kvRow) }; }) }, o || {}));
    },
    file: function (o) { return blk('File', Object.assign({ title: o.title || '', name: o.name || 'Nenhum arquivo escolhido', sub: o.sub || '', cta: o.cta || 'Escolher arquivo', accept: o.accept || '', pick: o.pick, hasErr: !!o.err, err: o.err || '' }, {})); },
    empty: function (ic, t, s, actL, go) { return blk('Empty', { cls: 'o2-blk o2-blk--bare', ic: 'ic i-' + ic, t: t, s: s || '', hasAct: !!actL, actL: actL || '', go: go || null }); },
    rows: function (title, items, o) {
      return blk('Rows', Object.assign({ title: title, items: items.filter(Boolean).map(function (r) { return { ic: 'ic ic--xs i-' + (r.ic || 'chev-r'), t: r.t, s: r.s || '', badge: r.badge || '', hasBadge: !!r.badge, bcls: 'badge ' + (r.bcls || O2.bc(r.badge || '')), go: r.go }; }) }, o || {}));
    },
    search: function (label, val, input, ph, help) { return blk('Search', { cls: 'o2-blk o2-blk--bare', label: label, val: val || '', input: input, ph: ph || '', help: help || '', hasHelp: !!help }); },
    text: function (t, title) { return blk('Text', { t: t, title: title || '' }); },
    alert: function (kind, title, t) { return blk('Text', { cls: 'alert alert--' + kind + ' o2-blk o2-blk--alert', t: t, title: title || '' }); },
    btns: function (items, o) { return blk('Btns', Object.assign({ cls: 'o2-blk o2-blk--bare', items: items.filter(Boolean) }, o || {})); }
  };

  // ---------- registro de uma subtela ----------
  O2.screen = function (def) {
    return REG.screen({
      page: 'operacao', key: def.key, id: def.id, also: def.also, title: def.title, mtitle: def.mtitle || def.title, nav: def.nav || 'usuarios', back: def.back, wide: !!def.wide, form: !!def.form,
      testIds: def.testIds, normal: def.normal || 'Uso normal', scens: def.scens || [],
      vals: function (ctx) {
        var r = def.make(ctx, S) || {};
        var h = r.head || {};
        var prog = h.step ? [1, 2, 3, 4].map(function (i) { return { cls: i <= h.step ? 'is-on' : '' }; }) : [];
        var cap = r.cap || def.cap || '—';
        var acts = (r.acts || []).filter(Boolean);
        var notes = (r.notes || []).filter(Boolean);
        var blocks = (r.blocks || []).filter(Boolean);
        var ctxs = [['Ambiente', O2.ENV], ['Capacidade', cap], ['Alvo', r.alvo || def.alvo || '—'], ['Atualizado', O2.UPD]].map(function (x) { return { k: x[0], v: x[1] }; });
        var bn = r.banner || null;
        return {
          head: { eyebrow: h.eyebrow || '', hasEyebrow: !!h.eyebrow, title: h.title || def.title, sub: h.sub || '', hasSub: !!h.sub, prog: prog, hasProg: prog.length > 0 },
          acts: acts, hasActs: acts.length > 0, ctxs: ctxs, mcap: cap, mdate: '26/10',
          notes: notes, hasNotes: notes.length > 0, blocks: blocks,
          hasBanner: !!bn, banner: bn ? { t: bn.t, s: bn.s, exit: bn.exit, exitL: bn.exitL || 'Sair', cls: 'o2-banner' + (bn.warn ? ' o2-banner--warn' : '') } : { t: '', s: '', exit: null, exitL: '', cls: '' }
        };
      }
    });
  };
  // ação bloqueada enquanto o resultado anterior é desconhecido: consulta antes de repetir
  O2.unknown = function (ctx, what, okText) {
    if (ctx.ui.consulted) return { block: false, note: S.note('ok', 'Consulta feita: nada a repetir', okText) };
    return {
      block: true,
      note: S.note('warn', 'Resultado desconhecido', 'A confirmação de “' + what + '” não voltou. Consulte a situação antes de repetir: repetir agora pode aplicar duas vezes.', [['Consultar situação', function () { ctx.setUi({ consulted: true }); ctx.toast('Situação consultada · ' + okText); }, 'primary']])
    };
  };
  O2.blocked = function (ctx) { ctx.toast('Consulte a situação antes de repetir a ação.'); };
  O2.setter = function (ctx, k) { return function (e) { var up = {}; up[k] = U.val(e); up[k + 'Err'] = false; ctx.setUi(up); }; };
  O2.uv = function (ctx, k, def) { return ctx.ui[k] != null ? ctx.ui[k] : def; };
})();
