# Assistent: Überblick ohne tägliche Eingaben

Produkt ASSISTENT. [Produktaufgabe 12](https://github.com/nickhein0509-cmyk/werktag-assistent/issues/12). Umsetzung im gemeinsamen Plattformbestand, Ausgangsbasis
`ef9f8b36220914bb1d137207ca3df7d471cdb46d`, Branch
`feat/assistant-health-overview`. Zuständig: Assistenz-HTML, öffentliche
Assistenzmodule (app, today, workspace, statistics), Assistenz-Browsertests.
Keine Änderungen an Konto, Routing, Datenbank, Lernapp oder Materialliste.

## Bedienung

Heute öffnet einen automatisch zusammengestellten Tagesüberblick aus dem bereits
vorhandenen geschützten Statistik-Endpunkt. Schritte, erfasster Schlaf, Ruhepuls
und Trainingszeit werden ohne Eingabe angezeigt. GPS-Wege, Aufenthalte und
Aufzeichnungslücken liefern zusätzlichen Kontext. GPS und Health bleiben
getrennte Quellen; fehlendes GPS verhindert keine Health-Anzeige.

Der Vergleich des heutigen Ruhepulses mit mindestens drei vorhandenen Vortagen
innerhalb der letzten Woche ist ein beschreibender Mittelwertvergleich. Er ist
keine medizinische Interpretation oder Erklärung einer Ursache. Aufenthalte
belegen keinen bestimmten Zweck. Der laufende Tag bleibt als unvollständig
gekennzeichnet; fehlende Werte sind keine Nullen.

Die Hauptnavigation enthält Heute, Rückblick und Verläufe. Notizen und Aufgaben
sind unter Weitere Möglichkeiten erreichbar; ihr Editor ist standardmäßig
zugeklappt. Vorhandene Einträge lassen sich weiterhin bearbeiten, löschen,
filtern und suchen. Bearbeiten öffnet den Editor. Im Rückblick sind persönliche
Tageseingaben unter Ergänzungen zum Tag zu finden. Es gibt keine tägliche
Eingabepflicht. Bestehende Formulare, Schreibrechte und Konfliktschutz bleiben
unverändert.

## Diagramme und Datenumfang

Alle 16 derzeit vom Backend unterstützten Health-Metriken sind bei vorhandenen
Daten auswählbar, einschließlich Core-, Tief- und REM-Schlaf. Dazu kommen der
aus vollständigen Phasen berechnete Schlaf und die getrennte GPS-Strecke.
Summen erscheinen als Balken. Herzfrequenz-, Ruhepuls-, HRV- und Atemfrequenzmittel
erscheinen als verbundene Punkte, mit Unterbrechungen an fehlenden Werten.
VO₂max wird als einzelner Beobachtungspunkt ohne verbindende Linie dargestellt;
die Tagestabelle zeigt den übermittelten Messzeitpunkt. Aggregationen und
Datenlücken bleiben erklärt, die Tabelle ergänzt die Diagramme für Tastatur und
Screenreader. Die vorhandenen 7-/30-Tage-Fenster und Tages-/Wochen-/Monatsgruppen
bleiben erhalten. Es entstehen keine erfundenen Messreihen innerhalb eines Tages.

Zusätzliche Freddy-Metriken außerhalb des aktuellen Backendvertrags sind noch
nicht importiert. Ein vollständiger Ausbau auf weitere Quellmetriken erfordert
separat Einheiten, Aggregation, Validierung und Importunterstützung.

## Verbindungen und Eingänge

Die Freddy-MCP-Anmeldung in Codex ist keine Einrichtung des WerkTag-Cloudabrufs.
WerkTag benötigt weiterhin seine eigene, im Konto eingerichtete Freddy-Verbindung
und einen bestätigten Import. Dieser UI-Ausbau aktiviert keinen Zeitplan.

Sprach-/Texteingaben in ChatGPT und Automationen sind der gewünschte künftige
Eingang für zusätzliche Informationen. Es gibt noch keinen verifizierten
Übertragungsweg dafür. Der Ausbau behauptet keine aktive ChatGPT-Schreibanbindung
und legt keine Chatoberfläche mit vorgetäuschter Funktion an. Ein solcher Eingang
muss bestehende Besitzerrechte und Revisionsprüfung erhalten, Wiederholungen
idempotent verarbeiten, Herkunft und Zeitbezug speichern und Korrekturen erlauben.

## Prüfung und Veröffentlichung

Synthetische Browserdaten prüfen die Übersicht ohne sichtbare Formulare, alle
16 Metriken, schmale und breite Ansichten, Fehler/Wiederholen sowie das Leeren
privater Daten beim Sperren. Bestehende CRUD-, Konflikt-, Karten- und Quellwechsel-
Prüfungen bleiben erhalten. Keine echten Gesundheitsdaten oder Zugangsdaten in
Tests oder Screenshots. Keine Backendmigration erforderlich; Veröffentlichung
und tatsächliche Freddy-Kopplung bleiben separat nachzuweisen.

Validierung am 29. Oktober 2026: `npm run check` erfolgreich (254 App-, 35
Gateway-/Karten-, 89 Cloud-, 7 Workflow- und 152 Chromiumprüfungen; zusammen 537).
Anschließender Produktionsbuild ebenfalls erfolgreich. Synthetische Übersicht
und Diagramme bei 320, 390 und 1440 Pixeln geprüft. WebKit-Browserdownload
möglich, Ausführung hier wegen fehlender Systembibliotheken nicht verfügbar;
kein physischer iPhone-Test und keine bestätigte Live-Freddy-Verbindung.
