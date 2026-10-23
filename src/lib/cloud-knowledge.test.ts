import { describe, expect, it } from 'vitest';
import {
  filterKnowledge,
  knowledgeAllowed,
  parseKnowledgeCatalog,
  parseKnowledgeReading,
} from './cloud-knowledge';

const metadata = {
  id: 'synthetic-article',
  version: 2,
  kind: 'article',
  title: 'Synthetischer Zusammenhang',
  synonyms: ['Synthetischer Suchbegriff'],
  topicIds: ['heizung'],
  learningFieldIds: ['lf-test'],
  masked: false,
};
const policy = { knowledge: true, epoch: 'synthetic-epoch', validUntil: '2030-01-01T00:00:00Z' };
const catalog = { items: [metadata], learningFields: [], policy };
const reading = {
  entry: {
    ...metadata,
    summary: 'Synthetische Kurzfassung',
    details: {
      use: 'Synthetische Anwendung',
      example: null,
      practice: 'Eigenen Denkweg prüfen',
      distinctions: [],
      formulas: [],
    },
    related: [{ kind: 'term', id: 'synthetic-term', version: 1 }],
    sources: [{ document: 'Synthetische Quelle', pdfPage: 2, privateToken: 'must-not-project' }],
    review: { status: 'checked', checkedAt: '2026-10-23T00:00:00Z', openPoints: [] },
    editorialKey: 'must-not-project',
  },
  policy,
  events: [{ privateExtra: 'must-not-project' }],
};

describe('private knowledge boundary', () => {
  it('accepts a term without an example and retains exact historical link versions', () => {
    const result = parseKnowledgeReading(reading);
    expect(result.entry.details.example).toBeNull();
    expect(result.entry.related).toEqual([{ kind: 'term', id: 'synthetic-term', version: 1 }]);
    expect(JSON.stringify(result)).not.toContain('must-not-project');
    expect(() =>
      parseKnowledgeReading({
        ...reading,
        entry: { ...reading.entry, review: { status: 'open', openPoints: ['Missing evidence'] } },
      }),
    ).toThrow();
  });
  it('discards titles and synonyms of masked entries even if supplied by a stale server projection', () => {
    const result = parseKnowledgeCatalog({ ...catalog, items: [{ ...metadata, masked: true }] });
    expect(result.items[0].title).toBe('Verknüpfter Wissenseintrag');
    expect(result.items[0].synonyms).toEqual([]);
    expect(
      filterKnowledge(result.items, { query: 'Zusammenhang', topic: '', kind: 'all', field: '' }),
    ).toEqual([]);
    expect(
      filterKnowledge(result.items, { query: 'Verknüpfter', topic: '', kind: 'all', field: '' }),
    ).toEqual([]);
  });
  it('keeps catalog-only browsing answer-free and combines all supported filters', () => {
    const result = parseKnowledgeCatalog({
      ...catalog,
      items: [{ ...metadata, summary: 'not part of the index' }],
    });
    expect(result.items[0]).not.toHaveProperty('summary');
    expect(
      filterKnowledge(result.items, {
        query: 'suchbegriff',
        topic: 'heizung',
        kind: 'article',
        field: 'lf-test',
      }),
    ).toHaveLength(1);
    expect(
      filterKnowledge(result.items, {
        query: '',
        topic: 'heizung',
        kind: 'term',
        field: 'lf-test',
      }),
    ).toHaveLength(0);
  });
  it('fails closed when a policy is absent, expired, malformed or disabled', () => {
    const now = Date.parse('2029-12-31T23:59:59Z');
    expect(knowledgeAllowed(policy, now)).toBe(true);
    expect(knowledgeAllowed(policy, now + 1000)).toBe(false);
    expect(knowledgeAllowed({ ...policy, knowledge: false }, now)).toBe(false);
    expect(knowledgeAllowed({ ...policy, validUntil: 'unreadable' }, now)).toBe(false);
    expect(knowledgeAllowed({ ...policy, epoch: '' }, now)).toBe(false);
    expect(knowledgeAllowed(undefined, now)).toBe(false);
  });
});
