// Tests für die Schutzregeln. Ausführen mit: npm test
import test from "node:test";
import assert from "node:assert/strict";
import {
  GuardError,
  MAX_TOKENS_LIMIT,
  RATE_LIMIT_MAX,
  _resetRateLimit,
  checkOrigin,
  checkRateLimit,
  sanitizeRequest,
} from "./claudeGuard.js";

const ok = (extra = {}) => ({
  model: "claude-sonnet-4-6",
  max_tokens: 1000,
  system: "Du bist Gutachter.",
  messages: [{ role: "user", content: [{ type: "text", text: "Hallo" }] }],
  ...extra,
});

const status = (fn) => {
  try {
    fn();
  } catch (e) {
    assert.ok(e instanceof GuardError, e.message);
    return e.status;
  }
  return 200;
};

test("normale App-Anfrage geht durch", () => {
  const clean = sanitizeRequest(ok({ tools: [{ type: "web_search_20250305", name: "web_search" }] }));
  assert.equal(clean.model, "claude-sonnet-4-6");
  assert.equal(clean.tools[0].max_uses, 5);
});

test("fremdes Modell wird abgelehnt", () => {
  assert.equal(status(() => sanitizeRequest(ok({ model: "claude-opus-4-1" }))), 400);
});

test("max_tokens wird auf Obergrenze gekürzt", () => {
  assert.equal(sanitizeRequest(ok({ max_tokens: 100000 })).max_tokens, MAX_TOKENS_LIMIT);
  assert.equal(status(() => sanitizeRequest(ok({ max_tokens: -5 }))), 400);
});

test("unbekannte Felder und Tools fallen weg bzw. werden abgelehnt", () => {
  const clean = sanitizeRequest(ok({ stream: true, metadata: { user_id: "x" } }));
  assert.equal(clean.stream, undefined);
  assert.equal(clean.metadata, undefined);
  assert.equal(status(() => sanitizeRequest(ok({ tools: [{ type: "bash_20250124", name: "bash" }] }))), 400);
});

test("Bilder per URL und zu viele Bilder werden abgelehnt", () => {
  const urlImg = { type: "image", source: { type: "url", url: "https://example.com/a.jpg" } };
  assert.equal(status(() => sanitizeRequest(ok({ messages: [{ role: "user", content: [urlImg] }] }))), 400);
  const img = { type: "image", source: { type: "base64", media_type: "image/jpeg", data: "AAAA" } };
  const many = Array.from({ length: 26 }, () => img);
  assert.equal(status(() => sanitizeRequest(ok({ messages: [{ role: "user", content: many }] }))), 400);
});

test("Herkunft: gleiche Domain und ALLOWED_ORIGINS erlaubt, sonst 403", () => {
  assert.equal(status(() => checkOrigin({ origin: "https://bewertung.de", host: "bewertung.de" })), 200);
  assert.equal(
    status(() => checkOrigin({ origin: "https://www.seite.de", host: "x.vercel.app", allowedOrigins: "https://www.seite.de/" })),
    200
  );
  assert.equal(status(() => checkOrigin({ origin: "https://boese.de", host: "bewertung.de" })), 403);
  assert.equal(status(() => checkOrigin({ origin: undefined, host: "bewertung.de" })), 403);
});

test("Rate-Limit greift nach RATE_LIMIT_MAX Anfragen und setzt sich zurück", () => {
  _resetRateLimit();
  const t0 = 1_000_000;
  for (let i = 0; i < RATE_LIMIT_MAX; i++) checkRateLimit("1.2.3.4", {}, t0);
  assert.equal(status(() => checkRateLimit("1.2.3.4", {}, t0)), 429);
  assert.equal(status(() => checkRateLimit("5.6.7.8", {}, t0)), 200);
  assert.equal(status(() => checkRateLimit("1.2.3.4", {}, t0 + 3600_000 + 1)), 200);
  _resetRateLimit();
  checkRateLimit("9.9.9.9", { RATE_LIMIT_MAX: "1" }, t0);
  assert.equal(status(() => checkRateLimit("9.9.9.9", { RATE_LIMIT_MAX: "1" }, t0)), 429);
});

test("Fortsetzung nach pause_turn mit Websuche-Blöcken geht durch", () => {
  const tools = [{ type: "web_search_20250305", name: "web_search" }];
  const assistant = {
    role: "assistant",
    content: [
      { type: "text", text: "Ich suche…", citations: null },
      { type: "server_tool_use", id: "srvtoolu_1", name: "web_search", input: { query: "Bodenrichtwert" } },
      { type: "web_search_tool_result", tool_use_id: "srvtoolu_1", content: [] },
    ],
  };
  const messages = [ok().messages[0], assistant];
  const clean = sanitizeRequest(ok({ tools, messages }));
  assert.equal(clean.messages[1].content[1].type, "server_tool_use");
  // ohne Websuche oder in einer user-Nachricht nicht erlaubt
  assert.equal(status(() => sanitizeRequest(ok({ messages }))), 400);
  const fake = { role: "user", content: [assistant.content[1]] };
  assert.equal(status(() => sanitizeRequest(ok({ tools, messages: [fake] }))), 400);
});
