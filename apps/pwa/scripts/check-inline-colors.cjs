#!/usr/bin/env node

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const PATTERN = "#[0-9A-Fa-f]{3,8}|rgba?\\(";
const WHITELIST = [
  // Central utility allowed to produce rgba(...)
  "src/shared/utils/colorUtils.ts",
  // EPIC11 v2: profile palettes are explicit product-owned hex lists.
  "src/features/profiles/types/index.ts",
];
const ROOT = path.resolve(__dirname, "..");
const TARGET_DIRS = ["app", "src"];
const ALLOWED_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);

const args = [
  "-n",
  "--no-heading",
  PATTERN,
  "app",
  "src",
  "--glob",
  "*.{ts,tsx,js,jsx}",
  ...WHITELIST.flatMap((entry) => ["-g", `!${entry}`]),
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
  const whitelistSet = new Set(WHITELIST.map((entry) => toPosix(entry)));
  const regex = new RegExp(PATTERN);
  const matches = [];

  for (const fullPath of collectSourceFiles()) {
    const relativePath = toPosix(path.relative(ROOT, fullPath));
    if (whitelistSet.has(relativePath)) continue;

    const content = fs.readFileSync(fullPath, "utf8");
    const lines = content.split(/\r?\n/);

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (!regex.test(line)) continue;
      matches.push(`${relativePath}:${index + 1}:${line}`);
    }
  }

  return {
    status: matches.length > 0 ? 0 : 1,
    stdout: matches.join("\n"),
    stderr: "",
  };
}

const rgResult = runRipgrep();
const usedNodeFallback = rgResult === null;
const result = rgResult ?? runNodeFallback();

if (result.status === 1) {
  const runner = usedNodeFallback ? "node-fallback" : "rg";
  console.log(`[OK] check:inline-colors (${runner}): no inline colors found outside whitelist.`);
  process.exit(0);
}

if (result.status !== 0) {
  process.stderr.write(result.stderr || "[ERROR] Inline colors check failed.\n");
  process.exit(result.status ?? 2);
}

console.error("[ERROR] Forbidden inline colors detected (outside whitelist):");
if (result.stdout) {
  process.stderr.write(`${result.stdout}\n`);
}
console.error("\nFix these occurrences using `Colors` / `withAlpha`.");
console.error(`Current whitelist: ${WHITELIST.join(", ")}`);
process.exit(1);
