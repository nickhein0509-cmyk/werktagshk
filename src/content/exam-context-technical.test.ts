import { describe, expect, it } from 'vitest';
import { technicalContextExercises } from './exam-context-technical';

describe('original technical context cases v1', () => {
  it('covers eight planning and eight system-analysis decisions with stable identities', () => {
    expect(technicalContextExercises).toHaveLength(16);
    expect(
      technicalContextExercises.filter((task) => task.id.startsWith('exam-ap-context-')),
    ).toHaveLength(8);
    expect(
      technicalContextExercises.filter((task) => task.id.startsWith('exam-si-context-')),
    ).toHaveLength(8);
    expect(new Set(technicalContextExercises.map((task) => task.id)).size).toBe(16);
    expect(new Set(technicalContextExercises.map((task) => task.topicId))).toEqual(
      new Set(['sanitaer', 'heizung', 'klima']),
    );
  });

  it('ships complete separated prompts and explanations with one answer position', () => {
    for (const task of technicalContextExercises) {
      expect(task.id).toMatch(/^exam-(ap|si)-context-[a-z-]+-v1$/);
      expect(task.kind).toBe('context');
      expect(task.options).toHaveLength(4);
      expect(new Set(task.options).size).toBe(4);
      expect(Number.isInteger(task.correctIndex)).toBe(true);
      expect(task.correctIndex).toBeGreaterThanOrEqual(0);
      expect(task.correctIndex).toBeLessThan(4);
      expect(task.context.length).toBeGreaterThan(200);
      expect(task.question.length).toBeGreaterThan(20);
      expect(task.explanation.length).toBeGreaterThan(300);
      expect(task.hint.length).toBeGreaterThan(20);
      expect(task.context).not.toContain(task.explanation);
      expect(task.sourceLabel).toContain('Eigene Übungsaufgabe');
      expect(task.sourceLabel).toContain('Version 1');
      expect(task.sourceLabel).toContain('keine Originalprüfung');
    }
  });
});
