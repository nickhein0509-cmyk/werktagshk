# WiSo-Rechtsfälle: begrenzte Quellen- und Autorenprüfung

Stand: 23. Oktober 2026. Umfang: genau vier neu formulierte Fälle in
`src/content/exam-wiso-law.ts`, Export `wisoLawExercises: Exercise[]`.
Ursprung aller Fälle: **original**. Inhaltsversion aller Fälle: **1**.

**Redaktioneller Status: `draft` bis zur unabhängigen Gegenprüfung.**
Dieses Dokument hält die Quellenbasis und die Autorenprüfung fest. Es behauptet
keine unabhängige rechtliche Freigabe, keine externe Beratung und keine
Überprüfung aller Sonderfälle der genannten Gesetze.

## Quellenbasis und tatsächlich gelesener Umfang

Der Hauptagent hat die folgenden aktuellen Primärquellenseiten am 23. Oktober 2026 abgerufen und die genannten Passagen gelesen. Die Aufgaben
wurden auf Grundlage dieser im Integrationsauftrag übermittelten Passagen
formuliert. In diesem Autorenschritt wurde kein zusätzlicher eigener Abruf der
Seiten ausgeführt. Diese Unterscheidung verhindert, dass eine zweite unabhängige
Quellenlektüre behauptet wird.

| Primärquelle                                                                                 | Übermittelte und verwendete Passage                                                                                                                      | Begrenzung der Verwendung                                                                                                                                                                                                                     |
| -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [BBiG § 14 Absatz 1 Nummer 3](https://www.gesetze-im-internet.de/bbig_2005/__14.html)        | Ausbildende haben erforderliche Ausbildungsmittel kostenlos zur Verfügung zu stellen; Werkzeuge, Werkstoffe und Fachliteratur sind ausdrücklich genannt. | Ein ausdrücklich erforderliches Fachbuch für die betriebliche Ausbildung. Keine Bewertung frei gewünschter Zusatzliteratur und keine Behauptung einer Eigentumsübertragung.                                                                   |
| [BBiG § 15 Absatz 1 Satz 2 Nummer 1](https://www.gesetze-im-internet.de/bbig_2005/__15.html) | Ausbildende haben Auszubildende für die Teilnahme am Berufsschulunterricht freizustellen.                                                                | Volljähriger Standardfall mit tatsächlich stattfindendem Unterricht. Keine Behauptung zur Freistellung eines ganzen Tages, zu Stundenschwellen, Anrechnung, Wegezeiten oder zulässigen Randarbeitszeiten.                                     |
| [TVG § 2 Absatz 1](https://www.gesetze-im-internet.de/tvg/__2.html)                          | Tarifvertragsparteien sind Gewerkschaften, einzelne Arbeitgeber sowie Vereinigungen von Arbeitgebern.                                                    | Ein zulässiges Parteienpaar identifizieren und von Betriebsrat, Kammer und Jugendvertretung unterscheiden. Keine Aussage zur Tarifbindung eines einzelnen Betriebs, zur Anwendbarkeit eines Tarifvertrags oder zu konkreten Tarifbedingungen. |
| [SGB VI § 1 Satz 1 Nummer 1](https://www.gesetze-im-internet.de/sgb_6/__1.html)              | Versicherungspflicht erfasst Personen, die gegen Arbeitsentgelt oder zu ihrer Berufsausbildung beschäftigt sind.                                         | Reguläre betriebliche duale Berufsausbildung eines Volljährigen mit Ausbildungsvergütung. Keine Abzugssätze, Beitragsrechnung oder Einzelfallentscheidung zu Sonder- und Befreiungstatbeständen.                                              |

Die Seiten stammen von **Gesetze im Internet**, nicht von Ratgeberzusammenfassungen.
Die Abrufangabe bezeichnet den tatsächlich berichteten Quellenabruf, nicht die
Garantie, dass die Rechtslage zu einem späteren Nutzungsdatum unverändert bleibt.
Bei einer späteren fachlichen Änderung ist der benutzte Absatz erneut zu lesen
und die Inhaltsversion bewusst zu behandeln.

## Fallprüfung pro stabiler Aufgaben-ID

| ID                                    | Lernziel und Fallscope                                                                                                                                                 | Hinterlegte richtige Auswahl                                                                   | Autorenprüfung und offener Schritt                                                                                                                                                                                                                                      |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `exam-wiso-law-ausbildungsmittel`     | Rolle des Ausbildungsbetriebs bei einem für den Ausbildungsplan ausdrücklich erforderlichen Fachbuch anwenden.                                                         | A / Index 0: kostenlos durch den Ausbildungsbetrieb zur Verfügung stellen.                     | Passt zum eingegrenzten Wortlaut von BBiG § 14 Absatz 1 Nummer 3. Ablenkungen „immer privat“, „nur Schule“ und Abhängigkeit von Vergütung erfüllen die Pflicht nicht. Unabhängige Gegenprüfung ausstehend.                                                              |
| `exam-wiso-law-berufsschulteilnahme`  | Bei einer Kollision zwischen betrieblichem Einsatz und tatsächlicher Unterrichtsteilnahme die Freistellungspflicht erkennen.                                           | B / Index 1: für Unterrichtsteilnahme freistellen, kollidierenden Einsatz anders planen.       | Passt zu BBiG § 15 Absatz 1 Satz 2 Nummer 1. Der Fall fordert keine volle Tagesfreistellung. Privat nachlesen, Urlaub und eine Beschränkung auf Minderjährige beantworten die Pflicht nicht richtig. Unabhängige Gegenprüfung ausstehend.                               |
| `exam-wiso-law-tarifvertragsparteien` | Parteien eines Tarifvertrags von anderen betrieblichen beziehungsweise berufsständischen Stellen unterscheiden.                                                        | C / Index 2: Gewerkschaft und Arbeitgeberverband.                                              | Beide gehören zu den in TVG § 2 Absatz 1 genannten Gruppen. Die Erklärung nennt zusätzlich einzelne Arbeitgeber, damit nicht die falsche Regel „immer Arbeitgeberverband“ entsteht. Keine konkrete Tarifbindung behauptet. Unabhängige Gegenprüfung ausstehend.         |
| `exam-wiso-law-rentenversicherung`    | Rentenversicherungspflicht einer gewöhnlichen dualen betrieblichen Ausbildung von freiwilliger Versicherung beziehungsweise falschen zeitlichen Grenzen unterscheiden. | D / Index 3: bereits aufgrund der beschriebenen Berufsausbildung gesetzlich pflichtversichert. | Passt zu SGB VI § 1 Satz 1 Nummer 1. Falsche Alternativen verschieben den Beginn auf Abschluss beziehungsweise Probezeitende oder machen ihn von einem freiwilligen Vertrag abhängig. Sonderfälle sind ausdrücklich ausgeklammert. Unabhängige Gegenprüfung ausstehend. |

## Didaktische Grenzen und Integrationsprüfung

Es sind eigene kurze Anwendungsszenarien mit vier Antwortoptionen und genau einer
richtigen Auswahl. A, B, C und D sind jeweils einmal richtig. Die Themen erweitern
die wirtschaftlichen Modellrechnungen um Ausbildungspflichten, Unterrichtsteilnahme,
Tarifvertragsparteien und einen Grundfall der Sozialversicherung. Vier Fälle bilden
keine vollständige Abdeckung von Arbeits-, Tarif- oder Sozialrecht.

Die Aufgabentexte enthalten keine zitierten Lösungsnormen oder Lösungsergebnisse.
Die kompakten Herkunftslabels nennen bereits Quelle und Abrufdatum, damit die
Provenienz sichtbar bleibt. Der Rentenversicherungsfall fragt deshalb nach dem
Versicherungsstatus, statt nach dem Sozialversicherungszweig zu fragen, den die
Bezeichnung „SGB VI“ sonst vorwegnehmen könnte. Der normative Wortlaut und die
vollständige Quellen-URL stehen in der getrennten Erklärung nach der Antwort.
Hinweise richten die Aufmerksamkeit auf ein Unterscheidungsmerkmal, ohne die
richtige Option wörtlich zu nennen.

Drei Minuten pro Fall sind redaktionelle Vorschläge und keine offiziellen
Prüfungszeiten. Die Bewertung erfasst nur die ausgewählte Option, keine freie
juristische Begründung oder Teilpunkte. Die Fälle sind keine persönliche
Rechtsberatung und keine Prognose der tatsächlichen Prüfung.

In diesem Autorenschritt wurden ausschließlich die neue Inhaltsdatei und dieses
Prüfdokument geschrieben. Die acht wirtschaftlichen Aufgaben bleiben unberührt.
Es wurden weder App, Gesamtbestand, Lernstandschema, Browserdaten noch Tests
geändert oder Tests ausgeführt. Vor einem abschließenden Freigabestatus sind die
vier Fälle und die genauen Quellenbezüge unabhängig gegenzulesen sowie im
Integrationsschritt Struktur, Anzeige und Bewertung tatsächlich zu prüfen.


## Integrations-Gegenprüfung am 23. Oktober 2026

Die erste Inhaltsfassung wurde vor der Veröffentlichung gegengeprüft. Für die
Planungsfälle erfolgte eine unabhängige Rechen- und Logikprüfung durch einen
zweiten Agenten; für die Rechtsfälle verglich Root die formulierten Standardfälle
mit den tatsächlich gelesenen Primärpassagen. Die beschriebenen Grenzen gelten
weiter. Status für diese erste Fassung: `reviewed_for_stated_use`, ausschließlich
für das dokumentierte Modellüben bzw. die eng begrenzten Rechtsfälle. Die technische
App-Prüfung wird separat in den Release-Notizen dokumentiert.
