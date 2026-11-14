// api/claude.js
//
// Server-seitiger Proxy für die Anthropic-API (Vercel Serverless Function).
//
// Der Browser ruft NICHT direkt api.anthropic.com auf (das würde den
// API-Key offenlegen), sondern diese Funktion auf "/api/claude". Sie liest
// den API-Key aus einer Umgebungsvariable, prüft die Anfrage (erlaubte
// Modelle, max_tokens, Herkunft, Rate-Limit, Größen) und leitet nur eine
// bereinigte Anfrage an Anthropic weiter. Die Regeln stehen in
// server/claudeGuard.js und gelten genauso für Cloudflare Pages.
//
// Umgebungsvariablen (siehe .env.example und ANLEITUNG.md):
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
} from "../server/claudeGuard.js";

function clientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd) return fwd.split(",")[0].trim();
  return req.headers["x-real-ip"] || req.socket?.remoteAddress || "";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("allow", "POST");
    res.status(405).json(errorBody("Nur POST ist erlaubt."));
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json(
      errorBody(
        "Der Server ist nicht korrekt konfiguriert: ANTHROPIC_API_KEY fehlt. Bitte in den Projekteinstellungen als Umgebungsvariable hinterlegen.",
        "api_error"
      )
    );
    return;
  }

  let clean;
  try {
    checkOrigin({
      origin: req.headers.origin,
      host: req.headers["x-forwarded-host"] || req.headers.host,
      allowedOrigins: process.env.ALLOWED_ORIGINS,
    });

    const length = Number(req.headers["content-length"] || 0);
    if (length > MAX_BODY_BYTES) {
      throw new GuardError(413, "Die Anfrage ist zu groß.");
    }

    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        throw new GuardError(400, "Ungültige Anfrage: kein gültiges JSON.");
      }
    }

    checkRateLimit(clientIp(req), process.env);
    clean = sanitizeRequest(body);
  } catch (err) {
    if (err instanceof GuardError) {
      for (const [k, v] of Object.entries(err.headers)) res.setHeader(k, v);
      res.status(err.status).json(errorBody(err.message, err.status === 429 ? "rate_limit_error" : "invalid_request_error"));
      return;
    }
    throw err;
  }

  try {
    const { status, text } = await forwardToAnthropic(clean, apiKey);
    res.status(status).setHeader("content-type", "application/json").send(text);
  } catch (err) {
    console.error("Claude-API nicht erreichbar:", err);
    res.status(502).json(errorBody("Fehler bei der Kommunikation mit der Claude-API.", "api_error"));
  }
}
