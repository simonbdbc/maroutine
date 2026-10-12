export const siteConfig = {
  name: "Maroutine",
  description:
    "Maroutine aide les enfants à suivre leurs activités, gagner des étoiles et devenir plus autonomes au quotidien.",
  baseUrl: "https://maroutine.app",
  locale: "fr_FR",
  language: "fr",
  app: {
    baseUrl: "https://app.maroutine.app",
    homePath: "https://app.maroutine.app/home",
    loginPath: "https://app.maroutine.app/login",
    signupPath: null,
  },
  navigation: [
    { href: "#benefices", label: "Les bénéfices" },
    { href: "#fonctionnement", label: "Comment ça marche" },
  ],
  cta: {
    primary: "Ouvrir l’application",
    secondary: "Se connecter",
  },
} as const;

export function absoluteSiteUrl(path = "/"): string {
  return new URL(path, siteConfig.baseUrl).toString();
}
