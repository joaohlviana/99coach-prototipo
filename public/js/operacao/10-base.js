/* O1 · Operação (Lia Moura): dados da mesa de casos e utilidades comuns às telas H12 e OPS01–OPS04.
   Coleções: o1_me (capacidades), o1_equipe, o1_casos (com histórico), o1_recibos (protocolos auditáveis),
   o1_verif (fila de verificações por dimensão), o1_aggr (visão agregada), o1_faq, o1_vocab, o1_busca, o1_clock. */
(function () {
  var DB = window.DB, U = window.U;

  DB.seed('o1_me', {
    name: 'Lia Moura', short: 'Lia M.', id: 'lia', papel: 'Moderação e perfis', mfa: true, lastConfirmMin: 42,
    // capacidade por domínio: decidir · ler · atalho · nenhum
    caps: { casos: 'decidir', perfis: 'decidir', conteudo: 'decidir', privacidade: 'ler', financeiro: 'atalho', analytics: 'ler', institucional: 'editar', vocabulario: 'propor', atribuir: 'sim' }
  });
  DB.seed('o1_equipe', [
    { id: 'lia', name: 'Lia M.', full: 'Lia Moura', area: 'Moderação', caps: ['casos.decidir', 'perfis.decidir', 'conteudo.decidir', 'conteudo.recurso'] },
    { id: 'caio', name: 'Caio R.', full: 'Caio Ramos', area: 'Perfis e credenciais', caps: ['casos.decidir', 'perfis.decidir', 'privacidade.decidir'] },
    { id: 'bea', name: 'Bea T.', full: 'Beatriz Torres', area: 'Atendimento', caps: ['casos.ler'] },
    { id: 'davi', name: 'Davi N.', full: 'Davi Nogueira', area: 'Financeiro', caps: ['financeiro.decidir'] }
  ]);
  DB.seed('o1_clock', { m: 14 * 60 + 5 });
  DB.seed('o1_busca', { q: '', f: { dom: 'perfis', prio: 'alta', resp: '' }, sel: [], page: 1 });

  var stp = function (n, s, at) { return { name: n, st: s, at: at || '' }; };
  DB.seed('o1_casos', [
    { id: 'c301', proto: '#C-301', tipo: 'Titularidade', dom: 'perfis', titulo: 'Titularidade contestada', head: 'Duas contas pedem /thiago-pereira', sub: 'Prova nova às 13:40. Edição pública suspensa até decidir.',
      obj: 'Perfil · Thiago P.', alvo: 'Perfil público · Thiago Pereira', origem: 'contestação', prio: 'alta', prioWhy: 'denúncia de terceiro', resp: 'lia', prazo: 'hoje 18:00', prazoTipo: 'Prazo aprovado', ord: 238, hoje: true,
      estado: 'Em análise', aberto: '24/10 09:12', idade: '2 d', upd: '13:40', next: 'decidir', cta: 'Comparar provas', ic: 'alert',
      solicitante: 'conta ••••@gmail.com', objetos: 'perfil /thiago-pereira · claim #CL-88', pend: 'credencial CREF · foto', nota: 'Solicitante enviou prova pelo direct oficial.', regra: 'Política de titularidade v2 · 01/10', verif: 'thiago',
      evid: [{ name: 'Código no direct', orig: '@thiago.coach · 24/10 09:20', val: 'válido', conf: 'sim', cls: 'ok' }, { name: 'Documento', orig: '•••.•••.•••-12 · 24/10', val: 'mascarado', conf: 'não exigido', cls: 'plain' }, { name: 'Contestação', orig: '@thiago_treinos · 25/10', val: 'vence 27/10', conf: 'conflita', cls: 'warn' }],
      decs: [
        { k: 'confirmar', label: 'Confirmar titularidade · só Instagram', campo: 'Titular', antes: '—', depois: 'Thiago P. (conta ••••88)', muda: 'Muda titular, selo “Perfil do treinador”', afeta: 'Thiago P. · contestante @thiago_treinos', afetaN: '2 pessoas', rev: 'sim · por novo caso', naoMuda: 'CREF, foto, avaliações', estado: 'Decidido', why: 'Código conferido pela conta oficial do perfil. CREF segue independente.', rec: 'Titularidade confirmada', eff: { verif: ['thiago', 'tit', 'confirmada'] },
          steps: [['Titular gravado', 'ok'], ['Selo atualizado no perfil', 'ok'], ['Aviso às partes', 'and'], ['Índice de busca', 'desc']] },
        { k: 'rejeitar', label: 'Rejeitar reivindicação', campo: 'Titular', antes: '—', depois: '— (perfil segue sem titular)', muda: 'Claim #CL-88 recusado; edição pública volta a ficar livre', afeta: 'Thiago P. (conta ••••88)', afetaN: '1 pessoa', rev: 'sim · nova prova abre novo caso', naoMuda: 'CREF, foto, avaliações', estado: 'Decidido', why: '', rec: 'Reivindicação rejeitada', eff: { verif: ['thiago', 'tit', 'não reivindicado'] },
          steps: [['Claim recusado', 'ok'], ['Edição pública liberada', 'ok'], ['Aviso ao solicitante', 'and']] },
        { k: 'complemento', label: 'Pedir nova prova às duas contas', campo: 'Estado do claim', antes: 'em análise', depois: 'aguardando prova', muda: 'Prazo do caso fica suspenso até a resposta', afeta: 'Thiago P. · @thiago_treinos', afetaN: '2 pessoas', rev: 'sim', naoMuda: 'titular, CREF, foto, avaliações', estado: 'Aguardando', why: '', rec: 'Complemento pedido',
          steps: [['Pedido registrado', 'ok'], ['Aviso às partes', 'and']] }
      ],
      hist: [{ at: '24/10 09:12', who: 'sistema', what: 'Aberto', why: 'Claim #CL-88 com código no direct', ref: '' }, { at: '25/10 16:40', who: 'outra conta', what: 'Contestação', why: '@thiago_treinos alega ser a dona do perfil', ref: '' }, { at: '26/10 09:30', who: 'Lia M.', what: 'Atribuído a você', why: 'Fila de titularidade · perfis.decidir', ref: 'R-301-0' }, { at: '26/10 13:40', who: 'sistema', what: 'Prova nova recebida', why: 'Documento enviado pela contestante', ref: '' }] },
    { id: 'p44', proto: '#P-44', tipo: 'Exportação de dados', dom: 'privacidade', titulo: 'Exportação de dados', head: 'Ana C. pediu seus dados', sub: 'Recibos dependem do processador, fora desde 13:10.',
      obj: 'Conta · Ana C.', alvo: 'Conta · Ana C. (••••@gmail.com)', origem: 'pedido da titular', prio: 'alta', prioWhy: 'prazo legal', resp: 'lia', prazo: '08/11', prazoTipo: 'Prazo legal', ord: 13 * 1440, hoje: false,
      estado: 'Aguardando', aberto: '22/10 10:05', idade: '4 d', upd: '13:10', next: 'conferir identidade', cta: 'Conferir identidade', ic: 'lock',
      solicitante: 'a própria titular · ••••@gmail.com', objetos: 'conta da aluna · contratações · recibos', pend: 'recibos do processador (fora desde 13:10)', nota: 'Pedido feito pela área do aluno, com sessão confirmada.', regra: 'Política de privacidade v4 · 15/09',
      evid: [{ name: 'Sessão da titular', orig: 'área do aluno · 22/10 10:05', val: 'válida', conf: 'sim', cls: 'ok' }, { name: 'Recibos de pagamento', orig: 'processador · 26/10 13:10', val: 'indisponível', conf: 'pendente', cls: 'warn' }],
      decs: [{ k: 'liberar', label: 'Confirmar identidade e gerar exportação', campo: 'Exportação', antes: 'não gerada', depois: 'gerada · link de 7 dias para a titular', muda: 'Gera arquivo com conta, contratações e recibos', afeta: 'Ana C.', afetaN: '1 pessoa', rev: 'não · o link expira em 7 dias', naoMuda: 'conta, contratações, recibos', estado: 'Decidido', why: '', rec: 'Exportação gerada', steps: [['Identidade conferida', 'ok'], ['Arquivo da conta', 'ok'], ['Recibos do processador', 'falha'], ['Aviso à titular', 'fila']] }],
      hist: [{ at: '22/10 10:05', who: 'Ana C.', what: 'Pedido de exportação', why: 'Feito pela área do aluno', ref: '' }, { at: '23/10 08:00', who: 'sistema', what: 'Atribuído a Lia M.', why: 'Fila de privacidade', ref: '' }, { at: '26/10 13:10', who: 'sistema', what: 'Processador fora do ar', why: 'Recibos não podem ser gerados agora', ref: '' }] },
    { id: 'c298', proto: '#C-298', tipo: 'Avaliação', dom: 'conteudo', titulo: 'Avaliação denunciada', head: 'Restrição de avaliação sem confirmação', sub: 'Aviso a Pedro S. não confirmou. Consulte a mesma referência.',
      obj: 'Avaliação #AV-552 · Pedro S.', alvo: 'Avaliação #AV-552', origem: 'denúncia do treinador', prio: 'média', prioWhy: '3 denúncias agrupadas · recurso aberto', resp: 'lia', prazo: 'não definido', prazoTipo: 'Prazo', ord: 999999, hoje: false,
      estado: 'Recurso', aberto: '25/10 11:02', idade: '1 d', upd: '11:20', next: 'reavaliar recurso', cta: 'Consultar R-298', ic: 'clock',
      solicitante: 'Thiago P. (treinador avaliado)', objetos: 'avaliação #AV-552 · perfil /thiago-pereira', pend: 'aviso a Pedro S. sem confirmação', nota: 'Pedro recorreu pela própria página da avaliação.', regra: 'Diretrizes v3 · linguagem ofensiva',
      rev: { autor: 'Pedro S.', sobre: 'Thiago P.', nota: 2, texto: 'Treino genérico, não respondeu. E o cara é um [termo ofensivo].', publico: 'Treino genérico, não respondeu. E o cara é um [trecho oculto pela moderação].', curto: 'Treino genérico, não respondeu.', eleg: 'contratou 26/06–26/09 · válida', elegOk: true, motivo: 'ofensa', n: 3, denuncia: 'treinador', efeito: 'restringida', recurso: 'era crítica, não ofensa' },
      evid: [{ name: 'Denúncias agrupadas', orig: 'treinador e 2 alunos · 23/10', val: '3 do mesmo objeto', conf: 'ofensa', cls: 'warn' }, { name: 'Contratação', orig: 'pedido #PD-1180 · 26/06', val: '26/06–26/09', conf: 'sim', cls: 'ok' }],
      decs: [
        { k: 'manter', label: 'Manter sem restrição', short: 'Manter', campo: 'Texto público', antes: 'termo oculto', depois: 'texto completo', muda: 'Texto completo volta a aparecer; nota 2 permanece; motivo enviado às partes.', afeta: 'Pedro S. · Thiago P.', afetaN: '2 pessoas', rev: 'sim · por novo caso', naoMuda: 'a nota 2 de 5', estado: 'Mantida', why: '', rec: 'Avaliação mantida', eff: { rev: 'mantida' },
          steps: [['Texto completo publicado', 'ok'], ['Denúncias encerradas', 'ok'], ['Motivo enviado às partes', 'and']] },
        { k: 'restringir', label: 'Restringir o termo ofensivo', short: 'Restringir', campo: 'Texto público', antes: 'texto completo', depois: 'termo oculto', muda: 'Termo ofensivo ocultado; nota 2 permanece; Pedro é avisado e pode editar. Ninguém altera a nota.', afeta: 'Pedro S. · Thiago P.', afetaN: '2 pessoas', rev: 'sim · por recurso', naoMuda: 'a nota 2 de 5 e o restante do texto', estado: 'Restringida', why: 'Linguagem ofensiva contra o treinador; a crítica ao treino é legítima e continua visível.', rec: 'Restrição mantida', eff: { rev: 'restringida' },
          steps: [['Termo ocultado', 'ok'], ['Nota 2 mantida', 'ok'], ['Aviso a Pedro S.', 'desc']] },
        { k: 'retirar', label: 'Retirar a avaliação', short: 'Retirar', campo: 'Avaliação', antes: 'visível', depois: 'retirada · histórico só para operação', muda: 'Avaliação sai da página e deixa de contar na média; Pedro é avisado e pode recorrer.', afeta: 'Pedro S. · Thiago P.', afetaN: '2 pessoas', rev: 'sim · por recurso', naoMuda: 'o histórico, guardado só para a operação', estado: 'Retirada', why: '', rec: 'Avaliação retirada', eff: { rev: 'retirada' },
          steps: [['Avaliação ocultada', 'ok'], ['Média recalculada', 'ok'], ['Aviso a Pedro S.', 'and']] }
      ],
      hist: [{ at: '23/10 18:20', who: 'sistema', what: '3 denúncias agrupadas', why: 'motivo informado: ofensa', ref: '' }, { at: '24/10 10:15', who: 'Lia M.', what: 'Restringida', why: 'linguagem ofensiva · Diretrizes v3', ref: 'R-298' }, { at: '25/10 11:02', who: 'Pedro S.', what: 'Recurso', why: '“era crítica, não ofensa”', ref: '' }, { at: '26/10 11:20', who: 'Lia M.', what: 'Consulta de R-298', why: 'aviso a Pedro S. ainda sem confirmação', ref: 'R-298' }] },
    { id: 'c305', proto: '#C-305', tipo: 'Titularidade', dom: 'perfis', titulo: 'Conflito de titularidade', head: 'Duas contas pedem /ana-ribeiro', sub: 'Documento novo em 25/10. Edição pública suspensa até a decisão.',
      obj: 'Perfil · Ana R.', alvo: 'Perfil · Ana Ribeiro', origem: 'claim', prio: 'alta', prioWhy: 'prazo do claim', resp: '', prazo: '27/10 18:00', prazoTipo: 'Prazo do claim', ord: 1678, hoje: false,
      estado: 'Novo', aberto: '25/10 08:40', idade: '1 d', upd: '25/10 17:02', next: 'comparar reivindicações', cta: 'Comparar', ic: 'users',
      solicitante: 'conta ••••07', objetos: 'perfil /ana-ribeiro · claims #CL-71 e #CL-90', pend: 'decisão de titularidade', nota: '', regra: 'Política de titularidade v2 · 01/10', verif: 'anar',
      claims: [{ conta: '••••21', prova: 'código · 20/10', ant: 'aceita 20/10', nota: 'Titular atual', cls: 'ok' }, { conta: '••••07', prova: 'documento · 25/10', ant: '—', nota: 'Alega conta antiga perdida', cls: 'warn' }],
      evid: [{ name: 'Código no direct', orig: 'conta ••••21 · 20/10', val: 'válido', conf: 'sim', cls: 'ok' }, { name: 'Documento', orig: 'conta ••••07 · 25/10', val: 'mascarado', conf: 'conflita', cls: 'warn' }],
      decs: [
        { k: 'manter21', label: 'Manter titular atual (••••21)', campo: 'Titular', antes: 'conta ••••21', depois: 'conta ••••21', muda: 'Contestação recusada; edição pública liberada', afeta: 'contas ••••21 e ••••07', afetaN: '2 pessoas', rev: 'sim · por novo caso', naoMuda: 'CREF, foto, avaliações', estado: 'Decidido', why: '', rec: 'Titular mantido', eff: { verif: ['anar', 'tit', 'confirmada'] },
          steps: [['Contestação encerrada', 'ok'], ['Edição pública liberada', 'ok'], ['Aviso às partes', 'and']] },
        { k: 'transferir', label: 'Transferir para a conta ••••07', campo: 'Titular', antes: 'conta ••••21', depois: 'conta ••••07', muda: 'Muda titular e selo “Perfil do treinador”', afeta: 'contas ••••21 e ••••07', afetaN: '2 pessoas', rev: 'sim · por novo caso', naoMuda: 'CREF, foto, avaliações', estado: 'Decidido', why: '', rec: 'Titularidade transferida', eff: { verif: ['anar', 'tit', 'confirmada'] },
          steps: [['Titular gravado', 'ok'], ['Selo atualizado no perfil', 'ok'], ['Aviso às partes', 'and'], ['Índice de busca', 'fila']] }
      ],
      hist: [{ at: '20/10 11:30', who: 'Caio R.', what: 'Claim aceito', why: 'código no direct · conta ••••21', ref: 'R-271' }, { at: '25/10 08:40', who: 'conta ••••07', what: 'Contestação', why: 'alega conta antiga perdida', ref: '' }, { at: '25/10 17:02', who: 'sistema', what: 'Documento recebido', why: 'enviado pela conta ••••07', ref: '' }] },
    { id: 'c280', proto: '#C-280', tipo: 'Credencial', dom: 'perfis', titulo: 'Correção de CREF', head: 'Correção de CREF aplicada em parte', sub: 'Busca interna não confirmou a mudança.',
      obj: 'Perfil · Marina F.', alvo: 'Selo CREF · Marina F.', origem: 'revisão interna', prio: 'alta', prioWhy: 'informação pública incorreta', resp: 'lia', prazo: '10/11', prazoTipo: 'Prazo aprovado', ord: 15 * 1440, hoje: false,
      estado: 'Parcial', aberto: '25/10 15:10', idade: '1 d', upd: '11:48', next: 'reexecutar etapa da busca', cta: 'Abrir recibo', ic: 'shield',
      solicitante: 'operação', objetos: 'perfil /marina-ferraz · selo CREF', pend: 'busca interna', nota: '', regra: 'Política de credenciais v1 · 01/09',
      evid: [{ name: 'Consulta ao conselho', orig: 'CREF9/PR · 25/10', val: 'registro inativo', conf: 'diverge', cls: 'warn' }],
      decs: [], hist: [{ at: '25/10 15:10', who: 'sistema', what: 'Aberto', why: 'Registro inativo no conselho', ref: '' }, { at: '26/10 11:48', who: 'Lia M.', what: 'Correção de CREF', why: 'selo verificado → informado', ref: 'R-280' }] },
    { id: 'c312', proto: '#C-312', tipo: 'Texto de perfil', dom: 'conteudo', titulo: 'Bio com contato externo', head: 'Bio de Renata S. com contato externo', sub: '1 denúncia · telefone na bio pública.',
      obj: 'Bio · Renata S.', alvo: 'Bio do perfil · Renata S.', origem: 'denúncia de aluno', prio: 'média', prioWhy: '1 denúncia · dado de contato público', resp: '', prazo: 'hoje 22:00', prazoTipo: 'Prazo aprovado', ord: 478, hoje: true,
      estado: 'Novo', aberto: '26/10 08:15', idade: '6 h', upd: '08:15', next: 'revisar texto', cta: 'Revisar', ic: 'type',
      solicitante: 'aluno ••••33', objetos: 'perfil /renata-fit · bio', pend: '—', nota: '', regra: 'Diretrizes v3 · contato fora da plataforma',
      rev: { autor: 'Renata S.', sobre: 'perfil próprio', nota: 0, texto: 'Agende direto pelo meu WhatsApp (43) 9••••-••12 e ganhe 10% de desconto.', publico: 'Agende direto pelo [contato oculto pela moderação] e ganhe 10% de desconto.', curto: 'Agende direto pelo meu WhatsApp…', eleg: 'não se aplica (texto de perfil)', elegOk: true, motivo: 'contato externo', n: 1, denuncia: 'aluno', efeito: 'visível', recurso: '' },
      evid: [{ name: 'Denúncia', orig: 'aluno ••••33 · 26/10 08:15', val: '1 denúncia', conf: 'contato externo', cls: 'warn' }],
      decs: [
        { k: 'manter', label: 'Manter', short: 'Manter', campo: 'Bio', antes: 'visível', depois: 'visível', muda: 'Bio segue como está; denúncia encerrada com motivo.', afeta: 'Renata S.', afetaN: '1 pessoa', rev: 'sim', naoMuda: 'o perfil', estado: 'Mantida', why: '', rec: 'Bio mantida', eff: { rev: 'mantida' }, steps: [['Denúncia encerrada', 'ok'], ['Motivo enviado ao denunciante', 'and']] },
        { k: 'restringir', label: 'Restringir o contato', short: 'Restringir', campo: 'Bio', antes: 'com telefone', depois: 'telefone oculto', muda: 'Telefone ocultado; o restante da bio fica visível; Renata é avisada e pode editar.', afeta: 'Renata S.', afetaN: '1 pessoa', rev: 'sim · por recurso', naoMuda: 'o restante da bio, ofertas e avaliações', estado: 'Restringida', why: '', rec: 'Contato ocultado', eff: { rev: 'restringida' }, steps: [['Telefone ocultado', 'ok'], ['Aviso a Renata S.', 'and']] },
        { k: 'retirar', label: 'Retirar a bio', short: 'Retirar', campo: 'Bio', antes: 'visível', depois: 'retirada', muda: 'Bio inteira sai do perfil até nova edição; Renata é avisada.', afeta: 'Renata S.', afetaN: '1 pessoa', rev: 'sim · por recurso', naoMuda: 'ofertas e avaliações', estado: 'Retirada', why: '', rec: 'Bio retirada', eff: { rev: 'retirada' }, steps: [['Bio ocultada', 'ok'], ['Aviso a Renata S.', 'and']] }
      ],
      hist: [{ at: '26/10 08:15', who: 'aluno ••••33', what: 'Denúncia', why: 'contato externo na bio', ref: '' }] },
    { id: 'c314', proto: '#C-314', tipo: 'Avaliação', dom: 'conteudo', titulo: 'Avaliação denunciada como falsa', head: 'Avaliação de Júlia M. denunciada como falsa', sub: '2 denúncias · contratação a conferir.',
      obj: 'Avaliação #AV-571 · Júlia M.', alvo: 'Avaliação #AV-571', origem: 'denúncia do treinador', prio: 'média', prioWhy: '2 denúncias · elegibilidade a conferir', resp: '', prazo: 'amanhã 12:00', prazoTipo: 'Prazo aprovado', ord: 1318, hoje: false,
      estado: 'Novo', aberto: '26/10 13:50', idade: '12 min', upd: '13:50', next: 'conferir contratação', cta: 'Revisar', ic: 'star',
      solicitante: 'Rafael L. (treinador avaliado)', objetos: 'avaliação #AV-571 · perfil /rafael-lima', pend: 'elegibilidade', nota: '', regra: 'Diretrizes v3 · avaliação sem vínculo',
      rev: { autor: 'Júlia M.', sobre: 'Rafael L.', nota: 1, texto: 'Nunca respondeu e cobrou duas vezes.', publico: 'Nunca respondeu e cobrou duas vezes.', curto: 'Nunca respondeu e cobrou duas vezes.', eleg: 'a conferir · nenhuma contratação com este e-mail', elegOk: false, motivo: 'falsa', n: 2, denuncia: 'treinador', efeito: 'visível', recurso: '' },
      evid: [{ name: 'Contratação', orig: 'busca por e-mail · 26/10', val: 'não encontrada', conf: 'a conferir', cls: 'warn' }],
      decs: [
        { k: 'manter', label: 'Manter', short: 'Manter', campo: 'Avaliação', antes: 'visível', depois: 'visível', muda: 'Avaliação segue publicada; denúncias encerradas com motivo.', afeta: 'Júlia M. · Rafael L.', afetaN: '2 pessoas', rev: 'sim', naoMuda: 'a nota 1 de 5', estado: 'Mantida', why: '', rec: 'Avaliação mantida', eff: { rev: 'mantida' }, steps: [['Denúncias encerradas', 'ok'], ['Motivo enviado às partes', 'and']] },
        { k: 'restringir', label: 'Restringir até conferir', short: 'Restringir', campo: 'Avaliação', antes: 'visível', depois: 'oculta até conferir a contratação', muda: 'Avaliação fica oculta e fora da média até a contratação ser conferida.', afeta: 'Júlia M. · Rafael L.', afetaN: '2 pessoas', rev: 'sim', naoMuda: 'a nota, que ninguém altera', estado: 'Restringida', why: '', rec: 'Avaliação restringida', eff: { rev: 'restringida' }, steps: [['Avaliação ocultada', 'ok'], ['Média recalculada', 'ok'], ['Aviso a Júlia M.', 'and']] },
        { k: 'retirar', label: 'Retirar a avaliação', short: 'Retirar', campo: 'Avaliação', antes: 'visível', depois: 'retirada · histórico só para operação', muda: 'Avaliação sai da página e da média; Júlia é avisada e pode recorrer.', afeta: 'Júlia M. · Rafael L.', afetaN: '2 pessoas', rev: 'sim · por recurso', naoMuda: 'o histórico, guardado só para a operação', estado: 'Retirada', why: '', rec: 'Avaliação retirada', eff: { rev: 'retirada' }, steps: [['Avaliação ocultada', 'ok'], ['Média recalculada', 'ok'], ['Aviso a Júlia M.', 'and']] }
      ],
      hist: [{ at: '26/10 13:50', who: 'Rafael L.', what: 'Denúncia', why: 'avaliação falsa · sem contratação', ref: '' }, { at: '26/10 13:52', who: 'aluno ••••41', what: 'Denúncia agrupada', why: 'mesmo objeto', ref: '' }] },
    { id: 'c307', proto: '#C-307', tipo: 'Perfil importado', dom: 'perfis', titulo: 'Retirada de perfil importado', head: 'Retirada · perfil importado sem conta', sub: 'Pedido de retirada de quem aparece no perfil.',
      obj: 'Perfil importado · Marcos Lima', alvo: 'Perfil importado · Marcos Lima', origem: 'fonte pública', prio: 'alta', prioWhy: 'pedido de retirada', resp: '', prazo: '28/10', prazoTipo: 'Prazo aprovado', ord: 2 * 1440 + 200, hoje: false,
      estado: 'Aguardando', aberto: '26/10 12:30', idade: '2 h', upd: '12:30', next: 'retirar perfil', cta: 'Abrir', ic: 'user',
      solicitante: 'Marcos Lima (e-mail confirmado)', objetos: 'perfil importado /marcos-lima', pend: '—', nota: '', regra: 'Política de perfis importados v1 · 01/08', verif: 'marcos',
      evid: [{ name: 'Fonte do perfil', orig: 'diretório público · 02/2026', val: 'importado', conf: 'sem conta', cls: 'plain' }],
      decs: [{ k: 'retirar', label: 'Retirar perfil importado', campo: 'Perfil', antes: 'público', depois: 'retirado', muda: 'Perfil sai da busca e da página pública; fonte fica bloqueada para nova importação.', afeta: 'Marcos Lima', afetaN: '1 pessoa', rev: 'só se ele reivindicar o perfil', naoMuda: 'nenhum outro perfil', estado: 'Decidido', why: '', rec: 'Perfil importado retirado', eff: { verif: ['marcos', 'tit', 'retirado'] }, steps: [['Página pública removida', 'ok'], ['Busca interna', 'fila'], ['Bloqueio da fonte', 'ok']] }],
      hist: [{ at: '26/10 12:30', who: 'Marcos Lima', what: 'Pedido de retirada', why: 'não autorizou o perfil', ref: '' }] },
    { id: 'c290', proto: '#C-290', tipo: 'Privacidade', dom: 'privacidade', titulo: 'Exclusão de conta', head: 'Pedido de exclusão de conta', sub: 'Em conferência com Caio R.',
      obj: 'Conta · ••••19', alvo: 'Conta · ••••19', origem: 'pedido do titular', prio: 'alta', prioWhy: 'prazo legal', resp: 'caio', prazo: '28/10', prazoTipo: 'Prazo legal', ord: 2 * 1440, hoje: false,
      estado: 'Aguardando', aberto: '20/10 09:00', idade: '6 d', upd: '25/10', next: 'aguardar Caio R.', cta: 'Abrir', ic: 'lock',
      solicitante: 'o próprio titular', objetos: 'conta ••••19', pend: 'retenção fiscal', nota: '', regra: 'Política de privacidade v4 · 15/09', evid: [], decs: [],
      hist: [{ at: '20/10 09:00', who: 'titular', what: 'Pedido de exclusão', why: 'área da conta', ref: '' }] },
    { id: 'c309', proto: '#C-309', tipo: 'Credencial', dom: 'perfis', titulo: 'CREF vencido', head: 'CREF vencido em perfil ativo', sub: 'Consulta ao conselho indica registro vencido.',
      obj: 'Perfil · Bruno A.', alvo: 'Selo CREF · Bruno A.', origem: 'revisão periódica', prio: 'média', prioWhy: 'revisão periódica', resp: 'lia', prazo: '12/11', prazoTipo: 'Prazo aprovado', ord: 17 * 1440, hoje: false,
      estado: 'Em análise', aberto: '25/10 07:00', idade: '1 d', upd: '25/10', next: 'pedir comprovante', cta: 'Abrir', ic: 'shield',
      solicitante: 'operação', objetos: 'perfil /bruno-alves · selo CREF', pend: 'comprovante', nota: '', regra: 'Política de credenciais v1 · 01/09', evid: [], decs: [],
      hist: [{ at: '25/10 07:00', who: 'sistema', what: 'Aberto', why: 'revisão periódica do CREF', ref: '' }] },
    { id: 'c311', proto: '#C-311', tipo: 'Foto', dom: 'perfis', titulo: 'Foto sem licença', head: 'Foto de perfil sem licença confirmada', sub: 'Imagem de banco sem licença informada.',
      obj: 'Perfil · Paulo V.', alvo: 'Foto do perfil · Paulo V.', origem: 'denúncia de terceiro', prio: 'média', prioWhy: 'direito de imagem', resp: 'lia', prazo: '13/11', prazoTipo: 'Prazo aprovado', ord: 18 * 1440, hoje: false,
      estado: 'Novo', aberto: '26/10 10:00', idade: '4 h', upd: '10:00', next: 'pedir licença', cta: 'Abrir', ic: 'camera',
      solicitante: 'agência de imagens', objetos: 'perfil /paulo-vieira · foto', pend: 'licença', nota: '', regra: 'Política de imagens v1 · 01/09', evid: [], decs: [],
      hist: [{ at: '26/10 10:00', who: 'agência de imagens', what: 'Denúncia', why: 'foto sem licença', ref: '' }] },
    { id: 'c306', proto: '#C-306', tipo: 'Credencial', dom: 'perfis', titulo: 'Selo CREF divergente', head: 'Selo CREF “verificado” sem consulta ao conselho', sub: 'O registro de /thiago-pereira foi só declarado.',
      obj: 'Perfil · Thiago P.', alvo: 'Selo CREF · Thiago Pereira', origem: 'revisão interna', prio: 'média', prioWhy: 'informação pública incorreta', resp: 'lia', prazo: '14/11', prazoTipo: 'Prazo aprovado', ord: 19 * 1440, hoje: false,
      estado: 'Em análise', aberto: '24/10 16:00', idade: '2 d', upd: '24/10', next: 'corrigir selo público', cta: 'Abrir', ic: 'shield',
      solicitante: 'operação', objetos: 'perfil /thiago-pereira · selo CREF', pend: 'correção pública', nota: 'Selo marcado como verificado na importação, sem consulta ao CREF4/SP.', regra: 'Política de credenciais v1 · 01/09', verif: 'thiago',
      evid: [{ name: 'Consulta ao conselho', orig: 'CREF4/SP · nenhuma registrada', val: '—', conf: 'ausente', cls: 'warn' }, { name: 'Declaração do treinador', orig: 'cadastro · 02/2026', val: 'declarado', conf: 'sim', cls: 'ok' }],
      decs: [], hist: [{ at: '24/10 16:00', who: 'sistema', what: 'Aberto', why: 'selo verificado sem consulta registrada', ref: '' }] },
    { id: 'c288', proto: '#C-288', tipo: 'Avaliação', dom: 'conteudo', titulo: 'Avaliação denunciada', head: 'Avaliação de Sofia R. mantida', sub: 'Crítica sem ofensa.',
      obj: 'Avaliação #AV-530 · Sofia R.', alvo: 'Avaliação #AV-530', origem: 'denúncia do treinador', prio: 'baixa', prioWhy: '1 denúncia', resp: 'lia', prazo: '—', prazoTipo: 'Prazo', ord: 999999, hoje: false,
      estado: 'Encerrado', aberto: '25/10 09:00', idade: '1 d', upd: '10:12', next: '—', cta: 'Abrir', ic: 'star',
      solicitante: 'treinador avaliado', objetos: 'avaliação #AV-530', pend: '—', nota: '', regra: 'Diretrizes v3', evid: [], decs: [],
      hist: [{ at: '26/10 10:12', who: 'Lia M.', what: 'Avaliação mantida', why: 'crítica sem ofensa · Diretrizes v3', ref: 'R-288' }] }
  ].map(function (c) { c.denuncias = c.rev ? c.rev.n : 0; return c; }));

  DB.seed('o1_recibos', [
    { id: 'R-301-0', caso: 'c301', title: 'Atribuído a você', at: '26/10 09:30', who: 'Lia M.', why: 'Fila de titularidade · perfis.decidir', steps: [stp('Responsável gravado', 'ok', '09:30')] },
    { id: 'R-288', caso: 'c288', title: 'Avaliação mantida', at: '26/10 10:12', who: 'Lia M.', why: 'crítica sem ofensa · Diretrizes v3', steps: [stp('Denúncias encerradas', 'ok', '10:12'), stp('Motivo enviado às partes', 'ok', '10:13')] },
    { id: 'R-280', caso: 'c280', title: 'Correção de CREF', at: '26/10 11:48', who: 'Lia M.', why: 'registro inativo no CREF9/PR', steps: [stp('Banco', 'ok', '11:48'), stp('Página pública', 'ok', '11:49'), stp('Busca interna', 'falha', '11:50')] },
    { id: 'R-298', caso: 'c298', title: 'Restrição de avaliação', at: '24/10 10:15', who: 'Lia M.', why: 'linguagem ofensiva · Diretrizes v3', steps: [stp('Termo ocultado', 'ok', '10:15'), stp('Nota 2 mantida', 'ok', '10:15'), stp('Aviso a Pedro S.', 'desc', '')] }
  ]);

  // fila de verificações: dimensões independentes (titularidade, CREF, foto)
  DB.seed('o1_verif', [
    { id: 'thiago', nome: 'Thiago P.', full: 'Thiago Pereira', slug: '/thiago-pereira', ig: '@thiago.coach', origem: 'própria', tit: 'contestada', cref: 'verificado', crefNum: '012345-G/SP', crefNota: 'selo divergente: o registro foi só declarado', foto: 'própria', resp: '', caso: 'c301', crefCaso: 'c306', pend: 'insuficiente' },
    { id: 'marcos', nome: 'Marcos Lima', full: 'Marcos Lima', slug: '/marcos-lima', ig: '—', origem: 'importado', tit: 'não reivindicado', cref: '—', crefNum: '', crefNota: '', foto: 'sem direito', resp: '', caso: 'c307', pend: 'nao' },
    { id: 'anar', nome: 'Ana Ribeiro', full: 'Ana Ribeiro', slug: '/ana-ribeiro', ig: '@ana.ribeiro.fit', origem: 'própria', tit: 'conflito', cref: 'verificado 20/10', crefNum: '045678-G/PR', crefNota: '', foto: 'própria', resp: 'Caio', caso: 'c305', pend: 'conflito' },
    { id: 'marina', nome: 'Marina F.', full: 'Marina Ferraz', slug: '/marina-ferraz', ig: '@marina.ferraz', origem: 'própria', tit: 'confirmada', cref: 'correção parcial', crefNum: '033221-G/PR', crefNota: '', foto: 'própria', resp: 'Lia', caso: 'c280', pend: 'revisao' },
    { id: 'brunoa', nome: 'Bruno A.', full: 'Bruno Alves', slug: '/bruno-alves', ig: '@brunoalves.pt', origem: 'própria', tit: 'confirmada', cref: 'vencido', crefNum: '021987-G/PR', crefNota: '', foto: 'própria', resp: 'Lia', caso: 'c309', pend: 'expirada' },
    { id: 'paulov', nome: 'Paulo V.', full: 'Paulo Vieira', slug: '/paulo-vieira', ig: '@paulov', origem: 'própria', tit: 'confirmada', cref: 'informado', crefNum: '019876-G/PR', crefNota: '', foto: 'sem licença', resp: 'Lia', caso: 'c311', pend: 'insuficiente' },
    { id: 'renata', nome: 'Renata S.', full: 'Renata Santos', slug: '/renata-fit', ig: '@renata.fit', origem: 'própria', tit: 'claim conferido', cref: 'informado', crefNum: '055443-G/PR', crefNota: '', foto: 'própria', resp: '', caso: '', pend: 'revisao' }
  ]);

  DB.seed('o1_aggr', {
    fonte: 'Analytics atualizado até 25/10 23:00', coorte: 'Coorte out/2026 · web e app',
    j: {
      cadastro: { label: 'Cadastro → publicação', curto: 'Cadastro', q: 'Quantos treinadores que confirmaram cadastro publicaram o perfil?', kpis: [['Cadastros confirmados', '412', ''], ['Perfis publicados', '188', ''], ['Publicação', '46%', '188 de 412'], ['Tempo mediano', '—', 'amostra pequena']], base: 'Base: 412 cadastros confirmados · até 25/10 23:00', pct: 46,
        rec: { canal: [['Canal web', '301', '98%', 'evento v3'], ['App', '111', '91%', 'evento v3']], idioma: [['PT-BR', '398', '97%', 'evento v3'], ['EN', '9', '—', 'amostra insuficiente'], ['ES', '5', '—', 'amostra insuficiente']] } },
      pedido: { label: 'Descoberta → pedido', curto: 'Pedido', q: 'Quantos visitantes que viram um perfil enviaram pedido?', kpis: [['Perfis vistos', '4 112', 'sessões únicas'], ['Pedidos enviados', '236', ''], ['Pedido por perfil visto', '5,7%', '236 de 4 112'], ['Tempo até pedido', '2 d', 'mediana']], base: 'Base: 4 112 sessões com perfil visto · até 25/10 23:00', pct: 6,
        rec: { canal: [['Canal web', '3 380', '96%', 'evento v3'], ['App', '732', '90%', 'evento v3']], idioma: [['PT-BR', '4 020', '96%', 'evento v3'], ['EN', '61', '—', 'amostra insuficiente'], ['ES', '31', '—', 'amostra insuficiente']] } },
      convite: { label: 'Convite → 1º treino', curto: 'Convite', q: 'Quantos alunos convidados fizeram o primeiro treino?', kpis: [['Convites enviados', '318', ''], ['Vínculos aceitos', '204', ''], ['1º treino feito', '151', ''], ['Do convite ao 1º treino', '47%', '151 de 318']], base: 'Base: 318 convites enviados · até 25/10 23:00', pct: 47,
        rec: { canal: [['Canal web', '201', '97%', 'evento v3'], ['App', '117', '92%', 'evento v3']], idioma: [['PT-BR', '311', '97%', 'evento v3'], ['EN', '7', '—', 'amostra insuficiente']] } }
    },
    importados: '1 204'
  });

  DB.seed('o1_faq', {
    id: 'faq-pro-teste', slug: 'FAQ/pro-teste', status: 'rascunho', ver: 4, fonte: 'política v2',
    langs: {
      pt: { st: 'rascunho', q: 'Como funciona o teste do Pro?', a: 'Você ativa o teste quando quiser. São 7 dias com cartão; cancele no painel antes do fim para não ser cobrado. Valor: [aguarda política aprovada].' },
      en: { st: 'faltando', q: '', a: '' },
      es: { st: 'v3', q: '¿Cómo funciona la prueba de Pro?', a: 'Activas la prueba cuando quieras. Son 7 días con tarjeta; cancela en el panel antes del final para que no se te cobre.' }
    },
    versions: [{ v: 'v4', st: 'rascunho', who: 'Lia', at: 'hoje', fonte: '' }, { v: 'v3', st: 'ativa', who: 'Caio', at: '01/10', fonte: 'política v2' }]
  });

  DB.seed('o1_vocab', {
    sel: 'mod_calistenia',
    termos: [
      { id: 'mod_calistenia', nome: 'Calistenia', tipo: 'modalidade', prop: 'street workout', propTipo: 'sinônimo', en: 'Calisthenics', es: 'Calistenia', sin: ['barras paralelas'], fonte: 'pedido de 6 treinadores · 12/10', estado: 'proposta', uso: [['Busca', '312 perfis', '+18 perfis'], ['Páginas SEO', '4 URLs', 'sem mudança'], ['Perfis', '312', '312 · sem reetiquetar']] },
      { id: 'mod_crossfit', nome: 'CrossFit', tipo: 'modalidade', prop: '', propTipo: '', en: 'CrossFit', es: 'CrossFit', sin: ['cross training'], fonte: 'catálogo base · 01/2026', estado: 'aprovado', uso: [['Busca', '1 120 perfis', '—'], ['Páginas SEO', '18 URLs', '—'], ['Perfis', '1 120', '—']] },
      { id: 'mod_musculacao', nome: 'Musculação', tipo: 'modalidade', prop: '', propTipo: '', en: 'Strength training', es: 'Musculación', sin: ['academia'], fonte: 'catálogo base · 01/2026', estado: 'aprovado', uso: [['Busca', '2 340 perfis', '—'], ['Páginas SEO', '26 URLs', '—'], ['Perfis', '2 340', '—']] },
      { id: 'loc_centro', nome: 'Centro (Londrina)', tipo: 'local', prop: '', propTipo: '', en: 'Downtown (Londrina)', es: 'Centro (Londrina)', sin: [], fonte: 'IBGE · 2025', estado: 'aprovado', uso: [['Busca', '88 perfis', '—'], ['Páginas SEO', '1 URL', '—'], ['Perfis', '88', '—']] },
      { id: 'svc_online', nome: 'Acompanhamento online', tipo: 'serviço', prop: '', propTipo: '', en: 'Online coaching', es: '', sin: ['consultoria online'], fonte: 'catálogo base · 01/2026', estado: 'aprovado', uso: [['Busca', '1 870 perfis', '—'], ['Páginas SEO', '9 URLs', '—'], ['Perfis', '1 870', '—']] }
    ]
  });

  // ---------- utilidades ----------
  var STEP = { ok: ['Confirmado', 'badge badge--ok'], and: ['Em andamento', 'badge badge--info'], fila: ['Na fila', 'badge badge--plain'], desc: ['Desconhecido', 'badge badge--warn'], falha: ['Falhou', 'badge badge--risk'], na: ['Não se aplica', 'badge badge--plain'] };
  var DOM = {
    perfis: { nome: 'Titularidade e credenciais', cap: 'perfis.decidir' },
    conteudo: { nome: 'Avaliações denunciadas', cap: 'conteudo.decidir' },
    privacidade: { nome: 'Privacidade', cap: 'privacidade.decidir' },
    financeiro: { nome: 'Financeiro', cap: 'financeiro.decidir' }
  };
  var O1 = window.O1 = {
    STEP: STEP, DOM: DOM,
    noop: function () {},
    me: function () { return DB.o1_me; },
    caso: function (id) { return DB.find('o1_casos', id); },
    recibo: function (id) { return DB.find('o1_recibos', id); },
    member: function (id) { return DB.find('o1_equipe', id); },
    respName: function (id) { var m = id ? DB.find('o1_equipe', id) : null; return m ? m.name.split(' ')[0] : '—'; },
    // relógio do protótipo: começa às 14:05 de 26/10 e anda um minuto por ação
    tick: function () { var c = DB.o1_clock; c.m += 1; return ('0' + Math.floor(c.m / 60)).slice(-2) + ':' + ('0' + (c.m % 60)).slice(-2); },
    bar: function (cap, alvo, upd) { return [{ k: 'Ambiente', v: 'Produção · dados sintéticos' }, { k: 'Capacidade', v: cap }, { k: 'Alvo', v: alvo }, { k: 'Atualizado', v: upd || '26/10 · 14:02 BRT' }]; },
    // capacidade da Lia para decidir no domínio do caso
    canDecide: function (c) { return !!c && DB.o1_me.caps[c.dom] === 'decidir'; },
    canRead: function (c) { var v = c ? DB.o1_me.caps[c.dom] : ''; return v === 'decidir' || v === 'ler'; },
    isOpen: function (c) { return c.estado !== 'Encerrado'; },
    open: function () { return DB.o1_casos.filter(O1.isOpen).slice().sort(function (a, b) { return a.ord - b.ord; }); },
    mine: function () { return O1.open().filter(function (c) { return c.resp === DB.o1_me.id; }); },
    estadoCls: function (e) { return 'badge ' + ({ 'Em análise': 'badge--info', 'Novo': 'badge--plain', 'Aguardando': 'badge--plain', 'Recurso': 'badge--warn', 'Parcial': 'badge--warn', 'Decidido': 'badge--ok', 'Restringida': 'badge--ok', 'Mantida': 'badge--ok', 'Retirada': 'badge--ok', 'Encerrado': 'badge--ink' }[e] || 'badge--plain'); },
    alert: function (kind, title, text, act, fn) {
      return { cls: 'alert alert--' + kind + ' o1-alert', ic: 'ic ic--sm i-' + ({ info: 'info', warn: 'alert', risk: 'alert', ok: 'check' }[kind] || 'info'), title: title, text: text || '', hasAct: !!act, act: act || '', do: fn || O1.noop };
    },
    step: function (s) { var m = STEP[s.st] || STEP.fila; return { name: s.name, at: s.at || '—', label: m[0], cls: m[1] }; },
    recState: function (r) {
      var sts = r.steps.map(function (s) { return s.st; });
      if (sts.indexOf('falha') >= 0) return { key: 'parcial', label: 'Falha parcial', cls: 'badge badge--risk' };
      if (sts.indexOf('desc') >= 0) return { key: 'desc', label: 'Resultado desconhecido', cls: 'badge badge--warn' };
      if (sts.indexOf('and') >= 0 || sts.indexOf('fila') >= 0) return { key: 'and', label: 'Em andamento', cls: 'badge badge--info' };
      return { key: 'ok', label: 'Concluído', cls: 'badge badge--ok' };
    },
    hist: function (c, what, why, ref) { c.hist.push({ at: '26/10 ' + O1.tick(), who: DB.o1_me.short, what: what, why: why || '', ref: ref || '' }); c.upd = c.hist[c.hist.length - 1].at.slice(6); },
    nextRef: function (c) {
      var base = 'R-' + c.proto.replace(/[^0-9]/g, ''), n = DB.o1_recibos.filter(function (r) { return r.caso === c.id; }).length;
      var id = base + '-' + n; while (O1.recibo(id)) { n++; id = base + '-' + n; }
      return id;
    },
    // grava um recibo auditável (quem, quando, por quê, etapas) e o liga ao histórico do caso
    receipt: function (c, title, why, steps) {
      var at = O1.tick();
      var r = { id: c ? O1.nextRef(c) : 'R-' + (900 + DB.o1_recibos.length), caso: c ? c.id : '', title: title, at: '26/10 ' + at, who: DB.o1_me.short, why: why, steps: steps.map(function (s) { return { name: s[0], st: s[1], at: s[1] === 'ok' ? at : '' }; }) };
      DB.o1_recibos.push(r);
      if (c) { c.hist.push({ at: r.at, who: r.who, what: title, why: why, ref: r.id }); c.upd = at; }
      DB.o1_clock.last = r.id;
      return r;
    },
    // aplica uma decisão: muda o estado do caso, efeitos nas filas e emite recibo
    apply: function (c, dec, why, mode) {
      var steps = dec.steps.map(function (s) { return s.slice(); });
      if (mode === 'falha') steps = steps.map(function (s, i) { return i === steps.length - 1 ? [s[0], 'falha'] : s; });
      if (mode === 'desc') steps = steps.map(function (s, i) { return i === 0 ? s : [s[0], 'desc']; });
      var r = O1.receipt(c, dec.rec || dec.label, why, steps);
      c.estado = dec.estado; c.decisao = { k: dec.k, label: dec.label, ref: r.id, why: why };
      c.proposta = null;
      var eff = dec.eff || {};
      if (eff.verif) { var p = DB.find('o1_verif', eff.verif[0]); if (p) { p[eff.verif[1]] = eff.verif[2]; p.pend = 'ok'; } }
      if (eff.rev && c.rev) c.rev.efeito = eff.rev;
      return r;
    },
    // consulta a mesma referência: não repete o comando, só lê o resultado
    consult: function (r) {
      var at = O1.tick(), changed = 0;
      r.steps.forEach(function (s) { if (s.st === 'desc' || s.st === 'and' || s.st === 'fila') { s.st = 'ok'; s.at = at; changed++; } });
      var c = r.caso ? O1.caso(r.caso) : null;
      if (c) { c.hist.push({ at: '26/10 ' + at, who: DB.o1_me.short, what: 'Consulta de ' + r.id, why: changed ? 'etapas pendentes confirmadas sem repetir o comando' : 'nada mudou desde a última consulta', ref: r.id }); c.upd = at; if (c.estado === 'Parcial' && O1.recState(r).key === 'ok') c.estado = 'Decidido'; }
      return changed;
    },
    // reexecuta só as etapas que falharam
    retry: function (r) {
      var at = O1.tick(), names = [];
      r.steps.forEach(function (s) { if (s.st === 'falha') { s.st = 'ok'; s.at = at; names.push(s.name); } });
      var c = r.caso ? O1.caso(r.caso) : null;
      if (c) { c.hist.push({ at: '26/10 ' + at, who: DB.o1_me.short, what: 'Reexecução em ' + r.id, why: 'só a etapa que falhou: ' + (names.join(', ') || '—'), ref: r.id }); c.upd = at; if (c.estado === 'Parcial' && O1.recState(r).key === 'ok') c.estado = 'Decidido'; }
      return names.length;
    },
    histView: function (c, go) {
      return (c ? c.hist : []).slice().reverse().map(function (h) {
        return { at: h.at, who: h.who, what: h.what, why: h.why, hasWhy: !!h.why, ref: h.ref, hasRef: !!h.ref, open: function () { go('OPS02.D', { id: h.ref }); } };
      });
    },
    row: function (c, ctx, sel, deny) {
      var restricted = !O1.canRead(c) || (!!deny && deny === c.dom);
      return {
        id: c.id, proto: c.proto, tipo: c.tipo, obj: restricted ? 'Conteúdo restrito' : c.obj, prio: c.prio + ' · ' + c.prioWhy, prioTxt: c.prio, prioWhy: c.prioWhy,
        resp: O1.respName(c.resp), prazo: c.prazo, estado: c.estado, estCls: O1.estadoCls(c.estado), origem: c.origem, idade: O1.age(c.aberto),
        hoje: c.hoje, prazoCls: 'o1-prazo' + (c.hoje ? ' is-hoje' : ''), restricted: restricted, okRead: !restricted,
        selOn: !!(sel && sel.indexOf(c.id) >= 0), chk: 'check' + (sel && sel.indexOf(c.id) >= 0 ? ' is-on' : ''), pressed: String(!!(sel && sel.indexOf(c.id) >= 0)),
        open: function () { O1.openCase(ctx, c); }
      };
    },
    // destino natural de cada caso
    openCase: function (ctx, c) {
      if (c.dom === 'conteudo' && c.rev) return ctx.go(c.estado === 'Recurso' ? 'OPS04.C' : 'OPS04.B', { id: c.id });
      if (c.id === 'c305') return ctx.go('OPS03.C', { id: c.id });
      if (c.id === 'c306') return ctx.go('OPS03.D', { id: 'thiago' });
      return ctx.go('OPS02.A', { id: c.id });
    },
    capList: function () {
      var k = DB.o1_me.caps, lab = function (v) { return { decidir: 'ler · decidir', ler: 'só ler', atalho: 'atalho para FA01', nenhum: 'sem acesso' }[v] || v; };
      return [{ n: 'Casos', v: lab(k.casos) }, { n: 'Titularidade e credenciais', v: lab(k.perfis) }, { n: 'Avaliações', v: lab(k.conteudo) }, { n: 'Privacidade', v: lab(k.privacidade) }, { n: 'Financeiro', v: lab(k.financeiro) }];
    },
    // idade a partir de "dd/mm hh:mm" (agora: 26/10 14:02)
    age: function (aberto) {
      var m = /^(\d\d)\/(\d\d)\s+(\d\d):(\d\d)/.exec(aberto || ''); if (!m) return '—';
      var d = (10 - Number(m[2])) * 31 + (26 - Number(m[1])), mins = d * 1440 + (14 * 60 + 2) - (Number(m[3]) * 60 + Number(m[4]));
      return mins >= 1440 ? Math.floor(mins / 1440) + ' d' : mins >= 60 ? Math.floor(mins / 60) + ' h' : Math.max(1, mins) + ' min';
    },
    ageMin: function (aberto) {
      var m = /^(\d\d)\/(\d\d)\s+(\d\d):(\d\d)/.exec(aberto || ''); if (!m) return 0;
      return ((10 - Number(m[2])) * 31 + (26 - Number(m[1]))) * 1440 + (14 * 60 + 2) - (Number(m[3]) * 60 + Number(m[4]));
    },
    pickCase: function (ctx, fallback) { return O1.caso(ctx.id) || O1.caso(fallback) || DB.o1_casos[0]; }
  };
})();
