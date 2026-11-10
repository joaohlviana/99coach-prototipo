/* PUB11 · Ajuda e páginas informativas: busca, categorias, artigo aberto (modelo de leitura único), contato com protocolo e acompanhamento */
(function () {
  'use strict';
  DB.seed('p2_artigos', [
    { id: 'pagamentos', cat: 'pagamentos', title: 'Pagamentos e reembolsos', version: '01/10/2026', lead: 'Como funcionam cobrança, cancelamento e reembolso em cada tipo de contratação.',
      sections: [
        { id: 'cobranca', h: 'Cobrança', body: 'Você vê preço, ciclo e condições na oferta antes de pagar. Assinaturas são cobradas no início de cada ciclo; sessões avulsas, pacotes e programas são cobrados uma vez, na contratação.' },
        { id: 'cancelamento', h: 'Cancelamento', body: 'Assinaturas podem ser canceladas em Minhas contratações. O acesso segue até o fim do ciclo já pago, salvo outra condição informada na própria oferta.' },
        { id: 'reembolso', h: 'Reembolso', body: 'Prazos e condições seguem a política aprovada de cada oferta. A regra que aparece aqui é a mesma da oferta; quando a oferta não informa a política, pergunte ao treinador antes de contratar.', rule: true }
      ], links: [['Ver condições de uma oferta', '@servico'], ['Minhas contratações', 'FC07']] },
    { id: 'privacidade', cat: 'conta', title: 'Privacidade e dados', version: '01/10/2026', lead: 'Que dados a 99Coach usa, para quê, e como pedir acesso, correção ou exclusão.',
      sections: [
        { id: 'coleta', h: 'O que usamos', body: 'Dados de conta, contratações e mensagens, para que o serviço funcione. Nada é vendido a terceiros.' },
        { id: 'saude', h: 'Dados de saúde', body: 'Respostas sobre saúde ficam só entre você e o treinador que você autorizou. Nunca aparecem em páginas públicas.' },
        { id: 'pedidos', h: 'Seus pedidos', body: 'Acesso, correção e exclusão ficam em Privacidade e dados, dentro da sua conta.' }
      ], links: [['Privacidade e dados', 'ACC13']] },
    { id: 'perfil', cat: 'conta', title: 'Perfis criados de fonte pública', version: '12/10/2026', lead: 'Alguns perfis são montados com informações públicas, como Instagram, antes de o treinador entrar na 99Coach.',
      sections: [
        { id: 'origem', h: 'De onde vêm os dados', body: 'Mostramos a fonte e a data da coleta em cada perfil importado. Publicamos só nome, modalidade e região aproximada.' },
        { id: 'corrigir', h: 'Corrigir ou retirar', body: 'Qualquer pessoa citada pode pedir correção ou retirada, sem criar conta. Você recebe um protocolo para acompanhar.' },
        { id: 'reivindicar', h: 'Reivindicar', body: 'Reivindicar é diferente de retirar: você assume o perfil e passa a editá-lo. Excluir uma conta é outro pedido.' }
      ], links: [['Corrigir perfil', 'PUB12']] },
    { id: 'termos', cat: 'politicas', title: 'Termos de uso', version: '15/09/2026', lead: 'Regras de uso da 99Coach para alunos, treinadores e visitantes.',
      sections: [
        { id: 'quem', h: 'Quem pode usar', body: 'Pessoas a partir de 18 anos, ou com autorização do responsável quando a oferta permitir.' },
        { id: 'contratacao', h: 'Contratações', body: 'O acompanhamento é combinado entre aluno e treinador. Pagamento, cancelamento e reembolso seguem o artigo Pagamentos e reembolsos.' },
        { id: 'conteudo', h: 'Conteúdo publicado', body: 'Quem publica responde pelo que publica. Denúncias abrem um caso com protocolo.' }
      ], links: [] },
    { id: 'cookies', cat: 'politicas', title: 'Cookies', version: '01/10/2026', lead: 'Cookies necessários e opcionais, e como mudar sua escolha.',
      sections: [
        { id: 'necessarios', h: 'Necessários', body: 'Mantêm você conectado e protegem a conta. Não dá para desligar.' },
        { id: 'opcionais', h: 'Opcionais', body: 'Medição de uso, só com sua permissão. Você muda a escolha quando quiser.' }
      ], links: [] },
    { id: 'repasses', cat: 'treinadores', title: 'Ofertas e recebimentos para treinadores', version: '01/10/2026', lead: 'Como publicar ofertas e receber pelas vendas feitas na 99Coach.',
      sections: [
        { id: 'oferta', h: 'Publicar oferta', body: 'Toda oferta mostra preço, ciclo e política de cancelamento antes da compra.' },
        { id: 'recebimentos', h: 'Recebimentos', body: 'Valores e datas de repasse aparecem em Recebimentos, conforme o plano contratado.' }
      ], links: [] },
    { id: 'comofunciona', cat: 'institucional', title: 'Como funciona a 99Coach', version: '01/09/2026', lead: 'A 99Coach liga alunos e treinadores de CrossFit, musculação, corrida e outras modalidades.',
      sections: [
        { id: 'alunos', h: 'Para alunos', body: 'Você compara perfis, conversa antes de contratar e acompanha os treinos no app.' },
        { id: 'treinadores', h: 'Para treinadores', body: 'Você organiza alunos, rotinas, agenda e recebimentos em um só lugar.' }
      ], links: [] }
  ]);
  DB.seed('p2_casos', [
    { id: '99C-2610-3187', subject: 'Pagamento', email: 'visitante@exemplo.com', text: 'Fui cobrado duas vezes na mesma assinatura.', at: '26/10 09:14', status: 'Recebida' }
  ]);
  var CATS = [['todas', 'Todas'], ['pagamentos', 'Pagamentos'], ['conta', 'Conta e privacidade'], ['politicas', 'Termos e políticas'], ['treinadores', 'Para treinadores'], ['institucional', 'Sobre a 99Coach']];
  var CATN = {}; CATS.forEach(function (c) { CATN[c[0]] = c[1]; });
  var SUBJ = ['Pagamento', 'Conta e acesso', 'Perfil público', 'Outro'];
  var LANGS = [['pt', 'PT'], ['en', 'EN'], ['es', 'ES']];
  var LANGN = { en: 'inglês', es: 'espanhol' };

  REG.screen({
    page: 'publico', key: 'ajuda', id: 'PUB11', title: 'Ajuda', nav: 'ajuda', back: 'history', wide: true,
    testIds: ['pagamentos'],
    normal: 'Leitura e busca',
    scens: [['caso', 'Caso aberto'], ['politica', 'Política em definição'], ['naoenviou', 'Não enviou'], ['traducao', 'Tradução indisponível'], ['semres', 'Busca sem resultado'], ['enviando', 'Suporte enviando'], ['desconhecido', 'Resultado desconhecido'], ['casoindisp', 'Consulta de caso indisponível']],
    vals: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn, g = function (k, d) { return P2.g(ui, k, d); };
      var defView = { politica: 'art', traducao: 'art', naoenviou: 'contact', enviando: 'contact', desconhecido: 'contact', casoindisp: 'track' }[scn] || (ctx.p.art || ctx.id ? 'art' : 'index');
      var view = g('view', defView);
      var artId = g('art', ctx.p.art || ctx.id || 'pagamentos');
      var art = DB.find('p2_artigos', artId) || DB.p2_artigos[0];
      var q = g('q', scn === 'semres' ? 'reembolso em dobro' : '');
      var cat = g('cat', 'todas');
      var lang = g('lang', scn === 'traducao' ? 'en' : 'pt');
      var caseId = g('caseId', '99C-2610-3187');
      var draft = { subject: g('subject', scn === 'naoenviou' || scn === 'enviando' || scn === 'desconhecido' ? 'Pagamento' : ''), email: g('email', scn === 'naoenviou' || scn === 'enviando' || scn === 'desconhecido' ? 'visitante@exemplo.com' : ''), text: g('text', scn === 'naoenviou' || scn === 'enviando' || scn === 'desconhecido' ? 'A cobrança de outubro apareceu duas vezes no meu cartão.' : '') };
      var err = g('err', {});
      var sending = scn === 'enviando';

      var open = function (id, sec) { return function () { ctx.setUi({ view: 'art', art: id, sec: sec || '', lang: 'pt', why: false }); }; };
      var toIndex = function () { ctx.setUi({ view: 'index' }); };
      var cont = function () { if (ctx.p.from) ctx.go(ctx.p.from, ctx.p.fromParams || {}); else ctx.back(); };
      var nav = function (to) { return function () { if (to === '@servico') ctx.go('@servico', { offer: 'online' }); else if (to === 'PUB12') ctx.go('PUB12'); else ctx.go(to); }; };

      // envio do contato: cria o caso com protocolo (abertura de caso não é resolução)
      var send = function () {
        var e = {};
        if (!draft.subject) e.subject = 'Escolha o assunto.';
        if (!P2.email(draft.email)) e.email = 'Informe um e-mail válido para receber a resposta.';
        if (String(draft.text).trim().length < 10) e.text = 'Conte em poucas palavras o que aconteceu (mínimo 10 caracteres).';
        if (Object.keys(e).length) { ctx.setUi({ err: e }); return; }
        var id = P2.protocol();
        DB.p2_casos.unshift({ id: id, subject: draft.subject, email: draft.email, text: draft.text, at: '26/10 ' + U.now(), status: 'Recebida' });
        if (ctx.scn) ctx.scenario('');
        ctx.setUi({ view: 'track', caseId: id, err: {}, subject: '', email: '', text: '', justSent: true });
      };

      // busca: título, resumo e seções, sem acento
      var nq = U.norm(q);
      var list = DB.p2_artigos.filter(function (a) {
        if (cat !== 'todas' && a.cat !== cat) return false;
        if (!nq) return true;
        var hay = U.norm([a.title, a.lead].concat(a.sections.map(function (s) { return s.h + ' ' + s.body; })).join(' '));
        return nq.split(/\s+/).every(function (w) { return hay.indexOf(w) >= 0; });
      }).map(function (a) {
        return { title: a.title, sub: CATN[a.cat] + ' · Versão de ' + a.version, go: open(a.id) };
      });

      // banners de situação
      var alerts = [];
      if (scn === 'caso') alerts.push(P2.alert('ok', 'check', 'Caso aberto', 'Protocolo 99C-2610-3187 · acompanhe aqui ou pelo e-mail informado. Abrir um caso não significa que ele já foi resolvido.', 'Acompanhar solicitação', function () { ctx.setUi({ view: 'track', caseId: '99C-2610-3187' }); }));
      if (scn === 'politica' && view === 'art') alerts.push(P2.alert('warn', 'info', 'Política em definição', 'Uma nova versão está em revisão. Vale a versão vigente de ' + art.version + ' até a publicação, com a data de início informada aqui e na oferta.', 'Saiba por quê', function () { ctx.setUi({ why: !g('why', false) }); }));
      if (scn === 'naoenviou') alerts.push(P2.alert('risk', 'alert', 'Não enviou', 'Sua mensagem foi mantida. Confira a conexão e tente de novo.', 'Tentar de novo', send));
      if (scn === 'traducao' && lang !== 'pt') alerts.push(P2.alert('info', 'info', 'Tradução indisponível em ' + (LANGN[lang] || 'outro idioma'), 'Este artigo existe, mas ainda não foi traduzido. Mostramos o texto vigente em português.', 'Tentar de novo', function () { ctx.toast('A tradução ainda não está pronta. Continue em português.'); }, 'Ver em português', function () { ctx.scenario(''); ctx.setUi({ lang: 'pt' }); }));
      if (scn !== 'traducao' && lang !== 'pt' && view === 'art') alerts.push(P2.alert('info', 'info', 'Tradução indisponível em ' + (LANGN[lang] || 'outro idioma'), 'Este artigo existe, mas ainda não foi traduzido. Mostramos o texto vigente em português.', 'Ver em português', function () { ctx.setUi({ lang: 'pt' }); }));
      if (scn === 'desconhecido') alerts.push(P2.alert('warn', 'clock', 'Resultado desconhecido', 'Não sabemos se sua solicitação chegou. Consulte antes de reenviar para não abrir dois casos.', 'Consultar de novo', function () {
        var id = P2.protocol();
        DB.p2_casos.unshift({ id: id, subject: draft.subject, email: draft.email, text: draft.text, at: '26/10 ' + U.now(), status: 'Recebida' });
        ctx.scenario(''); ctx.setUi({ view: 'track', caseId: id }); ctx.toast('Encontramos sua solicitação ' + id + '. Não precisa reenviar.');
      }));
      if (scn === 'casoindisp') alerts.push(P2.alert('risk', 'alert', 'Consulta de caso indisponível', 'Seu caso continua registrado. Tente de novo em instantes ou use o protocolo que enviamos por e-mail.', 'Tentar de novo', function () { ctx.scenario(''); }));

      // artigo aberto
      var sec = g('sec', '');
      var sections = art.sections.map(function (s) {
        return { id: 'p2-sec-' + s.id, h: s.h, body: s.body, isRule: !!s.rule, noRule: !s.rule, cls: 'p2-art__sec' + (sec === s.id ? ' is-on' : ''), rowCls: 'p2-toc__it' + (sec === s.id ? ' is-on' : ''), cur: String(sec === s.id), pick: function () { ctx.setUi({ sec: s.id }); try { var el = document.getElementById('p2-sec-' + s.id); if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (_) {} } };
      });
      var artLinks = art.links.map(function (l) { return { label: l[0], go: nav(l[1]) }; });

      // caso acompanhado
      var cs = DB.find('p2_casos', caseId);
      var lookQ = g('lookQ', '');
      var lookErr = g('lookErr', '');
      var steps = ['Recebida', 'Em análise', 'Respondida'].map(function (s, i) {
        var at = cs ? ['Recebida', 'Em análise', 'Respondida'].indexOf(cs.status) : -1;
        return { label: s, cls: 'p2-step' + (i <= at ? ' is-done' : '') + (i === at ? ' is-cur' : ''), n: String(i + 1) };
      });

      return {
        isIndex: view === 'index', isArt: view === 'art', isContact: view === 'contact', isTrack: view === 'track',
        alerts: alerts, hasAlerts: alerts.length > 0,
        // índice
        q: q, setQ: function (e) { ctx.setUi({ q: U.val(e) }); }, clearQ: function () { ctx.setUi({ q: '', cat: 'todas' }); if (ctx.scn === 'semres') ctx.scenario(''); },
        hasQ: !!q,
        cats: CATS.map(function (c) { var on = c[0] === cat; return { label: c[1], cls: 'chip p2-chip' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ cat: c[0] }); } }; }),
        list: list, hasList: list.length > 0, noList: list.length === 0, count: U.plural(list.length, 'artigo', 'artigos'),
        qLabel: q,
        // artigo
        art: { title: art.title, version: 'Versão vigente de ' + art.version + ' · Brasil', lead: art.lead, cat: CATN[art.cat], ver: art.version },
        sections: sections, artLinks: artLinks, hasArtLinks: artLinks.length > 0,
        langs: LANGS.map(function (l) { var on = l[0] === lang; return { label: l[1], cls: 'seg__it' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ lang: l[0] }); } }; }),
        langName: lang === 'pt' ? 'Português' : 'Português (tradução indisponível)',
        why: g('why', false) && scn === 'politica',
        toIndex: toIndex,
        // contato
        openContact: function () { ctx.setUi({ view: 'contact', err: {} }); },
        subjects: SUBJ.map(function (s) { var on = s === draft.subject; return { label: s, cls: 'chip p2-chip' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ subject: s, err: Object.assign({}, err, { subject: '' }) }); } }; }),
        email: draft.email, text: draft.text,
        setEmail: function (e) { ctx.setUi({ email: U.val(e) }); }, setText: function (e) { ctx.setUi({ text: U.val(e) }); },
        errSubject: err.subject || '', hasErrSubject: !!err.subject, errEmail: err.email || '', hasErrEmail: !!err.email, errText: err.text || '', hasErrText: !!err.text,
        emailCls: 'input' + (err.email ? ' is-err' : ''), textCls: 'input input--area' + (err.text ? ' is-err' : ''),
        sending: sending, notSending: !sending, send: send,
        // acompanhamento
        hasCase: !!cs && scn !== 'casoindisp', noCase: !cs && scn !== 'casoindisp',
        cs: cs ? { id: cs.id, subject: cs.subject, at: cs.at, status: cs.status, email: cs.email } : { id: '', subject: '', at: '', status: '', email: '' },
        steps: steps, justSent: !!g('justSent', false),
        openTrack: function () { ctx.setUi({ view: 'track' }); },
        lookQ: lookQ, setLook: function (e) { ctx.setUi({ lookQ: U.val(e), lookErr: '' }); },
        look: function () {
          var id = String(lookQ).trim().toUpperCase();
          var f = DB.find('p2_casos', id);
          if (!f) { ctx.setUi({ lookErr: 'Protocolo não encontrado. Confira o formato 99C-0000-0000 no e-mail que enviamos.' }); return; }
          ctx.setUi({ caseId: id, lookErr: '', justSent: false });
        },
        lookErr: lookErr, hasLookErr: !!lookErr,
        // saídas
        subject: draft.subject || 'Não escolhido', openPay: open('pagamentos'),
        showFoot: view !== 'contact', footContact: view !== 'track',
        cont: cont, toPrivacy: function () { ctx.go('ACC13'); }, toFix: function () { ctx.go('PUB12'); }, toHires: function () { ctx.go('FC07'); }
      };
    }
  });
})();
