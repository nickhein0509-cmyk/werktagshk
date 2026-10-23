import type { Exercise } from '../data';

export type ExerciseKind = 'calculation' | 'context' | 'knowledge';

export const exerciseKindLabels: Record<ExerciseKind, string> = {
  calculation: 'Rechenaufgabe',
  context: 'Kontextaufgabe',
  knowledge: 'Wissensfrage',
};

// Explicit editorial assignments preserve existing content identities and keys.
// A formula alone is not a calculation: conceptual formula questions remain knowledge.
const calculationFamilies = [
  'heizung-heizzeit',
  'heizung-nutzwaerme',
  'heizung-energieeinsatz',
  'heizung-spreizung',
  'heizung-waermeleistung',
  'heizung-ausdehnung',
  'sanitaer-fuellzeit',
  'sanitaer-geschwindigkeit',
  'sanitaer-druckhoehe',
  'sanitaer-mischwasser',
  'sanitaer-gefaelle-rueckwaerts',
  'sanitaer-verbrauch',
  'klima-luftbedarf',
  'klima-kanalquerschnitt',
  'klima-kanalstrom',
  'klima-luftwaerme',
  'klima-rueckwaermzahl',
  'klima-luftenergie',
  'wiso-stundenkosten',
  'wiso-materialzuschlag',
  'wiso-skonto',
  'wiso-kostendeckung',
  'wiso-preissteigerung',
  'wiso-energiekosten',
];

export const legacyExerciseKinds: Readonly<Record<string, ExerciseKind>> = {
  ...Object.fromEntries(
    calculationFamilies.flatMap((family) =>
      [1, 2, 3].map((variant) => [`${family}-v1-${variant}`, 'calculation' as const]),
    ),
  ),
  ...Object.fromEntries(
    [
      'heizung-waermemenge',
      'heizung-volumenstrom',
      'heizung-einheiten',
      'sanitaer-rohrinhalt',
      'sanitaer-durchfluss',
      'sanitaer-gefaelle',
      'klima-raumvolumen',
      'klima-luftwechsel',
      'klima-mischtemperatur',
      'wiso-preisrechnung',
      'wiso-deckungsbeitrag',
      'wiso-prozentrechnung',
      'exam-ap-rohrzuschnitt-v1',
      'exam-ap-bestellmenge-v1',
      'exam-ap-hoehenplanung-v1',
      'exam-ap-heizflaechenwahl-v1',
      'exam-ap-luefter-arbeitspunkt-v1',
      'exam-ap-angebotsvergleich-v1',
      'exam-si-waermeleistung',
      'exam-si-sensorkennlinie',
      'exam-si-energiebilanz',
      'exam-si-zaehlervergleich',
      'exam-si-mischprobe',
      'exam-si-temperaturvergleich',
      'exam-si-luftmessung',
      'exam-si-filtertrend',
      'exam-si-luftbilanz',
      'exam-wiso-auftragsvergleich',
      'exam-wiso-zuschlag-marge',
      'exam-wiso-lieferantenvergleich',
      'exam-wiso-lohnmodell',
      'exam-wiso-liquiditaetsverlauf',
      'exam-wiso-nachkalkulation',
    ].map((id) => [id, 'calculation' as const]),
  ),
  ...Object.fromEntries(
    [
      'exam-ap-ablaufabhaengigkeiten-v1',
      'exam-ap-anschlussklaerung-v1',
      'exam-ap-revisionszugang-v1',
      'exam-ap-pruefplan-v1',
      'exam-ap-variantenmatrix-v1',
      'exam-ap-uebergabeunterlagen-v1',
      'exam-si-ventilrueckmeldung',
      'exam-si-druckverlust',
      'exam-si-schalthysterese',
      'exam-wiso-aenderungsauftrag',
      'exam-wiso-angebotsabgleich',
      'exam-wiso-law-ausbildungsmittel',
      'exam-wiso-law-berufsschulteilnahme',
      'exam-wiso-law-rentenversicherung',
    ].map((id) => [id, 'context' as const]),
  ),
  ...Object.fromEntries(
    [
      'heizung-energie-leistung-v1',
      'heizung-spreizung-begriff-v1',
      'heizung-doppelte-masse-v1',
      'heizung-verlustbilanz-v1',
      'heizung-volumenstrom-trend-v1',
      'heizung-temperatur-waerme-v1',
      'sanitaer-innendurchmesser-v1',
      'sanitaer-durchmesser-quadrat-v1',
      'sanitaer-mittelwert-v1',
      'sanitaer-druck-ruhe-v1',
      'sanitaer-gefaelle-bezug-v1',
      'sanitaer-mischen-grenze-v1',
      'klima-luftwechsel-begriff-v1',
      'klima-querschnitt-trend-v1',
      'klima-luftbilanz-v1',
      'klima-massenstrom-gewicht-v1',
      'klima-volumen-einheit-v1',
      'klima-trocken-modell-v1',
      'wiso-umsatz-gewinn-v1',
      'wiso-db-fixkosten-v1',
      'wiso-rabatt-folge-v1',
      'wiso-netto-brutto-v1',
      'wiso-fixkosten-begriff-v1',
      'wiso-zeit-dezimal-v1',
      'exam-wiso-law-tarifvertragsparteien',
    ].map((id) => [id, 'knowledge' as const]),
  ),
};

/** Classifies the learning demand, independently of answer input format. */
export function getExerciseKind(exercise: Exercise): ExerciseKind {
  return exercise.kind ?? legacyExerciseKinds[exercise.id] ?? 'knowledge';
}
