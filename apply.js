// Consultancy application (consultoria/index.html), sent to /api/apply. If sending fails, the same answers can go by e-mail.
(() => {
  const form = document.querySelector("#apply-form");
  const message = document.querySelector("#apply-message");
  const done = document.querySelector("#apply-done");
  const button = form.querySelector("button[type=submit]");

  const setMessage = (text, state) => {
    message.replaceChildren(text);
    if (state) message.dataset.state = state;
    else delete message.dataset.state;
  };

  const answers = () => {
    const data = new FormData(form);
    const get = (name) => (data.get(name) || "").toString().trim();
    return {
      name: get("name"),
      store: get("store"),
      phone: get("phone"),
      email: get("email"),
      setup: get("setup"),
      revenue: get("revenue"),
      improve: data.getAll("improve").map(String),
      website: get("website")
    };
  };

  const mailtoLink = (lead) => {
    const body = [
      `Nome: ${lead.name}`,
      `Loja: ${lead.store}`,
      `WhatsApp: ${lead.phone}`,
      `E-mail: ${lead.email}`,
      `Modelo: ${lead.setup}`,
      `Faturamento por mês: ${lead.revenue}`,
      `Quero melhorar: ${lead.improve.join(", ")}`
    ].join("\n");
    const link = document.createElement("a");
    link.href = `mailto:contato@nandovoyager.com?subject=${encodeURIComponent("Consultoria de importação")}&body=${encodeURIComponent(body)}`;
    link.textContent = "Enviar as respostas por e-mail";
    return link;
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const lead = answers();
    if (!lead.improve.length) {
      setMessage("Escolha pelo menos um ponto para melhorar.", "error");
      form.querySelector('input[name="improve"]').focus();
      return;
    }
    button.disabled = true;
    setMessage("Enviando…");
    try {
      const response = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Não foi possível enviar agora.");
      form.hidden = true;
      done.hidden = false;
      done.focus({ preventScroll: true });
      done.scrollIntoView({ behavior: "smooth", block: "center" });
      window.nandoAnalytics?.track?.("consultoria_application", { revenue: lead.revenue });
    } catch (error) {
      // A field the server rejected is the visitor's to fix; anything else, the e-mail route still works.
      const fixable = /^Informe|^Escolha/.test(error.message);
      setMessage(error.message, "error");
      if (!fixable) message.append(" ", mailtoLink(lead), ".");
    } finally {
      button.disabled = false;
    }
  });
})();
