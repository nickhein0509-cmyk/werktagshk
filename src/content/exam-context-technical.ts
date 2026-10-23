import type { Exercise } from '../data';

const sourceLabel = 'Eigene Übungsaufgabe · Kontextfall · Version 1 · keine Originalprüfung';

/** Original case decisions. Project and model rules are supplied by each prompt. */
export const technicalContextExercises: Exercise[] = [
  {
    id: 'exam-ap-context-systemkombination-v1',
    kind: 'context',
    topicId: 'sanitaer',
    title: 'Eine Lieferung passt nicht vollständig zur Stückliste',
    context:
      'Für eine fiktive Rohrbaugruppe fordert der Auftrag die dokumentierte Freigabe genau der Kombination aus Rohr, Fitting und Verbindungsmittel. Die gelieferte Rohrgröße stimmt mit der Stückliste überein. Ein Freigabeblatt nennt das Rohr zusammen mit Fitting X; geliefert wurde jedoch Fitting Y mit denselben Anschlussmaßen. Für Y liegt nur ein eigenes Maßblatt vor. Die Teile wurden noch nicht verarbeitet.',
    question:
      'Welcher Nachweis klärt gezielt, ob die gelieferte Kombination die Auftragsanforderung erfüllt?',
    options: [
      'Ein einzelner Werkstoffnachweis für Fitting Y ohne Bezug zum verwendeten Rohr',
      'Ein weiterer Größenvergleich zwischen Fitting X und Fitting Y',
      'Der Nachweis für die tatsächlich gelieferte Systemkombination',
      'Die Bestätigung, dass Fitting Y dieselbe Nenngröße wie das Rohr trägt',
    ],
    correctIndex: 2,
    explanation:
      'Der Auftrag verlangt ausdrücklich einen Nachweis für die vollständige Kombination. Das Freigabeblatt für X deckt Y nicht ab. Gleiche Anschlussmaße und passende Nenngrößen ersetzen den geforderten Kombinationsnachweis nicht. Auch ein Werkstoffnachweis für ein Einzelteil belegt nicht die Kombination der Teile. Vor der Entscheidung über die Verwendung muss deshalb der Nachweis für die gelieferte Kombination vorliegen oder eine belegte Alternative geklärt werden. Die Aufgabe behauptet weder, dass Y grundsätzlich ungeeignet ist, noch eine allgemeine Freigaberegel für reale Rohrsysteme.',
    hint: 'Unterscheide passende Einzelmaße vom ausdrücklich geforderten Nachweis für zusammen verwendete Teile.',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-ap-context-transportfolge-v1',
    kind: 'context',
    topicId: 'heizung',
    title: 'Vorfertigung und Einbringung gemeinsam planen',
    context:
      'Eine Modellbaugruppe kann laut bereitgestellter Montageanweisung in zwei Teilmodule zerlegt und am Aufstellort wieder verbunden werden. Jedes Teilmodul passt durch die einzige vorhandene Türöffnung. Die vollständig vormontierte Baugruppe ist breiter als diese Öffnung; ein Drehen verändert die erforderliche Mindestbreite nicht. Die Verbindung ist am Aufstellort zugänglich. Ein Umbau der Tür und andere Transportwege gehören nicht zum Auftrag.',
    question: 'Welche Arbeitsplanung berücksichtigt die gegebenen Randbedingungen?',
    options: [
      'Teilmodule vorfertigen, getrennt einbringen und am Aufstellort fertig verbinden',
      'Vollständig vormontieren und die Einbringung erst danach im Detail planen',
      'Vollständig vormontieren und beim Transport nur die Verpackung entfernen',
      'Den Transport unverändert freigeben, weil die Verbindung später zugänglich bleibt',
    ],
    correctIndex: 0,
    explanation:
      'Die Transportbegrenzung betrifft die vollständig vormontierte Baugruppe. Die Aufgabe gibt zugleich einen zulässigen Montageweg mit einzeln passenden Teilmodulen und zugänglicher Endverbindung vor. Damit ist die getrennte Einbringung mit anschließender Fertigmontage eine belegte Lösung innerhalb des Auftrags. Vollständige Vorfertigung verschiebt den bekannten Konflikt nur. Verpackungsentfernung ist keine belegte Lösung für die zu breite Baugruppe; die spätere Zugänglichkeit vergrößert die Tür nicht. Tragfähigkeit, Anschlagmittel und reale Transportmaßnahmen sind nicht Bestandteil dieses Planspiels.',
    hint: 'Betrachte den Zustand der Baugruppe zum Zeitpunkt des Transports, nicht nur im späteren Betrieb.',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-ap-context-bezugsniveau-v1',
    kind: 'context',
    topicId: 'sanitaer',
    title: 'Zwei Höhenangaben verwenden verschiedene Bezugsebenen',
    context:
      'In einer eigenen Badplanung bezieht sich die Anschlusszeichnung auf die Oberkante des fertigen Fußbodens. Der vorhandene Baustellenhöhenpunkt bezeichnet dagegen die Oberkante des Rohbodens. Die Anschlusszeichnung ist in sich vollständig. Die Aufbauhöhe zwischen Rohboden und fertigem Fußboden wurde für diesen Raum noch nicht bestätigt. Der Auftrag verlangt, die Anschlusslage vom Baustellenhöhenpunkt aus eindeutig zu übertragen.',
    question: 'Welche zusätzliche Information wird für diese Übertragung benötigt?',
    options: [
      'Eine weitere Angabe zur Anschlusslage über dem fertigen Fußboden',
      'Die Aufbauhöhe eines Nachbarraums ohne Bestätigung für diesen Raum',
      'Die lichte Raumhöhe ohne Bezug zum Baustellenhöhenpunkt',
      'Der bestätigte Höhenunterschied zwischen beiden Bezugsebenen',
    ],
    correctIndex: 3,
    explanation:
      'Es fehlt die Verbindung zwischen den beiden Bezugsebenen: der bestätigte Höhenunterschied vom Rohboden zum fertigen Fußboden in diesem Raum. Erst damit lässt sich eine über Fertigfußboden angegebene Lage auf den Baustellenhöhenpunkt beziehen. Eine Wiederholung der bereits vollständigen Anschlussangabe schließt diese Lücke nicht. Eine unbestätigte Aufbauhöhe aus einem anderen Raum darf nicht übertragen werden; auch die lichte Raumhöhe stellt keinen Bezug zum vorhandenen Höhenpunkt her. Es wird keine Aufbauhöhe angenommen und keine Anschlussnorm behauptet; geprüft wird ausschließlich das Lesen und Zusammenführen der vorgegebenen Planbezüge.',
    hint: 'Welche Angabe verbindet die Bezugsebene der Zeichnung mit der Bezugsebene des Höhenpunkts?',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-ap-context-leistungsdaten-v1',
    kind: 'context',
    topicId: 'heizung',
    title: 'Zwei Leistungsangaben gelten nicht für denselben Betriebspunkt',
    context:
      'Für ein fiktives Projekt sollen zwei Heizflächen bei derselben vorgegebenen Vorlauf-, Rücklauf- und Raumtemperatur verglichen werden. Auf Blatt A ist eine größere Wärmeleistung angegeben als auf Blatt B. A wurde jedoch bei höheren Wassertemperaturen bewertet; nur B nennt die geforderten Projektbedingungen. Für A liegen weder eine passende Leistungstabelle noch Umrechnungsdaten vor. Anschlusslage und Einbaumaße passen bei beiden.',
    question: 'Welche Aussage ist mit den vorhandenen Unterlagen begründet?',
    options: [
      'A ist sicher leistungsfähiger, weil seine angegebene Zahl größer ist',
      'Der Vergleich am Projektbetriebspunkt braucht zunächst passende Daten für A',
      'Beide leisten am Projektbetriebspunkt gleich viel, weil ihre Maße passen',
      'A ist am Projektbetriebspunkt sicher ungeeignet, weil seine Temperaturangaben abweichen',
    ],
    correctIndex: 1,
    explanation:
      'Die beiden Zahlen beschreiben unterschiedliche Betriebsbedingungen. Für einen belastbaren Vergleich müssen die Leistungen auf die vorgegebenen gemeinsamen Bedingungen bezogen sein. Für A fehlen diese Daten. Seine größere Zahl belegt deshalb weder einen Vorteil am Projektbetriebspunkt noch seine grundsätzliche Ungeeignetheit. Passende Anschlussmaße sagen ebenfalls nichts über identische Wärmeleistungen aus. Die Aufgabe verlangt keine geschätzte Umrechnung und liefert keine reale Herstellerkennlinie; die richtige Entscheidung benennt die konkrete Datenlücke.',
    hint: 'Prüfe, welche Bedingungen zu jeder Leistungsangabe gehören, bevor du die Zahlen vergleichst.',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-ap-context-messstellenzuordnung-v1',
    kind: 'context',
    topicId: 'klima',
    title: 'Raumnamen ändern sich, Messstellenkennungen bleiben',
    context:
      'In einem fiktiven Lüftungsprojekt wurde der bisherige Besprechungsraum in zwei Nutzungszonen aufgeteilt. Das neue Raumbuch nennt andere Raumnamen. Die unveränderte Messstellenliste verwendet dagegen stabile Kennungen M1 und M2. Im Protokollentwurf stehen nur die alten Raumnamen; eine Zuordnung der Kennungen zu den neuen Zonen fehlt. Vor der Messung verlangt der Projektplan eine eindeutige Verbindung zwischen Plan, Messstelle und Protokoll.',
    question: 'Welche Vorbereitung schafft die geforderte Nachvollziehbarkeit?',
    options: [
      'Die Messstellenkennungen aus dem Protokoll entfernen und nur neue Raumnamen verwenden',
      'Die alten Namen beibehalten, weil die Messstellen selbst unverändert sind',
      'Plan und Protokoll über die stabilen Kennungen den neuen Zonen zuordnen',
      'M1 und M2 ohne Ortsabgleich nach alphabetischer Reihenfolge auf die neuen Namen verteilen',
    ],
    correctIndex: 2,
    explanation:
      'Die stabilen Kennungen erlauben eine überprüfbare Verbindung, wenn ihre tatsächliche Zuordnung zu den neuen Zonen im Plan und Protokoll festgehalten wird. Alte Raumnamen allein sind nach der Umnutzung mehrdeutig. Das Entfernen der Kennungen würde die vorhandene Verbindung schwächen; eine alphabetische Verteilung wäre eine unbelegte neue Zuordnung. Bewertet wird die eindeutige Dokumentenkette des Modellprojekts, nicht eine bestimmte Norm zur Bezeichnung von Messstellen oder ein realer Abgleich der Anlage.',
    hint: 'Welche Kennung bleibt trotz geänderter Raumnamen als gemeinsamer Bezug erhalten?',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-ap-context-messbedingung-v1',
    kind: 'context',
    topicId: 'klima',
    title: 'Zwei Einstellungen im Lüftungsmodell vergleichen',
    context:
      'An einem vorbereiteten Lüftungsmodell sollen zwei zuvor festgelegte Einstellungen verglichen werden. Laut Projektversuchsplan dürfen sich zwischen den Messungen nur diese Einstellungen unterscheiden. Bei Versuch A waren alle vorgesehenen Türen geschlossen. Für Versuch B ist ein Teil der Türen offen eingeplant; außerdem soll ein zusätzlicher Ventilator laufen. Die Messgeräte und Messstellen wären in beiden Versuchen gleich.',
    question: 'Wie sollte der Vergleich vor dem Beginn überarbeitet werden?',
    options: [
      'Die übrigen Randbedingungen angleichen und nur die untersuchte Einstellung verändern',
      'Beide Versuche unverändert messen und jeden Unterschied allein der Einstellung zuschreiben',
      'Nur das Messgerät wechseln, damit sich die verschiedenen Randbedingungen ausgleichen',
      'Die Randbedingungen weglassen, weil gleiche Messstellen den Vergleich bereits eindeutig machen',
    ],
    correctIndex: 0,
    explanation:
      'Der ausdrücklich vorgegebene Versuchsplan fordert die Änderung nur einer untersuchten Größe. Andere Türstellungen und ein zusätzlicher Ventilator wären weitere Einflussfaktoren. Sie müssen für diesen Vergleich angeglichen oder in einem anderen, eigens begründeten Versuchsplan untersucht werden. Gleiche Messstellen beseitigen die zusätzlichen Einflüsse nicht. Ein Geräteaustausch gleicht sie ebenfalls nicht aus und könnte einen weiteren Unterschied einführen. Die Aussage gilt für die beschriebene Vergleichsaufgabe und legt keine Betriebsweise eines echten Gebäudes fest.',
    hint: 'Welche Unterschiede gehören zur untersuchten Einstellung und welche verändern zusätzlich das Modell?',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-ap-context-pruefumfang-v1',
    kind: 'context',
    topicId: 'sanitaer',
    title: 'Ein Prüfprotokoll beschreibt nur einen Abschnitt',
    context:
      'Ein fiktives Rohrmodell besteht aus den Abschnitten A und B. Im vorhandenen Prüfprotokoll ist der geprüfte Aufbau durch eine Skizze eindeutig auf A begrenzt. B wurde später ergänzt. Für die Übergabe verlangt der Projektplan einen nachvollziehbaren Nachweis für den gesamten aktuellen Aufbau. Der Protokollentwurf zur Übergabe übernimmt zwar die alten Messwerte, bezeichnet als Prüfumfang aber bereits A und B.',
    question: 'Welche Bearbeitung des Entwurfs entspricht der vorhandenen Nachweislage?',
    options: [
      'Die Bezeichnung A und B beibehalten, weil die alten Messwerte dokumentiert sind',
      'B ohne eigenen Nachweis einschließen, wenn sein Werkstoff mit A übereinstimmt',
      'Die alte Skizze weglassen, damit der aktuelle Prüfumfang nicht im Widerspruch steht',
      'Den belegten Umfang A erhalten und den fehlenden Nachweis für den aktuellen Aufbau klären',
    ],
    correctIndex: 3,
    explanation:
      'Das alte Protokoll belegt nur den darin dargestellten Aufbau A. Seine Messwerte dürfen nicht durch eine neue Überschrift zu Messwerten für A und B umgedeutet werden. Der nachgewiesene Umfang bleibt nachvollziehbar; für den aktuellen Aufbau ist der fehlende Nachweis nach dem Projektplan zu klären und zu dokumentieren. Gleiches Material ersetzt keine Prüfung. Das Löschen der Skizze würde die Nachweislücke verdecken. Die Aufgabe legt keine realen Prüfdrücke, Medien, Fristen oder Verfahren fest.',
    hint: 'Vergleiche den tatsächlich dargestellten Prüfaufbau mit dem Umfang, den die neue Überschrift behauptet.',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-ap-context-automatiknachweis-v1',
    kind: 'context',
    topicId: 'heizung',
    title: 'Die Betriebsart im Funktionsprotokoll',
    context:
      'Ein vorbereitetes Heizungsmodell soll laut Projektauftrag im automatischen Zeitprogramm vorgeführt werden. Im bisherigen Funktionsprotokoll wurde die Wärmeabgabe nur mit einer dokumentierten manuellen Daueranforderung beobachtet. Das Zeitprogramm ist eingetragen, aber noch nicht unter den vereinbarten Testbedingungen geprüft. Der Protokollentwurf kennzeichnet die automatische Funktion bereits als nachgewiesen.',
    question: 'Welche Ergänzung wird für diesen Nachweis benötigt?',
    options: [
      'Eine weitere Beobachtung derselben manuellen Daueranforderung',
      'Ein dokumentierter Test der vereinbarten Automatik ohne überlagernde Daueranforderung',
      'Eine Bildschirmkopie des eingetragenen Zeitprogramms ohne Funktionsbeobachtung',
      'Eine Übernahme des Handbetriebsergebnisses, weil in beiden Fällen dieselbe Heizfläche genutzt wird',
    ],
    correctIndex: 1,
    explanation:
      'Der beobachtete Handbetrieb zeigt nur, dass unter dieser Daueranforderung Wärme abgegeben wurde. Er belegt nicht das geforderte Reagieren auf das automatische Zeitprogramm. Dazu ist ein dokumentierter Test unter den vereinbarten Automatikbedingungen nötig, bei dem die Daueranforderung das Verhalten nicht überlagert. Eine Bildschirmkopie belegt die Eingabe, nicht die ausgeführte Funktion. Das ist eine Nachweisfrage an einem vorbereiteten Modell; sie enthält keine Bedien- oder Freigabeanweisung für eine echte Heizungsanlage.',
    hint: 'Trenne die Eingabe einer Regel von der Beobachtung, dass diese Regel das Modell tatsächlich steuert.',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-si-context-zeitbasis-v1',
    kind: 'context',
    topicId: 'heizung',
    title: 'Zwei Störprotokolle verwenden unterschiedliche Uhren',
    context:
      'Ein Modellregler protokolliert eine Anforderung um 10:04 Uhr. Ein getrenntes Messgerät zeigt eine Zustandsänderung um 10:02 Uhr in seinem eigenen Protokoll. Beide Einträge stammen aus demselben kurzen Test, doch die Uhren wurden nicht abgeglichen. Ihre Abweichung voneinander ist unbekannt. Eine Auswertung behauptet allein aus diesen beiden Uhrzeitangaben, die Zustandsänderung sei vor der Anforderung erfolgt.',
    question: 'Welcher nächste Auswertungsschritt ist erforderlich?',
    options: [
      'Die Aufzeichnungen über eine gemeinsame Zeitbasis oder ein gemeinsames Ereignis zuordnen',
      'Die spätere Uhrzeit automatisch dem späteren tatsächlichen Ereignis zuordnen',
      'Die Zustandsänderung als Reaktion auf die Anforderung ausschließen',
      'Den Regler als Ursache festlegen, weil seine angezeigte Uhrzeit größer ist',
    ],
    correctIndex: 0,
    explanation:
      'Ohne bekannten Zeitversatz lässt sich die Reihenfolge von Einträgen aus zwei verschiedenen Uhren nicht zuverlässig vergleichen. Eine gemeinsame Zeitbasis oder ein in beiden Aufzeichnungen eindeutig erkennbares Referenzereignis kann die Zuordnung herstellen. Erst danach ist die zeitliche Reihenfolge auswertbar. Weder die angezeigten Uhrzeiten allein noch die Größe ihrer Zahlen beweisen eine Ursache oder schließen eine Reaktion aus. Die Aufgabe beurteilt die Protokollauswertung, nicht den Aufbau oder die Sicherheit einer realen Regelung.',
    hint: 'Sind die beiden Uhrzeitangaben bereits direkt miteinander vergleichbar?',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-si-context-gleichzeitig-geaendert-v1',
    kind: 'context',
    topicId: 'heizung',
    title: 'Nach zwei Änderungen tritt die Störung nicht mehr auf',
    context:
      'An einem vorbereiteten Heizungsmodell wurde ein zeitweise ausbleibender Wärmetransport beobachtet. Vor dem nächsten Test wurden zugleich eine fehlerverdächtige Kontaktverbindung erneuert und ein Regelparameter geändert. Danach arbeitet das Modell im bisher geprüften Zeitraum ohne die Auffälligkeit. Welcher der beiden Eingriffe ausschlaggebend war, wurde nicht separat untersucht; andere Betriebszustände sind noch offen.',
    question: 'Welche Schlussfolgerung ist durch den bisherigen Test gedeckt?',
    options: [
      'Die Kontaktverbindung war eindeutig die einzige Ursache',
      'Die Parameteränderung war eindeutig die einzige wirksame Maßnahme',
      'Die Auffälligkeit blieb unter der gemeinsam geänderten Konfiguration bisher aus',
      'Alle möglichen Betriebszustände sind durch die erfolgreiche Wiederholung nachgewiesen',
    ],
    correctIndex: 2,
    explanation:
      'Belegt ist die Beobachtung unter der gemeinsam geänderten Konfiguration und im tatsächlich geprüften Zeitraum. Weil zwei mögliche Einflussgrößen zugleich geändert wurden, lässt sich die Wirkung keiner davon allein zuordnen. Der Test schließt auch Auffälligkeiten in nicht geprüften Zuständen nicht aus. Eine weitere Ursachenuntersuchung bräuchte einen geeigneten, freigegebenen Versuchsplan, der die Einflüsse unterscheidet. Es wird nicht verlangt, reale Fehler erneut herzustellen oder eine Reparatur rückgängig zu machen.',
    hint: 'Welche Beobachtung liegt vor, und welche zusätzliche Zuordnung würde darüber hinausgehen?',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-si-context-druck-temperatur-v1',
    kind: 'context',
    topicId: 'heizung',
    title: 'Ein Drucktrend wurde bei verschiedenen Temperaturen aufgenommen',
    context:
      'In einem ausdrücklich vereinfachten geschlossenen Wassermodell verändert sich der angezeigte Druck auch mit der mittleren Wassertemperatur. Am ersten Tag wurde bei warmem Wasser ein höherer Druck notiert, am zweiten bei kaltem Wasser ein niedrigerer. Füllzustand und Messstelle sind nicht vollständig protokolliert. Weitere Beobachtungen zu einem möglichen Wasserverlust liegen nicht vor. Aus den zwei Zahlen wird bereits ein Leck behauptet.',
    question: 'Welche Bewertung ist für diesen Befund angemessen?',
    options: [
      'Der geringere Druck am zweiten Tag beweist unabhängig vom Zustand ein Leck',
      'Für einen belastbaren Trend fehlen vergleichbare Zustände und Angaben zu weiteren Änderungen',
      'Die Temperatur erklärt sicher den gesamten Unterschied; weitere Prüfung ist ausgeschlossen',
      'Die höheren Warmwerte sind grundsätzlich ungültig und können gelöscht werden',
    ],
    correctIndex: 1,
    explanation:
      'Das vorgegebene Modell nennt die Temperatur ausdrücklich als Einflussgröße. Zusätzlich sind Füllzustand und Messzuordnung unvollständig. Aus den zwei nicht vergleichbaren Aufnahmen folgt deshalb weder ein sicherer Lecknachweis noch dessen sicherer Ausschluss. Ein nachvollziehbarer Vergleich braucht definierte, vergleichbare Zustände und ein Protokoll relevanter Änderungen. Die ursprünglichen Werte werden mit ihren bekannten Bedingungen erhalten. Es werden keine realen Druckgrenzen, Befüllmaßnahmen oder Prüfverfahren vorgegeben.',
    hint: 'Welche möglichen Einflussgrößen unterscheiden sich zwischen den beiden Aufnahmen?',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-si-context-messort-v1',
    kind: 'context',
    topicId: 'sanitaer',
    title: 'Zwei Temperaturwerte stammen von verschiedenen Stellen',
    context:
      'In einem vorbereiteten Wasserprüfstand zeigt ein eingebauter Temperaturkanal am Eingang eine niedrigere Temperatur als ein unabhängiges Messgerät am Ausgang. Zwischen beiden Messorten liegt ein Bauteil mit möglichem Wärmeaustausch. Beide Anzeigen sind stabil. Vergleichsmessungen am selben Ort und Informationen zur tatsächlichen Wärmeübertragung fehlen. Im Bericht soll allein aus der Differenz ein Defekt des eingebauten Kanals abgeleitet werden.',
    question:
      'Welche Vergleichsmessung würde die Aussage über die Messabweichung gezielter prüfen?',
    options: [
      'Dieselben beiden Messorte erneut vergleichen und den Abstand der Werte mitteln',
      'Nur das Ausgangsgerät länger beobachten, ohne den Messort zu ändern',
      'Die beiden Werte gleichsetzen, weil sie zum selben Prüfstand gehören',
      'Beide Messketten unter geeigneten gleichen örtlichen und zeitlichen Bedingungen vergleichen',
    ],
    correctIndex: 3,
    explanation:
      'Unterschiedliche Messorte mit möglichem Wärmeaustausch können tatsächlich unterschiedliche Temperaturen haben. Um eine Messabweichung der Kanäle zu beurteilen, müssen die verglichenen Werte auf geeignete gleiche Bedingungen am Messort und im Zeitpunkt bezogen werden. Stabilität allein macht unterschiedliche Orte nicht identisch. Mehr Wiederholungen am unveränderten Aufbau trennen den Temperatureffekt zwischen den Orten nicht von einer Kanalabweichung. Die Aufgabe beschreibt eine Auswertungsstrategie für einen vorbereiteten Prüfstand und keine Eingriffe an einer realen Trinkwasseranlage.',
    hint: 'Vergleichen die Anzeigen dieselbe physikalische Größe am selben Ort unter denselben Bedingungen?',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-si-context-messgrenze-filter-v1',
    kind: 'context',
    topicId: 'klima',
    title: 'Nach dem Umbau umfasst die Messung einen anderen Luftweg',
    context:
      'Vor einem Umbau wurde die Druckdifferenz an einem Modellluftweg ausschließlich vor und nach dem Filter gemessen. Im neuen Protokoll liegt der zweite Messanschluss hinter einem zusätzlichen Kanalstück mit einer Klappe. Der Luftvolumenstrom ist bei beiden Messungen gleich. Der neue Differenzwert ist größer. Eine Auswertung bezeichnet den gesamten Anstieg als zusätzlichen Filterdruckverlust.',
    question: 'Welche Aussage berücksichtigt die veränderte Messgrenze?',
    options: [
      'Der neue Differenzwert enthält den Filter und den zusätzlichen Luftweg; die Anteile sind noch zu trennen',
      'Gleicher Luftvolumenstrom macht beide Differenzwerte automatisch zu reinen Filterwerten',
      'Der gesamte Anstieg beweist eine Verschlechterung des Filters',
      'Der Filter hat sicher keinen Anteil am neuen Messwert, weil eine Klappe hinzugekommen ist',
    ],
    correctIndex: 0,
    explanation:
      'Der neue Messbereich umfasst mehr als den Filter. Der zusätzliche Kanalabschnitt mit Klappe kann ebenfalls zur gemessenen Druckdifferenz beitragen. Daher darf der Gesamtanstieg nicht allein dem Filter zugeschrieben werden. Gleicher Volumenstrom verbessert die Vergleichbarkeit der Betriebsgröße, macht aber unterschiedliche Messgrenzen nicht gleich. Umgekehrt ist der Filter weiterhin Teil der neuen Messstrecke. Für eine getrennte Bewertung fehlen passende Einzelmessungen oder andere ausreichende Angaben. Es werden keine Austauschgrenzen oder realen Klappenstellungen abgeleitet.',
    hint: 'Markiere gedanklich alle Bauteile zwischen den beiden Messanschlüssen vor und nach dem Umbau.',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-si-context-zweigvergleich-v1',
    kind: 'context',
    topicId: 'heizung',
    title: 'Ein auffälliger Zweig im Vergleichsprüfstand',
    context:
      'Ein Modellprüfstand besitzt zwei konstruktiv gleiche, getrennte Zweige A und B. Laut Aufgabenmodell sollen sie bei gleichen Eingangsbedingungen, gleicher Anforderung und gleicher Last vergleichbares Verhalten zeigen. Im Protokoll ist nur in A eine geringere Wärmeabgabe notiert. B wurde dabei mit höherer Anforderung und anderer Last betrieben. Eine Beurteilung erklärt A allein aufgrund dieses Vergleichs für defekt.',
    question:
      'Welche weitere Untersuchung unterscheidet einen Zweigfehler besser von den geänderten Randbedingungen?',
    options: [
      'Den Unterschied nur über einen längeren Zeitraum unter denselben ungleichen Bedingungen beobachten',
      'Die Lastangaben aus dem Protokoll entfernen und die Wärmeabgaben direkt vergleichen',
      'Die Zweige im dafür vorgesehenen Modelltest unter vergleichbaren Anforderungen und Lasten gegenüberstellen',
      'Das bessere Ergebnis von B als Sollwert für jeden beliebigen Betriebszustand von A festlegen',
    ],
    correctIndex: 2,
    explanation:
      'Das Aufgabenmodell erwartet vergleichbares Verhalten ausdrücklich nur bei vergleichbaren Bedingungen. Der bisherige Test verändert Anforderung und Last gleichzeitig mit dem betrachteten Zweig. Ein kontrollierter Vergleich unter passenden gleichen Bedingungen kann diese Einflüsse besser trennen. Längere Beobachtung beseitigt die fehlende Vergleichbarkeit nicht. Das Weglassen der Lastangaben verdeckt den Unterschied lediglich; ein beliebiger Wert von B ist kein allgemeiner Sollwert für A. Die Untersuchung ist auf den vorgesehenen Modelltest begrenzt.',
    hint: 'Welche Bedingungen verlangt die Aussage über vergleichbares Verhalten der beiden Zweige?',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-si-context-freigabekette-v1',
    kind: 'context',
    topicId: 'klima',
    title: 'Der Lüftungsbetrieb ist trotz Raumanforderung gesperrt',
    context:
      'Für ein fiktives Regelmodell gilt: Der Ventilator erhält nur dann eine Betriebsfreigabe, wenn eine Raumanforderung vorliegt, das Zeitfenster aktiv ist und kein Sperrsignal ansteht. Im aktuellen Protokoll sind die Raumanforderung und das Zeitfenster aktiv, das Sperrsignal aber ebenfalls aktiv. Die ausgegebene Betriebsfreigabe ist aus. Welcher Grund das Sperrsignal auslöst, wurde noch nicht untersucht.',
    question: 'Welche Aussage passt zum vorgegebenen Regelmodell und zum vorhandenen Befund?',
    options: [
      'Die ausgeschaltete Freigabe beweist einen Fehler der Ventilatorhardware',
      'Die Freigabe entspricht der Sperrbedingung; die Herkunft des Sperrsignals ist gesondert zu prüfen',
      'Das aktive Zeitfenster muss das Sperrsignal überstimmen und den Ventilator freigeben',
      'Die Raumanforderung ist aus, weil die endgültige Betriebsfreigabe aus ist',
    ],
    correctIndex: 1,
    explanation:
      'Die Aufgabe verknüpft drei notwendige Bedingungen. Trotz aktiver Raumanforderung und aktivem Zeitfenster verhindert das anstehende Sperrsignal die Freigabe. Der beobachtete Ausgang widerspricht dieser Regel daher nicht. Das sagt noch nichts darüber, ob das Sperrsignal seinerseits begründet ist; seine Herkunft muss getrennt untersucht werden. Eine fehlende Freigabe beweist keinen Hardwarefehler und ändert die protokollierte Raumanforderung nicht. Es werden keine realen Sicherheits- oder Schutzsignale überbrückt oder bewertet.',
    hint: 'Prüfe jede notwendige Bedingung getrennt, bevor du vom Ausgang auf einen Bauteilfehler schließt.',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-si-context-ereignisnachweis-v1',
    kind: 'context',
    topicId: 'sanitaer',
    title: 'Ein sporadischer Fehler bleibt im kurzen Test aus',
    context:
      'An einem vorbereiteten Wasserprüfstand wurde eine Auffälligkeit bisher nur während eines seltenen automatischen Umschaltvorgangs protokolliert. Nach einer dokumentierten Korrektur läuft ein kurzer Test ohne Auffälligkeit. Der Umschaltvorgang trat in diesem Test jedoch nicht auf. Der Projektprüfplan verlangt für den Abschluss einen Nachweis gerade für den zuvor auffälligen Vorgang.',
    question: 'Welche Aussage kann im Abschlussbericht bereits getroffen werden?',
    options: [
      'Der bisherige Fehler ist sicher behoben, weil der kurze Test unauffällig verlief',
      'Der zuvor auffällige Vorgang ist automatisch mitgeprüft, weil der Prüfstand eingeschaltet war',
      'Die Korrektur ist sicher wirkungslos, weil der seltene Vorgang nicht aufgetreten ist',
      'Der kurze Test war unauffällig; der geforderte Nachweis des Umschaltvorgangs fehlt noch',
    ],
    correctIndex: 3,
    explanation:
      'Die bisherige Beobachtung wird korrekt als unauffälliger kurzer Test beschrieben. Weil der zuvor auffällige Vorgang dabei nicht stattfand, deckt dieser Test den verlangten Nachweis nicht ab. Daraus folgt weder sicherer Reparaturerfolg für diesen Vorgang noch sichere Wirkungslosigkeit der Korrektur. Der Abschluss benötigt die im Projektprüfplan vorgesehene Untersuchung des relevanten Vorgangs. Die Aufgabe verlangt nicht, reale Gefährdungen oder Fehlerzustände herzustellen; sie beurteilt ausschließlich die Reichweite des dokumentierten Tests.',
    hint: 'Ist der konkrete Zustand, für den der Nachweis verlangt wird, im Test tatsächlich vorgekommen?',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
];
