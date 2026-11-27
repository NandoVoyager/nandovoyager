// Config única da popup de eventos. Tudo o que é dado de evento mora aqui: cidades, regra da votação,
// datas, preços, vagas, palestrantes. A página e as funções da API leem este mesmo arquivo.
// Valores ainda não confirmados ficam null e simplesmente não aparecem na tela.
//
// Tipos (o site não tem build, então ficam em comentário):
//   Lote          { nome: "Lote 1"|"Lote 2"|"Lote 3", preco: number|null, linkCheckout: string, ativo: boolean, viraEm?: string }
//   CidadeVotacao { id, nome, uf, lat, lng, status: "votacao"|"prevenda"|"aberta"|"encerrada", evento?: { data, horario, local, lotes: Lote[] } }

export default {
  modo: "votacao", // "votacao" | "venda" | "encerrado"

  // Imersão de 1 dia no Panamby (Morumbi), São Paulo. (A chave continua "santos" por causa do código.)
  santos: {
    status: "aberta", // "interesse" | "prevenda" | "aberta" | "esgotado" | "encerrada"
    data: "2026-11-28",  // um único dia, ISO (ex.: "2027-03-14"); null = "data em breve"
    horario: "11h às 17h", // aparece ao lado da data
    cidade: "Panamby, Morumbi · São Paulo", // aparece ao lado da data
    horarioManha: null,  // ex.: "9h às 12h30"
    horarioTarde: null,  // ex.: "14h às 18h"
    local: null,
    vagasMinimo: null,   // mínimo de pessoas para acontecer (aparece só na versão com votação de cidades); null = não mostra
    vagasTotal: 150,      // máximo de pessoas; null = mostra só "vagas limitadas"
    vagasRestantes: null, // atualizado à mão; null = não mostra contagem
    // Leilão de vagas: a pessoa paga a entrada por Pix e dá o lance máximo que quiser (pode aumentar depois, sem pagar
    // de novo). Entram os maiores lances e todos pagam o valor do último que entrou; quem ficou dentro paga só a
    // diferença, quem ficou de fora recebe a entrada de volta.
    // Com ativo: true, a tela mostra o leilão no lugar dos lotes.
    leilao: {
      ativo: false,
      entrada: 300, // em reais: o Pix para participar
      lanceMinimo: 500, // o leilão começa neste valor (sem ele, vale a entrada)
      sinal: 0, // 0 = só a entrada. Com 0.3, a pessoa também paga adiantado 30% do lance (os textos em conteudo.js falam só da entrada)
      automatico: false, // true mostra o lance automático (teto); desnecessário quando todos pagam o preço de corte
      passo: 10, // quanto um lance precisa passar o outro
      encerraEm: null, // data e hora com fuso, ex. "2026-11-25T23:59:00-03:00"
      pix: { chave: "", nome: "", cidade: "" }, // conta que recebe as entradas: chave Pix, nome do recebedor e cidade
    },
    lotes: [ // preço por pessoa; com preco: null o lote não aparece
      { nome: "Presencial", preco: 497, linkCheckout: "", ativo: true }, // preço único, sem virada de lote. Para ter lotes de novo, acrescente outro abaixo e ponha viraEm (data e hora do fim) neste
    ],
    lat: -23.9608, lng: -46.3336,
  },

  regraAbertura: {
    minimoPrimeira: 300,    // a palestra acontece com pelo menos isso de pessoas na lista
    minimoSegunda: 300,     // só vale com mais de uma cidade: a segunda também abre se passar disso
    maxCidades: 1,
    votacaoEncerraEm: null, // data ISO; null = sem prazo exibido
  },

  // Palestra de 4 horas em outra cidade. Hoje não há nenhuma: só o workshop de Santos. Com a lista vazia, tudo
  // o que fala da palestra some do popup. Para voltar com São Paulo, descomente a linha abaixo.
  cidadesVotacao: [
    // { id: "sao-paulo", nome: "São Paulo", uf: "SP", lat: -23.5505, lng: -46.6333, status: "votacao" },
  ],

  // Preço da palestra por pessoa enquanto ela não abriu. Lote sem preço não aparece.
  lotesReferencia: [
    { nome: "Lote 1", preco: 500, linkCheckout: "", ativo: true },
    { nome: "Lote 2", preco: 1000, linkCheckout: "", ativo: false },
    { nome: "Lote 3", preco: 1500, linkCheckout: "", ativo: false },
  ],

  duracaoImersao: "1 dia",    // usado nos blocos de número e nos textos
  duracaoPalestra: "4 horas",

  // Só aparece quem tem confirmado: true.
  // Mentoria em grupo online (cartão da página inicial). data null = "Data em breve".
  // turmas: a pessoa escolhe uma ao reservar; uma turma some do site depois que a data passa
  // "mentoria" hoje é a entrada ONLINE da mesma imersão (mesmo dia e horário do presencial)
  // lotes do online: mesmo formato dos lotes do presencial; "preco" é usado só se não houver lotes
  // linkCheckout: endereço do checkout do online (Kiwify). Cada lote pode ter o seu; o do lote à venda vale primeiro. Vazio, a compra vai pelo WhatsApp.
  mentoria: { linkCheckout: "", preco: 97, precoPergunta: 97, lotes: [{ nome: "Online", preco: 97, linkCheckout: "https://pay.kiwify.com.br/AE5KOGv" }], data: "2026-11-28", horario: "11h às 17h", turmas: [{ data: "2026-11-28", horario: "11h às 17h" }] }, // horario ex.: "20h (Brasília)"
  palestrantes: [
    { nome: "Lincoln Fracari", cargo: "", empresa: "", foto: "", confirmado: false }, // com true, entra a linha "Introdução à importação com…" na lista
  ],
  deepchina: { mostrar: false, textoOferta: null }, // textoOferta null = usa o texto padrão do arquivo de conteúdo
  parceiro: { nome: "China Link", logo: "", mostrar: false }, // com true, entra junto na mesma linha
  linkGrupoWhatsApp: "",

  // Fase 8 (páginas de patrocínio e de inscrição de palestrante): desligadas por enquanto.
  patrocinio: { mostrar: false, vagasPatrocinio: null, cotas: [] },
  palestrar: { mostrar: false, temas: ["Importação", "Negócios com a China", "Logística e tributação", "IA aplicada"], formatos: ["Palestra", "Painel", "Bate-papo"] },
};
