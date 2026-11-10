/* T4 · Programas: hub (H07/TRE21), editor (TRE22), publicação (TRE23) e participantes (TRE24) */
(function () {
  var T4 = window.T4;
  var SECS = [['basico', 'Básico'], ['conteudo', 'Conteúdo'], ['direitos', 'Direitos'], ['oferta', 'Oferta']];
  var SECNAME = { basico: 'o básico', conteudo: 'o conteúdo', direitos: 'os direitos de uso', oferta: 'a oferta' };

  /* ---------------- H07 · hub de programas (atende também TRE21) ---------------- */
  REG.screen({
    page: 'treinador', key: 'programas', id: 'H07', also: ['TRE21'], title: 'Programas', nav: 'programas', wide: true,
    testIds: ['p2', 'p3'],
    normal: 'Uso recorrente',
    scens: [['vazio', 'Primeiro uso'], ['semres', 'Ausência confirmada'], ['parcial', 'Indisponibilidade parcial'], ['rascunho', 'Rascunho'], ['pendencia', 'Pendência'], ['busca', 'Sem resultado'], ['revisao', 'Conteúdo em revisão'], ['consulta', 'Consulta parcial']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn;
      var all = scn === 'vazio' ? [] : DB.programas.slice();
      var q = ui.q != null ? ui.q : (scn === 'busca' ? 'yoga' : '');
      var nq = U.norm(q);
      var list = all.filter(function (p) { return !nq || U.norm(p.name).indexOf(nq) >= 0; });
      var dflt = { rascunho: 'p2', pendencia: 'p2', revisao: 'p3', consulta: 'p3', parcial: 'p3' }[scn] || '';
      var selId = ui.sel || (T4.prog(ctx.id) ? ctx.id : '') || dflt || (list[0] && list[0].id) || '';
      var p = list.find(function (x) { return x.id === selId; }) || list[0] || null;
      var tab = ui.tab || (scn === 'semres' ? 'resultados' : 'editar');
      var partialFail = scn === 'consulta' && !ui.cons;

      var items = list.map(function (x) {
        var st = T4.status(x.status), off = T4.offerOf(x.id), bl = T4.blockers(x.id);
        var parts = [st.label.toLowerCase(), 'v' + x.version];
        if (partialFail && x.id === 'p3') parts.push('participantes não carregaram');
        else if (x.participants) parts.push(U.plural(x.participants, 'participante', 'participantes'));
        else if (bl.length) parts.push(U.plural(bl.length, 'pendência', 'pendências'));
        return {
          name: x.name, sub: parts.join(' · '), badge: st.label, badgeCls: st.cls,
          sale: off && off.sale ? 'à venda' : (x.status === 'publicado' ? 'venda não habilitada' : 'sem venda'),
          cls: 'lrow t4-prow' + (p && x.id === p.id ? ' is-on' : ''), cur: String(!!(p && x.id === p.id)),
          pick: function () { ctx.setUi({ sel: x.id }); }
        };
      });

      var d = { has: false };
      if (p) {
        var m = T4.meta(p.id), live = T4.liveV(p), off = T4.offerOf(p.id), rd = T4.readiness(p.id);
        var bl = rd.filter(function (c) { return c.req && !c.ok; });
        var mods = T4.mods(p.id);
        var head = p.status === 'publicado' ? 'Programa · versão ' + p.version + ' publicada desde ' + (m.publishedAt || p.updated)
          : p.status === 'em revisão' ? 'Programa · v' + live + ' publicada · v' + p.version + ' em revisão desde ' + p.updated
          : 'Programa · v' + p.version + ' rascunho · salvo ' + m.savedAt;
        var next = bl[0];
        var lastMod = mods.find(function (x) { return x.id === m.lastItem; });
        d = {
          has: true, name: p.name + ' · ' + p.weeks + ' semanas', head: head, st: T4.status(p.status).label, stCls: T4.status(p.status).cls,
          tabs: T4.opts([['editar', 'Editar'], ['revisar', 'Revisar'], ['resultados', 'Resultados']], tab, function (k) { ctx.setUi({ tab: k, sel: p.id }); }, 'seg__it'),
          isEdit: tab === 'editar', isRev: tab === 'revisar', isRes: tab === 'resultados',
          hasPend: !!next, noPend: !next,
          pendVer: 'V' + T4.nextV(p) + ' · ' + (p.status === 'publicado' ? 'RASCUNHO' : p.status.toUpperCase()),
          pendTitle: next ? next.label : '', pendWhy: next ? next.why + ' Quem compra vê a versão identificada; a nova versão só publica com o formato completo.' : '',
          pendBtn: next ? 'Ir para ' + SECNAME[next.sec] : '',
          pendGo: function () { if (next) GO('TRE22', { id: p.id, sec: next.sec, item: next.item || '' }); },
          pendCount: bl.length > 1 ? '+ ' + U.plural(bl.length - 1, 'outra pendência', 'outras pendências') : '', hasMore: bl.length > 1,
          okText: 'Sem pendências de prontidão na v' + p.version + '. Alterações novas viram rascunho da v' + T4.nextV(p) + '.',
          struct: mods.map(function (x, i) {
            var proc = x.items.some(function (it) { return it.state === 'processando'; });
            var b = !x.items.length ? ['sem sessões', 'badge badge--warn'] : proc ? ['processando', 'badge badge--info'] : x.items.some(function (it) { return it.state === 'rascunho'; }) ? ['rascunho', 'badge badge--plain'] : ['pronta', 'badge badge--ok'];
            return { code: 'S' + (i + 1), title: x.title, n: U.plural(x.items.length, 'item', 'itens'), badge: b[0], badgeCls: b[1], go: function () { GO('TRE22', { id: p.id, sec: 'conteudo', item: x.id }); } };
          }),
          resume: 'Última edição: ' + (SECS.find(function (s) { return s[0] === m.lastSec; }) || SECS[0])[1] + (lastMod ? ' · ' + lastMod.title : '') + ' · salvo ' + m.savedAt,
          cont: function () { GO('TRE22', { id: p.id, sec: m.lastSec, item: m.lastItem }); },
          partTxt: partialFail && p.id === 'p3' ? 'não carregou · consulte de novo' : (p.participants + ' · na v' + (live || p.version)),
          priceTxt: off ? U.money(off.price) + ' · ' + off.unit : U.money(p.price) + ' · sem oferta configurada',
          saleTxt: off && off.sale ? 'ligada' : 'não habilitada',
          goPart: function () { GO('TRE24', { id: p.id }); },
          goOffer: function () { if (off) GO('TRE29', { id: off.id }); else GO('TRE29', { prog: p.id }); },
          goSales: function () { GO('H09'); },
          check: rd.map(function (c) {
            return { label: c.label, ic: 'ic ic--xs i-' + (c.ok ? 'check' : 'alert'), icCls: 't4-cki' + (c.ok ? ' is-ok' : (c.req ? ' is-bad' : '')),
              tag: c.na ? 'Não exigido' : (c.req ? 'Obrigatório' : 'Opcional'), tagCls: 'badge ' + (c.req && !c.ok ? 'badge--warn' : 'badge--plain'), why: c.ok ? '' : c.why, hasWhy: !c.ok || !!c.na };
          }),
          revTxt: bl.length ? U.plural(bl.length, 'item obrigatório falta', 'itens obrigatórios faltam') + ' para publicar a v' + T4.nextV(p) + '.' : 'Pronto para publicar conteúdo. Venda é uma decisão separada.',
          goRev: function () { GO('TRE23', { id: p.id }); },
          // resultados: só agregados, com fonte e data; progresso individual é privado
          resEmpty: scn === 'semres' || !p.participants,
          resEmptyTxt: scn === 'semres' ? 'Nenhum participante concluiu uma semana. Confirmado 08:00.' : 'O programa ainda não tem participantes.',
          resFull: !(scn === 'semres' || !p.participants),
          res: [{ k: 'Participantes ativos', v: String(p.participants) }, { k: 'Concluíram a semana 1', v: String(Math.round(p.participants * 0.74)) }, { k: 'Avaliação média', v: p.rating ? p.rating + ' de 5' : 'sem avaliações' }],
          resSrc: 'Fonte: 99Coach · atualizado 26/10 08:00. Progresso individual só aparece quando o aluno permite.'
        };
      }

      // avisos da situação
      var al = [];
      var flash = DB.t4_flash.msg;
      if (flash) al.push(T4.alert('ok', 'Publicado', flash, 'Ok', function () { DB.t4_flash.msg = ''; ctx.refresh(); }));
      if (scn === 'parcial') al.push(ui.cons ? T4.alert('ok', 'Consultado às ' + U.now(), 'A v2 de Mobilidade 15 minutos continua em revisão. Nada foi publicado em dobro.')
        : T4.alert('warn', 'Publicação sem confirmação', 'A v2 de Mobilidade 15 minutos foi enviada às 07:40 e não confirmou. Consulte antes de publicar de novo.', 'Consultar publicação', function () { ctx.setUi({ cons: true }); }));
      if (scn === 'rascunho') al.push(T4.alert('info', 'Rascunho · retomar de onde parou', 'LPO para iniciantes · Conteúdo · Semanas 3 a 6 · salvo 25/10 22:40.', 'Continuar programa', function () { GO('TRE22', { id: 'p2', sec: 'conteudo', item: 'm6' }); }));
      if (scn === 'pendencia') al.push(T4.alert('warn', 'Falta capa', 'A capa de LPO para iniciantes está sem direito de uso confirmado. Confirme a autoria para liberar a publicação.', 'Ir para a capa', function () { GO('TRE22', { id: 'p2', sec: 'direitos', item: 'mt3' }); }));
      if (scn === 'revisao') al.push(ui.cons ? T4.alert('info', 'Ainda em revisão', 'Consultado às ' + U.now() + '. A v1 continua disponível para os participantes.')
        : T4.alert('info', 'Conteúdo em revisão', 'Mobilidade 15 minutos v2 está em revisão desde 20/10. A v1 continua disponível; você pode seguir editando o rascunho.', 'Consultar de novo', function () { ctx.setUi({ cons: true }); }));
      if (scn === 'consulta') al.push(ui.cons ? T4.alert('ok', 'Tudo carregado', 'Consultado às ' + U.now() + '.')
        : T4.alert('warn', 'Consulta parcial', 'Os participantes de Mobilidade 15 minutos não carregaram. Programas e pendências estão atualizados (26/10 08:00).', 'Consultar de novo', function () { ctx.setUi({ cons: true }); }));

      // novo programa: só nome e duração; o resto por seções
      var nName = ui.nName != null ? ui.nName : '';
      var nWeeks = ui.nWeeks || '6';
      var creating = !!ui.creating;
      var create = function () {
        var nm = String(nName || '').trim();
        if (nm.length < 3) { ctx.setUi({ nErr: 'Dê um nome com pelo menos 3 letras.' }); return; }
        var id = DB.uid('p');
        DB.programas.push({ id: id, name: nm, weeks: Number(nWeeks), sessions: 0, status: 'rascunho', version: 1, price: 0, participants: 0, rating: '', updated: U.todayShort, sections: ['Semana 1'], pending: [] });
        DB.t4_progmeta[id] = { format: 'sessoes', desc: '', audience: '', prereq: '', publishedAt: '', savedAt: T4.stamp(), draft: 1, lastSec: 'basico', lastItem: '' };
        DB.t4_estrutura.push({ id: DB.uid('m'), program: id, title: 'Semana 1', items: [] });
        T4.sync(id);
        GO('TRE22', { id: id, sec: 'basico' });
      };

      return {
        al: al, hasList: all.length > 0, isEmpty: all.length === 0, noMatch: all.length > 0 && list.length === 0,
        q: q, setQ: function (e) { ctx.setUi({ q: U.val(e) }); }, clearQ: function () { ctx.setUi({ q: '' }); },
        qMsg: 'Nenhum programa com “' + q + '”.',
        count: U.plural(all.length, 'programa', 'programas'),
        items: items, d: d,
        creating: creating, notCreating: !creating,
        openNew: function () { ctx.setUi({ creating: true, nErr: '' }); },
        closeNew: function () { ctx.setUi({ creating: false, nErr: '' }); },
        nName: nName, setNName: function (e) { ctx.setUi({ nName: U.val(e), nErr: '' }); },
        nWeeks: T4.opts([['4', '4 semanas'], ['6', '6 semanas'], ['8', '8 semanas'], ['12', '12 semanas']], nWeeks, function (k) { ctx.setUi({ nWeeks: k }); }),
        nErr: ui.nErr || '', hasNErr: !!ui.nErr, nInCls: 'input' + (ui.nErr ? ' is-err' : ''),
        create: create
      };
    }
  });

  /* ---------------- TRE22 · editor de programa e conteúdo ---------------- */
  REG.screen({
    page: 'treinador', key: 'programaEditor', id: 'TRE22', title: 'Editor de programa', mtitle: 'Programa', nav: 'programas', back: 'H07', wide: true,
    backParams: function (ctx) { return { id: ctx.id }; },
    testIds: ['p1', 'p2'],
    normal: 'Editando',
    scens: [['salvo', 'Salvo'], ['direito', 'Arquivo sem direito'], ['video', 'Vídeo processando'], ['salvando', 'Salvando'], ['upload', 'Upload processando'], ['erro', 'Erro preservando texto'], ['conflito', 'Conflito']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn;
      var p = T4.pick(ctx.id, 'p2');
      if (!p) return { ok: false, none: true, al: [] };
      var m = T4.meta(p.id), live = T4.liveV(p), nextV = T4.nextV(p);
      var sec = ui.sec || ctx.p.sec || ({ direito: 'direitos', video: 'conteudo', upload: 'direitos', erro: 'basico' }[scn]) || m.lastSec || 'conteudo';
      var hl = ui.hl != null ? ui.hl : (ctx.p.item || '');
      // campos do básico: rascunho na interface até salvar
      var f = {
        name: ui.name != null ? ui.name : (scn === 'erro' ? 'LP' : p.name),
        desc: ui.desc != null ? ui.desc : m.desc,
        aud: ui.aud != null ? ui.aud : m.audience,
        pre: ui.pre != null ? ui.pre : m.prereq,
        fmt: ui.fmt || m.format,
        weeks: ui.weeks || String(p.weeks)
      };
      var nameErr = ui.nameErr || (scn === 'erro' && !ui.fixed ? 'O nome precisa ter pelo menos 3 letras.' : '');
      var mods = T4.mods(p.id);
      var mats = T4.mats(p.id);
      // situações que mostram estados de mídia sem mexer nos dados
      var virtRights = scn === 'direito' && !mats.some(function (x) { return !x.rights; }) && mats[0] && !(ui.okMat || {})[mats[0].id] ? mats[0].id : '';
      var upDone = !!ui.upDone;

      var save = function () {
        if (scn === 'salvando') { ctx.toast('Aguarde: o salvamento anterior ainda não terminou.'); return; }
        var nm = String(f.name || '').trim();
        if (nm.length < 3) { ctx.setUi({ sec: 'basico', nameErr: 'O nome precisa ter pelo menos 3 letras. O resto do texto continua aqui.' }); return; }
        var doSave = function () {
          p.name = nm; p.weeks = Number(f.weeks) || p.weeks; p.updated = U.todayShort;
          m.desc = f.desc; m.audience = f.aud; m.prereq = f.pre; m.format = f.fmt; m.savedAt = T4.stamp(); m.lastSec = sec; m.lastItem = hl || m.lastItem;
          if (p.status !== 'rascunho') m.draft = nextV;
          T4.sync(p.id);
          ctx.setUi({ nameErr: '', fixed: true, saved: true, conflictDone: true });
          ctx.toast(p.status === 'rascunho' ? 'Rascunho v' + p.version + ' salvo às ' + U.now() + '. Nada foi publicado nem posto à venda.' : 'Salvo v' + nextV + ' rascunho; v' + live + ' continua publicada.');
        };
        if (scn === 'conflito' && !ui.conflictDone) {
          ctx.ask({ title: 'Outra versão foi salva às 08:12', text: 'Sua edição está preservada. Escolha o que fazer:', lines: ['Salvar a sua edição como v' + (nextV + 1) + ': a versão das 08:12 fica no histórico.', 'Nada é publicado agora.'], ok: 'Salvar a minha como v' + (nextV + 1), onOk: doSave });
          return;
        }
        doSave();
      };

      var confirmRights = function (mt) {
        ctx.ask({ title: 'Confirmar direito de uso', text: mt.name, lines: ['Eu criei este arquivo ou tenho licença para usá-lo neste programa.', 'A confirmação fica registrada com data (26/10) e versão v' + (p.status === 'rascunho' ? p.version : nextV) + '.'], ok: 'Confirmar autoria',
          onOk: function () {
            if (mt.virtual) { var o = Object.assign({}, ui.okMat || {}); o[mt.id] = true; ctx.setUi({ okMat: o }); }
            else { var real = DB.find('t4_materiais', mt.id); if (real) { real.rights = true; real.who = 'autoria confirmada em 26/10'; } T4.sync(p.id); }
            ctx.toast('Direito de uso confirmado: ' + mt.name);
          } });
      };

      // conteúdo: módulos e itens
      var structure = mods.map(function (x, i) {
        var its = x.items.slice();
        if (scn === 'video' && i === 0 && !ui.vidDone) its = its.concat([{ id: 'vtmp', kind: 'aula', name: 'Aula nova · enviada às 08:05', sub: 'vídeo · fica como rascunho até processar', state: 'processando', rotina: '' }]);
        var nS = its.filter(function (it) { return it.kind === 'sessao'; }).length, nA = its.filter(function (it) { return it.kind === 'aula'; }).length;
        return {
          title: x.title, code: 'S' + (i + 1), summary: (nA ? U.plural(nA, 'aula', 'aulas') + ' · ' : '') + U.plural(nS, 'sessão', 'sessões'),
          cls: 'card t4-mod' + (hl === x.id ? ' t4-hl' : ''), empty: !its.length,
          items: its.map(function (it) {
            var st = T4.itemSt(it.state);
            return { name: it.name, sub: it.sub, ic: 'ic ic--xs i-' + (it.kind === 'aula' ? 'play' : 'clipboard'), badge: st.label, badgeCls: st.cls,
              cls: 'lrow t4-item' + (hl === it.id ? ' t4-hl' : ''),
              isSess: it.kind === 'sessao', isAula: it.kind === 'aula', isProc: it.state === 'processando',
              edit: function () { GO('TRE14', { id: it.rotina || 'r4', from: p.id }); },
              recheck: function () { ctx.toast('Ainda processando · consultado às ' + U.now() + '. A aula fica como rascunho até terminar.'); } };
          }),
          up: function () { var arr = DB.t4_estrutura, a = arr.indexOf(x), prev = mods[i - 1]; if (!prev) { ctx.toast('Já é a primeira seção.'); return; } var b = arr.indexOf(prev); arr[a] = prev; arr[b] = x; ctx.setUi({ hl: x.id }); },
          down: function () { var arr = DB.t4_estrutura, a = arr.indexOf(x), nx = mods[i + 1]; if (!nx) { ctx.toast('Já é a última seção.'); return; } var b = arr.indexOf(nx); arr[a] = nx; arr[b] = x; ctx.setUi({ hl: x.id }); },
          upLabel: 'Mover ' + x.title + ' para cima', downLabel: 'Mover ' + x.title + ' para baixo',
          addSess: function () { x.items.push({ id: DB.uid('i'), kind: 'sessao', name: 'Sessão nova', sub: 'treino · rascunho', state: 'rascunho', rotina: '' }); T4.sync(p.id); ctx.setUi({ hl: x.id }); }
        };
      });
      var addMod = function () { var id = DB.uid('m'); DB.t4_estrutura.push({ id: id, program: p.id, title: 'Semana ' + (mods.length + 1), items: [] }); T4.sync(p.id); ctx.setUi({ hl: id }); };

      // direitos e mídia
      var matRows = mats.map(function (x) {
        var rightsOk = x.rights && x.id !== virtRights;
        var proc = x.status === 'processando';
        var mt = { id: x.id, name: x.name, virtual: x.id === virtRights };
        return { name: x.name, sub: x.kind + ' · ' + x.who, ic: 'ic ic--xs i-' + (x.kind === 'vídeo' ? 'play' : (x.kind === 'capa' ? 'camera' : 'file')),
          cls: 'lrow t4-item' + (hl === x.id ? ' t4-hl' : ''),
          rOk: rightsOk, rNo: !rightsOk, proc: proc,
          confirm: function () { confirmRights(mt); },
          recheck: function () { ctx.toast('Ainda processando · consultado às ' + U.now() + '. A aula ligada a este vídeo fica como rascunho.'); } };
      });
      if (scn === 'upload') matRows.push({ name: 'Guia de técnica.pdf', sub: upDone ? 'PDF · upload concluído às ' + U.now() + ' · confirme o direito de uso' : 'PDF · enviando, 60%', ic: 'ic ic--xs i-upload', cls: 'lrow t4-item', rOk: false, rNo: upDone, proc: !upDone,
        confirm: function () { confirmRights({ id: 'uptmp', name: 'Guia de técnica.pdf', virtual: true }); }, recheck: function () { ctx.setUi({ upDone: true }); } });
      var addFile = function () { DB.t4_materiais.push({ id: DB.uid('mt'), program: p.id, name: 'Material de apoio.pdf', kind: 'PDF', rights: false, status: 'processando', who: 'origem não informada' }); T4.sync(p.id); ctx.toast('Arquivo enviado (demonstração). Ele processa e pede confirmação de direito de uso.'); };

      var off = T4.offerOf(p.id);
      var rd = T4.readiness(p.id), bl = rd.filter(function (c) { return c.req && !c.ok; });
      var secs = SECS.map(function (s) {
        var n = bl.filter(function (c) { return c.sec === s[0]; }).length;
        var on = sec === s[0];
        return { label: s[1], on: String(on), cls: 'v4-reset t4-secnav__it' + (on ? ' is-on' : ''), hasN: n > 0, n: String(n), go: function () { ctx.setUi({ sec: s[0] }); } };
      });

      var al = [];
      if (scn === 'salvo' || (ui.saved && scn !== 'salvando')) al.push(T4.alert('ok', 'Salvo', p.status === 'rascunho' ? 'v' + p.version + ' rascunho salva às ' + m.savedAt + '. Nada foi publicado.' : 'v' + nextV + ' rascunho; v' + live + ' continua publicada.'));
      if (scn === 'direito' && !(virtRights && (ui.okMat || {})[virtRights])) {
        var nr = mats.find(function (x) { return !x.rights; }) || mats.find(function (x) { return x.id === virtRights; });
        if (nr && (!nr.rights || nr.id === virtRights)) al.push(T4.alert('warn', 'Arquivo sem direito', nr.name + ' pede confirmação de autoria antes de publicar.', 'Tentar de novo', function () { confirmRights({ id: nr.id, name: nr.name, virtual: nr.id === virtRights }); }));
      }
      if (scn === 'video' && !ui.vidDone) al.push(T4.alert('info', 'Vídeo processando', 'A aula fica como rascunho até o vídeo terminar. Você pode salvar o resto agora.', 'Salvar rascunho', save));
      if (scn === 'salvando') al.push(T4.alert('info', 'Salvando', 'Salvando o rascunho… não feche a página.'));
      if (scn === 'upload') al.push(upDone ? T4.alert('ok', 'Upload concluído', 'Guia de técnica.pdf chegou. Confirme o direito de uso para usar no programa.')
        : T4.alert('info', 'Upload processando', 'Guia de técnica.pdf está sendo enviado (60%).', 'Consultar de novo', function () { ctx.setUi({ upDone: true }); }));
      if (scn === 'erro' && !ui.fixed) al.push(T4.alert('risk', 'Não salvou às 08:12', 'Nada do que você escreveu foi perdido. Corrija o nome e salve de novo.', 'Corrigir', function () { ctx.setUi({ sec: 'basico' }); }));
      if (scn === 'conflito' && !ui.conflictDone) al.push(T4.alert('warn', 'Conflito', 'Outra edição salvou a v' + nextV + ' às 08:12, no celular. Sua edição continua aqui, sem sobrescrever.', 'Revisar', save));

      var fmtLabel = T4.FORMATS[f.fmt];
      return {
        ok: true, none: false, al: al,
        name: p.name, sub: (p.status === 'rascunho' ? 'v' + p.version + ' · rascunho' : 'v' + live + ' publicada · editando v' + nextV) + ' · ' + fmtLabel,
        saving: scn === 'salvando', notSaving: scn !== 'salvando',
        save: save,
        preview: function () { GO('ALU07', { id: p.id, preview: '1' }); },
        review: function () { GO('TRE23', { id: p.id }); },
        assist: function () { GO('IA01', { from: 'TRE22', id: p.id }); },
        secs: secs,
        isBas: sec === 'basico', isCon: sec === 'conteudo', isDir: sec === 'direitos', isOff: sec === 'oferta',
        // básico
        f: f,
        setName: function (e) { ctx.setUi({ name: U.val(e), nameErr: '' }); },
        setDesc: function (e) { ctx.setUi({ desc: U.val(e) }); },
        setAud: function (e) { ctx.setUi({ aud: U.val(e) }); },
        setPre: function (e) { ctx.setUi({ pre: U.val(e) }); },
        nameErr: nameErr, hasNameErr: !!nameErr, nameCls: 'input' + (nameErr ? ' is-err' : ''),
        fmts: T4.opts([['sessoes', 'Só sessões'], ['misto', 'Aulas e sessões']], f.fmt, function (k) { ctx.setUi({ fmt: k }); }),
        fmtHelp: f.fmt === 'sessoes' ? 'Videoaula não é exigida neste formato.' : 'Aulas em vídeo precisam de legenda sincronizada; áudio isolado precisa de transcrição.',
        weeks: T4.opts([['4', '4'], ['6', '6'], ['8', '8'], ['12', '12']], f.weeks, function (k) { ctx.setUi({ weeks: k }); }),
        // conteúdo
        structure: structure, addMod: addMod, hasMods: structure.length > 0, noMods: !structure.length,
        // direitos
        mats: matRows, hasMats: matRows.length > 0, noMats: !matRows.length, addFile: addFile,
        // oferta
        hasOffer: !!off, noOffer: !off,
        offName: off ? off.name : '', offTxt: off ? U.money(off.price) + ' · ' + off.unit + ' · venda ' + (off.sale ? 'ligada' : 'desligada') + ' · v' + off.version : '',
        goOffer: function () { if (off) GO('TRE29', { id: off.id }); else GO('TRE29', { prog: p.id }); },
        // trilho
        verLive: live ? 'v' + live + ' publicada' + (m.publishedAt ? ' · ' + m.publishedAt : '') : 'Nunca publicado',
        verDraft: 'v' + (p.status === 'rascunho' ? p.version : nextV) + ' rascunho · salvo ' + m.savedAt,
        blTxt: bl.length ? U.plural(bl.length, 'pendência obrigatória', 'pendências obrigatórias') + ' para publicar' : 'Sem pendências obrigatórias',
        blCls: 'badge ' + (bl.length ? 'badge--warn' : 'badge--ok')
      };
    }
  });

  /* ---------------- TRE23 · prontidão e publicação ---------------- */
  REG.screen({
    page: 'treinador', key: 'publicacao', id: 'TRE23', title: 'Publicar programa', mtitle: 'Publicar', nav: 'programas', back: 'TRE22',
    backParams: function (ctx) { return { id: ctx.id }; },
    testIds: ['p1', 'p3'],
    normal: 'Revisão',
    scens: [['falta', 'Falta item'], ['publicado', 'Publicado'], ['nova', 'Nova versão'], ['direito', 'Direito de mídia pendente'], ['mudou', 'Versão mudou'], ['desconhecido', 'Resultado desconhecido']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn;
      var p = T4.pick(ctx.id, scn === 'nova' ? 'p1' : 'p2');
      if (!p) return { ok: false, al: [] };
      var m = T4.meta(p.id), live = T4.liveV(p), nextV = T4.nextV(p), off = T4.offerOf(p.id);
      var rd = T4.readiness(p.id).map(function (c) { return Object.assign({}, c); });
      // situações que simulam um item faltando sem mexer nos dados
      if (scn === 'falta' && !ui.recheck && !rd.some(function (c) { return c.req && !c.ok; })) { var pub = rd.find(function (c) { return c.key === 'publico'; }); pub.ok = false; pub.why = 'Diga para quem é o programa e o pré-requisito.'; }
      if (scn === 'direito' && !ui.recheck) { var dr = rd.find(function (c) { return c.key === 'direitos'; }); if (dr.ok) { dr.ok = false; dr.label = 'Guia de escalas.pdf sem direito de uso confirmado'; dr.why = 'A confirmação de licença ainda não voltou da revisão.'; } }
      var bl = rd.filter(function (c) { return c.req && !c.ok; });
      var unknown = scn === 'desconhecido' && !ui.cons, known = scn === 'desconhecido' && !!ui.cons;
      var changed = scn === 'mudou' && !ui.reviewed;
      var already = scn === 'publicado' || known;
      var canPub = !bl.length && !unknown && !changed && !already;
      var first = !live;
      var apply = ui.apply || 'todos';

      var publish = function () {
        if (unknown) { ctx.toast('Consulte o resultado antes de publicar de novo.'); return; }
        if (changed) { ctx.toast('A versão mudou depois da revisão. Revise antes de publicar.'); return; }
        if (bl.length) { ctx.toast('Resolva ' + U.plural(bl.length, 'pendência obrigatória', 'pendências obrigatórias') + ' antes de publicar.'); return; }
        var lines = [first ? 'Primeira versão: ninguém afetado.' : (apply === 'todos' ? p.participants + ' participantes passam para a v' + nextV + '.' : p.participants + ' participantes continuam na v' + live + '; a v' + nextV + ' vale para quem entrar.'),
          'Publicar não atribui treino a ninguém.', off && off.sale ? 'A venda continua ligada (' + off.name + ' · ' + U.money(off.price) + ').' : 'A venda continua desligada até você habilitar.'];
        ctx.ask({ title: 'Publicar v' + nextV + ' de ' + p.name + '?', lines: lines, ok: 'Publicar versão',
          onOk: function () {
            p.status = 'publicado'; p.version = nextV; p.updated = U.todayShort; m.publishedAt = U.todayShort; m.draft = 0;
            T4.sync(p.id);
            DB.t4_flash.msg = 'v' + nextV + ' de ' + p.name + ' publicada às ' + U.now() + '. ' + (off && off.sale ? 'A venda continua ligada.' : 'A venda continua desligada até você habilitar.');
            GO('H07', { id: p.id });
          } });
      };

      var al = [];
      if (scn === 'falta') al.push(ui.recheck ? T4.alert('info', 'Checklist consultado', 'Consultado às ' + U.now() + '. Corrija o item marcado e volte aqui.')
        : T4.alert('warn', 'Falta item', 'O checklist mostra só o que o formato “' + T4.FORMATS[m.format] + '” exige.', 'Tentar de novo', function () { ctx.setUi({ recheck: true }); }));
      if (scn === 'publicado') al.push(T4.alert('ok', 'Publicado', 'A v' + (live || p.version) + ' está no ar. ' + (off && off.sale ? 'A venda está ligada.' : 'Venda continua desligada até você habilitar.'), off && off.sale ? '' : 'Habilitar venda', function () { GO('TRE29', off ? { id: off.id } : { prog: p.id }); }));
      if (scn === 'nova') al.push(ui.cons ? T4.alert('info', 'Participantes consultados', 'Consultado às ' + U.now() + ': ' + p.participants + ' participantes na v' + (live || p.version) + '.')
        : T4.alert('info', 'Nova versão', 'Mostramos abaixo quem será afetado pela v' + nextV + '.', 'Consultar de novo', function () { ctx.setUi({ cons: true }); }));
      if (scn === 'direito') al.push(ui.recheck ? T4.alert('ok', 'Direito confirmado', 'Consultado às ' + U.now() + ': licença confirmada.')
        : T4.alert('warn', 'Direito de mídia pendente', 'Uma mídia ainda não tem direito de uso confirmado. Publicar fica bloqueado até confirmar.', 'Consultar de novo', function () { ctx.setUi({ recheck: true }); }));
      if (scn === 'mudou') al.push(ui.reviewed ? T4.alert('ok', 'Revisado', 'Checklist atualizado às ' + U.now() + ' com a versão salva às 08:12.')
        : T4.alert('warn', 'Versão mudou', 'O rascunho foi salvo de novo às 08:12, depois desta revisão. Revise o que mudou antes de publicar.', 'Revisar', function () { ctx.setUi({ reviewed: true }); }));
      if (scn === 'desconhecido') al.push(known ? T4.alert('ok', 'Consultado às ' + U.now(), 'A v' + nextV + ' foi publicada às 07:41. Nada foi publicado em dobro.', 'Ver programas', function () { GO('H07', { id: p.id }); })
        : T4.alert('warn', 'Resultado desconhecido', 'Enviamos a v' + nextV + ' às 07:40 e não recebemos confirmação. O candidato está preservado e a operação foi avisada. Não publique de novo.', 'Consultar de novo', function () { ctx.setUi({ cons: true }); }));

      return {
        ok: true, al: al,
        name: 'Publicar ' + p.name, sub: 'Formato: ' + T4.FORMATS[m.format].toLowerCase() + ' · candidata v' + nextV,
        check: rd.map(function (c) {
          return { label: c.label, ic: 'ic ic--xs i-' + (c.ok ? 'check' : 'alert'), icCls: 't4-cki' + (c.ok ? ' is-ok' : (c.req ? ' is-bad' : '')),
            tag: c.na ? 'Não exigido' : (c.req ? 'Obrigatório' : 'Opcional'), tagCls: 'badge ' + (c.req && !c.ok ? 'badge--warn' : 'badge--plain'),
            why: c.why, hasWhy: !c.ok || !!c.na, canFix: !c.ok && !c.na, fixLabel: c.req ? 'Corrigir' : 'Adicionar',
            fix: function () { GO('TRE22', { id: p.id, sec: c.sec, item: c.item || '' }); } };
        }),
        ready: canPub, notReady: !canPub && !already, already: already,
        blTxt: unknown ? 'Aguardando confirmação da publicação anterior.' : changed ? 'Revise a versão salva às 08:12 antes de publicar.' : bl.length ? U.plural(bl.length, 'item obrigatório falta', 'itens obrigatórios faltam') + '.' : 'Pronto para publicar conteúdo.',
        publish: publish, pubLabel: 'Publicar v' + nextV,
        first: first, notFirst: !first,
        impact: first ? 'Primeira versão: ninguém afetado.' : p.participants + ' participantes estão na v' + live + '.',
        applyOpts: T4.opts([['todos', 'Atualizar quem já participa'], ['novos', 'Só para quem entrar']], apply, function (k) { ctx.setUi({ apply: k }); }),
        applyHelp: apply === 'todos' ? 'Quem já participa vê a v' + nextV + ' e mantém o progresso das sessões que não mudaram.' : 'Quem já participa continua na v' + live + '; a v' + nextV + ' vale para novos participantes.',
        saleTxt: off ? (off.sale ? 'Venda ligada · ' + off.name + ' · ' + U.money(off.price) + ' · ' + off.unit : 'Venda ainda não habilitada · oferta salva') : 'Venda ainda não habilitada · sem oferta',
        saleLabel: off && off.sale ? 'Ver oferta' : 'Habilitar venda',
        goSale: function () { GO('TRE29', off ? { id: off.id } : { prog: p.id }); },
        goPart: function () { GO('TRE24', { id: p.id }); },
        goEdit: function () { GO('TRE22', { id: p.id }); }
      };
    }
  });

  /* ---------------- TRE24 · participantes e direitos ---------------- */
  DB.seed('t4_origens', [
    { id: 'og1', pid: 'pp1', kind: 'acesso gratuito', since: '20/10', until: '31/12', status: 'ativo', note: 'bônus de indicação' }
  ]);
  var ORIG = { 'compra': 'Compra', 'acesso gratuito': 'Acesso gratuito' };
  var PST = { ativo: ['Ativo', 'badge badge--ok'], expirado: ['Expirado', 'badge badge--plain'], revogado: ['Revogado', 'badge badge--risk'], 'convite pendente': ['Convite pendente', 'badge badge--warn'], futuro: ['Vigência futura', 'badge badge--info'] };
  REG.screen({
    page: 'treinador', key: 'participantes', id: 'TRE24', title: 'Participantes', nav: 'programas', back: 'H07',
    backParams: function (ctx) { return { id: ctx.id }; },
    testIds: ['p1', 'p3', 'p2'],
    normal: 'Lista',
    scens: [['concedido', 'Concedido'], ['revogado', 'Revogado'], ['privado', 'Progresso privado'], ['convite', 'Convite gratuito pendente'], ['futura', 'Vigência futura'], ['expirado', 'Expirado'], ['umaorigem', 'Revogado por uma origem'], ['desconhecida', 'Confirmação desconhecida']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn;
      var p = T4.pick(ctx.id, 'p1');
      if (!p) return { ok: false, al: [] };
      var rows = DB.participantes.filter(function (x) { return x.program === p.id; }).map(function (x) { return Object.assign({}, x); });
      // linhas simuladas por situação
      if (scn === 'concedido') rows.unshift({ id: 'v1', program: p.id, name: 'Lucas Martins', origin: 'acesso gratuito', since: '26/10', until: '31/12', progress: 'privado', status: 'ativo', student: 'lucas' });
      if (scn === 'convite') rows.unshift({ id: 'v2', program: p.id, name: 'Carla Nunes', origin: 'acesso gratuito', since: '24/10', until: '31/12', progress: 'privado', status: 'convite pendente', student: 'carla' });
      if (scn === 'futura') rows.unshift({ id: 'v3', program: p.id, name: 'Larissa Mendes', origin: 'acesso gratuito', since: '01/11', until: '31/01', progress: 'privado', status: 'futuro', student: 'larissa' });
      if (scn === 'desconhecida' && !ui.cons) rows.unshift({ id: 'v4', program: p.id, name: 'Lucas Martins', origin: 'acesso gratuito', since: '26/10', until: '31/12', progress: 'privado', status: 'convite pendente', student: 'lucas', unknown: true });
      if (scn === 'desconhecida' && ui.cons) rows.unshift({ id: 'v4', program: p.id, name: 'Lucas Martins', origin: 'acesso gratuito', since: '26/10', until: '31/12', progress: 'privado', status: 'ativo', student: 'lucas' });
      var extra = function (x) {
        return DB.t4_origens.filter(function (o) { return o.pid === x.id; }).map(function (o) {
          var st = (scn === 'revogado' || scn === 'umaorigem') && o.id === 'og1' ? 'revogado' : o.status;
          return { id: o.id, kind: o.kind, since: o.since, until: o.until, status: st, note: o.note, real: o };
        });
      };
      var vig = function (x) { return x.until ? (x.status === 'futuro' ? 'de ' + x.since + ' até ' + x.until : 'até ' + x.until) : (x.origin === 'compra' ? '12 meses desde ' + x.since : 'desde ' + x.since); };
      var dflt = { revogado: 'pp1', umaorigem: 'pp1', privado: 'pp1', expirado: 'pp3', convite: 'v2', futura: 'v3', concedido: 'v1', desconhecida: 'v4' }[scn] || '';
      var selId = ui.sel != null ? ui.sel : dflt;
      var list = rows.map(function (x) {
        var st = PST[x.status] || [x.status, 'badge badge--plain'];
        var ex = extra(x);
        return { name: x.name, origin: ORIG[x.origin] + (ex.length ? ' + ' + ex.length + ' origem' : ''), vig: vig(x), progress: x.progress === 'privado' ? 'privado' : x.progress,
          progCls: x.progress === 'privado' ? 't4-muted' : '', st: st[0], stCls: st[1], cls: 't4-prow2' + (x.id === selId ? ' is-on' : ''), on: String(x.id === selId),
          open: function () { ctx.setUi({ sel: x.id === selId ? '' : x.id }); } };
      });

      // detalhe do participante
      var cur = rows.find(function (x) { return x.id === selId; });
      var det = { has: false };
      if (cur) {
        var ex = extra(cur);
        var origins = [{ id: cur.id, kind: cur.origin, since: cur.since, until: cur.until || '', status: cur.status, note: '', main: true }].concat(ex);
        var activeOthers = function (o) { return origins.filter(function (z) { return z !== o && (z.status === 'ativo'); }); };
        var stu = cur.student ? DB.find('alunos', cur.student) : null;
        var privOk = scn === 'privado' && !!ui.privOk;
        det = {
          has: true, name: cur.name,
          origins: origins.map(function (o) {
            var st = PST[o.status] || [o.status, 'badge badge--plain'];
            var others = activeOthers(o);
            var canRevoke = o.kind === 'acesso gratuito' && o.status !== 'revogado' && o.status !== 'expirado';
            return { label: ORIG[o.kind] + (o.note ? ' · ' + o.note : ''), vig: (o.status === 'futuro' ? 'começa ' + o.since + ' · ' : 'desde ' + o.since + ' · ') + (o.until ? 'até ' + o.until : (o.kind === 'compra' ? '12 meses' : 'sem prazo')),
              st: st[0], stCls: st[1], canRevoke: canRevoke, isBuy: o.kind === 'compra',
              keep: others.length ? 'Outra contratação mantém o acesso.' : '', hasKeep: others.length > 0 && o.kind === 'acesso gratuito',
              revoke: function () {
                ctx.ask({ title: 'Revogar esta concessão?', danger: true, ok: 'Revogar concessão',
                  lines: ['Origem: acesso gratuito · ' + (o.until ? 'até ' + o.until : 'sem prazo') + '.', others.length ? 'A ' + ORIG[others[0].kind].toLowerCase() + ' de ' + others[0].since + ' continua e mantém o acesso.' : cur.name + ' perde o acesso ao programa hoje (26/10).', 'Nada é cobrado nem estornado.'],
                  onOk: function () {
                    if (o.real) o.real.status = 'revogado';
                    else { var r = DB.find('participantes', o.id); if (r) { r.status = 'revogado'; if (p.participants > 0) p.participants -= 1; } }
                    ctx.toast(others.length ? 'Concessão revogada. O acesso por ' + ORIG[others[0].kind].toLowerCase() + ' continua.' : 'Concessão revogada. ' + cur.name + ' não tem mais acesso.');
                  } });
              } };
          }),
          progPriv: cur.progress === 'privado' && !privOk, progOpen: cur.progress !== 'privado',
          progPrivDone: privOk,
          progTxt: cur.progress !== 'privado' ? cur.progress + ' das sessões concluídas · aluno permitiu compartilhar' : '',
          hasStu: !!stu, stuTxt: stu ? 'Aluno vinculado: ' + stu.name : '',
          goStu: function () { if (stu) GO('TRE03', { id: stu.id }); },
          buyNote: 'Compra vigente: só o comprador cancela, em Minhas contratações. O plano do autor não controla a compra.'
        };
      }

      // conceder acesso gratuito
      var g = { who: ui.who || '', other: ui.other != null ? ui.other : '', vig: ui.vig || 'dez', start: ui.start || 'hoje' };
      var already = DB.participantes.filter(function (x) { return x.program === p.id; }).map(function (x) { return x.student; });
      var people = DB.alunos.filter(function (a) { return a.status === 'ativo' && already.indexOf(a.id) < 0; });
      var VIG = { d30: '30 dias (até 25/11)', d90: '90 dias (até 24/01)', dez: 'até 31/12', sem: 'sem prazo' };
      var UNTIL = { d30: '25/11', d90: '24/01', dez: '31/12', sem: '' };
      var grant = function () {
        var person = g.who === '__outro' ? String(g.other || '').trim() : (DB.find('alunos', g.who) || {}).name;
        if (!person) { ctx.setUi({ gErr: 'Escolha um aluno ou informe nome e e-mail de quem vai receber.' }); return; }
        var fut = g.start === 'nov';
        ctx.ask({ title: 'Conceder acesso gratuito?', ok: 'Conceder acesso',
          lines: ['Para: ' + person + (g.who === '__outro' ? ' (convite por e-mail)' : ''), 'Programa: ' + p.name + ' · v' + (T4.liveV(p) || p.version), 'Vigência: ' + (fut ? 'de 01/11 ' : 'de hoje ') + VIG[g.vig], 'Acesso gratuito não gera pedido pago nem aparece em Recebimentos.'],
          onOk: function () {
            var invite = g.who === '__outro';
            DB.participantes.push({ id: DB.uid('pp'), program: p.id, name: person, origin: 'acesso gratuito', since: fut ? '01/11' : U.todayShort, until: UNTIL[g.vig], progress: 'privado', status: invite ? 'convite pendente' : (fut ? 'futuro' : 'ativo'), student: invite ? '' : g.who });
            if (!invite && !fut) p.participants += 1;
            ctx.setUi({ grant: false, who: '', other: '', gErr: '' });
            ctx.toast('Concedido · ' + person + ' · origem: acesso gratuito · ' + VIG[g.vig] + '.');
          } });
      };

      var al = [];
      var explain = function (title, lines) { return function () { ctx.ask({ title: title, lines: lines, ok: 'Entendi', cancel: false }); }; };
      if (scn === 'concedido') al.push(T4.alert('ok', 'Concedido', 'Lucas Martins · origem: acesso gratuito · até 31/12. Não gerou pedido pago.'));
      if (scn === 'revogado') al.push(T4.alert('ok', 'Revogado', 'A concessão gratuita de Fernanda Alves foi revogada. O acesso por compra continua.'));
      if (scn === 'privado' && !ui.privOk) al.push(T4.alert('info', 'Progresso privado', 'O progresso de Fernanda Alves só aparece se ela permitir.', 'Continuar', function () { ctx.setUi({ privOk: true }); }));
      if (scn === 'convite') al.push(ui.cons ? T4.alert('info', 'Ainda pendente', 'Consultado às ' + U.now() + '. Carla Nunes ainda não aceitou o convite.')
        : T4.alert('warn', 'Convite gratuito pendente', 'Carla Nunes ainda não aceitou o convite enviado em 24/10.', 'Consultar de novo', function () { ctx.setUi({ cons: true }); }));
      if (scn === 'futura') al.push(T4.alert('info', 'Vigência futura', 'O acesso de Larissa Mendes começa em 01/11. Até lá, o programa aparece como “em breve” para ela.', 'Saiba por quê', explain('Por que o acesso ainda não começou', ['A concessão foi criada com início em 01/11.', 'Antes disso Larissa vê o programa, mas não as sessões.', 'Para começar hoje, revogue e conceda de novo com início hoje.'])));
      if (scn === 'expirado') al.push(T4.alert('warn', 'Expirado', 'O acesso por compra de Rodrigo Teles terminou (12 meses desde 20/08). Ele pode comprar de novo; se quiser dar mais tempo, conceda acesso gratuito.', 'Corrigir', function () { ctx.setUi({ grant: true, who: '__outro', other: 'Rodrigo Teles', sel: 'pp3' }); }));
      if (scn === 'umaorigem') al.push(T4.alert('info', 'Revogado por uma origem', 'A concessão gratuita de Fernanda Alves foi revogada; a compra de 02/10 mantém o acesso.', 'Saiba por quê', explain('Cada origem tem o seu direito', ['Fernanda tem duas origens: compra (02/10) e acesso gratuito (20/10).', 'Revogar a concessão gratuita não mexe na compra.', 'Ela continua com acesso enquanto a compra estiver vigente.'])));
      if (scn === 'desconhecida') al.push(ui.cons ? T4.alert('ok', 'Confirmado às ' + U.now(), 'Acesso de Lucas Martins concedido uma vez. Nada em dobro.')
        : T4.alert('warn', 'Confirmação desconhecida', 'A concessão para Lucas Martins foi enviada às 08:05 e não confirmou. Não conceda de novo: consulte primeiro.', 'Consultar de novo', function () { ctx.setUi({ cons: true }); }));

      var nList = DB.participantes.filter(function (x) { return x.program === p.id; }).length;
      return {
        ok: true, al: al,
        sub: p.name + ' · ' + U.plural(p.participants, 'participante', 'participantes'),
        src: 'Mostrando ' + U.plural(rows.length, 'registro', 'registros') + ' com acesso recente de ' + p.participants + ' no total · fonte 99Coach, 26/10 08:00.',
        list: list, hasList: list.length > 0, noList: !list.length, emptyTxt: nList ? '' : 'Ninguém tem acesso a este programa ainda.',
        det: det,
        grantOn: !!ui.grant, grantOff: !ui.grant,
        openGrant: function () { ctx.setUi({ grant: true, gErr: '' }); }, closeGrant: function () { ctx.setUi({ grant: false, gErr: '' }); },
        people: people.map(function (a) { var on = g.who === a.id; return { label: a.name, on: String(on), cls: 'chip t4-chip' + (on ? ' is-on' : ''), pick: function () { ctx.setUi({ who: a.id, gErr: '' }); } }; })
          .concat([{ label: 'Outra pessoa (e-mail)', on: String(g.who === '__outro'), cls: 'chip t4-chip' + (g.who === '__outro' ? ' is-on' : ''), pick: function () { ctx.setUi({ who: '__outro', gErr: '' }); } }]),
        isOther: g.who === '__outro', other: g.other, setOther: function (e) { ctx.setUi({ other: U.val(e), gErr: '' }); },
        vigs: T4.opts([['d30', '30 dias'], ['d90', '90 dias'], ['dez', 'Até 31/12'], ['sem', 'Sem prazo']], g.vig, function (k) { ctx.setUi({ vig: k }); }),
        starts: T4.opts([['hoje', 'Começa hoje'], ['nov', 'A partir de 01/11']], g.start, function (k) { ctx.setUi({ start: k }); }),
        gErr: ui.gErr || '', hasGErr: !!ui.gErr,
        grant: grant
      };
    }
  });
})();
