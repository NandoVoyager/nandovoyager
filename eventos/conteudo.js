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
    soImersao: { promessa: "Meu primeiro evento presencial: um dia inteiro de imersão comigo em Alphaville, São Paulo." }, // rascunho; aparece logo abaixo do título do workshop
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

  // Leilão de vagas (aparece quando santos.leilao.ativo é true na config). {vagas}, {entrada}, {preco}, {paraEntrar}, {posicao}, {lance} e {codigo} são preenchidos pela tela.
  leilao: {
    rotulo: "Leilão de vagas",
    comoFunciona: "Como funciona",
    regra: "Entre com {entrada} por Pix e dê o seu lance, a partir de {minimo}. Ficam os {vagas} maiores lances e todos pagam o mesmo valor: o do último que entrou. Quem fica paga só a diferença; quem não fica recebe os {entrada} de volta.",
    desistencia: "Se você ficar entre os {vagas} e desistir, a entrada de {entrada} não é devolvida e a vaga passa para o próximo da fila.",
    precoAgora: "Preço agora", paraEntrar: "Para entrar", lances: "Lances pagos", corte: "Fora das vagas", voce: "Você",
    campoFoto: "Sua foto", campoFotoDica: "Toque para escolher. Aparece ao lado do seu lance.", fotoErro: "Não deu para usar essa foto. Tente outra.",
    anonimo: "Anônimo", anonimoOpcao: "Entrar como anônimo", anonimoDica: "Seu lance aparece sem nome, foto nem Instagram.", campoNomeAnonimo: "Seu nome (só eu vejo)", publicoAnonimo: "Na lista você aparece como Anônimo. Nome, e-mail e chave Pix ficam só comigo.",
    campoNome: "Seu nome (aparece na lista)", campoInstagram: "Seu Instagram (opcional)",
    publico: "Seu nome, sua foto e seu Instagram aparecem na lista para todos. E-mail e chave Pix ficam só comigo.",
    campoLance: "Seu lance máximo (R$)", lanceDica: "Você nunca paga mais que o preço final, mesmo com um lance maior. Dá para aumentar depois, sem pagar de novo.", campoPix: "Sua chave Pix (para a devolução)",
    automatico: "Lance automático", automaticoDica: "Sobe sozinho, só o necessário, para você não sair das vagas.", campoTeto: "Até quanto pode subir (R$)",
    entrarTitulo: "Entrar no leilão", entrarTexto: "Os lances começam em {minimo}. Agora você paga só os {entrada} da entrada; o resto, só se ficar com a vaga.", pixAgora: "Pix agora: {agora}", entrarBotao: "Entrar no leilão",
    pagarTitulo: "Pague {falta} por Pix", pagarTexto: "Leia o QR code no app do seu banco ou copie o código. Seu lance vale assim que o pagamento for confirmado.",
    aguardando: "Aguardando o seu Pix", aguardandoTexto: "Seu lance entra na fila quando o pagamento for confirmado. Você ainda pode mudar o valor.", pagarCodigo: "Seu código: {codigo}", copiar: "Copiar código Pix", copiado: "Copiado",
    dentroTitulo: "Você está em #{posicao}", dentro: "Dentro", dentroTexto: "Seu lance agora é de {lance}. Se o leilão fechasse agora, você pagaria {preco}.",
    foraTitulo: "Você está em #{posicao}", fora: "Fora", foraTexto: "Você foi ultrapassado. Para voltar, o lance precisa ser de pelo menos {paraEntrar}.",
    lanceBotao: "Atualizar lance",
    encerrado: "Leilão encerrado", fimGeral: "O preço final ficou em {preco}.", fimDentro: "Você ficou com a vaga. O preço final é {preco}; eu entro em contato para acertar a diferença.", fimFora: "Você não ficou entre os {vagas}. Sua entrada de {entrada} será devolvida na chave Pix que você informou.",
    contagem: "Leilão encerra em",
  },
  // Mentoria em grupo online (cartão da página inicial)
  mentoria: {
    emBreve: "Data em breve · Zoom",
    mensagem: "Oi, Nando! Vim pelo seu site e quero participar da mentoria em grupo online.",
  },
  santos: {
    rotulo: "A imersão",
    titulo: "Imersão presencial em Alphaville.",
    resumo: { interesse: "Confirmado. 1 dia, manhã e tarde. Vagas limitadas.", esgotado: "As vagas esgotaram.", encerrada: "Este workshop já aconteceu." },
    itens: ["Um dia inteiro comigo, manhã e tarde.", "China real, minhas histórias, mentalidade, negócios, IA e geopolítica.", "Respondo as dúvidas de cada um, com a minha opinião sincera."], // rascunho
    aulas: "Introdução à importação com {nomes}.", // os nomes vêm da config: palestrantes confirmados e parceiro
    maximo: "Máximo de {n} pessoas",
    minimo: "Mínimo de {min} pessoas", // só aparece quando a config tem vagasMinimo
    reembolso: "Se não chegar a {min} pessoas, eu devolvo o dinheiro.",
    emBreve: "Data em breve",
    cartaoLote: "Preço do {lote}{ate}. Depois, {depois}.", // sob o preço, no cartão da página inicial; {ate} vira " até quinta-feira, 23h59" quando o lote tem data de fim
    loteEncerrado: "encerrado", // ao lado de um lote cuja data já passou
    contagemFim: "Inscrições encerram em", // quando o lote ativo não tem data: conta até o fim do último lote
    contagemCurta: "Encerra em", // a contagem pequena no atalho da página inicial
    contagemCurtaLote: "{lote} encerra em",
    contagem: "{lote} encerra em", // seguido da contagem regressiva; só aparece se o lote ativo tiver viraEm na config
    vagasLimitadas: "Vagas limitadas",
    mensagem: "Oi, Nando! Vim pelo seu site e quero garantir a minha vaga na imersão em Alphaville{lote}.", // {lote} vira o lote à venda e o preço, ex. " (Lote 1, R$ 2.000)" // a mensagem pronta que o botão leva ao WhatsApp
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
