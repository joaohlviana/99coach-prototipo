/* T8 · Perfil do treinador Rafael Lima: editar perfil e áreas atendidas (ACC06) e prévia/publicação (ACC07). */
(function () {
  'use strict';
  var PHOTO = 'bdc7ef1c8dbf05558c3bf8d575fc3a04';
  var MODS = ['CrossFit', 'Musculação', 'LPO', 'Funcional', 'Mobilidade', 'Corrida'];
  var LANGS = ['Português', 'Inglês', 'Espanhol'];
  var FMTS = [['Online', 'Online'], ['Presencial', 'Presencial · Londrina']];
  var REGIONS = ['Centro', 'Zona Sul', 'Zona Norte', 'Zona Leste', 'Zona Oeste', 'Gleba Palhano'];
  var MIN_PITCH = 60, MAX_PITCH = 400;

  // perfil salvo (rascunho salvo) + o que está publicado
  DB.seed('t8_perfil', {
    name: 'Rafael Lima', role: 'Treinador de CrossFit e Musculação', city: 'Londrina, PR',
    pitch: 'Atendo quem quer começar no CrossFit ou voltar à musculação com segurança. Na primeira semana avalio movimento e rotina; depois o treino chega toda semana no app, com ajuste a cada 15 dias. Presencial em Londrina ou online.',
    mods: ['CrossFit', 'Musculação'], langs: ['Português'], fmts: ['Online', 'Presencial'],
    regions: ['Centro', 'Zona Sul'], place: 'Box no Centro e academias da Zona Sul',
    photo: 'ds', photoUrl: '', photoAuth: true, photoFrom: 'Enviada por você em 24/09/2026 · uso no perfil autorizado',
    savedAt: '26/10 10:42', pending: ['Apresentação'],
    pub: 'publicado', pubAt: '24/09/2026 18:05', index: 'exibido', version: 3
  });

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function draftOf(p) { return { pitch: p.pitch, mods: p.mods.slice(), langs: p.langs.slice(), fmts: p.fmts.slice(), regions: p.regions.slice(), place: p.place, photo: p.photo, photoUrl: p.photoUrl, photoAuth: p.photoAuth }; }
  function has(list, x) { return list.indexOf(x) >= 0; }
  function toggle(list, x) { return has(list, x) ? list.filter(function (y) { return y !== x; }) : list.concat([x]); }
  function addrLike(t) { return /\d|\b(rua|r\.|av\.?|avenida|apto|apartamento|casa|cep|n[ºo°]|bloco|travessa|alameda)\b/i.test(String(t || '')); }
  function photoSrc(d) { return d.photo === 'local' ? d.photoUrl : (d.photo === 'ds' ? U.img(PHOTO) : ''); }

  // disponibilidade conhecida (DB.disponibilidade, compartilhada com a agenda)
  function availSummary() {
    var av = DB.disponibilidade || { days: {} }, names = { seg: 'seg', ter: 'ter', qua: 'qua', qui: 'qui', sex: 'sex', sab: 'sáb', dom: 'dom' };
    var on = Object.keys(names).filter(function (k) { return (av.days[k] || []).length; });
    return { days: on.map(function (k) { return names[k]; }).join(', '), n: on.length, saved: av.savedAt || '—', tz: av.tz || '' };
  }

  // validação do rascunho
  function validate(d) {
    var e = {};
    var n = (d.pitch || '').trim().length;
    if (n < MIN_PITCH) e.pitch = 'Escreva pelo menos ' + MIN_PITCH + ' caracteres (agora ' + n + '). Conte para quem é o seu trabalho e como funciona.';
    if (!d.mods.length) e.mods = 'Escolha pelo menos uma modalidade.';
    if (!d.langs.length) e.langs = 'Escolha pelo menos um idioma do atendimento.';
    if (!d.fmts.length) e.fmts = 'Escolha online, presencial ou os dois.';
    if (has(d.fmts, 'Presencial') && !d.regions.length) e.regions = 'Para atender presencial, marque pelo menos uma região de Londrina.';
    if (has(d.fmts, 'Presencial') && addrLike(d.place)) e.place = 'Use só bairro, região ou tipo de local. Número, rua e CEP nunca aparecem no perfil.';
    if (d.photo === 'local' && !d.photoAuth) e.photo = 'Confirme que a foto é sua e autorize o uso no perfil, ou remova a foto.';
    return e;
  }
  function changedFields(p, d) {
    var out = [];
    if (p.pitch !== d.pitch) out.push('Apresentação');
    if (p.mods.join() !== d.mods.join()) out.push('Modalidades');
    if (p.langs.join() !== d.langs.join()) out.push('Idiomas do atendimento');
    if (p.fmts.join() !== d.fmts.join()) out.push('Formatos');
    if (p.regions.join() !== d.regions.join() || p.place !== d.place) out.push('Área de atendimento');
    if (p.photo !== d.photo || p.photoUrl !== d.photoUrl) out.push('Foto');
    return out;
  }

  // ---------- ACC06 · Editar perfil e áreas atendidas ----------
  REG.screen({
    page: 'treinador', key: 'perfilEditar', id: 'ACC06', title: 'Editar perfil', nav: 'conta', back: 'TMENU', form: true,
    normal: 'Edição',
    scens: [['fotoFalha', 'Foto não enviada'], ['salvo', 'Salvo'], ['fotoSemAut', 'Foto sem autorização'], ['semFoto', 'Sem foto'], ['imgInvalida', 'Imagem inválida'], ['falhaEnvio', 'Falha de envio'], ['conflito', 'Conflito'], ['dispDesconhecida', 'Disponibilidade desconhecida']],
    vals: function (ctx) {
      var p = DB.t8_perfil, ui = ctx.ui, scn = ctx.scn;
      var d = ui.d ? ui.d : draftOf(p);
      if (!ui.d && scn === 'semFoto') d.photo = '';
      var setD = function (o) { ctx.setUi({ d: Object.assign({}, d, o) }); };
      var err = validate(d);
      var tried = !!ui.tried;
      var errs = Object.keys(err);
      var showErr = function (k) { return tried && !!err[k]; };
      var changes = changedFields(p, d);
      var av = availSummary();

      var chips = function (opts, list, key) {
        return opts.map(function (o) {
          var val = Array.isArray(o) ? o[0] : o, label = Array.isArray(o) ? o[1] : o, on = has(list, val);
          return { label: label, on: String(on), cls: 'chip t8-chip' + (on ? ' is-on' : ''), pick: function () { var x = {}; x[key] = toggle(list, val); setD(x); } };
        });
      };

      function doSave() {
        if (errs.length) { ctx.setUi({ tried: true }); ctx.toast('Revise ' + U.plural(errs.length, 'campo marcado', 'campos marcados') + ' antes de salvar.'); return; }
        if (!changes.length) { ctx.toast('Nada mudou desde o último salvamento (' + p.savedAt + ').'); return; }
        ctx.ask({
          title: 'Salvar alterações?',
          text: 'Salvar guarda as mudanças no seu perfil, mas não publica. Elas aparecem para alunos depois que você publicar na prévia.',
          lines: ['Mudou: ' + changes.join(', '), 'Endereço exato nunca aparece: só ' + (has(d.fmts, 'Presencial') ? 'as regiões ' + d.regions.join(', ') + ' de Londrina' : 'atendimento online'), 'Foto: ' + (d.photo ? (d.photo === 'local' ? 'nova, autorizada por você' : 'a atual continua') : 'sem foto (mostra as iniciais)')],
          ok: 'Salvar alterações',
          onOk: function () {
            var P = DB.t8_perfil, now = U.todayShort + ' ' + U.now();
            Object.assign(P, clone(d));
            P.savedAt = now;
            changes.forEach(function (c) { if (!has(P.pending, c)) P.pending.push(c); });
            if (P.pub === 'publicado' || P.pub === 'falhou') P.pub = P.pubAt ? 'publicado' : 'rascunho';
            ctx.setUi({ d: null, tried: false, saved: now });
            ctx.toast('Alterações salvas às ' + U.now() + '. Ainda não publicadas.');
          }
        });
      }

      var photo = {
        src: photoSrc(d), has: !!d.photo, none: !d.photo, ini: U.ini(p.name),
        from: d.photo === 'local' ? 'Foto nova, carregada só neste navegador · ainda não salva' : (d.photo === 'ds' ? p.photoFrom : 'Sem foto: o perfil mostra as iniciais RL. Foto é opcional.'),
        isLocal: d.photo === 'local', authOn: String(!!d.photoAuth), authCls: 'check' + (d.photoAuth ? ' is-on' : ''),
        toggleAuth: function () { setD({ photoAuth: !d.photoAuth }); },
        pick: function (e) {
          var fl = e && e.target && e.target.files && e.target.files[0];
          if (!fl) return;
          if (!/^image\/(jpeg|png|webp)$/.test(fl.type || '')) { ctx.setUi({ photoErr: 'Imagem inválida: use JPG, PNG ou WebP.' }); return; }
          if (fl.size > 8e6) { ctx.setUi({ photoErr: 'Imagem inválida: a foto passa de 8 MB. Escolha uma menor.' }); return; }
          if (typeof FileReader === 'undefined') return;
          var rd = new FileReader();
          rd.onload = function () { ctx.setUi({ d: Object.assign({}, d, { photo: 'local', photoUrl: String(rd.result), photoAuth: false }), photoErr: '' }); };
          rd.readAsDataURL(fl);
        },
        remove: function () {
          ctx.ask({ title: 'Remover a foto?', text: 'O perfil passa a mostrar as iniciais RL depois que você salvar e publicar. Você pode enviar outra quando quiser.', ok: 'Remover foto', danger: true, onOk: function () { setD({ photo: '', photoUrl: '', photoAuth: false }); } });
        },
        err: showErr('photo') ? err.photo : (ui.photoErr || ''), hasErr: showErr('photo') || !!ui.photoErr
      };
      if (scn === 'imgInvalida' && !ui.photoErr) { photo.err = 'Imagem inválida: o arquivo não é JPG, PNG ou WebP ou passa de 8 MB. Escolha outra foto.'; photo.hasErr = true; }

      // alerta da situação
      var A = null;
      var retryScn = function (msg) { return function () { ctx.scenario(''); ctx.toast(msg); }; };
      if (scn === 'fotoFalha') A = { cls: 'alert alert--warn', ic: 'alert', t: 'Foto não enviada', x: 'A foto nova não chegou. Mantivemos a anterior no perfil. Verifique a conexão e tente de novo.', btn: 'Tentar de novo', act: retryScn('Foto enviada de novo. Salve para guardar a troca.') };
      if (scn === 'salvo') A = { cls: 'alert alert--ok', ic: 'check', t: 'Salvo às 10:42', x: 'Salvar não publica mudanças grandes. Apresentação e área de atendimento aparecem para alunos depois que você publicar na prévia.', btn: 'Ver prévia', act: function () { ctx.go('ACC07'); } };
      if (scn === 'fotoSemAut') A = { cls: 'alert alert--risk', ic: 'shield', t: 'Foto sem autorização', x: 'A última foto enviada veio de um banco de imagens sem licença de uso no perfil. Ela não aparece para alunos. Envie uma foto sua.', btn: 'Continuar', act: function () { ctx.scenario(''); ctx.setUi({ d: Object.assign({}, d, { photo: '', photoUrl: '', photoAuth: false }) }); } };
      if (scn === 'semFoto') A = { cls: 'alert alert--info', ic: 'camera', t: 'Sem foto', x: 'Foto é opcional. Sem ela, o perfil mostra suas iniciais. Use só foto sua, com uso autorizado.', btn: '', act: null };
      if (scn === 'imgInvalida') A = { cls: 'alert alert--warn', ic: 'alert', t: 'Imagem inválida', x: 'Use JPG, PNG ou WebP de até 8 MB. A foto anterior continua.', btn: 'Corrigir', act: function () { ctx.scenario(''); } };
      if (scn === 'falhaEnvio') A = { cls: 'alert alert--risk', ic: 'alert', t: 'Falha de envio', x: 'As alterações não foram salvas. Seus textos continuam aqui; nada foi perdido. Tente salvar de novo.', btn: 'Corrigir', act: function () { ctx.scenario(''); doSave(); } };
      if (scn === 'conflito') A = { cls: 'alert alert--warn', ic: 'swap', t: 'Conflito', x: 'O perfil foi alterado em outro aparelho às 10:50 (apresentação). Escolha qual versão manter antes de salvar.', btn: 'Revisar', act: function () { ctx.setUi({ cmp: true }); } };
      if (scn === 'dispDesconhecida') A = { cls: 'alert alert--warn', ic: 'clock', t: 'Disponibilidade desconhecida', x: 'Não conseguimos ler sua agenda agora. Até confirmar, o perfil mostra “horários a combinar”.', btn: 'Consultar de novo', act: retryScn('Agenda consultada: disponibilidade de ' + av.saved + ' confirmada.') };

      var other = 'Sou o Rafael. Atendo iniciantes e intermediários em CrossFit e musculação, presencial em Londrina ou online. Primeiro avalio movimento e rotina; o treino chega toda semana no app.';
      var cmp = scn === 'conflito' && !!ui.cmp;

      return {
        alert: A || { cls: '', ic: '', t: '', x: '', btn: '', act: function () {} }, hasAlert: !!A, alertIc: 'ic ic--sm i-' + (A ? A.ic : 'info'), alertHasBtn: !!(A && A.btn),
        cmp: cmp, cmpMine: d.pitch, cmpOther: other,
        keepMine: function () { ctx.scenario(''); ctx.toast('Mantida a versão deste aparelho. Salve para confirmar.'); },
        useOther: function () { ctx.scenario(''); ctx.setUi({ d: Object.assign({}, d, { pitch: other }) }); },
        photo: photo,
        pitch: d.pitch, pitchN: String((d.pitch || '').length) + ' de ' + MAX_PITCH, setPitch: function (e) { setD({ pitch: String(U.val(e)).slice(0, MAX_PITCH) }); },
        pitchErr: showErr('pitch') ? err.pitch : '', hasPitchErr: showErr('pitch'), pitchCls: 'input input--area t8-area' + (showErr('pitch') ? ' is-err' : ''),
        mods: chips(MODS, d.mods, 'mods'), modsErr: err.mods || '', hasModsErr: showErr('mods'),
        langs: chips(LANGS, d.langs, 'langs'), langsErr: err.langs || '', hasLangsErr: showErr('langs'),
        fmts: chips(FMTS, d.fmts, 'fmts'), fmtsErr: err.fmts || '', hasFmtsErr: showErr('fmts'),
        pres: has(d.fmts, 'Presencial'), online: has(d.fmts, 'Online'),
        city: p.city, changeCity: function () { ctx.go('PUB16'); },
        regions: chips(REGIONS, d.regions, 'regions'), regionsErr: err.regions || '', hasRegionsErr: showErr('regions'),
        place: d.place, setPlace: function (e) { setD({ place: String(U.val(e)).slice(0, 80) }); },
        placeErr: err.place || '', hasPlaceErr: showErr('place') || (!!err.place && !!(d.place || '').length), placeCls: 'input' + (err.place ? ' is-err' : ''),
        publicLine: has(d.fmts, 'Presencial') ? ('Local público: ' + (d.regions.length ? d.regions.join(', ') : 'nenhuma região') + ', Londrina. Endereço exato nunca aparece.') : 'Só online: nenhuma região de Londrina aparece no perfil.',
        avail: scn === 'dispDesconhecida' ? 'Horários a combinar (agenda não consultada)' : ('Atende ' + av.days + ' · ' + av.tz), availSrc: scn === 'dispDesconhecida' ? 'Consulta à agenda falhou agora · tente de novo' : ('Da sua agenda, salva em ' + av.saved + '. O perfil não mostra horários exatos.'),
        editAvail: function () { ctx.go('TRE19'); },
        errCount: tried && errs.length ? U.plural(errs.length, 'campo precisa', 'campos precisam') + ' de ajuste antes de salvar.' : '', hasErrCount: tried && errs.length > 0,
        changes: changes.length ? 'Mudanças não salvas: ' + changes.join(', ') : 'Sem mudanças desde ' + p.savedAt, dirty: changes.length > 0,
        savedNote: ui.saved ? ('Salvo às ' + ui.saved.split(' ')[1] + '. Salvar não publica: revise a prévia para publicar.') : '', hasSaved: !!ui.saved,
        save: doSave, saveLabel: scn === 'falhaEnvio' ? 'Tentar salvar de novo' : 'Salvar alterações',
        preview: function () {
          if (changes.length) { ctx.ask({ title: 'Há mudanças não salvas', text: 'A prévia mostra o que está salvo. Salve antes para ver suas mudanças nela.', ok: 'Ver prévia sem salvar', cancel: 'Continuar editando', onOk: function () { ctx.go('ACC07'); } }); return; }
          ctx.go('ACC07');
        },
        more: [
          { title: 'Credenciais', sub: 'CREF, formação e certificados', ic: 'ic ic--sm i-shield', go: function () { ctx.go('ACC10'); } },
          { title: 'Instagram', sub: 'Confirmar que o perfil é seu', ic: 'ic ic--sm i-instagram', go: function () { ctx.go('ACC08'); } },
          { title: 'Organização', sub: 'Afiliação a academia ou consultoria', ic: 'ic ic--sm i-grid', go: function () { ctx.go('ORG02'); } },
          { title: 'Denúncias e bloqueios', sub: 'Acompanhar e bloquear contatos', ic: 'ic ic--sm i-alert', go: function () { ctx.go('ACC16'); } }
        ]
      };
    }
  });

  // ---------- ACC07 · Prévia e publicação do perfil ----------
  function credsPublic() {
    var cs = DB.t8_creds || [];
    var cref = cs.find(function (c) { return c.kind === 'CREF'; });
    if (!cref) return { label: 'CREF não informado', cls: 'trust trust--decl', ic: 'ic ic--xs i-file', ok: false };
    if (cref.state === 'verificado') return { label: 'CREF verificado · ' + cref.date, cls: 'trust trust--ver', ic: 'ic ic--xs i-shield', ok: true };
    return { label: 'CREF informado', cls: 'trust trust--decl', ic: 'ic ic--xs i-file', ok: true };
  }

  REG.screen({
    page: 'treinador', key: 'perfilPrevia', id: 'ACC07', title: 'Prévia do perfil', mtitle: 'Prévia', nav: 'conta', back: 'TMENU', wide: true,
    normal: 'Mudanças salvas',
    scens: [['emRevisao', 'Em revisão'], ['publicado', 'Publicado'], ['falhou', 'Falhou'], ['indexacao', 'Indexação pendente'], ['exibicao', 'Exibição desconhecida'], ['desconhecido', 'Falha ou resultado desconhecido'], ['incompleto', 'Falta informação']],
    vals: function (ctx) {
      var P = DB.t8_perfil, scn = ctx.scn;
      var p = clone(P);
      if (scn === 'incompleto') { p.pitch = 'Treinador em Londrina.'; p.mods = []; }
      if (scn === 'publicado' || scn === 'indexacao' || scn === 'exibicao') { p.pending = []; p.pub = 'publicado'; p.pubAt = '26/10/2026 10:45'; p.index = scn === 'publicado' ? 'pendente' : (scn === 'indexacao' ? 'pendente' : 'desconhecida'); }
      if (scn === 'emRevisao') p.pub = 'revisao';
      if (scn === 'falhou') p.pub = 'falhou';
      if (scn === 'desconhecido') p.pub = 'desconhecido';
      var cred = credsPublic();
      var av = availSummary();

      // o que falta (requisitos por capacidade, sem percentual)
      var req = [
        { t: 'Nome e apresentação', ok: (p.pitch || '').trim().length >= MIN_PITCH, x: (p.pitch || '').trim().length >= MIN_PITCH ? 'Apresentação com ' + p.pitch.length + ' caracteres' : 'Apresentação curta: escreva pelo menos ' + MIN_PITCH + ' caracteres', fix: 'ACC06', need: true },
        { t: 'Modalidades', ok: p.mods.length > 0, x: p.mods.length ? p.mods.join(', ') : 'Nenhuma modalidade marcada', fix: 'ACC06', need: true },
        { t: 'Onde atende', ok: p.fmts.length > 0 && (!has(p.fmts, 'Presencial') || p.regions.length > 0), x: p.fmts.length ? p.fmts.join(' e ') + (has(p.fmts, 'Presencial') ? ' · ' + p.regions.join(', ') : '') : 'Sem formato', fix: 'ACC06', need: true },
        { t: 'Foto', ok: !!p.photo, x: p.photo ? 'Autorizada para o perfil' : 'Opcional · sem foto o perfil mostra as iniciais', fix: 'ACC06', need: false },
        { t: 'Credencial', ok: cred.ok, x: cred.ok ? 'Aparece como: ' + cred.label : 'Opcional para o perfil · necessária para o selo', fix: 'ACC10', need: false }
      ];
      var missing = req.filter(function (r) { return r.need && !r.ok; });
      var canPub = missing.length === 0 && p.pub !== 'revisao';
      var checklist = req.map(function (r) {
        return { t: r.t, x: r.x, cls: 'onb-check__i' + (r.ok ? '' : ' is-wait'), chk: 'check' + (r.ok ? ' is-on' : ''), tag: r.ok ? 'ok' : (r.need ? 'falta' : 'opcional'), tagCls: 'badge ' + (r.ok ? 'badge--ok' : (r.need ? 'badge--risk' : 'badge--plain')), hasFix: !r.ok, fix: function () { ctx.go(r.fix); }, fixLabel: r.fix === 'ACC10' ? 'Revisar credencial' : 'Corrigir' };
      });

      function publish() {
        if (scn === 'desconhecido') { ctx.scenario(''); ctx.toast('Consultado às ' + U.now() + ' antes de repetir: a publicação não foi feita. Toque em Publicar perfil de novo.'); return; }
        if (!canPub) { ctx.toast(missing.length ? 'Falta ' + missing.map(function (m) { return m.t.toLowerCase(); }).join(', ') + ' para publicar.' : 'Aguarde a revisão terminar para publicar.'); return; }
        ctx.ask({
          title: 'Publicar perfil?', text: 'A versão salva em ' + P.savedAt + ' passa a ser a pública. Publicar não garante posição na busca.',
          lines: [P.pending.length ? 'Muda no perfil: ' + P.pending.join(', ') : 'Sem mudanças pendentes: republica a versão atual', 'Endereço exato nunca aparece: só regiões e “local público”', 'Preço só aparece nas ofertas ativas (Ofertas e cupons)'],
          ok: 'Publicar perfil',
          onOk: function () {
            var X = DB.t8_perfil;
            X.pub = 'publicado'; X.pubAt = '26/10/2026 ' + U.now(); X.pending = []; X.index = 'pendente'; X.version += 1;
            ctx.scenario('');
            ctx.toast('Perfil publicado às ' + U.now() + '. Ainda estamos confirmando a exibição na busca.');
          }
        });
      }
      var recheck = function () {
        var X = DB.t8_perfil;
        if (scn) { ctx.scenario(''); }
        if (X.index === 'pendente' || scn === 'indexacao' || scn === 'exibicao' || scn === 'publicado') { X.index = 'exibido'; ctx.toast('Consultado às ' + U.now() + ': perfil exibido na busca.'); return; }
        ctx.toast('Consultado às ' + U.now() + ': nada mudou.');
      };

      // estado e alerta
      var A = null;
      if (p.pub === 'revisao') A = { cls: 'alert alert--info', ic: 'clock', t: 'Em revisão', x: 'A nova foto está em revisão desde 26/10 10:42 (direito de uso). O resto pode ser publicado depois que a revisão terminar; o perfil atual continua no ar.', btn: '', act: null };
      else if (p.pub === 'falhou') A = { cls: 'alert alert--risk', ic: 'alert', t: 'Falhou', x: 'A publicação não terminou. O perfil continua como estava em ' + p.pubAt + ' e suas mudanças seguem salvas como rascunho.', btn: 'Tentar de novo', act: function () { ctx.scenario(''); publish(); } };
      else if (p.pub === 'desconhecido') A = { cls: 'alert alert--warn', ic: 'refresh', t: 'Falha ou resultado desconhecido', x: 'A conexão caiu durante a publicação. Antes de repetir, consultamos se ela foi feita, para não publicar duas vezes.', btn: 'Consultar antes de repetir', act: function () { ctx.scenario(''); ctx.toast('Consultado às ' + U.now() + ': a publicação não foi feita. Você pode publicar agora.'); } };
      else if (p.pub === 'publicado' && !p.pending.length && p.index === 'pendente') A = { cls: 'alert alert--ok', ic: 'check', t: 'Perfil publicado', x: 'Publicado em ' + p.pubAt + '. Ainda estamos confirmando a exibição: o perfil costuma aparecer na busca em até 1 h.', btn: 'Consultar de novo', act: recheck };
      else if (p.pub === 'publicado' && !p.pending.length && p.index === 'desconhecida') A = { cls: 'alert alert--warn', ic: 'eye', t: 'Exibição desconhecida', x: 'O perfil foi publicado em ' + p.pubAt + ', mas não conseguimos confirmar se já aparece na busca.', btn: 'Consultar de novo', act: recheck };
      if (scn === 'indexacao') A = { cls: 'alert alert--info', ic: 'clock', t: 'Indexação pendente', x: 'Publicado em ' + p.pubAt + '. A busca ainda não atualizou; o link direto já funciona.', btn: 'Consultar de novo', act: recheck };

      var pubLabel = p.pub === 'revisao' ? 'em revisão' : (p.pubAt ? 'versão de ' + p.pubAt : 'não');
      var searchLabel = !p.pubAt ? '—' : (p.index === 'exibido' ? (p.pending.length ? 'sim, versão anterior' : 'sim') : (p.index === 'pendente' ? 'confirmando' : 'desconhecido'));
      var head = p.pub === 'revisao' ? 'Em revisão' : (p.pending.length ? 'Mudanças salvas, ainda não publicadas' : (p.index === 'exibido' ? 'Publicado e exibido na busca' : 'Publicado · confirmando exibição'));

      return {
        head: head, alert: A || { cls: '', t: '', x: '', btn: '', act: function () {} }, hasAlert: !!A, alertIc: 'ic ic--sm i-' + (A ? A.ic : 'info'), alertHasBtn: !!(A && A.btn),
        name: p.name, role: p.role + ' · ' + p.city, photo: photoSrc(p), hasPhoto: !!p.photo, noPhoto: !p.photo, ini: U.ini(p.name),
        cred: cred, pitch: p.pitch, hasPitch: !!(p.pitch || '').trim(),
        tags: p.mods.concat(p.fmts.map(function (f) { return f === 'Presencial' ? 'Presencial · ' + (p.regions.join(', ') || 'Londrina') : f; })).map(function (t) { return { t: t }; }),
        where: has(p.fmts, 'Presencial') ? 'Londrina, PR — ' + (p.regions.join(' e ') || 'região a definir') + ' (regiões informadas). Local público: ' + p.place + '.' : 'Somente online, com treino no app da 99Coach.',
        langs: 'Atende em ' + p.langs.join(', ').toLowerCase(), avail: scn === 'exibicao' ? 'Horários a combinar' : 'Dias de atendimento: ' + av.days,
        noPrice: 'Preços aparecem só nas ofertas ativas. Esta prévia não mostra preço.',
        saved: P.savedAt, pubLabel: pubLabel, searchLabel: searchLabel,
        pending: p.pending.length ? p.pending.join(', ') : 'nenhuma', hasPending: p.pending.length > 0,
        checklist: checklist, missingTitle: missing.length ? 'O que falta para publicar' : 'Nada falta para publicar',
        missingSub: missing.length ? U.plural(missing.length, 'item obrigatório pendente', 'itens obrigatórios pendentes') + '. Foto e credencial são opcionais.' : 'Foto e credencial são opcionais; aparecem só no nível comprovado.',
        canPub: canPub, pubCls: 'btn btn--brand btn--lg t8-pubbtn' + (canPub ? '' : ' t8-off'), pubDis: String(!canPub),
        publish: publish,
        showPublic: !!p.pubAt && p.pub !== 'revisao', viewPublic: function () { ctx.go('@perfil', { id: 'rafael' }); },
        edit: function () { ctx.go('ACC06'); }, creds: function () { ctx.go('ACC10'); }, home: function () { ctx.go('H03'); }
      };
    }
  });
})();
