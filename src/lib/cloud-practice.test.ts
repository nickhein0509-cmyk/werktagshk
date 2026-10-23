import { describe, expect, it, vi } from 'vitest';
vi.mock('./supabase', () => ({ supabase: null }));
import {
  buildAnswer,
  emptyDraft,
  latestCatalog,
  parseLearning,
  parseSnapshot,
  permitted,
} from './cloud-practice';

const snapshotData = (kind = 'choice') => ({
  id: 'synthetic-session',
  position: 0,
  total: 5,
  revision: 2,
  completed: false,
  question: {
    id: 'synthetic-question',
    version: 1,
    title: 'Synthetic only',
    prompt: 'Test prompt',
    kind,
    options:
      kind === 'choice'
        ? [
            { id: 'a', label: 'Option A' },
            { id: 'b', label: 'Option B' },
          ]
        : undefined,
    unit: 'kWh',
  },
  draft: {},
  policy: {},
  answerSubmitted: false,
  solutionViewed: false,
});

describe('private cloud content contract', () => {
  it('shows one latest active revision per task without discarding historical metadata', () => {
    const base = {
      id: 'synthetic',
      version: 1,
      title: 'Synthetic',
      topic: 'heizung',
      kind: 'numeric' as const,
      active: true,
      reviewStatus: 'checked',
    };
    const catalogue = [base, { ...base, version: 2 }, { ...base, version: 3, active: false }];
    expect(latestCatalog(catalogue)).toEqual([{ ...base, version: 2 }]);
    expect(catalogue).toHaveLength(3);
  });
  it('accepts question metadata without private answers and fails unknown revisions/schema', () => {
    const data = {
      rulesVersion: 'shk-levels/2',
      catalog: [
        {
          id: 's',
          version: 1,
          title: 'Synthetic',
          topic: 'heizung',
          kind: 'numeric',
          active: true,
        },
      ],
      rounds: [],
    };
    expect(parseLearning(data).catalog).toHaveLength(1);
    expect(() => parseLearning({ ...data, rulesVersion: 'unknown' })).toThrow();
    expect(() =>
      parseLearning({ ...data, catalog: [{ ...data.catalog[0], version: '1' }] }),
    ).toThrow();
  });
  it('preserves option IDs and refuses forged or duplicate options', () => {
    const s = parseSnapshot(snapshotData());
    expect(buildAnswer(s, { ...emptyDraft(), selected: ['b'] })).toEqual({ selected: ['b'] });
    expect(() => buildAnswer(s, { ...emptyDraft(), selected: ['forged'] })).toThrow();
    expect(() => buildAnswer(s, { ...emptyDraft(), selected: ['a', 'b'] })).toThrow();
    expect(() => buildAnswer(s, { ...emptyDraft(), selected: ['a', 'a'] })).toThrow();
  });
  it('keeps numeric text, decimal comma and unit for server-side grading', () => {
    const s = parseSnapshot(snapshotData('numeric'));
    expect(buildAnswer(s, { ...emptyDraft(), text: '2,50', unit: 'kWh' })).toEqual({
      text: '2,50',
      unit: 'kWh',
    });
    expect(() => buildAnswer(s, emptyDraft())).toThrow();
  });
  it('requires an explicit self comparison and prior solution reveal', () => {
    const s = parseSnapshot(snapshotData('self'));
    const draft = { ...emptyDraft(), text: 'My own explanation', selfAssessment: 'partial' };
    expect(() => buildAnswer(s, draft)).toThrow();
    expect(buildAnswer({ ...s, solutionViewed: true }, draft)).toEqual({
      text: draft.text,
      selfAssessment: 'partial',
    });
    expect(buildAnswer(s, emptyDraft(), true)).toEqual({ unknown: true });
  });
  it('blocks duplicate submissions and defaults missing/expired policy to denied', () => {
    const s = parseSnapshot(snapshotData());
    expect(() => buildAnswer({ ...s, answerSubmitted: true }, emptyDraft(), true)).toThrow();
    expect(permitted(s, 'feedback', 1000)).toBe(false);
    expect(
      permitted(
        { ...s, policy: { feedback: true, validUntil: new Date(2000).toISOString() } },
        'feedback',
        1999,
      ),
    ).toBe(true);
    expect(
      permitted(
        { ...s, policy: { feedback: true, validUntil: new Date(2000).toISOString() } },
        'feedback',
        2000,
      ),
    ).toBe(false);
    expect(
      permitted(
        { ...s, policy: { feedback: 'true', validUntil: new Date(2000).toISOString() } },
        'feedback',
        1000,
      ),
    ).toBe(false);
  });
  it('rejects unsupported question format instead of silently changing its grading', () => {
    expect(() => parseSnapshot(snapshotData('other'))).toThrow();
  });
});
