import { describe, expect, it } from 'vitest';
import {
  convertFormulaEntry,
  createFormulaDraft,
  filterFormulas,
  formatFormulaNumber,
  formulaCatalog,
  formulaGroups,
  getFormula,
  getFormulaGroup,
  parseFormulaNumber,
  solveFormula,
  supportedFormulaTargets,
} from './formulas';
import type { FormulaEntry, FormulaId } from './formulas';

function calculate(
  id: FormulaId,
  target: string,
  entries: Record<string, [string, string]>,
  output: string,
) {
  const values: Record<string, FormulaEntry> = Object.fromEntries(
    Object.entries(entries).map(([key, [text, unit]]) => [key, { text, unit }]),
  );
  return solveFormula(id, target, values, output);
}

describe('SHK formula models and independently worked references', () => {
  it('suppresses floating-point noise in displayed worked steps without changing the solved value', () => {
    expect(formatFormulaNumber(20900.000000000004, 8)).toBe('20.900');
    expect(formatFormulaNumber(0.30000000000000004, 8)).toBe('0,3');
  });

  it('keeps full numerical precision when a computed energy becomes a known inverse input', () => {
    const forward = calculate('heat', 'energy', { mass: ['250', 'kg'], delta: ['20', 'K'] }, 'kWh');
    expect(forward.ok).toBe(true);
    if (!forward.ok) return;
    const inverse = calculate(
      'heat',
      'mass',
      { energy: [forward.value.toString(), 'kWh'], delta: ['20', 'K'] },
      'kg',
    );
    expect(inverse.ok && inverse.value).toBeCloseTo(250, 10);
    expect(inverse.ok && inverse.steps[0]).toContain('20.900 kJ');
  });
  it.each([
    ['heat', 'energy', { mass: ['100', 'kg'], delta: ['20', 'K'] }, 'kJ', 8360],
    ['heat', 'mass', { energy: ['20064', 'kJ'], delta: ['40', 'K'] }, 'kg', 120],
    ['heat', 'delta', { energy: ['5,573333333333333', 'kWh'], mass: ['120', 'kg'] }, 'K', 40],
    ['power', 'power', { flow: ['0,72', 'm³/h'], delta: ['10', 'K'] }, 'kW', 8.36],
    ['power', 'flow', { power: ['8,36', 'kW'], delta: ['10', 'K'] }, 'l/h', 720],
    ['power', 'delta', { power: ['8360', 'W'], flow: ['0,2', 'l/s'] }, 'K', 10],
    ['flow', 'flow', { volume: ['24', 'l'], time: ['80', 's'] }, 'l/min', 18],
    ['flow', 'volume', { flow: ['1,08', 'm³/h'], time: ['80', 's'] }, 'l', 24],
    ['flow', 'time', { volume: ['24', 'l'], flow: ['0,3', 'l/s'] }, 's', 80],
    ['air-change', 'rate', { flow: ['150', 'm³/h'], volume: ['75', 'm³'] }, 'h⁻¹', 2],
    ['air-change', 'flow', { rate: ['2', 'h⁻¹'], volume: ['75', 'm³'] }, 'l/s', 125 / 3],
    ['air-change', 'volume', { flow: ['41,66666666666667', 'l/s'], rate: ['2', 'h⁻¹'] }, 'm³', 75],
    ['slope', 'slope', { height: ['90', 'mm'], length: ['6', 'm'] }, '%', 1.5],
    ['slope', 'height', { slope: ['1,5', '%'], length: ['600', 'cm'] }, 'mm', 90],
    ['slope', 'length', { slope: ['1,5', '%'], height: ['9', 'cm'] }, 'mm', 6000],
    [
      'pipe-volume',
      'volume',
      { diameter: ['20', 'mm'], length: ['12', 'm'] },
      'l',
      3.7699111843077517,
    ],
    [
      'pipe-volume',
      'diameter',
      { volume: ['3,7699111843077517', 'l'], length: ['1200', 'cm'] },
      'mm',
      20,
    ],
    [
      'pipe-volume',
      'length',
      { volume: ['0,0037699111843077517', 'm³'], diameter: ['2', 'cm'] },
      'm',
      12,
    ],
    ['heating-time', 'time', { energy: ['15048', 'kJ'], power: ['4,5', 'kW'] }, 's', 3344],
    ['heating-time', 'energy', { power: ['4500', 'W'], time: ['3344', 's'] }, 'kWh', 4.18],
    ['heating-time', 'power', { energy: ['15048', 'kJ'], time: ['3344', 's'] }, 'W', 4500],
    ['efficiency', 'efficiency', { useful: ['28800', 'kJ'], input: ['10', 'kWh'] }, '%', 80],
    ['efficiency', 'useful', { efficiency: ['80', '%'], input: ['36000', 'kJ'] }, 'kWh', 8],
    ['efficiency', 'input', { efficiency: ['80', '%'], useful: ['8', 'kWh'] }, 'kJ', 36000],
  ] as [FormulaId, string, Record<string, [string, string]>, string, number][])(
    '%s solves %s with actual unit conversions',
    (id, target, entries, unit, expected) => {
      const result = calculate(id, target, entries, unit);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeCloseTo(expected, 8);
        expect(result.unit).toBe(unit);
        expect(result.steps.at(-1)).toContain(unit);
      }
    },
  );

  it('keeps the existing water example and a legitimate zero temperature rise', () => {
    const draft = createFormulaDraft('heat');
    const result = solveFormula('heat', draft.target, draft.entries, 'kWh');
    expect(result.ok && result.value).toBeCloseTo(2.3222222222222224);
    const zero = calculate('heat', 'energy', { mass: ['10', 'kg'], delta: ['0', 'K'] }, 'kWh');
    expect(zero.ok && zero.value).toBe(0);
  });

  it.each([
    ['heat', 'mass', { energy: ['0', 'kJ'], delta: ['0', 'K'] }, 'kg'],
    ['power', 'flow', { power: ['8', 'kW'], delta: ['0', 'K'] }, 'l/h'],
    ['power', 'delta', { power: ['8', 'kW'], flow: ['0', 'l/h'] }, 'K'],
    ['flow', 'time', { volume: ['0', 'l'], flow: ['0', 'l/min'] }, 's'],
    ['air-change', 'volume', { flow: ['0', 'm³/h'], rate: ['0', 'h⁻¹'] }, 'm³'],
    ['slope', 'length', { slope: ['0', '%'], height: ['0', 'm'] }, 'm'],
    ['pipe-volume', 'length', { volume: ['1', 'l'], diameter: ['0', 'mm'] }, 'm'],
    ['heating-time', 'time', { energy: ['0', 'kWh'], power: ['0', 'kW'] }, 'min'],
    ['efficiency', 'input', { efficiency: ['0', '%'], useful: ['0', 'kWh'] }, 'kWh'],
  ] as [FormulaId, string, Record<string, [string, string]>, string][])(
    '%s rejects an undefined %s inverse',
    (id, target, entries, unit) => {
      expect(calculate(id, target, entries, unit).ok).toBe(false);
    },
  );

  it('enforces the limited water model and common energy balance instead of clamping', () => {
    expect(calculate('heat', 'energy', { mass: ['-1', 'kg'], delta: ['20', 'K'] }, 'kWh').ok).toBe(
      false,
    );
    expect(calculate('heat', 'delta', { mass: ['1', 'kg'], energy: ['1000', 'kJ'] }, 'K').ok).toBe(
      false,
    );
    expect(
      calculate('efficiency', 'efficiency', { useful: ['11', 'kWh'], input: ['10', 'kWh'] }, '%')
        .ok,
    ).toBe(false);
    expect(
      calculate('efficiency', 'useful', { efficiency: ['120', '%'], input: ['10', 'kWh'] }, 'kWh')
        .ok,
    ).toBe(false);
    const zero = calculate(
      'efficiency',
      'efficiency',
      { useful: ['0', 'kWh'], input: ['10', 'kWh'] },
      '%',
    );
    expect(zero.ok && zero.value).toBe(0);
  });

  it('normalizes percent as a dimensionless fraction in the worked steps', () => {
    const result = calculate(
      'efficiency',
      'useful',
      { efficiency: ['80', '%'], input: ['10', 'kWh'] },
      'kWh',
    );
    expect(result.ok && result.steps[0]).toBe('η = 80 % = 0,8 Anteil');
  });

  it('changing an input unit retains the physical quantity and comma syntax', () => {
    const volume = getFormula('flow').variables.find((entry) => entry.id === 'volume')!;
    const cubic = convertFormulaEntry(volume, { text: '24', unit: 'l' }, 'm³');
    expect(cubic).toEqual({ text: '0,024', unit: 'm³' });
    expect(convertFormulaEntry(volume, cubic, 'l')).toEqual({ text: '24', unit: 'l' });
    expect(convertFormulaEntry(volume, { text: '', unit: 'l' }, 'm³')).toEqual({
      text: '',
      unit: 'm³',
    });
  });

  it.each(['', 'NaN', 'Infinity', '0x10', '1 000', '1.000,5', '2+3', '1e309'])(
    'rejects ambiguous or non-finite input: %s',
    (input) => {
      expect(parseFormulaNumber(input)).toBeNull();
    },
  );
  it('accepts decimal commas, decimal points and finite scientific notation', () => {
    expect(parseFormulaNumber(' 10,5 ')).toBe(10.5);
    expect(parseFormulaNumber('.5')).toBe(0.5);
    expect(parseFormulaNumber('1e-3')).toBe(0.001);
  });
  it('rejects unsupported units and overflow without NaN result text', () => {
    expect(calculate('heat', 'energy', { mass: ['1', 'lb'], delta: ['20', 'K'] }, 'kWh').ok).toBe(
      false,
    );
    expect(
      calculate('heat', 'energy', { mass: ['1e308', 'kg'], delta: ['100', 'K'] }, 'kWh').ok,
    ).toBe(false);
    expect(calculate('heat', 'energy', { mass: ['1', 'kg'], delta: ['20', 'K'] }, 'MJ').ok).toBe(
      false,
    );
  });
  it('all formula drafts own their entries and have solvable initial examples', () => {
    expect(formulaCatalog).toHaveLength(21);
    const first = createFormulaDraft('heat');
    first.entries.mass.text = '999';
    expect(createFormulaDraft('heat').entries.mass.text).toBe('100');
    for (const formula of formulaCatalog) {
      const draft = createFormulaDraft(formula.id);
      expect(
        solveFormula(formula.id, draft.target, draft.entries, draft.outputUnits[draft.target]).ok,
      ).toBe(true);
    }
  });
});

describe('expanded SHK models with independently worked numerical references', () => {
  it.each([
    ['flow-velocity', 'flow', { area: ['600', 'cm²'], velocity: ['2,5', 'm/s'] }, 'm³/h', 540],
    ['flow-velocity', 'area', { flow: ['150', 'l/s'], velocity: ['2,5', 'm/s'] }, 'cm²', 600],
    ['flow-velocity', 'velocity', { flow: ['540', 'm³/h'], area: ['60000', 'mm²'] }, 'm/s', 2.5],
    ['circle-area', 'area', { diameter: ['2', 'cm'] }, 'mm²', 314.1592653589793],
    ['circle-area', 'diameter', { area: ['3,141592653589793', 'cm²'] }, 'mm', 20],
    [
      'room-volume',
      'volume',
      { length: ['300', 'cm'], width: ['4000', 'mm'], height: ['2,5', 'm'] },
      'l',
      30000,
    ],
    [
      'room-volume',
      'length',
      { volume: ['30000', 'l'], width: ['4', 'm'], height: ['250', 'cm'] },
      'cm',
      300,
    ],
    [
      'room-volume',
      'width',
      { volume: ['30', 'm³'], length: ['3000', 'mm'], height: ['2,5', 'm'] },
      'm',
      4,
    ],
    [
      'room-volume',
      'height',
      { volume: ['30', 'm³'], length: ['3', 'm'], width: ['400', 'cm'] },
      'mm',
      2500,
    ],
    [
      'hydrostatic-pressure',
      'pressure',
      { density: ['0,8', 'kg/l'], height: ['1250', 'cm'] },
      'bar',
      0.981,
    ],
    [
      'hydrostatic-pressure',
      'density',
      { pressure: ['98,1', 'kPa'], height: ['12,5', 'm'] },
      'kg/l',
      0.8,
    ],
    [
      'hydrostatic-pressure',
      'height',
      { pressure: ['0,981', 'bar'], density: ['800', 'kg/m³'] },
      'm',
      12.5,
    ],
    ['hydraulic-power', 'power', { pressure: ['1,2', 'bar'], flow: ['36', 'l/min'] }, 'W', 72],
    ['hydraulic-power', 'pressure', { power: ['0,072', 'kW'], flow: ['2,16', 'm³/h'] }, 'bar', 1.2],
    ['hydraulic-power', 'flow', { power: ['72', 'W'], pressure: ['120', 'kPa'] }, 'l/min', 36],
    ['heat-pump-cop', 'cop', { heating: ['14000', 'W'], electric: ['3,5', 'kW'] }, '1', 4],
    ['heat-pump-cop', 'heating', { cop: ['4', '1'], electric: ['3500', 'W'] }, 'kW', 14],
    ['heat-pump-cop', 'electric', { cop: ['4', '1'], heating: ['14', 'kW'] }, 'W', 3500],
    [
      'thermal-expansion',
      'expansion',
      { length: ['18', 'm'], alpha: ['0,017', 'mm/(m·K)'], delta: ['40', 'K'] },
      'mm',
      12.24,
    ],
    [
      'thermal-expansion',
      'length',
      { expansion: ['1,224', 'cm'], alpha: ['17', '10⁻⁶/K'], delta: ['40', 'K'] },
      'm',
      18,
    ],
    [
      'thermal-expansion',
      'alpha',
      { expansion: ['12,24', 'mm'], length: ['1800', 'cm'], delta: ['40', 'K'] },
      'mm/(m·K)',
      0.017,
    ],
    [
      'thermal-expansion',
      'delta',
      { expansion: ['0,01224', 'm'], length: ['18', 'm'], alpha: ['0,000017', '1/K'] },
      'K',
      40,
    ],
    [
      'mixing-temperature',
      'mixed',
      { first: ['10', '°C'], second: ['40', '°C'], mass1: ['7200', 'kg/h'], mass2: ['3', 'kg/s'] },
      '°C',
      28,
    ],
    [
      'mixing-temperature',
      'first',
      { mixed: ['28', '°C'], second: ['40', '°C'], mass1: ['2', 'kg/s'], mass2: ['10800', 'kg/h'] },
      '°C',
      10,
    ],
    [
      'mixing-temperature',
      'second',
      { mixed: ['28', '°C'], first: ['10', '°C'], mass1: ['2', 'kg/s'], mass2: ['3', 'kg/s'] },
      '°C',
      40,
    ],
    ['ohm', 'voltage', { resistance: ['0,008', 'kΩ'], current: ['1500', 'mA'] }, 'V', 12],
    ['ohm', 'resistance', { voltage: ['12000', 'mV'], current: ['2', 'A'] }, 'kΩ', 0.006],
    ['ohm', 'current', { voltage: ['0,012', 'kV'], resistance: ['6', 'Ω'] }, 'mA', 2000],
    ['electric-power', 'power', { voltage: ['24000', 'mV'], current: ['125', 'mA'] }, 'W', 3],
    ['electric-power', 'voltage', { power: ['0,003', 'kW'], current: ['0,125', 'A'] }, 'V', 24],
    ['electric-power', 'current', { power: ['3', 'W'], voltage: ['0,024', 'kV'] }, 'mA', 125],
    ['pressure-force', 'force', { pressure: ['2,5', 'bar'], area: ['80', 'cm²'] }, 'kN', 2],
    ['pressure-force', 'pressure', { force: ['2000', 'N'], area: ['8000', 'mm²'] }, 'kPa', 250],
    ['pressure-force', 'area', { force: ['2', 'kN'], pressure: ['250000', 'Pa'] }, 'cm²', 80],
    ['mass-flow', 'mass', { density: ['1,2', 'kg/m³'], flow: ['300', 'm³/h'] }, 'kg/h', 360],
    [
      'mass-flow',
      'density',
      { mass: ['0,1', 'kg/s'], flow: ['83,33333333333333', 'l/s'] },
      'kg/m³',
      1.2,
    ],
    ['mass-flow', 'flow', { mass: ['360', 'kg/h'], density: ['0,0012', 'kg/l'] }, 'm³/h', 300],
    ['air-power', 'power', { flow: ['125', 'l/s'], delta: ['18', 'K'] }, 'kW', 2.754],
    ['air-power', 'flow', { power: ['2754', 'W'], delta: ['18', 'K'] }, 'l/s', 125],
    ['air-power', 'delta', { power: ['2,754', 'kW'], flow: ['450', 'm³/h'] }, 'K', 18],
  ] as [FormulaId, string, Record<string, [string, string]>, string, number][])(
    '%s independently solves %s including unit conversions',
    (id, target, entries, unit, expected) => {
      const result = calculate(id, target, entries, unit);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value).toBeCloseTo(expected, 8);
      expect(result.unit).toBe(unit);
      expect(result.steps.at(-1)).toContain(unit);
    },
  );

  it.each([
    ['flow-velocity', 'area', { flow: ['0', 'm³/h'], velocity: ['0', 'm/s'] }, 'm²'],
    ['hydrostatic-pressure', 'density', { pressure: ['0', 'Pa'], height: ['0', 'm'] }, 'kg/m³'],
    ['hydraulic-power', 'flow', { power: ['0', 'W'], pressure: ['0', 'bar'] }, 'm³/h'],
    ['heat-pump-cop', 'cop', { heating: ['12', 'kW'], electric: ['0', 'kW'] }, '1'],
    ['heat-pump-cop', 'electric', { heating: ['0', 'kW'], cop: ['0', '1'] }, 'kW'],
    [
      'thermal-expansion',
      'length',
      { expansion: ['0', 'mm'], alpha: ['12', '10⁻⁶/K'], delta: ['0', 'K'] },
      'm',
    ],
    [
      'mixing-temperature',
      'mixed',
      { first: ['10', '°C'], second: ['40', '°C'], mass1: ['0', 'kg/s'], mass2: ['1', 'kg/s'] },
      '°C',
    ],
    ['ohm', 'resistance', { voltage: ['0', 'V'], current: ['0', 'A'] }, 'Ω'],
    ['electric-power', 'current', { power: ['0', 'W'], voltage: ['0', 'V'] }, 'A'],
    ['pressure-force', 'area', { force: ['0', 'N'], pressure: ['0', 'Pa'] }, 'm²'],
    ['mass-flow', 'density', { mass: ['0', 'kg/s'], flow: ['0', 'm³/s'] }, 'kg/m³'],
    ['air-power', 'flow', { power: ['0', 'W'], delta: ['0', 'K'] }, 'm³/h'],
  ] as [FormulaId, string, Record<string, [string, string]>, string][])(
    '%s rejects undefined or out-of-domain %s',
    (id, target, entries, unit) => expect(calculate(id, target, entries, unit).ok).toBe(false),
  );

  it('accepts physically meaningful zero outputs without clamping or division', () => {
    expect(
      calculate(
        'hydrostatic-pressure',
        'pressure',
        { density: ['1000', 'kg/m³'], height: ['0', 'm'] },
        'Pa',
      ),
    ).toMatchObject({ ok: true, value: 0 });
    expect(
      calculate(
        'thermal-expansion',
        'expansion',
        { length: ['10', 'm'], alpha: ['12', '10⁻⁶/K'], delta: ['0', 'K'] },
        'mm',
      ),
    ).toMatchObject({ ok: true, value: 0 });
    expect(
      calculate('ohm', 'voltage', { resistance: ['6', 'Ω'], current: ['0', 'A'] }, 'V'),
    ).toMatchObject({ ok: true, value: 0 });
    expect(
      calculate('air-power', 'power', { flow: ['0', 'm³/h'], delta: ['20', 'K'] }, 'W'),
    ).toMatchObject({ ok: true, value: 0 });
  });

  it('keeps Celsius offsets out of mass weights and rejects impossible absolute temperatures', () => {
    const known = {
      first: ['-10', '°C'],
      second: ['20', '°C'],
      mass1: ['2', 'kg/s'],
      mass2: ['1', 'kg/s'],
    } satisfies Record<string, [string, string]>;
    expect(calculate('mixing-temperature', 'mixed', known, '°C')).toMatchObject({
      ok: true,
      value: 0,
    });
    expect(
      calculate('mixing-temperature', 'mixed', { ...known, first: ['-274', '°C'] }, '°C').ok,
    ).toBe(false);
    expect(
      calculate(
        'mixing-temperature',
        'first',
        { mixed: ['-273', '°C'], second: ['20', '°C'], mass1: ['1', 'kg/s'], mass2: ['1', 'kg/s'] },
        '°C',
      ).ok,
    ).toBe(false);
    expect(
      supportedFormulaTargets(getFormula('mixing-temperature')).map((entry) => entry.id),
    ).toEqual(['mixed', 'first', 'second']);
    const draft = createFormulaDraft('mixing-temperature');
    expect(solveFormula('mixing-temperature', 'mass1', draft.entries, 'kg/s').ok).toBe(false);
  });

  it('supports all 64 declared rearrangements and their output units', () => {
    expect(formulaCatalog.flatMap(supportedFormulaTargets)).toHaveLength(64);
    for (const formula of formulaCatalog) {
      const draft = createFormulaDraft(formula.id);
      for (const target of supportedFormulaTargets(formula)) {
        for (const unit of target.units) {
          const result = solveFormula(formula.id, target.id, draft.entries, unit.id);
          expect(result.ok, `${formula.id}/${target.id}/${unit.id}`).toBe(true);
          if (result.ok) expect(Number.isFinite(result.value)).toBe(true);
        }
      }
    }
  });

  it('groups every model exactly once and searches labels, symbols and multiple terms', () => {
    const groups = formulaGroups.flatMap((group) => filterFormulas(group.id, ''));
    expect(new Set(groups.map((entry) => entry.id)).size).toBe(21);
    expect(groups).toHaveLength(21);
    expect(getFormulaGroup('heat-pump-cop')).toBe('thermal');
    expect(filterFormulas('all', '  COP  ').map((entry) => entry.id)).toEqual(['heat-pump-cop']);
    expect(filterFormulas('electrical', 'Spannung Stromstärke').map((entry) => entry.id)).toEqual([
      'ohm',
      'electric-power',
    ]);
    expect(filterFormulas('geometry', 'Druck')).toEqual([]);
    expect(filterFormulas('all', 'gibtkeineformel')).toEqual([]);
  });
});
