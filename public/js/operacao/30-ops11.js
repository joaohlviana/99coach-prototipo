/* O3 · H16 Catálogo, fontes e SEO (hub; também atende OPS11 Publicação, indexação e retirada)
   + OPS11.A estado por etapa, OPS11.B revisão da retirada, OPS11.C propagação e recuperação.
   Sitemap pronto não confirma indexação no Google; índice interno não é o Google; retirada não exclui conta nem contratos. */
(function () {
  'use strict';
  var O3 = window.O3;
  var linkRows = function (rows) { return rows.map(function (r) { return { label: r[0], sub: r[1], ic: 'ic ic--sm i-' + r[2], go: function () { GO(r[3], r[4] || {}); } }; }); };
  O3.rev('o3pubRetry', function (d) { var p = DB.o3_catalogo.pub; p.retry = false; p.indice = d.indice; p.falhas = d.falhas; });
  O3.rev('o3sitemap', function () { DB.o3_catalogo.pub.sitemapResent = false; });
  O3.rev('o3pageIdx', function (d) { var p = DB.find('o3_paginas', d.id); if (p) { p.indice = d.indice; p.indiceSub = d.indiceSub; p.resent = false; } });
  O3.rev('o3ret', function (d) { var r = DB.find('o3_retiradas', d.id); if (r) r.status = d.status; DB.o3_catalogo.publicados += d.pub || 0; });

  // ---------- H16 · hub do catálogo (OPS11) ----------
  REG.screen({
    page: 'operacao', key: 'catalogo', id: 'H16', also: ['OPS11'], title: 'Catálogo e fontes', mtitle: 'Catálogo', nav: 'catalogo', wide: true,
    normal: 'Uso recorrente',
    scens: [['vazio', 'Primeiro uso'], ['ausencia', 'Ausência confirmada'], ['parcial', 'Indisponibilidade parcial'], ['falha', 'Falha parcial na publicação'], ['google', 'Google sem evidência'], ['retirada', 'Retirada propagada']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn, K = DB.o3_catalogo, P = K.pub;
      var empty = scn === 'vazio';
      var defSec = scn === 'ausencia' ? 'seo' : (scn === 'falha' || scn === 'google' || scn === 'retirada' ? 'pub' : '');
      var sec = ui.sec !== undefined ? ui.sec : defSec;
      var secCls = function (k) { return 'o3-sec' + (sec === k ? ' is-sel' : ''); };
      var openSec = function (k) { return function () { ctx.setUi({ sec: k }); }; };
      var loteSub = scn === 'parcial' && !ui.resumed ? '140 de 213 · pausado' : K.loteErr + ' erros · ' + K.loteDup + ' duplicatas';
      var pipe = [
        { n: String(K.fontes), l: 'Fontes', s: K.fontesPend + ' pendências · ' + K.fotoSemLic + ' sem licença de foto', go: openSec('fontes') },
        { n: String(K.loteN), l: 'Lote ' + K.lote, s: loteSub, go: function () { GO('OPS09'); } },
        { n: String(K.quarentena), l: 'Quarentena', s: K.revisarId + ' revisar identidade', go: function () { GO('OPS10'); }, dark: true },
        { n: String(K.publicados), l: 'Publicados', s: 'não reivindicados', go: openSec('pub') },
        { n: '—', l: 'Índice interno', s: 'sem prova desde ' + K.indiceDesde, go: function () { GO('OPS11.A', { id: 'paula' }); } }
      ].map(function (x, i) { return { n: x.n, l: x.l, s: x.s, go: x.go, cls: 'o3-pipe__it' + (x.dark ? ' is-dark' : ''), hasArrow: i < 4 }; });
      var fontes = DB.o3_fontes.map(function (f) {
        var b = function (v) { return { v: v, cls: v === 'sim' ? 'o3-yes' : (v === '—' ? 'o3-dash' : O3.tone(v === 'pausa' ? 'pausado' : 'não')) }; };
        return { name: f.name, note: f.note, c: b(f.coletar), p: b(f.publicar), i: b(f.indexar), f: b(f.foto), go: function () { GO('OPS08'); } };
      });
      // publicação (lote L-19): etapas e estado
      var retirada = scn === 'retirada';
      var idxTxt = P.retry ? (P.indice + ' · 5 reenviados') : (P.indice + ' · ' + P.falhas + ' falharam');
      var stages = [
        { k: 'Descoberto', n: String(P.descoberto), cls: 'o3-stage' },
        { k: 'Aprovado', n: String(P.aprovado), cls: 'o3-stage' },
        { k: 'Publicado', n: String(P.publicado), cls: 'o3-stage' },
        { k: 'Índice interno', n: idxTxt, cls: 'o3-stage' + (P.retry ? ' is-info' : ' is-warn') },
        { k: 'Google', n: P.sitemapResent ? 'sem evidência · sitemap reenviado' : (ui.gq ? 'sem evidência · consultado ' + ui.gq : P.google), cls: 'o3-stage is-warn' }
      ];
      if (retirada) stages = [['Banco', '14:40'], ['Busca interna', '14:41'], ['Sitemap', '14:42'], ['Mídia e cache', '14:55'], ['Reimportação', 'suprimida']].map(function (s) { return { k: s[0], n: 'retirado · ' + s[1], cls: 'o3-stage is-ok' }; });
      var failed = [['/paula-n-campinas', 'Paula N.'], ['/renan-c-campinas', 'Renan C.'], ['/bia-t-campinas', 'Bia T.'], ['/joao-p-sumare', 'João P.'], ['/livia-r-hortolandia', 'Lívia R.']].map(function (x) { return { url: x[0], name: x[1], st: P.retry ? 'reenviado' : 'falhou 14:31', cls: P.retry ? 'badge badge--info' : 'badge badge--risk' }; });
      var retryIdx = function () {
        O3.decide(ctx, { title: 'Tentar de novo os 5 itens?', ok: 'Tentar de novo', scope: 'catalogo', action: 'Reenvio ao índice interno', target: 'Lote ' + P.lote + ' · 5 perfis',
          impact: ['Alcance: 5 perfis já publicados, só a etapa “índice interno”.', 'Não republica nem altera os 220 que já confirmaram.', 'Não envia nada ao Google.'],
          apply: function () { P.retry = true; }, rev: 'o3pubRetry', data: { indice: P.indice, falhas: P.falhas } });
      };
      var consultG = function () { ctx.setUi({ gq: U.now() }); ctx.toast('Consultado às ' + U.now() + ': ainda sem evidência própria no Google. Estado segue desconhecido.'); };
      var resendSitemap = function () {
        if (!ui.gq) { ctx.toast('Resultado desconhecido: consulte de novo antes de repetir o envio.'); return; }
        O3.decide(ctx, { title: 'Reenviar o sitemap do lote ' + P.lote + '?', ok: 'Reenviar sitemap', scope: 'catalogo', action: 'Sitemap reenviado', target: 'Lote ' + P.lote + ' · 225 URLs',
          impact: ['Alcance: 225 URLs publicadas do lote ' + P.lote + '.', 'Sitemap pronto não confirma indexação no Google.', 'Nenhuma página nova é criada.'],
          apply: function () { P.sitemapResent = true; }, rev: 'o3sitemap', data: {} });
      };
      var alerts = [];
      if (scn === 'parcial' && !ui.resumed) alerts.push(O3.alert('warn', '429 do provedor', 'Lote pausado às 13:30 · nada duplicado. Retoma do ponto.', 'Retomar do ponto', function () { ctx.setUi({ resumed: true }); ctx.toast('Lote L-81 retomado no item 141 · nada duplicado'); }));
      if (scn === 'parcial' && ui.resumed) alerts.push(O3.alert('info', 'Lote retomado', 'L-81 continua do item 141 de 213. Itens já salvos não são importados de novo.'));
      if (scn === 'falha') alerts.push(O3.alert('risk', 'Falha parcial', 'Índice interno: 5 de 225 itens falharam às 14:31. As outras etapas estão confirmadas.', 'Ver etapa e itens', openSec('pub')));
      if (scn === 'google') alerts.push(O3.alert('warn', 'Google', 'Sem evidência própria = desconhecido. Sitemap pronto não confirma indexação.', 'Consultar de novo', consultG));
      if (retirada) alerts.push(O3.alert('ok', 'Retirada propagada', '/marcos-lima-campinas saiu em todas as etapas: banco, busca interna, sitemap e cache. Reimportação suprimida.', 'Ver propagação', function () { GO('OPS11.C', { id: 'R-41' }); }));
      // busca
      var q = U.norm(ui.q || '');
      var results = [];
      if (q.length >= 2) {
        DB.o3_candidatos.forEach(function (c) { if (U.norm(c.name + ' ' + c.id).indexOf(q) >= 0) results.push({ label: c.name, sub: 'Candidato ' + c.id + ' · ' + c.motivo, go: function () { GO(c.match ? 'OPS10.B' : 'OPS10.C', { id: c.id }); } }); });
        DB.o3_paginas.forEach(function (p) { if (U.norm(p.url + ' ' + p.name).indexOf(q) >= 0) results.push({ label: p.url, sub: 'Perfil publicado · ' + p.name, go: function () { GO('OPS11.A', { id: p.id }); } }); });
        DB.o3_urls.forEach(function (u) { if (U.norm(u.url).indexOf(q) >= 0) results.push({ label: u.url, sub: 'Página local · ' + u.eleg, go: function () { GO('OPS12.A', { id: u.id }); } }); });
      }
      var ret = DB.o3_retiradas.map(function (r) {
        return { t: r.url, s: r.id === 'R-41' ? (retirada ? 'propagada em todas as etapas' : 'cache externo antigo') : r.done + ' retirados', go: function () { GO('OPS11.C', { id: r.id }); } };
      });
      var G = DB.o3_geracao;
      var pages = [
        { k: G.version, t: 'Geração · ' + G.done + ' de ' + G.total, b: 'andamento', cls: 'badge badge--info', go: function () { GO('OPS12.C'); } },
        { k: 'ES', t: G.esFallback + ' em fallback PT', b: 'faltando', cls: 'badge badge--warn', go: function () { GO('OPS12.A', { id: 'u2' }); } },
        { k: '—', t: 'Cambé · yoga · 0 perfis', b: 'não gerada', cls: 'badge badge--plain', go: function () { GO('OPS12', { id: 'u4' }); } }
      ];
      var phone = [
        { t: 'Fontes · ' + K.fontes, s: K.fontesPend + ' pendências', ic: 'ic ic--sm i-folder', go: openSec('fontes') },
        { t: 'Quarentena · ' + K.quarentena, s: K.revisarId + ' revisar', ic: 'ic ic--sm i-users', go: function () { GO('OPS10'); } },
        { t: 'Publicados · ' + K.publicados, s: 'índice sem prova', ic: 'ic ic--sm i-link', go: openSec('pub') },
        { t: 'Retiradas', s: DB.o3_retiradas.length + ' em propagação', ic: 'ic ic--sm i-refresh', go: openSec('ret') },
        { t: 'Páginas locais', s: G.version + ' · ' + G.done + ' de ' + G.total, ic: 'ic ic--sm i-pin', go: openSec('seo') }
      ];
      var pubNeedsReason = scn === 'falha' && !P.retry || scn === 'google' && !!ui.gq && !P.sitemapResent;
      var pubActs = [];
      if (scn === 'falha') pubActs.push(O3.btn(ctx, 'Tentar de novo', retryIdx, { kind: 'btn--primary', dis: P.retry, why: 'Os 5 itens já foram reenviados. Use o recibo para desfazer.' }));
      if (scn === 'google') { pubActs.push(O3.btn(ctx, 'Consultar de novo', consultG)); pubActs.push(O3.btn(ctx, 'Reenviar sitemap', resendSitemap, { kind: 'btn--primary', dis: !ui.gq || !!P.sitemapResent, why: P.sitemapResent ? 'Sitemap já reenviado. Use o recibo para desfazer.' : 'Resultado desconhecido: consulte de novo antes de repetir.' })); }
      pubActs.push(O3.btn(ctx, 'Estado por etapa', function () { GO('OPS11.A', { id: 'paula' }); }, { kind: 'btn--ghost' }));
      var rc = O3.rcPack(ctx, 'catalogo');
      return {
        hasEyebrow: true, eyebrow: 'Do direito de usar ao perfil encontrado', h1: 'Catálogo e publicação', sub: 'Identidade, autorização, qualidade, publicação e indexação são dimensões independentes.',
        acts: [O3.btn(ctx, 'Nova fonte', function () { GO('OPS08'); }), O3.btn(ctx, 'Importar arquivo', function () { GO('OPS09'); }, { dis: empty, why: 'Cadastre a fonte com evidência antes de importar qualquer arquivo.' })],
        isEmpty: empty, notEmpty: !empty, alerts: alerts,
        q: ui.q || '', setQ: function (e) { ctx.setUi({ q: U.val(e) }); }, hasQ: q.length >= 2, results: results, hasResults: results.length > 0, noResults: q.length >= 2 && results.length === 0,
        pipe: pipe, phone: phone, hubCls: 'o3-hub' + (sec ? ' has-sel' : ''), toHub: function () { ctx.setUi({ sec: '' }); },
        secFontes: secCls('fontes'), secPub: secCls('pub'), secRet: secCls('ret'), secSeo: secCls('seo'),
        fontes: fontes, fontesMore: (K.fontes - DB.o3_fontes.length) + ' outras fontes sem pendência',
        pubTitle: retirada ? 'Retirada · /marcos-lima-campinas' : 'Publicação · Lote #' + P.lote, pubSub: retirada ? 'operação R-41 · confirmada em todas as etapas' : 'última confirmação ' + P.when,
        stages: stages, showFailed: scn === 'falha', failed: failed, pubActs: pubActs, pubNeedsReason: pubNeedsReason, dec: O3.reason(ctx),
        ret: ret, pages: pages, absent: scn === 'ausencia', notAbsent: scn !== 'ausencia',
        links: linkRows([['Quarentena', 'Candidatos e revisão', 'users', 'OPS10'], ['Estado por etapa', 'Do descoberto ao exibido', 'list', 'OPS11.A', { id: 'paula' }], ['Revisão da retirada', 'Alcance e preservações', 'shield', 'OPS11.B'], ['Propagação e recuperação', 'Efeito efetivo da retirada', 'refresh', 'OPS11.C', { id: 'R-41' }], ['Operação de SEO', 'Diagnóstico, prévia e geração', 'search', 'OPS12'], ['Vitrines e experimentos', 'Regras, amostra e período', 'grid', 'OPS13']]),
        rcs: rc.rcs, hasRcs: rc.hasRcs
      };
    }
  });

  // ---------- OPS11.A · estado por etapa ----------
  REG.screen({
    page: 'operacao', key: 'ops11a', id: 'OPS11.A', title: 'Estado por etapa', mtitle: 'Estado por etapa', nav: 'catalogo', back: 'OPS11', testIds: ['marcos'],
    normal: 'Índice sem prova', scens: [['foraindice', 'Publicado fora do índice'], ['antigo', 'Índice antigo'], ['render', 'Renderização falhou']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn;
      var p = DB.find('o3_paginas', ctx.id) || DB.find('o3_paginas', 'paula');
      var idx = p.indice, idxSub = p.indiceSub, exib = p.exibido, exibSub = p.exibidoSub;
      if (scn === 'foraindice' && !p.resent) { idx = 'Falhou'; idxSub = 'fora do índice · erro às 14:32'; }
      if (scn === 'antigo' && !p.resent) { idx = 'Desconhecido'; idxSub = 'índice mostra v0 de 12/10; página está em ' + p.version; }
      if (scn === 'render') { exib = 'Falhou'; exibSub = 'renderização falhou às 14:33'; }
      var evOf = function (k, txt) { return ui.ev === k ? txt : ''; };
      var evBtn = function (k) { return function () { ctx.setUi({ ev: ui.ev === k ? '' : k }); }; };
      var consulted = (p.consults || 0) > 0 || !!ui.cq;
      var unknown = idx === 'Desconhecido';
      var canResend = !p.resent && (idx === 'Falhou' || (unknown && consulted));
      var consult = function () {
        p.consults = (p.consults || 0) + 1;
        ctx.setUi({ cq: U.now() });
        ctx.toast('Consultado às ' + U.now() + ': ' + (unknown ? 'o índice interno ainda não confirmou. Agora você pode reenviar.' : 'estado confirmado sem mudança.'));
      };
      var resend = function () {
        if (!canResend) { ctx.toast(p.resent ? 'Já reenviado. Use o recibo para desfazer.' : 'Resultado desconhecido: consulte antes de repetir.'); return; }
        O3.decide(ctx, { title: 'Reenviar ' + p.url + ' ao índice interno?', ok: 'Reenviar ao índice', scope: 'ops11a', action: 'Etapa encaminhada · índice interno', target: p.url,
          impact: ['Alcance: 1 URL, só a etapa “índice interno”.', 'Não republica a página nem muda a versão ' + p.version + '.', 'Índice interno não é o Google.'],
          apply: function () { p.resent = true; p.indice = 'Em andamento'; p.indiceSub = 'reenviado às ' + U.now(); }, rev: 'o3pageIdx', data: { id: p.id, indice: p.indice, indiceSub: p.indiceSub } });
      };
      var steps = [
        O3.step('Descoberto', p.descoberto, 'Confirmado', { ev: evOf('d', 'Registro do lote · linha conferida pela importação'), act: evBtn('d'), actLabel: 'Evidência' }),
        O3.step('Persistido', p.persistido, 'Confirmado', { ev: evOf('p', 'Gravação confirmada no banco do catálogo'), act: evBtn('p'), actLabel: 'Evidência' }),
        O3.step('Aprovado', p.aprovado, 'Confirmado', { ev: evOf('a', 'Recibo da decisão por finalidade (publicar + indexar)'), act: evBtn('a'), actLabel: 'Evidência' }),
        O3.step('Publicado', p.publicado, 'Confirmado', { ev: evOf('u', 'Página ' + p.url + ' respondeu 200 às 14:31'), act: evBtn('u'), actLabel: 'Evidência' }),
        O3.step('Índice interno', idxSub, idx, { ev: consulted ? 'Última consulta: ' + (ui.cq || 'antes') + ' · sem prova nova' : '', act: (idx === 'Confirmado' || p.resent) ? null : (canResend ? resend : consult), actLabel: canResend ? 'Reenviar' : 'Consultar' }),
        O3.step('Exibido', exibSub, exib, { ev: exib === 'Falhou' ? 'Encaminhe para a equipe de páginas: a etapa de publicação continua válida.' : '' })
      ];
      var alerts = [];
      if (scn === 'foraindice' && !p.resent) alerts.push(O3.alert('risk', 'Publicado fora do índice', 'A página está no ar, mas o índice interno recusou às 14:32. Reenvie só esta etapa.'));
      if (scn === 'antigo' && !p.resent) alerts.push(O3.alert('warn', 'Índice antigo', 'A busca interna ainda mostra a versão v0 de 12/10. Consulte antes de reenviar.'));
      if (scn === 'render') alerts.push(O3.alert('risk', 'Renderização falhou', 'A página publicada não renderizou para visitantes às 14:33. A publicação v1 continua registrada.', 'Encaminhar à equipe de páginas', function () { var r = O3.receipt({ scope: 'ops11a', action: 'Falha de renderização encaminhada', target: p.url, reason: 'Exibido falhou às 14:33' }); ctx.toast('Encaminhado · recibo ' + r.id); }));
      alerts.push(O3.alert('info', 'Índice interno não é o Google', 'Observação pública só como evidência, com data. Não dizemos “no Google” porque o sitemap saiu.'));
      var rc = O3.rcPack(ctx, 'ops11a');
      return {
        hasEyebrow: false, eyebrow: '', h1: 'Estado por etapa', sub: p.url,
        acts: [O3.btn(ctx, 'Consultar', consult), O3.btn(ctx, 'Reenviar ao índice', resend, { kind: 'btn--primary', dis: !canResend, why: p.resent || idx === 'Confirmado' ? 'Nada pendente no índice interno.' : 'Resultado desconhecido: consulte antes de repetir.' })],
        ctx: O3.ctx('publicacao.ler', 'Perfil · ' + p.name), alerts: alerts, steps: steps,
        showDec: canResend, decTitle: 'Encaminhar etapa pendente', hasImpact: true, impact: ['Alcance: 1 URL (' + p.url + '), só a etapa “índice interno”.', 'Pode ser desfeito pelo recibo.'],
        dec: O3.reason(ctx), decActs: [O3.btn(ctx, 'Reenviar ao índice', resend, { kind: 'btn--primary', size: 'btn--lg' })],
        rcs: rc.rcs, hasRcs: rc.hasRcs
      };
    }
  });

  // ---------- OPS11.B · revisão da retirada ----------
  REG.screen({
    page: 'operacao', key: 'ops11b', id: 'OPS11.B', title: 'Revisar retirada', mtitle: 'Retirada', nav: 'catalogo', back: 'OPS11',
    normal: 'Pedido do titular', scens: [['duplicado', 'Pedido duplicado'], ['escopo', 'Escopo mudou'], ['removido', 'Dado já removido'], ['semauth', 'Origem sem autorização atual']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn;
      var r = DB.find('o3_retiradas', 'R-41');
      var esc = scn === 'escopo';
      var alvo = esc ? 'perfil, 3 URLs, 0 fotos' : r.alvo;
      var done = r.status === 'confirmada';
      var blocked = done || scn === 'removido' || scn === 'semauth' || (esc && !ui.refreshed);
      var why = done ? 'Retirada já confirmada. Use o recibo para desfazer.' : (scn === 'removido' ? 'O dado já foi removido: não há o que retirar.' : (scn === 'semauth' ? 'A origem não tem autorização atual. Peça nova autorização.' : 'O escopo mudou: atualize a prévia antes de confirmar.'));
      var impact = ['Alvo: ' + alvo + ' (' + r.url + (esc ? ', /en/coach/marcos-lima e 1 relacionada' : ' e 1 relacionada') + ').', 'Destinos: ' + r.destinos + '.', 'Retido por política: ' + r.retido + '.', 'Reimportação ' + r.reimport + '.', 'Não exclui conta, contratos nem pagamentos.'];
      var confirm = function () {
        if (scn === 'duplicado') {
          var rr = O3.receipt({ scope: 'ops11b', action: 'Pedido #P-43 relacionado a #P-41', target: r.url, reason: 'Mesmo alvo e mesmo titular' });
          ctx.toast('Relacionado · recibo ' + rr.id + ' · nenhuma retirada nova'); return;
        }
        O3.decide(ctx, { title: 'Confirmar retirada de ' + r.url + '?', ok: 'Confirmar retirada', scope: 'ops11b', action: 'Retirada confirmada (' + r.id + ')', target: r.pedido + ' · ' + r.url,
          impact: impact, apply: function () { r.status = 'confirmada'; DB.o3_catalogo.publicados -= 1; }, rev: 'o3ret', data: { id: r.id, status: r.status, pub: 1 },
          after: function () { ctx.setUi({ okd: true }); } });
      };
      var alerts = [];
      if (scn === 'duplicado') alerts.push(O3.alert('warn', 'Pedido duplicado', '#P-43 pede a mesma retirada de #P-41. Relacione os pedidos; não crie outra operação.'));
      if (esc && !ui.refreshed) alerts.push(O3.alert('warn', 'Escopo mudou', 'Uma URL em inglês entrou no alvo depois da prévia. Atualize antes de confirmar.', 'Atualizar prévia', function () { ctx.setUi({ refreshed: true }); ctx.toast('Prévia atualizada · 3 URLs'); }));
      if (scn === 'removido') alerts.push(O3.alert('info', 'Dado já removido', 'O perfil saiu em 24/10 por outra operação (R-39). Encerre o pedido com referência, sem nova retirada.', 'Encerrar com referência', function () { var rr = O3.receipt({ scope: 'ops11b', action: 'Pedido encerrado sem nova retirada', target: r.pedido, reason: 'Já removido por R-39' }); ctx.toast('Pedido encerrado · recibo ' + rr.id); }));
      if (scn === 'semauth') alerts.push(O3.alert('risk', 'Origem sem autorização atual', 'A procuração de quem pediu venceu em 20/10. Peça nova autorização antes de retirar.', 'Pedir nova autorização', function () { var rr = O3.receipt({ scope: 'ops11b', action: 'Nova autorização pedida', target: r.pedido, reason: 'Procuração vencida em 20/10' }); ctx.toast('Pedido enviado · recibo ' + rr.id); }));
      if (done) alerts.push(O3.alert('ok', 'Retirada confirmada', 'A propagação começou. Acompanhe cada destino; serviços externos podem levar mais tempo.', 'Acompanhar propagação', function () { GO('OPS11.C', { id: r.id }); }));
      var rc = O3.rcPack(ctx, 'ops11b');
      return {
        hasEyebrow: false, eyebrow: '', h1: 'Revisar retirada', sub: r.pedido + ' · ' + r.url,
        acts: [O3.btn(ctx, scn === 'duplicado' ? 'Relacionar ao #P-41' : 'Confirmar retirada', confirm, { kind: 'btn--primary', dis: blocked && scn !== 'duplicado', why: why })],
        ctx: O3.ctx('publicacao.retirar', 'Perfil importado'), alerts: alerts,
        kv: [O3.kv('Origem', r.origem), O3.kv('Alvo', alvo), O3.kv('Destinos', r.destinos), O3.kv('Retido por política', r.retido), O3.kv('Reimportação', r.reimport)],
        decTitle: 'Alcance público', hasImpact: true, impact: impact, dec: O3.reason(ctx, 'Fundamento da retirada'),
        decActs: [O3.btn(ctx, scn === 'duplicado' ? 'Relacionar ao #P-41' : 'Confirmar retirada', confirm, { kind: 'btn--primary', size: 'btn--lg', dis: blocked && scn !== 'duplicado', why: why })],
        rcs: rc.rcs, hasRcs: rc.hasRcs
      };
    }
  });

  // ---------- OPS11.C · propagação e recuperação ----------
  REG.screen({
    page: 'operacao', key: 'ops11c', id: 'OPS11.C', title: 'Propagação', nav: 'catalogo', back: 'OPS11', testIds: ['R-38'],
    normal: 'Cópia antiga observada', scens: [['parcial', 'Parcial'], ['atraso', 'Atraso'], ['limite', '429 · consultas limitadas'], ['desconhecido', 'Resultado desconhecido']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn;
      var r = DB.find('o3_retiradas', ctx.id) || DB.find('o3_retiradas', 'R-41');
      var n = r.consults || 0;
      var limited = scn === 'limite' || n >= r.limit;
      var cdn = n >= 2 ? 'Confirmado' : r.cdn, cdnSub = n >= 2 ? 'CDN · limpo às ' + (ui.cq || '15:02') : 'CDN';
      if (scn === 'parcial' && !ui.fwd) { cdn = 'Falhou'; cdnSub = 'CDN · 2 de 3 regiões limparam'; }
      if (scn === 'parcial' && ui.fwd) { cdn = 'Em andamento'; cdnSub = 'CDN · correção encaminhada na mesma operação'; }
      if (scn === 'atraso' && n < 2) cdnSub = 'CDN · em andamento há 2 h (previsto: 30 min)';
      var busca = scn === 'desconhecido' && n < 1 ? 'Desconhecido' : 'Confirmado';
      var buscaSub = busca === 'Desconhecido' ? 'sem resposta desde 14:41' : r.busca;
      var consult = function () {
        if (limited) { ctx.toast('Limite de ' + r.limit + ' consultas por hora atingido. Próxima consulta às 15:40.'); return; }
        r.consults = n + 1;
        ctx.setUi({ cq: U.now() });
        ctx.toast('Consulta ' + r.consults + ' de ' + r.limit + ' às ' + U.now() + (r.consults >= 2 ? ': cache confirmado.' : ': ainda em andamento.'));
      };
      var forward = function () {
        if (busca === 'Desconhecido') { ctx.toast('Resultado desconhecido: consulte antes de encaminhar de novo.'); return; }
        var rr = O3.receipt({ scope: 'ops11c', action: 'Correção encaminhada na mesma operação ' + r.id, target: 'Mídia e cache · CDN', reason: 'Falha parcial: 1 região sem limpeza' });
        ctx.setUi({ fwd: true }); ctx.toast('Encaminhado · recibo ' + rr.id);
      };
      var steps = [
        O3.step('Banco', r.banco, 'Confirmado'),
        O3.step('Busca interna', buscaSub, busca),
        O3.step('Mídia e cache', cdnSub, cdn, scn === 'parcial' && !ui.fwd ? { act: forward, actLabel: 'Encaminhar correção' } : null),
        O3.step('Observação pública', r.publica === '—' ? 'sem observação' : r.publica, 'Desconhecido', { ev: 'Serviços externos atualizam no ritmo deles; não prometemos remoção imediata.' }),
        O3.step('Supressão de reimportação', r.reimport.replace('suprimida para ', ''), 'Confirmado')
      ];
      var alerts = [];
      if (scn === 'parcial' && !ui.fwd) alerts.push(O3.alert('risk', 'Parcial', 'Uma região da CDN não limpou o cache. Encaminhe a correção na mesma operação ' + r.id + '.', 'Abrir falha', function () { ctx.setUi({ open: !ui.open }); }));
      if (scn === 'parcial' && ui.open && !ui.fwd) alerts.push(O3.alert('info', 'Detalhe da falha', 'Região sul-1 respondeu 503 às 14:57. As demais confirmaram às 14:55.'));
      if (scn === 'atraso') alerts.push(O3.alert('warn', 'Atraso', 'A limpeza de cache passou do previsto. Consulte de novo; não abra outra retirada.'));
      if (limited) alerts.push(O3.alert('warn', '429 · consultas limitadas', 'O provedor limitou consultas. Próxima consulta às 15:40; o estado mostrado é o último confirmado.'));
      if (scn === 'desconhecido' && n < 1) alerts.push(O3.alert('warn', 'Resultado desconhecido', 'A busca interna não respondeu. Consulte antes de repetir qualquer etapa.', 'Consultar de novo', consult));
      var rc = O3.rcPack(ctx, 'ops11c');
      return {
        hasEyebrow: false, eyebrow: '', h1: 'Propagação', sub: 'Retirada de ' + r.url,
        acts: [O3.btn(ctx, 'Consultar de novo', consult, { kind: 'btn--primary', dis: limited, why: 'Limite de consultas atingido. Próxima às 15:40.' })],
        ctx: O3.ctx('publicacao.ler', 'Operação ' + r.id), alerts: alerts, steps: steps,
        quota: 'Consultas nesta hora: ' + Math.min(n, r.limit) + ' de ' + r.limit + (ui.cq ? ' · última às ' + ui.cq : ''),
        rcs: rc.rcs, hasRcs: rc.hasRcs
      };
    }
  });
})();
