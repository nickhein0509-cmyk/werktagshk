# Formelwerkstatt · Erweiterung auf 21 Lernmodelle

Stand: 23. Oktober 2026. Die Werkzeugansicht bietet jetzt 21 Formelmodelle mit
64 ausdrücklich unterstützten Umstellungen. Das ist eine **Auswahl zum Üben**,
keine vollständige SHK-Formelsammlung und keine Abdeckung aller Aufgabenfamilien
im privaten Fragenbestand. Die bisherige Prüfung in
[`formula-workbench.md`](formula-workbench.md) beschreibt weiterhin genau die
damaligen acht Modelle; sie erteilt den neuen Modellen keine rückwirkende Freigabe.

## Auswahl und Bedienung

Die fünf Bereiche Wärme & Energie, Strömung & Druck, Luft & Mischen, Geometrie
und Elektro-Grundlagen sowie eine Textsuche begrenzen die Formelauswahl. Die
Werkstatt zeigt weiterhin eine Rechnung und eine Erläuterung daneben. Ein
Filter ohne Treffer lässt die aktuelle Rechnung geöffnet und bietet eine
Rücksetzung des Filters. Entwürfe je Modell bleiben innerhalb der geöffneten
Werkzeugansicht erhalten, auch beim Filtern.

Die bisherigen acht Modell-IDs und deren Einheiten, Ausgangsbeispiele und
Umstellungen bleiben erhalten. Eingabeeinheiten rechnen bestehende Werte um.
Ein Zielgrößenwechsel übernimmt das letzte gültige Ergebnis mit voller
JavaScript-Zahlengenauigkeit als bekannte Größe. Such- und Rechenaktionen
erzeugen keine Lernversuche oder Fortschrittseinträge. Beim Verlassen der
Werkzeugansicht oder Neuladen werden die Entwürfe nicht dauerhaft gespeichert.

## Neue Modelle und tatsächlich ausgeführte Referenzen

Die folgenden 40 Zielgrößen wurden separat mit Python berechnet: `Decimal`
mit 40 Stellen für die linearen Beziehungen, `math.pi` und `math.sqrt` für den
Kreis. Die Referenzen sind feste selbst gewählte Rechenbeispiele; sie stammen
nicht aus privaten Prüfungsfragen, deren Antwortschlüsseln oder berechneten
Produktionsausgaben. Die automatischen Tests prüfen alle aufgeführten Werte
mit numerischer Toleranz und jeweils umgerechneten Ein- oder Ausgabeeinheiten.

| Neues Modell               | Referenzfall                                    | Ergebnisse der unterstützten Umstellungen         |
| -------------------------- | ----------------------------------------------- | ------------------------------------------------- |
| Strömungsgeschwindigkeit   | 600 cm² und 2,5 m/s                             | 540 m³/h; 600 cm²; 2,5 m/s                        |
| Kreisquerschnitt           | Durchmesser 20 mm                               | 314,1592653589793 mm²; 20 mm                      |
| Raumvolumen                | 3 m × 4 m × 2,5 m                               | 30 000 l; 300 cm Länge; 4 m Breite; 2 500 mm Höhe |
| Hydrostatischer Druck      | 800 kg/m³, 12,5 m, g = 9,81 m/s²                | 0,981 bar; 0,8 kg/l; 12,5 m                       |
| Hydraulische Leistung      | 1,2 bar und 36 l/min                            | 72 W; 1,2 bar; 36 l/min                           |
| Wärmepumpen-Leistungszahl  | 14 kW Heizleistung, 3,5 kW elektrische Leistung | COP 4; 14 kW; 3 500 W                             |
| Lineare Wärmeausdehnung    | 18 m, 0,017 mm/(m·K), 40 K                      | 12,24 mm; 18 m; 0,017 mm/(m·K); 40 K              |
| Mischtemperatur            | 2 kg/s bei 10 °C und 3 kg/s bei 40 °C           | 28 °C Mischung; 10 °C Strom 1; 40 °C Strom 2      |
| Ohmsches Gesetz            | 8 Ω und 1,5 A für U; 12 V und 2 A für R/I       | 12 V; 0,006 kΩ; 2 000 mA                          |
| Elektrische Leistung       | 24 V und 0,125 A                                | 3 W; 24 V; 125 mA                                 |
| Druckkraft                 | 2,5 bar auf 80 cm²                              | 2 kN; 250 kPa; 80 cm²                             |
| Massenstrom                | 1,2 kg/m³ und 300 m³/h                          | 360 kg/h; 1,2 kg/m³; 300 m³/h                     |
| Sensible Luftwärmeleistung | 450 m³/h, 18 K, c′ = 0,34 Wh/(m³·K)             | 2,754 kW; 125 l/s; 18 K                           |

Zusätzlich ausgeführt: 106 Vitest-Fälle in `src/lib/formulas.test.ts` sowie
TypeScript-Prüfung mit `tsc -b`. Die Tests enthalten die früheren Referenzen,
alle 64 angekündigten Umstellungen in ihren angebotenen Ergebniseinheiten,
unzulässige Einheiten, Überlauf, nicht eindeutige Null-Nenner-Fälle, gültige
Nullergebnisse, Celsiusgrenzen sowie Such- und Bereichszuordnung. Die Prüfung
der initialen Beispiele allein dient nicht als unabhängiger Zahlenbeleg.

## Fachlicher Geltungsbereich

Jedes neue Modell beschreibt seine Voraussetzungen direkt in der Oberfläche:

- **Strömung und Massenstrom:** gleicher Fluidzustand und Querschnitt, gegebene
  Dichte bzw. flächengemittelte Normalgeschwindigkeit. Kein zulässiger Grenzwert
  und keine vollständige Dimensionierung eines Rohr- oder Kanalnetzes.
- **Kreis und Quader:** ideale Geometrie; beim freien Rohrquerschnitt ist der
  tatsächliche Innendurchmesser erforderlich. DN ist kein Ersatzwert.
- **Hydrostatik und Druckkraft:** gegebene konstante Dichte, ruhende Flüssigkeit
  bzw. gleichmäßige senkrechte Druckbelastung auf eine wirksame Fläche.
  Keine absolute Druckbestimmung, MAG- oder Sicherheitsarmaturenauslegung.
- **Hydraulische Leistung:** inkompressibles stationäres Fluid. Das Ergebnis
  ist die Leistung am Fluid; ein Pumpenwirkungsgrad und elektrische
  Aufnahmeleistung sind nicht enthalten.
- **COP:** Verhältnis von Heizleistung zu elektrischer Aufnahmeleistung am
  selben Betriebspunkt mit gemeinsamer Bilanzgrenze. Werte größer als 1 sind
  zulässig. Ein Jahresenergieverhältnis ist eine Jahresarbeitszahl und nicht
  dieser einzelne COP.
- **Lineare Ausdehnung:** kleine Dehnung, konstantes positives gegebenes α,
  Temperaturerhöhung. `10⁻⁶/K`, `mm/(m·K)` und `1/K` werden ausdrücklich
  unterschieden. Keine allgemeine Materialkennzahl oder Kompensatorauslegung.
- **Mischen:** stationäres adiabates Mischen zweier trockener Luftströme mit
  gleicher konstanter spezifischer Wärmekapazität und positiven Massenströmen.
  Keine Feuchte-, Phasen- oder Druckänderungsbilanz und keine Enthalpierechnung
  feuchter Luft. Nur die drei Temperaturen werden umgestellt; die Massenströme
  bleiben gegebene Gewichte. Negative Celsiuswerte sind zulässig, Werte unter
  −273,15 °C werden zurückgewiesen.
- **Elektrische Grundlagen:** positiver konstanter ohmscher Widerstand bzw.
  Gleichstrom oder rein ohmsche Wechselstromlast. Kein allgemeines
  Blindleistungs-/Drehstrommodell und keine Anleitung für elektrische Arbeiten.
- **Luftwärmeleistung:** c′ = 0,34 Wh/(m³·K) ist der gegebene konstante
  **volumetrische** Modellwert. Nur sensible Erwärmung, keine Feuchte- oder
  Phasenänderung und keine Verluste; kein universeller Luftzustandswert.

Die begrenzte Quellenprüfung betraf passende Ausschnitte zu Kontinuität,
Ausdehnung, Leistungszahl, Hydrostatik, elektrischem Grundmodell sowie Luftwärme
und Massenstrom. Sie ist keine Prüfung jedes Buches oder jeder Formel darin.
Es werden weder Normkonformität, Herstellerfreigabe noch vollständige
Prüfungsabdeckung behauptet.

Weiterhin mögliche Erweiterungen sind beispielsweise Brennstoffenergie,
Solarenergie mit periodengebundener Einstrahlungsenergie, Drehmoment,
Pumpenförderhöhe, elektrische Pumpenaufnahme, Jahresarbeitszahl, Druckverluste
und Energie-/Kostenbilanzen. Diese Modelle sind derzeit keine auswählbaren
Rechenfunktionen und brauchen vor einer Ergänzung eigene Einheiten, Grenzen,
Umstellungen und Referenzprüfungen.
