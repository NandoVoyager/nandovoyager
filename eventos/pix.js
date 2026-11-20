// Pix "copia e cola" (BR Code estático): o texto que vira QR code, com o valor já preenchido.
// O dinheiro cai direto na conta da chave; não há intermediário nem aviso automático de pagamento.

const field = (id, value) => `${id}${String(value.length).padStart(2, "0")}${value}`;

// sem acentos e só o que o padrão aceita
const plain = (text, max) =>
  String(text).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9 $%*+\-./:]/g, "").trim().slice(0, max);

export function crc16(text) {
  let crc = 0xffff;
  for (const char of text) {
    crc ^= char.charCodeAt(0) << 8;
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

// chave: CNPJ (só dígitos), e-mail, telefone (+55...) ou chave aleatória
// valor em reais; txid: até 25 letras e números, aparece no extrato de quem recebe
export function pixCopiaECola({ chave, nome, cidade, valor, txid = "***" }) {
  if (!chave || !nome || !cidade) throw new Error("Pix: faltam chave, nome ou cidade.");
  if (!(valor > 0)) throw new Error("Pix: valor inválido.");
  const id = txid === "***" ? txid : String(txid).replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "***";
  const payload = [
    field("00", "01"),
    field("26", field("00", "BR.GOV.BCB.PIX") + field("01", String(chave).trim())),
    field("52", "0000"),
    field("53", "986"),
    field("54", Number(valor).toFixed(2)),
    field("58", "BR"),
    field("59", plain(nome, 25)),
    field("60", plain(cidade, 15)),
    field("62", field("05", id)),
    "6304"
  ].join("");
  return payload + crc16(payload);
}
