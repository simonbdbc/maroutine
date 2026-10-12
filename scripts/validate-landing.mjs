import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const distDir = path.resolve("apps/landing/dist");
const requiredFiles = ["index.html", "robots.txt", "sitemap-index.xml", "sitemap-0.xml"];

for (const file of requiredFiles) {
  try {
    await stat(path.join(distDir, file));
  } catch {
    throw new Error(`Landing validation failed: ${file} is missing`);
  }
}

const html = await readFile(path.join(distDir, "index.html"), "utf8");
for (const snippet of [
  '<html lang="fr">',
  "<title>",
  'name="description"',
  'rel="canonical"',
  'property="og:title"',
  'property="og:description"',
  'property="og:type"',
  'property="og:url"',
  'name="twitter:card"',
  'href="https://app.maroutine.app/home"',
  'href="https://app.maroutine.app/login"',
  "Des routines plus douces. Des journées qui avancent.",
]) {
  if (!html.includes(snippet)) {
    throw new Error(`Landing validation failed: index.html does not include ${snippet}`);
  }
}

for (const legacyAppLink of ['href="/app/home"', 'href="/app/login"']) {
  if (html.includes(legacyAppLink)) {
    throw new Error(`Landing validation failed: legacy app link remains: ${legacyAppLink}`);
  }
}

const robots = await readFile(path.join(distDir, "robots.txt"), "utf8");
if (!robots.includes("Sitemap: https://maroutine.app/sitemap-index.xml")) {
  throw new Error("Landing validation failed: robots.txt does not expose the production sitemap");
}

console.log("Landing validation passed.");
