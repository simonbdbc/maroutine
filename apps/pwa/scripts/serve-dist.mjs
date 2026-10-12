import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";

const projectRoot = path.resolve(".");
const distDir = path.join(projectRoot, "dist");
const appBasePath = normalizeBasePath(process.env.EXPO_PUBLIC_APP_BASE_PATH);
const port = readPort(process.argv.slice(2));

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
  [".webmanifest", "application/manifest+json; charset=utf-8"],
]);

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  const pathname = decodeURIComponent(requestUrl.pathname);
  if (pathname === "/" && appBasePath !== "/") {
    response.writeHead(302, { Location: `${appBasePath}/` }).end();
    return;
  }
  if (
    appBasePath !== "/" &&
    pathname !== appBasePath &&
    !pathname.startsWith(`${appBasePath}/`)
  ) {
    response.writeHead(404).end();
    return;
  }
  const relativePath = appBasePath === "/" ? pathname : pathname.slice(appBasePath.length) || "/";
  const requestedPath = path.resolve(distDir, `.${relativePath}`);

  if (!requestedPath.startsWith(`${distDir}${path.sep}`) && requestedPath !== distDir) {
    response.writeHead(403).end();
    return;
  }

  let filePath = relativePath === "/" ? path.join(distDir, "index.html") : requestedPath;
  if (!(await isFile(filePath))) {
    if (path.extname(relativePath)) {
      response.writeHead(404).end();
      return;
    }
    filePath = path.join(distDir, "index.html");
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
  console.log(`PWA preview available at http://127.0.0.1:${port}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}

function applyHeaders(response, pathname, filePath) {
  response.setHeader(
    "Content-Type",
    contentTypes.get(path.extname(filePath)) ?? "application/octet-stream"
  );
  response.setHeader("X-Content-Type-Options", "nosniff");

  if (pathname === appPath("/service-worker.js")) {
    response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    response.setHeader("Service-Worker-Allowed", appPath("/"));
    return;
  }
  if ([appPath("/pwa-build.json"), appPath("/version.json")].includes(pathname)) {
    response.setHeader("Cache-Control", "no-store, max-age=0");
    return;
  }
  if ([appPath("/manifest.webmanifest"), appPath("/offline.html")].includes(pathname)) {
    response.setHeader("Cache-Control", "no-cache, must-revalidate");
    return;
  }
  if (
    pathname.startsWith(appPath("/_expo/static/")) ||
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

function normalizeBasePath(value) {
  const normalized = String(value || "/app").trim();
  if (!normalized || normalized === "/") return "/";
  return `/${normalized.replace(/^\/+|\/+$/g, "")}`;
}

function appPath(relativePath = "/") {
  const nextPath = relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
  return appBasePath === "/" ? nextPath : `${appBasePath}${nextPath}`;
}
