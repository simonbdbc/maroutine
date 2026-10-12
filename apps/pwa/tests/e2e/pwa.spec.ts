import { expect, test, type Page } from "@playwright/test";

test("the distribution exposes a complete and non-cacheable PWA control plane", async ({
  request,
}) => {
  const [manifestResponse, workerResponse, buildResponse, offlineResponse] = await Promise.all([
    request.get("/app/manifest.webmanifest"),
    request.get("/app/service-worker.js"),
    request.get("/app/pwa-build.json"),
    request.get("/app/offline.html"),
  ]);

  expect(manifestResponse.ok()).toBe(true);
  expect(workerResponse.ok()).toBe(true);
  expect(buildResponse.ok()).toBe(true);
  expect(offlineResponse.ok()).toBe(true);
  expect(workerResponse.headers()["cache-control"]).toContain("no-store");
  expect(workerResponse.headers()["service-worker-allowed"]).toBe("/app/");
  expect(buildResponse.headers()["cache-control"]).toContain("no-store");

  const manifest = await manifestResponse.json();
  const build = await buildResponse.json();
  expect(manifest.display).toBe("standalone");
  expect(manifest.screenshots).toHaveLength(2);
  expect(build.appVersion).toMatch(/^\d+\.\d+\.\d+$/);
  expect(build.buildId).toBeTruthy();
});

test("the authenticated PWA routes remain usable on desktop and mobile", async ({ page }) => {
  await authenticateLocally(page);
  await expect(
    page.getByText(/^(Installer Maroutine|Installer depuis le navigateur)$/)
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /(?:Installer l'app|Comment installer l'app)$/ })
  ).toBeVisible();

  await page.goto("/app/pwa");
  await expect(page.getByText("Tableau de bord PWA", { exact: true }).last()).toBeVisible();
  await expect(page.getByRole("button", { exact: true, name: "Installation" })).toBeVisible();
  await expect(page.getByRole("button", { exact: true, name: "Desinstallation" })).toBeVisible();
  await expect(page.getByText("Diagnostic PWA", { exact: true })).toBeVisible();

  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto("/app/install");
  await expect(page.getByText("Installer l'application", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Tableau de bord PWA" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);

  await page.goto("/app/uninstall");
  await expect(page.getByText("Desinstaller l'application", { exact: true })).toBeVisible();
  await expect(page.getByText("Reinstallation propre", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test("the mobile side menu keeps routine display options accessible", async ({ page }) => {
  await page.setViewportSize({ height: 568, width: 320 });
  await authenticateLocally(page);

  await page.getByRole("button", { name: "Ouvrir le menu" }).click();
  await page.mouse.move(160, 480);
  await page.mouse.wheel(0, 1_200);

  const multiRoutineSwitch = page.getByLabel("Basculer l'affichage multi routines", {
    exact: true,
  });
  const adaptedRoutineSwitch = page.getByLabel("Basculer l'affichage adapté des routines", {
    exact: true,
  });

  await expect(multiRoutineSwitch).toBeVisible();
  await expect(adaptedRoutineSwitch).toBeVisible();
  await expect(page.getByLabel("Basculer l'ancrage du menu", { exact: true })).toHaveCount(0);

  const initialMultiRoutineState = await multiRoutineSwitch.isChecked();
  await multiRoutineSwitch.click();
  await expect.poll(() => multiRoutineSwitch.isChecked()).toBe(!initialMultiRoutineState);
});

test("an installed app hides install promotion but keeps dashboard access in account", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("maroutine.pwa-installed:v1", "1");
  });
  await authenticateLocally(page);

  await page.goto("/app/account");
  await expect(page.getByText("Installer Maroutine", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Installer depuis le navigateur", { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole("button", {
      name: /(?:Installer l'app|Comment installer l'app|Gerer l'app installee|Mise a jour disponible)$/,
    })
  ).toHaveCount(0);

  const dashboardButton = page.getByRole("button", {
    exact: true,
    name: "Tableau de bord PWA",
  });
  await expect(dashboardButton).toBeVisible();
  await dashboardButton.click();
  await expect(page).toHaveURL(/\/app\/pwa$/);
  await expect(page.getByText("Tableau de bord PWA", { exact: true }).last()).toBeVisible();
});

test("dismissing installation hides the banner and side-menu entry", async ({ page }) => {
  await authenticateLocally(page);

  await expect(
    page.getByRole("button", { name: /(?:Installer l'app|Comment installer l'app)$/ })
  ).toBeVisible();
  await page.getByRole("button", { exact: true, name: "Plus tard" }).click();

  await expect(page.getByText("Installer Maroutine", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Installer depuis le navigateur", { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole("button", {
      name: /(?:Installer l'app|Comment installer l'app|Reafficher l'installation)$/,
    })
  ).toHaveCount(0);

  await page.goto("/app/account");
  await expect(
    page.getByRole("button", { exact: true, name: "Tableau de bord PWA" })
  ).toBeVisible();
});

test("each new production build proposes a PWA update", async ({ page, request }) => {
  const buildResponse = await request.get("/app/pwa-build.json");
  const currentBuild = await buildResponse.json();
  const firstProductionBuildId = `production-e2e-${Date.now()}-1`;
  const secondProductionBuildId = `production-e2e-${Date.now()}-2`;

  await page.addInitScript(
    ({ build, buildId, storageKey }) => {
      if (!window.localStorage.getItem(storageKey)) {
        window.localStorage.setItem(storageKey, buildId);
      }
      const nativeFetch = window.fetch.bind(window);
      window.fetch = async (input, init) => {
        const url =
          typeof input === "string"
            ? input
            : input instanceof Request
              ? input.url
              : input.toString();
        if (url.includes("/pwa-build.json")) {
          return new Response(
            JSON.stringify({
              ...build,
              buildId: window.localStorage.getItem(storageKey) ?? buildId,
              buildDate: new Date().toISOString(),
              releaseChannel: "production",
            }),
            { headers: { "Content-Type": "application/json" }, status: 200 }
          );
        }
        return nativeFetch(input, init);
      };
    },
    {
      build: currentBuild,
      buildId: firstProductionBuildId,
      storageKey: "maroutine.e2e-remote-build-id",
    }
  );
  await authenticateLocally(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBe(true);

  await expect(page.getByText("Mise a jour disponible", { exact: true })).toBeVisible();
  await expect(page.getByText(new RegExp(`build ${firstProductionBuildId}`))).toBeVisible();
  await page.getByRole("button", { exact: true, name: "Plus tard" }).click();
  await expect(page.getByText("Mise a jour disponible", { exact: true })).toHaveCount(0);

  await page.evaluate(
    ({ buildId, storageKey }) => window.localStorage.setItem(storageKey, buildId),
    {
      buildId: secondProductionBuildId,
      storageKey: "maroutine.e2e-remote-build-id",
    }
  );
  await page.goto("/app/pwa");

  await expect(page.getByText("Mise a jour disponible", { exact: true })).toBeVisible();
  await expect(page.getByText(new RegExp(`build ${secondProductionBuildId}`))).toBeVisible();
});

test("the service worker controls a reload and serves the app offline", async ({
  context,
  page,
}) => {
  await page.goto("/app/");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBe(true);

  const cacheNames = await page.evaluate(() => caches.keys());
  expect(cacheNames.some((name) => name.startsWith("maroutine-shell-"))).toBe(true);
  expect(cacheNames.some((name) => name.startsWith("maroutine-assets-"))).toBe(true);

  await context.setOffline(true);
  try {
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page).toHaveTitle("Maroutine");
    await expect(page.getByText("Connexion", { exact: true })).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
});

async function authenticateLocally(page: Page) {
  const now = Math.floor(Date.now() / 1_000);
  const accessToken = createUnsignedJwt({
    aud: "authenticated",
    email: "pwa-e2e@example.test",
    exp: now + 3_600,
    role: "authenticated",
    sub: "00000000-0000-4000-8000-000000000001",
  });
  const user = {
    id: "00000000-0000-4000-8000-000000000001",
    aud: "authenticated",
    role: "authenticated",
    email: "pwa-e2e@example.test",
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: { full_name: "PWA E2E" },
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await page.route("**/auth/v1/token**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        access_token: accessToken,
        expires_at: now + 3_600,
        expires_in: 3_600,
        refresh_token: "pwa-e2e-refresh-token",
        token_type: "bearer",
        user,
      }),
    });
  });
  await page.route("**/rest/v1/**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: "[]",
      headers: { "Content-Range": "0-0/0" },
    });
  });

  await page.goto("/app/login");
  await page.getByPlaceholder("parent@email.com").fill("pwa-e2e@example.test");
  await page.getByPlaceholder("••••••••").fill("pwa-e2e-password");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/app\/home$/);
}

function createUnsignedJwt(payload: Record<string, unknown>): string {
  const encode = (value: Record<string, unknown>) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "none", typ: "JWT" })}.${encode(payload)}.`;
}
