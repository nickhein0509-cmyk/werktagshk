import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { technicalContextExercises } from '../../src/content/exam-context-technical';
import { wisoContextExercises } from '../../src/content/exam-context-wiso';

async function openTools(page: Page) {
  await page.goto('/');
  await page
    .getByRole('navigation', { name: 'Hauptnavigation' })
    .getByRole('button', { name: 'Werkzeugkoffer', exact: true })
    .click();
}

test('switching formulas, units and the sought quantity preserves the physical example', async ({
  page,
}) => {
  await openTools(page);
  const formula = page.getByRole('combobox', { name: 'Formel auswählen', exact: true });
  const sought = page.getByRole('combobox', { name: 'Gesuchte Größe', exact: true });
  await expect(formula.getByRole('option')).toHaveCount(8);
  await page.getByRole('textbox', { name: 'Wassermasse', exact: true }).fill('120');
  await page.getByRole('textbox', { name: 'Temperaturdifferenz', exact: true }).fill('40');
  await expect(page.locator('.calculator-result strong')).toHaveText('5,573 kWh');

  await formula.selectOption('flow');
  await expect(page.locator('.calculator-result strong')).toHaveText('18 l/min');
  await sought.selectOption('time');
  await expect(page.locator('.calculator-result strong')).toHaveText('80 s');
  await page.getByRole('combobox', { name: 'Einheit V', exact: true }).selectOption('m³');
  await expect(page.getByRole('textbox', { name: 'Volumen', exact: true })).toHaveValue('0,024');
  await page.getByRole('combobox', { name: 'Einheit V̇', exact: true }).selectOption('l/s');
  await expect(page.getByRole('textbox', { name: 'Volumenstrom', exact: true })).toHaveValue('0,3');
  await expect(page.locator('.calculator-result strong')).toHaveText('80 s');
  await expect(page.locator('.formula-steps')).toContainText('0,024 m³ = 24 l');

  await formula.selectOption('heat');
  await expect(page.getByRole('textbox', { name: 'Wassermasse', exact: true })).toHaveValue('120');
  await expect(page.getByRole('textbox', { name: 'Temperaturdifferenz', exact: true })).toHaveValue(
    '40',
  );
  await sought.selectOption('mass');
  await expect(page.getByRole('textbox', { name: 'Wassermasse', exact: true })).toHaveCount(0);
  await expect(page.locator('.calculator-result strong')).toHaveText('120 kg');
  await sought.selectOption('delta');
  await expect(page.locator('.calculator-result strong')).toHaveText('40 K');
  await sought.selectOption('energy');
  await page.getByRole('combobox', { name: 'Ergebniseinheit', exact: true }).selectOption('kJ');
  await expect(page.locator('.calculator-result strong')).toHaveText('20.064 kJ');
  expect(await page.evaluate(() => localStorage.getItem('werktag-learning-v1'))).toBeNull();
});

test('all formula families fit a small screen and invalid inverse values do not produce a number', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await openTools(page);
  const formula = page.getByRole('combobox', { name: 'Formel auswählen', exact: true });
  for (const [id, expected] of [
    ['heat', '2,322 kWh'],
    ['power', '8,36 kW'],
    ['flow', '18 l/min'],
    ['air-change', '2 h⁻¹'],
    ['slope', '1,5 %'],
    ['pipe-volume', '3,77 l'],
    ['heating-time', '60 min'],
    ['efficiency', '80 %'],
  ]) {
    await formula.selectOption(id);
    await expect(page.locator('.calculator-result strong')).toHaveText(expected);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true,
    );
  }
  await page.getByRole('combobox', { name: 'Gesuchte Größe', exact: true }).selectOption('input');
  await expect(page.locator('.formula-steps')).toContainText('0,8 Anteil');
  await page.getByRole('textbox', { name: 'Energiewirkungsgrad', exact: true }).fill('0');
  await expect(page.locator('.calculator-result strong')).toHaveCount(0);
  await expect(page.locator('.calculator-result')).toContainText('nicht eindeutig');
  const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(accessibility.violations).toEqual([]);
});

test('new contextual cases remain separate from calculations and save only submitted answers', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('navigation', { name: 'Hauptnavigation' })
    .getByRole('button', { name: 'Lernwerkstatt', exact: true })
    .click();
  await page
    .getByRole('group', { name: 'Aufgabenart filtern' })
    .getByRole('button', { name: 'Kontextaufgaben', exact: true })
    .click();
  for (const task of [
    technicalContextExercises[0],
    technicalContextExercises[8],
    wisoContextExercises[0],
  ]) {
    await page.getByRole('textbox', { name: 'Aufgaben durchsuchen', exact: true }).fill(task.title);
    await page.getByRole('button', { name: `${task.title} üben`, exact: true }).click();
    const dialog = page.getByRole('dialog', { name: task.title, exact: true });
    await expect(dialog.locator('.calculation-workspace, .explanation')).toHaveCount(0);
    await dialog
      .getByRole('textbox', { name: 'Notizen', exact: true })
      .fill('Welche Angabe begründet meine Entscheidung?');
    await dialog.getByRole('radio').nth(task.correctIndex).check();
    await dialog.getByRole('button', { name: 'Antwort prüfen', exact: true }).click();
    await expect(dialog.locator('.explanation')).toHaveText(task.explanation);
    await page.keyboard.press('Escape');
  }
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('werktag-learning-v1')!));
  expect(state.attempts).toHaveLength(3);
  expect(state.attempts.every((attempt: { correct: boolean }) => attempt.correct)).toBe(true);
});
