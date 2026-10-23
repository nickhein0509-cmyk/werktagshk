# WerkTag · Dein SHK Lernbuddy

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

## Was funktioniert

- Übersicht mit echten Tageszielen, bearbeiteten Aufgaben und Lerntagen.
- 144 eigene Übungen mit Hinweisen und Erklärungen: die bisherigen 108
  Modellaufgaben und 36 neue Fälle für Teil 2. Je zwölf neue Fälle zu
  Arbeitsplanung, Systemanalyse/Instandhaltung und WiSo. Vier WiSo-Fälle
  beziehen sich auf konkret gelesene Primärquellen.
- Prüfungsfälle erscheinen zuerst. Prüfungsbereich, Lernfeld, Suchbegriff und
  Merkliste lassen sich kombinieren und gemeinsam zurücksetzen.
- Privater bisheriger Fragenbestand über das vorhandene Supabase-Lernkonto:
  Auswahl, Zahlen, Kurzantwort und Selbstvergleich, mit Bewertung auf dem Server.
  Gespeicherte Übungsrunden lassen sich fortsetzen; Entwürfe explizit speichern.
- Lernwerkstatt mit Suche, Themenfiltern und Merkliste.
- Wiederholung: zuletzt falsche Antworten sofort; zuletzt richtige Antworten
  nach 72 Stunden. Das ist eine einfache Produktregel, kein validiertes Lernmodell.
- Frei einteilbarer Lernplan und ein Tagesziel von einer bis zehn Aufgaben.
- Wärmeenergie-Rechner mit Einheiten und Annahmen sowie ein kleines Formelregister.
- Validierter JSON-Export und -Import von Lernstand, Merkliste und Tagesziel.
  Ein Import ersetzt Daten erst nach ausdrücklicher Bestätigung in der App.
- Höhere Lernstandsformate sind gegen Überschreiben geschützt, auch wenn sie
  während einer offenen Aufgabe eintreffen. Unveränderte Rohdaten bleiben exportierbar.

Der Fortschritt startet bei null. Als „zuletzt richtig“ zählt die letzte
abgegebene Antwort auf eine Aufgabe, nicht nachgewiesene berufliche Kompetenz.
Das Tagesziel zählt unterschiedliche bearbeitete Aufgaben pro lokalem
Kalendertag. Wiederholtes Klicken erhöht es nicht künstlich.

## Lokal entwickeln

Voraussetzung: Node.js 24 (siehe `.nvmrc`) und npm. Die Modellübungen funktionieren
ohne externe Dienste. Für das vorhandene Lernkonto `.env.example` nach `.env.local`
kopieren und Supabase-URL sowie einen Publishable Key eintragen. Private Fragen
werden ausschließlich nach Anmeldung und serverseitiger Freigabe geladen.

```sh
npm ci
npm run dev
```

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
Diese Wiederanbindung bietet einen Übungsablauf, keinen neuen Prüfungsmodus. Die App enthält keine private Literatur, alte
Prüfungsunterlagen oder wiederhergestellte persönliche Lerngeschichte. Die
Modellaufgaben und Formeln ersetzen keine aktuellen Normen, Herstellerunterlagen
oder fachgerechte Anlagenplanung. Ein KI-Chat ist noch nicht angebunden.

Der Code ist für Nicks Projekt gedacht. Eine öffentliche Bereitstellung, Lizenz
oder Freigabe privater Quellen ist damit nicht festgelegt. GitHub Actions ist für
die automatischen Prüfungen vorbereitet; eine erfolgreiche Ausführung auf GitHub
muss dort separat bestätigt werden. Die Veröffentlichung erfolgt im bestehenden Vercel-Projekt. Das Projekt ist mit diesem Repository verbunden; Pushes auf `main` sind der
vorgesehene Veröffentlichungsweg. Den tatsächlichen Deploymentstatus separat
prüfen; siehe [Betriebsanbindung](docs/deployment-recovery.md).
