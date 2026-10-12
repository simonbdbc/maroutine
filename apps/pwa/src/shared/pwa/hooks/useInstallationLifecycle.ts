import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import {
  clearInstallDismissal,
  clearInstallMarker,
  hasInstallMarker,
  hasRecentInstallDismissal,
  isIosLike,
  readInstallFallbackStatus,
  readPwaDisplayMode,
  supportsManualInstallation,
  writeInstallMarker,
  writeInstallDismissal,
} from "../services/installationEnvironment";
import {
  capturedInstallPromptEventName,
  clearCapturedInstallPrompt,
  readCapturedInstallPrompt,
  rememberCapturedInstallPrompt,
  type BeforeInstallPromptEvent,
} from "../services/installPromptBridge";
import { isInstalledDisplayMode, resolveInstallStatus } from "../services/pwaLifecycle";
import { trackPwaEvent } from "../services/pwaAnalytics";
import type { PwaDisplayMode, PwaInstallStatus } from "../types";

const INSTALL_DETECTION_TIMEOUT_MS = 5_000;

export function useInstallationLifecycle() {
  const [displayMode, setDisplayMode] = useState<PwaDisplayMode>(
    Platform.OS === "web" ? "unknown" : "standalone"
  );
  const [installError, setInstallError] = useState<string | null>(null);
  const [installStatus, setInstallStatus] = useState<PwaInstallStatus>(
    Platform.OS === "web" ? "checking" : "installed"
  );
  const [isInstallPromptAvailable, setIsInstallPromptAvailable] = useState(false);
  const deferredInstallPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  const promptInstall = useCallback(async () => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const promptEvent = deferredInstallPromptRef.current ?? readCapturedInstallPrompt();
    if (!promptEvent) {
      setInstallStatus(readInstallFallbackStatus());
      return;
    }

    try {
      setInstallError(null);
      trackPwaEvent("pwa_install_prompt_started");
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      deferredInstallPromptRef.current = null;
      clearCapturedInstallPrompt(promptEvent);
      setIsInstallPromptAvailable(false);

      if (choice.outcome === "accepted") {
        writeInstallMarker();
        setInstallStatus("installed");
        trackPwaEvent("pwa_install_prompt_accepted", { platform: choice.platform });
      } else {
        writeInstallDismissal();
        setInstallStatus("dismissed");
        trackPwaEvent("pwa_install_dismissed", { source: "native_prompt" });
      }
    } catch (error) {
      deferredInstallPromptRef.current = null;
      clearCapturedInstallPrompt(promptEvent);
      setIsInstallPromptAvailable(false);
      const message = errorMessage(error);
      setInstallError(message);
      setInstallStatus("error");
      trackPwaEvent("pwa_install_prompt_error", { message });
    }
  }, []);

  const dismissInstall = useCallback(() => {
    writeInstallDismissal();
    setInstallStatus("dismissed");
    trackPwaEvent("pwa_install_dismissed", { source: "app" });
  }, []);

  const resetInstallDismissal = useCallback(() => {
    clearInstallDismissal();
    setInstallStatus(deferredInstallPromptRef.current ? "available" : readInstallFallbackStatus());
    trackPwaEvent("pwa_install_reset");
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const updateDisplayMode = () => {
      const nextDisplayMode = readPwaDisplayMode();
      if (isInstalledDisplayMode(nextDisplayMode)) {
        writeInstallMarker();
        setIsInstallPromptAvailable(false);
        setInstallStatus("installed");
      }
      setDisplayMode((currentMode) => {
        if (currentMode !== nextDisplayMode) {
          trackPwaEvent("pwa_display_mode_changed", { displayMode: nextDisplayMode });
        }
        return nextDisplayMode;
      });
    };
    updateDisplayMode();

    const queries = [
      window.matchMedia("(display-mode: standalone)"),
      window.matchMedia("(display-mode: fullscreen)"),
      window.matchMedia("(display-mode: minimal-ui)"),
    ];
    queries.forEach((query) => query.addEventListener("change", updateDisplayMode));
    return () => {
      queries.forEach((query) => query.removeEventListener("change", updateDisplayMode));
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;

    const updateStatus = (detectionComplete: boolean) => {
      setInstallStatus(
        resolveInstallStatus({
          detectionComplete,
          displayMode: readPwaDisplayMode(),
          hasDismissal: hasRecentInstallDismissal(),
          hasInstalledMarker: hasInstallMarker(),
          hasPrompt: Boolean(deferredInstallPromptRef.current),
          supportsManualInstall: isIosLike() || supportsManualInstallation(),
        })
      );
    };
    const captureInstallPrompt = (promptEvent: BeforeInstallPromptEvent) => {
      clearInstallMarker();
      const isNewPrompt = deferredInstallPromptRef.current !== promptEvent;
      deferredInstallPromptRef.current = promptEvent;
      rememberCapturedInstallPrompt(promptEvent);
      setIsInstallPromptAvailable(true);
      if (isNewPrompt) trackPwaEvent("pwa_install_prompt_available");
      setInstallStatus(hasRecentInstallDismissal() ? "dismissed" : "available");
    };
    const beforeInstallPromptHandler = (event: Event) => {
      event.preventDefault();
      captureInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const capturedInstallPromptHandler = () => {
      const capturedPrompt = readCapturedInstallPrompt();
      if (capturedPrompt) captureInstallPrompt(capturedPrompt);
    };
    const appInstalledHandler = () => {
      deferredInstallPromptRef.current = null;
      clearCapturedInstallPrompt();
      writeInstallMarker();
      setIsInstallPromptAvailable(false);
      setInstallStatus("installed");
      trackPwaEvent("pwa_installed");
    };

    const timer = window.setTimeout(() => updateStatus(true), INSTALL_DETECTION_TIMEOUT_MS);
    window.addEventListener("beforeinstallprompt", beforeInstallPromptHandler);
    window.addEventListener(capturedInstallPromptEventName, capturedInstallPromptHandler);
    window.addEventListener("appinstalled", appInstalledHandler);
    capturedInstallPromptHandler();
    updateStatus(false);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", beforeInstallPromptHandler);
      window.removeEventListener(capturedInstallPromptEventName, capturedInstallPromptHandler);
      window.removeEventListener("appinstalled", appInstalledHandler);
    };
  }, []);

  return {
    dismissInstall,
    displayMode,
    installError,
    installStatus,
    isInstallPromptAvailable,
    promptInstall,
    resetInstallDismissal,
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message.trim()
    ? error.message
    : "Action d'installation indisponible.";
}
