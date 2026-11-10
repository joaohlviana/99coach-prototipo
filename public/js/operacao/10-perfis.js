/* O1 · OPS03 (perfis, credenciais e titularidade) e subtelas OPS03.A–OPS03.D.
   Titularidade (prova de Instagram), registro profissional (CREF) e direito da foto são dimensões independentes. */
(function () {
  var O = function () { return window.O1; };
  var X = function () { return window.O1X; };
  var TIT = { 'confirmada': 'badge badge--ok', 'claim conferido': 'badge badge--ok', 'contestada': 'badge badge--warn', 'conflito': 'badge badge--warn', 'não reivindicado': 'badge badge--plain', 'retirado': 'badge badge--ink' };
  var CREF = { 'verificado': 'badge badge--ok', 'informado': 'badge badge--plain', 'vencido': 'badge badge--risk', 'correção parcial': 'badge badge--warn', '—': 'badge badge--plain' };
  var FOTO = { 'própria': 'badge badge--ok', 'sem direito': 'badge badge--risk', 'sem licença': 'badge badge--risk' };
  var bcls = function (map, v) { return map[v] || (/verificado/.test(v) ? 'badge badge--ok' : 'badge badge--plain'); };
  var PEND = { insuficiente: 'Prova insuficiente', nao: 'Não reivindicado', conflito: 'Conflito', expirada: 'Verificação expirada', revisao: 'Revisão pendente' };

  // ---------- OPS03 · Perfis, credenciais e titularidade ----------
  REG.screen({
    page: 'operacao', key: 'ops03', id: 'OPS03', title: 'Credenciais', mtitle: 'Credenciais', nav: 'casos', back: 'OPS03.A', wide: true,
    testIds: ['anar', 'marcos'],
    scens: [['vencida', 'Prova vencida'], ['contestacao', 'Contestação'], ['cref', 'CREF verificado']],
    vals: function (ctx) {
      var O1 = O(), scn = ctx.scn, ui = ctx.ui;
      var p = DB.find('o1_verif', ctx.id) || DB.find('o1_verif', 'thiago');
      var c = p.caso ? O1.caso(p.caso) : null;
      var dec = c && c.decs ? c.decs.filter(function (d) { return d.k === 'confirmar' || d.k === 'manter21'; })[0] : null;
      var titOk = p.tit === 'confirmada';
      var vencida = scn === 'vencida' && !ui.asked;
      var crefTxt = scn === 'cref' ? 'verificado' : p.cref;
      var rows = [
        { dim: 'Instagram', prova: p.ig, estado: vencida ? 'prova vencida 25/10' : (titOk ? 'titular confirmado' : p.tit), cls: vencida ? 'badge badge--risk' : bcls(TIT, p.tit), fonte: p.origem === 'importado' ? 'perfil importado' : 'código no direct', vence: vencida ? 'venceu 25/10' : '—' },
        { dim: 'CREF', prova: p.crefNum || '—', estado: crefTxt, cls: bcls(CREF, crefTxt), fonte: scn === 'cref' ? 'CREF4/SP · consulta 26/10 13:10' : (p.cref === 'verificado' ? 'declarado (sem consulta)' : 'declarado'), vence: scn === 'cref' ? '31/12/2026' : '—' },
        { dim: 'Imagem do perfil', prova: p.foto === 'própria' ? 'licença própria' : p.foto, estado: p.foto, cls: bcls(FOTO, p.foto), fonte: 'upload', vence: '—' }
      ];
      var alerts = [];
      if (vencida) alerts.push(O1.alert('warn', 'Prova vencida', 'O código de 24/10 venceu antes da decisão. Peça uma prova nova; não aprove com prova vencida.', 'Pedir nova', function () {
        if (c) O1.receipt(c, 'Nova prova pedida', 'código de 24/10 venceu antes da decisão', [['Pedido registrado', 'ok'], ['Aviso ao titular', 'and']]);
        ctx.setUi({ asked: true }); ctx.toast('Pedido de nova prova registrado no histórico');
      }));
      if (scn === 'contestacao') alerts.push(O1.alert('info', 'Contestação aberta', 'Dois pedidos para o mesmo perfil. Compare lado a lado antes de aprovar a titularidade.', 'Comparar', function () { ctx.go(p.id === 'anar' ? 'OPS03.C' : 'OPS02.B', { id: p.caso || 'c301' }); }));
      if (scn === 'cref') alerts.push(O1.alert('ok', 'CREF verificado', 'Consulta ao CREF4/SP em 26/10 13:10 · registro ativo até 31/12/2026. A titularidade do Instagram continua sendo outra dimensão.'));
      if (p.crefNota && scn !== 'cref') alerts.push(O1.alert('warn', 'Selo CREF divergente', p.crefNota + '. Corrija só esta dimensão.', 'Revisar CREF', function () { ctx.go('OPS03.D', { id: p.id }); }));
      var why = ui.why != null ? ui.why : '';
      var canApprove = !!dec && !titOk && !vencida && O1.canDecide(c) && p.tit !== 'conflito';
      var approve = function () {
        if (!canApprove) { ctx.setUi({ err: vencida ? 'Prova vencida: peça uma nova antes de aprovar.' : (p.tit === 'conflito' ? 'Há conflito: decida em Conflito e contestação.' : 'Nada para aprovar nesta dimensão.') }); return; }
        if (!String(why).trim()) { ctx.setUi({ err: 'Escreva o motivo da aprovação. Ele vai para o recibo do ' + c.proto + '.' }); return; }
        ctx.ask({ title: 'Aprovar a titularidade do Instagram?', text: 'Instagram não verifica o CREF nem a licença da foto.', lines: X().impact(c, dec).map(function (x) { return x.k + ': ' + x.v; }).concat(['Motivo: ' + why]), ok: 'Aprovar Instagram', onOk: function () { var r = O1.apply(c, dec, String(why).trim(), ''); ctx.go('OPS02.D', { id: r.id }); } });
      };
      return {
        h1: 'Credenciais · ' + p.nome, sub: p.slug + ' · origem ' + p.origem + (c ? ' · ' + c.proto : ''),
        bar: O1.bar('perfis.decidir', 'Perfil · ' + p.full), alerts: alerts, rows: rows,
        showApprove: canApprove, why: why, setWhy: function (e) { ctx.setUi({ why: U.val(e), err: '' }); }, approve: approve,
        err: ui.err || '', hasErr: !!ui.err,
        reviewCref: function () { ctx.go('OPS03.D', { id: p.id }); }, openProof: function () { ctx.go('OPS03.B', { id: p.caso || 'c301' }); }, hasCase: !!c,
        openCase: function () { if (c) ctx.go('OPS02', { id: c.id }); }, caseTxt: c ? 'Abrir ' + c.proto : ''
      };
    }
  });

  // ---------- OPS03.A · Fila de verificações ----------
  REG.screen({
    page: 'operacao', key: 'ops03a', id: 'OPS03.A', title: 'Fila de verificações', mtitle: 'Verificações', nav: 'casos', back: 'H12', wide: true,
    normal: 'Prova insuficiente',
    scens: [['nao', 'Não reivindicado'], ['conflito', 'Conflito'], ['expirada', 'Verificação expirada'], ['revisao', 'Revisão pendente'], ['todas', 'Todas as pendências']],
    vals: function (ctx) {
      var O1 = O(), scn = ctx.scn, ui = ctx.ui;
      var f = ui.f != null ? ui.f : (scn === 'todas' ? '' : (scn || 'insuficiente'));
      var pend = DB.o1_verif.filter(function (p) { return p.pend !== 'ok'; });
      var list = pend.filter(function (p) { return !f || p.pend === f; });
      var rows = list.map(function (p) {
        return { nome: p.nome, origem: p.origem, tit: p.tit, titCls: bcls(TIT, p.tit), cref: p.cref, crefCls: bcls(CREF, p.cref), foto: p.foto, fotoCls: bcls(FOTO, p.foto), resp: p.resp || '—', pendTxt: PEND[p.pend] || '',
          mobile: 'titular: ' + p.tit + ' · CREF: ' + p.cref + ' · foto: ' + p.foto,
          open: function () { ctx.go('OPS03', { id: p.id }); }, mine: p.resp === 'Lia', free: !p.resp, take: function () { p.resp = 'Lia'; if (p.caso) { var c = O1.caso(p.caso); if (c && !c.resp) { c.resp = 'lia'; O1.receipt(c, 'Revisão atribuída a você', 'Fila de verificações · ' + (PEND[p.pend] || ''), [['Responsável gravado', 'ok']]); } } ctx.toast(p.nome + ' atribuído a você'); } };
      });
      var chips = [['', 'Todas']].concat(Object.keys(PEND).map(function (k) { return [k, PEND[k]]; })).map(function (x) { var on = f === x[0]; return { label: x[1], cls: 'chip o1-chip' + (on ? ' is-on' : ''), on: String(on), go: function () { ctx.setUi({ f: x[0] }); } }; });
      var free = list.filter(function (p) { return !p.resp; });
      var alerts = [];
      var ALERT = {
        nao: ['info', 'Não reivindicado', 'Perfis importados sem conta não têm titular. Retirada ou reivindicação seguem caminhos próprios.'],
        conflito: ['warn', 'Conflito de titularidade', 'Mais de uma conta pede o mesmo perfil. Edição pública fica suspensa até a decisão.'],
        expirada: ['warn', 'Verificação expirada', 'O registro venceu no conselho. O selo passa a “informado” até nova consulta.'],
        revisao: ['info', 'Revisão pendente', 'Prova recebida e ainda não lida por ninguém da operação.']
      };
      if (ALERT[f]) alerts.push(O1.alert(ALERT[f][0], ALERT[f][1], ALERT[f][2]));
      return {
        sub: U.plural(pend.length, 'perfil com pendência', 'perfis com pendência'), bar: O1.bar('perfis.ler', 'Fila · ' + (f ? PEND[f] : 'todas as dimensões')), alerts: alerts,
        chips: chips, hasF: !!f, fTxt: f ? PEND[f] : '', clear: function () { ctx.setUi({ f: '' }); },
        rows: rows, hasRows: rows.length > 0, noRows: rows.length === 0,
        assignCls: 'btn btn--primary btn--sm' + (free.length ? '' : ' o1-off'), assignDis: String(!free.length),
        assign: function () {
          if (!free.length) { ctx.toast('Nenhum perfil sem responsável neste filtro'); return; }
          ctx.ask({ title: 'Atribuir ' + U.plural(free.length, 'revisão', 'revisões') + ' a você?', text: 'Cada perfil continua com dimensões separadas.', lines: free.map(function (p) { return p.nome + ' · ' + (PEND[p.pend] || ''); }), ok: 'Atribuir', onOk: function () {
            free.forEach(function (p) { p.resp = 'Lia'; var c = p.caso ? O1.caso(p.caso) : null; if (c && !c.resp) { c.resp = 'lia'; O1.receipt(c, 'Revisão atribuída a você', 'Fila de verificações', [['Responsável gravado', 'ok']]); } });
            ctx.toast(U.plural(free.length, 'revisão atribuída', 'revisões atribuídas') + ' a você');
          } });
        }
      };
    }
  });

  // ---------- OPS03.B · Prova vinculada ao perfil ----------
  REG.screen({
    page: 'operacao', key: 'ops03b', id: 'OPS03.B', title: 'Prova vinculada ao perfil', mtitle: 'Prova', nav: 'casos', back: 'OPS03', backParams: function () { return { id: 'thiago' }; }, form: true,
    scens: [['email', 'E-mail sem prova do perfil'], ['codigo', 'Código expirado'], ['divergente', 'Conta divergente'], ['fornecedor', 'Fornecedor indisponível']],
    vals: function (ctx) {
      var O1 = O(), scn = ctx.scn, ui = ctx.ui, c = O1.caso('c301');
      var dec = c.decs[0];
      var res = { '': 'código ••3K confere · 24/10 09:20', email: 'sem prova do perfil · só e-mail confirmado', codigo: 'código ••3K expirado · enviado 24/10 09:35', divergente: 'código enviado por @thiago_treinos, não por @thiago.coach', fornecedor: 'não foi possível conferir agora' }[scn] || '';
      var okProof = scn === '' || (scn === 'fornecedor' && ui.retried);
      if (scn === 'fornecedor' && ui.retried) res = 'código ••3K confere · conferido de novo às ' + (ui.at || '14:06');
      var alerts = [];
      if (scn === 'email') alerts.push(O1.alert('warn', 'E-mail não prova o perfil', 'A conta tem e-mail e sessão confirmados, mas não enviou o código pelo direct do perfil. Peça a prova pelo canal autorizado.'));
      if (scn === 'codigo') alerts.push(O1.alert('warn', 'Código inválido ou expirado', 'O código chegou depois de 15 min. Gere um novo pedido; não aceite por aproximação.'));
      if (scn === 'divergente') alerts.push(O1.alert('risk', 'Conta divergente', 'O código veio de outra conta do Instagram. Isso não prova o perfil /thiago-pereira.', 'Abrir contestação', function () { ctx.go('OPS02.B', { id: 'c301' }); }));
      if (scn === 'fornecedor' && !ui.retried) alerts.push(O1.alert('warn', 'Fornecedor indisponível', 'O Instagram não respondeu às 14:02. Nada foi decidido; tente de novo em alguns minutos.', 'Tentar de novo', function () { ctx.setUi({ retried: true, at: O1.tick() }); }));
      var why = ui.why != null ? ui.why : '';
      var comp = ui.comp != null ? ui.comp : '';
      var decided = !!(c.decisao && X().DECIDED[c.estado]);
      var accept = function () {
        if (decided) { ctx.setUi({ err: 'Titularidade já decidida em ' + c.decisao.ref + '.' }); return; }
        if (!okProof) { ctx.setUi({ err: 'A prova não confere. Peça complemento em vez de aceitar.' }); return; }
        if (!String(why).trim()) { ctx.setUi({ err: 'Escreva o motivo da aceitação.' }); return; }
        ctx.ask({ title: 'Aceitar a titularidade?', text: 'Aceitar aqui não verifica o CREF nem autoriza a foto.', lines: X().impact(c, dec).map(function (x) { return x.k + ': ' + x.v; }).concat(['Motivo: ' + why]), ok: 'Aceitar titularidade', onOk: function () { var r = O1.apply(c, dec, String(why).trim(), ''); ctx.go('OPS02.D', { id: r.id }); } });
      };
      var sendComp = function () {
        if (!String(comp).trim()) { ctx.setUi({ cerr: 'Diga qual prova falta.' }); return; }
        ctx.ask({ title: 'Pedir complemento?', text: 'Vai pelo direct oficial @99coach.oficial. Nunca pedimos senha do Instagram.', lines: ['Texto: ' + comp], ok: 'Enviar pedido', onOk: function () { var r = O1.receipt(c, 'Complemento pedido', comp, [['Pedido registrado', 'ok'], ['Mensagem no direct', 'and']]); ctx.setUi({ comp: '', compOpen: false }); ctx.toast('Pedido enviado · ' + r.id); } });
      };
      return {
        sub: 'Claim #CL-88 · /thiago-pereira', bar: O1.bar('perfis.decidir · titularidade', 'Perfil · Thiago Pereira'), alerts: alerts,
        kv: [{ k: 'Alvo', v: '/thiago-pereira · @thiago.coach' }, { k: 'Conta que reivindica', v: '••••88 · e-mail confirmado' }, { k: 'Canal', v: 'direct para @99coach.oficial' }, { k: 'Escopo', v: 'só titularidade' }, { k: 'Resultado', v: res }],
        okProof: okProof, badProof: !okProof, decided: decided, decTxt: decided ? c.decisao.label + ' · ' + c.decisao.ref : '', openDec: function () { if (c.decisao) ctx.go('OPS02.D', { id: c.decisao.ref }); },
        why: why, setWhy: function (e) { ctx.setUi({ why: U.val(e), err: '' }); }, err: ui.err || '', hasErr: !!ui.err, accept: accept,
        acceptCls: 'btn btn--primary btn--lg' + (okProof && !decided ? '' : ' o1-off'), acceptDis: String(!okProof || decided),
        compOpen: !!ui.compOpen, toggleComp: function () { ctx.setUi({ compOpen: !ui.compOpen, cerr: '' }); }, comp: comp, setComp: function (e) { ctx.setUi({ comp: U.val(e), cerr: '' }); }, cerr: ui.cerr || '', hasCerr: !!ui.cerr, sendComp: sendComp
      };
    }
  });

  // ---------- OPS03.C · Conflito e contestação ----------
  REG.screen({
    page: 'operacao', key: 'ops03c', id: 'OPS03.C', title: 'Conflito e contestação', mtitle: 'Conflito', nav: 'casos', back: 'OPS03', backParams: function () { return { id: 'anar' }; }, wide: true,
    scens: [['ja', 'Perfil já reivindicado'], ['aberta', 'Contestação aberta'], ['vencida', 'Prova vencida'], ['bloqueada', 'Ação bloqueada por conflito']],
    vals: function (ctx) {
      var O1 = O(), scn = ctx.scn, ui = ctx.ui;
      var c = O1.caso(ctx.id); if (!c || !c.claims) c = O1.caso('c305');
      var decs = c.decs, k = ui.k || decs[0].k, d = decs.filter(function (x) { return x.k === k; })[0] || decs[0];
      var why = ui.why != null ? ui.why : '';
      var decided = !!(c.decisao && X().DECIDED[c.estado]);
      var claims = c.claims.map(function (cl, i) {
        var venc = scn === 'vencida' && i === 1;
        return { n: 'Reivindicação ' + (i + 1), conta: 'Conta ' + cl.conta, prova: venc ? cl.prova + ' · vencida 26/10' : cl.prova, ant: cl.ant, nota: cl.nota, hasNota: !!cl.nota, cls: venc ? 'badge badge--risk' : 'badge badge--' + cl.cls, st: venc ? 'vencida' : (i === 0 ? 'aceita' : 'pendente') };
      });
      var stop = '';
      var alerts = [];
      if (scn === 'ja') alerts.push(O1.alert('info', 'Perfil já reivindicado', '/ana-ribeiro tem titular aceito em 20/10 (R-271). Transferir exige prova mais forte do que a aceita.'));
      if (scn === 'aberta') alerts.push(O1.alert('warn', 'Contestação aberta', 'A conta ••••21 ainda pode responder até 27/10 18:00. Decidir antes disso exige fundamento de urgência.'));
      if (scn === 'vencida') { if (k === 'transferir') stop = 'A prova da conta ••••07 venceu: não dá para transferir com ela.'; alerts.push(O1.alert('warn', 'Prova vencida', 'O documento da conta ••••07 venceu em 26/10. Peça prova nova antes de transferir.', 'Pedir nova prova', function () { var r = O1.receipt(c, 'Nova prova pedida', 'documento da conta ••••07 venceu', [['Pedido registrado', 'ok'], ['Aviso à conta ••••07', 'and']]); ctx.toast('Pedido registrado · ' + r.id); })); }
      if (scn === 'bloqueada') { stop = 'Ação bloqueada: há outra decisão em andamento neste perfil.'; alerts.push(O1.alert('risk', 'Ação bloqueada por conflito', 'Caio R. está aplicando uma decisão em /ana-ribeiro desde 14:01. Aguarde o recibo dele ou encaminhe.', 'Encaminhar revisão', function () { ctx.go('OPS01.C', { id: c.id }); })); }
      var register = function () {
        if (decided) { ctx.setUi({ err: 'Já decidido em ' + c.decisao.ref + '.' }); return; }
        if (stop) { ctx.setUi({ err: stop }); return; }
        if (!O1.canDecide(c)) { ctx.setUi({ err: X().blockedWhy(c) }); return; }
        if (!String(why).trim()) { ctx.setUi({ err: 'Escreva o fundamento. As partes recebem só o resultado, não as provas da outra.' }); return; }
        ctx.ask({ title: d.label + '?', text: 'As partes são avisadas pelo fluxo autorizado. Nenhuma vê a prova da outra.', lines: X().impact(c, d).map(function (x) { return x.k + ': ' + x.v; }).concat(['Motivo: ' + why]), ok: 'Registrar decisão', onOk: function () { var r = O1.apply(c, d, String(why).trim(), ''); ctx.go('OPS02.D', { id: r.id }); } });
      };
      return {
        sub: '/ana-ribeiro · ' + U.plural(c.claims.length, 'reivindicação', 'reivindicações') + ' · ' + c.proto, bar: O1.bar('perfis.decidir · contestação', c.alvo), alerts: alerts,
        claims: claims, decided: decided, open: !decided, decTxt: decided ? c.decisao.label + ' · ' + c.decisao.ref : '', openDec: function () { if (c.decisao) ctx.go('OPS02.D', { id: c.decisao.ref }); },
        opts: decs.map(function (x) { var on = x.k === d.k; return { label: x.label, cls: 'o1-opt' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ k: x.k, err: '' }); } }; }),
        campo: d.campo, antes: d.antes, depois: d.depois,
        why: why, setWhy: function (e) { ctx.setUi({ why: U.val(e), err: '' }); }, err: ui.err || '', hasErr: !!ui.err, register: register,
        forward: function () { ctx.go('OPS01.C', { id: c.id }); },
        hist: O1.histView(c, ctx.go)
      };
    }
  });

  // ---------- OPS03.D · Correção pública e retirada ----------
  var PREV = { '': [['Banco', 'pronto', 'badge badge--ok'], ['Página pública', 'após confirmar', 'badge badge--plain'], ['Busca interna', 'após confirmar', 'badge badge--plain'], ['Cache externo', 'fora do nosso controle', 'badge badge--plain']] };
  REG.screen({
    page: 'operacao', key: 'ops03d', id: 'OPS03.D', title: 'Correção pública e retirada', mtitle: 'Correção', nav: 'casos', back: 'OPS03', backParams: function (ctx) { return { id: ctx.id || 'thiago' }; }, wide: true,
    scens: [['revogacao', 'Revogação pendente'], ['atrasada', 'Publicação atrasada'], ['parcial', 'Falha parcial'], ['cache', 'Informação antiga em cache']],
    vals: function (ctx) {
      var O1 = O(), scn = ctx.scn, ui = ctx.ui;
      var p = DB.find('o1_verif', ctx.id) || DB.find('o1_verif', 'thiago');
      var c = O1.caso(p.crefCaso || '') || O1.caso('c306');
      var done = p.cref !== 'verificado' && p.id === 'thiago';
      var rec = done ? DB.o1_recibos.filter(function (r) { return r.caso === c.id; }).slice(-1)[0] : null;
      var prop = (PREV[''] || []).map(function (s) { return { name: s[0], st: s[1], cls: s[2] }; });
      if (scn === 'atrasada') { prop[1] = { name: 'Página pública', st: 'atrasada 20 min', cls: 'badge badge--warn' }; }
      if (scn === 'parcial' && !ui.retried) { prop = [{ name: 'Banco', st: 'Confirmado 14:06', cls: 'badge badge--ok' }, { name: 'Página pública', st: 'Confirmado 14:06', cls: 'badge badge--ok' }, { name: 'Busca interna', st: 'Falhou 14:07', cls: 'badge badge--risk' }, { name: 'Cache externo', st: 'Não se aplica', cls: 'badge badge--plain' }]; }
      if (scn === 'parcial' && ui.retried) { prop = [{ name: 'Banco', st: 'Confirmado 14:06', cls: 'badge badge--ok' }, { name: 'Página pública', st: 'Confirmado 14:06', cls: 'badge badge--ok' }, { name: 'Busca interna', st: 'Confirmado ' + (ui.at || '14:08'), cls: 'badge badge--ok' }, { name: 'Cache externo', st: 'Não se aplica', cls: 'badge badge--plain' }]; }
      if (rec) prop = rec.steps.map(function (s) { var v = O1.step(s); return { name: v.name, st: v.label + (s.at ? ' ' + s.at : ''), cls: v.cls }; });
      var alerts = [];
      if (scn === 'revogacao') alerts.push(O1.alert('info', 'Revogação pendente no conselho', 'O CREF4/SP ainda não confirmou a revogação. Até lá, o perfil mostra “informado pelo treinador”, nunca “verificado”.'));
      if (scn === 'atrasada') alerts.push(O1.alert('warn', 'Publicação atrasada', 'A página pública está 20 min atrás do banco. A correção já vale para novas consultas.', 'Consultar de novo', function () { ctx.toast('Página pública ainda na fila às ' + O1.tick()); }));
      if (scn === 'parcial' && !ui.retried) alerts.push(O1.alert('risk', 'Falha parcial', 'Aplicou: banco e página pública. Não aplicou: busca interna (falhou 14:07).', 'Tentar de novo', function () { ctx.setUi({ retried: true, at: O1.tick() }); ctx.toast('Só a busca interna foi reexecutada'); }));
      if (scn === 'cache') alerts.push(O1.alert('warn', 'Informação antiga em cache', 'Buscadores externos ainda mostram “verificado”. Está fora do nosso controle; pedimos atualização às 14:06.'));
      var why = ui.why != null ? ui.why : '';
      var confirm = function () {
        if (done) { ctx.setUi({ err: 'Correção já confirmada' + (rec ? ' em ' + rec.id : '') + '.' }); return; }
        if (!String(why).trim()) { ctx.setUi({ err: 'Escreva o fundamento da correção.' }); return; }
        ctx.ask({ title: 'Confirmar correção do selo CREF?', text: 'Só a dimensão CREF muda. Titularidade e foto ficam como estão.', lines: ['Selo: CREF verificado → CREF informado', 'Texto: ' + p.crefNum + ' · informado pelo treinador', 'Propagação: banco, página pública e busca interna', 'Motivo: ' + why], ok: 'Confirmar correção', onOk: function () {
          var r = O1.receipt(c, 'Correção do selo CREF', String(why).trim(), [['Banco', 'ok'], ['Página pública', 'fila'], ['Busca interna', 'fila'], ['Cache externo', 'na']]);
          p.cref = 'informado'; p.crefNota = ''; c.estado = 'Decidido'; c.decisao = { k: 'corrigir', label: 'Correção do selo CREF', ref: r.id, why: String(why).trim() };
          ctx.go('OPS02.D', { id: r.id });
        } });
      };
      return {
        sub: 'Credencial CREF de ' + p.slug + ' · ' + c.proto, bar: O1.bar('perfis.corrigir', 'Selo CREF · perfil público'), alerts: alerts,
        ba: [{ f: 'Selo', a: done ? 'CREF verificado' : 'CREF verificado', b: 'CREF informado' }, { f: 'Texto', a: p.crefNum + ' · verificado', b: p.crefNum + ' · informado pelo treinador' }],
        prop: prop, done: done, open: !done, doneTxt: rec ? 'Correção registrada em ' + rec.id + ' · ' + rec.at : 'Correção registrada',
        openRec: function () { if (rec) ctx.go('OPS02.D', { id: rec.id }); },
        why: why, setWhy: function (e) { ctx.setUi({ why: U.val(e), err: '' }); }, err: ui.err || '', hasErr: !!ui.err, confirm: confirm,
        toOps07: function () { ctx.go('OPS07'); }
      };
    }
  });
})();
