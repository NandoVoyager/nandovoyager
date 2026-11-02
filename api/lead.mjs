// Requests from the intro pop-ups (intro/index.html): "Meus serviços" and "Imersão Canton Fair", short lead filters
// e-mailed to the team through Resend, like api/apply.mjs. LEADS_TO: who gets them (default contato@nandovoyager.com).
// LEADS_FROM: the sender, on a domain verified in Resend.
const allowedOrigins = (process.env.SITE_ORIGIN || "").split(",").map((o) => o.trim()).filter(Boolean);

export const options = {
  // Services: short names for the DeepChina AI services, plus mentoring and "Outro". Every service starts with a paid
  // one-hour import consultation (R$ 1.000, credited if they hire), which the visitor has to agree to.
  needs: ["Consultoria de importação", "Achar fábrica", "Auditoria de fábrica", "Frete", "Mentoria", "Outro"],
  budget: ["Até R$ 10 mil", "R$ 10 a 50 mil", "R$ 50 a 200 mil", "Mais de R$ 200 mil"],
  // Canton Fair trip: which phase; it ends with a free call, so no prices.
  phases: ["Fase 1", "Fase 2", "Fase 3", "Ainda não sei"]
};

export default lead;

const json = (res, status, body) => res.writeHead(status, { "Content-Type": "application/json" }).end(JSON.stringify(body));
const clean = (value, max) => String(value ?? "").trim().slice(0, max);
const picked = (value, allowed) => (Array.isArray(value) ? value.map((v) => clean(v, 60)).filter((v) => allowed.includes(v)) : []);

// The answers as the visitor gave them, or the first problem found (in Portuguese, shown in the pop-up).
export function validate(data) {
  const request = {
    form: data.form === "canton" ? "canton" : "servicos",
    name: clean(data.name, 120),
    phone: clean(data.phone, 40),
    email: clean(data.email, 254)
  };
  if (request.form === "canton") {
    request.phases = picked(data.phases, options.phases);
    if (!request.phases.length) return { error: "Escolha a fase da feira." };
  } else {
    request.needs = picked(data.needs, options.needs);
    request.product = clean(data.product, 300);
    request.budget = clean(data.budget, 40);
    if (!request.needs.length) return { error: "Escolha pelo menos uma opção." };
    if (!request.product) return { error: "Conte o que você quer importar." };
    if (!options.budget.includes(request.budget)) return { error: "Escolha quanto pretende investir." };
  }
  if (!request.name) return { error: "Informe o seu nome." };
  if (request.phone.replace(/\D/g, "").length < 8) return { error: "Informe um WhatsApp com DDD." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.email)) return { error: "Informe um e-mail válido." };
  if (request.form === "servicos" && data.call !== true) return { error: "Todo serviço começa com a consultoria de 1 hora. Marque para continuar." };
  return { request };
}

export function requestText(request) {
  const contact = [`Nome: ${request.name}`, `WhatsApp: ${request.phone}`, `E-mail: ${request.email}`];
  if (request.form === "canton") {
    return [`Fase: ${request.phases.join(", ")}`, ...contact, "Quer marcar a call (gratuita)"].join("\n");
  }
  return [
    `Precisa de: ${request.needs.join(", ")}`,
    `Quer importar: ${request.product}`,
    `Investimento: ${request.budget}`,
    ...contact,
    "Topou a consultoria de importação de 1 hora (R$ 1.000, creditados se fechar)"
  ].join("\n");
}

const subject = (request) =>
  request.form === "canton"
    ? `Imersão Canton Fair: ${request.name} (${request.phases.join(", ")})`
    : `Serviços: ${request.name} (${request.budget})`;

export async function lead(req, res) {
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

  const { request, error } = validate(data);
  if (error) return json(res, 400, { error });

  const { RESEND_API_KEY } = process.env;
  const to = process.env.LEADS_TO || "contato@nandovoyager.com";
  const from = process.env.LEADS_FROM || "Site Nando Voyager <site@nandovoyager.com>";
  if (!RESEND_API_KEY) return json(res, 503, { error: "O envio ainda não está ativado." });

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], reply_to: request.email, subject: subject(request), text: requestText(request) })
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
