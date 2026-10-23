import type { Exercise } from '../data';

const sourceLabel = 'Eigene Übungsaufgabe · Transferfall · Version 1 · keine Originalprüfung';

// Exact model and calculation review: docs/exam-transfer-review.md.
// These are original demands, not copied questions or claims about an unseen exam.
export const transferExercises: Exercise[] = [
  {
    id: 'exam-ap-speicher-mit-entnahme-v1',
    kind: 'calculation',
    topicId: 'heizung',
    title: 'Speicherladung bei gleichzeitiger Wärmeabgabe',
    context:
      'Ein ideal durchmischter Modellspeicher enthält unverändert 180 kg flüssiges Wasser. Seine Temperatur soll von 25 auf 45 °C steigen. Für Wasser gilt konstant c = 4,18 kJ/(kg · K). Eine Heizung führt dem Wasser konstant 6,0 kW Wärme zu. Gleichzeitig werden über einen getrennten Wärmetauscher konstant 1,5 kW Wärme abgegeben, ohne Wasser auszutauschen. Behältererwärmung, weitere Verluste und Phasenwechsel entfallen.',
    question: 'Wie lange dauert die Erwärmung? Runde auf die nächste ganze Minute.',
    options: ['42 min', '56 min', '70 min', '100 min'],
    correctIndex: 1,
    explanation:
      '1. Temperaturhub: 45 − 25 = 20 K.\n2. Gespeicherte Wärme: Q = 180 × 4,18 × 20 = 15 048 kJ = 4,18 kWh.\n3. Speicherwirksame Leistung: 6,0 − 1,5 = 4,5 kW.\n4. Zeit: 4,18 kWh / 4,5 kW = 0,928888… h = 55,7333… min, gerundet 56 min.\nDie 42 min entstehen näherungsweise, wenn man die gleichzeitige Wärmeabgabe ignoriert. Die berechnete Zeit gilt ausschließlich für die konstanten Modellbedingungen.',
    hint: 'Welche Leistung erhöht die innere Energie des Speichers tatsächlich? Stelle die Wärmebilanz vor der Zeitrechnung auf.',
    formula: 'Q = m · c · ΔT; t = Q / (P_zu − P_ab)',
    estimatedMinutes: 5,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-ap-zuschnitt-schnittfuge-v1',
    kind: 'calculation',
    topicId: 'sanitaer',
    title: 'Die Gesamtlänge reicht – aber reicht der Zuschnitt?',
    context:
      'Für ein fiktives Projekt werden zwei fertige Rohrstücke mit je 3 400 mm und zwei mit je 2 600 mm gebraucht. Es gibt nur Stangen mit genau 6 000 mm nutzbarer Länge. Für jedes aus einer Stange abgetrennte fertige Stück werden zusätzlich 4 mm Schnittfuge verbraucht. Ein Reststück muss nicht erhalten bleiben. Andere Verluste oder Reserven gibt es nicht; bereits geteilte Stücke dürfen nicht verbunden werden.',
    question: 'Wie viele ganze Stangen müssen mindestens bestellt werden?',
    options: [
      'Zwei, weil die Fertiglängen zusammen genau 12 m ergeben',
      'Vier, weil jede Stange nur ein Stück erlaubt',
      'Eine, weil 6 m die längste Fertiglänge übersteigen',
      'Drei, weil die Schnittfugen passende Zweierkombinationen verhindern',
    ],
    correctIndex: 3,
    explanation:
      '1. Zwei 3 400-mm-Stücke passen nicht gemeinsam auf eine Stange. Bei nur zwei Stangen müsste daher auf jeder eines liegen.\n2. Ein 3 400-mm- plus ein 2 600-mm-Stück brauchen mit den ausdrücklich vorgegebenen zwei Schnittfugen 3 400 + 2 600 + 8 = 6 008 mm. Das passt nicht. Selbst nur eine Trennfuge würde die 6 000 mm überschreiten.\n3. Drei Stangen genügen: auf zwei Stangen jeweils ein 3 400-mm-Stück, auf der dritten beide 2 600-mm-Stücke; dafür sind 5 208 mm nötig.\nDie reine Gesamtlängenteilung unterschätzt hier die Bestellung. Die Schnittfugenregel ist eine Aufgabenannahme, keine allgemeine Maschinenangabe.',
    hint: 'Prüfe eine tatsächliche Stückverteilung. Die Summe der Fertiglängen allein beantwortet die Frage bei Schnittverlusten nicht.',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-ap-planfreigabe-v1',
    kind: 'context',
    topicId: 'sanitaer',
    title: 'Zeichnungsstände vor der Montage abgleichen',
    context:
      'Im fiktiven Projekt gilt: Änderungen werden erst nach dokumentierter Freigabe ausgeführt. Zeichnung A ist als „freigegeben“ gekennzeichnet und sieht den Anschluss links vor. Die jüngere Zeichnung B zeigt ihn rechts, trägt jedoch den Status „Entwurf – Abstimmung offen“. Eine mündliche Notiz verweist auf B. Der Montagebeginn für diesen Anschluss steht an.',
    question: 'Welche Entscheidung hält die vorgegebene Freigaberegel ein und klärt den Konflikt?',
    options: [
      'Den Widerspruch vor der betroffenen Montage dokumentieren und eine eindeutige freigegebene Vorgabe einholen',
      'B allein wegen des jüngeren Datums als freigegeben behandeln',
      'Rechts montieren und den Planstatus erst bei der Übergabe klären',
      'Den Anschluss zwischen links und rechts anordnen, damit beide Pläne teilweise erfüllt werden',
    ],
    correctIndex: 0,
    explanation:
      'Das jüngere Datum ersetzt nicht den ausdrücklich geforderten Freigabestatus. B ist ein Entwurf und die mündliche Notiz keine dokumentierte Änderungsfreigabe. Der konkrete Widerspruch wird vor dem betroffenen Arbeitsschritt geklärt. Das verlangt keine pauschale Unterbrechung aller anderen Projektarbeiten. Eine Mittelposition erfüllt keine der Anschlussvorgaben. Bewertet wird nur die genannte Projektregel, keine rechtliche Vertragsauslegung.',
    hint: 'Unterscheide Aktualität und verbindlichen Bearbeitungsstatus eines Dokuments.',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-ap-druckdifferenz-begriff-v1',
    kind: 'knowledge',
    topicId: 'heizung',
    title: 'Zwei Drücke und eine Druckdifferenz',
    context:
      'Auf einem vereinfachten Schema eines Wasserkreises sind unmittelbar vor und nach einer Pumpe zwei Druckmessstellen auf gleicher Höhe eingezeichnet. Beide Anzeigen verwenden denselben Bezugsdruck. Gesucht ist ausschließlich die Differenz der beiden angezeigten Drücke; Strömungsgeschwindigkeiten und reale Pumpenauslegung sind nicht Gegenstand der Aufgabe.',
    question:
      'Wie wird die Druckdifferenz zwischen Pumpenaustritt und Pumpeneintritt aus diesen Anzeigen bestimmt?',
    options: [
      'Durch Addition beider Anzeigen',
      'Aus dem Anlagendruck allein, unabhängig vom zweiten Messwert',
      'Durch Austrittsdruck minus Eintrittsdruck mit gemeinsamer Druckeinheit',
      'Durch Multiplikation der Anzeigen; das Ergebnis hat die Einheit kW',
    ],
    correctIndex: 2,
    explanation:
      'Eine Differenz bildet man durch Subtraktion: Δp = p_Austritt − p_Eintritt. Beide Werte müssen dieselbe Einheit und einen gemeinsamen Bezugsdruck verwenden. Die Einheit bleibt eine Druckeinheit. Eine Summe oder ein Produkt ist keine Druckdifferenz. Der statische Anlagendruck allein beschreibt diese Differenz nicht. Diese Begriffsfrage berechnet weder Förderhöhe noch hydraulische Leistung oder reale Betriebseignung.',
    hint: 'Welche Rechenoperation steckt im Wort „Differenz“ und welche Einheit bleibt dabei erhalten?',
    estimatedMinutes: 2,
    level: 'Grundlagen',
    sourceLabel,
  },
  {
    id: 'exam-si-energieprotokoll-v1',
    kind: 'calculation',
    topicId: 'heizung',
    title: 'Mittlere Leistung aus zwei Zählerständen',
    context:
      'Ein Modellwärmezähler steht um 14:10 Uhr auf 10,00 kWh und um 14:55 Uhr auf 16,30 kWh. Die Messgrenze ist unverändert. Die zum Vergleich vorgegebene Referenzleistung beträgt 10,50 kW. Messunsicherheit und weitere Energiewege werden nicht betrachtet. Es wird keine konstante momentane Leistung vorausgesetzt.',
    question:
      'Welche mittlere Leistung und welcher Anteil an der Referenz folgen für diesen Zeitraum?',
    options: ['6,30 kW und 60 %', '8,40 kW und 80 %', '0,14 kW und 1,33 %', '10,50 kW und 100 %'],
    correctIndex: 1,
    explanation:
      '1. Energieänderung: 16,30 − 10,00 = 6,30 kWh.\n2. Messdauer: 45 min / 60 = 0,75 h.\n3. Mittlere Leistung: 6,30 kWh / 0,75 h = 8,40 kW.\n4. Anteil an der Referenz: 8,40 / 10,50 × 100 = 80 %.\nDas ist ein Zeitmittel. Daraus folgt weder eine zu jedem Zeitpunkt konstante Leistung noch ohne weitere Bedingungen ein Defekt. 6,30 kWh sind eine Energie und kein direkt ablesbarer Leistungswert.',
    hint: 'Bestimme zuerst die Änderung und den Zeitabstand. Wandle Minuten in Stunden um, bevor du durch die Zeit teilst.',
    formula: 'P_mittel = ΔE / Δt',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-si-widerstand-normieren-v1',
    kind: 'calculation',
    topicId: 'klima',
    title: 'Andere Luftmenge, anderer Druckverlust',
    context:
      'Für denselben Modellfilter werden zwei Betriebspunkte protokolliert: 100 Pa Druckverlust bei 200 m³/h sowie später 25 Pa bei 100 m³/h. Luftzustand, Messstellen und Messgeräte sind vergleichbar. Im betrachteten Bereich gilt ausdrücklich Δp = R · V̇². R ist eine Modellkenngröße; es ist kein Austauschgrenzwert gegeben.',
    question: 'Wie hat sich die aus beiden Punkten berechnete Widerstandskenngröße R verändert?',
    options: [
      'Sie ist auf ein Viertel gesunken',
      'Sie hat sich halbiert',
      'Sie ist auf das Vierfache gestiegen',
      'Sie ist gleich geblieben; beide Punkte ergeben dieselbe Kenngröße',
    ],
    correctIndex: 3,
    explanation:
      '1. Erster Punkt: R₁ = 100 / 200² = 0,0025 Pa · h²/m⁶.\n2. Zweiter Punkt: R₂ = 25 / 100² = 0,0025 Pa · h²/m⁶.\n3. Verhältnis: R₂/R₁ = 1. Die halbierte Luftmenge ergibt bei gleichem R ein Viertel des Druckverlusts.\nNur den Druckverlust zu vergleichen würde hier fälschlich eine Verbesserung der Kenngröße nahelegen. Das Ergebnis des Modells ist keine Zustandsfreigabe oder Austauschentscheidung für einen realen Filter.',
    hint: 'Teile jeden Druckverlust durch das Quadrat seines eigenen Volumenstroms. Vergleiche erst danach.',
    formula: 'R = Δp / V̇²',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-si-zweipunkt-vergleich-v1',
    kind: 'context',
    topicId: 'heizung',
    title: 'Was belegen zwei Referenzpunkte?',
    context:
      'Ein vorbereiteter Temperaturkanal zeigt im stabilen Referenzbad bei 0,0 °C genau 2,0 °C und bei 50,0 °C genau 52,0 °C. Beide Referenzwerte und das vollständige Angleichen gelten im Modell als bestätigt. Andere Temperaturen wurden nicht geprüft. Es gibt keine dokumentierten Grenzwerte oder Angaben zur realen Bauart des Kanals.',
    question: 'Welche Aussage bleibt innerhalb der tatsächlich vorliegenden Befunde?',
    options: [
      'An den zwei geprüften Punkten beträgt die Abweichung jeweils +2,0 K; der gesamte Messbereich und ein einzelnes defektes Bauteil sind damit nicht nachgewiesen',
      'Der Kanal wurde damit für jede beliebige Temperatur vollständig geprüft',
      'Der Sensor als einzelnes Bauteil ist zweifelsfrei defekt, Leitung und Auswertung sind ausgeschlossen',
      'Die Abweichung ist nach einer hier genannten Norm sicher zulässig',
    ],
    correctIndex: 0,
    explanation:
      'An beiden Referenzpunkten ist Anzeige minus Referenz gleich +2,0 K. Das ist mit einem positiven Offset an diesen Punkten vereinbar. Zwei Punkte belegen jedoch nicht das Verhalten bei allen dazwischenliegenden oder außerhalb liegenden Temperaturen. Die Prüfung betrifft die Messkette; sie trennt Sensor, Leitung und Auswertung nicht. Eine zulässige Toleranz ist nicht vorgegeben. Es wird deshalb weder eine normative Freigabe noch eine bestimmte Reparatur bewertet.',
    hint: 'Trenne die Beobachtung an zwei geprüften Punkten von einer Behauptung über den ganzen Messbereich.',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-si-zaehler-messgroesse-v1',
    kind: 'knowledge',
    topicId: 'klima',
    title: 'Welche Größe erfasst ein Energiezähler?',
    context:
      'Auf einem vereinfachten Prüfblatt stehen ein Energiezähler in Wh und eine Leistungsanzeige in W. Der Zeitraum für eine Auswertung wird gesondert notiert. Gefragt ist die Bedeutung dieser Einheiten, nicht die Funktion oder Verdrahtung eines realen Geräts.',
    question: 'Welche Zuordnung ist richtig?',
    options: [
      'Wh beschreibt Leistung und W beschreibt Energie',
      'Beide Einheiten beschreiben allein eine Temperaturdifferenz',
      'Wh beschreibt Energie; W beschreibt Energie pro Zeit',
      'Wh und W sind ohne Zeitbezug stets identische Angaben',
    ],
    correctIndex: 2,
    explanation:
      'Watt ist eine Leistung, also Energie pro Zeit: 1 W = 1 J/s. Wattstunden beschreiben eine Energie: 1 Wh = 3 600 J. Ein Energieunterschied über einen bekannten Zeitraum erlaubt eine mittlere Leistungsberechnung. Ohne den Zeitbezug darf eine Zählerdifferenz in Wh nicht einfach als gleich große Zahl in W bezeichnet werden.',
    hint: 'Überlege, ob die Zeit in der Einheit bereits als Faktor enthalten ist oder ob eine Größe pro Zeit gemeint ist.',
    estimatedMinutes: 2,
    level: 'Grundlagen',
    sourceLabel,
  },
  {
    id: 'exam-wiso-engpassstunde-v1',
    kind: 'calculation',
    topicId: 'wiso',
    title: 'Den Engpass statt den Einzelauftrag vergleichen',
    context:
      'Für einen verfügbaren Sechs-Stunden-Block können beliebig viele gleichartige Modellaufträge A oder B angenommen werden. A benötigt je 3 h und erzielt je 180 € Deckungsbeitrag. B benötigt je 2 h und erzielt je 150 € Deckungsbeitrag. Es gelten nur ganze Aufträge; Nachfrage ist ausreichend. Andere Ressourcen und Kosten unterscheiden sich nicht. Der Deckungsbeitrag wird hier als Nettoerlös minus variable Kosten vorgegeben.',
    question: 'Welche Belegung erzielt in den sechs Stunden den höchsten gesamten Deckungsbeitrag?',
    options: [
      'Zwei Aufträge A mit insgesamt 360 €',
      'Drei Aufträge B mit insgesamt 450 €',
      'Ein Auftrag A und ein Auftrag B mit insgesamt 330 €',
      'Ein Auftrag A mit 180 €, weil sein Einzelbeitrag am höchsten ist',
    ],
    correctIndex: 1,
    explanation:
      '1. A erzielt 180 € / 3 h = 60 €/h; B erzielt 150 € / 2 h = 75 €/h.\n2. In 6 h passen zwei A mit 360 € oder drei B mit 450 €. Eine Mischung aus einem A und einem B nutzt 5 h und bringt 330 €; ein weiterer ganzer Auftrag passt nicht.\n3. Drei B sind im Modell optimal. Ein höherer Einzelbeitrag genügt nicht, wenn Arbeitszeit der Engpass ist. Unveränderte Fixkosten sind damit noch nicht abgezogen; 450 € sind kein vollständiger Gewinn.',
    hint: 'Beziehe den Beitrag auf die knappe Arbeitszeit und prüfe anschließend die ganzzahlige Belegung des verfügbaren Blocks.',
    formula: 'Relativer Deckungsbeitrag = DB / Engpasszeit',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-wiso-restzahlung-v1',
    kind: 'calculation',
    topicId: 'wiso',
    title: 'Restbetrag eines Modellauftrags',
    context:
      'Für einen rein fiktiven Auftrag ist ein Gesamtpreis von 1 800 € netto vereinbart. Der Kunde hat bereits 30 % dieses Preises bezahlt. Laut ausdrücklicher Aufgabenregel ist die Anzahlung vollständig auf diesen Gesamtpreis anzurechnen. Zusatzleistungen, Steuern und weitere Zahlungen entfallen. Es geht nur um die Restbetragsrechnung, nicht um Rechnungsrecht.',
    question: 'Welcher Betrag bleibt nach Anrechnung der Anzahlung noch offen?',
    options: ['540 €', '1 800 €', '2 340 €', '1 260 €'],
    correctIndex: 3,
    explanation:
      '1. Anzahlung: 1 800 € × 0,30 = 540 €.\n2. Restbetrag: 1 800 € − 540 € = 1 260 €.\nKontrolle: 540 € + 1 260 € = 1 800 €. Die Anzahlung ist laut Aufgabenregel ein Teil desselben Gesamtpreises, kein zusätzlicher Auftragsbetrag. Steuerliche oder rechtliche Anforderungen an echte Anzahlungs- und Schlussrechnungen werden nicht bewertet.',
    hint: 'Stelle bereits bezahlt plus noch offen gleich dem vereinbarten Gesamtpreis.',
    formula: 'Rest = Gesamtpreis · (1 − Anzahlungsanteil)',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-wiso-opportunitaet-begriff-v1',
    kind: 'knowledge',
    topicId: 'wiso',
    title: 'Worauf verzichtet der Betrieb bei einer Entscheidung?',
    context:
      'Ein vereinfachtes Betriebsmodell nennt Opportunitätskosten den entgangenen Nutzen der besten nicht gewählten Alternative. Ein Betrieb kann einen Termin entweder für Auftrag A oder Auftrag B nutzen; beide gleichzeitig sind ausgeschlossen. Bereits bezahlte, nicht rückholbare Ausgaben bleiben bei beiden Alternativen unverändert.',
    question: 'Welche Größe entspricht bei der Wahl von A der ausdrücklich gegebenen Definition?',
    options: [
      'Der entgangene Nutzen von B als bester nicht gewählter Alternative',
      'Jede bereits bezahlte Ausgabe, unabhängig von der Entscheidung',
      'Die Summe der Umsätze von A und B, obwohl nur ein Auftrag möglich ist',
      'Ausschließlich die Steuer auf den gewählten Auftrag',
    ],
    correctIndex: 0,
    explanation:
      'Mit der Entscheidung für A wird auf den Nutzen von B verzichtet. Dieser entgangene Nutzen entspricht hier der Definition der Opportunitätskosten. Bereits bezahlte, nicht rückholbare und bei beiden Möglichkeiten unveränderte Beträge sind keine erst durch diese Entscheidung entstehende Differenz. Die Aufgabe liefert ihre Begriffsdefinition selbst und trifft keine steuerliche oder rechtliche Aussage.',
    hint: 'Suche den Nutzen, der wegen der aktuellen Wahl nicht mehr realisiert werden kann.',
    estimatedMinutes: 2,
    level: 'Grundlagen',
    sourceLabel,
  },
  {
    id: 'exam-wiso-gewichtete-auswahl-v1',
    kind: 'calculation',
    topicId: 'wiso',
    title: 'Eine Auswahlmatrix richtig gewichten',
    context:
      'Zwei fiktive Lieferanten erfüllen dieselben technischen Muss-Kriterien. Für die weitere Auswahl gilt ausdrücklich: Preisbewertung 60 %, Terminbewertung 40 %. Mehr Bewertungspunkte sind besser. A erhält 90 Punkte für den Preis und 40 Punkte für den Termin. B erhält 60 Punkte für den Preis und 90 Punkte für den Termin. Die Punkte sind bereits vergleichbar; weitere Kriterien und Mindestpunktzahlen gibt es nicht.',
    question:
      'Welcher Lieferant hat nach der vereinbarten gewichteten Summe den höheren Gesamtwert?',
    options: [
      'A mit 78 Punkten',
      'Beide mit jeweils 75 Punkten',
      'B mit 72 Punkten gegenüber 70 Punkten für A',
      'B mit 150 Punkten gegenüber 130 Punkten für A',
    ],
    correctIndex: 2,
    explanation:
      '1. A: 90 × 0,60 + 40 × 0,40 = 54 + 16 = 70 Punkte.\n2. B: 60 × 0,60 + 90 × 0,40 = 36 + 36 = 72 Punkte.\n3. B erzielt 2 Punkte mehr. Die ungewichteten Summen 130 und 150 ignorieren die vereinbarte Bewertung. Andere Gewichte könnten zu einer anderen Auswahl führen; die Aufgabe erklärt diese Gewichte nicht zu einer allgemein besten Beschaffungsregel.',
    hint: 'Multipliziere jeden Teilwert mit seinem zugehörigen Gewicht. Die beiden Gewichte müssen zusammen eins ergeben.',
    formula: 'Gesamtwert = Preisbewertung · 0,60 + Terminbewertung · 0,40',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
];
