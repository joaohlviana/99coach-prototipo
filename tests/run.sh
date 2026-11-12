#!/usr/bin/env bash
# Roda os percursos principais contra o servidor local (npm run dev) e mostra a saída de cada um.
# Sai com erro se algum roteiro quebrar ou registrar erro de página.
set -u
cd "$(dirname "$0")"
if ! curl -s -m 3 -o /dev/null http://localhost:5173/; then echo "Suba o app antes: npm run build && npm start (ou npm run dev)"; exit 2; fi
export PW="${PW:-$(NODE_PATH=$(npm root -g) node -e "try{console.log(require.resolve('playwright'))}catch(e){console.log('playwright')}")}"
fail=0
for t in cadastro-e-login login-google senha-nova convite-e-vinculo pedido-de-acompanhamento rotina-para-aluno hoje-do-treinador conta-e-descoberta enderecos-e-seo treino-evolucao-mensagens agenda-e-pausa painel-e-sair produto-sem-exemplos texto-malicioso perfil-e-exclusao painel-real comentario-e-seguranca administracao fase1-nada-falso fase2-ciclo fase3-aluno mensagens-caixa; do
  echo "== $t"
  out=$(timeout 170 node "$t.mjs" 2>&1); code=$?
  echo "$out" | cut -c1-240
  if [ $code -ne 0 ] || echo "$out" | grep -q "executou script: [1-9]"; then echo "!! $t falhou"; fail=1; fi
  # a última linha de cada roteiro lista erros de página: deve vir vazia
  if echo "$out" | grep -E "^errs? " | grep -q "[a-zA-Z]\{4,\}.*[a-zA-Z]"; then if ! echo "$out" | grep -E "^errs? " | grep -qE "^errs? (\[\] ?)+$"; then echo "!! $t registrou erro de página"; fail=1; fi; fi
done
exit $fail
