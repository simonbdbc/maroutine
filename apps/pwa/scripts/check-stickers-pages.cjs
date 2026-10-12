#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ASSETS_DIR = path.join(ROOT, "assets", "stickers");
const PUBLIC_DIR = path.join(ROOT, "public", "stickers");
const IMAGE_REGEX = /\.(png|jpe?g|webp)$/i;
const IGNORED_PACKS = new Set(["debug"]);

function listRootStickerFiles(dirPath) {
  if (!fs.existsSync(dirPath)) {
    throw new Error(`Directory not found: ${dirPath}`);
  }

  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => entry.isFile() && IMAGE_REGEX.test(entry.name))
    .map((entry) => entry.name);
}

function normalizeFileName(fileName) {
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
    return normalizeFileName(parts[0]);
  }
  if (parts.length === 2) {
    return path.posix.join(parts[0].toLowerCase(), normalizeFileName(parts[1]));
  }
  throw new Error(`Unsupported nested sticker path: "${relativePath}"`);
}

function listPackDirs(dirPath) {
  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .filter((name) => !IGNORED_PACKS.has(name.toLowerCase()))
    .sort((a, b) => a.localeCompare(b, "fr"));
}

function collectStickerEntries(dirPath) {
  if (!fs.existsSync(dirPath)) {
    throw new Error(`Directory not found: ${dirPath}`);
  }

  const entries = [];

  for (const fileName of listRootStickerFiles(dirPath)) {
    entries.push(normalizeFileName(fileName));
  }

  const packDirs = listPackDirs(dirPath);
  for (const packName of packDirs) {
    const fullPackDir = path.join(dirPath, packName);
    const files = fs
      .readdirSync(fullPackDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && IMAGE_REGEX.test(entry.name))
      .map((entry) => entry.name);

    for (const fileName of files) {
      entries.push(path.posix.join(packName.toLowerCase(), normalizeFileName(fileName)));
    }
  }

  return entries.sort();
}

function collectPublicEntries(dirPath) {
  if (!fs.existsSync(dirPath)) {
    throw new Error(`Directory not found: ${dirPath}`);
  }

  const walk = (currentDir, baseRel = "") => {
    const out = [];
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const rel = baseRel ? path.join(baseRel, entry.name) : entry.name;
      const full = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        out.push(...walk(full, rel));
      } else if (entry.isFile() && IMAGE_REGEX.test(entry.name)) {
        out.push(normalizeRelativeStickerPath(rel));
      }
    }
    return out;
  };

  return walk(dirPath).sort();
}

function run() {
  const failures = [];

  const assetFiles = collectStickerEntries(ASSETS_DIR);
  const publicFiles = collectPublicEntries(PUBLIC_DIR);

  const duplicateAssetNames = assetFiles.filter(
    (name, index, arr) => arr.indexOf(name) !== index,
  );
  if (duplicateAssetNames.length > 0) {
    failures.push(`Duplicate normalized names in assets/stickers: ${duplicateAssetNames.join(", ")}`);
  }

  const missingInPublic = assetFiles.filter((name) => !publicFiles.includes(name));
  const extraInPublic = publicFiles.filter((name) => !assetFiles.includes(name));

  if (missingInPublic.length > 0) {
    failures.push(`Missing files in public/stickers: ${missingInPublic.join(", ")}`);
  }
  if (extraInPublic.length > 0) {
    failures.push(`Unexpected files in public/stickers: ${extraInPublic.join(", ")}`);
  }

  if (failures.length > 0) {
    console.error(`[ERROR] ${failures.length} stickers-pages coherence failure(s):`);
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log(`[OK] check:stickers-pages passed (${assetFiles.length} sticker files).`);
}

try {
  run();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[ERROR] ${message}`);
  process.exit(2);
}
