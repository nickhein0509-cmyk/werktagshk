import { describe, expect, it } from 'vitest';
import { gradedExercises } from './exam-graded';

describe('original graded practice cases v1', () => {
  it('adds distinct new identities and explicit demand-based editorial levels in each written area', () => {
    expect(gradedExercises).toHaveLength(24);
    expect(new Set(gradedExercises.map((task) => task.id)).size).toBe(24);
    for (const prefix of ['exam-ap-graded-', 'exam-si-graded-', 'exam-wiso-graded-']) {
      expect(gradedExercises.filter((task) => task.id.startsWith(prefix))).toHaveLength(8);
    }
    expect(gradedExercises.filter((task) => task.kind === 'calculation')).toHaveLength(6);
    expect(gradedExercises.filter((task) => task.kind === 'context')).toHaveLength(14);
    expect(gradedExercises.filter((task) => task.kind === 'knowledge')).toHaveLength(4);
    expect(gradedExercises.filter((task) => task.difficulty === 4)).toHaveLength(4);
    for (const task of gradedExercises) {
      expect(task.id).toMatch(/-v1$/);
      expect(task.sourceLabel).toContain('Eigene Übungsaufgabe');
      expect(task.sourceLabel).toContain('Version 1');
      expect(task.sourceLabel).toContain('keine Originalprüfung');
      expect(task.difficulty).toBeGreaterThanOrEqual(1);
      expect(task.difficulty).toBeLessThanOrEqual(4);
      expect(task.difficultyReason?.trim().length).toBeGreaterThan(30);
      expect(task.options).toHaveLength(4);
      expect(new Set(task.options).size).toBe(4);
      expect(task.correctIndex).toBeGreaterThanOrEqual(0);
      expect(task.correctIndex).toBeLessThan(task.options.length);
    }
  });

  // Independently derived references use the supplied model values. The Python
  // Decimal calculations and exhaustive schedules/control traces are retained
  // separately in docs/exam-graded-calculations.json.
  it.each([
    ['exam-ap-graded-druckkraft-v1', '94,25 N'],
    ['exam-ap-graded-laengenaenderung-v1', '5,04 mm'],
    ['exam-ap-graded-personalablauf-v1', 'E 13–14 Uhr'],
    ['exam-ap-graded-oder-prueffall-v1', 'A falsch, B falsch, C wahr'],
    ['exam-si-graded-hydraulische-leistung-v1', '10 W'],
    ['exam-si-graded-massenstromverhaeltnis-v1', '45,0 °C'],
    [
      'exam-si-graded-pruefplanung-hypothesen-v1',
      'Antriebsrückmeldung und unabhängige Durchflussreferenz gemeinsam',
    ],
    ['exam-si-graded-hysterese-mindestzeit-v1', 'An – aus – an'],
    ['exam-wiso-graded-miete-kauf-v1', '14 Tagen'],
    ['exam-wiso-graded-ruestzeit-serie-v1', '12 Stück'],
    ['exam-wiso-graded-auftragsmix-liquiditaet-v1', 'B und C mit 460'],
  ])('keeps the independently derived answer for %s', (id, expected) => {
    const task = gradedExercises.find((entry) => entry.id === id)!;
    expect(task.options[task.correctIndex]).toContain(expected);
  });
});
