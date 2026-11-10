/* O6 · FA09 Execução de ações sensíveis (+ A confirmação recente/MFA, B revisão final, C execução durável e recibo).
   Toda ação sensível pede motivo, mostra impacto, confirma uma vez e gera recibo. Segunda aprovação só quando a política de risco pede,
   e quem solicita não aprova. Resultado desconhecido: consultar antes de repetir; nunca "tentar de novo" que possa devolver em dobro. */
(function () {
  var O6 = window.O6;
  function st(a) { return O6.STATUS[a.status] || ['—', 'plain']; }
  function title(a) { return a.tipo + ' ' + a.ref; }
  function mfaOk(s) { return /^\d{6}$/.test(String(s || '').replace(/\s/g, '')); }
  function impact(a, motivo) {
    var l = ['Ambiente: ' + O6.env().name, 'Alvo: ' + a.alvo + ' · ' + a.acct, a.valor == null ? 'Escopo: ' + a.itens : 'Valor: ' + O6.valor(a) + ' para ' + a.dest, 'Efeito: ' + a.efeito];
    l.push(O6.needs2(a) ? 'Política ' + DB.o6_risco.versao + ': exige 2ª aprovação de outra pessoa' : 'Política ' + DB.o6_risco.versao + ': não exige 2ª aprovação');
    if (motivo) l.push('Motivo: ' + motivo);
    return l;
  }
  function actionKv(a) {
    return [
      ['Ação', title(a)], ['Valor', O6.valor(a), a.valor == null ? '' : 'calculado ' + a.versao.replace('calculado ', '') + ' · fonte: pedido'],
      ['Alvo', a.alvo + ' · ' + a.acct], [a.valor == null ? 'Escopo' : 'Itens', a.itens], a.valor == null ? null : ['Destinatário', a.dest], ['Efeito', a.efeito],
      ['Situação', st(a)[0], '', st(a)[1]], ['Segunda aprovação', O6.needs2(a) ? 'exigida (' + DB.o6_risco.versao + ')' : 'não exigida'], ['Solicitante', a.solicitante + ' · ' + a.criado]
    ];
  }

  // ---------- FA09 · Execução de ações sensíveis ----------
  REG.screen({
    page: 'operacao', key: 'fa09', id: 'FA09', title: 'Confirmar ação sensível', mtitle: 'Confirmar', nav: 'financeiro', back: 'H14', wide: true,
    testIds: ['rf77', 'rf76'],
    normal: 'Revisão e confirmação',
    scens: [['reauth', 'Reautenticar'], ['fila', 'Na fila'], ['executada', 'Executada']],
    vals: function (ctx) {
      var scn = ctx.scn, md = O6.md(ctx, 'a4733');
      var a0 = O6.act(md.sel) || DB.o6_acoes[0];
      var a = a0;
      if (scn === 'fila') a = Object.assign({}, a0, { status: 'fila', recibo: a0.recibo || 'AU-1041' });
      if (scn === 'executada') a = Object.assign({}, a0, { status: 'concluida', recibo: a0.recibo || 'AU-1042' });
      var motivo = String(O6.uiv(ctx, 'motivo', a.motivo || '')), mfa = String(O6.uiv(ctx, 'mfa', '')), rev = !!O6.uiv(ctx, 'rev', false);
      var confirm = function () {
        if (!motivo.trim() || !mfaOk(mfa) || !rev) { ctx.setUi({ tried: true }); return; }
        ctx.ask({ title: 'Confirmar ' + title(a).toLowerCase() + '?', text: a.valor == null ? 'Muda capacidades da conta. Fica registrado com recibo.' : 'Devolve dinheiro e não pode ser desfeito aqui. Fica registrado com recibo.', lines: impact(a, motivo), ok: a.valor == null ? 'Confirmar ação' : 'Confirmar ' + O6.brl(a.valor), danger: a.valor != null, onOk: function () {
          var r = O6.submit(a0, motivo);
          ctx.setUi({ tried: false, mfa: '' });
          ctx.toast((a0.status === 'aprovacao' ? 'Confirmado · aguarda 2ª aprovação de ' + O6.APPROVER : 'Na fila · recibo provisório ') + ' · ' + r.id + '.');
        } });
      };
      var approve = function () { var r = O6.approve(a0); ctx.toast('2ª aprovação de ' + O6.APPROVER + ' registrada · ' + r.id + '. Ação na fila.'); };
      var rec = DB.o6_recibos.find(function (r) { return r.id === a.recibo; });
      var detail = [];
      if (scn === 'reauth') {
        detail.push({ t: 'emp', role: 'detail', bare: false, ic: 'lock', eTitle: 'Reautenticar', text: 'A confirmação recente venceu. Você volta para a mesma ação, com tudo preenchido.', btns: [{ label: 'Continuar', kind: 'primary', go: function () { GO('FA09.A', { id: a.id }); } }] });
      } else {
        detail.push({ t: 'kv', role: 'detail', title: title(a), sub: 'Revise valor, alvo e efeito', badge: st(a), rows: actionKv(a) });
        if (a.status === 'revisao') {
          detail.push({ t: 'form', role: 'detail', title: 'Confirmação', fields: [
            O6.motivo(ctx, 'motivo', { def: a.motivo || '', label: 'Motivo' }),
            O6.text(ctx, 'mfa', 'Código MFA', { ph: '••• •••', mode: 'numeric', help: 'Demonstração: digite quaisquer 6 números. Nenhum código real é pedido.', err: ctx.ui.tried && !mfaOk(mfa) ? 'O código tem 6 números.' : '' }),
            O6.check(ctx, 'rev', 'Revi valor, alvo e efeito desta ação', false, { err: ctx.ui.tried && !rev ? 'Confirme que revisou antes de continuar.' : '' })
          ], btns: [{ label: a.valor == null ? 'Confirmar ação' : 'Confirmar ' + O6.brl(a.valor), kind: 'primary', size: 'lg', go: confirm }, { label: 'Revisão detalhada', kind: 'ghost', size: 'lg', go: function () { GO('FA09.B', { id: a.id }); } }] });
        } else if (a.status === 'aprovacao') {
          detail.push({ t: 'note', role: 'detail', tone: 'warn', nTitle: 'Aguardando 2ª aprovação', text: 'Você solicitou; a aprovação precisa ser de outra pessoa com alçada (' + O6.APPROVER + '). Nada foi executado ainda. Recibo ' + a.recibo + '.' });
          detail.push({ t: 'kv', role: 'detail', title: 'Segunda aprovação', rows: [['Aprovador', O6.APPROVER + ' · alçada financeira'], ['Pedido em', a.hist[a.hist.length - 1][1]]], btns: [{ label: 'Registrar aprovação de Bia F. (demonstração)', kind: 'outline', go: approve }, { label: 'Aprovar eu mesma', kind: 'ghost', dis: true }], foot: 'Autoaprovação é proibida pela política ' + DB.o6_risco.versao + '.' });
        } else {
          var final = a.status === 'concluida';
          detail.push({ t: 'kv', role: 'detail', title: final ? 'Recibo final' : 'Recibo provisório', badge: final ? ['final', 'ok'] : ['provisório', 'info'], rows: rec ? O6.receiptRows(rec) : [['Recibo', a.recibo], ['Ação', title(a)], ['Por', O6.ME + ' · ' + O6.env().name], ['Quando', O6.stamp()]],
            btns: [{ label: 'Ver execução', kind: 'outline', go: function () { GO('FA09.C', { id: a.id, scn: scn === 'fila' ? 'fila' : (scn === 'executada' ? 'concluido' : '') }); } }] });
        }
      }
      return O6.page(ctx, {
        title: 'Confirmar ação sensível', sub: 'Motivo, impacto, confirmação e recibo',
        ctx: O6.ctx(a.cap, a.alvo),
        alerts: [scn === 'fila' ? { tone: 'info', title: 'Na fila', text: title(a) + ' foi confirmado e aguarda o processador. Recibo provisório ' + a.recibo + '; não confirme de novo.' } : null,
          scn === 'executada' ? { tone: 'ok', title: 'Executada', text: 'Processador confirmou ' + title(a) + '. Recibo final ' + a.recibo + '.' } : null],
        sel: md.mSel, mBack: md.mSel ? md.back : null,
        main: detail,
        rail: [
          { t: 'list', role: 'master', title: 'Ações pendentes e recentes', sub: 'fonte: fila de ações · ' + O6.NOW, rows: DB.o6_acoes.map(function (x) {
            return { title: title(x), sub: (x.valor == null ? x.alvo : O6.brl(x.valor) + ' · ' + x.alvo) + (x.motivo ? ' · ' + x.motivo : ''), ic: x.kind === 'reembolso' ? 'dollar' : 'lock', badge: st(x), on: x.id === a.id, go: md.pick(x.id) };
          }) },
          { t: 'list', role: 'master', title: 'Recibos recentes', rows: O6.receiptList(DB.o6_recibos.slice(0, 4)) },
          { t: 'note', role: 'master', tone: 'info', text: 'Política de risco ' + DB.o6_risco.versao + ' (aprovada ' + DB.o6_risco.desde + ' por ' + DB.o6_risco.por + '): ' + DB.o6_risco.texto + '. Fora disso, uma confirmação basta.' }
        ]
      });
    }
  });

  // ---------- FA09.A · Capacidade e confirmação recente ----------
  REG.screen({
    page: 'operacao', key: 'fa09a', id: 'FA09.A', title: 'Confirmação recente', mtitle: 'Confirmação', nav: 'financeiro', back: 'FA09', form: true,
    testIds: ['a4733'],
    scens: [['revogada', 'Permissão revogada'], ['vencida', 'Sessão vencida'], ['mfa', 'MFA falhou'], ['segunda', 'Segunda aprovação exigida']],
    vals: function (ctx) {
      var scn = ctx.scn, a = O6.act(ctx.id || 'rf77') || O6.act('rf77');
      var code = String(O6.uiv(ctx, 'code', scn === 'mfa' ? '123456' : ''));
      var revog = scn === 'revogada', venc = scn === 'vencida' && !ctx.ui.renewed, failed = scn === 'mfa' && !ctx.ui.retry;
      var go = function () {
        if (!mfaOk(code)) { ctx.setUi({ tried: true }); return; }
        if (scn === 'mfa' && !ctx.ui.retry) { ctx.setUi({ retry: true, code: '' }); return; }
        a.reauthAt = U.now();
        a.hist.push(['Confirmação recente (MFA) por ' + O6.ME, O6.stamp()]);
        GO('FA09.B', { id: a.id });
      };
      return O6.page(ctx, {
        title: 'Confirmação recente', sub: title(a) + ' exige',
        ctx: O6.ctx(a.cap, a.alvo),
        alerts: [
          revog ? { tone: 'risk', title: 'Permissão revogada', text: 'Sua capacidade ' + a.cap + ' foi revogada às 14:20 por Bia F. A ação fica salva para quem tiver alçada.', btns: [{ label: 'Voltar à fila', kind: 'outline', go: function () { GO('FA09', { id: a.id }); } }] } : null,
          venc ? { tone: 'warn', title: 'Sessão vencida', text: 'Entre de novo para continuar. Ao voltar, ' + a.ref + ' estará como você deixou.', btns: [{ label: 'Entrar de novo', kind: 'outline', go: function () { ctx.setUi({ renewed: true }); ctx.toast('Sessão renovada (demonstração).'); } }] } : null,
          scn === 'mfa' ? (failed ? { tone: 'risk', title: 'MFA falhou', text: 'O código não confere. Restam 4 de 5 tentativas; depois disso, a confirmação fica bloqueada por 15 minutos.' } : { tone: 'info', title: 'Tente de novo', text: 'Digite o código novo do app autenticador.' }) : null,
          scn === 'segunda' || O6.needs2(a) ? { tone: 'info', title: 'Segunda aprovação exigida pela política', text: 'Depois desta confirmação, ' + a.ref + ' ainda precisa de ' + O6.APPROVER + ' (' + DB.o6_risco.versao + '). Você não pode aprovar o que solicitou.' } : null
        ],
        main: [
          { t: 'kv', title: 'Quem pode fazer agora', rows: [['Operador', O6.ME + ' · MFA ativo'], ['Alvo', a.alvo + ' · ' + a.acct + ' · ' + O6.env().name.toLowerCase()], ['Capacidade', a.cap, '', revog ? 'risk' : ''], ['Finalidade', title(a)], ['Desafio', 'MFA · app autenticador']] },
          revog || venc ? null : { t: 'form', title: 'Código do app', fields: [O6.text(ctx, 'code', 'Código de 6 números', { ph: '••• •••', mode: 'numeric', help: 'Demonstração: digite quaisquer 6 números.', err: (ctx.ui.tried && !mfaOk(code)) ? 'O código tem 6 números.' : (failed && ctx.ui.code === undefined ? 'Código não confere. Tente o código novo do app.' : '') })],
            foot: 'Volta para a revisão com tudo preenchido.', btns: [{ label: 'Confirmar', kind: 'primary', size: 'lg', go: go }, { label: 'Cancelar', kind: 'ghost', size: 'lg', go: function () { GO('FA09', { id: a.id }); } }] }
        ]
      });
    }
  });

  // ---------- FA09.B · Revisão final e confirmação ----------
  REG.screen({
    page: 'operacao', key: 'fa09b', id: 'FA09.B', title: 'Revisão final', nav: 'financeiro', back: 'FA09', wide: true,
    testIds: ['rf76', 'a4733'],
    scens: [['valor', 'Valor mudou'], ['expirou', 'Aprovação expirou'], ['jasolic', 'Operação já solicitada']],
    vals: function (ctx) {
      var scn = ctx.scn, a0 = O6.act(ctx.id || 'rf77') || O6.act('rf77');
      var a = a0;
      if (scn === 'valor' && a0.valor != null) a = Object.assign({}, a0, { valor: 118.4, efeito: 'recebível − R$ 103,40; acesso por outra compra continua', versao: 'calculado 14:41' });
      if (scn === 'jasolic') a = Object.assign({}, a0, { status: 'executando' });
      var done = a.status !== 'revisao';
      var expired = scn === 'expirou' && !ctx.ui.again;
      var motivo = String(O6.uiv(ctx, 'motivo', a0.motivoDraft || a0.motivo || ''));
      var label = a.valor == null ? 'Confirmar ação' : (a.kind === 'reembolso' ? 'Reembolsar ' + O6.brl(a.valor) : 'Confirmar ' + O6.brl(a.valor));
      var confirm = function () {
        if (!motivo.trim()) { ctx.setUi({ tried: true }); return; }
        if (!a0.reauthAt || expired) { a0.motivoDraft = motivo; GO('FA09.A', { id: a0.id }); return; }
        ctx.ask({ title: label + '?', text: 'Confirme uma vez. ' + (a.valor == null ? 'Muda capacidades da conta.' : 'Esta ação devolve dinheiro e não pode ser desfeita aqui.'), lines: impact(a, motivo), ok: label, danger: a.valor != null, onOk: function () {
          if (scn === 'valor') { a0.valor = a.valor; a0.efeito = a.efeito; a0.versao = a.versao; }
          O6.submit(a0, motivo);
          GO('FA09.C', { id: a0.id });
        } });
      };
      return O6.page(ctx, {
        title: 'Revisão final', sub: a.tipo,
        acts: [{ label: 'Voltar', kind: 'ghost', go: function () { GO('FA09', { id: a.id }); } }, { label: label, kind: 'primary', dis: done, go: confirm }],
        ctx: O6.ctx(a.cap, a.alvo),
        alerts: [
          scn === 'valor' ? { tone: 'warn', title: 'Valor mudou', text: 'Recalculado às 14:41: R$ 120,00 → R$ 118,40 (taxa de processamento não é devolvida). Confira o valor novo antes de confirmar.' } : null,
          expired ? { tone: 'warn', title: 'Aprovação expirou', text: 'A confirmação recente vale 10 minutos e venceu às 14:48. Confirme o MFA de novo; o motivo fica salvo.', btns: [{ label: 'Confirmar de novo', kind: 'outline', go: function () { a0.motivoDraft = motivo; GO('FA09.A', { id: a0.id }); } }] } : null,
          done ? { tone: 'info', title: 'Operação já solicitada', text: a.ref + ' já está “' + st(a)[0] + '”. Confirmar de novo poderia devolver em dobro; acompanhe a execução.', btns: [{ label: 'Ver execução', kind: 'outline', go: function () { GO('FA09.C', { id: a.id }); } }] } : null,
          !done && !a0.reauthAt ? { tone: 'info', title: 'Confirmação recente necessária', text: 'Ao confirmar, você passa pelo MFA e volta para esta revisão com tudo preenchido.' } : null
        ],
        main: [
          { t: 'kv', title: 'Resumo', sub: 'Tudo o que muda, antes do botão', rows: [
            ['Tipo', a.tipo.toLowerCase()], ['Valor', O6.valor(a), a.valor == null ? '' : a.versao + ' · fonte: pedido ' + a.alvo.replace('Pedido ', '')], [a.valor == null ? 'Escopo' : 'Itens', a.itens], a.valor == null ? null : ['Destinatário', a.dest], ['Efeito', a.efeito], ['Versão', a.versao], ['Ambiente', O6.env().name]
          ] },
          { t: 'note', tone: 'warn', nTitle: 'Consequência', text: a.valor == null ? 'Esta ação muda o que a conta pode fazer até a retomada.' : 'Esta ação devolve dinheiro e não pode ser desfeita aqui.' },
          done ? null : { t: 'form', title: 'Motivo', fields: [O6.motivo(ctx, 'motivo', { def: a0.motivoDraft || a0.motivo || '', label: 'Motivo', ph: 'Ex.: lesão comprovada · caso #C-412' })], btns: [{ label: label, kind: 'primary', size: 'lg', go: confirm }, { label: 'Voltar', kind: 'ghost', size: 'lg', go: function () { GO('FA09', { id: a.id }); } }] }
        ]
      });
    }
  });

  // ---------- FA09.C · Execução durável e recibo ----------
  var SCN_ST = { fila: 'fila', parcial: 'parcial', desconhecido: 'desconhecido', falhou: 'falhou', concluido: 'concluida' };
  REG.screen({
    page: 'operacao', key: 'fa09c', id: 'FA09.C', title: 'Execução', nav: 'financeiro', back: 'FA09', wide: true,
    testIds: ['rf77', 'a4733'],
    normal: 'Executando',
    scens: [['fila', 'Em fila'], ['parcial', 'Parcial'], ['desconhecido', 'Desconhecido'], ['falhou', 'Falhou confirmado'], ['concluido', 'Concluído']],
    vals: function (ctx) {
      var scn = ctx.scn;
      var a0 = O6.act(ctx.id) || DB.o6_acoes.find(function (x) { return x.status !== 'revisao' && x.status !== 'aprovacao'; }) || DB.o6_acoes[0];
      var status = ctx.ui.st || SCN_ST[scn] || a0.status;
      var a = Object.assign({}, a0, { status: status });
      var demo = !!scn;
      var setSt = function (next, msg) { return function () {
        if (demo) { ctx.setUi({ st: next }); ctx.toast(msg); return; }
        if (next === 'concluida' && (a0.status === 'desconhecido')) a0.status = 'executando';
        O6.advance(a0); if (a0.status !== next && next === 'concluida') O6.advance(a0);
        ctx.toast(msg);
      }; };
      var steps = function () {
        var order = ['fila', 'executando', 'concluida'], i = order.indexOf(status);
        var n2 = O6.needs2(a0);
        var items = [{ t: 'Confirmado por ' + a0.solicitante, sub: a0.criado + ' BRT', st: 'done' }];
        if (n2) items.push({ t: '2ª aprovação', sub: a0.aprovador ? a0.aprovador : 'aguardando ' + O6.APPROVER, st: a0.aprovador || i >= 0 || demo ? 'done' : 'now' });
        if (status === 'revisao' || status === 'aprovacao') { items.push({ t: 'Aceito pelo processador', sub: 'ainda não enviado', st: 'todo' }); return items; }
        items.push({ t: 'Aceito · processador', sub: '14:40 · confirmado', st: 'done' });
        if (status === 'desconhecido') items.push({ t: 'Executando · processador', sub: 'sem resposta desde 14:41 · consultar', st: 'warn' });
        else if (status === 'falhou') items.push({ t: 'Executando · processador', sub: 'falhou · confirmado pelo processador', st: 'fail' });
        else if (status === 'parcial') items.push({ t: 'Executando · processador', sub: 'parcial · devolução ao cartão pendente', st: 'warn' });
        else items.push({ t: 'Executando · processador', sub: status === 'fila' ? 'na fila' : (status === 'concluida' ? 'concluído' : 'em andamento'), st: status === 'concluida' ? 'done' : (status === 'fila' ? 'todo' : 'now') });
        items.push({ t: 'Efeito no ' + (a0.valor == null ? 'escopo da conta' : 'recebível'), sub: status === 'concluida' ? a0.efeito : (status === 'parcial' ? 'recebível ajustado · cartão pendente' : '— · na fila'), st: status === 'concluida' ? 'done' : (status === 'parcial' ? 'warn' : 'todo') });
        return items;
      };
      var rec = DB.o6_recibos.find(function (r) { return r.id === a0.recibo; });
      var btns = [];
      if (status === 'fila') btns.push({ label: 'Atualizar status', kind: 'primary', ic: 'refresh', go: setSt('executando', 'Processador aceitou ' + a0.ref + ' às ' + U.now() + '.') });
      if (status === 'executando' || status === 'parcial' || status === 'desconhecido') btns.push({ label: 'Consultar processador', kind: 'primary', ic: 'refresh', go: setSt('concluida', status === 'desconhecido' ? 'Processador confirma: ' + a0.ref + ' foi executado às 14:40. Nada a repetir.' : 'Processador confirma ' + a0.ref + ' concluído às ' + U.now() + '.') });
      if (status === 'falhou') btns.push({ label: 'Preparar nova tentativa', kind: 'outline', go: function () {
        ctx.ask({ title: 'Preparar nova tentativa de ' + a0.ref + '?', text: 'O processador confirmou a falha: nenhum dinheiro saiu. A nova tentativa volta para revisão, com motivo e confirmação.', lines: ['Falha confirmada às 14:43 · cartão de origem encerrado', 'Nova tentativa usa a mesma referência'], ok: 'Voltar para revisão', onOk: function () {
          if (!demo) { a0.status = 'revisao'; a0.reauthAt = ''; a0.hist.push(['Falha confirmada · nova tentativa preparada', O6.stamp()]); }
          GO('FA09.B', { id: a0.id });
        } });
      } });
      btns.push({ label: 'Abrir caso', kind: 'ghost', go: function () { GO('H12'); } });
      var alerts = [];
      if (status === 'desconhecido') alerts.push({ tone: 'warn', title: 'Resultado desconhecido', text: 'O processador não respondeu (timeout às 14:41). Não repita: consulte primeiro. Repetir agora poderia devolver em dobro.' });
      if (status === 'falhou') alerts.push({ tone: 'risk', title: 'Falhou · confirmado', text: 'Processador confirmou a falha às 14:43 (cartão de origem encerrado). Nenhum dinheiro saiu; repetir só depois de nova revisão.' });
      if (status === 'parcial') alerts.push({ tone: 'warn', title: 'Parcial', text: 'Recebível ajustado; devolução ao cartão ainda aguarda o processador. Consulte antes de qualquer outra ação.' });
      if (status === 'concluida') alerts.push({ tone: 'ok', title: 'Concluído', text: 'Confirmado pelo processador. Recibo final ' + (a0.recibo || '—') + '.' });
      if (status === 'revisao' || status === 'aprovacao') alerts.push({ tone: 'info', title: 'Ainda não executado', text: a0.ref + ' está “' + st(a)[0] + '”. Nada foi enviado ao processador.', btns: [{ label: 'Abrir revisão', kind: 'outline', go: function () { GO(status === 'revisao' ? 'FA09.B' : 'FA09', { id: a0.id }); } }] });
      return O6.page(ctx, {
        title: 'Execução ' + a0.ref, sub: 'Referência durável',
        acts: btns.slice(0, 1),
        ctx: O6.ctx('financeiro.ler', a0.alvo),
        alerts: alerts,
        main: [
          { t: 'steps', title: 'Etapas', sub: 'Status autoritativo: processador', badge: st(a), items: steps() },
          { t: 'kv', title: 'Referência', rows: [['Referência', a0.ref], ['Executor', a0.solicitante], ['Instante', a0.criado + ' BRT'], ['Status autoritativo', 'processador · ' + st(a)[0], 'consultado ' + U.now() + ' BRT'], ['Valor', O6.valor(a0)], ['Efeito', a0.efeito], ['Pendência', status === 'concluida' ? 'nenhuma' : (status === 'falhou' ? 'nova revisão, se fizer sentido' : 'aguardar processador')]], btns: btns }
        ],
        rail: [
          rec ? { t: 'kv', title: status === 'concluida' ? 'Recibo final' : 'Recibo provisório', badge: status === 'concluida' ? ['final', 'ok'] : ['provisório', 'info'], rows: O6.receiptRows(rec) } : null,
          { t: 'steps', title: 'Trilha', items: a0.hist.map(function (h, i) { return { t: h[0], sub: h[1], st: 'done' }; }) },
          { t: 'note', tone: 'info', text: 'A referência ' + a0.ref + ' é a mesma em qualquer nova consulta. Sair desta tela não apaga o andamento.' }
        ]
      });
    }
  });
})();
