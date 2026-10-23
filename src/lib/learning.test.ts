import { describe, expect, it } from 'vitest';
import { exercises, topics } from '../data';
import {
  createInitialState,
  getDueExercises,
  getMasteredIds,
  getStreak,
  getTodayCount,
  validateState,
} from './learning';
import type { Attempt, LearningState } from './learning';

function attempt(
  exerciseIndex: number,
  date: Date,
  correct = true,
  id = `${exerciseIndex}-${date.toISOString()}-${correct}`,
): Attempt {
  const exercise = exercises[exerciseIndex];
  const answer = correct
    ? exercise.correctIndex
    : (exercise.correctIndex + 1) % exercise.options.length;
  return { id, exerciseId: exercise.id, answer, correct, answeredAt: date.toISOString() };
}

function withAttempts(...attempts: Attempt[]): LearningState {
  return { ...createInitialState(), attempts };
}

describe('exercise catalogue', () => {
  it('retains 27 original tasks per topic and valid answer data for every new case', () => {
    const original = exercises.filter((exercise) => !exercise.id.startsWith('exam-'));
    expect(original).toHaveLength(108);
    expect(new Set(exercises.map((exercise) => exercise.id)).size).toBe(exercises.length);
    for (const topic of topics)
      expect(original.filter((exercise) => exercise.topicId === topic.id)).toHaveLength(27);
    for (const exercise of exercises) {
      expect(exercise.options[exercise.correctIndex]).toBeTruthy();
      expect(exercise.sourceLabel).toMatch(/Eigene (Modellaufgabe|Übungsaufgabe)/);
      expect(exercise.explanation.length).toBeGreaterThan(100);
    }
  });

  it('matches independently calculated physical and commercial model results', () => {
    const correctValue = (id: string): number => {
      const exercise = exercises.find((item) => item.id === id)!;
      return Number(
        exercise.options[exercise.correctIndex].match(/^\d+(?:,\d+)?/)![0].replace(',', '.'),
      );
    };
    expect(correctValue('heizung-waermemenge')).toBeCloseTo((120 * 4.18 * (55 - 15)) / 3_600, 2);
    expect(correctValue('heizung-volumenstrom')).toBe((8.4 / (4.2 * 10)) * 3_600);
    expect(correctValue('heizung-einheiten')).toBe((18 * 60) / 1_000);
    expect(correctValue('sanitaer-rohrinhalt')).toBeCloseTo(
      Math.PI * (0.02 / 2) ** 2 * 12 * 1_000,
      2,
    );
    expect(correctValue('sanitaer-durchfluss')).toBe((24 / 80) * 60);
    expect(correctValue('sanitaer-gefaelle')).toBe(0.015 * 6 * 100);
    expect(correctValue('klima-raumvolumen')).toBe(5 * 4 * 2.5);
    expect(correctValue('klima-luftwechsel')).toBe(150 / 75);
    expect(correctValue('klima-mischtemperatur')).toBe((20 + 30) / 2);
    expect(correctValue('wiso-preisrechnung')).toBe(Math.round(4 * 18.5 * 0.9 * 1.19 * 100) / 100);
    expect(correctValue('wiso-deckungsbeitrag')).toBe(210 - 135);
    expect(correctValue('wiso-prozentrechnung')).toBeCloseTo(24 * 1.075, 2);
  });
});

describe('progress import validation', () => {
  it('accepts the initial state and a complete valid export without retaining references', () => {
    const state = {
      ...withAttempts(attempt(0, new Date('2026-10-22T12:00:00.000Z'))),
      bookmarks: [exercises[0].id],
      dailyGoal: 5,
    };
    const parsed = validateState(JSON.parse(JSON.stringify(state)));
    expect(validateState(createInitialState())).toEqual(createInitialState());
    expect(parsed).toEqual(state);
    expect(parsed?.attempts).not.toBe(state.attempts);
  });

  it.each([
    null,
    [],
    'progress',
    {},
    { ...createInitialState(), version: 2 },
    { ...createInitialState(), extra: true },
    { ...createInitialState(), attempts: null },
    { ...createInitialState(), bookmarks: {} },
  ])('rejects malformed state %#', (state) => {
    expect(validateState(state)).toBeNull();
  });

  it.each([0, -1, 11, 2.5, '3', NaN, Infinity])('rejects invalid daily goal %s', (dailyGoal) => {
    expect(validateState({ ...createInitialState(), dailyGoal })).toBeNull();
  });

  it('rejects unknown tasks, out-of-range answers, and forged correctness flags', () => {
    const valid = attempt(0, new Date('2026-10-22T12:00:00.000Z'));
    for (const change of [
      { exerciseId: 'unknown-task' },
      { answer: -1 },
      { answer: 99 },
      { answer: 0.5 },
      { correct: false },
      { correct: 'true' },
      { id: ' ' },
      { id: 'a'.repeat(161) },
    ]) {
      expect(validateState(withAttempts({ ...valid, ...change } as Attempt))).toBeNull();
    }
  });

  it.each(['not-a-date', '2026-02-30T12:00:00.000Z', '2026-10-22', '2026-13-01T12:00:00.000Z'])(
    'rejects a malformed timestamp: %s',
    (answeredAt) => {
      const valid = attempt(0, new Date('2026-10-22T12:00:00.000Z'));
      expect(validateState(withAttempts({ ...valid, answeredAt }))).toBeNull();
    },
  );

  it('rejects duplicate attempt IDs and invalid bookmarks', () => {
    const valid = attempt(0, new Date('2026-10-22T12:00:00.000Z'));
    expect(validateState(withAttempts(valid, { ...valid }))).toBeNull();
    expect(validateState({ ...createInitialState(), bookmarks: ['unknown-task'] })).toBeNull();
    expect(
      validateState({ ...createInitialState(), bookmarks: [exercises[0].id, exercises[0].id] }),
    ).toBeNull();
  });

  it('rejects oversized histories and accepts the documented upper bound', () => {
    const valid = attempt(0, new Date('2026-10-22T12:00:00.000Z'));
    const attempts = Array.from({ length: 10_001 }, (_, index) => ({
      ...valid,
      id: `attempt-${index}`,
    }));
    expect(validateState(withAttempts(...attempts))).toBeNull();
    expect(validateState(withAttempts(...attempts.slice(0, 10_000)))?.attempts).toHaveLength(
      10_000,
    );
  });
});

describe('review and mastery', () => {
  const now = new Date('2026-10-22T12:00:00.000Z');

  it('does not present unseen tasks as due reviews or mastered tasks', () => {
    expect(getDueExercises(createInitialState(), now)).toEqual([]);
    expect(getMasteredIds(createInitialState())).toEqual([]);
  });

  it('makes wrong answers due immediately and correct answers after exactly 72 hours', () => {
    const state = withAttempts(
      attempt(0, new Date('2026-10-22T11:59:00.000Z'), false),
      attempt(1, new Date('2026-10-19T12:00:00.000Z')),
      attempt(2, new Date('2026-10-19T12:00:00.001Z')),
    );
    expect(getDueExercises(state, now).map((exercise) => exercise.id)).toEqual([
      exercises[0].id,
      exercises[1].id,
    ]);
    expect(getMasteredIds(state)).toEqual([exercises[1].id, exercises[2].id]);
  });

  it('uses chronological last answers rather than import array order', () => {
    const state = withAttempts(
      attempt(0, new Date('2026-10-22T11:00:00.000Z')),
      attempt(0, new Date('2026-10-20T11:00:00.000Z'), false),
      attempt(1, new Date('2026-10-20T11:00:00.000Z')),
      attempt(1, new Date('2026-10-22T11:00:00.000Z'), false),
    );
    expect(getMasteredIds(state)).toEqual([exercises[0].id]);
    expect(getDueExercises(state, now).map((exercise) => exercise.id)).toEqual([exercises[1].id]);
  });

  it('uses the later entry when two attempts have the same timestamp', () => {
    const state = withAttempts(attempt(0, now, true, 'first'), attempt(0, now, false, 'second'));
    expect(getMasteredIds(state)).toEqual([]);
    expect(getDueExercises(state, now).map((exercise) => exercise.id)).toEqual([exercises[0].id]);
  });
});

describe('local calendar progress', () => {
  it('counts distinct tasks today without rewarding repeated submissions', () => {
    const now = new Date(2026, 9, 22, 18);
    const state = withAttempts(
      attempt(0, new Date(2026, 9, 22, 1)),
      attempt(0, new Date(2026, 9, 22, 2), false),
      attempt(1, new Date(2026, 9, 22, 3)),
      attempt(2, new Date(2026, 9, 21, 23, 59, 59)),
      attempt(3, new Date(2026, 9, 23, 0)),
    );
    expect(getTodayCount(state, now)).toBe(2);
  });

  it('keeps yesterday’s streak while today has not been started', () => {
    const now = new Date(2026, 9, 22, 10);
    const state = withAttempts(
      attempt(0, new Date(2026, 9, 21, 22)),
      attempt(1, new Date(2026, 9, 20, 12)),
    );
    expect(getStreak(state, now)).toBe(2);
  });

  it('handles month/year boundaries and multiple attempts in one day', () => {
    const now = new Date(2027, 0, 1, 10);
    const state = withAttempts(
      attempt(0, new Date(2027, 0, 1, 9)),
      attempt(1, new Date(2027, 0, 1, 8)),
      attempt(0, new Date(2026, 11, 31, 22)),
      attempt(0, new Date(2026, 11, 30, 22)),
      attempt(0, new Date(2026, 11, 28, 22)),
    );
    expect(getStreak(state, now)).toBe(3);
  });

  it('returns zero after a missed day and for future-only records', () => {
    const now = new Date(2026, 9, 22, 10);
    expect(getStreak(withAttempts(attempt(0, new Date(2026, 9, 20, 22))), now)).toBe(0);
    expect(getStreak(withAttempts(attempt(0, new Date(2026, 9, 23, 9))), now)).toBe(0);
    expect(getStreak(createInitialState(), now)).toBe(0);
  });

  it('uses calendar-day steps across the European daylight-saving boundary', () => {
    const now = new Date(2026, 9, 26, 12);
    const state = withAttempts(
      attempt(0, new Date(2026, 9, 26, 10)),
      attempt(0, new Date(2026, 9, 25, 10)),
      attempt(0, new Date(2026, 9, 24, 10)),
    );
    expect(getStreak(state, now)).toBe(3);
  });
});
