# Kartenbetrieb im Assistenten

Produkt **ASSISTENT**, Version 0.13.0. Auftrag:
[werktag-assistent #6](https://github.com/nickhein0509-cmyk/werktag-assistent/issues/6).
Ausgangsstand war Plattform-main `e6d0dc003b7ab16e692b97d21b88209204a5d901`.

## Fehler und Reparatur

Die native Prüfung am 28. Oktober 2026 zeigte sichtbare OSM-Sperrkacheln
„Access blocked“. Das Dokument sendete `Referrer-Policy: no-referrer`, und der
Kartenlayer hatte keine eigene Richtlinie. Das verletzt die
[OSM-Kachelnutzungsrichtlinie](https://operations.osmfoundation.org/policies/tiles/),
die für Webseiten einen gültigen HTTP-Referer verlangt. Eine erfolgreiche
Bildladung oder HTTP 200 allein beweist keinen brauchbaren Karteninhalt: Eine
Sperrmeldung kann selbst als Bild ausgeliefert werden.

OSM-Kartenbilder senden jetzt ausdrücklich `referrerPolicy: 'origin'`.
Dabei wird nur die tatsächliche Herkunftsdomain übermittelt, ohne private Pfade,
Abfrageparameter oder Fragmente. Die Dokumente und privaten APIs behalten
`no-referrer`. Kein Proxy, keine falsche Identität, keine wechselnden Hosts und
kein Umgehen von Anbieterbeschränkungen. Der Browser verwendet den regulären
Kachelcache; es gibt weder Vorabdownload noch Offline-Kartenfunktion.

## Zwei Kartenhintergründe

OpenFreeMap ist der neue Standard: eine Vektorkarte mit Straßen und Beschriftungen,
über einen unabhängigen, öffentlich für Produktion vorgesehenen Dienst. Dessen
[Nutzungsbedingungen](https://openfreemap.org/tos/) und
[offizielle Einbindung](https://openfreemap.org/quick_start/) wurden geprüft.
Es sind keine Registrierung, API-Schlüssel oder kostenpflichtige Konten nötig.
Der öffentliche Dienst bietet keine garantierte Verfügbarkeit.

OpenStreetMap ist als bewusst auswählbare Alternative verfügbar. Anbieterwechsel
und Wiederholen betreffen nur den Hintergrund. Datum, ausgewählter Aufenthalt
oder Weg sowie ungespeicherte Notizen bleiben erhalten. Laden, Ausfall und
Wiederherstellung des Hintergrunds werden getrennt von GPS- und Kontostatus
angezeigt. Falls der Browser keine Vektorkarte darstellen kann, bleibt die
Alternative erreichbar. Die Zeitachse funktioniert auch bei Anbieterausfall.

Leaflet und die Vektorkartenbibliothek werden von WerkTag selbst ausgeliefert.
Der Vektor-Worker kommt ebenfalls von derselben Herkunft. Externe Kartenanfragen
beginnen erst nach berechtigtem Öffnen von „Mein Tag“. Beim Sperren werden
Kartendarstellung und private Zusammenfassungen entfernt, einschließlich spät
eintreffender Ladeergebnisse. Es wird kein Standortarchiv an einen Kartendienst
übertragen; dessen reguläre Ausschnittanfragen verraten aber den betrachteten
Kartenbereich und die IP-Adresse. Quellenangaben bleiben auf der Karte sichtbar.

## Google, Apple und Passwörter

Google Maps ist technisch möglich, aber für eine programmierbare Produktionskarte
braucht es ein eigenes Cloud-Projekt mit aktivierter Maps JavaScript API,
Abrechnung und eingeschränktem API-Schlüssel. Ein Demo-Schlüssel ist für Prototypen.
Siehe [Google-Einrichtung](https://developers.google.com/maps/documentation/javascript/get-api-key).

Apple Karten ist über MapKit JS auch auf Webseiten möglich. Dafür benötigt die
Integration einen eigenen [Maps-Token](https://developer.apple.com/help/account/service-configurations/maps-tokens)
aus dem Developer-Konto. Ein
[anwendungsspezifisches Apple-Passwort](https://support.apple.com/en-us/102654)
dient dem Zugriff unterstützter Fremdprogramme auf iCloud-Dienste wie Mail,
Kontakte und Kalender. Es ersetzt keinen Maps-Token und wird hier nicht benötigt.
Keine kostenpflichtige Google-/Apple-Einrichtung wurde vorgenommen.

## Abnahme und Rückweg

Die automatischen Prüfungen verwenden ausschließlich synthetische Aufzeichnungen
und kontrollierte Kartenantworten. Sie müssen den OSM-Referer unter dem echten
`no-referrer`-Dokumentheader prüfen, ohne geheime URL-Anteile weiterzugeben.
Anbieterausfälle, Wiederherstellung, Auswahl-/Entwurfserhalt und Sperren während
ausstehender Anfragen gehören zur Abnahme. Chromium und mobile WebKit werden
getrennt geprüft; WebKit ist kein Test auf einem physischen iPhone.

Die abschließende native Produktionsprüfung muss tatsächliche Straßen und
Beschriftungen zeigen. Statuscodes und geladene HTML-Bilder allein genügen nicht.
Keine Datenbankmigration oder Änderung am Health-/GPS-Empfang ist nötig.
Ein Rückweg muss die bestehende Notiz-/Aufgabenvalidierung und privaten Daten erhalten.
