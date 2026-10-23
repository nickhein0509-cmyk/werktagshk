# Technische Kontextfälle · Inhaltsversion 1

Prüfdatum: 23. Oktober 2026. Umfang: exakt die 16 eigenen Übungen in
`src/content/exam-context-technical.ts`, acht Arbeitsplanung und acht
Systemanalyse/Instandhaltung. Alle Aufgaben tragen stabile Kennungen und
`kind: context`. Die angegebenen zwei bis vier Minuten sind redaktionelle
Zeitvorschläge, keine amtlichen oder gemessenen Bearbeitungszeiten.

## Herkunft und Prüfgrenze

Es wurden eigene Entscheidungssituationen für die Arbeit mit vorgegebenen
Unterlagen, Messprotokollen und Projektbedingungen erstellt. Keine privaten
Prüfungsaufgaben, Normenauszüge, Herstellerkennlinien oder Lösungsschlüssel
wurden übernommen. Die allgemeinen fachlichen Themen sind keine Behauptung
über konkrete zukünftige Prüfungsfragen oder vollständige Prüfungsabdeckung.

Die Bedingungen, die zum Lösen gebraucht werden, stehen jeweils im Kontext.
Ausdrücklich fiktive Projektregeln sind keine allgemeinen rechtlichen,
normativen oder herstellerbezogenen Vorgaben. Reale Anlagen, Sicherheitsketten,
Prüfverfahren und Reparaturen benötigen ihren eigenen aktuellen Fachquellen-
und Freigabeabgleich. Die Aufgaben geben keine realen Prüfdrücke, Grenzwerte,
Schutzüberbrückungen oder praktischen Eingriffsanleitungen vor.

Status: `reviewed_for_stated_use`, Inhaltsversion 1, für selbstständiges Üben mit
Auswahlantworten unter genau den jeweils gegebenen Modellbedingungen. Prüfung
umfasst ausreichende Angaben, eigenständige Herleitung des Schlüssels,
Abgrenzung der Aussage, Plausibilität und die Alternativen. Es sind keine
arithmetischen Ergebnisberechnungen erforderlich; daher wurde keine nicht
benötigte Rechenausführung als Fachprüfung ausgegeben. Strukturelle Tests sind
zusätzliche Datenchecks und ersetzen die begrenzte redaktionelle Prüfung nicht.

## Einzelprüfung und akzeptierter Kern

Alle Kennungen unten haben das Präfix `exam-` und das Suffix `-v1`.

| Kennung ohne Präfix/Suffix          | Lernanforderung und entscheidende Bedingung                                                                                             | Akzeptierter Kern und Grenze                                                                                                                                                              |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ap-context-systemkombination`      | Einzelmaße von einem ausdrücklich geforderten Kombinationsnachweis unterscheiden. Freigabeblatt betrifft X, Lieferung Y.                | Der Nachweis für die tatsächliche Kombination fehlt. Weder Einzelwerkstoffnachweis noch gleiche Maße oder passende Nenngröße ersetzen ihn; Y wird nicht allgemein als ungeeignet erklärt. |
| `ap-context-transportfolge`         | Vorfertigung am Transportweg ausrichten. Ganzes Modul passt nicht; dokumentierte Teilmodule passen und können am Ziel verbunden werden. | Getrennt einbringen, am Ziel fertigstellen. Keine zusätzlichen Transportwege oder Türarbeiten annehmen; keine reale Last-/Hebemittelplanung.                                              |
| `ap-context-bezugsniveau`           | Die fehlende Verbindung zweier vollständiger, aber unterschiedlicher Höhenbezüge identifizieren.                                        | Bestätigter Höhenunterschied Rohboden/Fertigfußboden fehlt. Anschlussvorgabe nicht neu erfinden; keine normative Anschlusshöhe.                                                           |
| `ap-context-leistungsdaten`         | Leistungszahlen erst bei gemeinsamen Betriebsbedingungen vergleichen.                                                                   | Daten von A am Projektbetriebspunkt fehlen. Höherer Prospektwert belegt weder Vorteil noch Untauglichkeit. Keine unbekannte Kennlinie oder Umrechnung annehmen.                           |
| `ap-context-messstellenzuordnung`   | Dokumentenbezug trotz geänderter Raumnamen erhalten.                                                                                    | Stabile Kennungen mit den neuen Zonen in Plan und Protokoll eindeutig verbinden. Keine alphabetische oder sonst unbelegte Zuordnung.                                                      |
| `ap-context-messbedingung`          | Einen vorgegebenen Ein-Faktor-Vergleich vorplanen.                                                                                      | Türen und zusätzlichen Ventilator als weitere Einflüsse angleichen; gleicher Messort genügt nicht. Kein Gebäudebetrieb vorgeschrieben.                                                    |
| `ap-context-pruefumfang`            | Historische Nachweise nicht nachträglich auf ungeprüfte Erweiterungen ausdehnen.                                                        | Belegten Umfang A erhalten, fehlenden Nachweis für den aktuellen Aufbau klären. Keine Prüfwerte/-verfahren für reale Leitungen ableiten.                                                  |
| `ap-context-automatiknachweis`      | Konfiguration, Handbetrieb und Funktionsnachweis unterscheiden.                                                                         | Automatik unter den vereinbarten Bedingungen ohne überlagernde Daueranforderung prüfen. Eingetragenes Programm oder Handbetrieb ersetzt das nicht.                                        |
| `si-context-zeitbasis`              | Ereignisreihenfolge aus getrennten, nicht abgeglichenen Uhren beurteilen.                                                               | Gemeinsame Zeitbasis oder eindeutiges gemeinsames Referenzereignis herstellen. Vorher keine Reihenfolge/Ursache aus Uhrzeitgrößen ableiten.                                               |
| `si-context-gleichzeitig-geaendert` | Wirkung mehrerer gleichzeitiger Änderungen von einzelner Ursache trennen.                                                               | Nur unauffälligen Verlauf der gemeinsam geänderten Konfiguration im geprüften Zeitraum festhalten. Keine reale Fehlerrückrüstung verlangen.                                               |
| `si-context-druck-temperatur`       | Einen Trend nur bei ausreichender Vergleichbarkeit bewerten.                                                                            | Temperatur, Füllzustand und Messzuordnung fehlen für den Schluss auf ein Leck. Weder Leck noch vollständige Temperaturerklärung behaupten.                                                |
| `si-context-messort`                | Ortsabhängige reale Temperaturunterschiede von Messkanalabweichung unterscheiden.                                                       | Messketten unter geeigneten gleichen Orts-/Zeitbedingungen vergleichen. Stabile Werte an verschiedenen Stellen sind kein Defektnachweis.                                                  |
| `si-context-messgrenze-filter`      | Ein geändertes Messobjekt beim Vorher/Nachher-Vergleich erkennen.                                                                       | Neuer Gesamtwert umfasst Filter und zusätzlichen Luftweg; Beiträge noch trennen. Gleicher Volumenstrom allein identifiziert den Filteranteil nicht.                                       |
| `si-context-zweigvergleich`         | Einen behaupteten Zweigfehler von ungleichen Anforderungen/Lasten trennen.                                                              | Vergleich im vorgesehenen Modelltest bei vergleichbaren Bedingungen. Beobachtungsdauer ersetzt keine Kontrolle der Randbedingungen.                                                       |
| `si-context-freigabekette`          | Notwendige Freigabebedingungen getrennt auswerten.                                                                                      | Aktive Sperre erklärt ausbleibende Freigabe im Modell; Herkunft der Sperre bleibt offen. Keine Hardwarediagnose oder Schutzüberbrückung.                                                  |
| `si-context-ereignisnachweis`       | Aussage eines Tests auf tatsächlich eingetretene Zustände begrenzen.                                                                    | Kurzer Test war unauffällig; Nachweis des nicht aufgetretenen Umschaltvorgangs fehlt. Weder Reparaturerfolg noch Wirkungslosigkeit dafür bewiesen.                                        |

## Bewertungsbasis

Die jeweils hinterlegte Auswahl ist richtig, wenn sie den entscheidenden
Projektbezug und die Grenzen des Befunds einhält. Die drei Alternativen wurden
gegen denselben Kontext geprüft: Sie ignorieren eine konkrete Bedingung,
verwechseln Nachweis mit Annahme oder leiten eine nicht beobachtete Eigenschaft
ab. Die richtigen Positionen sind gleichmäßig verteilt; eine Antwortlänge oder
Position ist kein beabsichtigtes Lösungsmerkmal. Die Hinweise lenken auf eine
Prüffrage, ohne den Antworttext vorzugeben.

Bei freier Besprechung sind gleichwertige Formulierungen zulässig, die den
entscheidenden Bezug und die Grenze richtig erklären. Ansatz und korrekte
Einzelbeobachtungen können getrennt rückgemeldet werden; dafür werden keine
amtlichen Teilpunkte erfunden. Die App-Auswahlbewertung prüft lediglich den
gewählten Schlüssel, keine vollständige frei eingegebene Begründung.

Es wurden keine Lernendenversuche, tatsächlichen Bearbeitungszeiten oder
Fortschrittsereignisse erstellt. Alte Kennungen, Varianten und Antworten bleiben
unverändert. Die eigenen Lösungen werden wie bisher mit der Übungsapp
ausgeliefert; dieser Inhalt ist kein gegen Einsicht geschützter Prüfungsbogen.

## Unabhängige zweite Durchsicht

Die 16 exakten Aufgaben wurden zusätzlich von einem getrennten redaktionellen
Reviewer auf Eindeutigkeit der Schlüssel, Aussagenreichweite und Überschneidungen
mit dem vorhandenen Bestand gelesen. Zwei vorwegnehmende Titel wurden neutral
formuliert (Messbedingungen und Automatiknachweis); bei Systemkombination und
Bezugsebene wurden die Ablenker fachlich näher an die jeweilige Entscheidung
gerückt. Die Schlüssel und Modellbedingungen blieben unverändert.
