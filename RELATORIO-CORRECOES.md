# 99Coach: relatório final de correções

Data: 17/11/2026.

Este relatório responde à auditoria funcional de 17/11/2026: a versão final, com os achados F01 a F28 e a matriz de 140 verificações. Para cada achado, informa:
- o que foi feito;
- como foi conferido;
- o que ainda depende do dono do projeto.

As correções estão no site www.99coach.com.br e no repositório `joaohlviana/99coach-prototipo`. As verificações automáticas novas estão em:
- `tests/auditoria-1711.mjs`;
- `tests/videos-exercicio.mjs`;
- `tests/remover-perfil.mjs`;
- `tests/enderecos-antigos.mjs`;
- `tests/espera-da-home.mjs`.

Elas rodam junto com a bateria completa (`npm test`).

---

## 1. Resumo

| Situação | Achados |
|---|---|
| Corrigido | F01, F02, F04, F05, F06, F07, F08, F09, F11, F12, F13, F14, F15, F16, F17, F18, F19, F20, F21, F22, F23, F24, F25, F26, F27, F28 |
| Corrigido em parte (o resto depende de autorização do dono) | F03 |
| Depende só do dono (painel do Supabase ou do Google) | F10 |

- **26 de 28 achados corrigidos.** Nenhum deles depende mais de mudança no código.
- **Os dois restantes (F03 e F10) têm o passo a passo** em `PENDENCIAS.md`, nas seções 2.1 e 2.2.

---

## 2. Achado por achado

### Prioridade P1

| Achado | Problema | O que foi feito | Conferido |
|---|---|---|---|
| **F01** | O cadastro aberto pela tela de login vinha com nome e e-mail de exemplo (Marina Costa) | Todos os caminhos de cadastro começam com os campos vazios. Os exemplos existem só no modo demonstração | Teste automático e reteste da própria auditoria |
| **F02** | Os textos "Termos" e "Privacidade" no aceite não abriam os documentos | Viraram links de verdade (`/termos` e `/privacidade`), abertos em nova aba e separados da caixa de aceite. Vale para cadastro de aluno e de treinador | Teste automático e reteste da auditoria |
| **F03** | O formulário de suporte mostrava "Demonstração: não use dados reais" | No site real, a tela de suporte agora orienta a falar com a equipe pelo Instagram @99coach.oficial; o formulário de demonstração não aparece mais ali. **Falta:** o chamado com protocolo precisa de uma tabela nova no banco, e a criação dela foi recusada. O código pronto está em `PENDENCIAS.md` 2.1 | Teste automático |
| **F14** | Seis páginas responderam com erro 500 de vez em quando | **Causa encontrada:** uma consulta ao banco feita sem cache transformava páginas estáticas em páginas montadas a cada visita, e algumas falhavam. Agora a consulta tem cache de 5 minutos. Depois da correção, o registro de erros do servidor ficou zerado | Registro de erros da Vercel e as seis páginas abertas de novo |
| **F15** | "Nova rotina" dava erro e não abria o editor. Adicionar um exercício a uma rotina incompleta também falhava | **Causa:** fora da demonstração, o histórico de versões das rotinas não era preparado. Agora ele sempre existe, e as rotinas que ficaram incompletas pelo erro antigo também abrem | Teste automático com os dois caminhos: nova rotina e exercício adicionado a rotina antiga |
| **F18** | A tela de segurança do cadastro mostrava 2 etapas ativas e aparelhos inventados (iPhone em São Paulo, Android em Curitiba) | Na conta real, essa parte não mostra mais nada inventado. Ela leva a "Meus dados e segurança", que traz a verificação em 2 etapas e os aparelhos reais da conta | Teste automático |
| **F22** | Ao recarregar a ficha do aluno, o identificador do vínculo era cortado e aparecia "Vínculo não encontrado" | O endereço passa a guardar o identificador completo (que tem hífens). A recarga e o link direto voltam para a mesma ficha | Teste automático com o identificador relatado na auditoria |
| **F23** | O perfil retirado da busca ainda abria pelo endereço direto, rotulado como "importado" | Perfil em rascunho, pausado ou retirado sai também do endereço público: na hora no aparelho de quem retirou e em até 5 minutos para todos. Perfil criado no cadastro nunca mais aparece como importado | Teste automático; regra aplicada no banco (`hidden_trainer_slugs`) |
| **F26** | "Adicionar vídeo ou foto" simulava o envio (wall-ball.mp4, "processando", "pronto") sem nenhum arquivo | A simulação saiu da conta real. O vídeo agora é escolhido na tela do exercício, com envio real de arquivo (veja F24) | Teste automático com arquivo enviado, arquivo recusado e arquivo apagado |
| **F27** | A confirmação pelo Instagram era um fluxo de demonstração com código já preenchido | Na conta real o fluxo simulado não aparece mais. A tela explica que essa confirmação ainda não existe e indica o caminho real: "É meu perfil", com protocolo e revisão da equipe | Teste automático |
| **F28** | "Exportar meus dados" aceitava qualquer código e dava um recibo fixo (#P-44, de 26/10) | Na conta real, exportar e excluir levam a "Meus dados e segurança". Lá, a exportação baixa de verdade os dados da conta e a exclusão passa pelo banco | Teste automático |

### Prioridade P2

| Achado | Problema | O que foi feito | Conferido |
|---|---|---|---|
| **F04** | Corrida tinha totais diferentes por idioma (713 contra 798) | Os três idiomas usam a mesma regra: só profissionais com atendimento presencial ou online informado | Teste automático de listas |
| **F05** | O botão "Programas" do menu público levava à página inicial | O botão some do menu público enquanto não houver programas publicados | Teste automático |
| **F06** | `/esportes` redirecionava para a página inicial | Agora existe a página `/esportes`, com todas as modalidades que têm profissionais | Teste automático e sitemap |
| **F07** | No celular, o perfil não tinha título principal (H1) visível | O nome do profissional é o título principal também no celular | Teste automático e Lighthouse |
| **F08** | Os artigos de ajuda não tinham endereço próprio | Cada artigo tem endereço próprio (`/app#publico-ajuda-<artigo>`) e reabre no mesmo artigo depois da recarga | Teste automático |
| **F09** | O artigo sobre perfis importados não batia com o que o perfil mostra | O artigo foi reescrito com o que é de fato publicado: nome, foto, Instagram público, modalidades e cidade | Revisão de texto |
| **F13** | A tecla Esc não fechava as sugestões de busca | Esc fecha as sugestões e mantém o cursor no campo | Teste automático |
| **F16** | O atalho "Formulários" levava a uma tela indisponível | Na conta real, o atalho geral sai de Conteúdo e do menu. Os formulários continuam funcionando na ficha de cada aluno, como a auditoria confirmou | Teste automático |
| **F17** | Recebimentos misturava três mensagens diferentes (demonstração, teste e cobrança real) | Ficou uma regra só: cobrança real pelo Stripe. O formulário de CPF e Pix do cadastro aparece apenas na demonstração; na conta real há um botão "Ativar em Recebimentos". O Insights não fala mais em "modo de teste" | Revisão das três telas |
| **F19** | O convite falhava com erro 403 quando o perfil estava em rascunho, sem explicar o motivo | A regra continua (só perfil publicado convida, porque o aluno abre o convite e vê o perfil). Agora a tela avisa antes, com o botão "Ir para o perfil", e não mostra mais erro técnico | Teste automático |
| **F20** | O e-mail aparecia como "opcional" e a validade era uma data fixa (02/11) | O campo virou "E-mail do aluno" na conta real. A validade mostrada é calculada (hoje mais 7 dias), pela mesma regra do servidor | Teste automático |
| **F21** | O perfil próprio mostrava nomes de exemplo (Gabriel, Carolina), "confirmada em undefined" e uma data fixa | Os textos usam o nome do próprio profissional. Datas que não existem não aparecem. A prévia usa a modalidade e a cidade do cadastro, e não a última busca feita | Teste automático |
| **F24** | Nove exercícios anunciavam vídeo, mas o play só avisava que ele não tinha sido enviado | **Função nova de vídeos** (seção 3). Sem vídeo, a tela diz "Este exercício ainda não tem vídeo" e oferece "Escolher vídeo". Com vídeo, ele toca dentro do app | Teste automático (15 verificações) |
| **F25** | Prancha frontal prometia "foto da posição final" e mostrava só um ícone | Na conta real, a tela não promete foto nem vídeo que não existam. Sem mídia, mostra o estado "sem vídeo" com a instrução em texto | Teste automático |

### Prioridade P3

| Achado | Problema | O que foi feito | Conferido |
|---|---|---|---|
| **F10** | A tela do Google mostra "rycaxboqkkiopjdecgld.supabase.co" | **Depende do dono.** É preciso configurar um domínio próprio de login no Supabase, ou a marca na tela de consentimento do Google. O passo a passo está em `PENDENCIAS.md` 2.2. O login com Google funciona (houve entradas concluídas em 16/11) | — |
| **F11** | A idade mínima era descrita de jeitos diferentes | Termos e cadastro dizem a mesma coisa: pessoas a partir de 18 anos | Reteste da auditoria |
| **F12** | A página e a ordenação da lista não ficavam no endereço | O endereço guarda a página e a ordem (`?pagina=2&ordem=recentes`), e elas voltam ao retornar do perfil | Teste automático |

---

## 3. Função nova: vídeos dos exercícios

Pedido do dono, ligado aos achados F24 a F26.

**Como o treinador escolhe o vídeo.** Na tela de cada exercício, em "Escolher vídeo" ou "Trocar vídeo", há três abas:
1. **Sugestões:** vídeos do YouTube encontrados automaticamente pelo nome do exercício, só com vídeos que podem ser mostrados fora do YouTube e com busca segura. O treinador confere e escolhe.
2. **Link do YouTube:** cola qualquer link (youtube.com, youtu.be ou shorts). O sistema confere se o vídeo existe e se pode ser mostrado no app.
3. **Enviar vídeo:** um arquivo próprio em MP4, MOV ou WebM, de até 100 MB.

**Onde fica salvo e quem vê:**
- A escolha fica na conta do treinador e vale em qualquer aparelho.
- O vídeo vai junto no treino atribuído, e o aluno vê com o botão "Ver vídeo" em cada exercício.
- O vídeo do YouTube toca dentro do app, em modo de privacidade (youtube-nocookie).
- O vídeo enviado fica guardado na pasta do próprio treinador. Se ele trocar ou retirar o vídeo, o arquivo antigo é apagado.

**Falta para as sugestões automáticas funcionarem:** o dono precisa cadastrar o segredo `YOUTUBE_API_KEY` no Supabase. Sem ele, a aba mostra o botão "Buscar no YouTube", e o link colado e o envio de arquivo funcionam normalmente.

**Sobre o 99coach antigo:** no repositório antigo foi encontrado apenas o campo de link do YouTube nas videoaulas. Não foi encontrado código de busca automática.

---

## 4. Outras melhorias feitas no mesmo período

**Página inicial:**
- "Todo o Brasil" é o padrão, e a cidade escolhida fica guardada.
- O topo aparece na hora.
- A nota de desempenho do Lighthouse no celular subiu de 57 para 87–91.
- O aviso fictício ("Ana Ribeiro 3/4") e os três pontinhos dos cartões foram retirados.
- A barra de busca foi alinhada.
- As sugestões são diferentes nas abas Treinadores e Esportes.

**Perfil público:**
- O cabeçalho segue o mesmo padrão da lista.
- A caixa de contato não repete mais o link e diz "Fale com <nome> pelo Instagram".
- Novo botão "Remover este perfil": o perfil sai do ar na hora e fica pausado. No painel de administração há "Recolocar no site" e "Excluir de vez".

**SEO:**
- Cerca de 2.000 endereços antigos foram redirecionados com 301 para os novos.
- Sitemaps foram organizados em índice, com cerca de 48 mil endereços, todos com resultados.
- Foram criadas páginas por estado e a página `/esportes`.
- O `llms.txt` foi reescrito.

---

## 5. O que ainda não foi testado de ponta a ponta

Estes itens não são defeitos encontrados; são áreas sem teste real até agora:
- pagamento real com o Stripe: depende das chaves no Supabase (`PENDENCIAS.md` 2.4);
- login com Google até o fim e recuperação de senha completa: dependem de uma conta de teste do dono (`PENDENCIAS.md` 2.3 e 2.8);
- Safari, Firefox, celular de verdade, leitor de tela e teste de carga.

Os dados de teste criados pela auditoria (perfil "João Viana — Teste QA" e um programa em rascunho) continuam no banco. Para apagá-los, siga `PENDENCIAS.md` 2.10, com a confirmação do dono.
