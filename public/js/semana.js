/* Semana do treino (calendário semanal guardado junto da versão do treino no servidor).
   Treinador: escolhe, para cada dia, uma sessão, descanso ou nada. Não cria versão nova do treino.
   Aluno: vê a semana com previsto, feito e descanso. Dia sem nada marcado NÃO é descanso: descanso só quando o treinador marcou. */
(function () {
  var U = window.U;
  var DAYS = [['1', 'Segunda', 'Seg'], ['2', 'Terça', 'Ter'], ['3', 'Quarta', 'Qua'], ['4', 'Quinta', 'Qui'], ['5', 'Sexta', 'Sex'], ['6', 'Sábado', 'Sáb'], ['7', 'Domingo', 'Dom']];
  var iso = function (d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); };
  var first = function (n) { return String(n || '').split(' ')[0]; };
  var tz = function () { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo'; } catch (_) { return 'America/Sao_Paulo'; } };
  var monday = function () { var d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; };
  var title = function (s, i) { return (s && s.title) || ('Sessão ' + (i + 1)); };

  function trainer(ctx, lid, L) {
    var C = window.CONTA, ui = ctx.ui, w = L.workout;
    if (!w || !(w.sessions || []).length || L.status === 'encerrado') return { show: false };
    var saved = (w.schedule && w.schedule.days) || {};
    var days = ui.wkDays && ui.wkFor === lid + ':' + w.version ? ui.wkDays : saved;
    var dirty = JSON.stringify(days) !== JSON.stringify(saved);
    var set = function (k, v) { var n = Object.assign({}, days); if (v === '') delete n[k]; else n[k] = v; ctx.setUi({ wkDays: n, wkFor: lid + ':' + w.version, wkErr: '' }); };
    var nm = first(L.studentName), nSet = Object.keys(days).length;
    return {
      show: true,
      sub: nSet ? 'É o que ' + nm + ' vê na semana dele. Mudar os dias não cria versão nova do treino.' : 'Sem dias definidos, ' + nm + ' vê as sessões em lista e escolhe qual fazer. Dia em branco não é descanso.',
      rows: DAYS.map(function (d) {
        var cur = days[d[0]];
        var opts = [{ label: 'Nada', v: '' }].concat(w.sessions.map(function (s, i) { return { label: title(s, i), v: i }; })).concat([{ label: 'Descanso', v: 'descanso' }]);
        return { day: d[1], opts: opts.map(function (o) { var on = o.v === '' ? cur === undefined : cur === o.v; return { label: o.label, on: String(on), cls: 'chip' + (on ? ' is-on' : ''), pick: function () { set(d[0], o.v); } }; }) };
      }),
      dirty: dirty, err: ui.wkErr || '', hasErr: !!ui.wkErr, saveLabel: ui.wkBusy ? 'Salvando…' : 'Salvar semana',
      save: function () {
        if (ui.wkBusy) return; ctx.setUi({ wkBusy: true, wkErr: '' });
        var body = nSet ? { tz: (w.schedule && w.schedule.tz) || tz(), startsOn: (w.schedule && w.schedule.startsOn) || iso(new Date()), days: days } : null;
        C.rpc('set_workout_schedule', { p_link: lid, p_schedule: body }).then(function (r) {
          if (!r.ok) return ctx.setUi({ wkBusy: false, wkErr: r.offline ? 'Sem conexão: a semana não foi salva.' : 'Não salvo: ' + (r.msg || r.status) + '.' });
          w.schedule = (r.data && r.data.schedule) || null;
          ctx.setUi({ wkBusy: false, wkDays: null, wkFor: '' }); ctx.toast(nSet ? 'Semana salva. ' + nm + ' já vê os dias.' : 'Dias removidos. ' + nm + ' volta a ver as sessões em lista.');
          C.links().then(function () { if (window.__refreshLinks) window.__refreshLinks(); });
        });
      }
    };
  }

  // sessions = registros já enviados deste acompanhamento (com submitted_at e session_key)
  function student(ctx, link, sessions, visible) {
    var w = link.workout, sch = w && w.schedule && w.schedule.days;
    if (!visible || !w || !sch || !Object.keys(sch).length) return { show: false, todayIdx: -1 };
    var tf = first(link.trainerName || 'seu treinador'), mon = monday(), end = new Date(mon.getTime() + 7 * 864e5), today = String(((new Date().getDay() + 6) % 7) + 1);
    // feito nesta semana, por sessão (cada sessão de uma versão é registrada uma vez)
    var doneAt = {};
    (sessions || []).forEach(function (s) { if (!s.submitted_at) return; var t = new Date(s.submitted_at); if (t < mon || t >= end) return;
      w.sessions.forEach(function (x, i) { if (s.session_key === link.id + '_v' + w.version + '_' + x.id) doneAt[i] = t; }); });
    var used = {}, planned = 0, done = 0;
    var days = DAYS.map(function (d, n) {
      var v = sch[d[0]], date = new Date(mon.getTime() + n * 864e5), isToday = d[0] === today, what, st = '';
      if (v === 'descanso') { what = 'Descanso'; st = 'descanso'; }
      else if (typeof v === 'number' && w.sessions[v]) { what = title(w.sessions[v], v); planned++; if (doneAt[v] && !used[v]) { used[v] = 1; done++; st = 'feito'; } else st = date < new Date(new Date().setHours(0, 0, 0, 0)) ? 'passou' : 'previsto'; }
      else { what = 'Nada marcado'; st = 'vazio'; }
      var tag = { feito: 'Feito', previsto: isToday ? 'Hoje' : 'Previsto', passou: 'Não registrado', descanso: isToday ? 'Hoje' : '', vazio: isToday ? 'Hoje' : '' }[st];
      return { day: d[2] + ' ' + ('0' + date.getDate()).slice(-2) + '/' + ('0' + (date.getMonth() + 1)).slice(-2), what: what, tag: tag, hasTag: !!tag, cls: 'onb-secs__r' + (isToday ? ' is-today' : ''), tagCls: 'badge ' + (st === 'feito' ? 'badge--ok' : st === 'passou' ? 'badge--warn' : 'badge--plain'), isToday: isToday };
    });
    var tv = sch[today], todayIdx = typeof tv === 'number' && w.sessions[tv] ? tv : -1;
    var todayTxt = tv === 'descanso' ? 'Hoje é dia de descanso no plano de ' + tf + '. Se quiser treinar mesmo assim, escolha uma sessão abaixo.' : todayIdx >= 0 ? 'Hoje: ' + title(w.sessions[todayIdx], todayIdx) + (doneAt[todayIdx] ? ' (já registrado nesta semana).' : '.') : 'Hoje não há sessão marcada. Isso não quer dizer descanso: você pode escolher uma sessão abaixo.';
    return { show: true, todayIdx: todayIdx, todayDone: todayIdx >= 0 && !!doneAt[todayIdx], days: days, todayTxt: todayTxt,
      sum: planned ? done + ' de ' + planned + ' ' + (planned === 1 ? 'treino previsto' : 'treinos previstos') + ' nesta semana ' + (done === 1 ? 'registrado' : 'registrados') : 'Nenhum treino previsto nesta semana',
      note: 'Semana definida por ' + tf + '. "Não registrado" quer dizer só que não há registro seu naquele dia.' };
  }
  window.WEEK = { trainer: trainer, student: student };
})();
