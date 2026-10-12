import { cp, mkdir, readFile, rm, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const landingDist = path.join(rootDir, "apps/landing/dist");
const pwaDist = path.join(rootDir, "apps/pwa/dist");
const combinedDist = path.join(rootDir, "dist");
const combinedPwaDist = path.join(combinedDist, "app");

await assertDirectory(landingDist, "Build landing introuvable. Lancez d’abord build:landing.");
await assertDirectory(pwaDist, "Build PWA introuvable. Lancez d’abord build:pwa.");

await rm(combinedDist, { force: true, recursive: true });
await mkdir(combinedDist, { recursive: true });
await cp(landingDist, combinedDist, { recursive: true });
await cp(pwaDist, combinedPwaDist, { recursive: true });

for (const controlFile of ["_headers", "_redirects"]) {
  const source = path.join(pwaDist, controlFile);
  const target = path.join(combinedDist, controlFile);
  await cp(source, target);
  await unlink(path.join(combinedPwaDist, controlFile));
}

const buildManifest = {
  generatedAt: new Date().toISOString(),
  landing: "/",
  pwa: "/app/",
};
await writeFile(
  path.join(combinedDist, "build-layout.json"),
  `${JSON.stringify(buildManifest, null, 2)}\n`,
);

const landingHtml = await readFile(path.join(combinedDist, "index.html"), "utf8");
const pwaHtml = await readFile(path.join(combinedPwaDist, "index.html"), "utf8");
if (landingHtml === pwaHtml) throw new Error("La landing et la PWA ne sont pas séparées dans dist/.");

process.stdout.write("[build] Artefact combiné généré dans dist/ (landing /, PWA /app/).\n");

async function assertDirectory(directory, message) {
  try {
    if ((await stat(directory)).isDirectory()) return;
  } catch {
    // Le message métier ci-dessous est plus utile que l'erreur système.
  }
  throw new Error(message);
}
