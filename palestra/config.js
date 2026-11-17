// Config única da página /palestra. Tudo o que é dado de evento mora aqui: cidades, regra da votação,
// datas, preços, vagas, palestrantes. A página e as funções da API leem este mesmo arquivo.
// Valores ainda não confirmados ficam null e simplesmente não aparecem na tela.
//
// Tipos (o site não tem build, então ficam em comentário):
//   Lote          { nome: "Lote 1"|"Lote 2"|"Lote 3", preco: number|null, linkCheckout: string, ativo: boolean, viraEm?: string }
//   CidadeVotacao { id, nome, uf, lat, lng, status: "votacao"|"prevenda"|"aberta"|"encerrada", evento?: { data, horario, local, lotes: Lote[] } }

export default {
  modo: "votacao", // "votacao" | "venda" | "encerrado"

  // Imersão de 1 dia, confirmada, sem votação.
  santos: {
    status: "interesse", // "interesse" | "prevenda" | "aberta" | "esgotado" | "encerrada"
    data: null,          // um único dia, ISO (ex.: "2027-03-14")
    horarioManha: null,  // ex.: "9h às 12h30"
    horarioTarde: null,  // ex.: "14h às 18h"
    local: null,
    vagasTotal: null,     // null = mostra só "vagas limitadas"
    vagasRestantes: null, // atualizado à mão; null = não mostra contagem
    lotes: [],
    lat: -23.9608, lng: -46.3336,
  },

  regraAbertura: {
    minimoPrimeira: 100,    // a mais votada abre com pelo menos isso
    minimoSegunda: 300,     // a segunda também abre se passar disso
    maxCidades: 2,
    votacaoEncerraEm: null, // data ISO; null = sem prazo exibido
  },

  // Palestra de 4 horas. Lista de tamanho livre: adicionar ou tirar uma cidade é só mexer aqui.
  cidadesVotacao: [
    { id: "sao-paulo", nome: "São Paulo", uf: "SP", lat: -23.5505, lng: -46.6333, status: "votacao" },
    { id: "campinas", nome: "Campinas", uf: "SP", lat: -22.9099, lng: -47.0626, status: "votacao" },
    { id: "florianopolis", nome: "Florianópolis", uf: "SC", lat: -27.5949, lng: -48.5482, status: "votacao" },
    { id: "rio-de-janeiro", nome: "Rio de Janeiro", uf: "RJ", lat: -22.9068, lng: -43.1729, status: "votacao" },
  ],

  // Referência de preço da palestra enquanto nenhuma cidade abriu (provisório). Lote sem preço não aparece.
  lotesReferencia: [
    { nome: "Lote 1", preco: 247, linkCheckout: "", ativo: true },
    { nome: "Lote 2", preco: null, linkCheckout: "", ativo: false },
    { nome: "Lote 3", preco: null, linkCheckout: "", ativo: false },
  ],

  duracaoImersao: "1 dia",    // usado nos blocos de número e nos textos
  duracaoPalestra: "4 horas",

  // Só aparece quem tem confirmado: true.
  palestrantes: [
    // { nome: "", cargo: "", empresa: "", foto: "", confirmado: false },
  ],
  deepchina: { mostrar: true, textoOferta: null }, // textoOferta null = usa o texto padrão do arquivo de conteúdo
  parceiro: { nome: "China Link", logo: "", mostrar: false },
  linkGrupoWhatsApp: "",

  // Fase 8 (páginas de patrocínio e de inscrição de palestrante): desligadas por enquanto.
  patrocinio: { mostrar: false, vagasPatrocinio: null, cotas: [] },
  palestrar: { mostrar: false, temas: ["Importação", "Negócios com a China", "Logística e tributação", "IA aplicada"], formatos: ["Palestra", "Painel", "Bate-papo"] },
};
