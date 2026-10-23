import { describe, expect, it } from 'vitest';
import { exercises } from '../data';
import { getExerciseKind } from './exercise-kind';
import { elapsedMilliseconds, formatElapsed, selectPracticeTasks } from './exam-session';

describe('a timed practice round', () => {
  it('samples distinct tasks across the available learning demands', () => {
    const selected = selectPracticeTasks(exercises);
    expect(selected).toHaveLength(6);
    expect(new Set(selected.map((task) => task.id)).size).toBe(6);
    expect(new Set(selected.map(getExerciseKind))).toEqual(
      new Set(['calculation', 'context', 'knowledge']),
    );
    expect(selectPracticeTasks(exercises.slice(0, 2))).toHaveLength(2);
    expect(selectPracticeTasks([])).toEqual([]);
  });

  it('uses elapsed wall time and fixes it at hand-in rather than counting renders', () => {
    expect(elapsedMilliseconds(1_000, null, 7_550)).toBe(6_550);
    expect(elapsedMilliseconds(1_000, 7_550, 10_000_000)).toBe(6_550);
    expect(elapsedMilliseconds(2_000, null, 1_000)).toBe(0);
    expect(formatElapsed(65_900)).toBe('01:05');
    expect(formatElapsed(3_661_000)).toBe('01:01:01');
    expect(formatElapsed(-1)).toBe('00:00');
  });
});
