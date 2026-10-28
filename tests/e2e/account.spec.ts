import { test, expect, type Page } from '@playwright/test';

const userId = '22222222-2222-4222-8222-222222222222';
const user = { id: userId, email: 'account-fixture@example.invalid', aud: 'authenticated', role: 'authenticated' };
const guest = { version: 1, attempts: [], bookmarks: [], dailyGoal: 8 };

async function accountFixture(page: Page, options: { signedIn?: boolean; linked?: boolean; claimDenied?: boolean } = {}) {
  let linked = options.linked ?? false;
  const calls: { route: string; body?: Record<string, unknown>; authorization?: string }[] = [];
  await page.addInitScript(({ user, guest, signedIn }) => {
    localStorage.setItem('werktag-learning-v1', JSON.stringify(guest));
    if (signedIn) {
      const accessToken = `${btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${btoa(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600 }))}.synthetic`;
      localStorage.setItem('werktag-learning-auth', JSON.stringify({
        access_token: accessToken, refresh_token: 'synthetic-account-refresh', token_type: 'bearer',
        expires_at: Math.floor(Date.now() / 1000) + 3600, user,
      }));
    }
  }, { user, guest, signedIn: options.signedIn ?? true });
  await page.route('https://test-werktag.supabase.co/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.startsWith('/rest/')) throw new Error('Account page must not read or sync learning data.');
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(path.endsWith('/user') ? user : {}) });
  });
  const health = { ok: true, status: 'not_configured', configured: false, enabled: false, cronActive: false, intervalMinutes: 15, lastAttemptAt: null, lastSuccessAt: null, sourceLastSyncAt: null, sourceLastDataAt: null, nextCheckAt: null, errorCode: null };
  await page.route('**/api/assistenz-account?**', async (route) => {
    const request = route.request();
    const name = new URL(request.url()).searchParams.get('route')!;
    calls.push({ route: name, body: request.postDataJSON() ?? undefined, authorization: request.headers().authorization });
    if (name === 'claim' && options.claimDenied) {
      await route.fulfill({ status: 409, contentType: 'application/json', body: '{"error":"Already linked"}' });
      return;
    }
    if (name === 'claim') linked = true;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(name === 'status' ? { linked, canRead: linked } : { ok: true }) });
  });
  await page.route('**/api/assistenz-health?**', async (route) => {
    const request = route.request();
    const name = new URL(request.url()).searchParams.get('route')!;
    calls.push({ route: `health:${name}`, body: request.postDataJSON() ?? undefined, authorization: request.headers().authorization });
    if (name === 'configure') Object.assign(health, { status: 'active', configured: true, enabled: true, cronActive: true, lastAttemptAt: '2026-10-28T10:00:00Z', lastSuccessAt: '2026-10-28T10:00:00Z', sourceLastSyncAt: '2026-10-28T09:47:00Z', sourceLastDataAt: '2026-10-28T09:40:00Z', nextCheckAt: '2026-10-28T10:15:00Z' });
    if (name === 'disable') Object.assign(health, { status: 'disabled', enabled: false, cronActive: false });
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(health) });
  });
  await page.route('**/assistenz/logout', async (route) => {
    calls.push({ route: 'map:logout' });
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });
  return calls;
}

test('account connection removes the secret fragment, waits for explicit consent and preserves learner data', async ({ page }) => {
  const calls = await accountFixture(page);
  const connectionKey = 'synthetic-private-owner-connection-only';
  await page.goto(`/konto#connect=${connectionKey}`);
  await expect(page).toHaveURL(/\/konto$/);
  await expect(page.getByRole('button', { name: 'Private Assistenz zuordnen', exact: true })).toBeVisible();
  expect(calls.some((entry) => entry.route === 'claim')).toBe(false);
  expect(await page.locator('body').innerText()).not.toContain(connectionKey);
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain(connectionKey);
  await page.getByRole('button', { name: 'Private Assistenz zuordnen', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Private Karte öffnen', exact: true })).toHaveAttribute('href', '/assistenz');
  expect(calls.find((entry) => entry.route === 'claim')?.body).toEqual({ ownerKey: connectionKey });
  expect(calls.filter((entry) => entry.route === 'claim')).toHaveLength(1);
  expect(calls.filter((entry) => ['status', 'session', 'claim'].includes(entry.route)).every((entry) => entry.authorization?.startsWith('Bearer '))).toBe(true);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('werktag-learning-v1')!))).toEqual(guest);
});

test('a conflicting owner claim never opens private map access', async ({ page }) => {
  await accountFixture(page, { claimDenied: true });
  await page.goto('/konto#connect=synthetic-conflicting-owner');
  await page.getByRole('button', { name: 'Private Assistenz zuordnen', exact: true }).click();
  await expect(page.getByText('Diese Assistenz ist bereits einem anderen Konto zugeordnet.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Private Karte öffnen', exact: true })).toHaveCount(0);
});

for (const callback of ['signup', 'recovery']) {
  test(`account ${callback} callback reaches Supabase before its fragment is consumed`, async ({ page }) => {
    await accountFixture(page, { signedIn: false });
    const token = [
      Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
      Buffer.from(JSON.stringify({ sub: userId, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url'),
      'synthetic-callback',
    ].join('.');
    const fragment = new URLSearchParams({
      access_token: token, refresh_token: 'synthetic-callback-refresh',
      expires_in: '3600', token_type: 'bearer', type: callback,
      connect: 'synthetic-callback-owner-connection',
    });
    await page.goto(`/konto#${fragment}`);
    await expect(page.getByRole('heading', { name: 'Dein Profil', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Private Assistenz zuordnen', exact: true })).toBeVisible();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('werktag-learning-auth')!).user.id)).toBe(userId);
    expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain('synthetic-callback-owner-connection');
    await expect(page).toHaveURL(/\/konto#?$/);
  });
}

test('an unrelated account anchor survives loading the account module', async ({ page }) => {
  await accountFixture(page, { signedIn: false });
  await page.goto('/konto#account-main');
  await expect(page.getByRole('heading', { name: 'Anmelden', exact: true })).toBeVisible();
  expect(new URL(page.url()).hash).toBe('#account-main');
});

test('Health activation separates cloud checks from source timestamps and never stores the API key', async ({ page }) => {
  const calls = await accountFixture(page, { linked: true });
  await page.goto('/konto');
  await expect(page.getByText('Noch nicht aktiviert', { exact: true })).toBeVisible();
  const key = 'synthetic-freddy-personal-api-key';
  const input = page.getByLabel('Persönlicher Freddy-API-Schlüssel', { exact: true });
  await input.fill(key);
  await page.getByRole('button', { name: 'Health-Abgleich einrichten', exact: true }).click();
  await expect(input).toHaveValue('');
  await expect(page.getByText('Automatischer Abgleich aktiv', { exact: true })).toBeVisible();
  await expect(page.getByText('Letzte Cloud-Prüfung', { exact: true })).toBeVisible();
  await expect(page.getByText('Neueste verfügbare Quelldaten', { exact: true })).toBeVisible();
  expect(calls.find((entry) => entry.route === 'health:configure')?.body).toEqual({ apiKey: key });
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain(key);
  expect(await page.locator('body').innerText()).not.toContain(key);
  await page.getByRole('button', { name: 'Automatischen Health-Abgleich ausschalten', exact: true }).click();
  await expect(page.getByText('Automatischer Health-Abgleich ausgeschaltet. Gespeicherte Daten bleiben erhalten.')).toBeVisible();
  expect(calls.find((entry) => entry.route === 'health:disable')?.body).toEqual({});
});

test('visible account entry works on a narrow phone and signed-out accounts cannot claim a map', async ({ page }) => {
  const calls = await accountFixture(page, { signedIn: false });
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('/projekte');
  await page.getByRole('link', { name: 'Konto & Anmeldung', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Anmelden', exact: true })).toBeVisible();
  await expect(page.getByLabel('E-Mail-Adresse', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  expect(calls).toEqual([]);
});

test('sign-out clears the map session before leaving the account', async ({ page }) => {
  const calls = await accountFixture(page, { linked: true });
  await page.goto('/konto');
  await expect(page.getByRole('link', { name: 'Private Karte öffnen', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Abmelden', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Anmelden', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Private Karte öffnen', exact: true })).toHaveCount(0);
  expect(calls.some((entry) => entry.route === 'map:logout')).toBe(true);
});
