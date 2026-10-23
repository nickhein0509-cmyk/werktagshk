import { describe, expect, it } from 'vitest';
import { exercises } from '../data';
import { transferExercises } from '../content/exam-transfer';
import { getExamAreas } from '../exam';
import { getExerciseKind, legacyExerciseKinds } from './exercise-kind';

describe('editorial exercise kinds', () => {
  it('assigns every catalogue entry explicitly without inferring its kind from copy or formula', () => {
    const knownIds = new Set(exercises.map(({ id }) => id));
    for (const task of exercises) {
      expect(task.kind ?? legacyExerciseKinds[task.id], task.id).toBeDefined();
    }
    expect(Object.keys(legacyExerciseKinds).every((id) => knownIds.has(id))).toBe(true);
    const conceptual = exercises.find(({ id }) => id === 'heizung-doppelte-masse-v1')!;
    expect(getExerciseKind({ ...conceptual, formula: 'Q = m · c · ΔT' })).toBe('knowledge');
    const arithmeticWithoutFormula = exercises.find(({ id }) => id === 'heizung-einheiten')!;
    expect(arithmeticWithoutFormula.formula).toBeUndefined();
    expect(getExerciseKind(arithmeticWithoutFormula)).toBe('calculation');
    expect(getExerciseKind(exercises.find(({ id }) => id === 'exam-si-schalthysterese')!)).toBe(
      'context',
    );
  });

  it('adds four original transfer tasks per written area with stable versions and all demand types', () => {
    expect(transferExercises).toHaveLength(12);
    for (const area of ['arbeitsplanung', 'systemanalyse', 'wiso'] as const) {
      expect(transferExercises.filter((task) => getExamAreas(task).includes(area))).toHaveLength(4);
    }
    expect(new Set(transferExercises.map(getExerciseKind))).toEqual(
      new Set(['calculation', 'context', 'knowledge']),
    );
    for (const task of transferExercises) {
      expect(task.id).toMatch(/-v1$/);
      expect(task.sourceLabel).toContain('Eigene Übungsaufgabe');
      expect(task.sourceLabel).toContain('Version 1');
      expect(task.sourceLabel).toContain('keine Originalprüfung');
      expect(new Set(task.options).size).toBe(4);
      expect(task.correctIndex).toBeGreaterThanOrEqual(0);
      expect(task.correctIndex).toBeLessThan(task.options.length);
    }
  });

  // Reference values derive from the exact stated models; see the independent
  // Decimal arithmetic and exhaustive allocation checks retained in docs/.
  it.each([
    ['exam-ap-speicher-mit-entnahme-v1', '56 min'],
    ['exam-ap-zuschnitt-schnittfuge-v1', 'Drei'],
    ['exam-si-energieprotokoll-v1', '8,40 kW und 80 %'],
    ['exam-si-widerstand-normieren-v1', 'gleich geblieben'],
    ['exam-wiso-engpassstunde-v1', '450 €'],
    ['exam-wiso-restzahlung-v1', '1 260 €'],
    ['exam-wiso-gewichtete-auswahl-v1', '72 Punkten gegenüber 70'],
  ])('matches the independently derived model result for %s', (id, answer) => {
    const task = transferExercises.find((candidate) => candidate.id === id)!;
    expect(task.options[task.correctIndex]).toContain(answer);
  });
});
