/* T5 · TRE19 Disponibilidade para atendimento: faixas por dia editáveis, intervalo, fuso, exceções,
   conflito com compromissos já marcados (nunca cancela em silêncio) e salvar com resumo confirmado. */
(function () {
  var DAYS = [['seg', 'Segunda', 'Seg'], ['ter', 'Terça', 'Ter'], ['qua', 'Quarta', 'Qua'], ['qui', 'Quinta', 'Qui'], ['sex', 'Sexta', 'Sex'], ['sab', 'Sábado', 'Sáb'], ['dom', 'Domingo', 'Dom']];
  var DNAME = {}; DAYS.forEach(function (d) { DNAME[d[0]] = d; });
  var TZS = [['Brasília (UTC−3)', 'Brasília', -3], ['Manaus (UTC−4)', 'Manaus', -4], ['Rio Branco (UTC−5)', 'Rio Branco', -5], ['Noronha (UTC−2)', 'Noronha', -2]];
  var GAPS = [0, 10, 15, 30];
  // preferências desta tela que não existem em DB.disponibilidade (intervalo, novos alunos, se já foi configurada)
  DB.seed('t5_dispo', { gap: 15, acceptNew: true, configured: true });

  var RE_T = /^([01]\d|2[0-3]):[0-5]\d$/, RE_D = /^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])$/;
  function min(t) { var p = String(t).split(':'); return Number(p[0]) * 60 + Number(p[1]); }
  function hhmm(m) { m = ((m % 1440) + 1440) % 1440; return ('0' + Math.floor(m / 60)).slice(-2) + ':' + ('0' + (m % 60)).slice(-2); }
  function parseR(s) { var p = String(s).split(/[–-]/); return { s: (p[0] || '').trim(), e: (p[1] || '').trim() }; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function tzOf(label) { return TZS.filter(function (z) { return z[0] === label; })[0] || TZS[0]; }

  function fromDB() {
    var d = DB.disponibilidade, days = {};
    DAYS.forEach(function (x) { days[x[0]] = (d.days[x[0]] || []).map(parseR); });
    return { tz: d.tz, days: days, exc: clone(d.exceptions || []), gap: DB.t5_dispo.gap, acceptNew: DB.t5_dispo.acceptNew, configured: DB.t5_dispo.configured, blank: false };
  }
  function scenarioDraft(scn) {
    var dr = fromDB();
    if (scn === 'conflito') dr.exc.push({ id: 'x9', date: '28/10', text: 'Curso de LPO · sem atendimento' });
    if (scn === 'compromisso') dr.days.seg = [{ s: '06:00', e: '10:00' }];
    if (scn === 'semhorarios') DAYS.forEach(function (x) { dr.days[x[0]] = []; });
    if (scn === 'nenhuma') { DAYS.forEach(function (x) { dr.days[x[0]] = []; }); dr.exc = []; dr.configured = false; dr.blank = true; }
    if (scn === 'fuso') dr.tz = 'Manaus (UTC−4)';
    if (scn === 'falha') dr.days.sab = [{ s: '08:00', e: '07:00' }];
    return dr;
  }
  // erros locais de cada faixa
  function rangeErr(list, i) {
    var r = list[i];
    if (!RE_T.test(r.s) || !RE_T.test(r.e)) return 'Use o formato 00:00 nos dois campos.';
    if (min(r.e) <= min(r.s)) return 'O fim precisa ser depois do início.';
    for (var j = 0; j < list.length; j++) {
      if (j === i || !RE_T.test(list[j].s) || !RE_T.test(list[j].e)) continue;
      if (min(r.s) < min(list[j].e) && min(list[j].s) < min(r.e)) return 'Esta faixa sobrepõe outra do mesmo dia.';
    }
    return '';
  }
  function inside(dr, wd, date, time) {
    if (dr.exc.some(function (x) { return x.date === date; })) return false;
    var t = min(time);
    return (dr.days[wd] || []).some(function (r) { return RE_T.test(r.s) && RE_T.test(r.e) && min(r.s) <= t && t < min(r.e); });
  }
  function who(c) { var a = c.student ? DB.find('alunos', c.student) : null; return a ? a.name : (c.group || 'Compromisso'); }
  // compromissos que estavam dentro da regra salva e ficam fora do rascunho
  function conflicts(dr) {
    var saved = fromDB();
    return DB.agenda.filter(function (c) { return c.status !== 'cancelado'; }).map(function (c) {
      var wd = c.day.split(' ')[0], date = c.day.split(' ')[1];
      if (!inside(saved, wd, date, c.time) || inside(dr, wd, date, c.time)) return null;
      var byExc = dr.exc.some(function (x) { return x.date === date; });
      return { id: c.id, byExc: byExc, label: who(c) + ' · ' + c.day + ' ' + c.time, why: byExc ? 'Exceção em ' + date : 'Fora das faixas de ' + DNAME[wd][1].toLowerCase() };
    }).filter(Boolean);
  }
  function dayLine(list) { return list.length ? list.map(function (r) { return r.s + '–' + r.e; }).join(' · ') : 'sem atendimento'; }

  REG.screen({
    page: 'treinador', key: 'disponibilidade', id: 'TRE19', title: 'Disponibilidade', nav: 'agenda', back: 'TRE20', form: true,
    normal: 'Horários salvos',
    scens: [['conflito', 'Conflito'], ['semhorarios', 'Sem horários'], ['excecao', 'Exceção salva'], ['nenhuma', 'Nenhuma disponibilidade'], ['fuso', 'Fuso alterado'], ['compromisso', 'Compromisso em conflito'], ['falha', 'Falha ao salvar']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn;
      var dr = ui.draft || scenarioDraft(scn);
      var saved = DB.disponibilidade;
      var put = function (fn) { var n = clone(dr); fn(n); ctx.setUi({ draft: n, savedMsg: '' }); };

      // ---------- faixas por dia ----------
      var errCount = 0, firstErr = '';
      var days = DAYS.map(function (d) {
        var list = dr.days[d[0]] || [];
        var ranges = list.map(function (r, i) {
          var err = rangeErr(list, i);
          if (err) { errCount++; if (!firstErr) firstErr = 't5-d-' + d[0] + '-' + i + '-s'; }
          return {
            s: r.s, e: r.e, idS: 't5-d-' + d[0] + '-' + i + '-s', idE: 't5-d-' + d[0] + '-' + i + '-e',
            lblS: d[1] + ', faixa ' + (i + 1) + ', início', lblE: d[1] + ', faixa ' + (i + 1) + ', fim', lblDel: 'Remover faixa ' + r.s + '–' + r.e + ' de ' + d[1].toLowerCase(),
            err: err, hasErr: !!err, cls: 'input t5-time' + (err ? ' is-err' : ''),
            setS: function (e) { var v = U.val(e); put(function (n) { n.days[d[0]][i].s = v; }); },
            setE: function (e) { var v = U.val(e); put(function (n) { n.days[d[0]][i].e = v; }); },
            del: function () { put(function (n) { n.days[d[0]].splice(i, 1); }); }
          };
        });
        return {
          key: d[0], name: d[1], short: d[2], ranges: ranges, hasRanges: ranges.length > 0, noRanges: ranges.length === 0,
          addLbl: 'Adicionar faixa em ' + d[1].toLowerCase(),
          add: function () {
            put(function (n) {
              var l = n.days[d[0]], last = l[l.length - 1];
              var s = last && RE_T.test(last.e) ? Math.min(min(last.e) + 60, 22 * 60) : 6 * 60;
              l.push({ s: hhmm(s), e: hhmm(Math.min(s + 120, 23 * 60 + 59)) });
            });
          }
        };
      });
      var totalRanges = DAYS.reduce(function (n, d) { return n + (dr.days[d[0]] || []).length; }, 0);

      // ---------- intervalo e fuso ----------
      var gaps = GAPS.map(function (g) { var on = dr.gap === g; return { label: g ? g + ' min' : 'Sem intervalo', cls: 'chip t5-chip' + (on ? ' is-on' : ''), on: String(on), pick: function () { put(function (n) { n.gap = g; }); } }; });
      var tzs = TZS.map(function (z) { var on = dr.tz === z[0]; return { label: z[0], cls: 'chip t5-chip' + (on ? ' is-on' : ''), on: String(on), pick: function () { put(function (n) { n.tz = z[0]; }); } }; });
      var tzNow = tzOf(dr.tz), tzSaved = tzOf(saved.tz), tzChanged = dr.tz !== saved.tz;
      var diff = tzSaved[2] - tzNow[2]; // 06:00 no novo fuso = 06:00 + diff no fuso antigo
      var tzEx = '06:00 em ' + tzNow[1] + ' = ' + hhmm(6 * 60 + diff * 60) + ' em ' + tzSaved[1];

      // ---------- exceções ----------
      var exc = dr.exc.map(function (x, i) {
        var hit = DB.agenda.filter(function (c) { return c.status !== 'cancelado' && c.day.split(' ')[1] === x.date; });
        return { date: x.date, text: x.text, delLbl: 'Remover exceção de ' + x.date, hasHit: hit.length > 0, hit: hit.length ? U.plural(hit.length, 'compromisso marcado continua', 'compromissos marcados continuam') + ' nesta data' : '',
          del: function () { put(function (n) { n.exc.splice(i, 1); }); } };
      });
      var exDate = ui.exDate || '', exText = has(ui, 'exText') ? ui.exText : 'Feriado · sem atendimento';
      var exDateErr = ui.exTried && !RE_D.test(exDate) ? 'Use a data no formato 15/11.' : (ui.exTried && dr.exc.some(function (x) { return x.date === exDate; }) ? 'Já existe exceção nesta data.' : '');
      var exTextErr = ui.exTried && !String(exText).trim() ? 'Diga o motivo; o aluno vê só “sem atendimento”.' : '';

      // ---------- conflitos ----------
      var conf = conflicts(dr);
      var confByExc = conf.some(function (c) { return c.byExc; });
      var compare = function () {
        ctx.ask({
          title: confByExc ? 'Conflito com compromisso marcado' : 'Compromisso fora da nova regra',
          text: 'A nova disponibilidade não cancela nada. Estes compromissos continuam marcados até você remarcar ou cancelar na agenda.',
          lines: conf.map(function (c) { return c.label + ' — ' + c.why; }), ok: 'Abrir agenda', cancel: 'Fechar',
          onOk: function () { ctx.go('TRE20', { id: conf[0] ? conf[0].id : '' }); }
        });
      };

      // ---------- resumo ----------
      var summary = [];
      var wk = ['seg', 'ter', 'qua', 'qui', 'sex'].map(function (k) { return dayLine(dr.days[k] || []); });
      if (wk.every(function (x) { return x === wk[0]; })) summary.push({ k: 'Seg a sex', v: wk[0] });
      else ['seg', 'ter', 'qua', 'qui', 'sex'].forEach(function (k, i) { summary.push({ k: DNAME[k][2], v: wk[i] }); });
      summary.push({ k: 'Sábado', v: dayLine(dr.days.sab || []) });
      summary.push({ k: 'Domingo', v: dayLine(dr.days.dom || []) });
      summary.push({ k: 'Intervalo', v: dr.gap ? dr.gap + ' min entre sessões' : 'sem intervalo' });
      summary.push({ k: 'Exceções', v: dr.exc.length ? dr.exc.map(function (x) { return x.date + ' · ' + x.text.split('·')[0].trim().toLowerCase(); }).join('; ') : 'nenhuma' });
      summary.push({ k: 'Fuso', v: dr.tz });

      var commit = function () {
        DB.disponibilidade.tz = dr.tz;
        DAYS.forEach(function (d) { DB.disponibilidade.days[d[0]] = (dr.days[d[0]] || []).map(function (r) { return r.s + '–' + r.e; }); });
        DB.disponibilidade.exceptions = clone(dr.exc);
        DB.disponibilidade.savedAt = '26/10 ' + U.now();
        DB.t5_dispo.gap = dr.gap; DB.t5_dispo.acceptNew = dr.acceptNew; DB.t5_dispo.configured = true;
        var n = fromDB();
        ctx.setUi({ draft: n, tried: false, savedMsg: 'Disponibilidade salva às ' + U.now() + ' · ' + n.tz + '. ' + (conf.length ? U.plural(conf.length, 'compromisso continua marcado', 'compromissos continuam marcados') + ' fora da regra; revise na agenda.' : 'Nenhum compromisso foi alterado.') });
      };
      var focusErr = function () { try { var el = document.getElementById(firstErr); if (el) el.focus(); } catch (_) {} };
      var save = function () {
        if (errCount) { ctx.setUi({ tried: true, savedMsg: '' }); focusErr(); return; }
        var lines = summary.map(function (s) { return s.k + ': ' + s.v; });
        lines.push(dr.acceptNew ? 'Novos alunos: aceitando pedidos (independe da agenda)' : 'Novos alunos: pedidos fechados (independe da agenda)');
        conf.forEach(function (c) { lines.push('Continua marcado: ' + c.label + ' (' + c.why.toLowerCase() + ')'); });
        ctx.ask({ title: 'Salvar disponibilidade?', text: 'Confira o resumo. Alunos passam a ver estes horários ao reservar. Compromissos já marcados não são cancelados.', lines: lines, ok: 'Salvar disponibilidade', cancel: 'Revisar', onOk: commit });
      };

      // falha ao salvar: a tentativa anterior foi recusada por um horário inválido; nada foi publicado
      var failOn = scn === 'falha' && errCount > 0;
      var showErrAlert = !failOn && !!ui.tried && errCount > 0;
      var blank = !!dr.blank;
      var noneSaved = !blank && totalRanges === 0;

      return {
        sub: 'Fuso: ' + dr.tz + ' · versão salva em ' + saved.savedAt,
        tz: dr.tz, tzShort: tzNow[1],
        blank: blank, editing: !blank,
        startSuggested: function () { put(function (n) { n.blank = false; n.configured = true; ['seg', 'ter', 'qua', 'qui', 'sex'].forEach(function (k) { n.days[k] = [{ s: '06:00', e: '10:00' }]; }); }); },
        startEmpty: function () { put(function (n) { n.blank = false; n.configured = true; }); },
        noneSaved: noneSaved,
        days: days, gaps: gaps, tzs: tzs,
        tzChanged: tzChanged, tzFrom: saved.tz, tzEx: tzEx,
        tzReview: function () {
          ctx.ask({ title: 'Revisar novo fuso', text: 'Os horários que você digitou passam a valer em ' + dr.tz + '. Compromissos já marcados mantêm o horário combinado.',
            lines: [tzEx, 'Segunda: ' + dayLine(dr.days.seg || []) + ' (' + tzNow[1] + ')', 'Alunos veem o horário convertido para o fuso deles.'], ok: 'Manter ' + tzNow[1], cancel: 'Fechar', onOk: function () { ctx.toast('Fuso ' + dr.tz + ' mantido no rascunho. Salve para publicar.'); } });
        },
        tzUndo: function () { put(function (n) { n.tz = saved.tz; }); },
        exc: exc, hasExc: exc.length > 0, noExc: exc.length === 0,
        excOpen: !!ui.addExc, toggleExc: function () { ctx.setUi({ addExc: !ui.addExc, exTried: false }); },
        exDate: exDate, exText: exText, exDateErr: exDateErr, hasExDateErr: !!exDateErr, exTextErr: exTextErr, hasExTextErr: !!exTextErr,
        exDateCls: 'input' + (exDateErr ? ' is-err' : ''),
        setExDate: function (e) { ctx.setUi({ exDate: U.val(e) }); },
        setExText: function (e) { ctx.setUi({ exText: U.val(e) }); },
        addExc: function () {
          var d = String(exDate).trim(), t = String(exText).trim();
          if (!RE_D.test(d) || !t || dr.exc.some(function (x) { return x.date === d; })) { ctx.setUi({ exTried: true }); return; }
          var n = clone(dr); n.exc.push({ id: DB.uid('x'), date: d, text: t });
          ctx.setUi({ draft: n, addExc: false, exTried: false, exDate: '', exText: 'Feriado · sem atendimento', savedMsg: '' });
          ctx.toast('Exceção em ' + d + ' adicionada ao rascunho. Salve para publicar.');
        },
        hasConf: conf.length > 0, confTitle: confByExc ? 'Conflito' : 'Compromisso em conflito', confBtn: confByExc ? 'Comparar' : 'Revisar',
        confText: (conf.length === 1 ? conf[0].label + ' fica fora da nova disponibilidade (' + conf[0].why.toLowerCase() + '). ' : U.plural(conf.length, 'compromisso fica', 'compromissos ficam') + ' fora da nova disponibilidade. ') + 'Nada é cancelado ao salvar.',
        compare: compare,
        excSaved: scn === 'excecao' && !ui.hideExcOk,
        hideExcOk: function () { ctx.setUi({ hideExcOk: true }); },
        failOn: failOn, fixFail: focusErr,
        showErrAlert: showErrAlert, errText: U.plural(errCount, 'horário precisa', 'horários precisam') + ' de ajuste. Nada foi publicado; a versão de ' + saved.savedAt + ' continua valendo.',
        fixNow: focusErr,
        savedMsg: ui.savedMsg || '', hasSaved: !!ui.savedMsg,
        summary: summary,
        acceptNew: dr.acceptNew, acceptCls: 'switch' + (dr.acceptNew ? ' is-on' : ''), acceptAria: String(!!dr.acceptNew),
        acceptSub: dr.acceptNew ? 'Recebendo pedidos pelo perfil. Lotar a agenda não fecha seu perfil.' : 'Pedidos fechados no perfil. Mensagens de alunos atuais continuam.',
        toggleAccept: function () { put(function (n) { n.acceptNew = !n.acceptNew; }); },
        save: save,
        goAgenda: function () { ctx.go('TRE20'); },
        goCal: function () { ctx.go('TRE17'); }
      };
    }
  });
})();
