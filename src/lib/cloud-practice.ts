import { supabase } from './supabase';
import type { DifficultyLevel } from './difficulty';
import type { ExerciseKind } from './exercise-kind';

export const cloudTopics: Record<string, string> = {
  trinkwasser: 'Trinkwasser',
  entwaesserung: 'Entwässerung',
  heizung: 'Heizung',
  waermeerzeuger: 'Wärmeerzeuger',
  regelung: 'Regelung',
  systemanalyse: 'Systemanalyse',
  fachrechnen: 'Fachrechnen',
  wiso: 'Wirtschaft & Soziales',
};
export type QuestionKind = 'choice' | 'numeric' | 'short' | 'self';
export type CloudDifficulty = 'basic' | 'applied';
export type CloudDemand = 'foundation' | 'application';
export interface CloudEditorialReview {
  difficultyLevel: DifficultyLevel;
  taskKind: ExerciseKind;
  status: 'supported' | 'qualified' | 'needs_revision';
  reviewedAt: string;
  rubricVersion: 'werktag-demand/1';
  practiceEligible: boolean;
}
export const cloudDifficultyLabels: Record<CloudDifficulty, string> = {
  basic: 'Basis',
  applied: 'Anwendung',
};
export const cloudDemandLabels: Record<CloudDemand, string> = {
  foundation: 'Grundlagen',
  application: 'Anwendung',
};
export type JsonRecord = Record<string, unknown>;
export interface CatalogQuestion {
  id: string;
  version: number;
  topic: string;
  title: string;
  kind: QuestionKind;
  active: boolean;
  reviewStatus: string;
  excludedReason?: string;
  difficulty?: CloudDifficulty;
  demand?: CloudDemand;
  editorialReview?: CloudEditorialReview;
}
export interface CloudRound {
  id: string;
  topic: string | null;
  completed: boolean;
  attemptIds: string[];
}
export interface CloudLearning {
  catalog: CatalogQuestion[];
  rounds: CloudRound[];
}
export interface CloudQuestion {
  id: string;
  version: number;
  title: string;
  prompt: string;
  kind: QuestionKind;
  multiple: boolean;
  options: { id: string; label: string }[];
  unit: string;
  figures: JsonRecord[];
  difficulty?: CloudDifficulty;
  demand?: CloudDemand;
  editorialReview?: CloudEditorialReview;
}
export interface CloudSnapshot {
  id: string;
  position: number;
  total: number;
  revision: number;
  completed: boolean;
  question: CloudQuestion | null;
  draft: JsonRecord;
  policy: JsonRecord;
  answerSubmitted: boolean;
  solutionViewed: boolean;
  hint?: string;
  solution?: JsonRecord;
  feedback?: JsonRecord;
}
export interface CloudDraft {
  text: string;
  unit: string;
  selected: string[];
  selfAssessment: string;
}
export const emptyDraft = (): CloudDraft => ({
  text: '',
  unit: '',
  selected: [],
  selfAssessment: '',
});
export function record(v: unknown): v is JsonRecord {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}
function string(v: unknown): v is string {
  return typeof v === 'string';
}
function integer(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= 0;
}
function kind(v: unknown): v is QuestionKind {
  return ['choice', 'numeric', 'short', 'self'].includes(String(v));
}
/** Preserve the existing bank's two-level scale; never infer a grade from the task text. */
export function parseCloudDifficulty(value: unknown): CloudDifficulty | undefined {
  return value === 'basic' || value === 'applied' ? value : undefined;
}

function parseCloudDemand(value: unknown): CloudDemand | undefined {
  return value === 'foundation' || value === 'application' ? value : undefined;
}

/** Only the answer-free, version-bound projection belongs in the learner catalog. */
export function parseEditorialReview(value: unknown): CloudEditorialReview | undefined {
  if (
    !record(value) ||
    ![1, 2, 3, 4].includes(value.difficultyLevel as number) ||
    !['calculation', 'context', 'knowledge'].includes(value.taskKind as string) ||
    !['supported', 'qualified', 'needs_revision'].includes(value.status as string) ||
    value.rubricVersion !== 'werktag-demand/1' ||
    !string(value.reviewedAt) ||
    !Number.isFinite(Date.parse(value.reviewedAt)) ||
    typeof value.practiceEligible !== 'boolean'
  )
    return undefined;
  return {
    difficultyLevel: value.difficultyLevel as DifficultyLevel,
    taskKind: value.taskKind as ExerciseKind,
    status: value.status as CloudEditorialReview['status'],
    reviewedAt: value.reviewedAt,
    rubricVersion: value.rubricVersion,
    practiceEligible: value.practiceEligible,
  };
}

export function compareEditorialDifficulty(
  a: Pick<CatalogQuestion, 'editorialReview'>,
  b: Pick<CatalogQuestion, 'editorialReview'>,
  direction: 'asc' | 'desc' = 'asc',
): number {
  const first = a.editorialReview?.difficultyLevel;
  const second = b.editorialReview?.difficultyLevel;
  if (first === undefined) return second === undefined ? 0 : 1;
  if (second === undefined) return -1;
  return direction === 'asc' ? first - second : second - first;
}

/** Unknown classifications remain last in either direction. Ties retain catalogue order. */
export function compareCloudDifficulty(
  a: Pick<CatalogQuestion, 'difficulty'>,
  b: Pick<CatalogQuestion, 'difficulty'>,
  direction: 'asc' | 'desc' = 'asc',
): number {
  if (!a.difficulty) return b.difficulty ? 1 : 0;
  if (!b.difficulty) return -1;
  const difference = Number(a.difficulty === 'applied') - Number(b.difficulty === 'applied');
  return direction === 'asc' ? difference : -difference;
}
/** Prefer the latest active revision while preserving blocked metadata for inspection. */
export function latestCatalog(catalog: CatalogQuestion[]): CatalogQuestion[] {
  const byId = new Map<string, CatalogQuestion>();
  for (const entry of catalog) {
    const current = byId.get(entry.id);
    if (
      !current ||
      (entry.active && !current.active) ||
      (entry.active === current.active && entry.version > current.version)
    )
      byId.set(entry.id, entry);
  }
  return [...byId.values()];
}

export function parseLearning(data: unknown): CloudLearning {
  if (
    !record(data) ||
    data.rulesVersion !== 'shk-levels/2' ||
    !Array.isArray(data.catalog) ||
    !Array.isArray(data.rounds)
  )
    throw new Error('Der Aufgabenbestand hat ein unbekanntes Format. Bitte lade die App neu.');
  const catalog = data.catalog.map((q): CatalogQuestion => {
    if (
      !record(q) ||
      !string(q.id) ||
      !integer(q.version) ||
      !string(q.topic) ||
      !string(q.title) ||
      !kind(q.kind) ||
      typeof q.active !== 'boolean'
    )
      throw new Error(
        'Eine Aufgabenkennung konnte nicht gelesen werden. Der Bestand wurde nicht verändert.',
      );
    return {
      id: q.id,
      version: q.version,
      topic: q.topic,
      title: q.title,
      kind: q.kind,
      active: q.active,
      reviewStatus: string(q.reviewStatus) ? q.reviewStatus : 'unbekannt',
      excludedReason: string(q.excludedReason) ? q.excludedReason : undefined,
      difficulty: parseCloudDifficulty(q.difficulty),
      demand: parseCloudDemand(q.demand),
      editorialReview: parseEditorialReview(q.editorialReview),
    };
  });
  const rounds = data.rounds.map((r): CloudRound => {
    if (
      !record(r) ||
      !string(r.id) ||
      !(r.topic === null || string(r.topic)) ||
      typeof r.completed !== 'boolean' ||
      !Array.isArray(r.attemptIds) ||
      !r.attemptIds.every(string)
    )
      throw new Error('Die gespeicherten Runden konnten nicht vollständig gelesen werden.');
    return { id: r.id, topic: r.topic, completed: r.completed, attemptIds: r.attemptIds };
  });
  return { catalog, rounds };
}
export function parseSnapshot(data: unknown): CloudSnapshot {
  if (
    !record(data) ||
    !string(data.id) ||
    !integer(data.position) ||
    !integer(data.total) ||
    !integer(data.revision) ||
    typeof data.completed !== 'boolean'
  )
    throw new Error('Die Lernrunde konnte nicht sicher gelesen werden. Bitte neu laden.');
  let question: CloudQuestion | null = null;
  if (!data.completed) {
    const q = data.question;
    if (
      !record(q) ||
      !string(q.id) ||
      !integer(q.version) ||
      !string(q.title) ||
      !string(q.prompt) ||
      !kind(q.kind)
    )
      throw new Error(
        'Diese Aufgabenart kann noch nicht angezeigt werden. Deine Runde bleibt gespeichert.',
      );
    const options = Array.isArray(q.options)
      ? q.options.map((o) => {
          if (!record(o) || !string(o.id) || !string(o.label))
            throw new Error('Die Antwortauswahl konnte nicht sicher gelesen werden.');
          return { id: o.id, label: o.label };
        })
      : [];
    if (
      q.kind === 'choice' &&
      (options.length < 2 || new Set(options.map((o) => o.id)).size !== options.length)
    )
      throw new Error('Diese Antwortauswahl ist unvollständig.');
    question = {
      id: q.id,
      version: q.version,
      title: q.title,
      prompt: q.prompt,
      kind: q.kind,
      options,
      multiple: q.multiple === true,
      unit: string(q.unit) ? q.unit : '',
      figures: Array.isArray(q.figures) ? q.figures.filter(record) : [],
      difficulty: parseCloudDifficulty(q.difficulty),
      demand: parseCloudDemand(q.demand),
      editorialReview: parseEditorialReview(q.editorialReview),
    };
  }
  return {
    id: data.id,
    position: data.position,
    total: data.total,
    revision: data.revision,
    completed: data.completed,
    question,
    draft: record(data.draft) ? data.draft : {},
    policy: record(data.policy) ? data.policy : {},
    answerSubmitted: data.answerSubmitted === true,
    solutionViewed: data.solutionViewed === true,
    hint: string(data.hint) ? data.hint : undefined,
    solution: record(data.solution) ? data.solution : undefined,
    feedback: record(data.feedback) ? data.feedback : undefined,
  };
}
export function draftFromSnapshot(s: CloudSnapshot): CloudDraft {
  return {
    text: string(s.draft.text) ? s.draft.text : '',
    unit: string(s.draft.unit) ? s.draft.unit : (s.question?.unit ?? ''),
    selected: Array.isArray(s.draft.selected) ? s.draft.selected.filter(string) : [],
    selfAssessment: string(s.draft.selfAssessment) ? s.draft.selfAssessment : '',
  };
}
export function permitted(
  snapshot: CloudSnapshot,
  flag: 'hints' | 'earlySolution' | 'feedback',
  now = Date.now(),
): boolean {
  return (
    snapshot.policy[flag] === true &&
    string(snapshot.policy.validUntil) &&
    new Date(snapshot.policy.validUntil).getTime() > now
  );
}
export function buildAnswer(s: CloudSnapshot, draft: CloudDraft, unknown = false): JsonRecord {
  if (!s.question || s.completed || s.answerSubmitted)
    throw new Error('Diese Aufgabe ist bereits abgeschlossen.');
  if (unknown) return { unknown: true };
  const q = s.question;
  if (q.kind === 'choice') {
    if (
      !draft.selected.length ||
      (!q.multiple && draft.selected.length !== 1) ||
      new Set(draft.selected).size !== draft.selected.length ||
      draft.selected.some((id) => !q.options.some((o) => o.id === id))
    )
      throw new Error('Bitte wähle eine gültige Antwort.');
    return { selected: [...draft.selected] };
  }
  if (!draft.text.trim()) throw new Error('Bitte trage deine Antwort ein.');
  if (q.kind === 'numeric') return { text: draft.text, unit: draft.unit };
  if (q.kind === 'self') {
    if (!s.solutionViewed || !['correct', 'partial', 'incorrect'].includes(draft.selfAssessment))
      throw new Error('Öffne zuerst die Musterlösung und wähle deinen Selbstvergleich.');
    return { text: draft.text, selfAssessment: draft.selfAssessment };
  }
  return { text: draft.text };
}
export async function cloudRpc(name: string, args?: JsonRecord): Promise<unknown> {
  if (!supabase) throw new Error('Die Verbindung zum Fragenbestand ist noch nicht eingerichtet.');
  const { data, error } = await supabase.rpc(name, args);
  if (error)
    throw new Error(
      error.message || 'Der Fragenbestand ist gerade nicht erreichbar. Bitte erneut laden.',
    );
  return data;
}
