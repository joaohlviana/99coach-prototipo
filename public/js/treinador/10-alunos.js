/* H04 · Alunos: carteira de relações (base TRE02). Busca, filtros (vínculo, formato, precisa de ação), ordenação,
   convites e pedidos separados dos ativos, homônimos com identificação permitida. Filtros ficam salvos ao voltar. */
REG.screen({
  page: 'treinador', key: 'alunos', id: 'H04', also: ['TRE02'], title: 'Alunos', nav: 'alunos', wide: true,
  normal: 'Uso recorrente',
  scens: [['novo', 'Primeiro uso · sem alunos'], ['semres', 'Ausência confirmada na busca'], ['filtro', 'Filtro sem resultado'], ['parcial', 'Indisponibilidade parcial'], ['carregando', 'Lista carregando'], ['falha', 'Lista não carregou'], ['convite', 'Convite pendente não é aluno ativo'], ['homonimo', 'Pessoa homônima']],
  vals: function (ctx) {
    var T = window.T1, scn = ctx.scn, prefs = DB.t1_prefs;
    var go = function (to, p) { return function () { ctx.go(to, p || {}); }; };
    var DEF = { st: 'ativos', fmt: 'todos', acao: false, sort: 'prioridade', q: '' };
    var PRESET = { semres: { q: 'joão' }, filtro: { st: 'pausados', fmt: 'presencial', acao: true }, parcial: { st: 'convidados' }, convite: { st: 'convidados' }, homonimo: { st: 'todos', q: 'Ana Carolina' } };
    var F = Object.assign({}, DEF, scn ? (PRESET[scn] || {}) : (prefs.filtros || {}), ctx.ui.f || {});
    var setF = function (patch) { var nf = Object.assign({}, F, patch); if (!scn) prefs.filtros = nf; ctx.setUi({ f: nf }); };
    var empty = scn === 'novo';

    // ---------- universo ----------
    var recs = empty ? [] : DB.alunos.concat(DB.t1_encerrados || []);
    var convs = empty ? [] : DB.t1_convites.filter(function (c) { return c.status === 'criado' || c.status === 'pendente' || c.status === 'expirado'; });
    var peds = empty ? [] : DB.t1_pedidos.filter(function (p) { return p.status === 'pendente' || p.status === 'info'; });
    var fmtOf = function (svc) { var s = U.norm(svc); return s.indexOf('presencial') >= 0 ? 'presencial' : 'online'; };
    var qn = U.norm(F.q);
    var matchQ = function (name, extra) { return !qn || U.norm(name).indexOf(qn) >= 0 || (extra && U.norm(extra).indexOf(qn) >= 0); };
    var nameCount = {};
    recs.forEach(function (a) { var k = U.norm(a.name); nameCount[k] = (nameCount[k] || 0) + 1; });

    var recOk = function (a) {
      if (!matchQ(a.name)) return false;
      if (F.fmt !== 'todos' && fmtOf(a.svc) !== F.fmt) return false;
      if (F.acao && !a.flag) return false;
      return true;
    };
    var convOk = function (c) {
      var o = T.offer(c.offer);
      if (!matchQ(c.name, c.contact)) return false;
      if (F.fmt !== 'todos' && (!o || o.fmt !== F.fmt)) return false;
      if (F.acao && c.status === 'pendente') return false;
      return true;
    };
    var pedOk = function (p) { var o = T.offer(p.offer); return matchQ(p.name) && (F.fmt === 'todos' || (o && o.fmt === F.fmt) || (!o && F.fmt === 'online')); };
    var byStatus = { ativos: 'ativo', pausados: 'pausado', encerrados: 'encerrado' };
    var lists = {
      ativos: recs.filter(function (a) { return a.status === 'ativo' && recOk(a); }),
      pausados: recs.filter(function (a) { return a.status === 'pausado' && recOk(a); }),
      encerrados: recs.filter(function (a) { return a.status === 'encerrado' && recOk(a); }),
      todos: recs.filter(recOk),
      convidados: convs.filter(convOk),
      pedidos: peds.filter(pedOk)
    };
    var totals = {
      ativos: recs.filter(function (a) { return a.status === 'ativo'; }).length,
      convidados: convs.length, pedidos: peds.length
    };

    // ---------- ordenação ----------
    var dnum = function (d) { var m = /(\d{2})\/(\d{2})/.exec(d || ''); return m ? Number(m[2]) * 100 + Number(m[1]) : 0; };
    var sorters = {
      prioridade: function (x, y) { return ((x.flag ? T.PRI[x.flag.kind] || 8 : 9) - (y.flag ? T.PRI[y.flag.kind] || 8 : 9)) || x.name.localeCompare(y.name); },
      nome: function (x, y) { return x.name.localeCompare(y.name); },
      ultima: function (x, y) { return dnum(y.lastCheckin) - dnum(x.lastCheckin); },
      adesao: function (x, y) { return (y.adherence || 0) - (x.adherence || 0); }
    };
    var isRec = !!byStatus[F.st] || F.st === 'todos';

    var rowOf = function (a) {
      var s = T.status(a), ro = T.rotina(a), ac = a.flag ? T.act(a) : null, mine = !!ac && ac.who === 'Você';
      var prog = ro ? ro.name + ' · semana ' + a.week + ' · v' + ro.version : (a.status === 'ativo' ? (a.prepDone ? 'Preparação respondida · sem programação' : 'Preparação pendente') : '—');
      var homo = nameCount[U.norm(a.name)] > 1;
      return {
        p: T.person(a), name: a.name, svc: a.svc, prog: prog, last: a.lastCheckin || '—',
        adh: a.adherence ? a.adherence + '% · 4 semanas' : '—',
        badge: s.label, badgeCls: s.cls,
        next: ac ? (mine ? ac.label : 'Aguarda ' + (a.first || T.short(a.name))) : '—',
        nextSub: a.flag ? a.flag.text + ' · ' + a.flag.when : a.next,
        hasAct: mine, act: ac ? function () { ctx.go(ac.to, ac.params); } : function () {}, actLabel: ac ? ac.label : '',
        flagged: !!a.flag,
        homo: homo, homoTxt: homo ? 'Mesmo nome de outra pessoa · ' + (a.city || 'cidade não informada') + ' · início ' + (a.since || '—') + (a.contact ? ' · ' + a.contact : '') : '',
        open: go('H05', { id: a.id })
      };
    };
    var cRow = function (c) {
      var o = T.offer(c.offer), unconf = scn === 'parcial' && c.id === 'cv2';
      var ST = { criado: ['Criado · ainda não enviado', 'badge badge--plain'], pendente: ['Aguardando aceite', 'badge badge--info'], expirado: ['Convite expirado', 'badge badge--warn'] };
      return {
        name: c.name, contact: c.contact, svc: o ? o.name : 'Sem serviço definido', badge: ST[c.status][0], badgeCls: ST[c.status][1],
        when: c.status === 'expirado' ? 'venceu em ' + c.expires : 'criado ' + c.created + ' · vale até ' + c.expires,
        unconf: unconf,
        isExp: c.status === 'expirado', notExp: c.status !== 'expirado',
        copy: function () { if (c.status === 'criado') { c.status = 'pendente'; c.shared = 'link copiado ' + U.todayShort + ' ' + U.now(); c.updated = 'hoje ' + U.now(); } ctx.toast('Link de ' + c.name.split(' ')[0] + ' copiado: 99coach.com.br/c/' + c.code + '. Copiar não é enviar: cole na conversa com ' + c.name.split(' ')[0] + '.'); },
        reissue: go('REL02', { id: c.id })
      };
    };
    var pRow = function (p) {
      var o = T.offer(p.offer);
      return { name: p.name, origin: p.origin + (o ? ' · ' + o.name : ''), msg: '“' + p.msg + '”', at: p.at, due: p.due, st: p.status === 'info' ? 'Aguardando resposta da pessoa' : 'Aguardando você', go: go('REL06', { id: p.id }) };
    };

    var cur = (lists[F.st] || []).slice();
    if (isRec) cur.sort(sorters[F.sort] || sorters.prioridade);
    var rows = isRec ? cur.map(rowOf) : [];
    var cRows = F.st === 'convidados' ? cur.map(cRow) : [];
    var pRows = F.st === 'pedidos' ? cur.map(pRow) : [];

    var LBL = { ativos: 'Ativos', convidados: 'Convidados', pedidos: 'Pedidos', pausados: 'Pausados', encerrados: 'Encerrados', todos: 'Todos' };
    var tabs = ['ativos', 'convidados', 'pedidos', 'pausados', 'encerrados', 'todos'].map(function (k) {
      var on = F.st === k;
      return { label: LBL[k], n: String(lists[k].length), cls: 'chip' + (on ? ' is-on' : ''), on: String(on), pick: function () { setF({ st: k }); } };
    });
    var fmts = [['todos', 'Online e presencial'], ['online', 'Online'], ['presencial', 'Presencial']].map(function (o) {
      var on = F.fmt === o[0]; return { label: o[1], cls: 'chip' + (on ? ' is-on' : ''), on: String(on), pick: function () { setF({ fmt: o[0] }); } };
    });
    var sorts = [['prioridade', 'Prioridade'], ['nome', 'Nome'], ['ultima', 'Última sessão'], ['adesao', 'Adesão']].map(function (o) {
      var on = F.sort === o[0]; return { label: o[1], cls: 'seg__it' + (on ? ' is-on' : ''), on: String(on), pick: function () { setF({ sort: o[0] }); } };
    });

    var loading = scn === 'carregando', failed = scn === 'falha';
    var n = cur.length;
    var isFiltered = !!(F.q || F.fmt !== 'todos' || F.acao);
    var noRes = !empty && !loading && !failed && n === 0;
    var alerts = [];
    if (failed) alerts.push(T.alert('risk', 'A lista não carregou', 'Seus filtros continuam aplicados. Nenhum aluno foi removido.', 'Tentar de novo', function () { ctx.scenario(''); ctx.toast('Lista atualizada às ' + U.now() + '.'); }));
    if (scn === 'parcial') alerts.push(T.alert('warn', 'Estados de convite atualizados às 07:50', 'Um envio não confirmou entrega (Felipe Ramos). Copie o link e envie você mesmo.', 'Consultar de novo', function () { ctx.scenario(''); ctx.toast('Convites consultados às ' + U.now() + '.'); }));
    if (scn === 'convite') alerts.push(T.alert('info', 'Convite pendente não é aluno ativo', 'Quem ainda não aceitou aparece só em Convidados e não entra na contagem de ativos.', 'Ver ativos', function () { setF({ st: 'ativos' }); }));
    if (scn === 'homonimo') alerts.push(T.alert('warn', 'Duas pessoas com o mesmo nome', 'Confira cidade, início e contato antes de abrir. Mostramos só o que cada vínculo permite.', 'Revisar', function () { setF({ st: 'ativos' }); }));

    return {
      isEmpty: empty, notEmpty: !empty,
      sub: totals.ativos + ' ativos · ' + U.plural(totals.convidados, 'convidado', 'convidados') + ' · ' + U.plural(totals.pedidos, 'pedido', 'pedidos'),
      invite: go('REL01'), share: go('@perfil', { id: 'rafael' }), goConvites: go('REL02'), goPedidos: go('REL06'), goHoje: go('H03'),
      q: F.q, setQ: function (e) { setF({ q: U.val(e) }); },
      tabs: tabs, fmts: fmts, sorts: sorts,
      acaoCls: 'chip' + (F.acao ? ' is-on' : ''), acaoOn: String(F.acao), toggleAcao: function () { setF({ acao: !F.acao }); },
      isRec: isRec && !loading && !failed && n > 0, rows: rows,
      isConv: F.st === 'convidados' && !loading && !failed && n > 0, cRows: cRows,
      isPed: F.st === 'pedidos' && !loading && !failed && n > 0, pRows: pRows,
      showSort: isRec,
      loading: loading, alerts: alerts, hasAlerts: alerts.length > 0,
      noRes: noRes, noResQ: noRes && !!F.q && F.st !== 'todos', noResF: noRes && !(F.q && F.st !== 'todos'),
      noResT: 'Nenhum aluno com “' + F.q + '” em ' + LBL[F.st].toLowerCase(),
      noResFT: isFiltered ? 'Nenhum aluno corresponde aos filtros' : 'Nada em ' + LBL[F.st].toLowerCase() + ' agora',
      searchAll: function () { setF({ st: 'todos' }); },
      clear: function () { setF({ q: '', fmt: 'todos', acao: false }); },
      isFiltered: isFiltered,
      foot: n ? '1–' + n + ' de ' + n + ' ' + LBL[F.st].toLowerCase() + (isFiltered ? ' com os filtros' : '') + ' · filtros salvos ao voltar' : ''
    };
  }
});
