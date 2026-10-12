// Transformation logic adapted from Astro 5.18.2 (MIT).
// See ../../THIRD-PARTY-NOTICES/Astro-LICENSE for the original notices.
// Keep Astro validation/URL methods; only adapt its Sharp constructor policy.
import upstream from "astro/assets/services/sharp";
let sharp;
const qualityTable = { low: 25, mid: 50, high: 80, max: 100 };
const fitMap = { fill: "fill", contain: "inside", cover: "cover", none: "outside", "scale-down": "inside", outside: "outside", inside: "inside" };
function parseQuality(quality) {
  const parsed = parseInt(quality);
  return Number.isNaN(parsed) ? quality : parsed;
}
export default {
  ...upstream,
  async transform(inputBuffer, transformOptions, config) {
    if (!sharp) {
      try {
        sharp = (await import("sharp")).default;
        sharp.cache(false);
      } catch {
        // Preserve Astro's structured MissingSharp error in optional installs.
        return upstream.transform(inputBuffer, transformOptions, config);
      }
    }
    const transform = transformOptions;
    const kernel = config.service.config.kernel;
    if (transform.format === "svg") return { data: inputBuffer, format: "svg" };
    const result = sharp(inputBuffer, {
      failOn: "none",
      pages: -1,
      limitInputPixels: config.service.config.limitInputPixels
    });
    result.rotate();
    const { format } = await result.metadata();
    const withoutEnlargement = Boolean(transform.fit);
    if (transform.width && transform.height && transform.fit) {
      const fit = fitMap[transform.fit] ?? "inside";
      result.resize({
        width: Math.round(transform.width),
        height: Math.round(transform.height),
        kernel,
        fit,
        position: transform.position,
        withoutEnlargement
      });
    } else if (transform.height && !transform.width) {
      result.resize({
        height: Math.round(transform.height),
        kernel,
        withoutEnlargement
      });
    } else if (transform.width) {
      result.resize({
        width: Math.round(transform.width),
        kernel,
        withoutEnlargement
      });
    }
    if (transform.background) {
      result.flatten({ background: transform.background });
    }
    if (transform.format) {
      let quality = void 0;
      if (transform.quality) {
        const parsedQuality = parseQuality(transform.quality);
        if (typeof parsedQuality === "number") {
          quality = parsedQuality;
        } else {
          quality = transform.quality in qualityTable ? qualityTable[transform.quality] : void 0;
        }
      }
      if (transform.format === "webp" && format === "gif") {
        result.webp({ quality: typeof quality === "number" ? quality : void 0, loop: 0 });
      } else {
        result.toFormat(transform.format, { quality });
      }
    }
    const { data, info } = await result.toBuffer({ resolveWithObject: true });
    const needsCopy = "buffer" in data && data.buffer instanceof SharedArrayBuffer;
    return {
      data: needsCopy ? new Uint8Array(data) : data,
      format: info.format
    };
  },
};
