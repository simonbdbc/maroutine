import { useEffect, useState } from "react";
import { Platform } from "react-native";
import {
  isPwaInstalled,
  resolveInstallPlatform,
  type InstallEnvironment,
  type InstallPlatformKind,
} from "./installState";

export type PwaInstallStatus = {
  environment: InstallEnvironment;
  installed: boolean;
  platform: InstallPlatformKind;
};

function readPwaInstallEnvironment(): InstallEnvironment {
  if (Platform.OS !== "web" || typeof window === "undefined" || typeof navigator === "undefined") {
    return {};
  }

  const nav = navigator as Navigator & {
    brave?: unknown;
    standalone?: boolean;
    maxTouchPoints?: number;
  };

  return {
    brave: nav.brave,
    displayModeStandalone: window.matchMedia?.("(display-mode: standalone)")?.matches ?? false,
    maxTouchPoints: nav.maxTouchPoints,
    platform: nav.platform,
    standalone: nav.standalone,
    userAgent: nav.userAgent,
    vendor: nav.vendor,
  };
}

export function readPwaInstallStatus(): PwaInstallStatus {
  const environment = readPwaInstallEnvironment();

  return {
    environment,
    installed: isPwaInstalled(environment),
    platform: resolveInstallPlatform(environment),
  };
}

export function usePwaInstallStatus(): PwaInstallStatus {
  const [installStatus, setInstallStatus] = useState<PwaInstallStatus>(() =>
    readPwaInstallStatus()
  );

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;

    function refreshInstallStatus() {
      setInstallStatus(readPwaInstallStatus());
    }

    window.addEventListener("appinstalled", refreshInstallStatus);
    const standaloneQuery = window.matchMedia?.("(display-mode: standalone)");
    standaloneQuery?.addEventListener?.("change", refreshInstallStatus);
    refreshInstallStatus();

    return () => {
      window.removeEventListener("appinstalled", refreshInstallStatus);
      standaloneQuery?.removeEventListener?.("change", refreshInstallStatus);
    };
  }, []);

  return installStatus;
}
