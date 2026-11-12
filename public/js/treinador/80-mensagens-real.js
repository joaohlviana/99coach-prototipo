/* TRE25R · Caixa de conversas do treinador (dados reais): uma conversa por acompanhamento, com a última mensagem,
   quantas não lidas e a conversa aberta ao lado. Atualiza sozinha enquanto a tela está aberta. */
REG.screen({
  page: 'treinador', key: 'mensagensreal', id: 'TRE25R', title: 'Mensagens', nav: 'mensagens', wide: true,
  vals: function (ctx) {
    var C = window.CONTA, ui = ctx.ui;
    var L = (C ? C.cachedLinks() : []).filter(function (l) { return l.mine === 'treinador'; });
    var load = function () {
      if (!L.length) return ctx.setUi({ inbox: [], loaded: true });
      C.db('GET', 'messages?select=link_id,side,body,created_at,read_at&link_id=in.(' + L.map(function (l) { return l.id; }).join(',') + ')&order=created_at.desc&limit=1000').then(function (r) {
        ctx.setUi({ loaded: true, inbox: r.ok ? (r.data || []) : (ui.inbox || []), inErr: r.ok ? '' : 'Não foi possível atualizar as conversas agora.', at: U.now() });
      });
    };
    if (!ui.loaded && !ui.loading) { ctx.setUi({ loading: true }); load(); }
    // atualização automática a cada 15 s enquanto esta tela estiver aberta
    clearTimeout(window.__inboxT); window.__inboxT = setTimeout(function () { if (document.querySelector('[data-inbox]')) load(); }, 15000);
    var M = ui.inbox || [], last = {}, unread = {};
    M.forEach(function (m) { if (!last[m.link_id]) last[m.link_id] = m; if (m.side === 'aluno' && !m.read_at) unread[m.link_id] = (unread[m.link_id] || 0) + 1; });
    var rows = L.map(function (l) { var m = last[l.id]; return { l: l, m: m, n: unread[l.id] || 0, t: m ? m.created_at : l.since }; })
      .sort(function (a, b) { return (b.n > 0) - (a.n > 0) || String(b.t).localeCompare(String(a.t)); });
    var sel = ui.sel || (rows[0] && rows[0].l.id) || '';
    var cur = L.filter(function (l) { return l.id === sel; })[0];
    var fmt = function (d) { return d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''; };
    // estado de cada conversa fica fora do estado da tela (respostas que chegam depois não apagam o que já mudou)
    var CH = window.__inboxChats = window.__inboxChats || {}; CH[sel] = CH[sel] || {};
    var chatCtx = { ui: CH[sel], setUi: function (o) { Object.assign(CH[sel], o); ctx.setUi({ chatTick: Date.now() }); if (o.msgs) setTimeout(load, 300); }, ask: ctx.ask, toast: ctx.toast };
    return {
      empty: !L.length, hasList: L.length > 0, loading: !ui.loaded, err: ui.inErr || '', hasErr: !!ui.inErr, at: ui.at || '',
      totalUnread: Object.keys(unread).reduce(function (n, k) { return n + unread[k]; }, 0),
      rows: rows.map(function (x) { var on = x.l.id === sel; return { name: x.l.studentName, sub: x.m ? (x.m.side === 'treinador' ? 'Você: ' : '') + String(x.m.body).slice(0, 70) : 'Nenhuma mensagem ainda', when: x.m ? fmt(x.m.created_at) : '', n: String(x.n), hasN: x.n > 0, cls: 'onb-secs__r' + (on ? ' is-on' : ''), cur: String(on), pick: function () { ctx.setUi({ sel: x.l.id }); } }; }),
      curName: cur ? cur.studentName : '', hasCur: !!cur, chat: cur && window.CHAT ? window.CHAT(chatCtx, cur.id, 'treinador', String(cur.studentName).split(' ')[0]) : {},
      openStudent: function () { if (cur) GO('H05', { id: 'lk_' + cur.id }); }, invite: function () { GO('REL01'); }
    };
  }
});
