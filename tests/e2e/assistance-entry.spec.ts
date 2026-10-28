import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

// Synthetic local browser fixtures only; never contacts a real account or map.
const userId = '11111111-1111-4111-8111-111111111111';
const privateValue = 'SYNTHETIC_MAP_PRIVATE_VALUE';
interface Options {
  signedIn?: boolean;
  linked?: boolean;
  existingSession?: boolean;
  accountBound?: boolean;
  missingBinding?: boolean;
  logoutFails?: boolean;
  resetPending?: boolean;
}

async function fixture(page: Page, options: Options = {}) {
  const events: string[] = [];
  const authHeaders: string[] = [];
  let authorized = options.existingSession === true;
  let bound = options.accountBound === true;
  await page.addInitScript(({ signedIn, userId, resetPending }) => {
    if (sessionStorage.getItem('synthetic-assistance-initialized')) return;
    sessionStorage.setItem('synthetic-assistance-initialized', '1');
    if (resetPending) sessionStorage.setItem('werktag-assistance-clear-on-boot', '1');
    if (!signedIn) { localStorage.removeItem('werktag-learning-auth'); return; }
    const token = `${btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${btoa(JSON.stringify({ sub: userId, exp: Math.floor(Date.now() / 1000) + 3600 }))}.synthetic`;
    localStorage.setItem('werktag-learning-auth', JSON.stringify({
      access_token: token, refresh_token: 'synthetic-refresh-token', token_type: 'bearer',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: userId, email: 'fixture@example.invalid', aud: 'authenticated', role: 'authenticated' },
    }));
  }, { signedIn: options.signedIn === true, userId, resetPending: options.resetPending === true });
  // Vite's development SPA fallback does not apply production Vercel rewrites.
  await page.route('**/assistenz', async route => {
    const document = await page.request.get('/assistance.html');
    await route.fulfill({ response: document });
  });
  await page.route('https://test-werktag.supabase.co/**', async route => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/logout')) return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: userId, email: 'fixture@example.invalid' }) });
  });
  await page.route('**/api/assistenz-account?route=session', async route => {
    events.push('account:session'); authHeaders.push(route.request().headers().authorization ?? '');
    if (options.linked) { authorized = true; bound = true; }
    await route.fulfill({ status: options.linked ? 200 : 403, contentType: 'application/json', body: JSON.stringify(options.linked ? { ok: true } : { error: 'Synthetic account not linked' }) });
  });
  await page.route('**/assistenz/session', route => {
    events.push('map:session');
    const body = options.missingBinding ? { canRead: true } : { canRead: true, canWrite: false, accountBound: bound };
    return route.fulfill({ status: authorized ? 200 : 401, contentType: 'application/json', body: JSON.stringify(authorized ? body : { error: 'Synthetic locked map' }) });
  });
  await page.route('**/assistenz/logout', route => {
    events.push('map:logout');
    if (!options.logoutFails) { authorized = false; bound = false; }
    return route.fulfill({ status: options.logoutFails ? 503 : 200, contentType: 'application/json', body: '{}' });
  });
  await page.route('**/assistenz/auth', route => {
    events.push('map:legacy-auth'); authorized = true; bound = false;
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  await page.route('**/assistenz/data', route => {
    events.push('map:data');
    return route.fulfill({ status: authorized ? 200 : 401, contentType: 'application/json', body: '{}' });
  });
  // Vite adds `?import` to variable dynamic imports in development. Match the
  // protected asset path so the synthetic module also intercepts that request.
  await page.route(url => url.pathname === '/assistenz/app-v4.js', route => {
    events.push('map:module');
    return route.fulfill({ status: 200, contentType: 'text/javascript', body: `
      const marker = document.getElementById('distance');
      document.addEventListener('werktag:assistance-lock', () => { marker.textContent = ''; });
      const key = new URLSearchParams(location.hash.slice(1)).get('key');
      if (key) { await fetch('/assistenz/auth', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key})}); history.replaceState(null,'','/assistance.html'); }
      const result = await fetch('/assistenz/data');
      marker.textContent = result.ok ? '${privateValue}' : 'FIXTURE_MAP_LOCKED';
    ` });
  });
  return { events, authHeaders };
}

test('existing account session is exchanged before map code can read private data', async ({ page }) => {
  const state = await fixture(page, { signedIn: true, linked: true });
  await page.goto('/assistance.html');
  await expect(page.locator('#distance')).toHaveText(privateValue);
  expect(state.events.indexOf('account:session')).toBeLessThan(state.events.indexOf('map:module'));
  expect(state.authHeaders).toHaveLength(1); expect(state.authHeaders[0]).toMatch(/^Bearer /);
  await expect(page.locator('body')).not.toContainText(state.authHeaders[0]);
  await expect(page.locator('body')).not.toContainText(userId);
  await page.waitForLoadState('networkidle');
  expect(state.events.filter(event => event === 'map:module')).toHaveLength(1);
});

test('signed-out browser clears an old account-bound map cookie before loading the map', async ({ page }) => {
  const state = await fixture(page, { existingSession: true, accountBound: true });
  await page.goto('/assistance.html');
  await expect(page.locator('#distance')).toHaveText('FIXTURE_MAP_LOCKED');
  expect(state.events.indexOf('map:logout')).toBeLessThan(state.events.indexOf('map:module'));
  expect(state.events).not.toContain('account:session');
});

test('independent legacy map sessions survive an unrelated signed-out account state', async ({ page }) => {
  const state = await fixture(page, { existingSession: true, accountBound: false });
  await page.goto('/assistance.html');
  await expect(page.locator('#distance')).toHaveText(privateValue);
  expect(state.events).not.toContain('map:logout'); expect(state.events).not.toContain('account:session');
});

test('signed-in unlinked account cannot inherit a previous linked account map session', async ({ page }) => {
  const state = await fixture(page, { signedIn: true, linked: false, existingSession: true, accountBound: true });
  await page.goto('/assistance.html');
  await expect(page.locator('#distance')).toHaveText('FIXTURE_MAP_LOCKED');
  expect(state.events.indexOf('account:session')).toBeLessThan(state.events.indexOf('map:logout'));
  expect(state.events.indexOf('map:logout')).toBeLessThan(state.events.indexOf('map:module'));
});

test('explicit private map fragments reach the existing map authentication unchanged', async ({ page }) => {
  const state = await fixture(page, { signedIn: true, linked: false, existingSession: true, accountBound: true });
  await page.goto('/assistance.html#key=synthetic-private-map-key');
  await expect(page.locator('#distance')).toHaveText(privateValue);
  expect(state.events).toContain('map:legacy-auth');
  expect(state.events).not.toContain('account:session'); expect(state.events).not.toContain('map:logout');
  expect(new URL(page.url()).hash).toBe('');
});

test('uncertain binding or failed old-session clearing fails closed without loading private map code', async ({ page }) => {
  const state = await fixture(page, { existingSession: true, accountBound: true, logoutFails: true });
  await page.goto('/assistance.html');
  await expect(page.locator('#assistance-auth-state')).toBeVisible();
  expect(state.events).not.toContain('map:module'); await expect(page.locator('body')).not.toContainText(privateValue);
});

test('a successful response without explicit binding metadata cannot expose a stale map session', async ({ page }) => {
  const state = await fixture(page, { existingSession: true, missingBinding: true });
  await page.goto('/assistance.html');
  await expect(page.locator('#assistance-auth-state')).toBeVisible();
  expect(state.events).not.toContain('map:module');
});

test('signing out after map initialization clears the private view and reloads without a session', async ({ page }) => {
  const state = await fixture(page, { signedIn: true, linked: true });
  await page.goto('/assistance.html');
  await expect(page.locator('#distance')).toHaveText(privateValue);
  await page.evaluate(async () => {
    const moduleUrl = '/src/lib/supabase.ts';
    const client = await import(moduleUrl);
    void client.supabase.auth.signOut({ scope: 'local' });
  });
  await expect(page).toHaveURL(/\/assistenz$/);
  await expect(page.locator('#distance')).toHaveText('FIXTURE_MAP_LOCKED');
  expect(state.events).toContain('map:logout');
  expect(state.events.filter(event => event === 'map:module')).toHaveLength(2);
  await expect(page.locator('body')).not.toContainText(privateValue);
});

test('an interrupted account-change transition clears even a late legacy cookie on the next boot', async ({ page }) => {
  const state = await fixture(page, { existingSession: true, accountBound: false, resetPending: true });
  await page.goto('/assistance.html');
  await expect(page.locator('#distance')).toHaveText('FIXTURE_MAP_LOCKED');
  expect(state.events[0]).toBe('map:logout');
  expect(await page.evaluate(() => sessionStorage.getItem('werktag-assistance-clear-on-boot'))).toBeNull();
});
