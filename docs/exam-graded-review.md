# Neue Aufgaben mit begründeter Schwierigkeit · Inhaltsversion 1

Datum: 23. Oktober 2026. Exakter Umfang: die 24 eigenen Aufgaben in
`src/content/exam-graded.ts`, je acht Arbeitsplanung, Systemanalyse und
Instandhaltung sowie WiSo. Herkunft jeweils `original`, Version 1. Es handelt
sich um sechs Rechenaufgaben, 14 Kontextentscheidungen und vier Wissensfragen.
Keine bestehende Kennung, Antwort oder Lernerakte wurde geändert.

## Nutzung und Prüfumfang

Status der hier beschriebenen Fassung: `reviewed_for_stated_use` für
selbstständiges Üben mit Auswahlantworten unter den jeweils ausdrücklich
genannten Modellbedingungen. Die erste redaktionelle Prüfung umfasst
ausreichende Angaben, unabhängige Herleitung der Lösung, passende Einheiten,
eindeutige Auswahl, Aussagegrenzen und Plausibilität der Alternativen. Es wurden
keine privaten Prüfungsinhalte, Bücher, Herstellerdaten oder Lösungsschlüssel
übernommen. Modellregeln sind keine allgemeinen normativen oder gesetzlichen
Vorgaben. Das ist keine Prüfungsausschussfreigabe, keine vollständige
Prüfungsabdeckung und keine Aussage über Nicks tatsächliche Fähigkeiten.

Die numerischen Beispiele wurden zusätzlich tatsächlich mit Python
`decimal.Decimal` nachgerechnet; die Druckkraft nutzt `math.pi` als
numerischen Näherungswert. Die endlichen Ablauf-, Zustands- und Auswahlmodelle
wurden separat vollständig bzw. anhand aller vorgegebenen Fälle ausgewertet.
Die tatsächlichen Resultate stehen in `exam-graded-calculations.json`.

## Schwierigkeit ist eine redaktionelle Anforderungsbeschreibung

Die vier Stufen sind keine empirisch gemessenen Lösungsquoten. Weder
Textlänge noch Antwortformat bestimmt den Grad. Die Fassung enthält vier Fälle
mit Stufe 1, zehn mit Stufe 2, sechs mit Stufe 3 und vier mit Stufe 4:

- **1 Einstieg:** Einen Begriff oder eine bekannte Zuordnung unmittelbar
  abrufen; keine vernetzte Entscheidung.
- **2 Anwenden:** Bekannte Regeln und vorgegebene Methoden mit ihren
  Einheiten oder mehreren ausdrücklich genannten Bedingungen anwenden.
- **3 Transfer:** Darstellung wechseln, geeigneten Unterscheidungsfall oder
  Vergleich wählen, einen Schnittpunkt bzw. eine Ganzzahligkeitsgrenze
  bestimmen oder eine vorgelagerte Abhängigkeit erkennen.
- **4 Vernetzt:** Mehrere zugleich wirksame Bedingungen, zeitliche
  Zustände, Ressourcen oder Hypothesen zusammenführen. Eine einzelne
  Schlüsselbeobachtung oder eine bloße Summe reicht nicht.

## Einzelprüfung

Alle Kennungen haben das Präfix `exam-` und das Suffix `-v1`.

| Kennung ohne Präfix/Suffix            | Grad | Unabhängig hergeleiteter Lösungskern und Grenze                                                                                                                                                                                                                                                                                         |
| ------------------------------------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ap-graded-stueckliste`               | 1    | Stückliste verbindet Positionsnummern mit Teilbezeichnung und Menge. Kein Nachweis eines konkreten Bestellbedarfs.                                                                                                                                                                                                                      |
| `ap-graded-druckkraft`                | 2    | 3 bar = 300 000 Pa; d = 0,020 m; F = Δp · πd²/4 = 94,2477796… N, gerundet 94,25 N. Gleichmäßiger Modelldruck ohne andere Kräfte; keine Antriebsauslegung.                                                                                                                                                                               |
| `ap-graded-laengenaenderung`          | 2    | ΔT = 35 K; 12 · 0,012 · 35 = 5,04 mm. Fiktive konstante Materialkenngröße; keine reale Befestigungs- oder Ausgleichsplanung.                                                                                                                                                                                                            |
| `ap-graded-personalablauf`            | 4    | A 8–9; B und C parallel 9–11; D 11–13 mit beiden Personen; E 13–14. Die zwingende Kette benötigt sechs Stunden. Enumerierter Mindestabschluss 14 Uhr.                                                                                                                                                                                   |
| `ap-graded-messgeraetwahl`            | 2    | Nur B deckt den Bereich bis 300 kPa ab und unterschreitet zugleich ±5 kPa. Keine reale Prüf- oder Normvorgabe.                                                                                                                                                                                                                          |
| `ap-graded-oder-prueffall`            | 3    | A falsch/B falsch/C wahr unterscheidet `(A UND B) ODER C` von `A UND (B ODER C)`. Die drei anderen Testzustände tun das nicht. Reine simulierte Wahrheitswerte.                                                                                                                                                                         |
| `ap-graded-schnittstellentyp`         | 2    | Die dokumentierten Signalarten sind verschieden. Eine passende Anpassung oder Alternative muss belegt sein; kein Defekt und keine praktische Verdrahtung werden behauptet.                                                                                                                                                              |
| `ap-graded-volumenmessplan`           | 2    | Zusatzvolumen ist Endstand minus Anfangsstand an den festgelegten Zeitgrenzen, da Entnahme und Überlauf ausgeschlossen sind.                                                                                                                                                                                                            |
| `si-graded-betriebspunkt`             | 1    | Schnittpunkt der Pumpen- und Anlagenkennlinie bildet gleiche Druckdifferenz bei gleichem Volumenstrom im stationären Modell. Keine reale Betriebsfreigabe.                                                                                                                                                                              |
| `si-graded-hydraulische-leistung`     | 2    | 0,72 m³/h = 0,0002 m³/s; 50 kPa = 50 000 Pa; 10 W hydraulisch. Elektrische Aufnahme ohne Wirkungsgrad unbekannt.                                                                                                                                                                                                                        |
| `si-graded-massenstromverhaeltnis`    | 3    | Zwei warme und ein kalter Massenanteil: `(2 · 60 + 15) / 3 = 45 °C`. Trockene verlustfreie Mischung, gleiche konstante Wärmekapazität; kein Feuchtemodell.                                                                                                                                                                              |
| `si-graded-pruefplanung-hypothesen`   | 4    | Nur Rückmeldung plus unabhängige Durchflussreferenz erzeugen drei verschiedene Paare. Die Dauer ist bei allen gleich. Vollständigkeit und Einzelfehlerannahme gelten nur im vorgegebenen Modell.                                                                                                                                        |
| `si-graded-hysterese-mindestzeit`     | 4    | Minute 5 an wegen Mindestzeit; Minute 10 aus wegen gespeichertem Wunsch; Minute 12 wieder an. Ausschließlich die vier ausdrücklich genannten diskreten Messzeitpunkte werden ausgewertet, keine weiteren Schaltbedingungen dazwischen. Vollständige Zustandsfolge im numerischen Nachweis. Kein reales Reglerverhalten verallgemeinert. |
| `si-graded-messintervalle`            | 2    | Beide Reihenfolgen und gleiche Werte sind innerhalb der überlappenden sicheren Bereiche möglich. Keine Wahrscheinlichkeits- oder Verteilungsannahme.                                                                                                                                                                                    |
| `si-graded-abtastung`                 | 3    | Ein dreisekündiges Ereignis kann ganz zwischen einzelnen 30-Sekunden-Speicherpunkten liegen. Nichtbeobachtung ist ohne Zusatzspeicher kein Ausschluss.                                                                                                                                                                                  |
| `si-graded-sollwertbegrenzung`        | 2    | Wirksamer Sollwert min(60,45) = 45 °C; Messwert entspricht dieser Grenze. Weder Fühlerdefekt noch zulässiges reales Temperaturniveau daraus abgeleitet.                                                                                                                                                                                 |
| `wiso-graded-produktivitaet`          | 1    | Fertige Einheiten bezogen auf eingesetzte Arbeitsstunden, unter ausdrücklich gleicher Qualität und gleichem Umfang. Kein pauschaler Betriebsleistungsnachweis.                                                                                                                                                                          |
| `wiso-graded-dbquote`                 | 1    | Betrachteter Teil DB geteilt durch ausdrücklich positiven Nettoerlös, multipliziert mit 100 %. Weder Gewinn noch Fixkostendeckung.                                                                                                                                                                                                      |
| `wiso-graded-miete-kauf`              | 3    | Kaufnettoaufwand 360 €; `360 + 8d ≤ 35d` erst ab d ≥ 13,333…; somit mindestens 14 ganze Tage. Sicherer Wiederverkauf und ausgeschlossene Zusatzkosten gehören zum Modell.                                                                                                                                                               |
| `wiso-graded-ruestzeit-serie`         | 3    | `60 + 12n ≤ 15 + 16n` ergibt n ≥ 11,25; ab 12 ganzen Stücken. Gleiche Qualität und Personalzahl ausdrücklich vorausgesetzt.                                                                                                                                                                                                             |
| `wiso-graded-auftragsmix-liquiditaet` | 4    | Von 650 € müssen 100 € verbleiben; B+C benötigen 550 € und 5 h für 460 € DB. Vollständige Enumeration aller acht Kombinationen bestätigt das zulässige Maximum. Kein realer Finanzierungs- oder Insolvenzbefund.                                                                                                                        |
| `wiso-graded-lieferquelle-risiko`     | 3    | Zwei Händler hängen für diese Teile ohne eigene Lagerbestände vom selben Zentrallager ab. Ein unabhängiger Weg ist noch nicht belegt; kein Ausfall oder Vertragsbruch behauptet.                                                                                                                                                        |
| `wiso-graded-preisrisiko-budget`      | 2    | Nur 1 000 € fest erfüllen 1 100 € in jedem Preisfall. B kann 1 150 € erreichen, auch wenn günstigere Fälle möglich sind. Keine allgemeine Beschaffungsregel.                                                                                                                                                                            |
| `wiso-graded-vergangene-ausgaben`     | 2    | Nicht rückholbare frühere Gebühr ist bei beiden Varianten gleich; entscheidend sind noch unterschiedliche künftige Folgen. Kein bestimmtes Fortsetzen/Abbrechen und keine Bilanzierungsregel vorgegeben.                                                                                                                                |

## Bewertungsbasis und Trennung

Die richtige Auswahl muss jeweils den in der Tabelle beschriebenen Kern und
seine Grenze erfüllen. Andere sprachliche Formulierungen oder alternative
Rechenwege mit korrekten Einheiten sind beim freien Besprechen gleichwertig.
Bei den Rechnungen können Ansatz, Umrechnung, Ausführung und Interpretation
getrennt rückgemeldet werden. Bei den Kontextaufgaben lassen sich relevante
Bedingungen, ihr gemeinsames Anwenden und die Reichweite der Schlussfolgerung
getrennt besprechen. Daraus entstehen keine amtlichen Teilpunkte oder
automatischen Bewertungen des frei eingetragenen Rechenwegs.

Hinweise und Lösungen stehen getrennt von den Aufgaben. Zeitangaben sind
redaktionelle Vorschläge von zwei bis fünf Minuten. Es wurden keine echten
Lernversuche, Lernstände oder gemessenen Nutzerzeiten erzeugt. Die eigenen
Antwortschlüssel werden wie bisher mit der Übungsapp ausgeliefert; die
Inhalte sind kein gegen Einsicht geschützter Prüfungsbogen.
