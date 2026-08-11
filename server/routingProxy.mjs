const MAPBOX_BASE_URL = "https://api.mapbox.com";
const ROUTING_PREFIX = "/api/routing";
const MAX_BODY_BYTES = 64 * 1024;
const REQUEST_TIMEOUT_MS = 8_000;

const json = (res, statusCode, payload) => {
  res.statusCode = statusCode;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify(payload));
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];

    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("Request body is too large."));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });

const isCoordinate = (point) =>
  Array.isArray(point) &&
  point.length === 2 &&
  Number.isFinite(point[0]) &&
  Number.isFinite(point[1]) &&
  point[0] >= -180 &&
  point[0] <= 180 &&
  point[1] >= -90 &&
  point[1] <= 90;

const getCoordinates = (body, expectedCount) => {
  if (!Array.isArray(body?.coordinates)) {
    throw new Error("coordinates must be an array.");
  }
  if (body.coordinates.length < 2 || body.coordinates.length > 25) {
    throw new Error("coordinates must contain between 2 and 25 points.");
  }
  if (expectedCount && body.coordinates.length !== expectedCount) {
    throw new Error(`coordinates must contain exactly ${expectedCount} points.`);
  }
  if (!body.coordinates.every(isCoordinate)) {
    throw new Error("coordinates contain an invalid longitude or latitude.");
  }
  return body.coordinates;
};

const getUpstreamRequest = (path, coordinates, token) => {
  const coords = coordinates.map((point) => point.join(",")).join(";");
  const url = new URL(`${MAPBOX_BASE_URL}${path}/${coords}`);
  if (path.includes("matrix")) {
    url.searchParams.set("sources", "0");
    url.searchParams.set("annotations", "distance,duration");
  } else {
    url.searchParams.set("geometries", "geojson");
    url.searchParams.set("overview", "full");
  }
  url.searchParams.set("access_token", token);
  return url;
};

const isRoutingPath = (pathname) =>
  pathname === `${ROUTING_PREFIX}/matrix` ||
  pathname === `${ROUTING_PREFIX}/directions`;

export async function handleRoutingProxyRequest(req, res, options = {}) {
  const requestUrl = new URL(req.url ?? "/", "http://127.0.0.1");
  if (!requestUrl.pathname.startsWith(`${ROUTING_PREFIX}/`)) return false;

  if (!isRoutingPath(requestUrl.pathname)) {
    json(res, 404, { code: "not_found", message: "Unknown routing endpoint." });
    return true;
  }
  if (req.method !== "POST") {
    res.setHeader("allow", "POST");
    json(res, 405, { code: "method_not_allowed", message: "Use POST." });
    return true;
  }

  const token = options.accessToken ?? process.env.MAPBOX_ACCESS_TOKEN;
  if (!token || token.includes("replace_with_your")) {
    json(res, 200, {
      code: "routing_proxy_not_configured",
      message: "MAPBOX_ACCESS_TOKEN is not configured on the server.",
    });
    return true;
  }

  try {
    const rawBody = await readBody(req);
    const body = JSON.parse(rawBody || "{}");
    const coordinates = getCoordinates(
      body,
      requestUrl.pathname.endsWith("/directions") ? 2 : undefined,
    );
    const upstreamPath = requestUrl.pathname.endsWith("/matrix")
      ? "/directions-matrix/v5/mapbox/driving"
      : "/directions/v5/mapbox/driving";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    let response;
    try {
      response = await fetch(getUpstreamRequest(upstreamPath, coordinates, token), {
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const responseBody = await response.text();
    if (!response.ok) {
      json(res, 200, {
        code: "routing_proxy_upstream_error",
        message: "Mapbox routing request failed.",
        upstreamStatus: response.status,
      });
      return true;
    }
    res.statusCode = response.status;
    res.setHeader(
      "content-type",
      response.headers.get("content-type") ?? "application/json; charset=utf-8",
    );
    res.setHeader("cache-control", "no-store");
    res.end(responseBody);
  } catch (error) {
    json(res, 200, {
      code: "routing_proxy_error",
      message: error instanceof Error ? error.message : "Routing request failed.",
    });
  }
  return true;
}

export function registerRoutingProxy(middlewares, options = {}) {
  middlewares.use((req, res, next) => {
    const pathname = new URL(req.url ?? "/", "http://127.0.0.1").pathname;
    if (!pathname.startsWith(`${ROUTING_PREFIX}/`)) {
      next();
      return;
    }
    void handleRoutingProxyRequest(req, res, options);
  });
}
