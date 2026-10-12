import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import type { PwaBuildInfo, PwaServiceWorkerStatus, PwaUpdateStatus } from "../types";
import { hasRemoteBuildChanged, shouldReloadAfterControllerChange } from "../services/pwaLifecycle";
import { trackPwaEvent } from "../services/pwaAnalytics";
import {
  fallbackBuildInfo,
  fetchBuildInfo,
  getInitialServiceWorkerStatus,
  isServiceWorkerDisabledForRuntime,
  lastUpdateErrorKey,
  requestActiveWorkerBuildInfo,
  requestWorkerSkipWaiting,
  serviceWorkerUrl,
  unregisterDevelopmentServiceWorkers,
  waitForWaitingWorker,
} from "../services/serviceWorkerClient";

const WAITING_WORKER_TIMEOUT_MS = 15_000;

export function useServiceWorkerLifecycle() {
  const [buildInfo, setBuildInfo] = useState<PwaBuildInfo | null>(
    Platform.OS === "web" ? null : fallbackBuildInfo
  );
  const [remoteBuildInfo, setRemoteBuildInfo] = useState<PwaBuildInfo | null>(null);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [lastUpdateError, setLastUpdateError] = useState<string | null>(null);
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState<PwaServiceWorkerStatus>(
    Platform.OS === "web" ? getInitialServiceWorkerStatus() : "unsupported"
  );
  const [updateStatus, setUpdateStatus] = useState<PwaUpdateStatus>("idle");
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const waitingWorkerRef = useRef<ServiceWorker | null>(null);
  const updateReloadStartedRef = useRef(false);
  const trackedRemoteBuildIdRef = useRef<string | null>(null);

  const refreshBuildInfo = useCallback(async () => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const [currentInfo, nextRemoteInfo] = await Promise.all([
      optionalPwaValue(requestActiveWorkerBuildInfo),
      optionalPwaValue(fetchBuildInfo),
    ]);
    const nextCurrentInfo = currentInfo ?? nextRemoteInfo;
    if (nextCurrentInfo) setBuildInfo(nextCurrentInfo);
    if (nextRemoteInfo) setRemoteBuildInfo(nextRemoteInfo);

    if (
      nextCurrentInfo &&
      nextRemoteInfo &&
      hasRemoteBuildChanged(nextCurrentInfo.buildId, nextRemoteInfo.buildId)
    ) {
      updateRegistrationInBackground(registrationRef.current);
      setIsUpdateAvailable(true);
      setUpdateStatus((status) =>
        ["applied", "reloadRequired", "updating"].includes(status) ? status : "available"
      );
      if (trackedRemoteBuildIdRef.current !== nextRemoteInfo.buildId) {
        trackedRemoteBuildIdRef.current = nextRemoteInfo.buildId;
        trackPwaEvent("pwa_update_available", {
          currentBuildId: nextCurrentInfo.buildId,
          remoteBuildId: nextRemoteInfo.buildId,
        });
      }
      return;
    }

    if (nextCurrentInfo && nextRemoteInfo) {
      setIsUpdateAvailable(false);
      trackedRemoteBuildIdRef.current = null;
      setUpdateStatus((status) => (status === "available" ? "idle" : status));
    }
  }, []);

  const checkForUpdate = useCallback(async () => {
    updateRegistrationInBackground(registrationRef.current);
    await refreshBuildInfo();
  }, [refreshBuildInfo]);

  const dismissUpdate = useCallback(() => {
    setIsUpdateAvailable(false);
    setUpdateStatus("idle");
    trackPwaEvent("pwa_update_dismissed");
  }, []);

  const applyUpdate = useCallback(async () => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    try {
      setUpdateStatus("updating");
      setLastUpdateError(null);
      window.localStorage.removeItem(lastUpdateErrorKey);
      trackPwaEvent("pwa_update_apply_started");
      const registration = !("serviceWorker" in navigator)
        ? null
        : (registrationRef.current ?? (await navigator.serviceWorker.getRegistration()) ?? null);
      if (registration) registrationRef.current = registration;
      await registration?.update();
      const waitingWorker =
        waitingWorkerRef.current ??
        registration?.waiting ??
        (registration ? await waitForWaitingWorker(registration, WAITING_WORKER_TIMEOUT_MS) : null);

      if (waitingWorker) {
        updateReloadStartedRef.current = true;
        const acknowledged = await requestWorkerSkipWaiting(waitingWorker);
        if (!acknowledged) {
          updateReloadStartedRef.current = false;
          throw new Error("Le service worker n'a pas confirme la mise a jour.");
        }
        return;
      }

      setLastUpdateError(
        "La mise a jour est encore en telechargement. Reessaie dans quelques secondes."
      );
      setUpdateStatus("available");
    } catch (error) {
      const message = errorMessage(error);
      window.localStorage.setItem(lastUpdateErrorKey, message);
      setLastUpdateError(message);
      setUpdateStatus("error");
      trackPwaEvent("pwa_update_apply_failed", { message });
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    let cancelled = false;
    const controllerChangeHandler = () => {
      trackPwaEvent("pwa_controller_changed");
      if (shouldReloadAfterControllerChange(updateReloadStartedRef.current)) {
        waitingWorkerRef.current = null;
        setServiceWorkerStatus("active");
        setUpdateStatus("applied");
        window.location.reload();
        return;
      }
      void refreshBuildInfo();
    };

    if (!("serviceWorker" in navigator)) {
      setServiceWorkerStatus("unsupported");
      void refreshBuildInfo();
      return;
    }
    if (isServiceWorkerDisabledForRuntime()) {
      setServiceWorkerStatus("disabled");
      void unregisterDevelopmentServiceWorkers().finally(() => void refreshBuildInfo());
      return;
    }

    setServiceWorkerStatus("registering");
    void navigator.serviceWorker
      .register(serviceWorkerUrl, { updateViaCache: "none" })
      .then((registration) => {
        if (cancelled) return;
        registrationRef.current = registration;
        trackPwaEvent("pwa_service_worker_registered", { scope: registration.scope });

        if (registration.waiting) {
          waitingWorkerRef.current = registration.waiting;
          setServiceWorkerStatus("waiting");
          setIsUpdateAvailable(true);
          setUpdateStatus("available");
          trackPwaEvent("pwa_service_worker_waiting");
        } else if (registration.installing) {
          setServiceWorkerStatus("installing");
        } else {
          setServiceWorkerStatus("active");
        }

        registration.addEventListener("updatefound", () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;
          setServiceWorkerStatus("installing");
          installingWorker.addEventListener("statechange", () => {
            if (installingWorker.state !== "installed") return;
            if (navigator.serviceWorker.controller) {
              waitingWorkerRef.current = installingWorker;
              setServiceWorkerStatus("waiting");
              setIsUpdateAvailable(true);
              setUpdateStatus("available");
              trackPwaEvent("pwa_service_worker_waiting");
            } else {
              setServiceWorkerStatus("active");
            }
          });
        });

        void checkForUpdate();
      })
      .catch((error: unknown) => {
        const message = errorMessage(error);
        window.localStorage.setItem(lastUpdateErrorKey, message);
        setLastUpdateError(message);
        setServiceWorkerStatus("error");
        trackPwaEvent("pwa_service_worker_error", { message });
        void refreshBuildInfo();
      });

    navigator.serviceWorker.addEventListener("controllerchange", controllerChangeHandler);
    const checkForLatestDeployment = () => {
      void checkForUpdate();
    };
    const visibilityHandler = () => {
      if (document.visibilityState !== "visible") return;
      checkForLatestDeployment();
    };
    document.addEventListener("visibilitychange", visibilityHandler);
    window.addEventListener("focus", checkForLatestDeployment);
    window.addEventListener("online", checkForLatestDeployment);
    window.addEventListener("pageshow", checkForLatestDeployment);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", visibilityHandler);
      window.removeEventListener("focus", checkForLatestDeployment);
      window.removeEventListener("online", checkForLatestDeployment);
      window.removeEventListener("pageshow", checkForLatestDeployment);
      navigator.serviceWorker.removeEventListener("controllerchange", controllerChangeHandler);
    };
  }, [checkForUpdate, refreshBuildInfo]);

  useEffect(() => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      setLastUpdateError(window.localStorage.getItem(lastUpdateErrorKey));
    }
  }, []);

  return {
    applyUpdate,
    buildInfo,
    checkForUpdate,
    dismissUpdate,
    isUpdateAvailable,
    lastUpdateError,
    remoteBuildInfo,
    serviceWorkerStatus,
    updateStatus,
  };
}

async function optionalPwaValue<T>(operation: () => Promise<T>): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    if (__DEV__) console.warn("[pwa] optional operation failed", error);
    return null;
  }
}

function updateRegistrationInBackground(registration: ServiceWorkerRegistration | null): void {
  if (!registration) return;
  void registration.update().catch((error: unknown) => {
    if (__DEV__) console.warn("[pwa] background update failed", error);
  });
}

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message.trim()
    ? error.message
    : "Action PWA indisponible.";
}
