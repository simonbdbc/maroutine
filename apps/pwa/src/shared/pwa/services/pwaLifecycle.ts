import type { PwaDisplayMode, PwaInstallStatus } from "../types";

export type InstallResolution =
  | "checking"
  | "available"
  | "installed"
  | "manual"
  | "unsupported"
  | "dismissed";

export function resolveInstallStatus({
  detectionComplete,
  displayMode,
  hasDismissal,
  hasInstalledMarker,
  hasPrompt,
  supportsManualInstall,
}: {
  detectionComplete: boolean;
  displayMode: PwaDisplayMode;
  hasDismissal: boolean;
  hasInstalledMarker: boolean;
  hasPrompt: boolean;
  supportsManualInstall: boolean;
}): InstallResolution {
  if (isInstalledDisplayMode(displayMode) || hasInstalledMarker) return "installed";
  if (hasDismissal) return "dismissed";
  if (hasPrompt) return "available";
  if (!detectionComplete) return "checking";
  return supportsManualInstall ? "manual" : "unsupported";
}

export function isInstalledDisplayMode(displayMode: PwaDisplayMode): boolean {
  return displayMode !== "browser" && displayMode !== "unknown";
}

export function shouldShowInstallPromotion(
  installStatus: PwaInstallStatus,
  isAppInstalled: boolean
): boolean {
  return !isAppInstalled && ["available", "manual", "error"].includes(installStatus);
}

export function hasRemoteBuildChanged(
  currentBuildId: string | null | undefined,
  remoteBuildId: string | null | undefined
): boolean {
  return Boolean(currentBuildId && remoteBuildId && currentBuildId !== remoteBuildId);
}

export function shouldReloadAfterControllerChange(consentRequested: boolean): boolean {
  return consentRequested;
}
