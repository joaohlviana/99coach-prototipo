/* H06 · Conteúdo (também TRE13 · Biblioteca de rotinas e pastas): buscar, pastas, continuar, criar, duplicar, mover, atribuir */
REG.screen({
  page: 'treinador', key: 'conteudo', id: 'H06', also: ['TRE13'], title: 'Conteúdo', nav: 'rotinas', wide: true,
  normal: 'Uso recorrente',
  scens: [['vazio', 'Primeiro uso'], ['ausencia', 'Ausência confirmada'], ['parcial', 'Indisponibilidade parcial'],
    ['copiado', 'Copiado'], ['removida', 'Pasta removida'], ['pastavazia', 'Pasta vazia'], ['semres', 'Sem resultado'],
    ['duplicando', 'Duplicação em andamento'], ['desconhecido', 'Resultado desconhecido'], ['excluida', 'Pasta excluída com rotinas preservadas']],
  vals: function (ctx) {
    var ui = ctx.ui, scn = ctx.scn, T = window.T3;
    var para = ctx.p.aluno ? T.aluno(ctx.p.aluno) : null;
    var q = ui.q !== undefined ? ui.q : (scn === 'ausencia' ? 'kettlebell swing unilateral' : (scn === 'semres' ? 'hipertrofia' : (ctx.p.q || '')));
    var folder = ui.folder !== undefined ? ui.folder : (scn === 'pastavazia' ? 'Corrida' : (scn === 'semres' ? 'Online' : 'todas'));
    var nt = ui.nt !== undefined ? ui.nt : ({ copiado: 'copiado', removida: 'removida', duplicando: 'duplicando', desconhecido: 'desconhecido', excluida: 'excluida', parcial: 'parcial' }[scn] || '');
    var empty = scn === 'vazio';
    var rotinas = empty ? [] : DB.rotinas;
    var pastas = DB.pastas.slice();
    if (scn === 'pastavazia' && !pastas.find(function (p) { return p.id === 'Corrida'; })) pastas.push({ id: 'Corrida', name: 'Corrida' });
    var pastaIds = pastas.map(function (p) { return p.id; });
    var inFolder = function (r, f) {
      if (f === 'todas') return true;
      if (f === '__sem') return !r.folder || pastaIds.indexOf(r.folder) < 0;
      if (f === '__rasc') return r.status === 'rascunho';
      return r.folder === f;
    };
    var nq = U.norm(q);
    var matches = function (r) {
      if (!nq) return true;
      var hay = [r.name, r.folder].concat(T.sessions(r.id).map(function (s) { return s.name + ' ' + s.items.map(function (i) { return T.ex(i.ex).name; }).join(' '); })).join(' ');
      return U.norm(hay).indexOf(nq) >= 0;
    };
    var set = function (o) { ctx.setUi(o); };
    var folderName = function (f) { return f === 'todas' ? 'Todas as rotinas' : f === '__sem' ? 'Sem pasta' : f === '__rasc' ? 'Rascunhos' : ((pastas.find(function (p) { return p.id === f; }) || {}).name || f); };

    // ---------- ações ----------
    var duplicate = function (rid) {
      var r = T.rot(rid); if (!r) return '';
      var c = { id: DB.uid('r'), name: r.name + ' (cópia)', folder: r.folder, student: '', status: 'rascunho', version: 1, savedAt: T.stamp(), lastSection: (r.sessions[0] || {}).id || 's1', sessions: T.clone(T.sessions(rid)) };
      DB.rotinas.push(c);
      DB.t3_versoes[c.id] = [{ v: 1, author: 'Você', date: c.savedAt, reason: 'Duplicada de “' + r.name + '” sem alunos, resultados ou publicação', snap: T.clone(c.sessions) }];
      return c.id;
    };
    var create = function () {
      var f = pastaIds.indexOf(folder) >= 0 ? folder : '';
      var r = { id: DB.uid('r'), name: 'Nova rotina', folder: f, student: '', status: 'rascunho', version: 1, savedAt: T.stamp(), lastSection: 's1', sessions: [{ id: 's1', name: 'Sessão A', items: [] }] };
      DB.rotinas.push(r);
      DB.t3_versoes[r.id] = [{ v: 1, author: 'Você', date: r.savedAt, reason: 'Criação', snap: T.clone(r.sessions) }];
      GO('TRE14', { id: r.id, sessao: 's1', nova: '1' });
    };
    var openRot = function (r) { GO('TRE14', { id: r.id, sessao: r.lastSection || '' }); };
    var assignTo = function (rid, aid) { GO('TRE15', { id: aid, rotina: rid }); };

    // ---------- aviso ----------
    var notice = T.none();
    var copyId = ui.copyId || ((DB.rotinas.filter(function (r) { return r.status === 'rascunho'; }).slice(-1)[0] || {}).id || '');
    if (nt === 'copiado') notice = T.notice('ok', 'check', 'Copiado', 'Nasce como rascunho: sem alunos, resultados ou publicação.', [copyId ? ['Abrir cópia', function () { GO('TRE14', { id: copyId }); }] : null]);
    if (nt === 'removida') notice = T.notice('info', 'folder', 'Pasta removida', 'Rotinas vão para “Sem pasta”. Nenhuma foi apagada.', [['Ver “Sem pasta”', function () { set({ folder: '__sem', nt: '' }); }]]);
    if (nt === 'excluida') notice = T.notice('ok', 'check', 'Pasta excluída com rotinas preservadas', 'As rotinas dela estão em “Sem pasta”, com alunos e versões intactos.', [['Saiba por quê', function () {
      ctx.ask({ title: 'Por que as rotinas ficaram?', text: 'Pasta é só organização. Excluir a pasta nunca apaga rotinas, versões, atribuições ou resultados dos alunos.', lines: ['As rotinas da pasta passam para “Sem pasta”.', 'Você pode movê-las para outra pasta quando quiser.'], ok: 'Entendi', cancel: false });
    }]]);
    if (nt === 'duplicando') notice = T.notice('info', 'refresh', 'Duplicação em andamento', 'A cópia de “Condicionamento 30 min” aparece aqui como rascunho. Não precisa duplicar de novo.', [['Revisar', function () { var id = duplicate('r3'); set({ nt: 'copiado', copyId: id }); }]], true);
    if (nt === 'desconhecido') notice = T.notice('warn', 'alert', 'Resultado desconhecido', 'Não confirmamos se a cópia de “Condicionamento 30 min” foi criada. Consulte antes de duplicar de novo.', [['Consultar de novo', function () { set({ nt: 'confirmado' }); }]]);
    if (nt === 'confirmado') notice = T.notice('ok', 'check', 'Consulta feita', 'Nenhuma cópia foi criada. Nada foi duplicado; duplique de novo quando quiser.');
    if (nt === 'parcial') notice = T.notice('warn', 'alert', 'Vídeos dos exercícios indisponíveis', 'Nomes e instruções carregaram; vídeos voltam depois. Você pode editar e atribuir normalmente.', [['Tentar de novo', function () { set({ nt: '' }); ctx.toast('Vídeos carregados de novo.'); }]]);
    if (nt === 'movida') notice = T.notice('ok', 'check', 'Rotina movida', ui.ntText || '');
    if (nt === 'pasta') notice = T.notice('ok', 'check', 'Pasta criada', ui.ntText || '');

    // ---------- pastas ----------
    var cnt = function (f) { return rotinas.filter(function (r) { return inFolder(r, f); }).length; };
    var fl = [['todas', 'Todas', 'grid']].concat(pastas.map(function (p) { return [p.id, p.name, 'folder']; }));
    if (rotinas.some(function (r) { return inFolder(r, '__sem'); }) || folder === '__sem') fl.push(['__sem', 'Sem pasta', 'folder']);
    fl.push(['__rasc', 'Rascunhos', 'file']);
    var folders = fl.map(function (f) {
      var on = folder === f[0];
      return { id: f[0], name: f[1], n: String(cnt(f[0])), ic: 'ic ic--xs i-' + f[2], on: String(on), cls: 'v4-reset lrow t3-folder' + (on ? ' is-on' : ''), chipCls: 'chip' + (on ? ' is-on' : ''),
        pick: function () { set({ folder: f[0], menu: '', move: '', assign: '' }); } };
    });
    var isRealFolder = pastaIds.indexOf(folder) >= 0;
    var delFolder = function () {
      var name = folderName(folder), n = cnt(folder), fid = folder;
      ctx.ask({ title: 'Excluir a pasta “' + name + '”?', text: 'As rotinas serão mantidas.', lines: [n ? U.plural(n, 'rotina vai', 'rotinas vão') + ' para “Sem pasta”.' : 'A pasta está vazia.', 'Nenhuma rotina, versão, aluno ou resultado é apagado.'], ok: 'Excluir pasta', danger: true,
        onOk: function () {
          DB.pastas = DB.pastas.filter(function (p) { return p.id !== fid; });
          DB.rotinas.forEach(function (r) { if (r.folder === fid) r.folder = ''; });
          set({ folder: n ? '__sem' : 'todas', nt: n ? 'excluida' : 'removida' });
        } });
    };

    // ---------- rotinas ----------
    var list = rotinas.filter(function (r) { return inFolder(r, folder) && matches(r); });
    list.sort(function (a, b) { return T.dateKey(b.savedAt) < T.dateKey(a.savedAt) ? -1 : 1; });
    var actives = DB.alunos.filter(function (a) { return a.status === 'ativo'; });
    var cards = list.map(function (r) {
      var ss = T.sessions(r.id), nEx = ss.reduce(function (n, s) { return n + s.items.length; }, 0);
      var st = r.status === 'atribuída' ? ['badge badge--ok', 'Atribuída'] : r.status === 'modelo' ? ['badge badge--plain', 'Modelo'] : ['badge badge--warn', 'Rascunho'];
      var who = r.student ? 'usada por ' + T.first(r.student) : (r.status === 'modelo' ? 'modelo · sem alunos' : 'rascunho · salvo ' + String(r.savedAt).split(' ')[0]);
      var picked = ui.pick === r.id;
      var hasDraft = !!(T.draft(r.id) && T.draft(r.id).dirty);
      var base = r.basedOn ? T.rot(r.basedOn) : null;
      var orig = [base ? 'Nova versão de “' + base.name + '” (v' + base.version + ')' : '', r.aiRef ? 'com assistência de IA revisada · ' + r.aiRef : ''].filter(Boolean).join(' · ');
      return {
        origin: orig, hasOrigin: !!orig,
        id: r.id, name: r.name, sub: U.plural(nEx, 'exercício', 'exercícios') + ' · ' + U.plural(ss.length, 'sessão', 'sessões'), who: who, ver: 'v' + r.version,
        folder: r.folder && pastaIds.indexOf(r.folder) >= 0 ? r.folder : 'Sem pasta', badge: st[0], status: st[1], hasDraft: hasDraft,
        cls: 't3-rcard' + (picked ? ' is-picked' : ''), picked: picked, pickOn: String(picked),
        open: function () { openRot(r); },
        pick: function () { set({ pick: picked ? '' : r.id }); },
        menuOpen: ui.menu === r.id, menuOn: String(ui.menu === r.id),
        toggleMenu: function () { set({ menu: ui.menu === r.id ? '' : r.id, move: '', assign: '' }); },
        dup: function () { var id = duplicate(r.id); set({ menu: '', nt: 'copiado', copyId: id }); },
        hist: function () { GO('TRE16', { id: r.id }); },
        moveOpen: ui.move === r.id,
        startMove: function () { set({ move: r.id, menu: '', assign: '' }); },
        moveTo: pastas.map(function (p) { return { name: p.name, cls: 'chip' + (r.folder === p.id ? ' is-on' : ''), on: String(r.folder === p.id), go: function () { r.folder = p.id; set({ move: '', nt: 'movida', ntText: '“' + r.name + '” agora está em ' + p.name + '.' }); } }; })
          .concat([{ name: 'Sem pasta', cls: 'chip' + (!r.folder ? ' is-on' : ''), on: String(!r.folder), go: function () { r.folder = ''; set({ move: '', nt: 'movida', ntText: '“' + r.name + '” agora está em “Sem pasta”.' }); } }]),
        assignOpen: ui.assign === r.id,
        startAssign: function () { if (para) assignTo(r.id, para.id); else set({ assign: r.id, menu: '', move: '' }); },
        assignTo: actives.map(function (a) { return { name: a.first, go: function () { assignTo(r.id, a.id); } }; }),
        closeInline: function () { set({ move: '', assign: '' }); }
      };
    });

    // ---------- busca em exercícios e formulários ----------
    var exs = nq ? DB.exercicios.filter(function (e) { return U.norm(e.name + ' ' + e.group + ' ' + e.equip).indexOf(nq) >= 0; }).slice(0, 4).map(function (e) {
      return { name: e.name, meta: e.equip + ' · ' + e.group + (nt === 'parcial' ? ' · instruções ok · vídeo —' : ''), go: function () { GO('TRE11', { id: e.id }); } };
    }) : [];
    var forms = nq ? DB.formularios.filter(function (f) { return U.norm(f.name).indexOf(nq) >= 0; }).slice(0, 3).map(function (f) {
      return { name: f.name, meta: f.status + ' · v' + f.version, go: function () { GO('TRE05', { id: f.id }); } };
    }) : [];
    var elsewhere = nq && folder !== 'todas' ? rotinas.filter(function (r) { return !inFolder(r, folder) && matches(r); }).length : 0;
    var nothing = !empty && !!nq && !list.length && !exs.length && !forms.length && !elsewhere;
    var noneHere = !empty && !!nq && !list.length && !nothing;
    var folderEmpty = !empty && !nq && !list.length && folder !== 'todas';
    var movable = folderEmpty && isRealFolder ? rotinas.filter(function (r) { return r.folder !== folder; }).map(function (r) {
      return { name: r.name, meta: r.folder ? 'em ' + r.folder : 'Sem pasta', go: function () { var to = folder; r.folder = to; set({ nt: 'movida', ntText: '“' + r.name + '” agora está em ' + folderName(to) + '.' }); } };
    }) : [];

    // continuar de onde parou
    var last = rotinas.slice().sort(function (a, b) { return T.dateKey(b.savedAt) < T.dateKey(a.savedAt) ? -1 : 1; })[0] || null;
    var lastSess = last ? (T.sessions(last.id).find(function (s) { return s.id === last.lastSection; }) || T.sessions(last.id)[0]) : null;

    // escolha para um aluno (vindo da atribuição)
    var picked = ui.pick ? T.rot(ui.pick) : null;
    var favs = DB.exercicios.filter(function (e) { return e.fav; }).length;
    var pend = T.pendentes();

    return {
      nt: notice, isEmpty: empty, notEmpty: !empty,
      q: q, setQ: function (e) { set({ q: U.val(e) }); }, clearQ: function () { set({ q: '' }); }, hasQ: !!q,
      onKey: function (e) { if (e && e.key === 'Escape') set({ q: '' }); },
      goEx: function () { GO('TRE10', q ? { q: q } : {}); }, goForms: function () { GO('TRE04'); },
      create: create,
      hasPara: !!para, noPara: !para, paraName: para ? para.name : '', paraFirst: para ? para.first : '', paraWeek: para && para.week ? 'semana ' + (para.week + 1) + ' de ' : '',
      paraBtn: picked ? 'Adicionar 1 rotina ao treino de ' + (para ? para.first : '') : 'Escolha uma rotina',
      paraCls: 'btn btn--brand btn--sm' + (picked ? '' : ' is-off'), paraOff: String(!picked),
      paraGo: function () { if (!picked) { ctx.toast('Escolha uma rotina primeiro.'); return; } assignTo(picked.id, para.id); },
      paraCancel: function () { GO('H06'); },
      hasCont: !!(last && !empty && !nq), contName: last ? last.name : '', contSub: last ? ((lastSess ? lastSess.name : 'Sessão') + ' · salvo ' + last.savedAt) : '',
      cont: function () { if (last) openRot(last); },
      folders: folders, folderTitle: folderName(folder), folderCount: U.plural(list.length, 'rotina', 'rotinas'),
      canDelFolder: isRealFolder, delFolder: delFolder,
      newOpen: !!ui.newOpen, newName: ui.newName || '', newErr: ui.newErr || '', hasNewErr: !!ui.newErr,
      openNew: function () { set({ newOpen: true, newName: '', newErr: '' }); }, closeNew: function () { set({ newOpen: false, newErr: '' }); },
      setNew: function (e) { set({ newName: U.val(e), newErr: '' }); },
      saveNew: function () {
        var n = String(ui.newName || '').trim();
        if (n.length < 2) { set({ newErr: 'Dê um nome com pelo menos 2 letras.' }); return; }
        if (DB.pastas.some(function (p) { return U.norm(p.name) === U.norm(n); })) { set({ newErr: 'Já existe uma pasta com esse nome.' }); return; }
        DB.pastas.push({ id: n, name: n });
        set({ newOpen: false, newName: '', folder: n, nt: 'pasta', ntText: 'A pasta “' + n + '” está vazia. Mova rotinas para cá.' });
      },
      cards: cards, hasCards: cards.length > 0,
      nothing: nothing, nothingQ: q, createEx: function () { GO('TRE12', { nome: q }); },
      noneHere: noneHere, noneHereText: elsewhere ? U.plural(elsewhere, 'rotina encontrada', 'rotinas encontradas') + ' em outras pastas.' : 'Nenhuma rotina com esse nome nesta pasta.',
      hasElsewhere: elsewhere > 0, searchAll: function () { set({ folder: 'todas' }); },
      folderEmpty: folderEmpty, movable: movable, hasMovable: movable.length > 0,
      exs: exs, hasExs: exs.length > 0, forms: forms, hasForms: forms.length > 0,
      exSub: (nt === 'parcial' ? 'Instruções ok · vídeos indisponíveis agora' : DB.exercicios.length + ' no catálogo · ' + U.plural(favs, 'favorito', 'favoritos')),
      formSub: U.plural(DB.formularios.length, 'formulário', 'formulários') + ' · ' + U.plural(pend, 'resposta pendente', 'respostas pendentes')
    };
  }
});
