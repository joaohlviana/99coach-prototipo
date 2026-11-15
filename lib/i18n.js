// Páginas públicas em inglês (/en) e espanhol (/es). Só a interface é traduzida: nomes, cidades e especialidades
// escritas pelos profissionais continuam como estão. As ações (pedir, entrar) levam ao app, que é em português.
export const LANGS = ['en', 'es'];
export const ok = (l) => LANGS.includes(l);

const SPORT = {
  en: { musculacao: 'Strength training', funcional: 'Functional training', crossfit: 'CrossFit', pilates: 'Pilates', yoga: 'Yoga', corrida: 'Running', lutas: 'Martial arts', natacao: 'Swimming', ciclismo: 'Cycling', danca: 'Dance', 'jiu-jitsu': 'Jiu-Jitsu', escalada: 'Climbing', fisioterapia: 'Physiotherapy', alongamento: 'Stretching', nutricao: 'Nutrition', condicionamento: 'Conditioning', 'muay-thai': 'Muay Thai', boxe: 'Boxing', tenis: 'Tennis', futebol: 'Soccer', 'bem-estar': 'Wellness', 'beach-tennis': 'Beach Tennis', calistenia: 'Calisthenics', triatlo: 'Triathlon', judo: 'Judo', ginastica: 'Gymnastics', basquete: 'Basketball', surf: 'Surfing', hidroginastica: 'Water aerobics', volei: 'Volleyball', futsal: 'Futsal', lpo: 'Olympic weightlifting', patinacao: 'Skating', 'tenis-de-mesa': 'Table tennis', hyrox: 'Hyrox', golfe: 'Golf', mma: 'MMA', ballet: 'Ballet', 'krav-maga': 'Krav Maga', capoeira: 'Capoeira', 'volei-de-praia': 'Beach volleyball', taekwondo: 'Taekwondo', parkour: 'Parkour', esgrima: 'Fencing' },
  es: { musculacao: 'Musculación', funcional: 'Entrenamiento funcional', crossfit: 'CrossFit', pilates: 'Pilates', yoga: 'Yoga', corrida: 'Running', lutas: 'Artes marciales', natacao: 'Natación', ciclismo: 'Ciclismo', danca: 'Danza', 'jiu-jitsu': 'Jiu-Jitsu', escalada: 'Escalada', fisioterapia: 'Fisioterapia', alongamento: 'Estiramiento', nutricao: 'Nutrición', condicionamento: 'Acondicionamiento', 'muay-thai': 'Muay Thai', boxe: 'Boxeo', tenis: 'Tenis', futebol: 'Fútbol', 'bem-estar': 'Bienestar', 'beach-tennis': 'Beach Tennis', calistenia: 'Calistenia', triatlo: 'Triatlón', judo: 'Judo', ginastica: 'Gimnasia', basquete: 'Baloncesto', surf: 'Surf', hidroginastica: 'Aquagym', volei: 'Voleibol', futsal: 'Fútbol sala', lpo: 'Halterofilia', patinacao: 'Patinaje', 'tenis-de-mesa': 'Tenis de mesa', hyrox: 'Hyrox', golfe: 'Golf', mma: 'MMA', ballet: 'Ballet', 'krav-maga': 'Krav Maga', capoeira: 'Capoeira', 'volei-de-praia': 'Vóley playa', taekwondo: 'Taekwondo', parkour: 'Parkour', esgrima: 'Esgrima' }
};
const SERV = {
  en: { musculacao: 'Personal trainers', funcional: 'Functional training coaches', calistenia: 'Calisthenics coaches', crossfit: 'CrossFit coaches', condicionamento: 'Conditioning coaches', nutricao: 'Sports nutritionists', fisioterapia: 'Physiotherapists', 'bem-estar': 'Wellness professionals', corrida: 'Running coaches' },
  es: { musculacao: 'Entrenadores personales', funcional: 'Entrenadores de funcional', calistenia: 'Entrenadores de calistenia', crossfit: 'Coaches de CrossFit', condicionamento: 'Preparadores físicos', nutricao: 'Nutricionistas deportivos', fisioterapia: 'Fisioterapeutas', 'bem-estar': 'Profesionales de bienestar', corrida: 'Entrenadores de running' }
};
export const esporteNome = (l, slug, rotulo) => (SPORT[l] && SPORT[l][slug]) || rotulo;
export const servico = (l, slug, rotulo) => (SERV[l] && SERV[l][slug]) || (l === 'en' ? esporteNome(l, slug, rotulo) + ' coaches' : 'Profesores de ' + esporteNome(l, slug, rotulo).toLowerCase());

const T = {
  en: {
    locale: 'en_US', htmlLang: 'en', home: 'Home', skip: 'Skip to content', search: 'Name, sport or city', searchLabel: 'Search coaches by name, sport or city',
    navCoaches: 'Coaches', navSports: 'Sports', navIamCoach: "I'm a coach", navLogin: 'Log in', cities: 'Cities', help: 'Help center', terms: 'Terms', privacy: 'Privacy',
    appNote: 'The 99coach app and its messages are in Portuguese. Coaches on 99coach work in Brazil.',
    heroH1: 'Find your coach.', heroP: 'Compare by sport, city and format. Ask the coach you choose for coaching; they reply and, if they accept, your training arrives through the app.',
    inCatalog: (n) => n.toLocaleString('en-US') + (n === 1 ? ' professional' : ' professionals') + ' in the catalog. Results are ordered by relevance; a paid plan does not change the position.',
    sports: 'Sports', byCity: 'Search in your city', ptIn: (c) => 'Personal trainer in ' + c,
    how: 'How it works', how1: ['Find a coach.', ' Compare sport, format and city.'], how2: ['Ask for coaching or accept an invite.', ' A request is not a commitment: the coach replies. An invite is accepted once, by you.'], how3: ['Train with the app.', ' Workouts, logs, progress and chat in one place.'],
    homeTitle: 'Personal trainers and coaches near you or online', homeDesc: 'Find personal trainers and coaches by sport and city in Brazil, in person or online. Compare profiles and ask for coaching.',
    online: 'online', inPerson: 'in person', allCities: 'all cities', sport: 'Sport', inCity: (s, c) => s + ' in ' + c, onlineOf: (s) => s + ' online',
    whoOnline: (s) => 'Who coaches ' + s + ' online, from any city.', whoCity: (s, c) => 'Who coaches ' + s + ' in person in ' + c + '.', whoAll: 'All cities and online coaching. Pick a city to see who coaches in person there.',
    found: (n) => n.toLocaleString('en-US') + (n === 1 ? ' coach' : ' coaches') + ' in this search. Ordered by relevance; a paid plan does not change the position.',
    proOf: (s) => s + ' professionals', alsoOnline: 'Also online', nOnline: (n, s) => n + (n === 1 ? ' coach offers ' : ' coaches offer ') + s + ' online', otherCities: (s) => s + ' in other cities', otherSports: 'Other sports',
    sportDesc: (s, n, c) => c ? s + ' in ' + c + ': ' + n + (n === 1 ? ' professional coaches' : ' professionals coach') + ' in person. Compare profiles and ask for coaching.' : s + ' in Brazil: ' + n + (n === 1 ? ' professional' : ' professionals') + ', by city and online. Compare profiles and ask for coaching.',
    inPersonIn: (c) => 'In person in ' + c, onlineCard: 'Online', noPlace: 'Location not provided',
    shown: (a, b, t, p, ps) => 'Showing ' + a + ' to ' + b + ' of ' + t.toLocaleString('en-US') + ' · page ' + p + ' of ' + ps, prev: '‹ Previous', next: 'Next ›', pagesLabel: 'Pages', page: (p) => ' (page ' + p + ')',
    youAreHere: 'You are here', imported: (n, d) => 'Profile imported from public data' + (d ? ' collected on ' + d : '') + ', not yet confirmed by ' + n + '.', correct: 'Fix, remove or claim (in Portuguese)',
    contact: 'Contact', igTalk: (n, h) => 'Talk to ' + n + ' on Instagram (@' + h + ')', coaching: 'Coaching', coachingP: (n) => 'Profile published by ' + n + ' on 99coach. A request is not a commitment: ' + n + ' replies and, if they accept, coaching starts. Nothing is charged for the request.',
    askCoaching: 'Ask for coaching (in Portuguese)', sportsOf: 'Sports', others: 'Other professionals', inPersonAt: (c) => 'Coaches in person in ' + c, coachesOnline: 'Coaches online', noLoc: 'Location not provided',
    profileDesc: (n, s, c) => n + (s ? ', ' + s : '') + (c ? ' in ' + c : '') + '. See the profile on 99coach and ask for coaching.', notFound: 'Page not found'
  },
  es: {
    locale: 'es_ES', htmlLang: 'es', home: 'Inicio', skip: 'Saltar al contenido', search: 'Nombre, deporte o ciudad', searchLabel: 'Buscar entrenadores por nombre, deporte o ciudad',
    navCoaches: 'Entrenadores', navSports: 'Deportes', navIamCoach: 'Soy entrenador', navLogin: 'Entrar', cities: 'Ciudades', help: 'Centro de ayuda', terms: 'Términos', privacy: 'Privacidad',
    appNote: 'La app de 99coach y sus mensajes están en portugués. Los entrenadores de 99coach trabajan en Brasil.',
    heroH1: 'Encuentra tu entrenador.', heroP: 'Compara por deporte, ciudad y formato. Pide acompañamiento al entrenador que elijas; responde y, si acepta, el entrenamiento llega por la app.',
    inCatalog: (n) => n.toLocaleString('es-ES') + (n === 1 ? ' profesional' : ' profesionales') + ' en el catálogo. El orden es por relevancia; un plan de pago no cambia la posición.',
    sports: 'Deportes', byCity: 'Busca en tu ciudad', ptIn: (c) => 'Entrenador personal en ' + c,
    how: 'Cómo funciona', how1: ['Encuentra un entrenador.', ' Compara deporte, formato y ciudad.'], how2: ['Pide acompañamiento o acepta una invitación.', ' Una solicitud no es un compromiso: el entrenador responde. La invitación la aceptas tú, una vez.'], how3: ['Entrena con la app.', ' Entrenamientos, registros, progreso y chat en un solo lugar.'],
    homeTitle: 'Entrenadores personales y profesores cerca de ti u online', homeDesc: 'Encuentra entrenadores personales y profesores por deporte y ciudad en Brasil, presencial u online. Compara perfiles y pide acompañamiento.',
    online: 'online', inPerson: 'presencial', allCities: 'todas las ciudades', sport: 'Deporte', inCity: (s, c) => s + ' en ' + c, onlineOf: (s) => s + ' online',
    whoOnline: (s) => 'Quién enseña ' + s + ' online, desde cualquier ciudad.', whoCity: (s, c) => 'Quién enseña ' + s + ' presencialmente en ' + c + '.', whoAll: 'Todas las ciudades y la atención online. Elige una ciudad para ver quién atiende presencialmente.',
    found: (n) => n.toLocaleString('es-ES') + (n === 1 ? ' entrenador' : ' entrenadores') + ' en esta búsqueda. Orden por relevancia; un plan de pago no cambia la posición.',
    proOf: (s) => 'Profesionales de ' + s, alsoOnline: 'También online', nOnline: (n, s) => n + (n === 1 ? ' entrenador enseña ' : ' entrenadores enseñan ') + s + ' online', otherCities: (s) => s + ' en otras ciudades', otherSports: 'Otros deportes',
    sportDesc: (s, n, c) => c ? s + ' en ' + c + ': ' + n + (n === 1 ? ' profesional atiende' : ' profesionales atienden') + ' presencialmente. Compara perfiles y pide acompañamiento.' : s + ' en Brasil: ' + n + (n === 1 ? ' profesional' : ' profesionales') + ', por ciudad y online. Compara perfiles y pide acompañamiento.',
    inPersonIn: (c) => 'Presencial en ' + c, onlineCard: 'Online', noPlace: 'Ubicación no informada',
    shown: (a, b, t, p, ps) => 'Mostrando ' + a + ' a ' + b + ' de ' + t.toLocaleString('es-ES') + ' · página ' + p + ' de ' + ps, prev: '‹ Anterior', next: 'Siguiente ›', pagesLabel: 'Páginas', page: (p) => ' (página ' + p + ')',
    youAreHere: 'Estás aquí', imported: (n, d) => 'Perfil importado de datos públicos' + (d ? ' recopilados el ' + d : '') + ', aún no confirmado por ' + n + '.', correct: 'Corregir, retirar o reclamar (en portugués)',
    contact: 'Contacto', igTalk: (n, h) => 'Habla con ' + n + ' en Instagram (@' + h + ')', coaching: 'Acompañamiento', coachingP: (n) => 'Perfil publicado por ' + n + ' en 99coach. Una solicitud no es un compromiso: ' + n + ' responde y, si acepta, empieza el acompañamiento. No se cobra nada por la solicitud.',
    askCoaching: 'Pedir acompañamiento (en portugués)', sportsOf: 'Deportes', others: 'Otros profesionales', inPersonAt: (c) => 'Atiende presencialmente en ' + c, coachesOnline: 'Atiende online', noLoc: 'Ubicación no informada',
    profileDesc: (n, s, c) => n + (s ? ', ' + s : '') + (c ? ' en ' + c : '') + '. Ve el perfil en 99coach y pide acompañamiento.', notFound: 'Página no encontrada'
  }
};
export const t = (l) => T[l];
// versões da mesma página em cada idioma (hreflang)
export const idiomas = (caminho) => ({ 'pt-BR': caminho, en: '/en' + (caminho === '/' ? '' : caminho), es: '/es' + (caminho === '/' ? '' : caminho), 'x-default': caminho });
