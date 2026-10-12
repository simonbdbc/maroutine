const Module = require("node:module");
const path = require("node:path");

const originalResolveFilename = Module._resolveFilename;
const assetsDirectory = path.resolve(__dirname, "../assets");
const compiledAliases = new Map([
  ["@features", "src/features"],
  ["@navigation", "src/navigation"],
  ["@shared", "src/shared"],
]);

global.__DEV__ = false;

Module._resolveFilename = function resolveFilename(request, parent, isMain, options) {
  if (request.startsWith("@assets/")) {
    return path.join(assetsDirectory, request.slice("@assets/".length));
  }

  for (const [alias, directory] of compiledAliases) {
    if (request === alias || request.startsWith(`${alias}/`)) {
      const compiledRoot = findCompiledTestRoot(parent?.filename);
      if (compiledRoot) {
        const suffix = request === alias ? "" : request.slice(alias.length + 1);
        const target = path.join(compiledRoot, directory, suffix);
        return originalResolveFilename.call(this, target, parent, isMain, options);
      }
    }
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};

for (const extension of [".gif", ".jpeg", ".jpg", ".png", ".webp"]) {
  require.extensions[extension] = (module, filename) => {
    module.exports = filename;
  };
}

function findCompiledTestRoot(filename) {
  if (!filename) return null;
  const marker = `${path.sep}dist${path.sep}`;
  const markerIndex = filename.indexOf(marker);
  if (markerIndex < 0) return null;
  const rootEnd = filename.indexOf(path.sep, markerIndex + marker.length);
  return rootEnd < 0 ? null : filename.slice(0, rootEnd);
}
