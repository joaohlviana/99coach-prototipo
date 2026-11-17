# 99Coach: pendências para continuar fora da sessão na nuvem

Atualizado em 17/11/2026. Este documento lista tudo o que **não pôde ser feito** na sessão de trabalho na nuvem, por três motivos:

- falta de acesso (painéis, chaves, conta de e-mail);
- falta de decisão do dono do projeto;
- falta de autorização para mudar o banco.

Ele foi escrito para um agente de código (por exemplo, Claude Code rodando no computador do dono), mas uma pessoa também consegue seguir.

> **Para o agente:** leia a seção 1 inteira antes de mexer em qualquer coisa. Cada pendência da seção 2 diz quem precisa agir (**dono** ou **agente**), o que fazer, como conferir e quando está pronta. Não faça nada marcado "precisa de autorização do dono" sem a confirmação explícita dele na conversa.

---

## 1. Contexto do projeto

### 1.1 Onde está cada coisa

| Item | Valor |
|---|---|
| Site no ar | https://www.99coach.com.br (o domínio sem `www` redireciona com 308) |
| Repositório | GitHub `joaohlviana/99coach-prototipo`, ramo `main` (cada push publica sozinho) |
| Hospedagem | Vercel, projeto `99coach-prototipo-39pr` (time `joaohlvianas-projects`) |
| Banco, login e funções | Supabase, projeto `rycaxboqkkiopjdecgld` (região sa-east-1). **O mesmo banco do site antigo** |
| Chave pública do Supabase | já está no código (`public/js/conta.js`, `lib/catalogo.js`); é publicável, não é segredo |
| Funções do Supabase | `supabase/functions/`: `pagamentos`, `stripe-webhook`, `enviar-avisos` |
| Idiomas | páginas públicas em português (`/`), inglês (`/en`) e espanhol (`/es`); a área logada é só em português |

### 1.2 Como o site é montado

- **Páginas do servidor (Next.js 16, pasta `app/`):** cada página pública (`/treinadores/...`, `/treinador/...`, `/cidade/...`, `/estado/...`, `/esportes`, `/cidades`) é montada pelo servidor a partir de `public/data/treinadores.json`. Esse arquivo é baixado do banco a cada build por `scripts/sync-supabase.mjs`.
- **App interativo (JavaScript puro):** depois de carregar, ele assume a página.
  - Telas em `src/templates/*.html`, com a sintaxe `sc-if` e `sc-for`.
  - Lógica em `public/js/pages/*.js` e `public/js/<área>/*.js`.
  - `npm run shell` empacota tudo em `public/shell/` (pasta ignorada pelo git).
- **Estilos:** cada área tem seu CSS em `public/css/`. Ajustes novos entram **no fim de `public/css/shell.css`**, com seletores `html body #app ...`.
- **Topo da página inicial (`components/home-espera.js`):** é uma cópia estática que aparece antes de o app carregar. Sempre que o topo da página inicial mudar, gere de novo com `node scripts/snapshot-home.mjs`, com o site rodando em `localhost:5173`. O teste `tests/espera-da-home.mjs` acusa quando a cópia fica desatualizada.
- **Endereços do site antigo:** `proxy.js` redireciona com 301 os endereços antigos (`/{perfil}`, `/{esporte}`, `/{esporte}/{uf|cidade}`, `/programa/...`) para os atuais.
- **Perfis tirados do ar:** `lib/catalogo.js` consulta a função `hidden_trainer_slugs` (GET, cache de 5 minutos) e esconde perfis pausados ou retirados sem precisar de build.
  - **Atenção:** nunca use `cache: 'no-store'` em fetch dentro de páginas estáticas. Isso derrubou páginas com erro 500 em 17/11.

### 1.3 Comandos

```bash
npm install
npm run shell && npm run build      # empacota o app e monta o site
npm start                            # servidor em http://localhost:5173
npm test                             # bateria completa (cerca de 15 minutos; precisa do Playwright)
node tests/<nome>.mjs                # um teste só
node scripts/snapshot-home.mjs       # refaz a cópia do topo da página inicial (com o site rodando)
```

Os testes precisam de `PW` apontando para o Playwright, por exemplo:
`export PW=$(NODE_PATH=$(npm root -g) node -e "console.log(require.resolve('playwright'))")`.
Cada teste imprime linhas com `true` ou `false`. Compare a bateria nova com a anterior (`diff <(grep false antes.log) <(grep false depois.log)`) e não publique com `false` novo sem entender o motivo. Algumas linhas mostram `false` de propósito: são verificações em que "falso" é o resultado certo, por exemplo "dados inventados: false".

### 1.4 Regras do projeto (não quebrar)

1. **Nada inventado no site real:** nenhum perfil, avaliação, preço, data ou número de exemplo. Os exemplos só existem no modo demonstração (`?demo=1`).
2. **Nenhum segredo no git nem em mensagens:** chaves vão direto nos segredos do Supabase ou nas variáveis da Vercel, colocadas pelo dono.
3. **Banco compartilhado com o site antigo:** toda mudança de estrutura (migração) precisa de **autorização explícita do dono**.
4. **Antes de publicar:** rode a bateria completa e confira que não surgiu `false` novo.
5. **Público:** a interface é em português do Brasil, em linguagem simples, sem jargão.
6. **No celular:** o site deve parecer um app (barra inferior, cabeçalho fixo, áreas de toque de 44 px).

---

## 2. Pendências

Legenda: **[DONO]** só o dono consegue (painel, conta, decisão); **[AGENTE]** um agente com o repositório consegue; **[AUTORIZAÇÃO]** precisa do "sim" do dono antes.

### 2.1 Suporte com protocolo de verdade **[AUTORIZAÇÃO] + [AGENTE]**

**Situação:** o formulário "Falar com o suporte" (Central de ajuda) só gravava no navegador; nada chegava à equipe. Hoje, fora da demonstração, a tela orienta a falar pelo Instagram **@99coach.oficial**. A criação da tabela de chamados foi recusada na sessão, então nada foi aplicado.

**Passos, depois do "sim" do dono:**

1. Aplicar a migração abaixo no Supabase (projeto `rycaxboqkkiopjdecgld`).
2. Em `public/js/publico/20-ajuda.js`, trocar o `send` local (que grava em `DB.p2_casos`) por uma chamada a `C.rpc('submit_support_case', { p_subject, p_email, p_body, p_key })`.
   - Use como modelo `public/js/publico/30-perfilpedido.js`: chave aleatória de 48 caracteres hexadecimais, a mesma chave enquanto a pessoa repete o mesmo envio, e o protocolo guardado em `localStorage`.
   - A tela de acompanhamento ("track") deve usar `support_case_status(p_protocol, p_key)`.
3. Em `src/templates/publico.html`, bloco "contato": trocar `v.demoSupport` e `v.realSupport` para que o formulário apareça também fora da demonstração e o bloco do Instagram vire alternativa.
   - Remover o aviso "Demonstração: não use dados reais" no site real.
4. Em `public/js/publico/40-admin.js` e no template do admin, criar a fila "Suporte" com `admin_support_queue()` e as ações `admin_answer_support(p_case, 'em_andamento' | 'respondido' | 'encerrado', p_reply)`.
   - Siga o padrão das filas existentes: explicação obrigatória e confirmação.
5. Opcional: avisar a equipe por e-mail. A função `enviar-avisos` já lê a tabela `outbox`, e a migração grava `support.requested`.
6. Criar `tests/suporte.mjs` no estilo de `tests/remover-perfil.mjs`, simulando o banco. Testar: envio válido, texto curto barrado, e-mail inválido, protocolo exibido e consulta do protocolo. Incluir em `tests/run.sh`.

```sql
-- Fale com o suporte: o chamado é gravado de verdade, com protocolo para acompanhar sem conta.
create table if not exists public.support_cases (
  id uuid primary key default gen_random_uuid(),
  protocol text not null unique default ('S-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  key_hash text not null unique,
  subject text not null check (char_length(subject) between 2 and 80),
  contact_email text not null check (contact_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  body text not null check (char_length(body) between 10 and 4000),
  status text not null default 'recebido' check (status in ('recebido', 'em_andamento', 'respondido', 'encerrado')),
  reply text check (char_length(reply) <= 4000),
  user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  decided_by uuid
);
alter table public.support_cases enable row level security;  -- sem políticas: acesso só pelas funções abaixo

create or replace function public.submit_support_case(p_subject text, p_email text, p_body text, p_key text)
 returns jsonb language plpgsql security definer set search_path to ''
as $$
declare r public.support_cases%rowtype; h text;
begin
  if p_key is null or p_key !~ '^[A-Za-z0-9_-]{20,80}$' then raise exception 'codigo_invalido' using errcode = '22023'; end if;
  h := public._removal_hash(p_key);
  select * into r from public.support_cases where key_hash = h;
  if found then return jsonb_build_object('protocol', r.protocol, 'status', r.status, 'repeated', true); end if;
  if coalesce(char_length(trim(p_subject)), 0) < 2 then raise exception 'assunto_obrigatorio' using errcode = '22023'; end if;
  if trim(coalesce(p_email, '')) !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'email_invalido' using errcode = '22023'; end if;
  if coalesce(char_length(trim(p_body)), 0) < 10 then raise exception 'relato_curto' using errcode = '22023'; end if;
  if (select count(*) from public.support_cases where contact_email = lower(trim(p_email)) and status in ('recebido', 'em_andamento')) >= 5 then
    raise exception 'limite_de_pedidos' using errcode = '54000';
  end if;
  insert into public.support_cases (key_hash, subject, contact_email, body, user_id)
  values (h, left(trim(p_subject), 80), lower(trim(p_email)), left(trim(p_body), 4000), (select auth.uid())) returning * into r;
  perform public._outbox('support.requested', r.id::text, jsonb_build_object('subject', r.subject), r.id::text);
  return jsonb_build_object('protocol', r.protocol, 'status', r.status, 'repeated', false);
end $$;

create or replace function public.support_case_status(p_protocol text, p_key text)
 returns jsonb language plpgsql stable security definer set search_path to ''
as $$
declare r public.support_cases%rowtype;
begin
  select * into r from public.support_cases where protocol = upper(trim(p_protocol)) and key_hash = public._removal_hash(coalesce(p_key, ''));
  if not found then return jsonb_build_object('status', 'nao_encontrado'); end if;
  return jsonb_build_object('protocol', r.protocol, 'subject', r.subject, 'status', r.status, 'reply', r.reply, 'created_at', r.created_at, 'updated_at', r.updated_at);
end $$;

create or replace function public.admin_support_queue()
 returns table(case_id uuid, protocol text, subject text, contact_email text, body text, status text, created_at timestamptz)
 language plpgsql stable security definer set search_path to ''
as $$
begin
  if not public.is_admin(true) then raise exception 'exige papel admin com verificação em duas etapas (aal2)' using errcode = '42501'; end if;
  return query select c.id, c.protocol, c.subject, c.contact_email, c.body, c.status, c.created_at
    from public.support_cases c where c.status in ('recebido', 'em_andamento') order by c.created_at, c.id;
end $$;

create or replace function public.admin_answer_support(p_case uuid, p_status text, p_reply text)
 returns jsonb language plpgsql security definer set search_path to ''
as $$
begin
  if not public.is_admin(true) then raise exception 'exige papel admin com verificação em duas etapas (aal2)' using errcode = '42501'; end if;
  if p_status not in ('em_andamento', 'respondido', 'encerrado') then raise exception 'estado_invalido' using errcode = '22023'; end if;
  if p_status = 'respondido' and coalesce(trim(p_reply), '') = '' then raise exception 'resposta_obrigatoria' using errcode = '22023'; end if;
  update public.support_cases set status = p_status, reply = coalesce(nullif(trim(p_reply), ''), reply), decided_by = (select auth.uid()), updated_at = now() where id = p_case;
  if not found then raise exception 'chamado_inexistente' using errcode = 'P0002'; end if;
  return jsonb_build_object('case', p_case, 'status', p_status);
end $$;

revoke all on function public.submit_support_case(text, text, text, text) from public;
revoke all on function public.support_case_status(text, text) from public;
revoke all on function public.admin_support_queue() from public, anon;
revoke all on function public.admin_answer_support(uuid, text, text) from public, anon;
grant execute on function public.submit_support_case(text, text, text, text) to anon, authenticated;
grant execute on function public.support_case_status(text, text) to anon, authenticated;
grant execute on function public.admin_support_queue() to authenticated;
grant execute on function public.admin_answer_support(uuid, text, text) to authenticated;
```

**Pronto quando:** um chamado enviado pelo site aparece na fila "Suporte" do painel de administração; respondido lá, a consulta pelo protocolo mostra a resposta; e a bateria completa passa.

### 2.2 Login com Google mostra "rycaxboqkkiopjdecgld.supabase.co" **[DONO]**

**Situação:** na tela do Google aparece "Prosseguir para rycaxboqkkiopjdecgld.supabase.co" em vez de 99Coach (achado F10 da auditoria de 17/11). O login funciona: o registro do servidor mostra entradas com Google concluídas em 16/11.

**Opções (o dono escolhe):**

1. **Domínio próprio de login no Supabase**, por exemplo `auth.99coach.com.br`. É recurso pago (Custom Domains, em Project Settings, Custom Domains), com um registro CNAME no Cloudflare.
   Depois disso, um agente precisa:
   - trocar `https://rycaxboqkkiopjdecgld.supabase.co` pelo domínio novo em `public/js/conta.js` (`URL0`), em `lib/catalogo.js` (`SBX` e `SB`), em `scripts/sync-supabase.mjs` e no CSP de `next.config.mjs` (`connect-src`);
   - adicionar o endereço de retorno novo (`https://auth.99coach.com.br/auth/v1/callback`) no cliente OAuth do Google.
2. **Só a tela de consentimento do Google:** no Google Cloud Console, em APIs e serviços, Tela de consentimento OAuth, preencher nome do app "99Coach", logotipo, e-mail de suporte e domínios autorizados (`99coach.com.br`), e enviar para verificação. Melhora o nome e o logotipo exibidos, mas o domínio do Supabase pode continuar aparecendo sem a opção 1.

**Pronto quando:** a tela do Google mostra 99Coach e o login com Google volta para `https://www.99coach.com.br/app` com a sessão criada.

### 2.3 Conferir os endereços de retorno do login **[DONO]**

No Supabase, em Authentication, URL Configuration:

- **Site URL:** `https://www.99coach.com.br`.
- **Redirect URLs:** devem conter `https://www.99coach.com.br/**`. Pode manter `https://99coach-prototipo-39pr.vercel.app/**` para testes.
- **Recuperação de senha:** o link usa `location.origin + location.pathname`, então `/app` precisa estar coberto.

**Pronto quando:** "Esqueci a senha" envia um link que abre `https://www.99coach.com.br/app` com a tela de nova senha.

### 2.4 Segredos das funções e pagamentos **[DONO]**

As funções do Supabase leem estes segredos. Coloque-os em Supabase, Edge Functions, Secrets. **Nunca no git e nunca em mensagem.**

| Segredo | Para quê |
|---|---|
| `STRIPE_SECRET_KEY` | cobrança (use a chave de **teste** até a homologação) |
| `STRIPE_WEBHOOK_SECRET` | validar os avisos do Stripe na função `stripe-webhook` |
| `RESEND_API_KEY` e `AVISOS_FROM` | envio de e-mails da função `enviar-avisos` |
| `SITE_URL` | `https://www.99coach.com.br` |
| `ANTHROPIC_API_KEY` | só quando as funções de IA forem ligadas; hoje ficam desligadas no site |
| `YOUTUBE_API_KEY` | sugestões automáticas de vídeo nos exercícios (função `videos-exercicio`). Chave da YouTube Data API v3 criada no Google Cloud Console, restrita a essa API. Sem ela, o app mostra o botão “Buscar no YouTube” e o treinador cola o link |

Depois, um agente faz um pagamento de teste com cartão de teste do Stripe (`4242 4242 4242 4242`) e confere a assinatura, o recebimento e o aviso.

### 2.5 Webhooks antigos do Stripe falhando **[DONO]**

O site antigo tinha avisos do Stripe apontando para `https://www.99coach.com.br/webhooks/stripe`. Como o domínio agora aponta para o site novo, esses avisos falham. O site novo recebe os avisos pela função `stripe-webhook` do Supabase, que não depende do domínio.

**Passos:** no painel do Stripe, em Developers, Webhooks, **desativar** (não apagar, para manter o histórico) os endpoints `.../webhooks/stripe`. Confira antes que nenhum pagamento real ainda dependa deles.

### 2.6 Dados jurídicos dos Termos e da Privacidade **[DONO] + [AGENTE]**

Os artigos "Termos de uso" e "Privacidade e dados" (`public/js/publico/20-ajuda.js`, lista de artigos no topo do arquivo) não têm os dados da empresa.

**O dono precisa fornecer:**
- razão social e CNPJ;
- endereço;
- e-mail do encarregado de dados (LGPD);
- foro.

**Depois o agente:** completa os artigos, atualiza a "versão vigente" com a data e roda `tests/fase1-nada-falso.mjs` e a bateria completa.

### 2.7 Escolha do topo (hero) da página inicial **[DONO] + [AGENTE]**

Cinco opções de topo foram apresentadas em imagem; nenhuma foi escolhida. Depois da escolha:

1. Aplicar em `src/templates/home.html`, no bloco `v4-hero` (computador) e no bloco `vfm-hero2` (celular).
2. Se trocar a imagem, gerar também a versão leve do celular, no padrão de `public/img/570416df9063df47-m.webp`, e atualizar o pré-carregamento em `app/page.js`.
3. Rodar `node scripts/snapshot-home.mjs`, depois `tests/espera-da-home.mjs`, e medir de novo com Lighthouse. O celular estava entre 87 e 91.

### 2.8 Testes de ponta a ponta com conta real **[DONO] + [AGENTE]**

A auditoria de 17/11 deixou estes itens bloqueados por falta de um e-mail de QA controlado. O dono fornece uma caixa de e-mail de teste e o agente percorre:

- cadastro de aluno e de treinador com confirmação de e-mail; conclusão do onboarding;
- entrada, saída e sessão mantida depois de recarregar;
- recuperação de senha completa (depende da 2.3);
- edição e publicação do perfil de treinador, conferindo que ele aparece na busca;
- painel do treinador e do aluno, incluindo leitura e escrita em uma segunda sessão;
- convite e vínculo aluno–treinador;
- pedido de acompanhamento, aceite e mensagens;
- pagamento de teste (depende da 2.4);
- **remover perfil:** só com um perfil descartável criado para o teste, **nunca** com perfil real de terceiro. O perfil sai do site na hora (estado `pausado`); no painel de administração, "Recolocar no site" e "Excluir de vez" funcionam;
- login com Google até o fim (depende da 2.2).

Já existem contas de teste no banco, marcadas para apagar de uma vez (veja 2.10). A senha delas **não** fica neste documento: peça ao dono ou use "Esqueci a senha".

### 2.9 Search Console **[DONO]**

- Reenviar `https://www.99coach.com.br/sitemap.xml`. Ele virou índice e aponta para oito sitemaps: static, sports, filters, states, trainers, programs, en e es, somando cerca de 48 mil endereços.
- Os sitemaps antigos (`sitemap-trainers.xml`, `sitemap-filters.xml` etc.) continuam respondendo com os endereços novos.
- Acompanhar a cobertura por 2 a 4 semanas. Os endereços antigos devem migrar para os novos por redirecionamento 301. Ficaram como 404 de propósito `/gabriel-santos` e `/m`, sem perfil equivalente.

### 2.10 Dados de teste no banco antes de divulgar **[AUTORIZAÇÃO]**

Estes registros são de teste e ficam escondidos da busca, mas existem no banco:

| O quê | Identificador |
|---|---|
| Perfil de treinador de teste (`origin = 'demonstracao'`) | `b2222222-0000-4000-8000-000000000001` (endereço `treinador-teste-99coach`) |
| Contas de teste (e-mails `@99coach.test`) | `a1111111-0000-4000-8000-000000000001` e `...0002` |
| Programa de teste | `e5555555-0000-4000-8000-000000000001` (`forca-em-8-semanas-teste`) |
| Perfil e programa criados pela QA em 17/11 | treinador `joao-viana-teste-qa` e programa `teste-qa-programa-rascunho-17-11-4y4ol` (rascunho) |

Os testes usam IDs fixos com os prefixos `a1111111-`, `b2222222-`, `c3333333-` e `e5555555-`. Antes de apagar, liste tudo o que tem esses prefixos (vínculos, treinos, mensagens) e confirme com o dono. Apagar o treinador apaga em cascata quase tudo; pedidos e lançamentos financeiros usam `RESTRICT` e podem bloquear a exclusão.

### 2.11 Perfil recolocado só volta às listas no build seguinte **[AGENTE] + [DONO]**

Quando o painel de administração recoloca no site um perfil pausado:

- a página do perfil volta na hora;
- mas, se um build aconteceu enquanto ele estava pausado, ele só reaparece nas listas no build seguinte, porque `sync-supabase.mjs` só baixa perfis publicados.

**Solução sugerida:**
1. O dono cria um Deploy Hook na Vercel (Project Settings, Git, Deploy Hooks) e guarda o endereço como segredo `VERCEL_DEPLOY_HOOK` no Supabase.
2. O agente faz `admin_decide_removal` (ou um gatilho na tabela `outbox` para `removal.decided` com efeito `perfil_restaurado`) chamar esse endereço por uma função do Supabase.

### 2.12 Verificações que ainda não foram feitas **[AGENTE]**

- Safari e Firefox (só o Chromium foi testado), e um celular de verdade.
- Dados reais de uso no Chrome (CrUX e INP), que aparecem no PageSpeed ou no Search Console depois de algumas semanas de tráfego.
- Teste de carga e revisão de segurança das políticas do banco (RLS). As telas foram testadas, mas não houve pentest.
- Leitura completa com leitor de tela (VoiceOver e NVDA).
- Monitorar erros no ar: na Vercel, Observability e Runtime Errors. Em 17/11 houve erro 500 em páginas estáticas por causa de um fetch sem cache; já foi corrigido e a versão nova não registrou erros.

### 2.13 Vídeos dos exercícios: o que falta **[DONO] + [AGENTE]**

Pronto em 17/11:
- **Na tela do exercício, o treinador escolhe o vídeo de três jeitos:** sugestões automáticas do YouTube, link colado do YouTube ou vídeo próprio (MP4, MOV ou WebM, até 100 MB).
- **Onde fica salvo:** a escolha fica na biblioteca da conta (`trainer_library`) e vale em qualquer aparelho. Ela vai junto no treino atribuído (`items[].video`), e o aluno vê com o botão “Ver vídeo”.
- **Arquivos enviados:** ficam no bucket público `exercicio-videos`, na pasta do próprio treinador.
- **Função do Supabase:** `videos-exercicio`.

Falta:
1. **[DONO]** Colocar o segredo `YOUTUBE_API_KEY` (veja a 2.4). A cota grátis dá cerca de 100 buscas por dia. O app guarda cada busca por 7 dias no aparelho.
2. **[AGENTE]** Se a cota apertar, guardar as buscas no banco por nome de exercício: uma tabela de cache lida pela função antes de chamar o YouTube.
3. **[AGENTE]** Treinos atribuídos antes de escolher o vídeo não recebem o vídeo sozinhos. É preciso atribuir de novo.
4. **[AGENTE]** Testar o envio de vídeo grande em celular de verdade, com rede lenta.

### 2.14 Limpeza do repositório **[AGENTE]**

- A pasta `undefined/` na raiz (capturas de tela soltas, não versionadas) pode ser apagada depois de conferir que não é usada.
- A pasta `out/` tem capturas versionadas antigas; avaliar se ainda servem.
- `README.md`: atualizar com os comandos da seção 1.3 e um resumo da estrutura.

---

## 3. O que já está pronto (para não refazer)

- **Domínio:** `www.99coach.com.br` no ar, com indexação ligada e canônicas corretas.
- **Endereços antigos:** redirecionados com 301; os cinco sitemaps antigos respondem.
- **Páginas geradas pelo servidor:** modalidade, modalidade × cidade, modalidade × estado, modalidade online, cidade, estado, `/esportes`, `/cidades` e perfis, em português, inglês e espanhol, com hreflang.
- **Página inicial:**
  - "Todo o Brasil" como padrão e cidade guardada em cookie (`c99_cidade`);
  - topo instantâneo e imagem leve no celular;
  - Lighthouse no computador: 98 de desempenho e 100 de acessibilidade.
- **Remover perfil:** perfil importado e sem dono sai do ar na hora; o painel tem "Recolocar no site" e "Excluir de vez".
- **Auditoria de 17/11:**
  - F01, F02, F04 a F09 e F11 a F23 corrigidos.
  - F03 depende da 2.1 e F10 depende da 2.2.
  - F17: a regra de recebimentos é cobrança real pelo Stripe; o formulário de CPF e Pix ficou só na demonstração.
  - F19: o convite exige o perfil publicado. A tela agora avisa antes de tentar.
- **`llms.txt`:** com links, como pede a auditoria de navegação por agentes.
