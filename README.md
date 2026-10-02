# Nando Voyager — landing page

Página única (sem rolagem) de nandovoyager.com: foto, título, redes sociais, cadastro na lista de lançamentos (Resend) e links para o curso Primeira Importação e o Voyager AI. HTML/CSS/JS puro, sem etapa de build.

## Rodar localmente

Requer Node.js 22.9+.

```sh
cp .env.example .env   # depois preencha os valores
npm start
```

Abra http://127.0.0.1:4173. O `npm start` roda o `server.mjs`, que serve os arquivos estáticos e o `POST /api/subscribe`.

## Variáveis de ambiente

| Nome | O que é |
| --- | --- |
| `RESEND_API_KEY` | Chave da API do Resend (`re_…`). Só no servidor — nunca em `site-config.js` ou no navegador. |
| `RESEND_SEGMENT_ID` | ID (UUID) do Segment do Resend onde entram os inscritos — não o nome dele. |
| `SITE_ORIGIN` | Origens permitidas, separadas por vírgula, ex.: `https://nandovoyager.com,https://www.nandovoyager.com`. Vazio no ambiente local. |

## Publicar (Vercel)

Os arquivos estáticos são servidos como estão e `api/subscribe.mjs` roda como função serverless (export default). O `.vercelignore` deixa `.env` e `server.mjs` fora do upload.

1. Importe este repositório na Vercel (preset "Other", sem build command).
2. Cadastre as três variáveis acima em Settings → Environment Variables.
3. Adicione `nandovoyager.com` e `www.nandovoyager.com` em Settings → Domains e crie no registrador os registros DNS que a Vercel mostrar.

## Configuração

- `site-config.js`: endpoint do cadastro, links dos cartões (`offers`) e das redes, incluindo os links que abrem direto no app no celular.
- `privacidade.html`: política de privacidade (LGPD).
- `public/og.jpg`: imagem de prévia 1200×630 para compartilhamento.

## Analytics

O `script.js` chama `window.nandoAnalytics.track(evento, propriedades)` se algum provedor de analytics definir essa função. Eventos: `social_click`, `cta_click`, `newsletter_signup` (só depois que a API confirma).
