import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import ts from "typescript";
import { fileURLToPath } from "node:url";
import { assertCloudflareDeployEnvironment } from "./verify-cloudflare-deploy-env.mjs";
import {
  assertPublishedBuild,
  assertServiceWorkerCacheControl,
} from "./verify-production-deployment.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readSource = (relativePath) => fs.readFile(path.join(projectRoot, relativePath), "utf8");
const lifecyclePath = path.join(projectRoot, "src/shared/pwa/services/pwaLifecycle.ts");
const lifecycleSource = await fs.readFile(lifecyclePath, "utf8");
const compiledLifecycle = ts.transpileModule(lifecycleSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  fileName: lifecyclePath,
}).outputText;
const {
  hasRemoteBuildChanged,
  isInstalledDisplayMode,
  resolveInstallStatus,
  shouldShowInstallPromotion,
  shouldReloadAfterControllerChange,
} = await import(
  `data:text/javascript;base64,${Buffer.from(compiledLifecycle).toString("base64")}`
);

const [
  packageSource,
  appConfigSource,
  providerSource,
  appLayoutSource,
  rootHtmlSource,
  installLifecycleSource,
  serviceWorkerLifecycleSource,
  bridgeSource,
  buildSource,
  menuSource,
  installScreenSource,
  uninstallScreenSource,
  dashboardSource,
  accountSource,
  diagnosticsSource,
  installBannerSource,
  installEnvironmentSource,
  homeInstallHintSource,
  updatePromptSource,
  headersSource,
  ciSource,
] = await Promise.all([
  readSource("package.json"),
  readSource("src/shared/pwa/appConfig.ts"),
  readSource("src/shared/pwa/PwaProvider.tsx"),
  readSource("app/(app)/_layout.tsx"),
  readSource("app/+html.tsx"),
  readSource("src/shared/pwa/hooks/useInstallationLifecycle.ts"),
  readSource("src/shared/pwa/hooks/useServiceWorkerLifecycle.ts"),
  readSource("public/install-prompt-bridge.js"),
  readSource("scripts/post-export-web.cjs"),
  readSource("src/navigation/sideMenu/AppSideMenu.tsx"),
  readSource("app/(app)/install.tsx"),
  readSource("app/(app)/uninstall.tsx"),
  readSource("app/(app)/pwa.tsx"),
  readSource("app/(app)/account.tsx"),
  readSource("src/shared/pwa/hooks/usePwaDiagnostics.ts"),
  readSource("src/shared/pwa/components/InstallAppBanner.tsx"),
  readSource("src/shared/pwa/services/installationEnvironment.ts"),
  readSource("src/features/home/components/PwaInstallHint.tsx"),
  readSource("src/shared/pwa/components/UpdateAvailablePrompt.tsx"),
  readSource("public/_headers"),
  readSource("../../.gitlab-ci.yml"),
]);

test("the package and runtime expose the same semantic app version", () => {
  const packageJson = JSON.parse(packageSource);
  const runtimeVersion = appConfigSource.match(/APP_VERSION\s*=\s*"([^"]+)"/)?.[1];
  assert.equal(runtimeVersion, packageJson.appVersion);
  assert.match(String(packageJson.appVersion), /^\d+\.\d+\.\d+$/);
});

test("installation resolution covers checking, prompt, manual and installed states", () => {
  const base = {
    displayMode: "browser",
    hasDismissal: false,
    hasInstalledMarker: false,
    hasPrompt: false,
    supportsManualInstall: true,
  };
  assert.equal(resolveInstallStatus({ ...base, detectionComplete: false }), "checking");
  assert.equal(resolveInstallStatus({ ...base, detectionComplete: true }), "manual");
  assert.equal(
    resolveInstallStatus({ ...base, detectionComplete: true, hasPrompt: true }),
    "available"
  );
  assert.equal(
    resolveInstallStatus({ ...base, detectionComplete: true, displayMode: "standalone" }),
    "installed"
  );
});

test("an unknown display mode is not treated as an installed application", () => {
  assert.equal(isInstalledDisplayMode("unknown"), false);
  assert.equal(isInstalledDisplayMode("browser"), false);
  assert.equal(isInstalledDisplayMode("standalone"), true);
});

test("dismissal takes precedence over an available prompt", () => {
  assert.equal(
    resolveInstallStatus({
      detectionComplete: true,
      displayMode: "browser",
      hasDismissal: true,
      hasInstalledMarker: false,
      hasPrompt: true,
      supportsManualInstall: true,
    }),
    "dismissed"
  );
});

test("a persistent installation marker takes precedence over browser install states", () => {
  assert.equal(
    resolveInstallStatus({
      detectionComplete: true,
      displayMode: "browser",
      hasDismissal: true,
      hasInstalledMarker: true,
      hasPrompt: true,
      supportsManualInstall: true,
    }),
    "installed"
  );
  assert.match(installEnvironmentSource, /INSTALL_CONFIRMED_KEY/);
});

test("the side-menu installation entry follows the banner visibility", () => {
  assert.equal(shouldShowInstallPromotion("available", false), true);
  assert.equal(shouldShowInstallPromotion("manual", false), true);
  assert.equal(shouldShowInstallPromotion("error", false), true);
  assert.equal(shouldShowInstallPromotion("checking", false), false);
  assert.equal(shouldShowInstallPromotion("dismissed", false), false);
  assert.equal(shouldShowInstallPromotion("unsupported", false), false);
  assert.equal(shouldShowInstallPromotion("available", true), false);
});

test("installation confirmation persists the marker from every supported signal", () => {
  assert.match(
    installLifecycleSource,
    /choice\.outcome === "accepted"\) \{\s*writeInstallMarker\(\)/
  );
  assert.match(
    installLifecycleSource,
    /isInstalledDisplayMode\(nextDisplayMode\)\) \{\s*writeInstallMarker\(\)/
  );
  assert.match(
    installLifecycleSource,
    /const appInstalledHandler = \(\) => \{[\s\S]{0,180}writeInstallMarker\(\)/
  );
  assert.match(installEnvironmentSource, /localStorage\.setItem\(INSTALL_CONFIRMED_KEY, "1"\)/);
});

test("a new install prompt and PWA repair clear the persistent marker", () => {
  assert.match(
    installLifecycleSource,
    /const captureInstallPrompt = \(promptEvent: BeforeInstallPromptEvent\) => \{\s*clearInstallMarker\(\)/
  );
  assert.match(
    installLifecycleSource,
    /setInstallStatus\(hasRecentInstallDismissal\(\) \? "dismissed" : "available"\)/
  );
  assert.match(
    diagnosticsSource,
    /const resetPwaRuntime = useCallback[\s\S]{0,260}clearInstallMarker\(\)/
  );
  assert.match(installEnvironmentSource, /localStorage\.removeItem\(INSTALL_CONFIRMED_KEY\)/);
});

test("build id drives update detection", () => {
  assert.equal(hasRemoteBuildChanged("build-n", "build-n+1"), true);
  assert.equal(hasRemoteBuildChanged("build-n", "build-n"), false);
  assert.equal(hasRemoteBuildChanged(null, "build-n+1"), false);
});

test("every production deployment is checked and proposed as a distinct update", () => {
  assert.match(buildSource, /process\.env\.CI_PIPELINE_ID/);
  assert.match(ciSource, /BUILD_ID="production-\$\{CI_PIPELINE_ID\}-\$\{CI_COMMIT_SHORT_SHA\}"/);
  assert.doesNotMatch(serviceWorkerLifecycleSource, /setInterval|UPDATE_CHECK_INTERVAL_MS/);
  assert.match(
    serviceWorkerLifecycleSource,
    /register\(serviceWorkerUrl, \{ updateViaCache: "none" \}\)/
  );
  for (const browserEvent of ["focus", "online", "pageshow"]) {
    assert.match(
      serviceWorkerLifecycleSource,
      new RegExp(`addEventListener\\("${browserEvent}", checkForLatestDeployment\\)`)
    );
  }
  assert.match(headersSource, /service-worker\.js[\s\S]{0,140}Cache-Control: no-store/);
  assert.match(updatePromptSource, /remoteBuildInfo\.buildId/);
});

test("main cannot silently skip the Cloudflare PWA deployment", () => {
  const deployJobSource = ciSource.slice(ciSource.indexOf("pwa:deploy:cloudflare:"));
  assert.match(deployJobSource, /if: '\$CI_COMMIT_BRANCH == \$CI_DEFAULT_BRANCH'/);
  assert.doesNotMatch(deployJobSource, /CLOUDFLARE_API_TOKEN !=/);
  assert.match(deployJobSource, /npm run validate:pwa:deploy-env/);
  assert.match(deployJobSource, /npm run verify:pwa:production/);

  assert.throws(
    () => assertCloudflareDeployEnvironment({}),
    /CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN/
  );
  assert.doesNotThrow(() =>
    assertCloudflareDeployEnvironment({
      CLOUDFLARE_ACCOUNT_ID: "account-id",
      CLOUDFLARE_API_TOKEN: "masked-token",
    })
  );
});

test("post-deploy verification rejects stale builds and cached service workers", () => {
  const expectedBuild = {
    appVersion: "2.1.2",
    buildId: "production-42-abcdef12",
    commitSha: "abcdef123456",
    releaseChannel: "production",
  };
  assert.doesNotThrow(() =>
    assertPublishedBuild({ ...expectedBuild }, expectedBuild, "https://app.example.test")
  );
  assert.throws(
    () =>
      assertPublishedBuild(
        { ...expectedBuild, buildId: "previous-build" },
        expectedBuild,
        "https://app.example.test"
      ),
    /previous-build/
  );
  assert.doesNotThrow(() =>
    assertServiceWorkerCacheControl("no-store, max-age=0", "https://app.example.test")
  );
  assert.throws(
    () => assertServiceWorkerCacheControl("max-age=14400", "https://app.example.test"),
    /must be served with Cache-Control: no-store/
  );
});

test("controller reload requires explicit update consent", () => {
  assert.equal(shouldReloadAfterControllerChange(false), false);
  assert.equal(shouldReloadAfterControllerChange(true), true);
  assert.match(serviceWorkerLifecycleSource, /requestWorkerSkipWaiting\(waitingWorker\)/);
  assert.doesNotMatch(serviceWorkerLifecycleSource, /setTimeout\([\s\S]{0,300}location\.reload/);
});

test("the install prompt is captured before React mounts", () => {
  assert.match(rootHtmlSource, /resolveAppAssetUrl\("\/install-prompt-bridge\.js"\)/);
  assert.match(buildSource, /install-prompt-bridge\.js/);
  assert.match(bridgeSource, /beforeinstallprompt/);
  assert.match(bridgeSource, /event\.preventDefault\(\)/);
  assert.match(bridgeSource, /__MAROUTINE_PWA_INSTALL_PROMPT__/);
  assert.match(installLifecycleSource, /readCapturedInstallPrompt\(\)/);
  assert.match(installLifecycleSource, /appinstalled/);
});

test("PwaProvider composes browser lifecycles without direct browser access", () => {
  assert.match(providerSource, /useConnectionStatus\(\)/);
  assert.match(providerSource, /useInstallationLifecycle\(\)/);
  assert.match(providerSource, /useServiceWorkerLifecycle\(\)/);
  assert.match(providerSource, /usePwaDiagnostics\(/);
  assert.doesNotMatch(providerSource, /navigator\.|window\.|fetch\(/);
});

test("the side menu hides installation after install while account keeps the dashboard", () => {
  assert.match(appLayoutSource, /pwaMenuLabel=\{menuPwaLabel\}/);
  assert.match(appLayoutSource, /showPwaMenuItem=\{isInstallPromotionVisible\}/);
  assert.match(menuSource, /showPwaMenuItem \? \(/);
  assert.match(accountSource, /accessibilityLabel="Tableau de bord PWA"/);
  assert.match(accountSource, /router\.push\("\/\(app\)\/pwa"/);
});

test("installation prompts consume the consolidated installed state", () => {
  assert.match(providerSource, /shouldShowInstallPromotion\(/);
  assert.match(installBannerSource, /isInstallPromotionVisible/);
  assert.match(installBannerSource, /if \(!isInstallPromotionVisible\)/);
  assert.match(homeInstallHintSource, /resolveInstallHint\(isAppInstalled\)/);
  assert.match(homeInstallHintSource, /isAppInstalled \|\| !isIOSBrowser/);
});

test("installation, uninstallation and dashboard are separate routes", () => {
  assert.match(installScreenSource, /Installer l'application/);
  assert.match(installScreenSource, /InstallAppButton/);
  assert.match(uninstallScreenSource, /Desinstaller l'application/);
  assert.match(uninstallScreenSource, /StorageUsagePanel/);
  assert.match(dashboardSource, /Tableau de bord PWA/);
  assert.match(dashboardSource, /PwaDiagnosticsPanel/);
});

test("generated service worker versions the shell by build and bypasses API traffic", () => {
  assert.match(buildSource, /SHELL_CACHE[\s\S]*BUILD_INFO\.buildId/);
  assert.match(buildSource, /SKIP_WAITING/);
  assert.match(buildSource, /clients\.claim\(\)/);
  assert.match(buildSource, /networkFirstDocument/);
  assert.match(buildSource, /url\.pathname\.includes\(\"\/api\/\"\)/);
  assert.match(buildSource, /url\.pathname\.includes\(\"\/auth\/\"\)/);
  assert.doesNotMatch(buildSource, /isOfflineAssetUrl[\s\S]{0,180}startsWith\(\"\/stickers\/\"\)/);
});
