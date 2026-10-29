# Kartenbetrieb im Assistenten

Produkt **ASSISTENT**, Kartenbasis seit Version 0.13.0. Auftrag:
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

## Wegegestaltung und Geräteauswahl · 29. Oktober 2026

Die gemessenen Wege erhalten eine helle Kontur und eine petrolfarbene Linie.
Eine ausgewählte Teilstrecke erscheint in Kupfer; die anderen gemessenen Wege
bleiben als leiser Kontext erhalten. Der Kartenausschnitt richtet sich nach der
Auswahl. Bei einem Aufenthalt wird der vollständige ungefähre 100-m-Bereich
eingepasst, einschließlich Abstand zu Kartenbedienelementen. Die unveränderte
GPS-Analyse liefert weiterhin die einzelnen Liniensegmente und Entfernungen:
keine Straßenanpassung, keine Verbindung über Aufzeichnungslücken und keine
Änderung bestehender Tagesarchive.

Nummerierte Aufenthalte entsprechen den Nummern der Zeitachse. Die Marker
besitzen 44-px-Trefferflächen, verständliche zugängliche Namen und funktionieren
mit Enter oder Leertaste. Start und Ende tragen zusätzlich die Zeichen S und E.
Sie verwenden die erste beziehungsweise letzte gültige Messung, auch wenn die
Linienglättung eine kleine letzte Bewegung unterdrückt. Ein Aufenthalt kann
dadurch nicht mehr die letzte Messung fälschlich als Start anzeigen. Fokus in der
Zeitachse und auf Kartenmarkern bleibt bei neuen Messdaten erhalten.

Wenn der Server Quellenmetadaten liefert, wählt „GPS-Aufzeichnung“ ein Paar aus
Quelle und Gerät. „Automatisch“ nutzt die vom Server ausgewählte neueste
Aufzeichnung im Zeitraum. Eine bewusste Auswahl bleibt beim Wechsel des Tages
erhalten. Gerätewege werden weder auf der Karte verbunden noch in der
GPS-Statistik addiert. Quelle und Gerät werden gemeinsam als URL-Parameter
übermittelt; Gerätenamen bleiben vollständig erhalten. Die Statistik verwendet
dieselbe Aufzeichnung, und ein Sprung aus der Statistik übernimmt diese Quelle
für den gewählten Tag. Health-Tageswerte behalten ihre eigene Herkunft.

Ein Wechsel oder Sperren verwirft ausstehende Ergebnisse; eine alte
Statistikantwort kann die neu gewählte Geräteansicht nicht überschreiben.
Beim Sperren wird auch die Geräteauswahl entfernt. Alte Antworten ohne
Quellenmetadaten bleiben darstellbar, ohne eine Quellenbezeichnung zu erfinden.
Bei mehreren Geräten werden die getrennten Recorderjournale des
[Tagesarchivs v2](assistant-archive-v2.md) beziehungsweise unverändert
angebotene ältere v1-Archive ausdrücklich erklärt.

Gezielte Regressionen: `node --test scripts/test-assistant-map.mjs` sowie
`tests/e2e/assistant-timeline.spec.ts`. Die Browserfälle verwenden ausschließlich
synthetische Geräte, Messungen und Kartenkacheln. Sie prüfen unter anderem
Endpunkte nach Glättung, Tastaturwahl, Kreisgrenzen bei 320 px, Fokuserhalt,
vollständige Geräteparameter, Quellwechsel mit verspäteter Statistikantwort,
Sperren und erneuten Sitzungszugriff. Screenshots dieser Fixtures belegen die
Oberflächengestaltung, keine privaten Wege oder reale Straßenabdeckung.
