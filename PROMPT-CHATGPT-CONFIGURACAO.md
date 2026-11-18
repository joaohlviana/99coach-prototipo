# Prompt para o ChatGPT (modo agente, com navegador) configurar o 99Coach

Copie tudo o que está abaixo da linha e cole no ChatGPT.

---

Você vai configurar os painéis do meu site **99Coach** (www.99coach.com.br). O código já está pronto e publicado; faltam só ajustes que exigem login nos painéis do Google, do Supabase e do Stripe. Use o navegador com as minhas contas já conectadas. Se alguma tela pedir login, senha ou código de verificação, **pare e me chame**: eu mesmo digito.

## Regras (obrigatórias)

1. **Nunca escreva nenhuma chave ou segredo no chat** (chave de API, `whsec_...`, `sk_...`, senhas). Copie do painel de origem e cole direto no campo de destino. No relatório final, cite só os **nomes** e se estão "presente" ou "ausente", nunca o valor.
2. **Não apague nada** em nenhum painel. Não desative nem edite os endereços de aviso (webhooks) do Stripe que apontam para `https://www.99coach.com.br/webhooks/stripe`: eles são do site antigo.
3. **Não compre nada** e não ative recurso pago (por exemplo, "Custom Domain" do Supabase). Se achar necessário, só me avise.
4. Não altere código nem repositório (GitHub, Vercel): isso não faz parte desta tarefa.
5. O projeto do Supabase é o **`rycaxboqkkiopjdecgld`** (painel em https://supabase.com/dashboard/project/rycaxboqkkiopjdecgld). Não mexa em outros projetos.
6. Se algo estiver diferente do que descrevo, não improvise: anote no relatório e siga para o próximo passo.

## Tarefa 1: chave do YouTube (sugestões automáticas de vídeo nos exercícios)

Situação conferida em 18/11: a chave **não existe** no Supabase.

1. Abra https://console.cloud.google.com e escolha (ou crie) um projeto chamado `99coach`.
2. Em "APIs e serviços" > "Biblioteca", procure **YouTube Data API v3** e clique em **Ativar**.
3. Em "APIs e serviços" > "Credenciais" > "Criar credenciais" > **Chave de API**.
4. Edite a chave criada:
   - Nome: `99coach-supabase-youtube`.
   - "Restrições de aplicativo": **Nenhuma**. A chave é usada pelo servidor do Supabase, não pelo navegador, então restrição por site (HTTP referrer) quebraria.
   - "Restrições de API": **Restringir chave**, marcando só **YouTube Data API v3**.
   - Salve.
5. Copie o valor da chave (sem mostrar no chat).
6. No Supabase: projeto `rycaxboqkkiopjdecgld` > **Edge Functions** > **Secrets** (ou "Manage secrets") > **Add new secret**:
   - Name: `YOUTUBE_API_KEY`
   - Value: cole a chave.
   - Salve.

## Tarefa 2: segredo de assinatura dos avisos do Stripe

O app recebe avisos do Stripe em `https://rycaxboqkkiopjdecgld.supabase.co/functions/v1/stripe-webhook` por **dois** endereços diferentes no Stripe, e cada um tem o seu segredo de assinatura (`whsec_...`). O app aceita os dois juntos, separados por vírgula.

1. Abra https://dashboard.stripe.com, conta **99coach**, em **modo real** (live, sem "Test mode"/"Sandbox").
2. Vá em **Desenvolvedores** (Developers) > **Webhooks** (ou "Workbench" > "Webhooks").
3. Encontre os dois destinos que apontam para `.../functions/v1/stripe-webhook`:
   - **A**: descrição "99coach app novo (Supabase) — contas conectadas" (eventos de contas conectadas / Connect).
   - **B**: descrição "99coach app novo (Supabase) — assinatura Pro".
4. **Confira só (não edite)** se o destino A já escuta estes 9 eventos. Eu já ajustei; é só para confirmar:
   - `account.updated`
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `checkout.session.expired`
   - `charge.refunded`
   - `invoice.paid`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Em cada um (A e B), clique em "Revelar" o **Segredo de assinatura** (Signing secret) e copie.
6. No Supabase, em **Edge Functions** > **Secrets**, crie ou edite o segredo `STRIPE_WEBHOOK_SECRET` com o valor:
   `segredo_de_A,segredo_de_B`
   Os dois `whsec_...` vão juntos, separados por **uma vírgula, sem espaço**.
   Se já existir um valor, substitua pelo par.

## Tarefa 3: conferir os outros segredos do Supabase (só conferir)

Na mesma tela de **Secrets**, veja se estes nomes existem. **Não mostre os valores.**

| Nome | Valor esperado |
|---|---|
| `STRIPE_SECRET_KEY` | chave secreta **real** do Stripe (começa com `sk_live_` ou `rk_live_`). Se não existir, me avise, não crie. |
| `SITE_URL` | `https://www.99coach.com.br`. Se não existir, **crie** com exatamente esse valor. |
| `RESEND_API_KEY` | chave do serviço de e-mail Resend. Se não existir, só anote. |
| `AVISOS_FROM` | remetente dos e-mails, algo como `99Coach <avisos@99coach.com.br>`. Se não existir, só anote. |
| `YOUTUBE_API_KEY` | criada na Tarefa 1 |
| `STRIPE_WEBHOOK_SECRET` | ajustado na Tarefa 2 |

## Tarefa 4: endereços de retorno do login (Supabase)

No Supabase, em **Authentication** > **URL Configuration**:

1. **Site URL** deve ser exatamente `https://www.99coach.com.br`. Ajuste se estiver diferente.
2. Em **Redirect URLs**, garanta que existam estas duas entradas (adicione a que faltar; não remova outras):
   - `https://www.99coach.com.br/**`
   - `https://99coach-prototipo-39pr.vercel.app/**`
3. Salve.

## Tarefa 5: nome "99Coach" na tela de login do Google

Hoje, ao entrar com Google, aparece "Prosseguir para rycaxboqkkiopjdecgld.supabase.co".

1. No Google Cloud Console, no projeto que tem o **cliente OAuth usado pelo login do Supabase**, abra "Google Auth Platform" (ou "APIs e serviços" > "Tela de consentimento OAuth").
   - Para achar o projeto certo: em "Credenciais", o cliente OAuth tem como URI de redirecionamento `https://rycaxboqkkiopjdecgld.supabase.co/auth/v1/callback`.
2. Em **Branding** (Identidade visual), preencha:
   - Nome do app: `99Coach`.
   - E-mail de suporte do usuário: o e-mail de contato da 99Coach que aparecer na lista (se não houver, me pergunte qual usar).
   - Logotipo: baixe https://www.99coach.com.br/icon.png e envie (quadrado, até 1 MB).
   - Página inicial do app: `https://www.99coach.com.br`.
   - Política de privacidade: `https://www.99coach.com.br/privacidade`.
   - Termos de serviço: `https://www.99coach.com.br/termos`.
   - Domínios autorizados: `99coach.com.br` (e mantenha `supabase.co` se já estiver).
   - Dados de contato do desenvolvedor: o mesmo e-mail de contato.
3. Salve.
4. Em **Público-alvo** (Audience), deixe o app como **Em produção** (Publish app), se ainda estiver "Em teste".
5. Se aparecer a opção **Verificar a identidade visual** (Verify branding), envie para verificação. O Google pode pedir para comprovar a propriedade do domínio pelo Search Console: se pedir, faça a Tarefa 6 antes e volte aqui.
6. **Não altere** os URIs de redirecionamento nem o ID/segredo do cliente OAuth.

Observação: mesmo com isso, o endereço do Supabase pode continuar aparecendo em parte da tela até eu decidir usar um domínio próprio de login (recurso pago). Isso não é tarefa sua.

## Tarefa 6: Google Search Console

1. Abra https://search.google.com/search-console e escolha a propriedade de `99coach.com.br` (domínio) ou `https://www.99coach.com.br/`.
   - Se não existir, adicione como **Domínio** `99coach.com.br` e siga a verificação por DNS. O DNS fica no **Cloudflare**: adicione o registro TXT indicado, sem apagar nenhum outro registro.
2. Em **Sitemaps**, envie `https://www.99coach.com.br/sitemap.xml`. Se já estiver lá, reenvie.
3. Anote o status que aparecer (sucesso, número de URLs descobertas ou erro).

## Tarefa 7: testes rápidos

1. **Vídeos (depois da Tarefa 1):** esperar 1 minuto, entrar em https://www.99coach.com.br/app com uma conta de **treinador**, ir em **Conteúdo**, depois **Exercícios**. Abrir um exercício (por exemplo, "Agachamento"), tocar em escolher vídeo e ver a aba **Sugestões**.
   - Deve aparecer uma lista de vídeos do YouTube.
   - Se aparecer "Buscar no YouTube" em vez da lista, a chave não foi lida. Confira o nome exato `YOUTUBE_API_KEY`.
   - Não salve nenhum vídeo; é só para ver.
2. **Login com Google:** em uma janela anônima, abrir https://www.99coach.com.br/app, escolher **Entrar com Google** e só olhar a tela do Google. Anote o nome que aparece ("99Coach" ou o endereço do Supabase) e **feche sem concluir**.
3. **Esqueci a senha (opcional):** só se eu estiver junto, porque o e-mail chega na minha caixa.

## Relatório final (formato)

Responda com esta tabela e nada de valores secretos:

| Tarefa | Feito? | Observação |
|---|---|---|
| 1 YouTube: API ativada e chave restrita | | |
| 1 `YOUTUBE_API_KEY` no Supabase | | |
| 2 Os 9 eventos conferidos no destino A | | |
| 2 `STRIPE_WEBHOOK_SECRET` com os 2 segredos | | |
| 3 Segredos presentes/ausentes (lista de nomes) | | |
| 4 Site URL e Redirect URLs | | |
| 5 Branding do Google (salvo / enviado para verificação) | | |
| 6 Sitemap enviado (status) | | |
| 7 Teste de vídeos: apareceram sugestões? | | |
| 7 Tela do Google mostra qual nome? | | |

Liste também qualquer coisa que estava diferente do esperado, ou que você não conseguiu fazer e por quê.
