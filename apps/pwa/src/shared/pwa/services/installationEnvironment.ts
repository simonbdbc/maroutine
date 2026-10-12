import { Platform } from "react-native";
import type { PwaDisplayMode, PwaInstallStatus } from "../types";

const INSTALL_DISMISSED_AT_KEY = "maroutine.pwa-install-dismissed-at";
const INSTALL_CONFIRMED_KEY = "maroutine.pwa-installed:v1";
const INSTALL_DISMISSAL_TTL_MS = 14 * 24 * 60 * 60 * 1_000;

export function readPwaDisplayMode(): PwaDisplayMode {
  if (Platform.OS !== "web" || typeof window === "undefined") return "unknown";

  const standaloneNavigator = navigator as Navigator & { standalone?: boolean };
  if (window.matchMedia("(display-mode: standalone)").matches || standaloneNavigator.standalone) {
    return "standalone";
  }
  if (window.matchMedia("(display-mode: fullscreen)").matches) return "fullscreen";
  if (window.matchMedia("(display-mode: minimal-ui)").matches) return "minimal-ui";
  return "browser";
}

export function readInstallFallbackStatus(): PwaInstallStatus {
  if (Platform.OS !== "web" || typeof window === "undefined") return "unsupported";
  if (readPwaDisplayMode() !== "browser" || hasInstallMarker()) return "installed";
  if (hasRecentInstallDismissal()) return "dismissed";
  return isIosLike() || supportsManualInstallation() ? "manual" : "unsupported";
}

export function hasInstallMarker(): boolean {
  return (
    typeof window !== "undefined" && window.localStorage.getItem(INSTALL_CONFIRMED_KEY) === "1"
  );
}

export function writeInstallMarker(): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(INSTALL_CONFIRMED_KEY, "1");
  }
}

export function clearInstallMarker(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(INSTALL_CONFIRMED_KEY);
  }
}

export function hasRecentInstallDismissal(): boolean {
  if (typeof window === "undefined") return false;
  const dismissedAt = Number.parseInt(
    window.localStorage.getItem(INSTALL_DISMISSED_AT_KEY) ?? "",
    10
  );
  return Number.isFinite(dismissedAt) && Date.now() - dismissedAt < INSTALL_DISMISSAL_TTL_MS;
}

export function writeInstallDismissal(): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(INSTALL_DISMISSED_AT_KEY, String(Date.now()));
  }
}

export function clearInstallDismissal(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(INSTALL_DISMISSED_AT_KEY);
  }
}

export function supportsManualInstallation(): boolean {
  if (typeof document === "undefined") return false;
  return Boolean(document.querySelector('link[rel="manifest"]'));
}

export function isIosLike(): boolean {
  if (typeof navigator === "undefined") return false;
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = navigator.platform.toLowerCase();
  return (
    /iphone|ipad|ipod/.test(userAgent) || (platform === "macintel" && navigator.maxTouchPoints > 1)
  );
}
