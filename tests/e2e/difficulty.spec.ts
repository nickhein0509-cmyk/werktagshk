import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { exercises } from '../../src/data';
import { getExamAreas } from '../../src/exam';
import { difficultyLevels, getExerciseDifficulty } from '../../src/lib/difficulty';
import { getExerciseKind } from '../../src/lib/exercise-kind';

const learningKey = 'werktag-learning-v1';
const roundKey = 'werktag-exam-session-v1:guest';

async function navigate(page: Page, label: string) {
  await page
    .getByRole('navigation', { name: 'Hauptnavigation' })
    .getByRole('button', { name: label, exact: true })
    .click();
}

async function learningRecord(page: Page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), learningKey);
}

async function cardLevels(library: Locator) {
  return library
    .locator('article .difficulty-badge')
    .evaluateAll((badges) => badges.map((badge) => Number(badge.getAttribute('data-difficulty'))));
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('the library opens the protected account catalog without starting a round for a guest', async ({
  page,
}) => {
  const privateReads: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/shk_learning_data')) privateReads.push(request.url());
  });
  await navigate(page, 'Lernwerkstatt');
  await page
    .getByRole('button', { name: 'Alle Fragen aus deinem Lernkonto öffnen', exact: true })
    .click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Mein Fragenbestand');
  await expect(
    page.getByRole('region', { name: 'Privater Fragenbestand', exact: true }),
  ).toHaveCount(0);
  expect(privateReads).toEqual([]);
  expect(await learningRecord(page)).toBeNull();
});

test('the library filters all editorial levels and sorts in both directions without learning events', async ({
  page,
}) => {
  await navigate(page, 'Lernwerkstatt');
  const library = page.getByRole('region', { name: 'Lernwerkstatt', exact: true });
  const difficulty = library.getByRole('combobox', { name: 'Schwierigkeit', exact: true });
  const sort = library.getByRole('combobox', { name: 'Sortierung', exact: true });

  for (const level of [1, 2, 3, 4]) {
    await difficulty.selectOption(String(level));
    const expected = exercises.filter((task) => getExerciseDifficulty(task)?.level === level);
    expect(expected.length).toBeGreaterThan(0);
    await expect(library.getByRole('article')).toHaveCount(expected.length);
    expect(await cardLevels(library)).toEqual(Array(expected.length).fill(level));
  }

  await difficulty.selectOption('all');
  await sort.selectOption('asc');
  const ascending = await cardLevels(library);
  expect(ascending).toHaveLength(exercises.length);
  expect(new Set(ascending)).toEqual(new Set([1, 2, 3, 4]));
  expect(ascending.every((level, index) => index === 0 || ascending[index - 1] <= level)).toBe(
    true,
  );
  await sort.selectOption('desc');
  const descending = await cardLevels(library);
  expect(descending.every((level, index) => index === 0 || descending[index - 1] >= level)).toBe(
    true,
  );
  expect(descending).toEqual([...ascending].reverse());
  expect(await learningRecord(page)).toBeNull();
});

test('difficulty combines with kind, area, topic and search, and an empty result resets every filter', async ({
  page,
}) => {
  await navigate(page, 'Lernwerkstatt');
  const library = page.getByRole('region', { name: 'Lernwerkstatt', exact: true });
  await library
    .getByRole('group', { name: 'Aufgabenart filtern', exact: true })
    .getByRole('button', { name: 'Rechenaufgaben', exact: true })
    .click();
  await library
    .getByRole('group', { name: 'Prüfungsbereich filtern', exact: true })
    .getByRole('button', { name: 'Wirtschafts- und Sozialkunde', exact: true })
    .click();
  await library
    .getByRole('group', { name: 'Lernfeld filtern', exact: true })
    .getByRole('button', { name: 'Wirtschaft & Soziales', exact: true })
    .click();
  await library.getByRole('combobox', { name: 'Schwierigkeit', exact: true }).selectOption('3');
  await library.getByRole('combobox', { name: 'Sortierung', exact: true }).selectOption('desc');
  const expected = exercises.filter(
    (task) =>
      task.topicId === 'wiso' &&
      getExamAreas(task).includes('wiso') &&
      getExerciseKind(task) === 'calculation' &&
      getExerciseDifficulty(task)?.level === 3,
  );
  expect(expected.length).toBeGreaterThan(0);
  await expect(library.getByRole('article')).toHaveCount(expected.length);
  const searched = expected[0];
  await library.getByRole('textbox', { name: 'Aufgaben durchsuchen' }).fill(searched.title);
  await expect(library.getByRole('article')).toHaveCount(1);
  await expect(library.getByRole('article').getByRole('heading')).toHaveText(searched.title);

  await library
    .getByRole('group', { name: 'Lernfeld filtern', exact: true })
    .getByRole('button', { name: 'Heizungstechnik', exact: true })
    .click();
  await expect(library.getByRole('article')).toHaveCount(0);
  await library.getByRole('button', { name: 'Filter zurücksetzen', exact: true }).click();
  await expect(library.getByRole('article')).toHaveCount(exercises.length);
  await expect(library.getByRole('textbox', { name: 'Aufgaben durchsuchen' })).toHaveValue('');
  await expect(library.getByRole('combobox', { name: 'Schwierigkeit', exact: true })).toHaveValue(
    'all',
  );
  await expect(library.getByRole('combobox', { name: 'Sortierung', exact: true })).toHaveValue(
    'recommended',
  );
  for (const label of ['Alle Aufgabenarten', 'Alle Prüfungsbereiche', 'Alle Lernfelder']) {
    await expect(library.getByRole('button', { name: label, exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  }
  expect(await learningRecord(page)).toBeNull();
});

test('specific demand reasons appear after answering and Weiterlernen follows the filtered queue', async ({
  page,
}) => {
  await navigate(page, 'Lernwerkstatt');
  const library = page.getByRole('region', { name: 'Lernwerkstatt', exact: true });
  await library
    .getByRole('group', { name: 'Prüfungsbereich filtern', exact: true })
    .getByRole('button', { name: 'Wirtschafts- und Sozialkunde', exact: true })
    .click();
  await library.getByRole('combobox', { name: 'Schwierigkeit', exact: true }).selectOption('4');
  await library.getByRole('combobox', { name: 'Sortierung', exact: true }).selectOption('desc');
  const titles = await library.getByRole('article').getByRole('heading').allTextContents();
  expect(titles).toHaveLength(2);
  const tasks = titles.map((title) => exercises.find((task) => task.title === title)!);
  expect(tasks.every(Boolean)).toBe(true);
  expect(new Set(tasks.map(getExerciseKind))).toEqual(new Set(['calculation', 'context']));
  const firstAssessment = getExerciseDifficulty(tasks[0])!;
  const generic = difficultyLevels.find(({ id }) => id === firstAssessment.level)!.description;
  expect(firstAssessment.reason).not.toBe(generic);
  await expect(library.getByRole('article').first().locator('.difficulty-badge')).toHaveAttribute(
    'title',
    generic,
  );
  await library
    .getByRole('article')
    .first()
    .getByRole('button', { name: `${tasks[0].title} üben`, exact: true })
    .click();

  for (const [index, task] of tasks.entries()) {
    const dialog = page.getByRole('dialog', { name: task.title, exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('.difficulty-reason')).toHaveText(`Anforderung: ${generic}`);
    await expect(dialog.locator('.difficulty-reason')).not.toContainText(
      getExerciseDifficulty(task)!.reason,
    );
    if (index === 0) expect(await learningRecord(page)).toBeNull();
    await dialog.getByRole('radio').nth(task.correctIndex).check();
    await dialog.getByRole('button', { name: 'Antwort prüfen', exact: true }).click();
    await expect(dialog.locator('.difficulty-reason')).toHaveText(
      `Anforderung: ${getExerciseDifficulty(task)!.reason}`,
    );
    expect((await learningRecord(page)).attempts).toHaveLength(index + 1);
    await dialog.getByRole('button', { name: 'Weiterlernen', exact: true }).click();
  }
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(library.getByRole('article')).toHaveCount(2);
  await expect(library.getByRole('combobox', { name: 'Schwierigkeit', exact: true })).toHaveValue(
    '4',
  );
  await expect(library.getByRole('combobox', { name: 'Sortierung', exact: true })).toHaveValue(
    'desc',
  );
  expect(
    (await learningRecord(page)).attempts.map(
      ({ exerciseId }: { exerciseId: string }) => exerciseId,
    ),
  ).toEqual(tasks.map(({ id }) => id));
});

test('exam difficulty selection restricts the round without starting a timer or a learner event during setup', async ({
  page,
}) => {
  await navigate(page, 'Prüfungsbereich');
  const exam = page.getByRole('region', { name: 'Prüfungsbereich', exact: true });
  await exam
    .getByRole('combobox', { name: 'Prüfungsbereich', exact: true })
    .selectOption('systemanalyse');
  await exam.getByRole('combobox', { name: 'Aufgabenart', exact: true }).selectOption('context');
  await exam.getByRole('combobox', { name: 'Schwierigkeit', exact: true }).selectOption('unrated');
  await expect(exam.getByRole('button', { name: 'Runde starten', exact: true })).toBeDisabled();
  await expect(exam.getByRole('heading', { name: '0 Aufgaben für diese Runde' })).toBeVisible();
  await exam.getByRole('combobox', { name: 'Schwierigkeit', exact: true }).selectOption('4');
  await exam.getByRole('combobox', { name: 'Sortierung', exact: true }).selectOption('desc');
  const expected = exercises.filter(
    (task) =>
      getExamAreas(task).includes('systemanalyse') &&
      getExerciseKind(task) === 'context' &&
      getExerciseDifficulty(task)?.level === 4,
  );
  expect(expected.length).toBeGreaterThan(0);
  expect(expected.length).toBeLessThanOrEqual(6);
  await expect(
    exam.getByRole('heading', { name: `${expected.length} Aufgaben für diese Runde` }),
  ).toBeVisible();
  await expect(exam.getByRole('timer')).toHaveCount(0);
  expect(await learningRecord(page)).toBeNull();
  expect(await page.evaluate((key) => sessionStorage.getItem(key), roundKey)).toBeNull();

  await exam.getByRole('button', { name: 'Runde starten', exact: true }).click();
  await expect(exam.getByRole('timer')).toBeVisible();
  const round = await page.evaluate((key) => JSON.parse(sessionStorage.getItem(key)!), roundKey);
  expect(round.taskIds).toEqual(expected.map(({ id }) => id));
  await expect(exam.locator('.exam-paper .difficulty-badge')).toHaveAttribute(
    'data-difficulty',
    '4',
  );
  expect(await learningRecord(page)).toBeNull();
});

test('difficulty controls and the explanatory legend fit a 320px viewport and expose accessible labels', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await navigate(page, 'Lernwerkstatt');
  const library = page.getByRole('region', { name: 'Lernwerkstatt', exact: true });
  await library.getByRole('combobox', { name: 'Schwierigkeit', exact: true }).selectOption('4');
  await library.getByRole('combobox', { name: 'Sortierung', exact: true }).selectOption('asc');
  await library.getByText('Was bedeuten die Schwierigkeitsstufen?', { exact: true }).click();
  await expect(library.locator('.difficulty-legend')).toContainText(
    'Die Stufe misst weder dein Können noch deine Prüfungsreife.',
  );
  const layout = await page.evaluate(() => ({
    viewport: window.innerWidth,
    page: document.documentElement.scrollWidth,
    controls: [...document.querySelectorAll('.difficulty-controls select')].map((element) => ({
      left: element.getBoundingClientRect().left,
      right: element.getBoundingClientRect().right,
    })),
  }));
  expect(layout.page).toBeLessThanOrEqual(layout.viewport + 1);
  expect(layout.controls.every(({ left, right }) => left >= 0 && right <= layout.viewport)).toBe(
    true,
  );
  const report = await new AxeBuilder({ page })
    .include('.practice-library')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(report.violations).toEqual([]);
  expect(await learningRecord(page)).toBeNull();
});
