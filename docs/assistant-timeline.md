# Tageszeitachse und Freddy-Verbindung

Produkt **ASSISTENT**, Version 0.12.0. Auftrag:
[werktag-assistent #4](https://github.com/nickhein0509-cmyk/werktag-assistent/issues/4).
Die bestehende gemeinsame Codebasis, Konten, Rohdaten und manuelle Einträge bleiben erhalten.

## Karte und Zeitachse

Unter „Mein Tag“ stehen ein Kalender, vorheriger/nächster Tag und „Heute“ bereit.
Auf dem Desktop liegen Zeitachse und Karte nebeneinander; am Handy erscheint die
Karte über den chronologischen Abschnitten. Ein Weg oder Aufenthalt lässt sich in
der Liste oder auf der Karte auswählen. Die Ansicht fokussiert denselben Abschnitt.
„Ganzen Tag zeigen“ hebt die Auswahl auf. GPS-Diagnose und Empfangszeiten sind
ausklappbar, der Tageskontext bleibt darunter erreichbar.

Die Darstellung folgt dem Bedienprinzip einer Tageszeitachse. Sie verbindet keine
Google-Konten und verwendet keine Google-Maps-API. Orte, Adressen und Verkehrsmittel
werden nicht erfunden. Aufenthalte beruhen weiterhin auf dem bestehenden Journal;
bereinigte GPS-Abstände sind Näherungen, keine berechneten Straßenstrecken.
Lücken über 15 Minuten werden sichtbar markiert und nicht durch erfundene Wege ergänzt.

Kartenkacheln werden erst nach berechtigtem Öffnen von „Mein Tag“ bei OpenStreetMap
angefordert. Der Anbieter sieht dabei den angezeigten Kartenausschnitt. Fehlende
Kacheln oder eine nicht geladene Kartenbibliothek zeigen eine Wiederholungsaktion;
Zeitachse, Notizen und Aufgaben bleiben unabhängig davon nutzbar. Ein bestätigter
GPS-Abruf wird als empfangener Stand bezeichnet. Messzeit, Empfangszeit und
Kartenabruf bleiben voneinander getrennt.

## Freddy einrichten und prüfen

Apple Health → Freddy, Freddy → ChatGPT und Freddy → WerkTag sind getrennte
Verbindungen. Die ChatGPT-Freigabe stellt der Webseite keinen API-Schlüssel bereit.
Der angemeldete Besitzer öffnet `/konto`, erstellt unter „AI apps“ in Freddy einen
eigenen Personal-API-Schlüssel und trägt ihn ausschließlich in das geschützte Feld ein.
Der Schlüssel gehört nicht in Chat, Git, URL oder Browserablage.

„Verbindung prüfen“ prüft den eingegebenen Schlüssel und die bestehende Apple-Health-
Quelle, ohne ihn zu speichern oder einen Zeitplan zu aktivieren. Erst „Health-Abgleich
einrichten“ speichert den verifizierten Schlüssel im vorhandenen Vault und richtet
den bisherigen 15-Minuten-Abgleich ein. „Jetzt Health-Daten abrufen“ verwendet den
gespeicherten Schlüssel; ein erneuter Abruf innerhalb einer Minute wird gebremst.
Die vorhandene transaktionale Lease verhindert parallele Importe.

Die Oberfläche unterscheidet fehlende Einrichtung, ersten ausstehenden Import,
Importfehler, fehlenden Zeitplan und tatsächlich erfolgreichen Abgleich. Eine
verlorene Antwort beweist keinen falschen Schlüssel: der gespeicherte Status wird
erneut gelesen. Der Cloud-Abruf erzwingt keinen iPhone-Upload. iOS-Freigaben und
Hintergrundverarbeitung bleiben am Telefon zu prüfen. Das vom Anbieter gemeldete
Historienfenster wird angezeigt; vorhandene ältere WerkTag-Daten werden nicht gelöscht.

## Technischer Vertrag

- Bestehende Health-Routen und Datenformate bleiben erhalten, keine SQL-Migration.
- `POST /api/assistenz-health?route=check` mit `{apiKey}`: nur verifizierter Besitzer
  und korrekter Origin, keine Speicherung, kein Import, kein Zeitplan.
- `POST /api/assistenz-health?route=refresh` mit `{}`: nur Besitzer und korrekter
  Origin, vorhandene aktivierte Verbindung, 60 Sekunden Abkühlzeit und DB-Lease.
- `GET ...?route=status` zeigt nur Verbindungsmetadaten und feste Fehlercodes.
- Health-Gateway hat 55 Sekunden Upstream-Zeit, Vercel-Funktion 60 Sekunden,
  Browsermutation 65 Sekunden. Andere Gatewaypfade behalten ihre bisherige Frist.
- Neue Health-Edge-Funktion vor der Oberfläche bereitstellen. Bei einem Rückweg
  weiterhin `note`/`task`-Validierung des vorhandenen Assistenzdienstes erhalten.

## Prüfung

Build, vorhandene Unit-/Gateway-/Cloudprüfungen sowie Chromium und mobile WebKit
prüfen die zusammengeführte Version. Neue Tests behandeln Datumsschritte,
Abschnittsauswahl, Lücken, fehlendes Leaflet, fehlende Kacheln und Wiederholen,
leere Tage, gesperrte Sitzungen, Fälligkeiten und unvollständige Bereichsabfragen.
Prüfbilder mit 320/390/1440 Pixeln enthalten ausschließlich synthetische Daten.
Eine WebKit-Prüfung ist kein Test an einem physischen iPhone.

Offizielle Verträge: [Freddy Personal API](https://freddy.coach/help/personal-api),
[Apple Health](https://freddy.coach/help/connect-apple-health),
[Vercel Funktionsdauer](https://vercel.com/docs/functions/configuring-functions/duration).
