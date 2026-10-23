# Arbeitsplanung · zwölf eigene Übungsaufgaben

Stand: 23. Oktober 2026. Datei: `src/content/exam-planning.ts`.
SHA-256 der formatierten Datei:
`9b24c50ccd5528f61a62d5db3aafbe9695c78f635c2e91594daf98068f0d55ac`.

## Herkunft und Prüfgrenze

Alle zwölf Aufgaben sind neu formulierte **eigene Übungsaufgaben**, jeweils
Inhaltsversion 1 und Ursprung `original`. Es wurden keine privaten Fragen,
Originalprüfungen oder persönlichen Lerndaten übernommen. Weder eine Vorhersage
der Prüfung vom 7. Dezember 2026 noch eine offizielle Aufgabenfreigabe oder
Punkteverteilung wird behauptet.

Die Zuordnung zur Arbeitsplanung ist eine didaktische Zuordnung anhand der
geübten Planungshandlung. Der Hauptagent ergänzt den Bezug zur primären
Ausbildungs-/Prüfungsbeschreibung separat. Eine externe fachliche Quellenprüfung
dieser Aufgaben wurde hier nicht durchgeführt. Quelle, Ausgabe, Fundseite und
Seitenzählung eines externen Aufgabentextes sind deshalb `nicht anwendbar`;
es existiert kein übernommener externer Aufgabentext.

Redaktioneller Status bei Übergabe: `draft` für die unabhängige Gesamtprüfung.
Die unten beschriebenen Rechnungen und die Übereinstimmung mit den jeweiligen
Antwortoptionen sind selbst geprüft. Das ist keine Normen-, Hersteller- oder
Prüfungsausschussfreigabe.

Sämtliche für eine Bewertung benötigten Maße, Zuschläge, Leistungspunkte,
Schallangaben, Kosten und Ablauffolgen stehen im jeweiligen Aufgabentext. Die
gegebenen Werte sind **Modell- bzw. Auftragsannahmen**. Insbesondere sind
25 mm Einsteckung, 2 % Gefälle, 10 % Leistungsreserve und 500 mm Bedienbereich
keine behaupteten allgemeinen Ausführungsregeln. Die Zeichnungsaufgaben sind
vollständig als Text beschrieben und benötigen keine nicht vorhandene Abbildung.

## Aufgabeninventar und didaktischer Abgleich

Alle Aufgaben verwenden einen eigenen Fall, vier Antwortmöglichkeiten und genau
eine richtige Auswahl. Die Übungsbewertung lautet jeweils: richtige Auswahl =
erfüllt; jede andere Auswahl = noch nicht erfüllt. Es gibt keine offizielle
Punktezahl und keine Teilpunkte bei diesem Auswahlformat. Die Erklärungen nennen
die Modellgrenze und erläutern die typischen Fehlansätze. Hinweise nennen eine
Denkstrategie, ohne eine markierte Antwort oder den Ergebniswert vorwegzunehmen.

| ID · Version 1                     | Geübte Planungshandlung                                               | Schlüssel                                                   | Besonderheit / Grenze                                                              |
| ---------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `exam-ap-rohrzuschnitt-v1`         | Einbaumaß in eine Zuschnittliste übertragen                           | C: 1 770 mm                                                 | Freier Abstand und beidseitige Einsteckstrecken ausdrücklich getrennt              |
| `exam-ap-bestellmenge-v1`          | Nutzbedarf, Reserve, Lieferlos und Schnittplan verbinden              | B: zwei Stangen, 12,00 m                                    | Reserve deckt die modellierten Schnittverluste ab; Einzelstücke passen tatsächlich |
| `exam-ap-hoehenplanung-v1`         | Aus Längengefälle eine Endhöhe bestimmen                              | D: +1,110 m                                                 | Rohrachse, waagerechte Bezugslänge und Fallrichtung genannt                        |
| `exam-ap-heizflaechenwahl-v1`      | Leistungsanforderung in eine Katalogauswahl übersetzen                | A: 1,60 kW                                                  | Alle Katalogleistungen gelten für dieselben Modellbedingungen                      |
| `exam-ap-luefter-arbeitspunkt-v1`  | Raumwerte summieren und einen belegten Betriebspunkt wählen           | C: Modell C                                                 | Keine Leistung an unbekannten Kennlinienpunkten unterstellt                        |
| `exam-ap-angebotsvergleich-v1`     | Material- und Arbeitskosten gemeinsam vergleichen                     | C: B ist 6,00 € günstiger                                   | Nettovergleich unter explizitem Ausschluss weiterer Kosten                         |
| `exam-ap-ablaufabhaengigkeiten-v1` | Abhängigkeiten in einen eindeutigen Ablauf umsetzen                   | A: Aufmaß → Zuschnitt → Montage → Kontrolle → Schließen     | Planspiel, keine vollständige Montage- oder Sicherheitsanweisung                   |
| `exam-ap-anschlussklaerung-v1`     | Fehlende Daten vor einer Beschaffung erkennen                         | D: Identifikation, Aufmaß und Zeichnungsabgleich            | Keine konkrete Herstellerkompatibilität behauptet                                  |
| `exam-ap-revisionszugang-v1`       | Leitungsführung mit einer verbindlichen Auftragsanforderung abstimmen | B: abgestimmte Route B dokumentieren                        | Bedienbereich ist ausschließlich fiktive Kundenvorgabe                             |
| `exam-ap-pruefplan-v1`             | Ein bestandenes und ein ungeprüftes Kriterium unterscheiden           | C: Sichtkontrolle durchführen und tatsächlich dokumentieren | Modellkontrolle ist kein realer Dichtheitsnachweis                                 |
| `exam-ap-variantenmatrix-v1`       | Muss-Kriterien vor dem Preisvergleich anwenden                        | B: Modell C                                                 | Schallwerte sind laut Kontext für diese Tabellenaufgabe vergleichbar               |
| `exam-ap-uebergabeunterlagen-v1`   | Übergabearbeiten aus einem vereinbarten Umfang ableiten               | D: Unterlagen, tatsächliche Dokumentation und Einweisung    | Keine vollständige gesetzliche Übergabepflicht abgeleitet                          |

## Ausgeführte unabhängige Rechenableitung

Am 23.10.2026 wurde im Host-Python mit `decimal.Decimal` gerechnet und jedes
Ergebnis gegen einen explizit hinterlegten Referenzwert geprüft. Dieser Lauf
importierte weder die Aufgabenwerte noch deren Antwortschlüssel aus TypeScript;
die Berechnungen wurden aus den beschriebenen Auftragsdaten neu aufgestellt.
Alle elf numerischen Assertions bestanden.

```text
Rohrzuschnitt: 1720 + 2 × 25 = 1770 mm
Bestellmenge, Nutzlänge: 4 × 2.35 = 9.40 m
Bestellmenge, Bedarf: 4 × 2.35 × 1.08 = 10.1520 m
Bestellmenge, rechnerische Stangen: 10.1520 / 6 = 1.6920
Höhenplanung, Verlust: 4.50 × 2.0 / 100 = 0.090 m
Höhenplanung, Endhöhe: 1.200 − 0.090 = 1.110 m
Heizflächenwahl: 1.40 × 1.10 = 1.5400 kW
Lüfterauswahl, Summe: 45 + 40 + 35 = 120 m³/h
Kosten A: 45 × 8.40 + 3.0 × 56.00 = 546.000 €
Kosten B: 400.00 + 2.5 × 56.00 = 540.000 €
Vorteil B: 546.000 − 540.000 = 6.000 €
```

Zusätzlich wurden die diskreten Entscheidungen geprüft: zwei 2,35-m-Stücke
passen auf jede 6-m-Stange; die kleinste lieferbare ausreichende Heizleistung
ist 1,60 kW; nur der für C genannte Lüfterbetriebspunkt deckt beide vorgegebenen
Größen ab; C ist in der Variantenmatrix das günstigere der beiden zulässigen
Modelle. Formelgrößen und Einheiten sind jeweils im Kontext definiert.

Die Prüfnachweise ändern keine Lernversuche, Lernstände oder Privatdaten.
Die Aufgaben sind für den offenen Übungsmodus bestimmt: Der App-Client erhält
Antwortschlüssel und Erklärungen. Daraus entsteht kein geschützter Prüfungsmodus.

## Noch durch die Gesamtintegration zu prüfen

- Import in den gemeinsamen Aufgabenbestand, eindeutige IDs und Such-/Filterwege.
- Unabhängige zweite Sicht auf Antwort-Eindeutigkeit und Begrifflichkeit.
- Produktionsbuild und vorhandene Lern-/Browserprüfungen.
- Verknüpfung zur Prüfungsbereichsübersicht ohne Aussage über tatsächliche
  Aufgabenwahrscheinlichkeit oder vollständige Prüfungsabdeckung.

Ein Inhaltswechsel nach dieser Prüfung braucht eine neue Version und einen
erneuten Abgleich; bestehende Aufgabenkennungen dürfen keine anderslautenden
Antwortschlüssel erhalten.


## Integrations-Gegenprüfung am 23. Oktober 2026

Die erste Inhaltsfassung wurde vor der Veröffentlichung gegengeprüft. Für die
Planungsfälle erfolgte eine unabhängige Rechen- und Logikprüfung durch einen
zweiten Agenten; für die Rechtsfälle verglich Root die formulierten Standardfälle
mit den tatsächlich gelesenen Primärpassagen. Die beschriebenen Grenzen gelten
weiter. Status für diese erste Fassung: `reviewed_for_stated_use`, ausschließlich
für das dokumentierte Modellüben bzw. die eng begrenzten Rechtsfälle. Die technische
App-Prüfung wird separat in den Release-Notizen dokumentiert.
