import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(rootDir, "dist");
const port = readPort(process.argv.slice(2));
const appBasePath = "/app";

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "application/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".ttf", "font/ttf"],
  [".txt", "text/plain; charset=utf-8"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".xml", "application/xml; charset=utf-8"],
]);

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  const pathname = decodeURIComponent(requestUrl.pathname);
  const requestedPath = path.resolve(distDir, `.${pathname}`);

  if (!requestedPath.startsWith(`${distDir}${path.sep}`) && requestedPath !== distDir) {
    response.writeHead(403).end();
    return;
  }

  let filePath = pathname === "/" ? path.join(distDir, "index.html") : requestedPath;
  if (!(await isFile(filePath))) {
    const isPwaRoute = pathname === appBasePath || pathname.startsWith(`${appBasePath}/`);
    if (isPwaRoute && !path.extname(pathname)) {
      filePath = path.join(distDir, "app/index.html");
    } else {
      response.writeHead(404).end();
      return;
    }
  }

  applyHeaders(response, pathname, filePath);
  response.writeHead(200);
  if (request.method === "HEAD") {
    response.end();
    return;
  }
  createReadStream(filePath).pipe(response);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Maroutine preview available at http://127.0.0.1:${port}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}

function applyHeaders(response, pathname, filePath) {
  response.setHeader(
    "Content-Type",
    contentTypes.get(path.extname(filePath)) ?? "application/octet-stream",
  );
  response.setHeader("X-Content-Type-Options", "nosniff");

  if (pathname === `${appBasePath}/service-worker.js`) {
    response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    response.setHeader("Service-Worker-Allowed", `${appBasePath}/`);
    return;
  }
  if ([`${appBasePath}/pwa-build.json`, `${appBasePath}/version.json`].includes(pathname)) {
    response.setHeader("Cache-Control", "no-store, max-age=0");
    return;
  }
  if (
    pathname.startsWith(`${appBasePath}/_expo/static/`) ||
    /\.[a-f0-9]{16,}\./i.test(path.basename(filePath))
  ) {
    response.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    return;
  }
  response.setHeader("Cache-Control", "no-cache");
}

async function isFile(filePath) {
  try {
    return (await stat(filePath)).isFile();
  } catch {
    return false;
  }
}

function readPort(args) {
  const index = args.indexOf("--port");
  const value = index >= 0 ? Number(args[index + 1]) : Number(process.env.PORT ?? 4173);
  if (!Number.isInteger(value) || value < 1 || value > 65_535) {
    throw new Error(`Invalid port: ${String(args[index + 1] ?? process.env.PORT)}`);
  }
  return value;
}
