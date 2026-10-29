# WerkTag · Lernapp, Assistent und Materialliste

WerkTag besteht aus **drei eigenständigen Produkten** unter einer Domain:

| Produkt | Zweck | Produktbereich | Laufender Einstieg |
| --- | --- | --- | --- |
| Lernapp | Schule und Gesellenprüfung | [werktag-lernen](https://github.com/nickhein0509-cmyk/werktag-lernen) | [Lernen](https://werk-tag.com/) |
| Assistent | Persönliche Dokumentation und Aufzeichnungen | [werktag-assistent](https://github.com/nickhein0509-cmyk/werktag-assistent) | [Assistent](https://werk-tag.com/assistenz) |
| Materialliste | Material und Komponenten für die praktische Arbeit draußen | [werktag-materialliste](https://github.com/nickhein0509-cmyk/werktag-materialliste) | [Materialliste](https://werk-tag.com/assistenz/components) |

Die Produktbereiche sind privat und enthalten Auftrag, Zuständigkeiten und
Aufgaben. **Dieser bisherige Repositoryname bleibt als gemeinsame produktive
Codebasis erhalten.** Build, Anmeldung und Teile der APIs sind noch gekoppelt;
eine unabhängige technische Bereitstellung ist noch nicht umgesetzt.
Die [Produkt- und Eigentümerkarte](docs/product-map.md) erklärt für jeden Chat,
wo er beginnen und welche Dateien er bearbeiten soll. `/projekte` und `/konto`
sind gemeinsame Plattformdienste. Die bisherige Historie bleibt erhalten.

Der [Assistent 0.13.0](docs/assistant-workspace.md) bietet eine eigene Übersicht,
private Notizen und Aufgaben mit Fälligkeit, Suche über gewählte Zeiträume und
Bedienung auf Handy und Desktop. Manuelle Einträge funktionieren unabhängig von
GPS. Die [verknüpfte Tageszeitachse](docs/assistant-timeline.md) zeigt Wege,
Aufenthalte und Aufzeichnungslücken neben der Karte. Freddy lässt sich geschützt
prüfen und bei bestehender Verbindung manuell abrufen; Einrichtung und tatsächlicher
Import werden getrennt angezeigt. Bestehende Health-Werte und Tagesstatistik bleiben erhalten.
Die [Kartenhintergründe](docs/assistant-map.md) lassen sich zwischen OpenFreeMap
und OpenStreetMap wechseln. Der bisher fehlende Herkunftshinweis für OSM-Kacheln
wird ausschließlich als Domain gesendet; private Links bleiben geschützt.

## Lernapp

Ein neuer Lernbuddy für Sanitär, Heizung, Klima/Lüftung und WiSo. Die responsive
Web-App verbindet eine technische Werkstattgestaltung mit kurzen Übungsaufgaben,
nachvollziehbaren Lösungswegen und einem persönlichen Lernrhythmus.

**Aktueller Fokus:** Nicks Gesellenprüfung Teil 2 am 7. Dezember 2026.
Die Oberfläche baut auf dem gewählten Flow-Design auf. Direkte Einstiege nach
Arbeitsplanung, Systemanalyse/Instandhaltung und WiSo führen zu den Übungen.
Der [Prüfungsrahmen](docs/exam-blueprint.md) beschreibt die fachliche Zuordnung
und die Grenzen. Die [Produktanweisung](docs/product-direction.md) hält die
spätere erwachsene Lernreise mit Werkstattgeschichte, Meilensteinen, Stufen und
fachlichen Minispielen fest; diese Funktionen werden jetzt noch nicht gebaut.

Gestaltung ansehen: [Desktop](docs/screenshots/desktop.png),
[Handy](docs/screenshots/mobile.png) und [Aufgabe](docs/screenshots/exercise.png).
Prüfungsbereich: [Desktop](docs/screenshots/exam-mode.png) und [Handy](docs/screenshots/exam-mobile.png).
Werkzeugkoffer: [Formelwerkstatt](docs/screenshots/formula-workbench.png) und [Handy](docs/screenshots/formula-workbench-mobile.png).
Aktueller Ausbau: [21 Formeln](docs/screenshots/formula-expanded.png),
[Handy](docs/screenshots/formula-expanded-mobile.png),
[Schwierigkeitsauswahl](docs/screenshots/library-difficulty.png) und
[Prüfungsvorbereitung](docs/screenshots/exam-difficulty-setup.png).
Privates Aufgabenverzeichnis mit rein synthetischen Beispielen:
[Desktop](docs/screenshots/private-bank-desktop-synthetic.png) und
[Handy](docs/screenshots/private-bank-mobile-synthetic.png).
Fachwissen mit rein synthetischem Inhalt:
[Übersicht](docs/screenshots/knowledge-overview-desktop-synthetic.png),
[Reader](docs/screenshots/knowledge-reader-desktop-synthetic.png) und
[Handy](docs/screenshots/knowledge-reader-mobile-synthetic.png).

## Gemeinsame Plattform und parallele Arbeit

**Supabase-Umzug beauftragt (29.10.2026):** Alle WerkTag-Daten sollen vom bisherigen
Projekt `hrqaxsbddpmphblmoyly` nach `mvkksfecimpjnytvbrrb` übertragen werden.
Die Ausführung ist derzeit mangels Zugang blockiert; keine Umschaltung erfolgt.
[Verbindliche Zuordnung, vollständiger Ablauf und Ausführungsprotokoll](docs/supabase-project-migration.md).

`/projekte` bietet Lernen, private Assistenz und Komponentenliste. `/konto` ist der gemeinsame Anmeldeeinstieg. GPS und der geschützte Katalog werden über die bestehende Supabase-Cloud bereitgestellt; private Inhalte bleiben außerhalb dieses öffentlichen Repositorys. Details: [Cloud-Assistenz](docs/cloud-assistance.md) und [Komponentenliste](docs/components.md).

Für verschiedene Chats/Works gilt: ein eigener Aufgabenbranch und eine eigene Arbeitskopie pro Auftrag, Übergabe über Pull Requests, gemeinsame Prüfung im Release-Branch. [Anleitung und Starthelfer](docs/parallel-work.md). `main` ist der geprüfte gemeinsame Veröffentlichungsstand.

## Was die Lernapp bietet

- Übersicht mit echten Tageszielen, bearbeiteten Aufgaben und Lerntagen.
- 204 eigene Übungen mit Hinweisen und Erklärungen: die bisherigen 108
  Modellaufgaben und 96 Fälle für Teil 2. Je 32 Fälle zu
  Arbeitsplanung, Systemanalyse/Instandhaltung und WiSo. Vier WiSo-Fälle
  beziehen sich auf konkret gelesene Primärquellen.
- Prüfungsfälle erscheinen zuerst. Prüfungsbereich, Aufgabenart, Lernfeld, Suchbegriff,
  Merkliste und vier redaktionelle Schwierigkeitsstufen lassen sich kombinieren.
  Leicht/schwer sortieren; „Weiterlernen“ folgt der gewählten Auswahl.
  Die [Einstufungsregeln](docs/difficulty-rubric.md) beschreiben die Anforderungen.
- 631 private aktuelle Fragen über das vorhandene Supabase-Lernkonto: alle einzeln
  inhaltlich geprüft und nach Aufgabenart sowie vier Stufen eingeordnet. Einzelne
  Aufgaben direkt öffnen oder nach Thema, Art und Stufe eine Runde starten.
  Die bisherigen Kategorien Basis/Anwendung bleiben zusätzlich verfügbar.
  Auswahl, Zahlen, Kurzantwort und Selbstvergleich werden weiter auf dem Server
  bewertet; gespeicherte Runden und Entwürfe bleiben erhalten.
  32 korrigierte Inhaltsfassungen erhalten die alten Versionen. 23 Fragen tragen
  noch gezielte Quellen-/Bildvorbehalte. Die [vollständige Inhaltsauswertung](docs/private-bank-release.md)
  beschreibt Umfang und Grenzen; Zugriff und Rechenwertebereiche bleiben geschützt.
- Fachwissen aus dem vorhandenen privaten Lernkonto: 112 Fachartikel, 111 Begriffe
  und 15 Lernfelder. Suche und Filter nach Thema, Inhalt und Lernfeld führen zu
  Zusammenfassung, Zusammenhang, Formeln, Beispiel und Übungsweg. Volltexte öffnen
  sich ausdrücklich; Nachschlagen kann bei offenen Aufgaben als Hilfe zählen.
  Es erzeugt keinen Beherrschungsnachweis. Der [ausführliche Wissensstand](docs/knowledge-state.md)
  beschreibt fachliche Abdeckung, Quellenstatus und sinnvolle nächste Vertiefungen.
- Lernwerkstatt mit Suche, Themenfiltern und Merkliste.
- Rechenaufgaben, Kontextaufgaben und Wissensfragen getrennt filtern.
  Großes Rechenblatt mit Teilschritten, eigenen Browsernotizen und Taschenrechner.
- Prüfungsbereich mit nummeriertem Arbeitsblatt nach dem Aufbau bekannter
  Altprüfungen. Sechs eigene Aufgaben je Runde; Lernhilfen über „Prüfungsmodus“
  ausschaltbar. Eigener Rechner und freier Rechenweg im Prüfungsmodus.
  Die Uhr läuft vom ausdrücklichen Start bis zur Abgabe, auch bei Navigation.
  Alle Lösungen erst nach Abgabe, keine amtlichen Punkte oder Zeitvorgaben.
- Wiederholung: zuletzt falsche Antworten sofort; zuletzt richtige Antworten
  nach 72 Stunden. Das ist eine einfache Produktregel, kein validiertes Lernmodell.
- Frei einteilbarer Lernplan und ein Tagesziel von einer bis zehn Aufgaben.
- Formelwerkstatt mit 21 Formelfamilien und 64 Umstellungen, Suche und Bereichen.
  Wärme, Strömung, Druck, Geometrie, Ausdehnung, trockene Mischung und elektrische
  Grundmodelle: automatische Einheitenumrechnung und nachvollziehbarer Rechenweg.
  Eine [erweiterbare Auswahl](docs/formula-expansion.md), keine vollständige Formelsammlung.
- Validierter JSON-Export und -Import von Lernstand, Merkliste und Tagesziel.
  Ein Import ersetzt Daten erst nach ausdrücklicher Bestätigung in der App.
- Höhere Lernstandsformate sind gegen Überschreiben geschützt, auch wenn sie
  während einer offenen Aufgabe eintreffen. Unveränderte Rohdaten bleiben exportierbar.

Der Fortschritt startet bei null. Als „zuletzt richtig“ zählt die letzte
abgegebene Antwort auf eine Aufgabe, nicht nachgewiesene berufliche Kompetenz.
Das Tagesziel zählt unterschiedliche bearbeitete Aufgaben pro lokalem
Kalendertag. Wiederholtes Klicken erhöht es nicht künstlich.

## Atelier 0.14.0

Die gemeinsame Website nutzt jetzt lokal ausgelieferte Manrope-Typografie, warme Arbeitsflächen, kupferne Leitungszeichnungen und eine ruhigere Navigation. Lernapp, Projektwahl, Konto und Assistent erhalten eine zusammenhängende Gestaltung. [Änderungen und Prüfgrenzen](docs/atelier-release.md).

## Lokal entwickeln

Voraussetzung: Node.js 24 (siehe `.nvmrc`) und npm. Die Modellübungen funktionieren
ohne externe Dienste. Für das vorhandene Lernkonto `.env.example` nach `.env.local`
kopieren und Supabase-URL sowie einen Publishable Key eintragen. Private Fragen
werden ausschließlich nach Anmeldung und serverseitiger Freigabe geladen.

```sh
npm ci
npm run dev
```

[Lokale Produktrouten und Grenzen privater Dienste](docs/local-development.md): `/assistenz` und `/assistenz/components` öffnen auch lokal die richtigen Einstiege.

```sh
npm run build     # TypeScript und Produktionsbundle
npm run test      # Lernlogik, Importvalidierung, Rechnungen
npm run test:e2e  # echte Browserinteraktionen und Accessibility
npm run check    # alle drei Prüfungen
```

Die Browserprüfungen verwenden eine vorhandene Chromium-Installation oder den
Playwright-Browser. Unter Linux ist optional
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/pfad/zu/chromium` möglich. Ohne installierten
Browser einmal `npx playwright install --with-deps chromium` ausführen; die
Installation von Betriebssystempaketen benötigt entsprechende lokale Rechte.
Im vorbereiteten Cloud-System ist Chromium vorhanden. Die Tests starten und
beenden ihren eigenen Entwicklungsserver und verändern keine echten Lerndaten.

## Projektstruktur

- `src/App.tsx`: Navigation, Übersicht, Aufgaben, Plan und Werkzeuge.
- `src/styles.css`: responsives Gestaltungssystem und zugängliche UI-Zustände.
- `src/data.ts`: eigene Aufgaben mit getrennten Hinweisen und Lösungswegen.
- `src/content`: eigene neue Fallaufgaben und separat belegte WiSo-Rechtsfälle.
- `src/exam.ts`: redaktionelle Schwerpunktzuordnung ohne Änderung alter Antworten.
- `src/components/FlowDashboard.tsx` und `src/design`: Flow-Oberfläche und Tokens.
- `src/components/FormulaWorkbench.tsx` und `src/lib/formulas.ts`: Formelwahl,
  Umstellungen und Einheitenmodelle ohne Einfluss auf den Lernstand.
- `src/lib/learning.ts`: versionierter Lernstand, Validierung und Wiederholung.
- `tests/e2e`: Browserprüfungen mit isolierten Datensätzen.
- `.agents/skills`: zwei lokale Skills für Inhalte und Produktdesign.
- [Plugin-Fähigkeiten](docs/plugin-capabilities.md): verwendbare Plugins und ihre
  tatsächlichen Grenzen.

## Daten und Grenzen

Die Modellübungen speichern zunächst in diesem Browser (`localStorage`). Gast-
und Kontolernstände verwenden getrennte Schlüssel. Mit dem Lernkonto lassen sich
diese Modellübungen über `shk_learning_progress` verlustfrei synchronisieren.
Die bisherigen privaten Fragen und ihre Antworten verbleiben in den ursprünglichen
Supabase-Tabellen und werden über die vorhandenen authentifizierten RPCs verwendet. Der Browser kann Speicher verweigern oder
löschen. Exportiere wichtige Lerndaten regelmäßig. Ein erkannter beschädigter
Datensatz wird beim nächsten ausdrücklichen Speichern zuerst unter einem
Wiederherstellungsschlüssel gesichert; Rohdaten lassen sich separat exportieren.

Die Antworten der eigenen Modellübungen liegen im ausgelieferten JavaScript.
Private Fragen werden erst zur jeweiligen Runde geladen und serverseitig bewertet.
Der Prüfungsmodus ist eine Selbstübung mit ausgeblendeten Lernhilfen; die
eigenen Antwortschlüssel bleiben im Browsercode. Der private Fragenbestand
verwendet weiterhin seine vorhandenen Freigaberegeln. Die App enthält keine private Literatur, alte
Prüfungsunterlagen oder wiederhergestellte persönliche Lerngeschichte. Die
Modellaufgaben und Formeln ersetzen keine aktuellen Normen, Herstellerunterlagen
oder fachgerechte Anlagenplanung. Ein KI-Chat ist noch nicht angebunden.

Rechenentwürfe der Modellaufgaben werden separat nach Gast/Konto und Aufgabe
in diesem Browser gespeichert und zählen nicht als Versuch. Sie sind nicht im
Lernstandexport oder der Cloud-Synchronisierung enthalten. Die laufende
Prüfungsrunde samt Notizen und Zeit wird im aktuellen Browser-Tab gesichert;
die Uhr läuft bei Neuladen weiter und eine bereits abgegebene Runde wird nicht
erneut verbucht. Private zusätzliche Rechenblätter bleiben nur in der geöffneten
Bestandsansicht erhalten und werden nicht an den Server gesendet.

Der Code ist für Nicks Projekt gedacht. Eine öffentliche Bereitstellung, Lizenz
oder Freigabe privater Quellen ist damit nicht festgelegt. GitHub Actions ist für
die automatischen Prüfungen vorbereitet; eine erfolgreiche Ausführung auf GitHub
muss dort separat bestätigt werden. Die Veröffentlichung erfolgt im bestehenden Vercel-Projekt. Das Projekt ist mit diesem Repository verbunden; Pushes auf `main` sind der
vorgesehene Veröffentlichungsweg. Den tatsächlichen Deploymentstatus separat
prüfen; siehe [Betriebsanbindung](docs/deployment-recovery.md).
