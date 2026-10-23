import { describe, expect, it, vi } from 'vitest';
vi.mock('./supabase', () => ({ supabase: null }));
import {
  buildAnswer,
  emptyDraft,
  latestCatalog,
  compareCloudDifficulty,
  compareEditorialDifficulty,
  parseEditorialReview,
  parseCloudDifficulty,
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
  const editorial = {
    difficultyLevel: 3 as const,
    taskKind: 'calculation' as const,
    status: 'supported' as const,
    reviewedAt: '2026-10-23',
    rubricVersion: 'werktag-demand/1' as const,
    practiceEligible: true,
  };
  it('accepts reviewed demand independently of format and strips private reviewer notes', () => {
    expect(
      parseEditorialReview({
        ...editorial,
        reason: 'Private solution reasoning',
        checks: ['secret'],
      }),
    ).toEqual(editorial);
    const base = snapshotData('choice');
    expect(
      parseSnapshot({ ...base, question: { ...base.question, editorialReview: editorial } })
        .question?.editorialReview,
    ).toEqual(editorial);
    const catalog = parseLearning({
      rulesVersion: 'shk-levels/2',
      rounds: [],
      catalog: [
        {
          id: 'synthetic-reviewed-choice',
          version: 1,
          topic: 'heizung',
          title: 'Synthetic',
          kind: 'choice',
          active: true,
          difficulty: 'basic',
          editorialReview: editorial,
        },
      ],
    });
    expect(catalog.catalog[0].kind).toBe('choice');
    expect(catalog.catalog[0].editorialReview?.taskKind).toBe('calculation');
    expect(catalog.catalog[0].difficulty).toBe('basic');
    expect(catalog.catalog[0].editorialReview?.difficultyLevel).toBe(3);
  });
  it('leaves incomplete or unsupported editorial reviews unknown while retaining original metadata', () => {
    for (const value of [
      null,
      {},
      { ...editorial, difficultyLevel: '3' },
      { ...editorial, difficultyLevel: 5 },
      { ...editorial, taskKind: 'choice' },
      { ...editorial, rubricVersion: 'future/2' },
      { ...editorial, reviewedAt: 'not-a-date' },
      { ...editorial, practiceEligible: undefined },
    ]) {
      expect(parseEditorialReview(value)).toBeUndefined();
      const base = snapshotData();
      expect(
        parseSnapshot({ ...base, question: { ...base.question, editorialReview: value } }).question
          ?.id,
      ).toBe(base.question.id);
    }
  });
  it('preserves a blocked editorial decision and sorts four levels with unknowns always last', () => {
    expect(
      parseEditorialReview({ ...editorial, status: 'needs_revision', practiceEligible: false })
        ?.practiceEligible,
    ).toBe(false);
    const entries = [
      { id: 'unknown', editorialReview: undefined },
      ...([4, 1, 3, 2] as const).map((difficultyLevel) => ({
        id: String(difficultyLevel),
        editorialReview: { ...editorial, difficultyLevel },
      })),
    ];
    expect([...entries].sort(compareEditorialDifficulty).map((x) => x.id)).toEqual([
      '1',
      '2',
      '3',
      '4',
      'unknown',
    ]);
    expect(
      [...entries].sort((a, b) => compareEditorialDifficulty(a, b, 'desc')).map((x) => x.id),
    ).toEqual(['4', '3', '2', '1', 'unknown']);
    expect(entries[0].id).toBe('unknown');
  });
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
  it('preserves the bank native difficulty and independent demand without remapping either', () => {
    const entry = {
      id: 'native',
      version: 2,
      title: 'Synthetic',
      topic: 'heizung',
      kind: 'short',
      active: true,
      difficulty: 'applied',
      demand: 'foundation',
    };
    const parsed = parseLearning({ rulesVersion: 'shk-levels/2', catalog: [entry], rounds: [] });
    expect(parsed.catalog[0]).toMatchObject({ difficulty: 'applied', demand: 'foundation' });
    const base = snapshotData('short');
    expect(
      parseSnapshot({
        ...base,
        question: { ...base.question, difficulty: 'basic', demand: 'application' },
      }).question,
    ).toMatchObject({ difficulty: 'basic', demand: 'application' });
  });
  it('keeps missing and unsupported difficulty metadata unknown without discarding a question', () => {
    for (const value of [undefined, null, 1, 4, 'hard', 'foundation', {}, ['basic']]) {
      expect(parseCloudDifficulty(value)).toBeUndefined();
      const base = snapshotData();
      const question = parseSnapshot({
        ...base,
        question: { ...base.question, difficulty: value },
      }).question;
      expect(question?.id).toBe(base.question.id);
      expect(question?.difficulty).toBeUndefined();
    }
  });
  it('sorts the two stored grades without guessing unknown grades or mutating catalogue records', () => {
    const catalogue = [
      { id: 'unknown', difficulty: undefined },
      { id: 'applied-a', difficulty: 'applied' as const },
      { id: 'basic', difficulty: 'basic' as const },
      { id: 'applied-b', difficulty: 'applied' as const },
    ];
    expect(
      [...catalogue].sort((a, b) => compareCloudDifficulty(a, b)).map((entry) => entry.id),
    ).toEqual(['basic', 'applied-a', 'applied-b', 'unknown']);
    expect(
      [...catalogue].sort((a, b) => compareCloudDifficulty(a, b, 'desc')).map((entry) => entry.id),
    ).toEqual(['applied-a', 'applied-b', 'basic', 'unknown']);
    expect(catalogue[0].id).toBe('unknown');
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
