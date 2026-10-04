(() => {
  const form = document.querySelector("#signup-form");
  const message = document.querySelector("#form-message");
  const button = form.querySelector("button[type=submit]");
  const config = window.NANDO_SITE_CONFIG || {};
  const endpoint = config.signupEndpoint;
  document.querySelector("#year").textContent = new Date().getFullYear();

  // Keep everything on one screen, never scroll. Desktop: scale the fixed canvas to the window (may grow a little).
  // Phones: the CSS centres the block in normal flow; only very short screens shrink it, with zoom so layout shrinks too.
  const stage = document.querySelector(".stage");
  const phone = window.matchMedia("(max-width: 760px)");
  const fitToScreen = () => {
    if (phone.matches) {
      stage.style.transform = "";
      stage.style.zoom = "";
      const zoom = Math.min(1, document.body.clientHeight / stage.offsetHeight);
      if (zoom < 1) stage.style.zoom = zoom;
      return;
    }
    stage.style.zoom = "";
    const scale = Math.min(1.3, window.innerWidth / stage.offsetWidth, window.innerHeight / stage.offsetHeight);
    stage.style.transform = `translate(-50%, -50%)${scale !== 1 ? ` scale(${scale})` : ""}`;
  };
  fitToScreen();
  window.addEventListener("resize", fitToScreen);
  document.fonts?.ready.then(fitToScreen);
  document.querySelector(".photo")?.addEventListener("load", fitToScreen);
  // After the iOS keyboard closes, Safari can leave the page scrolled; put it back.
  form.email.addEventListener("blur", () => setTimeout(() => window.scrollTo(0, 0), 100));

  const track = (name, properties = {}) => {
    // Plug a privacy-friendly analytics provider in here when one is selected.
    window.nandoAnalytics?.track?.(name, properties);
  };

  const ua = navigator.userAgent;
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  // In-app browsers keep https links inside their webview instead of handing off to the app.
  const isInAppBrowser = /Instagram|FBAN|FBAV|FB_IAB|TikTok|musical_ly|Bytedance|Twitter|LinkedInApp|Line\//i.test(ua);

  const androidIntent = (web, pkg) => {
    const url = new URL(web);
    return `intent://${url.host}${url.pathname}${url.search}#Intent;scheme=https;package=${pkg};S.browser_fallback_url=${encodeURIComponent(web)};end`;
  };

  // Try the app scheme; if the page is still visible afterwards, the app didn't open.
  const openIOSApp = (scheme, web) => {
    const fallback = setTimeout(() => {
      if (!document.hidden) window.location.href = web;
    }, 1200);
    document.addEventListener("visibilitychange", () => clearTimeout(fallback), { once: true });
    window.location.href = scheme;
  };

  document.querySelectorAll("[data-social]").forEach((link) => {
    const network = link.dataset.social;
    const social = config.socialLinks?.[network];
    if (social?.web) link.href = social.web;
    link.addEventListener("click", (event) => {
      track("social_click", { network });
      if (!social?.web) return;
      if (isAndroid && social.android) {
        event.preventDefault();
        window.location.href = androidIntent(social.web, social.android);
      } else if (isIOS && isInAppBrowser && social.ios) {
        event.preventDefault();
        openIOSApp(social.ios, social.web);
      }
    });
  });

  document.querySelectorAll("[data-offer]").forEach((link) => {
    const url = config.offers?.[link.dataset.offer];
    if (url) link.href = url;
    link.addEventListener("click", () => track("cta_click", { offer: link.dataset.offer }));
  });

  // Imersão Canton Fair: package list and per-package details in one dialog, reachable at #canton-fair[/<package>].
  const canton = window.NANDO_CANTON_FAIR;
  const sheet = document.querySelector("#canton-fair");
  if (canton && sheet) {
    const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
    const icons = {
      close: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /></svg>',
      back: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>',
      chevron: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>',
      whatsapp: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M3.6 20.4l1.2-4.1a8.4 8.4 0 1 1 3.1 3z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" /><path d="M9.3 8.3c.2-.3.4-.3.6-.3h.5c.2 0 .4.1.5.3l.7 1.6c.1.2 0 .4-.1.6l-.5.6c.6 1.1 1.5 2 2.6 2.6l.6-.5c.2-.1.4-.2.6-.1l1.6.7c.2.1.3.3.3.5v.5c0 .2 0 .4-.3.6-.5.3-1.2.5-1.9.4-2.6-.4-4.9-2.7-5.3-5.3-.1-.7.1-1.4.5-2.2z" fill="currentColor" /></svg>'
    };
    let current = null;

    // Some embedded previews refuse URL changes; the dialog must still open.
    const setHash = (hash) => {
      try {
        history.replaceState(null, "", hash || location.pathname + location.search);
      } catch {}
    };
    const whatsappHref = (text) => (config.whatsapp ? `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(text)}` : "#");
    const meta = (p) => `Pacote ${p.number} · ${p.days} dias · ${p.dates}`;

    const head = ({ eyebrow, title, sub, back }) => `
      <header class="sheet-head">
        <div class="sheet-heading">
          ${back ? `<button class="sheet-back" type="button" data-back>${icons.back} Todos os pacotes</button>` : ""}
          <p class="sheet-eyebrow">${eyebrow}</p>
          <h2 class="sheet-title" id="sheet-title">${title}</h2>
          <p class="sheet-sub">${sub}</p>
        </div>
        <button class="sheet-close" type="button" data-close aria-label="Fechar">${icons.close}</button>
      </header>`;

    const foot = (text, label) => `
      <footer class="sheet-foot">
        <a class="wa-btn" href="${whatsappHref(text)}" target="_blank" rel="noreferrer" data-whatsapp>${icons.whatsapp}<span>${label}</span></a>
      </footer>`;

    const listView = () => `${head({ eyebrow: canton.eyebrow, title: canton.title, sub: canton.intro })}
      <div class="sheet-body">
        <ul class="packages">${canton.packages.map((p) => `
          <li>
            <button class="pkg${p.badge ? " pkg-featured" : ""}" type="button" data-package="${p.id}">
              ${p.badge ? `<span class="pkg-badge">${p.badge}</span>` : ""}
              <span class="pkg-info">
                <span class="pkg-meta">${meta(p)}</span>
                <span class="pkg-name">${p.name}</span>
                <span class="pkg-route">${p.route}</span>
              </span>
              <span class="pkg-price">
                <small>A partir de</small>
                <b>${brl.format(Math.min(...p.rooms.map((room) => room.pix)))}</b>
                <small>por pessoa</small>
              </span>
              <span class="pkg-arrow">${icons.chevron}</span>
            </button>
          </li>`).join("")}
        </ul>
      </div>
      ${foot(canton.whatsappMessage, "Tirar dúvidas no WhatsApp")}`;

    const detailView = (p) => `${head({ back: true, eyebrow: meta(p), title: p.name, sub: p.destinations })}
      <div class="sheet-body">
        <h3 class="sec-title">Valores do pacote</h3>
        ${p.rooms.map((room) => `
          <div class="price-row">
            <div class="price-label"><b>${room.label}</b><span>${room.note}</span></div>
            <div class="price-values">
              <span class="price-main">${brl.format(room.pix)}</span>
              <span class="price-note">PIX ou transferência</span>
              <span class="price-card"><b>${brl.format(room.card)}</b> no cartão</span>
            </div>
          </div>`).join("")}

        <h3 class="sec-title">Destinos e feiras</h3>
        <ul class="places">${p.places.map((key) => canton.places[key]).map((place) => `
          <li>
            <div class="place-head"><b>${place.name}</b><span>${place.where}</span></div>
            <p>${place.text}</p>
          </li>`).join("")}
        </ul>

        <h3 class="sec-title">Roteiro</h3>
        <dl class="facts">
          <div><dt>Período</dt><dd>${p.dates} · ${p.days} dias</dd></div>
          <div><dt>Saída</dt><dd>${p.departure}</dd></div>
          <div><dt>Para quem é</dt><dd>${p.forWhom}</dd></div>
        </dl>

        <h3 class="sec-title">O que está incluso</h3>
        <ul class="included">
          ${canton.included.map((item) => `<li>${item}</li>`).join("")}
          ${(canton.notIncluded || []).map((item) => `<li class="excluded">${item}</li>`).join("")}
        </ul>

        <h3 class="sec-title">Formas de pagamento</h3>
        <div class="pay">${canton.payment.map(([title, text]) => `<div><b>${title}</b><span>${text}</span></div>`).join("")}</div>
      </div>
      ${foot(`Olá! Tenho interesse na Imersão Canton Fair, Pacote ${p.number}: ${p.name} (${p.dates}).`, "Falar no WhatsApp")}`;

    const show = (id) => {
      const pkg = canton.packages.find((p) => p.id === id);
      current = pkg ? pkg.id : null;
      sheet.innerHTML = pkg ? detailView(pkg) : listView();
      sheet.dataset.view = pkg ? "detail" : "list";
      sheet.scrollTop = 0;
      setHash(`#canton-fair${pkg ? `/${pkg.id}` : ""}`);
      // Focus the dialog itself, not its first button, so switching views never draws a focus ring on "Todos os pacotes".
      if (!sheet.open) sheet.showModal();
      sheet.focus();
    };

    sheet.addEventListener("click", (event) => {
      // The dialog's children fill it, so a click on the dialog itself is a click on the backdrop.
      if (event.target === sheet || event.target.closest("[data-close]")) return sheet.close();
      const pkg = event.target.closest("[data-package]");
      if (pkg) {
        track("canton_package", { package: pkg.dataset.package });
        return show(pkg.dataset.package);
      }
      if (event.target.closest("[data-back]")) return show(null);
      if (event.target.closest("[data-whatsapp]")) {
        track("whatsapp_click", { package: current || "geral" });
        if (!config.whatsapp) event.preventDefault();
      }
    });

    sheet.addEventListener("close", () => setHash(""));

    document.querySelectorAll("[data-canton]").forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        track("cta_click", { offer: "cantonFair" });
        show(null);
      });
    });

    const openFromHash = () => {
      const match = location.hash.match(/^#canton-fair(?:\/([\w-]+))?$/);
      if (match) show(match[1] || null);
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
  }

  const setMessage = (text, state) => {
    message.textContent = text;
    if (state) message.dataset.state = state;
    else delete message.dataset.state;
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const email = new FormData(form).get("email").toString().trim();
    if (!endpoint) {
      setMessage("Inscrições ainda não estão conectadas.", "error");
      return;
    }
    button.disabled = true;
    setMessage("Enviando…");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Não foi possível concluir sua inscrição.");
      form.hidden = true;
      setMessage("Recebido! Minha equipe vai entrar em contato com você.", "success");
      fitToScreen();
      track("newsletter_signup", { source: "landing_page" });
    } catch (error) {
      setMessage(error.message || "Algo deu errado. Tente novamente em instantes.", "error");
    } finally {
      button.disabled = false;
    }
  });
})();
