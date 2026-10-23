export type FormulaId =
  | 'heat'
  | 'power'
  | 'flow'
  | 'air-change'
  | 'slope'
  | 'pipe-volume'
  | 'heating-time'
  | 'efficiency';

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
];

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
  if (!sought || !sought.units.some((unit) => unit.id === outputUnit))
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
          : `${field.label}: Bitte ${field.positive ? 'einen positiven' : 'einen nicht negativen'} endlichen Wert${field.maximum !== undefined ? ` bis ${formatFormulaNumber(field.maximum / (unit?.factor ?? 1))} ${unit?.id ?? field.initialUnit}` : ''} eingeben.`,
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
