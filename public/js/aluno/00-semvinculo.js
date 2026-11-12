/* ALU00 · Aluno com conta real. Diretrizes: pedido não é vínculo; conta criada ≠ vínculo ≠ treino; preparação depois do
   vínculo; treino exibido é o atribuído pelo treinador; registro confirmado pelo servidor; evolução só de registros
   confirmados, com origem e período (tabela acessível). Nada de treino, conversa ou evolução inventados. */
REG.screen({
  page: 'aluno', key: 'semvinculo', id: 'ALU00', title: 'Meu acompanhamento', mtitle: function (ctx) { return ({ hoje: 'Hoje', treinos: 'Treinos', evolucao: 'Evolução', mensagens: 'Mensagens' })[ctx.props.navFrom || 'hoje'] || 'Hoje'; },
  nav: function (ctx) { return ctx.props.navFrom || 'hoje'; },
  vals: function (ctx) {
    var C = window.CONTA, ui = ctx.ui, from = ctx.props.navFrom || 'hoje';
    var first = (window.STORE && (window.STORE.loadOnb('aluno') || {}).name || '').split(' ')[0];
    var link = window.ACCT && window.ACCT.myTrainer ? window.ACCT.myTrainer() : null;
    var refresh = function (msg) { return C.links().then(function () { ctx.setUi({ busy: false, asked: false }); if (msg) ctx.toast(msg); }); };
    var base = { eyebrow: first ? 'Olá, ' + first : 'Sua conta', linked: !!link, notLinked: !link,
      find: function () { GO('@home'); }, account: function () { GO('AMENU'); },
      steps: [
        { n: '1', t: 'Encontre um treinador', x: 'Compare modalidade, formato, preço com unidade e credencial.' },
        { n: '2', t: 'Peça acompanhamento ou aceite um convite', x: 'O treinador aceita o pedido. Convite chega por link e é aceito uma vez, por você.' },
        { n: '3', t: 'Comece a treinar', x: 'Treino, registro e conversa ficam aqui, no app.' }] };
    if (!link) {
      var T0 = ({ hoje: ['Ainda sem treinador', 'Seu treino do dia aparece aqui quando um treinador aceitar seu pedido de acompanhamento ou quando você aceitar o convite de um treinador.'],
        treinos: ['Nenhum treino ainda', 'Os treinos são montados pelo seu treinador depois do vínculo. Conta criada não é vínculo, e pedido enviado ainda não é treino.'],
        evolucao: ['Sua evolução começa no primeiro treino', 'Evolução vem só de treinos registrados por você, com origem e período. Sem treino registrado, não há o que mostrar.'],
        mensagens: ['Nenhuma conversa ainda', 'A conversa com o treinador abre quando o acompanhamento começa.'] })[from] || ['Ainda sem treinador', 'Esta parte aparece depois que você tiver um treinador.'];
      var reqs = (window.__myRequests || []).filter(function (r) { return r.mine === 'aluno'; });
      var RS = { pendente: 'Aguardando resposta', recusado: 'Recusado', expirado: 'Expirou sem resposta', cancelado: 'Cancelado', aceito: 'Aceito' };
      // falha de leitura não é "sem treinador"; acompanhamento encerrado continua visível como histórico
      if (C && C.syncFailed && C.syncFailed()) T0 = ['Não foi possível carregar seu acompanhamento', 'A conexão com o servidor falhou. Isso não quer dizer que você está sem treinador: tente de novo em instantes.'];
      var ended = C && C.endedLinks ? C.endedLinks().filter(function (l) { return l.mine === 'aluno'; }) : [];
      if (ended.length && !(C.syncFailed && C.syncFailed())) {
        T0 = [from === 'evolucao' ? 'Seu histórico' : 'Acompanhamento encerrado', 'O acompanhamento com ' + (ended[0].trainerName || 'seu treinador') + ' foi encerrado. Seus registros continuam aqui; para treinar de novo, procure um treinador ou aceite um convite.'];
        if (!ui.endAsked) { ctx.setUi({ endAsked: true }); Promise.all(ended.map(function (l) { return C.sessions(l.id); })).then(function (rs) { var n = {}, all = []; rs.forEach(function (r, i) { var ok = r.ok ? (r.data || []).filter(function (x) { return x.submitted_at; }) : null; n[ended[i].id] = ok ? ok.length : null; (ok || []).forEach(function (x) { x.__t = ended[i].trainerName || 'Treinador'; all.push(x); }); }); ctx.setUi({ endN: n, endS: all }); }); }
      }
      var endItems = ended.map(function (l) { var n = (ui.endN || {})[l.id]; return { canCancel: false, t: l.trainerName || 'Treinador', x: 'Encerrado · começou em ' + new Date(l.since).toLocaleDateString('pt-BR') + (n == null ? '' : ' · ' + U.plural(n, 'treino registrado', 'treinos registrados')) + (l.workout ? ' · último treino: ' + l.workout.title : '') }; });
      var reqItems = reqs.map(function (r) { return { t: r.trainerName || 'Treinador', x: (RS[r.status] || r.status) + ' · enviado em ' + new Date(r.at).toLocaleDateString('pt-BR') + (r.status === 'pendente' && r.due ? ' · o treinador responde até ' + new Date(r.due).toLocaleDateString('pt-BR') : '') + (r.offer ? ' · ' + r.offer : '') + (r.status === 'recusado' && r.reason ? ' · motivo: “' + r.reason + '”' : ''),
        canCancel: r.status === 'pendente', cancel: function () { ctx.ask({ title: 'Cancelar o pedido?', lines: ['O pedido para ' + (r.trainerName || 'o treinador') + ' deixa de valer. Você pode pedir de novo depois.'], ok: 'Cancelar pedido', cancel: 'Manter pedido', onOk: function () { C.cancelRequest(r.id).then(function (x) { if (!x.ok) return ctx.toast('Não foi possível cancelar: ' + (x.msg || x.status || 'sem conexão') + '.'); ctx.toast('Pedido cancelado.'); if (window.__refreshLinks) window.__refreshLinks(); setTimeout(function () { ctx.setUi({ v: (ui.v || 0) + 1 }); }, 700); }); } }); } }; });
      // histórico do acompanhamento encerrado: cada treino registrado abre com o que foi feito e os comentários
      var endRegs = (ui.endS || []).slice().sort(function (a, b) { return String(b.submitted_at).localeCompare(String(a.submitted_at)); }).map(function (x) {
        var by = {}; (x.set_logs || []).forEach(function (l) { var k = l.exercise_name || l.exercise_id; (by[k] = by[k] || []).push(l); });
        var open = ui.endOpenId === x.id;
        return { when: new Date(x.submitted_at).toLocaleDateString('pt-BR'), who: 'com ' + x.__t, n: U.plural((x.set_logs || []).length, 'série', 'séries'), open: open, toggle: function () { ctx.setUi({ endOpenId: open ? '' : x.id }); }, toggleLabel: open ? 'Fechar' : 'Ver registro',
          rows: Object.keys(by).map(function (k) { return { t: k + ' — ' + by[k].sort(function (a, b) { return a.set_no - b.set_no; }).map(function (l) { return l.reps + (l.load_kg != null ? '×' + String(l.load_kg).replace('.', ',') + 'kg' : ' rep'); }).join(' · ') }; })
            .concat((x.session_comments || []).map(function (c) { return { t: (c.side === 'treinador' ? x.__t : 'Você') + ': ' + c.body }; })) };
      });
      return Object.assign(base, { endRegs: endRegs, hasEndRegs: endRegs.length > 0, title: T0[0], text: T0[1], hasReqs: reqItems.length + endItems.length > 0, reqs: endItems.concat(reqItems),
        failed: !!(C && C.syncFailed && C.syncFailed()), retry: function () { if (window.__refreshLinks) window.__refreshLinks(); C.links().then(function () { ctx.setUi({ v: (ui.v || 0) + 1 }); }); } });
    }

    var tf = String(link.trainerName || 'seu treinador').split(' ')[0];
    if (C && !ui.asked) { ctx.setUi({ asked: true }); C.sessions(link.id).then(function (r) {
      // só registros enviados contam como feitos; os em andamento são rascunhos salvos no servidor
      var all = r.ok && Array.isArray(r.data) ? r.data : [], drafts = {};
      all.forEach(function (x) { if (!x.submitted_at && x.app_state && x.app_state.grid) drafts[x.session_key] = x.app_state; });
      ctx.setUi({ sess: all.filter(function (x) { return !!x.submitted_at; }), srvDrafts: drafts, sessErr: !r.ok }); }); }
    // rotina com várias sessões: o aluno escolhe qual vai fazer (a primeira ainda não registrada vem marcada)
    var w = link.workout, SS = (w && w.sessions) || [];
    var doneOf = function (x) { var k = link.id + '_v' + w.version + '_' + x.id; return (ui.sess || []).some(function (y) { return y.session_key === k; }); };
    if (ui.sx == null && window.__alunoSx && window.__alunoSx.link === link.id && SS[window.__alunoSx.i]) { ui.sx = window.__alunoSx.i; window.__alunoSx = null; }
    var sx = ui.sx != null && SS[ui.sx] ? ui.sx : Math.max(0, SS.map(function (x) { return doneOf(x); }).indexOf(false));
    var s0 = SS[sx];

    // ---------- preparação (depois do vínculo) ----------
    var P = ui.prep || Object.assign({}, link.answers || {});
    var QS = [['objetivo', 'Qual é seu objetivo agora?', 'Ex.: ganhar força sem dor no ombro'], ['dias', 'Quantos dias por semana você consegue treinar?', 'Ex.: 3 dias'], ['local', 'Onde você vai treinar?', 'Ex.: academia perto de casa']];
    var sendPrep = function () {
      if (ui.busy) return;
      var miss = QS.filter(function (q) { return !String(P[q[0]] || '').trim(); })[0];
      if (miss) return ctx.setUi({ err: 'Responda: ' + miss[1] });
      ctx.setUi({ busy: true, err: '' });
      var chain = Promise.resolve({ ok: true });
      QS.forEach(function (q, i) { chain = chain.then(function (r) { return r.ok ? C.answerPrep(link.id, q[0], String(P[q[0]]).trim(), i === QS.length - 1) : r; }); });
      chain.then(function (r) { if (!r.ok) return ctx.setUi({ busy: false, err: r.offline ? 'Sem conexão: respostas não enviadas.' : 'O servidor não recebeu: ' + (r.msg || r.status) }); refresh('Respostas enviadas a ' + tf + '.'); });
    };

    // ---------- execução (registro de séries) ----------
    // A sessão em andamento fica guardada neste aparelho até ser enviada: fechar o app não perde as marcações.
    var uid = (C && C.user() && C.user().id) || 'local';
    var dKey = function (x) { return 'c99.sessaoTreino.' + uid + '.' + link.id + '_v' + (w ? w.version : 0) + '_' + x.id; };
    // e também no servidor (save_session), para continuar em outro aparelho; o aparelho vale primeiro
    var sKey = function (x) { return link.id + '_v' + (w ? w.version : 0) + '_' + x.id; };
    var dGet = function (x) { var v = null; try { v = JSON.parse(window.localStorage.getItem(dKey(x)) || 'null'); } catch (_) {} return v || ((ui.srvDrafts || {})[sKey(x)] || null); };
    var dPut = function (x, v) {
      var localOk = true;
      try { if (v) window.localStorage.setItem(dKey(x), JSON.stringify(v)); else window.localStorage.removeItem(dKey(x)); } catch (_) { localOk = !v; }
      window.__svLocal = localOk;
      if (!v || !C || !w) return;
      window.__svState = 'salvando';
      var k = sKey(x); clearTimeout(window.__svT); window.__svT = setTimeout(function () { C.rpc('save_session', { p_link: link.id, p_key: k, p_version: w.version, p_state: v }).then(function (r) { window.__svState = r.ok ? 'servidor' : (r.offline ? 'offline' : 'erro'); window.__svAt = U.now(); ctx.setUi({ svTick: Date.now() }); }); }, 1200);
    };
    var orphan = []; try { var pre = 'c99.sessaoTreino.' + uid + '.' + link.id + '_v'; Object.keys(window.localStorage).forEach(function (k) { if (k.indexOf(pre) === 0 && w && k.indexOf(pre + w.version + '_') !== 0) orphan.push(k); }); } catch (_) {}
    var draftIdx = -1; SS.forEach(function (x, i) { if (draftIdx < 0 && !doneOf(x) && dGet(x)) draftIdx = i; });
    var draft = draftIdx >= 0 ? dGet(SS[draftIdx]) : null;
    var marked = function (g) { return g.reduce(function (n, sets) { return n + sets.filter(function (c) { return c.done; }).length; }, 0); };
    var total = function (g) { return g.reduce(function (n, sets) { return n + sets.length; }, 0); };
    // última execução confirmada de cada exercício (referência dentro da série; nunca conta como feita)
    var lastOf = function (exId) {
      var best = null;
      (ui.sess || []).forEach(function (s) { var d = s.submitted_at || s.started_at; (s.set_logs || []).forEach(function (l) { if (l.exercise_id === exId && d && (!best || d > best.d || (d === best.d && (Number(l.load_kg) || 0) > (Number(best.l.load_kg) || 0)))) best = { d: d, l: l }; }); });
      return best ? 'Última vez: ' + best.l.reps + ' rep' + (best.l.load_kg != null ? ' × ' + String(best.l.load_kg).replace('.', ',') + ' kg' : '') + ' em ' + new Date(best.d).toLocaleDateString('pt-BR') : 'Sem registro anterior deste exercício';
    };
    var ex = ui.exec;
    var start = function () {
      // realizado começa em branco: o previsto aparece como referência e só entra quando a série é marcada
      var grid = s0.items.map(function (it) { var a = []; for (var k = 0; k < it.sets; k++) a.push({ reps: '', load: '', done: false }); return a; });
      var e0 = { grid: grid, started: new Date().toISOString(), ver: w.version };
      dPut(s0, e0); ctx.setUi({ exec: e0, err: '', receipt: null, partial: false });
    };
    var setCell = function (i, k, f) { return function (e) {
      var g = JSON.parse(JSON.stringify(ex.grid)), c = g[i][k], it = s0.items[i];
      if (f === 'done') {
        c.done = !c.done;
        // marcar não preenche nada: o previsto só vira realizado se a pessoa digitar ou tocar em "Igual ao previsto"
      } else c[f] = U.val(e);
      var e1 = Object.assign({}, ex, { grid: g }); dPut(s0, e1);
      // descanso conta pelo relógio (não trava a tela nem depende de ficar com o app aberto)
      ctx.setUi({ exec: e1, partial: false, rest: f === 'done' && c.done && it.restS ? { until: Date.now() + it.restS * 1000, name: it.name } : (f === 'done' ? null : ui.rest) });
    }; };
    var resume = function () { if (draftIdx < 0) return; ctx.setUi({ sx: draftIdx, exec: draft, err: '', receipt: null, partial: false }); };
    var discard = function () {
      if (draftIdx >= 0) { var x = SS[draftIdx], k = sKey(x), sd = Object.assign({}, ui.srvDrafts || {}); delete sd[k]; dPut(x, null); if (C && w) { clearTimeout(window.__svT); C.rpc('save_session', { p_link: link.id, p_key: k, p_version: w.version, p_state: { descartado: true } }); } ctx.setUi({ srvDrafts: sd }); }
      ctx.setUi({ exec: null, err: '', v: (ui.v || 0) + 1 }); };
    var finish = function () {
      if (ui.busy) return;
      var logs = [], miss = [];
      ex.grid.forEach(function (sets, i) { sets.forEach(function (c, k) { if (c.done && String(c.reps).trim() === '') miss.push(s0.items[i].name + ' (série ' + (k + 1) + ')'); }); });
      if (miss.length) return ctx.setUi({ err: 'Faltam as repetições de ' + miss.join(', ') + '. Digite o que você fez, ou toque em "Igual ao previsto" se foi exatamente o previsto.', fillPlan: true });
      ex.grid.forEach(function (sets, i) { var it = s0.items[i]; sets.forEach(function (c, k) { if (c.done) logs.push({ item: i, set: k + 1, reps: Number(c.reps) || 0, loadKg: c.load === '' ? null : Number(String(c.load).replace(',', '.')), exerciseId: it.exerciseId, name: it.name, sub: false }); }); });
      if (!logs.length) return ctx.setUi({ err: 'Marque pelo menos uma série feita. Concluir parcialmente é permitido.' });
      // sessão incompleta: uma confirmação antes de enviar, dizendo o que fica registrado
      if (logs.length < total(ex.grid) && !ui.partial) return ctx.setUi({ partial: true, err: '' });
      var key = link.id + '_v' + w.version + '_' + s0.id;
      ctx.setUi({ busy: true, err: '' });
      clearTimeout(window.__svT);
      C.rpc('save_session', { p_link: link.id, p_key: key, p_version: w.version, p_state: ex }).then(function (sv) { return sv.ok ? C.submitSession(link.id, key, logs) : sv; }).then(function (r) {
        if (!r.ok) return ctx.setUi({ busy: false, err: r.offline ? 'Sem conexão: o registro não foi enviado. Suas marcações continuam aqui; tente de novo.' : 'O servidor não recebeu: ' + (r.msg || r.status) });
        var tot = total(ex.grid);
        dPut(s0, null);
        // recibo que fica na tela (não é só um aviso que some): o que foi recebido pelo servidor
        ctx.setUi({ busy: false, exec: null, asked: false, sx: null, partial: false, rest: null, receipt: { title: s0.title || w.title, n: logs.length, tot: tot, at: U.now(), key: key } });
      });
    };

    // ---------- evolução (só registros confirmados) ----------
    var sess = (ui.sess || []).slice().sort(function (a, b) { return String(a.submitted_at || a.started_at).localeCompare(String(b.submitted_at || b.started_at)); });
    var hist = sess.map(function (s) {
      var sets = s.set_logs || [], vol = sets.reduce(function (n, x) { return n + (Number(x.reps) || 0) * (Number(x.load_kg) || 0); }, 0), d = s.submitted_at || s.started_at;
      var cm = (s.session_comments || []).filter(function (c) { return c.side === 'treinador'; }).map(function (c) { return c.body; }).join(' · ');
      return { cm: cm, hasCm: !!cm, when: d ? new Date(d).toLocaleDateString('pt-BR') : '—', sets: String(sets.length), reps: String(sets.reduce(function (n, x) { return n + (Number(x.reps) || 0); }, 0)), vol: vol ? Math.round(vol).toLocaleString('pt-BR') : '—' };
    });
    var period = hist.length ? hist[0].when + ' a ' + hist[hist.length - 1].when : '';
    // período escolhido (4 ou 12 semanas) e leitura da semana, só com o que foi confirmado
    var weeks = ui.weeks || 4, since = Date.now() - weeks * 7 * 864e5, wk = Date.now() - 7 * 864e5;
    var tsOf = function (s) { return new Date(s.submitted_at || s.started_at || 0).getTime(); };
    var inP = sess.filter(function (s) { return tsOf(s) >= since; });
    var weekN = sess.filter(function (s) { return tsOf(s) >= wk; }).length;
    var weekTxt0 = weekN ? U.plural(weekN, 'sessão registrada', 'sessões registradas') + ' nos últimos 7 dias' : 'Nenhuma sessão registrada nos últimos 7 dias';
    var fullOf = function (s) { var m = /_v(\d+)_(.+)$/.exec(s.session_key || ''); var x = m && w && String(w.version) === m[1] ? SS.filter(function (y) { return y.id === m[2]; })[0] : null; if (!x) return null; var t2 = x.items.reduce(function (n, it) { return n + it.sets; }, 0); return (s.set_logs || []).length >= t2; };
    var partialN = inP.filter(function (s) { return fullOf(s) === false; }).length;
    // exercícios acompanhados: os mais registrados, com o último resultado e o anterior compatível (mesmo exercício)
    var byEx = {};
    sess.forEach(function (s) { var d = s.submitted_at || s.started_at; (s.set_logs || []).forEach(function (l) { var k = l.exercise_id || l.exercise_name; if (!k) return; var o = byEx[k] || (byEx[k] = { name: l.exercise_name || k, days: {} }); var day = String(d).slice(0, 10); var b = o.days[day]; if (!b || (Number(l.load_kg) || 0) > (Number(b.load_kg) || 0) || ((Number(l.load_kg) || 0) === (Number(b.load_kg) || 0) && (Number(l.reps) || 0) > (Number(b.reps) || 0))) o.days[day] = l; }); });
    var fmtSet = function (l) { return l.reps + ' rep' + (l.load_kg != null ? ' × ' + String(l.load_kg).replace('.', ',') + ' kg' : ''); };
    var fmtDay = function (d) { return d.slice(8, 10) + '/' + d.slice(5, 7); };
    var tracked = Object.keys(byEx).map(function (k) { var o = byEx[k], ds = Object.keys(o.days).sort(); return { name: o.name, n: ds.length, last: fmtSet(o.days[ds[ds.length - 1]]) + ' em ' + fmtDay(ds[ds.length - 1]), prev: ds.length > 1 ? 'Antes: ' + fmtSet(o.days[ds[ds.length - 2]]) + ' em ' + fmtDay(ds[ds.length - 2]) : 'Sem registro anterior para comparar' }; }).sort(function (a, b) { return b.n - a.n; }).slice(0, 3);

    var doneKey = w && s0 ? link.id + '_v' + w.version + '_' + s0.id : '';
    var doneNow = !!doneKey && (ui.sess || []).some(function (s) { return s.session_key === doneKey; });
    var state = !w ? (link.prep === 'awaiting_client' ? 'prep' : 'wait') : (ex ? 'exec' : 'ready');
    var paused = link.status === 'pausado';
    // recado do treinador: última mensagem dele ainda não lida (só o que o servidor devolveu)
    if (C && !ui.msgAsked) { ctx.setUi({ msgAsked: true }); C.messages(link.id).then(function (r) { ctx.setUi({ msgs: r.ok ? (r.data || []) : null }); }); }
    var note = null; (ui.msgs || []).forEach(function (m) { if (m.side === 'treinador' && !m.read_at) note = m; });
    var TT = {
      prep: [link.prepNote ? tf + ' pediu um complemento' : 'Você e ' + tf + ' estão conectados', link.prepNote ? '“' + link.prepNote + '” Ajuste suas respostas e envie de novo.' : 'Antes do primeiro treino, ' + tf + ' precisa conhecer sua rotina. São 3 perguntas rápidas. Dor ou lesão você conta direto para ' + tf + ' na conversa: não guardamos isso no formulário.'],
      wait: ['Treino em preparação', tf + ' recebeu suas respostas e está montando seu treino. Ele aparece aqui quando for atribuído.'],
      ready: [w ? w.title : '', paused ? 'Acompanhamento pausado por ' + tf + ' ou por você. O treino e o histórico continuam aqui; sessões novas voltam quando o acompanhamento for retomado.' : w ? 'Versão ' + w.version + ' · atribuído por ' + tf + (w.assignedAt ? ' em ' + new Date(w.assignedAt).toLocaleDateString('pt-BR') : '') : ''],
      exec: [w ? w.title : '', 'Marque cada série feita. Ajuste repetições e carga ao que você fez de verdade.']
    };
    // ---------- agenda: horários livres do treinador (só com vínculo ativo) ----------
    var TZ = ((ui.appts || [])[0] && (ui.appts || [])[0].tz) || 'America/Sao_Paulo', fmtSlot = function (iso) { return new Date(iso).toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: TZ }); };
    if (C && !ui.apAsked) { ctx.setUi({ apAsked: true }); C.appointments([link.id]).then(function (r) { ctx.setUi({ appts: (r.ok && r.data) || [] }); }); }
    var loadSlots = function () { ctx.setUi({ slotsLoading: true, slotsErr: '' }); C.freeSlots(link.id, 14).then(function (r) { ctx.setUi({ slotsLoading: false, slots: r.ok ? (r.data || []) : [], slotsErr: r.ok ? '' : (r.offline ? 'Sem conexão.' : (r.msg || 'Não deu para carregar.')), slotsOpen: true }); }); };
    var OUTB = { conflito: 'Esse horário acabou de ser ocupado. Escolha outro.', fora_da_disponibilidade: 'Fora da disponibilidade do treinador.', horario_passado: 'Esse horário já passou.', vinculo_pausado: 'O acompanhamento está pausado.', vinculo_encerrado: 'O acompanhamento foi encerrado.', conta_bloqueada: 'Conta bloqueada.' };
    var book = function (s) { return function () { if (ui.busy) return; ctx.setUi({ busy: true }); C.bookSlot(link.id, s.starts_at).then(function (r) {
      var d = r.ok && r.data ? (Array.isArray(r.data) ? r.data[0] : r.data) : null, out = d && (d.outcome || d.status);
      ctx.setUi({ busy: false });
      if (!r.ok || (out && OUTB[out])) return ctx.toast(OUTB[out] || ('Não foi possível marcar: ' + (r.msg || r.status)));
      var from0 = ui.moveFrom;
      ctx.setUi({ slotsOpen: false, apAsked: false, moveFrom: null, apReceipt: (from0 ? 'Remarcado para ' : 'Horário marcado: ') + fmtSlot(s.starts_at) + '. O horário aparece na agenda de ' + tf + '.' });
      if (from0) C.cancelAppointment(from0, 'remarcado').then(function (x) { if (!x.ok) ctx.toast('O novo horário foi marcado, mas o antigo não foi cancelado: cancele-o na lista.'); ctx.setUi({ apAsked: false }); });
    }); }; };
    var appts = (ui.appts || []).map(function (a) { return { when: fmtSlot(a.starts_at), by: a.booked_by === 'aluno' ? 'marcado por você' : 'marcado por ' + tf,
      cancel: function () { ctx.ask({ title: 'Cancelar o horário de ' + fmtSlot(a.starts_at) + '?', lines: ['O horário volta a ficar livre na agenda de ' + tf + '.', 'Cancelar um horário não muda o acompanhamento nem o treino.'], ok: 'Cancelar horário', cancel: 'Manter horário', onOk: function () {
        C.cancelAppointment(a.id, 'aluno').then(function (r) { if (!r.ok) return ctx.toast('Não foi possível cancelar: ' + (r.msg || r.status || 'sem conexão') + '. O horário continua marcado.'); ctx.setUi({ apAsked: false, apReceipt: 'Horário de ' + fmtSlot(a.starts_at) + ' cancelado às ' + U.now() + '. Ele saiu da agenda de ' + tf + '.' }); }); } }); },
      // remarcar = escolher outro horário livre; o atual só é cancelado depois que o novo for confirmado
      reschedule: function () { ctx.setUi({ moveFrom: a.id }); loadSlots(); } }; });
    var slots = (ui.slots || []).slice(0, 12).map(function (s) { return { when: fmtSlot(s.starts_at), book: book(s) }; });
    var apExtra = { apReceipt: ui.apReceipt || '', hasApReceipt: !!ui.apReceipt, moving: !!ui.moveFrom, tzTxt: 'Horários no fuso ' + (TZ === 'America/Sao_Paulo' ? 'de Brasília' : TZ.replace('_', ' ')) + '.' };
    var showEvo = from === 'evolucao', showMsg = from === 'mensagens';
    var t = showEvo ? ['Evolução', hist.length ? 'Registros confirmados com ' + tf + ' · ' + period : 'Sua evolução começa no primeiro treino registrado.'] : (showMsg ? ['Conversa com ' + tf, 'Fale sobre o treino, dúvidas ou mudanças de rotina. ' + tf + ' responde por aqui.'] : TT[state]);
    return Object.assign(base, {
      appts: appts, hasAppts: appts.length > 0, slots: slots, hasSlots: slots.length > 0, slotsOpen: !!ui.slotsOpen, noSlots: !!ui.slotsOpen && !slots.length && !ui.slotsLoading && !ui.slotsErr,
      slotsErr: ui.slotsErr || '', hasSlotsErr: !!ui.slotsErr, loadSlots: loadSlots, slotsLabel: ui.slotsLoading ? 'Carregando…' : 'Ver horários livres', tfName: tf,
      // Treinos: a rotina sessão por sessão e o histórico, cada registro abrindo o previsto × realizado
      isTreinos: from === 'treinos' && !ex, notTreinos: !(from === 'treinos' && !ex),
      sessList: w ? SS.map(function (x, i) { var k = link.id + '_v' + w.version + '_' + x.id, last = (ui.sess || []).filter(function (y) { return y.session_key === k; }).map(function (y) { return y.submitted_at; }).sort().pop();
        return { title: x.title || ('Sessão ' + (i + 1)), sub: U.plural((x.items || []).length, 'exercício', 'exercícios') + ' · ~' + (x.estMin || 0) + ' min · ' + (last ? 'feita em ' + new Date(last).toLocaleDateString('pt-BR') : 'ainda não feita nesta versão'), pick: function () { window.__alunoSx = { link: link.id, i: i }; GO('H10'); } }; }) : [],
      hasSessList: !!w && SS.length > 0,
      regs: (ui.sess || []).slice().sort(function (a, b) { return String(b.submitted_at).localeCompare(String(a.submitted_at)); }).map(function (x) {
        var m = /_v(\d+)_(.+)$/.exec(x.session_key || ''), sv = m && w && String(w.version) === m[1] ? SS.filter(function (y) { return y.id === m[2]; })[0] : null, open = ui.regOpen === x.id;
        var by = {}; (x.set_logs || []).forEach(function (l) { var k = l.exercise_name || l.exercise_id; (by[k] = by[k] || []).push(l); });
        var rows = Object.keys(by).map(function (k) { var it = sv ? (sv.items || []).filter(function (y) { return y.exerciseId === by[k][0].exercise_id || y.name === k; })[0] : null;
          return { ex: k, plan: it ? 'previsto ' + it.sets + ' × ' + it.reps + (it.loadKg != null ? ' · ' + String(it.loadKg).replace('.', ',') + ' kg' : '') : 'previsto: versão anterior do treino', did: 'feito ' + by[k].sort(function (a, b) { return a.set_no - b.set_no; }).map(function (l) { return l.reps + (l.load_kg != null ? '×' + String(l.load_kg).replace('.', ',') + 'kg' : ' rep'); }).join(' · ') }; });
        var cm = (x.session_comments || []).map(function (c) { return { who: c.side === 'treinador' ? tf : 'Você', body: c.body }; });
        return { when: new Date(x.submitted_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }), name: sv ? sv.title : 'Sessão registrada', n: U.plural((x.set_logs || []).length, 'série', 'séries'),
          open: open, toggle: function () { ctx.setUi({ regOpen: open ? '' : x.id }); }, toggleLabel: open ? 'Fechar' : 'Ver registro', rows: rows, cms: cm, hasCms: cm.length > 0 };
      }),
      hasRegs: (ui.sess || []).length > 0, noRegs: !(ui.sess || []).length && !ui.sessErr, goTreinos: function () { GO('ALU06'); },
      manyT: window.ACCT.myLinks().length > 1, tChoices: window.ACCT.myLinks().map(function (l) { var on = l.id === link.id; return { label: (l.trainerName || 'Treinador') + (l.status === 'pausado' ? ' (pausado)' : ''), on: String(on), cls: 'chip' + (on ? ' is-on' : ''), pick: function () { window.ACCT.pickTrainer(l.id); ctx.setUi({ asked: false, sess: null, msgs: null, msgAsked: false, blk: null, msgDraft: null, sx: null, exec: null, receipt: null, apAsked: false, appts: null, slots: null, slotsOpen: false, moveFrom: null, apReceipt: '', prep: null, srvDrafts: null, rest: null, regOpen: '', fbDone: false, fbNote: '', fbEff: null, chAct: '', endOpen: false, err: '', v: (ui.v || 0) + 1 }); } }; }),
      apReceipt: apExtra.apReceipt, hasApReceipt: apExtra.hasApReceipt, moving: apExtra.moving, tzTxt: apExtra.tzTxt, stopMove: function () { ctx.setUi({ moveFrom: null, slotsOpen: false }); },
      title: t[0], text: t[1], showMain: !showEvo && !showMsg, showEvo: showEvo, showMsg: showMsg, chat: showMsg && window.CHAT ? window.CHAT(ctx, link.id, 'aluno', tf) : {},
      isPrep: state === 'prep', isWait: state === 'wait', isReady: state === 'ready', isExec: state === 'exec',
      qs: QS.map(function (q) { return { id: 'pq-' + q[0], q: q[1], ph: q[2], v: P[q[0]] || '', set: function (e) { var o = Object.assign({}, P); o[q[0]] = U.val(e).slice(0, 120); ctx.setUi({ prep: o, err: '' }); } }; }),
      sendPrep: sendPrep, sendLabel: ui.busy ? 'Enviando…' : 'Enviar respostas',
      items: s0 ? s0.items.map(function (it) { return { name: it.name, rx: it.sets + ' × ' + it.reps + (it.loadKg != null ? ' · ' + String(it.loadKg).replace('.', ',') + ' kg' : '') + ' · descanso ' + it.restS + ' s' }; }) : [],
      wTitle: w ? w.title : '', sTitle: s0 ? (s0.title || '') : '', manySess: SS.length > 1 && !ex,
      sessOpts: SS.map(function (x, i) { var on = i === sx; return { label: (x.title || ('Sessão ' + (i + 1))) + (doneOf(x) ? ' · feita' : ''), on: String(on), cls: 'chip' + (on ? ' is-on' : ''), pick: function () { ctx.setUi({ sx: i, err: '' }); } }; }),
      estMin: s0 ? 'Cerca de ' + s0.estMin + ' min' : '', start: start, doneNow: doneNow, canStart: !doneNow && !paused,
      isPaused: paused && !ex,
      fm: window.FORMS ? window.FORMS.student(ctx, link, !ex && !showEvo && !showMsg && link.status !== 'encerrado') : { show: false },
      hasNote: !!note && !ex && !showEvo && !showMsg, noteFrom: 'Recado de ' + tf, noteTxt: note ? String(note.body).slice(0, 220) : '', noteWhen: note ? new Date(note.created_at).toLocaleDateString('pt-BR') : '', openChat: function () { GO('ALU05'); },
      // semana no Hoje: só contagem confirmada, sem meta inventada
      weekLine: hist.length ? weekTxt0 : '', hasWeekLine: hist.length > 0 && !ex,
      // meu treinador: situação do vínculo e o que muda ao encerrar
      trainerLine: (link.trainerName || 'Seu treinador') + ' · ' + (paused ? 'acompanhamento pausado' : 'acompanhamento ativo') + ' desde ' + new Date(link.since).toLocaleDateString('pt-BR') + ' · ' + (link.origin === 'convite' ? 'por convite' : 'por pedido'),
      endInfo: ['Encerrar é definitivo: o acompanhamento com ' + tf + ' termina e a vaga dele é liberada.', 'Seu histórico de treinos continua visível para você.', 'O treino atribuído deixa de receber novas versões.', 'Para voltar a treinar com ' + tf + ', é preciso um novo pedido ou convite.'].map(function (x) { return { x: x }; }),
      showEnd: !!ui.endOpen, toggleEnd: function () { ctx.setUi({ endOpen: !ui.endOpen, chAct: '' }); },
      // o aluno também pausa, retoma e encerra (sem precisar pedir ao treinador)
      pauseInfo: ['Pausar mantém o treino, o histórico e a conversa.', 'Sessões novas não começam até retomar.', 'A vaga continua sua; ' + tf + ' vê a pausa no painel.'].map(function (x) { return { x: x }; }),
      isActive: link.status === 'ativo', isPausedL: link.status === 'pausado', chOpen: !!ui.chAct, chPause: ui.chAct === 'pausar', chEnd: ui.chAct === 'encerrar',
      openPause: function () { ctx.setUi({ chAct: 'pausar', chWhy: 'ferias' }); }, openEndL: function () { ctx.setUi({ chAct: 'encerrar', chWhy: 'objetivo_concluido' }); }, chCancel: function () { ctx.setUi({ chAct: '' }); },
      chReasons: (ui.chAct === 'encerrar' ? [['objetivo_concluido', 'Objetivo concluído'], ['agenda', 'Agenda'], ['financeiro', 'Financeiro'], ['mudanca', 'Mudança'], ['insatisfacao', 'Insatisfação'], ['outro', 'Outro']] : [['ferias', 'Férias'], ['lesao', 'Lesão'], ['agenda', 'Agenda'], ['financeiro', 'Financeiro'], ['outro', 'Outro']]).map(function (r) { var on = ui.chWhy === r[0]; return { label: r[1], on: String(on), cls: 'chip' + (on ? ' is-on' : ''), pick: function () { ctx.setUi({ chWhy: r[0] }); } }; }),
      chLabel: ui.busy ? 'Salvando…' : (ui.chAct === 'encerrar' ? 'Encerrar acompanhamento' : 'Pausar acompanhamento'),
      chGo: function () { if (ui.busy) return; ctx.setUi({ busy: true }); C.changeLink(link.id, ui.chAct, ui.chWhy).then(function (r) { if (!r.ok) { ctx.setUi({ busy: false }); return ctx.toast('O servidor não registrou: ' + (r.msg || r.status || 'sem conexão') + '. Nada mudou.'); } var end = ui.chAct === 'encerrar'; ctx.setUi({ chAct: '', endOpen: false }); if (window.__refreshLinks) window.__refreshLinks(); refresh(end ? 'Acompanhamento encerrado. Seu histórico continua aqui.' : 'Acompanhamento pausado. Retome quando quiser.'); }); },
      resumeL: function () { if (ui.busy) return; ctx.setUi({ busy: true }); C.changeLink(link.id, 'retomar', 'outro').then(function (r) { if (!r.ok) { ctx.setUi({ busy: false }); return ctx.toast('O servidor não registrou: ' + (r.msg || r.status || 'sem conexão') + '.'); } refresh('Acompanhamento retomado.'); }); }, openProfile: function () { if (link.trainerSlug && window.NAV) window.NAV.go('perfil', { id: link.trainerSlug }, null); },
      canProfile: !!(link.trainerSlug && window.REAL && window.REAL.has(link.trainerSlug)),
      grid: ex ? ex.grid.map(function (sets, i) { var it = s0.items[i]; return { note: it.notes ? 'Nota de ' + tf + ': ' + it.notes : '', hasNote: !!it.notes, name: it.name, rx: 'previsto ' + it.sets + ' × ' + it.reps + (it.loadKg != null ? ' · ' + String(it.loadKg).replace('.', ',') + ' kg' : ''), last: lastOf(it.exerciseId), sets: sets.map(function (c, k) { return { n: 'Série ' + (k + 1), phR: String(parseInt(it.reps, 10) || ''), phL: it.loadKg == null ? '' : String(it.loadKg).replace('.', ','), reps: c.reps, load: c.load, done: c.done, doneOn: String(c.done), doneCls: 'check' + (c.done ? ' is-on' : ''), idR: 'ex-r' + i + '-' + k, idL: 'ex-l' + i + '-' + k, setReps: setCell(i, k, 'reps'), setLoad: setCell(i, k, 'load'), toggle: setCell(i, k, 'done') }; }) }; }) : [],
      finish: finish, finishLabel: ui.busy ? 'Enviando…' : (ui.partial ? 'Encerrar e enviar o que fiz' : 'Concluir sessão'),
      // pausar guarda as marcações neste aparelho; descartar apaga
      cancel: function () { ctx.setUi({ exec: null, err: '', partial: false }); }, discard: function () { var k9 = sKey(s0), sd9 = Object.assign({}, ui.srvDrafts || {}); delete sd9[k9]; dPut(s0, null); clearTimeout(window.__svT); if (C && w) C.rpc('save_session', { p_link: link.id, p_key: k9, p_version: w.version, p_state: { descartado: true } }); ctx.setUi({ exec: null, err: '', partial: false, srvDrafts: sd9, rest: null }); },
      isPartial: !!ui.partial && !!ex, partialTxt: ex ? marked(ex.grid) + ' de ' + total(ex.grid) + ' séries marcadas. As não marcadas ficam sem registro; nada é inventado.' : '', backPartial: function () { ctx.setUi({ partial: false }); },
      hasRest: !!(ex && ui.rest && (ui.rest.paused != null || ui.rest.until > Date.now() - 60000)), restUntil: ui.rest && ui.rest.paused == null ? String(ui.rest.until) : '', restName: ui.rest ? ui.rest.name : '', skipRest: function () { ctx.setUi({ rest: null }); },
      restPaused: !!(ui.rest && ui.rest.paused != null), restRunning: !!(ui.rest && ui.rest.paused == null),
      restPausedTxt: ui.rest && ui.rest.paused != null ? 'Descanso pausado: ' + Math.floor(ui.rest.paused / 60) + ':' + ('0' + (ui.rest.paused % 60)).slice(-2) : '',
      pauseRest: function () { if (!ui.rest) return; ctx.setUi({ rest: { name: ui.rest.name, paused: Math.max(0, Math.ceil((ui.rest.until - Date.now()) / 1000)) } }); },
      resumeRest: function () { if (!ui.rest) return; ctx.setUi({ rest: { name: ui.rest.name, until: Date.now() + (ui.rest.paused || 0) * 1000 } }); },
      addRest: function () { if (!ui.rest) return; ctx.setUi({ rest: ui.rest.paused != null ? { name: ui.rest.name, paused: ui.rest.paused + 30 } : { name: ui.rest.name, until: ui.rest.until + 30000 } }); },
      hasOrphan: orphan.length > 0 && !ex, orphanTxt: tf + ' publicou uma versão nova do treino enquanto você tinha um treino em andamento. As marcações antigas não valem para a versão nova e não foram enviadas.',
      dropOrphan: function () { orphan.forEach(function (k) { try { window.localStorage.removeItem(k); } catch (_) {} }); ctx.setUi({ v: (ui.v || 0) + 1 }); },
      svTxt: !window.__svLocal && window.__svLocal !== undefined ? 'Atenção: este aparelho está sem espaço; as marcações não ficaram guardadas aqui.' : ({ salvando: 'Salvando…', servidor: 'Salvo também na sua conta às ' + (window.__svAt || ''), offline: 'Sem conexão: salvo só neste aparelho', erro: 'Não salvou na conta; continua neste aparelho' })[window.__svState] || 'Guardado neste aparelho',
      // retorno do aluno ao concluir: comentário curto e esforço opcional (vai para o treinador)
      fbEfforts: [2, 4, 6, 8, 10].map(function (n) { var on = ui.fbEff === n; return { label: n + '/10', on: String(on), cls: 'chip' + (on ? ' is-on' : ''), pick: function () { ctx.setUi({ fbEff: on ? null : n }); } }; }),
      fbNote: ui.fbNote || '', setFbNote: function (e) { ctx.setUi({ fbNote: U.val(e), fbErr: '' }); }, fbDone: !!ui.fbDone, fbOpen: !ui.fbDone, fbErr: ui.fbErr || '', hasFbErr: !!ui.fbErr, fbLabel: ui.fbBusy ? 'Enviando…' : 'Enviar retorno para ' + tf,
      sendFb: function () {
        var note = String(ui.fbNote || '').trim(); if (!note && !ui.fbEff) return ctx.setUi({ fbErr: 'Escreva um comentário ou escolha o esforço.' });
        if (ui.fbBusy || !ui.receipt) return; ctx.setUi({ fbBusy: true, fbErr: '' });
        C.sessions(link.id).then(function (r) {
          var row = r.ok ? (r.data || []).filter(function (x) { return x.session_key === ui.receipt.key && x.submitted_at; })[0] : null;
          if (!row) return ctx.setUi({ fbBusy: false, fbErr: 'Não encontramos o registro no servidor ainda. Tente de novo em instantes.' });
          return C.rpc('student_session_feedback', { p_session: row.id, p_body: note || null, p_effort: ui.fbEff || null, p_idem: 'retorno:' + row.id }).then(function (x) { if (!x.ok) return ctx.setUi({ fbBusy: false, fbErr: 'Não enviado: ' + (x.msg || x.status || 'sem conexão') + '.' }); ctx.setUi({ fbBusy: false, fbDone: true }); ctx.toast('Retorno enviado para ' + tf + '.'); });
        });
      },
      progress: ex ? marked(ex.grid) + ' de ' + total(ex.grid) + ' séries marcadas · guardado neste aparelho até você enviar' : '',
      hasDraft: !!draft && !ex && state !== 'exec', draftTitle: draft ? 'Continuar ' + (SS[draftIdx].title || 'treino') : '', draftTxt: draft ? marked(draft.grid) + ' de ' + total(draft.grid) + ' séries marcadas · guardado só neste aparelho, ainda não enviado' : '', resume: resume, discardDraft: discard,
      hasReceipt: !!ui.receipt && !ex, rcTitle: ui.receipt ? 'Registro recebido pelo servidor às ' + ui.receipt.at : '', rcTxt: ui.receipt ? ui.receipt.title + ' · ' + (ui.receipt.n < ui.receipt.tot ? ui.receipt.n + ' de ' + ui.receipt.tot + ' séries registradas (sessão parcial)' : U.plural(ui.receipt.n, 'série registrada', 'séries registradas')) + '. ' + tf + ' vê no painel; isso não quer dizer que já revisou.' : '',
      goEvo: function () { ctx.setUi({ receipt: null }); GO('H10E'); }, goHoje: function () { ctx.setUi({ receipt: null }); GO('H10'); },
      err: ui.err || '', hasErr: !!ui.err, fillPlan: !!ui.fillPlan && !!ex,
      usePlan: function () { if (!ex) return; var g = JSON.parse(JSON.stringify(ex.grid)); g.forEach(function (sets, i) { var it = s0.items[i]; sets.forEach(function (c) { if (c.done && String(c.reps).trim() === '') { c.reps = String(parseInt(it.reps, 10) || ''); if (c.load === '' && it.loadKg != null) c.load = String(it.loadKg); } }); }); var e1 = Object.assign({}, ex, { grid: g }); dPut(s0, e1); ctx.setUi({ exec: e1, err: '', fillPlan: false }); },
      weekTxt: weekN ? U.plural(weekN, 'sessão registrada', 'sessões registradas') + ' nos últimos 7 dias' : 'Nenhuma sessão registrada nos últimos 7 dias',
      periodTxt: U.plural(inP.length, 'sessão registrada', 'sessões registradas') + ' em ' + weeks + ' semanas' + (partialN ? ' · ' + U.plural(partialN, 'parcial', 'parciais') : '') + '. Sem meta combinada, não mostramos percentual.',
      weekOpts: [4, 12].map(function (n) { return { label: n + ' semanas', on: String(weeks === n), cls: 'chip' + (weeks === n ? ' is-on' : ''), pick: function () { ctx.setUi({ weeks: n }); } }; }),
      // gráfico só com registros confirmados do período; os mesmos números ficam na tabela (alternativa acessível)
      bars: (function () {
        var pts = inP.map(function (s) { var d = s.submitted_at || s.started_at; return { d: d, v: (s.set_logs || []).reduce(function (n, x) { return n + (Number(x.reps) || 0) * (Number(x.load_kg) || 0); }, 0) }; }).filter(function (x) { return x.v > 0; });
        var max = pts.reduce(function (m, x) { return Math.max(m, x.v); }, 0);
        return pts.length >= 2 ? pts.slice(-12).map(function (x) { return { h: 'height: ' + Math.max(6, Math.round(x.v / max * 100)) + '%', day: new Date(x.d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), val: Math.round(x.v).toLocaleString('pt-BR') }; }) : [];
      })(),
      tracked: tracked, hasTracked: tracked.length > 0,
      get hasBars() { return this.bars.length > 0; }, get barsAria() { return 'Volume por sessão: ' + this.bars.map(function (b) { return b.day + ' ' + b.val + ' kg'; }).join(', '); }, fewData: hist.length === 1, sessErr: !!ui.sessErr,
      trCms: hist.filter(function (h) { return h.hasCm; }).reverse(), hasTrCm: hist.some(function (h) { return h.hasCm; }),
      hist: hist, hasHist: hist.length > 0, noHist: !hist.length && !ui.sessErr, histCount: U.plural(hist.length, 'sessão registrada', 'sessões registradas'), doneCount: hist.length ? U.plural(hist.length, 'sessão concluída', 'sessões concluídas') : ''
    });
  }
});
