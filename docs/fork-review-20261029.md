# GitHub-Forks: Bewertung und konkrete WerkTag-Integration

Stand: 29. Oktober 2026 (UTC). Produkt **PLATTFORM**.
[Aufgabe](https://github.com/nickhein0509-cmyk/projektzentrale/issues/20).
Basis `e41129ebb3f5726a33505d31bc42ea0e4f538904`, eigener Branch
`feat/fork-review-20261029` in separater Arbeitskopie.

## Urteil

Viele Forks sind als bewusstes Experimentierarchiv in Ordnung. Als ungepflegte
Lesezeichensammlung bringen sie wenig zusätzlichen Nutzen: **Star/Listen für
Nachschlagen, Fork für eigene Änderungen und Beiträge, Paketabhängigkeit für
verwendete Bibliotheken**. Die Zahl allein ist kein Qualitätsproblem und verursacht
nicht automatisch laufende Kosten. Installationen, eigene Änderungen, Updates,
CI-Ausführungen und zusätzliche Dienste erzeugen den tatsächlichen Aufwand.

Die GitHub-Verbindung zeigte 26 eigene Repositories: sechs eigene Projekt-/
Organisationsrepositories und 20 öffentliche Forks. Die Forks wurden alle am
29.10.2026 angelegt; zehn davon erst zwischen 14:46 und 14:52 UTC.
Bei der Bestandsaufnahme hatten **alle 20 Standardbranches null eigene zusätzliche
Commits**. 18 waren mit dem jeweiligen Upstream-Standardbranch identisch;
`opencode` lag 16, `openbot` 35 Commits zurück. Andere Zweige wurden nicht auf
eigene Arbeit untersucht. Die Werte sind ein datierter Snapshot, kein Dauerstatus.
Ein frisches Fork-Erstellungsdatum bedeutet nicht, dass der enthaltene Code neu ist.

Die fünf privaten Projekt-/Organisationsrepositories und das öffentliche
`werktagshk` sind keine Duplikate dieser Fremdprojekte. Ihr Zweck ist Produktauftrag,
Koordination oder Implementierung. Der produktive Code bleibt in `werktagshk`;
Lernen, Assistent und Materialliste werden durch diese Arbeit nicht neu verteilt.

## Einordnung aller 20 Forks

Lizenzhinweise beruhen auf GitHubs Metadaten und, bei den tatsächlich verwendeten
Referenzen bzw. Auffälligkeiten, gelesenen Lizenz-/README-Dateien. Das ist keine
vollständige Lizenz- oder Sicherheitsprüfung jedes Unterverzeichnisses oder jedes
verlinkten Fremdprojekts. Eine Sammlungslizenz gilt nicht pauschal für ihre Links.

| Fork / Herkunft | Lizenzhinweis | Entscheidung für WerkTag |
| --- | --- | --- |
| [awesome-remote-job](https://github.com/nickhein0509-cmyk/awesome-remote-job) · [lukasz-madon/awesome-remote-job](https://github.com/lukasz-madon/awesome-remote-job) | CC0 laut README; API ohne Zuordnung | **Persönliche Referenz** — Job-/Remote-Arbeitsliste; kein Bestandteil der WerkTag-Laufzeit. Star/Leseliste genügt. |
| [open-source-ios-apps](https://github.com/nickhein0509-cmyk/open-source-ios-apps) · [dkhamsing/open-source-ios-apps](https://github.com/dkhamsing/open-source-ios-apps) | CC0-1.0 für die Liste | **Später gezielt** — Beispiele für vorhandene native iOS-App: Health, Location, Tasks. Jede verlinkte App hat ihre eigene Lizenz; keine pauschale Übernahme. |
| [awesome-openclaw-skills](https://github.com/nickhein0509-cmyk/awesome-openclaw-skills) · [VoltAgent/awesome-openclaw-skills](https://github.com/VoltAgent/awesome-openclaw-skills) | MIT für die Liste | **Referenz, einzeln prüfen** — Katalog fremder Automationen, keine WerkTag-Funktion. Nur konkrete Skills mit Quelle, Berechtigungen, Datenzugriff und Tests auswählen. |
| [awesome-ios](https://github.com/nickhein0509-cmyk/awesome-ios) · [vsouza/awesome-ios](https://github.com/vsouza/awesome-ios) | MIT für die Liste | **Später gezielt** — iOS-Bibliotheken für Swift-/Health-/Location-Arbeit auswählen, sobald eine konkrete Lücke besteht. Kein Anlass für neue Pakete im Webbuild. |
| [github-cheat-sheet](https://github.com/nickhein0509-cmyk/github-cheat-sheet) · [tiimgreen/github-cheat-sheet](https://github.com/tiimgreen/github-cheat-sheet) | MIT | **Arbeitsreferenz** — Vergleich zwischen Forks, Issues/PR-Verknüpfung, Git-Hilfen. WerkTags Worktree-/PR-Verfahren existiert bereits. |
| [awesome-scalability](https://github.com/nickhein0509-cmyk/awesome-scalability) · [binhnguyennus/awesome-scalability](https://github.com/binhnguyennus/awesome-scalability) | MIT | **Jetzt genutzt** — Performance messen und Ladegrenzen definieren; daraus konkrete Route-Trennung und Build-Budget. Keine Microservices/Kubernetes hinzufügen. |
| [RuView](https://github.com/nickhein0509-cmyk/RuView) · [ruvnet/RuView](https://github.com/ruvnet/RuView) | MIT laut API; Teilkomponenten gesondert prüfen | **Separates Experiment** — WiFi-/CSI-Sensorik mit Hardware/Firmware; kein fertiger Health-Ersatz. README kennzeichnet Teile als synthetisch/unvalidiert. Nicht in persönliche Messdaten mischen. |
| [awesome-mac](https://github.com/nickhein0509-cmyk/awesome-mac) · [jaywcjlove/awesome-mac](https://github.com/jaywcjlove/awesome-mac) | CC0-1.0 für die Liste | **Persönliche Referenz** — Softwarekatalog für macOS, keine einbaubare App-Bibliothek. Gelistete Produkte haben eigene Lizenzen und Preise. |
| [Awesome-Hacking](https://github.com/nickhein0509-cmyk/Awesome-Hacking) · [Hack-with-Github/Awesome-Hacking](https://github.com/Hack-with-Github/Awesome-Hacking) | CC0-1.0 für die Liste | **Gezielte Prüfreferenz** — AppSec-/API-/Node-Sicherheitsreferenzen; keine neue Laufzeitabhängigkeit und kein durchgeführter Pentest. |
| [the-book-of-secret-knowledge](https://github.com/nickhein0509-cmyk/the-book-of-secret-knowledge) · [trimstray/the-book-of-secret-knowledge](https://github.com/trimstray/the-book-of-secret-knowledge) | MIT | **Arbeitsreferenz** — CLI-/Betriebsnachschlagewerk. Stand des Default-Branches von 2024; Befehle und externe Links vor Anwendung prüfen. |
| [TradingAgents](https://github.com/nickhein0509-cmyk/TradingAgents) · [TauricResearch/TradingAgents](https://github.com/TauricResearch/TradingAgents) | Apache-2.0 | **Außerhalb WerkTag** — Finanzanalyse-Framework mit Anbietern und eigenen Daten-/Kostenverträgen. Für einen getrennten Trading-Auftrag aufheben. |
| [opencode](https://github.com/nickhein0509-cmyk/opencode) · [anomalyco/opencode](https://github.com/anomalyco/opencode) | MIT | **Entwicklungswerkzeug** — Coding-Agent außerhalb des Produktbundles. Fork erst pflegen, wenn eigene Patches oder Beiträge vorgesehen sind. |
| [superpowers](https://github.com/nickhein0509-cmyk/superpowers) · [obra/superpowers](https://github.com/obra/superpowers) | MIT | **Gezielte Arbeitsreferenz** — Verifikation vor Erfolgsmeldungen und isolierte Arbeitszweige passen bereits zum Projekt. Keine konkurrierenden globalen Workflows automatisch installieren. |
| [hallmark](https://github.com/nickhein0509-cmyk/hallmark) · [Nutlope/hallmark](https://github.com/Nutlope/hallmark) | MIT | **Jetzt als Prüfprinzip genutzt** — Bei Änderungen vorhandene Links/Bedienung erhalten und im Browser prüfen. Keine zweite Themesammlung oder Generatorpipeline übernehmen. |
| [impeccable](https://github.com/nickhein0509-cmyk/impeccable) · [pbakaus/impeccable](https://github.com/pbakaus/impeccable) | Apache-2.0 | **Jetzt genutzt** — Gelesene optimize-/harden-Referenzen: bedarfsgesteuertes Laden, Messung, verständliche Fehler- und Ladezustände. Eigenständige Implementierung. |
| [DeepTutor](https://github.com/nickhein0509-cmyk/DeepTutor) · [HKUDS/DeepTutor](https://github.com/HKUDS/DeepTutor) | Apache-2.0 | **Später gezielt** — Quellengestützte Lernabläufe/RAG als Referenz für LERNEN. Gesamte Python-/Next-/Modellanbieterplattform passt nicht als kleines Zusatzpaket. |
| [skills](https://github.com/nickhein0509-cmyk/skills) · [expo/skills](https://github.com/expo/skills) | MIT | **Aktuell anderer Stack** — Expo- und React-Native-Skills. WerkTag nutzt React/Vite plus native Swift-App; kein Grund, dafür auf Expo umzubauen. |
| [jailbreaks](https://github.com/nickhein0509-cmyk/jailbreaks) · [togg53192-cmd/jailbreaks](https://github.com/togg53192-cmd/jailbreaks) | Keine Lizenz erkannt/Root-Lizenz nicht gefunden | **Nicht integrieren** — Prompt-/Policy-Override-Sammlung ohne nachgewiesenen Produktnutzen; macht Verhalten nicht verlässlicher. Keine fremden AGENTS-/Systemregeln übernehmen. |
| [macro](https://github.com/nickhein0509-cmyk/macro) · [macro-inc/macro](https://github.com/macro-inc/macro) | AGPL-3.0 | **Produktreferenz** — Verknüpfte Notizen/Aufgaben und Suche als Ideenquelle. SolidJS/Rust-Gesamtsystem ist groß; direkte Codeübernahme erfordert AGPL-Prüfung. |
| [openbot](https://github.com/nickhein0509-cmyk/openbot) · [nightly-labs/openbot](https://github.com/nightly-labs/openbot) | PolyForm Noncommercial 1.0.0 (LICENSE gelesen) | **Separates Entwicklungswerkzeug** — Lokaler Agenten-Desktop, kein Web-App-Baustein; direkte Übernahme für kommerzielles WerkTag nicht durch die vorhandene Lizenz gedeckt. |

## Was konkret übernommen wurde

**Konzepte, keine kompletten Fremdanwendungen oder kopierten Module.** Es wurde
keine zusätzliche Laufzeitabhängigkeit, kein Agenten-Hook und kein externer Dienst
installiert. Auch die Anweisungen fremder Repositories wurden nicht automatisch
zu WerkTag-Regeln gemacht.

1. **Bedarfsgesteuerte Ladewege** aus der Performance-Leseliste und Impeccables
   Optimierungsreferenz: `src/main.tsx` lädt Lernapp und Kontoseite dynamisch.
   `/projekte` startet keine Supabase-Kontositzung und lädt keine Übungen.
   `/konto` erhält den benötigten Konto-Client, aber keine Lerninhalte.
2. **Nutzbare Lade- und Fehlerzustände** nach dem Robustheitsprinzip aus
   Impeccable: Der bereits gestartete App-Einstieg zeigt beim Nachladen einen
   verständlichen Status. Bei einem fehlgeschlagenen Bereichsimport bleiben
   „Seite neu laden“ und „Zur Projektauswahl“ nutzbar. Kein automatischer
   Reload-Kreislauf; kein Löschen von Browserdaten und keine technischen
   Fehlermeldungen mit internen Details in der Oberfläche.
3. **Messung und Erhalt der Funktionen**: Ein Build-Budget verfolgt die statischen
   Importketten einschließlich geteilter Abhängigkeiten. Die Projektauswahl darf
   keine Lern-/Kontoinitialisierung erhalten, das Konto keine Lerninhalte.
   Obergrenzen: 90 KiB gzip für Projekte, 160 KiB für Konto. Die CI baut dafür
   mit synthetischer Supabase-Konfiguration, damit die Clientbibliothek nicht
   durch fehlende Konfiguration aus der Messung verschwindet.
   Hallmarks Prinzip des Funktionserhalts wird mit den bestehenden Link-/
   Kontotests und zusätzlichen Navigation-, Tastatur- und Fehlerregressionen
   angewandt; dessen Generator und `sloplint` wurden nicht installiert.

Die Vorlage ist **kein Performance-Versprechen in Sekunden**. Sie prüft einen
konkreten, reproduzierbaren Anteil der Ladearbeit.

## Gemessener Unterschied

Zwei Produktionsbuilds mit identischer synthetischer Supabase-Konfiguration,
Node 24 und denselben gesperrten Abhängigkeiten. Isolierter Chromium-Kontext pro
Pfad, jeweils bis zur sichtbaren Ansicht und abgeschlossenen initialen Requests.
Gezählt werden die tatsächlich angeforderten JavaScript-Dateien. Die gzip-Spalte
ist die Summe der lokal mit Node gzip-komprimierten Build-Dateien, nicht ein
Mitschnitt der Kompression eines Vercel-CDNs. CSS, Fonts, Bilder und API-Daten sind
nicht in diesen Zahlen enthalten.

| Einstieg | JS vorher, roh | JS nachher, roh | gzip vorher | gzip nachher | gzip-Ersparnis |
| --- | ---: | ---: | ---: | ---: | ---: |
| `/projekte` | 813.927 B | 235.687 B | 222.914 B | 74.221 B | 66,7 % |
| `/konto` | 813.927 B | 472.981 B | 222.914 B | 136.449 B | 38,8 % |

Das Konto benötigt durch die gezielte Aufteilung sieben kleinere JS-Dateien statt
fünf; die Projektauswahl drei statt fünf. Keine Aussage über reale Core Web Vitals,
Handynetz-Latenz oder einen schnelleren Kartenrenderer. Die bestehende große,
bereits separat geladene Kartenbibliothek bleibt außerhalb dieses Auftrags.

## Prüfungen und Veröffentlichung

- Produktionsbuild und Budgetprüfung inklusive fünf gezielter Regressionen für
  transitive Abhängigkeiten, gemeinsame Dateien, Kreise, fehlende Einträge,
  ungewollte Imports und überschrittene Größenlimits.
- 37 gezielte Chromiumtests für Konto/Callback/Verknüpfung, Projekte und neue
  Ladezustände erfolgreich. Erzwungene Importfehler und erfolgreiche bewusste
  Wiederholung erhalten den isolierten lokalen Lernstand. 320px-Überlauf und
  automatische WCAG-A/AA-Prüfung der Lade-/Fehleransichten ohne Befund.
- Drei bestehende Prüfungsuhr-Tests pausierten auch Reacts Lade-Timer, bevor die
  dynamische Ansicht erscheinen konnte. Der Testaufbau wartet jetzt auf die
  Hauptnavigation und friert dann die Prüfungsuhr ein; beim erneuten Laden einer
  bereits abgegebenen Runde läuft der Browser-Timer wieder. Alle bisherigen
  Zeit-/Entwurfs-/Abgabeassertionen bleiben erhalten; alle vier Tests der Datei
  bestehen. Die neuen Ladezustände werden auch in die Safari-Prüfung aufgenommen.
- Vollständiger `npm run check`, mobile Safari-CI und tatsächliche Integration/
  Produktionsbereitstellung werden am finalen Ergebniscommit im PR dokumentiert.
  Ältere Prüfläufe gelten nicht als Nachweis für spätere Codeänderungen.

Betroffene Verträge: gemeinsamer Web-Einstieg und Build/CI. Die geschützten
Assistenz-/Materialrouten, Supabase-Funktionen, Datenbank, Keys und persönlichen
Aufzeichnungen werden nicht verändert. Keine private Datenmigrationsabnahme,
kein neuer Health-/GPS-Import, keine KI-Aktivierung und kein physischer iPhone-Test.
Veröffentlichung ist im laufenden Nutzerauftrag autorisiert; der tatsächliche
Status wird getrennt geprüft. Rückweg: Code-Revert per PR, keine Datenmigration.

## Empfehlung für die weitere Sammlung

- Nur wenige aktive Forks pflegen, z. B. drei bis fünf mit einer konkreten Aufgabe,
  verantwortlichem Bearbeiter und geplanten eigenen Änderungen. Das ist eine
  praktische Empfehlung, keine technische Obergrenze.
- Reine Referenzen in GitHub-Listen gruppieren: Entwicklung, Design, iOS,
  Betrieb/Sicherheit und persönliche Interessen. Hier wurde nichts gelöscht,
  archiviert, synchronisiert oder an deinen Stars verändert.
- Vor einer Übernahme Quelle und Commit, Zweck, Lizenz, Daten-/Berechtigungsbedarf,
  Abhängigkeiten, Test und Updateverantwortung notieren. Einen Fork zu besitzen
  überträgt weder Urheberschaft noch zusätzliche Nutzungsrechte.
- Macro ist nicht grundsätzlich ungeeignet; AGPL-Code erfordert eine bewusste
  Prüfung der Weitergabe-/Quellcodepflichten, insbesondere bei geänderten
  netzwerkbereitgestellten Fassungen und kombinierten Werken. OpenBots gelesene
  PolyForm-Noncommercial-Lizenz erlaubt keine pauschale kommerzielle Übernahme.
- Fehlende Lizenz ist keine Freigabe. Ungeprüfte Skills und Prompt-Sammlungen
  nicht automatisch installieren. Neue Dienstzugänge oder laufende Kosten sind
  eigene Produktentscheidungen.

## Gelesene Grundlagen

- [Inventar mit Upstreams, Vergleichszahlen und Commit-SHAs](fork-inventory-20261029.json).
- [awesome-scalability, Principles/Performance](https://github.com/nickhein0509-cmyk/awesome-scalability/blob/c9ca9f248d4dbbde63a8460188f6324f00f34ddd/README.md)
  und [MIT-Lizenz](https://github.com/nickhein0509-cmyk/awesome-scalability/blob/c9ca9f248d4dbbde63a8460188f6324f00f34ddd/LICENSE).
- [Impeccable optimize](https://github.com/nickhein0509-cmyk/impeccable/blob/5e745ace7e151feb2a93d360d0281fe39448b857/plugin/skills/impeccable/reference/optimize.md)
  und [harden](https://github.com/nickhein0509-cmyk/impeccable/blob/5e745ace7e151feb2a93d360d0281fe39448b857/plugin/skills/impeccable/reference/harden.md), Apache-2.0.
- [Hallmark, Redesign/Funktionserhalt](https://github.com/nickhein0509-cmyk/hallmark/blob/8f6969f8922caabde9de1784959eae11ddf68073/README.md), MIT.
- [Superpowers, Verifikation](https://github.com/nickhein0509-cmyk/superpowers/blob/2ce8aa15d05bd57213e6f746f953aafb7ded7a8b/skills/verification-before-completion/SKILL.md), MIT.
- [OpenBot LICENSE](https://github.com/nickhein0509-cmyk/openbot/blob/c389f4404256e754214b6982503381778d80ed35/LICENSE)
  und [Macro LICENSE](https://github.com/nickhein0509-cmyk/macro/blob/3953a658d877ddfcd8c4724e0b5d66f02de008f3/LICENSE.txt).

GitHub-App: Repositoryliste und README-/Dateiabfragen. Weil normalisierte
Repositoryantworten Fork-Eltern und Vergleichszahlen auslassen und die Cloud-CLI
mit Forbidden antwortete, wurden öffentliche GitHub-REST-Metadaten/Compare über
Remote Desktop Commander auf Nicks Rechner gelesen. Installations-/Startskripte
der Forks wurden nicht ausgeführt. Die meisten Bewertungen sind ein gezielter
README-/Lizenz-/Architekturreview, kein vollständiges Audit aller Quellzeilen.
