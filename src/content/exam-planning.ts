import type { Exercise } from '../data';

const sourceLabel =
  'Eigene Übungsaufgabe · Arbeitsplanung · Teil-2-Bezug · Version 1 · keine Originalprüfung';

/** Original planning scenarios. All requirements are supplied by the task itself. */
export const planningExercises: Exercise[] = [
  {
    id: 'exam-ap-rohrzuschnitt-v1',
    topicId: 'sanitaer',
    title: 'Vom Einbaumaß zum Rohrzuschnitt',
    context:
      'In einer eigenen Montagezeichnung beträgt der freie Abstand zwischen den einander zugewandten Muffenkanten 1 720 mm. Laut mitgelieferter Aufgabenanweisung muss das gerade Rohr an jedem Ende 25 mm in die jeweilige Muffe reichen. Beide Muffen bleiben an ihrer eingezeichneten Position; weitere Zuschläge sind nicht vorgesehen.',
    question: 'Welche Rohrlänge trägst du in die Zuschnittliste ein?',
    options: ['1 670 mm', '1 720 mm', '1 770 mm', '1 820 mm'],
    correctIndex: 2,
    explanation:
      '1. Der freie Abstand enthält die beiden Einsteckstrecken noch nicht.\n2. Zuschlag: 2 × 25 mm = 50 mm.\n3. Zuschnitt: 1 720 mm + 50 mm = 1 770 mm = 1,770 m.\n1 670 mm entstehen durch irrtümliches Abziehen. 1 720 mm ignorieren beide Einsteckstrecken; 1 820 mm rechnen jede doppelt. Die 25 mm gelten ausschließlich für die hier vorgegebene Aufgabe, nicht allgemein für Rohrsysteme.',
    hint: 'Skizziere die beiden Rohrenden innerhalb der Muffen und markiere, was im freien Abstand bereits enthalten ist.',
    formula: 'L_Zuschnitt = L_frei + 2 · L_Einsteckung',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-ap-bestellmenge-v1',
    topicId: 'heizung',
    title: 'Materialbedarf in lieferbare Stangen übersetzen',
    context:
      'Für ein Modellprojekt sind vier gerade Rohrstücke von jeweils 2,35 m vorgesehen. Die Bestellung soll die Nutzlänge zuzüglich 8 % Planungsreserve abdecken. Der Händler liefert nur ganze Stangen von 6,00 m. Eine Stange reicht für zwei Stücke; für diese Aufgabe deckt die Reserve die Schnittverluste mit ab.',
    question: 'Welche kleinste Bestellung erfüllt die Vorgabe und lässt sich passend zuschneiden?',
    options: [
      'Eine Stange mit insgesamt 6,00 m',
      'Zwei Stangen mit insgesamt 12,00 m',
      'Genau 10,152 m als Teilmenge einer Stange',
      'Drei Stangen mit insgesamt 18,00 m',
    ],
    correctIndex: 1,
    explanation:
      '1. Nutzlänge: 4 × 2,35 m = 9,40 m.\n2. Bedarf einschließlich Reserve: 9,40 m × 1,08 = 10,152 m.\n3. Liefermenge: 10,152 m / 6,00 m = 1,692 Stangen; deshalb auf zwei ganze Stangen aufrunden.\n4. Zuschnittprüfung: Je Stange ergeben zwei Stücke 4,70 m, also passen die vier Stücke auf zwei Stangen. Eine Stange reicht nicht, 10,152 m sind nicht lieferbar und drei Stangen sind unnötig. Reserve und Stangenmaß sind Aufgabenannahmen.',
    hint: 'Prüfe nach der Bedarfssumme sowohl die Verpackungseinheit als auch die tatsächliche Aufteilung der Einzelstücke.',
    formula: 'L_Bedarf = Anzahl · L_Stück · (1 + Reserve)',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-ap-hoehenplanung-v1',
    topicId: 'sanitaer',
    title: 'Die Endhöhe einer Leitung eintragen',
    context:
      'In einem rein geometrischen Planungsmodell liegt die Rohrachse am Anfang bei +1,200 m über dem Bezugspunkt. Die Leitung fällt auf einer waagerechten Bezugslänge von 4,50 m um 2,0 %. Rohrdurchmesser und Wandstärken ändern sich nicht. Das Gefälle ist nur für diese Rechenaufgabe vorgegeben und keine Auslegungsempfehlung.',
    question: 'Welche Achshöhe hat die Leitung am Ende?',
    options: ['+1,290 m', '+1,198 m', '+0,300 m', '+1,110 m'],
    correctIndex: 3,
    explanation:
      '1. Höhenunterschied: Δh = 4,50 m × 2,0 / 100 = 0,090 m.\n2. Wegen der fallenden Leitung abziehen: h_Ende = 1,200 m − 0,090 m = +1,110 m.\n+1,290 m wäre eine Steigung. +1,198 m verwechselt 2 % mit einer absoluten Länge; +0,300 m beruht auf einem Dezimalfehler. Die Rechnung bezieht sich auf die Rohrachse und die waagerechte Bezugslänge.',
    hint: 'Trenne die Berechnung des Höhenunterschieds von der Entscheidung, ob dieser zur Anfangshöhe addiert oder davon abgezogen wird.',
    formula: 'Δh = l_waagerecht · i / 100; h_Ende = h_Anfang − Δh',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-ap-heizflaechenwahl-v1',
    topicId: 'heizung',
    title: 'Eine Heizfläche nach Auftragsdaten wählen',
    context:
      'Für einen fiktiven Raum sind im Auftrag 1,40 kW Wärmeleistung und zusätzlich 10 % Leistungsreserve vereinbart. Im Aufgabenkatalog stehen vier passende Heizflächen mit 1,20, 1,50, 1,60 und 2,20 kW. Alle Leistungen gelten für genau dieselben vorgegebenen Betriebsbedingungen; Maße und Anschlusslage passen bei allen vier Modellen.',
    question: 'Welche kleinste katalogisierte Leistung erfüllt den Auftrag?',
    options: ['1,60 kW', '1,50 kW', '1,20 kW', '2,20 kW'],
    correctIndex: 0,
    explanation:
      '1. Reserve: 1,40 kW × 0,10 = 0,14 kW.\n2. Geforderte Leistung: 1,40 kW + 0,14 kW = 1,54 kW.\n3. 1,60 kW ist die kleinste angebotene Leistung ab 1,54 kW.\n1,50 kW unterschreiten die Vorgabe knapp; 1,20 kW schon ohne Reserve. 2,20 kW erfüllen sie zwar, sind aber nicht die kleinste Lösung. In einer echten Planung müssen unter anderem tatsächliche Auslegungsbedingungen und passende Herstellerdaten gesondert geprüft werden.',
    hint: 'Lege zuerst den geforderten Wert fest. Vergleiche anschließend die tatsächlich angebotenen Stufen.',
    formula: 'P_Anforderung = P_Auftrag · 1,10',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-ap-luefter-arbeitspunkt-v1',
    topicId: 'klima',
    title: 'Volumenstrom und Druck gemeinsam beachten',
    context:
      'Ein fiktiver Lüftungsauftrag fordert für drei Zulufträume mindestens 45, 40 und 35 m³/h. Die Anlagenskizze fordert für den gesamten Luftweg eine verfügbare Druckerhöhung von 80 Pa. Laut bereitgestellter Auswahltabelle liefern Modell A 100 m³/h bei 80 Pa, B 120 m³/h bei 0 Pa, C 125 m³/h bei 80 Pa und D 140 m³/h bei 40 Pa. Weitere Betriebspunkte sind nicht angegeben.',
    question: 'Für welches Modell belegen die gelieferten Daten einen ausreichenden Betriebspunkt?',
    options: [
      'Modell B, weil 120 m³/h genau dem Bedarf entsprechen',
      'Modell D, weil der größte Volumenstrom immer Vorrang hat',
      'Modell C, weil es den Gesamtbedarf bei 80 Pa erreicht',
      'Modell A, weil allein der angegebene Druck ausreicht',
    ],
    correctIndex: 2,
    explanation:
      '1. Gesamtbedarf: 45 + 40 + 35 = 120 m³/h.\n2. Gesucht ist ein belegter Betriebspunkt mit mindestens 120 m³/h bei 80 Pa. Dies erfüllt nur C mit 125 m³/h bei 80 Pa.\nB erreicht die geforderte Luftmenge nur bei 0 Pa; D ist nur bei 40 Pa belegt. Daraus darf man ihre Leistung bei 80 Pa nicht ableiten. A ist beim geforderten Druck zu klein. Die Auswahl ist eine Tabellenaufgabe, keine vollständige Ventilatorauslegung.',
    hint: 'Vergleiche die beiden Anforderungen als zusammengehöriges Wertepaar. Ein Freivolumenstrom ersetzt keinen Betriebspunkt.',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-ap-angebotsvergleich-v1',
    topicId: 'wiso',
    title: 'Materialpreis und Montagezeit zusammen bewerten',
    context:
      'Zwei gleichwertige Lösungen für einen fiktiven Auftrag erfüllen alle technischen Anforderungen. Lösung A benötigt 45 m Material zu 8,40 €/m und 3,0 Arbeitsstunden. Lösung B hat einen Materialpaketpreis von 400,00 € und benötigt 2,5 Arbeitsstunden. Für beide gelten 56,00 €/h. Verglichen werden nur diese Nettokosten; weitere Kosten und Steuern sind ausgeschlossen.',
    question: 'Welche Lösung hat die geringeren Gesamtkosten und um wie viel?',
    options: [
      'A ist um 22,00 € günstiger',
      'B ist um 28,00 € günstiger',
      'B ist um 6,00 € günstiger',
      'A ist um 6,00 € günstiger',
    ],
    correctIndex: 2,
    explanation:
      '1. A, Material: 45 m × 8,40 €/m = 378,00 €. Arbeit: 3,0 h × 56,00 €/h = 168,00 €. Summe A: 546,00 €.\n2. B, Arbeit: 2,5 h × 56,00 €/h = 140,00 €. Summe B: 400,00 € + 140,00 € = 540,00 €.\n3. Differenz: 546,00 € − 540,00 € = 6,00 € zugunsten von B.\n22,00 € vergleichen nur das Material; 28,00 € nur die Arbeit. Beides ist für den Gesamtvergleich unvollständig. Die Modellkosten sind kein Angebot für einen realen Auftrag.',
    hint: 'Bilde für jede Lösung erst eine vollständige Summe aus Material und Arbeitszeit. Vergleiche danach die Summen.',
    formula: 'K_gesamt = K_Material + t · K_Stunde',
    estimatedMinutes: 5,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-ap-ablaufabhaengigkeiten-v1',
    topicId: 'sanitaer',
    title: 'Arbeitsschritte aus Abhängigkeiten ordnen',
    context:
      'Ein eigenes Planspiel gibt diese Abhängigkeiten vor: Die endgültigen Aufmaße werden vor dem Zuschnitt bestätigt. Die Baugruppe wird nach dem Zuschnitt montiert. Die dokumentierte Sicht- und Maßkontrolle findet am montierten, noch zugänglichen Bauteil statt. Erst nach dieser Kontrolle wird die Verkleidung geschlossen. Weitere Arbeitsschritte werden im Modell nicht betrachtet.',
    question: 'Welche Reihenfolge erfüllt sämtliche vorgegebenen Abhängigkeiten?',
    options: [
      'Aufmaß bestätigen → zuschneiden → montieren → Kontrolle dokumentieren → Verkleidung schließen',
      'Zuschneiden → Aufmaß bestätigen → montieren → Kontrolle dokumentieren → Verkleidung schließen',
      'Aufmaß bestätigen → zuschneiden → montieren → Verkleidung schließen → Kontrolle dokumentieren',
      'Aufmaß bestätigen → Kontrolle dokumentieren → zuschneiden → montieren → Verkleidung schließen',
    ],
    correctIndex: 0,
    explanation:
      'Die Reihenfolge folgt den Bedingungen: bestätigte Maße vor dem Zuschnitt, Zuschnitt vor der Montage und Kontrolle am fertigen, zugänglichen Bauteil vor dem Schließen.\nBeim frühen Zuschnitt wird mit unbestätigten Maßen gearbeitet. Eine Kontrolle nach dem Schließen verletzt die Zugänglichkeitsvorgabe. Eine Kontrolle vor Zuschnitt und Montage kann das montierte Bauteil nicht beurteilen. Das ist ein Abhängigkeitsmodell, keine vollständige Montage- oder Sicherheitsanweisung.',
    hint: 'Zeichne für jede ausdrücklich genannte Voraussetzung einen Pfeil zum davon abhängigen Schritt.',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-ap-anschlussklaerung-v1',
    topicId: 'heizung',
    title: 'Eine fehlende Anschlussangabe erkennen',
    context:
      'Für eine Ersatzbaugruppe liegen die geforderte Heizleistung und ein Foto des vorhandenen Geräts vor. Gerätetyp, Anschlussabstände und die zugehörige Anschlusszeichnung fehlen. Zwei lieferbare Baugruppen haben dieselbe Leistung, laut Lieferant aber unterschiedliche Anschlüsse. Der Auftrag verlangt einen passenden Ersatz ohne ungeplante Änderungen der Anschlussleitungen.',
    question: 'Welche nächste Planungsentscheidung ist fachlich nachvollziehbar?',
    options: [
      'Die günstigere Baugruppe bestellen, weil gleiche Leistung passende Anschlüsse belegt',
      'Nach dem Foto die ähnlichste Baugruppe bestellen und Abstände später schätzen',
      'Beide Baugruppen bestellen und die vorhandenen Leitungen ohne Rückfrage anpassen',
      'Gerät eindeutig identifizieren, Anschlüsse aufmessen und mit der passenden Anschlusszeichnung abgleichen',
    ],
    correctIndex: 3,
    explanation:
      'Die Leistung allein beantwortet die Anschlussfrage nicht. Für die geforderte Austauschbarkeit fehlen entscheidende Daten. Eindeutige Identifikation, belastbares Aufmaß und Abgleich mit der zugehörigen Zeichnung schließen diese Lücke.\nPreis und Foto sind kein Nachweis passender Abstände. Zwei ungesicherte Bestellungen lösen die fehlende Information ebenfalls nicht; ein eigenmächtiger Leitungsumbau verändert zudem den beschriebenen Auftrag. Die Aufgabe behauptet keine Kompatibilität konkreter Herstellerprodukte.',
    hint: 'Trenne bereits belegte Eigenschaften von den Eigenschaften, die für einen passenden Ersatz noch nachgewiesen werden müssen.',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-ap-revisionszugang-v1',
    topicId: 'klima',
    title: 'Eine Leitungsroute mit dem Wartungszugang abstimmen',
    context:
      'Eine fiktive Kundenvorgabe verlangt vor einer Revisionsöffnung einen dauerhaft freien Bedienbereich von 500 mm Tiefe. Route A eines neuen Luftkanals würde davon nur 350 mm frei lassen. Route B lässt 550 mm frei und erfüllt laut Aufgabenzeichnung auch die übrigen Maß- und Anschlussvorgaben. Beide Routen können vor der Montage noch im Plan geändert werden.',
    question: 'Wie gehst du mit diesem Planungskonflikt um?',
    options: [
      'Route A wählen, da eine kürzere Strecke jede Kundenvorgabe ersetzt',
      'Route B in den abgestimmten Plan übernehmen und die Änderung mit freiem Bedienbereich dokumentieren',
      'Route A montieren und die Revisionsöffnung später verdecken',
      'Beide Routen ohne Entscheidung im Montageplan belassen',
    ],
    correctIndex: 1,
    explanation:
      'Route B erfüllt mit 550 mm den ausdrücklich geforderten freien Bereich von mindestens 500 mm und laut Kontext auch die übrigen Vorgaben. Sie wird vor der Ausführung im Plan abgestimmt und dokumentiert.\nRoute A unterschreitet die Vorgabe um 150 mm. Eine kurze Leitung ist kein Ersatz für den vereinbarten Zugang. Verdecken verschärft den Konflikt; zwei offene Varianten geben der Montage keine eindeutige Grundlage. Die 500 mm sind eine fiktive Auftragsanforderung, kein behaupteter Normwert.',
    hint: 'Prüfe die Varianten gegen alle genannten Randbedingungen und überlege, wann eine Planänderung noch nachvollziehbar möglich ist.',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-ap-pruefplan-v1',
    topicId: 'sanitaer',
    title: 'Prüfkriterien vor der Übergabe vollständig abarbeiten',
    context:
      'Ein reines Funktionsmodell hat zwei im Auftrag festgelegte Abnahmekriterien: Der gemessene Volumenstrom muss zwischen 140 und 160 l/h liegen und die Baugruppe muss die im Modell definierte Sichtkontrolle ohne sichtbaren Wasseraustritt bestehen. Gemessen wurden 150 l/h. Das Feld für die Sichtkontrolle ist leer. Reale Prüfverfahren und Normvorgaben sind nicht Bestandteil der Aufgabe.',
    question: 'Welche Aussage gehört in die Arbeitsplanung für die noch offene Kontrolle?',
    options: [
      'Mit 150 l/h sind automatisch beide Kriterien erfüllt',
      'Das leere Feld als bestanden markieren, da bislang kein Fehler gemeldet wurde',
      'Die Sichtkontrolle durchführen und ihr tatsächliches Ergebnis dokumentieren; erst dann beide Kriterien gemeinsam bewerten',
      'Den Volumenstrom in 150 m³/h umbenennen, damit die Prüfung vollständiger wirkt',
    ],
    correctIndex: 2,
    explanation:
      '150 l/h erfüllen das erste Kriterium. Zum zweiten Kriterium liegt noch kein Ergebnis vor. Deshalb muss die vorgeschriebene Modellkontrolle tatsächlich stattfinden und dokumentiert werden. Erst danach kann die vollständige Erfüllung beider Anforderungen bewertet werden.\nEin passender Messwert beweist kein anderes Prüfkriterium. Ein leeres Feld ist weder bestanden noch durchgefallen. Eine Änderung der Einheit wäre eine falsche Angabe und ersetzt keine Kontrolle. Das Modell beschreibt keinen Nachweis der realen Anlagen-Dichtheit.',
    hint: 'Unterscheide ein bestandenes Kriterium von einem noch nicht geprüften Kriterium.',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-ap-variantenmatrix-v1',
    topicId: 'klima',
    title: 'Eine Variante nach mehreren Muss-Kriterien auswählen',
    context:
      'Für ein fiktives Büro nennt der Auftrag zwei Muss-Kriterien am angegebenen Betriebspunkt: mindestens 90 m³/h und höchstens 30 dB(A) laut den für diese Aufgabe vergleichbaren Katalogdaten. Modell A: 100 m³/h, 33 dB(A), 280 €. Modell B: 85 m³/h, 27 dB(A), 260 €. Modell C: 95 m³/h, 29 dB(A), 320 €. Modell D: 110 m³/h, 28 dB(A), 390 €. Alle sonstigen Anforderungen sind erfüllt.',
    question: 'Welche günstigste Variante erfüllt beide Muss-Kriterien?',
    options: ['Modell A', 'Modell C', 'Modell B', 'Modell D'],
    correctIndex: 1,
    explanation:
      'Zuerst die Muss-Kriterien prüfen: A ist mit 33 dB(A) zu laut; B ist mit 85 m³/h zu klein. C und D erfüllen beide Kriterien. Von diesen beiden ist C mit 320 € günstiger als D mit 390 €.\nDer niedrigste Preis allein reicht nicht; ebenso wenig der größte Volumenstrom. Der Vergleich der Schallangaben ist hier ausdrücklich eine Aufgabenannahme. Für einen realen akustischen Vergleich müssten unter anderem Messgröße und Messbedingungen passend sein.',
    hint: 'Streiche zuerst jede Variante, die ein Muss-Kriterium verletzt. Vergleiche erst unter den verbleibenden Varianten den Preis.',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-ap-uebergabeunterlagen-v1',
    topicId: 'heizung',
    title: 'Die Übergabe aus dem Auftragsumfang planen',
    context:
      'Ein fiktiver Austauschauftrag umfasst laut Vereinbarung die Einweisung in die tatsächlich vorhandenen Bedienfunktionen, die Übergabe der zugehörigen Bedienunterlagen und ein Protokoll der ausgeführten Änderungen und gemessenen Modellwerte. Vorhanden sind nur eine Rechnung und ein leeres Protokollformular. Die technische Montage ist im Planspiel bereits abgeschlossen.',
    question: 'Welche Maßnahme schließt die beschriebene Dokumentations- und Einweisungslücke?',
    options: [
      'Nur die Rechnung übergeben und alle Bedienfunktionen als bekannt voraussetzen',
      'Das leere Formular unterschreiben lassen und Messwerte nachträglich schätzen',
      'Unterlagen eines ähnlich aussehenden Geräts ohne Typabgleich beilegen',
      'Zugehörige Unterlagen bereitstellen, tatsächliche Änderungen und Messwerte dokumentieren und die vereinbarten Funktionen nachvollziehbar erläutern',
    ],
    correctIndex: 3,
    explanation:
      'Die Übergabe muss die drei ausdrücklich vereinbarten Leistungen abbilden: passende Unterlagen, tatsächliche Dokumentation und Einweisung in die vorhandenen Funktionen. Die Rechnung allein erfüllt diese Inhalte nicht.\nGeschätzte Werte sind kein Messprotokoll; ein leeres Formular belegt keine Durchführung. Unterlagen eines anderen Geräts können falsche Bedienhinweise enthalten. Die Aufgabe bewertet den vorgegebenen Auftragsumfang und behauptet keine vollständige gesetzliche Übergabepflicht.',
    hint: 'Vergleiche die vorhandenen Unterlagen Punkt für Punkt mit den vereinbarten Leistungen. Welche Nachweise fehlen tatsächlich?',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
];
