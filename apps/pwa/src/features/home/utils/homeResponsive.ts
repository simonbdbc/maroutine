import { Platform } from "react-native";
import {
  isSmartphoneHomeViewportByContext,
} from "./homeResponsiveCore";

export { HOME_SMARTPHONE_MAX_WIDTH } from "./homeResponsiveCore";

/**
 * Active le layout Home compact uniquement sur smartphone.
 * Le seuil est volontairement inférieur aux largeurs tablette.
 */
export function isSmartphoneHomeViewport(width: number): boolean {
  const nav = (globalThis as { navigator?: { userAgent?: string } }).navigator;
  const platform = Platform.OS === "web" ? "web" : "native";
  const userAgent = nav?.userAgent ?? "";

  return isSmartphoneHomeViewportByContext(width, {
    platform,
    userAgent,
  });
}
