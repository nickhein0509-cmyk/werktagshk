// Reconstructed from deployed index-CFJax_aZ.js; semantic behavior retained.
import { validateState } from './learning';
import type { LearningState } from './learning';

export function mergeLearningStates(local: LearningState, remote: LearningState): LearningState {
  const attempts = new Map(remote.attempts.map((attempt) => [attempt.id, attempt]));
  for (const attempt of local.attempts) {
    const previous = attempts.get(attempt.id);
    if (previous && JSON.stringify(previous) !== JSON.stringify(attempt))
      throw Error('Widersprüchliche Antworten. Bitte beide Lernstände exportieren.');
    attempts.set(attempt.id, attempt);
  }
  const merged = validateState({
    ...local,
    attempts: [...attempts.values()].sort((a, b) => a.answeredAt.localeCompare(b.answeredAt)),
    bookmarks: [...new Set([...remote.bookmarks, ...local.bookmarks])],
  });
  if (!merged)
    throw Error('Die Lernstände können nicht verlustfrei verbunden werden. Bitte exportieren.');
  return merged;
}
