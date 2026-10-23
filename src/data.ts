import { practiceExpansion } from './practice-expansion';
import { planningExercises } from './content/exam-planning';
import { systemExercises } from './content/exam-system';
import { wisoExercises } from './content/exam-wiso';
import { wisoLawExercises } from './content/exam-wiso-law';
import { transferExercises } from './content/exam-transfer';
import type { ExerciseKind } from './lib/exercise-kind';

export type TopicId = 'heizung' | 'sanitaer' | 'klima' | 'wiso';

export interface Topic {
  id: TopicId;
  name: string;
  subtitle: string;
  description: string;
}

export interface Exercise {
  id: string;
  kind?: ExerciseKind;
  topicId: TopicId;
  title: string;
  context: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  hint: string;
  formula?: string;
  estimatedMinutes: number;
  level: 'Grundlagen' | 'Anwenden';
  sourceLabel: string;
}

export const topics: Topic[] = [
  {
    id: 'heizung',
    name: 'Heizungstechnik',
    subtitle: 'Wärme verstehen. Systeme verbinden.',
    description:
      'Wärmemengen, Volumenströme und Einheiten an überschaubaren Anlagenbeispielen üben.',
  },
  {
    id: 'sanitaer',
    name: 'Sanitärtechnik',
    subtitle: 'Wasser mit Plan.',
    description: 'Rohrinhalte, Durchfluss und geometrische Zusammenhänge sicher berechnen.',
  },
  {
    id: 'klima',
    name: 'Klima & Lüftung',
    subtitle: 'Gute Luft beginnt mit Verständnis.',
    description: 'Raumvolumen, Luftwechsel und einfache thermische Modelle nachvollziehen.',
  },
  {
    id: 'wiso',
    name: 'Wirtschaft & Soziales',
    subtitle: 'Den Betrieb mitdenken.',
    description:
      'Mit Preisen, Kosten und Prozenten rechnen – mit allen Annahmen direkt in der Aufgabe.',
  },
];

const sourceLabel = 'Eigene Modellaufgabe · keine Originalprüfung';

export const exercises: Exercise[] = [
  {
    id: 'heizung-waermemenge',
    topicId: 'heizung',
    title: 'Wie viel Wärme steckt im Speicher?',
    context:
      'Ein Modellspeicher enthält 120 l Wasser. Es wird von 15 °C auf 55 °C erwärmt. Rechne mit 1 kg/l und c = 4,18 kJ/(kg · K). Wärmeverluste und die Erwärmung des Behälters bleiben unberücksichtigt.',
    question: 'Welche Wärmemenge nimmt das Wasser ungefähr auf?',
    options: ['1,39 kWh', '5,57 kWh', '20,06 kWh', '55,73 kWh'],
    correctIndex: 1,
    explanation:
      '1. Masse: m = 120 l × 1 kg/l = 120 kg.\n2. Temperaturdifferenz: ΔT = 55 − 15 = 40 K.\n3. Wärme: Q = 120 × 4,18 × 40 = 20 064 kJ.\n4. Mit 1 kWh = 3 600 kJ erhältst du Q = 20 064 / 3 600 ≈ 5,57 kWh.\nDie errechnete Wärmemenge gilt nur für das Wasser im beschriebenen Modell; reale Verluste kämen hinzu.',
    hint: 'Berechne zuerst die Temperaturdifferenz. Die Formel liefert mit den gegebenen Einheiten zunächst Kilojoule.',
    formula: 'Q = m · c · ΔT',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'heizung-volumenstrom',
    topicId: 'heizung',
    title: 'Der passende Volumenstrom',
    context:
      'Ein idealisierter Heizkreis überträgt 8,4 kW. Zwischen Vor- und Rücklauf liegen 10 K. Für Wasser gelten in diesem Modell c = 4,2 kJ/(kg · K) und eine Dichte von 1 kg/l. Der Betrieb ist stationär; Verluste werden vernachlässigt.',
    question: 'Welcher Volumenstrom ist dafür erforderlich?',
    options: ['72 l/h', '200 l/h', '720 l/h', '840 l/h'],
    correctIndex: 2,
    explanation:
      '1. Es gilt P = ṁ · c · ΔT.\n2. Umstellen: ṁ = 8,4 kJ/s / (4,2 kJ/(kg · K) × 10 K) = 0,2 kg/s.\n3. Bei 1 kg/l entspricht das 0,2 l/s.\n4. Auf eine Stunde umrechnen: 0,2 × 3 600 = 720 l/h.\nKontrolle: 720 l/h = 0,2 l/s; mit der gegebenen Spreizung werden damit 8,4 kW übertragen.',
    hint: '1 kW ist 1 kJ/s. Bestimme erst den Massenstrom pro Sekunde und rechne dann in Liter pro Stunde um.',
    formula: 'P = ṁ · c · ΔT',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'heizung-einheiten',
    topicId: 'heizung',
    title: 'Liter pro Minute richtig umrechnen',
    context:
      'Auf einem Messgerät stehen 18 l/min. Für deine Berechnung brauchst du dieselbe Durchflussmenge in m³/h. Es gilt: 1 m³ = 1 000 l und 1 h = 60 min.',
    question: 'Welcher Wert ist richtig?',
    options: ['1,08 m³/h', '0,018 m³/h', '0,30 m³/h', '10,8 m³/h'],
    correctIndex: 0,
    explanation:
      '1. Auf eine Stunde umrechnen: 18 l/min × 60 min/h = 1 080 l/h.\n2. Liter in Kubikmeter umrechnen: 1 080 / 1 000 = 1,08 m³/h.\nDie Einheitenkontrolle hilft: Minuten kürzen sich im ersten Schritt, Liter im zweiten. Der physikalische Volumenstrom bleibt derselbe.',
    hint: 'Für den Stundenwert mit 60 multiplizieren und für Kubikmeter durch 1 000 teilen.',
    estimatedMinutes: 2,
    level: 'Grundlagen',
    sourceLabel,
  },
  {
    id: 'sanitaer-rohrinhalt',
    topicId: 'sanitaer',
    title: 'Was passt in das Rohr?',
    context:
      'Eine gerade, kreisrunde Leitung ist innen durchgehend 20 mm weit und 12 m lang. Betrachte sie als idealen Zylinder; Formstücke bleiben unberücksichtigt. Verwende π ≈ 3,1416.',
    question: 'Wie groß ist der Wasserinhalt der Leitung ungefähr?',
    options: ['0,38 l', '1,88 l', '15,08 l', '3,77 l'],
    correctIndex: 3,
    explanation:
      '1. Innendurchmesser: d = 20 mm = 0,020 m. Der Radius beträgt r = 0,010 m.\n2. Querschnitt: A = π × r² = 3,1416 × 0,010² ≈ 0,00031416 m².\n3. Inhalt: V = A × L = 0,00031416 × 12 ≈ 0,00376992 m³.\n4. Mit 1 m³ = 1 000 l ergibt das ungefähr 3,77 l.\nWichtig: Für den Inhalt zählt der Innendurchmesser, nicht der Außendurchmesser.',
    hint: 'Halbiere den Innendurchmesser für den Radius. Rechne alle Längen zunächst in Metern.',
    formula: 'V = π · r² · L',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'sanitaer-durchfluss',
    topicId: 'sanitaer',
    title: 'Durchfluss aus einer Messung',
    context:
      'Bei einer vereinfachten Messung füllst du einen Behälter mit genau 24 l Wasser. Das dauert 80 s. Der Durchfluss bleibt während der Messung konstant.',
    question: 'Welchen mittleren Volumenstrom misst du in l/min?',
    options: ['0,3 l/min', '18 l/min', '12 l/min', '30 l/min'],
    correctIndex: 1,
    explanation:
      '1. Volumen durch Zeit: 24 l / 80 s = 0,3 l/s.\n2. Eine Minute hat 60 Sekunden: 0,3 l/s × 60 s/min = 18 l/min.\nKontrolle: 80 s sind 4/3 min. 18 l/min × 4/3 min ergeben wieder 24 l.\nBei schwankendem Durchfluss wäre dies ein Mittelwert über die Messzeit.',
    hint: 'Teile das Volumen durch die Messzeit. Das Ergebnis in l/s musst du noch mit 60 multiplizieren.',
    formula: 'V̇ = V / t',
    estimatedMinutes: 3,
    level: 'Grundlagen',
    sourceLabel,
  },
  {
    id: 'sanitaer-gefaelle',
    topicId: 'sanitaer',
    title: 'Gefälle in eine Höhendifferenz übersetzen',
    context:
      'In einer reinen Geometrieaufgabe ist ein Gefälle von 1,5 % vorgegeben. Die waagerechte Bezugslänge beträgt 6,0 m. Der Wert ist eine Aufgabenannahme und keine Vorgabe zur Auslegung einer realen Leitung.',
    question: 'Welche Höhendifferenz ergibt sich?',
    options: ['9 cm', '0,9 cm', '4 cm', '90 cm'],
    correctIndex: 0,
    explanation:
      '1. 1,5 % bedeutet 1,5 / 100 = 0,015.\n2. Höhendifferenz: h = 0,015 × 6,0 m = 0,09 m.\n3. In Zentimeter umrechnen: 0,09 m = 9 cm.\nKontrolle: Pro Meter entstehen 1,5 cm Unterschied; bei 6 m sind es 6 × 1,5 cm = 9 cm.\nDie Rechnung allein sagt nichts über zulässige Gefälle einer bestimmten Anlage aus.',
    hint: 'Ein Prozent bedeutet ein Hundertstel. Nutze die ausdrücklich angegebene waagerechte Bezugslänge.',
    formula: 'h = (Gefälle / 100) · L',
    estimatedMinutes: 3,
    level: 'Grundlagen',
    sourceLabel,
  },
  {
    id: 'klima-raumvolumen',
    topicId: 'klima',
    title: 'Zuerst das Raumvolumen',
    context:
      'Ein quaderförmiger Übungsraum ist innen 5,0 m lang, 4,0 m breit und 2,5 m hoch. Einbauten werden für dieses geometrische Modell vernachlässigt.',
    question: 'Welches Raumvolumen setzt du an?',
    options: ['11,5 m³', '20 m³', '50 m³', '100 m³'],
    correctIndex: 2,
    explanation:
      '1. Grundfläche: 5,0 m × 4,0 m = 20 m².\n2. Grundfläche mit der Höhe multiplizieren: 20 m² × 2,5 m = 50 m³.\nDie Einheit m³ zeigt, dass ein Volumen berechnet wurde. Das Raumvolumen ist eine Grundlage für weitere Modellrechnungen, ersetzt jedoch keine Planung einer Lüftungsanlage.',
    hint: 'Für einen Quader multiplizierst du Länge, Breite und Höhe.',
    formula: 'V = L · B · H',
    estimatedMinutes: 2,
    level: 'Grundlagen',
    sourceLabel,
  },
  {
    id: 'klima-luftwechsel',
    topicId: 'klima',
    title: 'Luftwechsel aus Volumen und Volumenstrom',
    context:
      'In einem vereinfachten Modell hat ein Raum 75 m³ Volumen. Es werden konstant 150 m³/h Außenluft zugeführt und dieselbe Menge abgeführt. Betrachte nur den rechnerischen Luftwechsel, ohne eine Aussage über die erforderliche Luftqualität zu treffen.',
    question: 'Wie groß ist der rechnerische Luftwechsel?',
    options: ['0,5 h⁻¹', '2 h⁻¹', '75 h⁻¹', '225 h⁻¹'],
    correctIndex: 1,
    explanation:
      '1. Luftwechsel n = Volumenstrom / Raumvolumen.\n2. n = 150 m³/h / 75 m³ = 2 h⁻¹.\nDas zugeführte Luftvolumen entspricht rechnerisch zweimal dem Raumvolumen pro Stunde. Das bedeutet bei realer Durchmischung nicht, dass nach einer halben Stunde jedes einzelne Luftteilchen ausgetauscht ist. Der Wert ist keine allgemeine Auslegungsvorgabe.',
    hint: 'Teile den Volumenstrom durch das Raumvolumen. Die Kubikmeter kürzen sich heraus.',
    formula: 'n = V̇ / V',
    estimatedMinutes: 3,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'klima-mischtemperatur',
    topicId: 'klima',
    title: 'Zwei Luftströme mischen',
    context:
      'Zwei trockene Luftströme mit gleichem Massenstrom werden gemischt. Einer hat 20 °C, der andere 30 °C. Beide haben im Modell die gleiche konstante spezifische Wärmekapazität. Wärmeverluste und Phasenänderungen sind ausgeschlossen.',
    question: 'Welche Mischtemperatur ergibt sich in diesem Modell?',
    options: ['10 °C', '20 °C', '50 °C', '25 °C'],
    correctIndex: 3,
    explanation:
      '1. Bei gleichem Massenstrom und gleicher Wärmekapazität tragen beide Ströme gleich stark zur Energiebilanz bei.\n2. Deshalb gilt hier: Tₘ = (20 °C + 30 °C) / 2 = 25 °C.\n3. Plausibilitätskontrolle: Die Mischtemperatur liegt zwischen beiden Eingangstemperaturen.\nBei unterschiedlichen Massenströmen wäre ein gewichteter Mittelwert nötig; bei Feuchte- oder Phasenänderungen müsste das Modell erweitert werden.',
    hint: 'Beide Ströme haben das gleiche Gewicht in der Energiebilanz. Gesucht ist hier der arithmetische Mittelwert.',
    formula: 'Tₘ = (ṁ₁ · T₁ + ṁ₂ · T₂) / (ṁ₁ + ṁ₂)',
    estimatedMinutes: 3,
    level: 'Grundlagen',
    sourceLabel,
  },
  {
    id: 'wiso-preisrechnung',
    topicId: 'wiso',
    title: 'Vom Einzelpreis zum Rechnungsbetrag',
    context:
      'Vier Bauteile kosten jeweils 18,50 € netto. Auf den gesamten Nettowarenwert gibt es 10 % Rabatt. Für diese Rechenaufgabe ist anschließend ein Steuersatz von 19 % auf den rabattierten Betrag vorgegeben. Runde erst das Endergebnis auf Cent.',
    question: 'Wie hoch ist der gesamte Bruttobetrag?',
    options: ['66,60 €', '74,00 €', '79,25 €', '88,06 €'],
    correctIndex: 2,
    explanation:
      '1. Nettowarenwert: 4 × 18,50 € = 74,00 €.\n2. Nach 10 % Rabatt: 74,00 € × 0,90 = 66,60 €.\n3. Mit dem vorgegebenen Steuersatz: 66,60 € × 1,19 = 79,254 €.\n4. Auf Cent gerundet: 79,25 €.\nDer Rabatt senkt hier die Basis für den anschließend berechneten Steuerbetrag; die genannten Konditionen sind Aufgabenannahmen.',
    hint: 'Rechne nacheinander: Menge × Einzelpreis, dann × 0,90 und schließlich × 1,19.',
    estimatedMinutes: 4,
    level: 'Anwenden',
    sourceLabel,
  },
  {
    id: 'wiso-deckungsbeitrag',
    topicId: 'wiso',
    title: 'Was bleibt zur Deckung der Fixkosten?',
    context:
      'Ein vereinfachter Auftrag bringt 210 € Nettoerlös. Die direkt durch diesen Auftrag verursachten variablen Kosten betragen 135 €. Die Fixkosten des Betriebs werden in dieser Aufgabe noch nicht auf den Auftrag verteilt.',
    question: 'Wie hoch ist der Deckungsbeitrag des Auftrags?',
    options: ['75 €', '135 €', '210 €', '345 €'],
    correctIndex: 0,
    explanation:
      '1. Deckungsbeitrag = Erlös − variable Kosten.\n2. 210 € − 135 € = 75 €.\nDiese 75 € stehen im Modell zur Deckung der Fixkosten zur Verfügung. Erst nach Berücksichtigung der relevanten Fixkosten lässt sich ein Gewinn bestimmen. Deckungsbeitrag und Gewinn sind deshalb nicht gleichbedeutend.',
    hint: 'Ziehe nur die angegebenen variablen Kosten vom Nettoerlös ab.',
    formula: 'DB = Erlös − variable Kosten',
    estimatedMinutes: 3,
    level: 'Grundlagen',
    sourceLabel,
  },
  {
    id: 'wiso-prozentrechnung',
    topicId: 'wiso',
    title: 'Eine Erhöhung richtig berechnen',
    context:
      'Ein fiktiver Stundenbetrag von 24,00 € soll um 7,5 % steigen. Es handelt sich um eine reine Prozentaufgabe, ohne Bezug zu einem Tarifvertrag oder einer tatsächlichen Vergütung.',
    question: 'Wie hoch ist der neue Stundenbetrag?',
    options: ['24,18 €', '25,50 €', '31,50 €', '25,80 €'],
    correctIndex: 3,
    explanation:
      '1. Erhöhung: 24,00 € × 0,075 = 1,80 €.\n2. Neuer Betrag: 24,00 € + 1,80 € = 25,80 €.\nAlternativ direkt: 24,00 € × 1,075 = 25,80 €.\nDie Prozentzahl bezieht sich auf den Ausgangsbetrag von 24,00 €, nicht auf den neuen Betrag.',
    hint: '7,5 % entsprechen dem Faktor 0,075. Für den erhöhten Gesamtbetrag kannst du direkt mit 1,075 multiplizieren.',
    formula: 'Neuer Wert = Grundwert · (1 + p / 100)',
    estimatedMinutes: 2,
    level: 'Grundlagen',
    sourceLabel,
  },
  ...practiceExpansion,
  ...planningExercises,
  ...systemExercises,
  ...wisoExercises,
  ...wisoLawExercises,
  ...transferExercises,
];
