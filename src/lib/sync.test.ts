import { describe, expect, it } from 'vitest';
import { exercises } from '../data';
import { createInitialState } from './learning';
import type { Attempt, LearningState } from './learning';
import { mergeLearningStates } from './sync';

function makeAttempt(task = 0, id = `answer-${task}`): Attempt {
  const exercise = exercises[task];
  return {
    id,
    exerciseId: exercise.id,
    answer: exercise.correctIndex,
    correct: true,
    answeredAt: '2026-10-23T12:00:00.000Z',
  };
}
function withAttempts(...attempts: Attempt[]): LearningState {
  return { ...createInitialState(), attempts };
}
describe('cloud progress merge', () => {
  it('keeps local and remote attempts, deduplicates IDs and keeps local daily goal', () => {
    const shared = makeAttempt(0);
    const local = {
      ...withAttempts(shared, makeAttempt(1)),
      dailyGoal: 5,
      bookmarks: [exercises[0].id],
    };
    const remote = {
      ...withAttempts(shared, makeAttempt(2)),
      dailyGoal: 8,
      bookmarks: [exercises[1].id, exercises[0].id],
    };
    const localBefore = JSON.stringify(local),
      remoteBefore = JSON.stringify(remote);
    const merged = mergeLearningStates(local, remote);
    expect(merged.attempts).toHaveLength(3);
    expect(merged.attempts.map(({ id }) => id).sort()).toEqual([
      'answer-0',
      'answer-1',
      'answer-2',
    ]);
    expect(merged.bookmarks).toEqual([exercises[1].id, exercises[0].id]);
    expect(merged.dailyGoal).toBe(5);
    expect(JSON.stringify(local)).toBe(localBefore);
    expect(JSON.stringify(remote)).toBe(remoteBefore);
  });
  it('refuses conflicting answers under one identity without dropping either input', () => {
    const original = makeAttempt();
    const changed = { ...original, answeredAt: '2026-10-23T13:00:00.000Z' };
    expect(() => mergeLearningStates(withAttempts(original), withAttempts(changed))).toThrow(
      'Widersprüchliche Antworten',
    );
  });
  it('refuses merged state that would exceed the supported export limit', () => {
    const local = withAttempts(
      ...Array.from({ length: 6000 }, (_, i) => makeAttempt(0, `local-${i}`)),
    );
    const remote = withAttempts(
      ...Array.from({ length: 6000 }, (_, i) => makeAttempt(0, `remote-${i}`)),
    );
    expect(() => mergeLearningStates(local, remote)).toThrow('nicht verlustfrei');
  });
  it('does not invent attempts when both sources are empty', () => {
    expect(mergeLearningStates(createInitialState(), createInitialState())).toEqual(
      createInitialState(),
    );
  });
});
