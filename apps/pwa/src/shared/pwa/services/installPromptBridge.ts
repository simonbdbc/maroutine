export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

export const capturedInstallPromptKey = "__MAROUTINE_PWA_INSTALL_PROMPT__";
export const capturedInstallPromptEventName = "maroutine:pwa-install-prompt";

declare global {
  interface Window {
    __MAROUTINE_PWA_INSTALL_PROMPT__?: BeforeInstallPromptEvent | null;
  }
}

export function readCapturedInstallPrompt(): BeforeInstallPromptEvent | null {
  if (typeof window === "undefined") return null;
  return window[capturedInstallPromptKey] ?? null;
}

export function rememberCapturedInstallPrompt(event: BeforeInstallPromptEvent): void {
  if (typeof window !== "undefined") {
    window[capturedInstallPromptKey] = event;
  }
}

export function clearCapturedInstallPrompt(expectedEvent?: BeforeInstallPromptEvent): void {
  if (typeof window === "undefined") return;
  if (expectedEvent && window[capturedInstallPromptKey] !== expectedEvent) return;
  window[capturedInstallPromptKey] = null;
}
