# Design-Veredelung · 29. Oktober 2026

Produkt: LERNEN. Auftrag: aktueller Chat zur Veredelung des bestehenden Designs.
Implementierung: `werktagshk`, Branch `feat/design-veredelung-20261029`.
Basis: `ef9f8b36220914bb1d137207ca3df7d471cdb46d` (frisch geladenes origin/main).
Eigene Dateien: `src/components/FlowDashboard.tsx`,
`src/design/dashboard-finish.css`, diese Dokumentation und synthetische Screenshots.
Keine Änderungen an gemeinsamen Konto-, Routing- oder Datenverträgen;
keine abhängigen Aufgabenbranches. Kein Livegang beauftragt.

## Gestalterische Festlegung vor Umsetzung

Primäre Referenz ist das bestehende WerkTag Atelier, im Browser aufgenommen.
Petrol, lokale Manrope, warme Lernflächen, weiße Hauptaktion und kupferne
Leitungszeichnung bleiben erhalten. Die Veredelung betrifft den Lerneinstieg.

Referos Live-Stilsuche wurde aus zwei Richtungen versucht, antwortet aber mit
`NO_SUBSCRIPTION`. Es werden keine erfolgreichen externen Referenzen behauptet.
Die verfügbaren Refero-Craft-Referenzen `typography.md` und `craft-details.md`
ergänzen die lokalen WerkTag-Produktregeln.

| Entscheidung | Quelle | Rolle und Zweck |
| --- | --- | --- |
| Petrol und warme Arbeitsflächen bewahren | Bestehendes Atelier, Nutzerauftrag | Identität und Trennung von Orientierung/Arbeit |
| Größere Bereichsnummern mit Fachsymbolen | Bestehende Nummerierung, lokale Designregeln | Drei Übungseinstiege schneller unterscheiden |
| Ruhigere Schriftabstände und größere Kleintexte | Refero Typography | Lesbarkeit statt nur dekorativer Feinheit |
| Gefasste Routinekarten und Tageszielanzeige | Bestehende echte Lernzustände | Nächste Aktion und tatsächliche Aktivität sichtbar machen |
| Zurückhaltende Hover- und Fokuszustände | Refero Craft Details | Tastatur und Touch gleichwertig bedienen |

Tokenrollen: vorhandene Flow-Farben; Kupfer nur als Detail und Fortschrittsfarbe,
helle Primäraktion; 20px Kartenradius, 1px Begrenzung, kurze 160ms Übergänge.
Medien: vorhandene lokale SVG-Leitungszeichnung und Lucide-Symbole; kein
zusätzlicher Bilddownload, keine neuen Laufzeitdienste. Keine erfundenen
Ergebnisse oder Prüfungsbereitschaft. Reduced Motion bleibt respektiert.

## Visuelle Abnahme

Chromium-Aufnahmen mit leerem, isoliertem Gastzustand:
[Desktop](screenshots/dashboard-finish-1440.png),
[Tablet](screenshots/dashboard-finish-768.png),
[Handy](screenshots/dashboard-finish-390.png),
[320px](screenshots/dashboard-finish-320.png).
Die feste Handynavigation erscheint in Ganzseitenaufnahmen auf Höhe des
ursprünglichen Viewport-Endes; sie bleibt im echten Browser am Bildschirmrand.

Die Browserkontrolle korrigierte die alte mobile Zweispaltenregel innerhalb der
Prüfungsbereich-Karten und die absolute Position der Wochenpunkte auf Tablets.
Bei 320, 390, 768 und 1440px kein horizontaler Überlauf. Bereichseinstieg mit
Tastatur aktiviert und Übungsdialog über „Lerneinheit starten“ geöffnet.
Automatischer Axe-Check mit WCAG 2 A/AA und 2.1 AA: keine Verstöße in diesen
vier Ansichten. Das ist keine vollständige manuelle Accessibility-Zertifizierung.
Der zusätzliche ungefilterte Axe-Lauf meldet die schon im Ausgangsquelltext
vorhandenen `label-content-name-mismatch`-Hinweise für `.daily-progress` und
die Routineaktion mit `aria-label="Lerneinheit starten"`.

Produktionsbuild am endgültigen CSS-Stand erfolgreich. Vite meldet weiterhin
die bestehende Bundle-Größenwarnung. Private Live-Konten, echte Lerninhalte
und Hosting wurden nicht verwendet oder geprüft.

`npm run check` erfolgreich: Produktionsbuild, 254 Vitest-Tests,
35 Assistenz-/Gatewaytests, 89 Cloud-Tests, 7 Workflowtests und
148 Chromium-Interaktionstests. Die letzten rein visuellen CSS-Korrekturen
wurden zusätzlich mit erneutem Produktionsbuild und den vier oben genannten
Browser-/Axe-Prüfungen kontrolliert. `git diff --check` ohne Befund.
