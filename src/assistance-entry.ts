import { supabase } from './lib/supabase';

// The map's capability flow stays independent. This bridge only exchanges the
// existing account session for a permission-checked, HttpOnly map session.
const explicitMapKey = Boolean(new URLSearchParams(location.hash.slice(1)).get('key'));
const resetMarker = 'werktag-assistance-clear-on-boot';
let activeUserId: string | null = null;
let observedUserId: string | null | undefined;
let authRevision = 0;
let ready = false;
let transitioning = false;

function lockVisibleMap() {
  document.dispatchEvent(new Event('werktag:assistance-lock'));
  const main = document.querySelector('main');
  if (main) main.hidden = true;
}

function blocked(message: string) {
  lockVisibleMap();
  let section = document.getElementById('assistance-auth-state');
  if (!section) {
    section = document.createElement('section');
    section.id = 'assistance-auth-state';
    section.className = 'access';
    section.setAttribute('role', 'alert');
    document.body.append(section);
  }
  const title = document.createElement('h1');
  title.textContent = 'Karte noch gesperrt';
  const text = document.createElement('p');
  text.textContent = message;
  const account = document.createElement('a');
  account.href = '/konto';
  account.textContent = 'Mein Konto öffnen';
  const retry = document.createElement('button');
  retry.type = 'button';
  retry.textContent = 'Erneut prüfen';
  retry.addEventListener('click', () => location.replace('/assistenz'));
  section.replaceChildren(title, text, account, retry);
}

async function clearMapSession() {
  const response = await fetch('/assistenz/logout', {
    method: 'POST', credentials: 'same-origin', signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error('map-session-clear-failed');
}

async function changeAccount() {
  if (transitioning) return;
  transitioning = true;
  lockVisibleMap();
  try { sessionStorage.setItem(resetMarker, '1'); } catch { /* Storage may be unavailable. */ }
  try { await clearMapSession(); } catch { /* Next boot checks the binding again. */ }
  // A fresh document removes all old map/context/Health values and does not
  // silently reuse a capability fragment after an account change.
  location.replace('/assistenz');
}

supabase?.auth.onAuthStateChange((event, session) => {
  if (event === 'INITIAL_SESSION') return;
  const nextId = session?.user.id ?? null;
  observedUserId = nextId;
  authRevision++;
  if (ready && (event === 'SIGNED_OUT' || nextId !== activeUserId)) void changeAccount();
});

async function storedMapSession() {
  const response = await fetch('/assistenz/session', {
    cache: 'no-store', credentials: 'same-origin', signal: AbortSignal.timeout(8000),
  });
  if (response.status === 401) return { accountBound: false };
  if (!response.ok) throw new Error('map-session-check-failed');
  const state: unknown = await response.json();
  if (!state || typeof state !== 'object' || !('accountBound' in state) || typeof state.accountBound !== 'boolean') {
    throw new Error('map-session-binding-unknown');
  }
  return { accountBound: state.accountBound };
}

async function localAccountSession() {
  if (!supabase) return null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      supabase.auth.getSession(),
      new Promise<never>((_resolve, reject) => { timer = setTimeout(() => reject(new Error('account-session-timeout')), 10000); }),
    ]);
    if (result.error) return null;
    return result.data.session;
  } finally { clearTimeout(timer); }
}

async function start() {
  let resetPending = false;
  try { resetPending = sessionStorage.getItem(resetMarker) === '1'; } catch { /* No stored transition. */ }
  if (resetPending) {
    await clearMapSession();
    try { sessionStorage.removeItem(resetMarker); } catch { /* Cleared server-side. */ }
  }
  const before = authRevision;
  let session = null;
  try { session = await localAccountSession(); } catch { /* Clear stale bound sessions below. */ }
  activeUserId = session?.user.id ?? null;
  if (authRevision !== before && observedUserId !== activeUserId) return changeAccount();

  if (!explicitMapKey) {
    const stored = await storedMapSession();
    let accountReady = false;
    if (session) {
      try {
        const response = await fetch('/api/assistenz-account?route=session', {
          method: 'POST', credentials: 'same-origin',
          headers: { Authorization: 'Bearer ' + session.access_token },
          signal: AbortSignal.timeout(10000),
        });
        accountReady = response.ok;
      } catch { /* An uncertain old account cookie must not unlock the map. */ }
    }
    if (!accountReady && stored.accountBound) await clearMapSession();
  }

  if (authRevision !== before && observedUserId !== activeUserId) return changeAccount();
  ready = true;
  if (transitioning) return;
  const moduleUrl = '/assistenz/app-v4.js';
  await import(/* @vite-ignore */ moduleUrl);
}

void start().catch(() => {
  if (!transitioning) blocked('Dein privater Zugang konnte noch nicht sicher geprüft werden. Bitte prüfe die Verbindung oder melde dich über Mein Konto an.');
});
