import { record } from './cloud-practice';
import type { JsonRecord } from './cloud-practice';

export type KnowledgeKind = 'article' | 'term';
export interface KnowledgeLink {
  kind: KnowledgeKind;
  id: string;
  version: number;
}
export interface KnowledgeItem extends KnowledgeLink {
  title: string;
  synonyms: string[];
  topicIds: string[];
  learningFieldIds: string[];
  masked: boolean;
}
export interface KnowledgeField {
  id: string;
  title: string;
  number: number;
  competencies: string | null;
}
export interface KnowledgeCatalog {
  items: KnowledgeItem[];
  learningFields: KnowledgeField[];
  policy: JsonRecord;
}
export interface KnowledgeEntry extends KnowledgeItem {
  summary: string;
  details: {
    use: string;
    example: string | null;
    practice: string;
    distinctions: string[];
    formulas: { title: string; text: string }[];
  };
  related: KnowledgeLink[];
  sources: {
    document: string;
    pdfPage?: number;
    printedPage?: string;
    section?: string;
    note?: string;
  }[];
  review: { checkedAt?: string; openPoints: string[] };
}
export interface KnowledgeReading {
  entry: KnowledgeEntry;
  policy: JsonRecord;
}

const text = (value: unknown): value is string => typeof value === 'string';
const positive = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every(text);

export function parseKnowledgeLink(value: unknown): KnowledgeLink {
  if (
    !record(value) ||
    !['article', 'term'].includes(String(value.kind)) ||
    !text(value.id) ||
    !value.id.trim() ||
    !positive(value.version)
  )
    throw new Error('Der Wissensverweis konnte nicht gelesen werden. Bitte neu laden.');
  return { kind: value.kind as KnowledgeKind, id: value.id, version: value.version };
}

export function parseKnowledgeItem(value: unknown): KnowledgeItem {
  const link = parseKnowledgeLink(value);
  if (
    !record(value) ||
    !text(value.title) ||
    !strings(value.synonyms) ||
    !strings(value.topicIds) ||
    !strings(value.learningFieldIds) ||
    typeof value.masked !== 'boolean'
  )
    throw new Error('Der Wissenskatalog konnte nicht gelesen werden. Bitte neu laden.');
  return {
    ...link,
    title: value.masked ? 'Verknüpfter Wissenseintrag' : value.title,
    synonyms: value.masked ? [] : value.synonyms,
    topicIds: value.topicIds,
    learningFieldIds: value.learningFieldIds,
    masked: value.masked,
  };
}

export function parseKnowledgeCatalog(value: unknown): KnowledgeCatalog {
  if (
    !record(value) ||
    !record(value.policy) ||
    !Array.isArray(value.items) ||
    !Array.isArray(value.learningFields)
  )
    throw new Error('Der Wissenskatalog ist gerade nicht verfügbar. Bitte neu laden.');
  const learningFields = value.learningFields.map((field): KnowledgeField => {
    if (
      !record(field) ||
      !text(field.id) ||
      !text(field.title) ||
      !positive(field.number) ||
      (field.competencies !== null && !text(field.competencies))
    )
      throw new Error('Die Lernfelder konnten nicht gelesen werden. Bitte neu laden.');
    return {
      id: field.id,
      title: field.title,
      number: field.number,
      competencies: field.competencies,
    };
  });
  return { items: value.items.map(parseKnowledgeItem), learningFields, policy: value.policy };
}

export function parseKnowledgeReading(value: unknown): KnowledgeReading {
  if (!record(value) || !record(value.entry) || !record(value.policy))
    throw new Error('Der Wissenseintrag konnte nicht geöffnet werden.');
  const entry = value.entry;
  const item = parseKnowledgeItem({ ...entry, masked: false });
  if (
    !text(entry.summary) ||
    !record(entry.details) ||
    !text(entry.details.use) ||
    (entry.details.example !== null && !text(entry.details.example)) ||
    !text(entry.details.practice) ||
    !strings(entry.details.distinctions) ||
    !Array.isArray(entry.details.formulas) ||
    !Array.isArray(entry.related) ||
    !Array.isArray(entry.sources) ||
    !record(entry.review) ||
    entry.review.status !== 'checked' ||
    !strings(entry.review.openPoints) ||
    entry.review.openPoints.length !== 0
  )
    throw new Error('Dieser Wissenseintrag hat ein noch nicht unterstütztes Format.');
  const formulas = entry.details.formulas.map((formula) => {
    if (!record(formula) || !text(formula.title) || !text(formula.text))
      throw new Error('Eine Formel konnte nicht gelesen werden.');
    return { title: formula.title, text: formula.text };
  });
  const sources = entry.sources.map((source): KnowledgeEntry['sources'][number] => {
    if (!record(source) || !text(source.document))
      throw new Error('Der Quellenvermerk konnte nicht gelesen werden.');
    return {
      document: source.document,
      pdfPage: positive(source.pdfPage) ? source.pdfPage : undefined,
      printedPage: text(source.printedPage) ? source.printedPage : undefined,
      section: text(source.section) ? source.section : undefined,
      note: text(source.note) ? source.note : undefined,
    };
  });
  return {
    policy: value.policy,
    entry: {
      ...item,
      summary: entry.summary,
      details: {
        use: entry.details.use,
        example: entry.details.example,
        practice: entry.details.practice,
        distinctions: entry.details.distinctions,
        formulas,
      },
      related: entry.related.map(parseKnowledgeLink),
      sources,
      review: {
        checkedAt: text(entry.review.checkedAt) ? entry.review.checkedAt : undefined,
        openPoints: entry.review.openPoints,
      },
    },
  };
}

export function knowledgeAllowed(policy: JsonRecord | undefined, now = Date.now()): boolean {
  return Boolean(
    policy?.knowledge === true &&
    text(policy.epoch) &&
    policy.epoch &&
    text(policy.validUntil) &&
    Date.parse(policy.validUntil) > now,
  );
}

export function filterKnowledge(
  items: KnowledgeItem[],
  filter: { query: string; topic: string; kind: 'all' | KnowledgeKind; field: string },
): KnowledgeItem[] {
  const query = filter.query.trim().toLocaleLowerCase('de');
  return items.filter(
    (item) =>
      (!filter.topic || item.topicIds.includes(filter.topic)) &&
      (filter.kind === 'all' || item.kind === filter.kind) &&
      (!filter.field || item.learningFieldIds.includes(filter.field)) &&
      (!query ||
        (!item.masked &&
          `${item.title} ${item.synonyms.join(' ')}`.toLocaleLowerCase('de').includes(query))),
  );
}
