import type { Exercise } from '../data';

const sourceLabel = 'Eigene Übungsaufgabe · Systemanalyse · Teil-2-Bezug';

/** Original model scenarios, content revision 1. See docs/exam-system-review.md. */
export const systemExercises: Exercise[] = [
  {
    id: 'exam-si-waermeleistung',
    topicId: 'heizung',
    title: 'Messwerte statt Vermutung',
    context:
      'Ein stationärer Modellheizkreis hat 720 l/h Wasserdurchfluss. Gemessen werden 45 °C im Vorlauf und 40 °C im Rücklauf. Für diese Rechnung gelten ρ = 1 kg/l und c = 4,2 kJ/(kg · K), ohne Verluste. In der Planungsnotiz stehen 8,4 kW bei gleichem Durchfluss und 10 K Spreizung. Die Messwerte gelten als richtig.',
    question: 'Welche Aussage wird durch diese Messwerte gestützt?',
    options: [
      'Aktuell werden 4,2 kW übertragen; die Messung allein benennt noch keine defekte Komponente.',
      'Aktuell werden 8,4 kW übertragen, weil der Durchfluss dem Plan entspricht.',
      'Aktuell werden 21 kW übertragen; damit ist die Pumpe eindeutig defekt.',
      'Aktuell werden 42 kW übertragen, weil die Temperaturen in °C angegeben sind.',
    ],
    correctIndex: 0,
    explanation:
      '1. Spreizung: ΔT = 45 − 40 = 5 K.\n2. Massenstrom: 720 l/h × 1 kg/l ÷ 3 600 = 0,2 kg/s.\n3. Leistung: P = 0,2 × 4,2 × 5 = 4,2 kJ/s = 4,2 kW.\nBei gleichem Durchfluss halbiert die halbe Spreizung die übertragene Leistung. Der Planwert gilt für andere Temperaturbedingungen. Aus einer geringeren übertragenen Leistung folgt noch keine eindeutige Bauteildiagnose; Last und Betriebszustand gehören zur weiteren Auswertung. Die übrigen Werte verwechseln Plan- und Messbedingungen oder Umrechnungen.',
    hint: 'Berechne die Leistung aus den tatsächlich gemessenen Größen. Trenne anschließend den Befund von einer möglichen Ursache.',
    formula: 'P = ṁ · c · ΔT',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-si-sensorkennlinie',
    topicId: 'heizung',
    title: 'Ein Fühlerwert auf dem Prüfblatt',
    context:
      'Für einen fiktiven Temperaturfühler gilt im betrachteten Bereich die lineare Modellkennlinie R = 1 000 Ω + (4 Ω/K) · ΔT. ΔT ist die Temperaturdifferenz gegenüber 0 °C in Kelvin; die Kennlinie ist keine Angabe zu einem realen Fühlertyp. Ein vorbereitetes Prüfprotokoll nennt 1 160 Ω. Leitungs- und Messfehler bleiben unberücksichtigt. Es geht nur um die Auswertung des Protokolls.',
    question: 'Welche Temperatur gehört nach dieser Kennlinie zum Widerstandswert?',
    options: ['29 °C', '40 °C', '160 °C', '290 °C'],
    correctIndex: 1,
    explanation:
      '1. Den Grundwiderstand abziehen: 1 160 Ω − 1 000 Ω = 160 Ω.\n2. Durch die Steigung teilen: 160 Ω ÷ 4 Ω/K = 40 K Temperaturänderung gegenüber 0 °C, also 40 °C.\n3. Einsetzen zur Kontrolle: 1 000 + 4 × 40 = 1 160 Ω.\n160 °C lässt die Teilung durch die Steigung aus; 290 °C entsteht durch Teilen des gesamten Widerstands ohne Abzug des Grundwerts. Die Kennlinie ist ausdrücklich fiktiv und darf nicht für einen realen Fühlertyp verwendet werden.',
    hint: 'Stelle die vorgegebene Kennlinie nach T um und prüfe das Ergebnis durch Einsetzen.',
    formula: 'ΔT = (R − 1 000 Ω) / (4 Ω/K); T = 0 °C + ΔT',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-si-ventilrueckmeldung',
    topicId: 'heizung',
    title: 'Anforderung und Rückmeldung passen nicht',
    context:
      'In einer fiktiven Anlagenaufzeichnung fordert die Regelung ab Minute 0 eine Ventilöffnung von 100 %. Die unabhängig erfasste Stellungsrückmeldung bleibt in Minute 0, 2 und 4 bei 20 %. Laut vorgegebener Funktionsbeschreibung müsste die angeforderte Stellung innerhalb einer Minute erreicht sein. Beide Signale und ihre Zeitstempel gelten im Modell als zuverlässig.',
    question: 'Welcher Befund ist anhand der Aufzeichnung am besten begründet?',
    options: [
      'Der Wärmeerzeuger ist sicher zu klein dimensioniert.',
      'Der Heizkreis hat sicher einen zu hohen Volumenstrom.',
      'Die angeforderte Ventilstellung wird im vorgegebenen Zeitraum nicht erreicht; die Ursache muss eingegrenzt werden.',
      'Die Regelung arbeitet entsprechend der Funktionsbeschreibung, weil beide Werte in Prozent vorliegen.',
    ],
    correctIndex: 2,
    explanation:
      'Nach der fiktiven Funktionsbeschreibung dürfte die Abweichung höchstens eine Minute bestehen. Noch nach vier Minuten stehen 100 % Anforderung nur 20 % Rückmeldung gegenüber. Das belegt die nicht erreichte Stellung im Modell. Es beweist jedoch weder eine zu geringe Erzeugerleistung noch einen bestimmten Durchfluss. Auch die gemeinsame Einheit Prozent macht zwei verschiedene Signalwerte nicht gleich. Eine fachliche Eingrenzung würde die Signalkette und die vorgegebenen Betriebsbedingungen berücksichtigen, statt vorschnell ein Bauteil auszutauschen.',
    hint: 'Vergleiche Sollwert, Rückmeldung und erlaubte Reaktionszeit. Welche Feststellung kommt ohne zusätzliche Annahme aus?',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-si-energiebilanz',
    topicId: 'heizung',
    title: 'Was sagt ein Tageswert aus?',
    context:
      'Eine Wärmepumpe liefert in einem abgegrenzten Messzeitraum 12 kWh Wärme. Ihr zugeordneter Stromzähler erfasst im selben Zeitraum 4 kWh elektrische Energie. Die Messgrenze umfasst in dieser Modellaufgabe alle betrachteten elektrischen Verbraucher. Messfehler werden vernachlässigt.',
    question: 'Welche Auswertung ist mit diesen Daten zulässig?',
    options: [
      'Die Jahresarbeitszahl ist damit nachgewiesen 3.',
      'Das Verhältnis beträgt 0,33, weil Strom stets durch Wärme zu teilen ist.',
      'Die Wärmepumpe erzeugt 8 kWh elektrische Energie.',
      'Im betrachteten Zeitraum beträgt das Verhältnis Wärmeenergie zu elektrischer Energie 3; ein Jahreswert ist daraus nicht nachgewiesen.',
    ],
    correctIndex: 3,
    explanation:
      'Das Verhältnis für diese Messgrenze und diesen Zeitraum lautet 12 kWh ÷ 4 kWh = 3. Die Einheit kürzt sich. Ein kurzer Messzeitraum enthält nicht die unterschiedlichen Betriebsbedingungen eines ganzen Jahres und belegt deshalb keine Jahresarbeitszahl. 0,33 ist der umgekehrte Quotient. Die Differenz 12 − 4 = 8 kWh ist keine erzeugte elektrische Energie; die Daten beschreiben zugeführte elektrische und abgegebene thermische Energie.',
    hint: 'Achte darauf, welche Energie im Zähler und welche im Nenner steht und für welchen Zeitraum die Aussage gelten kann.',
    formula: 'E_Wärme / E_elektrisch',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-si-zaehlervergleich',
    topicId: 'sanitaer',
    title: 'Ein Zähler läuft weiter',
    context:
      'Ein fiktiver Wasserzähler zeigt um 10:00 Uhr 12,430 m³ und um 10:05 Uhr 12,433 m³. Laut Beobachtungsprotokoll wurden in diesen fünf Minuten keine bekannten Entnahmestellen benutzt. Die Zählerauflösung und Messung gelten für die Modellrechnung als ausreichend; 1 m³ = 1 000 l.',
    question: 'Welche Aussage verbindet Rechnung und sachgerechte Befundbewertung?',
    options: [
      'Der gemittelte Durchfluss beträgt 0,6 l/min; eine unbekannte Entnahme oder Undichtigkeit ist zu klären, ihr Ort ist noch nicht bestimmt.',
      'Der Durchfluss beträgt 3 l/min; damit ist das WC als Ursache bewiesen.',
      'Der Durchfluss beträgt 0,006 l/min; ein weiterer Befund ist ausgeschlossen.',
      'Die Zählerdifferenz beweist eine Undichtigkeit von 3 m³/min.',
    ],
    correctIndex: 0,
    explanation:
      '1. Differenz: 12,433 − 12,430 = 0,003 m³ = 3 l.\n2. Mittelwert: 3 l ÷ 5 min = 0,6 l/min.\nDie beobachtete Bewegung ohne bekannte Nutzung begründet eine weitere Eingrenzung. Sie lokalisiert aber weder ein bestimmtes Ventil noch eine einzelne Entnahmestelle. 3 l ist das Gesamtvolumen und kein Minutenwert; die anderen Antworten verwechseln Volumen, Zeit oder die Umrechnung m³ in Liter. Ein schwankender Durchfluss könnte denselben Mittelwert ergeben.',
    hint: 'Bilde erst die Zählerdifferenz und anschließend den Quotienten aus Volumen und Messdauer. Was verrät ein zentraler Zähler nicht?',
    formula: 'V̇_mittel = ΔV / Δt',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-si-mischprobe',
    topicId: 'sanitaer',
    title: 'Eine Mischprobe als Plausibilitätskontrolle',
    context:
      'Auf einem Laborblatt werden 2 kg Wasser bei 60 °C mit 1 kg Wasser bei 15 °C gemischt. Für beide Teilmengen gilt die gleiche konstante Wärmekapazität. Das isolierte Modellgefäß nimmt keine Wärme auf; es gibt keinen Wärmeverlust oder Phasenwechsel. Ein Auswertebogen nennt 25 °C als rechnerisches Ergebnis, nicht als Messung.',
    question: 'Wie beurteilst du das Ergebnis des Auswertebogens?',
    options: [
      '25 °C ist richtig, weil die beiden Temperaturen zu addieren und durch 3 zu teilen sind.',
      'Das Ergebnis muss 45 °C sein; 25 °C ist mit der angegebenen Modellrechnung nicht vereinbar.',
      'Das Ergebnis muss 37,5 °C sein, weil stets der einfache Mittelwert gilt.',
      'Das Ergebnis muss 90 °C sein, weil die heiße Wassermenge doppelt so groß ist.',
    ],
    correctIndex: 1,
    explanation:
      'Bei gleicher Wärmekapazität gilt der nach Massen gewichtete Mittelwert: T_m = (2 × 60 + 1 × 15) ÷ (2 + 1) = 135 ÷ 3 = 45 °C. Die größere heiße Teilmenge zieht den Wert über den einfachen Mittelwert 37,5 °C. Das Ergebnis liegt zugleich zwischen 15 und 60 °C. 25 °C stammt hier aus einer falschen ungewichteten Summenrechnung; 90 °C verletzt die Energiebilanz des beschriebenen Modells. Daraus folgt keine Diagnose an einer realen Mischarmatur.',
    hint: 'Berücksichtige nicht nur die Temperaturen, sondern auch die jeweils beteiligten Massen.',
    formula: 'T_m = (m₁ · T₁ + m₂ · T₂) / (m₁ + m₂)',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-si-druckverlust',
    topicId: 'sanitaer',
    title: 'Den Druckverlust vergleichbar machen',
    context:
      'Ein Prüfblatt dokumentiert den Druckverlust derselben Filterstrecke: früher 15 kPa, heute 45 kPa. Wasserzustand, Messstellen und Messgeräte sind vergleichbar. Ob der Volumenstrom bei beiden Aufnahmen gleich war, wurde jedoch nicht notiert. Es werden keine Grenzwerte oder Austauschvorgaben angegeben.',
    question: 'Welche Schlussfolgerung ist aus diesem Prüfblatt allein tragfähig?',
    options: [
      'Der Filter ist eindeutig verstopft und muss nach einer hier bewiesenen Grenzwertüberschreitung ersetzt werden.',
      'Der heutige Volumenstrom muss genau dreimal so groß sein.',
      'Der gemessene Druckverlust ist größer; ohne vergleichbaren Volumenstrom ist die Ursache damit noch nicht eindeutig.',
      'Druckverluste sind unabhängig vom Volumenstrom; die fehlende Angabe spielt daher keine Rolle.',
    ],
    correctIndex: 2,
    explanation:
      '45 kPa sind mehr als 15 kPa. Der Druckverlust hängt aber auch vom Volumenstrom ab; die fehlende Angabe verhindert eine saubere Bewertung des Filterwiderstands. Weder ein Defekt noch ein bestimmter Durchfluss oder eine Grenzwertüberschreitung ist damit nachgewiesen. Die Aufgabe nennt absichtlich keinen zulässigen Grenzwert. Für einen aussagekräftigen Trend müssen die Betriebsbedingungen vergleichbar dokumentiert sein.',
    hint: 'Prüfe, welche Betriebsgröße einen Druckverlust verändern kann, obwohl das Bauteil unverändert bleibt.',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-si-temperaturvergleich',
    topicId: 'sanitaer',
    title: 'Zwei Kanäle, ein Referenzbad',
    context:
      'Zwei vorbereitete Temperaturkanäle A und B liegen laut Laborprotokoll im selben stabilen Referenzbad bei 20,0 °C. Nach der für dieses Modell vorgegebenen Wartezeit zeigt A 20,1 °C und B 35,0 °C. Die Referenzmessung, gemeinsame Badtemperatur und vollständige Eintauchung gelten als bestätigt. Die zulässige Modellabweichung beträgt ±0,5 K.',
    question: 'Welche Aussage ist durch diesen Vergleich gestützt?',
    options: [
      'Das Referenzbad muss zwei unterschiedliche Temperaturen haben.',
      'Kanal A überschreitet die vorgegebene Abweichung.',
      'Der Fühler an Kanal B ist als einzelnes Bauteil zweifelsfrei defekt; andere Teile der Messkette sind ausgeschlossen.',
      'Kanal B liegt außerhalb der Modellabweichung; der Vergleich grenzt die Auffälligkeit auf seine Messkette ein, noch nicht auf ein einzelnes Bauteil.',
    ],
    correctIndex: 3,
    explanation:
      'A weicht um 0,1 K ab und liegt innerhalb ±0,5 K. B weicht um 15,0 K ab und liegt außerhalb der ausdrücklich vorgegebenen Modellgrenze. Da das gemeinsame stabile Bad als bestätigt gilt, betrifft der Befund die Messkette B. Die Messung unterscheidet jedoch noch nicht zwischen Fühler, Leitung, Parametrierung und Auswertung. Die Modellgrenze ist keine allgemeine Hersteller- oder Normtoleranz.',
    hint: 'Vergleiche jeden Kanal mit der unabhängigen Referenz und unterscheide eine auffällige Messkette von einem bewiesenen Einzeldefekt.',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-si-luftmessung',
    topicId: 'klima',
    title: 'Luftmenge aus dem Messprotokoll',
    context:
      'Für einen geraden Modellluftkanal wird eine freie Querschnittsfläche von 0,060 m² angegeben. Die über den Querschnitt gemittelte Luftgeschwindigkeit beträgt 2,5 m/s. Der Sollwert im fiktiven Abgleichblatt beträgt 600 m³/h. Dichteänderungen und Messunsicherheit werden in dieser Aufgabe vernachlässigt.',
    question: 'Welcher Befund ergibt sich aus diesen Angaben?',
    options: [
      'Es werden 540 m³/h erreicht, also 90 % des vorgegebenen Sollwerts.',
      'Es werden 150 m³/h erreicht, also 25 % des Sollwerts.',
      'Es werden 0,15 m³/h erreicht; die Umrechnung in Stunden entfällt.',
      'Es werden 6 000 m³/h erreicht, weil der Sollwert mit der Geschwindigkeit multipliziert wird.',
    ],
    correctIndex: 0,
    explanation:
      '1. V̇ = A × v = 0,060 m² × 2,5 m/s = 0,15 m³/s.\n2. Stundenwert: 0,15 × 3 600 = 540 m³/h.\n3. Sollwerterfüllung: 540 ÷ 600 × 100 % = 90 %.\nDer Sollwert ist eine Aufgabenangabe, keine normative Mindestluftmenge. 0,15 ist der Sekundenwert; die übrigen Antworten verbinden nicht zusammengehörende Größen oder rechnen falsch um. Ein geringerer gemessener Wert benennt noch nicht seine Ursache.',
    hint: 'Prüfe zuerst die Einheit von Fläche mal Geschwindigkeit und rechne danach den Zeitbezug um.',
    formula: 'V̇ = A · v',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-si-filtertrend',
    topicId: 'klima',
    title: 'Ein Filtertrend unter gleichen Bedingungen',
    context:
      'Der Druckverlust eines Modellluftfilters steigt bei gleichem gemessenem Volumenstrom von 80 Pa auf 200 Pa. Dichte, Messstellen und Messgeräte sind vergleichbar. Im Modell gilt Δp = R · V̇². R ist nur eine Widerstandskenngröße des betrachteten Betriebsbereichs; ein Austauschgrenzwert wird nicht angegeben.',
    question: 'Welche Aussage folgt aus dem vorgegebenen Modell?',
    options: [
      'Die Widerstandskenngröße bleibt gleich, weil der Volumenstrom gleich ist.',
      'Die Widerstandskenngröße beträgt jetzt das 2,5-Fache; daraus folgt ohne Grenzwert noch keine konkrete Austauschvorgabe.',
      'Der Volumenstrom muss auf das 2,5-Fache gestiegen sein.',
      'Der Wirkungsgrad des Ventilators beträgt jetzt 40 %.',
    ],
    correctIndex: 1,
    explanation:
      'Aus R = Δp / V̇² folgt bei unverändertem V̇: R_neu / R_alt = 200 Pa / 80 Pa = 2,5. Der höhere Druckverlust ist unter diesen vergleichbaren Bedingungen ein Hinweis auf eine erhöhte Widerstandskenngröße. Der Volumenstrom ist ausdrücklich gleich; eine Ventilatorwirkungsgradberechnung ist mit den gegebenen Daten nicht möglich. Eine Austauschentscheidung bräuchte die passenden realen Vorgaben, die hier nicht genannt sind.',
    hint: 'Bilde das Verhältnis der beiden Modellgleichungen. Welche unveränderte Größe kürzt sich dabei?',
    formula: 'R_neu / R_alt = Δp_neu / Δp_alt bei gleichem V̇',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-si-luftbilanz',
    topicId: 'klima',
    title: 'Die Luftbilanz ist noch nicht vollständig',
    context:
      'Ein Raum erhält laut Messprotokoll 220 m³/h Zuluft. Über den gemessenen Abluftanschluss verlassen ihn 180 m³/h. Für diese Bilanz gelten gleicher Luftzustand, stationärer Betrieb und keine Luftspeicherung. Weitere mögliche Zu- oder Abströmwege wurden noch nicht erfasst.',
    question: 'Welche Aussage schließt die Modellbilanz ohne unbelegte Zusatzannahme?',
    options: [
      'Im Raum sammeln sich im stationären Modell jede Stunde 40 m³ zusätzliche Luft an.',
      'Ein bestimmter Überdruck in Pascal ist damit bereits berechnet.',
      'Über weitere Wege müssen insgesamt netto 40 m³/h aus dem Raum abströmen; Lage und Druck sind dadurch noch nicht bestimmt.',
      'Der Abluftventilator ist mit diesen Daten eindeutig als defekt nachgewiesen.',
    ],
    correctIndex: 2,
    explanation:
      'Für den stationären Modellzustand ohne Speicherung muss die gesamte Ausströmung der Einströmung entsprechen. Zwischen den gemessenen Anschlüssen fehlen 220 − 180 = 40 m³/h auf der Ausströmseite. Das ist eine Nettoangabe: Zusätzliche Einströmwege würden zusätzliche Ausströmung erfordern. Die Differenz lokalisiert keinen einzelnen Weg und bestimmt ohne weitere Widerstands- oder Druckdaten keinen Druckwert. Ein konkreter Ventilatordefekt ist ebenfalls nicht bewiesen.',
    hint: 'Formuliere zuerst die Bilanz für den stationären Zustand. Welche Aussage betrifft nur die noch nicht erfasste Nettoströmung?',
    formula: 'Summe Zufluss = Summe Abfluss im stationären Modell',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-si-schalthysterese',
    topicId: 'klima',
    title: 'Warum bleibt das Signal eingeschaltet?',
    context:
      'Eine fiktive Lüftungssteuerung schaltet eine Heizanforderung bei Temperaturen unter 20 °C ein und bei Temperaturen über 22 °C aus. Zwischen einschließlich 20 °C und einschließlich 22 °C behält sie den bisherigen Zustand. Um 08:00 Uhr ist die Anforderung bei 19 °C eingeschaltet; um 08:05 Uhr werden 21 °C gemessen. Andere Freigaben bleiben unverändert.',
    question: 'Welcher Zustand ist um 08:05 Uhr nach dieser Funktionsbeschreibung richtig?',
    options: [
      'Ausgeschaltet, weil 21 °C genau zwischen den beiden Schaltgrenzen liegt.',
      'Ständig wechselnd, weil im Zwischenbereich kein Zustand definiert ist.',
      'Ein Defekt ist bewiesen, falls das Signal eingeschaltet bleibt.',
      'Weiter eingeschaltet, weil im Zwischenbereich der vorherige Zustand erhalten bleibt.',
    ],
    correctIndex: 3,
    explanation:
      'Bei 19 °C wurde die Anforderung eingeschaltet. 21 °C liegt anschließend im ausdrücklich beschriebenen Haltebereich von 20 bis 22 °C. Deshalb bleibt der vorherige Zustand erhalten. Ausgeschaltet würde erst oberhalb 22 °C. Die beiden unterschiedlichen Schaltgrenzen verhindern im Modell einen unmittelbaren Zustandswechsel bei jeder kleinen Schwankung um einen einzigen Punkt. Die Regel ist eine Aufgabenannahme, keine allgemeine Vorgabe für reale Anlagen.',
    hint: 'Lies neben den Temperaturgrenzen auch den bisherigen Zustand und die Regel für den Zwischenbereich.',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
];
