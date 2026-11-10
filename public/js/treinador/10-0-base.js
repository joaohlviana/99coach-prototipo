/* T1 · base comum das telas de relação com alunos (Hoje, carteira, Aluno 360, convites, pedidos, preparação e vínculo).
   Coleções próprias (prefixo t1_) e utilidades compartilhadas entre os arquivos 10-*. */
(function () {
  var DB = window.DB, U = window.U;

  // convites individuais (REL01/REL02). aluno = id em DB.alunos quando existe registro de convite/vínculo
  DB.seed('t1_convites', [
    { id: 'cv1', aluno: 'carla', name: 'Carla Nunes', contact: 'carla.n•••@gmail.com', offer: 'o1', code: 'RL-7K2Q', created: '25/10 18:05', status: 'pendente', shared: 'link copiado 25/10 18:06', expires: '01/11', updated: '25/10' },
    { id: 'cv2', aluno: '', name: 'Felipe Ramos', contact: '(43) 9••••-2210', offer: 'o2', code: 'RL-9M4T', created: '26/10 08:10', status: 'criado', shared: '', expires: '02/11', updated: 'hoje 08:10' },
    { id: 'cv3', aluno: '', name: 'João Pedro Alves', contact: 'joao.p•••@outlook.com', offer: 'o1', code: 'RL-2C8H', created: '17/10 10:00', status: 'expirado', shared: 'link copiado 17/10', expires: '24/10', updated: '24/10' },
    { id: 'cv4', aluno: 'larissa', name: 'Larissa Mendes', contact: 'larissa.m•••@gmail.com', offer: 'o1', code: 'RL-5P1W', created: '22/10 09:30', status: 'aceito', shared: 'link copiado 22/10', expires: '29/10', updated: '25/10' },
    { id: 'cv5', aluno: '', name: 'Rita Campos', contact: '(43) 9••••-7781', offer: '', code: 'RL-4D6Z', created: '12/10 16:40', status: 'revogado', shared: 'link copiado 12/10', expires: '19/10', updated: '14/10' }
  ]);
  // pedidos de acompanhamento (REL06). Paula Costa já existe em DB.alunos com status "pedido"
  DB.seed('t1_pedidos', [
    { id: 'pd1', aluno: 'paula', name: 'Paula Costa', origin: 'Serviço', offer: 'o1', msg: 'Quero treinar em casa 3x por semana. Tenho halteres e elástico.', at: 'ontem 19:20', due: 'responder até 27/10', goal: 'Treinar em casa 3x por semana', city: 'Ibiporã, PR', status: 'pendente', result: '' },
    { id: 'pd2', aluno: '', name: 'Ana Nunes', origin: 'Perfil', offer: '', msg: 'Vocês atendem iniciante? Nunca fiz CrossFit.', at: 'hoje 08:40', due: 'responder até 28/10', goal: 'Começar CrossFit do zero', city: 'Londrina, PR', status: 'pendente', result: '' },
    { id: 'pd3', aluno: '', name: 'Thiago Reis', origin: 'Serviço', offer: 'o2', msg: 'Procuro sessão presencial no Centro, às terças de manhã.', at: 'sáb 11:05', due: 'responder até 27/10', goal: 'Voltar a treinar força', city: 'Londrina, PR', status: 'pendente', result: '' }
  ]);
  // relações encerradas (aparecem só no filtro "Encerrados" e na busca em todos). Inclui uma homônima da Ana.
  DB.seed('t1_encerrados', [
    { id: 'ana2', name: 'Ana Carolina Souza', first: 'Ana', status: 'encerrado', svc: 'Sessão presencial', since: '02/2024', ended: '08/2024', city: 'Curitiba, PR', contact: 'anacs•••@hotmail.com', age: 41, goal: 'Reabilitação de joelho', program: '', week: 0, adherence: 0, lastCheckin: '', next: 'Encerrado em 08/2024', flag: null, tags: ['encerrado'], prepDone: true, payment: '', photo: '' }
  ]);
  // pendências resolvidas no Hoje (para desfazer) e preferências do treinador nessas telas
  DB.seed('t1_resolvidas', []);
  DB.seed('t1_prefs', { proDismissed: false, filtros: null, lastSync: '08:02' });
  // recibos de pausa, retomada e encerramento (REL09)
  DB.seed('t1_recibos', []);

  var PH = { ana: 'd80d1c82749ab145627ab4015f6f6041', bruno: '349006eab36388172034672605e15a49', marcos: '848c200425592389106d38549e36440a', larissa: 'eeb5e0340d20ffe1859010e8d3911dc0' };
  var PRI = { dor: 1, resposta: 2, pedido: 3, preparacao: 4, programacao: 5 };
  var STATUS = { ativo: ['Ativo', 'badge badge--ok'], pausado: ['Pausado', 'badge badge--warn'], convite: ['Convidado', 'badge badge--info'], pedido: ['Pedido', 'badge badge--info'], encerrado: ['Encerrado', 'badge badge--plain'] };

  function aluno(id) {
    return DB.find('alunos', id) || (DB.t1_encerrados || []).find(function (x) { return x.id === id; }) || null;
  }
  function person(a) {
    var ph = a && PH[a.id] ? U.img(PH[a.id]) : '';
    var name = a ? a.name : '';
    return { name: name, first: a ? (a.first || name.split(' ')[0]) : '', short: short(name), ini: U.ini(name), photo: ph, hasPhoto: !!ph, noPhoto: !ph };
  }
  function short(n) { var p = String(n || '').split(' '); return p.length > 1 ? p[0] + ' ' + p[p.length - 1].charAt(0) + '.' : String(n || ''); }
  function status(a) { var s = STATUS[a && a.status] || ['—', 'badge badge--plain']; return { label: s[0], cls: s[1] }; }
  function offer(id) { return DB.find('ofertas', id); }
  function resposta(alunoId, pend) {
    return (DB.respostas || []).find(function (q) { return q.student === alunoId && (!pend || q.status === 'pendente'); }) || null;
  }
  function prepResposta(alunoId) {
    return (DB.respostas || []).find(function (q) { return q.student === alunoId && q.form === 'f1'; }) || null;
  }
  function rotina(a) { return a && a.program ? DB.find('rotinas', a.program) : null; }
  // ação de uma pendência (motivo verificável → destino)
  function act(a) {
    var f = a.flag || {}, q;
    switch (f.kind) {
      case 'dor':
        q = resposta(a.id, true);
        return q ? { label: a.id === 'ana' ? 'Revisar resposta' : 'Ler relato', to: 'TRE06', params: { id: a.id, resposta: q.id }, who: 'Você' } : { label: 'Ler relato', to: 'TRE03', params: { id: a.id }, who: 'Você' };
      case 'resposta':
        q = prepResposta(a.id);
        return q ? { label: 'Revisar', to: 'REL08', params: { id: a.id }, who: 'Você' } : { label: 'Revisar', to: 'TRE06', params: { id: a.id }, who: 'Você' };
      case 'pedido': return { label: 'Responder', to: 'REL06', params: { id: a.id }, who: 'Você' };
      case 'preparacao': return { label: 'Ver', to: 'TRE03', params: { id: a.id }, who: a.first || short(a.name) };
      case 'programacao': return { label: 'Programar', to: f.to || 'TRE15', params: { id: a.id }, who: 'Você' };
      default: return { label: 'Abrir', to: f.to || 'TRE03', params: { id: a.id }, who: 'Você' };
    }
  }
  function queue() {
    return DB.alunos.map(function (a, i) { return { a: a, i: i }; }).filter(function (x) { return x.a.flag; })
      .sort(function (x, y) { return ((PRI[x.a.flag.kind] || 9) - (PRI[y.a.flag.kind] || 9)) || (x.i - y.i); })
      .map(function (x) { return x.a; });
  }
  function today(d) { return d === 'seg 26/10'; }
  // alerta pronto para o template: { cls, ic, title, text, hasBtn, btn, act }
  function alert(kind, title, text, btn, fn) {
    var ic = { info: 'info', warn: 'alert', risk: 'alert', ok: 'check' }[kind] || 'info';
    return { cls: 'alert alert--' + kind, ic: 'ic ic--sm i-' + ic, title: title, text: text || '', hasBtn: !!btn, btn: btn || '', act: fn || function () {} };
  }
  function contactOk(t) {
    t = String(t || '').trim();
    if (!t) return true;
    if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t)) return true;
    var d = t.replace(/\D/g, '');
    return d.length >= 10 && d.length <= 13;
  }
  function mask(t) {
    t = String(t || '').trim();
    if (!t) return 'sem contato · compartilhe o link';
    if (t.indexOf('@') > 0) { var p = t.split('@'); return p[0].slice(0, Math.min(5, p[0].length)) + '•••@' + p[1]; }
    var d = t.replace(/\D/g, '');
    return '(' + d.slice(-11, -9) + ') 9••••-' + d.slice(-4);
  }
  function code() { return 'RL-' + Math.random().toString(36).slice(2, 6).toUpperCase(); }

  window.T1 = { aluno: aluno, person: person, short: short, status: status, offer: offer, resposta: resposta, prepResposta: prepResposta, rotina: rotina, act: act, queue: queue, today: today, alert: alert, contactOk: contactOk, mask: mask, code: code, PRI: PRI };
})();
