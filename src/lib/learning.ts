import { exercises } from '../data';
import type { Exercise } from '../data';

export interface Attempt {
  id: string;
  exerciseId: string;
  answer: number;
  correct: boolean;
  answeredAt: string;
}

export interface LearningState {
  version: 1;
  attempts: Attempt[];
  bookmarks: string[];
  dailyGoal: number;
}

const exerciseById = new Map(exercises.map((exercise) => [exercise.id, exercise]));
const reviewDelayMs = 3 * 24 * 60 * 60 * 1_000;

export function createInitialState(): LearningState {
  return { version: 1, attempts: [], bookmarks: [], dailyGoal: 3 };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: string[]): boolean {
  return (
    Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key))
  );
}

function isCanonicalTimestamp(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value))
    return false;
  const timestamp = new Date(value);
  return Number.isFinite(timestamp.getTime()) && timestamp.toISOString() === value;
}

/** Validate a version-1 export before replacing browser-local progress. */
export function validateState(value: unknown): LearningState | null {
  if (!isRecord(value) || !hasOnlyKeys(value, ['version', 'attempts', 'bookmarks', 'dailyGoal']))
    return null;
  if (value.version !== 1 || !Array.isArray(value.attempts) || value.attempts.length > 10_000)
    return null;
  if (!Array.isArray(value.bookmarks) || value.bookmarks.length > exercises.length) return null;
  if (
    typeof value.dailyGoal !== 'number' ||
    !Number.isInteger(value.dailyGoal) ||
    value.dailyGoal < 1 ||
    value.dailyGoal > 10
  )
    return null;

  const seenAttemptIds = new Set<string>();
  const attempts: Attempt[] = [];
  for (const item of value.attempts) {
    if (
      !isRecord(item) ||
      !hasOnlyKeys(item, ['id', 'exerciseId', 'answer', 'correct', 'answeredAt'])
    )
      return null;
    if (
      typeof item.id !== 'string' ||
      item.id.trim().length === 0 ||
      item.id.length > 160 ||
      seenAttemptIds.has(item.id)
    )
      return null;
    if (typeof item.exerciseId !== 'string') return null;
    const exercise = exerciseById.get(item.exerciseId);
    if (
      !exercise ||
      typeof item.answer !== 'number' ||
      !Number.isInteger(item.answer) ||
      item.answer < 0 ||
      item.answer >= exercise.options.length
    )
      return null;
    if (
      typeof item.correct !== 'boolean' ||
      item.correct !== (item.answer === exercise.correctIndex)
    )
      return null;
    if (!isCanonicalTimestamp(item.answeredAt)) return null;
    seenAttemptIds.add(item.id);
    attempts.push({
      id: item.id,
      exerciseId: item.exerciseId,
      answer: item.answer,
      correct: item.correct,
      answeredAt: item.answeredAt,
    });
  }

  const bookmarks: string[] = [];
  for (const bookmark of value.bookmarks) {
    if (typeof bookmark !== 'string' || !exerciseById.has(bookmark) || bookmarks.includes(bookmark))
      return null;
    bookmarks.push(bookmark);
  }

  return { version: 1, attempts, bookmarks, dailyGoal: value.dailyGoal };
}

function latestAttempts(state: LearningState): Map<string, Attempt> {
  const latest = new Map<string, Attempt>();
  for (const attempt of state.attempts) {
    const previous = latest.get(attempt.exerciseId);
    if (!previous || Date.parse(attempt.answeredAt) >= Date.parse(previous.answeredAt))
      latest.set(attempt.exerciseId, attempt);
  }
  return latest;
}

/** An unseen task is new work, not a due review. A correct answer is reviewed after 72 hours. */
export function getDueExercises(state: LearningState, now = new Date()): Exercise[] {
  const latest = latestAttempts(state);
  return exercises
    .filter((exercise) => {
      const attempt = latest.get(exercise.id);
      return (
        attempt !== undefined &&
        (!attempt.correct || now.getTime() - Date.parse(attempt.answeredAt) >= reviewDelayMs)
      );
    })
    .sort((a, b) => {
      const attemptA = latest.get(a.id)!;
      const attemptB = latest.get(b.id)!;
      return (
        Number(attemptA.correct) - Number(attemptB.correct) ||
        Date.parse(attemptA.answeredAt) - Date.parse(attemptB.answeredAt)
      );
    });
}

function localDayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/** Count distinct tasks worked on today; repeated submissions do not inflate the daily goal. */
export function getTodayCount(state: LearningState, now = new Date()): number {
  const today = localDayKey(now);
  return new Set(
    state.attempts
      .filter((attempt) => localDayKey(new Date(attempt.answeredAt)) === today)
      .map((attempt) => attempt.exerciseId),
  ).size;
}

/** Count consecutive local calendar days, allowing an unfinished current day. */
export function getStreak(state: LearningState, now = new Date()): number {
  const activeDays = new Set(
    state.attempts.map((attempt) => localDayKey(new Date(attempt.answeredAt))),
  );
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  if (!activeDays.has(localDayKey(cursor))) cursor.setDate(cursor.getDate() - 1);

  let streak = 0;
  while (activeDays.has(localDayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** A task is currently mastered when its most recent recorded answer is correct. */
export function getMasteredIds(state: LearningState): string[] {
  const latest = latestAttempts(state);
  return exercises
    .filter((exercise) => latest.get(exercise.id)?.correct === true)
    .map((exercise) => exercise.id);
}
