/* O5 · Operação financeira (Lia Moura). Dados o5_*, utilitários window.O5 e telas H14 (hub), FA01.A, FA01.B, FA01.C.
   Tudo é demonstração: nenhum dinheiro real é movimentado. Valores sempre com moeda, data e fonte. */
(function () {
  'use strict';
  var DB = window.DB, U = window.U;
  var AT = '26/10 · 14:02 BRT';

  // ---------- dados ----------
  // vendedores (treinadores) com saldo no razão da 99Coach
  DB.seed('o5_vendedores', [
    { id: 'rafael', name: 'Rafael Lima', short: 'Rafael L.', acct: 'ac_31', sub: 'sb2190', bank: 'conta ••21 · Banco 260', disponivel: 1240.5, aReceber: 815.2, payoutDone: false },
    { id: 'carolina', name: 'Carolina Albuquerque', short: 'Carolina A.', acct: 'ac_12', sub: 'sb2201', bank: 'conta ••07 · Banco 341', disponivel: 612, aReceber: 140, payoutDone: false }
  ]);
  // pedidos: cada dimensão (pagamento, acesso, repasse) tem estado próprio; nunca um selo único "pago"
  function att(t, d, st) { return { t: t, d: d, st: st }; }
  DB.seed('o5_pedidos', [
    { id: 'pd10442', ref: 'PD-10442', fam: 'coaching_plan', product: 'Sessão presencial', ver: 'v2', offer: 'o2', seller: 'rafael', payer: 'Bruno L.', payerAcct: 'al_14', recipient: 'Bruno L.', cur: 'BRL', amount: 80, disc: 0, proc: 0.79, method: 'Pix', channel: 'web · Pix', policy: 'cancelamento v2 · aceite 26/10 10:57', at: '26/10 11:02', period: 'sessão de qua 28/10 07:00', pay: 'pago', access: 'pendente', resp: 'Lia', issue: 'pago sem acesso', age: '3 h', div: 'dv31', dispute: '', bank: { st: 'não iniciado', d: 'aguarda liberação do acesso' },
      items: [{ n: 'Sessão presencial · 28/10 07:00', paid: 80, refunded: 0, pending: 0 }],
      attempts: [att('Tentativa 1 · cartão', 'recusado 10:58', 'Falhou'), att('Tentativa 2 · Pix', 'pago 11:02 · evento e_88', 'Confirmado'), att('Evento duplicado e_88b', 'deduplicado 11:02', 'Não se aplica'), att('Direito de acesso', 'concessão não confirmada · 11:03', 'Desconhecido'), att('Vínculo e agendamento', 'após acesso', 'Na fila')],
      accessEffect: 'a sessão de 28/10 continua; nada mais é afetado' },
    { id: 'pd10447', ref: 'PD-10447', fam: 'training_program', product: 'Mobilidade 15 minutos', ver: 'v2', offer: '', seller: 'rafael', payer: 'Marina S.', payerAcct: 'al_88', recipient: 'Marina S.', cur: 'BRL', amount: 47, disc: 0, proc: 1.5, method: 'cartão final 1180', channel: 'web · cartão', policy: 'programa v2 · aceite 26/10 12:54', at: '26/10 12:55', period: 'acesso vitalício ao programa', pay: 'pago', access: 'pendente', resp: '—', issue: 'pago sem acesso', age: '1 h', div: 'dv32', dispute: '', bank: { st: 'não iniciado', d: 'aguarda liberação do acesso' },
      items: [{ n: 'Mobilidade 15 minutos · 4 semanas', paid: 47, refunded: 0, pending: 0 }],
      attempts: [att('Tentativa 1 · cartão', 'aprovado 12:55 · evento e_93', 'Confirmado'), att('Direito de acesso', 'concessão não confirmada · 12:55', 'Desconhecido')],
      accessEffect: 'o acesso ao programa encerra' },
    { id: 'pd10431', ref: 'PD-10431', fam: 'training_program', product: 'CrossFit do zero', ver: 'v3', offer: 'o4', seller: 'rafael', payer: 'Camila R.', payerAcct: 'al_52', recipient: 'Camila R.', cur: 'BRL', amount: 97, disc: 0, proc: 0.96, method: 'Pix', channel: 'web · Pix', policy: 'programa v3 · aceite 24/10 19:19', at: '24/10 19:20', period: 'acesso ao programa', pay: 'pago', access: 'liberado', resp: '—', issue: 'valor diferente', age: '2 d', div: 'dv27', dispute: '', bank: { st: 'previsto', d: 'envio previsto 03/11' },
      items: [{ n: 'CrossFit do zero · 8 semanas', paid: 97, refunded: 0, pending: 0 }],
      attempts: [att('Tentativa 1 · Pix', 'pago 19:20 · evento e_71', 'Confirmado'), att('Direito de acesso', 'concedido 19:20', 'Confirmado')],
      accessEffect: 'o acesso ao programa encerra' },
    { id: 'pd10388', ref: 'PD-10388', fam: 'coaching_plan', product: 'Acompanhamento online', ver: 'v3', offer: 'o1', seller: 'rafael', payer: 'Ana C.', payerAcct: 'al_77', recipient: 'Ana C.', cur: 'BRL', amount: 200, disc: 0, proc: 6.38, method: 'cartão final 4242', channel: 'renovação · cartão', policy: 'cancelamento v2 · aceite 05/03 09:00', at: '05/10 09:00', period: 'ciclo 05/10 a 04/11', pay: 'pago', access: 'liberado', resp: '—', issue: 'envio ao banco falhou', age: '6 h', div: 'dv30', dispute: '', bank: { st: 'falhou', d: 'P-78 · 26/10 08:00 · requisito do provedor: confirmar titularidade da conta ••21' },
      items: [{ n: 'Acompanhamento online · ciclo de outubro', paid: 200, refunded: 0, pending: 0 }],
      attempts: [att('Renovação · cartão final 4242', 'aprovada 05/10 09:00 · evento e_40', 'Confirmado'), att('Direito de acesso', 'mantido 05/10 09:00', 'Confirmado'), att('Vínculo com Rafael L.', 'ativo desde 05/03', 'Confirmado')],
      accessEffect: 'o acompanhamento de outubro encerra' },
    { id: 'pd10390', ref: 'PD-10390', fam: 'coaching_plan', product: 'Acompanhamento online', ver: 'v3', offer: 'o1', seller: 'rafael', payer: 'Ana C.', payerAcct: 'al_77', recipient: 'Ana C.', cur: 'BRL', amount: 200, disc: 0, proc: 6.38, method: 'cartão final 4242', channel: 'renovação · cartão', policy: 'cancelamento v2 · aceite 05/03 09:00', at: '05/10 09:01', period: 'ciclo 05/10 a 04/11 (cobrança em dobro)', pay: 'pago', access: 'coberto por PD-10388', resp: 'Lia', issue: 'cobrança duplicada', age: '1 d', div: '', dispute: '', bank: { st: 'previsto', d: 'envio previsto 03/11' },
      items: [{ n: 'Acompanhamento online · ciclo de outubro (2ª cobrança)', paid: 200, refunded: 0, pending: 0 }],
      attempts: [att('Renovação · cartão final 4242', 'aprovada 05/10 09:00 · PD-10388', 'Confirmado'), att('Renovação repetida · cartão final 4242', 'aprovada 05/10 09:01 · evento e_41', 'Confirmado'), att('Direito de acesso', 'já coberto por PD-10388', 'Não se aplica')],
      accessEffect: 'nada encerra: o acompanhamento de outubro segue pela cobrança PD-10388' },
    { id: 'pd10372', ref: 'PD-10372', fam: 'coaching_plan', product: 'Sessão presencial', ver: 'v2', offer: 'o2', seller: 'rafael', payer: 'Diego R.', payerAcct: 'al_19', recipient: 'Diego R.', cur: 'BRL', amount: 80, disc: 0, proc: 0.79, method: 'Pix', channel: 'web · Pix', policy: 'cancelamento v2 · aceite 20/10 18:09', at: '20/10 18:10', period: 'sessão de 22/10 14:00 (cancelada pelo treinador)', pay: 'pago', access: 'sessão cancelada 22/10', resp: 'Bia', issue: 'reembolso sem confirmação', age: '1 d', div: 'dv28', dispute: '', bank: { st: 'retido', d: 'retido até o reembolso RF-77 se confirmar' },
      items: [{ n: 'Sessão presencial · 22/10 14:00', paid: 80, refunded: 0, pending: 80 }],
      attempts: [att('Tentativa 1 · Pix', 'pago 18:10 · evento e_62', 'Confirmado'), att('Sessão de 22/10', 'cancelada pelo treinador 21/10 20:00', 'Confirmado')],
      accessEffect: 'a sessão já foi cancelada; nada mais é afetado' },
    { id: 'pd10419', ref: 'PD-10419', fam: 'coaching_plan', product: 'Sessão presencial', ver: 'v2', offer: 'o2', seller: 'rafael', payer: 'Lucas M.', payerAcct: 'al_23', recipient: 'Lucas M.', cur: 'BRL', amount: 80, disc: 0, proc: 0.79, method: 'Pix', channel: 'web · Pix', policy: 'cancelamento v2 · aceite 21/10 07:30', at: '21/10 07:31', period: 'sessão de 23/10 07:00', pay: 'pago', access: 'liberado', resp: 'Bia', issue: 'reembolso processando', age: '2 d', div: '', dispute: '', bank: { st: 'retido', d: 'retido até o reembolso RF-75' },
      items: [{ n: 'Sessão presencial · 23/10 07:00', paid: 80, refunded: 0, pending: 80 }],
      attempts: [att('Tentativa 1 · Pix', 'pago 07:31 · evento e_66', 'Confirmado')],
      accessEffect: 'a sessão de 23/10 já aconteceu; nada encerra' },
    { id: 'pd10402', ref: 'PD-10402', fam: 'training_program', product: 'CrossFit do zero', ver: 'v3', offer: 'o4', seller: 'rafael', payer: 'Paulo V.', payerAcct: 'al_31', recipient: 'Paulo V.', cur: 'BRL', amount: 97, disc: 0, proc: 3.09, method: 'cartão final 7731', channel: 'web · cartão', policy: 'programa v3 · aceite 22/10 21:10', at: '22/10 21:11', period: 'acesso ao programa', pay: 'pago', access: 'liberado', resp: 'Bia', issue: 'reembolso solicitado', age: '1 d', div: '', dispute: '', bank: { st: 'retido', d: 'retido até o reembolso RF-74' },
      items: [{ n: 'CrossFit do zero · 8 semanas', paid: 97, refunded: 0, pending: 97 }],
      attempts: [att('Tentativa 1 · cartão', 'aprovado 21:11 · evento e_68', 'Confirmado'), att('Direito de acesso', 'concedido 21:11', 'Confirmado')],
      accessEffect: 'o acesso ao programa encerra' },
    { id: 'pd10377', ref: 'PD-10377', fam: 'training_program', product: 'CrossFit do zero', ver: 'v3', offer: 'o4', seller: 'rafael', payer: 'Ana C.', payerAcct: 'al_90', recipient: 'Ana C.', cur: 'BRL', amount: 97, disc: 0, proc: 0.96, method: 'Pix', channel: 'web · Pix', policy: 'programa v3 · aceite 12/10 10:00', at: '12/10 10:01', period: 'acesso ao programa', pay: 'pago', access: 'liberado', resp: '—', issue: '', age: '', div: '', dispute: '', bank: { st: 'enviado', d: 'P-77 · 20/10 08:00 · conta ••21' },
      items: [{ n: 'CrossFit do zero · 8 semanas', paid: 97, refunded: 0, pending: 0 }],
      attempts: [att('Tentativa 1 · Pix', 'pago 10:01 · evento e_51', 'Confirmado'), att('Direito de acesso', 'concedido 10:01', 'Confirmado')],
      accessEffect: 'o acesso ao programa encerra' },
    { id: 'pd10201', ref: 'PD-10201', fam: 'training_program', product: 'CrossFit do zero', ver: 'v3', offer: 'o4', seller: 'rafael', payer: 'Rodrigo T.', payerAcct: 'al_05', recipient: 'Rodrigo T.', cur: 'BRL', amount: 97, disc: 0, proc: 3.09, method: 'cartão final 3309', channel: 'web · cartão', policy: 'programa v3 · aceite 20/08 21:13', at: '20/08 21:14', period: 'acesso ao programa (expirado 20/10)', pay: 'em disputa', access: 'expirado 20/10', resp: 'Bia', issue: 'disputa com prazo', age: '4 d', div: '', dispute: 'd12', bank: { st: 'enviado', d: 'P-71 · 01/09 08:00 · conta ••21' },
      items: [{ n: 'CrossFit do zero · 8 semanas', paid: 97, refunded: 0, pending: 0 }],
      attempts: [att('Tentativa 1 · cartão', 'aprovado 20/08 21:14 · evento e_09', 'Confirmado'), att('Direito de acesso', 'concedido 20/08 21:14 · 31 acessos até 18/10', 'Confirmado'), att('Contestação do portador', 'aberta 22/10 · não reconhecida', 'Em andamento')],
      accessEffect: 'o acesso já expirou em 20/10' },
    { id: 'pd10155', ref: 'PD-10155', fam: 'training_program', product: 'CrossFit do zero', ver: 'v3', offer: 'o4', seller: 'rafael', payer: 'Fernanda A.', payerAcct: 'al_44', recipient: 'Fernanda A.', cur: 'BRL', amount: 97, disc: 0, proc: 3.09, method: 'cartão final 5512', channel: 'web · cartão', policy: 'programa v3 · aceite 02/10 08:40', at: '02/10 08:41', period: 'acesso ao programa', pay: 'em disputa', access: 'liberado', resp: '—', issue: 'disputa nova', age: '1 d', div: '', dispute: 'd13', bank: { st: 'retido', d: 'retido pela disputa D-13' },
      items: [{ n: 'CrossFit do zero · 8 semanas', paid: 97, refunded: 0, pending: 0 }],
      attempts: [att('Tentativa 1 · cartão', 'aprovado 02/10 08:41 · evento e_33', 'Confirmado'), att('Direito de acesso', 'concedido 02/10 08:41 · 14 acessos', 'Confirmado'), att('Contestação do portador', 'aberta 25/10 · não entregue', 'Em andamento')],
      accessEffect: 'o acesso ao programa encerra' },
    { id: 'pd10098', ref: 'PD-10098', fam: 'training_program', product: 'Mobilidade 15 minutos', ver: 'v2', offer: '', seller: 'rafael', payer: 'Beatriz L.', payerAcct: 'al_61', recipient: 'Beatriz L.', cur: 'BRL', amount: 47, disc: 0, proc: 1.5, method: 'cartão final 0904', channel: 'web · cartão', policy: 'programa v2 · aceite 11/10 07:39', at: '11/10 07:40', period: 'acesso ao programa', pay: 'em disputa', access: 'liberado', resp: 'Lia', issue: 'disputa enviada', age: '2 d', div: '', dispute: 'd09', bank: { st: 'retido', d: 'retido pela disputa D-09' },
      items: [{ n: 'Mobilidade 15 minutos · 4 semanas', paid: 47, refunded: 0, pending: 0 }],
      attempts: [att('Tentativa 1 · cartão', 'aprovado 11/10 07:40 · evento e_55', 'Confirmado'), att('Contestação do portador', 'aberta 20/10 · cobrança duplicada', 'Em andamento')],
      accessEffect: 'o acesso ao programa encerra' },
    { id: 'sb2201', ref: 'SB-2201', fam: 'platform_subscription', product: '99Coach Pro · mensal', ver: 'preço 2026-10', offer: '', seller: 'carolina', payer: 'Carolina A.', payerAcct: 'ac_12', recipient: 'Carolina A.', cur: 'BRL', amount: 99, disc: 0, proc: 3.16, method: 'cartão final 4421', channel: 'painel · cartão', policy: 'assinatura Pro v1 · aceite 20/10 10:02', at: '20/10 10:02', period: 'teste até 27/10 10:02 BRT', pay: 'ação exigida', access: 'teste ativo', resp: '—', issue: 'primeira cobrança exige ação', age: '', div: '', dispute: '', bank: { st: 'não se aplica', d: 'receita da 99Coach, sem repasse' },
      items: [{ n: '99Coach Pro · 1º mês após o teste', paid: 0, refunded: 0, pending: 0 }],
      attempts: [att('Ativação do teste', '20/10 10:02 · aceite registrado', 'Confirmado'), att('Primeira cobrança', 'agendada 27/10 10:02 · banco pede autenticação', 'Na fila')],
      accessEffect: 'o Pro segue até o fim do período pago' },
    { id: 'sb2190', ref: 'SB-2190', fam: 'platform_subscription', product: 'Plano Essencial', ver: 'gratuito', offer: '', seller: 'rafael', payer: 'Rafael L.', payerAcct: 'ac_31', recipient: 'Rafael L.', cur: 'BRL', amount: 0, disc: 0, proc: 0, method: 'sem cobrança', channel: 'cadastro', policy: 'termos do treinador v4 · aceite 2019', at: '2019', period: 'sem ciclo de cobrança', pay: 'não se aplica', access: 'ativo', resp: '—', issue: '', age: '', div: '', dispute: '', bank: { st: 'não se aplica', d: 'sem cobrança' },
      items: [{ n: 'Plano Essencial · gratuito', paid: 0, refunded: 0, pending: 0 }],
      attempts: [att('Cadastro', 'gratuito · 2019', 'Confirmado'), att('Teste do Pro', 'não ativado', 'Não se aplica')],
      accessEffect: 'nada encerra' }
  ]);
  // divergências abertas (conciliação)
  DB.seed('o5_divergencias', [
    { id: 'dv31', ref: 'DV-31', order: 'pd10442', kind: 'pago sem acesso', age: '3 h', resp: 'Lia', status: 'aberta', checkedAt: '14:00',
      prov: ['pago', '11:02', 'pi_7781'], ours: ['pago', '11:02', 'e_88'], acc: ['não concedido', '11:03', 'etapa divergente'],
      action: 'conceder o crédito da sessão do contrato existente', pre: 'pagamento confirmado · sem reembolso', effect: 'Bruno recebe a sessão de 28/10; nenhuma nova cobrança', delta: 75.21, hint: 'evento de concessão perdido', repair: null },
    { id: 'dv32', ref: 'DV-32', order: 'pd10447', kind: 'pago sem acesso', age: '1 h', resp: '—', status: 'aberta', checkedAt: '14:00',
      prov: ['pago', '12:55', 'pi_7802'], ours: ['pago', '12:55', 'e_93'], acc: ['não concedido', '12:55', 'etapa divergente'],
      action: 'conceder o acesso ao programa comprado', pre: 'pagamento confirmado · sem reembolso', effect: 'Marina acessa o programa; nenhuma nova cobrança', delta: 43.15, hint: 'webhook de concessão atrasado', repair: null },
    { id: 'dv27', ref: 'DV-27', order: 'pd10431', kind: 'valor diferente', age: '2 d', resp: 'Lia', status: 'aberta', checkedAt: '13:00',
      prov: ['pago R$ 77,00', '24/10 19:20', 'pi_7640'], ours: ['pago R$ 97,00', '24/10 19:20', 'e_71'], acc: ['liberado', '24/10 19:20', 'sem divergência'],
      action: 'registrar que a 99Coach absorve o cupom ZERO20 aplicado após expirar', pre: 'cupom expirado em 30/09 · aplicado pelo checkout', effect: 'o treinador recebe pelo preço cheio; a 99Coach absorve R$ 20,00', delta: 0, hint: 'cupom expirado aplicado pelo checkout', repair: null },
    { id: 'dv30', ref: 'DV-30', order: 'pd10388', kind: 'repasse ambíguo', age: '6 h', resp: '—', status: 'aberta', checkedAt: '14:00',
      prov: ['envio P-78 falhou', '08:00', 'po_331'], ours: ['envio P-78 enviado', '08:00', 'P-78'], acc: ['liberado', '05/10 09:00', 'sem divergência'],
      action: 'consultar o mesmo envio P-78 e devolver o valor ao saldo disponível se a falha for confirmada', pre: 'falha confirmada pelo processador · sem novo envio em curso', effect: 'Rafael vê o valor de volta no saldo disponível até confirmar a conta', delta: 0, hint: 'envio recusado pelo banco', repair: null },
    { id: 'dv28', ref: 'DV-28', order: 'pd10372', kind: 'reembolso sem confirmação', age: '1 d', resp: 'Bia', status: 'aberta', checkedAt: '13:40',
      prov: ['sem resposta (timeout)', '13:40', 're_120'], ours: ['reembolso RF-77 solicitado', '13:40', 'RF-77'], acc: ['sessão cancelada', '21/10 20:00', 'sem divergência'],
      action: 'consultar RF-77 na mesma referência antes de qualquer nova tentativa', pre: 'nenhum novo reembolso para PD-10372', effect: 'nenhum efeito até o processador responder', delta: 0, hint: 'timeout do processador', repair: null }
  ]);
  // reembolsos em andamento (status: aguardando aprovação · solicitado · processando · desconhecido · falhou · concluído)
  DB.seed('o5_reembolsos', [
    { id: 'rf77', ref: 'RF-77', order: 'pd10372', amount: 80, by: 'Bia F.', at: '26/10 13:40', status: 'desconhecido', motivo: 'Sessão cancelada pelo treinador', needs2: false, approver: '', approvedAt: '', checks: 0, result: 'timeout · consultar a mesma referência' },
    { id: 'rf75', ref: 'RF-75', order: 'pd10419', amount: 80, by: 'Bia F.', at: '24/10 16:05', status: 'processando', motivo: 'Pix pago em dobro pelo aluno', needs2: false, approver: '', approvedAt: '', checks: 1, result: 'aceito pelo processador 24/10 16:06' },
    { id: 'rf74', ref: 'RF-74', order: 'pd10402', amount: 97, by: 'Bia F.', at: '25/10 09:12', status: 'solicitado', motivo: 'Desistência dentro de 7 dias', needs2: false, approver: '', approvedAt: '', checks: 0, result: 'na fila do processador' }
  ]);
  // disputas (estado: nova · preparar · enviada · ganha · perdida)
  DB.seed('o5_disputas', [
    { id: 'd12', ref: 'D-12', order: 'pd10201', amount: 97, reason: 'não reconhecida', due: '29/10 23:59 BRT', days: 3, status: 'preparar', resp: 'Bia', opened: '22/10',
      ev: { recibo: true, termos: true, acessos: true, conversa: false }, draftAt: '', sub: null, decision: 'pendente' },
    { id: 'd13', ref: 'D-13', order: 'pd10155', amount: 97, reason: 'não entregue', due: '', days: -1, status: 'nova', resp: '—', opened: '25/10',
      ev: { recibo: true, termos: true, acessos: true, conversa: false }, draftAt: '', sub: null, decision: 'pendente' },
    { id: 'd09', ref: 'D-09', order: 'pd10098', amount: 47, reason: 'cobrança duplicada', due: '05/11 23:59 BRT', days: 10, status: 'enviada', resp: 'Lia', opened: '20/10',
      ev: { recibo: true, termos: true, acessos: true, conversa: false }, draftAt: '24/10 16:10', sub: { v: 1, at: '24/10 16:20', receipt: 'DS-81' }, decision: 'pendente' }
  ]);
  // assinaturas 99Coach dos treinadores (platform_subscription; nunca misturadas às vendas aos alunos)
  DB.seed('o5_assinaturas', [
    { id: 'sb2201', ref: 'SB-2201', who: 'Carolina A.', rows: [['Cadastro', 'gratuito · 03/2026'], ['Ativação do Pro', 'expressa · 20/10 10:02 · aceite registrado'], ['Teste', '7 dias · até 27/10 10:02 BRT'], ['Ciclo escolhido', 'mensal'], ['Preço', 'R$ 99,00/mês · decidido'], ['Primeira cobrança', '27/10 10:02 BRT · cartão final 4421'], ['Franquia', '750 créditos no teste · 6.000/mês no Pro'], ['Cancelamento', 'no painel · até 27/10 10:01']],
      trial: '27/10 10:02', after: 'R$ 99,00/mês', credits: '750 no teste' },
    { id: 'sb2190', ref: 'SB-2190', who: 'Rafael L.', rows: [['Cadastro', 'gratuito · 2019'], ['Plano', 'Essencial · R$ 0,00/mês'], ['Ativação do Pro', 'não ativado'], ['Teste', 'não iniciado · convite não inicia teste'], ['Ciclo escolhido', '—'], ['Primeira cobrança', 'nenhuma agendada'], ['Franquia', '100 créditos de IA/mês · uso 38 · renova 01/11'], ['Cancelamento', 'não se aplica']],
      trial: 'não iniciado', after: 'R$ 0,00/mês', credits: '100/mês' }
  ]);
  DB.seed('o5_recibos', [
    { id: 'rc1', ref: 'RF-77', kind: 'Reembolso solicitado', order: 'PD-10372', who: 'Bia F.', at: '26/10 13:40', amount: 'R$ 80,00 BRL', motivo: 'Sessão cancelada pelo treinador', effect: 'recebível de Rafael L. − R$ 76,00 quando confirmar' }
  ]);
  // rascunhos compartilhados entre composição e subtelas (motivo, valor, …)
  DB.seed('o5_rascunhos', {});
  DB.seed('o5_totais', {
    out: { label: 'Outubro', cut: '25/10 23:59 BRT', rows: [
      { k: 'saas', l: 'Receita SaaS', fam: 'platform_subscription', v: 18420, short: 'R$ 18,4 mil', sub: 'receita SaaS', def: 'platform_subscription paga', cov: 'reconciliado', calc: '186 cobranças do Pro × R$ 99,00 = R$ 18.414,00 + R$ 6,00 de ajustes pró-rata. Fonte: razão financeiro, conciliado com o processador até o corte.' },
      { k: 'vol', l: 'Volume transacionado', fam: 'coaching + program', v: 61053, short: 'R$ 61,1 mil', sub: 'volume pago pelos alunos', def: 'pago pelos alunos em coaching_plan + training_program', cov: 'provisório', calc: 'Soma dos pagamentos confirmados de alunos em outubro (412 pedidos). Exclui assinaturas da 99Coach e valores em USD.' },
      { k: 'com', l: 'Comissão da plataforma', fam: 'comissão', v: 3052.65, short: 'R$ 3,1 mil', sub: '5% sobre vendas processadas', def: 'sobre coaching_plan + training_program', cov: 'provisório', calc: '5% × R$ 61.053,00 = R$ 3.052,65. Devoluções de comissão por reembolso entram depois do corte.' },
      { k: 'rec', l: 'Recebíveis dos treinadores', fam: 'recebíveis', v: 56700.35, short: 'R$ 56,7 mil', sub: 'dos treinadores', def: 'líquido a disponibilizar', cov: 'provisório', calc: 'R$ 61.053,00 − R$ 3.052,65 de comissão − R$ 1.300,00 de processamento = R$ 56.700,35.' }
    ], usd: 410 },
    set: { label: 'Setembro', cut: '30/09 23:59 BRT', rows: [
      { k: 'saas', l: 'Receita SaaS', fam: 'platform_subscription', v: 17721, short: 'R$ 17,7 mil', sub: 'receita SaaS', def: 'platform_subscription paga', cov: 'reconciliado', calc: '179 cobranças do Pro × R$ 99,00 = R$ 17.721,00. Fonte: razão financeiro.' },
      { k: 'vol', l: 'Volume transacionado', fam: 'coaching + program', v: 57380, short: 'R$ 57,4 mil', sub: 'volume pago pelos alunos', def: 'pago pelos alunos em coaching_plan + training_program', cov: 'reconciliado', calc: 'Soma dos pagamentos confirmados de alunos em setembro (388 pedidos).' },
      { k: 'com', l: 'Comissão da plataforma', fam: 'comissão', v: 2869, short: 'R$ 2,9 mil', sub: '5% sobre vendas processadas', def: 'sobre coaching_plan + training_program', cov: 'reconciliado', calc: '5% × R$ 57.380,00 = R$ 2.869,00.' },
      { k: 'rec', l: 'Recebíveis dos treinadores', fam: 'recebíveis', v: 53289.4, short: 'R$ 53,3 mil', sub: 'dos treinadores', def: 'líquido a disponibilizar', cov: 'reconciliado', calc: 'R$ 57.380,00 − R$ 2.869,00 − R$ 1.221,60 de processamento = R$ 53.289,40.' }
    ], usd: 385 }
  });

  // ---------- utilitários ----------
  var BADGE = { 'Confirmado': 'ok', 'Falhou': 'risk', 'Desconhecido': 'warn', 'Na fila': 'info', 'Em andamento': 'info', 'Não se aplica': 'plain', 'Pendente': 'warn', 'Marcado': 'warn' };
  var O5 = window.O5 = {
    AT: AT,
    ENV: 'Demonstração · dados sintéticos',
    m: function (n, cur) {
      var v = Number(n); if (isNaN(v)) v = 0;
      var neg = v < 0; v = Math.abs(v);
      var s = v.toFixed(2).split('.');
      s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return (neg ? '− ' : '') + (cur === 'USD' ? 'US$ ' : 'R$ ') + s[0] + ',' + s[1];
    },
    num: function (t) { var s = String(t == null ? '' : t).replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'); var n = parseFloat(s); return isNaN(n) ? null : Math.round(n * 100) / 100; },
    now: function () { return '26/10 ' + U.now(); },
    badge: function (st) { return 'badge badge--' + (BADGE[st] || 'plain'); },
    order: function (id, def) { return DB.find('o5_pedidos', id) || DB.find('o5_pedidos', def || 'pd10442'); },
    seller: function (o) { return DB.find('o5_vendedores', o.seller) || DB.o5_vendedores[0]; },
    div: function (o) { return o && o.div ? DB.find('o5_divergencias', o.div) : null; },
    dispute: function (o) { return o && o.dispute ? DB.find('o5_disputas', o.dispute) : null; },
    refundsOf: function (o) { return DB.o5_reembolsos.filter(function (r) { return r.order === o.id; }); },
    openRefund: function (o) { return DB.o5_reembolsos.filter(function (r) { return r.order === o.id && /aguardando|solicitado|processando|desconhecido/.test(r.status); })[0] || null; },
    calc: function (o) {
      var comm = Math.round(o.amount * 5) / 100;
      if (o.fam === 'platform_subscription') comm = 0;
      var net = Math.round((o.amount - o.disc - comm - o.proc) * 100) / 100;
      return { gross: o.amount, disc: o.disc, comm: comm, proc: o.proc, net: net };
    },
    // valor que sai do saldo do treinador ao reembolsar "valor" (comissão devolvida proporcionalmente)
    refundHit: function (o, valor) { if (o.fam === 'platform_subscription') return 0; return Math.round(valor * 0.95 * 100) / 100; },
    eligible: function (o) { return o.items.reduce(function (s, it) { return s + Math.max(0, it.paid - it.refunded - it.pending); }, 0); },
    draft: function (key) { var d = DB.o5_rascunhos; if (!d[key]) d[key] = {}; return d[key]; },
    cb: function (cap, alvo, fonte) { return [{ k: 'Ambiente', v: O5.ENV }, { k: 'Capacidade', v: cap }, { k: 'Alvo', v: alvo }, { k: 'Atualizado', v: AT }, { k: 'Fonte', v: fonte }]; },
    receipt: function (r) { DB.o5_recibos.unshift(Object.assign({ id: DB.uid('rc') }, r)); },
    receiptLines: function (ref) {
      var r = DB.o5_recibos.filter(function (x) { return x.ref === ref; })[0];
      if (!r) return ['Referência ' + ref, 'Recibo ainda não emitido: a operação não foi confirmada.'];
      return ['Referência: ' + r.ref + ' · ' + r.kind, 'Pedido: ' + r.order, 'Executor: ' + r.who + ' · ' + r.at + ' BRT', 'Valor: ' + r.amount, 'Motivo: ' + r.motivo, 'Efeito: ' + r.effect, 'Registro imutável na trilha de auditoria · demonstração, sem dinheiro real'];
    },
    // linhas de subtelas (composição)
    sub: function (rows, id) { return rows.map(function (r) { return { t: r[0], s: r[1], ic: 'ic ic--sm i-' + r[3], go: function () { GO(r[2], id ? { id: id } : {}); } }; }); },
    backId: function (ctx) { return { id: ctx.id || '' }; }
  };

  // ---------- H14 · hub ----------
  REG.screen({
    page: 'operacao', key: 'financeiro', id: 'H14', also: ['FA01'], title: 'Operação financeira', mtitle: 'Financeiro', nav: 'financeiro', wide: true,
    normal: 'Uso recorrente',
    scens: [['leitura', 'Primeiro uso · só leitura'], ['vazio', 'Ausência confirmada'], ['parcial', 'Indisponibilidade parcial'], ['fonte', 'Fonte fora'], ['webhook', 'Webhook atrasado']],
    vals: function (ctx) {
      var scn = ctx.scn, ui = ctx.ui;
      var divs = DB.o5_divergencias.filter(function (d) { return d.status !== 'encerrado' && d.status !== 'conciliado'; });
      var semAcesso = divs.filter(function (d) { return d.kind === 'pago sem acesso'; });
      var refs = DB.o5_reembolsos.filter(function (r) { return /aguardando|solicitado|processando|desconhecido/.test(r.status); });
      var unk = refs.filter(function (r) { return r.status === 'desconhecido'; })[0];
      var disp = DB.o5_disputas.filter(function (d) { return d.status !== 'enviada' && d.status !== 'ganha' && d.status !== 'perdida' && d.due; });
      var bankFail = DB.o5_pedidos.filter(function (o) { return o.bank.st === 'falhou'; });
      var empty = scn === 'vazio', srcOut = scn === 'fonte';
      var q = function (t, why, meta, n, go, proc) {
        var dash = srcOut && proc;
        return { t: t, why: dash ? 'processador fora desde 13:10 · motivo da falta' : why, meta: empty ? 'verificado 14:00' : (dash ? 'sem contagem' : meta), n: empty ? '0' : (dash ? '—' : n), go: go };
      };
      var queues = [
        q('Pago sem acesso', 'nunca pedir recompra', semAcesso.length ? 'mais antigo ' + semAcesso[0].age : 'nenhum', String(semAcesso.length), function () { GO('FA01.B', { f: 'semacesso' }); }, true),
        q('Reembolsos sem confirmação', 'consultar a mesma referência', unk ? unk.ref + ' timeout' : 'nenhum timeout', String(refs.length), function () { GO('FA04.C', { id: unk ? unk.order : 'pd10372' }); }, true),
        q('Disputa com prazo', disp.length && disp[0].draftAt ? 'evidência em rascunho' : 'evidência a preparar', disp.length ? 'vence ' + disp[0].due.slice(0, 5) : 'sem prazo aberto', String(disp.length), function () { GO('FA05.A'); }, true),
        q('Envio ao banco falhou', 'requisito do provedor', bankFail.length ? '6 h' : 'nenhum', String(bankFail.length), function () { GO('FA02.C', { id: bankFail.length ? bankFail[0].id : 'pd10388' }); }, true),
        { t: 'Eventos atrasados', why: 'sem contagem confiável', meta: empty ? 'verificado 14:00' : 'provedor parcial', n: empty ? '0' : '—', go: function () { GO('FA01.A'); } }
      ];
      var T = DB.o5_totais.out;
      var noTotals = scn === 'parcial';
      var kpis = T.rows.map(function (r) {
        return { fam: r.fam, n: noTotals ? '—' : r.short, sub: noTotals ? 'aguarda o processador' : r.sub, cov: noTotals ? 'indisponível' : r.cov, covCls: noTotals ? 'badge badge--warn' : (r.cov === 'reconciliado' ? 'badge badge--ok' : 'badge badge--plain'), go: function () { GO('FA01.C'); } };
      });
      var divRows = empty ? [] : divs.map(function (d) {
        var o = DB.find('o5_pedidos', d.order) || {};
        return { ref: d.ref, item: o.ref || '', kind: d.kind, age: d.age, resp: d.resp, go: function () { GO('FA03', { id: d.order }); } };
      });
      var tries = ui.tries || 0;
      return {
        cut: 'BRL · outubro · corte ' + T.cut,
        readOnly: scn === 'leitura', isEmpty: empty, isPartial: noTotals, isSrcOut: srcOut, isWebhook: scn === 'webhook',
        showProcBanner: scn === '' || scn === 'leitura',
        queues: queues, kpis: kpis, usd: noTotals ? 'US$ —' : O5.m(T.usd, 'USD'),
        divRows: divRows, hasDivs: divRows.length > 0, noDivs: divRows.length === 0,
        srcMsg: tries ? 'Consultado às ' + U.now() + ': o processador ainda não responde. As contagens seguem como “—”.' : 'Processador sem resposta desde 13:10. Nada foi zerado.',
        hookMsg: tries ? 'Reconsulta pedida às ' + U.now() + '. Eventos repetidos são agrupados; nada é processado duas vezes.' : 'Último evento do processador recebido às 11:22 · atraso de 2 h 40 min.',
        retry: function () { if (tries >= 1) { ctx.scenario(''); return; } ctx.setUi({ tries: tries + 1 }); },
        openQueue: function () { GO('FA01.B'); },
        openHealth: function () { GO('FA01.A'); },
        openTotals: function () { GO('FA01.C'); }
      };
    }
  });

  // ---------- FA01.A · Saúde das operações ----------
  REG.screen({
    page: 'operacao', key: 'fa01a', id: 'FA01.A', title: 'Pendências por motivo', mtitle: 'Operação financeira', nav: 'financeiro', back: 'H14', wide: true,
    normal: 'Uso recorrente',
    scens: [['parcial', 'Parcial por provedor'], ['indisp', 'Consulta indisponível'], ['vazio', 'Sem incidentes confirmado'], ['antigo', 'Dado antigo']],
    vals: function (ctx) {
      var scn = ctx.scn;
      var nDiv = DB.o5_divergencias.filter(function (d) { return d.status !== 'encerrado' && d.status !== 'conciliado'; }).length;
      var nSem = DB.o5_divergencias.filter(function (d) { return d.kind === 'pago sem acesso' && d.status !== 'encerrado' && d.status !== 'conciliado'; }).length;
      var nRef = DB.o5_reembolsos.filter(function (r) { return /aguardando|solicitado|processando|desconhecido/.test(r.status); }).length;
      var nDisp = DB.o5_disputas.filter(function (d) { return d.status !== 'enviada' && d.due; }).length;
      var nBank = DB.o5_pedidos.filter(function (o) { return o.bank.st === 'falhou'; }).length;
      var row = function (t, n, old, src, act, go, proc) {
        var off = scn === 'indisp' || (scn === 'parcial' && proc);
        return { t: t, n: scn === 'vazio' ? '0' : (off ? '—' : n), old: scn === 'vazio' ? '—' : (off ? '—' : old), src: off ? (scn === 'indisp' ? 'consulta indisponível' : 'provedor parcial · sem contagem') : (scn === 'vazio' ? src.split(' · ')[0] + ' · verificado 14:00' : src), act: act, go: go };
      };
      var rows = [
        row('Pago sem acesso', String(nSem), '3 h', 'processador · 14:00', 'Abrir', function () { GO('FA01.B', { f: 'semacesso' }); }, true),
        row('Divergências', String(nDiv), '2 d', 'conciliação · 13:00', 'Abrir', function () { GO('FA03', { id: 'pd10431' }); }, false),
        { t: 'Eventos atrasados', n: scn === 'vazio' ? '0' : '—', old: '—', src: scn === 'vazio' ? 'provedor · verificado 14:00' : 'provedor parcial', act: 'Ver', go: function () { GO('H14', { scn: 'webhook' }); } },
        row('Reembolsos pendentes', String(nRef), '1 d', 'processador · 14:00', 'Abrir', function () { GO('FA04.C', { id: 'pd10372' }); }, true),
        row('Disputas com prazo', String(nDisp), 'vence 29/10', 'processador · 14:00', 'Abrir', function () { GO('FA05.A'); }, true),
        row('Envio ao banco falhou', String(nBank), '6 h', 'processador · 08:00', 'Abrir', function () { GO('FA02.C', { id: 'pd10388' }); }, true)
      ];
      return {
        cb: O5.cb('financeiro.ler', 'Todas as contas · BRL', 'processador e conciliação'),
        rows: rows,
        isPartial: scn === 'parcial', isOff: scn === 'indisp', isEmpty: scn === 'vazio', isOld: scn === 'antigo', isNormal: scn === '',
        lastOk: function () { ctx.toast('Último dado confirmado: processador 26/10 14:00 BRT · conciliação 26/10 13:00 BRT.'); },
        retry: function () { ctx.scenario(''); }
      };
    }
  });

  // ---------- FA01.B · Fila financeira ----------
  var FAMS = [['', 'Todas'], ['coaching_plan', 'coaching_plan'], ['training_program', 'training_program'], ['platform_subscription', 'platform_subscription']];
  var PEOPLE = ['Bia F.', 'Caio R.', 'Financeiro N2'];
  REG.screen({
    page: 'operacao', key: 'fa01b', id: 'FA01.B', title: 'Fila financeira', nav: 'financeiro', back: 'H14', wide: true,
    normal: 'Uso recorrente',
    scens: [['homonimo', 'Homônimo'], ['incompleta', 'Referência incompleta'], ['varias', 'Várias contas e contratos'], ['desconhecido', 'Estado desconhecido']],
    vals: function (ctx) {
      var scn = ctx.scn, ui = ctx.ui;
      var preset = { homonimo: 'Ana C.', incompleta: 'PD-104', varias: 'Rafael' }[scn] || '';
      var q = ui.q != null ? ui.q : preset;
      var fam = ui.fam != null ? ui.fam : '';
      var onlyPend = ui.pend != null ? ui.pend : (ctx.p.f === 'semacesso');
      var nq = U.norm(q);
      var list = DB.o5_pedidos.filter(function (o) {
        var s = O5.seller(o);
        if (fam && o.fam !== fam) return false;
        if (onlyPend && !(o.pay === 'pago' && o.access === 'pendente')) return false;
        if (!nq) return true;
        return [o.ref, o.payer, o.payerAcct, s.acct, s.short, s.name, o.product].some(function (x) { return U.norm(x).indexOf(nq) >= 0; });
      });
      var rows = list.map(function (o) {
        var s = O5.seller(o);
        var access = (scn === 'desconhecido' && o.id === 'pd10442') ? 'desconhecido' : o.access;
        return {
          fam: o.fam, ref: o.ref, acct: s.acct, buyer: o.payer + ' · ' + o.payerAcct, cur: o.cur, seller: o.fam === 'platform_subscription' ? '99Coach' : s.short,
          pay: o.pay, payCls: o.pay === 'pago' ? 'badge badge--ok' : (o.pay === 'ação exigida' || o.pay === 'em disputa' ? 'badge badge--warn' : 'badge badge--plain'),
          access: access, accCls: access === 'liberado' || access === 'ativo' || access === 'teste ativo' ? 'badge badge--ok' : (access === 'pendente' || access === 'desconhecido' ? 'badge badge--warn' : 'badge badge--plain'),
          resp: o.resp, amount: O5.m(o.amount, o.cur) + ' ' + o.cur + ' · ' + o.at,
          go: function () { GO('FA02', { id: o.id }); }
        };
      });
      var fwd = ui.fwd || false;
      var pend = DB.o5_pedidos.filter(function (o) { return o.issue; });
      var fwdOrder = ui.fwdOrder || 'pd10442', fwdTo = ui.fwdTo || '', fwdWhy = ui.fwdWhy || '';
      var fwdErr = ui.fwdTried && (!fwdTo || fwdWhy.trim().length < 5);
      return {
        cb: O5.cb('financeiro.ler', fam ? 'Filtro: ' + fam : (onlyPend ? 'Filtro: pago sem acesso' : 'Todas as famílias'), 'razão 99Coach + processador'),
        q: q, setQ: function (e) { ctx.setUi({ q: U.val(e) }); }, clearQ: function () { ctx.setUi({ q: '' }); }, hasQ: !!q,
        fams: FAMS.map(function (f) { var on = fam === f[0]; return { l: f[1], cls: 'chip o5-chip' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ fam: f[0] }); } }; }),
        pendCls: 'chip o5-chip' + (onlyPend ? ' is-on' : ''), pendOn: String(onlyPend), togglePend: function () { ctx.setUi({ pend: !onlyPend }); },
        rows: rows, hasRows: rows.length > 0, noRows: rows.length === 0,
        count: '86 itens', pageInfo: rows.length ? '1–' + rows.length + ' de 86 · amostra da demonstração' : '0 de 86',
        prev: function () { ctx.toast('Você já está na primeira página.'); },
        next: function () { ctx.toast('Demonstração: só a primeira página tem dados de exemplo.'); },
        isHom: scn === 'homonimo' && U.norm(q) === U.norm('Ana C.'), isInc: scn === 'incompleta' && q === 'PD-104', isVar: scn === 'varias' && U.norm(q) === 'rafael', isUnk: scn === 'desconhecido',
        // encaminhar caso
        fwd: fwd, openFwd: function () { ctx.setUi({ fwd: !fwd }); },
        fwdOrders: pend.map(function (o) { var on = fwdOrder === o.id; return { l: o.ref + ' · ' + o.issue, cls: 'chip o5-chip' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ fwdOrder: o.id }); } }; }),
        fwdPeople: PEOPLE.map(function (p) { var on = fwdTo === p; return { l: p, cls: 'chip o5-chip' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ fwdTo: p }); } }; }),
        fwdWhy: fwdWhy, setFwdWhy: function (e) { ctx.setUi({ fwdWhy: U.val(e) }); },
        fwdErr: !!fwdErr, fwdErrMsg: !fwdTo ? 'Escolha para quem encaminhar.' : 'Escreva o motivo (mínimo 5 letras) para o próximo responsável.',
        doFwd: function () {
          if (!fwdTo || fwdWhy.trim().length < 5) { ctx.setUi({ fwdTried: true }); return; }
          var o = DB.find('o5_pedidos', fwdOrder); if (o) o.resp = fwdTo.split(' ')[0];
          ctx.setUi({ fwd: false, fwdTried: false, fwdWhy: '', fwdTo: '' });
          ctx.toast((o ? o.ref : 'Caso') + ' encaminhado a ' + fwdTo + ' às ' + U.now() + ' · motivo registrado na trilha.');
        }
      };
    }
  });

  // ---------- FA01.C · Totais com definição ----------
  REG.screen({
    page: 'operacao', key: 'fa01c', id: 'FA01.C', title: 'Totais com definição', mtitle: 'Totais', nav: 'financeiro', back: 'H14', wide: true,
    normal: 'Provisório até o corte',
    scens: [['reconciliado', 'Reconciliado até o corte'], ['revisao', 'Revisão posterior'], ['moeda', 'Moeda diferente'], ['base', 'Base incompleta']],
    vals: function (ctx) {
      var scn = ctx.scn, ui = ctx.ui;
      var per = ui.per || 'out';
      var T = DB.o5_totais[per];
      var rows = T.rows.map(function (r) {
        var cov = scn === 'reconciliado' ? 'reconciliado' : (scn === 'base' && r.k !== 'saas' ? 'base incompleta' : r.cov);
        if (scn === 'revisao' && r.k === 'com') cov = 'revisado após o corte';
        var open = ui.open === r.k;
        var val = scn === 'base' && r.k !== 'saas' ? '—' : O5.m(r.v);
        return { l: r.l, val: val, short: scn === 'base' && r.k !== 'saas' ? '—' : r.short, def: r.def, cov: cov, covCls: cov === 'reconciliado' ? 'badge badge--ok' : (cov === 'provisório' ? 'badge badge--plain' : 'badge badge--warn'), calc: r.calc, open: open, openTxt: open ? 'Fechar cálculo' : 'Ler cálculo', toggle: function () { ctx.setUi({ open: open ? '' : r.k }); } };
      });
      return {
        cb: O5.cb('financeiro.ler · agregados', 'BRL · ' + (per === 'out' ? 'out' : 'set') + '/2026', 'razão financeiro'),
        sub: T.label + ' · até o corte ' + T.cut,
        pers: [['out', 'Outubro'], ['set', 'Setembro']].map(function (p) { var on = per === p[0]; return { l: p[1], cls: 'seg__it' + (on ? ' is-on' : ''), on: String(on), pick: function () { ctx.setUi({ per: p[0], open: '' }); } }; }),
        rows: rows, usd: O5.m(T.usd, 'USD'),
        isRev: scn === 'revisao', isMoeda: scn === 'moeda', isBase: scn === 'base', isRec: scn === 'reconciliado',
        exportar: function () { GO('FA10'); }
      };
    }
  });
})();
