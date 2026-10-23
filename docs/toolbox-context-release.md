# Werkzeugkoffer und Kontextfälle · Version 0.5.0

Stand: 23. Oktober 2026. Fortsetzung von Version 0.4.0 auf dem bestehenden
Vorschauzweig `feat/practice-workspace-2026-10-23` und PR #3 im Repository
`nickhein0509-cmyk/werktagshk`.

## Formelwechsel mit demselben Rechenbeispiel

Der bisherige einzelne Wasser-Wärmeenergierechner und die statische Formelkarte
werden durch acht wählbare Formelmodelle ersetzt. Je Modell lassen sich drei
Größen berechnen; benötigte Eingaben, umgestellte Formel, Symbole, Ergebniseinheit
und Rechenweg passen sich gemeinsam an. Die Modellannahmen stehen am Rechner.
Beispiel: 24 l in 80 s ergeben 18 l/min; bei Wahl der gesuchten Messzeit ergeben
dieselben bekannten Werte wieder 80 s. Beim Wechsel von l zu m³ werden 24 l zu
0,024 m³, ohne die physikalische Größe zu ändern.

Werte und Zielgrößen bleiben beim Wechsel der Formelfamilie in der geöffneten
Werkzeugansicht erhalten. Navigation oder Neuladen beginnt mit Beispielwerten.
Es gibt weder neue Lernereignisse noch eine neue Cloud-Speicherung. Der bestehende
Lernstandimport und -export bleibt in derselben Ansicht verfügbar. Rechner und
private Bestandsansichten werden bei Bedarf geladen, damit die Erweiterung den
Einstieg nicht mit allen Modulen belastet.

Die unabhängigen numerischen Referenzen für alle 24 Umstellungen,
Einheitenfaktoren und Modellgrenzen stehen in `formula-workbench.md`. Die
Formelmodelle sind keine Auslegung realer Anlagen. Nicht eindeutige inverse
Fälle liefern eine verständliche Fehlermeldung statt einer erfundenen Zahl.

## 24 weitere Kontextentscheidungen

Je acht Fälle ergänzen Arbeitsplanung, Systemanalyse/Instandhaltung und WiSo.
Der Katalog umfasst damit 180 eigene Übungen: 112 Rechenaufgaben, 40
Kontextaufgaben und 28 Wissensfragen; 72 Einträge sind gezielt einem der drei
schriftlichen Prüfungsbereiche zugeordnet. Alle bisherigen IDs, Antwortschlüssel,
Rechenschritte und Lernereignisse bleiben erhalten.

Die neuen Aufgaben verlangen fallbezogene Entscheidungen zu Unterlagen,
Systemkombinationen, Arbeitsfolgen, Messgrenzen, Zeitbezügen, Einkaufsunterlagen,
Zahlungsfähigkeit und Kundenkommunikation. Die notwendigen Modellbedingungen
stehen jeweils im Kontext. Es wurden keine privaten Originalprüfungen kopiert
und keine nicht belegten gesetzlichen oder normativen Regeln als Bewertungsbasis
verwendet.

Eine zweite inhaltliche Prüfung hat alle 24 Schlüssel unabhängig aus den
jeweiligen Fallbedingungen hergeleitet. Drei antworttragende Titel wurden
neutralisiert und zwei technische Aufgaben bekamen plausiblere Alternativen.
Die begrenzten Prüfnachweise stehen in `exam-context-technical-review.md` und
`exam-context-wiso-review.md`. Die Aufgaben sind keine Aussage über die konkrete
kommende Prüfung oder die vollständige Prüfungsabdeckung.

## Vorschauanbindung

Das angefragte WerkTag-Vorschau-Plugin wurde über `get_merge_plan` geprüft.
Seine hinterlegte Quellzuordnung zeigt weiterhin auf das frühere Repository
`nickluna20000509/Werktag`, sein Einstieg öffnet die Hauptseite `werk-tag.com`.
Diese Metadaten wurden nicht mit einem Commit des aktuellen Repositories
überschrieben. Die konkrete Vorschau wird stattdessen über den bestehenden
Vercel-Vorschauzweig des aktuellen Repositories aktualisiert. Eine Vorschau oder
ein Pull Request ist keine Produktionsübernahme.

## Ausgeführte Prüfung

`npm run check` am 23. Oktober 2026 erfolgreich: TypeScript/Produktionsbuild,
165 Logiktests in zwölf Dateien und 35 Chromium-Browserprüfungen. Darin enthalten
sind alle bisherigen Lern-, Import-, Konto-, Freigabe- und Prüfungsrundenpfade
sowie Formelwahl, Umstellung, Erhalt des Rechenbeispiels, automatische
Einheitenumrechnung, ungültige inverse Fälle und drei neue Kontextfragen im
Antwortablauf. Alle acht Formelfamilien passen bei 320 px; Fehlermeldungen und
die übrigen Hauptansichten wurden automatisiert auf WCAG A/AA geprüft.

Die unabhängige mathematische Gegenprüfung führte 24 Referenzszenarien und sechs
weitere Grenzfälle aus. Zusätzlich wurden alle 24 Formel-/Zielkombinationen im
schmalen Browser betrachtet. Desktop- und Handy-Screenshots zeigen eigene
Beispielwerte und Aufgaben, keine privaten Quellen oder echten Lerndaten.
