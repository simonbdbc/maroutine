#!/usr/bin/env node

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "public");
const DIST_DIR = path.join(ROOT, "dist");
const THEME_REGISTRY_PATH = path.join(ROOT, "src/shared/theme/themes.json");
const PACKAGE_JSON_PATH = path.join(ROOT, "package.json");
const CACHE_PREFIX = "maroutine";
const SOURCE_APP_BASE_PATH = "/app";
const APP_BASE_PATH = normalizeBasePath(process.env.EXPO_PUBLIC_APP_BASE_PATH);
const DEFAULT_SITE_ORIGIN =
  APP_BASE_PATH === "/" ? "https://app.maroutine.app" : "https://maroutine.app";
const PRODUCTION_ORIGIN = ensureAppOrigin(
  process.env.EXPO_PUBLIC_APP_URL || DEFAULT_SITE_ORIGIN
);
const DEFAULT_SUPPORT_CONTACT = "contact@maroutine.app";
const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

const FILES_TO_COPY = [
  "manifest.webmanifest",
  "version.json",
  "install-prompt-bridge.js",
  "offline.html",
  "_headers",
  "_redirects",
];
const DIRECTORIES_TO_COPY = ["icons", "stickers"];
const OPTIONAL_DIRECTORIES_TO_COPY = ["screenshots"];
const TEXT_FILE_EXTENSIONS = new Set([".css", ".html", ".js", ".json", ".map", ".txt"]);

function readThemePrimaryColor() {
  const registry = JSON.parse(fs.readFileSync(THEME_REGISTRY_PATH, "utf8"));
  const primary = registry?.theme?.primary;
  if (!HEX_COLOR_REGEX.test(String(primary || ""))) {
    throw new Error(`Couleur theme.primary invalide dans themes.json: "${String(primary)}"`);
  }
  return String(primary).toUpperCase();
}

const THEME_PRIMARY = readThemePrimaryColor();

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyFile(relativePath) {
  const source = path.join(PUBLIC_DIR, relativePath);
  const target = path.join(DIST_DIR, relativePath);
  if (!fs.existsSync(source)) throw new Error(`Fichier manquant dans public/: ${relativePath}`);
  ensureDir(path.dirname(target));
  fs.copyFileSync(source, target);
}

function copyDirectory(relativePath) {
  const sourceDir = path.join(PUBLIC_DIR, relativePath);
  const targetDir = path.join(DIST_DIR, relativePath);
  if (!fs.existsSync(sourceDir)) throw new Error(`Dossier manquant dans public/: ${relativePath}`);
  ensureDir(targetDir);
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const childRelativePath = path.join(relativePath, entry.name);
    if (entry.isDirectory()) copyDirectory(childRelativePath);
    else if (entry.isFile()) copyFile(childRelativePath);
  }
}

function listFiles(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) listFiles(entryPath, files);
    else if (entry.isFile()) files.push(entryPath);
  }
  return files;
}

function readGitValue(args, fallback) {
  try {
    return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim() || fallback;
  } catch {
    return fallback;
  }
}

function createBuildInfo() {
  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, "utf8"));
  const commitSha =
    process.env.CI_COMMIT_SHA ||
    process.env.CF_PAGES_COMMIT_SHA ||
    readGitValue(["rev-parse", "HEAD"], "local");
  const branch =
    process.env.CI_COMMIT_BRANCH ||
    process.env.CF_PAGES_BRANCH ||
    readGitValue(["rev-parse", "--abbrev-ref", "HEAD"], "");
  const isCiBuild = Boolean(process.env.CI || process.env.CF_PAGES);
  const releaseChannel =
    process.env.EXPO_PUBLIC_RELEASE_CHANNEL ||
    process.env.CI_ENVIRONMENT_NAME ||
    (isCiBuild && branch === "main"
      ? "production"
      : isCiBuild && branch
        ? "preview"
        : "development");
  const buildId =
    process.env.BUILD_ID ||
    process.env.CI_PIPELINE_ID ||
    (commitSha !== "local" ? commitSha.slice(0, 12) : `local-${Date.now()}`);
  const configuredOrigin =
    process.env.EXPO_PUBLIC_APP_URL ||
    process.env.CI_ENVIRONMENT_URL ||
    process.env.CF_PAGES_URL ||
    (releaseChannel === "production" ? PRODUCTION_ORIGIN : "http://localhost:8081");
  const origin = ensureAppOrigin(configuredOrigin);

  return {
    appName: "Maroutine",
    appVersion: String(packageJson.appVersion || packageJson.version),
    buildId,
    commitSha,
    releaseChannel,
    buildDate: new Date().toISOString(),
    origin,
    supportContact: process.env.EXPO_PUBLIC_SUPPORT_CONTACT || DEFAULT_SUPPORT_CONTACT,
  };
}

function ensureAppOrigin(value) {
  const normalized = String(value).replace(/\/+$/, "");
  try {
    const url = new URL(normalized);
    if (APP_BASE_PATH === "/") return url.origin;
    if (!url.pathname || url.pathname === "/") url.pathname = APP_BASE_PATH;
    return url.toString().replace(/\/+$/, "");
  } catch {
    if (APP_BASE_PATH === "/") return normalized;
    return normalized.endsWith(APP_BASE_PATH) ? normalized : `${normalized}${APP_BASE_PATH}`;
  }
}

function normalizeBasePath(value) {
  const normalized = String(value || SOURCE_APP_BASE_PATH).trim();
  if (!normalized || normalized === "/") return "/";
  return `/${normalized.replace(/^\/+|\/+$/g, "")}`;
}

function appPath(relativePath = "/") {
  const nextPath = relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
  return APP_BASE_PATH === "/" ? nextPath : `${APP_BASE_PATH}${nextPath}`;
}

function patchIndexHtml() {
  const indexPath = path.join(DIST_DIR, "index.html");
  if (!fs.existsSync(indexPath)) throw new Error("Fichier dist/index.html introuvable.");
  const source = fs.readFileSync(indexPath, "utf8");
  let next = source
    .replace('<html lang="en">', '<html lang="fr">')
    .replace(
      'content="width=device-width, initial-scale=1, shrink-to-fit=no"',
      'content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"'
    );
  const requiredTags = [
    `<meta name="theme-color" content="${THEME_PRIMARY}" />`,
    '<meta name="application-name" content="Maroutine" />',
    '<meta name="mobile-web-app-capable" content="yes" />',
    '<meta name="apple-mobile-web-app-capable" content="yes" />',
    '<meta name="apple-mobile-web-app-status-bar-style" content="default" />',
    '<meta name="apple-mobile-web-app-title" content="Maroutine" />',
    '<meta name="description" content="Application de routines quotidiennes gamifiees pour les familles." />',
    `<link rel="canonical" href="${PRODUCTION_ORIGIN}/" />`,
    `<link rel="manifest" href="${appPath("/manifest.webmanifest")}" />`,
    `<link rel="apple-touch-icon" href="${appPath("/icons/apple-touch-icon-20260604.png")}" />`,
    `<script src="${appPath("/install-prompt-bridge.js")}"></script>`,
  ];

  next = next.replace(/<meta\s+name=["']theme-color["'][^>]*>\s*/gi, "");
  next = next.replace(/<link\s+rel=["']manifest["'][^>]*>\s*/gi, "");
  next = next.replace(/<link\s+rel=["']apple-touch-icon["'][^>]*>\s*/gi, "");
  next = next.replace(/<meta\s+name=["']application-name["'][^>]*>\s*/gi, "");
  next = next.replace(/<meta\s+name=["']mobile-web-app-capable["'][^>]*>\s*/gi, "");
  next = next.replace(/<meta\s+name=["']apple-mobile-web-app-capable["'][^>]*>\s*/gi, "");
  next = next.replace(/<meta\s+name=["']apple-mobile-web-app-status-bar-style["'][^>]*>\s*/gi, "");
  next = next.replace(/<meta\s+name=["']apple-mobile-web-app-title["'][^>]*>\s*/gi, "");
  next = next.replace(/<meta\s+name=["']description["'][^>]*>\s*/gi, "");
  next = next.replace(/<link\s+rel=["']canonical["'][^>]*>\s*/gi, "");
  next = next.replace(/<script\s+src=["'](?:\/app)?\/install-prompt-bridge\.js["'][^>]*><\/script>\s*/gi, "");
  next = next.replace("</head>", `  ${requiredTags.join("\n  ")}\n</head>`);
  fs.writeFileSync(indexPath, next);
}

function writeBuildMetadata(buildInfo) {
  fs.writeFileSync(
    path.join(DIST_DIR, "pwa-build.json"),
    `${JSON.stringify(buildInfo, null, 2)}\n`
  );
  fs.writeFileSync(
    path.join(DIST_DIR, "version.json"),
    `${JSON.stringify({ version: buildInfo.appVersion, build: buildInfo.buildDate.slice(0, 10) }, null, 2)}\n`
  );
}

function distUrl(filePath) {
  return appPath(`/${path.relative(DIST_DIR, filePath).split(path.sep).join("/")}`);
}

function isShellAssetUrl(url) {
  return (
    url.startsWith(appPath("/_expo/static/")) ||
    url.startsWith(appPath("/assets/assets/fonts/"))
  );
}

function isOfflineAssetUrl(url) {
  return isShellAssetUrl(url) || url.startsWith(appPath("/icons/"));
}

function serviceWorkerSource(buildInfo, precacheUrls, assetUrls) {
  return `/* eslint-disable no-restricted-globals */
const BUILD_INFO = ${JSON.stringify(buildInfo, null, 2)};
const CACHE_PREFIX = ${JSON.stringify(CACHE_PREFIX)};
const APP_BASE_PATH = ${JSON.stringify(APP_BASE_PATH)};
const SHELL_URL = ${JSON.stringify(appPath("/index.html"))};
const OFFLINE_URL = ${JSON.stringify(appPath("/offline.html"))};
const BUILD_INFO_URL = ${JSON.stringify(appPath("/pwa-build.json"))};
const SHELL_CACHE = \`\${CACHE_PREFIX}-shell-v\${BUILD_INFO.appVersion}-\${BUILD_INFO.buildId}\`;
const ASSET_CACHE = \`\${CACHE_PREFIX}-assets-v\${BUILD_INFO.appVersion}-\${BUILD_INFO.buildId}\`;
const RUNTIME_CACHE = \`\${CACHE_PREFIX}-runtime-v\${BUILD_INFO.buildId}\`;
const RETAINED_ASSET_CACHE_COUNT = 2;
const PRECACHE_URLS = ${JSON.stringify(precacheUrls, null, 2)};
const ASSET_URLS = ${JSON.stringify(assetUrls, null, 2)};
const ASSET_URL_SET = new Set(ASSET_URLS);

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const shellCache = await caches.open(SHELL_CACHE);
    await shellCache.addAll(PRECACHE_URLS);
    const assetCache = await caches.open(ASSET_CACHE);
    await assetCache.addAll(ASSET_URLS);
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    const retainedAssetCaches = new Set(
      cacheNames.filter((name) => name.startsWith(\`\${CACHE_PREFIX}-assets-\`)).slice(-RETAINED_ASSET_CACHE_COUNT)
    );
    retainedAssetCaches.add(ASSET_CACHE);
    const expectedCaches = new Set([SHELL_CACHE, RUNTIME_CACHE, ...retainedAssetCaches]);
    await Promise.all(
      cacheNames
        .filter((name) => name.startsWith(\`\${CACHE_PREFIX}-\`))
        .filter((name) => !expectedCaches.has(name))
        .map((name) => caches.delete(name))
    );
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || shouldBypassCache(url)) return;
  if (isDocumentRequest(request)) {
    event.respondWith(networkFirstDocument(request));
    return;
  }
  if (url.pathname === BUILD_INFO_URL) {
    event.respondWith(networkFirstBuildInfo(request));
    return;
  }
  if (ASSET_URL_SET.has(url.pathname) || isRuntimeAsset(url)) {
    event.respondWith(cacheFirst(request, ASSET_URL_SET.has(url.pathname) ? ASSET_CACHE : RUNTIME_CACHE));
  }
});

self.addEventListener("message", (event) => {
  const message = event.data || {};
  if (message.type === "SKIP_WAITING") {
    event.ports?.[0]?.postMessage({ type: "SKIP_WAITING_ACK", buildInfo: BUILD_INFO });
    self.skipWaiting();
    return;
  }
  if (message.type === "GET_VERSION") {
    event.ports?.[0]?.postMessage({ type: "VERSION", buildInfo: BUILD_INFO });
    return;
  }
  if (message.type === "GET_DIAGNOSTICS") {
    event.waitUntil((async () => {
      event.ports?.[0]?.postMessage({ type: "DIAGNOSTICS", buildInfo: BUILD_INFO, caches: await caches.keys() });
    })());
  }
});

function isDocumentRequest(request) {
  return request.mode === "navigate" || request.headers.get("accept")?.includes("text/html");
}

function shouldBypassCache(url) {
  return url.pathname.includes("/api/") || url.pathname.includes("/auth/") || url.pathname.includes("/oidc") || url.pathname.includes("/oauth") || url.pathname.includes("/callback");
}

function isRuntimeAsset(url) {
  return url.pathname.startsWith(${JSON.stringify(appPath("/assets/"))}) || url.pathname.startsWith(${JSON.stringify(appPath("/stickers/"))}) || url.pathname.startsWith(${JSON.stringify(appPath("/icons/"))});
}

async function networkFirstDocument(request) {
  const shellCache = await caches.open(SHELL_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok && response.type === "basic") await shellCache.put(SHELL_URL, response.clone());
    return response;
  } catch {
    return (await shellCache.match(SHELL_URL)) || (await shellCache.match(OFFLINE_URL)) || Response.error();
  }
}

async function networkFirstBuildInfo(request) {
  const shellCache = await caches.open(SHELL_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok && response.type === "basic") await shellCache.put(BUILD_INFO_URL, response.clone());
    return response;
  } catch {
    return (await shellCache.match(BUILD_INFO_URL)) || Response.error();
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && response.type === "basic") {
    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
  }
  return response;
}
`;
}

function writeServiceWorker(buildInfo) {
  const urls = listFiles(DIST_DIR)
    .map(distUrl)
    .filter((url) => url !== appPath("/service-worker.js"));
  const precacheUrls = Array.from(
    new Set([
      appPath("/index.html"),
      appPath("/offline.html"),
      appPath("/manifest.webmanifest"),
      appPath("/pwa-build.json"),
      appPath("/version.json"),
      appPath("/install-prompt-bridge.js"),
    ])
  ).sort();
  const assetUrls = urls.filter(isOfflineAssetUrl).sort();
  fs.writeFileSync(
    path.join(DIST_DIR, "service-worker.js"),
    serviceWorkerSource(buildInfo, precacheUrls, assetUrls)
  );
}

function main() {
  if (!fs.existsSync(DIST_DIR)) throw new Error("Dossier dist/ introuvable.");
  for (const file of FILES_TO_COPY) copyFile(file);
  for (const directory of DIRECTORIES_TO_COPY) copyDirectory(directory);
  for (const directory of OPTIONAL_DIRECTORIES_TO_COPY) {
    if (fs.existsSync(path.join(PUBLIC_DIR, directory))) copyDirectory(directory);
  }
  patchDeploymentFiles();
  patchIndexHtml();
  const buildInfo = createBuildInfo();
  writeBuildMetadata(buildInfo);
  writeServiceWorker(buildInfo);
  process.stdout.write(
    `[web] PWA shell, metadata and service worker generated in dist/ for ${appPath("/")}.\n`
  );
}

function patchDeploymentFiles() {
  const manifestPath = path.join(DIST_DIR, "manifest.webmanifest");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  fs.writeFileSync(manifestPath, `${JSON.stringify(rebaseManifestValue(manifest), null, 2)}\n`);

  const headersPath = path.join(DIST_DIR, "_headers");
  const headers = fs.readFileSync(headersPath, "utf8");
  fs.writeFileSync(headersPath, rebaseControlFile(headers));

  const redirectsPath = path.join(DIST_DIR, "_redirects");
  if (APP_BASE_PATH === "/") {
    fs.writeFileSync(
      redirectsPath,
      "# Cloudflare Pages: toutes les routes de la PWA reviennent vers le shell Expo.\n/* /index.html 200\n"
    );
  } else {
    const redirects = fs.readFileSync(redirectsPath, "utf8");
    fs.writeFileSync(redirectsPath, rebaseControlFile(redirects));
  }
}

function rebaseManifestValue(value) {
  if (Array.isArray(value)) return value.map(rebaseManifestValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, rebaseManifestValue(child)])
    );
  }
  if (typeof value !== "string" || !value.startsWith(SOURCE_APP_BASE_PATH)) return value;
  const suffix = value.slice(SOURCE_APP_BASE_PATH.length) || "/";
  return APP_BASE_PATH === "/" ? suffix : `${APP_BASE_PATH}${suffix}`;
}

function rebaseControlFile(source) {
  if (APP_BASE_PATH === SOURCE_APP_BASE_PATH) return source;
  const replacement = APP_BASE_PATH === "/" ? "" : APP_BASE_PATH;
  return source.replaceAll(SOURCE_APP_BASE_PATH, replacement);
}

main();
