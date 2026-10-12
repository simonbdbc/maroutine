import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const distDir = path.resolve("dist");
const requiredFiles = [
  "index.html",
  "robots.txt",
  "sitemap-index.xml",
  "_headers",
  "_redirects",
  "build-layout.json",
  "app/index.html",
  "app/manifest.webmanifest",
  "app/service-worker.js",
  "app/pwa-build.json",
  "app/offline.html",
];

for (const file of requiredFiles) {
  try {
    await stat(path.join(distDir, file));
  } catch {
    throw new Error(`Combined dist validation failed: ${file} is missing`);
  }
}

const [landingHtml, pwaHtml, redirects, headers, manifestText] = await Promise.all([
  readFile(path.join(distDir, "index.html"), "utf8"),
  readFile(path.join(distDir, "app/index.html"), "utf8"),
  readFile(path.join(distDir, "_redirects"), "utf8"),
  readFile(path.join(distDir, "_headers"), "utf8"),
  readFile(path.join(distDir, "app/manifest.webmanifest"), "utf8"),
]);

if (landingHtml === pwaHtml) {
  throw new Error("Combined dist validation failed: landing and PWA shells are identical");
}
if (!redirects.includes("/app/* /app/index.html 200")) {
  throw new Error("Combined dist validation failed: /app SPA rewrite is missing");
}
if (!headers.includes("/app/service-worker.js")) {
  throw new Error("Combined dist validation failed: scoped PWA headers are missing");
}

const manifest = JSON.parse(manifestText);
if (manifest.start_url !== "/app/" || manifest.scope !== "/app/") {
  throw new Error("Combined dist validation failed: PWA manifest is not scoped to /app/");
}

console.log("Combined distribution validation passed.");
