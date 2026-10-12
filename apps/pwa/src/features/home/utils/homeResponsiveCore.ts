export const HOME_SMARTPHONE_MAX_WIDTH = 500;

const PHONE_USER_AGENT_REGEX = /Android.+Mobile|iPhone|iPod|Windows Phone|Mobile/i;
const TABLET_USER_AGENT_REGEX = /iPad|Tablet|Nexus 7|Nexus 10|Silk/i;

export type HomeViewportPlatform = "web" | "native";

export interface HomeViewportContext {
  platform: HomeViewportPlatform;
  userAgent?: string | null;
}

/**
 * Règle de résolution compacte Home.
 * - largeur <= seuil smartphone
 * - web: activation seulement sur user-agent mobile phone (jamais tablet/desktop)
 * - native: activation dès que la largeur est sous le seuil
 */
export function isSmartphoneHomeViewportByContext(
  width: number,
  context: HomeViewportContext,
): boolean {
  if (!Number.isFinite(width) || width <= 0) return false;
  if (Math.round(width) > HOME_SMARTPHONE_MAX_WIDTH) return false;
  if (context.platform !== "web") return true;

  const ua = context.userAgent ?? "";
  if (TABLET_USER_AGENT_REGEX.test(ua)) return false;
  return PHONE_USER_AGENT_REGEX.test(ua);
}
