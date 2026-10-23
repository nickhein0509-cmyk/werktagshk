# Redaktionelle Aufgabenstufen

Stand: 23. Oktober 2026. Fassung 1.

Diese Einordnung beschreibt die Denk- und Bearbeitungsanforderung der eigenen
Übungsaufgaben. Sie ist keine gemessene Lösungswahrscheinlichkeit, persönliche
Lernstufe oder Aussage zur Prüfungsreife. Eine Aufgabe kann jemandem wegen seiner
Vorkenntnisse leichter oder schwerer fallen als ihre redaktionelle Stufe vermuten
lässt.

## Maßstab

| Stufe | Bezeichnung | Für die Einstufung entscheidende Anforderung                                                                                                                                                                                                |
| ----- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Einstieg    | Einen grundlegenden Begriff erkennen, eine direkte Proportionalität beurteilen oder unmittelbar passende Größen in einer Grundbeziehung verknüpfen. Mehrere einfache Multiplikationen allein erhöhen die Stufe nicht.                       |
| 2     | Anwenden    | Eine bekannte Rechenkette, Einheitenumrechnung, Umstellung oder ausdrücklich vorgegebene Regel auf einen Fall anwenden. Die Methode steht fest; die Aufgabe verlangt ihre korrekte Ausführung.                                              |
| 3     | Transfer    | Eine passende Verknüpfung auswählen, unterschiedliche Angaben vergleichbar machen oder die Reichweite einer Schlussfolgerung prüfen. Mehr als reine Ausführung einer bereits festgelegten Kette ist erforderlich.                           |
| 4     | Vernetzt    | Mehrere voneinander abhängige Bedingungen, Alternativen oder Teilergebnisse zu einer begründeten Gesamtlösung verbinden; beispielsweise eine ganzzahlige Belegung unter einer knappen Ressource prüfen. Viele Angaben allein genügen nicht. |

Maßgeblich ist die tatsächlich gestellte Frage einschließlich ihrer Bedingungen
und der angebotenen Antworten. Antwortformat, Textlänge, alte Anzeige
`Grundlagen`/`Anwenden`, angesetzte Minuten oder die bloße Anwesenheit einer Formel
bestimmen die Stufe nicht. Auch eine lange Rechenaufgabe kann Stufe 2 sein, wenn
die Rechenkette vollständig festliegt. Eine kurze Kontextfrage kann Stufe 3
erfordern, wenn die Tragweite eines Befunds zu prüfen ist. Stufe 4 ist keine Quote:
Die Stufen müssen im Katalog nicht gleich häufig vorkommen.

## Umfang und nachvollziehbare Beispiele

Für diese Fassung wurden die Aufgabenstellung, die Modellannahmen und die
erwartete Bearbeitung der 180 vorhandenen eigenen Aufgaben vor der aktuellen
Erweiterung gelesen. Die 24 Rechenfamilien mit jeweils drei Zahlenvarianten
erhalten je Familie dieselbe Einstufung; die übrigen 108 Aufgaben wurden einzeln
zugeordnet. Die exakten Identitäten und die jeweiligen Begründungen stehen in
[`src/lib/difficulty.ts`](../src/lib/difficulty.ts). Es gibt keine Einordnung durch
ein Schlüsselwort- oder Textlängenverfahren.

| Beispiel-ID                         | Stufe | Für die Zuordnung entscheidend                                                          |
| ----------------------------------- | ----- | --------------------------------------------------------------------------------------- |
| `wiso-deckungsbeitrag`              | 1     | Zwei unmittelbar gegebene Geldgrößen mit einer Grundbeziehung verrechnen.               |
| `wiso-preisrechnung`                | 2     | Eine feststehende Folge aus Menge, Rabatt und vorgegebenem Steuersatz ausführen.        |
| `exam-wiso-gewichtete-auswahl-v1`   | 3     | Mehrere Kriterien nach ihrer Gewichtung zu vergleichbaren Ergebnissen verbinden.        |
| `exam-ap-context-leistungsdaten-v1` | 3     | Technische Kennwerte anhand ihrer Betriebsbedingungen auf Vergleichbarkeit prüfen.      |
| `exam-ap-zuschnitt-schnittfuge-v1`  | 4     | Ganze Lieferstücke, Verlustvorgaben und mögliche Stückverteilungen gemeinsam prüfen.    |
| `exam-wiso-engpassstunde-v1`        | 4     | Beiträge und ganze Belegungsalternativen unter einer knappen Zeitressource vergleichen. |

Von diesen 180 Aufgaben liegen 45 in Stufe 1, 88 in Stufe 2, 45 in Stufe 3 und
2 in Stufe 4. Mit den 24 neuen Aufgaben sind es 49 / 98 / 51 / 6 Aufgaben
in den Stufen 1–4 (204 insgesamt). Neue Aufgaben führen ihre redaktionelle Stufe und eine begründende
Beschreibung direkt im Inhalt. Der Katalogtest verlangt für jede aktuelle eigene
Aufgabe eine gültige Zuordnung und prüft, dass die 180 älteren Identitäten erhalten
und erreichbar bleiben. Die Begründung benennt die Anforderung, ohne eine richtige
Antwort vorwegzunehmen.

## Abgrenzung und Pflege

Die vier Stufen gelten seit Version 0.7.0 auch für die 631 aktuellen privaten
Supabase-Aufgaben nach einer eigenständigen Einzelprüfung von Aufgabenstellung,
Lösung und Bewertungsregel. Die Verteilung lautet dort 138 / 291 / 193 / 9 in
Stufe 1–4. Es handelt sich um begründete Einzelzuordnungen nach derselben Rubrik,
keine automatische Umrechnung der bisherigen Kategorien `basic`/`applied`.
Diese zweistufigen Metadaten und die separate Anforderungsangabe bleiben erhalten.
Private Einstufungen und Prüfnachweise liegen versioniert im geschützten Bestand;
dieses Repository enthält weder deren Aufgabentexte noch Lösungsschlüssel.
Die [Gesamtauswertung](private-bank-release.md) nennt offene Quellenbelege.

Die persönliche Lernstufe 0–4 aus den bestehenden Lernregeln ist ebenfalls eine
andere Größe. Diese Änderung erzeugt keine Versuche, verändert keine früheren
Antworten und schreibt keine damaligen Schwierigkeitsangaben um. Eine neue
Aufgabenstufe ist kein Nachweis eines Lernfortschritts. Inhaltliche Quellen- und
Rechtsprüfungen bleiben getrennt; die Einstufung bestätigt keine Norm- oder
Rechtsaussage erneut.

Bei unverändertem Lernziel und gleicher Bearbeitungsanforderung behalten reine
Zahlenvarianten dieselbe Stufe. Ändern sich Frage, Hilfen oder Bedingungen so, dass
eine andere Denkleistung nötig wird, ist die Zuordnung für die neue Fassung erneut
zu prüfen. Neue Identitäten ohne dokumentierte Einstufung bleiben ausdrücklich
ungeordnet. Unvollständige oder ungültige neue Metadaten werden ebenfalls nicht
durch Vermutungen ersetzt. Beim Sortieren stehen solche Aufgaben in beiden
Sortierrichtungen zuletzt.

Diese Fassung ist eine begründete redaktionelle Erstzuordnung. Es gibt dazu keine
psychometrische Kalibrierung und keine empirische Validierung anhand unabhängiger
Bearbeitungen.
