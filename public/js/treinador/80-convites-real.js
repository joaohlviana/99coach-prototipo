/* REL02R · Convites com dados do servidor: estado real (aguardando, aceito, vencido, revogado), link real,
   revogar no servidor (o link deixa de valer) e reemitir (link novo; o anterior é revogado). Copiar não é enviar. */
REG.screen({
  page: 'treinador', key: 'convitesreal', id: 'REL02R', title: 'Convites', nav: 'alunos', back: 'H04',
  vals: function (ctx) {
    var C = window.CONTA, ui = ctx.ui;
    var load = function () { ctx.setUi({ loading: true }); C.myInvites().then(function (r) { ctx.setUi({ loading: false, list: r.ok ? (r.data || []) : (ui.list || null), err: r.ok ? '' : (r.offline ? 'Sem conexão: não foi possível carregar os convites.' : 'Não foi possível carregar os convites agora.') }); }); };
    if (!ui.list && !ui.loading && !ui.err) setTimeout(load, 0);
    var now = Date.now();
    var stOf = function (c) {
      if (c.status === 'aceito' || c.accepted_at) return ['aceito', 'Aceito em ' + new Date(c.accepted_at || c.created_at).toLocaleDateString('pt-BR'), 'badge badge--ok'];
      if (c.status === 'revogado') return ['revogado', 'Revogado', 'badge badge--plain'];
      if (c.status === 'vencido' || (c.expires_at && new Date(c.expires_at).getTime() < now)) return ['vencido', 'Vencido em ' + new Date(c.expires_at).toLocaleDateString('pt-BR'), 'badge badge--risk'];
      return ['aberto', 'Aguardando aceite · vale até ' + new Date(c.expires_at).toLocaleDateString('pt-BR'), 'badge badge--warn'];
    };
    var filter = ui.f || 'aberto';
    var all = (ui.list || []).map(function (c) { return { c: c, st: stOf(c) }; });
    var counts = { aberto: 0, aceito: 0, encerrado: 0 }; all.forEach(function (x) { counts[x.st[0] === 'aberto' ? 'aberto' : (x.st[0] === 'aceito' ? 'aceito' : 'encerrado')]++; });
    var shown = all.filter(function (x) { return filter === 'todos' || (filter === 'aberto' ? x.st[0] === 'aberto' : filter === 'aceito' ? x.st[0] === 'aceito' : (x.st[0] === 'vencido' || x.st[0] === 'revogado')); });
    var revoke = function (c, then) { return C.revokeInvite(c.code).then(function (r) { if (!r.ok) { ctx.toast('Não foi possível revogar: ' + (r.msg || r.status || 'sem conexão') + '. O link continua valendo.'); return false; } return true; }); };
    return {
      loading: !!ui.loading && !ui.list, err: ui.err || '', hasErr: !!ui.err, reload: function () { ctx.setUi({ list: null, err: '' }); },
      tabs: [['aberto', 'Aguardando (' + counts.aberto + ')'], ['aceito', 'Aceitos (' + counts.aceito + ')'], ['encerrado', 'Vencidos e revogados (' + counts.encerrado + ')']].map(function (t) { var on = filter === t[0]; return { label: t[1], on: String(on), cls: 'chip' + (on ? ' is-on' : ''), pick: function () { ctx.setUi({ f: t[0] }); } }; }),
      none: !!ui.list && !shown.length, noneTxt: filter === 'aberto' ? 'Nenhum convite aguardando aceite.' : (filter === 'aceito' ? 'Nenhum convite aceito ainda.' : 'Nenhum convite vencido ou revogado.'),
      items: shown.map(function (x) {
        var c = x.c, open = x.st[0] === 'aberto';
        return { name: c.recipient_name || 'Sem nome', sub: (c.service || 'Sem serviço definido') + ' · criado em ' + new Date(c.created_at).toLocaleDateString('pt-BR') + ' · código ' + c.code, st: x.st[1], stCls: x.st[2],
          isOpen: open, canReissue: x.st[0] === 'vencido' || x.st[0] === 'revogado' || open,
          copy: function () { var link = C.inviteLink(c.code); try { navigator.clipboard.writeText(link).catch(function () {}); } catch (_) {} ctx.toast('Link copiado. Copiar não é enviar: cole na conversa com ' + String(c.recipient_name || 'o aluno').split(' ')[0] + '.'); },
          revoke: function () { ctx.ask({ title: 'Revogar este convite?', lines: ['O link deixa de valer na hora. Quem ainda não aceitou não consegue mais aceitar.'], ok: 'Revogar convite', onOk: function () { revoke(c).then(function (ok) { if (ok) { ctx.toast('Convite revogado às ' + U.now() + '.'); ctx.setUi({ list: null }); } }); } }); },
          reissue: function () { ctx.ask({ title: 'Reemitir o convite?', lines: ['Cria um link novo, válido por 7 dias.', open ? 'O link atual é revogado.' : 'O link antigo continua sem valer.'], ok: 'Reemitir', onOk: function () {
            (open ? revoke(c) : Promise.resolve(true)).then(function (ok) { if (!ok) return; return C.createInvite({ name: c.recipient_name, email: c.recipient_email || null, service: c.service || null }).then(function (r) {
              if (!r.ok) return ctx.toast('Não foi possível reemitir: ' + (r.msg || r.status || 'sem conexão') + '.');
              try { navigator.clipboard.writeText(C.inviteLink(r.code)).catch(function () {}); } catch (_) {}
              ctx.toast('Convite reemitido: código ' + r.code + ' (link copiado).'); ctx.setUi({ list: null, f: 'aberto' }); }); });
          } }); } };
      }),
      invite: function () { GO('REL01'); }
    };
  }
});
