export {
  APP_VERSION,
  CANONICAL_APP_ORIGIN,
  LEGACY_APP_HOST,
  resolveAppUrl,
  resolveConfiguredAppOrigin,
} from "./appConfig";
export { buildCanonicalUrlForCurrentLocation, buildCanonicalAppUrl } from "./domainRedirect";
export { CanonicalUrlBanner } from "./CanonicalUrlBanner";
export { AppVersionInfo } from "./components/AppVersionInfo";
export { ConnectionStatus } from "./components/ConnectionStatus";
export { InstallAppBanner } from "./components/InstallAppBanner";
export { InstallAppButton } from "./components/InstallAppButton";
export { PwaDiagnosticsPanel } from "./components/PwaDiagnosticsPanel";
export { PwaGlobalPrompts } from "./components/PwaGlobalPrompts";
export { StorageUsagePanel } from "./components/StorageUsagePanel";
export { UpdateAvailablePrompt } from "./components/UpdateAvailablePrompt";
export { PwaProvider, getMenuPwaLabel, getMenuPwaTarget, usePwa } from "./PwaProvider";
export type {
  PwaBuildInfo,
  PwaDiagnostics,
  PwaDisplayMode,
  PwaInstallStatus as PwaLifecycleInstallStatus,
  PwaMenuTarget,
  PwaNetworkStatus,
  PwaServiceWorkerStatus,
  PwaUpdateStatus,
} from "./types";
export {
  isIOSBrowser,
  isLikelySafari,
  isNativeInstallPromptAvailable,
  isPwaInstalled,
  resolveInstallPlatform,
  type InstallEnvironment,
  type InstallPlatformKind,
} from "./installState";
export {
  buildVersionCheckUrl,
  fetchAppVersion,
  hasAppVersionChanged,
  parseAppVersionPayload,
  type AppVersionPayload,
  type VersionCheckResult,
} from "./versionCheck";
export {
  useAppVersionCheck,
  type UseAppVersionCheckOptions,
  type UseAppVersionCheckResult,
} from "./useAppVersionCheck";
export {
  readPwaInstallStatus,
  usePwaInstallStatus,
  type PwaInstallStatus,
} from "./usePwaInstallStatus";
