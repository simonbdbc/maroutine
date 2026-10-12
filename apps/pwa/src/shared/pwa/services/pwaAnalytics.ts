import { Platform } from "react-native";

export type PwaEventName =
  | "pwa_app_start"
  | "pwa_app_background"
  | "pwa_app_foreground"
  | "pwa_cache_clear_started"
  | "pwa_cache_clear_completed"
  | "pwa_cache_clear_failed"
  | "pwa_connection_changed"
  | "pwa_controller_changed"
  | "pwa_diagnostics_refreshed"
  | "pwa_display_mode_changed"
  | "pwa_install_dismissed"
  | "pwa_install_prompt_accepted"
  | "pwa_install_prompt_available"
  | "pwa_install_prompt_error"
  | "pwa_install_prompt_started"
  | "pwa_install_reset"
  | "pwa_installed"
  | "pwa_runtime_reset"
  | "pwa_service_worker_error"
  | "pwa_service_worker_registered"
  | "pwa_service_worker_waiting"
  | "pwa_update_available"
  | "pwa_update_apply_failed"
  | "pwa_update_apply_started"
  | "pwa_update_dismissed";

type PwaEventPayload = Record<string, boolean | number | string | null | undefined>;

export function trackPwaEvent(name: PwaEventName, payload: PwaEventPayload = {}): void {
  if (Platform.OS !== "web" || typeof window === "undefined") return;

  const event = {
    name,
    payload: Object.fromEntries(Object.entries(payload).filter((entry) => entry[1] !== undefined)),
    timestamp: new Date().toISOString(),
  };
  const endpoint = process.env.EXPO_PUBLIC_PWA_ANALYTICS_ENDPOINT?.trim();

  if (__DEV__) console.info("[pwa]", event);
  if (!endpoint) return;

  try {
    const body = JSON.stringify(event);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, new Blob([body], { type: "application/json" }));
      return;
    }
    void fetch(endpoint, {
      body,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      method: "POST",
    });
  } catch (error) {
    if (__DEV__) console.warn("[pwa] analytics delivery failed", error);
  }
}
