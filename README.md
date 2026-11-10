# 99coach

App 99coach completo, rodando 100% local, no design system **coach99 v4 (Editorial esportivo)**:
Anton + Inter + Space Mono, tokens, componentes e ícones do DS.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera dist/ (site estático, abre em qualquer servidor)
```

## Dados reais

- **Treinadores**: Home, Esporte e Perfil usam a base real da 99Coach. O projeto traz uma amostra de 21 perfis;
  `npm run sync` baixa a base inteira (cerca de 11,9 mil) para `public/data/treinadores.json`. Precisa de internet só nessa hora.
- **Perfil**: com internet, o `npm run dev` busca os detalhes de cada perfil na API real e guarda no aparelho. As fotos vêm do servidor da 99Coach.
- **Gravação**: cadastros, alunos, treinos, mensagens, ofertas e salvos ficam gravados neste navegador e continuam lá ao recarregar.
  "Reiniciar dados" volta ao estado inicial.

- **Conta e cadastro**: "Criar conta" e "Entrar" usam o servidor real da 99Coach: o código de 6 dígitos chega no e-mail e a conta
  recebe o papel de aluno ou treinador. O cadastro do treinador (nome, cidade, regiões, formatos, idiomas, modalidades, CREF e a
  oferta principal) é gravado nas tabelas `trainers`, `trainer_sports` e `offers`, e "Publicar perfil" publica no servidor.
  Se o servidor recusar, a mensagem dele aparece na tela. Sem internet, o cadastro fica só neste navegador.
  Precisa rodar fora do visualizador de artefatos (por exemplo `npm run dev`), que bloqueia o acesso ao servidor.

- **Busca**: o campo da Home aceita digitação e procura nos treinadores reais (nome, especialidade, modalidade, cidade).
- **Seu perfil**: o treinador que publica o perfil no cadastro entra no topo da vitrine, e quem se cadastrou vê o próprio
  nome nas áreas de treinador e de aluno.
- **Barras de demonstração**: o botão no topo oculta ou mostra as barras de situações; a escolha fica gravada.

Serviços, programas, avaliações e as áreas logadas ainda usam conteúdo de exemplo: a base real só tem perfis importados, sem ofertas.

## Modo produto e modo demonstração

O app abre como produto: sem a barra "Telas" e sem as barras de situações. Quem já se cadastrou vê "Minha área" no lugar de "Entrar".

- Conta nova começa vazia: depois do cadastro de treinador, o painel abre sem os alunos, mensagens, vendas e conteúdos de exemplo.
  O que você criar fica gravado neste navegador.
- Demonstração (barra "Telas" + situações de cada tela): abra com `?demo=1` ou `#demo`. Fica gravado.
- Voltar ao produto: `?demo=0` ou `#produto`.
- Operação e Telas do DS, no modo produto, abrem pelo endereço: `#operacao` e `#telas`.

## Áreas

| Área | Endereço | O que tem |
| --- | --- | --- |
| Home | `#home` | Busca, modalidades, treinadores, programas, cenários de visitante/aluno |
| Esporte | `#esporte` | Página de modalidade com filtros e resultados |
| Perfil | `#perfil-rafael` | Perfil público do treinador |
| Serviço | `#servico-online` | Oferta e contratação |
| Onboarding | `#onboarding-treinador` | Entrar, cadastro de aluno e treinador, convite |
| Treinador | `#treinador` | Hoje, alunos, agenda, mensagens, rotinas, exercícios, formulários, programas, ofertas, recebimentos, insights, IA, conta |
| Aluno | `#aluno` | Hoje, execução de treino, evolução, programas, agenda, mensagens, compra |
| Público | `#publico` | Explorar, mapa, salvos, avaliações, ajuda, organizações |
| Operação | `#operacao` | Mesa, casos, perfis, importação, suporte, financeiro, políticas |
| Telas do DS | `#telas` | As 142 composições do DS, navegáveis |

## Estrutura

- `src/index.template.html` + `src/templates/*.html`: marcação de cada área (`npm run index` monta o `index.html`)
- `public/css/`: uma folha por área (cada uma inclui o DS) + `fonts.css`, `shell.css`, `adapt.css`
- `public/js/runtime.js`: runtime das telas (templates, estado, histórico)
- `public/js/pages/`: lógica das telas públicas e do onboarding
- `public/js/real.js`, `real-data.js`: treinadores reais e gravação local
- `public/js/conta.js`: cadastro e login no servidor real (e-mail + código)
- `scripts/sync-dados.mjs`: baixa a base real completa
- `public/js/core.js`, `db.js`: núcleo e dados de exemplo das áreas logadas
- `public/js/{treinador,aluno,publico,operacao}/`: um módulo por tela
- `public/js/ds-data.js`, `ds-telas.js`: composições do DS
- `public/img/`, `public/fonts/`: imagens e fontes locais
