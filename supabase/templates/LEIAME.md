# Modelos de e-mail do 99coach

Os e-mails de login são enviados pelo Supabase. Para usar estes modelos, cole cada um no painel:
**Supabase → Authentication → Emails → Templates** (https://supabase.com/dashboard/project/rycaxboqkkiopjdecgld/auth/templates)

| Modelo no Supabase | Arquivo |
|---|---|
| Confirm signup | `confirmar-cadastro.html` |
| Magic Link | `codigo-de-acesso.html` |
| Reset Password | `recuperar-senha.html` |
| Change Email Address | `trocar-email.html` |
| Reauthentication | `reautenticar.html` |

## Idiomas

Cada modelo traz os três idiomas (português, inglês e espanhol) e escolhe pelo idioma da conta
(`{{ .Data.lang }}`, gravado pelo app no cadastro e no login). Conta sem idioma gravado recebe em português.

## Assuntos (campo Subject de cada modelo)

Cole exatamente o texto abaixo no campo **Subject**: ele também escolhe o idioma.

**Confirm signup**

```
{{ with .Data.lang }}{{ if eq . "en" }}Your 99coach code: {{ .Token }}{{ else if eq . "es" }}Tu código de 99coach: {{ .Token }}{{ else }}Seu código do 99coach: {{ .Token }}{{ end }}{{ else }}Seu código do 99coach: {{ .Token }}{{ end }}
```

**Magic Link**

```
{{ with .Data.lang }}{{ if eq . "en" }}Your 99coach code: {{ .Token }}{{ else if eq . "es" }}Tu código de 99coach: {{ .Token }}{{ else }}Seu código do 99coach: {{ .Token }}{{ end }}{{ else }}Seu código do 99coach: {{ .Token }}{{ end }}
```

**Reset Password**

```
{{ with .Data.lang }}{{ if eq . "en" }}Create a new 99coach password{{ else if eq . "es" }}Crear contraseña nueva en 99coach{{ else }}Criar senha nova no 99coach{{ end }}{{ else }}Criar senha nova no 99coach{{ end }}
```

**Change Email Address**

```
{{ with .Data.lang }}{{ if eq . "en" }}Confirm your new email on 99coach{{ else if eq . "es" }}Confirma tu nuevo correo en 99coach{{ else }}Confirme seu novo e-mail no 99coach{{ end }}{{ else }}Confirme seu novo e-mail no 99coach{{ end }}
```

**Reauthentication**

```
{{ with .Data.lang }}{{ if eq . "en" }}99coach confirmation code: {{ .Token }}{{ else if eq . "es" }}Código de confirmación de 99coach: {{ .Token }}{{ else }}Código de confirmação do 99coach: {{ .Token }}{{ end }}{{ else }}Código de confirmação do 99coach: {{ .Token }}{{ end }}
```

O app confirma o e-mail por **código de 6 números**; por isso os modelos mostram `{{ .Token }}` em destaque e o botão fica como alternativa.

Para os e-mails saírem do seu domínio (e não do remetente padrão do Supabase, que é limitado a poucos por hora), configure em **Authentication → Emails → SMTP Settings** o Resend: servidor `smtp.resend.com`, porta `465`, usuário `resend`, senha = a chave do Resend, remetente = um endereço do domínio verificado.

O e-mail de **avisos** (novidades da conta) não é configurado aqui: ele é montado pela função `supabase/functions/enviar-avisos` com o mesmo visual.
