#!/usr/bin/env node

import { pathToFileURL } from "node:url";

const REQUIRED_VARIABLES = ["CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_API_TOKEN"];

export function missingCloudflareDeployVariables(environment = process.env) {
  return REQUIRED_VARIABLES.filter((name) => !String(environment[name] || "").trim());
}

export function assertCloudflareDeployEnvironment(environment = process.env) {
  const missingVariables = missingCloudflareDeployVariables(environment);
  if (missingVariables.length === 0) return;

  throw new Error(
    `Cloudflare Pages deployment is required on main, but these GitLab CI/CD variables are missing: ${missingVariables.join(", ")}`
  );
}

function main() {
  assertCloudflareDeployEnvironment();
  process.stdout.write("Cloudflare Pages deployment environment is configured.\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
