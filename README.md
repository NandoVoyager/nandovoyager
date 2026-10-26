# Nando Voyager — landing page

Landing page de branding pessoal de nandovoyager.com: abertura com foto e cadastro de e-mail (Resend), últimos vídeos do YouTube, resumo da DeepChina AI, minha história, bastidores (fotos e vídeo), serviços e contato com o e-mail de parcerias. HTML/CSS/JS puro, sem etapa de build.

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
| `YOUTUBE_CHANNEL_ID` | Opcional. ID do canal (`UC…`) para a seção de vídeos. O do @NandoVoyager (`UCqW3NTDBn9esY-oD7iCQhAQ`) já está no código; use a variável só para trocar de canal. |

## Publicar (Vercel)

Os arquivos estáticos são servidos como estão e `api/subscribe.mjs` e `api/youtube.mjs` rodam como funções serverless (export default). A de YouTube lê o feed público do canal (sem chave de API), ignora Shorts e fica em cache na CDN da Vercel por 1 hora. Para esconder ou fixar vídeos, edite `curation` no topo de `api/youtube.mjs`: `hide` e `pin` por trecho do título, `ids` com os links (IDs) dos vídeos fixados. Quando um vídeo fixado sai do feed, ele vem de `ids` (o título diz qual é qual, e o YouTube confirma que é do canal) ou, sem link, da página de vídeos do canal; views e data vêm da página do vídeo. Todo vídeo sem número de views o busca na página do vídeo ou, se o YouTube não responder, na API pública do Return YouTube Dislike. A resposta inteira cabe em 9 s, dentro do limite padrão de 10 s da Vercel. O `.vercelignore` deixa `.env` e `server.mjs` fora do upload.

1. Importe este repositório na Vercel (preset "Other", sem build command).
2. Cadastre as três variáveis acima em Settings → Environment Variables.
3. Adicione `nandovoyager.com` e `www.nandovoyager.com` em Settings → Domains e crie no registrador os registros DNS que a Vercel mostrar.

## Configuração

- `site-config.js`: endpoint do cadastro, link do site da DeepChina (`deepchinaUrl`; vazio = o botão da DeepChina AI leva ao cadastro de e-mail) e redes, incluindo os links que abrem direto no app no celular.
- `img/` e `media/`: fotos em WebP (duas larguras cada, para o celular baixar a menor) e o vídeo dos bastidores em MP4 H.264, sem áudio, com pôster.
- `privacidade.html`: política de privacidade (LGPD). `404.html`: página de erro que a Vercel mostra para links inexistentes.
- `robots.txt` e `sitemap.xml`: indexação no Google.
- `consultoria/index.html` + `apply.js` + `api/apply.mjs`: aplicação para a consultoria de importação (nandovoyager.com/consultoria). As respostas vão por e-mail pelo Resend para `LEADS_TO` (padrão contato@nandovoyager.com), enviadas de `LEADS_FROM`, que precisa ser de um domínio verificado no Resend (Domains → nandovoyager.com). Se o envio falhar, a página oferece mandar as mesmas respostas por e-mail.
- Cadastro: o campo escondido `website` é uma armadilha para bots; quando vem preenchido, a API responde que deu certo e não salva nada.
- `img/og.jpg`: imagem de prévia 1200×630 para compartilhamento.

## Analytics

O `script.js` chama `window.nandoAnalytics.track(evento, propriedades)` se algum provedor de analytics definir essa função. Eventos: `social_click`, `deepchina_click`, `email_click`, `email_copy`, `youtube_video_click`, `newsletter_signup` (só depois que a API confirma).
