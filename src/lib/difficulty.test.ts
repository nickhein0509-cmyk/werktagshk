import { describe, expect, it } from 'vitest';
import { exercises, type Exercise } from '../data';
import { getExerciseKind } from './exercise-kind';
import {
  compareExerciseDifficulty,
  difficultyLevels,
  getExerciseDifficulty,
  legacyDifficultyAssessments,
  type DifficultyLevel,
} from './difficulty';

function task(id: string): Exercise {
  const found = exercises.find((exercise) => exercise.id === id);
  if (!found) throw new Error(`Missing exercise ${id}`);
  return found;
}

function withLevel(id: string, level: DifficultyLevel): Exercise {
  return {
    ...task('wiso-deckungsbeitrag'),
    id,
    difficulty: level,
    difficultyReason: 'Für diesen Test ausdrücklich redaktionell eingestuft.',
  };
}

describe('editorial difficulty for original exercises', () => {
  it('covers the 180 reviewed existing identities and requires evidence for every current entry', () => {
    const knownIds = new Set(exercises.map(({ id }) => id));
    expect(Object.keys(legacyDifficultyAssessments)).toHaveLength(180);
    expect(Object.keys(legacyDifficultyAssessments).every((id) => knownIds.has(id))).toBe(true);
    for (const exercise of exercises) {
      const assessment = getExerciseDifficulty(exercise);
      expect(assessment, exercise.id).not.toBeNull();
      expect(assessment?.source, exercise.id).toBe('editorial');
      expect(assessment?.reason.trim().length, exercise.id).toBeGreaterThan(20);
      expect(
        difficultyLevels.some(({ id }) => id === assessment?.level),
        exercise.id,
      ).toBe(true);
    }
  });

  it('distinguishes demands within calculation tasks rather than grading their answer format', () => {
    const examples = [
      ['wiso-deckungsbeitrag', 1],
      ['wiso-preisrechnung', 2],
      ['exam-wiso-gewichtete-auswahl-v1', 3],
      ['exam-wiso-engpassstunde-v1', 4],
    ] as const;
    for (const [id, expected] of examples) {
      expect(getExerciseKind(task(id))).toBe('calculation');
      expect(getExerciseDifficulty(task(id))?.level).toBe(expected);
    }
  });

  it('keeps a pure numerical variant at the reviewed family demand', () => {
    for (const family of ['heizung-heizzeit', 'sanitaer-mischwasser', 'wiso-stundenkosten']) {
      const variants = [1, 2, 3].map((variant) => task(`${family}-v1-${variant}`));
      expect(new Set(variants.map((exercise) => exercise.context)).size).toBeGreaterThan(1);
      expect(new Set(variants.map((exercise) => getExerciseDifficulty(exercise)?.level)).size).toBe(
        1,
      );
      expect(
        new Set(variants.map((exercise) => getExerciseDifficulty(exercise)?.reason)).size,
      ).toBe(1);
    }
  });

  it('does not infer an unknown task from its old demand label, formula or copied wording', () => {
    const unknown = { ...task('exam-wiso-engpassstunde-v1'), id: 'unreviewed-copy' };
    expect(unknown.level).toBe('Anwenden');
    expect(unknown.formula).toBeDefined();
    expect(getExerciseDifficulty(unknown)).toBeNull();
    expect(getExerciseDifficulty({ ...unknown, id: 'toString' })).toBeNull();
  });

  it('requires an explicit level and meaningful reason together for newly reviewed content', () => {
    const reviewed = withLevel('new-reviewed-task', 3);
    expect(getExerciseDifficulty(reviewed)).toEqual({
      level: 3,
      reason: reviewed.difficultyReason,
      source: 'editorial',
    });
    expect(getExerciseDifficulty({ ...reviewed, difficultyReason: '  ' })).toBeNull();
    expect(getExerciseDifficulty({ ...reviewed, difficulty: undefined })).toBeNull();
    expect(getExerciseDifficulty({ ...reviewed, difficultyReason: undefined })).toBeNull();
    expect(getExerciseDifficulty({ ...reviewed, difficulty: 5 } as unknown as Exercise)).toBeNull();
    expect(
      getExerciseDifficulty({ ...task('wiso-deckungsbeitrag'), difficultyReason: '  ' }),
    ).toBeNull();
  });

  it('orders both ways, keeps equal levels stable and leaves ungraded tasks last', () => {
    const input = [
      withLevel('transfer-first', 3),
      { ...task('wiso-deckungsbeitrag'), id: 'ungraded' },
      withLevel('entry', 1),
      withLevel('transfer-second', 3),
      withLevel('networked', 4),
    ];
    expect([...input].sort(compareExerciseDifficulty).map(({ id }) => id)).toEqual([
      'entry',
      'transfer-first',
      'transfer-second',
      'networked',
      'ungraded',
    ]);
    expect(
      [...input].sort((a, b) => compareExerciseDifficulty(a, b, 'desc')).map(({ id }) => id),
    ).toEqual(['networked', 'transfer-first', 'transfer-second', 'entry', 'ungraded']);
  });

  it('leaves task identities, content and answer keys unchanged while assessing and comparing', () => {
    const original = task('exam-ap-zuschnitt-schnittfuge-v1');
    const before = JSON.stringify(original);
    getExerciseDifficulty(original);
    compareExerciseDifficulty(original, task('sanitaer-rohrinhalt'));
    expect(JSON.stringify(original)).toBe(before);
  });
});
