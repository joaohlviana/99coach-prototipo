# Verificação: criação e venda de planos e programas

Data: 17/11/2026.

Este documento compara o 99coach atual com o pacote "99COACH-PLANOS-PROGRAMAS-HANDOFF", nas duas camadas:
1. **O que está no ar hoje (conta real):** banco, funções do servidor e telas reais.
2. **As telas do Design System:** as telas de demonstração, consideradas como se tudo existisse, comparadas às regras do pacote.

Esta verificação é só leitura: nada foi alterado no banco nem no código. Os números entre parênteses, como (P01) ou (O06), são os códigos da planilha de critérios de aceite do pacote.

---

## 1. Conclusão curta

- **Cobrança e dinheiro (servidor): bem-feitos.**
  - O preço sai do banco.
  - Há proteção contra cobrança dupla.
  - O aviso do Stripe é conferido no próprio Stripe.
  - O sistema detecta valor e comissão divergentes.
  - O razão financeiro não pode ser alterado (só recebe lançamentos novos).
  - O reembolso devolve a comissão proporcional.
  - Os estados pago, a liberar, liberado, enviado ao banco e recebido são distintos, e uma tarifa desconhecida não vira zero.
  - A compra de programa não cria vínculo nem chat.
  - O acesso dura o número de meses do programa (12, se não informado), contado da confirmação do pagamento.
- **Criação do programa (conta real): simples demais para o pacote.**
  - O conteúdo é um texto livre, sem sessões nem semanas.
  - Não há versões: editar muda o que quem já comprou vê.
  - Publicar já coloca à venda.
  - Não há prévia do aluno, acesso gratuito nem progresso.
- **Falha grave de segurança encontrada:** qualquer visitante, sem conta, consegue ler pela API o conteúdo pago de um programa publicado. Detalhes na seção 2.1.
- **Telas do DS: cobrem quase toda a jornada**, mas têm 10 desvios das regras do pacote, listados na seção 3.
- **Hoje ninguém consegue vender:**
  - as duas contas de recebimento de treinadores estão com cobrança desligada no Stripe (`charges_enabled = false`);
  - só existem 2 pedidos pagos, ambos em ambiente de teste;
  - há 1 programa publicado, que é de teste.

---

## 2. O que está no ar hoje (conta real)

### 2.1 Falha crítica: conteúdo pago aberto

Para conferir, foi feita uma consulta ao banco com o papel de visitante anônimo (`anon`). O programa publicado "Força em 8 semanas (teste)" devolveu o campo `content` inteiro (325 caracteres) para quem não tem conta.

**Causa.** A regra de acesso "programas publicados" libera todas as colunas da tabela `programs` para qualquer pessoa, inclusive `content`, que é o material vendido. O site só pede título e preço, mas a API aceita pedir `content`.

**Correção proposta** (é uma mudança no banco, então precisa da sua autorização):
1. Mover o conteúdo para uma tabela própria, que só o dono lê.
2. O comprador continua recebendo o conteúdo pela função `my_programs`, que já confere o pagamento e a validade.

Isso atende o critério P20 ("conteúdo privado sem direito: o servidor nega a leitura").

### 2.2 Critérios do pacote no servidor real

| Critério | Situação | Evidência |
|---|---|---|
| C01 Preço ou conta manipulados no navegador | Atende | `buy_program` e `create_checkout` leem preço, conta e comissão do banco |
| C02 Clique duplo, recarga ou nova tentativa | Atende | Chave de idempotência (`_idem_begin`) e uma única página de pagamento por intenção (`idem checkout:<intent>`) |
| C03 / C12 Aviso falso, de outro ambiente ou de outra conta | Atende | O webhook busca o evento no próprio Stripe e confere `livemode`, a conta do vendedor e a sessão guardada |
| C04 Aviso repetido ou fora de ordem | Atende | `payment_events` sem duplicatas; estados "ignorado" e "aguardando correlação" |
| C05 Retorno do pagamento antes da confirmação | Atende | O retorno leva para `/app#aluno-hoje`; o status pago só vem do aviso do Stripe |
| C09 Compra não cria vínculo | Atende | `_link_from_order`: no caso de programa, só cria `program_access` |
| C10 Início dos 12 meses | Atende | `ends_at = now() + access_months`, gravado na confirmação do pagamento |
| C13 Razão financeiro imutável e balanceado | Atende | `_ledger` e a regra `ledger_append_only` |
| C14 Reembolso total e parcial | Atende | Comissão proporcional; o último reembolso fecha a diferença |
| C16 Tarifa desconhecida | Atende | `provider_fee_cents` fica nulo e o líquido não é calculado |
| C17 Pago, disponível, enviado e recebido | Atende | Estados separados em `receivables`, a partir dos avisos de repasse |
| O06 Vendedor sem recebimento ativo | Atende | Retorna `vendedor_sem_recebimento` |
| O10 Perfil importado | Atende | Só o treinador com conta tem `my_trainer_id`, então só ele pode criar programa |
| Compra do próprio programa | Atende | Retorna `programa_proprio` |
| O07 / O08 Vaga de acompanhamento | Parcial | A capacidade é conferida **depois** do pagamento (o acesso fica "bloqueado_capacidade"). O pacote pede conferir antes de cobrar |
| C18 Renovação mensal | Não atende | O acompanhamento "mensal" é cobrado uma vez (`mode: payment`). Não há assinatura recorrente nem cancelamento de renovação |
| P01 Criar só com título e objetivo | Não atende | Exige semanas, treinos, meses e preço mínimo de R$ 1,00 |
| P05 Duas edições ao mesmo tempo | Não atende | A gravação sobrescreve sem conferir versão |
| P06 / P07 / P11 Estrutura e prontidão por formato | Não atende | O conteúdo é um texto único, sem sessões, semanas ou aulas |
| P13 Prévia do aluno | Não atende | Não existe |
| P14 Publicar, vender e atribuir separados | Não atende | Programa "publicado" já mostra o botão de compra |
| P16 Versão comprada preservada | Não atende | Editar o texto muda o conteúdo de quem já comprou |
| P17 / P18 Acesso gratuito e duas origens | Não atende | Não há concessão gratuita |
| P19 Progresso do aluno | Não atende | O aluno só lê o texto |
| P20 Conteúdo privado | **Falha** | Veja a seção 2.1 |
| O11 Preço público e SEO | Parcial | Não há página pública de programa (o sitemap de programas está vazio) |

---

## 3. Telas do Design System, consideradas como se tudo existisse

As telas existem no app em modo demonstração:
- **Treinador:** H07/TRE21, TRE22, TRE23, TRE24, TRE29, TRE31, FT01–FT12.
- **Aluno:** ALU06, ALU07, FC01–FC10.
- **Público:** PUB06, PUB15.

Nenhuma tela prevista ficou faltando, exceto FC07 ("Minhas contratações e detalhe", sem tela própria) e IA01 (sem tela interativa).

**Telas que seguem as regras do pacote:**
- TRE24 participantes: revogar o acesso gratuito mantém o acesso comprado.
- FC06: a preparação do acesso diz "não pague de novo".
- FC08: cancelar não é reembolso.
- FC09: o reembolso não inventa valor.
- FC10: quem dá o presente não vê dados de saúde.
- ALU06: as origens do acesso ficam separadas e a versão comprada é mantida.
- PUB15: sem oferta, mostra "sem oferta" em vez de zero.
- Preço do Pro: R$ 99/mês ou R$ 990/ano.

**Desvios, do mais grave ao menos grave** (as linhas citadas foram conferidas no código):

| # | Tela | Problema | Onde | Ajuste |
|---|---|---|---|---|
| 1 | ALU07, aberta pela prévia do TRE22 | A "prévia do aluno" abre outro programa (`ct2`) e grava progresso real | `aluno/10-conteudo.js:9`, `:24`, `:29` | Prévia da versão editada, com concluir e progresso desligados |
| 2 | TRE23 | A nova versão vale para todos por padrão (`apply = 'todos'`) | `treinador/30-programas.js:311` | O padrão deve manter a versão comprada; migrar quem já participa só por escolha explícita |
| 3 | TRE23 | A prontidão aprova programa com vídeo e zero aulas, e não existe o formato "curso" | `treinador/30-0dados.js:97` | Formato "curso" com aula obrigatória; "sessões" sem exigir vídeo |
| 4 | TRE29 | A cotação fala em taxa de 10% e 12%, não há escolha de família, benefícios são texto livre e o preço é decimal em reais | `treinador/30-ofertas.js:100`, `:6`, `:15`, `:19` | Comissão de 5%; família (acompanhamento, sessão ou programa); benefícios desmarcados; preço em centavos; duração, acesso, serviço e cobrança separados |
| 5 | H07 e TRE29 | Programa sem oferta mostra "R$ 0,00" | `treinador/30-programas.js:68`, `:109` | Mostrar "sem preço definido" |
| 6 | PUB06 e FC01 | "12 meses após a compra" e "logo após o pagamento" | `publico/10-programa.js:34` | "12 meses a partir da liberação do acesso" |
| 7 | FC04 → FC05 | Na demonstração, o retorno do pagamento já marca como pago | `aluno/20-base.js:70` | Mostrar "Confirmando" até o aviso do provedor |
| 8 | H07 e TRE22 | Criar pede nome e duração, e as seções são Básico, Conteúdo, Direitos e Oferta | `treinador/30-programas.js:101` | Pedir título e objetivo; seções Conteúdo, Apresentação, Acesso e Revisão |
| 9 | FT | Tarifa não conciliada aparece como valor "estimado"; falta o estado "recebido no banco" | `treinador/50-a-dados.js:118` | "Tarifa ainda desconhecida"; incluir "recebido" |
| 10 | FC01, FC03, IA01 | "Programa em vídeo" para programa de sessões; "renovação" em compra única; IA01 sem tela | `aluno/20-base.js:46`, `aluno/20-compra.js:166` | Ajustar os textos por formato e família; criar IA01 como opcional |

---

## 4. Ordem sugerida de correção

1. **Já, com sua autorização para mudar o banco:** fechar a leitura pública do conteúdo pago (seção 2.1).
2. **Telas do DS, só código e sem risco:** desvios 1, 2, 3, 5, 6 e 7 da seção 3, e a comissão de 5% no TRE29.
3. **Conta real, seguindo as fatias F04 e F05 do pacote:**
   - Rascunho com título e objetivo.
   - Conteúdo estruturado em sessões, reaproveitando o editor de rotinas.
   - Versão publicada imutável (`program_releases`), com o acesso apontando para a versão comprada.
   - Publicar e vender separados.
   - Prévia sem efeitos e concessão gratuita.
   - São migrações novas: cada uma precisa da sua autorização.
4. **Acompanhamento mensal:** assinatura recorrente no Stripe e capacidade conferida antes de cobrar.
5. **Para vender de verdade:**
   - cada treinador precisa ativar o recebimento no Stripe;
   - fazer uma compra em ambiente de teste do começo ao fim: compra, acesso, reembolso e recebimentos.
