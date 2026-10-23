import type { Exercise, TopicId } from './data';

export type ExamAreaId = 'arbeitsplanung' | 'systemanalyse' | 'wiso';
export const examDate = '2026-12-07';

export const examAreas: {
  id: ExamAreaId;
  title: string;
  description: string;
  topicIds: TopicId[];
}[] = [
  {
    id: 'arbeitsplanung',
    title: 'Arbeitsplanung',
    description: 'Aufträge durchdenken, Unterlagen auswerten und nachvollziehbar rechnen.',
    topicIds: ['heizung', 'sanitaer', 'klima'],
  },
  {
    id: 'systemanalyse',
    title: 'Systemanalyse & Instandhaltung',
    description: 'Messwerte vergleichen, Ursachen eingrenzen und Entscheidungen begründen.',
    topicIds: ['heizung', 'sanitaer', 'klima'],
  },
  {
    id: 'wiso',
    title: 'Wirtschafts- und Sozialkunde',
    description: 'Betriebliche Zusammenhänge verstehen und wirtschaftlich entscheiden.',
    topicIds: ['wiso'],
  },
];

/** Editorial practice emphasis, not a claim about an actual exam paper. */
export function getExamAreas(exercise: Exercise): ExamAreaId[] {
  if (exercise.id.startsWith('exam-ap-')) return ['arbeitsplanung'];
  if (exercise.id.startsWith('exam-si-')) return ['systemanalyse'];
  if (exercise.topicId === 'wiso') return ['wiso'];
  return ['arbeitsplanung', 'systemanalyse'];
}

export function isExamCase(exercise: Exercise): boolean {
  return exercise.id.startsWith('exam-');
}
