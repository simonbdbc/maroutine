#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const projectRoot = process.cwd();
const minNode = { major: 20, minor: 19, patch: 5 };
const requiredEnvKeys = [
  "EXPO_PUBLIC_SUPABASE_URL",
  "EXPO_PUBLIC_SUPABASE_ANON_KEY",
];
const optionalEnvKeys = [
  "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID",
  "EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID",
  "EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID",
  "EXPO_PUBLIC_APP_ENV",
  "EXPO_PUBLIC_APP_URL",
  "EXPO_PUBLIC_CREATOR_CONTACT_EMAIL",
];

const envFiles = [
  ".env",
  ".env.local",
  ".env.production",
  ".env.production.local",
];
const shellDefinedKeys = new Set(Object.keys(process.env));

for (const file of envFiles) {
  const fullPath = path.join(projectRoot, file);
  if (!fs.existsSync(fullPath)) {
    continue;
  }
  const raw = fs.readFileSync(fullPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const delimiter = trimmed.indexOf("=");
    if (delimiter <= 0) {
      continue;
    }
    const key = trimmed.slice(0, delimiter).trim();
    let value = trimmed.slice(delimiter + 1).trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!shellDefinedKeys.has(key)) {
      process.env[key] = value;
    }
  }
}

function parseNodeVersion(input) {
  const [major, minor, patch] = input.split(".").map((part) => Number(part));
  return { major: major || 0, minor: minor || 0, patch: patch || 0 };
}

function isVersionAtLeast(current, minimum) {
  if (current.major !== minimum.major) {
    return current.major > minimum.major;
  }
  if (current.minor !== minimum.minor) {
    return current.minor > minimum.minor;
  }
  return current.patch >= minimum.patch;
}

function looksLikePlaceholder(value) {
  const placeholderPatterns = [
    /^your-/i,
    /xxxxxxxxxxxx\.supabase\.co/i,
    /\.\.\.$/,
    /^change-me$/i,
  ];
  return placeholderPatterns.some((pattern) => pattern.test(value));
}

const currentNode = parseNodeVersion(process.versions.node);
if (!isVersionAtLeast(currentNode, minNode)) {
  console.error(
    `Node ${process.versions.node} detecte. Version minimale requise: ${minNode.major}.${minNode.minor}.${minNode.patch}.`
  );
  process.exit(1);
}

const missing = [];
const invalid = [];

for (const key of requiredEnvKeys) {
  const value = (process.env[key] || "").trim();
  if (!value) {
    missing.push(key);
    continue;
  }
  if (looksLikePlaceholder(value)) {
    invalid.push(key);
  }
}

if (missing.length || invalid.length) {
  if (missing.length) {
    console.error(`Variables manquantes: ${missing.join(", ")}`);
  }
  if (invalid.length) {
    console.error(`Variables placeholders detectees: ${invalid.join(", ")}`);
  }
  console.error("Renseigne les variables dans .env.local ou .env.production.");
  process.exit(1);
}

const optionalMissing = optionalEnvKeys.filter(
  (key) => !(process.env[key] || "").trim()
);

if (optionalMissing.length) {
  console.warn(
    `Variables optionnelles absentes: ${optionalMissing.join(", ")}`
  );
}

console.log("Validation env web prod OK.");
