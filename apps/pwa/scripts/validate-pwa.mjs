import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const projectRoot = path.resolve(".");
const distDir = path.join(projectRoot, "dist");
const packageJson = JSON.parse(await readFile(path.join(projectRoot, "package.json"), "utf8"));
const expectedVersion = String(packageJson.appVersion || packageJson.version);
const appBasePath = normalizeBasePath(process.env.EXPO_PUBLIC_APP_BASE_PATH);
const defaultSiteOrigin = "http://127.0.0.1:4173";
const productionOrigin = ensureAppOrigin(
  process.env.EXPO_PUBLIC_APP_URL || defaultSiteOrigin
);
const requiredFiles = [
  "index.html",
  "manifest.webmanifest",
  "install-prompt-bridge.js",
  "service-worker.js",
  "offline.html",
  "pwa-build.json",
  "version.json",
  "_headers",
  "_redirects",
  "icons/icon-192-20260604.png",
  "icons/icon-512-20260604.png",
  "icons/icon-maskable-512-20260604.png",
  "icons/apple-touch-icon-20260604.png",
  "screenshots/install-desktop-wide.jpg",
  "screenshots/install-mobile.jpg",
];

function fail(message) {
  throw new Error(`PWA validation failed: ${message}`);
}

async function fileExists(relativePath) {
  try {
    await stat(path.join(distDir, relativePath));
    return true;
  } catch {
    return false;
  }
}

const readText = (relativePath) => readFile(path.join(distDir, relativePath), "utf8");
const readJson = async (relativePath) => JSON.parse(await readText(relativePath));

for (const file of requiredFiles) {
  if (!(await fileExists(file))) fail(`${file} is missing`);
}

const indexHtml = await readText("index.html");
for (const snippet of [
  'rel="manifest"',
  'name="theme-color"',
  'name="mobile-web-app-capable"',
  'rel="apple-touch-icon"',
  `src="${appPath("/install-prompt-bridge.js")}"`,
]) {
  if (!indexHtml.includes(snippet)) fail(`index.html does not include ${snippet}`);
}
if (!indexHtml.includes(`rel="canonical" href="${productionOrigin}/"`)) {
  fail(`index.html canonical must use ${productionOrigin}`);
}

const manifest = await readJson("manifest.webmanifest");
for (const field of [
  "id",
  "name",
  "short_name",
  "description",
  "start_url",
  "scope",
  "display",
  "background_color",
  "theme_color",
  "icons",
]) {
  if (!manifest[field]) fail(`manifest field ${field} is missing`);
}
if (manifest.start_url !== appPath("/") || manifest.scope !== appPath("/"))
  fail(`manifest start_url and scope must be ${appPath("/")}`);
if (manifest.display !== "standalone") fail("manifest display must be standalone");
if (manifest.prefer_related_applications !== false) fail("manifest must prefer the web app");
if (!manifest.icons.some((icon) => icon.sizes === "192x192" && icon.purpose === "any")) {
  fail("manifest requires an any-purpose 192x192 icon");
}
if (!manifest.icons.some((icon) => icon.sizes === "512x512" && icon.purpose === "any")) {
  fail("manifest requires an any-purpose 512x512 icon");
}
if (!manifest.icons.some((icon) => icon.purpose === "maskable"))
  fail("manifest requires a maskable icon");
if (!Array.isArray(manifest.screenshots) || manifest.screenshots.length < 2) {
  fail("manifest requires desktop and mobile screenshots");
}
if (
  !manifest.screenshots.some((shot) => shot.form_factor === "wide" && shot.sizes === "1280x720")
) {
  fail("manifest requires a 1280x720 wide screenshot");
}
if (!manifest.screenshots.some((shot) => shot.sizes === "390x844")) {
  fail("manifest requires a 390x844 mobile screenshot");
}

const headers = await readText("_headers");
if (!headers.includes(appPath("/service-worker.js")) || !headers.includes("no-store")) {
  fail("service-worker.js must be served with no-store");
}
if (!headers.includes("Content-Security-Policy-Report-Only"))
  fail("CSP report-only header is missing");

const redirects = await readText("_redirects");
const expectedSpaRewrite =
  appBasePath === "/" ? "/* /index.html 200" : `${appBasePath}/* ${appBasePath}/index.html 200`;
if (!redirects.includes(expectedSpaRewrite)) {
  fail(`Cloudflare Pages must include SPA rewrite: ${expectedSpaRewrite}`);
}
if (await fileExists("404.html")) fail("dist/404.html disables the Pages SPA fallback");

const bridge = await readText("install-prompt-bridge.js");
for (const snippet of [
  "beforeinstallprompt",
  "event.preventDefault()",
  "__MAROUTINE_PWA_INSTALL_PROMPT__",
]) {
  if (!bridge.includes(snippet)) fail(`install bridge does not include ${snippet}`);
}

const serviceWorker = await readText("service-worker.js");
for (const snippet of [
  "maroutine",
  `const SHELL_URL = "${appPath("/index.html")}"`,
  "SKIP_WAITING",
  "clients.claim()",
  "networkFirstDocument",
  "cacheFirst",
  "GET_DIAGNOSTICS",
  "RETAINED_ASSET_CACHE_COUNT",
  "BUILD_INFO.buildId",
]) {
  if (!serviceWorker.includes(snippet)) fail(`service worker does not include ${snippet}`);
}

const buildInfo = await readJson("pwa-build.json");
for (const field of [
  "appName",
  "appVersion",
  "buildId",
  "commitSha",
  "releaseChannel",
  "buildDate",
  "origin",
  "supportContact",
]) {
  if (!buildInfo[field]) fail(`pwa-build field ${field} is missing`);
}
if (buildInfo.appVersion !== expectedVersion) fail("pwa-build version differs from package.json");
if (buildInfo.releaseChannel === "production" && buildInfo.origin !== productionOrigin) {
  fail(`production origin must be ${productionOrigin}`);
}

console.log("PWA validation passed.");

function ensureAppOrigin(value) {
  const normalized = String(value).replace(/\/+$/, "");
  const url = new URL(normalized);
  if (appBasePath === "/") return url.origin;
  if (!url.pathname || url.pathname === "/") url.pathname = appBasePath;
  return url.toString().replace(/\/+$/, "");
}

function normalizeBasePath(value) {
  const normalized = String(value || "/app").trim();
  if (!normalized || normalized === "/") return "/";
  return `/${normalized.replace(/^\/+|\/+$/g, "")}`;
}

function appPath(relativePath = "/") {
  const nextPath = relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
  return appBasePath === "/" ? nextPath : `${appBasePath}${nextPath}`;
}
