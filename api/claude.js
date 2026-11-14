// api/claude.js
//
// Server-seitiger Proxy für die Anthropic-API.
//
// Der Browser ruft NICHT direkt api.anthropic.com auf (das würde den
// API-Key offenlegen), sondern diese Funktion auf "/api/claude". Sie läuft
// auf dem Server (z.B. als Vercel Serverless Function), liest den API-Key
// aus einer Umgebungsvariable und leitet die Anfrage an Anthropic weiter.
//
// Benötigte Umgebungsvariable (siehe .env.example und ANLEITUNG.md):
//   ANTHROPIC_API_KEY = sk-ant-...

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error:
        "Der Server ist nicht korrekt konfiguriert: ANTHROPIC_API_KEY fehlt. Bitte in den Projekteinstellungen als Umgebungsvariable hinterlegen.",
    });
    return;
  }

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(req.body),
    });

    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (err) {
    res.status(502).json({
      error: "Fehler bei der Kommunikation mit der Claude-API.",
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}
