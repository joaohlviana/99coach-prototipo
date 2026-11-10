/* ALU06 · Meus programas e retomada: treino atual com Rafael + programas por origem (cortesia, compra), vigência,
   progresso com versão e "continuar de onde parou" no último item autorizado. Estrutura dos programas em A1.PROG. */
(function () {
  function L(id, t, kind, dur, ex) { return { id: id, t: t, kind: kind, dur: dur, ex: ex || '' }; }
  window.A1.PROG = {
    ct2: {
      name: 'CrossFit do zero', author: 'Rafael Lima', program: 'p1', version: 3, origin: 'Acesso gratuito do treinador', originCls: 'badge badge--info',
      valid: 'Liberado por Rafael em 15/09 · sem data de término', drip: 'Uma semana nova toda terça',
      mods: [
        { t: 'Semana 1 · base', rel: '15/09', items: [L('c1', 'Boas-vindas e segurança', 'aula', '6 min'), L('c2', 'Agachamento com peso do corpo', 'aula', '9 min', 'agach'), L('c3', 'Primeiro WOD: 10 minutos', 'treino', '10 min', 'burpee')] },
        { t: 'Semana 2 · técnica', rel: '22/09', items: [L('c4', 'Kettlebell swing', 'aula', '8 min', 'swing'), L('c5', 'Burpee sem pressa', 'aula', '7 min', 'burpee'), L('c6', 'WOD técnico', 'treino', '15 min', 'swing')] },
        { t: 'Semana 3 · posterior', rel: '29/09', items: [L('c7', 'Levantamento terra com barra', 'aula', '11 min', 'terra'), L('c8', 'Prancha e core', 'texto', '5 min', 'prancha'), L('c9', 'WOD 12 minutos', 'treino', '12 min', 'terra')] },
        { t: 'Semana 4 · costas', rel: '06/10', items: [L('c10', 'Remada curvada', 'aula', '9 min', 'remada'), L('c11', 'Mobilidade de ombro', 'aula', '6 min', 'mob-ombro'), L('c12', 'WOD em dupla (adaptado)', 'treino', '14 min', 'remada')] },
        { t: 'Semana 5 · força', rel: '13/10', items: [L('c13', 'Agachamento livre com barra', 'aula', '12 min', 'agach'), L('c14', 'Respiração e ritmo', 'texto', '4 min'), L('c15', 'WOD 15 minutos', 'treino', '15 min', 'agach')] },
        { t: 'Semana 6 · potência', rel: '20/10', items: [L('c16', 'Arremesso (clean): introdução', 'aula', '13 min', 'clean'), L('c17', 'Barra fixa com elástico', 'aula', '8 min', 'barra'), L('c18', 'WOD de revisão', 'treino', '16 min', 'clean')] },
        { t: 'Semana 7 · empurrar', rel: '27/10', items: [L('c19', 'Supino reto', 'aula', '10 min', 'supino'), L('c20', 'Recuperação entre treinos', 'texto', '5 min'), L('c21', 'WOD 18 minutos', 'treino', '18 min', 'supino')] },
        { t: 'Semana 8 · fechamento', rel: '03/11', items: [L('c22', 'Teste de referência', 'treino', '20 min', 'agach'), L('c23', 'Como seguir depois', 'texto', '6 min'), L('c24', 'WOD final', 'treino', '20 min', 'burpee')] }
      ]
    },
    ct3: {
      name: 'Mobilidade 15 minutos', author: 'Carolina Albuquerque', program: '', version: 2, origin: 'Compra · Pix · 02/08', originCls: 'badge badge--plain',
      valid: 'Acesso por 12 meses · até 02/08/2027', drip: 'Tudo liberado na compra',
      mods: [
        { t: 'Semana 1 · ombros', rel: '02/08', items: [L('m1', 'Rotação com bastão', 'aula', '15 min', 'mob-ombro'), L('m2', 'Ombro na parede', 'aula', '15 min'), L('m3', 'Escápulas ativas', 'aula', '15 min')] },
        { t: 'Semana 2 · quadril', rel: '02/08', items: [L('m4', 'Quadril 90/90', 'aula', '15 min'), L('m5', 'Afundo com alcance', 'aula', '15 min', 'afundo'), L('m6', 'Agachamento profundo assistido', 'aula', '15 min', 'agach')] },
        { t: 'Semana 3 · coluna', rel: '02/08', items: [L('m7', 'Gato e camelo', 'aula', '15 min'), L('m8', 'Rotação torácica', 'aula', '15 min'), L('m9', 'Extensão no rolo', 'aula', '15 min')] },
        { t: 'Semana 4 · rotina completa', rel: '02/08', items: [L('m10', 'Rotina A', 'treino', '15 min', 'prancha'), L('m11', 'Rotina B', 'treino', '15 min', 'mob-ombro'), L('m12', 'Como manter o hábito', 'texto', '5 min')] }
      ]
    }
  };
  // datas como dd/mm comparáveis (2026; 03/11 depois de 27/10)
  window.A1.relOk = function (rel) { var p = rel.split('/'); var n = Number(p[1]) * 100 + Number(p[0]); return n <= 1026; };
  window.A1.flat = function (P) {
    var out = [];
    P.mods.forEach(function (m, mi) { m.items.forEach(function (it, k) { out.push({ it: it, mod: m, mi: mi, k: k, n: m.items.length, ok: window.A1.relOk(m.rel) }); }); });
    return out;
  };
  window.A1.pct = function (ctid) {
    var P = window.A1.PROG[ctid], pr = DB.a1_progresso[ctid]; if (!P || !pr) return 0;
    return Math.floor(pr.done.length / window.A1.flat(P).length * 100);
  };
})();

REG.screen({
  page: 'aluno', key: 'programas', id: 'ALU06', title: 'Meus programas', mtitle: 'Programas', nav: 'treinos',
  normal: 'Com programas',
  scens: [['vazio', 'Sem programas'], ['falha', 'Leitura falhou'], ['aguardando', 'Aguardando liberação'], ['futura', 'Vigência futura'], ['outra', 'Outra origem'],
    ['retirado', 'Programa retirado'], ['expirado', 'Acesso expirado'], ['expirado2', 'Expirado']],
  vals: function (ctx) {
    var A1 = window.A1, scn = ctx.scn;
    var exec = A1.exec(), rot = DB.find('rotinas', 'r1') || { name: '', version: 1 };
    var next = DB.meusTreinos.filter(function (x) { return x.status === 'hoje' || x.status === 'próximo'; })[0] || null;
    var runT = exec ? A1.treino(exec.treino) : null;
    var cur = {
      title: rot.name, sub: 'Com Rafael Lima · v' + rot.version + ' · acompanhamento online',
      state: runT ? runT.name + ' em andamento' : (next ? 'Próximo: ' + next.name + ' · ' + next.day : 'Sem treino publicado'),
      btn: runT ? 'Continuar treino' : 'Ver treino', go: runT ? function () { GO('ALU03'); } : function () { GO('ALU02', { id: next ? next.id : 't1' }); }
    };
    var progs = DB.contratacoes.filter(function (c) { return c.kind === 'programa' && A1.PROG[c.id]; }).map(function (c) {
      var P = A1.PROG[c.id], pr = DB.a1_progresso[c.id], fl = A1.flat(P);
      var nx = fl.filter(function (f) { return f.it.id === pr.last; })[0] || fl[0];
      var pct = A1.pct(c.id), badge = '', badgeCls = 'badge badge--plain', note = '', blocked = false, extra = '';
      if (c.id === 'ct3' && scn === 'retirado') { badge = 'Retirado da venda'; badgeCls = 'badge badge--warn'; note = 'Carolina retirou o programa da vitrine em 20/10. Seu acesso continua conforme a licença: até 02/08/2027.'; }
      if (c.id === 'ct2' && scn === 'outra') { badge = 'Cortesia'; badgeCls = 'badge badge--info'; note = 'Rafael liberou por cortesia. Mudanças no plano dele não tiram seu acesso.'; }
      return {
        name: P.name, author: 'por ' + P.author, origin: P.origin, originCls: P.originCls, valid: P.valid,
        prog: 'v' + pr.version + ' · ' + pct + '% · ' + pr.done.length + ' de ' + fl.length + ' aulas', pct: pct + '%',
        resume: 'Continuar de onde parou: ' + nx.mod.t + ' · aula ' + (nx.k + 1) + ' de ' + nx.n + ' · ' + nx.it.t,
        last: 'Último acesso ' + pr.at + ' · ' + pr.device,
        hasBadge: !!badge, badge: badge, badgeCls: badgeCls, hasNote: !!note, note: note, blocked: blocked, canGo: !blocked, extra: extra,
        go: function () { GO('ALU07', { id: c.id }); }, goBuy: function () { GO('FC07', { id: c.id }); }
      };
    });
    // programa extra só nas situações de acesso (expirado, futuro, aguardando)
    var ext = null;
    if (scn === 'expirado' || scn === 'expirado2') ext = { name: 'Base de Corrida 5K', author: 'por Carolina Albuquerque', status: 'Expirado', cls: 'badge badge--risk', txt: 'Compra de 01/03 · acesso valeu até 01/09. Seu progresso (40%, v1) fica guardado se renovar.', btn: 'Ver opções', go: function () { GO('@perfil', { id: 'carolina' }); } };
    if (scn === 'futura') ext = { name: 'Base de Corrida 5K', author: 'por Carolina Albuquerque', status: 'Começa 01/11', cls: 'badge badge--info', txt: 'Compra confirmada em 24/10. O acesso começa na data escolhida pela autora.', btn: 'Saiba por quê', go: function () { GO('FC07'); } };
    if (scn === 'aguardando') ext = { name: 'Base de Corrida 5K', author: 'por Carolina Albuquerque', status: 'Aguardando liberação', cls: 'badge badge--warn', txt: 'Pix em confirmação desde hoje 09:58. Não mostramos o conteúdo antes de confirmar.', btn: 'Consultar de novo', go: A1.retry(ctx, 'Ainda em confirmação. Avisamos quando liberar.') };
    var al = A1.alert(ctx, {
      falha: { k: 'risk', t: 'Leitura falhou', x: 'Não conseguimos confirmar seus acessos agora. Nada foi perdido: seu progresso continua salvo.', b: 'Tentar de novo' },
      expirado: { k: 'warn', t: 'Acesso expirado', x: 'Base de Corrida 5K valeu até 01/09. Renovar mantém o progresso que você já tinha.' },
      expirado2: { k: 'warn', t: 'Expirado', x: 'Um programa saiu do seu acesso em 01/09. Os demais continuam normais.', b: 'Corrigir', f: function () { GO('@perfil', { id: 'carolina' }); } },
      outra: { k: 'info', t: 'Acesso por outra origem', x: 'CrossFit do zero veio de cortesia do Rafael, não de compra. A cortesia mantém o acesso.' },
      retirado: { k: 'info', t: 'Programa retirado', x: 'Mobilidade 15 minutos saiu da vitrine, mas sua compra continua valendo.', b: 'Saiba por quê', f: function () { GO('FC07'); } }
    });
    var empty = scn === 'vazio', fail = scn === 'falha';
    return {
      al: al, cur: cur, showCur: !fail,
      progs: progs, showProgs: !empty && !fail, isEmpty: empty,
      hasExt: !!ext, ext: ext || { name: '', author: '', status: '', cls: '', txt: '', btn: '', go: A1.noop },
      goExplore: function () { GO('PUB15'); }, goHelp: function () { GO('ALU11'); }
    };
  }
});
