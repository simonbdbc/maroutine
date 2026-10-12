#!/usr/bin/env node

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const LEGACY_COLOR_KEYS = [
  "primaryLight",
  "primaryDark",
  "primaryMuted",
  "gold",
  "goldPastel",
  "goldDark",
  "morning",
  "morningBg",
  "morningBorder",
  "noon",
  "noonBg",
  "noonBorder",
  "afternoon",
  "afternoonBg",
  "afternoonBorder",
  "evening",
  "eveningBg",
  "eveningBorder",
  "surface",
  "background",
  "border",
  "textPrimary",
  "textSecondary",
  "textMuted",
  "textOnPrimary",
];
const LEGACY_KEY_SET = new Set(LEGACY_COLOR_KEYS);

const pattern = `Colors\\.(${LEGACY_COLOR_KEYS.join("|")})\\b`;
const strictMode = process.argv.includes("--strict");
const ROOT = path.resolve(__dirname, "..");
const TARGET_DIRS = ["app", "src"];
const ALLOWED_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);
const EXCLUDED_PATHS = new Set(["src/shared/theme/tokens.ts"]);

const args = [
  "-n",
  "--no-heading",
  pattern,
  "app",
  "src",
  "--glob",
  "*.{ts,tsx,js,jsx}",
  "-g",
  "!src/shared/theme/tokens.ts",
];

function toPosix(relativePath) {
  return relativePath.split(path.sep).join("/");
}

function collectSourceFiles() {
  const files = [];

  const walk = (dirPath) => {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (!ALLOWED_EXTENSIONS.has(ext)) continue;
      files.push(fullPath);
    }
  };

  for (const dir of TARGET_DIRS) {
    const fullPath = path.join(ROOT, dir);
    if (!fs.existsSync(fullPath)) continue;
    walk(fullPath);
  }

  return files;
}

function runRipgrep() {
  const result = spawnSync("rg", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (!result.error) {
    return result;
  }

  if (result.error.code === "ENOENT") {
    return null;
  }

  console.error("[ERROR] Cannot run `rg`:", result.error.message);
  process.exit(2);
}

function runNodeFallback() {
  const lineRegex = new RegExp(pattern);
  const lines = [];

  for (const fullPath of collectSourceFiles()) {
    const relativePath = toPosix(path.relative(ROOT, fullPath));
    if (EXCLUDED_PATHS.has(relativePath)) continue;

    const content = fs.readFileSync(fullPath, "utf8");
    const fileLines = content.split(/\r?\n/);

    for (let index = 0; index < fileLines.length; index += 1) {
      const line = fileLines[index];
      if (!lineRegex.test(line)) continue;
      lines.push(`${relativePath}:${index + 1}:${line}`);
    }
  }

  return {
    status: lines.length > 0 ? 0 : 1,
    stdout: lines.join("\n"),
    stderr: "",
  };
}

const result = runRipgrep() ?? runNodeFallback();

if (result.status === 1) {
  console.log("[OK] No legacy theme tokens found outside compatibility layer.");
  process.exit(0);
}

if (result.status !== 0) {
  process.stderr.write(result.stderr || "[ERROR] Legacy theme tokens check failed.\n");
  process.exit(result.status ?? 2);
}

const lines = result.stdout.trim().split("\n").filter(Boolean);
const byToken = new Map();
const byFile = new Map();
let totalMatches = 0;

for (const line of lines) {
  const matches = line.matchAll(/Colors\.([A-Za-z0-9_]+)/g);
  let matchedOnLine = 0;

  for (const match of matches) {
    const token = match[1];
    if (!token || !LEGACY_KEY_SET.has(token)) continue;
    matchedOnLine += 1;
    totalMatches += 1;
    byToken.set(token, (byToken.get(token) ?? 0) + 1);
  }

  if (matchedOnLine > 0) {
    const firstColon = line.indexOf(":");
    const file = firstColon > -1 ? line.slice(0, firstColon) : line;
    byFile.set(file, (byFile.get(file) ?? 0) + matchedOnLine);
  }
}

const tokenSummary = [...byToken.entries()]
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  .map(([token, count]) => `${String(count).padStart(3, " ")}  ${token}`)
  .join("\n");

const fileSummary = [...byFile.entries()]
  .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  .slice(0, 15)
  .map(([file, count]) => `${String(count).padStart(3, " ")}  ${file}`)
  .join("\n");

const modeLabel = strictMode ? "strict" : "report";
console.warn(
  `[WARN] Legacy theme tokens detected (${totalMatches} occurrence(s), mode=${modeLabel}).`,
);
console.warn("\nTop legacy tokens:");
console.warn(tokenSummary || "(none)");
console.warn("\nTop files:");
console.warn(fileSummary || "(none)");
console.warn("\nRun `node ./scripts/check-legacy-theme-tokens.cjs --strict` to fail the pipeline.");

if (strictMode) {
  process.exit(1);
}

process.exit(0);
