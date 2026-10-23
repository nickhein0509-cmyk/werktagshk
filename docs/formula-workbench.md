# Formelwerkstatt · Modellversion 1

Geprüfter Stand: 23. Oktober 2026. Umfang: die acht ausdrücklich beschriebenen
mathematischen Modelle in `src/lib/formulas.ts`, alle 24 Umstellungen und ihre
Bedienung in `FormulaWorkbench.tsx`. Diese Prüfung ist eine rechnerische,
Einheiten- und Modellprüfung für selbstständiges Üben. Sie ist keine Normen-,
Hersteller- oder Prüfungsausschussfreigabe. Es wurden dafür keine privaten
Prüfungsinhalte oder Lösungsschlüssel übernommen.

## Bedienung

„Formel auswählen“ wechselt zwischen Wärmeenergie, Wärmeleistung, Volumenstrom,
Luftwechsel, Gefälle, Rohrinhalt, Heizzeit und Energiewirkungsgrad. Jede Familie
hat drei gesuchte Größen. Nach Wahl der gesuchten Größe werden nur die beiden
benötigten Eingaben angeboten. Das aktuelle Ergebnis wird beim Umstellen als
bekannter Wert übernommen, damit die Rechnung denselben Modellfall beschreibt.

Eingabe- und Ergebniseinheiten sind gezielt wählbar. Ein Wechsel einer
Eingabeeinheit rechnet eine gültige bestehende Zahl um, statt die physikalische
Größe stillschweigend zu ändern. Beispiel: 24 l werden 0,024 m³. Die Bedienung
behält Werte und Zielgrößen je Formel in der geöffneten Werkzeugansicht.
Navigation aus dieser Ansicht oder Neuladen startet wieder mit Beispielwerten;
es gibt keine vorgetäuschte Cloud-Speicherung. Rechnungen erzeugen weder
Versuche noch Lernfortschritt.

Komma und Punkt sind Dezimalzeichen, Tausendertrennzeichen sind nicht erlaubt.
Werte sind endlich und nicht negativ; Masse, Messzeit, Raumvolumen und
Zylinderabmessungen müssen im jeweiligen Modell positiv sein. Division durch
null sowie nicht eindeutige inverse Fälle werden ausdrücklich zurückgewiesen.
Die Anzeige rundet das Ergebnis, die Rechnung verwendet intern die volle
JavaScript-Zahlengenauigkeit. Übernommene Ergebnisse und Einheitenwechsel behalten
die vollständig darstellbare Zahl im Eingabetext. Die Anzeige begrenzt vor der
Dezimalrundung auf zwölf gültige Stellen, damit reine Gleitkommaartefakte nicht
als scheinbar bedeutende Nachkommastellen im Rechenweg erscheinen.

## Unabhängige Rechenprüfung

Die folgenden Referenzen wurden mit einem tatsächlich ausgeführten separaten
Python-Skript berechnet: `decimal.Decimal` für die linearen Modelle und
`math.pi`/`math.sqrt` für den Zylinder. Die TypeScript-Referenztests verwenden
fest angegebene Eingaben und unabhängig ausgerechnete Ergebnisse, nicht Werte
aus der Produktionsimplementierung. Jede der drei Zielgrößen wurde geprüft.

| Familie | Exakt geprüfte Referenz und Einheitenwechsel | Ergebnisse der drei Umstellungen |
| --- | --- | --- |
| Wärmeenergie | 100 kg, 20 K, c = 4,18; inverse Masse mit 20 064 kJ und 40 K; inverser Hub mit 5,573333333333333 kWh und 120 kg | 8 360 kJ; 120 kg; 40 K innerhalb Rundung der Eingabe |
| Wärmeleistung | 0,72 m³/h Wasser und 10 K; 8,36 kW; inverse Spreizung mit 8 360 W und 0,2 l/s | 8,36 kW; 720 l/h; 10 K |
| Volumenstrom | 24 l in 80 s; inverses Volumen mit 1,08 m³/h und 80 s; inverse Zeit mit 24 l und 0,3 l/s | 18 l/min; 24 l; 80 s |
| Luftwechsel | 150 m³/h und 75 m³; inverser Volumenstrom mit 2 h⁻¹ und 75 m³; inverses Volumen mit 41,66666666666667 l/s und 2 h⁻¹ | 2 h⁻¹; 41,666666… l/s; 75 m³ innerhalb Eingaberundung |
| Gefälle | 90 mm auf 6 m; inverse Höhe mit 1,5 % auf 600 cm; inverse waagerechte Länge mit 9 cm und 1,5 % | 1,5 %; 90 mm; 6 000 mm |
| Rohrinhalt | dᵢ = 20 mm, L = 12 m; inverser Durchmesser aus 3,7699111843077517 l und 1 200 cm; inverse Länge aus 0,0037699111843077517 m³ und 2 cm | 3,7699111843077517 l; 20 mm; 12 m |
| Heizzeit | 15 048 kJ und 4,5 kW; inverse Wärme mit 4 500 W und 3 344 s; inverse Leistung mit 15 048 kJ und 3 344 s | 3 344 s; 4,18 kWh; 4 500 W |
| Energiewirkungsgrad | 28 800 kJ nutzbar und 10 kWh zugeführt; inverse Nutzenergie mit 80 % und 36 000 kJ; inverse Zufuhr mit 8 kWh und 80 % | 80 %; 8 kWh; 36 000 kJ |

Die kleinen Abweichungen von 40 K, 24 l, 80 s und 75 m³ im unabhängigen
Dezimalprotokoll liegen an endlichen Darstellungen periodischer Eingaben bzw.
Divisionen. Die Tests prüfen mit angemessener numerischer Toleranz.

Zusätzlich tatsächlich ausgeführt: 50 Vitest-Fälle für alle Zielgrößen,
Null-/Nennerfälle, Modellgrenzen, Prozentdarstellung, Einheitenwechsel,
unerlaubte Eingaben, Überlauf und unabhängige Formularentwürfe. Die Tests sind
technische Belege und ersetzen nicht die fachliche Prüfung realer Anlagen.

## Geltungsgrenzen der Modelle

- Wärmeenergie: flüssiges Wasser, c = 4,18 kJ/(kg · K) konstant, ohne Verluste,
  Behälterwärme oder Phasenwechsel. ΔT = 0 ist vorwärts gültig; eine Masse aus
  Q = 0 und ΔT = 0 ist nicht eindeutig. Die Eingabegrenze 100 K ist keine
  physikalische Zustandsfreigabe.
- Wärmeleistung: stationär, ρ = 1 kg/l und c = 4,18 konstant. Der Faktor 3 600
  zwischen l/h und kW ist erforderlich. Keine Pumpen- oder Rohrnetzauslegung.
- Volumenstrom: Mittelwert über eine positive Messzeit; Rückrechnungen setzen
  denselben mittleren Durchfluss im betrachteten Zeitraum voraus.
- Luftwechsel: rechnerisches Verhältnis, weder vollständiger Teilchenaustausch
  noch geforderte Luftqualität oder erforderlicher Außenluftbedarf.
- Gefälle: Höhenunterschied bezogen auf die waagerechte Strecke, gleiche
  Längeneinheiten. Keine allgemein zulässigen oder vorgeschriebenen Gefälle.
- Rohrinhalt: gerader Kreiszylinder mit konstantem Innendurchmesser. Kein DN,
  keine Formstücke, Armaturen oder Fertigungstoleranzen.
- Heizzeit: konstant tatsächlich nutzbare Leistung, keine Anfahrphase,
  weiteren Verbraucher oder Verluste. Q = 0 und P = 0 bestimmen keine Zeit.
- Energiewirkungsgrad: gemeinsame Energiegrenze und gleicher Zeitraum,
  0 ≤ η ≤ 1. η = 0 kann sich bei positiver Zufuhr und null Nutzenergie ergeben;
  die zugeführte Energie lässt sich daraus nicht eindeutig zurückrechnen.
  Dieses Modell ist keine Leistungszahl oder Jahresarbeitszahl einer Wärmepumpe.

Redaktioneller Status: `reviewed_for_stated_use`, Modellversion 1, für genau
diese offenen Lernrechnungen. Änderungen an Konstanten, Einheiten oder
Geltungsbedingungen benötigen eine erneute begrenzte Prüfung.
