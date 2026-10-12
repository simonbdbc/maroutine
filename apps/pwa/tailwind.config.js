const themeRegistry = require("./src/shared/theme/themes.json");

const THEME_SOURCE_KEYS = [
  "primary",
  "secondary",
  "grey",
  "white",
  "black",
  "success",
  "error",
  "warning",
];
const PASTEL_RATIO = 0.75;

function hexToRgba(hex, alpha) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function rgbToHex(r, g, b) {
  const toHex = (n) => Math.round(n).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function hexToPastel(hex, ratio = PASTEL_RATIO) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const pr = r + (255 - r) * ratio;
  const pg = g + (255 - g) * ratio;
  const pb = b + (255 - b) * ratio;
  return rgbToHex(pr, pg, pb);
}

function buildThemePalette(themeSource) {
  const sourceKeys = Object.keys(themeSource || {});
  const missing = THEME_SOURCE_KEYS.filter((key) => !(key in (themeSource || {})));
  const extra = sourceKeys.filter((key) => !THEME_SOURCE_KEYS.includes(key));
  if (missing.length > 0 || extra.length > 0) {
    throw new Error(
      `Invalid theme source contract (missing: ${missing.join(", ") || "none"}, extra: ${extra.join(", ") || "none"}).`,
    );
  }

  return {
    ...themeSource,
    primaryPastel: hexToPastel(themeSource.primary),
    secondaryPastel: hexToPastel(themeSource.secondary),
  };
}

const defaultTheme = buildThemePalette(themeRegistry.theme);

/** @type {import('tailwindcss').Config} */
module.exports = {
  // NativeWind v4 — scan tous les fichiers source
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      // ─── Palette principale ─────────────────────────────────────────
      colors: {
        // Palette canonique (E11-T11)
        primary: {
          DEFAULT: defaultTheme.primary,
          light: defaultTheme.primaryPastel,
          dark: defaultTheme.primary,
          pastel: defaultTheme.primaryPastel,
          muted: hexToRgba(defaultTheme.primary, 0.45),
        },
        secondary: {
          DEFAULT: defaultTheme.secondary,
          pastel: defaultTheme.secondaryPastel,
          dark: defaultTheme.warning,
        },
        // Alias legacy
        gold: {
          DEFAULT: defaultTheme.secondary,
          pastel: defaultTheme.secondaryPastel,
          dark: defaultTheme.warning,
        },
        // Moments (compat)
        morning: {
          DEFAULT: defaultTheme.primary,
          bg: defaultTheme.primaryPastel,
          border: hexToRgba(defaultTheme.primary, 0.35),
        },
        noon: {
          DEFAULT: defaultTheme.secondary,
          bg: defaultTheme.secondaryPastel,
          border: hexToRgba(defaultTheme.secondary, 0.35),
        },
        afternoon: {
          DEFAULT: defaultTheme.primary,
          bg: defaultTheme.primaryPastel,
          border: hexToRgba(defaultTheme.primary, 0.35),
        },
        evening: {
          DEFAULT: defaultTheme.secondary,
          bg: defaultTheme.secondaryPastel,
          border: hexToRgba(defaultTheme.secondary, 0.35),
        },
        grey: defaultTheme.grey,
        white: defaultTheme.white,
        black: defaultTheme.black,
        surface: defaultTheme.white,
        background: defaultTheme.white,
        border: defaultTheme.grey,
        "text-primary": defaultTheme.black,
        "text-secondary": hexToRgba(defaultTheme.black, 0.72),
        "text-muted": hexToRgba(defaultTheme.black, 0.56),
        "text-on-primary": defaultTheme.white,
        // Statuts
        success: defaultTheme.success,
        error: defaultTheme.error,
        warning: defaultTheme.warning,
      },

      // ─── Typographie ────────────────────────────────────────────────
      fontFamily: {
        fredoka: ["Fredoka_400Regular"],
        "fredoka-semi": ["Fredoka_600SemiBold"],
        "fredoka-bold": ["Fredoka_700Bold"],
      },

      fontSize: {
        "2xs": ["10px", { lineHeight: "14px" }],
        xs: ["12px", { lineHeight: "16px" }],
        sm: ["14px", { lineHeight: "20px" }],
        base: ["16px", { lineHeight: "24px" }],
        lg: ["18px", { lineHeight: "28px" }],
        xl: ["20px", { lineHeight: "28px" }],
        "2xl": ["24px", { lineHeight: "32px" }],
        "3xl": ["30px", { lineHeight: "36px" }],
        "4xl": ["36px", { lineHeight: "40px" }],
      },

      // ─── Spacing ─────────────────────────────────────────────────────
      spacing: {
        px: "1px",
        0: "0px",
        0.5: "2px",
        1: "4px",
        1.5: "6px",
        2: "8px",
        2.5: "10px",
        3: "12px",
        3.5: "14px",
        4: "16px",
        5: "20px",
        6: "24px",
        7: "28px",
        8: "32px",
        9: "36px",
        10: "40px",
        11: "44px",
        12: "48px",
        14: "56px",
        16: "64px",
        20: "80px",
        24: "96px",
        28: "112px",
        32: "128px",
      },

      // ─── Border Radius ───────────────────────────────────────────────
      borderRadius: {
        none: "0",
        sm: "4px",
        DEFAULT: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
        "3xl": "32px",
        "4xl": "40px",
        full: "9999px",
      },

      // ─── Shadows ─────────────────────────────────────────────────────
      boxShadow: {
        sm: "0 1px 2px rgba(0,0,0,0.05)",
        DEFAULT: "0 4px 6px rgba(0,0,0,0.07)",
        md: "0 6px 12px rgba(0,0,0,0.10)",
        lg: "0 10px 24px rgba(0,0,0,0.12)",
        card: "0 8px 0 rgba(0,0,0,0.05)",
        "primary-glow": `0 4px 20px ${hexToRgba(defaultTheme.primary, 0.35)}`,
        "gold-glow": `0 0 12px ${hexToRgba(defaultTheme.secondary, 0.8)}`,
      },
    },
  },
  plugins: [],
};
