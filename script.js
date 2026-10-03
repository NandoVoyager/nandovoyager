(() => {
  const form = document.querySelector("#signup-form");
  const message = document.querySelector("#form-message");
  const button = form.querySelector("button[type=submit]");
  const config = window.NANDO_SITE_CONFIG || {};
  const endpoint = config.signupEndpoint;
  document.querySelector("#year").textContent = new Date().getFullYear();

  // Keep everything on one screen: scale the whole block to the window (desktop may grow a little, never scroll).
  const stage = document.querySelector(".stage");
  const fitToScreen = () => {
    const maxScale = window.innerWidth > 760 ? 1.3 : 1;
    const scale = Math.min(maxScale, window.innerWidth / stage.offsetWidth, window.innerHeight / stage.offsetHeight);
    stage.style.transform = `translate(-50%, -50%)${scale !== 1 ? ` scale(${scale})` : ""}`;
  };
  fitToScreen();
  window.addEventListener("resize", fitToScreen);
  document.fonts?.ready.then(fitToScreen);
  document.querySelector(".photo")?.addEventListener("load", fitToScreen);

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
      setMessage("Obrigado por se inscrever!", "success");
      fitToScreen();
      track("newsletter_signup", { source: "landing_page" });
    } catch (error) {
      setMessage(error.message || "Algo deu errado. Tente novamente em instantes.", "error");
    } finally {
      button.disabled = false;
    }
  });
})();
