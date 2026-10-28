import { expect, test, type Page } from '@playwright/test';

async function fixture(page: Page, { signedIn = true, linked = true, legacy = false, oldBound = false } = {}) {
  const events: string[] = [];
  let authorized = legacy || oldBound;
  await page.addInitScript(({ signedIn }) => {
    if (!signedIn || sessionStorage.getItem('catalogue-fixture-initialized')) return;
    sessionStorage.setItem('catalogue-fixture-initialized', '1');
    const user = { id: '33333333-3333-4333-8333-333333333333', email: 'catalogue@example.invalid', aud: 'authenticated', role: 'authenticated' };
    const token = `${btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${btoa(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600 }))}.synthetic`;
    localStorage.setItem('werktag-learning-auth', JSON.stringify({ access_token: token, refresh_token: 'synthetic', token_type: 'bearer', expires_at: Math.floor(Date.now() / 1000) + 3600, user }));
  }, { signedIn });
  await page.route('https://test-werktag.supabase.co/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
  await page.route('**/assistenz/session', route => {
    events.push('session');
    return route.fulfill({ status: authorized ? 200 : 401, contentType: 'application/json', body: JSON.stringify(authorized ? { canRead: true, accountBound: oldBound } : { error: 'Locked' }) });
  });
  await page.route('**/api/assistenz-account?route=session', route => {
    events.push('account'); if (linked) authorized = true;
    return route.fulfill({ status: linked ? 200 : 403, contentType: 'application/json', body: '{}' });
  });
  await page.route('**/assistenz/logout', route => {
    events.push('logout'); authorized = false;
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  await page.route('**/assistenz/auth', route => {
    events.push('legacy'); authorized = true;
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  await page.route('**/assistenz/components/view', route => {
    events.push('view');
    return route.fulfill({ status: authorized ? 200 : 401, contentType: 'text/html', body: authorized ? '<!doctype html><main><h1>Privater Fixture-Katalog</h1></main><script defer src="/assistance-assets/catalog-session.js"></script>' : '<h1>Anmeldung erforderlich</h1>' });
  });
  return events;
}

test('catalogue entry establishes the existing account session before loading private resources', async ({ page }) => {
  const events = await fixture(page);
  await page.goto('/components.html');
  await expect(page.getByRole('heading', { name: 'Privater Fixture-Katalog' })).toBeVisible();
  expect(events.indexOf('account')).toBeLessThan(events.indexOf('view'));
  await expect(page).toHaveURL(/\/assistenz\/components\/view$/);
});

test('an unlinked account cannot reuse the previous account catalogue cookie', async ({ page }) => {
  const events = await fixture(page, { linked: false, oldBound: true });
  await page.goto('/components.html');
  await expect(page.getByRole('heading', { name: 'Anmeldung erforderlich' })).toBeVisible();
  expect(events.indexOf('logout')).toBeLessThan(events.indexOf('view'));
  await expect(page.locator('body')).not.toContainText('Privater Fixture-Katalog');
});

test('existing private capability access still opens the catalogue without a second login', async ({ page }) => {
  const events = await fixture(page, { signedIn: false, legacy: true });
  await page.goto('/components.html');
  await expect(page.getByRole('heading', { name: 'Privater Fixture-Katalog' })).toBeVisible();
  expect(events).not.toContain('account');
});

test('an explicit private catalogue key is exchanged and removed from the URL', async ({ page }) => {
  const events = await fixture(page, { signedIn: false });
  await page.goto('/components.html#key=' + 's'.repeat(43));
  await expect(page.getByRole('heading', { name: 'Privater Fixture-Katalog' })).toBeVisible();
  expect(events).toContain('legacy');
  expect(new URL(page.url()).hash).toBe('');
});

test('an open catalogue clears private contents when another tab signs out', async ({ page, context }) => {
  await fixture(page);
  await page.goto('/components.html');
  await expect(page.getByRole('heading', { name: 'Privater Fixture-Katalog' })).toBeVisible();
  const other = await context.newPage();
  await other.route('**/fixture-storage-event', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Storage fixture</title>' }));
  await other.goto('/fixture-storage-event');
  await other.evaluate(() => localStorage.removeItem('werktag-learning-auth'));
  await expect(page).toHaveURL(/\/konto$/);
  await expect(page.locator('body')).not.toContainText('Privater Fixture-Katalog');
});
