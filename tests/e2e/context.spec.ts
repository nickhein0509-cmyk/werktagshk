import { test, expect } from '@playwright/test';
import { contextView } from '../../supabase/functions/assistance/domain.mjs';

const segment = {
  id: 'synthetic-context-segment', kind: 'trip',
  startTimestamp: 1793102400, endTimestamp: 1793102700, pointCount: 3,
};
const entry = {
  id: 'synthetic-context-entry', kind: 'activity', label: 'Eigene Tätigkeitsnotiz',
  startAt: new Date(segment.startTimestamp * 1000).toISOString(),
  endAt: new Date(segment.endTimestamp * 1000).toISOString(),
  segmentRef: {
    journalIdAtCreation: segment.id, segmentKind: segment.kind,
    startTimestamp: segment.startTimestamp, endTimestamp: segment.endTimestamp,
    anchorFingerprint: [segment.kind, segment.startTimestamp, segment.endTimestamp, segment.pointCount].join(':'),
  },
};

for (const variant of ['changed-fingerprint', 'unavailable-journal', 'matched'] as const) {
  test(`manual context renders the server segment verdict for ${variant}`, async ({ page }) => {
    const journal = variant === 'unavailable-journal' ? null : {
      trips: [{ ...segment, pointCount: variant === 'changed-fingerprint' ? 4 : 3 }], stays: [],
    };
    const value = contextView({ date: '2026-10-27', revision: 1, entries: [entry] }, journal);
    expect(value.entries[0].needsReview).toBe(variant !== 'matched');
    await page.route('**/assistenz/context?**', route => route.fulfill({
      status: 200, contentType: 'application/json', body: JSON.stringify(value),
    }));
    await page.goto('/projekte');
    await page.evaluate(async ({ journal }) => {
      document.body.innerHTML = '<div id="context-view"></div>';
      const moduleUrl = '/assistance-assets/context.js';
      const { createContext } = await import(moduleUrl);
      const context = createContext({ onLocked() {}, onChanged() {} });
      await context.setDay({ date: '2026-10-27', journal });
    }, { journal });
    await expect(page.getByText('Eigene Tätigkeitsnotiz', { exact: true })).toBeVisible();
    const warning = page.getByText('Zuordnung prüfen: Der GPS-Abschnitt hat sich seit deiner Ergänzung geändert.', { exact: true });
    await expect(warning).toHaveCount(variant === 'matched' ? 0 : 1);
  });
}
