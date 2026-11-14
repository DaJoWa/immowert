// server/claudeGuard.js
//
// Gemeinsame Schutzregeln für den Server-Baustein "/api/claude".
// Wird von api/claude.js (Vercel) und functions/api/claude.js
// (Cloudflare Pages) verwendet, damit beide Varianten exakt dieselben
// Grenzen haben.
//
// Der Baustein reicht NICHT mehr jede Anfrage ungeprüft an Anthropic weiter,
// sondern baut eine neue, bereinigte Anfrage mit festen Grenzen:
//   1. nur Modelle aus ALLOWED_MODELS
//   2. max_tokens höchstens MAX_TOKENS_LIMIT
//   3. nur Anfragen von der eigenen Webseite (Herkunftsprüfung)
//   4. höchstens RATE_LIMIT_MAX Anfragen je IP-Adresse und Zeitfenster
//   5. Größen- und Inhaltsgrenzen (Nachrichten, Bilder, PDFs, Websuche)
//
// Die Grenzen sind bewusst als Konstanten hier oben gesammelt. Wer etwas
// ändern möchte, ändert es nur an dieser Stelle.

// --- 1. Erlaubte Modelle -------------------------------------------------
export const ALLOWED_MODELS = ["claude-sonnet-4-6", "claude-haiku-4-5"];
export const DEFAULT_MODEL = "claude-sonnet-4-6";

// --- 2. Antwortlänge -----------------------------------------------------
export const MAX_TOKENS_LIMIT = 4096;
export const DEFAULT_MAX_TOKENS = 1000;

// --- 4. Rate-Limit (je IP-Adresse) ---------------------------------------
// Ein komplettes Gutachten braucht bis zu 6 KI-Aufrufe. 30 Aufrufe pro Stunde
// erlauben also rund 5 Gutachten je Besucher und Stunde.
// Beide Werte lassen sich per Umgebungsvariable überschreiben
// (RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_SECONDS).
export const RATE_LIMIT_MAX = 30;
export const RATE_LIMIT_WINDOW_SECONDS = 60 * 60;

// --- 5. Größen- und Inhaltsgrenzen ---------------------------------------
export const MAX_BODY_BYTES = 8 * 1024 * 1024; // 8 MB
export const MAX_MESSAGES = 4;
export const MAX_IMAGES = 25; // App erlaubt max. 22 Fotos
export const MAX_DOCUMENTS = 10; // App erlaubt max. 10 PDFs
export const MAX_SYSTEM_CHARS = 20000;
export const MAX_TEXT_CHARS = 60000; // Summe aller Textblöcke
export const MAX_WEB_SEARCH_USES = 5;

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const WEB_SEARCH_TOOL_TYPE = "web_search_20250305";

// -------------------------------------------------------------------------
// Hilfsfunktionen
// -------------------------------------------------------------------------

export class GuardError extends Error {
  constructor(status, message, headers = {}) {
    super(message);
    this.status = status;
    this.headers = headers;
  }
}

// Fehlerformat wie bei Anthropic, damit die App die Meldung anzeigen kann
// (src/App.jsx liest error.message).
export function errorBody(message, type = "invalid_request_error") {
  return { type: "error", error: { type, message } };
}

function readInt(value, fallback) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

// -------------------------------------------------------------------------
// 3. Herkunftsprüfung
// -------------------------------------------------------------------------
//
// Erlaubt sind:
//   - Anfragen von derselben Adresse, unter der auch /api/claude läuft
//     (Origin-Host == Host der Anfrage), und
//   - alle Adressen aus der Umgebungsvariable ALLOWED_ORIGINS
//     (kommagetrennt, z.B. "https://bewertung.ihre-domain.de,https://www.ihre-domain.de").
// Anfragen ganz ohne Origin-Header (z.B. aus Skripten) werden abgelehnt.

export function checkOrigin({ origin, host, allowedOrigins }) {
  if (!origin) {
    throw new GuardError(403, "Zugriff verweigert: Herkunft der Anfrage fehlt.");
  }

  let originUrl;
  try {
    originUrl = new URL(origin);
  } catch {
    throw new GuardError(403, "Zugriff verweigert: ungültige Herkunft.");
  }

  const list = String(allowedOrigins || "")
    .split(",")
    .map((s) => s.trim().replace(/\/+$/, "").toLowerCase())
    .filter(Boolean);

  const normalized = originUrl.origin.toLowerCase();
  if (list.includes(normalized)) return;

  if (host && originUrl.host.toLowerCase() === String(host).toLowerCase()) return;

  throw new GuardError(403, "Zugriff verweigert: Anfrage kommt nicht von der eigenen Webseite.");
}

// -------------------------------------------------------------------------
// 4. Rate-Limit
// -------------------------------------------------------------------------
//
// Einfacher Zähler im Arbeitsspeicher der laufenden Funktion. Vercel und
// Cloudflare starten bei Bedarf mehrere Instanzen und werfen sie nach einer
// Weile wieder weg – der Zähler ist daher eine Bremse gegen grobe Ausreißer,
// keine exakte Grenze. Siehe ANLEITUNG.md, Abschnitt 11.

const buckets = new Map();

export function checkRateLimit(ip, env = {}, now = Date.now()) {
  const max = readInt(env.RATE_LIMIT_MAX, RATE_LIMIT_MAX);
  const windowMs = readInt(env.RATE_LIMIT_WINDOW_SECONDS, RATE_LIMIT_WINDOW_SECONDS) * 1000;
  const key = ip || "unbekannt";

  // Abgelaufene Einträge gelegentlich aufräumen, damit der Speicher nicht wächst.
  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }

  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;
  if (bucket.count > max) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    throw new GuardError(
      429,
      `Zu viele Anfragen. Bitte versuchen Sie es in ${Math.ceil(retryAfter / 60)} Minute(n) erneut.`,
      { "retry-after": String(retryAfter) }
    );
  }
}

// Nur für Tests.
export function _resetRateLimit() {
  buckets.clear();
}

// -------------------------------------------------------------------------
// 1., 2., 5. Anfrage prüfen und bereinigt neu aufbauen
// -------------------------------------------------------------------------
//
// Es werden nur die Felder übernommen, die die App wirklich braucht.
// Alles andere (z.B. stream, metadata, andere Tools) fällt weg.

export function sanitizeRequest(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new GuardError(400, "Ungültige Anfrage: JSON-Objekt erwartet.");
  }

  // Modell
  const model = body.model ?? DEFAULT_MODEL;
  if (!ALLOWED_MODELS.includes(model)) {
    throw new GuardError(400, `Modell nicht erlaubt. Erlaubt sind: ${ALLOWED_MODELS.join(", ")}.`);
  }

  // max_tokens: fehlend -> Standard, zu groß -> auf Obergrenze kürzen
  let maxTokens = body.max_tokens ?? DEFAULT_MAX_TOKENS;
  if (!Number.isInteger(maxTokens) || maxTokens < 1) {
    throw new GuardError(400, "Ungültiger Wert für max_tokens.");
  }
  maxTokens = Math.min(maxTokens, MAX_TOKENS_LIMIT);

  // System-Prompt
  let system;
  if (body.system !== undefined) {
    if (typeof body.system !== "string" || body.system.length > MAX_SYSTEM_CHARS) {
      throw new GuardError(400, "System-Prompt fehlt oder ist zu lang.");
    }
    system = body.system;
  }

  // Nachrichten
  const { messages } = body;
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
    throw new GuardError(400, `Es sind 1 bis ${MAX_MESSAGES} Nachrichten erlaubt.`);
  }

  const counters = { images: 0, documents: 0, textChars: 0 };
  const cleanMessages = messages.map((m) => sanitizeMessage(m, counters));

  if (counters.images > MAX_IMAGES) {
    throw new GuardError(400, `Zu viele Bilder (höchstens ${MAX_IMAGES}).`);
  }
  if (counters.documents > MAX_DOCUMENTS) {
    throw new GuardError(400, `Zu viele Dokumente (höchstens ${MAX_DOCUMENTS}).`);
  }
  if (counters.textChars > MAX_TEXT_CHARS) {
    throw new GuardError(400, "Der Text der Anfrage ist zu lang.");
  }

  const clean = { model, max_tokens: maxTokens, messages: cleanMessages };
  if (system !== undefined) clean.system = system;

  if (typeof body.temperature === "number" && body.temperature >= 0 && body.temperature <= 1) {
    clean.temperature = body.temperature;
  }

  // Tools: ausschließlich die Websuche, mit begrenzter Anzahl Suchen
  if (body.tools !== undefined) {
    if (!Array.isArray(body.tools) || body.tools.length > 1) {
      throw new GuardError(400, "Nur das Websuche-Tool ist erlaubt.");
    }
    if (body.tools.length === 1) {
      const t = body.tools[0];
      if (!t || t.type !== WEB_SEARCH_TOOL_TYPE) {
        throw new GuardError(400, "Nur das Websuche-Tool ist erlaubt.");
      }
      const requested = Number.isInteger(t.max_uses) && t.max_uses > 0 ? t.max_uses : MAX_WEB_SEARCH_USES;
      clean.tools = [
        { type: WEB_SEARCH_TOOL_TYPE, name: "web_search", max_uses: Math.min(requested, MAX_WEB_SEARCH_USES) },
      ];
    }
  }

  return clean;
}

function sanitizeMessage(m, counters) {
  if (!m || typeof m !== "object" || (m.role !== "user" && m.role !== "assistant")) {
    throw new GuardError(400, "Ungültige Nachricht.");
  }

  if (typeof m.content === "string") {
    counters.textChars += m.content.length;
    return { role: m.role, content: m.content };
  }

  if (!Array.isArray(m.content) || m.content.length === 0) {
    throw new GuardError(400, "Ungültiger Nachrichteninhalt.");
  }

  const content = m.content.map((block) => {
    if (!block || typeof block !== "object") {
      throw new GuardError(400, "Ungültiger Inhaltsblock.");
    }

    if (block.type === "text" && typeof block.text === "string") {
      counters.textChars += block.text.length;
      return { type: "text", text: block.text };
    }

    // Bilder und PDFs nur als Base64-Daten, keine externen URLs
    const src = block.source;
    const isBase64 = src && src.type === "base64" && typeof src.data === "string";

    if (block.type === "image" && isBase64 && ALLOWED_IMAGE_TYPES.includes(src.media_type)) {
      counters.images += 1;
      return { type: "image", source: { type: "base64", media_type: src.media_type, data: src.data } };
    }

    if (block.type === "document" && isBase64 && src.media_type === "application/pdf") {
      counters.documents += 1;
      return { type: "document", source: { type: "base64", media_type: "application/pdf", data: src.data } };
    }

    throw new GuardError(400, "Nicht erlaubter Inhaltstyp in der Anfrage.");
  });

  return { role: m.role, content };
}

// -------------------------------------------------------------------------
// Weiterleitung an Anthropic
// -------------------------------------------------------------------------

export async function forwardToAnthropic(cleanBody, apiKey) {
  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(cleanBody),
  });
  const text = await upstream.text();
  return { status: upstream.status, text };
}
