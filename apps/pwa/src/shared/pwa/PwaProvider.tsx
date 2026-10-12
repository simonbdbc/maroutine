import { createContext, useContext, useMemo, type PropsWithChildren } from "react";
import { useAppLifecycle } from "./hooks/useAppLifecycle";
import { useConnectionStatus } from "./hooks/useConnectionStatus";
import { useInstallationLifecycle } from "./hooks/useInstallationLifecycle";
import { usePwaDiagnostics } from "./hooks/usePwaDiagnostics";
import { useServiceWorkerLifecycle } from "./hooks/useServiceWorkerLifecycle";
import { isInstalledDisplayMode, shouldShowInstallPromotion } from "./services/pwaLifecycle";
import type {
  PwaBuildInfo,
  PwaDiagnostics,
  PwaDisplayMode,
  PwaInstallStatus,
  PwaMenuTarget,
  PwaNetworkStatus,
  PwaServiceWorkerStatus,
  PwaUpdateStatus,
} from "./types";

export type PwaContextValue = {
  applyUpdate: () => Promise<void>;
  buildInfo: PwaBuildInfo | null;
  checkForUpdate: () => Promise<void>;
  clearPwaCaches: () => Promise<void>;
  diagnostics: PwaDiagnostics | null;
  dismissInstall: () => void;
  dismissUpdate: () => void;
  displayMode: PwaDisplayMode;
  installError: string | null;
  installStatus: PwaInstallStatus;
  isAppInstalled: boolean;
  isInstallPromotionVisible: boolean;
  isInstallPromptAvailable: boolean;
  isUpdateAvailable: boolean;
  lastUpdateError: string | null;
  menuPwaLabel: string;
  menuPwaTarget: PwaMenuTarget;
  networkStatus: PwaNetworkStatus;
  promptInstall: () => Promise<void>;
  refreshDiagnostics: () => Promise<void>;
  remoteBuildInfo: PwaBuildInfo | null;
  resetInstallDismissal: () => void;
  resetPwaRuntime: () => Promise<void>;
  serviceWorkerStatus: PwaServiceWorkerStatus;
  updateStatus: PwaUpdateStatus;
};

const PwaContext = createContext<PwaContextValue | null>(null);

export function PwaProvider({ children }: PropsWithChildren) {
  useAppLifecycle();
  const { networkStatus, refreshConnectionStatus } = useConnectionStatus();
  const installation = useInstallationLifecycle();
  const serviceWorker = useServiceWorkerLifecycle();
  const diagnostics = usePwaDiagnostics({
    buildInfo: serviceWorker.buildInfo,
    lastUpdateError: serviceWorker.lastUpdateError,
    networkStatus,
    refreshConnectionStatus,
    remoteBuildInfo: serviceWorker.remoteBuildInfo,
    serviceWorkerStatus: serviceWorker.serviceWorkerStatus,
  });
  const isAppInstalled =
    isInstalledDisplayMode(installation.displayMode) || installation.installStatus === "installed";
  const isInstallPromotionVisible = shouldShowInstallPromotion(
    installation.installStatus,
    isAppInstalled
  );
  const menuPwaTarget = getMenuPwaTarget({
    displayMode: installation.displayMode,
    installStatus: installation.installStatus,
    isUpdateAvailable: serviceWorker.isUpdateAvailable,
    updateStatus: serviceWorker.updateStatus,
  });
  const menuPwaLabel = getMenuPwaLabel({
    displayMode: installation.displayMode,
    installStatus: installation.installStatus,
    isUpdateAvailable: serviceWorker.isUpdateAvailable,
    updateStatus: serviceWorker.updateStatus,
  });

  const value = useMemo<PwaContextValue>(
    () => ({
      applyUpdate: serviceWorker.applyUpdate,
      buildInfo: serviceWorker.buildInfo,
      checkForUpdate: serviceWorker.checkForUpdate,
      clearPwaCaches: diagnostics.clearPwaCaches,
      diagnostics: diagnostics.diagnostics,
      dismissInstall: installation.dismissInstall,
      dismissUpdate: serviceWorker.dismissUpdate,
      displayMode: installation.displayMode,
      installError: installation.installError,
      installStatus: installation.installStatus,
      isAppInstalled,
      isInstallPromotionVisible,
      isInstallPromptAvailable: installation.isInstallPromptAvailable,
      isUpdateAvailable: serviceWorker.isUpdateAvailable,
      lastUpdateError: serviceWorker.lastUpdateError,
      menuPwaLabel,
      menuPwaTarget,
      networkStatus,
      promptInstall: installation.promptInstall,
      refreshDiagnostics: diagnostics.refreshDiagnostics,
      remoteBuildInfo: serviceWorker.remoteBuildInfo,
      resetInstallDismissal: installation.resetInstallDismissal,
      resetPwaRuntime: diagnostics.resetPwaRuntime,
      serviceWorkerStatus: serviceWorker.serviceWorkerStatus,
      updateStatus: serviceWorker.updateStatus,
    }),
    [
      diagnostics.clearPwaCaches,
      diagnostics.diagnostics,
      diagnostics.refreshDiagnostics,
      diagnostics.resetPwaRuntime,
      installation.dismissInstall,
      installation.displayMode,
      installation.installError,
      installation.installStatus,
      installation.isInstallPromptAvailable,
      installation.promptInstall,
      installation.resetInstallDismissal,
      isAppInstalled,
      isInstallPromotionVisible,
      menuPwaLabel,
      menuPwaTarget,
      networkStatus,
      serviceWorker.applyUpdate,
      serviceWorker.buildInfo,
      serviceWorker.checkForUpdate,
      serviceWorker.dismissUpdate,
      serviceWorker.isUpdateAvailable,
      serviceWorker.lastUpdateError,
      serviceWorker.remoteBuildInfo,
      serviceWorker.serviceWorkerStatus,
      serviceWorker.updateStatus,
    ]
  );

  return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>;
}

export function usePwa(): PwaContextValue {
  const value = useContext(PwaContext);
  if (!value) throw new Error("usePwa must be used inside PwaProvider");
  return value;
}

export function getMenuPwaTarget({
  displayMode,
  installStatus,
  isUpdateAvailable,
  updateStatus,
}: {
  displayMode: PwaDisplayMode;
  installStatus: PwaInstallStatus;
  isUpdateAvailable: boolean;
  updateStatus: PwaUpdateStatus;
}): PwaMenuTarget {
  if (isUpdateAvailable || updateStatus === "available") return "pwa";
  if (isInstalledDisplayMode(displayMode) || installStatus === "installed") return "uninstall";
  return "install";
}

export function getMenuPwaLabel({
  displayMode,
  installStatus,
  isUpdateAvailable,
  updateStatus,
}: {
  displayMode: PwaDisplayMode;
  installStatus: PwaInstallStatus;
  isUpdateAvailable: boolean;
  updateStatus: PwaUpdateStatus;
}): string {
  if (isUpdateAvailable || updateStatus === "available") return "Mise a jour disponible";
  if (isInstalledDisplayMode(displayMode) || installStatus === "installed") {
    return "Gerer l'app installee";
  }
  switch (installStatus) {
    case "available":
      return "Installer l'app";
    case "manual":
      return "Comment installer l'app";
    case "dismissed":
      return "Reafficher l'installation";
    case "error":
      return "Diagnostiquer l'installation";
    case "checking":
      return "Detection de l'installation";
    default:
      return "Gestion de l'app";
  }
}
