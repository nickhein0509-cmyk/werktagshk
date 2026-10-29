# WerkTag: drei Desktop-Aufteilungen

Produkt LERNEN. Nutzerauftrag: mehr Übersicht und bessere Flächennutzung auf
Desktop, mehrere Designoptionen; native iOS-Abnahme folgt später.
Branch `feat/desktop-layout-options-20261029`, frische main-Basis
`ef9f8b36220914bb1d137207ca3df7d471cdb46d`.
Eigene Dateien: ausschließlich `docs/desktop-options/`.
Visuelle Quelle: PR #21, Commit `4c32bd991b2b3c10d1450c9bd9dc4032bbcb0f35`.
Keine Abhängigkeit für die Produktion: Diese PR enthält nur eine Designstudie.

## Referenzfestlegung vor Ausarbeitung

Die bestehende Atelier-Oberfläche bleibt die primäre Referenz. Die verfügbaren
Refero-Leitlinien für Typografie und UI-Details ergänzen sie. Live-Recherche war
im vorherigen Arbeitsschritt durch NO_SUBSCRIPTION blockiert; keine neu gelesenen
externen Stilreferenzen behauptet. Medienstrategie: bestehende lokale Schrift,
Icons und SVG; keine Bildgenerierung für diese native Web-UI nötig.

| Option | Festgelegte Aufteilung | Unverändert | Bewusster Tausch |
| --- | --- | --- | --- |
| A · Lerncockpit | Aufgaben links, Tagesziel und nächste Schritte in einer rechten Spalte | Petrolrahmen, warme Aufgabenflächen, Kupfer als Detail | Weniger Breite je Aufgabenkarte, dafür Aktivitäten sofort sichtbar |
| B · Kompakte Übersicht | Kompakter Einstieg, drei breite Aufgabenkarten, Lernfelder als Zeile, Routine darunter | Bekannte vertikale Lesereihenfolge | Maximale Aufgabenbreite, Routine auf kleinen Laptops weiter unten |
| C · Heller Arbeitsplatz | Horizontale Navigation, helle Arbeitsfläche, Aufgaben als breite Listenzeilen | Manrope, Petrol und Kupfer als Markenfarben | Stärkster Umbau der Navigation; Auswirkung auf weitere Ansichten separat prüfen |

Die Vorschläge benutzen dieselben echten Produktbezeichnungen und einen leeren
Gastzustand (0 bearbeitete Aufgaben). Keine erfundene Aktivität oder Prüfungsreife.
Sie sind im Browser gerenderte Ansichten, keine bereits integrierten App-Versionen.
Die Galerie enthält Bilder und funktioniert ohne Konto, APIs oder Lernspeicher.

## Reproduktion

PR #21 lokal mit `npm ci && npm run dev -- --port 4174` starten.
Dann mit Node 24 und Playwright aus dieser Arbeitskopie:

```sh
node docs/desktop-options/capture.mjs http://127.0.0.1:4174
```

Der Aufnahmeschritt verändert nur das DOM eines isolierten Chromium-Gastkontexts.
Die Anwendung und ihre gespeicherten Daten werden nicht bearbeitet. `layouts.css`
enthält nur die Vorschau-Regeln und wird nicht im Produktionsbundle importiert.
Die Galerie lässt sich über einen lokalen HTTP-Server oder direkt als HTML öffnen.

## Ergebnis und Empfehlung

Empfehlung A: deutlich früherer Überblick über den Tag bei bewahrter seitlicher
Navigation. Auf 1440 × 1000px stehen die drei Prüfungsbereiche, alle vier
Lernfelder und die drei Routinekarten im ersten Bildschirm. Auf 1366 × 768px
bleiben Aufgabenwahl und Tagesziel sichtbar; Lernfelder und der untere Teil der
Wiederholung benötigen weiterhin Scrollen. Das wird nicht als vollständig
scrollfreie Oberfläche behauptet.

Messungen im leeren Gastzustand bei 1440 × 1000px, Positionen ab Seitenanfang:

| Ansicht | Unterkante Prüfungsbereich-Karten | Unterkante Lernfelder | Beginn Tagesübersicht |
| --- | ---: | ---: | ---: |
| PR #21 | 1057px | 1409px | 1450px |
| A | 675px | 941px | 97px |
| B | 556px | 742px | 762px |
| C | 763px | 992px | 357px |

Alle Messungen einschließlich 1366 und 1920px: `measurements.json`.
C blendet die zusätzliche Einzelaufgabenkarte und Wochenpunkte in der Übersicht
aus. B blendet Wochenpunkte aus. Diese Kompromisse sind in der Galerie genannt;
sie sind keine Entfernung bestehender Funktionen aus der Anwendung.

## Prüfung und Grenzen

- Alle drei Browser-Entwürfe bei 1366, 1440 und 1920px: kein horizontaler Überlauf,
  keine automatischen Axe-Verstöße gegen WCAG 2 A/AA und 2.1 AA.
- Galerie: A/B/C-Auswahl, Vorher-Umschaltung, Laptopgröße und Tastaturauswahl geprüft.
  Keine JavaScript-Fehler. Axe und Überlaufkontrolle bei 390, 1366 und 1440px ohne Befund.
- Screenshots im Browser gesichtet; anfängliche Überlagerungen durch alte
  Selektoren und während Farbtransitionen aufgenommene Zwischenstände korrigiert.
- Kein Produktionscode geändert; vollständige App-Regressionssuite nicht erneut
  ausgeführt. Die UI-Elemente in den Bildern sind keine bedienbare Lernapp.
- Keine native iOS-Prüfung, kein Deployment, kein Zugriff auf private Konten.
- Bei Umsetzung: ausgewähltes Layout als echte Komponenten integrieren,
  DOM-/Tastaturreihenfolge prüfen (insbesondere A mit seiner rechten Spalte),
  vergrößerte Schrift, weitere Lernansichten und alle App-Regressionstests prüfen.
