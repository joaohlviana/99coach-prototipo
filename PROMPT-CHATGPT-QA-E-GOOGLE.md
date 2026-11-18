# Prompt para o ChatGPT (modo agente, com navegador): login do Google e testes com conta real

Copie tudo o que está abaixo da linha e cole no ChatGPT.

---

Você vai usar o navegador, com as minhas contas já conectadas, para terminar duas coisas do meu site **99Coach** (https://www.99coach.com.br):

- **A.** Tirar o endereço técnico do Supabase da tela de login do Google.
- **B.** Testar o site como um usuário de verdade e me entregar um relatório.

## Regras (obrigatórias)

1. **Nunca escreva senha, código, chave ou segredo no chat.**
   - Se uma tela pedir login, senha, código de verificação (2FA) ou CPF/dados bancários, **pare e me chame**: eu mesmo digito.
   - No relatório, nunca copie senhas, tokens nem dados pessoais.
2. **Não apague nada** em nenhum painel (Google, Cloudflare, Supabase, Stripe, Vercel, GitHub).
   - No Cloudflare, só **adicione** o registro pedido.
   - Não edite nem remova registros existentes, principalmente os que apontam o site (`www`, `@`, registros da Vercel e de e-mail).
3. **Não compre nada**, não ative recurso pago e **não faça nenhum pagamento**: o Stripe está em modo real e qualquer cobrança seria dinheiro de verdade.
4. Não altere código, GitHub nem Vercel.
5. Se algo estiver diferente do que descrevo, não improvise: anote e siga para o próximo passo.
6. Tire uma captura de tela de cada resultado importante e cite no relatório o que ela mostra.

---

## Parte A: nome "99Coach" na tela de login do Google

**Situação atual:**
- No Google Cloud, a tela de consentimento já tem:
  - nome "99Coach";
  - logotipo;
  - página inicial, termos e privacidade;
  - domínio `99coach.com.br`;
  - app em produção.
- Mas a verificação da identidade visual (branding) está **pendente**, por dois motivos que o Google apontou:
  1. A conta Google atual não tem a **propriedade verificada do domínio** `99coach.com.br`.
  2. O Google pediu **maior distinção do nome** do app.
- Por isso, ao entrar com Google, ainda aparece "rycaxboqkkiopjdecgld.supabase.co".

### A1. Verificar a propriedade do domínio (Search Console + Cloudflare)

Faça isso **com a mesma conta Google** que é dona ou editora do projeto do Google Cloud onde está o cliente OAuth do login. O cliente OAuth certo é o que tem o redirecionamento `https://rycaxboqkkiopjdecgld.supabase.co/auth/v1/callback`.

1. Abra https://search.google.com/search-console com essa conta.
2. Veja se já existe uma propriedade do tipo **Domínio** para `99coach.com.br` **verificada por esta conta**.
   - Se existir e estiver verificada, vá para A2.
3. Se não existir, clique em **Adicionar propriedade**, escolha **Domínio** e digite `99coach.com.br`.
4. O Google mostra um registro **TXT** (algo como `google-site-verification=...`). Copie o valor, sem escrever no chat.
5. Abra https://dash.cloudflare.com. Se pedir login, **pare e me chame**.
6. Escolha o domínio `99coach.com.br` e vá em **DNS** > **Registros** > **Adicionar registro**:
   - Tipo: `TXT`
   - Nome: `@`
   - Conteúdo: cole o valor copiado.
   - TTL: Automático.
   - Salve.
7. Volte ao Search Console e clique em **Verificar**. Se falhar, espere 5 minutos e tente de novo (até 3 vezes). Anote o resultado.
8. Se o Search Console já tinha uma propriedade verificada por **outra** conta Google, não remova nada. Em **Configurações** > **Usuários e permissões**, veja se dá para adicionar a conta do Google Cloud como **Proprietário**. Se não der, anote e me avise.

### A2. Enviar a identidade visual de novo

1. No Google Cloud Console, no projeto do cliente OAuth do login, abra **Google Auth Platform** > **Branding** (Identidade visual).
2. Confira que **Domínios autorizados** contém `99coach.com.br`.
3. **Sobre o nome:** o Google pediu "maior distinção". **Não troque o nome por conta própria.**
   - Copie a mensagem exata do Google sobre o nome e me mostre.
   - Junto, sugira 3 opções. Exemplos: "99Coach Treinadores", "99Coach — Personal Trainers", "99Coach App".
   - Espere eu escolher. Depois de escolher, troque o campo "Nome do app" e salve.
4. Clique em **Verificar identidade visual** (Verify branding), ou no botão equivalente, e envie. Anote o status final (enviado, em análise ou aprovado) e qualquer pendência listada.
5. **Teste:** numa janela anônima, abra https://www.99coach.com.br/app, toque em **Entrar com Google** e só olhe a tela do Google. Anote o nome que aparece e **feche sem concluir o login**.
   - A aprovação do Google pode levar dias.
   - Mesmo aprovado, parte da tela pode continuar mostrando o endereço do Supabase. Só um domínio próprio de login resolve 100%, e esse é um recurso pago que **não** deve ser ativado.

---

## Parte B: testes com conta real

Use **e-mails meus com apelido**: o mesmo Gmail que estou usando no navegador, com `+` antes do `@`.

| Papel | E-mail (exemplo) |
|---|---|
| Aluno | `meuemail+qaaluno@gmail.com` |
| Treinador | `meuemail+qatreinador@gmail.com` |

Os e-mails de confirmação chegam na minha caixa do Gmail. Você pode abrir o Gmail no navegador para clicar no link de confirmação, mas **não leia nem mexa em outros e-mails**.

**Senhas:** quando o cadastro pedir senha, **pare e me chame** para eu digitar.

### B1. Cadastro e entrada do aluno

1. Abra https://www.99coach.com.br, toque em **Entrar** / **Criar conta** e escolha **Aluno**.
2. Cadastre com o e-mail de aluno. Nome: `QA Aluno (teste)`.
3. Confirme o e-mail pelo link no Gmail.
4. Entre em https://www.99coach.com.br/app.
5. **Esperado:** a área do aluno abre sem erro, sem dados inventados, e com a tela "Hoje" ou a busca de treinadores.
6. Saia da conta e entre de novo. **Esperado:** entra direto na área do aluno.
7. Teste **"Esqueci a senha"** com esse e-mail.
   - **Esperado:** chega um e-mail, e o link abre `https://www.99coach.com.br/app` na tela de nova senha.
   - Na hora de digitar a nova senha, me chame.

### B2. Cadastro e painel do treinador

1. Em outra janela anônima, crie conta como **Treinador** com o e-mail de treinador. Nome: `QA Treinador (teste)`. Cidade: qualquer uma.
2. Confirme o e-mail e entre.
3. **Esperado:** o painel do treinador abre com as seções Hoje, Alunos, Conteúdo, Mensagens e Conta, sem números ou alunos inventados.
4. **Vídeos dos exercícios** (a função nova):
   1. Vá em **Conteúdo** > **Exercícios** e abra um exercício, por exemplo "Agachamento".
   2. Toque para escolher vídeo e veja a aba **Sugestões**.
      - **Esperado:** aparece uma lista de vídeos do YouTube.
      - Se aparecer "Buscar no YouTube" em vez da lista, anote: é falha.
   3. Escolha um vídeo da lista e salve. Feche e abra o exercício de novo. **Esperado:** o vídeo continua salvo.
   4. Na aba **Link do YouTube**, cole `https://www.youtube.com/watch?v=dQw4w9WgXcQ`. **Esperado:** mostra o título do vídeo. Salve e confira.
5. **Programa:**
   1. Em **Conteúdo** > **Programas**, crie um programa só com título `Programa QA (teste)` e objetivo `Teste`.
   2. Abra **Conteúdo**, adicione 1 sessão com 1 exercício e grave.
   3. Abra a **Prévia do aluno**. **Esperado:** mostra a sessão.
   4. Em **Revisão**, publique.
   5. Tente **ligar a venda**. **Esperado:** ele não deve conseguir vender, porque o recebimento pelo Stripe não está ativo. Anote a mensagem.
6. **Recebimentos:**
   1. Em **Conta** > **Recebimentos**, veja a situação.
   2. Se houver o botão **Ativar recebimento**, pode clicar para ver se abre o cadastro do Stripe.
   3. **Pare na primeira tela do Stripe e me chame**: o cadastro pede CPF, endereço e conta bancária reais, e só eu posso preencher. Não preencha nada.

### B3. Suporte com protocolo

1. Sem estar logado, abra https://www.99coach.com.br/ajuda e toque em **Falar com o suporte**.
2. Envie:
   - Assunto: **Outro**
   - E-mail: o de aluno
   - Texto: `Teste do QA, pode ignorar.`
3. **Esperado:** aparece "Solicitação recebida" com um protocolo no formato `S-XXXXXXXX`. Anote o protocolo.
4. Recarregue a página, abra **Acompanhar solicitação**. **Esperado:** o protocolo aparece com a situação "Recebida".

### B4. Celular

1. Abra https://www.99coach.com.br e https://www.99coach.com.br/app no modo celular do navegador (ferramentas do desenvolvedor, tamanho iPhone).
2. **Esperado:** sem rolagem para os lados, sem texto cortado e botões fáceis de tocar. Anote qualquer tela estranha com captura.

### B5. Sitemap dos treinadores

1. Abra https://www.99coach.com.br/sitemap-trainers.xml.
2. Anote:
   - se abre como XML;
   - quantos endereços (`<url>` ou `<sitemap>`) aparecem, mais ou menos;
   - quanto tempo levou para carregar;
   - se deu erro.
3. No Search Console, em **Sitemaps**, clique em `sitemap-trainers.xml` e copie a mensagem de erro exata que o Google mostra.

### B6. Limpeza no fim

1. No painel do treinador de teste, se o perfil foi publicado, use **Retirar do ar** / **Despublicar**. Retire também o programa de teste da venda, se estiver à venda.
2. **Não apague as contas de teste.** Eu apago depois, junto com os outros dados de teste.

---

## Relatório final (formato)

| Item | Resultado | Observação / captura |
|---|---|---|
| A1 Domínio verificado no Search Console (por qual conta) | | |
| A1 Registro TXT criado no Cloudflare | | |
| A2 Mensagem exata do Google sobre o nome + 3 sugestões | | |
| A2 Branding enviado (status) | | |
| A2 Nome que aparece no login com Google | | |
| B1 Cadastro, confirmação e entrada do aluno | | |
| B1 "Esqueci a senha" chegou e abriu a tela certa | | |
| B2 Painel do treinador sem dados inventados | | |
| B2 Sugestões de vídeo apareceram? Vídeo ficou salvo? | | |
| B2 Link do YouTube mostrou o título? | | |
| B2 Programa: rascunho, prévia, publicar | | |
| B2 Tentativa de vender (mensagem) | | |
| B2 Recebimentos: o que aparece; abriu o Stripe? | | |
| B3 Protocolo de suporte | | |
| B4 Problemas no celular | | |
| B5 sitemap-trainers.xml (abre? quantos? erro do Google?) | | |
| B6 Limpeza feita | | |

No fim, liste **todo erro, travamento, texto estranho ou tela vazia** que encontrar, com o endereço da página e a captura.
