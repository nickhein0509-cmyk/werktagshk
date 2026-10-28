import { test, expect, type Page } from '@playwright/test';

const userId = '22222222-2222-4222-8222-222222222222';
const user = { id: userId, email: 'account-fixture@example.invalid', aud: 'authenticated', role: 'authenticated' };
const guest = { version: 1, attempts: [], bookmarks: [], dailyGoal: 8 };

interface HealthFixture {
  ok: boolean;
  status: string;
  configured: boolean;
  enabled: boolean;
  cronActive: boolean;
  intervalMinutes: number;
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  sourceLastSyncAt: string | null;
  sourceLastDataAt: string | null;
  nextCheckAt: string | null;
  errorCode: string | null;
}

async function accountFixture(page: Page, options: {
  signedIn?: boolean; linked?: boolean; claimDenied?: boolean; claimUnavailable?: boolean; passwordUpdateFails?: boolean;
  healthState?: Partial<HealthFixture>; healthCheckError?: string;
} = {}) {
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
    if (path.endsWith('/token') && new URL(route.request().url()).searchParams.get('grant_type') === 'password') {
      calls.push({ route: 'auth:password-login', body: route.request().postDataJSON() });
      const accessToken = [
        Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
        Buffer.from(JSON.stringify({ sub: userId, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url'),
        'synthetic-password-login',
      ].join('.');
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ access_token: accessToken, refresh_token: 'synthetic-login-refresh', token_type: 'bearer', expires_in: 3600, user }) });
    }
    if (path.endsWith('/recover')) calls.push({ route: 'auth:recover', body: route.request().postDataJSON() });
    if (path.endsWith('/user') && route.request().method() === 'PUT') {
      calls.push({ route: 'auth:update-password', body: route.request().postDataJSON() });
      if (options.passwordUpdateFails) return route.fulfill({ status: 422, contentType: 'application/json', body: '{"message":"Synthetic rejected password"}' });
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(path.endsWith('/user') ? user : {}) });
  });
  const health: HealthFixture = { ok: true, status: 'not_configured', configured: false, enabled: false, cronActive: false, intervalMinutes: 15, lastAttemptAt: null, lastSuccessAt: null, sourceLastSyncAt: null, sourceLastDataAt: null, nextCheckAt: null, errorCode: null, ...options.healthState };
  await page.route('**/api/assistenz-account?**', async (route) => {
    const request = route.request();
    const name = new URL(request.url()).searchParams.get('route')!;
    calls.push({ route: name, body: request.postDataJSON() ?? undefined, authorization: request.headers().authorization });
    if (name === 'claim' && options.claimDenied) {
      await route.fulfill({ status: 409, contentType: 'application/json', body: '{"error":"Already linked"}' });
      return;
    }
    if (name === 'claim' && options.claimUnavailable) {
      await route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"Synthetic unavailable service"}' });
      return;
    }
    if (name === 'claim') linked = true;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(name === 'status' ? { linked, canRead: linked } : { ok: true }) });
  });
  await page.route('**/api/assistenz-health?**', async (route) => {
    const request = route.request();
    const name = new URL(request.url()).searchParams.get('route')!;
    calls.push({ route: `health:${name}`, body: request.postDataJSON() ?? undefined, authorization: request.headers().authorization });
    if (name === 'check') {
      if (options.healthCheckError) return route.fulfill({ status: 400, json: { error: options.healthCheckError } });
      return route.fulfill({ json: { ok: true, sourceConnected: true, metricsAvailable: 16, historyWindowDays: 7,
        historyFloor: '2026-10-22', sourceLastSyncAt: '2026-10-28T09:47:00Z', sourceLastDataAt: '2026-10-28T09:40:00Z' } });
    }
    if (name === 'configure') Object.assign(health, { status: 'active', configured: true, enabled: true, cronActive: true, lastAttemptAt: '2026-10-28T10:00:00Z', lastSuccessAt: '2026-10-28T10:00:00Z', sourceLastSyncAt: '2026-10-28T09:47:00Z', sourceLastDataAt: '2026-10-28T09:40:00Z', nextCheckAt: '2026-10-28T10:15:00Z' });
    if (name === 'refresh') Object.assign(health, { status: 'active', lastAttemptAt: '2026-10-28T10:05:00Z', lastSuccessAt: '2026-10-28T10:05:00Z', sourceLastSyncAt: '2026-10-28T09:47:00Z', sourceLastDataAt: '2026-10-28T09:40:00Z', errorCode: null });
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
  await expect(page.getByRole('link', { name: 'Assistent öffnen', exact: true })).toHaveAttribute('href', '/assistenz');
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
  await expect(page.getByRole('link', { name: 'Assistent öffnen', exact: true })).toHaveCount(0);
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

test('Freddy connection check is explicit and does not activate or persist the supplied key', async ({ page }) => {
  const calls = await accountFixture(page, { linked: true });
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('/konto');
  await expect(page.getByText('Noch nicht aktiviert', { exact: true })).toBeVisible();
  const key = 'synthetic-check-only-personal-api-key';
  const input = page.getByLabel('Persönlicher Freddy-API-Schlüssel', { exact: true });
  await input.fill(key);
  expect(calls.some(entry => entry.route === 'health:check')).toBe(false);
  await page.getByRole('button', { name: 'Verbindung prüfen', exact: true }).click();
  await expect(page.getByLabel('Ergebnis der Verbindungsprüfung', { exact: true })).toContainText('16 unterstützte Tagesmetriken');
  await expect(page.getByText(/Dein Freddy-Tarif erlaubt den Abruf der letzten 7 Tage/)).toBeVisible();
  await expect(page.getByText('Noch nicht aktiviert', { exact: true })).toBeVisible();
  await expect(input).toHaveValue(key);
  expect(calls.filter(entry => entry.route === 'health:check')).toHaveLength(1);
  expect(calls.find(entry => entry.route === 'health:check')?.body).toEqual({ apiKey: key });
  expect(calls.find(entry => entry.route === 'health:check')?.authorization).toMatch(/^Bearer /);
  expect(calls.some(entry => entry.route === 'health:configure')).toBe(false);
  expect(await page.evaluate(() => JSON.stringify(localStorage) + JSON.stringify(sessionStorage))).not.toContain(key);
  expect(await page.locator('body').innerText()).not.toContain(key);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test('a stored Health connection is not called active before a successful import and can be refreshed without reentering its key', async ({ page }) => {
  const calls = await accountFixture(page, { linked: true, healthState: {
    status: 'active', configured: true, enabled: true, cronActive: true, lastSuccessAt: null,
  } });
  await page.goto('/konto');
  await expect(page.getByText('Erster vollständiger Abruf steht aus', { exact: true })).toBeVisible();
  await expect(page.getByText('Automatischer Abgleich aktiv', { exact: true })).toHaveCount(0);
  await expect(page.getByLabel('Persönlicher Freddy-API-Schlüssel', { exact: true })).toHaveValue('');
  await page.getByRole('button', { name: 'Jetzt Health-Daten abrufen', exact: true }).click();
  await expect(page.getByText('Automatischer Abgleich aktiv', { exact: true })).toBeVisible();
  await expect(page.getByText(/Das erzwingt keine neue Messung auf dem iPhone/)).toBeVisible();
  expect(calls.filter(entry => entry.route === 'health:refresh')).toHaveLength(1);
  expect(calls.find(entry => entry.route === 'health:refresh')?.body).toEqual({});
  expect(calls.some(entry => entry.route === 'health:configure')).toBe(false);
});

for (const variant of ['missing-schedule', 'source-error'] as const) {
  test(`Health status gives an actionable ${variant} instead of claiming a working connection`, async ({ page }) => {
    await accountFixture(page, { linked: true, healthState: {
      status: 'active', configured: true, enabled: true,
      cronActive: variant === 'source-error', lastSuccessAt: '2026-10-28T09:00:00Z',
      errorCode: variant === 'source-error' ? 'HEALTH_SOURCE_NOT_CONNECTED' : null,
    } });
    await page.goto('/konto');
    await expect(page.getByText(variant === 'source-error' ? 'Health-Abgleich braucht Aufmerksamkeit' : 'Zeitplan nicht aktiv', { exact: true })).toBeVisible();
    await expect(page.getByText('Automatischer Abgleich aktiv', { exact: true })).toHaveCount(0);
    await expect(page.getByText(variant === 'source-error' ? /Apple Health ist bei Freddy pausiert/ : /der automatische Zeitplan läuft nicht/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Health-Abgleich einrichten', exact: true })).toBeVisible();
  });
}

test('a rejected Freddy check reports the provider diagnosis without enabling a schedule', async ({ page }) => {
  const calls = await accountFixture(page, { linked: true, healthCheckError: 'HEALTH_KEY_INVALID' });
  await page.goto('/konto');
  await page.getByLabel('Persönlicher Freddy-API-Schlüssel', { exact: true }).fill('synthetic-rejected-key');
  await page.getByRole('button', { name: 'Verbindung prüfen', exact: true }).click();
  await expect(page.getByText(/Freddy hat den Schlüssel abgewiesen/)).toBeVisible();
  await expect(page.getByText('Noch nicht aktiviert', { exact: true })).toBeVisible();
  expect(calls.some(entry => entry.route === 'health:configure')).toBe(false);
  expect(await page.evaluate(() => JSON.stringify(localStorage) + JSON.stringify(sessionStorage))).not.toContain('synthetic-rejected-key');
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
  await expect(page.getByRole('link', { name: 'Assistent öffnen', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Abmelden', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Anmelden', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Assistent öffnen', exact: true })).toHaveCount(0);
  expect(calls.some((entry) => entry.route === 'map:logout')).toBe(true);
});

test('manual owner proof stays focused, requires explicit confirmation and never accepts a read-only link', async ({ page }) => {
  const calls = await accountFixture(page);
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('/konto');
  const proof = page.getByLabel('Persönlicher Verbindungs- oder Besitzerlink', { exact: true });
  await proof.pressSequentially('https://werk-tag.com/assistenz#key=synthetic-read-only');
  await expect(proof).toBeFocused();
  expect(calls.some((entry) => entry.route === 'claim')).toBe(false);
  await page.getByRole('button', { name: 'Private Assistenz zuordnen', exact: true }).click();
  await expect(page.getByText(/Dieser Kartenlink ist nur zum Lesen/)).toBeVisible();
  expect(calls.some((entry) => entry.route === 'claim')).toBe(false);
  const owner = 'synthetic-manually-entered-owner';
  await proof.fill(`https://legacy.example.invalid/map#key=synthetic-read-only&owner=${owner}`);
  await page.getByRole('button', { name: 'Private Assistenz zuordnen', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Assistent öffnen', exact: true })).toBeVisible();
  expect(calls.filter((entry) => entry.route === 'claim')).toHaveLength(1);
  expect(calls.find((entry) => entry.route === 'claim')?.body).toEqual({ ownerKey: owner });
  expect(await page.evaluate(() => JSON.stringify(localStorage) + JSON.stringify(sessionStorage))).not.toContain(owner);
  expect(await page.locator('body').innerText()).not.toContain(owner);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test('manual claim failure keeps the original proof available for an explicit retry', async ({ page }) => {
  const calls = await accountFixture(page, { claimUnavailable: true });
  await page.goto('/konto');
  const proof = page.getByLabel('Persönlicher Verbindungs- oder Besitzerlink', { exact: true });
  await proof.fill('synthetic-retry-owner');
  await page.getByRole('button', { name: 'Private Assistenz zuordnen', exact: true }).click();
  await expect(page.getByText('Die Verbindung konnte nicht hergestellt werden. Bitte erneut versuchen.')).toBeVisible();
  await expect(proof).toHaveValue('synthetic-retry-owner');
  await expect(page.getByRole('link', { name: 'Assistent öffnen', exact: true })).toHaveCount(0);
  expect(calls.filter((entry) => entry.route === 'claim')).toHaveLength(1);
});

test('the first sign-in preserves a pending connection proof until explicit account linking', async ({ page }) => {
  const calls = await accountFixture(page, { signedIn: false });
  const proof = 'synthetic-first-login-owner';
  await page.goto(`/konto#connect=${proof}`);
  await expect(page.getByText('Dein privater Verbindungslink ist vorbereitet.', { exact: false })).toBeVisible();
  await page.getByLabel('E-Mail-Adresse', { exact: true }).fill('account-fixture@example.invalid');
  await page.getByLabel('Passwort', { exact: true }).fill('synthetic-login-password');
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Dein Profil', exact: true })).toBeVisible();
  await expect(page.getByLabel('Persönlicher Verbindungs- oder Besitzerlink', { exact: true })).toHaveValue(proof);
  expect(calls.filter((entry) => entry.route === 'auth:password-login')).toHaveLength(1);
  expect(calls.some((entry) => entry.route === 'claim')).toBe(false);
  await page.getByRole('button', { name: 'Private Assistenz zuordnen', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Assistent öffnen', exact: true })).toBeVisible();
  expect(calls.find((entry) => entry.route === 'claim')?.body).toEqual({ ownerKey: proof });
});

test('password recovery request validates only the email and does not require or retain a password', async ({ page }) => {
  const calls = await accountFixture(page, { signedIn: false });
  await page.goto('/konto');
  await page.getByRole('button', { name: 'Passwort vergessen', exact: true }).click();
  expect(calls.some((entry) => entry.route === 'auth:recover')).toBe(false);
  await page.getByLabel('E-Mail-Adresse', { exact: true }).fill('recovery-fixture@example.invalid');
  await page.getByRole('button', { name: 'Passwort vergessen', exact: true }).click();
  await expect(page.getByText(/Falls zu dieser E-Mail-Adresse ein Konto besteht/)).toBeVisible();
  expect(calls.filter((entry) => entry.route === 'auth:recover')).toHaveLength(1);
  expect(calls.find((entry) => entry.route === 'auth:recover')?.body).toMatchObject({ email: 'recovery-fixture@example.invalid' });
  await expect(page.getByLabel('Passwort', { exact: true })).toHaveValue('');
});

function recoveryFragment() {
  const token = [
    Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
    Buffer.from(JSON.stringify({ sub: userId, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url'),
    'synthetic-password-recovery',
  ].join('.');
  return new URLSearchParams({ access_token: token, refresh_token: 'synthetic-recovery-refresh', expires_in: '3600', token_type: 'bearer', type: 'recovery' });
}

test('recovery callback lets the signed-in owner explicitly confirm a matching new password', async ({ page }) => {
  const calls = await accountFixture(page, { signedIn: false, linked: true });
  await page.goto(`/konto#${recoveryFragment()}`);
  await expect(page.getByRole('heading', { name: 'Neues Passwort festlegen', exact: true })).toBeVisible();
  const password = 'synthetic-new-password-only';
  await page.getByLabel('Neues Passwort', { exact: true }).fill(password);
  await page.getByLabel('Neues Passwort wiederholen', { exact: true }).fill('synthetic-different-password');
  await page.getByRole('button', { name: 'Neues Passwort speichern', exact: true }).click();
  await expect(page.getByText('Die beiden Passwörter stimmen noch nicht überein.')).toBeVisible();
  expect(calls.some((entry) => entry.route === 'auth:update-password')).toBe(false);
  await page.getByLabel('Neues Passwort wiederholen', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Neues Passwort speichern', exact: true }).click();
  await expect(page.getByText(/Dein neues Passwort ist gespeichert/)).toBeVisible();
  const update = calls.find((entry) => entry.route === 'auth:update-password')?.body;
  expect(update).toMatchObject({ password });
  // supabase-js may include null PKCE bookkeeping in a password-only update.
  expect(Object.keys(update ?? {}).filter((key) => !['password', 'code_challenge', 'code_challenge_method'].includes(key))).toEqual([]);
  for (const key of ['code_challenge', 'code_challenge_method']) {
    if (update && key in update) expect(update[key]).toBeNull();
  }
  await expect(page.getByRole('heading', { name: 'Neues Passwort festlegen', exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => JSON.stringify(localStorage) + JSON.stringify(sessionStorage))).not.toContain(password);
});

test('a rejected password update clears both password fields and keeps a retry path', async ({ page }) => {
  await accountFixture(page, { signedIn: false, passwordUpdateFails: true });
  await page.goto(`/konto#${recoveryFragment()}`);
  await page.getByLabel('Neues Passwort', { exact: true }).fill('synthetic-rejected-password');
  await page.getByLabel('Neues Passwort wiederholen', { exact: true }).fill('synthetic-rejected-password');
  await page.getByRole('button', { name: 'Neues Passwort speichern', exact: true }).click();
  await expect(page.getByText(/Das Passwort konnte nicht gespeichert werden/)).toBeVisible();
  await expect(page.getByLabel('Neues Passwort', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('Neues Passwort wiederholen', { exact: true })).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Neues Passwort speichern', exact: true })).toBeEnabled();
});

test('signing out clears a pending owner proof before the next account', async ({ page }) => {
  await accountFixture(page);
  await page.goto('/konto#connect=synthetic-pending-owner');
  await expect(page.getByLabel('Persönlicher Verbindungs- oder Besitzerlink', { exact: true })).toHaveValue('synthetic-pending-owner');
  await page.getByRole('button', { name: 'Abmelden', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Anmelden', exact: true })).toBeVisible();
  await expect(page.getByText('Dein privater Verbindungslink ist vorbereitet.')).toHaveCount(0);
  expect(await page.evaluate(() => JSON.stringify(localStorage) + JSON.stringify(sessionStorage))).not.toContain('synthetic-pending-owner');
});
