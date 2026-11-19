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

const rules = (auction) => ({ vagas: talks.santos.vagasTotal, minimo: auction.entrada, passo: auction.passo });
const rank = (bids, auction) => classificar(bids.filter((bid) => bid.pago).map(({ id, valor, teto, em }) => ({ id, valor, teto, em })), rules(auction));
const closed = (auction, now) => !!auction.encerraEm && now >= Date.parse(auction.encerraEm);
const pix = (auction, bid) => pixCopiaECola({ ...auction.pix, valor: auction.entrada, txid: bid.codigo });

// O que qualquer visitante vê: preço, quanto precisa para entrar e a fila (só posição e valor, sem nomes).
function view(bids, auction, now, token) {
  const board = rank(bids, auction), mine = token && bids.find((bid) => bid.token === token);
  const place = mine && board.lances.find((line) => line.id === mine.id);
  return {
    aberto: !closed(auction, now), encerraEm: auction.encerraEm, vagas: rules(auction).vagas, entrada: auction.entrada, passo: auction.passo,
    participantes: board.lances.length, preco: board.preco, paraEntrar: board.paraEntrar,
    fila: board.lances.map((line) => ({ posicao: line.posicao, lance: line.lance, dentro: line.dentro, voce: line.id === mine?.id })),
    voce: mine ? { nome: mine.nome, pago: mine.pago, codigo: mine.codigo, valor: mine.valor, teto: mine.teto, pix: mine.pago ? null : pix(auction, mine), posicao: place?.posicao ?? null, dentro: place?.dentro ?? false, lance: place?.lance ?? mine.valor } : null
  };
}

// As contas do fechamento: quem paga a diferença e quem recebe a entrada de volta.
function report(bids, auction) {
  const board = rank(bids, auction), by = new Map(bids.map((bid) => [bid.id, bid]));
  return {
    preco: board.preco,
    lances: board.lances.map((line) => {
      const bid = by.get(line.id);
      return { posicao: line.posicao, dentro: line.dentro, nome: bid.nome, email: bid.email, pix: bid.pix, codigo: bid.codigo, lance: line.lance,
        pagar: line.dentro ? Math.max(0, board.preco - auction.entrada) : 0, devolver: line.dentro ? 0 : auction.entrada };
    }),
    aguardandoPagamento: bids.filter((bid) => !bid.pago).map(({ nome, email, codigo, valor, em }) => ({ nome, email, codigo, valor, em }))
  };
}

async function notify(emails, env) {
  if (!env.RESEND_API_KEY || !emails.length) return;
  const from = env.LEADS_FROM || "Site Nando Voyager <site@nandovoyager.com>";
  await Promise.allSettled(emails.map((to) => fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject: "Você foi ultrapassado no leilão do workshop", text: "Outro lance passou o seu e você saiu das vagas do workshop em Santos.\n\nPara voltar, aumente o seu lance: https://nandovoyager.com/eventos\n\nNando Voyager" })
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
    return [200, view(bids, auction, now, query.token)];
  }
  if (method !== "POST") return [405, { error: "Método não permitido." }];

  if (data.acao === "confirmar") { // o pagamento da entrada caiu na conta: o lance passa a valer
    if (!admin(data.senha)) return [403, { error: "Senha incorreta." }];
    const bid = bids.find((b) => b.codigo === clean(data.codigo, 12).toUpperCase());
    if (!bid) return [404, { error: "Código não encontrado." }];
    const before = rank(bids, auction);
    await store.update(bid.id, { pago: true });
    bid.pago = true;
    await notify(ultrapassados(before, rank(bids, auction)).map((id) => bids.find((b) => b.id === id).email), env);
    return [200, { ok: true, nome: bid.nome, valor: bid.valor }];
  }

  if (closed(auction, now)) return [409, { error: "O leilão já encerrou." }];
  const valor = whole(data.valor), teto = data.teto == null || data.teto === "" ? null : whole(data.teto);
  if (!valor || valor < auction.entrada) return [400, { error: `O lance mínimo é de R$ ${auction.entrada}.` }];
  if (data.teto != null && data.teto !== "" && (!teto || teto < valor)) return [400, { error: "O teto do lance automático precisa ser maior que o lance." }];

  if (data.acao === "entrar") {
    if (data.website) return [200, { ok: true }]; // honeypot
    const bid = { id: randomUUID(), token: randomBytes(24).toString("hex"), codigo: `NV${randomBytes(4).toString("hex").toUpperCase()}`,
      nome: clean(data.nome, 120), email: clean(data.email, 254).toLowerCase(), pix: clean(data.pix, 140), valor, teto, pago: false, em: new Date(now).toISOString() };
    if (!bid.nome) return [400, { error: "Informe o seu nome." }];
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
    if (body.length > 4096) return json(res, 413, { error: "Requisição muito grande." });
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
