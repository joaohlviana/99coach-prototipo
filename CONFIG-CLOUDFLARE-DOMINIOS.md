# Domínios do 99coach: o que configurar (Cloudflare, Vercel, Supabase, Google)

## Como fica

| Domínio | Para quem | Exemplo |
|---|---|---|
| **www.99coach.com.br** | Brasil, português (principal no Brasil) | `www.99coach.com.br/treinador/valentin-quiroga-041f8982` |
| **www.99coach.com** | inglês (na raiz) | `www.99coach.com/coach/valentin-quiroga-041f8982` |
| **www.99coach.com/es** | espanhol | `www.99coach.com/es/entrenador/valentin-quiroga-041f8982` |

- `99coach.com.br` sem www leva ao www (já está assim).
- `99coach.com` sem www leva a `www.99coach.com`.
- Endereço em português aberto no .com (ex.: `www.99coach.com/treinador/x`) leva ao mesmo endereço no .com.br.
- Endereço em inglês ou espanhol aberto no .com.br (ex.: `www.99coach.com.br/en/...`) leva ao .com.
- Cada página aponta para as três versões (hreflang), entre os dois domínios.
- Ninguém é redirecionado pelo país: aparece um aviso para trocar de idioma, e a pessoa escolhe.

O código já está pronto para isso. Enquanto o .com não estiver funcionando, inglês e espanhol continuam em
`www.99coach.com.br/en` e `/es`. Quando o .com responder, eu ligo a troca na Vercel.

---

## 1. Porkbun (só uma vez)
1. Em **Domain Management**, abra **99coach.com** e depois **Details**.
2. Se o **DNSSEC** estiver ligado, desligue **antes** de trocar os nameservers.
3. Em **Authoritative Nameservers**, deixe **só** estes dois:
   - `fred.ns.cloudflare.com`
   - `ingrid.ns.cloudflare.com`
4. Desligue o **URL Forwarding** do 99coach.com, se existir. Hoje ele manda tudo para `http://www.99coach.com.br` e perde o caminho da página.

## 2. Cloudflare, zona **99coach.com**

### DNS (aba DNS > Records)
| Tipo | Nome | Conteúdo | Proxy |
|---|---|---|---|
| CNAME | `@` | `115a7326fa257cb5.vercel-dns-016.com` | **DNS only (nuvem cinza)** |
| CNAME | `www` | `115a7326fa257cb5.vercel-dns-016.com` | **DNS only (nuvem cinza)** |

- **Apagar** o que veio da Porkbun:
  - registros A `207.207.210.23`, `.36` e `.50`;
  - CNAME/ALIAS para `uixie.porkbun.com` ou `pixie.porkbun.com`.
- **Manter** tudo de e-mail e verificação: `MX`, `TXT` com `v=spf1`, `DKIM` (`*._domainkey`), `_dmarc` e `google-site-verification`.
- Nuvem **cinza** (DNS only): a Vercel emite o certificado e faz o cache. Com a nuvem laranja, a Cloudflare fica no meio e pode atrapalhar o certificado e o login.

### Regras: **nenhuma** no .com
- **Não** criar Redirect Rule, Page Rule nem Worker no 99coach.com.
- **Atenção:** a regra planejada antes, "redirecionar .com para .com.br", **não deve ser criada**. Se já existir, **apague**. Agora o .com tem conteúdo próprio (inglês e espanhol), e quem decide para onde cada endereço vai é o site.

### SSL/TLS
- **SSL/TLS > Overview:** `Full (strict)`.
- **Edge Certificates:** `Always Use HTTPS` ligado; `Minimum TLS Version` 1.2.
- **HSTS:** deixar desligado por enquanto.

### Se algum dia ligar a nuvem laranja (hoje não)
- Rocket Loader, Email Obfuscation e Bot Fight Mode **desligados**.
- Não fazer cache de HTML.
- Liberar sem desafio: `/.well-known/*`, `/auth/*`, `/api/*` e `/app*`.

### DNSSEC (opcional, depois)
Quando a zona estiver **Active**, ligue o DNSSEC na Cloudflare e copie o registro DS para a Porkbun.

## 3. Cloudflare, zona **99coach.com.br**
**Não mexer.** Continua apontando para a Vercel, com nuvem cinza.

## 4. Vercel (eu faço quando o .com estiver respondendo)
- **Domínios:**
  - `www.99coach.com`: produção, sem redirecionar;
  - `99coach.com`: redireciona 308 para `www.99coach.com`.
- **Variável:** `INTL_URL=https://www.99coach.com`, seguida de uma nova publicação.

## 5. Supabase (Authentication > URL Configuration)
- **Site URL:** continua `https://www.99coach.com.br`.
- **Redirect URLs:** acrescentar `https://www.99coach.com/**`, sem apagar as do .com.br.

## 6. Google Cloud (OAuth)
- **OAuth consent screen > Authorized domains:** acrescentar `99coach.com`.
- **Credentials > OAuth client:**
  - em **Authorized JavaScript origins**, acrescentar `https://www.99coach.com`;
  - os redirect URIs não mudam, porque continuam os do Supabase.

## 7. Google Search Console
- Adicionar a propriedade **Domínio** `99coach.com`, com um TXT no DNS da Cloudflare (esse TXT pode ficar laranja ou cinza, tanto faz).
- Enviar o sitemap `https://www.99coach.com/sitemap.xml` (a lista das páginas em inglês e espanhol).
- **Não** usar "Mudança de endereço": nada está mudando de domínio, são idiomas diferentes.

## Como saber se deu certo (eu testo)
- `https://99coach.com` leva (308) a `https://www.99coach.com`, que mostra o início em inglês.
- `https://www.99coach.com/treinador/x` leva (301) a `https://www.99coach.com.br/treinador/x`.
- `https://www.99coach.com.br/en/coach/x` leva (301) a `https://www.99coach.com/coach/x`.
- O certificado está válido nos dois domínios, e o .com.br segue normal.
