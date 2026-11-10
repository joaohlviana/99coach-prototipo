/* O1 · H12 (mesa por capacidade, também OPS01) e subtelas OPS01.A–OPS01.D */
(function () {
  var O = function () { return window.O1; };

  // ---------- H12 · Administração: mesa por capacidade ----------
  REG.screen({
    page: 'operacao', key: 'mesa', id: 'H12', also: ['OPS01'], title: 'Mesa de casos', mtitle: 'Mesa', nav: 'casos', home: true, wide: true,
    normal: 'Uso recorrente',
    scens: [['primeiro', 'Primeiro uso'], ['vazio', 'Ausência confirmada'], ['parcial', 'Indisponibilidade parcial'], ['vencendo', 'Prazo vencendo'], ['semacesso', 'Sem acesso ao tipo']],
    vals: function (ctx) {
      var O1 = O(), me = O1.me(), scn = ctx.scn, ui = ctx.ui;
      var deny = scn === 'semacesso' && !ui.cont ? 'privacidade' : '';
      var mine = scn === 'primeiro' || scn === 'vazio' ? [] : O1.mine();
      var open = scn === 'primeiro' || scn === 'vazio' ? [] : O1.open();
      var hoje = mine.filter(function (c) { return c.hoje; }).length;
      // cartões "comece por aqui": dois primeiros por prazo + recibo com resultado desconhecido
      var cards = mine.slice(0, 2).map(function (c, i) {
        var part = scn === 'parcial' && c.dom === 'privacidade' && !ui.retried;
        var restr = deny === c.dom;
        return { top: c.proto + ' · ' + c.tipo.toUpperCase(), due: (c.prazoTipo === 'Prazo legal' ? 'PRAZO ' : (c.hoje ? 'VENCE ' : 'PRAZO ')) + c.prazo.replace('hoje ', '').toUpperCase(), cls: 'o1-pcard ' + (i === 0 ? 'is-risk' : 'is-warn'), ic: 'ic ic--sm i-' + c.ic,
          head: restr ? 'Conteúdo restrito' : c.head, sub: part ? 'Domínio carregou em parte · 13:58. Tente de novo antes de agir.' : (restr ? 'Você não tem acesso a este tipo de caso.' : c.sub), cta: restr ? 'Continuar' : c.cta, go: function () { if (restr) ctx.setUi({ cont: true }); else O1.openCase(ctx, c); } };
      });
      var unk = DB.o1_recibos.filter(function (r) { return O1.recState(r).key === 'desc'; })[0];
      if (unk && mine.length) {
        var st = unk.steps.filter(function (s) { return s.st === 'desc'; })[0];
        cards.push({ top: unk.id + ' · RESULTADO', due: 'DESCONHECIDO', cls: 'o1-pcard is-info', ic: 'ic ic--sm i-clock', head: unk.title + ' sem confirmação', sub: (st ? st.name : 'Uma etapa') + ' não confirmou. Consulte a mesma referência.', cta: 'Consultar ' + unk.id, go: function () { ctx.go('OPS02.D', { id: unk.id }); } });
      } else if (mine[2]) {
        var c3 = mine[2];
        cards.push({ top: c3.proto + ' · ' + c3.tipo.toUpperCase(), due: 'PRAZO ' + c3.prazo.toUpperCase(), cls: 'o1-pcard is-info', ic: 'ic ic--sm i-' + c3.ic, head: c3.head, sub: c3.sub, cta: c3.cta, go: function () { O1.openCase(ctx, c3); } });
      }
      // filas por domínio permitido
      var byDom = function (d) { return open.filter(function (c) { return c.dom === d; }); };
      var oldest = function (l) { return l.length ? 'mais antigo ' + O1.age(l.reduce(function (a, c) { return O1.ageMin(c.aberto) > O1.ageMin(a.aberto) ? c : a; }).aberto) : 'sem casos'; };
      var den = byDom('conteudo').reduce(function (a, c) { return a + (c.denuncias || 0); }, 0);
      var filas = [
        { name: 'Titularidade e credenciais', sub: 'perfis.decidir', meta: oldest(byDom('perfis')), n: String(byDom('perfis').length), go: function () { DB.o1_busca.f = { dom: 'perfis', prio: '', resp: '' }; DB.o1_busca.page = 1; ctx.go('OPS01.B'); } },
        { name: 'Avaliações denunciadas', sub: U.plural(den, 'denúncia agrupada', 'denúncias agrupadas'), meta: oldest(byDom('conteudo')), n: String(byDom('conteudo').length), go: function () { ctx.go('OPS04.A'); } },
        { name: 'Privacidade', sub: deny ? 'sem acesso ao tipo' : (scn === 'parcial' && !ui.retried ? 'carregou em parte · 13:58' : 'só leitura para você'), meta: deny ? '—' : oldest(byDom('privacidade')), n: deny ? '—' : String(byDom('privacidade').length), go: function () { if (deny) ctx.setUi({ cont: true }); else { DB.o1_busca.f = { dom: 'privacidade', prio: '', resp: '' }; DB.o1_busca.page = 1; ctx.go('OPS01.B'); } } },
        { name: 'Financeiro', sub: 'atalho; saldos ficam lá', meta: '12 em FA01', n: '→', go: function () { ctx.go('FA01'); } }
      ];
      var chegando = open.filter(function (c) { return !c.resp; }).sort(function (a, b) { return O1.ageMin(a.aberto) - O1.ageMin(b.aberto); }).slice(0, 3).map(function (c) {
        return { ic: 'ic ic--xs i-' + c.ic, t: c.head, s: c.origem + ' · ' + O1.age(c.aberto), go: function () { O1.openCase(ctx, c); } };
      });
      var recs = DB.o1_recibos.filter(function (r) { return r.who === me.short; }).slice().reverse().slice(0, 5).map(function (r) {
        var s = O1.recState(r); return { id: r.id, t: r.title, b: s.key === 'ok' ? 'ok' : s.label.toLowerCase(), cls: s.cls, go: function () { ctx.go('OPS02.D', { id: r.id }); } };
      });
      var rows = open.map(function (c) { var r = O1.row(c, ctx, null, deny); if (scn === 'parcial' && c.dom === 'privacidade' && !ui.retried) r.estado = 'carregou em parte'; return r; });
      var alerts = [];
      if (scn === 'parcial' && !ui.retried) alerts.push(O1.alert('warn', 'Privacidade carregou em parte', 'Outras filas estão em dia · 13:58. Os casos de Privacidade podem estar desatualizados.', 'Tentar de novo', function () { ctx.setUi({ retried: true }); ctx.toast('Privacidade carregou por completo · ' + O1.tick()); }));
      if (scn === 'parcial' && ui.retried) alerts.push(O1.alert('ok', 'Todas as filas carregaram', 'Verificado agora nas filas que você abre.'));
      if (scn === 'vencendo') alerts.push(O1.alert('warn', 'Prazo vencendo', (mine[0] ? mine[0].proto + ' vence ' + mine[0].prazo + '. ' : '') + 'A ordem é por prazo aprovado, não por cor.', 'Consultar de novo', function () { ctx.toast('Prazos consultados às ' + O1.tick() + ' · nenhum mudou'); }));
      if (deny) alerts.push(O1.alert('info', 'Sem acesso ao tipo', 'Seu acesso a Privacidade foi retirado. Os itens aparecem sem conteúdo; peça acesso em Governança se precisar.', 'Continuar', function () { ctx.setUi({ cont: true }); }));
      var q = ui.q != null ? ui.q : '';
      var search = function (e) { if (e && e.preventDefault) e.preventDefault(); DB.o1_busca.q = q; DB.o1_busca.f = { dom: '', prio: '', resp: '' }; DB.o1_busca.page = 1; ctx.go('OPS01.B'); };
      var first = mine[0];
      return {
        isFirst: scn === 'primeiro', isEmpty: scn === 'vazio', isNormal: scn !== 'primeiro' && scn !== 'vazio',
        greet: 'Boa tarde, ' + me.name.split(' ')[0],
        sub: me.papel + ' · ' + U.plural(mine.length, 'caso com você', 'casos com você') + ' · ' + U.plural(hoje, 'vence hoje', 'vencem hoje').replace(/^1 vencem/, '1 vence') + ' · ordem por prazo aprovado',
        msub: U.plural(mine.length, 'caso com você', 'casos com você') + ' · ' + (hoje === 1 ? '1 vence hoje' : hoje + ' vencem hoje'),
        q: q, setQ: function (e) { ctx.setUi({ q: U.val(e) }); }, search: search,
        cards: cards, hasCards: cards.length > 0, filas: filas, chegando: chegando, hasChegando: chegando.length > 0, noChegando: chegando.length === 0, recs: recs,
        rows: rows, nOpen: U.plural(open.length, 'aberto', 'abertos') + ' · ' + U.plural(open.filter(function (c) { return c.hoje; }).length, 'vencendo hoje', 'vencendo hoje'),
        alerts: alerts, caps: O1.capList(),
        hasFirst: !!first, resumeLabel: first ? 'Retomar ' + first.proto : '', resume: function () { if (first) O1.openCase(ctx, first); },
        myQueue: function () { ctx.go('OPS01.A'); }, filtrar: function () { ctx.go('OPS01.B'); }, recheck: function () { ctx.toast('Verificado às ' + O1.tick() + ' nas filas que você abre · nenhuma pendência'); },
        allCases: function () { DB.o1_busca.f = { dom: '', prio: '', resp: '' }; ctx.go('OPS01.B'); }
      };
    }
  });

  // ---------- OPS01.A · Hoje na operação ----------
  REG.screen({
    page: 'operacao', key: 'ops01a', id: 'OPS01.A', title: 'Hoje na operação', mtitle: 'Hoje', nav: 'casos', back: 'H12', wide: true,
    scens: [['vazio', 'Sem pendências confirmadas'], ['parcial', 'Carga parcial de um domínio'], ['prazo', 'Prazo desconhecido'], ['fora', 'Serviço indisponível']],
    vals: function (ctx) {
      var O1 = O(), me = O1.me(), scn = ctx.scn, ui = ctx.ui;
      var all = scn === 'vazio' || scn === 'fora' ? [] : O1.mine();
      var f = ui.f || 'todos';
      var list = all.filter(function (c) { return f === 'todos' || (f === 'hoje' && c.hoje) || (f === 'aguardando' && (c.estado === 'Aguardando' || c.estado === 'Recurso' || c.estado === 'Parcial')); });
      var partial = (scn === 'parcial' || scn === '') && !ui.retried;
      var items = list.map(function (c, i) {
        var unknownDue = scn === 'prazo' && i === 0;
        var part = partial && c.dom === 'privacidade';
        return { proto: c.proto, titulo: c.titulo, due: unknownDue ? 'Prazo não informado pela origem · trate como hoje' : c.prazoTipo + ' ' + c.prazo, meta: 'aberto há ' + O1.age(c.aberto) + ' · atualizado ' + c.upd, next: part ? 'próxima: aguarde a carga completa de Privacidade' : 'próxima: ' + c.next,
          cls: 'o1-item' + (c.hoje || unknownDue ? ' is-hoje' : ''), est: c.estado, estCls: O1.estadoCls(c.estado), go: function () { O1.openCase(ctx, c); } };
      });
      var alerts = [];
      if (scn === 'vazio') alerts.push(O1.alert('ok', 'Nenhuma pendência confirmada', 'Verificado 14:02 em Casos, Avaliações e Privacidade. Nada atribuído a você agora.'));
      if (scn === 'parcial' && !ui.retried) alerts.push(O1.alert('warn', 'Privacidade carregou em parte · 13:58', 'Casos e Avaliações estão em dia. Não decida casos de Privacidade até carregar.', 'Tentar de novo', function () { ctx.setUi({ retried: true }); ctx.toast('Privacidade carregou · ' + O1.tick()); }));
      if (scn === 'prazo') alerts.push(O1.alert('warn', 'Prazo desconhecido', 'Um caso chegou sem prazo aprovado. Ele fica no topo até alguém definir o prazo.', 'Definir com a gestão', function () { ctx.toast('Pedido de prazo registrado no histórico'); }));
      if (scn === 'fora') alerts.push(O1.alert('risk', 'Mesa indisponível', 'Não foi possível carregar sua fila (erro 503 às 14:02). Nada foi alterado; tente de novo em alguns minutos.', 'Tentar de novo', function () { ctx.toast('Ainda indisponível às ' + O1.tick() + ' · nada foi alterado'); }));
      var chip = function (k, l) { return { label: l, cls: 'chip o1-chip' + (f === k ? ' is-on' : ''), on: String(f === k), go: function () { ctx.setUi({ f: k }); } }; };
      var first = all[0];
      return {
        sub: 'Minha fila · ' + U.plural(all.length, 'caso atribuído', 'casos atribuídos') + ' · ' + all.filter(function (c) { return c.hoje; }).length + ' com prazo hoje',
        bar: O1.bar('casos.ler · minha fila', me.short + ' · Moderação'), alerts: alerts,
        chips: [chip('todos', 'Todos'), chip('hoje', 'Vencem hoje'), chip('aguardando', 'Aguardando terceiros')],
        items: items, hasItems: items.length > 0, noItems: items.length === 0 && scn !== 'fora' && scn !== 'vazio',
        hasFirst: !!first, resumeLabel: first ? 'Retomar ' + first.proto : '', resume: function () { if (first) O1.openCase(ctx, first); },
        showPriv: partial, privRetry: function () { ctx.setUi({ retried: true }); ctx.toast('Privacidade carregou · ' + O1.tick()); },
        caps: O1.capList(), fa01: function () { ctx.go('FA01'); }
      };
    }
  });

  // ---------- OPS01.B · Lista e triagem ----------
  var PAGE = 5;
  REG.screen({
    page: 'operacao', key: 'ops01b', id: 'OPS01.B', title: 'Lista e triagem', mtitle: 'Casos', nav: 'casos', back: 'H12', wide: true,
    scens: [['semres', 'Sem resultado'], ['invalido', 'Filtro inválido'], ['atualizado', 'Item atualizado na seleção'], ['semacesso', 'Acesso retirado'], ['antigo', 'Dados antigos']],
    vals: function (ctx) {
      var O1 = O(), B = DB.o1_busca, scn = ctx.scn, ui = ctx.ui;
      var q = scn === 'semres' && !ui.cleared ? 'ana-ribeiro-2' : B.q;
      var f = B.f;
      var deny = scn === 'semacesso' ? 'privacidade' : '';
      var all = DB.o1_casos.filter(O1.isOpen).filter(function (c) { return c.dom !== deny; });
      var res = all.filter(function (c) {
        if (f.dom && c.dom !== f.dom) return false;
        if (f.prio && c.prio !== f.prio) return false;
        if (f.resp === 'sem' && c.resp) return false;
        if (f.resp === 'comigo' && c.resp !== 'lia') return false;
        if (q && U.norm([c.proto, c.obj, c.head, c.tipo, c.objetos].join(' ')).indexOf(U.norm(q)) < 0) return false;
        return true;
      }).sort(function (a, b) { return a.ord - b.ord; });
      var pages = Math.max(1, Math.ceil(res.length / PAGE)), pg = Math.min(B.page || 1, pages);
      var sel = (ui.sel || B.sel || []).filter(function (id) { return !!O1.caso(id); });
      if (scn === 'atualizado' && !ui.fixed && !ui.sel) sel = ['c301', 'c305'];
      var shown = res.slice((pg - 1) * PAGE, pg * PAGE);
      var setSel = function (s) { B.sel = s; ctx.setUi({ sel: s }); };
      var rows = shown.map(function (c) {
        var r = O1.row(c, ctx, sel);
        r.toggle = function () { var s = sel.slice(), i = s.indexOf(c.id); if (i >= 0) s.splice(i, 1); else s.push(c.id); setSel(s); };
        r.objLine = c.obj + ' · ' + c.tipo;
        return r;
      });
      var selCases = sel.map(O1.caso).filter(Boolean);
      var doms = selCases.map(function (c) { return c.dom; }).filter(function (d, i, a) { return a.indexOf(d) === i; });
      var sameCat = doms.length === 1, canAssign = sameCat && selCases.every(O1.canDecide);
      var selInfo = !sel.length ? '' : (sameCat ? (canAssign ? 'mesma categoria · ação permitida: atribuir' : 'mesma categoria · sem capacidade para atribuir neste domínio') : 'categorias diferentes · nenhuma ação coletiva compatível');
      var DOML = { perfis: 'Perfis e titularidade', conteudo: 'Avaliações', privacidade: 'Privacidade' };
      var fchip = function (k, v, label) { var on = f[k] === v; return { label: label, cls: 'chip o1-chip' + (on ? ' is-on' : ''), on: String(on), go: function () { var nf = Object.assign({}, f); nf[k] = on ? '' : v; B.f = nf; B.page = 1; ctx.refresh(); } }; };
      var chips = [fchip('dom', 'perfis', 'Perfis e titularidade'), fchip('dom', 'conteudo', 'Avaliações'), fchip('dom', 'privacidade', 'Privacidade'), fchip('prio', 'alta', 'Prioridade alta'), fchip('resp', 'sem', 'Sem responsável'), fchip('resp', 'comigo', 'Comigo')];
      var applied = [];
      if (f.dom) applied.push(DOML[f.dom] || f.dom);
      if (f.prio) applied.push('Prioridade ' + f.prio);
      if (f.resp) applied.push(f.resp === 'sem' ? 'Sem responsável' : 'Comigo');
      var alerts = [];
      if (scn === 'invalido' && !ui.fixed) alerts.push(O1.alert('risk', 'Filtro inválido', 'O filtro “prazo até 31/02” não existe e foi ignorado. A lista abaixo não usa esse filtro.', 'Remover filtro', function () { ctx.setUi({ fixed: true }); }));
      if (scn === 'atualizado' && !ui.fixed) alerts.push(O1.alert('warn', '#C-305 mudou enquanto você selecionava', 'Caio R. assumiu o caso às 14:03. Revise a seleção antes de atribuir.', 'Rever seleção', function () { var s = sel.filter(function (x) { return x !== 'c305'; }); B.sel = s; ctx.setUi({ sel: s, fixed: true }); }));
      if (scn === 'semacesso') alerts.push(O1.alert('risk', 'Acesso retirado', 'Seu acesso a Privacidade foi retirado às 14:01. Os casos desse tipo saíram da lista e da seleção.'));
      if (scn === 'antigo' && !ui.fixed) alerts.push(O1.alert('warn', 'Dados de 13:20', 'A lista não atualiza há 42 min e pode não mostrar mudanças recentes.', 'Atualizar', function () { ctx.setUi({ fixed: true }); ctx.toast('Lista atualizada às ' + O1.tick()); }));
      var from = res.length ? (pg - 1) * PAGE + 1 : 0, to = Math.min(pg * PAGE, res.length);
      return {
        sub: 'Todos os casos · ' + U.plural(res.length, 'resultado', 'resultados'),
        bar: O1.bar('casos.ler · todas as filas', applied.length ? 'Filtro: ' + applied.join(' · ') : 'Todas as filas'),
        alerts: alerts, q: q, setQ: function (e) { B.q = U.val(e); B.page = 1; ctx.setUi({ cleared: true }); },
        chips: chips, hasApplied: applied.length > 0 || !!q, clear: function () { B.f = { dom: '', prio: '', resp: '' }; B.q = ''; B.page = 1; ctx.setUi({ cleared: true, showF: false }); },
        showF: !!ui.showF, toggleF: function () { ctx.setUi({ showF: !ui.showF }); }, nF: String(applied.length), fLabel: 'Filtros · ' + applied.length,
        rows: rows, hasRows: rows.length > 0, noRows: rows.length === 0, emptyQ: q ? 'Nenhum caso para “' + q + '”' : 'Nenhum caso com esses filtros',
        hasSel: sel.length > 0, selN: String(sel.length), selTxt: U.plural(sel.length, 'selecionado', 'selecionados'), selInfo: selInfo,
        assignLabel: 'Atribuir ' + sel.length, assignCls: 'btn btn--primary btn--sm' + (canAssign ? '' : ' o1-off'), assignDis: String(!canAssign),
        assign: function () { if (!canAssign) { ctx.toast(sel.length ? 'Seleção sem ação coletiva compatível' : 'Selecione casos da mesma categoria'); return; } ctx.go('OPS01.C', { id: sel.join(',') }); },
        clearSel: function () { setSel([]); },
        exportar: function () { ctx.ask({ title: 'Exportar ' + U.plural(res.length, 'caso', 'casos') + '?', text: 'A exportação leva só protocolo, tipo, prioridade, estado e prazo. Objetos e contas saem mascarados.', lines: ['Formato: CSV', 'Fica registrada no seu histórico de acesso'], ok: 'Exportar', onOk: function () { ctx.toast('Exportação pronta · registrada às ' + O1.tick()); } }); },
        pageTxt: from + '–' + to + ' de ' + res.length + ' · busca preservada ao voltar',
        hasPrev: pg > 1, hasNext: pg < pages, prevCls: 'btn btn--outline btn--sm' + (pg > 1 ? '' : ' o1-off'), nextCls: 'btn btn--outline btn--sm' + (pg < pages ? '' : ' o1-off'),
        prev: function () { if (pg > 1) { B.page = pg - 1; ctx.refresh(); } }, next: function () { if (pg < pages) { B.page = pg + 1; ctx.refresh(); } }
      };
    }
  });

  // ---------- OPS01.C · Atribuição e encaminhamento ----------
  REG.screen({
    page: 'operacao', key: 'ops01c', id: 'OPS01.C', title: 'Atribuir e encaminhar', mtitle: 'Atribuir', nav: 'casos', form: true,
    back: function (ctx) { return 'OPS02.A'; }, backParams: function (ctx) { return { id: String(ctx.id || 'c301').split(',')[0] }; },
    testIds: ['c301', 'p44', 'c312,c314'],
    scens: [['semcap', 'Destinatário sem capacidade'], ['concorrente', 'Atribuição concorrente'], ['pendente', 'Solicitação pendente'], ['falha', 'Falha confirmada']],
    vals: function (ctx) {
      var O1 = O(), scn = ctx.scn, ui = ctx.ui;
      var ids = String(ctx.id || 'c301').split(',').filter(function (x) { return !!O1.caso(x); });
      if (!ids.length) ids = ['c301'];
      var cases = ids.map(O1.caso), c0 = cases[0];
      var need = cases.map(function (c) { return O1.DOM[c.dom] ? O1.DOM[c.dom].cap : 'casos.decidir'; }).filter(function (x, i, a) { return a.indexOf(x) === i; });
      var to = ui.to != null ? ui.to : (scn === 'semcap' ? 'bea' : (c0.dom === 'privacidade' ? 'caio' : 'caio'));
      var note = ui.note != null ? ui.note : (c0.id === 'c301' ? 'Prova de Instagram precisa de segunda leitura.' : '');
      var team = DB.o1_equipe.map(function (m) {
        var ok = need.every(function (cap) { return m.caps.indexOf(cap) >= 0; });
        var cur = cases.every(function (c) { return c.resp === m.id; });
        var on = to === m.id;
        return { name: m.full, area: m.area, capTxt: ok ? 'Tem a capacidade ' + need.join(' + ') : 'Sem ' + need.join(' + '), ok: ok, no: !ok, cur: cur,
          cls: 'o1-opt' + (on ? ' is-on' : '') + (ok ? '' : ' is-no'), on: String(on), pick: function () { ctx.setUi({ to: m.id, err: '' }); } };
      });
      var dest = O1.member(to), destOk = !!dest && need.every(function (cap) { return dest.caps.indexOf(cap) >= 0; });
      var alerts = [];
      if (scn === 'concorrente' && !ui.reloaded) alerts.push(O1.alert('warn', 'Atribuição concorrente', 'Caio R. abriu a atribuição deste caso às 14:03. Recarregue antes de confirmar para não sobrescrever.', 'Recarregar', function () { ctx.setUi({ reloaded: true }); ctx.toast('Caso recarregado · responsável continua ' + O1.respName(c0.resp)); }));
      if (scn === 'pendente') alerts.push(O1.alert('info', 'Solicitação pendente', 'Uma atribuição deste caso foi enviada às 14:01 e ainda não confirmou. Consulte antes de repetir.', 'Consultar', function () { ctx.toast('Consulta às ' + O1.tick() + ': a atribuição anterior não foi gravada · pode confirmar'); ctx.setUi({ consulted: true }); }));
      if (scn === 'falha' && !ui.retry) alerts.push(O1.alert('risk', 'Atribuição não gravada', 'A última tentativa falhou às 14:04. Nada mudou: o responsável continua ' + O1.respName(c0.resp) + '.', 'Tentar de novo', function () { ctx.setUi({ retry: true }); }));
      var blocked = (scn === 'concorrente' && !ui.reloaded) || (scn === 'pendente' && !ui.consulted) || (scn === 'falha' && !ui.retry);
      var done = ui.done ? O1.recibo(ui.done) : null;
      var confirm = function () {
        if (blocked) { ctx.setUi({ err: 'Resolva o aviso acima antes de confirmar.' }); return; }
        if (!destOk) { ctx.setUi({ err: (dest ? dest.full : 'Esta pessoa') + ' não tem ' + need.join(' + ') + '. Escolha alguém da equipe elegível.' }); return; }
        if (!String(note).trim()) { ctx.setUi({ err: 'Escreva a nota operacional: ela vai para o histórico e para quem recebe.' }); return; }
        ctx.ask({ title: 'Confirmar ' + dest.full + ' como responsável?', text: 'A atribuição gera recibo e entra no histórico de ' + U.plural(cases.length, 'caso', 'casos') + '.',
          lines: cases.map(function (c) { return c.proto + ' · de ' + O1.respName(c.resp) + ' para ' + dest.name; }).concat(['Motivo: ' + note]), ok: 'Confirmar responsável',
          onOk: function () {
            var last = null;
            cases.forEach(function (c) { var from = O1.respName(c.resp); c.resp = dest.id; if (c.estado === 'Novo') c.estado = 'Em análise'; last = O1.receipt(c, 'Encaminhado a ' + dest.name, note + ' (antes: ' + from + ')', [['Responsável gravado', 'ok'], ['Aviso a ' + dest.name, 'and']]); });
            ctx.setUi({ done: last.id, err: '' });
          } });
      };
      return {
        sub: cases.map(function (c) { return c.proto + ' · ' + c.titulo; }).join(' · '),
        bar: O1.bar('casos.atribuir', ids.length > 1 ? U.plural(ids.length, 'caso', 'casos') : c0.proto),
        alerts: alerts, isDone: !!done, notDone: !done,
        doneTxt: done ? done.id + ' · ' + done.title + ' · ' + done.at : '', backCase: function () { ctx.go('OPS02.A', { id: c0.id }); }, seeRec: function () { if (done) ctx.go('OPS02.D', { id: done.id }); },
        cur: cases.map(function (c) { return O1.respName(c.resp); }).filter(function (x, i, a) { return a.indexOf(x) === i; }).join(', ') + (c0.dom === 'perfis' ? ' · Perfis' : ''),
        dep: c0.id === 'c301' ? 'OPS03.C · revisão de prova' : '—', hasDep: c0.id === 'c301', openDep: function () { ctx.go('OPS03.B', { id: c0.id }); },
        team: team, note: note, setNote: function (e) { ctx.setUi({ note: U.val(e), err: '' }); },
        err: ui.err || '', hasErr: !!ui.err, confirm: confirm, cancel: function () { ctx.go('OPS02.A', { id: c0.id }); },
        need: need.join(' + ')
      };
    }
  });

  // ---------- OPS01.D · Visão agregada do produto ----------
  REG.screen({
    page: 'operacao', key: 'ops01d', id: 'OPS01.D', title: 'Visão agregada do produto', mtitle: 'Visão agregada', nav: 'casos', back: 'H12', wide: true,
    normal: 'Coorte provisória',
    scens: [['amostra', 'Amostra insuficiente'], ['revisada', 'Coorte revisada'], ['atrasado', 'Analytics atrasado'], ['fora', 'Analytics indisponível']],
    vals: function (ctx) {
      var O1 = O(), A = DB.o1_aggr, scn = ctx.scn, ui = ctx.ui;
      var jk = ui.j || 'cadastro', J = A.j[jk], rk = ui.r || 'canal';
      var small = scn === 'amostra';
      var off = scn === 'fora';
      var kpis = J.kpis.map(function (k) { return { l: k[0], n: small ? '—' : k[1], s: small ? 'amostra insuficiente (menos de 30)' : k[2], hasS: small || !!k[2] }; });
      var tabs = Object.keys(A.j).map(function (k) { var on = k === jk; return { label: A.j[k].label, short: A.j[k].curto, cls: 'seg__it' + (on ? ' is-on' : ''), on: String(on), go: function () { ctx.setUi({ j: k }); } }; });
      var rchip = function (k, l) { var on = rk === k; return { label: l, cls: 'chip o1-chip' + (on ? ' is-on' : ''), on: String(on), go: function () { ctx.setUi({ r: k }); } }; };
      var alerts = [];
      if (scn === '' ) alerts.push(O1.alert('info', 'Coorte provisória', A.fonte + '. Importados (' + A.importados + ') ficam fora: não são usuários ativos.'));
      if (scn === 'revisada') alerts.push(O1.alert('ok', 'Coorte revisada em 26/10 06:00', 'Números fechados para outubro. Importados (' + A.importados + ') ficam fora: não são usuários ativos.'));
      if (small) alerts.push(O1.alert('warn', 'Amostra insuficiente', 'Este recorte tem menos de 30 pessoas. Os números ficam ocultos para não expor indivíduos nem induzir conclusão.', 'Ampliar recorte', function () { ctx.setUi({ r: 'canal' }); ctx.toast('Recorte ampliado para canal'); }));
      if (scn === 'atrasado') alerts.push(O1.alert('warn', 'Analytics atrasado', 'Última carga: 24/10 23:00 (esperado: 25/10 23:00). Compare só com períodos da mesma carga.'));
      if (off) alerts.push(O1.alert('risk', 'Analytics indisponível', 'O serviço de métricas não respondeu às 14:02. Nenhum número é mostrado para não exibir dado incompleto.', 'Tentar de novo', function () { ctx.toast('Ainda indisponível às ' + O1.tick()); }));
      return {
        sub: '3 jornadas · coorte de outubro · PT-BR', bar: O1.bar('analytics.ler · agregado', A.coorte), alerts: alerts, on: !off, off: off,
        tabs: tabs, q: J.q, kpis: kpis, pct: small ? '0' : String(J.pct), pctStyle: 'width:' + (small ? 0 : J.pct) + '%', pctTxt: small ? 'amostra insuficiente' : J.kpis[2][1] + ' · ' + J.kpis[2][2], base: J.base,
        rchips: [rchip('canal', 'Canal'), rchip('idioma', 'Idioma')],
        rows: (J.rec[rk] || []).map(function (r) { return { a: r[0], b: small ? '—' : r[1], c: r[2], d: r[3] }; }),
        defs: !!ui.defs, toggleDefs: function () { ctx.setUi({ defs: !ui.defs }); },
        invest: function () { ctx.ask({ title: 'Abrir investigação autorizada?', text: 'A investigação vai para a equipe de dados com este recorte agregado. Nenhuma lista de pessoas ou visitantes é gerada.', lines: [J.label, 'Recorte: ' + (rk === 'canal' ? 'canal' : 'idioma'), A.fonte], ok: 'Abrir investigação', onOk: function () { ctx.toast('Investigação aberta · registrada às ' + O1.tick()); } }); }
      };
    }
  });
})();
