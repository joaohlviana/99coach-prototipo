# Modelos de e-mail do 99coach

Os e-mails de login são enviados pelo Supabase. Para usar estes modelos, cole cada um no painel:
**Supabase → Authentication → Emails → Templates** (https://supabase.com/dashboard/project/rycaxboqkkiopjdecgld/auth/templates)

| Modelo no Supabase | Arquivo | Assunto |
|---|---|---|
| Confirm signup | `confirmar-cadastro.html` | Seu código do 99coach: {{ .Token }} |
| Magic Link | `codigo-de-acesso.html` | Seu código do 99coach: {{ .Token }} |
| Reset Password | `recuperar-senha.html` | Criar senha nova no 99coach |
| Change Email Address | `trocar-email.html` | Confirme seu novo e-mail no 99coach |
| Reauthentication | `reautenticar.html` | Código de confirmação do 99coach: {{ .Token }} |

O app confirma o e-mail por **código de 6 números**; por isso os modelos mostram `{{ .Token }}` em destaque e o botão fica como alternativa.

Para os e-mails saírem do seu domínio (e não do remetente padrão do Supabase, que é limitado a poucos por hora), configure em **Authentication → Emails → SMTP Settings** o Resend: servidor `smtp.resend.com`, porta `465`, usuário `resend`, senha = a chave do Resend, remetente = um endereço do domínio verificado.

O e-mail de **avisos** (novidades da conta) não é configurado aqui: ele é montado pela função `supabase/functions/enviar-avisos` com o mesmo visual.
