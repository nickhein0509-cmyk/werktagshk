import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { existsSync } from 'node:fs';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const directory = path.dirname(fileURLToPath(import.meta.url));
const baseURL = process.argv[2] ?? 'http://127.0.0.1:4174';
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
    (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined),
});
const css = await readFile(path.join(directory, 'layouts.css'), 'utf8');
const results = [];
await mkdir(path.join(directory, 'images'), { recursive: true });
try {
  for (const width of [1440, 1366, 1920]) {
    const context = await browser.newContext({
      viewport: { width, height: width === 1366 ? 768 : 1000 },
      locale: 'de-DE',
    });
    const page = await context.newPage();
    for (const option of ['before', 'a', 'b', 'c']) {
      await page.goto(baseURL);
      await page.locator('.flow-dashboard').waitFor();
      await page.evaluate(() => document.fonts.ready);
      if (option !== 'before') {
        await page.evaluate((layout) => {
          document.body.dataset.layout = layout;
          const dashboard = document.querySelector('.flow-dashboard');
          const topics = document.createElement('section');
          topics.className = 'desktop-topics';
          topics.setAttribute('aria-label', 'Lernfelder');
          topics.append(
            document.querySelector('.flow-topics-heading'),
            document.querySelector('.topic-grid'),
          );
          dashboard.insertBefore(topics, document.querySelector('.flow-routine'));
          document.querySelector('.flow-hero h1').textContent =
            layout === 'b' ? 'Dein Lernen. Dein Tempo.' : 'Dein Lernplatz.';
          document.querySelector('.flow-focus > p').textContent =
            'Prüfungsfragen üben, Zusammenhänge verstehen und gezielt wiederholen.';
          document.querySelector('.flow-topics-heading h2').textContent = 'Deine Lernfelder';
          document.querySelector('#exam-areas-title').textContent = 'Womit möchtest du starten?';
          document.querySelector('#routine-title').textContent = 'Heute im Blick';
          document.querySelector('.routine-week h3').textContent = 'Dein Tagesziel';
          document.querySelector('.routine-action h3').textContent = 'Gezielt wiederholen';
          document.querySelector('.routine-action:last-child h3').textContent =
            'Eine Aufgabe zum Einstieg';
          const date = document.createElement('span');
          date.className = 'date-pill';
          date.textContent = 'Prüfung · 07.12.2026';
          document
            .querySelector('.topbar')
            .insertBefore(date, document.querySelector('.project-switch'));
        }, option);
        await page.addStyleTag({
          content:
            css +
            '\n*,*::before,*::after { transition: none !important; animation: none !important; }',
        });
      }
      const metrics = await page.evaluate(() => {
        const bottom = (selector) =>
          Math.round(document.querySelector(selector).getBoundingClientRect().bottom);
        return {
          viewport: innerHeight,
          overflow: document.documentElement.scrollWidth > innerWidth,
          subjectsBottom: bottom('.exam-priority-grid'),
          topicsBottom: bottom('.topic-grid'),
          routineTop: Math.round(
            document.querySelector('.flow-routine').getBoundingClientRect().top,
          ),
          routineBottom: bottom('.routine-grid'),
          pageHeight: document.documentElement.scrollHeight,
        };
      });
      const violations =
        option === 'before'
          ? null
          : (
              await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
            ).violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) }));
      results.push({ option, width, ...metrics, violations });
      if (width === 1440 || width === 1366) {
        await page.screenshot({ path: path.join(directory, 'images', `${option}-${width}.png`) });
      }
    }
    await context.close();
  }
} finally {
  await browser.close();
}
await writeFile(path.join(directory, 'measurements.json'), JSON.stringify(results, null, 2) + '\n');
console.log(JSON.stringify(results, null, 2));
