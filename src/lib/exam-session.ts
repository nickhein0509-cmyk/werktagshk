import type { Exercise } from '../data';
import { getExerciseKind } from './exercise-kind';

/** A small practice selection, deliberately not an official examination paper. */
export function selectPracticeTasks(candidates: Exercise[], offset = 0, limit = 6): Exercise[] {
  if (!candidates.length) return [];
  const rotated = candidates.map((_, index) => candidates[(index + offset) % candidates.length]);
  const groups = ['calculation', 'context', 'knowledge'].map((kind) =>
    rotated.filter((task) => getExerciseKind(task) === kind),
  );
  const selected: Exercise[] = [];
  while (selected.length < Math.min(limit, candidates.length)) {
    for (const group of groups) {
      const task = group.shift();
      if (task && selected.length < limit) selected.push(task);
    }
  }
  return selected;
}

export function elapsedMilliseconds(
  startedAt: number,
  endedAt: number | null,
  now: number,
): number {
  return Math.max(0, (endedAt ?? now) - startedAt);
}

export function formatElapsed(milliseconds: number): string {
  const seconds = Math.floor(Math.max(0, milliseconds) / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return hours
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}
