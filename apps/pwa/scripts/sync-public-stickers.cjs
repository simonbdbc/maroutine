#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ASSETS_DIR = path.join(ROOT, "assets", "stickers");
const PUBLIC_DIR = path.join(ROOT, "public", "stickers");
const IMAGE_REGEX = /\.(png|jpe?g|webp)$/i;
const IGNORED_PACKS = new Set(["debug"]);

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function listRootStickerFiles(dirPath) {
  if (!fs.existsSync(dirPath)) {
    throw new Error(`Directory not found: ${dirPath}`);
  }

  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => entry.isFile() && IMAGE_REGEX.test(entry.name))
    .map((entry) => entry.name);
}

function listPackStickerFiles(dirPath, packName) {
  const packDir = path.join(dirPath, packName);
  if (!fs.existsSync(packDir)) return [];
  return fs
    .readdirSync(packDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && IMAGE_REGEX.test(entry.name))
    .map((entry) => ({ pack: packName, fileName: entry.name }));
}

function toNormalizedFileName(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const base = path.basename(fileName, path.extname(fileName)).toLowerCase().trim();
  if (!base) {
    throw new Error(`Invalid sticker file name: "${fileName}"`);
  }
  return `${base}${ext}`;
}

function normalizeRelativeStickerPath(relativePath) {
  const parts = relativePath.split(path.sep).filter(Boolean);
  if (parts.length === 1) {
    return toNormalizedFileName(parts[0]);
  }
  if (parts.length === 2) {
    return path.posix.join(parts[0].toLowerCase(), toNormalizedFileName(parts[1]));
  }
  throw new Error(`Unsupported nested sticker path: "${relativePath}"`);
}

function run() {
  ensureDir(PUBLIC_DIR);

  const normalizedBySource = new Map();

  for (const rootFile of listRootStickerFiles(ASSETS_DIR)) {
    const normalized = toNormalizedFileName(rootFile);
    if (normalizedBySource.has(normalized)) {
      throw new Error(
        `Name collision after normalization: "${rootFile}" and "${normalizedBySource.get(normalized)}"`,
      );
    }
    normalizedBySource.set(normalized, rootFile);
  }

  const packDirs = fs
    .readdirSync(ASSETS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .filter((name) => !IGNORED_PACKS.has(name.toLowerCase()))
    .sort((a, b) => a.localeCompare(b, "fr"));

  for (const packName of packDirs) {
    for (const entry of listPackStickerFiles(ASSETS_DIR, packName)) {
      const normalized = path.posix.join(packName.toLowerCase(), toNormalizedFileName(entry.fileName));
      const sourceRel = path.join(packName, entry.fileName);
      if (normalizedBySource.has(normalized)) {
        throw new Error(
          `Name collision after normalization: "${sourceRel}" and "${normalizedBySource.get(normalized)}"`,
        );
      }
      normalizedBySource.set(normalized, sourceRel);
    }
  }

  let copied = 0;
  for (const [normalizedRelPath, sourceRelPath] of normalizedBySource.entries()) {
    const from = path.join(ASSETS_DIR, sourceRelPath);
    const to = path.join(PUBLIC_DIR, normalizedRelPath);
    ensureDir(path.dirname(to));
    fs.copyFileSync(from, to);
    copied += 1;
  }

  const validNames = new Set(normalizedBySource.keys());
  const walkImageFiles = (dirPath, baseRel = "") => {
    if (!fs.existsSync(dirPath)) return [];
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      const rel = baseRel ? path.join(baseRel, entry.name) : entry.name;
      const full = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        files.push(...walkImageFiles(full, rel));
      } else if (entry.isFile() && IMAGE_REGEX.test(entry.name)) {
        files.push(rel);
      }
    }
    return files;
  };

  const currentPublicFiles = walkImageFiles(PUBLIC_DIR);

  let removed = 0;
  for (const rel of currentPublicFiles) {
    const full = path.join(PUBLIC_DIR, rel);
    const normalizedRel = normalizeRelativeStickerPath(rel);
    if (!validNames.has(normalizedRel)) {
      fs.unlinkSync(full);
      removed += 1;
    }
  }

  const pruneEmptyDirs = (dirPath) => {
    if (!fs.existsSync(dirPath)) return;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const child = path.join(dirPath, entry.name);
      pruneEmptyDirs(child);
      const childEntries = fs.readdirSync(child);
      if (childEntries.length === 0) {
        fs.rmdirSync(child);
      }
    }
  };
  pruneEmptyDirs(PUBLIC_DIR);

  if (copied === 0) {
    throw new Error("No sticker files found to sync.");
  }

  console.log(
    `[OK] sync:public-stickers completed (copied=${copied}, removed_stale=${removed}).`,
  );
}

try {
  run();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[ERROR] ${message}`);
  process.exit(1);
}
