# Vollständige Inhaltsauswertung und Einbindung des privaten Fragenbestands

Stand: 23. Oktober 2026 · Version 0.7.0. Aktiver Zielbestand ist das vorhandene
Supabase-Projekt; die privaten Inhalte bleiben hinter Anmeldung, persönlicher
Freigabe und Eigentumsprüfung. Es entsteht kein zweiter öffentlicher Fragenkatalog.

## Geprüfter Umfang

Alle 631 aktuellen unterschiedlichen Aufgaben wurden einzeln mit Aufgabenstellung,
Antwortmöglichkeiten, Musterlösung, Bewertungsregel, vorhandenem Hinweis und
Quellenvermerk gelesen. Die Lösungsschlüssel waren bei der Sichtung verfügbar;
die fachlichen Herleitungen sind ausdrücklich keine Blindprüfung. Jede ID und
Fassung wurde vollständig mit dem tatsächlichen Datenbanksnapshot abgeglichen.

| Thema         | Aufgaben |
| ------------- | -------: |
| Trinkwasser   |      113 |
| Entwässerung  |       53 |
| Heizung       |       87 |
| Wärmeerzeuger |       95 |
| Regelung      |       68 |
| Systemanalyse |       95 |
| Fachrechnen   |       36 |
| WiSo          |       84 |
| Gesamt        |      631 |

Nach den Korrekturen sind 79 Rechenaufgaben, 334 Kontextaufgaben und 218
Wissensfragen eingeordnet. Die Art folgt der verlangten Bearbeitung; beispielsweise
kann eine Auswahlfrage eine Rechnung verlangen. Sie wird nicht aus dem technischen
Antwortformat oder der Textlänge abgeleitet.

Die redaktionellen Stufen verteilen sich auf 138 Einstieg, 291 Anwenden,
193 Transfer und neun Vernetzt. Die [Rubrik](difficulty-rubric.md) beurteilt die
Aufgabenanforderung, keine persönliche Lernleistung oder amtliche Schwierigkeit.
Die vorhandenen 246 Basis-/385 Anwendungsangaben und die separate Anforderungsangabe
bleiben unabhängig erhalten.

## Tatsächliche Rechen- und Quellenprüfung

Alle 210 gespeicherten Referenzfälle der 42 mathematischen Vorlagenfassungen
wurden mit der vorhandenen Datenbank-Rechenfunktion ausgeführt und bestanden.
Davon gehören 40 Vorlagen zu aktuellen Aufgaben. Zusätzlich rechneten die
Inhaltsprüfer die jeweiligen statischen Beispiele und dynamischen Modelle mit
separat hergeleiteten Formeln nach; private Decimal-/Fraction-Nachweise halten
Referenzfälle und die tatsächlich vollständig enumerierten Werteraster fest.
Ein erfolgreicher Runtime-Vergleich mit gespeicherten Referenzen allein ist
kein unabhängiger Beleg des physikalischen Modells.

Bei 63 Fragen wurden passende aktuelle Primärtextpassagen gezielt geöffnet und
für die jeweils konkrete Aussage geprüft. Frühere `original_checked`-Markierungen
bleiben als vorherige Quellenhistorie erhalten. Sie bedeuten keine erneute
Ganzquellenprüfung. Bei 545 Fragen wurde der Inhalt einschließlich Lösung und
Bewertungsregel geprüft; die Originalseiten wurden in diesem Durchgang nicht
erneut geöffnet. Bei 13 bleiben konkrete Primärbelege und bei zehn
Bildprüfungen offen. Unbekannte Ausgaben, fehlende Bilder und nicht gelesene
Normvolltexte werden nicht durch pauschale Freigaben ersetzt.

Im aktuellen Bestand sind damit 608 Aufgaben für die beschriebenen Bedingungen
inhaltlich unterstützt; 23 behalten präzise Quellen- oder Bildvorbehalte. Die App
kennzeichnet diese Fälle und weist auf die vorläufige Bewertung der betroffenen
Angaben hin. Die vollständigen Einzelbegründungen, Quellenpassagen und Keys liegen
privat; sie werden nicht mit dem öffentlichen Frontend ausgeliefert.

## Korrekturen und Erhalt bestehender Daten

32 gezielte Text-, Musterantwort- oder Rubrikkorrekturen beheben alle 13 gefundenen
Überarbeitungsfälle, darunter drei fehlende Fallprämissen, und 19 weitere
konkrete kleinere Befunde. Eine zweite Prüfung las alle 32 geänderten Fassungen
vollständig. Drei Rückmeldungen zu Musterantwort, Kriterienabdeckung und
Schwierigkeit wurden eingearbeitet und erneut geprüft.

Die Korrekturen erzeugen 32 neue Inhaltsfassungen derselben Fragen. Die bisherigen
716 Versionen bleiben erhalten; anschließend gibt es 748 Versionszeilen und
weiterhin 631 aktuelle Aufgabenidentitäten. Eigentümer, Lernziele, Familien,
Lernfeldzuordnungen, Hinweise und Wissenslinks bleiben den passenden Versionen
zugeordnet. Originalfassungen und gespeicherte Antworten werden nicht umgeschrieben.
Die unabhängige Rückleseprüfung bestätigte alle 32 neuen Zuordnungen sowie
748 gespeicherte Inhaltsfassungen. Alle 631 geprüften Ausgangsfassungen bestehen
weiter und haben denselben Inhaltsfingerprint wie vor der Übernahme. Bei allen
631 aktuellen Fassungen stimmen Inhaltsfingerprint und Einzelreview überein.

Die Einzelreviews werden separat an die bestehenden unveränderlichen Fragen
angehängt. Auch die Reviewzeilen sind gegen Änderung und Löschung geschützt.
Eine Inhaltsfingerprint-Prüfung verhindert, dass eine veraltete Einstufung für
geänderten Inhalt übernommen wird. Ein vorhandenes veraltetes Review sperrt neue
Starts, bis die Fassung erneut geprüft ist. Die vorhandenen Grenzprüfungen,
Eigentumsregeln, aktiven Prüfungsregeln und Reservierungen von Rechenwerten gelten
weiter. Die Arbeiten erzeugten keine echten Versuche, Bewertungen oder Zeitereignisse.

## Bedienung

Aus der Lernwerkstatt führt ein direkter Einstieg in den privaten Kontobestand.
Dort lässt sich jede startbare aktuelle Aufgabe gezielt öffnen. Thema, tatsächliche
Aufgabenart, vier Stufen und die zusätzliche Bestandskategorie filtern auch neue
Runden. Suche und Sortierung ordnen das Verzeichnis. Fehlende Einstufungen werden
nicht geraten; nicht verfügbare Fassungen erklären ihren gesperrten Start.

Aktive Runden behalten ihre gespeicherten Frageversionen. Eine neue Katalogfassung
ersetzt keine laufende Aufgabe. Rechenaufgaben mit Auswahlantwort bekommen dasselbe
Arbeitsblatt wie Zahleneingaben, soweit die aktuelle serverseitige Hilfenfreigabe
das erlaubt. Einzelreviews liefern vor der Antwort nur antwortfreie Metadaten;
interne Begründungen und Lösungsschlüssel sind nicht Teil des Katalogs.

Ansichten mit ausschließlich synthetischen Katalogdaten:
[Desktop](screenshots/private-bank-desktop-synthetic.png),
[Handy](screenshots/private-bank-mobile-synthetic.png) und
[mobile Filter](screenshots/private-bank-mobile-controls-synthetic.png).
Die dargestellten neun Beispielaufgaben sind kein Ausschnitt des echten Bestands.

## Technische Prüfung

Die additive Migration wurde nach unabhängiger SQL-Prüfung und erfolgreicher
Transaktionsprobe mit synthetischen Konten ausgeführt. Die Probe kontrolliert
unter anderem Anmeldung/Freigabe, Eigentümer, exakte Version, vier Stufen,
Aufgabenart, ungültige Auswahlwerte, wiederholte Vorgänge, private Projektion,
veraltete Fingerprints, alte Runden und mathematische Reservierungen. Alle
Testdaten wurden zurückgerollt; die Nachprüfung bestätigte vollständige Entfernung.
Die Sicherheitsberater meldeten gegenüber dem vorherigen Stand keine neuen Hinweise.

Ein erster Probeentwurf versuchte eine Änderung am unveränderlichen Register
und wurde korrekt abgewiesen. Die endgültige Umsetzung hängt ausschließlich
neue Reviewzeilen und neue Inhaltsversionen an; kein bestehender Schutz wurde
gelockert. Strukturelle Prüfungen, Fachprüfung und Transaktionsprobe bleiben
unterschiedliche Nachweise.

Die vollständige App-Prüfung bestand mit 246 Unit-Tests und 49 Chromium-Tests
einschließlich der neuen Einzelstarts, gefilterten Runden, exakten Versionen,
320-Pixel-Ansicht und Barrierefreiheitsprüfungen. Dabei kommen ausschließlich
synthetische private Katalogdaten zum Einsatz.
Zusätzlich bestanden sechs gezielte Browserfälle gegen das Produktionsbundle
mit synthetischer Supabase-Konfiguration. Desktop und 320-Pixel-Ansicht wurden
visuell geprüft; die mobilen Filter bleiben durch Scrollen erreichbar.
