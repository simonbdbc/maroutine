import { APP_VERSION, resolveAppAssetUrl } from "./appConfig";

export type AppVersionPayload = {
  build?: string;
  version: string;
};

export type VersionCheckResult = {
  error?: string;
  remote?: AppVersionPayload;
  updateAvailable: boolean;
};

export function parseAppVersionPayload(value: unknown): AppVersionPayload | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  if (typeof record.version !== "string" || record.version.trim().length === 0) {
    return null;
  }

  return {
    version: record.version.trim(),
    ...(typeof record.build === "string" && record.build.trim().length > 0
      ? { build: record.build.trim() }
      : {}),
  };
}

export function hasAppVersionChanged(localVersion: string, remoteVersion: string): boolean {
  return remoteVersion.trim() !== localVersion.trim();
}

export function buildVersionCheckUrl(now = Date.now()): string {
  return `${resolveAppAssetUrl("/version.json")}?ts=${encodeURIComponent(String(now))}`;
}

export async function fetchAppVersion(
  fetcher: typeof fetch,
  now = Date.now(),
): Promise<VersionCheckResult> {
  try {
    const response = await fetcher(buildVersionCheckUrl(now), { cache: "no-store" });
    if (!response.ok) {
      return {
        error: `version.json indisponible (${response.status})`,
        updateAvailable: false,
      };
    }

    const payload = parseAppVersionPayload(await response.json());
    if (!payload) {
      return {
        error: "version.json invalide",
        updateAvailable: false,
      };
    }

    return {
      remote: payload,
      updateAvailable: hasAppVersionChanged(APP_VERSION, payload.version),
    };
  } catch {
    return {
      error: "Impossible de vérifier la version",
      updateAvailable: false,
    };
  }
}
