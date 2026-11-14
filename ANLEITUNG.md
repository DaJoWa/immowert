# ImmoWert – Anleitung zur Einrichtung auf Ihrer Webseite

Diese Anleitung richtet sich an Sie als Betreiber der Webseite und führt Sie
Schritt für Schritt durch die Inbetriebnahme – auch wenn Sie kein:e
Entwickler:in sind. Geplante Zeit für die erste Inbetriebnahme: ca. 30–60
Minuten.

---

## 1. Was Sie hier erhalten

Ein vollständiges, lauffähiges Webprojekt:

- `src/App.jsx` – die komplette ImmoWert-Anwendung (7-Schritte-Formular +
  KI-Pipeline + Gutachten-Ansicht)
- `src/main.jsx`, `src/index.css`, `index.html` – Standard-Grundgerüst (Vite + React)
- `api/claude.js` – ein kleiner Server-Baustein, der die Anfragen an die
  Claude-API von Anthropic prüft und weiterleitet (für Vercel)
- `server/claudeGuard.js` – die Schutzregeln dieses Bausteins (erlaubte
  Modelle, Obergrenzen, Herkunft, Rate-Limit), siehe Abschnitt 11a
- `functions/api/claude.js` – dieselbe Funktion, nur für Cloudflare Pages
  (falls Sie das statt Vercel nutzen möchten)
- `package.json`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js` – Konfigurationsdateien
- `.env.example` – Vorlage für Ihren API-Schlüssel
- diese `ANLEITUNG.md`

**Wichtig:** Das Programm ruft die KI-Funktionen NICHT mehr direkt aus dem
Browser auf (das war in der Vorschau-Version so, funktioniert aber auf einer
echten Webseite nicht sicher). Stattdessen läuft die Anfrage über Ihren
eigenen kleinen Server-Baustein (`api/claude.js`), der Ihren Anthropic-Key
geheim hält. Das ist der einzige technische Unterschied zur Vorschau – die
Optik und alle Funktionen sind identisch.

---

## 2. Überblick: So hängt alles zusammen

```
Besucher Ihrer Website
   │
   ▼
Ihre ImmoWert-Seite (z.B. bewertung.ihre-domain.de)
   │  (Formular, Foto-Upload, Gutachten-Ansicht – läuft im Browser)
   │
   ▼
/api/claude  (kleiner Server-Baustein, läuft beim Hosting-Anbieter)
   │  (kennt Ihren geheimen API-Key, den niemand sieht)
   │
   ▼
api.anthropic.com  (die eigentliche Claude-KI)
```

Sie brauchen dafür zwei kostenlose Konten:

1. **Anthropic Console** (console.anthropic.com) – für den API-Zugang zur KI
2. **Vercel** (vercel.com) – kostenloses Hosting für die fertige Webseite
   inkl. des Server-Bausteins (Alternative: Cloudflare Pages, siehe Abschnitt 9)

---

## 3. Schritt 1: Anthropic-API-Key erstellen

1. Gehen Sie auf **console.anthropic.com** und legen Sie ein Konto an
   (E-Mail- oder Google-Login).
2. Hinterlegen Sie eine Zahlungsmethode unter **Billing** – die API wird
   nutzungsabhängig abgerechnet (siehe Kostenübersicht in Abschnitt 8).
3. Setzen Sie dort direkt ein **monatliches Ausgabenlimit** (Spend Limit).
   Das ist die wichtigste Maßnahme, um Kostenüberraschungen auszuschließen –
   z.B. 20–50 € als Startwert.
4. Gehen Sie zu **API Keys** → **Create Key** und vergeben Sie einen Namen,
   z.B. "ImmoWert Website".
5. Kopieren Sie den angezeigten Schlüssel (beginnt mit `sk-ant-...`) und
   bewahren Sie ihn sicher auf – er wird nur einmal angezeigt.

---

## 4. Schritt 2: Projekt bei Vercel veröffentlichen

Es gibt zwei Wege. Wenn Sie unsicher sind, nutzen Sie **Variante A** – sie
kommt ganz ohne Kommandozeile aus.

### Variante A: Über GitHub (empfohlen, kein Terminal nötig)

1. Legen Sie kostenlos ein Konto auf **github.com** an (falls noch nicht
   vorhanden).
2. Erstellen Sie ein neues, leeres Repository (z.B. "immowert").
3. Laden Sie über den Button **"Add file" → "Upload files"** den Inhalt
   dieses Projektordners (alle Dateien und Ordner) in das Repository hoch
   und bestätigen Sie den Upload ("Commit changes").
4. Gehen Sie auf **vercel.com**, registrieren Sie sich mit Ihrem
   GitHub-Konto und klicken Sie auf **"Add New… → Project"**.
5. Wählen Sie das eben erstellte Repository aus. Vercel erkennt automatisch,
   dass es sich um ein Vite-Projekt handelt – an den Build-Einstellungen
   müssen Sie nichts ändern.
6. **Bevor** Sie auf "Deploy" klicken: öffnen Sie "Environment Variables" und
   tragen Sie ein:
   - Name: `ANTHROPIC_API_KEY`
   - Wert: Ihr Schlüssel aus Schritt 3 (`sk-ant-...`)
7. Klicken Sie auf **Deploy**. Nach 1–2 Minuten erhalten Sie eine fertige
   Adresse, z.B. `https://immowert-xyz.vercel.app`.

Jede künftige Änderung: Datei in GitHub aktualisieren → Vercel baut die Seite
automatisch neu.

### Variante B: Direkt per Kommandozeile (schneller, ohne GitHub)

Voraussetzung: Node.js ist installiert (siehe nodejs.org, "LTS"-Version).

1. Entpacken Sie das Projekt in einen Ordner und öffnen Sie dort ein
   Terminal.
2. Führen Sie aus:
   ```
   npm install
   npx vercel
   ```
3. Folgen Sie den Anweisungen (Login bei Vercel, Projektnamen bestätigen).
4. Nach dem ersten Deploy: Tragen Sie den API-Key als Umgebungsvariable
   nach – entweder im Vercel-Dashboard (siehe Variante A, Schritt 6) oder
   per Kommandozeile:
   ```
   npx vercel env add ANTHROPIC_API_KEY
   ```
5. Für die produktive Version (eigene Adresse statt Test-Link):
   ```
   npx vercel --prod
   ```

---

## 5. Schritt 3: Eigene (Sub-)Domain einrichten

Damit die Anwendung unter Ihrer eigenen Adresse läuft (z.B.
`bewertung.ihre-domain.de`):

1. Öffnen Sie in Vercel Ihr Projekt → **Settings → Domains**.
2. Tragen Sie die gewünschte Subdomain ein, z.B. `bewertung.ihre-domain.de`.
3. Vercel zeigt Ihnen einen **CNAME-Eintrag**, den Sie bei Ihrem
   Domain-Provider (wo Sie Ihre Domain verwalten, z.B. IONOS, Strato,
   GoDaddy, Namecheap) unter "DNS-Einstellungen" anlegen müssen – meist:
   - Typ: `CNAME`
   - Name/Host: `bewertung`
   - Wert/Ziel: der von Vercel angezeigte Zielwert (z.B. `cname.vercel-dns.com`)
4. Nach einigen Minuten bis Stunden (DNS-Aktualisierung) ist die Seite unter
   `https://bewertung.ihre-domain.de` erreichbar, inklusive automatischem
   SSL-Zertifikat.

---

## 6. Schritt 4: Einbindung auf Ihrer bestehenden Webseite

Da die Anwendung jetzt auf Ihrer eigenen (Sub-)Domain läuft, haben Sie zwei
gängige Möglichkeiten, sie an Ihre bestehende Seite anzubinden – Sie
"leiten" die Besucher also selbst dorthin weiter:

**Option A – Button/Link (empfohlen):** Fügen Sie auf Ihrer bestehenden
Seite einen Button oder Menüpunkt ein, der auf
`https://bewertung.ihre-domain.de` verlinkt, z.B.:

```html
<a href="https://bewertung.ihre-domain.de" target="_self">
  Jetzt Immobilie bewerten
</a>
```

Das funktioniert mit jedem Homepage-System (WordPress, Wix, Shopify,
selbstgebaute Seiten o.ä.) und sieht für Besucher wie ein nahtloser Wechsel
innerhalb Ihrer Domain aus.

**Option B – Einbettung per iframe:** Falls die Anwendung direkt *innerhalb*
einer bestehenden Seite erscheinen soll:

```html
<iframe
  src="https://bewertung.ihre-domain.de"
  style="width: 100%; height: 1400px; border: 0;"
  title="ImmoWert Markteinschätzung"
></iframe>
```

iframes haben den Nachteil, dass die Höhe fest eingestellt werden muss und
auf manchen Plattformen (z.B. bestimmte Page-Builder) eingeschränkt sind –
Option A ist daher meist die unkompliziertere Wahl.

---

## 7. Lokal testen (optional, für technisch Versierte)

Falls Sie vor dem Deployment lokal testen möchten:

1. Node.js installieren (nodejs.org, LTS-Version).
2. Im Projektordner:
   ```
   npm install
   cp .env.example .env
   ```
3. Tragen Sie in `.env` Ihren echten API-Key ein.
4. Starten Sie die Entwicklungsumgebung inklusive der Funktion in `api/`:
   ```
   npx vercel dev
   ```
   Die Seite ist dann unter `http://localhost:3000` erreichbar – inklusive
   funktionierender KI-Pipeline über `/api/claude`. (Mit reinem
   `npm run dev` startet zwar die Oberfläche unter `http://localhost:5173`,
   aber `/api/claude` ist erst nach dem Deployment bzw. mit `vercel dev`
   aktiv.)

Für die meisten Anwendungsfälle reicht es, direkt mit Abschnitt 4
(Deployment) zu starten – ein lokaler Test ist nicht zwingend nötig.

---

## 8. Kostenübersicht

**Hosting (Vercel):** Der kostenlose "Hobby"-Plan deckt Hosting + den
Server-Baustein für geringen bis mittleren Traffic ab. Vercel weist den
Hobby-Plan primär für nicht-kommerzielle/persönliche Projekte aus – prüfen
Sie bei kommerzieller Nutzung die aktuellen Vercel-Bedingungen
(vercel.com/docs, Bereich "Plans"). Der nächste Schritt wäre der
"Pro"-Plan (aktuell ca. 20 $/Monat). Alternative mit großzügigem,
ausdrücklich auch kommerziell nutzbarem Free-Tier: **Cloudflare Pages**
(siehe Abschnitt 9) – `functions/api/claude.js` in diesem Projekt ist bereits
dafür vorbereitet.

**Claude-API (laufende Kosten, nutzungsabhängig):** Jede vollständige
Markteinschätzung durchläuft bis zu 6 KI-Schritte (Foto-Analyse,
Dokumenten-Analyse, Lage, Bausubstanz, Wertermittlung, Zusammenfassung). Bei
aktuellen Preisen für Claude Sonnet 4.6 (3 $ je 1 Mio. Eingabe-Tokens, 15 $
je 1 Mio. Ausgabe-Tokens) liegt eine einzelne Markteinschätzung je nach
Anzahl hochgeladener Fotos/Dokumente erfahrungsgemäß bei rund **0,15–0,40 €
pro Gutachten**. Bei z.B. 100 Gutachten/Monat wären das ungefähr 15–40 €.
Das in Schritt 3 gesetzte Ausgabenlimit schützt Sie vor unerwartet hohen
Rechnungen, falls die Seite stark frequentiert wird.

**Domain:** Falls noch nicht vorhanden, fallen für eine eigene Domain die
üblichen jährlichen Gebühren Ihres Domain-Anbieters an (meist 5–15 €/Jahr).

---

## 9. Alternative: Cloudflare Pages statt Vercel

Falls Sie lieber Cloudflare Pages nutzen (kostenlos, ausdrücklich auch für
kommerzielle Projekte):

1. Konto auf **dash.cloudflare.com** anlegen, Bereich **Workers & Pages**.
2. **"Create" → "Pages" → "Connect to Git"** (verbindet ein
   GitHub-Repository wie in Abschnitt 4, Variante A beschrieben).
3. Build-Einstellungen: Build command `npm run build`, Output-Verzeichnis
   `dist`.
4. Unter **Settings → Environment variables** die Variable
   `ANTHROPIC_API_KEY` mit Ihrem Schlüssel hinterlegen.
5. Cloudflare erkennt den Ordner `functions/` automatisch und stellt
   `functions/api/claude.js` unter `/api/claude` bereit – die Datei
   `api/claude.js` (für Vercel) wird dabei einfach ignoriert.
6. Eigene Domain unter **Custom domains** hinzufügen (Ablauf wie in
   Abschnitt 5).

---

## 10. Anpassungen

Alle Anpassungen erfolgen in `src/App.jsx`:

- **Farben/Branding:** Die Anwendung nutzt ein dunkles Theme mit
  Amber/Gold-Akzent (Tailwind-Klassen wie `bg-neutral-950`, `text-amber-500`).
  Für Ihre Marke ersetzen Sie diese Klassen per Suchen/Ersetzen durch Ihre
  Wunschfarben aus der Tailwind-Palette (z.B. `text-blue-500`).
- **Logo:** Im Header wird ein einfaches "I" auf amber-farbenem Quadrat
  angezeigt (`<div className="...bg-amber-500...">I</div>`). Ersetzen Sie
  den Inhalt durch ein `<img src="..." />` mit Ihrem Logo.
- **Texte/Disclaimer:** Alle sichtbaren Texte sowie der rechtliche
  Haftungsausschluss (`DISCLAIMER_TEXT`) stehen als Textkonstanten oben in
  `App.jsx` und können direkt angepasst werden.
- **Anzahl Fotos/Dokumente bzw. Kategorien:** In den Konstanten
  `PHOTO_CATEGORIES` und `DOCUMENT_CATEGORIES` lassen sich Kategorien,
  Beschriftungen und die maximale Anzahl je Kategorie (`max`) anpassen.
- **KI-Modell/Web-Suche:** In der Funktion `callClaude` sowie in den
  einzelnen Pipeline-Schritten lässt sich das Modell (`model`) oder die
  Web-Suche (`useWebSearch`) anpassen.

Nach jeder Änderung: Datei speichern, bei GitHub-Workflow hochladen (Vercel
baut automatisch neu) bzw. bei der CLI-Variante erneut `npx vercel --prod`
ausführen.

---

## 11. Sicherheit & Datenschutz – wichtige Hinweise

- Der Anthropic-API-Key steht **nur** in der Umgebungsvariable
  `ANTHROPIC_API_KEY` auf dem Server – er darf niemals in `src/App.jsx` oder
  einer anderen Frontend-Datei eingetragen werden.
- Der Endpunkt `/api/claude` ist öffentlich erreichbar (jeder, der Ihre
  Seite besucht, kann ihn technisch ansprechen). Der Server-Baustein prüft
  deshalb jede Anfrage, bevor sie an Anthropic geht (Details im nächsten
  Abschnitt 11a). Das in Schritt 3 gesetzte Ausgabenlimit bei Anthropic
  bleibt trotzdem die wichtigste Absicherung gegen Kostenüberraschungen.
- **Datenschutz/DSGVO:** Formulardaten sowie hochgeladene Fotos und
  Dokumente werden zur Auswertung an die Anthropic-API übermittelt. Für den
  Einsatz mit echten Kundendaten sollten Sie Ihre Datenschutzerklärung
  entsprechend ergänzen und die Auftragsverarbeitungsbedingungen von
  Anthropic prüfen (Unterlagen dazu finden Sie im Anthropic Trust Center
  bzw. in der Console unter "Privacy"). Diese Anleitung stellt keine
  Rechtsberatung dar.

---

## 11a. Grenzen des Server-Bausteins `/api/claude`

Der Baustein reicht Anfragen nicht mehr ungeprüft weiter. Alle Regeln stehen
an einer Stelle in `server/claudeGuard.js` und gelten gleichermaßen für
Vercel (`api/claude.js`), Cloudflare Pages (`functions/api/claude.js`) und
den Cloudflare Worker (`worker/index.js`).

| Regel | Grenze | Was passiert bei Verstoß |
|---|---|---|
| Erlaubte Modelle | `claude-sonnet-4-6`, `claude-haiku-4-5` | Ablehnung (400) |
| Antwortlänge `max_tokens` | höchstens 4096 (Standard 1000) | Wert wird auf 4096 gekürzt |
| Herkunft | nur die eigene Adresse sowie Adressen aus `ALLOWED_ORIGINS` | Ablehnung (403) |
| Rate-Limit | 30 Anfragen je IP-Adresse und Stunde (≈ 3–5 Gutachten, je nach Websuche) | Ablehnung (429) mit Wartezeit |
| Größe der Anfrage | höchstens 8 MB, 25 Bilder, 10 PDFs, 4 Nachrichten | Ablehnung (400/413) |
| Tools | nur die Websuche, höchstens 5 Suchen je Anfrage | andere Tools: Ablehnung (400) |
| Sonstige Felder | nur Modell, `max_tokens`, System-Prompt, Nachrichten, `temperature`, Websuche | werden still entfernt |

**Optionale Umgebungsvariablen** (wie `ANTHROPIC_API_KEY` in den
Projekteinstellungen hinterlegen):

- `ALLOWED_ORIGINS` – weitere erlaubte Adressen, kommagetrennt, z.B.
  `https://www.ihre-domain.de`. Nötig, wenn die App per iframe auf einer
  anderen Domain eingebettet ist (Abschnitt 6, Option B). Läuft die App
  direkt unter ihrer eigenen Adresse, brauchen Sie nichts einzutragen.
- `RATE_LIMIT_MAX` und `RATE_LIMIT_WINDOW_SECONDS` – ändern das Rate-Limit,
  z.B. `60` und `3600` für 60 Anfragen pro Stunde.

Ein anderes Modell oder eine andere Obergrenze stellen Sie in
`server/claudeGuard.js` ganz oben ein (`ALLOWED_MODELS`, `MAX_TOKENS_LIMIT`).
Wenn Sie in `src/App.jsx` ein neues Modell eintragen, muss es auch dort in
der Liste stehen, sonst lehnt der Server es ab.

**Was diese Regeln nicht leisten – bitte beachten:**

- **Die Herkunftsprüfung hält nur fremde Webseiten ab.** Ein Skript oder
  Programm kann den `Origin`-Header fälschen. Gegen gezielten Missbrauch
  helfen Rate-Limit und Ausgabenlimit, nicht die Herkunftsprüfung.
- **Das eingebaute Rate-Limit ist nur eine Bremse.** Der Zähler liegt im
  Arbeitsspeicher der laufenden Funktion. Vercel und Cloudflare starten bei
  viel Verkehr mehrere Instanzen und beenden sie nach einer Weile; jede
  zählt für sich, und nach einem Neustart beginnt der Zähler von vorn. Für
  eine verlässliche Grenze richten Sie zusätzlich eine Regel beim
  Hosting-Anbieter ein:
  - **Cloudflare:** Dashboard → Ihre Domain → Security → WAF →
    *Rate limiting rules*, Regel für den Pfad `/api/claude` (eine Regel ist
    im kostenlosen Tarif enthalten; setzt eine eigene Domain bei
    Cloudflare voraus).
  - **Vercel:** Projekt → Firewall → *Rate Limiting* bzw. eine eigene Regel
    für `/api/claude` (Umfang je nach Tarif).
- **Der System-Prompt wird nicht geprüft.** Wer die Schnittstelle direkt
  anspricht, kann innerhalb der obigen Grenzen eigene Texte an Claude
  schicken. Die Grenzen sorgen dafür, dass das nur langsam und mit kleinem
  Modell-/Token-Budget möglich ist.
- **Ausgabenlimit nicht vergessen.** Setzen Sie in der Anthropic Console ein
  monatliches Limit (Schritt 1). Es ist die einzige harte Kostengrenze.

---

## 12. Mögliche nächste Ausbaustufen

Diese Version deckt die vollständige Markteinschätzung inkl. KI-Pipeline ab
und ist bereit für den produktiven Einsatz auf Ihrer Domain. Häufig
gewünschte Erweiterungen, die sich auf dieser Basis ergänzen lassen:

- Mitgliederbereich mit Übersicht/Karte der angelegten Objekte
- Credit-/Bezahlsystem (PayPal/Kreditkarte), Mengenrabatte, Rabattcodes
- Admin-Bereich zur Verwaltung von Preisen und Rabatten

Diese Funktionen benötigen einen eigenen Nutzeraccount, eine Datenbank und
eine echte Zahlungsanbindung und würden als nächster Ausbauschritt auf genau
dem hier eingerichteten Server-Baustein aufsetzen. Sagen Sie gerne Bescheid,
wenn Sie diesen Schritt gehen möchten.

---

## 13. Troubleshooting

- **"Die Markteinschätzung konnte nicht erstellt werden":** Prüfen Sie, ob
  `ANTHROPIC_API_KEY` in den Projekteinstellungen korrekt hinterlegt ist und
  ob in der Anthropic Console noch Guthaben/Budget verfügbar ist.
- **Seite lädt, aber Klick auf "Gutachten erstellen" tut nichts:** Öffnen Sie
  die Browser-Konsole (F12 → "Konsole") und prüfen Sie auf Fehlermeldungen
  von `/api/claude` – meist deutet das auf eine fehlende oder falsche
  Umgebungsvariable hin (Abschnitt 4, Schritt 6).
- **Eigene Domain zeigt Zertifikatsfehler:** DNS-Änderungen können bis zu 24
  Stunden dauern; SSL-Zertifikate werden danach automatisch ausgestellt.

---

## Nachtrag: Cloudflare Workers (Workers Builds)

Ist das Repository mit einem Cloudflare **Worker** (nicht Pages) verbunden,
liest Cloudflare die Datei `wrangler.jsonc`. Sie baut die App mit
`npm run build` und liefert `dist/` zusammen mit dem Proxy unter
`/api/claude` aus (Einstiegspunkt `worker/index.js`, der die Logik aus
`functions/api/claude.js` nutzt).

Den API-Schlüssel hinterlegen Sie im Cloudflare-Dashboard unter
Workers & Pages → immowert → Settings → Variables and Secrets als Secret
`ANTHROPIC_API_KEY`.
