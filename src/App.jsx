import React, { useState, useRef, useCallback, useMemo } from "react";
import {
  Home,
  MapPin,
  Building2,
  Sparkles,
  Scale,
  Image as ImageIcon,
  FileCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  AlertCircle,
  AlertTriangle,
  X,
  FileText,
  Printer,
  RefreshCw,
  Search,
  Plus,
} from "lucide-react";

/* =========================================================================
   OPTIONSLISTEN (abgeleitet aus dem bestehenden ImmoWert-Datenmodell)
   ========================================================================= */

const OBJEKTARTEN = [
  "Einfamilienhaus (freistehend)",
  "Doppelhaushälfte",
  "Reihenhaus",
  "Zweifamilienhaus / Mehrfamilienhaus",
  "Etagenwohnung",
  "Maisonettewohnung",
  "Penthouse / Dachgeschosswohnung",
  "Souterrain-/Kellerwohnung",
  "Wohn- und Geschäftshaus",
];

const LAGETYPEN = [
  "Stadtzentrum / Innenstadt",
  "Stadtrand / Randlage",
  "Ortszentrum (kleinere Stadt / Dorf)",
  "Ruhige Wohnlage",
  "Gehobene Wohnlage",
  "Einfache Wohnlage",
  "Mischgebiet (Wohnen und Gewerbe)",
  "Gewerbegebiet / Industriegebiet",
  "Ländliche Lage",
  "Alleinlage / sehr abgelegene Lage",
];

const MAKROLAGEN = [
  "Großstadtlage mit sehr guter Infrastruktur",
  "Großstadtlage mit guter Infrastruktur",
  "Mittelstadtlage mit guter Infrastruktur",
  "Kleinstadtlage mit ausreichender Infrastruktur",
  "Ländliche Lage mit guter Anbindung an ein Zentrum",
  "Ländliche Lage mit eingeschränkter Infrastruktur",
  "Periphere / strukturschwache Region",
  "Wohnlage in wirtschaftlich starkem Ballungsraum",
  "Wohnlage im Speckgürtel einer Großstadt",
  "Wohnlage in wirtschaftlich schwächerer Region",
];

const ERSCHLIESSUNG = [
  "voll erschlossen",
  "weitgehend erschlossen",
  "teilweise erschlossen",
  "nicht erschlossen",
];

const BPLAN = [
  "Allgemeines Wohngebiet (WA)",
  "Reines Wohngebiet (WR)",
  "Besonderes Wohngebiet (WB)",
  "Dorfgebiet (MD)",
  "Mischgebiet (MI)",
  "Kerngebiet (MK)",
  "Gewerbegebiet (GE)",
  "Industriegebiet (GI)",
  "Sondergebiet (SO)",
  "Kein qualifizierter B-Plan / unbeplanter Innenbereich",
  "Laut Unterlagen nicht eindeutig erkennbar",
];

const MIKROLAGEN = [
  "Ruhiges Wohngebiet",
  "Gepflegtes Wohngebiet",
  "Wohngebiet in einfacher Lage",
  "Lage an einer stärker befahrenen Straße",
  "Verkehrsberuhigte Lage / Spielstraße",
  "Wohnlage nahe Grünflächen / Park",
  "Zentrumsnahe Wohnlage",
  "Lage mit sehr guter Nahversorgung (Einkauf etc.)",
  "Mikrolage mit erhöhter Lärmbelastung",
  "Gute Anbindung an den überregionalen Straßenverkehr",
  "Durchschnittliche Anbindung an den überregionalen Straßenverkehr",
  "Periphere Lage mit eher ungünstiger Verkehrsanbindung",
  "Sehr gute Versorgung mit Einkaufsmöglichkeiten, Schulen und Ärzten",
  "Ausreichende Versorgung mit Einkaufsmöglichkeiten, Schulen und Ärzten",
  "Eingeschränkte Versorgung mit Einkaufsmöglichkeiten, Schulen und Ärzten",
  "Region mit tendenziell wachsender Bevölkerungszahl",
  "Region mit weitgehend stabiler Bevölkerungsentwicklung",
  "Region mit tendenziell rückläufiger Bevölkerungszahl",
];

const AUSSENANLAGEN = [
  "Gepflegte Außenanlagen",
  "Durchschnittlich gepflegte Außenanlagen",
  "Einfache / ungepflegte Außenanlagen",
  "Großzügiger Garten",
  "Kleiner Garten / Hofbereich",
  "Terrasse mit Garten",
  "Balkon- und Terrassenflächen vorhanden",
  "Garten mit altem Baumbestand",
  "Garten mit überwiegend Rasenfläche",
  "Garten mit überwiegend befestigten Flächen",
  "Professionell angelegte Gartenanlage",
  "Naturbelassene Gartenanlage",
  "Innenhof / Gemeinschaftshof",
  "Gemeinschaftsgarten / Gemeinschaftsaußenanlagen",
  "Kinderspielbereich / Spielplatz auf dem Grundstück",
  "Einfriedung durch Zaun / Hecke",
  "Garage(n) auf dem Grundstück",
  "Carport(s) auf dem Grundstück",
  "Zufahrts- und Wegeflächen befestigt",
  "Stellplätze auf dem Grundstück",
  "Außenanlagen modernisierungsbedürftig",
  "Außenanlagen sanierungsbedürftig",
];

const BAUWEISEN = [
  "Massivbauweise",
  "Massivbauweise (mit Wärmedämmverbundsystem)",
  "Betonbauweise",
  "Skelettbauweise (Stahl / Beton)",
  "Holzrahmenbauweise",
  "Holztafelbauweise",
  "Blockbohlenbauweise / Blockhaus",
  "Fertigbauweise (Holz)",
  "Fertigbauweise (Massiv)",
  "Mischbauweise (Massiv / Holz)",
  "Mischbauweise (Massiv / Stahl)",
  "Leichtbauweise",
  "Fachwerkbauweise (sichtbar)",
  "Fachwerkbauweise (überputzt)",
];

const DACHFORMEN = [
  "Satteldach",
  "Walmdach",
  "Krüppelwalmdach",
  "Zeltdach",
  "Pultdach",
  "Flachdach",
  "Sheddach",
  "Mansarddach",
  "Tonnendach",
  "Schleppdach",
  "Halbwalmdach",
  "Kombination aus Sattel- und Flachdach",
  "Kombination aus Pult- und Flachdach",
  "Sonstige besondere Dachform",
];

const CONDITION_SCALE = [
  "Sehr guter Zustand (neuwertig)",
  "Guter Zustand (kein akuter Instandhaltungsbedarf)",
  "Durchschnittlicher Zustand (üblicher Instandhaltungsstau)",
  "Einfache Ausführung / altersentsprechender Zustand",
  "Instandhaltungsbedürftig (kurz-/mittelfristiger Handlungsbedarf)",
  "Sanierungsbedürftig (erheblicher Handlungsbedarf)",
  "Akut schadhaft / stark reparaturbedürftig",
  "Zustand unbekannt / keine belastbare Aussage möglich",
];

const HEIZUNGSARTEN = [
  "Gas-Zentralheizung",
  "Öl-Zentralheizung",
  "Fernwärme / Nahwärme",
  "Wärmepumpe (Luft-Wasser)",
  "Wärmepumpe (Sole-Wasser / Erdsonden)",
  "Wärmepumpe (Wasser-Wasser)",
  "Elektroheizung (Nachtspeicher / Direktheizung)",
  "Pelletheizung",
  "Hackschnitzelheizung",
  "Scheitholzheizung",
  "Etagenheizung (Gas)",
  "Etagenheizung (Strom)",
  "Fußbodenheizung (als Hauptheizung)",
  "Ofenheizung (Einzelöfen, z.B. Kohle/Holz)",
  "Hybridheizung (Kombination aus mehreren Systemen)",
  "Keine feste Heizung / unbeheizt",
];

const OVERALL_CONDITION_SCALE = [
  "Sehr guter Gesamtzustand (nahezu neuwertig)",
  "Guter Gesamtzustand (kein wesentlicher Instandhaltungsbedarf)",
  "Überwiegend durchschnittlicher Gesamtzustand",
  "Insgesamt altersentsprechender Gesamtzustand",
  "Insgesamt instandhaltungsbedürftig (kurz-/mittelfristiger Handlungsbedarf)",
  "Insgesamt sanierungsbedürftig (erheblicher Handlungsbedarf)",
  "Stark erneuerungsbedürftiger / wirtschaftlich überalterter Gesamtzustand",
  "Gesamtzustand kritisch / akut schadhaft",
  "Gesamtzustand nicht abschließend beurteilbar",
];

const AUSSTATTUNG_SCALE = [
  "Sehr einfache Ausstattung",
  "Einfache Ausstattung",
  "Einfache bis mittlere Ausstattung",
  "Mittlere / durchschnittliche Ausstattung",
  "Mittlere bis gute Ausstattung",
  "Gute Ausstattung",
  "Gute bis gehobene Ausstattung",
  "Gehobene Ausstattung",
  "Gehobene bis hochwertige Ausstattung",
  "Hochwertige Ausstattung",
  "Hochwertige / luxuriöse Ausstattung",
  "Luxuriöse Ausstattung",
];

const BODENBELAEGE = [
  "Parkett",
  "Massivholz-Dielen",
  "Laminat",
  "Vinyl / Designboden",
  "Linoleum",
  "PVC-Belag",
  "Teppichboden",
  "Fliesen",
  "Naturstein (z.B. Marmor, Granit, Schiefer)",
  "Betonboden (sichtbar)",
  "Estrich (sichtbar / unbelegt)",
  "Korkboden",
  "Industrie-/Gussasphaltboden",
  "Holzdielen (Altbau, aufgearbeitet)",
  "Mischbelag / verschiedene Bodenbeläge in den Räumen",
  "Bodenbeläge überwiegend erneuerungsbedürftig",
];

const SANITAER_OPTIONEN = [
  "Badezimmer mit Wanne",
  "Badezimmer mit Dusche",
  "Badezimmer mit Wanne und Dusche",
  "Gäste-WC vorhanden",
  "Separates WC (zusätzlich zum Bad)",
  "Duschbad (Standard)",
  "Duschbad mit bodengleicher Dusche",
  "Tageslichtbad",
  "Innenliegendes Bad (ohne Fenster)",
];

const KUECHENARTEN = [
  "Keine Einbauküche vorhanden",
  "Einfache Einbauküche (älter)",
  "Einfache Einbauküche (zeitgemäß)",
  "Einbauküche mittleren Standards",
  "Einbauküche gehobenen Standards",
  "Hochwertige / designorientierte Einbauküche",
  "Pantryküche / Kochnische",
  "Wohnküche (Essen und Kochen kombiniert)",
  "Offene Küche zum Wohnbereich",
  "Mehrere Küchen im Objekt (z.B. je Einheit)",
];

const KUECHEN_ZUSTAND_SCALE = [
  "Sehr guter Zustand (nahezu neuwertig)",
  "Guter Zustand (kein akuter Erneuerungsbedarf)",
  "Durchschnittlicher Zustand (gebrauchter, altersentsprechender Zustand)",
  "Einfache, ältere Küche in funktionsfähigem Zustand",
  "Modernisierungsbedürftige Küchenausstattung",
  "Sanierungsbedürftige / stark abgewohnte Küchenausstattung",
  "Keine Aussage möglich / Zustand unbekannt",
];

const SONDERAUSSTATTUNG = [
  "Kamin / Ofen",
  "Klimaanlage / Kühlsystem",
  "Luxuriöses Bad",
  "Sauna / Wellnessbereich",
  "Barrierearme / barrierefreie Ausstattung",
  "Professionell angelegte Gartenanlage",
  "Pool / Schwimmteich",
  "Wintergarten",
  "Panoramablick (z.B. Fernblick, Seeblick, Stadtblick)",
  "Lüftungsanlage mit Wärmerückgewinnung",
  "Photovoltaik-Anlage",
  "Solarthermie-Anlage",
  "Wallbox / E-Auto-Ladestation",
  "Smarthome-System (Licht, Heizung, Sicherheit etc.)",
  "Alarmanlage / Kameraüberwachung",
  "Hochwertige Fenster (3-fach-Verglasung, Schallschutz)",
  "Fußbodenheizung",
];

const RENOVATION_AGE_SCALE = [
  "neu (unter 5 Jahre alt)",
  "sehr gut (ca. 5–10 Jahre alt)",
  "gut (ca. 10–20 Jahre alt)",
  "befriedigend (ca. 20–30 Jahre alt)",
  "alt, aber funktionsfähig (ca. 30–50 Jahre alt)",
  "sehr alt / sanierungsbedürftig (älter als ca. 50 Jahre)",
  "Alter unbekannt / nicht genau bestimmbar",
];

const RECHTE_LASTEN = [
  "Keine besonderen Rechte oder Lasten bekannt",
  "Grunddienstbarkeit (z.B. Wegerecht)",
  "Grunddienstbarkeit (Leitungsrecht / Leitungsführung)",
  "Wohnrecht / lebenslanges Wohnrecht",
  "Nießbrauchrecht",
  "Erbbaurecht",
  "Reallast",
  "Baulast (z.B. Abstandsflächenbaulast)",
  "Überbau / Duldung eines Überbaus",
  "Geh-, Fahr- und Leitungsrecht",
  "Leitungsrecht zugunsten Dritter (Strom, Wasser, Gas, Telekommunikation)",
  "Wegerecht zugunsten Dritter",
  "Wegerecht zugunsten des Grundstücks",
  "Nutzungsbeschränkungen laut Baulastverzeichnis",
  "Altlastenverdacht / Eintragung im Altlastenkataster",
  "Erschließungsbeiträge noch offen / zu erwarten",
  "Sanierungsgebiet / städtebauliche Entwicklungsmaßnahme",
  "Ertragsmindernde Miet- oder Pachtverträge (z.B. langfristig unter Marktniveau)",
  "Sonstige im Grundbuch eingetragene Rechte und Lasten",
  "Besondere Rechte/Lasten unbekannt / nicht geprüft",
];

const VERKAUFSZEITRAUM = [
  "0–6 Monate",
  "6–12 Monate",
  "1–3 Jahre",
  "> 3 Jahre",
  "> 10 Jahre",
  "noch unklar",
  "nicht verkaufen",
];

const NUTZERZIELE = [
  "Verkauf zeitnah",
  "Verkauf mittelfristig",
  "Vermietung",
  "Selbstnutzung",
  "Noch unklar",
];

const KELLER_OPTIONEN = [
  "Kein Keller",
  "Teilkeller",
  "Vollkeller (unbeheizt / Lagerkeller)",
  "Vollkeller (ausgebaut / beheizt)",
  "Keller unbekannt",
];

const JANEIN = ["Ja", "Nein", "Nicht bekannt / nicht geprüft"];

/* =========================================================================
   FELDDEFINITIONEN
   ========================================================================= */

const FIELD_GROUPS = {
  eckdaten: [
    { key: "name", label: "Name", type: "text", width: "half", required: true, placeholder: "Vor- und Nachname" },
    { key: "email", label: "E-Mail", type: "email", width: "half", required: true, placeholder: "name@beispiel.de" },
    { key: "telefon", label: "Telefon", type: "text", width: "half", placeholder: "optional" },
    { key: "objektart", label: "Objektart", type: "select", width: "half", required: true, options: OBJEKTARTEN },
    { key: "strasse", label: "Straße und Hausnummer", type: "text", width: "full", required: true, placeholder: "z.B. Musterstraße 14" },
    { key: "plz", label: "PLZ", type: "text", width: "half", required: true, placeholder: "z.B. 41836" },
    { key: "ort", label: "Ort", type: "text", width: "half", required: true, placeholder: "z.B. Hückelhoven" },
    { key: "baujahr", label: "Baujahr", type: "number", width: "half", required: true, placeholder: "z.B. 1985" },
    { key: "wohnflaeche", label: "Wohnfläche", type: "number", width: "half", required: true, unit: "m²" },
    { key: "grundstuecksflaeche", label: "Grundstücksfläche", type: "number", width: "half", required: true, unit: "m²" },
    { key: "zimmer", label: "Zimmer", type: "number", width: "half" },
    { key: "schlafzimmer", label: "Schlafzimmer", type: "number", width: "half" },
    { key: "badezimmer", label: "Badezimmer", type: "number", width: "half" },
    { key: "etagen", label: "Etagen", type: "number", width: "half" },
    { key: "keller", label: "Keller", type: "select", width: "half", options: KELLER_OPTIONEN },
    { key: "stellplaetze", label: "Stellplätze / Garagen", type: "number", width: "half" },
    { key: "sanierungshistorie", label: "Sanierungs- und Modernisierungshistorie", type: "textarea", width: "full", placeholder: "z.B. 2017 Küche erneuert, 2020 Fenster getauscht, Dach 1995 neu eingedeckt …" },
  ],
  lage: [
    { key: "lagetyp", label: "Lagetyp", type: "select", width: "half", options: LAGETYPEN },
    { key: "makrolage", label: "Makrolage", type: "select", width: "half", options: MAKROLAGEN },
    { key: "erschliessung", label: "Erschließung", type: "select", width: "half", options: ERSCHLIESSUNG },
    { key: "bplan", label: "Bebauungsplan / Gebietstyp", type: "select", width: "half", options: BPLAN },
    { key: "mikrolage", label: "Mikrolage (Mehrfachauswahl)", type: "multiselect", width: "full", options: MIKROLAGEN },
    { key: "aussenanlagen", label: "Außenanlagen (Mehrfachauswahl)", type: "multiselect", width: "full", options: AUSSENANLAGEN },
  ],
  bausubstanz: [
    { key: "bauweise", label: "Bauweise", type: "select", width: "half", options: BAUWEISEN },
    { key: "dachform", label: "Dachform", type: "select", width: "half", options: DACHFORMEN },
    { key: "zustand_fassade", label: "Zustand Fassade / Außenwände", type: "select", width: "half", options: CONDITION_SCALE },
    { key: "zustand_dach", label: "Zustand Dach", type: "select", width: "half", options: CONDITION_SCALE },
    { key: "zustand_fenster", label: "Zustand Fenster", type: "select", width: "half", options: CONDITION_SCALE },
    { key: "heizungsart", label: "Heizungsart", type: "select", width: "half", options: HEIZUNGSARTEN },
    { key: "heizung_baujahr", label: "Baujahr der Heizung", type: "number", width: "half", placeholder: "optional" },
    { key: "zustand_heizung", label: "Zustand Heizung", type: "select", width: "half", options: CONDITION_SCALE },
    { key: "energiekennwert", label: "Energiekennwert (kWh/(m²·a))", type: "number", width: "half", placeholder: "optional, laut Energieausweis" },
    { key: "gesamtzustand", label: "Gesamtzustand des Gebäudes", type: "select", width: "half", options: OVERALL_CONDITION_SCALE },
    { key: "maengel", label: "Bekannte Mängel / Schäden", type: "textarea", width: "full", placeholder: "z.B. feuchter Keller, Risse im Sockelbereich, undichtes Fenster im Bad …" },
  ],
  ausstattung: [
    { key: "ausstattungsniveau", label: "Ausstattungsniveau", type: "select", width: "half", options: AUSSTATTUNG_SCALE },
    { key: "kueche", label: "Küchenart", type: "select", width: "half", options: KUECHENARTEN },
    { key: "zustand_kueche", label: "Zustand der Küche", type: "select", width: "half", options: KUECHEN_ZUSTAND_SCALE },
    { key: "zustand_sanitaer", label: "Alter der Sanitärausstattung", type: "select", width: "half", options: RENOVATION_AGE_SCALE },
    { key: "bodenbelaege", label: "Bodenbeläge (Mehrfachauswahl)", type: "multiselect", width: "full", options: BODENBELAEGE },
    { key: "sanitaer", label: "Sanitärausstattung (Mehrfachauswahl)", type: "multiselect", width: "full", options: SANITAER_OPTIONEN },
    { key: "sonderausstattung", label: "Sonderausstattung (Mehrfachauswahl)", type: "multiselect", width: "full", options: SONDERAUSSTATTUNG },
  ],
  recht: [
    { key: "denkmalschutz", label: "Denkmalschutz", type: "select", width: "half", options: JANEIN },
    { key: "nutzerziel", label: "Ihr Ziel", type: "select", width: "half", options: NUTZERZIELE },
    { key: "verkaufszeitraum", label: "Geplanter Zeitraum", type: "select", width: "half", options: VERKAUFSZEITRAUM },
    { key: "angebotspreis", label: "Angebots- bzw. Wunschpreis", type: "number", width: "half", unit: "€", placeholder: "optional" },
    { key: "immoscout_link", label: "Link zum Inserat (z.B. ImmoScout24)", type: "text", width: "full", placeholder: "optional, https://…" },
    { key: "rechte_lasten", label: "Rechte und Lasten (Mehrfachauswahl)", type: "multiselect", width: "full", options: RECHTE_LASTEN },
    { key: "notizen", label: "Sonstige Anmerkungen", type: "textarea", width: "full", placeholder: "Alles, was sonst noch wichtig ist …" },
  ],
};

const ALL_FIELDS_BY_KEY = Object.values(FIELD_GROUPS)
  .flat()
  .reduce((acc, f) => {
    acc[f.key] = f;
    return acc;
  }, {});

const STEPS = [
  { id: "eckdaten", label: "Eckdaten", short: "Eckdaten", icon: Home },
  { id: "lage", label: "Lage", short: "Lage", icon: MapPin },
  { id: "bausubstanz", label: "Bausubstanz", short: "Bausubstanz", icon: Building2 },
  { id: "ausstattung", label: "Ausstattung", short: "Ausstattung", icon: Sparkles },
  { id: "recht", label: "Recht & Ziel", short: "Recht & Ziel", icon: Scale },
  { id: "medien", label: "Fotos & Unterlagen", short: "Medien", icon: ImageIcon },
  { id: "gutachten", label: "Markteinschätzung", short: "Gutachten", icon: FileCheck },
];

const REQUIRED_FIELDS = [
  "name",
  "email",
  "objektart",
  "strasse",
  "plz",
  "ort",
  "baujahr",
  "wohnflaeche",
  "grundstuecksflaeche",
];

const LAGE_KEYS = [
  "objektart",
  "baujahr",
  "wohnflaeche",
  "grundstuecksflaeche",
  "lagetyp",
  "makrolage",
  "mikrolage",
  "erschliessung",
  "bplan",
  "aussenanlagen",
  "denkmalschutz",
  "rechte_lasten",
  "nutzerziel",
];

const BAU_KEYS = [
  "objektart",
  "baujahr",
  "wohnflaeche",
  "sanierungshistorie",
  "bauweise",
  "dachform",
  "zustand_fassade",
  "zustand_dach",
  "zustand_fenster",
  "heizungsart",
  "heizung_baujahr",
  "zustand_heizung",
  "energiekennwert",
  "gesamtzustand",
  "maengel",
  "ausstattungsniveau",
  "kueche",
  "zustand_kueche",
  "zustand_sanitaer",
  "bodenbelaege",
  "sanitaer",
  "sonderausstattung",
];

const WERT_KEYS = [
  "objektart",
  "baujahr",
  "wohnflaeche",
  "grundstuecksflaeche",
  "bauweise",
  "gesamtzustand",
  "ausstattungsniveau",
  "angebotspreis",
  "nutzerziel",
];

/* =========================================================================
   HILFSFUNKTIONEN
   ========================================================================= */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function formatEUR(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "–";
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function todayDE() {
  return new Date().toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function genGutachtenId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `IW-${part()}-${part()}`;
}

function addressLine(formData) {
  const parts = [];
  if (formData.strasse) parts.push(formData.strasse);
  const plzOrt = [formData.plz, formData.ort].filter(Boolean).join(" ");
  if (plzOrt) parts.push(plzOrt);
  return parts.join(", ");
}

function fieldSummary(formData, keys) {
  const lines = [];
  for (const key of keys) {
    const field = ALL_FIELDS_BY_KEY[key];
    if (!field) continue;
    const value = formData[key];
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value) && value.length === 0) continue;

    let display = Array.isArray(value) ? value.join(", ") : String(value);
    if (field.unit) display += ` ${field.unit}`;
    lines.push(`${field.label}: ${display}`);
  }
  return lines.join("\n");
}

// Bild verkleinern & als JPEG-Base64 (für Bildanalyse via Claude Vision)
function resizeImageToBase64(file, maxDim = 1280, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      URL.revokeObjectURL(url);
      resolve(dataUrl.split(",")[1]);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

// Datei (z.B. PDF) als Base64 einlesen
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Obergrenze der Antwortlänge (Ausgabe-Tokens) je Pipeline-Schritt.
// Deutsche Texte brauchen grob 2 Tokens pro Wort. Die Grenzen liegen deutlich
// über den Wortvorgaben der System-Prompts, damit Antworten nicht mitten im
// Satz abbrechen. Die Wertermittlung braucht zusätzlich Platz für die Websuche.
const MAX_TOKENS = {
  photos: 1500,
  documents: 1500,
  lage: 2000,
  bau: 2000,
  wert: 4000,
  fazit: 2000,
};

// Wie oft eine wegen langer Websuche pausierte Antwort (stop_reason "pause_turn")
// höchstens fortgesetzt wird.
const MAX_PAUSE_CONTINUATIONS = 3;

async function postToClaude(body) {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let detail = "";
    try {
      const errJson = await res.json();
      detail = errJson?.error?.message || "";
    } catch (e) {
      /* ignore */
    }
    throw new Error(`API-Fehler (${res.status})${detail ? `: ${detail}` : ""}`);
  }

  return res.json();
}

// Aufruf der Claude-API über unseren eigenen Server-Proxy (siehe /api/claude.js).
// So bleibt der Anthropic-API-Key sicher auf dem Server und taucht nie im Browser auf.
//
// Rückgabe: { text, truncated }. truncated ist true, wenn die Antwort wegen der
// Längengrenze (stop_reason "max_tokens") abgebrochen wurde oder nach mehreren
// Fortsetzungen immer noch pausiert war – der Text ist dann unvollständig.
async function callClaude({ system, content, useWebSearch = false, maxTokens = 2000 }) {
  const userMessage = { role: "user", content };
  let assistantContent = [];
  let stopReason = null;

  for (let attempt = 0; attempt <= MAX_PAUSE_CONTINUATIONS; attempt++) {
    const body = {
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens,
      system,
      messages:
        assistantContent.length > 0
          ? [userMessage, { role: "assistant", content: assistantContent }]
          : [userMessage],
    };
    if (useWebSearch) {
      body.tools = [{ type: "web_search_20250305", name: "web_search" }];
    }

    const data = await postToClaude(body);
    assistantContent = [...assistantContent, ...(data.content || [])];
    stopReason = data.stop_reason;

    // Bei "pause_turn" hat der Server die Websuche unterbrochen. Die bisherige
    // Antwort wird unverändert zurückgeschickt, dann setzt das Modell fort.
    if (stopReason !== "pause_turn") break;
  }

  const text = assistantContent
    .filter((b) => b.type === "text" && typeof b.text === "string")
    .map((b) => b.text)
    .join("\n")
    .trim();

  const truncated = stopReason === "max_tokens" || stopReason === "pause_turn";

  if (!text) {
    throw new Error(
      truncated
        ? "Die Antwort hat die Längengrenze erreicht, bevor Text erzeugt wurde."
        : "Leere Antwort vom Modell erhalten."
    );
  }
  return { text, truncated };
}

/* =========================================================================
   SYSTEM-PROMPTS FÜR DIE KI-PIPELINE
   ========================================================================= */

const PHOTO_SYSTEM_PROMPT = `Du bist ein erfahrener Bausachverständiger. Du erhältst Fotos einer Immobilie.
Beschreibe ausschließlich, was auf den Fotos tatsächlich sichtbar ist – insbesondere bauliche Mängel, Schäden, Verschleiß, Modernisierungsbedarf sowie der Zustand von Fassade, Dach, Fenstern, Innenräumen, Böden, Bädern und Technik, soweit erkennbar.
Spekuliere nicht über nicht sichtbare Bereiche. Wenn auf den Fotos keine nennenswerten Mängel erkennbar sind, sage das ebenfalls klar.
Schreibe in zusammenhängenden Sätzen, ohne Markdown, ohne Aufzählungszeichen, ohne Überschriften.
Antworte auf Deutsch in maximal 220 Wörtern.`;

const DOC_SYSTEM_PROMPT = `Du bist Bausachverständiger und Experte für Immobiliendokumente. Du erhältst hochgeladene Dokumente (z.B. Energieausweis, Grundbuchauszug, Baubeschreibung, Wohnflächenberechnung, Grundrisse, Baugenehmigung).
Extrahiere ausschließlich wertermittlungsrelevante Fakten, z.B.: Energiekennwert und Energieeffizienzklasse, Baujahr, Wohn- und Grundstücksflächen, Belastungen in Abteilung II/III des Grundbuchs, eingetragene Rechte und Lasten, besondere Auflagen sowie weitere für eine Marktwerteinschätzung relevante Angaben.
Nenne nur Fakten, die tatsächlich in den Dokumenten stehen – keine Vermutungen. Wenn ein Dokument keine relevanten Informationen enthält, erwähne das kurz.
Schreibe in zusammenhängenden Sätzen ohne Markdown, ohne Aufzählungszeichen.
Antworte auf Deutsch in maximal 180 Wörtern.`;

const LAGE_SYSTEM_PROMPT = `Du bist Bausachverständiger und analysierst die Lage- und Rechtssituation einer Immobilie für eine Marktwerteinschätzung. Du erhältst strukturierte Objektdaten.

Erstelle einen Fließtext mit GENAU zwei Abschnitten. Jeder Abschnitt beginnt mit einer Überschrift in GROSSBUCHSTABEN (reiner Text, kein Markdown, kein "#", kein "*"), gefolgt von einer Leerzeile:

LAGEEINSCHÄTZUNG
Beschreibe Makro- und Mikrolage, Infrastruktur, Erschließung und Bebauungsplan-Situation sowie deren Bedeutung für Nachfrage und Wert. Gehe konkret auf Ort und Adresse ein.

RECHTLICHE RAHMENBEDINGUNGEN
Beschreibe Denkmalschutz sowie eingetragene Rechte und Lasten und ordne deren mögliche Auswirkungen auf Wert und Verwertbarkeit ein.

Schreibe sachlich, professionell und in vollständigen Sätzen ohne Aufzählungszeichen, ohne Markdown.
Antworte auf Deutsch in maximal 380 Wörtern.`;

const BAU_SYSTEM_PROMPT = `Du bist Bauingenieur und analysierst Bausubstanz, Haustechnik und Ausstattung einer Immobilie für eine Marktwerteinschätzung. Du erhältst strukturierte Objektdaten sowie ggf. Auswertungen von Fotos und Dokumenten.

Erstelle einen Fließtext mit GENAU drei Abschnitten. Jeder Abschnitt beginnt mit einer Überschrift in GROSSBUCHSTABEN (reiner Text, kein Markdown), gefolgt von einer Leerzeile:

BAUWEISE UND KONSTRUKTION
Beschreibe Bauweise, Dachform sowie Zustand von Fassade, Dach und Fenstern und ordne dies dem Baujahr zu.

HAUSTECHNIK UND ENERGIE
Beschreibe Heizungsart, deren Alter und Zustand sowie den energetischen Stand. Prüfe, ob die Heizungsart die Anforderungen des Gebäudeenergiegesetzes (GEG) absehbar erfüllt oder ob mittelfristig eine Austauschpflicht droht. Ordne den Energiekennwert ein, falls angegeben.

AUSSTATTUNG UND MODERNISIERUNGSBEDARF
Beschreibe Ausstattungsniveau, Küche, Sanitärbereiche, Bodenbeläge und Sonderausstattung. Berücksichtige bekannte Mängel sowie ggf. die Foto- und Dokumentenauswertung. Schätze am Ende dieses Abschnitts realistisch einen Instandsetzungs- und Modernisierungsrückstand in Euro als Spanne (z.B. "15.000–25.000 €") und begründe diese Spanne kurz.

Schreibe sachlich und professionell in vollständigen Sätzen ohne Aufzählungszeichen, ohne Markdown.
Antworte auf Deutsch in maximal 450 Wörtern.`;

const WERT_SYSTEM_PROMPT = `Du bist Wertermittlungsexperte und arbeitest nach den Grundsätzen der Immobilienwertermittlungsverordnung (ImmoWertV). Du erhältst strukturierte Objektdaten und ggf. eine Dokumentenauswertung. Du hast Zugriff auf eine Websuche.

Erstelle einen Fließtext mit GENAU vier Abschnitten. Jeder Abschnitt beginnt mit einer Überschrift in GROSSBUCHSTABEN (reiner Text, kein Markdown), gefolgt von einer Leerzeile:

BODENWERT
Recherchiere per Websuche den aktuellen amtlichen Bodenrichtwert (€/m²) für die angegebene Adresse, z.B. über die Bodenrichtwert-Portale der Bundesländer (BORIS). Nenne die gefundene Quelle. Wenn kein konkreter Wert auffindbar ist, gib eine begründete eigene Schätzung an und kennzeichne diese deutlich als "eigene Schätzung". Berechne den Bodenwert als Grundstücksfläche × Bodenrichtwert und zeige die Rechnung.

SACHWERT
Ermittle die Normalherstellungskosten (NHK 2010) je m² Wohnfläche (üblicherweise zwischen ca. 1.000 und 2.300 €/m², abhängig von Objektart, Baujahr, Bauweise und Ausstattungsniveau), wende einen Regionalfaktor zwischen 0,9 und 1,2 an und berücksichtige eine lineare Alterswertminderung über eine Gesamtnutzungsdauer von 80 Jahren. Zeige die Rechenschritte (Herstellungskosten, Regionalfaktor, Alterswertminderung, Bodenwertanteil) und nenne den resultierenden Sachwert.

VERGLEICHSWERT
Recherchiere per Websuche aktuelle Quadratmeterpreise für vergleichbare Immobilien in der Region und berechne daraus einen Vergleichswert (Wohnfläche × €/m²). Nenne die Quelle bzw. kennzeichne als eigene Schätzung, falls keine Daten auffindbar sind.

MARKTWERTEINSCHÄTZUNG
Fasse Bodenwert, Sachwert und Vergleichswert zu einer plausiblen Marktwertspanne zusammen und nenne einen empfohlenen Wert innerhalb dieser Spanne. Falls ein Angebotspreis angegeben wurde, ordne diesen im Vergleich zur ermittelten Spanne ein. Weise klar darauf hin, dass es sich um eine automatisierte Einschätzung ohne Objektbesichtigung handelt.

Schreibe sachlich und professionell in vollständigen Sätzen ohne Aufzählungszeichen, ohne Markdown.
Antworte auf Deutsch in maximal 480 Wörtern.`;

const FAZIT_SYSTEM_PROMPT = `Du bist der leitende Sachverständige und fasst eine Marktwerteinschätzung für den Auftraggeber zusammen. Du erhältst die bisherigen Analysen zu Lage, Bausubstanz und Wertermittlung sowie das Ziel des Nutzers.

Erstelle einen Fließtext mit GENAU drei Abschnitten. Jeder Abschnitt beginnt mit einer Überschrift in GROSSBUCHSTABEN (reiner Text, kein Markdown), gefolgt von einer Leerzeile:

GESAMTEINSCHÄTZUNG
Fasse die wesentlichen wertbestimmenden Faktoren (Lage, Zustand, Marktwert) in 3-4 Sätzen zusammen.

CHANCEN UND RISIKEN
Nenne die wichtigsten Chancen und Risiken für das Objekt und seine Vermarktung bzw. Nutzung.

HANDLUNGSEMPFEHLUNG
Gib eine konkrete, auf das angegebene Ziel des Nutzers (Verkauf, Vermietung, Selbstnutzung o.ä.) zugeschnittene Empfehlung für die nächsten Schritte.

WICHTIG: Schreibe KEINEN Haftungsausschluss und keine rechtlichen Hinweise – diese werden separat ergänzt.
Schreibe sachlich, klar und für Laien verständlich, in vollständigen Sätzen ohne Aufzählungszeichen, ohne Markdown.
Antworte auf Deutsch in maximal 320 Wörtern.`;

const DISCLAIMER_TEXT = `Diese Markteinschätzung wurde mithilfe eines KI-gestützten Analyseverfahrens auf Basis der von Ihnen angegebenen Daten sowie der von Ihnen hochgeladenen Fotos und Dokumente erstellt. Sie stellt KEIN Verkehrswertgutachten im Sinne des § 194 Baugesetzbuch (BauGB) und der Immobilienwertermittlungsverordnung (ImmoWertV) dar und wurde nicht von einem öffentlich bestellten und vereidigten Sachverständigen erstellt.

Es hat keine Besichtigung der Immobilie vor Ort stattgefunden. Alle Angaben zu Zustand, Ausstattung und Mängeln beruhen ausschließlich auf Ihren Angaben sowie der automatisierten Auswertung der von Ihnen bereitgestellten Fotos und Unterlagen. Bodenrichtwerte und Vergleichspreise wurden – soweit nicht anders gekennzeichnet – automatisiert recherchiert oder geschätzt und können von amtlich festgestellten Werten abweichen.

Die genannten Wertspannen sind eine unverbindliche Orientierungshilfe und ersetzen keine rechtsverbindliche Wertermittlung. Für Kauf-, Verkaufs-, Finanzierungs- oder sonstige rechtlich bedeutsame Entscheidungen empfehlen wir dringend, einen öffentlich bestellten und vereidigten Sachverständigen oder den zuständigen Gutachterausschuss zu beauftragen.

Eine Haftung für die Richtigkeit, Vollständigkeit und Aktualität der Angaben sowie der ermittelten Werte wird nicht übernommen.`;

const PIPELINE_META = [
  { id: "photos", label: "Fotoanalyse", description: "Sichtbare Mängel und Bauzustand anhand der Fotos" },
  { id: "documents", label: "Dokumentenanalyse", description: "Wertrelevante Fakten aus den hochgeladenen Unterlagen" },
  { id: "lage", label: "Lage & Recht", description: "Makro-/Mikrolage, Erschließung, Rechte und Lasten" },
  { id: "bau", label: "Bausubstanz & Technik", description: "Bauweise, Haustechnik, GEG-Check, Ausstattung" },
  { id: "wert", label: "Wertermittlung", description: "Bodenwert, Sachwert, Vergleichswert, Marktwert (mit Websuche)" },
  { id: "fazit", label: "Zusammenfassung", description: "Gesamteinschätzung, Chancen & Risiken, Empfehlung" },
];

/* =========================================================================
   FOTO- UND DOKUMENTENKATEGORIEN
   ========================================================================= */

const PHOTO_CATEGORIES = [
  { id: "aussen_vorne", label: "Außenansicht (Straßenseite)", hint: "Frontalansicht des Gebäudes", max: 3 },
  { id: "aussen_hinten", label: "Außenansicht (Rückseite / Garten)", hint: "Rückseite, Garten, Terrasse", max: 3 },
  { id: "wohnbereich", label: "Wohn- und Essbereich", hint: "Wohnzimmer, Essbereich", max: 3 },
  { id: "kueche", label: "Küche", hint: "", max: 2 },
  { id: "bad", label: "Bad / Sanitärbereich", hint: "", max: 2 },
  { id: "weitere_raeume", label: "Weitere Zimmer", hint: "Schlafzimmer, Flur, Arbeitszimmer …", max: 3 },
  { id: "keller_technik", label: "Keller / Technik / Heizung", hint: "Heizungsanlage, Keller, Dachboden", max: 3 },
  { id: "maengel", label: "Mängel, Schäden & Details", hint: "Nahaufnahmen von Schäden oder Auffälligkeiten", max: 3 },
];

const DOCUMENT_CATEGORIES = [
  { id: "energieausweis", label: "Energieausweis", hint: "", max: 2 },
  { id: "grundbuchauszug", label: "Grundbuchauszug", hint: "Abteilung I–III", max: 2 },
  { id: "grundrisse", label: "Grundrisse / Baupläne", hint: "", max: 2 },
  { id: "baubeschreibung", label: "Baubeschreibung", hint: "", max: 2 },
  { id: "sonstige", label: "Weitere Unterlagen", hint: "z.B. Wohnflächenberechnung, Teilungserklärung", max: 2 },
];

const PHOTO_CATEGORY_MAX_TOTAL = PHOTO_CATEGORIES.reduce((sum, c) => sum + c.max, 0);
const DOCUMENT_CATEGORY_MAX_TOTAL = DOCUMENT_CATEGORIES.reduce((sum, c) => sum + c.max, 0);


/* =========================================================================
   UI-BAUSTEINE: FORMULARFELDER
   ========================================================================= */

const inputClass =
  "w-full rounded-lg bg-neutral-800 border border-neutral-700 px-3 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition";

const labelClass = "block text-sm font-medium text-neutral-300 mb-1.5";

function FieldRenderer({ field, value, onChange }) {
  const wrapperClass = cx(field.width === "full" ? "md:col-span-2" : "");

  if (field.type === "textarea") {
    return (
      <div className={wrapperClass}>
        <label className={labelClass}>
          {field.label}
          {field.required && <span className="text-amber-500"> *</span>}
        </label>
        <textarea
          rows={3}
          value={value || ""}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={cx(inputClass, "resize-none")}
        />
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <div className={wrapperClass}>
        <label className={labelClass}>
          {field.label}
          {field.required && <span className="text-amber-500"> *</span>}
        </label>
        <div className="relative">
          <select
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className={cx(inputClass, "appearance-none pr-9 cursor-pointer", !value && "text-neutral-500")}
          >
            <option value="">Bitte wählen…</option>
            {field.options.map((opt) => (
              <option key={opt} value={opt} className="bg-neutral-800 text-neutral-100">
                {opt}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
        </div>
      </div>
    );
  }

  if (field.type === "multiselect") {
    const current = Array.isArray(value) ? value : [];
    return (
      <div className={wrapperClass}>
        <label className={labelClass}>{field.label}</label>
        <div className="flex flex-wrap gap-2">
          {field.options.map((opt) => {
            const active = current.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  const next = active ? current.filter((v) => v !== opt) : [...current, opt];
                  onChange(next);
                }}
                className={cx(
                  "rounded-full border px-3 py-1.5 text-left text-xs transition",
                  active
                    ? "border-amber-500 bg-amber-500 font-medium text-neutral-950"
                    : "border-neutral-700 bg-neutral-800 text-neutral-300 hover:border-neutral-500"
                )}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (field.type === "number") {
    return (
      <div className={wrapperClass}>
        <label className={labelClass}>
          {field.label}
          {field.required && <span className="text-amber-500"> *</span>}
        </label>
        <div className="relative">
          <input
            type="number"
            inputMode="decimal"
            value={value ?? ""}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
            className={cx(inputClass, field.unit && "pr-12")}
          />
          {field.unit && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500">
              {field.unit}
            </span>
          )}
        </div>
      </div>
    );
  }

  // text / email
  return (
    <div className={wrapperClass}>
      <label className={labelClass}>
        {field.label}
        {field.required && <span className="text-amber-500"> *</span>}
      </label>
      <input
        type={field.type === "email" ? "email" : "text"}
        value={value || ""}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </div>
  );
}

/* =========================================================================
   UI-BAUSTEINE: KATEGORISIERTE UPLOAD-KACHELN
   ========================================================================= */

function CategoryUploadGrid({ category, items, onFilesAdd, onRemove, accept, kind }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const count = items.length;
  const full = count >= category.max;

  const handleFiles = (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length) onFilesAdd(files);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!full) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (!full) handleFiles(e.dataTransfer.files);
      }}
      className={cx(
        "rounded-xl border p-3 transition",
        dragOver ? "border-amber-500 bg-neutral-800" : "border-neutral-800 bg-neutral-900"
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-neutral-200">{category.label}</p>
          {category.hint && <p className="text-xs text-neutral-500">{category.hint}</p>}
        </div>
        <span className="flex-shrink-0 rounded-full border border-neutral-700 px-2 py-0.5 font-mono text-xs text-neutral-500">
          {count}/{category.max}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="group relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-neutral-700 bg-neutral-800"
          >
            {kind === "image" && item.previewUrl ? (
              <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-1 text-center">
                <FileText className="h-5 w-5 text-amber-500" />
                <span className="line-clamp-2 text-xs leading-tight text-neutral-400">{item.name}</span>
              </div>
            )}
            {item.status === "loading" && (
              <div className="absolute inset-0 flex items-center justify-center bg-neutral-950">
                <Loader2 className="h-4 w-4 animate-spin text-neutral-300" />
              </div>
            )}
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="absolute right-0.5 top-0.5 rounded-full bg-neutral-950 p-0.5 text-neutral-300 opacity-0 transition group-hover:opacity-100"
              aria-label="Entfernen"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {!full && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-16 w-16 flex-shrink-0 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-neutral-700 text-neutral-500 transition hover:border-amber-500 hover:text-amber-400"
            aria-label={`${category.label} hochladen`}
          >
            <Plus className="h-5 w-5" />
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

/* =========================================================================
   UI-BAUSTEINE: PIPELINE-FORTSCHRITT
   ========================================================================= */

function PipelineProgress({ status }) {
  return (
    <div className="space-y-3">
      {PIPELINE_META.map((step, idx) => {
        const st = status[step.id] || "idle";
        return (
          <div
            key={step.id}
            className={cx(
              "flex items-start gap-4 rounded-xl border px-4 py-3 transition",
              st === "running" && "border-amber-500 bg-neutral-800",
              st === "done" && "border-neutral-700 bg-neutral-900",
              st === "truncated" && "border-amber-700 bg-neutral-900",
              st === "error" && "border-red-800 bg-neutral-900",
              st === "skipped" && "border-neutral-800 bg-neutral-950 opacity-50",
              st === "idle" && "border-neutral-800 bg-neutral-950"
            )}
          >
            <div className="mt-0.5 flex-shrink-0">
              {st === "done" && <Check className="h-5 w-5 text-amber-500" />}
              {st === "truncated" && <AlertTriangle className="h-5 w-5 text-amber-400" />}
              {st === "running" && <Loader2 className="h-5 w-5 animate-spin text-amber-500" />}
              {st === "error" && <AlertCircle className="h-5 w-5 text-red-500" />}
              {(st === "idle" || st === "skipped") && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-neutral-700 font-mono text-xs text-neutral-500">
                  {String(idx + 1).padStart(2, "0")}
                </span>
              )}
            </div>
            <div className="flex-1">
              <p className={cx("text-sm font-medium", st === "skipped" ? "text-neutral-600" : "text-neutral-100")}>
                {step.label}
              </p>
              <p className="mt-0.5 text-xs text-neutral-500">
                {st === "skipped" ? "Übersprungen (keine passenden Daten vorhanden)" : step.description}
              </p>
              {st === "truncated" && (
                <p className="mt-1 text-xs text-amber-400">
                  Die Antwort hat die Längengrenze erreicht und wurde abgeschnitten – dieser Abschnitt ist unvollständig.
                </p>
              )}
              {st === "error" && (
                <p className="mt-1 text-xs text-red-400">
                  Fehler bei diesem Schritt – das Gutachten wird ohne diesen Abschnitt fortgesetzt.
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* =========================================================================
   UI-BAUSTEINE: GUTACHTEN / BERICHT
   ========================================================================= */

function eckdatenRows(data) {
  return [
    ["Objektart", data.objektart],
    ["Adresse", addressLine(data)],
    ["Baujahr", data.baujahr],
    ["Wohnfläche", data.wohnflaeche ? `${data.wohnflaeche} m²` : ""],
    ["Grundstücksfläche", data.grundstuecksflaeche ? `${data.grundstuecksflaeche} m²` : ""],
    ["Zimmer", data.zimmer],
    ["Badezimmer", data.badezimmer],
    ["Auftraggeber", data.name],
    ["Bewertungsanlass", data.nutzerziel],
    ["Preisvorstellung", data.angebotspreis ? formatEUR(data.angebotspreis) : ""],
  ].filter(([, v]) => v !== undefined && v !== null && v !== "");
}

function Prose({ text }) {
  if (!text) return null;
  const lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <div className="space-y-3">
      {lines.map((line, i) => {
        const isHeading = line.length <= 80 && line === line.toUpperCase() && /[A-ZÄÖÜ]/.test(line);
        if (isHeading) {
          return (
            <h4 key={i} className="pt-2 text-xs font-semibold uppercase tracking-wider text-amber-700">
              {line}
            </h4>
          );
        }
        return (
          <p key={i} className="text-sm leading-relaxed text-stone-800">
            {line}
          </p>
        );
      })}
    </div>
  );
}

function Section({ number, title, children }) {
  return (
    <section className="mt-8 border-t border-stone-200 pt-6 first:mt-0 first:border-t-0 first:pt-0">
      <h3 className="mb-3 font-serif text-lg text-stone-900">
        <span className="mr-2 text-amber-600">{number}.</span>
        {title}
      </h3>
      {children}
    </section>
  );
}

function EckdatenTable({ data }) {
  const rows = eckdatenRows(data);
  return (
    <dl className="grid grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-baseline justify-between border-b border-stone-100 py-1.5 sm:justify-start sm:gap-2 sm:border-none sm:py-0">
          <dt className="text-stone-500">{label}</dt>
          <dd className="font-medium text-stone-900">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function SubNote({ title, text }) {
  if (!text) return null;
  return (
    <div className="mt-4 rounded-lg border border-stone-200 bg-stone-100 p-4">
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-stone-500">{title}</p>
      <p className="text-sm leading-relaxed text-stone-700">{text}</p>
    </div>
  );
}

const TRUNCATION_NOTE =
  "Hinweis: Dieser Abschnitt wurde wegen der Längengrenze der KI-Antwort abgeschnitten und ist unvollständig. Bitte erstellen Sie die Markteinschätzung bei Bedarf erneut.";

function TruncationNote({ show }) {
  if (!show) return null;
  return (
    <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
      <p>{TRUNCATION_NOTE}</p>
    </div>
  );
}

function buildPlainTextReport(report) {
  const { id, date, sections, formSnapshot } = report;
  const truncated = report.truncated || {};
  const lines = [];
  const note = (key) => {
    if (truncated[key]) lines.push(`[${TRUNCATION_NOTE}]`);
  };
  lines.push("IMMOWERT – MARKTWERTEINSCHÄTZUNG");
  lines.push(addressLine(formSnapshot));
  lines.push(`Gutachten-ID: ${id}`);
  lines.push(`Datum: ${date}`);
  lines.push("");
  lines.push("1. ECKDATEN DER IMMOBILIE");
  lines.push("");
  eckdatenRows(formSnapshot).forEach(([label, value]) => {
    lines.push(`${label}: ${value}`);
  });

  lines.push("");
  lines.push("2. LAGE UND RECHTLICHE RAHMENBEDINGUNGEN");
  lines.push("");
  lines.push(sections.lage || "");
  note("lage");

  lines.push("");
  lines.push("3. BAUSUBSTANZ, AUSSTATTUNG UND ZUSTAND");
  lines.push("");
  lines.push(sections.bau || "");
  note("bau");
  if (sections.photos) {
    lines.push("");
    lines.push("Fotoauswertung:");
    lines.push(sections.photos);
    note("photos");
  }
  if (sections.documents) {
    lines.push("");
    lines.push("Dokumentenauswertung:");
    lines.push(sections.documents);
    note("documents");
  }

  lines.push("");
  lines.push("4. WERTERMITTLUNG");
  lines.push("");
  lines.push(sections.wert || "");
  note("wert");

  lines.push("");
  lines.push("5. ZUSAMMENFASSUNG UND EMPFEHLUNG");
  lines.push("");
  lines.push(sections.fazit || "");
  note("fazit");

  lines.push("");
  lines.push("6. HAFTUNGSAUSSCHLUSS");
  lines.push("");
  lines.push(DISCLAIMER_TEXT);

  return lines.join("\n");
}

function ReportView({ report, onReset }) {
  const { id, date, sections, formSnapshot } = report;
  const truncated = report.truncated || {};

  const handleDownload = () => {
    const text = buildPlainTextReport(report);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${id}-marktwerteinschaetzung.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #immowert-report, #immowert-report * { visibility: visible; }
          #immowert-report { position: absolute; left: 0; top: 0; width: 100%; padding: 0; box-shadow: none; border-radius: 0; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>

      <div id="immowert-report" className="rounded-2xl bg-stone-50 p-6 text-stone-900 shadow-2xl sm:p-10">
        <header className="mb-8 border-b border-stone-200 pb-6">
          <p className="mb-2 text-xs uppercase tracking-widest text-amber-600">ImmoWert · KI-Markteinschätzung</p>
          <h2 className="mb-1 font-serif text-2xl text-stone-900 sm:text-3xl">Marktwerteinschätzung</h2>
          <p className="text-stone-600">{addressLine(formSnapshot)}</p>
          <div className="mt-4 flex flex-wrap gap-x-8 gap-y-1 text-sm text-stone-500">
            <span>
              Gutachten-ID: <span className="font-mono text-stone-700">{id}</span>
            </span>
            <span>Datum: {date}</span>
          </div>
        </header>

        <Section number={1} title="Eckdaten der Immobilie">
          <EckdatenTable data={formSnapshot} />
        </Section>

        <Section number={2} title="Lage und rechtliche Rahmenbedingungen">
          <Prose text={sections.lage} />
          <TruncationNote show={truncated.lage} />
        </Section>

        <Section number={3} title="Bausubstanz, Ausstattung und Zustand">
          <Prose text={sections.bau} />
          <TruncationNote show={truncated.bau} />
          <SubNote title="Fotoauswertung" text={sections.photos} />
          <TruncationNote show={sections.photos && truncated.photos} />
          <SubNote title="Dokumentenauswertung" text={sections.documents} />
          <TruncationNote show={sections.documents && truncated.documents} />
        </Section>

        <Section number={4} title="Wertermittlung">
          <Prose text={sections.wert} />
          <TruncationNote show={truncated.wert} />
        </Section>

        <Section number={5} title="Zusammenfassung und Empfehlung">
          <Prose text={sections.fazit} />
          <TruncationNote show={truncated.fazit} />
        </Section>

        <Section number={6} title="Haftungsausschluss">
          <Prose text={DISCLAIMER_TEXT} />
        </Section>
      </div>

      <div className="print:hidden mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-sm font-medium text-neutral-100 transition hover:border-amber-500"
        >
          <FileText className="h-4 w-4" />
          Als Textdatei speichern
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-2.5 text-sm font-medium text-neutral-100 transition hover:border-amber-500"
        >
          <Printer className="h-4 w-4" />
          Drucken / als PDF
        </button>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-amber-400"
        >
          <RefreshCw className="h-4 w-4" />
          Neues Gutachten erstellen
        </button>
      </div>
    </div>
  );
}

/* =========================================================================
   UI-BAUSTEINE: LAYOUT (HEADER, NAVIGATION)
   ========================================================================= */

const STEP_DESCRIPTIONS = {
  eckdaten: "Grunddaten zur Immobilie und zu Ihnen als Auftraggeber.",
  lage: "Angaben zur Lage, Erschließung und zum baurechtlichen Rahmen des Grundstücks.",
  bausubstanz: "Bauweise, Zustand der Bauteile und Haustechnik des Gebäudes.",
  ausstattung: "Innenausstattung, Küche, Sanitärbereiche und Bodenbeläge.",
  recht: "Rechte und Lasten sowie Ihr persönliches Ziel mit der Immobilie.",
};

function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-neutral-800 bg-neutral-950">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-amber-500 font-serif text-lg font-bold text-neutral-950">
          I
        </div>
        <div className="min-w-0">
          <p className="font-serif text-lg leading-tight text-neutral-100">ImmoWert</p>
          <p className="truncate text-xs text-neutral-500">KI-Markteinschätzung für Wohnimmobilien</p>
        </div>
      </div>
    </header>
  );
}

function Sidebar({ steps, activeIndex, onSelect }) {
  return (
    <nav className="hidden md:flex md:w-56 md:flex-shrink-0 md:flex-col md:gap-1">
      {steps.map((step, idx) => {
        const Icon = step.icon;
        const active = idx === activeIndex;
        return (
          <button
            key={step.id}
            type="button"
            onClick={() => onSelect(idx)}
            className={cx(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition",
              active
                ? "bg-neutral-800 text-amber-400"
                : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
            )}
          >
            <span className={cx("font-mono text-xs", active ? "text-amber-500" : "text-neutral-600")}>
              {String(idx + 1).padStart(2, "0")}
            </span>
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{step.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function MobileSteps({ steps, activeIndex, onSelect }) {
  return (
    <nav className="mb-5 flex gap-2 overflow-x-auto pb-1 md:hidden">
      {steps.map((step, idx) => {
        const active = idx === activeIndex;
        return (
          <button
            key={step.id}
            type="button"
            onClick={() => onSelect(idx)}
            className={cx(
              "flex flex-shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition",
              active
                ? "border-amber-500 bg-amber-500 font-medium text-neutral-950"
                : "border-neutral-700 bg-neutral-900 text-neutral-400"
            )}
          >
            <span className="font-mono">{String(idx + 1).padStart(2, "0")}</span>
            {step.short}
          </button>
        );
      })}
    </nav>
  );
}

/* =========================================================================
   UI-BAUSTEINE: FORMULAR-SCHRITTE
   ========================================================================= */

function StepCard({ title, description, fields, formData, onFieldChange }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 sm:p-8">
      <h2 className="font-serif text-xl text-neutral-100 sm:text-2xl">{title}</h2>
      {description && <p className="mt-1 text-sm text-neutral-400">{description}</p>}
      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
        {fields.map((field) => (
          <FieldRenderer
            key={field.key}
            field={field}
            value={formData[field.key]}
            onChange={(value) => onFieldChange(field.key, value)}
          />
        ))}
      </div>
    </div>
  );
}

function MediaStep({ photos, documents, onAddPhotos, onRemovePhoto, onAddDocuments, onRemoveDocument }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 sm:p-8">
      <h2 className="font-serif text-xl text-neutral-100 sm:text-2xl">Fotos &amp; Unterlagen</h2>
      <p className="mt-1 text-sm text-neutral-400">
        Laden Sie aussagekräftige Fotos der Immobilie sowie relevante Dokumente zu den passenden Kategorien
        hoch. Alles ist optional, verbessert aber die Genauigkeit der Markteinschätzung deutlich – je mehr
        Fotos und Unterlagen, desto präziser die Auswertung.
      </p>

      <div className="mt-6">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Fotos ({photos.length}/{PHOTO_CATEGORY_MAX_TOTAL})
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {PHOTO_CATEGORIES.map((cat) => (
            <CategoryUploadGrid
              key={cat.id}
              category={cat}
              kind="image"
              accept="image/*"
              items={photos.filter((p) => p.category === cat.id)}
              onFilesAdd={(files) => onAddPhotos(files, cat.id)}
              onRemove={onRemovePhoto}
            />
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Dokumente ({documents.length}/{DOCUMENT_CATEGORY_MAX_TOTAL})
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {DOCUMENT_CATEGORIES.map((cat) => (
            <CategoryUploadGrid
              key={cat.id}
              category={cat}
              kind="document"
              accept="application/pdf"
              items={documents.filter((d) => d.category === cat.id)}
              onFilesAdd={(files) => onAddDocuments(files, cat.id)}
              onRemove={onRemoveDocument}
            />
          ))}
        </div>
      </div>
    </div>
  );
}


/* =========================================================================
   UI-BAUSTEINE: GUTACHTEN-SCHRITT
   ========================================================================= */

function GutachtenStep({
  formData,
  photos,
  documents,
  pipelineStatus,
  report,
  generating,
  genError,
  onGenerate,
  onReset,
  onJumpToField,
}) {
  const missing = REQUIRED_FIELDS.filter((key) => {
    const value = formData[key];
    return value === undefined || value === null || String(value).trim() === "";
  });

  if (report) {
    return <ReportView report={report} onReset={onReset} />;
  }

  if (generating) {
    return (
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 sm:p-8">
        <h2 className="font-serif text-xl text-neutral-100 sm:text-2xl">Markteinschätzung wird erstellt …</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Ihre Angaben, Fotos und Dokumente werden Schritt für Schritt ausgewertet. Dies kann ein bis zwei
          Minuten dauern.
        </p>
        <div className="mt-6">
          <PipelineProgress status={pipelineStatus} />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 sm:p-8">
      <h2 className="font-serif text-xl text-neutral-100 sm:text-2xl">Markteinschätzung erstellen</h2>
      <p className="mt-1 text-sm text-neutral-400">
        ImmoWert wertet Ihre Angaben sowie die hochgeladenen Fotos und Dokumente in mehreren Schritten aus und
        erstellt daraus eine ausführliche, mehrseitige Marktwerteinschätzung mit Lage-, Bausubstanz- und
        Wertermittlungsteil.
      </p>

      <div className="mt-5 flex flex-wrap gap-3 text-xs text-neutral-400">
        <span className="rounded-full border border-neutral-700 bg-neutral-800 px-3 py-1">
          {photos.length} {photos.length === 1 ? "Foto" : "Fotos"} hochgeladen
        </span>
        <span className="rounded-full border border-neutral-700 bg-neutral-800 px-3 py-1">
          {documents.length} {documents.length === 1 ? "Dokument" : "Dokumente"} hochgeladen
        </span>
      </div>

      {missing.length > 0 && (
        <div className="mt-5 rounded-xl border border-amber-700 bg-neutral-800 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-amber-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            Bitte ergänzen Sie noch folgende Pflichtangaben:
          </p>
          <ul className="mt-2 space-y-1">
            {missing.map((key) => (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => onJumpToField(key)}
                  className="text-sm text-neutral-300 underline transition hover:text-amber-400"
                >
                  {ALL_FIELDS_BY_KEY[key]?.label || key}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {genError && (
        <div className="mt-5 flex items-start gap-2 rounded-lg border border-red-800 bg-neutral-800 p-3 text-sm text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{genError}</span>
        </div>
      )}

      <button
        type="button"
        onClick={onGenerate}
        disabled={missing.length > 0}
        className={cx(
          "mt-6 inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition",
          missing.length > 0
            ? "cursor-not-allowed bg-neutral-800 text-neutral-500"
            : "bg-amber-500 text-neutral-950 hover:bg-amber-400"
        )}
      >
        <Sparkles className="h-4 w-4" />
        Gutachten erstellen
      </button>

      <p className="mt-6 border-t border-neutral-800 pt-4 text-xs leading-relaxed text-neutral-500">
        Hinweis zum Datenschutz: Zur Erstellung der Markteinschätzung werden Ihre Angaben sowie die von Ihnen
        hochgeladenen Fotos und Dokumente zur Analyse an die Claude-API von Anthropic übermittelt. Die Daten
        werden ausschließlich zur Erstellung dieser Auswertung verwendet und nicht für andere Zwecke
        gespeichert. Diese Markteinschätzung ersetzt kein Verkehrswertgutachten gemäß § 194 BauGB.
      </p>
    </div>
  );
}

/* =========================================================================
   HAUPTKOMPONENTE
   ========================================================================= */

function createInitialFormData() {
  const initial = {};
  for (const field of Object.values(ALL_FIELDS_BY_KEY)) {
    initial[field.key] = field.type === "multiselect" ? [] : "";
  }
  return initial;
}

const INITIAL_PIPELINE_STATUS = {
  photos: "idle",
  documents: "idle",
  lage: "idle",
  bau: "idle",
  wert: "idle",
  fazit: "idle",
};

export default function App() {
  const [formData, setFormData] = useState(createInitialFormData);
  const [photos, setPhotos] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const [pipelineStatus, setPipelineStatus] = useState(INITIAL_PIPELINE_STATUS);
  const [sections, setSections] = useState({});
  const [report, setReport] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");

  const currentStep = useMemo(() => STEPS[activeIndex], [activeIndex]);

  const updateField = useCallback((key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const addPhotos = useCallback((files, categoryId) => {
    setPhotos((prev) => {
      const cat = PHOTO_CATEGORIES.find((c) => c.id === categoryId);
      const max = cat ? cat.max : 3;
      const currentInCategory = prev.filter((p) => p.category === categoryId).length;
      const room = Math.max(0, max - currentInCategory);
      const accepted = files.slice(0, room);
      const newItems = accepted.map((file) => ({
        id: `ph-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        name: file.name,
        category: categoryId,
        previewUrl: URL.createObjectURL(file),
        base64: null,
        mediaType: "image/jpeg",
        status: "loading",
      }));

      newItems.forEach((item) => {
        resizeImageToBase64(item.file)
          .then((base64) => {
            setPhotos((cur) => cur.map((p) => (p.id === item.id ? { ...p, base64, status: "ready" } : p)));
          })
          .catch(() => {
            setPhotos((cur) => cur.map((p) => (p.id === item.id ? { ...p, status: "error" } : p)));
          });
      });

      return [...prev, ...newItems];
    });
  }, []);

  const removePhoto = useCallback((id) => {
    setPhotos((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const addDocuments = useCallback((files, categoryId) => {
    setDocuments((prev) => {
      const cat = DOCUMENT_CATEGORIES.find((c) => c.id === categoryId);
      const max = cat ? cat.max : 2;
      const currentInCategory = prev.filter((d) => d.category === categoryId).length;
      const room = Math.max(0, max - currentInCategory);
      const accepted = files.slice(0, room);
      const newItems = accepted.map((file) => ({
        id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        name: file.name,
        category: categoryId,
        base64: null,
        mediaType: "application/pdf",
        status: "loading",
      }));

      newItems.forEach((item) => {
        fileToBase64(item.file)
          .then((base64) => {
            setDocuments((cur) => cur.map((d) => (d.id === item.id ? { ...d, base64, status: "ready" } : d)));
          })
          .catch(() => {
            setDocuments((cur) => cur.map((d) => (d.id === item.id ? { ...d, status: "error" } : d)));
          });
      });

      return [...prev, ...newItems];
    });
  }, []);

  const removeDocument = useCallback((id) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const goNext = useCallback(() => {
    setActiveIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }, []);

  const goPrev = useCallback(() => {
    setActiveIndex((i) => Math.max(i - 1, 0));
  }, []);

  const jumpToField = useCallback((key) => {
    const idx = STEPS.findIndex((s) => FIELD_GROUPS[s.id]?.some((f) => f.key === key));
    if (idx >= 0) setActiveIndex(idx);
  }, []);

  const handleReset = useCallback(() => {
    photos.forEach((p) => {
      if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
    });
    setFormData(createInitialFormData());
    setPhotos([]);
    setDocuments([]);
    setSections({});
    setReport(null);
    setGenError("");
    setPipelineStatus(INITIAL_PIPELINE_STATUS);
    setActiveIndex(0);
  }, [photos]);

  const generateGutachten = useCallback(async () => {
    setGenError("");
    setReport(null);
    setSections({});
    setGenerating(true);
    setPipelineStatus({
      photos: photos.length > 0 ? "idle" : "skipped",
      documents: documents.length > 0 ? "idle" : "skipped",
      lage: "idle",
      bau: "idle",
      wert: "idle",
      fazit: "idle",
    });

    const newSections = { photos: "", documents: "", lage: "", bau: "", wert: "", fazit: "" };
    const newTruncated = { photos: false, documents: false, lage: false, bau: false, wert: false, fazit: false };

    // 1) Fotoanalyse
    if (photos.length > 0) {
      setPipelineStatus((s) => ({ ...s, photos: "running" }));
      try {
        const ready = photos.filter((p) => p.base64);
        const content = [
          {
            type: "text",
            text: "Bitte analysiere die folgenden Fotos der Immobilie im Hinblick auf Bauzustand und sichtbare Mängel. Jedem Foto ist die vom Nutzer ausgewählte Kategorie vorangestellt.",
          },
        ];
        ready.forEach((p) => {
          const cat = PHOTO_CATEGORIES.find((c) => c.id === p.category);
          content.push({ type: "text", text: `Kategorie: ${cat ? cat.label : "Sonstiges"}` });
          content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: p.base64 } });
        });
        const { text, truncated } = await callClaude({ system: PHOTO_SYSTEM_PROMPT, content, maxTokens: MAX_TOKENS.photos });
        newSections.photos = text;
        setSections((s) => ({ ...s, photos: text }));
        newTruncated.photos = truncated;
        setPipelineStatus((s) => ({ ...s, photos: truncated ? "truncated" : "done" }));
      } catch (err) {
        setPipelineStatus((s) => ({ ...s, photos: "error" }));
      }
    }

    // 2) Dokumentenanalyse
    if (documents.length > 0) {
      setPipelineStatus((s) => ({ ...s, documents: "running" }));
      try {
        const ready = documents.filter((d) => d.base64);
        const content = [
          {
            type: "text",
            text: "Bitte werte die folgenden hochgeladenen Dokumente zur Immobilie aus. Jedem Dokument ist die vom Nutzer ausgewählte Kategorie vorangestellt.",
          },
        ];
        ready.forEach((d) => {
          const cat = DOCUMENT_CATEGORIES.find((c) => c.id === d.category);
          content.push({ type: "text", text: `Kategorie: ${cat ? cat.label : "Sonstiges"}` });
          content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: d.base64 } });
        });
        const { text, truncated } = await callClaude({ system: DOC_SYSTEM_PROMPT, content, maxTokens: MAX_TOKENS.documents });
        newSections.documents = text;
        setSections((s) => ({ ...s, documents: text }));
        newTruncated.documents = truncated;
        setPipelineStatus((s) => ({ ...s, documents: truncated ? "truncated" : "done" }));
      } catch (err) {
        setPipelineStatus((s) => ({ ...s, documents: "error" }));
      }
    }

    // 3) Lage & rechtliche Rahmenbedingungen
    setPipelineStatus((s) => ({ ...s, lage: "running" }));
    try {
      const prompt = `Adresse: ${addressLine(formData)}\n\n${fieldSummary(formData, LAGE_KEYS)}`;
      const { text, truncated } = await callClaude({ system: LAGE_SYSTEM_PROMPT, content: prompt, maxTokens: MAX_TOKENS.lage });
      newSections.lage = text;
      setSections((s) => ({ ...s, lage: text }));
      newTruncated.lage = truncated;
      setPipelineStatus((s) => ({ ...s, lage: truncated ? "truncated" : "done" }));
    } catch (err) {
      setPipelineStatus((s) => ({ ...s, lage: "error" }));
    }

    // 4) Bausubstanz, Haustechnik & Ausstattung
    setPipelineStatus((s) => ({ ...s, bau: "running" }));
    try {
      let prompt = fieldSummary(formData, BAU_KEYS);
      if (newSections.photos) prompt += `\n\nErgebnis der Fotoauswertung:\n${newSections.photos}`;
      if (newSections.documents) prompt += `\n\nErgebnis der Dokumentenauswertung:\n${newSections.documents}`;
      const { text, truncated } = await callClaude({ system: BAU_SYSTEM_PROMPT, content: prompt, maxTokens: MAX_TOKENS.bau });
      newSections.bau = text;
      setSections((s) => ({ ...s, bau: text }));
      newTruncated.bau = truncated;
      setPipelineStatus((s) => ({ ...s, bau: truncated ? "truncated" : "done" }));
    } catch (err) {
      setPipelineStatus((s) => ({ ...s, bau: "error" }));
    }

    // 5) Wertermittlung (mit Websuche)
    setPipelineStatus((s) => ({ ...s, wert: "running" }));
    try {
      let prompt = `Adresse: ${addressLine(formData)}\n\n${fieldSummary(formData, WERT_KEYS)}`;
      if (newSections.documents) prompt += `\n\nErgebnis der Dokumentenauswertung:\n${newSections.documents}`;
      const { text, truncated } = await callClaude({
        system: WERT_SYSTEM_PROMPT,
        content: prompt,
        useWebSearch: true,
        maxTokens: MAX_TOKENS.wert,
      });
      newSections.wert = text;
      setSections((s) => ({ ...s, wert: text }));
      newTruncated.wert = truncated;
      setPipelineStatus((s) => ({ ...s, wert: truncated ? "truncated" : "done" }));
    } catch (err) {
      setPipelineStatus((s) => ({ ...s, wert: "error" }));
    }

    // 6) Zusammenfassung & Empfehlung
    setPipelineStatus((s) => ({ ...s, fazit: "running" }));
    try {
      const parts = [];
      const cut = (key) => (newTruncated[key] ? "\n(Hinweis: Dieser Abschnitt wurde abgeschnitten und ist unvollständig.)" : "");
      if (newSections.lage) parts.push(`Lage und rechtliche Rahmenbedingungen:\n${newSections.lage}${cut("lage")}`);
      if (newSections.bau) parts.push(`Bausubstanz, Technik und Ausstattung:\n${newSections.bau}${cut("bau")}`);
      if (newSections.wert) parts.push(`Wertermittlung:\n${newSections.wert}${cut("wert")}`);
      parts.push(`Ziel des Nutzers: ${formData.nutzerziel || "nicht angegeben"}`);
      if (formData.angebotspreis) parts.push(`Angebots- bzw. Wunschpreis: ${formatEUR(formData.angebotspreis)}`);
      const { text, truncated } = await callClaude({ system: FAZIT_SYSTEM_PROMPT, content: parts.join("\n\n"), maxTokens: MAX_TOKENS.fazit });
      newSections.fazit = text;
      setSections((s) => ({ ...s, fazit: text }));
      newTruncated.fazit = truncated;
      setPipelineStatus((s) => ({ ...s, fazit: truncated ? "truncated" : "done" }));
    } catch (err) {
      setPipelineStatus((s) => ({ ...s, fazit: "error" }));
    }

    setGenerating(false);

    if (!newSections.lage && !newSections.bau && !newSections.wert && !newSections.fazit) {
      setGenError(
        "Die Markteinschätzung konnte leider nicht erstellt werden. Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut."
      );
      return;
    }

    setReport({
      id: genGutachtenId(),
      date: todayDE(),
      sections: newSections,
      truncated: newTruncated,
      formSnapshot: { ...formData },
    });
  }, [formData, photos, documents]);

  const showFormNav = currentStep.id !== "gutachten";

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <Header />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex gap-8">
          <Sidebar steps={STEPS} activeIndex={activeIndex} onSelect={setActiveIndex} />

          <main className="min-w-0 flex-1">
            <MobileSteps steps={STEPS} activeIndex={activeIndex} onSelect={setActiveIndex} />

            {currentStep.id === "medien" && (
              <MediaStep
                photos={photos}
                documents={documents}
                onAddPhotos={addPhotos}
                onRemovePhoto={removePhoto}
                onAddDocuments={addDocuments}
                onRemoveDocument={removeDocument}
              />
            )}

            {currentStep.id === "gutachten" && (
              <GutachtenStep
                formData={formData}
                photos={photos}
                documents={documents}
                pipelineStatus={pipelineStatus}
                report={report}
                generating={generating}
                genError={genError}
                onGenerate={generateGutachten}
                onReset={handleReset}
                onJumpToField={jumpToField}
              />
            )}

            {currentStep.id !== "medien" && currentStep.id !== "gutachten" && (
              <StepCard
                title={currentStep.label}
                description={STEP_DESCRIPTIONS[currentStep.id]}
                fields={FIELD_GROUPS[currentStep.id]}
                formData={formData}
                onFieldChange={updateField}
              />
            )}

            {showFormNav && (
              <div className="print:hidden mt-6 flex items-center justify-between">
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={activeIndex === 0}
                  className={cx(
                    "inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 px-4 py-2.5 text-sm font-medium transition",
                    activeIndex === 0
                      ? "cursor-not-allowed text-neutral-600"
                      : "text-neutral-200 hover:border-amber-500 hover:text-amber-400"
                  )}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Zurück
                </button>
                <span className="font-mono text-xs text-neutral-500">
                  Schritt {activeIndex + 1} / {STEPS.length}
                </span>
                <button
                  type="button"
                  onClick={goNext}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-amber-400"
                >
                  Weiter
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
