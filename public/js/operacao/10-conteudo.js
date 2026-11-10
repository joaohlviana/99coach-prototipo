/* O1 · OPS04 (moderação de avaliações e conteúdo) e subtelas OPS04.A–OPS04.E.
   Denúncia não apaga sozinha; ninguém altera a nota de outra pessoa. */
(function () {
  var O = function () { return window.O1; };
  var X = function () { return window.O1X; };
  var EF = { 'restringida': ['Restringida', 'badge badge--warn'], 'retirada': ['Retirada', 'badge badge--ink'], 'mantida': ['Mantida', 'badge badge--ok'], 'visível': ['Visível', 'badge badge--plain'] };
  var stars = function (n) { var s = ''; for (var i = 0; i < 5; i++) s += i < n ? '★' : '☆'; return s; };
  var pickRev = function (ctx) { var O1 = O(), c = O1.caso(ctx.id); return c && c.rev ? c : O1.caso('c298'); };
  var pubText = function (c) { var e = c.rev.efeito; return e === 'retirada' ? 'Avaliação retirada pela moderação.' : (e === 'restringida' ? c.rev.publico : c.rev.texto); };

  // ---------- OPS04 · Moderação de avaliações e conteúdo ----------
  REG.screen({
    page: 'operacao', key: 'ops04', id: 'OPS04', title: 'Avaliação denunciada', mtitle: 'Avaliação', nav: 'casos', back: 'OPS04.A', wide: true,
    testIds: ['c312', 'c314'],
    scens: [['retirada', 'Retirada'], ['contestada', 'Contestada'], ['mantida', 'Mantida']],
    vals: function (ctx) {
      var O1 = O(), scn = ctx.scn, ui = ctx.ui, c = pickRev(ctx), r = c.rev;
      var ef = scn === 'retirada' ? 'retirada' : (scn === 'mantida' ? 'mantida' : r.efeito);
      var alerts = [];
      if (scn === 'retirada') alerts.push(O1.alert('info', 'Retirada', 'A avaliação saiu da página e da média. O histórico fica só para a operação.', ui.why ? '' : 'Saiba por quê', function () { ctx.setUi({ why: true }); }));
      if (scn === 'retirada' && ui.why) alerts.push(O1.alert('info', 'Motivo registrado', r.motivo === 'ofensa' ? 'Linguagem ofensiva contra a pessoa, não contra o serviço · ' + c.regra + '.' : c.regra + '.'));
      if (scn === 'contestada') alerts.push(O1.alert('warn', 'Contestada · volta à fila', 'O autor contestou a decisão. O caso volta para reavaliação por quem não decidiu antes, se houver.', 'Consultar de novo', function () { ctx.toast('Consulta às ' + O1.tick() + ' · recurso ainda em reavaliação'); }));
      if (scn === 'mantida') alerts.push(O1.alert('ok', 'Mantida', 'Motivo enviado às partes. A nota e o texto seguem como o autor escreveu.'));
      if (scn === '' && c.estado === 'Recurso') alerts.push(O1.alert('warn', 'Recurso aberto', r.autor + ' recorreu: “' + r.recurso + '”.', 'Ver recurso', function () { ctx.go('OPS04.C', { id: c.id }); }));
      return {
        h1: c.titulo + ' ' + c.proto, sub: c.obj + ' sobre ' + r.sobre,
        bar: O1.bar('conteudo.ler', c.alvo), alerts: alerts,
        texto: '“' + (ef === 'retirada' ? r.texto : (ef === 'restringida' ? r.publico : r.texto)) + '”', hasNota: r.nota > 0, stars: stars(r.nota), notaTxt: r.nota + ' de 5',
        efLabel: (EF[ef] || EF['visível'])[0], efCls: (EF[ef] || EF['visível'])[1],
        kv: [{ k: 'Denúncia', v: r.denuncia + ' · ' + r.motivo + ' · ' + U.plural(r.n, 'denúncia', 'denúncias') }, { k: 'Elegibilidade', v: r.elegOk ? 'Contratou sim · ' + r.eleg.replace('contratou ', '') : r.eleg }, { k: 'Autoria', v: r.autor + ' · só o autor edita o texto' }, { k: 'Regra', v: c.regra }, { k: 'Estado', v: c.estado }],
        manter: function () { ctx.go('OPS04.B', { id: c.id, k: 'manter' }); }, review: function () { ctx.go('OPS04.B', { id: c.id }); }, appeal: function () { ctx.go('OPS04.C', { id: c.id }); },
        hasAppeal: c.estado === 'Recurso' || !!r.recurso,
        hist: O1.histView(c, ctx.go)
      };
    }
  });

  // ---------- OPS04.A · Fila de conteúdo ----------
  REG.screen({
    page: 'operacao', key: 'ops04a', id: 'OPS04.A', title: 'Fila de conteúdo', mtitle: 'Conteúdo', nav: 'casos', back: 'H12', wide: true,
    scens: [['duplicada', 'Denúncia duplicada'], ['retirado', 'Objeto retirado'], ['semevid', 'Sem evidência'], ['fora', 'Consulta indisponível']],
    vals: function (ctx) {
      var O1 = O(), scn = ctx.scn, ui = ctx.ui, f = ui.f || '';
      var all = DB.o1_casos.filter(function (c) { return c.dom === 'conteudo' && c.rev && O1.isOpen(c); });
      var list = scn === 'fora' && !ui.retried ? [] : all.filter(function (c) { return !f || (f === 'aval' ? c.tipo === 'Avaliação' : c.tipo !== 'Avaliação'); });
      var rows = list.map(function (c) {
        var n = c.rev.n + (scn === 'duplicada' && c.id === 'c298' ? 1 : 0);
        var obj = (c.tipo === 'Avaliação' ? 'Avaliação de ' : 'Bio de ') + c.rev.autor;
        var ret = scn === 'retirado' && c.id === 'c312';
        var noEv = scn === 'semevid' && c.id === 'c314';
        return { obj: obj, tipo: c.tipo === 'Avaliação' ? 'avaliação' : 'texto de perfil', motivo: c.rev.motivo, den: n + (n > 1 ? ' · agrupadas' : ''), eleg: noEv ? 'sem evidência' : (c.rev.elegOk ? (c.tipo === 'Avaliação' ? 'contratou' : '—') : 'a conferir'), resp: O1.respName(c.resp),
          est: ret ? 'objeto retirado pela autora' : c.estado, estCls: ret ? 'badge badge--ink' : O1.estadoCls(c.estado),
          open: function () { ctx.go(c.estado === 'Recurso' ? 'OPS04.C' : 'OPS04.B', { id: c.id }); } };
      });
      var den = all.reduce(function (a, c) { return a + c.rev.n; }, 0) + (scn === 'duplicada' ? 1 : 0);
      var free = list.filter(function (c) { return !c.resp; });
      var alerts = [];
      if (scn === 'duplicada') alerts.push(O1.alert('info', 'Denúncia duplicada agrupada', 'Nova denúncia sobre a avaliação de Pedro S. às 14:00 entrou no mesmo objeto (agora 4). Nada foi apagado.'));
      if (scn === 'retirado') alerts.push(O1.alert('info', 'Objeto retirado', 'Renata S. apagou a bio às 13:30. A denúncia fica registrada; não há efeito a aplicar.', 'Encerrar sem ação', function () { ctx.go('OPS02', { id: 'c312' }); }));
      if (scn === 'semevid') alerts.push(O1.alert('warn', 'Ausência de evidência', 'A denúncia da avaliação de Júlia M. não traz evidência. Confira a contratação antes de restringir.'));
      if (scn === 'fora' && !ui.retried) alerts.push(O1.alert('risk', 'Consulta indisponível', 'A fila de conteúdo não carregou (erro às 14:02). Nada foi alterado.', 'Tentar de novo', function () { ctx.setUi({ retried: true }); }));
      var chip = function (k, l) { var on = f === k; return { label: l, cls: 'chip o1-chip' + (on ? ' is-on' : ''), on: String(on), go: function () { ctx.setUi({ f: k }); } }; };
      return {
        sub: U.plural(den, 'denúncia', 'denúncias') + ' · ' + U.plural(all.length, 'objeto', 'objetos'), bar: O1.bar('conteudo.ler', 'Avaliações e textos públicos'), alerts: alerts,
        chips: [chip('', 'Todos'), chip('aval', 'Avaliações'), chip('texto', 'Textos de perfil')],
        rows: rows, hasRows: rows.length > 0, noRows: rows.length === 0,
        assignCls: 'btn btn--primary btn--sm' + (free.length ? '' : ' o1-off'), assignDis: String(!free.length),
        assign: function () {
          if (!free.length) { ctx.toast('Nenhum objeto sem responsável'); return; }
          ctx.ask({ title: 'Atribuir ' + U.plural(free.length, 'objeto', 'objetos') + ' a você?', text: 'As denúncias continuam agrupadas por objeto.', lines: free.map(function (c) { return c.proto + ' · ' + c.head; }), ok: 'Atribuir', onOk: function () {
            free.forEach(function (c) { c.resp = 'lia'; if (c.estado === 'Novo') c.estado = 'Em análise'; O1.receipt(c, 'Atribuído a você', 'Fila de conteúdo · conteudo.decidir', [['Responsável gravado', 'ok']]); });
            ctx.toast(U.plural(free.length, 'objeto atribuído', 'objetos atribuídos') + ' a você');
          } });
        }
      };
    }
  });

  // ---------- OPS04.B · Revisão e efeito ----------
  REG.screen({
    page: 'operacao', key: 'ops04b', id: 'OPS04.B', title: 'Revisão e efeito', mtitle: 'Revisão', nav: 'casos', back: 'OPS04.A', wide: true,
    testIds: ['c312', 'c314'],
    scens: [['semperm', 'Falta de permissão'], ['contexto', 'Contexto insuficiente'], ['versao', 'Versão alterada'], ['parcial', 'Efeito parcial']],
    vals: function (ctx) {
      var O1 = O(), scn = ctx.scn, ui = ctx.ui, c = pickRev(ctx), r = c.rev;
      var k = ui.k || ctx.p.k || 'restringir', d = c.decs.filter(function (x) { return x.k === k; })[0] || c.decs[0];
      var why = ui.why != null ? ui.why : '';
      var closed = !!X().DECIDED[c.estado] && !!c.decisao;
      var stop = '';
      var alerts = [];
      if (c.estado === 'Recurso') alerts.push(O1.alert('info', 'Reavaliação por recurso', 'Decisão vigente: ' + (EF[r.efeito] || EF['visível'])[0].toLowerCase() + ' (R-298). Decidir aqui também responde ao recurso.', 'Ver recurso', function () { ctx.go('OPS04.C', { id: c.id }); }));
      if (scn === 'semperm') { stop = 'Sua capacidade conteudo.decidir foi suspensa. Encaminhe.'; alerts.push(O1.alert('risk', 'Falta de permissão', 'Sua capacidade conteudo.decidir foi suspensa às 14:03. Você pode ler, não decidir.', 'Encaminhar', function () { ctx.go('OPS01.C', { id: c.id }); })); }
      if (scn === 'contexto' && !ui.asked) alerts.push(O1.alert('warn', 'Contexto insuficiente', 'A denúncia cita uma conversa privada. Você vê só o trecho autorizado; peça o contexto mínimo antes de retirar.', 'Pedir contexto', function () { O1.receipt(c, 'Contexto pedido', 'trecho da conversa citada na denúncia', [['Pedido registrado', 'ok'], ['Aviso ao denunciante', 'and']]); ctx.setUi({ asked: true }); ctx.toast('Pedido de contexto registrado'); }));
      if (scn === 'versao' && !ui.seen) { stop = 'O texto mudou: veja a versão nova antes de decidir.'; alerts.push(O1.alert('warn', 'Versão alterada', r.autor + ' editou o texto às 14:01 (v2). A decisão vale para a versão que você leu.', 'Ver versão nova', function () { ctx.setUi({ seen: true }); })); }
      if (scn === 'parcial' && !ui.retried) alerts.push(O1.alert('risk', 'Efeito parcial', 'Aplicou: termo ocultado e nota mantida. Não aplicou: aviso ao autor (falhou 14:04).', 'Tentar de novo', function () { ctx.setUi({ retried: true }); ctx.toast('Só o aviso foi reenviado · confirmado às ' + O1.tick()); }));
      var texto = scn === 'versao' && ui.seen ? r.texto.replace('E o cara é um [termo ofensivo].', 'Editado: faltou atenção do treinador.') : r.texto;
      var confirm = function () {
        if (closed) { ctx.setUi({ err: 'Já decidido em ' + c.decisao.ref + '.' }); return; }
        if (stop) { ctx.setUi({ err: stop }); return; }
        if (!O1.canDecide(c)) { ctx.setUi({ err: X().blockedWhy(c) }); return; }
        if (!String(why).trim()) { ctx.setUi({ err: 'Escreva o motivo. As partes recebem o motivo; a nota não muda.' }); return; }
        ctx.ask({ title: 'Confirmar: ' + d.short.toLowerCase() + '?', text: d.muda, lines: X().impact(c, d).map(function (x) { return x.k + ': ' + x.v; }).concat(['Motivo: ' + why]), ok: 'Confirmar ' + d.short.toLowerCase(), onOk: function () { var rec = O1.apply(c, d, String(why).trim(), ''); ctx.go('OPS02.D', { id: rec.id }); } });
      };
      return {
        sub: c.obj.replace(/^Avaliação #AV-\d+ · /, 'Avaliação de ') + ' sobre ' + r.sobre, bar: O1.bar('conteudo.decidir', c.alvo), alerts: alerts,
        texto: '“' + texto + '”', hasNota: r.nota > 0, stars: stars(r.nota), notaTxt: r.nota + ' de 5',
        kv: [{ k: 'Regra', v: c.regra }, { k: 'Elegibilidade', v: r.eleg }, { k: 'Autoria', v: r.autor + ' · pode editar' }, { k: 'Denúncias', v: U.plural(r.n, 'denúncia', 'denúncias') + ' · ' + r.motivo }],
        opts: c.decs.map(function (x) { var on = x.k === d.k; return { label: x.short, cls: 'seg__it' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ k: x.k, err: '' }); } }; }),
        prevTitle: 'Prévia do efeito · ' + d.short.toLowerCase(), prev: d.muda,
        why: why, setWhy: function (e) { ctx.setUi({ why: U.val(e), err: '' }); }, err: ui.err || '', hasErr: !!ui.err,
        confirm: confirm, okLabel: 'Confirmar ' + d.short.toLowerCase(), closed: closed, open: !closed, decTxt: closed ? c.decisao.label + ' · ' + c.decisao.ref : '', openDec: function () { if (c.decisao) ctx.go('OPS02.D', { id: c.decisao.ref }); }
      };
    }
  });

  // ---------- OPS04.C · Recurso e histórico ----------
  REG.screen({
    page: 'operacao', key: 'ops04c', id: 'OPS04.C', title: 'Recurso e histórico', mtitle: 'Recurso', nav: 'casos', back: 'OPS04', backParams: function (ctx) { return { id: ctx.id || 'c298' }; }, wide: true,
    testIds: ['c314'],
    normal: 'Em reavaliação',
    scens: [['pendente', 'Recurso pendente'], ['prazo', 'Prazo não definido'], ['reversao', 'Reversão parcial'], ['desconhecido', 'Resultado desconhecido']],
    vals: function (ctx) {
      var O1 = O(), scn = ctx.scn, ui = ctx.ui, c = pickRev(ctx), r = c.rev;
      var open = c.estado === 'Recurso';
      var resp = ui.resp != null ? ui.resp : 'Revisamos seu recurso. O termo continua oculto; sua nota e o restante do texto seguem visíveis.';
      var why = ui.why != null ? ui.why : '';
      var alerts = [];
      if (!open) alerts.push(O1.alert('info', 'Sem recurso aberto', 'Este objeto não tem recurso pendente. O histórico abaixo mostra cada decisão com recibo.'));
      if (scn === 'pendente') alerts.push(O1.alert('info', 'Recurso pendente', 'Recebido em 25/10 e ainda sem responsável de reavaliação. Assuma ou encaminhe.', 'Encaminhar', function () { ctx.go('OPS01.C', { id: c.id }); }));
      if (scn === 'prazo' && !ui.prazo) alerts.push(O1.alert('warn', 'Prazo não definido', 'A política não fixa prazo para recurso de avaliação. Registre um prazo para o caso não ficar parado.', 'Registrar 30/10', function () { c.prazo = '30/10'; c.ord = 4 * 1440; O1.hist(c, 'Prazo registrado', '30/10 · recurso de avaliação', ''); ctx.setUi({ prazo: true }); ctx.toast('Prazo 30/10 registrado no histórico'); }));
      if (scn === 'reversao' && !ui.retried) alerts.push(O1.alert('risk', 'Reversão parcial', 'Aplicou: texto completo publicado. Não aplicou: média recalculada (falhou 14:05).', 'Tentar de novo', function () { ctx.setUi({ retried: true }); ctx.toast('Só o recálculo da média foi reexecutado · confirmado'); }));
      var unk = O1.recibo('R-298');
      var unkPending = unk && O1.recState(unk).key === 'desc';
      if ((scn === 'desconhecido' || scn === '') && unkPending && c.id === 'c298') alerts.push(O1.alert('warn', 'Resultado desconhecido · R-298', 'O aviso a Pedro S. da restrição de 24/10 não confirmou. Consulte a mesma referência antes de reenviar.', 'Consultar R-298', function () { O1.consult(unk); ctx.toast('R-298 consultado: aviso entregue · nada foi reenviado'); }));
      var decide = function (k) {
        if (!open) { ctx.setUi({ err: 'Não há recurso aberto.' }); return; }
        if (!String(why).trim()) { ctx.setUi({ err: 'Escreva o motivo interno da reavaliação. Ele fica só com a operação.' }); return; }
        if (!String(resp).trim()) { ctx.setUi({ err: 'Escreva o texto ao interessado.' }); return; }
        var base = c.decs.filter(function (x) { return x.k === (k === 'reverter' ? 'manter' : 'restringir'); })[0];
        var d = Object.assign({}, base, { rec: k === 'reverter' ? 'Recurso aceito · restrição revertida' : 'Recurso indeferido · restrição mantida', steps: base.steps.map(function (s) { return s[0].indexOf('Aviso') === 0 || s[0].indexOf('Motivo') === 0 ? ['Resposta enviada a ' + r.autor, 'and'] : s; }) });
        ctx.ask({ title: k === 'reverter' ? 'Reverter a restrição?' : 'Manter a decisão?', text: 'O interessado recebe só o texto abaixo. A evidência interna não é enviada.', lines: ['Efeito: ' + d.muda, 'Texto ao interessado: ' + resp, 'Motivo interno: ' + why], ok: k === 'reverter' ? 'Reverter' : 'Manter decisão', onOk: function () { var rec = O1.apply(c, d, String(why).trim() + ' · resposta: ' + String(resp).trim(), ''); ctx.go('OPS02.D', { id: rec.id }); } });
      };
      return {
        sub: c.alvo + ' · recurso de ' + r.autor, bar: O1.bar('conteudo.recurso', c.alvo), alerts: alerts,
        hist: O1.histView(c, ctx.go), open: open,
        resp: resp, setResp: function (e) { ctx.setUi({ resp: U.val(e), err: '' }); }, why: why, setWhy: function (e) { ctx.setUi({ why: U.val(e), err: '' }); },
        err: ui.err || '', hasErr: !!ui.err, keep: function () { decide('manter'); }, revert: function () { decide('reverter'); }
      };
    }
  });

  // ---------- OPS04.D · Páginas, FAQ, políticas e textos PT/EN/ES ----------
  var LN = { pt: 'PT', en: 'EN', es: 'ES' };
  REG.screen({
    page: 'operacao', key: 'ops04d', id: 'OPS04.D', title: 'Páginas, FAQ e políticas', mtitle: 'FAQ e políticas', nav: 'casos', back: 'OPS04', wide: true,
    scens: [['traducao', 'Tradução ausente'], ['fallback', 'Fallback identificado'], ['obsoleta', 'Versão obsoleta'], ['link', 'Link quebrado']],
    vals: function (ctx) {
      var O1 = O(), F = DB.o1_faq, scn = ctx.scn, ui = ctx.ui;
      var l = ui.l || (scn === 'traducao' || scn === 'fallback' ? 'en' : (scn === 'obsoleta' ? 'es' : 'pt'));
      var L = F.langs[l];
      var q = ui.q != null ? ui.q : L.q, a = ui.a != null ? ui.a : L.a;
      var dirty = q !== L.q || a !== L.a;
      var tabs = Object.keys(LN).map(function (k) { var on = k === l, st = F.langs[k].st; return { label: LN[k] + ' · ' + st, short: LN[k], cls: 'seg__it' + (on ? ' is-on' : ''), on: String(on), go: function () { ctx.setUi({ l: k, q: null, a: null, err: '' }); } }; });
      var alerts = [];
      if (/\[aguarda política aprovada\]/.test(F.langs.pt.a)) alerts.push(O1.alert('warn', 'Texto financeiro sem política aprovada', 'Preço e franquia vêm de FA07 quando aprovados. Até lá, o campo fica bloqueado. A FAQ não muda contrato nem taxa.'));
      if (l === 'en' && !F.langs.en.a) alerts.push(O1.alert(scn === 'fallback' ? 'info' : 'warn', scn === 'fallback' ? 'Fallback identificado' : 'Tradução ausente', scn === 'fallback' ? 'Quem usa EN vê a versão PT com o aviso “Disponível em português”. O fallback é registrado, não escondido.' : 'Sem texto em EN. Até traduzir, EN usa o fallback em PT, sinalizado ao leitor.'));
      if (scn === 'obsoleta') alerts.push(O1.alert('warn', 'Versão obsoleta', 'ES está na v3, baseada na política v2. A v4 em PT muda o texto; revise a tradução antes de ativar.'));
      if (scn === 'link' && !ui.fixed) alerts.push(O1.alert('risk', 'Link quebrado', 'O link “/ajuda/cobranca-pro” retorna 404. Corrija antes de enviar para revisão.', 'Trocar por /ajuda/assinatura', function () { ctx.setUi({ fixed: true }); ctx.toast('Link trocado no rascunho'); }));
      var note = ui.note != null ? ui.note : '';
      var send = function () {
        if (scn === 'link' && !ui.fixed) { ctx.setUi({ err: 'Corrija o link quebrado antes de enviar.' }); return; }
        if (dirty) { ctx.setUi({ err: 'Salve o rascunho antes de enviar para revisão.' }); return; }
        if (!String(note).trim()) { ctx.setUi({ err: 'Diga o que mudou, para quem revisa a regra.' }); return; }
        if (F.status === 'em revisão') { ctx.setUi({ err: 'Já está em revisão.' }); return; }
        ctx.ask({ title: 'Enviar v' + F.ver + ' para revisão?', text: 'Quem responde pela política de cobrança revisa. Nada é publicado agora.', lines: ['Idiomas: ' + Object.keys(LN).map(function (k) { return LN[k] + ' ' + F.langs[k].st; }).join(' · '), 'Nota: ' + note], ok: 'Enviar para revisão', onOk: function () {
          var r = O1.receipt(null, 'FAQ/pro-teste v' + F.ver + ' enviada para revisão', String(note).trim(), [['Versão congelada', 'ok'], ['Revisão de Caio R.', 'fila']]);
          F.status = 'em revisão'; F.versions[0].st = 'em revisão · ' + r.id; ctx.setUi({ note: '', err: '' }); ctx.toast('Enviado para revisão · ' + r.id);
        } });
      };
      var prevRole = ui.pr || 'aluno', prevSize = ui.ps || 'desk';
      return {
        sub: 'FAQ · “' + F.langs.pt.q + '”', bar: O1.bar('conteudo.editar · institucional', F.slug + ' · v' + F.ver + ' ' + F.status), alerts: alerts,
        tabs: tabs, q: q, a: a, setQ: function (e) { ctx.setUi({ q: U.val(e), err: '' }); }, setA: function (e) { ctx.setUi({ a: U.val(e), err: '' }); },
        dirty: dirty, save: function () { if (!String(q).trim() || !String(a).trim()) { ctx.setUi({ err: 'Pergunta e resposta não podem ficar vazias.' }); return; } L.q = q; L.a = a; L.st = 'rascunho'; F.versions[0].at = 'hoje ' + O1.tick(); ctx.setUi({ q: null, a: null, err: '' }); ctx.toast('Rascunho ' + LN[l] + ' salvo na v' + F.ver); },
        locked: '[aguarda política aprovada]',
        prev: !!ui.prev, togglePrev: function () { ctx.setUi({ prev: !ui.prev }); },
        prevCls: 'o1-preview' + (prevSize === 'cel' ? ' is-cel' : ''), prevQ: q || F.langs.pt.q, prevA: (a || F.langs.pt.a) + (prevRole === 'treinador' ? '' : ''), prevNote: l === 'en' && !F.langs.en.a ? 'Disponível em português.' : '', hasPrevNote: l === 'en' && !F.langs.en.a,
        prevRoleTxt: prevRole === 'aluno' ? 'Vendo como aluno' : 'Vendo como treinador',
        roleOpts: [['aluno', 'Aluno'], ['treinador', 'Treinador']].map(function (x) { var on = prevRole === x[0]; return { label: x[1], cls: 'chip o1-chip' + (on ? ' is-on' : ''), on: String(on), go: function () { ctx.setUi({ pr: x[0] }); } }; }),
        sizeOpts: [['desk', 'Desktop'], ['cel', 'Celular']].map(function (x) { var on = prevSize === x[0]; return { label: x[1], cls: 'chip o1-chip' + (on ? ' is-on' : ''), on: String(on), go: function () { ctx.setUi({ ps: x[0] }); } }; }),
        versions: F.versions.map(function (v) { return { t: v.v + ' · ' + v.st, s: v.who + ' · ' + v.at + (v.fonte ? ' · fonte: ' + v.fonte : '') }; }),
        note: note, setNote: function (e) { ctx.setUi({ note: U.val(e), err: '' }); }, send: send, err: ui.err || '', hasErr: !!ui.err
      };
    }
  });

  // ---------- OPS04.E · Vocabulário de modalidades, locais e serviços ----------
  REG.screen({
    page: 'operacao', key: 'ops04e', id: 'OPS04.E', title: 'Vocabulário de modalidades', mtitle: 'Vocabulário', nav: 'casos', back: 'OPS04', wide: true,
    scens: [['duplicado', 'Nome duplicado'], ['ambiguo', 'Local ambíguo'], ['traducao', 'Tradução ausente'], ['retirado', 'Termo retirado'], ['semaprov', 'Associação sem aprovação']],
    vals: function (ctx) {
      var O1 = O(), V = DB.o1_vocab, scn = ctx.scn, ui = ctx.ui;
      var preset = { ambiguo: 'loc_centro', traducao: 'svc_online' }[scn];
      var selId = ui.sel || preset || V.sel;
      var t = V.termos.filter(function (x) { return x.id === selId; })[0] || V.termos[0];
      var q = ui.q || '';
      var list = V.termos.filter(function (x) { return !q || U.norm(x.nome + ' ' + x.id + ' ' + x.sin.join(' ') + ' ' + x.prop).indexOf(U.norm(q)) >= 0; }).map(function (x) {
        var on = x.id === t.id; return { nome: x.nome, sub: x.tipo + ' · ' + x.estado, cls: 'o1-term' + (on ? ' is-on' : ''), on: String(on), go: function () { ctx.setUi({ sel: x.id, detail: true, err: '', prop: null }); } };
      });
      var alerts = [], stop = '';
      if (scn === 'duplicado') { stop = 'Nome duplicado: use o termo retirado existente, não crie outro ID.'; alerts.push(O1.alert('warn', 'Nome duplicado', '“Street workout” já existe como termo retirado (mod_street_workout, 2025). Mantenha como sinônimo de Calistenia; não crie outro ID.')); }
      if (scn === 'ambiguo') alerts.push(O1.alert('warn', 'Local ambíguo', '“Centro” existe em 14 cidades. Este termo vale só para Londrina; associações sem cidade ficam fora da busca.'));
      if (scn === 'traducao') alerts.push(O1.alert('warn', 'Tradução ausente', 'Sem nome em ES. Busca em ES usa o nome PT sinalizado até alguém traduzir.'));
      if (scn === 'retirado') { stop = 'Termo retirado não recebe novos sinônimos.'; alerts.push(O1.alert('info', 'Termo retirado', '“Funcional (antigo)” foi retirado em 03/2026. Perfis antigos mantêm a etiqueta; novos não podem usá-la.')); }
      if (scn === 'semaprov') alerts.push(O1.alert('info', 'Associação sem aprovação', '18 perfis usam “street workout” sem aprovação. A busca não os associa a Calistenia até a ativação.'));
      var why = ui.why != null ? ui.why : '';
      var prop = ui.prop != null ? ui.prop : '';
      var hasProp = !!t.prop;
      var send = function () {
        if (stop) { ctx.setUi({ err: stop }); return; }
        if (!hasProp) { ctx.setUi({ err: 'Não há proposta neste termo. Proponha uma correção primeiro.' }); return; }
        if (t.estado === 'aguardando ativação') { ctx.setUi({ err: 'Já encaminhado para ativação.' }); return; }
        if (!String(why).trim()) { ctx.setUi({ err: 'Escreva o motivo do encaminhamento.' }); return; }
        ctx.ask({ title: 'Encaminhar ativação de “' + t.prop + '”?', text: 'Quem tem vocabulario.ativar decide. Nada muda na busca até lá; perfis não são reetiquetados.', lines: t.uso.map(function (u) { return u[0] + ': ' + u[1] + ' → ' + u[2]; }).concat(['Motivo: ' + why]), ok: 'Encaminhar ativação', onOk: function () {
          var r = O1.receipt(null, 'Ativação pedida · ' + t.id + ' ' + t.propTipo + ' “' + t.prop + '”', String(why).trim(), [['Proposta registrada', 'ok'], ['Ativação por quem responde pelo catálogo', 'fila']]);
          t.estado = 'aguardando ativação'; t.ref = r.id; ctx.setUi({ why: '', err: '' }); ctx.toast('Encaminhado · ' + r.id);
        } });
      };
      var propose = function () {
        if (stop) { ctx.setUi({ err: stop }); return; }
        if (!String(prop).trim()) { ctx.setUi({ err: 'Escreva o sinônimo proposto.' }); return; }
        t.prop = String(prop).trim(); t.propTipo = 'sinônimo'; t.estado = 'proposta'; t.uso = t.uso.map(function (u) { return [u[0], u[1], u[0] === 'Busca' ? 'a medir após comparar' : 'sem mudança']; });
        ctx.setUi({ prop: null, err: '' }); ctx.toast('Proposta registrada em ' + t.id + ' · compare o impacto antes de encaminhar');
      };
      return {
        sub: '“' + t.nome + '”' + (hasProp ? ' · proposta de ' + t.propTipo : ' · ' + t.estado), bar: O1.bar('vocabulario.propor', t.tipo + ':' + t.id.split('_').slice(1).join('_')), alerts: alerts,
        q: q, setQ: function (e) { ctx.setUi({ q: U.val(e) }); }, list: list, hasList: list.length > 0, noList: list.length === 0,
        ldCls: 'o1-ld' + (ui.detail || (preset && ui.detail !== false) ? ' is-detail' : ''), backList: function () { ctx.setUi({ detail: false }); },
        kv: [{ k: 'ID estável', v: t.id }, { k: 'Nome aprovado', v: t.nome }, { k: 'Proposto', v: hasProp ? t.propTipo + ' “' + t.prop + '”' : '—' }, { k: 'Traduções', v: 'EN ' + (t.en || 'faltando') + ' · ES ' + (t.es || 'faltando') }, { k: 'Sinônimos aprovados', v: t.sin.join(', ') || '—' }, { k: 'Fonte', v: t.fonte }, { k: 'Estado', v: t.estado + (t.ref ? ' · ' + t.ref : '') }],
        showImpact: ui.impact != null ? !!ui.impact : true, toggleImpact: function () { ctx.setUi({ impact: !(ui.impact != null ? ui.impact : true) }); },
        uso: t.uso.map(function (u) { return { a: u[0], b: u[1], c: u[2] }; }),
        hasProp: hasProp, noProp: !hasProp, prop: prop, setProp: function (e) { ctx.setUi({ prop: U.val(e), err: '' }); }, propose: propose,
        why: why, setWhy: function (e) { ctx.setUi({ why: U.val(e), err: '' }); }, send: send, err: ui.err || '', hasErr: !!ui.err
      };
    }
  });
})();
