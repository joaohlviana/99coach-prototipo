/* PUB16 · Escolher local e "Perto de mim": cidade com UF, homônimos, localização opcional (nunca obrigatória, só ao tocar),
   precisão aproximada e "Usar este local" → busca (@esporte) com a cidade; nada de coordenadas na URL. */
(function () {
  'use strict';
  DB.seed('p2_cidades', [
    { id: 'londrina-pr', name: 'Londrina', uf: 'PR', country: 'Brasil' },
    { id: 'londrina-co', name: 'Londrina', uf: '', country: 'Colômbia' },
    { id: 'cambe-pr', name: 'Cambé', uf: 'PR', country: 'Brasil' },
    { id: 'ibipora-pr', name: 'Ibiporã', uf: 'PR', country: 'Brasil' },
    { id: 'rolandia-pr', name: 'Rolândia', uf: 'PR', country: 'Brasil' },
    { id: 'maringa-pr', name: 'Maringá', uf: 'PR', country: 'Brasil' },
    { id: 'curitiba-pr', name: 'Curitiba', uf: 'PR', country: 'Brasil' },
    { id: 'campinas-sp', name: 'Campinas', uf: 'SP', country: 'Brasil' },
    { id: 'saopaulo-sp', name: 'São Paulo', uf: 'SP', country: 'Brasil' },
    { id: 'bomjesus-rs', name: 'Bom Jesus', uf: 'RS', country: 'Brasil' },
    { id: 'bomjesus-pi', name: 'Bom Jesus', uf: 'PI', country: 'Brasil' },
    { id: 'bomjesus-sc', name: 'Bom Jesus', uf: 'SC', country: 'Brasil' },
    { id: 'saojose-sc', name: 'São José', uf: 'SC', country: 'Brasil' },
    { id: 'riodejaneiro-rj', name: 'Rio de Janeiro', uf: 'RJ', country: 'Brasil' },
    { id: 'belohorizonte-mg', name: 'Belo Horizonte', uf: 'MG', country: 'Brasil' },
    { id: 'portoalegre-rs', name: 'Porto Alegre', uf: 'RS', country: 'Brasil' },
    { id: 'florianopolis-sc', name: 'Florianópolis', uf: 'SC', country: 'Brasil' }
  ]);
  if (!DB.p1_busca) DB.seed('p1_busca', { active: true, sport: 'CrossFit', city: 'Londrina, PR', mode: 'Presencial', lang: 'Português', at: '24/10', where: 'neste aparelho' });

  function labelOf(c) { return c.uf ? c.name + ', ' + c.uf : c.name + ', ' + c.country; }

  REG.screen({
    page: 'publico', key: 'local', id: 'PUB16', title: 'Onde você treina?', nav: 'explorar', back: 'history', form: true,
    normal: 'Digitar cidade',
    scens: [['negada', 'Permissão negada'], ['falhou', 'Serviço de localização falhou'], ['distancia', 'Distância desconhecida'], ['carregando', 'Sugestões carregando'], ['homonimos', 'Homônimos'], ['semres', 'Sem resultado'], ['revogada', 'Permissão negada/revogada/expirada'], ['fornecedor', 'Fornecedor indisponível']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn, g = function (k, d) { return P2.g(ui, k, d); };
      var b = DB.p1_busca || { city: '', at: '' };
      var q = g('q', scn === 'homonimos' ? 'bom jesus' : (scn === 'semres' ? 'Londrinópolis' : 'londr'));
      var sel = g('sel', '');
      var geo = g('geo', '');
      var err = g('err', '');
      var loading = scn === 'carregando';
      var permBlocked = scn === 'negada' || scn === 'revogada';
      var geoFails = scn === 'falhou' || scn === 'fornecedor';

      var count = {}; DB.p2_cidades.forEach(function (c) { count[U.norm(c.name)] = (count[U.norm(c.name)] || 0) + 1; });
      var nq = U.norm(q);
      var found = nq.length < 2 ? [] : DB.p2_cidades.filter(function (c) { var n = U.norm(c.name); return n.indexOf(nq) === 0 || n.indexOf(' ' + nq) >= 0; }).slice(0, 6);
      var sugg = found.map(function (c) {
        var homo = count[U.norm(c.name)] > 1, on = c.id === sel;
        var title = c.uf ? c.name + ', ' + c.uf : c.name;
        var sub = c.uf ? c.country + (homo ? ' · há outras cidades com este nome' : '') : c.country + (homo ? ' (homônimo)' : '');
        return { title: title, sub: sub, cls: 'p2-city' + (on ? ' is-on' : ''), on: String(on), aria: title + ', ' + sub, isOn: on,
          pick: function () { ctx.setUi({ sel: c.id, err: '', geo: '' }); } };
      });
      var selC = DB.find('p2_cidades', sel);

      var useGeo = function () {
        if (permBlocked) { ctx.toast('A localização está bloqueada no navegador. Escolha a cidade na lista.'); return; }
        if (geoFails) { ctx.toast('Não conseguimos sua localização agora. Mantivemos ' + (b.city || 'a cidade anterior') + '.'); return; }
        ctx.ask({
          title: 'Usar sua localização aproximada?', ok: 'Permitir', cancel: 'Agora não',
          lines: ['Usamos só a região aproximada, nunca o endereço.', 'A posição não aparece em links nem no seu perfil.', 'Você pode escolher a cidade manualmente a qualquer momento.'],
          onOk: function () { ctx.setUi({ sel: 'londrina-pr', geo: 'ok', err: '' }); ctx.toast('Localização aproximada: região central de Londrina, PR.'); }
        });
      };
      var use = function () {
        if (!selC) { ctx.setUi({ err: 'Escolha uma cidade da lista para continuar.' }); return; }
        var city = labelOf(selC);
        if (DB.p1_busca) Object.assign(DB.p1_busca, { city: city, at: U.todayShort, active: true });
        if (ctx.p.from) ctx.go(ctx.p.from, {});
        else ctx.go('@esporte', { city: city });
      };

      var alerts = [];
      if (scn === 'negada') alerts.push(P2.alert('warn', 'lock', 'Permissão negada', 'Tudo bem: escolha a cidade manualmente. Nada fica bloqueado sem a localização.', 'Continuar', function () { ctx.scenario(''); try { var el = document.getElementById('p2-lc-q'); if (el) el.focus(); } catch (_) {} }));
      if (scn === 'falhou') alerts.push(P2.alert('risk', 'alert', 'Serviço de localização falhou', 'Mantivemos a cidade anterior: ' + (b.city || 'nenhuma escolhida') + '.', 'Tentar de novo', function () { ctx.scenario(''); ctx.toast('Serviço de localização respondeu. Toque em “Usar minha localização”.'); }));
      if (scn === 'distancia') alerts.push(P2.alert('info', 'info', 'Distância desconhecida', 'Quando não sabemos a distância, mostramos “distância não informada”, nunca 0 km.', 'Consultar de novo', function () { ctx.toast('Distâncias consultadas às ' + U.now() + '. Algumas continuam não informadas.'); }));
      if (scn === 'homonimos') alerts.push(P2.alert('warn', 'pin', 'Homônimos', 'Há mais de uma cidade com esse nome. Confira o estado antes de usar.', 'Revisar', function () { ctx.setUi({ sel: '' }); try { var el = document.getElementById('p2-lc-list'); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center' }); } catch (_) {} }));
      if (scn === 'revogada') alerts.push(P2.alert('', 'lock', 'Permissão negada, revogada ou expirada', 'O navegador não permite mais usar sua localização. Você pode escolher a cidade manualmente.', 'Saiba por quê', function () { ctx.setUi({ why: !g('why', false) }); }));
      if (scn === 'fornecedor') alerts.push(P2.alert('risk', 'alert', 'Fornecedor indisponível', 'As sugestões completas não carregaram. Mostramos a lista básica de cidades.', 'Tentar de novo', function () { ctx.scenario(''); }));

      return {
        alerts: alerts, why: scn === 'revogada' && !!g('why', false),
        current: b.city ? b.city + ' · escolhido por você em ' + b.at : 'Nenhum local escolhido', hasCurrent: !!b.city,
        q: q, setQ: function (e) { ctx.setUi({ q: U.val(e), sel: '', err: '', geo: '' }); },
        loading: loading, skel: [1, 2, 3].map(function (n) { return { n: String(n) }; }),
        sugg: sugg, hasSugg: !loading && sugg.length > 0,
        noSugg: !loading && nq.length >= 2 && sugg.length === 0, qLabel: q,
        typeMore: !loading && nq.length < 2,
        geoSub: permBlocked ? 'Bloqueada no navegador · escolha manual' : (geo === 'ok' ? 'Região central de Londrina · aproximado' : 'Pede permissão só ao tocar'),
        geoCls: 'p2-city' + (geo === 'ok' ? ' is-on' : ''), geoOn: String(geo === 'ok'),
        useGeo: useGeo,
        hasSel: !!selC, selLabel: selC ? labelOf(selC) + (selC.uf ? ' · Brasil' : '') : '', selGeo: geo === 'ok',
        err: err, hasErr: !!err,
        use: use,
        clear: function () {
          if (DB.p1_busca) Object.assign(DB.p1_busca, { city: '', at: U.todayShort });
          ctx.setUi({ q: '', sel: '', geo: '', err: '' }); ctx.toast('Local limpo. Escolha uma cidade ou busque online.');
        },
        online: function () { if (DB.p1_busca) Object.assign(DB.p1_busca, { mode: 'Online', at: U.todayShort }); ctx.go('@esporte', { fmt: 'Online' }); }
      };
    }
  });
})();
