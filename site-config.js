/* Configure these values before launch. Links are intentionally easy to replace. */
window.NANDO_SITE_CONFIG = {
  signupEndpoint: "/api/subscribe",
  /* Número do WhatsApp que recebe os formulários (Serviços e Canton Fair), só dígitos com o código do país, ex. "5511912345678".
     Enquanto estiver vazio, os formulários enviam as respostas por e-mail. */
  whatsapp: "15615966097",
  /* Site da DeepChina. Enquanto estiver vazio, os links da DeepChina AI levam ao cadastro de e-mail da página. */
  deepchinaUrl: "https://deepchina.ai",
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
    },
    tiktok: {
      web: "https://www.tiktok.com/@nandovoyager",
      android: "com.zhiliaoapp.musically"
    },
    x: {
      web: "https://x.com/NandoVoyager",
      ios: "twitter://user?screen_name=NandoVoyager",
      android: "com.twitter.android"
    },
    facebook: {
      web: "https://www.facebook.com/nandovoyager1/",
      ios: "fb://facewebmodal/f?href=https://www.facebook.com/nandovoyager1/",
      android: "com.facebook.katana"
    },
    /* Perfil do LinkedIn. Enquanto estiver vazio, os ícones do LinkedIn ficam escondidos. */
    linkedin: {
      web: "",
      android: "com.linkedin.android"
    }
  }
};
