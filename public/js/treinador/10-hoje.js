/* H03 · Hoje do treinador (base TRE01): primeira pendência real, fila de alunos que precisam de ação (DB.alunos[].flag),
   agenda de hoje, mensagens, rascunhos, recebimentos discretos e teste do Pro dispensável. Resolver muda a fila. */
REG.screen({
  page: 'treinador', key: 'hoje', id: 'H03', also: ['TRE01'], title: 'Hoje do treinador', mtitle: 'Hoje', nav: 'hoje', home: true, wide: true,
  normal: 'Uso recorrente',
  scens: [['novo', 'Primeiro uso · conta nova'], ['ausencia', 'Ausência confirmada · nada pendente'], ['parcial', 'Indisponibilidade parcial'], ['carregando', 'Carregando a fila'], ['falha', 'Fila não carregou'], ['ultimo', 'Consulta parcial · último dado confirmado'], ['semia', 'IA indisponível sem bloquear ações']],
  vals: function (ctx) {
    var T = window.T1, ui = ctx.ui, scn = ctx.scn, t = DB.trainer, prefs = DB.t1_prefs;
    var go = function (to, p) { return function () { ctx.go(to, p || {}); }; };
    var retry = function () { ctx.scenario(''); ctx.toast('Atualizado às ' + U.now() + '. Fila, agenda e mensagens em dia.'); };

    // ---------- fila ----------
    var q = scn === 'ausencia' ? [] : T.queue();
    var detail = function (a) {
      var f = a.flag, r;
      switch (f.kind) {
        case 'dor': r = T.resposta(a.id, true); return 'Check-in enviado ' + (r ? 'em ' + r.at : f.when) + '. Revise antes do próximo treino (' + a.next + ').';
        case 'resposta': r = T.prepResposta(a.id); return 'Respondeu a preparação ' + (r ? 'em ' + r.at : f.when) + '. Revise antes de montar o primeiro treino.';
        case 'pedido': return 'Pedido recebido ' + f.when + ' pelo perfil. Aceite, recuse ou peça mais informações.';
        case 'preparacao': return 'Aceitou o convite ' + f.when + '. A preparação está com ' + a.first + '; você pode mandar um lembrete.';
        case 'programacao': var ro = T.rotina(a); return 'Os treinos atuais acabam quinta. Base: ' + (ro ? ro.name + ' · v' + ro.version : 'programação atual') + '.';
        default: return f.text;
      }
    };
    var item = function (a) {
      var ac = T.act(a), mine = ac.who === 'Você';
      return {
        p: T.person(a), name: a.name, short: T.short(a.name), reason: a.flag.text, when: a.flag.when, detail: detail(a),
        who: mine ? 'Responsável: você' : 'Responsável: ' + ac.who, whoTag: mine ? 'AGUARDA VOCÊ' : 'AGUARDA ' + (a.first || '').toUpperCase(),
        tagCls: mine ? 't1-first__tag is-me' : 't1-first__tag',
        label: ac.label, go: go(ac.to, ac.params), open: go('H05', { id: a.id }),
        resolve: function () {
          ctx.ask({
            title: 'Marcar como resolvida?', text: 'A pendência de ' + a.first + ' sai da fila de hoje e fica no histórico do aluno. Você pode desfazer logo abaixo da fila.',
            lines: [a.flag.text + ' · ' + a.flag.when], ok: 'Marcar como resolvida',
            onOk: function () {
              DB.t1_resolvidas.unshift({ id: DB.uid('rs'), aluno: a.id, flag: a.flag, at: U.now() });
              a.flag = null;
              ctx.toast('Pendência de ' + a.first + ' resolvida às ' + U.now() + '. A fila foi atualizada.');
            }
          });
        }
      };
    };
    var items = q.map(item);
    var first = items.length ? items[0] : null;
    var rest = items.slice(1);
    var resolved = (DB.t1_resolvidas || []).map(function (r) {
      var a = T.aluno(r.aluno);
      return {
        text: (a ? a.first : '') + ' · ' + r.flag.text, at: 'resolvida às ' + r.at,
        undo: function () { if (a && !a.flag) a.flag = r.flag; DB.t1_resolvidas = DB.t1_resolvidas.filter(function (x) { return x.id !== r.id; }); ctx.toast('Pendência de ' + (a ? a.first : 'aluno') + ' voltou para a fila.'); }
      };
    });

    // ---------- agenda ----------
    var now = U.now();
    var ag = DB.agenda.filter(function (c) { return T.today(c.day); });
    var nextIdx = -1;
    ag.forEach(function (c, i) { if (nextIdx < 0 && c.time >= now) nextIdx = i; });
    var agenda = ag.map(function (c, i) {
      var a = c.student ? T.aluno(c.student) : null;
      return { time: c.time, who: a ? T.short(a.name) : (c.group || 'Compromisso'), sub: c.kind + ' · ' + (c.student ? c.place : c.status), isNext: i === nextIdx, cls: 'lrow t1-ag' + (i === nextIdx ? ' is-next' : ''), go: go('TRE20', { id: c.id }) };
    });
    var later = DB.agenda.filter(function (c) { return !T.today(c.day); })[0];
    var laterA = later && later.student ? T.aluno(later.student) : null;
    var nextTxt = nextIdx >= 0 ? agenda[nextIdx].who + ' · ' + agenda[nextIdx].time + ' · ' + ag[nextIdx].place : (later ? (laterA ? laterA.first : later.group) + ', ' + later.day + ' ' + later.time : 'Sem compromissos marcados');

    // ---------- mensagens ----------
    var convs = DB.conversas.slice().sort(function (x, y) { return (y.unread || 0) - (x.unread || 0); }).slice(0, 3).map(function (c) {
      var a = T.aluno(c.with), last = c.msgs[c.msgs.length - 1] || { text: '', at: '', from: '' };
      return { who: a ? a.first : c.with, text: (last.from === 'me' ? 'Você: ' : '') + '“' + last.text + '”', at: last.at, unread: !!c.unread, go: go('TRE25', { id: c.id }) };
    });
    var unread = DB.conversas.reduce(function (n, c) { return n + (c.unread || 0); }, 0);

    // ---------- rascunhos, recebimentos, Pro ----------
    var drafts = DB.rotinas.filter(function (r) { return r.status === 'rascunho'; }).map(function (r) { return { title: r.name, sub: 'Rotina · salva ' + r.savedAt, go: go('TRE14', { id: r.id }) }; })
      .concat(DB.programas.filter(function (p) { return p.status === 'rascunho'; }).map(function (p) { return { title: p.name, sub: 'Programa · editado ' + p.updated, go: go('H07', { id: p.id }) }; }));
    var ins = DB.insights;
    var showPro = !t.proTrial.active && !prefs.proDismissed;

    // ---------- busca ----------
    var qs = U.norm(ui.q || '');
    var found = qs ? DB.alunos.filter(function (a) { return U.norm(a.name).indexOf(qs) >= 0; }).slice(0, 5).map(function (a) {
      var s = T.status(a); return { name: a.name, sub: a.svc, badge: s.label, badgeCls: s.cls, go: go('H05', { id: a.id }) };
    }) : [];

    // ---------- situações ----------
    var alerts = [];
    if (scn === 'falha') alerts.push(T.alert('risk', 'A fila não carregou', 'Agenda e rascunhos continuam aqui. Nenhuma pendência foi descartada.', 'Tentar de novo', retry));
    if (scn === 'ultimo') alerts.push(T.alert('warn', 'Consulta parcial', 'Mostrando o último dado confirmado às ' + prefs.lastSync + '. Pendências novas podem não aparecer ainda.', 'Consultar de novo', retry));
    if (scn === 'semia') alerts.push(T.alert('info', 'Assistência de IA indisponível agora', 'Nada aqui depende dela: revise, programe e responda normalmente.', 'Tentar de novo', retry));
    if (scn === 'parcial') alerts.push(T.alert('info', 'Alunos atualizados às ' + prefs.lastSync, 'Fila e agenda estão em dia. Só as mensagens não carregaram.', '', null));
    var loading = scn === 'carregando', failQ = scn === 'falha';
    var hasQueue = !loading && !failQ;

    return {
      isNew: scn === 'novo', notNew: scn !== 'novo',
      date: 'Segunda, 26 de outubro', hello: 'Bom dia, ' + t.first,
      sub: failQ || loading ? ag.length + ' compromissos na agenda de hoje' : (q.length ? U.plural(q.length, 'aluno precisa', 'alunos precisam') + ' de você hoje · ' + ag.length + ' compromissos na agenda' : 'Nenhuma pendência confirmada · ' + ag.length + ' compromissos na agenda'),
      invite: go('REL01'),
      q: ui.q || '', setQ: function (e) { ctx.setUi({ q: U.val(e) }); }, clearQ: function () { ctx.setUi({ q: '' }); },
      hasQ: !!qs, found: found, hasFound: found.length > 0, noFound: !!qs && !found.length, qText: ui.q || '',
      alerts: alerts, hasAlerts: alerts.length > 0,
      loading: loading, failQ: failQ, hasQueue: hasQueue,
      hasFirst: hasQueue && !!first, first: first || { p: T.person(null), name: '', reason: '', when: '', detail: '', who: '', whoTag: '', tagCls: '', label: '', go: function () {}, open: function () {}, resolve: function () {} },
      allClear: hasQueue && !first, verified: 'Verificado às ' + prefs.lastSync + '. Próximo compromisso: ' + nextTxt + '.',
      rest: hasQueue ? rest : [], hasRest: hasQueue && rest.length > 0, count: String(q.length), countTxt: (scn === 'ultimo' ? 'último dado ' + prefs.lastSync : 'motivo confirmado'),
      resolved: resolved, hasResolved: hasQueue && resolved.length > 0,
      agenda: agenda, hasAgenda: agenda.length > 0, noAgenda: !agenda.length, nextTxt: nextTxt, goAgenda: go('TRE20'),
      msgFail: scn === 'parcial', msgOk: scn !== 'parcial', convs: convs, hasConvs: convs.length > 0, unreadTxt: unread ? U.plural(unread, 'não lida', 'não lidas') : 'tudo lido', goMsgs: go('TRE25'),
      drafts: drafts, hasDrafts: drafts.length > 0,
      revenue: 'Vendas em 7 dias: ' + U.money(ins.revenue) + ' · fonte ' + ins.source + ', atualizado ' + ins.updated, goMoney: go('H09'),
      visits: String(ins.visits), visitsSrc: ins.period + ' · fonte ' + ins.source + ' · ' + ins.updated, goInsights: go('H08'),
      showPro: showPro, goPro: go('FA07.B'),
      dismissPro: function () { prefs.proDismissed = true; ctx.toast('Aviso do Pro dispensado. Ele continua em Conta, quando quiser.'); },
      // primeiro uso
      starts: [
        { title: 'Convidar um aluno', sub: 'Ele aceita uma vez e o vínculo está feito', ic: 'ic ic--sm i-user-plus', go: go('REL01') },
        { title: 'Preparar meu perfil público', sub: 'Publique quando estiver pronto', ic: 'ic ic--sm i-user', go: go('@perfil', { id: 'rafael' }) },
        { title: 'Criar uma rotina', sub: 'Para usar com qualquer aluno', ic: 'ic ic--sm i-clipboard', go: go('H06') }
      ]
    };
  }
});
