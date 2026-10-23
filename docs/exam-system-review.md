# Eigene Übungsaufgaben: Systemanalyse und Instandhaltung

Inhaltsrevision: **1**. Stand der Erstellung und Prüfung: **23.10.2026**.
Datei: `src/content/exam-system.ts`. Alle zwölf Aufgaben haben Ursprung
`original` und sind als eigene Übungsaufgaben gekennzeichnet. Es wurden keine
privaten Fragen, Originalprüfungen, Herstellerunterlagen oder Lösungsschlüssel
übernommen. Externe Quellenidentität, Ausgabe und Seitenstelle: **nicht
verwendet**. Die Zuordnung zum Prüfungsbereich ist eine didaktische Zuordnung
von Modellaufgaben, kein Nachweis tatsächlicher Prüfungsinhalte oder ihrer
Gewichtung. Ein Abgleich mit dem übergeordneten Prüfungsrahmen erfolgt getrennt.

## Prüfstatus und Grenzen

Status: `reviewed_for_stated_use` für die hier festgehaltene Revision 1 und den
begrenzten Einsatz als selbstständige Modellübung. Geprüft wurden
Aufgabenannahmen, eindeutige Antwortauswahl, Einheiten, Rechenwege, zulässige
Schlussfolgerungen und getrennte Hinweise/Lösungen. Das ist eine rechnerische
und didaktische Prüfung durch den erstellenden Agenten, keine unabhängige
fachliche Zweitfreigabe, Normenprüfung oder offizielle Prüfungsausschussfreigabe.
Eine weitere unabhängige Code-/Inhaltsprüfung kann diesen Status ergänzen.

Die Szenarien betreffen ausschließlich vorbereitete Protokolle und fiktive
Modellregeln. Sie geben keine Anleitung für Arbeiten an elektrischen, Gas- oder
anderen gefährlichen Anlagen. Vorgegebene Toleranzen und Schaltregeln sind
Aufgabenannahmen. Allgemeine Normen, Herstellerkennlinien, Austauschfristen und
Auslegungswerte werden nicht behauptet oder zur Bewertung vorausgesetzt.

## Aufgaben und Nachweise

| Stabile Aufgaben-ID           | Lernziel / Modellannahmen                                                                     | Geprüfter Kern                                                                                                                                                        |
| ----------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `exam-si-waermeleistung`      | Stationäre Wärmeleistung aus Messdaten; Wasser mit ρ = 1 kg/l, c = 4,2 kJ/(kg·K), verlustfrei | 720/3600 × 4,2 × (45−40) = **4,2 kW**. Halbe Planspreizung bei gleichem Durchfluss → halbe Planleistung. Kein eindeutiger Defekt ableitbar.                           |
| `exam-si-sensorkennlinie`     | Fiktive lineare Widerstandskennlinie auswerten, kein realer Fühlertyp                         | (1160−1000)/4 = **40 °C**. Rückeinsetzen ergibt 1160 Ω.                                                                                                               |
| `exam-si-ventilrueckmeldung`  | Sollwert, unabhängige Rückmeldung und vorgegebene Stellzeit vergleichen                       | 100 % Anforderung, unverändert 20 % Rückmeldung nach 4 min bei 1 min Modellfrist → Sollstellung nicht erreicht. Ursache noch offen.                                   |
| `exam-si-energiebilanz`       | Messzeitraum und Messgrenze eines Energieverhältnisses beachten                               | 12 kWh/4 kWh = **3**; keine Jahresarbeitszahl aus kurzem Messzeitraum.                                                                                                |
| `exam-si-zaehlervergleich`    | Zählerdifferenz und gemittelten Durchfluss unterscheiden                                      | (12,433−12,430) m³ = 3 l; 3/5 = **0,6 l/min**. Kein Leckort bestimmbar.                                                                                               |
| `exam-si-mischprobe`          | Massenabhängige Mischtemperatur und Plausibilität                                             | (2×60 + 1×15)/3 = **45 °C**. Zwischen den Ausgangstemperaturen und näher an der größeren heißen Teilmenge. Gleiche Wärmekapazität, kein Gefäß-/Verlust-/Phaseneffekt. |
| `exam-si-druckverlust`        | Vergleichbare Betriebsbedingungen vor Diagnose verlangen                                      | 45 kPa > 15 kPa, aber Durchflussvergleich fehlt. Widerstandsänderung, Grenzwertüberschreitung oder Defekt nicht eindeutig.                                            |
| `exam-si-temperaturvergleich` | Auffällige Messkette von bewiesenem Bauteildefekt trennen                                     | A: 0,1 K Abweichung innerhalb ±0,5 K; B: 15,0 K außerhalb. Grenze ist Modellannahme; Messkette B nicht Einzelbauteil lokalisiert.                                     |
| `exam-si-luftmessung`         | Luftmenge aus gemittelter Geschwindigkeit und freier Fläche, Sollvergleich                    | 0,060×2,5×3600 = **540 m³/h**; 540/600 = **90 %**. Kein Ursachenbeweis.                                                                                               |
| `exam-si-filtertrend`         | Widerstandsverhältnis bei gleichem Volumenstrom auswerten                                     | Δp = R V̇²; R_neu/R_alt = 200/80 = **2,5** bei gleichem V̇. Kein Austauschgrenzwert angegeben.                                                                          |
| `exam-si-luftbilanz`          | Stationäre Bilanz und unbekannte Netto-Strömwege                                              | 220−180 = **40 m³/h netto nach außen** über weitere Wege. Kein Druck in Pa oder Ventilatordefekt ableitbar. Gleicher Luftzustand, keine Speicherung.                  |
| `exam-si-schalthysterese`     | Haltebereich anhand vorherigen Zustands auswerten                                             | Start EIN bei 19 °C, danach 21 °C im definierten Haltebereich → **EIN**. Ausschaltung erst >22 °C.                                                                    |

## Tatsächlich ausgeführte Rechenkontrolle

Die acht wesentlichen Zahlenmodelle wurden in Python 3 mit `decimal.Decimal`
erneut berechnet und mit Assertions geprüft. Ergebnis des ausgeführten Laufs:

```text
exam-si-waermeleistung 4.20
exam-si-sensorkennlinie 40
exam-si-energiebilanz 3
exam-si-zaehlervergleich 0.6
exam-si-mischprobe 45
exam-si-luftmessung 540.000
exam-si-filtertrend 2.5
exam-si-luftbilanz 40
```

Verwendete Kernrechnung (nicht aus einem privaten Dokument übernommen):

```python
from decimal import Decimal as D
assert D(720)/D(3600)*D('4.2')*D(5) == D('4.2')
assert (D(1160)-D(1000))/D(4) == D(40)
assert D(12)/D(4) == D(3)
assert D(3)/D(5) == D('.6')
assert (D(2)*D(60)+D(1)*D(15))/D(3) == D(45)
assert D('.06')*D('2.5')*D(3600) == D(540)
assert D(200)/D(80) == D('2.5')
assert D(220)-D(180) == D(40)
```

## Übungsbewertung

Pro Aufgabe ist genau die hinterlegte Auswahl innerhalb des angegebenen Modells
begründet. In der bestehenden Auswahloberfläche wird sie als richtig/falsch
bewertet; es werden keine offiziellen Punkte oder Teilpunkte behauptet.
Antwortalternativen, die bei anderen Betriebsbedingungen möglich wären, sind
keine gleichwertige Lösung des ausdrücklich begrenzten Modells. Ein geöffnetes
Lösungsfeld belegt keine selbstständige Lösung und erzeugt keinen eigenen
Kompetenznachweis. Inhalte und Lernfortschritt bleiben getrennt.

Vier Aufgaben je Thema Heizung, Sanitär und Klima/Lüftung; korrekte Optionen
A/B/C/D jeweils dreimal. Die vorgeschlagenen 3–4 Minuten sind redaktionelle
Orientierung und keine gemessene Bearbeitungsdauer. Der Teil-2-Bezug ersetzt
keine vollständige Prüfungsvorbereitung; normative und praktische Kompetenzen
benötigen die passenden Fachquellen und Betreuung.
