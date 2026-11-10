/* O3 · Operação (Lia Moura): catálogo, quarentena, publicação, SEO, vitrines e governança de IA.
   Utilidades comuns às telas 30-* e dados de exemplo (coleções o3_*). Tudo fictício / sintético.
   Regras: decisão sensível pede motivo, mostra impacto e gera recibo auditável (com desfazer quando a ação é reversível);
   resultado desconhecido é consultado antes de repetir. */
(function () {
  'use strict';
  var DB = window.DB, U = window.U;
  var noop = function () {};
  var O3 = {};
  window.O3 = O3;
  O3.WHEN = '26/10 · 14:02 BRT';
  O3.ME = 'Lia M.';
  O3.noop = noop;

  // barra de contexto (Ambiente · Capacidade · Alvo · Atualizado)
  O3.ctx = function (cap, alvo, upd) {
    return [{ k: 'Ambiente', v: 'Produção · dados sintéticos' }, { k: 'Capacidade', v: cap }, { k: 'Alvo', v: alvo }, { k: 'Atualizado', v: upd || O3.WHEN }];
  };
  var ST = { 'Confirmado': 'badge--ok', 'Em andamento': 'badge--info', 'Desconhecido': 'badge--warn', 'Falhou': 'badge--risk', 'Na fila': 'badge--plain', 'Pendente': 'badge--plain', 'Bloqueado': 'badge--risk', 'Cancelando': 'badge--info', 'Pausado': 'badge--warn' };
  O3.badge = function (st) { return 'badge ' + (ST[st] || 'badge--plain'); };
  O3.tone = function (txt) {
    var t = U.norm(txt);
    if (/nao homolog|nao gerada|nao observ|sem prova/.test(t)) return 'badge badge--warn';
    if (/falh|bloque|nao$|^nao|suspens|incidente|reprov|critic|sem direito|risco/.test(t)) return 'badge badge--risk';
    if (/paus|pend|descon|faltando|fallback|restrit|revisar|sem evid|insuf|aguard|duplicata|nao homolog|sem tradu|proposta/.test(t)) return 'badge badge--warn';
    if (/andamento|fila|gerando|cancelando/.test(t)) return 'badge badge--info';
    if (/ativ|confirm|homolog|sim$|^sim|ok|incluida|aprovad|publicad|conferida|retomad/.test(t)) return 'badge badge--ok';
    return 'badge badge--plain';
  };
  O3.alert = function (kind, title, text, actLabel, act) {
    var ic = kind === 'ok' ? 'check' : (kind === 'info' ? 'info' : 'alert');
    return { cls: 'alert alert--' + kind, ic: 'ic ic--sm i-' + ic, title: title, text: text || '', hasAct: !!act, actLabel: actLabel || '', act: act || noop };
  };
  // botão de ação; bloqueado explica o motivo em vez de agir
  O3.btn = function (ctx, label, fn, opt) {
    opt = opt || {};
    var dis = !!opt.dis;
    return {
      label: label, dis: String(dis),
      cls: 'btn ' + (opt.kind || 'btn--outline') + ' ' + (opt.size || 'btn--sm') + (dis ? ' o3-dis' : ''),
      go: function (e) { if (dis) { ctx.toast(opt.why || 'Ação indisponível nesta situação.'); return; } (fn || noop)(e); }
    };
  };
  O3.step = function (name, sub, st, o) {
    o = o || {};
    return { name: name, sub: sub || '', st: st, badge: O3.badge(st), cls: 'o3-step o3-step--' + (ST[st] || 'badge--plain').replace('badge--', ''),
      hasEv: !!o.ev, ev: o.ev || '', hasAct: !!o.act, actLabel: o.actLabel || '', act: o.act || noop };
  };
  O3.kv = function (k, v, badge) { return { k: k, v: v, hasBadge: !!badge, noBadge: !badge, badge: badge || '', badgeCls: badge ? O3.tone(badge) : '' }; };

  // lista → detalhe: no celular, a lista some quando há seleção (CSS .o3-ld.has-sel)
  O3.ld = function (ctx, items, key, def) {
    key = key || 'sel';
    var sel = ctx.ui[key] || '';
    var byId = function (id) { return id ? items.find(function (x) { return x.id === id; }) : null; };
    var cur = byId(sel) || byId(def) || items[0] || null;
    return {
      cur: cur, picked: !!sel, ldCls: 'o3-ld' + (sel ? ' has-sel' : ''),
      pick: function (id) { return function () { var o = {}; o[key] = id; ctx.setUi(o); }; },
      toList: function () { var o = {}; o[key] = ''; ctx.setUi(o); },
      rowCls: function (id) { return 'o3-row' + (cur && cur.id === id ? ' is-on' : ''); }
    };
  };

  // ---------- decisão com motivo, impacto e recibo ----------
  O3.reason = function (ctx, label, help) {
    var ui = ctx.ui;
    return {
      label: label || 'Motivo da decisão', help: help || 'Obrigatório. Vai para o recibo auditável com seu nome e horário.',
      reason: ui.reason || '', setReason: function (e) { ctx.setUi({ reason: U.val(e), err: '' }); },
      hasErr: !!ui.err, err: ui.err || '', inCls: 'input input--area' + (ui.err ? ' is-err' : '')
    };
  };
  // o: { title, text, impact:[], ok, danger, scope, action, target, apply(), rev, data, undo(bool), done, after() }
  O3.decide = function (ctx, o) {
    var r = String(ctx.ui.reason || '').trim();
    if (r.length < 5) { ctx.setUi({ err: 'Escreva o motivo (pelo menos 5 caracteres). Ele fica no recibo auditável.' }); return; }
    var rev = o.undo !== false;
    ctx.ask({
      title: o.title, text: o.text || 'Confira o alcance antes de confirmar.',
      lines: (o.impact || []).concat(['Motivo: ' + r, rev ? 'Gera recibo auditável e pode ser desfeito pelo recibo.' : 'Gera recibo auditável.']),
      ok: o.ok || 'Confirmar', danger: !!o.danger,
      onOk: function () {
        if (o.apply) o.apply();
        var rc = O3.receipt({ scope: o.scope, action: o.action || o.ok, target: o.target, reason: r, rev: o.rev || '', data: o.data || null, undo: rev });
        ctx.setUi({ reason: '', err: '', last: rc.id });
        ctx.toast('Recibo ' + rc.id + ' registrado · ' + (o.done || o.action || o.ok));
        if (o.after) o.after(rc);
      }
    });
  };
  O3.REV = {};
  O3.rev = function (name, fn) { O3.REV[name] = fn; };
  O3.receipt = function (o) {
    var list = DB.o3_recibos;
    var rc = { id: 'RC-' + (2041 + list.length), scope: o.scope || '', action: o.action || '', target: o.target || '', reason: o.reason || '', who: O3.ME, when: '26/10 · ' + U.now(),
      rev: o.rev || '', data: o.data || null, undo: !!o.undo, undone: false };
    list.unshift(rc);
    return rc;
  };
  O3.receipts = function (ctx, scope) {
    return DB.o3_recibos.filter(function (rc) { return rc.scope === scope; }).map(function (rc) {
      var can = rc.undo && !rc.undone && !!O3.REV[rc.rev];
      return {
        id: rc.id, title: rc.action + (rc.target ? ' · ' + rc.target : ''), meta: rc.who + ' · ' + rc.when + (rc.undone ? ' · desfeito' : ''),
        reason: 'Motivo: ' + rc.reason, hasUndo: can, cls: 'o3-rc' + (rc.undone ? ' is-undone' : ''),
        undo: function () {
          ctx.ask({
            title: 'Desfazer ' + rc.id + '?', text: 'Volta ao estado anterior a “' + rc.action + '”. A reversão também gera recibo.',
            lines: ['Alvo: ' + (rc.target || '—'), 'O recibo original continua no histórico'], ok: 'Desfazer',
            onOk: function () {
              if (!can) return;
              O3.REV[rc.rev](rc.data || {}, rc);
              rc.undone = true;
              var r2 = O3.receipt({ scope: rc.scope, action: 'Reversão de ' + rc.id, target: rc.target, reason: 'Desfeito pela operação a partir do recibo', undo: false });
              ctx.toast('Recibo ' + r2.id + ' · “' + rc.action + '” desfeito');
            }
          });
        }
      };
    });
  };
  // devolve o pacote padrão de recibos para o template
  O3.rcPack = function (ctx, scope) { var l = O3.receipts(ctx, scope); return { rcs: l, hasRcs: l.length > 0 }; };

  // ---------- dados de exemplo ----------
  DB.seed('o3_recibos', [
    { id: 'RC-2040', scope: 'ops13c', action: 'Ativar regra v5', target: 'Vitrine “Perto de você”', reason: 'Avaliação v5 aprovada; sem sinais de receita nem saúde', who: 'Lia M.', when: '01/10 · 10:12', rev: '', data: null, undo: false, undone: false }
  ]);
  // fontes e direitos por finalidade (cada dimensão é independente)
  DB.seed('o3_fontes', [
    { id: 'fx', name: 'Federação X', coletar: 'sim', publicar: 'sim', indexar: 'sim', foto: 'não', note: 'licença sem foto · evidência de 02/10' },
    { id: 'ay', name: 'Academia Y', coletar: 'sim', publicar: 'pausa', indexar: 'pausa', foto: 'não', note: 'contrato em revisão desde 20/10' },
    { id: 'lz', name: 'Liga Z', coletar: '—', publicar: '—', indexar: '—', foto: '—', note: 'sem evidência de direito · nada importado' }
  ]);
  DB.seed('o3_catalogo', { fontes: 6, fontesPend: 2, fotoSemLic: 1, lote: 'L-81', loteN: 240, loteErr: 3, loteDup: 12, quarentena: 225, revisarId: 41, publicados: 188, indiceDesde: '14:31',
    pub: { lote: 'L-19', descoberto: 240, aprovado: 225, publicado: 225, indice: 220, falhas: 5, google: 'sem evidência', when: '26/10 · 14:31', retry: false } });
  // candidatos em quarentena (importados: nunca aparecem como usuário ativo nem verificado)
  DB.seed('o3_candidatos', [
    { id: 'c_5512', name: 'Marcos Lima', short: 'Marcos L.', origem: 'Federação X', lote: 'L-81', linha: 55, motivo: 'duplicata provável', pendente: 'identidade', resp: 'Caio', city: 'Campinas', mod: 'Funcional', status: 'quarentena', next: 'Revisar identidade',
      match: { name: 'Marcos A. Lima', city: 'Campinas', mod: 'Funcional, Corrida', owner: 'u_8812' }, prov: { name: 'Federação X', city: 'ambos', mod: 'perfil próprio' } },
    { id: 'c_5530', name: 'Paula N.', short: 'Paula N.', origem: 'Federação X', lote: 'L-81', linha: 71, motivo: 'foto sem direito', pendente: 'foto', resp: '—', city: 'Campinas', mod: 'Funcional', status: 'quarentena', next: 'Decidir por finalidade',
      scope: { identidade: 'conferida', publicar: 'aprovar', indexar: 'aprovar', foto: 'não' } },
    { id: 'c_5541', name: 'J. Souza', short: 'J. Souza', origem: 'Academia Y', lote: 'L-81', linha: 102, motivo: 'fonte suspensa', pendente: 'tudo', resp: '—', city: 'Londrina', mod: 'Musculação', status: 'quarentena', next: 'Aguardar a fonte' },
    { id: 'c_5547', name: 'Renata P.', short: 'Renata P.', origem: 'Federação X', lote: 'L-81', linha: 118, motivo: 'sem dados suficientes', pendente: 'cidade e modalidade', resp: '—', city: '—', mod: '—', status: 'quarentena', next: 'Devolver para complemento' }
  ]);
  // páginas de perfil publicadas (estado por etapa)
  DB.seed('o3_paginas', [
    { id: 'paula', name: 'Paula N.', url: '/paula-n-campinas', cand: 'c_5530', version: 'v1', descoberto: 'L-81 · 26/10 14:10', persistido: '14:11', aprovado: 'Caio · 14:30', publicado: 'v1 · 14:31', indice: 'Desconhecido', indiceSub: 'sem prova desde 14:31', exibido: 'Desconhecido', exibidoSub: 'não observado', consults: 0, resent: false },
    { id: 'marcos', name: 'Marcos Lima', url: '/marcos-lima-campinas', cand: 'c_5512', version: 'v1', descoberto: 'L-19 · 12/10 09:02', persistido: '09:03', aprovado: 'Lia · 12/10 10:20', publicado: 'v1 · 12/10 10:21', indice: 'Confirmado', indiceSub: '12/10 10:40', exibido: 'Confirmado', exibidoSub: 'busca interna · 12/10 10:41', consults: 0, resent: false }
  ]);
  // retiradas (pedido de origem, alcance, destinos e propagação)
  DB.seed('o3_retiradas', [
    { id: 'R-41', pedido: '#P-41', url: '/marcos-lima-campinas', origem: '#P-41 · titular sem conta', alvo: 'perfil, 2 URLs, 0 fotos', urls: 2, destinos: 'página, busca interna, sitemap', retido: 'registro do pedido · 5 anos', reimport: 'suprimida para Federação X',
      status: 'em revisão', banco: '14:40', busca: '14:41', cdn: 'Em andamento', publica: 'cópia antiga vista 14:50', consults: 0, limit: 3 },
    { id: 'R-38', pedido: '#P-38', url: 'Academia Y · 41 perfis', origem: '#P-38 · fonte suspensa', alvo: '41 perfis importados', urls: 41, destinos: 'página, busca interna, sitemap', retido: 'registro do pedido · 5 anos', reimport: 'suprimida para Academia Y',
      status: 'propagando', done: 12, banco: '13:10', busca: '13:12', cdn: 'Em andamento', publica: '—', consults: 0, limit: 3 }
  ]);
  // SEO: URLs, diagnóstico e geração
  DB.seed('o3_urls', [
    { id: 'u1', url: '/personal/campinas/corrida', tipo: 'cidade × modalidade', locale: 'PT', eleg: 'sim · 8 perfis', canonical: 'própria', canonUrl: '/personal/campinas/corrida', idiomas: 'pt · en · es', hreflang: 'PT ✓ · EN ✓ · ES ✓', sitemap: 'incluída', status: '200', exclusao: '—', verif: '26/10 13:00', st: 'ok' },
    { id: 'u2', url: '/es/entrenadores/campinas/funcional', tipo: 'cidade × modalidade', locale: 'ES', eleg: 'sim · 12 perfis', canonical: 'própria', canonUrl: '/entrenadores/campinas/funcional', idiomas: 'pt · en · es', hreflang: 'PT ✓ · EN ✓ · ES ✓', sitemap: 'incluída', status: '200', exclusao: '—', verif: '26/10 13:00', st: 'fallback', note: 'Descrição ES usa fallback PT.' },
    { id: 'u3', url: '/personal/sobral/natacao', tipo: 'cidade × modalidade', locale: 'PT', eleg: 'não · 0 perfis', canonical: '—', canonUrl: '—', idiomas: '—', hreflang: '—', sitemap: 'excluída', status: '404', exclusao: 'nenhum perfil elegível', verif: '26/10 13:00', st: 'excluida' },
    { id: 'u4', url: '/treinadores/cambe/yoga', tipo: 'cidade × modalidade', locale: 'PT', eleg: 'não · 0 perfis', canonical: '—', canonUrl: '—', idiomas: '—', hreflang: '—', sitemap: 'não gerada', status: '—', exclusao: 'nenhum perfil elegível · não criamos página vazia', verif: '26/10 13:00', st: 'excluida' }
  ]);
  DB.seed('o3_geracao', { job: 'G-14', version: 'v14', total: 38, done: 24, valid: '38/38', active: 'v13', since: '20/10', resp: 'Lia M.', state: 'andamento', activation: 'Na fila', esFallback: 7, approved: false,
    rows: [
      { id: 'g1', loc: 'PT', url: '/treinadores/campinas/calistenia', muda: 'nova', evid: '18 perfis elegíveis', antes: '— (não existe)', depois: 'Treinadores de calistenia em Campinas', ok: true, on: true },
      { id: 'g2', loc: 'PT', url: '/treinadores/campinas/funcional', muda: 'título', evid: 'base v7', antes: 'Personal funcional em Campinas', depois: 'Treinadores de funcional em Campinas', ok: true, on: true },
      { id: 'g3', loc: 'EN', url: '/en/trainers/campinas/yoga', muda: 'sem tradução', evid: '—', antes: '—', depois: '(sem tradução EN aprovada)', ok: false, on: false },
      { id: 'g4', loc: 'EN', url: '/en/trainers/campinas/functional', muda: 'título', evid: 'base v7', antes: 'Functional trainers Campinas', depois: 'Functional training coaches in Campinas', ok: true, on: true },
      { id: 'g5', loc: 'ES', url: '/es/entrenadores/campinas/funcional', muda: 'descrição', evid: 'fallback PT', antes: 'Descrição em PT (fallback)', depois: 'Entrenadores de funcional en Campinas', ok: true, on: true }
    ] });
  // vitrines e experimentos
  DB.seed('o3_vitrines', [
    { id: 'mais', name: 'Mais contratados · 30 dias', regra: 'v2', cob: '100%', estado: 'ativa', exp: false, fin: 'mostrar quem mais concluiu contratações nos últimos 30 dias', sinais: 'contratações concluídas em 30 dias (sem valor pago)', nao: 'não usa receita, plano Pro nem dados de saúde', prev: 'v1', since: '05/10' },
    { id: 'perto', name: 'Perto de você', regra: 'v5', cob: '100%', estado: 'ativa', exp: false, fin: 'variedade elegível perto do local escolhido', sinais: 'distância, avaliações elegíveis, recência', nao: 'Pro não compra posição', prev: 'v4', since: '01/10' },
    { id: 'resp', name: 'Teste: ordem por resposta', regra: 'A/B', cob: '10%', estado: 'pausado', exp: true, fin: 'testar ordem por tempo de resposta', sinais: 'tempo mediano de resposta', nao: 'não usa receita, plano Pro nem dados de saúde', janela: '05/10–19/10', amostra: '1 210 sessões', prev: 'v5', since: '19/10' },
    { id: 'e12', name: 'E-12 · recência × distância', regra: 'A/B', cob: '50% · 50%', estado: 'em andamento', exp: true, fin: 'recência aumenta pedidos enviados', sinais: 'distância, recência', nao: 'não usa receita, plano Pro nem dados de saúde', janela: '12/10–26/10', amostra: '8 206 sessões', prev: 'v5', since: '12/10' }
  ]);
  DB.seed('o3_vitrineRegra', { id: 'perto', active: 'v5', proposed: 'v6', proposedAt: '24/10', proposedState: 'aguardando alçada', retired: 'v4', retiredAt: '01/10', effective: 'v5 · fallback desligado', pauseCond: 'menos de 6 perfis elegíveis', paused: false });
  // governança de IA (somente capacidades do treinador; aluno não tem IA)
  DB.seed('o3_ia', [
    { id: 'revisar', name: 'Revisar treino', ver: 'v4', aval: '92% aceitas c/ edição', avalSrc: 'avaliação de 20/10 · 120 cenários', estado: 'ativa', publico: 'treinador', entradas: 'rotina montada pelo treinador', fin: 'apontar inconsistências antes de o treinador publicar', lim: 'política FA07.C', inc: '' },
    { id: 'pdf', name: 'Importar PDF', ver: 'v2', aval: 'incidente #I-7', avalSrc: 'aberto em 24/10 · 09:15', estado: 'pausada', publico: 'treinador', entradas: 'PDF enviado pelo treinador', fin: 'transformar planilha em rascunho editável', lim: 'política FA07.C', inc: '#I-7' },
    { id: 'rascunho', name: 'Rascunho de treino', ver: 'p-7', aval: '112/120 aprovados', avalSrc: 'avaliação p-8 de 25/10', estado: 'homologada', publico: 'treinador', entradas: 'anamnese + histórico do aluno', fin: 'sugerir rascunho que o treinador revisa', lim: 'política FA07.C', inc: 'INC-9' },
    { id: 'checkin', name: 'Resumo de check-in', ver: 'p-3', aval: 'restrita · 20 treinadores', avalSrc: 'piloto desde 10/10', estado: 'restrita · 20 treinadores', publico: 'treinador', entradas: 'respostas do formulário', fin: 'resumir respostas para o treinador ler', lim: 'política FA07.C', inc: '' },
    { id: 'progressao', name: 'Sugestão de progressão', ver: 'p-1', aval: 'sem avaliação', avalSrc: 'proposta de 22/10', estado: 'não homologada', publico: 'treinador', entradas: 'cargas registradas', fin: 'sugerir próxima carga para o treinador decidir', lim: 'política FA07.C', inc: '' }
  ]);
  DB.seed('o3_incidente', { id: 'INC-9', title: 'fornecedor degradado', cap: 'Rascunho de treino', last: '13:52', jobs: '4 em curso · 11 na fila', paused: true, pausedAt: '14:00', accepted: 'custo a conciliar', reservas: 'devolvidas', consults: 0, forwarded: false, resumed: false });
})();
