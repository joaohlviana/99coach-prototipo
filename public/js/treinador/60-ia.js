/* T7 · Assistência de IA do treinador (H15/IA01 a IA07).
   A IA é exclusiva do treinador, opcional e nunca aplica nada sozinha: gera uma proposta (simulada),
   mostra fontes e contexto, e só altera DB.rotinas / DB.programas / rascunho de conversa depois da
   revisão e da confirmação, com desfazer. O consumo debita DB.trainer.iaCredits; sem saldo, caminho manual. */
(function () {
  'use strict';

  // ---------- política de custo (créditos por tarefa) ----------
  var TASKS = [
    { k: 'montar', label: 'Montar treino', est: 3, cap: 5 },
    { k: 'revisar', label: 'Revisar treino', est: 3, cap: 5 },
    { k: 'importar', label: 'Importar PDF', est: 2, cap: 4 },
    { k: 'mensagem', label: 'Rascunho de mensagem', est: 1, cap: 2 }
  ];
  var RUN = { fila: 1, gerando: 1, validando: 1 };
  // sugestões do diagnóstico de presença (TRE28) chegam aqui para revisão
  var SOCIAL = {
    sg1: ['Mostre o que inclui o acompanhamento online', 'Nas 30 publicações, nenhuma explica o que o aluno recebe no plano de R$ 200/mês.'],
    sg2: ['Diga onde você atende em Londrina', '3 de 30 publicações citam a região; o perfil 99Coach mostra Centro e Box Centro.'],
    sg3: ['Use a mesma foto do perfil 99Coach', 'A foto do Instagram é diferente; quem chega pelo Instagram pode não reconhecer o perfil.']
  };
  var OKREL = { ativo: 1, pausado: 1 };
  function task(k) { return TASKS.filter(function (t) { return t.k === k; })[0] || TASKS[1]; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function nowStamp() { return '26/10 ' + U.now(); }
  function alert(kind, t, d, act, fn) {
    var ic = { info: 'info', warn: 'alert', risk: 'alert', ok: 'check' }[kind] || 'info';
    return { cls: 'alert alert--' + kind + ' t7-alert', ic: 'ic ic--sm i-' + ic, role: kind === 'risk' ? 'alert' : 'status', t: t, d: d || '', hasAct: !!act, act: act || '', fn: fn || function () {} };
  }
  function why(ctx, title, text) { return function () { ctx.ask({ title: title, text: text, ok: 'Entendi', cancel: false }); }; }

  // ---------- dados próprios (t7_) ----------
  DB.seed('t7_jobs', [
    { id: 'j247', ref: 'IA-0247', task: 'revisar', label: 'Revisar treino B', kind: 'aluno', student: 'ana', rotina: 'r1', program: '', baseVersion: 4, status: 'pronta', at: '26/10 10:40', t0: '10:40', t1: '10:41', est: 3, cap: 5, reserved: 0, consumed: 3, nSources: 4, draft: '', draftNew: false, reason: '', edited: false, applied: 0, settled: true, partial: false, note: '' },
    { id: 'j241', ref: 'IA-0241', task: 'revisar', label: 'Revisar treino B', kind: 'aluno', student: 'ana', rotina: 'r1', program: '', baseVersion: 3, status: 'aprovada', at: '24/10 18:05', t0: '18:05', t1: '18:06', est: 3, cap: 5, reserved: 0, consumed: 3, nSources: 4, draft: 'r1', draftNew: false, reason: '', edited: true, applied: 2, settled: true, partial: false, note: 'Virou a versão 4 de Força base · semana 3 (24/10 18:20)' },
    { id: 'j233', ref: 'IA-0233', task: 'importar', label: 'Importar PDF', kind: 'arquivo', student: '', rotina: '', program: '', baseVersion: 0, status: 'rejeitada', at: '20/10 16:12', t0: '16:12', t1: '16:13', est: 2, cap: 4, reserved: 0, consumed: 2, nSources: 1, draft: '', draftNew: false, reason: 'Unidade errada', edited: false, applied: 0, settled: true, partial: false, note: 'treino_marcos.pdf' },
    { id: 'j229', ref: 'IA-0229', task: 'mensagem', label: 'Rascunho de mensagem', kind: 'aluno', student: 'bruno', rotina: '', program: '', baseVersion: 0, status: 'falhou', at: '18/10 07:50', t0: '07:50', t1: '07:51', est: 1, cap: 2, reserved: 0, consumed: 0, nSources: 2, draft: '', draftNew: false, reason: 'Serviço indisponível · reserva devolvida', edited: false, applied: 0, settled: true, partial: false, note: '' }
  ]);
  DB.seed('t7_import', { file: 'treino_ana.pdf', pages: 2, size: '380 KB', student: 'ana', at: '26/10 09:58', status: 'novo', rights: '', unit: '', exPick: '', consumed: 0, job: '' });
  DB.seed('t7_insights', [
    { id: 'i1', area: 'acompanhamento', title: '2 alunos relataram dor nos últimos 7 dias', base: 'Com base em 5 check-ins', insufficient: false,
      fact: 'Ana relatou dor no ombro (check-in 22/10) e Marcos, no joelho (check-in 25/10).',
      src: 'Fonte: check-ins de 19/10 a 25/10 · cobertura 5 de 6 alunos ativos (Larissa ainda sem check-in) · atualizado 26/10 08:00',
      hyp: 'Sugestão para você avaliar: revisar o treino de quem relatou dor antes da próxima sessão.',
      act: 'Revisar ação proposta', to: 'IA03', pid: 'j247', act2: 'Abrir resposta', to2: 'TRE06', pid2: 'q1',
      task: 'Revisar treino de Ana e Marcos (dor relatada)', taskTo: 'TRE03', taskId: 'ana',
      sources: [['Check-in semanal · Ana', '22/10 21:40'], ['Check-in semanal · Marcos', '25/10 19:02'], ['Nota privada · Ana', '15/10'], ['Mensagem · Ana', '26/10 10:42']], fb: '', taskDone: false, taskNid: '' },
    { id: 'i2', area: 'acompanhamento', title: 'Aderência de Larissa', base: 'Com base em 0 registros', insufficient: true,
      fact: 'Ainda não há dados suficientes: Larissa começou em 25/10 e ainda não respondeu check-in nem a preparação.',
      src: 'Fonte: check-ins e preparação · atualizado 26/10 08:00', hyp: '', act: '', to: '', pid: '', act2: '', to2: '', pid2: '', task: '', taskTo: '', taskId: '',
      sources: [['Preparação · Larissa', 'pendente desde 25/10']], fb: '', taskDone: false, taskNid: '' },
    { id: 'i3', area: 'negocio', title: 'Sessão presencial converte mais com menos visitas', base: 'Com base em 94 visitas às ofertas', insufficient: false,
      fact: 'Sessão presencial: 12 visitas e 8% de conversão. Acompanhamento online: 28 visitas e 7%. CrossFit do zero: 54 visitas e 5%.',
      src: 'Fonte: Insights 99Coach · últimos 7 dias · atualizado 26/10 08:00 · sem dados de saúde de alunos',
      hyp: 'Hipótese para você avaliar: destacar a Sessão presencial no perfil pode trazer mais contatos. Não é garantia de venda.',
      act: 'Abrir oferta', to: 'TRE29', pid: 'o2', act2: '', to2: '', pid2: '',
      task: 'Avaliar destaque da Sessão presencial no perfil', taskTo: 'TRE29', taskId: 'o2',
      sources: [['Visitas por oferta', '19/10 a 25/10'], ['Contatos e vendas', '19/10 a 25/10']], fb: '', taskDone: false, taskNid: '' }
  ]);

  // ---------- franquia ----------
  function credits(scn) {
    var c = DB.trainer.iaCredits;
    var reserved = DB.t7_jobs.reduce(function (n, j) { return n + ((RUN[j.status] || (j.status === 'cancelada' && !j.settled)) ? (j.reserved || 0) : 0); }, 0);
    var used = c.used, limit = c.limit;
    if (scn === 'limite') used = limit - reserved;
    var rem = Math.max(0, limit - used - reserved);
    var unknown = scn === 'saldoDesc' || scn === 'indisponivel' || scn === 'desconhecido';
    return { limit: limit, used: used, reserved: reserved, rem: rem, resets: c.resets, unknown: unknown, pct: Math.min(100, Math.round(((used + reserved) / limit) * 100)) };
  }

  // ---------- leitura dos dados ----------
  function stu(id) { return DB.find('alunos', id); }
  function exName(id) { var e = DB.find('exercicios', id); return e ? e.name : (id === 'supino-incl' ? 'Supino inclinado com halteres' : id); }
  function itemTxt(it) { return exName(it.ex) + ' ' + it.sets + '×' + it.reps + (it.load ? ' · ' + it.load : ''); }
  function kg(n) { return String(n).replace('.', ',') + ' kg'; }
  function ctxName(j) {
    if (j.kind === 'aluno' && j.student) { var a = stu(j.student); return a ? a.first : j.student; }
    if (j.kind === 'programa' && j.program) { var p = DB.find('programas', j.program); return p ? p.name : j.program; }
    if (j.kind === 'modelo' && j.rotina) { var r = DB.find('rotinas', j.rotina); return r ? r.name : j.rotina; }
    if (j.kind === 'arquivo') return j.note || 'arquivo';
    if (j.kind === 'social') return (SOCIAL[j.note] || ['Diagnóstico'])[0];
    return '—';
  }
  var STATUS = {
    fila: ['Na fila', 'badge--info'], gerando: ['Gerando', 'badge--info'], validando: ['Validando', 'badge--info'],
    pronta: ['Aguardando sua revisão', 'badge--warn'], aprovada: ['Rascunho atualizado', 'badge--ok'], rejeitada: ['Rejeitada', 'badge--plain'],
    falhou: ['Falhou', 'badge--risk'], cancelada: ['Cancelada', 'badge--plain']
  };
  function resultTxt(j) {
    if (j.status === 'aprovada') return j.edited ? 'Aprovada com edição' : 'Aprovada';
    if (j.status === 'rejeitada') return 'Rejeitada' + (j.reason ? ' · ' + j.reason.toLowerCase() : '');
    if (j.status === 'falhou') return 'Falhou' + (j.reason ? ' · ' + j.reason.toLowerCase() : '');
    if (j.status === 'cancelada') return j.settled ? 'Cancelada · reserva devolvida' : 'Cancelada · reserva em conciliação';
    return (STATUS[j.status] || ['—'])[0];
  }

  // fontes que a IA pode ler em cada contexto (o treinador escolhe)
  function sourcesFor(kind, sid, rid, pid) {
    var out = [], miss = [], locked = [];
    if (kind === 'aluno') {
      var a = stu(sid); if (!a) return { list: out, miss: miss, locked: locked };
      var r = rid ? DB.find('rotinas', rid) : null;
      if (sid === 'ana') {
        out.push({ k: 'chk', t: 'Check-in semanal', d: '22/10 21:40 · dor no ombro relatada', to: 'TRE06', id: 'q1' });
        out.push({ k: 'nota', t: 'Nota privada', d: '15/10 · ombro sensível no supino', to: 'TRE03', id: 'ana' });
        if (r) out.push({ k: 'rot', t: 'Rotina ' + r.name, d: 'v' + r.version + ' · salva ' + r.savedAt, to: 'TRE14', id: r.id });
        out.push({ k: 'cargas', t: 'Cargas de 4 semanas', d: 'agachamento 01/10 a 22/10', to: 'TRE03', id: 'ana' });
        out.push({ k: 'aval', t: 'Avaliação física', d: '01/10 · Pollock 3 dobras', to: 'TRE03', id: 'ana' });
        locked.push({ t: 'Exame de ombro (ultrassom).pdf', d: '20/10 · a assistência não lê exames' });
        miss.push('check-in desta semana (ainda não respondido)');
      } else {
        if (r) out.push({ k: 'rot', t: 'Rotina ' + r.name, d: 'v' + r.version + ' · salva ' + r.savedAt, to: 'TRE14', id: r.id });
        if (a.lastCheckin) out.push({ k: 'chk', t: 'Último check-in', d: a.lastCheckin, to: 'TRE03', id: a.id });
        if (a.adherence) out.push({ k: 'ader', t: 'Aderência', d: a.adherence + '% · semana ' + a.week, to: 'TRE03', id: a.id });
        if (a.flag) out.push({ k: 'flag', t: 'Relato', d: a.flag.text + ' · ' + a.flag.when, to: 'TRE03', id: a.id });
        if (!a.lastCheckin) miss.push('nenhum check-in ainda');
        if (!r) miss.push('rotina atribuída');
        if (!a.prepDone) miss.push('preparação respondida');
      }
    } else if (kind === 'modelo') {
      var m = rid ? DB.find('rotinas', rid) : null;
      if (m) out.push({ k: 'rot', t: 'Rotina ' + m.name, d: 'v' + m.version + ' · ' + m.status + ' · sem dados de aluno', to: 'TRE14', id: m.id });
      else miss.push('rotina modelo');
    } else if (kind === 'programa') {
      var p = pid ? DB.find('programas', pid) : null;
      if (p) {
        out.push({ k: 'estr', t: 'Estrutura de ' + p.name, d: 'v' + p.version + ' · ' + p.sections.length + ' seções · ' + p.updated, to: 'TRE22', id: p.id });
        if (p.rating) out.push({ k: 'nota', t: 'Avaliação pública', d: 'nota ' + p.rating + ' · ' + p.participants + ' participantes', to: 'TRE22', id: p.id });
        locked.push({ t: 'Progresso individual dos participantes', d: 'privado · não entra na análise' });
        if (p.pending.length) miss.push(p.pending.join('; ').toLowerCase());
      } else miss.push('programa');
    }
    return { list: out, miss: miss, locked: locked };
  }

  // proposta (resultado fixo e coerente com os dados) a partir do pedido
  function build(j) {
    var P = { mode: 'rotina', changes: [], facts: [], sources: [], text: '', baseLabel: 'Atual', base: null, title: j.label };
    var a = j.student ? stu(j.student) : null;
    var r = j.rotina ? DB.find('rotinas', j.rotina) : null;
    var find = function (sid, ex) { var s = r && r.sessions.filter(function (x) { return x.id === sid; })[0]; return s ? s.items.filter(function (i) { return i.ex === ex; })[0] : null; };
    if (j.task === 'importar') {
      P.mode = 'novo'; P.baseLabel = 'Original';
      var im = DB.t7_import;
      var unit = im.unit || 'kg';
      var rows = [{ id: 'm1', from: 'Agachamento 4 × 8 · 40', item: { ex: 'agach', sets: 4, reps: '8', load: '40 ' + unit, rest: '90 s' } },
        { id: 'm2', from: 'Remada curvada 3 × 10 · 50 kg', item: { ex: 'remada', sets: 3, reps: '10', load: '50 kg', rest: '90 s' } }];
      if (im.exPick && im.exPick !== 'ignorar') rows.push({ id: 'm3', from: 'Desenv. halt. 3 × 12 · 8 kg', item: { ex: im.exPick, sets: 3, reps: '12', load: im.exPick === 'mob-ombro' ? '' : '8 kg', rest: '60 s' } });
      rows.forEach(function (x) { P.changes.push({ id: x.id, where: 'Treino importado', from: x.from, to: itemTxt(x.item), why: 'Fato: lido na página 1 de ' + im.file + '.', def: true, op: { add: x.item }, ed: 'load', edVal: x.item.load }); });
      P.facts = [{ k: 'Fato', t: 'Lido de ' + im.file + ' (' + im.pages + ' páginas), enviado em ' + im.at + '. O original fica preservado.' }, { k: 'Fato', t: 'Unidade do agachamento confirmada por você: ' + unit + '.' }, { k: 'Limite', t: 'Importar não publica nem atribui: vira uma rotina em rascunho.' }];
      P.sources = [{ t: im.file, d: 'original · ' + im.size, to: 'IA04', id: '' }];
      return P;
    }
    if (j.kind === 'social') {
      P.mode = 'social'; P.baseLabel = 'Perfil atual';
      var g = SOCIAL[j.note] || ['Sugestão do diagnóstico', 'Leitura das publicações autorizadas.'];
      P.changes.push({ id: 's1', where: 'Perfil 99Coach', from: '—', to: g[0], why: 'Fato: ' + g[1], def: true, op: {}, ed: 'txt', edVal: g[0] });
      P.facts = [{ k: 'Fato', t: g[1] }, { k: 'Hipótese', t: 'Deixar isso claro no perfil pode ajudar quem chega pelo Instagram.' }, { k: 'Limite', t: 'Não promete crescimento. Nada é publicado nem importado para o perfil.' }];
      P.sources = [{ t: 'Diagnóstico de presença', d: 'Instagram autorizado · 30 publicações', to: 'TRE28', id: '' }];
      return P;
    }
    if (j.task === 'mensagem') {
      P.mode = 'mensagem';
      P.text = j.student === 'ana'
        ? 'Oi, Ana! Vi seu check-in de 22/10 e a sua mensagem de hoje sobre o ombro. Antes do treino B, me conta: a dor aparece só no supino ou também ao levantar o braço no dia a dia? Com isso eu ajusto a semana.'
        : 'Oi, ' + (a ? a.first : '') + '! Como foram os treinos desta semana? Me conta se algo incomodou ou ficou fácil demais, assim eu ajusto a próxima.';
      P.facts = [{ k: 'Fato', t: a && a.lastCheckin ? 'Último check-in de ' + a.first + ': ' + a.lastCheckin + '.' : 'Sem check-in recente.' }, { k: 'Limite', t: 'Volta para a conversa como rascunho. Nada é enviado sem você.' }];
      P.sources = [{ t: 'Conversa com ' + (a ? a.first : ''), d: 'últimas mensagens', to: 'TRE25', id: j.student }];
      return P;
    }
    if (j.kind === 'programa') {
      P.mode = 'programa';
      var p = DB.find('programas', j.program);
      P.baseLabel = 'Atual (v' + (p ? p.version : 1) + ')';
      var secs = j.task === 'montar' && j.program === 'p2'
        ? ['Semana 3 · arranco com bloco', 'Semana 4 · arremesso com bloco', 'Semanas 5 e 6 · combinados leves']
        : (j.task === 'montar' ? ['Semana extra · recuperação ativa'] : ['Semana final · reavaliação técnica']);
      secs.forEach(function (s, i) { P.changes.push({ id: 'g' + i, where: p ? p.name : '', from: '—', to: s, why: i === 0 && p && p.pending.length ? 'Fato: pendência registrada · ' + p.pending[p.pending.length - 1] + '.' : 'Hipótese: completa a progressão das semanas anteriores.', def: true, op: { sec: s }, ed: 'sec', edVal: s }); });
      P.facts = [{ k: 'Fato', t: p ? p.name + ' tem ' + p.sections.length + ' seções e ' + p.sessions + ' sessões (v' + p.version + ', ' + p.updated + ').' : '' }, { k: 'Hipótese', t: 'As novas seções seguem o ritmo das semanas iniciais.' }, { k: 'Limite', t: 'Usa só a estrutura do programa. Progresso individual dos participantes não entra.' }];
      P.sources = [{ t: 'Estrutura do programa', d: p ? 'v' + p.version + ' · ' + p.updated : '', to: 'TRE22', id: j.program }];
      return P;
    }
    // rotina (aluno ou modelo)
    P.base = r;
    P.baseLabel = r ? 'Atual (v' + r.version + ')' : 'Atual';
    if (j.task === 'revisar' && j.student === 'ana' && r && r.id === 'r1') {
      var sup = find('s2', 'supino'), mob = find('s2', 'mob-ombro'), ag = find('s1', 'agach'), te = find('s1', 'terra');
      if (sup) P.changes.push({ id: 'c1', where: 'Treino B · superiores', from: itemTxt(sup), to: 'Supino inclinado com halteres ' + sup.sets + '×' + sup.reps + ' · carga a definir', why: 'Fato: dor no ombro direito no supino em 3 registros (check-in 22/10, nota 15/10, mensagem de hoje 10:42).', def: true, op: { s: 's2', ex: 'supino', set: { ex: 'supino-incl', load: '' } }, ed: 'load', edVal: '' });
      if (mob) P.changes.push({ id: 'c2', where: 'Treino B · superiores', from: itemTxt(mob), to: exName('mob-ombro') + ' 3×' + mob.reps, why: 'Hipótese: mais preparo do ombro antes de empurrar pode reduzir o incômodo.', def: true, op: { s: 's2', ex: 'mob-ombro', set: { sets: 3 } }, ed: 'sets', edVal: '3' });
      if (ag) P.changes.push({ id: 'c3', where: 'Treino A · inferiores', from: itemTxt(ag), to: exName('agach') + ' ' + ag.sets + '×' + ag.reps + ' · 75 kg', why: 'Fato: cargas de 4 semanas subiram 2,5 kg por registro (65 kg em 01/10 → 72,5 kg em 22/10), sem dor nas pernas.', def: true, op: { s: 's1', ex: 'agach', set: { load: '75 kg' } }, ed: 'load', edVal: '75 kg' });
      if (te) P.changes.push({ id: 'c4', where: 'Treino A · inferiores', from: itemTxt(te), to: exName('terra') + ' ' + te.sets + '×' + te.reps + ' · 82,5 kg', why: 'Hipótese fraca: só 2 registros de carga no terra. Fica desmarcada.', def: false, op: { s: 's1', ex: 'terra', set: { load: '82,5 kg' } }, ed: 'load', edVal: '82,5 kg' });
      P.facts = [
        { k: 'Fato', t: 'Check-in 22/10: dor 4 de 10 ao levantar o braço direito; treinou 3 de 4 dias.' },
        { k: 'Fato', t: 'Nota privada 15/10: ombro direito sensível em supino com carga alta.' },
        { k: 'Fato', t: 'Agachamento: 65 kg (01/10) → 70 kg (15/10) → 72,5 kg (22/10).' },
        { k: 'Hipótese', t: 'Empurrar na horizontal com carga alta parece agravar o incômodo.' },
        { k: 'Limite', t: 'Não é diagnóstico. O exame de ombro (20/10) não foi lido pela assistência.' }
      ];
      P.sources = [{ t: 'Check-in semanal', d: '22/10 21:40', to: 'TRE06', id: 'q1' }, { t: 'Nota privada', d: '15/10 20:10', to: 'TRE03', id: 'ana' }, { t: 'Força base · semana 3', d: 'v' + r.version + ' · ' + r.savedAt, to: 'TRE14', id: 'r1' }, { t: 'Cargas de 4 semanas', d: '01/10 a 22/10', to: 'TRE03', id: 'ana' }];
      return P;
    }
    if (j.task === 'montar') {
      var adds = j.student === 'ana'
        ? [{ ex: 'mob-ombro', sets: 3, reps: '10', load: '', rest: '30 s' }, { ex: 'remada', sets: 3, reps: '10', load: '40 kg', rest: '90 s' }, { ex: 'prancha', sets: 3, reps: '40 s', load: '', rest: '60 s' }]
        : [{ ex: 'agach', sets: 3, reps: '10', load: '', rest: '90 s' }, { ex: 'remada', sets: 3, reps: '10', load: '', rest: '90 s' }, { ex: 'prancha', sets: 3, reps: '30 s', load: '', rest: '60 s' }];
      var sname = j.student === 'ana' ? 'Treino C · ombro protegido' : 'Treino novo · base';
      adds.forEach(function (it, i) { P.changes.push({ id: 'n' + i, where: sname, from: '—', to: itemTxt(it) + (it.load ? '' : ' · carga a definir'), why: i === 0 && j.student === 'ana' ? 'Fato: relato de dor no ombro em 22/10; começa por mobilidade.' : 'Hipótese: base simples para você ajustar.', def: true, op: { add: it, sname: sname }, ed: 'load', edVal: it.load }); });
      P.facts = [{ k: 'Fato', t: a ? a.first + ' · objetivo: ' + a.goal + '.' : 'Rotina modelo, sem dados de aluno.' }, { k: 'Hipótese', t: 'Um treino extra curto ajuda a manter a frequência da semana.' }, { k: 'Limite', t: 'Cargas ficam para você definir. Não é prescrição publicada.' }];
      P.sources = r ? [{ t: r.name, d: 'v' + r.version + ' · ' + r.savedAt, to: 'TRE14', id: r.id }] : [];
      if (a) P.sources.push({ t: 'Ficha de ' + a.first, d: 'objetivo e preparação', to: 'TRE03', id: a.id });
      return P;
    }
    // revisão genérica: progressão de 2,5 kg no primeiro item com carga, ou menos volume se houver relato de dor
    var first = null, fs = null;
    (r ? r.sessions : []).forEach(function (s) { s.items.forEach(function (it) { if (!first && /kg/.test(it.load)) { first = it; fs = s; } }); });
    if (!first && r && r.sessions[0] && r.sessions[0].items[0]) { fs = r.sessions[0]; first = fs.items[0]; }
    if (first) {
      var pain = a && a.flag && a.flag.kind === 'dor';
      if (pain) P.changes.push({ id: 'g1', where: fs.name, from: itemTxt(first), to: exName(first.ex) + ' ' + Math.max(1, first.sets - 1) + '×' + first.reps + (first.load ? ' · ' + first.load : ''), why: 'Fato: ' + a.flag.text.toLowerCase() + ' (' + a.flag.when + ').', def: true, op: { s: fs.id, ex: first.ex, set: { sets: Math.max(1, first.sets - 1) } }, ed: 'sets', edVal: String(Math.max(1, first.sets - 1)) });
      else if (/kg/.test(first.load)) { var n = parseFloat(first.load.replace(',', '.')) + 2.5; P.changes.push({ id: 'g1', where: fs.name, from: itemTxt(first), to: exName(first.ex) + ' ' + first.sets + '×' + first.reps + ' · ' + kg(n), why: a ? 'Fato: aderência de ' + a.adherence + '% e último check-in ' + (a.lastCheckin || 'sem registro') + ' sem relato de dor.' : 'Hipótese: progressão linear de 2,5 kg.', def: true, op: { s: fs.id, ex: first.ex, set: { load: kg(n) } }, ed: 'load', edVal: kg(n) }); }
      else P.changes.push({ id: 'g1', where: fs.name, from: itemTxt(first), to: exName(first.ex) + ' ' + (first.sets + 1) + '×' + first.reps, why: 'Hipótese: mais uma série mantém a progressão.', def: true, op: { s: fs.id, ex: first.ex, set: { sets: first.sets + 1 } }, ed: 'sets', edVal: String(first.sets + 1) });
    }
    P.facts = [{ k: 'Fato', t: r ? r.name + ' · v' + r.version + ', salva ' + r.savedAt + '.' : 'Sem rotina.' }];
    if (a && a.flag) P.facts.push({ k: 'Fato', t: a.flag.text + ' (' + a.flag.when + ').' });
    P.facts.push({ k: 'Limite', t: 'Não é diagnóstico nem prescrição publicada.' });
    P.sources = r ? [{ t: r.name, d: 'v' + r.version + ' · ' + r.savedAt, to: 'TRE14', id: r.id }] : [];
    if (a) P.sources.push({ t: 'Ficha de ' + a.first, d: a.lastCheckin ? 'check-in ' + a.lastCheckin : 'sem check-in', to: 'TRE03', id: a.id });
    return P;
  }

  // simulação da geração: fila → gerando → validando → pronta (consumo confirmado só no fim)
  function runJob(id, refresh) {
    var step = function (ms, fn, next) {
      setTimeout(function () {
        var j = DB.find('t7_jobs', id);
        if (!j || !RUN[j.status]) return;
        fn(j);
        try { refresh(); } catch (e) { /* tela fechada */ }
        if (next) next();
      }, ms);
    };
    step(700, function (j) { j.status = 'gerando'; }, function () {
      step(1600, function (j) { j.status = 'validando'; }, function () {
        step(1400, function (j) { j.status = 'pronta'; j.t1 = U.now(); j.consumed = j.est; j.reserved = 0; j.settled = true; DB.trainer.iaCredits.used += j.est; });
      });
    });
  }

  // aplica a proposta revisada: cria um rascunho novo (nunca mexe na versão atribuída) — com desfazer
  function applyJob(j, P, sel, ed) {
    var picked = P.changes.filter(function (c) { return sel[c.id]; });
    var edited = picked.some(function (c) { return ed[c.id] !== undefined && ed[c.id] !== c.edVal; });
    var val = function (c) { return ed[c.id] !== undefined ? ed[c.id] : c.edVal; };
    if (P.mode === 'programa') {
      var p = DB.find('programas', j.program); if (!p) return null;
      j.undo = { kind: 'programa', id: p.id, sections: clone(p.sections), pending: clone(p.pending) };
      picked.forEach(function (c) { p.sections.push(String(val(c) || c.op.sec)); });
      p.pending = p.pending.filter(function (x) { return !/sem sessões/.test(x); });
      if (p.status !== 'rascunho') p.pending.push('Seções novas da assistência aguardam publicação (' + j.ref + ')');
      p.updated = U.todayShort;
      j.draft = p.id;
    } else {
      var addedEx = false;
      if (picked.some(function (c) { return c.op.set && c.op.set.ex === 'supino-incl'; }) && !DB.find('exercicios', 'supino-incl')) {
        DB.exercicios.push({ id: 'supino-incl', name: 'Supino inclinado com halteres', group: 'Peito', equip: 'Halteres', level: 'Iniciante', media: 'video', own: false, fav: false, cues: ['Banco a 30°', 'Cotovelos a 45° do tronco'] });
        addedEx = true;
      }
      var base = P.base, nr;
      if (base && P.mode !== 'novo') {
        nr = clone(base);
        nr.id = DB.uid('r'); nr.name = base.name + ' · v' + (base.version + 1) + ' rascunho'; nr.status = 'rascunho'; nr.version = base.version + 1; nr.basedOn = base.id;
      } else {
        var who = j.student ? stu(j.student) : null;
        nr = { id: DB.uid('r'), name: P.mode === 'novo' ? 'Treino importado · ' + DB.t7_import.file : 'Primeira semana · ' + (who ? who.first : 'modelo'), folder: who && /presencial/i.test(who.svc) ? 'Presencial' : 'Online', student: j.student || '', status: 'rascunho', version: 1, lastSection: 's1', sessions: [] };
      }
      nr.savedAt = nowStamp(); nr.aiRef = j.ref;
      picked.forEach(function (c) {
        if (c.op.add) {
          var sname = c.op.sname || 'Treino importado';
          var s = nr.sessions.filter(function (x) { return x.name === sname; })[0];
          if (!s) { s = { id: 's' + (nr.sessions.length + 1), name: sname, items: [] }; nr.sessions.push(s); }
          var it = clone(c.op.add);
          if (c.ed === 'load') it.load = String(val(c) || '');
          s.items.push(it);
        } else {
          var ss = nr.sessions.filter(function (x) { return x.id === c.op.s; })[0];
          var item = ss && ss.items.filter(function (i) { return i.ex === c.op.ex; })[0];
          if (!item) return;
          Object.keys(c.op.set).forEach(function (k) { item[k] = c.op.set[k]; });
          if (c.ed === 'load') item.load = String(val(c) || '');
          if (c.ed === 'sets') item.sets = parseInt(val(c), 10) || item.sets;
        }
      });
      DB.rotinas.push(nr);
      j.undo = { kind: 'rotina', id: nr.id, addedEx: addedEx };
      j.draft = nr.id;
    }
    j.status = 'aprovada'; j.draftNew = true; j.edited = edited; j.applied = picked.length;
    return j.draft;
  }
  function undoJob(j) {
    var u = j.undo; if (!u) return false;
    if (u.kind === 'programa') { var p = DB.find('programas', u.id); if (p) { p.sections = u.sections; p.pending = u.pending; } }
    else if (u.kind === 'rotina') { DB.rotinas = DB.rotinas.filter(function (r) { return r.id !== u.id; }); if (u.addedEx) DB.exercicios = DB.exercicios.filter(function (e) { return e.id !== 'supino-incl'; }); }
    else if (u.kind === 'msg') { var cv = DB.find('conversas', u.id); if (cv) cv.draft = u.prev || ''; }
    j.status = 'pronta'; j.draft = ''; j.draftNew = false; j.applied = 0; j.edited = false; j.undo = null;
    return true;
  }

  // ======================================================================
  // H15 / IA01 · Assistência de IA (hub): o que fazer, contexto, dados usados, custo e teto
  // ======================================================================
  REG.screen({
    page: 'treinador', key: 'ia', id: 'H15', also: ['IA01'], title: 'Assistência de IA', mtitle: 'IA', nav: 'ia', back: 'TMENU', wide: true,
    normal: 'Uso recorrente',
    scens: [['primeiro', 'Primeiro uso · antes de gerar'], ['limite', 'Limite atingido'], ['parcial', 'Indisponibilidade parcial'], ['semFranquia', 'Sem franquia'], ['semRelacao', 'Sem relação autorizada'], ['estimativa', 'Estimativa'], ['naoAut', 'Relação não autorizada'], ['capacidade', 'Capacidade indisponível'], ['saldoDesc', 'Saldo desconhecido']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn;
      var noRel = scn === 'semRelacao';
      // atalhos vindos de outras telas: { rotina } (editor), { task, student }
      var pr = ctx.p.rotina ? DB.find('rotinas', ctx.p.rotina) : null;
      var tk = task(ui.task || ctx.p.task || 'revisar');
      var kind = ui.kind || (noRel ? 'modelo' : (pr && !pr.student ? 'modelo' : 'aluno'));
      var sid = ui.student !== undefined ? ui.student : (scn === 'naoAut' ? 'paula' : (pr && pr.student ? pr.student : (ctx.p.student && stu(ctx.p.student) ? ctx.p.student : 'ana')));
      var a = stu(sid);
      if (kind === 'aluno' && !a) { sid = 'ana'; a = stu('ana'); }
      var studentRots = DB.rotinas.filter(function (r) { return kind === 'aluno' ? r.student === sid : !r.student; });
      var rid = ui.rotina !== undefined ? ui.rotina : (pr ? pr.id : (studentRots[0] ? studentRots[0].id : ''));
      if (rid && !studentRots.some(function (r) { return r.id === rid; })) rid = studentRots[0] ? studentRots[0].id : '';
      var pid = ui.program || 'p2';
      if (!DB.find('programas', pid)) pid = 'p2';
      var authorized = kind !== 'aluno' || !!(a && OKREL[a.status]);
      var cr = credits(scn);
      var src = sourcesFor(kind, sid, rid, pid);
      var off = ui.off || {};
      var srcList = src.list.map(function (s) {
        var on = !off[s.k];
        return { t: s.t, d: s.d, cls: 'check' + (on ? ' is-on' : ''), on: String(on), isOn: on, toggle: function () { var o = Object.assign({}, off); o[s.k] = on; ctx.setUi({ off: o }); } };
      });
      var nOn = srcList.filter(function (s) { return s.isOn; }).length;

      // por que não dá para gerar agora (cada motivo com caminho manual)
      var block = '';
      if (scn === 'semFranquia') block = 'Seu plano não tem franquia de IA. Siga no caminho manual.';
      else if (scn === 'capacidade') block = 'Capacidade indisponível agora. Nada foi reservado.';
      else if (cr.unknown) block = 'Saldo desconhecido: sem saldo confirmado, nada é gerado.';
      else if (cr.rem < tk.cap) block = 'Créditos do mês esgotados para esta tarefa (' + cr.rem + ' restantes, teto ' + tk.cap + '). Renovam em ' + cr.resets + '.';
      else if (!authorized) block = 'Relação não autorizada: a assistência não usa dados de ' + (a ? a.first : 'quem não é seu aluno') + '.';
      else if (tk.k === 'mensagem' && kind !== 'aluno') block = 'Rascunho de mensagem precisa de um aluno com vínculo.';
      else if (tk.k === 'revisar' && kind !== 'programa' && !rid) block = 'Escolha uma rotina para revisar.';
      else if (tk.k !== 'importar' && srcList.length > 0 && nOn === 0) block = 'Escolha ao menos uma fonte de dados.';

      var pend = DB.t7_jobs.filter(function (j) { return RUN[j.status] || j.status === 'pronta'; });
      var dup = pend.filter(function (j) { return j.task === tk.k && j.kind === kind && (kind === 'aluno' ? j.student === sid && j.rotina === rid : kind === 'programa' ? j.program === pid : j.rotina === rid); })[0];

      var alerts = [];
      if (scn === 'primeiro') alerts.push(alert('info', 'Primeiro uso', 'Escolha o que fazer e o contexto. Nada é gerado até você pedir, e a proposta volta para sua revisão.'));
      if (scn === 'limite') alerts.push(alert('warn', 'Créditos do mês esgotados', '0 de ' + cr.limit + ' restantes · renovam em ' + cr.resets + '. Nada é cobrado no cartão. Siga no caminho manual.', 'Ver uso', function () { ctx.go('IA06'); }));
      if (scn === 'parcial') alerts.push(alert('warn', 'Proposta parcial', 'O serviço caiu no bloco 3 da IA-0247. Créditos não usados voltaram ao saldo.', 'Revisar o que veio', function () { ctx.go('IA03', { id: 'j247', parcial: '1' }); }));
      if (scn === 'semFranquia') alerts.push(alert('warn', 'Sem franquia', 'O plano ' + DB.trainer.plan + ' não inclui créditos de IA neste período. Montar e revisar treinos continua igual no caminho manual.', 'Saiba por quê', why(ctx, 'Por que não há franquia', 'A assistência de IA é opcional e só funciona com franquia de créditos do plano. Sem franquia, nada é cobrado à parte: você monta e revisa treinos no editor normalmente.')));
      if (scn === 'estimativa') alerts.push(alert('info', 'Estimativa', '~' + tk.est + ' créditos · teto ' + tk.cap + ' · saldo ' + cr.rem + ' de ' + cr.limit + '. Se passar do teto, a geração para e nada é cobrado além dele.'));
      if (kind === 'aluno' && a && !OKREL[a.status]) alerts.push(alert('risk', 'Relação não autorizada', a.name + (a.status === 'pedido' ? ' pediu acompanhamento, mas você ainda não aceitou.' : ' ainda não aceitou o convite.') + ' A assistência não usa dados de quem não tem vínculo ativo.', 'Saiba por quê', why(ctx, 'Relação não autorizada', 'Tarefas individuais só usam dados de alunos com vínculo ativo ou pausado com você. Aceite o pedido ou aguarde o convite para usar a assistência com esta pessoa.')));
      if (scn === 'capacidade') alerts.push(alert('warn', 'Capacidade indisponível', 'O serviço de IA está ocupado agora. Nada foi reservado nem cobrado. Tente de novo ou siga no manual.', 'Tentar de novo', function () { ctx.scenario(''); ctx.toast('Serviço disponível de novo. Nada foi cobrado.'); }));
      if (scn === 'saldoDesc') alerts.push(alert('warn', 'Saldo desconhecido', 'Não conseguimos consultar sua franquia. O saldo não é tratado como zero nem como ilimitado.', 'Consultar de novo', function () { ctx.scenario(''); ctx.toast('Saldo consultado: ' + credits('').rem + ' créditos.'); }));
      if (dup && !block && tk.k !== 'importar') alerts.push(alert('info', 'Já existe proposta para este contexto', dup.ref + ' · ' + (STATUS[dup.status] || [''])[0].toLowerCase() + ' · ' + dup.at + '. Gerar de novo é um pedido novo, com custo.', dup.status === 'pronta' ? 'Revisar proposta' : 'Acompanhar', function () { ctx.go(dup.status === 'pronta' ? 'IA03' : 'IA02', { id: dup.id }); }));

      var mk = function (list, cur, set) { return list.map(function (o) { var on = o.id === cur; return { label: o.label, cls: 'opt t7-opt' + (on ? ' is-on' : ''), on: String(on), pick: function () { set(o.id); } }; }); };
      var tasks = TASKS.map(function (t) { var on = t.k === tk.k; return { label: t.label, cls: 'opt t7-opt' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ task: t.k }); } }; });
      var kinds = [['aluno', 'Aluno'], ['modelo', 'Rotina modelo'], ['programa', 'Programa']].filter(function (k) { return !(noRel && k[0] === 'aluno'); })
        .map(function (k) { var on = k[0] === kind; return { label: k[1], cls: 'seg__it t7-seg' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ kind: k[0], rotina: undefined }); } }; });
      var studs = DB.alunos.filter(function (x) { return x.status !== 'encerrado'; }).map(function (x) { return { id: x.id, label: x.first + (OKREL[x.status] ? '' : ' · sem vínculo') }; });
      var rots = studentRots.map(function (r) { return { id: r.id, label: r.name + ' · v' + r.version }; });
      if (tk.k === 'montar') rots.push({ id: '', label: kind === 'aluno' ? 'Nova rotina' : 'Novo modelo' });
      var progs = DB.programas.map(function (p) { return { id: p.id, label: p.name + ' · ' + p.status }; });

      var manual = function () { if (kind === 'programa') ctx.go('TRE22', { id: pid }); else if (tk.k === 'mensagem') ctx.go('TRE25', { id: sid }); else ctx.go('TRE14', rid ? { id: rid } : {}); };
      var gen = function () {
        if (tk.k === 'importar') { ctx.go('IA04'); return; }
        if (block) { ctx.toast(block); return; }
        var n = DB.t7_jobs.length;
        var lbl = tk.k === 'revisar' && sid === 'ana' && rid === 'r1' && kind === 'aluno' ? 'Revisar treino B' : tk.label;
        var j = { id: DB.uid('j'), ref: 'IA-0' + (248 + n - 4), task: tk.k, label: lbl, kind: kind, student: kind === 'aluno' ? sid : '', rotina: kind === 'programa' ? '' : rid, program: kind === 'programa' ? pid : '', baseVersion: 0, status: 'fila', at: nowStamp(), t0: U.now(), t1: '', est: tk.est, cap: tk.cap, reserved: tk.cap, consumed: 0, nSources: nOn, draft: '', draftNew: false, reason: '', edited: false, applied: 0, settled: false, partial: false, note: '' };
        var base = j.rotina ? DB.find('rotinas', j.rotina) : null;
        if (base) j.baseVersion = base.version;
        if (j.program) j.baseVersion = DB.find('programas', j.program).version;
        DB.t7_jobs.unshift(j);
        runJob(j.id, ctx.refresh);
        ctx.go('IA02', { id: j.id });
      };
      var noForm = noRel && !ui.cont;
      return {
        noForm: noForm, hasForm: !noForm,
        cont: function () { ctx.setUi({ cont: true, kind: 'modelo' }); },
        alerts: alerts, demo: noRel && !!ui.cont,
        tasks: tasks, kinds: kinds, isAluno: kind === 'aluno', isModelo: kind === 'modelo', isProg: kind === 'programa', isImport: tk.k === 'importar', notImport: tk.k !== 'importar',
        studs: mk(studs, sid, function (id) { ctx.setUi({ student: id, rotina: undefined, off: {} }); }),
        rots: mk(rots, rid, function (id) { ctx.setUi({ rotina: id, off: {} }); }), hasRots: rots.length > 0, noRots: rots.length === 0,
        progs: mk(progs, pid, function (id) { ctx.setUi({ program: id, off: {} }); }),
        ctxLine: kind === 'aluno' ? 'Para ' + (a ? a.first : '') + (rid ? ' · ' + DB.find('rotinas', rid).name : ' · sem rotina') : kind === 'programa' ? 'Programa ' + DB.find('programas', pid).name + ' · sem dados individuais' : (rid ? 'Modelo ' + DB.find('rotinas', rid).name + ' · sem dados de aluno' : 'Novo modelo · sem dados de aluno'),
        srcs: srcList, hasSrcs: srcList.length > 0, noSrcs: srcList.length === 0,
        locked: src.locked, hasLocked: src.locked.length > 0,
        miss: src.miss.length ? src.miss.join(' · ') : 'nada essencial',
        privacy: kind === 'aluno' ? 'Só dados da sua relação com ' + (a ? a.first : 'o aluno') + '. Exames e arquivos de saúde não são lidos.' : 'Sem dados individuais de alunos.',
        est: '~' + tk.est + ' créditos', cap: tk.cap + ' créditos',
        saldo: cr.unknown ? 'não consultado' : (scn === 'semFranquia' ? 'sem franquia' : cr.rem + ' de ' + cr.limit + ' créditos'),
        resets: 'Renova em ' + cr.resets + '. Custo por tarefa vem da política vigente; tarefas diferentes custam diferente.',
        hasBlock: !!block, block: block,
        genLabel: tk.k === 'importar' ? 'Continuar para importar' : (dup ? 'Gerar nova proposta · até ' + tk.cap + ' créditos' : 'Gerar proposta para revisar · até ' + tk.cap + ' créditos'),
        genCls: 'btn btn--primary btn--lg btn--block' + (block && tk.k !== 'importar' ? ' t7-dis' : ''), gen: gen,
        manual: manual,
        pend: pend.map(function (j) { var st = STATUS[j.status]; return { t: j.label + ' · ' + ctxName(j), d: j.ref + ' · ' + j.at, badge: st[0], bcls: 'badge ' + st[1], go: function () { ctx.go(j.status === 'pronta' ? 'IA03' : 'IA02', { id: j.id }); } }; }),
        hasPend: pend.length > 0 && scn !== 'primeiro', noPend: !(pend.length > 0 && scn !== 'primeiro'),
        links: [
          { t: 'Importar material autorizado', d: 'PDF ou imagem técnica, com revisão', ic: 'ic ic--sm i-upload', go: function () { ctx.go('IA04'); } },
          { t: 'Insights de acompanhamento e negócio', d: 'Sugestões com fonte e cobertura', ic: 'ic ic--sm i-chart', go: function () { ctx.go('IA05'); } },
          { t: 'Uso e limite', d: cr.unknown ? 'Saldo não consultado' : cr.rem + ' de ' + cr.limit + ' créditos · renova ' + cr.resets, ic: 'ic ic--sm i-activity', go: function () { ctx.go('IA06'); } },
          { t: 'Histórico de assistências', d: U.plural(scn === 'primeiro' ? 0 : DB.t7_jobs.length, 'tarefa', 'tarefas'), ic: 'ic ic--sm i-clock', go: function () { ctx.go('IA07'); } }
        ]
      };
    }
  });

  // ======================================================================
  // IA02 · Acompanhar geração (etapas reais, reserva e confirmação do consumo)
  // ======================================================================
  REG.screen({
    page: 'treinador', key: 'ia02', id: 'IA02', title: 'Acompanhar geração', mtitle: 'IA', nav: 'ia', back: 'H15',
    testIds: ['j247'],
    normal: 'Pronta',
    scens: [['gerando', 'Gerando'], ['falhou', 'Falhou'], ['desatualizada', 'Desatualizada'], ['parcial', 'Parcial'], ['bloqueada', 'Bloqueada'], ['recusada', 'Recusada'], ['invalida', 'Inválida'], ['desconhecido', 'Resultado desconhecido']],
    vals: function (ctx) {
      var scn = ctx.scn;
      var job = DB.find('t7_jobs', ctx.id) || DB.t7_jobs.filter(function (j) { return RUN[j.status] || j.status === 'pronta'; })[0] || null;
      var empty = !job && !scn;
      var j = job ? clone(job) : clone(DB.t7_jobs[0]);
      var over = { gerando: 'gerando', falhou: 'falhou', recusada: 'falhou', invalida: 'falhou', desconhecido: 'validando' }[scn];
      if (over) { j.status = over; if (RUN[over]) { j.reserved = j.cap; j.consumed = 0; } }
      var order = ['fila', 'gerando', 'validando', 'pronta'];
      var idx = order.indexOf(j.status);
      if (j.status === 'aprovada' || j.status === 'rejeitada') idx = 3;
      var failed = j.status === 'falhou', cancelled = j.status === 'cancelada';
      if (failed || cancelled) idx = 1;
      var running = !!RUN[j.status];
      var ready = idx === 3 && !failed && !cancelled;
      var stepDefs = [['Na fila', j.t0], ['Gerando', 'lendo ' + U.plural(j.nSources || 1, 'fonte', 'fontes')], ['Validando', 'formato, limites e fontes'], ['Pronta', ready ? j.t1 : '']];
      var steps = stepDefs.map(function (s, i) {
        var st = i < idx || (ready && i === 3) ? 'done' : (i === idx && running ? 'on' : (i === idx && (failed || cancelled) ? 'bad' : 'todo'));
        var lbl = { done: 'Concluída', on: 'Em andamento', bad: failed ? 'Interrompida' : 'Cancelada', todo: 'Pendente' }[st];
        return { t: s[0], d: s[1] || '', hasD: !!s[1], cls: 't7-step t7-step--' + st, lbl: lbl, ic: st === 'done' ? 'ic ic--xs i-check' : (st === 'bad' ? 'ic ic--xs i-x' : 'ic ic--xs i-clock') };
      });
      var alerts = [];
      if (scn === 'gerando' || (running && !scn)) alerts.push(alert('info', 'Você pode continuar trabalhando', 'Pode sair desta tela. A geração continua e avisamos quando estiver pronta. Voltar aqui não gera novo pedido.'));
      if (scn === 'falhou') alerts.push(alert('risk', 'Falhou', 'A geração parou no passo 2. Reserva em conciliação: os ' + j.cap + ' créditos só voltam ao saldo depois da confirmação. Tentar de novo é um pedido novo, com custo informado.', 'Tentar de novo', function () { ctx.go('H15'); }));
      if (scn === 'desatualizada') alerts.push(alert('warn', 'Desatualizada', 'O contexto mudou depois do pedido (rotina ou check-in novos). Gere de novo para usar os dados atuais.', 'Consultar de novo', function () { ctx.go('H15'); }));
      if (scn === 'parcial') alerts.push(alert('warn', 'Parcial', 'Veio só parte da proposta (blocos 1 e 2). Os créditos não usados voltaram ao saldo.', 'Consultar de novo', function () { ctx.go('IA03', { id: j.id, parcial: '1' }); }));
      if (scn === 'recusada') alerts.push(alert('risk', 'Recusada', 'O pedido pedia diagnóstico ou conduta clínica, que a assistência não faz. Nada foi consumido.', 'Corrigir', function () { ctx.go('H15'); }));
      if (scn === 'invalida') alerts.push(alert('risk', 'Inválida', 'A resposta não passou na validação de formato e foi descartada. Nada foi consumido.', 'Corrigir', function () { ctx.go('H15'); }));
      if (scn === 'desconhecido') alerts.push(alert('warn', 'Resultado desconhecido', 'Não sabemos se a geração terminou. Consulte de novo com a mesma referência (' + j.ref + '); nada é cobrado duas vezes.', 'Consultar de novo', function () { ctx.scenario(''); ctx.toast('Consultado ' + j.ref + ': proposta pronta.'); }));
      if (cancelled) alerts.push(alert(j.settled ? 'ok' : 'warn', j.settled ? 'Reserva devolvida ao saldo' : 'Aguardando confirmação do consumo', j.settled ? 'Confirmamos que nada foi consumido: ' + j.cap + ' créditos voltaram.' : 'A geração foi cancelada. A reserva de ' + j.cap + ' créditos fica em conciliação até a confirmação.'));
      var resv = running ? j.cap + ' créditos' : (cancelled && !j.settled ? j.cap + ' em conciliação' : (failed && scn === 'falhou' ? j.cap + ' em conciliação' : '0 · liberado'));
      var conf = ready ? j.consumed + ' créditos' : (cancelled && j.settled ? '0 créditos' : '—');
      var a = j.student ? stu(j.student) : null;
      return {
        empty: empty, hasJob: !empty, blocked: scn === 'bloqueada', notBlocked: scn !== 'bloqueada' && !empty,
        newTask: function () { ctx.go('H15'); },
        whyBlocked: why(ctx, 'Por que foi bloqueada', 'O pedido usaria um dado que você não está autorizado a usar agora (por exemplo, de um aluno com vínculo encerrado). Escolha outro contexto ou siga no caminho manual.'),
        title: ready ? 'Proposta pronta' : (cancelled ? 'Geração cancelada' : (failed ? 'Geração interrompida' : 'Gerando proposta')),
        sub: (a ? a.first + ' · ' : '') + j.label.toLowerCase() + ' · ' + j.ref,
        steps: steps, alerts: alerts, running: running, ready: ready, notReady: !ready,
        reviewCls: 'btn btn--primary btn--lg btn--block' + (ready ? '' : ' t7-dis'),
        review: function () { if (!ready) { ctx.toast('A proposta ainda não está disponível. Você pode sair e voltar depois.'); return; } ctx.go('IA03', { id: j.id }); },
        work: function () { if (j.program) ctx.go('TRE22', { id: j.program }); else ctx.go('TRE14', j.rotina ? { id: j.rotina } : {}); },
        hist: function () { ctx.go('IA07', { id: j.id }); },
        cancel: function () {
          ctx.ask({ title: 'Cancelar a geração?', text: 'A geração para agora. A reserva de ' + j.cap + ' créditos fica em conciliação até confirmarmos se houve consumo; não prometemos estorno antes disso.', ok: 'Cancelar geração', danger: true, cancel: 'Continuar gerando',
            onOk: function () {
              var real = DB.find('t7_jobs', j.id); if (!real || !RUN[real.status]) { ctx.toast('Esta geração já terminou.'); return; }
              real.status = 'cancelada'; real.t1 = U.now(); real.settled = false;
              var refresh = ctx.refresh;
              setTimeout(function () { var x = DB.find('t7_jobs', j.id); if (x && x.status === 'cancelada') { x.settled = true; x.reserved = 0; x.consumed = 0; try { refresh(); } catch (e) { /* tela fechada */ } } }, 2500);
              ctx.toast('Geração cancelada. Reserva em conciliação.');
            } });
        },
        resv: resv, conf: conf, ref: j.ref, at: j.at,
        creditNote: running ? 'Créditos reservados. O consumo é confirmado quando a proposta fica pronta.' : (ready ? 'Consumo confirmado. A proposta ainda precisa da sua revisão.' : 'Nada é cobrado duas vezes ao voltar para esta tela.')
      };
    }
  });

  // ======================================================================
  // IA03 · Revisar proposta e alterações (fato × hipótese, seleção, edição, aplicar com desfazer)
  // ======================================================================
  REG.screen({
    page: 'treinador', key: 'ia03', id: 'IA03', title: 'Revisar proposta', mtitle: 'Revisar', nav: 'ia', back: 'history',
    testIds: ['j247', 'j241', 'ana'],
    normal: 'Aguardando revisão',
    scens: [['contexto', 'Contexto mudou'], ['aprovada', 'Aprovada'], ['rejeitada', 'Rejeitada'], ['pendente', 'Pendente de revisão'], ['parcialEd', 'Parcialmente editada'], ['invalidada', 'Aprovação invalidada'], ['conflito', 'Conflito']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn;
      var job = DB.find('t7_jobs', ctx.id), virt = null;
      if (!job && ctx.id && ctx.p.from === 'TRE28') {
        job = DB.t7_jobs.filter(function (x) { return x.kind === 'social' && x.note === ctx.id; })[0] || null;
        if (!job) virt = { id: '', ref: 'Diagnóstico', task: 'social', label: 'Sugestão do diagnóstico', kind: 'social', student: '', rotina: '', program: '', baseVersion: 0, status: 'pronta', at: '26/10 ' + U.now(), t0: '', t1: '', est: 0, cap: 0, reserved: 0, consumed: 0, nSources: 1, draft: '', draftNew: false, reason: '', edited: false, applied: 0, settled: true, partial: false, note: ctx.id };
      } else if (!job && ctx.id && stu(ctx.id)) {
        job = DB.t7_jobs.filter(function (x) { return x.task === 'mensagem' && x.student === ctx.id && (x.status === 'pronta' || x.status === 'aprovada'); })[0] || null;
        if (!job) virt = { id: '', ref: 'Rascunho da conversa', task: 'mensagem', label: 'Rascunho de mensagem', kind: 'aluno', student: ctx.id, rotina: '', program: '', baseVersion: 0, status: 'pronta', at: '26/10 ' + U.now(), t0: '', t1: '', est: 1, cap: 2, reserved: 0, consumed: 0, nSources: 2, draft: '', draftNew: false, reason: '', edited: false, applied: 0, settled: true, partial: false, note: '' };
      } else if (!job && !ctx.id) job = DB.t7_jobs.filter(function (x) { return x.status === 'pronta'; })[0] || null;
      // proposta que chega de outra tela vira registro só quando o treinador decide
      var materialize = function () {
        if (job) return job;
        if (!virt) return null;
        var n = clone(virt); n.id = DB.uid('j'); n.ref = 'IA-0' + (248 + DB.t7_jobs.length - 4);
        DB.t7_jobs.unshift(n); job = n; return n;
      };
      var none = !job && !virt;
      var j = job || virt || DB.t7_jobs[0];
      var P = build(j);
      if (ctx.p.parcial) P.changes = P.changes.slice(0, 2);
      var sel = ui.sel || {};
      var ed = ui.ed || (scn === 'parcialEd' && P.changes[0] ? (function () { var o = {}; o[P.changes[0].id] = P.changes[0].ed === 'load' ? '30 kg' : P.changes[0].edVal; return o; })() : {});
      var editing = !!ui.editing || scn === 'parcialEd';
      var isSel = function (c) { return sel[c.id] !== undefined ? sel[c.id] : c.def; };
      var running = !!RUN[j.status];
      var status = { aprovada: 'aprovada', rejeitada: 'rejeitada' }[scn] || j.status;
      var base = P.base;
      var ctxChanged = scn === 'contexto' || scn === 'invalidada' || (j.status === 'pronta' && base && j.baseVersion && base.version !== j.baseVersion);
      var conflict = scn === 'conflito';
      var reacked = !!ui.reack;
      var lockApply = (ctxChanged || conflict) && !reacked;
      var nSel = P.changes.filter(isSel).length;
      var a = j.student ? stu(j.student) : null;
      var isMsg = P.mode === 'mensagem', isSocial = P.mode === 'social';

      var changes = P.changes.map(function (c) {
        var on = isSel(c), edv = ed[c.id] !== undefined ? ed[c.id] : c.edVal;
        var shown = ed[c.id] !== undefined && ed[c.id] !== c.edVal ? c.to.replace(c.edVal || 'carga a definir', ed[c.id] || 'carga a definir') + ' (editado por você)' : c.to;
        return {
          where: c.where, from: c.from, to: shown, why: c.why, isFact: /^Fato/.test(c.why), wcls: 'badge ' + (/^Fato/.test(c.why) ? 'badge--ink' : 'badge--warn'), wk: /^Fato/.test(c.why) ? 'Fato' : 'Hipótese', whyTxt: c.why.replace(/^(Fato|Hipótese fraca|Hipótese):\s*/, ''),
          on: String(on), ccls: 'check' + (on ? ' is-on' : ''), rcls: 't7-chg' + (on ? '' : ' t7-chg--off'),
          toggle: function () { var o = Object.assign({}, sel); o[c.id] = !on; ctx.setUi({ sel: o }); },
          canEdit: editing && !!c.ed, edLabel: c.ed === 'sets' ? 'Séries' : (c.ed === 'sec' ? 'Nome da seção' : (c.ed === 'txt' ? 'Texto' : 'Carga')), edVal: String(edv || ''),
          setEd: function (e) { var o = Object.assign({}, ed); o[c.id] = U.val(e); ctx.setUi({ ed: o }); }
        };
      });
      var view = ui.view || 'bloco';
      var msgText = ui.msg !== undefined ? ui.msg : P.text;

      var alerts = [];
      if (running) alerts.push(alert('info', 'Ainda gerando', 'Esta proposta ainda não está pronta. Acompanhe a geração; nada é cobrado de novo.', 'Acompanhar', function () { ctx.go('IA02', { id: j.id }); }));
      if (ctx.p.parcial) alerts.push(alert('warn', 'Proposta parcial', 'Veio só parte da proposta (blocos 1 e 2). Revise o que veio ou gere de novo depois.'));
      if (ctxChanged && !reacked) alerts.push(alert('warn', scn === 'invalidada' ? 'Aprovação invalidada' : 'Contexto alterado: revise novamente', 'A rotina ou os dados mudaram depois da proposta' + (base ? ' (agora v' + base.version + ')' : '') + '. A aprovação anterior não vale; confira as diferenças antes de adicionar.', scn === 'invalidada' ? 'Corrigir' : 'Revisar novamente', function () { ctx.setUi({ reack: true }); }));
      if (conflict && !reacked) alerts.push(alert('warn', 'Conflito', 'Força base · semana 3 foi editada em outro aparelho às 10:52. Compare antes de adicionar; nada foi sobrescrito.', 'Revisar', function () { ctx.setUi({ reack: true }); }));
      if (scn === 'pendente') alerts.push(alert('info', 'Pendente de revisão', 'Proposta guardada desde ' + j.at + '. Nada foi aplicado.', 'Consultar de novo', function () { ctx.scenario(''); ctx.toast('Proposta ' + j.ref + ' continua igual.'); }));
      if (scn === 'parcialEd') alerts.push(alert('info', 'Parcialmente editada', 'Você editou 1 mudança. Ela entra como edição sua, não da assistência.'));

      var reasons = ['Não faz sentido para ' + (a ? a.first : 'este contexto'), 'Fonte errada ou desatualizada', 'Prefiro fazer manualmente', 'Outro motivo'];
      var rej = ui.rejReason || '';
      var draft = status === 'aprovada' && j.draft ? DB.find(P.mode === 'programa' ? 'programas' : 'rotinas', j.draft) : null;
      return {
        none: none, hasJob: !none, newTask: function () { ctx.go('H15'); }, hist: function () { ctx.go('IA07'); },
        title: isMsg ? 'Rascunho de mensagem' : 'Revisar proposta',
        sub: j.label + (a ? ' · ' + a.first : '') + (j.kind === 'programa' ? ' · ' + ctxName(j) : '') + ' · ' + j.ref,
        alerts: alerts, isMsg: isMsg, notMsg: !isMsg,
        segs: [['bloco', 'Por bloco'], ['lado', 'Lado a lado']].map(function (s) { var on = view === s[0]; return { label: s[1], cls: 'seg__it t7-seg' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ view: s[0] }); } }; }),
        byBlock: view === 'bloco', sideBy: view === 'lado', baseLabel: P.baseLabel,
        changes: changes, hasChanges: changes.length > 0, noChanges: changes.length === 0,
        facts: P.facts.map(function (f) { return { k: f.k, t: f.t, cls: 'badge ' + (f.k === 'Fato' ? 'badge--ink' : (f.k === 'Hipótese' ? 'badge--warn' : 'badge--plain')) }; }),
        sources: P.sources.map(function (s) { return { t: s.t, d: s.d, go: function () { ctx.go(s.to, s.id ? { id: s.id } : {}); } }; }), hasSources: P.sources.length > 0,
        msgText: msgText, editing: editing, notEditing: !editing, setMsg: function (e) { ctx.setUi({ msg: U.val(e) }); },
        toggleEdit: function () { ctx.setUi({ editing: !editing }); }, editLabel: editing ? 'Concluir edição' : (isMsg ? 'Editar texto' : 'Editar antes'),
        pending: status === 'pronta', isOther: status === 'falhou' || status === 'cancelada', otherTxt: resultTxt(j) + '. Esta tarefa não gerou proposta para revisar; repetir é um pedido novo, com custo informado.',
        isApproved: status === 'aprovada', isRejected: status === 'rejeitada', isRunning: running,
        decideTxt: isSocial ? 'A sugestão vai para a revisão do seu perfil. Nada é publicado sem você.' : isMsg ? 'O texto volta para a conversa com ' + (a ? a.first : 'o aluno') + ' como rascunho. Nada é enviado sem você.'
          : (P.mode === 'programa' ? 'Adicionar ' + nSel + ' de ' + P.changes.length + ' seções ao rascunho do programa. Publicar continua sendo um passo seu.'
            : 'Adicionar ' + nSel + ' de ' + P.changes.length + ' mudanças a um rascunho novo' + (base ? ' de ' + base.name : '') + '. Nada vai para ' + (a ? a.first : 'alunos') + ' sem você atribuir.'),
        applyLabel: isSocial ? 'Adicionar ao rascunho do perfil' : isMsg ? 'Adicionar ao rascunho da conversa' : 'Adicionar ' + U.plural(nSel, 'mudança', 'mudanças') + ' ao rascunho',
        applyCls: 'btn btn--primary btn--lg btn--block' + ((lockApply || (!isMsg && nSel === 0)) ? ' t7-dis' : ''),
        hasLock: lockApply, lockTxt: conflict ? 'Resolva o conflito antes de adicionar.' : 'Revise de novo antes de adicionar.',
        apply: function () {
          if (lockApply) { ctx.toast(conflict ? 'Resolva o conflito antes de adicionar.' : 'Contexto alterado: revise novamente antes de adicionar.'); return; }
          if (!(job || virt) || (job || virt).status !== 'pronta') { ctx.toast(running ? 'A proposta ainda está sendo gerada.' : 'Esta proposta já foi decidida.'); return; }
          if (isSocial) {
            ctx.ask({ title: 'Levar a sugestão para o perfil?', lines: [P.changes[0].to, 'Abre a revisão do perfil com a sugestão anotada. Nada é publicado sem você.'], ok: 'Adicionar ao rascunho',
              onOk: function () { var r = materialize(); r.status = 'aprovada'; r.applied = 1; r.edited = ed.s1 !== undefined && ed.s1 !== P.changes[0].edVal; r.draft = ''; r.undo = null; ctx.toast('Sugestão anotada para revisar o perfil.'); } });
            return;
          }
          if (isMsg) {
            ctx.ask({ title: 'Adicionar ao rascunho da conversa?', text: 'O texto fica no campo de mensagem da conversa com ' + (a ? a.first : 'o aluno') + ', ainda não enviado.', ok: 'Adicionar ao rascunho',
              onOk: function () {
                job = materialize();
                var cv = DB.find('conversas', j.student);
                if (!cv) { cv = { id: j.student, with: j.student, unread: 0, msgs: [] }; DB.conversas.push(cv); }
                job.undo = { kind: 'msg', id: cv.id, prev: cv.draft || '' };
                cv.draft = msgText; job.status = 'aprovada'; job.draft = cv.id; job.draftNew = true; job.edited = msgText !== P.text; job.applied = 1;
                ctx.toast('Rascunho adicionado à conversa. Ainda não foi enviado.');
              } });
            return;
          }
          if (nSel === 0) { ctx.toast('Marque ao menos uma mudança.'); return; }
          var picked = P.changes.filter(isSel).map(function (c) { return c.where + ': ' + (ed[c.id] !== undefined ? c.from + ' → editado (' + ed[c.id] + ')' : c.from + ' → ' + c.to); });
          ctx.ask({ title: 'Adicionar ' + U.plural(nSel, 'mudança', 'mudanças') + ' ao rascunho?', lines: picked.concat([P.mode === 'programa' ? 'Publicar o programa continua sendo outro passo.' : 'Cria um rascunho novo; a versão atual' + (a ? ' de ' + a.first : '') + ' não muda. Atribuir é outro passo.']), ok: 'Adicionar ao rascunho',
            onOk: function () {
              job = materialize();
              var selAll = {}; P.changes.forEach(function (c) { selAll[c.id] = isSel(c); });
              var id = applyJob(job, P, selAll, ed);
              if (!id) { ctx.toast('Não foi possível adicionar. Nada foi alterado.'); return; }
              ctx.setUi({ editing: false });
              ctx.toast('Adicionado ao rascunho. Atribuir é um passo separado.');
            } });
        },
        draftName: draft ? draft.name : (j.note || ''), draftLine: !j.draftNew && j.note ? j.note : draft ? (P.mode === 'programa' ? 'Seções adicionadas · publicar é outro passo' : 'Rascunho v' + draft.version + ' · salvo ' + draft.savedAt + ' · atribuir é outro passo') : (isMsg ? 'Na conversa, ainda não enviado' : 'Vira versão; atribuir é outro passo'),
        openDraft: function () { if (isSocial) ctx.go('ACC06'); else if (isMsg) ctx.go('TRE25', { id: j.student }); else if (P.mode === 'programa') ctx.go('TRE22', { id: j.program }); else ctx.go('TRE14', { id: j.draft || j.rotina }); },
        openLabel: isSocial ? 'Revisar perfil' : (isMsg ? 'Abrir conversa' : 'Abrir rascunho'),
        canUndo: !!(job && job.status === 'aprovada' && job.draftNew && job.undo),
        undo: function () { if (!job || !undoJob(job)) { ctx.toast('Nada para desfazer.'); return; } ctx.toast('Desfeito. O rascunho foi removido e a proposta voltou para revisão.'); },
        rejReason: j.reason || (scn === 'rejeitada' ? 'Prefiro fazer manualmente' : ''),
        retry: function () { ctx.go('H15'); },
        rejOpen: !!ui.rej, rejClosed: !ui.rej, openRej: function () { ctx.setUi({ rej: true }); }, closeRej: function () { ctx.setUi({ rej: false }); },
        reasons: reasons.map(function (r) { var on = r === rej; return { label: r, cls: 'opt t7-opt' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ rejReason: r }); } }; }),
        rejErr: !!ui.rejErr, doRej: function () {
          if (!rej) { ctx.setUi({ rejErr: true }); return; }
          if (!(job || virt) || (job || virt).status !== 'pronta') { ctx.toast('Esta proposta já foi decidida.'); return; }
          job = materialize();
          job.status = 'rejeitada'; job.reason = rej;
          ctx.toast('Proposta rejeitada. Motivo registrado.');
          ctx.go('IA07', { id: job.id });
        },
        limitTxt: 'Não é diagnóstico. Aprovar não publica nem atribui.',
        afterTxt: isSocial ? 'Publicar o perfil é um passo separado.' : a ? 'Atribuir à ' + a.first + ' é um passo separado.' : 'Publicar ou atribuir é um passo separado.'
      };
    }
  });

  // ======================================================================
  // IA04 · Importar e revisar material autorizado
  // ======================================================================
  REG.screen({
    page: 'treinador', key: 'ia04', id: 'IA04', title: 'Importar material', mtitle: 'Importar', nav: 'ia', back: 'H15', wide: true,
    normal: 'Antes de ler',
    scens: [['unidade', 'Unidade incerta'], ['exercicio', 'Exercício incerto'], ['falhou', 'Leitura falhou'], ['invalido', 'Arquivo inválido'], ['semEstimativa', 'Estimativa indisponível: não iniciar pago'], ['aguardando', 'Aguardando autorização'], ['parcial', 'Extração parcial'], ['unidadeDesc', 'Unidade desconhecida'], ['ambiguo', 'Exercício ambíguo'], ['teto', 'Teto atingido: interromper'], ['revogada', 'Permissão revogada'], ['recuperavel', 'Falha recuperável']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn, im = DB.t7_import;
      var forceRead = { unidade: 1, exercicio: 1, parcial: 1, unidadeDesc: 1, ambiguo: 1 }[scn];
      var phase = forceRead ? 'lido' : ({ falhou: 'falhou', teto: 'falhou', recuperavel: 'falhou' }[scn] || im.status);
      var rights = scn === 'aguardando' ? '' : (forceRead && !im.rights ? 'meu' : im.rights);
      var unit = { unidade: '', unidadeDesc: '' }[scn] !== undefined ? '' : im.unit;
      var exPick = { exercicio: '', ambiguo: '' }[scn] !== undefined ? '' : im.exPick;
      var cr = credits('');
      var noEst = scn === 'semEstimativa';
      var revoked = scn === 'revogada';
      var invalid = scn === 'invalido';
      var alerts = [];
      if (scn === 'unidade') alerts.push(alert('warn', 'Unidade incerta', '“40” no agachamento: kg ou lb? Confira esta unidade antes de seguir.', 'Consultar original', function () { ctx.setUi({ orig: 'm1' }); }));
      if (scn === 'exercicio') alerts.push(alert('warn', 'Exercício incerto', '“Desenv. halt.” não foi identificado. Sugerimos 3 opções; você escolhe.', 'Consultar original', function () { ctx.setUi({ orig: 'm3' }); }));
      if (scn === 'falhou') alerts.push(alert('risk', 'Leitura falhou', 'Original guardado e nada consumido. O arquivo continua aqui para tentar de novo.', 'Tentar de novo', function () { ctx.scenario(''); }));
      if (scn === 'invalido') alerts.push(alert('risk', 'Arquivo inválido', 'Use PDF ou imagem técnica de até 10 MB. Foto da galeria não é fonte técnica.', 'Corrigir', function () { ctx.scenario(''); ctx.toast('Escolha outro arquivo. O anterior foi descartado.'); }));
      if (noEst) alerts.push(alert('warn', 'Estimativa indisponível: não iniciar pago', 'Sem estimativa de custo, a leitura não começa. Nada foi reservado.', 'Tentar de novo', function () { ctx.scenario(''); }));
      if (scn === 'aguardando' || (!rights && phase === 'novo')) alerts.push(alert('info', 'Aguardando autorização', 'Confirme os direitos sobre o material antes da leitura.', scn === 'aguardando' ? 'Consultar de novo' : '', function () { ctx.scenario(''); }));
      if (scn === 'parcial') alerts.push(alert('warn', 'Extração parcial', 'A página 2 não foi lida. O que veio da página 1 está abaixo; o original fica preservado.', 'Consultar de novo', function () { ctx.scenario(''); }));
      if (scn === 'unidadeDesc') alerts.push(alert('warn', 'Unidade desconhecida', 'O arquivo não informa a unidade da carga. Escolha kg ou lb; não adivinhamos.', 'Consultar original', function () { ctx.setUi({ orig: 'm1' }); }));
      if (scn === 'ambiguo') alerts.push(alert('warn', 'Exercício ambíguo', '“Desenv. halt.” pode ser mais de um exercício do catálogo. Revise a sugestão.', 'Revisar', function () { ctx.setUi({ orig: 'm3' }); }));
      if (scn === 'teto') alerts.push(alert('risk', 'Teto atingido: interromper', 'A leitura parou no teto de 4 créditos. Nada além do teto é cobrado; o original e o rascunho ficam preservados.', 'Corrigir', function () { ctx.scenario(''); }));
      if (scn === 'recuperavel') alerts.push(alert('warn', 'Falha recuperável', 'A conexão caiu durante a leitura. O original está guardado e a reserva volta ao saldo.', 'Corrigir', function () { ctx.scenario(''); }));
      if (phase === 'lendo') alerts.push(alert('info', 'Lendo o material', 'Você pode sair desta tela. A leitura continua e o resultado fica aqui.'));

      var rows = [
        { id: 'm1', orig: 'AGACHAMENTO 4x8 — 40', read: 'Agachamento 4 × 8 · 40' + (unit ? ' ' + unit : ''), ok: !!unit, flag: unit ? 'ok' : 'Unidade incerta', kind: 'unit' },
        { id: 'm2', orig: 'REMADA CURV. 3x10 — 50kg', read: 'Remada curvada 3 × 10 · 50 kg', ok: true, flag: 'ok', kind: '' }
      ];
      if (scn !== 'parcial') rows.push({ id: 'm3', orig: 'DESENV. HALT. 3x12 — 8kg', read: exPick ? (exPick === 'ignorar' ? 'Linha ignorada' : exName(exPick) + ' 3 × 12' + (exPick === 'mob-ombro' ? '' : ' · 8 kg')) : 'Exercício não identificado', ok: !!exPick, flag: exPick ? 'ok' : 'Exercício não identificado', kind: 'ex' });
      var units = ['kg', 'lb'].map(function (u) { var on = unit === u; return { label: u, cls: 'seg__it t7-seg' + (on ? ' is-on' : ''), on: String(on), pick: function () { im.unit = u; ctx.refresh(); } }; });
      var exOpts = [['mob-ombro', 'Mobilidade de ombro com bastão'], ['supino', 'Supino reto'], ['ignorar', 'Ignorar esta linha']].map(function (o) { var on = exPick === o[0]; return { label: o[1], cls: 'opt t7-opt' + (on ? ' is-on' : ''), on: String(on), pick: function () { im.exPick = o[0]; ctx.refresh(); } }; });
      var vrows = rows.map(function (r) {
        var hl = ui.orig === r.id;
        return { read: r.read, orig: r.orig, flag: r.flag, bcls: 'badge ' + (r.ok ? 'badge--ok' : 'badge--warn'), rcls: 't7-imrow' + (hl ? ' is-hl' : ''), ocls: 't7-orig__l' + (hl ? ' is-hl' : ''),
          isUnit: r.kind === 'unit' && !r.ok, isEx: r.kind === 'ex' && !r.ok, units: units, exOpts: exOpts,
          fixUnit: r.kind === 'unit' && !!r.ok, fixEx: r.kind === 'ex' && !!r.ok,
          see: function () { ctx.setUi({ orig: hl ? '' : r.id }); }, seeLabel: hl ? 'Ocultar original' : 'Consultar original',
          redo: function () { if (r.kind === 'unit') im.unit = ''; else im.exPick = ''; ctx.refresh(); } };
      });
      var pending = rows.filter(function (r) { return !r.ok; }).length;
      var rightsOpts = [['meu', 'Material meu'], ['autorizado', 'Tenho autorização']].map(function (o) { var on = rights === o[0]; return { label: o[1], cls: 'check' + (on ? ' is-on' : ''), on: String(on), pick: function () { if (im.status !== 'novo' && im.rights) { ctx.toast('Os direitos já foram confirmados para esta leitura.'); return; } im.rights = o[0]; ctx.refresh(); } }; });
      var canStart = phase === 'novo' && !!rights && !noEst && !invalid && !revoked && cr.rem >= 4;
      return {
        revoked: revoked, notRevoked: !revoked,
        whyRevoked: why(ctx, 'Permissão revogada', 'A Ana retirou a autorização de uso deste material. O arquivo não é lido nem usado; o que você já tinha em rascunho continua seu. Peça uma nova autorização ou siga no manual.'),
        file: invalid ? 'foto_galeria.heic' : im.file, fileLine: invalid ? 'imagem da galeria · não aceita' : im.pages + ' páginas · ' + im.size + ' · enviado ' + im.at + ' · de Ana',
        alerts: alerts, rights: rightsOpts, rightsErr: !!ui.rErr && !rights,
        isNew: phase === 'novo', isReading: phase === 'lendo', isRead: phase === 'lido', isFailed: phase === 'falhou', notRead: phase !== 'lido',
        est: noEst ? 'indisponível' : '~2 créditos', cap: '4 créditos', saldo: cr.rem + ' de ' + cr.limit + ' créditos',
        startCls: 'btn btn--primary btn--lg btn--block' + (canStart ? '' : ' t7-dis'),
        start: function () {
          if (!rights) { ctx.setUi({ rErr: true }); return; }
          if (noEst) { ctx.toast('Sem estimativa, a leitura paga não começa.'); return; }
          if (!canStart) { ctx.toast(invalid ? 'Escolha um PDF ou imagem técnica.' : 'Saldo insuficiente para o teto desta leitura.'); return; }
          ctx.ask({ title: 'Ler ' + im.file + '?', lines: ['Estimativa: ~2 créditos · teto: 4 créditos', 'Se passar do teto, a leitura para; nada além dele é cobrado.', 'O original fica preservado. Nada é publicado ou atribuído.'], ok: 'Ler material',
            onOk: function () {
              im.status = 'lendo';
              var refresh = ctx.refresh;
              setTimeout(function () { if (DB.t7_import.status !== 'lendo') return; DB.t7_import.status = 'lido'; DB.t7_import.consumed = 2; DB.trainer.iaCredits.used += 2; try { refresh(); } catch (e) { /* tela fechada */ } }, 2200);
              ctx.toast('Leitura iniciada. Você pode sair desta tela.');
            } });
        },
        rows: vrows, pendingTxt: pending ? U.plural(pending, 'linha precisa', 'linhas precisam') + ' de você antes de revisar' : 'Tudo conferido. Revise o conteúdo extraído.',
        reviewCls: 'btn btn--primary btn--lg btn--block' + (pending || phase !== 'lido' ? ' t7-dis' : ''),
        review: function () {
          if (phase !== 'lido') { ctx.toast('Leia o material antes de revisar.'); return; }
          if (pending) { ctx.toast('Confira as linhas marcadas antes de revisar.'); return; }
          var existing = im.job && DB.find('t7_jobs', im.job);
          if (existing && existing.status === 'pronta') { ctx.go('IA03', { id: existing.id }); return; }
          var j = { id: DB.uid('j'), ref: 'IA-0' + (248 + DB.t7_jobs.length - 4), task: 'importar', label: 'Importar PDF', kind: 'arquivo', student: im.student, rotina: '', program: '', baseVersion: 0, status: 'pronta', at: nowStamp(), t0: U.now(), t1: U.now(), est: 2, cap: 4, reserved: 0, consumed: im.consumed || 2, nSources: 1, draft: '', draftNew: false, reason: '', edited: false, applied: 0, settled: true, partial: false, note: im.file };
          DB.t7_jobs.unshift(j); im.job = j.id;
          ctx.go('IA03', { id: j.id });
        },
        manual: function () { ctx.go('TRE14'); },
        consumed: im.consumed ? im.consumed + ' créditos confirmados' : 'nada consumido ainda'
      };
    }
  });

  // ======================================================================
  // IA05 · Insight de acompanhamento ou negócio
  // ======================================================================
  REG.screen({
    page: 'treinador', key: 'ia05', id: 'IA05', title: 'Insights da assistência', mtitle: 'Insights', nav: 'ia', back: 'history',
    normal: 'Com sugestões',
    scens: [['pouca', 'Pouca informação'], ['util', 'Útil'], ['acao', 'Ação'], ['rejeitada', 'Sugestão rejeitada'], ['indisponivel', 'Serviço indisponível']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn;
      var area = ui.area || 'acompanhamento';
      var alerts = [];
      if (scn === 'acao') alerts.push(alert('info', 'Ação', 'Criar tarefa abre uma tarefa para você. Nada é aplicado ao treino nem enviado ao aluno.', 'Saiba por quê', why(ctx, 'Por que só abre uma tarefa', 'Sugestões vêm de correlações nos registros. Elas não provam causa nem segurança clínica, então a decisão e qualquer mudança de carga ficam com você.')));
      if (scn === 'indisponivel') alerts.push(alert('warn', 'Serviço indisponível', 'As sugestões não foram atualizadas hoje. Os dados de origem continuam nas telas de alunos e de insights.', 'Tentar de novo', function () { ctx.scenario(''); ctx.toast('Sugestões atualizadas às ' + U.now() + '.'); }));
      if (scn === 'rejeitada') alerts.push(alert('info', 'Sugestão rejeitada', 'Registramos que a primeira sugestão não foi útil. Isso só ajusta as próximas; não mede eficácia.', 'Corrigir', function () { var i = DB.find('t7_insights', 'i1'); if (i) i.fb = ''; ctx.scenario(''); ctx.toast('Feedback removido.'); }));
      var list = DB.t7_insights.filter(function (i) { return scn === 'pouca' ? i.insufficient : i.area === area; });
      var cards = list.map(function (i, n) {
        var fb = i.fb || (n === 0 && scn === 'util' ? 'util' : (n === 0 && scn === 'rejeitada' ? 'nao' : ''));
        var open = !!(ui.src || {})[i.id];
        var setFb = function (v) { return function () { i.fb = i.fb === v ? '' : v; ctx.toast(i.fb ? 'Feedback registrado. Não comprova eficácia.' : 'Feedback removido.'); }; };
        return {
          title: i.title, base: i.base, fact: i.fact, src: i.src, hyp: i.hyp, hasHyp: !!i.hyp, insufficient: i.insufficient, sufficient: !i.insufficient,
          hasAct: !!i.act, act: i.act, doAct: function () { ctx.go(i.to, i.pid ? { id: i.pid } : {}); },
          hasAct2: !!i.act2, act2: i.act2, doAct2: function () { ctx.go(i.to2, i.pid2 ? { id: i.pid2 } : {}); },
          hasTask: !!i.task, taskDone: !!i.taskDone, taskOpen: !!i.task && !i.taskDone,
          mkTask: function () {
            var nid = DB.uid('nt');
            DB.notificacoes.unshift({ id: nid, kind: 'tarefa', text: i.task, at: 'agora', read: false, to: i.taskTo, id2: i.taskId });
            i.taskDone = true; i.taskNid = nid;
            ctx.toast('Tarefa criada em Notificações e tarefas. Nada foi aplicado.');
          },
          undoTask: function () { DB.notificacoes = DB.notificacoes.filter(function (x) { return x.id !== i.taskNid; }); i.taskDone = false; i.taskNid = ''; ctx.toast('Tarefa removida.'); },
          seeTasks: function () { ctx.go('TRE26'); },
          srcOpen: open, srcLabel: open ? 'Ocultar fontes' : 'Ver fontes', toggleSrc: function () { var o = Object.assign({}, ui.src || {}); o[i.id] = !open; ctx.setUi({ src: o }); },
          sources: i.sources.map(function (s) { return { t: s[0], d: s[1] }; }),
          uCls: 'btn btn--sm ' + (fb === 'util' ? 'btn--primary' : 'btn--outline'), nCls: 'btn btn--sm ' + (fb === 'nao' ? 'btn--primary' : 'btn--outline'),
          uOn: String(fb === 'util'), nOn: String(fb === 'nao'), hasFb: !!fb, fbTxt: fb === 'util' ? 'Útil · feedback registrado' : 'Não útil · feedback registrado',
          util: setFb('util'), nao: setFb('nao')
        };
      });
      return {
        alerts: alerts, few: scn === 'pouca', notFew: scn !== 'pouca',
        areas: [['acompanhamento', 'Acompanhamento'], ['negocio', 'Negócio']].map(function (s) { var on = area === s[0]; return { label: s[1], cls: 'seg__it t7-seg' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ area: s[0] }); } }; }),
        areaNote: area === 'negocio' ? 'Negócio usa só visitas, contatos e vendas. Nenhum dado de saúde entra aqui.' : 'Acompanhamento usa dados dos seus alunos com vínculo ativo, só para você.',
        cards: cards, hasCards: cards.length > 0, noCards: cards.length === 0,
        hist: function () { ctx.go('IA07'); }, hub: function () { ctx.go('H15'); }
      };
    }
  });

  // ======================================================================
  // IA06 · Uso e limite de IA
  // ======================================================================
  REG.screen({
    page: 'treinador', key: 'ia06', id: 'IA06', title: 'Uso de IA', nav: 'ia', back: 'H15', wide: true,
    normal: 'Uso do mês',
    scens: [['indisponivel', 'Saldo indisponível'], ['limite', 'Limite atingido'], ['reposicao', 'Reposição'], ['futura', 'Reposição futura'], ['desconhecido', 'Saldo desconhecido']],
    vals: function (ctx) {
      var scn = ctx.scn, cr = credits(scn);
      var unk = cr.unknown;
      var alerts = [];
      if (scn === 'indisponivel') alerts.push(alert('warn', 'Saldo indisponível', 'Não foi possível consultar. Isso não quer dizer 0: seus créditos continuam lá.', 'Consultar de novo', function () { ctx.scenario(''); ctx.toast('Saldo consultado às ' + U.now() + '.'); }));
      if (scn === 'desconhecido') alerts.push(alert('warn', 'Saldo desconhecido', 'O saldo deste momento não foi confirmado. Novas tarefas ficam pausadas; o caminho manual continua aberto.', 'Consultar de novo', function () { ctx.scenario(''); ctx.toast('Saldo consultado às ' + U.now() + '.'); }));
      if (scn === 'limite') alerts.push(alert('warn', 'Limite atingido', 'Use o caminho manual até ' + cr.resets + '. Sem cobrança extra por tarefa.', 'Saiba por quê', why(ctx, 'Por que parou', 'A franquia do mês acabou. A 99Coach não cobra tarefas além da franquia: novas tarefas de IA voltam em ' + cr.resets + ' às 00:00 (Brasília). Tudo continua disponível sem IA.')));
      if (scn === 'reposicao') alerts.push(alert('info', 'Reposição', cr.limit + ' créditos em ' + cr.resets + ' às 00:00 (Brasília). Créditos não usados não acumulam.'));
      if (scn === 'futura') alerts.push(alert('info', 'Reposição futura', 'No plano anual, a franquia repõe todo mês, sempre no dia 01. A próxima é ' + cr.resets + '.', 'Saiba por quê', why(ctx, 'Reposição mensal', 'Mesmo no plano anual a franquia é mensal: você recebe ' + cr.limit + ' créditos a cada dia 01, sem acumular.')));
      var n = function (x) { return unk ? '—' : String(x); };
      var used = DB.t7_jobs.filter(function (j) { return j.consumed > 0 || RUN[j.status] || (j.status === 'cancelada' && !j.settled); });
      return {
        alerts: alerts, unk: unk, known: !unk,
        plan: 'Plano ' + DB.trainer.plan + ' · outubro de 2026',
        kpis: [{ l: 'Créditos consumidos', n: n(cr.used) }, { l: 'Reservados', n: n(cr.reserved) }, { l: 'Restantes', n: n(cr.rem) }],
        pct: unk ? 'não consultado' : cr.pct + '%', barStyle: 'width:' + (unk ? 0 : cr.pct) + '%',
        updated: unk ? 'Fonte: franquia 99Coach · consulta falhou às ' + U.now() : 'Fonte: franquia 99Coach · consultado 26/10 às ' + U.now(),
        kv: [['Franquia mensal', cr.limit + ' créditos'], ['Reservado', n(cr.reserved)], ['Consumido', n(cr.used)], ['Restante', n(cr.rem)], ['Reposição', cr.resets + ' às 00:00 (Brasília)']].map(function (r) { return { k: r[0], v: r[1] }; }),
        costs: TASKS.map(function (t) { return { t: t.label, d: '~' + t.est + ' créditos · teto ' + t.cap }; }),
        rows: used.map(function (j) { return { t: j.label + ' · ' + ctxName(j), d: j.ref + ' · ' + j.at, n: RUN[j.status] ? j.reserved + ' reservados' : (j.status === 'cancelada' ? j.cap + ' em conciliação' : j.consumed + ' créditos'), go: function () { ctx.go('IA07', { id: j.id }); } }; }),
        hasRows: used.length > 0,
        manual: function () { ctx.go('TRE14'); }, plan2: function () { ctx.go('FT11'); }, estimate: function () { ctx.go('H15'); }
      };
    }
  });

  // ======================================================================
  // IA07 · Histórico de assistências (referência selecionada)
  // ======================================================================
  REG.screen({
    page: 'treinador', key: 'ia07', id: 'IA07', title: 'Histórico de assistências', mtitle: 'Histórico', nav: 'ia', back: 'H15',
    testIds: ['j241', 'j229'],
    normal: 'Com histórico',
    scens: [['naoAut', 'Dado não autorizado mais'], ['filtro', 'Filtro'], ['nenhuma', 'Nenhuma ainda'], ['pendente', 'Proposta pendente'], ['rejeitada', 'Rejeitada'], ['falha', 'Falha']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn;
      var sel = ui.open !== undefined ? ui.open : ctx.id;
      var fs = ui.fs || 'todos', fr = ui.fr || 'todos';
      var filtOpen = ui.filt !== undefined ? ui.filt : scn === 'filtro';
      var blocked = scn === 'naoAut' && !ui.cont;
      var all = scn === 'nenhuma' ? [] : DB.t7_jobs;
      var grp = function (j) { return RUN[j.status] || j.status === 'pronta' ? 'pendente' : j.status; };
      var list = all.filter(function (j) { return (fs === 'todos' || j.student === fs) && (fr === 'todos' || grp(j) === fr); });
      var alerts = [];
      if (scn === 'pendente') alerts.push(alert('info', 'Proposta pendente', 'IA-0247 aguarda sua revisão desde 26/10 10:40. Nada foi aplicado.', 'Revisar proposta', function () { ctx.go('IA03', { id: 'j247' }); }));
      if (scn === 'rejeitada') alerts.push(alert('info', 'Rejeitada', 'IA-0233 foi rejeitada: unidade errada. O motivo fica registrado; importar de novo é uma tarefa nova.', 'Corrigir', function () { ctx.go('IA04'); }));
      if (scn === 'falha') alerts.push(alert('warn', 'Falha', 'IA-0229 não terminou e a reserva foi devolvida. Repetir é uma decisão nova, com custo informado.', 'Corrigir', function () { ctx.go('H15'); }));
      if (scn === 'naoAut' && ui.cont) alerts.push(alert('info', 'Reabrindo sem dados não autorizados', 'Tarefas com aluno aparecem sem os dados individuais.'));
      var rows = list.map(function (j) {
        var open = sel === j.id, st = STATUS[j.status] || ['—', 'badge--plain'];
        var hide = scn === 'naoAut' && !!j.student;
        var dr = j.draft ? (j.kind === 'programa' ? DB.find('programas', j.draft) : DB.find('rotinas', j.draft)) : null;
        return {
          t: j.label + (j.kind === 'arquivo' ? '' : ' · ' + (hide ? 'contexto indisponível' : ctxName(j))), d: resultTxt(j) + ' · ' + j.at.split(' ')[0],
          badge: st[0], bcls: 'badge ' + st[1], open: open, rcls: 't7-hrow' + (open ? ' is-open' : ''), exp: String(open),
          click: function () {
            if (RUN[j.status]) { ctx.go('IA02', { id: j.id }); return; }
            if (j.status === 'pronta' && !hide) { ctx.go('IA03', { id: j.id }); return; }
            ctx.setUi({ open: open ? '' : j.id });
          },
          kv: [['Referência', j.ref], ['Tarefa', j.label], ['Contexto', hide ? 'Este contexto não está mais disponível' : ctxName(j)], ['Fontes lidas', String(j.nSources)], ['Consumo', j.consumed ? j.consumed + ' créditos' : (j.status === 'cancelada' && !j.settled ? 'reserva em conciliação' : '0 créditos')], ['Resultado', resultTxt(j)]].concat(j.note ? [['Observação', j.note]] : []).map(function (r) { return { k: r[0], v: r[1] }; }),
          hasDraft: !!dr && !hide, draftLabel: j.kind === 'programa' ? 'Abrir programa' : (j.task === 'mensagem' ? 'Abrir conversa' : 'Abrir rascunho'),
          openDraft: function () { if (j.kind === 'programa') ctx.go('TRE22', { id: j.draft }); else if (j.task === 'mensagem') ctx.go('TRE25', { id: j.student }); else ctx.go('TRE14', { id: j.draft }); },
          isFail: j.status === 'falhou' || j.status === 'rejeitada' || j.status === 'cancelada',
          note: 'Execução concluída não significa aceita. Útil ou não útil não mede eficácia.'
        };
      });
      var studs = [{ id: 'todos', label: 'Todos' }].concat(DB.alunos.filter(function (a) { return DB.t7_jobs.some(function (j) { return j.student === a.id; }); }).map(function (a) { return { id: a.id, label: a.first }; }));
      var res = [['todos', 'Todos'], ['pendente', 'Aguardando revisão'], ['aprovada', 'Aprovadas'], ['rejeitada', 'Rejeitadas'], ['falhou', 'Falhas']];
      return {
        blocked: blocked, notBlocked: !blocked, cont: function () { ctx.setUi({ cont: true }); },
        alerts: alerts, rows: rows, hasRows: rows.length > 0, emptyAll: all.length === 0, emptyFilter: all.length > 0 && rows.length === 0,
        hasAny: all.length > 0, showFilt: filtOpen && all.length > 0, filtOpen: String(filtOpen), filtLabel: filtOpen ? 'Fechar filtro' : 'Filtrar', toggleFilt: function () { ctx.setUi({ filt: !filtOpen }); },
        fStud: studs.map(function (s) { var on = s.id === fs; return { label: s.label, cls: 'opt t7-opt' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ fs: s.id }); } }; }),
        fRes: res.map(function (s) { var on = s[0] === fr; return { label: s[1], cls: 'opt t7-opt' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ fr: s[0] }); } }; }),
        clear: function () { ctx.setUi({ fs: 'todos', fr: 'todos' }); },
        count: U.plural(rows.length, 'tarefa', 'tarefas'),
        newTask: function () { ctx.go('H15'); }, usage: function () { ctx.go('IA06'); }
      };
    }
  });
})();
