#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_PAGES_ORIGIN = "https://maroutine-app.pages.dev";
const DEFAULT_ATTEMPTS = 30;
const DEFAULT_RETRY_DELAY_MS = 4_000;

export function assertPublishedBuild(actualBuild, expectedBuild, origin) {
  for (const field of ["appVersion", "buildId", "commitSha", "releaseChannel"]) {
    if (actualBuild?.[field] !== expectedBuild?.[field]) {
      throw new Error(
        `${origin}/pwa-build.json serves ${field}=${String(actualBuild?.[field])}; expected ${String(expectedBuild?.[field])}`
      );
    }
  }
}

export function assertServiceWorkerCacheControl(cacheControl, origin) {
  const directives = String(cacheControl || "")
    .split(",")
    .map((directive) => directive.trim().toLowerCase());
  if (!directives.includes("no-store")) {
    throw new Error(
      `${origin}/service-worker.js must be served with Cache-Control: no-store; received ${String(cacheControl || "<missing>")}`
    );
  }
}

async function verifyOrigin(fetchImpl, origin, expectedBuild) {
  const cacheBuster = encodeURIComponent(expectedBuild.buildId);
  const buildUrl = new URL(`/pwa-build.json?deployment=${cacheBuster}`, `${origin}/`);
  const buildResponse = await fetchImpl(buildUrl, {
    cache: "no-store",
    headers: { "cache-control": "no-cache" },
  });
  if (!buildResponse.ok) {
    throw new Error(`${buildUrl.origin}/pwa-build.json returned HTTP ${buildResponse.status}`);
  }
  const actualBuild = await buildResponse.json();
  assertPublishedBuild(actualBuild, expectedBuild, buildUrl.origin);

  const workerUrl = new URL(`/service-worker.js?deployment=${cacheBuster}`, `${origin}/`);
  const workerResponse = await fetchImpl(workerUrl, {
    cache: "no-store",
    headers: { "cache-control": "no-cache" },
    method: "HEAD",
  });
  if (!workerResponse.ok) {
    throw new Error(`${workerUrl.origin}/service-worker.js returned HTTP ${workerResponse.status}`);
  }
  assertServiceWorkerCacheControl(workerResponse.headers.get("cache-control"), workerUrl.origin);
}

export async function verifyProductionDeployment({
  attempts = DEFAULT_ATTEMPTS,
  expectedBuild,
  fetchImpl = fetch,
  origins,
  retryDelayMs = DEFAULT_RETRY_DELAY_MS,
}) {
  let lastErrors = [];

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const results = await Promise.allSettled(
      origins.map((origin) => verifyOrigin(fetchImpl, origin, expectedBuild))
    );
    lastErrors = results.flatMap((result) =>
      result.status === "rejected" ? [errorMessage(result.reason)] : []
    );
    if (lastErrors.length === 0) return;
    if (attempt < attempts) await delay(retryDelayMs);
  }

  throw new Error(
    `Production deployment did not converge after ${attempts} attempts:\n- ${lastErrors.join("\n- ")}`
  );
}

async function main() {
  const expectedBuild = JSON.parse(
    await readFile(path.join(projectRoot, "dist", "pwa-build.json"), "utf8")
  );
  const configuredOrigins = String(process.env.PWA_DEPLOY_VERIFY_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const origins = [
    ...new Set(
      configuredOrigins.length > 0
        ? configuredOrigins
        : [expectedBuild.origin, DEFAULT_PAGES_ORIGIN]
    ),
  ];

  await verifyProductionDeployment({ expectedBuild, origins });
  process.stdout.write(
    `Production PWA build ${expectedBuild.buildId} is active on ${origins.join(", ")}.\n`
  );
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(errorMessage(error));
    process.exitCode = 1;
  });
}
