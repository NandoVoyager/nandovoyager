// Consultancy application (consultoria/index.html): checks the answers and e-mails them to the team through Resend.
// LEADS_TO: who gets them (default contato@nandovoyager.com). LEADS_FROM: the sender, on a domain verified in Resend.
const allowedOrigins = (process.env.SITE_ORIGIN || "").split(",").map((o) => o.trim()).filter(Boolean);

export const options = {
  setup: ["Dropshipping", "Dropshipping com marca própria", "Marca própria (compro estoque)", "Ainda estou começando"],
  revenue: ["Até R$ 50 mil", "R$ 50 mil a R$ 250 mil", "R$ 250 mil a R$ 1 milhão", "Mais de R$ 1 milhão"],
  improve: ["Preço", "Comunicação", "Qualidade do produto", "Transparência", "Condições de pagamento", "Desenvolvimento de produto"]
};

export default apply;

const json = (res, status, body) => res.writeHead(status, { "Content-Type": "application/json" }).end(JSON.stringify(body));
const clean = (value, max) => String(value ?? "").trim().slice(0, max);

// The answers as the visitor gave them, or the first problem found (in Portuguese, shown under the form).
export function validate(data) {
  const lead = {
    name: clean(data.name, 120),
    store: clean(data.store, 300),
    phone: clean(data.phone, 40),
    email: clean(data.email, 254),
    setup: clean(data.setup, 80),
    revenue: clean(data.revenue, 80),
    improve: Array.isArray(data.improve) ? data.improve.map((v) => clean(v, 80)) : []
  };
  if (!lead.name) return { error: "Informe o seu nome." };
  if (!lead.store) return { error: "Informe o link da sua loja." };
  if (lead.phone.replace(/\D/g, "").length < 8) return { error: "Informe um telefone com DDD." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) return { error: "Informe um e-mail válido." };
  if (!options.setup.includes(lead.setup)) return { error: "Escolha o seu modelo de negócio." };
  if (!options.revenue.includes(lead.revenue)) return { error: "Escolha o seu faturamento por mês." };
  lead.improve = lead.improve.filter((v) => options.improve.includes(v));
  if (!lead.improve.length) return { error: "Escolha pelo menos um ponto para melhorar." };
  return { lead };
}

export function leadText(lead) {
  return [
    `Nome: ${lead.name}`,
    `Loja: ${lead.store}`,
    `Telefone: ${lead.phone}`,
    `E-mail: ${lead.email}`,
    `Modelo: ${lead.setup}`,
    `Faturamento por mês: ${lead.revenue}`,
    `Quer melhorar: ${lead.improve.join(", ")}`
  ].join("\n");
}

export async function apply(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "Método não permitido." });
  const origin = req.headers.origin;
  if (allowedOrigins.length && origin && !allowedOrigins.includes(origin)) return json(res, 403, { error: "Origem não autorizada." });

  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 8192) return json(res, 413, { error: "Requisição muito grande." });
  }
  let data = {};
  try { data = JSON.parse(body); } catch {}
  // Honeypot: only bots fill the hidden "website" field. Answer as if it worked and send nothing.
  if (data.website) return json(res, 200, { ok: true });

  const { lead, error } = validate(data);
  if (error) return json(res, 400, { error });

  const { RESEND_API_KEY } = process.env;
  const to = process.env.LEADS_TO || "contato@nandovoyager.com";
  const from = process.env.LEADS_FROM || "Site Nando Voyager <site@nandovoyager.com>";
  if (!RESEND_API_KEY) return json(res, 503, { error: "O envio ainda não está ativado." });

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: lead.email,
        subject: `Consultoria: ${lead.name} (${lead.revenue})`,
        text: leadText(lead)
      })
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      console.error(`Resend error ${response.status}:`, result?.message || result);
      return json(res, 502, { error: "Não foi possível enviar agora." });
    }
    return json(res, 200, { ok: true });
  } catch (err) {
    console.error("Resend request failed:", err.message);
    return json(res, 502, { error: "Serviço indisponível. Tente novamente." });
  }
}
