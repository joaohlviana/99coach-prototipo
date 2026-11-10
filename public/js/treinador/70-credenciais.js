/* T8 · Credenciais profissionais do treinador (ACC10): CREF, formação e certificados, com envio de arquivo local e estado de revisão. */
(function () {
  'use strict';
  // state: declarado · pendente · verificado · vencido · contestado
  DB.seed('t8_creds', [
    { id: 'cref', kind: 'CREF', name: 'CREF 012345-G/PR', scope: 'Educação física · PR', state: 'verificado', date: '24/09/2026', until: '12/2027', source: 'Consulta ao CREF9/PR em 24/09/2026', doc: 'carteira-cref.pdf' },
    { id: 'uel', kind: 'Formação', name: 'Bacharel em Educação Física — UEL', scope: 'Graduação · Brasil', state: 'declarado', date: '24/09/2026', until: '', source: 'Informado por você', doc: '' },
    { id: 'cfl1', kind: 'Certificação', name: 'CrossFit Level 1 (CF-L1)', scope: 'CrossFit · curso de certificação', state: 'pendente', date: '20/10/2026', until: '', source: 'Certificado enviado por você', doc: 'cf-l1-certificado.pdf' }
  ]);

  var KINDS = ['CREF', 'Formação', 'Certificação', 'Outro'];
  var ST = {
    declarado: { label: 'Informada', badge: 'badge badge--plain', pub: 'informada', trust: 'trust trust--decl', ic: 'file' },
    pendente: { label: 'Em verificação', badge: 'badge badge--warn', pub: 'informada', trust: 'trust trust--decl', ic: 'file' },
    verificado: { label: 'Verificada', badge: 'badge badge--ok', pub: 'verificada', trust: 'trust trust--ver', ic: 'shield' },
    vencido: { label: 'Vencida', badge: 'badge badge--risk', pub: 'informada', trust: 'trust trust--decl', ic: 'file' },
    contestado: { label: 'Contestada', badge: 'badge badge--risk', pub: 'oculta enquanto revisamos', trust: 'trust trust--decl', ic: 'alert' }
  };
  function pubText(c) {
    var s = ST[c.state] || ST.declarado;
    if (c.state === 'contestado') return 'Oculta enquanto revisamos';
    var masc = c.kind === 'CREF' || c.kind === 'Outro';
    if (c.state === 'verificado') return (c.kind === 'Outro' ? 'Credencial' : c.kind) + (c.kind === 'Outro' ? ' verificada · ' : (masc ? ' verificado · ' : ' verificada · ')) + c.date.slice(0, 5);
    return (c.kind === 'Outro' ? 'Credencial informada' : c.kind + (masc ? ' informado' : ' informada'));
  }

  REG.screen({
    page: 'treinador', key: 'credenciais', id: 'ACC10', title: 'Credenciais', nav: 'conta', back: 'TMENU',
    normal: 'Uso recorrente',
    scens: [['pendente', 'Pendente'], ['verificado', 'Verificado'], ['vencido', 'Vencido'], ['falhaEnvio', 'Falha de envio'], ['indisponivel', 'Consulta indisponível'], ['vazio', 'Nenhuma credencial']],
    testIds: ['cfl1'],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn;
      var list = JSON.parse(JSON.stringify(DB.t8_creds));
      if (scn === 'pendente') list.forEach(function (c) { if (c.kind === 'CREF') { c.state = 'pendente'; c.date = '20/10/2026'; c.source = 'Documento enviado por você'; } });
      if (scn === 'verificado') list.forEach(function (c) { if (c.id === 'cfl1') { c.state = 'verificado'; c.date = '26/10/2026'; c.source = 'Conferido com o emissor (CrossFit LLC) em 26/10/2026'; } });
      if (scn === 'vencido') list.forEach(function (c) { if (c.kind === 'CREF') { c.state = 'vencido'; c.until = '09/2026'; c.source = 'Validade informada vencida em 09/2026'; } });
      if (scn === 'vazio') list = [];
      var selId = ui.sel !== undefined ? ui.sel : (ctx.id || '');
      var sel = list.find(function (c) { return c.id === selId; }) || null;
      var formOpen = !!ui.form || scn === 'falhaEnvio';
      var f = ui.f || (scn === 'falhaEnvio' ? { kind: 'Certificação', name: 'Certificação LPO Nível 1', scope: 'Levantamento olímpico · curso', file: 'lpo-nivel1.pdf', fileSize: '820 KB', decl: true, editId: '' } : { kind: 'CREF', name: '', scope: '', file: '', fileSize: '', decl: false, editId: '' });
      var setF = function (o) { ctx.setUi({ f: Object.assign({}, f, o) }); };
      var tried = !!ui.tried;
      var errName = !f.name.trim() ? 'Informe ' + (f.kind === 'CREF' ? 'o número do CREF.' : 'o nome da credencial.') : (f.kind === 'CREF' && !/^(CREF\s*)?\d{6}-[GP]\/[A-Z]{2}$/i.test(f.name.trim()) ? 'Use o formato 000000-G/UF (ex.: 012345-G/PR).' : '');
      var errScope = !f.scope.trim() ? 'Diga onde ela vale (ex.: Educação física · PR).' : '';
      var errFile = !f.file ? 'Anexe o documento (PDF ou imagem até 10 MB).' : '';
      var errDecl = !f.decl ? 'Confirme que as informações são verdadeiras.' : '';
      var errs = [errName, errScope, errFile, errDecl].filter(Boolean);

      function submit() {
        if (errs.length) { ctx.setUi({ tried: true }); return; }
        var nm = f.kind === 'CREF' && !/^CREF/i.test(f.name.trim()) ? 'CREF ' + f.name.trim().toUpperCase() : f.name.trim();
        ctx.ask({
          title: f.editId ? 'Enviar correção?' : 'Enviar credencial?',
          text: 'Até a verificação terminar, o perfil mostra “' + (f.kind === 'CREF' ? 'CREF informado' : (f.kind === 'Outro' ? 'Credencial informada' : f.kind + ' informada')) + '”, sem selo.',
          lines: [nm + ' · ' + f.scope, 'Documento: ' + f.file + ' · restrito à equipe de verificação, nunca vira link público', 'Pro não muda estado de verificação'],
          ok: 'Enviar credencial',
          onOk: function () {
            var C = DB.t8_creds, today = '26/10/2026';
            if (f.editId) { var x = C.find(function (c) { return c.id === f.editId; }); if (x) { x.name = nm; x.scope = f.scope.trim(); x.doc = f.file; x.state = 'pendente'; x.date = today; x.source = 'Correção enviada por você'; } }
            else C.push({ id: DB.uid('cr'), kind: f.kind, name: nm, scope: f.scope.trim(), state: 'pendente', date: today, until: '', source: 'Documento enviado por você', doc: f.file });
            ctx.scenario('');
            ctx.setUi({ form: false, f: null, tried: false });
            ctx.toast('Credencial enviada. Em verificação desde ' + today.slice(0, 5) + '; o perfil fica sem selo até lá.');
          }
        });
      }

      var rows = list.map(function (c) {
        var s = ST[c.state] || ST.declarado;
        return {
          id: c.id, kind: c.kind, name: c.name, scope: c.scope, date: c.date.slice(0, 5), stLabel: c.state === 'pendente' ? 'Em verificação desde ' + c.date.slice(0, 5) : s.label, badge: s.badge,
          pub: pubText(c), trust: s.trust, trustIc: 'ic ic--xs i-' + s.ic,
          cls: 't8-cred' + (sel && sel.id === c.id ? ' is-on' : ''), on: String(!!(sel && sel.id === c.id)),
          open: function () { ctx.setUi({ sel: sel && sel.id === c.id ? '' : c.id }); }
        };
      });

      var A = null;
      if (scn === 'pendente') A = { cls: 'alert alert--info', ic: 'clock', t: 'Em verificação desde 20/10', x: 'Conferimos o CREF com o conselho regional. Até lá, o perfil mostra “CREF informado”, sem selo azul.', btn: 'Consultar de novo', act: function () { ctx.toast('Consultado às ' + U.now() + ': ainda em verificação.'); } };
      if (scn === 'verificado') A = { cls: 'alert alert--ok', ic: 'shield', t: 'Verificada para este escopo', x: 'CF-L1 conferido com o emissor em 26/10/2026. O selo vale para “CrossFit · curso de certificação”, não para outras áreas.', btn: 'Ver prévia', act: function () { ctx.go('ACC07'); } };
      if (scn === 'vencido') A = { cls: 'alert alert--warn', ic: 'alert', t: 'CREF vencido', x: 'A validade informada terminou em 09/2026. O perfil voltou a mostrar “CREF informado” e avisamos você por e-mail. Envie o documento atualizado.', btn: 'Corrigir informação', act: function () { ctx.setUi({ form: true, f: { kind: 'CREF', name: '012345-G/PR', scope: 'Educação física · PR', file: '', fileSize: '', decl: false, editId: 'cref' } }); } };
      if (scn === 'falhaEnvio') A = { cls: 'alert alert--risk', ic: 'alert', t: 'Falha de envio', x: 'O documento não chegou. Seus dados continuam no formulário; confira o arquivo e envie de novo.', btn: '', act: null };
      if (scn === 'indisponivel') A = { cls: 'alert alert--warn', ic: 'refresh', t: 'Consulta indisponível', x: 'O conselho regional não respondeu. Nada foi revogado nem verificado: os estados abaixo são os da última consulta (24/09/2026).', btn: 'Tentar de novo', act: function () { ctx.scenario(''); ctx.toast('Consultado às ' + U.now() + ': estados confirmados.'); } };

      var selV = sel ? {
        name: sel.name, kind: sel.kind, st: (ST[sel.state] || ST.declarado).label, badge: (ST[sel.state] || ST.declarado).badge,
        date: sel.date, scope: sel.scope, until: sel.until || '—', source: sel.source, pub: pubText(sel), trust: (ST[sel.state] || ST.declarado).trust,
        doc: sel.doc ? sel.doc + ' · restrito' : 'Nenhum documento enviado', hasDoc: !!sel.doc,
        isPend: sel.state === 'pendente', canFix: sel.state !== 'verificado' || sel.kind !== 'CREF'
      } : null;

      return {
        alert: A || { cls: '', t: '', x: '', btn: '', act: function () {} }, hasAlert: !!A, alertIc: 'ic ic--sm i-' + (A ? A.ic : 'info'), alertHasBtn: !!(A && A.btn),
        rows: rows, hasRows: rows.length > 0, empty: rows.length === 0,
        sel: selV || { name: '', kind: '', st: '', badge: '', date: '', scope: '', until: '', source: '', pub: '', trust: '', doc: '', hasDoc: false, isPend: false, canFix: false }, hasSel: !!selV,
        closeSel: function () { ctx.setUi({ sel: '' }); },
        fixSel: function () { if (!sel) return; ctx.setUi({ form: true, sel: '', f: { kind: sel.kind, name: sel.kind === 'CREF' ? sel.name.replace(/^CREF\s*/i, '') : sel.name, scope: sel.scope, file: '', fileSize: '', decl: false, editId: sel.id } }); },
        addEvidence: function (e) { var fl = e && e.target && e.target.files && e.target.files[0]; if (!fl || !sel) return; var x = DB.t8_creds.find(function (c) { return c.id === sel.id; }); if (x) { x.doc = fl.name; x.state = x.state === 'verificado' ? 'verificado' : 'pendente'; x.source = 'Evidência adicionada em 26/10/2026'; } ctx.toast('Evidência anexada: ' + fl.name + '. Documento restrito à equipe de verificação.'); },
        askReview: function () { ctx.go('ACC09'); },
        formOpen: formOpen, formClosed: !formOpen,
        openForm: function () { ctx.setUi({ form: true, sel: '', f: null, tried: false }); },
        closeForm: function () { if (scn === 'falhaEnvio') ctx.scenario(''); ctx.setUi({ form: false, f: null, tried: false }); },
        formTitle: f.editId ? 'Corrigir informação' : 'Adicionar credencial',
        kinds: KINDS.map(function (k) { var on = f.kind === k; return { label: k, on: String(on), cls: 'chip t8-chip' + (on ? ' is-on' : ''), pick: function () { setF({ kind: k }); } }; }),
        fName: f.name, setName: function (e) { setF({ name: String(U.val(e)).slice(0, 120) }); }, nameLabel: f.kind === 'CREF' ? 'Número do CREF' : 'Nome da credencial', namePh: f.kind === 'CREF' ? '012345-G/PR' : 'Ex.: Certificação LPO Nível 1',
        hasNameErr: tried && !!errName, nameErr: errName, nameCls: 'input' + (tried && errName ? ' is-err' : ''),
        fScope: f.scope, setScope: function (e) { setF({ scope: String(U.val(e)).slice(0, 80) }); }, hasScopeErr: tried && !!errScope, scopeErr: errScope, scopeCls: 'input' + (tried && errScope ? ' is-err' : ''),
        scopeHelp: f.kind === 'CREF' ? 'O CREF vale para o estado do conselho regional. Não é exigência em outros países.' : 'Diga o que a credencial cobre. O selo vale só para esse escopo.',
        fFile: f.file ? f.file + (f.fileSize ? ' · ' + f.fileSize : '') : '', hasFile: !!f.file, noFile: !f.file,
        pickFile: function (e) {
          var fl = e && e.target && e.target.files && e.target.files[0];
          if (!fl) return;
          if (!/^(image\/|application\/pdf)/.test(fl.type || '')) { ctx.toast('Use PDF ou imagem.'); return; }
          if (fl.size > 10e6) { ctx.toast('O arquivo passa de 10 MB. Envie um menor.'); return; }
          if (typeof FileReader === 'undefined') { setF({ file: fl.name, fileSize: Math.max(1, Math.round(fl.size / 1024)) + ' KB' }); return; }
          var rd = new FileReader();
          rd.onload = function () { ctx.setUi({ f: Object.assign({}, f, { file: fl.name, fileSize: Math.max(1, Math.round(fl.size / 1024)) + ' KB' }) }); ctx.toast('Arquivo lido só neste navegador. Nada foi enviado ainda.'); };
          rd.onerror = function () { ctx.toast('Não conseguimos ler o arquivo. Tente outro.'); };
          rd.readAsArrayBuffer(fl);
        },
        removeFile: function () { setF({ file: '', fileSize: '' }); },
        hasFileErr: tried && !!errFile, fileErr: errFile,
        declOn: String(!!f.decl), declCls: 'check' + (f.decl ? ' is-on' : ''), toggleDecl: function () { setF({ decl: !f.decl }); }, hasDeclErr: tried && !!errDecl, declErr: errDecl,
        submit: submit, submitLabel: scn === 'falhaEnvio' ? 'Enviar de novo' : 'Enviar credencial',
        preview: function () { ctx.go('ACC07'); }
      };
    }
  });
})();
