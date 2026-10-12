import { Platform } from "react-native";
import {
  APP_VERSION,
  CANONICAL_APP_ORIGIN,
  resolveAppAssetUrl,
} from "../appConfig";
import type { PwaBuildInfo, PwaServiceWorkerStatus } from "../types";

type ServiceWorkerMessage = {
  type: string;
  buildInfo?: PwaBuildInfo;
  caches?: string[];
};

export const pwaCachePrefix = "maroutine";
export const lastUpdateErrorKey = "maroutine.pwa-last-update-error";
export const serviceWorkerUrl = resolveAppAssetUrl("/service-worker.js");
export const fallbackBuildInfo: PwaBuildInfo = {
  appName: "Maroutine",
  appVersion: APP_VERSION,
  buildId: "native",
  commitSha: "native",
  releaseChannel: "native",
  buildDate: "native",
  origin: CANONICAL_APP_ORIGIN,
  supportContact: "contact@maroutine.app",
};

const DEVELOPMENT_SW_RESET_KEY = "maroutine.pwa-development-service-worker-reset";
const BUILD_INFO_URL = resolveAppAssetUrl("/pwa-build.json");

export async function fetchBuildInfo(): Promise<PwaBuildInfo> {
  const response = await fetch(`${BUILD_INFO_URL}?t=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Version distante indisponible.");
  return (await response.json()) as PwaBuildInfo;
}

export async function requestActiveWorkerBuildInfo(): Promise<PwaBuildInfo | null> {
  const response = await postServiceWorkerMessage({ type: "GET_VERSION" });
  return response?.buildInfo ?? null;
}

export async function requestServiceWorkerDiagnostics(): Promise<ServiceWorkerMessage | null> {
  return postServiceWorkerMessage({ type: "GET_DIAGNOSTICS" });
}

export function requestWorkerSkipWaiting(worker: ServiceWorker): Promise<boolean> {
  if (typeof MessageChannel === "undefined") {
    worker.postMessage({ type: "SKIP_WAITING" });
    return Promise.resolve(false);
  }

  return new Promise<boolean>((resolve) => {
    const channel = new MessageChannel();
    const timer = window.setTimeout(() => resolve(false), 1_500);
    channel.port1.onmessage = (event: MessageEvent<ServiceWorkerMessage>) => {
      window.clearTimeout(timer);
      resolve(event.data?.type === "SKIP_WAITING_ACK");
    };
    worker.postMessage({ type: "SKIP_WAITING" }, [channel.port2]);
  });
}

export async function waitForWaitingWorker(
  registration: ServiceWorkerRegistration,
  timeoutMs = 5_000
): Promise<ServiceWorker | null> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (registration.waiting) return registration.waiting;
    await new Promise<void>((resolve) => window.setTimeout(resolve, 100));
  }
  return registration.waiting;
}

export function getInitialServiceWorkerStatus(): PwaServiceWorkerStatus {
  return isServiceWorkerDisabledForRuntime() ? "disabled" : "registering";
}

export function isServiceWorkerDisabledForRuntime(): boolean {
  return __DEV__;
}

export async function unregisterDevelopmentServiceWorkers(): Promise<void> {
  if (Platform.OS !== "web" || typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  const hadController = Boolean(navigator.serviceWorker.controller);
  await unregisterAppServiceWorkers();
  await deletePwaCaches();

  if (!hadController) {
    window.sessionStorage.removeItem(DEVELOPMENT_SW_RESET_KEY);
    return;
  }
  if (window.sessionStorage.getItem(DEVELOPMENT_SW_RESET_KEY)) return;
  window.sessionStorage.setItem(DEVELOPMENT_SW_RESET_KEY, "1");
  window.location.reload();
}

export async function unregisterAppServiceWorkers(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    registrations
      .filter((registration) => registration.scope.startsWith(window.location.origin))
      .map((registration) => registration.unregister())
  );
}

export async function deletePwaCaches(): Promise<string[]> {
  if (typeof window === "undefined" || !("caches" in window)) return [];
  const cacheNames = await caches.keys();
  const pwaCacheNames = cacheNames.filter((name) => name.startsWith(`${pwaCachePrefix}-`));
  await Promise.all(pwaCacheNames.map((name) => caches.delete(name)));
  return pwaCacheNames;
}

function postServiceWorkerMessage(message: { type: string }): Promise<ServiceWorkerMessage | null> {
  if (
    Platform.OS !== "web" ||
    typeof window === "undefined" ||
    !navigator.serviceWorker?.controller ||
    typeof MessageChannel === "undefined"
  ) {
    return Promise.resolve(null);
  }

  return new Promise<ServiceWorkerMessage | null>((resolve) => {
    const channel = new MessageChannel();
    const timer = window.setTimeout(() => resolve(null), 1_500);
    channel.port1.onmessage = (event: MessageEvent<ServiceWorkerMessage>) => {
      window.clearTimeout(timer);
      resolve(event.data);
    };
    navigator.serviceWorker.controller?.postMessage(message, [channel.port2]);
  });
}
