/* ALU00 · Aluno com conta real. Diretrizes: pedido não é vínculo; conta criada ≠ vínculo ≠ treino; preparação depois do
   vínculo; treino exibido é o atribuído pelo treinador; registro confirmado pelo servidor; evolução só de registros
   confirmados, com origem e período (tabela acessível). Nada de treino, conversa ou evolução inventados. */
REG.screen({
  page: 'aluno', key: 'semvinculo', id: 'ALU00', title: 'Meu acompanhamento', mtitle: 'Hoje',
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
      return Object.assign(base, { title: T0[0], text: T0[1], hasReqs: reqs.length > 0,
        reqs: reqs.map(function (r) { return { t: r.trainerName || 'Treinador', x: (RS[r.status] || r.status) + ' · enviado em ' + new Date(r.at).toLocaleDateString('pt-BR') + (r.offer ? ' · ' + r.offer : '') }; }) });
    }

    var tf = String(link.trainerName || 'seu treinador').split(' ')[0];
    if (C && !ui.asked) { ctx.setUi({ asked: true }); C.sessions(link.id).then(function (r) { ctx.setUi({ sess: r.ok && Array.isArray(r.data) ? r.data : [], sessErr: !r.ok }); }); }
    var w = link.workout, s0 = w && w.sessions && w.sessions[0];

    // ---------- preparação (depois do vínculo) ----------
    var P = ui.prep || {};
    var QS = [['objetivo', 'Qual é seu objetivo agora?', 'Ex.: ganhar força sem dor no ombro'], ['dias', 'Quantos dias por semana você consegue treinar?', 'Ex.: 3 dias'], ['local', 'Onde você vai treinar?', 'Ex.: academia perto de casa'], ['limitacoes', 'Alguma dor, lesão ou limitação?', 'Se não tiver, escreva “nenhuma”']];
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
    var ex = ui.exec;
    var start = function () {
      var grid = s0.items.map(function (it) { var a = []; for (var k = 0; k < it.sets; k++) a.push({ reps: String(parseInt(it.reps, 10) || ''), load: it.loadKg == null ? '' : String(it.loadKg), done: false }); return a; });
      ctx.setUi({ exec: { grid: grid, started: new Date().toISOString() }, err: '' });
    };
    var setCell = function (i, k, f) { return function (e) { var g = JSON.parse(JSON.stringify(ex.grid)); g[i][k][f] = f === 'done' ? !g[i][k].done : U.val(e); ctx.setUi({ exec: Object.assign({}, ex, { grid: g }) }); }; };
    var finish = function () {
      if (ui.busy) return;
      var logs = [];
      ex.grid.forEach(function (sets, i) { var it = s0.items[i]; sets.forEach(function (c, k) { if (c.done) logs.push({ item: i, set: k + 1, reps: Number(c.reps) || 0, loadKg: c.load === '' ? null : Number(String(c.load).replace(',', '.')), exerciseId: it.exerciseId, name: it.name, sub: false }); }); });
      if (!logs.length) return ctx.setUi({ err: 'Marque pelo menos uma série feita. Concluir parcialmente é permitido.' });
      var key = link.id + '_v' + w.version + '_' + s0.id;
      ctx.setUi({ busy: true, err: '' });
      C.submitSession(link.id, key, logs).then(function (r) {
        if (!r.ok) return ctx.setUi({ busy: false, err: r.offline ? 'Sem conexão: o registro não foi enviado. Suas marcações continuam aqui; tente de novo.' : 'O servidor não recebeu: ' + (r.msg || r.status) });
        ctx.setUi({ busy: false, exec: null, asked: false }); ctx.toast('Registro recebido: ' + U.plural(logs.length, 'série', 'séries') + '. ' + tf + ' vê no painel.');
      });
    };

    // ---------- evolução (só registros confirmados) ----------
    var sess = (ui.sess || []).slice().sort(function (a, b) { return String(a.submitted_at || a.started_at).localeCompare(String(b.submitted_at || b.started_at)); });
    var hist = sess.map(function (s) {
      var sets = s.set_logs || [], vol = sets.reduce(function (n, x) { return n + (Number(x.reps) || 0) * (Number(x.load_kg) || 0); }, 0), d = s.submitted_at || s.started_at;
      return { when: d ? new Date(d).toLocaleDateString('pt-BR') : '—', sets: String(sets.length), reps: String(sets.reduce(function (n, x) { return n + (Number(x.reps) || 0); }, 0)), vol: vol ? Math.round(vol).toLocaleString('pt-BR') : '—' };
    });
    var period = hist.length ? hist[0].when + ' a ' + hist[hist.length - 1].when : '';

    var doneKey = w && s0 ? link.id + '_v' + w.version + '_' + s0.id : '';
    var doneNow = !!doneKey && (ui.sess || []).some(function (s) { return s.session_key === doneKey; });
    var state = !w ? (link.prep === 'awaiting_client' ? 'prep' : 'wait') : (ex ? 'exec' : 'ready');
    var TT = {
      prep: ['Você e ' + tf + ' estão conectados', 'Antes do primeiro treino, ' + tf + ' precisa conhecer sua rotina. São 4 perguntas rápidas.'],
      wait: ['Treino em preparação', tf + ' recebeu suas respostas e está montando seu treino. Ele aparece aqui quando for atribuído.'],
      ready: [w ? w.title : '', w ? 'Versão ' + w.version + ' · atribuído por ' + tf + (w.assignedAt ? ' em ' + new Date(w.assignedAt).toLocaleDateString('pt-BR') : '') : ''],
      exec: [w ? w.title : '', 'Marque cada série feita. Ajuste repetições e carga ao que você fez de verdade.']
    };
    // ---------- agenda: horários livres do treinador (só com vínculo ativo) ----------
    var TZ = 'America/Sao_Paulo', fmtSlot = function (iso) { return new Date(iso).toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: TZ }); };
    if (C && !ui.apAsked) { ctx.setUi({ apAsked: true }); C.appointments([link.id]).then(function (r) { ctx.setUi({ appts: (r.ok && r.data) || [] }); }); }
    var loadSlots = function () { ctx.setUi({ slotsLoading: true, slotsErr: '' }); C.freeSlots(link.id, 14).then(function (r) { ctx.setUi({ slotsLoading: false, slots: r.ok ? (r.data || []) : [], slotsErr: r.ok ? '' : (r.offline ? 'Sem conexão.' : (r.msg || 'Não deu para carregar.')), slotsOpen: true }); }); };
    var OUTB = { conflito: 'Esse horário acabou de ser ocupado. Escolha outro.', fora_da_disponibilidade: 'Fora da disponibilidade do treinador.', horario_passado: 'Esse horário já passou.', vinculo_pausado: 'O acompanhamento está pausado.', vinculo_encerrado: 'O acompanhamento foi encerrado.', conta_bloqueada: 'Conta bloqueada.' };
    var book = function (s) { return function () { if (ui.busy) return; ctx.setUi({ busy: true }); C.bookSlot(link.id, s.starts_at).then(function (r) {
      var d = r.ok && r.data ? (Array.isArray(r.data) ? r.data[0] : r.data) : null, out = d && (d.outcome || d.status);
      ctx.setUi({ busy: false });
      if (!r.ok || (out && OUTB[out])) return ctx.toast(OUTB[out] || ('Não foi possível marcar: ' + (r.msg || r.status)));
      ctx.setUi({ slotsOpen: false, apAsked: false }); ctx.toast('Horário marcado: ' + fmtSlot(s.starts_at) + '. ' + tf + ' vê na agenda.');
    }); }; };
    var appts = (ui.appts || []).map(function (a) { return { when: fmtSlot(a.starts_at), by: a.booked_by === 'aluno' ? 'marcado por você' : 'marcado por ' + tf,
      cancel: function () { C.cancelAppointment(a.id, 'aluno').then(function (r) { if (!r.ok) return ctx.toast('Não foi possível cancelar: ' + (r.msg || r.status)); ctx.setUi({ apAsked: false }); ctx.toast('Horário cancelado.'); }); } }; });
    var slots = (ui.slots || []).slice(0, 12).map(function (s) { return { when: fmtSlot(s.starts_at), book: book(s) }; });
    var showEvo = from === 'evolucao', showMsg = from === 'mensagens';
    var t = showEvo ? ['Evolução', hist.length ? 'Registros confirmados com ' + tf + ' · ' + period : 'Sua evolução começa no primeiro treino registrado.'] : (showMsg ? ['Conversa com ' + tf, 'Fale sobre o treino, dúvidas ou mudanças de rotina. ' + tf + ' responde por aqui.'] : TT[state]);
    return Object.assign(base, {
      appts: appts, hasAppts: appts.length > 0, slots: slots, hasSlots: slots.length > 0, slotsOpen: !!ui.slotsOpen, noSlots: !!ui.slotsOpen && !slots.length && !ui.slotsLoading && !ui.slotsErr,
      slotsErr: ui.slotsErr || '', hasSlotsErr: !!ui.slotsErr, loadSlots: loadSlots, slotsLabel: ui.slotsLoading ? 'Carregando…' : 'Ver horários livres', tfName: tf,
      title: t[0], text: t[1], showMain: !showEvo && !showMsg, showEvo: showEvo, showMsg: showMsg, chat: showMsg && window.CHAT ? window.CHAT(ctx, link.id, 'aluno', tf) : {},
      isPrep: state === 'prep', isWait: state === 'wait', isReady: state === 'ready', isExec: state === 'exec',
      qs: QS.map(function (q) { return { id: 'pq-' + q[0], q: q[1], ph: q[2], v: P[q[0]] || '', set: function (e) { var o = Object.assign({}, P); o[q[0]] = U.val(e); ctx.setUi({ prep: o, err: '' }); } }; }),
      sendPrep: sendPrep, sendLabel: ui.busy ? 'Enviando…' : 'Enviar respostas',
      items: s0 ? s0.items.map(function (it) { return { name: it.name, rx: it.sets + ' × ' + it.reps + (it.loadKg != null ? ' · ' + String(it.loadKg).replace('.', ',') + ' kg' : '') + ' · descanso ' + it.restS + ' s' }; }) : [],
      estMin: s0 ? 'Cerca de ' + s0.estMin + ' min' : '', start: start, doneNow: doneNow, canStart: !doneNow,
      grid: ex ? ex.grid.map(function (sets, i) { var it = s0.items[i]; return { name: it.name, rx: it.sets + ' × ' + it.reps, sets: sets.map(function (c, k) { return { n: 'Série ' + (k + 1), reps: c.reps, load: c.load, done: c.done, doneOn: String(c.done), doneCls: 'check' + (c.done ? ' is-on' : ''), idR: 'ex-r' + i + '-' + k, idL: 'ex-l' + i + '-' + k, setReps: setCell(i, k, 'reps'), setLoad: setCell(i, k, 'load'), toggle: setCell(i, k, 'done') }; }) }; }) : [],
      finish: finish, finishLabel: ui.busy ? 'Enviando…' : 'Concluir sessão', cancel: function () { ctx.setUi({ exec: null, err: '' }); },
      err: ui.err || '', hasErr: !!ui.err,
      hist: hist, hasHist: hist.length > 0, noHist: !hist.length, histCount: U.plural(hist.length, 'sessão registrada', 'sessões registradas'), doneCount: hist.length ? U.plural(hist.length, 'sessão concluída', 'sessões concluídas') : ''
    });
  }
});
