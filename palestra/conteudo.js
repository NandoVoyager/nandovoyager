// Todos os textos do popup Palestras. Nenhum texto aqui cita cidades, preços nem os números da regra:
// isso vem da config e é montado pela página.
//
// TODO_COPY("dica") marca um texto que o Nando ainda vai escrever. Ele NÃO aparece no site: o item some.
// Para ver o que falta, abra a página com ?todo no endereço (ex.: /palestra?todo).
// Os textos marcados com "rascunho" foram escritos a partir do roadmap e esperam revisão.
export const TODO_COPY = dica => ({ todo: dica });

export default {
  nav: { votacao: "Votação", imersao: "Workshop", duvidas: "Dúvidas", votar: "Votar" },

  hero: {
    titulo: "Meus primeiros eventos presenciais no Brasil.", // rascunho
    promessa: "Estou indo ao Brasil falar de importação e negócios com a China. O workshop já está confirmado. A palestra só acontece se tiver gente suficiente na lista.", // rascunho
    botao: "Quero ir à palestra",
    // sem nenhuma palestra na config, só com o workshop:
    soImersao: { titulo: "Meu primeiro evento presencial no Brasil.", promessa: "Estou indo ao Brasil para um dia inteiro ao vivo, em Santos: as minhas histórias, negócios, IA, geopolítica e como começar a importar da China." }, // rascunho
    linkSantos: "Quero o workshop em Santos",
    prazo: "Votação encerra em", // seguido da contagem; só aparece com data na config
  },

  votacao: {
    rotulo: "A palestra",
    itens: ["Mais sobre mentalidade: eu conto a minha história e o que aprendi no caminho.", "Respondo as dúvidas de cada um, com a minha opinião sincera, tentando ajudar.", "Motivação, negócios, IA e geopolítica.", "Para entrar na lista, você deixa nome, WhatsApp e e-mail.", "Entrar na lista não é comprar: quando a palestra for confirmada, eu aviso você."], // rascunho
    porPessoa: "por pessoa",
    selo: { votacao: "Lista aberta", prevenda: "Pré-venda aberta", aberta: "Ingressos à venda", encerrada: "Encerrado" },
    votar: "Quero ir",
  },

  santos: {
    rotulo: "O workshop",
    titulo: "O workshop em Santos está garantido.",
    resumo: { interesse: "Confirmado. 1 dia, manhã e tarde. Vagas limitadas.", esgotado: "As vagas esgotaram.", encerrada: "Este workshop já aconteceu." },
    itens: ["Um dia inteiro comigo, manhã e tarde.", "Minhas histórias, mentalidade, negócios, IA e geopolítica.", "Respondo as dúvidas de cada um, com a minha opinião sincera."], // rascunho
    aulas: "Introdução à importação com {nomes}.", // os nomes vêm da config: palestrantes confirmados e parceiro
    maximo: "Máximo de {n} pessoas",
    vagasLimitadas: "Vagas limitadas",
    botao: { interesse: "Quero ser avisado", prevenda: "Garantir vaga (lista)", aberta: "Garantir vaga", esgotado: "Entrar na lista de espera" },
  },

  porQueAgora: TODO_COPY("Por que agora: primeira vez presencial no Brasil, viagem curta. 2 ou 3 frases suas."),

  cards: {
    formatos: {
      rotulo: "Os dois formatos",
      titulo: "Workshop ou palestra.",
      itens: ["Workshop em Santos: 1 dia sobre negócios e importação. Premium, com vagas limitadas e vendida em lotes.", "Palestra: {duracaoPalestra} sobre mentalidade e a minha história, com espaço para as suas dúvidas. A entrada mais barata, também em lotes."], // rascunho
    },
    quem: { rotulo: "Quem está na sala", titulo: TODO_COPY("Título curto: pra quem é o evento."), itens: TODO_COPY("3 ou 4 perfis de quem deve ir (ex.: quem já importa, quem quer começar...).") },
    leva: { rotulo: "O que você leva", titulo: TODO_COPY("Título curto: o que a pessoa leva pra casa."), itens: TODO_COPY("Resultados concretos, separados por formato (workshop e palestra).") },
    formato: {
      rotulo: "O formato",
      titulo: "Manhã. Almoço. Tarde.",
      itens: TODO_COPY("Programação do workshop: o que acontece no bloco da manhã e no bloco da tarde."),
    },
    deepchina: {
      rotulo: "DeepChina AI",
      titulo: "O acesso fundador abre nos eventos.", // rascunho
      oferta: "Nos eventos eu lanço o acesso fundador da DeepChina, a minha IA de importação.", // rascunho; a config pode trocar (deepchina.textoOferta)
    },
  },

  fraseGigante: TODO_COPY("Frase gigante na cor de destaque, em 2 ou 3 linhas curtas."),

  recado: {
    titulo: "Um recado do Nando",
    assinatura: "Nando",
    paragrafos: TODO_COPY("Recado pessoal em primeira pessoa: 3 a 5 parágrafos curtos."),
  },

  faq: {
    titulo: "Dúvidas",
    itens: [
      // "palestra: true" = só aparece quando há palestra na config
      { palestra: true, p: "Como a palestra é confirmada?", r: "{regra}" },
      { palestra: true, p: "E se a lista não chegar ao mínimo?", r: TODO_COPY("O que acontece se a palestra não atingir o mínimo de pessoas.") },
      { p: "Quando abre a venda?", r: TODO_COPY("Quando a venda abre depois da votação.") },
      { palestra: true, p: "Qual a diferença entre o workshop e a palestra?", r: "O workshop em Santos dura 1 dia, manhã e tarde, e é focado em negócios e importação. É premium e tem vagas limitadas. A palestra dura {duracaoPalestra}, é mais sobre mentalidade e a minha história, com as dúvidas de cada um respondidas, e é a entrada mais barata." }, // rascunho
      { p: "O almoço está incluso no workshop?", r: TODO_COPY("Almoço incluso ou não.") },
      { p: "Posso pedir reembolso?", r: TODO_COPY("Política de reembolso.") },
      { p: "Vocês emitem nota fiscal?", r: TODO_COPY("Nota fiscal.") },
      { p: "O evento vai ser gravado?", r: TODO_COPY("Gravação.") },
      { p: "Posso transferir o meu ingresso?", r: TODO_COPY("Transferência de ingresso.") },
    ],
  },

  final: { botaoSantos: "Quero o workshop em Santos" }, // rascunho
  rodape: { privacidade: "Política de Privacidade", voltar: "nandovoyager.com" },
};
