#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = process.cwd();
const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

function readJson(relativePath) {
  const fullPath = path.join(PROJECT_ROOT, relativePath);
  const raw = fs.readFileSync(fullPath, "utf8");
  return JSON.parse(raw);
}

function readText(relativePath) {
  return fs.readFileSync(path.join(PROJECT_ROOT, relativePath), "utf8");
}

function get(obj, keys) {
  let current = obj;
  for (const key of keys) {
    if (!current || typeof current !== "object") {
      return undefined;
    }
    current = current[key];
  }
  return current;
}

function assertHex(value, label) {
  if (!HEX_COLOR_REGEX.test(String(value || ""))) {
    throw new Error(`Invalid hex color for ${label}: "${String(value)}"`);
  }
}

function run() {
  const failures = [];

  const themeRegistry = readJson("src/shared/theme/themes.json");
  const theme = themeRegistry.theme || {};
  const primary = theme.primary;
  const white = theme.white;

  assertHex(primary, "themes.json theme.primary");
  assertHex(white, "themes.json theme.white");

  const appConfig = readJson("app.json");
  const expo = appConfig.expo || {};
  const manifest = readJson("public/manifest.webmanifest");

  const checks = [
    {
      id: "app.json expo.splash.backgroundColor",
      actual: get(expo, ["splash", "backgroundColor"]),
      expected: primary,
    },
    {
      id: "app.json expo.android.adaptiveIcon.backgroundColor",
      actual: get(expo, ["android", "adaptiveIcon", "backgroundColor"]),
      expected: primary,
    },
    {
      id: "app.json expo.web.backgroundColor",
      actual: get(expo, ["web", "backgroundColor"]),
      expected: white,
    },
    {
      id: "manifest.webmanifest theme_color",
      actual: manifest.theme_color,
      expected: primary,
    },
    {
      id: "manifest.webmanifest background_color",
      actual: manifest.background_color,
      expected: white,
    },
  ];

  for (const check of checks) {
    if (check.actual !== check.expected) {
      failures.push(
        `${check.id}: expected=${check.expected} actual=${String(check.actual)}`,
      );
    }
  }

  const html = readText("app/+html.tsx");
  const htmlThemeColorOk =
    /<meta\s+name="theme-color"\s+content=\{ThemeColors\.primary\}\s*\/>/.test(html) ||
    /<meta\s+name="theme-color"\s+content=\{Colors\.primary\}\s*\/>/.test(html) ||
    new RegExp(`<meta\\s+name="theme-color"\\s+content="${primary}"\\s*\\/?>`).test(html);
  if (!htmlThemeColorOk) {
    failures.push("app/+html.tsx: missing canonical <meta name=\"theme-color\"> binding");
  }

  const htmlBodyOk =
    /<body[^>]*backgroundColor:\s*ThemeColors\.white/.test(html) ||
    /<body[^>]*backgroundColor:\s*Colors\.white/.test(html) ||
    new RegExp(`<body[^>]*backgroundColor:\\s*"${white}"`).test(html);
  if (!htmlBodyOk) {
    failures.push("app/+html.tsx: missing canonical body background color");
  }

  const globalCss = readText("src/shared/theme/global.css");
  const bodyUsesApplyTokens = /body\s*\{[^}]*@apply\s+[^;]*\bbg-white\b[^;]*\btext-black\b[^;]*;/is.test(
    globalCss,
  );
  if (!bodyUsesApplyTokens) {
    failures.push(
      "src/shared/theme/global.css: body must use '@apply bg-white text-black' (no inline hex duplication)",
    );
  }
  if (/body\s*\{[^}]*\b(background|color)\s*:\s*#[0-9A-Fa-f]{6}/is.test(globalCss)) {
    failures.push("src/shared/theme/global.css: inline hex color detected in body rule");
  }

  const tailwindConfig = readText("tailwind.config.js");
  if (!tailwindConfig.includes('require("./src/shared/theme/themes.json")')) {
    failures.push("tailwind.config.js: theme registry import is missing");
  }
  if (!tailwindConfig.includes("DEFAULT: defaultTheme.primary")) {
    failures.push("tailwind.config.js: primary.DEFAULT is not bound to defaultTheme.primary");
  }
  if (!tailwindConfig.includes("background: defaultTheme.white")) {
    failures.push("tailwind.config.js: background is not bound to defaultTheme.white");
  }
  if (/#B44959/i.test(tailwindConfig)) {
    failures.push("tailwind.config.js: legacy color #B44959 detected");
  }

  const postExportScript = readText("scripts/post-export-web.cjs");
  if (/<meta name="theme-color" content="#[0-9A-Fa-f]{6}" \/>/i.test(postExportScript)) {
    failures.push("scripts/post-export-web.cjs: hardcoded theme-color meta detected");
  }
  if (!postExportScript.includes("THEME_PRIMARY")) {
    failures.push("scripts/post-export-web.cjs: theme-color meta is not bound to theme registry");
  }

  if (failures.length > 0) {
    console.error(`[ERROR] ${failures.length} theme-shell coherence failure(s):`);
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log("[OK] check:theme-shell passed.");
}

try {
  run();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[ERROR] ${message}`);
  process.exit(2);
}
