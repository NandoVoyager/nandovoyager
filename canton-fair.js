/* Imersão Canton Fair: pacotes mostrados na janela que abre pelo cartão principal (ou pelo link nandovoyager.com/#canton-fair). Valores em reais. */
window.NANDO_CANTON_FAIR = {
  eyebrow: "Imersão Canton Fair · Outubro",
  title: "Escolha seu roteiro",
  intro: "Todos os roteiros incluem hospedagem 4/5 estrelas, alimentação completa, transporte interno, trens e tradutores.",
  whatsappMessage: "Olá! Quero saber mais sobre a Imersão Canton Fair.",
  /* Destinos e feiras explicados dentro de cada pacote (cada pacote lista os seus em `places`). */
  places: {
    hongkong: {
      name: "Hong Kong",
      where: "Região Administrativa Especial",
      text: "Centro financeiro e de comércio internacional da Ásia e porta de entrada para o sul da China, a cerca de uma hora de trem-bala de Guangzhou."
    },
    canton: {
      name: "Canton Fair (Feira de Cantão)",
      where: "Guangzhou · Fases 1 e 2",
      text: "A maior feira de comércio exterior da China, realizada em Guangzhou desde 1957, com milhares de fábricas expositoras em um só lugar. A Fase 1 reúne eletrônicos, eletrodomésticos, máquinas, ferramentas e materiais de construção. A Fase 2 reúne artigos para casa, decoração, presentes, utensílios e móveis."
    },
    mif: {
      name: "MIF (Feira Internacional de Macau)",
      where: "Macau",
      text: "Feira Internacional de Comércio e Investimento de Macau, realizada todo mês de outubro. Macau é a ponte entre a China e os países de língua portuguesa, e a feira reúne empresas, governos e investidores com foco nesses mercados. É um bom ambiente para empresários brasileiros fazerem contatos."
    },
    shanxi: {
      name: "Polo Industrial do Norte",
      where: "Shanxi",
      text: "A província de Shanxi, no norte da China, é uma das principais bases de energia e indústria pesada do país, com forte presença de siderurgia, metalurgia e máquinas. É onde se vê de perto a escala da produção industrial chinesa, fora do circuito das feiras."
    },
    pequim: {
      name: "Pequim",
      where: "Capital da China",
      text: "Encerramento da jornada na capital do país, com a agenda institucional e cultural da programação."
    }
  },
  packages: [
    {
      id: "grande-baia",
      number: 1,
      name: "Grande Baía",
      badge: "Mais popular",
      days: 10,
      dates: "17 a 26 de outubro",
      route: "Cantão + Macau",
      destinations: "Guangzhou (Feira de Cantão, Fases 1 e 2) + Macau (Feira MIF)",
      places: ["canton", "mif"],
      departure: "Por Hong Kong",
      forWhom: "Ideal para o empresário que quer focar 100% em feiras de negócios, importação e negociação direta com fábricas, com um roteiro mais curto e objetivo.",
      rooms: [
        { label: "Quarto individual", note: "1 pessoa", pix: 34000, card: 36900 },
        { label: "Casal ou dupla", note: "Por pessoa", pix: 32000, card: 34700 }
      ]
    },
    {
      id: "sem-pequim",
      number: 2,
      name: "Sem Pequim",
      days: 16,
      dates: "17 de outubro a 1º de novembro",
      route: "Cantão + Macau + Shanxi",
      destinations: "Grande Baía (Cantão + Macau) + Polo Industrial do Norte (Shanxi)",
      places: ["canton", "mif", "shanxi"],
      departure: "Por Hong Kong",
      forWhom: "Para quem quer a imersão completa de feiras + indústria do Norte, mas precisa retornar antes do encerramento final da programação em Pequim.",
      rooms: [
        { label: "Quarto individual", note: "1 pessoa", pix: 49000, card: 53400 },
        { label: "Casal ou dupla", note: "Por pessoa", pix: 47000, card: 51200 }
      ]
    },
    {
      id: "jornada-completa",
      number: 3,
      name: "Jornada Completa",
      days: 17,
      dates: "17 de outubro a 2 de novembro",
      route: "Hong Kong + Cantão + Macau + Shanxi + Pequim",
      destinations: "Hong Kong + Cantão + Macau + Shanxi + Pequim",
      places: ["hongkong", "canton", "mif", "shanxi", "pequim"],
      departure: "Por Pequim",
      forWhom: "A experiência definitiva e mais profunda: todas as feiras de negócios do Sul, todo o polo industrial do Norte e a agenda institucional e cultural de Pequim.",
      rooms: [
        { label: "Quarto individual", note: "1 pessoa", pix: 52000, card: 56700 },
        { label: "Casal ou dupla", note: "Por pessoa", pix: 50000, card: 54500 }
      ]
    }
  ],
  included: [
    "Hotéis 4 e 5 estrelas (categoria internacional)",
    "Alimentação completa: café da manhã, almoço, jantar e jantares de gala e institucionais",
    "Transporte terrestre, trens de alta velocidade e voos domésticos na China, conforme o roteiro",
    "Credenciamento VIP: Feira de Cantão + MIF Macau",
    "Guias, tradutores português–chinês e aparelhos de tradução simultânea",
    "Seguro-viagem internacional e suporte com visto"
  ],
  payment: [
    ["PIX ou transferência", "Pagamento à vista, pelo menor valor."],
    ["Cartão", "Pagamento à vista, pelo valor indicado no cartão."]
  ]
};
