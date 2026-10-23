import { describe, expect, it } from 'vitest';
import { exercises } from './data';
import { practiceExpansion } from './practice-expansion';
import { createInitialState, validateState } from './lib/learning';

// Independently calculated reference values, deliberately not imported from the generator.
const reference: Record<string, number[]> = {
  'heizung-heizzeit': [120, 90, 75],
  'heizung-nutzwaerme': [40, 72, 102],
  'heizung-energieeinsatz': [50, 80, 60],
  'heizung-spreizung': [10, 10, 15],
  'heizung-waermeleistung': [12.6, 25.2, 10.5],
  'heizung-ausdehnung': [6.8, 10.2, 4.08],
  'sanitaer-fuellzeit': [15, 15, 15],
  'sanitaer-geschwindigkeit': [0.95, 1.02, 0.99],
  'sanitaer-druckhoehe': [0.49, 1.18, 1.96],
  'sanitaer-mischwasser': [30, 40, 50],
  'sanitaer-gefaelle-rueckwaerts': [2, 1.5, 2.5],
  'sanitaer-verbrauch': [72, 80, 60],
  'klima-luftbedarf': [180, 180, 300],
  'klima-kanalquerschnitt': [0.08, 0.15, 0.15],
  'klima-kanalstrom': [864, 1728, 1440],
  'klima-luftwaerme': [10, 12, 12],
  'klima-rueckwaermzahl': [17, 17.2, 14],
  'klima-luftenergie': [0.8, 0.96, 0.9],
  'wiso-stundenkosten': [203, 144, 324],
  'wiso-materialzuschlag': [200, 288, 368],
  'wiso-skonto': [490, 727.5, 1176],
  'wiso-kostendeckung': [50, 60, 60],
  'wiso-preissteigerung': [15, 20, 5],
  'wiso-energiekosten': [3, 4.8, 3],
};

describe('practice expansion v1', () => {
  it.each(Object.entries(reference))(
    'checks every answer in %s against independent values',
    (base, values) => {
      values.forEach((expected, index) => {
        const exercise = exercises.find(({ id }) => id === `${base}-v1-${index + 1}`)!;
        expect(exercise).toBeDefined();
        const actual = Number(
          exercise.options[exercise.correctIndex].split(' ')[0].replace(',', '.'),
        );
        expect(actual).toBeCloseTo(expected, 6);
      });
    },
  );

  it('has unique options, stable identities and explicit variant labels', () => {
    expect(practiceExpansion).toHaveLength(96);
    expect(practiceExpansion.filter(({ formula }) => formula)).toHaveLength(72);
    expect(new Set(exercises.map(({ id }) => id)).size).toBe(108);
    for (const task of practiceExpansion) {
      expect(new Set(task.options).size).toBe(4);
      expect(task.sourceLabel).toContain('Eigene Übungsaufgabe');
      expect(task.sourceLabel).toContain('Version 1');
      if (task.formula) expect(task.sourceLabel).toContain('Zahlenvariante');
    }
  });

  it('still accepts old attempts and accepts new attempts without fabricating progress', () => {
    const state = createInitialState();
    expect(state.attempts).toEqual([]);
    const attempts = [exercises[0], practiceExpansion[0]].map((task, i) => ({
      id: `fixture-${i}`,
      exerciseId: task.id,
      answer: task.correctIndex,
      correct: true,
      answeredAt: '2026-10-23T12:00:00.000Z',
    }));
    expect(validateState({ ...state, attempts })?.attempts).toEqual(attempts);
  });
});
