# Inhaltsprüfung der Modellaufgaben – Version 0.1

Stand: 22. Oktober 2026. Geprüfter Umfang: die zwölf eigenen Aufgaben in `src/data.ts`, der Wärmeenergierechner und die Lernanzeigen in `src/App.tsx` sowie deren Berechnungsregeln in `src/lib/learning.ts`.

Die Ergebnisse wurden aus den angegebenen Werten unabhängig neu berechnet und anschließend mit Antwortoptionen und Erklärungen verglichen. Alle zwölf hinterlegten richtigen Antworten stimmen innerhalb der jeweiligen ausdrücklich genannten Modelle. Dies ist eine rechnerische und didaktische Plausibilitätsprüfung dieser Version, keine Primärquellen-, Normen- oder Prüfungsausschussfreigabe. Es wurden keine privaten Bücher, Originalprüfungen, Lernakten oder externen Fachquellen gelesen.

## Aufgaben und Rechenwege

| Aufgaben-ID | Lernziel und Modellannahmen | Unabhängig berechnetes Ergebnis | Prüfgrenze |
| --- | --- | --- | --- |
| `heizung-waermemenge` | Wassererwärmung und Umrechnung kJ → kWh. 120 l bei 1 kg/l, 15 → 55 °C, konstantes c = 4,18 kJ/(kg · K), ohne Behältererwärmung und Verluste. | m = 120 kg; ΔT = 40 K; Q = 120 × 4,18 × 40 = 20 064 kJ = 5,57333… kWh, gerundet **5,57 kWh**. | Keine Dimensionierung eines realen Speichers; keine Aussage zu Heizzeit, Wirkungsgrad, Hygiene oder Betriebstemperaturen. |
| `heizung-volumenstrom` | Stationäre Leistungsbilanz und Umrechnung Massenstrom → Volumenstrom. P = 8,4 kW, ΔT = 10 K, c = 4,2 kJ/(kg · K), ρ = 1 kg/l; keine Verluste. | ṁ = 8,4 / (4,2 × 10) = 0,2 kg/s; V̇ = 0,2 l/s × 3 600 = **720 l/h**. | Keine Rohrnetz-, Pumpen- oder hydraulische Auslegung; Dichte und Wärmekapazität sind Modellwerte. |
| `heizung-einheiten` | Den identischen Volumenstrom in anderen Einheiten ausdrücken. 1 h = 60 min, 1 m³ = 1 000 l. | 18 l/min × 60 / 1 000 = **1,08 m³/h**. | Reine Einheitentransformation; keine Aussage zur Messgenauigkeit oder Eignung eines Durchflusses. |
| `sanitaer-rohrinhalt` | Zylinderinhalt aus dem Innendurchmesser berechnen. Durchgehend dᵢ = 20 mm, L = 12 m, π = 3,1416; keine Formstücke. | V = π × (0,020 m / 2)² × 12 m = 0,00376992 m³ = 3,76992 l, gerundet **3,77 l**. | Innendurchmesser ist keine Nennweitenangabe. Keine Volumina von Armaturen, Abzweigen oder realen Formstücken enthalten. |
| `sanitaer-durchfluss` | Volumen durch Messzeit teilen und l/s → l/min umrechnen. 24 l in 80 s, konstanter Durchfluss. | V̇ = 24 / 80 = 0,3 l/s = **18 l/min**. | Bei nicht konstantem Durchfluss beschreibt die Quotientenrechnung lediglich den Mittelwert der Messzeit. |
| `sanitaer-gefaelle` | Vorgegebenes Prozentgefälle geometrisch in eine Höhendifferenz übersetzen. 1,5 % über 6,0 m waagerechte Bezugslänge. | Δh = 0,015 × 6,0 m = 0,09 m = **9 cm**. | Das angenommene Gefälle ist keine zulässige oder erforderliche Auslegungsvorgabe für eine reale Entwässerungsanlage. |
| `klima-raumvolumen` | Quadergeometrie und Einheiten m² → m³. Innenmaße 5,0 × 4,0 × 2,5 m; Einbauten unberücksichtigt. | V = 5,0 × 4,0 × 2,5 = **50 m³**. | Keine Festlegung eines notwendigen Luftvolumenstroms; andere Raumgeometrien benötigen ein anderes Modell. |
| `klima-luftwechsel` | Rechnerischen Luftwechsel als Quotient erkennen. 75 m³ Raumvolumen, konstante 150 m³/h Außenluft und gleiche Abluftmenge. | n = 150 / 75 = **2 h⁻¹**. | Bedeutet rechnerisch zwei Raumvolumina je Stunde; kein vollständiger Teilchenaustausch nach einer halben Stunde und keine Auslegungsvorgabe für Luftqualität. |
| `klima-mischtemperatur` | Einfache stationäre Energiebilanz und gewichteten Mittelwert verstehen. Trockene Ströme 20 und 30 °C mit gleichem Massenstrom und gleicher konstanter Wärmekapazität; keine Verluste oder Phasenänderungen. | Tₘ = (20 + 30) / 2 = **25 °C**. | Gleicher Volumenstrom wäre bei unterschiedlichen Dichten keine gleichwertige Annahme. Feuchte- und Phasenänderungen sind nicht modelliert. |
| `wiso-preisrechnung` | Menge, Rabatt und vorgegebenen Steuersatz in richtiger Reihenfolge anwenden; erst Endbetrag auf Cent runden. | 4 × 18,50 € = 74,00 €; × 0,90 = 66,60 €; × 1,19 = 79,254 €, gerundet **79,25 €**. | 19 % ist eine Aufgabenannahme, keine Aussage über die rechtlich zutreffende Besteuerung eines konkreten Umsatzes. |
| `wiso-deckungsbeitrag` | Deckungsbeitrag vom Gewinn unterscheiden. 210 € Nettoerlös, 135 € variable Kosten; Fixkosten noch nicht verteilt. | DB = 210 € − 135 € = **75 €**. | Kein Auftragsgewinn und keine vollständige Kalkulation; vereinfachte Kostenzuordnung ausdrücklich vorgegeben. |
| `wiso-prozentrechnung` | Prozentuale Erhöhung auf den Ausgangswert beziehen. Fiktiver Stundenbetrag 24,00 €, Erhöhung um 7,5 %. | 24,00 € × 1,075 = **25,80 €**. | Keine Aussage zu Tariflohn, Vergütungsanspruch oder einem tatsächlichen Stundenverrechnungssatz. |

## Rechner und Formeln

Der Wärmeenergierechner verwendet `Q = m · c · ΔT` mit seinem ausdrücklich angezeigten konstanten Modellwert c = 4,18 kJ/(kg · K). Bei den Startwerten 100 kg und 20 K ergibt das 8 360 kJ = 2,322222… kWh; die Anzeige mit drei Nachkommastellen lautet 2,322 kWh. Mit 10,5 kg und 20 K ergeben sich 877,8 kJ = 0,243833… kWh. Eine Temperaturdifferenz von 0 K ergibt korrekt 0 kJ. Das Modell gilt nur unter der Annahme flüssigen Wassers ohne Phasenwechsel und Wärmeverluste. Die Eingabegrenze von 100 K ist eine Bediengrenze und belegt für sich allein keinen zulässigen flüssigen Zustand.

Der Rechner und `heizung-waermemenge` verwenden denselben Modellwert c = 4,18. Für 120 kg und 40 K ergeben beide 20 064 kJ = 5,573333… kWh. Die Volumenstromaufgabe verwendet den dort ausdrücklich vorgegebenen gerundeten Wert c = 4,2. Der jeweils angegebene Modellwert gehört zu den Annahmen der betreffenden Rechnung.

Die Formelübersicht und die Gefälleaufgabe bezeichnen die Länge ausdrücklich als **waagerechte Bezugslänge**. Höhenunterschied und Bezugslänge sind in derselben Einheit einzusetzen. Die Heizungsgrafik ist eine Prinzipskizze, kein vollständiges hydraulisches Schema und keine Einbauanleitung; ihre Aussage darf nicht zur realen Anlagenplanung erweitert werden.

## Bedeutung der Lernanzeigen

- „Zuletzt richtig“ bedeutet: Die zeitlich letzte gespeicherte Antwort auf diese konkrete Multiple-Choice-Aufgabe stimmt mit dem hinterlegten Schlüssel überein. Eine einzelne richtige Auswahl belegt weder selbstständigen Rechenweg noch dauerhafte Beherrschung oder Prüfungsreife. Die Funktion `getMasteredIds` verwendet intern eine stärkere Bezeichnung als das tatsächlich beobachtete Merkmal.
- Der Lernfeldzähler ist mit „zuletzt richtig“ beschriftet und zeigt Aufgaben mit zuletzt richtiger Antwort. Eine spätere falsche Antwort nimmt die Aufgabe aus diesem Zähler.
- Für das Tagesziel zählen unterschiedliche Aufgaben mit einer abgegebenen Antwort am lokalen Kalendertag; wiederholte Antworten auf dieselbe Aufgabe erhöhen den Tageszähler nicht. Richtig und falsch zählen gleichermaßen als Bearbeitung.
- Eine falsche letzte Antwort ist sofort zur Wiederholung fällig. Eine richtige letzte Antwort wird nach **72 verstrichenen Stunden** fällig. Das ist keine fachlich oder empirisch individualisierte Wiederholungsplanung; „nach drei Tagen“ ist die vereinfachte UI-Beschreibung und meint hier keine drei lokalen Tageswechsel.
- Die Lerntageserie zählt aufeinanderfolgende lokale Kalendertage mit mindestens einer Antwort. Solange heute noch keine Antwort vorliegt, darf die Serie am gestrigen Tag enden. Daraus folgen weder gemessene Lernzeit noch täglich erreichte Tagesziele.
- „Lokal“ bezieht sich auf die Zeitzone des ausführenden Browsers. Ein Gerätewechsel mit anderer Zeitzone kann die Zuordnung eines Antwortzeitpunkts zu einem Kalendertag verändern.
- Ein importierter Lernstand ist eine Selbstauskunft ohne zeitliche Authentifizierung. Schema-validierte Importe dürfen kanonisch formatierte Zeitpunkte in der Zukunft enthalten. Solche Zeitpunkte können die Auswahl der „letzten“ Antwort und die Fälligkeit verfälschen. Das Schema prüft Struktur und Antwortkonsistenz, nicht die historische Wahrheit der importierten Lernaktivität.
- Die vorgeschlagenen Bearbeitungszeiten betragen zwei bis vier Minuten pro Aufgabe, zusammen 37 Minuten. Das sind redaktionelle Vorschläge ohne gemessene Bearbeitungsdaten; keine amtlichen Zeitbudgets oder validierten Durchschnittszeiten.

## Versions- und Nutzungsgrenzen

Die Inhalte sind eigene Modellaufgaben und keine Originalprüfungen. Antwortschlüssel und Erklärungen werden mit der Web-App ausgeliefert. Der Ablauf eignet sich zum selbstständigen Üben, nicht als gegen Einsicht geschützte Prüfung. Lernfortschritt beginnt leer und darf nicht mit früheren Lernakten gleichgesetzt werden.

Der Lernstand enthält derzeit stabile Aufgaben-IDs, jedoch keine gesonderte Inhaltsrevision pro Antwort. Werden Aufgabenmodell, Optionen oder Antwortschlüssel später fachlich geändert, braucht das eine bewusste Versionierungs- und Migrationsentscheidung; alte Antworten dürfen nicht stillschweigend als Antworten auf eine andere Aufgabe umgedeutet werden.

Eine spätere Einbindung von Originalmaterial, Normenaussagen, Herstellerangaben oder bestehenden Lernakten benötigt einen eigenen begrenzten Quellen- und Versionsabgleich. Diese Prüfung deckt ausschließlich die hier aufgelisteten expliziten Modelle in Version 0.1 ab.

## Erweiterung vom 23. Oktober 2026 – Inhaltsversion 1

96 eigene Übungsaufgaben in `src/practice-expansion.ts`: 72 Rechenaufgaben
(24 Modelle mit jeweils drei ausdrücklich gekennzeichneten Zahlenvarianten)
und 24 Verständnisfragen. Der Gesamtbestand beträgt 108 Aufgaben, 27 je Lernfeld.
Zahlenvarianten sind keine 72 unterschiedlichen Lösungsprinzipien.

Heizung: Heizzeit, Nutzungsgrad vorwärts/rückwärts, Spreizung, Wärmeleistung,
Längenausdehnung. Sanitär: Füllzeit, mittlere Geschwindigkeit, hydrostatischer
Überdruck, Wasser mischen, geometrisches Gefälle, Tagesverbrauch. Lüftung:
Volumenstrom, Kanalquerschnitt, Kanalgeschwindigkeit, Luft erwärmen, trockener
Wärmetauscher, Ventilatorenergie. WiSo: Arbeitskosten, Materialzuschlag, Skonto,
Kostendeckung, Preisänderung, Energiekosten. Dazu je sechs Verständnisfragen.

Die angegebenen Werte und Modellgrenzen sind Aufgabenannahmen. Es wurden keine
externen Normen, rechtlichen Primärquellen, privaten Bücher oder Originalprüfungen
verwendet. Die Fragen treffen keine Aussage über zulässige reale Anlagen oder
rechtlich verbindliche Konditionen. Alle neuen Inhalte sind redaktionelle eigene
Übungen; keine externe fachliche Freigabe. Geschlossene Auswahlbewertung: genau
die hinterlegte Option zählt als richtig, keine Teilpunkte oder Bewertung eines
eigenen Rechenwegs. Gleichwertige freie Rechenwege sind fachlich möglich, werden
aber von diesem Auswahlformat nicht erfasst.

Rechenprüfung dieser exakten Version: Alle 72 Schlüssel werden gegen unabhängig
berechnete Referenzwerte in `src/practice-expansion.test.ts` geprüft. Die tatsächlich
mit Python erzeugten Rechenwerte und Eingaben stehen in
`docs/calculation-evidence.json`. Das Generatorskript liegt in
`scripts/build-practice-expansion.py`; Generator und Strukturprüfung allein sind
keine unabhängige Fachprüfung. Zwischenwerte werden nicht gerundet, Endwerte auf
zwei Dezimalstellen angezeigt. Die Antwortpositionen wechseln. Die Hinweise
enthalten Vorgehenshilfen, die Ergebnisse stehen getrennt in Erklärungen und
Antwortschlüsseln. Auch diese Schlüssel werden als Teil der Übungs-App an den
Client ausgeliefert.

Die ursprünglichen zwölf Aufgaben einschließlich IDs, Optionen und Schlüsseln
bleiben unverändert. Keine Änderung des Lernstandschemas, keine Migration und
keine erzeugten Lernereignisse. Neue Aufgaben beginnen ohne gespeicherte Antwort.
Zwei beziehungsweise vier Minuten sind nur redaktionelle Zeitvorschläge.
