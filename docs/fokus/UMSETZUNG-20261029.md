# Lerncockpit und Arbeitskontext · 29. Oktober 2026

Auftrag: [werktagshk #29](https://github.com/nickhein0509-cmyk/werktagshk/issues/29).
Produkte: LERNEN (Oberfläche), PLATTFORM (Arbeitskontext); bestehende
ASSISTENT-Aufgabe #12 wird gegen die bereits integrierte Umsetzung geprüft.
Basis `9ffca5073a365f234a7107e6ee7d5f612f7d090f`, Branch
`feat/focused-workspace-cockpit-20261029`, Worktree `/workspace/werktag-fokus`.
Eigene Dateien: `FlowDashboard.tsx`, `dashboard-cockpit.css`, Cockpit-Browsertest,
WebKit-Auswahl/CI-Artefakte, Fokusdokumente, Workspace und zugehörige README-Verweise.
Keine Backend-, Auth-, Daten- oder Ressourcenvertragsänderung; kein anderer
Aufgabenbranch als Voraussetzung.

## Wo ist das Design?

Die Desktop-Galerie in PR #23 war eine **Studie**. Variante A wird mit diesem
Auftrag erstmals als echte React-Oberfläche umgesetzt. Der Lerneinstieg unter
`/` zeigt „Dein Lernplatz.“ mit Aufgaben links und „Heute im Blick“ rechts.
Die anderen Produkte und der Projekteinstieg sind davon getrennt.

[Desktop, 1440px](cockpit-1440.png) · [Handy, 390px](cockpit-390.png)

Quelle und Richtung: vorhandenes WerkTag Atelier und die eigene Galerie A;
Petrol, warme Arbeitsflächen, lokale Manrope, Kupferdetails, vorhandene Icons.
Keine fremden UI-Module, neuen Abhängigkeiten oder externen Bilder übernommen.
Der Prüfungstermin bleibt lesbar. Eigene Aufgabe, Tagesziel, Wochenpunkte,
Wiederholung und privater Fragenbestand bleiben erreichbar. Fortschritt kommt
weiterhin ausschließlich aus den vorhandenen Lernzuständen.

Die Hauptspalte bleibt in DOM- und Lesereihenfolge zusammenhängend; danach folgt
die Tagesübersicht. Kein CSS-Umsortieren interaktiver Karten. Ein Tastatursprung
„Heute im Blick“ fokussiert deren Überschrift. Auf kleineren Ansichten ist dieser
Link sichtbar; die Spalten stehen untereinander. Die Startkarte öffnet den echten
Übungsdialog und erhält nach Escape den Fokus zurück.

Die Live-Umsetzung bewahrt mehr Informationen und 44px-Aktionen als die Studie.
Sie behauptet deshalb keine komplett scrollfreie Desktopseite: Bei 1440×1000px
beginnt die Tagesübersicht auf y=109px, die Lernfelder auf rund y=830px; ihr
unterer Abschluss liegt bei rund y=1018px. Auf kleinen Laptops bleibt Scrollen
notwendig. Die Bilder zeigen ausschließlich den leeren synthetischen Gastzustand.
Die feste mobile Navigation wird im Ganzseitenbild an der ursprünglichen
Viewport-Unterkante abgebildet, im Browser bleibt sie am Bildschirmrand.

## Arbeitsumgebung

`werktag.code-workspace` enthält nur einen Ordner; `START.md` ist der knappe
Auftrag für einen neuen Chat, `UMGEBUNG.md` das konkrete Umgebungsprofil.
Fremdforks werden nicht automatisch geladen. Bestehende Repositories, offene
Änderungen und GitHub-Historien bleiben erhalten. Die separate Arbeitskopie
ist angelegt; eine neue verwaltete Cloud-Instanz und ein neuer Chat können über
die verfügbaren Werkzeuge nicht erzeugt werden. Die Konfigurationsvorlage ist
kein Nachweis ihrer Aktivierung und keine Sicherheitsisolation des Dateisystems.

## Validierung

37 gezielte Chromium-Prüfungen bestanden: Lernabläufe, Assistenten-Arbeitsbereich
und neue Cockpit-Abnahme. Sechs Breiten von 320 bis 1440px ohne horizontalen
Überlauf und ohne automatische WCAG 2 A/AA bzw. 2.1 AA-Befunde. Zusätzlich
Tastatursprung, Dialog/Fokusrückgabe und verdoppelte berechnete Schriftgrößen
geprüft. Keine vollständige manuelle Accessibility-Zertifizierung behauptet.
Die vollständige Prüfung und der tatsächliche Produktions-SHA stehen im
zugehörigen PR; GitHub-CI und Liveprüfung werden getrennt dokumentiert.

Assistent #12: Die vorhandenen synthetischen Tests prüfen alle 16 Metriken,
320/390/1440px, fehlgeschlagene Aktualisierungen, CRUD/Revisionskonflikte und
Sperren einschließlich verspäteter Antworten. Keine erneute private Datenabnahme
oder neue Health-Integration wird daraus abgeleitet. Die persönliche iPhone- und
Anbieterabnahme bleibt in ihren eigenen offenen Aufgaben.
