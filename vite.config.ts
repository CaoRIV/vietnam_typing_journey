import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";

// The same-origin proxy keeps the Mapbox server token out of browser requests.
// @ts-expect-error The native Node proxy is intentionally a JavaScript module.
import { registerRoutingProxy } from "./server/routingProxy.mjs";

const routingProxyPlugin = (accessToken?: string): Plugin => ({
  name: "routing-proxy",
  configureServer(server) {
    registerRoutingProxy(server.middlewares, { accessToken });
  },
  configurePreviewServer(server) {
    registerRoutingProxy(server.middlewares, { accessToken });
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const accessToken = env.MAPBOX_ACCESS_TOKEN ?? env.VITE_MAPBOX_ACCESS_TOKEN;

  return {
    plugins: [routingProxyPlugin(accessToken), react(), tailwindcss()],
    optimizeDeps: {
      exclude: ["mapbox-gl", "mapbox-gl/esm"],
    },
    worker: {
      format: "es",
    },
    server: {
      host: "127.0.0.1",
      port: 5173,
    },
    preview: {
      host: "127.0.0.1",
      port: 4173,
    },
  };
});
