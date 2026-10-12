import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { trackPwaEvent } from "../services/pwaAnalytics";
import type { PwaNetworkStatus } from "../types";

export function useConnectionStatus() {
  const [networkStatus, setNetworkStatus] = useState<PwaNetworkStatus>(() =>
    Platform.OS === "web" && typeof navigator !== "undefined" && !navigator.onLine
      ? "offline"
      : "connected"
  );
  const networkStatusRef = useRef(networkStatus);

  const refreshConnectionStatus = useCallback(async (): Promise<PwaNetworkStatus> => {
    const nextStatus: PwaNetworkStatus =
      Platform.OS === "web" && typeof navigator !== "undefined" && !navigator.onLine
        ? "offline"
        : "connected";
    if (networkStatusRef.current !== nextStatus) {
      networkStatusRef.current = nextStatus;
      trackPwaEvent("pwa_connection_changed", { status: nextStatus });
    }
    setNetworkStatus(nextStatus);
    return nextStatus;
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const sync = () => void refreshConnectionStatus();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, [refreshConnectionStatus]);

  return { networkStatus, refreshConnectionStatus };
}
