import { describe, expect, it } from 'vitest';
import {
  convertFormulaEntry,
  createFormulaDraft,
  formatFormulaNumber,
  formulaCatalog,
  getFormula,
  parseFormulaNumber,
  solveFormula,
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
  it('all eight formula drafts own their entries and have solvable initial examples', () => {
    expect(formulaCatalog).toHaveLength(8);
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
