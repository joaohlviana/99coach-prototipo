/* PROGR · Programas (conta real): o treinador cria, publica e retira programas, gravados no servidor (tabela programs).
   A venda pelo site ainda não está ligada: a tela diz isso em vez de prometer. Nada de programa de exemplo. */
REG.screen({
  page: 'treinador', key: 'programasreal', id: 'PROGR', title: 'Programas', nav: 'programas', wide: true, back: 'TMENU',
  vals: function (ctx) {
    var C = window.CONTA, ui = ctx.ui, uid = (C.user() || {}).id;
    var money = function (c) { return 'R$ ' + (c / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }); };
    var load = function () {
      ctx.setUi({ asked: true });
      C.db('GET', 'trainers?select=id,status&user_id=eq.' + encodeURIComponent(uid || '')).then(function (r) {
        var t = r.ok && r.data && r.data[0];
        if (!t) return ctx.setUi({ list: null, noTrainer: r.ok });
        C.db('GET', 'programs?select=id,slug,title,weeks,workouts,access_months,price_cents,status&trainer_id=eq.' + t.id + '&order=title.asc').then(function (p) { ctx.setUi({ tid: t.id, tPub: t.status === 'publicado', list: p.ok ? (p.data || []) : null }); });
      });
    };
    if (C && C.session() && !ui.asked) load();
    var f = ui.f || {}, set = function (k) { return function (e) { var n = Object.assign({}, f); n[k] = U.val(e); ctx.setUi({ f: n, ferr: '' }); }; };
    var num = function (v) { var n = parseInt(String(v || '').replace(/\D/g, ''), 10); return isNaN(n) ? 0 : n; };
    var price = function (v) { var n = parseFloat(String(v || '').replace(/\./g, '').replace(',', '.')); return isNaN(n) ? 0 : Math.round(n * 100); };
    var slug = function (t) { return String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'programa'; };
    var save = function () {
      var title = String(f.title || '').trim(), w = num(f.weeks), k = num(f.workouts), m = num(f.months), c = price(f.price);
      if (title.length < 3) return ctx.setUi({ ferr: 'Dê um nome ao programa (pelo menos 3 letras).' });
      if (!w || !k || !m) return ctx.setUi({ ferr: 'Informe semanas, treinos e meses de acesso (números maiores que zero).' });
      if (c < 100) return ctx.setUi({ ferr: 'Informe o preço em reais (mínimo R$ 1,00).' });
      if (ui.saving) return; ctx.setUi({ saving: true, ferr: '' });
      var body = { title: title, weeks: w, workouts: k, access_months: m, price_cents: c };
      var req = ui.editId ? C.db('PATCH', 'programs?id=eq.' + ui.editId, body)
        : C.db('POST', 'programs', Object.assign({ trainer_id: ui.tid, slug: slug(title) + '-' + Math.random().toString(36).slice(2, 7), status: 'rascunho' }, body));
      req.then(function (r) {
        if (!r.ok) return ctx.setUi({ saving: false, ferr: 'Não foi possível salvar agora' + (r.offline ? ': sem conexão.' : '. Tente de novo.') });
        ctx.setUi({ saving: false, open: false, editId: '', f: {} }); ctx.toast(ui.editId ? 'Programa atualizado.' : 'Programa criado como rascunho.'); load();
      });
    };
    var setStatus = function (p, st, msg) { return function () {
      C.db('PATCH', 'programs?id=eq.' + p.id, { status: st }).then(function (r) { if (!r.ok) return ctx.toast('Não foi possível agora. Nada mudou.'); ctx.toast(msg); load(); });
    }; };
    var ST = { rascunho: ['Rascunho', 'badge badge--plain'], publicado: ['Publicado', 'badge badge--ok'], retirado: ['Retirado', 'badge badge--warn'] };
    var rows = (ui.list || []).map(function (p) {
      var st = ST[p.status] || [p.status, 'badge badge--plain'];
      return { title: p.title, st: st[0], stCls: st[1], sub: U.plural(p.weeks, 'semana', 'semanas') + ' · ' + U.plural(p.workouts, 'treino', 'treinos') + ' · acesso por ' + U.plural(p.access_months, 'mês', 'meses') + ' · ' + money(p.price_cents),
        canPub: p.status !== 'publicado', pub: function () { ctx.ask({ title: 'Publicar "' + p.title + '"?', lines: ['O programa passa a constar como publicado no seu catálogo.', 'A compra pelo site ainda não está ligada: por enquanto ninguém consegue pagar por ele aqui.'], ok: 'Publicar', onOk: setStatus(p, 'publicado', 'Programa publicado.') }); },
        canRetire: p.status === 'publicado', retire: setStatus(p, 'retirado', 'Programa retirado.'),
        edit: function () { ctx.setUi({ open: true, editId: p.id, ferr: '', f: { title: p.title, weeks: String(p.weeks), workouts: String(p.workouts), months: String(p.access_months), price: (p.price_cents / 100).toFixed(2).replace('.', ',') } }); },
        canDel: p.status === 'rascunho', del: function () { ctx.ask({ title: 'Apagar o rascunho "' + p.title + '"?', lines: ['O rascunho é apagado da sua conta. Não dá para desfazer.'], ok: 'Apagar rascunho', danger: true, onOk: function () { C.db('DELETE', 'programs?id=eq.' + p.id + '&status=eq.rascunho').then(function (r) { ctx.toast(r.ok ? 'Rascunho apagado.' : 'Não foi possível apagar agora.'); load(); }); } }); } };
    });
    return {
      loading: ui.list === undefined && !ui.noTrainer, fail: ui.list === null && !ui.noTrainer, noTrainer: !!ui.noTrainer,
      rows: rows, hasRows: rows.length > 0, empty: Array.isArray(ui.list) && !rows.length,
      open: !!ui.open, closed: !ui.open, formTitle: ui.editId ? 'Editar programa' : 'Novo programa',
      start: function () { ctx.setUi({ open: true, editId: '', f: {}, ferr: '' }); }, cancel: function () { ctx.setUi({ open: false, editId: '', f: {}, ferr: '' }); },
      fTitle: f.title || '', fWeeks: f.weeks || '', fWorkouts: f.workouts || '', fMonths: f.months || '', fPrice: f.price || '',
      setTitle: set('title'), setWeeks: set('weeks'), setWorkouts: set('workouts'), setMonths: set('months'), setPrice: set('price'),
      save: save, saveLabel: ui.saving ? 'Salvando…' : 'Salvar', ferr: ui.ferr || '', hasFerr: !!ui.ferr,
      reload: load, goProfile: function () { GO('@onboarding', { flow: 'treinador' }); }
    };
  }
});
