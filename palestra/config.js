// Config única da página /palestra. Tudo o que é dado de evento mora aqui: cidades, regra da votação,
// datas, preços, vagas, palestrantes. A página e as funções da API leem este mesmo arquivo.
// Valores ainda não confirmados ficam null e simplesmente não aparecem na tela.
//
// Tipos (o site não tem build, então ficam em comentário):
//   Lote          { nome: "Lote 1"|"Lote 2"|"Lote 3", preco: number|null, linkCheckout: string, ativo: boolean, viraEm?: string }
//   CidadeVotacao { id, nome, uf, lat, lng, status: "votacao"|"prevenda"|"aberta"|"encerrada", evento?: { data, horario, local, lotes: Lote[] } }

export default {
  modo: "votacao", // "votacao" | "venda" | "encerrado"

  // Workshop de 1 dia em Santos, confirmado.
  santos: {
    status: "interesse", // "interesse" | "prevenda" | "aberta" | "esgotado" | "encerrada"
    data: "2026-11-28",  // um único dia, ISO (ex.: "2027-03-14")
    horarioManha: null,  // ex.: "9h às 12h30"
    horarioTarde: null,  // ex.: "14h às 18h"
    local: null,
    vagasTotal: 50,       // máximo de pessoas; null = mostra só "vagas limitadas"
    vagasRestantes: null, // atualizado à mão; null = não mostra contagem
    lotes: [ // preço por pessoa
      { nome: "Lote 1", preco: 2000, linkCheckout: "", ativo: true, viraEm: null }, // viraEm: data e hora em que o lote termina, ex. "2026-12-01T23:59:00-03:00"; com ela, o popup mostra a contagem regressiva
      { nome: "Lote 2", preco: 2500, linkCheckout: "", ativo: false, diasAntesDoEvento: 3 }, // termina 3 dias antes do evento (calculado a partir de santos.data)
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
  palestrantes: [
    { nome: "Lincoln Fracari", cargo: "", empresa: "", foto: "", confirmado: true }, // dá aula no workshop de Santos
  ],
  deepchina: { mostrar: false, textoOferta: null }, // textoOferta null = usa o texto padrão do arquivo de conteúdo
  parceiro: { nome: "China Link", logo: "", mostrar: true }, // participa do workshop de Santos
  linkGrupoWhatsApp: "",

  // Fase 8 (páginas de patrocínio e de inscrição de palestrante): desligadas por enquanto.
  patrocinio: { mostrar: false, vagasPatrocinio: null, cotas: [] },
  palestrar: { mostrar: false, temas: ["Importação", "Negócios com a China", "Logística e tributação", "IA aplicada"], formatos: ["Palestra", "Painel", "Bate-papo"] },
};
