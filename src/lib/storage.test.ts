import { describe, expect, it } from 'vitest';
import { isFutureLearningRecord } from './storage';

describe('learning format compatibility', () => {
  it('preserves records written by a newer app, including unknown fields', () => {
    expect(isFutureLearningRecord(JSON.stringify({ version: 2, sessions: { future: true } }))).toBe(
      true,
    );
    expect(isFutureLearningRecord(JSON.stringify({ version: 10, attempts: [] }))).toBe(true);
  });

  it('does not misclassify current or unreadable records as a newer format', () => {
    for (const raw of [null, '{broken', 'null', '[]', '7', '{"version":1}', '{"version":"2"}']) {
      expect(isFutureLearningRecord(raw)).toBe(false);
    }
  });
});
