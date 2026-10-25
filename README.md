# Nando Voyager — landing page

Landing page de branding pessoal de nandovoyager.com: abertura com foto e cadastro de e-mail (Resend), últimos vídeos do YouTube, resumo da DeepChina AI, sobre, bastidores (fotos e vídeo) e contato com o e-mail de parcerias. HTML/CSS/JS puro, sem etapa de build.

## Rodar localmente

Requer Node.js 22.9+.

```sh
cp .env.example .env   # depois preencha os valores
npm start
```

Abra http://127.0.0.1:4173. O `npm start` roda o `server.mjs`, que serve os arquivos estáticos, o `POST /api/subscribe` e o `GET /api/youtube`.

## Variáveis de ambiente

| Nome | O que é |
| --- | --- |
| `RESEND_API_KEY` | Chave da API do Resend (`re_…`). Só no servidor — nunca em `site-config.js` ou no navegador. |
| `RESEND_SEGMENT_ID` | ID (UUID) do Segment do Resend onde entram os inscritos — não o nome dele. |
| `SITE_ORIGIN` | Origens permitidas, separadas por vírgula, ex.: `https://nandovoyager.com,https://www.nandovoyager.com`. Vazio no ambiente local. |
| `YOUTUBE_CHANNEL_ID` | Opcional. ID do canal (`UC…`) para a seção de vídeos. Sem ele, o ID é lido da página do @NandoVoyager. No YouTube: Configurações → Configurações avançadas → ID do canal. |

## Publicar (Vercel)

Os arquivos estáticos são servidos como estão e `api/subscribe.mjs` e `api/youtube.mjs` rodam como funções serverless (export default). A de YouTube lê o feed público do canal (sem chave de API), ignora Shorts e fica em cache na CDN da Vercel por 1 hora. Para esconder ou fixar vídeos, edite `curation` no topo de `api/youtube.mjs`: `hide` e `pin` por trecho do título, `ids` com os links (IDs) dos vídeos fixados. Quando um vídeo fixado sai do feed, ele vem de `ids` (o título diz qual é qual, e o YouTube confirma que é do canal) ou, sem link, da página de vídeos do canal; views e data vêm da página do vídeo. O `.vercelignore` deixa `.env` e `server.mjs` fora do upload.

1. Importe este repositório na Vercel (preset "Other", sem build command).
2. Cadastre as três variáveis acima em Settings → Environment Variables.
3. Adicione `nandovoyager.com` e `www.nandovoyager.com` em Settings → Domains e crie no registrador os registros DNS que a Vercel mostrar.

## Configuração

- `site-config.js`: endpoint do cadastro, link do site da DeepChina (`deepchinaUrl`; vazio = o botão da DeepChina AI leva ao cadastro de e-mail) e redes, incluindo os links que abrem direto no app no celular.
- `img/` e `media/`: fotos em WebP (duas larguras cada, para o celular baixar a menor) e o vídeo dos bastidores em MP4 H.264, sem áudio, com pôster.
- `privacidade.html`: política de privacidade (LGPD).
- `img/og.jpg`: imagem de prévia 1200×630 para compartilhamento.

## Analytics

O `script.js` chama `window.nandoAnalytics.track(evento, propriedades)` se algum provedor de analytics definir essa função. Eventos: `social_click`, `deepchina_click`, `email_click`, `email_copy`, `youtube_video_click`, `newsletter_signup` (só depois que a API confirma).
