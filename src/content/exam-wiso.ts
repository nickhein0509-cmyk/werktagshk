import type { Exercise } from '../data';

// Eigene Aufgaben, Inhaltsversion 1. Modell- und Rechenprüfung:
// docs/exam-wiso-review.md. Keine Originalprüfung oder Prüfungsvorhersage.
const sourceLabel = 'Eigene Übungsaufgabe · WiSo · Teil2-Bezug';

export const wisoExercises: Exercise[] = [
  {
    id: 'exam-wiso-auftragsvergleich',
    topicId: 'wiso',
    title: 'Welcher Auftrag nutzt den freien Termin besser?',
    context:
      'Für einen freien Termin stehen zwei vereinfachte Aufträge zur Wahl. Beide benötigen dieselben vier Arbeitsstunden und können nicht beide angenommen werden. Auftrag A bringt 620 € Nettoerlös bei 410 € variablen Kosten. Auftrag B bringt 730 € Nettoerlös bei 480 € variablen Kosten. Die Fixkosten bleiben bei beiden Alternativen unverändert; weitere Unterschiede gibt es im Modell nicht.',
    question:
      'Welche Entscheidung erzielt in diesem Modell den höheren Beitrag zur Deckung der unveränderten Fixkosten?',
    options: [
      'Auftrag A, weil seine variablen Kosten um 70 € niedriger sind.',
      'Auftrag B, weil sein Deckungsbeitrag um 110 € höher ist.',
      'Auftrag B, weil sein Deckungsbeitrag um 40 € höher ist.',
      'Beide Aufträge sind gleichwertig, weil sie dieselbe Arbeitszeit benötigen.',
    ],
    correctIndex: 2,
    explanation:
      '1. Für A: 620 € − 410 € = 210 € Deckungsbeitrag.\n2. Für B: 730 € − 480 € = 250 € Deckungsbeitrag.\n3. Unterschied: 250 € − 210 € = 40 € zugunsten von B.\nDa Zeitbedarf und unveränderte Fixkosten gleich sind, verbessert B das Betriebsergebnis im vorgegebenen Modell um 40 € gegenüber A. Die zusätzlichen 110 € Erlös sind nicht vollständig zusätzlicher Deckungsbeitrag, weil B auch 70 € mehr variable Kosten verursacht. Ein vollständiger Auftragsgewinn ist damit nicht berechnet.',
    hint: 'Vergleiche bei beiden Aufträgen dieselbe wirtschaftliche Größe und berücksichtige jeweils Erlös und variable Kosten.',
    formula: 'Deckungsbeitrag = Nettoerlös − variable Kosten',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-wiso-zuschlag-marge',
    topicId: 'wiso',
    title: 'Zuschlag und Umsatzmarge auseinanderhalten',
    context:
      'Für einen Modellauftrag sind sämtliche Kosten mit 240 € vorgegeben. Er wird für 300 € netto verkauft. Weitere Kosten, Steuern und Preisnachlässe bleiben außer Betracht. Für diese Aufgabe bedeutet Kostenaufschlag: Überschuss geteilt durch Kosten. Umsatzmarge bedeutet: Überschuss geteilt durch Nettoerlös.',
    question: 'Welche beiden Prozentsätze beschreiben diesen Auftrag richtig?',
    options: [
      '20 % Kostenaufschlag und 25 % Umsatzmarge',
      '25 % Kostenaufschlag und 20 % Umsatzmarge',
      '25 % Kostenaufschlag und 25 % Umsatzmarge',
      '20 % Kostenaufschlag und 20 % Umsatzmarge',
    ],
    correctIndex: 1,
    explanation:
      '1. Überschuss: 300 € − 240 € = 60 €.\n2. Kostenaufschlag: 60 € / 240 € × 100 = 25 %.\n3. Umsatzmarge: 60 € / 300 € × 100 = 20 %.\nDer Zähler ist gleich, die Bezugsgröße ist verschieden. Deshalb sind 25 % Zuschlag auf die Kosten nicht gleichbedeutend mit 25 % Marge vom Verkaufserlös. Die Aussage gilt für die in der Aufgabe ausdrücklich definierten Größen.',
    hint: 'Markiere für jeden der beiden Begriffe zuerst die zugehörige Bezugsgröße. Prüfe dann Zähler und Nenner getrennt.',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-wiso-lieferantenvergleich',
    topicId: 'wiso',
    title: 'Zwei Materialangebote fair vergleichen',
    context:
      'Zwei Lieferanten bieten identisches Material bei gleicher Lieferzeit und Qualität an. A berechnet 1.500 € netto und gewährt im Modell 3 % Skonto auf diesen gesamten Warenbetrag, wenn fristgerecht bezahlt wird. Zusätzlich fallen bei A 12 € feste Versandkosten an, auf die kein Skonto gewährt wird. B verlangt 1.460 € netto einschließlich Versand, ohne Skonto. Fristgerechte Zahlung ist bei beiden möglich. Steuern und Finanzierungskosten werden nicht betrachtet.',
    question: 'Welches Angebot verursacht unter diesen Annahmen die niedrigeren Gesamtkosten?',
    options: [
      'A ist um 5 € günstiger.',
      'A ist um 45 € günstiger.',
      'B ist um 40 € günstiger.',
      'B ist um 7 € günstiger.',
    ],
    correctIndex: 3,
    explanation:
      '1. Skonto bei A: 1.500 € × 0,03 = 45 €.\n2. Warenbetrag nach Skonto: 1.500 € − 45 € = 1.455 €.\n3. Mit Versand: 1.455 € + 12 € = 1.467 €.\n4. B kostet insgesamt 1.460 € und damit 1.467 € − 1.460 € = 7 € weniger.\nNur die angegebenen Positionen und Konditionen sind verglichen. Der größte Preisnachlass allein bestimmt nicht das wirtschaftlich günstigere Gesamtangebot.',
    hint: 'Ermittle für beide Angebote einen vergleichbaren Gesamtbetrag. Achte darauf, für welche Positionen der Nachlass gilt.',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-wiso-lohnmodell',
    topicId: 'wiso',
    title: 'Eine vereinfachte Abrechnung nachvollziehen',
    context:
      'In einer rein fiktiven Abrechnung werden 160 Stunden mit jeweils 18 € vergütet. Hinzu kommt eine Zulage von 90 €. Beide Beträge bilden zusammen das Modellbrutto. Davon werden pauschal 24 % sowie anschließend ein fester Betrag von 15 € abgezogen. Diese frei gesetzten Abzüge sind nur Rechenannahmen und bilden keine tatsächliche Lohnsteuer, Sozialversicherung oder tarifliche Regelung ab.',
    question:
      'Welcher Auszahlungsbetrag ergibt sich nach den ausdrücklich vorgegebenen Modellregeln?',
    options: ['2.242,20 €', '2.257,20 €', '2.263,80 €', '2.970,00 €'],
    correctIndex: 0,
    explanation:
      '1. Stundenvergütung: 160 × 18 € = 2.880 €.\n2. Modellbrutto einschließlich Zulage: 2.880 € + 90 € = 2.970 €.\n3. Prozentualer Modellabzug: 2.970 € × 0,24 = 712,80 €.\n4. Auszahlung: 2.970 € − 712,80 € − 15 € = 2.242,20 €.\nOhne den festen Abzug ergäben sich 2.257,20 €. Die Zulage ist laut Aufgabenregel ebenfalls Teil der prozentualen Abzugsbasis. Das Ergebnis lässt sich nicht auf eine echte Lohnabrechnung übertragen.',
    hint: 'Stelle zunächst die Abrechnungsbasis nach den Aufgabenregeln zusammen. Halte prozentuale und feste Abzüge im Rechenweg getrennt.',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-wiso-liquiditaetsverlauf',
    topicId: 'wiso',
    title: 'Zahlungstermine verändern den Geldbedarf',
    context:
      'Ein Modellbetrieb hat am Donnerstagmorgen 900 € sofort verfügbare Zahlungsmittel. Am Donnerstag muss eine Materialrechnung über 1.700 € vollständig bezahlt werden. Ein sicher angenommener Kundeneingang über 1.400 € erfolgt erst am Freitag. Weitere Ein- und Auszahlungen gibt es nicht. Die Materialzahlung lässt sich im Modell nicht verschieben; ein Kredit ist noch nicht vorhanden.',
    question:
      'Wie hoch ist der zusätzliche Finanzierungsbedarf am Donnerstag vor dem Kundeneingang?',
    options: ['0 €', '300 €', '600 €', '800 €'],
    correctIndex: 3,
    explanation:
      '1. Am Donnerstag stehen 900 € zur Verfügung, benötigt werden 1.700 €.\n2. Fehlbetrag: 1.700 € − 900 € = 800 €. Dieser Betrag muss für den Donnerstag zusätzlich verfügbar werden.\n3. Der Kundeneingang am Freitag kommt für diese Zahlung zu spät. Über beide Tage ergibt die rechnerische Summe 900 € − 1.700 € + 1.400 € = 600 €; sie verdeckt aber den zwischenzeitlichen Engpass.\nDie Rechnung beschreibt einen Liquiditätsbedarf, weder einen festgestellten Verlust noch eine Empfehlung für ein bestimmtes Finanzierungsprodukt.',
    hint: 'Ordne die Zahlungen zuerst zeitlich. Berücksichtige für den gesuchten Zeitpunkt nur die bis dahin tatsächlich verfügbaren Beträge.',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-wiso-nachkalkulation',
    topicId: 'wiso',
    title: 'Mehr Umsatz, trotzdem weniger Deckungsbeitrag?',
    context:
      'Für einen Modellauftrag waren 1.000 € Nettoerlös und 600 € variable Kosten geplant. Tatsächlich entstehen 1.100 € Nettoerlös und 780 € variable Kosten. Fixkosten bleiben unverändert; weitere Abweichungen gibt es nicht. Verglichen wird nur der Deckungsbeitrag als Nettoerlös minus variable Kosten.',
    question: 'Welche Aussage erklärt das Ergebnis der Nachkalkulation richtig?',
    options: [
      'Der Deckungsbeitrag sinkt um 80 €, weil die variablen Kosten stärker steigen als der Nettoerlös.',
      'Der Deckungsbeitrag steigt um 100 €, weil allein der zusätzliche Nettoerlös zählt.',
      'Der Deckungsbeitrag sinkt um 180 €, weil allein die zusätzlichen variablen Kosten zählen.',
      'Der Deckungsbeitrag bleibt gleich, weil sich Erlös- und Kostenänderung ausgleichen.',
    ],
    correctIndex: 0,
    explanation:
      '1. Geplant: 1.000 € − 600 € = 400 € Deckungsbeitrag.\n2. Tatsächlich: 1.100 € − 780 € = 320 € Deckungsbeitrag.\n3. Veränderung: 320 € − 400 € = −80 €.\nAlternativ: Der Erlös steigt um 100 €, die variablen Kosten aber um 180 €. Der Unterschied beträgt 100 € − 180 € = −80 €. Mehr Umsatz bedeutet deshalb im vorgegebenen Modell keinen höheren Deckungsbeitrag. Für den absoluten Gewinn fehlen die Fixkostenbeträge.',
    hint: 'Vergleiche zuerst den geplanten und den tatsächlichen Deckungsbeitrag. Prüfe anschließend, ob die Veränderungen den Unterschied erklären.',
    formula: 'ΔDB = ΔNettoerlös − Δvariable Kosten',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-wiso-aenderungsauftrag',
    topicId: 'wiso',
    title: 'Ein zusätzlicher Kundenwunsch im Modellauftrag',
    context:
      'Für einen fiktiven Modellauftrag gilt ausdrücklich folgende Projektregel: Zusätzliche Leistungen werden erst ausgeführt, nachdem Umfang, Preis und Terminfolgen in einem Änderungsblatt beschrieben und von der benannten Projektleitung schriftlich freigegeben wurden. Ein Kunde bittet auf der Baustelle mündlich um eine weitere Armatur. Sie ist nicht im bisherigen Umfang enthalten. Die Projektleitung hat noch nichts freigegeben. Es geht ausschließlich um die Anwendung dieser Aufgabenregel, nicht um eine rechtliche Bewertung realer Verträge.',
    question: 'Welches Vorgehen entspricht der vorgegebenen Projektregel?',
    options: [
      'Die Armatur sofort einbauen und das Änderungsblatt zusammen mit der Schlussrechnung erstellen.',
      'Die Zusatzleistung mit Preis und Terminfolgen im Änderungsblatt erfassen und vor ihrer Ausführung die Freigabe der Projektleitung einholen.',
      'Den Kundenwunsch als ausreichende Freigabe behandeln, weil der Einbau auf derselben Baustelle erfolgt.',
      'Nur die Materialbestellung schriftlich bestätigen lassen und die Arbeitszeit später ergänzen.',
    ],
    correctIndex: 1,
    explanation:
      'Die Aufgabenregel nennt drei Inhalte des Änderungsblatts: Umfang, Preis und Terminfolgen. Zusätzlich verlangt sie die schriftliche Freigabe durch die benannte Projektleitung vor der Ausführung. Die mündliche Bitte des Kunden ersetzt diese Freigabe innerhalb des Modells nicht. Nachträgliche Dokumentation oder eine reine Materialfreigabe lassen Teile der Regel unerfüllt. Welche Rechte und Pflichten bei einem realen Vertrag bestehen, muss anhand des konkreten Vertrags und der zutreffenden Rechtsgrundlagen beurteilt werden; das wird hier nicht geprüft.',
    hint: 'Lies die Regel als Prüfliste: benötigte Angaben, zuständige Stelle und zeitliche Reihenfolge.',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'exam-wiso-angebotsabgleich',
    topicId: 'wiso',
    title: 'Kundenrückmeldung und Angebot abgleichen',
    context:
      'Ein fiktiver Betrieb verwendet in dieser Aufgabe folgende interne Planungsregel: Ein Angebot wird erst als bestätigter Auftrag eingeplant, wenn der Kunde Angebotsnummer, Leistungsumfang, Preis und Termin schriftlich unverändert bestätigt hat. Abweichungen werden zunächst geklärt und in einem überarbeiteten Angebot festgehalten. Der Kunde schreibt zu Angebot A-17: „Preis und Termin passen. Bitte statt der angebotenen Armatur Modell B einbauen.“ Die Änderung ist noch nicht technisch oder kalkulatorisch geprüft. Die Regel beschreibt nur den Modellablauf und keine Aussage über einen rechtlichen Vertragsschluss.',
    question: 'Wie wird diese Rückmeldung nach der Modellregel weiterbearbeitet?',
    options: [
      'A-17 unverändert als bestätigten Auftrag einplanen, weil Preis und Termin ausdrücklich akzeptiert wurden.',
      'Modell B direkt bestellen und die Angebotsänderung erst nach der Lieferung prüfen.',
      'Die geänderte Armatur technisch und kalkulatorisch prüfen, das Angebot anpassen und die vorgesehene schriftliche Bestätigung einholen.',
      'Nur die Angebotsnummer austauschen und die bisherige Rückmeldung als unveränderte Bestätigung übernehmen.',
    ],
    correctIndex: 2,
    explanation:
      'Die Rückmeldung bestätigt nicht den unveränderten Leistungsumfang: Ein anderes Armaturenmodell wird verlangt. Nach der ausdrücklich vorgegebenen internen Regel ist dies zuerst ein Klärungsfall. Die Änderung wird geprüft und in einem angepassten Angebot festgehalten; anschließend wird dessen Bestätigung eingeholt. Zustimmung zu Preis und Termin allein erfüllt die Modellregel nicht. Eine andere Angebotsnummer löst die inhaltliche Abweichung nicht. Ob und wann rechtlich ein Vertrag zustande kommt, ist nicht Gegenstand dieser Aufgabe.',
    hint: 'Gleiche die vier geforderten Angaben mit der Nachricht ab. Prüfe, ob die Nachricht den bisherigen Umfang bestätigt oder verändert.',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
];
