/* T6 · FT06 Repasse manual (se adotado) · FT07 Histórico de repasses · FT08 Envios bancários */
(function () {
  var RST = {
    'concluída': ['na conta conectada', 'badge badge--ok'], 'enviado ao provedor': ['enviado ao provedor', 'badge badge--info'], falhou: ['falhou', 'badge badge--risk'],
    revertida: ['revertido', 'badge badge--risk'], 'parcialmente revertida': ['parcial · revertido em parte', 'badge badge--warn']
  };
  var EST = { pago: ['pago pelo provedor', 'badge badge--ok'], pausado: ['pausado', 'badge badge--warn'], agendado: ['previsto', 'badge badge--info'], falhou: ['falhou', 'badge badge--risk'] };
  function parseAmt(t) { var n = Number(String(t || '').replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')); return isNaN(n) ? 0 : n; }
  function fmtIn(n) { return n.toFixed(2).replace('.', ','); }
  function newManual(amount) {
    var T6 = window.T6, t = U.now(), id = 'P-78';
    if (DB.find('t6_repasses', id)) return id;
    DB.t6_repasses.push({ id: id, date: '26/10', amount: amount, sales: [], status: 'enviado ao provedor', reason: 'Solicitação manual feita por você às ' + t + ' (modo de demonstração)', manual: true });
    DB.t6_extrato.extra.push({ id: id, date: '26/10', time: t, kind: 'repasse', label: 'Repasse manual ' + id + ' para a conta conectada', ref: id, sale: '', amount: 0, mv: {}, moved: amount, est: false, note: 'Solicitação durável: acompanhe pelo número ' + id });
    return id;
  }

  REG.screen({
    page: 'treinador', key: 'ft06', id: 'FT06', title: 'Pedir repasse', mtitle: 'Repasse', nav: 'recebimentos', back: 'H09', form: true,
    normal: 'Revisar transferência',
    scens: [['valor', 'Valor mudou'], ['ambiguo', 'Ambíguo'], ['restricao', 'Restrição'], ['saldo', 'Saldo mudou'], ['desconhecido', 'Resultado desconhecido'], ['falha', 'Falha confirmada']],
    vals: function (ctx) {
      var T6 = window.T6, scn = ctx.scn, ui = ctx.ui, c = DB.t6_conta;
      var base = T6.now().lib, avail = base;
      if (scn === 'valor') avail = T6.r2(base - 0.42);
      if (scn === 'saldo') avail = T6.r2(base - 40);
      var amtTxt = ui.amt !== undefined ? ui.amt : fmtIn(Math.max(0, avail)), amt = parseAmt(amtTxt);
      var err = amt < c.min ? 'Mínimo de ' + T6.brl(c.min) + ' por repasse (R2).' : (amt > avail ? 'Acima do disponível agora (' + T6.brl(avail) + ').' : '');
      var open = DB.t6_repasses.filter(function (r) { return r.manual && r.status === 'enviado ao provedor'; })[0];
      var blocked = scn === 'restricao' || scn === 'falha';
      var consult = function () { var id = newManual(amt || avail); ctx.toast('Consultamos ' + id + ': o provedor recebeu a solicitação. Nada foi repetido.'); GO('FT07', { id: id }); };
      var A = {
        valor: ['warn', 'Valor mudou', 'O disponível passou de ' + T6.brl(base) + ' para ' + T6.brl(avail) + ' (taxa conciliada pelo provedor). Confira o novo valor antes de confirmar.', 'Consultar de novo', function () { ctx.scenario(''); }],
        ambiguo: ['warn', 'Ambíguo', 'Não sabemos se a solicitação P-78 foi aceita. Consulte P-78; não peça de novo para não duplicar.', 'Consultar P-78', consult],
        restricao: ['risk', 'Restrição', 'O provedor bloqueou repasses manuais até a verificação da conta (dado bancário pendente). Nada saiu do seu saldo.', 'Continuar', function () { GO('FT09'); }],
        saldo: ['warn', 'Saldo mudou', 'Um reembolso mudou o disponível para ' + T6.brl(avail) + '. Revise o valor.', 'Revisar', function () { ctx.setUi({ amt: fmtIn(avail) }); }],
        desconhecido: ['warn', 'Resultado desconhecido', 'A solicitação P-78 foi enviada, mas a resposta não chegou. Consulte a mesma solicitação antes de qualquer coisa.', 'Consultar de novo', consult],
        falha: ['risk', 'Falha confirmada', 'O provedor recusou P-78: conta conectada com pendência. Nada saiu do seu saldo.', 'Corrigir', function () { GO('FT09'); }]
      };
      var a = A[scn] || null;
      var noRepeat = scn === 'ambiguo' || scn === 'desconhecido';
      return {
        hasAlert: !!a, aCls: a ? 'alert alert--' + a[0] + ' t6-alert' : '', aT: a ? a[1] : '', aS: a ? a[2] : '', aBtn: a ? a[3] : '', aGo: a ? a[4] : function () {},
        avail: T6.brl(avail), dest: c.acct, checked: 'confirmado às ' + DB.t6_extrato.cut.split(' ')[1], min: T6.brl(c.min),
        amt: amtTxt, setAmt: function (e) { ctx.setUi({ amt: U.val(e) }); }, hasErr: !!err && !noRepeat, err: err,
        hasOpen: !!open && scn === '', openId: open ? open.id : '', goOpen: function () { if (open) GO('FT07', { id: open.id }); },
        showForm: !(open && scn === '') && !noRepeat, canConfirm: !err && !blocked, cantConfirm: !!err || blocked,
        confirm: function () {
          if (err || blocked) { ctx.toast(err || 'Repasse bloqueado: veja o motivo acima.'); return; }
          ctx.ask({
            title: 'Revisar transferência', ok: 'Confirmar solicitação',
            text: 'Destino: ' + c.acct + '. Valor ' + T6.brl(amt) + ' em BRL.',
            lines: ['Sai do liberado e vai para sua conta conectada no provedor.', 'O envio ao banco é outra etapa e segue o calendário do provedor.', 'A solicitação ganha um número para você acompanhar; não confirme duas vezes.'],
            onOk: function () { var id = newManual(amt); ctx.toast('Solicitação ' + id + ' enviada ao provedor. Acompanhe por aqui.'); GO('FT07', { id: id }); }
          });
        },
        goEnvios: function () { GO('FT08'); }, goHub: function () { GO('H09'); }, goConta: function () { GO('FT09'); }
      };
    }
  });

  REG.screen({
    page: 'treinador', key: 'ft07', id: 'FT07', title: 'Histórico de repasses', mtitle: 'Repasses', nav: 'recebimentos',
    back: function (ctx) { return ctx.id ? 'FT07' : 'H09'; },
    testIds: ['P-72', 'P-70', 'P-77'],
    normal: 'Transferências',
    scens: [['falhou', 'Falhou'], ['enviado', 'Enviado ao provedor'], ['revertido', 'Revertido'], ['parcial', 'Parcial'], ['falhou2', 'Falhou · corrigir conta'], ['desconhecido', 'Resultado desconhecido']],
    vals: function (ctx) {
      var T6 = window.T6, scn = ctx.scn, c = DB.t6_conta;
      var id = ctx.id || ({ falhou: 'P-70', parcial: 'P-72', falhou2: 'P-70' })[scn] || '';
      var A = {
        falhou: ['risk', 'Falhou', 'Motivo do provedor: conta conectada com cadastro incompleto naquele dia. O valor não saiu da 99Coach.', 'Tentar de novo', function () { ctx.toast('P-70 já foi reenviado como P-71 em 29/09, concluído. Nada foi duplicado.'); GO('FT07', { id: 'P-71' }); }],
        enviado: ['info', 'Enviado ao provedor', 'Significa que a transferência saiu da 99Coach. Não é “caiu na conta”: a chegada ao banco é outra etapa.', '', null],
        revertido: ['warn', 'Revertido', 'Quando um repasse é revertido, o valor volta ao disponível e aparece no extrato com a mesma referência.', 'Saiba por quê', function () { ctx.ask({ title: 'Por que um repasse é revertido', text: 'Reembolsos e disputas depois do repasse tiram o valor de volta da conta conectada.', lines: ['P-72 teve R$ 76,00 revertidos pelo reembolso parcial R-08.', 'Nenhum valor some: tudo aparece no extrato.'], ok: 'Entendi', cancel: false }); }],
        parcial: ['warn', 'Parcial', 'P-72: R$ 601,66 transferidos em 03/10; R$ 76,00 revertidos em 23/10.', 'Consultar de novo', function () { ctx.toast('Consultamos às ' + U.now() + ': situação de P-72 confirmada.'); }],
        falhou2: ['risk', 'Falhou', 'Para os próximos repasses não falharem, confira a conta conectada no provedor.', 'Corrigir', function () { GO('FT09'); }],
        desconhecido: ['warn', 'Resultado desconhecido', 'Não recebemos a resposta do provedor sobre o último repasse. Consulte antes de qualquer nova solicitação.', 'Consultar de novo', function () { ctx.scenario(''); ctx.toast('Consultamos às ' + U.now() + ': todos os repasses têm resultado conhecido.'); }]
      };
      var a = A[scn] || null;
      var all = DB.t6_repasses.slice().sort(function (x, y) { return T6.key(y.date) - T6.key(x.date); });
      var rows = all.map(function (r) { var m = RST[r.status] || [r.status, 'badge']; return { id: r.id, amount: T6.brl(r.amount), date: r.date, st: m[0], stCls: m[1], n: String(r.sales.length), cls: 't6-tr' + (r.id === id ? ' is-on' : ''), go: function () { GO('FT07', { id: r.id }); } }; });
      var r = id ? DB.find('t6_repasses', id) : null, d = null;
      if (r) {
        var m = RST[r.status] || [r.status, 'badge'], sales = r.sales.map(function (sid) { return T6.sale(sid); }).filter(Boolean);
        var env = sales.length && sales[0].payout ? sales[0].payout : '';
        d = {
          title: 'Repasse ' + r.id, st: m[0], stCls: m[1],
          kv: T6.kv([['Valor', T6.brl(r.amount)], ['Destino', c.acct], ['Data', r.date], ['Origem', r.manual ? 'solicitação manual' : 'automático na liberação'], r.reversed ? ['Revertido', T6.brl(-r.reversed) + ' em 23/10', 't6-neg'] : null, ['Motivo', r.reason || '—']]),
          sales: sales.map(function (s) { return { t: s.order + ' · ' + T6.prod(s), s: T6.buyer(s) + ' · ' + T6.brl(s.net), go: function () { GO('FT03', { id: s.id }); } }; }),
          hasSales: sales.length > 0, hasEnv: !!env, goEnv: function () { GO('FT08', { id: env }); },
          pending: r.status === 'enviado ao provedor',
          consult: function () { r.status = 'concluída'; r.reason = (r.reason ? r.reason + '. ' : '') + 'Confirmado pelo provedor às ' + U.now(); ctx.toast(r.id + ' concluído: o valor está na conta conectada. O envio ao banco é outra etapa.'); },
          hasCase: !!r.reversed, goCase: function () { GO('FT10', { id: 'R-08' }); }
        };
      }
      return {
        hasAlert: !!a, aCls: a ? 'alert alert--' + a[0] + ' t6-alert' : '', aT: a ? a[1] : '', aS: a ? a[2] : '', aHasBtn: !!(a && a[3]), aBtn: a ? a[3] : '', aGo: a && a[4] ? a[4] : function () {},
        isDetail: !!d, d: d || { title: '', st: '', stCls: '', kv: [], sales: [], hasSales: false, hasEnv: false, goEnv: function () {}, pending: false, consult: function () {}, hasCase: false, goCase: function () {} },
        rows: rows, goHub: function () { GO('H09'); }, goList: function () { GO('FT07'); }, goEnvios: function () { GO('FT08'); }, goManual: function () { GO('FT06'); }
      };
    }
  });

  REG.screen({
    page: 'treinador', key: 'ft08', id: 'FT08', title: 'Envios bancários', mtitle: 'Envios', nav: 'recebimentos',
    back: function (ctx) { return ctx.id ? 'FT08' : 'H09'; },
    testIds: ['E-27', 'E-31', 'E-32'],
    normal: 'Envios ao banco',
    scens: [['destino', 'Destino inválido'], ['auto', 'Automático'], ['previsao', 'Previsão'], ['falha', 'Falha confirmada'], ['desconhecido', 'Status desconhecido']],
    vals: function (ctx) {
      var T6 = window.T6, scn = ctx.scn, c = DB.t6_conta;
      var id = ctx.id || ({ falha: 'E-27', desconhecido: 'E-31' })[scn] || '';
      var A = {
        destino: ['risk', 'Destino inválido', 'O banco recusou o último envio para ' + c.bank + '. Corrija o destino no provedor; tentar de novo antes disso falharia igual.', 'Corrigir no provedor', function () { GO('FT09', { prov: '1' }); }],
        auto: ['info', 'Automático', 'Calendário do provedor: envios às quintas. Próximas datas previstas: 29/10, 05/11 e 12/11. Modo manual não é oferecido por este provedor.', '', null],
        previsao: ['info', 'Previsão', 'A data de chegada é dada pelo provedor e não confirma o crédito no banco.', 'Consultar de novo', function () { ctx.toast('Consultamos às ' + U.now() + ': previsões mantidas.'); }],
        falha: ['risk', 'Falha confirmada', 'E-27 falhou: conta encerrada no banco. O valor voltou ao liberado em 18/09 e foi reenviado em E-28.', 'Corrigir', function () { GO('FT09'); }],
        desconhecido: ['warn', 'Status desconhecido', 'Não conseguimos confirmar o status de E-31 com o provedor. Não marcamos como pago nem como falha.', 'Consultar de novo', function () { ctx.scenario(''); ctx.toast('E-31 confirmado: pago pelo provedor em 15/10.'); }]
      };
      var a = A[scn] || null;
      var rows = DB.t6_envios.slice().reverse().map(function (e) {
        var m = EST[e.status] || [e.status, 'badge'], unknown = scn === 'desconhecido' && e.id === 'E-31';
        return { id: e.id, dest: e.dest, amount: T6.brl(T6.envioAmount(e)), date: e.date, fc: e.forecast ? (e.status === 'agendado' ? 'envio previsto ' + e.forecast : 'chegada prevista ' + e.forecast) : '—',
          st: unknown ? 'desconhecido' : m[0], stCls: unknown ? 'badge badge--plain' : m[1], cls: 't6-tr' + (e.id === id ? ' is-on' : ''), go: function () { GO('FT08', { id: e.id }); } };
      });
      var e = id ? DB.find('t6_envios', id) : null, d = null;
      if (e) {
        var m = EST[e.status] || [e.status, 'badge'];
        d = {
          title: 'Envio ' + e.id, st: scn === 'desconhecido' ? 'desconhecido' : m[0], stCls: scn === 'desconhecido' ? 'badge badge--plain' : m[1],
          kv: T6.kv([['Destino', e.dest + ' (mascarado)'], ['Valor', T6.brl(T6.envioAmount(e)) + ' · BRL'], ['Data do envio', e.date], ['Previsão de chegada', e.forecast ? e.forecast + ' · não é confirmação de crédito' : 'sem previsão enquanto pausado'], ['Modo', 'automático · semanal às ' + c.payoutDay + 's'], ['Nota', e.note || '—']]),
          sales: e.sales.map(function (sid) { var s = T6.sale(sid); return { t: s.order + ' · ' + T6.prod(s), s: T6.brl(s.net), go: function () { GO('FT03', { id: s.id }); } }; }),
          hasSales: e.sales.length > 0, fix: e.status === 'pausado' || e.status === 'falhou', fixLabel: e.status === 'pausado' ? 'Corrigir requisito' : 'Conferir dados no provedor',
          goFix: function () { GO('FT09', e.status === 'pausado' ? { prov: '1' } : {}); }
        };
      }
      var ok = T6.payoutOk();
      return {
        hasAlert: !!a, aCls: a ? 'alert alert--' + a[0] + ' t6-alert' : '', aT: a ? a[1] : '', aS: a ? a[2] : '', aHasBtn: !!(a && a[3]), aBtn: a ? a[3] : '', aGo: a && a[4] ? a[4] : function () {},
        mode: 'Automático · semanal às ' + c.payoutDay + 's · definido pelo provedor', rows: rows,
        isDetail: !!d, d: d || { title: '', st: '', stCls: '', kv: [], sales: [], hasSales: false, fix: false, fixLabel: '', goFix: function () {} },
        nextOk: ok, nextPaused: !ok, nextTxt: ok ? 'Próximo envio previsto para ' + (c.nextPayout || 'quinta') + ' · ' + T6.brl(T6.now().lib) : 'Envios pausados desde ' + c.pausedSince + ' · ' + T6.brl(T6.now().lib) + ' aguardando',
        goFix: function () { GO('FT09', { prov: '1' }); }, goExtrato: function () { GO('FT04'); }, goHub: function () { GO('H09'); }, goList: function () { GO('FT08'); }, goRepasses: function () { GO('FT07'); }
      };
    }
  });
})();
