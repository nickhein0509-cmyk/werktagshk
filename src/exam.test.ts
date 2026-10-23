import { describe, expect, it } from 'vitest';
import { exercises } from './data';
import { examAreas, getExamAreas, isExamCase } from './exam';
import { createInitialState, validateState } from './lib/learning';

describe('exam practice integration', () => {
  it('keeps all existing identities and new cases distinct, with no artificial progress', () => {
    const original = exercises.filter((task) => !isExamCase(task));
    expect(original).toHaveLength(108);
    expect(exercises.filter(isExamCase)).toHaveLength(36);
    expect(new Set(exercises.map((task) => task.id)).size).toBe(exercises.length);
    const oldTask = original[0];
    const newTask = exercises.find((task) => task.id === 'exam-si-waermeleistung')!;
    const state = createInitialState();
    expect(state.attempts).toEqual([]);
    const attempts = [oldTask, newTask].map((task, index) => ({
      id: `exam-fixture-${index}`,
      exerciseId: task.id,
      answer: task.correctIndex,
      correct: true,
      answeredAt: '2026-10-23T12:00:00.000Z',
    }));
    expect(validateState({ ...state, attempts })?.attempts).toEqual(attempts);
  });

  it('keeps planning cases in their intended exam area even when their subject is WiSo', () => {
    const offer = exercises.find((task) => task.id === 'exam-ap-angebotsvergleich-v1')!;
    expect(offer.topicId).toBe('wiso');
    expect(getExamAreas(offer)).toEqual(['arbeitsplanung']);
    expect(examAreas.map((area) => area.id)).toEqual(['arbeitsplanung', 'systemanalyse', 'wiso']);
  });

  // References independently recomputed from the stated model inputs, not the generators.
  it.each([
    ['exam-ap-rohrzuschnitt-v1', '1 770 mm'],
    ['exam-ap-hoehenplanung-v1', '+1,110 m'],
    ['exam-ap-heizflaechenwahl-v1', '1,60 kW'],
    ['exam-ap-angebotsvergleich-v1', 'B ist um 6,00 € günstiger'],
    ['exam-wiso-lohnmodell', '2.242,20'],
  ])('checks the numerical result of %s against a separately derived value', (id, expected) => {
    const task = exercises.find((entry) => entry.id === id)!;
    expect(task.options[task.correctIndex]).toContain(expected);
  });
});
