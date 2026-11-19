// Leilão de vagas do workshop (regras em eventos/leilao.js, dados em eventos/config.js > santos.leilao).
// Cada pessoa paga a entrada por Pix para participar e dá o lance que quiser. No fechamento, quem ficou dentro paga a
// diferença até o preço final (o lance do último que entrou) e quem ficou de fora recebe a entrada de volta.
//
// Os lances ficam numa tabela "lances" do Supabase (SUPABASE_URL e SUPABASE_SERVICE_KEY; o SQL está no README).
// LEILAO_ADMIN: senha para confirmar pagamentos e tirar o relatório final.
import { randomBytes, randomUUID } from "node:crypto";
import talks from "../eventos/config.js";
import { classificar, ultrapassados } from "../eventos/leilao.js";
import { pixCopiaECola } from "../eventos/pix.js";

const json = (res, status, body) => res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" }).end(JSON.stringify(body));
const clean = (value, max) => String(value ?? "").trim().slice(0, max);
// o nome de usuário do Instagram, sem @ nem endereço; a foto chega pequena (a tela reduz antes de enviar)
const handle = (value) => { const name = clean(value, 80).replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/[/?].*$/, ""); return /^[A-Za-z0-9._]{1,30}$/.test(name) ? name : null; };
const photo = (value) => (typeof value === "string" && value.length <= 40_000 && /^data:image\/(jpeg|webp|png);base64,[A-Za-z0-9+/=]+$/.test(value) ? value : null);
const whole = (value) => (Number.isInteger(value) && value > 0 && value <= 1_000_000 ? value : null);

// Supabase pelo REST, só do servidor. Sem as chaves, o leilão responde "não configurado".
export function supabaseStore(env = process.env) {
  const base = env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY ? `${env.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/lances` : null;
  if (!base) return null;
  const call = async (path, init = {}) => {
    const response = await fetch(base + path, {
      ...init,
      headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation", ...init.headers }
    });
    if (!response.ok) throw new Error(`Supabase ${response.status}: ${(await response.text()).slice(0, 200)}`);
    return response.json();
  };
  return {
    list: () => call("?select=*&order=em.asc"),
    insert: (bid) => call("", { method: "POST", body: JSON.stringify(bid) }).then((rows) => rows[0]),
    update: (id, patch) => call(`?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(patch) }).then((rows) => rows[0])
  };
}

// Guarda em memória: para os testes e para ver a tela no computador (LEILAO_DEV=1).
export function memoryStore(bids = []) {
  return {
    list: async () => bids.map((bid) => ({ ...bid })),
    insert: async (bid) => (bids.push({ ...bid }), { ...bid }),
    update: async (id, patch) => Object.assign(bids.find((bid) => bid.id === id), patch)
  };
}

const floor = (auction) => Math.max(auction.lanceMinimo || 0, auction.entrada);
const rules = (auction) => ({ vagas: talks.santos.vagasTotal, minimo: floor(auction), passo: auction.passo });
// Para o lance valer, a pessoa paga a entrada mais um sinal: uma parte (auction.sinal, ex. 0.5) do lance, ou do teto
// quando há lance automático. "recebido" é o total em reais que já caiu na conta; o lance vale até onde ele cobre.
const share = (auction) => auction.sinal || 0;
const due = (auction, bid) => auction.entrada + Math.ceil(share(auction) * Math.max(bid.valor, bid.teto || 0));
const covered = (auction, bid) => (share(auction) ? Math.floor(((bid.recebido || 0) - auction.entrada) / share(auction)) : (bid.recebido || 0) >= auction.entrada ? Infinity : 0);
const rank = (bids, auction) => classificar(bids.map((bid) => ({ id: bid.id, em: bid.em, valor: Math.min(bid.valor, covered(auction, bid)), teto: Math.min(bid.teto || bid.valor, covered(auction, bid)) })), rules(auction));
const closed = (auction, now) => !!auction.encerraEm && now >= Date.parse(auction.encerraEm);
const owed = (auction, bid) => Math.max(0, due(auction, bid) - (bid.recebido || 0));
const pix = (auction, bid) => pixCopiaECola({ ...auction.pix, valor: owed(auction, bid), txid: bid.codigo });

// quem entra como anônimo aparece sem nome, foto nem Instagram
const shown = (bid) => (bid.anonimo ? { anonimo: true, nome: null, instagram: null, foto: false } : { anonimo: false, nome: bid.nome, instagram: bid.instagram || null, foto: !!bid.foto });

// O que qualquer visitante vê: preço, quanto precisa para entrar e a fila, com o nome, a foto e o Instagram que cada
// pessoa escolheu mostrar. Só entram na fila os lances cobertos pelo que já foi pago (e conferido por quem confirma).
// As fotos só vão quando a tela pede (fotos=1), para as atualizações ficarem leves.
function view(bids, auction, now, token, photos) {
  const board = rank(bids, auction), mine = token && bids.find((bid) => bid.token === token);
  const place = mine && board.lances.find((line) => line.id === mine.id), by = new Map(bids.map((bid) => [bid.id, bid]));
  return {
    fotos: photos ? Object.fromEntries(board.lances.filter((line) => by.get(line.id).foto && !by.get(line.id).anonimo).map((line) => [line.id, by.get(line.id).foto])) : undefined,
    aberto: !closed(auction, now), encerraEm: auction.encerraEm, vagas: rules(auction).vagas, entrada: auction.entrada, lanceMinimo: floor(auction), sinal: share(auction), automatico: !!auction.automatico, passo: auction.passo,
    participantes: board.lances.length, preco: board.preco, paraEntrar: board.paraEntrar,
    fila: board.lances.map((line) => ({ id: line.id, posicao: line.posicao, lance: line.lance, dentro: line.dentro, voce: line.id === mine?.id, ...shown(by.get(line.id)) })),
    voce: mine ? { nome: mine.nome, codigo: mine.codigo, valor: mine.valor, teto: mine.teto, recebido: mine.recebido || 0, falta: owed(auction, mine), pix: owed(auction, mine) ? pix(auction, mine) : null, posicao: place?.posicao ?? null, dentro: place?.dentro ?? false, lance: place?.lance ?? null } : null
  };
}

// As contas do fechamento. O preço é o do último que entrou; do que cada um já pagou (entrada + sinal) sai o acerto:
// quem ficou paga o que falta ou recebe o que sobrou; quem não ficou recebe tudo de volta. Quem desiste perde a entrada
// (o sinal volta) e a vaga passa para o próximo da fila, que paga o próprio lance (menor que o preço).
function report(bids, auction) {
  const board = rank(bids, auction), by = new Map(bids.map((bid) => [bid.id, bid]));
  let seats = rules(auction).vagas;
  return {
    preco: board.preco,
    lances: board.lances.map((line) => {
      const bid = by.get(line.id), quit = !!bid.desistiu, inside = !quit && seats > 0, paid = bid.recebido || 0;
      if (inside) seats--;
      const price = Math.min(board.preco, line.lance);
      return { posicao: line.posicao, situacao: quit ? "desistiu" : inside ? "dentro" : "fora", nome: bid.nome, email: bid.email, pix: bid.pix, codigo: bid.codigo, lance: line.lance, recebido: paid,
        pagar: inside ? Math.max(0, price - paid) : 0, devolver: inside ? Math.max(0, paid - price) : quit ? Math.max(0, paid - auction.entrada) : paid };
    }),
    aguardandoPagamento: bids.filter((bid) => owed(auction, bid) > 0).map((bid) => ({ nome: bid.nome, email: bid.email, codigo: bid.codigo, valor: bid.valor, teto: bid.teto, recebido: bid.recebido || 0, falta: owed(auction, bid) }))
  };
}

async function notify(emails, env) {
  if (!env.RESEND_API_KEY || !emails.length) return;
  const from = env.LEADS_FROM || "Site Nando Voyager <site@nandovoyager.com>";
  await Promise.allSettled(emails.map((to) => fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject: "Você foi ultrapassado no leilão da imersão", text: "Outro lance passou o seu e você saiu das vagas da imersão em Alphaville.\n\nPara voltar, aumente o seu lance: https://nandovoyager.com/eventos\n\nNando Voyager" })
  })));
}

// A lógica, separada do HTTP para poder ser testada.
export async function auctionRequest({ method, query = {}, data = {}, store, env = process.env, now = Date.now(), auction = talks.santos.leilao }) {
  if (!auction?.ativo) return [404, { error: "O leilão não está aberto." }];
  if (!store) return [503, { error: "O leilão ainda não está configurado." }];
  const bids = await store.list();
  const admin = (key) => !!env.LEILAO_ADMIN && key === env.LEILAO_ADMIN;

  if (method === "GET") {
    if (query.relatorio !== undefined) return admin(query.relatorio) ? [200, report(bids, auction)] : [403, { error: "Senha incorreta." }];
    return [200, view(bids, auction, now, query.token, query.fotos !== undefined)];
  }
  if (method !== "POST") return [405, { error: "Método não permitido." }];

  if (data.acao === "confirmar") { // um Pix caiu na conta: sem valor, considera pago tudo o que a pessoa devia
    if (!admin(data.senha)) return [403, { error: "Senha incorreta." }];
    const bid = bids.find((b) => b.codigo === clean(data.codigo, 12).toUpperCase());
    if (!bid) return [404, { error: "Código não encontrado." }];
    const before = rank(bids, auction);
    const recebido = data.valor == null ? due(auction, bid) : (bid.recebido || 0) + (whole(data.valor) || 0);
    await store.update(bid.id, { recebido });
    bid.recebido = recebido;
    await notify(ultrapassados(before, rank(bids, auction)).map((id) => bids.find((b) => b.id === id).email), env);
    return [200, { ok: true, nome: bid.nome, recebido, falta: owed(auction, bid) }];
  }

  if (data.acao === "desistiu") { // não pagou a diferença: perde a entrada e a vaga passa para o próximo
    if (!admin(data.senha)) return [403, { error: "Senha incorreta." }];
    const bid = bids.find((b) => b.codigo === clean(data.codigo, 12).toUpperCase());
    if (!bid) return [404, { error: "Código não encontrado." }];
    await store.update(bid.id, { desistiu: true });
    return [200, { ok: true, nome: bid.nome }];
  }

  if (closed(auction, now)) return [409, { error: "O leilão já encerrou." }];
  if (!auction.automatico) data.teto = null;
  const valor = whole(data.valor), teto = data.teto == null || data.teto === "" ? null : whole(data.teto);
  if (!valor || valor < floor(auction)) return [400, { error: `O lance mínimo é de R$ ${floor(auction)}.` }];
  if (data.teto != null && data.teto !== "" && (!teto || teto < valor)) return [400, { error: "O teto do lance automático precisa ser maior que o lance." }];

  if (data.acao === "entrar") {
    if (data.website) return [200, { ok: true }]; // honeypot
    const bid = { id: randomUUID(), token: randomBytes(24).toString("hex"), codigo: `NV${randomBytes(4).toString("hex").toUpperCase()}`,
      nome: clean(data.nome, 60), anonimo: data.anonimo === true, instagram: data.anonimo === true ? null : handle(data.instagram), foto: data.anonimo === true ? null : photo(data.foto), email: clean(data.email, 254).toLowerCase(), pix: clean(data.pix, 140), valor, teto, recebido: 0, em: new Date(now).toISOString() };
    if (!bid.nome) return [400, { error: "Informe o seu nome." }];
    if (!bid.anonimo && data.instagram && !bid.instagram) return [400, { error: "Confira o seu Instagram: só o nome de usuário, sem espaços." }];
    if (!bid.anonimo && data.foto && !bid.foto) return [400, { error: "Não deu para usar essa foto. Tente outra." }];
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bid.email)) return [400, { error: "Informe um e-mail válido." }];
    if (!bid.pix) return [400, { error: "Informe a sua chave Pix, para a devolução." }];
    if (bids.some((b) => b.email === bid.email)) return [409, { error: "Esse e-mail já está no leilão. Abra o site no aparelho em que você deu o lance." }];
    await store.insert(bid);
    return [200, { token: bid.token, ...view([...bids, bid], auction, now, bid.token) }];
  }

  if (data.acao === "lance") { // aumentar o lance ou mudar o automático; nunca diminuir
    const bid = bids.find((b) => b.token && b.token === data.token);
    if (!bid) return [404, { error: "Lance não encontrado neste aparelho." }];
    if (valor < bid.valor) return [400, { error: "O lance só pode aumentar." }];
    const before = rank(bids, auction);
    await store.update(bid.id, { valor, teto });
    Object.assign(bid, { valor, teto });
    await notify(ultrapassados(before, rank(bids, auction)).map((id) => bids.find((b) => b.id === id).email), env);
    return [200, view(bids, auction, now, bid.token)];
  }
  return [400, { error: "Pedido inválido." }];
}

const devStore = process.env.LEILAO_DEV ? memoryStore() : null;

export default leilao;
export async function leilao(req, res) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 60_000) return json(res, 413, { error: "Requisição muito grande." });
  }
  let data = {};
  try { data = body ? JSON.parse(body) : {}; } catch {}
  const query = Object.fromEntries(new URL(req.url, "http://x").searchParams);
  try {
    const [status, result] = await auctionRequest({ method: req.method, query, data, store: supabaseStore() || devStore });
    return json(res, status, result);
  } catch (err) {
    console.error("Leilão:", err.message);
    return json(res, 502, { error: "Não foi possível agora. Tente de novo." });
  }
}
