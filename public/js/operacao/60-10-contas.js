/* O6 · FA06 Contas e restrições (+ FA06.A recebedores, FA06.B requisitos, FA06.C restrição por escopo).
   Capacidades separadas da conta (vender, receber, enviar ao banco). Restringir ou retomar passa por FA09 (motivo, impacto, recibo). */
(function () {
  var O6 = window.O6;
  function caps(c) {
    var r = c.restr ? c.restr.escopo : [];
    return {
      vende: c.vender && r.indexOf('Novas vendas') < 0,
      recebe: c.receber && r.indexOf('Recebimento') < 0,
      envia: c.enviar && r.indexOf('Envio ao banco') < 0
    };
  }
  function estado(c) {
    if (!c.iniciou) return ['não iniciou', 'plain'];
    if (c.restr) return ['restrita', 'risk'];
    if (c.reqs.length || !c.enviar || !c.receber || !c.vender) return ['parcialmente habilitada', 'warn'];
    return ['habilitada', 'ok'];
  }
  function sim(b, pend) { return b ? 'sim' : (pend || 'não'); }
  function mobileSub(c) {
    if (!c.iniciou) return 'não iniciou o cadastro no provedor';
    var k = caps(c), out = [];
    out.push(k.vende ? 'vende' : (c.restr ? 'vendas restritas' : 'não vende'));
    out.push(k.recebe ? 'recebe' : 'não recebe');
    out.push(k.envia ? 'envia' : (c.restr && c.restr.escopo.indexOf('Envio ao banco') >= 0 ? 'envio restrito' : 'envio ao banco pendente'));
    return out.join(' · ');
  }
  function repasse(c) {
    if (!c.iniciou) return '—';
    if (c.restr && c.restr.escopo.indexOf('Envio ao banco') >= 0) return { t: 'restrito', tone: 'risk' };
    return c.enviar ? 'sim' : { t: 'pendente', tone: 'warn' };
  }
  function refresh(ctx, c, msg) {
    c.consulta = U.now();
    ctx.toast(msg || ('Consulta ao provedor feita às ' + c.consulta + ' BRT · nada mudou.'));
  }
  function accountKv(c) {
    var k = caps(c), st = estado(c), src = 'provedor · 26/10 ' + c.consulta + ' BRT';
    return [
      ['Conta', c.acct + ' · ' + c.pais],
      ['Situação', st[0], '', st[1]],
      ['Pode vender', sim(k.vende), src],
      ['Pode receber', sim(k.recebe), src],
      ['Envia ao banco', sim(k.envia, c.iniciou ? 'pendente' : 'não'), src],
      ['Requisito', c.reqs.length ? c.reqs[0].what + ' · prazo ' + c.reqs[0].prazo : '—'],
      ['Restrição administrativa', c.restr ? c.restr.escopo.join(' e ') + ' · ' + c.restr.dur + ' · ' + c.restr.ref : 'nenhuma'],
      ['Alunos com planos ativos', String(c.alunos), 'contratos · 26/10']
    ];
  }

  // ---------- FA06 · Contas e restrições ----------
  REG.screen({
    page: 'operacao', key: 'fa06', id: 'FA06', title: 'Contas e restrições', mtitle: 'Contas', nav: 'financeiro', back: 'H14', wide: true,
    testIds: ['renata', 'paulo'],
    normal: 'Lista por capacidade',
    scens: [['bloqueio', 'Bloqueio'], ['liberado', 'Liberado'], ['provedor', 'Requisito do provedor']],
    vals: function (ctx) {
      var scn = ctx.scn, md = O6.md(ctx, 'thiago');
      var f = O6.uiv(ctx, 'f', 'todas'), q = U.norm(O6.uiv(ctx, 'q', ''));
      var list = DB.o6_contas.filter(function (c) {
        var k = caps(c);
        if (q && U.norm(c.name + ' ' + c.full + ' ' + c.acct).indexOf(q) < 0) return false;
        if (f === 'naovende') return !k.vende;
        if (f === 'repasse') return c.iniciou && !k.envia;
        if (f === 'req') return c.reqs.length > 0;
        if (f === 'restritas') return !!c.restr;
        return true;
      });
      var c = DB.find('o6_contas', md.sel) || DB.o6_contas[0];
      var renata = DB.find('o6_contas', 'renata');
      var rows = list.map(function (a) {
        var k = caps(a), st = estado(a);
        return { title: a.name, sub: mobileSub(a), ic: 'user', badge: st[1] === 'ok' ? null : st, on: a.id === c.id, go: md.pick(a.id), goLabel: 'Abrir',
          cells: [{ t: a.name, b: true }, a.iniciou ? (k.vende ? 'sim' : { t: a.restr ? 'bloqueado' : 'não', tone: 'risk' }) : '—', repasse(a), a.reqs.length ? a.reqs[0].what : (a.iniciou ? '—' : 'cadastro não iniciado')] };
      });
      var alerts = [];
      if (scn === 'provedor') alerts.push({ tone: 'warn', title: 'Requisito do provedor · ' + renata.name, text: renata.reqs[0].what + '. Prazo informado pelo provedor: ' + renata.reqs[0].prazo + '. Enquanto isso, o envio ao banco fica pendente; vendas e recebimentos continuam.', btns: [{ label: 'Consultar de novo', kind: 'outline', ic: 'refresh', go: function () { refresh(ctx, renata, 'Provedor consultado às ' + U.now() + ' BRT · requisito continua aberto, prazo 05/11.'); } }, { label: 'Ver requisito', kind: 'ghost', go: function () { GO('FA06.B', { id: 'renata' }); } }] });
      if (scn === 'liberado') alerts.push({ tone: 'ok', title: 'Liberado · Paulo T.', text: 'Restrição de novas vendas e envio ao banco retirada às 14:31 BRT por Bia F. (caso #C-330 encerrado). Recibo AU-1038 na auditoria.' });
      var detail;
      if (scn === 'bloqueio') {
        detail = { t: 'emp', role: 'detail', bare: false, ic: 'lock', eTitle: 'Bloqueio', text: 'Bloquear venda ou repasse pede motivo e escopo, mostra o impacto e passa pela confirmação de ação sensível. Nada é bloqueado editando selo.', btns: [{ label: 'Continuar', kind: 'primary', go: function () { GO('FA06.C', { id: c.iniciou ? c.id : 'paulo' }); } }] };
      } else {
        var st = estado(c);
        detail = { t: 'kv', role: 'detail', title: c.name + ' · ' + c.full, sub: 'Conta e capacidades separadas', badge: st, rows: accountKv(c),
          foot: c.caso ? 'Caso aberto: ' + c.caso : '',
          btns: [
            c.reqs.length ? { label: 'Ver requisitos', kind: 'primary', go: function () { GO('FA06.B', { id: c.id }); } } : null,
            c.iniciou && !c.restr ? { label: 'Restringir por escopo', kind: 'outline', ic: 'lock', go: function () { GO('FA06.C', { id: c.id }); } } : null,
            c.restr ? { label: 'Revisar retomada', kind: 'outline', go: function () { GO('FA06.C', { id: c.id, modo: 'retomada' }); } } : null,
            { label: 'Consultar provedor', kind: 'ghost', ic: 'refresh', go: function () { refresh(ctx, c); } }
          ] };
      }
      var audit = DB.o6_recibos.slice(0, 3).map(function (r) { return { title: r.id + ' · ' + r.acao, sub: r.quando + ' · ' + r.por, ic: 'file' }; });
      if (scn === 'liberado') audit.unshift({ title: 'AU-1038 · Restrição retirada · Paulo T.', sub: '26/10 · 14:31 BRT · Bia F. · motivo: caso #C-330 encerrado', ic: 'check', badge: ['novo', 'ok'] });
      return O6.page(ctx, {
        title: 'Contas e restrições', sub: 'Quem pode vender, receber e enviar ao banco, por capacidade',
        acts: [{ label: 'Lista de recebedores', kind: 'outline', go: function () { GO('FA06.A'); } }],
        ctx: O6.ctx('financeiro.contas', 'BR · ' + O6.env().name.toLowerCase()),
        alerts: alerts, sel: md.mSel, mBack: md.mSel ? md.back : null,
        main: [
          { t: 'form', role: 'master', bare: true, fields: [
            O6.text(ctx, 'q', 'Buscar treinador ou conta', { ph: 'Nome ou ac_…' }),
            O6.chips(ctx, 'f', 'Filtrar por capacidade ou motivo', [['todas', 'Todas'], ['naovende', 'Não vende'], ['repasse', 'Repasse pendente'], ['req', 'Com requisito'], ['restritas', 'Restritas']], 'todas')
          ] },
          { t: 'table', role: 'master', title: 'Contas', sub: U.plural(list.length, 'conta', 'contas') + ' · fonte: provedor · 26/10 14:00 BRT', cols: ['Treinador', 'Vender', 'Repasse', 'Requisito'], rows: rows, emptyText: 'Nenhuma conta com este filtro. Limpe a busca ou escolha “Todas”.' }
        ],
        rail: [
          detail,
          { t: 'list', role: 'master', title: 'Auditoria', sub: 'Últimos recibos', rows: audit },
          { t: 'list', role: 'master', title: 'Subtelas', rows: [O6.link('Lista de recebedores', 'Capacidades por conta e última consulta', 'bank', 'FA06.A'), O6.link('Requisitos e resolução', 'Pendências do provedor · Renata S.', 'clipboard', 'FA06.B', { id: 'renata' }), O6.link('Restrição por escopo', 'Motivo, escopo e duração · via FA09', 'lock', 'FA06.C', { id: 'paulo' })] }
        ]
      });
    }
  });

  // ---------- FA06.A · Lista de recebedores ----------
  REG.screen({
    page: 'operacao', key: 'fa06a', id: 'FA06.A', title: 'Recebedores', nav: 'financeiro', back: 'FA06', wide: true,
    scens: [['indisponivel', 'Consulta indisponível']],
    vals: function (ctx) {
      var off = ctx.scn === 'indisponivel';
      var f = O6.uiv(ctx, 'f', 'todas'), q = U.norm(O6.uiv(ctx, 'q', ''));
      var list = DB.o6_contas.filter(function (c) {
        var k = caps(c);
        if (q && U.norm(c.name + ' ' + c.full + ' ' + c.acct).indexOf(q) < 0) return false;
        if (f === 'vende') return k.vende;
        if (f === 'naorecebe') return !k.recebe;
        if (f === 'envio') return c.iniciou && !k.envia;
        if (f === 'req') return c.reqs.length > 0;
        if (f === 'restrita') return !!c.restr;
        if (f === 'naoiniciou') return !c.iniciou;
        return true;
      });
      var rows = list.map(function (c) {
        var k = caps(c), st = estado(c);
        var cons = off ? { t: 'indisponível', tone: 'warn' } : (c.consulta === '—' ? '—' : c.consulta);
        var no = function (b) { return b ? 'sim' : { t: 'não', tone: c.iniciou ? 'warn' : '' }; };
        return { title: c.name, sub: mobileSub(c) + (off ? ' · consulta indisponível' : ''), ic: 'bank', badge: st[1] === 'ok' ? null : st,
          go: function () { GO(c.reqs.length ? 'FA06.B' : 'FA06', { id: c.id }); }, goLabel: c.reqs.length ? 'Requisitos' : 'Abrir conta',
          cells: [{ t: c.name, b: true }, c.pais, no(k.vende), no(k.recebe), no(k.envia), c.iniciou ? (c.reqs.length ? U.plural(c.reqs.length, 'pendente', 'pendentes') : (c.restr ? 'restrita' : '—')) : 'não iniciou', cons] };
      });
      return O6.page(ctx, {
        title: 'Recebedores', sub: 'Contas dos treinadores',
        ctx: O6.ctx('financeiro.contas', 'BR · ' + O6.env().name.toLowerCase(), off ? 'última consulta 26/10 · 14:00 BRT' : O6.NOW),
        alerts: [off ? { tone: 'warn', title: 'Consulta indisponível', text: 'O provedor não respondeu às 14:02. Os valores abaixo são da última consulta (14:00) e podem estar desatualizados; nenhuma capacidade foi presumida.', btns: [{ label: 'Consultar de novo', kind: 'outline', ic: 'refresh', go: function () { ctx.toast('Provedor ainda indisponível às ' + U.now() + ' BRT. Tente em alguns minutos.'); } }] } : null],
        main: [
          { t: 'form', bare: true, fields: [
            O6.text(ctx, 'q', 'Buscar treinador ou conta', { ph: 'Nome ou ac_…' }),
            O6.chips(ctx, 'f', 'Capacidade ou motivo', [['todas', 'Todas'], ['vende', 'Pode vender'], ['naorecebe', 'Não recebe'], ['envio', 'Envio pendente'], ['req', 'Requisito pendente'], ['restrita', 'Restrita'], ['naoiniciou', 'Não iniciou']], 'todas')
          ] },
          { t: 'table', title: 'Contas por capacidade', sub: U.plural(rows.length, 'conta', 'contas') + ' · fonte: provedor', cols: ['Treinador', 'País', 'Vender', 'Receber', 'Enviar ao banco', 'Requisitos', 'Consulta'], rows: rows, emptyText: 'Nenhuma conta com este filtro.' },
          { t: 'note', tone: 'info', text: 'Perfil publicado não significa “pode vender”: cada capacidade vem do provedor e é mostrada separadamente.' }
        ]
      });
    }
  });

  // ---------- FA06.B · Requisitos e resolução ----------
  REG.screen({
    page: 'operacao', key: 'fa06b', id: 'FA06.B', title: 'Requisitos', nav: 'financeiro', back: 'FA06', wide: true,
    testIds: ['thiago'],
    scens: [['sessao', 'Sessão do provedor expirada'], ['novo', 'Requisito novo'], ['retorno', 'Retorno perdido'], ['fora', 'Provedor fora']],
    vals: function (ctx) {
      var scn = ctx.scn;
      var c = DB.find('o6_contas', ctx.id || 'renata') || DB.find('o6_contas', 'renata');
      var reqs = c.reqs.slice();
      if (scn === 'novo') reqs.push({ id: 'q2', what: 'documento de identidade com foto', prazo: '08/11', resp: c.name + ' · no fluxo do provedor', desde: '26/10', novo: true });
      var sent = !!ctx.ui.sent;
      var alerts = [];
      if (scn === 'sessao') alerts.push({ tone: 'warn', title: 'Sessão do provedor expirada', text: c.name + ' abriu o fluxo do provedor e a sessão expirou. Ela recomeça pelo painel dela; o que já foi enviado continua lá.', btns: [{ label: 'Reenviar orientação', kind: 'outline', go: function () { ctx.setUi({ sent: true }); ctx.toast('Orientação reenviada pelo painel de ' + c.name + '.'); } }] });
      if (scn === 'novo') alerts.push({ tone: 'info', title: 'Requisito novo', text: 'O provedor pediu “documento de identidade com foto” às 13:58. Prazo informado: 08/11.' });
      if (scn === 'retorno') alerts.push({ tone: 'warn', title: 'Retorno perdido', text: 'O aviso de conclusão do provedor não chegou. Consulte o provedor antes de pedir qualquer coisa de novo a ' + c.name + '.', btns: [{ label: 'Consultar de novo', kind: 'outline', ic: 'refresh', go: function () { refresh(ctx, c, 'Consulta às ' + U.now() + ' BRT: requisito ainda aberto no provedor.'); } }] });
      if (scn === 'fora') alerts.push({ tone: 'risk', title: 'Provedor fora', text: 'O provedor não responde desde 13:10. Valores da última consulta (14:00). Não peça documentos por outro canal; tente de novo em alguns minutos.', btns: [{ label: 'Consultar de novo', kind: 'outline', ic: 'refresh', go: function () { ctx.toast('Provedor ainda fora às ' + U.now() + ' BRT.'); } }] });
      var main = reqs.length ? reqs.map(function (r) {
        return { t: 'kv', title: 'Pendência', sub: r.novo ? 'Nova · aberta 26/10' : 'Aberta em ' + r.desde, badge: r.novo ? ['novo', 'info'] : ['pendente', 'warn'], rows: [
          ['Pendência', r.what, 'provedor · 26/10 ' + c.consulta + ' BRT'],
          ['Prazo', 'informado pelo provedor: ' + r.prazo],
          ['Responsável', r.resp],
          ['Efeito enquanto pendente', 'envio ao banco pendente; vendas e recebimentos continuam']
        ] };
      }) : [{ t: 'emp', bare: false, ic: 'check', eTitle: 'Sem pendências do provedor', text: c.name + ' não tem requisitos abertos na última consulta (26/10 · ' + c.consulta + ' BRT).' }];
      main.push({ t: 'note', tone: 'info', nTitle: 'Caminho oficial', text: 'O operador não coleta dados bancários. ' + c.name + ' resolve no fluxo do provedor dentro do painel dela; aqui você só orienta e acompanha.' });
      return O6.page(ctx, {
        title: 'Requisitos · ' + c.name, sub: 'Pendências do provedor',
        acts: [{ label: 'Consultar provedor', kind: 'outline', ic: 'refresh', go: function () { refresh(ctx, c); } }, reqs.length ? { label: sent ? 'Orientação enviada' : 'Enviar orientação', kind: 'primary', dis: sent || scn === 'fora', go: function () {
          ctx.ask({ title: 'Enviar orientação a ' + c.name + '?', text: 'Ela recebe no painel um aviso com o link do fluxo do provedor. Nenhum dado bancário passa pela operação.', lines: ['Pendência: ' + reqs[0].what, 'Prazo: ' + reqs[0].prazo], ok: 'Enviar orientação', onOk: function () {
            var r = O6.receipt({ acao: 'Orientação de requisito enviada', alvo: c.name + ' · ' + c.acct, motivo: 'requisito do provedor: ' + reqs[0].what, efeito: 'aviso no painel do treinador' });
            ctx.setUi({ sent: true }); ctx.toast('Orientação enviada · recibo ' + r.id + '.');
          } });
        } } : null],
        ctx: O6.ctx('financeiro.contas', 'Conta ' + c.acct, scn === 'fora' ? 'última consulta 26/10 · 14:00 BRT' : O6.NOW),
        alerts: alerts,
        main: main,
        rail: [
          { t: 'steps', title: 'Acompanhar retorno', items: [
            { t: 'Requisito aberto pelo provedor', sub: '20/10 · fonte: provedor', st: 'done' },
            { t: 'Orientação enviada ao treinador', sub: sent ? 'agora · ' + O6.ME : 'ainda não enviada', st: sent ? 'done' : 'todo' },
            { t: c.name + ' envia no fluxo do provedor', sub: scn === 'sessao' ? 'sessão expirou · recomeçar pelo painel' : 'aguardando', st: scn === 'sessao' ? 'warn' : 'now' },
            { t: 'Provedor confirma', sub: scn === 'retorno' ? 'retorno não chegou · consultar' : 'prazo ' + (reqs[0] ? reqs[0].prazo : '—'), st: scn === 'retorno' ? 'warn' : 'todo' }
          ] },
          { t: 'kv', title: 'Conta', rows: accountKv(c).slice(0, 5), btns: [{ label: 'Abrir conta', kind: 'ghost', go: function () { GO('FA06', { id: c.id }); } }] }
        ]
      });
    }
  });

  // ---------- FA06.C · Restrição administrativa por escopo ----------
  REG.screen({
    page: 'operacao', key: 'fa06c', id: 'FA06.C', title: 'Restrição administrativa', mtitle: 'Restrição', nav: 'financeiro', back: 'FA06', form: false, wide: true,
    testIds: ['thiago'],
    scens: [['externa', 'Restrição externa permanece'], ['alcada', 'Alçada insuficiente'], ['mudou', 'Estado mudou'], ['parcial', 'Operação parcial']],
    vals: function (ctx) {
      var scn = ctx.scn;
      var c = DB.find('o6_contas', ctx.id || 'paulo') || DB.find('o6_contas', 'paulo');
      var retomada = ctx.p.modo === 'retomada' || !!c.restr;
      var escopo = O6.uiv(ctx, 'escopo', retomada && c.restr ? c.restr.escopo.slice() : ['Novas vendas', 'Envio ao banco']);
      var dur = O6.uiv(ctx, 'dur', '30');
      var motivoDef = retomada ? '' : (c.caso ? 'Disputas acima da política · ' + c.caso.split(' · ')[0] : '');
      var motivo = String(O6.uiv(ctx, 'motivo', motivoDef));
      var blocked = scn === 'alcada';
      var pend = DB.o6_acoes.find(function (a) { return a.conta === c.id && (a.kind === 'restricao' || a.kind === 'retomada') && a.status !== 'concluida'; });
      var alerts = [];
      if (scn === 'externa') alerts.push({ tone: 'warn', title: 'Restrição externa permanece', text: 'O provedor bloqueou o envio ao banco desta conta até 05/11. Esta restrição administrativa não sobrepõe nem libera esse bloqueio.' });
      if (blocked) alerts.push({ tone: 'risk', title: 'Alçada insuficiente', text: 'Restringir conta com alunos ativos exige alçada “financeiro.restringir · nível 2”. Peça a Bia F.; o rascunho fica salvo.', btns: [{ label: 'Pedir alçada', kind: 'outline', go: function () { ctx.toast('Pedido de alçada enviado a Bia F. · rascunho mantido.'); } }] });
      if (scn === 'mudou') alerts.push({ tone: 'warn', title: 'Estado mudou', text: 'Às 14:31 a conta ' + c.acct + ' recebeu um requisito novo do provedor. Revise o escopo antes de continuar.', btns: [{ label: 'Consultar de novo', kind: 'outline', ic: 'refresh', go: function () { refresh(ctx, c, 'Consulta às ' + U.now() + ' BRT: requisito novo confirmado; escopo mantido.'); } }] });
      if (scn === 'parcial') alerts.push({ tone: 'warn', title: 'Operação parcial', text: 'Novas vendas já estão restritas; o bloqueio de envio ao banco aguarda confirmação do provedor. Nada foi repetido.', btns: [{ label: 'Ver execução', kind: 'outline', go: function () { GO('FA09.C', { id: pend ? pend.id : '' }); } }] });
      if (pend) alerts.push({ tone: 'info', title: 'Já existe uma solicitação para esta conta', text: pend.ref + ' · ' + (O6.STATUS[pend.status] || ['', ''])[0] + '. Acompanhe antes de criar outra.', btns: [{ label: 'Abrir ' + pend.ref, kind: 'outline', go: function () { GO('FA09', { id: pend.id }); } }] });
      var k = caps(c);
      var effect = retomada ? escopo.map(function (e) { return e + ' volta a funcionar'; }) : escopo.map(function (e) { return e + ' bloqueado por ' + dur + ' dias'; });
      var keeps = [c.alunos + ' alunos com planos ativos continuam treinando e sendo atendidos', 'Acesso a programas já comprados continua', 'Saldo já recebido fica preservado; nada é estornado'];
      if (escopo.indexOf('Recebimento') < 0 && !retomada) keeps.push('Recebimentos de vendas já feitas continuam');
      var go = function () {
        if (!motivo.trim() || !escopo.length) { ctx.setUi({ tried: true }); return; }
        ctx.ask({ title: retomada ? 'Preparar retomada para confirmação?' : 'Preparar restrição para confirmação?', text: 'A ação vai para “Execução de ações sensíveis” (FA09): lá você revê, confirma com MFA e a política de risco pede segunda aprovação.', lines: ['Conta: ' + c.name + ' · ' + c.acct, 'Escopo: ' + escopo.join(', ')].concat(retomada ? [] : ['Duração: ' + dur + ' dias']).concat(['Motivo: ' + motivo]), ok: 'Continuar para FA09', onOk: function () {
          var n = 300 + DB.o6_acoes.length;
          var a = { id: 'rs' + n, ref: 'RS-' + n, kind: retomada ? 'retomada' : 'restricao', tipo: retomada ? 'Retomada de capacidades' : 'Restrição administrativa', valor: null, alvo: c.name, conta: c.id, acct: c.acct, itens: escopo.join(' e '), escopo: escopo.slice(), dur: dur + ' dias', dest: '—', efeito: effect.join('; '), motivo: motivo, cap: 'financeiro.restringir', status: 'revisao', exige2: !retomada, criado: O6.stamp(), versao: 'calculado ' + U.now(), solicitante: O6.ME, aprovador: '', recibo: '', hist: [['Preparado em FA06.C por ' + O6.ME, O6.stamp()]] };
          DB.o6_acoes.unshift(a);
          GO('FA09', { id: a.id });
        } });
      };
      var escOpts = retomada && c.restr ? c.restr.escopo.map(function (e) { return [e, e]; }) : [['Novas vendas', 'Novas vendas'], ['Envio ao banco', 'Envio ao banco'], ['Recebimento', 'Recebimento']];
      return O6.page(ctx, {
        title: retomada ? 'Retomada de capacidades' : 'Restrição administrativa', sub: c.name + ' · escopo',
        acts: [{ label: 'Confirmar via FA09', kind: 'primary', dis: blocked || !!pend, go: go }],
        ctx: O6.ctx('financeiro.restringir', 'Conta ' + c.acct),
        alerts: alerts,
        main: [
          { t: 'form', title: retomada ? 'O que volta a funcionar' : 'Motivo e escopo', fields: [
            O6.motivo(ctx, 'motivo', { def: motivoDef, label: 'Motivo', ph: retomada ? 'Ex.: caso #C-330 encerrado sem procedência' : 'Ex.: disputas acima da política · #C-330' }),
            O6.chips(ctx, 'escopo', retomada ? 'Capacidades a retomar' : 'Capacidades restringidas', escOpts, escopo, { multi: true, err: ctx.ui.tried && !escopo.length ? 'Escolha pelo menos uma capacidade.' : '', help: 'Só o que está marcado muda. O resto continua como está.' }),
            retomada ? null : O6.chips(ctx, 'dur', 'Duração definida', [['7', '7 dias'], ['15', '15 dias'], ['30', '30 dias']], '30', { help: 'Termina sozinha em ' + (dur === '7' ? '02/11' : dur === '15' ? '10/11' : '25/11') + '; pode ser retomada antes.' })
          ], btns: [{ label: 'Confirmar via FA09', kind: 'primary', size: 'lg', dis: blocked || !!pend, go: go }, { label: 'Cancelar', kind: 'ghost', size: 'lg', go: function () { GO('FA06', { id: c.id }); } }] }
        ],
        rail: [
          { t: 'kv', title: 'Impacto', rows: effect.map(function (e) { return ['Efeito', e]; }).concat([['Obrigações em aberto', c.alunos + ' alunos com planos ativos · mantidos'], ['Hoje', 'vende ' + sim(k.vende) + ' · recebe ' + sim(k.recebe) + ' · envia ' + sim(k.envia), 'provedor · 26/10 ' + c.consulta + ' BRT']]) },
          { t: 'list', title: 'Continua disponível', rows: keeps.map(function (t) { return { title: t, ic: 'check' }; }) },
          { t: 'note', tone: 'info', text: 'Não sobrepõe bloqueio do processador e não simula habilitação editando selo. Política: ' + DB.o6_risco.texto.toLowerCase() + ' (' + DB.o6_risco.versao + ').' }
        ]
      });
    }
  });
})();
