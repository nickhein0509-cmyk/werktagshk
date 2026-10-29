# WerkTag-Plattform: Navigation und Produktbezeichnungen

Auftrag vom 29. Oktober 2026: WerkTag weiter verbessern, Fehler beheben und
veröffentlichen. WerkTag bezeichnet die gemeinsame Plattform, nicht nur die
Lernapp. Produkt PLATTFORM; Ausgangspunkt ist
`80659f2a23e6c1c7d062adbbc468cd77401afd8d`, eigener Branch
`fix/quality-live-20261029` in einer separaten Arbeitskopie.

Die gemeinsame HTML-Beschreibung benennt Lernen, Assistent und Materialliste.
Konto, Projektauswahl und Lernen erhalten unterscheidbare Browsertitel. Das
WerkTag-Logo in der Projektauswahl bleibt im gemeinsamen Einstieg, statt zur
Lernapp zu springen. Die Produktkarten verwenden WerkTag Lernen und Materialliste.
Bestehende Zielpfade, Kontositzungen und gespeicherte Daten bleiben erhalten.

Betroffene Dateien: `index.html`, `src/main.tsx`, `src/components/ProjectHub.tsx`,
`src/components/AccountPage.tsx`, `tests/e2e/projects.spec.ts` und dieser Bericht.
Keine zusätzlichen Branch-Abhängigkeiten, keine Datenbankmigration und keine
Änderung von Hostingvariablen. Rückweg: Codeänderung per PR zurücknehmen.

Die Browserregressionen prüfen Produktziele, Logonavigation, die drei Seitentitel
sowie die Projektauswahl bei 320, 390, 768, 1024 und 1440 Pixeln.
Vollständige Prüfergebnisse und das tatsächliche Produktionsdeployment werden
in der PR-Übergabe und im Abschluss festgehalten. Die Tests verwenden isolierte
synthetische Konten; sie bestätigen keine vollständige private Datenmigration.
