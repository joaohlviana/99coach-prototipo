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
    var csv = function (rows) { return rows.map(function (r) { return r.map(function (v) { v = v == null ? '' : String(v); return /[",;\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(';'); }).join('\r\n'); };
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
          var n = out.sessoes.length, m = out.mensagens.length;
          ctx.setUi({ busy: false, done: 'Arquivo gerado às ' + U.now() + ': ' + U.plural(out.vinculos.length, 'vínculo', 'vínculos') + ', ' + U.plural(out.pedidos.length, 'pedido', 'pedidos') + ', ' + U.plural(n, 'sessão de treino', 'sessões de treino') + ' e ' + U.plural(m, 'mensagem', 'mensagens') + '.' + (rows.length > 1 ? ' Os treinos também saíram em planilha (CSV).' : ''),
            partial: out.falhas.length ? 'Não deu para incluir: ' + out.falhas.filter(function (v, i, a) { return a.indexOf(v) === i; }).join(', ') + '. O arquivo traz o resto; tente de novo para a cópia completa.' : '' });
        }, function () { ctx.setUi({ busy: false, err: 'Não foi possível gerar o arquivo agora. Nada foi apagado nem alterado.' }); });
    };
    var unpub = function () {
      if (ui.busy2) return; ctx.setUi({ busy2: true });
      C.unpublish().then(function (r) { ctx.setUi({ busy2: false, unpub: r.ok ? 'Perfil retirado da busca às ' + U.now() + '. Sua conta e seus alunos continuam.' : 'Não foi possível retirar agora: ' + (r.msg || r.status || 'sem conexão') + '.' }); });
    };
    var local = 0; try { Object.keys(window.localStorage).forEach(function (k) { if (/^c99\./.test(k)) local++; }); } catch (_) {}
    return {
      logged: logged, anon: !logged, login: function () { GO('@onboarding', { flow: 'entrar' }); },
      email: logged && C.user() ? C.user().email : '',
      exportLabel: ui.busy ? 'Gerando…' : 'Baixar meus dados', run: run,
      done: ui.done || '', hasDone: !!ui.done, partial: ui.partial || '', hasPartial: !!ui.partial, err: ui.err || '', hasErr: !!ui.err,
      isTrainer: area === 'treinador', unpub: unpub, unpubLabel: ui.busy2 ? 'Retirando…' : 'Retirar meu perfil da busca', unpubMsg: ui.unpub || '', hasUnpub: !!ui.unpub,
      localTxt: U.plural(local, 'item guardado', 'itens guardados') + ' neste aparelho (rascunhos, favoritos, última busca, sessão). Sair apaga todos.',
      signOut: function () { GO('@sair'); },
      back: function () { GO(area === 'treinador' ? 'TMENU' : 'AMENU'); }
    };
  }
});
