# Gemeinsame PR-Integration · 29. Oktober 2026

Auftrag: alle bei Arbeitsbeginn offenen PRs prüfen, Fehler direkt korrigieren
und zusammenführen. Gemeinsame Plattformintegration für LERNEN, ASSISTENT und
MATERIAL; keine neue Produktfunktion außerhalb dieser PRs.

Basis: `ef9f8b36220914bb1d137207ca3df7d471cdb46d`, frisch geladenes `origin/main`.
Branch: `release/20261029-all-prs`, isolierte Arbeitskopie.
Besitzbereich: Änderungen der folgenden acht PRs, ihre Integrationskonflikte,
zugehörige Regressionen, CI und überholte Statusdokumentation.
Die Produktgrundlage aus Projektzentrale #14/#17 wird separat integriert.

| PR | Geprüfter Quellcommit | Bereich |
| --- | --- | --- |
| #15 | `93e27ccc457daf7d8f04246dacc1b3b14b559891` | deaktivierte KI-Grundlage |
| #17 | `a7e5f5df38fa9884eb17a89721ed8f18d972bfb9` | gemeinsame Plattformverträge |
| #18 | `f15952712abdc7296e8d2f74cd16f7a3775c173d` | recorderfähige Archive |
| #19 | `219ab8a3a3799c2dde05dcfa8114e86f760d9878` | Migrationsdokumentation |
| #21 | `4c32bd991b2b3c10d1450c9bd9dc4032bbcb0f35` | Lerneinstieg |
| #22 | `fd67eb1fe33b94c3f13e95967cea4e168acde751` | Lernstandschutz und Health |
| #23 | `3463aedc19de92b33ee97ae25e159fd173d0faa9` | reine Desktop-Designgalerie |
| #24 | `283735e22dd14d173f57f6f6569520b71c828cd9` | Assistenz-Tagesüberblick |

## Korrekturen bei der Integration

- Archiv-v1-Statistiken behalten ihre ursprüngliche Sortierprüfung. Identische
  Mess-/Empfangszeiten erfordern bei alten Archiven keine neue ID-Reihenfolge.
  Regression prüft akzeptierte Altbestände, unveränderte Daten und abgewiesene
  falsch sortierte Zeitstempel.
- Recorderjournale werden für Kontextverweise einmal pro Anfrage vorbereitet,
  einmal pro benötigtem Recorder berechnet und nach Tagen ausgeschnitten.
  Tage ohne Abschnittsverweise lösen diese Arbeit nicht aus. Regression prüft
  Mitternachtsabschnitte und dass der zweite Tag keine anderen Tage neu berechnet.
- Der KI-Endpunkt lehnt anonyme Auth-Konten vor Budgetreservierung und
  Anbieteraufruf ab; synthetische Regression bestätigt genau einen Auth-Aufruf.
- Gemeinsamer Health-Vertrag und v2-Archivimporte bleiben bei der Konfliktlösung
  erhalten. Deno wird einmal eingerichtet und prüft alle drei Edge-Einstiege.
- Die ältere Migrationsvorbereitung ist ausdrücklich historisch. PR #20 und
  öffentliche Live-Konfiguration bestätigen bereits das neue Ziel; eine erneute
  Datenübertragung wird weder gestartet noch als erforderlich behauptet.

## Bereitstellung und Grenzen

Der Merge kann die bestehende automatische Vercel-Webbereitstellung auslösen.
Supabase-Funktionen werden dadurch nicht automatisch aktualisiert: `assistance`
und `health-sync` benötigen ihren eigenen Backend-Release. Die additive
KI-Migration und Funktion `ai` bleiben ein gesonderter Einführungsschritt mit
anfangs deaktivierter Policy, konkreter Kontofreigabe und Kostenkonfiguration.
Keine neuen Secrets, Produktionsdaten, Migrationen oder kostenpflichtigen
KI-Aufrufe werden durch diese lokale Integration eingerichtet.

Nach produktiver Erzeugung von v2-Archiven muss jeder Backend-Rollback die
v2-Lesefähigkeit behalten. Vorherige Weboberfläche lässt sich unabhängig von
persönlichen Daten zurücknehmen. Die Desktopgalerie wählt keine neue App-Variante.
Physisches iPhone, persönliche Health-Importe und Nutzerstudien sind keine
Bestandteile der synthetischen automatisierten Prüfungen.
