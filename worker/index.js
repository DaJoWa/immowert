// worker/index.js
//
// Einstiegspunkt für Cloudflare Workers (Workers Builds).
// - POST /api/claude  -> Proxy zur Claude-API (Logik aus functions/api/claude.js)
// - alles andere      -> statische Dateien aus dist/ (die React-App)
//
// Der API-Schlüssel kommt aus der Variablen ANTHROPIC_API_KEY
// (Cloudflare-Dashboard: Worker "immowert" -> Settings -> Variables and Secrets).

import { onRequestPost } from "../functions/api/claude.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/claude") {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
          status: 405,
          headers: { "content-type": "application/json", allow: "POST" },
        });
      }
      return onRequestPost({ request, env, ctx });
    }

    return env.ASSETS.fetch(request);
  },
};
