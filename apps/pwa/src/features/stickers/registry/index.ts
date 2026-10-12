import type { ImageSourcePropType } from "react-native";
import { resolveAppAssetUrl } from "../../../shared/pwa/appConfig";

export type StickerKey = string;

interface StickerMeta {
  key: StickerKey;
  label: string;
  source: ImageSourcePropType;
  webUri: string | null;
}

const STICKER_STAR_FALLBACK_SOURCE: ImageSourcePropType = require("@assets/stickers/default/star-sticker.png");
const STICKER_STAR_FALLBACK_KEY: StickerKey = "star-sticker";
const STICKER_STAR_FALLBACK_WEB_URI = resolveAppAssetUrl(
  "/stickers/default/star-sticker.png"
);
const STICKER_KEY_ALIASES: Record<StickerKey, StickerKey> = {
  "a-star": STICKER_STAR_FALLBACK_KEY,
  "griffin-default": "griffin-sticker",
};
const DEFAULT_PACK_NAME = "default";
const IGNORED_PACKS = new Set(["debug"]);

type StickerRequireContext = {
  keys: () => string[];
  (id: string): ImageSourcePropType;
};

type ParsedStickerAsset = {
  pack: string | null;
  fileName: string;
};

function getStickerContext(): StickerRequireContext | null {
  // Metro doit exposer require.context (activé via metro.config.js).
  if (typeof require.context !== "function") {
    if (__DEV__) {
      console.warn("[stickers] require.context indisponible: fallback star-sticker uniquement.");
    }
    return null;
  }

  try {
    // Appel direct requis pour que Metro référence correctement les assets.
    return require.context(
      "../../../../assets/stickers",
      true,
      /\.(png|jpe?g|webp)$/i
    ) as StickerRequireContext;
  } catch (error) {
    if (__DEV__) {
      console.warn("[stickers] Chargement auto des stickers impossible.", error);
    }
    return null;
  }
}

function toStickerKey(assetPath: string): StickerKey {
  return assetPath
    .replace(/^\.\//, "")
    .replace(/\.[^.]+$/, "")
    .trim()
    .toLowerCase();
}

function parseStickerAssetPath(assetPath: string): ParsedStickerAsset | null {
  const clean = assetPath.replace(/^\.\//, "").trim();
  if (!clean) return null;

  const segments = clean.split("/").filter(Boolean);
  if (segments.length === 0) return null;
  if (segments[0] && IGNORED_PACKS.has(segments[0].toLowerCase())) {
    return null;
  }

  if (segments.length === 1) {
    return { pack: null, fileName: segments[0]! };
  }

  const [pack, ...fileParts] = segments;
  if (!pack || fileParts.length === 0) return null;
  return { pack: pack.toLowerCase(), fileName: fileParts.join("/") };
}

function toStickerPublicFileName(fileName: string): string {
  const clean = fileName.trim();
  const lastDotIndex = clean.lastIndexOf(".");
  if (lastDotIndex <= 0 || lastDotIndex >= clean.length - 1) {
    return `${toStickerKey(clean)}.png`;
  }

  const base = clean.slice(0, lastDotIndex).trim();
  const ext = clean.slice(lastDotIndex + 1).trim();
  return `${base.trim().toLowerCase()}.${ext.toLowerCase()}`;
}

function toStickerKeyFromFileName(fileName: string): StickerKey {
  return fileName
    .replace(/\.[^.]+$/, "")
    .trim()
    .toLowerCase();
}

function toStickerLabel(key: StickerKey): string {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

function resolveStickerKey(key: StickerKey): StickerKey {
  return STICKER_KEY_ALIASES[key] ?? key;
}

function buildStickerWebUri(parsed: ParsedStickerAsset): string {
  const normalizedFileName = toStickerPublicFileName(parsed.fileName);
  if (parsed.pack) {
    return resolveAppAssetUrl(`/stickers/${parsed.pack}/${normalizedFileName}`);
  }
  return resolveAppAssetUrl(`/stickers/${normalizedFileName}`);
}

function buildStickerRegistry(): {
  registry: Record<StickerKey, Omit<StickerMeta, "key">>;
  fallbackKey: StickerKey;
  fallbackSource: ImageSourcePropType;
  fallbackWebUri: string | null;
} {
  const context = getStickerContext();
  if (!context) {
    return {
      registry: {},
      fallbackKey: STICKER_STAR_FALLBACK_KEY,
      fallbackSource: STICKER_STAR_FALLBACK_SOURCE,
      fallbackWebUri: STICKER_STAR_FALLBACK_WEB_URI,
    };
  }

  const registry: Record<StickerKey, Omit<StickerMeta, "key">> = {};
  let fallbackKey: StickerKey = STICKER_STAR_FALLBACK_KEY;
  let fallbackSource: ImageSourcePropType = STICKER_STAR_FALLBACK_SOURCE;
  let fallbackWebUri: string | null = STICKER_STAR_FALLBACK_WEB_URI;
  const paths = context.keys().sort((a, b) => a.localeCompare(b, "fr"));

  for (const path of paths) {
    const parsed = parseStickerAssetPath(path);
    if (!parsed) continue;

    const key = toStickerKeyFromFileName(parsed.fileName);
    if (!key) continue;

    const source = context(path);
    const webUri = buildStickerWebUri(parsed);

    if (parsed.pack === DEFAULT_PACK_NAME && key === STICKER_STAR_FALLBACK_KEY) {
      fallbackKey = key;
      fallbackSource = source;
      fallbackWebUri = webUri;
    }

    if (registry[key]) {
      if (__DEV__) {
        console.warn(`[stickers] Duplicate sticker key ignored: "${key}" (${path})`);
      }
      continue;
    }

    registry[key] = {
      label: toStickerLabel(key),
      source,
      webUri,
    };
  }

  return { registry, fallbackKey, fallbackSource, fallbackWebUri };
}

const {
  registry: STICKER_REGISTRY,
  fallbackKey: STICKER_FALLBACK_KEY,
  fallbackSource: STICKER_FALLBACK_SOURCE,
  fallbackWebUri: STICKER_FALLBACK_WEB_URI,
} = buildStickerRegistry();
const STICKER_KEYS_FROM_ASSETS = Object.keys(STICKER_REGISTRY) as StickerKey[];

export const STICKER_KEYS: readonly StickerKey[] =
  STICKER_KEYS_FROM_ASSETS.length > 0 ? STICKER_KEYS_FROM_ASSETS : [STICKER_FALLBACK_KEY];

export const DEFAULT_STICKER_KEY: StickerKey =
  STICKER_REGISTRY[STICKER_STAR_FALLBACK_KEY] ? STICKER_STAR_FALLBACK_KEY : STICKER_FALLBACK_KEY;

export const STICKER_COUNT = STICKER_KEYS.length;

export function getStickerMeta(key: StickerKey): StickerMeta | null {
  const resolvedKey = resolveStickerKey(key);
  const meta = STICKER_REGISTRY[resolvedKey];
  if (!meta) {
    return {
      key,
      label: toStickerLabel(key),
      source: STICKER_FALLBACK_SOURCE,
      webUri: STICKER_FALLBACK_WEB_URI,
    };
  }
  return { key: resolvedKey, ...meta };
}

export function getStickerSource(key: StickerKey): ImageSourcePropType | null {
  return STICKER_REGISTRY[resolveStickerKey(key)]?.source ?? STICKER_FALLBACK_SOURCE;
}

export function getStickerWebUri(key: StickerKey): string | null {
  return STICKER_REGISTRY[resolveStickerKey(key)]?.webUri ?? STICKER_FALLBACK_WEB_URI;
}

export function getStickerLabel(key: StickerKey): string {
  const resolvedKey = resolveStickerKey(key);
  return STICKER_REGISTRY[resolvedKey]?.label ?? toStickerLabel(resolvedKey);
}

export function getRandomStickerKey(): StickerKey {
  const index = Math.floor(Math.random() * STICKER_KEYS.length);
  return STICKER_KEYS[index] ?? DEFAULT_STICKER_KEY;
}

export function hasStickerImage(key: StickerKey): boolean {
  return Boolean(getStickerSource(key));
}

export type { StickerMeta };
