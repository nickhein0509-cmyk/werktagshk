import type { Exercise } from '../data';

/** Editorial task demand, independent of a learner's history or measured success. */
export type DifficultyLevel = 1 | 2 | 3 | 4;

export interface DifficultyAssessment {
  level: DifficultyLevel;
  reason: string;
  source: 'editorial';
}

export const difficultyLevels: {
  id: DifficultyLevel;
  label: string;
  description: string;
}[] = [
  {
    id: 1,
    label: 'Einstieg',
    description: 'Einen Begriff erkennen oder eine unmittelbar passende Grundbeziehung anwenden.',
  },
  {
    id: 2,
    label: 'Anwenden',
    description:
      'Mehrere bekannte Rechenschritte oder eine vorgegebene Regel auf einen Fall anwenden.',
  },
  {
    id: 3,
    label: 'Transfer',
    description:
      'Eine Methode auswählen, Angaben auf Vergleichbarkeit prüfen oder eine Schlussfolgerung begrenzen.',
  },
  {
    id: 4,
    label: 'Vernetzt',
    description:
      'Mehrere abhängige Bedingungen, Alternativen oder Teilergebnisse zu einer Gesamtlösung verbinden.',
  },
];

type AssessmentInput = readonly [DifficultyLevel, string];
const assessed = (level: DifficultyLevel, reason: string): DifficultyAssessment => ({
  level,
  reason,
  source: 'editorial',
});

// These families differ only in their supplied numbers. The cognitive demand was
// read from each family, not inferred from the ID's spelling at runtime.
const numericFamilies: Record<string, AssessmentInput> = {
  'heizung-heizzeit': [
    2,
    'Eine Energie-Leistungs-Beziehung anwenden und die Zeiteinheit umrechnen.',
  ],
  'heizung-nutzwaerme': [1, 'Einen vorgegebenen Anteil direkt auf eine Energiemenge anwenden.'],
  'heizung-energieeinsatz': [2, 'Eine bekannte Prozentbeziehung in umgekehrter Richtung anwenden.'],
  'heizung-spreizung': [2, 'Eine bekannte Leistungsbeziehung nach der gesuchten Größe umstellen.'],
  'heizung-waermeleistung': [
    1,
    'Gegebene Werte mit passenden Einheiten direkt in eine Grundbeziehung einsetzen.',
  ],
  'heizung-ausdehnung': [
    1,
    'Einen vorgegebenen Koeffizienten mit direkt passenden Größen verknüpfen.',
  ],
  'sanitaer-fuellzeit': [
    1,
    'Volumen und konstanten Durchfluss in einer direkten Quotientenrechnung verbinden.',
  ],
  'sanitaer-geschwindigkeit': [
    3,
    'Geometrie, unterschiedliche Volumeneinheiten und eine Strömungsbeziehung verbinden.',
  ],
  'sanitaer-druckhoehe': [
    2,
    'Ein physikalisches Grundmodell anwenden und die Ergebniseinheit umrechnen.',
  ],
  'sanitaer-mischwasser': [3, 'Ungleiche Beiträge in einer Bilanz angemessen gewichten.'],
  'sanitaer-gefaelle-rueckwaerts': [
    2,
    'Längeneinheiten angleichen und eine geometrische Prozentbeziehung rückwärts anwenden.',
  ],
  'sanitaer-verbrauch': [
    2,
    'Einzelvorgang und wiederholte Nutzung in zwei aufeinanderfolgenden Schritten verknüpfen.',
  ],
  'klima-luftbedarf': [1, 'Zwei gegebene Größen direkt zu einem Volumenstrom verknüpfen.'],
  'klima-kanalquerschnitt': [
    2,
    'Geometrische Abmessungen umrechnen und die passende Flächeneinheit beachten.',
  ],
  'klima-kanalstrom': [2, 'Querschnitt und Geschwindigkeit verbinden und den Zeitbezug umrechnen.'],
  'klima-luftwaerme': [
    1,
    'Eine direkte Wärmeleistungsrechnung mit bereits passenden Einheiten ausführen.',
  ],
  'klima-rueckwaermzahl': [
    2,
    'Die ausdrücklich angegebene Beziehung mit Differenz, Prozentfaktor und Ausgangswert auswerten.',
  ],
  'klima-luftenergie': [2, 'Leistung und Laufzeit verbinden und Watt in Kilowatt umrechnen.'],
  'wiso-stundenkosten': [1, 'Einen gegebenen Satz direkt auf eine Arbeitsdauer anwenden.'],
  'wiso-materialzuschlag': [
    2,
    'Bezugsbetrag und Zuschlag in der richtigen Reihenfolge verknüpfen.',
  ],
  'wiso-skonto': [1, 'Einen ausdrücklich gegebenen Preisnachlass auf denselben Betrag anwenden.'],
  'wiso-kostendeckung': [
    2,
    'Eine bekannte Kostenbeziehung nach der benötigten Stückzahl auswerten.',
  ],
  'wiso-preissteigerung': [
    2,
    'Eine Änderung berechnen und auf den passenden Ausgangswert beziehen.',
  ],
  'wiso-energiekosten': [2, 'Energiebedarf und gegebenen Preis in zwei Rechenschritten verbinden.'],
};

const individualTasks: Record<string, AssessmentInput> = {
  'heizung-waermemenge': [
    2,
    'Temperaturhub, Stoffmenge und Energieeinheiten in einer bekannten Bilanz verbinden.',
  ],
  'heizung-volumenstrom': [
    2,
    'Eine Leistungsbeziehung umstellen und zwischen Massen- und Volumenstrom umrechnen.',
  ],
  'heizung-einheiten': [2, 'Volumen- und Zeiteinheit desselben Durchflusses gemeinsam umrechnen.'],
  'sanitaer-rohrinhalt': [
    2,
    'Innendurchmesser, Längeneinheiten und Zylindergeometrie zusammenführen.',
  ],
  'sanitaer-durchfluss': [2, 'Eine Messung auswerten und den Zeitbezug des Ergebnisses ändern.'],
  'sanitaer-gefaelle': [2, 'Prozentanteil, waagerechte Länge und Ergebniseinheit verbinden.'],
  'klima-raumvolumen': [
    1,
    'Drei bereits passend angegebene Raumabmessungen direkt geometrisch verknüpfen.',
  ],
  'klima-luftwechsel': [
    1,
    'Zwei gegebene Größen mit passenden Einheiten unmittelbar ins Verhältnis setzen.',
  ],
  'klima-mischtemperatur': [
    1,
    'Den einfachen Sonderfall gleich großer Beiträge auf einen Mittelwert anwenden.',
  ],
  'wiso-preisrechnung': [
    2,
    'Menge, Rabatt und vorgegebenen Steuersatz in einer festgelegten Rechenkette anwenden.',
  ],
  'wiso-deckungsbeitrag': [
    1,
    'Zwei gegebene Geldbeträge mit der unmittelbar passenden Grundbeziehung verrechnen.',
  ],
  'wiso-prozentrechnung': [
    1,
    'Eine einzelne vorgegebene Erhöhung auf einen Ausgangsbetrag anwenden.',
  ],

  'heizung-energie-leistung-v1': [
    1,
    'Die Bedeutung einer grundlegenden physikalischen Größe erkennen.',
  ],
  'heizung-spreizung-begriff-v1': [1, 'Einen bekannten Fachbegriff unmittelbar zuordnen.'],
  'heizung-doppelte-masse-v1': [
    1,
    'Eine direkte Proportionalität bei sonst unveränderten Größen erkennen.',
  ],
  'heizung-verlustbilanz-v1': [
    2,
    'Eine zusätzliche Einflussgröße bei unverändertem Nutzbedarf in eine Bilanz einordnen.',
  ],
  'heizung-volumenstrom-trend-v1': [
    2,
    'Eine umgekehrt proportionale Beziehung bei festen Randbedingungen beurteilen.',
  ],
  'heizung-temperatur-waerme-v1': [
    2,
    'Die Aussage einer einzelnen Zustandsgröße von einer Energiemenge unterscheiden.',
  ],
  'sanitaer-innendurchmesser-v1': [
    1,
    'Die geometrisch passende Größe für eine bekannte Grundrechnung erkennen.',
  ],
  'sanitaer-durchmesser-quadrat-v1': [
    2,
    'Die Wirkung einer quadratisch eingehenden Größe qualitativ beurteilen.',
  ],
  'sanitaer-mittelwert-v1': [
    1,
    'Das Ergebnis einer einfachen Messquotientenbildung begrifflich einordnen.',
  ],
  'sanitaer-druck-ruhe-v1': [
    1,
    'Eine grundlegende Einflussgröße im ausdrücklich genannten Ruhemodell erkennen.',
  ],
  'sanitaer-gefaelle-bezug-v1': [
    1,
    'Die Bezugsgröße einer bekannten geometrischen Definition erkennen.',
  ],
  'sanitaer-mischen-grenze-v1': [
    1,
    'Eine grundlegende Plausibilitätsgrenze eines gegebenen Mischmodells erkennen.',
  ],
  'klima-luftwechsel-begriff-v1': [
    2,
    'Einen Kennwert von einer darüber hinausgehenden Wirkungsaussage unterscheiden.',
  ],
  'klima-querschnitt-trend-v1': [
    2,
    'Eine umgekehrt proportionale Strömungsbeziehung qualitativ anwenden.',
  ],
  'klima-luftbilanz-v1': [
    2,
    'Die Bilanzgröße und die für einen Volumenvergleich nötige Zusatzbedingung unterscheiden.',
  ],
  'klima-massenstrom-gewicht-v1': [
    2,
    'Die passende Gewichtungsgröße aus einem bekannten Bilanzmodell auswählen.',
  ],
  'klima-volumen-einheit-v1': [1, 'Die Einheit einer Grundgröße unmittelbar zuordnen.'],
  'klima-trocken-modell-v1': [
    2,
    'Die Grenze eines vorgegebenen Modells bei veränderten Bedingungen erkennen.',
  ],
  'wiso-umsatz-gewinn-v1': [1, 'Zwei grundlegende betriebliche Begriffe unterscheiden.'],
  'wiso-db-fixkosten-v1': [
    1,
    'Die unmittelbare Bedeutung einer betriebswirtschaftlichen Grundgröße erkennen.',
  ],
  'wiso-rabatt-folge-v1': [
    2,
    'Die wechselnde Bezugsbasis zweier aufeinanderfolgender Prozentsätze beachten.',
  ],
  'wiso-netto-brutto-v1': [
    2,
    'Eine Prozentbeziehung mit veränderter Bezugsbasis rückwärts anwenden.',
  ],
  'wiso-fixkosten-begriff-v1': [
    1,
    'Einen wirtschaftlichen Grundbegriff innerhalb seiner genannten Geltungsgrenze erkennen.',
  ],
  'wiso-zeit-dezimal-v1': [1, 'Eine grundlegende Einheitenregel unmittelbar zuordnen.'],

  'exam-ap-rohrzuschnitt-v1': [
    2,
    'Eine Maßangabe und zwei gleichartige Zuschläge nach der gegebenen Zeichnungsregel verbinden.',
  ],
  'exam-ap-bestellmenge-v1': [
    3,
    'Rechnerischen Bedarf, ganze Liefermengen und mögliche Stückverteilung zusammen prüfen.',
  ],
  'exam-ap-hoehenplanung-v1': [
    2,
    'Gefälle und gerichtete Höhenlage in einer bekannten Rechenkette verbinden.',
  ],
  'exam-ap-heizflaechenwahl-v1': [
    2,
    'Einen Zuschlag berechnen und anschließend aus diskreten Katalogwerten auswählen.',
  ],
  'exam-ap-luefter-arbeitspunkt-v1': [
    3,
    'Mehrere Bedarfe und zwei zusammengehörige Betriebsgrößen in einer Auswahltabelle bewerten.',
  ],
  'exam-ap-angebotsvergleich-v1': [
    3,
    'Unterschiedlich aufgebaute Kostenangaben auf eine gemeinsame Vergleichsgröße bringen.',
  ],
  'exam-ap-ablaufabhaengigkeiten-v1': [
    2,
    'Mehrere ausdrücklich vorgegebene Abhängigkeiten in eine Arbeitsfolge übertragen.',
  ],
  'exam-ap-anschlussklaerung-v1': [
    2,
    'Einen Fall nach einer klar benannten Anforderung auf fehlende Unterlagen prüfen.',
  ],
  'exam-ap-revisionszugang-v1': [
    2,
    'Zwei Planungsvarianten anhand einer ausdrücklich gegebenen Muss-Vorgabe vergleichen.',
  ],
  'exam-ap-pruefplan-v1': [
    2,
    'Vorgegebene Einzelkriterien und den dokumentierten Bearbeitungsstand getrennt prüfen.',
  ],
  'exam-ap-variantenmatrix-v1': [
    3,
    'Mehrere Muss-Kriterien anwenden und unter den verbleibenden Alternativen entscheiden.',
  ],
  'exam-ap-uebergabeunterlagen-v1': [
    2,
    'Mehrere ausdrücklich vereinbarte Leistungen mit dem vorhandenen Nachweis abgleichen.',
  ],
  'exam-si-waermeleistung': [
    3,
    'Messwerte rechnerisch auswerten und die Reichweite des Vergleichs mit einer Planung beurteilen.',
  ],
  'exam-si-sensorkennlinie': [
    2,
    'Eine ausdrücklich vorgegebene lineare Beziehung nach der gesuchten Größe auswerten.',
  ],
  'exam-si-ventilrueckmeldung': [
    3,
    'Anforderung, Rückmeldung und Zeitbedingung zu einem begrenzten Befund zusammenführen.',
  ],
  'exam-si-energiebilanz': [
    3,
    'Eine Verhältniszahl berechnen und ihren Zeit- und Bilanzbezug von weitergehenden Aussagen abgrenzen.',
  ],
  'exam-si-zaehlervergleich': [
    3,
    'Zählerdifferenz, Einheiten und Zeitmittel mit der Reichweite eines Befunds verbinden.',
  ],
  'exam-si-mischprobe': [
    3,
    'Eine gewichtete Bilanz bilden und eine vorliegende Auswertung auf Plausibilität prüfen.',
  ],
  'exam-si-druckverlust': [
    3,
    'Einen Messvergleich auf eine entscheidende unbekannte Randbedingung prüfen.',
  ],
  'exam-si-temperaturvergleich': [
    3,
    'Referenz, Modellgrenze und Reichweite einer Messkettenbeurteilung zusammen auswerten.',
  ],
  'exam-si-luftmessung': [
    3,
    'Strömungsrechnung, Einheiten und Sollvergleich zu einer Befundbewertung verbinden.',
  ],
  'exam-si-filtertrend': [
    3,
    'Eine vorgegebene nichtlineare Beziehung für einen Trendvergleich anwenden und dessen Aussage begrenzen.',
  ],
  'exam-si-luftbilanz': [
    3,
    'Eine unvollständig erfasste Bilanz unter mehreren genannten Randbedingungen beurteilen.',
  ],
  'exam-si-schalthysterese': [
    2,
    'Eine ausdrücklich gegebene Zustandsregel mit bekanntem Vorzustand anwenden.',
  ],
  'exam-wiso-auftragsvergleich': [
    2,
    'Für zwei gleichartig aufgebaute Alternativen denselben Beitrag berechnen und vergleichen.',
  ],
  'exam-wiso-zuschlag-marge': [
    3,
    'Zwei Prozentgrößen mit unterschiedlichen Bezugsbasen aus demselben Fall bestimmen.',
  ],
  'exam-wiso-lieferantenvergleich': [
    3,
    'Unterschiedliche Preisbestandteile und Nachlassbedingungen zu einem Vergleich zusammenführen.',
  ],
  'exam-wiso-lohnmodell': [
    2,
    'Eine vollständig vorgegebene Folge von Beträgen und Abzügen rechnerisch anwenden.',
  ],
  'exam-wiso-liquiditaetsverlauf': [
    2,
    'Eine einfache Zahlungsfolge zum ausdrücklich gefragten Zeitpunkt auswerten.',
  ],
  'exam-wiso-nachkalkulation': [
    3,
    'Plan und Ist mit zwei veränderten Größen rechnerisch vergleichen und die Aussage einordnen.',
  ],
  'exam-wiso-aenderungsauftrag': [
    2,
    'Eine vollständig vorgegebene mehrteilige Projektregel auf einen Änderungswunsch anwenden.',
  ],
  'exam-wiso-angebotsabgleich': [
    2,
    'Eine Rückmeldung auf Abweichungen von einer ausdrücklich vorgegebenen Bestätigungsregel prüfen.',
  ],
  'exam-wiso-law-ausbildungsmittel': [
    2,
    'Eine eng begrenzte bekannte Rechtsregel auf den eindeutig beschriebenen Fall anwenden.',
  ],
  'exam-wiso-law-berufsschulteilnahme': [
    2,
    'Eine eng begrenzte Teilnahmeregel auf einen konkreten Planungskonflikt anwenden.',
  ],
  'exam-wiso-law-tarifvertragsparteien': [
    1,
    'Die grundlegenden Rollen eines vorgegebenen Rechtsgebiets zuordnen.',
  ],
  'exam-wiso-law-rentenversicherung': [
    2,
    'Eine bekannte Regel auf einen ausdrücklich begrenzten Ausbildungsfall anwenden.',
  ],
  'exam-ap-speicher-mit-entnahme-v1': [
    3,
    'Energieänderung und gleichzeitige Leistungen in einer Bilanz für die Zeitrechnung verbinden.',
  ],
  'exam-ap-zuschnitt-schnittfuge-v1': [
    4,
    'Stückverteilung, vorgegebene Verluste und eine minimale ganzzahlige Bestellung gemeinsam begründen.',
  ],
  'exam-ap-planfreigabe-v1': [
    3,
    'Widersprüchliche Unterlagen mit unterschiedlichem Status unter einer Projektregel bewerten.',
  ],
  'exam-ap-druckdifferenz-begriff-v1': [
    1,
    'Die passende Grundoperation und ihre Einheit unmittelbar zuordnen.',
  ],
  'exam-si-energieprotokoll-v1': [
    3,
    'Differenz, Messdauer, mittlere Leistung und Referenzanteil in einer Auswertung verbinden.',
  ],
  'exam-si-widerstand-normieren-v1': [
    3,
    'Zwei verschiedene Betriebspunkte anhand einer ausdrücklich gegebenen nichtlinearen Beziehung vergleichen.',
  ],
  'exam-si-zweipunkt-vergleich-v1': [
    3,
    'Mehrere Referenzbefunde auswerten und die Reichweite der Schlussfolgerung abgrenzen.',
  ],
  'exam-si-zaehler-messgroesse-v1': [
    1,
    'Grundgrößen anhand ihrer Einheiten unmittelbar unterscheiden.',
  ],
  'exam-wiso-engpassstunde-v1': [
    4,
    'Beitrag, knappe Zeit und ganzzahlige Belegungsalternativen zu einer Gesamtauswahl verbinden.',
  ],
  'exam-wiso-restzahlung-v1': [
    2,
    'Einen prozentualen Zahlungsteil bestimmen und auf denselben Gesamtbetrag anrechnen.',
  ],
  'exam-wiso-opportunitaet-begriff-v1': [
    2,
    'Eine im Kontext vorgegebene Begriffsdefinition auf eine konkrete ausschließende Wahl anwenden.',
  ],
  'exam-wiso-gewichtete-auswahl-v1': [
    3,
    'Mehrere Kriterien für zwei Alternativen nach gegebenen Gewichten zusammenführen.',
  ],

  'exam-ap-context-systemkombination-v1': [
    3,
    'Den Geltungsbereich unterschiedlicher Unterlagen auf eine konkrete Zusammenstellung beziehen.',
  ],
  'exam-ap-context-transportfolge-v1': [
    2,
    'Die vorgegebenen Montage- und Transportbedingungen in eine praktikable Arbeitsfolge übertragen.',
  ],
  'exam-ap-context-bezugsniveau-v1': [
    3,
    'Zwei verschiedene Bezugsgrößen für eine eindeutige Planübertragung einordnen.',
  ],
  'exam-ap-context-leistungsdaten-v1': [
    3,
    'Technische Angaben anhand ihrer Betriebsbedingungen auf Vergleichbarkeit prüfen.',
  ],
  'exam-ap-context-messstellenzuordnung-v1': [
    2,
    'Eine ausdrücklich geforderte Zuordnung zwischen vorhandenen Projektunterlagen herstellen.',
  ],
  'exam-ap-context-messbedingung-v1': [
    3,
    'Einen geplanten Vergleich auf mehrere gleichzeitig veränderte Einflussgrößen prüfen.',
  ],
  'exam-ap-context-pruefumfang-v1': [
    3,
    'Historische Nachweise, aktuellen Aufbau und behaupteten Prüfumfang gegeneinander abgrenzen.',
  ],
  'exam-ap-context-automatiknachweis-v1': [
    3,
    'Verschiedene Betriebszustände und die Aussage eines vorhandenen Funktionsnachweises unterscheiden.',
  ],
  'exam-si-context-zeitbasis-v1': [
    3,
    'Getrennte Aufzeichnungen auf eine für die Ereignisbewertung notwendige gemeinsame Grundlage prüfen.',
  ],
  'exam-si-context-gleichzeitig-geaendert-v1': [
    3,
    'Mehrere gleichzeitige Eingriffe und den Umfang der Beobachtung bei einer Ursacheaussage berücksichtigen.',
  ],
  'exam-si-context-druck-temperatur-v1': [
    3,
    'Eine technische Schlussfolgerung bei mehreren nicht vollständig dokumentierten Einflussgrößen bewerten.',
  ],
  'exam-si-context-messort-v1': [
    3,
    'Messbedingungen und mögliche reale Zustandsunterschiede für einen gezielten Vergleich unterscheiden.',
  ],
  'exam-si-context-messgrenze-filter-v1': [
    3,
    'Eine veränderte Messgrenze bei ansonsten ähnlichen Betriebsangaben in die Bewertung einbeziehen.',
  ],
  'exam-si-context-zweigvergleich-v1': [
    3,
    'Die Bedingungen eines behaupteten Systemvergleichs prüfen und eine unterscheidende Untersuchung auswählen.',
  ],
  'exam-si-context-freigabekette-v1': [
    2,
    'Eine vollständig angegebene Verknüpfung von Freigabebedingungen auf einen Protokollzustand anwenden.',
  ],
  'exam-si-context-ereignisnachweis-v1': [
    3,
    'Die Aussage eines Testlaufs auf tatsächlich beobachtete Zustände und vorgegebene Anforderungen beziehen.',
  ],
  'exam-wiso-context-angebotsluecke-v1': [
    2,
    'Zwei Unterlagen nach den ausdrücklich genannten Entscheidungskriterien auf Vollständigkeit prüfen.',
  ],
  'exam-wiso-context-ergebnis-zahlungsfaehigkeit-v1': [
    3,
    'Ergebnisgröße, verfügbare Mittel und unterschiedliche Zeitpunkte in derselben Entscheidung einordnen.',
  ],
  'exam-wiso-context-serviceauswertung-v1': [
    2,
    'Einen klar vorgegebenen Auswertungszweck und eine Betriebsregel auf die Datenauswahl anwenden.',
  ],
  'exam-wiso-context-terminauskunft-v1': [
    3,
    'Bestätigte Hindernisse, offene Ressourcen und eine zulässige Zusage in einer Kommunikation verbinden.',
  ],
  'exam-wiso-context-wareneingang-abgleich-v1': [
    2,
    'Eine benannte Klärungsregel auf abweichende Auftragsdokumente anwenden.',
  ],
  'exam-wiso-context-reklamationsmuster-v1': [
    3,
    'Verschiedene Ereignisse und unterschiedliche Bezugsgruppen für eine vergleichbare Auswertung ordnen.',
  ],
  'exam-wiso-context-persoenliche-verbindung-v1': [
    2,
    'Eine ausdrücklich beschriebene Entscheidungsregel auf eine konkrete Rollenverbindung anwenden.',
  ],
  'exam-wiso-context-vertretung-auftragswissen-v1': [
    2,
    'Mehrere ausdrücklich benannte Informationsanforderungen auf einen gegebenen Arbeitsablauf übertragen.',
  ],
};

export const legacyDifficultyAssessments: Readonly<Record<string, DifficultyAssessment>> = {
  ...Object.fromEntries(
    Object.entries(numericFamilies).flatMap(([family, [level, reason]]) =>
      [1, 2, 3].map((variant) => [`${family}-v1-${variant}`, assessed(level, reason)]),
    ),
  ),
  ...Object.fromEntries(
    Object.entries(individualTasks).map(([id, [level, reason]]) => [id, assessed(level, reason)]),
  ),
};

export function isDifficultyLevel(value: unknown): value is DifficultyLevel {
  return value === 1 || value === 2 || value === 3 || value === 4;
}

/** Missing evidence stays ungraded; input format and old labels never imply hardness. */
export function getExerciseDifficulty(exercise: Exercise): DifficultyAssessment | null {
  if (exercise.difficulty !== undefined || exercise.difficultyReason !== undefined) {
    return isDifficultyLevel(exercise.difficulty) &&
      typeof exercise.difficultyReason === 'string' &&
      exercise.difficultyReason.trim().length > 0
      ? assessed(exercise.difficulty, exercise.difficultyReason.trim())
      : null;
  }
  return Object.hasOwn(legacyDifficultyAssessments, exercise.id)
    ? legacyDifficultyAssessments[exercise.id]
    : null;
}

/** Array.sort keeps equal levels stable; unknown levels remain last in either direction. */
export function compareExerciseDifficulty(
  a: Exercise,
  b: Exercise,
  direction: 'asc' | 'desc' = 'asc',
): number {
  const left = getExerciseDifficulty(a)?.level;
  const right = getExerciseDifficulty(b)?.level;
  if (left === undefined) return right === undefined ? 0 : 1;
  if (right === undefined) return -1;
  return direction === 'asc' ? left - right : right - left;
}
