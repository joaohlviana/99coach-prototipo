# Conferência no banco real (99coach-v2)

Os roteiros `*.mjs` usam um servidor simulado. Eles provam a tela, não o banco.
Por isso cada fase só é dada como concluída depois de conferida no banco real, assim:

- as mesmas consultas e funções que o app chama são executadas **dentro do banco**, agindo como um usuário de verdade
  (`set local role authenticated` + `request.jwt.claims` com o id da conta), em uma transação que termina em `rollback`:
  nada fica gravado;
- treinador = conta de teste; aluno = uma conta de aluno existente (só leitura real, escritas desfeitas).

## Conferido em 12/11/2026 (tudo passou)
Convite individual (com e-mail) → prévia → aceite → preparação (3 perguntas) → pedir complemento → responder de novo →
revisar → atribuir treino → rascunho no servidor → enviar treino → retorno do aluno → mensagem → treinador vê o registro →
comentar → ajustar treino (versão 2) → não lidas → bloquear → denunciar → vagas → lista de convites → aluno pausa, retoma, encerra →
encerrado continua visível com o nome do treinador e os treinos.
Ofertas (várias) → apresentação e disponibilidade → pedir conferência do CREF → disponibilidade de agenda → favorito →
pedido → aluno cancela → aceitar cancelado não muda nada → recusar com motivo → aluno vê o motivo → reivindicar perfil importado →
pedir exclusão → desistir → retirar perfil (some do público) → pedido de retirada sem conta.

## O que essa conferência encontrou (e foi corrigido)
1. A tabela de treinos não tem `submitted_at` (é `received_at`): histórico e evolução não carregavam.
2. A preparação aceita só `objetivo`, `dias`, `local` (até 120 letras): a 4ª pergunta (dor/lesão) travava o envio.
3. Convite individual exige o e-mail do aluno.
4. Publicar perfil e aceitar convite exigem e-mail confirmado.
5. Chave de repetição precisa ter de 8 a 200 letras.

Os simuladores dos roteiros agora recusam os itens 1, 3 e 5, como o banco.


## Fase 7 — biblioteca do treinador (12/11)
Transação desfeita, agindo como o treinador de teste e depois como o aluno:
- primeira gravação cria a versão 1; gravação com a versão certa vira versão 2
- gravação com versão velha **não grava** e devolve o conteúdo atual (o app junta e regrava)
- o treinador lê só a própria biblioteca; o aluno enxerga 0 linhas


## Fase 7 — formulários enviados (12/11)
Transação desfeita, com um vínculo criado só dentro dela:
- treinador envia; repetir com a mesma chave devolve o mesmo envio (1 linha)
- uma terceira conta enxerga 0 linhas; o aluno do vínculo enxerga o formulário
- aluno responde uma vez; responder de novo devolve `changed: false`
- treinador lê a resposta e marca como revisado
- não conferido nesta rodada: recusa quando o aluno tenta marcar revisado/cancelar (a função filtra pelo treinador do vínculo)


## Fase 7 — avisos no app (12/11)
Transação desfeita:
- conta sem nada recebe lista vazia
- aluno vê aviso de formulário e de mensagem não lida: só tipo, de quem e quando (o texto da mensagem não vem)
- silenciar um tipo tira da lista; marcar como visto tira o "novo"
- treinador vê o formulário respondido; uma terceira conta não vê nada nem lê preferências alheias
- não conferido nesta rodada: avisos de pedido, treino, registro, comentário e horário (mesma consulta, sem dados de teste)


## Fase 7 — avisos por e-mail (12/11)
Transação desfeita:
- aluno liga o e-mail; conta comum não tem permissão para ler a fila de envio
- com um formulário novo, a fila traz o aluno com o aviso (tipo e nome, sem texto)
- depois de marcar como enviado, a fila fica vazia; em horário de silêncio, também
- não conferido: envio de verdade pelo Resend (falta a chave nos segredos do Supabase)


## Fase 8 — pagamento (13/11)
Transações desfeitas:
- **defeito**: `decide_request` aceito não criava vínculo (0 vínculos). Corrigido com `activate_accepted_request`: antes de aceitar não faz nada; terceiro é recusado; sem cobrança possível inicia o acompanhamento; chamar de novo não duplica
- sem conta de recebimento, `create_checkout` responde `vendedor_sem_recebimento`
- com conta ativa: cobrança criada (R$ 200, comissão R$ 10); contexto só para o comprador certo
- aviso com valor errado fica `divergente` e não libera nada; aviso certo marca pago, cria o vínculo e o recebível (líquido = bruto − comissão − tarifa); repetir o aviso não duplica; a soma do razão dá zero
- conta comum não tem permissão nas funções de servidor
- **não conferido**: nenhuma chamada real ao Stripe (criar conta, página de pagamento, assinatura do webhook, reembolso)


## Fase 8 — modo real (13/11)
Decisão do dono: produção direto. Transação desfeita:
- ambiente em vigor = `live`
- conta de recebimento criada em teste não cobra no modo real (`vendedor_sem_recebimento`)
- conta real: pedido aceito pede pagamento; cobrança sai com ambiente `live`, R$ 200, comissão R$ 10
- no Stripe real: criado o endereço de avisos `we_1Ub86C…` para contas conectadas, ao lado dos dois do site atual (não alterados)
- **não conferido**: criação de conta de treinador, página de pagamento, aviso de pagamento e reembolso de verdade


## Fase 7 — semana do treino (13/11)
Transação desfeita:
- sem treino atribuído, definir a semana é recusado
- com treino de 2 sessões: a semana é gravada na mesma versão (não cria versão nova)
- dia apontando para sessão que não existe é recusado
- o aluno lê a semana; o aluno não consegue alterá-la


## Repetir a sessão a cada semana (13/11)
Transação desfeita: a mesma sessão registrada em duas semanas, com a chave levando a segunda-feira da semana, vira dois registros distintos e recebidos. Antes, cada sessão de uma versão só podia ser registrada uma vez.


## Avaliações (13/11)
Transação desfeita: vínculo novo sem treino não avalia (`cedo`); com 20 dias grava; editar não duplica; nota fora de 1–5 é recusada; inserir direto na tabela é recusado; quem não foi aluno é recusado; treinador responde, aluno não responde a própria; perfil em rascunho não mostra a terceiros; perfil publicado mostra ao visitante; avaliação oculta some. Nome público sem começo de e-mail ("joao.h.viana" vira "Joao").


## Duas etapas para qualquer conta (13/11)
A checagem roda antes de toda chamada à API. Conferido em transação desfeita: visitante, chamada sem token, conta sem segunda etapa, token estranho e servidor passam; conta com autenticador verificado e sessão sem código é recusada (`42501 segunda_etapa_necessaria`); depois do código passa; outra conta não é afetada. Conferido por fora: o servidor recarregou a configuração e uma chamada real feita depois respondeu 200.
Não conferido com um autenticador de verdade (nenhuma conta ligou ainda).
