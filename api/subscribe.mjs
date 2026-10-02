// Comma-separated list, e.g. "https://nandovoyager.com,https://www.nandovoyager.com". Empty = allow any (local dev).
const allowedOrigins = (process.env.SITE_ORIGIN || "").split(",").map((o) => o.trim()).filter(Boolean);

// Default export is the Vercel serverless function; server.mjs imports the named export for local dev.
export default subscribe;

export async function subscribe(req, res) {
  if (req.method !== "POST") {
    res.writeHead(405, { Allow: "POST", "Content-Type": "application/json" }).end(JSON.stringify({ error: "Método não permitido." }));
    return;
  }
  const origin = req.headers.origin;
  if (allowedOrigins.length && origin && !allowedOrigins.includes(origin)) {
    res.writeHead(403, { "Content-Type": "application/json" }).end(JSON.stringify({ error: "Origem não autorizada." }));
    return;
  }
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 4096) {
      res.writeHead(413, { "Content-Type": "application/json" }).end(JSON.stringify({ error: "Requisição muito grande." }));
      return;
    }
  }
  let email;
  try { email = JSON.parse(body).email?.trim(); } catch {}
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.writeHead(400, { "Content-Type": "application/json" }).end(JSON.stringify({ error: "Informe um e-mail válido." }));
    return;
  }
  const { RESEND_API_KEY, RESEND_SEGMENT_ID } = process.env;
  if (!RESEND_API_KEY || !RESEND_SEGMENT_ID) {
    res.writeHead(503, { "Content-Type": "application/json" }).end(JSON.stringify({ error: "As inscrições ainda não estão ativadas." }));
    return;
  }
  try {
    let response = await fetch("https://api.resend.com/contacts", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email, unsubscribed: false, segments: [{ id: RESEND_SEGMENT_ID }] })
    });
    // Already a contact (Resend doesn't document the exact status): add the existing contact to the segment by email.
    if (!response.ok && response.status !== 401 && response.status !== 403) {
      response = await fetch(`https://api.resend.com/contacts/${encodeURIComponent(email)}/segments/${encodeURIComponent(RESEND_SEGMENT_ID)}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}` }
      });
    }
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error(`Resend error ${response.status}:`, result?.message || result);
      res.writeHead(502, { "Content-Type": "application/json" }).end(JSON.stringify({ error: "Não foi possível salvar sua inscrição agora." }));
      return;
    }
    res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({ ok: true }));
  } catch (error) {
    console.error("Resend request failed:", error.message);
    res.writeHead(502, { "Content-Type": "application/json" }).end(JSON.stringify({ error: "Serviço indisponível. Tente novamente." }));
  }
}
