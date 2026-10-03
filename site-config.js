/* Configure these values before launch. Links are intentionally easy to replace. */
window.NANDO_SITE_CONFIG = {
  signupEndpoint: "/api/subscribe",
  /* Links dos CTAs principais. Troque pelos endereços reais antes de publicar. */
  offers: {
    voyagerAi: ""
  },
  /* WhatsApp da equipe para a Imersão Canton Fair: só dígitos, com DDI e DDD (ex.: 5511999999999). */
  whatsapp: "",
  /*
   * web: normal link (desktop, and mobile browsers, which already hand off to the app).
   * ios: app URL scheme, tried only inside in-app browsers (Instagram, TikTok…) on iPhone.
   * android: app package, used to build an intent:// link that falls back to `web`.
   */
  socialLinks: {
    youtube: {
      web: "https://www.youtube.com/@NandoVoyager",
      ios: "youtube://www.youtube.com/@NandoVoyager",
      android: "com.google.android.youtube"
    },
    instagram: {
      web: "https://www.instagram.com/nandovoyager/",
      ios: "instagram://user?username=nandovoyager",
      android: "com.instagram.android"
    }
  }
};
