export const APP_VERSION = "2.1.2";
export const APP_BASE_PATH = normalizeAppBasePath(process.env.EXPO_PUBLIC_APP_BASE_PATH);
export const CANONICAL_SITE_ORIGIN =
  APP_BASE_PATH === "/" ? "https://app.maroutine.app" : "https://maroutine.app";
export const CANONICAL_APP_ORIGIN = ensureAppBasePath(
  process.env.EXPO_PUBLIC_APP_URL?.trim() || CANONICAL_SITE_ORIGIN,
);
export const LEGACY_APP_HOST = "maroutine.sbcenter.fr";

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export function resolveConfiguredAppOrigin(): string {
  const configuredOrigin = process.env.EXPO_PUBLIC_APP_URL?.trim();
  if (configuredOrigin) {
    return ensureAppBasePath(configuredOrigin);
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return appendAppBasePath(trimTrailingSlash(window.location.origin));
  }

  return CANONICAL_APP_ORIGIN;
}

export function resolveAppUrl(path = "/"): string {
  const origin = resolveConfiguredAppOrigin();
  const nextPath = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${nextPath}`;
}

export function resolveAppAssetUrl(path: string): string {
  const nextPath = path.startsWith("/") ? path : `/${path}`;
  return APP_BASE_PATH === "/" ? nextPath : `${APP_BASE_PATH}${nextPath}`;
}

function ensureAppBasePath(value: string): string {
  const normalized = trimTrailingSlash(value);

  try {
    const url = new URL(normalized);
    if (APP_BASE_PATH === "/") return url.origin;
    if (!url.pathname || url.pathname === "/") url.pathname = APP_BASE_PATH;
    return trimTrailingSlash(url.toString());
  } catch {
    return appendAppBasePath(normalized);
  }
}

function appendAppBasePath(origin: string): string {
  if (APP_BASE_PATH === "/") return trimTrailingSlash(origin);
  return origin.endsWith(APP_BASE_PATH) ? origin : `${origin}${APP_BASE_PATH}`;
}

function normalizeAppBasePath(value: string | undefined): string {
  const normalized = value?.trim() || "/app";
  if (normalized === "/") return "/";
  return `/${normalized.replace(/^\/+|\/+$/g, "")}`;
}
