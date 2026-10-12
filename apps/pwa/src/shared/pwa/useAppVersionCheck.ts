import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import { fetchAppVersion, type AppVersionPayload, type VersionCheckResult } from "./versionCheck";

export type UseAppVersionCheckOptions = {
  autoCheck?: boolean;
};

export type UseAppVersionCheckResult = {
  checking: boolean;
  error: string | null;
  remoteVersion: AppVersionPayload | null;
  updateAvailable: boolean;
  checkForUpdate: () => Promise<VersionCheckResult>;
  reloadForUpdate: () => void;
};

export function useAppVersionCheck(
  options: UseAppVersionCheckOptions = {},
): UseAppVersionCheckResult {
  const { autoCheck = false } = options;
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remoteVersion, setRemoteVersion] = useState<AppVersionPayload | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const checkForUpdate = useCallback(async () => {
    if (Platform.OS !== "web" || typeof fetch === "undefined") {
      const result: VersionCheckResult = { updateAvailable: false };
      setError(null);
      setRemoteVersion(null);
      setUpdateAvailable(false);
      return result;
    }

    setChecking(true);
    const result = await fetchAppVersion(fetch);
    setChecking(false);
    setError(result.error ?? null);
    setRemoteVersion(result.remote ?? null);
    setUpdateAvailable(result.updateAvailable);
    return result;
  }, []);

  const reloadForUpdate = useCallback(() => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.location.reload();
    }
  }, []);

  useEffect(() => {
    if (!autoCheck) return;
    void checkForUpdate();
  }, [autoCheck, checkForUpdate]);

  return {
    checking,
    checkForUpdate,
    error,
    reloadForUpdate,
    remoteVersion,
    updateAvailable,
  };
}
