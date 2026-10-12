export type InstallEnvironment = {
  brave?: unknown;
  displayModeStandalone?: boolean | undefined;
  maxTouchPoints?: number | undefined;
  platform?: string | undefined;
  standalone?: boolean | undefined;
  userAgent?: string | undefined;
  vendor?: string | undefined;
};

export type InstallPlatformKind =
  | "ios-safari"
  | "ios-limited"
  | "android"
  | "desktop-chromium"
  | "desktop-limited";

export function isPwaInstalled(env: InstallEnvironment): boolean {
  return env.displayModeStandalone === true || env.standalone === true;
}

export function isNativeInstallPromptAvailable(
  promptEvent: unknown,
  installed: boolean,
): boolean {
  return promptEvent !== null && typeof promptEvent !== "undefined" && !installed;
}

export function isIOSBrowser(env: InstallEnvironment): boolean {
  const ua = env.userAgent ?? "";
  const isTouchMac = env.platform === "MacIntel" && (env.maxTouchPoints ?? 0) > 1;
  return /iPad|iPhone|iPod/i.test(ua) || isTouchMac;
}

export function isLikelySafari(env: InstallEnvironment): boolean {
  const ua = env.userAgent ?? "";
  const vendor = env.vendor ?? "";
  const hasSafariTokens = /Safari/i.test(ua) && /Version\/[\d.]+/i.test(ua);
  const hasOtherBrowserTokens =
    /(CriOS|FxiOS|EdgiOS|OPiOS|OPT|DuckDuckGo|YaBrowser|SamsungBrowser|Brave|GSA|Focus)/i.test(ua);
  const hasBraveApi = typeof env.brave !== "undefined";
  const hasAppleVendor = /Apple/i.test(vendor);

  return hasSafariTokens && hasAppleVendor && !hasOtherBrowserTokens && !hasBraveApi;
}

export function resolveInstallPlatform(env: InstallEnvironment): InstallPlatformKind {
  const ua = env.userAgent ?? "";

  if (isIOSBrowser(env)) {
    return isLikelySafari(env) ? "ios-safari" : "ios-limited";
  }

  if (/Android/i.test(ua)) {
    return "android";
  }

  if (/(Chrome|Chromium|Edg)\//i.test(ua) && !/OPR\//i.test(ua)) {
    return "desktop-chromium";
  }

  return "desktop-limited";
}
