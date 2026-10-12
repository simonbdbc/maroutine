export type AppMenuItem = {
  label: string;
  icon: string;
  href: string;
  match: (pathname: string) => boolean;
};

export const CHILD_MENU_ITEMS: AppMenuItem[] = [
  {
    label: "Routines",
    icon: "🏠",
    href: "/(app)/home",
    match: (pathname) => pathname.startsWith("/home"),
  },
];

export const PARENT_MENU_ITEMS: AppMenuItem[] = [
  {
    label: "Enfants",
    icon: "👦",
    href: "/(app)/profiles",
    match: (pathname) => pathname.startsWith("/profiles"),
  },
  {
    label: "Catalogue",
    icon: "📚",
    href: "/(app)/catalog",
    match: (pathname) => pathname.startsWith("/catalog"),
  },
  {
    label: "Historique",
    icon: "🧾",
    href: "/(app)/history",
    match: (pathname) => pathname.startsWith("/history"),
  },
  {
    label: "Compte",
    icon: "👤",
    href: "/(app)/account",
    match: (pathname) => pathname.startsWith("/account") || pathname.startsWith("/settings"),
  },
];

const PWA_MENU_ITEMS: AppMenuItem[] = [
  {
    label: "Gestion PWA",
    icon: "📲",
    href: "/(app)/pwa",
    match: (pathname) => pathname.startsWith("/pwa"),
  },
  {
    label: "Installer l'app",
    icon: "📲",
    href: "/(app)/install",
    match: (pathname) => pathname.startsWith("/install"),
  },
  {
    label: "Desinstaller l'app",
    icon: "📲",
    href: "/(app)/uninstall",
    match: (pathname) => pathname.startsWith("/uninstall"),
  },
];

const ALL_MENU_ITEMS = [...CHILD_MENU_ITEMS, ...PARENT_MENU_ITEMS, ...PWA_MENU_ITEMS];

export function resolveAppMenuTitle(pathname: string): string {
  return ALL_MENU_ITEMS.find((item) => item.match(pathname))?.label ?? "Maroutine";
}
