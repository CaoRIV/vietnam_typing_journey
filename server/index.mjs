import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { dirname, extname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { handleRoutingProxyRequest } from "./routingProxy.mjs";

const serverDirectory = dirname(fileURLToPath(import.meta.url));
const distDirectory = resolve(serverDirectory, "../dist");
const port = Number(process.env.PORT ?? 4173);
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const getStaticPath = (pathname) => {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  const relativePath = decodedPath === "/" ? "index.html" : decodedPath.slice(1);
  const candidate = resolve(distDirectory, relativePath);
  const relativeCandidate = relative(distDirectory, candidate);
  if (isAbsolute(relativeCandidate) || relativeCandidate.startsWith("..")) {
    return null;
  }
  return candidate;
};

const serveStatic = async (req, res) => {
  const requestUrl = new URL(req.url ?? "/", "http://127.0.0.1");
  let filePath = getStaticPath(requestUrl.pathname);
  if (!filePath) {
    res.statusCode = 400;
    res.end("Bad request");
    return;
  }

  try {
    await stat(filePath);
  } catch {
    if (extname(filePath)) {
      res.statusCode = 404;
      res.end("Not found");
      return;
    }
    filePath = join(distDirectory, "index.html");
  }

  try {
    const body = await readFile(filePath);
    res.statusCode = 200;
    res.setHeader(
      "content-type",
      contentTypes[extname(filePath)] ?? "application/octet-stream",
    );
    res.end(body);
  } catch {
    res.statusCode = 404;
    res.end("Not found");
  }
};

const server = createServer(async (req, res) => {
  if (await handleRoutingProxyRequest(req, res)) return;
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.statusCode = 405;
    res.setHeader("allow", "GET, HEAD");
    res.end("Method not allowed");
    return;
  }
  await serveStatic(req, res);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Go Xuyen Viet server listening on http://127.0.0.1:${port}`);
});
