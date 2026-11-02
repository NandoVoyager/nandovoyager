# Nando Voyager — site

Página única de nandovoyager.com, em fundo preto. Abre com "Nando Voyager" se escrevendo sozinho em letra de mão, com uma luz que segue o mouse (clicar no nome do topo volta para essa abertura); a primeira rolagem toca uma animação 3D (three.js) em que uma fita de fotos passa pela tela, quase parando quando cada foto chega na frente, e pousa em quatro atalhos (o tempo de cada parte fica no bloco "timeline" do script):

- **DeepChina AI**: abre o site da DeepChina (`deepchinaUrl` em `site-config.js`); enquanto estiver vazio, leva ao cadastro de e-mail.
- **Imersão Canton Fair**: formulário curto em popup (fase da feira e contato) para marcar uma call gratuita.
- **Meus serviços**: formulário curto em popup (do que precisa, o que quer importar, investimento e contato). Todo serviço começa com uma consultoria de importação de 1 hora por R$ 1.000, creditados se a pessoa fechar, e o formulário só envia com esse aceite.
- **Minha história**: carta pessoal em formato de e-mail, com dicas de importação e atalhos para a DeepChina AI, os serviços e o cadastro de e-mail da página.

Também tem o cadastro "Entre na minha mente" e os ícones das redes com o número de seguidores. HTML/CSS/JS puro em um arquivo só (`index.html`), sem etapa de build.

## Rodar localmente

Requer Node.js 22.9+.

```sh
cp .env.example .env   # depois preencha os valores
npm start
```

Abra http://127.0.0.1:4173. O `npm start` roda o `server.mjs`, que serve os arquivos estáticos, o `POST /api/subscribe` e o `POST /api/lead`.

## Variáveis de ambiente

| Nome | O que é |
| --- | --- |
| `RESEND_API_KEY` | Chave da API do Resend (`re_…`). Só no servidor, nunca em `site-config.js` ou no navegador. |
| `RESEND_SEGMENT_ID` | ID (UUID) do Segment do Resend onde entram os inscritos, não o nome dele. |
| `SITE_ORIGIN` | Origens permitidas, separadas por vírgula, ex.: `https://nandovoyager.com,https://www.nandovoyager.com`. Vazio no ambiente local. |
| `LEADS_TO` | Quem recebe os pedidos dos formulários (padrão contato@nandovoyager.com). |
| `LEADS_FROM` | Remetente desses e-mails, de um domínio verificado no Resend (Domains → nandovoyager.com). |

## Publicar (Vercel)

Os arquivos estáticos são servidos como estão e `api/subscribe.mjs` e `api/lead.mjs` rodam como funções serverless (export default). O `vercel.json` redireciona os endereços antigos (`/intro` e `/consultoria`) para a página principal. O `.vercelignore` deixa `.env` e `server.mjs` fora do upload.

1. Importe este repositório na Vercel (preset "Other", sem build command).
2. Cadastre as variáveis acima em Settings → Environment Variables.
3. Adicione `nandovoyager.com` e `www.nandovoyager.com` em Settings → Domains e crie no registrador os registros DNS que a Vercel mostrar.

## Configuração

- `site-config.js`: endpoint do cadastro, link do site da DeepChina (`deepchinaUrl`) e redes (o LinkedIn aparece quando `socialLinks.linkedin.web` for preenchido).
- `index.html`: textos, atalhos, formulários e a carta. As fotos da fita ficam na lista `WORK` do script (as quatro primeiras são as dos atalhos; cada uma pode ter `zoom`, `focus` e `gain` para o recorte). Os números de seguidores ficam nos ícones do topo e da fileira do celular.
- `img/`: fotos em WebP. Fotos do iPhone (HEIC) precisam ser convertidas antes.
- `privacidade.html`: política de privacidade (LGPD). `404.html`: página de erro que a Vercel mostra para links inexistentes.
- `robots.txt` e `sitemap.xml`: indexação no Google. `img/og.jpg`: imagem de prévia 1200×630 para compartilhamento.
- Formulários: o campo escondido `website` é uma armadilha para bots; quando vem preenchido, a API responde que deu certo e não salva nem envia nada. Se o envio de um pedido falhar, o formulário oferece mandar as mesmas respostas por e-mail.
