// functions/api/claude.js
//
// Alternative zu api/claude.js – falls Sie Cloudflare Pages statt Vercel
// nutzen möchten. Cloudflare Pages erkennt automatisch alles im Ordner
// "functions" und macht daraus Serverless-Funktionen
// (diese Datei -> Endpunkt "/api/claude").
//
// Wenn Sie Vercel nutzen, brauchen Sie diese Datei NICHT – dann reicht
// api/claude.js. Beide Dateien können aber parallel im Projekt bleiben,
// ohne sich zu stören.
//
// Benötigte Umgebungsvariable (in den Cloudflare-Pages-Projekteinstellungen
// unter "Settings" -> "Environment variables"):
//   ANTHROPIC_API_KEY = sk-ant-...

export async function onRequestPost(context) {
  const { request, env } = context;

  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error:
          "Der Server ist nicht korrekt konfiguriert: ANTHROPIC_API_KEY fehlt. Bitte in den Cloudflare-Projekteinstellungen als Environment Variable hinterlegen.",
      }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }

  try {
    const body = await request.text();
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body,
    });

    const data = await upstream.text();
    return new Response(data, {
      status: upstream.status,
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "Fehler bei der Kommunikation mit der Claude-API.",
        detail: err instanceof Error ? err.message : String(err),
      }),
      { status: 502, headers: { "content-type": "application/json" } }
    );
  }
}
