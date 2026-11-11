/* H10 / ALU01 · Hoje da aluna: treino de hoje (retomar), preparação, check-in, mensagem do treinador e agenda */
REG.screen({
  page: 'aluno', key: 'hoje', id: 'H10', also: ['ALU01'], title: 'Hoje', mtitle: 'Hoje', nav: 'hoje', home: true, wide: true,
  normal: 'Treino em andamento',
  scens: [['primeiro', 'Primeiro uso · preparação'], ['prep', 'Preparação pendente'], ['ausencia', 'Ausência confirmada'], ['nenhum', 'Nenhum treino confirmado'],
    ['revisao', 'Treino em revisão'], ['aguardando', 'Aguardando revisão do treinador'], ['varios', 'Vários treinadores'], ['offline', 'Indisponibilidade parcial'],
    ['naocarregou', 'Não carregou'], ['falhou', 'Consulta falhou']],
  vals: function (ctx) {
    var A1 = window.A1, scn = ctx.scn, ui = ctx.ui;
    var ana = A1.me(), today = DB.meusTreinos.filter(function (t) { return t.day === 'seg 26/10' && t.status !== 'concluído'; })[0] || null;
    var doneToday = DB.meusTreinos.filter(function (t) { return t.day === 'seg 26/10' && t.status === 'concluído'; })[0] || null;
    var t = today || doneToday || A1.treino('t1');
    var ss = A1.sess(t), items = ss.s.items, exec = A1.exec();
    var running = !!(exec && exec.treino === t.id);
    var pos = running ? A1.resume(exec, items) : { ex: 0, set: 0 };
    var next = DB.meusTreinos.filter(function (x) { return x.status === 'próximo'; })[0] || null;
    var conv = DB.find('conversas', 'ana') || { msgs: [] };
    var fromCoach = conv.msgs.filter(function (m) { return m.from === 'me'; });
    var lastCoach = fromCoach[fromCoach.length - 1] || null;
    var ck = DB.a1_checkin, ckAnswered = Object.keys(ck.answers || {}).filter(function (k) { return ck.answers[k] !== ''; }).length;
    var coach = ui.coach || 'rafael';
    var failed = scn === 'naocarregou' || scn === 'falhou';

    // --- cartão principal ---
    var mode = running ? 'andamento' : (doneToday && !today ? 'concluido' : 'novo');
    if (scn === 'ausencia') mode = 'semtreino';
    if (scn === 'nenhum') mode = 'nenhum';
    if (scn === 'revisao') mode = 'revisao';
    if (scn === 'primeiro' || failed) mode = 'oculto';
    if (scn === 'varios' && coach === 'carolina') mode = 'programa';
    var goSessao = function () { GO('ALU02', { id: t.id }); };
    var hero = {
      ini: 'RL', who: 'Rafael Lima · ' + ss.r.name, eyebrow: 'Treino de hoje · segunda', title: t.name,
      sub: items.length + ' exercícios · ~' + t.duration, b1: 'Ver treino', f1: goSessao, hasB2: false, b2: '', f2: A1.noop
    };
    if (mode === 'andamento') {
      hero.sub = items.length + ' exercícios · ~' + t.duration + ' · você parou no exercício ' + (pos.ex + 1) + (pos.set >= 0 ? ', série ' + (pos.set + 1) : ', todas as séries feitas');
      hero.b1 = 'Continuar treino'; hero.f1 = function () { GO('ALU03'); };
      hero.hasB2 = true; hero.b2 = 'Ver treino'; hero.f2 = goSessao;
    } else if (mode === 'concluido') {
      hero.eyebrow = 'Treino de hoje · concluído';
      hero.sub = 'Encerrado' + (doneToday.doneAt ? ' às ' + doneToday.doneAt : '') + (doneToday.rpe ? ' · esforço ' + doneToday.rpe + ' de 10' : '') + (next ? ' · próximo: ' + next.name + ', ' + next.day : '');
      hero.b1 = next ? 'Ver próximo treino' : 'Ver evolução';
      hero.f1 = next ? function () { GO('ALU02', { id: next.id }); } : function () { GO('H10E'); };
    } else if (mode === 'programa') {
      hero.ini = 'CA'; hero.who = 'Carolina Albuquerque · programa comprado'; hero.eyebrow = 'Programa · continue de onde parou'; hero.title = 'Mobilidade 15 minutos';
      hero.sub = 'Semana 3 · aula 2 · 7 de 12 aulas vistas (v2)'; hero.b1 = 'Continuar programa'; hero.f1 = function () { GO('ALU07', { id: 'ct3' }); };
    }

    // --- semana (treino programado e compromisso são fatos diferentes) ---
    var week = A1.DAYS.map(function (d) {
      var tr = DB.meusTreinos.filter(function (x) { return x.day === d[1]; })[0];
      var ag = DB.a1_agenda.filter(function (g) { return g.day === d[1] && g.status !== 'cancelado'; })[0];
      var isToday = d[1] === 'seg 26/10';
      var name = 'Descanso', sub = '—', ic = '';
      if (tr) { name = tr.name.split(' · ')[0]; sub = tr.status === 'concluído' ? 'concluído' : (isToday ? (running ? 'hoje · em andamento' : 'hoje') : 'publicado'); }
      else if (ag) { name = ag.what.split(' ')[0]; sub = ag.time + ' · ' + ag.kind; }
      if (scn === 'ausencia' && isToday) { name = 'Descanso'; sub = 'sem treino hoje'; }
      return { k: d[0] + ' ' + d[1].slice(4, 6), name: name, sub: sub, cls: 'a1-day' + (isToday ? ' is-today' : '') + (tr && tr.status === 'concluído' ? ' is-done' : ''), cur: isToday ? 'date' : 'false', ic: ic, go: tr ? function () { GO('ALU02', { id: tr.id }); } : (ag ? function () { GO('ALU10'); } : A1.noop), hasGo: !!(tr || ag), noGo: !(tr || ag) };
    });
    var weekIds = A1.DAYS.map(function (d) { return d[1]; });
    var prog = DB.meusTreinos.filter(function (x) { return weekIds.indexOf(x.day) >= 0; });
    var concl = prog.filter(function (x) { return x.status === 'concluído'; }).length;
    var lastDone = doneToday || DB.meusTreinos.filter(function (x) { return x.status === 'concluído'; }).slice(-1)[0] || null;
    var pend = A1.unsynced(exec);
    var kpis = [
      { l: 'Minha semana', n: concl + ' de ' + prog.length, s: 'sessões programadas concluídas (26/10 a 01/11)' + (running ? ' · ' + t.name.split(' · ')[0] + ' em andamento' : '') },
      { l: 'Último treino', n: lastDone ? (lastDone.day === 'seg 26/10' ? 'Hoje' : lastDone.day.slice(0, 3).replace(/^./, function (c) { return c.toUpperCase(); })) : '—', s: lastDone ? lastDone.name + ' · ' + lastDone.day + ' · concluído · sincronizado' : 'Nenhum treino concluído ainda' },
      { l: 'Pendente de sincronizar', n: pend ? U.plural(pend, 'série', 'séries') : 'Nada', s: pend ? 'salva no aparelho · envia ao conectar' : 'Registros sincronizados' + (exec ? ' às ' + exec.syncedAt : '') }
    ];

    // --- agenda curta ---
    var agenda = DB.a1_agenda.filter(function (g) { return g.status === 'confirmado' || g.status === 'remarcado'; }).map(function (g) {
      return { t: g.day.replace(/^./, function (c) { return c.toUpperCase(); }) + ' · ' + g.time + ' · ' + g.kind, s: g.what + ' · com Rafael', ic: 'ic ic--xs i-calendar', go: function () { GO('ALU10'); } };
    });
    if (next) agenda.push({ t: next.day.replace(/^./, function (c) { return c.toUpperCase(); }) + ' · ' + next.name.split(' · ')[0], s: 'treino no seu tempo · não é compromisso', ic: 'ic ic--xs i-dumbbell', go: function () { GO('ALU02', { id: next.id }); } });

    var sent = !!ck.sentAt;
    var al = A1.alert(ctx, {
      offline: { k: 'warn', t: 'Sem conexão', x: 'Seu treino está no aparelho. Registros sincronizam quando voltar.', b: 'Tentar de novo', f: A1.retry(ctx, 'Conectado de novo. Registros sincronizados.') },
      naocarregou: { k: 'risk', t: 'Não carregou', x: 'Seu vínculo com Rafael continua. Só não conseguimos buscar o treino de hoje.', b: 'Tentar de novo' },
      falhou: { k: 'risk', t: 'Consulta falhou', x: 'A agenda e o treino não atualizaram. Nada foi perdido: tente de novo ou fale com Rafael.', b: 'Tentar de novo', b2: 'Mensagem para Rafael', f2: function () { GO('ALU05'); } },
      aguardando: { k: 'info', t: 'Aguardando revisão de Rafael', x: 'Seu check-in de 22/10 (dor no ombro) está com ele desde 22/10 21:40. O treino de hoje continua liberado.', b: 'Consultar de novo' },
      prep: { k: 'warn', t: 'Preparação pendente · com você', x: 'Rafael pediu 5 respostas para ajustar sua semana 4. Leva cerca de 4 min.', b: 'Completar preparação', f: function () { GO('REL07'); }, b2: 'Consultar de novo', f2: A1.retry(ctx) }
    });

    return {
      flash: A1.flashVals(ctx), al: al,
      hi: 'Oi, ' + ana.first, date: window.TODAY(),
      isWelcome: scn === 'primeiro', notWelcome: scn !== 'primeiro',
      goPrep: function () { GO('REL07'); },
      isVarios: scn === 'varios',
      coaches: [['rafael', 'Rafael Lima', 'Acompanhamento online'], ['carolina', 'Carolina Albuquerque', 'Programa · Mobilidade 15 minutos']].map(function (c) {
        return { label: c[1], sub: c[2], cls: 'chip' + (coach === c[0] ? ' is-on' : ''), on: String(coach === c[0]), pick: function () { ctx.setUi({ coach: c[0] }); } };
      }),
      isRafael: coach === 'rafael' || scn !== 'varios',
      showHero: ['andamento', 'novo', 'concluido', 'programa'].indexOf(mode) >= 0,
      hero: hero, heroDone: mode === 'concluido',
      isSemTreino: mode === 'semtreino', isNenhum: mode === 'nenhum', isRevisao: mode === 'revisao',
      nextLine: next ? 'Rafael publicou o ' + next.name + ' para ' + next.day + '. Descanso também conta.' : 'Descanso também conta.',
      goWeek: function () { GO('ALU06'); }, goMsg: function () { GO('ALU05'); },
      showCoachCard: failed,
      week: week, kpis: kpis, showWeek: !failed && scn !== 'primeiro' && !(scn === 'varios' && coach === 'carolina'),
      agenda: agenda, hasAgenda: agenda.length > 0, noAgenda: agenda.length === 0, goAgenda: function () { GO('ALU10'); },
      hasMsg: !!lastCoach && !failed, msgText: lastCoach ? '“' + lastCoach.text + '”' : '', msgAt: lastCoach ? 'hoje ' + lastCoach.at : '',
      ckPend: !sent && scn !== 'primeiro', ckSent: sent,
      ckSub: ckAnswered + ' de 5 respondidas · salvo hoje ' + ck.savedAt + ' · Rafael pediu até ' + ck.due,
      ckSentSub: 'Enviado hoje ' + ck.sentAt + ' · Rafael vai revisar',
      goCheckin: function () { GO('ALU08'); },
      links: [['Meus programas', 'Retomar de onde parou', 'book', 'ALU06'], ['Meu treinador', 'Rafael Lima · relação e compartilhamentos', 'user', 'ALU11'], ['Agenda', 'Compromissos e chamadas', 'calendar', 'ALU10']].map(function (l) {
        return { t: l[0], s: l[1], ic: 'ic ic--sm i-' + l[2], go: function () { GO(l[3]); } };
      })
    };
  }
});
