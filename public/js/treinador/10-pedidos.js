/* REL06 · Caixa de pedidos do treinador: aceitar (vira aluno ativo uma vez só, com pendência de preparação),
   recusar com motivo ou pedir mais informações. Erro de consulta não vira caixa vazia. */
REG.screen({
  page: 'treinador', key: 'pedidos', id: 'REL06', title: 'Pedidos', nav: 'alunos', back: 'H04',
  normal: 'Aguardando você',
  scens: [['aceito', 'Aceito'], ['falhou', 'Aceite falhou'], ['semvagas', 'Sem vagas'], ['carregando', 'Carregando'], ['falha', 'Falha da consulta'], ['aguardando', 'Aguardando a pessoa'], ['capacidade', 'Capacidade indisponível'], ['recusado', 'Recusado'], ['desconhecido', 'Resultado desconhecido']],
  vals: function (ctx) {
    var T = window.T1, ui = ctx.ui, scn = ctx.scn;
    var OV = {
      aceito: { pd1: { status: 'aceito', result: 'Aceito hoje às ' + U.now() } },
      aguardando: { pd1: { status: 'info', result: 'Pergunta enviada hoje às 09:15' } },
      recusado: { pd3: { status: 'recusado', result: 'Recusado hoje: fora da minha região' } }
    }[scn] || {};
    var list = DB.t1_pedidos.map(function (p) { return Object.assign({}, p, OV[p.id] || {}); });
    var blockAccept = scn === 'semvagas' || scn === 'capacidade';
    var REASONS = {
      vagas: ['Sem vagas no momento', 'Oi {n}! Obrigado pelo interesse. Estou sem vagas no momento; posso avisar quando abrir uma?'],
      esp: ['Fora da minha especialidade', 'Oi {n}! Obrigado pelo interesse. Esse objetivo pede outro tipo de profissional; recomendo buscar alguém especializado.'],
      regiao: ['Fora da minha região', 'Oi {n}! Obrigado pelo interesse. Atendo presencialmente só em Londrina; se quiser, posso acompanhar online.'],
      outro: ['Outro motivo', 'Oi {n}! Obrigado pelo interesse. Agora não consigo assumir o seu acompanhamento.']
    };

    var doAccept = function (p) {
      var real = DB.find('t1_pedidos', p.id);
      if (real.status === 'aceito') { ctx.toast('Este pedido já foi resolvido.'); return; }
      var o = T.offer(real.offer) || T.offer('o1');
      var a = real.aluno ? DB.find('alunos', real.aluno) : null;
      if (!a) {
        a = { id: DB.uid('al'), name: real.name, first: real.name.split(' ')[0], status: 'ativo', svc: '', since: '', goal: real.goal, city: real.city, age: 0, program: '', week: 0, adherence: 0, lastCheckin: '', next: '', flag: null, tags: [], prepDone: false, payment: '', photo: '' };
        DB.alunos.push(a); real.aluno = a.id;
      }
      a.status = 'ativo'; a.svc = o.name; a.since = '26/10/2026'; a.prepDone = false; a.next = 'Aguarda preparação'; a.tags = [o.fmt, 'nova'];
      a.flag = { kind: 'preparacao', text: 'Pedido aceito · preparação pendente', when: 'hoje', to: 'TRE03' };
      real.status = 'aceito'; real.result = 'Aceito hoje às ' + U.now();
      ctx.setUi({ open: '', mode: '', acceptFail: '', unknown: '' });
      ctx.toast(a.first + ' entrou na sua carteira (uma vez só). A preparação foi enviada para ' + a.first + ' responder.');
    };
    var row = function (p) {
      var o = T.offer(p.offer), fst = p.name.split(' ')[0], real = DB.find('t1_pedidos', p.id);
      var open = ui.open === p.id, mode = open ? ui.mode : '';
      var reason = ui.reason || (blockAccept ? 'vagas' : 'vagas');
      var defMsg = REASONS[reason][1].replace('{n}', fst);
      var msg = ui.msg !== undefined && ui.msgFor === p.id + reason ? ui.msg : defMsg;
      var infoDef = 'Oi ' + fst + '! Antes de aceitar, me conta: você tem alguma lesão ou restrição? Quais dias e horários prefere?';
      var info = ui.info !== undefined && ui.infoFor === p.id ? ui.info : infoDef;
      return {
        name: p.name, origin: p.origin + (o ? ' · ' + o.name + ' · ' + U.money(o.price) + '/' + o.unit : ' · sem serviço escolhido'), msg: '“' + p.msg + '”', at: p.at, due: p.due,
        st: p.status === 'info' ? 'Aguardando resposta de ' + fst : 'Aguardando você', stCls: p.status === 'info' ? 'badge badge--plain' : 'badge badge--info',
        isPend: p.status === 'pendente', isInfo: p.status === 'info',
        canAccept: !blockAccept, noAccept: blockAccept,
        failed: ui.acceptFail === p.id, unknown: ui.unknown === p.id,
        accept: function () {
          if (blockAccept) return;
          ctx.ask({
            title: 'Aceitar pedido de ' + fst + '?', ok: 'Aceitar pedido',
            lines: ['Cria o vínculo e ' + fst + ' passa a aparecer uma vez só na sua carteira.', 'Envia a preparação para ' + fst + ' responder antes do primeiro treino.', 'Aceitar não cobra nada por aqui: a contratação segue a regra da oferta.'],
            onOk: function () {
              if (scn === 'falhou' && !ui.tried) { ctx.setUi({ acceptFail: p.id, tried: true }); return; }
              if (scn === 'desconhecido' && !ui.tried) { ctx.setUi({ unknown: p.id, tried: true }); return; }
              doAccept(p);
            }
          });
        },
        retry: function () { doAccept(p); },
        consult: function () { doAccept(p); },
        showCtx: open && mode === 'ctx', showRefuse: open && mode === 'recusar', showInfo: open && mode === 'info',
        toggleCtx: function () { ctx.setUi({ open: open && mode === 'ctx' ? '' : p.id, mode: 'ctx' }); },
        openRefuse: function () { ctx.setUi({ open: p.id, mode: 'recusar' }); },
        openInfo: function () { ctx.setUi({ open: p.id, mode: 'info' }); },
        close: function () { ctx.setUi({ open: '', mode: '' }); },
        ctxRows: [{ k: 'Objetivo', v: p.goal }, { k: 'Cidade', v: p.city }, { k: 'Origem', v: p.origin + ' · ' + p.at }, { k: 'Prazo', v: p.due }],
        reasons: Object.keys(REASONS).map(function (k) { var on = reason === k; return { label: REASONS[k][0], cls: 'chip' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ reason: k }); } }; }),
        rmsg: msg, setRmsg: function (e) { ctx.setUi({ msg: U.val(e), msgFor: p.id + reason }); },
        refuse: function () {
          real.status = 'recusado'; real.result = 'Recusado hoje: ' + REASONS[reason][0].toLowerCase();
          var a = real.aluno ? DB.find('alunos', real.aluno) : null;
          if (a && a.status === 'pedido') { a.status = 'encerrado'; a.flag = null; a.svc = 'Pedido recusado em 26/10'; a.next = 'Sem vínculo'; }
          ctx.setUi({ open: '', mode: '' }); ctx.toast('Pedido de ' + fst + ' recusado. A mensagem foi enviada; contratos independentes não mudam.');
        },
        info: info, setInfo: function (e) { ctx.setUi({ info: U.val(e), infoFor: p.id }); },
        sendInfo: function () {
          if (!info.trim()) { ctx.toast('Escreva a pergunta antes de enviar.'); return; }
          real.status = 'info'; real.result = 'Pergunta enviada hoje às ' + U.now();
          var a = real.aluno ? DB.find('alunos', real.aluno) : null;
          if (a) {
            a.flag = null; a.next = 'Aguardando resposta ao pedido';
            var c = DB.conversas.find(function (x) { return x.with === a.id; });
            if (!c) { c = { id: a.id, with: a.id, unread: 0, msgs: [] }; DB.conversas.push(c); }
            c.msgs.push({ from: 'me', text: info.trim(), at: U.now() });
          }
          ctx.setUi({ open: '', mode: '' }); ctx.toast('Pergunta enviada para ' + fst + '. O pedido sai da sua fila até a resposta chegar.');
        }
      };
    };
    var done = list.filter(function (p) { return p.status === 'aceito' || p.status === 'recusado'; }).map(function (p) {
      var a = p.aluno ? DB.find('alunos', p.aluno) : null;
      return { name: p.name, result: p.result, isAcc: p.status === 'aceito' && !!a, open: function () { if (a) ctx.go('H05', { id: a.id }); } };
    });
    var pend = list.filter(function (p) { return p.status === 'pendente' || p.status === 'info'; });
    var loading = scn === 'carregando', failed = scn === 'falha';
    var alerts = [];
    if (scn === 'aceito') alerts.push(T.alert('ok', 'Pedido de Paula aceito', 'Paula aparece na lista de alunos uma vez só. Tocar de novo em aceitar não cria outro aluno.', '', null));
    if (scn === 'semvagas') alerts.push(T.alert('warn', 'Sem vagas no Acompanhamento online', 'Você definiu limite de 10 alunos online e tem 10 ativos. Recuse com a mensagem pronta ou aumente o limite na oferta.', 'Saiba por quê', function () { ctx.toast('O limite de vagas vem da oferta (TRE29). Aceitar acima dele fica bloqueado para não prometer o que você não consegue entregar.'); }));
    if (scn === 'capacidade') alerts.push(T.alert('warn', 'Não conseguimos verificar suas vagas', 'Aceitar volta assim que a consulta responder. Recusar e pedir informações continuam disponíveis.', 'Tentar de novo', function () { ctx.scenario(''); ctx.toast('Vagas verificadas às ' + U.now() + '.'); }));
    if (scn === 'recusado') alerts.push(T.alert('ok', 'Pedido de Thiago recusado', 'A mensagem foi enviada. Compras ou contratos independentes não mudam.', '', null));
    if (failed) alerts.push(T.alert('risk', 'Os pedidos não carregaram', 'Isso não quer dizer que a caixa está vazia. Nenhum pedido foi descartado.', 'Tentar de novo', function () { ctx.scenario(''); ctx.toast('Pedidos consultados às ' + U.now() + '.'); }));

    return {
      sub: loading || failed ? 'Consultando pedidos' : U.plural(pend.length, 'pedido aguardando', 'pedidos aguardando') + ' · ' + list.filter(function (p) { return p.status === 'pendente'; }).length + ' com você',
      alerts: alerts, hasAlerts: alerts.length > 0, loading: loading,
      rows: loading || failed ? [] : pend.map(row), hasRows: !loading && !failed && pend.length > 0, isEmpty: !loading && !failed && !pend.length,
      done: loading || failed ? [] : done, hasDone: !loading && !failed && done.length > 0,
      invite: function () { ctx.go('REL01'); }, goHoje: function () { ctx.go('H03'); }
    };
  }
});
