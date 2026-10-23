import type { Exercise } from '../data';

const sourceLabel = 'Eigene Übungsaufgabe · Version 1 · keine Originalprüfung';

// Editorial difficulty describes the demand of this exact model, not measured
// success rates, a learner's ability or an official examination classification.
export const gradedExercises: Exercise[] = [
  {
    id: 'exam-ap-graded-stueckliste-v1',
    topicId: 'sanitaer',
    kind: 'knowledge',
    difficulty: 1,
    difficultyReason:
      'Eine bekannte Unterlagenart einer einzelnen Funktion zuordnen; keine Rechnung oder Auswahl zwischen mehreren Bedingungen.',
    title: 'Bauteilnummern in einer Montagezeichnung',
    context:
      'Eine eigene Montagezeichnung kennzeichnet die Bauteile nur mit Positionsnummern. Du brauchst die zugehörigen Bauteilbezeichnungen und die jeweils benötigte Anzahl. Gefragt ist die Funktion einer üblichen technischen Unterlage, nicht die Festlegung eines realen Materialbedarfs.',
    question:
      'Welche Unterlage verbindet die Positionsnummern typischerweise mit Bezeichnung und Menge?',
    options: ['Der Wartungskalender', 'Das Messprotokoll', 'Die Stückliste', 'Die Terminübersicht'],
    correctIndex: 2,
    explanation:
      'Eine Stückliste ordnet den Positionen eines dargestellten Aufbaus die Teile und ihre Mengen zu. Ein Messprotokoll enthält Messwerte, ein Wartungskalender wiederkehrende Termine und eine Terminübersicht Zeitpunkte. Aus der Auswahl einer Unterlagenart folgt noch kein geprüfter konkreter Materialbedarf.',
    hint: 'Gesucht ist die Zuordnung von dargestellten Teilen zu ihrer Bezeichnung und Anzahl.',
    estimatedMinutes: 2,
    level: 'Grundlagen',
    sourceLabel,
  },
  {
    id: 'exam-ap-graded-druckkraft-v1',
    topicId: 'heizung',
    kind: 'calculation',
    difficulty: 2,
    difficultyReason:
      'Vorgegebenen Druck und Durchmesser in passende Einheiten umrechnen, Kreisfläche bilden und in eine bekannte Kraftformel einsetzen.',
    title: 'Kraft auf eine kreisrunde Modellfläche',
    context:
      'Auf eine kreisrunde Modellfläche mit 20 mm Durchmesser wirkt gleichmäßig eine Druckdifferenz von 3,0 bar. Rechne mit F = Δp · A, A = π · d² / 4 und 1 bar = 100 000 Pa. Reibung, Eigengewicht und andere Kräfte entfallen. Es wird kein realer Ventil- oder Antriebsnachweis verlangt.',
    question: 'Welche Kraft wirkt nach diesem Modell ungefähr auf die Fläche?',
    options: ['9,42 N', '94,25 N', '942,48 N', '376,99 N'],
    correctIndex: 1,
    explanation:
      '1. Druckdifferenz: 3,0 bar = 300 000 Pa.\n2. Durchmesser: 20 mm = 0,020 m.\n3. Fläche: A = π · 0,020² / 4 = 0,000314159… m².\n4. Kraft: F = 300 000 Pa · 0,000314159… m² = 94,2478… N, gerundet 94,25 N.\nPa · m² ergibt N. Der Durchmesser darf weder als Radius eingesetzt noch in Millimetern mit Pascal kombiniert werden.',
    hint: 'Bringe Druck und Durchmesser zuerst auf Pascal und Meter. Die Kreisfläche benötigt den quadrierten Durchmesser und den Faktor ein Viertel.',
    formula: 'F = Δp · π · d² / 4',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-ap-graded-laengenaenderung-v1',
    topicId: 'heizung',
    kind: 'calculation',
    difficulty: 2,
    difficultyReason:
      'Temperaturhub bestimmen und die ausdrücklich gegebene lineare Materialkenngröße mit Länge und Temperaturhub verknüpfen.',
    title: 'Längenänderung einer Modellleitung',
    context:
      'Eine Modellleitung ist bei 15 °C genau 12 m lang und wird gleichmäßig auf 50 °C erwärmt. Für dieses fiktive Material ist α = 0,012 mm/(m · K) konstant vorgegeben. Es gilt ΔL = L · α · ΔT. Andere Verformungen und Behinderungen werden nicht betrachtet. Die Kenngröße ist keine Angabe für einen bestimmten realen Rohrwerkstoff.',
    question: 'Welche freie Längenzunahme ergibt sich im Modell?',
    options: ['5,04 mm', '7,20 mm', '0,42 mm', '50,40 mm'],
    correctIndex: 0,
    explanation:
      '1. Temperaturdifferenz: ΔT = 50 − 15 = 35 K.\n2. Längenzunahme: ΔL = 12 m · 0,012 mm/(m · K) · 35 K = 5,04 mm.\nDie Einheiten m und K kürzen sich; das Ergebnis steht bereits in Millimetern. 50 °C allein ist hier nicht der Temperaturhub. Die Rechnung plant weder Befestigungen noch reale Dehnungsausgleicher.',
    hint: 'Die Materialkenngröße ist schon in Millimetern je Meter und Kelvin angegeben. Nutze den Temperaturunterschied statt der Endtemperatur.',
    formula: 'ΔL = L · α · ΔT',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-ap-graded-personalablauf-v1',
    topicId: 'heizung',
    kind: 'context',
    difficulty: 4,
    difficultyReason:
      'Abhängigkeiten und gleichzeitigen Personalbedarf zu einem vollständigen Ablauf verknüpfen; eine reine Reihenfolge oder Summe genügt nicht.',
    title: 'Zwei Personen und ein gemeinsamer Montageschritt',
    context:
      'Ein fiktiver Auftrag beginnt um 8 Uhr. A dauert eine Stunde mit Person 1. Danach müssen B (zwei Stunden, Person 1) und C (zwei Stunden, Person 2) erledigt werden; B und C dürfen gleichzeitig laufen. Erst danach ist D möglich: zwei Stunden mit beiden Personen gleichzeitig. Abschließend folgt E: eine Stunde mit Person 1. Beide Personen sind durchgehend verfügbar, Zeiten sind unveränderlich und Wegezeiten entfallen.',
    question: 'Welcher Ablauf erreicht unter allen genannten Bedingungen den frühesten Abschluss?',
    options: [
      'A 8–9, B und C 9–11, D 11–13, E 13–14 Uhr.',
      'A 8–9, B 9–11, D 11–13, C und E 13–15 Uhr.',
      'A 8–9, B und C 9–11, D und E 11–13 Uhr.',
      'A 8–9, B 9–11, C 11–13, D 13–15, E 15–16 Uhr.',
    ],
    correctIndex: 0,
    explanation:
      'B und C können nach A parallel von 9 bis 11 Uhr laufen, weil sie verschiedene Personen benötigen. D wartet auf beide Ergebnisse und belegt beide Personen bis 13 Uhr. E benötigt anschließend Person 1 bis 14 Uhr. Früher geht es entlang der zwingenden Kette A → B oder C → D → E nicht. Der zweite Vorschlag beginnt D vor C. Der dritte verletzt die Abhängigkeit und den Personalbedarf von E. Der vierte ist durchführbar, lässt aber die erlaubte Parallelität ungenutzt.',
    hint: 'Prüfe bei jedem Zeitabschnitt sowohl fertiggestellte Voraussetzungen als auch die benötigten Personen. Vergleiche danach die früheste zwingende Fertigstellungszeit.',
    estimatedMinutes: 5,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-ap-graded-messgeraetwahl-v1',
    topicId: 'sanitaer',
    kind: 'context',
    difficulty: 2,
    difficultyReason:
      'Messbereich und vorgegebene maximale Abweichung gemeinsam prüfen; ein besonders großer Bereich oder eine kleine Abweichung allein genügt nicht.',
    title: 'Ein Messgerät für den Modellversuch auswählen',
    context:
      'Ein vorbereiteter Modellversuch soll bis 300 kPa anzeigen. Die Aufgabe erlaubt höchstens ±5 kPa Anzeigeabweichung im gesamten benötigten Bereich. Drei fiktive Geräte sind verfügbar: A misst 0–600 kPa mit ±10 kPa, B misst 0–400 kPa mit ±2 kPa und C misst 0–250 kPa mit ±1 kPa. Alle anderen Eigenschaften erfüllen die Versuchsbedingungen. Die Werte sind Aufgabenannahmen, keine Auswahlvorgabe für reale Anlagen.',
    question: 'Welches Gerät erfüllt beide ausdrücklich vorgegebenen Anforderungen?',
    options: [
      'A, weil sein Messbereich am größten ist.',
      'C, weil seine Abweichung am kleinsten ist.',
      'A und B gleichermaßen.',
      'B, weil Bereich und Abweichung zugleich passen.',
    ],
    correctIndex: 3,
    explanation:
      'B erfasst 300 kPa und bleibt mit ±2 kPa innerhalb der erlaubten ±5 kPa. A deckt den Bereich ab, verfehlt aber die Abweichungsanforderung. C hat zwar die kleinste Abweichung, erreicht den benötigten oberen Messwert nicht. Die beste Einzelangabe ersetzt nicht das gleichzeitige Erfüllen beider Muss-Bedingungen.',
    hint: 'Lege die beiden Anforderungen getrennt an jedes Gerät an. Erst ein Gerät, das beide erfüllt, bleibt im Vergleich.',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-ap-graded-oder-prueffall-v1',
    topicId: 'heizung',
    kind: 'context',
    difficulty: 3,
    difficultyReason:
      'Einen unterscheidenden Gegenfall zwischen zwei ähnlich wirkenden logischen Verknüpfungen gezielt auswählen.',
    title: 'Ein Prüffall für die Freigabelogik',
    context:
      'Für einen vollständig vorbereiteten Steuerungsprüfstand ist die Sollfunktion F = (A UND B) ODER C festgelegt. Eine mögliche fehlerhafte Umsetzung lautet F = A UND (B ODER C). A, B und C sind reine simulierte Wahrheitswerte. Ein bisheriger Test mit A = wahr, B = wahr und C = falsch liefert bei beiden Funktionen wahr. Es werden keine realen Schutzfunktionen verändert.',
    question: 'Welcher zusätzliche Test unterscheidet die beiden Funktionen eindeutig?',
    options: [
      'A wahr, B falsch, C falsch.',
      'A wahr, B wahr, C wahr.',
      'A falsch, B falsch, C wahr.',
      'A falsch, B falsch, C falsch.',
    ],
    correctIndex: 2,
    explanation:
      'Mit A = falsch, B = falsch, C = wahr wird die Sollfunktion durch C wahr. Die fehlerhafte Funktion bleibt wegen des vorangestellten A falsch. Damit unterscheiden sich ihre Ergebnisse. Die anderen angebotenen Zustände liefern bei beiden Funktionen jeweils dasselbe Ergebnis. Ein erneut gleiches Ergebnis könnte den vermuteten Verknüpfungsfehler nicht ausschließen.',
    hint: 'Gesucht ist kein weiterer typischer Normalzustand, sondern ein Zustand, in dem die beiden Klammerungen unterschiedliche Ausgänge liefern.',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-ap-graded-schnittstellentyp-v1',
    topicId: 'heizung',
    kind: 'context',
    difficulty: 2,
    difficultyReason:
      'Zwei ausdrücklich beschriebene Schnittstellenarten abgleichen und die fehlende Anpassung erkennen.',
    title: 'Zwei Geräte nennen unterschiedliche Signalarten',
    context:
      'Im fiktiven Projekt akzeptiert der freigegebene Reglereingang ausschließlich einen potentialfreien Schaltkontakt. Das ausgewählte Meldemodul liefert dagegen nur ein 0–10-V-Spannungssignal. Die Projektunterlage nennt keine direkte Kompatibilität. Eine dokumentierte, passende Anpassungsschnittstelle könnte gesondert ausgewählt werden; eine reale Verdrahtung ist nicht Gegenstand der Aufgabe.',
    question:
      'Welche Aussage gehört vor der endgültigen Gerätefreigabe in den Schnittstellenabgleich?',
    options: [
      'Beide Signale sind ohne weitere Angaben gleichartig, weil beide einen Zustand übertragen.',
      'Signalarten passen nicht direkt zusammen; eine dokumentierte Anpassung oder passende Gerätealternative fehlt.',
      'Die reine Spannungsangabe beweist bereits, dass das Meldemodul defekt ist.',
      'Die Kompatibilität folgt allein daraus, dass beide Geräte für Regelungsaufgaben vorgesehen sind.',
    ],
    correctIndex: 1,
    explanation:
      'Die Projektangaben beschreiben verschiedene Signalarten. Daraus folgt eine offene Anpassungs- oder Auswahlaufgabe; weder ein gemeinsamer Einsatzzweck noch die Übertragung eines Zustands belegt eine direkte Schnittstelle. Ein Unterschied in der Signalart ist umgekehrt kein Defektnachweis. Die Aufgabe bewertet nur den Dokumentenabgleich, keine praktische elektrische Verbindung.',
    hint: 'Vergleiche die beschriebene Art des Ausgangs mit der ausdrücklich akzeptierten Art des Eingangs.',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-ap-graded-volumenmessplan-v1',
    topicId: 'sanitaer',
    kind: 'context',
    difficulty: 2,
    difficultyReason:
      'Den betrachteten Messzeitraum mit Anfangs- und Endbestand verbinden, statt einen einzelnen Skalenstand als Messmenge zu verwenden.',
    title: 'Einen gefüllten Messbehälter weiterverwenden',
    context:
      'Ein skalierter Behälter enthält bereits Wasser. Für einen Modellversuch soll der während eines genau festgelegten Zeitraums zusätzlich zugeflossene Inhalt ermittelt werden. Währenddessen wird nichts entnommen, der Behälter läuft nicht über und seine Skala gilt als richtig. Ein vollständiges Entleeren ist für diesen Versuch nicht vorgesehen.',
    question: 'Welcher Messplan liefert die zum Zeitraum passende zugeflossene Menge?',
    options: [
      'Nur den Endstand notieren und als Menge des Zeitraums verwenden.',
      'Den Anfangsstand notieren und als gleichbleibenden Zufluss behandeln.',
      'Anfangs- und Endstand zum Ende des Versuchs schätzen und addieren.',
      'Anfangs- und Endstand an den Zeitgrenzen ablesen und die Differenz bilden.',
    ],
    correctIndex: 3,
    explanation:
      'Ohne Entnahme und Überlauf entspricht der zusätzliche Zufluss der Änderung des Behälterinhalts zwischen den festgelegten Zeitgrenzen. Der vorhandene Anfangsinhalt muss deshalb vom Endstand getrennt werden. Ein Endstand allein enthält auch das vorher vorhandene Wasser. Addition, Schätzung oder ein als Zufluss umgedeuteter Anfangsbestand liefern die gesuchte Änderung nicht.',
    hint: 'Ordne Bestand und Änderung auseinander. Welche beiden Ablesungen begrenzen genau den ausgewählten Zeitraum?',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-si-graded-betriebspunkt-v1',
    topicId: 'heizung',
    kind: 'knowledge',
    difficulty: 1,
    difficultyReason:
      'Eine grundlegende grafische Zuordnung zwischen zwei bekannten Kennlinien abrufen; keine Kennlinienwerte berechnen.',
    title: 'Pumpen- und Anlagenkennlinie im Modell',
    context:
      'In einem vereinfachten stationären Modell beschreibt die Pumpenkennlinie die verfügbare Druckdifferenz über dem Volumenstrom. Die Anlagenkennlinie beschreibt die für denselben Volumenstrom benötigte Druckdifferenz. Gesucht ist nur der grafische Zusammenhang, nicht eine reale Pumpenauswahl.',
    question: 'Wo liegt der gemeinsame Betriebspunkt in diesem Modell?',
    options: [
      'Am jeweils höchsten Punkt beider Kurven.',
      'Am Schnittpunkt beider Kennlinien.',
      'Am Ursprung, unabhängig vom Verlauf der Kurven.',
      'Am Mittelwert der beiden maximalen Volumenströme.',
    ],
    correctIndex: 1,
    explanation:
      'Am Schnittpunkt stimmen für denselben Volumenstrom die verfügbare und die benötigte Druckdifferenz überein. Zwei getrennte Maxima oder ihr Mittelwert erfüllen diese gemeinsame Bedingung nicht. Ob ein realer Betriebspunkt zulässig, stabil oder wirtschaftlich ist, verlangt zusätzliche Angaben und wird hier nicht bewertet.',
    hint: 'Welche Stelle stellt denselben Volumenstrom und zugleich dieselbe Druckdifferenz auf beiden Kennlinien dar?',
    estimatedMinutes: 2,
    level: 'Grundlagen',
    sourceLabel,
  },
  {
    id: 'exam-si-graded-hydraulische-leistung-v1',
    topicId: 'heizung',
    kind: 'calculation',
    difficulty: 2,
    difficultyReason:
      'Druck und Volumenstrom in SI-Einheiten umrechnen und eine vorgegebene Leistungsbilanz auswerten.',
    title: 'Leistung, die der Wasserstrom aufnimmt',
    context:
      'Ein stationärer Modellwasserstrom beträgt 0,72 m³/h. Eine Pumpe erhöht seinen Druck um 50 kPa. Verwende P_hyd = Δp · V̇ mit Druck in Pa und Volumenstrom in m³/s. Höhen- und Geschwindigkeitsänderungen werden nicht gesondert betrachtet. Ein elektrischer Wirkungsgrad ist nicht angegeben.',
    question: 'Welche hydraulische Leistung ergibt sich?',
    options: ['36 W', '100 W', '10 W', '36 000 W'],
    correctIndex: 2,
    explanation:
      '1. Volumenstrom: 0,72 / 3 600 = 0,0002 m³/s.\n2. Druckdifferenz: 50 kPa = 50 000 Pa.\n3. Hydraulische Leistung: P_hyd = 50 000 · 0,0002 = 10 W.\nPa · m³/s entspricht N · m/s = W. Die elektrische Aufnahmeleistung lässt sich ohne Wirkungsgrad oder Messwert daraus nicht bestimmen.',
    hint: 'Die Stunde im Volumenstrom muss zu Sekunden werden. Unterscheide hydraulische Leistung und elektrische Aufnahmeleistung.',
    formula: 'P_hyd = Δp · V̇',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-si-graded-massenstromverhaeltnis-v1',
    topicId: 'klima',
    kind: 'calculation',
    difficulty: 3,
    difficultyReason:
      'Ein Verhältnis zweier Massenströme in eine gewichtete Energiebilanz übersetzen; der ungewichtete Mittelwert ist nicht anwendbar.',
    title: 'Mischen mit einem vorgegebenen Massenstromverhältnis',
    context:
      'Zwei trockene Modellluftströme werden verlustfrei gemischt. Der warme Strom hat 60 °C und den doppelten Massenstrom des kalten Stroms mit 15 °C. Beide haben dieselbe konstante Wärmekapazität; Phasenwechsel entfallen. Das Verhältnis bezieht sich ausdrücklich auf Massenströme, nicht auf Volumenströme.',
    question: 'Welche Mischtemperatur ergibt sich aus der Energiebilanz?',
    options: ['37,5 °C', '30,0 °C', '52,5 °C', '45,0 °C'],
    correctIndex: 3,
    explanation:
      '1. Verwende zwei gleiche Massenanteile warm und einen kalt.\n2. T_m = (2 · 60 + 1 · 15) / (2 + 1) = 135 / 3 = 45,0 °C.\n3. Das Ergebnis liegt zwischen beiden Eingangstemperaturen und näher bei 60 °C, weil der warme Strom stärker gewichtet ist.\nDer einfache Mittelwert 37,5 °C würde gleiche Massenströme voraussetzen. Bei Feuchte- oder Phasenänderungen wäre dieses Modell nicht ausreichend.',
    hint: 'Welche Gewichte passen zum angegebenen Verhältnis? Prüfe anschließend, auf welcher Seite der einfache Mittelwert liegen müsste.',
    formula: 'T_m = (ṁ_w · T_w + ṁ_k · T_k) / (ṁ_w + ṁ_k)',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-si-graded-pruefplanung-hypothesen-v1',
    topicId: 'heizung',
    kind: 'context',
    difficulty: 4,
    difficultyReason:
      'Informationsgehalt zweier unabhängiger Beobachtungen kombinieren, um drei vorgegebene Fehlermodelle voneinander zu trennen.',
    title: 'Welche Beobachtungen trennen die Fehlermodelle?',
    context:
      'Für einen vorbereiteten Prüfstand gelten ausschließlich drei einzeln auftretende Fehlermodelle: H1 Antrieb reagiert nicht; H2 Strömungswiderstand zu hoch; H3 Durchflussanzeige falsch. Die verifizierte Modellbeschreibung sagt: Bei H1 ändert sich die Antriebsrückmeldung auf eine Prüfanweisung nicht, bei H2 und H3 schon. Eine unabhängige Durchflussreferenz zeigt bei H1 und H2 einen zu kleinen Durchfluss, bei H3 den erwarteten. Die Dauer der Prüfanweisung ist bei allen drei Fällen gleich. Weitere Fehler und reale Eingriffe sind ausgeschlossen.',
    question:
      'Welche Beobachtungsgruppe kann alle drei Modelle anhand der vorgegebenen Ergebnisse eindeutig unterscheiden?',
    options: [
      'Nur die unabhängige Durchflussreferenz, weil sie eine zweite Anzeige ersetzt.',
      'Antriebsrückmeldung und unabhängige Durchflussreferenz gemeinsam.',
      'Antriebsrückmeldung und Dauer der Prüfanweisung gemeinsam.',
      'Dauer der Prüfanweisung und unabhängige Durchflussreferenz gemeinsam.',
    ],
    correctIndex: 1,
    explanation:
      'Die Kombination bildet drei verschiedene Ergebnispaare: H1 = Rückmeldung ändert sich nicht / Referenz zu klein; H2 = Rückmeldung ändert sich / Referenz zu klein; H3 = Rückmeldung ändert sich / Referenz erwartet. Jede einzelne der beiden Beobachtungen lässt zwei Modelle zusammenfallen. Die Dauer ist bei allen gleich und fügt deshalb keine unterscheidende Information hinzu. Die eindeutige Zuordnung gilt nur innerhalb der ausdrücklich vollständigen Drei-Modell-Annahme; sie ist keine reale Ferndiagnose.',
    hint: 'Notiere für jede vorgeschlagene Beobachtungsgruppe die möglichen Ergebnispaare von H1, H2 und H3. Welche Paare sind wirklich alle verschieden?',
    estimatedMinutes: 5,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-si-graded-hysterese-mindestzeit-v1',
    topicId: 'heizung',
    kind: 'context',
    difficulty: 4,
    difficultyReason:
      'Schalthysterese, gespeicherten Ausschaltwunsch und Mindestlaufzeit über mehrere Zeitpunkte gemeinsam nachführen.',
    title: 'Ein gespeicherter Ausschaltwunsch im Steuerungsmodell',
    context:
      'Ein fiktiver Steuerungsprüfstand ist vor Minute 0 aus. Unter 40 °C schaltet er ein; nach dem Einschalten bleibt er mindestens zehn Minuten an. Über 50 °C wird ein Ausschaltwunsch gespeichert. Dieser wird erst nach Ende der Mindestlaufzeit ausgeführt; er bleibt bei 40 bis 50 °C gespeichert und wird nur unter 40 °C gelöscht. Nach Ausschalten darf eine neue Unterschreitung von 40 °C wieder einschalten. Das Modell wertet ausschließlich die folgenden diskreten Messzeitpunkte aus; dazwischen treten keine weiteren Temperatur- oder Schaltbedingungen auf. Temperaturfolge: Minute 0 = 38 °C, Minute 5 = 52 °C, Minute 10 = 47 °C, Minute 12 = 38 °C. Es gibt keine weiteren Regeln.',
    question: 'Welche Zustände gelten direkt nach Auswertung der Minuten 5, 10 und 12?',
    options: ['Aus – aus – an.', 'An – an – an.', 'An – aus – an.', 'An – aus – aus.'],
    correctIndex: 2,
    explanation:
      'Minute 0 startet den Betrieb und die zehnminütige Mindestlaufzeit. In Minute 5 erzeugen 52 °C einen gespeicherten Ausschaltwunsch, der Betrieb bleibt wegen der Mindestlaufzeit aber an. In Minute 10 ist diese Zeit abgelaufen. 47 °C löschen den Wunsch nicht, deshalb wird ausgeschaltet. Minute 12 liegt wieder unter 40 °C und schaltet neu ein. Ohne die gespeicherte Anforderung würde die Betrachtung nur des aktuellen Hysteresebands zu einem anderen Ergebnis führen. Die Regeln gehören ausschließlich zu diesem Lehrmodell.',
    hint: 'Führe zwei Zustände getrennt mit: Betrieb an/aus und Ausschaltwunsch gespeichert/nicht gespeichert. Ergänze den Ablauf der Mindestlaufzeit.',
    estimatedMinutes: 5,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-si-graded-messintervalle-v1',
    topicId: 'sanitaer',
    kind: 'context',
    difficulty: 2,
    difficultyReason:
      'Zwei ausdrücklich als mögliche Wertebereiche gegebene Intervalle vergleichen und die zulässige Aussage begrenzen.',
    title: 'Zwei Anzeigen mit möglichen Wertebereichen',
    context:
      'Für einen Modellvergleich werden keine Wahrscheinlichkeiten angenommen. Es gilt lediglich: Der tatsächliche Wert von A liegt sicher zwischen 8 und 12 Einheiten, der tatsächliche Wert von B sicher zwischen 9 und 13. Die Anzeigen selbst lauten 10 und 11. Weitere Informationen über die tatsächlichen Werte gibt es nicht.',
    question: 'Welche Aussage ist durch diese Angaben sicher gedeckt?',
    options: [
      'B ist sicher größer als A, weil 11 größer als 10 ist.',
      'A und B sind sicher identisch, weil sich ihre Bereiche überlappen.',
      'A ist sicher größer als B, weil sein Bereich früher beginnt.',
      'Die Reihenfolge der tatsächlichen Werte ist damit nicht eindeutig bestimmt.',
    ],
    correctIndex: 3,
    explanation:
      'Es sind beispielsweise A = 12 und B = 9 ebenso mit den Bereichen vereinbar wie A = 8 und B = 13. Auch gleiche Werte innerhalb der Überschneidung sind möglich. Somit ist weder eine feste Reihenfolge noch Gleichheit bewiesen. Die Aufgabe verwendet bewusst nur sichere Modellintervalle; sie legt keine statistische Verteilung oder reale Messunsicherheitsbewertung fest.',
    hint: 'Suche innerhalb der beiden Bereiche mehr als eine mögliche Kombination tatsächlicher Werte. Bleibt ihre Reihenfolge dabei gleich?',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-si-graded-abtastung-v1',
    topicId: 'klima',
    kind: 'context',
    difficulty: 3,
    difficultyReason:
      'Zeitliche Auflösung einer Aufzeichnung mit der Dauer des gesuchten Ereignisses abgleichen und zwischen Nichtbeobachtung und Ausschluss unterscheiden.',
    title: 'Ein kurzes Ereignis zwischen Protokolleinträgen',
    context:
      'Ein Lehrprüfstand kann einen auffälligen Zustand für genau drei Sekunden annehmen und anschließend sofort zum normalen Wert zurückkehren. Das Protokoll speichert nur einzelne Momentanwerte alle 30 Sekunden; es gibt weder Maximalwertspeicher noch Ereigniserfassung. Alle gespeicherten Werte sind normal. Die Lage der drei Sekunden innerhalb eines 30-Sekunden-Abstands ist unbekannt.',
    question: 'Welche Auswertung passt zur zeitlichen Auflösung des Protokolls?',
    options: [
      'Das kurze Ereignis kann zwischen Einträgen liegen; die normalen Einträge schließen es nicht aus.',
      'Ein dreisekündiges Ereignis muss in jedem 30-Sekunden-Protokollwert enthalten sein.',
      'Die normalen Einträge beweisen, dass der Zustand während des gesamten Zeitraums normal war.',
      'Aus den Einträgen folgt der genaue Zeitpunkt eines nicht gespeicherten Ereignisses.',
    ],
    correctIndex: 0,
    explanation:
      'Eine Folge einzelner Momentanwerte deckt die Zwischenzeit nicht lückenlos ab. Ein dreisekündiges Ereignis kann vollständig zwischen zwei Speicherzeitpunkten liegen. Ohne zusätzlichen Ereignis- oder Spitzenwertspeicher beweisen normale Einträge deshalb weder durchgehenden Normalzustand noch Ereigniszeitpunkt. Eine passende weitere Erfassung muss sich am gesuchten Ereignis orientieren; es wird keine reale Diagnose oder konkrete Gerätefunktion behauptet.',
    hint: 'Zeichne zwei Speicherzeitpunkte auf eine Zeitlinie und prüfe, ob das ganze Ereignis dazwischen Platz hat.',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-si-graded-sollwertbegrenzung-v1',
    topicId: 'heizung',
    kind: 'context',
    difficulty: 2,
    difficultyReason:
      'Anforderung, wirksamen begrenzten Sollwert und Messwert voneinander unterscheiden, bevor eine Abweichung beurteilt wird.',
    title: 'Eine Anforderung oberhalb der Modellgrenze',
    context:
      'In einem fiktiven Regler wird der wirksame Sollwert ausdrücklich als der kleinere Wert aus Raumanforderung und zentraler Obergrenze gebildet. Die Raumanforderung beträgt 60 °C, die Obergrenze 45 °C. Im eingeschwungenen Modellbetrieb zeigt der zugeordnete Messwert konstant 45 °C. Es bestehen keine weiteren Sollwerte oder Freigaben.',
    question: 'Welche Aussage beschreibt diesen dokumentierten Zustand?',
    options: [
      'Die Messung belegt eine Abweichung von 15 K vom wirksamen Sollwert.',
      'Der Messwert folgt der wirksamen Begrenzung; 60 °C sind hier nur die vorgelagerte Anforderung.',
      'Die Obergrenze ist wirkungslos, sobald die Raumanforderung höher wird.',
      'Aus den drei Werten folgt bereits ein defekter Temperaturfühler.',
    ],
    correctIndex: 1,
    explanation:
      'Die vorgegebene Regel ergibt min(60, 45) = 45 °C als wirksamen Sollwert. Der Messwert stimmt damit überein. Die Differenz zur vorgelagerten Anforderung ist in diesem Fall durch die ausdrücklich dokumentierte Begrenzung erklärt und kein Nachweis eines Fühlerdefekts. Der Befund gilt nur für die beschriebene stationäre Modellregel, nicht als Freigabe eines realen Reglers oder Temperaturniveaus.',
    hint: 'Bestimme zuerst, welcher Wert nach Anwendung der Regel überhaupt die Vergleichsgröße für den Messwert ist.',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-wiso-graded-produktivitaet-v1',
    topicId: 'wiso',
    kind: 'knowledge',
    difficulty: 1,
    difficultyReason:
      'Die Größen einer grundlegenden Mengenkennzahl direkt zuordnen; keine wirtschaftliche Variantenentscheidung.',
    title: 'Eine mengenbezogene Arbeitskennzahl',
    context:
      'Ein Betrieb will die Arbeitsproduktivität eines wiederholbaren Modellprozesses als fertiggestellte Einheiten je eingesetzter Arbeitsstunde ausdrücken. Qualität und Umfang der Einheiten sind für diesen Vergleich gleich festgelegt. Preise und Löhne sind nicht Teil der gesuchten Kennzahl.',
    question: 'Welches Größenpaar gehört in diese Kennzahl?',
    options: [
      'Nettoerlös und Materialpreis.',
      'Kontostand und Zahlungsziel.',
      'Fertiggestellte Einheiten und eingesetzte Arbeitsstunden.',
      'Rechnungsnummer und Auftragsdatum.',
    ],
    correctIndex: 2,
    explanation:
      'Die beschriebene mengenbezogene Arbeitsproduktivität setzt die fertiggestellten Einheiten ins Verhältnis zu den dafür eingesetzten Arbeitsstunden. Preise, Kontostand oder Dokumentkennungen bilden diese Größe nicht ab. Die Vergleichbarkeit von Qualität und Leistungsumfang bleibt eine ausdrückliche Annahme; eine höhere Mengenkennzahl allein belegt keine bessere gesamte Betriebsleistung.',
    hint: 'Welche Größen stehen bereits in der geforderten Einheit „Einheiten je Arbeitsstunde“?',
    estimatedMinutes: 2,
    level: 'Grundlagen',
    sourceLabel,
  },
  {
    id: 'exam-wiso-graded-dbquote-v1',
    topicId: 'wiso',
    kind: 'knowledge',
    difficulty: 1,
    difficultyReason:
      'Eine vorgegebene relative Kennzahl von absoluten Beträgen und anderen Quotienten unterscheiden.',
    title: 'Eine relative Kennzahl im Betriebsvergleich',
    context:
      'In einem vereinfachten Betriebsvergleich ist der Deckungsbeitrag als Nettoerlös minus variable Kosten bestimmt. Der Nettoerlös ist positiv. Gesucht ist anschließend der Anteil dieses Deckungsbeitrags am Nettoerlös, ausgedrückt in Prozent. Fixkosten werden für diese Begriffsfrage nicht verteilt.',
    question: 'Welche Rechenvorschrift beschreibt genau den gesuchten Anteil?',
    options: [
      'Deckungsbeitrag / Nettoerlös × 100 %.',
      'Nettoerlös / Deckungsbeitrag × 100 %.',
      'Variable Kosten / Fixkosten × 100 %.',
      'Deckungsbeitrag − Nettoerlös.',
    ],
    correctIndex: 0,
    explanation:
      'Ein Anteil einer Größe am Nettoerlös setzt diese Größe in den Zähler und den Nettoerlös als Bezugsgröße in den Nenner. Mit der Multiplikation mit 100 wird der Anteil zur Prozentangabe. Der umgekehrte Quotient oder die Differenz beantwortet eine andere Frage. Diese Quote ist weder Gewinn noch eine Aussage darüber, ob die Fixkosten gedeckt sind.',
    hint: 'Welche Größe ist der betrachtete Teil und welche der ausdrücklich genannte Bezugswert?',
    estimatedMinutes: 2,
    level: 'Grundlagen',
    sourceLabel,
  },
  {
    id: 'exam-wiso-graded-miete-kauf-v1',
    topicId: 'wiso',
    kind: 'calculation',
    difficulty: 3,
    difficultyReason:
      'Zwei Kostenmodelle gleichsetzen, einmaligen Nettoaufwand von Tageskosten trennen und die Grenze auf ganze Nutzungstage übertragen.',
    title: 'Ein Modellwerkzeug mieten oder kaufen',
    context:
      'Ein fiktives Werkzeug kostet zur Miete 35 € je Nutzungstag. Beim Kauf fallen einmalig 480 € sowie 8 € je Nutzungstag an. Nach der Nutzung werden im Modell sicher 120 € aus dem Verkauf erzielt. Es werden nur volle Nutzungstage betrachtet. Steuer, Zinsen, Ausfall, Transport und alle anderen Unterschiede entfallen.',
    question:
      'Ab wie vielen ganzen Nutzungstagen ist der Kauf nach diesen Gesamtkosten nicht teurer als die Miete?',
    options: ['Ab 10 Tagen.', 'Ab 11 Tagen.', 'Ab 13 Tagen.', 'Ab 14 Tagen.'],
    correctIndex: 3,
    explanation:
      '1. Einmaliger Nettoaufwand des Kaufs: 480 − 120 = 360 €.\n2. Kostenmodelle: Miete 35 · d, Kauf 360 + 8 · d.\n3. Grenze: 360 + 8d ≤ 35d, also d ≥ 360 / 27 = 13,333… Tage.\n4. Nur ganze Tage sind zugelassen: ab 14 Tagen. Kontrolle: bei 13 Tagen kostet Kauf 464 € und Miete 455 €; bei 14 Tagen Kauf 472 € und Miete 490 €.\nDie Aussage gilt nur für den sicher vorgegebenen Wiederverkauf und die ausgeschlossenen Zusatzkosten.',
    hint: 'Trenne den einmaligen verbleibenden Kaufaufwand von den je Tag anfallenden Kosten. Prüfe die beiden ganzen Tage um den rechnerischen Schnittpunkt.',
    formula: 'K_Kauf = Kaufpreis − Verkaufserlös + Tageskosten · d',
    estimatedMinutes: 5,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-wiso-graded-ruestzeit-serie-v1',
    topicId: 'wiso',
    kind: 'calculation',
    difficulty: 3,
    difficultyReason:
      'Fixen Zeitanteil und Zeit je Einheit in zwei Modellen vergleichen und eine ganzzahlige Seriengröße bestimmen.',
    title: 'Zwei Arbeitsmethoden für eine Serie',
    context:
      'Für identische Modellbauteile benötigt Methode A einmalig 60 Minuten Vorbereitung und anschließend 12 Minuten je Stück. Methode B benötigt einmalig 15 Minuten Vorbereitung und 16 Minuten je Stück. Qualität, Personalzahl und sonstige Bedingungen sind gleich; weitere Zeiten entfallen. Es werden nur ganze fertige Stücke betrachtet.',
    question: 'Ab welcher Stückzahl braucht A insgesamt nicht mehr Zeit als B?',
    options: ['Ab 4 Stück.', 'Ab 12 Stück.', 'Ab 15 Stück.', 'Ab 45 Stück.'],
    correctIndex: 1,
    explanation:
      '1. A: t_A = 60 + 12n; B: t_B = 15 + 16n, jeweils in Minuten.\n2. 60 + 12n ≤ 15 + 16n ergibt 45 ≤ 4n, also n ≥ 11,25.\n3. Ab 12 ganzen Stücken ist A nicht langsamer. Bei 11 Stück: A 192 min, B 191 min; bei 12 Stück: A 204 min, B 207 min.\nEine kürzere Stückzeit entscheidet bei kleinen Serien nicht allein, weil die Vorbereitung ebenfalls anfällt.',
    hint: 'Stelle für jede Methode die gesamte Zeit aus einmaliger Vorbereitung plus Zeit je Stück auf. Die gesuchte Grenze muss eine ganze Stückzahl sein.',
    formula: 't_gesamt = t_Vorbereitung + n · t_Stück',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-wiso-graded-auftragsmix-liquiditaet-v1',
    topicId: 'wiso',
    kind: 'context',
    difficulty: 4,
    difficultyReason:
      'Deckungsbeiträge unter gleichzeitiger Zeit-, Zahlungs- und Mengengrenze vergleichen; der isoliert größte Beitrag reicht nicht.',
    title: 'Auftragsauswahl mit Zeit- und Zahlungsgrenzen',
    context:
      'Heute stehen 6 Arbeitsstunden und 650 € Zahlungsmittel zur Verfügung. Am Tagesende müssen daraus zusätzlich sicher 100 € bezahlt werden. Kundeneingänge erfolgen erst morgen. Jeder der drei Modellaufträge ist höchstens einmal möglich. A: 4 h, heute 500 € Auszahlung, 300 € Deckungsbeitrag. B: 2 h, heute 200 € Auszahlung, 200 € Deckungsbeitrag. C: 3 h, heute 350 € Auszahlung, 260 € Deckungsbeitrag. Alle angegebenen Deckungsbeiträge sind bereits vollständig berechnet; keine weiteren Kosten oder Geldquellen.',
    question:
      'Welche heutige Auswahl erfüllt alle Grenzen und erzielt den höchsten gesamten Deckungsbeitrag?',
    options: [
      'A und B mit 500 € Deckungsbeitrag.',
      'Nur A mit 300 € Deckungsbeitrag.',
      'B und C mit 460 € Deckungsbeitrag.',
      'A und C mit 560 € Deckungsbeitrag.',
    ],
    correctIndex: 2,
    explanation:
      'Nach Berücksichtigung der sicheren 100-€-Zahlung sind für die Aufträge höchstens 550 € verfügbar. B und C brauchen zusammen 5 h und 550 €; mit der Abschlusszahlung werden genau 650 € erreicht, bei 460 € Deckungsbeitrag. A und B passen zwar in 6 h, benötigen aber schon 700 € vor der Abschlusszahlung. A und C überschreiten Zeit und Zahlungsmittel. A allein ist zulässig, erzielt aber weniger als B und C. Die vollständige Auswahlprüfung bestätigt B und C als Maximum unter den genannten Grenzen. Deckungsbeitrag und verfügbare Zahlungsmittel werden hier bewusst getrennt vorgegeben.',
    hint: 'Prüfe jede Kombination zuerst gegen Arbeitszeit und heutige Auszahlungen einschließlich des verbleibenden Pflichtbetrags. Vergleiche erst danach die zulässigen Deckungsbeiträge.',
    estimatedMinutes: 5,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-wiso-graded-lieferquelle-risiko-v1',
    topicId: 'wiso',
    kind: 'context',
    difficulty: 3,
    difficultyReason:
      'Eine gemeinsame vorgelagerte Abhängigkeit hinter verschiedenen Vertragspartnern erkennen und die behauptete Risikotrennung prüfen.',
    title: 'Zwei Händler und ein gemeinsamer Warenursprung',
    context:
      'Ein Betrieb verteilt eine wichtige Teilebestellung auf zwei verschiedene Händler, um einen einzelnen Lieferausfall abzufangen. Beide Händler erklären jedoch, dass genau diese Teile ohne eigenen Lagerbestand aus demselben vorgelagerten Zentrallager kommen. Ob andere Lager oder Ersatzwege nutzbar wären, ist nicht geklärt. Der Betrieb möchte ausdrücklich auch einen Ausfall dieses Zentrallagers abfangen.',
    question: 'Welche Folgerung ist für den beschriebenen Beschaffungsplan richtig?',
    options: [
      'Die zwei Händlernamen beweisen bereits zwei voneinander unabhängige Warenwege.',
      'Der gemeinsame Ursprung beweist, dass beide Händler ihre Verträge nicht erfüllen werden.',
      'Ein Ausfall des Zentrallagers wird durch die zwei Bestellungen automatisch verdoppelt abgesichert.',
      'Die gemeinsame Lagerabhängigkeit bleibt; ein tatsächlich unabhängiger Weg wäre noch nachzuweisen.',
    ],
    correctIndex: 3,
    explanation:
      'Verschiedene Händler bedeuten nach diesen Angaben keine Trennung der ausdrücklich betrachteten vorgelagerten Abhängigkeit. Für das Ziel, gerade einen Ausfall dieses Lagers abzufangen, müsste ein nutzbarer unabhängiger Weg bekannt sein. Daraus folgt weder ein sicherer Ausfall noch ein tatsächlicher Vertragsbruch der Händler. Die Aussage betrifft nur die beschriebene Versorgungskette, keine allgemeine Bewertung bestimmter Lieferanten.',
    hint: 'Verfolge die Wege bis zu der Stelle zurück, deren Ausfall der Betrieb ausdrücklich abfangen möchte.',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-wiso-graded-preisrisiko-budget-v1',
    topicId: 'wiso',
    kind: 'context',
    difficulty: 2,
    difficultyReason:
      'Eine feste Budgetgarantie von einer bloßen Möglichkeit günstigerer Kosten unterscheiden; den vollständigen vorgegebenen Wertebereich beachten.',
    title: 'Zwei Preiszusagen bei fester Budgetgrenze',
    context:
      'Zwei technisch und terminlich gleiche Modellangebote sind gegeben. A garantiert insgesamt 1 000 €. B nennt einen Gesamtpreis, der abhängig von einem noch offenen Zuschlag zwischen 900 und 1 150 € liegen kann; diese beiden Grenzen sind vollständig und sicher. Nach einer ausdrücklichen Projektregel darf die Bestellung nur erfolgen, wenn 1 100 € in jedem zugelassenen Preisfall eingehalten werden. Eine spätere Preisbegrenzung von B ist noch nicht vereinbart.',
    question: 'Welche Bewertung folgt aus der festgelegten Entscheidungsregel?',
    options: [
      'A erfüllt die Budgetgarantie; B kann günstiger sein, erfüllt die Garantie aber noch nicht.',
      'B erfüllt die Garantie, weil sein kleinster möglicher Preis unter dem Budget liegt.',
      'Beide erfüllen die Garantie, weil der Mittelpunkt des B-Bereichs unter 1 100 € liegt.',
      'A überschreitet das Budget, sobald B in einem möglichen Fall nur 900 € kostet.',
    ],
    correctIndex: 0,
    explanation:
      'A liegt mit seinem festen Gesamtpreis sicher innerhalb der Budgetgrenze. Für B ist auch 1 150 € ausdrücklich möglich; dieser Fall überschreitet die erlaubten 1 100 €. Ein günstiger möglicher Ausgang oder ein Bereichsmittelwert ersetzt nicht die geforderte Einhaltung in jedem zulässigen Preisfall. Damit ist B nicht allgemein unwirtschaftlich, sondern erfüllt die derzeit geforderte Garantie nicht.',
    hint: 'Die Regel fragt nach einer Einhaltung in jedem möglichen Preisfall. Welcher Rand des angegebenen Bereichs ist dafür entscheidend?',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-wiso-graded-vergangene-ausgaben-v1',
    topicId: 'wiso',
    kind: 'context',
    difficulty: 2,
    difficultyReason:
      'Einen bei beiden Alternativen unveränderten, nicht rückholbaren Betrag von den künftigen Entscheidungsfolgen trennen.',
    title: 'Eine begonnene Werkzeugumstellung neu bewerten',
    context:
      'Für eine fiktive Werkzeugumstellung hat ein Betrieb bereits eine nicht rückzahlbare Vorbereitungsgebühr bezahlt. Sie fällt bei Fortsetzen und Abbrechen in gleicher Höhe an und kann auch nicht durch Verkauf zurückgewonnen werden. Über das weitere Vorgehen soll jetzt entschieden werden. Die noch entstehenden Ausgaben und die künftig nutzbaren Vorteile beider Varianten lassen sich gesondert bestimmen; rechtliche Pflichten oder andere Folgen sind im Modell ausgeschlossen.',
    question: 'Welche Vergleichsgrundlage unterstützt die jetzige Entscheidung?',
    options: [
      'Allein die Höhe der früheren Gebühr, weil sie nur beim Abbrechen verloren geht.',
      'Die ab jetzt unterschiedlichen Ausgaben und Vorteile; die unveränderte Gebühr entscheidet den Vergleich nicht.',
      'Die frühere Gebühr als vermeidbare Ausgabe nur der Fortsetzungsvariante ansetzen.',
      'Künftige Unterschiede weglassen, solange eine frühere Gebühr bereits bezahlt wurde.',
    ],
    correctIndex: 1,
    explanation:
      'Die bereits bezahlte Gebühr ist laut Fall bei beiden Möglichkeiten gleich und nicht rückholbar. Sie ist damit kein erst durch die jetzige Wahl entstehender Unterschied. Für diese Modellentscheidung sind die künftig unterschiedlichen Ausgaben und Vorteile zu vergleichen. Dies legt noch keine der beiden Varianten als beste fest; dafür müssen deren künftige Folgen tatsächlich ausgewertet werden. Es ist keine handels- oder steuerrechtliche Bilanzierungsaussage.',
    hint: 'Welche Beträge ändern sich noch durch die heutige Wahl, und welche bleiben unter beiden Möglichkeiten gleich?',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
];
