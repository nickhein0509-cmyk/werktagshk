# WerkTag · Dein SHK Lernbuddy

Ein neuer Lernbuddy für Sanitär, Heizung, Klima/Lüftung und WiSo. Die responsive
Web-App verbindet eine technische Werkstattgestaltung mit kurzen Übungsaufgaben,
nachvollziehbaren Lösungswegen und einem persönlichen Lernrhythmus.

Gestaltung ansehen: [Desktop](docs/screenshots/desktop.png),
[Handy](docs/screenshots/mobile.png) und [Aufgabe](docs/screenshots/exercise.png).

## Was funktioniert

- Übersicht mit echten Tageszielen, bearbeiteten Aufgaben und Lerntagen.
- 108 eigene Modellaufgaben, 27 je Lernfeld, mit Hinweisen und Erklärungen.
  Darunter 72 neue Rechnungen zu 24 Modellen mit je drei Zahlenvarianten.
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
