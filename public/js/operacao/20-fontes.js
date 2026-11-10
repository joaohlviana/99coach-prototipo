/* O2 · OPS08 Fontes autorizadas e direitos (+ .A registro, .B matriz de direitos, .C revisão, .D suspensão ou revogação)
   Cada direito (coletar, armazenar, publicar, indexar, reutilizar foto) é independente; aprovar fonte não autoriza imagens;
   descobrir contato não cria conta nem consentimento. */
(function () {
  'use strict';
  var S = O2.S;
  var F = function (id) { return O2.find('o2_fontes', id); };
  var RIGHTS = [['coletar', 'Coletar'], ['armazenar', 'Armazenar'], ['publicar', 'Publicar'], ['indexar', 'Indexar'], ['foto', 'Reutilizar foto']];
  var mark = function (v) { return v === 'sim' ? { b: 'sim' } : v === 'em revisão' ? { b: 'em revisão' } : { b: 'não', cls: 'badge--plain' }; };
  var pend = function (f) { return f.state === 'rascunho' || f.state === 'vencida' || f.state === 'sem evidência'; };

  // ---------- OPS08 · composição ----------
  O2.screen({
    key: 'ops08', id: 'OPS08', title: 'Fontes e direitos', mtitle: 'Fontes', nav: 'catalogo', back: 'H16', wide: true, cap: 'fontes.ler', alvo: 'Fontes e direitos',
    scens: [['semfoto', 'Foto sem licença'], ['suspensa', 'Suspensa'], ['evidencia', 'Evidência vence']],
    make: function (ctx) {
      var scn = ctx.scn;
      var rows = DB.o2_fontes.filter(function (f) { return f.state !== 'rascunho'; }).map(function (f) {
        var st = scn === 'suspensa' && f.id === 'ay' ? 'suspensa' : f.state;
        return { cells: [f.label || f.name, mark(f.rights.coletar.ok), mark(f.rights.publicar.ok), mark(f.rights.indexar.ok), mark(f.rights.foto.ok), f.valid, { b: st }], go: function () { GO('OPS08.B', { id: f.id }); },
          mt: f.kind + ' · ' + f.name, ms: 'coletar ' + (f.rights.coletar.ok === 'sim' ? '✓' : '—') + ' · publicar ' + (f.rights.publicar.ok === 'sim' ? '✓' : '—') + ' · foto ' + (f.rights.foto.ok === 'sim' ? '✓' : '—'), mb: st };
      });
      var notes = [];
      if (scn === 'semfoto') notes.push(S.note('warn', 'Foto sem licença', 'Federação X autoriza publicar, não reutilizar foto. Os perfis dela saem sem imagem, com monograma.', [['Saiba por quê', function () { ctx.ask({ title: 'Por que o perfil sai sem foto', lines: ['Cada direito é separado: publicar o perfil não inclui a foto.', 'Foto só com licença específica e prova.', 'Quando o treinador reivindicar o perfil, ele mesmo envia a foto.'], ok: 'Entendi', cancel: false }); }]]));
      if (scn === 'suspensa') notes.push(S.note('risk', 'Suspensa', 'Academia Y está suspensa desde 14:00: novas obtenções paradas; perfis já publicados saem em lotes.', [['Escopo do efeito', function () { GO('OPS08.D', { id: 'ay' }); }]]));
      if (scn === 'evidencia') notes.push(S.note('warn', 'Evidência vence', 'O contrato da Associação V vence em 05/2027. Sem renovação, a fonte para de coletar no dia seguinte.', [['Consultar de novo', function () { ctx.toast('Associação V · contrato até 31/05/2027 · nenhuma renovação anexada.'); }]]));
      return {
        acts: [S.act('Registro de fontes', function () { GO('OPS08.A'); }, 'ghost'), S.act('Nova fonte', function () { GO('OPS08.A', { novo: '1' }); }, 'primary')],
        notes: notes,
        blocks: [
          S.table('', ['Fonte', 'Coletar', 'Publicar', 'Indexar', 'Foto', 'Vigência', 'Estado'], rows),
          S.alert('plain', 'Aprovar fonte não autoriza imagens', 'Cada direito tem evidência, vigência e estado próprios. Descobrir contato não cria conta nem consentimento.'),
          S.rows('Revisões e suspensões', [
            { ic: 'edit', t: 'Revisar fonte · Academia Y', s: 'proposta de escopo · ' + (F('ay').proposal.status), go: function () { GO('OPS08.C', { id: 'ay' }); } },
            { ic: 'pause', t: 'Suspender ou revogar · Academia Y', s: 'publicar e indexar · ' + F('ay').revoke.removed + ' de ' + F('ay').revoke.total + ' retirados', go: function () { GO('OPS08.D', { id: 'ay' }); } },
            { ic: 'upload', t: 'Importação de parceiro', s: 'lote ' + DB.o2_imp.lote + ' · ' + DB.o2_imp.file, go: function () { GO('OPS09'); } }
          ])
        ]
      };
    }
  });

  // ---------- OPS08.A · Registro de fontes ----------
  O2.screen({
    key: 'ops08a', id: 'OPS08.A', title: 'Fontes autorizadas', mtitle: 'Registro de fontes', nav: 'catalogo', back: 'OPS08', wide: true, cap: 'fontes.ler', alvo: 'Registro de fontes',
    scens: [['semevidencia', 'Sem evidência'], ['vencida', 'Autorização vencida'], ['revogada', 'Revogada'], ['indisponivel', 'Registro indisponível']],
    make: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn;
      if (scn === 'indisponivel') return { head: { sub: 'Registro fora do ar' }, blocks: [S.empty('alert', 'Registro de fontes indisponível', 'Não conclua que uma fonte não existe. Tente de novo; enquanto isso, nenhuma importação nova começa.', 'Tentar de novo', function () { ctx.toast('Ainda indisponível · tente em alguns minutos.'); })] };
      var novo = ui.novo != null ? ui.novo : ctx.p.novo === '1';
      var f = ui.f || 'todas', q = U.norm(ui.q || '');
      var list = DB.o2_fontes.filter(function (x) { return (f === 'todas' || (f === 'ativas' ? x.state === 'ativa' : pend(x))) && (!q || U.norm(x.name).indexOf(q) >= 0); });
      var rows = list.map(function (x) {
        var st = scn === 'revogada' && x.id === 'ay' ? 'revogada' : x.state;
        var ev = scn === 'semevidencia' && x.id === 'cw' ? '—' : x.evid;
        return { cells: [x.name, x.market, x.purpose, x.resp, ev, x.valid, { b: st }], go: function () { GO('OPS08.B', { id: x.id }); }, mt: x.name, ms: x.market + ' · ' + (st === 'ativa' ? 'ativa até ' + x.valid : st === 'sem foto' ? 'sem licença de foto' : st), mb: st };
      });
      var notes = [];
      if (scn === 'semevidencia') notes.push(S.note('warn', 'Sem evidência', 'Clube W está sem contrato anexado. Sem evidência, a fonte não coleta nem publica.'));
      if (scn === 'vencida') notes.push(S.note('risk', 'Autorização vencida', 'Rede Q venceu em 01/2026. Nada novo entra; o que já foi publicado segue a política de retirada.', [['Ver matriz', function () { GO('OPS08.B', { id: 'rq' }); }]]));
      if (scn === 'revogada') notes.push(S.note('risk', 'Revogada', 'Academia Y teve publicar e indexar revogados. Retirada em andamento.', [['Acompanhar', function () { GO('OPS08.D', { id: 'ay' }); }]]));
      var total = DB.o2_fontes.length, np = DB.o2_fontes.filter(pend).length;
      var chip = function (k, l) { return { label: l, on: f === k, chip: true, go: function () { ctx.setUi({ f: k }); } }; };
      var blocks = [];
      if (novo) {
        blocks.push(S.field('nname', 'Nome da fonte', O2.uv(ctx, 'nname', ''), O2.setter(ctx, 'nname'), { card: true, title: 'Nova fonte (rascunho)', ph: 'Ex.: Federação Paranaense de Atletismo', err: ui.nnameErr ? 'Dê um nome à fonte.' : '' }));
        blocks.push(S.opts('Mercado', ['BR', 'AR', 'PT'].map(function (m) { return { label: m, on: (ui.nm || 'BR') === m, chip: true, go: function () { ctx.setUi({ nm: m }); } }; }), 'Rascunho não coleta nada. Direitos, evidência e responsável vêm depois, cada um com prova.'));
        blocks.push(S.btns([S.act('Salvar rascunho', function () {
          var n = String(O2.uv(ctx, 'nname', '')).trim();
          if (!n) return ctx.setUi({ nnameErr: true });
          DB.o2_fontes.push({ id: DB.uid('f'), name: n, market: ui.nm || 'BR', purpose: 'diretório', resp: '—', evid: '—', valid: '—', state: 'rascunho', kind: 'Parceiro', rights: { coletar: { ok: 'não', lim: '—', prova: '—', vig: '—' }, armazenar: { ok: 'não', lim: '—', prova: '—', vig: '—' }, publicar: { ok: 'não', lim: '—', prova: '—', vig: '—' }, indexar: { ok: 'não', lim: '—', prova: '—', vig: '—' }, foto: { ok: 'não', lim: '—', prova: '—', vig: '—' } } });
          ctx.setUi({ novo: false, nname: null }); ctx.toast('Rascunho salvo · ' + n + ' não coleta nada até ter direitos aprovados.');
        }, 'primary'), S.act('Cancelar', function () { ctx.setUi({ novo: false }); }, 'ghost')]));
      }
      blocks.push(S.search('Buscar fonte', ui.q || '', function (e) { ctx.setUi({ q: U.val(e) }); }, 'Nome da fonte'));
      blocks.push(S.opts('', [chip('todas', 'Todas'), chip('ativas', 'Ativas'), chip('pendencia', 'Com pendência')], '', { cls: 'o2-blk o2-blk--bare' }));
      blocks.push(S.table('', ['Fonte', 'Mercado', 'Finalidade', 'Responsável', 'Evidência', 'Validade', 'Estado'], rows, { emptyT: 'Nenhuma fonte com esse filtro', emptyS: 'Limpe a busca para ver todas.' }));
      return {
        head: { sub: total + ' fontes · ' + np + ' com pendência' },
        acts: [S.act('Nova fonte (rascunho)', function () { ctx.setUi({ novo: true }); }, 'primary')],
        notes: notes, blocks: blocks
      };
    }
  });

  // ---------- OPS08.B · Matriz de direitos ----------
  O2.screen({
    key: 'ops08b', id: 'OPS08.B', title: 'Matriz de direitos', mtitle: 'Direitos', nav: 'catalogo', back: 'OPS08', cap: 'fontes.ler', testIds: ['ay', 'lz'],
    scens: [['semimagem', 'Sem licença de imagem'], ['vigencias', 'Vigências divergentes'], ['finalidade', 'Finalidade incompatível'], ['restrita', 'Evidência restrita']],
    make: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn;
      var f = F(ctx.id || 'fx') || F('fx');
      var rows = RIGHTS.map(function (r) {
        var x = f.rights[r[0]];
        var vig = scn === 'vigencias' && r[0] === 'indexar' ? '06/2026' : x.vig;
        var prova = scn === 'restrita' && x.prova !== '—' ? 'restrita · peça acesso' : x.prova;
        return { cells: [r[1], mark(x.ok), x.lim, prova, vig], mt: r[1] + ' · ' + x.ok, ms: (x.ok === 'sim' ? x.lim + ' · ' + prova + ' · até ' + vig : x.ok === 'em revisão' ? 'pedido em revisão · ' + prova : 'não autorizado'), mb: x.ok, mbcls: x.ok === 'não' ? 'badge--plain' : '' };
      });
      var notes = [];
      if (scn === 'semimagem' || f.rights.foto.ok !== 'sim') notes.push(S.note('lock', 'Aprovar fonte não autoriza imagens', 'Perfis desta fonte saem com monograma.'));
      if (scn === 'vigencias') notes.push(S.note('warn', 'Vigências divergentes', 'Indexar vence em 06/2026; os outros direitos, em 12/2027. A partir de 07/2026 os perfis seguem públicos, mas fora da busca.'));
      if (scn === 'finalidade') notes.push(S.note('risk', 'Finalidade incompatível', 'O contrato fala em diretório; usar os dados para anúncios não está coberto. Nada muda até nova evidência.'));
      if (scn === 'restrita') notes.push(S.note('lock', 'Evidência restrita', 'O contrato está com o jurídico. Você vê que existe e a cláusula, não o documento.'));
      if (ui.rec) notes.push(S.rec(ui.rec, ui.recT, ''));
      var rk = ui.rk || 'foto';
      var cur = f.rights[rk];
      return {
        head: { sub: f.name }, alvo: 'Fonte · ' + f.name,
        acts: [S.act('Solicitar revisão', function () { if (f.proposal) return GO('OPS08.C', { id: f.id }); ctx.ask({ title: 'Solicitar revisão de ' + f.name + '?', lines: ['Vai para a alçada 2 com a matriz atual.', 'Nada muda até a decisão.'], ok: 'Solicitar revisão', onOk: function () { var r = O2.log({ cap: 'fontes.ler', subj: f.id, diff: 'revisão solicitada', short: 'Revisão · ' + f.name }); ctx.setUi({ rec: r.id, recT: 'Revisão solicitada' }); ctx.toast('Revisão solicitada · recibo ' + r.id); } }); }, 'primary')],
        notes: notes,
        blocks: [
          S.table('', ['Direito', 'Permitido', 'Limite', 'Prova', 'Vigência'], rows, { help: 'Não existe “autorizar tudo”: cada linha precisa da própria prova.' }),
          S.opts('Registrar direito específico', RIGHTS.map(function (r) { return { label: r[1], on: rk === r[0], chip: true, go: function () { ctx.setUi({ rk: r[0] }); } }; }), 'Registrar cria um pedido em revisão; quem aprova é a alçada 2 em Revisar fonte.'),
          S.field('evid', 'Evidência de ' + RIGHTS.filter(function (r) { return r[0] === rk; })[0][1].toLowerCase(), O2.uv(ctx, 'evid', ''), O2.setter(ctx, 'evid'), { ph: 'Ex.: aditivo contratual §5, assinado em 24/10', err: ui.evidErr ? 'Indique a evidência: cláusula, documento e data.' : '' }),
          S.btns([S.act('Registrar direito', function () {
            if (cur.ok === 'sim') return ctx.toast('Esse direito já está autorizado até ' + cur.vig + '.');
            O2.decide(ctx, { fkey: 'evid', title: 'Registrar ' + rk + ' para ' + f.name + '?', lines: ['Fica “em revisão” até a alçada 2 aprovar.', 'Não muda nenhum outro direito.', rk === 'foto' ? 'Fotos só passam a aparecer depois da aprovação.' : 'Nada é coletado ou publicado agora.'], ok: 'Registrar direito', cap: 'fontes.registrar', subj: f.id, diff: rk + ': não → em revisão', short: 'Direito em revisão · ' + f.name, doneMsg: 'Direito registrado',
              done: function (r) { cur.ok = 'em revisão'; cur.prova = O2.uv(ctx, 'evid', ''); ctx.setUi({ rec: r.id, recT: 'Direito de ' + rk + ' em revisão', evid: null }); } });
          })])
        ]
      };
    }
  });

  // ---------- OPS08.C · Revisão da fonte ----------
  O2.screen({
    key: 'ops08c', id: 'OPS08.C', title: 'Revisar fonte', mtitle: 'Revisar fonte', nav: 'catalogo', back: 'OPS08', cap: 'fontes.aprovar · alçada 2',
    scens: [['autoridade', 'Autoridade insuficiente'], ['evidencia', 'Evidência mudou'], ['parcial', 'Aprovação parcial'], ['pendentes', 'Parâmetros pendentes']],
    make: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn;
      var f = F(ctx.id || 'ay') || F('ay');
      var pr = f.proposal || F('ay').proposal;
      var parts = ui.parts || (scn === 'parcial' ? ['campos'] : ['campos', 'destino']);
      var notes = [];
      if (scn === 'autoridade') notes.push(S.note('lock', 'Autoridade insuficiente', 'Destino público pede alçada 3. Você pode aprovar só os campos e manter a quarentena.'));
      if (scn === 'evidencia') notes.push(S.note('warn', 'Evidência mudou', 'O contrato anexado foi trocado às 13:20. Releia antes de aprovar; a proposta pode não bater com o novo texto.'));
      if (scn === 'parcial') notes.push(S.note('info', 'Aprovação parcial', 'Campos aprovados; destino segue em quarentena até nova evidência.'));
      if (scn === 'pendentes') notes.push(S.note('warn', 'Parâmetros pendentes', 'Falta definir o prazo de armazenamento. Sem isso, a aprovação fica bloqueada.'));
      if (pr.status !== 'em revisão') notes.push(S.rec(pr.rec, 'Decisão: ' + pr.status, ''));
      var decided = pr.status !== 'em revisão';
      var blockedApprove = scn === 'pendentes' || decided;
      var lines = [];
      if (parts.indexOf('campos') >= 0) lines.push('Campos: ' + pr.before.campos + ' → ' + pr.after.campos);
      if (parts.indexOf('destino') >= 0) lines.push('Destino: ' + pr.before.destino + ' → público');
      var decide = function (kind) {
        return function () {
          if (decided) return ctx.toast('Já decidido · recibo ' + pr.rec + '.');
          if (kind === 'aprovar') {
            if (scn === 'pendentes') return ctx.toast('Defina os parâmetros pendentes antes.');
            if (scn === 'autoridade' && parts.indexOf('destino') >= 0) return ctx.toast('Destino público pede alçada 3: tire “destino” da aprovação.');
            if (!lines.length) return ctx.toast('Escolha o que aprovar.');
          }
          var t = { aprovar: 'Aprovar escopo', rejeitar: 'Rejeitar', manter: 'Manter rascunho' }[kind];
          O2.decide(ctx, { title: t + ' · ' + f.name + '?', lines: kind === 'aprovar' ? lines.concat(['Foto: não (sem licença).', 'A aprovação não executa importação nem contato.']) : kind === 'rejeitar' ? ['A proposta é encerrada; a fonte segue como está.', 'Caio R. recebe o motivo.'] : ['A proposta volta para Caio R. como rascunho.'], ok: t, danger: kind === 'rejeitar', cap: 'fontes.aprovar', subj: f.id, diff: kind === 'aprovar' ? lines.join(' · ') : 'proposta: ' + kind, short: t + ' · ' + f.name, doneMsg: t,
            done: function (r) {
              pr.rec = r.id;
              if (kind === 'aprovar') { pr.status = parts.length < 2 ? 'aprovada em parte' : 'aprovada'; if (parts.indexOf('destino') >= 0) { f.rights.publicar.ok = 'sim'; f.rights.publicar.lim = 'perfil não reivindicado'; f.rights.publicar.prova = 'contrato 24/10'; f.rights.publicar.vig = f.valid; } }
              else pr.status = kind === 'rejeitar' ? 'rejeitada' : 'rascunho';
              ctx.setUi({ motivo: null });
            } });
        };
      };
      return {
        head: { sub: f.name + ' · proposta de escopo' }, alvo: 'Fonte · ' + f.name,
        acts: [S.act('Manter rascunho', decide('manter'), 'ghost'), S.act('Rejeitar', decide('rejeitar'), 'danger'), S.act('Aprovar escopo', decide('aprovar'), 'primary', blockedApprove)],
        notes: notes,
        blocks: [
          S.table('Diferença', ['Campo', 'Antes', 'Depois'], [
            { cells: ['Campos', pr.before.campos, pr.after.campos], mt: 'Campos', ms: pr.before.campos.split(', ').length + ' → ' + pr.after.campos.split(', ').length + ' · + modalidade' },
            { cells: ['Destino', pr.before.destino, pr.after.destino], mt: 'Destino', ms: 'quarentena → público' },
            { cells: ['Foto', pr.before.foto, pr.after.foto], mt: 'Foto', ms: 'não → não' }
          ]),
          S.opts('Aprovar por finalidade', [['campos', 'Campos · + modalidade'], ['destino', 'Destino · público']].map(function (o) { var on = parts.indexOf(o[0]) >= 0; return { label: o[1], on: on, go: function () { ctx.setUi({ parts: on ? parts.filter(function (x) { return x !== o[0]; }) : parts.concat([o[0]]) }); } }; }), 'Dá para aprovar em parte. Foto não entra: falta licença.'),
          S.kv('', [['Depende de', pr.dep], ['Responsável', 'Caio R.'], ['Estado', pr.status, pr.status]]),
          S.field('motivo', 'Motivo', O2.uv(ctx, 'motivo', ''), O2.setter(ctx, 'motivo'), { area: true, ph: 'Ex.: contrato assinado cobre modalidade e publicação', err: ui.motivoErr ? 'Escreva o motivo: ele vai para o recibo.' : '' })
        ]
      };
    }
  });

  // ---------- OPS08.D · Suspensão ou revogação ----------
  O2.screen({
    key: 'ops08d', id: 'OPS08.D', title: 'Suspender ou revogar fonte', mtitle: 'Suspender fonte', nav: 'catalogo', back: 'OPS08', cap: 'fontes.revogar',
    scens: [['parcial', 'Revogação parcial'], ['publicados', 'Itens já publicados'], ['fila', 'Fila em andamento'], ['pendente', 'Resultado pendente']],
    make: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn;
      var f = F(ctx.id || 'ay') || F('ay');
      var rv = f.revoke || (f.revoke = { rights: [], affected: 'nenhum candidato nesta amostra', stopped: '', removed: 0, total: 0, rec: '', forwarded: false });
      var sel = ui.rs || rv.rights;
      var notes = [];
      if (scn === 'parcial') notes.push(S.note('info', 'Revogação parcial', 'Só publicar e indexar foram revogados. Coletar e armazenar seguem até o fim do contrato.'));
      if (scn === 'publicados') notes.push(S.note('warn', 'Itens já publicados', '41 perfis já estavam no ar. Saem em lotes; buscadores externos atualizam no tempo deles.'));
      if (scn === 'fila') notes.push(S.note('warn', 'Fila em andamento', 'O lote L-77 estava importando quando a fonte foi suspensa. Ele termina na quarentena e não publica.'));
      if (scn === 'pendente') notes.push(S.note('warn', 'Resultado pendente', 'A retirada do índice ainda não confirmou. Consulte antes de encaminhar de novo.', [['Consultar situação', function () { ctx.toast('Índice: aguardando os perfis · nada a repetir.'); }, 'primary']]));
      if (ui.rec) notes.push(S.rec(ui.rec, ui.recT, ''));
      var steps = [
        ['Novas obtenções paradas', rv.stopped || 'ainda não', rv.stopped ? 'Confirmado' : 'Na fila'],
        ['Perfis públicos', rv.total ? rv.removed + ' de ' + rv.total + ' retirados' : 'nenhum', rv.forwarded ? (rv.removed >= rv.total ? 'Confirmado' : 'Em andamento') : 'Na fila'],
        ['Índice interno', 'após perfis', scn === 'pendente' ? 'Pendente' : 'Na fila'],
        ['Fila de importação', 'lote L-77 ' + (scn === 'fila' ? 'termina na quarentena' : 'em andamento'), 'Em andamento']
      ];
      return {
        head: { sub: f.name }, alvo: 'Fonte · ' + f.name,
        acts: [S.act('Suspender novas obtenções', function () {
          if (rv.stopped) return ctx.toast('Já paradas desde ' + rv.stopped + ' · recibo ' + (rv.rec || 'R-312-1') + '. Nada a repetir.');
          O2.decide(ctx, { title: 'Suspender novas obtenções de ' + f.name + '?', lines: ['Nada novo entra desta fonte a partir de agora.', 'O que já foi publicado não muda com este passo.'], ok: 'Suspender obtenções', cap: 'fontes.revogar', subj: f.id, diff: 'obtenções: ativas → paradas', short: 'Obtenções paradas · ' + f.name, doneMsg: 'Obtenções paradas',
            done: function (r) { rv.stopped = U.now(); rv.rec = r.id; ctx.setUi({ rec: r.id, recT: 'Novas obtenções paradas' }); } });
        }), S.act('Encaminhar retirada', function () {
          if (scn === 'pendente') return ctx.toast('Consulte a situação do índice antes de encaminhar de novo.');
          if (!sel.length) return ctx.toast('Escolha os direitos revogados.');
          O2.decide(ctx, { title: 'Encaminhar retirada por escopo?', lines: ['Direitos revogados: ' + sel.join(', ') + '.', 'Afetados: ' + rv.affected + '.', 'Perfis saem em lotes; cópias externas dependem de cada buscador.', 'Não prometemos apagar todas as cópias na hora.'], ok: 'Encaminhar retirada', danger: true, cap: 'fontes.revogar', subj: f.id, diff: 'revogados: ' + sel.join(', '), short: 'Retirada · ' + f.name, doneMsg: 'Retirada encaminhada',
            done: function (r) { rv.rights = sel.slice(); rv.forwarded = true; sel.forEach(function (k) { if (f.rights[k]) f.rights[k].ok = 'não'; }); ctx.setUi({ rec: r.id, recT: 'Retirada encaminhada' }); } });
        }, 'primary')],
        notes: notes,
        blocks: [
          S.opts('Direitos revogados', RIGHTS.slice(0, 4).map(function (r) { var on = sel.indexOf(r[0]) >= 0; return { label: r[1], on: on, go: function () { ctx.setUi({ rs: on ? sel.filter(function (x) { return x !== r[0]; }) : sel.concat([r[0]]) }); } }; }), 'Revogue só o que perdeu fundamento.'),
          S.kv('', [['Afetados', rv.affected]]),
          S.steps('Propagação', steps, { help: 'Quantidades reais desta fonte, atualizadas ' + O2.UPD + '.' }),
          S.btns([S.act('Consultar andamento', function () { if (rv.forwarded && rv.removed < rv.total) { rv.removed = Math.min(rv.total, rv.removed + 9); ctx.refresh(); ctx.toast('Perfis retirados: ' + rv.removed + ' de ' + rv.total + '.'); } else ctx.toast('Nada novo desde a última consulta.'); })]),
          S.field('motivo', 'Motivo', O2.uv(ctx, 'motivo', 'Academia Y retirou a autorização de publicação em 25/10'), O2.setter(ctx, 'motivo'), { area: true, err: ui.motivoErr ? 'Escreva o motivo: ele vai para o recibo.' : '' })
        ]
      };
    }
  });
})();
