# Testes

Roteiros em Playwright que abrem o app no navegador e conferem os percursos principais.
O servidor de contas (Supabase) e a API de catálogo são **simulados** dentro de cada roteiro:
nenhum teste cria conta, convite ou registro no banco real.

## Como rodar

```bash
npm run dev            # em um terminal (porta 5173)
npm test               # em outro: roda os percursos e mostra o que mudou
```

`npm test` precisa do Playwright instalado (`npm i -g playwright` ou no projeto).

## O que cada roteiro cobre

| Arquivo | Percurso |
|---|---|
| `cadastro-e-login.mjs` | criar conta com e-mail e senha, e-mail já usado, senha errada, entrar |
| `login-google.mjs` | ida ao servidor de contas e volta com a conta criada |
| `senha-nova.mjs` | "esqueci a senha": link do e-mail, tela de senha nova, gravação |
| `convite-e-vinculo.mjs` | treinador convida, aluno aceita uma vez, vínculo aparece para os dois |
| `pedido-de-acompanhamento.mjs` | aluno pede pelo perfil, treinador aceita, vínculo criado |
| `rotina-para-aluno.mjs` | rotina criada em Conteúdo é atribuída ao aluno real; aluno escolhe a sessão e registra |
| `treino-evolucao-mensagens.mjs` | preparação, treino manual, execução, evolução e mensagens |
| `agenda-e-pausa.mjs` | disponibilidade, marcar horário, pausar, retomar e encerrar vínculo |
| `painel-e-sair.mjs` | painel de conta nova e saída |
| `produto-sem-exemplos.mjs` | o site real não mostra perfis, serviços nem programas de exemplo |
| `texto-malicioso.mjs` | texto com código vindo do servidor aparece como texto e não é executado |
| `robo-de-cliques.mjs` | clica em todos os botões de todas as telas (modo demonstração) e conta erros |
| `auditoria-publico.mjs` / `auditoria-painel.mjs` | lista cliques que não mudam nada ou caem em aviso de "não disponível" |

Os três últimos recebem uma pasta de saída como argumento e demoram alguns minutos; por isso ficam fora do `npm test`.
