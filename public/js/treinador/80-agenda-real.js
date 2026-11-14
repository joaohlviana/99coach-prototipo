/* TRE20R · Agenda real do treinador: disponibilidade semanal no fuso do treinador e horários marcados pelos alunos com
   vínculo. Diretriz: horário livre não é vaga para aluno novo; conflito resolvido pelo servidor. */
REG.screen({
  page: 'treinador', key: 'agendareal', id: 'TRE20R', title: 'Agenda', nav: 'agenda', wide: true,
  vals: function (ctx) {
    var C = window.CONTA, ui = ctx.ui, TZ = 'America/Sao_Paulo';
    var DAYS = [[1, 'Segunda'], [2, 'Terça'], [3, 'Quarta'], [4, 'Quinta'], [5, 'Sexta'], [6, 'Sábado'], [7, 'Domingo']];
    var hm = function (m) { return ('0' + Math.floor(m / 60)).slice(-2) + ':' + ('0' + (m % 60)).slice(-2); };
    var mins = function (t) { var x = /^(\d{1,2}):(\d{2})$/.exec(String(t || '').trim()); return x ? Number(x[1]) * 60 + Number(x[2]) : NaN; };
    var links = (C ? C.cachedLinks() : []).filter(function (l) { return l.mine === 'treinador'; });
    if (C && !ui.asked) {
      ctx.setUi({ asked: true, loading: true });
      Promise.all([C.myAvailability(), C.appointments(links.map(function (l) { return l.id; }))]).then(function (x) {
        var R = {}; ((x[0].ok && x[0].data) || []).forEach(function (r) { R[r.weekday] = { on: true, from: hm(r.start_min), to: hm(r.end_min), slot: String(r.slot_min) }; });
        ctx.setUi({ loading: false, rules: ui.rules || R, appts: (x[1].ok && x[1].data) || [], loadErr: !x[0].ok });
      });
    }
    var rules = ui.rules || {};
    var day = function (d) { return rules[d] || { on: false, from: '07:00', to: '12:00', slot: '60' }; };
    var upd = function (d, k) { return function (e) { var o = Object.assign({}, rules); var cur = Object.assign({}, day(d)); cur[k] = k === 'on' ? !cur.on : U.val(e); o[d] = cur; ctx.setUi({ rules: o, err: '', saved: false }); }; };
    var save = function () {
      if (ui.busy) return;
      var out = [], bad = '';
      DAYS.forEach(function (d) { var r = day(d[0]); if (!r.on) return; var a = mins(r.from), b = mins(r.to), s = Number(r.slot);
        if (isNaN(a) || isNaN(b) || b <= a) bad = d[1] + ': use horários no formato 07:00 e o fim depois do início.';
        else if ([30, 45, 60, 90].indexOf(s) < 0) bad = d[1] + ': duração de 30, 45, 60 ou 90 minutos.';
        else out.push({ weekday: d[0], startMin: a, endMin: b, slotMin: s }); });
      if (bad) return ctx.setUi({ err: bad });
      ctx.setUi({ busy: true, err: '' });
      C.setAvailability(out, TZ).then(function (r) { ctx.setUi({ busy: false, saved: r.ok, err: r.ok ? '' : (r.offline ? 'Sem conexão: nada mudou.' : 'O servidor não salvou: ' + (r.msg || r.status)) }); if (r.ok) ctx.toast('Disponibilidade salva. Alunos com vínculo veem os horários livres.'); });
    };
    var nameOf = {}; links.forEach(function (l) { nameOf[l.id] = l.studentName; });
    var appts = (ui.appts || []).map(function (a) { var d = new Date(a.starts_at); return { when: d.toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: TZ }), who: nameOf[a.link_id] || 'Aluno', by: a.booked_by === 'aluno' ? 'marcado pelo aluno' : 'marcado por você',
      cancel: function () { ctx.ask({ title: 'Cancelar este horário?', lines: ['O aluno vê o cancelamento na agenda dele.'], ok: 'Cancelar horário', danger: true, onOk: function () { C.cancelAppointment(a.id, 'treinador').then(function (r) { if (!r.ok) return ctx.toast('Não foi possível cancelar: ' + (r.msg || r.status)); ctx.setUi({ asked: false }); ctx.toast('Horário cancelado.'); }); } }); } }; });
    // dias bloqueados (folga, viagem, feriado): nenhum horário é ofertado nesses dias; o que já está marcado continua
    var uid = (C && C.user() || {}).id;
    var loadEx = function () {
      C.db('GET', 'trainers?select=id&user_id=eq.' + encodeURIComponent(uid || '')).then(function (t) {
        var tid = t.ok && t.data && t.data[0] && t.data[0].id; if (!tid) return ctx.setUi({ ex: null });
        C.db('GET', 'availability_exceptions?select=day,note&trainer_id=eq.' + tid + '&day=gte.' + new Date().toISOString().slice(0, 10) + '&order=day.asc').then(function (r) { ctx.setUi({ tid: tid, ex: r.ok ? (r.data || []) : null }); });
      });
    };
    if (C && !ui.exAsked) { ctx.setUi({ exAsked: true }); loadEx(); }
    var addEx = function () {
      var d = String(ui.exDay || ''), today = new Date().toISOString().slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || d < today) return ctx.setUi({ exErr: 'Escolha uma data de hoje em diante.' });
      if (!ui.tid || ui.exBusy) return; ctx.setUi({ exBusy: true, exErr: '' });
      C.db('POST', 'availability_exceptions', { trainer_id: ui.tid, day: d, note: String(ui.exNote || '').trim().slice(0, 120) || null }).then(function (r) {
        if (!r.ok) return ctx.setUi({ exBusy: false, exErr: r.status === 409 ? 'Este dia já está bloqueado.' : (r.offline ? 'Sem conexão: nada mudou.' : 'Não foi possível bloquear agora.') });
        ctx.setUi({ exBusy: false, exDay: '', exNote: '' }); ctx.toast('Dia bloqueado. Horários já marcados nesse dia continuam marcados.'); loadEx();
      });
    };
    var exs = (ui.ex || []).map(function (e) { var p2 = e.day.split('-'), dt = new Date(Number(p2[0]), Number(p2[1]) - 1, Number(p2[2]));
      return { when: dt.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }), note: e.note || '', hasNote: !!e.note,
        del: function () { C.db('DELETE', 'availability_exceptions?trainer_id=eq.' + ui.tid + '&day=eq.' + e.day).then(function (r) { ctx.toast(r.ok ? 'Dia liberado de novo.' : 'Não foi possível liberar agora.'); loadEx(); }); } }; });
    return {
      exs: exs, hasExs: exs.length > 0, exFail: ui.ex === null, exDay: ui.exDay || '', exNote: ui.exNote || '', setExDay: function (e) { ctx.setUi({ exDay: U.val(e), exErr: '' }); }, setExNote: function (e) { ctx.setUi({ exNote: U.val(e) }); },
      addEx: addEx, exLabel: ui.exBusy ? 'Bloqueando…' : 'Bloquear dia', exErr: ui.exErr || '', hasExErr: !!ui.exErr,
      loading: !!ui.loading, loadErr: !!ui.loadErr, tz: 'Fuso: Brasília (America/Sao_Paulo)',
      days: DAYS.map(function (d) { var r = day(d[0]); return { name: d[1], on: r.on, onTxt: String(r.on), cls: 'check' + (r.on ? ' is-on' : ''), from: r.from, to: r.to, slot: r.slot, toggle: upd(d[0], 'on'), setFrom: upd(d[0], 'from'), setTo: upd(d[0], 'to'), setSlot: upd(d[0], 'slot'), idF: 'av-f' + d[0], idT: 'av-t' + d[0], idS: 'av-s' + d[0] }; }),
      save: save, saveLabel: ui.busy ? 'Salvando…' : 'Salvar disponibilidade', err: ui.err || '', hasErr: !!ui.err,
      appts: appts, hasAppts: appts.length > 0, noAppts: !appts.length && !ui.loading
    };
  }
});
