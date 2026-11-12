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
