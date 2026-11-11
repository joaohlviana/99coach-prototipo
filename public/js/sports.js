/* Cadastro único de esportes.
   Cada esporte tem: id (usado no app), slug (do catálogo real), nome, grupo de cor do DS,
   ícone próprio e hero próprio (foto do DS quando existe; senão, arte com o ícone e a cor do esporte).
   Ordem: as 10 modalidades do DS primeiro, depois as demais do catálogo. */
(function () {
  'use strict';
  var I = 'img/sports/';
  // [id, slug, nome, grupo, ícone, foto do hero (chave do DS) ou '']
  var ROWS = [
    ['musculacao', 'musculacao', 'Musculação', 'forca', 'a66078f9660d8d79f5a8a1fe1b5de471', 'ddc2a85a675b6360b30e74c352a6a43a'],
    ['funcional', 'funcional', 'Funcional', 'funcional', '2192d01057d4de029869dacde99393d2', '53bc58b2a2121cf553d701e2bbe3f479'],
    ['crossfit', 'crossfit', 'CrossFit', 'forca', 'c6cd81ed01305a02ed5ef0a7f77bcbc5', '4f287f956509500f4c89225daef9c5c5'],
    ['pilates', 'pilates', 'Pilates', 'mente', 'c918eae13ef6aa26251f45ae6865a413', 'a8e3bd5a89dffa722591b85c65c3dc53'],
    ['yoga', 'yoga', 'Yoga', 'mente', 'c918eae13ef6aa26251f45ae6865a413', 'a8e3bd5a89dffa722591b85c65c3dc53'],
    ['corrida', 'corrida', 'Corrida', 'corrida', 'cdf7571519a4147819bcd43ee8e0f291', 'd7f58212b752ef1353285564cfe093c1'],
    ['lutas', 'lutas', 'Lutas', 'lutas', '24f804dcd864d949482e1959f3be9b7a', 'f1d53560db4fc016d4604ed68cf1b86d'],
    ['natacao', 'natacao', 'Natação', 'agua', 'e6ae683211af46b0c99b87c8fada6155', 'd638b9405ce41661a674fe9a2b40e890'],
    ['ciclismo', 'ciclismo', 'Ciclismo', 'corrida', '9b6e43be870276dae4052e6f35d8c15d', 'd7f58212b752ef1353285564cfe093c1'],
    ['danca', 'danca', 'Dança', 'mente', '86118c35a4cd36a985c797a7e3361928', 'a8e3bd5a89dffa722591b85c65c3dc53'],
    // demais esportes do catálogo: hero próprio feito com o ícone e a cor do esporte
    ['jiujitsu', 'jiu-jitsu', 'Jiu-Jitsu', 'lutas', 'c15e5abaf728b1580d2a723e8cf398b5', ''],
    ['escalada', 'escalada', 'Escalada', 'funcional', '7cb7d48a74408614131846f3206aa4e2', ''],
    ['fisioterapia', 'fisioterapia', 'Fisioterapia', 'mente', I + 'alongamento.svg', ''],
    ['alongamento', 'alongamento', 'Alongamento', 'mente', I + 'alongamento.svg', ''],
    ['nutricao', 'nutricao', 'Nutrição', 'mente', I + 'ginastica.svg', ''],
    ['condicionamento', 'condicionamento', 'Condicionamento', 'funcional', I + 'funcionais.svg', ''],
    ['muay-thai', 'muay-thai', 'Muay Thai', 'lutas', I + 'boxe.svg', ''],
    ['boxe', 'boxe', 'Boxe', 'lutas', I + 'boxe.svg', ''],
    ['tenis', 'tenis', 'Tênis', 'corrida', I + 'tenis.svg', ''],
    ['futebol', 'futebol', 'Futebol', 'corrida', I + 'futebol.svg', ''],
    ['bem-estar', 'bem-estar', 'Bem-estar', 'mente', I + 'yoga.svg', ''],
    ['beach-tennis', 'beach-tennis', 'Beach Tennis', 'corrida', I + 'tenis.svg', ''],
    ['calistenia', 'calistenia', 'Calistenia', 'forca', I + 'ginastica-artistica.svg', ''],
    ['triatlo', 'triatlo', 'Triatlo', 'corrida', I + 'ciclismo.svg', ''],
    ['judo', 'judo', 'Judô', 'lutas', I + 'karate.svg', ''],
    ['ginastica', 'ginastica', 'Ginástica', 'funcional', I + 'ginastica.svg', ''],
    ['basquete', 'basquete', 'Basquete', 'corrida', I + 'basquete.svg', ''],
    ['surf', 'surf', 'Surf', 'agua', I + 'natacao.svg', ''],
    ['hidroginastica', 'hidroginastica', 'Hidroginástica', 'agua', I + 'natacao.svg', ''],
    ['volei', 'volei', 'Vôlei', 'corrida', I + 'volei.svg', ''],
    ['futsal', 'futsal', 'Futsal', 'corrida', I + 'futebol.svg', ''],
    ['lpo', 'lpo', 'LPO', 'forca', I + 'lpo.svg', ''],
    ['patinacao', 'patinacao', 'Patinação', 'corrida', I + 'patinacao.svg', ''],
    ['tenis-de-mesa', 'tenis-de-mesa', 'Tênis de Mesa', 'corrida', I + 'tenis-de-mesa.svg', ''],
    ['hyrox', 'hyrox', 'Hyrox', 'forca', I + 'crossfit.svg', ''],
    ['golfe', 'golfe', 'Golfe', 'corrida', I + 'golfe.svg', ''],
    ['mma', 'mma', 'MMA', 'lutas', I + 'lutas.svg', ''],
    ['ballet', 'ballet', 'Ballet', 'mente', I + 'danca.svg', ''],
    ['krav-maga', 'krav-maga', 'Krav Maga', 'lutas', I + 'lutas.svg', ''],
    ['capoeira', 'capoeira', 'Capoeira', 'lutas', I + 'karate.svg', ''],
    ['volei-de-praia', 'volei-de-praia', 'Vôlei de Praia', 'corrida', I + 'volei.svg', ''],
    ['taekwondo', 'taekwondo', 'Taekwondo', 'lutas', I + 'karate.svg', ''],
    ['parkour', 'parkour', 'Parkour', 'funcional', I + 'ginastica-artistica.svg', ''],
    ['esgrima', 'esgrima', 'Esgrima', 'lutas', I + 'lutas.svg', '']
  ];
  var TINT = { forca: 'var(--sp-forca)', funcional: 'var(--sp-funcional)', corrida: 'var(--sp-corrida)', lutas: 'var(--sp-lutas)', mente: 'var(--sp-mente)', agua: 'var(--sp-agua)' };
  var list = ROWS.map(function (r) { return { id: r[0], slug: r[1], label: r[2], group: r[3], icon: r[4], photo: r[5] }; });
  var byId = {}, bySlug = {}, byLabel = {};
  list.forEach(function (s) { byId[s.id] = s; bySlug[s.slug] = s; byLabel[s.label] = s; });
  var src = function (v) { return !v ? '' : v.indexOf('/') >= 0 ? v : ((window.__IMG || {})[v] || ''); };
  var get = function (k) { return byLabel[k] || byId[k] || bySlug[k] || null; };
  window.SPORTS = {
    list: list, DS: 10,
    get: get,
    idOfSlug: function (slug) { return bySlug[slug] ? bySlug[slug].id : ''; },
    label: function (k) { var s = get(k); return s ? s.label : ''; },
    tint: function (k) { var s = get(k); return TINT[s ? s.group : 'forca']; },
    icon: function (k) { var s = get(k); return s ? src(s.icon) : ''; },
    // hero do esporte: { img, art }. art = sem foto própria: usa o ícone do esporte como arte.
    hero: function (k) { var s = get(k); if (!s) return { img: '', art: true }; return s.photo ? { img: src(s.photo), art: false } : { img: src(s.icon), art: true }; },
    // nomes na ordem de exibição; com contagens reais, esportes sem ninguém ficam fora (os 10 do DS sempre aparecem)
    ordered: function (counts) {
      var ds = list.slice(0, 10), rest = list.slice(10);
      if (counts) rest = rest.filter(function (s) { return counts[s.id] > 0; }).sort(function (a, b) { return counts[b.id] - counts[a.id]; });
      else rest = rest.slice(0, 2);
      return ds.concat(rest);
    }
  };
})();
