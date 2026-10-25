/* Configure these values before launch. Links are intentionally easy to replace. */
window.NANDO_SITE_CONFIG = {
  signupEndpoint: "/api/subscribe",
  /* WhatsApp do botão "Marcas e parcerias": só dígitos, com DDI e DDD (ex.: 5511999999999). */
  /* Site da DeepChina. Enquanto estiver vazio, os botões da DeepChina levam ao cadastro de e-mail desta página. */
  deepchinaUrl: "",
  whatsapp: "15615966097",
  whatsappMessage: "Olá, Nando! Vim pelo site e quero falar sobre uma parceria.",
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
