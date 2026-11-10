/* O3 · OPS14 Governança de IA (+ OPS14.A capacidades do treinador, OPS14.B fontes e versões, OPS14.C avaliação e decisão, OPS14.D incidente e interrupção).
   Só capacidades do treinador (aluno não tem IA); custos e franquias ficam em FA07/FA10; mudar regra não altera treino já aprovado. */
(function () {
  'use strict';
  var O3 = window.O3;
  var linkRows = function (rows) { return rows.map(function (r) { return { label: r[0], sub: r[1], ic: 'ic ic--sm i-' + r[2], go: function () { GO(r[3], r[4] || {}); } }; }); };
  O3.rev('o3ia', function (d) { var x = DB.find('o3_ia', d.id); if (x) { x.estado = d.estado; x.prop = d.prop || ''; x.who = d.who || ''; } });
  O3.rev('o3inc', function (d) { var I = DB.o3_incidente; Object.keys(d).forEach(function (k) { I[k] = d[k]; }); });
  var NOTREINO = 'Mudar regra não altera treino já aprovado: o treinador revisa qualquer rascunho novo.';

  // ---------- OPS14 · composição ----------
  REG.screen({
    page: 'operacao', key: 'ops14', id: 'OPS14', title: 'Governança de IA', mtitle: 'IA', nav: 'governanca', wide: true, testIds: ['pdf', 'progressao'],
    normal: 'Capacidades', scens: [['incidente', 'Incidente'], ['retomado', 'Retomado'], ['novaversao', 'Nova versão']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn;
      var list = DB.o3_ia.map(function (x) { return scn === 'retomado' && x.id === 'pdf' && x.estado === 'pausada' ? Object.assign({}, x, { estado: 'ativa', who: 'Lia M. · 25/10 10:02' }) : x; });
      var ld = O3.ld(ctx, list, 'sel', scn === 'incidente' ? 'rascunho' : (scn === 'retomado' ? 'pdf' : (scn === 'novaversao' ? 'rascunho' : (ctx.id || ''))));
      var x = ld.cur;
      var paused = x.estado === 'pausada', notHomol = x.estado === 'não homologada';
      var rows = list.map(function (c) { return { id: c.id, name: c.name, sub: 'modelo ' + c.ver + ' · ' + c.estado, st: c.estado, stCls: O3.tone(c.estado), cls: ld.rowCls(c.id) + ' lrow', go: ld.pick(c.id) }; });
      var real = DB.find('o3_ia', x.id);
      var incOpen = x.id === 'pdf' && scn !== 'retomado';
      var toggle = function () {
        if (scn === 'retomado' && x.id === 'pdf' && real.estado === 'pausada') { ctx.toast('Situação de demonstração: a capacidade já aparece retomada.'); return; }
        O3.decide(ctx, {
          title: (paused ? 'Retomar ' : 'Desligar ') + x.name + '?', ok: paused ? 'Retomar' : 'Desligar capacidade', danger: !paused, scope: 'ops14', action: (paused ? 'Retomada · ' : 'Desligada · ') + x.name, target: 'versão ' + x.ver,
          impact: paused ? ['Treinadores voltam a ver a capacidade a partir de agora.', 'Limites seguem a ' + x.lim + '.', NOTREINO] : ['Novas execuções param; treinadores veem “indisponível” e seguem pelo caminho manual.', 'Trabalho já aceito pelo fornecedor não é cancelado; custo vai para conciliação (FA10).', NOTREINO],
          apply: function () { real.estado = paused ? 'ativa' : 'pausada'; real.who = O3.ME + ' · 26/10 ' + U.now(); }, rev: 'o3ia', data: { id: x.id, estado: real.estado, who: real.who || '' }
        });
      };
      var alerts = [];
      if (scn === 'incidente') alerts.push(O3.alert('risk', 'Incidente', 'INC-9 · fornecedor degradado afeta Rascunho de treino desde 13:52. Desligue a capacidade ou acompanhe o incidente.', 'Abrir incidente', function () { GO('OPS14.D'); }));
      if (scn === 'retomado') alerts.push(O3.alert('ok', 'Retomado', 'Importar PDF voltou em 25/10 às 10:02 por Lia M.: incidente #I-7 encerrado após 40 PDFs de teste sem erro.'));
      if (scn === 'novaversao') alerts.push(O3.alert('info', 'Nova versão', 'A instrução p-8 de Rascunho de treino só entra depois da avaliação.', ui.why ? 'Fechar explicação' : 'Saiba por quê', function () { ctx.setUi({ why: !ui.why }); }));
      var kv = [O3.kv('Público', x.publico), O3.kv('Finalidade', x.fin), O3.kv('Entradas autorizadas', x.entradas), O3.kv('Versão', x.ver), O3.kv('Avaliação', x.aval + ' · ' + x.avalSrc), O3.kv('Limites e custo', x.lim), O3.kv('Estado', x.estado, x.estado)];
      if (x.who) kv.push(O3.kv('Última mudança', x.who));
      var det = [];
      if (notHomol) det.push(O3.btn(ctx, 'Abrir avaliação', function () { GO('OPS14.C'); }, { kind: 'btn--primary' }));
      else det.push(O3.btn(ctx, paused ? 'Retomar' : 'Desligar capacidade', toggle, { kind: paused ? 'btn--primary' : 'btn--outline o3-danger', dis: paused && incOpen, why: 'Incidente #I-7 ainda aberto: resolva antes de retomar.' }));
      det.push(O3.btn(ctx, 'Fontes e versões', function () { GO('OPS14.B'); }, { kind: 'btn--ghost' }));
      var rc = O3.rcPack(ctx, 'ops14');
      return {
        hasEyebrow: true, eyebrow: 'Regras · IA do treinador', h1: 'Governança de IA', sub: 'Capacidades, versões, avaliação, limites e incidentes · ' + O3.WHEN,
        acts: [O3.btn(ctx, 'Capacidades', function () { GO('OPS14.A'); }), O3.btn(ctx, 'Custos e franquias (FA07)', function () { GO('FA07'); })],
        alerts: alerts, showWhy: scn === 'novaversao' && !!ui.why,
        why: 'Toda versão nova passa por cenários revisados por profissionais antes de chegar aos treinadores. Aprovar a avaliação não muda nenhum treino já entregue; os rascunhos novos continuam passando pela revisão do treinador.',
        ldCls: ld.ldCls, rows: rows, toList: ld.toList, cur: { name: x.name, st: x.estado, stCls: O3.tone(x.estado) }, kv: kv, detActs: det,
        dec: O3.reason(ctx, paused ? 'Motivo da retomada' : 'Motivo do desligamento'), showReason: !notHomol, note: NOTREINO,
        links: linkRows([['Capacidades do treinador', 'Finalidade, entradas e estado', 'sparkle', 'OPS14.A'], ['Fontes e versões', 'p-7 × p-8', 'swap', 'OPS14.B'], ['Avaliação e decisão', 'p-8 · 120 cenários', 'checksq', 'OPS14.C'], ['Incidente e interrupção', 'INC-9 · fornecedor degradado', 'alert', 'OPS14.D']]),
        rcs: rc.rcs, hasRcs: rc.hasRcs
      };
    }
  });

  // ---------- OPS14.A · capacidades do treinador ----------
  REG.screen({
    page: 'operacao', key: 'ops14a', id: 'OPS14.A', title: 'Capacidades de IA', mtitle: 'Capacidades', nav: 'governanca', back: 'OPS14', wide: true,
    normal: 'Catálogo', scens: [['naohomol', 'Não homologada'], ['restrita', 'Restrita'], ['pausada', 'Pausada'], ['semfonte', 'Sem fonte ou contexto'], ['fornecedor', 'Fornecedor indisponível']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn;
      var down = scn === 'fornecedor';
      var items = DB.o3_ia.filter(function (x) { return ['rascunho', 'checkin', 'progressao'].indexOf(x.id) >= 0; });
      var sel = ui.cap ? DB.find('o3_ia', ui.cap) : null;
      var rows = items.map(function (x) {
        var st = down ? 'indisponível · fornecedor' : (scn === 'semfonte' && x.id === 'checkin' ? 'sem contexto' : x.estado);
        var on = !!sel && sel.id === x.id;
        return { name: x.name, publico: x.publico, entradas: x.entradas, ver: x.ver, st: st + (x.prop ? ' · ' + x.prop : ''), stCls: O3.tone(st), fin: x.fin, on: String(on), cls: 'btn btn--sm ' + (on ? 'btn--primary' : 'btn--outline'),
          pick: function () { ctx.setUi({ cap: on ? '' : x.id }); }, aval: function () { GO('OPS14.C'); } };
      });
      var propose = function (kind) {
        return function () {
          if (!sel) { ctx.toast('Escolha uma capacidade na lista.'); return; }
          if (kind === 'hab' && sel.estado === 'não homologada') { ctx.toast('Sem avaliação aprovada: abra a avaliação antes de propor habilitação.'); return; }
          if (sel.prop) { ctx.toast('Já existe proposta para ' + sel.name + '. Use o recibo para desfazer.'); return; }
          O3.decide(ctx, {
            title: (kind === 'hab' ? 'Propor habilitação de ' : 'Propor pausa de ') + sel.name + '?', ok: kind === 'hab' ? 'Propor habilitação' : 'Propor pausa', scope: 'ops14a',
            action: (kind === 'hab' ? 'Habilitação proposta · ' : 'Pausa proposta · ') + sel.name, target: 'versão ' + sel.ver,
            impact: kind === 'hab' ? ['Vai para a alçada de governança; nada muda até a aprovação.', 'Público continua só treinador.', NOTREINO] : ['Se aprovada, novas execuções param e o treinador segue pelo caminho manual.', NOTREINO],
            apply: function () { sel.prop = kind === 'hab' ? 'habilitação proposta' : 'pausa proposta'; }, rev: 'o3ia', data: { id: sel.id, estado: sel.estado, prop: '', who: sel.who || '' }
          });
        };
      };
      var alerts = [];
      if (scn === 'naohomol') alerts.push(O3.alert('warn', 'Não homologada', 'Sugestão de progressão não tem avaliação. Treinadores não veem a capacidade.', 'Abrir avaliação', function () { GO('OPS14.C'); }));
      if (scn === 'restrita') alerts.push(O3.alert('info', 'Restrita', 'Resumo de check-in está liberado só para 20 treinadores do piloto desde 10/10.'));
      if (scn === 'pausada') alerts.push(O3.alert('warn', 'Pausada', 'Importar PDF está pausada pelo incidente #I-7. Treinadores importam manualmente.', 'Ver governança', function () { GO('OPS14', { id: 'pdf' }); }));
      if (scn === 'semfonte') alerts.push(O3.alert('warn', 'Sem fonte ou contexto', 'Resumo de check-in fica indisponível quando o aluno não autorizou o formulário. Nenhum dado de saúde é usado fora do contexto autorizado.'));
      if (down) alerts.push(O3.alert('risk', 'Fornecedor indisponível', 'Todas as capacidades mostram “indisponível” desde 13:52. O caminho manual continua aberto.', 'Ver incidente', function () { GO('OPS14.D'); }));
      alerts.push(O3.alert('info', 'Aluno não tem IA', 'Nenhuma capacidade tem aluno como público: sem chat, trial ou carteira.'));
      var rc = O3.rcPack(ctx, 'ops14a');
      return {
        hasEyebrow: false, eyebrow: '', h1: 'Capacidades de IA', sub: 'Exclusivas do treinador',
        acts: [O3.btn(ctx, 'Política de custo em FA07', function () { GO('FA07'); })],
        ctx: O3.ctx('ia.governanca.ler', 'Catálogo de capacidades'), alerts: alerts, rows: rows,
        hasSel: !!sel, selName: sel ? sel.name : '',
        decTitle: sel ? 'Proposta para ' + sel.name : 'Proposta', hasImpact: true, impact: ['Propostas vão para a alçada de governança; nada muda na hora.', NOTREINO],
        dec: O3.reason(ctx), decActs: [O3.btn(ctx, 'Propor pausa', propose('pausa'), { size: 'btn--lg' }), O3.btn(ctx, 'Propor habilitação', propose('hab'), { kind: 'btn--primary', size: 'btn--lg', dis: !!sel && sel.estado === 'não homologada', why: 'Sem avaliação aprovada: abra a avaliação antes.' })],
        rcs: rc.rcs, hasRcs: rc.hasRcs
      };
    }
  });

  // ---------- OPS14.B · fontes e versões ----------
  var REFS = ['biblioteca 99Coach v13', 'diretriz de progressão v2', 'glossário de exercícios PT/EN/ES'];
  REG.screen({
    page: 'operacao', key: 'ops14b', id: 'OPS14.B', title: 'Fontes e versões', mtitle: 'Versões', nav: 'governanca', back: 'OPS14',
    normal: 'p-7 × p-8', scens: [['expirada', 'Fonte expirada'], ['incompat', 'Instrução incompatível'], ['semproc', 'Resultado sem procedência'], ['obsoleta', 'Versão obsoleta']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn;
      var x = DB.find('o3_ia', 'rascunho');
      var refs = ui.refs || [];
      var diff = [
        ['Modelo', 'modelo-a 2026-06', scn === 'incompat' ? 'modelo-a 2026-06 (sem suporte a citação)' : 'modelo-a 2026-09'],
        ['Instrução', 'p-7', 'p-8 · cita fonte do exercício'],
        ['Fonte', scn === 'expirada' ? 'biblioteca 99Coach v12 (expirou 20/10)' : 'biblioteca 99Coach v12', 'v13'],
        ['Limite', '[política FA07.C]', '[sem mudança]']
      ].map(function (d) { return { k: d[0], a: d[1], b: d[2], same: d[1] === d[2] }; });
      var blocked = !!x.prop || scn === 'incompat' || scn === 'obsoleta';
      var why = x.prop ? 'Proposta já preparada. Use o recibo para desfazer.' : (scn === 'incompat' ? 'Instrução p-8 exige citação; o modelo escolhido não suporta.' : 'p-7 está obsoleta: já existe proposta p-9 em revisão.');
      var prepare = function () {
        O3.decide(ctx, { title: 'Preparar proposta p-8?', ok: 'Preparar proposta', scope: 'ops14b', action: 'Proposta p-8 preparada', target: 'Rascunho de treino',
          impact: ['Cria a proposta para avaliação; nada vai para treinadores agora.', 'Referências anexadas: ' + (refs.length ? refs.join(', ') : 'nenhuma além da biblioteca v13') + '.', NOTREINO],
          apply: function () { x.prop = 'p-8 em avaliação'; }, rev: 'o3ia', data: { id: x.id, estado: x.estado, prop: '', who: x.who || '' } });
      };
      var alerts = [];
      if (scn === 'expirada') alerts.push(O3.alert('warn', 'Fonte expirada', 'A biblioteca v12 expirou em 20/10. A proposta p-8 já usa a v13; p-7 segue até a troca.'));
      if (scn === 'incompat') alerts.push(O3.alert('risk', 'Instrução incompatível', 'A instrução p-8 pede citação de fonte, que o modelo-a 2026-06 não suporta. Escolha a versão 2026-09.'));
      if (scn === 'semproc') alerts.push(O3.alert('warn', 'Resultado sem procedência', '3 respostas de teste não citaram a fonte do exercício. Elas contam como falha na avaliação.', 'Abrir avaliação', function () { GO('OPS14.C'); }));
      if (scn === 'obsoleta') alerts.push(O3.alert('info', 'Versão obsoleta', 'p-7 está sendo substituída pela proposta p-9 (em revisão desde 25/10). Compare com a p-9 antes.'));
      alerts.push(O3.alert('info', 'Sem chaves ou segredos nesta tela', 'Credenciais do fornecedor ficam fora do protótipo. Exemplos usam só dados sintéticos; nada de saúde vai para notas genéricas.'));
      var rc = O3.rcPack(ctx, 'ops14b');
      return {
        hasEyebrow: false, eyebrow: '', h1: 'Fontes e versões', sub: 'Rascunho de treino · p-7 × p-8',
        acts: [O3.btn(ctx, 'Preparar proposta', prepare, { kind: 'btn--primary', dis: blocked, why: why })],
        ctx: O3.ctx('ia.governanca.propor', 'Instrução p-8'), alerts: alerts, diff: diff,
        refs: REFS.map(function (r) { var on = refs.indexOf(r) >= 0; return { label: r, cls: 'chip' + (on ? ' is-on' : ''), on: String(on), go: function () { ctx.setUi({ refs: on ? refs.filter(function (z) { return z !== r; }) : refs.concat([r]) }); } }; }),
        decTitle: 'Preparar proposta', hasImpact: true, impact: ['Vai para avaliação (120 cenários) antes de qualquer uso.', NOTREINO],
        dec: O3.reason(ctx), decActs: [O3.btn(ctx, 'Preparar proposta', prepare, { kind: 'btn--primary', size: 'btn--lg', dis: blocked, why: why })],
        rcs: rc.rcs, hasRcs: rc.hasRcs
      };
    }
  });

  // ---------- OPS14.C · avaliação e decisão ----------
  REG.screen({
    page: 'operacao', key: 'ops14c', id: 'OPS14.C', title: 'Avaliação p-8', mtitle: 'Avaliação', nav: 'governanca', back: 'OPS14',
    normal: 'Avaliação completa', scens: [['cobertura', 'Cobertura insuficiente'], ['regressao', 'Regressão'], ['inconclusivo', 'Critério inconclusivo'], ['invalidada', 'Aprovação invalidada']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn;
      var x = DB.find('o3_ia', 'rascunho');
      var decided = x.evalDecision || '';
      var crit = [
        ['Respeita restrição médica informada', '118/120', 'não substitui avaliação clínica'],
        ['Volume dentro da faixa', scn === 'regressao' ? '109/120 (p-7: 115)' : '115/120', 'faixa proposta pelo revisor'],
        ['Cita fonte do exercício', '120/120', '—']
      ].map(function (c) { return { k: c[0], r: c[1], l: c[2] }; });
      var blocked = !!decided || scn === 'cobertura' || scn === 'inconclusivo' || scn === 'invalidada';
      var why = decided ? 'Decisão já registrada: ' + decided + '. Use o recibo para desfazer.' : ({ cobertura: 'Cobertura insuficiente: faltam cenários de iniciantes acima de 60 anos.', inconclusivo: 'Critério inconclusivo: aguarde a segunda revisão.', invalidada: 'A fonte mudou depois da avaliação: reavalie.' })[scn] || '';
      var decide = function (ok) {
        return function () {
          if (decided) { ctx.toast(why); return; }
          if (ok && blocked) { ctx.toast(why); return; }
          O3.decide(ctx, { title: ok ? 'Aprovar p-8 para Rascunho de treino?' : 'Reprovar p-8?', ok: ok ? 'Aprovar para esta capacidade' : 'Reprovar', danger: !ok, scope: 'ops14c',
            action: ok ? 'p-8 aprovada · Rascunho de treino' : 'p-8 reprovada', target: '120 cenários · 3 falhas críticas',
            impact: ok ? ['Vale só para a capacidade Rascunho de treino.', 'Aprovar o modelo não aplica treino em aluno; ativação é etapa separada.', 'As 3 falhas críticas viram casos acompanhados.', 'Resultado de teste não é eficácia clínica.'] : ['p-7 continua em uso.', 'A proposta volta para ajuste com o motivo registrado.'],
            apply: function () { x.evalDecision = ok ? 'aprovada' : 'reprovada'; }, rev: 'o3evalDec', data: {} });
        };
      };
      var alerts = [];
      if (scn === 'cobertura') alerts.push(O3.alert('warn', 'Cobertura insuficiente', 'Só 4 cenários de iniciantes acima de 60 anos (mínimo 15). Aprovação bloqueada até completar.'));
      if (scn === 'regressao') alerts.push(O3.alert('risk', 'Regressão', '“Volume dentro da faixa” caiu de 115 para 109 de 120 em relação à p-7. Explique no motivo se aprovar.'));
      if (scn === 'inconclusivo') alerts.push(O3.alert('warn', 'Critério inconclusivo', 'Revisores divergiram em 6 cenários de volume. Aguarde a segunda revisão.'));
      if (scn === 'invalidada') alerts.push(O3.alert('risk', 'Aprovação invalidada por mudança', 'A biblioteca passou para v14 depois da avaliação de 25/10. A aprovação anterior não vale; reavalie.', 'Ver fontes e versões', function () { GO('OPS14.B'); }));
      if (decided) alerts.push(O3.alert('ok', 'Decisão registrada', 'p-8 ' + decided + '. ' + NOTREINO));
      var rc = O3.rcPack(ctx, 'ops14c');
      return {
        hasEyebrow: false, eyebrow: '', h1: 'Avaliação p-8', sub: '120 cenários · avaliação de 25/10',
        acts: [O3.btn(ctx, 'Reprovar', decide(false), { dis: !!decided, why: why }), O3.btn(ctx, 'Aprovar para esta capacidade', decide(true), { kind: 'btn--primary', dis: blocked, why: why })],
        ctx: O3.ctx('ia.governanca.aprovar', 'Rascunho de treino · p-8'), alerts: alerts,
        kpis: [{ n: '120', l: 'Cenários' }, { n: '112', l: 'Aprovados por revisão profissional' }, { n: '3', l: 'Falhas críticas' }],
        kpiSrc: 'Fonte: avaliação p-8 de 25/10 · revisão de 2 profissionais por cenário', crit: crit,
        openCase: function () { GO('OPS02'); },
        decTitle: 'Registrar decisão', hasImpact: true, impact: ['Aprovar vale só para Rascunho de treino.', 'Aprovar modelo não aplica treino em aluno.', 'Resultado de teste não é eficácia clínica.'],
        dec: O3.reason(ctx), decActs: [O3.btn(ctx, 'Reprovar', decide(false), { size: 'btn--lg', dis: !!decided, why: why }), O3.btn(ctx, 'Aprovar para esta capacidade', decide(true), { kind: 'btn--primary', size: 'btn--lg', dis: blocked, why: why })],
        rcs: rc.rcs, hasRcs: rc.hasRcs
      };
    }
  });
  O3.rev('o3evalDec', function () { var x = DB.find('o3_ia', 'rascunho'); if (x) x.evalDecision = ''; });

  // ---------- OPS14.D · incidente e interrupção ----------
  REG.screen({
    page: 'operacao', key: 'ops14d', id: 'OPS14.D', title: 'Incidente de IA', mtitle: 'Incidente', nav: 'governanca', back: 'OPS14',
    normal: 'Novas execuções pausadas', scens: [['aberto', 'Incidente recém-aberto'], ['revogado', 'Direito revogado antes do provedor'], ['aceita', 'Chamada já aceita'], ['custo', 'Custo incerto'], ['parcial', 'Resultado parcial'], ['orcamento', 'Orçamento indisponível']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn, I = DB.o3_incidente;
      var paused = scn === 'aberto' ? !!I.pausedNow : I.paused;
      var pausedAt = scn === 'aberto' ? (I.pausedNowAt || '') : I.pausedAt;
      var consulted = (I.consults || 0) > 0;
      var accepted = consulted ? 'conciliado às ' + I.consultAt + ': 4 jobs cobrados, 0 duplicados' : I.accepted;
      var steps = [
        O3.step('Novas execuções', paused ? 'pausadas ' + pausedAt : 'ainda ativas', paused ? 'Confirmado' : 'Em andamento'),
        O3.step('Jobs aceitos pelo fornecedor', accepted, consulted ? 'Confirmado' : 'Desconhecido', consulted ? null : { act: function () { consult(); }, actLabel: 'Consultar' }),
        O3.step('Reservas na fila', scn === 'orcamento' ? 'retidas: orçamento indisponível' : I.reservas, scn === 'orcamento' ? 'Pendente' : 'Confirmado')
      ];
      var consult = function () { I.consults = (I.consults || 0) + 1; I.consultAt = U.now(); ctx.toast('Consultado às ' + U.now() + ': 4 jobs aceitos, nenhum duplicado. Agora você pode revisar a retomada.'); };
      var pause = function () {
        O3.decide(ctx, { title: 'Pausar novas execuções de ' + I.cap + '?', ok: 'Pausar novas execuções', danger: true, scope: 'ops14d', action: 'Novas execuções pausadas · ' + I.id, target: I.cap,
          impact: ['Para só as novas tarefas; ' + I.jobs + ' seguem (não cancelamos trabalho já aceito).', 'Treinadores veem “indisponível” e seguem pelo caminho manual.', 'Créditos reservados da fila voltam (FA10).'],
          apply: function () { I.pausedNow = true; I.pausedNowAt = U.now(); }, rev: 'o3inc', data: { pausedNow: false, pausedNowAt: '' } });
      };
      var resume = function () {
        if (!consulted) { ctx.toast('Resultado desconhecido: consulte os jobs aceitos antes de retomar.'); return; }
        O3.decide(ctx, { title: 'Retomar ' + I.cap + '?', ok: 'Retomar', scope: 'ops14d', action: 'Retomada revisada · ' + I.id, target: I.cap,
          impact: ['Novas execuções voltam para todos os treinadores.', 'Custos ficam na conciliação do FA10.', NOTREINO],
          apply: function () { I.resumed = true; I.paused = false; }, rev: 'o3inc', data: { resumed: false, paused: I.paused } });
      };
      var forward = function () {
        if (I.forwarded) { ctx.toast('Incidente já encaminhado. Acompanhe pelo caso.'); return; }
        I.forwarded = true;
        var r = O3.receipt({ scope: 'ops14d', action: 'Incidente encaminhado', target: I.id + ' · fornecedor', reason: 'Degradação desde 13:52' });
        ctx.toast('Encaminhado · recibo ' + r.id);
      };
      var alerts = [];
      if (scn === 'aberto' && !paused) alerts.push(O3.alert('risk', 'Incidente recém-aberto', 'O fornecedor degradou às 13:52 e novas execuções ainda estão entrando. Pause as novas tarefas; o trabalho já aceito segue.'));
      if (scn === 'revogado') alerts.push(O3.alert('warn', 'Direito revogado antes do provedor', '2 tarefas eram de treinadores que revogaram a autorização às 13:58. O resultado é descartado sem chegar a eles.'));
      if (scn === 'aceita') alerts.push(O3.alert('info', 'Chamada já aceita', '4 jobs já estavam com o fornecedor. Não dá para cancelar; o custo vai para conciliação.'));
      if (scn === 'custo') alerts.push(O3.alert('warn', 'Custo incerto', 'O fornecedor ainda não confirmou o valor dos jobs aceitos. A conciliação fica em FA10.', 'Abrir FA10', function () { GO('FA10'); }));
      if (scn === 'parcial') alerts.push(O3.alert('warn', 'Resultado parcial', '3 rascunhos voltaram incompletos e não foram entregues. Os treinadores foram avisados para montar manualmente.'));
      if (scn === 'orcamento') alerts.push(O3.alert('risk', 'Orçamento indisponível', 'O limite da política FA07.C foi atingido. Novas execuções continuam pausadas mesmo após o fornecedor voltar.', 'Abrir FA07', function () { GO('FA07'); }));
      if (I.resumed) alerts.push(O3.alert('ok', 'Retomada registrada', I.cap + ' voltou. O histórico do incidente fica no recibo.'));
      var rc = O3.rcPack(ctx, 'ops14d');
      var acts = [];
      if (!paused) acts.push(O3.btn(ctx, 'Pausar novas execuções', pause, { kind: 'btn--primary' }));
      acts.push(O3.btn(ctx, 'Encaminhar incidente', forward));
      if (paused && !I.resumed) acts.push(O3.btn(ctx, 'Revisar retomada', resume, { kind: 'btn--primary', dis: !consulted || scn === 'orcamento', why: scn === 'orcamento' ? 'Orçamento indisponível: ajuste em FA07 antes de retomar.' : 'Resultado desconhecido: consulte os jobs aceitos antes de retomar.' }));
      return {
        hasEyebrow: false, eyebrow: '', h1: 'Incidente de IA', sub: I.id + ' · ' + I.title,
        acts: acts, ctx: O3.ctx('ia.governanca.incidente', I.cap), alerts: alerts, steps: steps,
        kv: [O3.kv('Última confirmação', I.last), O3.kv('Jobs', I.jobs), O3.kv('Impacto', 'treinadores veem “indisponível”; créditos reservados voltam'), O3.kv('Responsável', 'Lia M.'), O3.kv('Caminho manual', 'aberto para todos os treinadores')],
        decTitle: 'Pausar novas tarefas ≠ cancelar trabalho aceito', hasImpact: true, impact: ['Pausar impede novas tarefas a partir de agora.', 'Trabalho já aceito pelo fornecedor não é cancelado nem estornado aqui.', 'Custos e franquias: FA07/FA10.'],
        dec: O3.reason(ctx), decActs: acts.map(function (a) { return { label: a.label, dis: a.dis, cls: a.cls.replace('btn--sm', 'btn--lg'), go: a.go }; }),
        rcs: rc.rcs, hasRcs: rc.hasRcs
      };
    }
  });
})();
