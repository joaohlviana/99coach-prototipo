/* ORG01 · Página pública de academia/consultoria/unidade (extensão posterior, opcional): identidade e local públicos,
   unidades com endereço, treinadores com afiliação confirmada (→ perfil), serviços. Consulta sem cadastro. */
(function () {
  'use strict';
  DB.seed('p2_orgs', [
    { id: 'studio-forca', name: 'Studio Força Centro', kind: 'Academia', city: 'Londrina, PR', photo: '067c6174329cd952a4a823a439267213', informed: '15/10/2026',
      about: 'Academia de musculação e CrossFit com duas unidades em Londrina.',
      units: [{ id: 'centro', name: 'Unidade Centro', addr: 'R. Barão, 120 · Centro', hours: 'Seg a sex 6h–22h · sáb 8h–12h' }, { id: 'gleba', name: 'Unidade Gleba Palhano', addr: 'Av. Ayrton Senna, 600 · Gleba Palhano', hours: 'Seg a sex 6h–21h' }],
      // afiliações: só as confirmadas aparecem; pendente fica fora da página
      staff: [{ ref: 'thiago', unit: 'centro', status: 'confirmada', since: '10/10/2026', role: 'CrossFit · Consultoria' }, { ref: 'carolina', unit: 'gleba', status: 'pendente', since: '', role: 'CrossFit e Funcional' }],
      services: [['Treino presencial na unidade', 'Combinado com cada treinador', 'dumbbell'], ['Consultoria individual', 'Contratada no perfil do treinador', 'user']]
    }
  ]);

  REG.screen({
    page: 'publico', key: 'org', id: 'ORG01', title: 'Organização', mtitle: 'Academia', nav: 'explorar', back: 'history', wide: true,
    normal: 'Página publicada',
    scens: [['pendente', 'Afiliação pendente'], ['unidades', 'Unidades'], ['semtreinadores', 'Sem treinadores'], ['revisao', 'Informação em revisão'], ['indisp', 'Consulta indisponível'], ['naohab', 'Capacidade ainda não habilitada']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn, g = function (k, d) { return P2.g(ui, k, d); };
      var P = window.P1;
      var o = DB.find('p2_orgs', ctx.id) || DB.p2_orgs[0];
      var unit = g('unit', 'centro');
      var tab = g('tab', scn === 'unidades' ? 'unidades' : 'treinadores');
      var indisp = scn === 'indisp';

      var staff = scn === 'semtreinadores' ? [] : o.staff.filter(function (s) { return s.status === 'confirmada'; });
      var pending = o.staff.filter(function (s) { return s.status === 'pendente'; });
      var inUnit = staff.filter(function (s) { return unit === 'todas' || s.unit === unit; });
      var trainers = inUnit.map(function (s) {
        var t = P ? P.tr(s.ref) : { name: s.ref, ini: U.ini(s.ref) };
        var a = P ? P.av(t) : { photo: '', hasPhoto: false, noPhoto: true, ini: U.ini(t.name) };
        var u = o.units.filter(function (x) { return x.id === s.unit; })[0];
        return { name: t.name, role: s.role, unit: u ? u.name : '', badge: 'Afiliação confirmada', since: 'desde ' + s.since,
          photo: a.photo, hasPhoto: a.hasPhoto, noPhoto: a.noPhoto, ini: a.ini,
          go: function () { if (P) P.openTrainer(s.ref); else ctx.go('@perfil', { id: s.ref }); }, label: 'Ver treinador ' + t.name };
      });
      var units = o.units.map(function (u) {
        var on = u.id === unit, n = staff.filter(function (s) { return s.unit === u.id; }).length;
        return { name: u.name, addr: u.addr, hours: u.hours, count: U.plural(n, 'treinador', 'treinadores'), cls: 'p2-unit' + (on ? ' is-on' : ''), on: String(on), inReview: scn === 'revisao' && u.id === 'gleba',
          pick: function () { ctx.setUi({ unit: u.id, tab: 'treinadores' }); } };
      });
      var unitSeg = [{ id: 'todas', name: 'Todas' }].concat(o.units).map(function (u) {
        var on = u.id === unit;
        return { label: u.id === 'todas' ? 'Todas' : u.name.replace('Unidade ', ''), cls: 'chip p2-chip' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ unit: u.id }); } };
      });
      var tabs = [['treinadores', 'Treinadores'], ['unidades', 'Unidades'], ['sobre', 'Sobre']].map(function (t) {
        var on = t[0] === tab; return { label: t[1], cls: 'utab' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ tab: t[0] }); } };
      });

      var alerts = [];
      if (scn === 'pendente') alerts.push(P2.alert('', 'clock', 'Afiliação pendente', 'Uma treinadora pediu vínculo com a unidade Gleba Palhano. Ela só aparece aqui depois que a academia e ela confirmarem.', 'Saiba por quê', function () { ctx.setUi({ why: !g('why', false) }); }));
      if (scn === 'revisao') alerts.push(P2.alert('warn', 'info', 'Informação em revisão', 'O endereço da Unidade Gleba Palhano está em revisão desde 24/10. Confirme com a academia antes de ir.', 'Consultar de novo', function () { ctx.toast('Ainda em revisão às ' + U.now() + '. Mostramos o último endereço informado.'); }));
      if (indisp) alerts.push(P2.alert('risk', 'alert', 'Consulta indisponível', 'Não conseguimos carregar a página da organização agora. Os perfis dos treinadores continuam disponíveis.', 'Tentar de novo', function () { ctx.scenario(''); }));
      if (scn === 'naohab') alerts.push(P2.alert('info', 'lock', 'Capacidade ainda não habilitada', 'Páginas de organização são uma extensão posterior. Esta é uma prévia; no lançamento a página não aparece na busca.', 'Saiba por quê', function () { ctx.setUi({ why: !g('why', false) }); }));
      var whyText = scn === 'pendente' ? 'Proximidade ou pedido de uma das partes não prova afiliação. O vínculo não dá à academia acesso a alunos, dados de saúde ou pagamentos do treinador.' : 'O núcleo treinador–aluno vem primeiro. Esta página entra depois, sem catraca, ERP, importação de clientes ou venda institucional.';

      return {
        alerts: alerts, why: (scn === 'pendente' || scn === 'naohab') && !!g('why', false), whyText: whyText,
        show: !indisp, hide: indisp, o: { name: o.name, line: o.kind + ' · ' + o.city.split(',')[0] + ' · ' + U.plural(o.units.length, 'unidade', 'unidades'), about: o.about, kind: o.kind, city: o.city, informed: o.informed, units: String(o.units.length) },
        cover: U.img(o.photo), hasCover: !!U.img(o.photo),
        tabs: tabs, panelCls: 'p2-org p2-org--' + tab,
        unitSeg: unitSeg, trainers: trainers, hasTrainers: trainers.length > 0,
        noTrainersUnit: trainers.length === 0 && staff.length > 0, noTrainers: staff.length === 0,
        pendingNote: scn === 'pendente' && pending.length > 0,
        units: units, services: o.services.map(function (s) { return { title: s[0], sub: s[1], ic: 'ic ic--sm i-' + s[2] }; }),
        seeAll: function () { ctx.setUi({ unit: 'todas' }); },
        owner: function () { ctx.go('ORG02'); }, fix: function () { ctx.go('PUB12', { id: 'studio-forca' }); }, find: function () { ctx.go('@esporte', {}); }
      };
    }
  });
})();
