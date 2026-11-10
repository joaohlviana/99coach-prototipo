/* O2 · H13 Usuários e perfis (hub, também OPS05) e subtelas OPS05.A–H */
(function () {
  'use strict';
  var S = O2.S;
  var ROLE_SET = {
    'Moderação': { saude: 'não', chat: 'não', fin: 'não', caps: 'casos.ler, conteudo.decidir' },
    'Privacidade': { saude: 'pedido', chat: 'não', fin: 'não', caps: 'privacidade.ler, privacidade.executar por pedido' },
    'Financeiro': { saude: 'não', chat: 'não', fin: 'sim', caps: 'financeiro.ler, repasses.conferir' },
    'Suporte': { saude: 'não', chat: 'não', fin: 'não', caps: 'suporte.visualizar (só leitura, com caso)' }
  };
  var YN = { 'não': 'não vê', sim: 'vê', pedido: 'só por pedido' };

  function cardOf(p) {
    if (p.kind === 'importado') return { eb: 'PERFIL IMPORTADO', badge: 'sem conta', bcls: 'badge--plain', name: p.name + ' · ' + p.city, sub: p.origin + ' · sem conta · sem consentimento de contato', msub: 'perfil importado · sem conta' };
    return { eb: 'CONTA ' + p.id, badge: p.state, bcls: O2.bc(p.state), name: p.name, sub: p.rolesLong + ' · ' + p.contact + ' · ativa ' + p.last, msub: 'conta · ' + p.rolesLong };
  }

  // ---------- H13 · hub ----------
  REG.screen({
    page: 'operacao', key: 'usuarios', id: 'H13', also: ['OPS05'], title: 'Usuários e perfis', mtitle: 'Usuários', nav: 'usuarios', wide: true,
    normal: 'Uso recorrente',
    scens: [['vazio', 'Primeiro uso'], ['ausencia', 'Ausência confirmada'], ['parcial', 'Indisponibilidade parcial'], ['mfa', 'MFA obrigatório'], ['revogado', 'Revogado'], ['saude', 'Dados de saúde']],
    vals: function (ctx) {
      var scn = ctx.scn, ui = ctx.ui;
      var defQ = scn === 'vazio' ? '' : scn === 'ausencia' ? 'u_99999' : 'marcos lima';
      var q = O2.uv(ctx, 'q', defQ);
      var partial = scn === 'parcial';
      var r = O2.search(q, { noImported: partial });
      var items = r.items.map(function (p) { var c = cardOf(p); c.go = function () { GO('OPS05.B', { id: p.id }); }; return c; });
      var isFirst = r.mode === 'vazio', isAbsent = !isFirst && items.length === 0;
      var absentT = r.mode === 'id' ? 'Nenhuma conta com esse ID' : r.mode === 'email' ? 'Nenhuma conta com esse e-mail' : r.mode === 'tel' ? 'Nenhuma conta com esse telefone' : 'Nenhum resultado para esse nome';
      var absentS = partial ? 'Perfis importados estão fora do ar: não conclua que não existe perfil.' : 'Também não há perfil importado correspondente.';
      var resNote = '';
      if (items.length > 1) resNote = items.length + ' resultados parecidos · confirme pelo ID antes de agir · importados não contam como usuários ativos';
      else if (items.length === 1) resNote = 'Encontrado pelo ' + ({ id: 'ID', email: 'e-mail completo', tel: 'telefone completo', nome: 'nome' }[r.mode]) + ' · abra o detalhe para ver papéis e vínculos';

      // equipe e papéis
      var team = DB.o2_equipe.filter(function (p) { return !(scn === 'revogado' && p.id === 'bia') && p.status !== 'revogado'; });
      var sel = ui.sel || '';
      var roles = team.map(function (p) {
        return { name: p.name, role: p.role, saude: p.saude, chat: p.chat, fin: p.fin, mfa: p.mfa, mfaCls: O2.bc(p.mfa), msub: p.role + ' · MFA ' + p.mfa, cls: p.id === sel ? 'is-sel' : '', goL: p.me ? 'Ver' : 'Alterar', go: function () { ctx.setUi({ sel: p.id === sel ? '' : p.id, role: '', motivo: null, motivoErr: false }); } };
      });
      var ep = sel ? O2.find('o2_equipe', sel) : null;
      var edit = { name: '', role: '', isMe: false, canEdit: false, chips: [], impact: [], motivo: '', setMotivo: null, icls: '', hasErr: false, change: null, revoke: null, caps: null, close: null };
      if (ep) {
        var nr = ui.role || ep.role, to = ROLE_SET[nr];
        var impact = nr === ep.role ? ['Escolha um papel diferente de ' + ep.role + ' para ver o impacto.'] : [
          'Capacidades: ' + ROLE_SET[ep.role].caps + ' → ' + to.caps,
          'Saúde: ' + YN[ep.saude] + ' → ' + YN[to.saude] + ' · Chat: ' + YN[ep.chat] + ' → ' + YN[to.chat] + ' · Financeiro: ' + YN[ep.fin] + ' → ' + YN[to.fin],
          'Efeito no próximo acesso de ' + ep.name + '; casos atribuídos voltam para a fila.'
        ];
        var motivo = O2.uv(ctx, 'motivo', '');
        edit = {
          name: ep.name, role: ep.role, isMe: !!ep.me, canEdit: !ep.me,
          chips: Object.keys(ROLE_SET).map(function (k) { var on = k === nr; return { label: k, on: on ? 'true' : 'false', cls: 'chip o2-chip' + (on ? ' is-on' : ''), go: function () { ctx.setUi({ role: k }); } }; }),
          impact: impact, motivo: motivo, setMotivo: O2.setter(ctx, 'motivo'), icls: ui.motivoErr ? 'is-err' : '', hasErr: !!ui.motivoErr,
          change: function () {
            if (nr === ep.role) return ctx.toast('Escolha um papel diferente de ' + ep.role + '.');
            O2.decide(ctx, { title: 'Alterar papel de ' + ep.name + '?', lines: impact, ok: 'Alterar papel', cap: 'papeis.conceder', subj: ep.id, diff: 'papel: ' + ep.role + ' → ' + nr, short: 'Papel · ' + ep.name, doneMsg: 'Papel alterado',
              done: function () { var t = ROLE_SET[nr]; ep.role = nr; ep.saude = t.saude; ep.chat = t.chat; ep.fin = t.fin; ctx.setUi({ role: '', motivo: null }); } });
          },
          revoke: function () {
            O2.decide(ctx, { title: 'Revogar o acesso de ' + ep.name + '?', lines: ['Efeito imediato: sessões abertas de ' + ep.name + ' são encerradas.', 'Casos e pedidos atribuídos voltam para a fila.', 'O histórico de ações dele continua auditável.'], ok: 'Revogar acesso', danger: true, cap: 'papeis.conceder', subj: ep.id, diff: 'acesso: ativo → revogado', short: 'Acesso revogado · ' + ep.name, doneMsg: 'Revogado · efeito imediato',
              done: function () { ep.status = 'revogado'; ctx.setUi({ sel: '', revoked: ep.name }); } });
          },
          caps: function () { GO('OPS05.C', { id: ep.id }); },
          close: function () { ctx.setUi({ sel: '' }); }
        };
      }

      var notes = [];
      if (partial) notes.push(S.note('warn', 'Perfis importados fora do ar', 'Mostrando só contas. Não conclua que não existe perfil.', [['Tentar de novo', function () { ctx.toast('Perfis importados continuam fora do ar · tente em alguns minutos.'); }]]));
      if (scn === 'revogado' || ui.revoked) notes.push(S.note('ok', 'Revogado', 'Efeito imediato' + (ui.revoked ? ': ' + ui.revoked + ' perdeu o acesso agora.' : ': Bia F. perdeu o acesso de financeiro agora.'), [['Ver histórico', function () { GO('OPS05.G', {}); }]]));
      if (scn === 'saude') notes.push(S.note('lock', 'Dados de saúde', 'Fora do papel padrão. Nenhum papel da operação vê saúde por padrão; privacidade só lê por pedido, com caso e prazo.', [['Saiba por quê', function () {
        ctx.ask({ title: 'Por que saúde fica fora do papel padrão', lines: ['Dados de saúde são sensíveis e só servem ao treinador e ao aluno.', 'A operação só lê quando um pedido de privacidade ou um caso exige, com capacidade saude.ler concedida por prazo.', 'Toda leitura gera recibo no histórico.'], ok: 'Entendi', cancel: false });
      }]], 'lock'));

      var inv = DB.o2_equipe.filter(function (p) { return p.status === 'ativo'; }).length;
      var invite = DB.o2_convite || { state: 'pendente' };
      return {
        mfaGate: scn === 'mfa' && !ui.mfaOk, open: !(scn === 'mfa' && !ui.mfaOk),
        mfaContinue: function () { ctx.setUi({ mfaOk: true }); ctx.toast('MFA confirmado · de volta à busca.'); },
        invite: function () { GO('OPS05.H'); },
        notes: notes,
        q: q, setQ: function (e) { ctx.setUi({ q: U.val(e) }); },
        res: items, hasRes: items.length > 0, isFirst: isFirst, isAbsent: isAbsent, absentT: absentT, absentS: absentS, resNote: resNote, hasResNote: !!resNote,
        decide: [
          { ic: 'ic ic--xs i-swap', t: 'Contestação · /ana-ribeiro', s: '2 contas', go: function () { GO('OPS11', { id: 'ana-ribeiro' }); } },
          { ic: 'ic ic--xs i-pause', t: 'Suspensão termina 10/11', s: 'u_8812 · publicação e contatos', go: function () { GO('OPS05.D', { id: 'u_8812' }); } },
          { ic: 'ic ic--xs i-lock', t: 'Exclusão em análise · u_9020', s: 'retenção de recibos', go: function () { GO('OPS05.E', { id: 'u_9020' }); } }
        ],
        teamN: String(inv + 6), teamMfa: (inv + 6) + ' de ' + (inv + 6), invN: invite.state === 'pendente' ? '1' : '0', invS: invite.state === 'pendente' ? 'Bia F. · aceite + MFA antes de dados reais' : 'nenhum convite aberto',
        goRoles: function () { ctx.setUi({ sel: '' }); ctx.toast('Papéis da equipe abaixo · toque numa pessoa para alterar.'); },
        goHist: function () { GO('OPS05.G', {}); },
        changes: DB.o2_auditoria.filter(function (a) { return a.kind === 'mudanca' && a.id; }).slice(0, 3).map(function (a) { return { time: a.at.split(' ')[1], t: a.short, badge: 'ok', bcls: 'badge--ok' }; }),
        roles: roles, hasEdit: !!ep, edit: edit,
        tools: [
          { ic: 'ic ic--sm i-list', t: 'Identidades', s: 'Lista por identificador permitido', go: function () { GO('OPS05.A'); } },
          { ic: 'ic ic--sm i-shield', t: 'Conceder e revogar capacidades', s: 'Caio R. · proposta aberta', go: function () { GO('OPS05.C', { id: 'caio' }); } },
          { ic: 'ic ic--sm i-lock', t: 'MFA, sessões e recuperação', s: 'Sua conta · 3 sessões', go: function () { GO('OPS05.F'); } },
          { ic: 'ic ic--sm i-clock', t: 'Histórico de acessos e mudanças', s: 'Auditoria com recibo', go: function () { GO('OPS05.G', {}); } },
          { ic: 'ic ic--sm i-eye', t: 'Acesso assistido de suporte', s: 'Somente leitura, com caso e prazo', go: function () { GO('OPS06'); } },
          { ic: 'ic ic--sm i-file', t: 'Pedidos de privacidade e retirada', s: U.plural(DB.o2_privacidade.filter(function (p) { return p.status !== 'concluído' && p.status !== 'cancelado'; }).length, 'pedido aberto', 'pedidos abertos') + ' · prazo legal', go: function () { GO('OPS07'); } }
        ]
      };
    }
  });

  // ---------- OPS05.A · Lista de identidades ----------
  O2.screen({
    key: 'ops05a', id: 'OPS05.A', title: 'Identidades', back: 'OPS05', wide: true, cap: 'identidades.ler',
    scens: [['vazio', 'Vazio real'], ['parcial', 'Resultado parcial']],
    make: function (ctx) {
      var defQ = ctx.scn === 'vazio' ? 'u_99999' : 'marcos lima';
      var q = O2.uv(ctx, 'q', defQ), f = ctx.ui.f || 'todos';
      var r = O2.search(q, { noImported: ctx.scn === 'parcial' });
      var list = r.items.filter(function (p) { return f === 'todos' || (f === 'importado' ? p.kind === 'importado' : p.roles.indexOf(f) >= 0); });
      var rows = list.map(function (p) {
        var imp = p.kind === 'importado';
        return { cells: [imp ? '—' : p.id, p.name, p.contact, imp ? 'perfil importado' : p.roles, { b: imp ? 'sem conta' : p.state }, p.origin, p.last], go: function () { GO('OPS05.B', { id: p.id }); },
          mt: p.name + (imp ? '' : ' · ' + p.id), ms: imp ? 'perfil importado · sem conta' : p.roles + ' · ' + p.state };
      });
      var notes = [];
      if (ctx.scn === 'parcial') notes.push(S.note('warn', 'Resultado parcial', 'Perfis importados fora do ar: mostrando só contas. Não conclua que não existe perfil.'));
      if (list.length > 1 && r.mode === 'nome') notes.push(S.note('info', 'Homônimos', list.length + ' resultados com nome parecido. Confirme pelo ID antes de agir.'));
      var chip = function (k, l) { return { label: l, on: f === k, chip: true, go: function () { ctx.setUi({ f: k }); } }; };
      return {
        head: { sub: 'Busca por identificador permitido' }, alvo: 'Busca: “' + (q || '—') + '”',
        acts: [S.act('Exportar', function () {
          ctx.ask({ title: 'Exportar exige outra capacidade', text: 'Sua conta tem identidades.ler, que não inclui exportar. Exportar listas de pessoas precisa de identidades.exportar, concedida por alçada 2 com finalidade.', ok: 'Pedir capacidade', onOk: function () { GO('OPS05.C', { id: 'lia' }); } });
        })],
        notes: notes,
        blocks: [
          S.search('Buscar por ID, e-mail, telefone ou nome', q, function (e) { ctx.setUi({ q: U.val(e) }); }, 'ID, e-mail ou telefone completo'),
          S.opts('Filtrar', [chip('todos', 'Todos'), chip('treinador', 'Treinador'), chip('aluno', 'Aluno'), chip('importado', 'Perfil importado')], '', { cls: 'o2-blk o2-blk--bare', title: '' }),
          r.mode === 'vazio' ? S.empty('search', 'ID, e-mail ou telefone', 'Busque por um identificador completo. Nome sozinho mostra homônimos.') :
            S.table('', ['ID', 'Nome', 'Contato', 'Papéis', 'Conta', 'Origem', 'Última atividade'], rows, { emptyT: r.mode === 'id' ? 'Nenhuma conta com esse ID' : 'Nenhum resultado', emptyS: ctx.scn === 'parcial' ? 'Importados fora do ar: confira de novo depois.' : 'Também não há perfil importado correspondente.' })
        ]
      };
    }
  });

  // ---------- OPS05.B · Detalhe da identidade ----------
  O2.screen({
    key: 'ops05b', id: 'OPS05.B', title: 'Detalhe da identidade', mtitle: 'Identidade', back: 'OPS05', cap: 'identidades.ler', testIds: ['imp_31', 'u_7731'],
    scens: [['naoativado', 'Papel não ativado'], ['reivindicado', 'Perfil reivindicado por outro'], ['encerrado', 'Vínculo encerrado'], ['indisponivel', 'Contrato indisponível']],
    make: function (ctx) {
      var p = O2.person(ctx.id || 'u_8812') || O2.person('u_8812');
      var scn = ctx.scn, ui = ctx.ui;
      if (p.kind === 'importado') {
        return {
          head: { title: p.name + ' · ' + p.city, sub: 'Perfil importado · sem conta' }, alvo: 'Perfil importado · ' + p.profile,
          acts: [S.act('Pedidos de privacidade', function () { GO('OPS07', { id: 'P-41' }); }), S.act('Ver fonte', function () { GO('OPS08.B', { id: 'fx' }); }, 'primary')],
          notes: [S.note('info', 'Perfil importado não é usuário', 'Não tem login, papéis nem contratos. Descobrir o contato não cria conta nem consentimento.')],
          blocks: [S.kv('Perfil', [['Endereço', p.profile], ['Origem', p.origin + ' · importado em ' + p.since], ['Fotos', p.photos + ' · sem licença de imagem da fonte'], ['Consentimento de contato', 'não'], ['Conta vinculada', 'nenhuma'], ['Pedido aberto', '#P-41 · retirada', 'em análise']])]
        };
      }
      var sus = O2.find('o2_suspensoes', p.id);
      var notes = [];
      if (scn === 'naoativado') notes.push(S.note('info', 'Papel não ativado', 'Treinador foi pedido e não ativado: falta concluir o cadastro profissional. Nada muda até a pessoa concluir.'));
      if (scn === 'reivindicado') notes.push(S.note('warn', 'Perfil reivindicado por outro', p.profile + ' tem uma reivindicação de outra conta em análise. Decida no caso, não aqui.', [['Abrir caso', function () { GO('OPS11', { id: 'marcos-lima' }); }]]));
      if (scn === 'encerrado') notes.push(S.note('plain', 'Vínculo encerrado', 'O acompanhamento com ' + p.coach + ' terminou em 20/10. O histórico fica com quem tem direito; não reabre por aqui.'));
      if (scn === 'indisponivel') notes.push(S.note('warn', 'Contrato indisponível', 'O financeiro não respondeu. Mostramos o último estado conhecido (26/10 · 13:40); não conclua que não existe.', [['Consultar de novo', function () { ctx.toast('Financeiro ainda indisponível · última leitura 26/10 13:40.'); }]]));
      if (sus && sus.state === 'ativa') notes.push(S.note('warn', 'Suspensão por escopo até ' + sus.until, 'Publicação e novos contatos suspensos · recibo ' + sus.rec + '.', [['Ver suspensão', function () { GO('OPS05.D', { id: p.id }); }]]));
      if (ui.fixRec) notes.push(S.rec(ui.fixRec, 'Correção registrada', p.id));
      var isT = p.roles.indexOf('treinador') >= 0;
      var roles = [];
      if (isT) roles.push(['Treinador', scn === 'naoativado' ? 'pedido, não ativado' : 'ativo · ' + p.profile, scn === 'naoativado' ? 'pendente' : 'ativo']);
      roles.push(['Aluno', scn === 'encerrado' ? 'vínculo encerrado 20/10' : 'ativo · com ' + p.coach, scn === 'encerrado' ? 'encerrado' : 'ativo']);
      var contracts = [];
      if (isT) contracts.push({ cells: ['Acompanhamento', 'aluno: ' + p.students + ' pessoas', { b: 'ativos' }, 'TRE · capacidade do treinador'], mt: 'Acompanhamento · ' + p.students + ' alunos', ms: 'Abre só com a capacidade do treinador', mb: 'ativos' });
      contracts.push({ cells: ['coaching_plan', p.coach, { b: scn === 'encerrado' ? 'encerrado' : scn === 'indisponivel' ? 'indisponível' : 'ativo' }, 'FA02'], go: function () { GO('FA02', { id: p.id }); }, mt: 'Contrato com ' + p.coach, ms: 'abrir FA02', mb: scn === 'encerrado' ? 'encerrado' : 'ativo' });
      if (isT) contracts.push({ cells: ['platform_subscription', '99Coach Pro', { b: 'teste' }, 'FA02.D'], go: function () { GO('FA02.D', { id: p.id }); }, mt: 'Assinatura 99Coach Pro', ms: 'teste · abrir FA02.D', mb: 'teste' });
      var blocks = [
        S.kv('Conta', [['E-mail', p.contact + ' · confirmado'], ['MFA', p.mfa, p.mfa === 'ativo' ? 'ok' : ''], ['Idioma', p.lang], ['Origem', p.origin + ' · desde ' + p.since]]),
        S.kv('Papéis', roles),
        S.table('Vínculo ou contrato', ['Contrato', 'Com', 'Estado', 'Abrir em'], contracts, { help: 'Treino, saúde e conversas não abrem por aqui: cada área pede a própria capacidade.' })
      ];
      if (ui.fix) {
        var fld = ui.fld || 'nome';
        blocks.push(S.opts('Corrigir cadastro', [
          { label: 'Nome exibido', on: fld === 'nome', chip: true, go: function () { ctx.setUi({ fld: 'nome' }); } },
          { label: 'Idioma', on: fld === 'idioma', chip: true, go: function () { ctx.setUi({ fld: 'idioma' }); } },
          { label: 'E-mail', on: fld === 'email', chip: true, lock: true, go: function () { ctx.toast('E-mail só a própria pessoa troca, com confirmação. Fora do escopo da operação.'); } }
        ], 'Só campos de cadastro no escopo permitido. Nada de treino, saúde ou dinheiro.'));
        blocks.push(S.field('fixv', fld === 'nome' ? 'Novo nome exibido' : 'Novo idioma', O2.uv(ctx, 'fixv', fld === 'nome' ? p.name : 'PT-BR'), O2.setter(ctx, 'fixv')));
        blocks.push(S.field('motivo', 'Motivo', O2.uv(ctx, 'motivo', ''), O2.setter(ctx, 'motivo'), { area: true, ph: 'Ex.: pedido do titular no caso #C-318', err: ui.motivoErr ? 'Escreva o motivo: ele vai para o recibo.' : '' }));
        blocks.push(S.btns([S.act('Salvar correção', function () {
          var nv = String(O2.uv(ctx, 'fixv', fld === 'nome' ? p.name : 'PT-BR')).trim();
          if (!nv) return ctx.toast('Preencha o novo valor.');
          var old = fld === 'nome' ? p.name : p.lang;
          O2.decide(ctx, { title: 'Corrigir ' + (fld === 'nome' ? 'nome exibido' : 'idioma') + '?', lines: [old + ' → ' + nv, 'A pessoa recebe aviso da correção.', 'Não muda login, contratos nem perfil público aprovado.'], ok: 'Salvar correção', cap: 'identidades.corrigir', subj: p.id, diff: (fld === 'nome' ? 'nome' : 'idioma') + ': ' + old + ' → ' + nv, short: 'Cadastro corrigido · ' + p.id, doneMsg: 'Correção salva',
            done: function (rec) { if (fld === 'nome') p.name = nv; else p.lang = nv; ctx.setUi({ fix: false, fixRec: rec.id, motivo: null, fixv: null }); } });
        }, 'primary'), S.act('Cancelar', function () { ctx.setUi({ fix: false }); }, 'ghost')]));
      }
      return {
        head: { title: p.name + ' · ' + p.id, sub: 'Conta ' + p.state + ' desde ' + p.since }, alvo: 'Conta ' + p.id,
        acts: [S.act('Histórico', function () { GO('OPS05.G', { id: p.id }); }, 'ghost'), S.act('Suspender por escopo', function () { GO('OPS05.D', { id: p.id }); }), S.act('Corrigir cadastro', function () { ctx.setUi({ fix: true }); }, 'primary')],
        notes: notes, blocks: blocks
      };
    }
  });

  // ---------- OPS05.C · Conceder e revogar capacidades ----------
  O2.screen({
    key: 'ops05c', id: 'OPS05.C', title: 'Conceder e revogar capacidades', mtitle: 'Capacidades', back: 'OPS05', cap: 'papeis.conceder · alçada 2', testIds: ['lia'],
    scens: [['naopermitida', 'Concessão não permitida'], ['autoelevacao', 'Autoelevação negada'], ['conflito', 'Conflito'], ['vencida', 'Validade vencida'], ['parcial', 'Aplicação parcial']],
    make: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn;
      var self = ctx.id === 'lia' || scn === 'autoelevacao';
      var person = self ? O2.find('o2_equipe', 'lia') : O2.find('o2_equipe', 'caio');
      var caps = DB.o2_caps.caio;
      var pend = DB.o2_caps.pending;
      var val = ui.val || 30;
      if (self) {
        return {
          head: { sub: person.name + ' · você' }, alvo: 'Operador ' + person.name,
          acts: [S.act('Ver histórico', function () { GO('OPS05.G', { id: 'lia' }); }, 'ghost')],
          notes: [S.note('risk', 'Autoelevação negada', 'Você não pode conceder capacidades a si mesma. Peça a outra pessoa com alçada 2; o pedido fica no histórico.', [['Pedir a Bia F.', function () { var rec = O2.log({ cap: 'papeis.pedir', subj: 'lia', diff: 'pedido de identidades.exportar', short: 'Pedido de capacidade · Lia' }); ctx.toast('Pedido enviado a Bia F. · recibo ' + rec.id); }, 'primary']])],
          blocks: [S.table('Suas capacidades', ['Capacidade', 'Domínio', 'Hoje'], [{ cells: ['casos.ler', 'moderação', { b: 'sim' }] }, { cells: ['conteudo.decidir', 'avaliações', { b: 'sim' }] }, { cells: ['identidades.ler', 'contas', { b: 'sim' }] }, { cells: ['identidades.exportar', 'contas', { b: 'não' }] }])]
        };
      }
      var rows = caps.map(function (c) {
        var label = c.prop === 'conceder' ? 'conceder' : c.prop === 'revogar' ? 'revogar' : 'sem mudança';
        var toggle = function () {
          if (scn === 'naopermitida' && c.cap === 'privacidade.executar') return ctx.toast('privacidade.executar exige alçada 3 nesta semana (regra de 20/10).');
          if (c.locked) return ctx.toast(c.cap + ' não está no pacote padrão: pede aprovação do encarregado de dados, fora desta tela.');
          c.prop = c.prop ? '' : (c.today ? 'revogar' : 'conceder'); ctx.refresh();
        };
        return { cells: [c.cap, c.dom, { b: c.today ? 'sim' : 'não' }, { btn: label, go: toggle, cls: 'btn btn--sm ' + (c.prop ? 'btn--primary' : 'btn--outline') }, c.prop === 'conceder' ? val + ' dias' : '—'],
          mt: c.cap, ms: (c.today ? 'sim' : 'não') + ' → ' + label + (c.prop === 'conceder' ? ' · ' + val + ' dias' : '') + (c.locked ? ' · fora do pacote padrão' : '') };
      });
      var changes = caps.filter(function (c) { return c.prop; });
      var lines = changes.map(function (c) { return c.cap + ': ' + (c.today ? 'sim' : 'não') + ' → ' + (c.prop === 'conceder' ? 'sim por ' + val + ' dias' : 'não'); });
      var notes = [];
      if (scn === 'naopermitida') notes.push(S.note('risk', 'Concessão não permitida', 'privacidade.executar pede alçada 3 nesta semana. Você tem alçada 2: dá para propor, não para aprovar.'));
      if (scn === 'conflito') notes.push(S.note('warn', 'Conflito', 'Bia F. abriu outra proposta para Caio às 13:50 (revogar privacidade.ler). Resolva uma antes de enviar a outra.', [['Ver proposta de Bia', function () { GO('OPS05.G', { id: 'caio' }); }]]));
      if (scn === 'vencida') notes.push(S.note('warn', 'Validade vencida', 'A concessão temporária de privacidade.executar venceu em 25/10. Renovar é uma nova concessão, com motivo.'));
      if (scn === 'parcial') notes.push(S.note('warn', 'Aplicação parcial', 'privacidade.executar foi aplicada; o registro no serviço de exportação falhou. Caio ainda não executa exportações.', [['Consultar situação', function () { ctx.toast('Exportação ainda sem a capacidade · nova tentativa às 14:30.'); }]]));
      if (pend) notes.push(S.note('info', 'Aguardando confirmação da alçada 2', pend.text + ' · recibo ' + pend.rec + '. Outra pessoa da alçada confirma; você não confirma a própria proposta.', [['Ver histórico', function () { GO('OPS05.G', { id: 'caio' }); }]]));
      notes.push(S.note('lock', 'Sem autoelevação', 'Você não pode conceder a si mesma; capacidades de saúde e dinheiro não estão no pacote padrão.'));
      return {
        head: { sub: person.name + ' · equipe de privacidade' }, alvo: 'Operador ' + person.name,
        acts: [S.act('Ver histórico', function () { GO('OPS05.G', { id: 'caio' }); }, 'ghost'), S.act('Enviar para confirmação', function () {
          if (scn === 'conflito') return ctx.toast('Resolva a proposta de Bia F. antes de enviar a sua.');
          if (!changes.length) return ctx.toast('Nada a enviar: marque conceder ou revogar em alguma capacidade.');
          O2.decide(ctx, { title: 'Enviar para confirmação?', lines: lines.concat(['Efeito só depois da confirmação de outra pessoa da alçada 2.', 'Caio recebe aviso com o motivo e a validade.']), ok: 'Enviar para confirmação', cap: 'papeis.conceder', subj: 'caio', diff: lines.join(' · '), short: 'Proposta · Caio', doneMsg: 'Proposta enviada',
            done: function (rec) { DB.o2_caps.pending = { text: lines.join(' · '), rec: rec.id }; ctx.setUi({ motivo: null }); } });
        }, 'primary')],
        notes: notes,
        blocks: [
          S.table('Capacidades por domínio', ['Capacidade', 'Domínio', 'Hoje', 'Proposta', 'Validade'], rows, { help: 'Toque em “sem mudança” para propor. Não existe opção “acesso a tudo”.' }),
          S.opts('Validade da concessão', [7, 30, 90].map(function (d) { return { label: d + ' dias', on: val === d, chip: true, go: function () { ctx.setUi({ val: d }); } }; })),
          S.field('motivo', 'Motivo', O2.uv(ctx, 'motivo', ''), O2.setter(ctx, 'motivo'), { area: true, ph: 'Ex.: Caio vai executar exportações da fila de privacidade', err: ui.motivoErr ? 'Escreva o motivo: ele vai para o recibo.' : '' })
        ]
      };
    }
  });

  // ---------- OPS05.D · Suspensão e retomada por escopo ----------
  var SCOPES = [['login', 'Login', 'Login'], ['pub', 'Publicação do perfil', 'Publicação'], ['contatos', 'Novos contatos', 'Contatos'], ['vendas', 'Novas vendas', 'Vendas']];
  O2.screen({
    key: 'ops05d', id: 'OPS05.D', title: 'Suspender por escopo', back: 'OPS05', cap: 'contas.suspender', form: false,
    scens: [['parcial', 'Suspensão parcial'], ['recurso', 'Recurso aberto'], ['condicionado', 'Retorno condicionado'], ['externa', 'Restrição financeira externa'], ['desconhecido', 'Resultado desconhecido']],
    make: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn;
      var p = O2.person(ctx.id || 'u_8812') || O2.person('u_8812');
      var sus = O2.find('o2_suspensoes', p.id);
      var sel = ui.sc || ['pub', 'contatos'];
      var days = ui.days || 15;
      var until = { 7: '02/11', 15: '10/11', 30: '25/11' }[days];
      var unk = scn === 'desconhecido' ? O2.unknown(ctx, 'suspender publicação', 'a suspensão foi aplicada às 09:40 · recibo R-310-2. Nada a repetir.') : null;
      var active = sus && sus.state === 'ativa';
      var notes = [];
      if (unk) notes.push(unk.note);
      if (active && !unk) notes.push(S.note('warn', 'Suspensão ativa até ' + sus.until, sus.scopes.map(function (k) { return SCOPES.filter(function (s) { return s[0] === k; })[0][2]; }).join(' e ') + ' suspensos · ' + sus.reason + ' · recibo ' + sus.rec + '.'));
      if (scn === 'parcial') notes.push(S.note('warn', 'Suspensão parcial', 'Publicação suspensa; o bloqueio de novos contatos não confirmou no chat. Contatos ainda podem chegar.', [['Consultar situação', function () { ctx.toast('Chat confirmou às 14:04 · contatos bloqueados.'); }]]));
      if (scn === 'recurso') notes.push(S.note('info', 'Recurso aberto', 'Marcos contestou em 25/10 (#C-310-R). A suspensão segue até a decisão; retomar antes encerra o recurso.'));
      if (scn === 'condicionado') notes.push(S.note('info', 'Retorno condicionado', 'Retoma em 10/11 se as fotos denunciadas forem trocadas. Hoje: 1 de 3 trocadas.'));
      if (scn === 'externa') notes.push(S.note('lock', 'Restrição financeira externa', 'Vendas estão bloqueadas pelo processador de pagamento, não por nós. Retomar aqui não libera vendas.', [['Ver no financeiro', function () { GO('FA02', { id: p.id }); }]]));
      if (ui.rec) notes.push(S.rec(ui.rec, ui.recT, p.id));
      var keep = ['acesso dos ' + p.students + ' alunos ao que já compraram', 'recebíveis', 'assinatura 99Coach'];
      if (sel.indexOf('login') < 0) keep.unshift('Login');
      var effects = SCOPES.filter(function (s) { return sel.indexOf(s[0]) >= 0; }).map(function (s) { return s[1] + ' suspenso até ' + until; });
      var mainL = sel.length === 1 && sel[0] === 'pub' || (sel.indexOf('pub') >= 0 && sel.indexOf('login') < 0) ? 'Suspender publicação' : 'Suspender selecionados';
      var doSuspend = function () {
        if (unk && unk.block) return O2.blocked(ctx);
        if (!sel.length) return ctx.toast('Escolha ao menos um escopo.');
        O2.decide(ctx, { def: 'Denúncias confirmadas · #C-310', title: 'Suspender ' + p.name + '?', lines: effects.concat(['Fica igual: ' + keep.join(', ') + '.', 'A suspensão não cancela contratos.']), ok: mainL, cap: 'contas.suspender', caso: '#C-310', subj: p.id, diff: 'suspensão: ' + sel.join(', ') + ' até ' + until, short: 'Suspensão · ' + p.id, doneMsg: 'Suspensão aplicada',
          done: function (rec) {
            var m = O2.uv(ctx, 'motivo', 'Denúncias confirmadas · #C-310');
            if (sus) { sus.scopes = sel.slice(); sus.until = until; sus.days = days; sus.state = 'ativa'; sus.rec = rec.id; sus.reason = m; }
            else DB.o2_suspensoes.push({ id: p.id, scopes: sel.slice(), until: until, days: days, state: 'ativa', reason: m, rec: rec.id, at: '26/10 ' + U.now() });
            ctx.setUi({ rec: rec.id, recT: 'Suspensão aplicada' });
          } });
      };
      var doResume = function () {
        if (unk && unk.block) return O2.blocked(ctx);
        O2.decide(ctx, { fkey: 'rmotivo', title: 'Retomar ' + p.name + '?', lines: ['Publicação e contatos voltam agora.', scn === 'recurso' ? 'O recurso #C-310-R é encerrado como prejudicado.' : 'O caso #C-310 fica registrado.', scn === 'externa' ? 'Vendas seguem bloqueadas pelo processador.' : 'Nada muda em contratos.'], ok: 'Retomar', cap: 'contas.suspender', caso: '#C-310', subj: p.id, diff: 'suspensão: ativa → retomada', short: 'Retomada · ' + p.id, doneMsg: 'Conta retomada',
          done: function (rec) { if (sus) sus.state = 'retomada'; ctx.setUi({ rec: rec.id, recT: 'Retomada registrada' }); } });
      };
      return {
        head: { sub: p.id + ' · ' + p.name }, alvo: 'Conta ' + p.id,
        acts: [S.act('Pré-visualizar efeitos', function () { ctx.ask({ title: 'Efeitos da suspensão', lines: effects.length ? effects.concat(['Fica igual: ' + keep.join(', ') + '.']) : ['Nenhum escopo escolhido.'], ok: 'Fechar', cancel: false }); }),
          active ? S.act('Retomar', doResume) : null,
          S.act(mainL, doSuspend, 'primary', unk && unk.block)],
        notes: notes,
        blocks: [
          S.field('motivo', 'Motivo', O2.uv(ctx, 'motivo', 'Denúncias confirmadas · #C-310'), O2.setter(ctx, 'motivo'), { err: ui.motivoErr ? 'Escreva o motivo: ele vai para o recibo.' : '' }),
          S.opts('Escopo', SCOPES.map(function (s) { var on = sel.indexOf(s[0]) >= 0; return { label: s[1], on: on, go: function () { ctx.setUi({ sc: on ? sel.filter(function (x) { return x !== s[0]; }) : sel.concat([s[0]]) }); } }; }), sel.indexOf('login') >= 0 ? 'Suspender login bloqueia a conta inteira. Use só se a pessoa não pode entrar de jeito nenhum.' : 'Escolha só o necessário. Não existe “bloquear tudo” por aqui.', { cls: 'o2-blk o2-blk--bare' }),
          S.opts('Duração', [[7, '7 dias · até 02/11'], [15, '15 dias · até 10/11'], [30, '30 dias · até 25/11']].map(function (d) { return { label: d[1], on: days === d[0], chip: true, go: function () { ctx.setUi({ days: d[0] }); } }; }), '', { cls: 'o2-blk o2-blk--bare' }),
          S.alert('info', 'Fica igual', keep.join(', ') + '. A suspensão não cancela contratos.'),
          active ? S.field('rmotivo', 'Motivo da retomada', O2.uv(ctx, 'rmotivo', ''), O2.setter(ctx, 'rmotivo'), { ph: 'Ex.: fotos trocadas, conferido no caso #C-310', err: ui.rmotivoErr ? 'Escreva o motivo da retomada.' : '' }) : null
        ]
      };
    }
  });

  // ---------- OPS05.E · Desativação e exclusão como processo ----------
  O2.screen({
    key: 'ops05e', id: 'OPS05.E', title: 'Desativação e exclusão', mtitle: 'Exclusão', back: 'OPS05', cap: 'privacidade.ler',
    scens: [['retencao', 'Retenção aplicável'], ['exportacao', 'Exportação pendente'], ['parcial', 'Exclusão parcial'], ['conflito', 'Conflito de titularidade']],
    make: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn;
      var ped = O2.find('o2_privacidade', 'P-50');
      var p = O2.person(ped.acct);
      var canceled = ped.status === 'cancelado';
      var notes = [];
      if (scn === 'retencao') notes.push(S.note('info', 'Retenção aplicável', 'Recibos de compra ficam 5 anos por obrigação fiscal, sem uso para outra finalidade. O resto segue para exclusão.'));
      if (scn === 'exportacao') notes.push(S.note('warn', 'Exportação pendente', 'A exportação oferecida em 24/10 ainda não foi baixada. A exclusão espera o prazo de 7 dias ou a recusa do titular.'));
      if (scn === 'parcial') notes.push(S.note('warn', 'Exclusão parcial', 'Conta e treinos excluídos; anexos em armazenamento externo seguem na fila (12 de 30). Não diga ao titular que terminou.'));
      if (scn === 'conflito') notes.push(S.note('risk', 'Conflito de titularidade', 'Outra conta diz ser dona do e-mail. A exclusão para até o caso #C-320 decidir.', [['Abrir caso', function () { GO('OPS02', { id: 'C-320' }); }]]));
      if (canceled) notes.push(S.rec(ped.rec, 'Pedido cancelado · a conta segue ativa', p.id));
      var steps = canceled ? [['Pedido cancelado', 'agora', 'Confirmado']] : [
        ['Exportação oferecida', '24/10', scn === 'exportacao' ? 'Pendente' : 'Confirmado'],
        ['Revisão de retenção', 'Caio', 'Em andamento'],
        ['Exclusão', 'após revisão', scn === 'parcial' ? 'Em andamento' : 'Na fila']
      ];
      return {
        head: { sub: 'Pedido #P-50 · ' + p.id }, alvo: 'Conta ' + p.id,
        acts: [S.act('Abrir em OPS07', function () { GO('OPS07.B', { id: 'P-50' }); }, 'primary')],
        notes: notes,
        blocks: [
          S.kv('', [['Solicitante', 'titular · ' + ped.proof], ['Escopo', ped.scope], ['Retém', ped.keep], ['De outros titulares', ped.third]]),
          S.steps('Andamento', steps),
          S.text('Desativar para o uso; excluir apaga o que não tem retenção. Não existe “apagar tudo” direto na tabela.', 'Desativar não é apagar'),
          canceled ? null : S.field('motivo', 'Cancelar pedido · motivo', O2.uv(ctx, 'motivo', ''), O2.setter(ctx, 'motivo'), { area: true, card: true, title: 'Cancelar pedido', ph: 'Ex.: titular desistiu por e-mail em 26/10', err: ui.motivoErr ? 'Escreva o motivo: ele vai para o recibo.' : '' }),
          canceled ? null : S.btns([S.act('Cancelar pedido', function () {
            if (scn === 'parcial') return ctx.toast('A exclusão já começou: a política não permite cancelar agora.');
            O2.decide(ctx, { title: 'Cancelar o pedido #P-50?', lines: ['A conta ' + p.id + ' segue ativa.', 'A exportação de 24/10 continua disponível ao titular até vencer.', 'O titular recebe aviso com o motivo.'], ok: 'Cancelar pedido', danger: true, cap: 'privacidade.decidir', caso: '#P-50', subj: p.id, diff: 'pedido de exclusão: em análise → cancelado', short: 'Exclusão cancelada · #P-50', doneMsg: 'Pedido cancelado',
              done: function (rec) { ped.status = 'cancelado'; ped.rec = rec.id; } });
          }, 'danger')])
        ]
      };
    }
  });

  // ---------- OPS05.F · MFA, sessões e recuperação ----------
  O2.screen({
    key: 'ops05f', id: 'OPS05.F', title: 'MFA e sessões', back: 'OPS05', cap: 'própria conta', alvo: 'Lia M. · operadora',
    scens: [['revogada', 'Sessão atual revogada'], ['expirado', 'Desafio expirado'], ['recuperacao', 'Recuperação em revisão'], ['limite', 'Muitas tentativas (429)']],
    make: function (ctx) {
      var scn = ctx.scn;
      if (scn === 'revogada') return { head: { sub: 'Sua conta de operação' }, blocks: [S.empty('lock', 'Esta sessão foi encerrada', 'Alguém revogou a sessão atual às 14:05. Entre de novo com MFA: sua tarefa fica guardada para quando voltar.', 'Entrar de novo', function () { ctx.scenario(''); ctx.toast('Sessão nova · MFA confirmado. De volta à tarefa.'); })] };
      var notes = [];
      if (scn === 'expirado') notes.push(S.note('warn', 'Desafio expirado', 'O código do autenticador vale 30 segundos. Peça outro desafio; nada foi alterado.', [['Novo desafio', function () { GO('ACC12'); }, 'primary']]));
      if (scn === 'recuperacao') notes.push(S.note('info', 'Recuperação em revisão', 'Seu pedido de recuperação de MFA (25/10) está com Caio R. Até lá, ações sensíveis ficam bloqueadas.'));
      if (scn === 'limite') notes.push(S.note('risk', 'Muitas tentativas', 'Limite de tentativas atingido (429). Tente de novo em 5 minutos; não repita agora.'));
      if (ctx.ui.rec) notes.push(S.rec(ctx.ui.rec, ctx.ui.recT, 'lia'));
      var ses = DB.o2_sessoes.filter(function (s) { return s.state === 'ativa'; });
      var revoke = function (s) {
        return function () {
          if (scn === 'limite') return ctx.toast('Aguarde 5 minutos antes de tentar de novo.');
          ctx.ask({ title: 'Revogar ' + s.dev + '?', lines: ['Encerra a sessão nesse dispositivo agora.', s.unknown ? 'Dispositivo desconhecido: troque a senha depois, pela ACC12.' : 'Quem estiver nele precisa entrar de novo com MFA.', 'Esta sessão (Chrome · macOS) continua.'], ok: 'Revogar sessão', danger: true,
            onOk: function () { var rec = O2.log({ cap: 'própria conta', subj: 'lia', diff: 'sessão ' + s.dev + ' revogada', short: 'Sessão revogada' }); s.state = 'revogada'; ctx.setUi({ rec: rec.id, recT: 'Sessão revogada · ' + s.dev }); ctx.toast('Sessão revogada · recibo ' + rec.id); } });
        };
      };
      var rows = ses.map(function (s) {
        return { cells: [s.dev + (s.current ? ' · esta sessão' : ''), s.start, s.act, s.current ? { b: 'atual' } : s.unknown ? { b: 'desconhecido', cls: 'badge--warn' } : '', s.current ? '' : { btn: 'Revogar', go: revoke(s) }],
          mt: s.dev + (s.current ? ' · esta sessão' : ''), ms: s.current ? 'agora' : (s.unknown ? 'desconhecido · ' : '') + s.start.split(' ')[1], mb: s.current ? 'atual' : s.unknown ? 'desconhecido' : '', mbcls: s.unknown ? 'badge--warn' : '' };
      });
      var others = ses.filter(function (s) { return !s.current; });
      return {
        head: { sub: 'Sua conta de operação' },
        acts: [S.act('Revogar todas as outras', function () {
          if (!others.length) return ctx.toast('Nenhuma outra sessão aberta.');
          ctx.ask({ title: 'Revogar ' + U.plural(others.length, 'outra sessão', 'outras sessões') + '?', lines: others.map(function (s) { return s.dev + ' · início ' + s.start; }).concat(['Esta sessão continua.']), ok: 'Revogar todas', danger: true,
            onOk: function () { var rec = O2.log({ cap: 'própria conta', subj: 'lia', diff: others.length + ' sessões revogadas', short: 'Sessões revogadas' }); others.forEach(function (s) { s.state = 'revogada'; }); ctx.setUi({ rec: rec.id, recT: 'Outras sessões revogadas' }); ctx.toast('Outras sessões revogadas · recibo ' + rec.id); } });
        })],
        notes: notes,
        blocks: [
          S.kv('MFA ativo', [['Método', 'App autenticador · desde 02/10', 'ativo'], ['Códigos de recuperação', 'guardados por você · nunca exibidos aqui']], { help: 'Configurar, desafiar e recuperar usam o mesmo componente da ACC12.' }),
          S.btns([S.act('Abrir segurança (ACC12)', function () { GO('ACC12'); })]),
          S.table('Sessões', ['Dispositivo', 'Início', 'Atividade', 'Situação', ''], rows)
        ]
      };
    }
  });

  // ---------- OPS05.G · Histórico de acessos e mudanças ----------
  O2.screen({
    key: 'ops05g', id: 'OPS05.G', title: 'Histórico de acessos', mtitle: 'Histórico', back: 'OPS05', wide: true, cap: 'auditoria.ler', testIds: ['u_8812'],
    scens: [['atrasado', 'Log parcial ou atrasado'], ['indisponivel', 'Evento indisponível'], ['restrito', 'Campo restrito'], ['expirada', 'Exportação expirada']],
    make: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn, subj = ctx.id || '';
      var d30 = ui.d30 !== false, kind = ui.kind || '';
      var evs = DB.o2_auditoria.filter(function (a) { return (!subj || a.subj === subj) && (!kind || a.kind === kind); });
      var rows = evs.map(function (a, i) {
        var restricted = scn === 'restrito' && a.cap === 'privacidade.ler';
        return { cells: [a.at, a.actor, a.cap, a.caso, restricted ? 'campo restrito' : a.diff, a.id || '—'], sel: ui.open === i, go: function () { ctx.setUi({ open: ui.open === i ? -1 : i }); },
          goL: ui.open === i ? 'Fechar' : 'Abrir', mt: a.at.split(' ')[0] + ' · ' + a.actor, ms: (restricted ? 'campo restrito' : a.short) + (a.caso !== '—' ? ' · ' + a.caso : '') };
      });
      var notes = [];
      if (scn === 'atrasado') notes.push(S.note('warn', 'Log atrasado', 'Eventos depois de 13:40 ainda não chegaram. Não conclua que não houve acesso nesse intervalo.', [['Consultar de novo', function () { ctx.toast('Log atualizado até 13:52 · ainda atrasado.'); }]]));
      if (scn === 'indisponivel') notes.push(S.note('risk', 'Evento indisponível', 'O detalhe de R-288-4 não carregou. O resumo continua valendo; tente abrir de novo.'));
      if (scn === 'restrito') notes.push(S.note('lock', 'Campo restrito', 'Leituras de privacidade mostram só que houve acesso. O conteúdo exige privacidade.ler.'));
      if (scn === 'expirada') notes.push(S.note('warn', 'Exportação expirada', 'O arquivo exportado em 18/10 venceu. Gere outro no escopo atual.'));
      var ev = typeof ui.open === 'number' && ui.open >= 0 ? evs[ui.open] : null;
      var chip = function (l, on, go) { return { label: l, on: on, chip: true, go: go }; };
      return {
        head: { sub: subj ? 'Eventos da conta ' + subj : 'Eventos da operação' }, alvo: subj ? 'Sujeito ' + subj : 'Toda a operação',
        acts: [S.act('Exportar no escopo', function () {
          ctx.ask({ title: 'Exportar ' + U.plural(evs.length, 'evento', 'eventos') + '?', lines: ['Escopo: ' + (subj || 'toda a operação') + (d30 ? ' · últimos 30 dias' : '') + (kind ? ' · ' + (kind === 'mudanca' ? 'só mudanças' : 'só acessos') : ''), 'Campos sensíveis saem reduzidos.', 'O arquivo vence em 7 dias e a exportação fica no histórico.'], ok: 'Exportar',
            onOk: function () { var rec = O2.log({ cap: 'auditoria.exportar', subj: subj, diff: 'exportação de ' + evs.length + ' eventos', short: 'Exportação de histórico', kind: 'acesso' }); ctx.toast('Exportação pronta · vence 02/11 · recibo ' + rec.id); } });
        })],
        notes: notes,
        blocks: [
          S.opts('Filtros', [
            chip('Últimos 30 dias', d30, function () { ctx.setUi({ d30: !d30 }); }),
            chip('Só mudanças', kind === 'mudanca', function () { ctx.setUi({ kind: kind === 'mudanca' ? '' : 'mudanca', open: -1 }); }),
            chip('Só acessos', kind === 'acesso', function () { ctx.setUi({ kind: kind === 'acesso' ? '' : 'acesso', open: -1 }); }),
            (kind || !d30) ? chip('Limpar filtros', false, function () { ctx.setUi({ kind: '', d30: true, open: -1 }); }) : null
          ], '', { cls: 'o2-blk o2-blk--bare', title: '' }),
          S.table('', ['Quando', 'Ator', 'Capacidade', 'Caso', 'Diferença', 'Recibo'], rows, { emptyT: 'Nenhum evento com esses filtros', emptyS: 'Limpe os filtros para ver tudo.', help: 'Campos sensíveis aparecem reduzidos. Log atualizado até ' + (scn === 'atrasado' ? '13:40' : '14:00') + '.' }),
          ev ? (scn === 'indisponivel' && ev.id === 'R-288-4' ? S.empty('alert', 'Evento indisponível', 'Tente abrir de novo em instantes.', 'Tentar de novo', function () { ctx.toast('Ainda indisponível.'); }) :
            S.kv('Evento ' + (ev.id || 'sem recibo'), [['Ator → ação → alvo', ev.actor + ' → ' + ev.short + ' → ' + (ev.subj || '—')], ['Capacidade', ev.cap], ['Finalidade ou caso', ev.caso], ['Diferença', scn === 'restrito' && ev.cap === 'privacidade.ler' ? 'campo restrito' : ev.diff], ['Motivo', ev.motivo || '—'], ['Momento', ev.at]])) : null
        ]
      };
    }
  });

  // ---------- OPS05.H · Convite e acesso da equipe administrativa ----------
  DB.seed('o2_convite', { email: 'bia.f@99coach.com', caps: ['casos.ler', 'conteudo.decidir'], state: 'pendente', rec: 'R-299-1', sentAt: '25/10 17:20' });
  var INV_CAPS = [['casos.ler', 'moderação', false], ['conteudo.decidir', 'avaliações', false], ['identidades.ler', 'contas', false], ['saude.ler', 'treinos', true], ['financeiro.ler', 'financeiro', true]];
  var INV_STATES = [['rascunho', 'Rascunho'], ['pendente', 'Pendente'], ['aceito', 'Aceito · MFA configurado'], ['encerrado', 'Expirado / revogado']];
  O2.screen({
    key: 'ops05h', id: 'OPS05.H', title: 'Convidar para a equipe', mtitle: 'Convite', back: 'OPS05', cap: 'equipe.convidar',
    scens: [['expirado', 'Expirado'], ['contaerrada', 'Conta errada'], ['insuficiente', 'Papel insuficiente'], ['retorno', 'Retorno perdido'], ['aceito', 'Aceito sem MFA']],
    make: function (ctx) {
      var ui = ctx.ui, scn = ctx.scn, inv = DB.o2_convite;
      var st = scn === 'expirado' ? 'encerrado' : scn === 'aceito' ? 'aceito' : inv.state;
      var email = O2.uv(ctx, 'email', inv.email);
      var caps = ui.caps || inv.caps;
      var notes = [S.note('plain', 'Protótipo', 'O envio é desenhado; nada é enviado nesta entrega.')];
      if (scn === 'expirado') notes.push(S.note('warn', 'Convite expirado', 'O convite de 25/10 venceu sem aceite. Reemita com a mesma proposta ou revise as capacidades.'));
      if (scn === 'contaerrada') notes.push(S.note('risk', 'Conta errada', 'O aceite veio de bia.fontes@gmail.com, não do e-mail convidado. Nada foi liberado; reemita para o e-mail certo.'));
      if (scn === 'insuficiente') notes.push(S.note('lock', 'Papel insuficiente', 'Convidar para financeiro pede equipe.convidar no domínio financeiro. Você convida só para moderação.'));
      if (scn === 'retorno') notes.push(S.note('info', 'Retorno perdido', 'Bia aceitou, mas a volta do MFA não chegou. Consulte antes de reemitir: o convite pode já estar concluído.', [['Consultar situação', function () { ctx.toast('Aceito às 10:14 · MFA configurado às 10:16. Nada a reemitir.'); }, 'primary']]));
      if (scn === 'aceito') notes.push(S.note('warn', 'Aceito, MFA pendente', 'Convite aceito não equivale a MFA concluído. Sem MFA, Bia não vê dados reais.'));
      if (ui.rec) notes.push(S.rec(ui.rec, ui.recT, 'bia'));
      var rows = INV_CAPS.map(function (c) {
        var on = caps.indexOf(c[0]) >= 0;
        return { cells: [c[0], c[1], c[2] ? { b: 'fora do pacote', cls: 'badge--plain' } : { btn: on ? 'incluída' : 'incluir', cls: 'btn btn--sm ' + (on ? 'btn--primary' : 'btn--outline'), go: function () {
          if (st !== 'rascunho' && st !== 'encerrado') return ctx.toast('Convite já enviado: revogue e reemita para mudar capacidades.');
          ctx.setUi({ caps: on ? caps.filter(function (x) { return x !== c[0]; }) : caps.concat([c[0]]) });
        } }], mt: c[0], ms: c[1] + (c[2] ? ' · fora do pacote padrão' : on ? ' · incluída' : '') };
      });
      var send = function () {
        if (scn === 'insuficiente') return ctx.toast('Sem equipe.convidar para esse domínio.');
        if (!/^[^@\s]+@99coach\.com$/.test(String(email).trim())) return ctx.setUi({ emailErr: true });
        if (!caps.length) return ctx.toast('Inclua ao menos uma capacidade.');
        O2.decide(ctx, { title: 'Enviar convite (protótipo)?', lines: ['Para: ' + email, 'Capacidades: ' + caps.join(', ') + ' · nada de saúde ou dinheiro.', 'Validade: parâmetro a aprovar.', 'Antes de dados reais: aceite autenticado + MFA.', 'Protótipo: nada é enviado de verdade.'], ok: 'Enviar convite', cap: 'equipe.convidar', subj: 'bia', diff: 'convite: ' + caps.join(', '), short: 'Convite · ' + email, doneMsg: 'Convite registrado (protótipo)',
          done: function (rec) { inv.state = 'pendente'; inv.caps = caps.slice(); inv.email = email; inv.rec = rec.id; ctx.setUi({ rec: rec.id, recT: 'Convite pendente', motivo: null }); } });
      };
      var revoke = function () {
        O2.decide(ctx, { title: 'Revogar o convite?', lines: ['O link deixa de valer agora.', 'Nenhum acesso foi concedido ainda.'], ok: 'Revogar convite', danger: true, cap: 'equipe.convidar', subj: 'bia', diff: 'convite: pendente → revogado', short: 'Convite revogado', doneMsg: 'Convite revogado',
          done: function (rec) { inv.state = 'encerrado'; ctx.setUi({ rec: rec.id, recT: 'Convite revogado' }); } });
      };
      var acts = [S.act('Salvar rascunho', function () { inv.state = 'rascunho'; inv.caps = caps.slice(); inv.email = email; ctx.toast('Rascunho salvo · nada foi enviado.'); })];
      if (st === 'pendente') acts.push(S.act('Revogar convite', revoke, 'danger'));
      acts.push(S.act(st === 'pendente' ? 'Reemitir · protótipo' : 'Enviar convite · protótipo', send, 'primary'));
      return {
        head: { sub: 'Novo operador de moderação' }, alvo: email,
        acts: acts, notes: notes,
        blocks: [
          S.field('email', 'E-mail', email, O2.setter(ctx, 'email'), { err: ui.emailErr ? 'Use um e-mail @99coach.com: convites da operação não vão para e-mail pessoal.' : '' }),
          S.table('Capacidades propostas', ['Capacidade', 'Escopo', 'Proposta'], rows, { help: 'Sem autoelevação e sem “acesso a tudo”. Saúde e dinheiro ficam fora do pacote padrão.' }),
          S.kv('', [['Validade', '[parâmetro a aprovar]'], ['Antes de dados reais', 'aceite autenticado + MFA'], ['Convidante', 'Lia M. · equipe.convidar']]),
          S.field('motivo', 'Motivo do convite', O2.uv(ctx, 'motivo', 'Reforço da moderação de avaliações'), O2.setter(ctx, 'motivo'), { err: ui.motivoErr ? 'Escreva o motivo: ele vai para o recibo.' : '' }),
          S.steps('Estados do convite', INV_STATES.map(function (s) { return [s[1], s[0] === 'pendente' && st === 'pendente' ? 'desde ' + inv.sentAt : '', s[0] === st ? 'Atual' : 'Na fila']; }))
        ]
      };
    }
  });
})();
