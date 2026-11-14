// functions/api/claude.js
//
// Alternative zu api/claude.js – falls Sie Cloudflare Pages statt Vercel
// nutzen möchten. Cloudflare Pages erkennt automatisch alles im Ordner
// "functions" und macht daraus Serverless-Funktionen
// (diese Datei -> Endpunkt "/api/claude").
//
// Wenn Sie Vercel nutzen, brauchen Sie diese Datei NICHT – dann reicht
// api/claude.js. Beide Dateien können aber parallel im Projekt bleiben,
// ohne sich zu stören. Beide nutzen dieselben Schutzregeln aus
// server/claudeGuard.js (erlaubte Modelle, max_tokens, Herkunft,
// Rate-Limit, Größen).
//
// Umgebungsvariablen (Cloudflare-Pages-Projekteinstellungen unter
// "Settings" -> "Environment variables"):
//   ANTHROPIC_API_KEY = sk-ant-...          (Pflicht)
//   ALLOWED_ORIGINS   = https://...         (optional, kommagetrennt)
//   RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_SECONDS (optional)

import {
  GuardError,
  MAX_BODY_BYTES,
  checkOrigin,
  checkRateLimit,
  errorBody,
  forwardToAnthropic,
  sanitizeRequest,
} from "../../server/claudeGuard.js";

function json(status, payload, headers = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return json(
      500,
      errorBody(
        "Der Server ist nicht korrekt konfiguriert: ANTHROPIC_API_KEY fehlt. Bitte in den Cloudflare-Projekteinstellungen als Environment Variable hinterlegen.",
        "api_error"
      )
    );
  }

  let clean;
  try {
    checkOrigin({
      origin: request.headers.get("origin"),
      host: new URL(request.url).host,
      allowedOrigins: env.ALLOWED_ORIGINS,
    });

    const length = Number(request.headers.get("content-length") || 0);
    if (length > MAX_BODY_BYTES) {
      throw new GuardError(413, "Die Anfrage ist zu groß.");
    }

    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      throw new GuardError(413, "Die Anfrage ist zu groß.");
    }

    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      throw new GuardError(400, "Ungültige Anfrage: kein gültiges JSON.");
    }

    checkRateLimit(request.headers.get("cf-connecting-ip") || "", env);
    clean = sanitizeRequest(body);
  } catch (err) {
    if (err instanceof GuardError) {
      return json(
        err.status,
        errorBody(err.message, err.status === 429 ? "rate_limit_error" : "invalid_request_error"),
        err.headers
      );
    }
    throw err;
  }

  try {
    const { status, text } = await forwardToAnthropic(clean, apiKey);
    return new Response(text, { status, headers: { "content-type": "application/json" } });
  } catch (err) {
    console.error("Claude-API nicht erreichbar:", err);
    return json(502, errorBody("Fehler bei der Kommunikation mit der Claude-API.", "api_error"));
  }
}

// Alle anderen Methoden (GET, PUT, ...) ablehnen.
export async function onRequest() {
  return json(405, errorBody("Nur POST ist erlaubt."), { allow: "POST" });
}
