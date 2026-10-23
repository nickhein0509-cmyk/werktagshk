export type FormulaId =
  | 'heat'
  | 'power'
  | 'flow'
  | 'air-change'
  | 'slope'
  | 'pipe-volume'
  | 'heating-time'
  | 'efficiency'
  | 'flow-velocity'
  | 'circle-area'
  | 'room-volume'
  | 'hydrostatic-pressure'
  | 'hydraulic-power'
  | 'heat-pump-cop'
  | 'thermal-expansion'
  | 'mixing-temperature'
  | 'ohm'
  | 'electric-power'
  | 'pressure-force'
  | 'mass-flow'
  | 'air-power';

export interface FormulaUnit {
  id: string;
  factor: number;
}
export interface FormulaVariable {
  id: string;
  label: string;
  symbol: string;
  units: FormulaUnit[];
  initial: string;
  initialUnit: string;
  minimum: number;
  positive?: boolean;
  maximum?: number;
}
export interface FormulaDefinition {
  id: FormulaId;
  title: string;
  description: string;
  equation: string;
  variables: FormulaVariable[];
  rearrangements: Record<string, string>;
  assumptions: string;
  baseUnits: string;
}
export interface FormulaEntry {
  text: string;
  unit: string;
}
export interface FormulaDraft {
  target: string;
  entries: Record<string, FormulaEntry>;
  outputUnits: Record<string, string>;
}
export type FormulaResult =
  | {
      ok: true;
      value: number;
      unit: string;
      label: string;
      alternatives: { value: number; unit: string }[];
      steps: string[];
    }
  | { ok: false; error: string; invalidFields: string[] };

const units = (...entries: [string, number][]): FormulaUnit[] =>
  entries.map(([id, factor]) => ({ id, factor }));
const energy = units(['kWh', 3600], ['kJ', 1]);
const length = units(['m', 1], ['cm', 0.01], ['mm', 0.001]);
const power = units(['kW', 1], ['W', 0.001]);
const variable = (
  id: string,
  label: string,
  symbol: string,
  entries: FormulaUnit[],
  initial: string,
  initialUnit: string,
  extra: Partial<FormulaVariable> = {},
): FormulaVariable => ({
  id,
  label,
  symbol,
  units: entries,
  initial,
  initialUnit,
  minimum: 0,
  ...extra,
});

/** Explicit learning models, not normative sizing rules or manufacturer specifications. */
export const formulaCatalog: FormulaDefinition[] = [
  {
    id: 'heat',
    title: 'Wärmeenergie',
    description: 'Wasser erwärmen und Masse oder Temperaturhub bestimmen.',
    equation: 'Q = m · c · ΔT',
    variables: [
      variable('energy', 'Wärmeenergie', 'Q', energy, '2,32222222222222', 'kWh'),
      variable('mass', 'Wassermasse', 'm', units(['kg', 1]), '100', 'kg', { positive: true }),
      variable('delta', 'Temperaturdifferenz', 'ΔT', units(['K', 1]), '20', 'K', { maximum: 100 }),
    ],
    rearrangements: {
      energy: 'Q = m · c · ΔT',
      mass: 'm = Q / (c · ΔT)',
      delta: 'ΔT = Q / (m · c)',
    },
    assumptions:
      'Modell für flüssiges Wasser: c = 4,18 kJ/(kg · K), konstant. Ohne Behältererwärmung, Wärmeverluste oder Phasenwechsel. Die Grenze von 100 K ist eine Eingabegrenze, kein Nachweis eines zulässigen flüssigen Zustands.',
    baseUnits: 'm in kg · ΔT in K · Q in kJ. 1 kWh = 3 600 kJ.',
  },
  {
    id: 'power',
    title: 'Wärmeleistung',
    description: 'Wärmeleistung, Wasservolumenstrom und Spreizung verbinden.',
    equation: 'P = ρ · V̇ · c · ΔT',
    variables: [
      variable('power', 'Wärmeleistung', 'P', power, '8,36', 'kW'),
      variable(
        'flow',
        'Wasservolumenstrom',
        'V̇',
        units(['l/h', 1], ['l/min', 60], ['l/s', 3600], ['m³/h', 1000]),
        '720',
        'l/h',
      ),
      variable('delta', 'Spreizung', 'ΔT', units(['K', 1]), '10', 'K', { maximum: 100 }),
    ],
    rearrangements: {
      power: 'P = V̇ · 4,18 · ΔT / 3 600',
      flow: 'V̇ = P · 3 600 / (4,18 · ΔT)',
      delta: 'ΔT = P · 3 600 / (4,18 · V̇)',
    },
    assumptions:
      'Stationäres Wassermodell ohne Verluste: ρ = 1 kg/l und c = 4,18 kJ/(kg · K), konstant. Kein Ersatz für reale Rohrnetz-, Pumpen- oder Wärmeerzeugerauslegung.',
    baseUnits: 'P in kW · V̇ in l/h · ΔT in K. Der Faktor 3 600 rechnet Stunden in Sekunden um.',
  },
  {
    id: 'flow',
    title: 'Volumenstrom',
    description: 'Aus Volumen und Zeit den mittleren Durchfluss bestimmen.',
    equation: 'V̇ = V / t',
    variables: [
      variable(
        'flow',
        'Volumenstrom',
        'V̇',
        units(['l/min', 1], ['l/s', 60], ['l/h', 1 / 60], ['m³/h', 1000 / 60]),
        '18',
        'l/min',
      ),
      variable('volume', 'Volumen', 'V', units(['l', 1], ['m³', 1000]), '24', 'l'),
      variable('time', 'Messzeit', 't', units(['min', 1], ['s', 1 / 60], ['h', 60]), '80', 's', {
        positive: true,
      }),
    ],
    rearrangements: { flow: 'V̇ = V / t', volume: 'V = V̇ · t', time: 't = V / V̇' },
    assumptions:
      'V geteilt durch t beschreibt einen Mittelwert über die Messzeit. Für die Rückrechnung von Volumen oder Zeit gilt der angegebene mittlere Volumenstrom während dieses Zeitraums.',
    baseUnits: 'V in l · t in min · V̇ in l/min. 1 m³ = 1 000 l · 1 min = 60 s.',
  },
  {
    id: 'air-change',
    title: 'Luftwechsel',
    description: 'Raumvolumen und Luftvolumenstrom ins Verhältnis setzen.',
    equation: 'n = V̇ / V',
    variables: [
      variable('rate', 'Luftwechsel', 'n', units(['h⁻¹', 1]), '2', 'h⁻¹'),
      variable('flow', 'Luftvolumenstrom', 'V̇', units(['m³/h', 1], ['l/s', 3.6]), '150', 'm³/h'),
      variable('volume', 'Raumvolumen', 'V', units(['m³', 1]), '75', 'm³', { positive: true }),
    ],
    rearrangements: { rate: 'n = V̇ / V', flow: 'V̇ = n · V', volume: 'V = V̇ / n' },
    assumptions:
      'Rechnerisches Verhältnis bei gleichem Bezugszeitraum. Es beschreibt weder einen vollständigen Teilchenaustausch noch einen vorgeschriebenen Außenluftbedarf. Keine Auslegungsvorgabe für Luftqualität.',
    baseUnits: 'V̇ in m³/h · V in m³ · n in h⁻¹. 1 l/s = 3,6 m³/h.',
  },
  {
    id: 'slope',
    title: 'Gefälle',
    description: 'Gefälle, Höhenunterschied und waagerechte Länge umrechnen.',
    equation: 'i = Δh / L · 100 %',
    variables: [
      variable('slope', 'Gefälle', 'i', units(['%', 1]), '1,5', '%'),
      variable('height', 'Höhenunterschied', 'Δh', length, '9', 'cm'),
      variable('length', 'Waagerechte Bezugslänge', 'L', length, '6', 'm', { positive: true }),
    ],
    rearrangements: {
      slope: 'i = Δh / L · 100',
      height: 'Δh = i / 100 · L',
      length: 'L = Δh / (i / 100)',
    },
    assumptions:
      'Reine Geometrie: L ist die waagerechte Bezugslänge, nicht die geneigte Rohrlänge. Es werden Beträge für ein Gefälle verwendet. Der Prozentwert ist keine zulässige oder erforderliche Vorgabe für eine reale Leitung.',
    baseUnits: 'Δh und L in m · i in %. Längen zunächst in dieselbe Einheit bringen.',
  },
  {
    id: 'pipe-volume',
    title: 'Rohrinhalt',
    description: 'Den Inhalt eines geraden Rohres als Zylinder berechnen.',
    equation: 'V = π · dᵢ² / 4 · L',
    variables: [
      variable('volume', 'Rohrinhalt', 'V', units(['l', 1], ['m³', 1000]), '3,76991118430775', 'l'),
      variable('diameter', 'Innendurchmesser', 'dᵢ', length, '20', 'mm', { positive: true }),
      variable('length', 'Rohrlänge', 'L', length, '12', 'm', { positive: true }),
    ],
    rearrangements: {
      volume: 'V = π · dᵢ² / 4 · L',
      diameter: 'dᵢ = √(4 · V / (π · L))',
      length: 'L = 4 · V / (π · dᵢ²)',
    },
    assumptions:
      'Gerader idealer Kreiszylinder mit konstantem Innendurchmesser. Formstücke, Armaturen und Fertigungstoleranzen bleiben unberücksichtigt. DN oder Außendurchmesser sind kein Ersatz für den gegebenen Innendurchmesser.',
    baseUnits:
      'dᵢ und L in m → V in m³; danach bei Bedarf × 1 000 für Liter. π wird mit der Rechnergenauigkeit verwendet.',
  },
  {
    id: 'heating-time',
    title: 'Heizzeit',
    description: 'Wärmeenergie und konstant verfügbare Wärmeleistung verbinden.',
    equation: 't = Q / P',
    variables: [
      variable(
        'time',
        'Heizzeit',
        't',
        units(['min', 1 / 60], ['h', 1], ['s', 1 / 3600]),
        '60',
        'min',
      ),
      variable('energy', 'Wärmeenergie', 'Q', units(['kWh', 1], ['kJ', 1 / 3600]), '6', 'kWh'),
      variable('power', 'Nutzbare Wärmeleistung', 'P', power, '6', 'kW'),
    ],
    rearrangements: { time: 't = Q / P', energy: 'Q = P · t', power: 'P = Q / t' },
    assumptions:
      'Die Wärmeleistung ist konstant und steht vollständig für die angegebene Wärmemenge zur Verfügung. Keine Anfahrphase, Speicherverluste oder weiteren Verbraucher. Eine Eingangsleistung muss zuerst auf die tatsächlich nutzbare Wärmeleistung bezogen werden.',
    baseUnits: 'Q in kWh · P in kW → t in h. 1 h = 60 min = 3 600 s.',
  },
  {
    id: 'efficiency',
    title: 'Energiewirkungsgrad',
    description: 'Nutzenergie und zugeführte Energie derselben Bilanz vergleichen.',
    equation: 'η = Q_nutz / Q_zu',
    variables: [
      variable('efficiency', 'Energiewirkungsgrad', 'η', units(['%', 0.01]), '80', '%', {
        maximum: 1,
      }),
      variable('useful', 'Nutzenergie', 'Q_nutz', units(['kWh', 1], ['kJ', 1 / 3600]), '8', 'kWh'),
      variable(
        'input',
        'Zugeführte Energie',
        'Q_zu',
        units(['kWh', 1], ['kJ', 1 / 3600]),
        '10',
        'kWh',
        { positive: true },
      ),
    ],
    rearrangements: {
      efficiency: 'η = Q_nutz / Q_zu · 100 %',
      useful: 'Q_nutz = η / 100 · Q_zu',
      input: 'Q_zu = Q_nutz / (η / 100)',
    },
    assumptions:
      'Vereinfachte Energieumwandlung mit identischer Bilanzgrenze und gleichem Zeitraum: 0 ≤ Nutzenergie ≤ zugeführte Energie. Keine Leistungszahl oder Jahresarbeitszahl einer Wärmepumpe; dort ist die Umweltenergie gesondert zu bilanzieren.',
    baseUnits: 'Beide Energien in kWh · η als Anteil 0 bis 1; für die Prozentanzeige × 100.',
  },

  {
    id: 'flow-velocity',
    title: 'Strömungsgeschwindigkeit',
    description: 'Volumenstrom, freien Querschnitt und mittlere Geschwindigkeit verbinden.',
    equation: 'V̇ = A · v',
    variables: [
      variable(
        'flow',
        'Volumenstrom',
        'V̇',
        units(['m³/h', 1 / 3600], ['l/s', 0.001], ['m³/s', 1]),
        '540',
        'm³/h',
      ),
      variable(
        'area',
        'Freier Querschnitt',
        'A',
        units(['m²', 1], ['cm²', 0.0001], ['mm²', 0.000001]),
        '0,06',
        'm²',
        { positive: true },
      ),
      variable('velocity', 'Mittlere Geschwindigkeit', 'v', units(['m/s', 1]), '2,5', 'm/s'),
    ],
    rearrangements: { flow: 'V̇ = A · v', area: 'A = V̇ / v', velocity: 'v = V̇ / A' },
    assumptions:
      'Kontinuitätsmodell für denselben freien Querschnitt. v ist die über die Fläche gemittelte Normalgeschwindigkeit; eine einzelne Punktmessung muss diesen Mittelwert nicht darstellen. Keine zulässige Strömungsgeschwindigkeit oder reale Rohr-/Kanaldimensionierung.',
    baseUnits: 'A in m² · v in m/s → V̇ in m³/s; für m³/h × 3 600. 1 l = 0,001 m³.',
  },
  {
    id: 'circle-area',
    title: 'Kreisquerschnitt',
    description: 'Kreisfläche und Durchmesser geometrisch ineinander umrechnen.',
    equation: 'A = π · d² / 4',
    variables: [
      variable(
        'area',
        'Kreisfläche',
        'A',
        units(['m²', 1], ['cm²', 0.0001], ['mm²', 0.000001]),
        '314,1592653589793',
        'mm²',
      ),
      variable('diameter', 'Durchmesser', 'd', length, '20', 'mm', { positive: true }),
    ],
    rearrangements: { area: 'A = π · d² / 4', diameter: 'd = √(4 · A / π)' },
    assumptions:
      'Idealer Kreis. Für den freien Rohrquerschnitt muss der tatsächliche Innendurchmesser eingesetzt werden; eine Nennweite oder ein Außendurchmesser ist nicht automatisch dieser Wert.',
    baseUnits: 'd in m → A in m². 1 cm² = 0,0001 m²; 1 mm² = 0,000001 m².',
  },
  {
    id: 'room-volume',
    title: 'Raumvolumen',
    description: 'Quaderförmigen Raum oder eine seiner Innenabmessungen berechnen.',
    equation: 'V = L · B · H',
    variables: [
      variable('volume', 'Raumvolumen', 'V', units(['m³', 1], ['l', 0.001]), '50', 'm³', {
        positive: true,
      }),
      variable('length', 'Innenlänge', 'L', length, '5', 'm', { positive: true }),
      variable('width', 'Innenbreite', 'B', length, '4', 'm', { positive: true }),
      variable('height', 'Innenhöhe', 'H', length, '2,5', 'm', { positive: true }),
    ],
    rearrangements: {
      volume: 'V = L · B · H',
      length: 'L = V / (B · H)',
      width: 'B = V / (L · H)',
      height: 'H = V / (L · B)',
    },
    assumptions:
      'Idealer Quader mit positiven Innenabmessungen. Schrägen, Einbauten und andere Raumformen sind nicht enthalten. Das Volumen allein legt keinen erforderlichen Luftvolumenstrom fest.',
    baseUnits: 'L, B und H in m → V in m³. Vor dem Multiplizieren alle Längen in Meter umrechnen.',
  },
  {
    id: 'hydrostatic-pressure',
    title: 'Hydrostatischer Druck',
    description: 'Druckdifferenz einer ruhenden Flüssigkeitssäule auswerten.',
    equation: 'Δp = ρ · g · h',
    variables: [
      variable(
        'pressure',
        'Hydrostatische Druckdifferenz',
        'Δp',
        units(['bar', 100000], ['kPa', 1000], ['Pa', 1]),
        '0,981',
        'bar',
      ),
      variable(
        'density',
        'Flüssigkeitsdichte',
        'ρ',
        units(['kg/m³', 1], ['kg/l', 1000]),
        '1000',
        'kg/m³',
        { positive: true },
      ),
      variable('height', 'Senkrechte Flüssigkeitshöhe', 'h', length, '10', 'm'),
    ],
    rearrangements: {
      pressure: 'Δp = ρ · 9,81 · h',
      density: 'ρ = Δp / (9,81 · h)',
      height: 'h = Δp / (ρ · 9,81)',
    },
    assumptions:
      'Ruhende Flüssigkeit mit konstanter Dichte, g = 9,81 m/s². Berechnet wird nur die Druckdifferenz zwischen zwei Höhen, kein absoluter Druck und kein erforderlicher Anlagen- oder MAG-Vordruck. Strömungsverluste bleiben unberücksichtigt.',
    baseUnits: 'ρ in kg/m³ · g in m/s² · h in m → Δp in Pa. 1 bar = 100 000 Pa.',
  },
  {
    id: 'hydraulic-power',
    title: 'Hydraulische Leistung',
    description: 'Druckdifferenz und Volumenstrom zur hydraulischen Leistung verbinden.',
    equation: 'P_hyd = Δp · V̇',
    variables: [
      variable(
        'power',
        'Hydraulische Leistung',
        'P_hyd',
        units(['W', 1], ['kW', 1000]),
        '100',
        'W',
      ),
      variable(
        'pressure',
        'Druckdifferenz',
        'Δp',
        units(['bar', 100000], ['kPa', 1000], ['Pa', 1]),
        '1',
        'bar',
      ),
      variable(
        'flow',
        'Volumenstrom',
        'V̇',
        units(['m³/h', 1 / 3600], ['l/min', 1 / 60000], ['l/s', 0.001], ['m³/s', 1]),
        '3,6',
        'm³/h',
      ),
    ],
    rearrangements: { power: 'P_hyd = Δp · V̇', pressure: 'Δp = P_hyd / V̇', flow: 'V̇ = P_hyd / Δp' },
    assumptions:
      'Stationäres Modell für ein inkompressibles Fluid mit derselben Druckdifferenz und demselben Volumenstrom. Dies ist die hydraulische Leistung am Fluid; elektrische Aufnahmeleistung und Pumpenwirkungsgrad sind nicht enthalten.',
    baseUnits: 'Δp in Pa · V̇ in m³/s → P_hyd in W. Nicht bar direkt mit m³/h multiplizieren.',
  },
  {
    id: 'heat-pump-cop',
    title: 'Leistungszahl einer Wärmepumpe',
    description:
      'Heizleistung und elektrische Aufnahmeleistung am selben Betriebspunkt vergleichen.',
    equation: 'COP = P_Heiz / P_el',
    variables: [
      variable('cop', 'Leistungszahl', 'COP', units(['1', 1]), '4', '1'),
      variable('heating', 'Heizleistung', 'P_Heiz', power, '12', 'kW'),
      variable('electric', 'Elektrische Aufnahmeleistung', 'P_el', power, '3', 'kW', {
        positive: true,
      }),
    ],
    rearrangements: {
      cop: 'COP = P_Heiz / P_el',
      heating: 'P_Heiz = COP · P_el',
      electric: 'P_el = P_Heiz / COP',
    },
    assumptions:
      'Leistungen mit festgelegter gemeinsamer Bilanzgrenze am selben Betriebspunkt. Die Leistungszahl darf größer als 1 sein, weil Umweltwärme aufgenommen wird. Eine Jahresarbeitszahl ist dagegen ein Energieverhältnis über den betrachteten Jahreszeitraum; sie ist nicht dieser einzelne Betriebspunkt. Keine Prognose für ein bestimmtes Gerät.',
    baseUnits:
      'Beide Leistungen in kW → COP dimensionslos. Keine Prozentanzeige und keine Begrenzung auf 100 %.',
  },
  {
    id: 'thermal-expansion',
    title: 'Lineare Wärmeausdehnung',
    description: 'Längenänderung mit gegebenem konstantem Ausdehnungskoeffizienten berechnen.',
    equation: 'ΔL = L₀ · α · ΔT',
    variables: [
      variable('expansion', 'Längenänderung', 'ΔL', length, '6', 'mm'),
      variable('length', 'Ausgangslänge', 'L₀', length, '10', 'm', { positive: true }),
      variable(
        'alpha',
        'Längenausdehnungskoeffizient',
        'α',
        units(['10⁻⁶/K', 0.000001], ['mm/(m·K)', 0.001], ['1/K', 1]),
        '12',
        '10⁻⁶/K',
        { positive: true },
      ),
      variable('delta', 'Temperaturerhöhung', 'ΔT', units(['K', 1]), '50', 'K'),
    ],
    rearrangements: {
      expansion: 'ΔL = L₀ · α · ΔT',
      length: 'L₀ = ΔL / (α · ΔT)',
      alpha: 'α = ΔL / (L₀ · ΔT)',
      delta: 'ΔT = ΔL / (L₀ · α)',
    },
    assumptions:
      'Lineares Modell kleiner Dehnungen mit positivem konstantem α und einer Temperaturerhöhung. Der Koeffizient wird als Aufgabenwert eingesetzt; keine pauschale Materialkennzahl. Lagerung, Spannungen, Längenausgleich und reale Kompensatorauslegung sind nicht enthalten.',
    baseUnits: 'L₀ und ΔL in m · α in 1/K · ΔT in K. 12 × 10⁻⁶/K = 0,012 mm/(m·K) = 0,000012/K.',
  },
  {
    id: 'mixing-temperature',
    title: 'Mischtemperatur',
    description: 'Zwei trockene Luftströme bei gleicher konstanter Wärmekapazität mischen.',
    equation: 'T_m = (ṁ₁ · T₁ + ṁ₂ · T₂) / (ṁ₁ + ṁ₂)',
    variables: [
      variable('mixed', 'Mischtemperatur', 'T_m', units(['°C', 1]), '25', '°C', {
        minimum: -273.15,
      }),
      variable('first', 'Temperatur Strom 1', 'T₁', units(['°C', 1]), '20', '°C', {
        minimum: -273.15,
      }),
      variable('second', 'Temperatur Strom 2', 'T₂', units(['°C', 1]), '30', '°C', {
        minimum: -273.15,
      }),
      variable(
        'mass1',
        'Massenstrom 1',
        'ṁ₁',
        units(['kg/s', 1], ['kg/h', 1 / 3600]),
        '1',
        'kg/s',
        { positive: true },
      ),
      variable(
        'mass2',
        'Massenstrom 2',
        'ṁ₂',
        units(['kg/s', 1], ['kg/h', 1 / 3600]),
        '1',
        'kg/s',
        { positive: true },
      ),
    ],
    rearrangements: {
      mixed: 'T_m = (ṁ₁ · T₁ + ṁ₂ · T₂) / (ṁ₁ + ṁ₂)',
      first: 'T₁ = (T_m · (ṁ₁ + ṁ₂) − ṁ₂ · T₂) / ṁ₁',
      second: 'T₂ = (T_m · (ṁ₁ + ṁ₂) − ṁ₁ · T₁) / ṁ₂',
    },
    assumptions:
      'Stationäres adiabates Mischen zweier trockener Luftströme mit gleicher konstanter spezifischer Wärmekapazität. Positive Massenströme, keine Feuchte-, Phasen- oder Druckänderungsbilanz. Celsiuswerte dürfen hier wegen der normierten Massenstromgewichte verwendet werden. Keine Berechnung feuchter Luft über Enthalpie.',
    baseUnits:
      'Beide Massenströme in kg/s · alle Temperaturen in °C. Es werden die Massenströme gewichtet, nicht beliebige ungleiche Volumenströme.',
  },
  {
    id: 'ohm',
    title: 'Ohmsches Gesetz',
    description: 'Spannung, Stromstärke und konstanten ohmschen Widerstand verbinden.',
    equation: 'U = R · I',
    variables: [
      variable('voltage', 'Spannung', 'U', units(['V', 1], ['mV', 0.001], ['kV', 1000]), '12', 'V'),
      variable('resistance', 'Ohmscher Widerstand', 'R', units(['Ω', 1], ['kΩ', 1000]), '6', 'Ω', {
        positive: true,
      }),
      variable('current', 'Stromstärke', 'I', units(['A', 1], ['mA', 0.001]), '2', 'A'),
    ],
    rearrangements: { voltage: 'U = R · I', resistance: 'R = U / I', current: 'I = U / R' },
    assumptions:
      'Reine Modellrechnung an einem positiven konstanten ohmschen Widerstand. Kein temperaturabhängiges Bauteilmodell, keine komplexe Wechselstromimpedanz und keine Anleitung für Arbeiten oder Messungen an elektrischen Anlagen.',
    baseUnits: 'R in Ω · I in A → U in V. 1 kΩ = 1 000 Ω; 1 mA = 0,001 A.',
  },
  {
    id: 'electric-power',
    title: 'Elektrische Leistung',
    description: 'Elektrische Leistung bei Gleichstrom oder rein ohmscher Last bestimmen.',
    equation: 'P = U · I',
    variables: [
      variable('power', 'Elektrische Leistung', 'P', units(['W', 1], ['kW', 1000]), '460', 'W'),
      variable(
        'voltage',
        'Spannung',
        'U',
        units(['V', 1], ['mV', 0.001], ['kV', 1000]),
        '230',
        'V',
      ),
      variable('current', 'Stromstärke', 'I', units(['A', 1], ['mA', 0.001]), '2', 'A'),
    ],
    rearrangements: { power: 'P = U · I', voltage: 'U = P / I', current: 'I = P / U' },
    assumptions:
      'Gleichstrom oder effektive Wechselstromwerte an rein ohmscher Last mit Leistungsfaktor 1. Nicht die allgemeine Wirkleistung bei Blindanteilen oder ein Drehstrommodell. Keine Aussage zu Absicherung, Leiterquerschnitt oder Arbeiten an elektrischen Anlagen.',
    baseUnits: 'U in V · I in A → P in W. 1 kW = 1 000 W.',
  },
  {
    id: 'pressure-force',
    title: 'Druckkraft',
    description:
      'Resultierende Kraft aus einer gegebenen Druckdifferenz und wirksamen Fläche berechnen.',
    equation: 'F = Δp · A',
    variables: [
      variable('force', 'Druckkraft', 'F', units(['N', 1], ['kN', 1000]), '2000', 'N'),
      variable(
        'pressure',
        'Druckdifferenz',
        'Δp',
        units(['bar', 100000], ['kPa', 1000], ['Pa', 1]),
        '2',
        'bar',
      ),
      variable(
        'area',
        'Wirksame Fläche',
        'A',
        units(['m²', 1], ['cm²', 0.0001], ['mm²', 0.000001]),
        '100',
        'cm²',
        { positive: true },
      ),
    ],
    rearrangements: { force: 'F = Δp · A', pressure: 'Δp = F / A', area: 'A = F / Δp' },
    assumptions:
      'Gleichmäßige Druckdifferenz wirkt senkrecht auf die gegebene wirksame Fläche. Reibung, Eigengewicht, Federn und dynamische Kräfte sind nicht enthalten. Keine Auslegung oder Einstellung realer Sicherheitsarmaturen.',
    baseUnits: 'Δp in Pa · A in m² → F in N. 1 bar = 100 000 Pa.',
  },
  {
    id: 'mass-flow',
    title: 'Massenstrom',
    description: 'Massenstrom und Volumenstrom über die gegebene Dichte umrechnen.',
    equation: 'ṁ = ρ · V̇',
    variables: [
      variable('mass', 'Massenstrom', 'ṁ', units(['kg/h', 1 / 3600], ['kg/s', 1]), '720', 'kg/h'),
      variable('density', 'Dichte', 'ρ', units(['kg/m³', 1], ['kg/l', 1000]), '1000', 'kg/m³', {
        positive: true,
      }),
      variable(
        'flow',
        'Volumenstrom',
        'V̇',
        units(['m³/h', 1 / 3600], ['l/s', 0.001], ['m³/s', 1]),
        '0,72',
        'm³/h',
      ),
    ],
    rearrangements: { mass: 'ṁ = ρ · V̇', density: 'ρ = ṁ / V̇', flow: 'V̇ = ṁ / ρ' },
    assumptions:
      'Dichte und Volumenstrom beziehen sich auf denselben Fluidzustand und Querschnitt. Die Dichte ist ein gegebener konstanter Modellwert, keine allgemeine Konstante für alle Wasser-, Luft- oder Gaszustände.',
    baseUnits: 'ρ in kg/m³ · V̇ in m³/s → ṁ in kg/s. 1 kg/h = 1/3 600 kg/s.',
  },
  {
    id: 'air-power',
    title: 'Sensible Luftwärmeleistung',
    description: 'Wärmeleistung aus Luftvolumenstrom und Temperaturhub bestimmen.',
    equation: 'P = c′ · V̇ · ΔT',
    variables: [
      variable('power', 'Sensible Wärmeleistung', 'P', units(['kW', 1000], ['W', 1]), '4,08', 'kW'),
      variable('flow', 'Luftvolumenstrom', 'V̇', units(['m³/h', 1], ['l/s', 3.6]), '600', 'm³/h'),
      variable('delta', 'Temperaturhub', 'ΔT', units(['K', 1]), '20', 'K'),
    ],
    rearrangements: {
      power: 'P = 0,34 · V̇ · ΔT',
      flow: 'V̇ = P / (0,34 · ΔT)',
      delta: 'ΔT = P / (0,34 · V̇)',
    },
    assumptions:
      'Trockene Luft mit gegebenem konstantem volumetrischem Wärmekapazitätswert c′ = 0,34 Wh/(m³ · K). Nur sensible Erwärmung, keine Feuchte- oder Phasenänderungen und keine Wärmeverluste. Der Wert ist ein Modellwert für den angenommenen Luftzustand, keine universelle Stoffkonstante.',
    baseUnits:
      'V̇ in m³/h · ΔT in K · c′ in Wh/(m³ · K) → P in W; danach bei Bedarf / 1 000 für kW.',
  },
];

export type FormulaGroupId = 'thermal' | 'fluid' | 'air' | 'geometry' | 'electrical';
export const formulaGroups: { id: FormulaGroupId; label: string }[] = [
  { id: 'thermal', label: 'Wärme & Energie' },
  { id: 'fluid', label: 'Strömung & Druck' },
  { id: 'air', label: 'Luft & Mischen' },
  { id: 'geometry', label: 'Geometrie' },
  { id: 'electrical', label: 'Elektro-Grundlagen' },
];
const formulaGroupById: Record<FormulaId, FormulaGroupId> = {
  heat: 'thermal',
  power: 'thermal',
  flow: 'fluid',
  'air-change': 'air',
  slope: 'geometry',
  'pipe-volume': 'geometry',
  'heating-time': 'thermal',
  efficiency: 'thermal',
  'flow-velocity': 'fluid',
  'circle-area': 'geometry',
  'room-volume': 'geometry',
  'hydrostatic-pressure': 'fluid',
  'hydraulic-power': 'fluid',
  'heat-pump-cop': 'thermal',
  'thermal-expansion': 'thermal',
  'mixing-temperature': 'air',
  ohm: 'electrical',
  'electric-power': 'electrical',
  'pressure-force': 'fluid',
  'mass-flow': 'fluid',
  'air-power': 'air',
};
export function getFormulaGroup(id: FormulaId): FormulaGroupId {
  return formulaGroupById[id];
}
export function supportedFormulaTargets(formula: FormulaDefinition): FormulaVariable[] {
  return formula.variables.filter((entry) => Object.hasOwn(formula.rearrangements, entry.id));
}
export function filterFormulas(group: FormulaGroupId | 'all', query: string): FormulaDefinition[] {
  const words = query.trim().toLocaleLowerCase('de').split(/\s+/).filter(Boolean);
  return formulaCatalog.filter((formula) => {
    if (group !== 'all' && getFormulaGroup(formula.id) !== group) return false;
    const haystack =
      `${formula.title} ${formula.description} ${formula.equation} ${formula.variables.map((entry) => `${entry.label} ${entry.symbol}`).join(' ')}`.toLocaleLowerCase(
        'de',
      );
    return words.every((word) => haystack.includes(word));
  });
}

export function getFormula(id: FormulaId): FormulaDefinition {
  const formula = formulaCatalog.find((entry) => entry.id === id);
  if (!formula) throw new Error('Unbekanntes Formelmodell.');
  return formula;
}

export function createFormulaDraft(id: FormulaId): FormulaDraft {
  const formula = getFormula(id);
  return {
    target: formula.variables[0].id,
    entries: Object.fromEntries(
      formula.variables.map((entry) => [
        entry.id,
        { text: entry.initial, unit: entry.initialUnit },
      ]),
    ),
    outputUnits: Object.fromEntries(
      formula.variables.map((entry) => [entry.id, entry.initialUnit]),
    ),
  };
}

/** No thousands separators, JS expressions, hexadecimal literals or Infinity. */
export function parseFormulaNumber(text: string): number | null {
  if (text.length > 80 || !/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:[eE][+-]?\d+)?$/.test(text.trim()))
    return null;
  const value = Number(text.trim().replace(',', '.'));
  return Number.isFinite(value) ? value : null;
}

export function formatFormulaNumber(value: number, digits = 3): string {
  // Round binary floating-point noise for display only; retain full values for calculations.
  const display = Number(value.toPrecision(12));
  if (display !== 0 && (Math.abs(display) < 0.001 || Math.abs(display) >= 1e10))
    return Number(display.toPrecision(6)).toExponential().replace('.', ',');
  return new Intl.NumberFormat('de-DE', { maximumFractionDigits: digits }).format(
    Object.is(display, -0) ? 0 : display,
  );
}

export function convertFormulaEntry(
  variable: FormulaVariable,
  entry: FormulaEntry,
  nextUnit: string,
): FormulaEntry {
  const previous = variable.units.find((unit) => unit.id === entry.unit);
  const next = variable.units.find((unit) => unit.id === nextUnit);
  if (!previous || !next) return entry;
  const number = parseFormulaNumber(entry.text);
  if (number === null) return { ...entry, unit: nextUnit };
  const converted = (number * previous.factor) / next.factor;
  return {
    text: Number.isFinite(converted) ? converted.toString().replace('.', ',') : '',
    unit: nextUnit,
  };
}

export function solveFormula(
  id: FormulaId,
  target: string,
  entries: Record<string, FormulaEntry>,
  outputUnit: string,
): FormulaResult {
  const formula = getFormula(id);
  const sought = formula.variables.find((entry) => entry.id === target);
  if (
    !sought ||
    !Object.hasOwn(formula.rearrangements, target) ||
    !sought.units.some((unit) => unit.id === outputUnit)
  )
    return {
      ok: false,
      error: 'Wähle eine unterstützte Größe und Ergebniseinheit.',
      invalidFields: [],
    };
  const values: Record<string, number> = {};
  const steps: string[] = [];
  for (const field of formula.variables.filter((entry) => entry.id !== target)) {
    const input = entries[field.id];
    const unit = field.units.find((entry) => entry.id === input?.unit);
    const number = input ? parseFormulaNumber(input.text) : null;
    const value = number === null || !unit ? NaN : number * unit.factor;
    if (
      !Number.isFinite(value) ||
      value < field.minimum ||
      (field.positive && value === 0) ||
      (field.maximum !== undefined && value > field.maximum)
    ) {
      const legacyHeatError = id === 'heat' && target === 'energy';
      return {
        ok: false,
        error: legacyHeatError
          ? 'Bitte eine positive Masse und eine Temperaturdifferenz von 0 bis 100 K eingeben.'
          : `${field.label}: Bitte ${field.minimum < 0 ? `einen endlichen Wert ab ${formatFormulaNumber(field.minimum)} in der Basiseinheit` : `${field.positive ? 'einen positiven' : 'einen nicht negativen'} endlichen Wert`}${field.maximum !== undefined ? ` bis ${formatFormulaNumber(field.maximum / (unit?.factor ?? 1))} ${unit?.id ?? field.initialUnit}` : ''} eingeben.`,
        invalidFields: [field.id],
      };
    }
    values[field.id] = value;
    const baseUnit =
      id === 'efficiency' && field.id === 'efficiency'
        ? 'Anteil'
        : (field.units.find((entry) => entry.factor === 1)?.id ?? field.initialUnit);
    steps.push(
      `${field.symbol} = ${formatFormulaNumber(number!, 8)} ${input.unit}${unit!.factor !== 1 ? ` = ${formatFormulaNumber(value, 8)} ${baseUnit}` : ''}`,
    );
  }
  const divide = (numerator: number, denominator: number) => {
    if (!(denominator > 0))
      throw new Error(
        'Für diese Umstellung muss der Nenner größer als null sein. Mit diesen Werten lässt sich die gesuchte Größe nicht eindeutig bestimmen.',
      );
    return numerator / denominator;
  };
  let result: number;
  let substitution: string;
  const n = (key: string) => formatFormulaNumber(values[key], 8);
  try {
    switch (id) {
      case 'heat':
        if (target === 'energy') {
          result = values.mass * 4.18 * values.delta;
          substitution = `Q = ${n('mass')} kg × 4,18 kJ/(kg · K) × ${n('delta')} K`;
        } else if (target === 'mass') {
          result = divide(values.energy, 4.18 * values.delta);
          substitution = `m = ${n('energy')} kJ / (4,18 kJ/(kg · K) × ${n('delta')} K)`;
        } else {
          result = divide(values.energy, values.mass * 4.18);
          substitution = `ΔT = ${n('energy')} kJ / (${n('mass')} kg × 4,18 kJ/(kg · K))`;
        }
        break;
      case 'power':
        if (target === 'power') {
          result = (values.flow * 4.18 * values.delta) / 3600;
          substitution = `P = ${n('flow')} l/h × 1 kg/l × 4,18 kJ/(kg · K) × ${n('delta')} K / 3 600`;
        } else if (target === 'flow') {
          result = divide(values.power * 3600, 4.18 * values.delta);
          substitution = `V̇ = ${n('power')} × 3 600 / (4,18 × ${n('delta')})`;
        } else {
          result = divide(values.power * 3600, 4.18 * values.flow);
          substitution = `ΔT = ${n('power')} × 3 600 / (4,18 × ${n('flow')})`;
        }
        break;
      case 'flow':
        if (target === 'flow') {
          result = divide(values.volume, values.time);
          substitution = `V̇ = ${n('volume')} l / ${n('time')} min`;
        } else if (target === 'volume') {
          result = values.flow * values.time;
          substitution = `V = ${n('flow')} l/min × ${n('time')} min`;
        } else {
          result = divide(values.volume, values.flow);
          substitution = `t = ${n('volume')} l / ${n('flow')} l/min`;
        }
        break;
      case 'air-change':
        if (target === 'rate') {
          result = divide(values.flow, values.volume);
          substitution = `n = ${n('flow')} m³/h / ${n('volume')} m³`;
        } else if (target === 'flow') {
          result = values.rate * values.volume;
          substitution = `V̇ = ${n('rate')} h⁻¹ × ${n('volume')} m³`;
        } else {
          result = divide(values.flow, values.rate);
          substitution = `V = ${n('flow')} m³/h / ${n('rate')} h⁻¹`;
        }
        break;
      case 'slope':
        if (target === 'slope') {
          result = divide(values.height, values.length) * 100;
          substitution = `i = ${n('height')} m / ${n('length')} m × 100`;
        } else if (target === 'height') {
          result = (values.slope / 100) * values.length;
          substitution = `Δh = ${n('slope')} / 100 × ${n('length')} m`;
        } else {
          result = divide(values.height, values.slope / 100);
          substitution = `L = ${n('height')} m / (${n('slope')} / 100)`;
        }
        break;
      case 'pipe-volume':
        if (target === 'volume') {
          result = ((Math.PI * values.diameter ** 2) / 4) * values.length * 1000;
          substitution = `V = π × (${n('diameter')} m)² / 4 × ${n('length')} m × 1 000 l/m³`;
        } else if (target === 'diameter') {
          result = Math.sqrt(divide((4 * values.volume) / 1000, Math.PI * values.length));
          substitution = `dᵢ = √(4 × (${n('volume')} l / 1 000) / (π × ${n('length')} m))`;
        } else {
          result = divide((4 * values.volume) / 1000, Math.PI * values.diameter ** 2);
          substitution = `L = 4 × (${n('volume')} l / 1 000) / (π × (${n('diameter')} m)²)`;
        }
        break;
      case 'heating-time':
        if (target === 'time') {
          result = divide(values.energy, values.power);
          substitution = `t = ${n('energy')} kWh / ${n('power')} kW`;
        } else if (target === 'energy') {
          result = values.power * values.time;
          substitution = `Q = ${n('power')} kW × ${n('time')} h`;
        } else {
          result = divide(values.energy, values.time);
          substitution = `P = ${n('energy')} kWh / ${n('time')} h`;
        }
        break;
      case 'efficiency':
        if (target === 'efficiency') {
          result = divide(values.useful, values.input);
          substitution = `η = ${n('useful')} kWh / ${n('input')} kWh`;
        } else if (target === 'useful') {
          result = values.efficiency * values.input;
          substitution = `Q_nutz = ${n('efficiency')} × ${n('input')} kWh`;
        } else {
          result = divide(values.useful, values.efficiency);
          substitution = `Q_zu = ${n('useful')} kWh / ${n('efficiency')}`;
        }
        break;
      case 'flow-velocity':
        if (target === 'flow') {
          result = values.area * values.velocity;
          substitution = `V̇ = ${n('area')} m² × ${n('velocity')} m/s`;
        } else if (target === 'area') {
          result = divide(values.flow, values.velocity);
          substitution = `A = ${n('flow')} m³/s / ${n('velocity')} m/s`;
        } else {
          result = divide(values.flow, values.area);
          substitution = `v = ${n('flow')} m³/s / ${n('area')} m²`;
        }
        break;
      case 'circle-area':
        if (target === 'area') {
          result = (Math.PI * values.diameter ** 2) / 4;
          substitution = `A = π × (${n('diameter')} m)² / 4`;
        } else {
          result = Math.sqrt((4 * values.area) / Math.PI);
          substitution = `d = √(4 × ${n('area')} m² / π)`;
        }
        break;
      case 'room-volume':
        if (target === 'volume') {
          result = values.length * values.width * values.height;
          substitution = `V = ${n('length')} m × ${n('width')} m × ${n('height')} m`;
        } else {
          const sides = ['length', 'width', 'height'].filter((key) => key !== target);
          result = divide(values.volume, values[sides[0]] * values[sides[1]]);
          substitution = `${sought.symbol} = ${n('volume')} m³ / (${n(sides[0])} m × ${n(sides[1])} m)`;
        }
        break;
      case 'hydrostatic-pressure':
        if (target === 'pressure') {
          result = values.density * 9.81 * values.height;
          substitution = `Δp = ${n('density')} kg/m³ × 9,81 m/s² × ${n('height')} m`;
        } else if (target === 'density') {
          result = divide(values.pressure, 9.81 * values.height);
          substitution = `ρ = ${n('pressure')} Pa / (9,81 m/s² × ${n('height')} m)`;
        } else {
          result = divide(values.pressure, values.density * 9.81);
          substitution = `h = ${n('pressure')} Pa / (${n('density')} kg/m³ × 9,81 m/s²)`;
        }
        break;
      case 'hydraulic-power':
        if (target === 'power') {
          result = values.pressure * values.flow;
          substitution = `P_hyd = ${n('pressure')} Pa × ${n('flow')} m³/s`;
        } else if (target === 'pressure') {
          result = divide(values.power, values.flow);
          substitution = `Δp = ${n('power')} W / ${n('flow')} m³/s`;
        } else {
          result = divide(values.power, values.pressure);
          substitution = `V̇ = ${n('power')} W / ${n('pressure')} Pa`;
        }
        break;
      case 'heat-pump-cop':
        if (target === 'cop') {
          result = divide(values.heating, values.electric);
          substitution = `COP = ${n('heating')} kW / ${n('electric')} kW`;
        } else if (target === 'heating') {
          result = values.cop * values.electric;
          substitution = `P_Heiz = ${n('cop')} × ${n('electric')} kW`;
        } else {
          result = divide(values.heating, values.cop);
          substitution = `P_el = ${n('heating')} kW / ${n('cop')}`;
        }
        break;
      case 'thermal-expansion':
        if (target === 'expansion') {
          result = values.length * values.alpha * values.delta;
          substitution = `ΔL = ${n('length')} m × ${n('alpha')} 1/K × ${n('delta')} K`;
        } else {
          const factors = ['length', 'alpha', 'delta'].filter((key) => key !== target);
          result = divide(values.expansion, values[factors[0]] * values[factors[1]]);
          const factorUnits: Record<string, string> = { length: 'm', alpha: '1/K', delta: 'K' };
          substitution = `${sought.symbol} = ${n('expansion')} m / (${n(factors[0])} ${factorUnits[factors[0]]} × ${n(factors[1])} ${factorUnits[factors[1]]})`;
        }
        break;
      case 'mixing-temperature':
        if (target === 'mixed') {
          result = divide(
            values.mass1 * values.first + values.mass2 * values.second,
            values.mass1 + values.mass2,
          );
          substitution = `T_m = (${n('mass1')} kg/s × ${n('first')} °C + ${n('mass2')} kg/s × ${n('second')} °C) / (${n('mass1')} + ${n('mass2')}) kg/s`;
        } else {
          const known = target === 'first' ? 'second' : 'first';
          const knownMass = target === 'first' ? 'mass2' : 'mass1';
          const targetMass = target === 'first' ? 'mass1' : 'mass2';
          result = divide(
            values.mixed * (values.mass1 + values.mass2) - values[knownMass] * values[known],
            values[targetMass],
          );
          substitution = `${sought.symbol} = (${n('mixed')} °C × (${n('mass1')} + ${n('mass2')}) kg/s − ${n(knownMass)} kg/s × ${n(known)} °C) / ${n(targetMass)} kg/s`;
        }
        break;
      case 'ohm':
        if (target === 'voltage') {
          result = values.resistance * values.current;
          substitution = `U = ${n('resistance')} Ω × ${n('current')} A`;
        } else if (target === 'resistance') {
          result = divide(values.voltage, values.current);
          substitution = `R = ${n('voltage')} V / ${n('current')} A`;
        } else {
          result = divide(values.voltage, values.resistance);
          substitution = `I = ${n('voltage')} V / ${n('resistance')} Ω`;
        }
        break;
      case 'electric-power':
        if (target === 'power') {
          result = values.voltage * values.current;
          substitution = `P = ${n('voltage')} V × ${n('current')} A`;
        } else if (target === 'voltage') {
          result = divide(values.power, values.current);
          substitution = `U = ${n('power')} W / ${n('current')} A`;
        } else {
          result = divide(values.power, values.voltage);
          substitution = `I = ${n('power')} W / ${n('voltage')} V`;
        }
        break;
      case 'pressure-force':
        if (target === 'force') {
          result = values.pressure * values.area;
          substitution = `F = ${n('pressure')} Pa × ${n('area')} m²`;
        } else if (target === 'pressure') {
          result = divide(values.force, values.area);
          substitution = `Δp = ${n('force')} N / ${n('area')} m²`;
        } else {
          result = divide(values.force, values.pressure);
          substitution = `A = ${n('force')} N / ${n('pressure')} Pa`;
        }
        break;
      case 'mass-flow':
        if (target === 'mass') {
          result = values.density * values.flow;
          substitution = `ṁ = ${n('density')} kg/m³ × ${n('flow')} m³/s`;
        } else if (target === 'density') {
          result = divide(values.mass, values.flow);
          substitution = `ρ = ${n('mass')} kg/s / ${n('flow')} m³/s`;
        } else {
          result = divide(values.mass, values.density);
          substitution = `V̇ = ${n('mass')} kg/s / ${n('density')} kg/m³`;
        }
        break;
      case 'air-power':
        if (target === 'power') {
          result = 0.34 * values.flow * values.delta;
          substitution = `P = 0,34 Wh/(m³ · K) × ${n('flow')} m³/h × ${n('delta')} K`;
        } else if (target === 'flow') {
          result = divide(values.power, 0.34 * values.delta);
          substitution = `V̇ = ${n('power')} W / (0,34 Wh/(m³ · K) × ${n('delta')} K)`;
        } else {
          result = divide(values.power, 0.34 * values.flow);
          substitution = `ΔT = ${n('power')} W / (0,34 Wh/(m³ · K) × ${n('flow')} m³/h)`;
        }
        break;
    }
    if (!Number.isFinite(result))
      throw new Error(
        'Die Rechnung überschreitet den darstellbaren Zahlenbereich. Prüfe Größenordnung und Einheiten.',
      );
    if (
      id === 'efficiency' &&
      ((target === 'efficiency' && result > 1) ||
        (target === 'useful' && result > values.input) ||
        (target === 'input' && values.useful > result))
    )
      throw new Error(
        'In diesem Wirkungsgradmodell darf die Nutzenergie die zugeführte Energie nicht überschreiten. Prüfe die gemeinsame Bilanzgrenze.',
      );
    if (
      result < sought.minimum ||
      (sought.positive && result === 0) ||
      (sought.maximum !== undefined && result > sought.maximum)
    )
      throw new Error(
        'Das Ergebnis liegt außerhalb dieses Formelmodells. Prüfe Werte und Annahmen.',
      );
    const resultUnit = sought.units.find((entry) => entry.id === outputUnit)!;
    const converted = result / resultUnit.factor;
    if (!Number.isFinite(converted))
      throw new Error('Das Ergebnis ist in dieser Einheit nicht als endliche Zahl darstellbar.');
    const alternatives = sought.units
      .filter((unit) => unit.id !== outputUnit)
      .map((unit) => ({ value: result / unit.factor, unit: unit.id }))
      .filter((entry) => Number.isFinite(entry.value));
    steps.push(substitution);
    steps.push(`${sought.symbol} = ${formatFormulaNumber(converted, 8)} ${outputUnit}`);
    return {
      ok: true,
      value: converted,
      unit: outputUnit,
      label: sought.label,
      alternatives,
      steps,
    };
  } catch (reason) {
    return {
      ok: false,
      error: reason instanceof Error ? reason.message : 'Prüfe Werte und Einheiten.',
      invalidFields: [],
    };
  }
}
