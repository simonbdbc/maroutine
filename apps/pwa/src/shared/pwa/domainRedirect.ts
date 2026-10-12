import { CANONICAL_APP_ORIGIN, LEGACY_APP_HOST } from "./appConfig";

export function buildCanonicalUrlForCurrentLocation(
  currentHref: string,
  canonicalOrigin = CANONICAL_APP_ORIGIN,
): string | null {
  try {
    const currentUrl = new URL(currentHref);
    const canonicalUrl = new URL(canonicalOrigin);
    if (currentUrl.hostname === canonicalUrl.hostname) return null;

    const normalizedOrigin = canonicalOrigin.replace(/\/+$/, "");
    return `${normalizedOrigin}${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`;
  } catch {
    return null;
  }
}

export function buildCanonicalAppUrl(
  currentHref: string,
  canonicalOrigin = CANONICAL_APP_ORIGIN,
  legacyHost = LEGACY_APP_HOST,
): string | null {
  try {
    const currentUrl = new URL(currentHref);
    if (currentUrl.hostname !== legacyHost) return null;

    const normalizedOrigin = canonicalOrigin.replace(/\/+$/, "");
    return `${normalizedOrigin}${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`;
  } catch {
    return null;
  }
}
