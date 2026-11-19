import test from "node:test";
import assert from "node:assert/strict";
import { auctionRequest, memoryStore } from "../api/leilao.mjs";
import talks from "../eventos/config.js";

talks.santos.vagasTotal = 2;
const auction = { ativo: true, entrada: 100, sinal: 0.5, automatico: true, passo: 10, encerraEm: "2030-01-02T00:00:00-03:00", pix: { chave: "12345678000199", nome: "Empresa Ltda", cidade: "Santos" } };
const env = { LEILAO_ADMIN: "segredo" };
const setup = () => {
  const store = memoryStore();
  const call = (method, data, query, now = Date.parse("2030-01-01T12:00:00-03:00")) => auctionRequest({ method, data, query, store, env, now, auction });
  const enter = async (nome, valor, teto) => {
    const [status, r] = await call("POST", { acao: "entrar", nome, email: `${nome}@x.com`, pix: `${nome}@x.com`, valor, teto });
    assert.equal(status, 200);
    await call("POST", { acao: "confirmar", codigo: r.voce.codigo, senha: "segredo" });
    return r.token;
  };
  return { call, enter };
};

test("fechado na config: 404; sem banco: 503", async () => {
  assert.equal((await auctionRequest({ method: "GET", store: memoryStore(), auction: { ativo: false } }))[0], 404);
  assert.equal((await auctionRequest({ method: "GET", store: null, auction }))[0], 503);
});

test("o lance só vale depois que a entrada é confirmada", async () => {
  const { call } = setup();
  const [, entered] = await call("POST", { acao: "entrar", nome: "Ana", email: "ana@x.com", pix: "ana@x.com", valor: 650 });
  assert.equal(entered.participantes, 0);
  assert.equal(entered.voce.falta, 425); // 100 de entrada + 50% de 650
  assert.match(entered.voce.pix, /5406425\.00/);
  assert.ok(entered.voce.pix.includes(entered.voce.codigo));
  assert.equal((await call("POST", { acao: "confirmar", codigo: entered.voce.codigo, senha: "errada" }))[0], 403);
  await call("POST", { acao: "confirmar", codigo: entered.voce.codigo, senha: "segredo" });
  const [, after] = await call("GET", {}, { token: entered.token });
  assert.equal(after.participantes, 1);
  assert.deepEqual([after.voce.posicao, after.voce.dentro, after.voce.pix, after.voce.falta], [1, true, null, 0]);
});

test("validações de entrada", async () => {
  const { call, enter } = setup();
  assert.equal((await call("POST", { acao: "entrar", nome: "A", email: "a@x.com", pix: "k", valor: 50 }))[0], 400);
  assert.equal((await call("POST", { acao: "entrar", nome: "A", email: "ruim", pix: "k", valor: 100 }))[0], 400);
  assert.equal((await call("POST", { acao: "entrar", nome: "A", email: "a@x.com", pix: "", valor: 100 }))[0], 400);
  assert.equal((await call("POST", { acao: "entrar", nome: "A", email: "a@x.com", pix: "k", valor: 200, teto: 150 }))[0], 400);
  await enter("bia", 100);
  assert.equal((await call("POST", { acao: "entrar", nome: "Bia", email: "BIA@x.com", pix: "k", valor: 100 }))[0], 409);
});

test("fila pública sem nomes; preço é o do último que entrou; relatório com as contas", async () => {
  const { call, enter } = setup();
  const ana = await enter("ana", 650), bia = await enter("bia", 500), caio = await enter("caio", 300);
  const [, pub] = await call("GET", {}, {});
  assert.equal(pub.preco, 500);
  assert.equal(pub.paraEntrar, 510);
  assert.deepEqual(pub.fila, [{ posicao: 1, lance: 650, dentro: true, voce: false }, { posicao: 2, lance: 500, dentro: true, voce: false }, { posicao: 3, lance: 300, dentro: false, voce: false }]);
  assert.equal(pub.voce, null);
  assert.equal(JSON.stringify(pub).includes("ana"), false);

  assert.equal((await call("POST", { acao: "lance", token: caio, valor: 200 }))[0], 400); // não diminui
  // caio sobe para 600: o lance novo só vale depois de pagar o resto do sinal (50% de 300 = 150)
  const [, raised] = await call("POST", { acao: "lance", token: caio, valor: 600 });
  assert.deepEqual([raised.voce.falta, raised.voce.lance, raised.voce.dentro, raised.preco], [150, 300, false, 500]);
  await call("POST", { acao: "confirmar", codigo: raised.voce.codigo, senha: "segredo", valor: 150 });
  const [, paid] = await call("GET", {}, { token: caio });
  assert.deepEqual([paid.voce.posicao, paid.voce.dentro, paid.voce.falta, paid.preco], [2, true, 0, 600]);

  assert.equal((await call("GET", {}, { relatorio: "errada" }))[0], 403);
  const [, rep] = await call("GET", {}, { relatorio: "segredo" });
  assert.equal(rep.preco, 600);
  assert.deepEqual(rep.lances.map((l) => [l.nome, l.pagar, l.devolver]), [["ana", 175, 0], ["caio", 200, 0], ["bia", 0, 350]]);
  // caio desiste: perde a entrada; bia entra no lugar pagando o próprio lance
  const [, me] = await call("GET", {}, { token: caio });
  await call("POST", { acao: "desistiu", codigo: me.voce.codigo, senha: "segredo" });
  const [, rep2] = await call("GET", {}, { relatorio: "segredo" });
  assert.equal(rep2.preco, 600);
  assert.deepEqual(rep2.lances.map((l) => [l.nome, l.situacao, l.pagar, l.devolver]), [["ana", "dentro", 175, 0], ["caio", "desistiu", 0, 300], ["bia", "dentro", 150, 0]]);
  assert.ok(ana && bia);
});

test("lance automático segura a vaga; depois do prazo não aceita lance", async () => {
  const { call, enter } = setup();
  await enter("ana", 500);
  const bia = await enter("bia", 100, 400);
  await enter("caio", 300);
  const [, mine] = await call("GET", {}, { token: bia });
  assert.deepEqual([mine.voce.lance, mine.voce.dentro, mine.preco], [310, true, 310]);
  const late = Date.parse("2030-01-03T00:00:00-03:00");
  assert.equal((await call("POST", { acao: "lance", token: bia, valor: 900 }, {}, late))[0], 409);
  assert.equal((await call("GET", {}, {}, late))[1].aberto, false);
});

test("lance alto com preço baixo: o que sobrou do sinal volta", async () => {
  const { call, enter } = setup();
  await enter("ana", 2000); // pagou 100 + 1000
  await enter("bia", 200);
  const [, rep] = await call("GET", {}, { relatorio: "segredo" });
  assert.equal(rep.preco, 200);
  assert.deepEqual(rep.lances.map((l) => [l.nome, l.recebido, l.pagar, l.devolver]), [["ana", 1100, 0, 900], ["bia", 200, 0, 0]]);
});

test("sem sinal (sinal: 0), só a entrada é cobrada", async () => {
  const store = memoryStore(), simple = { ...auction, sinal: 0 };
  const [, r] = await auctionRequest({ method: "POST", data: { acao: "entrar", nome: "Ana", email: "a@x.com", pix: "k", valor: 650 }, store, env, now: Date.parse("2030-01-01T12:00:00-03:00"), auction: simple });
  assert.equal(r.voce.falta, 100);
});
