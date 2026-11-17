/* PROGR · Programas (conta real), seguindo o pacote de planos e programas:
   - criar com título e objetivo (rascunho); editor por seções: Conteúdo · Apresentação · Acesso · Revisão;
   - conteúdo em sessões com exercícios (e vídeo por sessão no formato curso); rascunho salvo na conta com revisão esperada:
     se outro aparelho salvou antes, a tela mostra o conflito e nada é descartado;
   - publicar cria uma versão que não muda; quem comprou fica com a versão comprada;
   - publicar não liga a venda; venda tem preço próprio e é ligada à parte;
   - acesso de 12 meses a partir da liberação; cortesia (acesso gratuito) é origem própria e pode ser revogada sem tocar a compra;
   - prévia do aluno mostra a versão em edição e não grava nada. Nada de programa de exemplo. */
REG.screen({
  page: 'treinador', key: 'programasreal', id: 'PROGR', title: 'Programas', nav: 'programas', wide: true, back: 'TMENU',
  vals: function (ctx) {
    var C = window.CONTA, ui = ctx.ui, uid = (C.user() || {}).id, V = window.VID;
    var money = function (c) { return 'R$ ' + (c / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }); };
    var cents = function (v) { var n = parseFloat(String(v || '').replace(/\./g, '').replace(',', '.')); return isNaN(n) ? null : Math.round(n * 100); };
    var slug = function (t) { return String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'programa'; };
    var one = function (r) { return r.ok ? (Array.isArray(r.data) ? r.data[0] : r.data) || {} : {}; };
    var SEL = 'id,slug,title,goal,description,format,weeks,workouts,access_months,price_cents,status,version,sale_enabled,draft_rev,program_contents(content,sessions)';
    var norm = function (x) { var pc = Array.isArray(x.program_contents) ? x.program_contents[0] : x.program_contents; return Object.assign({}, x, { content: (pc && pc.content) || '', sessions: (pc && Array.isArray(pc.sessions)) ? pc.sessions : [] }); };
    var load = function (keepOpen) {
      ctx.setUi({ asked: true });
      C.db('GET', 'trainers?select=id,status&user_id=eq.' + encodeURIComponent(uid || '')).then(function (r) {
        var t = r.ok && r.data && r.data[0];
        if (!t) return ctx.setUi({ list: null, noTrainer: r.ok });
        C.db('GET', 'programs?select=' + SEL + '&trainer_id=eq.' + t.id + '&order=title.asc').then(function (p) {
          var L = p.ok ? (p.data || []).map(norm) : null, o = {};
          o.tid = t.id; o.list = L;
          if (keepOpen && ui.open && L) { var cur = L.filter(function (x) { return x.id === ui.open; })[0]; if (cur) { o.d = null; o.dirty = false; } }
          ctx.setUi(o);
        });
      });
    };
    if (C && C.session() && !ui.asked) load();
    var list = ui.list || [];
    var P = ui.open ? list.filter(function (x) { return x.id === ui.open; })[0] : null;
    // rascunho em edição: cópia local do que veio do servidor; só vira "salvo" com o recibo do servidor
    var d = ui.d || (P ? { title: P.title, goal: P.goal || '', description: P.description || '', format: P.format || 'sessoes', weeks: P.weeks ? String(P.weeks) : '', notes: P.content || '', sessions: JSON.parse(JSON.stringify(P.sessions || [])) } : null);
    var setD = function (patch) { ctx.setUi({ d: Object.assign({}, d, patch), dirty: true, msg: '', conflict: null }); };
    var setSess = function (arr) { setD({ sessions: arr }); };
    var sec = ui.sec || 'conteudo';

    // ---------- criar (título e objetivo) ----------
    var create = function () {
      var title = String(ui.nTitle || '').trim(), goal = String(ui.nGoal || '').trim();
      if (title.length < 3) return ctx.setUi({ nErr: 'Dê um título com pelo menos 3 letras.' });
      if (goal.length < 5) return ctx.setUi({ nErr: 'Escreva o objetivo em uma frase (por exemplo: correr 10 km sem parar).' });
      if (ui.busy) return; ctx.setUi({ busy: true, nErr: '' });
      C.db('POST', 'programs', { trainer_id: ui.tid, slug: slug(title) + '-' + Math.random().toString(36).slice(2, 7), title: title, goal: goal, status: 'rascunho', access_months: 12 }, 'return=representation').then(function (r) {
        var row = one(r);
        if (!row.id) return ctx.setUi({ busy: false, nErr: 'Não foi possível criar agora' + (r.offline ? ': sem conexão.' : '. Tente de novo.') });
        ctx.setUi({ busy: false, creating: false, nTitle: '', nGoal: '', open: row.id, sec: 'conteudo', d: null, dirty: false });
        ctx.toast('Rascunho criado. Continue pelo conteúdo, no seu ritmo.'); load(true);
      });
    };

    // ---------- salvar rascunho (com revisão esperada) ----------
    var save = function (force) {
      if (!P || !d || ui.saving) return;
      if (String(d.title || '').trim().length < 3) return ctx.setUi({ msg: 'O título precisa ter pelo menos 3 letras. O resto do texto continua aqui.', sec: 'apresentacao' });
      ctx.setUi({ saving: true, msg: '' });
      var rev = force && ui.conflict ? ui.conflict.rev : P.draft_rev;
      var sessions = (d.sessions || []).map(function (s) { var o = { title: String(s.title || '').trim().slice(0, 80), text: String(s.text || '').trim().slice(0, 2000), items: (s.items || []).filter(function (it) { return String(it.name || '').trim(); }).map(function (it) { return { name: String(it.name).trim().slice(0, 80), sets: String(it.sets || '').slice(0, 6), reps: String(it.reps || '').slice(0, 12), rest: String(it.rest || '').slice(0, 12), note: String(it.note || '').slice(0, 300) }; }) }; if (V && V.valid(s.video)) o.video = V.clean(s.video); return o; });
      C.rpc('save_program_draft', { p_program: P.id, p_fields: { title: d.title, goal: d.goal, description: d.description, format: d.format, weeks: d.weeks }, p_sessions: sessions, p_notes: d.notes || null, p_rev: rev }).then(function (r) {
        var x = one(r);
        if (!r.ok) return ctx.setUi({ saving: false, msg: r.offline ? 'Sem conexão: nada foi perdido; o rascunho continua aqui. Salve de novo quando a conexão voltar.' : 'O servidor não salvou: ' + (r.msg || 'tente de novo') + '. Seu texto continua aqui.' });
        if (x.conflict) return ctx.setUi({ saving: false, conflict: { rev: x.rev, current: x.current } });
        ctx.setUi({ saving: false, dirty: false, conflict: null, d: null, msg: '' }); ctx.toast('Rascunho salvo às ' + U.now() + '. Nada foi publicado.'); load(true);
      });
    };
    var useTheirs = function () { var c = ui.conflict && ui.conflict.current; if (!c) return; ctx.setUi({ d: { title: c.title, goal: c.goal || '', description: c.description || '', format: c.format || 'sessoes', weeks: c.weeks ? String(c.weeks) : '', notes: c.notes || '', sessions: c.sessions || [] }, dirty: false, conflict: null }); load(true); };

    // ---------- conteúdo: sessões e exercícios ----------
    var sessRows = (d && d.sessions || []).map(function (s, i, arr) {
      var upd = function (patch) { var a = arr.map(function (x) { return Object.assign({}, x); }); a[i] = Object.assign({}, a[i], patch); setSess(a); };
      var items = (s.items || []).map(function (it, k) {
        var setIt = function (key) { return function (e) { var its = (s.items || []).map(function (y) { return Object.assign({}, y); }); its[k][key] = U.val(e); upd({ items: its }); }; };
        return { n: String(k + 1), name: it.name || '', sets: it.sets || '', reps: it.reps || '', rest: it.rest || '', idN: 'pgx-n' + i + '-' + k, idS: 'pgx-s' + i + '-' + k, idR: 'pgx-r' + i + '-' + k, idD: 'pgx-d' + i + '-' + k,
          setName: setIt('name'), setSets: setIt('sets'), setReps: setIt('reps'), setRest: setIt('rest'),
          remove: function () { upd({ items: (s.items || []).filter(function (_, j) { return j !== k; }) }); }, removeLabel: 'Tirar ' + (it.name || 'exercício') + ' da sessão ' + (i + 1) };
      });
      var v = V && V.valid(s.video) ? s.video : null;
      return { n: String(i + 1), title: s.title || '', text: s.text || '', idT: 'pgs-t' + i, idX: 'pgs-x' + i, idV: 'pgs-v' + i,
        setTitle: function (e) { upd({ title: U.val(e) }); }, setText: function (e) { upd({ text: U.val(e) }); },
        items: items, hasItems: items.length > 0,
        addItem: function () { upd({ items: (s.items || []).concat([{ name: '', sets: '3', reps: '10', rest: '60 s' }]) }); },
        up: function () { if (i === 0) return; var a = arr.slice(); var t = a[i - 1]; a[i - 1] = a[i]; a[i] = t; setSess(a); }, down: function () { if (i === arr.length - 1) return; var a = arr.slice(); var t = a[i + 1]; a[i + 1] = a[i]; a[i] = t; setSess(a); },
        upLabel: 'Subir a sessão ' + (i + 1), downLabel: 'Descer a sessão ' + (i + 1), canUp: i > 0, canDown: i < arr.length - 1,
        remove: function () { ctx.ask({ title: 'Tirar a sessão ' + (i + 1) + ' do rascunho?', text: 'A versão já publicada não muda. Só o rascunho perde esta sessão.', ok: 'Tirar sessão', onOk: function () { setSess(arr.filter(function (_, j) { return j !== i; })); } }); },
        isCurso: d.format === 'curso', hasVid: !!v, vidLabel: v ? (v.kind === 'youtube' ? 'Vídeo do YouTube' + (v.title ? ': ' + v.title : '') : 'Vídeo enviado') : 'Sem vídeo',
        vidLink: (ui.vl || {})[i] || '', setVidLink: function (e) { var o = Object.assign({}, ui.vl || {}); o[i] = U.val(e); ctx.setUi({ vl: o }); },
        useVid: function () { var id = V && V.parse((ui.vl || {})[i]); if (!id) return ctx.toast('Cole um link do YouTube (youtube.com/watch?v=… ou youtu.be/…).'); upd({ video: { kind: 'youtube', id: id } }); },
        dropVid: function () { var c2 = Object.assign({}, s); delete c2.video; var a = arr.slice(); a[i] = c2; setSess(a); } };
    });
    var addSess = function () { setSess((d.sessions || []).concat([{ title: 'Sessão ' + ((d.sessions || []).length + 1), text: '', items: [] }])); };

    // ---------- revisão: o que bloqueia publicar (mesma regra do servidor) ----------
    var blockers = [];
    if (d) {
      if (String(d.title || '').trim().length < 3) blockers.push('Dê um título ao programa.');
      if (!String(d.goal || '').trim() && !String(d.description || '').trim()) blockers.push('Escreva o objetivo ou a descrição.');
      if (!(d.sessions || []).length) blockers.push('Inclua pelo menos uma sessão.');
      var vazias = (d.sessions || []).filter(function (s) { return !(s.items || []).some(function (it) { return String(it.name || '').trim(); }) && !String(s.text || '').trim(); }).length;
      if (vazias) blockers.push(U.plural(vazias, 'sessão está vazia', 'sessões estão vazias') + '.');
      if (d.format === 'curso') { var semV = (d.sessions || []).filter(function (s) { return !(V && V.valid(s.video)); }).length; if (semV) blockers.push('Formato curso: ' + U.plural(semV, 'aula sem vídeo', 'aulas sem vídeo') + '.'); }
    }
    var recs = d && d.format === 'sessoes' && (d.sessions || []).length ? ['Recomendado (não bloqueia): vídeo de técnica nos exercícios mais difíceis, na biblioteca de exercícios.'] : [];
    var publish = function () {
      if (!P) return;
      if (ui.dirty) return ctx.toast('Salve o rascunho antes de publicar: a versão publicada é o que está salvo.');
      if (blockers.length) return ctx.toast('Resolva ' + U.plural(blockers.length, 'pendência', 'pendências') + ' antes de publicar.');
      var next = (P.version || 0) + 1;
      ctx.ask({ title: 'Publicar a versão ' + next + ' de "' + P.title + '"?', lines: [P.version ? 'Quem já tem acesso continua na versão que recebeu (v' + P.version + ' ou anterior). A v' + next + ' vale para quem entrar depois.' : 'Primeira versão: ninguém é afetado.', 'Publicar não liga a venda nem atribui treino a ninguém.', P.sale_enabled ? 'A venda continua ligada e passa a vender a v' + next + '.' : 'A venda continua desligada até você ligar em Revisão.'], ok: 'Publicar versão ' + next,
        onOk: function () {
          ctx.setUi({ busy: true });
          C.rpc('publish_program', { p_program: P.id, p_rev: P.draft_rev }).then(function (r) {
            var x = one(r); ctx.setUi({ busy: false });
            if (!r.ok) return ctx.toast(r.offline ? 'Sem conexão: nada foi publicado. Consulte de novo antes de tentar.' : 'Não sabemos se publicou: consulte de novo antes de repetir.');
            if (x.outcome === 'mudou') return ctx.toast('O rascunho mudou em outro aparelho. Recarregue e revise antes de publicar.');
            if (x.outcome === 'pendente') return ctx.toast('O servidor encontrou pendências: ' + (x.blockers || []).join(' '));
            ctx.toast('Versão ' + x.version + ' publicada às ' + U.now() + '. ' + (x.sale ? 'A venda continua ligada.' : 'A venda continua desligada.')); load(true);
          });
        } });
    };
    var setSale = function (on) {
      if (!P) return;
      var c = cents(ui.price != null ? ui.price : (P.price_cents ? (P.price_cents / 100).toFixed(2).replace('.', ',') : ''));
      if (on && (c == null || c < 100)) return ctx.setUi({ priceErr: 'Informe o preço em reais (mínimo R$ 1,00).' });
      ctx.ask({ title: on ? 'Ligar a venda de "' + P.title + '"?' : 'Desligar a venda?', lines: on ? ['Preço: ' + money(c) + ' · pagamento único · comissão 99Coach de 5%; a tarifa do processador é cobrada à parte.', 'Quem comprar recebe a versão ' + P.version + ' e tem 12 meses de acesso a partir da liberação.', 'O pagamento cai na sua conta de recebimentos (Stripe). Sem recebimentos ativos, a compra não abre.'] : ['Quem já comprou continua com o acesso.', 'O programa sai da vitrine de compra até você ligar de novo.'], ok: on ? 'Ligar venda' : 'Desligar venda',
        onOk: function () {
          C.rpc('set_program_sale', { p_program: P.id, p_on: !!on, p_price_cents: on ? c : null }).then(function (r) {
            var x = one(r);
            if (!r.ok) return ctx.toast('Não foi possível agora. Nada mudou.');
            if (x.outcome === 'sem_versao_publicada') return ctx.toast('Publique uma versão antes de ligar a venda.');
            if (x.outcome === 'sem_preco') return ctx.setUi({ priceErr: 'Informe o preço em reais (mínimo R$ 1,00).' });
            ctx.toast(on ? 'Venda ligada.' : 'Venda desligada. Quem comprou continua com o acesso.'); ctx.setUi({ price: null, priceErr: '' }); load(true);
          });
        } });
    };
    var retire = function () { if (!P) return; ctx.ask({ title: 'Retirar "' + P.title + '" do catálogo?', lines: ['A venda é desligada e o programa sai do seu perfil.', 'Quem comprou ou ganhou cortesia continua com o acesso até o fim do prazo.'], ok: 'Retirar', onOk: function () {
      C.rpc('set_program_sale', { p_program: P.id, p_on: false, p_price_cents: null }).then(function () { return C.db('PATCH', 'programs?id=eq.' + P.id, { status: 'retirado' }); }).then(function (r) { if (!r.ok) return ctx.toast('Não foi possível agora. Nada mudou.'); ctx.toast('Programa retirado. Quem tem acesso continua.'); load(true); }); } }); };
    var delDraft = function () { if (!P || P.version) return; ctx.ask({ title: 'Apagar o rascunho "' + P.title + '"?', lines: ['O rascunho nunca foi publicado e é apagado da sua conta. Não dá para desfazer.'], ok: 'Apagar rascunho', danger: true, onOk: function () {
      C.db('DELETE', 'programs?id=eq.' + P.id + '&status=eq.rascunho&version=eq.0').then(function (r) { if (!r.ok) return ctx.toast('Não foi possível apagar agora.'); ctx.setUi({ open: '', d: null }); ctx.toast('Rascunho apagado.'); load(); }); } }); };

    // ---------- acesso: participantes e cortesia ----------
    if (P && sec === 'acesso' && ui.partFor !== P.id) {
      ui.partFor = P.id;
      setTimeout(function () { C.rpc('program_participants', { p_program: P.id }).then(function (r) { var x = r.ok ? (Array.isArray(r.data) && Array.isArray(r.data[0]) ? r.data[0] : r.data) : null; ctx.setUi({ partFor: P.id, parts: Array.isArray(x) ? x : null }); }); }, 0);
    }
    var parts = (ui.parts || []).map(function (a) {
      return { name: a.name, origin: a.source === 'cortesia' ? 'Cortesia' : 'Compra', originCls: 'badge ' + (a.source === 'cortesia' ? 'badge--info' : 'badge--plain'), sub: 'v' + (a.version || 1) + ' · de ' + new Date(a.since).toLocaleDateString('pt-BR') + ' a ' + new Date(a.until).toLocaleDateString('pt-BR') + (a.revoked ? ' · revogada' : ''),
        canRevoke: a.source === 'cortesia' && !a.revoked, revoke: function () { ctx.ask({ title: 'Revogar a cortesia de ' + a.name + '?', lines: ['Só o acesso gratuito acaba. Se a pessoa também comprou, a compra continua valendo.'], ok: 'Revogar cortesia', onOk: function () { C.rpc('revoke_program_grant', { p_access: a.access }).then(function (r) { if (!r.ok) return ctx.toast('Não foi possível agora.'); ctx.toast('Cortesia revogada.'); ctx.setUi({ partFor: '' }); }); } }); } };
    });
    var grant = function () {
      var em = String(ui.gEmail || '').trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return ctx.setUi({ gErr: 'Informe o e-mail da conta da pessoa.' });
      if (ui.busy) return; ctx.setUi({ busy: true, gErr: '' });
      C.rpc('grant_program_access', { p_program: P.id, p_email: em }).then(function (r) {
        var x = one(r); ctx.setUi({ busy: false });
        if (!r.ok) return ctx.setUi({ gErr: 'Não foi possível conceder agora.' });
        var M = { conta_nao_encontrada: 'Não há conta com esse e-mail. Peça para a pessoa criar a conta e tente de novo.', sem_versao_publicada: 'Publique uma versão antes de conceder acesso.', ja_tem_cortesia: 'Essa pessoa já tem cortesia ativa.' };
        if (x.outcome !== 'concedido') return ctx.setUi({ gErr: M[x.outcome] || 'Não foi possível conceder.' });
        ctx.toast('Acesso gratuito concedido (v' + x.version + ', até ' + new Date(x.until).toLocaleDateString('pt-BR') + '). Não gera pedido nem cobrança.'); ctx.setUi({ gEmail: '', partFor: '' });
      });
    };

    var ST = function (p) { return p.status === 'retirado' ? ['Retirado', 'badge badge--warn'] : (p.version ? ['v' + p.version + ' publicada · venda ' + (p.sale_enabled ? 'ligada' : 'desligada'), 'badge ' + (p.sale_enabled ? 'badge--ok' : 'badge--plain')] : ['Rascunho', 'badge badge--plain']); };
    var rows = list.map(function (p) {
      var st = ST(p);
      return { title: p.title, st: st[0], stCls: st[1], sub: (p.format === 'curso' ? 'Curso em vídeo' : 'Programa de sessões') + ' · ' + U.plural((p.sessions || []).length, 'sessão', 'sessões') + (p.weeks ? ' · ' + U.plural(p.weeks, 'semana', 'semanas') : '') + ' · ' + (p.price_cents ? money(p.price_cents) : 'sem preço definido'),
        open: function () { ctx.setUi({ open: p.id, sec: 'conteudo', d: null, dirty: false, conflict: null, msg: '', partFor: '', parts: null }); } };
    });
    var SECS = [['conteudo', 'Conteúdo'], ['apresentacao', 'Apresentação'], ['acesso', 'Acesso'], ['revisao', 'Revisão']];
    var preview = d ? V.sessionsView(d.sessions, ui.pv == null ? -1 : ui.pv, function (i) { ctx.setUi({ pv: i }); }) : [];
    var conf = ui.conflict && ui.conflict.current;
    return {
      loading: ui.list === undefined && !ui.noTrainer, fail: ui.list === null && !ui.noTrainer, noTrainer: !!ui.noTrainer,
      isList: !P, isEdit: !!P, rows: rows, hasRows: rows.length > 0, empty: Array.isArray(ui.list) && !rows.length && !ui.creating,
      creating: !!ui.creating, startNew: function () { ctx.setUi({ creating: true, nErr: '' }); }, cancelNew: function () { ctx.setUi({ creating: false, nErr: '' }); },
      nTitle: ui.nTitle || '', nGoal: ui.nGoal || '', setNTitle: function (e) { ctx.setUi({ nTitle: U.val(e), nErr: '' }); }, setNGoal: function (e) { ctx.setUi({ nGoal: U.val(e), nErr: '' }); },
      nErr: ui.nErr || '', hasNErr: !!ui.nErr, create: create, createLabel: ui.busy ? 'Criando…' : 'Criar rascunho',
      // editor
      back: function () { if (ui.dirty) return ctx.ask({ title: 'Sair sem salvar?', text: 'As mudanças deste rascunho ainda não foram salvas na sua conta.', ok: 'Sair sem salvar', onOk: function () { ctx.setUi({ open: '', d: null, dirty: false }); } }); ctx.setUi({ open: '', d: null }); },
      pTitle: P ? P.title : '', pState: P ? ST(P)[0] : '', pStateCls: P ? ST(P)[1] : '',
      saveTxt: ui.saving ? 'Salvando…' : (ui.dirty ? 'Alterações não salvas' : 'Salvo na sua conta'), saveCls: 'badge ' + (ui.dirty ? 'badge--warn' : 'badge--plain'),
      secs: SECS.map(function (s) { var on = sec === s[0]; return { label: s[1] + (s[0] === 'revisao' && blockers.length ? ' (' + blockers.length + ')' : ''), on: String(on), cls: 'chip' + (on ? ' is-on' : ''), pick: function () { ctx.setUi({ sec: s[0] }); } }; }),
      isCon: sec === 'conteudo', isApr: sec === 'apresentacao', isAce: sec === 'acesso', isRev: sec === 'revisao',
      save: function () { save(false); }, saveLabel: ui.saving ? 'Salvando…' : 'Salvar rascunho', saveOff: String(!ui.dirty),
      msg: ui.msg || '', hasMsg: !!ui.msg,
      hasConflict: !!conf, conflictTxt: conf ? 'Outro aparelho salvou este rascunho antes de você (título lá: "' + conf.title + '", ' + U.plural((conf.sessions || []).length, 'sessão', 'sessões') + '). Nada foi descartado: escolha o que fica.' : '',
      keepMine: function () { save(true); }, useTheirs: useTheirs,
      sess: sessRows, hasSess: sessRows.length > 0, addSess: addSess, notes: d ? d.notes : '', setNotes: function (e) { setD({ notes: U.val(e) }); },
      fTitle: d ? d.title : '', fGoal: d ? d.goal : '', fDesc: d ? d.description : '', fWeeks: d ? d.weeks : '',
      setFTitle: function (e) { setD({ title: U.val(e) }); }, setFGoal: function (e) { setD({ goal: U.val(e) }); }, setFDesc: function (e) { setD({ description: U.val(e) }); }, setFWeeks: function (e) { setD({ weeks: U.val(e).replace(/\D/g, '').slice(0, 3) }); },
      fmts: [['sessoes', 'Programa de sessões'], ['curso', 'Curso em vídeo']].map(function (f) { var on = d && d.format === f[0]; return { label: f[1], on: String(!!on), cls: 'chip' + (on ? ' is-on' : ''), pick: function () { setD({ format: f[0] }); } }; }),
      fmtHelp: d && d.format === 'curso' ? 'Curso: cada aula precisa de vídeo para publicar.' : 'Sessões: vídeo não é obrigatório. Use a biblioteca de exercícios para pôr vídeo de técnica, se quiser.',
      accessTxt: 'Quem compra ou ganha cortesia tem acesso por 12 meses a partir da liberação do acesso, e fica com a versão que recebeu. A duração do conteúdo (' + (d && d.weeks ? U.plural(Number(d.weeks), 'semana', 'semanas') : 'a definir') + ') e a cobrança são separadas.',
      partsLoading: sec === 'acesso' && ui.parts === undefined, partsFail: ui.parts === null, parts: parts, hasParts: parts.length > 0, noParts: Array.isArray(ui.parts) && !parts.length,
      canGrant: !!(P && P.version), gEmail: ui.gEmail || '', setGEmail: function (e) { ctx.setUi({ gEmail: U.val(e), gErr: '' }); }, gErr: ui.gErr || '', hasGErr: !!ui.gErr, grant: grant,
      blockers: blockers.map(function (b) { return { t: b }; }), hasBlockers: blockers.length > 0, ready: !blockers.length, recs: recs.map(function (b) { return { t: b }; }), hasRecs: recs.length > 0,
      publish: publish, publishLabel: P ? 'Publicar versão ' + ((P.version || 0) + 1) : 'Publicar', versionTxt: P ? (P.version ? 'Versão publicada: v' + P.version + '. Quem tem acesso fica com a versão que recebeu.' : 'Nenhuma versão publicada ainda.') : '',
      price: ui.price != null ? ui.price : (P && P.price_cents ? (P.price_cents / 100).toFixed(2).replace('.', ',') : ''), setPrice: function (e) { ctx.setUi({ price: U.val(e), priceErr: '' }); },
      priceErr: ui.priceErr || '', hasPriceErr: !!ui.priceErr, saleOn: !!(P && P.sale_enabled), saleOff: !(P && P.sale_enabled),
      turnOn: function () { setSale(true); }, turnOff: function () { setSale(false); }, canSell: !!(P && P.version && P.status !== 'retirado'),
      canRetire: !!(P && P.version && P.status !== 'retirado'), retire: retire, canDel: !!(P && !P.version), del: delDraft,
      openPreview: function () { ctx.setUi({ prev: !ui.prev, pv: -1 }); }, prevOpen: !!ui.prev, prevLabel: ui.prev ? 'Fechar prévia' : 'Ver como o aluno vê',
      preview: preview, hasPreview: preview.length > 0, prevTitle: d ? d.title : '', prevGoal: d ? d.goal : '', prevNotes: d ? d.notes : '', hasPrevNotes: !!(d && d.notes),
      reload: function () { load(true); }, goProfile: function () { GO('@onboarding', { flow: 'treinador' }); }, goMoney: function () { GO('H09R'); }
    };
  }
});
