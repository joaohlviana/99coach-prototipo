/* H03 · Hoje do treinador (base TRE01): primeira pendência real, fila de alunos que precisam de ação (DB.alunos[].flag),
   agenda de hoje, mensagens, rascunhos, recebimentos discretos e teste do Pro dispensável. Resolver muda a fila. */
REG.screen({
  page: 'treinador', key: 'hoje', id: 'H03', also: ['TRE01'], title: 'Hoje do treinador', mtitle: 'Hoje', nav: 'hoje', home: true, wide: true,
  normal: 'Uso recorrente',
  scens: [['novo', 'Primeiro uso · conta nova'], ['ausencia', 'Ausência confirmada · nada pendente'], ['parcial', 'Indisponibilidade parcial'], ['carregando', 'Carregando a fila'], ['falha', 'Fila não carregou'], ['ultimo', 'Consulta parcial · último dado confirmado'], ['semia', 'IA indisponível sem bloquear ações']],
  vals: function (ctx) {
    var T = window.T1, ui = ctx.ui, scn = ctx.scn, t = DB.trainer, prefs = DB.t1_prefs;
    // ---------- conta real: fila de trabalho só com fatos do servidor (plano TRE01: trabalho antes de números) ----------
    var C = window.CONTA;
    if (C && C.session() && !document.documentElement.classList.contains('demo') && !scn.replace('novo', '')) {
      var L = C.cachedLinks().filter(function (l) { return l.mine === 'treinador'; });
      var R = (window.__myRequests || []).filter(function (r) { return r.mine === 'treinador' && r.status === 'pendente'; });
      var fn = function (n) { return String(n || 'Aluno').split(' ')[0]; };
      var dt = function (iso) { return iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : ''; };
      var open = function (l) { return function () { GO('H05', { id: 'lk_' + l.id }); }; };
      var mine = [], theirs = [];
      R.forEach(function (r) { mine.push({ name: r.studentName || 'Aluno', why: 'Pediu acompanhamento' + (r.offer ? ' · ' + r.offer : ''), when: (r.at ? 'recebido em ' + dt(r.at) : '') + (r.due ? ' · vale até ' + dt(r.due) : ''), act: 'Responder pedido', go: function () { GO('REL06'); } }); });
      L.forEach(function (l) {
        if (l.status === 'pausado') return;
        if (l.prep === 'awaiting_review') mine.push({ name: l.studentName, why: 'Respondeu a preparação', when: 'revise antes de montar o treino', act: 'Revisar respostas', go: open(l), lid: l.id });
        else if (!l.workout && l.prep !== 'awaiting_client') mine.push({ name: l.studentName, why: 'Ainda sem treino atribuído', when: 'vínculo desde ' + dt(l.since), act: 'Montar treino', go: open(l), lid: l.id });
        else if (!l.workout) theirs.push({ name: l.studentName, why: 'A preparação está com ' + fn(l.studentName), when: 'vínculo desde ' + dt(l.since), act: 'Abrir', go: open(l), lid: l.id });
      });
      // mensagens não lidas, treinos registrados nos últimos 7 dias ainda sem comentário seu, e convites aguardando aceite
      if (!ui.wkAsked) {
        ctx.setUi({ wkAsked: true });
        var idl = L.map(function (l) { return l.id; }).join(',');
        Promise.all([
          idl ? C.db('GET', 'messages?select=link_id&side=eq.aluno&read_at=is.null&link_id=in.(' + idl + ')&limit=500') : Promise.resolve({ ok: true, data: [] }),
          idl ? C.db('GET', 'sessions?select=id,link_id,submitted_at:received_at,session_comments(side)&link_id=in.(' + idl + ')&received_at=gte.' + encodeURIComponent(new Date(Date.now() - 7 * 864e5).toISOString()) + '&order=received_at.desc&limit=200') : Promise.resolve({ ok: true, data: [] }),
          C.myInvites(),
          idl ? C.db('GET', 'form_sends?select=id,link_id,title,status,sent_at,answered_at&status=in.(enviado,respondido)&link_id=in.(' + idl + ')&order=sent_at.desc&limit=100') : Promise.resolve({ ok: true, data: [] })
        ]).then(function (x) { ctx.setUi({ wk: { unread: x[0].ok ? x[0].data || [] : null, regs: x[1].ok ? x[1].data || [] : null, inv: x[2].ok ? x[2].data || [] : null, forms: x[3].ok ? x[3].data || [] : null } }); });
      }
      var wk = ui.wk || {}, byL = {}; L.forEach(function (l) { byL[l.id] = l; });
      var un = {}; (wk.unread || []).forEach(function (m) { un[m.link_id] = (un[m.link_id] || 0) + 1; });
      Object.keys(un).forEach(function (k) { if (byL[k]) mine.push({ name: byL[k].studentName, why: U.plural(un[k], 'mensagem não lida', 'mensagens não lidas'), when: 'responda pela conversa', act: 'Abrir conversa', go: function () { GO('TRE25'); }, lid: k }); });
      var seenReg = {}; (wk.regs || []).forEach(function (r) { if (seenReg[r.link_id] || !byL[r.link_id]) return; seenReg[r.link_id] = 1; if ((r.session_comments || []).some(function (c) { return c.side === 'treinador'; })) return;
        mine.push({ name: byL[r.link_id].studentName, why: 'Registrou um treino em ' + dt(r.submitted_at), when: (r.session_comments || []).length ? 'deixou um retorno para você' : 'ainda sem comentário seu', act: 'Ver registro', go: open(byL[r.link_id]), lid: r.link_id }); });
      // formulários: respondido e ainda não revisado é pendência do treinador; enviado sem resposta é do aluno
      (wk.forms || []).forEach(function (f) { if (!byL[f.link_id]) return;
        if (f.status === 'respondido') mine.push({ name: byL[f.link_id].studentName, why: 'Respondeu "' + f.title + '" em ' + dt(f.answered_at), when: 'ainda não revisado por você', act: 'Revisar resposta', go: open(byL[f.link_id]) });
        else theirs.push({ name: byL[f.link_id].studentName, why: 'Formulário "' + f.title + '" aguardando resposta', when: 'enviado em ' + dt(f.sent_at), act: 'Abrir aluno', go: open(byL[f.link_id]) }); });
      var nowT = Date.now(); (wk.inv || []).filter(function (i) { return i.status !== 'aceito' && i.status !== 'revogado' && !i.accepted_at && new Date(i.expires_at).getTime() > nowT; }).slice(0, 5)
        .forEach(function (i) { theirs.push({ name: i.recipient_name || 'Convite', why: 'Convite aguardando aceite', when: 'vale até ' + dt(i.expires_at), act: 'Ver convites', go: function () { GO('REL02'); } }); });
      var paused = L.filter(function (l) { return l.status === 'pausado'; }).length;
      var ids = L.map(function (l) { return l.id; });
      if (ids.length && !ui.apAsked) { ctx.setUi({ apAsked: true }); C.appointments(ids).then(function (r) { ctx.setUi({ appts: r.ok ? (r.data || []) : [], apErr: !r.ok }); }); }
      var today = new Date().toDateString(), nameOf = {}; L.forEach(function (l) { nameOf[l.id] = l.studentName; });
      var ag0 = (ui.appts || []).filter(function (a) { return new Date(a.starts_at).toDateString() === today; }).sort(function (a, b) { return String(a.starts_at).localeCompare(String(b.starts_at)); })
        .map(function (a) { return { when: new Date(a.starts_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), who: nameOf[a.link_id] || 'Aluno' }; });
      var st0 = (window.STORE && window.STORE.loadOnb('treinador')) || {};
      var failed = !!(C.syncFailed && C.syncFailed());
      var empty = !L.length && !R.length && !failed;
      var next = !st0.published ? { t: 'Publicar seu perfil', x: 'Só perfil publicado aparece na busca.', act: 'Ver meu cadastro', go: function () { GO('@onboarding', { flow: 'treinador' }); } }
        : { t: 'Convidar seu primeiro aluno', x: 'Ele aceita uma vez e o vínculo fica pronto. O convite vale 7 dias.', act: 'Convidar aluno', go: function () { GO('REL01'); } };
      // ----- painel completo: pendência principal, fila, mensagens e pedidos, rascunhos e resumo do negócio -----
      var ini = function (n) { return U.ini(n || 'Aluno'); };
      mine.concat(theirs).forEach(function (m) { m.ini = ini(m.name); m.peek = m.lid ? function () { ctx.setUi({ peek: m.lid, menu: '' }); } : m.go; });
      var first = mine[0] || null, rest = mine.slice(1);
      // caixa: pedidos pendentes, conversas com mensagem não lida e convites aguardando
      var box = [];
      R.forEach(function (r) { box.push({ ic: 'ic ic--xs i-clipboard', who: r.studentName || 'Aluno', text: 'Pedido de acompanhamento' + (r.offer ? ' · ' + r.offer : '') + (r.due ? ' · responder até ' + dt(r.due) : ''), act: 'Responder', go: function () { GO('REL06'); } }); });
      Object.keys(un).forEach(function (k) { if (byL[k]) box.push({ ic: 'ic ic--xs i-message', who: byL[k].studentName, text: U.plural(un[k], 'mensagem não lida', 'mensagens não lidas'), act: 'Abrir', go: function () { GO('TRE25'); } }); });
      var invW = (wk.inv || []).filter(function (i) { return i.status !== 'aceito' && i.status !== 'revogado' && !i.accepted_at && new Date(i.expires_at).getTime() > nowT; });
      invW.slice(0, 3).forEach(function (i) { box.push({ ic: 'ic ic--xs i-user-plus', who: i.recipient_name || 'Convite', text: 'Convite enviado · vale até ' + dt(i.expires_at), act: 'Ver', go: function () { GO('REL02'); } }); });
      // rascunhos da biblioteca desta conta
      var drafts = (DB.rotinas || []).filter(function (r) { return r.status === 'rascunho'; }).slice(0, 3).map(function (r) { return { title: r.name || 'Treino sem nome', sub: 'Rascunho' + (r.savedAt ? ' · salvo ' + r.savedAt : ''), go: function () { GO('TRE14', { id: r.id }); } }; });
      // resumo do negócio: só números que o servidor entrega; o que não é medido aparece como "Sem base"
      if (!ui.pvAsked) { ctx.setUi({ pvAsked: true }); C.rpc('my_profile_views', { p_days: 28 }).then(function (r) { var d = r && r.ok && r.data ? (Array.isArray(r.data) ? r.data[0] : r.data) : null; ctx.setUi({ pv: d && d.views != null ? d : { none: true } }); }); }
      var pv = ui.pv && !ui.pv.none ? ui.pv : null;
      if (!ui.capAsked) { ctx.setUi({ capAsked: true }); C.rpc('my_capacity', {}).then(function (r) { var d = r && r.ok && r.data ? (Array.isArray(r.data) ? r.data[0] : r.data) : null; ctx.setUi({ cap: d || { none: true } }); }); }
      var cap = ui.cap && !ui.cap.none ? ui.cap : null, act = L.length - paused;
      // quem está no Pro: confere a assinatura no Stripe uma vez por visita (cancelamento ou cobrança recusada voltam a conta ao Essencial)
      if (cap && cap.plan === 'pro' && !ui.proAsked) { ctx.setUi({ proAsked: true }); C.fn('pagamentos', { acao: 'pro_estado' }).then(function (r) { if (r.ok && r.data && r.data.ok && r.data.plano !== 'pro') ctx.setUi({ capAsked: false }); }); }
      var prepN = L.filter(function (l) { return l.status !== 'pausado' && l.prep === 'awaiting_review'; }).length;
      var regN = wk.regs ? wk.regs.length : null;
      var how = function (t, x) { return function () { ctx.ask({ title: t, lines: x, ok: 'Entendi', cancel: false }); }; };
      var kpis = [
        { ic: 'ic ic--sm i-users', n: String(act), suf: cap ? 'de ' + cap.limit + ' no ' + (cap.plan === 'pro' ? 'Pro' : 'Essencial') : '', l: 'Alunos ativos', x: paused ? U.plural(paused, 'pausado', 'pausados') + ' à parte' : 'Atualizado agora', ok: true, how: how('Alunos ativos', ['Vínculos ativos agora, sem contar pausados e encerrados.', 'O limite é o do seu plano.']) },
        { ic: 'ic ic--sm i-clipboard', n: String(prepN), suf: '', l: 'Preparações para revisar', x: 'Agora', ok: true, how: how('Preparações para revisar', ['Alunos que responderam a preparação e esperam a sua revisão.']) },
        { ic: 'ic ic--sm i-trend', n: regN == null ? 'Sem base' : String(regN), suf: '', l: 'Treinos registrados', x: 'Últimos 7 dias', ok: regN != null, how: how('Treinos registrados', ['Treinos que seus alunos registraram no app nos últimos 7 dias.', 'Treino feito sem registro não entra.']) },
        { ic: 'ic ic--sm i-eye', n: pv ? String(pv.views) : 'Sem base', suf: '', l: 'Aberturas do perfil', x: pv ? 'Últimos 28 dias' : 'Sem dado agora', ok: !!pv, how: how('Aberturas do perfil', ['Quantas vezes a sua página pública foi aberta nos últimos 28 dias.', 'É contagem de aberturas, não de pessoas: a mesma pessoa pode abrir mais de uma vez.', 'A contagem começou em 14/11/2026.']) }
      ].map(function (k) { k.badge = k.ok ? 'Atualizado' : 'Sem dado'; k.badgeCls = k.ok ? 'badge badge--ok' : 'badge badge--plain'; k.hasSuf = !!k.suf; k.nCls = 'hj-kpi__n' + (k.n === 'Sem base' ? ' is-txt' : ''); return k; });
      // busca de aluno pelo nome
      var qs = U.norm(ui.q || '');
      var peek = function (l) { return function () { ctx.setUi({ peek: l.id, q: '', menu: '' }); }; };
      var found = qs ? L.filter(function (l) { return U.norm(l.studentName || '').indexOf(qs) >= 0; }).slice(0, 5).map(function (l) { return { name: l.studentName, sub: 'Aluno · ' + (l.status === 'pausado' ? 'pausado' : 'ativo desde ' + dt(l.since)), go: peek(l) }; })
        .concat((DB.rotinas || []).filter(function (r) { return U.norm(r.name || '').indexOf(qs) >= 0; }).slice(0, 4).map(function (r) { return { name: r.name || 'Treino sem nome', sub: 'Treino em Conteúdo' + (r.status === 'rascunho' ? ' · rascunho' : ''), go: function () { GO('TRE14', { id: r.id }); } }; })) : [];
      // ficha rápida do aluno: resumo do vínculo sem sair de Hoje
      var pk = ui.peek ? byL[ui.peek] : null, pkPend = pk ? mine.concat(theirs).filter(function (m) { return m.lid === pk.id; }) : [];
      var PREP = { awaiting_client: 'Preparação com o aluno', awaiting_review: 'Preparação respondida, aguardando sua revisão', ready_to_assign: 'Preparação revisada, falta o treino', assigned: 'Treino atribuído' };
      var pkV = pk ? { name: pk.studentName, ini: ini(pk.studentName), st: pk.status === 'pausado' ? 'Pausado' : 'Ativo', stCls: pk.status === 'pausado' ? 'badge badge--warn' : 'badge badge--ok',
        rows: [['Vínculo', 'desde ' + dt(pk.since) + (pk.origin === 'convite' ? ' · por convite' : ' · por pedido')], ['Preparação', PREP[pk.prep] || 'Sem preparação'], ['Treino', pk.workout ? pk.workout.title + ' · versão ' + pk.workout.version : 'Nenhum treino atribuído'], ['Mensagens', un[pk.id] ? U.plural(un[pk.id], 'não lida', 'não lidas') : 'Nenhuma não lida']].map(function (r) { return { k: r[0], v: r[1] }; }),
        pend: pkPend.map(function (m) { return { x: m.why + (m.when ? ' · ' + m.when : '') }; }), hasPend: pkPend.length > 0,
        open: function () { ctx.setUi({ peek: '' }); GO('H05', { id: 'lk_' + pk.id }); }, chat: function () { ctx.setUi({ peek: '' }); GO('TRE25'); } } : { name: '', ini: '', st: '', stCls: '', rows: [], pend: [], hasPend: false, open: function () {}, chat: function () {} };
      var nm = String(st0.name || t.name || '').trim();
      var menu = function (k) { return function () { ctx.setUi({ menu: ui.menu === k ? '' : k }); }; };
      var pick = function (to, p) { return function () { ctx.setUi({ menu: '' }); GO(to, p || {}); }; };
      var pub = function () {
        ctx.setUi({ menu: '' });
        C.db('GET', 'trainers?select=slug,status&user_id=eq.' + encodeURIComponent((C.user() || {}).id || '')).then(function (r) {
          var x = r.ok && r.data && r.data[0];
          if (x && x.status === 'publicado') location.href = '/treinador/' + encodeURIComponent(x.slug);
          else ctx.toast(r.ok ? 'Seu perfil ainda não está publicado. Publique pelo cadastro.' : 'Não foi possível consultar agora. Tente de novo.');
        });
      };
      return {
        isNew: false, notNew: false, real: true, date: window.TODAY(), hello: 'Olá, ' + fn(st0.name || t.first),
        rSub: failed ? 'Não foi possível atualizar agora. A lista abaixo pode estar desatualizada.' : (mine.length ? U.plural(mine.length, 'pendência sua', 'pendências suas') + ' agora' : (empty ? 'Sua conta está pronta.' : 'Tudo em dia: nada depende de você agora.')),
        q: ui.q || '', setQ: function (e) { ctx.setUi({ q: U.val(e) }); }, clearQ: function () { ctx.setUi({ q: '' }); }, qText: ui.q || '',
        found: found, hasFound: found.length > 0, noFound: !!qs && !found.length,
        hasPeek: !!pk, pk: pkV, closePeek: function () { ctx.setUi({ peek: '' }); },
        bell: pick('AVISOS'), mCriar: ui.menu === 'criar', mEu: ui.menu === 'eu', tCriar: menu('criar'), tEu: menu('eu'), xCriar: String(ui.menu === 'criar'), xEu: String(ui.menu === 'eu'),
        criar: [{ l: 'Convidar aluno', s: 'O convite vale 7 dias', ic: 'ic ic--sm i-user-plus', go: pick('REL01') }, { l: 'Criar treino', s: 'Fica salvo em Conteúdo', ic: 'ic ic--sm i-clipboard', go: pick('H06') }, { l: 'Definir horários', s: 'Disponibilidade da agenda', ic: 'ic ic--sm i-calendar', go: pick('TRE20') }],
        euNome: nm || 'Minha conta', euIni: U.ini(nm || 'Conta'), euFirst: fn(nm || 'Conta'),
        eu: [{ l: 'Ver meu perfil público', ic: 'ic ic--sm i-eye', go: pub }, { l: 'Editar perfil', ic: 'ic ic--sm i-edit', go: pick('@onboarding', { flow: 'treinador' }) }, { l: 'Conta e segurança', ic: 'ic ic--sm i-settings', go: pick('TMENU') }],
        sair: function () { ctx.setUi({ menu: '' }); GO('@sair'); },
        hasFirst: !!first, first: first || { name: '', why: '', when: '', act: '', ini: '', go: function () {}, peek: function () {} },
        mine: mine, rest: rest, hasRest: rest.length > 0, hasMine: mine.length > 0, allClear: !mine.length && !empty && !failed,
        theirs: theirs, hasTheirs: theirs.length > 0, qCount: U.plural(mine.length + theirs.length, 'aluno', 'alunos'), noQueue: !rest.length && !theirs.length,
        empty: empty, next: next,
        ag: ag0, hasAg: ag0.length > 0, noAg: !ag0.length && !ui.apErr, agErr: !!ui.apErr,
        box: box, hasBox: box.length > 0, noBox: !box.length,
        drafts: drafts, hasDrafts: drafts.length > 0, noDrafts: !drafts.length,
        kpis: kpis,
        counts: U.plural(act, 'aluno ativo', 'alunos ativos') + (paused ? ' · ' + U.plural(paused, 'pausado', 'pausados') : '') + ' · ' + U.plural(R.length, 'pedido aguardando', 'pedidos aguardando'), hasCounts: !empty,
        invite: function () { ctx.go('REL01'); }, goAlunos: function () { ctx.go('H04'); }, goAgenda: function () { ctx.go('TRE20'); }, goMsgs: function () { ctx.go('TRE25'); }, goConteudo: function () { ctx.go('H06'); }, goInsights: function () { ctx.go('H08'); }, goMoney: function () { ctx.go('H09R'); },
        refresh: function () { ctx.setUi({ apAsked: false, wkAsked: false, capAsked: false, pvAsked: false }); if (window.__refreshLinks) window.__refreshLinks(); ctx.toast('Atualizado às ' + U.now() + '.'); }
      };
    }
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
      date: window.TODAY(), hello: 'Bom dia, ' + t.first,
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
