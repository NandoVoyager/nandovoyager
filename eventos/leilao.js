// Regras do leilão de vagas: entram os maiores lances e todos pagam o mesmo valor, o do último colocado que entrou.
// Função pura: recebe os lances guardados e devolve a classificação. Serve no servidor e na tela.
//
// lance: { id, valor, teto?, em }
//   valor: o lance que a pessoa deu (reais)
//   teto:  lance automático; se ela sair das vagas, o lance sobe sozinho só o necessário para voltar, até esse teto
//   em:    quando o lance foi dado (número ou data ISO); em empate, quem deu antes fica na frente

const time = bid => (typeof bid.em === "number" ? bid.em : Date.parse(bid.em) || 0);
const order = (a, b) => b.atual - a.atual || a.quando - b.quando;

export function classificar(lances, { vagas, minimo, passo = 10 }) {
  const bids = lances
    .filter(bid => bid.valor >= minimo)
    .map(bid => ({ id: bid.id, valor: bid.valor, teto: Math.max(bid.teto || 0, bid.valor), atual: bid.valor, quando: time(bid) }));

  // os lances automáticos disputam as vagas até ninguém mais poder (ou precisar) subir
  for (;;) {
    bids.sort(order);
    if (bids.length <= vagas) break;
    const corte = bids[vagas - 1].atual; // o último que entra
    const fora = bids.slice(vagas).find(bid => bid.teto > bid.atual);
    if (!fora) break;
    fora.atual = Math.min(fora.teto, Math.max(corte + passo, fora.atual + passo));
  }

  const dentro = bids.slice(0, vagas);
  const preco = dentro.length ? dentro.at(-1).atual : minimo; // o que todos pagam
  return {
    preco,
    // para entrar agora: o mínimo enquanto sobram vagas; depois, passar o último colocado
    paraEntrar: bids.length < vagas ? minimo : preco + passo,
    lances: bids.map((bid, i) => ({ id: bid.id, posicao: i + 1, dentro: i < vagas, lance: bid.atual, teto: bid.teto, automatico: bid.atual > bid.valor }))
  };
}

// quem estava dentro e saiu entre duas classificações: são os que recebem o aviso de "você foi ultrapassado"
export function ultrapassados(antes, depois) {
  const dentro = new Set(depois.lances.filter(bid => bid.dentro).map(bid => bid.id));
  return antes.lances.filter(bid => bid.dentro && !dentro.has(bid.id)).map(bid => bid.id);
}
