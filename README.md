# Nando Voyager — site

Página única de nandovoyager.com, em fundo preto. Abre com "Nando Voyager" se escrevendo sozinho em letra de mão, com uma luz que segue o mouse (clicar no nome do topo volta para essa abertura); a primeira rolagem toca uma animação 3D (three.js) em que uma fita de fotos passa pela tela, e pousa em quatro atalhos (o tempo de cada parte fica no bloco "timeline" do script):

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

## Eventos

Os eventos presenciais no Brasil abrem num popup da home, no mesmo visual da carta. O atalho "Eventos" fica acima dos quatro links. Hoje o popup mostra só o workshop em Santos; com uma cidade em `cidadesVotacao`, a parte da palestra volta a aparecer.

- `eventos/config.js`: a config única. Cidades em votação, regra de abertura (mínimos e prazo), dados de Santos, lotes, palestrantes, DeepChina e parceiro. Valor `null` não aparece na tela. Adicionar ou tirar cidade e mudar os números da regra é só aqui.
- `eventos/conteudo.js`: todos os textos. `TODO_COPY("dica")` marca um texto ainda não escrito: ele não aparece no site. Abra `/?eventos&todo` para ver o que falta.
- O popup é montado no script do `index.html` (bloco "Palestras") a partir desses dois arquivos.
- `/eventos` (o endereço para Instagram e podcasts) leva à home já com o popup aberto e mantém o resto do endereço, como `utm_source` e `cidade`.

Contagem regressiva: preencha `viraEm` no lote ativo de Santos (data e hora com fuso, ex. `"2026-12-01T23:59:00-03:00"`) e o popup mostra "Lote 1 encerra em" com dias, horas, minutos e segundos. Um lote também pode começar tantos dias antes do evento (`comecaDiasAntesDoEvento`, calculado a partir de `santos.data`, à meia-noite de Brasília): o lote anterior termina nesse momento e mostra "até" o dia anterior; ele mostra "após" esse mesmo dia. Depois da data, a contagem some; trocar o lote ativo continua manual.

Estado: fase 1 (estrutura e conteúdo estático). Mapa, contagem de votos, formulários e venda entram nas fases seguintes; os botões "Votar" e "Quero ser avisado" ainda não abrem formulário.

## Leilão de vagas

Com `santos.leilao.ativo: true` em `eventos/config.js`, a tela de Eventos mostra o leilão no lugar dos lotes.

Como funciona: a pessoa paga a entrada (R$ 300) por Pix e dá o lance máximo que quiser; pode aumentar depois, sem pagar de novo. Ficam os maiores lances (até `vagasTotal`) e todos pagam o mesmo valor, o do último que entrou, então ninguém paga mais que o preço final mesmo com um lance maior. Quem fica paga só a diferença (preço final menos a entrada); quem não fica recebe a entrada de volta. Quem fica e desiste perde a entrada, e a vaga passa para o próximo da fila, que paga o próprio lance.

Opcionais na config: `sinal` (ex. 0.3 cobra adiantado também 30% do lance; aumentar o lance passa a pedir outro Pix) e `automatico` (mostra o lance automático com teto). O lance automático sobe sozinho, só o necessário, até o teto que a pessoa definir.

Para ligar:

1. Preencha `santos.leilao.pix` (chave, nome do recebedor e cidade) e `encerraEm` na config.
2. Crie um projeto no Supabase e rode este SQL:

```sql
create table lances (
  id uuid primary key,
  token text not null unique,
  codigo text not null unique,
  nome text not null,
  email text not null unique,
  pix text not null,
  valor integer not null,
  teto integer,
  recebido integer not null default 0,
  desistiu boolean not null default false,
  em timestamptz not null default now()
);
alter table lances enable row level security;
```

3. Na Vercel, crie as variáveis `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` (a chave service_role; nunca no site) e `LEILAO_ADMIN` (uma senha sua).

No dia a dia:

- **Confirmar um pagamento:** o Pix chega com o código da pessoa (ex. `NV1A2B3C4D`) na identificação. No Supabase, escreva em `recebido` o total em reais que essa pessoa já pagou. O lance vale até onde esse valor cobre.
- **Fechamento:** abra `https://nandovoyager.com/api/leilao?relatorio=SUA_SENHA`. Vem o preço final e, para cada pessoa, quanto ela ainda paga (`pagar`) ou quanto você devolve (`devolver`), com a chave Pix dela, e a lista de quem ainda não pagou.
- **Desistência:** marque `desistiu` na linha da pessoa; o relatório passa a vaga para o próximo.

Para ver a tela no computador sem banco: `LEILAO_DEV=1 LEILAO_ADMIN=teste npm start` (os lances ficam só na memória). Testes: `npm test`.
