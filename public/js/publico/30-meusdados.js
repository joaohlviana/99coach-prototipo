/* ACC13R · Meus dados (conta real). Plano DP06/DP11: a pessoa leva uma cópia do que é dela e sabe o que acontece ao sair.
   Exportação gerada no próprio navegador, só com o que a conta enxerga no servidor. Excluir a conta no servidor ainda
   não é automático: a tela diz isso e oferece o que já é real (retirar perfil da busca, sair apagando este aparelho). */
REG.screen({
  page: 'publico', key: 'meusdados', id: 'ACC13R', title: 'Meus dados', nav: 'conta',
  vals: function (ctx) {
    var C = window.CONTA, ui = ctx.ui, logged = !!(C && C.session());
    var area = window.ACCT ? window.ACCT.area() : null;
    var save = function (name, text, type) {
      var a = document.createElement('a'), url = URL.createObjectURL(new Blob([text], { type: type }));
      a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    };
    var csv = function (rows) { return rows.map(function (r) { return r.map(function (v) { v = v == null ? '' : String(v); if (/^[=+\-@\t\r]/.test(v) && isNaN(Number(v.replace(',', '.')))) v = "'" + v; return /[",;\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(';'); }).join('\r\n'); };
    var run = function () {
      if (ui.busy) return;
      ctx.setUi({ busy: true, err: '', done: '' });
      var out = { geradoEm: new Date().toISOString(), origem: '99coach — exportação feita no navegador da própria conta', conta: null, treinador: null, vinculos: [], pedidos: [], horarios: [], sessoes: [], mensagens: [], falhas: [] };
      var fail = function (what, r) { if (!r || !r.ok) out.falhas.push(what); return r && r.ok; };
      C.me().then(function (r) { if (fail('conta', r)) out.conta = (r.data || [])[0] || null; return C.links(); })
        .then(function (L) {
          out.vinculos = L || [];
          return C.requests().then(function (R) { out.pedidos = R || []; return L || []; });
        })
        .then(function (L) {
          var ids = L.map(function (l) { return l.id; });
          var chain = ids.length ? C.appointments(ids).then(function (r) { if (fail('horários', r)) out.horarios = r.data || []; }) : Promise.resolve();
          L.forEach(function (l) {
            chain = chain.then(function () { return C.sessions(l.id); }).then(function (r) { if (fail('registros de treino', r)) (r.data || []).forEach(function (s) { s.link_id = l.id; out.sessoes.push(s); }); return C.messages(l.id); })
              .then(function (r) { if (fail('mensagens', r)) (r.data || []).forEach(function (m) { out.mensagens.push(m); }); });
          });
          return chain;
        })
        .then(function () { return area === 'treinador' && C.loadTrainer ? C.loadTrainer().then(function (t) { out.treinador = t || null; }) : null; })
        .then(function () {
          var day = new Date().toISOString().slice(0, 10);
          save('99coach-meus-dados-' + day + '.json', JSON.stringify(out, null, 2), 'application/json');
          var rows = [['data', 'sessao', 'exercicio', 'serie', 'repeticoes', 'carga_kg']];
          out.sessoes.forEach(function (s) { (s.set_logs || []).forEach(function (l) { rows.push([String(s.submitted_at || s.started_at || '').slice(0, 10), s.session_key, l.exercise_name || l.exercise_id, l.set_no, l.reps, l.load_kg == null ? '' : String(l.load_kg).replace('.', ',')]); }); });
          if (rows.length > 1) save('99coach-meus-treinos-' + day + '.csv', '﻿' + csv(rows), 'text/csv');
          window.__meusDados = out;
          var n = out.sessoes.length, m = out.mensagens.length;
          ctx.setUi({ busy: false, done: 'Arquivo gerado às ' + U.now() + ': ' + U.plural(out.vinculos.length, 'vínculo', 'vínculos') + ', ' + U.plural(out.pedidos.length, 'pedido', 'pedidos') + ', ' + U.plural(n, 'sessão de treino', 'sessões de treino') + ' e ' + U.plural(m, 'mensagem', 'mensagens') + '.' + (rows.length > 1 ? ' Os treinos também saíram em planilha (CSV).' : ''),
            partial: out.falhas.length ? 'Não deu para incluir: ' + out.falhas.filter(function (v, i, a) { return a.indexOf(v) === i; }).join(', ') + '. O arquivo traz o resto; tente de novo para a cópia completa.' : '' });
        }, function () { ctx.setUi({ busy: false, err: 'Não foi possível gerar o arquivo agora. Nada foi apagado nem alterado.' }); });
    };
    var unpub = function () {
      if (ui.busy2) return; ctx.setUi({ busy2: true });
      C.unpublish().then(function (r) { ctx.setUi({ busy2: false, unpub: r.ok ? 'Perfil retirado da busca às ' + U.now() + '. Sua conta e seus alunos continuam.' : 'Não foi possível retirar agora: ' + (r.msg || r.status || 'sem conexão') + '.' }); });
    };
    // exclusão de conta pelo banco: pedir → confirmar (encerra vínculos, retira perfil, bloqueia a entrada) → concluir (apaga identidade)
    if (logged && !ui.delAsked0) { ctx.setUi({ delAsked0: true }); C.db('GET', 'account_deletions?select=id,status,requested_at,completed_at&order=requested_at.desc&limit=1').then(function (r) { ctx.setUi({ del: r.ok && r.data && r.data[0] ? r.data[0] : null, delLoadErr: !r.ok }); }); }
    var del = ui.del && ui.del.status !== 'cancelado' ? ui.del : null;
    var rpc = function (fn, then) { if (ui.dbusy) return; ctx.setUi({ dbusy: true, delErr: '' }); var ik = fn + ':' + (C.user() || {}).id + ':' + ((ui.del && ui.del.status) || 'novo'); C.db('POST', 'rpc/' + fn, { p_idem: C.intent(ik) }).then(C.settle(ik)).then(function (r) {
      var d = r.ok && r.data ? (Array.isArray(r.data) ? r.data[0] : r.data) : null;
      if (!r.ok) return ctx.setUi({ dbusy: false, delErr: r.offline ? 'Sem conexão: nada foi alterado.' : 'O servidor não aceitou: ' + (r.msg || r.status) + '. Nada foi apagado.' });
      ctx.setUi({ dbusy: false, del: d && d.status ? { status: d.status } : null }); if (then) then(d);
    }); };
    var delDone = function (d) { if (d && d.status === 'concluido') { ctx.toast('Conta excluída. Saindo deste aparelho.'); setTimeout(function () { GO('@sair'); }, 1200); } };
    var local = 0; try { Object.keys(window.localStorage).forEach(function (k) { if (/^c99\./.test(k)) local++; }); } catch (_) {}
    return {
      mf: window.MFA2 ? window.MFA2.manage(ctx) : { show: false },
      logged: logged, anon: !logged, login: function () { GO('@onboarding', { flow: 'entrar' }); },
      email: logged && C.user() ? C.user().email : '',
      exportLabel: ui.busy ? 'Gerando…' : 'Baixar meus dados', run: run,
      done: ui.done || '', hasDone: !!ui.done, partial: ui.partial || '', hasPartial: !!ui.partial, err: ui.err || '', hasErr: !!ui.err,
      isTrainer: area === 'treinador', unpub: unpub, unpubLabel: ui.busy2 ? 'Retirando…' : 'Retirar meu perfil da busca', unpubMsg: ui.unpub || '', hasUnpub: !!ui.unpub,
      localTxt: U.plural(local, 'item guardado', 'itens guardados') + ' neste aparelho (rascunhos, favoritos, última busca, sessão). Sair apaga todos.',
      // versão para imprimir ou salvar em PDF (pelo próprio navegador), com os mesmos dados da exportação
      canPdf: !!window.__meusDados && !ui.busy,
      pdf: function () {
        var o = window.__meusDados; if (!o) return;
        var esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
        var d = function (v) { return v ? new Date(v).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''; };
        var tb = function (head, rows) { return rows.length ? '<table><thead><tr>' + head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>' : '<p class="n">Nenhum registro.</p>'; };
        var treinos = []; (o.sessoes || []).forEach(function (s0) { (s0.set_logs || []).forEach(function (l) { treinos.push([d(s0.submitted_at || s0.started_at), l.exercise_name || l.exercise_id, l.set_no, l.reps, l.load_kg == null ? '' : String(l.load_kg).replace('.', ',') + ' kg']); }); });
        var html = '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Meus dados no 99coach</title><style>body{font:14px/1.5 system-ui,sans-serif;color:#121214;margin:32px}h1{font-size:22px;margin:0 0 4px}h2{font-size:16px;margin:28px 0 8px}p{margin:0 0 6px}.n{color:#666}table{width:100%;border-collapse:collapse;font-size:12px}th,td{text-align:left;padding:6px 8px;border-bottom:1px solid #ddd;vertical-align:top}th{font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#555}@media print{body{margin:12mm}h2{break-after:avoid}tr{break-inside:avoid}}</style></head><body>'
          + '<h1>Meus dados no 99coach</h1><p class="n">Gerado em ' + esc(d(o.geradoEm)) + ' pela própria conta' + (C.user() ? ' (' + esc(C.user().email) + ')' : '') + '.</p>'
          + '<h2>Conta</h2>' + (o.conta ? tb(['Campo', 'Valor'], Object.keys(o.conta).filter(function (k) { return o.conta[k] != null && typeof o.conta[k] !== 'object'; }).map(function (k) { return [k, o.conta[k]]; })) : '<p class="n">Não carregou.</p>')
          + '<h2>Acompanhamentos</h2>' + tb(['Treinador', 'Aluno', 'Situação', 'Desde'], (o.vinculos || []).map(function (l) { return [l.trainerName || '', l.studentName || '', l.status, d(l.since)]; }))
          + '<h2>Pedidos</h2>' + tb(['Treinador', 'Aluno', 'Situação', 'Enviado em'], (o.pedidos || []).map(function (r) { return [r.trainerName || '', r.studentName || '', r.status, d(r.at)]; }))
          + '<h2>Horários</h2>' + tb(['Início', 'Situação', 'Marcado por'], (o.horarios || []).map(function (a) { return [d(a.starts_at), a.status, a.booked_by]; }))
          + '<h2>Treinos registrados</h2>' + tb(['Data', 'Exercício', 'Série', 'Repetições', 'Carga'], treinos)
          + '<h2>Mensagens</h2>' + tb(['Data', 'Lado', 'Texto'], (o.mensagens || []).map(function (m) { return [d(m.created_at), m.side, m.body]; }))
          + ((o.falhas || []).length ? '<h2>Não carregou</h2><p>' + esc(o.falhas.join(', ')) + '</p>' : '') + '</body></html>';
        var w = window.open('', '_blank');
        if (!w) return ctx.toast('O navegador bloqueou a nova janela. Permita janelas para este site e tente de novo.');
        w.document.open(); w.document.write(html); w.document.close(); w.focus();
        setTimeout(function () { try { w.print(); } catch (_) {} }, 400);
      },
      signOut: function () { GO('@sair'); },
      devices: (function () {
        if (logged && ui.dev === undefined && !ui.devAsked) { ctx.setUi({ devAsked: true }); C.rpc('my_sessions', {}).then(function (r) { var d = r.ok ? r.data : null; ctx.setUi({ dev: Array.isArray(d) ? d : null }); }); }
        var kind = function (ua) { ua = String(ua || ''); var os = /iPhone|iPad/.test(ua) ? 'iPhone ou iPad' : /Android/.test(ua) ? 'Android' : /Mac OS X/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : 'Aparelho';
          var br = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'navegador'; return os + ' · ' + br; };
        var f = function (d) { return d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''; };
        return (ui.dev || []).map(function (x) { return { t: kind(x.agent) + (x.current ? ' · este aparelho' : ''), x: 'Entrou em ' + f(x.since) + (x.seen ? ' · último uso ' + f(x.seen) : '') }; });
      })(),
      hasDevices: !!(ui.dev && ui.dev.length), devFail: ui.dev === null,
      others: function () { if (ui.obusy) return; ctx.setUi({ obusy: true }); C.signOutOthers().then(function (r) { ctx.setUi({ obusy: false, devAsked: false, dev: undefined, othersMsg: r.ok ? 'Pronto: a conta saiu de todos os outros aparelhos às ' + U.now() + '. Este continua conectado.' : 'Não foi possível agora: ' + (r.msg || r.status || 'sem conexão') + '.' }); }); },
      othersLabel: ui.obusy ? 'Saindo…' : 'Sair dos outros aparelhos', othersMsg: ui.othersMsg || '', hasOthersMsg: !!ui.othersMsg,
      delNone: !del, delAsked: !!del && del.status === 'pedido', delRunning: !!del && del.status === 'em_processamento',
      delTxt: !del ? 'Apaga sua conta e seus dados pessoais; nada é apagado até você confirmar. Baixe seus dados antes.' : (del.status === 'em_processamento' ? 'Exclusão em andamento: acompanhamentos encerrados, perfil fora da busca e entrada bloqueada. Conclua para apagar os dados pessoais.' : 'Você pediu a exclusão. Confirme para começar ou desista.'),
      delAsk: function () { rpc('request_account_deletion'); }, delCancel: function () { rpc('cancel_account_deletion'); },
      delGo: function () { rpc('advance_account_deletion', delDone); }, delGoLabel: ui.dbusy ? 'Processando…' : (del && del.status === 'em_processamento' ? 'Concluir a exclusão' : 'Confirmar e começar a exclusão'),
      delErr: ui.delErr || '', hasDelErr: !!ui.delErr,
      back: function () { GO(area === 'treinador' ? 'TMENU' : 'AMENU'); }
    };
  }
});
