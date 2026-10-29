# WerkTag Atelier · 0.14.0

Auftrag vom 29. Oktober 2026: die gemeinsame Website authentischer, eigenständiger und edler gestalten, weitere Fehler bearbeiten und die geprüfte Webversion veröffentlichen. Führende [Plattformaufgabe #9](https://github.com/nickhein0509-cmyk/projektzentrale/issues/9), Routenfehler [#7](https://github.com/nickhein0509-cmyk/projektzentrale/issues/7).

## Gestaltung

- Lokal bereitgestellte variable Manrope-Schrift mit mitgelieferter OFL-Lizenz; Systemschrift bleibt als Fallback verfügbar. Keine zusätzliche Font-Anfrage an Dritte.
- Lernstart mit eigener dekorativer Kupfer-Leitungsstudie, ruhiger Navigation, klarer Hauptaktion und leichter gegliederten Arbeitsflächen. Die Illustration enthält keine Messwerte oder fachlichen Aussagen.
- Projektwahl und Konto erhalten dieselben Material-, Typografie- und Formprinzipien.
- Assistent mit editorialem Einstieg, Tastatur-Sprunglink, hellen Notiz-/Aufgabenflächen, klaren Zuständen sowie abgestimmter Zeitachse und Health-Ansicht.
- Kurze Eingangstransition statt Daueranimation; reduzierte Bewegung wird berücksichtigt. Bestehende Fokus-, Tastatur- und Speicherabläufe bleiben maßgeblich.

## Behobener Entwicklungsfehler

Vite löst nun die exakten öffentlichen Produktrouten aus vercel.json auch lokal und in der Build-Vorschau auf. Private API-Aufrufe liefern HTTP 503 mit einer ausdrücklichen Meldung statt irreführendem SPA-HTML. Vier neue Browsertests prüfen reale lokale Navigation und Antworten ohne Routeninterception. Die mobile Fußzeile bleibt oberhalb der festen Navigation erreichbar; zwei weitere Prüfungen sichern das bei 320/390 Pixeln ab. Die zuvor hart codierte Version 0.8.1 wird nun aus package.json gelesen. Produktions-Rewrites, Berechtigungen und Cloudkonfiguration werden dadurch nicht ersetzt.

## Verantwortung und Basis

Basis: `25b8a6a1c19614ff6cb5fcaca4fc51e59b8d6bd5`, Aufgabenbranch `feat/atelier-design-20261029`.

| Bereich | Verantwortung im Auftrag | Dateien |
| --- | --- | --- |
| Gestaltung und Integration | Root-Koordination | React-Einstiege, Atelier-Stile, Tokens, lokale Fontdateien, Versions-/Releaseangaben |
| Assistenzgestaltung | Agent atelier_assistant | assistance.html; workspace.css, timeline.css, health.css |
| Lokale Routen | Agent local_routes | vite.config.ts, local-routes.spec.ts, local-development.md |

Alle Agenten arbeiteten in disjunkten Schreibbereichen; die Koordination prüft das kombinierte Ergebnis. Der offene native iPhone-PR #13 gehört nicht zu dieser Webveröffentlichung. Private Kataloginhalte sind nicht Bestandteil der visuellen Überarbeitung; ihr geschützter Einstieg bleibt erhalten.

## Abnahme und Betrieb

Build und `npm run check` sowie die separate mobile WebKit-Prüfung werden am Ergebnis ausgeführt; konkrete Resultate und Ergebnis-SHA stehen im Release-PR. Browserprüfungen verwenden synthetische Daten. Geschützte echte Lern- und Kataloginhalte werden nicht als visuell geprüft ausgegeben. Screenshots mit Testnotizen sind ausdrücklich synthetisch.

Keine Migration und kein neuer Dienst erforderlich. Das bestehende Vercel-Projekt veröffentlicht den geprüften main-Stand. `release.json` nennt `werktag-atelier-0.14.0`; Deployment-SHA und Domainantwort anschließend separat prüfen. Rückweg: im bestehenden Vercel-Projekt den vorherigen geprüften Webstand bereitstellen; es wurde kein Datenformat geändert.

## Gestaltungsnachweise

Gastansichten ohne persönliche Daten: [Lernstart Desktop](screenshots/atelier-learning-desktop.png), [Projektwahl](screenshots/atelier-projects-desktop.png), [Lernstart mobil](screenshots/atelier-learning-mobile.png).
