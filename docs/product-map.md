# WerkTag: drei Produkte, eine gemeinsame Plattform

Nick hat am 28. Oktober 2026 drei eigenständige Produkte festgelegt. Die gemeinsame
Domain `werk-tag.com` verbindet ihre Einstiege, nicht ihre fachlichen Aufträge.
Die private [Projektzentrale](https://github.com/nickhein0509-cmyk/projektzentrale/blob/main/WERKTAG.md)
enthält die vollständige Arbeitszuordnung; diese Karte bleibt auch im produktiven
Quellbestand direkt lesbar.

| ID | Produkt und Zweck | Produktauftrag und Aufgaben | Bestehender Einstieg |
| --- | --- | --- | --- |
| LERNEN | Lernapp für Schule und Gesellenprüfung | [werktag-lernen](https://github.com/nickhein0509-cmyk/werktag-lernen) | `/` |
| ASSISTENT | Persönliche Dokumentation und Aufzeichnungen | [werktag-assistent](https://github.com/nickhein0509-cmyk/werktag-assistent) | `/assistenz` |
| MATERIAL | Materialliste für praktische Arbeit im Außeneinsatz | [werktag-materialliste](https://github.com/nickhein0509-cmyk/werktag-materialliste) | `/assistenz/components` |
| PLATTFORM | Gemeinsamer Projekteinstieg, Konto, Routing und Integration | [Projektzentrale](https://github.com/nickhein0509-cmyk/projektzentrale) | `/projekte`, `/konto` |

Die drei Produkt-Repositories sind privat. Sie enthalten Produktauftrag,
Arbeitsvertrag, Aufgabenformulare und Übergaben. **Der laufende Anwendungscode
liegt derzeit weiterhin hier in `werktagshk`.** Es gibt noch einen gemeinsamen
Build und eine gemeinsame Veröffentlichung. Die technische Herauslösung in
unabhängig baubare und bereitstellbare Anwendungen ist offen; ein neues
Repository allein bewirkt diese Trennung nicht.

## Codezuordnung für jeden Auftrag

| Bereich | Aktuelle Dateien und Verträge | Geteilte Abhängigkeiten |
| --- | --- | --- |
| LERNEN | `src/App.tsx`, Lernkomponenten in `src/components`, `src/content`, `src/practice-expansion.ts`, `src/lib/learning.ts`, `cloud-practice.ts`, `cloud-knowledge.ts`, `sync.ts`; Lern-RPCs und deren Migrationen | Supabase-Konto und Plattformnavigation |
| ASSISTENT | `assistance.html`, GPS-/Health-/Statistik-/Kontextmodule in `public/assistance-assets`, `api/assistenz.mjs`, Assistenzteile von `supabase/functions/assistance`, `health-sync` | Aktuelle Sitzungsbrücke und Cloud-Gateway |
| MATERIAL | `components.html`, Katalogteile in `supabase/functions/assistance/catalog.mjs`, `scripts/materialize-catalog-cloud.mjs`, geschützte Katalogressourcen außerhalb von Git | Aktuelle Assistenzsitzung, Gateway und unveränderliche Ressourcenpfade |
| PLATTFORM | `src/main.tsx`, `src/components/ProjectHub.tsx`, `src/components/AccountPage.tsx`, `src/assistance-entry.ts`, `server/assistance-cloud.mjs`, `vite.config.ts`, `vercel.json`, CI und gemeinsame Migrationen | Änderungen können mehrere Produkte betreffen; einen verantwortlichen Integrator benennen |

Die Karte ist eine Zuständigkeitsgrenze, keine Berechtigung für pauschale
Änderungen an jedem genannten Verzeichnis. Die tatsächlichen Imports, Verträge
und betroffenen Tests vor einer Änderung lesen.

## Arbeitsbeginn und Übergabe

1. Produkt-ID und konkrete Aufgabe festhalten. `PRODUCT.md` des Produktbereichs,
   diese Karte, `AGENTS.md` und die betroffenen Quellverträge lesen.
2. Aktuellen Remote-HEAD und Arbeitsbaum prüfen. Eigenen Aufgabenbranch und
   separate Arbeitskopie gemäß [Parallel-Workflow](parallel-work.md) anlegen.
3. Solange die Implementierung hier liegt, den Code-PR hier öffnen und die
   Produktaufgabe gegenseitig verlinken. Kein ganzer Quellbaum wird zur vermeintlichen
   Trennung in drei Repositories kopiert.
4. Gemeinsame Anmeldung, Routing, Datenverträge und Release-Infrastruktur einem
   Integrator zuordnen. Die betroffenen Produkte mitprüfen.
5. Ergebniscommit, tatsächlich ausgeführte Prüfungen, offene Abhängigkeiten und
   Bereitstellungsstatus getrennt übergeben. Ein Auftrag an einem Produkt ist
   keine stillschweigende Änderung an allen Produkten.

## Daten und fachliche Grenzen

- Lernprioritäten, Prüfungsmodus und Lernspiel-Roadmap gehören zur Lernapp.
  Materialliste und Assistent haben eigene Anforderungen.
- Die private Schul-/Prüfungsquellensammlung ist nicht die Materialliste für
  die Arbeit draußen. Originale und persönliche Lernakten bleiben an ihren
  bestehenden privaten Orten.
- Lernstände, persönliche Assistenzaufzeichnungen und Materialdaten sind
  getrennte Datenbereiche. Eine gemeinsame Anmeldung erlaubt keinen beliebigen
  Transfer zwischen ihnen.
- Der Assistent hat bestehende GPS-/Tagesjournalfunktionen. Vollständige automatische
  Dokumentation ist eine Produktrichtung; externe AI ist derzeit nicht angebunden.
- Geschützte Katalogdaten, Originalunterlagen, Geheimnisse und persönliche
  Aufzeichnungen gehören auch bei privaten Produkt-Repositories nicht in Git.

## Abnahme einer späteren technischen Herauslösung

Die Zuordnung erst dann auf ein neues Implementierungsrepository ändern, wenn
dessen eigenständiger Build, betroffene Auth-/Logout-Abläufe, Daten-/Ressourcenvertrag,
Migration und Rückweg, Domainrouting sowie tatsächliche Bereitstellung geprüft
sind. Bestehende Links und Daten erhalten. Neue Zielpfade oder separate
Deployments niemals als schon vorhanden dokumentieren.

Ausgangsstand dieser Karte: Version 0.10.1,
`0a936b5275de84d549fe4ef72016ac5c458ce4ca`. Vor jeder Umsetzung frisch prüfen.
