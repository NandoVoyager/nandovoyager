(() => {
  const config = window.NANDO_SITE_CONFIG || {};
  document.querySelector("#year").textContent = new Date().getFullYear();

  const track = (name, properties = {}) => {
    // Plug a privacy-friendly analytics provider in here when one is selected.
    window.nandoAnalytics?.track?.(name, properties);
  };

  // Header: navy glass with white text over the hero, the light bar below it (and while the menu is open).
  const header = document.querySelector(".site-header");
  const hero = document.querySelector(".hero");
  const onScroll = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
    const overHero = window.scrollY < hero.offsetHeight - header.offsetHeight;
    header.classList.toggle("on-dark", overHero && !document.documentElement.classList.contains("menu-open"));
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Phone and tablet menu: closes on a link, a tap on the dimmed page, Esc, or when the screen gets wide enough for the nav.
  const menuButton = document.querySelector(".menu-btn");
  const menu = document.querySelector("#menu");
  const setMenu = (open) => {
    menu.hidden = !open;
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    document.documentElement.classList.toggle("menu-open", open);
    // While open, the page behind can't be focused or read out; Tab stays in the header and the menu.
    document.querySelectorAll("main, footer").forEach((el) => (el.inert = open));
    onScroll();
  };
  menuButton.addEventListener("click", () => setMenu(menu.hidden));
  menu.addEventListener("click", (event) => {
    if (event.target === menu || event.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !menu.hidden) {
      setMenu(false);
      menuButton.focus();
    }
  });
  window.matchMedia("(min-width: 1024px)").addEventListener("change", (event) => event.matches && setMenu(false));

  // The wordmark goes back to the top of the page (closing the menu) and leaves no "#" in the address.
  document.querySelector("[data-top]").addEventListener("click", (event) => {
    event.preventDefault();
    setMenu(false);
    window.scrollTo({ top: 0 }); // follows the CSS scroll-behavior: smooth, or instant with reduced motion
    history.replaceState(null, "", location.pathname + location.search);
  });

  // Behind-the-scenes clip: muted loop that plays only while on screen; with reduced motion it waits for a tap.
  const video = document.querySelector(".behind-video");
  if (video) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.controls = true;
    } else if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      }, { threshold: 0.35 }).observe(video);
    }
  }

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

  document.querySelectorAll("[data-deepchina]").forEach((link) => {
    if (config.deepchinaUrl) {
      link.href = config.deepchinaUrl;
      link.target = "_blank";
      link.rel = "noreferrer";
    }
    link.addEventListener("click", () => track("deepchina_click"));
  });

  document.querySelectorAll('a[href^="mailto:"]').forEach((link) => link.addEventListener("click", () => track("email_click")));

  // "Copiar e-mail": clipboard when allowed, otherwise select the address so it can be copied by hand.
  document.querySelectorAll("[data-copy]").forEach((button) => {
    const label = button.textContent;
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copy);
        button.textContent = "Copiado!";
        button.dataset.copied = "";
        setTimeout(() => { button.textContent = label; delete button.dataset.copied; }, 2000);
      } catch {
        const link = button.parentElement.querySelector(".mail-big");
        window.getSelection().selectAllChildren(link);
      }
      track("email_copy");
    });
  });

  // YouTube: latest videos from /api/youtube in a horizontal track (swipe on touch, drag or arrows on desktop).
  const ytTrack = document.querySelector(".yt-track");
  if (ytTrack) {
    const channelUrl = config.socialLinks?.youtube?.web || "https://www.youtube.com/@NandoVoyager";
    const esc = (text) => String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
    const compact = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });
    const ago = (iso) => {
      const days = Math.max(0, Math.floor((Date.now() - new Date(iso)) / 86400000));
      if (days < 1) return "hoje";
      if (days < 7) return days === 1 ? "há 1 dia" : `há ${days} dias`;
      if (days < 30) return Math.floor(days / 7) === 1 ? "há 1 semana" : `há ${Math.floor(days / 7)} semanas`;
      if (days < 365) return Math.floor(days / 30) === 1 ? "há 1 mês" : `há ${Math.floor(days / 30)} meses`;
      return Math.floor(days / 365) === 1 ? "há 1 ano" : `há ${Math.floor(days / 365)} anos`;
    };
    const play = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg>';
    const card = (v) => `
      <li class="yt-card">
        <a href="https://www.youtube.com/watch?v=${esc(v.id)}" target="_blank" rel="noreferrer" data-video="${esc(v.id)}">
          <span class="yt-thumb">
            <img src="https://i.ytimg.com/vi/${esc(v.id)}/maxresdefault.jpg" data-fallback="https://i.ytimg.com/vi/${esc(v.id)}/hqdefault.jpg" width="1280" height="720" alt="" loading="lazy" draggable="false" />
            <span class="yt-play">${play}</span>
          </span>
          <span class="yt-title">${esc(v.title)}</span>
          <span class="yt-meta">${esc([v.views ? `${compact.format(v.views)} visualizações` : v.viewsText, v.published ? ago(v.published) : v.publishedText].filter(Boolean).join(" · ") || "YouTube")}</span>
        </a>
      </li>`;

    const showFallback = () => {
      ytTrack.innerHTML = `<li class="yt-card yt-empty"><a href="${esc(channelUrl)}" target="_blank" rel="noreferrer"><span class="yt-thumb">${play}</span><span class="yt-title">Assista aos vídeos no canal @NandoVoyager</span><span class="yt-meta">YouTube</span></a></li>`;
      document.querySelectorAll("[data-yt-prev], [data-yt-next]").forEach((b) => (b.hidden = true));
    };

    fetch("/api/youtube")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
      .then(({ videos }) => {
        if (!videos?.length) return showFallback();
        ytTrack.innerHTML = videos.map(card).join("");
        // maxresdefault doesn't exist for every upload; YouTube serves a 120px grey placeholder instead.
        ytTrack.querySelectorAll("img[data-fallback]").forEach((img) => {
          const swap = () => { if (img.dataset.fallback) { img.src = img.dataset.fallback; delete img.dataset.fallback; } };
          img.addEventListener("error", swap);
          img.addEventListener("load", () => { if (img.naturalWidth <= 120) swap(); });
        });
      })
      .catch(showFallback)
      .finally(() => ytTrack.removeAttribute("aria-busy"));

    const step = () => (ytTrack.querySelector(".yt-card")?.offsetWidth || 300) + 20;
    document.querySelector("[data-yt-prev]")?.addEventListener("click", () => ytTrack.scrollBy({ left: -step() * 2, behavior: "smooth" }));
    document.querySelector("[data-yt-next]")?.addEventListener("click", () => ytTrack.scrollBy({ left: step() * 2, behavior: "smooth" }));

    // Mouse drag (touch already scrolls natively). A drag longer than a few pixels cancels the click.
    let drag = null;
    ytTrack.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      drag = { x: e.clientX, left: ytTrack.scrollLeft, moved: false };
    });
    window.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) > 5) { drag.moved = true; ytTrack.classList.add("is-dragging"); }
      if (drag.moved) ytTrack.scrollLeft = drag.left - dx;
    });
    window.addEventListener("pointerup", () => {
      if (!drag) return;
      const moved = drag.moved;
      drag = null;
      ytTrack.classList.remove("is-dragging");
      if (moved) ytTrack.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); }, { capture: true, once: true });
    });
    ytTrack.addEventListener("click", (e) => { const link = e.target.closest("[data-video]"); if (link) track("youtube_video_click", { video: link.dataset.video }); });
  }

  // E-mail signup (Resend, via /api/subscribe).
  const form = document.querySelector("#signup-form");

  // "Deixe seu e-mail ↑" goes back to the top of the page, where the field is, and focuses it.
  document.querySelectorAll("[data-focus-signup]").forEach((link) => {
    link.addEventListener("click", (event) => {
      if (form.hidden) return;
      event.preventDefault();
      form.email.focus({ preventScroll: true });
      window.scrollTo({ top: 0 });
    });
  });
  const message = document.querySelector("#form-message");
  const button = form.querySelector("button[type=submit]");
  const endpoint = config.signupEndpoint;

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
        body: JSON.stringify({ email, website: form.website.value })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Não foi possível concluir sua inscrição.");
      form.hidden = true;
      setMessage("Recebido! Minha equipe vai entrar em contato com você.", "success");
      track("newsletter_signup", { source: "landing_page" });
    } catch (error) {
      setMessage(error.message || "Algo deu errado. Tente novamente em instantes.", "error");
    } finally {
      button.disabled = false;
    }
  });
})();
