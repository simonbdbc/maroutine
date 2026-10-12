import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import {
  clearInstallDismissal,
  clearInstallMarker,
  readPwaDisplayMode,
} from "../services/installationEnvironment";
import { trackPwaEvent } from "../services/pwaAnalytics";
import { resolveAppAssetUrl } from "../appConfig";
import {
  deletePwaCaches,
  fallbackBuildInfo,
  lastUpdateErrorKey,
  requestServiceWorkerDiagnostics,
  unregisterAppServiceWorkers,
} from "../services/serviceWorkerClient";
import type {
  PwaBuildInfo,
  PwaDiagnostics,
  PwaNetworkStatus,
  PwaServiceWorkerStatus,
} from "../types";

export function usePwaDiagnostics({
  buildInfo,
  lastUpdateError,
  networkStatus,
  refreshConnectionStatus,
  remoteBuildInfo,
  serviceWorkerStatus,
}: {
  buildInfo: PwaBuildInfo | null;
  lastUpdateError: string | null;
  networkStatus: PwaNetworkStatus;
  refreshConnectionStatus: () => Promise<PwaNetworkStatus>;
  remoteBuildInfo: PwaBuildInfo | null;
  serviceWorkerStatus: PwaServiceWorkerStatus;
}) {
  const [diagnostics, setDiagnostics] = useState<PwaDiagnostics | null>(null);

  const refreshDiagnostics = useCallback(async () => {
    if (Platform.OS !== "web" || typeof window === "undefined") {
      setDiagnostics({
        manifestDetected: false,
        displayMode: "unknown",
        serviceWorkerSupported: false,
        serviceWorkerStatus: "unsupported",
        serviceWorkerActive: false,
        caches: [],
        storageUsageBytes: null,
        storageQuotaBytes: null,
        currentBuildInfo: fallbackBuildInfo,
        remoteBuildInfo: null,
        lastUpdateError: null,
        online: true,
        networkStatus: "connected",
      });
      return;
    }

    const [manifestDetected, cacheNames, estimate, workerDiagnostics, nextNetworkStatus] =
      await Promise.all([
        fetch(resolveAppAssetUrl("/manifest.webmanifest"), { cache: "no-store" })
          .then((response) => response.ok)
          .catch(() => false),
        "caches" in window ? caches.keys().catch(() => []) : Promise.resolve([]),
        navigator.storage?.estimate?.().catch(() => null) ?? Promise.resolve(null),
        requestServiceWorkerDiagnostics().catch(() => null),
        refreshConnectionStatus(),
      ]);

    const nextDiagnostics: PwaDiagnostics = {
      manifestDetected,
      displayMode: readPwaDisplayMode(),
      serviceWorkerSupported: "serviceWorker" in navigator,
      serviceWorkerStatus,
      serviceWorkerActive: Boolean(navigator.serviceWorker?.controller),
      caches: workerDiagnostics?.caches ?? cacheNames,
      storageUsageBytes: estimate?.usage ?? null,
      storageQuotaBytes: estimate?.quota ?? null,
      currentBuildInfo: workerDiagnostics?.buildInfo ?? buildInfo,
      remoteBuildInfo,
      lastUpdateError: window.localStorage.getItem(lastUpdateErrorKey) ?? lastUpdateError,
      online: navigator.onLine,
      networkStatus: nextNetworkStatus,
    };
    setDiagnostics(nextDiagnostics);
    trackPwaEvent("pwa_diagnostics_refreshed", {
      cacheCount: nextDiagnostics.caches.length,
      serviceWorkerActive: nextDiagnostics.serviceWorkerActive,
      serviceWorkerStatus: nextDiagnostics.serviceWorkerStatus,
      storageUsageBytes: nextDiagnostics.storageUsageBytes,
    });
  }, [buildInfo, lastUpdateError, refreshConnectionStatus, remoteBuildInfo, serviceWorkerStatus]);

  const clearPwaCaches = useCallback(async () => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    try {
      trackPwaEvent("pwa_cache_clear_started");
      const deletedCaches = await deletePwaCaches();
      await refreshDiagnostics();
      trackPwaEvent("pwa_cache_clear_completed", { cacheCount: deletedCaches.length });
    } catch (error) {
      trackPwaEvent("pwa_cache_clear_failed", { message: errorMessage(error) });
      throw error;
    }
  }, [refreshDiagnostics]);

  const resetPwaRuntime = useCallback(async () => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    trackPwaEvent("pwa_runtime_reset");
    clearInstallDismissal();
    clearInstallMarker();
    await Promise.all([unregisterAppServiceWorkers(), deletePwaCaches()]);
    window.location.reload();
  }, []);

  useEffect(() => {
    void refreshDiagnostics();
  }, [refreshDiagnostics, networkStatus]);

  return { clearPwaCaches, diagnostics, refreshDiagnostics, resetPwaRuntime };
}

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message.trim()
    ? error.message
    : "Nettoyage PWA impossible.";
}
