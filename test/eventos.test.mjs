import test from "node:test";
import assert from "node:assert/strict";
import { crc16, pixCopiaECola } from "../eventos/pix.js";
import { classificar, ultrapassados } from "../eventos/leilao.js";

const regras = { vagas: 3, minimo: 100, passo: 10 };
const lance = (id, valor, em, teto) => ({ id, valor, em, teto });

test("crc16 do padrão (CCITT-FALSE)", () => assert.equal(crc16("123456789"), "29B1"));

test("pix: campos, valor e verificação", () => {
  const code = pixCopiaECola({ chave: "12345678000199", nome: "Empresa Ação Ltda", cidade: "São Paulo", valor: 250, txid: "santos-01" });
  assert.match(code, /^000201/);
  assert.ok(code.includes("0014BR.GOV.BCB.PIX011412345678000199"));
  assert.ok(code.includes("5406250.00"));
  assert.ok(code.includes("5917Empresa Acao Ltda"));
  assert.ok(code.includes("6009Sao Paulo"));
  assert.ok(code.includes("0508santos01"));
  assert.equal(code.slice(-4), crc16(code.slice(0, -4)));
});

test("sobrando vaga, todos pagam o menor lance", () => {
  const r = classificar([lance("a", 1000, 1), lance("b", 100, 2)], regras);
  assert.equal(r.preco, 100);
  assert.equal(r.paraEntrar, 100);
  assert.ok(r.lances.every(l => l.dentro));
});

test("todos pagam o lance do último que entrou", () => {
  const r = classificar([lance("a", 1000, 1), lance("b", 400, 2), lance("c", 250, 3), lance("d", 200, 4)], regras);
  assert.equal(r.preco, 250);
  assert.equal(r.paraEntrar, 260);
  assert.deepEqual(r.lances.map(l => [l.id, l.dentro]), [["a", true], ["b", true], ["c", true], ["d", false]]);
});

test("empate: quem deu o lance antes fica", () => {
  const r = classificar([lance("a", 300, 1), lance("b", 300, 2), lance("c", 300, 3), lance("d", 300, 4)], regras);
  assert.deepEqual(r.lances.filter(l => !l.dentro).map(l => l.id), ["d"]);
});

test("lance abaixo do mínimo não conta", () => {
  assert.equal(classificar([lance("a", 50, 1)], regras).lances.length, 0);
});

test("lance automático sobe só o necessário, até o teto", () => {
  const antes = classificar([lance("a", 500, 1), lance("b", 300, 2), lance("c", 100, 3, 400)], regras);
  assert.equal(antes.preco, 100);
  const depois = classificar([lance("a", 500, 1), lance("b", 300, 2), lance("c", 100, 3, 400), lance("d", 200, 4)], regras);
  // c saiu com 100, o automático cobre d (200) com 210; d fica de fora
  assert.deepEqual(depois.lances.map(l => [l.id, l.lance, l.dentro]), [["a", 500, true], ["b", 300, true], ["c", 210, true], ["d", 200, false]]);
  assert.equal(depois.preco, 210);
  assert.deepEqual(ultrapassados(antes, depois), []);
});

test("dois automáticos disputam até um teto acabar", () => {
  const r = classificar([lance("a", 900, 1), lance("b", 800, 2), lance("c", 100, 3, 400), lance("d", 100, 4, 300)], regras);
  const c = r.lances.find(l => l.id === "c"), d = r.lances.find(l => l.id === "d");
  assert.equal(d.dentro, false);
  assert.equal(d.lance, 300);
  // no empate em 300, c fica: deu o lance antes
  assert.equal(c.lance, 300);
  assert.equal(c.dentro, true);
  assert.equal(r.preco, 300);
});

test("avisa quem foi ultrapassado", () => {
  const base = [lance("a", 500, 1), lance("b", 300, 2), lance("c", 100, 3)];
  const antes = classificar(base, regras), depois = classificar([...base, lance("d", 200, 4)], regras);
  assert.deepEqual(ultrapassados(antes, depois), ["c"]);
});
