(() => {
  const promptKey = "__MAROUTINE_PWA_INSTALL_PROMPT__";
  const promptEventName = "maroutine:pwa-install-prompt";

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    window[promptKey] = event;
    window.dispatchEvent(new Event(promptEventName));
  });

  window.addEventListener("appinstalled", () => {
    window[promptKey] = null;
  });
})();
