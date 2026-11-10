/* O3 · OPS12 Operação de SEO (+ OPS12.A diagnóstico de URL, OPS12.B prévia e diferença, OPS12.C geração, ativação e recuperação).
   Falha preserva a versão estável; página vazia não gera expansão em massa; gerar e ativar são etapas separadas. */
(function () {
  'use strict';
  var O3 = window.O3;
  var linkRows = function (rows) { return rows.map(function (r) { return { label: r[0], sub: r[1], ic: 'ic ic--sm i-' + r[2], go: function () { GO(r[3], r[4] || {}); } }; }); };
  var urlTone = function (u) { return u.st === 'ok' ? ['Elegível', 'badge badge--ok'] : (u.st === 'fallback' ? ['ES em fallback', 'badge badge--warn'] : ['Fora da geração', 'badge badge--plain']); };
  O3.rev('o3genApprove', function () { DB.o3_geracao.approved = false; });
  O3.rev('o3genEdit', function (d) { var r = DB.o3_geracao.rows.find(function (x) { return x.id === d.id; }); if (r) r.depois = d.prev; });
  O3.rev('o3genState', function (d) { var G = DB.o3_geracao; G.state = d.state; G.active = d.active; G.activation = d.activation; });

  // ---------- OPS12 · composição ----------
  REG.screen({
    page: 'operacao', key: 'ops12', id: 'OPS12', title: 'Operação de SEO', mtitle: 'SEO', nav: 'catalogo', back: 'H16', wide: true, testIds: ['u4'],
    normal: 'Diagnóstico', scens: [['vazia', 'Página vazia'], ['falhou', 'Falhou'], ['diferenca', 'Diferença']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn, G = DB.o3_geracao;
      var urls = DB.o3_urls;
      var ld = O3.ld(ctx, urls, 'sel', scn === 'vazia' ? 'u4' : (ctx.id || ''));
      var u = ld.cur;
      var rows = urls.map(function (x) { var t = urlTone(x); return { id: x.id, url: x.url, sub: x.eleg, st: t[0], stCls: t[1], cls: ld.rowCls(x.id) + ' lrow', go: ld.pick(x.id) }; });
      var alerts = [];
      if (scn === 'vazia') alerts.push(O3.alert('warn', 'Página vazia', 'Fora da geração: cidade × modalidade sem perfil elegível não vira página.', ui.why ? 'Fechar explicação' : 'Saiba por quê', function () { ctx.setUi({ why: !ui.why }); }));
      if (scn === 'falhou') alerts.push(O3.alert('risk', 'Falhou', 'A geração ' + G.job + ' falhou em 7 de 38 URLs às 14:20. Versão estável ' + G.active + ' mantida no ar.', 'Tentar de novo', function () { GO('OPS12.C', { scn: 'falhou' }); }));
      if (scn === 'diferenca') alerts.push(O3.alert('info', 'Diferença', 'Antes/depois por URL da proposta ' + G.version + '. Nada muda no ar até a ativação.', 'Abrir prévia completa', function () { GO('OPS12.B'); }));
      var tone = urlTone(u);
      var diffs = G.rows.filter(function (r) { return r.ok; }).map(function (r) { return { url: r.url, loc: r.loc, antes: r.antes, depois: r.depois }; });
      return {
        hasEyebrow: true, eyebrow: 'Catálogo · SEO', h1: 'SEO · diagnóstico', sub: 'Páginas locais por cidade × modalidade · verificado 26/10 13:00',
        acts: [O3.btn(ctx, 'Prévia da geração', function () { GO('OPS12.B'); }), O3.btn(ctx, 'Geração e ativação', function () { GO('OPS12.C'); })],
        alerts: alerts, showWhy: scn === 'vazia' && !!ui.why,
        why: 'Só geramos página para cidade × modalidade com perfil elegível publicado. Com 0 perfis, a URL fica fora do sitemap e não é criada; isso evita expansão em massa de páginas vazias. Quando surgir perfil elegível, a próxima geração inclui a página.',
        ldCls: ld.ldCls, rows: rows, toList: ld.toList,
        cur: { url: u.url, st: tone[0], stCls: tone[1] },
        kv: [O3.kv('Elegível', u.eleg), O3.kv('Canonical', u.canonical), O3.kv('Idiomas', u.idiomas), O3.kv('Sitemap', u.sitemap), O3.kv('Motivo de exclusão', u.exclusao), O3.kv('Última verificação', u.verif)],
        openDiag: function () { GO('OPS12.A', { id: u.id }); },
        excl: urls.filter(function (x) { return x.st === 'excluida'; }).map(function (x) { return { t: x.url, s: x.eleg.replace('não · ', '') + ' · ' + x.exclusao }; }),
        showDiff: scn === 'diferenca', diffs: diffs,
        links: linkRows([['Diagnóstico de URL', 'Canonical, hreflang, sitemap e exclusão', 'search', 'OPS12.A', { id: 'u2' }], ['Prévia e diferença', 'Proposta ' + G.version + ' · ' + G.total + ' URLs', 'eye', 'OPS12.B'], ['Geração e ativação', 'Job ' + G.job + ' · ' + G.done + ' de ' + G.total, 'rocket', 'OPS12.C']])
      };
    }
  });

  // ---------- OPS12.A · diagnóstico ----------
  REG.screen({
    page: 'operacao', key: 'ops12a', id: 'OPS12.A', title: 'Diagnóstico de URL', mtitle: 'Diagnóstico', nav: 'catalogo', back: 'OPS12', testIds: ['u1', 'u3'],
    normal: 'Idioma incompleto', scens: [['canonical', 'Canonical divergente'], ['inelegivel', 'Página inelegível'], ['removida', 'Removida'], ['indisp', 'Verificação indisponível']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn;
      var def = scn === 'inelegivel' ? 'u3' : (ctx.id || 'u2');
      var u = DB.find('o3_urls', ui.uid || def) || DB.find('o3_urls', 'u2');
      var q = U.norm(ui.q || '');
      var matches = q.length >= 2 ? DB.o3_urls.filter(function (x) { return U.norm(x.url).indexOf(q) >= 0; }).map(function (x) { return { url: x.url, go: function () { ctx.setUi({ uid: x.id, q: '' }); } }; }) : [];
      var canon = scn === 'canonical' ? '/entrenadores/campinas/functional-training' : u.canonUrl;
      var status = scn === 'removida' ? '410' : u.status;
      var checked = scn === 'indisp' && !ui.cq ? 'indisponível desde 09:00' : (ui.cq ? '26/10 ' + ui.cq : u.verif);
      var alerts = [];
      if (u.st === 'fallback' && scn !== 'removida') alerts.push(O3.alert('warn', 'Idioma incompleto', u.note, 'Ver prévia ES', function () { GO('OPS12.B', { loc: 'ES' }); }));
      if (scn === 'canonical') alerts.push(O3.alert('risk', 'Canonical divergente', 'A canônica aponta para uma URL que não existe. Corrija na próxima proposta; não altere à mão no ar.', 'Abrir prévia', function () { GO('OPS12.B'); }));
      if (u.st === 'excluida') alerts.push(O3.alert('info', 'Página inelegível', 'Nenhum perfil elegível. A URL fica fora do sitemap e não geramos página vazia.'));
      if (scn === 'removida') alerts.push(O3.alert('info', 'Removida', 'Responde 410 desde 24/10 pela retirada R-39. Saiu do sitemap e da busca interna.', 'Ver propagação', function () { GO('OPS11.C', { id: 'R-41' }); }));
      if (scn === 'indisp' && !ui.cq) alerts.push(O3.alert('warn', 'Verificação indisponível', 'O verificador não respondeu desde 09:00. Os dados abaixo são da última verificação confirmada.', 'Consultar de novo', function () { ctx.setUi({ cq: U.now() }); ctx.toast('Verificado às ' + U.now() + ' · sem mudança'); }));
      var copy = function () {
        try { if (window.navigator && navigator.clipboard) navigator.clipboard.writeText(u.url); } catch (_) {}
        ctx.toast('URL copiada: ' + u.url);
      };
      return {
        hasEyebrow: false, eyebrow: '', h1: 'Diagnóstico de URL', sub: u.url,
        acts: [O3.btn(ctx, 'Copiar URL', copy)],
        ctx: O3.ctx('seo.ler', 'URL · locale ' + u.locale), alerts: alerts,
        q: ui.q || '', setQ: function (e) { ctx.setUi({ q: U.val(e) }); }, matches: matches, hasMatches: matches.length > 0,
        url: u.url, copy: copy,
        kv: [O3.kv('Canônica', canon), O3.kv('Tipo', u.tipo), O3.kv('Status', status), O3.kv('hreflang', u.hreflang), O3.kv('Sitemap', scn === 'removida' ? 'removida' : u.sitemap), O3.kv('Exclusão', scn === 'removida' ? 'retirada R-39' : u.exclusao), O3.kv('Verificado', checked)],
        blocks: [
          { t: 'Status', v: status }, { t: 'hreflang', v: u.hreflang === '—' ? '0/3' : '3/3' }, { t: u.locale, v: u.st === 'fallback' ? 'fallback' : (u.st === 'ok' ? 'completo' : '—') }
        ]
      };
    }
  });

  // ---------- OPS12.B · prévia e diferença ----------
  REG.screen({
    page: 'operacao', key: 'ops12b', id: 'OPS12.B', title: 'Prévia da geração', mtitle: 'Prévia', nav: 'catalogo', back: 'OPS12',
    normal: 'Proposta v14', scens: [['semevid', 'Conteúdo sem evidência'], ['traducao', 'Tradução faltante'], ['duplicada', 'URL duplicada'], ['base', 'Base alterada'], ['invalida', 'Proposta inválida']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn, G = DB.o3_geracao;
      var loc = ui.loc || ctx.p.loc || (scn === 'traducao' ? 'EN' : 'PT');
      var side = ui.side || 'depois';
      var rows = G.rows.map(function (r) {
        var evid = scn === 'semevid' && r.id === 'g2' ? '—' : r.evid;
        var ok = r.ok && evid !== '—';
        var dup = scn === 'duplicada' && r.id === 'g2';
        var inScope = ok && !dup && (ui['x_' + r.id] !== undefined ? ui['x_' + r.id] : r.on);
        return { r: r, id: r.id, loc: r.loc, url: r.url, muda: r.muda, mudaCls: O3.tone(r.muda === 'sem tradução' ? 'sem tradução' : (r.muda === 'nova' ? 'ok' : 'plain')), evid: evid, ok: ok && !dup, inScope: inScope, dup: dup };
      });
      var cur = rows.filter(function (x) { return x.loc === loc; });
      var scope = rows.filter(function (x) { return x.inScope; });
      var blocked = G.approved || scn === 'base' || scn === 'invalida' || scope.length === 0;
      var why = G.approved ? 'Escopo já aprovado. Use o recibo para desfazer.' : (scn === 'base' ? 'A base mudou (v8): gere nova proposta antes de aprovar.' : (scn === 'invalida' ? 'Proposta inválida: 2 URLs sem canonical. Gere de novo.' : 'Inclua ao menos uma URL no escopo.'));
      var approve = function () {
        O3.decide(ctx, { title: 'Aprovar escopo da proposta ' + G.version + '?', ok: 'Aprovar escopo', scope: 'ops12b', action: 'Escopo aprovado · ' + G.version, target: U.plural(scope.length, 'URL', 'URLs') + ' de amostra · ' + G.total + ' no total',
          impact: ['Aprova o conteúdo de ' + U.plural(scope.length, 'URL revisada', 'URLs revisadas') + ' nesta prévia.', 'Não ativa nada: a ativação é uma etapa separada em Geração e ativação.', 'URLs sem tradução ou sem evidência ficam de fora.', 'Versão no ar continua ' + G.active + '.'],
          apply: function () { G.approved = true; }, rev: 'o3genApprove', data: {} });
      };
      var editing = ui.editId ? G.rows.find(function (x) { return x.id === ui.editId; }) : null;
      var saveEdit = function () {
        var v = String(ui.ev || '').trim();
        if (!editing) return;
        if (v.length < 10) { ctx.setUi({ ferr: 'O título precisa ter pelo menos 10 caracteres.' }); return; }
        var prev = editing.depois; editing.depois = v;
        var r = O3.receipt({ scope: 'ops12b', action: 'Rascunho editorial corrigido', target: editing.url, reason: 'Antes: ' + prev, rev: 'o3genEdit', data: { id: editing.id, prev: prev }, undo: true });
        ctx.setUi({ editId: '', ev: '', ferr: '' }); ctx.toast('Rascunho salvo · recibo ' + r.id);
      };
      var alerts = [];
      if (scn === 'semevid') alerts.push(O3.alert('warn', 'Conteúdo sem evidência', '/treinadores/campinas/funcional mudou o título sem base aprovada. Fica fora do escopo até ter evidência.'));
      if (scn === 'traducao') alerts.push(O3.alert('warn', 'Tradução faltante', '/en/trainers/campinas/yoga não tem tradução EN aprovada. Não publicamos tradução automática sem revisão.', 'Abrir textos PT/EN/ES', function () { GO('OPS04.D'); }));
      if (scn === 'duplicada') alerts.push(O3.alert('risk', 'URL duplicada', '/treinadores/campinas/funcional e /treinadores/campinas/funcional/ apontam para a mesma página. A duplicata sai do escopo.'));
      if (scn === 'base') alerts.push(O3.alert('warn', 'Base alterada', 'O vocabulário de modalidades mudou para v8 depois desta proposta. Gere uma nova prévia.', 'Abrir vocabulário', function () { GO('OPS04.E'); }));
      if (scn === 'invalida') alerts.push(O3.alert('risk', 'Proposta inválida', 'Validação: 36 de 38 URLs ok; 2 sem canonical. Gere de novo; a versão ' + G.active + ' segue no ar.', 'Ver geração', function () { GO('OPS12.C'); }));
      if (G.approved) alerts.push(O3.alert('ok', 'Escopo aprovado', 'A proposta está aprovada, mas nada mudou no ar. Ative em Geração e ativação quando a geração terminar.', 'Ir para ativação', function () { GO('OPS12.C'); }));
      var rc = O3.rcPack(ctx, 'ops12b');
      return {
        hasEyebrow: false, eyebrow: '', h1: 'Prévia da geração', sub: 'Proposta ' + G.version + ' · ' + G.total + ' URLs',
        acts: [O3.btn(ctx, 'Aprovar escopo', approve, { kind: 'btn--primary', dis: blocked, why: why })],
        ctx: O3.ctx('seo.propor', 'Geração ' + G.version), alerts: alerts,
        locs: ['PT', 'EN', 'ES'].map(function (l) { var on = l === loc; return { label: l, cls: 'seg__it' + (on ? ' is-on' : ''), on: String(on), go: function () { ctx.setUi({ loc: l }); } }; }),
        sides: [['antes', 'Antes'], ['depois', 'Depois']].map(function (s) { var on = s[0] === side; return { label: s[1], cls: 'seg__it' + (on ? ' is-on' : ''), on: String(on), go: function () { ctx.setUi({ side: s[0] }); } }; }),
        rows: cur.map(function (x) {
          var on = x.inScope;
          return { url: x.url, muda: x.muda, mudaCls: x.mudaCls, evid: x.evid, ok: x.ok, notOk: !x.ok, on: String(on), chk: 'check' + (on ? ' is-on' : ''),
            antes: x.r.antes, depois: x.r.depois, sideTxt: side === 'antes' ? x.r.antes : x.r.depois, sideLbl: side === 'antes' ? 'Antes' : 'Depois',
            lockWhy: x.dup ? 'duplicada' : (x.r.ok ? 'sem evidência' : 'sem tradução'),
            toggle: function () { if (!x.ok) { ctx.toast('Fora do escopo: ' + (x.dup ? 'URL duplicada.' : (x.r.ok ? 'conteúdo sem evidência.' : 'sem tradução aprovada.'))); return; } var o = {}; o['x_' + x.id] = !on; ctx.setUi(o); },
            edit: function () { if (!x.ok) { ctx.toast('Só rascunhos dentro do escopo podem ser corrigidos.'); return; } ctx.setUi({ editId: x.id, ev: x.r.depois, ferr: '' }); } };
        }),
        hasRows: cur.length > 0, noRows: cur.length === 0, noRowsT: 'Nenhuma URL ' + loc + ' nesta proposta.',
        isEdit: !!editing, editUrl: editing ? editing.url : '', ev: ui.ev || '', setEv: function (e) { ctx.setUi({ ev: U.val(e), ferr: '' }); }, saveEdit: saveEdit, cancelEdit: function () { ctx.setUi({ editId: '', ev: '', ferr: '' }); },
        hasFerr: !!ui.ferr, ferr: ui.ferr || '',
        scopeN: U.plural(scope.length, 'URL no escopo', 'URLs no escopo') + ' (amostra de ' + G.rows.length + ')',
        decTitle: 'Aprovar escopo', hasImpact: true, impact: ['Aprova ' + U.plural(scope.length, 'URL', 'URLs') + ' revisadas; nada é ativado agora.', 'Ativação é separada e só para versão validada.', 'Versão no ar: ' + G.active + ' desde ' + G.since + '.'],
        dec: O3.reason(ctx), decActs: [O3.btn(ctx, 'Aprovar escopo', approve, { kind: 'btn--primary', size: 'btn--lg', dis: blocked, why: why })],
        rcs: rc.rcs, hasRcs: rc.hasRcs
      };
    }
  });

  // ---------- OPS12.C · geração e ativação ----------
  REG.screen({
    page: 'operacao', key: 'ops12c', id: 'OPS12.C', title: 'Geração e ativação', mtitle: 'Geração', nav: 'catalogo', back: 'OPS12',
    normal: 'Gerando', scens: [['pronta', 'Geração concluída'], ['falhou', 'Falhou ou parcial'], ['cancelando', 'Cancelamento em processamento'], ['obsoleta', 'Proposta obsoleta'], ['desconhecida', 'Ativação desconhecida']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn, G = DB.o3_geracao;
      var cancelled = G.state === 'cancelado', active14 = G.active === G.version;
      var done = scn === 'pronta' || scn === 'desconhecida' ? G.total : (scn === 'falhou' ? 31 : G.done);
      if (ui.retried) done = G.total;
      var pct = Math.round(done / G.total * 100);
      var genSt = cancelled ? 'Falhou' : (done === G.total ? 'Confirmado' : (scn === 'falhou' ? 'Falhou' : (scn === 'cancelando' ? 'Cancelando' : 'Em andamento')));
      var genSub = cancelled ? 'cancelado · ' + done + ' de ' + G.total + ' descartados da proposta' : (scn === 'falhou' && !ui.retried ? '31/38 · 7 falharam às 14:20' : done + '/' + G.total);
      var unknownAct = scn === 'desconhecida' && !ui.cq && !active14;
      var actSt = active14 ? 'Confirmado' : (unknownAct ? 'Desconhecido' : 'Na fila');
      var actSub = active14 ? G.version + ' ativa às ' + (G.activatedAt || U.now()) : (unknownAct ? 'pedido às 14:10 sem confirmação' : (ui.cq ? 'consultado ' + ui.cq + ': ' + G.active + ' segue ativa' : 'só versão validada'));
      var canActivate = !active14 && !cancelled && done === G.total && scn !== 'obsoleta' && scn !== 'cancelando' && !unknownAct;
      var whyAct = active14 ? G.version + ' já está ativa. Use o recibo para voltar.' : (cancelled ? 'Geração cancelada: solicite nova geração.' : (unknownAct ? 'Resultado desconhecido: consulte a ativação antes de repetir.' : (scn === 'obsoleta' ? 'Proposta obsoleta: a base mudou.' : (scn === 'cancelando' ? 'Cancelamento em processamento.' : 'Geração ainda em andamento: ativa só versão validada.'))));
      var canCancel = !cancelled && done < G.total && scn !== 'cancelando';
      var activate = function () {
        O3.decide(ctx, { title: 'Ativar ' + G.version + '?', ok: 'Ativar ' + G.version, scope: 'ops12c', action: 'Ativação ' + G.version, target: G.total + ' URLs',
          impact: ['Alcance: ' + G.total + ' URLs passam de ' + G.active + ' para ' + G.version + '.', 'Páginas sem perfil elegível continuam fora (sem página vazia).', G.active + ' fica guardada como retorno imediato.'],
          apply: function () { G.activatedAt = U.now(); G.state = 'ativa'; G.active = G.version; G.activation = 'Confirmado'; }, rev: 'o3genState', data: { state: G.state, active: G.active, activation: G.activation } });
      };
      var cancel = function () {
        O3.decide(ctx, { title: 'Cancelar o pendente de ' + G.job + '?', ok: 'Cancelar pendente', danger: true, scope: 'ops12c', action: 'Pendente cancelado · ' + G.job, target: (G.total - done) + ' URLs ainda não geradas',
          impact: ['Para a geração das ' + (G.total - done) + ' URLs restantes.', 'URLs já geradas ficam só na proposta; nada vai ao ar.', 'Versão no ar continua ' + G.active + '.'],
          apply: function () { G.state = 'cancelado'; }, rev: 'o3genState', data: { state: G.state, active: G.active, activation: G.activation } });
      };
      var request = function () {
        O3.decide(ctx, { title: 'Solicitar nova geração?', ok: 'Solicitar geração', scope: 'ops12c', action: 'Geração solicitada', target: 'Proposta ' + G.version + ' · ' + G.total + ' URLs',
          impact: ['Gera só cidade × modalidade com perfil elegível (sem páginas vazias).', 'Nada é ativado automaticamente.'], apply: function () { G.state = 'andamento'; }, rev: 'o3genState', data: { state: G.state, active: G.active, activation: G.activation } });
      };
      var retry = function () {
        O3.decide(ctx, { title: 'Tentar de novo só as 7 URLs?', ok: 'Tentar de novo', scope: 'ops12c', action: 'Reprocessamento de 7 URLs', target: G.job,
          impact: ['Alcance: 7 URLs que falharam; as 31 confirmadas não mudam.', 'Versão no ar continua ' + G.active + '.'], apply: function () { ctx.setUi({ retried: true }); }, undo: false });
      };
      var consult = function () { ctx.setUi({ cq: U.now() }); ctx.toast('Consultado às ' + U.now() + ': ' + G.version + ' não ativou; ' + G.active + ' segue ativa. Agora você pode ativar.'); };
      var steps = [
        O3.step('Validações', G.valid, scn === 'obsoleta' ? 'Falhou' : 'Confirmado', scn === 'obsoleta' ? { ev: 'Base de modalidades mudou para v8 depois da validação.' } : null),
        O3.step('Geração', genSub, genSt, scn === 'falhou' && !ui.retried ? { act: retry, actLabel: 'Tentar de novo' } : null),
        O3.step('Ativação', actSub, actSt, unknownAct ? { act: consult, actLabel: 'Consultar' } : null)
      ];
      var alerts = [];
      if (scn === 'falhou' && !ui.retried) alerts.push(O3.alert('risk', 'Falhou em parte', '7 de 38 URLs não geraram às 14:20. A versão estável ' + G.active + ' continua no ar.'));
      if (scn === 'cancelando') alerts.push(O3.alert('info', 'Cancelamento em processamento', 'O pedido de cancelamento chegou às 14:15. Aguarde a confirmação; não peça de novo.'));
      if (scn === 'obsoleta') alerts.push(O3.alert('warn', 'Proposta obsoleta', 'A base mudou depois desta proposta. Gere nova prévia antes de ativar.', 'Gerar nova prévia', function () { GO('OPS12.B', { scn: 'base' }); }));
      if (unknownAct) alerts.push(O3.alert('warn', 'Ativação desconhecida', 'O pedido de ativação das 14:10 não confirmou. Consulte antes de repetir para não ativar duas vezes.', 'Consultar ativação', consult));
      if (scn === 'pronta' && !active14) alerts.push(O3.alert('ok', 'Geração concluída', '38 de 38 URLs geradas e validadas. Ative quando revisar a prévia.', 'Ver prévia', function () { GO('OPS12.B'); }));
      if (cancelled) alerts.push(O3.alert('info', 'Geração cancelada', 'Nada foi ao ar. ' + G.active + ' continua ativa.'));
      var acts = [];
      if (cancelled) acts.push(O3.btn(ctx, 'Solicitar geração', request, { kind: 'btn--primary' }));
      else acts.push(O3.btn(ctx, 'Cancelar pendente', cancel, { dis: !canCancel, why: scn === 'cancelando' ? 'Cancelamento já em processamento.' : 'Nada pendente para cancelar.' }));
      acts.push(O3.btn(ctx, 'Ativar ' + G.version, activate, { kind: 'btn--primary', dis: !canActivate, why: whyAct }));
      var rc = O3.rcPack(ctx, 'ops12c');
      return {
        hasEyebrow: false, eyebrow: '', h1: 'Geração e ativação', sub: 'Job ' + G.job,
        acts: acts, ctx: O3.ctx('seo.ativar', 'Versão ' + G.version), alerts: alerts,
        prog: G.job + ' · ' + done + ' de ' + G.total + ' URLs', pct: pct + '%', barStyle: 'width:' + pct + '%', steps: steps,
        kv: [O3.kv('Ativa hoje', G.active + ' · desde ' + (active14 ? '26/10' : G.since)), O3.kv('Responsável', G.resp), O3.kv('Fora da geração', 'Cambé · yoga e outras sem perfil elegível')],
        decTitle: 'Gerar e ativar são etapas separadas', hasImpact: true, impact: ['Gerar não muda o que está no ar.', 'Ativar troca ' + G.total + ' URLs para ' + G.version + ' e pode voltar para ' + G.active + ' pelo recibo.', 'Falha preserva a versão estável.'],
        dec: O3.reason(ctx), decActs: acts.map(function (a) { return { label: a.label, dis: a.dis, cls: a.cls.replace('btn--sm', 'btn--lg'), go: a.go }; }),
        rcs: rc.rcs, hasRcs: rc.hasRcs
      };
    }
  });
})();
