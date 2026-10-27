/* Configure these values before launch. Links are intentionally easy to replace. */
window.NANDO_SITE_CONFIG = {
  signupEndpoint: "/api/subscribe",
  /* Site da DeepChina. Enquanto estiver vazio, o link da DeepChina AI no rodapé leva ao cartão "Hoje" da história. */
  deepchinaUrl: "",
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
    x: {
      web: "https://x.com/NandoVoyager",
      ios: "twitter://user?screen_name=NandoVoyager",
      android: "com.twitter.android"
    },
    facebook: {
      web: "https://www.facebook.com/nandovoyager1/",
      ios: "fb://facewebmodal/f?href=https://www.facebook.com/nandovoyager1/",
      android: "com.facebook.katana"
    }
  }
};
